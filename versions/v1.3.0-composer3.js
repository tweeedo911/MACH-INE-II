// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Composer 3
//  Spec new/ — 8 tracce fedeli — D Dorian DERIVA — BPM 84
//  CH0=PULSE CH1=GRAIN CH2=DRONE CH3=BASS CH4=CHORDS
//  CH5=VOICE CH6=LEAD CH7=RUPTURE
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { state } from './state.js';
import { sendMIDINote, sendMIDIAllNotesOff } from './midi.js';
import { setArcPhaseForced, releaseArcHold } from './director.js';
import { setComposerClimax } from './colors.js';
import { addMidiNote, addOnsetWave } from './field.js';

// ── Scale modes (D Dorian root) ──
const MODES3 = {
  D_dorian:   [50,52,53,55,57,59,60,62,64,65,67,69,71,72,74],
  D_phrygian: [50,51,53,55,57,58,60,62,63,65,67,69,70,72,74],
  A_lydian:   [57,59,61,62,64,66,68,69,71,73,74,76,78,80,81],
  Eb_locrian: [63,64,66,68,69,71,73,75,76,78,80,81,83,85,87],
};

// ── Presenza target per fase [PULSE, GRAIN, DRONE, BASS, CHORDS, VOICE, LEAD, RUPTURE] ──
const PHASE_PRESENCE3 = {
  germoglio:    [0.0, 0.0, 0.8, 0.0, 0.0, 0.0, 0.0, 0.0],
  pulsazione:   [0.9, 0.5, 0.7, 0.5, 0.6, 0.4, 0.0, 0.0],
  densita:      [0.9, 0.8, 0.6, 0.8, 0.9, 0.8, 0.6, 0.0],
  rottura:      [0.4, 0.7, 0.3, 0.3, 0.2, 0.2, 0.0, 1.0],
  dissoluzione: [0.2, 0.3, 0.9, 0.3, 0.3, 0.5, 0.3, 0.0],
};

// ── State ──
export let composer3Active = false;

let clock = 0;        // beat counter (float)
let lastBeat = -1;
let lastBar  = -1;
let phase    = 'germoglio';
let phaseIdx = 0;
let phaseClock = 0;

// ChordEngine
let chordIdx = 0;
let currentChord = [50, 53, 57]; // Dm iniziale

// MarkovEngine
let markovHistory3 = [null, null];

// EuclideanEngine
let euclidean3 = null;
let euclideanStep3 = 0;

// RuptureEngine
let ruptureStage3 = 'idle';
let ruptureProgress3 = 0;
let ruptureNoteTimer = 2; // timer per note off-beat in presagio

// Presence per traccia
let presence3 = [0, 0, 0, 0, 0, 0, 0, 0];

// ═══════════════════════════════════════════════════════════
//  EUCLIDEAN ENGINE — Bjorklund
// ═══════════════════════════════════════════════════════════

function buildEuclidean3(steps, total) {
  const pattern = [];
  let bucket = 0;
  for (let i = 0; i < total; i++) {
    bucket += steps;
    if (bucket >= total) { bucket -= total; pattern.push(true); }
    else pattern.push(false);
  }
  return pattern;
}

function initEuclidean3() {
  const cfg = CFG.COMPOSER3.euclidean;
  const [steps, total] = phase === 'rottura' ? cfg.rottura : cfg.normal;
  euclidean3 = buildEuclidean3(steps, total);
  euclideanStep3 = 0;
}

// ═══════════════════════════════════════════════════════════
//  CHORD ENGINE — progressioni fisse per fase
// ═══════════════════════════════════════════════════════════

function getRoot() { return currentChord[0]; }

function initChord3() {
  const prog = CFG.COMPOSER3.chordProgressions[phase];
  chordIdx = 0;
  currentChord = (prog && prog[0]) ? [...prog[0]] : [50, 53, 57];
}

function nextChord3() {
  const prog = CFG.COMPOSER3.chordProgressions[phase];
  if (!prog) return;
  chordIdx = (chordIdx + 1) % prog.length;
  currentChord = [...prog[chordIdx]];
}

// ═══════════════════════════════════════════════════════════
//  MARKOV ENGINE 2nd ORDER — peso ×3 su note dell'accordo
// ═══════════════════════════════════════════════════════════

function nextVoiceNote3() {
  const phaseData = CFG.COMPOSER3.phases[phase];
  const scale = MODES3[phaseData.mode] || MODES3.D_dorian;

  const pool = [];
  for (const n of scale) {
    let w = 1.0;
    // Note dell'accordo corrente pesate ×3
    if (currentChord.some(c => c % 12 === n % 12)) w = 3.0;
    // Preferisce salti piccoli
    if (markovHistory3[1] !== null) {
      const diff = Math.abs(n - markovHistory3[1]);
      if (diff <= 4) w *= 2.0;
      if (diff > 7) w *= 0.3;
    }
    pool.push({ n, w });
  }

  const total = pool.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  let chosen = pool[0].n;
  for (const entry of pool) {
    r -= entry.w;
    if (r <= 0) { chosen = entry.n; break; }
  }

  markovHistory3[0] = markovHistory3[1];
  markovHistory3[1] = chosen;
  return chosen;
}

// ═══════════════════════════════════════════════════════════
//  GRAIN ENGINE — note GM percussive per fase
// ═══════════════════════════════════════════════════════════

function grainNote3(beat, bar) {
  const G = CFG.COMPOSER3.grain;
  const barBeat = beat % 4;

  if (phase === 'germoglio') return null;

  if (phase === 'pulsazione') {
    if (barBeat % 2 === 0) {
      const vel = 25 + Math.round(Math.random() * 15);
      if (bar % 8 === 0 && barBeat === 0) return { note: G.hihatOpen, vel };
      return { note: G.hihatClosed, vel };
    }
    return null;
  }

  if (phase === 'densita') {
    if (barBeat === 0) return { note: G.sideStick, vel: 45 + Math.round(Math.random() * 20) };
    if (barBeat === 1) return { note: G.hihatClosed, vel: 30 + Math.round(Math.random() * 15) };
    if (barBeat === 2) return { note: G.claves,     vel: 40 + Math.round(Math.random() * 15) };
    if (barBeat === 3) return { note: G.hihatClosed, vel: 25 + Math.round(Math.random() * 10) };
  }

  if (phase === 'rottura') {
    const note = Math.random() < 0.5
      ? G.clap
      : G.tomRange[Math.floor(Math.random() * G.tomRange.length)];
    return { note, vel: 60 + Math.round(Math.random() * 30) };
  }

  if (phase === 'dissoluzione') {
    if (barBeat === 0 && Math.random() < 0.4) {
      return { note: G.hihatOpen, vel: 20 + Math.round(Math.random() * 20) };
    }
    return null;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════
//  RUPTURE ENGINE — 4 stadi obbligatori
// ═══════════════════════════════════════════════════════════

function updateRupture3(dt) {
  if (phase !== 'rottura') {
    if (ruptureStage3 !== 'idle') {
      ruptureStage3 = 'idle';
      ruptureProgress3 = 0;
      setComposerClimax(false);
    }
    return;
  }

  const phaseDuration = CFG.COMPOSER3.phases.rottura.duration;
  ruptureProgress3 = Math.min(1, phaseClock / phaseDuration);

  const r = CFG.COMPOSER3.rupture;
  if      (ruptureProgress3 < r.presagio[1])      ruptureStage3 = 'presagio';
  else if (ruptureProgress3 < r.infiltrazione[1]) ruptureStage3 = 'infiltrazione';
  else if (ruptureProgress3 < r.takeover[1])      ruptureStage3 = 'takeover';
  else                                             ruptureStage3 = 'residuo';

  // Color C solo in takeover
  setComposerClimax(ruptureStage3 === 'takeover');

  // Note off-beat in presagio: Bb=58, F#=54, vel bassa, timer irregolare
  if (ruptureStage3 === 'presagio') {
    ruptureNoteTimer -= dt;
    if (ruptureNoteTimer <= 0) {
      ruptureNoteTimer = 4 + Math.random() * 4;
      const note = Math.random() < 0.5 ? 58 : 54; // Bb3 o F#3
      sendMIDINote(7, note, 28, 400);
      addMidiNote(7, note / 127, 28 / 127);
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  PHASE ENGINE
// ═══════════════════════════════════════════════════════════

function updatePhase3(dt) {
  phaseClock += dt;
  const currentPhaseData = CFG.COMPOSER3.phases[phase];
  if (phaseClock >= currentPhaseData.duration) {
    phaseClock = 0;
    phaseIdx = (phaseIdx + 1) % CFG.COMPOSER3.phaseOrder.length;
    phase = CFG.COMPOSER3.phaseOrder[phaseIdx];
    initChord3();
    initEuclidean3();
    markovHistory3 = [null, null];
    console.log(`[COMPOSER3] → ${phase}`);
  }
  setArcPhaseForced(CFG.COMPOSER3.phases[phase].arc);
}

// ═══════════════════════════════════════════════════════════
//  PRESENCE MANAGER — silence ratio ≥ 40%
// ═══════════════════════════════════════════════════════════

function updatePresence3(dt) {
  const targets = PHASE_PRESENCE3[phase] || PHASE_PRESENCE3.germoglio;
  for (let i = 0; i < 8; i++) {
    presence3[i] += (targets[i] - presence3[i]) * Math.min(1, dt * 0.8);
  }

  // Verifica silence ratio
  const active = presence3.filter(p => p > 0.1).length;
  const silenceRatio = 1 - active / 8;
  if (silenceRatio < CFG.COMPOSER3.minSilenceRatio) {
    // Muta il layer più debole (non DRONE né RUPTURE)
    const candidates = [0, 1, 3, 4, 5, 6];
    const weakest = candidates.reduce((a, b) => presence3[a] < presence3[b] ? a : b);
    presence3[weakest] = Math.max(0, presence3[weakest] - dt * 2.0);
  }
}

// ═══════════════════════════════════════════════════════════
//  BEAT HANDLER — CH0 PULSE, CH1 GRAIN, CH5 VOICE, CH7 RUPTURE
// ═══════════════════════════════════════════════════════════

function onBeat3(beat, bar) {
  const bpm    = CFG.COMPOSER3.bpm;
  const beatMs = (60 / bpm) * 1000;
  const barBeat = beat % 4;

  // CH0 T1 PULSE — euclidean E(5,16), C2=36
  if (presence3[0] > 0.1 && euclidean3) {
    const step = euclideanStep3 % euclidean3.length;
    if (euclidean3[step]) {
      const vel = Math.round(80 + presence3[0] * 40);
      sendMIDINote(0, 36, vel, 50);
      addMidiNote(0, 36 / 127, vel / 127);
      if (barBeat === 0) addOnsetWave(0.5, 0.5, 1, 1);
    }
    euclideanStep3++;
  }

  // CH1 T2 GRAIN — GM percussion per fase
  if (presence3[1] > 0.1) {
    const g = grainNote3(beat, bar);
    if (g) {
      sendMIDINote(1, g.note, g.vel, 80);
      addMidiNote(1, g.note / 127, g.vel / 127);
    }
  }

  // CH5 T6 VOICE — Markov ogni 2 beat, probabilistico
  if (presence3[5] > 0.1 && beat % 2 === 1) {
    if (Math.random() < presence3[5] * 0.7) {
      const note = nextVoiceNote3();
      const vel  = Math.round(45 + presence3[5] * 50 + (Math.random() - 0.5) * 15);
      const dur  = Math.round(beatMs * (0.5 + Math.random() * 1.5));
      sendMIDINote(5, Math.max(36, Math.min(96, note)), Math.max(30, Math.min(127, vel)), dur);
      addMidiNote(5, note / 127, vel / 127);
    }
  }

  // CH7 T8 RUPTURE — infiltrazione e takeover (presagio via timer)
  if (ruptureStage3 === 'infiltrazione' && barBeat % 2 === 1) {
    const scale = MODES3.Eb_locrian;
    const note  = scale[Math.floor(Math.random() * scale.length)];
    const vel   = Math.round(38 + ruptureProgress3 * 30);
    sendMIDINote(7, note, Math.min(127, vel), 200);
    addMidiNote(7, note / 127, vel / 127);
  }
  if (ruptureStage3 === 'takeover') {
    const note = 64 + Math.round(Math.random() * 10); // E5-D6
    const vel  = Math.round(70 + ruptureProgress3 * 40);
    sendMIDINote(7, note, Math.min(127, vel), 300);
    addMidiNote(7, note / 127, vel / 127);
  }
}

// ═══════════════════════════════════════════════════════════
//  BAR HANDLER — CH2 DRONE, CH3 BASS, CH4 CHORDS, CH6 LEAD
// ═══════════════════════════════════════════════════════════

function onBar3(bar) {
  const bpm          = CFG.COMPOSER3.bpm;
  const beatMs       = (60 / bpm) * 1000;
  const barMs        = beatMs * 4;
  const phaseData    = CFG.COMPOSER3.phases[phase];
  const chordRhythm  = CFG.COMPOSER3.chordRhythm[phase] || 0;

  // Avanza accordo (prima del basso per coerenza armonica)
  if (chordRhythm > 0 && bar % chordRhythm === 0 && bar > 0) {
    nextChord3();
  }

  // CH2 T3 DRONE — ogni 4 bar, root+quinta+ottava
  if (presence3[2] > 0.1 && bar % 4 === 0) {
    const root   = phaseData.drone;
    const fifth  = root + 7;
    const octave = root + 12;
    const vel    = Math.round(35 + presence3[2] * 30);
    const dur    = Math.round(barMs * 3.5);
    for (const n of [root, fifth, octave]) {
      sendMIDINote(2, n, vel, dur);
      addMidiNote(2, n / 127, vel / 127);
    }
  }

  // CH3 T4 BASS — ogni chordRhythm bar, legge root da ChordEngine
  if (presence3[3] > 0.1 && chordRhythm > 0 && bar % chordRhythm === 0) {
    const bassNote = getRoot() - 12;
    const vel      = Math.round(55 + presence3[3] * 45);
    const dur      = Math.round(barMs * (chordRhythm - 0.5));
    sendMIDINote(3, Math.max(24, bassNote), vel, dur);
    addMidiNote(3, bassNote / 127, vel / 127);
  }

  // CH4 T5 CHORDS — ogni chordRhythm bar
  if (presence3[4] > 0.1 && chordRhythm > 0 && bar % chordRhythm === 0) {
    const chord = currentChord;
    const vel   = Math.round(42 + presence3[4] * 38);
    const dur   = Math.round(barMs * (chordRhythm - 0.3));
    for (const n of chord) {
      sendMIDINote(4, n, vel, dur);
      addMidiNote(4, n / 127, vel / 127);
    }
  }

  // CH6 T7 LEAD — motivo D3-G3-A3 ogni 8 bar
  if (presence3[6] > 0.1 && bar % 8 === 0 && bar > 0) {
    const motif   = [50, 55, 57]; // D3, G3, A3
    const velBase = Math.round(55 + presence3[6] * 40);
    let delay = 0;
    for (const n of motif) {
      const noteDelay = delay;
      setTimeout(() => {
        if (!composer3Active) return;
        sendMIDINote(6, n, velBase, Math.round(beatMs * 1.5));
        addMidiNote(6, n / 127, velBase / 127);
      }, noteDelay);
      delay += Math.round(beatMs * 0.75);
    }
  }

  // CH7 RUPTURE residuo — note diradate con vel decrescente
  if (ruptureStage3 === 'residuo' && bar % 2 === 0) {
    const vel = Math.round(50 * (1 - ruptureProgress3));
    if (vel > 10) {
      sendMIDINote(7, 50, vel, 400); // D3
      addMidiNote(7, 50 / 127, vel / 127);
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  STATE INJECTION
// ═══════════════════════════════════════════════════════════

function injectState3() {
  const active = presence3.filter(p => p > 0.1).length;
  state.intensity   = Math.min(1, active / 8 + ruptureProgress3 * 0.2);
  state.rhythmicity = Math.min(1, presence3[0] * 1.2 + presence3[1] * 0.5);
  if (phase === 'densita')           state.trajectory =  1;
  else if (phase === 'dissoluzione') state.trajectory = -1;
  else                               state.trajectory =  0;
}

// ═══════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════

export function initComposer3() {
  clock = 0;
  lastBeat = -1;
  lastBar  = -1;
  phase    = CFG.COMPOSER3.phaseOrder[0];
  phaseIdx = 0;
  phaseClock = 0;
  presence3.fill(0);
  ruptureStage3    = 'idle';
  ruptureProgress3 = 0;
  ruptureNoteTimer = 2;
  markovHistory3   = [null, null];
  initChord3();
  initEuclidean3();
}

export function toggleComposer3() {
  composer3Active = !composer3Active;
  if (composer3Active) {
    initComposer3();
    console.log('[COMPOSER3] ON — D Dorian DERIVA 84bpm');
  } else {
    sendMIDIAllNotesOff();
    setComposerClimax(false);
    releaseArcHold();
    console.log('[COMPOSER3] OFF');
  }
}

export function updateComposer3(dt) {
  updatePhase3(dt);
  updatePresence3(dt);
  updateRupture3(dt);

  // Beat clock a 84 BPM
  const beatsPerSec = CFG.COMPOSER3.bpm / 60;
  clock += dt * beatsPerSec;
  const currentBeat = Math.floor(clock);
  const currentBar  = Math.floor(clock / 4);

  if (currentBeat > lastBeat) {
    lastBeat = currentBeat;
    onBeat3(currentBeat, currentBar);
  }
  if (currentBar > lastBar) {
    lastBar = currentBar;
    onBar3(currentBar);
  }

  injectState3();
}

export function getComposer3Status() {
  return {
    active: composer3Active,
    phase,
    ruptureStage: ruptureStage3,
    chordRoot: currentChord[0],
    bar: Math.floor(clock / 4),
  };
}
