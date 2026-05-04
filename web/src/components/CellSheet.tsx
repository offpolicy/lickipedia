import { useEffect } from 'react'
import { useEditor } from '../state/EditorContext'
import { hitKey, type Drum, type Ornament } from '../grid/lick'

const ORNAMENTS: Ornament[] = ['none', 'flam', 'drag', 'buzz']

export function CellSheet({ drum, step, onClose }: { drum: Drum; step: number; onClose: () => void }) {
  const { state, dispatch } = useEditor()
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  const hit = state.lick.hits[hitKey(drum, step)]
  if (!hit) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-zinc-900 p-4 shadow-2xl border-t border-zinc-700">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-400">{drum} · step {step + 1}</div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-zinc-400 px-2"
        >×</button>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={hit.accent}
          onChange={(e) => dispatch({ type: 'set-accent', drum, step, accent: e.target.checked })}
        />
        Accent
      </label>
      <div className="mt-4 flex gap-2">
        {ORNAMENTS.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => dispatch({ type: 'set-ornament', drum, step, ornament: o })}
            aria-pressed={hit.ornament === o}
            className={`px-3 py-2 rounded text-sm ${hit.ornament === o ? 'bg-amber-400 text-zinc-900' : 'bg-zinc-800 text-zinc-300'}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
