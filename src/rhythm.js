// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Rhythm Module
//  CH0 Kick + CH1 Perc Kit
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';

let _step = 0;        // 0–15 (16th note position in bar)
let _stepAcc = 0;     // accumulator for step timing
let _bar = 0;         // bar counter

export function initRhythm() {
  _step = 0;
  _stepAcc = 0;
  _bar = 0;
  console.log('[RHYTHM] Initialized');
}

export function updateRhythm(dt) {
  if (!worldState.bpm || worldState.density.rhythm < 0.01) return;

  const stepDur = 60 / worldState.bpm / 4; // duration of 1 sixteenth note in seconds
  _stepAcc += dt;

  while (_stepAcc >= stepDur) {
    _stepAcc -= stepDur;
    _tick();
    _step = (_step + 1) % 16;
    if (_step === 0) _bar++;
  }
}

function _tick() {
  // Placeholder — will be implemented with kick and perc kit patterns
}
