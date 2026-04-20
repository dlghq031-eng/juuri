import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Quote,
  AlignCenter,
  Minus,
} from 'lucide-react'

interface Command {
  id: string
  label: string
  description: string
  icon: React.ElementType
  action: (editor: Editor) => void
}

const COMMANDS: Command[] = [
  {
    id: 'h1',
    label: 'Heading 1',
    description: '큰 제목',
    icon: Heading1,
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    label: 'Heading 2',
    description: '중간 제목',
    icon: Heading2,
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: '작은 제목',
    icon: Heading3,
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'bold',
    label: 'Bold',
    description: '굵게',
    icon: Bold,
    action: (e) => e.chain().focus().toggleBold().run(),
  },
  {
    id: 'italic',
    label: 'Italic',
    description: '기울임',
    icon: Italic,
    action: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    id: 'bullet',
    label: 'Bullet List',
    description: '글머리 목록',
    icon: List,
    action: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'ordered',
    label: 'Numbered List',
    description: '번호 목록',
    icon: ListOrdered,
    action: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'code',
    label: 'Code Block',
    description: '코드 블록',
    icon: Code,
    action: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'quote',
    label: 'Blockquote',
    description: '인용구',
    icon: Quote,
    action: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'center',
    label: 'Center Align',
    description: '가운데 정렬',
    icon: AlignCenter,
    action: (e) => e.chain().focus().setTextAlign('center').run(),
  },
  {
    id: 'divider',
    label: 'Divider',
    description: '구분선',
    icon: Minus,
    action: (e) => e.chain().focus().setHorizontalRule().run(),
  },
]

interface SlashMenuProps {
  editor: Editor
  position: { top: number; left: number }
  onClose: () => void
}

export default function SlashMenu({ editor, position, onClose }: SlashMenuProps): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const activeItemRef = useRef<HTMLButtonElement>(null)

  // 방향키로 activeIndex 변경 시 해당 항목이 뷰포트 안에 들어오도록 스크롤
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeIndex])

  const filtered = COMMANDS.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.description.includes(query)
  )

  // 열리면 입력 포커스
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const applyCommand = (cmd: Command) => {
    cmd.action(editor)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[activeIndex]) applyCommand(filtered[activeIndex])
    }
  }

  // 필터 결과 바뀌면 activeIndex 초기화
  useEffect(() => setActiveIndex(0), [query])

  // 창 밖으로 넘어가지 않도록 위치 보정
  const maxTop = window.innerHeight - 380
  const adjustedTop = Math.min(position.top, maxTop)
  const maxLeft = window.innerWidth - 260
  const adjustedLeft = Math.min(position.left, maxLeft)

  return (
    <div
      ref={menuRef}
      style={{ top: adjustedTop, left: adjustedLeft }}
      className="fixed z-50 w-[240px] rounded-xl bg-[#1e1e21] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
    >
      {/* 검색 입력 */}
      <div className="px-3 pt-3 pb-2">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="서식 검색..."
          className="w-full bg-white/[0.05] rounded-lg px-2.5 py-1.5 text-[12px] text-[#c0c0c5] placeholder-[#4a4a4e] outline-none border border-white/[0.06]"
        />
      </div>

      {/* 명령 목록 */}
      <div className="max-h-[300px] overflow-y-auto px-1.5 pb-2">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-[#4a4a4e] text-center py-4">결과 없음</p>
        ) : (
          filtered.map((cmd, idx) => {
            const Icon = cmd.icon
            return (
              <button
                key={cmd.id}
                ref={idx === activeIndex ? activeItemRef : null}
                onMouseDown={(e) => { e.preventDefault(); applyCommand(cmd) }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left ${
                  idx === activeIndex
                    ? 'bg-[#5b8af5]/[0.15] text-white'
                    : 'text-[#a0a0a8] hover:bg-white/[0.05]'
                }`}
              >
                <Icon size={14} className="shrink-0 opacity-80" />
                <div>
                  <div className="text-[12px] font-medium leading-tight">{cmd.label}</div>
                  <div className="text-[10px] text-[#5a5a60] leading-tight">{cmd.description}</div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
