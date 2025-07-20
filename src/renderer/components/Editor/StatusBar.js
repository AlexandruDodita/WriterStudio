/**
 * Status Bar Component
 * Displays and manages editor status information such as word count
 */

/**
 * Updates the word and character count in the status bar
 * Reads from the editor-content element and updates the count elements
 */
export function updateWordCount() {
    const editorContent = document.getElementById('editor-content');
    if (!editorContent) return;

    // Handle both input elements and contentEditable elements
    const text = editorContent.value || editorContent.textContent || editorContent.innerText || '';
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const charCount = text.length;

    const wordCountEl = document.querySelector('.status-bar span:first-child');
    const charCountEl = document.querySelector('.status-bar span:last-child');
    
    if (wordCountEl) wordCountEl.textContent = `Words: ${wordCount}`;
    if (charCountEl) charCountEl.textContent = `Characters: ${charCount}`;
    
    // Also update the standalone word count display if it exists
    const wordCountDisplay = document.getElementById('word-count');
    if (wordCountDisplay) {
        wordCountDisplay.textContent = `Words: ${wordCount}`;
    }

    return { wordCount, charCount }; // Return values for testing or other uses
}

/**
 * Creates and attaches a status bar to the specified container
 * @param {HTMLElement} container - The container to attach the status bar to
 */
export function createStatusBar(container) {
    if (!container) return null;

    const statusBar = document.createElement('div');
    statusBar.className = 'status-bar';
    
    const wordCount = document.createElement('span');
    wordCount.textContent = 'Words: 0';
    
    const charCount = document.createElement('span');
    charCount.textContent = 'Characters: 0';
    
    statusBar.appendChild(wordCount);
    statusBar.appendChild(charCount);
    
    container.appendChild(statusBar);
    
    return statusBar;
}
