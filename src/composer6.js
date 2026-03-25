// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Composer 6 (ABISSO)
//  Bb Phrygian · 76 BPM · drone rituale · risalita in rottura
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { state } from './state.js';
import { sendMIDINote, sendMIDIAllNotesOff } from './midi.js';
import { setArcPhaseForced, releaseArcHold } from './director.js';
import { setComposerClimax } from './colors.js';
import { addMidiNote } from './field.js';
import { emit } from './director-events.js';
import { setEngine } from './midi-patterns.js';

// ── Scale modes Bb (nota MIDI: Bb2 = 46) ──
const MODES6 = {
  Bb_phrygian: [46,47,49,51,53,54,56, 58,59,61,63,65,66,68, 70,71,73,75,77,78,80],
  B_locrian:   [47,48,50,52,53,55,57, 59,60,62,64,65,67,69, 71,72,74,76,77,79,81],
};

// Chord progressions for ABISSO (Bb Phrygian — dark, ritualistic)
const CHORD_PROGS6 = {
  germoglio:    [[46,49,53]],                                         // Bbm
  pulsazione:   [[46,49,53],[47,51,54],[46,49,53]],                  // Bbm → Cb → Bbm
  densita:      [[46,49,53],[47,51,54],[49,53,56],[46,49,54]],       // Bbm → Cb → Dbm → Bbsus
  rottura:      null,
  dissoluzione: [[46,49,53],[47,51,54],[46,49,53]],                  // Bbm → Cb → Bbm
};
let chordProgIdx6 = 0;
let lastChord6 = [46, 49, 53];

// Presenza target [bass, drone, voice, grain, chords] per fase — 5 channels now
const PHASE_PRESENCE6 = {
  germoglio:    [0.0, 0.3, 0.0, 0.0, 0.2],
  pulsazione:   [0.5, 0.6, 0.3, 0.1, 0.5],
  densita:      [0.9, 0.8, 0.6, 0.4, 0.7],
  rottura:      [0.7, 0.3, 0.0, 0.8, 0.1],
  dissoluzione: [0.2, 0.4, 0.2, 0.0, 0.3],
};

// ── Stato modulo ──
export let composer6Active = false;

let phaseIndex = 0;
let phaseTime = 0;
let arcProgress = 0;
let clock = 0;
let lastBeat = -1;

let currentMode = 'Bb_phrygian';
let currentDrone = 46;

let ruptureStage = 'idle';
let lastRuptureStage = 'idle';

const presence = [0, 0, 0, 0, 0]; // [bass, drone, voice, grain, chords]
let debugTimer = 0;

// ── Inizializzazione ──
export function initComposer6() {
  phaseIndex = 0;
  phaseTime = 0;
  arcProgress = 0;
  clock = 0;
  lastBeat = -1;
  ruptureStage = 'idle';
  lastRuptureStage = 'idle';
  presence.fill(0);
  currentMode = 'Bb_phrygian';
  currentDrone = 46;
  chordProgIdx6 = 0;
  lastChord6 = [46, 49, 53];
}

// ── Toggle ──
export function toggleComposer6() {
  composer6Active = !composer6Active;
  if (composer6Active) {
    initComposer6();
    setEngine('abisso');
    console.log('[COMPOSER6] ON — Bb Phrygian ABISSO 76bpm');
  } else {
    sendMIDIAllNotesOff();
    setComposerClimax(false);
    releaseArcHold();
    setEngine(null);
    console.log('[COMPOSER6] OFF');
  }
}

// ── Phase system ──
function currentPhase() {
  return CFG.COMPOSER6.phaseOrder[phaseIndex];
}

function updatePhase(dt) {
  phaseTime += dt;
  const name = currentPhase();
  const cfg = CFG.COMPOSER6.phases[name];
  arcProgress = Math.min(1, phaseTime / cfg.duration);
  currentMode = cfg.mode;
  currentDrone = cfg.drone;
  setArcPhaseForced(cfg.arc);
  if (phaseTime >= cfg.duration) {
    phaseIndex = (phaseIndex + 1) % CFG.COMPOSER6.phaseOrder.length;
    phaseTime = 0;
    arcProgress = 0;
    chordProgIdx6 = 0;
    console.log(`[COMPOSER6] → ${currentPhase()}`);
  }
}

// ── VoidManager — evoluzione lentissima (5 channels) ──
function updatePresence(dt) {
  const target = PHASE_PRESENCE6[currentPhase()] || [0.3, 0.4, 0.1, 0.1, 0.3];
  const silTarget = CFG.COMPOSER6.silenceTarget[currentPhase()] || 0.5;
  for (let i = 0; i < 5; i++) {
    presence[i] += (target[i] - presence[i]) * dt * 0.12;
  }
  const activeCount = presence.filter(p => p > 0.3).length;
  const voidRatio = 1 - activeCount / 5;
  if (voidRatio < silTarget) {
    let minIdx = 0;
    for (let i = 1; i < 5; i++) { if (presence[i] < presence[minIdx]) minIdx = i; }
    presence[minIdx] *= 0.9;
  }
  if (voidRatio > silTarget + 0.20) {
    let minIdx = 0;
    for (let i = 1; i < 5; i++) { if (presence[i] < presence[minIdx]) minIdx = i; }
    presence[minIdx] = Math.min(presence[minIdx] + 0.1, target[minIdx] || 0.4);
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
  const R = CFG.COMPOSER6.rupture;
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

// ── Beat-triggered notes ──
function onBeat(beat) {
  const bpm       = CFG.COMPOSER6.bpm;
  const beatMs    = (60 / bpm) * 1000;
  const name      = currentPhase();
  const barBeat   = beat % 4;
  const bar       = Math.floor(beat / 4);
  const heartbeat = CFG.COMPOSER6.heartbeatEvery || 2;
  const risalita  = CFG.COMPOSER6.risalitaOctaves || 2;
  const rc        = ruptureStage === 'takeover'     ? 0.8 :
                    ruptureStage === 'infiltrazione' ? 0.4 :
                    ruptureStage === 'presagio'      ? 0.15 : 0;

  // Octave shift during rupture (risalita)
  const octShift = ruptureStage === 'takeover'      ? risalita * 12 :
                   ruptureStage === 'infiltrazione'  ? 12 : 0;

  // CH0 PULSE — heartbeat
  if (beat % heartbeat === 0 && presence[0] > 0.1) {
    const vel  = Math.floor(45 + presence[0] * 20);
    const note = Math.min(127, currentDrone - 24 + octShift);
    sendMIDINote(0, note, vel, beatMs * 0.6);
    addMidiNote(0, note / 127, vel / 127);
  }

  // CH3 BASS — movement with Cb (b2) and Gb (b6)
  if (presence[0] > 0.3 && name !== 'rottura') {
    const bassRoot = currentDrone - 24; // Bb0
    const flatTwo  = bassRoot + 1;      // Cb — Phrygian signature
    const fourth   = bassRoot + 5;      // Eb
    const bassEvery = presence[0] > 0.7 ? 1 : 2;
    if (beat % bassEvery === 0) {
      // Ritualistic bass: root → Cb(tension) → root → fourth
      const bassSeq = [bassRoot, flatTwo, bassRoot, fourth];
      const bassNote = Math.min(127, bassSeq[barBeat % bassSeq.length] + octShift);
      const vel = barBeat === 0
        ? Math.floor(88 + presence[0] * 30)
        : Math.floor(68 + presence[0] * 22);
      sendMIDINote(3, bassNote, vel, beatMs * 2.5);
      addMidiNote(3, bassNote / 127, vel / 127);
    }
  }

  // CH4 CHORDS — sustained ritual pads (Bbm / Cb alternation)
  if (presence[4] > 0.2 && barBeat === 0 && beat % 8 === 0) {
    const prog = CHORD_PROGS6[name];
    if (prog) {
      chordProgIdx6 = (chordProgIdx6 + 1) % prog.length;
      lastChord6 = [...prog[chordProgIdx6]];
    }
    const chord = lastChord6;
    const vel = Math.floor(35 + presence[4] * 30);
    const dur = Math.round(beatMs * 7); // very long pads
    for (const n of chord) {
      const note = Math.min(127, n + octShift);
      sendMIDINote(4, note, vel, dur);
      addMidiNote(4, note / 127, vel / 127);
    }
    emit('chord_change', { root: chord[0], mode: currentMode });
  }

  // CH2 DRONE — omnipresent, root + fifth
  if (beat % 12 === 0) {
    const note = Math.min(127, currentDrone + octShift);
    const vel  = Math.floor(28 + presence[1] * 22);
    sendMIDINote(2, note, vel, beatMs * 10);
    sendMIDINote(2, Math.min(127, note + 7), Math.floor(vel * 0.6), beatMs * 10);
    addMidiNote(2, note / 127, vel / 127);
  }

  // CH1 GRAIN — sediment with increasing density
  if (presence[3] > 0.15) {
    // Frequency increases with presence: every 4 beats → every 2 → every 1
    const grainEvery = presence[3] > 0.6 ? 1 : presence[3] > 0.35 ? 2 : 4;
    if (beat % grainEvery === 0 && Math.random() < 0.4 + presence[3] * 0.4) {
      const scale = MODES6[currentMode];
      const lo   = scale.filter(n => n >= 46 && n <= 65);
      const pool = lo.length > 0 ? lo : scale;
      const note = Math.min(127, pool[Math.floor(Math.random() * pool.length)] + octShift);
      const vel  = Math.floor(25 + presence[3] * 35);
      sendMIDINote(1, note, vel, beatMs * 2);
      addMidiNote(1, note / 127, vel / 127);
    }
  }

  // CH5 VOICE — more frequent (every 8 beats instead of 16)
  if (presence[2] > 0.2 && beat % 8 === 0 && Math.random() < presence[2] * 0.7) {
    const scale = MODES6[currentMode];
    const hi   = scale.filter(n => n >= 65 && n <= 82);
    const pool = hi.length > 0 ? hi : scale;
    const note = Math.min(127, pool[Math.floor(Math.random() * pool.length)] + octShift);
    const vel  = Math.floor(32 + presence[2] * 28);
    sendMIDINote(5, note, vel, beatMs * 4);
    addMidiNote(5, note / 127, vel / 127);
    // CH6 LEAD — delayed echo (octave below)
    if (Math.random() < 0.5) {
      setTimeout(() => {
        if (!composer6Active) return;
        const echoNote = Math.max(0, note - 12);
        sendMIDINote(6, echoNote, Math.floor(vel * 0.6), beatMs * 3);
        addMidiNote(6, echoNote / 127, (vel * 0.6) / 127);
      }, Math.round(beatMs * 1.5));
    }
  }

  // CH7 RUPTURE
  if (ruptureStage !== 'idle' && ruptureStage !== 'residuo') {
    const ruptureEvery = ruptureStage === 'presagio' ? 8 : 4;
    if (barBeat === 0 && bar % ruptureEvery === 0) {
      const scale = MODES6['B_locrian'];
      const note  = Math.min(127, scale[Math.floor(Math.random() * scale.length)] + octShift);
      const vel   = Math.floor(55 + rc * 55);
      sendMIDINote(7, note, vel, beatMs * 0.8);
      addMidiNote(7, note / 127, vel / 127);
    }
  }
}

// ── State injection ──
function injectState() {
  const activeCount = presence.filter(p => p > 0.3).length;
  state.intensity   = Math.min(1, 0.15 + arcProgress * 0.4 + activeCount * 0.07);
  state.rhythmicity = Math.min(1, presence[0] * 0.3 + presence[3] * 0.2);
  state.trajectory  = arcProgress > 0.7 ? -1 : arcProgress > 0.3 ? 0 : 1;
}

// ═══════════════════════════════════════════════════════════
//  MAIN UPDATE
// ═══════════════════════════════════════════════════════════

export function updateComposer6(dt) {
  updatePhase(dt);
  updatePresence(dt);
  updateRupture();

  const bpm = CFG.COMPOSER6.bpm;
  clock += dt * bpm / 60;
  const currentBeat = Math.floor(clock);
  if (currentBeat > lastBeat) {
    lastBeat = currentBeat;
    onBeat(currentBeat);
  }

  injectState();

  debugTimer += dt;
  if (debugTimer >= 10) {
    debugTimer = 0;
    const ac = presence.filter(p => p > 0.3).length;
    console.log(
      `[COMPOSER6] ${currentPhase()} | ` +
      `B${presence[0].toFixed(1)} D${presence[1].toFixed(1)} ` +
      `V${presence[2].toFixed(1)} G${presence[3].toFixed(1)} C${presence[4].toFixed(1)} ` +
      `| rupture: ${ruptureStage} | active: ${ac}/5`
    );
  }
}

// ── Export status per HUD ──
export function getComposer6Status() {
  return {
    active: composer6Active,
    phase: currentPhase(),
    activeCount: presence.filter(p => p > 0.3).length,
    ruptureStage,
  };
}
