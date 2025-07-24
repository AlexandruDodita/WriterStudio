/**
 * Toolbar Component for Rich Text Editor
 * Provides formatting controls and matches the app's modern design
 */

export class Toolbar {
    constructor(editor) {
        this.editor = editor;
        this.element = null;
        this._createToolbar();
    }

    _createToolbar() {
        this.element = document.createElement('div');
        this.element.className = 'editor-toolbar';
        
        // Create toolbar sections
        const formatSection = this._createSection([
            { command: 'bold', icon: this._getBoldIcon(), title: 'Bold (Ctrl+B)' },
            { command: 'italic', icon: this._getItalicIcon(), title: 'Italic (Ctrl+I)' },
            { command: 'underline', icon: this._getUnderlineIcon(), title: 'Underline (Ctrl+U)' },
            { command: 'strikeThrough', icon: this._getStrikethroughIcon(), title: 'Strikethrough' }
        ]);

        const alignSection = this._createSection([
            { command: 'justifyLeft', icon: this._getAlignLeftIcon(), title: 'Align Left' },
            { command: 'justifyCenter', icon: this._getAlignCenterIcon(), title: 'Align Center' },
            { command: 'justifyRight', icon: this._getAlignRightIcon(), title: 'Align Right' },
            { command: 'justifyFull', icon: this._getJustifyIcon(), title: 'Justify' }
        ]);

        const listSection = this._createSection([
            { command: 'insertUnorderedList', icon: this._getBulletListIcon(), title: 'Bullet List' },
            { command: 'insertOrderedList', icon: this._getNumberListIcon(), title: 'Numbered List' },
            { command: 'outdent', icon: this._getOutdentIcon(), title: 'Decrease Indent' },
            { command: 'indent', icon: this._getIndentIcon(), title: 'Increase Indent' }
        ]);

        const formatDropdown = this._createFormatDropdown();
        const fontSizeDropdown = this._createFontSizeDropdown();

        this.element.appendChild(formatDropdown);
        this.element.appendChild(fontSizeDropdown);
        this.element.appendChild(formatSection);
        this.element.appendChild(alignSection);
        this.element.appendChild(listSection);
    }

    _createSection(buttons) {
        const section = document.createElement('div');
        section.className = 'toolbar-section';

        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'toolbar-btn';
            btn.title = button.title;
            btn.innerHTML = button.icon;
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this._executeCommand(button.command);
            });

            section.appendChild(btn);
        });

        return section;
    }

    _createFormatDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'toolbar-dropdown';

        const select = document.createElement('select');
        select.className = 'format-select';
        
        const formats = [
            { value: 'p', label: 'Paragraph' },
            { value: 'h1', label: 'Heading 1' },
            { value: 'h2', label: 'Heading 2' },
            { value: 'h3', label: 'Heading 3' },
            { value: 'h4', label: 'Heading 4' },
            { value: 'h5', label: 'Heading 5' },
            { value: 'h6', label: 'Heading 6' }
        ];

        formats.forEach(format => {
            const option = document.createElement('option');
            option.value = format.value;
            option.textContent = format.label;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            this._executeCommand('formatBlock', e.target.value);
        });

        dropdown.appendChild(select);
        return dropdown;
    }

    _createFontSizeDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'toolbar-dropdown';

        const select = document.createElement('select');
        select.className = 'font-size-select';
        
        const sizes = ['1', '2', '3', '4', '5', '6', '7'];
        const labels = ['Very Small', 'Small', 'Normal', 'Medium', 'Large', 'Very Large', 'Huge'];

        sizes.forEach((size, index) => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = labels[index];
            if (size === '3') option.selected = true; // Default to normal size
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            this._executeCommand('fontSize', e.target.value);
        });

        dropdown.appendChild(select);
        return dropdown;
    }

    _executeCommand(command, value = null) {
        if (this.editor && this.editor.focus) {
            this.editor.focus();
        }
        document.execCommand(command, false, value);
        this._updateButtonStates();
    }

    _updateButtonStates() {
        // Update button states based on current selection
        const buttons = this.element.querySelectorAll('.toolbar-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
        });

        // Check for active formatting
        const commands = ['bold', 'italic', 'underline', 'strikeThrough'];
        commands.forEach(command => {
            if (document.queryCommandState(command)) {
                const btn = this.element.querySelector(`[title*="${command}"]`);
                if (btn) btn.classList.add('active');
            }
        });
    }

    // Icon methods (using SVG)
    _getBoldIcon() {
        return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.6,10.79C16.57,10.11 17.25,9.02 17.25,8C17.25,5.74 15.5,4 13.25,4H7V18H14.04C16.14,18 17.75,16.3 17.75,14.21C17.75,12.69 16.89,11.39 15.6,10.79M10,7H13.25C13.89,7 14.25,7.36 14.25,8C14.25,8.64 13.89,9 13.25,9H10V7M14.04,15H10V12H14.04C14.68,12 15.04,12.36 15.04,13C15.04,13.64 14.68,14 14.04,14V15Z"/></svg>';
    }

    _getItalicIcon() {
        return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10,4V7H12.21L8.79,15H6V18H14V15H11.79L15.21,7H18V4H10Z"/></svg>';
    }

    _getUnderlineIcon() {
        return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5,21H19V19H5V21M12,17A6,6 0 0,0 18,11V3H15.5V11A3.5,3.5 0 0,1 12,14.5A3.5,3.5 0 0,1 8.5,11V3H6V11A6,6 0 0,0 12,17Z"/></svg>';
    }

    _getStrikethroughIcon() {
        return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.2 9.8C7.2 8.3 8.4 7.1 9.9 7.1S12.6 8.3 12.6 9.8H14.1C14.1 7.5 12.4 5.8 10.1 5.8S6.1 7.5 6.1 9.8C6.1 10.5 6.3 11.1 6.7 11.6H3V13H21V11.6H17.3C17.7 11.1 17.9 10.5 17.9 9.8C17.9 7.5 16.2 5.8 13.9 5.8S9.9 7.5 9.9 9.8H11.4Z"/></svg>';
    }

    _getAlignLeftIcon() {
        return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V5H3V3M3,7H15V9H3V7M3,11H21V13H3V11M3,15H15V17H3V15M3,19H21V21H3V19Z"/></svg>';
    }

    _getAlignCenterIcon() {
        return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V5H3V3M7,7H17V9H7V7M3,11H21V13H3V11M7,15H17V17H7V15M3,19H21V21H3V19Z"/></svg>';
    }

    _getAlignRightIcon() {
        return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V5H3V3M9,7H21V9H9V7M3,11H21V13H3V11M9,15H21V17H9V15M3,19H21V21H3V19Z"/></svg>';
    }

    _getJustifyIcon() {
        return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V5H3V3M3,7H21V9H3V7M3,11H21V13H3V11M3,15H21V17H3V15M3,19H21V21H3V19Z"/></svg>';
    }

    _getBulletListIcon() {
        return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7,5H21V7H7V5M7,13V11H21V13H7M4,4.5A1.5,1.5 0 0,1 5.5,6A1.5,1.5 0 0,1 4,7.5A1.5,1.5 0 0,1 2.5,6A1.5,1.5 0 0,1 4,4.5M4,10.5A1.5,1.5 0 0,1 5.5,12A1.5,1.5 0 0,1 4,13.5A1.5,1.5 0 0,1 2.5,12A1.5,1.5 0 0,1 4,10.5M7,19V17H21V19H7M4,16.5A1.5,1.5 0 0,1 5.5,18A1.5,1.5 0 0,1 4,19.5A1.5,1.5 0 0,1 2.5,18A1.5,1.5 0 0,1 4,16.5Z"/></svg>';
    }

    _getNumberListIcon() {
        return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7,13V11H21V13H7M7,19V17H21V19H7M7,7V5H21V7H7M3,8V5H2V4H4V8H3M2,17V16H5V20H2V19H4V18.5H3V17.5H4V17H2M4.25,10A0.75,0.75 0 0,1 5,10.75C5,10.95 4.92,11.14 4.79,11.27L3.12,13H5V14H2V13.08L4,11H2V10H4.25Z"/></svg>';
    }

    _getIndentIcon() {
        return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11,13H21V11H11M11,9H21V7H11M11,17H21V15H11M11,21H21V19H11M3,12L7,16V13H9V11H7V8L3,12Z"/></svg>';
    }

    _getOutdentIcon() {
        return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11,13H21V11H11M11,9H21V7H11M11,17H21V15H11M11,21H21V19H11M7,12L3,8V11H1V13H3V16L7,12Z"/></svg>';
    }

    render() {
        return this.element;
    }

    updateState() {
        this._updateButtonStates();
    }
}

export default Toolbar;