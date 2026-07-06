# PARK WOD — Project Context

## Overview

PARK WOD is a mobile-first Progressive Web App (PWA) for structured outdoor fitness workouts. It provides a library of ~300+ pre-designed workouts with intelligent timer support, voice guidance, workout logging, and personal record tracking. The app is designed to be installed on a phone home screen and used in parks/outdoor spaces — readability in sunlight and offline operation are core design goals.

The entire app is a **single `index.html` file** (~385KB). This is intentional for PWA simplicity and offline deployment. All React components, styles, data, and logic live in this one file.

## Tech Stack

- **React 18** loaded via CDN (production UMD build)
- **Babel Standalone** for in-browser JSX transpilation
- **No build step** — the file is served as-is
- **No external UI framework** — all styling is inline React style objects via a `sty` object and the `DS` design system constant
- **Fonts:** Bebas Neue (display/headings), DM Sans (body text) via Google Fonts

### Browser APIs Used

- Web Audio API (beeps/tones during workouts)
- Speech Synthesis API (voice announcements)
- Vibration API (haptic feedback)
- Wake Lock API (keeps screen on during workouts)
- Clipboard API (share workouts)
- localStorage (all data persistence)
- Service Worker (offline support — `sw.js` registered on load)

## Architecture

### Single-File Structure

The file is organised in sections, roughly in this order:

1. **HTML head** — meta tags, PWA config, Google Fonts, base CSS/animations
2. **Design System (`DS`)** — colours, fonts, spacing, gradients, radius values
3. **Data Constants** — `CATEGORY_PATTERNS`, `EXERCISE_INFO` (~300+ exercises with muscles/descriptions)
4. **Raw Workout Data (`RAW_DATA`)** — array of all workout objects
5. **Audio System** — `playTone()`, `beepWork()`, `speakText()` and related audio utilities
6. **Block Parser** — `parseBlocks()`, `detectBlockTimer()` — splits workout text into timed phases
7. **Custom Hooks** — `useTimer()`, `useSettings()`, `useWorkoutLogs()`, `useFavourites()`
8. **Timer Components** — `TimerDisplay`, `TimerSettingsModal` (format-specific timer UIs)
9. **Full Screen Workout** — `FullScreenWorkout` component (the most complex component — phase execution engine)
10. **Workout Logging** — `LogWorkoutModal`, `formatLogResult()`, result field helpers
11. **Screen Components** — `HomeScreen`, `LibraryScreen`, `WorkoutDetail`, `HistoryScreen`, `SettingsScreen`
12. **App Root** — `App` component with screen routing and global state
13. **Styles** — `sty` object containing all CSS-in-JS style definitions

### State Management

All state is React `useState`/`useCallback`/`useMemo` hooks. No external state library.

**localStorage keys:**
| Key | Purpose |
|-----|---------|
| `parkwod:welcomed` | First-time user flag |
| `parkwod-logs` | Array of workout log entries |
| `parkwod-diff-overrides` | Per-workout difficulty overrides |
| `parkwod_customizations` | Per-workout edits (reps, exercises, duration) |
| `parkwod:workout_recovery` | Crash recovery state (auto-saved every 15s) |
| `parkwod:favourites` | Favourited workout IDs |
| `parkwod:settings` | User settings (font size, audio, name, etc.) |

### Screen Navigation

Simple string-based routing via `screenState` — no router library. Screens: `home`, `library`, `detail`, `history`, `settings`.

## Data Model

### Workout Object (from `RAW_DATA`)
```
{
  id, name, format, equipment, focus, rating, duration,
  warmup, workout, core, movements, wm
}
```
- `format`: "AMRAP", "For Time", "EMOM", "Tabata", "Rounds", "Ladder", "Deck of Cards", etc.
- `equipment`: "Bodyweight", "Dumbbell", "Kettlebell", "Mixed"
- `wm`: movement names array (used for injury/exclusion filtering)

### Workout Log Entry
Format-specific result fields — AMRAP uses rounds+extraReps, For Time uses completionMins/Secs, etc.

### Exercise Info (`EXERCISE_INFO`)
Keyed by exercise name slug. Each entry has: `name`, `aka` (aliases), `muscles`, `desc` (technique guide).

## Key Features

### Timer System
The timer auto-detects workout format from the text and selects the appropriate display:
- **Countdown** — AMRAP, Deck of Cards, Running Clock
- **EMOM** — minute/total display, next exercise preview in final 10s
- **Tabata** — work/rest cycles with exercise rotation
- **Fight Gone Bad** — station-based rounds
- **Death By** — escalating reps per minute
- **Stopwatch** — For Time, Rounds, Chipper (counts up, optional time cap)

### Exercise Highlighting
Workout text is parsed to detect exercise names (longest-match-first regex). Tapping a highlighted exercise opens an info modal with muscles and technique instructions.

### Outdoor Mode
High-contrast white-background theme for sunlight readability. Can be set as default or toggled per workout session.

### Crash Recovery
Auto-saves workout state every 15s. On restart, offers to resume if recovery data is less than 2 hours old.

### Workout Customisation
Users can edit reps, exercises, and instructions per workout. Customisations are stored separately from the original data and can be reset.

### Logging & PBs
- Format-specific result capture
- Personal best detection (highest rounds for AMRAP, fastest time for For Time, etc.)
- Comparison against previous attempts
- Activity streak tracking

### Audio & Voice
- Tone beeps for phase transitions (work start, rest, countdown, finish)
- Voice announcements for exercise names, rounds, and minutes
- Abbreviation expansion (e.g. "KB" becomes "Kettlebell")
- Vibration patterns for key events

## Design System Reference

### Colours
- **Primary Orange:** `#ff8a3a`
- **Green:** `#3ddc84` (success, start buttons)
- **Purple:** `#8b5cf6` (secondary actions, core exercises)
- **Yellow:** `#eab308` (warmup accents)
- **Red:** `#ef4444` (warnings, extreme difficulty)
- **Blue:** `#3b82f6` (rest, info)
- **Background:** `#0a0a15`
- **Surface:** `#111122`
- **Border:** `#222`

### Fonts
- Display: Bebas Neue
- Body: DM Sans

## Development Notes

- **No build/compile step** — edit `index.html` directly and refresh
- **PWA assets** — expects `manifest.json`, `sw.js`, and `icon-192.png` alongside the HTML file
- When editing, be mindful of the file size — changes should be surgical. Read the relevant section before modifying
- All CSS is inline via React style objects — there is no separate stylesheet beyond the base `<style>` block in the head
- The `sty` object near the bottom of the file contains shared style definitions used across components
- Australian English spelling is used throughout (e.g. "favourite", "organisation")

## AI Development Protocol Rules

This project follows the AI CTO Development System protocol. The following rules apply to all development work.

### Roles

You will operate using the following roles as directed by the `/dev-*` skills:

- **CTO** — technical strategy and decision-making
- **Product Manager** — requirements clarity and user focus
- **Software Architect** — system design and structure
- **Senior Engineer** — implementation
- **QA Engineer** — testing and quality
- **Release Manager** — production readiness

### Engineering Rules

1. Never jump directly to coding without architecture.
2. Always analyse edge cases before implementing features.
3. Always design tests before writing implementation code.
4. Ensure new features do not break existing functionality.
5. Prefer simple, maintainable designs over clever complexity.
6. Minimise unnecessary code changes.
7. When multiple implementation approaches exist, state the trade-offs before choosing.

### Development Phases

All features must progress through these phases in order:

1. Product Definition
2. Architecture Design
3. Development Roadmap
4. Feature Analysis
5. Edge Case Analysis
6. Test Planning
7. Implementation
8. Integration Review (gate: PASS / CONDITIONAL PASS / FAIL)
9. QA Validation (gate: PASS / FAIL)
10. Engineering Hardening
11. Production Audit (gate: GO / NO-GO)

### Protocol State

Development protocol state is stored in `.dev-system/`. Each `/dev-*` skill reads from and writes to this directory. Do not manually edit files in `.dev-system/` unless instructed.

### Containment Rules

When implementing features, strict code change containment applies:
- Only modify files listed as allowed in the containment boundary
- Do not refactor unrelated code
- If a change outside boundaries is required, flag it for explicit approval before proceeding
