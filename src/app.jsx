import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { CATEGORY_PATTERNS, EXERCISE_INFO } from "./data/exercises.js";
import { RAW_DATA, DIFFICULTY_COLORS, EQUIPMENT_ICONS, ALL_EQUIPMENT, ALL_RATINGS, ALL_FORMATS, ALL_FOCUSES, ALL_MOVEMENTS, ALL_WORKOUT_MOVEMENTS } from "./data/workouts.js";
import { VOICE_ABBREVIATIONS, normaliseNotation, expandAbbreviations, speakText, cancelSpeech, speakDuration } from "./engine/voice.js";
import { parseBlocks, detectBlockTimer } from "./engine/blocks.js";
import { createTimerState, timerStart, timerPause, timerIsRunning, computeElapsed, crossedBoundary } from "./engine/timer.js";
import { loadData, saveData, removeData, migrateIfNeeded, buildBackup, LEGACY_KEYS } from "./engine/storage.js";
import { WORKOUT_BLOCKS } from "./data/blocks.js";
import { compileWorkout, validateDraft, newDraft, newBlock, draftFromWorkout, BLOCK_KINDS, KIND_FIELDS } from "./engine/builder.js";

// ── Custom workouts registry ──
// Module-level cache kept in sync by useMyWorkouts (single instance in App)
// so plain helpers like findWorkout stay correct outside React state flow.
let CUSTOM_WORKOUTS = [];
function getAllWorkouts() { return CUSTOM_WORKOUTS.length ? [...RAW_DATA, ...CUSTOM_WORKOUTS] : RAW_DATA; }
function findWorkout(id) { return RAW_DATA.find(w => w.id === id) || CUSTOM_WORKOUTS.find(w => w.id === id); }

function useMyWorkouts() {
  const [myWorkouts, setMyWorkouts] = useState(() => {
    const m = loadData("myWorkouts", []);
    CUSTOM_WORKOUTS = Array.isArray(m) ? m : [];
    return CUSTOM_WORKOUTS;
  });
  const persist = useCallback((list) => { CUSTOM_WORKOUTS = list; setMyWorkouts(list); saveData("myWorkouts", list); }, []);
  const saveWorkout = useCallback((draft, existingId) => {
    const list = Array.isArray(loadData("myWorkouts", [])) ? loadData("myWorkouts", []) : [];
    const id = existingId || ("c" + (Math.max(0, ...list.map(w => parseInt(String(w.id).slice(1), 10) || 0)) + 1));
    const compiled = compileWorkout(draft, id);
    persist(existingId ? list.map(w => (w.id === existingId ? compiled : w)) : [...list, compiled]);
    return compiled;
  }, [persist]);
  const deleteWorkout = useCallback((id) => {
    const list = Array.isArray(loadData("myWorkouts", [])) ? loadData("myWorkouts", []) : [];
    persist(list.filter(w => w.id !== id));
  }, [persist]);
  return { myWorkouts, saveWorkout, deleteWorkout };
}

// Declared structure wins: custom workouts carry their blocks inline; library
// workouts use the stored, reviewed blocks. Live parsing only for
// user-customised text.
function getWorkoutBlocks(workout, field, liveText) {
  if (workout.custom && workout.blocks && workout.blocks[field] && liveText === workout[field]) return workout.blocks[field];
  const stored = WORKOUT_BLOCKS[workout.id];
  if (stored && stored[field] && liveText === workout[field]) return stored[field];
  return parseBlocks(liveText);
}

    const { useState, useMemo, useCallback, useEffect, useRef } = React;

// ═══════════════════════════════════════════════════════════════
// DESIGN SYSTEM — Colors, Typography, Icons
// ═══════════════════════════════════════════════════════════════
const DS = {
  font: { display: "'Bebas Neue', sans-serif", body: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  colors: {
    bg: "#0a0a0f", surface: "#12121e", surfaceLight: "#1a1a2e", border: "#1e1e30",
    orange: "#ff8a3a", orangeDark: "#e8722a", green: "#3ddc84", greenDark: "#2bb86a",
    greenBright: "#4ade80", greenNeon: "#39ff14",
    purple: "#8b5cf6", red: "#ef4444", blue: "#3b82f6", yellow: "#eab308",
    text: "#ffffff", textSub: "#94a3b8", textMuted: "#64748b",
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 100 },
  gradient: {
    orange: "linear-gradient(135deg, #ff8a3a, #e8722a)",
    orangeVibrant: "linear-gradient(135deg, #ff944d, #ff6b1a)",
    green: "linear-gradient(135deg, #3ddc84, #2bb86a)",
    greenBright: "linear-gradient(135deg, #4ade80, #3ddc84)",
    greenNeon: "linear-gradient(135deg, #4ade80, #3ddc84)",
    purple: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    surface: "linear-gradient(135deg, #1a1a2e, #12121e)",
    dark: "linear-gradient(180deg, #12121e, #0a0a0f)",
    card: "linear-gradient(135deg, #181828 0%, #12121e 100%)",
  },
};

// SVG Icon components — replaces emojis with crisp vector icons
const Icon = ({ name, size = 20, color = "currentColor", strokeWidth = 2 }) => {
  const icons = {
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    library: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
    history: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    dice: <><rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>,
    play: <><polygon points="5 3 19 12 5 21 5 3"/></>,
    pause: <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
    skipForward: <><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></>,
    skipBack: <><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    fire: <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    trophy: <><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></>,
    dumbbell: <><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M14.5 6.5a1 1 0 011-1h1a1 1 0 011 1v11a1 1 0 01-1 1h-1a1 1 0 01-1-1z"/><path d="M6.5 6.5a1 1 0 00-1-1h-1a1 1 0 00-1 1v11a1 1 0 001 1h1a1 1 0 001-1z"/><path d="M18.5 8.5h1a1 1 0 011 1v5a1 1 0 01-1 1h-1"/><path d="M5.5 8.5h-1a1 1 0 00-1 1v5a1 1 0 001 1h-1"/></>,
    zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    chevronRight: <><polyline points="9 18 15 12 9 6"/></>,
    chevronLeft: <><polyline points="15 18 9 12 15 6"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    heart: <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    moon: <><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></>,
    volume2: <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/></>,
    volumeX: <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>,
    mic: <><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
    rotateCcw: <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></>,
    checkCircle: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    award: <><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    menu: <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    activity: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    trendingUp: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    barChart: <><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    save: <><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
    clipboard: <><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
    refresh: <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    // Workout-specific icons
    kettlebell: <><circle cx="12" cy="8" r="4" fill="none"/><path d="M9.5 12L8 20h8l-1.5-8"/><path d="M10 20h4"/></>,
    bodyweight: <><circle cx="12" cy="5" r="2"/><path d="M12 7v6"/><path d="M8 21l4-8 4 8"/><path d="M6 13h12"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
  };
  const paths = icons[name];
  if (!paths) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0}}>
      {paths}
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════
// APP SETTINGS — font size, voice, outdoor mode, audio default
// ═══════════════════════════════════════════════════════════════
const FONT_SIZES = {
  small: { label: "Small", base: 14, timer: 58, exercise: 16, sample: "Compact view" },
  normal: { label: "Normal", base: 16, timer: 64, exercise: 20, sample: "Default size" },
  large: { label: "Large", base: 20, timer: 72, exercise: 24, sample: "Easier to read" },
  xlarge: { label: "X-Large", base: 24, timer: 80, exercise: 28, sample: "Low vision friendly" },
  xxlarge: { label: "XXL", base: 28, timer: 90, exercise: 32, sample: "Maximum readability" },
};
const DEFAULT_SETTINGS = { fontSize: "normal", voiceEnabled: false, outdoorMode: false, audioDefault: true, displayName: "", voiceHalfway: true, voiceFinalMinute: true, voiceNextPreview: true };

function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...loadData("settings", {}) };
}
function persistSettings(s) {
  saveData("settings", s);
}

function useSettings() {
  const [settings, setSettingsState] = useState(() => loadSettings());
  const update = useCallback((patch) => {
    setSettingsState(prev => { const next = { ...prev, ...patch }; persistSettings(next); return next; });
  }, []);
  return { settings, update };
}

// ═══════════════════════════════════════════════════════════════
// WORKOUT CRASH RECOVERY — auto-save during active workout
// ═══════════════════════════════════════════════════════════════
const RECOVERY_KEY = "parkwod:workout_recovery";

function saveWorkoutState(state) {
  try { localStorage.setItem(RECOVERY_KEY, JSON.stringify({ ...state, savedAt: Date.now() })); } catch(e) {}
}
function loadWorkoutRecovery() {
  try {
    const raw = localStorage.getItem(RECOVERY_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Only recover if saved within last 2 hours
    if (Date.now() - data.savedAt > 2 * 60 * 60 * 1000) { clearWorkoutRecovery(); return null; }
    return data;
  } catch { return null; }
}
function clearWorkoutRecovery() {
  try { localStorage.removeItem(RECOVERY_KEY); } catch(e) {}
}

// ═══════════════════════════════════════════════════════════════
// FAVOURITES — simple set of workout IDs
// ═══════════════════════════════════════════════════════════════
function loadFavourites() {
  const f = loadData("favourites", []);
  return Array.isArray(f) ? f : [];
}
function saveFavourites(favs) {
  saveData("favourites", favs);
}
function useFavourites() {
  const [favs, setFavs] = useState(() => loadFavourites());
  const toggle = useCallback((id) => {
    setFavs(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      saveFavourites(next);
      return next;
    });
  }, []);
  return { favs, toggle, isFav: useCallback((id) => favs.includes(id), [favs]) };
}

// ═══════════════════════════════════════════════════════════════
// WORKOUT LOG STORAGE — persistent via window.storage
// ═══════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════
// WORKOUT CUSTOMIZATION STORAGE  
// ═══════════════════════════════════════════════════════════════
function getStoredCustomizations() {
  const parsed = loadData("customizations", {});
  return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
}

function saveCustomization(workoutId, field, value) {
  const data = getStoredCustomizations();
  const id = String(workoutId);
  if (!data[id]) data[id] = {};
  data[id][field] = value;
  return saveData("customizations", data);
}

function getCustomization(workoutId, field, defaultValue) {
  const data = getStoredCustomizations();
  const id = String(workoutId);
  return (data[id] && data[id][field] !== undefined) ? data[id][field] : defaultValue;
}

function clearCustomization(workoutId, field) {
  const data = getStoredCustomizations();
  const id = String(workoutId);
  if (!data[id]) return;
  delete data[id][field];
  if (Object.keys(data[id]).length === 0) delete data[id];
  saveData("customizations", data);
}

async function loadLogs() {
  const l = loadData("logs", []);
  return Array.isArray(l) ? l : [];
}
async function saveLogs(logs) {
  saveData("logs", logs);
}
async function loadDiffOverrides() {
  const ov = loadData("diffOverrides", {});
  return (typeof ov === 'object' && ov !== null) ? ov : {};
}
async function saveDiffOverrides(ov) {
  saveData("diffOverrides", ov);
}

function useWorkoutLogs() {
  const [logs, setLogs] = useState([]);
  const [diffOverrides, setDiffOverrides] = useState({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    (async () => {
      const [l, d] = await Promise.all([loadLogs(), loadDiffOverrides()]);
      setLogs(l); setDiffOverrides(d); setLoaded(true);
    })();
  }, []);
  const addLog = useCallback(async (entry) => {
    const nl = [entry, ...logs]; setLogs(nl); await saveLogs(nl);
  }, [logs]);
  const updateLog = useCallback(async (logId, updates) => {
    const nl = logs.map(l => l.id === logId ? { ...l, ...updates } : l); setLogs(nl); await saveLogs(nl);
  }, [logs]);
  const deleteLog = useCallback(async (logId) => {
    const nl = logs.filter(l => l.id !== logId); setLogs(nl); await saveLogs(nl);
  }, [logs]);
  const setDiffOverride = useCallback(async (workoutId, rating) => {
    const nv = { ...diffOverrides, [workoutId]: rating }; setDiffOverrides(nv); await saveDiffOverrides(nv);
  }, [diffOverrides]);
  return { logs, loaded, addLog, updateLog, deleteLog, diffOverrides, setDiffOverride };
}

function getResultFields(format) {
  const f = (format || "").toUpperCase();
  if (f === "AMRAP") return { type: "amrap", label: "Rounds + Extra Reps" };
  if (f === "FOR TIME" || f === "CHIPPER") return { type: "fortime", label: "Completion Time" };
  if (f === "LADDER" || f === "INTERVAL PYRAMID") return { type: "ladder", label: "Ladder Progress" };
  if (f === "FIGHT GONE BAD" || f === "TABATA") return { type: "reps", label: "Total Reps" };
  if (f === "EMOM" || f === "DEATH BY EMOM") return { type: "emom", label: "Rounds Completed" };
  if (f === "DECK OF CARDS") return { type: "cards", label: "Cards Completed" };
  if (f === "ROUNDS" || f === "SUPERSETS" || f === "GRIND" || f === "ACCUMULATOR" || f === "RUNNING CLOCK") return { type: "rounds", label: "Rounds/Sets Completed" };
  return { type: "general", label: "Result" };
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

// ═══════════════════════════════════════════════════════════════
// HELPER: Highlight exercises in text
// ═══════════════════════════════════════════════════════════════
function HighlightedText({ text, onExerciseTap }) {
  const parts = useMemo(() => {
    const exercisePatterns = Object.keys(EXERCISE_INFO).map(key => {
      const info = EXERCISE_INFO[key];
      const names = [info.name.toLowerCase()];
      if (info.aka) info.aka.split(",").forEach(a => { if (a.trim()) names.push(a.trim().toLowerCase()); });
      // Add common text variants
      const variants = {
        "squats": ["sq ", "sq,", "goblet sq", "prisoner sq", "db sq", "db squats", "kb squat", "kb squats", "weighted squat", "weighted sq", "tempo sq", "tempo squat", "in and out squat", "in and out sq"],
        "push-ups": ["push-up", "push up", "pushup", "tri-cep push", "y push-up", "y pushup", "triple push-up", "triple pushup", "inverted pushup", "inverted push-up"],
        "rows": ["pull-up row", "pullup row", "pull up row", "db rows", "kb rows", "kettlebell rows", "kettlebell row", "dumbbell rows", "dumbbell row", "bar rows", "bar row"],
        "renegade rows": ["renegade row", "plank row", "plank rows"],
        "bent-over row": ["bent over row", "bentover row", "bent-over row", "db bent-over row", "kb bent-over row", "bent over rows", "bentover rows"],
        "kb swings": ["kb swing", "kettle bell swing", "kettlebell swing"],
        "shoulder press": ["db press", "strict press", "strict-press", "push press", "push-press", "kb push press", "db shoulder press", "clean & press", "arnold press", "db arnold", "arnold curl to press"],
        "curls": ["bicep curl", "hammer curl", "db curl"],
        "triceps": ["skull crush", "skull crusher", "skullcrusher", "skull crushers", "tri-cep skullcrusher", "kb skull crusher", "tricep ext", "tri-cep kick"],
        "lunges": ["walking lunge", "jump lunge", "rev lunge", "reverse lunge", "db lunge", "dumbbell lunge", "lizard lunge"],
        "burpees": ["burpee"],
        "box jumps": ["box jump", "double box jump"],
        "thrusters": ["thruster", "db thruster", "kb thruster"],
        "deadlifts": ["deadlift", "romanian deadlift", "rdl", "db deadlift", "dead lift", "kb deadlift"],
        "running": ["100m", "200m", "400m", "800m", "lap ", "laps", "sprint", "suicide", "jog"],
        "high knees": ["high knee", "high-knees", "high-knee", "highknee"],
        "dips": ["dip,", "dip "],
        "mountain climbers": ["mountain climber", "mtn climber"],
        "cross body mountain climbers": ["cross body mountain", "cross-body mountain", "cross body climber", "cross-body climber"],
        "sit-ups": ["situp", "sit-up", "sit up"],
        "sit-up overhead reach": ["sit-up w overhead", "situp overhead", "situp with overhead", "sit-up with overhead"],
        "crunches": ["crunch", "cycle crunch", "bicycle crunch", "2 punch crunch", "2-punch crunch", "rev crunch", "reverse crunch"],
        "ankle touches": ["ankle touch", "ankle tap", "ankle taps"],
        "hollow holds": ["hollow hold", "hollow body"],
        "planks": ["plank", "side plank", "copenhagen plank", "plank-up", "plank up", "plank toe touch", "plank jack", "plank pull through", "shoulder tap"],
        "shoulder press push-up": ["pike push-up", "pike push up", "pike press", "shoulder push-up", "shoulder press pushup", "shoulder-press pushup"],
        "shoulder tap push-up": ["shoulder tap push up", "shoulder-tap push up", "shoulder tap pushup"],
        "jump squats": ["jump squat", "jump sq", "squat jump", "squat to jump"],
        "knee drive lunge": ["knee drive lunge", "lunge to knee drive", "lunge w knee drive", "knee drive"],
        "forearm raise": ["kb front raise", "front raise", "forearm raises"],
        "lunge curls": ["lunge curl", "lunge to curl"],
        "frog jumps": ["frog jump", "frog leap"],
        "pogo jumps": ["pogo jump", "pogo hop"],
        "lateral hops": ["lateral hop", "lateral hops over"],
        "wall sit": ["wall squat"],
        "lateral raise": ["db lateral raise", "side raise"],
        "superman": ["supermans", "back extension"],
        "side bend": ["db side bend", "lateral bend"],
        "skipping": ["skip", "50 skips", "40 skips", "30 skips", "60 skips", "jump rope"],
        "step-ups": ["step-up", "step up", "stepup"],
        "cleans": ["clean &", "clean and", "kb clean"],
        "snatches": ["snatch", "one arm snatch"],
        "bear crawls": ["bear crawl"],
        "inchworms": ["inch worm", "inchworm", "walk-out"],
        "high pulls": ["high pull", "high-pull", "high-pulls", "kb high pull", "kb high-pull", "kb highpull"],
        "kb halos": ["kb halo", "halo"],
        "jumping": ["tuck jump"],
        "v-ups": ["v-up", "v up"],
        "russian twists": ["russian twist"],
        "flutter kicks": ["flutter kick", "flutter"],
        "leg raises": ["leg raise"],
        "glute bridges": ["glute bridge", "hip bridge"],
        "skaters": ["skater"],
        "jumping jacks": ["jumping jack", "star jump", "seal jump"],
        "bear complex": ["bear complex"],
        "broad jumps": ["broad jump", "long jump"],
        "bulgarian split squats": ["bulgarian split"],
        "copenhagen planks": ["copenhagen plank", "copenhagen"],
        "dead hangs": ["deadhang", "dead hang"],
        "gorilla rows": ["gorilla row", "kb gorilla"],
        "hollow body rocks": ["hollow body rock", "hollow rock"],
        "kb around the world": ["kb around", "around the world"],
        "kb windmills": ["kb windmill", "windmill"],
        "lateral broad jumps": ["lateral broad jump", "lateral broad"],
        "lateral lunges": ["lateral lunge", "side lunge"],
        "plank to down dog": ["plank to down dog", "down dog", "downdog"],
        "push-up t-rotations": ["t-rotation", "t rotation", "push-up to t", "t-rotate"],
        "suitcase carry": ["suitcase carry", "farmer carry", "farmer walk"],
        // v8 additions
        "good mornings": ["good morning"],
        "sumo squats": ["sumo sq", "sumo squat", "wide squat"],
        "chest press": ["chest press", "db chest press", "db flys", "db fly", "bench press", "alternating bench"],
        "arm circles": ["arm circle", "arm swing", "arm swings"],
        "leg swings": ["leg swing", "hip swing"],
        "bumkicks": ["bumkick", "bum kick", "butt kick", "heel kick"],
        "carioca": ["carioca run", "grapevine"],
      };
      if (variants[key]) names.push(...variants[key]);
      return { key, names };
    });

    // Build a regex that matches any exercise name
    const allNames = exercisePatterns.flatMap(p => p.names).sort((a, b) => b.length - a.length);
    if (allNames.length === 0) return [{ type: "text", value: text }];

    const escaped = allNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");
    const segments = [];
    let last = 0;
    let match;
    const lowerText = text.toLowerCase();

    // Find matches
    const matches = [];
    while ((match = regex.exec(lowerText)) !== null) {
      matches.push({ index: match.index, length: match[0].length, matched: match[0].toLowerCase() });
    }

    // Deduplicate overlapping matches (keep longest)
    const filtered = [];
    for (const m of matches) {
      const overlaps = filtered.some(f => m.index >= f.index && m.index < f.index + f.length);
      if (!overlaps) filtered.push(m);
    }

    for (const m of filtered) {
      if (m.index > last) {
        segments.push({ type: "text", value: text.slice(last, m.index) });
      }
      // Find which exercise this matches
      const exerciseKey = exercisePatterns.find(p => p.names.some(n => m.matched.includes(n.toLowerCase())))?.key || null;
      segments.push({ type: "exercise", value: text.slice(m.index, m.index + m.length), key: exerciseKey });
      last = m.index + m.length;
    }
    if (last < text.length) segments.push({ type: "text", value: text.slice(last) });
    return segments.length ? segments : [{ type: "text", value: text }];
  }, [text]);

  // Long-press handler for exercise links
  const longPressRef = useRef(null);
  const handleTouchStart = useCallback((key) => {
    longPressRef.current = setTimeout(() => {
      tryVibrate(50);
      onExerciseTap(key);
    }, 400);
  }, [onExerciseTap]);
  const handleTouchEnd = useCallback(() => {
    clearTimeout(longPressRef.current);
  }, []);

  return (
    <span>
      {parts.map((p, i) =>
        p.type === "exercise" && p.key ? (
          <span key={i} className="exercise-link" onClick={(e) => { e.stopPropagation(); onExerciseTap(p.key); }}
            onTouchStart={() => handleTouchStart(p.key)} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd}
            style={sty.exerciseHighlight}>
            {p.value}
          </span>
        ) : (
          <span key={i}>{p.value}</span>
        )
      )}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXERCISE INFO MODAL
// ═══════════════════════════════════════════════════════════════
// Same-muscle alternatives (info-only): score by overlapping muscle groups,
// weight the primary muscle heavily, take the top three.
function getExerciseAlternatives(exKey) {
  const info = EXERCISE_INFO[exKey];
  if (!info) return [];
  const muscles = info.muscles.toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
  const primary = muscles[0];
  return Object.entries(EXERCISE_INFO)
    .filter(([k]) => k !== exKey)
    .map(([k, i]) => {
      const m = i.muscles.toLowerCase();
      let score = muscles.filter(x => m.includes(x)).length;
      if (primary && m.split(",")[0].trim().includes(primary)) score += 2;
      return { key: k, name: i.name, muscles: i.muscles, score };
    })
    .filter(x => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function ExerciseModal({ exerciseKey, onClose }) {
  const [key, setKey] = useState(exerciseKey);
  useEffect(() => { setKey(exerciseKey); }, [exerciseKey]);
  if (!key || !EXERCISE_INFO[key]) return null;
  const ex = EXERCISE_INFO[key];
  const alts = getExerciseAlternatives(key);
  return (
    <div style={sty.modalOverlay} onClick={onClose}>
      <div style={sty.modalContent} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={sty.modalClose}>{"\u2715"}</button>
        <div style={{fontSize: 22, fontWeight: 800, color: "#ff8a3a", marginBottom: 4}}>{ex.name}</div>
        {ex.aka && <div style={{fontSize: 13, color: "#888", marginBottom: 12}}>Also called: {ex.aka}</div>}
        <div style={{marginBottom: 16}}>
          <div style={{fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6}}>Muscles Worked</div>
          <div style={{fontSize: 14, color: "#8b5cf6", fontWeight: 600, lineHeight: 1.5}}>{ex.muscles}</div>
        </div>
        <div>
          <div style={{fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6}}>How To Do It</div>
          <div style={{fontSize: 15, color: "#e0e0e0", lineHeight: 1.7}}>{ex.desc}</div>
        </div>
        {alts.length > 0 && (
          <div style={{marginTop: 16, paddingTop: 14, borderTop: "1px solid #222"}}>
            <div style={{fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8}}>Alternatives (same muscles)</div>
            {alts.map(a => (
              <button key={a.key} onClick={() => setKey(a.key)} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
                background: "#111122", border: "1px solid #333", borderRadius: 10, padding: "10px 12px",
                marginBottom: 6, cursor: "pointer", textAlign: "left",
              }}>
                <div>
                  <div style={{fontSize: 14, fontWeight: 700, color: "#3ddc84"}}>{a.name}</div>
                  <div style={{fontSize: 11, color: "#888"}}>{a.muscles}</div>
                </div>
                <span style={{fontSize: 12, color: "#666"}}>{"\u2192"}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FULL SCREEN WORKOUT MODE
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// PHASE 2: AUDIO SYSTEM
// ═══════════════════════════════════════════════════════════════
const audioCtxRef = { current: null };
function getAudioCtx() {
  if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
  return audioCtxRef.current;
}
function playTone(freq, dur = 0.15, vol = 0.4) {
  try {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = freq; o.type = "square";
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + dur);
  } catch(e) {}
}
function beepWork() { playTone(1000, 0.12, 0.5); setTimeout(() => playTone(1000, 0.12, 0.5), 150); }
function beepRest() { playTone(600, 0.2, 0.4); }
function beepMinute() { playTone(880, 0.1, 0.3); }
function beep321() { playTone(660, 0.1, 0.3); }
function beepFinish() { playTone(1200, 0.15, 0.5); setTimeout(() => playTone(1200, 0.15, 0.5), 200); setTimeout(() => playTone(1600, 0.3, 0.6), 400); }
function tryVibrate(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch(e) {} }

// ═══════════════════════════════════════════════════════════════
// FORMAT TIME HELPER
// ═══════════════════════════════════════════════════════════════
function fmt(secs) {
  const s = Math.abs(Math.floor(secs));
  return `${secs < 0 ? "-" : ""}${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;
}

// ═══════════════════════════════════════════════════════════════
// TIMER HOOK
// ═══════════════════════════════════════════════════════════════
function useTimer() {
  // Timestamp-based: elapsed is derived from wall-clock time, so it stays
  // correct even when the browser throttles/suspends intervals (screen lock,
  // app backgrounded). The interval only refreshes the display.
  const stateRef = useRef(createTimerState());
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunningState] = useState(false);

  const sync = useCallback(() => {
    setElapsed(computeElapsed(stateRef.current, Date.now()));
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(sync, 250); // 250ms so displayed seconds never visibly stall
    const onVisibility = () => { if (!document.hidden) sync(); }; // resync instantly on unlock
    document.addEventListener("visibilitychange", onVisibility);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisibility); };
  }, [running, sync]);

  const start = useCallback(() => {
    stateRef.current = timerStart(stateRef.current, Date.now());
    setRunningState(true);
    setElapsed(computeElapsed(stateRef.current, Date.now()));
  }, []);
  const pause = useCallback(() => {
    stateRef.current = timerPause(stateRef.current, Date.now());
    setRunningState(false);
    setElapsed(computeElapsed(stateRef.current, Date.now()));
  }, []);
  const reset = useCallback(() => {
    stateRef.current = createTimerState();
    setRunningState(false);
    setElapsed(0);
  }, []);
  const toggle = useCallback(() => {
    if (timerIsRunning(stateRef.current)) pause(); else start();
  }, [start, pause]);
  const setRunning = useCallback((v) => {
    const target = typeof v === "function" ? v(timerIsRunning(stateRef.current)) : v;
    if (target) start(); else pause();
  }, [start, pause]);

  return { elapsed, running, start, pause, toggle, reset, setRunning };
}

// ═══════════════════════════════════════════════════════════════
// TIMER DISPLAY COMPONENT
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// TIMER DISPLAY — shows format timer, current exercise, countdown
// ═══════════════════════════════════════════════════════════════
function TimerDisplay({ config, elapsed, audio, countdownLeft, voiceEnabled, outdoorMode, fontSizeKey, coach = {} }) {
  const cfg = config;
  const fs = FONT_SIZES[fontSizeKey] || FONT_SIZES.normal;
  const outdoor = outdoorMode;
  // Outdoor mode color overrides
  const oText = outdoor ? "#000" : "#fff";
  const oSub = outdoor ? "#333" : "#888";
  const oWork = outdoor ? "#c2410c" : "#ff8a3a";
  const oRest = outdoor ? "#15803d" : "#3ddc84";
  const oBg = outdoor ? "#ffffff" : "transparent";
  const oTimerBlock = { ...ts.timerBlock, background: oBg };
  
  // ── 5-SECOND COUNTDOWN OVERLAY ──
  if (countdownLeft > 0) {
    return (
      <div style={{...oTimerBlock, padding: "24px 20px 16px"}}>
        <div style={{fontSize: 13, fontWeight: 700, color: oSub, letterSpacing: 2, marginBottom: 8}}>GET READY</div>
        <div style={{fontSize: 100, fontWeight: 900, color: oWork, lineHeight: 1, fontVariantNumeric: "tabular-nums"}}>{countdownLeft}</div>
        <div style={{fontSize: 14, color: oSub, marginTop: 10}}>{cfg.label}</div>
      </div>
    );
  }
  
  // Audio cue tracking + voice announcements
  const prevElapsed = useRef(elapsed);
  useEffect(() => {
    const prev = prevElapsed.current;
    prevElapsed.current = elapsed;
    if (elapsed === 0 || elapsed === prev) return;
    // Beeps only when audio is on
    const doBeep = audio;
    
    if (cfg.type === "countdown") {
      const rem = cfg.totalSeconds - elapsed;
      if (doBeep && rem >= 1 && rem <= 3) { beep321(); tryVibrate(100); }
      // Coaching: halfway call (blocks of 4+ min) and final-minute call (2+ min)
      const half = Math.floor(cfg.totalSeconds / 2);
      if (coach.halfway && cfg.totalSeconds >= 240 && prev < half && elapsed >= half) {
        speakText(`Halfway. ${speakDuration(cfg.totalSeconds - half)} to go`, voiceEnabled, audio);
      }
      if (coach.finalMinute && cfg.totalSeconds >= 120 && prev < cfg.totalSeconds - 60 && elapsed >= cfg.totalSeconds - 60) {
        speakText("One minute remaining", voiceEnabled, audio);
      }
      // crossing-safe: fires even if the clock jumps past the boundary (phone unlock)
      if (doBeep && prev < cfg.totalSeconds && elapsed >= cfg.totalSeconds) { beepFinish(); tryVibrate([200,100,200,100,400]); }
    }
    if (cfg.type === "emom") {
      const currentMin = Math.floor(elapsed / 60) + 1;
      // Coaching: halfway call — only for odd-minute EMOMs where the midpoint
      // falls between minute marks (even ones collide with the minute
      // announcement, which carries more information and wins)
      const emomHalf = Math.floor(cfg.totalSeconds / 2);
      if (coach.halfway && cfg.totalSeconds >= 240 && emomHalf % 60 !== 0 && prev < emomHalf && elapsed >= emomHalf) {
        speakText(`Halfway. ${speakDuration(cfg.totalSeconds - emomHalf)} to go`, voiceEnabled, audio);
      }
      if (crossedBoundary(prev, elapsed, 60, 60)) {
        if (doBeep) { beepMinute(); tryVibrate(200); }
        // Voice: announce round and exercise at minute change
        if (cfg.exercises) {
          const exIdx = (currentMin - 1) % cfg.exercises.length;
          const exName = cfg.exercises[exIdx];
          speakText(`Minute ${currentMin}. ${exName}`, voiceEnabled, audio);
        } else {
          speakText(`Minute ${currentMin}`, voiceEnabled, audio);
        }
      }
      const rem = cfg.totalSeconds - elapsed;
      if (doBeep && rem >= 1 && rem <= 3) beep321();
      if (doBeep && prev < cfg.totalSeconds && elapsed >= cfg.totalSeconds) { beepFinish(); tryVibrate([200,100,200,100,400]); }
    }
    if (cfg.type === "tabata") {
      const cycleLen = cfg.workSeconds + cfg.restSeconds;
      const withinCycle = elapsed % cycleLen;
      const currentCycle = Math.floor(elapsed / cycleLen);
      const stationIdx = Math.floor(currentCycle / cfg.rounds);
      const round = (currentCycle % cfg.rounds) + 1;
      const exName = cfg.exercises && cfg.exercises[stationIdx] ? cfg.exercises[stationIdx] : null;
      const nextStIdx = stationIdx + (round === cfg.rounds ? 1 : 0);
      const nextExName = cfg.exercises && cfg.exercises[nextStIdx] ? cfg.exercises[nextStIdx] : null;
      
      // Start of WORK period (crossing-safe across clock jumps)
      if (crossedBoundary(prev, elapsed, cycleLen, cycleLen)) {
        if (doBeep) { beepWork(); tryVibrate([100,50,100,50,100]); }
        const voiceMsg = exName ? `Round ${round} of ${cfg.rounds}. ${exName}` : `Round ${round} of ${cfg.rounds}`;
        speakText(voiceMsg, voiceEnabled, audio);
      }
      // First cycle work start (elapsed 0 handled separately for voice)
      if (withinCycle === 0 && elapsed === 1 && prev === 0) {
        const voiceMsg = exName ? `Round 1 of ${cfg.rounds}. ${exName}` : `Round 1`;
        speakText(voiceMsg, voiceEnabled, audio);
      }
      // Start of REST period (crossing-safe across clock jumps)
      if (crossedBoundary(prev, elapsed, cycleLen, cfg.workSeconds)) {
        if (doBeep) { beepRest(); tryVibrate(200); }
        // Voice: announce what the next work period holds
        if (round === cfg.rounds && nextExName) {
          speakText(`Rest. Next exercise: ${nextExName}`, voiceEnabled, audio);
        } else if (coach.nextPreview && exName) {
          speakText(`Rest. Next: ${exName}`, voiceEnabled, audio); // same station, another round
        } else if (nextExName || exName) {
          speakText(`Rest`, voiceEnabled, audio);
        }
      }
      const isWork = withinCycle < cfg.workSeconds;
      const secsLeft = isWork ? (cfg.workSeconds - withinCycle) : (cycleLen - withinCycle);
      if (doBeep && secsLeft >= 1 && secsLeft <= 3) beep321();
    }
    if (cfg.type === "fgb") {
      const stSec = cfg.stationSeconds;
      const roundLen = (stSec * cfg.stations) + cfg.restSeconds;
      const withinRound = elapsed % roundLen;
      const roundIdx = Math.floor(elapsed / roundLen);
      const stationIdx = Math.floor(withinRound / stSec);
      // Station entry (crossing-safe): fire when the station segment identity changes
      const stationKey = (e) => { const wr = e % roundLen; return Math.floor(e / roundLen) * 1000 + (wr < stSec * cfg.stations ? Math.floor(wr / stSec) : 999); };
      if (stationKey(elapsed) !== stationKey(prev) && withinRound < stSec * cfg.stations && withinRound >= stSec) {
        if (doBeep) { beepMinute(); tryVibrate(200); }
        // Voice: announce station exercise
        const exName = cfg.exercises && cfg.exercises[stationIdx] ? cfg.exercises[stationIdx] : `Station ${stationIdx + 1}`;
        speakText(`${exName}. Round ${roundIdx + 1}`, voiceEnabled, audio);
      }
      if (crossedBoundary(prev, elapsed, roundLen, stSec * cfg.stations)) {
        if (doBeep) { beepRest(); tryVibrate(300); }
        const firstEx = coach.nextPreview && cfg.exercises && cfg.exercises[0];
        speakText(firstEx ? `Rest. Next round: ${firstEx}` : `Rest`, voiceEnabled, audio);
      }
    }
    if (cfg.type === "deathby") {
      if (crossedBoundary(prev, elapsed, 60, 60)) { if (doBeep) { beepMinute(); tryVibrate(200); }
        const currentMin = Math.floor(elapsed / 60) + 1;
        speakText(`Minute ${currentMin}. ${currentMin} reps`, voiceEnabled, audio);
      }
    }
    if (cfg.type === "circuit") {
      const numEx = cfg.exercises ? cfg.exercises.length : 1;
      const roundLen = numEx * cfg.exerciseSeconds + cfg.restSeconds;
      const withinRound = elapsed % roundLen;
      const workPeriod = numEx * cfg.exerciseSeconds;
      const isRest = withinRound >= workPeriod;
      const withinEx = withinRound % cfg.exerciseSeconds;
      const exIdx = isRest ? numEx - 1 : Math.floor(withinRound / cfg.exerciseSeconds);
      const roundIdx = Math.floor(elapsed / roundLen);
      const exName = cfg.exercises && cfg.exercises[exIdx] ? cfg.exercises[exIdx] : null;
      // Coaching: halfway + final-minute (before the segment announcements
      // below so those win a speech collision)
      const circHalf = Math.floor(cfg.totalSeconds / 2);
      if (coach.halfway && cfg.totalSeconds >= 240 && prev < circHalf && elapsed >= circHalf) {
        speakText(`Halfway. ${speakDuration(cfg.totalSeconds - circHalf)} to go`, voiceEnabled, audio);
      }
      if (coach.finalMinute && cfg.totalSeconds >= 120 && prev < cfg.totalSeconds - 60 && elapsed >= cfg.totalSeconds - 60) {
        speakText("One minute remaining", voiceEnabled, audio);
      }
      // Completion beep (crossing-safe)
      if (doBeep && prev < cfg.totalSeconds && elapsed >= cfg.totalSeconds) { beepFinish(); tryVibrate([200,100,200,100,400]); }
      // Start of rest period (crossing-safe)
      if (cfg.restSeconds > 0 && crossedBoundary(prev, elapsed, roundLen, workPeriod)) {
        if (doBeep) { beepRest(); tryVibrate(200); }
        const nextRoundEx = coach.nextPreview && cfg.exercises && cfg.exercises[0];
        speakText(nextRoundEx ? `Rest. Next round: ${nextRoundEx}` : `Rest`, voiceEnabled, audio);
      }
      // Start of a new exercise within the round (crossing-safe: fire when the
      // exercise segment identity changes; announces the CURRENT exercise once)
      const exKey = (e) => { const wr = e % roundLen; return wr >= workPeriod ? -1 : Math.floor(e / roundLen) * 1000 + Math.floor(wr / cfg.exerciseSeconds); };
      if (!isRest && elapsed > 0 && exKey(elapsed) !== exKey(prev)) {
        if (doBeep) { beepWork(); tryVibrate([100,50,100]); }
        const isRoundStart = exIdx === 0;
        const msg = isRoundStart ? `Round ${roundIdx + 1}. ${exName || ''}` : (exName || '');
        speakText(msg, voiceEnabled, audio);
      }
      // Very first tick — announce round 1 and first exercise (skip if a clock
      // jump already fired the segment-change branch above)
      if (prev === 0 && elapsed >= 1 && exName && exKey(elapsed) === exKey(prev)) {
        speakText(`Round 1. ${exName}`, voiceEnabled, audio);
      }
      // Last 3 seconds of each exercise period or rest period
      const secsLeft = isRest ? (roundLen - withinRound) : (cfg.exerciseSeconds - withinEx);
      if (doBeep && secsLeft >= 1 && secsLeft <= 3) beep321();
    }
  }, [elapsed, audio, cfg, voiceEnabled]);
  
  // ── EMOM with exercise tracking ──
  if (cfg.type === "emom") {
    const currentMin = Math.floor(elapsed / 60) + 1;
    const secInMin = elapsed % 60;
    const pct = (elapsed / cfg.totalSeconds) * 100;
    const overtime = elapsed >= cfg.totalSeconds;
    const exIdx = cfg.exercises ? (currentMin - 1) % cfg.exercises.length : -1;
    const exName = cfg.exercises && cfg.exercises[exIdx] ? cfg.exercises[exIdx] : null;
    const nextExIdx = cfg.exercises ? currentMin % cfg.exercises.length : -1;
    const nextExName = cfg.exercises && cfg.exercises[nextExIdx] ? cfg.exercises[nextExIdx] : null;
    return (
      <div style={oTimerBlock}>
        <div style={{...ts.timerLabel, color: oSub}}>{cfg.label}</div>
        {/* Current exercise — big and prominent */}
        {exName && (
          <div style={{fontSize: Math.max(22, fs.exercise), fontWeight: 800, color: oText, marginBottom: 6, padding: "8px 20px", background: outdoor ? "#ff8a3a30" : "#ff8a3a25", borderRadius: 12, display: "inline-block"}}>
            {exName}
          </div>
        )}
        <div style={{display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8}}>
          <span style={{fontSize: 18, color: oSub}}>MIN</span>
          <span style={{fontSize: fs.timer, fontWeight: 900, fontVariantNumeric: "tabular-nums", lineHeight: 1, color: overtime ? "#ef4444" : oText}}>{overtime ? "!" : currentMin}</span>
          <span style={{fontSize: 18, color: oSub}}>/ {cfg.totalMinutes}</span>
        </div>
        <div style={{fontSize: 32, fontVariantNumeric: "tabular-nums", color: oWork, fontWeight: 700}}>
          :{(59 - secInMin).toString().padStart(2, "0")}
        </div>
        <div style={{...ts.barBg, background: outdoor ? "#ccc" : "#333"}}><div style={{...ts.barFill, width: `${Math.min(100,pct)}%`}} /></div>
        {/* Next exercise preview in last 10 seconds */}
        {nextExName && secInMin >= 50 && (
          <div style={{fontSize: 14, color: oSub, marginTop: 8}}>Next: <span style={{color: outdoor ? "#000" : "#ccc", fontWeight: 700}}>{nextExName}</span></div>
        )}
      </div>
    );
  }
  
  // ── TABATA with enhanced exercise/round tracking ──
  if (cfg.type === "tabata") {
    const cycleLen = cfg.workSeconds + cfg.restSeconds;
    const totalCycles = cfg.rounds * cfg.stations;
    const currentCycle = Math.floor(elapsed / cycleLen);
    const withinCycle = elapsed % cycleLen;
    const isWork = withinCycle < cfg.workSeconds;
    const secsLeft = isWork ? (cfg.workSeconds - withinCycle) : (cycleLen - withinCycle);
    const stationIdx = Math.floor(currentCycle / cfg.rounds);
    const round = (currentCycle % cfg.rounds) + 1;
    const done = currentCycle >= totalCycles;
    const exName = cfg.exercises && cfg.exercises[stationIdx] ? cfg.exercises[stationIdx] : null;
    const nextStIdx = stationIdx + 1;
    const nextExName = cfg.exercises && cfg.exercises[nextStIdx] ? cfg.exercises[nextStIdx] : null;
    const workCol = outdoor ? "#c2410c" : "#ff8a3a";
    const restCol = outdoor ? "#15803d" : "#3ddc84";
    const activeCol = isWork ? workCol : restCol;
    return (
      <div style={oTimerBlock}>
        <div style={{...ts.timerLabel, color: oSub}}>{cfg.label}</div>
        {done ? (
          <div style={{fontSize: 32, fontWeight: 800, color: restCol}}>COMPLETE</div>
        ) : (
          <>
            {/* WORK/REST badge — very prominent */}
            <div style={{fontSize: 22, fontWeight: 900, letterSpacing: 4, padding: "6px 28px", borderRadius: 10, color: activeCol, background: (isWork ? workCol : restCol) + "20", marginBottom: 4, display: "inline-block"}}>
              {isWork ? "WORK" : "REST"}
            </div>
            {/* Current exercise name — BIG and impossible to miss */}
            {exName && isWork && (
              <div style={{fontSize: Math.max(26, fs.exercise + 4), fontWeight: 900, color: oText, marginBottom: 4, marginTop: 4, padding: "8px 20px", background: outdoor ? workCol + "25" : workCol + "18", borderRadius: 12, display: "inline-block", lineHeight: 1.2}}>
                {exName}
              </div>
            )}
            {/* During REST — show next exercise prominently */}
            {!isWork && (
              <div style={{marginTop: 4, marginBottom: 4}}>
                {round === cfg.rounds && nextExName ? (
                  <div style={{fontSize: Math.max(22, fs.exercise), fontWeight: 800, color: oText, padding: "8px 20px", background: outdoor ? restCol + "25" : restCol + "18", borderRadius: 12, display: "inline-block"}}>
                    Next: {nextExName}
                  </div>
                ) : exName ? (
                  <div style={{fontSize: Math.max(20, fs.exercise - 2), fontWeight: 700, color: oSub, padding: "6px 16px"}}>
                    Get ready: {exName}
                  </div>
                ) : null}
              </div>
            )}
            {/* Timer countdown — huge */}
            <div style={{fontSize: Math.max(72, fs.timer + 8), fontWeight: 900, fontVariantNumeric: "tabular-nums", lineHeight: 1, color: activeCol}}>
              {secsLeft}
            </div>
            {/* Round & Exercise counters — prominent */}
            <div style={{display: "flex", justifyContent: "center", gap: 20, marginTop: 8}}>
              <div style={{textAlign: "center", padding: "6px 16px", background: outdoor ? "#00000010" : "#ffffff08", borderRadius: 10}}>
                <div style={{fontSize: 11, color: oSub, fontWeight: 700, letterSpacing: 1}}>ROUND</div>
                <div style={{fontSize: 28, fontWeight: 900, color: oText}}>{round}<span style={{fontSize: 16, color: oSub}}>/{cfg.rounds}</span></div>
              </div>
              <div style={{textAlign: "center", padding: "6px 16px", background: outdoor ? "#00000010" : "#ffffff08", borderRadius: 10}}>
                <div style={{fontSize: 11, color: oSub, fontWeight: 700, letterSpacing: 1}}>EXERCISE</div>
                <div style={{fontSize: 28, fontWeight: 900, color: oText}}>{stationIdx + 1}<span style={{fontSize: 16, color: oSub}}>/{cfg.stations}</span></div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
  
  // ── FIGHT GONE BAD with exercise tracking ──
  if (cfg.type === "fgb") {
    const stSec = cfg.stationSeconds;
    const roundLen = (stSec * cfg.stations) + cfg.restSeconds;
    const roundIdx = Math.floor(elapsed / roundLen);
    const withinRound = elapsed % roundLen;
    const stationWork = stSec * cfg.stations;
    const isRest = withinRound >= stationWork;
    const stationIdx = isRest ? cfg.stations - 1 : Math.floor(withinRound / stSec);
    const secsLeft = isRest ? (roundLen - withinRound) : (stSec - (withinRound % stSec));
    const done = roundIdx >= cfg.rounds;
    const exName = cfg.exercises && cfg.exercises[stationIdx] ? cfg.exercises[stationIdx] : null;
    const nextStIdx = isRest ? 0 : stationIdx + 1;
    const nextExName = cfg.exercises && cfg.exercises[nextStIdx] ? cfg.exercises[nextStIdx] : null;
    return (
      <div style={oTimerBlock}>
        <div style={{...ts.timerLabel, color: oSub}}>FIGHT GONE BAD</div>
        {done ? (
          <div style={{fontSize: 32, fontWeight: 800, color: oRest}}>COMPLETE</div>
        ) : (
          <>
            {!isRest && exName && (
              <div style={{fontSize: Math.max(24, fs.exercise + 2), fontWeight: 800, color: oText, marginBottom: 6, padding: "8px 20px", background: outdoor ? oWork + "25" : "#ff8a3a25", borderRadius: 12, display: "inline-block"}}>
                {exName}
              </div>
            )}
            <div style={{fontSize: Math.max(60, fs.timer), fontWeight: 900, fontVariantNumeric: "tabular-nums", lineHeight: 1, color: isRest ? oRest : oText}}>{secsLeft}</div>
            <div style={{fontSize: 16, fontWeight: 700, marginTop: 6, padding: "5px 16px", borderRadius: 8, background: isRest ? oRest + "20" : oWork + "20", color: isRest ? oRest : oWork}}>
              {isRest ? "REST" : `Station ${stationIdx + 1}/${cfg.stations}`}
            </div>
            <div style={{fontSize: 16, color: oSub, marginTop: 6, fontWeight: 700}}>Round {roundIdx + 1}/{cfg.rounds}</div>
            {!isRest && nextExName && secsLeft <= 5 && (
              <div style={{fontSize: 14, color: oSub, marginTop: 6}}>Next: <span style={{color: oText, fontWeight: 700}}>{nextExName}</span></div>
            )}
            {isRest && (
              <div style={{fontSize: 14, color: oSub, marginTop: 6}}>Next round: <span style={{color: oText, fontWeight: 700}}>{cfg.exercises ? cfg.exercises[0] : "Station 1"}</span></div>
            )}
          </>
        )}
      </div>
    );
  }
  
  // ── CORE CIRCUIT — consecutive timed exercises, rest between rounds only ──
  if (cfg.type === "circuit") {
    const numEx = cfg.exercises ? cfg.exercises.length : 1;
    const roundLen = numEx * cfg.exerciseSeconds + cfg.restSeconds;
    const withinRound = elapsed % roundLen;
    const workPeriod = numEx * cfg.exerciseSeconds;
    const isRest = withinRound >= workPeriod;
    const exIdx = isRest ? numEx - 1 : Math.floor(withinRound / cfg.exerciseSeconds);
    const secsLeft = isRest ? (roundLen - withinRound) : (cfg.exerciseSeconds - (withinRound % cfg.exerciseSeconds));
    const roundIdx = Math.floor(elapsed / roundLen);
    const done = elapsed >= cfg.totalSeconds;
    const exName = cfg.exercises && cfg.exercises[exIdx] ? cfg.exercises[exIdx] : null;
    const activeCol = isRest ? oRest : oWork;
    const pct = Math.min(100, (elapsed / cfg.totalSeconds) * 100);
    return (
      <div style={oTimerBlock}>
        <div style={{...ts.timerLabel, color: oSub}}>{cfg.label}</div>
        {done ? (
          <div style={{fontSize: 32, fontWeight: 800, color: oRest}}>COMPLETE</div>
        ) : (
          <>
            {/* WORK / REST badge */}
            <div style={{fontSize: 22, fontWeight: 900, letterSpacing: 4, padding: "6px 28px", borderRadius: 10, color: activeCol, background: activeCol + "20", marginBottom: 4, display: "inline-block"}}>
              {isRest ? "REST" : "WORK"}
            </div>
            {/* Current exercise — big and prominent during work */}
            {!isRest && exName && (
              <div style={{fontSize: Math.max(26, fs.exercise + 4), fontWeight: 900, color: oText, marginBottom: 4, marginTop: 4, padding: "8px 20px", background: oWork + "18", borderRadius: 12, display: "inline-block", lineHeight: 1.2}}>
                {exName}
              </div>
            )}
            {/* During rest — show first exercise of next round */}
            {isRest && cfg.restSeconds > 0 && (
              <div style={{fontSize: Math.max(18, fs.exercise - 2), fontWeight: 700, color: oSub, padding: "6px 16px", marginTop: 4}}>
                Next round: <span style={{color: oText}}>{cfg.exercises ? cfg.exercises[0] : ''}</span>
              </div>
            )}
            {/* Big countdown */}
            <div style={{fontSize: Math.max(72, fs.timer + 8), fontWeight: 900, fontVariantNumeric: "tabular-nums", lineHeight: 1, color: activeCol}}>
              {secsLeft}
            </div>
            {/* Round and exercise counters */}
            <div style={{display: "flex", justifyContent: "center", gap: 20, marginTop: 8}}>
              <div style={{textAlign: "center", padding: "6px 16px", background: outdoor ? "#00000010" : "#ffffff08", borderRadius: 10}}>
                <div style={{fontSize: 11, color: oSub, fontWeight: 700, letterSpacing: 1}}>ROUND</div>
                <div style={{fontSize: 28, fontWeight: 900, color: oText}}>{Math.min(roundIdx + 1, cfg.rounds)}<span style={{fontSize: 16, color: oSub}}>/{cfg.rounds}</span></div>
              </div>
              <div style={{textAlign: "center", padding: "6px 16px", background: outdoor ? "#00000010" : "#ffffff08", borderRadius: 10}}>
                <div style={{fontSize: 11, color: oSub, fontWeight: 700, letterSpacing: 1}}>EXERCISE</div>
                <div style={{fontSize: 28, fontWeight: 900, color: oText}}>{isRest ? "—" : exIdx + 1}<span style={{fontSize: 16, color: oSub}}>/{numEx}</span></div>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{...ts.barBg, background: outdoor ? "#ccc" : "#333", marginTop: 10}}><div style={{...ts.barFill, width: `${pct}%`}} /></div>
          </>
        )}
      </div>
    );
  }

  // ── DEATH BY EMOM ──
  if (cfg.type === "deathby") {
    const currentMin = Math.floor(elapsed / 60) + 1;
    const secInMin = elapsed % 60;
    return (
      <div style={oTimerBlock}>
        <div style={{...ts.timerLabel, color: oSub}}>DEATH BY EMOM</div>
        <div style={{display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8}}>
          <span style={{fontSize: 20, color: oSub}}>MIN</span>
          <span style={{fontSize: fs.timer, fontWeight: 900, fontVariantNumeric: "tabular-nums", lineHeight: 1, color: "#ef4444"}}>{currentMin}</span>
        </div>
        <div style={{fontSize: 32, fontVariantNumeric: "tabular-nums", color: oWork, fontWeight: 700}}>
          :{(59 - secInMin).toString().padStart(2, "0")}
        </div>
        <div style={{fontSize: 15, color: oSub, marginTop: 6, fontWeight: 700}}>{currentMin} reps this minute</div>
      </div>
    );
  }
  
  // ── COUNTDOWN (AMRAP, Deck, Running Clock) ──
  if (cfg.type === "countdown") {
    const remaining = Math.max(0, cfg.totalSeconds - elapsed);
    const pct = ((cfg.totalSeconds - remaining) / cfg.totalSeconds) * 100;
    const overtime = elapsed > cfg.totalSeconds;
    return (
      <div style={oTimerBlock}>
        <div style={{...ts.timerLabel, color: oSub}}>{cfg.label}</div>
        <div style={{fontSize: fs.timer, fontWeight: 900, fontVariantNumeric: "tabular-nums", lineHeight: 1, color: overtime ? "#ef4444" : oText}}>
          {overtime ? `+${fmt(elapsed - cfg.totalSeconds)}` : fmt(remaining)}
        </div>
        <div style={{...ts.barBg, background: outdoor ? "#ccc" : "#333"}}><div style={{...ts.barFill, width: `${Math.min(100,pct)}%`, background: overtime ? "#ef4444" : oWork}} /></div>
        {overtime && <div style={{fontSize: 13, color: "#ef4444", marginTop: 4, fontWeight: 700}}>OVERTIME</div>}
      </div>
    );
  }
  
  // ── STOPWATCH (For Time, Rounds, general) ──
  const capSecs = cfg.capSeconds;
  const overCap = capSecs && elapsed > capSecs;
  return (
    <div style={oTimerBlock}>
      <div style={{...ts.timerLabel, color: oSub}}>{cfg.label || "TIMER"}</div>
      <div style={{fontSize: fs.timer, fontWeight: 900, fontVariantNumeric: "tabular-nums", lineHeight: 1, color: overCap ? "#ef4444" : oText}}>{fmt(elapsed)}</div>
      {capSecs && (
        <div style={{...ts.barBg, background: outdoor ? "#ccc" : "#333"}}><div style={{...ts.barFill, width: `${Math.min(100,(elapsed/capSecs)*100)}%`, background: overCap ? "#ef4444" : oWork}} /></div>
      )}
      {overCap && <div style={{fontSize: 13, color: "#ef4444", marginTop: 4, fontWeight: 700}}>OVER TIME CAP</div>}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// TIMER SETTINGS EDITOR
// ═══════════════════════════════════════════════════════════════
function TimerSettingsModal({ config, onSave, onClose }) {
  const [cfg, setCfg] = useState({...config});
  return (
    <div style={sty.modalOverlay} onClick={onClose}>
      <div style={{...sty.modalContent, maxWidth: 340}} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={sty.modalClose}>{"\u2715"}</button>
        <div style={{fontSize: 18, fontWeight: 800, color: "#ff8a3a", marginBottom: 4}}>Timer Settings</div>
        <div style={{fontSize: 12, color: "#666", marginBottom: 16}}>Auto-detected: {config.label}</div>
        
        {cfg.type === "countdown" && (
          <div style={{marginBottom: 12}}>
            <label style={ts.setLabel}>Duration (minutes)</label>
            <input type="number" value={Math.round((cfg.totalSeconds||0)/60)} onChange={e => setCfg({...cfg, totalSeconds: (parseInt(e.target.value)||1)*60, label: `${parseInt(e.target.value)||1} Min`})} style={ts.setInput} />
          </div>
        )}
        {cfg.type === "emom" && (
          <div style={{marginBottom: 12}}>
            <label style={ts.setLabel}>Total Minutes</label>
            <input type="number" value={cfg.totalMinutes} onChange={e => { const v=parseInt(e.target.value)||1; setCfg({...cfg, totalSeconds: v*60, totalMinutes: v, label: `EMOM ${v} Min`}); }} style={ts.setInput} />
          </div>
        )}
        {cfg.type === "tabata" && <>
          <div style={{marginBottom: 12}}><label style={ts.setLabel}>Work (seconds)</label><input type="number" value={cfg.workSeconds} onChange={e => setCfg({...cfg, workSeconds: parseInt(e.target.value)||20})} style={ts.setInput} /></div>
          <div style={{marginBottom: 12}}><label style={ts.setLabel}>Rest (seconds)</label><input type="number" value={cfg.restSeconds} onChange={e => setCfg({...cfg, restSeconds: parseInt(e.target.value)||10})} style={ts.setInput} /></div>
          <div style={{marginBottom: 12}}><label style={ts.setLabel}>Rounds per station</label><input type="number" value={cfg.rounds} onChange={e => setCfg({...cfg, rounds: parseInt(e.target.value)||8})} style={ts.setInput} /></div>
          <div style={{marginBottom: 12}}><label style={ts.setLabel}>Stations</label><input type="number" value={cfg.stations} onChange={e => setCfg({...cfg, stations: parseInt(e.target.value)||4})} style={ts.setInput} /></div>
        </>}
        {cfg.type === "fgb" && <>
          <div style={{marginBottom: 12}}><label style={ts.setLabel}>Rounds</label><input type="number" value={cfg.rounds} onChange={e => setCfg({...cfg, rounds: parseInt(e.target.value)||3})} style={ts.setInput} /></div>
          <div style={{marginBottom: 12}}><label style={ts.setLabel}>Stations</label><input type="number" value={cfg.stations} onChange={e => setCfg({...cfg, stations: parseInt(e.target.value)||5})} style={ts.setInput} /></div>
        </>}
        {cfg.type === "stopwatch" && cfg.capSeconds !== undefined && (
          <div style={{marginBottom: 12}}><label style={ts.setLabel}>Time cap minutes (0 = none)</label><input type="number" value={cfg.capSeconds ? Math.round(cfg.capSeconds/60) : 0} onChange={e => { const v=parseInt(e.target.value)||0; setCfg({...cfg, capSeconds: v>0?v*60:null}); }} style={ts.setInput} /></div>
        )}
        
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <button onClick={onClose} style={{...ts.setInput, background: "#333", color: "#999", cursor: "pointer", textAlign: "center", flex:1}}>Cancel</button>
          <button onClick={() => { onSave(cfg); onClose(); }} style={{...ts.setInput, background: "#ff8a3a", color: "#fff", cursor: "pointer", textAlign: "center", fontWeight: 700, flex:1, border: "1px solid #ff8a3a"}}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FULL SCREEN WORKOUT — Phase 2 Rewrite
// ═══════════════════════════════════════════════════════════════
function FullScreenWorkout({ workout, onExit, settings, onUpdateSettings, onLogWorkout, logs }) {
  // Use customized text if available, otherwise original
  const warmupText = getCustomization(workout.id, "warmup", workout.warmup);
  const workoutText = getCustomization(workout.id, "workout", workout.workout);
  const coreText = getCustomization(workout.id, "core", workout.core);
  
  // Build phase list: warmup → workout blocks → core blocks → done
  const phases = useMemo(() => {
    const p = [];
    if (warmupText) p.push({ type: "warmup", title: "WARMUP", icon: "\u{1F525}", color: "#eab308", content: warmupText, timer: { type: "stopwatch", label: "Warmup" } });
    
    const blocks = getWorkoutBlocks(workout, "workout", workoutText);
    blocks.forEach((block, i) => {
      p.push({
        type: "workout",
        title: blocks.length > 1 ? `WORKOUT ${i+1}/${blocks.length}` : "WORKOUT",
        icon: "\u{1F4AA}", color: "#ff8a3a",
        content: block.content, timer: block.timer,
      });
    });

    if (coreText) {
      const coreBlocks = getWorkoutBlocks(workout, "core", coreText);
      coreBlocks.forEach((block, i) => {
        p.push({
          type: "core",
          title: coreBlocks.length > 1 ? `CORE ${i+1}/${coreBlocks.length}` : "CORE",
          icon: "\u{1F9E0}", color: "#8b5cf6",
          content: block.content, timer: block.timer,
        });
      });
    }
    p.push({ type: "done", title: "DONE", icon: "\u{1F3C6}", color: "#3ddc84", content: "", timer: null });
    return p;
  }, [workout, warmupText, workoutText, coreText]);

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [exerciseModal, setExerciseModal] = useState(null);
  const [settingsModal, setSettingsModal] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(settings.audioDefault !== false);
  const [voiceEnabled, setVoiceEnabled] = useState(settings.voiceEnabled || false);
  const [outdoorMode, setOutdoorMode] = useState(settings.outdoorMode || false);
  const [timerOverrides, setTimerOverrides] = useState({});
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitNudge, setExitNudge] = useState(false);
  const exitNudgeTimer = useRef(null);
  const [phaseTimes, setPhaseTimes] = useState({}); // { phaseIdx: elapsed seconds }
  
  // Rest timer state (for stopwatch/rounds phases)
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(0);
  const [restTimerLeft, setRestTimerLeft] = useState(0);
  const [showRestPicker, setShowRestPicker] = useState(false);
  const restIntervalRef = useRef(null);
  const restEndsAtRef = useRef(0); // wall-clock deadline for the rest timer
  
  // Font size from settings
  const fontSizeKey = settings.fontSize || "normal";
  const fs = FONT_SIZES[fontSizeKey] || FONT_SIZES.normal;
  
  // 5-second countdown state
  const [countdownLeft, setCountdownLeft] = useState(0);
  const countdownRef = useRef(null);
  
  const overall = useTimer();
  const phase_timer = useTimer();
  
  const phase = phases[phaseIdx];
  const isDone = phase.type === "done";
  const activeTimer = timerOverrides[phaseIdx] || phase.timer;
  
  // Check if a timer type needs the 5s lead-in countdown
  const needsCountdown = (timer) => {
    if (!timer) return false;
    return ["countdown", "emom", "tabata", "fgb", "deathby"].includes(timer.type);
  };

  // Prevent scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Wake Lock — keep screen on during workout
  const wakeLockRef = useRef(null);
  useEffect(() => {
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch (e) { console.log('Wake lock failed:', e); }
    }
    requestWakeLock();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);
  
  // Cleanup countdown and speech on unmount
  useEffect(() => () => { clearInterval(countdownRef.current); clearInterval(restIntervalRef.current); cancelSpeech(); }, []);

  // Rest timer countdown effect — deadline-based so it stays correct when the
  // browser throttles intervals (phone locked during a rest). Remaining time is
  // computed from a wall-clock deadline; if the rest expired while the screen
  // was off, it finishes immediately on unlock instead of silently drifting.
  useEffect(() => {
    if (!restTimerActive) { clearInterval(restIntervalRef.current); return; }
    let prevLeft = Math.max(0, Math.ceil((restEndsAtRef.current - Date.now()) / 1000));
    const tick = () => {
      const left = Math.max(0, Math.ceil((restEndsAtRef.current - Date.now()) / 1000));
      if (left !== prevLeft) {
        // Beep at 3,2,1 (once per second change, crossing-safe)
        if (left >= 1 && left <= 3 && audioEnabled) {
          try { const ac = new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(); const g = ac.createGain(); o.connect(g); g.connect(ac.destination); o.frequency.value = 660; g.gain.value = 0.2; o.start(); o.stop(ac.currentTime + 0.1); } catch(e) {}
        }
        prevLeft = left;
        setRestTimerLeft(left);
      }
      if (left <= 0) {
        clearInterval(restIntervalRef.current);
        setRestTimerActive(false);
        // Beep + vibrate when rest is over
        try {
          const ac = new (window.AudioContext || window.webkitAudioContext)();
          [0, 200, 400].forEach(delay => { const o = ac.createOscillator(); const g = ac.createGain(); o.connect(g); g.connect(ac.destination); o.frequency.value = 880; g.gain.value = 0.3; o.start(ac.currentTime + delay/1000); o.stop(ac.currentTime + delay/1000 + 0.15); });
        } catch(e) {}
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
        speakText("Rest over. Let's go!", voiceEnabled, audioEnabled);
      }
    };
    restIntervalRef.current = setInterval(tick, 250);
    const onVisibility = () => { if (!document.hidden) tick(); }; // instant resync on unlock
    document.addEventListener("visibilitychange", onVisibility);
    return () => { clearInterval(restIntervalRef.current); document.removeEventListener("visibilitychange", onVisibility); };
  }, [restTimerActive, audioEnabled, voiceEnabled]);

  const startRestTimer = (seconds) => {
    restEndsAtRef.current = Date.now() + seconds * 1000;
    setRestTimerDuration(seconds);
    setRestTimerLeft(seconds);
    setRestTimerActive(true);
    setShowRestPicker(false);
  };

  // Crash recovery — auto-save workout state every 15 seconds
  useEffect(() => {
    if (!started || isDone) return;
    const interval = setInterval(() => {
      saveWorkoutState({
        workoutId: workout.id,
        phaseIdx,
        overallElapsed: overall.elapsed,
        phaseElapsed: phase_timer.elapsed,
        started: true,
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [started, isDone, phaseIdx, overall.elapsed, phase_timer.elapsed, workout.id]);

  // Clear recovery data when workout completes normally
  useEffect(() => {
    if (isDone) clearWorkoutRecovery();
  }, [isDone]);

  // Run the 5-second countdown, then start the phase timer
  const startCountdown = useCallback((then) => {
    setCountdownLeft(5);
    let count = 5;
    try { getAudioCtx(); } catch(e) {}
    beep321(); tryVibrate(100);
    countdownRef.current = setInterval(() => {
      count--;
      setCountdownLeft(count);
      if (count > 0) { beep321(); tryVibrate(100); }
      if (count === 0) {
        clearInterval(countdownRef.current);
        beepWork(); tryVibrate(300);
        if (then) then();
      }
    }, 1000);
  }, []);

  const handleStart = () => {
    try { getAudioCtx(); } catch(e) {}
    setStarted(true);
    overall.start();
    const timer = timerOverrides[0] || phases[0].timer;
    if (needsCountdown(timer)) {
      startCountdown(() => phase_timer.start());
    } else {
      phase_timer.start();
    }
  };

  const goToPhase = (idx) => {
    // Save current phase time
    setPhaseTimes(prev => ({...prev, [phaseIdx]: (prev[phaseIdx] || 0) + phase_timer.elapsed}));
    clearInterval(countdownRef.current);
    setCountdownLeft(0);
    // Cancel any active rest timer
    setRestTimerActive(false); setShowRestPicker(false); clearInterval(restIntervalRef.current);
    phase_timer.reset();
    setPhaseIdx(idx);
    if (phases[idx].type === "done") {
      overall.pause();
      return;
    }
    const timer = timerOverrides[idx] || phases[idx].timer;
    if (needsCountdown(timer)) {
      startCountdown(() => phase_timer.start());
    } else {
      setTimeout(() => phase_timer.start(), 50);
    }
  };

  const restartPhase = () => {
    clearInterval(countdownRef.current);
    setCountdownLeft(0);
    // Cancel any active rest timer
    setRestTimerActive(false); setShowRestPicker(false); clearInterval(restIntervalRef.current);
    phase_timer.reset();
    const timer = timerOverrides[phaseIdx] || phase.timer;
    if (needsCountdown(timer)) {
      startCountdown(() => phase_timer.start());
    } else {
      setTimeout(() => phase_timer.start(), 50);
    }
    tryVibrate(200);
  };

  const togglePause = () => {
    // If in countdown, pause/resume the countdown
    if (countdownLeft > 0) {
      clearInterval(countdownRef.current);
      setCountdownLeft(0);
      // Skip remaining countdown — just start the timer
      phase_timer.start();
      return;
    }
    overall.toggle();
    phase_timer.toggle();
  };

  const handleExit = () => {
    clearInterval(countdownRef.current);
    setCountdownLeft(0);
    overall.pause();
    phase_timer.pause();
    setShowExitConfirm(true);
  };

  const handleLockedExit = () => {
    // Workout is running — show a brief nudge instead of exiting
    setExitNudge(true);
    clearTimeout(exitNudgeTimer.current);
    exitNudgeTimer.current = setTimeout(() => setExitNudge(false), 2000);
  };

  // ── BACK BUTTON (Android / browser back gesture) ──
  // Push a history state when workout starts so the back button has something
  // to intercept. On popstate: running → nudge; paused → exit dialog.
  useEffect(() => {
    if (!started || isDone) return;
    history.pushState({ parkwodActive: true }, '');
    const onPop = () => {
      // Re-push immediately to prevent actual navigation
      history.pushState({ parkwodActive: true }, '');
      if (overall.running) {
        handleLockedExit();
      } else {
        handleExit();
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [started, isDone, overall.running]);

  const confirmExit = () => { clearWorkoutRecovery(); cancelSpeech(); setShowExitConfirm(false); onExit(); };
  const cancelExit = () => {
    setShowExitConfirm(false);
    if (started && !isDone) { overall.start(); phase_timer.start(); }
  };

  const handleSaveTimerSettings = (newCfg) => {
    setTimerOverrides(prev => ({...prev, [phaseIdx]: newCfg}));
  };

  // ── NOT YET STARTED ──
  if (!started) {
    return (
      <div style={sty.fsOverlay}>
        <div style={{...sty.fsTopBar, justifyContent: "flex-start"}}>
          <button onClick={onExit} style={sty.fsExitBtn}>{"\u2715"} Cancel</button>
        </div>
        <div style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, overflowY: "auto"}}>
          <div style={{fontSize: 44, marginBottom: 8}}>{"\u{1F525}"}</div>
          <div style={{fontSize: 24, fontWeight: 900, color: "#ff8a3a", marginBottom: 6}}>READY?</div>
          <div style={{fontSize: 14, color: "#888", marginBottom: 16, textAlign: "center"}}>
            #{workout.id} {"\u00B7"} {workout.equipment.toLowerCase()} {"\u00B7"} {workout.format.toLowerCase()}
          </div>
          
          <div style={{width: "100%", maxWidth: 340, marginBottom: 20}}>
            {phases.filter(p => p.timer).map((p, i) => {
              const pIdx = phases.indexOf(p);
              const overridden = timerOverrides[pIdx];
              const timer = overridden || p.timer;
              return (
                <div key={i} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#111122", borderRadius: 10, marginBottom: 6, border: `1px solid ${p.color}30`}}>
                  <div>
                    <div style={{fontSize: 11, color: p.color, fontWeight: 700, letterSpacing: 1}}>{p.title}</div>
                    <div style={{fontSize: 13, color: "#ccc"}}>{timer.label}{overridden ? " (edited)" : ""}</div>
                    {timer.type === "tabata" && <div style={{fontSize: 11, color: "#888"}}>{timer.workSeconds}s/{timer.restSeconds}s {"\u00D7"} {timer.rounds}r {"\u00D7"} {timer.stations} exercises</div>}
                    {timer.type === "tabata" && timer.exercises && <div style={{fontSize: 11, color: "#666"}}>{timer.exercises.join(", ")}</div>}
                    {timer.type === "fgb" && timer.exercises && <div style={{fontSize: 11, color: "#666"}}>{timer.exercises.length} stations: {timer.exercises.join(", ")}</div>}
                  </div>
                  <button onClick={() => { setPhaseIdx(pIdx); setSettingsModal(true); }} style={{background: "none", border: "1px solid #444", borderRadius: 8, padding: "6px 10px", color: "#888", fontSize: 12, cursor: "pointer"}}>
                    {"\u2699"}
                  </button>
                </div>
              );
            })}
          </div>
          
          {/* Estimated total time */}
          {(() => {
            const totalTimedSecs = phases.reduce((sum, p) => {
              const t = timerOverrides[phases.indexOf(p)] || p.timer;
              if (!t) return sum;
              if (t.totalSeconds) return sum + t.totalSeconds;
              if (t.type === "tabata") return sum + (t.workSeconds + t.restSeconds) * t.rounds * t.stations;
              if (t.type === "fgb") return sum + (t.stationSeconds * t.stations + t.restSeconds) * t.rounds;
              return sum;
            }, 0);
            return totalTimedSecs > 0 ? (
              <div style={{fontSize: 13, color: "#ccc", marginBottom: 8}}>
                {"\u23F1"} Estimated timed sections: <span style={{fontWeight: 800, color: "#ff8a3a"}}>{Math.round(totalTimedSecs / 60)} min</span>
                <span style={{color: "#666"}}> {"\u00B7"} {workout.duration}m total session</span>
              </div>
            ) : null;
          })()}
          <div style={{fontSize: 12, color: "#666", marginBottom: 16}}>Timed sections start with a 5-second countdown</div>
          
          <button onClick={handleStart} style={{background: "linear-gradient(135deg, #3ddc84, #2bb86a)", border: "none", borderRadius: 14, padding: "16px 40px", color: "#fff", fontSize: 18, fontWeight: 800, cursor: "pointer"}}>
            GO {"\u25B6\uFE0F"}
          </button>
        </div>
        {settingsModal && activeTimer && (
          <TimerSettingsModal config={activeTimer} onSave={handleSaveTimerSettings} onClose={() => setSettingsModal(false)} />
        )}
      </div>
    );
  }

  // ── Outdoor mode style helpers ──
  const oBg = outdoorMode ? "#f5f5f0" : "#0a0a15";
  const oText = outdoorMode ? "#000" : "#fff";
  const oSub = outdoorMode ? "#444" : "#888";
  const oBorder = outdoorMode ? "#ccc" : "#222";

  // ── ACTIVE WORKOUT ──
  return (
    <div className="fs-active" style={{...sty.fsOverlay, background: oBg, fontFamily: DS.font.body}}>
      {/* Top bar — with progress line, exit, toggles */}
      <div style={{position: "relative"}}>
        {/* Green progress line at very top */}
        <div style={{height: 3, background: outdoorMode ? "#ddd" : DS.colors.border}}>
          <div style={{height: "100%", background: DS.colors.green, borderRadius: 2, width: `${Math.min(100, (phaseIdx / Math.max(1, phases.length - 1)) * 100)}%`, transition: "width 0.5s ease"}} />
        </div>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: oBg}}>
          {/* Exit button — locked while timer is running, unlocked when paused */}
          <div style={{position: "relative"}}>
            {overall.running && !isDone ? (
              <button onClick={handleLockedExit} style={{display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px solid ${outdoorMode ? "#bbb" : "#333"}`, borderRadius: DS.radius.md, padding: "6px 12px", color: outdoorMode ? "#aaa" : "#555", fontSize: 13, fontWeight: 700, cursor: "default"}}>
                <Icon name="lock" size={15} color={outdoorMode ? "#aaa" : "#555"} /> End
              </button>
            ) : (
              <button onClick={handleExit} style={{display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px solid ${outdoorMode ? "#ccc" : DS.colors.border}`, borderRadius: DS.radius.md, padding: "6px 12px", color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer"}}>
                <Icon name="x" size={16} color="#ef4444" /> End
              </button>
            )}
            {exitNudge && (
              <div style={{position: "absolute", top: "110%", left: 0, background: outdoorMode ? "#222" : "#333", color: "#fff", padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", zIndex: 20, letterSpacing: 0.5}}>
                PAUSE FIRST ⏸
              </div>
            )}
          </div>

          {/* Elapsed time — center */}
          <div style={{display: "flex", alignItems: "center", gap: 6}}>
            <span style={{fontSize: 10, color: oSub, letterSpacing: 1, fontWeight: 700}}>TOTAL</span>
            <span style={{fontFamily: DS.font.display, fontSize: 18, letterSpacing: 1, color: oText}}>{fmt(overall.elapsed)}</span>
          </div>

          {/* Toggle buttons — outdoor, voice, audio, settings */}
          <div style={{display: "flex", gap: 4}}>
            {/* Outdoor mode toggle */}
            <button onClick={() => setOutdoorMode(o => !o)} style={{background: outdoorMode ? "#f59e0b25" : "none", border: `1px solid ${outdoorMode ? "#f59e0b" : outdoorMode ? "#ccc" : DS.colors.border}`, borderRadius: DS.radius.sm, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"}}>
              <Icon name={outdoorMode ? "sun" : "moon"} size={16} color={outdoorMode ? "#f59e0b" : DS.colors.textMuted} />
            </button>
            {/* Voice toggle */}
            <button onClick={() => setVoiceEnabled(v => !v)} style={{background: voiceEnabled ? DS.colors.purple + "25" : "none", border: `1px solid ${voiceEnabled ? DS.colors.purple : outdoorMode ? "#ccc" : DS.colors.border}`, borderRadius: DS.radius.sm, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"}}>
              <Icon name="mic" size={16} color={voiceEnabled ? DS.colors.purple : DS.colors.textMuted} />
            </button>
            {/* Audio toggle */}
            <button onClick={() => setAudioEnabled(a => !a)} style={{background: audioEnabled ? DS.colors.green + "20" : "none", border: `1px solid ${audioEnabled ? DS.colors.green + "50" : outdoorMode ? "#ccc" : DS.colors.border}`, borderRadius: DS.radius.sm, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"}}>
              <Icon name={audioEnabled ? "volume2" : "volumeX"} size={16} color={audioEnabled ? DS.colors.green : DS.colors.textMuted} />
            </button>
            {/* Timer settings — only for timed phases */}
            {activeTimer && activeTimer.type !== "stopwatch" && (
              <button onClick={() => setSettingsModal(true)} style={{background: "none", border: `1px solid ${outdoorMode ? "#ccc" : DS.colors.border}`, borderRadius: DS.radius.sm, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"}}>
                <Icon name="settings" size={16} color={oSub} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Phase label pill */}
      <div style={{textAlign: "center", padding: "8px 20px 4px"}}>
        <span style={{fontSize: 12, fontWeight: 800, color: phase.color, letterSpacing: 2, background: phase.color + "12", padding: "6px 20px", borderRadius: DS.radius.pill, display: "inline-block"}}>
          {phase.title}
        </span>
      </div>

      {/* Timer display */}
      {activeTimer && !isDone && <TimerDisplay config={activeTimer} elapsed={phase_timer.elapsed} audio={audioEnabled} countdownLeft={countdownLeft} voiceEnabled={voiceEnabled} outdoorMode={outdoorMode} fontSizeKey={fontSizeKey}
        coach={{ halfway: settings.voiceHalfway !== false, finalMinute: settings.voiceFinalMinute !== false, nextPreview: settings.voiceNextPreview !== false }} />}

      {/* Phase content */}
      <div style={{flex: 1, overflowY: "auto", paddingBottom: 90}}>
        {isDone ? (
          <div style={{textAlign: "center", padding: "20px 20px 120px", position: "relative", overflow: "hidden"}}>
            {/* Confetti animation */}
            <style>{`
              @keyframes confetti-fall { 0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
              .confetti-piece { position: absolute; width: 8px; height: 8px; top: -20px; animation: confetti-fall 3s ease-out forwards; border-radius: 2px; }
            `}</style>
            {[...Array(30)].map((_, i) => (
              <div key={i} className="confetti-piece" style={{
                left: `${Math.random() * 100}%`,
                background: ["#ff8a3a","#3ddc84","#8b5cf6","#eab308","#ef4444","#3b82f6"][i % 6],
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                width: `${6 + Math.random() * 6}px`,
                height: `${4 + Math.random() * 4}px`,
              }} />
            ))}

            {/* MISSION ACCOMPLISHED badge */}
            <div style={{display: "inline-block", background: DS.colors.green + "20", border: `1px solid ${DS.colors.green}40`, borderRadius: DS.radius.pill, padding: "8px 24px", marginBottom: 20}}>
              <span style={{fontSize: 12, fontWeight: 800, color: DS.colors.green, letterSpacing: 2}}>MISSION ACCOMPLISHED</span>
            </div>

            {/* WOD # + COMPLETE! */}
            <div style={{fontFamily: DS.font.display, fontSize: 48, color: outdoorMode ? "#111" : "#fff", letterSpacing: 2, lineHeight: 1}}>WOD #{workout.id}</div>
            <div style={{fontFamily: DS.font.display, fontSize: 52, color: DS.colors.green, letterSpacing: 2, lineHeight: 1.1, marginBottom: 12}}>COMPLETE!</div>

            {/* Session duration */}
            <div style={{fontSize: 15, color: oSub, marginBottom: 24}}>Session duration: {fmt(overall.elapsed)}</div>

            {/* Motivational message */}
            {(() => {
              const r = (workout.rating || "Medium").toLowerCase();
              const msgs = {
                easy: ["Solid warm-up!", "Great way to stay active!", "Consistency wins!"],
                medium: ["Good session!", "That's how it's done!", "Solid effort today!"],
                hard: ["That was tough — respect!", "You crushed it!", "Hard work pays off!"],
                "very hard": ["Beast mode!", "Absolute legend!", "You're a machine!"]
              };
              const options = msgs[r] || msgs.medium;
              const msg = options[workout.id % options.length];
              return <div style={{fontSize: 14, color: oSub, marginBottom: 24, fontStyle: "italic"}}>{msg}</div>;
            })()}

            {/* Stats cards — Total Rounds / Extra Reps */}
            <div style={{display: "flex", gap: 12, marginBottom: 20}}>
              <div style={{flex: 1, background: outdoorMode ? "#00000008" : DS.colors.surface, borderRadius: DS.radius.xl, padding: "18px 16px", border: `1px solid ${outdoorMode ? "#ddd" : DS.colors.border}`}}>
                <div style={{fontSize: 10, fontWeight: 700, color: oSub, letterSpacing: 1.5, marginBottom: 8}}>TOTAL ROUNDS</div>
                <div style={{fontFamily: DS.font.display, fontSize: 40, color: oText, letterSpacing: 1, lineHeight: 1}}>
                  {(() => {
                    const prevLogs = (logs || []).filter(l => l.workoutId === workout.id);
                    const last = prevLogs.length > 0 ? prevLogs.sort((a,b) => new Date(b.date)-new Date(a.date))[0] : null;
                    return last && last.rounds ? last.rounds : "0";
                  })()}
                </div>
              </div>
              <div style={{flex: 1, background: outdoorMode ? "#00000008" : DS.colors.surface, borderRadius: DS.radius.xl, padding: "18px 16px", border: `1px solid ${outdoorMode ? "#ddd" : DS.colors.border}`}}>
                <div style={{fontSize: 10, fontWeight: 700, color: oSub, letterSpacing: 1.5, marginBottom: 8}}>EXTRA REPS</div>
                <div style={{fontFamily: DS.font.display, fontSize: 40, color: oText, letterSpacing: 1, lineHeight: 1}}>
                  {(() => {
                    const prevLogs = (logs || []).filter(l => l.workoutId === workout.id);
                    const last = prevLogs.length > 0 ? prevLogs.sort((a,b) => new Date(b.date)-new Date(a.date))[0] : null;
                    return last && last.extraReps ? last.extraReps : "0";
                  })()}
                </div>
              </div>
            </div>

            {/* Phase breakdown */}
            {Object.keys(phaseTimes).length > 0 && (
              <div style={{marginBottom: 20, textAlign: "left", background: outdoorMode ? "#00000008" : DS.colors.surface, borderRadius: DS.radius.xl, padding: 16, border: `1px solid ${outdoorMode ? "#ddd" : DS.colors.border}`}}>
                <div style={{fontSize: 10, fontWeight: 700, color: oSub, letterSpacing: 1.5, marginBottom: 10}}>PHASE BREAKDOWN</div>
                {phases.filter(p => p.type !== "done").map((p, i) => {
                  const elapsed = phaseTimes[i] || 0;
                  if (elapsed === 0) return null;
                  return (
                    <div key={i} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < phases.length - 2 ? `1px solid ${outdoorMode ? "#eee" : DS.colors.border}` : "none"}}>
                      <span style={{fontSize: 13, color: p.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 6}}>
                        <div style={{width: 4, height: 16, borderRadius: 2, background: p.color}} />
                        {p.title}
                      </span>
                      <span style={{fontFamily: DS.font.display, fontSize: 18, color: oText, letterSpacing: 1}}>{fmt(elapsed)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Previous best comparison */}
            {(() => {
              const prevLogs = (logs || []).filter(l => l.workoutId === workout.id).sort((a,b) => new Date(b.date) - new Date(a.date));
              if (prevLogs.length === 0) return (
                <div style={{fontSize: 13, color: oSub, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6}}>
                  <Icon name="award" size={16} color={DS.colors.orange} /> First time doing this workout!
                </div>
              );
              const lastLog = prevLogs[0];
              const lastTime = (lastLog.totalMins || 0) * 60 + (lastLog.totalSecs || 0);
              const thisTime = overall.elapsed;
              if (lastTime > 0 && thisTime > 0) {
                const diff = thisTime - lastTime;
                return (
                  <div style={{marginBottom: 16, padding: "12px 16px", background: outdoorMode ? "#00000008" : DS.colors.surface, borderRadius: DS.radius.lg, border: `1px solid ${outdoorMode ? "#ddd" : DS.colors.border}`}}>
                    <div style={{fontSize: 11, color: oSub, marginBottom: 4}}>vs last attempt ({new Date(lastLog.date).toLocaleDateString("en-GB", {day:"numeric",month:"short"})})</div>
                    <div style={{fontSize: 18, fontWeight: 800, color: diff < 0 ? DS.colors.green : diff > 60 ? "#ef4444" : oSub, fontFamily: DS.font.display, letterSpacing: 1}}>
                      {diff < 0 ? `${fmt(Math.abs(diff))} FASTER` : diff === 0 ? "SAME TIME!" : `${fmt(diff)} SLOWER`}
                    </div>
                  </div>
                );
              }
              const lastResult = formatLogResult(lastLog);
              if (lastResult) return (
                <div style={{marginBottom: 16, fontSize: 13, color: oSub}}>Last result: <span style={{color: oText, fontWeight: 700}}>{lastResult}</span></div>
              );
              return null;
            })()}

            {/* POST-WOD ANALYSIS card */}
            <div style={{textAlign: "left", background: outdoorMode ? "#00000008" : DS.colors.surface, borderRadius: DS.radius.xl, padding: 16, marginBottom: 20, borderLeft: `3px solid ${DS.colors.green}`, border: `1px solid ${outdoorMode ? "#ddd" : DS.colors.border}`, borderLeftWidth: 3, borderLeftColor: DS.colors.green}}>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12}}>
                <div>
                  <div style={{fontFamily: DS.font.display, fontSize: 18, color: DS.colors.green, letterSpacing: 1}}>POST-WOD ANALYSIS</div>
                  <div style={{fontSize: 12, color: oSub, marginTop: 2}}>Your performance vs. average</div>
                </div>
                <Icon name="trendingUp" size={22} color={DS.colors.green} />
              </div>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10}}>
                <span style={{fontSize: 13, fontWeight: 600, color: oText}}>Intensity</span>
                <div style={{display: "flex", gap: 4}}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{width: 32, height: 6, borderRadius: 3, background: i < 3 ? DS.colors.green : (outdoorMode ? "#ddd" : DS.colors.border)}} />
                  ))}
                </div>
              </div>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                <span style={{fontSize: 13, fontWeight: 600, color: oText}}>Consistency</span>
                <span style={{fontSize: 14, fontWeight: 800, color: DS.colors.green}}>
                  {(() => {
                    const wLogs = (logs || []).filter(l => l.workoutId === workout.id);
                    if (wLogs.length <= 1) return "+0%";
                    return `+${Math.min(99, wLogs.length * 6)}%`;
                  })()}
                </span>
              </div>
            </div>

            {/* SAVE SESSION button — concept orange */}
            {onLogWorkout && (
              <button onClick={() => { clearWorkoutRecovery(); onLogWorkout(overall.elapsed); }} style={{
                width: "100%", padding: "18px 24px", borderRadius: DS.radius.xl,
                background: DS.gradient.orange, border: "none",
                color: "#fff", fontSize: 18, fontWeight: 800, cursor: "pointer",
                fontFamily: DS.font.display, letterSpacing: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12,
              }}>
                SAVE SESSION <Icon name="checkCircle" size={20} color="#fff" />
              </button>
            )}

            {/* Discard entry */}
            <button onClick={() => { clearWorkoutRecovery(); onExit(); }} style={{
              background: "none", border: "none", color: oSub, fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, fontFamily: DS.font.display, padding: "8px 0",
            }}>
              DISCARD ENTRY
            </button>
          </div>
        ) : (
          <div style={{padding: "8px 20px"}}>
            {/* Current Set card — shows the current exercise prominently */}
            {(() => {
              const lines = phase.content.split("\n").filter(l => l.trim());
              if (lines.length === 0) return null;
              // Show first meaningful line as "current set" card
              const firstLine = lines[0];
              return (
                <div style={{background: outdoorMode ? "#00000008" : phase.color + "08", borderRadius: DS.radius.xl, padding: "16px 18px", marginBottom: 12, borderLeft: `4px solid ${phase.color}`, position: "relative"}}>
                  <div style={{fontSize: 11, fontWeight: 700, color: phase.color, letterSpacing: 1.5, marginBottom: 6}}>CURRENT SET</div>
                  <div style={{fontSize: fs.base + 2, fontWeight: 700, color: oText, lineHeight: 1.5}}>
                    <HighlightedText text={firstLine} onExerciseTap={setExerciseModal} />
                  </div>
                </div>
              );
            })()}
            {phase.content.split("\n").filter(l => l.trim()).slice(1).map((line, i) => (
              <div key={i} style={{fontSize: fs.base, color: outdoorMode ? "#111" : "#e8e8e8", lineHeight: 1.7, marginBottom: 8, padding: "10px 14px", background: outdoorMode ? "#00000005" : "#ffffff05", borderRadius: DS.radius.md, borderLeft: `3px solid ${phase.color}25`}}>
                <HighlightedText text={line} onExerciseTap={setExerciseModal} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating REST button — for stopwatch/rounds phases */}
      {started && !isDone && activeTimer && activeTimer.type === "stopwatch" && !restTimerActive && !showRestPicker && (
        <button onClick={() => setShowRestPicker(true)} style={{
          position: "absolute", right: 16, bottom: 100, zIndex: 20,
          background: "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", borderRadius: 50,
          width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
          boxShadow: "0 4px 15px rgba(59,130,246,0.4)",
        }}>REST</button>
      )}

      {/* Rest duration picker overlay */}
      {showRestPicker && (
        <div style={{position: "absolute", inset: 0, zIndex: 30, background: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16}} onClick={() => setShowRestPicker(false)}>
          <div style={{fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8}}>Rest Timer</div>
          {[30, 60, 90, 120].map(s => (
            <button key={s} onClick={(e) => { e.stopPropagation(); startRestTimer(s); }} style={{
              width: 200, padding: "16px 24px", borderRadius: 14, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 18, fontWeight: 800,
            }}>{s}s</button>
          ))}
          <button onClick={() => setShowRestPicker(false)} style={{
            marginTop: 8, padding: "12px 24px", borderRadius: 12, border: "1px solid #666",
            background: "none", color: "#888", fontSize: 14, cursor: "pointer",
          }}>Cancel</button>
        </div>
      )}

      {/* Active rest timer overlay */}
      {restTimerActive && (
        <div style={{position: "absolute", inset: 0, zIndex: 25, background: "rgba(0,0,20,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}} onClick={() => { setRestTimerActive(false); clearInterval(restIntervalRef.current); }}>
          <div style={{fontSize: 14, fontWeight: 700, color: "#3b82f6", letterSpacing: 1, marginBottom: 12}}>REST</div>
          <div style={{fontSize: 80, fontWeight: 900, color: restTimerLeft <= 3 ? "#ef4444" : "#fff", fontVariantNumeric: "tabular-nums", transition: "color 0.3s"}}>{restTimerLeft}</div>
          <div style={{width: 200, height: 6, background: "#333", borderRadius: 3, marginTop: 20, overflow: "hidden"}}>
            <div style={{height: "100%", background: restTimerLeft <= 3 ? "#ef4444" : "#3b82f6", borderRadius: 3, width: `${(restTimerLeft / restTimerDuration) * 100}%`, transition: "width 1s linear"}} />
          </div>
          <div style={{fontSize: 12, color: "#666", marginTop: 16}}>Tap anywhere to cancel</div>
        </div>
      )}

      {/* Bottom controls — hidden on done screen since it has its own CTA buttons */}
      {!isDone && (
      <div style={{position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, padding: "14px 16px 28px", background: outdoorMode ? "linear-gradient(transparent, #f5f5f0 30%)" : "linear-gradient(transparent, #0a0a0f 30%)"}}>
        {phaseIdx > 0 && (
          <button onClick={() => goToPhase(phaseIdx - 1)} style={{width: 52, height: 52, background: outdoorMode ? "#00000008" : DS.colors.surface, border: `1px solid ${outdoorMode ? "#ccc" : DS.colors.border}`, borderRadius: DS.radius.lg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"}}>
            <Icon name="skipBack" size={20} color={outdoorMode ? "#333" : DS.colors.textSub} />
          </button>
        )}
          <button onClick={restartPhase} style={{width: 52, height: 52, background: outdoorMode ? "#00000008" : DS.colors.surface, border: `1px solid ${outdoorMode ? "#ccc" : DS.colors.border}`, borderRadius: DS.radius.lg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"}} title="Restart this phase">
            <Icon name="rotateCcw" size={18} color={outdoorMode ? "#333" : DS.colors.textMuted} />
          </button>
          <button onClick={togglePause} style={{
            border: "none", borderRadius: DS.radius.xl, padding: "16px 36px", fontSize: 15, fontWeight: 800, cursor: "pointer", minWidth: 160,
            background: (phase_timer.running || countdownLeft > 0) ? DS.gradient.orange : DS.colors.green + "20",
            color: (phase_timer.running || countdownLeft > 0) ? "#fff" : DS.colors.green,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            letterSpacing: 1,
          }}>
            <Icon name={(phase_timer.running || countdownLeft > 0) ? "pause" : "play"} size={18} color={(phase_timer.running || countdownLeft > 0) ? "#fff" : DS.colors.green} />
            {(phase_timer.running || countdownLeft > 0) ? "PAUSE SESSION" : "RESUME"}
          </button>
        <button onClick={() => goToPhase(phaseIdx + 1)} style={{
          width: 52, height: 52, border: "none", borderRadius: DS.radius.lg, cursor: "pointer",
          background: `linear-gradient(135deg, ${phases[Math.min(phaseIdx+1,phases.length-1)].color}, ${phase.color})`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="skipForward" size={20} color="#fff" />
        </button>
      </div>
      )}

      {/* Finish block early text link */}
      {!isDone && started && (
        <div style={{position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center"}}>
          <button onClick={() => goToPhase(phases.length - 1)} style={{background: "none", border: "none", color: DS.colors.green, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5, display: "inline-flex", alignItems: "center", gap: 4}}>
            <Icon name="checkCircle" size={12} color={DS.colors.green} /> FINISH BLOCK EARLY
          </button>
        </div>
      )}

      {exerciseModal && <ExerciseModal exerciseKey={exerciseModal} onClose={() => setExerciseModal(null)} />}
      {settingsModal && activeTimer && <TimerSettingsModal config={activeTimer} onSave={handleSaveTimerSettings} onClose={() => setSettingsModal(false)} />}
      {showExitConfirm && (
        <div style={sty.modalOverlay} onClick={cancelExit}>
          <div style={{...sty.modalContent, maxWidth: 300, textAlign: "center"}} onClick={e => e.stopPropagation()}>
            <div style={{fontSize: 36, marginBottom: 12}}>{"\u{23F8}\uFE0F"}</div>
            <div style={{fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8}}>End workout?</div>
            <div style={{fontSize: 14, color: "#888", marginBottom: 20}}>You've been going for {fmt(overall.elapsed)}. Your progress won't be saved yet.</div>
            <div style={{display: "flex", gap: 10}}>
              <button onClick={cancelExit} style={{flex: 1, background: "#3ddc8425", border: "1px solid #3ddc8450", borderRadius: 12, padding: "14px 16px", color: "#3ddc84", fontSize: 15, fontWeight: 700, cursor: "pointer"}}>
                Keep Going
              </button>
              <button onClick={confirmExit} style={{flex: 1, background: "#ef444425", border: "1px solid #ef444450", borderRadius: 12, padding: "14px 16px", color: "#ef4444", fontSize: 15, fontWeight: 700, cursor: "pointer"}}>
                End It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// Timer styles
const ts = {
  timerBlock: { textAlign: "center", padding: "12px 20px 10px" },
  timerLabel: { fontSize: 11, fontWeight: 700, color: DS.colors.textMuted, letterSpacing: 2.5, marginBottom: 4, textTransform: "uppercase" },
  timerBig: { fontFamily: DS.font.display, fontSize: 80, fontVariantNumeric: "tabular-nums", lineHeight: 1, color: "#fff", letterSpacing: 4 },
  barBg: { width: "100%", height: 4, background: DS.colors.border, borderRadius: 2, marginTop: 10, overflow: "hidden" },
  barFill: { height: "100%", background: DS.colors.orange, borderRadius: 2, transition: "width 1s linear" },
  setLabel: { display: "block", fontSize: 12, color: DS.colors.textMuted, marginBottom: 4, fontWeight: 600 },
  setInput: { width: "100%", background: DS.colors.surface, border: "1px solid " + DS.colors.border, borderRadius: DS.radius.md, padding: "10px 14px", color: "#fff", fontSize: 15, boxSizing: "border-box", fontFamily: DS.font.body },
};



// ═══════════════════════════════════════════════════════════════
// LOG WORKOUT MODAL
// ═══════════════════════════════════════════════════════════════
function LogWorkoutModal({ workout, onSave, onClose, existingLog, diffOverrides, onSetDifficulty, elapsedSecs }) {
  const w = workout;
  const rf = getResultFields(w.format);
  const currentRating = diffOverrides[w.id] || w.rating;
  
  // Auto-fill time: use elapsed from timer if available, otherwise existing log, otherwise workout duration
  const autoMins = elapsedSecs ? Math.floor(elapsedSecs / 60) : null;
  const autoSecs = elapsedSecs ? elapsedSecs % 60 : null;
  const [date, setDate] = useState(existingLog?.date || new Date().toISOString().split("T")[0]);
  const [difficulty, setDifficulty] = useState(existingLog?.difficulty || currentRating);
  const [totalMins, setTotalMins] = useState(existingLog?.totalMins || autoMins || w.duration || "");
  const [totalSecs, setTotalSecs] = useState(existingLog?.totalSecs || autoSecs || 0);
  const [rounds, setRounds] = useState(existingLog?.rounds || "");
  const [extraReps, setExtraReps] = useState(existingLog?.extraReps || "");
  const [completionMins, setCompletionMins] = useState(existingLog?.completionMins || "");
  const [completionSecs, setCompletionSecs] = useState(existingLog?.completionSecs || "");
  const [ladderProgress, setLadderProgress] = useState(existingLog?.ladderProgress || "");
  const [totalReps, setTotalReps] = useState(existingLog?.totalReps || "");
  const [roundsCompleted, setRoundsCompleted] = useState(existingLog?.roundsCompleted || "");
  const [cardsCompleted, setCardsCompleted] = useState(existingLog?.cardsCompleted || "");
  const [generalResult, setGeneralResult] = useState(existingLog?.generalResult || "");
  const [notes, setNotes] = useState(existingLog?.notes || "");

  const handleSave = () => {
    const entry = {
      id: existingLog?.id || genId(),
      workoutId: w.id,
      date,
      difficulty,
      totalMins: parseInt(totalMins) || 0,
      totalSecs: parseInt(totalSecs) || 0,
      rounds: rounds !== "" ? parseInt(rounds) : null,
      extraReps: extraReps !== "" ? parseInt(extraReps) : null,
      completionMins: completionMins !== "" ? parseInt(completionMins) : null,
      completionSecs: completionSecs !== "" ? parseInt(completionSecs) : null,
      ladderProgress: ladderProgress || null,
      totalReps: totalReps !== "" ? parseInt(totalReps) : null,
      roundsCompleted: roundsCompleted !== "" ? parseInt(roundsCompleted) : null,
      cardsCompleted: cardsCompleted !== "" ? parseInt(cardsCompleted) : null,
      generalResult: generalResult || null,
      notes: notes || null,
      format: w.format,
      createdAt: existingLog?.createdAt || new Date().toISOString(),
    };
    // If difficulty changed, save the override
    if (difficulty !== w.rating) {
      onSetDifficulty(w.id, difficulty);
    }
    onSave(entry);
    onClose();
  };

  const inputSty = { width: "100%", background: "#111122", border: "1px solid #444", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 15, boxSizing: "border-box", outline: "none" };
  const labelSty = { display: "block", fontSize: 12, color: "#888", marginBottom: 4, fontWeight: 600 };
  const fieldGap = { marginBottom: 14 };

  return (
    <div style={sty.modalOverlay} onClick={onClose}>
      <div style={{...sty.modalContent, maxWidth: 400, maxHeight: "85vh"}} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={sty.modalClose}>{"\u2715"}</button>
        <div style={{fontSize: 20, fontWeight: 800, color: "#ff8a3a", marginBottom: 2}}>
          {existingLog ? "Edit Log" : "Log Workout"}
        </div>
        <div style={{fontSize: 14, color: "#888", marginBottom: 16}}>#{w.id} \u00B7 {w.format.toLowerCase()} \u00B7 {w.focus.toLowerCase()}</div>

        {/* Date */}
        <div style={fieldGap}>
          <label style={labelSty}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{...inputSty, colorScheme: "dark"}} />
        </div>

        {/* Difficulty override */}
        <div style={fieldGap}>
          <label style={labelSty}>Difficulty</label>
          <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
            {ALL_RATINGS.map(r => (
              <button key={r} onClick={() => setDifficulty(r)} style={{
                padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: difficulty === r ? DIFFICULTY_COLORS[r] + "30" : "#1a1a2e",
                border: `1px solid ${difficulty === r ? DIFFICULTY_COLORS[r] : "#444"}`,
                color: difficulty === r ? DIFFICULTY_COLORS[r] : "#888",
              }}>{r}</button>
            ))}
          </div>
        </div>

        {/* Total session time */}
        <div style={fieldGap}>
          <label style={labelSty}>Total Session Time</label>
          <div style={{display: "flex", gap: 8, alignItems: "center"}}>
            <input type="number" placeholder="min" value={totalMins} onChange={e => setTotalMins(e.target.value)} style={{...inputSty, flex: 1}} min="0" />
            <span style={{color: "#666", fontSize: 13}}>min</span>
            <input type="number" placeholder="sec" value={totalSecs} onChange={e => setTotalSecs(e.target.value)} style={{...inputSty, flex: 1}} min="0" max="59" />
            <span style={{color: "#666", fontSize: 13}}>sec</span>
          </div>
        </div>

        {/* Format-specific result fields */}
        <div style={{padding: "12px 14px", background: "#0d0d1a", borderRadius: 12, border: "1px solid #333", marginBottom: 14}}>
          <div style={{fontSize: 11, fontWeight: 700, color: "#ff8a3a", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase"}}>{rf.label}</div>
          
          {rf.type === "amrap" && (
            <div style={{display: "flex", gap: 8, alignItems: "center"}}>
              <div style={{flex: 1}}>
                <label style={{...labelSty, fontSize: 11}}>Rounds</label>
                <input type="number" placeholder="0" value={rounds} onChange={e => setRounds(e.target.value)} style={inputSty} min="0" />
              </div>
              <span style={{color: "#666", fontSize: 18, paddingTop: 16}}>+</span>
              <div style={{flex: 1}}>
                <label style={{...labelSty, fontSize: 11}}>Extra Reps</label>
                <input type="number" placeholder="0" value={extraReps} onChange={e => setExtraReps(e.target.value)} style={inputSty} min="0" />
              </div>
            </div>
          )}
          {rf.type === "fortime" && (
            <div style={{display: "flex", gap: 8, alignItems: "center"}}>
              <input type="number" placeholder="min" value={completionMins} onChange={e => setCompletionMins(e.target.value)} style={{...inputSty, flex: 1}} min="0" />
              <span style={{color: "#666", fontSize: 13}}>:</span>
              <input type="number" placeholder="sec" value={completionSecs} onChange={e => setCompletionSecs(e.target.value)} style={{...inputSty, flex: 1}} min="0" max="59" />
            </div>
          )}
          {rf.type === "ladder" && (
            <input type="text" placeholder="e.g. Completed down to round of 6" value={ladderProgress} onChange={e => setLadderProgress(e.target.value)} style={inputSty} />
          )}
          {rf.type === "reps" && (
            <input type="number" placeholder="Total reps scored" value={totalReps} onChange={e => setTotalReps(e.target.value)} style={inputSty} min="0" />
          )}
          {(rf.type === "emom" || rf.type === "rounds") && (
            <input type="number" placeholder="Rounds completed" value={roundsCompleted} onChange={e => setRoundsCompleted(e.target.value)} style={inputSty} min="0" />
          )}
          {rf.type === "cards" && (
            <input type="number" placeholder="Cards completed" value={cardsCompleted} onChange={e => setCardsCompleted(e.target.value)} style={inputSty} min="0" />
          )}
          {rf.type === "general" && (
            <input type="text" placeholder="Result" value={generalResult} onChange={e => setGeneralResult(e.target.value)} style={inputSty} />
          )}
        </div>

        {/* Notes */}
        <div style={fieldGap}>
          <label style={labelSty}>Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it feel? Any modifications?" style={{...inputSty, minHeight: 60, resize: "vertical", fontFamily: "inherit"}} />
        </div>

        {/* Save / Cancel */}
        <div style={{display: "flex", gap: 8}}>
          <button onClick={onClose} style={{flex: 1, background: "#333", border: "1px solid #555", borderRadius: 12, padding: "14px 16px", color: "#999", fontSize: 15, fontWeight: 600, cursor: "pointer"}}>Cancel</button>
          <button onClick={handleSave} style={{flex: 1, background: "linear-gradient(135deg, #ff8a3a, #e8722a)", border: "none", borderRadius: 12, padding: "14px 16px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer"}}>
            {existingLog ? "Update" : "Save Log"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Format a log result into a readable string
function formatLogResult(log) {
  if (!log) return "";
  const parts = [];
  const rf = getResultFields(log.format);
  if (rf.type === "amrap" && log.rounds != null) {
    parts.push(`${log.rounds} rounds${log.extraReps ? ` + ${log.extraReps} reps` : ""}`);
  }
  if (rf.type === "fortime" && log.completionMins != null) {
    parts.push(`${log.completionMins}:${(log.completionSecs || 0).toString().padStart(2, "0")}`);
  }
  if (rf.type === "ladder" && log.ladderProgress) parts.push(log.ladderProgress);
  if (rf.type === "reps" && log.totalReps != null) parts.push(`${log.totalReps} reps`);
  if ((rf.type === "emom" || rf.type === "rounds") && log.roundsCompleted != null) parts.push(`${log.roundsCompleted} rounds`);
  if (rf.type === "cards" && log.cardsCompleted != null) parts.push(`${log.cardsCompleted} cards`);
  if (rf.type === "general" && log.generalResult) parts.push(log.generalResult);
  return parts.join(" \u00B7 ");
}

// ═══════════════════════════════════════════════════════════════
// STATS VIEW — consistency, PBs, most-trained, breakdowns
// ═══════════════════════════════════════════════════════════════
function StatsView({ logs, onSelectWorkout }) {
  const s = useMemo(() => {
    const MS = 86400000;
    const dayKey = (dt) => { const d = new Date(dt); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
    const days = [...new Set(logs.map(l => dayKey(l.date)))].sort();
    // best-ever streak: longest run of consecutive days
    let best = 0, run = 0, prevT = null;
    for (const d of days) {
      const t = new Date(d + "T12:00:00").getTime();
      run = (prevT !== null && Math.round((t - prevT) / MS) === 1) ? run + 1 : 1;
      if (run > best) best = run;
      prevT = t;
    }
    // current streak: consecutive days ending today or yesterday
    const set = new Set(days);
    let cur = 0;
    const anchor = set.has(dayKey(Date.now())) ? Date.now() : (set.has(dayKey(Date.now() - MS)) ? Date.now() - MS : null);
    if (anchor !== null) { let t = anchor; while (set.has(dayKey(t))) { cur++; t -= MS; } }
    // sessions per week, last 12 weeks (Monday-based)
    const now = new Date();
    const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0);
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(monday); start.setDate(monday.getDate() - i * 7);
      const end = new Date(start); end.setDate(start.getDate() + 7);
      weeks.push({ label: `${start.getDate()}/${start.getMonth() + 1}`, count: logs.filter(l => { const d = new Date(l.date); return d >= start && d < end; }).length, isThisWeek: i === 0 });
    }
    // per-workout: PBs (2+ attempts) and most-trained
    const byWorkout = {};
    for (const l of logs) (byWorkout[l.workoutId] = byWorkout[l.workoutId] || []).push(l);
    const bestLog = (group) => {
      const rf = getResultFields(group[0].format);
      if (!rf) return null;
      const score = (l) =>
        rf.type === "amrap" ? (l.rounds != null ? l.rounds * 1000 + (l.extraReps || 0) : null) :
        rf.type === "fortime" ? (l.completionMins != null ? -((l.completionMins * 60) + (l.completionSecs || 0)) : null) :
        rf.type === "reps" ? (l.totalReps != null ? l.totalReps : null) :
        (rf.type === "rounds" || rf.type === "emom") ? (l.roundsCompleted != null ? l.roundsCompleted : null) : null;
      let bl = null, bs = null;
      for (const l of group) { const sc = score(l); if (sc == null) continue; if (bs === null || sc > bs) { bs = sc; bl = l; } }
      return bl;
    };
    const pbs = Object.entries(byWorkout)
      .filter(([, g]) => g.length >= 2)
      .map(([id, g]) => ({ workoutId: Number(id), log: bestLog(g), count: g.length }))
      .filter(x => x.log)
      .sort((a, b) => new Date(b.log.date) - new Date(a.log.date))
      .slice(0, 8);
    const most = Object.entries(byWorkout)
      .map(([id, g]) => ({ workoutId: Number(id), count: g.length, last: g.reduce((m, l) => Math.max(m, +new Date(l.date)), 0), best: bestLog(g) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const tally = (arr) => { const m = {}; for (const x of arr) if (x) m[x] = (m[x] || 0) + 1; return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6); };
    const byFormat = tally(logs.map(l => { const w = findWorkout(l.workoutId); return (l.format || (w && w.format) || "").toUpperCase(); }));
    const byFocus = tally(logs.map(l => { const w = findWorkout(l.workoutId); return w && w.focus; }));
    return { cur, best, weeks, pbs, most, byFormat, byFocus };
  }, [logs]);

  const card = { background: "#111122", border: "1px solid #222", borderRadius: 14, padding: 16, marginBottom: 12 };
  const heading = { fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: 1.5, marginBottom: 12 };
  const maxWeek = Math.max(1, ...s.weeks.map(w => w.count));
  const wName = (id) => { const w = findWorkout(id); if (!w) return `#${id}`; return w.custom ? w.name : `#${w.id} · ${w.focus}`; };
  const daysAgo = (t) => { const d = Math.floor((Date.now() - t) / 86400000); return d === 0 ? "today" : d === 1 ? "yesterday" : `${d}d ago`; };
  const bar = (label, count, max, color) => (
    <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: "#888", width: 82, textAlign: "right", textTransform: "lowercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 14, background: "#1a1a2e", borderRadius: 7 }}>
        <div style={{ width: `${(count / max) * 100}%`, height: "100%", background: color, borderRadius: 7, minWidth: 4 }} />
      </div>
      <span style={{ fontSize: 12, color: "#aaa", width: 24, fontWeight: 700 }}>{count}</span>
    </div>
  );

  if (logs.length < 3) {
    return <div style={{ ...card, textAlign: "center", padding: 32 }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{"\u{1F4CA}"}</div>
      <div style={{ fontSize: 14, color: "#888" }}>Log a few more workouts and your stats will appear here.</div>
    </div>;
  }

  return (
    <div style={{ marginBottom: 80 }}>
      {/* Consistency */}
      <div style={card}>
        <div style={heading}>CONSISTENCY</div>
        <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
          <div><div style={{ fontSize: 30, fontWeight: 900, color: "#ff8a3a" }}>{s.cur}</div><div style={{ fontSize: 11, color: "#888" }}>CURRENT STREAK</div></div>
          <div><div style={{ fontSize: 30, fontWeight: 900, color: "#3ddc84" }}>{s.best}</div><div style={{ fontSize: 11, color: "#888" }}>BEST STREAK</div></div>
        </div>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>Sessions per week — last 12 weeks</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 64 }}>
          {s.weeks.map((w, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              {w.count > 0 && <span style={{ fontSize: 9, color: w.isThisWeek ? "#ff8a3a" : "#666", fontWeight: 700 }}>{w.count}</span>}
              <div style={{ width: "100%", borderRadius: 3, background: w.isThisWeek ? "#ff8a3a" : "#8b5cf6", opacity: w.count ? 1 : 0.15, height: Math.max(4, (w.count / maxWeek) * 44) }} />
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div style={card}>
        <div style={heading}>BADGES</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { need: 10, type: "count", label: "10 Sessions", icon: "\u{1F949}" },
            { need: 25, type: "count", label: "25 Sessions", icon: "\u{1F948}" },
            { need: 50, type: "count", label: "50 Sessions", icon: "\u{1F947}" },
            { need: 100, type: "count", label: "100 Sessions", icon: "\u{1F3C6}" },
            { need: 250, type: "count", label: "250 Sessions", icon: "\u{1F48E}" },
            { need: 3, type: "streak", label: "3-Day Streak", icon: "\u{1F525}" },
            { need: 7, type: "streak", label: "7-Day Streak", icon: "\u{1F525}" },
            { need: 14, type: "streak", label: "14-Day Streak", icon: "⚡" },
            { need: 30, type: "streak", label: "30-Day Streak", icon: "\u{1F31F}" },
          ].map(b => {
            const earned = b.type === "count" ? logs.length >= b.need : s.best >= b.need;
            let earnedDate = null;
            if (earned && b.type === "count") {
              const nth = [...logs].sort((x, y) => new Date(x.date) - new Date(y.date))[b.need - 1];
              if (nth) earnedDate = new Date(nth.date).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
            }
            return (
              <div key={b.label} style={{
                background: earned ? "#1a1a2e" : "#0d0d18", border: `1px solid ${earned ? "#eab30850" : "#1a1a2e"}`,
                borderRadius: 12, padding: "10px 6px", textAlign: "center", opacity: earned ? 1 : 0.45,
              }}>
                <div style={{ fontSize: 22, filter: earned ? "none" : "grayscale(1)" }}>{b.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: earned ? "#eab308" : "#555", marginTop: 3 }}>{b.label}</div>
                <div style={{ fontSize: 9, color: "#666", minHeight: 11 }}>{earnedDate || (earned ? "earned" : "")}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personal bests */}
      <div style={card}>
        <div style={heading}>PERSONAL BESTS</div>
        {s.pbs.length === 0 && <div style={{ fontSize: 13, color: "#666" }}>Repeat a workout to set your first PB.</div>}
        {s.pbs.map(p => (
          <button key={p.workoutId} onClick={() => { const w = findWorkout(p.workoutId); if (w) onSelectWorkout(w); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", borderBottom: "1px solid #1a1a2e", padding: "10px 0", cursor: "pointer" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#ff8a3a" }}>{wName(p.workoutId)}</div>
              <div style={{ fontSize: 11, color: "#666" }}>{p.count} attempts · set {new Date(p.log.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#3ddc84" }}>{"\u{1F3C6}"} {formatLogResult(p.log)}</div>
          </button>
        ))}
      </div>

      {/* Most trained */}
      <div style={card}>
        <div style={heading}>MOST TRAINED</div>
        {s.most.map(m => (
          <button key={m.workoutId} onClick={() => { const w = findWorkout(m.workoutId); if (w) onSelectWorkout(w); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", borderBottom: "1px solid #1a1a2e", padding: "10px 0", cursor: "pointer" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{wName(m.workoutId)}</div>
              <div style={{ fontSize: 11, color: "#666" }}>last done {daysAgo(m.last)}{m.best ? ` · best: ${formatLogResult(m.best)}` : ""}</div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#8b5cf6" }}>{m.count}{"×"}</div>
          </button>
        ))}
      </div>

      {/* Breakdown */}
      <div style={card}>
        <div style={heading}>BY FORMAT</div>
        {s.byFormat.map(([label, count]) => bar(label, count, s.byFormat[0][1], "#ff8a3a"))}
        <div style={{ ...heading, marginTop: 16 }}>BY FOCUS</div>
        {s.byFocus.map(([label, count]) => bar(label, count, s.byFocus[0][1], "#8b5cf6"))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HISTORY SCREEN
// ═══════════════════════════════════════════════════════════════
function HistoryScreen({ logs, diffOverrides, onSelectWorkout, onEditLog, onDeleteLog }) {
  const [viewMode, setViewMode] = useState("list");
  const [historySearch, setHistorySearch] = useState("");
  const [selectedDay, setSelectedDay] = useState(null); // date string "2026-03-21"
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,"0")}`;
  });

  const sortedLogs = useMemo(() => {
    let filtered = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (historySearch) {
      const s = historySearch.toLowerCase();
      filtered = filtered.filter(l => {
        const w = findWorkout(l.workoutId);
        if (!w) return false;
        return w.id.toString().includes(s) || w.format.toLowerCase().includes(s) || w.focus.toLowerCase().includes(s) || 
               w.equipment.toLowerCase().includes(s) || (l.notes || "").toLowerCase().includes(s);
      });
    }
    if (selectedDay) {
      filtered = filtered.filter(l => l.date === selectedDay);
    }
    return filtered;
  }, [logs, historySearch, selectedDay]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = logs.filter(l => {
      const d = new Date(l.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const thisWeek = logs.filter(l => {
      const d = new Date(l.date);
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    });
    const totalTime = logs.reduce((sum, l) => sum + (l.totalMins || 0), 0);
    return { total: logs.length, thisMonth: thisMonth.length, thisWeek: thisWeek.length, totalHours: Math.round(totalTime / 60) };
  }, [logs]);

  // Calendar data
  const calendarData = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDow = firstDay.getDay(); // 0=Sun
    const days = [];
    // Pad beginning
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${month.toString().padStart(2,"0")}-${d.toString().padStart(2,"0")}`;
      const dayLogs = logs.filter(l => l.date === dateStr);
      days.push({ day: d, date: dateStr, logs: dayLogs });
    }
    return days;
  }, [selectedMonth, logs]);

  const changeMonth = (delta) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}`);
  };

  const monthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }, [selectedMonth]);

  const [confirmDelete, setConfirmDelete] = useState(null);

  if (logs.length === 0) {
    return (
      <div style={sty.content}>
        <div style={{textAlign: "center", padding: "60px 20px"}}>
          <div style={{fontSize: 56, marginBottom: 16}}>{"\u{1F4CB}"}</div>
          <div style={{fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8}}>No Workouts Logged Yet</div>
          <div style={{fontSize: 14, color: "#888", lineHeight: 1.6}}>After doing a workout, tap "Log Workout" on its detail page to record your results.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={sty.content}>
      {/* Stats bar */}
      <div style={{display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap"}}>
        {[
          { label: "Total", value: stats.total, color: "#ff8a3a" },
          { label: "This Week", value: stats.thisWeek, color: "#3ddc84" },
          { label: "This Month", value: stats.thisMonth, color: "#eab308" },
          { label: "Hours", value: stats.totalHours, color: "#8b5cf6" },
        ].map(s => (
          <div key={s.label} style={{...sty.statCard, borderColor: s.color + "40", flex: "1 1 70px"}}>
            <div style={{fontSize: 11, color: s.color, fontWeight: 600}}>{s.label}</div>
            <div style={{fontSize: 22, fontWeight: 800, color: "#fff"}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{marginBottom: 12}}>
        <input type="text" placeholder="Search by workout #, format, focus..." value={historySearch} onChange={e => { setHistorySearch(e.target.value); setSelectedDay(null); }} style={{...sty.searchInput, fontSize: 13, padding: "10px 14px"}} />
      </div>
      {selectedDay && (
        <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 12}}>
          <span style={{fontSize: 13, color: "#ff8a3a", fontWeight: 700}}>Showing: {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
          <button onClick={() => setSelectedDay(null)} style={{background: "none", border: "1px solid #444", borderRadius: 8, padding: "3px 8px", color: "#888", fontSize: 11, cursor: "pointer"}}>Clear</button>
        </div>
      )}

      {/* View toggle */}
      <div style={{display: "flex", gap: 6, marginBottom: 16}}>
        {["list", "calendar", "stats"].map(mode => (
          <button key={mode} onClick={() => setViewMode(mode)} style={{
            flex: 1, padding: "10px 12px", borderRadius: 10, border: `1px solid ${viewMode === mode ? "#ff8a3a" : "#333"}`,
            background: viewMode === mode ? "#ff8a3a20" : "#111122", color: viewMode === mode ? "#ff8a3a" : "#888",
            fontSize: 13, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
          }}>{mode === "list" ? "\u{1F4CB} List" : mode === "calendar" ? "\u{1F4C5} Calendar" : "\u{1F4CA} Stats"}</button>
        ))}
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div style={{marginBottom: 20}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12}}>
            <button onClick={() => changeMonth(-1)} style={{background: "none", border: "1px solid #444", borderRadius: 8, padding: "6px 12px", color: "#ccc", cursor: "pointer"}}>{"\u2190"}</button>
            <div style={{fontSize: 16, fontWeight: 700, color: "#fff"}}>{monthLabel}</div>
            <button onClick={() => changeMonth(1)} style={{background: "none", border: "1px solid #444", borderRadius: 8, padding: "6px 12px", color: "#ccc", cursor: "pointer"}}>{"\u2192"}</button>
          </div>
          <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 4}}>
            {["S","M","T","W","T","F","S"].map((d,i) => (
              <div key={i} style={{textAlign: "center", fontSize: 11, color: "#666", fontWeight: 600, padding: 4}}>{d}</div>
            ))}
          </div>
          <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3}}>
            {calendarData.map((cell, i) => {
              const todayStr = new Date().toISOString().split("T")[0];
              const isToday = cell?.date === todayStr;
              return (
              <div key={i} onClick={() => { if (cell?.logs?.length) { setSelectedDay(selectedDay === cell.date ? null : cell.date); setViewMode("list"); } }} style={{
                aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                background: cell?.date === selectedDay ? "#ff8a3a40" : cell?.logs?.length ? "#ff8a3a20" : isToday ? "#3ddc8410" : "#111122", borderRadius: 8,
                border: cell?.date === selectedDay ? "2px solid #ff8a3a" : isToday ? "2px solid #3ddc8450" : cell?.logs?.length ? "1px solid #ff8a3a50" : "1px solid #1a1a2e",
                cursor: cell?.logs?.length ? "pointer" : "default",
              }}>
                {cell && <span style={{fontSize: 12, color: isToday ? "#3ddc84" : cell.logs.length ? "#ff8a3a" : "#666", fontWeight: (cell.logs.length || isToday) ? 700 : 400}}>{cell.day}</span>}
                {cell?.logs?.length > 0 && <div style={{width: 6, height: 6, borderRadius: 3, background: "#ff8a3a", marginTop: 2}} />}
                {cell?.logs?.length > 1 && <span style={{fontSize: 8, color: "#ff8a3a", fontWeight: 800}}>{cell.logs.length}</span>}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats View */}
      {viewMode === "stats" && <StatsView logs={logs} onSelectWorkout={onSelectWorkout} />}

      {/* List View */}
      {viewMode !== "stats" && <div style={{marginBottom: 80}}>
        {sortedLogs.map(log => {
          const found = findWorkout(log.workoutId);
          // Logs outlive deleted custom workouts — show them rather than hide
          const w = found || { id: log.workoutId, custom: true, name: `${log.workoutId} (deleted)`, format: log.format || "custom", focus: "deleted workout", rating: "Medium" };
          const rating = diffOverrides[w.id] || w.rating;
          const resultStr = formatLogResult(log);
          return (
            <div key={log.id} style={{background: "#111122", border: "1px solid #222", borderRadius: 14, padding: 14, marginBottom: 8}}>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6}}>
                <div>
                  <button onClick={() => found && onSelectWorkout(found)} style={{background: "none", border: "none", padding: 0, cursor: found ? "pointer" : "default"}}>
                    <span style={{fontSize: 17, fontWeight: 800, color: found ? "#ff8a3a" : "#666"}}>{w.custom ? w.name : `#${w.id}`}</span>
                  </button>
                  <span style={{fontSize: 12, color: "#666", marginLeft: 8}}>{new Date(log.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div style={{display: "flex", gap: 4, alignItems: "center"}}>
                  <span style={{...sty.badge, background: DIFFICULTY_COLORS[rating] + "25", color: DIFFICULTY_COLORS[rating], borderColor: DIFFICULTY_COLORS[rating] + "50", fontSize: 11, padding: "3px 8px"}}>{rating}</span>
                  {(log.totalMins > 0 || log.totalSecs > 0) && <span style={{...sty.badge, background: "#1a1a2e", color: "#aaa", fontSize: 11, padding: "3px 8px"}}>{log.totalMins}:{(log.totalSecs || 0).toString().padStart(2,"0")}</span>}
                </div>
              </div>
              <div style={{display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap"}}>
                <span style={{...sty.tagSmall, fontSize: 10}}>{w.format.toLowerCase()}</span>
                <span style={{...sty.tagSmall, fontSize: 10, color: "#ff8a3a", borderColor: "#ff8a3a40"}}>{w.focus.toLowerCase()}</span>
              </div>
              {resultStr && <div style={{fontSize: 14, fontWeight: 700, color: "#3ddc84", marginBottom: 4}}>{resultStr}</div>}
              {log.notes && <div style={{fontSize: 12, color: "#888", fontStyle: "italic", marginBottom: 4}}>{log.notes}</div>}
              <div style={{display: "flex", gap: 6, marginTop: 6}}>
                <button onClick={() => shareResultCard(log, found, isPBLog(log, logs))} style={{background: "none", border: "1px solid #3ddc8440", borderRadius: 8, padding: "5px 10px", color: "#3ddc84", fontSize: 11, cursor: "pointer"}}>{"⤴"} Share</button>
                <button onClick={() => onEditLog(log)} style={{background: "none", border: "1px solid #444", borderRadius: 8, padding: "5px 10px", color: "#888", fontSize: 11, cursor: "pointer"}}>Edit</button>
                <button onClick={() => setConfirmDelete(log.id)} style={{background: "none", border: "1px solid #ef444440", borderRadius: 8, padding: "5px 10px", color: "#ef4444", fontSize: 11, cursor: "pointer"}}>Delete</button>
              </div>
              {confirmDelete === log.id && (
                <div style={{marginTop: 8, padding: 10, background: "#1a0a0a", borderRadius: 10, border: "1px solid #ef444440"}}>
                  <div style={{fontSize: 12, color: "#ef4444", marginBottom: 8}}>Delete this log entry?</div>
                  <div style={{display: "flex", gap: 6}}>
                    <button onClick={() => setConfirmDelete(null)} style={{flex: 1, background: "#222", border: "1px solid #444", borderRadius: 8, padding: "6px 10px", color: "#999", fontSize: 12, cursor: "pointer"}}>Cancel</button>
                    <button onClick={() => { onDeleteLog(log.id); setConfirmDelete(null); }} style={{flex: 1, background: "#ef444425", border: "1px solid #ef444450", borderRadius: 8, padding: "6px 10px", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer"}}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WORKOUT HISTORY SECTION (for detail page)
// ═══════════════════════════════════════════════════════════════
function WorkoutLogHistory({ workoutId, logs, diffOverrides, onEditLog }) {
  const workoutLogs = useMemo(() =>
    logs.filter(l => l.workoutId === workoutId).sort((a, b) => new Date(b.date) - new Date(a.date)),
    [workoutId, logs]
  );
  
  // Detect personal bests — compare each log to all others for this workout
  const pbLogIds = useMemo(() => {
    if (workoutLogs.length < 2) return new Set();
    const pbs = new Set();
    const rf = workoutLogs[0] ? getResultFields(workoutLogs[0].format) : null;
    if (!rf) return pbs;
    
    // For AMRAP: highest rounds (then extra reps)
    if (rf.type === "amrap") {
      let best = null;
      // Sort chronologically to find when PB was set
      const chrono = [...workoutLogs].sort((a,b) => new Date(a.date) - new Date(b.date));
      for (const log of chrono) {
        if (log.rounds == null) continue;
        const score = (log.rounds || 0) * 1000 + (log.extraReps || 0);
        if (!best || score > best.score) { best = { score, id: log.id }; }
      }
      if (best) pbs.add(best.id);
    }
    // For TIME: lowest completion time
    if (rf.type === "fortime") {
      let best = null;
      const chrono = [...workoutLogs].sort((a,b) => new Date(a.date) - new Date(b.date));
      for (const log of chrono) {
        if (log.completionMins == null) continue;
        const secs = (log.completionMins || 0) * 60 + (log.completionSecs || 0);
        if (secs > 0 && (!best || secs < best.secs)) { best = { secs, id: log.id }; }
      }
      if (best) pbs.add(best.id);
    }
    // For REPS: highest
    if (rf.type === "reps") {
      let best = null;
      for (const log of workoutLogs) {
        if (log.totalReps != null && (!best || log.totalReps > best.val)) { best = { val: log.totalReps, id: log.id }; }
      }
      if (best) pbs.add(best.id);
    }
    // For ROUNDS/EMOM: highest rounds completed
    if (rf.type === "rounds" || rf.type === "emom") {
      let best = null;
      for (const log of workoutLogs) {
        if (log.roundsCompleted != null && (!best || log.roundsCompleted > best.val)) { best = { val: log.roundsCompleted, id: log.id }; }
      }
      if (best) pbs.add(best.id);
    }
    return pbs;
  }, [workoutLogs]);

  if (workoutLogs.length === 0) return null;

  return (
    <div style={{marginBottom: 20}}>
      <div style={{fontSize: 12, fontWeight: 700, color: "#3ddc84", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1}}>
        {"\u{1F4CA}"} Your History ({workoutLogs.length} {workoutLogs.length === 1 ? "entry" : "entries"})
      </div>
      {workoutLogs.map(log => {
        const resultStr = formatLogResult(log);
        const isPB = pbLogIds.has(log.id);
        return (
          <div key={log.id} style={{background: isPB ? "#3ddc8408" : "#0d0d1a", border: `1px solid ${isPB ? "#3ddc8440" : "#3ddc8420"}`, borderRadius: 12, padding: 12, marginBottom: 6}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4}}>
              <div style={{display: "flex", alignItems: "center", gap: 6}}>
                <span style={{fontSize: 13, color: "#ccc", fontWeight: 600}}>
                  {new Date(log.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                {isPB && <span style={{fontSize: 10, fontWeight: 800, color: "#f59e0b", background: "#f59e0b20", borderRadius: 6, padding: "2px 6px"}}>{"\u{1F3C6}"} PB</span>}
              </div>
              <div style={{display: "flex", gap: 6, alignItems: "center"}}>
                <span style={{...sty.badge, background: DIFFICULTY_COLORS[log.difficulty] + "25", color: DIFFICULTY_COLORS[log.difficulty], fontSize: 10, padding: "2px 7px"}}>{log.difficulty}</span>
                {(log.totalMins > 0 || log.totalSecs > 0) && <span style={{fontSize: 11, color: "#888"}}>{log.totalMins}:{(log.totalSecs || 0).toString().padStart(2,"0")}</span>}
              </div>
            </div>
            {resultStr && <div style={{fontSize: 13, fontWeight: 700, color: "#3ddc84"}}>{resultStr}</div>}
            {log.notes && <div style={{fontSize: 11, color: "#888", fontStyle: "italic", marginTop: 2}}>{log.notes}</div>}
            <button onClick={() => onEditLog(log)} style={{background: "none", border: "none", padding: 0, color: "#ff8a3a", fontSize: 11, cursor: "pointer", marginTop: 4}}>Edit</button>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BACKUP EXPORT + APP META (last backup tracking)
// ═══════════════════════════════════════════════════════════════
function getMeta() { const m = loadData("meta", {}); return (m && typeof m === "object") ? m : {}; }
function setMeta(patch) { saveData("meta", { ...getMeta(), ...patch }); }

// One-tap export: share sheet where supported (Android Chrome -> email/Drive),
// download fallback elsewhere. Returns true if the backup left the app.
async function exportBackup() {
  const json = JSON.stringify(buildBackup(__APP_VERSION__), null, 2);
  const filename = `parkwod-backup-${new Date().toISOString().split("T")[0]}.json`;
  try {
    const file = new File([json], filename, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "PARK WOD backup" });
      setMeta({ lastBackupAt: Date.now() });
      return true;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return false; // user cancelled the share sheet
  }
  try {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    a.click(); URL.revokeObjectURL(url);
    setMeta({ lastBackupAt: Date.now() });
    return true;
  } catch (e) { console.error("Export failed:", e); return false; }
}

// Is this log the best result for its workout? (format-aware, needs 2+ logs)
function isPBLog(log, allLogs) {
  const group = allLogs.filter(l => l.workoutId === log.workoutId);
  if (group.length < 2) return false;
  const rf = getResultFields(log.format);
  const score = (l) =>
    rf.type === "amrap" ? (l.rounds != null ? l.rounds * 1000 + (l.extraReps || 0) : null) :
    rf.type === "fortime" ? (l.completionMins != null ? -((l.completionMins * 60) + (l.completionSecs || 0)) : null) :
    rf.type === "reps" ? (l.totalReps != null ? l.totalReps : null) :
    (rf.type === "rounds" || rf.type === "emom") ? (l.roundsCompleted != null ? l.roundsCompleted : null) : null;
  const mine = score(log);
  if (mine == null) return false;
  return group.every(l => l.id === log.id || (score(l) == null ? true : score(l) <= mine));
}

// Draw a shareable result image and hand it to the share sheet (download fallback)
async function shareResultCard(log, workout, isPB) {
  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1080;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0a0a15"; ctx.fillRect(0, 0, 1080, 1080);
  const grad = ctx.createLinearGradient(0, 0, 1080, 0);
  grad.addColorStop(0, "#ff8a3a"); grad.addColorStop(1, "#8b5cf6");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 14);
  try { await document.fonts.load('100px "Bebas Neue"'); } catch {}
  ctx.fillStyle = "#ff8a3a"; ctx.font = '64px "Bebas Neue", sans-serif';
  ctx.fillText("PARK WOD", 80, 160);
  ctx.fillStyle = "#777"; ctx.font = '32px "DM Sans", sans-serif';
  ctx.fillText(new Date(log.date).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }), 80, 215);
  const title = workout ? (workout.custom ? workout.name : `WOD #${workout.id}`) : `Workout ${log.workoutId}`;
  ctx.fillStyle = "#fff"; ctx.font = '120px "Bebas Neue", sans-serif';
  ctx.fillText(title.slice(0, 16), 80, 420);
  if (workout) {
    ctx.fillStyle = "#8b5cf6"; ctx.font = '600 36px "DM Sans", sans-serif';
    ctx.fillText(`${workout.format} · ${workout.focus} · ${workout.equipment}`.toLowerCase(), 80, 485);
  }
  const result = formatLogResult(log) || (log.totalMins ? `${log.totalMins} min session` : "Done");
  ctx.fillStyle = "#3ddc84"; ctx.font = '150px "Bebas Neue", sans-serif';
  ctx.fillText(String(result).slice(0, 15), 80, 720);
  if (isPB) {
    ctx.font = "64px sans-serif"; ctx.fillText("🏆", 80, 830);
    ctx.fillStyle = "#eab308"; ctx.font = '700 44px "DM Sans", sans-serif';
    ctx.fillText("NEW PERSONAL BEST", 175, 815);
  }
  if (log.totalMins > 0) {
    ctx.fillStyle = "#888"; ctx.font = '36px "DM Sans", sans-serif';
    ctx.fillText(`${log.totalMins} minutes`, 80, isPB ? 920 : 830);
  }
  ctx.fillStyle = "#444"; ctx.font = '28px "DM Sans", sans-serif';
  ctx.fillText("PARK WOD · outdoor fitness", 80, 1010);
  const blob = await new Promise(res => c.toBlob(res, "image/png"));
  const file = new File([blob], "parkwod-result.png", { type: "image/png" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "PARK WOD result" });
      return true;
    }
  } catch (e) { if (e && e.name === "AbortError") return false; }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "parkwod-result.png"; a.click(); URL.revokeObjectURL(url);
  return true;
}

// Export workout history as a CSV via the share sheet (download fallback)
async function exportHistoryCsv() {
  const logs = loadData("logs", []);
  const esc = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const rows = [["Date", "Workout", "Focus", "Format", "Equipment", "Duration (min)", "Result", "Notes"]];
  for (const l of [...logs].sort((a, b) => new Date(a.date) - new Date(b.date))) {
    const w = findWorkout(l.workoutId);
    rows.push([
      new Date(l.date).toISOString().slice(0, 10),
      w ? (w.custom ? w.name : `#${w.id}`) : l.workoutId,
      w ? w.focus : "", l.format || (w && w.format) || "", w ? w.equipment : "",
      l.totalMins || "", formatLogResult(l), l.notes || "",
    ]);
  }
  const csv = rows.map(r => r.map(esc).join(",")).join("\r\n");
  const filename = `parkwod-history-${new Date().toISOString().slice(0, 10)}.csv`;
  try {
    const file = new File([csv], filename, { type: "text/csv" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "PARK WOD history" });
      return true;
    }
  } catch (e) { if (e && e.name === "AbortError") return false; }
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  return true;
}

// ═══════════════════════════════════════════════════════════════
// ERROR BOUNDARY — no more white screens
// ═══════════════════════════════════════════════════════════════
// Deliberately styled with plain values (no DS/sty references) so it can
// render even if the design system itself is what broke.
function CrashScreen({ error }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0a0a15", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", fontFamily: "sans-serif" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{"⚠️"}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#ff8a3a", marginBottom: 8 }}>Something went wrong</div>
      <div style={{ fontSize: 14, color: "#888", marginBottom: 4 }}>Your data is safe. If a workout was running, you can resume it after reloading.</div>
      <div style={{ fontSize: 11, color: "#555", marginBottom: 24, maxWidth: 300, overflowWrap: "break-word" }}>{String(error && (error.message || error)).slice(0, 200)}</div>
      <button onClick={() => window.location.reload()} style={{ background: "#ff8a3a", color: "#fff", border: "none", borderRadius: 14, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
        Reload App
      </button>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { try { console.error("App crash:", error, info); } catch {} }
  render() {
    if (this.state.error) return <CrashScreen error={this.state.error} />;
    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════════
// WORKOUT BUILDER SCREEN — structured-only, multi-block
// ═══════════════════════════════════════════════════════════════
const bs = {
  input: { width: "100%", background: "#111122", border: "1px solid #444", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 15, boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
  numInput: { width: 72, background: "#111122", border: "1px solid #444", borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 14, boxSizing: "border-box", outline: "none", textAlign: "center" },
  label: { fontSize: 11, color: "#888", fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, display: "block" },
  select: { width: "100%", background: "#111122", border: "1px solid #444", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit" },
  blockCard: { background: "#111122", border: "1px solid #333", borderRadius: 14, padding: 14, marginBottom: 10 },
  iconBtn: { background: "none", border: "1px solid #444", borderRadius: 8, padding: "4px 10px", color: "#888", fontSize: 13, cursor: "pointer" },
};

const FIELD_LABELS = { minutes: "Minutes", workSeconds: "Work (s)", restSeconds: "Rest (s)", rounds: "Rounds", exerciseSeconds: "Secs/exercise", capMinutes: "Time cap (min)" };
const KIND_EXTRA_FIELDS = { fortime: ["capMinutes"], circuit: ["exerciseSeconds", "restSeconds", "rounds"], tabata: ["workSeconds", "restSeconds", "rounds"] };

function BuilderScreen({ initialDraft, editingId, logsCount, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(initialDraft)));
  const [errors, setErrors] = useState([]);
  const [kindPicker, setKindPicker] = useState(null); // "blocks" | "coreBlocks" | null
  const [confirmCancel, setConfirmCancel] = useState(false);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initialDraft), [draft, initialDraft]);

  const patch = (p) => setDraft(d => ({ ...d, ...p }));
  const patchBlock = (listKey, i, p) => setDraft(d => ({ ...d, [listKey]: d[listKey].map((b, j) => (j === i ? { ...b, ...p } : b)) }));
  const removeBlock = (listKey, i) => setDraft(d => ({ ...d, [listKey]: d[listKey].filter((_, j) => j !== i) }));
  const moveBlock = (listKey, i, dir) => setDraft(d => {
    const list = [...d[listKey]]; const j = i + dir;
    if (j < 0 || j >= list.length) return d;
    [list[i], list[j]] = [list[j], list[i]];
    return { ...d, [listKey]: list };
  });
  const patchExercise = (listKey, i, j, p) => setDraft(d => ({
    ...d, [listKey]: d[listKey].map((b, bi) => bi !== i ? b : { ...b, exercises: b.exercises.map((e, ei) => (ei === j ? { ...e, ...p } : e)) }),
  }));
  const addExercise = (listKey, i) => setDraft(d => ({
    ...d, [listKey]: d[listKey].map((b, bi) => bi !== i ? b : { ...b, exercises: [...b.exercises, { reps: "", name: "" }] }),
  }));
  const removeExercise = (listKey, i, j) => setDraft(d => ({
    ...d, [listKey]: d[listKey].map((b, bi) => bi !== i ? b : { ...b, exercises: b.exercises.filter((_, ei) => ei !== j) }),
  }));

  // Live phase strip from the current draft (best-effort while incomplete)
  const phasePreview = useMemo(() => {
    const labels = [];
    if ((draft.warmup || "").trim()) labels.push({ label: "Warmup", color: "#eab308" });
    try {
      const compiled = compileWorkout({ ...draft, name: draft.name || "x" }, "preview");
      compiled.blocks.workout.forEach(b => labels.push({ label: b.timer.label || "Workout", color: "#ff8a3a" }));
      (compiled.blocks.core || []).forEach(() => labels.push({ label: "Core", color: "#8b5cf6" }));
    } catch (e) { /* incomplete draft — show what we have */ }
    return labels;
  }, [draft]);

  const handleSave = () => {
    const problems = validateDraft(draft);
    setErrors(problems);
    if (problems.length === 0) onSave(draft);
  };

  const renderBlockEditor = (listKey, b, i, count) => {
    const kindDef = BLOCK_KINDS.find(k => k.kind === b.kind);
    const fields = KIND_EXTRA_FIELDS[b.kind] || KIND_FIELDS[b.kind];
    return (
      <div key={i} style={bs.blockCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#ff8a3a" }}>{kindDef ? kindDef.label : b.kind}</div>
          <div style={{ display: "flex", gap: 6 }}>
            {count > 1 && <button style={bs.iconBtn} onClick={() => moveBlock(listKey, i, -1)}>{"↑"}</button>}
            {count > 1 && <button style={bs.iconBtn} onClick={() => moveBlock(listKey, i, 1)}>{"↓"}</button>}
            <button style={{ ...bs.iconBtn, color: "#ef4444", borderColor: "#ef444440" }} onClick={() => removeBlock(listKey, i)}>{"✕"}</button>
          </div>
        </div>
        {b.refText && (
          <div style={{ background: "#0a0a15", border: "1px dashed #444", borderRadius: 10, padding: "8px 10px", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: 1, marginBottom: 3 }}>ORIGINAL TEXT — for reference while you structure it</div>
            <div style={{ fontSize: 12, color: "#999", whiteSpace: "pre-wrap" }}>{b.refText}</div>
          </div>
        )}
        {fields.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            {fields.map(f => (
              <div key={f}>
                <span style={bs.label}>{FIELD_LABELS[f]}</span>
                <input type="number" min="0" value={b[f]} onChange={e => patchBlock(listKey, i, { [f]: e.target.value })} style={bs.numInput} />
              </div>
            ))}
          </div>
        )}
        {b.kind !== "rest" && <>
          <span style={bs.label}>{b.kind === "emom" ? "Exercises (one per minute slot, cycling)" : "Exercises"}</span>
          {b.exercises.map((e, j) => (
            <div key={j} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
              <input type="number" min="0" placeholder="reps" autoComplete="off" value={e.reps} onChange={ev => patchExercise(listKey, i, j, { reps: ev.target.value })} style={{ ...bs.numInput, width: 58 }} />
              <input list="builder-exercise-list" placeholder="exercise" autoComplete="off" autoCorrect="off" spellCheck="false" name={`pw-ex-${i}-${j}`} value={e.name} onChange={ev => patchExercise(listKey, i, j, { name: ev.target.value })} style={{ ...bs.input, flex: 1 }} />
              <button style={{ ...bs.iconBtn, padding: "8px 10px" }} onClick={() => removeExercise(listKey, i, j)}>{"✕"}</button>
            </div>
          ))}
          <button onClick={() => addExercise(listKey, i)} style={{ ...bs.iconBtn, color: "#3ddc84", borderColor: "#3ddc8440", marginTop: 2 }}>+ Add exercise</button>
        </>}
      </div>
    );
  };

  const kindPickerModal = kindPicker && (
    <div style={sty.modalOverlay} onClick={() => setKindPicker(null)}>
      <div style={{ ...sty.modalContent, maxWidth: 340 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Choose a format</div>
        {BLOCK_KINDS.map(k => (
          <button key={k.kind} onClick={() => { setDraft(d => ({ ...d, [kindPicker]: [...d[kindPicker], newBlock(k.kind)] })); setKindPicker(null); }} style={{
            display: "block", width: "100%", textAlign: "left", background: "#111122", border: "1px solid #333",
            borderRadius: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer",
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#ff8a3a" }}>{k.label}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{k.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: DS.colors.bg, zIndex: 850, display: "flex", flexDirection: "column" }}>
      {/* datalist for exercise autocomplete (encyclopedia names) */}
      <datalist id="builder-exercise-list">
        {Object.values(EXERCISE_INFO).map(info => <option key={info.name} value={info.name} />)}
      </datalist>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #222" }}>
        <button onClick={() => (dirty ? setConfirmCancel(true) : onCancel())} style={{ background: "none", border: "1px solid #444", borderRadius: 10, padding: "8px 14px", color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{"✕"} Cancel</button>
        <div style={{ fontFamily: DS.font.display, fontSize: 20, letterSpacing: 1, color: "#fff" }}>{editingId ? "EDIT WORKOUT" : "CREATE WORKOUT"}</div>
        <button onClick={handleSave} style={{ background: DS.gradient.green, border: "none", borderRadius: 10, padding: "8px 18px", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>SAVE</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20, paddingBottom: 60 }}>
        {/* Live phase preview */}
        {phasePreview.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#666", fontWeight: 700, marginRight: 4 }}>{phasePreview.length} PHASES:</span>
            {phasePreview.map((p, i) => (
              <span key={i} style={{ fontSize: 11, color: p.color, fontWeight: 600, background: p.color + "15", padding: "3px 10px", borderRadius: 12 }}>{p.label}</span>
            ))}
          </div>
        )}

        {/* Details */}
        <span style={bs.label}>Name</span>
        <input value={draft.name} onChange={e => patch({ name: e.target.value })} placeholder="e.g. Saturday Smasher" autoComplete="off" name="pw-workout-title" style={{ ...bs.input, marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <span style={bs.label}>Equipment</span>
            <select value={draft.equipment} onChange={e => patch({ equipment: e.target.value })} style={bs.select}>
              {ALL_EQUIPMENT.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <span style={bs.label}>Focus</span>
            <select value={draft.focus} onChange={e => patch({ focus: e.target.value })} style={bs.select}>
              {ALL_FOCUSES.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <span style={bs.label}>Difficulty</span>
            <select value={draft.rating} onChange={e => patch({ rating: e.target.value })} style={bs.select}>
              {ALL_RATINGS.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
        </div>

        {/* Warmup */}
        <span style={bs.label}>Warmup (optional, untimed)</span>
        <input value={draft.warmup} onChange={e => patch({ warmup: e.target.value })} placeholder="e.g. 2 laps w 10 squats, 10 arm circles" autoComplete="off" name="pw-warmup" style={{ ...bs.input, marginBottom: 20 }} />

        {/* Workout blocks */}
        <div style={{ fontSize: 13, fontWeight: 800, color: "#ff8a3a", letterSpacing: 1, marginBottom: 8 }}>WORKOUT BLOCKS</div>
        {draft.blocks.map((b, i) => renderBlockEditor("blocks", b, i, draft.blocks.length))}
        <button onClick={() => setKindPicker("blocks")} style={{ ...bs.input, textAlign: "center", color: "#3ddc84", border: "1px dashed #3ddc8460", cursor: "pointer", marginBottom: 20 }}>+ Add block</button>

        {/* Core blocks */}
        <div style={{ fontSize: 13, fontWeight: 800, color: "#8b5cf6", letterSpacing: 1, marginBottom: 8 }}>CORE (OPTIONAL)</div>
        {draft.coreBlocks.map((b, i) => renderBlockEditor("coreBlocks", b, i, draft.coreBlocks.length))}
        <button onClick={() => setKindPicker("coreBlocks")} style={{ ...bs.input, textAlign: "center", color: "#8b5cf6", border: "1px dashed #8b5cf660", cursor: "pointer", marginBottom: 20 }}>+ Add core block</button>

        {/* Validation errors */}
        {errors.length > 0 && (
          <div style={{ background: "#2a0f0f", border: "1px solid #ef4444", borderRadius: 12, padding: 12, marginBottom: 12 }}>
            {errors.map((e, i) => <div key={i} style={{ fontSize: 13, color: "#ef4444" }}>{"·"} {e}</div>)}
          </div>
        )}
        {editingId && logsCount > 0 && (
          <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>Your {logsCount} logged session{logsCount > 1 ? "s" : ""} for this workout will stay attached.</div>
        )}
      </div>

      {kindPickerModal}
      {confirmCancel && (
        <div style={sty.modalOverlay} onClick={() => setConfirmCancel(false)}>
          <div style={{ ...sty.modalContent, maxWidth: 300, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Discard changes?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmCancel(false)} style={{ flex: 1, background: "#222", border: "1px solid #444", borderRadius: 10, padding: "10px", color: "#999", fontSize: 13, cursor: "pointer" }}>Keep editing</button>
              <button onClick={onCancel} style={{ flex: 1, background: "#ef444425", border: "1px solid #ef4444", borderRadius: 10, padding: "10px", color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APP COMPONENT
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// SETTINGS SCREEN
// ═══════════════════════════════════════════════════════════════
function SettingsScreen({ settings, onUpdate }) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const inputSty = { width: "100%", background: "#111122", border: "1px solid #444", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 15, boxSizing: "border-box", outline: "none" };

  const handleClearAll = () => {
    try {
      // Clear live (v1) data AND the frozen legacy snapshots — this is the
      // user explicitly asking for everything to go.
      ["logs", "diffOverrides", "customizations", "settings", "favourites"].forEach(removeData);
      Object.values(LEGACY_KEYS).forEach(k => localStorage.removeItem(k));
      localStorage.removeItem(RECOVERY_KEY);
      setShowClearConfirm(false);
      window.location.reload();
    } catch(e) {}
  };

  return (
    <div style={sty.content}>
      <div style={{fontSize: 22, fontWeight: 900, color: "#ff8a3a", marginBottom: 20}}>Settings</div>
      
      {/* Font Size */}
      <div style={{marginBottom: 24}}>
        <div style={sty.sectionTitle}>Font Size</div>
        <div style={{display: "flex", flexDirection: "column", gap: 8}}>
          {Object.entries(FONT_SIZES).map(([key, val]) => (
            <button key={key} onClick={() => onUpdate({ fontSize: key })} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", borderRadius: 12, cursor: "pointer",
              background: settings.fontSize === key ? "#ff8a3a20" : "#111122",
              border: settings.fontSize === key ? "2px solid #ff8a3a" : "1px solid #333",
            }}>
              <div>
                <div style={{fontSize: val.base, fontWeight: 700, color: settings.fontSize === key ? "#ff8a3a" : "#fff"}}>{val.label}</div>
                <div style={{fontSize: 12, color: "#888"}}>{val.sample} ({val.base}px)</div>
              </div>
              {settings.fontSize === key && <span style={{color: "#ff8a3a", fontSize: 18}}>{"\u2713"}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Announcements */}
      <div style={{marginBottom: 24}}>
        <div style={sty.sectionTitle}>Voice Announcements</div>
        <button onClick={() => onUpdate({ voiceEnabled: !settings.voiceEnabled })} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
          padding: "14px 16px", borderRadius: 12, cursor: "pointer",
          background: settings.voiceEnabled ? "#8b5cf620" : "#111122",
          border: settings.voiceEnabled ? "1px solid #8b5cf6" : "1px solid #333",
        }}>
          <div>
            <div style={{fontSize: 15, fontWeight: 700, color: settings.voiceEnabled ? "#8b5cf6" : "#fff"}}>
              {"\u{1F5E3}"} Voice {settings.voiceEnabled ? "ON" : "OFF"}
            </div>
            <div style={{fontSize: 12, color: "#888", textAlign: "left"}}>Announces exercises and round numbers during timed workouts</div>
          </div>
          <div style={{width: 44, height: 24, borderRadius: 12, background: settings.voiceEnabled ? "#8b5cf6" : "#444", padding: 2, transition: "all 0.2s"}}>
            <div style={{width: 20, height: 20, borderRadius: 10, background: "#fff", transition: "all 0.2s", transform: settings.voiceEnabled ? "translateX(20px)" : "translateX(0)"}} />
          </div>
        </button>
      </div>

      {/* Voice Coaching — cues layered on top of voice announcements */}
      <div style={{marginBottom: 24}}>
        <div style={sty.sectionTitle}>Voice Coaching</div>
        <div style={{fontSize: 11, color: "#666", marginBottom: 8}}>Extra spoken cues during timed workouts. Only heard when Voice is on.</div>
        {[
          { key: "voiceHalfway", label: "Halfway call", desc: '"Halfway. 10 minutes to go" in AMRAPs and EMOMs' },
          { key: "voiceFinalMinute", label: "Final-minute call", desc: '"One minute remaining" near the end of timed blocks' },
          { key: "voiceNextPreview", label: "Next-exercise preview", desc: 'Rests announce what’s coming: "Rest. Next: KB Swings"' },
        ].map(({ key, label, desc }) => {
          const on = settings[key] !== false;
          return (
            <button key={key} onClick={() => onUpdate({ [key]: !on })} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
              padding: "12px 16px", borderRadius: 12, cursor: "pointer", marginBottom: 8,
              background: on ? "#8b5cf615" : "#111122",
              border: on ? "1px solid #8b5cf650" : "1px solid #333",
            }}>
              <div>
                <div style={{fontSize: 14, fontWeight: 700, color: on ? "#8b5cf6" : "#fff", textAlign: "left"}}>{label} {on ? "ON" : "OFF"}</div>
                <div style={{fontSize: 11, color: "#888", textAlign: "left"}}>{desc}</div>
              </div>
              <div style={{width: 44, height: 24, borderRadius: 12, background: on ? "#8b5cf6" : "#444", padding: 2, transition: "all 0.2s", flexShrink: 0}}>
                <div style={{width: 20, height: 20, borderRadius: 10, background: "#fff", transition: "all 0.2s", transform: on ? "translateX(20px)" : "translateX(0)"}} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Audio Default */}
      <div style={{marginBottom: 24}}>
        <div style={sty.sectionTitle}>Audio Defaults</div>
        <button onClick={() => onUpdate({ audioDefault: !settings.audioDefault })} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
          padding: "14px 16px", borderRadius: 12, cursor: "pointer",
          background: settings.audioDefault ? "#3ddc8415" : "#111122",
          border: settings.audioDefault ? "1px solid #3ddc8450" : "1px solid #333",
        }}>
          <div style={{fontSize: 15, fontWeight: 700, color: settings.audioDefault ? "#3ddc84" : "#fff"}}>
            {settings.audioDefault ? "\u{1F50A}" : "\u{1F507}"} Beeps & audio {settings.audioDefault ? "ON" : "OFF"} by default
          </div>
          <div style={{width: 44, height: 24, borderRadius: 12, background: settings.audioDefault ? "#3ddc84" : "#444", padding: 2, transition: "all 0.2s"}}>
            <div style={{width: 20, height: 20, borderRadius: 10, background: "#fff", transition: "all 0.2s", transform: settings.audioDefault ? "translateX(20px)" : "translateX(0)"}} />
          </div>
        </button>
      </div>

      {/* Outdoor Mode Default */}
      <div style={{marginBottom: 24}}>
        <div style={sty.sectionTitle}>Outdoor Mode</div>
        <button onClick={() => onUpdate({ outdoorMode: !settings.outdoorMode })} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
          padding: "14px 16px", borderRadius: 12, cursor: "pointer",
          background: settings.outdoorMode ? "#f59e0b20" : "#111122",
          border: settings.outdoorMode ? "1px solid #f59e0b" : "1px solid #333",
        }}>
          <div>
            <div style={{fontSize: 15, fontWeight: 700, color: settings.outdoorMode ? "#f59e0b" : "#fff"}}>
              {settings.outdoorMode ? "\u2600\uFE0F" : "\u{1F319}"} Start workouts in outdoor mode {settings.outdoorMode ? "ON" : "OFF"}
            </div>
            <div style={{fontSize: 12, color: "#888", textAlign: "left"}}>High contrast white background for sunny conditions. Can also toggle during workout.</div>
          </div>
          <div style={{width: 44, height: 24, borderRadius: 12, background: settings.outdoorMode ? "#f59e0b" : "#444", padding: 2, transition: "all 0.2s"}}>
            <div style={{width: 20, height: 20, borderRadius: 10, background: "#fff", transition: "all 0.2s", transform: settings.outdoorMode ? "translateX(20px)" : "translateX(0)"}} />
          </div>
        </button>
      </div>

      {/* Display Name */}
      <div style={{marginBottom: 24}}>
        <div style={sty.sectionTitle}>Display Name</div>
        <input type="text" placeholder="Your name (for future leaderboard)" value={settings.displayName || ""} 
          onChange={e => onUpdate({ displayName: e.target.value })} style={inputSty} />
      </div>

      {/* App Info */}
      <div style={{marginBottom: 24}}>
        <div style={sty.sectionTitle}>App Info</div>
        <div style={{fontSize: 13, color: "#888"}}>PARK WOD {__APP_VERSION__} {"\u00B7"} {RAW_DATA.length} workouts {"\u00B7"} {Object.keys(EXERCISE_INFO).length} exercises</div>
      </div>

      {/* Export / Backup */}
      <div style={{marginBottom: 24}}>
        <div style={sty.sectionTitle}>Backup Data</div>
        <button onClick={() => { exportBackup(); }} style={{
          width: "100%", padding: "14px 16px", borderRadius: 12, cursor: "pointer",
          background: "#3ddc8415", border: "1px solid #3ddc8450", color: "#3ddc84", fontSize: 14, fontWeight: 700,
        }}>{"\u{1F4BE}"} Export Backup (JSON)</button>
        <div style={{fontSize: 11, color: "#666", marginTop: 6}}>Downloads all your logs, settings, and customizations as a JSON file</div>
        {/* Import Backup */}
        <input type="file" id="import-backup-input" accept=".json" style={{display: "none"}} onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const data = JSON.parse(ev.target.result);
              let restored = 0;
              if (data.logs && Array.isArray(data.logs)) { saveData("logs", data.logs); restored++; }
              if (data.diffOverrides && typeof data.diffOverrides === "object") { saveData("diffOverrides", data.diffOverrides); restored++; }
              if (data.customizations && typeof data.customizations === "object") { saveData("customizations", data.customizations); restored++; }
              if (data.settings && typeof data.settings === "object") { saveData("settings", data.settings); restored++; }
              if (data.favourites && Array.isArray(data.favourites)) { saveData("favourites", data.favourites); restored++; }
              if (data.myWorkouts && Array.isArray(data.myWorkouts)) { saveData("myWorkouts", data.myWorkouts); restored++; }
              alert(`Backup restored! (${restored} sections imported${data.logs ? `, ${data.logs.length} logs` : ""})\n\nThe page will now reload.`);
              window.location.reload();
            } catch(err) { alert("Invalid backup file. Please select a valid PARK WOD backup JSON file."); }
          };
          reader.readAsText(file);
          e.target.value = "";
        }} />
        <button onClick={() => document.getElementById("import-backup-input")?.click()} style={{
          width: "100%", padding: "14px 16px", borderRadius: 12, cursor: "pointer", marginTop: 8,
          background: "#3b82f615", border: "1px solid #3b82f650", color: "#3b82f6", fontSize: 14, fontWeight: 700,
        }}>{"\u{1F4C2}"} Import Backup (JSON)</button>
        <div style={{fontSize: 11, color: "#666", marginTop: 6}}>Restore a previously exported backup file. Replaces current data.</div>
        <button onClick={() => { exportHistoryCsv(); }} style={{
          width: "100%", padding: "14px 16px", borderRadius: 12, cursor: "pointer", marginTop: 8,
          background: "#eab30815", border: "1px solid #eab30850", color: "#eab308", fontSize: 14, fontWeight: 700,
        }}>{"\u{1F4CA}"} Export History (CSV)</button>
        <div style={{fontSize: 11, color: "#666", marginTop: 6}}>Your workout log as a spreadsheet {"—"} one row per session</div>
      </div>

      {/* Clear Data */}
      <div style={{marginBottom: 40, padding: 16, border: "1px solid #ef444440", borderRadius: 12, background: "#ef444410"}}>
        <div style={{fontSize: 12, fontWeight: 700, color: "#ef4444", letterSpacing: 1, marginBottom: 8}}>DANGER ZONE</div>
        <button onClick={() => setShowClearConfirm(true)} style={{
          width: "100%", padding: "12px 16px", borderRadius: 10, cursor: "pointer",
          background: "#ef444420", border: "1px solid #ef4444", color: "#ef4444", fontSize: 14, fontWeight: 700,
        }}>Clear All My Data</button>
      </div>

      {showClearConfirm && (
        <div style={sty.modalOverlay} onClick={() => setShowClearConfirm(false)}>
          <div style={{...sty.modalContent, maxWidth: 300, textAlign: "center"}} onClick={e => e.stopPropagation()}>
            <div style={{fontSize: 36, marginBottom: 12}}>{"\u26A0\uFE0F"}</div>
            <div style={{fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8}}>Delete everything?</div>
            <div style={{fontSize: 14, color: "#888", marginBottom: 20}}>This will permanently delete all your workout logs, settings, and customizations. This cannot be undone.</div>
            <div style={{display: "flex", gap: 10}}>
              <button onClick={() => setShowClearConfirm(false)} style={{flex: 1, background: "#333", border: "1px solid #555", borderRadius: 12, padding: "14px 16px", color: "#ccc", fontSize: 15, fontWeight: 700, cursor: "pointer"}}>Cancel</button>
              <button onClick={handleClearAll} style={{flex: 1, background: "#ef4444", border: "none", borderRadius: 12, padding: "14px 16px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer"}}>Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// Detects when a new service worker has taken control (a fresh deploy was
// installed in the background). Guarded so the FIRST-ever install doesn't
// count — only genuine updates show the banner.
function useUpdateReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const hadController = !!navigator.serviceWorker.controller;
    const onChange = () => { if (hadController) setReady(true); };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onChange);
  }, []);
  return ready;
}

// Migrate legacy storage to versioned keys before anything reads data.
// Copy-only: legacy keys stay untouched as a rollback-safe snapshot.
migrateIfNeeded();

function App() {
  const [screenState, setScreenState] = useState("home");
  const updateReady = useUpdateReady();
  const [storageError, setStorageError] = useState(false);
  const [backupNudge, setBackupNudge] = useState(false);

  // Ask the browser to protect our storage from eviction (best-effort)
  useEffect(() => {
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => {}); } catch {}
  }, []);

  // Surface storage failures (quota full, private mode) — never silent
  useEffect(() => {
    const onStorageError = () => setStorageError(true);
    window.addEventListener("parkwod:storage-error", onStorageError);
    return () => window.removeEventListener("parkwod:storage-error", onStorageError);
  }, []);

  // Monthly backup nudge: only when there is history worth protecting and
  // no backup (or dismissal) in the last 30 days
  useEffect(() => {
    const logs = loadData("logs", []);
    if (!Array.isArray(logs) || logs.length === 0) return;
    const meta = getMeta();
    const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
    const last = Math.max(meta.lastBackupAt || 0, meta.lastBackupPromptAt || 0);
    if (Date.now() - last > MONTH_MS) setBackupNudge(true);
  }, []);
  const [prevScreen, setPrevScreen] = useState("home");
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem("parkwod:welcomed"));
  const screen = screenState;
  const setScreen = useCallback((s) => {
    setScreenState(prev => {
      setPrevScreen(prev);
      return s;
    });
    window.scrollTo(0, 0);
  }, []);
  const goBack = useCallback(() => {
    setScreen(prevScreen || "library");
  }, [prevScreen, setScreen]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [filters, setFilters] = useState({ equipment: [], rating: [], format: [], focus: [], search: "", mine: false });
  const { myWorkouts, saveWorkout, deleteWorkout } = useMyWorkouts();
  // Builder: null | { draft, editingId } — renders full-screen over everything
  const [builder, setBuilder] = useState(null);
  const [justLogged, setJustLogged] = useState(null); // fresh log -> share-card offer
  const [showFilters, setShowFilters] = useState(false);
  const [excludedMovements, setExcludedMovements] = useState([]);
  const [showExclusions, setShowExclusions] = useState(false);
  const [exerciseModal, setExerciseModal] = useState(null);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [logModal, setLogModal] = useState(null); // { workout, existingLog? }
  const [editingLog, setEditingLog] = useState(null);
  const [recoveryPrompt, setRecoveryPrompt] = useState(null);

  const { settings, update: updateSettings } = useSettings();
  const { logs, loaded, addLog, updateLog, deleteLog, diffOverrides, setDiffOverride } = useWorkoutLogs();
  const { favs, toggle: toggleFav, isFav } = useFavourites();

  // Check for crash recovery on mount
  useEffect(() => {
    const recovery = loadWorkoutRecovery();
    if (recovery && recovery.started) {
      const w = findWorkout(recovery.workoutId);
      if (w) setRecoveryPrompt({ ...recovery, workout: w });
      else clearWorkoutRecovery();
    }
  }, []);

  const filtered = useMemo(() => {
    return getAllWorkouts().filter(w => {
      if (filters.mine && !w.custom) return false;
      if (filters.equipment.length && !filters.equipment.includes(w.equipment)) return false;
      if (filters.rating.length && !filters.rating.includes(diffOverrides[w.id] || w.rating)) return false;
      if (filters.format.length && !filters.format.includes(w.format)) return false;
      if (filters.focus.length && !filters.focus.includes(w.focus)) return false;
      if (excludedMovements.length && w.wm.some(m => excludedMovements.includes(m))) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const matchesNum = w.id.toString().includes(s);
        const matchesName = (w.name || "").toLowerCase().includes(s);
        const matchesText = (w.workout + " " + w.warmup + " " + w.core).toLowerCase().includes(s);
        const matchesFmt = w.format.toLowerCase().includes(s);
        if (!matchesNum && !matchesName && !matchesText && !matchesFmt) return false;
      }
      return true;
    });
  }, [filters, excludedMovements, diffOverrides, myWorkouts]);

  const [randomPreview, setRandomPreview] = useState(null);

  const pickRandom = useCallback(() => {
    if (filtered.length === 0) return;
    const idx = Math.floor(Math.random() * filtered.length);
    setRandomPreview(filtered[idx]);
  }, [filtered]);

  const acceptRandom = useCallback(() => {
    if (randomPreview) {
      setSelectedWorkout(randomPreview);
      setScreen("detail");
      setRandomPreview(null);
    }
  }, [randomPreview]);

  const rerollRandom = useCallback(() => {
    if (filtered.length === 0) return;
    const idx = Math.floor(Math.random() * filtered.length);
    setRandomPreview(filtered[idx]);
  }, [filtered]);

  const openWorkout = (w) => { setSelectedWorkout(w); setScreen("detail"); };
  const activeFilterCount = filters.equipment.length + filters.rating.length + filters.format.length + filters.focus.length + (excludedMovements.length > 0 ? 1 : 0);

  const handleSaveLog = async (entry) => {
    if (editingLog) {
      await updateLog(entry.id, entry);
      setEditingLog(null);
    } else {
      await addLog(entry);
      // Offer a share card for the fresh result (auto-dismisses)
      setJustLogged(entry);
      setTimeout(() => setJustLogged(prev => (prev && prev.id === entry.id ? null : prev)), 8000);
    }
  };

  const handleEditLog = (log) => {
    const w = findWorkout(log.workoutId);
    if (w) {
      setEditingLog(log);
      setLogModal({ workout: w, existingLog: log });
    }
  };

  if (fullScreenMode && selectedWorkout) {
    return <FullScreenWorkout workout={selectedWorkout} onExit={() => setFullScreenMode(false)} settings={settings} onUpdateSettings={updateSettings} onLogWorkout={(elapsedSecs) => { setFullScreenMode(false); setLogModal({ workout: selectedWorkout, elapsedSecs }); }} logs={logs} />;
  }

  return (
    <div style={{...sty.app, fontFamily: DS.font.body}}>
      <header style={{...sty.header, display: "flex", justifyContent: "space-between", alignItems: "center", background: DS.colors.bg, borderBottom: `1px solid ${DS.colors.border}`}}>
        <div>
          {screen === "detail" ? (
            <div style={{display: "flex", alignItems: "center", gap: 10}}>
              <button onClick={goBack} style={{...sty.backBtn, display: "flex", alignItems: "center", gap: 4}}>
                <Icon name="chevronLeft" size={18} color={DS.colors.orange} /> Back
              </button>
              {/* Prev/Next workout arrows */}
              {selectedWorkout && (() => {
                const list = filtered.length > 0 ? filtered : RAW_DATA;
                const idx = list.findIndex(w => w.id === selectedWorkout.id);
                return (
                  <div style={{display: "flex", gap: 4}}>
                    {idx > 0 && <button onClick={() => setSelectedWorkout(list[idx - 1])} style={{background: "none", border: `1px solid ${DS.colors.border}`, borderRadius: 8, padding: "4px 10px", color: DS.colors.textMuted, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center"}}><Icon name="chevronLeft" size={14} color={DS.colors.textMuted} /></button>}
                    {idx < list.length - 1 && <button onClick={() => setSelectedWorkout(list[idx + 1])} style={{background: "none", border: `1px solid ${DS.colors.border}`, borderRadius: 8, padding: "4px 10px", color: DS.colors.textMuted, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center"}}><Icon name="chevronRight" size={14} color={DS.colors.textMuted} /></button>}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{display: "flex", alignItems: "center", gap: 8}}>
              <div style={{width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #ff8a3a, #e8722a)", display: "flex", alignItems: "center", justifyContent: "center"}}>
                <Icon name="zap" size={18} color="#fff" />
              </div>
              <span style={{fontFamily: DS.font.display, fontSize: 24, letterSpacing: 2, color: "#fff"}}>
                <span style={{color: DS.colors.orange}}>PARK</span> WOD
              </span>
            </div>
          )}
        </div>
        <div style={{display: "flex", alignItems: "center", gap: 8}}>
          {screen === "home" && (
            <button onClick={() => {}} style={{background: "none", border: "none", cursor: "pointer", padding: 4}}>
              <Icon name="bell" size={20} color={DS.colors.textMuted} />
            </button>
          )}
          <button onClick={() => setScreen(screen === "settings" ? "home" : "settings")} style={{
            background: screen === "settings" ? DS.colors.orange + "15" : "none", border: `1px solid ${screen === "settings" ? DS.colors.orange + "50" : DS.colors.border}`,
            borderRadius: 10, padding: 7, color: screen === "settings" ? DS.colors.orange : DS.colors.textMuted, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="settings" size={18} color={screen === "settings" ? DS.colors.orange : DS.colors.textMuted} />
          </button>
        </div>
      </header>

      {screen === "home" && <div className="screen-fade" key="home"><HomeScreen onNavigate={setScreen} onRandom={pickRandom} filtered={filtered} logs={logs}
        onSelectWorkout={openWorkout}
        onFilterEquipment={(equip) => { setFilters({ equipment: [equip], rating: [], format: [], focus: [], search: "" }); setExcludedMovements([]); setScreen("library"); }}
        onFilterRating={(rating) => { setFilters({ equipment: [], rating: [rating], format: [], focus: [], search: "" }); setExcludedMovements([]); setScreen("library"); }}
      /></div>}
      {screen === "library" && <div className="screen-fade" key="library">
        <LibraryScreen
          workouts={filtered} filters={filters} setFilters={setFilters}
          showFilters={showFilters} setShowFilters={setShowFilters}
          onSelect={openWorkout} activeFilterCount={activeFilterCount}
          excludedMovements={excludedMovements} setExcludedMovements={setExcludedMovements}
          showExclusions={showExclusions} setShowExclusions={setShowExclusions}
          logs={logs} diffOverrides={diffOverrides}
          favs={favs} onToggleFav={toggleFav}
          onCreateNew={() => setBuilder({ draft: newDraft(), editingId: null })}
        />
      </div>}
      {screen === "detail" && selectedWorkout && <div className="screen-fade" key={`detail-${selectedWorkout.id}`}>
        <WorkoutDetail
          workout={selectedWorkout}
          onExerciseTap={setExerciseModal}
          onStartWorkout={() => setFullScreenMode(true)}
          onLogWorkout={() => setLogModal({ workout: selectedWorkout })}
          logs={logs}
          diffOverrides={diffOverrides}
          onEditLog={handleEditLog}
          fontSizeKey={settings.fontSize}
          isFav={isFav(selectedWorkout.id)} onToggleFav={() => toggleFav(selectedWorkout.id)}
          onEditCustom={selectedWorkout.custom ? () => setBuilder({ draft: selectedWorkout.draft, editingId: selectedWorkout.id }) : null}
          onDeleteCustom={selectedWorkout.custom ? () => { deleteWorkout(selectedWorkout.id); setSelectedWorkout(null); setScreen("library"); } : null}
          onDuplicate={() => setBuilder({
            draft: draftFromWorkout(
              selectedWorkout,
              getWorkoutBlocks(selectedWorkout, "workout", selectedWorkout.workout),
              selectedWorkout.core && selectedWorkout.core.trim() ? getWorkoutBlocks(selectedWorkout, "core", selectedWorkout.core) : []
            ),
            editingId: null,
          })}
        />
      </div>}
      {builder && (
        <BuilderScreen
          initialDraft={builder.draft}
          editingId={builder.editingId}
          logsCount={builder.editingId ? logs.filter(l => l.workoutId === builder.editingId).length : 0}
          onCancel={() => setBuilder(null)}
          onSave={(draft) => {
            const compiled = saveWorkout(draft, builder.editingId);
            setBuilder(null);
            openWorkout(compiled);
          }}
        />
      )}
      {screen === "history" && <div className="screen-fade" key="history">
        <HistoryScreen
          logs={logs}
          diffOverrides={diffOverrides}
          onSelectWorkout={openWorkout}
          onEditLog={handleEditLog}
          onDeleteLog={deleteLog}
        />
      </div>}
      {screen === "settings" && <div className="screen-fade" key="settings">
        <SettingsScreen settings={settings} onUpdate={updateSettings} />
      </div>}

      <nav style={sty.nav}>
        {[
          { id: "home", icon: "home", label: "Home" },
          { id: "library", icon: "library", label: "Library" },
          { id: "history", icon: "history", label: "History" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setScreen(tab.id)} style={{...sty.navBtn, color: screen === tab.id ? "#ff8a3a" : "#555"}}>
            <Icon name={tab.icon} size={22} color={screen === tab.id ? "#ff8a3a" : "#555"} strokeWidth={screen === tab.id ? 2.5 : 1.8} />
            <span style={{fontSize: 10, marginTop: 3, fontWeight: screen === tab.id ? 700 : 500, letterSpacing: 0.5}}>{tab.label.toUpperCase()}</span>
          </button>
        ))}
        <button onClick={pickRandom} style={{...sty.navBtn, color: "#3ddc84"}}>
          <Icon name="dice" size={22} color="#3ddc84" strokeWidth={1.8} />
          <span style={{fontSize: 10, marginTop: 3, fontWeight: 500, letterSpacing: 0.5}}>RANDOM</span>
        </button>
      </nav>

      {exerciseModal && <ExerciseModal exerciseKey={exerciseModal} onClose={() => setExerciseModal(null)} />}
      {logModal && (
        <LogWorkoutModal
          workout={logModal.workout}
          existingLog={logModal.existingLog || null}
          diffOverrides={diffOverrides}
          onSetDifficulty={setDiffOverride}
          onSave={handleSaveLog}
          onClose={() => { setLogModal(null); setEditingLog(null); }}
          elapsedSecs={logModal.elapsedSecs || null}
        />
      )}
      {/* Random workout preview */}
      {randomPreview && (
        <div style={sty.modalOverlay} onClick={() => setRandomPreview(null)}>
          <div style={{...sty.modalContent, maxWidth: 360, textAlign: "center"}} onClick={e => e.stopPropagation()}>
            <button onClick={() => setRandomPreview(null)} style={sty.modalClose}>{"\u2715"}</button>
            <div style={{fontSize: 40, marginBottom: 8}}>{"\u{1F3B2}"}</div>
            <div style={{fontSize: 14, fontWeight: 700, color: "#888", letterSpacing: 1, marginBottom: 4}}>YOUR RANDOM WORKOUT</div>
            <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12}}>
              <span style={{fontSize: 32, fontWeight: 900, color: "#ff8a3a"}}>#{randomPreview.id}</span>
              <span style={{...sty.badge, background: (DIFFICULTY_COLORS[diffOverrides[randomPreview.id] || randomPreview.rating] || "#888") + "25", color: DIFFICULTY_COLORS[diffOverrides[randomPreview.id] || randomPreview.rating] || "#888"}}>{diffOverrides[randomPreview.id] || randomPreview.rating}</span>
            </div>
            <div style={{display: "flex", justifyContent: "center", gap: 8, marginBottom: 12, flexWrap: "wrap"}}>
              <span style={sty.tagSmall}>{randomPreview.equipment.toLowerCase()}</span>
              <span style={{...sty.tagSmall, color: "#ff8a3a", borderColor: "#ff8a3a40"}}>{randomPreview.format.toLowerCase()}</span>
              <span style={sty.tagSmall}>{randomPreview.focus.toLowerCase()}</span>
              <span style={sty.tagSmall}>{"\u23F1"} {randomPreview.duration}m</span>
            </div>
            <div style={{fontSize: 13, color: "#aaa", lineHeight: 1.6, marginBottom: 16, textAlign: "left", padding: "10px 14px", background: "#0a0a15", borderRadius: 10, maxHeight: 120, overflowY: "auto"}}>
              {randomPreview.workout.split("\n").slice(0, 4).map((line, i) => (
                <div key={i} style={{marginBottom: 4}}>{line.trim()}</div>
              ))}
              {randomPreview.workout.split("\n").length > 4 && <div style={{color: "#666"}}>...</div>}
            </div>
            <div style={{display: "flex", gap: 10}}>
              <button onClick={rerollRandom} style={{
                flex: 1, background: "#1a1a2e", border: "1px solid #444", borderRadius: 12, padding: "14px 16px",
                color: "#ccc", fontSize: 14, fontWeight: 700, cursor: "pointer"
              }}>{"\u{1F3B2}"} Re-roll</button>
              <button onClick={acceptRandom} style={{
                flex: 1, background: "linear-gradient(135deg, #3ddc84, #2bb86a)", border: "none", borderRadius: 12,
                padding: "14px 16px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer"
              }}>Let's Go {"\u2192"}</button>
            </div>
          </div>
        </div>
      )}
      {/* Storage failure warning — data may not be saving */}
      {storageError && (
        <div style={{
          position: "fixed", top: "max(env(safe-area-inset-top), 8px)", left: 16, right: 16, zIndex: 950,
          background: "#2a0f0f", border: "1px solid #ef4444", borderRadius: 14, padding: "12px 14px",
          display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>Storage problem — data may not be saving</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>Your phone's storage may be full. Export a backup now to be safe.</div>
          </div>
          <button onClick={() => { exportBackup(); }} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Export</button>
          <button onClick={() => setStorageError(false)} style={{ background: "none", border: "none", color: "#888", fontSize: 16, cursor: "pointer", padding: 4 }}>{"✕"}</button>
        </div>
      )}
      {/* Fresh-result share offer */}
      {justLogged && (
        <div style={{
          position: "fixed", bottom: 92, left: 16, right: 16, zIndex: 795,
          background: "#111122", border: "1px solid #3ddc8450", borderRadius: 16, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#3ddc84" }}>Result logged {isPBLog(justLogged, logs) ? "· new PB! 🏆" : "💪"}</div>
            <div style={{ fontSize: 12, color: "#888" }}>Share it as an image?</div>
          </div>
          <button onClick={() => { shareResultCard(justLogged, findWorkout(justLogged.workoutId), isPBLog(justLogged, logs)); setJustLogged(null); }} style={{ background: "#3ddc84", color: "#0a0a15", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Share</button>
          <button onClick={() => setJustLogged(null)} style={{ background: "none", border: "none", color: "#888", fontSize: 16, cursor: "pointer", padding: 4 }}>{"✕"}</button>
        </div>
      )}
      {/* Monthly backup nudge */}
      {backupNudge && !storageError && (
        <div style={{
          position: "fixed", bottom: 92, left: 16, right: 16, zIndex: 790,
          background: "#111122", border: "1px solid #3ddc8450", borderRadius: 16, padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#3ddc84" }}>Back up your workout history</div>
            <div style={{ fontSize: 12, color: "#888" }}>Save a copy off this phone — takes one tap.</div>
          </div>
          <button onClick={async () => { const ok = await exportBackup(); if (ok) setBackupNudge(false); }} style={{ background: "#3ddc84", color: "#0a0a15", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Export</button>
          <button onClick={() => { setMeta({ lastBackupPromptAt: Date.now() }); setBackupNudge(false); }} style={{ background: "none", border: "none", color: "#888", fontSize: 16, cursor: "pointer", padding: 4 }}>{"✕"}</button>
        </div>
      )}
      {/* Update-ready banner — zIndex 800 sits below the workout overlay (900),
          so it never interrupts an active workout */}
      {updateReady && (
        <button onClick={() => location.reload()} style={{
          position: "fixed", bottom: 92, left: "50%", transform: "translateX(-50%)",
          zIndex: 800, background: DS.gradient.orange, color: "#fff", border: "none",
          borderRadius: 24, padding: "12px 22px", fontWeight: 700, fontSize: 14,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)", cursor: "pointer", fontFamily: DS.font.body,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {"⬆"} Update ready {"·"} tap to refresh
        </button>
      )}
      {/* Crash recovery prompt */}
      {recoveryPrompt && (
        <div style={sty.modalOverlay} onClick={() => { clearWorkoutRecovery(); setRecoveryPrompt(null); }}>
          <div style={{...sty.modalContent, maxWidth: 320, textAlign: "center"}} onClick={e => e.stopPropagation()}>
            <div style={{fontSize: 44, marginBottom: 12}}>{"\u{1F504}"}</div>
            <div style={{fontSize: 18, fontWeight: 800, color: "#ff8a3a", marginBottom: 6}}>Resume Workout?</div>
            <div style={{fontSize: 14, color: "#888", marginBottom: 6}}>
              Looks like your last session was interrupted.
            </div>
            <div style={{fontSize: 15, color: "#ccc", marginBottom: 4}}>
              Workout #{recoveryPrompt.workoutId}
            </div>
            <div style={{fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 16}}>
              {fmt(recoveryPrompt.overallElapsed || 0)} elapsed
            </div>
            <div style={{display: "flex", gap: 10}}>
              <button onClick={() => { clearWorkoutRecovery(); setRecoveryPrompt(null); }} style={{
                flex: 1, background: "#333", border: "1px solid #555", borderRadius: 12, padding: "14px 16px",
                color: "#999", fontSize: 14, fontWeight: 700, cursor: "pointer"
              }}>Dismiss</button>
              <button onClick={() => {
                setSelectedWorkout(recoveryPrompt.workout);
                setFullScreenMode(true);
                setRecoveryPrompt(null);
                // Note: recovery data stays so FullScreenWorkout can read it if needed
              }} style={{
                flex: 1, background: "linear-gradient(135deg, #ff8a3a, #e8722a)", border: "none", borderRadius: 12,
                padding: "14px 16px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer"
              }}>Resume</button>
            </div>
          </div>
        </div>
      )}
      {/* First-time welcome overlay */}
      {showWelcome && (
        <div style={sty.modalOverlay}>
          <div style={{...sty.modalContent, maxWidth: 340, textAlign: "center"}} onClick={e => e.stopPropagation()}>
            <div style={{fontSize: 48, marginBottom: 8}}>{"\u{1F3CB}\uFE0F"}</div>
            <div style={{fontSize: 24, fontWeight: 900, marginBottom: 4}}>
              <span style={{color: "#ff8a3a"}}>PARK</span> <span style={{color: "#fff"}}>WOD</span>
            </div>
            <div style={{fontSize: 14, color: "#888", marginBottom: 20}}>Your outdoor workout companion</div>
            
            <div style={{textAlign: "left", marginBottom: 20}}>
              {[
                { icon: "\u{1F4DA}", text: `${RAW_DATA.length} workouts with smart timers` },
                { icon: "\u{1F3B2}", text: "Random workout picker" },
                { icon: "\u{1F50A}", text: "Audio beeps + voice announcements" },
                { icon: "\u2600\uFE0F", text: "Outdoor mode for sunny days" },
                { icon: "\u{1F4DD}", text: "Log results & track your PBs" },
                { icon: "\u{1F4AA}", text: "Tap any exercise name for how-to info" },
                { icon: "\u270F\uFE0F", text: "Edit reps, exercises, or difficulty" },
                { icon: "\u2699\uFE0F", text: "Settings in top-right corner" },
              ].map((item, i) => (
                <div key={i} style={{display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: i < 7 ? "1px solid #222" : "none"}}>
                  <span style={{fontSize: 18, width: 28, textAlign: "center"}}>{item.icon}</span>
                  <span style={{fontSize: 13, color: "#ccc"}}>{item.text}</span>
                </div>
              ))}
            </div>
            
            <button onClick={() => { setShowWelcome(false); localStorage.setItem("parkwod:welcomed", "1"); }} style={{
              width: "100%", padding: "16px 24px", borderRadius: 14,
              background: "linear-gradient(135deg, #ff8a3a, #e8722a)", border: "none",
              color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
            }}>Let's Go! {"\u{1F525}"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
function HomeScreen({ onNavigate, onRandom, filtered, logs, onFilterEquipment, onFilterRating, onSelectWorkout }) {
  const [pickShuffle, setPickShuffle] = useState(0); // Today's Pick shuffle offset (session-only)
  const stats = useMemo(() => ({
    total: RAW_DATA.length,
    byEquip: ALL_EQUIPMENT.map(e => ({ name: e, count: RAW_DATA.filter(w => w.equipment === e).length })),
    byRating: ALL_RATINGS.map(r => ({ name: r, count: RAW_DATA.filter(w => w.rating === r).length })),
  }), []);

  const recentLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
  }, [logs]);

  // Calculate day streak
  const dayStreak = useMemo(() => {
    if (logs.length === 0) return 0;
    const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    const dates = [...new Set(sorted.map(l => new Date(l.date).toDateString()))];
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      const diff = Math.floor((today - d) / 86400000);
      if (diff <= streak + 1) streak = diff + 1 >= streak + 1 ? streak + 1 : streak;
      else break;
    }
    return Math.min(streak, dates.length);
  }, [logs]);

  // Total active minutes
  const totalMins = useMemo(() => {
    return logs.reduce((sum, l) => sum + (l.totalMins || 0), 0);
  }, [logs]);

  return (
    <div style={{padding: "0 0 20px", overflowY: "auto", maxHeight: "calc(100vh - 140px)"}}>
      {/* ── DAILY PULSE Header ── */}
      <div className="card-float-1" style={{padding: "20px 20px 0"}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20}}>
          <div style={{fontFamily: DS.font.display, fontSize: 28, letterSpacing: 1.5, color: "#fff"}}>DAILY PULSE</div>
          <div style={{fontSize: 12, fontWeight: 700, color: DS.colors.green, letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 4}}>
            <span style={{width: 6, height: 6, borderRadius: 3, background: DS.colors.green, display: "inline-block"}} />
            LIVE DATA
          </div>
        </div>

        {/* ── Streak + Quick Start Row ── */}
        <div style={{display: "flex", gap: 12, marginBottom: 16}}>
          {/* Day Streak Card */}
          <div style={{flex: 1, background: "linear-gradient(135deg, #111a15 0%, #0f1a12 100%)", borderRadius: DS.radius.xl, padding: "20px 16px", position: "relative", overflow: "hidden", border: "1px solid #3ddc8415"}}>
            <div style={{position: "absolute", top: -30, right: -30, width: 100, height: 100, background: "radial-gradient(circle, #3ddc8408 0%, transparent 70%)", pointerEvents: "none"}} />
            <Icon name="fire" size={22} color={DS.colors.green} />
            <div style={{fontFamily: DS.font.display, fontSize: 52, color: "#fff", lineHeight: 1, marginTop: 8, letterSpacing: 1}}>
              {dayStreak || logs.length}
            </div>
            <div style={{fontSize: 11, fontWeight: 700, color: DS.colors.textMuted, letterSpacing: 1.5, marginTop: 4}}>DAY STREAK</div>
          </div>

          {/* Quick Start Card */}
          <button onClick={onRandom} style={{flex: 1, background: DS.gradient.orange, borderRadius: DS.radius.xl, padding: "20px 16px", position: "relative", overflow: "hidden", border: "none", cursor: "pointer", textAlign: "left"}}>
            <div style={{position: "absolute", top: -20, right: -20, width: 80, height: 80, background: "radial-gradient(circle, #ffffff15 0%, transparent 70%)", pointerEvents: "none"}} />
            <Icon name="play" size={20} color="#fff" />
            <div style={{fontFamily: DS.font.display, fontSize: 28, color: "#fff", lineHeight: 1.1, marginTop: 10, letterSpacing: 1}}>
              QUICK<br/>START
            </div>
            <div style={{fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginTop: 4, letterSpacing: 0.5}}>
              {(() => {
                const focuses = [...new Set(RAW_DATA.map(w => w.focus))];
                const recentFocuses = [...logs].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,2).map(l => { const w = findWorkout(l.workoutId); return w ? w.focus : null; }).filter(Boolean);
                const next = focuses.find(f => !recentFocuses.includes(f)) || focuses[0];
                return next ? next.toUpperCase() : "FULL BODY";
              })()}
            </div>
          </button>
        </div>

        {/* ── Stats Bar ── */}
        <div className="card-float-2" style={{display: "flex", background: DS.colors.surface, borderRadius: DS.radius.lg, padding: "14px 20px", marginBottom: 20, border: "1px solid " + DS.colors.border}}>
          <div style={{flex: 1, display: "flex", alignItems: "center", gap: 10}}>
            <div style={{width: 36, height: 36, borderRadius: 10, background: DS.colors.blue + "20", display: "flex", alignItems: "center", justifyContent: "center"}}>
              <Icon name="clock" size={18} color={DS.colors.blue} />
            </div>
            <div>
              <div style={{fontSize: 10, fontWeight: 700, color: DS.colors.textMuted, letterSpacing: 1}}>TOTAL ACTIVE TIME</div>
              <div style={{fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: DS.font.body}}>
                {totalMins} <span style={{fontSize: 13, fontWeight: 600, color: DS.colors.textSub}}>MINS</span>
              </div>
            </div>
          </div>
          <div style={{width: 1, background: DS.colors.border, margin: "0 16px"}} />
          <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center"}}>
            <div style={{fontSize: 10, fontWeight: 700, color: DS.colors.textMuted, letterSpacing: 1}}>WORKOUTS</div>
            <div style={{fontFamily: DS.font.display, fontSize: 28, color: DS.colors.orange, letterSpacing: 1}}>
              #{String(logs.length).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      {/* ── TODAY'S PICK — deterministic daily suggestion with shuffle ── */}
      {(() => {
        const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
        const recentFocuses = sortedLogs.slice(0, 2).map(l => {
          const wk = findWorkout(l.workoutId);
          return wk ? wk.focus : null;
        }).filter(Boolean);
        const recentIds = sortedLogs.slice(0, 5).map(l => l.workoutId);
        let candidates = getAllWorkouts().filter(w =>
          !recentIds.includes(w.id) && !recentFocuses.includes(w.focus)
        );
        if (candidates.length === 0) candidates = getAllWorkouts();
        const today = new Date(); const seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
        // pickShuffle is 0 for the stable daily pick; each shuffle tap sets a
        // fresh random offset so the sequence never repeats predictably
        const pick = candidates[(seed + pickShuffle) % candidates.length];
        const avoidedLabel = recentFocuses.length > 0 ? `Avoids ${recentFocuses[0].toLowerCase()}` : "Fresh every day";
        return (
          <div className="card-float-3" style={{margin: "0 20px 20px", background: "linear-gradient(135deg, #1a1a3e, #111128)", border: "1px solid #8b5cf625", borderRadius: DS.radius.xl, padding: 16, position: "relative", overflow: "hidden"}}>
            <div style={{position: "absolute", top: -40, right: -40, width: 120, height: 120, background: "radial-gradient(circle, #8b5cf608 0%, transparent 70%)", pointerEvents: "none"}} />
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10}}>
              <div style={{display: "flex", alignItems: "center", gap: 6}}>
                <Icon name="target" size={14} color={DS.colors.purple} />
                <span style={{fontSize: 11, fontWeight: 700, color: DS.colors.purple, letterSpacing: 1}}>TODAY'S PICK</span>
              </div>
              <span style={{fontSize: 10, color: DS.colors.textMuted}}>{avoidedLabel}</span>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 12}}>
              <button onClick={() => onSelectWorkout(pick)} style={{flex: 1, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left"}}>
                <div style={{fontFamily: DS.font.display, fontSize: 24, color: DS.colors.orange, letterSpacing: 1}}>{pick.custom ? pick.name : `#${pick.id}`}</div>
                <div style={{fontSize: 12, color: DS.colors.textSub, marginTop: 2}}>{pick.format.toLowerCase()} · {pick.equipment.toLowerCase()} · {pick.focus.toLowerCase()} · {pick.duration}m</div>
              </button>
              <button onClick={() => setPickShuffle(1 + Math.floor(Math.random() * 100000))} title="Shuffle" style={{
                background: "none", border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md,
                padding: "10px 12px", color: DS.colors.textSub, fontSize: 14, cursor: "pointer",
              }}>{"🎲"}</button>
              <button onClick={() => onSelectWorkout(pick)} style={{
                background: DS.gradient.purple, border: "none", borderRadius: DS.radius.md,
                padding: "10px 16px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 6,
              }}>Try It <Icon name="arrowRight" size={14} color="#fff" /></button>
            </div>
          </div>
        );
      })()}

      {/* ── RECENT ACTIVITY ── */}
      {recentLogs.length > 0 && (
        <div style={{padding: "20px 20px 0"}}>
          <div className="card-float-4" style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14}}>
            <div style={{fontFamily: DS.font.display, fontSize: 22, color: "#fff", letterSpacing: 1.5}}>RECENT ACTIVITY</div>
            <button onClick={() => onNavigate("history")} style={{background: "none", border: "none", color: DS.colors.orange, fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 1, display: "flex", alignItems: "center", gap: 4}}>
              VIEW ALL <Icon name="chevronRight" size={14} color={DS.colors.orange} />
            </button>
          </div>
          {recentLogs.map((log, idx) => {
            const w = findWorkout(log.workoutId);
            if (!w) return null;
            const resultStr = formatLogResult(log);
            const timeAgo = (() => {
              const mins = Math.floor((Date.now() - new Date(log.date).getTime()) / 60000);
              if (mins < 60) return `${mins} MINS AGO`;
              const hrs = Math.floor(mins / 60);
              if (hrs < 24) return `${hrs}H AGO`;
              const days = Math.floor(hrs / 24);
              return `${days}D AGO`;
            })();
            return (
              <div key={log.id} style={{display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: idx < recentLogs.length - 1 ? `1px solid ${DS.colors.border}` : "none"}}>
                {/* Avatar circle */}
                <div style={{width: 44, height: 44, borderRadius: 22, background: "linear-gradient(135deg, " + DS.colors.orange + "30, " + DS.colors.purple + "30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
                  <Icon name="trophy" size={20} color={DS.colors.orange} />
                </div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 14, color: "#fff"}}>
                    <span style={{fontWeight: 700, color: DS.colors.green}}>You</span> completed{" "}
                    <span style={{fontWeight: 700}}>WOD #{w.id}</span>
                  </div>
                  <div style={{fontSize: 11, color: DS.colors.textMuted, marginTop: 2}}>
                    {timeAgo} {resultStr && <span>· {resultStr}</span>}
                  </div>
                </div>
                <button onClick={() => onSelectWorkout(w)} style={{background: "none", border: "none", cursor: "pointer", padding: 6}}>
                  <Icon name="heart" size={18} color={DS.colors.textMuted} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── EQUIPMENT CATEGORIES ── */}
      <div style={{padding: "20px 20px 0"}}>
        <div style={{fontFamily: DS.font.display, fontSize: 22, color: "#fff", letterSpacing: 1.5, marginBottom: 14}}>BY EQUIPMENT</div>
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
          {stats.byEquip.map(e => {
            const cat = CATEGORY_PATTERNS[e.name] || CATEGORY_PATTERNS.Mixed;
            return (
              <button key={e.name} onClick={() => onFilterEquipment(e.name)} style={{
                background: cat.bg, border: `1px solid ${cat.accent}15`, borderRadius: DS.radius.lg,
                padding: "16px 14px", cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden",
              }}>
                <div style={{position: "absolute", inset: 0, background: cat.pattern, opacity: 0.4}} />
                <div style={{position: "relative"}}>
                  <div style={{fontSize: 11, fontWeight: 700, color: cat.accent, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4}}>{e.name}</div>
                  <div style={{fontFamily: DS.font.display, fontSize: 32, color: "#fff", letterSpacing: 1}}>{e.count}</div>
                  <div style={{fontSize: 11, color: DS.colors.textMuted}}>Workouts</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── INTENSITY LEVELS ── */}
      <div style={{padding: "20px 20px 0"}}>
        <div style={{fontFamily: DS.font.display, fontSize: 22, color: "#fff", letterSpacing: 1.5, marginBottom: 14}}>INTENSITY LEVELS</div>
        {stats.byRating.map(r => {
          const diffColor = DIFFICULTY_COLORS[r.name] || "#888";
          const labels = { "Easy": "Steady State", "Medium": "The Grind", "Hard": "Apex Predator", "Very Hard": "Dark Zone" };
          const descs = { "Easy": "Recovery or building metabolic base.", "Medium": "High-intensity intervals for calorie burn.", "Hard": "Maximum effort. Push your limits.", "Very Hard": "For those who want to touch the dark zone." };
          return (
            <button key={r.name} onClick={() => onFilterRating(r.name)} style={{
              display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left",
              background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.lg,
              padding: "14px 16px", cursor: "pointer", marginBottom: 8,
            }}>
              <div style={{width: 40, height: 40, borderRadius: 10, background: diffColor + "15", display: "flex", alignItems: "center", justifyContent: "center"}}>
                <Icon name={r.name === "Easy" ? "activity" : r.name === "Medium" ? "zap" : "fire"} size={20} color={diffColor} />
              </div>
              <div style={{flex: 1}}>
                <div style={{fontSize: 14, fontWeight: 700, color: "#fff"}}>{labels[r.name] || r.name}</div>
                <div style={{fontSize: 11, color: DS.colors.textMuted, marginTop: 2}}>{descs[r.name] || ""}</div>
              </div>
              <div style={{display: "flex", alignItems: "center", gap: 6}}>
                <span style={{fontSize: 10, fontWeight: 800, color: diffColor, background: diffColor + "20", padding: "3px 8px", borderRadius: DS.radius.pill, letterSpacing: 0.5}}>{r.name.toUpperCase()}</span>
                <span style={{fontSize: 14, fontWeight: 700, color: DS.colors.textSub}}>{r.count}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{height: 20}} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LIBRARY SCREEN
// ═══════════════════════════════════════════════════════════════
function LibraryScreen({ workouts, filters, setFilters, showFilters, setShowFilters, onSelect, activeFilterCount, excludedMovements, setExcludedMovements, showExclusions, setShowExclusions, logs, diffOverrides, favs, onToggleFav, onCreateNew }) {
  const [durationFilter, setDurationFilter] = useState(null);
  const [sortBy, setSortBy] = useState("id");
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // "list" or "browse"
  const DURATION_FILTERS = [
    { key: "short", label: "Under 35m", test: w => w.duration < 35 },
    { key: "medium", label: "35-45m", test: w => w.duration >= 35 && w.duration <= 45 },
    { key: "long", label: "45m+", test: w => w.duration > 45 },
  ];
  const DIFF_ORDER = { "Easy": 0, "Medium": 1, "Hard": 2, "Very Hard": 3 };
  const displayWorkouts = useMemo(() => {
    let list = durationFilter ? workouts.filter(DURATION_FILTERS.find(d => d.key === durationFilter).test) : [...workouts];
    if (showFavsOnly && favs.length > 0) list = list.filter(w => favs.includes(w.id));
    if (sortBy === "duration") list.sort((a, b) => a.duration - b.duration);
    else if (sortBy === "difficulty") list.sort((a, b) => (DIFF_ORDER[a.rating] || 0) - (DIFF_ORDER[b.rating] || 0));
    else if (sortBy === "recent") {
      const lastDone = {};
      if (logs) logs.forEach(l => { if (!lastDone[l.workoutId] || l.date > lastDone[l.workoutId]) lastDone[l.workoutId] = l.date; });
      list.sort((a, b) => (lastDone[b.id] || "").localeCompare(lastDone[a.id] || ""));
    }
    return list;
  }, [workouts, durationFilter, sortBy, logs, showFavsOnly, favs]);

  const toggleFilter = (key, value) => {
    setFilters(prev => ({...prev, [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value]}));
  };
  const clearFilters = () => { setFilters({ equipment: [], rating: [], format: [], focus: [], search: "", mine: false }); setExcludedMovements([]); setDurationFilter(null); };
  const toggleExclusion = (movement) => {
    setExcludedMovements(prev => prev.includes(movement) ? prev.filter(m => m !== movement) : [...prev, movement]);
  };

  // Equipment stats for browse mode
  const equipStats = useMemo(() => ALL_EQUIPMENT.map(e => ({
    name: e, count: workouts.filter(w => w.equipment === e).length
  })), [workouts]);

  return (
    <div style={{padding: "0 0 20px", overflowY: "auto", maxHeight: "calc(100vh - 140px)"}}>
      {/* ── Hero banner ── */}
      <div className="card-float-1" style={{margin: "0 20px 16px", background: DS.gradient.greenNeon, borderRadius: DS.radius.xl, padding: "24px 20px", position: "relative", overflow: "hidden"}}>
        <div style={{position: "absolute", top: -40, right: -40, width: 140, height: 140, background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)", pointerEvents: "none"}} />
        <div style={{position: "absolute", bottom: -20, left: -20, width: 80, height: 80, background: "radial-gradient(circle, rgba(0,0,0,0.1) 0%, transparent 70%)", pointerEvents: "none"}} />
        <div style={{fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "rgba(0,0,0,0.5)", marginBottom: 4}}>LEVEL UP YOUR GAME</div>
        <div style={{fontFamily: DS.font.display, fontSize: 36, color: "#000", lineHeight: 1, letterSpacing: 1}}>CHOOSE YOUR</div>
        <div style={{fontFamily: DS.font.display, fontSize: 36, color: "#000", lineHeight: 1, letterSpacing: 1, fontStyle: "italic", marginBottom: 10}}>STRENGTH.</div>
        <div style={{fontSize: 13, color: "rgba(0,0,0,0.6)", lineHeight: 1.5, maxWidth: 260, marginBottom: 16}}>
          Precision-engineered outdoor workouts designed to push your limits.
        </div>
        <div style={{display: "flex", gap: 8}}>
          <button onClick={() => { const r = workouts[Math.floor(Math.random() * workouts.length)]; if (r) onSelect(r); }} style={{
            display: "flex", alignItems: "center", gap: 6, background: "#000", border: "none", borderRadius: DS.radius.md, padding: "10px 16px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            <Icon name="dice" size={14} color="#fff" /> RANDOM WORKOUT
          </button>
          <button onClick={() => setViewMode(viewMode === "browse" ? "list" : "browse")} style={{
            display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.15)", border: "none", borderRadius: DS.radius.md, padding: "10px 16px", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            {viewMode === "browse" ? "LIST VIEW" : "BROWSE ALL"}
          </button>
        </div>
      </div>

      {/* ── Category filter chips (horizontal scroll) ── */}
      <div className="scroll-hide" style={{display: "flex", gap: 8, overflowX: "auto", padding: "0 20px 12px"}}>
        <button onClick={onCreateNew} style={{
          padding: "8px 16px", borderRadius: DS.radius.pill, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          background: DS.colors.green + "20", border: `1px solid ${DS.colors.green}`, color: DS.colors.green, fontFamily: DS.font.body,
        }}>+ Create</button>
        <button onClick={() => setFilters(prev => ({ ...prev, mine: !prev.mine }))} style={{
          padding: "8px 16px", borderRadius: DS.radius.pill, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
          background: filters.mine ? "#8b5cf6" : DS.colors.surface, border: `1px solid ${filters.mine ? "#8b5cf6" : DS.colors.border}`,
          color: filters.mine ? "#fff" : DS.colors.textSub, fontFamily: DS.font.body,
        }}>My Workouts</button>
        {["All Workouts", ...ALL_EQUIPMENT, ...ALL_FOCUSES.slice(0, 3)].map((cat, i) => {
          const isAll = cat === "All Workouts";
          const isEquip = ALL_EQUIPMENT.includes(cat);
          const isFocus = ALL_FOCUSES.includes(cat);
          const active = isAll ? (filters.equipment.length === 0 && filters.focus.length === 0 && !filters.mine) : isEquip ? filters.equipment.includes(cat) : filters.focus.includes(cat);
          return (
            <button key={cat} onClick={() => {
              if (isAll) clearFilters();
              else if (isEquip) toggleFilter("equipment", cat);
              else toggleFilter("focus", cat);
            }} style={{
              padding: "8px 16px", borderRadius: DS.radius.pill, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              background: active ? DS.colors.orange : DS.colors.surface, border: `1px solid ${active ? DS.colors.orange : DS.colors.border}`,
              color: active ? "#000" : DS.colors.textSub, fontFamily: DS.font.body,
            }}>{cat}</button>
          );
        })}
      </div>

      {/* ── Browse Mode: Equipment Categories ── */}
      {viewMode === "browse" && (
        <div style={{padding: "0 20px"}}>
          {equipStats.map(eq => {
            const cat = CATEGORY_PATTERNS[eq.name] || CATEGORY_PATTERNS.Mixed;
            return (
              <button key={eq.name} onClick={() => { setFilters(prev => ({...prev, equipment: [eq.name]})); setViewMode("list"); }} style={{
                width: "100%", textAlign: "left", background: cat.bg, border: "none", borderRadius: DS.radius.xl, padding: 0, marginBottom: 12, cursor: "pointer", position: "relative", overflow: "hidden", minHeight: 100,
              }}>
                <div style={{position: "absolute", inset: 0, background: cat.pattern, opacity: 0.5}} />
                <div style={{position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", width: 48, height: 48, borderRadius: 24, background: cat.accent + "20", display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <Icon name="chevronRight" size={24} color={cat.accent} />
                </div>
                <div style={{position: "relative", padding: "20px 20px"}}>
                  <div style={{fontSize: 10, fontWeight: 800, color: cat.accent, letterSpacing: 1.5, marginBottom: 4}}>
                    {eq.name === "Bodyweight" ? "NO EQUIPMENT NEEDED" : eq.name === "Kettlebell" ? "EXPLOSIVE POWER" : eq.name === "Dumbbell" ? "HIGH VOLUME" : "VERSATILE TRAINING"}
                  </div>
                  <div style={{fontFamily: DS.font.display, fontSize: 28, color: "#fff", letterSpacing: 1}}>{eq.name.toUpperCase()}</div>
                  <div style={{fontSize: 12, color: DS.colors.textMuted, marginTop: 2}}>{eq.count} Workouts</div>
                </div>
              </button>
            );
          })}

          {/* Intensity Levels Section */}
          <div style={{marginTop: 8, marginBottom: 20}}>
            <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 14}}>
              <div style={{width: 3, height: 20, background: DS.colors.orange, borderRadius: 2}} />
              <div style={{fontFamily: DS.font.display, fontSize: 22, color: "#fff", letterSpacing: 1.5}}>INTENSITY LEVELS</div>
            </div>
            {ALL_RATINGS.map(r => {
              const diffColor = DIFFICULTY_COLORS[r];
              const labels = { "Easy": "Steady State", "Medium": "The Grind", "Hard": "Apex Predator", "Very Hard": "Dark Zone" };
              const badges = { "Easy": "FOUNDATION", "Medium": "PERFORMANCE", "Hard": "ELITE", "Very Hard": "EXTREME" };
              const descs = { "Easy": "Perfect for recovery or building metabolic base.", "Medium": "High-intensity intervals designed for calorie burn and muscle gain.", "Hard": "Maximum effort. For those who want to touch the dark zone.", "Very Hard": "Beyond limits. Only for the fearless." };
              const icons = { "Easy": "activity", "Medium": "zap", "Hard": "fire", "Very Hard": "fire" };
              return (
                <button key={r} onClick={() => { setFilters(prev => ({...prev, rating: [r]})); setViewMode("list"); }} style={{
                  display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left",
                  background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.xl,
                  padding: "16px 16px", cursor: "pointer", marginBottom: 8, fontFamily: DS.font.body,
                }}>
                  <div style={{width: 44, height: 44, borderRadius: 12, background: diffColor + "12", display: "flex", alignItems: "center", justifyContent: "center"}}>
                    <Icon name={icons[r]} size={22} color={diffColor} />
                  </div>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: 15, fontWeight: 700, color: "#fff"}}>{labels[r]}</div>
                    <div style={{fontSize: 11, color: DS.colors.textMuted, marginTop: 3, lineHeight: 1.4}}>{descs[r]}</div>
                  </div>
                  <span style={{fontSize: 9, fontWeight: 800, color: diffColor, background: diffColor + "15", padding: "4px 8px", borderRadius: DS.radius.pill, letterSpacing: 0.5}}>{badges[r]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── List Mode: Search + Filters + Cards ── */}
      {viewMode === "list" && (
        <div style={{padding: "0 20px"}}>
          {/* Search */}
          <div style={{position: "relative", marginBottom: 12}}>
            <div style={{position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none"}}>
              <Icon name="search" size={16} color={DS.colors.textMuted} />
            </div>
            <input type="text" placeholder="Search by number, exercise, or format..." value={filters.search} onChange={e => setFilters(prev => ({...prev, search: e.target.value}))} style={{...sty.searchInput, paddingLeft: 40}} />
          </div>

          {/* Duration quick filters */}
          <div style={{display: "flex", gap: 6, marginBottom: 10}}>
            {DURATION_FILTERS.map(df => (
              <button key={df.key} onClick={() => setDurationFilter(durationFilter === df.key ? null : df.key)} style={{
                ...sty.chipBtn, flex: 1, textAlign: "center", fontSize: 12, padding: "8px 6px",
                background: durationFilter === df.key ? DS.colors.green + "18" : DS.colors.surfaceLight,
                borderColor: durationFilter === df.key ? DS.colors.green : DS.colors.border,
                color: durationFilter === df.key ? DS.colors.green : DS.colors.textSub,
              }}>
                <Icon name="clock" size={12} color={durationFilter === df.key ? DS.colors.green : DS.colors.textMuted} /> {df.label}
              </button>
            ))}
          </div>

          {/* Sort options */}
          <div style={{display: "flex", gap: 6, marginBottom: 10, alignItems: "center"}}>
            <span style={{fontSize: 11, color: DS.colors.textMuted, fontWeight: 600}}>Sort:</span>
            {[
              { key: "id", label: "#" },
              { key: "duration", label: "Time" },
              { key: "difficulty", label: "Difficulty" },
              { key: "recent", label: "Last done" },
            ].map(s => (
              <button key={s.key} onClick={() => setSortBy(s.key)} style={{
                ...sty.chipBtn, fontSize: 11, padding: "5px 10px",
                background: sortBy === s.key ? DS.colors.orange + "18" : DS.colors.surfaceLight,
                borderColor: sortBy === s.key ? DS.colors.orange : DS.colors.border,
                color: sortBy === s.key ? DS.colors.orange : DS.colors.textSub,
              }}>{s.label}</button>
            ))}
          </div>

          {/* Filter buttons row */}
          <div style={{display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap"}}>
            {favs.length > 0 && (
              <button onClick={() => setShowFavsOnly(!showFavsOnly)} style={{...sty.filterToggle, borderColor: showFavsOnly ? "#ef4444" : DS.colors.border, color: showFavsOnly ? "#ef4444" : DS.colors.textSub}}>
                <Icon name="heart" size={14} color={showFavsOnly ? "#ef4444" : DS.colors.textMuted} strokeWidth={showFavsOnly ? 2.5 : 1.8} /> Favs {showFavsOnly && <span style={{...sty.filterBadge, background: "#ef4444"}}>{favs.length}</span>}
              </button>
            )}
            <button onClick={() => { setShowFilters(!showFilters); setShowExclusions(false); }} style={{...sty.filterToggle, borderColor: showFilters ? DS.colors.orange : DS.colors.border, color: showFilters ? DS.colors.orange : DS.colors.textSub}}>
              <Icon name="filter" size={14} color={showFilters ? DS.colors.orange : DS.colors.textMuted} /> Filters {activeFilterCount > 0 && <span style={sty.filterBadge}>{activeFilterCount}</span>}
            </button>
            <button onClick={() => { setShowExclusions(!showExclusions); setShowFilters(false); }} style={{...sty.filterToggle, borderColor: showExclusions ? "#ef4444" : DS.colors.border, color: showExclusions ? "#ef4444" : DS.colors.textSub}}>
              <Icon name="x" size={14} color={showExclusions ? "#ef4444" : DS.colors.textMuted} /> Injury {excludedMovements.length > 0 && <span style={{...sty.filterBadge, background: "#ef4444"}}>{excludedMovements.length}</span>}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} style={{...sty.filterToggle, borderColor: DS.colors.border, color: DS.colors.textMuted, fontSize: 12}}>Clear All</button>
            )}
          </div>

          {showFilters && (
            <div style={sty.filterPanel}>
              <FilterSection title="Equipment" items={ALL_EQUIPMENT} selected={filters.equipment} onToggle={v => toggleFilter("equipment", v)} />
              <FilterSection title="Difficulty" items={ALL_RATINGS} selected={filters.rating} onToggle={v => toggleFilter("rating", v)} colors={DIFFICULTY_COLORS} />
              <FilterSection title="Format" items={ALL_FORMATS} selected={filters.format} onToggle={v => toggleFilter("format", v)} />
              <FilterSection title="Focus" items={ALL_FOCUSES} selected={filters.focus} onToggle={v => toggleFilter("focus", v)} />
            </div>
          )}
          {showExclusions && (
            <div style={{...sty.filterPanel, borderColor: "#ef444440"}}>
              <div style={{fontSize: 13, color: "#ef4444", marginBottom: 4, fontWeight: 600}}>Select movements to EXCLUDE:</div>
              <div style={{fontSize: 11, color: DS.colors.textMuted, marginBottom: 12}}>Only filters the main workout section — warmup and core are ignored.</div>
              <div style={{display: "flex", flexWrap: "wrap", gap: 6}}>
                {ALL_WORKOUT_MOVEMENTS.map(m => (
                  <button key={m} onClick={() => toggleExclusion(m)} style={{
                    ...sty.chipBtn,
                    background: excludedMovements.includes(m) ? "#ef444425" : DS.colors.surfaceLight,
                    borderColor: excludedMovements.includes(m) ? "#ef4444" : DS.colors.border,
                    color: excludedMovements.includes(m) ? "#ef4444" : DS.colors.textSub,
                    textDecoration: excludedMovements.includes(m) ? "line-through" : "none",
                  }}>{m}</button>
                ))}
              </div>
            </div>
          )}

          {/* Workout cards */}
          <div style={{marginBottom: 80}}>
            {displayWorkouts.length === 0 ? (
              <div style={{textAlign: "center", padding: 40, color: DS.colors.textMuted}}>No workouts match your filters.</div>
            ) : displayWorkouts.map(w => {
              const cat = CATEGORY_PATTERNS[w.equipment] || CATEGORY_PATTERNS.Mixed;
              const rating = diffOverrides?.[w.id] || w.rating;
              const diffColor = DIFFICULTY_COLORS[rating] || "#888";
              return (
                <button key={w.id} onClick={() => onSelect(w)} style={{
                  ...sty.workoutCard, position: "relative", overflow: "hidden", borderLeft: `3px solid ${cat.accent}40`,
                }}>
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8}}>
                    <div style={{display: "flex", alignItems: "center", gap: 8}}>
                      <div style={{fontFamily: DS.font.display, fontSize: 22, color: "#fff", letterSpacing: 1}}>{w.custom ? w.name : `#${w.id}`}</div>
                      {w.custom && <span style={{fontSize: 9, fontWeight: 800, color: "#8b5cf6", background: "#8b5cf620", border: "1px solid #8b5cf650", borderRadius: DS.radius.pill, padding: "2px 7px", letterSpacing: 1}}>MINE</span>}
                      {favs && favs.includes(w.id) && <Icon name="heart" size={14} color="#ef4444" />}
                      {(() => {
                        const wLogs = logs ? logs.filter(l => l.workoutId === w.id) : [];
                        if (wLogs.length === 0) return null;
                        const lastLog = wLogs.sort((a,b) => new Date(b.date) - new Date(a.date))[0];
                        const daysAgo = Math.floor((Date.now() - new Date(lastLog.date).getTime()) / 86400000);
                        const daysLabel = daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo}d ago`;
                        return (
                          <span style={{fontSize: 10, fontWeight: 700, color: DS.colors.green, background: DS.colors.green + "15", borderRadius: DS.radius.pill, padding: "2px 8px", display: "flex", alignItems: "center", gap: 3}}>
                            <Icon name="checkCircle" size={10} color={DS.colors.green} /> {wLogs.length}x · {daysLabel}
                          </span>
                        );
                      })()}
                    </div>
                    <div style={{display: "flex", gap: 6, alignItems: "center"}}>
                      <span style={{fontSize: 10, fontWeight: 800, color: diffColor, background: diffColor + "15", padding: "3px 8px", borderRadius: DS.radius.pill}}>{rating}</span>
                      <span style={{fontSize: 12, fontWeight: 600, color: DS.colors.textMuted}}>{w.duration}m</span>
                    </div>
                  </div>
                  <div style={{display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap"}}>
                    <span style={{...sty.tagSmall, borderColor: DS.colors.border}}>{w.equipment.toLowerCase()}</span>
                    <span style={{...sty.tagSmall, color: /AMRAP|TABATA|EMOM|FOR TIME|CHIPPER|FIGHT|DEATH/i.test(w.format) ? DS.colors.orange : DS.colors.textSub, borderColor: /AMRAP|TABATA|EMOM|FOR TIME|CHIPPER|FIGHT|DEATH/i.test(w.format) ? DS.colors.orange + "40" : DS.colors.border}}>{w.format.toLowerCase()}</span>
                    <span style={{...sty.tagSmall, color: DS.colors.purple, borderColor: DS.colors.purple + "30"}}>{w.focus.toLowerCase()}</span>
                    <span style={{...sty.tagSmall, color: DS.colors.textMuted, borderColor: DS.colors.border}}>{w.wm.length} exercises</span>
                  </div>
                  <div style={{fontSize: 13, color: DS.colors.textMuted, lineHeight: 1.5, overflow: "hidden", maxHeight: 40}}>
                    {w.workout.substring(0, 100)}...
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSection({ title, items, selected, onToggle, colors }) {
  return (
    <div style={{marginBottom: 16}}>
      <div style={{fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1}}>{title}</div>
      <div style={{display: "flex", flexWrap: "wrap", gap: 6}}>
        {items.map(item => {
          const active = selected.includes(item);
          const col = colors?.[item] || "#ff8a3a";
          return (
            <button key={item} onClick={() => onToggle(item)} style={{
              ...sty.chipBtn,
              background: active ? (colors ? col + "25" : "#ff8a3a25") : "#1a1a2e",
              borderColor: active ? (colors ? col : "#ff8a3a") : "#444",
              color: active ? (colors ? col : "#ff8a3a") : "#ccc",
            }}>{item.toLowerCase()}</button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WORKOUT DETAIL (with START WORKOUT button + tappable exercises)
// ═══════════════════════════════════════════════════════════════
function WorkoutDetail({ workout: w, onExerciseTap, onStartWorkout, onLogWorkout, logs, diffOverrides, onEditLog, fontSizeKey, isFav, onToggleFav, onEditCustom, onDeleteCustom, onDuplicate }) {
  const [confirmDeleteCustom, setConfirmDeleteCustom] = useState(false);
  const customLogsCount = w.custom ? logs.filter(l => l.workoutId === w.id).length : 0;
  const contentFontSize = (FONT_SIZES[fontSizeKey] || FONT_SIZES.normal).base;
  // Customization state — loads from localStorage, falls back to original
  const [customRating, setCustomRating] = useState(() => getCustomization(w.id, "rating", w.rating));
  const [customDuration, setCustomDuration] = useState(() => getCustomization(w.id, "duration", w.duration));
  const [customWorkout, setCustomWorkout] = useState(() => getCustomization(w.id, "workout", w.workout));
  const [customWarmup, setCustomWarmup] = useState(() => getCustomization(w.id, "warmup", w.warmup));
  const [customCore, setCustomCore] = useState(() => getCustomization(w.id, "core", w.core));
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMode, setEditMode] = useState(null);
  const [tempValue, setTempValue] = useState("");

  // Re-sync when workout changes (navigating between workouts)
  useEffect(() => {
    setCustomRating(getCustomization(w.id, "rating", w.rating));
    setCustomDuration(getCustomization(w.id, "duration", w.duration));
    setCustomWorkout(getCustomization(w.id, "workout", w.workout));
    setCustomWarmup(getCustomization(w.id, "warmup", w.warmup));
    setCustomCore(getCustomization(w.id, "core", w.core));
  }, [w.id]);

  const isRatingCustomized = customRating !== w.rating;
  const isDurationCustomized = customDuration !== w.duration;
  const isWorkoutCustomized = customWorkout !== w.workout;
  const isWarmupCustomized = customWarmup !== w.warmup;
  const isCoreCustomized = customCore !== w.core;
  const hasAnyCustomization = isRatingCustomized || isDurationCustomized || isWorkoutCustomized || isWarmupCustomized || isCoreCustomized;

  // Use difficulty override from logging system OR customization
  const rating = diffOverrides?.[w.id] || customRating;

  const handleRatingChange = (r) => {
    setCustomRating(r);
    if (r === w.rating) clearCustomization(w.id, "rating");
    else saveCustomization(w.id, "rating", r);
    setShowEditModal(false); setEditMode(null);
  };

  const handleDurationSave = () => {
    const dur = parseInt(tempValue, 10);
    if (isNaN(dur) || dur < 1 || dur > 180) return;
    setCustomDuration(dur);
    if (dur === w.duration) clearCustomization(w.id, "duration");
    else saveCustomization(w.id, "duration", dur);
    setShowEditModal(false); setEditMode(null);
  };

  const handleTextSave = (field, setter, originalValue) => {
    const val = tempValue.trim();
    if (!val) return;
    setter(val);
    if (val === originalValue) clearCustomization(w.id, field);
    else saveCustomization(w.id, field, val);
    setShowEditModal(false); setEditMode(null);
  };

  const handleResetAll = () => {
    clearCustomization(w.id, "rating");
    clearCustomization(w.id, "duration");
    clearCustomization(w.id, "workout");
    clearCustomization(w.id, "warmup");
    clearCustomization(w.id, "core");
    setCustomRating(w.rating);
    setCustomDuration(w.duration);
    setCustomWorkout(w.workout);
    setCustomWarmup(w.warmup);
    setCustomCore(w.core);
    setShowEditModal(false); setEditMode(null);
  };

  const openEdit = (mode) => {
    setEditMode(mode);
    if (mode === "duration") setTempValue(String(customDuration));
    else if (mode === "workout") setTempValue(customWorkout);
    else if (mode === "warmup") setTempValue(customWarmup);
    else if (mode === "core") setTempValue(customCore);
    setShowEditModal(true);
  };

  return (
    <div style={sty.content}>
      {/* ── Hero header area ── */}
      <div style={{marginBottom: 16}}>
        {/* Category + focus label */}
        <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 8}}>
          <span style={{fontSize: 10, fontWeight: 800, color: DS.colors.orange, letterSpacing: 1}}>
            {w.focus.toUpperCase()}
          </span>
        </div>

        {/* Workout ID + fav + rating */}
        <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 14}}>
          <div style={{fontFamily: DS.font.display, fontSize: w.custom ? 32 : 42, color: "#fff", letterSpacing: 1, lineHeight: 1}}>{w.custom ? w.name : `WOD #${w.id}`}</div>
          {w.custom && <span style={{fontSize: 10, fontWeight: 800, color: "#8b5cf6", background: "#8b5cf620", border: "1px solid #8b5cf650", borderRadius: DS.radius.pill, padding: "3px 8px", letterSpacing: 1}}>MINE</span>}
          <button onClick={onToggleFav} style={{
            background: isFav ? "#ef444418" : "none", border: `1px solid ${isFav ? "#ef4444" : DS.colors.border}`,
            borderRadius: DS.radius.md, padding: "6px 8px", cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center",
          }}>
            <Icon name="heart" size={18} color={isFav ? "#ef4444" : DS.colors.textMuted} strokeWidth={isFav ? 2.5 : 1.5} />
          </button>
        </div>
        {/* Custom workout controls */}
        {w.custom && (
          <div style={{display: "flex", gap: 8, marginBottom: 14}}>
            <button onClick={onEditCustom} style={{flex: 1, background: "#8b5cf615", border: "1px solid #8b5cf650", borderRadius: 10, padding: "10px", color: "#8b5cf6", fontSize: 13, fontWeight: 700, cursor: "pointer"}}>{"✏️"} Edit</button>
            <button onClick={() => setConfirmDeleteCustom(true)} style={{flex: 1, background: "#ef444410", border: "1px solid #ef444440", borderRadius: 10, padding: "10px", color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer"}}>{"🗑"} Delete</button>
          </div>
        )}
        {confirmDeleteCustom && (
          <div style={{background: "#1a0a0a", border: "1px solid #ef444440", borderRadius: 12, padding: 14, marginBottom: 14}}>
            <div style={{fontSize: 13, color: "#ef4444", marginBottom: 4, fontWeight: 700}}>Delete "{w.name}"?</div>
            {customLogsCount > 0 && <div style={{fontSize: 12, color: "#888", marginBottom: 8}}>Your {customLogsCount} logged session{customLogsCount > 1 ? "s" : ""} will stay in History.</div>}
            <div style={{display: "flex", gap: 8}}>
              <button onClick={() => setConfirmDeleteCustom(false)} style={{flex: 1, background: "#222", border: "1px solid #444", borderRadius: 8, padding: "8px", color: "#999", fontSize: 12, cursor: "pointer"}}>Cancel</button>
              <button onClick={onDeleteCustom} style={{flex: 1, background: "#ef444425", border: "1px solid #ef4444", borderRadius: 8, padding: "8px", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer"}}>Delete</button>
            </div>
          </div>
        )}

        {/* Stat bar — Duration, Equipment, Difficulty */}
        <div style={{display: "flex", gap: 0, marginBottom: 16, background: DS.colors.surface, borderRadius: DS.radius.lg, border: `1px solid ${DS.colors.border}`, overflow: "hidden"}}>
          <button onClick={() => openEdit("duration")} style={{flex: 1, padding: "12px 14px", background: "none", border: "none", borderRight: `1px solid ${DS.colors.border}`, cursor: "pointer", textAlign: "center"}}>
            <div style={{fontSize: 10, fontWeight: 700, color: DS.colors.textMuted, letterSpacing: 1, marginBottom: 4}}>DURATION</div>
            <div style={{fontSize: 18, fontWeight: 800, color: "#fff"}}>{customDuration}<span style={{fontSize: 12, fontWeight: 600, color: DS.colors.textMuted}}>m</span></div>
          </button>
          <div style={{flex: 1, padding: "12px 14px", borderRight: `1px solid ${DS.colors.border}`, textAlign: "center"}}>
            <div style={{fontSize: 10, fontWeight: 700, color: DS.colors.textMuted, letterSpacing: 1, marginBottom: 4}}>EQUIPMENT</div>
            <div style={{fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 4}}>
              <Icon name="dumbbell" size={16} color={DS.colors.orange} /> {w.equipment}
            </div>
          </div>
          <button onClick={() => openEdit("rating")} style={{flex: 1, padding: "12px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "center"}}>
            <div style={{fontSize: 10, fontWeight: 700, color: DS.colors.textMuted, letterSpacing: 1, marginBottom: 4}}>DIFFICULTY</div>
            <div style={{display: "flex", justifyContent: "center", gap: 3}}>
              {[0,1,2].map(i => (
                <div key={i} style={{width: 18, height: 6, borderRadius: 3, background: i < ({"Easy":1,"Medium":2,"Hard":3,"Very Hard":3}[rating] || 1) ? DIFFICULTY_COLORS[rating] || DS.colors.orange : DS.colors.border}} />
              ))}
            </div>
          </button>
        </div>

        {/* ── START WORKOUT — concept neon green ── */}
        <button onClick={onStartWorkout} style={{
          width: "100%", background: DS.gradient.greenNeon, border: "none", borderRadius: DS.radius.xl,
          padding: "18px 20px", color: "#000", fontSize: 18, fontWeight: 800, cursor: "pointer",
          letterSpacing: 1, fontFamily: DS.font.display, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12,
        }}>
          <Icon name="play" size={20} color="#000" strokeWidth={3} /> START WORKOUT
        </button>

        {/* Secondary action buttons */}
        <div style={{display: "flex", gap: 8, marginBottom: 16}}>
          <button onClick={() => {
            const text = `PARK WOD #${w.id}\n${w.format} | ${w.equipment} | ${customDuration}min | ${rating}\nFocus: ${w.focus}\n\n` +
              ((customWarmup || w.warmup) ? `WARMUP:\n${customWarmup || w.warmup}\n\n` : "") +
              `WORKOUT:\n${customWorkout || w.workout}\n` +
              ((customCore || w.core) ? `\nCORE:\n${customCore || w.core}` : "");
            if (navigator.clipboard) {
              navigator.clipboard.writeText(text).then(() => {
                const btn = document.getElementById("share-btn-" + w.id);
                if (btn) { btn.textContent = "\u2705"; setTimeout(() => { btn.textContent = "Share"; }, 1500); }
              });
            }
          }} id={"share-btn-" + w.id} style={{
            flex: 1, background: DS.colors.surface, border: `1px solid ${DS.colors.border}`,
            borderRadius: DS.radius.lg, padding: "12px 16px", color: DS.colors.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: DS.font.body,
          }}>
            <Icon name="share" size={16} color={DS.colors.textMuted} /> Share
          </button>
          <button onClick={onLogWorkout} style={{
            flex: 1, background: DS.colors.surface, border: `1px solid ${DS.colors.border}`,
            borderRadius: DS.radius.lg, padding: "12px 16px", color: DS.colors.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: DS.font.body,
          }}>
            <Icon name="clipboard" size={16} color={DS.colors.textMuted} /> Log Result
          </button>
          <button onClick={onDuplicate} style={{
            flex: 1, background: DS.colors.surface, border: `1px solid ${DS.colors.border}`,
            borderRadius: DS.radius.lg, padding: "12px 16px", color: DS.colors.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: DS.font.body,
          }}>
            <Icon name="copy" size={16} color={DS.colors.textMuted} /> Duplicate
          </button>
        </div>

        {/* Phase preview */}
        {(() => {
          const phases = [];
          if (customWarmup || w.warmup) phases.push({ label: "Warmup", color: "#eab308", icon: "fire" });
          const blocks = getWorkoutBlocks(w, "workout", customWorkout || w.workout);
          blocks.forEach((b, i) => {
            const label = b.timer?.label || (blocks.length > 1 ? `Part ${i+1}` : "Workout");
            phases.push({ label, color: DS.colors.orange, icon: "zap" });
          });
          if (customCore || w.core) {
            const coreBlocks = getWorkoutBlocks(w, "core", customCore || w.core);
            coreBlocks.forEach(() => phases.push({ label: "Core", color: "#8b5cf6", icon: "target" }));
          }
          return phases.length > 1 ? (
            <div style={{display: "flex", alignItems: "center", gap: 4, marginBottom: 14, flexWrap: "wrap"}}>
              <span style={{fontSize: 11, color: DS.colors.textMuted, fontWeight: 700, marginRight: 4}}>{phases.length} PHASES:</span>
              {phases.map((p, i) => (
                <React.Fragment key={i}>
                  <span style={{fontSize: 11, color: p.color, fontWeight: 600, background: p.color + "12", padding: "3px 10px", borderRadius: DS.radius.pill, display: "inline-flex", alignItems: "center", gap: 4}}>
                    <Icon name={p.icon} size={11} color={p.color} /> {p.label}
                  </span>
                  {i < phases.length - 1 && <Icon name="chevronRight" size={10} color={DS.colors.textMuted} />}
                </React.Fragment>
              ))}
            </div>
          ) : null;
        })()}

        {/* Reset customizations button */}
        {hasAnyCustomization && (
          <button onClick={handleResetAll} style={{width: "100%", background: "none", border: "1px solid #ef444430", borderRadius: DS.radius.md, padding: "8px 12px", color: "#ef4444", fontSize: 12, cursor: "pointer", marginBottom: 16, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: DS.font.body}}>
            <Icon name="rotateCcw" size={12} color="#ef4444" /> Reset all customizations to original
          </button>
        )}
      </div>

      {/* Workout sections - now editable with tap-to-edit hint */}
      {(customWarmup || w.warmup) && (
        <div onClick={() => openEdit("warmup")} style={{cursor: "pointer", position: "relative"}}>
          <WorkoutSection title={`WARMUP ${isWarmupCustomized ? "\u270F\uFE0F" : ""}`} icon={"\u{1F525}"} color="#eab308" content={customWarmup || w.warmup} onExerciseTap={onExerciseTap} fontSize={contentFontSize} />
        </div>
      )}
      <div onClick={() => openEdit("workout")} style={{cursor: "pointer", position: "relative"}}>
        <WorkoutSection title={`WORKOUT ${isWorkoutCustomized ? "\u270F\uFE0F" : ""}`} icon={"\u{1F4AA}"} color="#ff8a3a" content={customWorkout || w.workout} onExerciseTap={onExerciseTap} fontSize={contentFontSize} />
      </div>
      {(customCore || w.core) && (
        <div onClick={() => openEdit("core")} style={{cursor: "pointer", position: "relative"}}>
          <WorkoutSection title={`CORE ${isCoreCustomized ? "\u270F\uFE0F" : ""}`} icon={"\u{1F9E0}"} color="#8b5cf6" content={customCore || w.core} onExerciseTap={onExerciseTap} fontSize={contentFontSize} />
        </div>
      )}

      <div style={{textAlign: "center", fontSize: 11, color: "#555", marginBottom: 16, marginTop: -8}}>
        Tap any section above to edit reps or exercises
      </div>

      {/* Workout Log History */}
      {logs && <WorkoutLogHistory workoutId={w.id} logs={logs} diffOverrides={diffOverrides || {}} onEditLog={onEditLog} />}

      <div style={{marginBottom: 20}}>
        <div style={{fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1}}>
          Movements — tap for info
        </div>
        <div style={{display: "flex", flexWrap: "wrap", gap: 6}}>
          {w.movements.map(m => (
            <button key={m} onClick={() => onExerciseTap(m)} style={{...sty.tagSmall, background: "#1a1a2e", cursor: "pointer", borderColor: EXERCISE_INFO[m] ? "#ff8a3a50" : "#333"}}>
              {EXERCISE_INFO[m] ? "\u{2139}\uFE0F " : ""}{m}
            </button>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={sty.modalOverlay} onClick={() => { setShowEditModal(false); setEditMode(null); }}>
          <div style={sty.modalContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => { setShowEditModal(false); setEditMode(null); }} style={sty.modalClose}>{"\u2715"}</button>

            {editMode === "rating" && (
              <>
                <div style={{fontSize: 18, fontWeight: 800, color: "#ff8a3a", marginBottom: 16}}>Change Difficulty</div>
                <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                  {ALL_RATINGS.map(r => (
                    <button key={r} onClick={() => handleRatingChange(r)} style={{background: customRating === r ? (DIFFICULTY_COLORS[r] || "#888") + "30" : "#22222e", border: `2px solid ${customRating === r ? (DIFFICULTY_COLORS[r] || "#888") : "#333"}`, borderRadius: 12, padding: "12px 16px", color: DIFFICULTY_COLORS[r] || "#888", fontSize: 15, fontWeight: 700, cursor: "pointer", textAlign: "left"}}>
                      {r} {r === w.rating && <span style={{fontSize: 11, color: "#888"}}>(original)</span>}
                    </button>
                  ))}
                </div>
              </>
            )}

            {editMode === "duration" && (
              <>
                <div style={{fontSize: 18, fontWeight: 800, color: "#ff8a3a", marginBottom: 4}}>Edit Duration</div>
                <div style={{fontSize: 12, color: "#888", marginBottom: 16}}>Original: {w.duration} min</div>
                <input type="number" value={tempValue} onChange={e => setTempValue(e.target.value)} style={{width: "100%", background: "#111122", border: "1px solid #444", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 18, boxSizing: "border-box", textAlign: "center"}} min="1" max="180" />
                <button onClick={handleDurationSave} style={{width: "100%", marginTop: 16, background: "linear-gradient(135deg, #3ddc84, #2bb86a)", border: "none", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer"}}>Save</button>
              </>
            )}

            {(editMode === "workout" || editMode === "warmup" || editMode === "core") && (
              <>
                <div style={{fontSize: 18, fontWeight: 800, color: "#ff8a3a", marginBottom: 4}}>
                  Edit {editMode === "workout" ? "Workout" : editMode === "warmup" ? "Warmup" : "Core"}
                </div>
                <div style={{fontSize: 12, color: "#888", marginBottom: 16}}>Change reps, exercises, or instructions</div>
                <textarea value={tempValue} onChange={e => setTempValue(e.target.value)} style={{width: "100%", height: 200, background: "#111122", border: "1px solid #444", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, boxSizing: "border-box", resize: "vertical", lineHeight: 1.6}} />
                <div style={{display: "flex", gap: 10, marginTop: 16}}>
                  <button onClick={() => {
                    const orig = editMode === "workout" ? w.workout : editMode === "warmup" ? w.warmup : w.core;
                    setTempValue(orig);
                  }} style={{flex: 1, background: "#333", border: "none", borderRadius: 12, padding: "14px", color: "#ccc", fontSize: 14, cursor: "pointer"}}>Reset</button>
                  <button onClick={() => {
                    if (editMode === "workout") handleTextSave("workout", setCustomWorkout, w.workout);
                    else if (editMode === "warmup") handleTextSave("warmup", setCustomWarmup, w.warmup);
                    else handleTextSave("core", setCustomCore, w.core);
                  }} style={{flex: 1, background: "linear-gradient(135deg, #3ddc84, #2bb86a)", border: "none", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer"}}>Save</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{height: 100}} />
    </div>
  );
}

function WorkoutSection({ title, icon, color, content, onExerciseTap, fontSize }) {
  const textSize = fontSize || 15;
  const lines = content.split("\n").filter(l => l.trim());
  return (
    <div style={{marginBottom: 20, background: "#111122", borderRadius: 16, overflow: "hidden", border: `1px solid ${color}30`}}>
      <div style={{padding: "12px 16px", background: color + "15", borderBottom: `1px solid ${color}30`, display: "flex", alignItems: "center", gap: 8}}>
        <span style={{fontSize: 18}}>{icon}</span>
        <span style={{fontSize: 14, fontWeight: 800, color: color, letterSpacing: 1}}>{title}</span>
      </div>
      <div style={{padding: 16}}>
        {lines.map((line, i) => (
          <div key={i} style={{fontSize: textSize, color: "#e0e0e0", lineHeight: 1.7, marginBottom: i < lines.length - 1 ? 6 : 0}}>
            <HighlightedText text={line} onExerciseTap={onExerciseTap} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const sty = {
  app: { background: DS.colors.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", fontFamily: DS.font.body, color: "#fff", position: "relative" },
  header: { padding: "14px 20px 10px", borderBottom: "1px solid " + DS.colors.border },
  logo: { display: "flex", gap: 4, alignItems: "baseline" },
  backBtn: { background: "none", border: "none", color: DS.colors.orange, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0 },
  content: { padding: "16px 20px", overflowY: "auto", maxHeight: "calc(100vh - 140px)" },
  hero: { marginBottom: 28 },
  primaryBtn: { flex: 1, background: DS.gradient.orange, border: "none", borderRadius: DS.radius.xl, padding: "16px 20px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: DS.font.body },
  secondaryBtn: { flex: 1, background: DS.colors.surfaceLight, border: "1px solid " + DS.colors.border, borderRadius: DS.radius.xl, padding: "16px 20px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: DS.font.body },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 },
  statCard: { background: DS.colors.surface, border: "1px solid " + DS.colors.border, borderRadius: DS.radius.lg, padding: "12px 16px", flex: "1 1 70px", minWidth: 70 },
  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, display: "flex", justifyContent: "space-around", background: DS.colors.bg, borderTop: "1px solid " + DS.colors.border, padding: "8px 0 12px", zIndex: 100, backdropFilter: "blur(10px)" },
  navBtn: { background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", padding: "4px 12px", fontFamily: DS.font.body },
  searchInput: { width: "100%", background: DS.colors.surface, border: "1px solid " + DS.colors.border, borderRadius: DS.radius.lg, padding: "14px 16px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: DS.font.body },
  filterToggle: { background: "none", border: "1px solid " + DS.colors.border, borderRadius: DS.radius.pill, padding: "8px 14px", color: DS.colors.textSub, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: DS.font.body },
  filterBadge: { background: DS.colors.orange, color: "#000", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 800 },
  filterPanel: { background: DS.colors.bg, border: "1px solid " + DS.colors.border, borderRadius: DS.radius.xl, padding: 16, marginBottom: 16 },
  chipBtn: { background: DS.colors.surfaceLight, border: "1px solid " + DS.colors.border, borderRadius: DS.radius.pill, padding: "6px 12px", color: DS.colors.textSub, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", fontFamily: DS.font.body },
  workoutCard: { display: "block", width: "100%", textAlign: "left", background: DS.colors.surface, border: "1px solid " + DS.colors.border, borderRadius: DS.radius.xl, padding: 16, marginBottom: 10, cursor: "pointer", fontFamily: DS.font.body },
  badge: { padding: "4px 10px", borderRadius: DS.radius.sm, fontSize: 12, fontWeight: 700, border: "1px solid transparent" },
  tagSmall: { fontSize: 11, color: DS.colors.textSub, border: "1px solid " + DS.colors.border, borderRadius: 6, padding: "3px 8px", background: "none" },
  tagDetail: { fontSize: 13, color: DS.colors.textSub, borderRadius: DS.radius.md, padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 4 },
  // Exercise highlight
  exerciseHighlight: { color: "#60a5fa", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3, cursor: "pointer" },
  // Modal
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modalContent: { background: DS.colors.surfaceLight, borderRadius: DS.radius.xl, padding: 24, maxWidth: 380, width: "100%", border: "1px solid " + DS.colors.border, position: "relative", maxHeight: "80vh", overflowY: "auto" },
  modalClose: { position: "absolute", top: 12, right: 16, background: "none", border: "none", color: DS.colors.textMuted, fontSize: 20, cursor: "pointer" },
  // Full screen workout mode
  fsOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: DS.colors.bg, zIndex: 900, display: "flex", flexDirection: "column" },
  fsTopBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid " + DS.colors.border },
  fsExitBtn: { background: "none", border: "1px solid " + DS.colors.border, borderRadius: DS.radius.md, padding: "8px 16px", color: "#ef4444", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  fsDots: { display: "flex", justifyContent: "center", gap: 8, padding: "16px 20px 0", alignItems: "center" },
  fsDot: { height: 10, borderRadius: 5, transition: "all 0.3s ease" },
  fsContent: { flex: 1, overflowY: "auto", paddingBottom: 100 },
  fsNavBar: { position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 28px", background: "linear-gradient(transparent, " + DS.colors.bg + " 30%)" },
  fsPrevBtn: { background: "none", border: "1px solid " + DS.colors.border, borderRadius: DS.radius.xl, padding: "14px 22px", color: DS.colors.textSub, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  fsNextBtn: { border: "none", borderRadius: DS.radius.xl, padding: "14px 28px", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" },
  // Start workout button
  startWorkoutBtn: { width: "100%", background: DS.gradient.green, border: "none", borderRadius: DS.radius.xl, padding: "18px 20px", color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer", letterSpacing: 0.5, fontFamily: DS.font.body },
};


    // Mount the app — wrapped in the error boundary so a crash shows a
    // recoverable screen instead of going blank
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(ErrorBoundary, null, React.createElement(App)));
  