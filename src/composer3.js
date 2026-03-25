// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Composer 3
//  DERIVA — A Lydian — no fixed BPM — brightness-driven VOICE
//  CH1=GRAIN CH2=DRONE CH4=CHORDS CH5=VOICE CH6=LEAD CH7=RUPTURE
//  CH0 PULSE and CH3 BASS: not used (presence = 0)
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { state } from './state.js';
import { audio } from './audio.js';
import { sendMIDINote as _rawSend, sendMIDIAllNotesOff } from './midi.js';
import { setArcPhaseForced, releaseArcHold } from './director.js';
import { setComposerClimax } from './colors.js';
import { addMidiNote as _rawAddMidi } from './field.js';
import { setEngine } from './midi-patterns.js';
import { getPresenceMultiplier, isChannelAllowed } from './presence-multiplier.js';

// ── Presence-scaled MIDI output (with channel priority) ──
function sendMIDINote(ch, note, vel, dur) {
  const pm = getPresenceMultiplier('deriva');
  if (pm < 0.05) return;
  if (!isChannelAllowed('deriva', ch)) return;
  _rawSend(ch, note, Math.max(1, Math.round(vel * pm)), dur);
}
function addMidiNote(ch, x, intensity) {
  _rawAddMidi(ch, x, intensity * getPresenceMultiplier('deriva'));
}

// ── Scale modes (A Lydian primary) ──
const MODES3 = {
  D_dorian:   [50,52,53,55,57,59,60,62,64,65,67,69,71,72,74],
  D_phrygian: [50,51,53,55,57,58,60,62,63,65,67,69,70,72,74],
  A_lydian:   [57,59,61,62,64,66,68,69,71,73,74,76,78,80,81],
  Eb_locrian: [63,64,66,68,69,71,73,75,76,78,80,81,83,85,87],
};

// ── Presenza target per fase [PULSE, GRAIN, DRONE, BASS, CHORDS, VOICE, LEAD, RUPTURE] ──
// DERIVA: CH0 PULSE = 0 always, CH3 BASS = 0 always
const PHASE_PRESENCE3 = {
  germoglio:    [0.0, 0.1, 1.0, 0.0, 0.3, 0.0, 0.0, 0.0],
  pulsazione:   [0.0, 0.4, 0.7, 0.0, 0.6, 0.5, 0.0, 0.0],
  densita:      [0.0, 0.7, 0.5, 0.0, 0.8, 0.9, 0.4, 0.0],
  rottura:      [0.0, 0.5, 0.3, 0.0, 0.2, 0.3, 0.0, 1.0],
  dissoluzione: [0.0, 0.3, 1.0, 0.0, 0.5, 0.7, 0.2, 0.0],
};

// ── State ──
export let composer3Active = false;

let timeSec = 0;      // elapsed time in seconds (no BPM)
let lastDriftBar = -1; // virtual bar counter for DRONE/CHORDS timing
let phase    = 'germoglio';
let phaseIdx = 0;
let phaseClock = 0;

// ChordEngine
let chordIdx = 0;
let currentChord = [57, 61, 64]; // A major iniziale

// MarkovEngine
let markovHistory3 = [null, null];

// Brightness trigger for VOICE (replaces beat-based triggering)
let centroidHistory = [];   // moving average buffer
let centroidAvg = 0;        // running average
let brightnessCooldown = 0; // seconds until next trigger allowed

// RuptureEngine
let ruptureStage3 = 'idle';
let ruptureProgress3 = 0;
let ruptureNoteTimer = 2; // timer per note off-beat in presagio

// Presence per traccia
let presence3 = [0, 0, 0, 0, 0, 0, 0, 0];

// ═══════════════════════════════════════════════════════════
//  CHORD ENGINE — progressioni fisse per fase (A Lydian)
// ═══════════════════════════════════════════════════════════

function initChord3() {
  const prog = CFG.COMPOSER3.chordProgressions[phase];
  chordIdx = 0;
  currentChord = (prog && prog[0]) ? [...prog[0]] : [57, 61, 64];
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

let lastVoiceInterval3 = 0; // interval memory for contour shaping

function nextVoiceNote3() {
  const phaseData = CFG.COMPOSER3.phases[phase];
  const scale = MODES3[phaseData.mode] || MODES3.D_dorian;

  const pool = [];
  for (const n of scale) {
    let w = 1.0;
    // Chord tone bias ×3
    if (currentChord.some(c => c % 12 === n % 12)) w = 3.0;
    if (markovHistory3[1] !== null) {
      const diff = n - markovHistory3[1];
      const absDiff = Math.abs(diff);
      // Stepwise preference
      if (absDiff <= 3) w *= 2.5;
      if (absDiff > 7) w *= 0.2;
      // Contour rule: after a leap, tend to step back (Narmour)
      if (Math.abs(lastVoiceInterval3) > 4) {
        // After large leap, favor opposite direction stepwise
        const resolveDir = -Math.sign(lastVoiceInterval3);
        if (Math.sign(diff) === resolveDir && absDiff <= 3) w *= 2.5;
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

  if (markovHistory3[1] !== null) lastVoiceInterval3 = chosen - markovHistory3[1];
  markovHistory3[0] = markovHistory3[1];
  markovHistory3[1] = chosen;
  return chosen;
}

// (GRAIN ENGINE removed — DERIVA uses air-energy-driven updateGrain3 instead)

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
//  BRIGHTNESS TRIGGER — adaptive threshold for VOICE (replaces beat clock)
// ═══════════════════════════════════════════════════════════

function updateBrightnessTrigger(dt) {
  const cfg = CFG.COMPOSER3.brightnessTrigger;
  const centroid = audio.centroid || 0;

  // Update moving average
  centroidHistory.push(centroid);
  if (centroidHistory.length > cfg.adaptiveWindow) centroidHistory.shift();
  centroidAvg = centroidHistory.reduce((s, v) => s + v, 0) / centroidHistory.length;

  // Adaptive threshold
  const threshold = Math.max(cfg.minThreshold, centroidAvg * cfg.adaptiveMultiplier);

  // Cooldown
  if (brightnessCooldown > 0) {
    brightnessCooldown -= dt;
    return;
  }

  // CH5 VOICE — trigger when centroid crosses threshold
  if (presence3[5] > 0.1 && centroid > threshold) {
    if (Math.random() < presence3[5] * 0.8) {
      const note = nextVoiceNote3();
      const vel  = Math.round(40 + presence3[5] * 45 + (Math.random() - 0.5) * 15);
      const dur  = Math.round(500 + Math.random() * 300); // short drops (~0.5 beat)
      sendMIDINote(5, Math.max(36, Math.min(96, note)), Math.max(30, Math.min(127, vel)), dur);
      addMidiNote(5, note / 127, vel / 127);
      brightnessCooldown = 0.4 + Math.random() * 0.6; // 0.4–1.0 sec between triggers
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  GRAIN TRIGGER — density proportional to audio.bands.air
// ═══════════════════════════════════════════════════════════

let grainAccum = 0;

function updateGrain3(dt) {
  if (presence3[1] < 0.1) return;
  const airEnergy = (audio.bands?.air?.L || 0) + (audio.bands?.air?.R || 0);
  // Higher air → more frequent grain events
  const rate = presence3[1] * (0.8 + airEnergy * 5); // events per second
  grainAccum += dt * rate;
  if (grainAccum >= 1) {
    grainAccum -= 1;
    // Pitched grain from A Lydian scale — high register shimmering textures
    const phaseData = CFG.COMPOSER3.phases[phase];
    const scale = MODES3[phaseData.mode] || MODES3.A_lydian;
    const hi = scale.filter(n => n >= 72 && n <= 93);
    const pool = hi.length > 0 ? hi : scale;
    const note = pool[Math.floor(Math.random() * pool.length)];
    const vel = 22 + Math.round(Math.random() * 28 + airEnergy * 35);
    const dur = 60 + Math.round(Math.random() * 120); // short pitched grains
    sendMIDINote(1, note, Math.min(127, vel), dur);
    addMidiNote(1, note / 127, vel / 127);
  }
}

// ═══════════════════════════════════════════════════════════
//  RUPTURE TICK — CH7 events (presagio via timer, infiltrazione/takeover periodic)
// ═══════════════════════════════════════════════════════════

let ruptureTick = 0;

function updateRuptureNotes(dt) {
  if (ruptureStage3 === 'infiltrazione') {
    ruptureTick += dt;
    if (ruptureTick >= 1.5) { // ~every 1.5 sec
      ruptureTick = 0;
      const scale = MODES3.Eb_locrian;
      const note  = scale[Math.floor(Math.random() * scale.length)];
      const vel   = Math.round(38 + ruptureProgress3 * 30);
      sendMIDINote(7, note, Math.min(127, vel), 200);
      addMidiNote(7, note / 127, vel / 127);
    }
  } else if (ruptureStage3 === 'takeover') {
    ruptureTick += dt;
    if (ruptureTick >= 0.8) { // ~every 0.8 sec
      ruptureTick = 0;
      const note = 64 + Math.round(Math.random() * 10);
      const vel  = Math.round(70 + ruptureProgress3 * 40);
      sendMIDINote(7, note, Math.min(127, vel), 300);
      addMidiNote(7, note / 127, vel / 127);
    }
  } else {
    ruptureTick = 0;
  }
}

// ═══════════════════════════════════════════════════════════
//  DRIFT BAR HANDLER — CH2 DRONE, CH4 CHORDS, CH6 LEAD (time-based)
// ═══════════════════════════════════════════════════════════

function onDriftBar3(driftBar) {
  const barSec       = CFG.COMPOSER3.driftBarSec;
  const barMs        = barSec * 1000;
  const phaseData    = CFG.COMPOSER3.phases[phase];
  const chordRhythm  = CFG.COMPOSER3.chordRhythm[phase] || 0;

  // Advance chord (before drone for harmonic coherence)
  if (chordRhythm > 0 && driftBar % chordRhythm === 0 && driftBar > 0) {
    nextChord3();
  }

  // CH2 DRONE — every 4 drift bars, root+fifth+octave, very long
  if (presence3[2] > 0.1 && driftBar % 4 === 0) {
    const root   = phaseData.drone;
    const fifth  = root + 7;
    const octave = root + 12;
    const vel    = Math.round(35 + presence3[2] * 30);
    const dur    = Math.round(barMs * 3.5); // ~14 sec
    for (const n of [root, fifth, octave]) {
      sendMIDINote(2, n, vel, dur);
      addMidiNote(2, n / 127, vel / 127);
    }
  }

  // CH4 CHORDS — every chordRhythm drift bars, voice leading slow
  if (presence3[4] > 0.1 && chordRhythm > 0 && driftBar % chordRhythm === 0) {
    const chord = currentChord;
    const vel   = Math.round(42 + presence3[4] * 38);
    const dur   = Math.round(barMs * (chordRhythm - 0.3));
    for (const n of chord) {
      sendMIDINote(4, n, vel, dur);
      addMidiNote(4, n / 127, vel / 127);
    }
  }

  // CH6 LEAD — brief melodic fragments every 8 drift bars (derived from chord)
  if (presence3[6] > 0.1 && driftBar % 8 === 0 && driftBar > 0) {
    // Build motif from current chord: root, third shifted up, fifth
    const chord = currentChord;
    const motif = [
      chord[0],                             // root
      chord[1] + (Math.random() < 0.5 ? 12 : 0), // third (sometimes octave up)
      chord[2],                             // fifth
    ];
    const velBase = Math.round(42 + presence3[6] * 33);
    let delay = 0;
    for (const n of motif) {
      const noteDelay = delay;
      setTimeout(() => {
        if (!composer3Active) return;
        sendMIDINote(6, n, velBase, 650);
        addMidiNote(6, n / 127, velBase / 127);
      }, noteDelay);
      delay += Math.round(600 + Math.random() * 400);
    }
  }

  // CH7 RUPTURE residuo — sparse notes with decreasing velocity
  if (ruptureStage3 === 'residuo' && driftBar % 2 === 0) {
    const vel = Math.round(50 * (1 - ruptureProgress3));
    if (vel > 10) {
      sendMIDINote(7, 57, vel, 400); // A3
      addMidiNote(7, 57 / 127, vel / 127);
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  STATE INJECTION
// ═══════════════════════════════════════════════════════════

function injectState3() {
  const pm = getPresenceMultiplier('deriva');
  const active = presence3.filter(p => p > 0.1).length;
  state.intensity   = Math.min(1, active / 8 + ruptureProgress3 * 0.2) * pm;
  state.rhythmicity = Math.min(1, presence3[0] * 1.2 + presence3[1] * 0.5) * pm;
  if (phase === 'densita')           state.trajectory =  1;
  else if (phase === 'dissoluzione') state.trajectory = -1;
  else                               state.trajectory =  0;
}

// ═══════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════

export function initComposer3() {
  timeSec = 0;
  lastDriftBar = -1;
  phase    = CFG.COMPOSER3.phaseOrder[0];
  phaseIdx = 0;
  phaseClock = 0;
  presence3.fill(0);
  ruptureStage3    = 'idle';
  ruptureProgress3 = 0;
  ruptureNoteTimer = 2;
  markovHistory3   = [null, null];
  centroidHistory  = [];
  centroidAvg      = 0;
  brightnessCooldown = 0;
  grainAccum       = 0;
  ruptureTick      = 0;
  initChord3();
}

export function toggleComposer3() {
  composer3Active = !composer3Active;
  if (composer3Active) {
    initComposer3();
    setEngine('deriva');
    console.log('[COMPOSER3] ON — A Lydian DERIVA (brightness-driven)');
  } else {
    sendMIDIAllNotesOff();
    setComposerClimax(false);
    releaseArcHold();
    setEngine(null);
    console.log('[COMPOSER3] OFF');
  }
}

export function updateComposer3(dt) {
  updatePhase3(dt);
  updatePresence3(dt);
  updateRupture3(dt);

  // Time-based drift clock (no BPM)
  timeSec += dt;
  const barSec = CFG.COMPOSER3.driftBarSec;
  const currentDriftBar = Math.floor(timeSec / barSec);

  if (currentDriftBar > lastDriftBar) {
    lastDriftBar = currentDriftBar;
    onDriftBar3(currentDriftBar);
  }

  // Brightness-driven VOICE trigger
  updateBrightnessTrigger(dt);

  // Air-energy-driven GRAIN
  updateGrain3(dt);

  // Rupture note events
  updateRuptureNotes(dt);

  injectState3();
}

export function getComposer3Status() {
  return {
    active: composer3Active,
    phase,
    ruptureStage: ruptureStage3,
    chordRoot: currentChord[0],
    bar: lastDriftBar,
  };
}
