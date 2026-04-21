/// <reference types="vite/client" />

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag'
  }
}

// ── Vault / File System types ──────────────────────────────────
interface FileNode {
  id: string
  name: string       // filename without .md extension
  path: string       // absolute path
  mtime: number
  size: number
  parentPath: string
  preview: string    // first non-empty line of content
}

interface FolderNode {
  id: string
  name: string
  path: string
  children: FolderNode[]
  files: FileNode[]
}

// ── window.api (exposed by preload) ───────────────────────────
interface Window {
  api: {
    selectVault: () => Promise<string | null>
    scanVault: (dirPath: string) => Promise<FolderNode>
    getSettings: () => Promise<{ vaultPath: string | null }>
    saveSettings: (data: { vaultPath: string | null }) => Promise<void>
    readFile: (filePath: string) => Promise<string>
    writeFile: (filePath: string, content: string) => Promise<void>
    createFolder: (parentPath: string, folderName: string) => Promise<string>
  }
}
