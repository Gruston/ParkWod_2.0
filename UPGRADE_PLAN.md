# PARK WOD 3.0 — Upgrade Plan

Status: **awaiting Greg's approval** (design confirmed decisions below; no implementation until approved)

## Confirmed decisions (June 2026)
- **Build step: YES** — esbuild + tests on the PC; GitHub Pages still serves plain static files; phone experience unchanged.
- **Structured workout data: YES** — convert all 208 workouts from prose-parsing to explicit block structure.
- **Priority: reliability first**, features after.
- **Features chosen:** automatic backup, progress stats, smarter voice coaching. (Workout builder: not in this upgrade.)

## Data preservation guarantee (non-negotiable)

Greg has live workout history on his phone. That data must survive every phase. Rules:

1. **Backup before anything ships.** Before the first Phase 0 deploy, Greg exports his data from the phone (Settings → Export) and sends the JSON file off-device (e.g. email to self). No deploy happens until this is confirmed done.
2. **localStorage is origin-bound, not version-bound.** Deploying new code never touches stored data by itself. The app URL/origin must not change during this upgrade — same repo, same GitHub Pages address.
3. **Migrations never destroy the original.** Phase 3's schema change reads old keys, writes new ones, and keeps the old keys intact until the new format is verified on Greg's phone. An automatic pre-migration export is offered on first launch of the migrated version.
4. **Every deploy-carrying phase includes the acceptance line:** "open History — all previous workouts still there."
5. **A failed deploy can't erase data.** White screens, SW faults, and syntax errors leave localStorage untouched; the error-recovery work in Phase 3 makes this visible rather than silent.

## Design faults being fixed
1. Timer counts ticks (`setInterval +1s`) — drifts/pauses under mobile throttling. → Timestamp-based clock, resync on visibilitychange.
2. Cache-first service worker for index.html — requires manual CACHE_NAME bumps, no update notification. → Network-first for app code, update toast, fonts pre-cached.
3. Babel Standalone transpiles 420KB JSX on-device every launch; a syntax error ships a blank app. → Pre-built with esbuild.
4. No error boundary / global error handler — crashes white-screen mid-workout. → Error boundary + recovery overlay wired to existing crash-recovery state.
5. Silent localStorage failures, no schema versioning, no eviction protection. → Versioned storage layer, visible quota warnings, `navigator.storage.persist()`, monthly backup prompt.
6. Free-text workout data forces a guessing parser (~450 lines of special cases) — root cause of the format/voice/timer bug class. → Explicit block structure per workout; parser demoted to fallback for user-customised text.
7. Single 4,300-line file — untestable, every edit risks the whole app. → Modules + regression tests for timer/blocks/voice.

Minor: re-enable pinch zoom (`user-scalable=no` removed), bundle React (no CDN dependency on first load), fix stale `version:"v8"` in export payload.

## Target layout
```
src/
  data/workouts.js      # 208 workouts with explicit block structure
  data/exercises.js     # exercise encyclopedia
  engine/timer.js       # timestamp-based clock
  engine/blocks.js      # block execution (reads declared structure)
  engine/voice.js       # speech + notation normalisation
  components/           # screens, timer displays, modals
tests/                  # node test runner; timer, blocks, voice regression suites
tools/                  # audit-workouts.mjs, test-timers.mjs (kept)
index.html + app.js     # built output — what GitHub Pages serves
```
Build: `npm run build` (esbuild). Deploy: build, commit, push — unchanged for the phone.

## Phases (strict order; each ends with a commit + ≤10-min acceptance check)

### Phase 0 — Split and build (no behaviour change)
**Pre-step: Greg exports his workout data from the phone and stores the JSON off-device. Gate: no deploy until confirmed.**
Move code into modules, add esbuild + test scaffold. Zero logic changes. Verified by driving the app before/after in the browser.
**Acceptance:** app looks and behaves identically; History shows all previous workouts.

### Phase 1 — Timestamp timers
`useTimer` derives elapsed from `Date.now() − startedAt − pausedTotal`; interval only triggers re-render; resync on `visibilitychange`; sane catch-up for missed beeps/announcements on wake. Clock-jump tests.
**Acceptance:** lock phone ~1 min mid-workout; timer correct on unlock.

### Phase 2 — Self-updating service worker
Network-first (cache fallback) for HTML/app.js; cache-first for fonts/icons; fonts pre-cached; "Updated — tap to reload" toast. No more manual cache bumps.
**Acceptance:** deployed change appears on next open without intervention.

### Phase 3 — Error recovery + safe storage + auto-backup
Error boundary + global error overlay ("Resume workout" via existing recovery state). Versioned storage schema `{v, data}` with migration hook; **migration reads old keys, writes new, retains old keys until verified on Greg's phone; pre-migration export offered on first launch**. Quota failures surfaced. `navigator.storage.persist()` requested (protects against browser eviction). Monthly backup prompt with one-tap share-sheet export.
**Acceptance:** History shows all previous workouts after migration; logs survive reload/navigation; forced error shows recovery screen, resume works.

### Phase 4 — Structured workout data
Block schema (indicative): `{ kind: "amrap"|"emom"|"tabata"|"interval"|"fortime"|"rounds"|"stopwatch", minutes?, work?, rest?, rounds?, exercises: [{name, reps?, note?}], raw }` — warmup/core included as blocks. Auto-convert all 208 via the existing parser; audit-diff every workout; Claude reviews all diffs; Greg spot-checks known problem workouts (44, 93, 17, 166 + choice). Timers and voice read structure, never prose.
**Acceptance:** spot-check workouts show correct phases, timers, voice.

### Phase 5 — Features (each gets its own plain-language UX confirmation before build)
- **Progress stats:** stats view from History — streaks, sessions/week chart, PBs, format/focus breakdown.
- **Smarter voice coaching:** halfway/final-minute calls, wider next-exercise previews, round announcements; per-feature settings toggles.

## Future feature ideas (not in this upgrade — for Greg to consider later)

Roughly ordered by how well they fit the app's purpose. None are committed; each would get its own plain-language UX design and approval before any build.

**Small (a session or two each)**
- **Daily suggested WOD** — home screen picks a workout each day based on recent history (rotates focus, respects equipment), so you open the app and go rather than browse.
- **Exercise substitution** — tap any exercise mid-workout and get 2–3 alternatives targeting the same muscles (the exercise encyclopedia already knows muscles); useful for injuries, no pull-up bar, etc.
- **Share result card** — after logging, generate a clean image (workout, time/rounds, PB flag) for the share sheet.
- **Achievement milestones** — streak and count badges (25/50/100 workouts, 10-week streak) surfaced on the stats screen.
- **CSV export** — download history as a spreadsheet for your own analysis alongside the JSON backup.

**Medium (multiple sessions)**
- **Workout builder** — create your own workouts in-app using the Phase 4 structured format (deferred from this upgrade; much easier once Phase 4 exists).
- **Standalone timer mode** — use the EMOM/Tabata/AMRAP timers without picking a library workout; you set work/rest/rounds directly.
- **Weekly programming** — a simple plan layer ("3 sessions/week: legs, upper, engine") that queues suggested workouts and tracks adherence.
- **Injury-aware filtering upgrade** — the `wm` movement data already supports exclusions; extend to auto-substitute excluded movements instead of hiding whole workouts.

**Large (its own project phase)**
- **Cloud sync via Supabase** — accounts + synced history across devices, and true off-device backup (the strongest possible answer to data-loss risk; same stack as StockPot so the pattern is familiar). Changes the app from local-only to online-optional — a deliberate architecture decision to make only if multi-device or shared use matters.
- **Household mode** — two profiles (e.g. Greg + Julie) with separate logs/PBs on the same device or synced; depends on cloud sync.

## Risk register
| Risk | Mitigation |
|---|---|
| Phase 0 transcription errors while moving 4,300 lines | No logic edits; browser-driven before/after verification; single reviewable commit |
| Phase 4 conversion mistakes | Parser is test-covered first (Phase 0); audit diff on all 208; manual review + Greg spot-check |
| SW change strands old clients | Keep one final CACHE_NAME bump in the transition release so existing installs pick up the new SW |
| localStorage schema migration bugs | Old keys retained until new format verified on Greg's phone; pre-migration export offered; off-device backup taken before Phase 0 |
| Greg's live workout history lost | Data preservation guarantee section: backup gate before first deploy, origin unchanged, "History intact" acceptance line on every deploy-carrying phase |
