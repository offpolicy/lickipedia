import { useState } from 'react'
import { useEditor } from '../state/EditorContext'
import { ensureStarted, play, stop } from '../audio/engine'

export function Transport() {
  const { state, dispatch } = useEditor()
  const [loading, setLoading] = useState(false)

  const onPlay = async () => {
    if (loading) return
    setLoading(true)
    try {
      await ensureStarted('acoustic', import.meta.env.BASE_URL)
      play(state.lick, { countIn: state.countIn })
      dispatch({ type: 'set-playing', playing: true })
    } catch (err) {
      console.error('Failed to start audio:', err)
    } finally {
      setLoading(false)
    }
  }
  const onStop = () => {
    stop()
    dispatch({ type: 'set-playing', playing: false })
  }
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center gap-3 border-t border-zinc-800 bg-zinc-950/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
      {state.isPlaying
        ? <button type="button" onClick={onStop} className="rounded-full bg-red-500 px-6 py-3 font-semibold text-white">Stop</button>
        : <button type="button" onClick={onPlay} disabled={loading} className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-zinc-950 disabled:opacity-50 disabled:cursor-wait">{loading ? 'Loading…' : 'Play'}</button>}
    </div>
  )
}
