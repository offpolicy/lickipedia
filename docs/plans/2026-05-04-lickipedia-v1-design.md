# Lickipedia v1 — Design

> Companion to `spec.md` (user-facing). This document covers **how** Lickipedia
> is built; the spec covers **what** the user experiences.

Lickipedia is a sister app to **Rushing or Dragging** (RD). It is a
browser-based drum-pattern sketch pad: open the app, fill cells on a step
grid, hear the lick loop, save it. It reuses RD's audio + grid foundations.

## 0. Decisions snapshot

| Concern | Decision |
| --- | --- |
| What is a "lick" | Drum lick — rhythm only, no pitched notes |
| Entry method | Click-to-toggle step grid (no live tap recording) |
| Grid scope | Configurable bars + subdivision + odd time signatures |
| Cell richness | On/off + accent + ornament (none/flam/drag/buzz) |
| Drum kit | Full acoustic kit (kick, snare, hat closed/open/pedal, ride, crash, 3 toms, cowbell, clap) |
| Workflow | Pure sketch pad — flat library list, no tags/folders |
| Storage | Supabase only (no localStorage); editor usable signed-out, save requires sign-in |
| Sharing | `lp1:` export/import string, opt-in copy/paste |
| Auth | Supabase email magic link |
| Code sharing with RD | Standalone app, copy-and-adapt RD's audio engine |
| Deploy | GitHub Pages via Actions |
| Mobile | First-class — touch targets ≥44 px, drag-paint, sticky lane labels, bottom transport |

## 1. Stack, repo layout, deploy

**Stack** — Vite + React + TypeScript + Tailwind + Tone.js. Adds
`@supabase/supabase-js` (loaded only when the user opts into sign-in).

**Repo layout** — mirrors RD so the codebases feel like siblings:

```
musicianship/lickipedia/
├── docs/
│   ├── design.md           ← this design (or pinned to plans/ during drafts)
│   └── plans/
├── spec.md                 ← user-facing spec
├── web/                    ← Vite app
│   ├── src/
│   │   ├── audio/          ← engine.ts, kits.ts, ornaments.ts
│   │   ├── grid/           ← grid.ts (time-sig math), lick.ts (data model)
│   │   ├── components/     ← StepGrid, LaneRow, Cell, Library, Toolbar, etc.
│   │   ├── state/          ← EditorContext, LibraryContext
│   │   ├── storage/        ← supabase.ts, codec.ts (lp1: export/import)
│   │   ├── views/          ← Editor.tsx, Library.tsx
│   │   └── ...
│   └── (Vite scaffolding)
└── .github/workflows/
    ├── deploy.yml          ← build + push web/dist/ to gh-pages branch
    └── supabase-warm.yml   ← cron pinger to keep Supabase project awake
```

**Deploy** — GitHub Actions on push to `main`:

- Install, build, publish `web/dist/` to `gh-pages` branch via
  `peaceiris/actions-gh-pages`.
- Vite `base` config set to `/lickipedia/` so asset paths work under the
  GitHub project page URL.
- Supabase URL + anon key live in repo secrets; injected at build time as
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. The anon key is safe to
  expose — RLS is what protects user data.

**Code lifted from RD** — `web/src/audio/engine.ts` and
`web/src/audio/patterns.ts` are the starting point for `audio/engine.ts` and
`grid/grid.ts`. Adapted, not wrapped — the two codebases are expected to
diverge over time.

## 2. Data model

### Grid

```ts
type TimeSignature = { beats: number; unit: 1 | 2 | 4 | 8 | 16 };
type Subdivision   = 2 | 3 | 4 | 6 | 8;  // cells per beat

type Grid = {
  bars: number;          // 1, 2, 4, ...
  timeSig: TimeSignature;
  subdivision: Subdivision;
};

// totalCells   = bars × timeSig.beats × subdivision
// loopSeconds  = bars × timeSig.beats × (60 / bpm) × (4 / timeSig.unit)
```

This generalizes RD's `'eighths' | 'triplets'`. RD's existing patterns map to
`{ bars: 2, timeSig: { beats: 4, unit: 4 }, subdivision: 2 | 3 }`.

### Drum lanes

Fixed enumeration; the order is the visual row order (top to bottom):

```ts
type Drum =
  | 'crash' | 'ride'
  | 'hihat-open' | 'hihat-closed' | 'hihat-pedal'
  | 'tom-high' | 'tom-mid' | 'tom-floor'
  | 'snare'
  | 'kick'
  | 'cowbell' | 'clap';
```

### Cells and licks

Sparse: a cell exists only if there's a hit. Keyed by `${drum}:${stepIndex}`.

```ts
type Ornament = 'none' | 'flam' | 'drag' | 'buzz';
type Hit  = { accent: boolean; ornament: Ornament };

type Lick = {
  id: string;            // uuid
  name: string;          // "Lick 7" by default, user-editable
  createdAt: string;     // ISO
  updatedAt: string;     // ISO
  bpm: number;
  kit: KitId;            // 'acoustic' for v1
  grid: Grid;
  hits: Record<string, Hit>;
  notes?: string;        // optional one-line scribble
};
```

### Subdivision change behavior

When the user changes subdivision after entering hits, hits whose step would
no longer exist are **discarded with a warning** before the change applies.
Predictable, easy to explain, undo-friendly later.

## 3. Audio engine

Lifted from RD: Tone bootstrapping, kit caching as `Tone.Players`,
sample-accurate scheduling via `Tone.now()`, count-in synth, cancel-pending
machinery.

### What changes from RD

- **Schedule input**: drive scheduling from a `Lick`. Iterate `lick.hits`
  entries; convert `stepIndex` to seconds via `Grid`; trigger
  `players.player(drum).start(t + offset)`.
- **Looping**: schedule one loop's worth of hits, then re-schedule the next
  loop in a `setTimeout` callback fired ~50 ms before the previous loop
  ends. Edits made mid-loop apply on the next iteration.
- **No timing offsets**: this is not an ear-trainer. All hits land on the
  grid (modulo per-ornament fixed micro-offsets, see below).

### Kit (acoustic only for v1)

Single kit, multi-sample, served from `web/public/kits/acoustic/`. We need
samples for: kick, snare, hihat-closed, hihat-open, hihat-pedal, ride, crash,
tom-high, tom-mid, tom-floor, cowbell, clap.

- RD's existing `acoustic-kit` provides kick/snare/hihat-closed.
- Source the rest from a permissive-license pack (DrumGizmo CC0 or similar).
- Single-velocity per drum is fine; accent is applied as a +6 dB scalar.
- During development, missing samples may stub to silence; ship blocks on
  the full set being present.

### Ornament rendering (procedural)

No extra samples. Same drum, fired multiple times at fixed micro-offsets:

| Ornament | Schedule (relative to main hit `t`) |
| --- | --- |
| `none` | `t` at full velocity |
| `flam` | `t - 25 ms` at 0.7, then `t` at 1.0 |
| `drag` | `t - 50 ms` at 0.5, `t - 25 ms` at 0.5, then `t` at 1.0 |
| `buzz` | `t`, `t + 15`, `t + 30`, `t + 45 ms` at decaying velocity |

### Accent

Applied as a per-trigger volume bump (+6 dB) on top of the ornament schedule.

### Pure schedule builder

Audio scheduling is split into a pure function and an impure trigger loop:

```ts
function buildSchedule(lick: Lick): ScheduledHit[];
// Returns [{ drum, time, velocity }, ...] ready to feed into Tone.
```

The pure half is unit-tested. The impure half talks to Tone and is exercised
by manual + e2e testing.

## 4. UI shape & state

### Routes

GitHub Pages doesn't do server-side routing — we use a **hash router**:

- `/#/` — Editor (the home; opens to an empty grid on a fresh visit)
- `/#/library` — Saved licks (sign-in required)
- `/#/lick/:id` — Editor opened to a saved lick

### Editor view

Three regions:

1. **Toolbar (top)** — name (inline-editable), BPM slider + numeric input,
   time-sig picker (numerator + unit), bars selector (1/2/4/8), subdivision
   selector (8th / triplet / 16th / 16th-triplet / 32nd), kit dropdown,
   count-in toggle, **Play/Stop**, **Save**, **Share**, **Library** link.
2. **Grid (center)** — rows = drum lanes (fixed order). Columns = step
   cells. Beat boundaries marked with thicker vertical lines; bar boundaries
   thicker still. Click toggles on/off. Right-click / long-press opens a
   bottom sheet for accent + ornament. Active cells show small badges
   (accent dot, ornament letter `F`/`D`/`B`).
3. **Transport ribbon (bottom)** — playhead progress, loop indicator,
   current beat counter ("Bar 2 · Beat 3").

### Library view

Flat list. Each row: name, time-sig + BPM, last-edited date, mini play
button, overflow menu (rename, duplicate, share, delete). Top-right
**+ New** button.

### State management

Two React contexts (no Redux/Zustand at this scale):

- `EditorContext` — current lick, mutation actions (`toggleHit`,
  `setAccent`, `setOrnament`, `setBpm`, `resizeGrid`, ...), playback state
  (`isPlaying`, `currentStep`).
- `LibraryContext` — list of saved licks, CRUD, sync status.

Saves are **explicit** (button), not autosave.

### Mobile-first commitments

- **Touch targets ≥ 44 px** on cells and primary controls.
- **Long-press → bottom sheet** for cell properties (not a popover).
- **Drag-to-paint cells** — touch down, drag across to fill (or clear, if
  the start cell was already filled).
- **Sticky lane labels** on horizontal scroll; sticky beat headers on
  vertical scroll.
- **Bottom-anchored transport bar** within thumb reach.
- **Toolbar collapses to one row** on mobile: name, BPM, kebab menu;
  kebab opens a settings sheet.
- **Audio init on first user gesture** (`Tone.start()` on first Play).
- **Web Share API** for the export string when available; clipboard
  fallback.
- **`visualViewport`-aware** layout so the on-screen keyboard doesn't
  squish the editor.
- **No hover-only affordances**.
- **Manual gauntlet** on real iOS Safari + Chrome Android before declaring
  v1 done.

## 5. Persistence (Supabase only)

- **No localStorage.** Single source of truth is the Supabase `licks` table.
- **Editor works without sign-in** — sketch a lick, hit Play, hear it loop.
  Save and Library require sign-in.
- **In-progress edits live in component state.** Closing the tab without
  saving discards them — matches the sketch-pad framing.
- **Auth** — Supabase email magic link only. One field, one click.
- **Schema**:

  ```sql
  create table licks (
    id          uuid primary key,
    user_id     uuid not null references auth.users,
    data        jsonb not null,        -- whole Lick blob
    updated_at  timestamptz not null default now()
  );

  alter table licks enable row level security;
  create policy "own rows" on licks
    for all using (user_id = auth.uid())
    with check (user_id = auth.uid());
  ```

- **Save flow**:
  - signed in → INSERT or UPDATE by id, UPSERT on `id`.
  - signed out → modal with magic-link form inline; in-memory lick is
    preserved across the auth round-trip and saved on success.
- **Library**: live read on view mount; small refresh button. No realtime
  subscription in v1.
- **Errors on save**: toast ("Couldn't save — try again"), keep lick in
  memory, leave Save enabled. No silent retries, no offline queue.
- **"Forget me"** button: deletes user's licks (RLS-protected), signs out,
  clears session.

### Sharing (export/import string)

Format: `lp1:<base64url-of-deflated-JSON>`.

- Prefix `lp1:` identifies format and version.
- Body is the `Lick` JSON, DEFLATE-compressed, base64url-encoded.
- Typical size for a 2-bar 16th-grid lick: ~150–300 chars.
- Import accepts pasted strings on the library view; rejects anything not
  starting with `lp1:`. Imported licks get a fresh `id` and require sign-in
  to save.

### Keep Supabase warm

Free-tier projects auto-pause after 1 week of inactivity. We add a tiny
GitHub Actions workflow that pings the project every few days:

```yaml
# .github/workflows/supabase-warm.yml
on:
  schedule:
    - cron: '0 12 */3 * *'  # every 3 days at noon UTC
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS "$SUPABASE_URL/rest/v1/?apikey=$SUPABASE_ANON_KEY"
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## 6. Testing

### Unit (Vitest)

- `grid/grid.ts` — cells-per-beat math, seconds-per-cell, step ↔
  `(bar, beat, sub)` conversion, total cells across odd time sigs and
  every subdivision.
- `grid/lick.ts` — mutations including `resizeGrid` discard-on-shrink.
- `storage/codec.ts` — `lp1:` export/import round-trip; empty lick,
  max-density lick, every ornament type, Unicode in name, malformed
  strings rejected.
- `audio/schedule.ts` — `buildSchedule(lick)` returns the right
  `ScheduledHit[]` for representative licks (basic backbeat, ornaments,
  odd time sig, varying subdivisions).

### E2E (Playwright)

One golden path, real browser, **Supabase mocked at the network layer**
via `page.route`:

1. Land on `/`, see empty grid.
2. Click cells to make a basic backbeat.
3. Press Play — assert audio context started and `Tone.Transport` advanced.
4. Press Save — get sign-in modal, paste mocked magic-link token, see Save
   succeed.
5. Navigate to Library — see the lick.
6. Open it, press Play — assert it plays the same hits.

Plus one mobile-viewport test (iPhone-13 size): same flow, asserting the
bottom transport is reachable, long-press opens the cell sheet, and
horizontal scroll keeps lane labels pinned.

### Manual gauntlet

Required before declaring v1 done:

- Real iOS Safari (latest) on a real iPhone — sketch, save, reload, replay.
- Real Chrome on Android — same.
- Confirm no audio dropouts at default kit + 4-bar 16th grid + 140 BPM, no
  cell mis-taps at smallest cell size, on-screen keyboard does not cover
  the rename input.

### Out of scope for v1

- Real Supabase round-trips in CI.
- Audio fidelity tests ("does this sound like a flam") — judged by ear.
- Cross-browser visual regressions beyond the manual gauntlet.

## 7. Open questions deferred to v1.1

- Undo/redo in the editor (only relevant once the discard-on-shrink case
  bites someone).
- Multiple kits and per-kit sample selection.
- Synthesized fallback kit (electronic).
- A "discard changes?" prompt when navigating away with unsaved edits.
- Realtime sync between tabs / devices via Supabase Realtime.
- Public lick library / sharing through the app (rather than copy-paste).
