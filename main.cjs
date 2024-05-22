//main.cjs
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const airdrop = require('./airdrop.cjs')
// Set environment variable to suppress no config warning
process.env.SUPPRESS_NO_CONFIG_WARNING = 'y'

// Define main function from airdrop module
let main = airdrop.main

// Function to create a new browser window
function createWindow() {
  // Create a new browser window with specified dimensions and settings
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Load preload script from specified path
      preload: path.join(__dirname, 'preload.js'),
      // Enable node integration and disable context isolation
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // Load index.html file into the browser window
  win.loadFile('index.html')
}

// Event handler for when the app is ready
app.whenReady().then(() => {
  // Create a new browser window
  createWindow()

  // Event handler for when the app is activated (e.g., when the user clicks the dock icon on macOS)
  app.on('activate', function () {
    // If there are no open windows, create a new one
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Event handler for 'executeMain' IPC message
ipcMain.on('executeMain', () => {
  // Check if main function is defined and callable
  if (typeof main === 'function') {
    // Execute the main function
    main()
  } else {
    // Log an error if main function is not defined or not a function
    console.error('main is not a function')
  }
})

// Event handler for when all windows are closed
app.on('window-all-closed', function () {
  // If the platform is not macOS, quit the app
  if (process.platform!== 'darwin') app.quit()
})