import { ipcMain } from 'electron'
import { BrowserWindow } from 'electron'
import { createAdminWindow, closeAdminWindow } from '../windows/adminWindow'

/**
 * Register admin window IPC handlers
 * @param mainWindow - Main window instance
 */
export function registerAdminWindowHandlers(mainWindow: BrowserWindow | null): void {
  // Game Admin Window IPC handlers
  ipcMain.handle('create-admin-window', async (_, folderName: string) => {
    try {
      createAdminWindow(mainWindow, folderName)
      return { success: true }
    } catch (error) {
      console.error('Error creating admin window:', error)
      throw error
    }
  })

  ipcMain.handle('close-admin-window', async () => {
    try {
      closeAdminWindow()
      return { success: true }
    } catch (error) {
      console.error('Error closing admin window:', error)
      throw error
    }
  })
}
