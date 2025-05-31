/**
 * ModalManager - Handles modal dialogs and overlays
 */
export class ModalManager {
    constructor() {
        this.activeModals = new Map();
        this.zIndexCounter = 1000;
        this.setupBaseElements();
    }

    /**
     * Setup base modal elements
     */
    setupBaseElements() {
        // Ensure modal overlay exists
        let overlay = document.getElementById('modal-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'modal-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }

        // Handle overlay clicks
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeTopModal();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });
    }

    /**
     * Show a modal dialog
     * @param {Object} options - Modal options
     * @returns {Promise} Modal result promise
     */
    show(options = {}) {
        return new Promise((resolve, reject) => {
            const modalId = this.generateModalId();
            const modal = this.createModal(modalId, options, resolve, reject);
            
            this.activeModals.set(modalId, {
                element: modal,
                resolve,
                reject,
                options
            });

            this.displayModal(modal);
        });
    }

    /**
     * Show confirmation dialog
     * @param {Object} options - Confirmation options
     * @returns {Promise<boolean>} Confirmation result
     */
    showConfirm(options = {}) {
        const defaultOptions = {
            title: 'Confirm Action',
            message: 'Are you sure you want to continue?',
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            confirmVariant: 'primary',
            showCancel: true
        };

        return this.show({ ...defaultOptions, ...options, type: 'confirm' });
    }

    /**
     * Show input dialog
     * @param {Object} options - Input options
     * @returns {Promise<string|null>} Input result
     */
    showInput(options = {}) {
        const defaultOptions = {
            title: 'Enter Value',
            message: 'Please enter a value:',
            placeholder: '',
            confirmText: 'OK',
            cancelText: 'Cancel',
            inputType: 'text',
            required: true
        };

        return this.show({ ...defaultOptions, ...options, type: 'input' });
    }

    /**
     * Show alert dialog
     * @param {Object} options - Alert options
     * @returns {Promise} Alert completion promise
     */
    showAlert(options = {}) {
        const defaultOptions = {
            title: 'Alert',
            confirmText: 'OK',
            showCancel: false
        };

        return this.show({ ...defaultOptions, ...options, type: 'alert' });
    }

    /**
     * Create modal element
     * @param {string} modalId - Modal ID
     * @param {Object} options - Modal options
     * @param {Function} resolve - Promise resolve function
     * @param {Function} reject - Promise reject function
     * @returns {Element} Modal element
     */
    createModal(modalId, options, resolve, reject) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = modalId;
        modal.style.zIndex = ++this.zIndexCounter;

        // Create modal structure
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${this.escapeHtml(options.title || 'Modal')}</h3>
                <button class="modal-close" type="button" aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                ${this.createModalBody(options)}
            </div>
            <div class="modal-footer">
                ${this.createModalFooter(options)}
            </div>
        `;

        // Setup event listeners
        this.setupModalEventListeners(modal, options, resolve, reject);

        return modal;
    }

    /**
     * Create modal body content
     * @param {Object} options - Modal options
     * @returns {string} Modal body HTML
     */
    createModalBody(options) {
        if (options.content) {
            return options.content;
        }

        let bodyHtml = '';

        if (options.message) {
            bodyHtml += `<p class="modal-message">${this.escapeHtml(options.message)}</p>`;
        }

        if (options.type === 'input') {
            const inputType = options.inputType || 'text';
            const placeholder = options.placeholder || '';
            const required = options.required ? 'required' : '';
            
            bodyHtml += `
                <div class="form-group">
                    <input 
                        type="${inputType}" 
                        class="form-input modal-input" 
                        placeholder="${this.escapeHtml(placeholder)}"
                        ${required}
                        id="modal-input-${Date.now()}"
                    />
                </div>
            `;
        }

        return bodyHtml;
    }

    /**
     * Create modal footer buttons
     * @param {Object} options - Modal options
     * @returns {string} Modal footer HTML
     */
    createModalFooter(options) {
        let footerHtml = '';

        // Cancel button
        if (options.showCancel !== false) {
            const cancelText = options.cancelText || 'Cancel';
            footerHtml += `
                <button type="button" class="btn btn-secondary modal-cancel">
                    ${this.escapeHtml(cancelText)}
                </button>
            `;
        }

        // Confirm button
        const confirmText = options.confirmText || 'OK';
        const confirmVariant = options.confirmVariant || 'primary';
        footerHtml += `
            <button type="button" class="btn btn-${confirmVariant} modal-confirm">
                ${this.escapeHtml(confirmText)}
            </button>
        `;

        return footerHtml;
    }

    /**
     * Setup modal event listeners
     * @param {Element} modal - Modal element
     * @param {Object} options - Modal options
     * @param {Function} resolve - Promise resolve function
     * @param {Function} reject - Promise reject function
     */
    setupModalEventListeners(modal, options, resolve, reject) {
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const confirmBtn = modal.querySelector('.modal-confirm');
        const input = modal.querySelector('.modal-input');

        // Close button
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal(modal.id, null);
            });
        }

        // Cancel button
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal(modal.id, null);
            });
        }

        // Confirm button
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.handleConfirm(modal, options);
            });
        }

        // Enter key handling
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.handleConfirm(modal, options);
                }
            });

            // Focus input
            setTimeout(() => input.focus(), 100);
        }
    }

    /**
     * Handle confirm action
     * @param {Element} modal - Modal element
     * @param {Object} options - Modal options
     */
    handleConfirm(modal, options) {
        let result = true;

        if (options.type === 'input') {
            const input = modal.querySelector('.modal-input');
            if (input) {
                result = input.value.trim();
                
                if (options.required && !result) {
                    input.classList.add('error');
                    input.focus();
                    return;
                }
            }
        }

        this.closeModal(modal.id, result);
    }

    /**
     * Display modal
     * @param {Element} modal - Modal element
     */
    displayModal(modal) {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay) return;

        // Add modal to overlay
        overlay.appendChild(modal);

        // Show overlay
        overlay.classList.add('active');

        // Animate modal in
        requestAnimationFrame(() => {
            modal.classList.add('animate-fade-in');
        });

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close modal
     * @param {string} modalId - Modal ID
     * @param {*} result - Modal result
     */
    closeModal(modalId, result) {
        const modalData = this.activeModals.get(modalId);
        if (!modalData) return;

        const { element, resolve, reject } = modalData;

        // Animate modal out
        element.classList.add('animate-fade-out');

        setTimeout(() => {
            // Remove modal from DOM
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }

            // Remove from active modals
            this.activeModals.delete(modalId);

            // Hide overlay if no more modals
            if (this.activeModals.size === 0) {
                const overlay = document.getElementById('modal-overlay');
                if (overlay) {
                    overlay.classList.remove('active');
                }

                // Restore body scroll
                document.body.style.overflow = '';
            }

            // Resolve promise
            if (result !== null) {
                resolve(result);
            } else {
                resolve(null);
            }
        }, 200);
    }

    /**
     * Close top modal
     */
    closeTopModal() {
        if (this.activeModals.size === 0) return;

        // Get the modal with highest z-index
        let topModal = null;
        let highestZIndex = 0;

        for (const [modalId, modalData] of this.activeModals) {
            const zIndex = parseInt(modalData.element.style.zIndex);
            if (zIndex > highestZIndex) {
                highestZIndex = zIndex;
                topModal = modalId;
            }
        }

        if (topModal) {
            this.closeModal(topModal, null);
        }
    }

    /**
     * Close all modals
     */
    closeAll() {
        const modalIds = Array.from(this.activeModals.keys());
        modalIds.forEach(modalId => {
            this.closeModal(modalId, null);
        });
    }

    /**
     * Generate unique modal ID
     * @returns {string} Modal ID
     */
    generateModalId() {
        return `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
     * Check if any modal is open
     * @returns {boolean} True if modal is open
     */
    isOpen() {
        return this.activeModals.size > 0;
    }

    /**
     * Get number of open modals
     * @returns {number} Number of open modals
     */
    getOpenCount() {
        return this.activeModals.size;
    }

    /**
     * Cleanup modal manager
     */
    destroy() {
        this.closeAll();
        
        const overlay = document.getElementById('modal-overlay');
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        
        this.activeModals.clear();
    }
} 