/**
 * AttributesManager.js - Manages attributes for different content types (chapters, characters, notes, lore)
 * 
 * This class provides functionality to:
 * - Load and save attribute templates for different content types
 * - Create dropdown interfaces for attribute selection and management
 * - Handle file storage in the project folder
 * - Merge existing attributes with new ones
 */
class AttributesManager {
    constructor(electronAPI, toastManager) {
        this.electronAPI = electronAPI;
        this.toastManager = toastManager;
        this.currentProject = null;
        this.attributeCache = new Map(); // Cache for loaded attributes
        
        // Default attribute templates for different content types
        this.defaultTemplates = {
            chapters: {
                'Setting': ['Home', 'Work', 'Journey', 'Battle', 'Other'],
                'Mood': ['Happy', 'Sad', 'Tense', 'Peaceful', 'Dramatic'],
                'POV Character': ['Main Character', 'Secondary Character', 'Narrator'],
                'Chapter Type': ['Action', 'Dialogue', 'Description', 'Transition']
            },
            characters: {
                'Age': ['Child', 'Teenager', 'Young Adult', 'Adult', 'Elder'],
                'Role': ['Protagonist', 'Antagonist', 'Supporting', 'Minor'],
                'Personality': ['Brave', 'Shy', 'Aggressive', 'Kind', 'Mysterious'],
                'Status': ['Alive', 'Dead', 'Missing', 'Unknown'],
                'Character Color': ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
                'Pinned Attributes': ['age', 'gender', 'role', 'occupation']
            },
            notes: {
                'Category': ['Research', 'Ideas', 'Plot', 'Reminders'],
                'Priority': ['High', 'Medium', 'Low'],
                'Status': ['Todo', 'In Progress', 'Done']
            },
            lore: {
                'Type': ['Location', 'History', 'Culture', 'Magic System', 'Technology'],
                'Importance': ['Critical', 'Important', 'Minor', 'Background'],
                'Status': ['Complete', 'Draft', 'Needs Research']
            }
        };
    }

    /**
     * Initialize the attributes manager with a project path
     */
    async initialize(projectPath) {
        this.currentProject = projectPath;
        await this.ensureAttributeFiles();
    }

    /**
     * Ensure that attribute files exist for all content types
     */
    async ensureAttributeFiles() {
        if (!this.currentProject) return;

        for (const contentType of Object.keys(this.defaultTemplates)) {
            try {
                const attributePath = `${this.currentProject}/.writerstudio/attributes/${contentType}_attributes.json`;
                
                // For now, we'll just try to read the file and create if it fails
                try {
                    await this.electronAPI.readFile(attributePath);
                } catch (readError) {
                    // File doesn't exist, create it with defaults
                    await this.electronAPI.saveFile(
                        JSON.stringify(this.defaultTemplates[contentType], null, 2),
                        attributePath
                    );
                }
            } catch (error) {
                console.error(`Error ensuring attribute file for ${contentType}:`, error);
            }
        }
    }

    /**
     * Load attributes for a specific content type
     */
    async loadAttributes(contentType) {
        if (!this.electronAPI) {
            console.warn('electronAPI not available, using default attributes');
            return this.defaultTemplates[contentType] || {};
        }

        if (!this.currentProject) {
            console.warn('No current project set, using default attributes');
            return this.defaultTemplates[contentType] || {};
        }

        const cacheKey = `${this.currentProject}_${contentType}`;
        if (this.attributeCache.has(cacheKey)) {
            return this.attributeCache.get(cacheKey);
        }

        try {
            const attributePath = `${this.currentProject}/.writerstudio/attributes/${contentType}_attributes.json`;
            const content = await this.electronAPI.invoke('file:read', attributePath);
            const attributes = JSON.parse(content);
            
            // Cache the loaded attributes
            this.attributeCache.set(cacheKey, attributes);
            return attributes;
        } catch (error) {
            console.error(`Error loading attributes for ${contentType}:`, error);
            return this.defaultTemplates[contentType] || {};
        }
    }

    /**
     * Save attributes for a specific content type
     */
    async saveAttributes(contentType, attributes) {
        if (!this.electronAPI) {
            console.warn('electronAPI not available, cannot save attributes');
            return false;
        }

        if (!this.currentProject) return false;

        try {
            const attributePath = `${this.currentProject}/.writerstudio/attributes/${contentType}_attributes.json`;
            await this.electronAPI.invoke('file:write', attributePath, JSON.stringify(attributes, null, 2));
            
            // Update cache
            const cacheKey = `${this.currentProject}_${contentType}`;
            this.attributeCache.set(cacheKey, attributes);
            
            return true;
        } catch (error) {
            console.error(`Error saving attributes for ${contentType}:`, error);
            this.toastManager?.error(`Failed to save attributes for ${contentType}`);
            return false;
        }
    }

    /**
     * Add a new attribute key-value pair to a content type
     */
    async addAttribute(contentType, key, value) {
        const attributes = await this.loadAttributes(contentType);
        
        if (!attributes[key]) {
            attributes[key] = [];
        }
        
        if (!attributes[key].includes(value)) {
            attributes[key].push(value);
            await this.saveAttributes(contentType, attributes);
            return true;
        }
        
        return false; // Value already exists
    }

    /**
     * Create a dropdown interface for managing attributes
     */
    createAttributeDropdown(contentType, currentAttributes = {}, onChange = null) {
        const dropdown = document.createElement('div');
        dropdown.className = 'attributes-dropdown';
        
        dropdown.innerHTML = `
            <div class="attributes-header">
                <label class="attributes-label">Attributes</label>
                <button class="attributes-toggle btn btn-secondary" type="button">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
                    </svg>
                    Manage Attributes
                </button>
            </div>
            <div class="attributes-content" style="display: none;">
                <div class="current-attributes"></div>
                <div class="attribute-controls">
                    <div class="add-attribute-form">
                        <select class="attribute-key-select">
                            <option value="">Select attribute...</option>
                        </select>
                        <select class="attribute-value-select">
                            <option value="">Select value...</option>
                        </select>
                        <button class="add-attribute-btn btn btn-primary" type="button">Add</button>
                    </div>
                    <div class="new-attribute-form" style="display: none;">
                        <input type="text" class="new-key-input" placeholder="New attribute name...">
                        <input type="text" class="new-value-input" placeholder="New value...">
                        <button class="save-new-attribute-btn btn btn-primary" type="button">Save</button>
                        <button class="cancel-new-attribute-btn btn btn-secondary" type="button">Cancel</button>
                    </div>
                    <button class="add-new-attribute-btn btn btn-ghost" type="button">+ Add New Attribute Type</button>
                </div>
            </div>
        `;

        this.setupDropdownEvents(dropdown, contentType, currentAttributes, onChange);
        return dropdown;
    }

    /**
     * Setup event handlers for the attribute dropdown
     */
    async setupDropdownEvents(dropdown, contentType, currentAttributes, onChange) {
        const toggle = dropdown.querySelector('.attributes-toggle');
        const content = dropdown.querySelector('.attributes-content');
        const keySelect = dropdown.querySelector('.attribute-key-select');
        const valueSelect = dropdown.querySelector('.attribute-value-select');
        const addBtn = dropdown.querySelector('.add-attribute-btn');
        const newForm = dropdown.querySelector('.new-attribute-form');
        const addNewBtn = dropdown.querySelector('.add-new-attribute-btn');
        const saveNewBtn = dropdown.querySelector('.save-new-attribute-btn');
        const cancelNewBtn = dropdown.querySelector('.cancel-new-attribute-btn');

        // Load available attributes
        const availableAttributes = await this.loadAttributes(contentType);
        
        // Populate key select
        Object.keys(availableAttributes).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            keySelect.appendChild(option);
        });

        // Toggle dropdown
        toggle.addEventListener('click', () => {
            const isVisible = content.style.display !== 'none';
            content.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                this.refreshCurrentAttributes(dropdown, currentAttributes, onChange);
            }
        });

        // Handle key selection
        keySelect.addEventListener('change', () => {
            const selectedKey = keySelect.value;
            valueSelect.innerHTML = '<option value="">Select value...</option>';
            
            if (selectedKey === 'Character Color') {
                // Special handling for color picker
                valueSelect.style.display = 'none';
                
                // Create color picker if it doesn't exist
                let colorPicker = dropdown.querySelector('.color-picker-input');
                if (!colorPicker) {
                    colorPicker = document.createElement('input');
                    colorPicker.type = 'color';
                    colorPicker.className = 'color-picker-input';
                    colorPicker.value = '#FF6B6B';
                    valueSelect.parentNode.insertBefore(colorPicker, valueSelect.nextSibling);
                } else {
                    colorPicker.style.display = 'inline-block';
                }
            } else {
                // Hide color picker if it exists
                const colorPicker = dropdown.querySelector('.color-picker-input');
                if (colorPicker) {
                    colorPicker.style.display = 'none';
                }
                
                valueSelect.style.display = 'inline-block';
                
                if (selectedKey && availableAttributes[selectedKey]) {
                    availableAttributes[selectedKey].forEach(value => {
                        const option = document.createElement('option');
                        option.value = value;
                        option.textContent = value;
                        valueSelect.appendChild(option);
                    });
                }
            }
        });

        // Add attribute
        addBtn.addEventListener('click', () => {
            const key = keySelect.value;
            let value = valueSelect.value;
            
            // Special handling for color picker
            if (key === 'Character Color') {
                const colorPicker = dropdown.querySelector('.color-picker-input');
                if (colorPicker) {
                    value = colorPicker.value;
                }
            }
            
            if (key && value) {
                currentAttributes[key] = value;
                this.refreshCurrentAttributes(dropdown, currentAttributes, onChange);
                keySelect.value = '';
                valueSelect.innerHTML = '<option value="">Select value...</option>';
                
                // Hide color picker if visible
                const colorPicker = dropdown.querySelector('.color-picker-input');
                if (colorPicker) {
                    colorPicker.style.display = 'none';
                }
                valueSelect.style.display = 'inline-block';
                
                if (onChange) onChange(currentAttributes);
            }
        });

        // Show new attribute form
        addNewBtn.addEventListener('click', () => {
            newForm.style.display = 'block';
            addNewBtn.style.display = 'none';
        });

        // Save new attribute
        saveNewBtn.addEventListener('click', async () => {
            const newKey = dropdown.querySelector('.new-key-input').value.trim();
            const newValue = dropdown.querySelector('.new-value-input').value.trim();
            
            if (newKey && newValue) {
                const success = await this.addAttribute(contentType, newKey, newValue);
                if (success) {
                    // Add to current attributes
                    currentAttributes[newKey] = newValue;
                    
                    // Refresh UI
                    const option = document.createElement('option');
                    option.value = newKey;
                    option.textContent = newKey;
                    keySelect.appendChild(option);
                    
                    this.refreshCurrentAttributes(dropdown, currentAttributes, onChange);
                    
                    // Reset form
                    dropdown.querySelector('.new-key-input').value = '';
                    dropdown.querySelector('.new-value-input').value = '';
                    newForm.style.display = 'none';
                    addNewBtn.style.display = 'block';
                    
                    if (onChange) onChange(currentAttributes);
                    this.toastManager?.success(`Added new attribute: ${newKey}`);
                }
            }
        });

        // Cancel new attribute
        cancelNewBtn.addEventListener('click', () => {
            dropdown.querySelector('.new-key-input').value = '';
            dropdown.querySelector('.new-value-input').value = '';
            newForm.style.display = 'none';
            addNewBtn.style.display = 'block';
        });

        // Initial load of current attributes
        this.refreshCurrentAttributes(dropdown, currentAttributes, onChange);
    }

    /**
     * Refresh the display of current attributes
     */
    refreshCurrentAttributes(dropdown, currentAttributes, onChange) {
        const container = dropdown.querySelector('.current-attributes');
        container.innerHTML = '';

        Object.entries(currentAttributes).forEach(([key, value]) => {
            const attributeTag = document.createElement('div');
            attributeTag.className = 'attribute-tag';
            
            // Special display for Character Color
            if (key === 'Character Color') {
                attributeTag.innerHTML = `
                    <span class="attribute-key">${key}:</span>
                    <span class="attribute-value">
                        <span class="color-swatch" style="background-color: ${value}"></span>
                        ${value}
                    </span>
                    <button class="remove-attribute-btn" data-key="${key}" type="button">×</button>
                `;
            } else {
                attributeTag.innerHTML = `
                    <span class="attribute-key">${key}:</span>
                    <span class="attribute-value">${value}</span>
                    <button class="remove-attribute-btn" data-key="${key}" type="button">×</button>
                `;
            }

            // Remove attribute handler
            attributeTag.querySelector('.remove-attribute-btn').addEventListener('click', () => {
                delete currentAttributes[key];
                this.refreshCurrentAttributes(dropdown, currentAttributes, onChange);
                if (onChange) onChange(currentAttributes);
            });

            container.appendChild(attributeTag);
        });

        if (Object.keys(currentAttributes).length === 0) {
            container.innerHTML = '<p class="no-attributes">No attributes set</p>';
        }
    }
}

export default AttributesManager; 