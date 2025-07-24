/**
 * CharacterPreview - Shows character information on hover
 */
export class CharacterPreview {
    constructor(electronAPI, settingsManager) {
        this.electronAPI = electronAPI;
        this.settingsManager = settingsManager;
        this.previewElement = null;
        this.hoverTimeout = null;
        this.currentCharacter = null;
        this.characterCache = new Map();
        
        this.createPreviewElement();
        this.setupGlobalListeners();
    }

    /**
     * Create the preview element
     */
    createPreviewElement() {
        this.previewElement = document.createElement('div');
        this.previewElement.className = 'character-preview-popup';
        this.previewElement.style.display = 'none';
        document.body.appendChild(this.previewElement);
    }

    /**
     * Setup global listeners for character name detection
     */
    setupGlobalListeners() {
        // Use event delegation on the document
        document.addEventListener('mouseover', (e) => {
            const target = e.target;
            
            // Check if hovering over a character name
            if (target.classList.contains('character-name-highlight') ||
                target.dataset.characterName) {
                this.handleCharacterHover(target, e);
            }
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target;
            
            if (target.classList.contains('character-name-highlight') ||
                target.dataset.characterName) {
                this.hidePreview();
            }
        });

        // Hide on scroll
        document.addEventListener('scroll', () => {
            this.hidePreview();
        }, true);
    }

    /**
     * Handle character name hover
     */
    handleCharacterHover(element, event) {
        const settings = this.settingsManager.settings.characterHoverPreview;
        
        if (!settings.enabled) return;

        const characterName = element.dataset.characterName || element.textContent;
        
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }

        this.hoverTimeout = setTimeout(() => {
            this.showPreview(characterName, element, event);
        }, settings.previewDelay);
    }

    /**
     * Show character preview
     */
    async showPreview(characterName, element, event) {
        try {
            // Get character data
            const characterData = await this.getCharacterData(characterName);
            
            if (!characterData) {
                console.log('No character data found for:', characterName);
                return;
            }

            const settings = this.settingsManager.settings.characterHoverPreview;
            
            // Build preview content
            let content = '<div class="preview-content">';
            
            if (settings.showImage && characterData.image) {
                content += `<img class="preview-image" src="${characterData.image}" alt="${characterName}">`;
            }
            
            content += `<div class="preview-info">`;
            content += `<h4 class="preview-name">${characterName}</h4>`;
            
            if (settings.showDescription && characterData.description) {
                content += `<p class="preview-description">${this.truncateText(characterData.description, 150)}</p>`;
            }
            
            // Add quick stats if available
            if (characterData.attributes) {
                content += '<div class="preview-attributes">';
                
                // Check for pinned attributes
                const pinnedAttrs = characterData.attributes['Pinned Attributes'];
                let attrsToShow = ['age', 'role', 'gender']; // defaults
                
                if (pinnedAttrs) {
                    // Parse pinned attributes if it's a string
                    if (typeof pinnedAttrs === 'string') {
                        attrsToShow = pinnedAttrs.split(',').map(a => a.trim());
                    } else if (Array.isArray(pinnedAttrs)) {
                        attrsToShow = pinnedAttrs;
                    }
                }
                
                attrsToShow.forEach(attr => {
                    if (characterData.attributes[attr] || characterData.attributes[attr.charAt(0).toUpperCase() + attr.slice(1)]) {
                        const value = characterData.attributes[attr] || characterData.attributes[attr.charAt(0).toUpperCase() + attr.slice(1)];
                        content += `<span class="preview-attr"><strong>${attr}:</strong> ${value}</span>`;
                    }
                });
                
                content += '</div>';
            }
            
            content += '</div></div>';
            
            // Add search functionality
            content += `
                <div class="preview-actions">
                    <input type="text" class="preview-search" placeholder="Search character data...">
                    <div class="preview-search-results"></div>
                </div>
            `;
            
            this.previewElement.innerHTML = content;
            
            // Position the preview
            this.positionPreview(element, event);
            
            // Show the preview
            this.previewElement.style.display = 'block';
            this.currentCharacter = characterName;
            
            // Setup search functionality
            this.setupPreviewSearch(characterData);
            
        } catch (error) {
            console.error('Error showing character preview:', error);
        }
    }

    /**
     * Position the preview element
     */
    positionPreview(element, event) {
        const rect = element.getBoundingClientRect();
        const previewWidth = 300;
        const previewHeight = 200; // Approximate
        
        let left = rect.left;
        let top = rect.bottom + 5;
        
        // Check if preview would go off screen
        if (left + previewWidth > window.innerWidth) {
            left = window.innerWidth - previewWidth - 10;
        }
        
        if (top + previewHeight > window.innerHeight) {
            top = rect.top - previewHeight - 5;
        }
        
        this.previewElement.style.left = `${left}px`;
        this.previewElement.style.top = `${top}px`;
    }

    /**
     * Hide the preview
     */
    hidePreview() {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
        
        this.previewElement.style.display = 'none';
        this.currentCharacter = null;
    }

    /**
     * Get character data
     */
    async getCharacterData(characterName) {
        // Check cache first
        if (this.characterCache.has(characterName)) {
            return this.characterCache.get(characterName);
        }

        try {
            // Get current project path
            const projectPath = window.writerStudio?.currentProject?.path;
            if (!projectPath) return null;

            // Fetch character data from main process
            const data = await this.electronAPI.getItemDetails(projectPath, 'characters', characterName);
            
            if (data) {
                // Process image path if exists
                if (data.images && data.images.length > 0) {
                    data.image = data.images[0]; // Use first image
                }
                
                // Cache the data
                this.characterCache.set(characterName, data);
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching character data:', error);
            return null;
        }
    }

    /**
     * Setup search within preview
     */
    setupPreviewSearch(characterData) {
        const searchInput = this.previewElement.querySelector('.preview-search');
        const resultsDiv = this.previewElement.querySelector('.preview-search-results');
        
        if (!searchInput || !resultsDiv) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            if (query.length < 2) {
                resultsDiv.innerHTML = '';
                return;
            }

            // Search through all character data
            const results = this.searchCharacterData(characterData, query);
            
            if (results.length > 0) {
                resultsDiv.innerHTML = results.map(result => `
                    <div class="search-result">
                        <strong>${result.field}:</strong> ${result.value}
                    </div>
                `).join('');
            } else {
                resultsDiv.innerHTML = '<div class="no-results">No results found</div>';
            }
        });
    }

    /**
     * Search through character data
     */
    searchCharacterData(data, query) {
        const results = [];
        
        // Search in content
        if (data.content && data.content.toLowerCase().includes(query)) {
            const index = data.content.toLowerCase().indexOf(query);
            const snippet = this.getSnippet(data.content, index, 50);
            results.push({ field: 'Content', value: snippet });
        }
        
        // Search in description
        if (data.description && data.description.toLowerCase().includes(query)) {
            const index = data.description.toLowerCase().indexOf(query);
            const snippet = this.getSnippet(data.description, index, 50);
            results.push({ field: 'Description', value: snippet });
        }
        
        // Search in attributes
        if (data.attributes) {
            Object.entries(data.attributes).forEach(([key, value]) => {
                if (value && value.toString().toLowerCase().includes(query)) {
                    results.push({ field: key, value: value });
                }
            });
        }
        
        return results.slice(0, 5); // Limit to 5 results
    }

    /**
     * Get a text snippet around a position
     */
    getSnippet(text, position, length) {
        const start = Math.max(0, position - length);
        const end = Math.min(text.length, position + length);
        let snippet = text.substring(start, end);
        
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';
        
        return snippet;
    }

    /**
     * Truncate text to a certain length
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Clear character cache
     */
    clearCache() {
        this.characterCache.clear();
    }

    /**
     * Get project characters
     */
    async getProjectCharacters() {
        try {
            const projectPath = window.writerStudio?.currentProject?.path;
            if (!projectPath) return [];

            const charactersData = await this.electronAPI.getCharacters(projectPath);
            return charactersData || [];
        } catch (error) {
            console.error('Error fetching project characters:', error);
            return [];
        }
    }
    
    /**
     * Update character color in editor
     */
    async applyCharacterColors(editorContent) {
        if (!this.settingsManager.settings.characterColorGrading.enabled) return;

        // Get all character names and their colors
        const characters = await this.getProjectCharacters();
        
        characters.forEach(character => {
            const characterName = character.name || character;
            
            // First check for color in character's attributes
            let color = null;
            if (character.attributes && character.attributes['Character Color']) {
                color = character.attributes['Character Color'];
            } else {
                // Fall back to settings manager color
                color = this.settingsManager.getCharacterColor(characterName) ||
                       this.settingsManager.autoAssignColor(characterName);
            }
            
            if (color) {
                // Find and highlight character names in the editor
                const regex = new RegExp(`\\b${characterName}\\b`, 'gi');
                editorContent.innerHTML = editorContent.innerHTML.replace(regex, 
                    `<span class="character-name-highlight" style="color: ${color}; font-weight: 600;" data-character-name="${characterName}">$&</span>`
                );
            }
        });
    }
}