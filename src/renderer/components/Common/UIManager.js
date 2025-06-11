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
     * @param {Array} children - Child elements to append
     * @returns {Element} Created element
     */
    createElement(tag, options = {}, children = []) {
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
        
        // Handle special properties for form elements
        if (options.placeholder && element.tagName === 'TEXTAREA') {
            element.placeholder = options.placeholder;
        }
        
        if (options.rows && element.tagName === 'TEXTAREA') {
            element.rows = options.rows;
        }
        
        if (options.htmlFor && element.tagName === 'LABEL') {
            element.htmlFor = options.htmlFor;
        }
        
        // Append children
        if (children && Array.isArray(children)) {
            children.forEach(child => {
                if (child) {
                    element.appendChild(child);
                }
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

    /**
     * Shows a loading indicator over a target element or the body.
     * @param {HTMLElement} [targetElement=document.body] - The element to cover with the loading indicator.
     * @param {string} [message='Loading...'] - Optional message to display.
     * @returns {HTMLElement} The created loading overlay element.
     */
    showLoading(targetElement = document.body, message = 'Loading...') {
        // Prevent multiple loading indicators on the same element
        this.hideLoading(targetElement); // Remove any existing one first

        const overlayId = `loading-overlay-${targetElement.id || 'global'}`;
        let existingOverlay = document.getElementById(overlayId);
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlay = this.createElement('div', {
            id: overlayId,
            className: 'loading-overlay',
            style: {
                position: targetElement === document.body ? 'fixed' : 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: '9998', // Ensure it's on top, but below critical modals if any
                color: 'white'
            }
        });

        const spinner = this.createElement('div', {
            className: 'loading-spinner',
            // Basic spinner using CSS, can be enhanced with SVG or more complex CSS
            style: {
                border: '4px solid #f3f3f3', // Light grey
                borderTop: '4px solid var(--accent-primary, #3498db)', // Blue or theme color
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 1s linear infinite'
            }
        });

        // Add keyframes for spinner animation to the document if not already present
        if (!document.getElementById('loading-spinner-keyframes')) {
            const styleSheet = this.createElement('style', {
                id: 'loading-spinner-keyframes',
                textContent: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`
            });
            document.head.appendChild(styleSheet);
        }

        overlay.appendChild(spinner);

        if (message) {
            const loadingMessage = this.createElement('p', {
                className: 'loading-message',
                textContent: message,
                style: { marginTop: '10px', fontSize: '1em' }
            });
            overlay.appendChild(loadingMessage);
        }

        // Store a reference or mark the targetElement if needed
        targetElement.dataset.isLoading = 'true';
        targetElement.style.position = (targetElement === document.body || getComputedStyle(targetElement).position !== 'static') ? getComputedStyle(targetElement).position : 'relative'; // Ensure target can host absolute overlay
        targetElement.appendChild(overlay);
        return overlay;
    }

    /**
     * Hides the loading indicator from a target element or the body.
     * @param {HTMLElement} [targetElement=document.body] - The element from which to remove the loading indicator.
     */
    hideLoading(targetElement = document.body) {
        const overlayId = `loading-overlay-${targetElement.id || 'global'}`;
        const overlay = document.getElementById(overlayId);
        if (overlay && overlay.parentElement === targetElement) {
            targetElement.removeChild(overlay);
        }
        if (targetElement.dataset.isLoading) {
            delete targetElement.dataset.isLoading;
        }
    }
} 