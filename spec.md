# Lickipedia — Product Spec (v1)

> User-facing, product-level spec for v1. Technical decisions live in
> `docs/plans/2026-05-04-lickipedia-v1-design.md`. This doc describes
> **what** the user experiences; the design doc describes **how** it's built.

## 0. Overview

**Lickipedia** is a browser-based drum sketch pad. Open the app, fill in a
step grid, hear the lick loop, save it. It's the sister app to *Rushing or
Dragging* — same audio foundations, very different intent.

It's for drummers (and curious non-drummers) who want a quick, friction-free
place to sketch a fill, audition a groove, or save a lick before they forget
it. No DAW to launch, no project to create.

We'll call v1 a success when a user can land on the app, sketch a lick they
like, save it, come back later, and play it again.

## 1. Landing & first use

A first visitor lands directly on the editor, with an empty grid and a
sensible default kit, time signature, and tempo. Nothing to read first,
nothing to set up.

- **Empty grid, ready to play.** Drum lanes down the left, step cells across.
  Tap a cell to add a hit; tap again to remove it.
- **Play / Stop visible at all times.** Press Play and the loop starts;
  edits made while it's looping take effect on the next loop.
- **No sign-in required to sketch.** A first-time visitor can fill cells,
  hear the loop, and play around without ever entering an email.
- **Sign-in is asked for at Save time, not before.** The first time the
  visitor wants to keep a sketch, they're prompted with a single email
  field and a magic-link sign-in.

## 2. Editing a lick

A lick is a short drum pattern on a configurable grid. Every part of the
grid is changeable from the toolbar.

- **Cells.** Tap to toggle a hit. Drag across cells to fill a run quickly
  (or clear a run, if you started on a filled cell).
- **Cell properties.** Long-press (or right-click) a cell to open a small
  panel with two controls: **accent** (a stronger hit) and **ornament**
  (none, flam, drag, or buzz). Active properties show as small badges on
  the cell.
- **Drum lanes.** A full kit, in a fixed order: crash, ride, hat (open /
  closed / pedal), three toms (high / mid / floor), snare, kick, plus
  cowbell and clap.
- **Tempo.** Slider with numeric input. Defaults to 100 BPM.
- **Time signature.** Numerator and unit. Defaults to 4/4. Odd meters like
  5/4 or 7/8 are supported.
- **Bars.** 1, 2, 4, or 8 bars per loop. Defaults to 2.
- **Subdivision.** 8th, triplet, 16th, 16th-triplet, or 32nd cells per beat.
  Defaults to 16th.
- **Changing subdivision after entering hits.** If the change would shrink
  the grid, hits that no longer fit are discarded; a confirm step warns
  before this happens.
- **Count-in.** One bar of metronome click before the loop starts. Toggle
  off if you don't want it. Default on.
- **Kit.** A single acoustic kit in v1. The dropdown is there for future
  kits.
- **Name.** Inline-editable in the toolbar. New licks default to
  `Lick <n>`; rename anytime.

## 3. Playing a lick

- **Play / Stop.** One button, big and reachable. On mobile it's anchored
  to the bottom of the screen.
- **Loop.** Playback loops continuously until you stop it.
- **Live edits.** Changes you make while playback is running take effect
  on the next loop iteration. No glitches mid-loop.
- **Transport readout.** A small ribbon shows current bar and beat, and
  a playhead progress indicator across the loop.

## 4. Saving and your library

Saving a lick stores it in your Supabase-backed library. There is no local
fallback — saving requires an account.

- **Save button.** Always visible. If you're signed out, the first tap
  opens the sign-in form (single email field, magic link), then completes
  the save once you're authenticated. Your in-progress lick is preserved
  across the sign-in round-trip.
- **Library view.** A flat list of your saved licks. Each row shows name,
  tempo, time signature, and last-edited date. A small play button
  auditions the lick without leaving the list.
- **Per-row actions.** Rename, duplicate, share, delete.
- **No tags, no folders.** v1 deliberately keeps the library flat — it's a
  sketch pad, not a DAW.
- **Unsaved sketches are not preserved.** Closing the tab on an unsaved
  lick discards it. This matches the sketch-pad framing — most sketches
  are throwaway.

## 5. Sharing a lick

Sharing works without involving the recipient's account, by way of a short
text string.

- **Share button.** Copies a `lp1:…` string to the clipboard (or invokes
  the native share sheet on devices that support it). The string contains
  the entire lick — grid, hits, tempo, kit, name.
- **Import.** A paste field on the library view accepts an `lp1:…` string
  and adds the lick to your library as a new entry. Importing requires
  sign-in (since we're saving it).
- **No public library, no leaderboards.** v1 sharing is one-to-one over
  whatever channel you already use (chat, email, etc.).

## 6. Mobile

Lickipedia expects to be used on a phone at least as much as on a laptop.
Every interaction is designed for thumbs first.

- **Cells and primary controls are large enough to tap accurately.**
- **Long-press for cell properties** — bottom-of-screen sheet, not a popover.
- **Drag-to-paint cells** for fast entry.
- **Lane labels stick to the left** while you scroll the grid horizontally.
- **The transport bar stays anchored to the bottom of the screen.**
- **The on-screen keyboard never squishes the editor.**
- **The app is tested on real iOS Safari and Chrome Android** before
  shipping, not just devtools emulation.

## 7. Constraints & non-goals

### Constraints

- **Browser-only, no install.** Runs in a current browser tab on phone or
  laptop.
- **Sign-in required to save**, but **never to sketch and play**.
- **Account is email magic-link only.** No passwords, no social sign-in.
- **Nothing about your account or licks leaves Supabase** — no third-party
  analytics, no tracking.
- **Runs on current Chrome, Safari, and Firefox** — desktop and mobile.
- **Free to use** — Supabase free tier is the host for v1.

### Non-goals for v1

- Pitched / melodic content — drums only.
- Live tap recording — click-to-toggle only.
- Backing instruments (bass, keys, percussion).
- Multiple kits — one acoustic kit only.
- Tags, folders, search, color labels — flat library only.
- Public lick library, leaderboards, social features.
- Realtime sync across devices or tabs.
- Undo/redo (deferred to v1.1).
- Cloud-export to MIDI, audio bounce, or DAW integration.
- Native mobile or desktop apps.
