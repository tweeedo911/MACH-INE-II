// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Shared Utilities
//  Micro-module: functions used by multiple layers
// ═══════════════════════════════════════════════════════════

// Gaussian approximation (mean 0, sigma ~1) — Box-Muller-lite via 3-sample CLT
export function gaussianRand() {
  return (Math.random() + Math.random() + Math.random() - 1.5) * 2;
}
