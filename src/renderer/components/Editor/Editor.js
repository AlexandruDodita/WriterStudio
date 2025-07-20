/**
 * Modern Rich Text Editor Component
 * A fully featured text editor with formatting capabilities
 * Designed to match the app's modern design system
 */

import { Toolbar } from './Toolbar.js';
import { updateWordCount } from './StatusBar.js';

class Editor {
    constructor(uiManager, options = {}) {
        if (!uiManager || typeof uiManager.createElement !== 'function') {
            throw new Error('Editor requires a valid UIManager instance with a createElement method.');
        }
        
        this.uiManager = uiManager;
        this.options = {
            contentPlaceholder: 'Type or paste your content here!',
            showToolbar: true,
            showStatusBar: true,
            ...options
        };

        this.editorElement = null;
        this.toolbarElement = null;
        this.contentArea = null;
        this.statusBar = null;
        this.toolbar = null;
        this.isDirty = false;

        this._buildEditorUI();
        this._setupEventListeners();
    }

    _buildEditorUI() {
        console.log('[Editor._buildEditorUI] Building modern rich text editor');
        
        const createEl = (tag, opts, children) => this.uiManager.createElement(tag, opts, children);

        // Main editor container
        this.editorElement = createEl('div', { 
            className: 'modern-rich-editor'
        });

        // Create toolbar if enabled
        if (this.options.showToolbar) {
            this._createToolbar();
        }

        // Create main content area
        this._createContentArea();

        // Create status bar if enabled
        if (this.options.showStatusBar) {
            this._createStatusBar();
        }

        // Assemble the editor
        if (this.toolbarElement) {
            this.editorElement.appendChild(this.toolbarElement);
        }
        this.editorElement.appendChild(this.contentArea);
        if (this.statusBar) {
            this.editorElement.appendChild(this.statusBar);
        }

        console.log('[Editor._buildEditorUI] Modern editor UI built successfully');
    }

    _createToolbar() {
        this.toolbar = new Toolbar(this.contentArea);
        this.toolbarElement = this.toolbar.render();
    }

    _createContentArea() {
        const createEl = (tag, opts, children) => this.uiManager.createElement(tag, opts, children);

        // Create the main editing container
        const editorContainer = createEl('div', {
            className: 'editor-container'
        });

        // Create the rich text content area
        this.contentArea = createEl('div', {
            id: 'editor-content',
            className: 'editor-content rich-text-area',
            contentEditable: 'true',
            spellcheck: 'true',
            role: 'textbox',
            'aria-label': 'Rich text editor',
            'data-placeholder': this.options.contentPlaceholder
        });

        // Set initial content
        this.contentArea.innerHTML = '<p><br></p>';

        editorContainer.appendChild(this.contentArea);
    }

    _createStatusBar() {
        const createEl = (tag, opts, children) => this.uiManager.createElement(tag, opts, children);

        this.statusBar = createEl('div', {
            className: 'editor-status-bar'
        });

        const wordCountEl = createEl('span', {
            className: 'word-count',
            textContent: 'Words: 0'
        });

        const charCountEl = createEl('span', {
            className: 'char-count',
            textContent: 'Characters: 0'
        });

        this.statusBar.appendChild(wordCountEl);
        this.statusBar.appendChild(charCountEl);
    }

    _setupEventListeners() {
        if (!this.contentArea) return;

        // Input event for content changes
        this.contentArea.addEventListener('input', () => {
            this._markDirty();
            this._updateStatusBar();
            if (this.toolbar) {
                this.toolbar.updateState();
            }
        });

        // Selection change for toolbar updates
        this.contentArea.addEventListener('keyup', () => {
            if (this.toolbar) {
                this.toolbar.updateState();
            }
        });

        this.contentArea.addEventListener('mouseup', () => {
            if (this.toolbar) {
                this.toolbar.updateState();
            }
        });

        // Keyboard shortcuts
        this.contentArea.addEventListener('keydown', (e) => {
            this._handleKeyboardShortcuts(e);
        });

        // Paste handling
        this.contentArea.addEventListener('paste', (e) => {
            this._handlePaste(e);
        });

        // Focus/blur handling
        this.contentArea.addEventListener('focus', () => {
            this.editorElement.classList.add('focused');
        });

        this.contentArea.addEventListener('blur', () => {
            this.editorElement.classList.remove('focused');
        });

        // Placeholder handling
        this.contentArea.addEventListener('input', () => {
            this._updatePlaceholder();
        });

        this.contentArea.addEventListener('focus', () => {
            this._updatePlaceholder();
        });

        this.contentArea.addEventListener('blur', () => {
            this._updatePlaceholder();
        });
    }

    _handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    document.execCommand('bold', false, null);
                    break;
                case 'i':
                    e.preventDefault();
                    document.execCommand('italic', false, null);
                    break;
                case 'u':
                    e.preventDefault();
                    document.execCommand('underline', false, null);
                    break;
                case 's':
                    e.preventDefault();
                    this._save();
                    break;
            }
        }
    }

    _handlePaste(e) {
        e.preventDefault();
        
        // Get plain text and clean it
        const text = (e.clipboardData || window.clipboardData).getData('text');
        const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Insert as paragraphs
        const lines = cleanText.split('\n');
        const html = lines.map(line => 
            line.trim() ? `<p>${this._escapeHtml(line)}</p>` : '<p><br></p>'
        ).join('');
        
        document.execCommand('insertHTML', false, html);
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    _updatePlaceholder() {
        const isEmpty = this.contentArea.textContent.trim() === '';
        this.contentArea.classList.toggle('empty', isEmpty);
    }

    _updateStatusBar() {
        if (!this.statusBar) return;

        const text = this.contentArea.textContent || '';
        const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        const charCount = text.length;

        const wordCountEl = this.statusBar.querySelector('.word-count');
        const charCountEl = this.statusBar.querySelector('.char-count');

        if (wordCountEl) wordCountEl.textContent = `Words: ${wordCount}`;
        if (charCountEl) charCountEl.textContent = `Characters: ${charCount}`;

        // Also update any global word count displays
        if (typeof updateWordCount === 'function') {
            updateWordCount();
        }
    }

    _markDirty() {
        if (!this.isDirty) {
            this.isDirty = true;
            this.editorElement.classList.add('dirty');
            
            // Trigger global dirty state if available
            if (typeof setIsDirty === 'function') {
                setIsDirty(true);
            }
        }
    }

    _save() {
        // Override this method or provide a save callback
        console.log('Save triggered');
        if (this.options.onSave) {
            this.options.onSave(this.getContent());
        }
    }

    /**
     * Renders the editor into a given parent DOM element
     */
    render(parentElement) {
        console.log('[Editor.render] Rendering modern editor');
        if (!parentElement || typeof parentElement.appendChild !== 'function') {
            console.error('[Editor.render] Invalid parentElement provided');
            return;
        }
        
        if (this.editorElement) {
            parentElement.appendChild(this.editorElement);
            
            // Focus the editor after a short delay
            setTimeout(() => {
                if (this.contentArea) {
                    this.contentArea.focus();
                    this._updatePlaceholder();
                    this._updateStatusBar();
                }
            }, 100);
            
            console.log('[Editor.render] Modern editor rendered successfully');
        } else {
            console.error('[Editor.render] Editor element not built');
        }
    }

    /**
     * Get the current content as HTML
     */
    getContent() {
        if (!this.contentArea) return '';
        return this.contentArea.innerHTML;
    }

    /**
     * Get the current content as plain text
     */
    getText() {
        if (!this.contentArea) return '';
        return this.contentArea.textContent || '';
    }

    /**
     * Set the editor content
     */
    setContent(content) {
        if (!this.contentArea) return;
        
        if (typeof content === 'string') {
            // If it's plain text, wrap in paragraphs
            if (!content.includes('<')) {
                const lines = content.split('\n');
                content = lines.map(line => 
                    line.trim() ? `<p>${this._escapeHtml(line)}</p>` : '<p><br></p>'
                ).join('');
            }
            this.contentArea.innerHTML = content || '<p><br></p>';
        }
        
        this._updatePlaceholder();
        this._updateStatusBar();
        this.isDirty = false;
        this.editorElement.classList.remove('dirty');
    }

    /**
     * Load data into the editor (backward compatibility)
     */
    loadData({ content = '', description = '', attributes = {} } = {}) {
        this.setContent(content);
        
        // Store other data for potential use
        this._metadata = { description, attributes };
    }

    /**
     * Get current data (backward compatibility)
     */
    getData() {
        return {
            content: this.getText(), // Return plain text for compatibility
            description: this._metadata?.description || '',
            attributes: this._metadata?.attributes || {}
        };
    }

    /**
     * Clear the editor content
     */
    clear() {
        this.setContent('');
    }

    /**
     * Focus the editor
     */
    focus() {
        if (this.contentArea) {
            this.contentArea.focus();
        }
    }

    /**
     * Check if editor has unsaved changes
     */
    isDirtyState() {
        return this.isDirty;
    }

    /**
     * Mark editor as clean (saved)
     */
    markClean() {
        this.isDirty = false;
        this.editorElement.classList.remove('dirty');
    }

    /**
     * Destroy the editor and clean up
     */
    destroy() {
        if (this.editorElement && this.editorElement.parentElement) {
            this.editorElement.parentElement.removeChild(this.editorElement);
        }
        
        this.editorElement = null;
        this.contentArea = null;
        this.toolbarElement = null;
        this.statusBar = null;
        this.toolbar = null;
        this._metadata = null;
    }
}

export default Editor;
