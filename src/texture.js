// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Texture Module
//  CC messages + rare FX events
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import { sendMIDICC } from './midi.js';

const CC_INTERVAL = 0.1; // 10Hz — smooth but not spammy

let _timeAcc   = 0;
let _lastCCTime = 0;

export function initTexture() {
  _timeAcc    = 0;
  _lastCCTime = 0;
  console.log('[TEXTURE] Initialized');
}

export function updateTexture(dt) {
  if (worldState.density.texture < 0.01) return;
  _timeAcc += dt;

  if (_timeAcc - _lastCCTime >= CC_INTERVAL) {
    const { arc, density } = worldState;

    // CC74 on CH3 (bass filter cutoff) — filter opens as concert progresses
    const cutoff = Math.min(127, Math.max(0, Math.round(arc * 100 + 20)));
    sendMIDICC(3, 74, cutoff);

    // CC1 on CH5 (voice expression / modwheel)
    const expr = Math.min(127, Math.max(0, Math.round(density.melody * 127)));
    sendMIDICC(5, 1, expr);

    _lastCCTime = _timeAcc;
  }
}
