import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join, normalize, resolve } from 'path'
import { existsSync, mkdirSync, readdirSync, rmdirSync, statSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Folder management IPC handlers
  const getGamesPath = (): string => {
    let gamesPath: string
    if (is.dev) {
      // Development: use project root/resources/games
      // __dirname is in out/main, so we need to go up to project root
      const projectRoot = join(__dirname, '../../')
      gamesPath = join(projectRoot, 'resources/games')
    } else {
      // Production: use app resources/games
      gamesPath = join(process.resourcesPath, 'resources/games')
    }
    // Normalize path to handle relative paths and resolve symlinks
    gamesPath = normalize(resolve(gamesPath))
    return gamesPath
  }

  // Helper function to check if path is a directory
  const isDirectory = (path: string): boolean => {
    try {
      return existsSync(path) && statSync(path).isDirectory()
    } catch {
      return false
    }
  }

  // Get list of folders
  ipcMain.handle('get-folders', () => {
    try {
      const gamesPath = getGamesPath()
      if (!isDirectory(gamesPath)) {
        mkdirSync(gamesPath, { recursive: true })
        return []
      }
      const folders = readdirSync(gamesPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => ({
          id: dirent.name,
          title: dirent.name
        }))
      return folders
    } catch (error) {
      console.error('Error reading folders:', error)
      return []
    }
  })

  // Create folder
  ipcMain.handle('create-folder', async (_, folderName: string) => {
    try {
      // Validate folder name
      if (!folderName || !folderName.trim()) {
        throw new Error('Folder name cannot be empty')
      }

      // Sanitize folder name - remove invalid characters
      const sanitizedFolderName = folderName.trim().replace(/[<>:"/\\|?*]/g, '')
      if (!sanitizedFolderName) {
        throw new Error('Folder name contains only invalid characters')
      }

      const gamesPath = getGamesPath()

      // Ensure games directory exists
      if (!isDirectory(gamesPath)) {
        mkdirSync(gamesPath, { recursive: true })
      }

      const folderPath = normalize(resolve(join(gamesPath, sanitizedFolderName)))

      // Verify that the folder path is within gamesPath (security check)
      if (!folderPath.startsWith(gamesPath)) {
        throw new Error('Invalid folder path')
      }

      // Create folder
      mkdirSync(folderPath, { recursive: true })

      // Verify folder was created
      if (!isDirectory(folderPath)) {
        throw new Error('Failed to create folder')
      }

      return { success: true, id: sanitizedFolderName, title: sanitizedFolderName }
    } catch (error) {
      console.error('Error creating folder:', error)
      throw error
    }
  })

  // Delete folder
  ipcMain.handle('delete-folder', async (_, folderName: string) => {
    try {
      const gamesPath = getGamesPath()
      const folderPath = normalize(resolve(join(gamesPath, folderName)))

      // Verify that the folder path is within gamesPath (security check)
      if (!folderPath.startsWith(gamesPath)) {
        throw new Error('Invalid folder path')
      }

      if (!isDirectory(folderPath)) {
        throw new Error('Folder does not exist')
      }

      rmdirSync(folderPath, { recursive: true })
      return { success: true }
    } catch (error) {
      console.error('Error deleting folder:', error)
      throw error
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
