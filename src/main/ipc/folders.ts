import { ipcMain } from 'electron'
import { join, normalize, resolve } from 'path'
import { readdirSync, mkdirSync, rmdirSync } from 'fs'
import { getGamesPath, isDirectory, ensureGamesDirectory } from './utils'

/**
 * Register folder management IPC handlers
 */
export function registerFolderHandlers(): void {
  // Get list of folders
  ipcMain.handle('get-folders', () => {
    try {
      const gamesPath = getGamesPath()
      if (!isDirectory(gamesPath)) {
        ensureGamesDirectory()
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
      ensureGamesDirectory()

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
}

