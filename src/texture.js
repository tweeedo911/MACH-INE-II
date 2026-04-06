// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Texture Module
//  CC messages + rare FX events
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import { audio } from './audio.js';
import { sendMIDICC } from './midi.js';

const CC_INTERVAL = 0.1; // 10Hz — smooth but not spammy

let _timeAcc   = 0;
let _lastCCTime = 0;

// EMA smoothing state for CC values (avoid jitter)
let _ccBassFilter = 20;
let _ccVoiceExpr  = 0;
let _ccChordWidth = 0;
let _ccDroneMod   = 0;
let _ccLeadVib    = 0;

export function initTexture() {
  _timeAcc    = 0;
  _lastCCTime = 0;
  _ccBassFilter = 20;
  _ccVoiceExpr  = 0;
  _ccChordWidth = 0;
  _ccDroneMod   = 0;
  _ccLeadVib    = 0;
  console.log('[TEXTURE] Initialized');
}

export function updateTexture(dt) {
  if (worldState.density.texture < 0.01) return;
  _timeAcc += dt;

  if (_timeAcc - _lastCCTime >= CC_INTERVAL) {
    const { arc, density, phase, audioEnergy } = worldState;
    const rms = audio.rms || 0;
    const centroid = audio.centroid || 0;
    const energy = audioEnergy || 0;
    const isRottura = phase === 'rottura';

    // CC74 on CH3 (bass filter cutoff) — opens with arc + modulated by audio energy
    const cutoffTarget = arc * 90 + 20 + energy * 30;
    _ccBassFilter += (cutoffTarget - _ccBassFilter) * 0.15;
    sendMIDICC(3, 74, Math.min(127, Math.max(0, Math.round(_ccBassFilter))));

    // CC1 on CH5 (voice expression / modwheel) — follows melody density + rms
    const exprTarget = density.melody * 100 + rms * 40;
    _ccVoiceExpr += (exprTarget - _ccVoiceExpr) * 0.12;
    sendMIDICC(5, 1, Math.min(127, Math.max(0, Math.round(_ccVoiceExpr))));

    // CC74 on CH4 (chord filter / brightness) — spectral centroid controls chord timbre
    const chordTarget = centroid * 80 + density.harmony * 40;
    _ccChordWidth += (chordTarget - _ccChordWidth) * 0.08;
    sendMIDICC(4, 74, Math.min(127, Math.max(0, Math.round(_ccChordWidth))));

    // CC1 on CH2 (drone modulation) — slow LFO based on arc, faster in rottura
    const lfoSpeed = isRottura ? 2.5 : 0.3;
    const lfoTarget = 40 + Math.sin(_timeAcc * lfoSpeed) * 35 + energy * 25;
    _ccDroneMod += (lfoTarget - _ccDroneMod) * 0.06;
    sendMIDICC(2, 1, Math.min(127, Math.max(0, Math.round(_ccDroneMod))));

    // CC71 on CH6 (lead resonance / vibrato) — intensity drives vibrato depth
    const vibTarget = energy * 80 + (isRottura ? 40 : 0);
    _ccLeadVib += (vibTarget - _ccLeadVib) * 0.1;
    sendMIDICC(6, 71, Math.min(127, Math.max(0, Math.round(_ccLeadVib))));

    _lastCCTime = _timeAcc;
  }
}
