import { ipcMain } from 'electron'
import { join, normalize, resolve, extname } from 'path'
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs'
import { getOrCreateQuizFolderPath, getQuizGamesPath } from './utils'

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp'
}

/**
 * Register quiz image management IPC handlers
 */
export function registerQuizImageHandlers(): void {
  // Save quiz image (id-based filename)
  ipcMain.handle(
    'save-quiz-image',
    async (_, folderName: string, id: string, base64Data: string, originalFileName: string) => {
      try {
        const folderPath = getOrCreateQuizFolderPath(folderName)

        // Get extension from original file name
        const ext = extname(originalFileName).toLowerCase() || '.png'
        if (!IMAGE_EXTENSIONS.includes(ext)) {
          throw new Error('Invalid image format')
        }

        // Validate id
        if (!id || !id.trim()) {
          throw new Error('Invalid id')
        }

        // Remove data URL prefix if present
        const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Content, 'base64')

        // Create filename: {id}.{ext}
        const fileName = `${id}${ext}`
        const filePath = normalize(resolve(join(folderPath, fileName)))

        // Security check
        if (!filePath.startsWith(folderPath)) {
          throw new Error('Invalid file path')
        }

        // Write file
        writeFileSync(filePath, buffer)

        return { success: true, fileName }
      } catch (error) {
        console.error('Error saving quiz image:', error)
        throw error
      }
    }
  )

  // Delete quiz image
  ipcMain.handle('delete-quiz-image', async (_, folderName: string, id: string) => {
    try {
      const quizPath = getQuizGamesPath()
      const folderPath = normalize(resolve(join(quizPath, folderName)))

      // Security check
      if (!folderPath.startsWith(quizPath)) {
        throw new Error('Invalid folder path')
      }

      // Try to find image file with any extension
      let deleted = false
      for (const ext of IMAGE_EXTENSIONS) {
        const fileName = `${id}${ext}`
        const filePath = normalize(resolve(join(folderPath, fileName)))

        // Security check
        if (!filePath.startsWith(folderPath)) {
          continue
        }

        if (existsSync(filePath)) {
          unlinkSync(filePath)
          deleted = true
          break
        }
      }

      if (!deleted) {
        throw new Error('Image file not found')
      }

      return { success: true }
    } catch (error) {
      console.error('Error deleting quiz image:', error)
      throw error
    }
  })

  // Get quiz image as base64
  ipcMain.handle('get-quiz-image-base64', async (_, folderName: string, id: string) => {
    try {
      const quizPath = getQuizGamesPath()
      const folderPath = normalize(resolve(join(quizPath, folderName)))

      // Security check
      if (!folderPath.startsWith(quizPath)) {
        throw new Error('Invalid folder path')
      }

      // Try to find image file with any extension
      for (const ext of IMAGE_EXTENSIONS) {
        const fileName = `${id}${ext}`
        const filePath = normalize(resolve(join(folderPath, fileName)))

        // Security check
        if (!filePath.startsWith(folderPath)) {
          continue
        }

        if (existsSync(filePath)) {
          // Read file as buffer
          const buffer = readFileSync(filePath)
          // Convert to base64
          const base64 = buffer.toString('base64')
          const mimeType = MIME_TYPES[ext] || 'image/jpeg'

          return {
            base64: `data:${mimeType};base64,${base64}`,
            exists: true,
            fileName: fileName
          }
        }
      }

      return { exists: false }
    } catch (error) {
      console.error('Error reading quiz image:', error)
      return { exists: false }
    }
  })
}
