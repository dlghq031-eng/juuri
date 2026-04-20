import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

// 모듈 수준 ref — 에디터 컴포넌트에서 markdown 모드 변경 시 이 값을 업데이트
export const markdownModeRef = { current: true }

const markdownModeKey = new PluginKey('markdownMode')

/**
 * 마크다운 On/Off 토글 플러그인
 *
 * Off 상태일 때 handleTextInput이 직접 텍스트를 삽입하고 true를 반환해
 * 뒤이어 실행될 Input Rules 플러그인이 동작하지 않도록 막는다.
 *
 * Priority 200: Input Rules(기본 100)보다 먼저 실행되도록 우선순위를 높임.
 */
export const MarkdownModePlugin = Extension.create({
  name: 'markdownModePlugin',
  priority: 200,

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: markdownModeKey,
        props: {
          handleTextInput(view, from, to, text) {
            if (!markdownModeRef.current) {
              // 텍스트를 직접 삽입하고 Input Rules가 뜨지 않도록 소비(true 반환)
              view.dispatch(view.state.tr.insertText(text, from, to))
              return true
            }
            return false
          },
        },
      }),
    ]
  },
})
