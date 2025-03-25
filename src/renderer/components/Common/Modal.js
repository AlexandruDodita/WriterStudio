/**
 * Modal Module
 * Handles custom dialog functionality to replace default browser dialogs
 */

/**
 * Create a custom dialog to replace prompt() and alert()
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message text
 * @param {string} defaultValue - Default value for input field (null for notification)
 * @param {Object} options - Additional options
 * @returns {Promise<string|boolean>} Resolves with user input or true for notifications
 */
export function showCustomDialog(title, message, defaultValue = '', options = {}) {
    return new Promise((resolve, reject) => {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'custom-dialog-overlay';
        
        // Create dialog container
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'custom-dialog-header';
        
        const headerTitle = document.createElement('h3');
        headerTitle.textContent = title;
        header.appendChild(headerTitle);
        
        // Create body
        const body = document.createElement('div');
        body.className = 'custom-dialog-body';
        
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        body.appendChild(messageElement);
        
        // Determine if this is a notification or input dialog
        const isNotification = options.type === 'notification' || defaultValue === null;
        
        // Create input field (only if not a notification)
        if (!isNotification) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'custom-dialog-input';
            input.value = defaultValue;
            body.appendChild(input);
        }
        
        // Create actions
        const actions = document.createElement('div');
        actions.className = 'custom-dialog-actions';
        
        // Only show cancel button if this is not a notification
        if (!isNotification) {
            const cancelButton = document.createElement('button');
            cancelButton.className = 'custom-dialog-btn';
            cancelButton.textContent = 'Cancel';
            cancelButton.addEventListener('click', () => {
                document.body.removeChild(overlay);
                reject(new Error('Dialog cancelled'));
            });
            actions.appendChild(cancelButton);
        }
        
        // Confirm button (for notifications, label as "OK")
        const confirmButton = document.createElement('button');
        confirmButton.className = 'custom-dialog-btn custom-dialog-btn-primary';
        confirmButton.textContent = isNotification ? 'OK' : 'Create';
        confirmButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (isNotification) {
                resolve(true);
            } else {
                const input = dialog.querySelector('.custom-dialog-input');
                const value = input ? input.value.trim() : '';
                if (value || isNotification) {
                    resolve(value);
                } else {
                    input.focus();
                }
            }
        });
        
        actions.appendChild(confirmButton);
        
        // Assemble dialog
        dialog.appendChild(header);
        dialog.appendChild(body);
        dialog.appendChild(actions);
        overlay.appendChild(dialog);
        
        // Add to document
        document.body.appendChild(overlay);
        
        // Focus input or confirm button
        setTimeout(() => {
            const input = dialog.querySelector('.custom-dialog-input');
            if (input) {
                input.focus();
                
                // Handle Enter and Escape keys
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        confirmButton.click();
                    } else if (e.key === 'Escape') {
                        const cancelButton = dialog.querySelector('.custom-dialog-btn:not(.custom-dialog-btn-primary)');
                        if (cancelButton) {
                            cancelButton.click();
                        }
                    }
                });
            } else {
                confirmButton.focus();
                
                // Handle keyboard for notification dialogs
                dialog.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                        confirmButton.click();
                    }
                });
            }
        }, 0);
    });
}

/**
 * Custom dialog for confirmations (replacing confirm())
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message text
 * @returns {Promise<boolean>} Resolves with true if confirmed, false if cancelled
 */
export function showConfirmDialog(title, message) {
    return new Promise((resolve) => {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'custom-dialog-overlay';
        
        // Create dialog container
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'custom-dialog-header';
        
        const headerTitle = document.createElement('h3');
        headerTitle.textContent = title;
        header.appendChild(headerTitle);
        
        // Create body
        const body = document.createElement('div');
        body.className = 'custom-dialog-body';
        
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        body.appendChild(messageElement);
        
        // Create actions
        const actions = document.createElement('div');
        actions.className = 'custom-dialog-actions';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'custom-dialog-btn';
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(false);
        });
        
        const confirmButton = document.createElement('button');
        confirmButton.className = 'custom-dialog-btn custom-dialog-btn-primary';
        confirmButton.textContent = 'Confirm';
        confirmButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(true);
        });
        
        actions.appendChild(cancelButton);
        actions.appendChild(confirmButton);
        
        // Assemble dialog
        dialog.appendChild(header);
        dialog.appendChild(body);
        dialog.appendChild(actions);
        overlay.appendChild(dialog);
        
        // Add to document
        document.body.appendChild(overlay);
        
        // Focus confirm button
        setTimeout(() => {
            confirmButton.focus();
            
            // Handle keyboard navigation
            dialog.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    confirmButton.click();
                } else if (e.key === 'Escape') {
                    cancelButton.click();
                }
            });
        }, 0);
    });
}
