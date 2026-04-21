import { create } from 'zustand'

// 트리에서 특정 파일의 preview를 불변 업데이트
function updatePreviewInTree(node: FolderNode, filePath: string, preview: string): FolderNode {
  return {
    ...node,
    files: node.files.map((f) => (f.path === filePath ? { ...f, preview } : f)),
    children: node.children.map((child) => updatePreviewInTree(child, filePath, preview)),
  }
}

interface VaultState {
  vaultPath: string | null
  tree: FolderNode | null
  selectedFolderPath: string | null
  activeFilePath: string | null
  isSaving: boolean

  setVaultPath: (path: string) => void
  setTree: (tree: FolderNode) => void
  setSelectedFolderPath: (path: string | null) => void
  setActiveFilePath: (path: string | null) => void
  setSaving: (saving: boolean) => void
  updateFilePreview: (filePath: string, preview: string) => void
  clearVault: () => void
}

export const useVaultStore = create<VaultState>((set) => ({
  vaultPath: null,
  tree: null,
  selectedFolderPath: null,
  activeFilePath: null,
  isSaving: false,

  setVaultPath: (path) => set({ vaultPath: path }),
  setTree: (tree) => set({ tree }),
  setSelectedFolderPath: (path) => set({ selectedFolderPath: path }),
  setActiveFilePath: (path) => set({ activeFilePath: path }),
  setSaving: (saving) => set({ isSaving: saving }),

  updateFilePreview: (filePath, preview) =>
    set((state) => ({
      tree: state.tree ? updatePreviewInTree(state.tree, filePath, preview) : null,
    })),

  clearVault: () =>
    set({ vaultPath: null, tree: null, selectedFolderPath: null, activeFilePath: null }),
}))
