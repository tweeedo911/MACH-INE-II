// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Composer 4 (VORTICE)
//  E Phrygian · 138 BPM · tribal-industriale · micro-loop
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
  E_phrygian: [52,53,55,57,59,60,62, 64,65,67,69,71,72,74, 76,77,79,81,83,84,86],
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

const BASS_PATTERNS = [
  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],   // ogni downbeat (0)
  [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],   // sincopato (1)
  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],   // ogni quarto (2)
];

// Note sequence per ciascun BASS_PATTERN step trigger
// Offsets da E1(40): 0=E1, 1=F1(b2!), 3=G1, 5=A1, 7=B1, 8=C2, 10=D2, 12=E2
const BASS_NOTE_SEQS = [
  [0, 7],          // E + B (root/fifth) per pattern 0
  [0, 1, 7, 0],    // E→F(tension)→B→E per pattern 1 (Phrygian pulse)
  [0, 0, 7, 1],    // E→E→B→F(release) per pattern 2
];

const RIDE_PAT_TRIBAL = [0,0,1,0, 0,1,0,0, 0,0,1,0, 1,0,0,0]; // additive 3+3+3+3+4

// ═══════════════════════════════════════════════════════════
//  MICRO-LOOP PITCH CLASSES — FISSI PER LAYER
//  Invece di scorrer la scala sequenzialmente, ogni layer
//  ha un pool di 4-5 note caratteristiche che cicla.
//  Layer A (alto): E4, G4, B4, C5 — quinta/terza/ottava
//  Layer B (medio): E3, F3, A3, B3 — colore Phrygian (include b2)
//  Layer C (altissimo): E5, G5, B4 — solo triadic
// ═══════════════════════════════════════════════════════════

// LAYER A — 8-step, registro alto [64,67,71,72]
// E4=64, G4=67, B4=71, C5=72
const MICRO_A_PITCHES = [
  [64, 67, 71, 72],   // standard E Phrygian triad + root
  [64, 65, 69, 72],   // with b2 (F4=65) for tension
  [67, 71, 72, 74],   // upper structure G/B/C/D
  [64, 67, 71, 74],   // E/G/B/D — m7
];

// LAYER B — 5-step, registro medio [52,53,57,59]
// E3=52, F3=53, A3=57, B3=59
const MICRO_B_PITCHES = [
  [52, 53, 57, 59],   // E/F(b2)/A/B — full Phrygian color
  [52, 55, 57, 60],   // E/G/A/C — open triad
  [53, 57, 59, 62],   // F/A/B/D — tension cluster
  [52, 55, 59, 60],   // E/G/B/C
];

// LAYER C — 3-step, registro altissimo [76,79,83]
// E5=76, G5=79, B4=71→B5=83
const MICRO_C_PITCHES = [
  [76, 79, 83],   // E/G/B top
  [76, 77, 81],   // E/F/A high (Phrygian tension in alto)
  [71, 76, 79],   // B/E/G descent
];

// Pattern step shapes (i pattern triggers rimangono identici)
const MICRO_A_POOL = [
  [1,0,0,1,0,0,1,0],
  [1,0,1,0,0,1,0,0],
  [1,0,0,0,1,0,0,1],
];
const MICRO_B_POOL = [
  [1,0,0,1,0],
  [1,0,1,0,0],
  [0,1,0,0,1],
];
const MICRO_C_POOL = [
  [1,0,1],
  [1,1,0],
  [0,1,1],
];

// ═══════════════════════════════════════════════════════════
//  VOICE MOTIF — frase ricorrente ancorata a E Phrygian
//  Il motivo si evolve lentamente: variazioni sulla stessa cell
// ═══════════════════════════════════════════════════════════

// Motif base: E4→F4→E4→B3 (root→b2→root→5th — quintessenza Phrygian)
// Varianti per fase:
const VOICE_MOTIFS = {
  germoglio:    [[64, 65, 64, 59]],                        // E→F→E→B (base)
  pulsazione:   [[64, 65, 64, 59], [67, 65, 64, 62]],     // + G→F→E→D
  densita:      [[64, 65, 67, 64], [72, 71, 69, 67],       // E→F→G→E, C→B→A→G
                 [64, 65, 64, 59], [67, 65, 62, 60]],      // base + G→F→D→C
  rottura:      [[65, 64, 62, 60], [53, 52, 50, 48]],     // discesa cromatica + bassa
  dissoluzione: [[64, 65, 64, 59]],                        // ritorno alla cell base
};

let voiceMotifPool = VOICE_MOTIFS.germoglio;
let voiceMotifIdx = 0;
let voiceStepInMotif = 0;

// CHORD voicings per VORTICE — E Phrygian
// Em (E,G,B), Fmaj (F,A,C), Cmaj(C,E,G), Dm(D,F,A), Gm(G,B,D)
const CHORD_VOICINGS4 = {
  germoglio:    [[52,55,59]],                        // Em
  pulsazione:   [[52,55,59],[53,57,60]],             // Em → Fmaj
  densita:      [[52,55,59],[53,57,60],[48,52,55],   // Em→Fmaj→Cmaj
                 [50,53,57]],                         // Dm
  rottura:      null,
  dissoluzione: [[52,55,59],[53,57,60]],
};
let chordVoiceIdx4 = 0;

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

let currentMode = 'E_phrygian';
let currentDrone = 52;  // E3

let ruptureStage = 'idle';
let lastRuptureStage = 'idle';

const presence = [0, 0, 0, 0];
let debugTimer = 0;

// Pattern attivi
let kickPat, ghostPat, bassPat, microA, microB, microC;
let microAPitches, microBPitches, microCPitches;
let bassNoteSeq, bassNoteIdx4;
let lastKickBar = -1, lastGhostBar = -1, lastBassBar = -1, lastMicroBar = -1;

const KICK_VAR_BARS  = 8;
const GHOST_VAR_BARS = 16;
const BASS_VAR_BARS  = 16;
const MICRO_VAR_BARS = 8;

function pickPatterns() {
  kickPat      = KICK_PATTERNS[Math.floor(Math.random() * KICK_PATTERNS.length)];
  ghostPat     = GHOST_PATTERNS[Math.floor(Math.random() * GHOST_PATTERNS.length)];
  const bpi    = Math.floor(Math.random() * BASS_PATTERNS.length);
  bassPat      = BASS_PATTERNS[bpi];
  bassNoteSeq  = BASS_NOTE_SEQS[bpi];
  bassNoteIdx4 = 0;
  microA       = MICRO_A_POOL[Math.floor(Math.random() * MICRO_A_POOL.length)];
  microB       = MICRO_B_POOL[Math.floor(Math.random() * MICRO_B_POOL.length)];
  microC       = MICRO_C_POOL[Math.floor(Math.random() * MICRO_C_POOL.length)];
  microAPitches = MICRO_A_PITCHES[Math.floor(Math.random() * MICRO_A_PITCHES.length)];
  microBPitches = MICRO_B_PITCHES[Math.floor(Math.random() * MICRO_B_PITCHES.length)];
  microCPitches = MICRO_C_PITCHES[Math.floor(Math.random() * MICRO_C_PITCHES.length)];
}

// ── Inizializzazione ──
export function initComposer4() {
  phaseIndex = 0; phaseTime = 0; arcProgress = 0;
  clock = 0; lastStep = -1;
  ruptureStage = 'idle'; lastRuptureStage = 'idle';
  setEnginePhase('vortice', CFG.COMPOSER4.phaseOrder[0]);
  presence.fill(0);
  currentMode = 'E_phrygian'; currentDrone = 52;
  lastKickBar = lastGhostBar = lastBassBar = lastMicroBar = -1;
  voiceMotifPool = VOICE_MOTIFS.germoglio; voiceMotifIdx = 0; voiceStepInMotif = 0;
  chordVoiceIdx4 = 0;
  pickPatterns();
}

// ── Toggle ──
export function toggleComposer4() {
  composer4Active = !composer4Active;
  if (composer4Active) {
    initComposer4();
    setEngine('vortice');
    console.log('[COMPOSER4] ON — E Phrygian VORTICE 138bpm');
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
    voiceMotifPool = VOICE_MOTIFS[currentPhase()] || VOICE_MOTIFS.germoglio;
    voiceMotifIdx  = 0; voiceStepInMotif = 0; chordVoiceIdx4 = 0;
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

  // ── Staggered pattern rotation (sfalsato per evoluzione naturale) ──
  if (bar !== lastKickBar && bar % KICK_VAR_BARS === 0) {
    lastKickBar = bar;
    // Fase guida la scelta: densita prende kick più tribale
    const pool = { germoglio:[0,1], pulsazione:[0,1,2], densita:[2,3,4,3], rottura:[3,4], dissoluzione:[0,1] }[name] || [1];
    kickPat = KICK_PATTERNS[pool[bar % pool.length]];
  }
  if (bar !== lastGhostBar && bar % GHOST_VAR_BARS === 0) {
    lastGhostBar = bar;
    ghostPat = GHOST_PATTERNS[Math.floor(Math.random() * GHOST_PATTERNS.length)];
  }
  if (bar !== lastBassBar && bar % BASS_VAR_BARS === 0) {
    lastBassBar = bar;
    const bpi   = Math.floor(Math.random() * BASS_PATTERNS.length);
    bassPat     = BASS_PATTERNS[bpi];
    bassNoteSeq = BASS_NOTE_SEQS[bpi];
    bassNoteIdx4 = 0;
  }
  if (bar !== lastMicroBar && bar % MICRO_VAR_BARS === 0) {
    lastMicroBar = bar;
    microA = MICRO_A_POOL[Math.floor(Math.random() * MICRO_A_POOL.length)];
    microB = MICRO_B_POOL[Math.floor(Math.random() * MICRO_B_POOL.length)];
    microC = MICRO_C_POOL[Math.floor(Math.random() * MICRO_C_POOL.length)];
    // Ruota anche i pitch pools per evoluzione timbrica
    microAPitches = MICRO_A_PITCHES[Math.floor(Math.random() * MICRO_A_PITCHES.length)];
    microBPitches = MICRO_B_PITCHES[Math.floor(Math.random() * MICRO_B_PITCHES.length)];
    microCPitches = MICRO_C_PITCHES[Math.floor(Math.random() * MICRO_C_PITCHES.length)];
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
  //  CH3 BASS — melodia E Phrygian con tensione b2 (F)
  //  offsets: 0=E1(40), 1=F1(41/b2), 3=G1(43), 5=A1(45), 7=B1(47), 8=C2(48), 10=D2(50), 12=E2(52)
  // ─────────────────────────────────────────────────────────
  if (bassPat[s16] && name !== 'rottura') {
    const bassRoot = currentDrone - 12; // E2=40
    const offsets  = [0, 1, 3, 5, 7, 8, 10, 12];
    const off      = bassNoteSeq[bassNoteIdx4 % bassNoteSeq.length];
    bassNoteIdx4++;
    const bassNote = bassRoot + offsets[Math.min(off, offsets.length - 1)];
    const vel = s16 === 0
      ? Math.floor(98 + presence[2] * 18)
      : Math.floor(80 + presence[2] * 20);
    // Gate corto = pulse tribale, lungo = sustained
    const gate = name === 'densita' ? 2.8 : 4.0;
    sendMIDINote(3, Math.min(127, bassNote), vel, Math.round(stepMs * gate));
    addMidiNote(3, bassNote / 127, vel / 127);
  }

  // ─────────────────────────────────────────────────────────
  //  CH1 GRAIN — 3 micro-loop con pitch classes FISSI
  //  La chiave: ogni layer ha il suo vocabolario armonico
  // ─────────────────────────────────────────────────────────

  // Layer A: 8-step, alto [E4,G4,B4,C5] — triade + ottava
  if (microA[step % microA.length] && presence[1] > 0.2) {
    const pitches = microAPitches;
    // Cicla tra le note del pool (non la scala) — suona come arpeggio, non scala run
    const note = pitches[(step + Math.floor(step / 3)) % pitches.length];
    const vel  = Math.floor(48 + presence[1] * 32);
    sendMIDINote(1, note, vel, Math.round(stepMs * 1.4));
    addMidiNote(1, note / 127, vel / 127);
  }

  // Layer B: 5-step, medio [E3,F3,A3,B3] — colore Phrygian
  if (microB[step % microB.length] && presence[1] > 0.4) {
    const pitches = microBPitches;
    const note = pitches[(step + 2) % pitches.length]; // offset 2 per sfasamento
    const vel  = Math.floor(42 + presence[1] * 28);
    sendMIDINote(1, note, vel, Math.round(stepMs * 1.2));
    addMidiNote(1, note / 127, vel / 127);
  }

  // Layer C: 3-step, altissimo [E5,G5,B5] — triade aperta
  if (microC[step % microC.length] && presence[1] > 0.6) {
    const pitches = microCPitches;
    const note = pitches[step % pitches.length]; // sfasamento diverso
    const vel  = Math.floor(35 + presence[1] * 22);
    sendMIDINote(1, note, vel, Math.round(stepMs * 0.75));
    addMidiNote(1, note / 127, vel / 127);
  }

  // ─────────────────────────────────────────────────────────
  //  CH2 DRONE — ogni 4 bar
  // ─────────────────────────────────────────────────────────
  if (step % 64 === 0 && name !== 'rottura') {
    const vel = Math.floor(22 + arcProgress * 14);
    sendMIDINote(2, currentDrone, vel, Math.round(stepMs * 58));
    addMidiNote(2, currentDrone / 127, vel / 127);
  }

  // ─────────────────────────────────────────────────────────
  //  CH4 CHORDS — voicings E Phrygian, ogni 2 bar
  // ─────────────────────────────────────────────────────────
  if (presence[0] > 0.7 && s16 === 0 && step % 32 === 0) {
    const prog = CHORD_VOICINGS4[name];
    if (prog) {
      chordVoiceIdx4 = (chordVoiceIdx4 + 1) % prog.length;
      const chord = prog[chordVoiceIdx4];
      const vel   = Math.floor(42 + presence[0] * 28);
      const dur   = Math.round(stepMs * 26); // ~2 bar
      for (const note of chord) {
        sendMIDINote(4, note, vel, dur);
        addMidiNote(4, note / 127, vel / 127);
      }
      emit('chord_change', { root: chord[0], mode: currentMode });
    }
  }

  // ─────────────────────────────────────────────────────────
  //  CH5 VOICE — motivo ricorrente ogni 16 step (1 bar)
  //  La frase è [E→F→E→B] e varianti per fase
  //  Ogni nota della frase appare ogni 4 step (quarter note)
  // ─────────────────────────────────────────────────────────
  if (presence[3] > 0.2 && s16 % 4 === 0 && getPresenceMultiplier('vortice') > 0.5) {  // sui 4 beat della bar
    const noteInMotif = (s16 / 4) % 4; // 0,1,2,3
    // Avanza il motif pool ogni 4 bar
    if (s16 === 0 && bar % 4 === 0 && bar > 0) {
      voiceMotifPool = VOICE_MOTIFS[name] || VOICE_MOTIFS.germoglio;
      voiceMotifIdx = (voiceMotifIdx + 1) % voiceMotifPool.length;
    }
    const motif = voiceMotifPool[voiceMotifIdx] || voiceMotifPool[0];
    const note  = motif[noteInMotif];
    if (Math.random() < 0.75 + presence[3] * 0.2) { // probabilità alta = identità
      let vel = Math.floor(55 + presence[3] * 42);
      // ── Modal characteristic note boost ──
      const charInt4 = CFG.modalCharacteristicNotes['vortice'];
      if ((note % 12) === ((currentDrone % 12) + charInt4) % 12) vel = Math.min(127, vel + CFG.characteristicVelBoost);
      // Nota più corta del beat — lascia spazio tra le note del motif
      const dur = Math.round(stepMs * 3.2);
      sendMIDINote(5, note, vel, dur);
      addMidiNote(5, note / 127, vel / 127);
    }
  }

  // ── CH6 LEAD — interlocking: fires on 8th upbeats where CH5 is silent ──
  if (presence[3] > 0.4 && (name === 'densita' || name === 'pulsazione')) {
    const leadSteps = [2, 6, 10, 14];
    if (leadSteps.includes(s16)) {
      const scale = MODES4[currentMode] || MODES4.E_phrygian;
      const hiPool = scale.filter(n => n >= 76 && n <= 83);
      if (hiPool.length > 0) {
        const note = hiPool[(s16 + bar) % hiPool.length];
        const vel = Math.round(35 + presence[3] * 30);
        sendMIDINote(6, note, vel, Math.round(stepMs * 1.2));
        addMidiNote(6, note / 127, vel / 127);
      }
    }
  }

  // CH6 LEAD — eco del motivo VOICE, ottava sotto, ritardato
  if (presence[3] > 0.5 && s16 === 8 && step % 32 === 8) { // sul beat 3, ogni 2 bar
    const motif = voiceMotifPool[voiceMotifIdx] || voiceMotifPool[0];
    const note  = Math.max(40, motif[0] - 12); // root ottava sotto
    const vel   = Math.floor(40 + presence[3] * 30);
    sendMIDINote(6, note, vel, Math.round(stepMs * 5));
    addMidiNote(6, note / 127, vel / 127);
  }

  // ─────────────────────────────────────────────────────────
  //  CH7 RIDE — tribal additive pattern (3+3+3+3+4 = 16)
  //  Asymmetric against the kick, dialogs with micro-loops
  // ─────────────────────────────────────────────────────────
  const ridePresence4 = name === 'germoglio' ? 0.0
    : name === 'pulsazione' ? 0.1
    : name === 'densita' ? 0.4
    : name === 'rottura' ? 0.7
    : 0.15;

  if (ridePresence4 > 0.05 && RIDE_PAT_TRIBAL[s16]) {
    const vel = Math.round(35 + ridePresence4 * 35 + (Math.random() - 0.5) * 6);
    sendMIDINote(7, 82, vel, Math.round(stepMs * 0.5));
    addMidiNote(7, 82 / 127, vel / 127);
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
