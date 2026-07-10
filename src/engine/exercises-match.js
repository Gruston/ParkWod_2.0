// ═══════════════════════════════════════════════════════════════
// EXERCISE MATCHING — single source of truth for text -> exercise
// ═══════════════════════════════════════════════════════════════
// Shared by the inline highlighter, the info modal (variation-aware), and
// movement-tag derivation. Recognition and variation-parsing live here so
// they can be tested and never drift between call sites.
import { EXERCISE_INFO } from "../data/exercises.js";

// Hand-maintained text variants that map to a base exercise key.
const VARIANT_MAP = {
"squats": ["squat", "sq ", "sq,", "goblet sq", "prisoner sq", "db sq", "db squats", "kb squat", "kb squats", "weighted squat", "weighted sq", "tempo sq", "tempo squat", "in and out squat", "in and out sq"],
        "push-ups": ["push-up", "push up", "pushup", "tri-cep push", "y push-up", "y pushup", "triple push-up", "triple pushup", "inverted pushup", "inverted push-up"],
        "rows": ["pull-up row", "pullup row", "pull up row", "db rows", "kb rows", "kettlebell rows", "kettlebell row", "dumbbell rows", "dumbbell row", "bar rows", "bar row"],
        "renegade rows": ["renegade row", "plank row", "plank rows"],
        "bent-over row": ["bent over row", "bentover row", "bent-over row", "db bent-over row", "kb bent-over row", "bent over rows", "bentover rows"],
        "kb swings": ["kb swing", "kettle bell swing", "kettlebell swing"],
        "shoulder press": ["db press", "strict press", "strict-press", "push press", "push-press", "kb push press", "db shoulder press", "clean & press", "arnold press", "db arnold", "arnold curl to press"],
        "curls": ["bicep curl", "hammer curl", "db curl"],
        "triceps": ["skull crush", "skull crusher", "skullcrusher", "skull crushers", "tri-cep skullcrusher", "kb skull crusher", "tricep ext", "tri-cep kick"],
        "lunges": ["lunge", "walking lunge", "jump lunge", "rev lunge", "reverse lunge", "db lunge", "dumbbell lunge", "lizard lunge"],
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
        "planks": ["plank", "side plank", "copenhagen plank", "plank-up", "plank up", "plank toe touch", "plank jack"],
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

// Build the matcher list once: every recognised name/aka/variant -> key,
// longest first so specific phrases win over generic ones.
let _matchers = null;
function matchers() {
  if (_matchers) return _matchers;
  const list = [];
  for (const [key, info] of Object.entries(EXERCISE_INFO)) {
    list.push([info.name.toLowerCase(), key]);
    if (info.aka) info.aka.split(",").forEach(a => { const t = a.trim().toLowerCase(); if (t) list.push([t, key]); });
    if (VARIANT_MAP[key]) VARIANT_MAP[key].forEach(v => list.push([v.toLowerCase(), key]));
  }
  _matchers = list.sort((a, b) => b[0].length - a[0].length);
  return _matchers;
}

// Resolve a phrase to its best match, returning both the key and the name
// string that hit (longest wins). null if nothing matches.
export function resolveExerciseMatch(phrase) {
  const p = " " + String(phrase).toLowerCase().trim() + " ";
  for (const [name, key] of matchers()) {
    if (p.includes(name)) return { key, name };
  }
  return null;
}

// Resolve a single phrase to its best exercise key (or null).
export function resolveExerciseKey(phrase) {
  const m = resolveExerciseMatch(phrase);
  return m ? m.key : null;
}

// All distinct exercise keys found in a block of text, in order of appearance.
export function findExercisesInText(text) {
  const found = [];
  const seen = new Set();
  for (const seg of String(text).split(/[,\n]|\bthen\b/i)) {
    const key = resolveExerciseKey(seg);
    if (key && !seen.has(key)) { seen.add(key); found.push(key); }
  }
  return found;
}

// Tails that are intensity/notation rather than a second movement.
const NON_MOVEMENT_TAIL = /^(failure|top|bottom|each|ea|side|beat|it|rest|reps?|rounds?|min|minutes?|sec|seconds?|time|count|hold|the\b)/i;

// Decompose a tapped phrase into base + variation for the info modal.
// Handles "BASE w/with MODIFIER" and "BASE to BASE2" compounds.
export function describePhrase(phrase, fallbackKey) {
  const raw = String(phrase).replace(/^\d+[\sx*.\-]*/, "").replace(/\s+/g, " ").trim();
  const clean = raw.replace(/[.,;:]+$/, "");

  // Dedicated named compound wins over splitting: if the whole phrase matches
  // an entry whose own name carries the same connector (e.g. "Plank to Down
  // Dog", "Burpee to Deadlift"), treat it as one movement, not two.
  const whole = resolveExerciseMatch(clean);
  if (whole && / to | w\/? | with /i.test(" " + whole.name + " ") && clean.toLowerCase().includes(whole.name)) {
    return { display: clean, kind: "base", primaryKey: whole.key, secondKey: null, modifier: null };
  }

  // "X to Y" compound of two movements (mountain climber to thruster)
  const toM = clean.match(/^(.*?)\s+to\s+(.*)$/i);
  if (toM && !NON_MOVEMENT_TAIL.test(toM[2].trim())) {
    const k1 = resolveExerciseKey(toM[1]);
    const k2 = resolveExerciseKey(toM[2]);
    if (k1 && k2 && k1 !== k2) {
      return { display: clean, kind: "compound", primaryKey: k1, secondKey: k2, modifier: null };
    }
  }

  // "X w/with Y" variation (sumo squat w bounce, db lunge w twist)
  const wM = clean.match(/^(.*?)\s+(?:w\/?|with)\s+(.*)$/i);
  if (wM) {
    const baseKey = resolveExerciseKey(wM[1]) || fallbackKey || null;
    const modifier = wM[2].trim();
    if (baseKey && modifier && !NON_MOVEMENT_TAIL.test(modifier)) {
      return { display: clean, kind: "variation", primaryKey: baseKey, secondKey: resolveExerciseKey(modifier), modifier };
    }
  }

  const key = resolveExerciseKey(clean) || fallbackKey || null;
  return { display: clean, kind: "base", primaryKey: key, secondKey: null, modifier: null };
}

// Matcher segments for the highlighter (name, key), longest first.
export function exerciseMatchers() { return matchers(); }

// Replace every occurrence of an exercise (any of its recognised names) in
// the text with a replacement name, preserving reps and separators around it.
// Used by injury-aware swaps; the result is stored as a normal customisation.
export function swapExerciseInText(text, key, replacementName) {
  const names = matchers().filter(([, k]) => k === key).map(([n]) => n);
  if (!names.length) return text;
  const escaped = names.sort((a, b) => b.length - a.length).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  return String(text).replace(re, (m) => {
    // some variant names carry a trailing space/comma ("sq ", "sq,") — keep it
    const trail = /[\s,]$/.test(m) ? m.slice(-1) : "";
    return replacementName + trail;
  });
}
