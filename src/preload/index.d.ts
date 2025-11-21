import { ElectronAPI } from '@electron-toolkit/preload'

interface Folder {
  id: string
  title: string
}

interface CreateFolderResult {
  success: boolean
  id: string
  title: string
}

interface FolderAPI {
  getFolders: () => Promise<Folder[]>
  createFolder: (folderName: string) => Promise<CreateFolderResult>
  deleteFolder: (folderName: string) => Promise<{ success: boolean }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: FolderAPI
  }
}
