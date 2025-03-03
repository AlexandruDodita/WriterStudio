const { app, BrowserWindow } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
    app.quit();
}

// Keep a global reference of the window object to prevent it from being garbage collected
let mainWindow;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load the index.html of the app
    mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));

    // Log the path we're trying to load to help with debugging
    console.log('Loading from path:', path.join(__dirname, 'src', 'renderer', 'index.html'));

    // Uncomment to open the DevTools by default
    // mainWindow.webContents.openDevTools();
}

// Create window when Electron has finished initialization
app.whenReady().then(createWindow);

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