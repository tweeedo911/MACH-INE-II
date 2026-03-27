// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Composer 4 (VORTICE)
//  D Phrygian · 112 BPM · tribal-industriale · micro-loop
//  v3 — pitch classes fissi per layer, motivo VOICE ricorrente
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { state } from './state.js';
import { sendMIDINote as _rawSend, sendMIDIAllNotesOff } from './midi.js';
import { setArcPhaseForced, releaseArcHold } from './director.js';
import { setComposerClimax } from './colors.js';
import { addMidiNote as _rawAddMidi } from './field.js';
import { emit } from './director-events.js';
import { setEngine } from './midi-patterns.js';
import { getPresenceMultiplier, isChannelAllowed, setEnginePhase } from './presence-multiplier.js';

function sendMIDINote(ch, note, vel, dur) {
  const pm = getPresenceMultiplier('vortice');
  if (pm < 0.05) return;
  if (!isChannelAllowed('vortice', ch)) return;
  _rawSend(ch, note, Math.max(1, Math.round(vel * pm)), dur);
}
function addMidiNote(ch, x, intensity) {
  _rawAddMidi(ch, x, intensity * getPresenceMultiplier('vortice'));
}

// ═══════════════════════════════════════════════════════════
//  SCALES — E Phrygian: E F G A B C D
//  MIDI E3=52, F3=53, G3=55, A3=57, B3=59, C4=60, D4=62
//  Colore Phrygian: F (b2) — nota di tensione massima
// ═══════════════════════════════════════════════════════════

const MODES4 = {
  D_phrygian: [50,51,53,55,57,58,60, 62,63,65,67,69,70,72, 74,75,77,79,81,82,84],
  F_locrian:  [53,54,56,58,59,61,63, 65,66,68,70,71,73,75, 77,78,80,82,83,85,87],
};

// ═══════════════════════════════════════════════════════════
//  KICK PATTERNS — tribal, 138 BPM, 16th note
//  stepMs = 60000/(138*4) ≈ 108ms
// ═══════════════════════════════════════════════════════════

const KICK_PATTERNS = [
  [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0],   // [0] tribal asimmetrico (originale)
  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],   // [1] 4-on-the-floor
  [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],   // [2] doppio tribale
  [1,0,1,0, 0,1,0,0, 1,0,0,1, 0,1,0,0],   // [3] sincopato
  [1,0,0,0, 0,1,0,1, 1,0,0,0, 0,1,0,0],   // [4] jazz tribale
];

const GHOST_PATTERNS = [
  [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],   // regolare
  [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],   // off-beat costante
  [0,0,1,0, 0,1,0,0, 0,0,1,0, 0,1,0,1],   // sparso
  [1,1,0,1, 1,0,1,1, 0,1,1,0, 1,1,0,1],   // denso
];

// ═══════════════════════════════════════════════════════════
//  BASS — E Phrygian bass note sequences
//  Root E1=40, F1=41(b2 tension!), G1=43, A1=45, B1=47, C2=48, D2=50, E2=52
//  PRINCIPIO: E e F sono il cuore del Phrygian — alternali con ritmo
// ═══════════════════════════════════════════════════════════

// D Phrygian: root (D2=38) sul downbeat, quinta (A2=45) sul beat 3
const VORTICE_BASS_PAT = [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0];


// ═══════════════════════════════════════════════════════════
//  MICRO-LOOP PITCH CLASSES — FISSI PER LAYER
//  Invece di scorrer la scala sequenzialmente, ogni layer
//  ha un pool di 4-5 note caratteristiche che cicla.
//  Layer A (alto): E4, G4, B4, C5 — quinta/terza/ottava
//  Layer B (medio): E3, F3, A3, B3 — colore Phrygian (include b2)
//  Layer C (altissimo): E5, G5, B4 — solo triadic
// ═══════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════
//  VOICE MOTIF — frase ricorrente ancorata a E Phrygian
//  Il motivo si evolve lentamente: variazioni sulla stessa cell
// ═══════════════════════════════════════════════════════════

// Motif base: E4→F4→E4→B3 (root→b2→root→5th — quintessenza Phrygian)
// Varianti per fase:

// ═══════════════════════════════════════════════════════════
//  PRESENZA — invariata (già buona)
// ═══════════════════════════════════════════════════════════

const PHASE_PRESENCE4 = {
  // [KICK, GRAIN, DRONE, VOICE] — drone capped per PARTITURA Regola 4 (max 0.2)
  germoglio:    [0.7, 0.3, 0.2,  0.0],
  pulsazione:   [0.9, 0.6, 0.15, 0.1],
  densita:      [1.0, 0.9, 0.1,  0.4],
  rottura:      [1.0, 1.0, 0.0,  0.0],
  dissoluzione: [0.5, 0.2, 0.2,  0.0],
};

// ═══════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════

export let composer4Active = false;

let phaseIndex = 0;
let phaseTime = 0;
let arcProgress = 0;
let clock = 0;
let lastStep = -1;

let currentMode = 'D_phrygian';
let currentDrone = 50;  // D3

let ruptureStage = 'idle';
let lastRuptureStage = 'idle';

const presence = [0, 0, 0, 0];
let debugTimer = 0;

// Pattern attivi
let kickPat, ghostPat;
let lastKickBar = -1, lastGhostBar = -1;

const KICK_VAR_BARS  = 8;
const GHOST_VAR_BARS = 16;

function pickPatterns() {
  kickPat  = KICK_PATTERNS[1]; // 4-on-floor default
  ghostPat = GHOST_PATTERNS[Math.floor(Math.random() * GHOST_PATTERNS.length)];
}

// ── Inizializzazione ──
export function initComposer4() {
  phaseIndex = 0; phaseTime = 0; arcProgress = 0;
  clock = 0; lastStep = -1;
  ruptureStage = 'idle'; lastRuptureStage = 'idle';
  setEnginePhase('vortice', CFG.COMPOSER4.phaseOrder[0]);
  presence.fill(0);
  currentMode = 'D_phrygian'; currentDrone = 50;
  lastKickBar = lastGhostBar = -1;
  pickPatterns();
}

// ── Toggle ──
export function toggleComposer4() {
  composer4Active = !composer4Active;
  if (composer4Active) {
    initComposer4();
    setEngine('vortice');
    console.log('[COMPOSER4] ON — D Phrygian VORTICE 112bpm');
  } else {
    sendMIDIAllNotesOff();
    setComposerClimax(false);
    releaseArcHold();
    setEngine(null);
    console.log('[COMPOSER4] OFF');
  }
}

// ── Phase system ──
function currentPhase() { return CFG.COMPOSER4.phaseOrder[phaseIndex]; }

function updatePhase(dt) {
  phaseTime += dt;
  const name = currentPhase();
  const cfg = CFG.COMPOSER4.phases[name];
  arcProgress = Math.min(1, phaseTime / cfg.duration);
  currentMode = cfg.mode;
  currentDrone = cfg.drone;
  setArcPhaseForced(cfg.arc, getPresenceMultiplier('vortice'));
  if (phaseTime >= cfg.duration) {
    phaseIndex = (phaseIndex + 1) % CFG.COMPOSER4.phaseOrder.length;
    phaseTime = 0; arcProgress = 0;
    setEnginePhase('vortice', currentPhase(), ruptureStage);
    console.log(`[COMPOSER4] → ${currentPhase()}`);
  }
}

// ── VoidManager ──
function updatePresence(dt) {
  const target = PHASE_PRESENCE4[currentPhase()] || [0.7,0.5,0.5,0.1];
  const silTarget = CFG.COMPOSER4.silenceTarget[currentPhase()] || 0.2;
  for (let i = 0; i < 4; i++) {
    presence[i] += (target[i] - presence[i]) * dt * 0.5;
  }
  let activeCount = 0; for (let i = 0; i < 4; i++) if (presence[i] > 0.3) activeCount++;
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
    if (ruptureStage !== 'idle') { ruptureStage = 'idle'; setComposerClimax(false); }
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
//  STEP SEQUENCER
// ═══════════════════════════════════════════════════════════

function onStep(step) {
  const bpm    = CFG.COMPOSER4.bpm;
  const stepMs = (60 / bpm / 4) * 1000;  // ~108ms a 138 BPM
  const barMs  = stepMs * 16;
  const s16    = step % 16;
  const bar    = Math.floor(step / 16);
  const name   = currentPhase();
  const rc     = ruptureStage === 'takeover'     ? 0.8
               : ruptureStage === 'infiltrazione' ? 0.4
               : ruptureStage === 'presagio'      ? 0.15 : 0;

  // ── Staggered pattern rotation ──
  if (bar !== lastKickBar && bar % KICK_VAR_BARS === 0) {
    lastKickBar = bar;
    kickPat = (name === 'densita' && Math.random() < 0.25)
      ? KICK_PATTERNS[Math.floor(Math.random() * KICK_PATTERNS.length)]
      : KICK_PATTERNS[1]; // 4-on-floor default
  }
  if (bar !== lastGhostBar && bar % GHOST_VAR_BARS === 0) {
    lastGhostBar = bar;
    ghostPat = GHOST_PATTERNS[Math.floor(Math.random() * GHOST_PATTERNS.length)];
  }

  // ─────────────────────────────────────────────────────────
  //  CH0 PULSE — kick tribale + ghost
  // ─────────────────────────────────────────────────────────
  // ── Kick suppression: only fire kick when this engine dominates ──
  const dominantKick = getPresenceMultiplier('vortice') >= CFG.kickDominanceThreshold;
  if (dominantKick && kickPat[s16]) {
    const vel = s16 === 0 ? 120 : Math.floor(88 + presence[0] * 22);
    sendMIDINote(0, currentDrone - 12, vel, Math.round(stepMs * 0.55));
    addMidiNote(0, (currentDrone - 12) / 127, vel / 127);
  }
  // Ghost layer su CH0 con nota diversa (high pitched perc)
  if (ghostPat[s16] && presence[0] > 0.4) {
    const vel = Math.floor(32 + presence[0] * 18);
    sendMIDINote(0, currentDrone + 12, vel, Math.round(stepMs * 0.28));
    addMidiNote(0, (currentDrone + 12) / 127, vel / 127);
  }

  // ─────────────────────────────────────────────────────────
  //  CH3 BASS — root sul downbeat, quinta sul beat 3
  // ─────────────────────────────────────────────────────────
  if (VORTICE_BASS_PAT[s16] && name !== 'rottura') {
    const bassRoot = currentDrone - 12; // D2=38
    const note = s16 === 0 ? bassRoot : bassRoot + 7; // root / quinta
    const vel  = s16 === 0 ? 98 : 82;
    sendMIDINote(3, Math.min(127, note), vel, Math.round(stepMs * (s16 === 0 ? 3.8 : 2.8)));
    addMidiNote(3, note / 127, vel / 127);
  }

  // ─────────────────────────────────────────────────────────
  //  CH1 HAT — 16th pulse + open on beats 2,4
  // ─────────────────────────────────────────────────────────
  const hatPres4 = name === 'germoglio' ? 0.0
    : name === 'pulsazione' ? 0.3
    : name === 'densita' ? 0.7
    : name === 'rottura' ? 1.0 : 0.2;

  if (hatPres4 > 0) {
    const isOpen = s16 === 4 || s16 === 12;
    const vel = Math.round(
      (isOpen ? 44 + Math.random() * 10 : 20 + Math.random() * 15) * hatPres4
    );
    if (vel > 4) {
      sendMIDINote(1, isOpen ? 46 : 42, vel, 18);
      addMidiNote(1, 0.33, vel / 127);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  CH2 DRONE — ogni 4 bar
  // ─────────────────────────────────────────────────────────
  if (step % 64 === 0 && name !== 'rottura') {
    const vel = Math.floor(22 + arcProgress * 14);
    sendMIDINote(2, currentDrone, vel, Math.round(stepMs * 58));
    addMidiNote(2, currentDrone / 127, vel / 127);
  }

  // ── CLIMAX HARD CUT — takeover finale → silenzio totale ──
  if (ruptureStage === 'takeover' && arcProgress > 0.78) {
    sendMIDIAllNotesOff();
  }
}

// ── State injection ──
function injectState() {
  const pm = getPresenceMultiplier('vortice');
  let activeCount = 0; for (let i = 0; i < 4; i++) if (presence[i] > 0.3) activeCount++;
  state.intensity   = Math.min(1, 0.35 + arcProgress * 0.45 + activeCount * 0.1) * pm;
  state.rhythmicity = Math.min(1, 0.4  + presence[0] * 0.4  + presence[1] * 0.2) * pm;
  state.trajectory  = arcProgress > 0.7 ? -1 : arcProgress > 0.3 ? 0 : 1;
}

// ═══════════════════════════════════════════════════════════
//  MAIN UPDATE
// ═══════════════════════════════════════════════════════════

export function updateComposer4(dt) {
  updatePhase(dt);
  updatePresence(dt);
  updateRupture();

  const bpm = CFG.COMPOSER4.bpm;
  const stepsPerSec = bpm * 4 / 60;
  clock += dt * stepsPerSec;
  const currentStep = Math.floor(clock);
  if (currentStep > lastStep) {
    for (let s = lastStep + 1; s <= currentStep; s++) onStep(s);
    lastStep = currentStep;
  }

  injectState();

  debugTimer += dt;
  if (CFG.debug && debugTimer >= 10) {
    debugTimer = 0;
    let ac = 0; for (let i = 0; i < 4; i++) if (presence[i] > 0.3) ac++;
    console.log(
      `[COMPOSER4] ${currentPhase()} bar ${Math.floor(lastStep / 16)} | ` +
      `P${presence[0].toFixed(1)} G${presence[1].toFixed(1)} ` +
      `B${presence[2].toFixed(1)} V${presence[3].toFixed(1)} ` +
      `| rupture: ${ruptureStage} | active: ${ac}/4`
    );
  }
}

// ── Export status ──
export function getComposer4Status() {
  return {
    active: composer4Active,
    phase: currentPhase(),
    activeCount: presence.filter(p => p > 0.3).length,
    ruptureStage,
  };
}
