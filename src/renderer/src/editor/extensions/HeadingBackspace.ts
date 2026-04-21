import { Extension } from '@tiptap/core'

export const HeadingBackspace = Extension.create({
  name: 'headingBackspace',

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { state } = this.editor
        const { selection } = state
        const { $anchor, empty } = selection

        if (!empty || $anchor.parentOffset !== 0) return false
        if ($anchor.parent.type.name !== 'heading') return false

        const level: number = $anchor.parent.attrs.level ?? 1
        const prefix = '#'.repeat(level) + ' '

        return this.editor
          .chain()
          .focus()
          .setNode('paragraph')
          .insertContentAt(this.editor.state.selection.anchor, prefix)
          .run()
      },
    }
  },
})
