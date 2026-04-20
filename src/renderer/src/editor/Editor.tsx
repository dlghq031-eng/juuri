import { useCallback, useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import CharacterCount from '@tiptap/extension-character-count'
import { Focus, Maximize2, Type } from 'lucide-react'

import { useEditorStore } from '../store/editorStore'
import { markdownModeRef, MarkdownModePlugin } from './extensions/MarkdownModePlugin'
import { WysiwymDecorator } from './extensions/WysiwymDecorator'
import { SlashCommand } from './extensions/SlashCommand'
import { FocusMode } from './extensions/FocusMode'
import SlashMenu from './components/SlashMenu'

interface SlashMenuState {
  open: boolean
  position: { top: number; left: number }
}

export default function Editor(): React.JSX.Element {
  const { markdownMode, focusMode, wordCount, toggleMarkdownMode, toggleFocusMode, setWordCount } =
    useEditorStore()

  const [slashMenu, setSlashMenu] = useState<SlashMenuState>({
    open: false,
    position: { top: 0, left: 0 },
  })

  // markdownModeRef를 store와 동기화
  useEffect(() => {
    markdownModeRef.current = markdownMode
  }, [markdownMode])

  const handleSlashOpen = useCallback((coords: { top: number; left: number }) => {
    setSlashMenu({ open: true, position: coords })
  }, [])

  const handleSlashClose = useCallback(() => {
    setSlashMenu((s) => ({ ...s, open: false }))
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Placeholder.configure({
        placeholder: '글을 시작하세요…  Cmd+/ 로 서식을 선택할 수 있습니다.',
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Highlight.configure({ multicolor: false }),
      CharacterCount,
      MarkdownModePlugin,
      WysiwymDecorator,
      SlashCommand.configure({ onOpen: handleSlashOpen }),
      FocusMode.configure({ onToggle: toggleFocusMode }),
    ],
    autofocus: true,
    onUpdate({ editor: e }) {
      // 공백(스페이스·탭)과 줄바꿈을 제외한 순수 글자 수만 집계
      const raw = e.state.doc.textContent
      setWordCount(raw.replace(/\s/g, '').length)
    },
  })

  return (
    <div
      className={`flex-1 flex flex-col bg-[#242426] overflow-hidden relative ${
        focusMode ? 'focus-mode-active' : ''
      }`}
    >
      {/* 상단 툴바 */}
      <div className="h-10 flex items-center justify-between px-4 border-b border-white/[0.05] shrink-0">
        {/* 왼쪽: 마크다운 모드 토글 */}
        <button
          onClick={toggleMarkdownMode}
          title={markdownMode ? '마크다운 모드 켜짐 (클릭하여 끄기)' : '마크다운 모드 꺼짐 (클릭하여 켜기)'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
            markdownMode
              ? 'bg-[#5b8af5]/[0.15] text-[#5b8af5]'
              : 'text-[#555558] hover:text-[#888] hover:bg-white/[0.05]'
          }`}
        >
          <Type size={12} />
          <span>MD {markdownMode ? 'ON' : 'OFF'}</span>
        </button>

        {/* 오른쪽: 집중 모드 + 단어 수 */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#3a3a3e]">{wordCount.toLocaleString()}자</span>
          <button
            onClick={toggleFocusMode}
            title="집중 모드 (Cmd+.)"
            className={`p-1.5 rounded-md transition-colors ${
              focusMode
                ? 'text-[#5b8af5] bg-[#5b8af5]/[0.12]'
                : 'text-[#555558] hover:text-[#888] hover:bg-white/[0.05]'
            }`}
          >
            <Focus size={13} />
          </button>
          <button
            className="p-1.5 rounded-md text-[#555558] hover:text-[#888] hover:bg-white/[0.05] transition-colors"
            title="전체 화면"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* 에디터 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto">
        <div
          className={`max-w-[680px] w-full mx-auto px-16 py-14 ${
            focusMode ? 'focus-mode-content' : ''
          }`}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* 슬래시 메뉴 */}
      {slashMenu.open && editor && (
        <SlashMenu editor={editor} position={slashMenu.position} onClose={handleSlashClose} />
      )}

      {/* 하단 상태 바 */}
      <div className="h-7 flex items-center justify-end px-4 border-t border-white/[0.04] shrink-0">
        <span className="text-[10px] text-[#2e2e32]">
          {markdownMode ? 'WYSIWYM' : 'RAW'} · Cmd+/ 서식
        </span>
      </div>
    </div>
  )
}
