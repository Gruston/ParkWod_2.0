// ═══════════════════════════════════════════════════════════════
// TIMER CORE — timestamp-based clock (pure functions, fully testable)
// ═══════════════════════════════════════════════════════════════
// The clock derives elapsed time from wall-clock timestamps instead of
// counting interval ticks. Mobile browsers throttle or suspend timers when
// the screen locks or the app is backgrounded — a tick-counting timer
// silently falls behind real time. A timestamp-based timer is always
// correct the moment it is next read.
//
// State shape: { startedAt, pausedAt, pausedTotal }
//   startedAt   — wall-clock ms when first started (null = never started)
//   pausedAt    — wall-clock ms when paused (null = not paused)
//   pausedTotal — accumulated ms spent paused

export function createTimerState() {
  return { startedAt: null, pausedAt: null, pausedTotal: 0 };
}

export function timerStart(state, now) {
  if (state.startedAt === null) return { startedAt: now, pausedAt: null, pausedTotal: 0 };
  if (state.pausedAt !== null) {
    return { ...state, pausedAt: null, pausedTotal: state.pausedTotal + (now - state.pausedAt) };
  }
  return state; // already running
}

export function timerPause(state, now) {
  if (state.startedAt === null || state.pausedAt !== null) return state;
  return { ...state, pausedAt: now };
}

export function timerIsRunning(state) {
  return state.startedAt !== null && state.pausedAt === null;
}

// Whole seconds elapsed, excluding paused time. Never negative.
export function computeElapsed(state, now) {
  if (state.startedAt === null) return 0;
  const end = state.pausedAt !== null ? state.pausedAt : now;
  return Math.max(0, Math.floor((end - state.startedAt - state.pausedTotal) / 1000));
}

// ── Boundary crossing ──
// After a clock jump (phone unlock), elapsed may advance many seconds in one
// update. Equality checks like `elapsed % 60 === 0` would skip the boundary.
// crossedBoundary answers: "does a boundary of the form offset + k*step
// (k >= 0) lie in the interval (prev, elapsed]?" — firing exactly once per
// crossing, and only once even when several boundaries were jumped over
// (events announce the CURRENT position, they don't replay history).
export function crossedBoundary(prev, elapsed, step, offset = 0) {
  if (elapsed <= prev || step <= 0 || elapsed < offset) return false;
  const lastBoundary = Math.floor((elapsed - offset) / step) * step + offset;
  return lastBoundary > prev;
}
