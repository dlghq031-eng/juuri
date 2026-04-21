import { contextBridge, ipcRenderer } from 'electron'

const api = {
  selectVault: (): Promise<string | null> =>
    ipcRenderer.invoke('vault:select'),

  scanVault: (dirPath: string): Promise<unknown> =>
    ipcRenderer.invoke('vault:scan', dirPath),

  getSettings: (): Promise<{ vaultPath: string | null }> =>
    ipcRenderer.invoke('settings:get'),

  saveSettings: (data: { vaultPath: string | null }): Promise<void> =>
    ipcRenderer.invoke('settings:set', data),

  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('file:read', filePath),

  writeFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('file:write', filePath, content),

  createFolder: (parentPath: string, folderName: string): Promise<string> =>
    ipcRenderer.invoke('folder:create', parentPath, folderName),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.api = api
}
