// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Bass Module
//  CH3 Bass
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';
import { TRACKS } from './tracks.js';

let _step = 0;
let _stepAcc = 0;
let _bar = 0;
let _lastNote = -1;
let _velSweep = 0;

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
  const track = TRACKS[worldState.track];
  if (!track) return;

  const pattern = track.bassPattern;   // 16-step array
  const root    = worldState.root;
  const density = worldState.density.bass;
  const ceiling = worldState.velocityCeiling.bass;
  const [regLo, regHi] = worldState.register.bass;

  // Velocity sweep: sine breathing over 8-bar cycle
  _velSweep = 0.85 + 0.15 * Math.sin((_bar % 8) / 8 * Math.PI * 2);

  const stepMs = (60 / worldState.bpm / 4) * 1000;

  const offset = pattern[_step];

  if (offset > 0) {
    // Active step — play the pattern note
    const raw  = root + offset;
    const note = Math.max(regLo, Math.min(regHi, raw));

    const baseVel = (50 + density * 40) * _velSweep;
    const humanize = (Math.random() * 8) - 4;   // ±4
    const vel = Math.round(Math.max(1, Math.min(ceiling, baseVel + humanize)));

    const dur = stepMs * 3;

    sendMIDINote(3, note, vel, dur);
    addMidiNote(3, note / 127, vel / 127);
    _lastNote = _step;

  } else if (density > 0.5 && Math.random() < 0.12) {
    // Ghost note: only on steps adjacent to the last played step
    const prevStep = (_step + 15) % 16;  // one step back (wraps)
    const nextStep = (_step + 1) % 16;
    const adjacentToPlayed =
      (pattern[prevStep] > 0) || (pattern[nextStep] > 0);

    if (adjacentToPlayed) {
      const ghostVel = Math.round(20 + Math.random() * 10);   // 20–30
      const ghostNote = Math.max(regLo, Math.min(regHi, root));
      const ghostDur  = stepMs * 1.5;

      sendMIDINote(3, ghostNote, ghostVel, ghostDur);
      addMidiNote(3, ghostNote / 127, ghostVel / 127);
    }
  }
}
