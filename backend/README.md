# Person 2 (Riya) — Design System, Game 2, Sundown Mode, Music-Memory

Covers Day 1–5 of the SIH26003 NER Dementia Care Platform checklist.
This README documents what's in `src/` and how it fits into the rest
of the app — useful both as a PR description and as a reference for
whoever integrates it next.

## What's here

```
src/
  design-system/     Color tokens, font-scale, high-contrast toggle
  components/         Shared Button (large touch targets)
  sundown/            Time-of-day theme/audio shift
  music/              Music-memory library + caregiver "link a song" UI
  difficulty/         Temporary stand-in for Person 4's difficulty engine
  games/GameTwo/      "Spot what changed" (Attention & Concentration)
  assets-gamosa/      Original Gamosa-inspired border motif
```

## design-system/
CSS custom properties (palette, type scale, spacing, touch targets)
per CONTRACTS.md Section 8, plus two runtime toggles:
- **Font scale** — 3 steps (Standard/Large/Extra-large), applied via a
  `--font-scale` multiplier so any component using
  `calc(var(--font-size-base) * var(--font-scale))` picks it up
  automatically.
- **High contrast** — `data-high-contrast="true"` on `<html>`, swaps to
  a pure black/white palette with darkened accent colors that still
  clear 4.5:1 contrast.

Both persist via `localStorage` so patients don't lose their settings
on reload. Wrap the app root in `<AccessibilityProvider>` once; use
`useAccessibility()` or drop in `<AccessibilityToggle />` anywhere.

**Contrast notes:** terracotta/sage/ochre are all under 3:1 against the
background — they're fills, badges, and accents only, never text
color. Brown/charcoal text on the cream background clears AAA
(~11.6:1). See inline comments in `tokens.css` for the exact values.

## components/
`Button.jsx` — shared button with `primary` / `secondary` / `ghost`
variants, all meeting `--touch-target-min` (64px). Meant to be used by
every game screen (Person 1/3/4), not just Game 2, so tappable controls
feel consistent across the app.

## sundown/
`SundownContext.jsx` checks the clock and applies `data-sundown="true"`
to `<html>` during the configured evening window (default 5–8 PM),
which `tokens.css` picks up to dim the palette and slow transitions.
Also exposes `audioVolumeMultiplier` so any audio (Game 2's background
music, Person 3's voice reminders) can quiet down automatically.

`SundownDevPanel.jsx` is a dev-only slider to simulate any hour
instantly, for testing without changing the device clock. **Remove or
gate this behind a debug flag before the Day 6 demo build.**

## music/
`musicLibrary.js` — curated *briefs* (mood, tempo, style notes,
licensing guidance) for 4 calming tracks. **No audio files are
included** — someone needs to source real royalty-free tracks against
these specs (Free Music Archive, Freesound CC0, Pixabay Music are
listed) and fill in the `url` field per track.

`MusicLinkPicker.jsx` — caregiver UI to link a favorite song to a
patient, producing a `MemoryAsset` (`type: "music"`) in the exact
CONTRACTS.md shape.

## difficulty/
`difficultyEngineStub.js` — **temporary.** Implements the same rule
Person 4's real engine is scoped to build (>80% accuracy → harder,
<40% → easier, rolling 5-round window), matching the documented
interface (`getCurrentTier`, `updateTierAfterSession`) exactly. Delete
this file once the real engine ships and repoint the one import line
in `useGameTwoLogic.js` — nothing else changes.

## games/GameTwo/
"Spot what changed" — a grid of familiar objects, one recolored,
patient taps the difference. No "wrong answer" state ever shown, per
the project's validation-therapy design principle: misses get a warm
redirect, not an error; accuracy is `1 / attempts` (never zero); after
6 gentle misses a round quietly rotates rather than stalling forever.

Session logging matches the `GameSession` schema exactly and currently
writes through `localStorageStub.js` — **also temporary**, matching
Person 1's documented local-storage interface
(`saveSession`/`getPatientData`/`queueForSync`). Delete once her real
IndexedDB layer ships; same one-line import swap.

Optional background music plays softly if a `musicTrackId` is passed
in, with volume tied to sundown mode automatically.

## assets-gamosa/
An **original** geometric border pattern inspired by (not copied from)
Assamese Gamosa textile borders — see the provenance note at the top
of `gamosa-border.svg`. Two modes: `strip` (login card, dashboard
sidebar) and `corner` (low-opacity accent for game screens). Uses the
existing palette rather than traditional red/white so it reads as
"inspired by," not a reproduction.

## Two things intentionally left as stubs
| Stub | Matches interface owned by | Swap when |
|---|---|---|
| `difficulty/difficultyEngineStub.js` | Person 4 (Mokshita) | Real engine ships |
| `games/GameTwo/localStorageStub.js` | Person 1 (Anvi) | Real IndexedDB layer ships |

Both were built against the documented function signatures in
CONTRACTS.md Section 6, so swapping them is a single import-line
change, not a rewrite.

## Setup
```jsx
// App root
import './design-system/tokens.css';
import { AccessibilityProvider } from './design-system';
import { SundownProvider } from './sundown/SundownContext';

function App() {
  return (
    <AccessibilityProvider>
      <SundownProvider>
        {/* rest of the app */}
      </SundownProvider>
    </AccessibilityProvider>
  );
}
```

## Known gaps / not done here
- Real audio files for the music library (curation only, no binaries)
- Full-app accessibility pass (only my own screens verified — see
  `docs/DAY5_ACCESSIBILITY_AUDIT.md` if included in this branch)
- Naga and Mizo textile motifs from Prachi's visual-assets handoff
  (only Gamosa was assigned to me)
