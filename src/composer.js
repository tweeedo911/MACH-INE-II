// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Composer (Mode 2)
//  Generazione armonica autonoma: MIDI out + visual bridge
//  Fasi: GERMOGLIO→PULSAZIONE→DENSITÀ→ROTTURA→DISSOLUZIONE
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { state } from './state.js';
import { sendMIDINote, sendMIDIAllNotesOff } from './midi.js';
import { setArcPhaseForced, releaseArcHold } from './director.js';
import { setComposerClimax } from './colors.js';
import { addMidiNote, addOnsetWave } from './field.js';

// ═══════════════════════════════════════════════════════════
//  SCALE DEFINITIONS (pitch class sets, 2 ottave da C3=48)
// ═══════════════════════════════════════════════════════════

const MODES = {
  D_dorian:   [50,52,53,55,57,59,60,62,64,65,67,69,71,72,74], // D E F G A B C D ...
  D_phrygian: [50,51,53,55,57,58,60,62,63,65,67,69,70,72,74], // D Eb F G A Bb C D
  A_lydian:   [57,59,61,62,64,66,68,69,71,73,74,76,78,80,81], // A B C# D E F# G# A
  Eb_locrian: [63,64,66,68,69,71,73,75,76,78,80,81,83,85,87], // Eb Fb Gb Ab Bbb Cb Db
};

const PIVOT_PCS = new Set([2, 5, 9]); // D, F, A (pitch class 0=C)

// Accordi per fase (gradi della scala, 0-based)
const PHASE_CHORDS = {
  germoglio:    [[0,2,4], [0,2,5], [2,4,6]],
  pulsazione:   [[0,2,4], [2,4,6], [4,6,1]],
  densita:      [[0,2,4], [1,3,5], [3,5,0]],
  rottura:      [[0,1,3], [1,2,4], [0,2,3]],
  dissoluzione: [[0,2,4], [5,0,2], [2,4,6]],
};

// ═══════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════

export let composerActive = false;

let clock = 0;
let bar = 0;
let lastBar = -1;
let lastBeat = -1;
let phase = 'germoglio';
let phaseIdx = 0;
let phaseClock = 0;
let lastChord = null;
let markovHistory = [null, null];
let presence = [0, 0, 0, 0, 0, 0, 0]; // per traccia (0..1)
let ruptureStage = 'idle';
let ruptureProgress = 0;
let euclideanCache = null;
let euclideanStep = 0;

// ═══════════════════════════════════════════════════════════
//  EUCLIDEAN RHYTHM — Bjorklund
// ═══════════════════════════════════════════════════════════

function buildEuclidean(steps, total) {
  const pattern = [];
  let bucket = 0;
  for (let i = 0; i < total; i++) {
    bucket += steps;
    if (bucket >= total) { bucket -= total; pattern.push(true); }
    else pattern.push(false);
  }
  return pattern;
}

function getEuclideanPattern() {
  const cfg = CFG.COMPOSER.euclidean;
  const [steps, total] = phase === 'rottura' ? cfg.rottura : cfg.normal;
  if (!euclideanCache || euclideanCache.length !== total) {
    euclideanCache = buildEuclidean(steps, total);
    euclideanStep = 0;
  }
  return euclideanCache;
}

function euclideanIsOn(beatInBar, subdivisions = 4) {
  const pattern = getEuclideanPattern();
  const idx = (beatInBar * (pattern.length / subdivisions)) % pattern.length | 0;
  return pattern[idx];
}

// ═══════════════════════════════════════════════════════════
//  CHORD ENGINE — voice leading
// ═══════════════════════════════════════════════════════════

function scaleNotes() {
  const p = CFG.COMPOSER.phases[phase];
  return MODES[p.mode] || MODES.D_dorian;
}

function nextChord() {
  const scale = scaleNotes();
  const pool = PHASE_CHORDS[phase] || PHASE_CHORDS.germoglio;
  const degrees = pool[Math.floor(Math.random() * pool.length)];
  const notes = degrees.map(d => scale[d % scale.length]);

  // Voice leading: minimizza distanza da accordo precedente
  if (lastChord) {
    const led = notes.map((n, i) => {
      const prev = lastChord[i] || n;
      const diff = n - prev;
      if (Math.abs(diff) <= CFG.COMPOSER.voiceLeadingMax) return n;
      return diff > 0 ? n - 12 : n + 12;
    });
    lastChord = led;
    return led;
  }
  lastChord = notes;
  return notes;
}

// ═══════════════════════════════════════════════════════════
//  MARKOV 2nd ORDER — melodia VOICE
// ═══════════════════════════════════════════════════════════

function nextVoiceNote() {
  const scale = scaleNotes();
  const pivotWeight = 1.7;
  const biasWeight = 2.2;

  // Build weighted pool
  const pool = [];
  for (const n of scale) {
    const pc = n % 12;
    let w = 1.0;
    if (PIVOT_PCS.has(pc)) w *= pivotWeight;
    // Direzione: bias verso centro
    if (markovHistory[1] !== null) {
      const prev = markovHistory[1];
      const diff = n - prev;
      if (Math.abs(diff) <= 4) w *= biasWeight; // preferisce salti piccoli
      if (Math.abs(diff) > 7) w *= 0.2;         // evita salti grandi
    }
    pool.push({ n, w });
  }

  // Forza pivot se mancante nelle ultime 2 note
  const recentPivot = markovHistory.some(n => n !== null && PIVOT_PCS.has(n % 12));
  if (!recentPivot) {
    for (const entry of pool) {
      if (PIVOT_PCS.has(entry.n % 12)) entry.w *= 3.0;
    }
  }

  const total = pool.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  let chosen = pool[0].n;
  for (const entry of pool) {
    r -= entry.w;
    if (r <= 0) { chosen = entry.n; break; }
  }

  markovHistory[0] = markovHistory[1];
  markovHistory[1] = chosen;
  return chosen;
}

// ═══════════════════════════════════════════════════════════
//  PRESENCE MANAGER — fade in/out per traccia
// ═══════════════════════════════════════════════════════════

const PHASE_PRESENCE = {
  // [target presence per traccia: KICK, BASS, HARM, VOICE, DRONE, GRAIN, RUPTURE]
  germoglio:    [0.0, 0.3, 0.4, 0.2, 0.8, 0.0, 0.0],
  pulsazione:   [0.8, 0.6, 0.5, 0.4, 0.6, 0.3, 0.0],
  densita:      [0.9, 0.8, 0.8, 0.7, 0.5, 0.6, 0.0],
  rottura:      [0.3, 0.5, 0.3, 0.2, 0.2, 0.7, 1.0],
  dissoluzione: [0.2, 0.4, 0.5, 0.6, 0.9, 0.2, 0.0],
};

function updatePresence(dt) {
  const targets = PHASE_PRESENCE[phase] || PHASE_PRESENCE.germoglio;
  for (let i = 0; i < 7; i++) {
    presence[i] += (targets[i] - presence[i]) * Math.min(1, dt * 0.8);
  }

  // Verifica silence ratio: almeno il 40% delle tracce deve essere sotto 0.1
  const active = presence.filter(p => p > 0.1).length;
  const silenceRatio = 1 - active / 7;
  if (silenceRatio < CFG.COMPOSER.minSilenceRatio) {
    // Muta random la traccia più debole (non DRONE né RUPTURE)
    const candidates = [0, 1, 2, 3, 5];
    const weakest = candidates.reduce((a, b) => presence[a] < presence[b] ? a : b);
    presence[weakest] = Math.max(0, presence[weakest] - dt * 2.0);
  }
}

// ═══════════════════════════════════════════════════════════
//  RUPTURE ENGINE — 4 stadi
// ═══════════════════════════════════════════════════════════

function updateRupture(dt) {
  if (phase !== 'rottura') {
    if (ruptureStage !== 'idle') {
      ruptureStage = 'idle';
      ruptureProgress = 0;
      setComposerClimax(false);
    }
    return;
  }

  const phaseDuration = CFG.COMPOSER.phases.rottura.duration;
  ruptureProgress = Math.min(1, phaseClock / phaseDuration);

  const r = CFG.COMPOSER.rupture;
  if (ruptureProgress < r.presagio[1])           ruptureStage = 'presagio';
  else if (ruptureProgress < r.infiltrazione[1]) ruptureStage = 'infiltrazione';
  else if (ruptureProgress < r.takeover[1])      ruptureStage = 'takeover';
  else                                            ruptureStage = 'residuo';

  setComposerClimax(ruptureStage === 'takeover');
}

// ═══════════════════════════════════════════════════════════
//  STATE INJECTION — sovrascrive state.* con valori sintetici
// ═══════════════════════════════════════════════════════════

function injectState() {
  // Intensità = media pesata delle presence attive
  const weights = [1.2, 1.0, 0.8, 0.7, 0.4, 0.9, 1.5];
  let wSum = 0, wTotal = 0;
  for (let i = 0; i < 7; i++) { wSum += presence[i] * weights[i]; wTotal += weights[i]; }
  state.intensity = Math.min(1, wSum / wTotal);

  // Rhythmicity = presence KICK + GRAIN
  state.rhythmicity = Math.min(1, (presence[0] * 1.5 + presence[5]) * 0.7);

  // Trajectory
  if (phase === 'densita')      state.trajectory = 1;
  else if (phase === 'dissoluzione') state.trajectory = -1;
  else                          state.trajectory = 0;
}

// ═══════════════════════════════════════════════════════════
//  BEAT SCHEDULER — triggerato una volta per beat
// ═══════════════════════════════════════════════════════════

function onBeat(beatInBar) {
  const bpm = CFG.COMPOSER.bpm;
  const barDuration = (60 / bpm) * 4;
  const scale = scaleNotes();
  const chord = lastChord || nextChord();

  // ── CH0 KICK — euclidean ──
  if (presence[0] > 0.1 && euclideanIsOn(beatInBar)) {
    const vel = Math.round(70 + presence[0] * 57);
    sendMIDINote(0, 36, vel, 50);
    addMidiNote(0, 0.5, vel / 127);
    if (beatInBar === 0) addOnsetWave(0.5, 0.5, 1, 1);
  }

  // ── CH1 BASS (TENSION) — ogni 2 bar, su beat 0 ──
  if (presence[1] > 0.1 && beatInBar === 0 && bar % 2 === 0) {
    const root = chord[0];
    const bassNote = root > 60 ? root - 12 : root;
    const vel = Math.round(60 + presence[1] * 50);
    const dur = Math.round(barDuration * 2 * 1000);
    sendMIDINote(1, bassNote, vel, dur);
    addMidiNote(1, bassNote / 127, vel / 127);
  }

  // ── CH2 HARMONY (CHORDS) — beat 0 e beat 2 ──
  if (presence[2] > 0.1 && (beatInBar === 0 || beatInBar === 2)) {
    if (beatInBar === 0) nextChord();
    const c = lastChord;
    const vel = Math.round(45 + presence[2] * 40);
    const dur = Math.round((60 / bpm) * 2 * 1000);
    for (let i = 0; i < c.length; i++) {
      sendMIDINote(2, c[i], vel, dur);
      addMidiNote(2, c[i] / 127, vel / 127);
    }
  }

  // ── CH3 VOICE (LEAD) — beat dispari ──
  if (presence[3] > 0.1 && beatInBar % 2 === 1) {
    const note = nextVoiceNote();
    const vel = Math.round(50 + presence[3] * 55 + (Math.random() - 0.5) * 20);
    const dur = Math.round((60 / bpm) * (0.5 + Math.random()) * 1000);
    sendMIDINote(3, Math.max(36, Math.min(96, note)), Math.max(30, Math.min(127, vel)), dur);
    addMidiNote(3, note / 127, vel / 127);
  }

  // ── CH4 DRONE (FIELD) — ogni 8 bar su beat 0 ──
  if (presence[4] > 0.1 && beatInBar === 0 && bar % 8 === 0) {
    const drone = CFG.COMPOSER.phases[phase].drone;
    const vel = Math.round(40 + presence[4] * 35);
    const dur = Math.round(barDuration * 8 * 1000);
    sendMIDINote(4, drone, vel, dur);
    addMidiNote(4, drone / 127, vel / 127);
  }

  // ── CH5 GRAIN — beat pari, burst rapidi ──
  if (presence[5] > 0.1 && beatInBar % 2 === 0) {
    const grainCount = 1 + Math.round(presence[5] * 3);
    for (let g = 0; g < grainCount; g++) {
      const note = scale[Math.floor(Math.random() * scale.length)];
      const vel = Math.round(30 + Math.random() * 60);
      const dur = 40 + Math.round(Math.random() * 80);
      sendMIDINote(5, note, vel, dur);
      addMidiNote(5, note / 127, vel / 127);
    }
  }

  // ── CH6 RUPTURE — solo in rottura, dipende dallo stage ──
  if (presence[6] > 0.1 && phase === 'rottura') {
    const stageActions = {
      presagio:      () => beatInBar === 3,
      infiltrazione: () => beatInBar % 2 === 1,
      takeover:      () => true,
      residuo:       () => beatInBar === 0,
    };
    const shouldPlay = stageActions[ruptureStage]?.() || false;
    if (shouldPlay) {
      const dissonant = MODES.Eb_locrian;
      const note = dissonant[Math.floor(Math.random() * dissonant.length)];
      const vel = Math.round(60 + ruptureProgress * 67);
      const dur = ruptureStage === 'takeover' ? 400 : 150;
      sendMIDINote(6, note, Math.min(127, vel), dur);
      addMidiNote(6, note / 127, vel / 127);
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  PHASE ENGINE
// ═══════════════════════════════════════════════════════════

function updatePhase(dt) {
  phaseClock += dt;
  const currentPhaseData = CFG.COMPOSER.phases[phase];
  if (phaseClock >= currentPhaseData.duration) {
    phaseClock = 0;
    phaseIdx = (phaseIdx + 1) % CFG.COMPOSER.phaseOrder.length;
    phase = CFG.COMPOSER.phaseOrder[phaseIdx];
    lastChord = null;
    euclideanCache = null;
    euclideanStep = 0;
  }
  setArcPhaseForced(CFG.COMPOSER.phases[phase].arc);
}

// ═══════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════

export function initComposer() {
  clock = 0;
  bar = 0;
  lastBar = -1;
  lastBeat = -1;
  phase = CFG.COMPOSER.phaseOrder[0];
  phaseIdx = 0;
  phaseClock = 0;
  lastChord = null;
  markovHistory = [null, null];
  presence = [0, 0, 0, 0, 0, 0, 0];
  ruptureStage = 'idle';
  ruptureProgress = 0;
  euclideanCache = null;
  euclideanStep = 0;
}

export function updateComposer(dt) {
  clock += dt;

  const bpm = CFG.COMPOSER.bpm;
  const beatDuration = 60 / bpm;
  const barDuration  = beatDuration * 4;

  const currentBar  = Math.floor(clock / barDuration);
  const currentBeat = Math.floor((clock % barDuration) / beatDuration);

  bar = currentBar;

  // Aggiorna fasi e presence
  updatePhase(dt);
  updatePresence(dt);
  updateRupture(dt);

  // Trigger beat (una volta sola)
  if (currentBeat !== lastBeat || currentBar !== lastBar) {
    lastBeat = currentBeat;
    lastBar  = currentBar;
    onBeat(currentBeat);
  }

  // Inietta state
  injectState();
}

export function toggleComposer() {
  composerActive = !composerActive;
  if (composerActive) {
    initComposer();
    console.log('[COMPOSER] ON');
  } else {
    sendMIDIAllNotesOff();
    setComposerClimax(false);
    releaseArcHold();
    console.log('[COMPOSER] OFF');
  }
}
