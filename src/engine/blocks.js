// ═══════════════════════════════════════════════════════════════
// BLOCK PARSER — splits workout into timed sections
// ═══════════════════════════════════════════════════════════════
function parseBlocks(text) {
  if (!text || !text.trim()) return [{ content: text || "", timer: { type: "stopwatch" } }];
  
  const lines = text.split("\n").filter(l => l.trim());
  const blocks = [];
  let current = [];
  
  // Helper: check if current block already has a timed format header
  const currentHasTimedFormat = () => {
    const joined = current.join(' ').toUpperCase();
    return /TABATA|\d+\s*[/\\]\s*\d+.*ON|AMRAP|\d+\s*M(?:IN)?\s*EMOM|EMOM\s*[-:]/i.test(joined) ||
           /DEATH BY/i.test(joined);
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase().trim();
    
    // Detect block boundaries
    let isNewBlock = false;
    if (current.length > 0) {
      // New AMRAP declaration
      if (/^\d+\s*MIN\s*AMRAP/i.test(upper) || /^AMRAP\s*[-:]\s*\d+/i.test(upper)) isNewBlock = true;
      // New EMOM declaration
      else if (/^\d+\s*M(?:IN)?\s*EMOM/i.test(upper) || /^EMOM\s*[-:]\s*\d+/i.test(upper)) isNewBlock = true;
      // "Then" separator
      else if (/^THEN\b/i.test(upper)) isNewBlock = true;
      // New Tabata declaration
      else if (/TABATA/i.test(upper) && !/TABATA/i.test(current.join(' '))) isNewBlock = true;
      // "X rounds" or "X sets" line AFTER a timed section — this is a separate non-timed block
      // Must look like a standalone rounds declaration, not an exercise list line
      else if (currentHasTimedFormat() && /^\d+\s*(ROUNDS?|SETS?)\s*[-:]/i.test(upper)) isNewBlock = true;
      // Suicides/sprints after a timed section
      else if (currentHasTimedFormat() && /^(SUICIDES?|SPRINT\s*LADDER|\d+\s*(MIN|ROUNDS?)\s*SUICIDES?)/i.test(upper)) isNewBlock = true;
      // "X min rest then" — handles both inline (rest + activity on same line) and multi-line
      else if (/^\d+\s*MIN\s*REST/i.test(upper) && currentHasTimedFormat()) {
        // If the rest line ITSELF contains a new activity ("2 min rest then 4 sets suicides...")
        if (/REST\s*THEN\s+\d+\s*(SETS?|ROUNDS?)/i.test(upper) || /SUICIDE/i.test(upper)) {
          // This whole line is a new block
          if (current.length > 0) {
            blocks.push(current.join("\n"));
            current = [];
          }
          current.push(line);
          continue;
        }
        // Multi-line: check if NEXT line is a new activity
        if (i < lines.length - 1) {
          const nextUpper = lines[i+1].toUpperCase().trim();
          if (/SUICIDE|^\d+\s*(SETS?|ROUNDS?)\s*[-:]/i.test(nextUpper)) {
            if (current.length > 0) {
              blocks.push(current.join("\n"));
              current = [];
            }
            current.push(line);
            continue;
          }
        }
        current.push(line);
        continue;
      }
      // "When you fail" pattern in Death By EMOM — next section is separate
      else if (/^WHEN YOU FAIL/i.test(upper) && currentHasTimedFormat()) {
        // Include this line then start new block for what follows
        current.push(line);
        if (current.length > 0) {
          blocks.push(current.join("\n"));
          current = [];
        }
        continue;
      }
    }
    
    if (isNewBlock && current.length > 0) {
      blocks.push(current.join("\n"));
      current = [];
    }
    current.push(line);
  }
  if (current.length > 0) blocks.push(current.join("\n"));
  
  // Detect timer for each block
  return blocks.map(blockText => ({
    content: blockText,
    timer: detectBlockTimer(blockText),
  }));
}

function detectBlockTimer(text) {
  const upper = text.toUpperCase();
  
  // ── Helper: extract exercise list from block text ──
  function parseExercises(txt) {
    const result = [];
    const tLines = txt.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of tLines) {
      const up = line.toUpperCase();
      
      // Lines with embedded exercises after format spec:
      // "Tabata (40/20) - 4 rounds Flutter kicks, 4 rounds Mountain Climbers"
      // "40 sec on 20 off - 2 rounds - Plank, Crunches, hollow hold"
      const headerExM = line.match(/(?:TABATA|ROTATING TABATA|\d+\s*[/\\]\s*\d+)\s*(?:\([^)]*\))?\s*[-\u2013]\s*\d+\s*ROUNDS?\s*[-\u2013]?\s*(.+)/i) ||
                         line.match(/(?:TABATA|ROTATING TABATA)\s*(?:\([^)]*\))?\s*[-\u2013]\s*\d+\s*ROUNDS?\s+(.+)/i) ||
                         line.match(/\d+\s*SEC?\s*ON.*\d+\s*ROUNDS?\s*[-\u2013]\s*(.+)/i);
      if (headerExM) {
        const exPart = headerExM[1];
        // "Flutter kicks, 4 rounds Mountain Climbers" or "Plank, Crunches, hollow hold"
        // Extract via "N rounds EXERCISE" or just comma-split
        const roundParts = [...exPart.matchAll(/(?:(\d+)\s*rounds?\s+)?([^,]+)/gi)];
        roundParts.forEach(m => { const t = m[2].trim(); if (t && t.length > 1 && !/^[-\u2013]/.test(t)) result.push(t); });
        continue;
      }
      
      // "Tabata 40/20 - 4 rounds Plank, 4 rounds Situps"
      const roundExAll = [...line.matchAll(/(\d+)\s*rounds?\s+([^,]+)/gi)];
      if (roundExAll.length >= 2) {
        roundExAll.forEach(m => result.push(m[2].trim().replace(/^[-\u2013]\s*/, '')));
        continue;
      }
      
      // "Tabata (20/10) - 8 rounds V-Up, 8 Rounds Situp"
      if (roundExAll.length >= 1 && /TABATA|ON.*OFF/i.test(up)) {
        roundExAll.forEach(m => result.push(m[2].trim().replace(/^[-\u2013]\s*/, '')));
        continue;
      }
      
      // Skip pure instruction/header lines with no exercises
      if (/^(TABATA|BODYWEIGHT TABATA|\d+\s*[/\\]\s*\d+\s*TABATA|ROTATING|1 MIN AT|MAX REPS|TRACK|NOTE|REST\b|THEN\b)/i.test(line.trim()) && roundExAll.length === 0) continue;
      if (/MIN REST|THEN REPEAT|PER EXERCISE|PER STATION|SUICIDE/i.test(up)) continue;

      // "Min N: Exercise" pattern \u2014 used in labeled EMOM workouts (e.g. "Min 1: 20 KB Swings")
      const minLabelM = line.match(/^MIN\s+\d+\s*[:]\s*(.+)/i);
      if (minLabelM) { result.push(minLabelM[1].replace(/\(.*?\)/g, '').trim()); continue; }

      // "Station N: Exercise" pattern
      const stationM = line.match(/STATION\s*\d+\s*[:]\s*(.+)/i);
      if (stationM) { result.push(stationM[1].replace(/\(.*?\)/g, '').trim()); continue; }
      // "N) Ex1, 2) Ex2 3) Ex3" all on one line
      const numberedAll = [...line.matchAll(/\d+\s*[).]\s*([^,\d)]+)/g)];
      if (numberedAll.length >= 2) { numberedAll.forEach(m => { const t = m[1].trim(); if (t) result.push(t); }); continue; }
      // "N) Exercise" or "N - Exercise" single
      const numM = line.match(/^\d+\s*[).:]\s*(.+)/i) || line.match(/^\d+\s*[-\u2013]\s*(.+)/i);
      if (numM) {
        const rest = numM[1].replace(/,\s*$/, '').trim();
        // If it's a comma list of exercises under one number: "1) Burpees, Box Jumps, Push-up, Squats"
        const parts = rest.split(/,\s*/);
        if (parts.length >= 2 && parts.every(p => p.length < 35 && !/ROUND|TABATA|MIN/i.test(p))) {
          parts.forEach(p => { const t = p.trim(); if (t && t.length > 1) result.push(t); });
        } else {
          result.push(rest);
        }
        continue;
      }
      // Comma-separated exercise list on a plain line
      if (/,/.test(line) && !/TABATA|ROUND.*EACH|PER EXERCISE|MIN REST|THEN|SUICIDE/i.test(line)) {
        const parts = line.split(/,\s*/);
        if (parts.length >= 2 && parts.length <= 12 && parts.every(p => p.length < 40 && !/ROUND|REST|MIN|TABATA/i.test(p))) {
          parts.forEach(p => { const t = p.trim(); if (t && t.length > 1) result.push(t); });
          continue;
        }
      }
      // Fallback: single "X rounds - Exercise" or "X rounds Exercise" on its own line
      const singleRound = line.match(/^(\d+)\s*rounds?\s*[-\u2013]?\s*(.+)/i);
      if (singleRound) {
        const ex = singleRound[2].trim();
        if (ex.length > 1 && !/SUICIDE|REST|EACH|PER |^EMOM$|^AMRAP$/i.test(ex)) result.push(ex);
        continue;
      }
      // Plain exercise line \u2014 single name, no prefix, no format keywords (e.g. "Hammer Curls" on its own line)
      const trimmed = line.trim();
      if (trimmed.length > 2 && trimmed.length < 55 &&
          !/^\d/.test(trimmed) &&
          !/\b(ROUND|ROUNDS|REST|SET|SETS|THEN|REPEAT|EMOM|AMRAP|TABATA|SUICIDE|SPRINT|PER EXERCISE|MIN REST|EACH SET)\b/i.test(trimmed)) {
        result.push(trimmed);
      }
    }
    // Clean up: remove leading dashes/numbers/rep-counts, trim "4 rounds" prefix residue
    // Also filter out bare format keywords that sneaked through (e.g. "EMOM" extracted from "6 rounds EMOM")
    const cleaned = result.map(e =>
      e.replace(/^[-\u2013]\s*/, '')
       .replace(/^\d+\s*rounds?\s*/i, '')
       .replace(/^\d+\s+/, '')  // strip leading rep counts like "15 ", "12 "
       .trim()
    ).filter(e => e.length > 2 && !/^\d+$/.test(e) && !/SUICIDE|ROUND.*REST|^PER |^EACH$/i.test(e) && !/^\d+\s*[).:]/i.test(e) && !/^(EMOM|AMRAP|TABATA)$/i.test(e));
    return cleaned.length > 0 ? cleaned : null;
  }
  
  // AMRAP
  const amrapM = upper.match(/(\d+)\s*MIN\s*AMRAP/i) || upper.match(/AMRAP\s*[-:]*\s*(\d+)/i);
  if (amrapM) {
    const mins = parseInt(amrapM[1]);
    return { type: "countdown", totalSeconds: mins * 60, label: `${mins} Min AMRAP` };
  }
  
  // "N Rounds - 1 min each/per exercise" — e.g. "4 Rounds - 1 min each" with a list of exercises
  // Treat as an EMOM where total minutes = N rounds × number of exercises
  // Also handle parentheses format: "3 rounds (1 min per exercise)"
  const roundsPerMinM = upper.match(/(\d+)\s*ROUNDS?\s*(?:[-:]\s*|\s*\(\s*)1\s*MIN(?:UTE)?\s*(?:EACH|PER)/i);
  if (roundsPerMinM) {
    const numRounds = parseInt(roundsPerMinM[1]);
    const exercises = parseExercises(text);
    const numEx = exercises ? exercises.length : 1;
    const totalMins = numRounds * numEx;
    return { type: "emom", totalSeconds: totalMins * 60, totalMinutes: totalMins, exercises, label: `${totalMins} Min EMOM` };
  }

  // DEATH BY EMOM — check before regular EMOM so "add N each minute" patterns aren't missed
  if (/DEATH BY/i.test(upper) || /ADD \d+ REP.*EACH MINUTE/i.test(upper) ||
      /ADD \d+\s+.{0,40}\s+(?:EACH|PER)\s+MINUTE/i.test(upper)) {
    return { type: "deathby", label: "Death By EMOM" };
  }

  // EMOM (regular, not death-by)
  if (/EMOM/i.test(upper)) {
    // Priority 1: "N Min EMOM" — explicit total minutes (same line only, use [ \t]* not \s* to avoid crossing newlines)
    const minExplicitM = upper.match(/(\d+)\s*M(?:IN)?\s*EMOM/i);
    // Priority 2: "N rounds EMOM" — multiply N by number of exercises
    const roundsEmomM = upper.match(/(\d+)\s*ROUNDS?\s+.*EMOM/i);
    // Priority 3: "EMOM - N" or "EMOM N" on the same line (use [ \t]* to prevent crossing to exercise-label digits on next line)
    const trailingM = text.match(/EMOM[ \t]*[-:]*[ \t]*(\d+)/i);

    if (minExplicitM) {
      const mins = parseInt(minExplicitM[1]);
      const exercises = parseExercises(text);
      return { type: "emom", totalSeconds: mins * 60, totalMinutes: mins, exercises, label: `EMOM ${mins} Min` };
    } else if (roundsEmomM) {
      const numRounds = parseInt(roundsEmomM[1]);
      const exercises = parseExercises(text);
      const numEx = exercises ? exercises.length : 1;
      const totalMins = numRounds * numEx;
      return { type: "emom", totalSeconds: totalMins * 60, totalMinutes: totalMins, exercises, label: `EMOM ${totalMins} Min` };
    } else if (trailingM) {
      const mins = parseInt(trailingM[1]);
      const exercises = parseExercises(text);
      return { type: "emom", totalSeconds: mins * 60, totalMinutes: mins, exercises, label: `EMOM ${mins} Min` };
    }
  }
  
  // TABATA — explicit keyword OR work/rest interval patterns
  const hasTabataWord = /TABATA/i.test(upper);
  const intervalMatch = upper.match(/(\d+)\s*[/\\]\s*(\d+)/) ||
                         upper.match(/(\d+)\s*S(?:EC)?\s*ON\s*[/,]?\s*(\d+)\s*S(?:EC)?\s*(?:OFF|REST)/i) ||
                         upper.match(/(\d+)\s*SEC?\s*ON\s*(\d+)\s*(?:OFF|REST)/i) ||
                         upper.match(/(\d+)\s*S(?:EC)?\s*WORK\s*[/,]?\s*(\d+)\s*S(?:EC)?\s*(?:OFF|REST)/i);
  // Detect work/rest patterns: explicit keywords, bare "40/20" at line start, "Xs on/Ys off", "per exercise" intervals
  const hasWorkRestContext = hasTabataWord || /ON.*OFF|WORK.*REST/i.test(upper) ||
    /ROUNDS?\s*[-\u2013(]/i.test(upper) ||
    /^\d+\s*[/\\]\s*\d+\s*$/m.test(text.trim().split('\n')[0].trim()) ||  // bare "40/20" on first line
    /\d+\s*[/\\]\s*\d+\s*PER\s*EXERCISE/i.test(upper) ||                  // "40/20 per exercise"
    /\d+S?\s*ON\s*[/,]?\s*\d+S?\s*(OFF|REST)/i.test(upper) ||             // "40s on 20s off"
    /\(\d+\s*[/\\]\s*\d+\)/i.test(upper);                                  // "(40/20)" in parens
  const isWorkRest = intervalMatch && hasWorkRestContext;

  // Interval pyramids have varying work/rest per round — they must NOT be flattened
  // into a single fixed-interval tabata (handled by the dedicated PYRAMID branch below).
  if ((hasTabataWord || isWorkRest) && !/PYRAMID/i.test(upper)) {
    let work = 20, rest = 10;
    if (intervalMatch) { work = parseInt(intervalMatch[1]); rest = parseInt(intervalMatch[2]); }
    const WORD_NUMS = { "one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,"nine":9,"ten":10 };
    const roundsM = upper.match(/(\d+)\s*ROUNDS?/i) || upper.match(/\b(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)\s*ROUNDS?/i);
    const rounds = roundsM ? (WORD_NUMS[roundsM[1].toLowerCase()] ?? parseInt(roundsM[1])) : 8;
    const exercises = parseExercises(text);
    const stations = exercises ? exercises.length : 4;
    return { type: "tabata", workSeconds: work, restSeconds: rest, rounds, stations, exercises, label: `Tabata ${work}s/${rest}s` };
  }
  
  // FIGHT GONE BAD
  if (/FIGHT GONE BAD/i.test(upper) || (/1 MIN.*STATION/i.test(upper) && /ROTATE/i.test(upper))) {
    const roundM = upper.match(/(\d+)\s*ROUNDS?/i);
    const exercises = parseExercises(text);
    const stations = exercises ? exercises.length : 5;
    return { type: "fgb", rounds: roundM ? parseInt(roundM[1]) : 3, stations, stationSeconds: 60, restSeconds: 60, exercises, label: "Fight Gone Bad" };
  }
  
  // FOR TIME / CHIPPER
  if (/FOR TIME/i.test(upper) || /ONCE THROUGH/i.test(upper)) {
    const capM = upper.match(/(\d+)\s*MIN/i);
    return { type: "stopwatch", capSeconds: capM ? parseInt(capM[1]) * 60 : null, label: capM ? `For Time (${capM[1]}m)` : "For Time" };
  }
  
  // DECK OF CARDS
  if (/DECK|CARD/i.test(upper) && /FLIP|SHUFFLE/i.test(upper)) {
    const minsM = upper.match(/(\d+)\s*MIN/i);
    const mins = minsM ? parseInt(minsM[1]) : 25;
    return { type: "countdown", totalSeconds: mins * 60, label: `Deck of Cards \u2014 ${mins} Min` };
  }
  
  // RUNNING CLOCK
  if (/SET A \d+-MIN CLOCK/i.test(upper) || /RUNNING CLOCK/i.test(upper)) {
    const minsM = upper.match(/(\d+)-MIN CLOCK/i) || upper.match(/(\d+)\s*MIN/i);
    const mins = minsM ? parseInt(minsM[1]) : 30;
    return { type: "countdown", totalSeconds: mins * 60, label: `Running Clock ${mins} Min` };
  }

  // INTERVAL PYRAMID
  if (/PYRAMID/i.test(upper)) {
    return { type: "stopwatch", label: "Interval Pyramid" };
  }

  // CIRCUIT — timed format with explicit per-exercise durations and a round count
  // e.g. "3 rounds - 30s Plank, 30s Cycle Crunch, 30s Rest"
  //       "3 * 1 min plank, 30s rest"
  //       "3 times - 30 sec plank, 30 sec side plank - 30 sec rest"
  //       "1min plank, 30s rest * 2"
  {
    function parseDur(str) {
      // "30s" / "30sec" / "1min" / "1.5min" → seconds
      const m = (str || '').trim().match(/^(\d+(?:\.\d+)?)\s*(min(?:ute)?|m(?=\s|$)|s(?:ec(?:ond)?)?)/i);
      if (!m) return null;
      const n = parseFloat(m[1]);
      return /^m/i.test(m[2]) ? Math.round(n * 60) : Math.round(n);
    }

    let cRounds = null, cBody = text.trim(), cTrailingRest = 0;

    // Leading "N rounds/times/sets of |– " or "N * "
    const cLeadM = cBody.match(/^(\d+)\s*(?:times?|rounds?|sets?)\s*(?:of\s+|[-:]\s*)/i) ||
                   cBody.match(/^(\d+)\s*\*\s*/i);
    if (cLeadM) { cRounds = parseInt(cLeadM[1]); cBody = cBody.slice(cLeadM[0].length); }
    else {
      // Trailing "* N" or "× N", optionally with "(Xs rest)" — extract both in one pass
      const cTrailM = cBody.match(/[*×]\s*(\d+)\s*(?:\(\s*(\d+)\s*(s(?:ec)?|min)\s*rest\s*\))?\s*$/i);
      if (cTrailM) {
        cRounds = parseInt(cTrailM[1]);
        if (cTrailM[2]) cTrailingRest = parseDur(cTrailM[2] + ' ' + cTrailM[3]) || parseInt(cTrailM[2]);
        cBody = cBody.slice(0, cBody.length - cTrailM[0].length).trim().replace(/,\s*$/, '');
      }
    }

    if (cRounds && cRounds >= 2 && cRounds <= 10) {
      // Must have at least one timed exercise ("30s …" / "1 min …" / "30 sec …")
      if (/\d+\s*(?:s(?:ec)?|min|m(?=\s))\s+\w/i.test(cBody)) {
        let cRest = 0;
        // Trailing "- Xs rest" or ", Xs rest" before end
        const cTrailRest = cBody.match(/\s*[-–,]\s*(\d+)\s*(s(?:ec)?|min)\s*rest\s*$/i);
        if (cTrailRest) { cRest = parseDur(cTrailRest[1] + ' ' + cTrailRest[2]) || parseInt(cTrailRest[1]); cBody = cBody.slice(0, cBody.length - cTrailRest[0].length).trim(); }
        // "(Xs rest)" in parens at end
        const cParenRest = cBody.match(/\s*\(\s*(\d+)\s*(s(?:ec)?|min)\s*rest\s*\)\s*$/i);
        if (cParenRest) { cRest = parseDur(cParenRest[1] + ' ' + cParenRest[2]) || parseInt(cParenRest[1]); cBody = cBody.slice(0, cBody.length - cParenRest[0].length).trim(); }

        const cParts = cBody.split(/,\s*/);
        const cExercises = [];
        let cExSecs = 30;
        let hasTimedEx = false;

        for (const p of cParts) {
          const pt = p.trim();
          if (!pt) continue;
          // "Xs rest" / "X sec rest" → round-level rest period (not an exercise)
          if (/^(\d+(?:\.\d+)?)\s*(s(?:ec)?|min)?\s*rest\b/i.test(pt)) {
            const rm = pt.match(/^(\d+(?:\.\d+)?)\s*(s(?:ec(?:ond)?)?|min(?:ute)?)/i);
            if (rm) cRest = parseDur(rm[1] + ' ' + rm[2]) || parseInt(rm[1]);
            continue;
          }
          // "Xs/Xmin Exercise" → timed exercise
          const dm = pt.match(/^(\d+(?:\.\d+)?)\s*(s(?:ec(?:ond)?)?|min(?:ute)?|m(?=\s))\s+(.+)/i);
          if (dm) {
            const dur = parseDur(dm[1] + ' ' + dm[2]);
            if (dur) { cExSecs = dur; hasTimedEx = true; }
            const name = dm[3].replace(/\(.*?\)/g, '').replace(/\s+ea\.?\s*(side)?/i, ' ea').trim();
            if (name.length > 1) cExercises.push(name);
            continue;
          }
          // Skip rep-only items ("15 V-ups") — number followed by exercise but no time unit
          if (/^\d+\s+[A-Za-z]/.test(pt) && !/\d\s*(?:s(?:ec)?|min)\b/i.test(pt)) continue;
          // Plain name (no prefix) — include unless it looks like a format keyword
          if (pt.length > 1 && !/^\s*rest\s*$/i.test(pt) && !/\bROUNDS?\b/i.test(pt)) cExercises.push(pt);
        }

        // Apply trailing-asterisk rest if no rest was found inline
        if (!cRest && cTrailingRest) cRest = cTrailingRest;
        if (hasTimedEx && cExercises.length > 0) {
          const totalSeconds = cRounds * (cExercises.length * cExSecs + cRest);
          return { type: "circuit", exerciseSeconds: cExSecs, restSeconds: cRest, rounds: cRounds, exercises: cExercises, totalSeconds, label: `Core Circuit — ${cRounds} Rounds` };
        }
      }
    }
  }

  // "N min [Word] Workout" header — treat as an N-minute countdown
  // e.g. "20 min Metabolic Workout (30s rest between exercise pairs)"
  const namedWorkoutM = upper.match(/^(\d+)\s*MIN\s+\w+\s+WORKOUT\b/);
  if (namedWorkoutM) {
    const mins = parseInt(namedWorkoutM[1]);
    return { type: "countdown", totalSeconds: mins * 60, label: `${mins} Min Workout` };
  }

  // SINGLE-ROUND TIMED CIRCUIT — a list of "Ns Exercise" items with no round count,
  // all the same duration (e.g. "30s Skipping, 30s Boxing, 30s High-Knee, ...").
  // Run once through, N seconds per exercise. Multi-round circuits and explicit
  // "N min Workout" headers are handled above, so this is a last resort before stopwatch.
  {
    const items = text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const exercises = [];
    const durations = new Set();
    let restSeconds = 0, nonTimed = 0;
    for (const it of items) {
      const restM = it.match(/^(\d+(?:\.\d+)?)\s*(s(?:ec)?|min)?\s*rest\b/i);
      if (restM) { restSeconds = /^m/i.test(restM[2] || "") ? Math.round(parseFloat(restM[1]) * 60) : Math.round(parseFloat(restM[1])); continue; }
      const exM = it.match(/^(\d+(?:\.\d+)?)\s*(s(?:ec(?:ond)?)?|min(?:ute)?)\s+(.+)/i);
      if (exM) {
        const sec = /^m/i.test(exM[2]) ? Math.round(parseFloat(exM[1]) * 60) : Math.round(parseFloat(exM[1]));
        durations.add(sec);
        exercises.push(exM[3].replace(/\(.*?\)/g, "").trim());
      } else { nonTimed++; }
    }
    // Fire only when it clearly reads as a uniform timed circuit
    if (exercises.length >= 3 && durations.size === 1 && nonTimed <= 2) {
      const sec = [...durations][0];
      return { type: "circuit", exerciseSeconds: sec, restSeconds, rounds: 1, exercises,
               totalSeconds: exercises.length * sec + restSeconds, label: `Timed Circuit — ${exercises.length} × ${sec}s` };
    }
  }

  // Default: stopwatch (count up)
  const label = /ROUND|SET/i.test(upper) ? "Rounds" : "Timer";
  return { type: "stopwatch", label };
}



export { parseBlocks, detectBlockTimer };
