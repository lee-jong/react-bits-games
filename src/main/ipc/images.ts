import { ipcMain } from 'electron'
import { join, normalize, resolve, extname } from 'path'
import {
  readdirSync,
  statSync,
  writeFileSync,
  unlinkSync,
  renameSync,
  readFileSync,
  existsSync
} from 'fs'
import { getImageFolderPath } from './utils'

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
 * Register image management IPC handlers
 */
export function registerImageHandlers(): void {
  // Get list of images in folder
  ipcMain.handle('get-folder-images', async (_, folderName: string) => {
    try {
      const folderPath = getImageFolderPath(folderName)
      const files = readdirSync(folderPath, { withFileTypes: true })
        .filter((dirent) => dirent.isFile())
        .filter((dirent) => {
          const ext = extname(dirent.name).toLowerCase()
          return IMAGE_EXTENSIONS.includes(ext)
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
        const folderPath = getImageFolderPath(folderName)

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
      const folderPath = getImageFolderPath(folderName)
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
        const folderPath = getImageFolderPath(folderName)

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
      const folderPath = getImageFolderPath(folderName)
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
      const mimeType = MIME_TYPES[ext] || 'image/jpeg'

      return { base64: `data:${mimeType};base64,${base64}` }
    } catch (error) {
      console.error('Error reading image:', error)
      throw error
    }
  })
}
