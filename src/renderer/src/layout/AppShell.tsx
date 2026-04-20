import Sidebar from './Sidebar'
import FileList from './FileList'
import Editor from '../editor/Editor'

export default function AppShell(): React.JSX.Element {
  return (
    <div className="flex h-full w-full overflow-hidden select-none">
      <Sidebar />
      <FileList />
      <Editor />
    </div>
  )
}
