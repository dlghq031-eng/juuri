import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  Settings,
} from 'lucide-react'

const DUMMY_FOLDERS = [
  {
    id: '1',
    name: '일상',
    open: true,
    children: [
      { id: '1-1', name: '일기' },
      { id: '1-2', name: '메모' },
    ],
  },
  {
    id: '2',
    name: '프로젝트',
    open: false,
    children: [{ id: '2-1', name: 'juuri 기획' }],
  },
  {
    id: '3',
    name: '독서',
    open: false,
    children: [{ id: '3-1', name: '읽은 책들' }],
  },
]

export default function Sidebar(): React.JSX.Element {
  const [folders, setFolders] = useState(DUMMY_FOLDERS)
  const [activeId, setActiveId] = useState('1-1')

  const toggle = (id: string): void => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, open: !f.open } : f))
    )
  }

  return (
    <aside className="w-[220px] h-full flex flex-col bg-[#111113] border-r border-white/[0.05] shrink-0">
      {/* 앱 이름 */}
      <div className="px-5 pt-5 pb-4">
        <span className="text-white font-bold text-[17px] tracking-tight">juuri</span>
      </div>

      {/* 폴더 트리 */}
      <nav className="flex-1 overflow-y-auto px-2">
        {folders.map((folder) => (
          <div key={folder.id}>
            <button
              onClick={() => toggle(folder.id)}
              className="w-full flex items-center gap-1.5 px-2 py-[7px] rounded-md text-[#888890] hover:text-white hover:bg-white/[0.05] transition-colors text-[13px]"
            >
              {folder.open ? (
                <ChevronDown size={12} className="shrink-0 opacity-50" />
              ) : (
                <ChevronRight size={12} className="shrink-0 opacity-50" />
              )}
              {folder.open ? (
                <FolderOpen size={14} className="shrink-0 text-[#5b8af5]" />
              ) : (
                <Folder size={14} className="shrink-0 text-[#5b8af5]" />
              )}
              <span className="truncate">{folder.name}</span>
            </button>

            {folder.open &&
              folder.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setActiveId(child.id)}
                  className={`w-full flex items-center gap-1.5 pl-[26px] pr-2 py-[7px] rounded-md text-[13px] transition-colors ${
                    activeId === child.id
                      ? 'bg-[#5b8af5]/[0.15] text-white'
                      : 'text-[#666670] hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Folder size={13} className="shrink-0 opacity-40" />
                  <span className="truncate">{child.name}</span>
                </button>
              ))}
          </div>
        ))}
      </nav>

      {/* 하단 액션 바 */}
      <div className="px-2 py-2 border-t border-white/[0.05] flex items-center justify-between">
        <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[#666670] hover:text-white hover:bg-white/[0.05] transition-colors text-[12px]">
          <Plus size={13} />
          <span>새 폴더</span>
        </button>
        <button className="p-1.5 rounded-md text-[#666670] hover:text-white hover:bg-white/[0.05] transition-colors">
          <Settings size={14} />
        </button>
      </div>
    </aside>
  )
}
