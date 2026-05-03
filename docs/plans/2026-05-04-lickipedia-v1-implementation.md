# Lickipedia v1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship Lickipedia v1 — a browser-based drum step-grid sketch pad, deployed to GitHub Pages, with Supabase-backed persistence.

**Architecture:** Single Vite + React + TypeScript SPA under `web/`. Pure data layer (grid math, lick model, schedule builder, codec) is unit-tested with Vitest. Audio engine wraps Tone.js, lifted and adapted from rushing-dragging. Persistence is Supabase-only via `@supabase/supabase-js` (RLS-protected). Editor is mobile-first with drag-to-paint, long-press cell properties, sticky lanes, and a bottom-anchored transport. Deploy via GitHub Actions to `gh-pages` branch.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, Tone.js, `@supabase/supabase-js`, Vitest, Playwright.

**Reference docs:**
- Design: `docs/plans/2026-05-04-lickipedia-v1-design.md`
- Spec: `spec.md`
- RD source to lift from: `/home/user/Projects/musicianship/rushing-dragging/web/src/`

**Working branch:** Work on `main` directly (new repo, no prior code). Frequent small commits per task.

---

## Phase 0 — Scaffolding

### Task 1: Init Vite + React + TypeScript

**Files:**
- Create: `web/` (new Vite project)

**Step 1:** From `/home/user/Projects/musicianship/lickipedia`, run:
```bash
npm create vite@latest web -- --template react-ts
cd web && npm install
```

**Step 2:** Verify dev server runs:
```bash
cd web && npm run dev
```
Expected: Vite serves on `http://localhost:5173/` with the default React+TS template.

**Step 3:** Stop the server. Edit `web/vite.config.ts` to add the GH Pages base path:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/lickipedia/',
  plugins: [react()],
})
```

**Step 4:** Commit:
```bash
git add web/
git commit -m "chore: scaffold Vite + React + TS app under web/"
```

---

### Task 2: Add Tailwind CSS

**Files:**
- Modify: `web/package.json`, `web/postcss.config.js` (create), `web/tailwind.config.js` (create), `web/src/index.css`

**Step 1:** Install Tailwind:
```bash
cd web && npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
```

**Step 2:** Edit `web/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

**Step 3:** Replace `web/src/index.css` content with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 4:** Replace `web/src/App.tsx` with a Tailwind smoke-test:
```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 grid place-items-center">
      <h1 className="text-4xl font-bold">Lickipedia</h1>
    </div>
  )
}
```

**Step 5:** Run dev server, confirm dark background + centered title render.

**Step 6:** Commit:
```bash
git add web/
git commit -m "chore: add Tailwind CSS"
```

---

### Task 3: Add Vitest

**Files:**
- Modify: `web/package.json`, `web/vite.config.ts`
- Create: `web/src/_smoke.test.ts`

**Step 1:** Install:
```bash
cd web && npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

**Step 2:** Edit `web/vite.config.ts` to add test config:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/lickipedia/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

Add `/// <reference types="vitest" />` at the top if TS complains.

**Step 3:** Add scripts to `web/package.json`:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

**Step 4:** Create `web/src/_smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

**Step 5:** Run:
```bash
cd web && npm test
```
Expected: 1 passed.

**Step 6:** Commit:
```bash
git add web/
git commit -m "chore: add Vitest with jsdom"
```

---

### Task 4: Add Playwright

**Files:**
- Create: `web/playwright.config.ts`, `web/e2e/.gitkeep`

**Step 1:** Install:
```bash
cd web && npm install -D @playwright/test && npx playwright install --with-deps chromium
```

**Step 2:** Create `web/playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5173' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'mobile', use: devices['iPhone 13'] },
  ],
})
```

**Step 3:** Add to `web/package.json` scripts:
```json
"e2e": "playwright test"
```

**Step 4:** Create `web/e2e/.gitkeep` (empty file) so the directory commits.

**Step 5:** Commit:
```bash
git add web/
git commit -m "chore: add Playwright with chromium + iPhone 13 projects"
```

---

### Task 5: Add ESLint

**Files:** Vite's React+TS template usually includes ESLint already. Verify with `cd web && npm run lint` if a `lint` script exists. If not present:

**Step 1:**
```bash
cd web && npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react-hooks eslint-plugin-react-refresh
```

Use the `eslint.config.js` Vite generated; if absent, copy from `/home/user/Projects/musicianship/rushing-dragging/web/eslint.config.js` and adapt.

**Step 2:** Verify:
```bash
cd web && npm run lint
```

**Step 3:** Commit any config additions:
```bash
git add web/
git commit -m "chore: ensure ESLint configured"
```

---

## Phase 1 — Pure data layer (TDD)

### Task 6: Grid types and math

**Files:**
- Create: `web/src/grid/grid.ts`, `web/src/grid/grid.test.ts`

**Step 1:** Write `web/src/grid/grid.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { totalCells, loopSeconds, stepToBeat, beatToStep } from './grid'

describe('grid math', () => {
  it('totalCells: 4/4 in 16ths over 2 bars = 32', () => {
    expect(totalCells({ bars: 2, timeSig: { beats: 4, unit: 4 }, subdivision: 4 })).toBe(32)
  })

  it('totalCells: 7/8 in 8ths over 1 bar = 7', () => {
    expect(totalCells({ bars: 1, timeSig: { beats: 7, unit: 8 }, subdivision: 1 } as any)).toBe(7)
  })

  it('totalCells: 6/8 in triplets over 1 bar = 18', () => {
    expect(totalCells({ bars: 1, timeSig: { beats: 6, unit: 8 }, subdivision: 3 })).toBe(18)
  })

  it('loopSeconds: 4/4 2 bars at 120bpm = 4s', () => {
    expect(loopSeconds({ bars: 2, timeSig: { beats: 4, unit: 4 }, subdivision: 4 }, 120)).toBeCloseTo(4)
  })

  it('loopSeconds: 4/4 in 8th-unit beats halves duration', () => {
    // 4 beats of 8th-notes at 120 = 4 * (60/120) * (4/8) = 1s
    expect(loopSeconds({ bars: 1, timeSig: { beats: 4, unit: 8 }, subdivision: 2 }, 120)).toBeCloseTo(1)
  })

  it('stepToBeat / beatToStep round-trip', () => {
    const grid = { bars: 2, timeSig: { beats: 4, unit: 4 } as const, subdivision: 4 as const }
    for (let s = 0; s < totalCells(grid); s++) {
      const { bar, beat, sub } = stepToBeat(grid, s)
      expect(beatToStep(grid, bar, beat, sub)).toBe(s)
    }
  })
})
```

**Step 2:** Run, expect FAIL (module missing):
```bash
cd web && npm test
```

**Step 3:** Create `web/src/grid/grid.ts`:
```ts
export type TimeSignature = { beats: number; unit: 1 | 2 | 4 | 8 | 16 }
export type Subdivision = 1 | 2 | 3 | 4 | 6 | 8

export type Grid = {
  bars: number
  timeSig: TimeSignature
  subdivision: Subdivision
}

export function totalCells(grid: Grid): number {
  return grid.bars * grid.timeSig.beats * grid.subdivision
}

export function loopSeconds(grid: Grid, bpm: number): number {
  const secondsPerBeat = (60 / bpm) * (4 / grid.timeSig.unit)
  return grid.bars * grid.timeSig.beats * secondsPerBeat
}

export function stepToBeat(grid: Grid, step: number): { bar: number; beat: number; sub: number } {
  const cellsPerBar = grid.timeSig.beats * grid.subdivision
  const bar = Math.floor(step / cellsPerBar)
  const remainder = step - bar * cellsPerBar
  const beat = Math.floor(remainder / grid.subdivision)
  const sub = remainder - beat * grid.subdivision
  return { bar, beat, sub }
}

export function beatToStep(grid: Grid, bar: number, beat: number, sub: number): number {
  return bar * grid.timeSig.beats * grid.subdivision + beat * grid.subdivision + sub
}

export function stepSeconds(grid: Grid, bpm: number, step: number): number {
  return (loopSeconds(grid, bpm) / totalCells(grid)) * step
}
```

(Note: `Subdivision` includes `1` so `7/8 in 8ths` = 1 cell per beat. We also keep 2,3,4,6,8.)

**Step 4:** Run, expect PASS.

**Step 5:** Commit:
```bash
git add web/src/grid/
git commit -m "feat(grid): grid types and math (totalCells, loopSeconds, step↔beat)"
```

---

### Task 7: Drum and Lick types + factory

**Files:**
- Create: `web/src/grid/lick.ts`, `web/src/grid/lick.test.ts`

**Step 1:** Write `web/src/grid/lick.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { newLick, toggleHit, setAccent, setOrnament, hitKey } from './lick'

describe('lick mutations', () => {
  it('newLick has empty hits and a name', () => {
    const lick = newLick()
    expect(lick.hits).toEqual({})
    expect(lick.name.length).toBeGreaterThan(0)
    expect(lick.bpm).toBeGreaterThan(0)
  })

  it('toggleHit adds then removes a hit', () => {
    let lick = newLick()
    lick = toggleHit(lick, 'snare', 4)
    expect(lick.hits[hitKey('snare', 4)]).toEqual({ accent: false, ornament: 'none' })
    lick = toggleHit(lick, 'snare', 4)
    expect(lick.hits[hitKey('snare', 4)]).toBeUndefined()
  })

  it('setAccent only applies if hit exists', () => {
    let lick = newLick()
    lick = setAccent(lick, 'snare', 4, true)
    expect(lick.hits[hitKey('snare', 4)]).toBeUndefined() // still no hit
    lick = toggleHit(lick, 'snare', 4)
    lick = setAccent(lick, 'snare', 4, true)
    expect(lick.hits[hitKey('snare', 4)]?.accent).toBe(true)
  })

  it('setOrnament cycles through values', () => {
    let lick = toggleHit(newLick(), 'kick', 0)
    lick = setOrnament(lick, 'kick', 0, 'flam')
    expect(lick.hits[hitKey('kick', 0)]?.ornament).toBe('flam')
    lick = setOrnament(lick, 'kick', 0, 'none')
    expect(lick.hits[hitKey('kick', 0)]?.ornament).toBe('none')
  })

  it('updatedAt advances on mutation', async () => {
    const lick = newLick()
    await new Promise((r) => setTimeout(r, 5))
    const after = toggleHit(lick, 'kick', 0)
    expect(after.updatedAt > lick.updatedAt).toBe(true)
  })
})
```

**Step 2:** Run, expect FAIL.

**Step 3:** Create `web/src/grid/lick.ts`:
```ts
import type { Grid } from './grid'

export type Drum =
  | 'crash' | 'ride'
  | 'hihat-open' | 'hihat-closed' | 'hihat-pedal'
  | 'tom-high' | 'tom-mid' | 'tom-floor'
  | 'snare'
  | 'kick'
  | 'cowbell' | 'clap'

export const DRUMS: readonly Drum[] = [
  'crash', 'ride',
  'hihat-open', 'hihat-closed', 'hihat-pedal',
  'tom-high', 'tom-mid', 'tom-floor',
  'snare',
  'kick',
  'cowbell', 'clap',
] as const

export type Ornament = 'none' | 'flam' | 'drag' | 'buzz'
export type Hit = { accent: boolean; ornament: Ornament }

export type KitId = 'acoustic'

export type Lick = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  bpm: number
  kit: KitId
  grid: Grid
  hits: Record<string, Hit>
  notes?: string
}

export function hitKey(drum: Drum, step: number): string {
  return `${drum}:${step}`
}

const DEFAULT_GRID: Grid = {
  bars: 2,
  timeSig: { beats: 4, unit: 4 },
  subdivision: 4,
}

export function newLick(partial?: Partial<Lick>): Lick {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: 'Untitled',
    createdAt: now,
    updatedAt: now,
    bpm: 100,
    kit: 'acoustic',
    grid: DEFAULT_GRID,
    hits: {},
    ...partial,
  }
}

function touch(lick: Lick): Lick {
  return { ...lick, updatedAt: new Date().toISOString() }
}

export function toggleHit(lick: Lick, drum: Drum, step: number): Lick {
  const key = hitKey(drum, step)
  const hits = { ...lick.hits }
  if (hits[key]) delete hits[key]
  else hits[key] = { accent: false, ornament: 'none' }
  return touch({ ...lick, hits })
}

export function setAccent(lick: Lick, drum: Drum, step: number, accent: boolean): Lick {
  const key = hitKey(drum, step)
  if (!lick.hits[key]) return lick
  return touch({ ...lick, hits: { ...lick.hits, [key]: { ...lick.hits[key], accent } } })
}

export function setOrnament(lick: Lick, drum: Drum, step: number, ornament: Ornament): Lick {
  const key = hitKey(drum, step)
  if (!lick.hits[key]) return lick
  return touch({ ...lick, hits: { ...lick.hits, [key]: { ...lick.hits[key], ornament } } })
}
```

**Step 4:** Run, expect PASS.

**Step 5:** Commit:
```bash
git add web/src/grid/
git commit -m "feat(grid): Drum/Hit/Lick types and pure mutations"
```

---

### Task 8: Resize grid (discard-on-shrink)

**Files:**
- Modify: `web/src/grid/lick.ts`, `web/src/grid/lick.test.ts`

**Step 1:** Append to `web/src/grid/lick.test.ts`:
```ts
import { resizeGrid } from './lick'
import { totalCells } from './grid'

describe('resizeGrid', () => {
  it('discards hits whose step no longer exists', () => {
    let lick = newLick()
    // grid has 32 cells; add a hit at step 31
    lick = toggleHit(lick, 'snare', 31)
    const newGrid = { ...lick.grid, bars: 1 }  // halves to 16 cells
    const { lick: shrunk, discarded } = resizeGrid(lick, newGrid)
    expect(totalCells(shrunk.grid)).toBe(16)
    expect(shrunk.hits[hitKey('snare', 31)]).toBeUndefined()
    expect(discarded).toBe(1)
  })

  it('keeps hits within range when growing', () => {
    let lick = newLick()
    lick = toggleHit(lick, 'kick', 0)
    const newGrid = { ...lick.grid, bars: 4 }
    const { lick: grown, discarded } = resizeGrid(lick, newGrid)
    expect(grown.hits[hitKey('kick', 0)]).toBeDefined()
    expect(discarded).toBe(0)
  })
})
```

**Step 2:** Run, expect FAIL.

**Step 3:** In `web/src/grid/lick.ts` add:
```ts
import { totalCells } from './grid'

export function resizeGrid(lick: Lick, grid: Grid): { lick: Lick; discarded: number } {
  const max = totalCells(grid)
  const hits: Record<string, Hit> = {}
  let discarded = 0
  for (const [key, hit] of Object.entries(lick.hits)) {
    const step = Number(key.split(':')[1])
    if (step < max) hits[key] = hit
    else discarded++
  }
  return { lick: touch({ ...lick, grid, hits }), discarded }
}
```

**Step 4:** Run, expect PASS.

**Step 5:** Commit:
```bash
git add web/src/grid/
git commit -m "feat(grid): resizeGrid with discard-on-shrink"
```

---

### Task 9: Schedule builder (pure)

**Files:**
- Create: `web/src/audio/schedule.ts`, `web/src/audio/schedule.test.ts`

**Step 1:** Write `web/src/audio/schedule.test.ts`:
```ts
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
```

**Step 2:** Run, expect FAIL.

**Step 3:** Create `web/src/audio/schedule.ts`:
```ts
import type { Drum, Lick, Ornament } from '../grid/lick'
import { stepSeconds } from '../grid/grid'

export type ScheduledHit = {
  drum: Drum
  time: number       // seconds from loop start
  velocity: number   // 0..1
}

const BASE_VELOCITY = 0.85
const ACCENT_BOOST = 1.0   // +6dB-ish; cap at 1.0

type GraceSpec = { offset: number; velocity: number }[]

const ORNAMENT_GRACE: Record<Ornament, GraceSpec> = {
  none: [],
  flam: [{ offset: -0.025, velocity: 0.6 }],
  drag: [{ offset: -0.05, velocity: 0.45 }, { offset: -0.025, velocity: 0.45 }],
  buzz: [{ offset: 0.015, velocity: 0.7 }, { offset: 0.030, velocity: 0.55 }, { offset: 0.045, velocity: 0.4 }],
}

export function buildSchedule(lick: Lick): ScheduledHit[] {
  const out: ScheduledHit[] = []
  for (const [key, hit] of Object.entries(lick.hits)) {
    const [drum, stepStr] = key.split(':') as [Drum, string]
    const step = Number(stepStr)
    const t = stepSeconds(lick.grid, lick.bpm, step)
    const mainVelocity = hit.accent ? ACCENT_BOOST : BASE_VELOCITY
    if (hit.ornament === 'buzz') {
      // buzz: main first, then bounces
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
  out.sort((a, b) => a.time - b.time)
  return out
}
```

**Step 4:** Run, expect PASS.

**Step 5:** Commit:
```bash
git add web/src/audio/
git commit -m "feat(audio): pure buildSchedule with ornament + accent rendering"
```

---

### Task 10: lp1 export/import codec

**Files:**
- Create: `web/src/storage/codec.ts`, `web/src/storage/codec.test.ts`

**Step 1:** Install fflate (small DEFLATE library):
```bash
cd web && npm install fflate
```

**Step 2:** Write `web/src/storage/codec.test.ts`:
```ts
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
```

**Step 3:** Run, expect FAIL.

**Step 4:** Create `web/src/storage/codec.ts`:
```ts
import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate'
import type { Lick } from '../grid/lick'

const PREFIX = 'lp1:'

function b64urlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function encodeLick(lick: Lick): string {
  const json = JSON.stringify(lick)
  const compressed = deflateSync(strToU8(json))
  return PREFIX + b64urlEncode(compressed)
}

export function decodeLick(s: string): Lick {
  if (!s.startsWith(PREFIX)) throw new Error('Not a lickipedia v1 string')
  try {
    const bytes = b64urlDecode(s.slice(PREFIX.length))
    const json = strFromU8(inflateSync(bytes))
    return JSON.parse(json) as Lick
  } catch (err) {
    throw new Error('Malformed lp1 string')
  }
}
```

**Step 5:** Run, expect PASS.

**Step 6:** Commit:
```bash
git add web/
git commit -m "feat(storage): lp1 export/import codec with DEFLATE+base64url"
```

---

## Phase 2 — Audio engine (impure, manual smoke)

These tasks talk to the Web Audio API and aren't unit-testable in jsdom. We verify by ear in the browser at the end of each.

### Task 11: Tone bootstrap and kit loader

**Files:**
- Create: `web/src/audio/engine.ts`, `web/src/audio/kit.ts`
- Reference: `/home/user/Projects/musicianship/rushing-dragging/web/src/audio/engine.ts` (lift the kit-loading + Tone-start patterns)

**Step 1:** Install Tone.js:
```bash
cd web && npm install tone
```

**Step 2:** Create `web/src/audio/kit.ts`:
```ts
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
```

**Step 3:** Create `web/src/audio/engine.ts`:
```ts
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
```

**Step 4:** Place sample stubs (silent OGG files) so dev builds succeed. Create `web/public/kits/acoustic/` and add a tiny silent.ogg, then symlink/copy each drum name to it. Or use a placeholder script. Quickest: download or generate a 1-frame silent OGG, copy to all 12 drum filenames. Defer real sample sourcing to a later task; for now just unblock the build.

```bash
mkdir -p web/public/kits/acoustic
# Generate a 100ms silent ogg (requires ffmpeg). If unavailable, place any OGG bytes.
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.1 -c:a libvorbis -q:a 4 /tmp/silent.ogg -y 2>/dev/null || true
for d in crash ride hihat-open hihat-closed hihat-pedal tom-high tom-mid tom-floor snare kick cowbell clap; do
  cp /tmp/silent.ogg "web/public/kits/acoustic/$d.ogg"
done
```

**Step 5:** Verify build still passes:
```bash
cd web && npm run build
```

**Step 6:** Commit:
```bash
git add web/
git commit -m "feat(audio): Tone.js engine with kit loader and looping playback"
```

---

### Task 12: Count-in click

**Files:**
- Modify: `web/src/audio/engine.ts`

**Step 1:** Add a `countIn` option to `play()`:
```ts
let clickSynth: Tone.Synth | null = null

function ensureClick(): Tone.Synth {
  if (!clickSynth) {
    clickSynth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
    }).toDestination()
  }
  return clickSynth
}

export function play(lick: Lick, opts: { countIn?: boolean } = {}): void {
  stopRequested = false
  if (loopTimeout) clearTimeout(loopTimeout)
  const lead = 0.05
  let t0 = Tone.now() + lead
  if (opts.countIn) {
    const click = ensureClick()
    const beatSec = (60 / lick.bpm) * (4 / lick.grid.timeSig.unit)
    for (let b = 0; b < lick.grid.timeSig.beats; b++) {
      // accent the first beat
      click.volume.value = b === 0 ? -8 : -16
      click.triggerAttackRelease(b === 0 ? 'C5' : 'A4', '32n', t0 + b * beatSec)
    }
    t0 += lick.grid.timeSig.beats * beatSec
  }
  scheduleLoop(lick, t0)
}
```

**Step 2:** Smoke-test in dev:
- Wire a temporary "Play" button into `App.tsx` calling `ensureStarted` then `play(newLick(), { countIn: true })` after a hardcoded snare hit. Confirm clicks audible.
- Revert the temporary button after smoke test.

**Step 3:** Commit:
```bash
git add web/src/audio/
git commit -m "feat(audio): one-bar count-in click before loop"
```

---

## Phase 3 — Editor UI

### Task 13: App shell + hash router

**Files:**
- Create: `web/src/views/Editor.tsx`, `web/src/views/Library.tsx`
- Modify: `web/src/App.tsx`

**Step 1:** Install hash router:
```bash
cd web && npm install react-router-dom
```

**Step 2:** Create stub `web/src/views/Editor.tsx`:
```tsx
export function Editor() {
  return <div className="p-6"><h1 className="text-2xl">Editor</h1></div>
}
```

**Step 3:** Create stub `web/src/views/Library.tsx`:
```tsx
export function Library() {
  return <div className="p-6"><h1 className="text-2xl">Library</h1></div>
}
```

**Step 4:** Replace `web/src/App.tsx`:
```tsx
import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import { Editor } from './views/Editor'
import { Library } from './views/Library'

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <nav className="flex gap-4 p-3 border-b border-zinc-800">
          <Link to="/" className="font-bold">Lickipedia</Link>
          <Link to="/library" className="text-zinc-400 hover:text-zinc-100">Library</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Editor />} />
          <Route path="/library" element={<Library />} />
          <Route path="/lick/:id" element={<Editor />} />
        </Routes>
      </div>
    </HashRouter>
  )
}
```

**Step 5:** `npm run dev` — verify nav between `/#/` and `/#/library` works.

**Step 6:** Commit:
```bash
git add web/
git commit -m "feat(ui): app shell with hash router and editor/library stubs"
```

---

### Task 14: EditorContext + initial state

**Files:**
- Create: `web/src/state/EditorContext.tsx`
- Modify: `web/src/views/Editor.tsx`

**Step 1:** Create `web/src/state/EditorContext.tsx`:
```tsx
import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
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

export function useEditor() {
  const ctx = useContext(EditorCtx)
  if (!ctx) throw new Error('useEditor outside EditorProvider')
  return ctx
}
```

**Step 2:** Wrap `App.tsx` Routes inside `<EditorProvider>` (so the same lick survives navigation).

**Step 3:** Commit:
```bash
git add web/
git commit -m "feat(state): EditorContext with reducer for lick mutations"
```

---

### Task 15: StepGrid component (visual only)

**Files:**
- Create: `web/src/components/StepGrid.tsx`, `web/src/components/Cell.tsx`
- Modify: `web/src/views/Editor.tsx`

**Step 1:** Create `web/src/components/Cell.tsx`:
```tsx
import type { Hit } from '../grid/lick'

export function Cell({ hit, onClick, onLongPress }: {
  hit?: Hit
  onClick: () => void
  onLongPress: () => void
}) {
  let pressTimer: ReturnType<typeof setTimeout> | null = null
  const onPointerDown = () => {
    pressTimer = setTimeout(() => { pressTimer = null; onLongPress() }, 450)
  }
  const onPointerUp = () => {
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; onClick() }
  }
  const onPointerLeave = () => {
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null }
  }
  const isHit = !!hit
  const isAccent = hit?.accent
  const ornChar = hit?.ornament && hit.ornament !== 'none' ? hit.ornament[0].toUpperCase() : null
  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onContextMenu={(e) => { e.preventDefault(); onLongPress() }}
      className={`
        relative h-11 min-w-[44px] rounded-sm border border-zinc-800 transition-colors
        ${isHit ? 'bg-amber-400 hover:bg-amber-300' : 'bg-zinc-900 hover:bg-zinc-800'}
      `}
    >
      {isAccent && <span className="absolute top-0.5 left-1 h-1.5 w-1.5 rounded-full bg-zinc-900" />}
      {ornChar && <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-zinc-900">{ornChar}</span>}
    </button>
  )
}
```

**Step 2:** Create `web/src/components/StepGrid.tsx`:
```tsx
import { useEditor } from '../state/EditorContext'
import { DRUMS, hitKey, type Drum } from '../grid/lick'
import { totalCells } from '../grid/grid'
import { Cell } from './Cell'

export function StepGrid({ onCellLongPress }: {
  onCellLongPress: (drum: Drum, step: number) => void
}) {
  const { state, dispatch } = useEditor()
  const { lick } = state
  const cells = totalCells(lick.grid)
  const stepIndices = Array.from({ length: cells }, (_, i) => i)
  const cellsPerBeat = lick.grid.subdivision
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid" style={{ gridTemplateColumns: `120px repeat(${cells}, 44px)` }}>
        {/* header row */}
        <div className="sticky left-0 z-10 bg-zinc-950" />
        {stepIndices.map((s) => (
          <div key={s} className={`text-center text-[10px] text-zinc-500 ${s % cellsPerBeat === 0 ? 'border-l border-zinc-700' : ''}`}>
            {s % cellsPerBeat === 0 ? Math.floor(s / cellsPerBeat) + 1 : ''}
          </div>
        ))}
        {DRUMS.map((drum) => (
          <DrumRow key={drum} drum={drum} stepIndices={stepIndices} cellsPerBeat={cellsPerBeat} />
        ))}
      </div>
    </div>
  )

  function DrumRow({ drum, stepIndices, cellsPerBeat }: { drum: Drum; stepIndices: number[]; cellsPerBeat: number }) {
    return (
      <>
        <div className="sticky left-0 z-10 bg-zinc-950 px-2 py-2 text-xs font-medium text-zinc-300 border-r border-zinc-800">
          {drum}
        </div>
        {stepIndices.map((s) => (
          <div key={s} className={`p-0.5 ${s % cellsPerBeat === 0 ? 'border-l border-zinc-700' : ''}`}>
            <Cell
              hit={lick.hits[hitKey(drum, s)]}
              onClick={() => dispatch({ type: 'toggle-hit', drum, step: s })}
              onLongPress={() => onCellLongPress(drum, s)}
            />
          </div>
        ))}
      </>
    )
  }
}
```

**Step 3:** Update `web/src/views/Editor.tsx`:
```tsx
import { useState } from 'react'
import { StepGrid } from '../components/StepGrid'
import type { Drum } from '../grid/lick'

export function Editor() {
  const [activeCell, setActiveCell] = useState<{ drum: Drum; step: number } | null>(null)
  return (
    <div className="p-4">
      <StepGrid onCellLongPress={(drum, step) => setActiveCell({ drum, step })} />
      {activeCell && <div className="mt-4 text-sm text-zinc-400">long-press: {activeCell.drum}:{activeCell.step}</div>}
    </div>
  )
}
```

**Step 4:** `npm run dev` — verify grid renders, tap toggles cells, long-press shows the readout.

**Step 5:** Commit:
```bash
git add web/
git commit -m "feat(ui): StepGrid + Cell with tap-toggle and long-press"
```

---

### Task 16: Cell properties bottom sheet

**Files:**
- Create: `web/src/components/CellSheet.tsx`
- Modify: `web/src/views/Editor.tsx`

**Step 1:** Create `web/src/components/CellSheet.tsx`:
```tsx
import { useEditor } from '../state/EditorContext'
import { hitKey, type Drum, type Ornament } from '../grid/lick'

const ORNAMENTS: Ornament[] = ['none', 'flam', 'drag', 'buzz']

export function CellSheet({ drum, step, onClose }: { drum: Drum; step: number; onClose: () => void }) {
  const { state, dispatch } = useEditor()
  const hit = state.lick.hits[hitKey(drum, step)]
  if (!hit) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-zinc-900 p-4 shadow-2xl border-t border-zinc-700">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-400">{drum} · step {step + 1}</div>
        <button onClick={onClose} className="text-zinc-400 px-2">×</button>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={hit.accent}
          onChange={(e) => dispatch({ type: 'set-accent', drum, step, accent: e.target.checked })}
        />
        Accent
      </label>
      <div className="mt-4 flex gap-2">
        {ORNAMENTS.map((o) => (
          <button
            key={o}
            onClick={() => dispatch({ type: 'set-ornament', drum, step, ornament: o })}
            className={`px-3 py-2 rounded text-sm ${hit.ornament === o ? 'bg-amber-400 text-zinc-900' : 'bg-zinc-800 text-zinc-300'}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
```

**Step 2:** Wire into `Editor.tsx`:
```tsx
import { CellSheet } from '../components/CellSheet'
// inside Editor, replace the readout:
{activeCell && (
  <CellSheet
    drum={activeCell.drum}
    step={activeCell.step}
    onClose={() => setActiveCell(null)}
  />
)}
```

**Step 3:** Smoke-test: long-press a cell, see sheet, toggle accent and ornament, see badges update on the cell.

**Step 4:** Commit:
```bash
git add web/
git commit -m "feat(ui): CellSheet bottom sheet for accent + ornament"
```

---

### Task 17: Toolbar (BPM, time-sig, bars, subdivision, count-in, name)

**Files:**
- Create: `web/src/components/Toolbar.tsx`
- Modify: `web/src/views/Editor.tsx`

**Step 1:** Create `web/src/components/Toolbar.tsx` with controls bound to `EditorContext`:
```tsx
import { useEditor } from '../state/EditorContext'
import type { Subdivision, TimeSignature } from '../grid/grid'

const UNITS: TimeSignature['unit'][] = [2, 4, 8, 16]
const SUBS: { id: Subdivision; label: string }[] = [
  { id: 1, label: '1/beat' }, { id: 2, label: '8th' },
  { id: 3, label: 'triplet' }, { id: 4, label: '16th' },
  { id: 6, label: '16-trip' }, { id: 8, label: '32nd' },
]
const BARS = [1, 2, 4, 8]

export function Toolbar() {
  const { state, dispatch } = useEditor()
  const { lick, countIn } = state
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-zinc-900 border-b border-zinc-800">
      <input
        value={lick.name}
        onChange={(e) => dispatch({ type: 'set-name', name: e.target.value })}
        className="bg-transparent border-b border-zinc-700 px-1 text-lg font-semibold focus:outline-none focus:border-amber-400"
      />
      <label className="text-sm flex items-center gap-2">
        BPM
        <input
          type="number" min={40} max={240} value={lick.bpm}
          onChange={(e) => dispatch({ type: 'set-bpm', bpm: Number(e.target.value) })}
          className="w-16 bg-zinc-800 px-2 py-1 rounded"
        />
      </label>
      <label className="text-sm flex items-center gap-2">
        Time
        <input
          type="number" min={1} max={15} value={lick.grid.timeSig.beats}
          onChange={(e) => dispatch({ type: 'resize-grid', grid: { ...lick.grid, timeSig: { ...lick.grid.timeSig, beats: Number(e.target.value) } } })}
          className="w-12 bg-zinc-800 px-2 py-1 rounded"
        />
        /
        <select
          value={lick.grid.timeSig.unit}
          onChange={(e) => dispatch({ type: 'resize-grid', grid: { ...lick.grid, timeSig: { ...lick.grid.timeSig, unit: Number(e.target.value) as TimeSignature['unit'] } } })}
          className="bg-zinc-800 px-2 py-1 rounded"
        >
          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </label>
      <label className="text-sm flex items-center gap-2">
        Bars
        <select
          value={lick.grid.bars}
          onChange={(e) => dispatch({ type: 'resize-grid', grid: { ...lick.grid, bars: Number(e.target.value) } })}
          className="bg-zinc-800 px-2 py-1 rounded"
        >
          {BARS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </label>
      <label className="text-sm flex items-center gap-2">
        Sub
        <select
          value={lick.grid.subdivision}
          onChange={(e) => dispatch({ type: 'resize-grid', grid: { ...lick.grid, subdivision: Number(e.target.value) as Subdivision } })}
          className="bg-zinc-800 px-2 py-1 rounded"
        >
          {SUBS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </label>
      <label className="text-sm flex items-center gap-2">
        <input type="checkbox" checked={countIn} onChange={(e) => dispatch({ type: 'set-count-in', countIn: e.target.checked })} />
        Count-in
      </label>
    </div>
  )
}
```

**Step 2:** Add `<Toolbar />` to top of `Editor.tsx`.

**Step 3:** **Discard-on-shrink warning** — currently `resize-grid` silently discards. Wrap subdivision/bars changes in a confirm if they would discard hits. Add this guard in the toolbar handlers:
```ts
import { totalCells } from '../grid/grid'
const wouldDiscard = (newGrid: typeof lick.grid) => {
  const max = totalCells(newGrid)
  return Object.keys(lick.hits).some((k) => Number(k.split(':')[1]) >= max)
}
const tryResize = (newGrid: typeof lick.grid) => {
  if (wouldDiscard(newGrid) && !confirm('This will discard hits that no longer fit. Continue?')) return
  dispatch({ type: 'resize-grid', grid: newGrid })
}
```
Replace `dispatch({ type: 'resize-grid', ... })` calls with `tryResize(...)`.

**Step 4:** Smoke-test all controls.

**Step 5:** Commit:
```bash
git add web/
git commit -m "feat(ui): Toolbar with BPM, time-sig, bars, subdivision, count-in"
```

---

### Task 18: Wire Play/Stop to audio engine

**Files:**
- Create: `web/src/components/Transport.tsx`
- Modify: `web/src/views/Editor.tsx`

**Step 1:** Create `web/src/components/Transport.tsx`:
```tsx
import { useEditor } from '../state/EditorContext'
import { ensureStarted, play, stop } from '../audio/engine'

export function Transport() {
  const { state, dispatch } = useEditor()
  const onPlay = async () => {
    await ensureStarted('acoustic', import.meta.env.BASE_URL)
    play(state.lick, { countIn: state.countIn })
    dispatch({ type: 'set-playing', playing: true })
  }
  const onStop = () => {
    stop()
    dispatch({ type: 'set-playing', playing: false })
  }
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center gap-3 border-t border-zinc-800 bg-zinc-950/95 p-3 backdrop-blur">
      {state.isPlaying
        ? <button onClick={onStop} className="rounded-full bg-red-500 px-6 py-3 font-semibold text-white">Stop</button>
        : <button onClick={onPlay} className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-zinc-950">Play</button>}
    </div>
  )
}
```

**Step 2:** Add `<Transport />` to `Editor.tsx`. Pad the editor's bottom by `pb-24` so content isn't hidden under the bar.

**Step 3:** Smoke-test: click Play → hear count-in clicks (no drum sound yet because samples are silent stubs). Stop works.

**Step 4:** Commit:
```bash
git add web/
git commit -m "feat(ui): Transport with Play/Stop wired to audio engine"
```

---

### Task 19: Drag-to-paint cells

**Files:**
- Modify: `web/src/components/StepGrid.tsx`, `web/src/components/Cell.tsx`

**Step 1:** Lift the paint-mode state into `StepGrid`. When the user touches a cell, decide whether the gesture is "fill" or "clear" based on whether the *initial* cell was filled. As they drag over cells, apply that operation. Use pointer events:
```tsx
// inside StepGrid, above DrumRow definition:
const paintModeRef = useRef<null | 'fill' | 'clear'>(null)

const onCellPointerDown = (drum: Drum, step: number) => {
  const has = !!lick.hits[hitKey(drum, step)]
  paintModeRef.current = has ? 'clear' : 'fill'
  applyPaint(drum, step)
}
const onCellPointerEnter = (drum: Drum, step: number) => {
  if (!paintModeRef.current) return
  applyPaint(drum, step)
}
const applyPaint = (drum: Drum, step: number) => {
  const has = !!lick.hits[hitKey(drum, step)]
  if (paintModeRef.current === 'fill' && !has) dispatch({ type: 'toggle-hit', drum, step })
  if (paintModeRef.current === 'clear' && has) dispatch({ type: 'toggle-hit', drum, step })
}
useEffect(() => {
  const up = () => { paintModeRef.current = null }
  window.addEventListener('pointerup', up)
  return () => window.removeEventListener('pointerup', up)
}, [])
```

**Step 2:** Update `Cell.tsx` to forward `onPointerDown`/`onPointerEnter`. Drop the existing `onClick` long-press logic from `Cell` (the parent now owns gestures) and treat long-press in the parent: if pointerdown stays on the *same* cell with no movement for 450 ms, fire `onLongPress` instead of paint. Keep things simple: in this task implement paint only, leave long-press as-is. We'll restore long-press in Task 20 if it regresses.

**Step 3:** Smoke-test paint on desktop and mobile (DevTools touch emulation): drag horizontally across hat row → fills run; drag back across same row → clears.

**Step 4:** Commit:
```bash
git add web/
git commit -m "feat(ui): drag-to-paint cells with pointer events"
```

---

### Task 20: Reconcile long-press with paint

**Files:**
- Modify: `web/src/components/StepGrid.tsx`, `web/src/components/Cell.tsx`

**Step 1:** In the cell handler in `StepGrid`, start a long-press timer at pointerdown; cancel on pointermove (any cell entered) or pointerup. If the timer fires, set a flag that suppresses the paint and opens the cell sheet via `onCellLongPress(drum, step)`.

**Step 2:** Manual test:
- Quick tap → toggles cell (existing behavior).
- Hold ~500 ms → opens cell sheet, no paint occurs.
- Tap-drag → paint mode (no sheet).

**Step 3:** Commit:
```bash
git add web/
git commit -m "feat(ui): coexist long-press and drag-paint with timer cancellation"
```

---

### Task 21: Transport playhead indicator

**Files:**
- Modify: `web/src/components/Transport.tsx`, `web/src/audio/engine.ts`

**Step 1:** In `engine.ts`, expose a callback for "current loop start time" so UI can compute the playhead. Add:
```ts
type PlayheadCb = (t0: number, loopLen: number) => void
let playheadCb: PlayheadCb | null = null
export function onLoopStart(cb: PlayheadCb | null): void { playheadCb = cb }

// in scheduleLoop, after computing t0:
playheadCb?.(t0, loopLen)
```

**Step 2:** In `Transport.tsx`, animate a progress bar using `Tone.now()` minus `t0`, modulo `loopLen`. Use `requestAnimationFrame`. Show as a thin bar above the Play button with current bar/beat readout.

**Step 3:** Smoke-test that playhead advances and resets at the loop boundary.

**Step 4:** Commit:
```bash
git add web/
git commit -m "feat(ui): transport playhead synced to loop boundaries"
```

---

## Phase 4 — Persistence (Supabase)

### Task 22: Provision Supabase project (manual, one-time)

**Step 1:** In a browser, sign in at supabase.com, create a new project (free tier). Choose region close to you.

**Step 2:** In the Supabase SQL editor, run:
```sql
create extension if not exists "uuid-ossp";

create table public.licks (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index licks_user_updated on public.licks (user_id, updated_at desc);

alter table public.licks enable row level security;

create policy "own rows" on public.licks
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

**Step 3:** In Supabase **Authentication → URL Configuration**, add:
- Site URL: `https://<your-github-username>.github.io/lickipedia/`
- Redirect URL allow-list: same URL (and `http://localhost:5173/` for dev).

**Step 4:** Note the project URL and `anon` public key (Settings → API). Store them as GitHub repo secrets `SUPABASE_URL` and `SUPABASE_ANON_KEY` (we'll wire them in Task 28). For local dev, create `web/.env.local`:
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```
(Already covered by `.gitignore`.)

**Step 5:** No commit (no code changed). Document the setup in `docs/setup-supabase.md` with the SQL and the two env vars.

```bash
git add docs/
git commit -m "docs: Supabase project setup instructions"
```

---

### Task 23: Supabase client module

**Files:**
- Create: `web/src/storage/supabase.ts`

**Step 1:** Install:
```bash
cd web && npm install @supabase/supabase-js
```

**Step 2:** Create `web/src/storage/supabase.ts`:
```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let client: SupabaseClient | null = null
export function supabase(): SupabaseClient {
  if (!client) {
    if (!url || !anonKey) throw new Error('Supabase env vars missing')
    client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  }
  return client
}
```

**Step 3:** Commit:
```bash
git add web/
git commit -m "feat(storage): supabase client singleton"
```

---

### Task 24: Auth state hook + magic link form

**Files:**
- Create: `web/src/state/auth.ts`, `web/src/components/SignInForm.tsx`

**Step 1:** Create `web/src/state/auth.ts`:
```ts
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../storage/supabase'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  useEffect(() => {
    supabase().auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase().auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  return session
}

export async function signInWithMagicLink(email: string): Promise<void> {
  const { error } = await supabase().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
  })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  await supabase().auth.signOut()
}
```

**Step 2:** Create `web/src/components/SignInForm.tsx`:
```tsx
import { useState } from 'react'
import { signInWithMagicLink } from '../state/auth'

export function SignInForm({ onSent }: { onSent?: () => void }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      await signInWithMagicLink(email)
      setSent(true)
      onSent?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }
  if (sent) return <p className="text-sm text-zinc-300">Check your email for a sign-in link.</p>
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <input
        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="bg-zinc-800 px-3 py-2 rounded"
      />
      <button disabled={busy} className="rounded bg-amber-400 px-3 py-2 font-semibold text-zinc-950">
        {busy ? 'Sending…' : 'Send magic link'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  )
}
```

**Step 3:** Smoke-test in dev: temporarily render `<SignInForm />` somewhere, enter your email, check inbox, click link, verify session is set (log session in console).

**Step 4:** Commit:
```bash
git add web/
git commit -m "feat(auth): magic link sign-in hook and form"
```

---

### Task 25: Library CRUD module

**Files:**
- Create: `web/src/storage/licksRepo.ts`

**Step 1:** Create `web/src/storage/licksRepo.ts`:
```ts
import type { Lick } from '../grid/lick'
import { supabase } from './supabase'

export async function listLicks(): Promise<Lick[]> {
  const { data, error } = await supabase()
    .from('licks')
    .select('data')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => r.data as Lick)
}

export async function upsertLick(lick: Lick): Promise<void> {
  const { data: { user } } = await supabase().auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase()
    .from('licks')
    .upsert({ id: lick.id, user_id: user.id, data: lick, updated_at: lick.updatedAt })
  if (error) throw error
}

export async function deleteLick(id: string): Promise<void> {
  const { error } = await supabase().from('licks').delete().eq('id', id)
  if (error) throw error
}

export async function getLick(id: string): Promise<Lick | null> {
  const { data, error } = await supabase().from('licks').select('data').eq('id', id).maybeSingle()
  if (error) throw error
  return (data?.data as Lick) ?? null
}
```

**Step 2:** Commit:
```bash
git add web/
git commit -m "feat(storage): licks repo with list/upsert/delete/get"
```

---

### Task 26: Save flow (sign-in gate + persist)

**Files:**
- Create: `web/src/components/SaveButton.tsx`
- Modify: `web/src/views/Editor.tsx`

**Step 1:** Create `web/src/components/SaveButton.tsx`:
```tsx
import { useState } from 'react'
import { useEditor } from '../state/EditorContext'
import { useSession } from '../state/auth'
import { upsertLick } from '../storage/licksRepo'
import { SignInForm } from './SignInForm'

export function SaveButton() {
  const session = useSession()
  const { state } = useEditor()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const save = async () => {
    setBusy(true)
    try {
      await upsertLick(state.lick)
      setToast('Saved')
      setTimeout(() => setToast(null), 1500)
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Save failed')
    } finally { setBusy(false) }
  }

  const onClick = async () => {
    if (!session) { setOpen(true); return }
    await save()
  }

  return (
    <>
      <button onClick={onClick} disabled={busy} className="rounded bg-zinc-100 text-zinc-900 px-4 py-2 font-semibold">
        {busy ? 'Saving…' : 'Save'}
      </button>
      {toast && <span className="ml-2 text-sm text-zinc-400">{toast}</span>}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="rounded-2xl bg-zinc-900 p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-3">Sign in to save</h2>
            <SignInForm onSent={() => { /* keep modal open until user clicks the link */ }} />
          </div>
        </div>
      )}
    </>
  )
}
```

**Step 2:** Add `<SaveButton />` to the toolbar.

**Step 3:** Manual test: sign in → save → reload → see lick still there (via library in next task).

**Step 4:** Commit:
```bash
git add web/
git commit -m "feat(ui): SaveButton with sign-in gate and toast feedback"
```

---

### Task 27: Library view (list, open, delete)

**Files:**
- Modify: `web/src/views/Library.tsx`

**Step 1:** Replace `web/src/views/Library.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../state/auth'
import { listLicks, deleteLick } from '../storage/licksRepo'
import { SignInForm } from '../components/SignInForm'
import type { Lick } from '../grid/lick'

export function Library() {
  const session = useSession()
  const [licks, setLicks] = useState<Lick[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!session) return
    listLicks().then(setLicks).catch((e) => setError(e.message))
  }, [session])

  if (!session) {
    return (
      <div className="p-6 max-w-sm">
        <h2 className="text-xl font-semibold mb-3">Sign in to see your library</h2>
        <SignInForm />
      </div>
    )
  }

  if (error) return <div className="p-6 text-red-400">{error}</div>
  if (!licks) return <div className="p-6 text-zinc-400">Loading…</div>
  if (licks.length === 0) return <div className="p-6 text-zinc-400">No saved licks yet. <Link to="/" className="text-amber-400 underline">Sketch one</Link>.</div>

  return (
    <ul className="divide-y divide-zinc-800">
      {licks.map((lick) => (
        <li key={lick.id} className="flex items-center justify-between p-4">
          <div>
            <div className="font-semibold">{lick.name}</div>
            <div className="text-xs text-zinc-500">
              {lick.bpm} BPM · {lick.grid.timeSig.beats}/{lick.grid.timeSig.unit} · {new Date(lick.updatedAt).toLocaleDateString()}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(`/lick/${lick.id}`)} className="px-3 py-1 rounded bg-zinc-800 text-sm">Open</button>
            <button onClick={async () => {
              if (!confirm(`Delete "${lick.name}"?`)) return
              await deleteLick(lick.id)
              setLicks(licks.filter((l) => l.id !== lick.id))
            }} className="px-3 py-1 rounded bg-red-900/40 text-red-300 text-sm">Delete</button>
          </div>
        </li>
      ))}
    </ul>
  )
}
```

**Step 2:** In `Editor.tsx`, when `useParams().id` is present, fetch and load the lick on mount:
```tsx
import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { getLick } from '../storage/licksRepo'
import { useEditor } from '../state/EditorContext'

const { id } = useParams()
const { dispatch } = useEditor()
useEffect(() => {
  if (!id) return
  getLick(id).then((lick) => { if (lick) dispatch({ type: 'load', lick }) })
}, [id])
```

**Step 3:** Manual test: save several licks, navigate to Library, open one, edit, save (it should UPDATE not INSERT), delete one.

**Step 4:** Commit:
```bash
git add web/
git commit -m "feat(ui): Library view with list, open, and delete"
```

---

### Task 28: Sign-out and "Forget me"

**Files:**
- Create: `web/src/views/Account.tsx`
- Modify: `web/src/App.tsx`

**Step 1:** Create `Account.tsx` with sign-out and a destructive "Delete all my licks and sign out" button that runs:
```ts
const { error } = await supabase().from('licks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
if (!error) await signOut()
```

**Step 2:** Add a route `/#/account` and a link in the nav (small, only if signed in).

**Step 3:** Commit:
```bash
git add web/
git commit -m "feat(ui): Account view with sign-out and delete-all"
```

---

## Phase 5 — Sharing

### Task 29: Share button (clipboard + Web Share)

**Files:**
- Create: `web/src/components/ShareButton.tsx`
- Modify: toolbar inclusion

**Step 1:** Create `web/src/components/ShareButton.tsx`:
```tsx
import { useState } from 'react'
import { useEditor } from '../state/EditorContext'
import { encodeLick } from '../storage/codec'

export function ShareButton() {
  const { state } = useEditor()
  const [toast, setToast] = useState<string | null>(null)
  const onClick = async () => {
    const s = encodeLick(state.lick)
    if (navigator.share) {
      try { await navigator.share({ title: state.lick.name, text: s }); return } catch { /* fallthrough */ }
    }
    await navigator.clipboard.writeText(s)
    setToast('Copied')
    setTimeout(() => setToast(null), 1200)
  }
  return (
    <>
      <button onClick={onClick} className="rounded bg-zinc-800 px-3 py-2 text-sm">Share</button>
      {toast && <span className="ml-2 text-xs text-zinc-400">{toast}</span>}
    </>
  )
}
```

**Step 2:** Add `<ShareButton />` to toolbar.

**Step 3:** Test: click Share → string copied; paste in a notes app to verify it starts with `lp1:`.

**Step 4:** Commit:
```bash
git add web/
git commit -m "feat(ui): ShareButton with Web Share + clipboard fallback"
```

---

### Task 30: Import field on library

**Files:**
- Modify: `web/src/views/Library.tsx`

**Step 1:** Add an import textarea + button at the top of the library list. On submit:
```ts
const lick = decodeLick(input.trim())
const fresh = { ...lick, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
await upsertLick(fresh)
setLicks([fresh, ...(licks ?? [])])
```

Show error if `decodeLick` throws.

**Step 2:** Commit:
```bash
git add web/
git commit -m "feat(ui): import lp1 string into library"
```

---

## Phase 6 — Mobile polish

### Task 31: Mobile audit pass

**Files:** various, refine as needed.

**Step 1:** Open the dev server on a real iPhone over LAN (`vite --host`). Open Safari → walk through:
- Bottom transport reachable (no overlap with Safari's bottom toolbar).
- Sticky lane labels stay pinned during horizontal scroll.
- Long-press opens cell sheet without triggering the iOS context menu (already handled via `onContextMenu` preventDefault).
- Drag-paint feels right; not picking up cells across rows accidentally.
- Renaming the lick — keyboard appears, input stays visible (use `scrollIntoView({ block: 'center' })` on focus if needed).

**Step 2:** Same on Chrome Android.

**Step 3:** Fix issues as they show up. Commit each fix individually with a clear message:
```bash
git commit -m "fix(mobile): <specific issue>"
```

(This task is intentionally exploratory — its output is a series of small commits.)

---

### Task 32: visualViewport keyboard handling

**Files:**
- Modify: `web/src/views/Editor.tsx` or a small hook `useVisualViewportPadding.ts`

**Step 1:** Create `web/src/state/useVisualViewportPadding.ts`:
```ts
import { useEffect, useState } from 'react'

export function useVisualViewportPadding(): number {
  const [pad, setPad] = useState(0)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => setPad(Math.max(0, window.innerHeight - vv.height))
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])
  return pad
}
```

**Step 2:** Apply as `paddingBottom: pad` on the editor's outer wrapper, so when the soft keyboard opens the transport floats above it (or the content scrolls correctly, depending on layout).

**Step 3:** Verify on iOS that the rename input stays visible while typing.

**Step 4:** Commit:
```bash
git add web/
git commit -m "feat(mobile): visualViewport-aware bottom padding for soft keyboard"
```

---

## Phase 7 — Deploy

### Task 33: GitHub Pages workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Step 1:** Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json
      - run: npm ci
        working-directory: web
      - run: npm run build
        working-directory: web
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./web/dist
```

**Step 2:** Push to a GitHub repo (one-time setup):
```bash
gh repo create lickipedia --public --source=. --remote=origin --push
gh secret set SUPABASE_URL --body "$VITE_SUPABASE_URL"
gh secret set SUPABASE_ANON_KEY --body "$VITE_SUPABASE_ANON_KEY"
```

(If `gh` not available, do this through the GitHub UI: create repo, Settings → Pages → branch `gh-pages`, Settings → Secrets → Actions.)

**Step 3:** Trigger the workflow (push or manual dispatch). Verify it deploys to `https://<user>.github.io/lickipedia/`.

**Step 4:** Commit:
```bash
git add .github/
git commit -m "ci: deploy web/dist to gh-pages on push to main"
```

---

### Task 34: Supabase warm cron

**Files:**
- Create: `.github/workflows/supabase-warm.yml`

**Step 1:** Create:
```yaml
name: Supabase warm
on:
  schedule:
    - cron: '0 12 */3 * *'  # every 3 days at 12:00 UTC
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/" > /dev/null
          echo "Pinged $SUPABASE_URL"
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

**Step 2:** Trigger manually once via `gh workflow run "Supabase warm"` to verify it succeeds.

**Step 3:** Commit:
```bash
git add .github/
git commit -m "ci: cron pinger to keep Supabase project warm"
```

---

## Phase 8 — End-to-end testing

### Task 35: Playwright golden-path test (desktop)

**Files:**
- Create: `web/e2e/golden-path.spec.ts`

**Step 1:** Write the test that mocks Supabase via `page.route` and walks through the flow:
```ts
import { test, expect } from '@playwright/test'

test('sketch, play, save, library', async ({ page }) => {
  await page.route('**/auth/v1/otp**', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({}) })
  )
  await page.route('**/auth/v1/user**', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ id: 'test-user' }) })
  )
  // ...mock GET/POST to /rest/v1/licks similarly

  await page.goto('/')
  await expect(page.getByText('Lickipedia')).toBeVisible()

  // Click a few cells to make a basic backbeat
  // (selector strategy depends on data-testid attributes you add to Cell)

  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible()

  await page.getByRole('button', { name: 'Stop' }).click()
  await page.getByRole('button', { name: 'Save' }).click()
  // sign-in modal appears
  await page.getByPlaceholder('you@example.com').fill('test@example.com')
  await page.getByRole('button', { name: /Send magic link/ }).click()
  // simulate auth state change by injecting session into localStorage, or
  // trigger Supabase mock that returns a signed-in state on next call.

  // Navigate to library
  await page.getByRole('link', { name: 'Library' }).click()
  await expect(page.locator('text=BPM')).toBeVisible()
})
```

**Step 2:** Add `data-testid` attributes to Cell, Save button, Play button, etc. as needed for stable selectors.

**Step 3:** Run:
```bash
cd web && npm run e2e
```
Expected: golden-path test passes on chromium.

**Step 4:** Commit:
```bash
git add web/
git commit -m "test: e2e golden path with Supabase mocked"
```

---

### Task 36: Mobile-viewport e2e

**Files:**
- Create: `web/e2e/mobile.spec.ts`

**Step 1:** Write a test that reuses the golden path but in the `mobile` Playwright project, with explicit assertions:
- `page.locator('[data-testid="transport-play"]')` is in the bottom 100 px of the viewport.
- After scrolling the grid horizontally, lane label "kick" is still visible at x ≤ 4 px.
- Long-pressing a cell opens the bottom sheet.

**Step 2:** Run:
```bash
cd web && npm run e2e -- --project=mobile
```

**Step 3:** Commit:
```bash
git add web/
git commit -m "test: e2e mobile-viewport assertions"
```

---

### Task 37: Manual gauntlet checklist (doc)

**Files:**
- Create: `docs/manual-gauntlet.md`

**Step 1:** Write the checklist:
```markdown
# Manual gauntlet — must pass before declaring v1 done

## iOS Safari (latest, real iPhone)
- [ ] Land on `/`, see empty grid; no console errors
- [ ] Tap cells, hear sounds via Play button
- [ ] Long-press opens cell sheet (no iOS context menu interferes)
- [ ] Drag across cells fills a run; back-drag clears
- [ ] Lane labels stay pinned on horizontal scroll
- [ ] Bottom transport reachable with thumb; not under Safari's chrome
- [ ] Sign in via magic link, save a lick, reload, find it in Library
- [ ] Rename input visible while soft keyboard is open

## Chrome Android (latest, real device)
- [ ] All of the above

## Audio quality
- [ ] No dropouts at 4-bar 16th grid + 140 BPM
- [ ] Flam, drag, buzz audibly distinct from a plain hit
- [ ] Accent audibly louder

## Cross-browser
- [ ] Latest Firefox desktop: app loads, plays, saves
```

**Step 2:** Commit:
```bash
git add docs/
git commit -m "docs: manual gauntlet checklist for v1 ship"
```

---

## Phase 9 — Sample sourcing (final blocker)

### Task 38: Source acoustic kit samples

**Step 1:** Identify a permissively-licensed multi-sample acoustic kit (DrumGizmo CC0 packs at drumgizmo.org are a known good source; Salamander or similar also work). Download.

**Step 2:** For each drum, pick one representative single-velocity sample. Convert to OGG Vorbis at 44.1 kHz, mono if originally mono, stereo if originally stereo. Trim leading silence.

**Step 3:** Replace the silent stubs in `web/public/kits/acoustic/`:
```
kick.ogg snare.ogg
hihat-closed.ogg hihat-open.ogg hihat-pedal.ogg
ride.ogg crash.ogg
tom-high.ogg tom-mid.ogg tom-floor.ogg
cowbell.ogg clap.ogg
```

**Step 4:** Add license attribution to `web/public/kits/acoustic/LICENSE.md`.

**Step 5:** Smoke-test: build, deploy, play a basic backbeat, listen.

**Step 6:** Commit:
```bash
git add web/public/kits/
git commit -m "feat(audio): real acoustic kit samples (CC0 / <license>)"
```

---

## Phase 10 — Final polish

### Task 39: Account link visibility + nav cleanup

Tidy the nav so signed-out users see only `Lickipedia` + `Library`; signed-in users see those plus an account icon.

```bash
git commit -m "ui: contextual nav based on auth state"
```

### Task 40: README for the repo

**Files:** `README.md`

A short top-level README pointing at `spec.md` and the design doc.

```bash
git add README.md
git commit -m "docs: top-level README"
```

---

## Done

After every phase passes (Vitest green, Playwright green, manual gauntlet checked off), v1 is shippable. Tag:

```bash
git tag v1.0.0
git push --tags
```

Future work lives in `docs/plans/` as new design docs (per § 7 of the design — undo/redo, multi-kit, electronic kit, "discard changes?" prompt, realtime sync, public library).
