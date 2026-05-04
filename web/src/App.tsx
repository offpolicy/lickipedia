import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import { Editor } from './views/Editor'
import { Library } from './views/Library'
import { EditorProvider } from './state/EditorContext'

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <nav className="flex gap-4 p-3 border-b border-zinc-800">
          <Link to="/" className="font-bold">Lickipedia</Link>
          <Link to="/library" className="text-zinc-400 hover:text-zinc-100">Library</Link>
        </nav>
        <EditorProvider>
          <Routes>
            <Route path="/" element={<Editor />} />
            <Route path="/library" element={<Library />} />
            <Route path="/lick/:id" element={<Editor />} />
          </Routes>
        </EditorProvider>
      </div>
    </HashRouter>
  )
}
