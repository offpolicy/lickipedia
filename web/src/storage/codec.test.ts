import { describe, it, expect } from 'vitest'
import { encodeLick, decodeLick } from './codec'
import { newLick, toggleHit, setAccent, setOrnament } from '../grid/lick'

describe('lp1 codec', () => {
  it('round-trips an empty lick', () => {
    const lick = newLick({ name: 'Empty' })
    const s = encodeLick(lick)
    expect(s.startsWith('lp1:')).toBe(true)
    const back = decodeLick(s)
    expect(back).toEqual(lick)
  })

  it('round-trips a dense lick with all ornaments and accents', () => {
    let lick = newLick({ name: 'Dense' })
    lick = toggleHit(lick, 'kick', 0)
    lick = setAccent(lick, 'kick', 0, true)
    lick = toggleHit(lick, 'snare', 4)
    lick = setOrnament(lick, 'snare', 4, 'flam')
    lick = toggleHit(lick, 'snare', 8)
    lick = setOrnament(lick, 'snare', 8, 'drag')
    lick = toggleHit(lick, 'snare', 12)
    lick = setOrnament(lick, 'snare', 12, 'buzz')
    const back = decodeLick(encodeLick(lick))
    expect(back).toEqual(lick)
  })

  it('handles unicode in name', () => {
    const lick = newLick({ name: '한국어 슬릭 🥁' })
    expect(decodeLick(encodeLick(lick)).name).toBe('한국어 슬릭 🥁')
  })

  it('rejects strings without lp1: prefix', () => {
    expect(() => decodeLick('not-a-lick')).toThrow()
  })

  it('rejects malformed body', () => {
    expect(() => decodeLick('lp1:!!!notbase64')).toThrow()
  })
})
