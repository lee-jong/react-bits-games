import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join, normalize, resolve, extname } from 'path'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmdirSync,
  statSync,
  writeFileSync,
  unlinkSync,
  renameSync,
  readFileSync
} from 'fs'
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

  // Image management IPC handlers
  const getFolderPath = (folderName: string): string => {
    const gamesPath = getGamesPath()
    const folderPath = normalize(resolve(join(gamesPath, folderName)))

    // Security check
    if (!folderPath.startsWith(gamesPath)) {
      throw new Error('Invalid folder path')
    }

    if (!isDirectory(folderPath)) {
      throw new Error('Folder does not exist')
    }

    return folderPath
  }

  // Get list of images in folder
  ipcMain.handle('get-folder-images', async (_, folderName: string) => {
    try {
      const folderPath = getFolderPath(folderName)
      const files = readdirSync(folderPath, { withFileTypes: true })
        .filter((dirent) => dirent.isFile())
        .filter((dirent) => {
          const ext = extname(dirent.name).toLowerCase()
          return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)
        })
        .map((dirent) => {
          const filePath = join(folderPath, dirent.name)
          const stats = statSync(filePath)
          return {
            name: dirent.name,
            path: filePath,
            size: stats.size,
            modifiedAt: stats.mtimeMs
          }
        })
        .sort((a, b) => b.modifiedAt - a.modifiedAt) // Sort by modified time, newest first

      return files
    } catch (error) {
      console.error('Error reading folder images:', error)
      throw error
    }
  })

  // Save image file (base64 to file)
  ipcMain.handle(
    'save-image',
    async (_, folderName: string, fileName: string, base64Data: string) => {
      try {
        const folderPath = getFolderPath(folderName)

        // Sanitize file name
        const sanitizedFileName = fileName.replace(/[<>:"/\\|?*]/g, '')

        // Remove data URL prefix if present (e.g., "data:image/png;base64,")
        const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Content, 'base64')

        const filePath = normalize(resolve(join(folderPath, sanitizedFileName)))

        // Security check
        if (!filePath.startsWith(folderPath)) {
          throw new Error('Invalid file path')
        }

        // Write file
        writeFileSync(filePath, buffer)

        return { success: true, fileName: sanitizedFileName }
      } catch (error) {
        console.error('Error saving image:', error)
        throw error
      }
    }
  )

  // Delete image file
  ipcMain.handle('delete-image', async (_, folderName: string, fileName: string) => {
    try {
      const folderPath = getFolderPath(folderName)
      const filePath = normalize(resolve(join(folderPath, fileName)))

      // Security check
      if (!filePath.startsWith(folderPath)) {
        throw new Error('Invalid file path')
      }

      if (!existsSync(filePath)) {
        throw new Error('File does not exist')
      }

      unlinkSync(filePath)
      return { success: true }
    } catch (error) {
      console.error('Error deleting image:', error)
      throw error
    }
  })

  // Rename image file
  ipcMain.handle(
    'rename-image',
    async (_, folderName: string, oldFileName: string, newFileName: string) => {
      try {
        const folderPath = getFolderPath(folderName)

        // Sanitize new file name
        const sanitizedNewFileName = newFileName.replace(/[<>:"/\\|?*]/g, '')

        const oldFilePath = normalize(resolve(join(folderPath, oldFileName)))
        const newFilePath = normalize(resolve(join(folderPath, sanitizedNewFileName)))

        // Security check
        if (!oldFilePath.startsWith(folderPath) || !newFilePath.startsWith(folderPath)) {
          throw new Error('Invalid file path')
        }

        if (existsSync(newFilePath)) {
          throw new Error('File with new name already exists')
        }

        renameSync(oldFilePath, newFilePath)
        return { success: true, fileName: sanitizedNewFileName }
      } catch (error) {
        console.error('Error renaming image:', error)
        throw error
      }
    }
  )

  // Get image as base64
  ipcMain.handle('get-image-base64', async (_, folderName: string, fileName: string) => {
    try {
      const folderPath = getFolderPath(folderName)
      const filePath = normalize(resolve(join(folderPath, fileName)))

      // Security check
      if (!filePath.startsWith(folderPath)) {
        throw new Error('Invalid file path')
      }

      if (!existsSync(filePath)) {
        throw new Error('File does not exist')
      }

      // Read file as buffer
      const buffer = readFileSync(filePath)
      // Convert to base64
      const base64 = buffer.toString('base64')
      // Get file extension to determine MIME type
      const ext = extname(fileName).toLowerCase()
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp'
      }
      const mimeType = mimeTypes[ext] || 'image/jpeg'

      return { base64: `data:${mimeType};base64,${base64}` }
    } catch (error) {
      console.error('Error reading image:', error)
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
