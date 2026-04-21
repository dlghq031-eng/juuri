import { FolderOpen } from 'lucide-react'
import { FileService } from '../services/FileService'
import { useVaultStore } from '../store/vaultStore'

export default function VaultPicker(): React.JSX.Element {
  const { setVaultPath, setTree, setSelectedFolderPath } = useVaultStore()

  const handleSelect = async (): Promise<void> => {
    const vaultPath = await FileService.selectVault()
    if (!vaultPath) return

    await FileService.saveSettings(vaultPath)
    const tree = await FileService.scanVault(vaultPath)

    setVaultPath(vaultPath)
    setTree(tree)
    setSelectedFolderPath(vaultPath)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#F9F8F4] gap-6">
      <div className="text-center space-y-2">
        <h1 className="text-[26px] font-bold text-[#1a1a1c] tracking-tight"
          style={{ fontFamily: "'AppleMyungjo', 'Nanum Myeongjo', 'Batang', serif" }}>
          Juuri에 오신 걸 환영합니다
        </h1>
        <p className="text-[14px] text-[#9a9a9e]">글을 저장할 로컬 폴더를 보관소로 선택해 주세요.</p>
        <p className="text-[12px] text-[#c0c0b8]">선택된 폴더 안의 모든 .md 파일이 자동으로 불러와집니다.</p>
      </div>

      <button
        onClick={handleSelect}
        className="flex items-center gap-2.5 px-6 py-3 bg-[#3B7BF5] text-white rounded-xl text-[14px] font-medium hover:bg-[#2e6ee0] transition-colors shadow-sm"
      >
        <FolderOpen size={17} />
        <span>보관소 폴더 선택</span>
      </button>
    </div>
  )
}
