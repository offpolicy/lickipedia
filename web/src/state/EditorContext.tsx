import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { Drum, Lick, Ornament } from '../grid/lick'
import type { Grid } from '../grid/grid'
import { newLick, toggleHit, setAccent, setOrnament, resizeGrid } from '../grid/lick'

type State = {
  lick: Lick
  isPlaying: boolean
  countIn: boolean
}

type Action =
  | { type: 'load'; lick: Lick }
  | { type: 'toggle-hit'; drum: Drum; step: number }
  | { type: 'set-accent'; drum: Drum; step: number; accent: boolean }
  | { type: 'set-ornament'; drum: Drum; step: number; ornament: Ornament }
  | { type: 'set-bpm'; bpm: number }
  | { type: 'set-name'; name: string }
  | { type: 'resize-grid'; grid: Grid }
  | { type: 'set-playing'; playing: boolean }
  | { type: 'set-count-in'; countIn: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load': return { ...state, lick: action.lick }
    case 'toggle-hit': return { ...state, lick: toggleHit(state.lick, action.drum, action.step) }
    case 'set-accent': return { ...state, lick: setAccent(state.lick, action.drum, action.step, action.accent) }
    case 'set-ornament': return { ...state, lick: setOrnament(state.lick, action.drum, action.step, action.ornament) }
    case 'set-bpm': return { ...state, lick: { ...state.lick, bpm: action.bpm, updatedAt: new Date().toISOString() } }
    case 'set-name': return { ...state, lick: { ...state.lick, name: action.name, updatedAt: new Date().toISOString() } }
    case 'resize-grid': return { ...state, lick: resizeGrid(state.lick, action.grid).lick }
    case 'set-playing': return { ...state, isPlaying: action.playing }
    case 'set-count-in': return { ...state, countIn: action.countIn }
  }
}

const EditorCtx = createContext<{
  state: State
  dispatch: React.Dispatch<Action>
} | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    lick: newLick(),
    isPlaying: false,
    countIn: true,
  }))
  return <EditorCtx.Provider value={{ state, dispatch }}>{children}</EditorCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEditor() {
  const ctx = useContext(EditorCtx)
  if (!ctx) throw new Error('useEditor outside EditorProvider')
  return ctx
}
