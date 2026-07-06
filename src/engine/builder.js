// ═══════════════════════════════════════════════════════════════
// WORKOUT BUILDER ENGINE — pure compile layer (fully testable)
// ═══════════════════════════════════════════════════════════════
// The builder is structured-only: users assemble explicit blocks, and this
// module compiles a draft into a normal workout object with DECLARED timer
// configs (same shapes the runtime already consumes) plus generated display
// text. No parsing, no guessing — the inverse of the Phase 4 conversion.
//
// Draft shape (what the BuilderScreen edits, and what we store for re-edit):
// {
//   name, equipment, focus, rating,
//   warmup: "free text",
//   blocks: [ { kind, minutes?, workSeconds?, restSeconds?, rounds?,
//               exerciseSeconds?, capMinutes?, exercises: [{reps, name}] } ],
//   coreBlocks: [ same ],
// }
import { EXERCISE_INFO } from "../data/exercises.js";

export const BLOCK_KINDS = [
  { kind: "amrap", label: "AMRAP", desc: "As many rounds as possible in a set time" },
  { kind: "emom", label: "EMOM", desc: "One exercise slot per minute, cycling" },
  { kind: "tabata", label: "Tabata", desc: "Work/rest intervals across stations" },
  { kind: "rounds", label: "Rounds", desc: "Fixed rounds, at your own pace" },
  { kind: "fortime", label: "For Time", desc: "Race the clock, optional time cap" },
  { kind: "circuit", label: "Timed Circuit", desc: "Fixed seconds per exercise" },
];

const exLine = (e) => (e.reps ? `${e.reps} ${e.name}` : e.name).trim();
const exNames = (block) => block.exercises.filter(e => e.name && e.name.trim()).map(exLine);

// ── per-kind compile: draft block -> { content, timer } ──
const COMPILERS = {
  amrap(b) {
    const mins = Number(b.minutes);
    return {
      content: `${mins} Min AMRAP: ${exNames(b).join(", ")}`,
      timer: { type: "countdown", totalSeconds: mins * 60, label: `${mins} Min AMRAP` },
    };
  },
  emom(b) {
    const mins = Number(b.minutes);
    const list = exNames(b);
    return {
      content: `${mins} Min EMOM - alternating\n` + list.map((x, i) => `Min ${i + 1}: ${x}`).join("\n"),
      timer: { type: "emom", totalSeconds: mins * 60, totalMinutes: mins, exercises: list, label: `EMOM ${mins} Min` },
    };
  },
  tabata(b) {
    const work = Number(b.workSeconds), rest = Number(b.restSeconds), rounds = Number(b.rounds);
    const list = exNames(b);
    return {
      content: `Tabata ${work}/${rest} - ${rounds} rounds per exercise\n${list.join(", ")}`,
      timer: { type: "tabata", workSeconds: work, restSeconds: rest, rounds, stations: list.length, exercises: list, label: `Tabata ${work}s/${rest}s` },
    };
  },
  rounds(b) {
    const rounds = Number(b.rounds);
    return {
      content: `${rounds} Rounds - ${exNames(b).join(", ")}`,
      timer: { type: "stopwatch", label: "Rounds" },
    };
  },
  fortime(b) {
    const cap = Number(b.capMinutes) || 0;
    return {
      content: `For Time - ${exNames(b).join(", ")}${cap ? `\nTime cap: ${cap} min` : ""}`,
      timer: { type: "stopwatch", capSeconds: cap > 0 ? cap * 60 : null, label: cap ? `For Time (${cap}m)` : "For Time" },
    };
  },
  circuit(b) {
    const exSec = Number(b.exerciseSeconds), rest = Number(b.restSeconds) || 0, rounds = Number(b.rounds);
    const list = exNames(b);
    const roundLen = list.length * exSec + rest;
    return {
      content: `${rounds} rounds - ${exSec}s per exercise${rest ? `, ${rest}s rest between rounds` : ""}\n${list.join(", ")}`,
      timer: { type: "circuit", exerciseSeconds: exSec, restSeconds: rest, totalSeconds: rounds * roundLen, exercises: list, label: `Timed Circuit — ${list.length} × ${exSec}s` },
    };
  },
};

// Which numeric fields each kind requires (used by validation and the UI)
export const KIND_FIELDS = {
  amrap: ["minutes"],
  emom: ["minutes"],
  tabata: ["workSeconds", "restSeconds", "rounds"],
  rounds: ["rounds"],
  fortime: [],          // capMinutes optional
  circuit: ["exerciseSeconds", "rounds"],
};

export function validateDraft(draft) {
  const problems = [];
  if (!draft.name || !draft.name.trim()) problems.push("Give the workout a name");
  const all = [...(draft.blocks || []), ...(draft.coreBlocks || [])];
  if (!(draft.blocks || []).length) problems.push("Add at least one workout block");
  all.forEach((b, i) => {
    const where = i < (draft.blocks || []).length ? `Block ${i + 1}` : "Core block";
    if (!COMPILERS[b.kind]) { problems.push(`${where}: unknown format`); return; }
    for (const f of KIND_FIELDS[b.kind]) {
      if (!Number(b[f]) || Number(b[f]) <= 0) problems.push(`${where}: enter ${f.replace(/([A-Z])/g, " $1").toLowerCase()}`);
    }
    if (exNames(b).length === 0) problems.push(`${where}: add at least one exercise`);
    if (b.kind === "emom" && Number(b.minutes) > 0 && exNames(b).length > Number(b.minutes))
      problems.push(`${where}: more exercises than minutes`);
  });
  return problems;
}

// Match typed exercise names against the encyclopedia so info modals,
// highlighting and injury filtering work for known movements.
export function deriveMovements(names) {
  const found = new Set();
  for (const raw of names) {
    const n = raw.toLowerCase().replace(/^\d+\s*/, "");
    for (const [key, info] of Object.entries(EXERCISE_INFO)) {
      const candidates = [key, info.name.toLowerCase(), ...(info.aka ? info.aka.toLowerCase().split(",").map(s => s.trim()) : [])];
      if (candidates.some(c => c && (n.includes(c) || c.includes(n)))) { found.add(key); break; }
    }
  }
  return [...found].sort();
}

// Estimated duration in minutes for the card display
function estimateDuration(blocks, coreBlocks, hasWarmup) {
  let mins = hasWarmup ? 5 : 0;
  for (const b of [...blocks, ...coreBlocks]) {
    const t = COMPILERS[b.kind] ? COMPILERS[b.kind](b).timer : null;
    if (t && t.totalSeconds) mins += Math.ceil(t.totalSeconds / 60);
    else if (t && t.capSeconds) mins += Math.ceil(t.capSeconds / 60);
    else mins += Math.max(5, (Number(b.rounds) || 1) * exNames(b).length); // rough pace for untimed
  }
  return Math.max(10, Math.round(mins / 5) * 5);
}

const KIND_TO_FORMAT = { amrap: "AMRAP", emom: "EMOM", tabata: "TABATA", rounds: "ROUNDS", fortime: "FOR TIME", circuit: "ROUNDS" };

// Compile a draft into a full workout object. `id` like "c1". The draft is
// stored on the object so editing reopens exactly what was built.
export function compileWorkout(draft, id) {
  const blocks = (draft.blocks || []).map(b => COMPILERS[b.kind](b));
  const coreBlocks = (draft.coreBlocks || []).map(b => COMPILERS[b.kind](b));
  const allNames = [...(draft.blocks || []), ...(draft.coreBlocks || [])].flatMap(exNames);
  const movements = deriveMovements(allNames);
  const format = (draft.blocks || []).length === 1 ? KIND_TO_FORMAT[draft.blocks[0].kind] : "MIXED";
  return {
    id,
    custom: true,
    name: draft.name.trim(),
    rating: draft.rating || "Medium",
    duration: estimateDuration(draft.blocks || [], draft.coreBlocks || [], !!(draft.warmup || "").trim()),
    equipment: draft.equipment || "BODYWEIGHT",
    format,
    focus: draft.focus || "Full Body",
    movements,
    wm: movements,
    warmup: (draft.warmup || "").trim(),
    workout: blocks.map(b => b.content).join("\n"),
    core: coreBlocks.map(b => b.content).join("\n"),
    blocks: { workout: blocks, ...(coreBlocks.length ? { core: coreBlocks } : {}) },
    draft,
  };
}

export function newDraft() {
  return { name: "", equipment: "BODYWEIGHT", focus: "Full Body", rating: "Medium", warmup: "", blocks: [], coreBlocks: [] };
}

export function newBlock(kind) {
  return { kind, minutes: "", workSeconds: kind === "tabata" ? 40 : "", restSeconds: kind === "tabata" ? 20 : (kind === "circuit" ? 60 : ""), rounds: "", exerciseSeconds: kind === "circuit" ? 30 : "", capMinutes: "", exercises: [{ reps: "", name: "" }] };
}
