// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Harmony Module
//  CH2 Drone + CH4 Chords
//  Reads worldState. Writes worldState.currentChord (only exception).
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { worldState } from './world-state.js';
import { sendMIDINote, sendMIDIPitchBend } from './midi.js';
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
let _chordIdx = -1;    // starts at -1 so first increment lands on index 0
let _lastDroneNote = -1;
let _lastDroneBar  = -1;
let _lastChordBar  = -1;

// V3: pitch drift state — slow LFO over CH2 drone (Sakamoto §A.5)
// Period 24 bars ≈ 60s @ 96 BPM. Amplitude ±614 ≈ ±15 cents.
let _pitchDriftStep = 0;
const PITCH_DRIFT_PERIOD_BARS = 24;
const PITCH_DRIFT_AMPLITUDE   = 614;
const PITCH_BEND_CENTER       = 8192;
let _lastPitchBend = -1;

export function initHarmony() {
  _step = 0;
  _stepAcc = 0;
  _bar = 0;
  _chordIdx = -1;
  _lastDroneNote = -1;
  _lastDroneBar  = -1;
  _lastChordBar  = -1;
  _pitchDriftStep = 0;
  // Reset pitch bend to center on init (avoid stale bend from previous track)
  if (CFG.MUSIC_STRUCTURAL) {
    sendMIDIPitchBend(CH_DRONE, PITCH_BEND_CENTER);
    _lastPitchBend = PITCH_BEND_CENTER;
  }
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
  //  V3: CH2 drone pitch drift (Sakamoto §A.5)
  //  Slow sin LFO ±15 cents, period 24 bars (~60s @ 96 BPM).
  //  Sent every quarter note to keep bandwidth low (~6Hz at 96 BPM).
  // ──────────────────────────────────────────────
  if (CFG.MUSIC_STRUCTURAL && _step % 4 === 0) {
    const periodSteps = PITCH_DRIFT_PERIOD_BARS * 16;
    _pitchDriftStep = (_pitchDriftStep + 4) % periodSteps;
    const phaseRad = (_pitchDriftStep / periodSteps) * Math.PI * 2;
    const bendValue = PITCH_BEND_CENTER + Math.round(Math.sin(phaseRad) * PITCH_DRIFT_AMPLITUDE);
    if (bendValue !== _lastPitchBend) {
      sendMIDIPitchBend(CH_DRONE, bendValue);
      _lastPitchBend = bendValue;
    }
  }

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
  //  CH4 CHORDS — sustained or rhythmic (chordGrid)
  // ──────────────────────────────────────────────
  const trackData = TRACKS[worldState.track];
  if (!trackData || !trackData.chords || trackData.chords.length === 0) return;

  const barsPerChord = BARS_PER_CHORD[phase] ?? BARS_PER_CHORD_DEFAULT;
  const chordGrid = trackData.chordGrid || null;

  // Advance chord on bar boundary
  if (_step === 0 && _bar % barsPerChord === 0 && _bar !== _lastChordBar) {
    _lastChordBar = _bar;
    _chordIdx = (_chordIdx + 1) % trackData.chords.length;
  }

  const rawChord = trackData.chords[_chordIdx];
  let chord = rawChord.map(n => {
    while (n < regLo) n += 12;
    while (n > regHi) n -= 12;
    return n;
  });

  // V3: Degradation — strip chord notes (4 → 3 → 2 → root only) in dissoluzione final
  const chordLimit = worldState.degradation?.chordNoteCount ?? 99;
  if (chordLimit < chord.length) {
    // Keep root + lowest notes (drop the top, "the chord crumbles inward")
    chord = chord.slice(0, chordLimit);
  }

  // ── Modal characteristic note boost (salvato da harmony-layer.js) ──
  // Estrae il modo dal track scale (es. SCALES.G_dorian → 'dorian'),
  // calcola l'intervallo distintivo del modo, e dà un velocity boost
  // alle note di accordo che cadono su quell'intervallo.
  const charBoost = _modeCharacteristicBoost(root);

  if (chordGrid) {
    // ── Rhythmic chords: staccato hits on grid pattern ──
    if (chordGrid[_step]) {
      const stepMs = (60 / bpm / 4) * 1000;
      const chordDur = Math.round(stepMs * 2.5);  // short — staccato
      const baseVel = Math.round(40 + density * 35);

      chord.forEach(note => {
        const humanize = Math.round((Math.random() * 6) - 3);
        const boost = (charBoost && (note % 12) === charBoost.pitchClass) ? charBoost.amount : 0;
        const vel = Math.min(Math.max(baseVel + humanize + boost, 1), velCeil);
        sendMIDINote(CH_CHORDS, note, vel, chordDur);
        addMidiNote(CH_CHORDS, note / 127, vel / 127);
      });

      worldState.currentChord = [...chord];
    }
  } else {
    // ── Sustained chords: one hit per chord change ──
    if (_step === 0 && _bar === _lastChordBar) {
      const chordDur = Math.round(beatMs * 4 * barsPerChord * 0.87);
      const baseVel = Math.round(35 + density * 30);

      chord.forEach(note => {
        const humanize = Math.round((Math.random() * 6) - 3);
        const boost = (charBoost && (note % 12) === charBoost.pitchClass) ? charBoost.amount : 0;
        const vel = Math.min(Math.max(baseVel + humanize + boost, 1), velCeil);
        sendMIDINote(CH_CHORDS, note, vel, chordDur);
        addMidiNote(CH_CHORDS, note / 127, vel / 127);
      });

      worldState.currentChord = [...chord];
    }
  }
}

// ── Modal characteristic note boost helper (salvato da harmony-layer.js) ──
// Returns { pitchClass, amount } or null if no boost applies for current track.
// Reads worldState.track + TRACKS[track].scale name to extract mode.
function _modeCharacteristicBoost(root) {
  const trackData = TRACKS[worldState.track];
  if (!trackData) return null;
  // Track scales are referenced as SCALES.G_dorian — extract scale key from track def
  // We need the scale's KEY name, not the array. Best heuristic: scan SCALES export.
  // Simpler: store mode hint on track if available; fallback to scale-array fingerprint.
  const modeHint = trackData.modeHint;  // optional explicit hint
  if (!modeHint) return null;
  const interval = CFG.modeCharacteristicInterval?.[modeHint];
  if (interval === undefined) return null;
  return {
    pitchClass: (root + interval) % 12,
    amount:     CFG.characteristicVelBoost || 15,
  };
}
