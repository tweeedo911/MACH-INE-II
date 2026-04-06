// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Harmony Module
//  CH2 Drone + CH4 Chords
//  Reads worldState. Writes worldState.currentChord (only exception).
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';
import { TRACKS } from './tracks.js';

// ── Channel assignments ──
const CH_DRONE  = 2;  // CH2 = DRONE (sustained harmonic root)
const CH_CHORDS = 4;  // CH4 = CHORDS (harmonic layer)

// ── Bars-per-chord per phase ──
const BARS_PER_CHORD = {
  germoglio:    8,
  dissoluzione: 8,
  rottura:      2,
  // default (pulsazione, densita): 4
};
const BARS_PER_CHORD_DEFAULT = 4;

let _step = 0;
let _stepAcc = 0;
let _bar = 0;
let _chordIdx = 0;
let _lastDroneNote = -1;
let _lastDroneBar  = -1;
let _lastChordBar  = -1;

export function initHarmony() {
  _step = 0;
  _stepAcc = 0;
  _bar = 0;
  _chordIdx = 0;
  _lastDroneNote = -1;
  _lastDroneBar  = -1;
  _lastChordBar  = -1;
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
  const bpm      = worldState.bpm || 60;
  const beatMs   = (60 / bpm) * 1000;               // ms per quarter note
  const density  = worldState.density.harmony;       // 0–1
  const phase    = worldState.phase;
  const root     = worldState.root;
  const [regLo, regHi] = worldState.register.chords; // e.g. [55, 72]

  // ── Velocity ceiling guard ──
  const velCeil  = worldState.velocityCeiling.harmony || 127;

  // ──────────────────────────────────────────────
  //  CH2 DRONE — every 4 bars, on step 0
  // ──────────────────────────────────────────────
  if (_step === 0 && _bar % 4 === 0 && _bar !== _lastDroneBar) {
    _lastDroneBar = _bar;

    const droneVel  = Math.min(Math.round(35 + density * 25), velCeil);
    const droneDur  = Math.round(beatMs * 15);  // ~4 bars (16 beats × 0.9375)

    sendMIDINote(CH_DRONE, root, droneVel, droneDur);
    addMidiNote(CH_DRONE, root / 127, droneVel / 127);
    _lastDroneNote = root;

    // Octave doubling when density is high and note fits register
    const rootOct = root + 12;
    if (density > 0.3 && rootOct <= regHi) {
      const octVel = Math.min(Math.round(droneVel * 0.6), velCeil);
      sendMIDINote(CH_DRONE, rootOct, octVel, droneDur);
      addMidiNote(CH_DRONE, rootOct / 127, octVel / 127);
    }
  }

  // ──────────────────────────────────────────────
  //  CH4 CHORDS — rate depends on phase
  // ──────────────────────────────────────────────
  const barsPerChord = BARS_PER_CHORD[phase] ?? BARS_PER_CHORD_DEFAULT;

  if (_step === 0 && _bar % barsPerChord === 0 && _bar !== _lastChordBar) {
    _lastChordBar = _bar;

    const trackData = TRACKS[worldState.track];
    if (!trackData || !trackData.chords || trackData.chords.length === 0) return;

    // Advance chord index
    _chordIdx = (_chordIdx + 1) % trackData.chords.length;
    const rawChord = trackData.chords[_chordIdx];

    // Clamp each note to register range by transposing octaves
    const chord = rawChord.map(n => {
      while (n < regLo) n += 12;
      while (n > regHi) n -= 12;
      return n;
    });

    // Chord duration: ~87% of the chord period
    const chordDur = Math.round(beatMs * 4 * barsPerChord * 0.87);

    // Base velocity
    const baseVel = Math.round(35 + density * 30);

    chord.forEach(note => {
      // ±3 humanization (integer jitter)
      const humanize = Math.round((Math.random() * 6) - 3);
      const vel = Math.min(Math.max(baseVel + humanize, 1), velCeil);
      sendMIDINote(CH_CHORDS, note, vel, chordDur);
      addMidiNote(CH_CHORDS, note / 127, vel / 127);
    });

    // Write currentChord so melody/arp module can read it
    worldState.currentChord = [...chord];
  }
}
