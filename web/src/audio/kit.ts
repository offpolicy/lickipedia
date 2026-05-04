import * as Tone from 'tone'
import type { Drum } from '../grid/lick'

export type KitId = 'acoustic'

const SAMPLE_PATHS: Record<Drum, string> = {
  'crash':         'kits/acoustic/crash.ogg',
  'ride':          'kits/acoustic/ride.ogg',
  'hihat-open':    'kits/acoustic/hihat-open.ogg',
  'hihat-closed':  'kits/acoustic/hihat-closed.ogg',
  'hihat-pedal':   'kits/acoustic/hihat-pedal.ogg',
  'tom-high':      'kits/acoustic/tom-high.ogg',
  'tom-mid':       'kits/acoustic/tom-mid.ogg',
  'tom-floor':     'kits/acoustic/tom-floor.ogg',
  'snare':         'kits/acoustic/snare.ogg',
  'kick':          'kits/acoustic/kick.ogg',
  'cowbell':       'kits/acoustic/cowbell.ogg',
  'clap':          'kits/acoustic/clap.ogg',
}

const cache = new Map<KitId, Tone.Players>()
const loading = new Map<KitId, Promise<Tone.Players>>()

export async function loadKit(kit: KitId, baseUrl: string): Promise<Tone.Players> {
  if (cache.has(kit)) return cache.get(kit)!
  if (loading.has(kit)) return loading.get(kit)!
  const urls: Record<string, string> = {}
  for (const [drum, path] of Object.entries(SAMPLE_PATHS)) {
    urls[drum] = `${baseUrl}${path}`
  }
  const promise = new Promise<Tone.Players>((resolve, reject) => {
    const players = new Tone.Players({
      urls,
      onload: () => {
        cache.set(kit, players)
        loading.delete(kit)
        resolve(players)
      },
      onerror: (err) => {
        loading.delete(kit)
        reject(err)
      },
    }).toDestination()
  })
  loading.set(kit, promise)
  return promise
}
