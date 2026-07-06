
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

// CSS gradient pattern backgrounds for workout categories (replaces photos)
const CATEGORY_PATTERNS = {
  Bodyweight: { bg: "linear-gradient(135deg, #1a2a1a 0%, #0a1a0f 50%, #1a3020 100%)", accent: "#3ddc84", pattern: "radial-gradient(circle at 30% 70%, #3ddc8410 0%, transparent 50%)" },
  Kettlebell: { bg: "linear-gradient(135deg, #2a1a0a 0%, #1a0f05 50%, #301a0a 100%)", accent: "#ff8a3a", pattern: "radial-gradient(circle at 70% 30%, #ff8a3a10 0%, transparent 50%)" },
  Dumbbell: { bg: "linear-gradient(135deg, #1a1a2a 0%, #0f0f1a 50%, #1a1a30 100%)", accent: "#3b82f6", pattern: "radial-gradient(circle at 50% 50%, #3b82f610 0%, transparent 50%)" },
  Mixed: { bg: "linear-gradient(135deg, #2a1a2a 0%, #1a0f1a 50%, #301a30 100%)", accent: "#8b5cf6", pattern: "radial-gradient(circle at 40% 60%, #8b5cf610 0%, transparent 50%)" },
};
    
// ═══════════════════════════════════════════════════════════════
// EXERCISE ENCYCLOPEDIA
// ═══════════════════════════════════════════════════════════════
// EXERCISE ENCYCLOPEDIA — all 57 unique exercises
const EXERCISE_INFO = {
  "squats": { name: "Squats", aka: "Air Squats, Bodyweight Squats, Goblet Squats, Prisoner Squats", muscles: "Quads, Glutes, Hamstrings, Core", desc: "Stand with feet shoulder-width apart. Push hips back and bend knees to lower until thighs are parallel to the ground. Keep chest up, weight in heels. Drive back up to standing. Goblet: hold a KB at chest. Prisoner: hands behind head." },
  "push-ups": { name: "Push-Ups", aka: "Press-Ups, Tricep Push-Ups, Diamond Push-Ups", muscles: "Chest, Shoulders, Triceps, Core", desc: "Start in a plank position, hands slightly wider than shoulders. Lower your chest to the ground keeping your body in a straight line. Push back up to full arm extension. Tricep push-ups: hands narrow, elbows tucked." },
  "rows": { name: "Pull-Up Rows", aka: "Inverted Rows, Australian Pull-Ups", muscles: "Back, Biceps, Rear Delts, Core", desc: "Hang underneath a fixed bar or railing with arms extended and body below it (face up). Pull your chest up to the bar by driving your elbows back and squeezing your shoulder blades together. Lower with control. The more horizontal your body, the harder it gets. Not to be confused with Bent-Over Rows — this exercise is done under a bar, body facing upward." },
  "burpees": { name: "Burpees", aka: "", muscles: "Full Body — Chest, Legs, Shoulders, Core, Cardio", desc: "From standing, drop into a squat and place hands on the ground. Jump feet back into a plank, do a push-up, jump feet forward to hands, then explosively jump up with arms overhead. That's one rep." },
  "kb swings": { name: "Kettlebell Swings", aka: "KB Swings, Russian Swings", muscles: "Glutes, Hamstrings, Core, Shoulders, Grip", desc: "Stand with feet wider than shoulders, KB on the floor ahead of you. Hinge at hips, grab the bell, hike it between your legs, then snap hips forward to swing the KB to chest/eye height. Control the swing back down. Power comes from the hip snap, not the arms." },
  "lunges": { name: "Lunges", aka: "Walking Lunges, Reverse Lunges, Jump Lunges, Lizard Lunges, Pylo Lunges", muscles: "Quads, Glutes, Hamstrings, Core, Balance", desc: "Step forward (or backward for reverse lunges) and lower your back knee toward the ground. Front knee stays over ankle, torso upright. Push through front heel to return to standing. Lizard lunges: deep lunge with hands on the ground inside your front foot — great hip opener." },
  "box jumps": { name: "Box Jumps", aka: "Double Box Jumps", muscles: "Quads, Glutes, Calves, Explosiveness", desc: "Stand facing a sturdy bench or box. Swing arms and jump onto the box, landing softly with both feet. Stand fully upright, then step or jump back down. Scale by using a lower surface or stepping up instead." },
  "mountain climbers": { name: "Mountain Climbers", aka: "", muscles: "Core, Hip Flexors, Shoulders, Cardio", desc: "Start in a plank position. Drive one knee toward your chest, then quickly switch legs in a running motion. Keep hips level — don't let them bounce up. Move as fast as you can while keeping good form." },
  "planks": { name: "Plank", aka: "Front Plank, Side Plank", muscles: "Core, Shoulders, Glutes", desc: "Hold a push-up position on forearms (or hands). Body forms a straight line from head to heels. Squeeze your glutes and brace your core. For side plank: rotate onto one forearm, stack feet, lift hips." },
  "dips": { name: "Dips", aka: "Bench Dips, Tricep Dips", muscles: "Triceps, Chest, Shoulders", desc: "Place hands on a bench or parallel bars behind you, fingers forward. Lower your body by bending elbows to about 90°, then push back up. Keep back close to the bench. Deeper = harder on shoulders, so find your comfortable range." },
  "sit-ups": { name: "Sit-Ups", aka: "", muscles: "Abs, Hip Flexors", desc: "Lie on your back, knees bent, feet flat. Cross arms over chest or touch temples. Curl your torso up until you're sitting upright, then lower back down with control. Keep feet on the ground." },
  "crunches": { name: "Bicycle Crunches / Cycle Crunches", aka: "Cycle Crunches", muscles: "Abs (especially Obliques), Hip Flexors", desc: "Lie on your back, hands at temples. Lift shoulders off the ground and bring one knee toward the opposite elbow while extending the other leg. Alternate sides in a cycling motion. Keep lower back pressed to the floor." },
  "flutter kicks": { name: "Flutter Kicks", aka: "", muscles: "Lower Abs, Hip Flexors", desc: "Lie on your back, hands under your glutes or by your sides. Lift both feet a few inches off the ground. Kick legs up and down in small, rapid alternating motions. Keep lower back pressed to the floor." },
  "hollow holds": { name: "Hollow Hold", aka: "Hollow Body Hold", muscles: "Core (deep stabilisers), Hip Flexors", desc: "Lie on your back. Extend arms overhead and legs out straight. Lift arms, head, shoulders, and legs a few inches off the ground. Your lower back should be pressed firmly into the floor, creating a 'hollow' body position. Hold." },
  "v-ups": { name: "V-Ups", aka: "Jackknife Sit-Ups", muscles: "Abs, Hip Flexors", desc: "Lie flat on your back, arms extended overhead. Simultaneously lift your legs and torso, reaching your hands toward your toes to form a V shape at the top. Lower back down with control. Keep legs as straight as possible." },
  "russian twists": { name: "Russian Twists", aka: "", muscles: "Obliques, Core", desc: "Sit on the ground, lean back slightly, lift feet off the floor. Clasp hands together (or hold a weight). Rotate your torso side to side, touching the ground beside each hip. Keep your core tight and chest up." },
  "leg raises": { name: "Leg Raises", aka: "Lying Leg Raises", muscles: "Lower Abs, Hip Flexors", desc: "Lie on your back, legs straight, hands under your glutes. Keeping legs straight, lift them to 90° then lower slowly back down without touching the floor. Press lower back into the ground throughout." },
  "hip-ups": { name: "Hip-Ups", aka: "Hip Raises, Reverse Crunches", muscles: "Lower Abs, Core", desc: "Lie on your back, raise legs to 90°. Push your hips upward off the floor by contracting your lower abs, lifting your feet straight toward the ceiling. Lower hips back down with control." },
  "dead bugs": { name: "Dead Bugs", aka: "", muscles: "Deep Core, Stability", desc: "Lie on your back, arms extended to ceiling, knees bent at 90° above hips. Slowly extend one arm overhead while extending the opposite leg, keeping lower back on the ground. Return and switch sides." },
  "shoulder press": { name: "Shoulder Press", aka: "Strict Press, Overhead Press, Push Press, DB Press, KB Push Press", muscles: "Shoulders, Triceps, Upper Chest, Core", desc: "Hold weights at shoulder height, palms forward. Press straight up overhead until arms are fully extended. Lower back to shoulders with control. Strict press = no leg drive. Push press = slight knee dip for momentum." },
  "curls": { name: "Bicep Curls / Hammer Curls", aka: "DB Curls, Hammer Curls", muscles: "Biceps, Forearms", desc: "Hold weights at your sides, palms forward (regular) or facing each other (hammer curls). Curl the weight up toward your shoulders, keeping elbows pinned to your sides. Lower with control. Don't swing!" },
  "triceps": { name: "Skull Crushers", aka: "Tricep Extensions, Overhead Tricep Extension, KB Skull Crushers", muscles: "Triceps", desc: "Hold a weight (dumbbell, kettlebell, or plate) with both hands and extend your arms overhead. Keeping your elbows forward and close together, slowly bend at the elbows to lower the weight behind your head. Extend back up until arms are straight overhead. Can be done lying down or seated. Isolates the triceps through a full range of motion. Keep upper arms still — only your forearms move." },
  "high pulls": { name: "High Pulls", aka: "KB High Pulls, Upright Rows", muscles: "Shoulders, Traps, Upper Back, Core", desc: "Hold a kettlebell with both hands. Hinge at hips slightly, then explosively pull the bell up to chin height, leading with your elbows. Control it back down. Similar to a swing but you pull the bell up instead of letting it float." },
  "deadlifts": { name: "Deadlifts", aka: "Romanian Deadlifts, RDL, Single Leg Deadlifts, DB Deadlifts", muscles: "Hamstrings, Glutes, Lower Back, Grip", desc: "Stand with weight in front of your thighs. Hinge at hips, pushing them back while keeping a flat back, lowering the weight down your legs. Feel the stretch in your hamstrings, then drive hips forward to stand tall. Don't round your back." },
  "thrusters": { name: "Thrusters", aka: "Squat Press, Squat to Press", muscles: "Full Body — Quads, Glutes, Shoulders, Triceps, Core", desc: "Hold weight at shoulders. Squat down fully, then as you drive up explosively, use that momentum to press the weight overhead in one fluid motion. It's a front squat that flows directly into an overhead press." },
  "cleans": { name: "Clean & Press", aka: "KB Clean & Press, Power Clean", muscles: "Full Body — Legs, Hips, Back, Shoulders, Grip", desc: "Start with the KB on the ground. Hinge and pull it up, rotating your wrist so the bell 'racks' on your forearm at shoulder height (that's the clean). From there, press it overhead. Lower back to shoulder, then to ground. One fluid sequence." },
  "snatches": { name: "Snatch", aka: "KB Snatch, One-Arm Snatch", muscles: "Full Body — Shoulders, Back, Hips, Core, Grip", desc: "Start with the KB between your legs. With one arm, swing it back then drive hips forward to pull the KB overhead in one motion, punching your hand through at the top so it doesn't slam your wrist. Control it back down through the swing." },
  "kb halos": { name: "KB Halos", aka: "Kettlebell Halos", muscles: "Shoulders, Core, Mobility", desc: "Hold a kettlebell upside-down (by the horns) at chest height. Circle it around your head — go over one shoulder, behind your head, over the other shoulder, back to front. Keep your core tight and head still. Alternate directions." },
  "kb figure-8": { name: "KB Figure-8", aka: "Kettlebell Figure-8", muscles: "Core, Grip, Legs, Coordination", desc: "Stand in a wide squat stance. Pass the KB between your legs in a figure-8 pattern, alternating hands with each pass. Keep your back flat and core braced. Can be done slowly (controlled) or fast (cardio). Great for grip strength, core rotation and hip mobility." },
  "turkish get-ups": { name: "Turkish Get-Up", aka: "TGU", muscles: "Full Body — Shoulders, Core, Hips, Stability", desc: "Lie on your back holding a KB in one hand, arm extended vertical. Roll to your elbow, then to your hand, raise your hips, sweep your leg through to kneeling, then stand. Reverse the sequence to return. Each rep takes ~15 seconds — go slow and controlled. Use 12-16kg KB. Exceptional for shoulder stability and full-body coordination." },
  "inchworms": { name: "Inchworms", aka: "Walk-Outs", muscles: "Core, Shoulders, Hamstrings, Full Body Stretch", desc: "From standing, bend forward and place hands on the ground. Walk your hands out to a plank position, do a push-up (optional), then walk your hands back to your feet and stand up. Great for warming up the whole body." },
  "step-ups": { name: "Step-Ups", aka: "Box Step-Ups", muscles: "Quads, Glutes, Balance", desc: "Stand facing a bench or box. Step one foot fully onto the surface, drive through that heel to stand on top. Step back down. Alternate legs or do all reps on one side. Keep your torso upright." },
  "running": { name: "Running / Laps", aka: "100M, 200M, 400M, Laps, Sprints, Suicides", muscles: "Cardio, Legs (Calves, Quads, Hamstrings), Endurance", desc: "Run the specified distance at the park. 1 Lap typically = around the perimeter. 100M = a short sprint. Suicides = run to 10M mark, back, 20M mark, back, 30M mark, back. Pace yourself or sprint as the workout demands." },
  "skipping": { name: "Skipping / Jump Rope", aka: "Skips, Jump Rope", muscles: "Calves, Cardio, Coordination", desc: "Skip rope (or simulate without a rope). Stay on the balls of your feet, jump just high enough for the rope to pass under. Keep elbows close to your body, rotate from the wrists. Count each skip/rotation." },
  "jumping jacks": { name: "Jumping Jacks", aka: "Star Jumps", muscles: "Cardio, Shoulders, Legs", desc: "Stand with feet together, arms at sides. Jump feet wide while raising arms overhead. Jump back to start. Keep a steady rhythm." },
  "jumping": { name: "Tuck Jumps", aka: "Tuck Jumps", muscles: "Quads, Glutes, Calves, Explosiveness", desc: "Jump as high as possible, pulling knees to chest at the top. Land softly on the balls of your feet. Explosive movement — great for building power." },
  "bear crawls": { name: "Bear Crawls", aka: "", muscles: "Shoulders, Core, Quads, Coordination", desc: "Get on all fours with knees hovering just above the ground. Crawl forward by moving opposite hand and foot together. Keep your back flat and hips low. Harder than it looks — great for core and shoulder stability." },
  "skaters": { name: "Skaters", aka: "Lateral Skaters, Side-to-Side Jumps", muscles: "Legs (inner/outer thighs), Glutes, Balance, Cardio", desc: "Stand on one foot. Leap sideways to the opposite foot, landing softly and sweeping the trailing leg behind you (like a speed skater). Immediately leap back to the other side. Stay low and controlled." },
  "glute bridges": { name: "Glute Bridges", aka: "Hip Bridges", muscles: "Glutes, Hamstrings, Core", desc: "Lie on your back, knees bent, feet flat on the floor. Push through your heels to lift your hips toward the ceiling, squeezing your glutes at the top. Hold briefly, then lower with control." },
  "man makers": { name: "Man Makers", aka: "", muscles: "Full Body — everything", desc: "With a dumbbell in each hand: do a push-up, row left, row right, jump feet to hands, clean the DBs to shoulders, thruster overhead. That's ONE rep. Brutal full-body movement." },
  "devil press": { name: "Devil Press", aka: "DB Devil Press", muscles: "Full Body — Chest, Shoulders, Legs, Back", desc: "Place two DBs on the ground shoulder-width apart. Grip them and perform a full burpee (chest touches ground). At the top, explosively swing/snatch both DBs overhead simultaneously in one movement — like a double DB snatch. Lower under control. Use 8-10kg. Extremely demanding — one of the hardest compound movements." },
  "shrugs": { name: "Shrugs", aka: "DB Shrugs, Shoulder Shrugs", muscles: "Traps, Upper Back", desc: "Hold weights at your sides with arms straight. Raise your shoulders straight up toward your ears as high as possible. Squeeze at the top, then lower slowly. Don't roll your shoulders — straight up and down." },
  "calves": { name: "Calf Raises", aka: "Standing Calf Raises", muscles: "Calves (Gastrocnemius, Soleus)", desc: "Stand on the edge of a step or flat on the ground. Rise up onto the balls of your feet as high as you can, squeezing your calves at the top. Lower slowly. For extra range, let your heels drop below the step level." },
  // === NEW EXERCISES (from exercise guides) ===
  "bear complex": { name: "Bear Complex", aka: "DB/KB Bear Complex", muscles: "Full Body — Legs, Back, Shoulders, Core, Grip", desc: "A multi-movement complex done fluidly as one sequence without putting the weight down: 1) Deadlift from floor, 2) Clean to rack/shoulder position, 3) Front Squat, 4) Push Press overhead, 5) Lower to shoulders, lower to hang, lower to floor. That is 1 rep. Use DBs (both hands) or a single KB. Start LIGHT (8-10kg DB). Practise each part slowly first." },
  "broad jumps": { name: "Broad Jumps", aka: "Standing Broad Jumps", muscles: "Glutes, Hamstrings, Quads, Calves, Explosiveness", desc: "Stand with feet hip-width. Bend knees, swing arms back, then explode forwards covering as much distance as possible. Land softly with bent knees, absorbing the impact. Each landing = 1 rep, jump again from there. Full-body plyometric that hammers posterior chain and builds explosive power. Aim for maximum horizontal distance." },
  "bulgarian split squats": { name: "Bulgarian Split Squat", aka: "Rear Foot Elevated Split Squat", muscles: "Quads, Glutes, Hamstrings, Balance", desc: "Stand approximately 1 metre in front of a bench. Reach one foot behind and place it on top of the bench. Lower your back knee toward the ground in a single-leg squat motion. Front knee tracks over toes, torso stays upright. Hold DBs at sides. Dramatically harder than regular lunges — expect serious glute and quad fatigue." },
  "copenhagen planks": { name: "Copenhagen Plank", aka: "", muscles: "Adductors, Obliques, Lateral Hip Stabilisers", desc: "Lie on your side. Place your top foot on the edge of a bench (shin resting on bench). Lift your bottom leg slightly off the ground. Hold your body in a straight plank position, supported by your forearm and the bench. Dramatically harder than a regular side plank — targets adductors, obliques and lateral hip stabilisers. Start with 10-15 second holds each side." },
  "dead hangs": { name: "Dead Hang", aka: "Bar Hang, Passive Hang", muscles: "Grip, Forearms, Shoulders, Lats (stretch)", desc: "Grab a pull-up bar or overhead railing with an overhand grip, hands shoulder-width apart. Let your body hang with arms fully extended. Relax your shoulders and breathe. Builds grip strength and decompresses the spine. Great between sets of upper body work." },
  "gorilla rows": { name: "Gorilla Rows", aka: "KB Gorilla Rows", muscles: "Back, Biceps, Core, Explosive Pulling Strength", desc: "Place a KB on the ground. Stand over it in a wide, bent-over stance (like a gorilla). Grip the KB and row it explosively with one hand, setting it back down between reps. Alternate arms. Unlike regular rows, each rep starts from a dead stop on the floor. Builds explosive pulling strength and core stability." },
  "hollow body rocks": { name: "Hollow Body Rocks", aka: "Hollow Rocks", muscles: "Core (deep stabilisers), Hip Flexors", desc: "Lie on your back. Press your lower back firmly into the ground, arms overhead, legs straight and raised about 30cm off the ground. Your body forms a shallow banana/hollow shape. Rock forwards and backwards rhythmically while maintaining the hollow position throughout — do NOT break the shape. A gymnastics fundamental for core rigidity." },
  "kb around the world": { name: "KB Around the World", aka: "", muscles: "Rotational Core, Grip, Shoulder Girdle", desc: "Stand with feet hip-width. Hold KB with both hands. Pass it in a large circle around your body — right hand passes to left behind your back, left hand swings it around the front. Do prescribed reps in one direction, then reverse. Keep core tight and avoid rotating your hips." },
  "kb windmills": { name: "KB Windmill", aka: "Kettlebell Windmill", muscles: "Obliques, Rotator Cuff, Hamstrings, Shoulder Stability", desc: "Press KB overhead in one hand with arm fully locked. Push your hip out to that same side, hinge forward (hips back) and reach opposite hand down toward your foot or shin. Keep the KB arm completely vertical throughout. Return to standing. Use 12-16kg to learn. Targets obliques, rotator cuff, and hamstrings." },
  "lateral broad jumps": { name: "Lateral Broad Jumps", aka: "Side Broad Jumps", muscles: "Lateral Power, Hip Stability, Quads, Glutes", desc: "Stand with feet hip-width apart. Push off both feet and jump sideways as far as possible, landing softly and absorbing impact through your hips and knees. Jump back to start. Each jump = 1 rep. Unlike forward broad jumps, these build lateral power and hip stability. Keep knees tracking over toes on landing." },
  "lateral lunges": { name: "Lateral Lunge", aka: "Side Lunge, DB Lateral Lunge", muscles: "Glutes, Inner Thighs (Adductors), Quads", desc: "Stand with feet together holding DBs. Step one foot out wide to the side, bending that knee into a deep lateral squat while keeping the other leg straight. Push hips back as you lower. Drive back up through your heel. Targets the glutes, inner thighs and quads from a different angle to regular lunges. Alternate sides each rep." },
  "plank to down dog": { name: "Plank to Down Dog", aka: "", muscles: "Shoulders, Hamstrings, Calves, Thoracic Spine Mobility", desc: "Start in a high plank (push-up) position. Push your hips up and back into a downward dog position (inverted V shape), holding briefly at the top. Return to plank. Repeat rhythmically. Mobilises thoracic spine, hamstrings and calves while building shoulder endurance. Works well as a warm-up movement or in a circuit." },
  "push-up t-rotations": { name: "Push-Up to T-Rotation", aka: "T Push-Ups, Rotational Push-Ups", muscles: "Chest, Shoulders, Rotational Core, Triceps", desc: "Perform a standard push-up. At the top, rotate your entire body to one side — stacking your feet and extending your top arm straight up toward the sky (side plank position). Hold briefly, return, perform another push-up, rotate to the other side. Alternate sides. Builds rotational core strength and shoulder stability." },
  "suitcase carry": { name: "Suitcase Carry", aka: "Farmer's Walk (one-sided)", muscles: "Core Stability, Obliques, Grip, Shoulders", desc: "Hold ONE KB or DB at your side like a suitcase. Walk for the prescribed distance. The key is to resist the urge to lean toward the weight — stand tall, shoulders level, core braced hard. Switch hands at the halfway point. Incredibly effective for core stability, obliques and grip. Use a heavy KB (16-20kg)." },
  // === ADDITIONAL EXERCISES (v8 quality review) ===
  "good mornings": { name: "Good Mornings", aka: "Barbell Good Morning, KB Good Morning", muscles: "Hamstrings, Glutes, Lower Back, Core", desc: "Stand with feet shoulder-width apart, hands behind your head or holding a weight at your shoulders. Keeping your back flat and knees slightly bent, hinge at the hips and lower your torso forward until it's roughly parallel to the ground. Drive your hips forward to return to standing. Focus on feeling the stretch in your hamstrings — don't round your back." },
  "sumo squats": { name: "Sumo Squat", aka: "Sumo SQ, Wide Squat, Sumo Squat with Bounce", muscles: "Quads, Inner Thighs (Adductors), Glutes, Core", desc: "Stand with feet wider than shoulder-width, toes pointed outward at 45°. Lower your hips straight down until thighs are parallel to the ground, keeping your chest up and knees tracking over toes. Drive through your heels to stand. 'Sumo SQ w bounce' means adding a small pulse at the bottom before standing. Great for targeting the inner thighs." },
  "chest press": { name: "DB Chest Press", aka: "Dumbbell Bench Press, DB Flys, Dumbbell Flys, Bench Press", muscles: "Chest, Shoulders, Triceps", desc: "Lie on your back on a bench (or the ground). Hold a dumbbell in each hand at chest level, palms facing forward. Press the weights straight up until arms are extended, then lower with control. For flys: start with arms extended above chest, palms facing each other. Lower the weights out to the sides in a wide arc (slight bend in elbows), then squeeze them back together. Flys isolate the chest more than presses." },
  "arm circles": { name: "Arm Circles / Arm Swings", aka: "Arm Swings, Shoulder Circles", muscles: "Shoulders, Rotator Cuff, Upper Back (warm-up)", desc: "Stand with arms extended out to the sides. Make small circles, gradually increasing to larger circles. Forward for the prescribed reps, then reverse direction. Arm swings: swing both arms forward and back in large arcs, or cross them in front of your body alternately. A dynamic warm-up movement to loosen the shoulder joint and increase blood flow." },
  "leg swings": { name: "Leg Swings", aka: "Leg Swing, Hip Swings", muscles: "Hip Flexors, Hamstrings, Glutes (warm-up)", desc: "Stand on one leg (hold a wall or rail for balance). Swing the other leg forward and back in a controlled arc, gradually increasing range. Do prescribed reps then switch legs. Can also be done side-to-side (lateral leg swings) for the inner/outer thighs. A dynamic warm-up essential for hip mobility before squats, lunges and running." },
  "bumkicks": { name: "Bum Kicks", aka: "Butt Kicks, Heel Kicks", muscles: "Hamstrings, Hip Flexors, Calves, Cardio", desc: "Jog or walk forward while kicking your heels up toward your glutes with each stride. Keep your knees pointing straight down, not out to the sides. Arms drive naturally as in running. The goal is to get your heel to touch your backside. Great dynamic warm-up for hamstrings and running mechanics. Typically done for a set distance — 15–20 metres per length." },
  "carioca": { name: "Carioca", aka: "Carioca Run, Grapevine", muscles: "Hip Mobility, Coordination, Lateral Movement, Calves, Cardio", desc: "Move laterally — step one foot in front of the other, then behind, alternating in a cross-step pattern. Lead with your hips and let your shoulders stay square. Swing your arms to help maintain rhythm. This is a classic agility and coordination drill used in warm-ups. Do it in both directions (left-lead and right-lead) for the prescribed distance or time." },
  "ankle touches": { name: "Ankle Touches", aka: "Ankle Taps, Side Crunches", muscles: "Obliques, Core", desc: "Lie on your back with knees bent, feet flat on the floor. Raise your head and shoulders off the ground. Reach one hand down toward the same-side ankle, then the other hand to the other ankle, alternating sides in a rocking lateral motion. Keep your lower back pressed to the floor throughout. Targets the obliques through a side-to-side crunch motion — different from bicycle crunches." },
  "high knees": { name: "High Knees", aka: "High-Knees", muscles: "Hip Flexors, Quads, Calves, Core, Cardio", desc: "Run on the spot, driving each knee up as high as possible — aim for hip height or above — with each stride. Stay on the balls of your feet and pump your arms to maintain rhythm. Move as fast as you can while keeping the knee drive high. This is stationary — you do not travel forward. A great cardio exercise and dynamic hip flexor warmup. Very different from running laps." },
  "bent-over row": { name: "Bent-Over Row", aka: "Bentover Row, DB Bent-Over Row, KB Bent-Over Row, Bent Over Row", muscles: "Upper Back, Lats, Rear Deltoids, Biceps", desc: "Hinge at your hips with a flat, neutral back until your torso is roughly parallel to the ground. Hold a kettlebell or dumbbell hanging at arm's length below your chest. Drive your elbow back and pull the weight up toward your chest, squeezing your shoulder blade at the top. Lower with control. Keep your core braced and back flat throughout — never round the lower back. Very different from Pull-Up Rows: you are bent over pulling the weight upward from below, not hanging under a bar." },
  "cross body mountain climbers": { name: "Cross Body Mountain Climbers", aka: "Cross-Body Mountain Climbers, Spiderman Mountain Climbers", muscles: "Obliques, Core, Hip Flexors, Shoulders", desc: "Start in a push-up (plank) position. Drive one knee across your body diagonally toward the opposite armpit — not straight forward as in a standard mountain climber. Quickly switch legs. The cross-body path targets the obliques and rotational core far more than the standard version. Keep your hips level, core tight, and move at speed." },
  "knee drive lunge": { name: "Knee Drive Lunge", aka: "Lunge to Knee Drive, Lunge with Knee Raise", muscles: "Quads, Glutes, Hip Flexors, Balance", desc: "Step forward into a lunge, lowering your back knee toward the ground. As you drive back up to standing, rather than placing the trailing foot down, drive that knee up high in front of you in one fluid motion — like a running high-knee at the top. Hold briefly on one leg, then step into the next lunge. Combines lower body strength with balance and dynamic hip flexor engagement." },
  "shoulder press push-up": { name: "Shoulder Press Push-Up", aka: "Pike Push-Up, Pike Press, Shoulder Push-Up", muscles: "Shoulders, Triceps, Upper Chest", desc: "Start in a downward dog position — hips high, body forming an inverted V shape, hands shoulder-width apart on the ground. Bend your elbows and lower the top of your head toward the floor between your hands. Press back up to the inverted V. The angled position shifts the load from the chest (standard push-up) heavily onto the shoulders. The closer your feet are to your hands, the more vertical and harder the press." },
  "shoulder tap push-up": { name: "Shoulder Tap Push-Up", aka: "Shoulder-Tap Push-Up, Push-Up with Shoulder Tap", muscles: "Chest, Triceps, Shoulders, Core, Stability", desc: "Perform a standard push-up. At the top of each rep, lift one hand and tap the opposite shoulder, then tap the other shoulder with the other hand — holding your balance on one arm at a time before each tap. Resist rotating your hips — that core anti-rotation is the challenge. Then perform the next push-up. Each full rep has one push-up plus two shoulder taps." },
  "jump squats": { name: "Jump Squats", aka: "Squat Jumps, Plyometric Squats", muscles: "Quads, Glutes, Hamstrings, Calves, Explosiveness", desc: "Stand with feet shoulder-width apart. Squat down to at least parallel, keeping chest up and knees tracking over toes. From the bottom of the squat, drive explosively through your heels and jump as high as possible. Land softly with bent knees, absorbing the impact, and immediately lower back into the squat. Do not pause between reps. Different from tuck jumps — you drive up from a full squat, not a standing position." },
  "sit-up overhead reach": { name: "Sit-Up with Overhead Reach", aka: "Overhead Reach Sit-Up, Reaching Sit-Up", muscles: "Abs, Hip Flexors, Shoulders", desc: "Lie on your back, knees bent, feet flat. Extend your arms straight overhead. Curl your torso up into a full sit-up, reaching both arms as high as possible directly overhead at the top of the movement. Lower back down with arms extended. The overhead reach adds extra core demand and slight shoulder engagement compared to a standard sit-up." },
  "forearm raise": { name: "Forearm Raise", aka: "KB Front Raise, Kettlebell Front Raise, KB Raise", muscles: "Front Deltoids, Core, Grip", desc: "Stand holding a kettlebell at arm's length in front of your thighs, arms straight. Slowly raise the KB upward and forward until your arms are horizontal — parallel to the ground. Lower back down with control. Similar to a KB swing in the arm path, but completely controlled with no hip drive or momentum. Targets the front of the shoulder. Keep your core braced and avoid shrugging or leaning back." },
  "lunge curls": { name: "Lunge Curls", aka: "Lunge to Curl, DB Lunge Curl", muscles: "Quads, Glutes, Hamstrings, Biceps", desc: "Hold a dumbbell in each hand at your sides. Step forward into a lunge, lowering your back knee toward the ground. At the bottom of the lunge, perform a bicep curl — raise both dumbbells to your shoulders. Lower the weights, stand back up, then step forward on the other leg and curl again at the bottom. Alternate legs with each rep. A compound movement combining a unilateral leg exercise with a bicep isolation." },
  "frog jumps": { name: "Frog Jumps", aka: "Frog Leaps", muscles: "Glutes, Quads, Hamstrings, Calves, Cardio", desc: "Stand with feet wider than shoulder-width, toes turned slightly out. Lower into a deep squat and touch the ground with your hands. Explosively jump forward and upward, landing in the same wide squat position with hands touching the ground. Immediately jump again. The deep squat start and forward propulsion mimic a frog leap. Land softly with bent knees. Done for a set distance or rep count." },
  "pogo jumps": { name: "Pogo Jumps", aka: "Pogo Hops, Ankle Hops", muscles: "Calves, Achilles Tendon, Ankle Stability, Cardio", desc: "Stand tall and jump rapidly up and down on the spot using primarily your ankles and calves — keep your knees as straight as possible. Bounce on the balls of your feet like a pogo stick, storing and releasing elastic energy in the Achilles tendon rather than squatting and driving. Fast, repetitive, and rhythmical. Excellent for calf conditioning and reactive leg strength. Keep your core braced and movement light and quick." },
  "lateral hops": { name: "Lateral Hops", aka: "Side Hops, Lateral Jumps, Lateral Hops over DB", muscles: "Calves, Glutes, Lateral Hip Stabilisers, Cardio", desc: "Jump side to side over a line, cone, or dumbbell flat on the floor. Land on both feet with slightly bent knees, absorbing the impact. Immediately hop back to the other side. Keep the hops quick and controlled — it is a fast lateral bounce, not a wide jump. Works the lateral hip stabilisers and ankle. When done 'over a dumbbell', place the DB on the ground and jump side to side over it." },
  "wall sit": { name: "Wall Sit", aka: "Wall Squat, Isometric Squat", muscles: "Quads, Glutes, Hamstrings, Core (isometric)", desc: "Stand with your back flat against a wall. Slide down until your thighs are parallel to the floor and knees are at 90°. Your back stays flat against the wall, feet shoulder-width apart, directly below your knees. Hold the position for the prescribed time without moving. Pure isometric quad and glute endurance — no movement, sustained muscle tension. Brutal on the quads. Scale by going less than 90° if needed." },
  "lateral raise": { name: "Lateral Raise", aka: "DB Lateral Raise, Dumbbell Lateral Raise, Side Raise", muscles: "Lateral Deltoids, Traps", desc: "Hold a dumbbell in each hand at your sides, palms facing in, slight bend in elbows. Raise both arms out to the sides until they reach shoulder height, forming a T shape. Lower back down with control — do not let the weights drop. Keep your torso still and avoid swinging. Targets the middle deltoid (side of the shoulder), responsible for shoulder width. Use a light weight — this is an isolation movement, not a strength exercise." },
  "superman": { name: "Superman", aka: "Supermans, Back Extension, Prone Back Extension", muscles: "Lower Back, Glutes, Hamstrings, Rear Deltoids", desc: "Lie face down on the floor with arms extended straight overhead (like Superman flying). Simultaneously lift your arms, chest, and legs off the floor as high as you can, squeezing your glutes and lower back at the top. Hold briefly, then lower back down with control. Do not use momentum — it is a slow, controlled lift. Excellent for posterior chain strength and lower back stability." },
  "side bend": { name: "Side Bend", aka: "DB Side Bend, Dumbbell Side Bend, Lateral Bend", muscles: "Obliques, Core", desc: "Stand with feet shoulder-width apart, holding a dumbbell or kettlebell in one hand at your side. Keeping your torso in the same plane (do not rotate), bend sideways toward the weight, sliding it down your leg. Return to upright by contracting the opposite oblique. Complete all reps on one side, then switch. A lateral flexion movement that isolates the obliques." },
};

// ═══════════════════════════════════════════════════════════════
// WORKOUT DATA (203 workouts from Excel files)
// ═══════════════════════════════════════════════════════════════
const RAW_DATA = [{"id":1,"rating":"Medium","duration":45,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Upper Body","movements":["high pulls","hollow holds","inchworms","kb swings","planks","rows","running","squats"],"wm":["high pulls","kb swings","rows","running","squats"],"warmup":"2 laps - 10 inch worms, 10 squats in between","workout":"25 Min Amrap: 20 KB swings, 15 goblet squats, 12 pull up rows, 10 high pulls, 100M run","core":"3 times - 30 sec plank, 30 sec side plank, 30 sec other side, 30 sec hollow hold - 30 sec rest"},{"id":2,"rating":"Hard","duration":45,"equipment":"DUMBBELL","format":"AMRAP","focus":"Upper Body","movements":["burpees","crunches","curls","glute bridges","hip-ups","inchworms","lunges","planks","rows","running","skipping","squats","triceps"],"wm":["burpees","curls","inchworms","lunges","planks","skipping","squats","triceps"],"warmup":"2 laps v 10 pull-up rows, 10 SQ","workout":"15 min AMRAP - 12 DB SQ, 16 DB Curls, 16 plank taps, 50 skips\n15 min AMRAP - 12 DB lunges, 16 DB skull crushers, 5 inch worms, 5 burpees","core":"3 rounds - 10 Glute Bridges, 15 Hip-ups L+R, 30 Cycle Crunches"},{"id":3,"rating":"Medium","duration":42,"equipment":"DUMBBELL","format":"AMRAP","focus":"Upper Body","movements":["box jumps","burpees","crunches","curls","lunges","push-ups","rows","running","shoulder press","squats"],"wm":["box jumps","burpees","curls","lunges","push-ups","running","shoulder press","squats"],"warmup":"2 Lap warm up v 12 pullup rows","workout":"5 rounds 12 DB SQ, 12 DB Curls, 8 Shoulder Press\n20 Min AMRAP - 25 SQ, 20 Rev Lunges, 15 box jumps, 10 push-up, 5 burpees, 100M run","core":"10 Rev Cruch, 20 Crunch *3"},{"id":4,"rating":"Medium","duration":40,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Full Body","movements":["hollow holds","kb swings","planks","rows","running","squats"],"wm":["kb swings","rows","running","squats"],"warmup":"2 Laps w 10 rows & 10 Squats","workout":"25 Min AMRAP, 20KB swings, 15 Goblet Sq, 12 pull-up rows, 10 high-pulls, 100m","core":"3 rounds of 30 Sec Plank, 30s L side plank, 30s R side plank, 30s hollowhold, 30s Rest"},{"id":5,"rating":"Hard","duration":51,"equipment":"KB+DB","format":"AMRAP","focus":"Upper Body","movements":["curls","dead hangs","inchworms","planks","push-ups","running","shoulder press","sit-ups","skipping","squats","triceps"],"wm":["curls","dead hangs","push-ups","running","shoulder press","skipping","squats","triceps"],"warmup":"20SQ, 10 Push-up, 5 inch worm","workout":"6 * 400M w 30s Deadhang\n18 min AMRAP - 40 skips, 20 Goblet Sq, 18 Hammer curls, 15 push up, 12 skull crusher, 8 strict press","core":"2m Plank, 30 situps, 1m plank"},{"id":6,"rating":"Very Hard","duration":55,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Upper Body","movements":["box jumps","burpees","flutter kicks","jumping jacks","leg raises","lunges","mountain climbers","push-ups","rows","running","russian twists","squats"],"wm":["box jumps","burpees","flutter kicks","lunges","push-ups","rows","running","squats"],"warmup":"50 Jumping Jacks; 100 high knees; 20 Mountain climbers","workout":"1 Lap - 30 s rest, 2 laps - 1m rest, 1 lap - 30s, 2 lap - 1m, 1 lap\n3 rounds - 20 pull-up rows; 20 Sq w knee to elbow; 20 box jumps; 30 walking lunges; 20 push-up; 30 flutter kicks; 20 burpees","core":"1 min leg raise; 30 russian twist - 2 rounds"},{"id":7,"rating":"Medium","duration":40,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Upper Body","movements":["box jumps","crunches","inchworms","kb swings","planks","push-ups","rows","running","russian twists","skipping","squats"],"wm":["box jumps","kb swings","push-ups","rows","running","skipping"],"warmup":"2 Laps w 5 SQ, 5 Push-up, 5 inch worms","workout":"25 Min AMRAP: 60 skips, 20KB swings, 12 pull-up rows, 10 push up,  5 double box jump,100m","core":"3 rounds of 30 Sec Plank, 30s cycle crunch, 30s russian twist, 30s Rest"},{"id":8,"rating":"Hard","duration":41,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Upper Body","movements":["burpees","dips","high pulls","kb swings","mountain climbers","planks","push-ups","running","skaters","squats","triceps"],"wm":["burpees","dips","high pulls","kb swings","mountain climbers","push-ups","running","skaters","triceps"],"warmup":"10 SQ knee-elbow, 10 push-up on knees, 100M slow jog - 2 rounds","workout":"4 Laps + 15 Rows, 15 Dips\n20 min AMRAP - 10 Burpees, 10 KB Skull Crushers, 10 Push-up, 10 Bent over (ea arm), 10 Skaters, 10 KB High Pull, 10 Mountain Climber, 10 KB swings","core":"3 *1 min plank, 30s rest"},{"id":9,"rating":"Medium","duration":40,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Upper Body + Power","movements":["bear crawls","crunches","inchworms","kb halos","kb swings","mountain climbers","planks","push-ups","rows","running","squats","thrusters"],"wm":["bear crawls","kb halos","kb swings","push-ups","rows","running","thrusters"],"warmup":"2 Lap w 15 SQ & 3 Inch worms","workout":"6 Sets\n20 Kettle Bell Swings\n16 Kettle Bell Thruster (8 each side)\n12 Pull-up rows\n10 KB Halos\n8 Tri-cep Push up\n90M Run to 10 M Bear Crawl","core":"30s each Pair - Plankup, 2 punch crunch, mountain climbers, cycle crunches, plank toe touches, ankle touches"},{"id":10,"rating":"Very Hard","duration":47,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Upper Body","movements":["box jumps","burpees","flutter kicks","lunges","planks","push-ups","rows","running","sit-ups","squats"],"wm":["box jumps","burpees","flutter kicks","lunges","push-ups","rows","running","sit-ups","squats"],"warmup":"Stretch, 15M - High knee, Jog, Open Gate, Jog, Close Gate, Jog, Bum-kicks, Jog","workout":"1 Lap - 10 situps, 2 laps - 20 situps, 1 Lap - 10 situps, 2 laps - 20 situps, 1 Lap - 10 situps\n3 rounds: 20 Pull-up rows, 30 Sq w knee to elbow, 20 box jumps, 30 walking lunges, 20 push-up, 30 flutter kicks, 20 burpees","core":"2m plank - 30s rest, 1.5m plank - 30s rest, 1m plank - 30s rest"},{"id":11,"rating":"Medium","duration":51,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Upper Body","movements":["rows","running","shoulder press","shrugs","sit-ups","squats"],"wm":["rows","running","shoulder press","shrugs","squats"],"warmup":"20M bumkicks, jog back, 20M side-side & back, 20M Open Gate/Close Gate, 20M High Knee","workout":"5 Laps w 4 one arm snach ea side\n5 Rounds: 12 DB Squats, 12 DB press, 12 DB flys, 8 DB rows, 8 DB shrugs, 100M run","core":"100 Situps"},{"id":12,"rating":"Hard","duration":35,"equipment":"KETTLEBELL","format":"MIXED","focus":"Full Body","movements":["box jumps","burpees","cleans","deadlifts","high pulls","jumping","kb swings","lunges","push-ups","rows","running","squats"],"wm":["box jumps","burpees","cleans","deadlifts","high pulls","jumping","kb swings","lunges","push-ups","rows","running","squats"],"warmup":"","workout":"12 Days of Xmas workout\n1. 100M or 40s High Knees\n2. KB Clean & Press (2 ea side)\n3. Tuck Jumps\n4. Pull-up Rows\n5. Burpees\n6. KB Swings\n7. Push-Ups\n8. Box Jumps\n9. Goblet SQ\n10. 1 leg Romanian Deadlift (10 ea Leg)\n11. KB High Pulls\n12. Jump Lunges","core":""},{"id":13,"rating":"Hard","duration":50,"equipment":"KETTLEBELL","format":"LADDER","focus":"Cardio","movements":["burpees","cleans","deadlifts","jumping jacks","kb swings","mountain climbers","running","russian twists","skipping","squats"],"wm":["burpees","cleans","deadlifts","kb swings","running","russian twists","skipping","squats"],"warmup":"Stretch, 15 SQ, 30 Jumping Jacks, 20 Mountain Climbers","workout":"1000M Run (3 laps), 50 Russian Twists\nDecending ladder 10,9,8,7 etc - KB Squat, Burpee w jump over KB, KB Swing, KB one leg dead lift, KB clean & press - 30 Sec skipping\n50 russian twists, 1000M run (3 laps)","core":""},{"id":14,"rating":"Easy","duration":32,"equipment":"KETTLEBELL","format":"MIXED","focus":"Full Body","movements":["bear crawls","burpees","dips","flutter kicks","glute bridges","kb swings","lunges","rows","running","sit-ups","squats"],"wm":["bear crawls","burpees","kb swings","lunges","sit-ups","squats"],"warmup":"2 Laps - 15 pullup rows and 10 Dips in between","workout":"50 Squats (half w KB), 8 Burpees\n40 Sit Ups, 8 Burpees\n30 Lunges, 8 Burpees\n20 KB Swings, 8 Burpees\n10 metre Bear Crawl * 2, 8 Burpees\n20 KB Swings, 8 Burpees\n30 Lunges, 8 Burpees\n40 Sit Ups, 8 Burpees\n50 Squats (half w KB), 8 Burpees","core":"10 Hip Bridges, 20 Flutter kicks *3"},{"id":15,"rating":"Medium","duration":43,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Full Body","movements":["burpees","crunches","dips","jumping jacks","leg raises","lunges","mountain climbers","planks","push-ups","running","sit-ups","squats"],"wm":["burpees","crunches","dips","jumping jacks","lunges","mountain climbers","planks","push-ups","running","squats"],"warmup":"2 Laps w 10 situp, 10 leg raises","workout":"4 laps - Fast short side, sow long side\n3 Rounds - 60 Sec Plank, 50 Jumping Jacks, 40 Mountain Climbers, 30 Prisoner Squats, 20 Tri-cep Dips, 10 Push-ups, 5 Burpees\n10 Jump Squats, 20 Lunges, 30 Bicycle Crunches, 40 Cross Body Mountain Climbers, 50 Pogo Jumps, 60 Sec Wall Sit","core":""},{"id":16,"rating":"Easy","duration":43,"equipment":"BODYWEIGHT","format":"AMRAP","focus":"Legs","movements":["box jumps","burpees","crunches","dips","flutter kicks","lunges","planks","push-ups","running","squats"],"wm":["box jumps","burpees","lunges","push-ups","running","squats"],"warmup":"2 Laps - 15 Rows, 10 Dips","workout":"30 min AMRAP - 30 Squats, 20 box jumps, 30m walking lunges, 20 hand rel push-up, 10 burpees, 100m run","core":"3 Rounds - 30s Plank, 30s Cycle Crunch, 30s Flutter kick, 30s Rest"},{"id":17,"rating":"Easy","duration":30,"equipment":"BODYWEIGHT","format":"MIXED","focus":"Full Body","movements":["box jumps","burpees","crunches","flutter kicks","inchworms","jumping","jumping jacks","lunges","mountain climbers","planks","push-ups","rows","running","sit-ups","skaters","squats","v-ups"],"wm":["box jumps","burpees","crunches","flutter kicks","jumping","jumping jacks","lunges","mountain climbers","planks","push-ups","rows","running","sit-ups","skaters","squats","v-ups"],"warmup":"2 lap warm up w 5 Inch worms, 5 push-up, 5 Squats","workout":"20 min Metabolic Workout (30s rest between exercise pairs)\n30s Sprint/High Knee, 30s Squats w knee lift\n30s Boxing, 30s triple pushup w mountain climber\n30s Box Jumps, 30s Pull-up Rows\n30s Body Extension, 30s cycle crunches\n30s Sprint/High Knee, 30s in and out squats\n30s Boxing, 30s Y Pushups\n30s Tuck jumps, 30s mountain climbers\n30s Versa runner, 30s reverse lunges\n30s Sprint/High Knee, 30s Jump Squat\n30s Boxing, 30s shoulder tap-push ups\n30s Skater Jumps, 30s Plank-ups\n30s Star jumps, 30s Burpees","core":"30s Plank Jacks, 30s crunches, 30s Flutter Kicks, 30s Sit-up – elbow to knee, 30s V-Up, 30s Ankle Touches"},{"id":18,"rating":"Hard","duration":41,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Legs + Power","movements":["box jumps","burpees","deadlifts","kb swings","planks","push-ups","running","skipping","squats","thrusters","v-ups"],"wm":["box jumps","burpees","deadlifts","kb swings","running","skipping","squats","thrusters"],"warmup":"2 Laps w 5 v-up, 5 push-up","workout":"4 Suicides - 5,10,20,30m - 30 sec rest\n20 min AMRAP - 10 Burpees, 10 one leg deadlift, 10 goblet sq, 10 box jump, 10 thruster, 10 KB swing, 60 skips","core":"3 rounds - 30s plank, 30s side-plank L, 30s side plank R"},{"id":19,"rating":"Very Hard","duration":45,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Legs","movements":["burpees","crunches","flutter kicks","jumping","kb swings","lunges","mountain climbers","planks","push-ups","running","sit-ups","squats","v-ups"],"wm":["burpees","jumping","kb swings","lunges","mountain climbers","push-ups","running","squats"],"warmup":"2 laps w 5 situp, 5 rows, 5 SQ","workout":"2 min box run - 1 min rest, 2.5 min box run - 1.5 min rest, 3 min box run 2 min rest\n20 min AMRAP - 10 Burpees, 10 KB lunges, 10 uneven pushup, 10 Goblet Sq, 10 Tuck jumps, 10 KB high-pull, 10 mountain climber, 10 KB swings","core":"30s ea exercise 30 rest.  Cycle crunch & plank toe touch, Flutter kicks & 2-punch crunch, V-Ups & ankle touches"},{"id":20,"rating":"Medium","duration":35,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Cardio","movements":["crunches","flutter kicks","jumping","jumping jacks","lunges","mountain climbers","running","sit-ups","squats"],"wm":["jumping","jumping jacks","lunges","mountain climbers","running","sit-ups","squats"],"warmup":"20M Highknees, walk back, 20M Bum kicks, walk back, 40M Karioka's, 40M Close Gate","workout":"4 Laps - Fast long side, slow short side\n4 Rounds of the following circuit: 30 Jumping Jacks, 20 Squats, 30 High Knees, 20 Sit Ups, 30 Tuck Jumps, 20 Reverse Lunges, 30 Mountain Climbers","core":"4 rounds - 30s Flutter kicks, 30s crunches, 30s rest"},{"id":21,"rating":"Hard","duration":40,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Upper Body + Power","movements":["burpees","high pulls","push-ups","rows","running","russian twists","sit-ups","skaters","snatches","squats","thrusters","triceps"],"wm":["burpees","high pulls","push-ups","rows","running","skaters","snatches","thrusters","triceps"],"warmup":"2 Laps w 5 SQ, 5 situp, 5 rows","workout":"4 Suicides - 5,10,20,30m - 30 sec rest\n20 min AMRAP - 10 Burpees, 10 KB Skull Crusher, 10 Push-up, 10 Bent over row, 10 Skaters, 10 Thrusters, 10 KB High Pull, 10 KB Snatches","core":"50 Russian Twist"},{"id":22,"rating":"Hard","duration":46,"equipment":"BODYWEIGHT","format":"AMRAP","focus":"Full Body","movements":["burpees","crunches","leg raises","planks","push-ups","rows","running","squats"],"wm":["burpees","planks","push-ups","running","squats"],"warmup":"2 laps w 10 pull up rows and 10 squats","workout":"AMRAP - 20 min\n40 Plank Jacks\n30 Bounce Squats\n20 Burpees\n10 Hand release pushups\nTHEN\n5 * 100M alternate runners and other holds a squat then other hold a plank in between","core":"3 rounds - 12 leg raises, 12 crunches, 12 rev crunches, 12 ankle taps"},{"id":23,"rating":"Hard","duration":55,"equipment":"BODYWEIGHT","format":"LADDER","focus":"Full Body","movements":["box jumps","burpees","crunches","dips","jumping jacks","lunges","mountain climbers","push-ups","running","sit-ups","skipping","squats","v-ups"],"wm":["box jumps","burpees","crunches","dips","jumping jacks","lunges","mountain climbers","push-ups","running","sit-ups","skipping","squats","v-ups"],"warmup":"15M High Knee - Jog back, 15M Bumkicks - jog back, 15m side-side & back, 15m backward & back","workout":"4 Laps - 10 sit-up, 10 v-up in between\nLadder - Down-Up-Down-Up\n60 skipping, 50 Jumping Jacks, 40 Mountain Climbers, 30 Prisoner Squats, 20 Tri-cep Dips, 10 Push-ups, 5 Burpees\n10 box jumps, 20 Lunges, 30 tick jumps, 40 Bicycle Crunch, 50 Highknee, 60 Skips","core":""},{"id":24,"rating":"Hard","duration":38,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Cardio","movements":["burpees","crunches","dips","jumping","kb swings","leg raises","mountain climbers","planks","push-ups","running","squats","v-ups"],"wm":["burpees","crunches","jumping","kb swings","leg raises","mountain climbers","planks","push-ups","running","squats","v-ups"],"warmup":"3 Lap Warm-up - 10 Pull-ups, 10 Dips","workout":"6 Sets\n20 Kettle Bell Swings\n15 Goblet Squats\n12 Push-ups\n8 Burpees\n4 Tuck Jumps\n100M Run\n\n30s each Pair -V-UP & crunches, Plank & mountain climbers, Leg raises & ankle touches","core":""},{"id":25,"rating":"Medium","duration":40,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Upper Body + Power","movements":["burpees","cleans","crunches","flutter kicks","kb halos","kb swings","mountain climbers","planks","push-ups","rows","running","skaters","step-ups","triceps","v-ups"],"wm":["burpees","cleans","kb halos","kb swings","mountain climbers","push-ups","rows","skaters","triceps"],"warmup":"2 laps w  20 step-ups","workout":"AMRAP - 25 min\n10 Burpees, 10 KB Skull Crushers, 10 Pushup, 10 KB Bent over Rows, 10 Skater jumps, 10 Clean and press, 10 Mountain Climbers (L+R), 10 KB Swings, 10 KB Halos","core":"30s per pair, 30s rest - Cycle crunches & Toe tap plank, Flutter kick & 2 punch crunch, V-Up & ankle taps"},{"id":26,"rating":"Medium","duration":39,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Legs","movements":["burpees","calves","jumping jacks","lunges","mountain climbers","planks","running","russian twists","sit-ups","squats","step-ups"],"wm":["burpees","calves","jumping jacks","lunges","mountain climbers","running","russian twists","sit-ups","squats"],"warmup":"2 laps w 10 Step ups, 10 rows","workout":"3 min box run - 1 min rest - 2 rounds\nThen 3 sets of 10 Jump Lunges, 10 Burpees, 10 Jump Squats. 3 sets of 20 Situps, 20 Mountain Climbers, 20 Calf Raises. 3 sets of 30 Russian Twists, 30 Jumping Jacks, 30 High Knees,","core":"2 min plank"},{"id":27,"rating":"Medium","duration":45,"equipment":"BODYWEIGHT","format":"LADDER","focus":"Cardio","movements":["burpees","jumping jacks","push-ups","running","sit-ups","squats"],"wm":["burpees","jumping jacks","push-ups","running","sit-ups","squats"],"warmup":"4 Laps - non-stop","workout":"Then HIIT Ladder - 3 rounds\n50 Jumping Jacks - 100M Tempo Run (70-80%) 100M Recovery Run (Slow Jog)\n40 Diamond Sit-ups - 100M Tempo Run (70-80%) 100M Recovery Run (Slow Jog)\n30 Prisoner Squat - 100M Tempo Run (70-80%) 100M Recovery Run (Slow Jog)\n20 Push Ups - 100M Tempo Run (70-80%) 100M Recovery Run (Slow Jog)\n10 Burpees - 100M Tempo Run (70-80%) 100M Recovery Run (Slow Jog)","core":""},{"id":28,"rating":"Medium","duration":35,"equipment":"BODYWEIGHT","format":"MIXED","focus":"Full Body","movements":["bear crawls","burpees","dips","lunges","push-ups","rows","running","sit-ups","squats"],"wm":["bear crawls","burpees","dips","lunges","push-ups","rows","running","sit-ups","squats"],"warmup":"10 Push up, 30m, 10 SQ, 30M *3","workout":"6 laps - fast short side, slow long side w 10 pushup and 10 dips in between\n50 Squats (jump last 10), 5 Burpees, 40 Sit Ups, 5 Burpees, 30 Lunges (jump last 5), 5 Burpees, 20 Pull-up rows, 5 Burpees, 10 metre Bear Crawl * 2, 5 Burpees, 20 Pull-up rows, 5 Burpees, 30 Lunges (jump last 5), 5 Burpees, 40 Sit Ups, 5 Burpees, 50 Squats (jump last 5)","core":""},{"id":29,"rating":"Hard","duration":55,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Upper Body","movements":["burpees","crunches","hollow holds","kb swings","lunges","planks","push-ups","rows","running","sit-ups","squats"],"wm":["burpees","kb swings","push-ups","rows","running","sit-ups","squats"],"warmup":"10 Lizard Lunge, 30M jog, 10 SQ, 30M Jog *3","workout":"2 rounds + 1 w Half reps \n200M, 20 handrelease push-up, 200M, 20 KB swings, 200M, 20 situps, 200M, 20 Bent over row, 200M, 20 Goblet Sq + overhead press, 200M, 20 burpees","core":"40 sec on 20 off - 2 rounds - Plank, Crunches, hollow hold"},{"id":30,"rating":"Medium","duration":50,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Cardio","movements":["box jumps","crunches","lunges","mountain climbers","planks","push-ups","running","russian twists","skipping"],"wm":["box jumps","mountain climbers","push-ups","running","russian twists","skipping"],"warmup":"2 rounds - cross field run, 10 push-ups, cross field side-side-backwards - 10 lizard lunge","workout":"400M - 30s rest, 800M - 1m rest, 400M - 30s rest, 800M - 1m rest, 400M - 30s rest\n4 rounds - 40s on 20s rest\nSkipping, 4 Push-up + 4 mountain climber, Box Jump, Chin-up Row, Inch-worm, Russian Twist","core":"1m Plank, 30s Rest, 15 Rev Crunch, 30s Rest, 1m Plank"},{"id":31,"rating":"Easy","duration":35,"equipment":"BODYWEIGHT","format":"MIXED","focus":"Full Body","movements":["burpees","crunches","dips","jumping jacks","lunges","mountain climbers","planks","push-ups","rows","running","skaters","skipping","squats","v-ups"],"wm":["burpees","crunches","dips","jumping jacks","lunges","mountain climbers","planks","push-ups","rows","running","skaters","skipping","squats","v-ups"],"warmup":"4 Laps","workout":"30s rest between exercise pairs\n30s Skipping, 30s in and out squats\n30s Boxing, 30s triple pushup w mountain climber\n30s High-Knee, 30s Pull-up Rows\n30s Body Extension, 30s SQ w Knee lift\n30s Versa runner, 30s Y-Push-up\n30s Boxing, 30s Tri-cep dips\n30s Skater Jumps, 30s mountain climbers\n30s Sprint/High Knee, 30s Sumo Squat w bounce\n30s Kick-Boxing, 30s Hand-Rel Pushup\n30s Seal Jumps, 30s Burpees\n30s Kick boxing, 30s V-Ups\n30s High-Knee, 30s Rev Lunge\n30s Plank Up, 30s cycle crunches,\n30s 2-Punch Crunch, 30s Plank Toe Touch, \n30s Mountain climber, 30s Ankle Touches\nFinish - 2 lap warm down","core":""},{"id":32,"rating":"Easy","duration":30,"equipment":"BODYWEIGHT","format":"MIXED","focus":"Legs","movements":["box jumps","burpees","crunches","lunges","mountain climbers","push-ups","running","squats"],"wm":["box jumps","burpees","crunches","lunges","mountain climbers","push-ups","running","squats"],"warmup":"3 Laps","workout":"50 Squats, 8 Burpees\n40 Mountain Climbers, 8 Burpees\n30 Reverse Lunges, 8 Burpees\n20 Push-Ups, 8 Burpees\n10 Box Jumps, 8 Burpees\n20 Push-Ups, 8 Burpees\n30 Front Lunges, 8 Burpees\n40 Crunches, 8 Burpees\n50 Sumo Squats, 2 lap warm down","core":""},{"id":33,"rating":"Easy","duration":36,"equipment":"BODYWEIGHT","format":"MIXED","focus":"Full Body","movements":["burpees","crunches","dips","inchworms","jumping","lunges","planks","push-ups","rows","running","russian twists","sit-ups","skaters","skipping","squats","triceps","v-ups"],"wm":["burpees","crunches","dips","jumping","lunges","planks","push-ups","rows","running","russian twists","sit-ups","skaters","skipping","squats","triceps","v-ups"],"warmup":"2 Laps w 5 inch worms","workout":"4 half-laps - 25M Walk, 25M Jog, 50M Fast\n30 Sec per exercise - 30 Sec Rest - High Knee & SQ Knee/Elbow, Boxing & 2 Push-Up 4 Mountain Cl, Skipping & Pull-up Rows, Burpees & Jump Lunges, High Knee & In & Out SQ, Boxing & Shoulder Tap Push-Up, Skipping & Tricep Dip, Burpees & Skater Jump,High Knee & Sumo SQ w Bounce, Boxing & Push-Up w Arm Raise, Skipping & Superman, Burpees & Tuck Jump, Plank-up & Cycle Crunch, V-Up & 2 Punch-Crunch, Russian Twist & Ankle Touch, Flutterkick & Situp","core":""},{"id":34,"rating":"Easy","duration":43,"equipment":"DUMBBELL","format":"AMRAP","focus":"Legs","movements":["burpees","crunches","glute bridges","hip-ups","inchworms","planks","running","skipping","squats"],"wm":["burpees","glute bridges","inchworms","planks","skipping","squats"],"warmup":"2 Laps w 10 squats, 5 inch worms","workout":"15 min AMRAP - 12 Dumbbell Squats, 16 alternating bench presses, 12 plank taps, 50 skips\n15 min AMRAP - 12 Glute Bridges, 16 Dumbbell Rows, 5 Inch worms, 5 burpees","core":"2 rounds - 15 Hip-ups each side, 30 bicycle crunches"},{"id":35,"rating":"Medium","duration":49,"equipment":"DUMBBELL","format":"AMRAP","focus":"Full Body","movements":["crunches","curls","flutter kicks","lunges","push-ups","rows","running","russian twists","skipping","squats","step-ups","thrusters"],"wm":["crunches","curls","lunges","push-ups","rows","running","skipping","squats","thrusters"],"warmup":"2 laps 10 SQ, 10 stepups","workout":"3 rounds (1 min per exercise) - 15 Weighted Squats, 20 Hammer curls, 10 Thrusters, 10 DB lunge w twists\n20 min AMRAP: 6 pull-up rows, 10 push-up, 12 DB Ab Crunch, 30 Skips, 100M run","core":"2 rounds of 30 Russian Twist, 30 Flutter Kicks"},{"id":36,"rating":"Easy","duration":32,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Full Body","movements":["burpees","crunches","dips","lunges","mountain climbers","push-ups","rows","running","russian twists","shoulder press","shrugs","sit-ups","skipping","squats","triceps"],"wm":["burpees","crunches","dips","lunges","mountain climbers","push-ups","rows","running","russian twists","shoulder press","shrugs","skipping","squats","triceps"],"warmup":"20M bumkicks, jog back, 20M carioca & jog back, 20M Open Gate/Close Gate, 20M High Knee","workout":"400M, 20SQ, 800M, 20 Push-up, 400M, 20 Lunges, 800M, 20 Pull-up Rows\n30 Sec per exercise - 30 Sec Rest\nSkipping & Tricep dips, Burpees & Mountain Climbers, Skipping & Russian Twists, Burpees & Shoulder Press-up, Skipping & Cycle Crunch, Skipping & Shoulder Tap Push Up\n5 Rounds: 12 DB Squats, 12 DB press, 12 DB flys, 8 DB rows, 8 DB shrugs, 100M run","core":"100 Situps"},{"id":37,"rating":"Medium","duration":43,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Legs","movements":["broad jumps","burpees","crunches","flutter kicks","lunges","push-ups","running","sit-ups","skaters","squats"],"wm":["broad jumps","burpees","flutter kicks","lunges","push-ups","running","sit-ups","skaters","squats"],"warmup":"2 Laps non-stop","workout":"3 sets - 10 combo 2 jump squats + burpee; 20 flutter kicks; 10 shoulder-tap push ups\n3 sets - 10 knee drive lunges; 10 supermans; 10 combo 2 frog jumps + 5 mtn climbers\n3 sets - 10 combo 2 long jumps + 5 high knees; 10 sit-up with overhead reach; 20 skater jumps","core":"2 rounds - 30 situps, 15 reverse crunch"},{"id":38,"rating":"Medium","duration":47,"equipment":"DUMBBELL","format":"AMRAP","focus":"Upper Body","movements":["curls","hip-ups","inchworms","mountain climbers","push-ups","rows","running","russian twists","shoulder press","skipping","squats"],"wm":["curls","push-ups","rows","running","russian twists","shoulder press","skipping","squats"],"warmup":"2 Laps w 5 inch worm, 10 Rows","workout":"3 Rounds - 1 min rest bet rounds\n20 DB SQ, 15 Shoulder Press, 20 Hammer Curls, 20 Upright Rows\nThen 20 min AMRAP - 6 Pull-up rows, 10 Push-up, 15 russian twist, 30 Skipping, 100M","core":"10 hip-ups, 30 Mountain climbers *2"},{"id":39,"rating":"Hard","duration":43,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Upper Body","movements":["crunches","high pulls","kb swings","planks","push-ups","rows","running","russian twists","shoulder press"],"wm":["high pulls","kb swings","push-ups","rows","running","shoulder press"],"warmup":"2 Laps, 10 Rows, 10 Push-ups","workout":"4 sets\n10 KB highpull, 10 skullcrusher, 1 lap\n10 Bent over row (L&R), 10 Push-ups, Half-Lap\n10 Push-press (L+R), 10 Forearm raise, 10 KB Swings, 100M","core":"30s each,30s Rest\nRussian Twist & 2 Punch Crunch, Cycle Crunch & Plank-ups, Flutterkicks & Ankle touches"},{"id":40,"rating":"Easy","duration":38,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Full Body","movements":["box jumps","hollow holds","planks","push-ups","rows","running","skipping","squats"],"wm":["box jumps","rows","running","skipping","squats"],"warmup":"3 round - 30M jog, 10SQ, 30M, 10 Pushup","workout":"15 Pull-up Rows, 20 Box Jumps, 20 SQ, 50 Skips - 1 lap. Repeat then 2 laps, Rpeat then 3 laps","core":"3 * 1 min plank, 30s Hollowhold, 30s rest"},{"id":41,"rating":"Hard","duration":44,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Upper Body","movements":["box jumps","burpees","flutter kicks","lunges","push-ups","rows","running","sit-ups","squats"],"wm":["box jumps","burpees","flutter kicks","lunges","push-ups","rows","squats"],"warmup":"3 laps non-stop","workout":"3 Sets - 20 Pull-Up Rows, 30 SQ w Knee Lift, 20 Box Jumps, 30 Walking Lunges, 20 Push-ups, 30 Flutter Kicks, 20 Burpees\nThen push-up to fail","core":"50 situps"},{"id":42,"rating":"Hard","duration":42,"equipment":"BODYWEIGHT","format":"MIXED","focus":"Upper Body","movements":["burpees","crunches","dips","inchworms","lunges","mountain climbers","planks","push-ups","rows","running","russian twists","skipping","squats"],"wm":["burpees","crunches","dips","lunges","mountain climbers","planks","push-ups","rows","running","russian twists","skipping","squats"],"warmup":"3 * 100m w 5 pushups, 5 inch worms, 5 squats","workout":"400M - 20 Jump SQ, 800M - 20 Tempo Push-up, 400M - 20 Jump lunge, 800M - 20 pull-up rows\nThen: 1 round - 40s on 20s off\nSkiiping, Dips\nBurpees, Mountain Climbers\nSkipping, Russian Twists\nBurpees, Shoulder-press pushup\nSkipping, Cycle Crunch\nBurpees, Shoulder-tap push up\nPlank, Plank","core":""},{"id":43,"rating":"Hard","duration":56,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Upper Body","movements":["crunches","curls","jumping jacks","push-ups","running","skipping","thrusters","v-ups"],"wm":["curls","push-ups","running","skipping","thrusters","v-ups"],"warmup":"50 Star Jumps, 50 High-Knees *2","workout":"6 * 400m w 10 v-ups\n5 rounds - 60 skips, 16 DB Curls, 10 push-ups, 5 Lateral raise, 15 Tri-cep skullcrushers, 8 Thrusters","core":"10 leg-raises, 20 crunches * 3"},{"id":44,"rating":"Medium","duration":45,"equipment":"DUMBBELL","format":"MIXED","focus":"Full Body","movements":["box jumps","burpees","curls","deadlifts","flutter kicks","inchworms","jumping","jumping jacks","lunges","mountain climbers","plank to down dog","planks","push-ups","running","sit-ups","snatches","squats","thrusters"],"wm":["box jumps","burpees","curls","deadlifts","flutter kicks","inchworms","jumping","jumping jacks","lunges","mountain climbers","plank to down dog","planks","push-ups","running","sit-ups","snatches","squats","thrusters"],"warmup":"2 Laps - 10 Squat, 5 push-up, 5 inchworm in between","workout":"two rounds per circuit - 1 min rest in between circuits. 40s work 20s rest per exercise\n1) 3 DB squat then 3s squat hold, DB snatches L/R, 2 single leg pylo lunge L/R then 8-10 high knees, Double box jumps\n2) Downdog -> Bear -> Pushup, 1 back row - 1 tri-cep kickback, DB lunge, Curl, Press, Switch, Burpees\n3) Rear foot elevated Lunge -> Deadlift 2 right then 2 left, Plank w alternating leg lift, 6 mountain climber to thruster, Situps\n4) Lateral shuffle over DB, 180 squat jumps w ground touch, Flutter kicks over DB, 5 jumping jacks & 3 tuck jumps","core":""},{"id":45,"rating":"Hard","duration":44,"equipment":"DUMBBELL","format":"AMRAP","focus":"Upper Body","movements":["cleans","crunches","curls","lunges","mountain climbers","push-ups","rows","running","skipping","squats"],"wm":["cleans","crunches","curls","lunges","push-ups","rows","running","skipping","squats"],"warmup":"2 laps w 6 pylo lunges and 10 mountain climbers","workout":"4 rounds (1 min rest bet rounds)\n10 DB SQ w 2s pause at bottom\n16 Hammer Curls\n10 Clean & Press\n10 Bent Over Rows - ea arm\n\n20 Min AMRAP\n8 DB Lunge w L/R Twist\n10 Dog-Bear-Pushup\n12 DB AB Crunch\n50 Skips\n100M Run","core":""},{"id":46,"rating":"Medium","duration":43,"equipment":"BODYWEIGHT","format":"LADDER","focus":"Upper Body","movements":["box jumps","dips","push-ups","rows","running","sit-ups","squats","step-ups","v-ups"],"wm":["box jumps","push-ups","rows","running","squats","v-ups"],"warmup":"2 laps w 10 step-ups, 10 Dips","workout":"6 * 400M w 5 box jumps & 30s rest\nLadder - 21-18-15-12-9-6\nHand Rel Push-Up, V-Up, Sumo SQ w 2 count hold, Pull-up Rows","core":"50 situps"},{"id":47,"rating":"Hard","duration":41,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Full Body","movements":["burpees","high pulls","inchworms","jumping","jumping jacks","kb swings","lunges","mountain climbers","push-ups","running","sit-ups","snatches","squats","triceps"],"wm":["burpees","high pulls","jumping","jumping jacks","kb swings","lunges","mountain climbers","push-ups","running","sit-ups","snatches","squats","triceps"],"warmup":"2 laps w 5 inch worms & 5 good mornings","workout":"3 rounds - 30 jumping jacks, 20 Squats, 30 High knees, 20 situps, 30 tuck jumps, 20 reverse lunges, 30 mountain climbers\n20 Min AMRAP: 10 KB skull crusher, 10 burpees, 10 Push-up, 10 Goblet Sq, 10 KB high pulls, 10 KB swings, 10 KB snatches","core":""},{"id":48,"rating":"Hard","duration":37,"equipment":"KB+DB","format":"MIXED","focus":"Legs","movements":["broad jumps","burpees","cleans","crunches","curls","jumping","jumping jacks","lunges","mountain climbers","planks","rows","running","russian twists","skaters","squats"],"wm":["burpees","cleans","crunches","curls","jumping","jumping jacks","lunges","mountain climbers","planks","rows","running","russian twists","skaters","squats"],"warmup":"2 laps with 10 skaters, 5 long jumps","workout":"Two Rounds - 45s on 15s rest\nHammer Curls\nMountain Climbers\nGoblet Squats\nJumping Jacks\nReverse Lunges\nHigh Knees\nChest Press\nSkaters\nUpright Rows\nTuck Jumps\nClean and press\nBurpees\nRussian Twist\nPlank Jacks\nBicycles Crunches","core":""},{"id":49,"rating":"Hard","duration":44,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Upper Body","movements":["burpees","crunches","dead hangs","flutter kicks","kb swings","rows","running","squats","v-ups"],"wm":["burpees","dead hangs","kb swings","rows","running","squats"],"warmup":"25m jog, 25m walk * 3","workout":"6 * 400m w 30s Deadhang\n20 min AMRAP - 20 Goblet SQ, 15 KB swings, 10 Pull-up rows, 5 burpees","core":"30 Flutter kick, 10 V-Ups, 30 Cycle Crunch *2"},{"id":50,"rating":"Hard","duration":40,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Cardio","movements":["broad jumps","burpees","flutter kicks","hip-ups","jumping","planks","push-ups","running","sit-ups","squats"],"wm":["broad jumps","burpees","jumping","planks","push-ups","running","squats"],"warmup":"2 Laps w 5 incline push-up","workout":"5 * 400M, 5 Tuck Jump, 5 Long Jumps, 30s rest\n4 Rounds - 40 Plank Jacks, 30 Sumo SQ, 20 Push-ups, 10 Burpees","core":"3 rounds - 10 situps, 10 Flutter kicks, 10 L side-hip-up,10 R side hip-up"},{"id":51,"rating":"Medium","duration":46,"equipment":"BODYWEIGHT","format":"AMRAP","focus":"Upper Body","movements":["burpees","dips","mountain climbers","push-ups","running","sit-ups","skipping","squats","step-ups"],"wm":["burpees","dips","mountain climbers","push-ups","running","skipping","squats"],"warmup":"2 laps w 5 step-ups, 5 Rows","workout":"100M - 70%, 100M Slow *5\n10 min AMRAP - 15 Sumo Sq, 15 Push-up\n10 min AMRAP - 10 Burpee, 30 Jump Rope\n10 min AMRAP - 10 Bench Dips, 30 Mountain Climbers","core":"50 situps"},{"id":52,"rating":"Medium","duration":48,"equipment":"KETTLEBELL","format":"LADDER","focus":"Full Body","movements":["cleans","crunches","deadlifts","hollow holds","kb swings","planks","rows","running","skipping","squats"],"wm":["cleans","deadlifts","kb swings","rows","running","skipping","squats"],"warmup":"2 Laps - 10 SQ, 5 inch-worm, 10 Rows","workout":"Ladder 16-6 (by 2's), KB SQ, KB Swing, KB Clean & Press, KB deadlift, KB rows, 60 skips, 100m run","core":"2 Rounds - 40s on 20s off Plank, Crunch, Hollowhold"},{"id":53,"rating":"Hard","duration":46,"equipment":"KETTLEBELL","format":"LADDER","focus":"Cardio","movements":["burpees","cleans","deadlifts","kb swings","planks","push-ups","running","skipping","squats"],"wm":["burpees","cleans","deadlifts","kb swings","running","skipping","squats"],"warmup":"2 Laps - 5 push-up, 5 rows","workout":"4 laps - fast short side, slow long side\nLadder - 12,10,8,6,4,2\nKB Squats, Burpees w jump over rope, Single-Deadlift, KB Swings, KB Clean & Press, 30 Skips","core":"1 min plank, 30s Flutter * 2"},{"id":54,"rating":"Hard","duration":45,"equipment":"DUMBBELL","format":"LADDER","focus":"Full Body","movements":["curls","lunges","planks","rows","running","squats"],"wm":["curls","lunges","rows","running","squats"],"warmup":"30M jog, 30M side-side, 30M bumkicks, 39M High knees, 30M Jog, 30M side-side","workout":"Ladder 24-20-16-12-8-4\nAlt DB front lunge, Bicep Curls, Squat Press, Skull Crucshers, Bent Over Row, Run a lap","core":"30s Plank, 30s Superman, 30s Shouldertap, 30s rest *3"},{"id":55,"rating":"Medium","duration":45,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Full Body","movements":["box jumps","kb swings","lunges","running","sit-ups","squats"],"wm":["box jumps","kb swings","running"],"warmup":"2 laps w 10SQ, 10 Lizard Lunge","workout":"4 rounds\n200M -> 20 box jumps, 200M -> 20KB swings, 200M ->20 Rows - 1min rest","core":"30 sit-ups, 30 flutterkicks * 2"},{"id":56,"rating":"Hard","duration":42,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Full Body","movements":["burpees","deadlifts","glute bridges","jumping","kb swings","mountain climbers","planks","push-ups","rows","running","squats","suitcase carry"],"wm":["burpees","deadlifts","glute bridges","jumping","kb swings","push-ups","rows","running","squats","suitcase carry"],"warmup":"4 halflaps - 1 side slow, 1 side faster","workout":"20min AMRAP - 20KB swing, 16 romanian deadlift (8 ea side), 12 push-ups, 8 burpees, 4 tuck jumps, 100M run\nTHEN\n4 rounds - 30s pull-up rows, 30m farmer carry, 30s Glute bridge, 30s Jump Sq","core":"2 rounds - 30s Superman, 30s Side-plank, 30s Mountain Climber, 30s Side Plank"},{"id":57,"rating":"Easy","duration":31,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Upper Body","movements":["crunches","dips","push-ups","rows","running","sit-ups","skipping","squats","triceps"],"wm":["crunches","dips","push-ups","rows","running","sit-ups","skipping","squats","triceps"],"warmup":"15M Highknee, Jog, Bumkick, jog, opengate. Close gate","workout":"400M->20 Pushups, 800M->20 Jump SQ,  400M->20 Situps, 800M->20 Pull-up row\n30s ea, 30s rest - 3 sets\n1 - Boxjumps, Pushup w arm raise\n2- Squat w knee-elbow, Tricep dip\n3- Skipping, Cycle Crunches","core":""},{"id":58,"rating":"Easy","duration":37,"equipment":"BODYWEIGHT","format":"MIXED","focus":"Full Body","movements":["burpees","dips","hollow holds","inchworms","lunges","mountain climbers","push-ups","running","shoulder press","squats","v-ups"],"wm":["burpees","dips","hollow holds","inchworms","lunges","mountain climbers","push-ups","running","shoulder press","squats","v-ups"],"warmup":"15m jog, 15m bumkicks, 15m jog/high knee, 15m jog/kariocas *2","workout":"40/20\nSquats-Squat Jump-Squat Pulses\nPushup-Mountain Climber-Pushup w hold\nLunge R-Lunge Hop R-Lunge Pulse R\nLunge L-Lunge Hop L-Lunge Pulse L\nShoulder Press-up-Inch Worms-Burpees\nOpp Arm/Leg V-up-V Ups-Hollowhold\n4 Laps - 15 rows + 15 Dips","core":""},{"id":59,"rating":"Very Hard","duration":43,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Upper Body","movements":["crunches","jumping","lunges","mountain climbers","planks","push-ups","rows","running","squats"],"wm":["jumping","lunges","push-ups","rows","running","squats"],"warmup":"3 laps","workout":"6 sets - 15 DB SQ, 10 DB Lunge, 10 Tuck jump, 150M fast run, 50m walk\nThen 20 pushup & 20 pull-up rows *3","core":"30s pairs, 30s rest - Plank toe touches & 2 punch crunch, Mountain Climbers & Cycle Crunches, Plank-ups & Ankle Touches"},{"id":60,"rating":"Medium","duration":44,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Cardio","movements":["burpees","glute bridges","inchworms","mountain climbers","planks","push-ups","running","skaters","skipping","squats","v-ups"],"wm":["burpees","glute bridges","mountain climbers","push-ups","running","skaters","skipping","squats","v-ups"],"warmup":"2 Laps w 5 inch worms","workout":"6 rounds - 400M - 5 V-Ups, 5 SQ, 5 Pushups\n3 Rounds - 100 jump rope, 30 mountain climbers, 20 Skaters, 10 Hip bridge, 8 Push-ups, 3 Burpees","core":"3 * 1 min plank"},{"id":61,"rating":"Medium","duration":42,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Full Body","movements":["high pulls","hollow holds","inchworms","kb swings","planks","running","skipping","squats"],"wm":["high pulls","kb swings","running","skipping","squats"],"warmup":"2 laps 5 inch worms, 10 SQ","workout":"25 min AMRAP\n60 Skips, 20 KB Swings, 15 Goblet SQ, 10 High Pulls, 100M run","core":"3 sets - 30s Plank, 30s Side-Plank L, 30s Side Plank R, 30s Hollowhold, 30s Rest"},{"id":62,"rating":"Hard","duration":49,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Full Body","movements":["box jumps","burpees","crunches","high pulls","kb swings","push-ups","running","shoulder press","sit-ups","squats","step-ups"],"wm":["box jumps","burpees","high pulls","kb swings","push-ups","running","shoulder press","squats"],"warmup":"2 laps - 10 stepups, 5 rows","workout":"5 rounds\n10 Burpees, 10 one leg deadlft, 10 pushup (3 down, 1 up), 10 Goblet SQ, 10 Box Jumps, 10 KB highpulls, 10 push-press, 10 KB swings, 100m run","core":"2 rounds - 10 Rev Crunch, 10 Situp"},{"id":63,"rating":"Very Hard","duration":56,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Cardio","movements":["bear crawls","burpees","planks","running","sit-ups","squats"],"wm":["bear crawls","burpees","running","sit-ups","squats"],"warmup":"3 Laps","workout":"4 Rounds - 200M Run - 20 SQ w Bounce, 200M Run - 20m Bear Crawl, 200M Run - 20 Burpees, 200M Run 20 Situps","core":"2 * 1 min Plank-up"},{"id":64,"rating":"Medium","duration":37,"equipment":"DUMBBELL","format":"AMRAP","focus":"Upper Body","movements":["burpees","curls","leg raises","planks","push-ups","rows","running","shoulder press","skipping","squats"],"wm":["burpees","curls","push-ups","rows","shoulder press","skipping","squats"],"warmup":"2 Laps w 10 SQ, 10 Push-up","workout":"3 Rounds - 2 min per round - 10 Weighted Squat, 20 Hammer Curls, 12 Shoulder Press. \nAMRAP 20 mins - 6 upright DB rows (ea arm), 10 Push-up, 15 Sumo Sq, 8 Burpees, 30 skips","core":"1 min plank, 30s Leg Raise * 2"},{"id":65,"rating":"Hard","duration":50,"equipment":"BODYWEIGHT","format":"AMRAP","focus":"Upper Body","movements":["inchworms","push-ups","rows","running","shoulder press","sit-ups","snatches"],"wm":["push-ups","rows","running","shoulder press","snatches"],"warmup":"2 laps - 5 inch worms, 5 pull-up rows after each","workout":"5 sets of 7 Tempo Shoulder press (3sec up, 3 sec hold, 2 sec down)\n20min AMRAP - 20 Snatches, 100M, 10 Pull-up rows, 10 Push-ups, 100M","core":"30 situps, 30 Flutterkick * 2"},{"id":66,"rating":"Medium","duration":45,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Upper Body","movements":["bear crawls","curls","deadlifts","inchworms","planks","push-ups","rows","running","shoulder press","squats","thrusters","triceps"],"wm":["bear crawls","curls","deadlifts","inchworms","rows","running","shoulder press","squats","thrusters","triceps"],"warmup":"2 Laps w 3 inch worms, 5 SQ, 5 Push-up","workout":"2 Rounds - 10 good mornings, 10 squats, 5 inch worms, 10M bear crawl, 200M\n5 Rounds (1 min rest in bet) - 5 DB Dead lift, 5 DB Squat, 5 Push-press, 10 hammer curl\n3 Rounds (40s/20s) - Thrusters, Skull Crushers, DB Rows - 1 min rest","core":"1 min plank *3 (30s rest)"},{"id":67,"rating":"Easy","duration":40,"equipment":"KB+DB","format":"ROUNDS","focus":"Upper Body","movements":["curls","hollow holds","kb swings","lunges","planks","push-ups","rows","running","shoulder press","triceps"],"wm":["curls","kb swings","lunges","rows","running","shoulder press","triceps"],"warmup":"2 Laps w 6 lunges, 6 shoulder pushup, 6 tricep pushup, 6 bar rows","workout":"12,10,8,6 w 20s rest in bet - Dumbbell Lunge, Bicep Curl, Shoulder Press, Tricep Ext, Bent over rows\n4 rounds - 1 lap, 21 KB swings, 12 bar rows","core":"2 round - 30s Plank, 30s Side Plank L, 30s Side Plank R, 30s Hollowhold, 30s Rest"},{"id":68,"rating":"Hard","duration":52,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Full Body","movements":["burpees","kb swings","planks","push-ups","running","sit-ups","squats","suitcase carry"],"wm":["burpees","kb swings","push-ups","running","squats","suitcase carry"],"warmup":"3 laps w 10 SQ, 10 shoulder tap pushup","workout":"5 rounds - 1min - 5 tempo KB SQ, 1 min push-up to failure, 1 min rest\n20 min AMRAP\n100M KB farmer carry\n10 burpees\n20 KB swing","core":"Tabata 40s on 20s off\n4 rounds - Plank\n4 rounds - Situp"},{"id":69,"rating":"Hard","duration":47,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Full Body","movements":["burpees","crunches","glute bridges","hip-ups","inchworms","running","squats"],"wm":["burpees","running","squats"],"warmup":"2 lap w inch worms & 10 SQ","workout":"8 rounds EMOTM 8 heavy squats\n3 rounds - 2 laps, 40 squats, 20 burpees","core":"3 rounds 10 glute bridges, 10 hip-up ea side, 30 bicycle crunches"},{"id":70,"rating":"Hard","duration":52,"equipment":"BODYWEIGHT","format":"MIXED","focus":"Upper Body","movements":["burpees","curls","deadlifts","inchworms","leg raises","lunges","rows","running","sit-ups","squats"],"wm":["burpees","curls","deadlifts","rows","squats"],"warmup":"2Lap, 10 inch worms, 10 good morning, 10 lunges","workout":"Every 2 mins - 10 tempo one leg dead lift (L), 10 tempo one leg dead lift (R), 12 slow pull-up rows\n 1:1:1,2:2:2,3:3:3,4:4:4,5:5:5…12:12:12 Heavy Squats, Burpees, Curls","core":"4 min tabata (20:10) Situps then 4 min leg raises"},{"id":71,"rating":"Hard","duration":43,"equipment":"BODYWEIGHT","format":"EMOM","focus":"Upper Body","movements":["bear crawls","burpees","cleans","crunches","push-ups","rows","running","squats"],"wm":["burpees","cleans","push-ups","rows","squats"],"warmup":"3 * 100M, 15m bear crawl, 10 squats","workout":"6 rounds - 10 heavy squat, 10 inverted pushup, 30s rest\n21min EMOM  - alternating - 15 pull-up rows, 6 sandbag clean and press, 9 burpees","core":"3 * 30s cycle crunches, 30s shoulder taps, 30s rest"},{"id":72,"rating":"Hard","duration":49,"equipment":"DUMBBELL","format":"EMOM","focus":"Legs + Power","movements":["burpees","curls","lunges","rows","running","sit-ups","snatches","squats","thrusters","v-ups"],"wm":["burpees","curls","lunges","running","snatches","squats","thrusters"],"warmup":"2 laps w 10 pullup rows, 10 SQ","workout":"10 rounds - one arm snatch ea side, 3 DB Squats, 6 DB lunges\n24m EMOM - 30m sprint - 100m jog, 4 burpees & 4 thrusters, 8 DB curls","core":"Tabata (20/10) - 8 rounds V-Up, 8 Rounds Situp"},{"id":73,"rating":"Hard","duration":43,"equipment":"KETTLEBELL","format":"EMOM","focus":"Upper Body","movements":["curls","inchworms","kb swings","planks","rows","running","squats","triceps"],"wm":["curls","kb swings","rows","running","squats","triceps"],"warmup":"2 laps w 5 inch worms, 10 S","workout":"10 rounds of 10 Heavy SQ EMOM\nThen: 4 rounds - 1 lap, 21 KB Swings, 15 Pull-up rows\nThen: 2 rounds to failure - Bicep Curls, Chest Press, Skull Crushers","core":"3 * 1 min plank"},{"id":74,"rating":"Medium","duration":42,"equipment":"KETTLEBELL","format":"TABATA","focus":"Full Body","movements":["deadlifts","kb swings","planks","push-ups","rows","running","shoulder press","sit-ups","squats"],"wm":["deadlifts","kb swings","push-ups","running","shoulder press","squats"],"warmup":"2 laps w 12 pull-up rows","workout":"3 Rounds - 12 KB Deadlift, 12 Goblet SQ, 10 Rows (ea arm), 10 shoulder press\n4 Rounds - 1 laps, 21 KB Swings, 12 pushup","core":"Rotating Tabata (40/20) - 4 rounds - Situps, Plank, Pushup to failure"},{"id":75,"rating":"Medium","duration":43,"equipment":"DUMBBELL","format":"AMRAP","focus":"Full Body","movements":["bear crawls","burpees","crunches","push-ups","running","snatches","thrusters"],"wm":["bear crawls","crunches","push-ups","running","snatches","thrusters"],"warmup":"3 laps w 10 burpees in bet","workout":"12 Min AMRAP - 100M Run, 10 DB Thrusters\n12 Min AMRAP - 20m bear crawl, 10 DB snatches\n3 rounds push-up to failure w 10 Rev Crunches & 20 Crunches in between","core":""},{"id":76,"rating":"Hard","duration":47,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Upper Body","movements":["curls","lunges","push-ups","rows","running","sit-ups","squats","thrusters"],"wm":["curls","lunges","rows","running","thrusters"],"warmup":"2 laps w 10 SQ, 10 Pushup","workout":"5 Rounds - 10 Thrusters, 10 Lunge Curls, 8 Side Bend (ea side), 12 Chest press, 8 Bent-over Row ea side - 1 min rest\nThen: 8 rounds suicides - 10m, 20m, 30m - 30 sec rest in bet","core":"3 rounds - 30s situp, 30s shoulder taps, 30s rest"},{"id":77,"rating":"Very Hard","duration":50,"equipment":"DUMBBELL","format":"AMRAP","focus":"Upper Body","movements":["lunges","planks","push-ups","rows","running","sit-ups","squats"],"wm":["lunges","push-ups","rows","running","squats"],"warmup":"3 round 100M, 10 SQ, 10 Lunges, 10 Pushup","workout":"10 rounds - 10 DB Lunges, 10 DB SQ with 3s hold - 30s rest\n18 Min AMRAP - 1 lap, 10 pull-up rows, push-up to failure","core":"2 min plank, 30 situps, 1 min plank"},{"id":78,"rating":"Easy","duration":41,"equipment":"KETTLEBELL","format":"TABATA","focus":"Full Body","movements":["crunches","flutter kicks","kb swings","mountain climbers","rows","running","snatches","squats"],"wm":["crunches","kb swings","rows","running","snatches","squats"],"warmup":"","workout":"12,10,10,8 Reps of KB Swings, KB rows (ea arm), KB Snatches, KB Skullcrushers, Rev Crunches, KB Goblet SQ\n8 Round Suicides - 10,20,30M - 30s Rest in between","core":"Tabata (40/20) - 4 rounds Flutter kicks, 4 rounds Mountain Climbers"},{"id":79,"rating":"Hard","duration":43,"equipment":"DUMBBELL","format":"AMRAP","focus":"Upper Body","movements":["burpees","man makers","push-ups","rows","running","shoulder press","sit-ups","squats"],"wm":["burpees","man makers","push-ups","rows","running","shoulder press"],"warmup":"3 Rounds 10 SQ, 10 Push-up, 100M","workout":"5 Sets - 8 Shoulder Press, 8 DB Row (ea arm), 8 Push-up\n20 Min AMRAP - 5 Man makers, 100M, 5 Burpees, 100M","core":"100 Situps"},{"id":80,"rating":"Hard","duration":44,"equipment":"KETTLEBELL","format":"EMOM","focus":"Legs","movements":["burpees","crunches","inchworms","kb swings","lunges","planks","push-ups","rows","running","squats"],"wm":["burpees","kb swings","lunges","push-ups","rows","squats"],"warmup":"2 laps w 5 inch worms 10 lizard lunges","workout":"12 min EMOM alternating - 12 push-up, 12 KB Squat\n3 rounds - 40/20 per exercise - KB Swings, KB High-pull, KB lunges, KB Rows, Burpees","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Flutterkicks, 30s rest"},{"id":81,"rating":"Hard","duration":47,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Full Body","movements":["crunches","flutter kicks","kb swings","planks","push-ups","running","sit-ups","squats","v-ups"],"wm":["kb swings","push-ups","running","squats"],"warmup":"2 laps w 5 situp, 5 pull-up, 5 SQ","workout":"2min box run - 1min rest, 2 min box run - 1 min rest, 3 min box run - 1 min rest\n20 min AMRAP - 6 pull-ups, 8 push-ups, 10 KB SQ, 12 KB Swing","core":"30s Per exercise 30s Rest. \nCycle crunch/Plank Toe Touch. Flutter kick/2 punch crunch. V-Up/Ankle Touches"},{"id":82,"rating":"Easy","duration":30,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Full Body","movements":["high pulls","lunges","planks","push-ups","running","sit-ups","skipping","squats"],"wm":["high pulls","lunges","push-ups","sit-ups","skipping","squats"],"warmup":"3 laps non-stop","workout":"6 rounds - 8 KB high pulls, 8 KB Squats, 5 strict-press ea arm\nThen: 2 rounds - 50 skips, 40 sit-ups, 30 squats, 20 lunges, 10 push-up","core":"1min plank, 30s rest * 2"},{"id":83,"rating":"Medium","duration":46,"equipment":"DUMBBELL","format":"TABATA","focus":"Upper Body","movements":["bear crawls","crunches","curls","hollow holds","lunges","planks","rows","running","shoulder press","snatches","squats","triceps"],"wm":["curls","lunges","rows","running","shoulder press","snatches","squats","triceps"],"warmup":"2 laps w  10M Bear Crawl & 10 Rows","workout":"5 Rounds - 10 DB Curls, 10 DB Skull crushers, 10 DB Rows (ea arm), 10 DB SQ\nAlternating between people: 1 lap while others do DB SQ or Shoulder Press - Swap.\nRound two - 1 Lap, Lunges, Snatches","core":"Tabata (40/20) - 3 Rounds - Plank, Crunches, Hollowhold"},{"id":84,"rating":"Medium","duration":42,"equipment":"DUMBBELL","format":"AMRAP","focus":"Upper Body","movements":["crunches","curls","leg raises","push-ups","rows","running","shoulder press","squats"],"wm":["curls","push-ups","rows","running","shoulder press","squats"],"warmup":"30M jog, 10 SQ, 30M, 10 pushup - *3","workout":"3 rounds - 10 DB SQ, 20 Curls, 12 Strict Press\n21 Min AMRAP - 5 Pull-up rows, 10 Push-up, 15 Squats, 100M","core":"3 Round - 12 Leg raises, 12 Crunches, 12 Reverse Crunches, 12 Ankle Touches"},{"id":85,"rating":"Medium","duration":35,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Legs","movements":["deadlifts","inchworms","leg raises","planks","rows","running","sit-ups","squats"],"wm":["deadlifts","rows","squats"],"warmup":"3 laps w 10 SQ, 5 inchworms","workout":"4 rounds w KB (Don't put down)\n10 Bentover rows, 10 upright rows, 10 Swings, 10 deadlift, 10 upright rows, 10 swings, 10 squats, 10 bent over rows, 10 swings - 2 min rest","core":"2 rounds - 20 situps, 20 leg raises, 10 plank-ups, 30s planks"},{"id":86,"rating":"Medium","duration":35,"equipment":"DUMBBELL","format":"LADDER","focus":"Upper Body","movements":["crunches","curls","dips","lunges","planks","push-ups","rows","running","sit-ups","triceps"],"wm":["curls","lunges","push-ups","rows","running","sit-ups","triceps"],"warmup":"2 laps w 10 dips, 10 push-ups","workout":"Reverse Ladder Circuit\n10,9,8,7…DB Front Lunge\n20,18,16,14….Situp\n100M Run\nThen 3 Rounds\n20 DB Hammer Curls, 10 Skull Crushers, 20 DB rows, 10 Push-ups","core":"1 min plank, 30s rest, 30s Rev Crunch, 30s Rest, 1 min plank"},{"id":87,"rating":"Hard","duration":43,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Full Body","movements":["cleans","inchworms","lunges","planks","push-ups","rows","running","russian twists","squats"],"wm":["cleans","lunges","push-ups","rows","running","russian twists","squats"],"warmup":"2 laps w 10 SQ, 5 inch worms in between.","workout":"3 rounds - 20 DB lunges, 20 DB Squats, 10 DB clean and press, pushup to failure, 10 DB russian twist, pull up row to failure\nThen 4 laps, jog long side, fast short side.","core":"3 rounds -  30s plank, 30s superman, 30s shoulder tap, 30s rest"},{"id":88,"rating":"Easy","duration":29,"equipment":"KETTLEBELL","format":"MIXED","focus":"Full Body","movements":["cleans","deadlifts","kb swings","lunges","mountain climbers","planks","push-ups","running","russian twists","squats"],"wm":["cleans","deadlifts","kb swings","mountain climbers","push-ups","running","russian twists","squats"],"warmup":"2 laps with 10 rows, 10 lunges","workout":"10,8,8,6 Reps of Uneven Mountain Climbers, KB swings, KB Russian Twists, KB Clean & Press, KB SQ, KB Deadlift, Uneven Push-up\nThen 30m sprint, 100m jog *4","core":"4 * 40s uneven plank 20s rest"},{"id":89,"rating":"Very Hard","duration":57,"equipment":"DUMBBELL","format":"MIXED","focus":"Upper Body","movements":["burpees","man makers","running","shoulder press","sit-ups","squats"],"wm":["burpees","man makers","running","shoulder press","squats"],"warmup":"50 JJ, 50 High Knees *3","workout":"11 man makers, 11 burpees *2\n35 Min - 27 Air Sq, 9 DB shoulder press, 1 lap","core":"30 situp, 30 flutterkick *2"},{"id":90,"rating":"Hard","duration":45,"equipment":"DUMBBELL","format":"TABATA","focus":"Full Body","movements":["burpees","curls","deadlifts","inchworms","lunges","running","sit-ups","skipping","squats","thrusters","triceps","v-ups"],"wm":["burpees","curls","deadlifts","lunges","sit-ups","skipping","thrusters","triceps","v-ups"],"warmup":"2 laps w 5 inch worms, 5 squats","workout":"Tabata 20/10 - 8 rounds per exercise. \nDB Thrusters, DB Lunges, V-Ups, DB Deadlifts, Skipping\n4 rounds - 16 DB Curls, 10 Skull crushers, 20 Situps, 10 Burpees","core":""},{"id":91,"rating":"Medium","duration":48,"equipment":"BODYWEIGHT","format":"TABATA","focus":"Legs","movements":["burpees","crunches","jumping","leg raises","lunges","mountain climbers","planks","push-ups","running","sit-ups","skaters","squats"],"wm":["burpees","crunches","jumping","leg raises","lunges","mountain climbers","planks","push-ups","running","sit-ups","skaters","squats"],"warmup":"2 rounds - 30 JJ, 10 SQ. 10 arm circles (forward & back), 10 lunges w twist, 10 shoulder taps, 80 high-knees","workout":"40/20 Tabata * 8 Exercises - 4 rounds\n1 - Jump Squats, High knees, Mountain Climber, Burpees, Skaters, Jump Lunge, Tuck Jumps, Fast Feet\n2 - Push-up, Shoulder taps, Incline Push-up, Superman, Situp, Bicycle Crunch, Leg Raise, Plank\n1 min rest - then repeat\nSuicides 10,20,30M * 4 - 30 sec rest in between","core":""},{"id":92,"rating":"Hard","duration":46,"equipment":"BODYWEIGHT","format":"TABATA","focus":"Legs","movements":["burpees","calves","crunches","flutter kicks","glute bridges","jumping","lateral lunges","lunges","planks","push-ups","running","squats","step-ups","v-ups"],"wm":["burpees","calves","glute bridges","jumping","lateral lunges","lunges","planks","push-ups","squats"],"warmup":"2 laps w 10 step-ups, 10 lizard lunges","workout":"40/20 Tabata * 8 Exercises - 4 round\n1 - Squats, Wallsit, Glute bridge, Rev Lunges, Sumo Sq, Calf raise, SQ hold, Jump SQ\n2 - Burpees, Pushup, Rows, Plank Jacks, Lateral Lunge, Tuck Jump, Mountain Cl, Fastfeet to Burpee\n1 min rest - then repeat","core":"30 Flutter kicks, 10 V-Up, 30 Cycle Crunch * 2"},{"id":93,"rating":"Hard","duration":42,"equipment":"KB+DB","format":"EMOM","focus":"Legs","movements":["deadlifts","lunges","planks","push-ups","running","shoulder press","sit-ups","squats","step-ups"],"wm":["deadlifts","lunges","planks","push-ups","shoulder press","sit-ups","squats","step-ups"],"warmup":"2 laps w 10 SQ, 20 arm circle, 10 lizard lunge","workout":"15 Min EMOM - set 1 (3 rounds)\nMin 1: 15 Goblet SQ\nMin 2: 12 DB Step-up\nMin 3: 15 Romanian Deadlift\nMin 4: 12 DB Lunge w Twist\nMin 5: 15 Situps\n15 Min EMOM - set 2 (3 rounds)\nMin 1: 10 DB Push-press\nMin 2: 15 DB Chest Press\nMin 3: 8 DB Arnold Press\nMin 4: 10 Incline Push-up\nMin 5: 40s Plank","core":""},{"id":94,"rating":"Hard","duration":46,"equipment":"DUMBBELL","format":"EMOM","focus":"Full Body","movements":["burpees","dead bugs","deadlifts","leg raises","lunges","mountain climbers","planks","push-ups","rows","running","russian twists","shoulder press"],"wm":["burpees","dead bugs","deadlifts","leg raises","lunges","mountain climbers","planks","push-ups","rows","running","russian twists","shoulder press"],"warmup":"2 laps w 10 push-up, 10 Lizard lunge","workout":"15 Min EMOM - set 1 (3 rounds)\nMin 1: 12 Renegade Rows\nMin 2: 10 Bent-over Row (ea arm)\nMin 3: 30 Russian Twist w DB\nMin 4: 40s Plank Pull Through\nMin 5: 40 Dead Bug Hold w DB\n15 Min EMOM - set 2 (3 rounds)\nMin 1: 8 Burpee to Deadlift\nMin 2: 12 DB Lunges\nMin 3: 40s Highknee w DB Press\nMin 4: 40s Lateral Hops over DB\nMin 5: 40s Mountain Climbers\nThen: 2 rounds - Pushup to failure, 200M run, 15 Leg Raises","core":""},{"id":95,"rating":"Medium","duration":35,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Legs","movements":["crunches","deadlifts","inchworms","leg raises","lunges","planks","push-ups","rows","running","shoulder press","sit-ups","squats"],"wm":["deadlifts","lunges","push-ups","rows","running","shoulder press","squats"],"warmup":"2 laps w 20 arm circles, 10 leg swings, 5 inch worms","workout":"3 sets of 12 reps per set\n1. KB Goblet SQ, Bar Rows\n2. KB Romanian Deadlift, Push-Press\n3. KB Lunges, Pushup to Failure\n6 Rounds - 100M sprint, 50M walk","core":"1 min plank, 30s bicycle crunch, 15 leg raises,30s side plank ea side, 15 situps"},{"id":96,"rating":"Hard","duration":42,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Upper Body","movements":["curls","lunges","planks","push-ups","rows","running","russian twists","skipping","squats","step-ups","v-ups"],"wm":["curls","push-ups","rows","running","skipping","step-ups"],"warmup":"3 Rounds 30Skips, 10 SQ, 5 Push-up, 6 lizard lunge","workout":"40/20 - 4 Rounds - 1 min bet rounds\n1) Stepup w DB, 2) Arnold Curl to Press, 3) Skipping, 4) Bar Rows, 5) Shoulder Tap Push Up\nThen: 4 rounds suicides - 10M, 20M, 30M","core":"20 Russian Twist, 15 V-Ups, 20 Plank Shoulder taps, 20 Flutterkicks - 3 rounds"},{"id":97,"rating":"Medium","duration":49,"equipment":"KETTLEBELL","format":"EMOM","focus":"Legs","movements":["crunches","jumping jacks","kb swings","mountain climbers","planks","push-ups","rows","running","sit-ups","squats","step-ups"],"wm":["kb swings","mountain climbers","planks","push-ups","rows","running","squats","step-ups"],"warmup":"2 laps w 10 Jumping Jacks, 10 SQ, 10 Push-up","workout":"5 rounds EMOM\n1) 10 KB Swing + 5 Jump SQ, 2) 10 Push-up + 6 step-up, 3) 10 KB rows + 10 Mountain Climbers, 4) 12 Goblet SQ, 5) 30s Plank\nThen: Sprint Ladder x 2 - Run 50m Walk 50m, Run 100M, Walk 50m, Run 150M, Walk 50M, Run 200M, Walk 50m","core":"15 Situp, 15 Rev Crunch *2"},{"id":98,"rating":"Medium","duration":38,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Legs","movements":["burpees","cleans","deadlifts","lunges","planks","push-ups","running","russian twists","sit-ups","skipping","squats","step-ups"],"wm":["burpees","cleans","deadlifts","push-ups","running","skipping","squats","step-ups"],"warmup":"2 Lap w 6 lizard lunge, 20 Arm swings, 20 leg swings, 5 SQ, 5 Pushup","workout":"4 rounds - 10 reps ea\n1) KB Clean & Press, 2) KB Goblet SQ, 3) KB Deadlift, 4) Stepups w KB, 5) Uneven Push-ups\nTHEN 3 Rounds\n30s Skipping, 30s High Knees, 30s Jump SQ, 30s Burpees, 30s Rest","core":"1 min plank, 20 situps, 30 russian twist"},{"id":99,"rating":"Medium","duration":39,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Full Body","movements":["kb swings","lunges","mountain climbers","planks","push-ups","rows","running","russian twists","sit-ups","skipping","squats"],"wm":["kb swings","lunges","push-ups","rows","running","skipping"],"warmup":"2 laps w 10SQ, 10 Pushup, 6 lizard lunge","workout":"5 rounds - 1 lap, 16 KB lunges, 16 KB Swings, 10 push-up, 10 bar rows, 30s skipping","core":"10 situp, 20 russian twist, 30s plank, 40 flutterkick, 50 mountain climber"},{"id":100,"rating":"Medium","duration":37,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Full Body","movements":["calves","curls","deadlifts","dips","inchworms","leg raises","lunges","planks","rows","running","russian twists","shoulder press","skipping","squats","step-ups","triceps","v-ups"],"wm":["calves","curls","deadlifts","dips","rows","running","shoulder press","squats","step-ups","triceps"],"warmup":"30s skipping, 10SQ, 20 Arm circle, 10 Lizard Lunge, 5 inch worm * 2","workout":"3 rounds - lower body\n12 DB SQ, 10 Weighted Step-ups, 12 DB romanian deadlift, 20 calf-raise\n3 rounds - upper body\n12 Bar rows, 10 DB Press, 12 DB Curls, 12 Tricep Dips\n4 laps - Jog 100M, Fast 150M, Walk 100M","core":"15 V-Up, 15 Leg Raise, 20 Russian Twist, 30s Plank"},{"id":101,"rating":"Medium","duration":40,"equipment":"KETTLEBELL","format":"LADDER","focus":"Full Body","movements":["crunches","jumping jacks","kb swings","leg raises","mountain climbers","push-ups","running","sit-ups","skipping","squats","step-ups"],"wm":["kb swings","push-ups","running","skipping","squats","step-ups"],"warmup":"100M Jog, 30s skipping, 10 jumping jacks * 3","workout":"Rev Ladder 10 -> 1\nKB swings, KB SQ, Push-ups, KB step-up, 30s Skipping\n4 rounds suicides - 10,20,30M","core":"10 leg raises, 20 situps, 30 flutterkicks, 40 bicycle crunches, 50 mountain climber"},{"id":102,"rating":"Medium","duration":38,"equipment":"KETTLEBELL","format":"SUPERSETS","focus":"Upper Body","movements":["box jumps","kb swings","planks","push-ups","rows","running","shoulder press","squats"],"wm":["box jumps","kb swings","push-ups","rows","running","shoulder press","squats"],"warmup":"2 laps w 20 arm swings, 20 leg swings, 10 SQ, 10 Pushups","workout":"4 supersets, 3 rounds each\n1) 12 bar rows, 15 pushup, 100m Run\n2) 12 Goblet SQ, 15 KB swings, 100M run\n3) 10 Box jumps, 12 Push press, 100M run\n4) 10 KB rows, 10 KB High-pull, 100M run","core":"1 min plank, 30s side-plank ea side, 30s rest *2"},{"id":103,"rating":"Medium","duration":42,"equipment":"KETTLEBELL","format":"TABATA","focus":"Full Body","movements":["box jumps","cleans","dead bugs","inchworms","kb swings","planks","rows","running","sit-ups","skipping"],"wm":["box jumps","cleans","kb swings","rows","running","skipping"],"warmup":"30s Skipping, 100M, 20 arm swings, 5 inch worms *2","workout":"20/10 Tabata - 8 rounds per station\n1) KB Swings, 2) Box Jumps 3) KB Rows\n4) Skipping 5) KB Clean & Press\n1 Min rest bet stations\nThen: 4 rounds suicides - 10, 20, 30M","core":"10 Dead bug, 20 Plank pull through, 20 Plank shoulder-tap, 20 situp *2"},{"id":104,"rating":"Medium","duration":42,"equipment":"BODYWEIGHT","format":"MIXED","focus":"Upper Body","movements":["burpees","crunches","dips","leg raises","push-ups","rows","running","sit-ups","squats","v-ups"],"wm":["burpees","dips","push-ups","rows","running","squats"],"warmup":"50 High knees, 10 SQ, 10 Push-up, 10 leg swings *3","workout":"4 Corners - run between each for 6 laps.  10 Pushups, 10 Jump SQ, 5 Burpees, 10 Tuck-Jumps\nThen Pullup rows to failure, dips to failure * 2","core":"30 Cycle Crunches, 20 Situp, 15 V-Up, 10 Leg Raises *2"},{"id":105,"rating":"Hard","duration":45,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Legs","movements":["box jumps","burpees","hollow holds","jumping jacks","mountain climbers","planks","push-ups","running","squats","step-ups"],"wm":["box jumps","burpees","jumping jacks","mountain climbers","push-ups","running","squats","step-ups"],"warmup":"3 laps non-stop","workout":"5 Rounds - 30s rest between rounds\n10 Burpees, 15 Box Jumps, 20 Push-ups, 25 Step-Ups , 30 Prisoner Squats, 40 Mountain Climbers, 50 Jumping jacks, 100M Run","core":"3 rounds - 30s Plank, 30s Side Plank L, 30s Side Plank R, 30s Hollow Hold, 30s rest"},{"id":106,"rating":"Hard","duration":45,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Full Body","movements":["crunches","flutter kicks","high pulls","kb swings","planks","rows","running","squats","turkish get-ups"],"wm":["high pulls","kb swings","running","squats","turkish get-ups"],"warmup":"2 laps w 10 SQ, 10 pull-up rows","workout":"30 Min AMRAP\n2 KB Turkish Get-Ups ea side, 15 KB Swings, 10 Goblet SQ, 8 KB High Pulls, 100m run","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Flutter Kick, 30s rest"},{"id":107,"rating":"Hard","duration":43,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Full Body","movements":["deadlifts","hollow holds","kb swings","planks","rows","running","shoulder press"],"wm":["deadlifts","kb swings","rows","running","shoulder press"],"warmup":"2 laps w 10 KB swings, 10 SQ","workout":"5 Rounds - 30s rest\n15 KB Deadlifts, 12 KB Rows ea arm, 10 KB Push Press ea arm, 20 KB Swings, 100M run\nThen: 4 suicides 10,20,30M - 30s rest","core":"2 rounds - 30s Plank, 30s Side Plank L, 30s Side Plank R, 30s Hollow Hold"},{"id":108,"rating":"Medium","duration":40,"equipment":"KETTLEBELL","format":"EMOM","focus":"Upper Body","movements":["box jumps","crunches","flutter kicks","high pulls","kb swings","push-ups","rows","running","skipping","squats","v-ups"],"wm":["box jumps","high pulls","kb swings","push-ups","rows","running","skipping","squats"],"warmup":"30M jog, 10 SQ, 30M, 10 pushup *3","workout":"EMOM 24 min - 6 rounds of 4 exercises\nMin 1: 15 KB Swings\nMin 2: 10 Goblet SQ + 5 Box Jumps\nMin 3: 12 Pull-up Rows + 5 Push-ups\nMin 4: 10 KB High Pulls + 30 Skips\nThen\n2 Rounds - 4 min box run, 1 min rest","core":"3 rounds - 10 V-Ups, 20 Bicycle Crunches, 30 Flutter Kicks"},{"id":109,"rating":"Hard","duration":44,"equipment":"KETTLEBELL","format":"LADDER","focus":"Full Body","movements":["cleans","crunches","hollow holds","kb figure-8","kb halos","kb swings","planks","push-ups","rows","running"],"wm":["cleans","kb figure-8","kb swings","push-ups","rows","running"],"warmup":"2 laps w 5 KB Halos, 10 SQ","workout":"Ladder 20-16-12-8-4\nKB Swings, KB Clean & Press, KB Figure-8, Pull-up Rows\n100M run between each round\nThen 2 laps w Push-ups to failure","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Hollow Hold, 30s rest"},{"id":110,"rating":"Hard","duration":47,"equipment":"DUMBBELL","format":"AMRAP","focus":"Upper Body","movements":["crunches","curls","inchworms","planks","push-ups","rows","running","russian twists","shoulder press","squats","step-ups","thrusters"],"wm":["curls","push-ups","rows","running","shoulder press","squats","step-ups","thrusters"],"warmup":"2 laps w 10 SQ, 5 inchworms","workout":"3 Rounds - 1 min rest\n20 DB SQ, 12 DB Hammer Curls ea arm, 10 DB Shoulder Press, 10 DB Rows ea arm, 8 DB Thrusters\nThen: 20 Min AMRAP - 10 Push-ups, 15 DB SQ, 20 Step-ups, 100M run","core":"2 rounds - 30 Russian Twist, 20 Bicycle Crunch, 30s Plank"},{"id":111,"rating":"Hard","duration":40,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Full Body","movements":["burpees","high pulls","inchworms","kb swings","mountain climbers","push-ups","rows","running","sit-ups","squats","step-ups"],"wm":["burpees","high pulls","kb swings","mountain climbers","push-ups","rows","squats","step-ups"],"warmup":"3 laps w 5 inchworms, 5 good mornings","workout":"4 Rounds (40s on / 20s rest)\nKB Swings, Goblet SQ, Push-up, KB High Pull, Burpees, Step-ups, Mountain Climbers, KB Rows","core":"100 Situps"},{"id":112,"rating":"Medium","duration":38,"equipment":"BODYWEIGHT","format":"AMRAP","focus":"Full Body","movements":["box jumps","burpees","crunches","leg raises","planks","push-ups","running","squats"],"wm":["box jumps","burpees","push-ups","running","squats"],"warmup":"15M High Knee, jog back, 15M Bumkicks, jog back, 15M Carioca, 15M Side shuffle - 3 rounds","workout":"30 Min AMRAP\n20 Squats, 15 Push-ups, 10 Box Jumps, 5 Burpees, 200M run","core":"3 rounds - 15 Leg Raises, 20 Bicycle Crunches, 30s Plank"},{"id":113,"rating":"Hard","duration":47,"equipment":"KETTLEBELL","format":"SUPERSETS","focus":"Full Body","movements":["box jumps","cleans","deadlifts","dips","kb swings","planks","push-ups","rows","running","russian twists","squats","step-ups","v-ups"],"wm":["box jumps","cleans","deadlifts","dips","kb swings","push-ups","running","squats","step-ups"],"warmup":"2 laps w 10 SQ, 10 pull-up rows","workout":"4 Supersets - 4 rounds each\n1) 12 KB Swings, 12 Box Jumps, 100M\n2) 6 KB Clean & Press ea side, 10 Push-ups, 100M\n3) 15 KB Deadlifts, 15 Step-ups, 100M\n4) 12 KB Goblet SQ, 12 Dips, 100M","core":"2 rounds - 30s Plank, 30 Russian Twist, 15 V-Up"},{"id":114,"rating":"Very Hard","duration":50,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Full Body","movements":["crunches","flutter kicks","high pulls","kb swings","mountain climbers","push-ups","running","sit-ups","squats"],"wm":["high pulls","kb swings","push-ups","running","squats"],"warmup":"50 JJ, 100 High Knees, 20 Mountain Climbers - 2 rounds","workout":"4 Rounds\n400M, 20 KB Swings, 400M, 20 Goblet SQ, 400M, 20 KB High Pulls\nThen 3 rounds - pushup to failure - 1 min rest","core":"30 Situps, 30 Flutter Kicks, 30 Bicycle Crunches - 2 rounds"},{"id":115,"rating":"Very Hard","duration":48,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Upper Body","movements":["crunches","devil press","flutter kicks","lunges","planks","push-ups","rows","running","squats","triceps"],"wm":["devil press","lunges","push-ups","rows","running","triceps"],"warmup":"2 laps w 10 SQ, 10 pull-up rows","workout":"5 rounds - 10 DB Devil Press\nThen 6 rounds: 16 DB Lunges, 12 DB Skull Crushers, 12 DB Rows ea arm, pushup to failure, 200M run","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Flutter Kicks"},{"id":116,"rating":"Hard","duration":45,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Upper Body + Power","movements":["cleans","crunches","flutter kicks","kb swings","planks","rows","running","squats","step-ups","triceps"],"wm":["cleans","kb swings","rows","running","squats","triceps"],"warmup":"2 laps w 10 SQ, 10 step-ups","workout":"25 Min AMRAP\n20 KB Swings, 15 Goblet SQ, 10 KB Clean & Press, 5 Pull-up Rows, 200M run\nThen: 3 rounds - 10 KB Skull Crushers, 10 KB Rows ea arm","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Flutter Kick, 30s rest"},{"id":117,"rating":"Hard","duration":43,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Full Body","movements":["high pulls","kb swings","kb windmills","planks","push-ups","running","squats"],"wm":["high pulls","kb swings","kb windmills","running","squats"],"warmup":"3 rounds - 100M, 10 SQ, 10 Pushup","workout":"5 KB Windmills ea side\nThen 6 Sets:\n15 KB High Pull, 20 KB Swing, 20 KB Goblet SQ, 200M run","core":"3 * 1 min plank, 30s rest"},{"id":118,"rating":"Very Hard","duration":48,"equipment":"KETTLEBELL","format":"TABATA","focus":"Full Body","movements":["box jumps","burpees","hollow holds","inchworms","kb swings","planks","push-ups","rows","running","squats","step-ups"],"wm":["box jumps","burpees","kb swings","push-ups","rows","running","squats","step-ups"],"warmup":"2 laps w 10 SQ, 5 inch worms","workout":"Tabata 40/20 - 3 rounds\nKB Swings, Step-ups, KB Rows, Push-ups, Box Jumps, Goblet SQ, Pull-up Rows, Burpees\nThen: 4 rounds - 400M, 20 KB Swings","core":"2 rounds - 30s Plank, 30s Side Plank ea side, 30s Hollow Hold"},{"id":119,"rating":"Hard","duration":40,"equipment":"BODYWEIGHT","format":"LADDER","focus":"Full Body","movements":["box jumps","flutter kicks","inchworms","jumping","planks","push-ups","running","sit-ups","squats"],"wm":["box jumps","jumping","push-ups","running"],"warmup":"2 laps w 10 SQ, 10 push-up, 5 inchworms","workout":"Descending Ladder 10-9-8-7-6-5-4-3-2-1\nPush-ups, Tuck Jumps, Box Jumps\nThen: 2 laps run","core":"2 min Plank, 30s rest, 30 Situps, 30 Flutter Kicks"},{"id":120,"rating":"Hard","duration":45,"equipment":"DUMBBELL","format":"SUPERSETS","focus":"Full Body","movements":["box jumps","burpees","curls","deadlifts","dips","flutter kicks","inchworms","lunges","planks","push-ups","rows","running","shoulder press","skipping"],"wm":["box jumps","burpees","curls","deadlifts","dips","lunges","push-ups","rows","shoulder press","skipping"],"warmup":"2 laps w 5 inchworms, 10 SQ","workout":"5 Supersets - 3 rounds each - 30s rest between rounds\n1) 10 DB Deadlifts, 10 Box Jumps\n2) 12 DB Curls, 20 Dips\n3) 10 DB Shoulder Press, 10 Push-ups\n4) 8 DB Renegade Rows, 8 Burpees\n5) 12 DB Lunges, 50 Skips","core":"2 min plank, 50 flutter kicks"},{"id":121,"rating":"Hard","duration":44,"equipment":"KETTLEBELL","format":"EMOM","focus":"Legs","movements":["box jumps","crunches","deadlifts","kb halos","kb swings","leg raises","push-ups","rows","running","russian twists","step-ups"],"wm":["box jumps","deadlifts","kb swings","push-ups","rows","running","step-ups"],"warmup":"2 laps w 10 KB halos, 10 SQ","workout":"5 rounds EMOM - 3 min each\nMin 1: 12 KB Deadlifts + 5 Box Jumps\nMin 2: 8 KB Rows ea arm + 10 Push-ups\nMin 3: 12 KB Swings + 10 Step-ups\nThen 2 rounds suicides 10,20,30M","core":"2 rounds - 10 Leg Raises, 20 Crunches, 20 Russian Twist"},{"id":122,"rating":"Hard","duration":40,"equipment":"KETTLEBELL","format":"TABATA","focus":"Full Body","movements":["kb swings","planks","push-ups","rows","running","sit-ups","skipping","squats"],"wm":["kb swings","push-ups","rows","running","skipping","squats"],"warmup":"2 rounds - 30M Jog, 30M Bumkicks, 30M Carioca, 30M High Knee - 2 rounds","workout":"Reverse Ladder 21-18-15-12-9-6-3\nKB Swings, Pull-up Rows - 30s skipping between rounds\nThen 4 laps w 20 pushups, 20 Goblet Squats","core":"Tabata 40/20 - 4 rounds Plank, 4 rounds Situps"},{"id":123,"rating":"Hard","duration":44,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Full Body","movements":["box jumps","crunches","flutter kicks","gorilla rows","kb swings","planks","running","squats"],"wm":["box jumps","gorilla rows","kb swings","running","squats"],"warmup":"3 laps non-stop","workout":"6 Rounds - 1 min rest\n8 KB Gorilla Rows ea arm, 20 KB Swings, 20 Goblet SQ, 10 Box Jumps, 200M run","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Flutter Kicks, 30s rest"},{"id":124,"rating":"Hard","duration":40,"equipment":"KETTLEBELL","format":"EMOM","focus":"Upper Body","movements":["burpees","dips","flutter kicks","kb swings","planks","push-ups","rows","running","squats"],"wm":["burpees","dips","kb swings","push-ups","rows","running","squats"],"warmup":"3 laps w 10 SQ, 10 pull-up rows","workout":"6 rounds EMOM\nMin 1: 20 KB Swings\nMin 2: 10 Goblet SQ + 5 Burpees\nMin 3: 12 Pull-up Rows + 50M run\nThen: 3 sets push-up to failure, dips to failure - 1 min rest in between","core":"2 min plank, 50 Flutter kicks - 2 rounds"},{"id":125,"rating":"Very Hard","duration":46,"equipment":"DUMBBELL","format":"TABATA","focus":"Upper Body","movements":["burpees","curls","leg raises","mountain climbers","push-ups","rows","running","sit-ups","squats","step-ups","thrusters"],"wm":["burpees","curls","mountain climbers","push-ups","rows","running","squats","step-ups","thrusters"],"warmup":"30M Jog, Bumkicks, side shuffle, High Knees - 2 rounds","workout":"40/20 Tabata - 4 rounds\nDB Thrusters, Step-ups w DB, DB Rows, Burpees, DB Curls, Push-ups, DB SQ, Mountain Climbers\n2 min rest then 4 sets suicides 10,20,30M - 30s in between","core":"3 rounds - 10 Leg Raises, 20 Situps, 30 Mountain Climbers"},{"id":126,"rating":"Hard","duration":45,"equipment":"BODYWEIGHT","format":"TABATA","focus":"Full Body","movements":["box jumps","burpees","crunches","dips","flutter kicks","lunges","mountain climbers","planks","push-ups","running","skaters","squats","v-ups"],"wm":["box jumps","burpees","dips","lunges","mountain climbers","push-ups","skaters","squats"],"warmup":"50 JJ, 100 High Knees, 30 Mountain Climbers - 2 rounds","workout":"Bodyweight Tabata 40/20 - 4 rounds each\n1) Burpees, Box Jumps, Push-up, Squats\n2) Jump Lunges, Dips, Mountain Climbers, Skaters\nThen - 3 rounds pushups to failure, rows to failure - 1 min rest","core":"2 rounds - 30s Plank, 30s Cycle Crunch, 30s Flutter Kicks, 30s V-Up"},{"id":127,"rating":"Hard","duration":40,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Upper Body + Power","movements":["crunches","kb halos","kb swings","planks","push-ups","rows","running","snatches","step-ups"],"wm":["kb swings","push-ups","rows","running","snatches"],"warmup":"2 laps w 5 KB Halos, 10 step-ups","workout":"30 Min AMRAP\n5 KB Snatches ea arm, 15 KB Swings, 12 Pull-up Rows, 10 Push-ups, 100M run","core":"3 rounds - 10 Rev Crunch, 20 Cycle Crunch, 30s Plank"},{"id":128,"rating":"Hard","duration":47,"equipment":"KETTLEBELL","format":"LADDER","focus":"Full Body","movements":["box jumps","flutter kicks","high pulls","kb swings","running","sit-ups","squats","v-ups"],"wm":["box jumps","high pulls","kb swings","running","squats"],"warmup":"25M High Knee, Bumkicks, Side shuffle, Carioca - jog back - 2 rounds","workout":"Sprint Ladder * 2\nRun 100M, Walk 50M, Run 150M, Walk 50M, Run 200M, Walk 50M, Run 250M\nThen: 5 Rounds - 20 KB Swings, 15 Goblet SQ, 10 KB High Pulls, 10 Box Jumps","core":"30 Situps, 20 Flutter Kicks, 10 V-Ups - 3 rounds"},{"id":129,"rating":"Medium","duration":42,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Full Body","movements":["burpees","cleans","kb swings","planks","push-ups","rows","running","squats","suitcase carry"],"wm":["burpees","cleans","kb swings","push-ups","running","squats","suitcase carry"],"warmup":"3 laps w 10 SQ, 10 pull-up rows","workout":"5 Rounds\n100m KB Farmer Carry, 25 KB Swings, 20 Goblet SQ, 10 KB Clean & Press, 5 Burpees\nThen - 3 rounds pushups to failure, rows to failure - 1 min rest","core":"3 * 1 min plank, 30s rest"},{"id":130,"rating":"Hard","duration":43,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Upper Body","movements":["burpees","crunches","curls","hollow holds","lunges","planks","rows","running","shoulder press","squats","triceps"],"wm":["burpees","curls","lunges","rows","running","shoulder press","squats","triceps"],"warmup":"2 laps w 10 SQ, 10 pull-up rows","workout":"21-15-9-6\nDB SQ, DB Push Press, Pull-up Rows, Burpees - 400M run between rounds\nThen: 4 rounds - 20 DB Lunges, 20 Hammer Curls, 20 Skull Crushers","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Hollow Hold"},{"id":131,"rating":"Hard","duration":43,"equipment":"KETTLEBELL","format":"EMOM","focus":"Full Body","movements":["box jumps","burpees","inchworms","kb swings","planks","rows","running","skipping","squats","v-ups"],"wm":["box jumps","burpees","kb swings","rows","skipping","squats"],"warmup":"2 laps w 5 inch worms, 10 SQ","workout":"EMOM 30 min - alternating\nKB Swings x 15, Box Jumps x 10, Pull-up Rows x 15, Goblet SQ x 12, Burpees x 8, Skipping 45s","core":"3 rounds - 30s Plank, 30s Side Plank L, 30s Side Plank R, 15 V-ups"},{"id":132,"rating":"Hard","duration":46,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Full Body","movements":["bulgarian split squats","inchworms","leg raises","planks","push-ups","rows","running","shoulder press","sit-ups","skipping","squats"],"wm":["bulgarian split squats","push-ups","rows","running","shoulder press","skipping","squats"],"warmup":"2 laps w 10 SQ, 5 inchworms","workout":"5 Rounds - 30s rest\n12 DB Bulgarian Split Squats ea leg, 12 DB Rows ea arm, 8 DB Shoulder Press, 50 Skips\nThen: 5 rounds - 200M run, 20 Push-ups","core":"3 rounds - 15 Situps, 15 Leg Raises, 30s Side Plank ea side"},{"id":133,"rating":"Medium","duration":42,"equipment":"BODYWEIGHT","format":"EMOM","focus":"Upper Body","movements":["box jumps","burpees","crunches","dips","lunges","planks","push-ups","running","step-ups"],"wm":["box jumps","burpees","dips","push-ups","running","step-ups"],"warmup":"2 laps w 6 Lizard Lunges, 10 leg swings, 10 arm circles","workout":"8 rounds EMOM\nMin 1: 20 Push-ups\nMin 2: 6 Box Jumps + 10 Step-ups\nMin 3: 10 Dips + 5 Burpees\nThen: 3 suicides 10,20,30M - 30s rest","core":"3 rounds - 30s Plank, 20 Reverse Crunches, 20 Ankle Touches"},{"id":134,"rating":"Hard","duration":46,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Full Body","movements":["box jumps","crunches","hollow holds","kb swings","planks","running","shoulder press","thrusters"],"wm":["box jumps","kb swings","running","shoulder press","thrusters"],"warmup":"2 laps w 10 KB swings, 10 SQ","workout":"5 Rounds - 30s rest between rounds\n30 KB Swings, 8 KB Thrusters ea side, 20 Box Jumps, 6 KB Push Press ea side, 100M Jog, 100M sprint, 100M Jog","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Hollow Hold"},{"id":135,"rating":"Hard","duration":45,"equipment":"DUMBBELL","format":"AMRAP","focus":"Upper Body","movements":["burpees","crunches","curls","flutter kicks","rows","running","shoulder press","squats","step-ups","triceps","v-ups"],"wm":["burpees","curls","rows","running","shoulder press","squats","step-ups","triceps"],"warmup":"15M High Knee, Bumkicks, Carioca, Side shuffle - 3 rounds","workout":"18 Min AMRAP - 12 DB SQ, 12 DB Curls, 8 Shoulder Press, 5 Burpees\n18 Min AMRAP - 10 DB Rows ea arm, 12 DB Skull Crushers, 20 Step-ups, 100M run","core":"3 rounds - 30 Cycle Crunch, 20 Flutter Kicks, 10 V-Ups"},{"id":136,"rating":"Hard","duration":44,"equipment":"KETTLEBELL","format":"LADDER","focus":"Upper Body","movements":["burpees","cleans","crunches","high pulls","kb halos","leg raises","planks","rows","running","squats"],"wm":["burpees","cleans","high pulls","rows","running","squats"],"warmup":"2 laps w 5 KB Halos, 10 pull-up rows","workout":"Ladder 20-18-16-14-12\nKB Clean & Press, Goblet SQ, KB High Pull, Pull-up Rows, Burpees\n400M run between each round","core":"3 rounds - 30s Plank, 20 Bicycle Crunch, 15 Leg Raises"},{"id":137,"rating":"Hard","duration":45,"equipment":"DUMBBELL","format":"AMRAP","focus":"Upper Body","movements":["crunches","curls","lunges","planks","push-ups","rows","running","russian twists","shoulder press","skipping","squats"],"wm":["curls","lunges","push-ups","rows","running","shoulder press","skipping","squats"],"warmup":"2 laps w 10 SQ, 10 Push-ups","workout":"4 Rounds - 1 min each\n12 DB SQ w 3s hold, 16 Hammer Curls, 12 Shoulder Press\nThen 24 Min AMRAP\n6 Pull-up Rows, 10 Push-up, 12 DB Lunges, 50 Skips, 100M run","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Russian Twist"},{"id":138,"rating":"Hard","duration":44,"equipment":"DUMBBELL","format":"LADDER","focus":"Full Body","movements":["box jumps","deadlifts","flutter kicks","inchworms","planks","push-ups","rows","running","sit-ups"],"wm":["box jumps","deadlifts","push-ups","rows","running"],"warmup":"2 laps w 5 inchworms, 10 SQ","workout":"Ladder 15-12-9-6-3-6-9-12-15\nDB Deadlift, DB Rows ea arm, Push-ups, Box Jumps\n200M run between rounds","core":"3 rounds - 30 Situps, 30 Flutter Kicks, 30s Plank"},{"id":139,"rating":"Hard","duration":46,"equipment":"DUMBBELL","format":"EMOM","focus":"Full Body","movements":["box jumps","flutter kicks","hollow holds","mountain climbers","planks","push-ups","rows","running","skipping","step-ups","thrusters"],"wm":["box jumps","push-ups","rows","running","skipping","step-ups","thrusters"],"warmup":"50 JJ, 100 High Knees, 20 Mountain Climbers - 2 rounds","workout":"16 Min EMOM - alternating\nMin 1: 6 DB Thrusters + 5 Box Jumps\nMin 2: 6 DB Rows ea arm + 30 Skips\nThen: 4 rounds - 400M, 20 Push-ups, 15 Step-ups","core":"2 rounds - 30s Plank, 30s Side Plank ea side, 30s Hollow Hold, 30 Flutter Kicks"},{"id":140,"rating":"Medium","duration":44,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Upper Body","movements":["burpees","dips","hollow holds","jumping","planks","push-up t-rotations","push-ups","running"],"wm":["burpees","dips","jumping","push-up t-rotations","push-ups","running"],"warmup":"4 laps non-stop","workout":"4 Corners - 6 rounds/laps (run between corners)\nCorner 1: 10 Push-up to T-Rotation\nCorner 2: 10 Tuck Jumps\nCorner 3: 10 Dips\nCorner 4: 10 Burpees\nThen - 3 rounds pushups to failure, rows to failure - 1 min rest","core":"2 min plank, 1 min hollow hold"},{"id":141,"rating":"Hard","duration":47,"equipment":"KETTLEBELL","format":"EMOM","focus":"Full Body","movements":["hollow holds","kb swings","planks","push-ups","rows","running","squats","step-ups"],"wm":["kb swings","rows","running","squats","step-ups"],"warmup":"2 laps w 10 SQ, 10 Push-ups","workout":"16 Min EMOM alternating\nMin 1: 15 KB Swings + 5 Jump SQ\nMin 2: 8 KB Rows ea arm + 10 step-ups\nThen: 5 rounds - 100M sprint, 100M jog, 100M walk, 100M Jog","core":"3 rounds - 30s Plank, 30s Side Plank L, 30s Side Plank R, 30s Hollow Hold, 30s Rest"},{"id":142,"rating":"Hard","duration":45,"equipment":"DUMBBELL","format":"LADDER","focus":"Upper Body","movements":["burpees","crunches","curls","dips","mountain climbers","planks","rows","running","shoulder press","skipping","squats","step-ups"],"wm":["burpees","curls","dips","mountain climbers","running","shoulder press","skipping","squats","step-ups"],"warmup":"2 laps w 10 SQ, 10 pull-up rows","workout":"3 Rounds (40s on / 20s off)\nDB Curls, DB Push Press, Burpees, Step-ups w DB, Mountain Climbers, DB SQ, Dips, Skipping\nThen: Sprint Ladder - 50M, 100M, 150M, 200M, 150M, 100M, 50M - walk back each time","core":"3 rounds - 30s Plank, 20 Rev Crunch, 20 Ankle Touches"},{"id":143,"rating":"Hard","duration":44,"equipment":"DUMBBELL","format":"TABATA","focus":"Full Body","movements":["box jumps","inchworms","planks","rows","running","sit-ups"],"wm":["box jumps","rows","running"],"warmup":"2 laps w 5 inchworms, 10 SQ","workout":"8 Supersets - Do both sets then rest\n1) 16 DB Chest Press, 12 Box Jumps, 100M - Fast\n2) 12 DB Rows ea arm, 12 Pull-up Rows, 100M - Fast\n1 min rest between supersets","core":"Tabata 40/20 - 4 rounds Plank, 4 rounds Situps"},{"id":144,"rating":"Very Hard","duration":46,"equipment":"DUMBBELL","format":"AMRAP","focus":"Upper Body","movements":["box jumps","crunches","dips","leg raises","man makers","planks","push-ups","rows","running","squats"],"wm":["box jumps","dips","man makers","push-ups","rows","running"],"warmup":"3 rounds - 100M, 10 SQ, 10 Push-up","workout":"35 Min AMRAP\n5 DB Man Makers, 100M, 10 Dips, 10 Box Jumps, 100M\nThen: 3 sets push-ups, pull-up rows to failure - 1 min rest","core":"3 rounds - 30s Plank, 30 Bicycle Crunch, 15 Leg Raises"},{"id":145,"rating":"Hard","duration":47,"equipment":"DUMBBELL","format":"AMRAP","focus":"Full Body","movements":["cleans","crunches","deadlifts","flutter kicks","inchworms","lunges","planks","push-ups","rows","running","skipping","squats","step-ups"],"wm":["cleans","deadlifts","lunges","push-ups","rows","skipping","squats","step-ups"],"warmup":"2 laps w 10 SQ, 5 inch worms, 5 good mornings","workout":"3 rounds - 1 min rest\n20 DB SQ, 15 DB Deadlift, 16 DB Lunges, 12 DB Clean & Press\nThen 25 Min AMRAP\n10 Push-ups, 10 Pull-up Rows, 10 Step-ups, 50 Skips","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Flutter Kicks"},{"id":146,"rating":"Hard","duration":45,"equipment":"DUMBBELL","format":"EMOM","focus":"Cardio","movements":["box jumps","burpees","flutter kicks","rows","running","russian twists","skipping","squats","thrusters"],"wm":["box jumps","burpees","rows","running","skipping","squats","thrusters"],"warmup":"2 laps w 10 SQ, 10 pull-up rows","workout":"9 rounds EMOM (27 min total)\nMin 1: 5 DB Thrusters + 30 Skips\nMin 2: 8 DB Renegade Rows + 4 Burpees\nMin 3: 10 DB SQ + 5 Box Jumps\nThen: 4 suicides 10,20,30M - 30s rest","core":"50 Russian Twist, 50 Flutter Kicks"},{"id":147,"rating":"Medium","duration":35,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Full Body","movements":["box jumps","crunches","jumping jacks","planks","push-ups","running","sit-ups","squats"],"wm":["box jumps","push-ups","running","squats"],"warmup":"3 rounds - 20 Jumping Jacks, 10 SQ, 10 Push-up","workout":"Pyramid 5-10-15-20-30-20-15-10-5\nBox Jumps, Push-ups, Squats, Rows\n200M run between each round","core":"3 rounds - 15 Situp, 15 Rev Crunch, 30s Side Plank ea side"},{"id":148,"rating":"Hard","duration":43,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Legs","movements":["box jumps","burpees","crunches","deadlifts","planks","push-ups","rows","running","squats","step-ups"],"wm":["box jumps","burpees","deadlifts","push-ups","rows","squats"],"warmup":"2 laps w 10 SQ, 10 step-ups","workout":"25 Min AMRAP\n15 KB Deadlifts, 12 KB Rows ea side, 10 Goblet SQ, 8 Box Jumps, 6 Burpees\nThen: 3 sets pushup, pull-up rows to failure - 1 min rest","core":"Tabata 40/20 - 4 rounds Plank, 4 rounds Crunches"},{"id":149,"rating":"Medium","duration":38,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Upper Body","movements":["crunches","curls","hollow holds","lunges","planks","push-ups","running","squats"],"wm":["curls","lunges","push-ups","running","squats"],"warmup":"2 laps w 10 SQ, 10 Push-ups","workout":"Pyramid 5-10-15-20-30-20-15-10-5\nDB Curls, Push-ups, DB SQ, DB Lunges\n200M run between each round","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Hollow Hold, 30s rest"},{"id":150,"rating":"Very Hard","duration":50,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Upper Body","movements":["box jumps","burpees","dips","planks","rows","running","shoulder press","squats"],"wm":["box jumps","burpees","dips","rows","running","shoulder press","squats"],"warmup":"15M High Knee, Bumkicks, Carioca, side shuffle - jog back each - 3 rounds","workout":"3 Rounds\n400M, 25 DB SQ, 400M, 15 DB Push Press, 400M, 15 Burpees, 400M\nThen: 4 rounds - 20 Pull-up Rows, 20 Dips, 20 Box Jumps","core":"3 rounds - 30s Plank, 30s Side Plank ea side, 30s rest"},{"id":151,"rating":"Hard","duration":44,"equipment":"DUMBBELL","format":"LADDER","focus":"Upper Body","movements":["box jumps","burpees","crunches","deadlifts","dips","flutter kicks","inchworms","planks","push-ups","rows","running","shoulder press"],"wm":["box jumps","burpees","deadlifts","dips","push-ups","rows","running","shoulder press"],"warmup":"2 laps w 5 inchworms, 10 SQ","workout":"Descending Ladder 20-18-16-14-12-10-8-6-4-2\nDB Deadlift, DB Push Press, Pull-up Rows, Box Jumps, Burpees\n100M run between each round\nThen: 3 sets push-up to failure, dips to failure","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30 Flutter Kicks"},{"id":152,"rating":"Very Hard","duration":48,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Upper Body","movements":["burpees","dips","flutter kicks","inchworms","push-ups","running","sit-ups"],"wm":["burpees","dips","push-ups","running"],"warmup":"2 laps w 5 inchworms, push-up at bottom of each","workout":"6 rounds - 400M run then 20 Burpees during rest\nThen: 5 sets - push-up to failure, dips to failure, 1 min rest between","core":"50 Situps, 50 Flutter Kicks - 2 rounds"},{"id":153,"rating":"Hard","duration":48,"equipment":"DUMBBELL","format":"AMRAP","focus":"Upper Body","movements":["box jumps","burpees","crunches","curls","lunges","planks","rows","running","shoulder press","sit-ups","skipping","squats","thrusters","triceps"],"wm":["box jumps","burpees","curls","rows","shoulder press","skipping","thrusters","triceps"],"warmup":"2 laps w 10 SQ, 5 lizard lunges","workout":"4 Rounds - 30s rest\n15 DB Rows (ea arm), 16 DB Curls, 10 DB Shoulder Press, 12 DB Skull Crushers, 8 DB Thrusters\nThen 25 Min AMRAP\n60 Skips, 10 Box Jumps, 10 Pull-up Rows, 5 Burpees","core":"2 rounds - 30 Situps, 30 Bicycle Crunch, 30s Plank"},{"id":154,"rating":"Medium","duration":43,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Upper Body","movements":["box jumps","dips","plank to down dog","planks","push-ups","rows","running","russian twists","squats","v-ups"],"wm":["box jumps","dips","plank to down dog","planks","push-ups","rows","running"],"warmup":"2 laps w 10 SQ, 10 Push-ups","workout":"4 rounds - 1 min rest\n10 Plank to Down Dog, 12 DB Rows ea arm, 15 Box Jumps, 15 DB SQ\nThen 3 rounds - 400M, 15 Push-ups, 10 Dips","core":"3 rounds - 30s Plank, 30 Russian Twist, 15 V-Ups"},{"id":155,"rating":"Hard","duration":44,"equipment":"DUMBBELL","format":"EMOM","focus":"Full Body","movements":["burpees","crunches","hollow holds","planks","rows","running","skipping","squats","step-ups","thrusters"],"wm":["burpees","rows","skipping","squats","step-ups","thrusters"],"warmup":"3 laps non-stop","workout":"EMOM 30 min - alternating exercises\nDB Thrusters x 10, DB Step-ups x 8, Pull-up Rows x 12, DB SQ x 12, Burpees x 8, Skipping 45s","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Hollow Hold"},{"id":156,"rating":"Hard","duration":45,"equipment":"DUMBBELL","format":"AMRAP","focus":"Upper Body","movements":["box jumps","crunches","deadlifts","dips","planks","push-ups","rows","running","shoulder press","squats"],"wm":["box jumps","deadlifts","dips","push-ups","rows","running","shoulder press"],"warmup":"2 laps w 10 SQ, 10 pull-up rows","workout":"25 Min AMRAP\n10 DB Deadlifts, 10 DB Push Press, 10 Dips, 10 Box Jumps, 100M run\nThen: 3 sets pushup, pull-up rows to failure - 1 min rest","core":"Tabata 40/20 - 4 rounds Plank, 4 rounds Crunches"},{"id":157,"rating":"Hard","duration":45,"equipment":"BODYWEIGHT","format":"CHIPPER","focus":"Upper Body","movements":["box jumps","burpees","hollow holds","planks","push-ups","rows","running","squats"],"wm":["box jumps","burpees","push-ups","rows","running","squats"],"warmup":"3 laps non-stop","workout":"Complete the following once through for time:\n60 Squats, 50 Push-ups, 40 Box Jumps, 30 Burpees, 20 Pull-up Rows\n400M Run\n20 Pull-up Rows, 30 Burpees, 40 Box Jumps, 50 Push-ups, 60 Squats","core":"3 rounds - 30s Plank, 30s Side Plank L, 30s Side Plank R, 30s Hollow Hold"},{"id":158,"rating":"Hard","duration":44,"equipment":"KETTLEBELL","format":"CHIPPER","focus":"Full Body","movements":["box jumps","burpees","cleans","crunches","flutter kicks","high pulls","kb swings","planks","rows","running","squats","step-ups"],"wm":["box jumps","burpees","cleans","high pulls","kb swings","rows","running","squats","step-ups"],"warmup":"3 laps w 10 SQ, 10 KB swings","workout":"Complete the following once through for time:\n50 KB Swings, 40 Step-ups, 35 Goblet SQ, 30 Pull-up Rows, 25 KB High Pulls, 20 Box Jumps, 20 Burpees, 15 KB Clean & Press (ea arm), 400M run","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Flutter Kick"},{"id":159,"rating":"Very Hard","duration":48,"equipment":"DUMBBELL","format":"CHIPPER","focus":"Upper Body","movements":["curls","inchworms","planks","rows","running","shoulder press","sit-ups","squats","thrusters"],"wm":["curls","rows","running","shoulder press","squats","thrusters"],"warmup":"3 laps w 5 inchworms, 10 SQ","workout":"Complete the following once through for time:\n50 DB SQ, 40 DB Curls, 30 DB Push Press, 20 DB Rows ea arm, 15 DB Thrusters, 800M run, 15 DB Thrusters, 20 DB Rows ea arm, 30 DB Push Press, 40 DB Curls, 50 DB SQ","core":"2 min Plank, 30 Situps"},{"id":160,"rating":"Hard","duration":43,"equipment":"BODYWEIGHT","format":"DEATH BY EMOM","focus":"Upper Body","movements":["box jumps","burpees","flutter kicks","push-ups","rows","running","sit-ups","squats"],"wm":["box jumps","burpees","push-ups","rows","running"],"warmup":"2 laps w 10 SQ, 10 push-up","workout":"EMOM — add 1 rep each minute until you can't complete in time\nStart: 1 Burpees + 2 Box Jumps. Each minute add 1 burpee + 1 box jump.\nWhen you fail, rest remainder of that round, then do:\n4 rounds - 20 Pull-up Rows, 20 Push-ups, 400M","core":"50 Situps, 30 Flutter Kicks - 2 rounds"},{"id":161,"rating":"Hard","duration":42,"equipment":"KETTLEBELL","format":"DEATH BY EMOM","focus":"Full Body","movements":["kb swings","planks","push-ups","running","squats"],"wm":["kb swings","push-ups","running","squats"],"warmup":"2 laps w 10 KB swings, 10 SQ","workout":"EMOM — start with 3 KB Swings + 1 Goblet SQ. Add 1 swing + 1 SQ each minute.\nContinue until you can't complete within the minute.\nThen: 4 rounds - 400M, 20 KB Swings, 20 Push-ups","core":"3 * 1 min plank, 30s rest"},{"id":162,"rating":"Hard","duration":43,"equipment":"BODYWEIGHT","format":"DECK OF CARDS","focus":"Full Body","movements":["box jumps","burpees","crunches","hollow holds","inchworms","planks","push-ups","running","squats"],"wm":["box jumps","burpees","push-ups","running","squats"],"warmup":"2 laps w 10 SQ, 5 inchworms","workout":"Shuffle a deck. Flip one card at a time. Card value = reps (2-9, J/Q/K=10)\n♠ Spades = Burpees\n♥ Hearts = Push-ups\n♦ Diamonds = Squats\n♣ Clubs = Box Jumps\nAce & Joker (if present) = 200M sprint\nWork through as many cards as possible in 30 mins","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Hollow Hold"},{"id":163,"rating":"Hard","duration":43,"equipment":"KETTLEBELL","format":"DECK OF CARDS","focus":"Legs","movements":["crunches","flutter kicks","kb halos","kb swings","planks","rows","running","squats","step-ups"],"wm":["kb swings","rows","running","squats","step-ups"],"warmup":"2 laps w 5 KB halos, 10 SQ","workout":"Shuffle a deck. Card value = reps (2-9, J/Q/K=10)\n♠ Spades = KB Swings\n♥ Hearts = Goblet SQ\n♦ Diamonds = Pull-up Rows\n♣ Clubs = Step-ups\nAce/Joker = 200M sprint\nWork through as many cards as possible in 30 mins","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Flutter Kick, 30s rest"},{"id":164,"rating":"Very Hard","duration":40,"equipment":"KETTLEBELL","format":"FIGHT GONE BAD","focus":"Full Body","movements":["box jumps","burpees","crunches","hollow holds","kb swings","planks","rows","running","squats"],"wm":["box jumps","burpees","kb swings","rows","squats"],"warmup":"2 laps w 10 SQ, 10 pull-up rows","workout":"1 min at each station, rotate immediately. 1 min rest after each full round. 5 rounds.\nStation 1: KB Swings (max reps)\nStation 2: Box Jumps (max reps)\nStation 3: Pull-up Rows (max reps)\nStation 4: Goblet SQ (max reps)\nStation 5: Burpees (max reps)\nTrack total reps each round","core":"3 rounds - 30s Plank, 30 Bicycle Crunch, 30s Hollow Hold"},{"id":165,"rating":"Very Hard","duration":45,"equipment":"DUMBBELL","format":"FIGHT GONE BAD","focus":"Full Body","movements":["hollow holds","planks","push-ups","rows","skipping","squats","step-ups","thrusters"],"wm":["push-ups","rows","skipping","step-ups","thrusters"],"warmup":"3 rounds - 20 JJ, 10 SQ, 10 Arm circles","workout":"1 min at each station, rotate immediately. 1 min rest after full round. 5 rounds.\nStation 1: DB Thrusters\nStation 2: Step-ups w DB\nStation 3: DB Rows (alt arms)\nStation 4: Skipping\nStation 5: Push-ups\nTrack total reps. Try to beat your score each round.","core":"3 rounds - 30s Plank, 30s Side Plank ea side, 30s Hollow Hold"},{"id":166,"rating":"Hard","duration":45,"equipment":"BODYWEIGHT","format":"INTERVAL PYRAMID","focus":"Full Body","movements":["box jumps","burpees","crunches","flutter kicks","inchworms","planks","push-ups","running","squats"],"wm":["box jumps","burpees","push-ups","squats"],"warmup":"2 laps w 10 SQ, 5 inchworms","workout":"Pyramid of work:rest intervals. Same exercises throughout:\nBurpees, Box Jumps, Push-ups, Squats\n20s on/40s rest x 1 round\n30s on/30s rest x 2 rounds\n40s on/20s rest x 3 rounds\n50s on/10s rest x 2 rounds\n20s on/40s rest x 1 round (cool-down)","core":"2 rounds - 30s Plank, 30s Cycle Crunch, 30s Flutter Kicks"},{"id":167,"rating":"Hard","duration":45,"equipment":"KETTLEBELL","format":"INTERVAL PYRAMID","focus":"Full Body","movements":["box jumps","kb swings","planks","rows","running","squats"],"wm":["box jumps","kb swings","rows","squats"],"warmup":"2 laps w 10 KB swings, 10 SQ","workout":"Pyramid of work:rest. Exercises: KB Swings, Goblet SQ, Pull-up Rows, Box Jumps\n20s work/40s rest x 1 rounds\n30s work/30s rest x 2 rounds\n40s work/20s rest x 3 rounds\n50s work/10s rest x 2 rounds\n30s work/30s rest x 1 round (finish)","core":"2 * 1 min Plank, 30s rest"},{"id":168,"rating":"Medium","duration":47,"equipment":"KETTLEBELL","format":"GRIND","focus":"Legs","movements":["box jumps","deadlifts","planks","push-ups","rows","running","squats"],"wm":["box jumps","deadlifts","push-ups","rows","running","squats"],"warmup":"3 rounds - 100M, 10 SQ (3s down, 3s hold), 10 Pushup","workout":"All reps at SLOW tempo (3s down, 2s hold, 1s up)\n5 sets x 8 KB Deadlifts - 1 min rest\n5 sets x 6 Goblet SQ w 5s hold at bottom - 1 min rest\n5 sets x 8 KB Rows ea arm - 30s rest\nThen 4 rounds: 400M, 10 Box Jumps, 10 Push-ups","core":"3 rounds - 30s Plank, 30s Side Plank ea side, 30s rest"},{"id":169,"rating":"Medium","duration":46,"equipment":"DUMBBELL","format":"GRIND","focus":"Full Body","movements":["deadlifts","hollow holds","leg raises","planks","running","shoulder press","squats"],"wm":["deadlifts","shoulder press","squats"],"warmup":"3 laps w 5 good mornings, 10 SQ (slow)","workout":"All reps SLOW (3s down, 2s hold, explosive up)\n5 sets x 8 DB Deadlifts - 30s rest\n5 sets x 6 DB Shoulder Press w 3s hold at top - 30s rest\n5 sets x 8 DB Bent-over Row ea arm - 30s rest\n5 sets x 8 DB SQ w 5s hold at bottom - 30s rest","core":"3 rounds - 30s Plank, 30s Hollow Hold, 15 Leg Raises"},{"id":170,"rating":"Hard","duration":44,"equipment":"BODYWEIGHT","format":"ACCUMULATOR","focus":"Upper Body","movements":["box jumps","burpees","dips","flutter kicks","mountain climbers","push-ups","rows","running","sit-ups","squats"],"wm":["box jumps","burpees","dips","mountain climbers","push-ups","rows","running","squats"],"warmup":"2 laps w 10 SQ, 10 push-ups","workout":"Add one exercise each round. Do all previous exercises before adding the next.\nRound 1: 10 Burpees\nRound 2: + 15 Box Jumps\nRound 3: + 20 Push-ups\nRound 4: + 100M run\nRound 5: + 20 Squats\nRound 6: + 15 Pull-up Rows\nRound 7: + 40 Mountain Climbers\nRound 8: + 15 Dips\n30s rest between rounds","core":"50 Situps, 30 Flutter Kicks"},{"id":171,"rating":"Hard","duration":43,"equipment":"KETTLEBELL","format":"ACCUMULATOR","focus":"Upper Body + Power","movements":["burpees","cleans","crunches","high pulls","hollow holds","inchworms","kb swings","planks","rows","running","squats"],"wm":["burpees","cleans","high pulls","kb swings","rows","running","squats"],"warmup":"2 laps w 10 KB swings, 5 inch worms","workout":"Add one exercise each round. Repeat all previous before adding new.\nRound 1: 10 KB Swings\nRound 2: + 10 Goblet SQ\nRound 3: + 10 KB High Pulls\nRound 4: + 200M run\nRound 5: + 15 Pull-up Rows\nRound 6: + 8 KB Clean & Press (ea arm)\nRound 7: + 20 Burpees\n30s rest between rounds","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Hollow Hold"},{"id":172,"rating":"Hard","duration":45,"equipment":"KETTLEBELL","format":"FOR TIME","focus":"Full Body","movements":["hollow holds","kb swings","planks","push-ups","rows","running","squats"],"wm":["kb swings","push-ups","rows","running","squats"],"warmup":"3 laps non-stop","workout":"Complete for time (aim for under 30 min)\n5 rounds:\n400M run\n20 KB Swings\n20 Goblet SQ\n20 Pull-up Rows\n20 Push-ups\nRecord your time and try to beat it next session","core":"3 rounds - 30s Plank, 30s Side Plank L, 30s Side Plank R, 30s Hollow Hold"},{"id":173,"rating":"Hard","duration":42,"equipment":"DUMBBELL","format":"FOR TIME","focus":"Upper Body","movements":["box jumps","curls","flutter kicks","inchworms","planks","push-ups","rows","running","sit-ups","squats","step-ups","thrusters"],"wm":["box jumps","curls","push-ups","rows","running","step-ups","thrusters"],"warmup":"2 laps w 10 SQ, 5 inchworms","workout":"Complete for time (aim for under 30 min)\n21-15-9:\nDB Thrusters, Pull-up Rows, Box Jumps - 1 lap run\nThen 21-15-9:\nPush-ups, Step-ups, DB Curls - 1 lap run\nRecord your time","core":"2 min Plank, 30 Situps, 30 Flutter Kicks - 2 rounds"},{"id":174,"rating":"Very Hard","duration":48,"equipment":"BODYWEIGHT","format":"FOR TIME","focus":"Upper Body","movements":["burpees","crunches","dips","flutter kicks","mountain climbers","planks","push-ups","running","squats"],"wm":["burpees","dips","mountain climbers","push-ups","running","squats"],"warmup":"15M High Knee, Bumkicks, Carioca, Side shuffle - 3 rounds","workout":"Complete for time (aim for under 35 min)\n120 Push-ups\n150 Squats\n120 Dips\n200 Mountain Climbers\n60 Burpees\n400M run in between each exercise\nPartition reps any way you like","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30 Flutter Kicks"},{"id":175,"rating":"Hard","duration":44,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Full Body","movements":["box jumps","crunches","flutter kicks","kb around the world","kb swings","planks","running","squats"],"wm":["box jumps","kb around the world","kb swings","running","squats"],"warmup":"2 laps w 10 KB Around the World each direction","workout":"5 rounds - 30s rest\n10 KB Around the World ea direction, 20 KB Swings, 20 Goblet SQ, 20 Box Jumps, 400M","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Flutter Kicks"},{"id":176,"rating":"Hard","duration":43,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Upper Body","movements":["box jumps","broad jumps","copenhagen planks","dips","lateral broad jumps","lunges","planks","push-ups","running"],"wm":["box jumps","broad jumps","dips","lateral broad jumps","push-ups","running"],"warmup":"2 laps w 6 Lizard Lunges, 10 Leg swings","workout":"6 rounds - 30s rest\n20 Lateral Broad Jumps (side to side), 20 Push-ups, 20 Dips, 20 Box Jumps, 400M run","core":"3 rounds - 30s Plank, 15 Copenhagen Plank L, 15 Copenhagen Plank R"},{"id":177,"rating":"Very Hard","duration":44,"equipment":"DUMBBELL","format":"AMRAP","focus":"Full Body","movements":["bear complex","crunches","curls","deadlifts","hollow holds","planks","push-ups","rows","running","shoulder press","squats"],"wm":["bear complex","curls","deadlifts","push-ups","rows","running","shoulder press","squats"],"warmup":"2 laps w 10 SQ, 10 pull-up rows","workout":"32 Min AMRAP\n10 DB Bear Complex (deadlift→clean→front squat→push press as one flow), 10 DB Curls, 10 Pull-up Rows, 10 Push-ups, 100M","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Hollow Hold"},{"id":178,"rating":"Hard","duration":44,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Full Body","movements":["box jumps","burpees","hollow holds","kb swings","mountain climbers","planks","running","suitcase carry"],"wm":["box jumps","burpees","kb swings","suitcase carry"],"warmup":"50 JJ, 100 High Knees, 20 Mountain Climbers - 2 rounds","workout":"32 Min AMRAP\n50M Suitcase Carry (one KB, switch hands at 25M), 20 KB Swings, 20 Box Jumps, 10 Burpees","core":"3 rounds - 30s Plank, 30s Side Plank ea side, 30s Hollow Hold"},{"id":179,"rating":"Hard","duration":44,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Legs","movements":["crunches","flutter kicks","inchworms","lateral lunges","lunges","planks","push-ups","rows","running","shoulder press","skipping","squats"],"wm":["lateral lunges","lunges","push-ups","rows","running","shoulder press","skipping"],"warmup":"2 laps w 10 SQ, 5 inchworms","workout":"6 rounds - 30s rest\n10 DB Lateral Lunge ea side, 10 DB Shoulder Press, 10 DB Rows ea arm, 60 Skips, 400M run\nThen pushup to failure, pull-up row to failure - 1 min rest","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Flutter Kicks"},{"id":180,"rating":"Medium","duration":43,"equipment":"BODYWEIGHT","format":"AMRAP","focus":"Upper Body","movements":["broad jumps","burpees","dips","hollow body rocks","hollow holds","planks","push-ups","running"],"wm":["broad jumps","burpees","dips","push-ups","running"],"warmup":"4 laps non-stop","workout":"30 Min AMRAP\n20 Broad Jumps for distance, 15 Push-ups, 10 Dips, 5 Burpees, 200M run","core":"3 rounds - 30s Plank, 15 Hollow Body Rocks, 30s Side Plank ea side"},{"id":181,"rating":"Hard","duration":43,"equipment":"KETTLEBELL","format":"EMOM","focus":"Legs","movements":["box jumps","deadlifts","kb swings","planks","push-ups","rows","running","sit-ups","squats","v-ups"],"wm":["box jumps","deadlifts","kb swings","push-ups","rows","running","squats"],"warmup":"2 laps w 10 KB swings, 10 SQ","workout":"EMOM 30 min - alternating:\nMin 1: 8 KB Single Leg Deadlift ea leg\nMin 2: 12 KB Swings + 5 Box Jumps\nMin 3: 10 KB Rows ea arm + 10 Push-ups\nMin 4: 10 Goblet SQ + 100M","core":"3 rounds - 30 Situps, 20 V-Ups, 30s Plank"},{"id":182,"rating":"Hard","duration":44,"equipment":"DUMBBELL","format":"LADDER","focus":"Legs","movements":["burpees","crunches","curls","inchworms","leg raises","lunges","mountain climbers","planks","rows","running","squats","step-ups"],"wm":["burpees","curls","lunges","mountain climbers","rows","running","squats","step-ups"],"warmup":"2 laps w 5 inchworms, 10 SQ","workout":"4 rounds (40s on/20s off)\nDB Lateral Raise, Step-ups w DB, DB Renegade Row, Jump Lunges, DB Curls, Mountain Climbers, DB SQ, Burpees\nThen: Sprint Ladder - 30-60s rest in between - 50M, 100M, 200M, 100M , 50M","core":"3 rounds - 30s Plank, 30 Bicycle Crunch, 15 Leg Raises"},{"id":183,"rating":"Hard","duration":44,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Upper Body + Power","movements":["crunches","gorilla rows","hollow holds","kb halos","kb swings","planks","push-ups","rows","running","step-ups","thrusters"],"wm":["gorilla rows","kb swings","push-ups","rows","running","step-ups","thrusters"],"warmup":"2 laps w 10 KB halos, 10 SQ","workout":"5 rounds - 30s rest\n10 KB Gorilla Rows ea arm, 20 KB Swings, 12 KB Thrusters, 20 Step-ups, 400M run\nThen: 3 rounds - push-up to failure, pull-up row to failure - 30s rest","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Hollow Hold"},{"id":184,"rating":"Hard","duration":44,"equipment":"BODYWEIGHT","format":"EMOM","focus":"Upper Body","movements":["box jumps","burpees","dips","push-up t-rotations","push-ups","running","sit-ups","squats"],"wm":["box jumps","burpees","dips","push-up t-rotations","push-ups","running"],"warmup":"3 rounds - 30 JJ, 10 SQ, 10 Push-ups, 100M","workout":"8 rounds EMOM\nMin 1: 15 Push-up to T-Rotation\nMin 2: 10 Box Jumps + 10 Dips\nMin 3: 10 Burpees\nThen: 4 suicides 10,20,30M - 30s rest","core":"100 Situps"},{"id":185,"rating":"Very Hard","duration":47,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Full Body","movements":["bear complex","box jumps","deadlifts","hollow holds","planks","rows","running","shoulder press","squats"],"wm":["bear complex","box jumps","deadlifts","rows","running","shoulder press","squats"],"warmup":"2 laps w 10 SQ, 10 pull-up rows","workout":"6 rounds - 30s rest\n8 DB Bear Complex (deadlift→clean→front squat→push press as one flow), 20 DB Chest Press, 20 Pull-up Rows, 20 Box Jumps, 400M run","core":"3 rounds - 30s Plank, 30s Side Plank ea side, 30s Hollow Hold"},{"id":186,"rating":"Hard","duration":45,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Upper Body + Power","movements":["crunches","kb around the world","kb swings","kb windmills","planks","push-ups","rows","running","turkish get-ups","v-ups"],"wm":["kb swings","push-ups","rows","running","turkish get-ups"],"warmup":"2 laps w 10 KB Around the World, 5 KB windmills ea side","workout":"6 rounds - 30s rest\n10 KB Swings, 3 KB Turkish Get-Up ea side, 400M run\nThen: 3 rounds - 20 Pull-up Rows, 20 Push-ups","core":"2 rounds - 30s Plank, 15 V-Ups, 30 Bicycle Crunch"},{"id":187,"rating":"Hard","duration":46,"equipment":"KETTLEBELL","format":"RUNNING CLOCK","focus":"Full Body","movements":["burpees","cleans","crunches","hollow holds","kb swings","planks","rows","running","squats"],"wm":["burpees","cleans","kb swings","rows","running","squats"],"warmup":"2 laps w 10 SQ, 10 KB swings","workout":"Set a 35-min clock. At each 5-min mark, stop and do:\n0-5 min: 800M run\n5-10 min: 20 KB Swings + 20 Goblet SQ * 2\n10-15 min: 800M run\n15-20 min: 20 KB Swings + 20 Pull-up Rows * 2\n20-25 min: 800M run\n25-30 min: 20 KB Swings + 10 KB Clean & Press (ea arm) * 2\n30-35 min: max burpees in remaining time","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Hollow Hold"},{"id":188,"rating":"Hard","duration":44,"equipment":"DUMBBELL","format":"LADDER","focus":"Upper Body","movements":["broad jumps","crunches","flutter kicks","inchworms","planks","push-ups","rows","running","shoulder press","squats"],"wm":["broad jumps","push-ups","rows","running","shoulder press","squats"],"warmup":"2 laps w 10 SQ, 5 inchworms","workout":"Ladder 24-20-16-12-8-4\nDB SQ, DB Push Press, Pull-up Rows, Push-up, Broad Jumps\n400M run between each round","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30 Flutter Kicks"},{"id":189,"rating":"Hard","duration":43,"equipment":"BODYWEIGHT","format":"RUNNING CLOCK","focus":"Full Body","movements":["box jumps","burpees","dips","jumping","mountain climbers","planks","push-ups","running","sit-ups","squats","step-ups"],"wm":["box jumps","burpees","dips","jumping","mountain climbers","push-ups","running","squats","step-ups"],"warmup":"3 laps non-stop","workout":"Set a 30-min clock\n0:00 - 10:00: AMRAP - 10 Box Jumps, 10 Dips, 10 Push-ups\n10:00 - 20:00: AMRAP - 5 Burpees, 10 Squats, 100M run\n20:00 - 30:00: AMRAP - 20 Mountain Climbers, 10 Step-ups, 5 Tuck Jumps\nNote rounds completed in each block","core":"2 min Plank, 50 Situps"},{"id":190,"rating":"Medium","duration":42,"equipment":"KETTLEBELL","format":"ROUNDS","focus":"Full Body","movements":["box jumps","crunches","dips","kb swings","planks","push-ups","rows","running","squats","suitcase carry"],"wm":["box jumps","dips","kb swings","push-ups","rows","running","squats","suitcase carry"],"warmup":"2 laps w 10 KB swings, 10 SQ","workout":"5 rounds - 30s rest\n50M Suitcase Carry L + 50M Suitcase Carry R, 25 KB Swings, 20 Goblet SQ, 15 uneven pushups, 10 Box Jumps\n2 laps w 10 bar rows, 10 Dips","core":"3 rounds - 30s Plank, 20 Reverse Crunch, 20 Ankle Touches"},{"id":191,"rating":"Very Hard","duration":48,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Full Body","movements":["bear complex","box jumps","crunches","deadlifts","hollow holds","inchworms","lateral lunges","lunges","planks","rows","running","shoulder press","skipping","squats"],"wm":["bear complex","box jumps","deadlifts","lateral lunges","lunges","rows","running","shoulder press","skipping","squats"],"warmup":"2 laps w 5 inchworms, 10 SQ","workout":"6 rounds - 30s rest\n8 DB Bear Complex (deadlift→clean→front squat→push press as one flow), 12 DB Lateral Lunges ea side, 10 DB Rows ea arm, 50 Skips\nThen: 4 rounds - 400M, 15 Box Jumps, 15 Pull-up Rows","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Hollow Hold"},{"id":192,"rating":"Hard","duration":44,"equipment":"BODYWEIGHT","format":"ROUNDS","focus":"Upper Body","movements":["box jumps","broad jumps","burpees","copenhagen planks","dips","planks","push-up t-rotations","push-ups","running","squats"],"wm":["box jumps","broad jumps","burpees","dips","push-up t-rotations","push-ups","running"],"warmup":"2 laps w 10 SQ, 10 push-ups","workout":"4 Corners - 6 rounds/laps (run between corners)\nCorner 1: 10 Broad Jumps\nCorner 2: 10 Burpees\nCorner 3: 10 Dips + 10 Push-up to T-Rotation\nCorner 4: 10 Box Jumps","core":"3 rounds - 30s Plank, 15 Copenhagen Plank L, 15 Copenhagen Plank R"},{"id":193,"rating":"Hard","duration":44,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Full Body","movements":["hollow holds","kb swings","kb windmills","planks","rows","running","turkish get-ups"],"wm":["kb swings","rows","running","turkish get-ups"],"warmup":"2 laps w 10 KB swings, 5 KB windmills ea side","workout":"30 Min AMRAP\n2 KB Turkish Get-Ups ea side, 20 KB Swings, 12 Pull-up Rows, 200M run","core":"3 rounds - 30s Plank, 30s Side Plank ea side, 30s Hollow Hold"},{"id":194,"rating":"Very Hard","duration":48,"equipment":"DUMBBELL","format":"CHIPPER","focus":"Upper Body","movements":["box jumps","burpees","curls","dips","lunges","push-ups","rows","running","sit-ups","squats","thrusters","triceps"],"wm":["box jumps","burpees","curls","dips","lunges","rows","running","squats","thrusters","triceps"],"warmup":"3 rounds - 100M, 10 SQ, 10 Push-up","workout":"Complete once through for time:\n50 DB SQ, 40 DB Lunges, 15 DB Rows ea arm, 24 DB Curls, 20 DB Skull Crushers 15 DB Thrusters,  800M run, 20 Pull-up Rows, 30 Dips, 40 Box Jumps, 50 Burpees","core":"100 Situps"},{"id":195,"rating":"Hard","duration":44,"equipment":"DUMBBELL","format":"EMOM","focus":"Full Body","movements":["box jumps","crunches","curls","flutter kicks","planks","rows","running","skipping","squats"],"wm":["box jumps","curls","rows","running","skipping","squats"],"warmup":"2 laps w 10 SQ, 10 pull-up rows","workout":"8 rounds EMOM\nMin 1: 6 DB Lateral Raises + 10 DB Curls\nMin 2: 10 DB SQ + 5 Box Jumps\nMin 3: 5 DB Rows ea arm + 30 Skips\nThen: 4 suicides 10,20,30M - 30s rest","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30 Flutter Kicks"},{"id":196,"rating":"Very Hard","duration":48,"equipment":"BODYWEIGHT","format":"LADDER","focus":"Full Body","movements":["box jumps","burpees","crunches","dips","planks","running"],"wm":["box jumps","burpees","dips","running"],"warmup":"15M High Knee, Bumkicks, Carioca, Side shuffle - 3 rounds","workout":"Ladder 1-2-3-4-5-6-7-8-9-10-11-12-13-14-15 (increasing)\nBurpees + Box Jumps + Dips\n100M run between each round","core":"3 rounds - 30s Plank, 30s Side Plank ea side, 30 Bicycle Crunch"},{"id":197,"rating":"Medium","duration":48,"equipment":"KETTLEBELL","format":"GRIND","focus":"Full Body","movements":["hollow holds","kb swings","planks","rows","running","squats"],"wm":["kb swings","rows","running","squats"],"warmup":"2 laps w 10 SQ (3s down, 3s hold), 5 good mornings","workout":"Tempo work - 3s lower, 2s hold, 1s up\n5 sets x 8 KB Goblet SQ (5s hold at bottom) - 1 min rest\n5 sets x 8 KB Rows ea arm (2s hold at top) - 30s rest\n4 rounds - 1 lap run, 21 KB Swings (explosive)","core":"3 rounds - 30s Plank, 30s Side Plank ea side, 30s Hollow Hold"},{"id":198,"rating":"Very Hard","duration":46,"equipment":"DUMBBELL","format":"TABATA","focus":"Legs + Power","movements":["bear complex","box jumps","burpees","deadlifts","planks","push-ups","rows","running","shoulder press","sit-ups","squats"],"wm":["bear complex","box jumps","burpees","deadlifts","push-ups","rows","running","shoulder press","squats"],"warmup":"3 rounds - 200M, 10 SQ, 10 Pushup","workout":"Supersets - 8 rounds of 2 exercise sets\n1) 10 DB Deadlifts + 10 Box Jumps, 200M\n2) 8 DB Bear Complex (deadlift→clean→front squat→push press as one flow) + 10 Burpees, 200M\n1 min rest between supersets\nThen Pushup to failure, Pull-up Row to Failure - 1 min rest","core":"Tabata 40/20 - 4 rounds Plank, 4 rounds Situps"},{"id":199,"rating":"Hard","duration":43,"equipment":"KETTLEBELL","format":"AMRAP","focus":"Full Body","movements":["box jumps","crunches","flutter kicks","kb around the world","kb swings","planks","rows","running"],"wm":["box jumps","kb around the world","kb swings","rows","running"],"warmup":"2 laps w 10 KB Around the World ea direction, 10 SQ","workout":"30 Min AMRAP\n10 KB Around the World ea direction, 15 KB Swings, 10 Box Jumps, 5 Pull-up Rows, 100M","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Flutter Kicks"},{"id":200,"rating":"Hard","duration":44,"equipment":"BODYWEIGHT","format":"ACCUMULATOR","focus":"Upper Body","movements":["box jumps","broad jumps","burpees","dips","flutter kicks","mountain climbers","planks","push-up t-rotations","push-ups","running"],"wm":["box jumps","broad jumps","burpees","dips","mountain climbers","push-up t-rotations","push-ups","running"],"warmup":"4 laps non-stop","workout":"Add one exercise each round (all previous + new)\nRound 1: 10 Box Jumps\nRound 2: + 10 Push-up to T-Rotation\nRound 3: + 100M run\nRound 4: + 10 Dips\nRound 5: + 10 Burpees\nRound 6: + 20 Mountain Climbers\nRound 7: + 10 Broad Jumps\n30s rest between rounds","core":"2 min Plank, 50 Flutter Kicks"},{"id":201,"rating":"Very Hard","duration":47,"equipment":"KETTLEBELL","format":"FIGHT GONE BAD","focus":"Legs","movements":["high pulls","kb swings","planks","running","sit-ups","skipping","squats","step-ups","v-ups"],"wm":["high pulls","kb swings","skipping","squats","step-ups"],"warmup":"3 laps w 10 KB swings, 10 SQ","workout":"Max reps at each station - 1 min per station - rotate immediately - 1 min rest after full round - 4 rounds\nStation 1: KB Swings\nStation 2: Step-ups\nStation 3: KB High Pulls\nStation 4: Skipping\nStation 5: Goblet SQ\nNote total reps per round","core":"30 Situps, 20 V-Ups, 30s Plank *3"},{"id":202,"rating":"Hard","duration":42,"equipment":"DUMBBELL","format":"DEATH BY EMOM","focus":"Upper Body","movements":["box jumps","crunches","hollow holds","inchworms","planks","push-ups","rows","running","squats","thrusters"],"wm":["box jumps","push-ups","rows","running","thrusters"],"warmup":"2 laps w 10 SQ, 5 inchworms","workout":"EMOM - start with 1 DB Thruster + 1 Box Jump each minute. Add 1 of each per minute.\nContinue until you can't complete within the minute.\nRest 2 min, then: 4 rounds - 15 Pull-up Rows, 15 Push-ups, 400M","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Hollow Hold"},{"id":203,"rating":"Hard","duration":42,"equipment":"BODYWEIGHT","format":"DECK OF CARDS","focus":"Upper Body","movements":["box jumps","burpees","crunches","dips","planks","push-up t-rotations","push-ups","running"],"wm":["box jumps","burpees","dips","push-up t-rotations","push-ups","running"],"warmup":"3 laps non-stop","workout":"Flip one card at a time. Card value = reps (2-9, J/Q/K=10)\n♠ Spades = Burpees\n♥ Hearts = Box Jumps\n♦ Diamonds = Dips\n♣ Clubs = Push-up to T-Rotation\nAce/Joker = 200M sprint\nWork through 30 mins worth of cards","core":"3 rounds - 30s Plank, 30s Side Plank ea side, 30 Bicycle Crunch"},{"id":204,"rating":"Hard","duration":45,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Upper Body","movements":["bulgarian split squats","crunches","curls","hollow holds","inchworms","planks","running","shoulder press","squats"],"wm":["bulgarian split squats","curls","running","shoulder press","squats"],"warmup":"2 laps w 10 SQ, 5 inchworms","workout":"6 rounds - 1 min rest\n10 DB Bulgarian Split SQ ea leg, 16 DB Curls, 15 DB SQ, 8 DB Shoulder Press, 400M run","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Hollow Hold"},{"id":205,"rating":"Hard","duration":50,"equipment":"KETTLEBELL","format":"FOR TIME","focus":"Legs + Power","movements":["cleans","kb swings","planks","rows","running","sit-ups","squats","step-ups"],"wm":["cleans","kb swings","rows","running","squats","step-ups"],"warmup":"3 laps w 10 KB swings, 10 pull-up rows","workout":"Reverse Chipper for time:\n10 KB Clean & Press (ea arm), 20 Pull-up Rows, 30 KB Swings, 40 Goblet SQ, 50 Step-ups, 800M run, 50 Step-ups, 40 Goblet SQ, 30 KB Swings, 20 Pull-up Rows, 10 KB Clean & Press","core":"2 min Plank, 30 Situps - 2 rounds"},{"id":206,"rating":"Very Hard","duration":46,"equipment":"DUMBBELL","format":"ROUNDS","focus":"Full Body","movements":["bear complex","broad jumps","crunches","curls","deadlifts","inchworms","mountain climbers","planks","push-ups","rows","running","shoulder press","skipping","squats","step-ups"],"wm":["bear complex","broad jumps","curls","deadlifts","mountain climbers","push-ups","rows","running","shoulder press","skipping","squats","step-ups"],"warmup":"2 laps w 5 inchworms, 10 SQ","workout":"4 Rounds (40s on/20s off)\nDB Bear Complex (deadlift→clean→front squat→push press as one flow), Step-ups, DB Rows, Broad Jumps, DB Curls, Mountain Climbers, Push-ups, Skipping\nThen: 3 suicides 10,20,30M - 30s rest","core":"3 rounds - 30s Plank, 20 Rev Crunch, 20 Ankle Touches"},{"id":207,"rating":"Hard","duration":41,"equipment":"KETTLEBELL","format":"INTERVAL PYRAMID","focus":"Full Body","movements":["box jumps","burpees","kb halos","kb swings","planks","running","squats"],"wm":["box jumps","burpees","kb swings","squats"],"warmup":"2 laps w 10 KB swings, 5 KB halos","workout":"Pyramid of work:rest. Same 4 exercises each round:\nKB Swings, Goblet SQ, Box Jumps, Burpees\n20s work/40s rest x 1 round\n30s work/30s rest x 1 round\n40s work/20s rest x 2 rounds\n50s work/10s rest x 2 rounds\n40s work/20s rest x 1 rounds\n30s work/30s rest x 1 round","core":"3 * 1 min plank, 30s rest"},{"id":208,"rating":"Hard","duration":45,"equipment":"BODYWEIGHT","format":"FOR TIME","focus":"Upper Body","movements":["box jumps","burpees","crunches","dips","hollow holds","inchworms","planks","push-up t-rotations","push-ups","rows","running","squats"],"wm":["box jumps","burpees","dips","push-up t-rotations","push-ups","rows","running"],"warmup":"2 laps w 10 SQ, 5 inchworms","workout":"Complete for time (aim under 28 min)\n5 rounds:\n400M run\n21 Box Jumps\n15 Dips\n9 Burpees\n9 Push-up to T-Rotation\nRecord time and aim to beat it\nThen 3 rounds - pushup to failure, pull-up row to failure - 1 min rest","core":"3 rounds - 30s Plank, 30s Cycle Crunch, 30s Hollow Hold, 30s rest"}];

const DIFFICULTY_COLORS = { Easy: "#3ddc84", Medium: "#eab308", Hard: "#ff8a3a", "Very Hard": "#ef4444" };
const EQUIPMENT_ICONS = { BODYWEIGHT: "\u{1F3CB}", KETTLEBELL: "\u{1F3CB}", DUMBBELL: "\u{1F4AA}", "KB+DB": "\u26A1" };
const ALL_EQUIPMENT = [...new Set(RAW_DATA.map(w => w.equipment))].sort();
const ALL_RATINGS = ["Easy", "Medium", "Hard", "Very Hard"];
const ALL_FORMATS = [...new Set(RAW_DATA.map(w => w.format))].sort();
const ALL_FOCUSES = [...new Set(RAW_DATA.map(w => w.focus))].sort();
const ALL_MOVEMENTS = [...new Set(RAW_DATA.flatMap(w => w.movements))].sort();
const ALL_WORKOUT_MOVEMENTS = [...new Set(RAW_DATA.flatMap(w => w.wm))].sort();

// ═══════════════════════════════════════════════════════════════
// APP SETTINGS — font size, voice, outdoor mode, audio default
// ═══════════════════════════════════════════════════════════════
const SETTINGS_KEY = "parkwod:settings";
const FONT_SIZES = {
  small: { label: "Small", base: 14, timer: 58, exercise: 16, sample: "Compact view" },
  normal: { label: "Normal", base: 16, timer: 64, exercise: 20, sample: "Default size" },
  large: { label: "Large", base: 20, timer: 72, exercise: 24, sample: "Easier to read" },
  xlarge: { label: "X-Large", base: 24, timer: 80, exercise: 28, sample: "Low vision friendly" },
  xxlarge: { label: "XXL", base: 28, timer: 90, exercise: 32, sample: "Maximum readability" },
};
const DEFAULT_SETTINGS = { fontSize: "normal", voiceEnabled: false, outdoorMode: false, audioDefault: true, displayName: "" };

function loadSettings() {
  try { const raw = localStorage.getItem(SETTINGS_KEY); return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }; }
  catch { return { ...DEFAULT_SETTINGS }; }
}
function persistSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch(e) {}
}

function useSettings() {
  const [settings, setSettingsState] = useState(() => loadSettings());
  const update = useCallback((patch) => {
    setSettingsState(prev => { const next = { ...prev, ...patch }; persistSettings(next); return next; });
  }, []);
  return { settings, update };
}

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
    return (VOICE_ABBREVIATIONS[lower] || w) + suffix;
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
const FAVOURITES_KEY = "parkwod:favourites";
function loadFavourites() {
  try { const raw = localStorage.getItem(FAVOURITES_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveFavourites(favs) {
  try { localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favs)); } catch(e) {}
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
const CUSTOM_STORAGE_KEY = "parkwod_customizations";

function getStoredCustomizations() {
  try {
    const data = localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!data) return {};
    const parsed = JSON.parse(data);
    return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
  } catch (e) { return {}; }
}

function saveCustomization(workoutId, field, value) {
  try {
    const data = getStoredCustomizations();
    const id = String(workoutId);
    if (!data[id]) data[id] = {};
    data[id][field] = value;
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) { return false; }
}

function getCustomization(workoutId, field, defaultValue) {
  const data = getStoredCustomizations();
  const id = String(workoutId);
  return (data[id] && data[id][field] !== undefined) ? data[id][field] : defaultValue;
}

function clearCustomization(workoutId, field) {
  try {
    const data = getStoredCustomizations();
    const id = String(workoutId);
    if (!data[id]) return;
    delete data[id][field];
    if (Object.keys(data[id]).length === 0) delete data[id];
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

async function loadLogs() {
  try {
    const raw = localStorage.getItem("parkwod-logs");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
async function saveLogs(logs) {
  try { localStorage.setItem("parkwod-logs", JSON.stringify(logs)); } catch (e) { console.error("Save logs failed:", e); }
}
async function loadDiffOverrides() {
  try {
    const raw = localStorage.getItem("parkwod-diff-overrides");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
async function saveDiffOverrides(ov) {
  try { localStorage.setItem("parkwod-diff-overrides", JSON.stringify(ov)); } catch (e) { console.error("Save overrides failed:", e); }
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
        "rows": ["pull-up row", "pullup row", "pull up row", "db rows", "renegade row", "kb rows", "kettlebell rows", "kettlebell row", "dumbbell rows", "dumbbell row", "bar rows", "bar row"],
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
function ExerciseModal({ exerciseKey, onClose }) {
  if (!exerciseKey || !EXERCISE_INFO[exerciseKey]) return null;
  const ex = EXERCISE_INFO[exerciseKey];
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


// ═══════════════════════════════════════════════════════════════
// TIMER HOOK
// ═══════════════════════════════════════════════════════════════
function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);
  
  const reset = useCallback(() => { setElapsed(0); setRunning(false); }, []);
  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const toggle = useCallback(() => setRunning(r => !r), []);
  
  return { elapsed, running, start, pause, toggle, reset, setRunning };
}

// ═══════════════════════════════════════════════════════════════
// TIMER DISPLAY COMPONENT
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// TIMER DISPLAY — shows format timer, current exercise, countdown
// ═══════════════════════════════════════════════════════════════
function TimerDisplay({ config, elapsed, audio, countdownLeft, voiceEnabled, outdoorMode, fontSizeKey }) {
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
      if (doBeep && rem === 0) { beepFinish(); tryVibrate([200,100,200,100,400]); }
    }
    if (cfg.type === "emom") {
      const currentMin = Math.floor(elapsed / 60) + 1;
      const prevMin = Math.floor(prev / 60) + 1;
      if (elapsed > 0 && elapsed % 60 === 0) {
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
      if (doBeep && rem === 0) { beepFinish(); tryVibrate([200,100,200,100,400]); }
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
      
      // Start of WORK period
      if (withinCycle === 0 && elapsed > 0) {
        if (doBeep) { beepWork(); tryVibrate([100,50,100,50,100]); }
        const voiceMsg = exName ? `Round ${round} of ${cfg.rounds}. ${exName}` : `Round ${round} of ${cfg.rounds}`;
        speakText(voiceMsg, voiceEnabled, audio);
      }
      // First cycle work start (elapsed 0 handled separately for voice)
      if (withinCycle === 0 && elapsed === 1 && prev === 0) {
        const voiceMsg = exName ? `Round 1 of ${cfg.rounds}. ${exName}` : `Round 1`;
        speakText(voiceMsg, voiceEnabled, audio);
      }
      // Start of REST period
      if (withinCycle === cfg.workSeconds) {
        if (doBeep) { beepRest(); tryVibrate(200); }
        // Voice: announce next exercise during rest
        if (round === cfg.rounds && nextExName) {
          speakText(`Rest. Next exercise: ${nextExName}`, voiceEnabled, audio);
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
      if (withinRound > 0 && withinRound % stSec === 0 && withinRound < stSec * cfg.stations) {
        if (doBeep) { beepMinute(); tryVibrate(200); }
        // Voice: announce station exercise
        const exName = cfg.exercises && cfg.exercises[stationIdx] ? cfg.exercises[stationIdx] : `Station ${stationIdx + 1}`;
        speakText(`${exName}. Round ${roundIdx + 1}`, voiceEnabled, audio);
      }
      if (withinRound === stSec * cfg.stations) {
        if (doBeep) { beepRest(); tryVibrate(300); }
        speakText(`Rest`, voiceEnabled, audio);
      }
    }
    if (cfg.type === "deathby") {
      if (elapsed > 0 && elapsed % 60 === 0) { if (doBeep) { beepMinute(); tryVibrate(200); }
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
      // Completion beep
      if (doBeep && elapsed === cfg.totalSeconds) { beepFinish(); tryVibrate([200,100,200,100,400]); }
      // Start of rest period
      if (cfg.restSeconds > 0 && withinRound === workPeriod && elapsed > 0) {
        if (doBeep) { beepRest(); tryVibrate(200); }
        speakText(`Rest`, voiceEnabled, audio);
      }
      // Start of a new exercise within the round (withinEx === 0 and not in rest)
      if (!isRest && withinEx === 0 && elapsed > 0) {
        if (doBeep) { beepWork(); tryVibrate([100,50,100]); }
        const isRoundStart = exIdx === 0;
        const msg = isRoundStart ? `Round ${roundIdx + 1}. ${exName || ''}` : (exName || '');
        speakText(msg, voiceEnabled, audio);
      }
      // Very first tick — announce round 1 and first exercise
      if (elapsed === 1 && prev === 0 && exName) {
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
    
    const blocks = parseBlocks(workoutText);
    blocks.forEach((block, i) => {
      p.push({
        type: "workout",
        title: blocks.length > 1 ? `WORKOUT ${i+1}/${blocks.length}` : "WORKOUT",
        icon: "\u{1F4AA}", color: "#ff8a3a",
        content: block.content, timer: block.timer,
      });
    });
    
    if (coreText) {
      const coreBlocks = parseBlocks(coreText);
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
  }, [warmupText, workoutText, coreText]);

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

  // Rest timer countdown effect
  useEffect(() => {
    if (!restTimerActive) { clearInterval(restIntervalRef.current); return; }
    restIntervalRef.current = setInterval(() => {
      setRestTimerLeft(prev => {
        if (prev <= 1) {
          clearInterval(restIntervalRef.current);
          setRestTimerActive(false);
          // Beep + vibrate when rest is over
          try {
            const ac = new (window.AudioContext || window.webkitAudioContext)();
            [0, 200, 400].forEach(delay => { const o = ac.createOscillator(); const g = ac.createGain(); o.connect(g); g.connect(ac.destination); o.frequency.value = 880; g.gain.value = 0.3; o.start(ac.currentTime + delay/1000); o.stop(ac.currentTime + delay/1000 + 0.15); });
          } catch(e) {}
          if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
          speakText("Rest over. Let's go!", voiceEnabled, audioEnabled);
          return 0;
        }
        // Beep at 3,2,1
        if (prev <= 4 && prev > 1 && audioEnabled) {
          try { const ac = new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(); const g = ac.createGain(); o.connect(g); g.connect(ac.destination); o.frequency.value = 660; g.gain.value = 0.2; o.start(); o.stop(ac.currentTime + 0.1); } catch(e) {}
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(restIntervalRef.current);
  }, [restTimerActive, audioEnabled, voiceEnabled]);

  const startRestTimer = (seconds) => {
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
      {activeTimer && !isDone && <TimerDisplay config={activeTimer} elapsed={phase_timer.elapsed} audio={audioEnabled} countdownLeft={countdownLeft} voiceEnabled={voiceEnabled} outdoorMode={outdoorMode} fontSizeKey={fontSizeKey} />}

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
        const w = RAW_DATA.find(r => r.id === l.workoutId);
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
        {["list", "calendar"].map(mode => (
          <button key={mode} onClick={() => setViewMode(mode)} style={{
            flex: 1, padding: "10px 12px", borderRadius: 10, border: `1px solid ${viewMode === mode ? "#ff8a3a" : "#333"}`,
            background: viewMode === mode ? "#ff8a3a20" : "#111122", color: viewMode === mode ? "#ff8a3a" : "#888",
            fontSize: 13, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
          }}>{mode === "list" ? "\u{1F4CB} List" : "\u{1F4C5} Calendar"}</button>
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

      {/* List View */}
      <div style={{marginBottom: 80}}>
        {sortedLogs.map(log => {
          const w = RAW_DATA.find(r => r.id === log.workoutId);
          if (!w) return null;
          const rating = diffOverrides[w.id] || w.rating;
          const resultStr = formatLogResult(log);
          return (
            <div key={log.id} style={{background: "#111122", border: "1px solid #222", borderRadius: 14, padding: 14, marginBottom: 8}}>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6}}>
                <div>
                  <button onClick={() => onSelectWorkout(w)} style={{background: "none", border: "none", padding: 0, cursor: "pointer"}}>
                    <span style={{fontSize: 17, fontWeight: 800, color: "#ff8a3a"}}>#{w.id}</span>
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
      </div>
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
      localStorage.removeItem("parkwod-logs");
      localStorage.removeItem("parkwod-diff-overrides");
      localStorage.removeItem(CUSTOM_STORAGE_KEY);
      localStorage.removeItem(RECOVERY_KEY);
      localStorage.removeItem(SETTINGS_KEY);
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
        <div style={{fontSize: 13, color: "#888"}}>PARK WOD v8 {"\u00B7"} {RAW_DATA.length} workouts {"\u00B7"} {Object.keys(EXERCISE_INFO).length} exercises</div>
      </div>

      {/* Export / Backup */}
      <div style={{marginBottom: 24}}>
        <div style={sty.sectionTitle}>Backup Data</div>
        <button onClick={() => {
          try {
            const backup = {
              exportDate: new Date().toISOString(),
              version: "v8",
              logs: JSON.parse(localStorage.getItem("parkwod-logs") || "[]"),
              diffOverrides: JSON.parse(localStorage.getItem("parkwod-diff-overrides") || "{}"),
              customizations: JSON.parse(localStorage.getItem(CUSTOM_STORAGE_KEY) || "{}"),
              settings: JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"),
              favourites: JSON.parse(localStorage.getItem(FAVOURITES_KEY) || "[]"),
            };
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `parkwod-backup-${new Date().toISOString().split("T")[0]}.json`;
            a.click(); URL.revokeObjectURL(url);
          } catch(e) { console.error("Export failed:", e); }
        }} style={{
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
              if (data.logs && Array.isArray(data.logs)) { localStorage.setItem("parkwod-logs", JSON.stringify(data.logs)); restored++; }
              if (data.diffOverrides && typeof data.diffOverrides === "object") { localStorage.setItem("parkwod-diff-overrides", JSON.stringify(data.diffOverrides)); restored++; }
              if (data.customizations && typeof data.customizations === "object") { localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(data.customizations)); restored++; }
              if (data.settings && typeof data.settings === "object") { localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings)); restored++; }
              if (data.favourites && Array.isArray(data.favourites)) { localStorage.setItem(FAVOURITES_KEY, JSON.stringify(data.favourites)); restored++; }
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


function App() {
  const [screenState, setScreenState] = useState("home");
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
  const [filters, setFilters] = useState({ equipment: [], rating: [], format: [], focus: [], search: "" });
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
      const w = RAW_DATA.find(r => r.id === recovery.workoutId);
      if (w) setRecoveryPrompt({ ...recovery, workout: w });
      else clearWorkoutRecovery();
    }
  }, []);

  const filtered = useMemo(() => {
    return RAW_DATA.filter(w => {
      if (filters.equipment.length && !filters.equipment.includes(w.equipment)) return false;
      if (filters.rating.length && !filters.rating.includes(diffOverrides[w.id] || w.rating)) return false;
      if (filters.format.length && !filters.format.includes(w.format)) return false;
      if (filters.focus.length && !filters.focus.includes(w.focus)) return false;
      if (excludedMovements.length && w.wm.some(m => excludedMovements.includes(m))) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const matchesNum = w.id.toString().includes(s);
        const matchesText = (w.workout + " " + w.warmup + " " + w.core).toLowerCase().includes(s);
        const matchesFmt = w.format.toLowerCase().includes(s);
        if (!matchesNum && !matchesText && !matchesFmt) return false;
      }
      return true;
    });
  }, [filters, excludedMovements, diffOverrides]);

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
    }
  };

  const handleEditLog = (log) => {
    const w = RAW_DATA.find(r => r.id === log.workoutId);
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
        />
      </div>}
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
            <div style={{position: "absolute", top: -30, right: -30, width: 100, height: 100, background: "radial-gradient(circle, #3ddc8408 0%, transparent 70%)"}} />
            <Icon name="fire" size={22} color={DS.colors.green} />
            <div style={{fontFamily: DS.font.display, fontSize: 52, color: "#fff", lineHeight: 1, marginTop: 8, letterSpacing: 1}}>
              {dayStreak || logs.length}
            </div>
            <div style={{fontSize: 11, fontWeight: 700, color: DS.colors.textMuted, letterSpacing: 1.5, marginTop: 4}}>DAY STREAK</div>
          </div>

          {/* Quick Start Card */}
          <button onClick={onRandom} style={{flex: 1, background: DS.gradient.orange, borderRadius: DS.radius.xl, padding: "20px 16px", position: "relative", overflow: "hidden", border: "none", cursor: "pointer", textAlign: "left"}}>
            <div style={{position: "absolute", top: -20, right: -20, width: 80, height: 80, background: "radial-gradient(circle, #ffffff15 0%, transparent 70%)"}} />
            <Icon name="play" size={20} color="#fff" />
            <div style={{fontFamily: DS.font.display, fontSize: 28, color: "#fff", lineHeight: 1.1, marginTop: 10, letterSpacing: 1}}>
              QUICK<br/>START
            </div>
            <div style={{fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginTop: 4, letterSpacing: 0.5}}>
              {(() => {
                const focuses = [...new Set(RAW_DATA.map(w => w.focus))];
                const recentFocuses = [...logs].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,2).map(l => { const w = RAW_DATA.find(r => r.id === l.workoutId); return w ? w.focus : null; }).filter(Boolean);
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

      {/* ── Smart Workout Suggestion ── */}
      {(() => {
        if (logs.length < 1) return null;
        const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
        const recentFocuses = sortedLogs.slice(0, 2).map(l => {
          const wk = RAW_DATA.find(r => r.id === l.workoutId);
          return wk ? wk.focus : null;
        }).filter(Boolean);
        const recentIds = sortedLogs.slice(0, 5).map(l => l.workoutId);
        const candidates = RAW_DATA.filter(w =>
          !recentIds.includes(w.id) && !recentFocuses.includes(w.focus)
        );
        if (candidates.length === 0) return null;
        const today = new Date(); const seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
        const pick = candidates[seed % candidates.length];
        const avoidedLabel = recentFocuses.length > 0 ? recentFocuses[0].toLowerCase() : "the same muscles";
        return (
          <div className="card-float-3" style={{margin: "0 20px 20px", background: "linear-gradient(135deg, #1a1a3e, #111128)", border: "1px solid #8b5cf625", borderRadius: DS.radius.xl, padding: 16, position: "relative", overflow: "hidden"}}>
            <div style={{position: "absolute", top: -40, right: -40, width: 120, height: 120, background: "radial-gradient(circle, #8b5cf608 0%, transparent 70%)"}} />
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10}}>
              <div style={{display: "flex", alignItems: "center", gap: 6}}>
                <Icon name="target" size={14} color={DS.colors.purple} />
                <span style={{fontSize: 11, fontWeight: 700, color: DS.colors.purple, letterSpacing: 1}}>SUGGESTED FOR YOU</span>
              </div>
              <span style={{fontSize: 10, color: DS.colors.textMuted}}>Avoids {avoidedLabel}</span>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 12}}>
              <div style={{flex: 1}}>
                <div style={{fontFamily: DS.font.display, fontSize: 24, color: DS.colors.orange, letterSpacing: 1}}>#{pick.id}</div>
                <div style={{fontSize: 12, color: DS.colors.textSub, marginTop: 2}}>{pick.format.toLowerCase()} · {pick.equipment.toLowerCase()} · {pick.focus.toLowerCase()} · {pick.duration}m</div>
              </div>
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
            const w = RAW_DATA.find(r => r.id === log.workoutId);
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
function LibraryScreen({ workouts, filters, setFilters, showFilters, setShowFilters, onSelect, activeFilterCount, excludedMovements, setExcludedMovements, showExclusions, setShowExclusions, logs, diffOverrides, favs, onToggleFav }) {
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
  const clearFilters = () => { setFilters({ equipment: [], rating: [], format: [], focus: [], search: "" }); setExcludedMovements([]); setDurationFilter(null); };
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
        <div style={{position: "absolute", top: -40, right: -40, width: 140, height: 140, background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)"}} />
        <div style={{position: "absolute", bottom: -20, left: -20, width: 80, height: 80, background: "radial-gradient(circle, rgba(0,0,0,0.1) 0%, transparent 70%)"}} />
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
        {["All Workouts", ...ALL_EQUIPMENT, ...ALL_FOCUSES.slice(0, 3)].map((cat, i) => {
          const isAll = cat === "All Workouts";
          const isEquip = ALL_EQUIPMENT.includes(cat);
          const isFocus = ALL_FOCUSES.includes(cat);
          const active = isAll ? (filters.equipment.length === 0 && filters.focus.length === 0) : isEquip ? filters.equipment.includes(cat) : filters.focus.includes(cat);
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
                      <div style={{fontFamily: DS.font.display, fontSize: 22, color: "#fff", letterSpacing: 1}}>#{w.id}</div>
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
function WorkoutDetail({ workout: w, onExerciseTap, onStartWorkout, onLogWorkout, logs, diffOverrides, onEditLog, fontSizeKey, isFav, onToggleFav }) {
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
          <div style={{fontFamily: DS.font.display, fontSize: 42, color: "#fff", letterSpacing: 1, lineHeight: 1}}>WOD #{w.id}</div>
          <button onClick={onToggleFav} style={{
            background: isFav ? "#ef444418" : "none", border: `1px solid ${isFav ? "#ef4444" : DS.colors.border}`,
            borderRadius: DS.radius.md, padding: "6px 8px", cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center",
          }}>
            <Icon name="heart" size={18} color={isFav ? "#ef4444" : DS.colors.textMuted} strokeWidth={isFav ? 2.5 : 1.5} />
          </button>
        </div>

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
        </div>

        {/* Phase preview */}
        {(() => {
          const phases = [];
          if (customWarmup || w.warmup) phases.push({ label: "Warmup", color: "#eab308", icon: "fire" });
          const blocks = parseBlocks(customWorkout || w.workout);
          blocks.forEach((b, i) => {
            const label = b.timer?.label || (blocks.length > 1 ? `Part ${i+1}` : "Workout");
            phases.push({ label, color: DS.colors.orange, icon: "zap" });
          });
          if (customCore || w.core) {
            const coreBlocks = parseBlocks(customCore || w.core);
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


    // Mount the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  