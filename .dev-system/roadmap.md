# ParkWod — Development Roadmap

## Current State

ParkWod is a **production application** with all MUST HAVE features already implemented. The app is functional, deployed, and in active use. This roadmap covers stabilisation, refinement, and future enhancements — not a greenfield build.

### Already Implemented (Baseline)

All of the following features exist in the current `index.html`:

| Feature | Priority | Status |
|---|---|---|
| Workout Library (300+ workouts, filtering) | MUST HAVE | Done |
| Format-Aware Timer (all formats) | MUST HAVE | Done |
| Full Screen Workout Execution | MUST HAVE | Done |
| Audio Cues (Web Audio) | MUST HAVE | Done |
| Workout Logging (format-specific) | MUST HAVE | Done |
| Outdoor Mode | MUST HAVE | Done |
| Crash Recovery (15s auto-save) | MUST HAVE | Done |
| Offline Support (Service Worker) | MUST HAVE | Done |
| Home Screen Install (PWA manifest) | MUST HAVE | Done |
| Voice Announcements (Speech Synthesis) | SHOULD HAVE | Done |
| Exercise Info & Highlighting | SHOULD HAVE | Done |
| Personal Best Detection | SHOULD HAVE | Done |
| Workout Customisation | SHOULD HAVE | Done |
| Favourites | SHOULD HAVE | Done |
| Settings (font, audio, name, outdoor) | SHOULD HAVE | Done |
| Wake Lock | SHOULD HAVE | Done |
| Activity Streak Tracking | NICE TO HAVE | Done |
| Difficulty Overrides | NICE TO HAVE | Done |
| Haptic Feedback (Vibration API) | NICE TO HAVE | Done |
| Workout Sharing (Clipboard) | NICE TO HAVE | Done |

### Roadmap Focus

This roadmap addresses:
1. **Architectural hardening** — stability, resilience, and maintainability improvements
2. **User experience refinements** — polishing existing features based on usage
3. **New feature development** — capabilities not yet in the app
4. **Operational improvements** — deployment, updates, and data safety

---

## Phase 1: Stability & Resilience Foundation

**Goal:** Harden the existing app against the top architectural risks identified in the architecture review. Build a stable base before adding new features.

### Features / Improvements

1. **React ErrorBoundary** — Add a top-level error boundary to prevent white-screen crashes
2. **localStorage Safety** — Add quota monitoring and user warning when storage exceeds 80%
3. **SRI Verification** — Verify/add Subresource Integrity hashes on all CDN `<script>` tags
4. **Graceful Degradation Audit** — Verify all optional Browser API usage (Wake Lock, Vibration, Speech Synthesis) degrades cleanly on unsupported browsers

### System Components Affected

- App Root (ErrorBoundary wrapper)
- Custom Hooks (localStorage quota checks)
- HTML head (SRI attributes on script tags)
- Audio System, FullScreenWorkout (API feature detection)

### Dependencies

- None — this phase has no prerequisites beyond the existing codebase

### Risks

- ErrorBoundary may catch errors that were previously silently swallowed, revealing latent bugs
- SRI hashes lock CDN versions — must update hashes when upgrading library versions
- localStorage quota APIs vary across browsers; detection may not be reliable on all targets

### Testing Requirements

- Verify ErrorBoundary catches a simulated component error and displays a recovery UI (not a white screen)
- Simulate localStorage quota exceeded and verify user warning appears
- Test with CDN scripts blocked (simulate offline first-load) — Service Worker should serve cached versions
- Test on iOS Safari and Android Chrome with Wake Lock / Vibration / Speech Synthesis disabled

### Definition of Done

- [ ] ErrorBoundary wraps the App root; a caught error displays a user-friendly fallback
- [ ] localStorage usage is checked on writes; warning shown if >80% quota used
- [ ] All CDN `<script>` tags have valid `integrity` and `crossorigin` attributes
- [ ] Each optional Browser API has explicit feature detection; app works fully without them

---

## Phase 2: Data Safety & Export

**Goal:** Protect users from data loss — the highest-impact user-facing risk in the current architecture.

### Features / Improvements

1. **Data Export** — JSON export of all user data (logs, settings, favourites, customisations, difficulty overrides)
2. **Data Import** — JSON import with validation and merge/overwrite options
3. **Export Prompt** — Periodic reminder to export data (e.g., every 30 days or 50 workouts)

### System Components Affected

- SettingsScreen (new Export/Import UI section)
- Custom Hooks (data serialisation/deserialisation utilities)
- Styles (new UI elements for export/import)

### Dependencies

- Phase 1 (localStorage safety) — quota monitoring informs export urgency

### Risks

- Import of malformed JSON could corrupt localStorage state — must validate thoroughly
- Large export files could exceed Clipboard API limits — use file download (`Blob` + `URL.createObjectURL`) instead
- Schema versioning: exported data from an older app version must still import into newer versions

### Testing Requirements

- Export all data → clear localStorage → import → verify all data restored correctly
- Import malformed JSON → verify graceful error with no data corruption
- Import data from a "previous version" (missing fields) → verify defaults applied correctly
- Test export file size with a heavy user profile (hundreds of logs)

### Definition of Done

- [ ] Settings screen has "Export Data" button that downloads a JSON file
- [ ] Settings screen has "Import Data" button that reads a JSON file and restores data
- [ ] Import validates JSON structure before writing to localStorage
- [ ] Import offers merge (add to existing) or replace (overwrite) options
- [ ] Export file includes a schema version identifier for forward compatibility

---

## Phase 3: Onboarding & First-Run Experience

**Goal:** Reduce drop-off for new users who don't know what the app does or how to start.

### Features / Improvements

1. **Welcome Flow** — Brief, skippable onboarding (3–4 screens) explaining key features
2. **Quick Start Suggestion** — On first visit, suggest a beginner-friendly bodyweight workout
3. **Feature Hints** — One-time tooltip hints on key interactions (exercise tap-to-info, outdoor mode toggle, favourites)

### System Components Affected

- App Root (welcome flow gate, using existing `parkwod:welcomed` flag)
- HomeScreen (quick start suggestion for new users)
- WorkoutDetail, FullScreenWorkout (one-time hint overlays)
- Styles (onboarding screen styles, hint tooltip styles)

### Dependencies

- None — can run in parallel with Phase 2

### Risks

- Onboarding adds UI complexity to an intentionally simple app — must keep it minimal and skippable
- Hint overlays during a workout could be distracting — only show before first workout start
- Welcome flow increases initial load-to-interaction time

### Testing Requirements

- Fresh app (no localStorage) → verify welcome flow appears
- Complete welcome flow → verify it does not reappear
- Skip welcome flow → verify `parkwod:welcomed` flag is set
- Verify quick start suggestion shows only for users with zero workout logs
- Verify each hint shows once and is dismissed permanently

### Definition of Done

- [ ] New users see a brief welcome flow on first launch (3–4 swipeable/tappable screens)
- [ ] Welcome flow is skippable at any point
- [ ] HomeScreen shows a "Start Here" suggestion for users with no workout history
- [ ] Key interactions have one-time hint tooltips (exercise highlighting, outdoor toggle)
- [ ] All hints use `localStorage` flags to ensure they appear only once

---

## Phase 4: Library & Discovery Enhancements

**Goal:** Make it easier for users to find the right workout, especially in a catalogue of 300+.

### Features / Improvements

1. **Text Search** — Search across workout names and movement lists
2. **Duration Filter** — Filter by workout length (e.g., <15 min, 15–30 min, 30+ min)
3. **"Workout of the Day"** — Deterministic daily recommendation (seeded by date, not random)
4. **Recently Completed** — Show recently logged workouts for quick re-access
5. **Injury/Exclusion Filter Enhancement** — Improve the `wm` movement-based exclusion filtering UX

### System Components Affected

- LibraryScreen (search bar, new filter controls, recently completed section)
- HomeScreen (Workout of the Day card)
- Data Layer (search index, date-seeded selection logic)
- Styles (search bar, filter chips, WOD card)

### Dependencies

- None — can run in parallel with Phase 3

### Risks

- Text search across 300+ workouts with movement lists may need optimisation for smooth typing experience
- "Workout of the Day" algorithm must avoid repeating too frequently and should cover all formats/equipment types over time
- Adding too many filters could clutter the Library screen on small phone screens

### Testing Requirements

- Search for exercise name → verify matching workouts appear
- Search for partial workout name → verify fuzzy/substring matching works
- Apply duration filter → verify only workouts within range shown
- Verify WOD changes daily but is deterministic (same date = same workout)
- Verify recently completed shows correct workouts in reverse chronological order
- Test filter combination: search + format + equipment + duration simultaneously

### Definition of Done

- [ ] Library has a search bar that filters by workout name and movement names
- [ ] Duration filter available with sensible brackets
- [ ] HomeScreen displays a "Workout of the Day" that changes daily (deterministic)
- [ ] HomeScreen or Library shows recently completed workouts (last 5)
- [ ] All filters can be combined and reset independently

---

## Phase 5: Workout Experience Polish

**Goal:** Refine the core workout execution experience based on the existing feature set.

### Features / Improvements

1. **Pre-Workout Preview** — Visual summary of phases, timing, and exercises before starting
2. **Mid-Workout Exercise Info** — Ability to tap exercise names during FullScreenWorkout (not just on detail screen)
3. **Rest Period Enhancements** — Show next exercise and rep count during rest phases
4. **Completion Summary** — Enhanced post-workout screen with stats comparison, PB celebration, and share prompt
5. **Timer Sound Customisation** — Allow users to choose between different beep/tone styles

### System Components Affected

- WorkoutDetail (pre-workout preview panel)
- FullScreenWorkout (exercise info during workout, rest period display, completion summary)
- Audio System (multiple tone profiles)
- LogWorkoutModal (enhanced completion summary)
- SettingsScreen (tone style preference)
- Styles (preview panel, completion summary, tone selector)

### Dependencies

- Phase 1 (stability foundation) — must be complete before modifying FullScreenWorkout

### Risks

- Adding interactivity during FullScreenWorkout (exercise info tap) could interfere with timer controls
- More complex completion summary increases the code within the already-large FullScreenWorkout component
- Additional audio options increase the Audio System complexity

### Testing Requirements

- Pre-workout preview accurately reflects parsed block structure for each format type
- Exercise info modal during workout does not pause or disrupt the timer
- Rest period shows correct "next exercise" for EMOM, Tabata, and similar formats
- Completion summary correctly identifies PBs and shows comparison data
- Each tone style plays correctly on iOS Safari and Android Chrome

### Definition of Done

- [ ] WorkoutDetail shows a visual phase breakdown before starting
- [ ] Exercise names are tappable during FullScreenWorkout, opening the info modal without disrupting the timer
- [ ] Rest phases display the upcoming exercise and rep count
- [ ] Post-workout completion screen shows result, PB status, and comparison to last attempt
- [ ] Settings includes a tone style selector with at least 3 options

---

## Phase 6: Operational Improvements

**Goal:** Improve the deployment and update experience for both the developer and users.

### Features / Improvements

1. **Service Worker Cache Versioning** — Ensure app updates are delivered reliably
2. **Update Notification** — Show "New version available — tap to refresh" when Service Worker detects an update
3. **App Version Display** — Show current version in Settings for debugging and support
4. **Content-Security-Policy** — Add CSP meta tag to restrict script sources

### System Components Affected

- `sw.js` (versioned caching strategy, update detection)
- App Root (update notification banner)
- SettingsScreen (version display)
- HTML head (CSP meta tag)

### Dependencies

- Phase 1 (SRI verification) — CSP builds on the security foundation

### Risks

- Aggressive Service Worker caching could prevent updates from reaching users
- Update notification UX must not be intrusive during an active workout
- CSP misconfiguration could break Babel Standalone (`'unsafe-eval'` is required)

### Testing Requirements

- Deploy a new version → verify Service Worker detects the update
- Update notification appears → tap to refresh → verify new version loads
- Verify CSP does not block React, ReactDOM, Babel, or Google Fonts
- Verify `'unsafe-eval'` is included in CSP for Babel compatibility
- Version number in Settings matches the deployed version

### Definition of Done

- [ ] Service Worker uses version-based cache names; old caches are cleaned up on activate
- [ ] When a new Service Worker is waiting, a non-intrusive banner prompts the user to refresh
- [ ] Settings screen displays the current app version
- [ ] A Content-Security-Policy meta tag is present and tested

---

## Integration Checkpoints

| After Phase | Checkpoint | Gate |
|---|---|---|
| Phase 1 | Stability audit — all resilience improvements verified on iOS Safari + Android Chrome | PASS / FAIL |
| Phase 2 | Data round-trip — export → clear → import → full data integrity verified | PASS / FAIL |
| Phase 3 | New user walkthrough — fresh install tested end-to-end with onboarding | PASS / FAIL |
| Phase 4 | Library stress test — all filter combinations tested with full 300+ workout catalogue | PASS / FAIL |
| Phase 5 | Full workout cycle — discover → preview → execute → log → review on both platforms | PASS / FAIL |
| Phase 6 | Update cycle — deploy new version, verify Service Worker update flow, verify CSP | PASS / FAIL |

---

## Risk Mitigation Plan

| Risk | Phase | Mitigation | Owner |
|---|---|---|---|
| White-screen crash from unhandled error | Phase 1 | React ErrorBoundary with recovery UI | Architect |
| Data loss on cache clear | Phase 2 | JSON export/import; periodic reminder | Product Manager |
| New user drop-off | Phase 3 | Onboarding flow; quick start suggestion | Product Manager |
| User overwhelmed by 300+ workouts | Phase 4 | Search, smarter filtering, WOD, recents | Product Manager |
| Speech Synthesis unreliable on iOS | Phase 5 | Graceful degradation; audio-only fallback tested | QA Engineer |
| Users stuck on stale app version | Phase 6 | Service Worker versioning; update notification | Architect |
| Single-file exceeds 500KB | All Phases | Track file size after each phase; flag if >450KB | CTO |
| localStorage quota exceeded | Phase 2 | Quota monitoring (Phase 1) + export capability | Architect |

---

## Parallelism

```
Phase 1: Stability & Resilience ─────────────────┐
                                                   │
Phase 2: Data Safety & Export ────────────────┐    │
                                               │    │
Phase 3: Onboarding ──────────────────────┐   │    │
         (parallel with Phase 2)           │   │    │
                                           │   │    │
Phase 4: Library Enhancements ────────┐   │   │    │
         (parallel with Phase 3)       │   │   │    │
                                       ▼   ▼   ▼    ▼
Phase 5: Workout Experience Polish ──────────────────── (requires Phase 1)
                                       │
Phase 6: Operational Improvements ─────┘ (requires Phase 1)
         (parallel with Phase 5)
```

- **Phases 2 & 3** can run in parallel (no shared components)
- **Phases 3 & 4** can run in parallel (minimal overlap — Home screen has separate sections)
- **Phase 5** depends on Phase 1 (modifies FullScreenWorkout, needs ErrorBoundary in place)
- **Phase 6** depends on Phase 1 (CSP builds on SRI work) and can run parallel with Phase 5

---

## Summary Table

| Phase | Features | Dependencies | Definition of Done |
|---|---|---|---|
| **1. Stability & Resilience** | ErrorBoundary, localStorage safety, SRI, API degradation audit | None | App recovers from errors gracefully; storage warnings work; SRI on all CDN scripts |
| **2. Data Safety & Export** | JSON export/import, export reminder | Phase 1 | Full data round-trip (export → clear → import) verified; schema version in export |
| **3. Onboarding** | Welcome flow, quick start, feature hints | None (parallel with Phase 2) | New user sees onboarding; hints appear once; all dismissible and persistent |
| **4. Library Enhancements** | Text search, duration filter, WOD, recents, exclusion UX | None (parallel with Phase 3) | Search works across names+movements; all filters combinable; WOD is deterministic |
| **5. Workout Polish** | Pre-workout preview, mid-workout exercise info, rest enhancements, completion summary, tone options | Phase 1 | Full workout cycle works end-to-end with all enhancements on both platforms |
| **6. Operational** | SW versioning, update notification, version display, CSP | Phase 1 | New version detected and prompted; CSP active and tested; version shown in Settings |
