/**
 * Theme Context Module
 * Manages theme settings and toggles
 */

// Theme state
let isDarkTheme = localStorage.getItem('darkTheme') === 'true';

/**
 * Applies the current theme to the document
 * Sets dark or light theme based on isDarkTheme value
 */
export function applyTheme() {
    document.body.classList.toggle('dark-theme', isDarkTheme);
    
    // Find the theme toggle button
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.textContent = isDarkTheme ? 'Light Theme' : 'Dark Theme';
    }
    
    // Store theme preference in localStorage
    localStorage.setItem('darkTheme', isDarkTheme);
}

/**
 * Sets up theme toggle functionality
 * Should be called after DOM is fully loaded
 */
export function setupThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    if (themeToggleBtn) {
        console.log('Setting up theme toggle button');
        
        // Remove any existing listeners to prevent duplicates
        const newBtn = themeToggleBtn.cloneNode(true);
        themeToggleBtn.parentNode.replaceChild(newBtn, themeToggleBtn);
        
        newBtn.addEventListener('click', () => {
            console.log('Theme toggle clicked, current theme is', isDarkTheme ? 'dark' : 'light');
            isDarkTheme = !isDarkTheme;
            applyTheme();
        });
    } else {
        console.error('Theme toggle button not found in the DOM');
    }
}

/**
 * Gets the current theme state
 * @returns {boolean} True if dark theme is active, false otherwise
 */
export function getThemeState() {
    return isDarkTheme;
}

/**
 * Sets the theme directly
 * @param {boolean} darkMode - Whether to enable dark mode
 */
export function setTheme(darkMode) {
    isDarkTheme = darkMode;
    applyTheme();
}
