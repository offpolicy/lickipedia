import type React from 'react'
import type { Drum, Hit } from '../grid/lick'

export function Cell({ drum, step, hit, onPointerDown, onPointerEnter }: {
  drum: Drum
  step: number
  hit?: Hit
  onPointerDown: (e: React.PointerEvent) => void
  onPointerEnter: () => void
}) {
  const isHit = !!hit
  const isAccent = hit?.accent
  const ornChar = hit?.ornament && hit.ornament !== 'none' ? hit.ornament[0].toUpperCase() : null
  return (
    <button
      type="button"
      aria-label={`${drum} step ${step + 1}${hit ? ' (active)' : ''}`}
      aria-pressed={!!hit}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      className={`
        relative h-11 min-w-[44px] w-full rounded-sm border border-zinc-800 transition-colors touch-none
        ${isHit ? 'bg-amber-400 hover:bg-amber-300' : 'bg-zinc-900 hover:bg-zinc-800'}
      `}
    >
      {isAccent && <span className="absolute top-0.5 left-1 h-1.5 w-1.5 rounded-full bg-zinc-900" />}
      {ornChar && <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-zinc-900">{ornChar}</span>}
    </button>
  )
}
