/**
 * Main Content Module
 * Handles rendering main content area, including file lists
 */

import { capitalize, path } from '../../shared/utils.js';
import { openFile, createNewFile } from '../../fileManager.js';
import { showCustomDialog } from '../Common/Modal.js';

/**
 * Get title for file list based on file type
 * @param {string} fileType - The type of file ('chapter', 'character', 'lore', 'note')
 * @returns {string} The display title for the file type
 */
export function getFileTypeTitle(fileType) {
    switch (fileType) {
        case 'chapter': return 'Book Chapters';
        case 'character': return 'Characters';
        case 'lore': return 'World Lore';
        case 'note': return 'Notes';
        default: return capitalize(fileType) + 's';
    }
}

/**
 * Display a list of files in the UI
 * @param {Array} files - Array of file objects to display
 * @param {string} fileType - Type of files being displayed ('chapter', 'character', etc.)
 * @param {Object} electronAPI - Electron API for file operations
 */
export function displayFileList(files, fileType, electronAPI) {
    console.log(`Displaying file list for ${fileType}:`, files);
    
    // Get the editor area
    const editorArea = document.querySelector('.editor-area');
    if (!editorArea) {
        console.error('Editor area not found');
        return;
    }
    
    // Remove any existing editor container
    const editorContainer = document.querySelector('.editor-container');
    if (editorContainer) {
        editorContainer.remove();
    }
    
    // Remove any existing file list
    const existingFileList = document.querySelector('.file-list');
    if (existingFileList) {
        existingFileList.remove();
    }
    
    // Create new file list container
    const fileListContainer = document.createElement('div');
    fileListContainer.className = 'file-list';
    editorArea.prepend(fileListContainer);
    
    // Set a data attribute to indicate the current section
    fileListContainer.setAttribute('data-section', fileType);

    // Create header with "create new" button
    const header = document.createElement('div');
    header.className = 'file-list-header';

    const title = document.createElement('h3');
    title.textContent = getFileTypeTitle(fileType);

    const createButton = document.createElement('button');
    createButton.textContent = `New ${capitalize(fileType)}`;
    createButton.addEventListener('click', () => createNewFile(fileType, electronAPI));

    header.appendChild(title);
    header.appendChild(createButton);
    fileListContainer.appendChild(header);

    // Create list of files
    if (!files || files.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = `No ${fileType}s found. Create one to get started.`;
        fileListContainer.appendChild(emptyMessage);
    } else {
        const filesList = document.createElement('ul');
        filesList.className = 'files-list';

        files.forEach(file => {
            const fileItem = document.createElement('li');

            const fileLink = document.createElement('a');
            fileLink.href = '#';
            fileLink.textContent = file.name;
            
            // Store file path as data attribute for easier access
            fileLink.setAttribute('data-path', file.path);
            fileLink.setAttribute('data-type', file.type);
            
            fileLink.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Determine which file to open based on the type and implementation
                let filePath;
                
                if (file.type === 'chapter') {
                    // For chapters, first open the metadata
                    filePath = file.metadataPath;
                } else if (file.type === 'character') {
                    // For characters, first open the metadata
                    filePath = file.metadataPath;
                } else if (file.type === 'lore') {
                    // For lore items, first open the metadata
                    filePath = file.metadataPath;
                } else if (file.type === 'note') {
                    // For notes, first open the metadata
                    filePath = file.metadataPath;
                } else {
                    // Fallback to the main path
                    filePath = file.path;
                }
                
                openFile(filePath, electronAPI);
            });

            fileItem.appendChild(fileLink);
            
            // Add subfiles for all content types
            if (file.path) {
                // Create a subfiles container
                const subfilesList = document.createElement('ul');
                subfilesList.className = 'subfiles';
                
                // Add appropriate subfiles based on type
                if (file.type === 'chapter') {
                    // Add the content file
                    const contentFile = document.createElement('li');
                    contentFile.className = 'subfile';
                    
                    const contentLink = document.createElement('a');
                    contentLink.href = '#';
                    contentLink.className = 'subfile-link';
                    contentLink.textContent = 'Content';
                    contentLink.setAttribute('data-path', file.contentPath);
                    
                    contentLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        openFile(file.contentPath, electronAPI);
                    });
                    
                    contentFile.appendChild(contentLink);
                    subfilesList.appendChild(contentFile);
                    
                    // Add the description file for chapters
                    const descriptionFile = document.createElement('li');
                    descriptionFile.className = 'subfile';
                    
                    const descriptionLink = document.createElement('a');
                    descriptionLink.href = '#';
                    descriptionLink.className = 'subfile-link';
                    descriptionLink.textContent = 'Short Description';
                    descriptionLink.setAttribute('data-path', file.descriptionPath);
                    
                    descriptionLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        openFile(file.descriptionPath, electronAPI);
                    });
                    
                    descriptionFile.appendChild(descriptionLink);
                    subfilesList.appendChild(descriptionFile);
                } else if (file.type === 'character') {
                    // Add the profile file
                    const profileFile = document.createElement('li');
                    profileFile.className = 'subfile';
                    
                    const profileLink = document.createElement('a');
                    profileLink.href = '#';
                    profileLink.className = 'subfile-link';
                    profileLink.textContent = 'Profile';
                    
                    const profilePath = path.join(file.path, 'profile.txt');
                    profileLink.setAttribute('data-path', profilePath);
                    
                    profileLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        openFile(profilePath, electronAPI);
                    });
                    
                    profileFile.appendChild(profileLink);
                    subfilesList.appendChild(profileFile);
                } else if (file.type === 'lore') {
                    // Add the content file
                    const contentFile = document.createElement('li');
                    contentFile.className = 'subfile';
                    
                    const contentLink = document.createElement('a');
                    contentLink.href = '#';
                    contentLink.className = 'subfile-link';
                    contentLink.textContent = 'Content';
                    
                    const contentPath = path.join(file.path, 'content.txt');
                    contentLink.setAttribute('data-path', contentPath);
                    
                    contentLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        openFile(contentPath, electronAPI);
                    });
                    
                    contentFile.appendChild(contentLink);
                    subfilesList.appendChild(contentFile);
                } else if (file.type === 'note') {
                    // Add the content file
                    const contentFile = document.createElement('li');
                    contentFile.className = 'subfile';
                    
                    const contentLink = document.createElement('a');
                    contentLink.href = '#';
                    contentLink.className = 'subfile-link';
                    contentLink.textContent = 'Content';
                    
                    contentLink.setAttribute('data-path', file.contentPath);
                    
                    contentLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        openFile(file.contentPath, electronAPI);
                    });
                    
                    contentFile.appendChild(contentLink);
                    subfilesList.appendChild(contentFile);
                }
                
                // Add images folder link for all types
                const imagesFolder = document.createElement('li');
                imagesFolder.className = 'subfile folder';
                
                const imagesLink = document.createElement('a');
                imagesLink.href = '#';
                imagesLink.className = 'subfile-link folder-link';
                imagesLink.textContent = 'Images';
                
                // We'll implement image management functionality later
                imagesLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    showCustomDialog('Image Management', 'Image management will be implemented in a future update.', null, { type: 'notification' })
                        .then(() => {})
                        .catch(err => console.log('Dialog dismissed'));
                });
                
                imagesFolder.appendChild(imagesLink);
                subfilesList.appendChild(imagesFolder);
                
                // Add the subfiles list to the main file item
                fileItem.appendChild(subfilesList);
            }
            
            filesList.appendChild(fileItem);
        });

        fileListContainer.appendChild(filesList);
    }
}
