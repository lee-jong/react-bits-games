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

interface ImageFile {
  name: string
  path: string
  size: number
  modifiedAt: number
}

interface FolderAPI {
  getFolders: () => Promise<Folder[]>
  createFolder: (folderName: string) => Promise<CreateFolderResult>
  deleteFolder: (folderName: string) => Promise<{ success: boolean }>
  getFolderImages: (folderName: string) => Promise<ImageFile[]>
  saveImage: (
    folderName: string,
    fileName: string,
    base64Data: string
  ) => Promise<{ success: boolean; fileName: string }>
  deleteImage: (folderName: string, fileName: string) => Promise<{ success: boolean }>
  renameImage: (
    folderName: string,
    oldFileName: string,
    newFileName: string
  ) => Promise<{ success: boolean; fileName: string }>
  getImageBase64: (folderName: string, fileName: string) => Promise<{ base64: string }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: FolderAPI
  }
}
