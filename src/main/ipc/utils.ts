import { join, normalize, resolve } from 'path'
import { existsSync, statSync, mkdirSync } from 'fs'
import { is } from '@electron-toolkit/utils'

/**
 * Get the games path based on environment (dev or production)
 */
export function getGamesPath(): string {
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

/**
 * Check if a path is a directory
 */
export function isDirectory(path: string): boolean {
  try {
    return existsSync(path) && statSync(path).isDirectory()
  } catch {
    return false
  }
}

/**
 * Get the image games path (games/image subfolder)
 */
export function getImageGamesPath(): string {
  const gamesPath = getGamesPath()
  const imagePath = join(gamesPath, 'image')
  // Normalize path to handle relative paths and resolve symlinks
  return normalize(resolve(imagePath))
}

/**
 * Get the quiz games path (games/quiz subfolder)
 */
export function getQuizGamesPath(): string {
  const gamesPath = getGamesPath()
  const quizPath = join(gamesPath, 'quiz')
  // Normalize path to handle relative paths and resolve symlinks
  return normalize(resolve(quizPath))
}

/**
 * Get the folder path for a given folder name (with security checks)
 * @deprecated Use getImageFolderPath or getQuizFolderPath instead
 */
export function getFolderPath(folderName: string): string {
  return getImageFolderPath(folderName)
}

/**
 * Get the image folder path for a given folder name (with security checks)
 */
export function getImageFolderPath(folderName: string): string {
  const imagePath = getImageGamesPath()
  const folderPath = normalize(resolve(join(imagePath, folderName)))

  // Security check
  if (!folderPath.startsWith(imagePath)) {
    throw new Error('Invalid folder path')
  }

  if (!isDirectory(folderPath)) {
    throw new Error('Folder does not exist')
  }

  return folderPath
}

/**
 * Ensure games directory exists, create if it doesn't
 */
export function ensureGamesDirectory(): void {
  const gamesPath = getGamesPath()
  if (!isDirectory(gamesPath)) {
    mkdirSync(gamesPath, { recursive: true })
  }
}

/**
 * Ensure image games directory exists, create if it doesn't
 */
export function ensureImageGamesDirectory(): void {
  // Ensure parent games directory exists first
  ensureGamesDirectory()
  const imagePath = getImageGamesPath()
  if (!isDirectory(imagePath)) {
    mkdirSync(imagePath, { recursive: true })
  }
}

/**
 * Ensure quiz games directory exists, create if it doesn't
 */
export function ensureQuizGamesDirectory(): void {
  // Ensure parent games directory exists first
  ensureGamesDirectory()
  const quizPath = getQuizGamesPath()
  if (!isDirectory(quizPath)) {
    mkdirSync(quizPath, { recursive: true })
  }
}

/**
 * Get the quiz folder path for a given folder name (with security checks)
 */
export function getQuizFolderPath(folderName: string): string {
  const quizPath = getQuizGamesPath()
  const folderPath = normalize(resolve(join(quizPath, folderName)))

  // Security check
  if (!folderPath.startsWith(quizPath)) {
    throw new Error('Invalid folder path')
  }

  if (!isDirectory(folderPath)) {
    throw new Error('Folder does not exist')
  }

  return folderPath
}

/**
 * Get the quiz folder path or create if it doesn't exist (for saving files)
 */
export function getOrCreateQuizFolderPath(folderName: string): string {
  const quizPath = getQuizGamesPath()
  ensureQuizGamesDirectory()
  const folderPath = normalize(resolve(join(quizPath, folderName)))

  // Security check
  if (!folderPath.startsWith(quizPath)) {
    throw new Error('Invalid folder path')
  }

  // Create folder if it doesn't exist
  if (!isDirectory(folderPath)) {
    mkdirSync(folderPath, { recursive: true })
  }

  return folderPath
}
