/**
 * ThemeManager - Handles theme switching and persistence
 */
export class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.storageKey = 'writerStudio_theme';
        this.systemPreferenceQuery = window.matchMedia('(prefers-color-scheme: dark)');
    }

    /**
     * Initialize theme system
     */
    initialize() {
        // Load saved theme or use system preference
        this.loadTheme();
        
        // Listen for system theme changes
        this.systemPreferenceQuery.addListener((e) => {
            if (this.currentTheme === 'auto') {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
        
        console.log(`Theme initialized: ${this.currentTheme}`);
    }

    /**
     * Load theme from storage or system preference
     */
    loadTheme() {
        try {
            const savedTheme = localStorage.getItem(this.storageKey);
            
            if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
                this.setTheme(savedTheme);
            } else {
                // Default to system preference
                this.setTheme('auto');
            }
        } catch (error) {
            console.warn('Failed to load theme from storage:', error);
            this.setTheme('light');
        }
    }

    /**
     * Save theme to storage
     * @param {string} theme - Theme to save
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.storageKey, theme);
        } catch (error) {
            console.warn('Failed to save theme to storage:', error);
        }
    }

    /**
     * Set theme
     * @param {string} theme - Theme name ('light', 'dark', 'auto')
     */
    setTheme(theme) {
        if (!['light', 'dark', 'auto'].includes(theme)) {
            console.warn(`Invalid theme: ${theme}`);
            return;
        }

        this.currentTheme = theme;
        
        // Determine actual theme to apply
        let actualTheme = theme;
        if (theme === 'auto') {
            actualTheme = this.systemPreferenceQuery.matches ? 'dark' : 'light';
        }
        
        this.applyTheme(actualTheme);
        this.saveTheme(theme);
        
        // Dispatch theme change event
        this.dispatchThemeChangeEvent(actualTheme);
    }

    /**
     * Apply theme to DOM
     * @param {string} theme - Theme to apply ('light' or 'dark')
     */
    applyTheme(theme) {
        const body = document.body;
        
        // Add transition class for smooth theme switching
        body.classList.add('theme-transition');
        
        // Remove existing theme classes
        body.classList.remove('theme-light', 'theme-dark');
        
        // Add new theme class
        body.classList.add(`theme-${theme}`);
        
        // Update theme toggle button appearance
        this.updateThemeToggleButton(theme);
        
        // Remove transition class after animation
        setTimeout(() => {
            body.classList.remove('theme-transition');
        }, 300);
        
        console.log(`Theme applied: ${theme}`);
    }

    /**
     * Toggle between light and dark themes
     */
    toggle() {
        const newTheme = this.getCurrentAppliedTheme() === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * Get currently applied theme (resolves 'auto' to actual theme)
     * @returns {string} Current applied theme
     */
    getCurrentAppliedTheme() {
        if (this.currentTheme === 'auto') {
            return this.systemPreferenceQuery.matches ? 'dark' : 'light';
        }
        return this.currentTheme;
    }

    /**
     * Get theme preference (including 'auto')
     * @returns {string} Theme preference
     */
    getThemePreference() {
        return this.currentTheme;
    }

    /**
     * Check if dark theme is active
     * @returns {boolean} True if dark theme is active
     */
    isDarkTheme() {
        return this.getCurrentAppliedTheme() === 'dark';
    }

    /**
     * Check if light theme is active
     * @returns {boolean} True if light theme is active
     */
    isLightTheme() {
        return this.getCurrentAppliedTheme() === 'light';
    }

    /**
     * Update theme toggle button appearance
     * @param {string} theme - Current theme
     */
    updateThemeToggleButton(theme) {
        const toggleButton = document.getElementById('theme-toggle');
        if (!toggleButton) return;

        const isDark = theme === 'dark';
        
        // Update button title
        toggleButton.title = isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme';
        
        // Update button icon (if using icon)
        const icon = toggleButton.querySelector('svg path');
        if (icon) {
            // Update icon based on theme
            if (isDark) {
                // Sun icon for switching to light
                icon.setAttribute('d', 'M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31L23.31,12L20,8.69Z');
            } else {
                // Moon icon for switching to dark
                icon.setAttribute('d', 'M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.4 6.35,17.41C9.37,20.43 14,20.54 17.33,17.97Z');
            }
        }
    }

    /**
     * Dispatch theme change event
     * @param {string} theme - New theme
     */
    dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('themechange', {
            detail: {
                theme,
                preference: this.currentTheme,
                isDark: theme === 'dark',
                isLight: theme === 'light'
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Listen for theme change events
     * @param {Function} callback - Callback function
     */
    onThemeChange(callback) {
        document.addEventListener('themechange', callback);
    }

    /**
     * Remove theme change listener
     * @param {Function} callback - Callback function to remove
     */
    offThemeChange(callback) {
        document.removeEventListener('themechange', callback);
    }

    /**
     * Get available themes
     * @returns {Array} Available themes
     */
    getAvailableThemes() {
        return [
            {
                value: 'light',
                label: 'Light',
                description: 'Light theme for better visibility in bright environments'
            },
            {
                value: 'dark',
                label: 'Dark',
                description: 'Dark theme for reduced eye strain in low-light environments'
            },
            {
                value: 'auto',
                label: 'Auto',
                description: 'Automatically switch based on system preference'
            }
        ];
    }

    /**
     * Get theme colors for the current theme
     * @returns {Object} Theme colors
     */
    getThemeColors() {
        const isDark = this.isDarkTheme();
        
        return {
            primary: isDark ? '#0f172a' : '#ffffff',
            secondary: isDark ? '#1e293b' : '#f8fafc',
            tertiary: isDark ? '#334155' : '#f1f5f9',
            surface: isDark ? '#1e293b' : '#ffffff',
            border: isDark ? '#334155' : '#e2e8f0',
            textPrimary: isDark ? '#f8fafc' : '#1e293b',
            textSecondary: isDark ? '#cbd5e1' : '#64748b',
            textMuted: isDark ? '#94a3b8' : '#94a3b8',
            accent: isDark ? '#60a5fa' : '#3b82f6'
        };
    }

    /**
     * Get CSS custom property value
     * @param {string} property - CSS custom property name (without --)
     * @returns {string} Property value
     */
    getCSSProperty(property) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(`--${property}`)
            .trim();
    }

    /**
     * Set CSS custom property value
     * @param {string} property - CSS custom property name (without --)
     * @param {string} value - Property value
     */
    setCSSProperty(property, value) {
        document.documentElement.style.setProperty(`--${property}`, value);
    }

    /**
     * Add theme transition class to element
     * @param {Element} element - Element to add transition to
     */
    addThemeTransition(element) {
        if (!element) return;
        
        element.style.transition = 'background-color var(--transition-normal), color var(--transition-normal), border-color var(--transition-normal)';
    }

    /**
     * Force refresh theme (useful after dynamic content changes)
     */
    refresh() {
        this.applyTheme(this.getCurrentAppliedTheme());
    }

    /**
     * Reset theme to default
     */
    reset() {
        this.setTheme('auto');
    }

    /**
     * Cleanup theme manager
     */
    destroy() {
        this.systemPreferenceQuery.removeListener(this.systemPreferenceChangeHandler);
    }
} 