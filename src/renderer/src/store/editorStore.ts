import { create } from 'zustand'

interface EditorState {
  markdownMode: boolean
  focusMode: boolean
  wordCount: number
  wordGoal: number | null
  toggleMarkdownMode: () => void
  toggleFocusMode: () => void
  setWordCount: (count: number) => void
  setWordGoal: (goal: number | null) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  markdownMode: true,
  focusMode: false,
  wordCount: 0,
  wordGoal: null,
  toggleMarkdownMode: () => set((s) => ({ markdownMode: !s.markdownMode })),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  setWordCount: (count) => set({ wordCount: count }),
  setWordGoal: (goal) => set({ wordGoal: goal }),
}))
