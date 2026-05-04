import { useEffect, useRef } from 'react'
import { useEditor } from '../state/EditorContext'
import { DRUMS, hitKey, type Drum } from '../grid/lick'
import { totalCells } from '../grid/grid'
import { Cell } from './Cell'

export function StepGrid({ onCellLongPress }: {
  onCellLongPress: (drum: Drum, step: number) => void
}) {
  const { state, dispatch } = useEditor()
  const { lick } = state
  const cells = totalCells(lick.grid)
  const stepIndices = Array.from({ length: cells }, (_, i) => i)
  const cellsPerBeat = lick.grid.subdivision

  const paintModeRef = useRef<null | 'fill' | 'clear'>(null)

  const applyPaint = (drum: Drum, step: number) => {
    const has = !!lick.hits[hitKey(drum, step)]
    if (paintModeRef.current === 'fill' && !has) dispatch({ type: 'toggle-hit', drum, step })
    if (paintModeRef.current === 'clear' && has) dispatch({ type: 'toggle-hit', drum, step })
  }
  const onCellPointerDown = (drum: Drum, step: number) => {
    const has = !!lick.hits[hitKey(drum, step)]
    paintModeRef.current = has ? 'clear' : 'fill'
    applyPaint(drum, step)
  }
  const onCellPointerEnter = (drum: Drum, step: number) => {
    if (!paintModeRef.current) return
    applyPaint(drum, step)
  }
  useEffect(() => {
    const up = () => { paintModeRef.current = null }
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [])

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid" style={{ gridTemplateColumns: `120px repeat(${cells}, 44px)` }}>
        {/* header row */}
        <div className="sticky left-0 z-10 bg-zinc-950" />
        {stepIndices.map((s) => (
          <div key={s} className={`text-center text-[10px] text-zinc-500 ${s % cellsPerBeat === 0 ? 'border-l border-zinc-700' : ''}`}>
            {s % cellsPerBeat === 0 ? Math.floor(s / cellsPerBeat) + 1 : ''}
          </div>
        ))}
        {DRUMS.map((drum) => (
          <DrumRow key={drum} drum={drum} stepIndices={stepIndices} cellsPerBeat={cellsPerBeat} />
        ))}
      </div>
    </div>
  )

  function DrumRow({ drum, stepIndices, cellsPerBeat }: { drum: Drum; stepIndices: number[]; cellsPerBeat: number }) {
    return (
      <>
        <div className="sticky left-0 z-10 bg-zinc-950 px-2 py-2 text-xs font-medium text-zinc-300 border-r border-zinc-800">
          {drum}
        </div>
        {stepIndices.map((s) => (
          <div key={s} className={s % cellsPerBeat === 0 ? 'border-l border-zinc-700' : ''}>
            <Cell
              drum={drum}
              step={s}
              hit={lick.hits[hitKey(drum, s)]}
              onPointerDown={() => onCellPointerDown(drum, s)}
              onPointerEnter={() => onCellPointerEnter(drum, s)}
              onLongPress={() => onCellLongPress(drum, s)}
            />
          </div>
        ))}
      </>
    )
  }
}
