// Preload script
const { contextBridge, ipcRenderer } = require('electron');

// Helper function for safer IPC invocation with error handling
async function safeIpcInvoke(channel, ...args) {
    try {
        console.log(`IPC: Invoking ${channel} with args:`, ...args);
        const result = await ipcRenderer.invoke(channel, ...args);
        console.log(`IPC: ${channel} result:`, result);
        return result;
    } catch (error) {
        console.error(`IPC Error in ${channel}:`, error);
        throw error; // Re-throw to allow handling in renderer
    }
}

// Expose a limited API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Application info
    appName: 'Writer\'s Studio',

    // Project management
    createProject: (name, location) => safeIpcInvoke('project:create', name, location),
    openProject: (projectPath) => safeIpcInvoke('project:open', projectPath),
    validateProject: (projectPath) => safeIpcInvoke('project:validate', projectPath),
    getRecentProjects: () => safeIpcInvoke('project:getRecent'),
    getDefaultProjectsPath: () => safeIpcInvoke('project:getDefaultPath'),
    
    // File system operations - dialogs
    selectDirectory: () => safeIpcInvoke('dialog:selectDirectory'),
    
    // File operations - Book Chapters
    getChapters: (projectPath) => safeIpcInvoke('file:getChapters', projectPath),
    createChapter: (projectPath, name) => safeIpcInvoke('file:createChapter', projectPath, name),
    
    // File operations - Characters
    getCharacters: (projectPath) => safeIpcInvoke('file:getCharacters', projectPath),
    createCharacter: (projectPath, name) => safeIpcInvoke('file:createCharacter', projectPath, name),
    
    // File operations - World Lore
    getLoreItems: (projectPath) => safeIpcInvoke('file:getLoreItems', projectPath),
    createLoreItem: (projectPath, name) => safeIpcInvoke('file:createLoreItem', projectPath, name),
    
    // File operations - Notes
    getNotes: (projectPath) => safeIpcInvoke('file:getNotes', projectPath),
    createNote: (projectPath, name) => safeIpcInvoke('file:createNote', projectPath, name),
    
    // General file operations
    readFile: (filePath) => safeIpcInvoke('file:readFile', filePath),
    saveFile: (content, filePath) => safeIpcInvoke('file:saveFile', content, filePath),
    
    // File management operations
    renameFile: (oldPath, newName) => safeIpcInvoke('file:rename', oldPath, newName),
    checkNameExists: (dirPath, name, fileType) => safeIpcInvoke('file:checkNameExists', dirPath, name, fileType),
    getNextAvailableName: (dirPath, basePrefix, fileType) => safeIpcInvoke('file:getNextAvailableName', dirPath, basePrefix, fileType)
});

console.log('Preload script initialized, electron API exposed to renderer process');