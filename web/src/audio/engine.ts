import * as Tone from 'tone'
import type { Lick } from '../grid/lick'
import { loopSeconds } from '../grid/grid'
import { buildSchedule } from './schedule'
import { loadKit, type KitId } from './kit'

let toneStarted = false
let players: Tone.Players | null = null
let stopRequested = false
let loopTimeout: ReturnType<typeof setTimeout> | null = null

export async function ensureStarted(kit: KitId, baseUrl: string): Promise<void> {
  if (!toneStarted) {
    await Tone.start()
    toneStarted = true
  }
  if (!players) players = await loadKit(kit, baseUrl)
}

export function isStarted(): boolean {
  return toneStarted && players !== null
}

function scheduleLoop(lick: Lick, t0: number): void {
  if (!players || stopRequested) return
  const sched = buildSchedule(lick)
  const loopLen = loopSeconds(lick.grid, lick.bpm)
  for (const ev of sched) {
    if (ev.time < 0 || ev.time >= loopLen) continue
    const player = players.player(ev.drum)
    player.volume.value = Tone.gainToDb(ev.velocity)
    player.start(t0 + ev.time)
  }
  // schedule next loop ~50ms before the previous one ends
  const delayMs = (loopLen * 1000) - 50
  loopTimeout = setTimeout(() => scheduleLoop(lick, t0 + loopLen), delayMs)
}

export function play(lick: Lick): void {
  stopRequested = false
  if (loopTimeout) clearTimeout(loopTimeout)
  const t0 = Tone.now() + 0.05  // small lead-in
  scheduleLoop(lick, t0)
}

export function stop(): void {
  stopRequested = true
  if (loopTimeout) {
    clearTimeout(loopTimeout)
    loopTimeout = null
  }
  if (players) {
    // stop any currently-playing one-shots
    for (const drum of [
      'crash','ride','hihat-open','hihat-closed','hihat-pedal',
      'tom-high','tom-mid','tom-floor','snare','kick','cowbell','clap',
    ] as const) {
      try { players.player(drum).stop() } catch { /* ignore */ }
    }
  }
}
