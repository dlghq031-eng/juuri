import { Extension } from '@tiptap/core'

export const TabIndent = Extension.create({
  name: 'tabIndent',

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        // 리스트 안: 들여쓰기
        if (this.editor.can().sinkListItem('listItem')) {
          return this.editor.commands.sinkListItem('listItem')
        }
        // 그 외: 탭 문자 삽입 (CSS tab-size로 폭 제어)
        this.editor.commands.insertContent('\t')
        return true
      },
      'Shift-Tab': () => {
        if (this.editor.can().liftListItem('listItem')) {
          return this.editor.commands.liftListItem('listItem')
        }
        return true
      },
    }
  },
})
