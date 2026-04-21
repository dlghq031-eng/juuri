import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { markdownModeRef } from './MarkdownModePlugin'

const wysiwymKey = new PluginKey<DecorationSet>('wysiwym')

export const WysiwymDecorator = Extension.create({
  name: 'wysiwymDecorator',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: wysiwymKey,
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(_tr, _prev, _oldState, newState) {
            const { selection, doc } = newState
            const decorations: Decoration[] = []

            doc.nodesBetween(selection.from, selection.to, (node, pos) => {
              if (!node.isBlock || node.type.name === 'doc') return

              // wysiwym-active: Focus Mode용 — MD 모드와 무관하게 항상 부여
              const classes: string[] = ['wysiwym-active']

              // wysiwym-{type}-{level}: WYSIWYM 기호 표시 — MD On일 때만 부여
              if (markdownModeRef.current) {
                const level = node.attrs?.level ? `-${node.attrs.level}` : ''
                classes.push(`wysiwym-${node.type.name}${level}`)
              }

              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, { class: classes.join(' ') })
              )
              return false
            })

            return DecorationSet.create(doc, decorations)
          },
        },
        props: {
          decorations(state) {
            return wysiwymKey.getState(state)
          },
        },
      }),
    ]
  },
})
