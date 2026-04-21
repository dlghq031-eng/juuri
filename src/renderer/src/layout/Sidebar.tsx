import { useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Folder, FolderOpen, FolderPlus, RefreshCw } from 'lucide-react'
import { useVaultStore } from '../store/vaultStore'
import { FileService } from '../services/FileService'

interface FolderItemProps {
  node: FolderNode
  depth?: number
}

function FolderItem({ node, depth = 0 }: FolderItemProps): React.JSX.Element {
  const { selectedFolderPath, setSelectedFolderPath } = useVaultStore()
  const [open, setOpen] = useState(depth === 0)
  const isSelected = selectedFolderPath === node.path
  const hasChildren = node.children.length > 0

  const toggleOpen = (): void => {
    if (hasChildren) setOpen((o) => !o)
  }

  return (
    <div>
      {/* 행 전체: 선택 배경 */}
      <div
        style={{ paddingLeft: `${depth * 14}px` }}
        className={`flex items-center rounded-md text-[13px] transition-colors ${
          isSelected
            ? 'bg-[#3B7BF5]/[0.10] text-[#2c2c2e]'
            : 'text-[#888880] hover:text-[#2c2c2e] hover:bg-black/[0.03]'
        }`}
      >
        {/* 화살표 버튼 — 클릭만으로 열기/닫기 */}
        <button
          onClick={toggleOpen}
          className="w-7 flex items-center justify-center py-[7px] shrink-0 opacity-60"
        >
          {hasChildren ? (
            open ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : (
            <span className="w-3" />
          )}
        </button>

        {/* 폴더 텍스트 — 단일 클릭=선택, 더블클릭=열기/닫기 */}
        <button
          onClick={() => setSelectedFolderPath(node.path)}
          onDoubleClick={toggleOpen}
          className="flex-1 flex items-center gap-1.5 py-[7px] pr-2 min-w-0 text-left"
        >
          {open ? (
            <FolderOpen size={14} className="shrink-0 text-[#3B7BF5]" />
          ) : (
            <Folder size={14} className="shrink-0 text-[#3B7BF5]" />
          )}
          <span className="truncate">{node.name}</span>
          {node.files.length > 0 && (
            <span className="ml-auto text-[10px] text-[#c0c0b8] shrink-0">
              {node.files.length}
            </span>
          )}
        </button>
      </div>

      {open &&
        node.children.map((child) => (
          <FolderItem key={child.id} node={child} depth={depth + 1} />
        ))}
    </div>
  )
}

export default function Sidebar(): React.JSX.Element {
  const { vaultPath, tree, setTree, setSelectedFolderPath } = useVaultStore()
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChangeVault = async (): Promise<void> => {
    const newPath = await FileService.selectVault()
    if (!newPath) return
    await FileService.saveSettings(newPath)
    const newTree = await FileService.scanVault(newPath)
    const { setVaultPath } = useVaultStore.getState()
    setVaultPath(newPath)
    setTree(newTree)
    setSelectedFolderPath(newPath)
  }

  const handleRefresh = async (): Promise<void> => {
    if (!vaultPath) return
    const newTree = await FileService.scanVault(vaultPath)
    setTree(newTree)
  }

  const startCreateFolder = (): void => {
    setCreatingFolder(true)
    setNewFolderName('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const confirmCreateFolder = async (): Promise<void> => {
    const name = newFolderName.trim()
    if (!name || !vaultPath) { cancelCreateFolder(); return }

    const { selectedFolderPath } = useVaultStore.getState()
    const parentPath = selectedFolderPath || vaultPath

    await FileService.createFolder(parentPath, name)
    const newTree = await FileService.scanVault(vaultPath)
    setTree(newTree)
    // path.join 대신 문자열 조합 (renderer에서 path 모듈 사용 불가)
    const newFolderPath = parentPath.replace(/\/$/, '') + '/' + name
    setSelectedFolderPath(newFolderPath)
    cancelCreateFolder()
  }

  const cancelCreateFolder = (): void => {
    setCreatingFolder(false)
    setNewFolderName('')
  }

  // Juuri 루트 폴더는 숨기고, 그 하위 폴더들만 표시
  const topLevelFolders = tree?.children ?? []

  return (
    <aside className="w-[220px] h-full flex flex-col bg-[#ECEAE4] border-r border-black/[0.07] shrink-0">
      {/* 앱 이름 + 드래그 영역 */}
      <div
        className="h-[52px] flex items-end px-5 pb-3 shrink-0"
        style={{ WebkitAppRegion: 'drag' }}
      >
        <span
          className="text-[#2c2c2e] font-bold text-[16px] tracking-tight"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          Juuri
        </span>
      </div>

      {/* 폴더 트리 — Juuri 루트는 생략하고 하위 폴더부터 렌더링 */}
      <nav className="flex-1 overflow-y-auto px-2">
        {topLevelFolders.length === 0 ? (
          <p className="px-3 py-4 text-[12px] text-[#c0c0b8]">폴더가 없습니다.</p>
        ) : (
          topLevelFolders.map((folder) => (
            <FolderItem key={folder.id} node={folder} depth={0} />
          ))
        )}
      </nav>

      {/* 폴더 생성 인라인 입력 */}
      {creatingFolder && (
        <div className="px-3 py-2 border-t border-black/[0.06]">
          <input
            ref={inputRef}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmCreateFolder()
              if (e.key === 'Escape') cancelCreateFolder()
            }}
            placeholder="폴더 이름..."
            className="w-full bg-white/60 rounded-lg px-2.5 py-1.5 text-[12px] text-[#2c2c2e] placeholder-[#c0c0b8] outline-none border border-black/[0.10]"
          />
          <p className="text-[10px] text-[#aaaaA0] mt-1 text-right">Enter 확인 · Esc 취소</p>
        </div>
      )}

      {/* 하단 액션 바 */}
      <div className="px-2 py-2 border-t border-black/[0.06] flex items-center justify-between">
        <button
          onClick={startCreateFolder}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[#888880] hover:text-[#2c2c2e] hover:bg-black/[0.05] transition-colors text-[12px]"
        >
          <FolderPlus size={13} />
          <span>새 폴더</span>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-md text-[#888880] hover:text-[#2c2c2e] hover:bg-black/[0.05] transition-colors"
            title="새로고침"
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={handleChangeVault}
            className="p-1.5 rounded-md text-[#888880] hover:text-[#2c2c2e] hover:bg-black/[0.05] transition-colors"
            title="보관소 변경"
          >
            <Folder size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
