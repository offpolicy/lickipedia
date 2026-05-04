import { useEffect, useRef, useState } from 'react'
import { useEditor } from '../state/EditorContext'

// Cache the dynamically-imported engine module so subsequent plays/stops use the same instance.
let enginePromise: Promise<typeof import('../audio/engine')> | null = null
function loadEngine() {
  if (!enginePromise) enginePromise = import('../audio/engine')
  return enginePromise
}

type Playhead = { t0: number; loopLen: number }

export function Transport() {
  const { state, dispatch } = useEditor()
  const [loading, setLoading] = useState(false)
  const [playhead, setPlayhead] = useState<Playhead | null>(null)
  const [progress, setProgress] = useState(0)
  const [barBeat, setBarBeat] = useState({ bar: 1, beat: 1 })
  const rafRef = useRef<number | null>(null)
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  const onPlay = async () => {
    if (loading) return
    setLoading(true)
    try {
      const eng = await loadEngine()
      await eng.ensureStarted('acoustic', import.meta.env.BASE_URL)
      eng.onLoopStart((t0, loopLen) => setPlayhead({ t0, loopLen }))
      eng.play(stateRef.current.lick, { countIn: stateRef.current.countIn })
      dispatch({ type: 'set-playing', playing: true })
    } catch (err) {
      console.error('Failed to start audio:', err)
    } finally {
      setLoading(false)
    }
  }

  const onStop = async () => {
    const eng = await loadEngine()
    eng.stop()
    eng.onLoopStart(null)
    dispatch({ type: 'set-playing', playing: false })
    setPlayhead(null)
    setProgress(0)
    setBarBeat({ bar: 1, beat: 1 })
  }

  // rAF loop: animate progress + bar/beat readout while a playhead is set.
  useEffect(() => {
    if (!playhead) return
    let mounted = true
    let engNow: (() => number) | null = null
    void loadEngine().then(eng => {
      if (!mounted) return
      engNow = eng.now
      const tick = () => {
        if (!mounted || !engNow) return
        const elapsed = engNow() - playhead.t0
        const wrapped = ((elapsed % playhead.loopLen) + playhead.loopLen) % playhead.loopLen
        const p = Math.max(0, Math.min(1, wrapped / playhead.loopLen))
        setProgress(p)
        const grid = stateRef.current.lick.grid
        const beatsPerBar = grid.timeSig.beats
        const totalBeats = grid.bars * beatsPerBar
        const currentBeat = Math.floor(p * totalBeats)
        setBarBeat({
          bar: Math.floor(currentBeat / beatsPerBar) + 1,
          beat: (currentBeat % beatsPerBar) + 1,
        })
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    })
    return () => {
      mounted = false
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [playhead])

  // Cleanup on unmount: deregister callback if user navigates away mid-playback.
  useEffect(() => {
    return () => {
      void loadEngine().then(eng => eng.onLoopStart(null))
    }
  }, [])

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 border-t border-zinc-800 bg-zinc-950/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
      {state.isPlaying && (
        <div className="flex w-full max-w-md items-center gap-3 px-1">
          <div className="min-w-[5.5rem] text-xs tabular-nums text-zinc-400">
            Bar {barBeat.bar} · Beat {barBeat.beat}
          </div>
          <div className="h-1 flex-1 overflow-hidden rounded bg-zinc-800">
            <div
              className="h-full bg-amber-400 transition-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex gap-3">
        {state.isPlaying
          ? <button type="button" onClick={onStop} className="rounded-full bg-red-500 px-6 py-3 font-semibold text-white">Stop</button>
          : <button type="button" onClick={onPlay} disabled={loading} className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-zinc-950 disabled:opacity-50 disabled:cursor-wait">{loading ? 'Loading…' : 'Play'}</button>}
      </div>
    </div>
  )
}
