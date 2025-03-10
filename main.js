const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Enhanced logging function
function log(type, message, ...args) {
    const timestamp = new Date().toISOString();
    // Map 'warning' to 'warn' for console methods
    const consoleMethod = type === 'warning' ? 'warn' : type;
    
    if (typeof console[consoleMethod] !== 'function') {
        console.log(`[${timestamp}] [Main] [${type}] ${message}`, ...args);
    } else {
        console[consoleMethod](`[${timestamp}] [Main] ${message}`, ...args);
    }
}

// Error handling function
function handleError(operation, error) {
    log('error', `Error during ${operation}:`, error);
    return error;
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
    app.quit();
}

// Keep a global reference of the window object
let mainWindow;

// Create the browser window
function createWindow() {
    log('info', 'Creating main window');
    
    try {
        mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            }
        });

        // Load the home screen
        const homePath = path.join(__dirname, 'src/renderer/home.html');
        log('info', `Loading home screen from: ${homePath}`);
        
        if (!fs.existsSync(homePath)) {
            log('error', `Home page not found at: ${homePath}`);
        }
        
        mainWindow.loadFile(homePath);

        // Open DevTools for debugging
        mainWindow.webContents.openDevTools();
        
        log('info', 'Main window created successfully');
    } catch (error) {
        handleError('window creation', error);
    }
}

// Create window when Electron has finished initialization
app.whenReady().then(() => {
    log('info', 'Electron ready, creating window');
    createWindow();
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// On macOS, re-create a window when dock icon is clicked if no windows are open
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Set up IPC handlers for dialog functionality
ipcMain.handle('dialog:selectDirectory', async () => {
    log('info', 'IPC: dialog:selectDirectory called');
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });
        log('info', 'Directory selection result:', result);
        return result;
    } catch (error) {
        return handleError('directory selection', error);
    }
});

// Create a simple project structure
ipcMain.handle('project:create', async (event, name, location) => {
    log('info', `IPC: project:create called with name: "${name}", location: "${location}"`);
    
    try {
        if (!name || typeof name !== 'string') {
            throw new Error('Invalid project name');
        }
        
        if (!location || typeof location !== 'string') {
            throw new Error('Invalid project location');
        }
        
        const projectPath = path.join(location, name);
        log('info', `Creating project at: ${projectPath}`);

        // Check if project directory already exists
        if (fs.existsSync(projectPath)) {
            log('error', `Project directory already exists: ${projectPath}`);
            throw new Error('A project with this name already exists');
        }

        // Create project directory
        fs.mkdirSync(projectPath, { recursive: true });
        log('info', `Created main project directory: ${projectPath}`);

        // Create main project structure
        const mainDirectories = [
            'Book Chapters',
            'Characters',
            'World Lore',
            'Notes'
        ];
        
        for (const dir of mainDirectories) {
            const subDirPath = path.join(projectPath, dir);
            fs.mkdirSync(subDirPath, { recursive: true });
            log('info', `Created project subdirectory: ${subDirPath}`);
            
            // Create images subdirectories for Characters and World Lore
            if (dir === 'Characters' || dir === 'World Lore') {
                // This directory will hold individual character/lore directories
                // Each character/lore item will have its own directory and images subdirectory
                // Those will be created when a character/lore item is created
                log('info', `"${dir}" directory will contain individual item directories`);
            }
        }

        // Create project config file
        const projectConfig = {
            name: name,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            version: '1.0.0'
        };

        const configPath = path.join(projectPath, 'project.json');
        fs.writeFileSync(
            configPath,
            JSON.stringify(projectConfig, null, 2),
            'utf8'
        );
        log('info', `Created project config at: ${configPath}`);

        return projectPath;
    } catch (error) {
        return handleError('project creation', error);
    }
});

// Get default projects path
ipcMain.handle('project:getDefaultPath', async () => {
    log('info', 'IPC: project:getDefaultPath called');
    
    try {
        const defaultPath = path.join(os.homedir(), 'WritersStudioProjects');
        log('info', `Default project path: ${defaultPath}`);

        // Create the directory if it doesn't exist
        if (!fs.existsSync(defaultPath)) {
            fs.mkdirSync(defaultPath, { recursive: true });
            log('info', `Created default projects directory: ${defaultPath}`);
        }

        return defaultPath;
    } catch (error) {
        return handleError('getting default path', error);
    }
});

// Open a project
ipcMain.handle('project:open', async (event, projectPath) => {
    log('info', `IPC: project:open called with path: "${projectPath}"`);
    
    try {
        if (!projectPath || typeof projectPath !== 'string') {
            throw new Error('Invalid project path');
        }
        
        // Verify the project path exists
        if (!fs.existsSync(projectPath)) {
            log('error', `Project path does not exist: ${projectPath}`);
            throw new Error('Project directory does not exist');
        }
        
        const indexPath = path.join(__dirname, 'src/renderer/index.html');
        log('info', `Loading index page from: ${indexPath} with project: ${projectPath}`);
        
        if (!fs.existsSync(indexPath)) {
            log('error', `Index page not found at: ${indexPath}`);
            throw new Error('Application error: index.html not found');
        }
        
        mainWindow.loadFile(indexPath, {
            query: { project: encodeURIComponent(projectPath) }
        });
        log('info', 'Project opened successfully');
        
        return true;
    } catch (error) {
        return handleError('opening project', error);
    }
});

// Validate project structure
ipcMain.handle('project:validate', async (event, projectPath) => {
    log('info', `IPC: project:validate called with path: "${projectPath}"`);
    
    try {
        if (!projectPath || typeof projectPath !== 'string') {
            log('error', 'Invalid project path provided for validation');
            return false;
        }
        
        const projectConfigPath = path.join(projectPath, 'project.json');
        const isValid = fs.existsSync(projectConfigPath);
        
        log('info', `Project validation result for ${projectPath}: ${isValid}`);
        return isValid;
    } catch (error) {
        handleError('validating project', error);
        return false;
    }
});

// Get recent projects (simplified - just return empty array for now)
ipcMain.handle('project:getRecent', async () => {
    log('info', 'IPC: project:getRecent called');
    return [];
});

// Utility functions for file operations
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        log('info', `Created directory: ${dirPath}`);
    }
    return dirPath;
}

function writeJsonFile(filePath, data) {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
    log('info', `Wrote JSON file: ${filePath}`);
    return filePath;
}

function readJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        handleError(`reading JSON file ${filePath}`, error);
        return null;
    }
}

function writeTextFile(filePath, content) {
    fs.writeFileSync(filePath, content || '', 'utf8');
    log('info', `Wrote text file: ${filePath}`);
    return filePath;
}

function readTextFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        handleError(`reading text file ${filePath}`, error);
        return '';
    }
}

// Utility function to ensure a metadata.json file exists for a directory
function ensureMetadataFile(dirPath) {
    log('info', `Ensuring metadata file exists for: ${dirPath}`);
    const metadataPath = path.join(dirPath, 'metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
        // Create a new metadata file
        const metadata = {
            files: []
        };
        writeJsonFile(metadataPath, metadata);
        log('info', `Created new metadata file at: ${metadataPath}`);
    }
    
    return metadataPath;
}

// Get metadata for a directory
function getDirectoryMetadata(dirPath) {
    const metadataPath = ensureMetadataFile(dirPath);
    try {
        const metadataContent = fs.readFileSync(metadataPath, 'utf8');
        return JSON.parse(metadataContent);
    } catch (error) {
        log('error', `Error reading metadata file: ${error.message}`);
        // Return empty metadata if there's an error
        return { files: [] };
    }
}

// Save metadata for a directory
function saveDirectoryMetadata(dirPath, metadata) {
    const metadataPath = path.join(dirPath, 'metadata.json');
    writeJsonFile(metadataPath, metadata);
    log('info', `Updated metadata file at: ${metadataPath}`);
}

// Add a file to the metadata
function addFileToMetadata(dirPath, displayName, fileName) {
    const metadata = getDirectoryMetadata(dirPath);
    const now = new Date().toISOString();
    
    metadata.files.push({
        displayName,
        fileName,
        created: now,
        lastModified: now
    });
    
    saveDirectoryMetadata(dirPath, metadata);
    log('info', `Added file "${fileName}" with display name "${displayName}" to metadata`);
}

// Update a file in the metadata
function updateFileInMetadata(dirPath, oldDisplayName, newDisplayName) {
    const metadata = getDirectoryMetadata(dirPath);
    const now = new Date().toISOString();
    
    const fileEntry = metadata.files.find(file => file.displayName === oldDisplayName);
    if (fileEntry) {
        fileEntry.displayName = newDisplayName;
        fileEntry.lastModified = now;
        saveDirectoryMetadata(dirPath, metadata);
        log('info', `Updated file "${fileEntry.fileName}" display name from "${oldDisplayName}" to "${newDisplayName}" in metadata`);
        return fileEntry.fileName;
    }
    
    log('warn', `File with display name "${oldDisplayName}" not found in metadata`);
    return null;
}

// Get file name from display name
function getFileNameFromDisplayName(dirPath, displayName) {
    const metadata = getDirectoryMetadata(dirPath);
    const fileEntry = metadata.files.find(file => file.displayName === displayName);
    
    if (fileEntry) {
        return fileEntry.fileName;
    }
    
    log('warn', `File with display name "${displayName}" not found in metadata`);
    return null;
}

// Get display name from file name
function getDisplayNameFromFileName(dirPath, fileName) {
    const metadata = getDirectoryMetadata(dirPath);
    const fileEntry = metadata.files.find(file => file.fileName === fileName);
    
    if (fileEntry) {
        return fileEntry.displayName;
    }
    
    log('warn', `File with name "${fileName}" not found in metadata`);
    return null;
}

// Remove a file from the metadata
function removeFileFromMetadata(dirPath, displayName) {
    const metadata = getDirectoryMetadata(dirPath);
    const fileIndex = metadata.files.findIndex(file => file.displayName === displayName);
    
    if (fileIndex !== -1) {
        const removedFile = metadata.files.splice(fileIndex, 1)[0];
        saveDirectoryMetadata(dirPath, metadata);
        log('info', `Removed file "${removedFile.fileName}" with display name "${displayName}" from metadata`);
        return removedFile.fileName;
    }
    
    log('warn', `File with display name "${displayName}" not found in metadata`);
    return null;
}

// Get Book Chapters
ipcMain.handle('file:getChapters', async (event, projectPath) => {
    log('info', `IPC: file:getChapters called for project: ${projectPath}`);
    
    try {
        const chaptersDir = path.join(projectPath, 'Book Chapters');
        ensureDirectoryExists(chaptersDir);
        
        const items = fs.readdirSync(chaptersDir);
        const chapters = [];
        
        for (const item of items) {
            const itemPath = path.join(chaptersDir, item);
            const stats = fs.statSync(itemPath);
            
            // Only include directories
            if (stats.isDirectory()) {
                const metadataPath = path.join(itemPath, 'metadata.json');
                const contentPath = path.join(itemPath, 'content.txt');
                const descriptionPath = path.join(itemPath, 'description.txt');
                
                if (fs.existsSync(metadataPath)) {
                    // Read the metadata
                    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                    
                    chapters.push({
                        name: metadata.name,
                        path: itemPath,
                        metadataPath: metadataPath,
                        contentPath: contentPath,
                        descriptionPath: descriptionPath,
                        type: 'chapter'
                    });
                }
            }
        }
        
        // Sort chapters by name
        chapters.sort((a, b) => a.name.localeCompare(b.name));
        
        log('info', `Found ${chapters.length} chapters`);
        return chapters;
    } catch (error) {
        return handleError('getting chapters', error);
    }
});

// Create a new chapter
ipcMain.handle('file:createChapter', async (event, projectPath, chapterName) => {
    log('info', `IPC: file:createChapter called with name: "${chapterName}"`);
    
    try {
        const chaptersDir = path.join(projectPath, 'Book Chapters');
        ensureDirectoryExists(chaptersDir);
        
        // Create a directory-friendly name
        const dirName = chapterName.replace(/[^a-z0-9]/gi, '_');
        const chapterDir = path.join(chaptersDir, dirName);
        
        if (fs.existsSync(chapterDir)) {
            throw new Error(`A chapter named "${chapterName}" already exists`);
        }
        
        // Create chapter directory and images subdirectory
        ensureDirectoryExists(chapterDir);
        ensureDirectoryExists(path.join(chapterDir, 'images'));
        
        // Create metadata file
        const metadata = {
            name: chapterName,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            description: ''
        };
        
        const metadataPath = path.join(chapterDir, 'metadata.json');
        writeJsonFile(metadataPath, metadata);
        
        // Create a chapter content text file
        const contentPath = path.join(chapterDir, 'content.txt');
        writeTextFile(contentPath, '');
        
        // Create a description text file
        const descriptionPath = path.join(chapterDir, 'description.txt');
        writeTextFile(descriptionPath, '');
        
        return chapterDir;
    } catch (error) {
        return handleError('creating chapter', error);
    }
});

// Get Characters
ipcMain.handle('file:getCharacters', async (event, projectPath) => {
    log('info', `IPC: file:getCharacters called for project: ${projectPath}`);
    
    try {
        const charactersDir = path.join(projectPath, 'Characters');
        ensureDirectoryExists(charactersDir);
        
        const directories = fs.readdirSync(charactersDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
            
        const characters = [];
        
        for (const dirName of directories) {
            const characterDir = path.join(charactersDir, dirName);
            const metadataPath = path.join(characterDir, 'metadata.json');
            
            if (fs.existsSync(metadataPath)) {
                const metadata = readJsonFile(metadataPath);
                if (metadata) {
                    characters.push({
                        name: metadata.name || dirName,
                        path: characterDir,
                        metadataPath: metadataPath,
                        type: 'character'
                    });
                }
            }
        }
        
        log('info', `Found ${characters.length} characters`);
        return characters;
    } catch (error) {
        return handleError('getting characters', error);
    }
});

// Create a new Character
ipcMain.handle('file:createCharacter', async (event, projectPath, characterName) => {
    log('info', `IPC: file:createCharacter called with name: "${characterName}"`);
    
    try {
        const charactersDir = path.join(projectPath, 'Characters');
        ensureDirectoryExists(charactersDir);
        
        // Create a directory-friendly name
        const dirName = characterName.replace(/[^a-z0-9]/gi, '_');
        const characterDir = path.join(charactersDir, dirName);
        
        if (fs.existsSync(characterDir)) {
            throw new Error(`A character named "${characterName}" already exists`);
        }
        
        // Create character directory and images subdirectory
        ensureDirectoryExists(characterDir);
        ensureDirectoryExists(path.join(characterDir, 'images'));
        
        // Create metadata file
        const metadata = {
            name: characterName,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            description: '',
            attributes: {}
        };
        
        const metadataPath = path.join(characterDir, 'metadata.json');
        writeJsonFile(metadataPath, metadata);
        
        // Create a character profile text file
        const profilePath = path.join(characterDir, 'profile.txt');
        writeTextFile(profilePath, '');
        
        return characterDir;
    } catch (error) {
        return handleError('creating character', error);
    }
});

// Get World Lore Items
ipcMain.handle('file:getLoreItems', async (event, projectPath) => {
    log('info', `IPC: file:getLoreItems called for project: ${projectPath}`);
    
    try {
        const loreDir = path.join(projectPath, 'World Lore');
        ensureDirectoryExists(loreDir);
        
        const directories = fs.readdirSync(loreDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
            
        const loreItems = [];
        
        for (const dirName of directories) {
            const itemDir = path.join(loreDir, dirName);
            const metadataPath = path.join(itemDir, 'metadata.json');
            
            if (fs.existsSync(metadataPath)) {
                const metadata = readJsonFile(metadataPath);
                if (metadata) {
                    loreItems.push({
                        name: metadata.name || dirName,
                        path: itemDir,
                        metadataPath: metadataPath,
                        type: 'lore'
                    });
                }
            }
        }
        
        log('info', `Found ${loreItems.length} lore items`);
        return loreItems;
    } catch (error) {
        return handleError('getting lore items', error);
    }
});

// Create a new World Lore Item
ipcMain.handle('file:createLoreItem', async (event, projectPath, itemName) => {
    log('info', `IPC: file:createLoreItem called with name: "${itemName}"`);
    
    try {
        const loreDir = path.join(projectPath, 'World Lore');
        ensureDirectoryExists(loreDir);
        
        // Create a directory-friendly name
        const dirName = itemName.replace(/[^a-z0-9]/gi, '_');
        const itemDir = path.join(loreDir, dirName);
        
        if (fs.existsSync(itemDir)) {
            throw new Error(`A lore item named "${itemName}" already exists`);
        }
        
        // Create lore item directory and images subdirectory
        ensureDirectoryExists(itemDir);
        ensureDirectoryExists(path.join(itemDir, 'images'));
        
        // Create metadata file
        const metadata = {
            name: itemName,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            description: '',
            category: ''
            // No attributes for lore items as per user request
        };
        
        const metadataPath = path.join(itemDir, 'metadata.json');
        writeJsonFile(metadataPath, metadata);
        
        // Create a lore item content text file
        const contentPath = path.join(itemDir, 'content.txt');
        writeTextFile(contentPath, '');
        
        return itemDir;
    } catch (error) {
        return handleError('creating lore item', error);
    }
});

// Get Notes
ipcMain.handle('file:getNotes', async (event, projectPath) => {
    log('info', `IPC: file:getNotes called for project: ${projectPath}`);
    
    try {
        const notesDir = path.join(projectPath, 'Notes');
        ensureDirectoryExists(notesDir);
        
        const items = fs.readdirSync(notesDir);
        const notes = [];
        
        for (const item of items) {
            const itemPath = path.join(notesDir, item);
            const stats = fs.statSync(itemPath);
            
            // Only include directories
            if (stats.isDirectory()) {
                const metadataPath = path.join(itemPath, 'metadata.json');
                const contentPath = path.join(itemPath, 'content.txt');
                
                if (fs.existsSync(metadataPath)) {
                    // Read the metadata
                    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                    
                    notes.push({
                        name: metadata.name,
                        path: itemPath,
                        metadataPath: metadataPath,
                        contentPath: contentPath,
                        type: 'note'
                    });
                }
            }
        }
        
        // Sort notes by name
        notes.sort((a, b) => a.name.localeCompare(b.name));
        
        log('info', `Found ${notes.length} notes`);
        return notes;
    } catch (error) {
        return handleError('getting notes', error);
    }
});

// Create a new note
ipcMain.handle('file:createNote', async (event, projectPath, noteName) => {
    log('info', `IPC: file:createNote called with name: "${noteName}"`);
    
    try {
        const notesDir = path.join(projectPath, 'Notes');
        ensureDirectoryExists(notesDir);
        
        // Create a directory-friendly name
        const dirName = noteName.replace(/[^a-z0-9]/gi, '_');
        const noteDir = path.join(notesDir, dirName);
        
        if (fs.existsSync(noteDir)) {
            throw new Error(`A note named "${noteName}" already exists`);
        }
        
        // Create note directory and images subdirectory
        ensureDirectoryExists(noteDir);
        ensureDirectoryExists(path.join(noteDir, 'images'));
        
        // Create metadata file
        const metadata = {
            name: noteName,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        const metadataPath = path.join(noteDir, 'metadata.json');
        writeJsonFile(metadataPath, metadata);
        
        // Create a note content text file
        const contentPath = path.join(noteDir, 'content.txt');
        writeTextFile(contentPath, '');
        
        return noteDir;
    } catch (error) {
        return handleError('creating note', error);
    }
});

// Read a file
ipcMain.handle('file:readFile', async (event, filePath) => {
    log('info', `IPC: file:readFile called for: ${filePath}`);
    
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        if (filePath.endsWith('.json')) {
            return readJsonFile(filePath);
        } else {
            return readTextFile(filePath);
        }
    } catch (error) {
        return handleError('reading file', error);
    }
});

// Save a file
ipcMain.handle('file:saveFile', async (event, content, filePath) => {
    log('info', `IPC: file:saveFile called for: ${filePath}`);
    
    try {
        if (!filePath) {
            throw new Error('No file path provided');
        }
        
        if (filePath.endsWith('.json') && typeof content !== 'string') {
            writeJsonFile(filePath, content);
        } else {
            writeTextFile(filePath, content);
        }
        
        return true;
    } catch (error) {
        return handleError('saving file', error);
    }
});

// Rename a file or directory
ipcMain.handle('file:rename', async (event, oldPath, newName) => {
    log('info', `IPC: file:rename called from ${oldPath} to ${newName}`);
    
    try {
        if (!fs.existsSync(oldPath)) {
            throw new Error(`Path does not exist: ${oldPath}`);
        }
        
        const stats = fs.statSync(oldPath);
        const isDirectory = stats.isDirectory();
        const parentDir = path.dirname(oldPath);
        const oldName = path.basename(oldPath);
        
        // Handle different file types
        if (parentDir.includes('Book Chapters') && !isDirectory) {
            // This is a chapter file, update metadata instead of renaming
            const chaptersDir = parentDir;
            const oldDisplayName = getDisplayNameFromFileName(chaptersDir, oldName);
            
            if (oldDisplayName) {
                // Update the display name in metadata
                updateFileInMetadata(chaptersDir, oldDisplayName, newName);
                
                // Return success with the same path (file not actually renamed)
                return {
                    success: true,
                    path: oldPath,
                    message: `Updated chapter display name to "${newName}" in metadata`
                };
            } else {
                // If not in metadata, add it
                addFileToMetadata(chaptersDir, newName, oldName);
                
                // Return success with the same path
                return {
                    success: true,
                    path: oldPath,
                    message: `Added chapter "${newName}" to metadata`
                };
            }
        } else if (parentDir.includes('Notes') && !isDirectory) {
            // This is a note file, update metadata instead of renaming
            const notesDir = parentDir;
            const oldDisplayName = getDisplayNameFromFileName(notesDir, oldName);
            
            if (oldDisplayName) {
                // Update the display name in metadata
                updateFileInMetadata(notesDir, oldDisplayName, newName);
                
                // Return success with the same path (file not actually renamed)
                return {
                    success: true,
                    path: oldPath,
                    message: `Updated note display name to "${newName}" in metadata`
                };
            } else {
                // If not in metadata, add it
                addFileToMetadata(notesDir, newName, oldName);
                
                // Return success with the same path
                return {
                    success: true,
                    path: oldPath,
                    message: `Added note "${newName}" to metadata`
                };
            }
        } else {
            // For other file types (characters, lore), perform actual rename
            let newPath;
            
            if (isDirectory) {
                // For directories (characters, lore items)
                const dirName = newName.replace(/[^a-z0-9]/gi, '_');
                newPath = path.join(parentDir, dirName);
                
                // Update metadata.json if this is a character or lore item
                if (oldPath.includes('Characters') || oldPath.includes('World Lore')) {
                    const metadataPath = path.join(oldPath, 'metadata.json');
                    if (fs.existsSync(metadataPath)) {
                        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                        metadata.name = newName;
                        metadata.lastModified = new Date().toISOString();
                        
                        // Write updated metadata before renaming
                        writeJsonFile(metadataPath, metadata);
                    }
                }
            } else {
                // For regular files
                const ext = path.extname(oldPath);
                const baseName = newName.replace(/[^a-z0-9]/gi, '_');
                newPath = path.join(parentDir, baseName + ext);
            }
            
            // Check if the new path already exists
            if (fs.existsSync(newPath) && newPath !== oldPath) {
                throw new Error(`A file or directory named "${newName}" already exists`);
            }
            
            // Perform the rename
            fs.renameSync(oldPath, newPath);
            log('info', `Renamed ${oldPath} to ${newPath}`);
            
            return {
                success: true,
                path: newPath,
                message: `Renamed successfully to "${newName}"`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

// Check if a name already exists in a directory
ipcMain.handle('file:checkNameExists', async (event, dirPath, name, fileType) => {
    log('info', `IPC: file:checkNameExists called for ${name} in ${dirPath}`);
    
    try {
        if (!fs.existsSync(dirPath)) {
            throw new Error(`Directory not found: ${dirPath}`);
        }
        
        const files = fs.readdirSync(dirPath);
        let exists = false;
        
        if (fileType === 'chapter' || fileType === 'note') {
            // For chapters and notes, check if a file with the name exists
            const fileName = `${name}.txt`;
            exists = files.includes(fileName);
        } else {
            // For characters and lore items, check if directory exists
            const dirName = name.replace(/[^a-z0-9]/gi, '_');
            exists = files.includes(dirName);
        }
        
        return { exists };
    } catch (error) {
        return handleError('checking name existence', error);
    }
});

// Get next available name (e.g., "Chapter 2" if "Chapter 1" exists)
ipcMain.handle('file:getNextAvailableName', async (event, dirPath, basePrefix, fileType) => {
    log('info', `IPC: file:getNextAvailableName called for ${basePrefix} in ${dirPath}`);
    
    try {
        if (!fs.existsSync(dirPath)) {
            throw new Error(`Directory not found: ${dirPath}`);
        }
        
        const files = fs.readdirSync(dirPath);
        let highestNumber = 0;
        const regex = new RegExp(`^${basePrefix}\\s*(\\d+)`);
        
        for (const file of files) {
            // Skip non-relevant files
            if (fileType === 'chapter' || fileType === 'note') {
                if (!file.endsWith('.txt')) continue;
            } else {
                // For characters and lore items, check directories
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                if (!stats.isDirectory()) continue;
            }
            
            // Extract the basename without extension
            const baseName = fileType === 'chapter' || fileType === 'note' 
                ? path.basename(file, '.txt') 
                : file;
            
            // Check if the name matches our pattern and extract the number
            const match = baseName.match(regex);
            if (match && match[1]) {
                const num = parseInt(match[1], 10);
                if (num > highestNumber) {
                    highestNumber = num;
                }
            }
        }
        
        // Return the next number
        const nextNumber = highestNumber + 1;
        return { 
            nextName: `${basePrefix} ${nextNumber}`,
            nextNumber
        };
    } catch (error) {
        return handleError('getting next available name', error);
    }
});