// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Composer 2 (MECCANICA)
//  C# Dorian · 98 BPM · poliritmia jazz · layer system
//  v3 — step clock per kick/bass, voicings jazz, shell chords
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
  const pm = getPresenceMultiplier('meccanica');
  if (pm < 0.05) return;
  if (!isChannelAllowed('meccanica', ch)) return;
  _rawSend(ch, note, Math.max(1, Math.round(vel * pm)), dur);
}
function addMidiNote(ch, x, intensity) {
  _rawAddMidi(ch, x, intensity * getPresenceMultiplier('meccanica'));
}

// ═══════════════════════════════════════════════════════════
//  SCALES — C# Dorian root C#3=61
//  C# D# E F# G# A# B C# — Dorian color: A# (natural 6th)
// ═══════════════════════════════════════════════════════════

const MODES2 = {
  Cs_dorian:  [37,49,51,52,54,56,58,59,61,63,64,66,68,70,71,73,75,76,78,80],
  Cs_lydian:  [37,49,51,53,54,56,58,60,61,63,65,66,68,70,72,73,75,77],
  Fs_phrygian:[42,54,55,57,59,61,62,64,66,67,69,71,73,74,76,78],
  Bb_locrian: [46,47,49,51,52,54,56,58,59,61,63,64,66,68,70,71,73,75,76,78,80],
};

// C# Dorian pivot pitch classes: C#=1, E=4, G#=8
const PIVOT_CLASSES2 = new Set([1, 4, 8]);

// ═══════════════════════════════════════════════════════════
//  CHORD VOICINGS — C# Dorian jazz shell voicings
//  Principio: root in basso (CH3), chord voicing è CH4 separato
//  Si usano drop-2 e shell voicings per evitare saturazione
//  Dorian color: includi A#(58) per il carattere modale
// ═══════════════════════════════════════════════════════════

// C#m7:  C#, E, G#, B  — [49+12=61, 64, 68, 71]
// F#m7:  F#, A, C#, E  — [54+12=66, 69, 73, 76]
// Amaj7: A, C#, E, G#  — [57+12=69, 73, 76, 80]  ← Dorian IV chord
// G#m7:  G#, B, D#, F# — [56+12=68, 71, 75, 78]
// B7:    B, D#, F#, A# — [47+12=59, 63, 66, 70]  ← Dorian VII chord

const CHORD_PROGS2 = {
  germoglio:    [[61,64,68]],                                      // C#m (open triad)
  pulsazione:   [[61,64,68],[66,70,73],[64,68,71],[61,66,68]],     // C#m→F#m→Em→C#sus
  densita:      [[61,64,68,71],[66,70,73,76],[64,68,71,75],        // C#m7→F#m7→Em7
                 [68,73,76,80],[66,70,73,76],[61,68,71,76]],       // Amaj7→F#m7→C#m9
  rottura:      null,
  dissoluzione: [[61,64,68,71],[66,70,73,76],[61,64,68]],
};
let chordProgIdx2 = 0;
let lastChord = [61, 64, 68];

// ═══════════════════════════════════════════════════════════
//  KICK PATTERNS — E(5,16) variants per 98 BPM
//  Jazz feel: off-beat accentuations, non 4/4 classico
// ═══════════════════════════════════════════════════════════

const KICK_PATS2 = [
  [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],  // [0] single (germoglio)
  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,1,0,0],  // [1] 1+3+"4e" — jazz pocket
  [1,0,0,0, 1,0,0,0, 0,0,1,0, 0,0,1,0],  // [2] 1+2+"and3"+"and4" — funky
  [1,0,1,0, 0,0,1,0, 0,1,0,0, 1,0,0,0],  // [3] E(5,16) jazz variant
  [1,0,0,0, 0,1,0,0, 1,0,0,1, 0,0,1,0],  // [4] dense syncopated
];

// ═══════════════════════════════════════════════════════════
//  BASS PATTERNS — C# Dorian melodic motifs
//  Bass root C#1=37.  Note offsets from C#1:
//  0=C#1, 3=E1, 4=F1 (avoid!), 7=G#1, 10=A#1(Dorian6!), 12=C#2
//  REGOLA: MAI il bII (D=semitono sopra C#) come nota melodica lunga
// ═══════════════════════════════════════════════════════════

const BASS_SEQS2 = [
  // 0: root held long (germoglio)
  { p:[1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], n:[0],          gate:12.0 },

  // 1: root + fifth — jazz minimal
  { p:[1,0,0,0, 0,0,0,0, 0,0,7,0, 0,0,0,0], n:[0,7],        gate:7.0  },

  // 2: root + minor3rd + fifth — C# jazz groove
  { p:[1,0,0,0, 0,0,0,1, 0,0,7,0, 0,0,0,0], n:[0,3,7],      gate:3.5  },

  // 3: Dorian color — root + A#(6th) + G#(5th) anticipation
  { p:[1,0,0,0, 0,0,0,0, 0,0,7,0, 10,0,0,0], n:[0,7,10],    gate:3.0  },

  // 4: dense jazz walking (densita)
  { p:[1,0,0,0, 0,1,0,0, 7,0,0,0, 10,0,12,0], n:[0,3,7,10,12], gate:2.0 },
];

const BASS_FOR_PHASE2 = {
  germoglio:    [0, 0],
  pulsazione:   [1, 2],
  densita:      [3, 4, 3],
  rottura:      [4, 2],
  dissoluzione: [1, 0],
};

// ═══════════════════════════════════════════════════════════
//  LAYER SYSTEM — oscillatori a cicli primi
//  harmonic=4bar, rhythmic=3bar, textural=5bar, melodic=7bar
//  Si riallineano ogni 420 bar (~10min) — ogni performance è unica
// ═══════════════════════════════════════════════════════════

class Layer {
  constructor(cycleBars, offset) {
    this.cycleBars = cycleBars;
    this.phase = offset;
    this._prevPhase = offset;
  }
  update(dt, bpm) {
    this._prevPhase = this.phase;
    const barsPerSec = bpm / (60 * 4);
    this.phase = (this.phase + barsPerSec * dt / this.cycleBars) % 1;
  }
  crossed(threshold) {
    const p = this._prevPhase, n = this.phase;
    if (p <= n) return p < threshold && n >= threshold;
    return p < threshold || n >= threshold;
  }
}

// ═══════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════

export let composer2Active = false;

let phaseIndex = 0;
let phaseTime = 0;
let arcProgress = 0;
let clock = 0;       // beat clock
let lastBeat = -1;
let clockStep = 0;   // step clock per kick/bass
let lastStep2 = -1;

const layers = {};
const presence = [0,0,0,0]; // [harmonic, rhythmic, textural, melodic]

let currentMode = 'Cs_dorian';
let currentDrone = 61;        // C#3
let currentDroneNote = 61;    // follows chord root for harmonic pad effect (per PARTITURA)
let texturalBarCount = 0;     // bar counter for sinusoidal TEXTURAL presence oscillation

let ruptureStage = 'idle';
let lastRuptureStage = 'idle';

let kickPat2 = KICK_PATS2[0];
let lastKickPatBar = -1;
let bassSeq2 = BASS_SEQS2[0];
let bassNoteIdx2 = 0;
let lastBassSeqBar = -1;

let _lastTensionActive = false;
let _lastVoidActive    = false;
let _lastDensityPeak   = false;
let debugTimer = 0;

// ── Inizializzazione ──
export function initComposer2() {
  phaseIndex = 0; phaseTime = 0; arcProgress = 0;
  clock = 0; lastBeat = -1; clockStep = 0; lastStep2 = -1;
  ruptureStage = 'idle'; lastRuptureStage = 'idle';
  _lastTensionActive = _lastVoidActive = _lastDensityPeak = false;
  presence.fill(0);
  setEnginePhase('meccanica', currentPhaseName());
  chordProgIdx2 = 0; lastChord = [61, 64, 68];
  currentDroneNote = 61; texturalBarCount = 0;
  kickPat2 = KICK_PATS2[0]; lastKickPatBar = -1;
  bassSeq2 = BASS_SEQS2[0]; bassNoteIdx2 = 0; lastBassSeqBar = -1;

  const L = CFG.COMPOSER2.layers;
  layers.harmonic = new Layer(L.harmonic.cycleBars, L.harmonic.offset);
  layers.rhythmic  = new Layer(L.rhythmic.cycleBars,  L.rhythmic.offset);
  layers.textural  = new Layer(L.textural.cycleBars,  L.textural.offset);
  layers.melodic   = new Layer(L.melodic.cycleBars,   L.melodic.offset);
}

// ── Toggle ──
export function toggleComposer2() {
  composer2Active = !composer2Active;
  if (composer2Active) {
    initComposer2();
    setEngine('meccanica');
    console.log('[COMPOSER2] ON — C# Dorian MECCANICA 98bpm');
  } else {
    sendMIDIAllNotesOff();
    setComposerClimax(false);
    releaseArcHold();
    setEngine(null);
    console.log('[COMPOSER2] OFF');
  }
}

// ── Phase system ──
function currentPhaseName() { return CFG.COMPOSER2.phaseOrder[phaseIndex]; }

function updatePhase(dt) {
  phaseTime += dt;
  const phaseName = currentPhaseName();
  const phaseCfg = CFG.COMPOSER2.phases[phaseName];
  arcProgress = Math.min(1, phaseTime / phaseCfg.duration);
  currentMode = phaseCfg.mode;
  currentDrone = phaseCfg.drone;
  setArcPhaseForced(phaseCfg.arc);
  if (phaseTime >= phaseCfg.duration) {
    phaseIndex = (phaseIndex + 1) % CFG.COMPOSER2.phaseOrder.length;
    phaseTime = 0; arcProgress = 0; chordProgIdx2 = 0; texturalBarCount = 0;
    kickPat2 = KICK_PATS2[0]; lastKickPatBar = -1;
    bassSeq2 = BASS_SEQS2[0]; bassNoteIdx2 = 0; lastBassSeqBar = -1;
    setEnginePhase('meccanica', currentPhaseName(), ruptureStage);
    console.log(`[COMPOSER2] → ${currentPhaseName()}`);
  }
}

// ── Layer update ──
function updateLayers(dt) {
  const bpm = CFG.COMPOSER2.bpm;
  layers.harmonic.update(dt, bpm);
  layers.rhythmic.update(dt, bpm);
  layers.textural.update(dt, bpm);
  layers.melodic.update(dt, bpm);
}

// ── VoidManager ──
function updatePresence(dt) {
  const phaseName = currentPhaseName();
  const target = {
    germoglio:    [0.3, 0.0, 0.0, 0.0],
    pulsazione:   [0.5, 0.7, 0.0, 0.3],
    densita:      [0.8, 0.9, 0.6, 0.7],
    rottura:      [0.2, 0.9, 0.8, 0.0],
    dissoluzione: [0.4, 0.1, 0.0, 0.2],
  }[phaseName] || [0.5,0.5,0.3,0.3];
  const silTarget = CFG.COMPOSER2.silenceTarget[phaseName] || 0.4;
  for (let i = 0; i < 4; i++) {
    presence[i] += (target[i] - presence[i]) * dt * 0.3;
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
  const phaseName = currentPhaseName();
  if (phaseName !== 'rottura') {
    if (ruptureStage !== 'idle') { ruptureStage = 'idle'; setComposerClimax(false); }
    return;
  }
  const R = CFG.COMPOSER2.rupture;
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
//  CHORD BUILDER — voice leading jazz-informed
// ═══════════════════════════════════════════════════════════

function buildChord(mode) {
  const scale = MODES2[mode] || MODES2.Cs_dorian;
  const maxLeap = (CFG.COMPOSER2.voiceLeadingMax || 3) * 2;
  const newChord = lastChord.map(note => {
    const candidates = scale.filter(n => Math.abs(n - note) <= maxLeap);
    if (!candidates.length) {
      return scale.reduce((best, n) => Math.abs(n - note) < Math.abs(best - note) ? n : best);
    }
    // Prefer pivot pitch classes for smooth voice leading
    const pivot = candidates.filter(n => PIVOT_CLASSES2.has(n % 12));
    if (pivot.length > 0 && Math.random() < 0.5) {
      return pivot[Math.floor(Math.random() * pivot.length)];
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  });
  lastChord = newChord;
  return newChord;
}

function getChordFromProg(phaseName) {
  const prog = CHORD_PROGS2[phaseName];
  if (prog) {
    chordProgIdx2 = (chordProgIdx2 + 1) % prog.length;
    lastChord = [...prog[chordProgIdx2]];
    return lastChord;
  }
  return buildChord(currentMode);
}

// ═══════════════════════════════════════════════════════════
//  MELODIC NOTE PICKER — for layer crossings
// ═══════════════════════════════════════════════════════════

function pickMelodicNote(mode) {
  const scale = MODES2[mode] || MODES2.Cs_dorian;
  // Prefer mid-high register (C#4=61 to C#5=73), bias toward chord tones + pivot
  const pool = [];
  for (const n of scale) {
    if (n < 59 || n > 80) continue;
    let w = 1.0;
    if (PIVOT_CLASSES2.has(n % 12)) w *= 2.5;
    if (lastChord.some(c => c % 12 === n % 12)) w *= 3.0;
    pool.push({ n, w });
  }
  if (!pool.length) return scale[Math.floor(Math.random() * scale.length)];
  const total = pool.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  for (const e of pool) { r -= e.w; if (r <= 0) return e.n; }
  return pool[pool.length - 1].n;
}

// ═══════════════════════════════════════════════════════════
//  STEP SEQUENCER — kick e bass a 16th-note resolution
//  Il layer system rimane per melodia/armonia/grain
// ═══════════════════════════════════════════════════════════

function onKickBassStep(step) {
  const bpm    = CFG.COMPOSER2.bpm;
  const stepMs = (60 / bpm / 4) * 1000;   // ~153ms a 98 BPM
  const barMs  = stepMs * 16;
  const s16    = step % 16;
  const bar2   = Math.floor(step / 16);
  const rc     = ruptureStage === 'takeover'     ? 0.8
               : ruptureStage === 'infiltrazione' ? 0.4
               : ruptureStage === 'presagio'      ? 0.15 : 0;

  // Increment bar counter for TEXTURAL sinusoidal oscillation
  if (s16 === 0) texturalBarCount++;

  // Progressive swing: 0ms in germoglio → swingMsMax in densita, applied to beats 2+4
  const swingFactorMap = { germoglio:0, pulsazione:1, densita:2, rottura:3, dissoluzione:2 };
  const swingFactor = (swingFactorMap[currentPhaseName()] ?? 0) / 4.0;
  const swingMs = Math.round(CFG.COMPOSER2.swingMsMax * swingFactor);
  const kickSwing = (s16 === 4 || s16 === 12) ? swingMs : 0;

  // Staggered kick pattern rotation (ogni 6 bar)
  if (bar2 !== lastKickPatBar && bar2 % 8 === 0) {
    lastKickPatBar = bar2;
    const kickPool = {
      germoglio:    [0],
      pulsazione:   [1, 2],
      densita:      [2, 3, 4],
      rottura:      [4, 3],
      dissoluzione: [1, 0],
    }[currentPhaseName()] || [1];
    const ki = bar2 % kickPool.length;
    kickPat2 = KICK_PATS2[kickPool[ki]];
  }

  // Staggered bass motif rotation (ogni 8 bar)
  if (bar2 !== lastBassSeqBar && bar2 % 8 === 0) {
    lastBassSeqBar = bar2;
    const bpool = BASS_FOR_PHASE2[currentPhaseName()] || [1];
    const bi = (bar2 / 8) % bpool.length;
    bassSeq2 = BASS_SEQS2[bpool[bi]];
    bassNoteIdx2 = 0;
  }

  // ── CH0 PULSE — kick jazz ──
  if (presence[1] > 0.3 && rc < 0.6 && kickPat2[s16]) {
    const vel = s16 === 0 ? 105 : Math.floor(75 + presence[1] * 28 + (Math.random()-0.5)*8);
    // Groove humanization: offset ±12ms on off-beat kicks
    const humanMs = s16 !== 0 ? Math.round((Math.random() - 0.5) * 24) : 0;
    setTimeout(() => {
      if (!composer2Active) return;
      sendMIDINote(0, currentDrone - 12, vel, Math.round(stepMs * 0.4));
      addMidiNote(0, (currentDrone - 12) / 127, vel / 127);
    }, Math.max(0, humanMs + kickSwing));
  }

  // ── CH3 BASS — C# Dorian melodic motif ──
  if (presence[1] > 0.2 && currentPhaseName() !== 'rottura' && bassSeq2.p[s16]) {
    const offsets = [0, 3, 7, 10, 12, -2]; // C#1, E1, G#1, A#1(Dorian6), C#2, B0(leadingtone)
    const off = bassSeq2.n[bassNoteIdx2 % bassSeq2.n.length];
    bassNoteIdx2++;
    const bassNote = currentDrone - 24 + (offsets[off] !== undefined ? offsets[off] : off);
    const vel = s16 === 0
      ? Math.floor(88 + presence[1] * 25)
      : Math.floor(70 + presence[1] * 22 + (Math.random()-0.5)*7);
    const dur = s16 === 0
      ? Math.round(stepMs * bassSeq2.gate)
      : Math.round(stepMs * Math.max(1.5, bassSeq2.gate * 0.4));
    sendMIDINote(3, Math.max(24, Math.min(96, bassNote)), vel, dur);
    addMidiNote(3, bassNote / 127, vel / 127);
  }

  // ── CLIMAX HARD CUT — takeover finale → silenzio ──
  if (ruptureStage === 'takeover' && arcProgress > 0.78) {
    sendMIDIAllNotesOff();
  }
}

// ═══════════════════════════════════════════════════════════
//  LAYER CROSSINGS — CH4 chords, CH1 grain, CH5/CH6 voice
//  Questi rimangono time-continuous (non sul beat grid):
//  è la caratteristica jazz-organica di questo engine
// ═══════════════════════════════════════════════════════════

function checkLayerCrossings() {
  const bpm    = CFG.COMPOSER2.bpm;
  const beatMs = (60 / bpm) * 1000;
  const phaseName = currentPhaseName();
  const rc = ruptureStage === 'takeover'     ? 0.8
           : ruptureStage === 'infiltrazione' ? 0.4
           : ruptureStage === 'presagio'      ? 0.15 : 0;

  // CH4 CHORDS — harmonic layer crossing 0.0, 0.5
  // Voicings: usa progressioni fisse in germoglio/pulsazione, buildChord in densita
  if (presence[0] > 0.3) {
    if (layers.harmonic.crossed(0.0) || layers.harmonic.crossed(0.5)) {
      const chord = phaseName === 'densita'
        ? buildChord(currentMode)
        : getChordFromProg(phaseName);
      // Update drone note to follow chord root (harmonic pad effect, per PARTITURA)
      currentDroneNote = Math.min(...chord);
      const vel = Math.floor(48 + presence[0] * 38);
      // Durata lunga: lascia respirare il pad (6-8 beat)
      const dur = Math.round(beatMs * (5 + Math.random() * 3));
      for (const note of chord) {
        sendMIDINote(4, note, vel, dur);
        addMidiNote(4, note / 127, vel / 127);
      }
      emit('chord_change', { root: chord[0], mode: currentMode });
    }
  }

  // CH0 GHOST NOTES — rhythmic layer offbeats (0.25, 0.75) at 30% probability per PARTITURA
  if (presence[1] > 0.3 && rc < 0.5) {
    for (const th of [0.25, 0.75]) {
      if (layers.rhythmic.crossed(th)) {
        if (Math.random() < CFG.COMPOSER2.ghostNoteProb) {
          const vel = Math.floor(25 + Math.random() * 15);
          sendMIDINote(0, currentDrone - 12, vel, Math.round(beatMs * 0.15));
          addMidiNote(0, (currentDrone - 12) / 127, vel / 127);
        }
      }
    }
  }

  // CH1 GRAIN — textural layer crossing 0.2, 0.4, 0.6, 0.8
  // Sinusoidal oscillation on TEXTURAL presence (per PARTITURA)
  const texturalPm = 0.5 + 0.2 * Math.sin(2 * Math.PI * texturalBarCount / CFG.COMPOSER2.texturalOscBars);
  if (presence[2] * texturalPm > 0.25 && rc < 0.5) {
    for (const th of [0.2, 0.4, 0.6, 0.8]) {
      if (layers.textural.crossed(th)) {
        const scale = MODES2[currentMode] || MODES2.Cs_dorian;
        // Solo note nel registro brillante (F#4=66 → C#5=73)
        const hi   = scale.filter(n => n >= 66 && n <= 78);
        const pool = hi.length > 0 ? hi : scale;
        const note = pool[Math.floor(Math.random() * pool.length)];
        const vel  = Math.floor(35 + presence[2] * 32);
        sendMIDINote(1, note, vel, Math.round(beatMs * 0.3));
        addMidiNote(1, note / 127, vel / 127);
        emit('grain_entry', { intensity: presence[2] });
      }
    }
  }

  // CH5 VOICE + CH6 LEAD — call and response sul layer melodico
  if (presence[3] > 0.3 && rc < 0.5 && getPresenceMultiplier('meccanica') > 0.5) {
    for (const th of [0.25, 0.5, 0.75]) {
      if (layers.melodic.crossed(th)) {
        if (Math.random() < presence[3] * 0.72) {
          const note = pickMelodicNote(currentMode);
          const vel  = Math.floor(50 + presence[3] * 45);
          // CH5 VOICE — the call (durata 2 beat)
          sendMIDINote(5, note, vel, Math.round(beatMs * 2.2));
          addMidiNote(5, note / 127, vel / 127);
          // CH6 LEAD — response: stesso intervallo invertito, ritardato (~1.5 beat dopo)
          if (presence[3] > 0.5 && Math.random() < 0.55) {
            const chordRoot = lastChord[0] || 61;
            const interval  = note - chordRoot;
            // Risposta speculare: sale→scende, scende→sale
            const responseNote = Math.max(48, Math.min(96, chordRoot - interval));
            setTimeout(() => {
              if (!composer2Active) return;
              sendMIDINote(6, responseNote, Math.floor(vel * 0.62), Math.round(beatMs * 1.8));
              addMidiNote(6, responseNote / 127, (vel * 0.62) / 127);
            }, Math.round(beatMs * 1.5));
          }
        }
      }
    }
  }

  // CH2 DRONE — ogni 16 beat (invariato)
  // Gestito in onBeat per semplicità
}

// ═══════════════════════════════════════════════════════════
//  BEAT CLOCK — solo CH2 DRONE (tutto il resto è in step/layer)
// ═══════════════════════════════════════════════════════════

function onBeat(beat) {
  const bpm    = CFG.COMPOSER2.bpm;
  const beatMs = (60 / bpm) * 1000;
  const phaseName = currentPhaseName();

  // CH2 DRONE — follows chord root, capped per PARTITURA Regola 4
  const droneCap = { germoglio:0.15, pulsazione:0.15, densita:0.1, rottura:0.0, dissoluzione:0.1 }[phaseName] ?? 0.1;
  if (beat % 16 === 0 && droneCap > 0) {
    const vel = Math.floor(25 + droneCap * 80); // ~37 at 0.15, ~33 at 0.1
    sendMIDINote(2, currentDroneNote, vel, Math.round(beatMs * 14));
    sendMIDINote(2, currentDroneNote + 7, Math.round(vel * 0.55), Math.round(beatMs * 14));
    addMidiNote(2, currentDroneNote / 127, vel / 127);
  }
}

// ── Semantic events ──
function emitLayerEvents() {
  const phaseName   = currentPhaseName();
  const silTarget   = CFG.COMPOSER2.silenceTarget[phaseName] || 0.4;
  let activeCount = 0; for (let i = 0; i < 4; i++) if (presence[i] > 0.3) activeCount++;
  const voidRatio   = 1 - activeCount / 4;
  const tensionNow  = activeCount >= 2 && arcProgress > 0.4;
  if (tensionNow && !_lastTensionActive) emit('tension', { level: (activeCount-1)/3*arcProgress });
  _lastTensionActive = tensionNow;
  const voidNow = voidRatio > silTarget + 0.05;
  if (voidNow && !_lastVoidActive) emit('void', { ratio: voidRatio });
  _lastVoidActive = voidNow;
  const peakNow = activeCount === 4;
  if (peakNow && !_lastDensityPeak) emit('density_peak', { level: arcProgress });
  _lastDensityPeak = peakNow;
}

// ── State injection ──
function injectState() {
  const pm = getPresenceMultiplier('meccanica');
  let activeCount = 0; for (let i = 0; i < 4; i++) if (presence[i] > 0.3) activeCount++;
  state.intensity   = Math.min(1, 0.2 + arcProgress * 0.5 + activeCount * 0.1) * pm;
  state.rhythmicity = Math.min(1, presence[1] * 0.8 + presence[2] * 0.2) * pm;
  state.trajectory  = arcProgress > 0.7 ? -1 : arcProgress > 0.3 ? 0 : 1;
}

// ═══════════════════════════════════════════════════════════
//  MAIN UPDATE
// ═══════════════════════════════════════════════════════════

export function updateComposer2(dt) {
  updatePhase(dt);
  updateLayers(dt);
  updatePresence(dt);
  updateRupture();

  // Layer crossings (armonia/grain/voce) — ogni frame
  checkLayerCrossings();

  // Beat clock per drone
  const bpm = CFG.COMPOSER2.bpm;
  const beatsPerSec = bpm / 60;
  clock += dt * beatsPerSec;
  const currentBeat = Math.floor(clock);
  if (currentBeat > lastBeat) { lastBeat = currentBeat; onBeat(currentBeat); }

  // Step clock per kick/bass (16th note)
  const stepsPerSec = bpm * 4 / 60;
  clockStep += dt * stepsPerSec;
  const currentStep2 = Math.floor(clockStep);
  if (currentStep2 > lastStep2) {
    for (let s = lastStep2 + 1; s <= currentStep2; s++) onKickBassStep(s);
    lastStep2 = currentStep2;
  }

  emitLayerEvents();
  injectState();

  debugTimer += dt;
  if (CFG.debug && debugTimer >= 10) {
    debugTimer = 0;
    let ac = 0; for (let i = 0; i < 4; i++) if (presence[i] > 0.3) ac++;
    console.log(
      `[COMPOSER2] ${currentPhaseName()} | ` +
      `H${presence[0].toFixed(1)} R${presence[1].toFixed(1)} ` +
      `T${presence[2].toFixed(1)} M${presence[3].toFixed(1)} ` +
      `| rupture: ${ruptureStage} | active: ${ac}/4`
    );
  }
}

// ── Export status ──
export function getComposer2Status() {
  return {
    active: composer2Active,
    phase: currentPhaseName(),
    activeCount: presence.filter(p => p > 0.3).length,
    ruptureStage,
  };
}
