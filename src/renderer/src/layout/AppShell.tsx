import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import FileList from './FileList'
import Editor from '../editor/Editor'
import VaultPicker from '../components/VaultPicker'
import { FileService } from '../services/FileService'
import { useVaultStore } from '../store/vaultStore'

export default function AppShell(): React.JSX.Element {
  const { vaultPath, tree, setVaultPath, setTree, setSelectedFolderPath } = useVaultStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init(): Promise<void> {
      try {
        const settings = await FileService.getSettings()
        if (settings.vaultPath) {
          const scannedTree = await FileService.scanVault(settings.vaultPath)
          setVaultPath(settings.vaultPath)
          setTree(scannedTree)
          setSelectedFolderPath(settings.vaultPath)
        }
      } catch (e) {
        console.error('Vault init failed:', e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [setVaultPath, setTree, setSelectedFolderPath])

  if (loading) {
    return <div className="flex h-full w-full bg-[#F9F8F4]" />
  }

  if (!vaultPath || !tree) {
    return (
      <div className="flex h-full w-full overflow-hidden select-none">
        <VaultPicker />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden select-none">
      <Sidebar />
      <FileList />
      <Editor />
    </div>
  )
}
