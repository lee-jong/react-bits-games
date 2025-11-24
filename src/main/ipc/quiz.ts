import { ipcMain } from 'electron'
import { join, normalize, resolve } from 'path'
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs'
import { getOrCreateQuizFolderPath, ensureQuizGamesDirectory, getQuizGamesPath } from './utils'

interface QuizItem {
  title: string
  quiz: string
  answer: string
}

interface QuizFile {
  category: string
  quizzes: QuizItem[]
}

/**
 * Register quiz management IPC handlers
 */
export function registerQuizHandlers(): void {
  // Get quiz JSON file content
  ipcMain.handle('get-quiz-file', async (_, folderName: string) => {
    try {
      const quizPath = getQuizGamesPath()
      ensureQuizGamesDirectory()
      const filePath = normalize(resolve(join(quizPath, folderName, `${folderName}.json`)))

      // Security check
      if (!filePath.startsWith(quizPath)) {
        throw new Error('Invalid file path')
      }

      if (!existsSync(filePath)) {
        // Return empty structure if file doesn't exist
        return { category: folderName, quizzes: [] }
      }

      // Read and parse JSON file
      const fileContent = readFileSync(filePath, 'utf-8')
      const quizFile = JSON.parse(fileContent) as QuizFile

      return { category: quizFile.category || folderName, quizzes: quizFile.quizzes || [] }
    } catch (error) {
      console.error('Error reading quiz file:', error)
      throw error
    }
  })

  // Save quiz JSON file
  ipcMain.handle(
    'save-quiz-file',
    async (_, folderName: string, category: string, quizzes: QuizItem[]) => {
      try {
        const folderPath = getOrCreateQuizFolderPath(folderName)
        const filePath = normalize(resolve(join(folderPath, `${folderName}.json`)))

        // Security check
        if (!filePath.startsWith(folderPath)) {
          throw new Error('Invalid file path')
        }

        // Validate quizzes array
        if (!Array.isArray(quizzes)) {
          throw new Error('Quizzes must be an array')
        }

        // Validate each quiz item
        for (const quiz of quizzes) {
          if (!quiz.title || !quiz.quiz || !quiz.answer) {
            throw new Error('Each quiz must have title, quiz, and answer fields')
          }
        }

        // Write JSON file with category
        const quizFile: QuizFile = {
          category: category || folderName,
          quizzes
        }
        const jsonContent = JSON.stringify(quizFile, null, 2)
        writeFileSync(filePath, jsonContent, 'utf-8')

        return { success: true }
      } catch (error) {
        console.error('Error saving quiz file:', error)
        throw error
      }
    }
  )

  // Get quiz file stats (for listing)
  ipcMain.handle('get-quiz-file-info', async (_, folderName: string) => {
    try {
      const quizPath = getQuizGamesPath()
      const filePath = normalize(resolve(join(quizPath, folderName, `${folderName}.json`)))

      // Security check
      if (!filePath.startsWith(quizPath)) {
        throw new Error('Invalid file path')
      }

      if (!existsSync(filePath)) {
        return { exists: false, count: 0, quizzes: [] }
      }

      // Read and parse JSON file to get quiz count
      const fileContent = readFileSync(filePath, 'utf-8')
      const quizFile = JSON.parse(fileContent) as QuizFile
      const quizzes = quizFile.quizzes || []
      const stats = statSync(filePath)

      return {
        exists: true,
        count: quizzes.length,
        modifiedAt: stats.mtimeMs,
        quizzes: quizzes.slice(0, 2) // Return first 2 quizzes for preview
      }
    } catch (error) {
      console.error('Error reading quiz file info:', error)
      return { exists: false, count: 0, quizzes: [] }
    }
  })
}
