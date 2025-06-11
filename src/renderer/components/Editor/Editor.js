/**
 * Editor.js - A component for editing content, descriptions, and attributes.
 *
 * This component provides a structured interface for editing various parts of a creative project item,
 * such as a chapter, character, or lore entry. It separates main content, a summary/description,
 * and a flexible set of attributes (stored as JSON).
 *
 * It's designed to be integrated into the WriterStudio application and relies on a UIManager
 * instance for DOM element creation and manipulation, ensuring consistency with the app's UI framework.
 * The main content area is a textarea by default but can be enhanced to a rich text editor.
 */
class Editor {
    /**
     * Constructs an Editor instance.
     * @param {UIManager} uiManager - An instance of UIManager for DOM manipulation.
     * @param {object} [options={}] - Configuration options for the editor.
     * @param {string} [options.contentPlaceholder='Start writing your masterpiece...'] - Placeholder for the main content area.
     * @param {string} [options.descriptionPlaceholder='A brief summary or description...'] - Placeholder for the description area.
     * @param {string} [options.attributesPlaceholder='Enter attributes as JSON, e.g., {"genre": "Sci-Fi", "status": "Draft"}'] - Placeholder for the attributes area.
     */
    constructor(uiManager, options = {}) {
        if (!uiManager || typeof uiManager.createElement !== 'function') {
            throw new Error('Editor requires a valid UIManager instance with a createElement method.');
        }
        this.uiManager = uiManager;
        this.options = {
            contentPlaceholder: 'Start writing your masterpiece...',
            descriptionPlaceholder: 'A brief summary or description...',
            attributesPlaceholder: 'Enter attributes as JSON, e.g., {"key": "value", "setting": "futuristic"}',
            ...options
        };

        this.editorElement = null;
        this.contentArea = null;
        this.descriptionArea = null;
        this.attributesArea = null;

        this._buildEditorUI();
    }

    /**
     * Creates the DOM structure for the editor.
     * This method is called by the constructor.
     * @private
     */
    _buildEditorUI() {
        console.log('[Editor._buildEditorUI] Starting to build editor UI elements.');
        const createEl = (tag, opts, children) => this.uiManager.createElement(tag, opts, children);

        // Main Content Area
        this.contentArea = createEl('textarea', {
            id: 'editor-content-area',
            className: 'editor-textarea editor-content',
            placeholder: this.options.contentPlaceholder,
            rows: 15
        });
        console.log('[Editor._buildEditorUI] contentArea created:', this.contentArea);
        const contentLabel = createEl('label', { 
            textContent: 'Content:', 
            htmlFor: 'editor-content-area', 
            className: 'editor-label' 
        });
        const contentGroup = createEl('div', { className: 'editor-group editor-group-content' }, [contentLabel, this.contentArea]);
        console.log('[Editor._buildEditorUI] contentGroup created:', contentGroup);

        // Description/Summary Area
        this.descriptionArea = createEl('textarea', {
            id: 'editor-description-area',
            className: 'editor-textarea editor-description',
            placeholder: this.options.descriptionPlaceholder,
            rows: 5
        });
        console.log('[Editor._buildEditorUI] descriptionArea created:', this.descriptionArea);
        const descriptionLabel = createEl('label', { 
            textContent: 'Description/Summary:', 
            htmlFor: 'editor-description-area', 
            className: 'editor-label' 
        });
        const descriptionGroup = createEl('div', { className: 'editor-group editor-group-description' }, [descriptionLabel, this.descriptionArea]);
        console.log('[Editor._buildEditorUI] descriptionGroup created:', descriptionGroup);

        // Note: Attributes are now managed in the header via AttributesManager
        // this.attributesArea is still available for backward compatibility but not displayed

        this.saveButton = createEl('button', {
            textContent: 'Save Item',
            className: 'btn btn-primary editor-save-button',
            id: 'editor-save-button'
        });
        console.log('[Editor._buildEditorUI] saveButton created:', this.saveButton);

        this.editorElement = createEl('div', { 
            className: 'editor-component modern-editor'
        }, [
            contentGroup,
            descriptionGroup,
            this.saveButton
        ]);
        
        // Create a hidden attributes area for backward compatibility
        this.attributesArea = createEl('textarea', {
            id: 'editor-attributes-area',
            style: 'display: none;'
        });
        console.log('[Editor._buildEditorUI] this.editorElement fully constructed:', this.editorElement);
        console.log('[Editor._buildEditorUI] innerHTML of editorElement:', this.editorElement.innerHTML);
    }

    /**
     * Renders the editor into a given parent DOM element.
     * @param {HTMLElement} parentElement - The DOM element to append the editor to.
     */
    render(parentElement) {
        console.log('[Editor.render] Attempting to render. Parent:', parentElement, 'Editor element:', this.editorElement);
        if (!parentElement || typeof parentElement.appendChild !== 'function') {
            console.error('[Editor.render] Invalid parentElement provided.');
            return;
        }
        if (this.editorElement) {
            parentElement.appendChild(this.editorElement);
            console.log('[Editor.render] Editor element appended to parent.');
        } else {
            console.error('[Editor.render] Editor UI (this.editorElement) not built or null.');
        }
    }

    /**
     * Loads data into the editor fields.
     * @param {object} data - An object containing data for the editor.
     * @param {string} [data.content=''] - The main content.
     * @param {string} [data.description=''] - The description or summary.
     * @param {object} [data.attributes={}] - The attributes, as an object.
     */
    loadData({ content = '', description = '', attributes = {} } = {}) {
        if (!this.contentArea || !this.descriptionArea || !this.attributesArea) {
            console.warn('Editor fields not available. Ensure render() has been effectively called and UI is present.');
            return;
        }
        this.contentArea.value = content;
        this.descriptionArea.value = description;
        try {
            this.attributesArea.value = Object.keys(attributes).length > 0 ? JSON.stringify(attributes, null, 2) : '';
        } catch (e) {
            console.error("Editor.loadData: Error stringifying attributes:", e);
            this.attributesArea.value = ''; // Clear on error or if empty
        }
    }

    /**
     * Retrieves the current data from the editor fields.
     * @returns {object|null} An object with content, description, and attributes, or null if fields are not available.
     * Attributes are parsed from JSON; if parsing fails, attributes will be an empty object and an error logged.
     */
    getData() {
        if (!this.contentArea || !this.descriptionArea || !this.attributesArea) {
            console.warn('Editor.getData: Editor fields not available.');
            return null;
        }

        let parsedAttributes = {};
        const attributesValue = this.attributesArea.value.trim();
        if (attributesValue) {
            try {
                parsedAttributes = JSON.parse(attributesValue);
            } catch (error) {
                console.error('Editor.getData: Invalid JSON in attributes. Attributes will be empty.', error);
                // Optionally, notify the user via ToastManager or similar
                // For now, we allow saving other fields even if attributes are malformed,
                // but return empty attributes. A stricter approach might prevent saving.
            }
        }

        return {
            content: this.contentArea.value,
            description: this.descriptionArea.value,
            attributes: parsedAttributes,
        };
    }

    /**
     * Clears all fields in the editor.
     */
    clear() {
        this.loadData(); // Load with default empty values
    }

    /**
     * Removes the editor element from the DOM and performs any necessary cleanup.
     * Future enhancements: Detach rich text editor event listeners, etc.
     */
    destroy() {
        if (this.editorElement && this.editorElement.parentElement) {
            this.editorElement.parentElement.removeChild(this.editorElement);
        }
        this.editorElement = null;
        this.contentArea = null;
        this.descriptionArea = null;
        this.attributesArea = null;
        // Add any other cleanup specific to rich text editors or other integrations here.
    }
}

// Assuming ES6 module environment as per project structure
export default Editor;
