// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Composer (Mode 2)
//  Generazione armonica autonoma: MIDI out + visual bridge
//  Fasi: GERMOGLIO→PULSAZIONE→DENSITÀ→ROTTURA→DISSOLUZIONE
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { state } from './state.js';
import { sendMIDINote as _rawSend, sendMIDIAllNotesOff } from './midi.js';
import { setArcPhaseForced, releaseArcHold } from './director.js';
import { setComposerClimax } from './colors.js';
import { addMidiNote as _rawAddMidi, addOnsetWave } from './field.js';
import { setEngine } from './midi-patterns.js';
import { getPresenceMultiplier, isChannelAllowed } from './presence-multiplier.js';

// ── Presence-scaled MIDI output (with channel priority) ──
function sendMIDINote(ch, note, vel, dur) {
  const pm = getPresenceMultiplier('terreno');
  if (pm < 0.05) return;
  if (!isChannelAllowed('terreno', ch)) return;
  _rawSend(ch, note, Math.max(1, Math.round(vel * pm)), dur);
}
function addMidiNote(ch, x, intensity) {
  _rawAddMidi(ch, x, intensity * getPresenceMultiplier('terreno'));
}

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

// Progressioni accordali fisse per fase (MIDI assoluto — D Dorian/Phrygian/A Lydian)
const CHORD_PROGRESSIONS = {
  germoglio:    [[50,53,57], [55,59,62]],                                          // Dm → G
  pulsazione:   [[50,53,57], [55,59,62], [53,57,60], [50,53,57]],                // Dm → G → F → Dm
  densita:      [[50,53,57], [53,57,60], [55,59,62], [57,60,64], [53,57,60], [50,55,57]], // Dm→F→G→Am→F→Dsus
  rottura:      null, // random dissonant
  dissoluzione: [[50,53,57], [55,59,62], [53,57,60], [50,53,57]],                // Dm → G → F → Dm
};
let chordProgIdx = 0;

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
  const prog = CHORD_PROGRESSIONS[phase];
  if (prog) {
    // Fixed progression — advance index
    chordProgIdx = (chordProgIdx + 1) % prog.length;
    const notes = [...prog[chordProgIdx]];
    // Voice leading against previous chord
    if (lastChord) {
      for (let i = 0; i < notes.length; i++) {
        const diff = notes[i] - lastChord[i];
        if (Math.abs(diff) > 7) notes[i] += diff > 0 ? -12 : 12;
      }
    }
    lastChord = notes;
    return notes;
  }
  // Rottura: dissonant random from scale
  const scale = scaleNotes();
  const degrees = [0, 1, 3];
  const notes = degrees.map(d => scale[d % scale.length]);
  lastChord = notes;
  return notes;
}

// ═══════════════════════════════════════════════════════════
//  MARKOV 2nd ORDER — melodia VOICE
// ═══════════════════════════════════════════════════════════

// Motivic memory: store last 4 intervals, tend to repeat/vary them
let motifIntervals = [];
const MOTIF_LEN = 4;

function nextVoiceNote() {
  const scale = scaleNotes();
  const chord = lastChord || [];

  const pool = [];
  for (const n of scale) {
    const pc = n % 12;
    let w = 1.0;
    // Chord tones weighted ×3 (harmonic coherence)
    if (chord.some(c => c % 12 === pc)) w *= 3.0;
    // Pivot tones
    if (PIVOT_PCS.has(pc)) w *= 1.5;
    // Step preference
    if (markovHistory[1] !== null) {
      const diff = n - markovHistory[1];
      if (Math.abs(diff) <= 3) w *= 2.5;  // stepwise preferred
      if (Math.abs(diff) > 7) w *= 0.15;  // large leaps rare
      // Motivic repetition: if this interval matches a recent motif interval, boost
      if (motifIntervals.length >= 2) {
        const candidateInterval = diff;
        for (const mi of motifIntervals) {
          if (mi === candidateInterval) w *= 1.8; // exact repeat
          if (Math.abs(mi - candidateInterval) === 1) w *= 1.3; // slight variation
        }
      }
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

  // Record interval for motivic memory
  if (markovHistory[1] !== null) {
    motifIntervals.push(chosen - markovHistory[1]);
    if (motifIntervals.length > MOTIF_LEN) motifIntervals.shift();
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
  const pm = getPresenceMultiplier('terreno');
  // Intensità = media pesata delle presence attive
  const weights = [1.2, 1.0, 0.8, 0.7, 0.4, 0.9, 1.5];
  let wSum = 0, wTotal = 0;
  for (let i = 0; i < 7; i++) { wSum += presence[i] * weights[i]; wTotal += weights[i]; }
  state.intensity = Math.min(1, wSum / wTotal) * pm;

  // Rhythmicity = presence KICK + GRAIN
  state.rhythmicity = Math.min(1, (presence[0] * 1.5 + presence[5]) * 0.7) * pm;

  // Trajectory
  if (phase === 'densita')      state.trajectory = 1;
  else if (phase === 'dissoluzione') state.trajectory = -1;
  else                          state.trajectory = 0;
}

// ═══════════════════════════════════════════════════════════
//  BEAT SCHEDULER — triggerato una volta per beat
// ═══════════════════════════════════════════════════════════

// Bass pattern: syncopated dub patterns per phase
const BASS_PATTERNS = {
  germoglio:    [1,0,0,0],  // only downbeat
  pulsazione:   [1,0,0,1],  // downbeat + anticipation on beat 4
  densita:      [1,0,1,0],  // downbeat + beat 3 (half-time feel)
  rottura:      [0,1,0,1],  // off-beat only (destabilizing)
  dissoluzione: [1,0,0,0],  // return to downbeat
};

function onBeat(beatInBar) {
  const bpm = CFG.COMPOSER.bpm;
  const beatMs = (60 / bpm) * 1000;
  const barDuration = (60 / bpm) * 4;
  const scale = scaleNotes();
  const chord = lastChord || nextChord();
  const swingMs = 20; // dub swing offset on even beats

  // ── CH0 KICK — euclidean with swing ──
  if (presence[0] > 0.1 && euclideanIsOn(beatInBar)) {
    const swingDelay = (beatInBar % 2 === 0 && beatInBar > 0) ? swingMs : 0;
    const vel = beatInBar === 0
      ? Math.round(95 + presence[0] * 32)
      : Math.round(65 + presence[0] * 40 + (Math.random() - 0.5) * 15);
    setTimeout(() => {
      if (!composerActive) return;
      sendMIDINote(0, 36, vel, 50);
      addMidiNote(0, 0.5, vel / 127);
    }, swingDelay);
    if (beatInBar === 0) addOnsetWave(0.5, 0.5, 1, 1);
  }

  // ── CH3 BASS — melodic dub bass with syncopation ──
  if (presence[1] > 0.1) {
    const pat = BASS_PATTERNS[phase] || BASS_PATTERNS.germoglio;
    if (pat[beatInBar]) {
      const root = chord[0];
      const bassRoot = root > 60 ? root - 12 : root;
      // Melodic variation: root, fifth, octave jump
      let bassNote = bassRoot;
      if (beatInBar === 3) bassNote = bassRoot + 7; // fifth on beat 4
      if (phase === 'densita' && beatInBar === 2) bassNote = bassRoot + 12; // octave on beat 3
      const vel = Math.round(75 + presence[1] * 40 + (Math.random() - 0.5) * 10);
      const dur = beatInBar === 0
        ? Math.round(beatMs * 3.5)  // long sustain on downbeat
        : Math.round(beatMs * 1.2); // shorter on syncopations
      sendMIDINote(3, bassNote, vel, dur);
      addMidiNote(3, bassNote / 127, vel / 127);
    }
  }

  // ── CH4 CHORDS — beat 0 advance progression, beat 0+2 play ──
  if (presence[2] > 0.1 && (beatInBar === 0 || beatInBar === 2)) {
    if (beatInBar === 0) nextChord();
    const c = lastChord;
    const vel = Math.round(40 + presence[2] * 35);
    const dur = Math.round(beatMs * 3.5);
    for (let i = 0; i < c.length; i++) {
      sendMIDINote(4, c[i], vel, dur);
      addMidiNote(4, c[i] / 127, vel / 127);
    }
  }

  // ── CH5 VOICE — beat dispari, motivic phrases ──
  if (presence[3] > 0.1 && beatInBar % 2 === 1) {
    // Phrase gating: 70% chance to play (creates breathing space)
    if (Math.random() < 0.7) {
      const note = nextVoiceNote();
      const vel = Math.round(48 + presence[3] * 50 + (Math.random() - 0.5) * 12);
      // Variable duration: longer notes on beat 3, shorter on beat 1
      const durMul = beatInBar === 3 ? (1.0 + Math.random() * 0.8) : (0.4 + Math.random() * 0.4);
      const dur = Math.round(beatMs * durMul);
      sendMIDINote(5, Math.max(36, Math.min(96, note)), Math.max(30, Math.min(127, vel)), dur);
      addMidiNote(5, note / 127, vel / 127);
    }
  }

  // ── CH2 DRONE — ogni 8 bar su beat 0, root + fifth ──
  if (presence[4] > 0.1 && beatInBar === 0 && bar % 8 === 0) {
    const drone = CFG.COMPOSER.phases[phase].drone;
    const vel = Math.round(35 + presence[4] * 30);
    const dur = Math.round(barDuration * 7 * 1000);
    sendMIDINote(2, drone, vel, dur);
    sendMIDINote(2, drone + 7, Math.round(vel * 0.7), dur); // fifth
    addMidiNote(2, drone / 127, vel / 127);
  }

  // ── CH1 GRAIN — beat pari, burst rapidi ──
  if (presence[5] > 0.1 && beatInBar % 2 === 0) {
    const grainCount = 1 + Math.round(presence[5] * 2);
    for (let g = 0; g < grainCount; g++) {
      const note = scale[Math.floor(Math.random() * scale.length)];
      const vel = Math.round(25 + Math.random() * 45);
      const dur = 30 + Math.round(Math.random() * 60);
      sendMIDINote(1, note, vel, dur);
      addMidiNote(1, note / 127, vel / 127);
    }
  }

  // ── CH7 RUPTURE — solo in rottura ──
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
      sendMIDINote(7, note, Math.min(127, vel), dur);
      addMidiNote(7, note / 127, vel / 127);
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
    chordProgIdx = 0;
    motifIntervals = [];
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
  motifIntervals = [];
  chordProgIdx = 0;
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
    setEngine('terreno');
    console.log('[COMPOSER] ON — D Dorian TERRENO 72bpm');
  } else {
    sendMIDIAllNotesOff();
    setComposerClimax(false);
    releaseArcHold();
    setEngine(null);
    console.log('[COMPOSER] OFF');
  }
}
