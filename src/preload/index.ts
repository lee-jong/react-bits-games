import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getFolders: () => ipcRenderer.invoke('get-folders'),
  createFolder: (folderName: string) => ipcRenderer.invoke('create-folder', folderName),
  deleteFolder: (folderName: string) => ipcRenderer.invoke('delete-folder', folderName),
  getFolderImages: (folderName: string) => ipcRenderer.invoke('get-folder-images', folderName),
  saveImage: (folderName: string, fileName: string, base64Data: string) =>
    ipcRenderer.invoke('save-image', folderName, fileName, base64Data),
  deleteImage: (folderName: string, fileName: string) =>
    ipcRenderer.invoke('delete-image', folderName, fileName),
  renameImage: (folderName: string, oldFileName: string, newFileName: string) =>
    ipcRenderer.invoke('rename-image', folderName, oldFileName, newFileName),
  getImageBase64: (folderName: string, fileName: string) =>
    ipcRenderer.invoke('get-image-base64', folderName, fileName)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
