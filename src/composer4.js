// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Composer 4 (VORTICE)
//  F Phrygian · 138 BPM · tribal-industriale · micro-loop tessiture
//  Step sequencer a 16th note, pattern costanti, variazione ogni 16 bar
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { state } from './state.js';
import { sendMIDINote, sendMIDIAllNotesOff } from './midi.js';
import { setArcPhaseForced, releaseArcHold } from './director.js';
import { setComposerClimax } from './colors.js';
import { addMidiNote } from './field.js';
import { emit } from './director-events.js';
import { setEngine } from './midi-patterns.js';

// ── Scale modes F (nota MIDI: F3 = 53) ──
const MODES4 = {
  F_phrygian: [53,54,56,58,60,61,63, 65,66,68,70,72,73,75, 77,78,80,82,84,85,87],
  B_locrian:  [47,48,50,52,53,55,57, 59,60,62,64,65,67,69, 71,72,74,76,77,79,81],
};

// ── Pattern library (16-step, 16th note resolution) ──
const KICK_PATTERNS = [
  [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0],   // tribal asimmetrico
  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],   // 4-on-the-floor
  [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],   // doppio tribale
  [1,0,1,0, 0,1,0,0, 1,0,0,1, 0,1,0,0],   // sincopato
];

const GHOST_PATTERNS = [
  [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],   // regolare
  [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],   // off-beat costante
  [0,0,1,0, 0,1,0,0, 0,0,1,0, 0,1,0,1],   // sparso
  [1,1,0,1, 1,0,1,1, 0,1,1,0, 1,1,0,1],   // denso
];

const BASS_PATTERNS = [
  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],   // ogni downbeat
  [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],   // sincopato
  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],   // ogni quarto
];

// Micro-loop patterns (lunghezze diverse → interlocking poliritmico)
const MICRO_A_POOL = [
  [1,0,0,1,0,0,1,0],     // 8-step
  [1,0,1,0,0,1,0,0],
  [1,0,0,0,1,0,0,1],
];
const MICRO_B_POOL = [
  [1,0,0,1,0],           // 5-step
  [1,0,1,0,0],
  [0,1,0,0,1],
];
const MICRO_C_POOL = [
  [1,0,1],               // 3-step
  [1,1,0],
  [0,1,1],
];

// Presenza: percussione e basso alti fin dall'inizio
const PHASE_PRESENCE4 = {
  germoglio:    [0.7, 0.3, 0.6, 0.0],
  pulsazione:   [0.9, 0.6, 0.8, 0.1],
  densita:      [1.0, 0.9, 0.9, 0.4],
  rottura:      [1.0, 1.0, 0.7, 0.0],
  dissoluzione: [0.5, 0.2, 0.3, 0.0],
};

// ── Stato modulo ──
export let composer4Active = false;

let phaseIndex = 0;
let phaseTime = 0;
let arcProgress = 0;
let clock = 0;
let lastStep = -1;

let currentMode = 'F_phrygian';
let currentDrone = 53;

let ruptureStage = 'idle';
let lastRuptureStage = 'idle';

const presence = [0, 0, 0, 0];
let debugTimer = 0;

// Pattern attivi (cambiano a intervalli sfalsati per evoluzione continua)
let kickPat, ghostPat, bassPat, microA, microB, microC;
let lastKickBar = -1, lastGhostBar = -1, lastBassBar = -1, lastMicroBar = -1;
const KICK_VAR_BARS = 8;    // kick changes every 8 bars
const GHOST_VAR_BARS = 12;  // ghost changes every 12 bars
const BASS_VAR_BARS = 16;   // bass changes every 16 bars
const MICRO_VAR_BARS = 10;  // micro-loops change every 10 bars

// Micro-loop transposition (shifts pattern notes by scale degrees)
let microTranspose = 0;

function pickPatterns() {
  kickPat  = KICK_PATTERNS[Math.floor(Math.random() * KICK_PATTERNS.length)];
  ghostPat = GHOST_PATTERNS[Math.floor(Math.random() * GHOST_PATTERNS.length)];
  bassPat  = BASS_PATTERNS[Math.floor(Math.random() * BASS_PATTERNS.length)];
  microA   = MICRO_A_POOL[Math.floor(Math.random() * MICRO_A_POOL.length)];
  microB   = MICRO_B_POOL[Math.floor(Math.random() * MICRO_B_POOL.length)];
  microC   = MICRO_C_POOL[Math.floor(Math.random() * MICRO_C_POOL.length)];
}

// ── Inizializzazione ──
export function initComposer4() {
  phaseIndex = 0;
  phaseTime = 0;
  arcProgress = 0;
  clock = 0;
  lastStep = -1;
  ruptureStage = 'idle';
  lastRuptureStage = 'idle';
  presence.fill(0);
  currentMode = 'F_phrygian';
  currentDrone = 53;
  lastKickBar = -1;
  lastGhostBar = -1;
  lastBassBar = -1;
  lastMicroBar = -1;
  microTranspose = 0;
  pickPatterns();
}

// ── Toggle ──
export function toggleComposer4() {
  composer4Active = !composer4Active;
  if (composer4Active) {
    initComposer4();
    setEngine('vortice');
    console.log('[COMPOSER4] ON — F Phrygian VORTICE 138bpm');
  } else {
    sendMIDIAllNotesOff();
    setComposerClimax(false);
    releaseArcHold();
    setEngine(null);
    console.log('[COMPOSER4] OFF');
  }
}

// ── Phase system ──
function currentPhase() {
  return CFG.COMPOSER4.phaseOrder[phaseIndex];
}

function updatePhase(dt) {
  phaseTime += dt;
  const name = currentPhase();
  const cfg = CFG.COMPOSER4.phases[name];
  arcProgress = Math.min(1, phaseTime / cfg.duration);
  currentMode = cfg.mode;
  currentDrone = cfg.drone;
  setArcPhaseForced(cfg.arc);
  if (phaseTime >= cfg.duration) {
    phaseIndex = (phaseIndex + 1) % CFG.COMPOSER4.phaseOrder.length;
    phaseTime = 0;
    arcProgress = 0;
    console.log(`[COMPOSER4] → ${currentPhase()}`);
  }
}

// ── VoidManager ──
function updatePresence(dt) {
  const target = PHASE_PRESENCE4[currentPhase()] || [0.7, 0.5, 0.5, 0.1];
  const silTarget = CFG.COMPOSER4.silenceTarget[currentPhase()] || 0.2;
  for (let i = 0; i < 4; i++) {
    presence[i] += (target[i] - presence[i]) * dt * 0.5; // fast lerp
  }
  const activeCount = presence.filter(p => p > 0.3).length;
  const voidRatio = 1 - activeCount / 4;
  if (voidRatio < silTarget) {
    let minIdx = 0;
    for (let i = 1; i < 4; i++) { if (presence[i] < presence[minIdx]) minIdx = i; }
    presence[minIdx] *= 0.85;
  }
  if (voidRatio > silTarget + 0.20) {
    let minIdx = 0;
    for (let i = 1; i < 4; i++) { if (presence[i] < presence[minIdx]) minIdx = i; }
    presence[minIdx] = Math.min(presence[minIdx] + 0.15, target[minIdx] || 0.5);
  }
}

// ── Rupture engine ──
function updateRupture() {
  const name = currentPhase();
  if (name !== 'rottura') {
    if (ruptureStage !== 'idle') {
      ruptureStage = 'idle';
      setComposerClimax(false);
    }
    return;
  }
  const R = CFG.COMPOSER4.rupture;
  const p = arcProgress;
  if      (p < R.presagioAt)      ruptureStage = 'idle';
  else if (p < R.infiltrazioneAt) ruptureStage = 'presagio';
  else if (p < R.takeoverAt)      ruptureStage = 'infiltrazione';
  else if (p < R.residuoAt)       ruptureStage = 'takeover';
  else                            ruptureStage = 'residuo';
  if (ruptureStage !== lastRuptureStage) {
    lastRuptureStage = ruptureStage;
    emit('rupture_stage', { stage: ruptureStage, progress: p });
    setComposerClimax(ruptureStage === 'takeover');
  }
}

// ═══════════════════════════════════════════════════════════
//  STEP SEQUENCER (16th note resolution @ 138 BPM = 9.2 steps/sec)
// ═══════════════════════════════════════════════════════════

function onStep(step) {
  const bpm    = CFG.COMPOSER4.bpm;
  const stepMs = (60 / bpm / 4) * 1000;   // 16th note duration ~108ms
  const name   = currentPhase();
  const s16    = step % 16;                // position within bar
  const bar    = Math.floor(step / 16);
  const rc     = ruptureStage === 'takeover'     ? 0.8 :
                 ruptureStage === 'infiltrazione' ? 0.4 :
                 ruptureStage === 'presagio'      ? 0.15 : 0;

  // ── Staggered pattern rotation — each element evolves independently ──
  if (bar !== lastKickBar && bar % KICK_VAR_BARS === 0) {
    lastKickBar = bar;
    kickPat = KICK_PATTERNS[Math.floor(Math.random() * KICK_PATTERNS.length)];
  }
  if (bar !== lastGhostBar && bar % GHOST_VAR_BARS === 0) {
    lastGhostBar = bar;
    ghostPat = GHOST_PATTERNS[Math.floor(Math.random() * GHOST_PATTERNS.length)];
  }
  if (bar !== lastBassBar && bar % BASS_VAR_BARS === 0) {
    lastBassBar = bar;
    bassPat = BASS_PATTERNS[Math.floor(Math.random() * BASS_PATTERNS.length)];
  }
  if (bar !== lastMicroBar && bar % MICRO_VAR_BARS === 0) {
    lastMicroBar = bar;
    microA = MICRO_A_POOL[Math.floor(Math.random() * MICRO_A_POOL.length)];
    microB = MICRO_B_POOL[Math.floor(Math.random() * MICRO_B_POOL.length)];
    microC = MICRO_C_POOL[Math.floor(Math.random() * MICRO_C_POOL.length)];
    microTranspose = Math.floor(Math.random() * 4); // shift by 0-3 scale degrees
  }

  // ── CH0 PULSE — tribal kick (SEMPRE attivo, non gatato da presence) ──
  if (kickPat[s16]) {
    const vel = s16 === 0 ? 120 : Math.floor(90 + presence[0] * 25);
    sendMIDINote(0, currentDrone - 12, vel, stepMs * 0.6);
    addMidiNote(0, (currentDrone - 12) / 127, vel / 127);
  }
  // Ghost layer — texture percussiva sovrapposta
  if (ghostPat[s16] && presence[0] > 0.4) {
    const vel = Math.floor(35 + presence[0] * 20);
    sendMIDINote(0, currentDrone, vel, stepMs * 0.3);
    addMidiNote(0, currentDrone / 127, vel / 127);
  }

  // ── CH3 BASS — hypnotic with Gb (b2) tension ──
  if (bassPat[s16] && name !== 'rottura') {
    const bassRoot = currentDrone - 24; // F1
    const flatTwo  = bassRoot + 1;      // Gb1 — Phrygian signature
    const fifth    = bassRoot + 7;      // C2
    const minThird = bassRoot + 3;      // Ab1
    // Pattern: root → Gb(tension) → root → fifth, with bar variation
    const bassSeq = [bassRoot, flatTwo, bassRoot, fifth];
    const altSeq  = [bassRoot, minThird, flatTwo, bassRoot];
    const seq = (bar % 4 < 2) ? bassSeq : altSeq;
    const bassNote = seq[Math.floor(s16 / 4) % seq.length];
    const vel = s16 === 0
      ? Math.floor(100 + presence[2] * 20)
      : Math.floor(78 + presence[2] * 22);
    sendMIDINote(3, bassNote, vel, stepMs * 3);
    addMidiNote(3, bassNote / 127, vel / 127);
  }

  // ── CH1 GRAIN — 3 micro-loop sovrapposti (tessiture intrecciate) ──
  const scale = MODES4[currentMode];

  // Layer A: 8-step loop, registro alto (transposed by microTranspose)
  if (microA[step % microA.length] && presence[1] > 0.2) {
    const hi   = scale.filter(n => n >= 72 && n <= 87);
    const pool = hi.length > 0 ? hi : scale;
    const note = pool[(step + microTranspose) % pool.length];
    const vel  = Math.floor(45 + presence[1] * 35);
    sendMIDINote(1, note, vel, stepMs * 1.5);
    addMidiNote(1, note / 127, vel / 127);
  }

  // Layer B: 5-step loop, registro medio (sfasato + transposed)
  if (microB[step % microB.length] && presence[1] > 0.4) {
    const mid  = scale.filter(n => n >= 63 && n <= 75);
    const pool = mid.length > 0 ? mid : scale;
    const note = pool[(step + 3 + microTranspose) % pool.length];
    const vel  = Math.floor(40 + presence[1] * 30);
    sendMIDINote(1, note, vel, stepMs * 1.2);
    addMidiNote(1, note / 127, vel / 127);
  }

  // Layer C: 3-step loop, registro altissimo (transposed)
  if (microC[step % microC.length] && presence[1] > 0.6) {
    const vhi  = scale.filter(n => n >= 80 && n <= 90);
    const pool = vhi.length > 0 ? vhi : scale;
    const note = pool[(step + 5 + microTranspose) % pool.length];
    const vel  = Math.floor(35 + presence[1] * 25);
    sendMIDINote(1, note, vel, stepMs * 0.8);
    addMidiNote(1, note / 127, vel / 127);
  }

  // ── CH2 DRONE — ogni 4 bar ──
  if (step % 64 === 0 && name !== 'rottura') {
    const vel = Math.floor(25 + arcProgress * 15);
    sendMIDINote(2, currentDrone, vel, stepMs * 56);
    addMidiNote(2, currentDrone / 127, vel / 127);
  }

  // ── CH4 CHORDS — ogni 2 bar, solo in densita+ ──
  if (presence[0] > 0.8 && s16 === 0 && step % 32 === 0) {
    const mid = scale.filter(n => n >= 60 && n <= 72);
    if (mid.length >= 3) {
      const r   = mid[Math.floor(Math.random() * (mid.length - 2))];
      const idx = scale.indexOf(r);
      if (idx >= 0 && idx + 4 < scale.length) {
        const chord = [scale[idx], scale[idx + 2], scale[idx + 4]];
        const vel   = Math.floor(45 + presence[0] * 30);
        for (const note of chord) {
          sendMIDINote(4, note, vel, stepMs * 24);
          addMidiNote(4, note / 127, vel / 127);
        }
        emit('chord_change', { root: chord[0], mode: currentMode });
      }
    }
  }

  // ── CH5 VOICE — minimal recurring motif every 2 bars ──
  if (presence[3] > 0.2 && s16 === 0 && step % 32 === 0) {
    // Short 2-note motif anchored to F Phrygian: root + b2 or root + 5th
    const hi = scale.filter(n => n >= 72 && n <= 84);
    const pool = hi.length > 0 ? hi : scale;
    const note1 = pool[bar % pool.length]; // evolves with bar count
    const vel = Math.floor(60 + presence[3] * 45);
    sendMIDINote(5, note1, vel, stepMs * 6);
    addMidiNote(5, note1 / 127, vel / 127);
    // Second note of motif: step up or down
    if (Math.random() < 0.7) {
      const idx1 = pool.indexOf(note1);
      const note2 = idx1 >= 0 && idx1 + 1 < pool.length ? pool[idx1 + 1] : note1;
      setTimeout(() => {
        if (!composer4Active) return;
        sendMIDINote(5, note2, Math.floor(vel * 0.8), stepMs * 4);
        addMidiNote(5, note2 / 127, (vel * 0.8) / 127);
      }, Math.round(stepMs * 4));
    }
  }

  // ── CH7 RUPTURE ──
  if (ruptureStage !== 'idle' && ruptureStage !== 'residuo') {
    const ruptureEvery = ruptureStage === 'presagio' ? 8 :
                         ruptureStage === 'takeover'  ? 2 : 4;
    if (step % ruptureEvery === 0) {
      const rScale = MODES4['B_locrian'];
      const note   = rScale[Math.floor(Math.random() * rScale.length)];
      const vel    = Math.floor(60 + rc * 60);
      sendMIDINote(7, note, vel, stepMs * 1.5);
      addMidiNote(7, note / 127, vel / 127);
    }
  }
}

// ── State injection ──
function injectState() {
  const activeCount = presence.filter(p => p > 0.3).length;
  state.intensity   = Math.min(1, 0.35 + arcProgress * 0.45 + activeCount * 0.1);
  state.rhythmicity = Math.min(1, 0.4 + presence[0] * 0.4 + presence[1] * 0.2);
  state.trajectory  = arcProgress > 0.7 ? -1 : arcProgress > 0.3 ? 0 : 1;
}

// ═══════════════════════════════════════════════════════════
//  MAIN UPDATE
// ═══════════════════════════════════════════════════════════

export function updateComposer4(dt) {
  updatePhase(dt);
  updatePresence(dt);
  updateRupture();

  // Step clock: 16th note resolution
  const bpm = CFG.COMPOSER4.bpm;
  const stepsPerSec = bpm * 4 / 60;
  clock += dt * stepsPerSec;
  const currentStep = Math.floor(clock);
  if (currentStep > lastStep) {
    // Process each missed step (frame drop recovery)
    for (let s = lastStep + 1; s <= currentStep; s++) {
      onStep(s);
    }
    lastStep = currentStep;
  }

  injectState();

  debugTimer += dt;
  if (debugTimer >= 10) {
    debugTimer = 0;
    const ac = presence.filter(p => p > 0.3).length;
    console.log(
      `[COMPOSER4] ${currentPhase()} bar ${Math.floor(lastStep / 16)} | ` +
      `P${presence[0].toFixed(1)} G${presence[1].toFixed(1)} ` +
      `B${presence[2].toFixed(1)} V${presence[3].toFixed(1)} ` +
      `| rupture: ${ruptureStage} | active: ${ac}/4`
    );
  }
}

// ── Export status per HUD ──
export function getComposer4Status() {
  return {
    active: composer4Active,
    phase: currentPhase(),
    activeCount: presence.filter(p => p > 0.3).length,
    ruptureStage,
  };
}
