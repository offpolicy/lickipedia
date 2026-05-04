import { useState } from 'react'
import { StepGrid } from '../components/StepGrid'
import { CellSheet } from '../components/CellSheet'
import { Toolbar } from '../components/Toolbar'
import { Transport } from '../components/Transport'
import type { Drum } from '../grid/lick'

export function Editor() {
  const [activeCell, setActiveCell] = useState<{ drum: Drum; step: number } | null>(null)
  return (
    <div className="p-4 pb-24">
      <Toolbar />
      <StepGrid onCellLongPress={(drum, step) => setActiveCell({ drum, step })} />
      {activeCell && (
        <CellSheet
          drum={activeCell.drum}
          step={activeCell.step}
          onClose={() => setActiveCell(null)}
        />
      )}
      <Transport />
    </div>
  )
}
