// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Bass Module V2
//  CH3 Bass — A/B EXPERIMENT (post-tavola-rotonda 2026-04-06)
//
//  ITERAZIONE 2 (2026-04-07):
//  Il chord-mapping era TROPPO — il basso perdeva la sua identità ritmica
//  indipendente. Il "basso che gira" è meglio. Tornato al comportamento v1
//  (offset diretti dal root). bass-v2 esiste comunque per non rompere
//  il sistema A/B; può ospitare future modifiche distinte.
//
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
let _lastFollowChord = '';

export function initBass() {
  _step = 0;
  _stepAcc = 0;
  _bar = 0;
  console.log('[BASS-V2] Initialized (independent loop, v1 behavior)');
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

  const pattern = track.bassPattern;
  const root    = worldState.root;
  const density = worldState.density.bass;
  const ceiling = worldState.velocityCeiling.bass;
  const [regLo, regHi] = worldState.register.bass;
  const bpm = worldState.bpm;
  if (!bpm) return;

  _velSweep = 0.85 + 0.15 * Math.sin((_bar % 8) / 8 * Math.PI * 2);

  const stepMs = (60 / bpm / 4) * 1000;
  const beatMs = (60 / bpm) * 1000;

  // ═══ Mode A: Follow harmony — long notes on chord changes ═══
  if (!pattern) {
    const chordStr = worldState.currentChord ? worldState.currentChord.join(',') : '';
    if (chordStr && chordStr !== _lastFollowChord && _step === 0) {
      _lastFollowChord = chordStr;

      let bassNote = Math.min(...worldState.currentChord);
      while (bassNote > regHi) bassNote -= 12;
      while (bassNote < regLo) bassNote += 12;
      if (bassNote < regLo || bassNote > regHi) bassNote = root;

      const baseVel = (45 + density * 35) * _velSweep;
      const humanize = (Math.random() * 6) - 3;
      const vel = Math.round(Math.max(1, Math.min(ceiling, baseVel + humanize)));
      const dur = Math.round(beatMs * 14);

      sendMIDINote(3, bassNote, vel, dur);
      addMidiNote(3, bassNote / 127, vel / 127);
    }
    return;
  }

  // ═══ Mode B: Pattern-based — independent loop (v1 behavior) ═══
  const offset = pattern[_step];

  if (offset > 0) {
    const raw  = root + offset;
    const note = Math.max(regLo, Math.min(regHi, raw));

    const baseVel = (50 + density * 40) * _velSweep;
    const humanize = (Math.random() * 8) - 4;
    const vel = Math.round(Math.max(1, Math.min(ceiling, baseVel + humanize)));
    const dur = stepMs * 3;

    sendMIDINote(3, note, vel, dur);
    addMidiNote(3, note / 127, vel / 127);
    _lastNote = _step;

    // Occasional 5th doubling on downbeats
    if (_step % 4 === 0 && density > 0.4 && Math.random() < 0.20) {
      const fifth = note + 7;
      if (fifth <= regHi) {
        const fifthVel = Math.round(vel * 0.65);
        sendMIDINote(3, fifth, fifthVel, dur);
        addMidiNote(3, fifth / 127, fifthVel / 127);
      }
    }

  } else if (density > 0.5 && Math.random() < 0.12) {
    const prevStep = (_step + 15) % 16;
    const nextStep = (_step + 1) % 16;
    const adjacentToPlayed =
      (pattern[prevStep] > 0) || (pattern[nextStep] > 0);

    if (adjacentToPlayed) {
      const ghostVel = Math.round(20 + Math.random() * 10);
      const ghostNote = Math.max(regLo, Math.min(regHi, root));
      const ghostDur  = stepMs * 1.5;

      sendMIDINote(3, ghostNote, ghostVel, ghostDur);
      addMidiNote(3, ghostNote / 127, ghostVel / 127);
    }
  }
}
