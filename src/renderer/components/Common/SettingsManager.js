/**
 * SettingsManager - Handles application settings and preferences
 */
export class SettingsManager {
    constructor(electronAPI, themeManager) {
        this.electronAPI = electronAPI;
        this.themeManager = themeManager;
        this.settings = this.loadSettings();
        this.characterColors = new Map();
    }

    /**
     * Load settings from localStorage or defaults
     */
    loadSettings() {
        const defaultSettings = {
            theme: 'light',
            characterColorGrading: {
                enabled: false,
                autoAssignColors: true,
                colors: {}
            },
            characterHoverPreview: {
                enabled: true,
                showImage: true,
                showDescription: true,
                previewDelay: 500
            }
        };

        try {
            const stored = localStorage.getItem('writerStudioSettings');
            if (stored) {
                return { ...defaultSettings, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }

        return defaultSettings;
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('writerStudioSettings', JSON.stringify(this.settings));
            return true;
        } catch (e) {
            console.error('Failed to save settings:', e);
            return false;
        }
    }

    /**
     * Show the settings modal
     */
    showSettingsModal(modalManager) {
        const modal = modalManager.show({
            title: 'Settings',
            size: 'large',
            content: this.renderSettingsContent(),
            confirmText: 'Save',
            cancelText: 'Cancel',
            onConfirm: () => {
                this.saveSettings();
                return true;
            }
        });

        // Setup event listeners after modal is shown
        setTimeout(() => this.setupSettingsListeners(), 100);
        
        return modal;
    }

    /**
     * Render the settings content
     */
    renderSettingsContent() {
        return `
            <div class="settings-container">
                <div class="settings-section">
                    <h3>Appearance</h3>
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Theme</span>
                            <div class="theme-toggle">
                                <button class="theme-option ${this.settings.theme === 'light' ? 'active' : ''}" data-theme="light">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17Z"/>
                                    </svg>
                                    Light
                                </button>
                                <button class="theme-option ${this.settings.theme === 'dark' ? 'active' : ''}" data-theme="dark">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z"/>
                                    </svg>
                                    Dark
                                </button>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>Character Features</h3>
                    
                    <div class="setting-item">
                        <label class="setting-toggle">
                            <span>
                                <strong>Character Name Color Grading</strong>
                                <small>Highlight character names with custom colors in the editor</small>
                            </span>
                            <input type="checkbox" id="character-color-grading" 
                                ${this.settings.characterColorGrading.enabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="setting-item sub-setting" id="color-grading-options" 
                        style="${this.settings.characterColorGrading.enabled ? '' : 'display: none;'}">
                        <label class="setting-toggle">
                            <span>Auto-assign colors to new characters</span>
                            <input type="checkbox" id="auto-assign-colors" 
                                ${this.settings.characterColorGrading.autoAssignColors ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                        
                        <div class="info-message">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                            </svg>
                            <small>Character colors are now managed in each character's attributes. 
                            Open a character and look for "Character Color" in the attributes panel.</small>
                        </div>
                    </div>

                    <div class="setting-item">
                        <label class="setting-toggle">
                            <span>
                                <strong>Character Hover Preview</strong>
                                <small>Show character details when hovering over their name</small>
                            </span>
                            <input type="checkbox" id="character-hover-preview" 
                                ${this.settings.characterHoverPreview.enabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="setting-item sub-setting" id="hover-preview-options" 
                        style="${this.settings.characterHoverPreview.enabled ? '' : 'display: none;'}">
                        <label class="setting-toggle">
                            <span>Show character image</span>
                            <input type="checkbox" id="hover-show-image" 
                                ${this.settings.characterHoverPreview.showImage ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                        
                        <label class="setting-toggle">
                            <span>Show character description</span>
                            <input type="checkbox" id="hover-show-description" 
                                ${this.settings.characterHoverPreview.showDescription ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                        
                        <label class="setting-item">
                            <span>Preview delay (ms)</span>
                            <input type="number" id="hover-preview-delay" 
                                value="${this.settings.characterHoverPreview.previewDelay}"
                                min="0" max="2000" step="100">
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for settings
     */
    setupSettingsListeners() {
        // Theme toggle
        const themeButtons = document.querySelectorAll('.theme-option');
        themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.settings.theme = theme;
                this.themeManager.setTheme(theme);
                
                // Update active state
                themeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Character color grading toggle
        const colorGradingToggle = document.getElementById('character-color-grading');
        if (colorGradingToggle) {
            colorGradingToggle.addEventListener('change', (e) => {
                this.settings.characterColorGrading.enabled = e.target.checked;
                const options = document.getElementById('color-grading-options');
                if (options) {
                    options.style.display = e.target.checked ? '' : 'none';
                }
            });
        }

        // Character hover preview toggle
        const hoverPreviewToggle = document.getElementById('character-hover-preview');
        if (hoverPreviewToggle) {
            hoverPreviewToggle.addEventListener('change', (e) => {
                this.settings.characterHoverPreview.enabled = e.target.checked;
                const options = document.getElementById('hover-preview-options');
                if (options) {
                    options.style.display = e.target.checked ? '' : 'none';
                }
            });
        }

        // Other toggles
        const autoAssignToggle = document.getElementById('auto-assign-colors');
        if (autoAssignToggle) {
            autoAssignToggle.addEventListener('change', (e) => {
                this.settings.characterColorGrading.autoAssignColors = e.target.checked;
            });
        }

        const hoverImageToggle = document.getElementById('hover-show-image');
        if (hoverImageToggle) {
            hoverImageToggle.addEventListener('change', (e) => {
                this.settings.characterHoverPreview.showImage = e.target.checked;
            });
        }

        const hoverDescToggle = document.getElementById('hover-show-description');
        if (hoverDescToggle) {
            hoverDescToggle.addEventListener('change', (e) => {
                this.settings.characterHoverPreview.showDescription = e.target.checked;
            });
        }

        const hoverDelayInput = document.getElementById('hover-preview-delay');
        if (hoverDelayInput) {
            hoverDelayInput.addEventListener('change', (e) => {
                this.settings.characterHoverPreview.previewDelay = parseInt(e.target.value, 10);
            });
        }
    }

    /**
     * Load character colors for the current project
     */
    async loadCharacterColors() {
        const colorsList = document.getElementById('character-colors-list');
        if (!colorsList) return;

        try {
            // Get current project path
            const projectPath = window.writerStudio?.currentProject?.path;
            if (!projectPath) {
                colorsList.innerHTML = '<p class="no-characters">No project loaded</p>';
                return;
            }

            // Fetch characters from the project
            const charactersData = await this.electronAPI.getCharacters(projectPath);
            
            if (!charactersData || charactersData.length === 0) {
                colorsList.innerHTML = '<p class="no-characters">No characters in this project</p>';
                return;
            }

            // Create character color assignments UI
            colorsList.innerHTML = `
                <div class="color-assignments">
                    ${charactersData.map(char => {
                        const charName = char.name || char;
                        const existingColor = this.settings.characterColorGrading.colors[charName] || 
                                            this.getDefaultColor(charName);
                        return `
                            <div class="color-assignment">
                                <span class="character-name">${charName}</span>
                                <input type="color" class="color-picker" 
                                    value="${existingColor}" 
                                    data-character="${charName}">
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

            // Add color picker listeners
            colorsList.querySelectorAll('.color-picker').forEach(picker => {
                picker.addEventListener('change', (e) => {
                    const character = e.target.dataset.character;
                    const color = e.target.value;
                    this.settings.characterColorGrading.colors[character] = color;
                });
            });
        } catch (error) {
            console.error('Error loading character colors:', error);
            colorsList.innerHTML = '<p class="error">Error loading characters</p>';
        }
    }

    /**
     * Get a default color for a character
     */
    getDefaultColor(characterName) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
            '#FFCC00', '#FF7F50', '#40E0D0', '#DA70D6', '#FFB6C1'
        ];
        
        // Generate a consistent index based on character name
        let hash = 0;
        for (let i = 0; i < characterName.length; i++) {
            hash = characterName.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }

    /**
     * Save settings from modal
     */
    saveSettingsFromModal() {
        return this.saveSettings();
    }

    /**
     * Get a color for a character
     */
    getCharacterColor(characterName) {
        if (!this.settings.characterColorGrading.enabled) return null;
        
        return this.settings.characterColorGrading.colors[characterName] || null;
    }

    /**
     * Auto-assign a color to a character
     */
    autoAssignColor(characterName) {
        if (!this.settings.characterColorGrading.autoAssignColors) return null;

        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
            '#FFCC00', '#FF7F50', '#40E0D0', '#DA70D6', '#FFB6C1'
        ];

        const usedColors = Object.values(this.settings.characterColorGrading.colors);
        const availableColors = colors.filter(c => !usedColors.includes(c));
        
        if (availableColors.length === 0) {
            // All colors used, generate a random one
            const hue = Math.floor(Math.random() * 360);
            return `hsl(${hue}, 70%, 60%)`;
        }

        const color = availableColors[0];
        this.settings.characterColorGrading.colors[characterName] = color;
        this.saveSettings();
        
        return color;
    }
}