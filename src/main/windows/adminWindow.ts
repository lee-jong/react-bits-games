import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let adminWindow: BrowserWindow | null = null

export function createAdminWindow(mainWindow: BrowserWindow | null, folderName: string): void {
  // Close existing admin window if exists
  if (adminWindow) {
    adminWindow.close()
  }

  adminWindow = new BrowserWindow({
    width: 400,
    height: 600,
    parent: mainWindow || undefined,
    modal: false,
    show: false,
    autoHideMenuBar: true,
    resizable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  adminWindow.on('ready-to-show', () => {
    adminWindow?.show()
  })

  adminWindow.on('closed', () => {
    adminWindow = null
  })

  // Load admin page with folderName as query parameter
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    adminWindow.loadURL(
      `${process.env['ELECTRON_RENDERER_URL']}#/image-game/admin?folder=${folderName}`
    )
  } else {
    adminWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: `#/image-game/admin?folder=${folderName}`
    })
  }
}

export function closeAdminWindow(): void {
  if (adminWindow) {
    adminWindow.close()
    adminWindow = null
  }
}

export function getAdminWindow(): BrowserWindow | null {
  return adminWindow
}

