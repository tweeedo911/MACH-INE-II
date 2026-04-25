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

// Phase ghost scale — narrative-aware scaling for ghost probability.
// Germoglio = silenzio (ghost off, il materiale è solo). Densità = picco (×1.5).
// Stesso pattern già usato in bass-v3 per ghostFill, ora generalizzato.
export function phaseGhostScale(phase) {
  switch (phase) {
    case 'germoglio':    return 0;
    case 'pulsazione':   return 0.5;
    case 'densita':      return 1.5;
    case 'rottura':      return 1.2;
    case 'dissoluzione': return 0.3;
    default:             return 1.0;
  }
}

// Euclidean rhythm — distributes K hits evenly across N steps (Toussaint).
// Returns binary array [0|1, ...] of length N.
export function euclidean(K, N) {
  const pattern = new Array(N).fill(0);
  if (K <= 0 || N <= 0) return pattern;
  const k = Math.min(K, N);
  for (let i = 0; i < k; i++) {
    pattern[Math.floor(i * N / k)] = 1;
  }
  return pattern;
}

// Euclidean evolving — interpolates between E(K1,N) and E(K2,N) by progress (0→1).
// Steps that differ between the two patterns are resolved probabilistically:
// at progress=0 they take E(K1) value, at progress=1 they take E(K2). In between
// each ambiguous step is independently random — so the pattern feels alive
// instead of switching all-at-once. Probabilistic, not random: the *target*
// density is exact, only the *positions* of the ambiguous hits vary.
export function euclideanEvolve(K1, K2, N, progress) {
  const p1 = euclidean(K1, N);
  const p2 = euclidean(K2, N);
  const out = new Array(N);
  const t = progress < 0 ? 0 : progress > 1 ? 1 : progress;
  for (let i = 0; i < N; i++) {
    if (p1[i] === p2[i]) out[i] = p1[i];
    else out[i] = Math.random() < t ? p2[i] : p1[i];
  }
  return out;
}
