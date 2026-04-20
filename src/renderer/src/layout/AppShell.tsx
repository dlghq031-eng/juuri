import Sidebar from './Sidebar'
import FileList from './FileList'

export default function AppShell(): React.JSX.Element {
  return (
    <div className="flex h-full w-full overflow-hidden select-none">
      <Sidebar />
      <FileList />

      {/* Phase 1-4에서 Tiptap 에디터로 교체 예정 */}
      <main className="flex-1 flex flex-col items-center justify-center bg-[#242426]">
        <div className="text-center space-y-2">
          <p className="text-[#3a3a3e] text-4xl">✦</p>
          <p className="text-[#4a4a4e] text-sm">파일을 선택하면 에디터가 열립니다</p>
        </div>
      </main>
    </div>
  )
}
