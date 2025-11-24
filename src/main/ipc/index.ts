import { BrowserWindow } from 'electron'
import { registerFolderHandlers } from './folders'
import { registerImageHandlers } from './images'
import { registerGameHandlers } from './game'
import { registerAdminWindowHandlers } from './adminWindow'
import { getAdminWindow } from '../windows/adminWindow'

/**
 * Register all IPC handlers
 * @param mainWindow - Main window instance
 */
export function registerIpcHandlers(mainWindow: BrowserWindow | null): void {
  // Folder management handlers
  registerFolderHandlers()

  // Image management handlers
  registerImageHandlers()

  // Game control handlers
  registerGameHandlers(mainWindow, getAdminWindow)

  // Admin window handlers
  registerAdminWindowHandlers(mainWindow)
}

