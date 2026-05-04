import { useEditor } from '../state/EditorContext'
import { totalCells } from '../grid/grid'
import type { Grid, Subdivision, TimeSignature } from '../grid/grid'

const UNITS: TimeSignature['unit'][] = [2, 4, 8, 16]
const SUBS: { id: Subdivision; label: string }[] = [
  { id: 1, label: '1/beat' }, { id: 2, label: '8th' },
  { id: 3, label: 'triplet' }, { id: 4, label: '16th' },
  { id: 6, label: '16-trip' }, { id: 8, label: '32nd' },
]
const BARS = [1, 2, 4, 8]

export function Toolbar() {
  const { state, dispatch } = useEditor()
  const { lick, countIn } = state

  const wouldDiscard = (newGrid: Grid) => {
    const max = totalCells(newGrid)
    return Object.keys(lick.hits).some((k) => Number(k.split(':')[1]) >= max)
  }
  const tryResize = (newGrid: Grid) => {
    if (wouldDiscard(newGrid) && !confirm('This will discard hits that no longer fit. Continue?')) return
    dispatch({ type: 'resize-grid', grid: newGrid })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-zinc-900 border-b border-zinc-800">
      <input
        value={lick.name}
        onChange={(e) => dispatch({ type: 'set-name', name: e.target.value })}
        className="bg-transparent border-b border-zinc-700 px-1 text-lg font-semibold focus:outline-none focus:border-amber-400"
      />
      <label className="text-sm flex items-center gap-2">
        BPM
        <input
          type="number" min={40} max={240} value={lick.bpm}
          onChange={(e) => dispatch({ type: 'set-bpm', bpm: Number(e.target.value) })}
          className="w-16 bg-zinc-800 px-2 py-1 rounded"
        />
      </label>
      <label className="text-sm flex items-center gap-2">
        Time
        <input
          type="number" min={1} max={15} value={lick.grid.timeSig.beats}
          onChange={(e) => tryResize({ ...lick.grid, timeSig: { ...lick.grid.timeSig, beats: Number(e.target.value) } })}
          className="w-12 bg-zinc-800 px-2 py-1 rounded"
        />
        /
        <select
          value={lick.grid.timeSig.unit}
          onChange={(e) => tryResize({ ...lick.grid, timeSig: { ...lick.grid.timeSig, unit: Number(e.target.value) as TimeSignature['unit'] } })}
          className="bg-zinc-800 px-2 py-1 rounded"
        >
          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </label>
      <label className="text-sm flex items-center gap-2">
        Bars
        <select
          value={lick.grid.bars}
          onChange={(e) => tryResize({ ...lick.grid, bars: Number(e.target.value) })}
          className="bg-zinc-800 px-2 py-1 rounded"
        >
          {BARS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </label>
      <label className="text-sm flex items-center gap-2">
        Sub
        <select
          value={lick.grid.subdivision}
          onChange={(e) => tryResize({ ...lick.grid, subdivision: Number(e.target.value) as Subdivision })}
          className="bg-zinc-800 px-2 py-1 rounded"
        >
          {SUBS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </label>
      <label className="text-sm flex items-center gap-2">
        <input type="checkbox" checked={countIn} onChange={(e) => dispatch({ type: 'set-count-in', countIn: e.target.checked })} />
        Count-in
      </label>
    </div>
  )
}
