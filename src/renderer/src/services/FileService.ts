import { marked } from 'marked'
import TurndownService from 'turndown'

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

export const FileService = {
  selectVault: (): Promise<string | null> =>
    window.api.selectVault(),

  scanVault: (dirPath: string): Promise<FolderNode> =>
    window.api.scanVault(dirPath),

  getSettings: (): Promise<{ vaultPath: string | null }> =>
    window.api.getSettings(),

  saveSettings: (vaultPath: string): Promise<void> =>
    window.api.saveSettings({ vaultPath }),

  readFileAsHtml: async (filePath: string): Promise<string> => {
    const md = await window.api.readFile(filePath)
    return marked.parse(md) as string
  },

  saveFileFromHtml: async (filePath: string, html: string): Promise<void> => {
    const md = turndown.turndown(html)
    await window.api.writeFile(filePath, md)
  },

  createFile: async (folderPath: string, name: string): Promise<string> => {
    const filePath = `${folderPath}/${name}.md`
    await window.api.writeFile(filePath, '')
    return filePath
  },

  createFolder: (parentPath: string, folderName: string): Promise<string> =>
    window.api.createFolder(parentPath, folderName),

  findFolderByPath: (node: FolderNode, targetPath: string): FolderNode | null => {
    if (node.path === targetPath) return node
    for (const child of node.children) {
      const found = FileService.findFolderByPath(child, targetPath)
      if (found) return found
    }
    return null
  },
}
