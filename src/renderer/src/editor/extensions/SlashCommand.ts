import { Extension } from '@tiptap/core'

export interface SlashCommandOptions {
  /** Cmd+/ 가 눌렸을 때 호출되는 콜백 */
  onOpen: (coords: { top: number; left: number }) => void
}

/**
 * SlashCommand Extension
 *
 * Cmd+/ (Mod-/) 단축키를 처리한다.
 * 마크다운 모드 On/Off 와 완전히 독립적으로 동작하며,
 * 항상 슬래시 메뉴를 열 수 있다.
 */
export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      onOpen: () => {},
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-/': () => {
        const { view, state } = this.editor
        const { from } = state.selection
        const coords = view.coordsAtPos(from)
        this.options.onOpen({ top: coords.bottom + 8, left: coords.left })
        return true
      },
    }
  },
})
