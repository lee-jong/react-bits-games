import { ipcMain, BrowserWindow } from 'electron'

/**
 * Register game control IPC handlers
 * @param mainWindow - Main window instance
 * @param getAdminWindow - Function to get admin window instance
 */
export function registerGameHandlers(
  mainWindow: BrowserWindow | null,
  getAdminWindow: () => BrowserWindow | null
): void {
  // IPC handlers for game control (Admin -> Game)
  ipcMain.on('game-start', (_, folderName: string) => {
    // Send to main window Game page
    if (mainWindow) {
      mainWindow.webContents.send('game-start', folderName)
    }
  })

  ipcMain.on('game-next-image', () => {
    // Send to main window Game page
    if (mainWindow) {
      mainWindow.webContents.send('game-next-image')
    }
  })

  ipcMain.on('game-end', () => {
    // Send to main window Game page
    if (mainWindow) {
      mainWindow.webContents.send('game-end')
    }
  })

  // IPC handlers for game state (Game -> Admin)
  ipcMain.on('game-image-changed', (_, imageName: string) => {
    // Send to admin window
    const adminWindow = getAdminWindow()
    if (adminWindow) {
      adminWindow.webContents.send('game-image-changed', imageName)
    }
  })

  ipcMain.on(
    'game-quiz-changed',
    (_, quiz: { id: string; index: number; quiz: string; answer: string }) => {
      // Send to admin window
      const adminWindow = getAdminWindow()
      if (adminWindow) {
        adminWindow.webContents.send('game-quiz-changed', quiz)
      }
    }
  )
}
