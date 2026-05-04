import type { Drum, Lick, Ornament } from '../grid/lick'
import { stepSeconds } from '../grid/grid'

export type ScheduledHit = {
  drum: Drum
  time: number       // seconds from loop start
  velocity: number   // 0..1
}

const BASE_VELOCITY = 0.85
const ACCENT_BOOST = 1.0  // linear gain in [0, 1]; engine passes via Tone.gainToDb (this gives ~+1.4 dB; revisit in Task 11 ear-test if too subtle)

type GraceSpec = { offset: number; velocity: number }[]

const ORNAMENT_GRACE: Record<Ornament, GraceSpec> = {
  none: [],
  flam: [{ offset: -0.025, velocity: 0.6 }],
  drag: [{ offset: -0.05, velocity: 0.45 }, { offset: -0.025, velocity: 0.45 }],
  buzz: [{ offset: 0.015, velocity: 0.7 }, { offset: 0.030, velocity: 0.55 }, { offset: 0.045, velocity: 0.4 }],
}

/**
 * Builds the timed event list for one loop iteration of `lick`.
 * - Events are ordered by ascending `time`.
 * - `time` may be negative when an ornament's grace note precedes the loop start
 *   (e.g., a flam on step 0 produces a grace at t = -0.025). Consumers decide
 *   whether to drop, clamp, or wrap such events. The Phase 1 engine drops them.
 * - `velocity` is linear gain in [0, 1].
 */
export function buildSchedule(lick: Lick): ScheduledHit[] {
  const out: ScheduledHit[] = []
  for (const [key, hit] of Object.entries(lick.hits)) {
    const [drum, stepStr] = key.split(':') as [Drum, string]
    const step = Number(stepStr)
    const t = stepSeconds(lick.grid, lick.bpm, step)
    const mainVelocity = hit.accent ? ACCENT_BOOST : BASE_VELOCITY
    if (hit.ornament === 'buzz') {
      // buzz: main first, then bounces. Tail extends to +45ms — at fast tempos
      // it may overlap the next cell on the same drum, which retriggers and cuts
      // it cleanly. Intentional.
      out.push({ drum, time: t, velocity: mainVelocity })
      for (const g of ORNAMENT_GRACE.buzz) {
        out.push({ drum, time: t + g.offset, velocity: g.velocity })
      }
    } else {
      // flam/drag: grace notes first, then main
      for (const g of ORNAMENT_GRACE[hit.ornament]) {
        out.push({ drum, time: t + g.offset, velocity: g.velocity })
      }
      out.push({ drum, time: t, velocity: mainVelocity })
    }
  }
  // stable sort (ES2019+): same-time events preserve insertion order, which
  // is Object.entries(lick.hits) iteration order — first-toggled first.
  out.sort((a, b) => a.time - b.time)
  return out
}
