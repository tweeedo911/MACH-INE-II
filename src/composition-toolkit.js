// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composition Toolkit (Wave 1)
//  Minimal subset of the design-time toolkit (.claude/skills/composition-depth/scripts).
//  Imported by music modules at runtime. No magic numbers — every parameter
//  must come from CFG or TRACKS.
// ═══════════════════════════════════════════════════════════

// Easing — non-linear shaping for any 0→1 progress.
//   easeIn:    starts slow, ends fast (concave-up)        — TEMPESTA/MACCHINA: explode
//   easeOut:   starts fast, ends slow (concave-down)      — NEBBIA/RESPIRO: caress
//   easeInOut: smooth S-curve                              — SOLCO/TESSUTO: balanced
//   linear:    raw progress                                — fallback
export function ease(t, type = 'easeInOut', exp = 2) {
  const tc = t < 0 ? 0 : t > 1 ? 1 : t;
  switch (type) {
    case 'easeIn':    return Math.pow(tc, exp);
    case 'easeOut':   return 1 - Math.pow(1 - tc, exp);
    case 'easeInOut':
      return tc < 0.5
        ? Math.pow(2 * tc, exp) / 2
        : 1 - Math.pow(2 * (1 - tc), exp) / 2;
    default: return tc;
  }
}

// Velocity curve — maps density (0→1) to MIDI velocity through an easing shape.
// Each track has a signature curveType, so identical density produces different
// dynamic feels across the suite (gauss soft / spike / bell / arch).
export function velocityCurve(baseVel, maxVel, progress, curveType = 'easeInOut') {
  const v = Math.round(baseVel + (maxVel - baseVel) * ease(progress, curveType));
  return v < 1 ? 1 : v > 127 ? 127 : v;
}

// Gaussian humanize (Box-Muller). Returns offset in ms (or vel units), can be negative.
// Small deviations more likely than large — more realistic than uniform random.
export function humanizeMs(sigma) {
  if (sigma <= 0) return 0;
  const u1 = Math.random() || 0.0001;
  const u2 = Math.random();
  return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Breath multiplier — periodic density reduction over a bar cycle.
// Used to give arpeggios/ostinati a breathing arc instead of flat dynamics.
export function breathMultiplier(bar, breathCycle = 16) {
  const pos = ((bar % breathCycle) + breathCycle) % breathCycle;
  if (pos >= breathCycle - 2) return 0.55;   // last 2 bars: dip
  if (pos <= 1) return 0.78;                 // first 2 bars: lift-off
  return 1.0;                                // middle: full
}

// Progression arc — velocity multiplier across a chord progression of N steps.
// Default: 4-chord arc question→peak→answer (0.85, 1.0, 0.95, 0.78).
// Returns 1.0 for non-arc lengths.
export function progressionArc(chordIdx, chordCount) {
  if (chordCount === 4) {
    return [0.88, 1.0, 0.96, 0.80][chordIdx % 4];
  }
  if (chordCount === 8) {
    return [0.85, 0.92, 1.0, 0.95, 0.90, 0.97, 0.92, 0.80][chordIdx % 8];
  }
  return 1.0;
}
