# ParkWod — System Architecture

## 1. Application Architecture Overview

**Pattern:** Client-side monolith — single-file Progressive Web App

ParkWod is a purely client-side application with no server component. The entire app — UI, logic, data, and styles — lives in a single `index.html` file. This is a deliberate architectural choice that optimises for:

- **Zero infrastructure** — no server to deploy, manage, or pay for
- **Offline-first** — the entire app is cached locally via Service Worker
- **Simplicity** — no build step, no bundler, no package manager
- **Portability** — can be hosted on any static file host (GitHub Pages, Netlify, S3, etc.)

```
┌─────────────────────────────────────────────────────┐
│                   index.html                         │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Design   │  │ Data     │  │ Audio System     │  │
│  │ System   │  │ Layer    │  │ (Web Audio,      │  │
│  │ (DS)     │  │ (RAW_    │  │  Speech Synth,   │  │
│  │          │  │  DATA,   │  │  Vibration)      │  │
│  │          │  │  EXERCISE │  │                  │  │
│  │          │  │  _INFO)  │  │                  │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ Block Parser                                  │   │
│  │ (parseBlocks, detectBlockTimer)               │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ Custom Hooks                                  │   │
│  │ useTimer │ useSettings │ useWorkoutLogs │     │   │
│  │ useFavourites                                 │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ UI Components                                 │   │
│  │                                               │   │
│  │  App (root + routing)                         │   │
│  │  ├── HomeScreen                               │   │
│  │  ├── LibraryScreen                            │   │
│  │  ├── WorkoutDetail                            │   │
│  │  │   └── FullScreenWorkout                    │   │
│  │  │       ├── TimerDisplay                     │   │
│  │  │       └── TimerSettingsModal               │   │
│  │  ├── HistoryScreen                            │   │
│  │  ├── SettingsScreen                           │   │
│  │  └── Modals (LogWorkout, ExerciseInfo)        │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────┐                                       │
│  │ Styles   │                                       │
│  │ (sty)    │                                       │
│  └──────────┘                                       │
└─────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────┐     ┌───────────────┐
│ localStorage  │     │ Service Worker│
│ (all user     │     │ (sw.js)       │
│  data)        │     │ offline cache │
└───────────────┘     └───────────────┘
```

**Entry point and bootstrap process:**
1. Browser loads `index.html`
2. CDN scripts load (React 18, ReactDOM, Babel Standalone)
3. Google Fonts load (Bebas Neue, DM Sans)
4. Babel transpiles inline JSX in `<script type="text/babel">` block
5. `DS` design system and data constants initialise
6. React renders `App` component → checks for crash recovery state → renders appropriate screen
7. Service Worker registers for offline caching

---

## 2. Major Modules and Responsibilities

| Module | Responsibility | Dependencies |
|---|---|---|
| **Design System (`DS`)** | Single source of truth for all visual constants: colours, fonts, spacing, gradients, border radii | None |
| **Data Layer** | Static workout catalogue (`RAW_DATA`) and exercise reference data (`EXERCISE_INFO`). Immutable at runtime. | None |
| **Audio System** | Sound effects via Web Audio API (`playTone`, `beepWork`), voice via Speech Synthesis (`speakText`), haptics via Vibration API | `DS` (for nothing — standalone) |
| **Block Parser** | Parses workout text into structured phases/blocks; detects appropriate timer format | Data Layer (workout text) |
| **Timer Engine (`useTimer`)** | Core timing logic for all workout formats. Manages countdown, interval, stopwatch behaviours. Handles pause/resume. | Block Parser (phase structure) |
| **FullScreenWorkout** | Orchestrates a live workout session: phase transitions, timer display, audio triggers, auto-save | Timer Engine, Audio System, Block Parser |
| **Workout Logging** | Captures format-specific results, detects PBs, manages log history | Data Layer (format info) |
| **Screen Components** | UI for each app screen (Home, Library, Detail, History, Settings) | All hooks, DS, Data Layer |
| **App Root** | Screen routing via `screenState`, global state coordination, crash recovery prompt | All Screen Components |
| **Styles (`sty`)** | CSS-in-JS style objects shared across components | `DS` |

**Dependency direction:** Data flows downward. `DS` and Data Layer have no dependencies. Hooks depend on Data Layer. Components depend on Hooks and DS. App Root depends on everything.

---

## 3. UI Architecture and Component Structure

### Component Hierarchy

```
App
├── [Crash Recovery Prompt]  (conditional — on load if recovery data exists)
├── Navigation Bar           (bottom tab bar: Home, Library, History, Settings)
│
├── HomeScreen
│   ├── Welcome Banner / User Greeting
│   ├── Featured Workouts (curated cards)
│   └── Quick Filters (format shortcuts)
│
├── LibraryScreen
│   ├── Search Bar
│   ├── Filter Controls (format, equipment, focus, favourites)
│   └── Workout Card List (virtualised/scrollable)
│       └── WorkoutCard (name, format, equipment, duration, difficulty, fav icon)
│
├── WorkoutDetail
│   ├── Workout Header (name, format, difficulty, duration)
│   ├── Movement List (with exercise highlighting)
│   ├── Warmup / Workout / Core Sections
│   ├── Customise Button → Customisation Editor
│   ├── Start Button → FullScreenWorkout
│   └── Exercise Info Modal (triggered by tap on highlighted exercise)
│
├── FullScreenWorkout
│   ├── Timer Display (format-specific: countdown, EMOM, Tabata, stopwatch, etc.)
│   ├── Current Phase/Exercise Display
│   ├── Phase Progress Indicator
│   ├── Pause/Resume Controls
│   ├── Outdoor Mode Toggle
│   ├── Timer Settings Modal
│   └── [On Complete] → LogWorkoutModal
│       ├── Format-Specific Result Fields
│       ├── PB Detection Display
│       └── Save / Discard
│
├── HistoryScreen
│   ├── Activity Streak Display
│   ├── Log Entry List (date-ordered)
│   └── Log Detail View (results, PB badges, comparison)
│
└── SettingsScreen
    ├── User Name
    ├── Font Size Control
    ├── Audio Cues Toggle
    ├── Voice Announcements Toggle
    ├── Outdoor Mode Default Toggle
    └── [Future: Data Export/Import]
```

### Navigation

- **Pattern:** Simple string-based screen routing via `screenState` variable
- **Screens:** `home`, `library`, `detail`, `history`, `settings`
- **No router library** — `screenState` is a React state variable; switching screens is a state update
- **Full Screen Workout** overlays the current screen (not a separate route)

### Responsive Design

- **Mobile-first and mobile-only** — designed for phone screens (portrait orientation)
- **No desktop layout** — acceptable given the outdoor/park use case
- **Font size adjustable** via Settings for accessibility
- **Touch targets:** minimum 44x44px as per iOS Human Interface Guidelines

### Accessibility

- Adjustable font size via Settings
- High-contrast outdoor mode (white background, dark text)
- Voice announcements provide audio-only workout guidance
- Haptic feedback supplements visual/audio cues

---

## 4. State Management Approach

### Client-Side State

**Pattern:** React hooks only (`useState`, `useCallback`, `useMemo`). No external state library.

| State Category | Managed By | Scope | Persistence |
|---|---|---|---|
| Current screen | `App` (`screenState`) | Global | None (resets on load) |
| Selected workout | `App` | Global | None |
| Timer state | `useTimer` hook | FullScreenWorkout | Auto-saved every 15s |
| User settings | `useSettings` hook | Global | `parkwod:settings` |
| Workout logs | `useWorkoutLogs` hook | Global | `parkwod-logs` |
| Favourites | `useFavourites` hook | Global | `parkwod:favourites` |
| Customisations | Component state | WorkoutDetail | `parkwod_customizations` |
| Difficulty overrides | Component state | WorkoutDetail | `parkwod-diff-overrides` |
| Recovery state | FullScreenWorkout | Global | `parkwod:workout_recovery` |
| First-run flag | App | Global | `parkwod:welcomed` |

### State Synchronisation

- **No server-side state** — all state is local
- **No cross-tab sync** — single-tab use is assumed
- Custom hooks read from localStorage on mount and write on change
- State flows top-down via React props; no event bus or pub/sub

### Caching Strategy

- **localStorage** is the persistence layer (not a cache)
- **Service Worker** caches the app shell (HTML, CDN scripts, fonts) for offline use
- **No data caching** beyond localStorage — workout data is embedded in the HTML

---

## 5. API Structure

**There is no API.** ParkWod is a purely client-side application.

- No server endpoints
- No authentication or authorisation
- No network requests at runtime (after initial load)
- All data is embedded in the HTML file or stored in localStorage

### Browser APIs Used (as "API surface")

| API | Purpose | Fallback |
|---|---|---|
| Web Audio API | Generate beep/tone sounds for timer events | Silent operation |
| Speech Synthesis API | Voice announcements during workouts | Audio beeps only |
| Vibration API | Haptic feedback on phase transitions | No vibration (visual/audio only) |
| Wake Lock API | Prevent screen sleep during workouts | Screen may sleep (user can adjust phone settings) |
| Clipboard API | Copy workout details for sharing | Fallback copy method or manual copy |
| localStorage API | All data persistence | App functions but data doesn't persist (critical failure) |
| Service Worker API | Offline caching | App requires network on each load |

---

## 6. Data Model

### Entity Definitions

#### Workout
```
{
  id: string              // Unique identifier (e.g. "amrap-001")
  name: string            // Display name (e.g. "Park Burner")
  format: string          // Timer format (AMRAP|For Time|EMOM|Tabata|Rounds|Ladder|Deck of Cards|...)
  equipment: string       // Required gear (Bodyweight|Dumbbell|Kettlebell|Mixed)
  focus: string           // Target area (Full Body|Upper Body|Lower Body|Core|Cardio|...)
  rating: number          // Difficulty rating (1-5)
  duration: number        // Estimated minutes
  warmup: string          // Warmup instructions (free text)
  workout: string         // Main workout instructions (free text, parsed by Block Parser)
  core: string            // Cool-down/core work instructions (free text)
  movements: string[]     // Exercise names used in this workout
  wm: string[]            // Movement names for injury/exclusion filtering
}
```
- **Source:** `RAW_DATA[]` — static, embedded in HTML, immutable at runtime
- **Count:** ~300+ entries

#### ExerciseInfo
```
{
  [slug: string]: {
    name: string          // Display name
    aka: string[]         // Alternative names / aliases
    muscles: string[]     // Targeted muscle groups
    desc: string          // Technique description
  }
}
```
- **Source:** `EXERCISE_INFO{}` — static, embedded in HTML
- **Relationship:** Linked to Workout via movement name matching (longest-match-first)

#### WorkoutLog
```
{
  id: string              // Generated unique ID
  workoutId: string       // → Workout.id
  date: string            // ISO date string
  duration: number        // Actual time spent (seconds)
  format: string          // Workout format (for result field selection)
  // Format-specific result fields:
  rounds?: number         // AMRAP: completed rounds
  extraReps?: number      // AMRAP: reps in incomplete round
  completionMins?: number // For Time: minutes
  completionSecs?: number // For Time: seconds
  // ... other format-specific fields
  personalBest: boolean   // Whether this is a PB
  notes?: string          // Optional user notes
}
```
- **Storage:** `localStorage['parkwod-logs']` — JSON array
- **Relationship:** Many logs → one Workout (via workoutId)

#### UserSettings
```
{
  name: string            // User's display name
  fontSize: number        // Font size multiplier or px value
  audioEnabled: boolean   // Master audio toggle
  voiceEnabled: boolean   // Voice announcements toggle
  outdoorDefault: boolean // Start in outdoor mode by default
  // ... additional preference fields
}
```
- **Storage:** `localStorage['parkwod:settings']` — JSON object

#### Customisation
```
{
  [workoutId: string]: {
    // Overridden fields only — sparse object
    workout?: string      // Modified workout text
    warmup?: string       // Modified warmup
    core?: string         // Modified core
    duration?: number     // Modified duration
  }
}
```
- **Storage:** `localStorage['parkwod_customizations']` — JSON object keyed by workout ID

#### RecoveryState
```
{
  workoutId: string       // Workout being executed
  phase: string           // Current phase (warmup|workout|core)
  elapsed: number         // Seconds elapsed in current phase
  totalElapsed: number    // Total seconds elapsed
  timestamp: number       // Unix timestamp of last save
  // ... additional timer state
}
```
- **Storage:** `localStorage['parkwod:workout_recovery']` — JSON object
- **Expiry:** Discarded if timestamp is more than 2 hours old

### Relationships

```
Workout (1) ←── (many) WorkoutLog
Workout (1) ←── (0..1) Customisation
Workout (1) ←── (0..1) DifficultyOverride
Workout (many) ──→ (many) ExerciseInfo  (via movement name matching)
Workout (many) ←── (set) Favourites     (set of workout IDs)
```

### Data Migration

- No database migrations — data is schemaless JSON in localStorage
- Schema changes must be backwards-compatible: new fields use defaults; removed fields are ignored
- On app load, hooks should handle missing/unexpected fields gracefully

---

## 7. Persistence and Storage Layer

### Storage: localStorage

| Aspect | Detail |
|---|---|
| **Choice** | `window.localStorage` — browser-native key-value store |
| **Reasoning** | Zero-infrastructure persistence. No server, no database, no account. Aligns with offline-first, single-file architecture. |
| **Capacity** | ~5–10MB depending on browser (typically 5MB on mobile Safari, 10MB on Chrome) |
| **Format** | JSON-serialised strings per key |
| **Durability** | Persists across sessions. Lost on cache/data clear, incognito mode, or storage pressure. |

### Schema Design

Seven distinct localStorage keys (see State Management table above). Each key stores a self-contained JSON value. No cross-key transactions.

### Backup and Recovery

- **Currently:** No backup mechanism. Data loss on cache clear is permanent.
- **Risk mitigation (future):** JSON export/import via Settings screen would allow manual backup
- **Crash recovery:** Auto-save every 15s during workouts; 2-hour recovery window

### Data Retention

- Workout logs are kept indefinitely (until manual deletion or cache clear)
- Recovery state expires after 2 hours
- No automated cleanup or archival

---

## 8. External Integrations

### CDN Dependencies (Load-Time Only)

| Resource | Source | Purpose | Failure Mode |
|---|---|---|---|
| React 18 (UMD) | CDN (unpkg/cdnjs) | UI framework | App does not render |
| ReactDOM 18 | CDN | React DOM renderer | App does not render |
| Babel Standalone | CDN | In-browser JSX transpilation | App does not render |
| Bebas Neue font | Google Fonts | Display/heading font | Falls back to system sans-serif |
| DM Sans font | Google Fonts | Body text font | Falls back to system sans-serif |

**Critical note:** React, ReactDOM, and Babel are required for the app to function. If CDN is unavailable on first load, the app will not work. After first load, the Service Worker caches these files for offline use.

### No Runtime Integrations

- No analytics services
- No error reporting services
- No third-party APIs called at runtime
- No webhook receivers

---

## 9. Third-Party Libraries and Packages

| Library | Version | Purpose | Licence | Loaded Via |
|---|---|---|---|---|
| React | 18.x | UI component framework | MIT | CDN `<script>` tag |
| ReactDOM | 18.x | React DOM rendering | MIT | CDN `<script>` tag |
| Babel Standalone | 7.x | In-browser JSX → JS transpilation | MIT | CDN `<script>` tag |
| Bebas Neue | — | Display/heading typeface | OFL | Google Fonts CSS |
| DM Sans | — | Body text typeface | OFL | Google Fonts CSS |

**No npm packages. No package.json. No node_modules.** All dependencies are loaded via CDN script tags and cached by the Service Worker.

---

## 10. Validation Strategy

| Boundary | What's Validated | How |
|---|---|---|
| **Workout log input** | Result fields (rounds, reps, time) | Type checking and range validation in `LogWorkoutModal` before saving |
| **Settings input** | Font size range, name length | Inline validation in `SettingsScreen` |
| **Customisation input** | Modified workout text, duration | Basic presence/type checks before saving |
| **localStorage reads** | All parsed JSON | `try/catch` around `JSON.parse()`; default values on failure |
| **Recovery state** | Timestamp freshness, data completeness | Age check (< 2 hours); required fields present |
| **Exercise name matching** | Regex pattern validity | Pre-built at init from `EXERCISE_INFO` keys; no user-supplied regex |

**No server-side validation** — there is no server. All validation occurs in-browser at the point of user input or data read.

---

## 11. Logging Strategy

**There is no structured logging.** This is appropriate for a client-side-only app with no server.

| Aspect | Approach |
|---|---|
| **Runtime errors** | Browser console (`console.error`) — visible only in dev tools |
| **Debug info** | `console.log` during development; removed or gated in production |
| **User-visible errors** | Inline UI messages (e.g., "Could not save — storage may be full") |
| **Crash reporting** | None — no telemetry service. Crash recovery mechanism mitigates impact. |
| **Sensitive data** | No sensitive data exists (no accounts, no PII beyond optional user name) |

---

## 12. Error Handling Approach

### Error Categories

| Category | Example | Handling |
|---|---|---|
| **localStorage failure** | Storage full, quota exceeded | Catch error; show user-facing message; operation fails gracefully (app continues to work, data not saved) |
| **Browser API unavailable** | Wake Lock, Vibration, Speech Synthesis not supported | Feature detection (`if ('wakeLock' in navigator)`); skip feature silently or disable related toggle |
| **Audio playback failure** | Web Audio context suspended (autoplay policy) | Resume AudioContext on user gesture; fallback to silent operation |
| **CDN load failure** | React/Babel script blocked or unavailable | App fails to render (critical). Mitigated by Service Worker caching after first load. |
| **Malformed localStorage data** | Corrupted JSON, unexpected schema | `try/catch` on parse; reset to defaults; do not crash |
| **Timer drift** | `setInterval` deprioritised by OS | Use `Date.now()` delta comparison rather than trusting interval accuracy |

### Error Propagation

- Errors are handled locally where they occur (in hooks and components)
- No global error boundary currently documented (React `ErrorBoundary` would be a good addition)
- Errors do not propagate to a server — there is no server
- User-facing errors are shown inline in the UI, not as alerts/popups

---

## 13. Security Considerations

### Threat Model

ParkWod has a minimal attack surface due to its architecture:

| Concern | Assessment |
|---|---|
| **Authentication** | None — no user accounts, no login |
| **Authorisation** | Not applicable — single-user, local-only |
| **Data in transit** | Initial load over HTTPS (CDN + hosting). No runtime network requests. |
| **Data at rest** | localStorage is unencrypted but device-local. No sensitive data beyond optional user name. |
| **XSS** | Low risk — React escapes rendered content by default. Workout text is rendered, not executed. Exercise highlighting uses regex, not `innerHTML`. Customisation input should not be rendered as raw HTML. |
| **Injection** | No database, no server, no SQL, no shell commands. Not applicable. |
| **Supply chain** | CDN dependencies (React, Babel) could be compromised. Mitigated by Subresource Integrity (SRI) hashes on `<script>` tags (should be verified). |
| **Content Security Policy** | Should be set to restrict script sources to CDN origins and `'unsafe-eval'` (required by Babel Standalone). |

### Recommendations

- Verify SRI hashes are present on CDN `<script>` tags
- Ensure no use of `dangerouslySetInnerHTML` for user-editable content
- Consider a basic Content-Security-Policy meta tag

---

## 14. Performance Considerations

### Load Performance

| Phase | Expected Time | Notes |
|---|---|---|
| HTML download (first load) | ~200ms (4G) | ~385KB file |
| CDN script download | ~300ms (parallel) | React + ReactDOM + Babel (cached after first load) |
| Babel transpilation | ~500ms–1s | In-browser JSX compilation; this is the largest cost |
| Font download | ~200ms (non-blocking) | Google Fonts; falls back gracefully |
| React render | ~100ms | Initial render of Home screen |
| **Total first load** | **~1–2s** | Within NFR-PERF-01 (3s target) |
| **Cached load** | **~500ms–1s** | Babel transpilation is the bottleneck even when cached |

### Runtime Performance

| Area | Concern | Approach |
|---|---|---|
| **Timer rendering** | Must update every second without jank | `requestAnimationFrame` or `setInterval` with `Date.now()` delta; minimal re-renders via `useMemo` |
| **Library scrolling** | 300+ workout cards | `useMemo` for filtered list; consider virtualised list if scrolling jank occurs |
| **Exercise highlighting** | Regex matching on workout text | Pre-compiled regex from `EXERCISE_INFO` keys at init; longest-match-first ordering |
| **Audio generation** | Web Audio API tone synthesis | Lightweight; no performance concern |
| **localStorage I/O** | Synchronous reads/writes | Fast for small payloads; auto-save every 15s (not every tick) |

### Bottlenecks

1. **Babel Standalone transpilation** — the largest single cost on every page load (~500ms–1s). Acceptable trade-off vs. build tooling complexity.
2. **Single-file size** — at 385KB, the file is manageable but approaching the point where further growth should be monitored.
3. **No code splitting** — the entire app loads on every page view. Not a problem at current size.

---

## Architecture Risk Areas

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| Single-file becomes unmaintainable (>500KB) | High | Medium | Strict containment; surgical edits; section comments; consider splitting only if necessary |
| Babel Standalone transpilation becomes too slow | Medium | Low | Acceptable at current size; only a concern if file doubles |
| CDN unavailable on first load | Critical | Very Low | Service Worker caches after first load; consider self-hosting React/Babel as fallback |
| localStorage quota exceeded | Medium | Low | Monitor usage; warn users; future: export/import |
| No automated tests | High | N/A (permanent) | Manual QA checklists per change; architecture is simple enough to reason about |
| No React ErrorBoundary | Medium | Low | Add a top-level ErrorBoundary to prevent white-screen crashes |
| Speech Synthesis unreliable on iOS | Medium | High | Already mitigated by graceful degradation; ensure fallback is tested |

---

## Architecture Checklist Status

### Application Structure
- [x] Overall architecture pattern — client-side monolith (single-file PWA)
- [x] Module/package boundaries — 10 logical modules within one file
- [x] Dependency direction — data flows top-down; DS and Data Layer at base
- [x] Entry points and bootstrap — HTML load → CDN → Babel → React render

### UI Architecture
- [x] Component hierarchy — documented above
- [x] Page/screen structure and navigation — string-based `screenState` routing
- [x] Shared/reusable components — `DS` constants, `sty` styles, custom hooks
- [x] Layout and responsive design — mobile-first, portrait, adjustable font size
- [x] Accessibility approach — font size control, outdoor mode contrast, 44px touch targets

### State Management
- [x] Client-side state — React hooks only, no external library
- [x] Server-side state — N/A (no server)
- [x] State synchronisation — N/A (single client, no server)
- [x] Caching strategy — Service Worker for app shell; localStorage for user data

### API Design
- [x] N/A — no API (client-only app)

### Data Model
- [x] Entity definitions — Workout, ExerciseInfo, WorkoutLog, UserSettings, Customisation, RecoveryState
- [x] Relationships — documented with cardinality
- [x] Indexes and query patterns — in-memory filtering on RAW_DATA; localStorage key lookup
- [x] Data migration — backwards-compatible schema evolution; graceful defaults
- [x] Seed/fixture data — RAW_DATA and EXERCISE_INFO embedded in HTML

### Persistence
- [x] Database choice — localStorage (reasoning documented)
- [x] Schema design — 7 independent localStorage keys with JSON values
- [x] Connection management — N/A (synchronous browser API)
- [x] Backup and recovery — crash recovery exists; data export is a future enhancement
- [x] Data retention — indefinite for logs; 2-hour expiry for recovery state

### External Integrations
- [x] Third-party APIs — CDN only (load-time); no runtime APIs
- [x] Failure modes — CDN failure is critical on first load only
- [x] API key/secret management — N/A (no keys or secrets)

### Cross-Cutting Concerns
- [x] Validation — input validation at UI boundaries; JSON parse safety
- [x] Logging — console only; no structured logging (appropriate for client-only)
- [x] Error handling — local catch-and-degrade; no global error boundary (recommended)
- [x] Security — minimal attack surface; SRI recommended for CDN scripts
- [x] Performance — Babel transpilation is primary bottleneck; acceptable at current scale

### Dependencies
- [x] All third-party packages listed — React, ReactDOM, Babel Standalone, 2 Google Fonts
- [x] Version constraints — React 18.x, Babel 7.x
- [x] Licence compatibility — all MIT/OFL (permissive)
- [x] Known vulnerabilities — none known for current versions
