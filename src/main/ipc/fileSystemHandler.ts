import { ipcMain, dialog, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

interface FileNode {
  id: string
  name: string
  path: string
  mtime: number
  size: number
  parentPath: string
  preview: string
}

interface FolderNode {
  id: string
  name: string
  path: string
  children: FolderNode[]
  files: FileNode[]
}

const SETTINGS_PATH = path.join(app.getPath('userData'), 'juuri-settings.json')
const VAULT_FOLDER_NAME = 'Juuri'

function readSettings(): { vaultPath: string | null } {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'))
    }
  } catch {}
  return { vaultPath: null }
}

function writeSettings(data: { vaultPath: string | null }): void {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf8')
}

function readPreviewLines(filePath: string): string {
  try {
    const fileName = path.basename(filePath, '.md')
    const fd = fs.openSync(filePath, 'r')
    const buf = Buffer.alloc(600)
    const bytesRead = fs.readSync(fd, buf, 0, 600, 0)
    fs.closeSync(fd)
    const text = buf.slice(0, bytesRead).toString('utf8')
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      // 파일명과 동일한 줄은 제목과 중복이므로 preview에서 제외
      .filter((l) => l.replace(/^#+\s*/, '').trim() !== fileName)
      .slice(0, 3)
    return lines.map((l) => l.slice(0, 120)).join('\n')
  } catch {
    return ''
  }
}

function scanDir(dirPath: string): FolderNode {
  const node: FolderNode = {
    id: dirPath,
    name: path.basename(dirPath),
    path: dirPath,
    children: [],
    files: [],
  }

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return node
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      node.children.push(scanDir(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      try {
        const stat = fs.statSync(fullPath)
        node.files.push({
          id: fullPath,
          name: entry.name.replace(/\.md$/, ''),
          path: fullPath,
          mtime: stat.mtimeMs,
          size: stat.size,
          parentPath: dirPath,
          preview: readPreviewLines(fullPath),
        })
      } catch {}
    }
  }

  node.children.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  node.files.sort((a, b) => b.mtime - a.mtime)

  return node
}

export function registerFileSystemHandlers(): void {
  ipcMain.handle('vault:select', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '보관소로 사용할 폴더를 선택하세요',
      buttonLabel: '이 폴더를 보관소로 사용',
    })
    if (result.canceled || result.filePaths.length === 0) return null

    // 선택된 폴더 안에 전용 Juuri 폴더 생성
    const vaultPath = path.join(result.filePaths[0], VAULT_FOLDER_NAME)
    fs.mkdirSync(vaultPath, { recursive: true })
    return vaultPath
  })

  ipcMain.handle('vault:scan', (_event, dirPath: string) => {
    return scanDir(dirPath)
  })

  ipcMain.handle('settings:get', () => {
    return readSettings()
  })

  ipcMain.handle('settings:set', (_event, data: { vaultPath: string | null }) => {
    writeSettings(data)
  })

  ipcMain.handle('file:read', (_event, filePath: string) => {
    return fs.readFileSync(filePath, 'utf8')
  })

  ipcMain.handle('file:write', (_event, filePath: string, content: string) => {
    fs.writeFileSync(filePath, content, 'utf8')
  })

  ipcMain.handle('folder:create', (_event, parentPath: string, folderName: string) => {
    const newPath = path.join(parentPath, folderName)
    fs.mkdirSync(newPath, { recursive: true })
    return newPath
  })
}
