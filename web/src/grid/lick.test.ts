import { describe, it, expect } from 'vitest'
import { newLick, toggleHit, setAccent, setOrnament, hitKey, resizeGrid } from './lick'
import { totalCells } from './grid'

describe('lick mutations', () => {
  it('newLick has empty hits and a name', () => {
    const lick = newLick()
    expect(lick.hits).toEqual({})
    expect(lick.name.length).toBeGreaterThan(0)
    expect(lick.bpm).toBeGreaterThan(0)
  })

  it('toggleHit adds then removes a hit', () => {
    let lick = newLick()
    lick = toggleHit(lick, 'snare', 4)
    expect(lick.hits[hitKey('snare', 4)]).toEqual({ accent: false, ornament: 'none' })
    lick = toggleHit(lick, 'snare', 4)
    expect(lick.hits[hitKey('snare', 4)]).toBeUndefined()
  })

  it('setAccent only applies if hit exists', () => {
    let lick = newLick()
    lick = setAccent(lick, 'snare', 4, true)
    expect(lick.hits[hitKey('snare', 4)]).toBeUndefined() // still no hit
    lick = toggleHit(lick, 'snare', 4)
    lick = setAccent(lick, 'snare', 4, true)
    expect(lick.hits[hitKey('snare', 4)]?.accent).toBe(true)
  })

  it('setOrnament cycles through values', () => {
    let lick = toggleHit(newLick(), 'kick', 0)
    lick = setOrnament(lick, 'kick', 0, 'flam')
    expect(lick.hits[hitKey('kick', 0)]?.ornament).toBe('flam')
    lick = setOrnament(lick, 'kick', 0, 'none')
    expect(lick.hits[hitKey('kick', 0)]?.ornament).toBe('none')
  })

  it('updatedAt advances on mutation', async () => {
    const lick = newLick()
    await new Promise((r) => setTimeout(r, 5))
    const after = toggleHit(lick, 'kick', 0)
    expect(after.updatedAt > lick.updatedAt).toBe(true)
  })
})

describe('resizeGrid', () => {
  it('discards hits whose step no longer exists', () => {
    let lick = newLick()
    // grid has 32 cells; add a hit at step 31
    lick = toggleHit(lick, 'snare', 31)
    const newGrid = { ...lick.grid, bars: 1 }  // halves to 16 cells
    const { lick: shrunk, discarded } = resizeGrid(lick, newGrid)
    expect(totalCells(shrunk.grid)).toBe(16)
    expect(shrunk.hits[hitKey('snare', 31)]).toBeUndefined()
    expect(discarded).toBe(1)
  })

  it('keeps hits within range when growing', () => {
    let lick = newLick()
    lick = toggleHit(lick, 'kick', 0)
    const newGrid = { ...lick.grid, bars: 4 }
    const { lick: grown, discarded } = resizeGrid(lick, newGrid)
    expect(grown.hits[hitKey('kick', 0)]).toBeDefined()
    expect(discarded).toBe(0)
  })
})
