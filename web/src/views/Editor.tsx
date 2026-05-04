import { useState } from 'react'
import { StepGrid } from '../components/StepGrid'
import type { Drum } from '../grid/lick'

export function Editor() {
  const [activeCell, setActiveCell] = useState<{ drum: Drum; step: number } | null>(null)
  return (
    <div className="p-4">
      <StepGrid onCellLongPress={(drum, step) => setActiveCell({ drum, step })} />
      {activeCell && <div className="mt-4 text-sm text-zinc-400">long-press: {activeCell.drum}:{activeCell.step}</div>}
    </div>
  )
}
