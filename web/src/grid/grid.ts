export type TimeSignature = { beats: number; unit: 1 | 2 | 4 | 8 | 16 }
export type Subdivision = 1 | 2 | 3 | 4 | 6 | 8

export type Grid = {
  bars: number
  timeSig: TimeSignature
  subdivision: Subdivision
}

export function totalCells(grid: Grid): number {
  return grid.bars * grid.timeSig.beats * grid.subdivision
}

export function loopSeconds(grid: Grid, bpm: number): number {
  const secondsPerBeat = (60 / bpm) * (4 / grid.timeSig.unit)
  return grid.bars * grid.timeSig.beats * secondsPerBeat
}

export function stepToBeat(grid: Grid, step: number): { bar: number; beat: number; sub: number } {
  const cellsPerBar = grid.timeSig.beats * grid.subdivision
  const bar = Math.floor(step / cellsPerBar)
  const remainder = step - bar * cellsPerBar
  const beat = Math.floor(remainder / grid.subdivision)
  const sub = remainder - beat * grid.subdivision
  return { bar, beat, sub }
}

export function beatToStep(grid: Grid, bar: number, beat: number, sub: number): number {
  return bar * grid.timeSig.beats * grid.subdivision + beat * grid.subdivision + sub
}

export function stepSeconds(grid: Grid, bpm: number, step: number): number {
  return (loopSeconds(grid, bpm) / totalCells(grid)) * step
}
