// ═══════════════════════════════════════════════════════════════
// VOICE ANNOUNCEMENTS — Web Speech API with abbreviation expansion
// ═══════════════════════════════════════════════════════════════
const VOICE_ABBREVIATIONS = {
  "kb": "kettlebell", "db": "dumbbell", "sq": "squat", "sq,": "squat,",
  "rdl": "romanian deadlift", "tgu": "turkish get up", "amrap": "amrap",
  "emom": "e-mom", "emotm": "e-mom", "ea": "each", "ea.": "each.", "reps": "reps",
  "l+r": "left and right", "l/r": "left and right",
  "100m": "100 meters", "200m": "200 meters", "400m": "400 meters", "800m": "800 meters",
  "w": "with", "w/": "with", "bet": "between", "min": "minute", "sec": "seconds",
  "jj": "jumping jacks", "pylo": "plyometric", "hiit": "high intensity",
  "cl": "climbers", "mtn": "mountain", "rel": "release",
  "alt": "alternating", "ea.": "each", "incl": "incline",
  "l": "left", "r": "right", "rev": "reverse",
};

// Normalise shorthand notation so the speech engine reads it naturally.
// Handles run-together words ("situps"), sequence arrows, durations ("40s"),
// and the metres-vs-minutes ambiguity for "Nm".
function normaliseNotation(text) {
  let s = text;
  // Multiplier asterisk used for sets/rounds: "6 * 400m", "10 Crunch *3" => "times"
  s = s.replace(/\s*\*\s*/g, " times ");
  // Arrows used as sequence separators: "Downdog -> Bear" => "Downdog then Bear"
  s = s.replace(/\s*(?:->|→)\s*/g, " then ");
  // Run-together exercise words -> add a space so they're pronounced correctly
  // (situps, pushups, pullups, chinups, stepups, pressups)
  s = s.replace(/\b(sit|push|pull|chin|step|press)-?(ups?)\b/gi, "$1 $2");
  // Seconds: "40s", "3s" (a number directly followed by s)
  s = s.replace(/\b(\d+)\s*s\b/gi, (mt, n) => `${n} second${n === "1" ? "" : "s"}`);
  // "Nm": minutes in a timed-format context, or directly before a rest/hold
  // (rest, plank, hold, hang, wall sit); otherwise metres (running/carry
  // distances dominate the data)
  const minuteContext = /\b(AMRAP|EMOM|CLOCK|CAP)\b/i.test(s);
  s = s.replace(/\b(\d+)\s*m\b(\s+(?:rest|plank|hold|hang|wall\s*sit))?/gi, (mt, n, tail) => {
    const unit = (minuteContext || tail) ? "minute" : "metre";
    return `${n} ${unit}${n === "1" ? "" : "s"}${tail || ""}`;
  });
  return s;
}

function expandAbbreviations(text) {
  if (!text) return "";
  // Clean up: remove numbers/reps at start, emojis, special chars
  let clean = text.replace(/^\d+\s*[x×*]\s*/i, "").replace(/[\u{1F000}-\u{1FFFF}]/gu, "").trim();
  // Read shorthand notation (40s, situps, ->, Nm) as natural words first
  clean = normaliseNotation(clean);
  // Expand abbreviations (word boundary aware)
  const words = clean.split(/\s+/);
  const expanded = words.map(w => {
    const lower = w.toLowerCase().replace(/[.,;:]+$/, "");
    const suffix = w.slice(lower.length);
    // Only re-append the suffix to dictionary replacements — the original
    // word already carries it (appending doubled punctuation: "Rest..")
    return VOICE_ABBREVIATIONS[lower] ? VOICE_ABBREVIATIONS[lower] + suffix : w;
  });
  return expanded.join(" ");
}

function speakText(text, enabled, audioOn) {
  if (!enabled || !audioOn) return;
  if (!window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(expandAbbreviations(text));
    u.rate = 0.9; u.pitch = 1.0; u.volume = 0.8;
    window.speechSynthesis.speak(u);
  } catch(e) {}
}

function cancelSpeech() {
  try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch(e) {}
}

// Natural speech for a duration in seconds: "10 minutes", "2 and a half
// minutes", "45 seconds", "3 minutes 20 seconds"
function speakDuration(secs) {
  const m = Math.floor(secs / 60), s = Math.round(secs % 60);
  if (m === 0) return `${s} seconds`;
  const mins = m === 1 ? "1 minute" : `${m} minutes`;
  if (s === 0) return mins;
  if (s === 30) return `${m} and a half minutes`;
  return `${mins} ${s} seconds`;
}

export { VOICE_ABBREVIATIONS, normaliseNotation, expandAbbreviations, speakText, cancelSpeech, speakDuration };
