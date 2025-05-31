/**
 * UIManager - Handles UI interactions and component management
 */
export class UIManager {
    constructor() {
        this.components = new Map();
        this.eventListeners = new Map();
    }

    /**
     * Register a component with the UI manager
     * @param {string} name - Component name
     * @param {Object} component - Component instance
     */
    registerComponent(name, component) {
        this.components.set(name, component);
    }

    /**
     * Get a registered component
     * @param {string} name - Component name
     * @returns {Object|null} Component instance
     */
    getComponent(name) {
        return this.components.get(name) || null;
    }

    /**
     * Add event listener with cleanup tracking
     * @param {Element} element - DOM element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    addEventListener(element, event, handler, options = {}) {
        if (!element) return;

        element.addEventListener(event, handler, options);
        
        // Track for cleanup
        const key = `${element.constructor.name}_${event}`;
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, []);
        }
        
        this.eventListeners.get(key).push({
            element,
            event,
            handler,
            options
        });
    }

    /**
     * Remove all tracked event listeners
     */
    cleanup() {
        for (const listeners of this.eventListeners.values()) {
            listeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
        }
        
        this.eventListeners.clear();
        this.components.clear();
    }

    /**
     * Create and configure a DOM element
     * @param {string} tag - HTML tag
     * @param {Object} options - Element configuration
     * @returns {Element} Created element
     */
    createElement(tag, options = {}) {
        const element = document.createElement(tag);
        
        if (options.className) {
            element.className = options.className;
        }
        
        if (options.id) {
            element.id = options.id;
        }
        
        if (options.textContent) {
            element.textContent = options.textContent;
        }
        
        if (options.innerHTML) {
            element.innerHTML = options.innerHTML;
        }
        
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        if (options.dataset) {
            Object.entries(options.dataset).forEach(([key, value]) => {
                element.dataset[key] = value;
            });
        }
        
        if (options.styles) {
            Object.entries(options.styles).forEach(([key, value]) => {
                element.style[key] = value;
            });
        }
        
        return element;
    }

    /**
     * Find element with error handling
     * @param {string} selector - CSS selector
     * @param {Element} parent - Parent element (default: document)
     * @returns {Element|null} Found element
     */
    findElement(selector, parent = document) {
        try {
            return parent.querySelector(selector);
        } catch (error) {
            console.warn(`UIManager: Invalid selector "${selector}"`, error);
            return null;
        }
    }

    /**
     * Find multiple elements with error handling
     * @param {string} selector - CSS selector
     * @param {Element} parent - Parent element (default: document)
     * @returns {NodeList} Found elements
     */
    findElements(selector, parent = document) {
        try {
            return parent.querySelectorAll(selector);
        } catch (error) {
            console.warn(`UIManager: Invalid selector "${selector}"`, error);
            return [];
        }
    }

    /**
     * Animate element with CSS classes
     * @param {Element} element - Element to animate
     * @param {string} animation - Animation class name
     * @param {number} duration - Animation duration in ms
     * @returns {Promise} Animation completion promise
     */
    animate(element, animation, duration = 300) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }

            element.classList.add(animation);
            
            const handleAnimationEnd = () => {
                element.classList.remove(animation);
                element.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            };
            
            element.addEventListener('animationend', handleAnimationEnd);
            
            // Fallback timeout
            setTimeout(() => {
                if (element.classList.contains(animation)) {
                    element.classList.remove(animation);
                    element.removeEventListener('animationend', handleAnimationEnd);
                    resolve();
                }
            }, duration + 100);
        });
    }

    /**
     * Show element with animation
     * @param {Element} element - Element to show
     * @param {string} animation - Animation class (default: 'animate-fade-in')
     */
    async show(element, animation = 'animate-fade-in') {
        if (!element) return;
        
        element.style.display = '';
        await this.animate(element, animation);
    }

    /**
     * Hide element with animation
     * @param {Element} element - Element to hide
     * @param {string} animation - Animation class (default: 'animate-fade-out')
     */
    async hide(element, animation = 'animate-fade-out') {
        if (!element) return;
        
        await this.animate(element, animation);
        element.style.display = 'none';
    }

    /**
     * Toggle element visibility
     * @param {Element} element - Element to toggle
     * @param {boolean} show - Force show/hide (optional)
     */
    async toggle(element, show = null) {
        if (!element) return;
        
        const isVisible = element.style.display !== 'none';
        const shouldShow = show !== null ? show : !isVisible;
        
        if (shouldShow) {
            await this.show(element);
        } else {
            await this.hide(element);
        }
    }

    /**
     * Set loading state on element
     * @param {Element} element - Element to set loading state
     * @param {boolean} loading - Loading state
     * @param {string} loadingText - Loading text (optional)
     */
    setLoading(element, loading, loadingText = 'Loading...') {
        if (!element) return;
        
        if (loading) {
            element.classList.add('loading');
            element.disabled = true;
            
            if (element.tagName === 'BUTTON') {
                element.dataset.originalText = element.textContent;
                element.innerHTML = `
                    <div class="spinner"></div>
                    <span>${loadingText}</span>
                `;
            }
        } else {
            element.classList.remove('loading');
            element.disabled = false;
            
            if (element.tagName === 'BUTTON' && element.dataset.originalText) {
                element.textContent = element.dataset.originalText;
                delete element.dataset.originalText;
            }
        }
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in ms
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Wait for element to appear in DOM
     * @param {string} selector - CSS selector
     * @param {number} timeout - Timeout in ms
     * @returns {Promise<Element>} Found element
     */
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = this.findElement(selector);
            
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver(() => {
                const element = this.findElement(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
            }, timeout);
        });
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const result = document.execCommand('copy');
                textArea.remove();
                return result;
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }

    /**
     * Format file size for display
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format date for display
     * @param {Date|string} date - Date to format
     * @param {Object} options - Formatting options
     * @returns {string} Formatted date
     */
    formatDate(date, options = {}) {
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            return dateObj.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                ...options
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
} 