// Get DOM elements
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const editorContent = document.getElementById('editor-content');
const wordCountEl = document.querySelector('.status-bar span:first-child');
const charCountEl = document.querySelector('.status-bar span:last-child');

// Theme toggle functionality
let isDarkTheme = false;

themeToggleBtn.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('dark-theme', isDarkTheme);
    themeToggleBtn.textContent = isDarkTheme ? 'Light Theme' : 'Dark Theme';
});

// Word and character count
editorContent.addEventListener('input', updateWordCount);

function updateWordCount() {
    const text = editorContent.value;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const charCount = text.length;

    wordCountEl.textContent = `Words: ${wordCount}`;
    charCountEl.textContent = `Characters: ${charCount}`;
}

// Initialize the app
function init() {
    // Set default text in the editor (optional)
    editorContent.value = 'Welcome to Writer\'s Studio! Start typing your story here...';

    // Update initial word count
    updateWordCount();

    console.log('Writer\'s Studio initialized');
}

// Call init when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);