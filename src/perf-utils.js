// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Performance utilities
//  Shared primitives: SeededRNG, ring buffers, misc helpers.
// ═══════════════════════════════════════════════════════════

// ── SeededRNG (LCG) ────────────────────────────────────────
// Deterministic pseudo-random generator. Used to make a performance
// reproducible given a `?seed=N` URL parameter. Not cryptographically
// secure — only meant for ensuring "same seed → same musical/visual
// choices" across rehearsals and recordings.
//
// Implementation: classic Numerical Recipes LCG.
// Period 2^32, output in [0, 1).
export class SeededRNG {
  constructor(seed = 1) {
    // Coerce to uint32 and avoid 0 seed degenerate case.
    const s = (seed >>> 0) || 1;
    this.state = s;
  }
  next() {
    // a = 1664525, c = 1013904223, m = 2^32
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
  // Convenience: integer in [lo, hi] inclusive
  nextInt(lo, hi) {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }
  // Convenience: float in [lo, hi)
  nextRange(lo, hi) {
    return lo + this.next() * (hi - lo);
  }
}
