// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Composer 6 (ABISSO)
//  Bb Phrygian · 76 BPM · drone rituale · risalita in rottura
//  v3 — bass più rituale, grain sedimentale, dynamics calibrate
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { state } from './state.js';
import { sendMIDINote as _rawSend, sendMIDIAllNotesOff } from './midi.js';
import { setArcPhaseForced, releaseArcHold } from './director.js';
import { setComposerClimax } from './colors.js';
import { addMidiNote as _rawAddMidi } from './field.js';
import { emit } from './director-events.js';
import { setEngine } from './midi-patterns.js';
import { getPresenceMultiplier, isChannelAllowed } from './presence-multiplier.js';

function sendMIDINote(ch, note, vel, dur) {
  const pm = getPresenceMultiplier('abisso');
  if (pm < 0.05) return;
  if (!isChannelAllowed('abisso', ch)) return;
  _rawSend(ch, note, Math.max(1, Math.round(vel * pm)), dur);
}
function addMidiNote(ch, x, intensity) {
  _rawAddMidi(ch, x, intensity * getPresenceMultiplier('abisso'));
}

// ═══════════════════════════════════════════════════════════
//  SCALES — Bb Phrygian: Bb Cb Db Eb F Gb Ab
//  MIDI Bb2=46: 46,47,49,51,52,54,56
//  Colore Phrygian: Cb (b2) = 47 — la nota di massima tensione
// ═══════════════════════════════════════════════════════════

const MODES6 = {
  Bb_phrygian: [46,47,49,51,52,54,56, 58,59,61,63,64,66,68, 70,71,73,75,76,78,80],
  Gb_locrian:  [54,55,57,59,60,62,64, 66,67,69,71,72,74,76, 78,79,81,83,84,86,88],
};

// ═══════════════════════════════════════════════════════════
//  CHORD VOICINGS — Bb Phrygian rituali
//  Bbm = Bb, Db, F  → [46+12=58, 61, 65]
//  Cbmaj = Cb, Eb, Gb → [47+12=59, 63, 66]
//  Ebm = Eb, Gb, Bb → [51+12=63, 66, 70]
//  Bbsus = Bb, Eb, F → [58, 63, 65]
// ═══════════════════════════════════════════════════════════

const CHORD_PROGS6 = {
  germoglio:    [[58,61,65]],                              // Bbm open
  pulsazione:   [[58,61,65],[59,63,66],[58,61,65]],        // Bbm→Cb→Bbm
  densita:      [[58,61,65],[59,63,66],[63,66,70],[58,63,65]], // Bbm→Cb→Ebm→Bbsus
  rottura:      null,
  dissoluzione: [[58,61,65],[59,63,66],[58,61,65]],
};
let chordProgIdx6 = 0;
let lastChord6 = [58, 61, 65];

// ═══════════════════════════════════════════════════════════
//  BASS SEQUENCES — Bb Phrygian rituali
//  Root Bb1=34. Offsets: 0=Bb1, 1=Cb2(b2!), 5=Eb2(4th), 7=F2(5th), 10=Ab2(7th)
//  PRINCIPIO: MENO è PIÙ. Il basso di Abisso è autorità, non melody.
//  Ogni nota è un evento, non parte di un pattern continuo.
// ═══════════════════════════════════════════════════════════

// {p: step triggers, n: note offsets da Bb1(34), gate: stepMs multiplier}
const BASS_SEQS6 = [
  // 0: singola nota sul downbeat — massima autorità (germoglio)
  { p:[1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], n:[0],     gate:14.0 },

  // 1: root + quinta sul "and of 3" — respiro rituale
  { p:[1,0,0,0, 0,0,0,0, 0,0,7,0, 0,0,0,0], n:[0,7],   gate:8.0  },

  // 2: root + Cb(b2) + quinta — pienezza Phrygian
  { p:[1,0,0,0, 0,0,0,0, 0,1,0,0, 0,0,7,0], n:[0,1,7], gate:4.0  },

  // 3: pattern rituale — E(3,16) dub profondo
  { p:[1,0,0,0, 0,0,0,0, 0,0,0,1, 0,0,0,0], n:[0,5],   gate:6.0  },

  // 4: ascesa per la risalita (ROTTURA)
  { p:[1,0,0,0, 0,0,7,0, 0,0,0,0, 0,0,12,0], n:[0,7,12], gate:2.5 },
];

const BASS_FOR_PHASE6 = {
  germoglio:    [0, 0],
  pulsazione:   [1, 3],
  densita:      [2, 3, 1],
  rottura:      [4, 4],
  dissoluzione: [0, 1],
};

// ═══════════════════════════════════════════════════════════
//  PRESENZA — calibrata per il carattere abissale
// ═══════════════════════════════════════════════════════════

const PHASE_PRESENCE6 = {
  //              [bass, drone, voice, grain, chords]
  germoglio:    [0.0, 0.4, 0.0, 0.0, 0.2],
  pulsazione:   [0.5, 0.7, 0.3, 0.1, 0.5],
  densita:      [0.8, 0.8, 0.5, 0.3, 0.7],
  rottura:      [0.7, 0.2, 0.0, 0.7, 0.1],
  dissoluzione: [0.2, 0.6, 0.3, 0.0, 0.4],
};

// ═══════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════

export let composer6Active = false;

let phaseIndex = 0;
let phaseTime = 0;
let arcProgress = 0;
let clock = 0;
let lastStep = -1;

let currentMode = 'Bb_phrygian';
let currentDrone = 46;

let ruptureStage = 'idle';
let lastRuptureStage = 'idle';

const presence = [0, 0, 0, 0, 0];
let debugTimer = 0;

let bassSeq6 = BASS_SEQS6[0];
let bassNoteIdx6 = 0;
let lastBassVarBar6 = -1;
let lastChordBar6 = -2;
let lastDroneStep6 = -999;

// ── Inizializzazione ──
export function initComposer6() {
  phaseIndex = 0; phaseTime = 0; arcProgress = 0;
  clock = 0; lastStep = -1;
  ruptureStage = 'idle'; lastRuptureStage = 'idle';
  presence.fill(0);
  currentMode = 'Bb_phrygian'; currentDrone = 46;
  chordProgIdx6 = 0; lastChord6 = [58, 61, 65];
  bassSeq6 = BASS_SEQS6[0]; bassNoteIdx6 = 0; lastBassVarBar6 = -1;
  lastChordBar6 = -2; lastDroneStep6 = -999;
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
function currentPhase() { return CFG.COMPOSER6.phaseOrder[phaseIndex]; }

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
    phaseTime = 0; arcProgress = 0; chordProgIdx6 = 0;
    bassNoteIdx6 = 0; lastBassVarBar6 = -1;
    console.log(`[COMPOSER6] → ${currentPhase()}`);
  }
}

// ── VoidManager ──
function updatePresence(dt) {
  const target = PHASE_PRESENCE6[currentPhase()] || [0.3,0.4,0.1,0.1,0.3];
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
    if (ruptureStage !== 'idle') { ruptureStage = 'idle'; setComposerClimax(false); }
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

// ═══════════════════════════════════════════════════════════
//  STEP SEQUENCER — 16th note @ 76 BPM (stepMs ≈ 197ms)
// ═══════════════════════════════════════════════════════════

function onStep(step) {
  const bpm    = CFG.COMPOSER6.bpm;
  const stepMs = (60 / bpm / 4) * 1000;   // ~197ms
  const barMs  = stepMs * 16;
  const s16    = step % 16;
  const bar    = Math.floor(step / 16);
  const name   = currentPhase();
  const rc     = ruptureStage === 'takeover'     ? 0.8
               : ruptureStage === 'infiltrazione' ? 0.4
               : ruptureStage === 'presagio'      ? 0.15 : 0;

  // Octave shift per la RISALITA in rottura
  const octShift = ruptureStage === 'takeover' ? 24
                 : ruptureStage === 'infiltrazione' ? 12 : 0;

  // ── Staggered bass rotation ogni 10 bar ──
  if (bar !== lastBassVarBar6 && bar % 10 === 0) {
    lastBassVarBar6 = bar;
    const bpool = BASS_FOR_PHASE6[name] || [0];
    bassSeq6 = BASS_SEQS6[bpool[bar % bpool.length]];
    bassNoteIdx6 = 0;
  }

  // ─────────────────────────────────────────────────────────
  //  CH0 PULSE — heartbeat rituale
  //  Non è un kick drum — è un battito cardiaco.
  //  Solo sul downbeat, rarissimo, autorità assoluta.
  //  Con octShift risale durante la ROTTURA.
  // ─────────────────────────────────────────────────────────
  if (s16 === 0 && presence[0] > 0.1) {
    const heartbeatEvery = CFG.COMPOSER6.heartbeatEvery || 2; // ogni N bar
    if (bar % heartbeatEvery === 0) {
      const vel  = Math.floor(42 + presence[0] * 22);
      const note = Math.min(127, currentDrone - 24 + octShift);
      sendMIDINote(0, note, vel, Math.round(stepMs * 0.7));
      addMidiNote(0, note / 127, vel / 127);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  CH3 BASS — rituale, lento, autorità
  //  Offsets da Bb1(34): 0=Bb1, 1=Cb2(b2), 5=Eb2, 7=F2, 10=Ab2, 12=Bb2
  // ─────────────────────────────────────────────────────────
  if (presence[0] > 0.1 && name !== 'rottura' && bassSeq6.p[s16]) {
    const offsets = [0, 1, 5, 7, 10, 12];
    const off     = bassSeq6.n[bassNoteIdx6 % bassSeq6.n.length];
    bassNoteIdx6++;
    const bassNote = 34 + offsets[Math.min(off, offsets.length - 1)] + octShift;
    const isDown   = s16 === 0;
    const vel = isDown
      ? Math.floor(82 + presence[0] * 28)
      : Math.floor(65 + presence[0] * 22 + (Math.random()-0.5)*6);
    const dur = isDown
      ? Math.round(stepMs * bassSeq6.gate)
      : Math.round(stepMs * Math.max(2.0, bassSeq6.gate * 0.45));
    sendMIDINote(3, Math.min(127, bassNote), vel, dur);
    addMidiNote(3, bassNote / 127, vel / 127);
  }

  // ─────────────────────────────────────────────────────────
  //  CH4 CHORDS — pads rituali, lunghissimi, rari
  //  Cambia ogni 8 bar — il cambio è un evento sacro
  // ─────────────────────────────────────────────────────────
  if (presence[4] > 0.2 && s16 === 0) {
    const chordBars = 8;
    if (bar !== lastChordBar6 && bar % chordBars === 0) {
      lastChordBar6 = bar;
      const prog = CHORD_PROGS6[name];
      if (prog) {
        chordProgIdx6 = (chordProgIdx6 + 1) % prog.length;
        lastChord6 = [...prog[chordProgIdx6]];
      }
      const chord = lastChord6;
      const vel = Math.floor(30 + presence[4] * 28);
      const dur = Math.round(barMs * 7.5);
      for (const n of chord) {
        const note = Math.min(127, n + octShift);
        sendMIDINote(4, note, vel, dur);
        addMidiNote(4, note / 127, vel / 127);
      }
      emit('chord_change', { root: chord[0], mode: currentMode });
    }
  }

  // ─────────────────────────────────────────────────────────
  //  CH2 DRONE — radice omnipresente + quinta
  //  Cambia ogni 12 bar (lentissimo)
  // ─────────────────────────────────────────────────────────
  if (step - lastDroneStep6 >= 16 * 12) { // ogni 12 bar
    lastDroneStep6 = step - (step % (16 * 12)); // allineato al bar
    const vel = Math.floor(25 + presence[1] * 20);
    const note = Math.min(127, currentDrone + octShift);
    sendMIDINote(2, note, vel, Math.round(barMs * 11));
    sendMIDINote(2, Math.min(127, note + 7), Math.round(vel * 0.55), Math.round(barMs * 11));
    addMidiNote(2, note / 127, vel / 127);
  }

  // ─────────────────────────────────────────────────────────
  //  CH1 GRAIN — sedimento abissale
  //  Non è texture: è l'eco di cose che scendono nel fondo
  //  Molto sparso, note basse, velocity bassa
  // ─────────────────────────────────────────────────────────
  if (presence[3] > 0.1) {
    // Spara solo sui beat pari (step 4, 8, 12) con probabilità bassa
    const grainSteps = [4, 8, 12];
    if (grainSteps.includes(s16) && Math.random() < presence[3] * 0.35) {
      const scale = MODES6[currentMode];
      // Registro abissale: solo note sotto C4(60)
      const lo   = scale.filter(n => n >= 46 && n <= 62);
      const pool = lo.length > 0 ? lo : scale;
      const note = Math.min(127, pool[Math.floor(Math.random() * pool.length)] + octShift);
      const vel  = Math.floor(18 + presence[3] * 28);
      sendMIDINote(1, note, vel, Math.round(stepMs * 2.5));
      addMidiNote(1, note / 127, vel / 127);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  CH5 VOICE — gocce melodiche rare, note lunghe
  //  Ogni 8 bar sul beat 2 — come voci nell'abisso
  // ─────────────────────────────────────────────────────────
  if (presence[2] > 0.2 && s16 === 4) { // beat 2
    if (bar % 8 === 0 && Math.random() < presence[2] * 0.72) {
      const scale = MODES6[currentMode];
      const hi   = scale.filter(n => n >= 63 && n <= 80);
      const pool = hi.length > 0 ? hi : scale;
      const note = Math.min(127, pool[Math.floor(Math.random() * pool.length)] + octShift);
      const vel  = Math.floor(28 + presence[2] * 25);
      sendMIDINote(5, note, vel, Math.round(stepMs * 16)); // ~4 beat
      addMidiNote(5, note / 127, vel / 127);

      // CH6 LEAD — eco ritardato un'ottava sotto, mezzo beat dopo
      if (Math.random() < 0.55) {
        setTimeout(() => {
          if (!composer6Active) return;
          const echoNote = Math.max(0, Math.min(127, note - 12));
          sendMIDINote(6, echoNote, Math.floor(vel * 0.55), Math.round(stepMs * 12));
          addMidiNote(6, echoNote / 127, (vel * 0.55) / 127);
        }, Math.round(stepMs * 2));
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  //  CH7 RUPTURE
  // ─────────────────────────────────────────────────────────
  if (ruptureStage !== 'idle' && ruptureStage !== 'residuo') {
    const ruptureEvery = ruptureStage === 'presagio' ? 16 :
                         ruptureStage === 'takeover'  ? 3  : 6;
    if (step % ruptureEvery === 0) {
      const scale = MODES6['Gb_locrian'];
      const note  = Math.min(127, scale[Math.floor(Math.random() * scale.length)] + octShift);
      const vel   = Math.floor(52 + rc * 55);
      sendMIDINote(7, note, vel, Math.round(stepMs * 0.9));
      addMidiNote(7, note / 127, vel / 127);
    }
  }
}

// ── State injection ──
function injectState() {
  const pm = getPresenceMultiplier('abisso');
  const activeCount = presence.filter(p => p > 0.3).length;
  state.intensity   = Math.min(1, 0.15 + arcProgress * 0.4 + activeCount * 0.07) * pm;
  state.rhythmicity = Math.min(1, presence[0] * 0.3 + presence[3] * 0.2) * pm;
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
  const stepsPerSec = bpm * 4 / 60;
  clock += dt * stepsPerSec;
  const currentStep = Math.floor(clock);
  if (currentStep > lastStep) {
    for (let s = lastStep + 1; s <= currentStep; s++) onStep(s);
    lastStep = currentStep;
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

// ── Export status ──
export function getComposer6Status() {
  return {
    active: composer6Active,
    phase: currentPhase(),
    activeCount: presence.filter(p => p > 0.3).length,
    ruptureStage,
  };
}
