// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Harmony Module
//  CH2 Drone + CH4 Chords
//  Reads worldState. Writes worldState.currentChord (only exception).
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';

let _step = 0;
let _stepAcc = 0;
let _bar = 0;
let _chordIdx = 0;
let _lastDroneNote = -1;

export function initHarmony() {
  _step = 0;
  _stepAcc = 0;
  _bar = 0;
  _chordIdx = 0;
  _lastDroneNote = -1;
  console.log('[HARMONY] Initialized');
}

export function updateHarmony(dt) {
  if (worldState.density.harmony < 0.01) return;

  // Harmony uses bar-level timing even without BPM (drone in ambient tracks)
  const bpm = worldState.bpm || 60; // fallback 60 BPM for timing in ambient
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
  // Placeholder — will be implemented with drone and chord progression
}
