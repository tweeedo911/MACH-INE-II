// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Texture Module
//  CC messages + rare FX events
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';

let _timeAcc = 0;

export function initTexture() {
  _timeAcc = 0;
  console.log('[TEXTURE] Initialized');
}

export function updateTexture(dt) {
  if (worldState.density.texture < 0.01) return;
  _timeAcc += dt;
  // Placeholder — will be implemented with CC messages and rare events
}
