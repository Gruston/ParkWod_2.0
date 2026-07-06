# ParkWod — Product Definition

## 1. Product Summary

PARK WOD is a mobile-first Progressive Web App that serves as a personal outdoor fitness coach. It solves the problem of workout planning and execution for people who train in parks and outdoor spaces without a trainer or gym.

**Value proposition:** A free, offline-capable, install-anywhere fitness app that provides 300+ structured workouts with intelligent timers, voice coaching, and progress tracking — all in a single file that works without an internet connection and is readable in direct sunlight.

**Core differentiators:**
- Format-aware timer system that auto-detects workout types (AMRAP, EMOM, Tabata, etc.) and provides the correct timing behaviour
- Voice and audio coaching for hands-free use during training
- Outdoor mode designed for sunlight readability
- Zero infrastructure — single HTML file, no server, no account required
- Offline-first by design

---

## 2. User Personas

### Persona 1: The Outdoor Functional Fitness Enthusiast

**Who:** Someone familiar with CrossFit-style training (AMRAPs, EMOMs, etc.) who prefers training outdoors over a gym. Age 25–45, moderate to high fitness level.

**Needs:** Structured workouts they don't have to program themselves. A reliable timer that understands workout formats. A way to track progress and PBs without pen and paper.

**Frustrations:** Generic fitness apps that don't understand functional fitness formats. Apps that require accounts, subscriptions, or constant internet. Tiny text that's unreadable in sunlight. Timers that don't match the workout structure.

**Usage:** Opens the app 3–5 times per week at the park. Browses by format or equipment, picks a workout, runs it with the timer, logs the result. Checks PBs and streaks on rest days.

### Persona 2: The Casual Park Exerciser

**Who:** Someone who wants to exercise outdoors but doesn't know what to do. Moderate fitness level, less familiar with functional fitness terminology.

**Needs:** Simple, guided workouts they can follow without expertise. Clear exercise descriptions. A timer that tells them what to do and when.

**Frustrations:** Feeling lost about what exercises to do. Complex apps with too many options. Workouts that assume equipment they don't have.

**Usage:** Opens the app 1–3 times per week. Filters to bodyweight workouts. Relies heavily on exercise info tooltips and voice guidance. Logs results occasionally.

### Persona 3: The Equipment-Equipped Trainer

**Who:** Someone who brings dumbbells, kettlebells, or other portable equipment to the park. Experienced, trains with purpose.

**Needs:** Workouts filtered by available equipment. Ability to customise reps/weights. Detailed history to track progression over time.

**Frustrations:** Having to mentally adapt workouts for their equipment. Losing workout history. Not being able to tweak a workout to match their level.

**Usage:** Opens the app 4–6 times per week. Filters by equipment type. Customises workouts frequently. Reviews history and PBs regularly. Uses difficulty overrides.

---

## 3. Key User Workflows

### WF-1: Find and Execute a Workout (Primary Happy Path)

1. User opens app → Home screen loads with featured workouts
2. User taps "Library" → full workout catalogue with filters
3. User applies filters (format, equipment, focus, duration)
4. User taps a workout card → Workout Detail screen
5. User reviews movements, duration, difficulty rating
6. User taps "Start" → Full Screen Workout launches
7. Timer auto-detects format and begins appropriate countdown/stopwatch
8. Voice announces exercises, phases, and transitions
9. Audio beeps signal phase changes; vibration provides haptic cues
10. Workout completes → finish tone plays
11. Log modal appears → user enters format-specific result
12. App checks for personal best → displays comparison if prior attempts exist
13. User returns to Home or Library

**Alternative: Exercise Info Lookup**
- At step 6 or during workout, user taps a highlighted exercise name
- Exercise info modal appears with muscles targeted and technique description
- User closes modal and continues

**Alternative: Workout Customisation Before Start**
- At step 5, user taps "Customise"
- Modifies reps, exercises, or duration
- Customisation saved; user proceeds to start

### WF-2: Review History and Progress

1. User taps "History" tab
2. History screen shows past workout logs, ordered by date
3. User can see results, PB badges, and streak information
4. User taps a specific log entry for detail view
5. Comparison against previous attempts for the same workout is shown

### WF-3: Resume an Interrupted Workout

1. User's workout is interrupted (phone call, app backgrounded, crash)
2. App has auto-saved state within the last 15 seconds
3. User reopens app within 2 hours
4. Recovery prompt appears: "Resume workout?"
5. User taps "Resume" → workout continues from saved point
6. **Alternative:** User taps "Discard" → recovery state cleared, returns to Home

### WF-4: Manage Favourites

1. User taps the favourite/heart icon on a workout card or detail screen
2. Workout added to favourites (persisted in localStorage)
3. User can filter Library to show only favourites
4. Tapping again removes from favourites

### WF-5: Adjust Settings

1. User taps "Settings" tab
2. Adjusts: font size, user name, audio/voice on/off, outdoor mode default
3. Changes saved immediately to localStorage
4. Settings apply globally across sessions

---

## 4. Feature Breakdown

| Feature | Description | Priority |
|---|---|---|
| Workout Library | Browsable catalogue of 300+ workouts with filtering by format, equipment, focus, duration | MUST HAVE |
| Format-Aware Timer | Auto-detects workout format and provides correct timer behaviour (countdown, EMOM intervals, Tabata cycles, stopwatch) | MUST HAVE |
| Full Screen Workout Execution | Phase-by-phase workout runner with timer display, exercise text, and phase transitions | MUST HAVE |
| Audio Cues | Beeps and tones for phase transitions, countdowns, work/rest signals, and workout completion | MUST HAVE |
| Voice Announcements | Speech synthesis for exercise names, round numbers, minute calls, and transitions | SHOULD HAVE |
| Exercise Info & Highlighting | Tap highlighted exercise names to see muscles targeted and technique descriptions | SHOULD HAVE |
| Workout Logging | Format-specific result capture after workout completion (rounds, time, etc.) | MUST HAVE |
| Personal Best Detection | Automatic comparison against previous attempts; PB badge display | SHOULD HAVE |
| Activity Streak Tracking | Track consecutive days/weeks of workout activity | NICE TO HAVE |
| Workout Customisation | Edit reps, exercises, and duration per workout; stored separately from original data | SHOULD HAVE |
| Difficulty Overrides | Per-workout difficulty rating adjustments | NICE TO HAVE |
| Favourites | Mark workouts as favourites; filter Library to favourites only | SHOULD HAVE |
| Outdoor Mode | High-contrast white-background theme for sunlight readability | MUST HAVE |
| Crash Recovery | Auto-save workout state every 15s; offer resume on reopen within 2 hours | MUST HAVE |
| Haptic Feedback | Vibration patterns for key workout events | NICE TO HAVE |
| Settings | User preferences for font size, audio, name, outdoor mode default | SHOULD HAVE |
| Offline Support (PWA) | Service Worker caching for full offline operation | MUST HAVE |
| Home Screen Install | PWA manifest for add-to-home-screen on iOS and Android | MUST HAVE |
| Wake Lock | Keep screen on during active workouts | SHOULD HAVE |
| Workout Sharing | Copy workout details to clipboard for sharing | NICE TO HAVE |

---

## 5. Functional Requirements

### FR-LIB: Workout Library
- FR-LIB-01: The app MUST display all workouts from `RAW_DATA` in a scrollable, searchable list
- FR-LIB-02: The app MUST support filtering by format (AMRAP, EMOM, Tabata, For Time, Rounds, Ladder, Deck of Cards, etc.)
- FR-LIB-03: The app MUST support filtering by equipment (Bodyweight, Dumbbell, Kettlebell, Mixed)
- FR-LIB-04: The app MUST support filtering by focus area
- FR-LIB-05: Each workout card MUST display name, format, equipment, duration, and difficulty rating
- FR-LIB-06: The app SHOULD support text search across workout names and movements

### FR-TMR: Timer System
- FR-TMR-01: The timer MUST auto-detect workout format from workout text via `detectBlockTimer()`
- FR-TMR-02: Countdown timer MUST count down from the specified duration (AMRAP, Deck of Cards)
- FR-TMR-03: EMOM timer MUST display current minute, total minutes, and preview next exercise in final 10 seconds
- FR-TMR-04: Tabata timer MUST alternate work/rest intervals with exercise rotation
- FR-TMR-05: Stopwatch timer MUST count up for For Time / Rounds formats, with optional time cap
- FR-TMR-06: Fight Gone Bad timer MUST manage station-based rounds
- FR-TMR-07: Death By timer MUST track escalating reps per minute
- FR-TMR-08: The timer MUST pause and resume without losing state
- FR-TMR-09: The timer MUST display remaining/elapsed time in a large, readable format

### FR-FSW: Full Screen Workout
- FR-FSW-01: The workout runner MUST display the current exercise/phase prominently
- FR-FSW-02: The runner MUST transition between warmup, workout, and core phases automatically
- FR-FSW-03: The runner MUST play audio cues at phase transitions
- FR-FSW-04: The runner MUST provide voice announcements for exercise names and key events (when voice is enabled)
- FR-FSW-05: The runner MUST keep the screen awake via Wake Lock API (when supported)
- FR-FSW-06: The runner MUST auto-save state every 15 seconds for crash recovery

### FR-LOG: Workout Logging
- FR-LOG-01: After workout completion, the app MUST present a log modal with format-appropriate fields
- FR-LOG-02: AMRAP logs MUST capture rounds and extra reps
- FR-LOG-03: For Time logs MUST capture completion minutes and seconds
- FR-LOG-04: Each log entry MUST record the workout ID, date, and duration
- FR-LOG-05: The app MUST persist logs to `localStorage` under `parkwod-logs`
- FR-LOG-06: The app SHOULD detect and flag personal bests by comparing against previous entries for the same workout

### FR-EXR: Exercise Info
- FR-EXR-01: Exercise names in workout text MUST be detected and highlighted (longest-match-first)
- FR-EXR-02: Tapping a highlighted exercise MUST open an info modal
- FR-EXR-03: The info modal MUST display exercise name, aliases, targeted muscles, and technique description

### FR-CUS: Customisation
- FR-CUS-01: Users MUST be able to edit reps, exercises, and duration for any workout
- FR-CUS-02: Customisations MUST be stored separately from original data (in `parkwod_customizations`)
- FR-CUS-03: Users MUST be able to reset a workout to its original state
- FR-CUS-04: Customised workouts MUST display a visual indicator that they have been modified

### FR-REC: Crash Recovery
- FR-REC-01: The app MUST auto-save workout state every 15 seconds during an active workout
- FR-REC-02: On app reopen, if recovery data exists and is less than 2 hours old, the app MUST offer to resume
- FR-REC-03: If the user declines recovery, the state MUST be cleared
- FR-REC-04: Recovery data MUST be stored in `parkwod:workout_recovery`

### FR-FAV: Favourites
- FR-FAV-01: Users MUST be able to toggle favourite status on any workout
- FR-FAV-02: Favourites MUST persist across sessions via `parkwod:favourites`
- FR-FAV-03: The Library SHOULD support a "favourites only" filter

### FR-SET: Settings
- FR-SET-01: Users MUST be able to adjust font size
- FR-SET-02: Users MUST be able to toggle audio cues on/off
- FR-SET-03: Users MUST be able to toggle voice announcements on/off
- FR-SET-04: Users MUST be able to set their name (displayed in the app)
- FR-SET-05: Users MUST be able to set outdoor mode as default
- FR-SET-06: All settings MUST persist via `parkwod:settings`

### FR-OUT: Outdoor Mode
- FR-OUT-01: Outdoor mode MUST switch to a high-contrast, white-background theme
- FR-OUT-02: Outdoor mode MUST be togglable during an active workout session
- FR-OUT-03: Outdoor mode MUST be settable as the default via Settings

---

## 6. Non-Functional Requirements

### Performance
- NFR-PERF-01: The app MUST load and be interactive within 3 seconds on a mid-range mobile device (4G connection for first load)
- NFR-PERF-02: Subsequent loads (cached via Service Worker) MUST be interactive within 1 second
- NFR-PERF-03: Timer updates MUST render at a consistent cadence with no visible lag or jank
- NFR-PERF-04: Scrolling through the full workout library MUST be smooth (no dropped frames)

### Reliability
- NFR-REL-01: The app MUST function fully offline after initial load
- NFR-REL-02: localStorage writes MUST NOT fail silently — if storage is full, the user SHOULD be notified
- NFR-REL-03: Timer accuracy MUST NOT drift more than 1 second over a 60-minute workout
- NFR-REL-04: Crash recovery MUST reliably restore workout state when valid recovery data exists

### Compatibility
- NFR-COMP-01: The app MUST work on iOS Safari 15+ and Android Chrome 90+
- NFR-COMP-02: The app MUST be installable as a PWA on both iOS and Android
- NFR-COMP-03: Features relying on optional APIs (Wake Lock, Vibration, Speech Synthesis) MUST degrade gracefully on unsupported browsers

### Accessibility
- NFR-ACC-01: All text MUST meet WCAG 2.1 AA contrast ratios in both dark and outdoor modes
- NFR-ACC-02: Font size MUST be user-adjustable
- NFR-ACC-03: Touch targets MUST be at least 44x44 CSS pixels

### Data Integrity
- NFR-DATA-01: Workout logs MUST NOT be lost due to app updates or code changes
- NFR-DATA-02: Customisations MUST be stored independently from source workout data
- NFR-DATA-03: The app SHOULD warn users if localStorage usage exceeds 80% of available quota

### Maintainability
- NFR-MAINT-01: The single-file architecture MUST remain navigable — sections clearly delineated with comments
- NFR-MAINT-02: The design system (`DS`) MUST be the single source of truth for colours, fonts, and spacing
- NFR-MAINT-03: All changes MUST be surgical — no unnecessary refactoring of surrounding code

---

## 7. Product Risks

### Usability Risks
| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| New users overwhelmed by 300+ workouts | Users abandon app before first workout | Medium | Strong defaults on Home screen: featured/recommended workouts, clear filters, "Quick Start" pathway |
| Exercise terminology unfamiliar to casual users | Users can't follow workout instructions | Medium | Exercise info highlighting with descriptions; consider adding difficulty-based filtering for beginners |
| Outdoor mode not enabled by default | Users struggle to read in sunlight, assume app is broken | Low | Clear onboarding prompt; auto-detect ambient light if API available in future |

### Technical Risks
| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Single-file grows beyond maintainable size | Increased regression risk, slower development | Medium | Strict containment rules; surgical edits only; consider module extraction if file exceeds ~500KB |
| localStorage data loss on cache clear | User loses all workout history and settings | Medium | Consider adding JSON export/import for backup; document the risk to users |
| Speech Synthesis inconsistency across devices | Voice coaching unreliable on some phones | High | Graceful degradation; fallback to audio beeps only; test on target devices |
| Service Worker serves stale app version | Users don't receive bug fixes or new features | Medium | Version-based cache busting; force refresh mechanism |

### Market/Adoption Risks
| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Competing apps with cloud sync and social features | Users prefer apps with cross-device sync | Medium | Lean into simplicity and privacy as differentiators — no account, no data collection, works offline |
| No onboarding or first-run experience | New users don't understand the app's capabilities | Medium | Welcome screen or guided first workout |
| No feedback channel | Users can't report bugs or request features | Low | Add a simple feedback link in Settings |
