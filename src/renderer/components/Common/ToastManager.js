/**
 * ToastManager - Handles toast notifications
 */
export class ToastManager {
    constructor() {
        this.toasts = new Map();
        this.container = null;
        this.setupContainer();
    }

    /**
     * Setup toast container
     */
    setupContainer() {
        // Create toast container if it doesn't exist
        this.container = document.querySelector('.toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type ('success', 'error', 'warning', 'info')
     * @param {Object} options - Additional options
     * @returns {string} Toast ID
     */
    show(message, type = 'info', options = {}) {
        const toastId = this.generateToastId();
        const toast = this.createToast(toastId, message, type, options);
        
        this.toasts.set(toastId, {
            element: toast,
            type,
            message,
            options
        });

        this.displayToast(toast, options);
        
        return toastId;
    }

    /**
     * Show success toast
     * @param {string} message - Success message
     * @param {Object} options - Additional options
     * @returns {string} Toast ID
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    /**
     * Show error toast
     * @param {string} message - Error message
     * @param {Object} options - Additional options
     * @returns {string} Toast ID
     */
    error(message, options = {}) {
        return this.show(message, 'error', { 
            duration: 0, // Don't auto-dismiss errors
            ...options 
        });
    }

    /**
     * Show warning toast
     * @param {string} message - Warning message
     * @param {Object} options - Additional options
     * @returns {string} Toast ID
     */
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    /**
     * Show info toast
     * @param {string} message - Info message
     * @param {Object} options - Additional options
     * @returns {string} Toast ID
     */
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    /**
     * Create toast element
     * @param {string} toastId - Toast ID
     * @param {string} message - Toast message
     * @param {string} type - Toast type
     * @param {Object} options - Toast options
     * @returns {Element} Toast element
     */
    createToast(toastId, message, type, options) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.id = toastId;

        const title = options.title || this.getDefaultTitle(type);
        const showClose = options.showClose !== false;

        toast.innerHTML = `
            <div class="toast-header">
                <div class="toast-icon">
                    ${this.getIcon(type)}
                </div>
                <div class="toast-title">${this.escapeHtml(title)}</div>
                ${showClose ? `
                    <button class="toast-close" type="button" aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                        </svg>
                    </button>
                ` : ''}
            </div>
            <div class="toast-body">
                ${this.escapeHtml(message)}
            </div>
        `;

        // Setup event listeners
        this.setupToastEventListeners(toast, toastId);

        return toast;
    }

    /**
     * Get default title for toast type
     * @param {string} type - Toast type
     * @returns {string} Default title
     */
    getDefaultTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        return titles[type] || 'Notification';
    }

    /**
     * Get icon for toast type
     * @param {string} type - Toast type
     * @returns {string} Icon SVG
     */
    getIcon(type) {
        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.41,10.09L6,11.5L11,16.5Z"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2L1,21H23M12,6L19.53,19H4.47M11,10V14H13V10M11,16V18H13V16"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg>'
        };
        return icons[type] || icons.info;
    }

    /**
     * Setup toast event listeners
     * @param {Element} toast - Toast element
     * @param {string} toastId - Toast ID
     */
    setupToastEventListeners(toast, toastId) {
        const closeBtn = toast.querySelector('.toast-close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide(toastId);
            });
        }

        // Click to dismiss (optional)
        toast.addEventListener('click', () => {
            const toastData = this.toasts.get(toastId);
            if (toastData && toastData.options.clickToDismiss !== false) {
                this.hide(toastId);
            }
        });
    }

    /**
     * Display toast
     * @param {Element} toast - Toast element
     * @param {Object} options - Toast options
     */
    displayToast(toast, options) {
        // Add to container
        this.container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto-dismiss
        const duration = options.duration !== undefined ? options.duration : 5000;
        if (duration > 0) {
            setTimeout(() => {
                this.hide(toast.id);
            }, duration);
        }
    }

    /**
     * Hide toast
     * @param {string} toastId - Toast ID
     */
    hide(toastId) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;

        const toast = toastData.element;

        // Animate out
        toast.classList.remove('show');

        setTimeout(() => {
            // Remove from DOM
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }

            // Remove from active toasts
            this.toasts.delete(toastId);
        }, 300);
    }

    /**
     * Hide all toasts
     */
    hideAll() {
        const toastIds = Array.from(this.toasts.keys());
        toastIds.forEach(toastId => {
            this.hide(toastId);
        });
    }

    /**
     * Hide toasts by type
     * @param {string} type - Toast type to hide
     */
    hideByType(type) {
        for (const [toastId, toastData] of this.toasts) {
            if (toastData.type === type) {
                this.hide(toastId);
            }
        }
    }

    /**
     * Update toast message
     * @param {string} toastId - Toast ID
     * @param {string} message - New message
     */
    updateMessage(toastId, message) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;

        const bodyElement = toastData.element.querySelector('.toast-body');
        if (bodyElement) {
            bodyElement.textContent = message;
            toastData.message = message;
        }
    }

    /**
     * Show loading toast
     * @param {string} message - Loading message
     * @param {Object} options - Additional options
     * @returns {string} Toast ID
     */
    loading(message, options = {}) {
        const loadingOptions = {
            duration: 0, // Don't auto-dismiss loading toasts
            showClose: false,
            clickToDismiss: false,
            ...options
        };

        const toastId = this.show(message, 'info', loadingOptions);
        
        // Add loading spinner
        const toast = this.toasts.get(toastId)?.element;
        if (toast) {
            const icon = toast.querySelector('.toast-icon');
            if (icon) {
                icon.innerHTML = '<div class="spinner"></div>';
            }
        }

        return toastId;
    }

    /**
     * Update loading toast to success
     * @param {string} toastId - Loading toast ID
     * @param {string} message - Success message
     */
    loadingSuccess(toastId, message) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;

        const toast = toastData.element;
        
        // Update class
        toast.className = 'toast toast-success show';
        
        // Update icon
        const icon = toast.querySelector('.toast-icon');
        if (icon) {
            icon.innerHTML = this.getIcon('success');
        }
        
        // Update title
        const title = toast.querySelector('.toast-title');
        if (title) {
            title.textContent = 'Success';
        }
        
        // Update message
        this.updateMessage(toastId, message);
        
        // Update data
        toastData.type = 'success';
        toastData.message = message;
        
        // Auto-dismiss after delay
        setTimeout(() => {
            this.hide(toastId);
        }, 3000);
    }

    /**
     * Update loading toast to error
     * @param {string} toastId - Loading toast ID
     * @param {string} message - Error message
     */
    loadingError(toastId, message) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;

        const toast = toastData.element;
        
        // Update class
        toast.className = 'toast toast-error show';
        
        // Update icon
        const icon = toast.querySelector('.toast-icon');
        if (icon) {
            icon.innerHTML = this.getIcon('error');
        }
        
        // Update title
        const title = toast.querySelector('.toast-title');
        if (title) {
            title.textContent = 'Error';
        }
        
        // Update message
        this.updateMessage(toastId, message);
        
        // Update data
        toastData.type = 'error';
        toastData.message = message;
        
        // Add close button for errors
        const header = toast.querySelector('.toast-header');
        if (header && !header.querySelector('.toast-close')) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'toast-close';
            closeBtn.type = 'button';
            closeBtn.setAttribute('aria-label', 'Close');
            closeBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
            `;
            closeBtn.addEventListener('click', () => this.hide(toastId));
            header.appendChild(closeBtn);
        }
    }

    /**
     * Generate unique toast ID
     * @returns {string} Toast ID
     */
    generateToastId() {
        return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
     * Get active toasts count
     * @returns {number} Number of active toasts
     */
    getActiveCount() {
        return this.toasts.size;
    }

    /**
     * Get toasts by type
     * @param {string} type - Toast type
     * @returns {Array} Array of toast data
     */
    getByType(type) {
        return Array.from(this.toasts.values()).filter(toast => toast.type === type);
    }

    /**
     * Check if toast exists
     * @param {string} toastId - Toast ID
     * @returns {boolean} True if toast exists
     */
    exists(toastId) {
        return this.toasts.has(toastId);
    }

    /**
     * Set container position
     * @param {string} position - Position ('top-right', 'top-left', 'bottom-right', 'bottom-left')
     */
    setPosition(position) {
        if (!this.container) return;

        // Remove existing position classes
        this.container.className = 'toast-container';
        
        // Add new position class
        this.container.classList.add(`toast-container-${position}`);
    }

    /**
     * Cleanup toast manager
     */
    destroy() {
        this.hideAll();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.toasts.clear();
        this.container = null;
    }
} 