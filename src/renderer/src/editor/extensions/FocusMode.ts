import { Extension } from '@tiptap/core'

export interface FocusModeOptions {
  onToggle: () => void
}

/**
 * FocusMode Extension
 *
 * Cmd+. 단축키로 집중 모드를 토글한다.
 * 실제 dimming 효과는 CSS와 React 상태로 처리한다.
 */
export const FocusMode = Extension.create<FocusModeOptions>({
  name: 'focusMode',

  addOptions() {
    return {
      onToggle: () => {},
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-.': () => {
        this.options.onToggle()
        return true
      },
    }
  },
})
