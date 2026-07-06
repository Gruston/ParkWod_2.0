# ParkWod — Project Context

## Project Summary

| Field | Detail |
|---|---|
| **Application Name** | PARK WOD |
| **Description** | A mobile-first Progressive Web App (PWA) for structured outdoor fitness workouts. Provides 300+ pre-designed workouts with intelligent timer support, voice guidance, workout logging, and personal record tracking. |
| **Target Users** | Fitness enthusiasts who work out outdoors in parks — people who want structured, coached workouts without a gym membership or personal trainer. Likely skews toward functional fitness / CrossFit-style training. |
| **Problem Solved** | Removes the need to plan or remember workout routines. Provides structured programming, real-time coaching (timers, voice cues), and progress tracking — all offline-capable and sunlight-readable for outdoor use. |
| **Platform** | Mobile web (PWA) — installable on iOS and Android home screens via browser |
| **Technology Stack** | React 18 (CDN), Babel Standalone (in-browser JSX), single-file architecture (`index.html`), no build step, localStorage persistence, Service Worker for offline |
| **Current Stage** | Production — the app is functional with a comprehensive feature set (~385KB, ~3,950 lines) |
| **Known Issues** | None explicitly documented |
| **Files** | `index.html` (the entire app), plus expected PWA assets (`manifest.json`, `sw.js`, `icon-192.png`) |

## Refined Product Summary

PARK WOD is a self-contained fitness companion designed for outdoor training. It delivers a curated library of 300+ workouts spanning formats like AMRAP, EMOM, Tabata, For Time, and more. Each workout comes with an intelligent timer that auto-detects the format and provides the correct timing behaviour — countdown, interval, or stopwatch. Voice announcements, audio cues, and haptic feedback guide users through exercises hands-free. Users can log results, track personal bests, customise workouts, and maintain activity streaks. The app is built as a single HTML file for maximum simplicity: no server, no build step, fully offline-capable, and readable in direct sunlight via an outdoor mode.

## Key User Workflows

### 1. Discover and Start a Workout
1. Open app → Home screen shows featured/recommended workouts
2. Browse Library screen — filter by format, equipment, focus area
3. Tap a workout → Workout Detail screen (see movements, duration, difficulty)
4. Tap "Start" → Full Screen Workout with auto-detected timer
5. Timer runs with voice cues, beeps, and phase transitions
6. Workout ends → prompted to log result

### 2. Log and Track Progress
1. Complete a workout → Log modal appears with format-specific fields
2. Enter result (rounds+reps for AMRAP, time for For Time, etc.)
3. App detects personal bests and compares to previous attempts
4. View History screen for past logs, streaks, and PB records

### 3. Customise a Workout
1. Open Workout Detail → tap edit/customise
2. Modify reps, exercises, or duration
3. Customisation saved separately (original data preserved)
4. Can reset to original at any time

### 4. Manage Preferences
1. Settings screen → adjust font size, audio/voice preferences, name
2. Toggle outdoor mode (high-contrast for sunlight)
3. Set default difficulty overrides per workout

### 5. Resume After Interruption
1. App auto-saves workout state every 15 seconds
2. On reopen (within 2 hours), app offers to resume from saved point
3. User accepts or discards recovery state

## Core Application Components

| Component | Responsibility |
|---|---|
| **Design System (`DS`)** | Centralised colours, fonts, spacing, gradients |
| **Data Layer (`RAW_DATA`, `EXERCISE_INFO`)** | Static workout and exercise reference data |
| **Audio System** | Web Audio API tones, Speech Synthesis voice cues, Vibration API haptics |
| **Block Parser** | Parses workout text into timed phases; detects timer format |
| **Timer Engine (`useTimer`)** | Core timer logic — countdown, EMOM, Tabata, stopwatch, etc. |
| **FullScreenWorkout** | Phase execution engine — the most complex component; orchestrates timer, audio, display |
| **Workout Logging** | Format-specific result capture, PB detection, history storage |
| **Screen Components** | Home, Library, WorkoutDetail, History, Settings |
| **App Root** | Screen routing, global state, crash recovery |
| **Styles (`sty`)** | CSS-in-JS style definitions shared across components |

## Data Model

### Entities and Relationships

```
Workout (RAW_DATA[])
├── id (unique identifier)
├── name, format, equipment, focus, rating, duration
├── warmup, workout, core (text blocks)
├── movements[] (exercise names)
├── wm[] (movement names for filtering)
└── linked to → ExerciseInfo via movement names

ExerciseInfo (EXERCISE_INFO{})
├── key: exercise name slug
├── name, aka[] (aliases)
├── muscles[] (targeted muscle groups)
└── desc (technique description)

WorkoutLog (localStorage: parkwod-logs)
├── workoutId → links to Workout
├── date, duration
├── format-specific result fields
│   ├── AMRAP: rounds, extraReps
│   ├── For Time: completionMins, completionSecs
│   └── etc.
└── personalBest flag

UserSettings (localStorage: parkwod:settings)
├── fontSize, name
├── audio/voice preferences
└── outdoor mode default

Customisation (localStorage: parkwod_customizations)
├── workoutId → links to Workout
└── modified reps, exercises, duration

DifficultyOverride (localStorage: parkwod-diff-overrides)
├── workoutId → links to Workout
└── custom difficulty rating

Favourites (localStorage: parkwod:favourites)
└── set of workout IDs

RecoveryState (localStorage: parkwod:workout_recovery)
├── workoutId, current phase, elapsed time
└── expires after 2 hours
```

## Major Technical Risks

### 1. Single-File Scalability
**Risk:** At ~385KB and ~3,950 lines, the single `index.html` is already large. Adding significant new features will make it increasingly difficult to navigate, edit safely, and avoid regressions.
**Mitigation:** Surgical edits only. Read the relevant section before modifying. Consider whether any future features warrant extracting modules (though this changes the deployment model).

### 2. No Automated Testing
**Risk:** No test suite exists. A single-file app with in-browser Babel transpilation makes traditional unit/integration testing difficult. Regressions can only be caught manually.
**Mitigation:** Manual QA checklists for each change. Consider adding a minimal test harness if the project grows.

### 3. localStorage Limitations
**Risk:** All data is in localStorage (~5-10MB limit depending on browser). Heavy users with hundreds of workout logs could approach limits. Data loss on cache clear.
**Mitigation:** Monitor storage usage. Consider export/backup functionality. No cross-device sync exists.

### 4. Browser API Fragmentation
**Risk:** Speech Synthesis, Wake Lock, and Vibration APIs have inconsistent support across iOS Safari, Android Chrome, and other browsers. Voice quality and availability varies.
**Mitigation:** Graceful degradation is likely already in place, but each new feature touching these APIs needs cross-browser testing.

### 5. No Build Step / No Minification
**Risk:** Babel Standalone transpiles JSX in the browser at runtime. This adds load time and means syntax errors only appear at runtime. No tree-shaking or dead code elimination.
**Mitigation:** Acceptable trade-off for simplicity and zero-tooling deployment. Keep an eye on initial load performance.

### 6. Offline/PWA Cache Invalidation
**Risk:** Service Worker caching can serve stale versions of the app. Users may not receive updates promptly.
**Mitigation:** Ensure `sw.js` has a proper cache-busting strategy (version-based or network-first for the HTML file).

## Technology Stack Assessment

The current stack is **well-suited** for this project's goals:

- **Single-file PWA** aligns with the offline-first, install-to-home-screen use case
- **React via CDN + Babel Standalone** eliminates build tooling — appropriate for a project maintained by a small team or solo developer
- **localStorage** is sufficient for the current data volume and avoids server dependencies
- **No changes recommended** at this stage — the stack serves the product well. Migration to a build-step architecture would only be warranted if the app doubles in complexity

## Missing Information / Clarifications Needed

1. **Service Worker (`sw.js`)** — not present in the project directory provided. Is it hosted elsewhere, or does it need to be created/updated alongside changes?
2. **PWA manifest and icons** — similarly not in the provided files. Are these managed separately?
3. **Deployment target** — where is the app hosted? (GitHub Pages, Netlify, self-hosted?) This affects how updates are delivered.
4. **Analytics** — is there any usage tracking, or is this purely local?
5. **Target audience size** — is this a personal tool, shared with a community, or intended for public distribution? This affects the priority of cross-browser testing and edge case handling.
