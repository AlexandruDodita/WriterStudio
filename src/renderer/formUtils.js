/**
 * Form Utilities
 * Helper functions for working with forms and form elements
 */

import { getIsDirty, setIsDirty } from './projectManager.js';

/**
 * Add a field to a form
 * @param {HTMLElement} form - The form to add the field to
 * @param {string} label - The label text
 * @param {string} name - The field name
 * @param {string} value - The field value
 * @returns {HTMLInputElement} The created input element
 */
export function addFormField(form, label, name, value) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.htmlFor = name;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = name;
    input.name = name;
    input.value = value;
    input.addEventListener('change', () => setIsDirty(true));
    
    formGroup.appendChild(labelEl);
    formGroup.appendChild(input);
    form.appendChild(formGroup);
    
    return input; // Return the input element for reference
}

/**
 * Add a textarea to a form
 * @param {HTMLElement} form - The form to add the textarea to
 * @param {string} label - The label text
 * @param {string} name - The textarea name
 * @param {string} value - The textarea value
 * @returns {HTMLTextAreaElement} The created textarea element
 */
export function addFormTextarea(form, label, name, value) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.htmlFor = name;
    
    const textarea = document.createElement('textarea');
    textarea.id = name;
    textarea.name = name;
    textarea.value = value;
    textarea.rows = 4;
    textarea.addEventListener('change', () => setIsDirty(true));
    
    formGroup.appendChild(labelEl);
    formGroup.appendChild(textarea);
    form.appendChild(formGroup);
    
    return textarea; // Return the textarea element for reference
}

/**
 * Set the dirty state
 * @param {boolean} state - The new dirty state
 */
export function setDirtyState(state) {
    setIsDirty(state);
}

/**
 * Get the current dirty state
 * @returns {boolean} The current dirty state
 */
export function getDirtyState() {
    return getIsDirty();
} 