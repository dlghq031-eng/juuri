import React, { useState } from 'react'
import { FilePlus, Search } from 'lucide-react'
import { useVaultStore } from '../store/vaultStore'
import { FileService } from '../services/FileService'

/** 폴더와 모든 하위 폴더의 파일을 재귀 수집 */
function collectAllFiles(node: FolderNode): FileNode[] {
  const all: FileNode[] = [...node.files]
  for (const child of node.children) all.push(...collectAllFiles(child))
  return all.sort((a, b) => b.mtime - a.mtime)
}

/** 파일 배열을 parentPath 기준으로 그룹화 */
interface FileGroup {
  folderPath: string
  folderName: string
  files: FileNode[]
}

function groupByFolder(files: FileNode[], tree: FolderNode): FileGroup[] {
  const map = new Map<string, FileNode[]>()
  for (const file of files) {
    if (!map.has(file.parentPath)) map.set(file.parentPath, [])
    map.get(file.parentPath)!.push(file)
  }
  return Array.from(map.entries())
    .map(([folderPath, groupFiles]) => ({
      folderPath,
      folderName: FileService.findFolderByPath(tree, folderPath)?.name
        ?? folderPath.split('/').pop()
        ?? '기타',
      files: groupFiles,
    }))
    .sort((a, b) => a.folderPath.localeCompare(b.folderPath))
}

/**
 * 3줄 미리보기 렌더링
 * - `#` 줄: React.Fragment 로 감싸 텍스트 + <br /> 엘리먼트를 직접 반환
 * - 일반 텍스트 줄: 공백으로 join
 */
function renderPreview(preview: string): React.ReactNode {
  if (!preview) return <span className="text-[#c8c8c0] italic">빈 파일</span>

  const lines = preview.split('\n').filter((l) => l.trim().length > 0)
  const nodes: React.ReactNode[] = []
  const regularBuf: string[] = []

  lines.map((line, i) => {
    if (line.startsWith('#')) {
      // Before: 쌓인 일반 텍스트 flush → <br /> 삽입 (일반 텍스트와 # 줄 분리)
      if (regularBuf.length > 0) {
        nodes.push(<span key={`r${i}`}>{regularBuf.join(' ')}</span>)
        nodes.push(<br key={`br-before${i}`} />)
        regularBuf.length = 0
      }
      // # 줄: Fragment → 텍스트 + <br /> (After: 뒤따르는 텍스트와도 분리)
      nodes.push(
        <React.Fragment key={`h${i}`}>
          <span className="font-medium text-[#3a3a40]">{line.replace(/^#+\s*/, '')}</span>
          <br />
        </React.Fragment>
      )
    } else {
      regularBuf.push(line)
    }
  })

  // 남은 일반 줄 flush
  if (regularBuf.length > 0) {
    nodes.push(<span key="r-end">{regularBuf.join(' ')}</span>)
  }

  return <>{nodes}</>
}

export default function FileList(): React.JSX.Element {
  const {
    vaultPath,
    tree,
    selectedFolderPath,
    activeFilePath,
    setActiveFilePath,
    setTree,
  } = useVaultStore()

  const [query, setQuery] = useState('')

  const currentFolder =
    selectedFolderPath && tree
      ? FileService.findFolderByPath(tree, selectedFolderPath) ?? tree
      : tree

  const allFiles = currentFolder ? collectAllFiles(currentFolder) : []

  const filtered = allFiles.filter(
    (f) =>
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.preview.toLowerCase().includes(query.toLowerCase())
  )

  // 그룹화 (검색 중이 아닐 때만, 검색 중엔 flat list)
  const groups: FileGroup[] = tree && !query ? groupByFolder(filtered, tree) : []
  const showGrouped = groups.length > 1

  const handleNewFile = async (): Promise<void> => {
    const folderPath = selectedFolderPath || vaultPath
    if (!folderPath || !vaultPath) return

    const today = new Date()
    const baseName = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    let name = baseName
    let counter = 1
    const existingNames = new Set(allFiles.map((f) => f.name))
    while (existingNames.has(name)) name = `${baseName} (${counter++})`

    const newPath = await FileService.createFile(folderPath, name)
    const newTree = await FileService.scanVault(vaultPath)
    setTree(newTree)
    setActiveFilePath(newPath)
  }

  const folderName = currentFolder?.name ?? '파일'

  const renderFileButton = (file: FileNode): React.JSX.Element => (
    <li key={file.id}>
      <button
        onClick={() => setActiveFilePath(file.path)}
        className={`w-full text-left px-3 py-[9px] rounded-lg transition-colors ${
          activeFilePath === file.path ? 'bg-black/[0.07]' : 'hover:bg-black/[0.03]'
        }`}
      >
        <p className="text-[11px] text-[#aaaaA0] leading-snug line-clamp-3">
          {renderPreview(file.preview)}
        </p>
      </button>
    </li>
  )

  return (
    <div className="w-[260px] h-full flex flex-col bg-[#F2F0EA] border-r border-black/[0.07] shrink-0">
      {/* 헤더 */}
      <div
        className="h-[52px] px-4 flex items-end pb-3 justify-between shrink-0"
        style={{ WebkitAppRegion: 'drag' }}
      >
        <span
          className="text-[#2c2c2e] font-semibold text-[13px] truncate"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          {folderName}
        </span>
        <button
          onClick={handleNewFile}
          className="p-1 rounded-md text-[#888880] hover:text-[#2c2c2e] hover:bg-black/[0.07] transition-colors"
          style={{ WebkitAppRegion: 'no-drag' }}
          title="새 파일"
        >
          <FilePlus size={15} />
        </button>
      </div>

      {/* 검색창 */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 px-2.5 py-[7px] rounded-lg bg-black/[0.04] border border-black/[0.08]">
          <Search size={12} className="text-[#aaaaA0] shrink-0" />
          <input
            type="text"
            placeholder="검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[12px] text-[#4a4a4e] placeholder-[#aaaaA0] outline-none"
          />
        </div>
      </div>

      {/* 파일 목록 */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-[#c0c0b8]">
            {allFiles.length === 0 ? '파일이 없습니다.' : '검색 결과가 없습니다.'}
          </p>
        ) : showGrouped ? (
          // 폴더별 그룹 헤더 + 파일
          groups.map((group) => (
            <div key={group.folderPath} className="mb-3">
              <div className="px-3 pt-4 pb-1">
                <h2 className="text-lg font-semibold text-[#2c2c2e] leading-tight">
                  {group.folderName}
                </h2>
              </div>
              <ul className="space-y-px">
                {group.files.map(renderFileButton)}
              </ul>
            </div>
          ))
        ) : (
          // 단일 폴더이거나 검색 중 — flat list
          <ul className="space-y-px">
            {filtered.map(renderFileButton)}
          </ul>
        )}
      </div>

      {/* 하단 카운트 */}
      <div className="px-4 py-2 border-t border-black/[0.06]">
        <span className="text-[10px] text-[#aaaaA0]">{filtered.length}개의 노트</span>
      </div>
    </div>
  )
}
