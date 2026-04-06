// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Bass Module
//  CH3 Bass
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';

let _step = 0;
let _stepAcc = 0;
let _bar = 0;

export function initBass() {
  _step = 0;
  _stepAcc = 0;
  _bar = 0;
  console.log('[BASS] Initialized');
}

export function updateBass(dt) {
  if (!worldState.bpm || worldState.density.bass < 0.01) return;

  const stepDur = 60 / worldState.bpm / 4;
  _stepAcc += dt;

  while (_stepAcc >= stepDur) {
    _stepAcc -= stepDur;
    _tick();
    _step = (_step + 1) % 16;
    if (_step === 0) _bar++;
  }
}

function _tick() {
  // Placeholder — will be implemented with bass pattern
}
