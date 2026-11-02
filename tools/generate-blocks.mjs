// Phase 4 generator: convert every workout's prose into stored block
// structure by running the (test-covered) parser ONCE, at build time.
//   node tools/generate-blocks.mjs           # regenerate src/data/blocks.js
//   node tools/generate-blocks.mjs --report  # also print per-workout summary
//
// The output file is DATA: reviewable, diffable, and hand-fixable. If a
// workout is misinterpreted, correct its entry in src/data/blocks.js (the
// declared structure wins over the parser at runtime).
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseBlocks } from "../src/engine/blocks.js";
import { RAW_DATA } from "../src/data/workouts.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const report = process.argv.includes("--report");

// ── DECLARED CORRECTIONS ──
// Where the parser's inference is wrong, the correct structure is declared
// here and merged over the generated blocks. Two kinds of correction:
//
//   splits — line indices (into the workout's non-empty lines) at which a NEW
//     block starts. Used where one session's prose fuses two distinct parts
//     that should each get their own phase and clock: almost always a running
//     section welded to a rounds circuit ("4 Laps …" then "4 Rounds …"). The
//     parser only splits on explicit format headers (AMRAP/EMOM/Tabata/THEN),
//     so these read as one block and the run silently borrows the circuit's
//     timer — or worse, swallows it.
//
//   timers / coreTimers — replace the detected timer for a given block index
//     (indices refer to the FINAL, post-split block array).
//
// Reviewed June 2026 (#35/71/80/97) and July 2026 (everything else).
const secs = (n) => n;

// "30s per exercise, 30s rest after each pair" — very common in this library,
// and not expressible as a plain circuit (which rests once per round).
const pairCircuit = (exercises, { rounds = 1, exerciseSeconds = 30, restSeconds = 30 } = {}) => {
  const pairs = Math.ceil(exercises.length / 2);
  return {
    type: "circuit", exerciseSeconds, restSeconds, restEvery: 2, rounds, exercises,
    totalSeconds: rounds * (exercises.length * exerciseSeconds + pairs * restSeconds),
    label: rounds > 1
      ? `Pair Circuit — ${rounds} × ${pairs} pairs`
      : `Pair Circuit — ${pairs} × ${exerciseSeconds}s pairs`,
  };
};

// A plain run of timed efforts, no rest.
const timedRun = (exercises, exerciseSeconds = 30) => ({
  type: "circuit", exerciseSeconds, restSeconds: 0, rounds: 1, exercises,
  totalSeconds: exercises.length * exerciseSeconds,
  label: `Timed Circuit — ${exercises.length} × ${exerciseSeconds}s`,
});

// A core circuit that gives EVERY move in the round its own clock segment.
//
// The parser only picks up moves written as a duration ("30s Plank"), so in a
// round like "30 Russian Twist, 20 Bicycle Crunch, 30s Plank" it built a
// circuit of one exercise: the clock timed the plank, declared the round done
// after 30s, and the rep work never existed as far as the timer or the voice
// were concerned. Reported for #139 (flutter kicks missing from the core
// timer) and true of thirty more sessions.
//
// The rep counts stay in the block text as the target to hit inside the
// window; the clock's job is to run the whole round, not just its held parts.
const coreCircuit = (exercises, rounds, { exerciseSeconds = 30, restSeconds = 0 } = {}) => ({
  type: "circuit", exerciseSeconds, restSeconds, rounds, exercises,
  totalSeconds: rounds * (exercises.length * exerciseSeconds + restSeconds),
  label: `Core Circuit — ${rounds} Rounds`,
});

// Station-major tabata by default: every exercise is worked for `rounds`
// cycles before the list moves on ("8 rounds per exercise", "2 rounds each").
// Pass { rotate: true } for "N rounds" of a list, which means one cycle of each
// exercise in turn and then back to the first — a body can't hold 4 straight
// minutes of 40s push-ups, so these must NOT run exercise-by-exercise.
const tabata = (exercises, rounds, workSeconds = 40, restSeconds = 20, { rotate = false } = {}) => ({
  type: "tabata", workSeconds, restSeconds, rounds, stations: exercises.length,
  exercises, ...(rotate ? { rotate: true } : {}), label: `Tabata ${workSeconds}s/${restSeconds}s`,
});

const countdown = (seconds, label) => ({ type: "countdown", totalSeconds: secs(seconds), label });

const stopwatch = (label = "Rounds") => ({ type: "stopwatch", label });

const CORRECTIONS = {
  // ── EMOM/Tabata lists the parser could not extract ──
  35: { timers: { 0: { type: "emom", totalSeconds: 720, totalMinutes: 12, label: "12 Min EMOM (3 rounds × 4)",
    exercises: ["15 Weighted Squats", "20 Hammer curls", "10 Thrusters", "10 DB lunge w twists"] } } },
  71: { timers: { 1: { type: "emom", totalSeconds: 1260, totalMinutes: 21, label: "EMOM 21 Min",
    exercises: ["15 pull-up rows", "6 sandbag clean and press", "9 burpees"] } } },
  80: { timers: {
    0: { type: "emom", totalSeconds: 720, totalMinutes: 12, label: "EMOM 12 Min",
      exercises: ["12 push-up", "12 KB Squat"] },
    1: { type: "tabata", workSeconds: 40, restSeconds: 20, rounds: 3, stations: 5, rotate: true, label: "Tabata 40s/20s",
      exercises: ["KB Swings", "KB High-pull", "KB lunges", "KB Rows", "Burpees"] },
  } },
  97: { timers: { 0: { type: "emom", totalSeconds: 1500, totalMinutes: 25, label: "EMOM 25 Min (5 rounds × 5)",
    exercises: ["10 KB Swing + 5 Jump SQ", "10 Push-up + 6 step-up", "10 KB rows + 10 Mountain Climbers", "12 Goblet SQ", "30s Plank"] } } },

  // ── running section fused to the main circuit ──
  6:   { splits: [1] },
  10:  { splits: [1] },
  11:  { splits: [1] },
  13:  { splits: [1, 2] },
  // block 1 mixes one timed hold with six rep-based moves — a circuit clock
  // would time only the plank and drop the rest, so count up instead
  15:  { splits: [1, 2], timers: { 1: stopwatch("Rounds") } },
  20:  { splits: [1] },
  23:  { splits: [1] },
  24:  { splits: [7], timers: { 1: timedRun(["V-UP", "crunches", "Plank", "mountain climbers", "Leg raises", "ankle touches"]) } },
  28:  { splits: [1] },
  30:  { splits: [1] },
  31:  { splits: [16], timers: { 0: pairCircuit([
         "Skipping", "in and out squats", "Boxing", "triple pushup w mountain climber",
         "High-Knee", "Pull-up Rows", "Body Extension", "SQ w Knee lift",
         "Versa runner", "Y-Push-up", "Boxing", "Tri-cep dips",
         "Skater Jumps", "mountain climbers", "Sprint/High Knee", "Sumo Squat w bounce",
         "Kick-Boxing", "Hand-Rel Pushup", "Seal Jumps", "Burpees",
         "Kick boxing", "V-Ups", "High-Knee", "Rev Lunge",
         "Plank Up", "cycle crunches", "2-Punch Crunch", "Plank Toe Touch",
         "Mountain climber", "Ankle Touches"]) } },
  33:  { splits: [1], timers: { 1: pairCircuit([
         "High Knee", "SQ Knee/Elbow", "Boxing", "2 Push-Up 4 Mountain Cl",
         "Skipping", "Pull-up Rows", "Burpees", "Jump Lunges",
         "High Knee", "In & Out SQ", "Boxing", "Shoulder Tap Push-Up",
         "Skipping", "Tricep Dip", "Burpees", "Skater Jump",
         "High Knee", "Sumo SQ w Bounce", "Boxing", "Push-Up w Arm Raise",
         "Skipping", "Superman", "Burpees", "Tuck Jump",
         "Plank-up", "Cycle Crunch", "V-Up", "2 Punch-Crunch",
         "Russian Twist", "Ankle Touch", "Flutterkick", "Situp"]) } },
  36:  { splits: [1, 3], timers: { 1: pairCircuit([
         "Skipping", "Tricep dips", "Burpees", "Mountain Climbers",
         "Skipping", "Russian Twists", "Burpees", "Shoulder Press-up",
         "Skipping", "Cycle Crunch", "Skipping", "Shoulder Tap Push Up"]) } },
  37:  { splits: [1, 2] },
  43:  { splits: [1] },
  46:  { splits: [1] },
  50:  { splits: [1] },
  53:  { splits: [1] },
  57:  { splits: [1], timers: { 1: pairCircuit([
         "Boxjumps", "Pushup w arm raise", "Squat w knee-elbow", "Tricep dip",
         "Skipping", "Cycle Crunches"], { rounds: 3 }) } },
  58:  { splits: [7] },
  60:  { splits: [1] },
  64:  { splits: [1], timers: { 0: { type: "circuit", exerciseSeconds: 120, restSeconds: 0, rounds: 3,
         exercises: ["10 Weighted Squat, 20 Hammer Curls, 12 Shoulder Press"],
         totalSeconds: secs(360), label: "3 Rounds × 2 Min" } } },
  // "- 1 min rest" makes the parser skip the whole line, so the list is lost
  66:  { splits: [1, 2], timers: { 2: { type: "tabata", workSeconds: 40, restSeconds: 20, rounds: 3, stations: 3, rotate: true,
         label: "Tabata 40s/20s", exercises: ["Thrusters", "Skull Crushers", "DB Rows"] } } },
  67:  { splits: [1] },
  69:  { splits: [1] },
  74:  { splits: [1] },
  78:  { splits: [1] },
  83:  { splits: [1] },
  89:  { splits: [1], timers: { 1: { type: "countdown", totalSeconds: secs(2100), label: "35 Min" } } },
  95:  { splits: [4] },
  100: { splits: [2, 4] },
  101: { splits: [2] },
  160: { splits: [3] },
  197: { splits: [3] },
  202: { splits: [2] },

  // ── core sections: pair circuits the parser reads as untimed prose ──
  9:   { coreTimers: { 0: timedRun(["Plankup", "2 punch crunch", "mountain climbers", "cycle crunches", "plank toe touches", "ankle touches"]) } },
  19:  { coreTimers: { 0: pairCircuit(["Cycle crunch", "plank toe touch", "Flutter kicks", "2-punch crunch", "V-Ups", "ankle touches"]) } },
  25:  { coreTimers: { 0: pairCircuit(["Cycle crunches", "Toe tap plank", "Flutter kick", "2 punch crunch", "V-Up", "ankle taps"]) } },
  39:  { coreTimers: { 0: pairCircuit(["Russian Twist", "2 Punch Crunch", "Cycle Crunch", "Plank-ups", "Flutterkicks", "Ankle touches"]) } },
  59:  { coreTimers: { 0: pairCircuit(["Plank toe touches", "2 punch crunch", "Mountain Climbers", "Cycle Crunches", "Plank-ups", "Ankle Touches"]) } },
  81:  { coreTimers: { 0: pairCircuit(["Cycle crunch", "Plank Toe Touch", "Flutter kick", "2 punch crunch", "V-Up", "Ankle Touches"]) } },

  // ── core sections that mix reps and time: a circuit clock would time only
  //    the side planks and silently drop the rep work, so count up instead ──
  132: { coreTimers: { 0: stopwatch("Rounds") } },
  147: { coreTimers: { 0: stopwatch("Rounds") } },

  // ═══════════════════════════════════════════════════════════════
  // Reported September 2026
  // ═══════════════════════════════════════════════════════════════

  // ── #65: tempo work needs the tempo, not a 2-second blip ──
  // "7 Tempo Shoulder press (3s up, 3s hold, 2s down)" parsed into a 2-second
  // circuit of three fragments of the bracket text, so a set was over before
  // the first rep was. One rep is 3 up + 3 hold + 2 down + 2 resting at the
  // bottom = 10s, seven reps to a set, five sets.
  65: { timers: { 0: {
    type: "circuit", exerciseSeconds: 10, restSeconds: 0, rounds: 5,
    exercises: ["Rep 1", "Rep 2", "Rep 3", "Rep 4", "Rep 5", "Rep 6", "Rep 7"],
    totalSeconds: secs(350), label: "Tempo Press — 5 sets × 7 reps",
  } } },

  // ── #91 / #92: 8 exercises twice, rest, then the second eight ──
  // Both sessions fused two separate eights into one 16-station tabata and ran
  // it for four rounds — 64 minutes of work in a 46-minute session. Each block
  // is its own phase: 8 exercises × 2 rounds × 60s = 16 min, then a real
  // one-minute rest, then the second block.
  91: { splits: [2, 3, 5], timers: {
    0: tabata(["Jump Squats", "High knees", "Mountain Climber", "Burpees", "Skaters", "Jump Lunge", "Tuck Jumps", "Fast Feet"], 2),
    1: countdown(60, "Rest — 1 Min"),
    2: tabata(["Push-up", "Shoulder taps", "Incline Push-up", "Superman", "Situp", "Bicycle Crunch", "Leg Raise", "Plank"], 2),
    3: stopwatch("Timer"),
  } },
  // (#92 has no suicides tail, so it ends at the second block)
  92: { splits: [2, 3], timers: {
    0: tabata(["Squats", "Wallsit", "Glute bridge", "Rev Lunges", "Sumo Sq", "Calf raise", "SQ hold", "Jump SQ"], 2),
    1: countdown(60, "Rest — 1 Min"),
    2: tabata(["Burpees", "Pushup", "Rows", "Plank Jacks", "Lateral Lunge", "Tuck Jump", "Mountain Cl", "Fastfeet to Burpee"], 2),
  } },

  // ── timed blocks whose exercise list the parser mangled ──
  // Each of these fed the timer and the voice a fragment of the format header
  // instead of the exercises, so the block announced nonsense or nothing.
  52:  { coreTimers: { 0: tabata(["Plank", "Crunch", "Hollowhold"], 2, 40, 20, { rotate: true }) } },
  // "4 min at 20:10" is 8 cycles, so: 8 rounds of situps, then 8 of leg raises
  70:  { coreTimers: { 0: tabata(["Situps", "Leg Raises"], 8, 20, 10) } },
  73:  { timers: { 0: { type: "emom", totalSeconds: secs(600), totalMinutes: 10,
         exercises: ["10 Heavy SQ"], label: "EMOM 10 Min" } } },
  142: { timers: { 0: tabata(["DB Curls", "DB Push Press", "Burpees", "Step-ups w DB",
         "Mountain Climbers", "DB SQ", "Dips", "Skipping"], 3, 40, 20, { rotate: true }) },
         coreTimers: { 0: coreCircuit(["Plank", "Rev Crunch", "Ankle Touches"], 3) } },
  // 9 rounds of a 3-minute cycle is 27 minutes, not the 36 the parser counted
  146: { timers: { 0: { type: "emom", totalSeconds: secs(1620), totalMinutes: 27,
         exercises: ["5 DB Thrusters + 30 Skips", "8 DB Renegade Rows + 4 Burpees", "10 DB SQ + 5 Box Jumps"],
         label: "EMOM 27 Min" } } },
  182: { timers: { 0: tabata(["DB Lateral Raise", "Step-ups w DB", "DB Renegade Row", "Jump Lunges",
         "DB Curls", "Mountain Climbers", "DB SQ", "Burpees"], 4, 40, 20, { rotate: true }) },
         coreTimers: { 0: coreCircuit(["Plank", "Bicycle Crunch", "Leg Raises"], 3) } },
  206: { timers: { 0: tabata(["DB Bear Complex", "Step-ups", "DB Rows", "Broad Jumps",
         "DB Curls", "Mountain Climbers", "Push-ups", "Skipping"], 4, 40, 20, { rotate: true }) },
         coreTimers: { 0: coreCircuit(["Plank", "Rev Crunch", "Ankle Touches"], 3) } },

  // ── a rounds circuit built around a lap run: nothing here fits a 30s clock ──
  99:  { timers: { 0: stopwatch("Rounds") } },
  // "1 min bet rounds" was read as a 40s exercise; the real list is the five numbered moves
  96:  { timers: { 0: tabata(["Stepup w DB", "Arnold Curl to Press", "Skipping", "Bar Rows", "Shoulder Tap Push Up"],
         4, 40, 20, { rotate: true }) } },

  // ── core rounds where the clock timed only the held moves ──
  // See coreCircuit above. Every move in the round now gets its own 30s
  // segment, so the circuit runs the whole round and the voice calls all of it.
  85:  { coreTimers: { 0: coreCircuit(["situps", "leg raises", "plank-ups", "planks"], 2) } },
  110: { coreTimers: { 0: coreCircuit(["Russian Twist", "Bicycle Crunch", "Plank"], 2) } },
  112: { coreTimers: { 0: coreCircuit(["Leg Raises", "Bicycle Crunches", "Plank"], 3) } },
  113: { coreTimers: { 0: coreCircuit(["Plank", "Russian Twist", "V-Up"], 2) } },
  127: { coreTimers: { 0: coreCircuit(["Rev Crunch", "Cycle Crunch", "Plank"], 3) } },
  131: { coreTimers: { 0: coreCircuit(["Plank", "Side Plank L", "Side Plank R", "V-ups"], 3) } },
  133: { coreTimers: { 0: coreCircuit(["Plank", "Reverse Crunches", "Ankle Touches"], 3) } },
  136: { coreTimers: { 0: coreCircuit(["Plank", "Bicycle Crunch", "Leg Raises"], 3) } },
  138: { coreTimers: { 0: coreCircuit(["Situps", "Flutter Kicks", "Plank"], 3) } },
  // the reported one: flutter kicks were missing from the core timer
  139: { coreTimers: { 0: coreCircuit(["Plank", "Side Plank (L)", "Side Plank (R)", "Hollow Hold", "Flutter Kicks"], 2) } },
  144: { coreTimers: { 0: coreCircuit(["Plank", "Bicycle Crunch", "Leg Raises"], 3) } },
  151: { coreTimers: { 0: coreCircuit(["Plank", "Cycle Crunch", "Flutter Kicks"], 3) } },
  153: { coreTimers: { 0: coreCircuit(["Situps", "Bicycle Crunch", "Plank"], 2) } },
  154: { coreTimers: { 0: coreCircuit(["Plank", "Russian Twist", "V-Ups"], 3) } },
  164: { coreTimers: { 0: coreCircuit(["Plank", "Bicycle Crunch", "Hollow Hold"], 3) } },
  169: { coreTimers: { 0: coreCircuit(["Plank", "Hollow Hold", "Leg Raises"], 3) } },
  174: { coreTimers: { 0: coreCircuit(["Plank", "Cycle Crunch", "Flutter Kicks"], 3) } },
  176: { coreTimers: { 0: coreCircuit(["Plank", "Copenhagen Plank L", "Copenhagen Plank R"], 3) } },
  180: { coreTimers: { 0: coreCircuit(["Plank", "Hollow Body Rocks", "Side Plank (L)", "Side Plank (R)"], 3) } },
  181: { coreTimers: { 0: coreCircuit(["Situps", "V-Ups", "Plank"], 3) } },
  186: { coreTimers: { 0: coreCircuit(["Plank", "V-Ups", "Bicycle Crunch"], 2) } },
  188: { coreTimers: { 0: coreCircuit(["Plank", "Cycle Crunch", "Flutter Kicks"], 3) } },
  190: { splits: [2], coreTimers: { 0: coreCircuit(["Plank", "Reverse Crunch", "Ankle Touches"], 3) } },
  192: { coreTimers: { 0: coreCircuit(["Plank", "Copenhagen Plank L", "Copenhagen Plank R"], 3) } },
  195: { coreTimers: { 0: coreCircuit(["Plank", "Cycle Crunch", "Flutter Kicks"], 3) } },
  196: { coreTimers: { 0: coreCircuit(["Plank", "Side Plank (L)", "Side Plank (R)", "Bicycle Crunch"], 3) } },
  201: { coreTimers: { 0: coreCircuit(["Situps", "V-Ups", "Plank"], 3) } },
  203: { coreTimers: { 0: coreCircuit(["Plank", "Side Plank (L)", "Side Plank (R)", "Bicycle Crunch"], 3) } },
};

// Re-split a workout's prose at the declared line indices, running the parser
// over each piece so every block still gets its timer detected normally.
function splitBlocks(text, splits) {
  const lines = text.split("\n").filter(l => l.trim());
  const bounds = [0, ...splits, lines.length];
  const pieces = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const piece = lines.slice(bounds[i], bounds[i + 1]);
    if (piece.length) pieces.push(piece.join("\n"));
  }
  return pieces.flatMap(p => parseBlocks(p));
}

const blocksById = {};
const anomalies = [];

for (const w of RAW_DATA) {
  const entry = {};
  const c = CORRECTIONS[w.id] || {};
  entry.workout = c.splits ? splitBlocks(w.workout, c.splits) : parseBlocks(w.workout);
  if (w.core && w.core.trim()) entry.core = c.coreSplits ? splitBlocks(w.core, c.coreSplits) : parseBlocks(w.core);
  for (const [i, timer] of Object.entries(c.timers || {})) {
    if (!entry.workout[i]) throw new Error(`#${w.id}: timer override for missing workout block ${i}`);
    entry.workout[i].timer = timer;
  }
  for (const [i, timer] of Object.entries(c.coreTimers || {})) {
    if (!entry.core || !entry.core[i]) throw new Error(`#${w.id}: timer override for missing core block ${i}`);
    entry.core[i].timer = timer;
  }
  blocksById[w.id] = entry;

  // ── anomaly scan: things worth a human look ──
  const kinds = entry.workout.map(b => b.timer.type);
  const fmt = (w.format || "").toUpperCase();
  const flag = msg => anomalies.push(`#${w.id} [${fmt}] ${msg} — kinds: ${kinds.join(",")}`);

  if (fmt === "AMRAP" && !kinds.includes("countdown")) flag("AMRAP format but no countdown block");
  if (fmt === "EMOM" && !kinds.includes("emom")) flag("EMOM format but no emom block");
  if (fmt === "TABATA" && !kinds.includes("tabata")) flag("TABATA format but no tabata block");
  if (fmt === "DEATH BY EMOM" && !kinds.includes("deathby") && !kinds.includes("emom")) flag("DEATH BY format but no deathby/emom block");
  if (fmt === "FIGHT GONE BAD" && !kinds.includes("fgb")) flag("FGB format but no fgb block");
  for (const b of entry.workout) {
    const t = b.timer;
    if (["tabata", "emom", "circuit", "fgb"].includes(t.type) && (!t.exercises || t.exercises.length === 0))
      flag(`${t.type} block with no exercise list`);
    if (t.type === "countdown" && (!t.totalSeconds || t.totalSeconds <= 0)) flag("countdown with no duration");
    if (t.type === "tabata" && (!t.workSeconds || !t.restSeconds)) flag("tabata without work/rest seconds");
  }
}

// Which sections carry a declared correction, so the equivalence test knows
// where the stored blocks are MEANT to diverge from a fresh parse. Emitted
// rather than hand-listed — a new correction can't be forgotten here.
const corrected = {};
for (const [id, c] of Object.entries(CORRECTIONS)) {
  const fields = [];
  if (c.splits || c.timers) fields.push("workout");
  if (c.coreSplits || c.coreTimers) fields.push("core");
  corrected[id] = fields;
}

const header = `// GENERATED by tools/generate-blocks.mjs — the declared block structure
// for every workout. Timers and voice read THIS, not the prose. Regenerate
// with: node tools/generate-blocks.mjs
//
// Do NOT hand-edit: corrections belong in the generator's CORRECTIONS map, so
// they survive the next regeneration and stay reviewable in one place.
`;
const body = "export const WORKOUT_BLOCKS = {\n" + RAW_DATA.map(w =>
  `${w.id}: ${JSON.stringify(blocksById[w.id])}`
).join(",\n") + "\n};\n\n" +
"// id → sections whose stored blocks are declared, not parser-derived\n" +
`export const CORRECTED_SECTIONS = ${JSON.stringify(corrected)};\n`;
writeFileSync(join(root, "src", "data", "blocks.js"), header + body, "utf8");

console.log(`Wrote src/data/blocks.js — ${RAW_DATA.length} workouts`);
console.log(`Anomalies for review: ${anomalies.length}`);
anomalies.forEach(a => console.log("  " + a));

if (report) {
  console.log("\n— per-workout summary —");
  for (const w of RAW_DATA) {
    const e = blocksById[w.id];
    const parts = e.workout.map(b => {
      const t = b.timer;
      if (t.type === "countdown") return `countdown ${Math.round((t.totalSeconds||0)/60)}m`;
      if (t.type === "emom") return `emom ${t.totalMinutes}m${t.exercises ? "/" + t.exercises.length + "ex" : ""}`;
      if (t.type === "tabata") return `tabata ${t.workSeconds}/${t.restSeconds}${t.exercises ? " " + t.exercises.length + "ex" : ""}`;
      if (t.type === "circuit") return `circuit ${t.exerciseSeconds}s ${t.exercises ? t.exercises.length + "ex" : ""}`;
      return t.type;
    });
    console.log(`#${String(w.id).padStart(3)} ${(w.format||"").padEnd(15)} ${parts.join(" | ")}${e.core ? "  +core:" + e.core.map(b=>b.timer.type).join(",") : ""}`);
  }
}
