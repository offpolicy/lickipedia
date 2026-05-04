import { describe, it, expect } from 'vitest'
import { totalCells, loopSeconds, stepToBeat, beatToStep } from './grid'

describe('grid math', () => {
  it('totalCells: 4/4 in 16ths over 2 bars = 32', () => {
    expect(totalCells({ bars: 2, timeSig: { beats: 4, unit: 4 }, subdivision: 4 })).toBe(32)
  })

  it('totalCells: 7/8 in 8ths over 1 bar = 7', () => {
    expect(totalCells({ bars: 1, timeSig: { beats: 7, unit: 8 }, subdivision: 1 })).toBe(7)
  })

  it('totalCells: 6/8 in triplets over 1 bar = 18', () => {
    expect(totalCells({ bars: 1, timeSig: { beats: 6, unit: 8 }, subdivision: 3 })).toBe(18)
  })

  it('loopSeconds: 4/4 2 bars at 120bpm = 4s', () => {
    expect(loopSeconds({ bars: 2, timeSig: { beats: 4, unit: 4 }, subdivision: 4 }, 120)).toBeCloseTo(4)
  })

  it('loopSeconds: 4/4 in 8th-unit beats halves duration', () => {
    // 4 beats of 8th-notes at 120 = 4 * (60/120) * (4/8) = 1s
    expect(loopSeconds({ bars: 1, timeSig: { beats: 4, unit: 8 }, subdivision: 2 }, 120)).toBeCloseTo(1)
  })

  it('stepToBeat / beatToStep round-trip', () => {
    const grid = { bars: 2, timeSig: { beats: 4, unit: 4 } as const, subdivision: 4 as const }
    for (let s = 0; s < totalCells(grid); s++) {
      const { bar, beat, sub } = stepToBeat(grid, s)
      expect(beatToStep(grid, bar, beat, sub)).toBe(s)
    }
  })
})
