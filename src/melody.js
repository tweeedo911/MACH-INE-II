// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Melody Module
//  CH5 Voice + CH6 Lead + CH7 Arp
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';

let _step = 0;
let _stepAcc = 0;
let _bar = 0;

export function initMelody() {
  _step = 0;
  _stepAcc = 0;
  _bar = 0;
  console.log('[MELODY] Initialized');
}

export function updateMelody(dt) {
  if (worldState.density.melody < 0.01) return;

  const bpm = worldState.bpm || 60;
  const stepDur = 60 / bpm / 4;
  _stepAcc += dt;

  while (_stepAcc >= stepDur) {
    _stepAcc -= stepDur;
    _tick();
    _step = (_step + 1) % 16;
    if (_step === 0) _bar++;
  }
}

function _tick() {
  // Placeholder — will be implemented with voice, lead, and arp
}
