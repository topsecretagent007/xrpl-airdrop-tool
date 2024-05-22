const { app, Menu, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const showdown = require('showdown');
const converter = new showdown.Converter();

let win

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'airdrop.ico')
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  const fileMenu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Export log',
          click: () => {
            win.webContents.executeJavaScript('document.getElementById("consoleLog").value')
              .then(logContent => {
                if (logContent) {
                  dialog.showSaveDialog(win, {
                    title: 'Save Activity Log',
                    defaultPath: app.getPath('documents'),
                    filters: [
                      { name: 'Text Files', extensions: ['txt'] }
                    ]
                  }).then(result => {
                    if (!result.canceled) {
                      fs.writeFile(result.filePath, logContent, { encoding: 'utf-8' }, err => {
                        if (err) {
                          console.error('Error saving log file:', err)
                          dialog.showMessageBox(win, {
                            type: 'error',
                            message: 'Error saving log file',
                            detail: err.message
                          })
                        }
                      })
                    }
                  })
                }
              })
              .catch(error => {
                console.error('Error executing JavaScript:', error)
              });
          }
        },
        {
          label: 'Preferences...',
          click: () => {
            const preferencesWindow = new BrowserWindow({
              width: 360,
              height: 360,
              resizable: false,
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
              },
              autoHideMenuBar: true
            })
            preferencesWindow.loadFile('preferences.html')
            preferencesWindow.on('close', () => {
              win.reload()
            })
          }
        },
        {
          label: 'Exit',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          click: () => win.minimize()
        },
        {
          label: 'Maximize',
          click: () => {
            if (win.isMaximized()) {
              win.restore()
            } else {
              win.maximize()
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Instructions',
          click: () => {
            const instructionsWindow = new BrowserWindow({
              width: 800,
              height: 800,
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
              },
              autoHideMenuBar: true
            })
            const mdPath = path.join(__dirname, 'user_guide.md');
            fs.readFile(mdPath, 'utf8', (err, data) => {
              if (err) {
                console.error(err);
                return;
              }
              const html = converter.makeHtml(data);
              instructionsWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
            });
          }
        },
        {
          label: 'About',
          click: () => {
            let aboutWindow = new BrowserWindow({
              width: 400,
              height: 500,
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
              },
              resizable: false,
              autoHideMenuBar: true,
              scrollBounce: false
            })

            aboutWindow.loadFile(path.join(__dirname, 'about.html'))

            aboutWindow.on('closed', () => {
              aboutWindow = null
            })
          }
        }
      ]
    }
  ])
  Menu.setApplicationMenu(fileMenu)
  createWindow()
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})


