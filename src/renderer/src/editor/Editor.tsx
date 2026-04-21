import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor as TiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import CharacterCount from '@tiptap/extension-character-count'
import { Focus, Maximize2, Type, Save } from 'lucide-react'

import { useEditorStore } from '../store/editorStore'
import { useVaultStore } from '../store/vaultStore'
import { FileService } from '../services/FileService'
import { markdownModeRef, MarkdownModePlugin } from './extensions/MarkdownModePlugin'
import { WysiwymDecorator } from './extensions/WysiwymDecorator'
import { SlashCommand } from './extensions/SlashCommand'
import { FocusMode } from './extensions/FocusMode'
import { HeadingBackspace } from './extensions/HeadingBackspace'
import { TabIndent } from './extensions/TabIndent'
import SlashMenu from './components/SlashMenu'

const AUTOSAVE_DELAY = 800

interface SlashMenuState {
  open: boolean
  position: { top: number; left: number }
}

/** 에디터 문서에서 첫 3줄 미리보기 텍스트를 추출 (파일명과 동일한 줄 제외) */
function extractPreview(e: TiptapEditor, fileName: string): string {
  const lines: string[] = []
  e.state.doc.forEach((node) => {
    if (lines.length >= 3) return
    const raw = node.type.name === 'heading'
      ? `${'#'.repeat(node.attrs.level as number)} ${node.textContent.trim()}`
      : node.textContent.trim()
    if (raw && raw.replace(/^#+\s*/, '').trim() !== fileName) lines.push(raw)
  })
  return lines.slice(0, 3).join('\n')
}

export default function Editor(): React.JSX.Element {
  const { markdownMode, focusMode, wordCount, toggleMarkdownMode, toggleFocusMode, setWordCount } =
    useEditorStore()
  const { activeFilePath, isSaving, setSaving } = useVaultStore()

  const [slashMenu, setSlashMenu] = useState<SlashMenuState>({
    open: false,
    position: { top: 0, left: 0 },
  })

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLoadingRef = useRef(false)

  // stale closure 방지: onUpdate 내에서 최신 activeFilePath 참조
  const activeFilePathRef = useRef<string | null>(null)
  useEffect(() => {
    activeFilePathRef.current = activeFilePath
  }, [activeFilePath])

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
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Highlight.configure({ multicolor: false }),
      CharacterCount,
      MarkdownModePlugin,
      WysiwymDecorator,
      SlashCommand.configure({ onOpen: handleSlashOpen }),
      FocusMode.configure({ onToggle: toggleFocusMode }),
      HeadingBackspace,
      TabIndent,
    ],
    autofocus: true,
    editorProps: {
      attributes: { spellcheck: 'false' },
    },
    onUpdate({ editor: e }) {
      const raw = e.state.doc.textContent
      setWordCount(raw.replace(/\s/g, '').length)

      const currentPath = activeFilePathRef.current
      if (!currentPath || isLoadingRef.current) return

      // ① 메모리에 즉시 반영 — 타이핑과 동시에 FileList preview 갱신
      const { updateFilePreview } = useVaultStore.getState()
      const fileName = currentPath.split('/').pop()?.replace(/\.md$/, '') ?? ''
      updateFilePreview(currentPath, extractPreview(e, fileName))

      // ② 디스크 저장은 800ms 디바운스
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        setSaving(true)
        try {
          await FileService.saveFileFromHtml(currentPath, e.getHTML())
        } finally {
          setSaving(false)
        }
      }, AUTOSAVE_DELAY)
    },
  })

  // 파일이 바뀌면 에디터에 로드
  useEffect(() => {
    if (!editor || !activeFilePath) return
    let cancelled = false

    FileService.readFileAsHtml(activeFilePath).then((html) => {
      if (cancelled || !editor) return
      isLoadingRef.current = true
      editor.commands.setContent(html || '<p></p>')
      requestAnimationFrame(() => {
        isLoadingRef.current = false
      })
    })

    return () => { cancelled = true }
  }, [activeFilePath, editor])

  // 에디터 여백(본문 max-width 밖) 클릭 시 Y축 기준 가장 가까운 위치로 커서 이동
  const handleScrollAreaClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!editor) return
      // ProseMirror 내부 클릭은 ProseMirror가 직접 처리
      if ((e.target as Element).closest('.ProseMirror')) return

      const view = editor.view
      const editorEl = view.dom
      const rect = editorEl.getBoundingClientRect()

      // Y가 에디터 범위를 벗어나면 문서 끝으로 이동
      if (e.clientY > rect.bottom) {
        editor.chain().focus().setTextSelection(editor.state.doc.content.size).run()
        return
      }
      if (e.clientY < rect.top) {
        editor.chain().focus().setTextSelection(1).run()
        return
      }

      // X를 에디터 폭 내로 클램프 → posAtCoords가 null 반환을 막음
      const clampedX = Math.max(rect.left + 2, Math.min(rect.right - 2, e.clientX))
      const resolved = view.posAtCoords({ left: clampedX, top: e.clientY })

      if (resolved !== null) {
        editor.chain().focus().setTextSelection(resolved.pos).run()
      } else {
        editor.commands.focus()
      }
    },
    [editor]
  )

  const noFileOpen = !activeFilePath

  return (
    <div
      className={`flex-1 flex flex-col bg-[#F9F8F4] overflow-hidden relative ${
        focusMode ? 'focus-mode-active' : ''
      }`}
    >
      {/* 상단 툴바 — 드래그 영역 */}
      <div
        className="h-[52px] flex items-end pb-2 justify-between px-4 border-b border-black/[0.06] shrink-0"
        style={{ WebkitAppRegion: 'drag' }}
      >
        <button
          onClick={toggleMarkdownMode}
          title={markdownMode ? '마크다운 모드 켜짐 (클릭하여 끄기)' : '마크다운 모드 꺼짐 (클릭하여 켜기)'}
          style={{ WebkitAppRegion: 'no-drag' }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
            markdownMode
              ? 'bg-[#3B7BF5]/[0.12] text-[#3B7BF5]'
              : 'text-[#aaaaA0] hover:text-[#4a4a50] hover:bg-black/[0.05]'
          }`}
        >
          <Type size={12} />
          <span>MD {markdownMode ? 'ON' : 'OFF'}</span>
        </button>

        <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' }}>
          {activeFilePath && (
            <span className="flex items-center gap-1 text-[11px] text-[#c0c0b8]">
              <Save size={11} className={isSaving ? 'opacity-80 animate-pulse' : 'opacity-30'} />
              {isSaving ? '저장 중' : '저장됨'}
            </span>
          )}
          <span className="text-[11px] text-[#c0c0b8]">{wordCount.toLocaleString()}자</span>
          <button
            onClick={toggleFocusMode}
            title="집중 모드 (Cmd+.)"
            className={`p-1.5 rounded-md transition-colors ${
              focusMode
                ? 'text-[#3B7BF5] bg-[#3B7BF5]/[0.10]'
                : 'text-[#aaaaA0] hover:text-[#4a4a50] hover:bg-black/[0.05]'
            }`}
          >
            <Focus size={13} />
          </button>
          <button
            className="p-1.5 rounded-md text-[#aaaaA0] hover:text-[#4a4a50] hover:bg-black/[0.05] transition-colors"
            title="전체 화면"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* 에디터 스크롤 영역 — 여백 클릭 시 커서 이동 */}
      <div
        className="flex-1 overflow-y-auto editor-scroll-area"
        onClick={handleScrollAreaClick}
      >
        {noFileOpen ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p
              className="text-[14px] text-[#c8c8c0]"
              style={{ fontFamily: "'AppleMyungjo','Nanum Myeongjo','Batang',serif" }}
            >
              왼쪽에서 파일을 선택하거나 새 파일을 만드세요.
            </p>
          </div>
        ) : (
          <div
            className={`max-w-[680px] w-full mx-auto px-16 pt-[110px] pb-14 ${
              focusMode ? 'focus-mode-content' : ''
            }`}
          >
            <EditorContent editor={editor} />
          </div>
        )}
      </div>

      {slashMenu.open && editor && (
        <SlashMenu editor={editor} position={slashMenu.position} onClose={handleSlashClose} />
      )}

      {/* 하단 상태 바 */}
      <div className="h-7 flex items-center justify-between px-4 border-t border-black/[0.04] shrink-0">
        <span className="text-[10px] text-[#c8c8c0] truncate max-w-[50%]">
          {activeFilePath ? activeFilePath.split('/').slice(-1)[0] : ''}
        </span>
        <span className="text-[10px] text-[#c8c8c0]">
          {markdownMode ? 'WYSIWYM' : 'RAW'} · Cmd+/ 서식
        </span>
      </div>
    </div>
  )
}
