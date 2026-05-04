import { describe, it, expect } from 'vitest'
import { buildSchedule } from './schedule'
import { newLick, toggleHit, setAccent, setOrnament } from '../grid/lick'

describe('buildSchedule', () => {
  it('empty lick yields no hits', () => {
    expect(buildSchedule(newLick())).toEqual([])
  })

  it('single kick on step 0 yields one event at t=0', () => {
    const lick = toggleHit(newLick(), 'kick', 0)
    const sched = buildSchedule(lick)
    expect(sched).toHaveLength(1)
    expect(sched[0]).toMatchObject({ drum: 'kick', time: 0 })
  })

  it('flam yields two events: grace before main', () => {
    let lick = toggleHit(newLick(), 'snare', 4)
    lick = setOrnament(lick, 'snare', 4, 'flam')
    const sched = buildSchedule(lick)
    expect(sched).toHaveLength(2)
    expect(sched[0].time).toBeLessThan(sched[1].time)
    expect(sched[1].velocity).toBeGreaterThan(sched[0].velocity)
  })

  it('drag yields three events', () => {
    let lick = toggleHit(newLick(), 'snare', 4)
    lick = setOrnament(lick, 'snare', 4, 'drag')
    expect(buildSchedule(lick)).toHaveLength(3)
  })

  it('buzz yields four events', () => {
    let lick = toggleHit(newLick(), 'snare', 4)
    lick = setOrnament(lick, 'snare', 4, 'buzz')
    expect(buildSchedule(lick)).toHaveLength(4)
  })

  it('accent boosts main hit velocity', () => {
    const base = buildSchedule(toggleHit(newLick(), 'kick', 0))[0]
    const accented = buildSchedule(setAccent(toggleHit(newLick(), 'kick', 0), 'kick', 0, true))[0]
    expect(accented.velocity).toBeGreaterThan(base.velocity)
  })

  it('events sorted by time ascending', () => {
    let lick = toggleHit(newLick(), 'kick', 0)
    lick = toggleHit(lick, 'snare', 4)
    lick = toggleHit(lick, 'kick', 8)
    const sched = buildSchedule(lick)
    for (let i = 1; i < sched.length; i++) {
      expect(sched[i].time).toBeGreaterThanOrEqual(sched[i - 1].time)
    }
  })
})
