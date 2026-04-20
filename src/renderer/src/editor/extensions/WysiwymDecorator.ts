import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { markdownModeRef } from './MarkdownModePlugin'

const wysiwymKey = new PluginKey<DecorationSet>('wysiwym')

/**
 * WYSIWYM Decorator
 *
 * 마크다운 On 상태에서 커서가 블록 안에 있을 때 해당 블록에
 * wysiwym-{type}-{level} CSS 클래스를 추가한다.
 * CSS ::before 규칙으로 '#', '##' 등 마크다운 기호를 시각화.
 * 마크다운 Off 상태에서는 아무 데코레이션도 추가하지 않는다.
 */
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
            if (!markdownModeRef.current) return DecorationSet.empty

            const { selection, doc } = newState
            const decorations: Decoration[] = []

            doc.nodesBetween(selection.from, selection.to, (node, pos) => {
              if (!node.isBlock || node.type.name === 'doc') return
              const level = node.attrs?.level ? `-${node.attrs.level}` : ''
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: `wysiwym-active wysiwym-${node.type.name}${level}`,
                })
              )
              return false // 자식 노드는 탐색하지 않음
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
