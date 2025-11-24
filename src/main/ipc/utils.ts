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
 * Get the folder path for a given folder name (with security checks)
 */
export function getFolderPath(folderName: string): string {
  const gamesPath = getGamesPath()
  const folderPath = normalize(resolve(join(gamesPath, folderName)))

  // Security check
  if (!folderPath.startsWith(gamesPath)) {
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

