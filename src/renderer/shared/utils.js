/**
 * Shared Utilities
 * Contains common helper functions used across the application
 */

/**
 * Capitalizes the first letter of a string
 * @param {string} string - The string to capitalize
 * @returns {string} The capitalized string
 */
export function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Path utility functions
 * Provides basic path manipulation similar to Node.js path module
 */
export const path = {
    /**
     * Gets the last portion of a path
     * @param {string} filePath - The path to get the basename from
     * @param {string} ext - Optional extension to remove from the result
     * @returns {string} The basename of the path
     */
    basename: (filePath, ext) => {
        let base = filePath.split(/[\\/]/).pop();
        if (ext && base.endsWith(ext)) {
            base = base.slice(0, -ext.length);
        }
        return base;
    },
    
    /**
     * Gets the directory name of a path
     * @param {string} filePath - The path to get the dirname from
     * @returns {string} The directory name of the path
     */
    dirname: (filePath) => {
        return filePath.replace(/\\/g, '/').replace(/\/[^\/]*$/, '');
    },
    
    /**
     * Joins path segments into a single path
     * @param {...string} paths - Path segments to join
     * @returns {string} The joined path
     */
    join: (...paths) => {
        return paths.join('/').replace(/\/+/g, '/');
    },
    
    /**
     * Gets the extension of a path
     * @param {string} filePath - The path to get the extension from
     * @returns {string} The extension of the path
     */
    extname: (filePath) => {
        const base = filePath.split(/[\\/]/).pop();
        const match = base.match(/\.[^\.]*$/);
        return match ? match[0] : '';
    }
}; 