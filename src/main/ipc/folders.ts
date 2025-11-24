import { ipcMain } from 'electron'
import { join, normalize, resolve } from 'path'
import { readdirSync, mkdirSync, rmdirSync } from 'fs'
import {
  getImageGamesPath,
  getQuizGamesPath,
  isDirectory,
  ensureImageGamesDirectory,
  ensureQuizGamesDirectory
} from './utils'

/**
 * Register folder management IPC handlers
 */
export function registerFolderHandlers(): void {
  // Get list of image folders
  ipcMain.handle('get-folders', () => {
    try {
      const imagePath = getImageGamesPath()
      ensureImageGamesDirectory()
      if (!isDirectory(imagePath)) {
        return []
      }
      const folders = readdirSync(imagePath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => ({
          id: dirent.name,
          title: dirent.name
        }))
      return folders
    } catch (error) {
      console.error('Error reading image folders:', error)
      return []
    }
  })

  // Create image folder
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

      const imagePath = getImageGamesPath()
      ensureImageGamesDirectory()

      const folderPath = normalize(resolve(join(imagePath, sanitizedFolderName)))

      // Verify that the folder path is within imagePath (security check)
      if (!folderPath.startsWith(imagePath)) {
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
      console.error('Error creating image folder:', error)
      throw error
    }
  })

  // Delete image folder
  ipcMain.handle('delete-folder', async (_, folderName: string) => {
    try {
      const imagePath = getImageGamesPath()
      const folderPath = normalize(resolve(join(imagePath, folderName)))

      // Verify that the folder path is within imagePath (security check)
      if (!folderPath.startsWith(imagePath)) {
        throw new Error('Invalid folder path')
      }

      if (!isDirectory(folderPath)) {
        throw new Error('Folder does not exist')
      }

      rmdirSync(folderPath, { recursive: true })
      return { success: true }
    } catch (error) {
      console.error('Error deleting image folder:', error)
      throw error
    }
  })

  // Quiz folder management IPC handlers
  // Get list of quiz folders
  ipcMain.handle('get-quiz-folders', () => {
    try {
      const quizPath = getQuizGamesPath()
      ensureQuizGamesDirectory()
      if (!isDirectory(quizPath)) {
        return []
      }
      const folders = readdirSync(quizPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => ({
          id: dirent.name,
          title: dirent.name
        }))
      return folders
    } catch (error) {
      console.error('Error reading quiz folders:', error)
      return []
    }
  })

  // Create quiz folder
  ipcMain.handle('create-quiz-folder', async (_, folderName: string) => {
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

      const quizPath = getQuizGamesPath()
      ensureQuizGamesDirectory()

      const folderPath = normalize(resolve(join(quizPath, sanitizedFolderName)))

      // Verify that the folder path is within quizPath (security check)
      if (!folderPath.startsWith(quizPath)) {
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
      console.error('Error creating quiz folder:', error)
      throw error
    }
  })

  // Delete quiz folder
  ipcMain.handle('delete-quiz-folder', async (_, folderName: string) => {
    try {
      const quizPath = getQuizGamesPath()
      const folderPath = normalize(resolve(join(quizPath, folderName)))

      // Verify that the folder path is within quizPath (security check)
      if (!folderPath.startsWith(quizPath)) {
        throw new Error('Invalid folder path')
      }

      if (!isDirectory(folderPath)) {
        throw new Error('Folder does not exist')
      }

      rmdirSync(folderPath, { recursive: true })
      return { success: true }
    } catch (error) {
      console.error('Error deleting quiz folder:', error)
      throw error
    }
  })
}
