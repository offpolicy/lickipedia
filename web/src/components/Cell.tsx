import { useEffect, useRef } from 'react'
import type { Drum, Hit } from '../grid/lick'

export function Cell({ drum, step, hit, onClick, onLongPress }: {
  drum: Drum
  step: number
  hit?: Hit
  onClick: () => void
  onLongPress: () => void
}) {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current)
    }
  }, [])
  const onPointerDown = () => {
    pressTimer.current = setTimeout(() => { pressTimer.current = null; onLongPress() }, 450)
  }
  const onPointerUp = () => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; onClick() }
  }
  const cancelPress = () => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null }
  }
  const isHit = !!hit
  const isAccent = hit?.accent
  const ornChar = hit?.ornament && hit.ornament !== 'none' ? hit.ornament[0].toUpperCase() : null
  return (
    <button
      type="button"
      aria-label={`${drum} step ${step + 1}${hit ? ' (active)' : ''}`}
      aria-pressed={!!hit}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onContextMenu={(e) => { e.preventDefault(); onLongPress() }}
      className={`
        relative h-11 min-w-[44px] w-full rounded-sm border border-zinc-800 transition-colors
        ${isHit ? 'bg-amber-400 hover:bg-amber-300' : 'bg-zinc-900 hover:bg-zinc-800'}
      `}
    >
      {isAccent && <span className="absolute top-0.5 left-1 h-1.5 w-1.5 rounded-full bg-zinc-900" />}
      {ornChar && <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-zinc-900">{ornChar}</span>}
    </button>
  )
}
