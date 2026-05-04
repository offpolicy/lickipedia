import type { Grid } from './grid'
import { totalCells } from './grid'

export type Drum =
  | 'crash' | 'ride'
  | 'hihat-open' | 'hihat-closed' | 'hihat-pedal'
  | 'tom-high' | 'tom-mid' | 'tom-floor'
  | 'snare'
  | 'kick'
  | 'cowbell' | 'clap'

export const DRUMS: readonly Drum[] = [
  'crash', 'ride',
  'hihat-open', 'hihat-closed', 'hihat-pedal',
  'tom-high', 'tom-mid', 'tom-floor',
  'snare',
  'kick',
  'cowbell', 'clap',
] as const

export type Ornament = 'none' | 'flam' | 'drag' | 'buzz'
export type Hit = { accent: boolean; ornament: Ornament }

export type KitId = 'acoustic'

export type Lick = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  bpm: number
  kit: KitId
  grid: Grid
  hits: Record<string, Hit>
  notes?: string
}

export function hitKey(drum: Drum, step: number): string {
  return `${drum}:${step}`
}

const DEFAULT_GRID: Grid = {
  bars: 2,
  timeSig: { beats: 4, unit: 4 },
  subdivision: 4,
}

export function newLick(partial?: Partial<Lick>): Lick {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: 'Untitled',
    createdAt: now,
    updatedAt: now,
    bpm: 100,
    kit: 'acoustic',
    grid: DEFAULT_GRID,
    hits: {},
    ...partial,
  }
}

function touch(lick: Lick): Lick {
  return { ...lick, updatedAt: new Date().toISOString() }
}

export function toggleHit(lick: Lick, drum: Drum, step: number): Lick {
  const key = hitKey(drum, step)
  const hits = { ...lick.hits }
  if (hits[key]) delete hits[key]
  else hits[key] = { accent: false, ornament: 'none' }
  return touch({ ...lick, hits })
}

export function setAccent(lick: Lick, drum: Drum, step: number, accent: boolean): Lick {
  const key = hitKey(drum, step)
  if (!lick.hits[key]) return lick
  return touch({ ...lick, hits: { ...lick.hits, [key]: { ...lick.hits[key], accent } } })
}

export function setOrnament(lick: Lick, drum: Drum, step: number, ornament: Ornament): Lick {
  const key = hitKey(drum, step)
  if (!lick.hits[key]) return lick
  return touch({ ...lick, hits: { ...lick.hits, [key]: { ...lick.hits[key], ornament } } })
}

export function resizeGrid(lick: Lick, grid: Grid): { lick: Lick; discarded: number } {
  const max = totalCells(grid)
  const hits: Record<string, Hit> = {}
  let discarded = 0
  for (const [key, hit] of Object.entries(lick.hits)) {
    const step = Number(key.split(':')[1])
    if (step < max) hits[key] = hit
    else discarded++
  }
  return { lick: touch({ ...lick, grid, hits }), discarded }
}
