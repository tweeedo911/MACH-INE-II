// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Composer 7 (SOLCO)
//  G Dorian · 128 BPM · Berlin techno ipnotico · 4/4 fisso
//  v3 — velocity sweep bass, kick invariabile, groove ipnotico
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
  const pm = getPresenceMultiplier('solco');
  if (pm < 0.05) return;
  if (!isChannelAllowed('solco', ch)) return;
  _rawSend(ch, note, Math.max(1, Math.round(vel * pm)), dur);
}
function addMidiNote(ch, x, intensity) {
  _rawAddMidi(ch, x, intensity * getPresenceMultiplier('solco'));
}

// ═══════════════════════════════════════════════════════════
//  SCALES — G Dorian: G A Bb C D E F
//  MIDI G2=43, A2=45, Bb2=46, C3=48, D3=50, E3=52, F3=53
//  Dorian color: E natural (6th) — sweet tension over minor
//  The 6th is what makes techno Dorian feel "longing" not "sad"
// ═══════════════════════════════════════════════════════════

const MODES7 = {
  G_dorian:   [31,43,45,46,48,50,52,53,55,57,58,60,62,64,65,67,69,70,72,74,76,77,79],
  G_phrygian: [31,43,44,46,48,50,51,53,55,56,58,60,62,63,65,67,68,70,72,74,75,77,79],
};

// Pivot pitch classes: G=7, Bb=10, D=2 (tonic triad)
const PIVOT_CLASSES7 = new Set([7, 10, 2]);

// ═══════════════════════════════════════════════════════════
//  KICK — 4/4 INVARIABILE
//  Questa è l'identità di SOLCO: il kick non cambia MAI pattern.
//  È il mantra. La variazione viene da tutto il resto.
// ═══════════════════════════════════════════════════════════

const KICK_4x4 = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0];

// ═══════════════════════════════════════════════════════════
//  HI-HAT PATTERNS (CH1)
//  La hat è il secondo pilastro del groove berlinese.
//  Closed hat = note veloci e corte. Open hat = note più lunghe.
//  I due pattern sovrapposti creano il groove.
// ═══════════════════════════════════════════════════════════

// Closed hi-hat trigger patterns (note corte, vel media-alta)
const HAT_CLOSED = [
  [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],   // [0] 8ths minimo (pulsazione)
  [0,0,1,0, 0,1,1,0, 0,0,1,0, 0,1,1,0],   // [1] 8ths + ghost (densita)
  [0,1,1,0, 0,1,1,0, 0,1,1,0, 0,1,1,0],   // [2] driving (climax)
  [0,1,1,1, 0,1,1,1, 0,1,1,1, 0,1,1,1],   // [3] full 16ths (max)
];

// Open hi-hat trigger patterns (note più lunghe, vel bassa, offbeat)
const HAT_OPEN = [
  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],   // [0] nessuno (germoglio)
  [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],   // [1] "and" of 2&4 (classico)
  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],   // [2] on beat 2&4
  [0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1],   // [3] every "and" (denso)
];

const HAT_FOR_PHASE = {
  germoglio:    { closed: 0, open: 0 },
  pulsazione:   { closed: 0, open: 1 },
  densita:      { closed: 1, open: 1 },
  rottura:      { closed: 2, open: 2 },
  dissoluzione: { closed: 0, open: 0 },
};

// ═══════════════════════════════════════════════════════════
//  BASS — ROLLING 16TH con VELOCITY SWEEP
//  Root G1=31 (sub-bass profondo).
//  Il meccanismo unico: la velocity cicla sinusoidalmente
//  su N bar, simulando un filtro LP che apre e chiude.
//  Bass note offsets from G1(31):
//    0=G1, 2=A1, 3=Bb1, 5=C2, 7=D2, 9=E2(Dorian6!), 10=F2, 12=G2
// ═══════════════════════════════════════════════════════════

const BASS_PATTERNS7 = [
  // [0] root quarters — germoglio, ancora non rolling
  { p:[1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], n:[0],              gate:3.5 },

  // [1] root + 5th, 8th note feel — pulsazione
  { p:[1,0,0,0, 1,0,1,0, 0,0,1,0, 0,0,1,0], n:[0,0,7,0],        gate:2.0 },

  // [2] rolling 8ths — transition toward dance
  { p:[1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], n:[0,0],            gate:1.2 },

  // [3] rolling 16ths monotone — classico Berlin (densita)
  { p:[1,1,1,0, 1,1,1,0, 1,1,1,0, 1,1,1,0], n:[0],              gate:0.75 },

  // [4] rolling 16ths melodico — root→5th→6th→root (climax)
  { p:[1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], n:[0,0,7,9, 0,0,7,12, 0,0,5,7, 0,0,9,12], gate:0.6 },
];

const BASS_FOR_PHASE7 = {
  germoglio:    [0, 0, 1],
  pulsazione:   [1, 2, 1],
  densita:      [3, 3, 4],
  rottura:      [4, 4],
  dissoluzione: [2, 1, 0],
};

// Velocity sweep config: the signature of SOLCO
const SWEEP_BARS      = 8;   // full cycle in bars
const SWEEP_AMP_BASE  = 22;  // velocity swing ±22
const SWEEP_BASE_VEL  = 70;  // center velocity

// ═══════════════════════════════════════════════════════════
//  CHORD STABS — minimal, spaced out
//  Berlin techno chords: short, dry, reverberant.
//  Gm7, Am7, Cmaj, Dm7, Bbmaj7 — G Dorian diatonic
// ═══════════════════════════════════════════════════════════

const CHORD_PROGS7 = {
  // In germoglio/pulsazione: nessun chord — il groove basta
  germoglio:    null,
  pulsazione:   null,
  // In densita: chord stabs minimali
  densita:      [[55,58,62,65],[57,60,64,67],[60,64,67,70],[55,58,62,65]],
  //             Gm7            Am7            C7             Gm7
  rottura:      [[55,58,62,65],[60,64,67,70]],  // Gm7→C7 (tensione)
  dissoluzione: [[55,58,62,65]],                // Solo Gm7 (casa)
};
let chordProgIdx7 = 0;

// ═══════════════════════════════════════════════════════════
//  PRESENCE
//  7 slots: [KICK, HAT, DRONE, BASS, CHORD, VOICE, RIDE]
//  KICK è SEMPRE a 1.0 — non scende mai.
//  Il build-up è texture, non ritmo.
// ═══════════════════════════════════════════════════════════

const PHASE_PRESENCE7 = {
  //               KICK  HAT   DRONE BASS  CHORD VOICE RIDE
  germoglio:      [1.0,  0.3,  0.5,  0.6,  0.0,  0.0,  0.0],
  pulsazione:     [1.0,  0.6,  0.4,  0.8,  0.3,  0.1,  0.0],
  densita:        [1.0,  0.8,  0.3,  1.0,  0.5,  0.2,  0.5],
  rottura:        [1.0,  1.0,  0.2,  1.0,  0.4,  0.0,  0.8],
  dissoluzione:   [0.7,  0.3,  0.6,  0.4,  0.2,  0.3,  0.0],
};

// ═══════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════

export let composer7Active = false;

let phaseIndex = 0;
let phaseTime = 0;
let arcProgress = 0;
let clock = 0;
let lastStep = -1;

let currentMode = 'G_dorian';
let currentDrone = 55;  // G3

let ruptureStage = 'idle';
let lastRuptureStage = 'idle';

const presence = [0, 0, 0, 0, 0, 0, 0];
let debugTimer = 0;

// Pattern state
let hatClosedPat = HAT_CLOSED[0];
let hatOpenPat   = HAT_OPEN[0];
let bassPat7     = BASS_PATTERNS7[0];
let bassNoteIdx7 = 0;
let bassVarIdx   = 0;
let lastBassVarBar = -1;
let lastHatBar     = -1;
let lastChordBar7  = -2;
let lastDroneBar7  = -2;
let lastVoiceBar7  = -2;

// ═══════════════════════════════════════════════════════════
//  INIT / TOGGLE
// ═══════════════════════════════════════════════════════════

export function initComposer7() {
  phaseIndex = 0; phaseTime = 0; arcProgress = 0;
  clock = 0; lastStep = -1;
  ruptureStage = 'idle'; lastRuptureStage = 'idle';
  setEnginePhase('solco', CFG.COMPOSER7.phaseOrder[0]);
  presence.fill(0);
  // Kick starts immediately at full presence
  presence[0] = 1.0;
  currentMode = 'G_dorian'; currentDrone = 55;
  hatClosedPat = HAT_CLOSED[0]; hatOpenPat = HAT_OPEN[0];
  bassPat7 = BASS_PATTERNS7[0]; bassNoteIdx7 = 0; bassVarIdx = 0;
  lastBassVarBar = -1; lastHatBar = -1;
  lastChordBar7 = -2; lastDroneBar7 = -2; lastVoiceBar7 = -2;
  chordProgIdx7 = 0;
}

export function toggleComposer7() {
  composer7Active = !composer7Active;
  if (composer7Active) {
    initComposer7();
    setEngine('solco');
    console.log('[COMPOSER7] ON — G Dorian SOLCO 128bpm');
  } else {
    sendMIDIAllNotesOff();
    setComposerClimax(false);
    releaseArcHold();
    setEngine(null);
    console.log('[COMPOSER7] OFF');
  }
}

// ═══════════════════════════════════════════════════════════
//  PHASE SYSTEM
// ═══════════════════════════════════════════════════════════

function currentPhase() { return CFG.COMPOSER7.phaseOrder[phaseIndex]; }

function updatePhase(dt) {
  phaseTime += dt;
  const name = currentPhase();
  const cfg = CFG.COMPOSER7.phases[name];
  arcProgress = Math.min(1, phaseTime / cfg.duration);
  currentMode = cfg.mode;
  currentDrone = cfg.drone;
  setArcPhaseForced(cfg.arc);
  if (phaseTime >= cfg.duration) {
    phaseIndex = (phaseIndex + 1) % CFG.COMPOSER7.phaseOrder.length;
    phaseTime = 0; arcProgress = 0;
    chordProgIdx7 = 0; bassNoteIdx7 = 0; bassVarIdx = 0;
    lastBassVarBar = -1; lastHatBar = -1;
    setEnginePhase('solco', currentPhase(), ruptureStage);
    console.log(`[COMPOSER7] → ${currentPhase()}`);
  }
}

// ═══════════════════════════════════════════════════════════
//  PRESENCE — kick never fades below 0.7
// ═══════════════════════════════════════════════════════════

function updatePresence(dt) {
  const target = PHASE_PRESENCE7[currentPhase()] || PHASE_PRESENCE7.germoglio;
  const silTarget = CFG.COMPOSER7.silenceTarget?.[currentPhase()] || 0.25;
  for (let i = 0; i < 7; i++) {
    presence[i] += (target[i] - presence[i]) * dt * 0.4;
  }
  // Kick floor: never below 0.7 except late dissoluzione
  if (currentPhase() !== 'dissoluzione') {
    presence[0] = Math.max(0.7, presence[0]);
  }
  // Silence management
  const activeCount = presence.filter(p => p > 0.15).length;
  const voidRatio = 1 - activeCount / 7;
  if (voidRatio < silTarget) {
    // Too dense: suppress weakest non-kick channel
    let minIdx = 1;
    for (let i = 2; i < 7; i++) { if (presence[i] < presence[minIdx]) minIdx = i; }
    presence[minIdx] *= 0.85;
  }
}

// ═══════════════════════════════════════════════════════════
//  CLIMAX ENGINE (ex-rupture)
//  SOLCO's climax = "serraggio" — tighter, more mechanical,
//  less dynamic. Then hard cut to total silence.
// ═══════════════════════════════════════════════════════════

function updateClimax(dt) {
  const name = currentPhase();
  if (name !== 'rottura') {
    if (ruptureStage !== 'idle') {
      ruptureStage = 'idle';
      lastRuptureStage = 'idle';
      setComposerClimax(false);
    }
    return;
  }
  const R = CFG.COMPOSER7.climax;
  const p = arcProgress;
  if      (p < R.presagioAt)      ruptureStage = 'presagio';
  else if (p < R.infiltrazioneAt) ruptureStage = 'infiltrazione';
  else if (p < R.takeoverAt)      ruptureStage = 'takeover';
  else if (p < R.hardCutAt)       ruptureStage = 'hardcut';
  else                             ruptureStage = 'residuo';

  // Hard cut: silence everything
  if (ruptureStage === 'hardcut' && lastRuptureStage !== 'hardcut') {
    sendMIDIAllNotesOff();
    for (let i = 0; i < presence.length; i++) presence[i] = 0;
  }

  // Residuo: only drone, pianissimo
  if (ruptureStage === 'residuo') {
    for (let i = 0; i < presence.length; i++) {
      if (i === 2) presence[i] = Math.max(0.1, presence[i] - dt * 0.2); // drone fades slow
      else presence[i] = 0;
    }
  }

  if (ruptureStage !== lastRuptureStage) {
    lastRuptureStage = ruptureStage;
    emit('rupture_stage', { stage: ruptureStage, progress: p });
    setComposerClimax(ruptureStage === 'takeover');
  }
}

// ═══════════════════════════════════════════════════════════
//  STEP SEQUENCER — 16th note @ 128 BPM (stepMs ≈ 117ms)
// ═══════════════════════════════════════════════════════════

function onStep(step) {
  const bpm    = CFG.COMPOSER7.bpm;
  const stepMs = (60 / bpm / 4) * 1000;   // ~117ms
  const barMs  = stepMs * 16;
  const s16    = step % 16;
  const bar    = Math.floor(step / 16);
  const name   = currentPhase();

  // ── Skip during hard cut and residuo ──
  if (ruptureStage === 'hardcut' || ruptureStage === 'residuo') return;

  // ── Climax modifiers ──
  // In climax: velocity più uniforme (meno umana, più macchina)
  // e gate più corti (più percussivo, più urgente)
  const climaxVelBoost = ruptureStage === 'takeover'      ? 1.20
                       : ruptureStage === 'infiltrazione'  ? 1.10
                       : ruptureStage === 'presagio'       ? 1.05 : 1.0;
  const climaxGateMult = ruptureStage === 'takeover'       ? 0.65
                       : ruptureStage === 'infiltrazione'  ? 0.80 : 1.0;
  // In climax: reduce velocity randomization → more mechanical
  const humanize = ruptureStage === 'takeover' ? 0.0
                 : ruptureStage === 'infiltrazione' ? 0.3 : 1.0;

  // ── Staggered hat pattern rotation (every 8 bars) ──
  if (bar !== lastHatBar && bar % 8 === 0) {
    lastHatBar = bar;
    const hatCfg = HAT_FOR_PHASE[name] || HAT_FOR_PHASE.pulsazione;
    // In climax: force densest hat pattern
    if (ruptureStage === 'takeover') {
      hatClosedPat = HAT_CLOSED[3]; hatOpenPat = HAT_OPEN[3];
    } else if (ruptureStage === 'infiltrazione') {
      hatClosedPat = HAT_CLOSED[2]; hatOpenPat = HAT_OPEN[2];
    } else {
      hatClosedPat = HAT_CLOSED[hatCfg.closed]; hatOpenPat = HAT_OPEN[hatCfg.open];
    }
  }

  // ── Staggered bass pattern rotation (every 12 bars) ──
  if (bar !== lastBassVarBar && bar % 12 === 0) {
    lastBassVarBar = bar;
    const pool = BASS_FOR_PHASE7[name] || [1];
    bassVarIdx = (bassVarIdx + 1) % pool.length;
    // In climax: force densest bass
    if (ruptureStage === 'takeover' || ruptureStage === 'infiltrazione') {
      bassPat7 = BASS_PATTERNS7[4]; // full rolling melodic
    } else {
      bassPat7 = BASS_PATTERNS7[pool[bassVarIdx]];
    }
    bassNoteIdx7 = 0;
  }

  // ─────────────────────────────────────────────────────────
  //  CH0 KICK — 4/4 invariabile
  //  Il mantra di SOLCO. Non cambia mai. L'unica variazione
  //  è la velocity: downbeat più forte, upbeat leggermente sotto.
  // ─────────────────────────────────────────────────────────
  if (presence[0] > 0.1 && KICK_4x4[s16]) {
    const isDown = s16 === 0;
    const baseVel = isDown ? 118 : 108;
    const vel = Math.min(127, Math.round(
      baseVel + humanize * (Math.random() - 0.5) * 6
    ));
    sendMIDINote(0, 36, vel, Math.round(stepMs * 0.55));
    addMidiNote(0, 0.5, vel / 127);
  }

  // ─────────────────────────────────────────────────────────
  //  CH1 HI-HAT — closed + open sovrapposti
  //  Closed: note alte e corte. Open: note medie e lunghe.
  //  Nota: usiamo note dalla scala alta come proxy
  //  (Ableton mapperà lo strumento su CH1)
  // ─────────────────────────────────────────────────────────

  // Closed hat
  if (presence[1] > 0.1 && hatClosedPat[s16]) {
    const scale = MODES7[currentMode] || MODES7.G_dorian;
    // Registro altissimo: G5=79, A5=81 — sottile, metallico
    const hiPool = scale.filter(n => n >= 76 && n <= 81);
    const note = hiPool.length > 0 ? hiPool[s16 % hiPool.length] : 79;
    const vel = Math.round(
      52 + presence[1] * 28 + humanize * (Math.random() - 0.5) * 8
    );
    sendMIDINote(1, note, Math.min(127, Math.round(vel * climaxVelBoost)),
      Math.round(stepMs * 0.25 * climaxGateMult));
    addMidiNote(1, note / 127, vel / 127);
  }

  // Open hat (overlaps, longer decay)
  if (presence[1] > 0.2 && hatOpenPat[s16]) {
    const note = 74; // D5 — nota fissa, timbro diverso dal closed
    const vel = Math.round(38 + presence[1] * 22);
    sendMIDINote(1, note, Math.min(127, Math.round(vel * climaxVelBoost)),
      Math.round(stepMs * 1.8 * climaxGateMult));
    addMidiNote(1, note / 127, vel / 127);
  }

  // ─────────────────────────────────────────────────────────
  //  CH3 BASS — rolling con velocity sweep
  //  IL CUORE DI SOLCO. La velocity cicla sinusoidalmente
  //  su SWEEP_BARS bar, simulando un filtro LP.
  //  sweepPhase: 0 = filtro chiuso (muffled), 0.5 = aperto (bright)
  // ─────────────────────────────────────────────────────────
  if (presence[3] > 0.1 && bassPat7.p[s16]) {
    const bassRoot = 31; // G1 deep sub
    const offsets  = [0, 2, 3, 5, 7, 9, 10, 12]; // G A Bb C D E F G
    const off      = bassPat7.n[bassNoteIdx7 % bassPat7.n.length];
    bassNoteIdx7++;
    const bassNote = bassRoot + (offsets[off] !== undefined ? offsets[off] : off);

    // ── Velocity sweep: sinusoidal cycle over SWEEP_BARS ──
    const sweepBars = CFG.COMPOSER7.sweepBars || SWEEP_BARS;
    const sweepPhase = ((bar % sweepBars) + s16 / 16) / sweepBars;
    const sweepFactor = Math.sin(sweepPhase * Math.PI * 2);
    // In climax: reduce sweep amplitude → filter stays open
    const sweepAmp = ruptureStage === 'takeover'      ? 5
                   : ruptureStage === 'infiltrazione'  ? 12
                   : SWEEP_AMP_BASE;
    const sweepVel = SWEEP_BASE_VEL + sweepAmp * sweepFactor;

    // Downbeat accent
    const accentVel = s16 === 0 ? 10 : s16 % 4 === 0 ? 4 : 0;

    const vel = Math.min(127, Math.round(
      (sweepVel + accentVel) * climaxVelBoost
      + humanize * (Math.random() - 0.5) * 5
    ));
    const dur = Math.round(stepMs * bassPat7.gate * climaxGateMult);

    sendMIDINote(3, Math.min(96, bassNote), vel, dur);
    addMidiNote(3, bassNote / 127, vel / 127);
  }

  // ─────────────────────────────────────────────────────────
  //  CH2 DRONE — sub pad, G2+D3 (root+5th), ogni 8 bar
  // ─────────────────────────────────────────────────────────
  if (presence[2] > 0.1 && s16 === 0 && bar !== lastDroneBar7 && bar % 8 === 0) {
    lastDroneBar7 = bar;
    const vel = Math.round(28 + presence[2] * 20);
    const dur = Math.round(barMs * 7.5);
    sendMIDINote(2, 43, vel, dur);           // G2 root
    sendMIDINote(2, 50, Math.round(vel * 0.6), dur); // D3 fifth
    addMidiNote(2, 43 / 127, vel / 127);
  }

  // ─────────────────────────────────────────────────────────
  //  CH4 CHORD STABS — minimal, ogni 8 bar, su beat 2 (step 4)
  //  Short and dry — let reverb in Ableton do the rest
  // ─────────────────────────────────────────────────────────
  if (presence[4] > 0.1 && s16 === 4) {
    const chordBars = name === 'densita' ? 4 : 8;
    if (bar !== lastChordBar7 && bar % chordBars === 0) {
      lastChordBar7 = bar;
      const prog = CHORD_PROGS7[name];
      if (prog) {
        chordProgIdx7 = (chordProgIdx7 + 1) % prog.length;
        const chord = prog[chordProgIdx7];
        const vel = Math.round(50 + presence[4] * 30);
        const dur = Math.round(stepMs * 3); // short stab
        for (const note of chord) {
          sendMIDINote(4, note, Math.min(127, Math.round(vel * climaxVelBoost)), dur);
          addMidiNote(4, note / 127, vel / 127);
        }
        emit('chord_change', { root: chord[0], mode: currentMode });
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  //  CH5 VOICE — frammenti rari, quasi assenti
  //  Un ricordo melodico ogni 16-32 bar. Note lunghe.
  //  La techno non ha melodia — quando appare, è speciale.
  // ─────────────────────────────────────────────────────────
  if (presence[5] > 0.1 && s16 === 12) { // su beat 4 — inaspettato
    const voiceBars = name === 'densita' ? 16 : 32;
    if (bar !== lastVoiceBar7 && bar % voiceBars === 0 && Math.random() < 0.6) {
      lastVoiceBar7 = bar;
      const scale = MODES7[currentMode] || MODES7.G_dorian;
      // Registro melodico: G4(67)→G5(79) — sopra tutto il resto
      const hiPool = scale.filter(n => n >= 64 && n <= 74);
      if (hiPool.length > 0) {
        // Prefer Dorian 6th (E=64) and root (G=67) for that Berlin longing
        const weighted = [];
        for (const n of hiPool) {
          let w = 1.0;
          if (PIVOT_CLASSES7.has(n % 12)) w *= 3.0;
          if (n % 12 === 4) w *= 2.0; // E natural — Dorian 6th
          weighted.push({ n, w });
        }
        const total = weighted.reduce((s, e) => s + e.w, 0);
        let r = Math.random() * total;
        let chosen = weighted[0].n;
        for (const e of weighted) { r -= e.w; if (r <= 0) { chosen = e.n; break; } }

        const vel = Math.round(42 + presence[5] * 35);
        const dur = Math.round(barMs * 2); // note molto lunga — 2 bar
        sendMIDINote(5, chosen, vel, dur);
        addMidiNote(5, chosen / 127, vel / 127);
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  //  CH7 RIDE — solo in densita e climax
  //  Pattern di ride: nota fissa, 8th notes, velocity bassa
  //  Aggiunge brillantezza metallica sopra il groove
  // ─────────────────────────────────────────────────────────
  if (presence[6] > 0.1 && s16 % 2 === 0) { // ogni 8th note
    const scale = MODES7[currentMode] || MODES7.G_dorian;
    // Registro brillante: Bb5=82, C6=84 — ping metallico
    const note = 82; // Bb5 — fisso, come un vero ride
    const vel = Math.round(25 + presence[6] * 20 + humanize * (Math.random() - 0.5) * 6);
    const dur = Math.round(stepMs * 1.2);
    sendMIDINote(7, note, Math.min(127, Math.round(vel * climaxVelBoost)), dur);
    addMidiNote(7, note / 127, vel / 127);
  }
}

// ═══════════════════════════════════════════════════════════
//  STATE INJECTION
// ═══════════════════════════════════════════════════════════

function injectState() {
  const pm = getPresenceMultiplier('solco');
  // Intensity: always relatively high (techno = sustained energy)
  const activeCount = presence.filter(p => p > 0.15).length;
  state.intensity   = Math.min(1, 0.4 + arcProgress * 0.35 + activeCount * 0.05) * pm;
  // Rhythmicity: always high — this IS a rhythm engine
  state.rhythmicity = Math.min(1, 0.6 + presence[0] * 0.3 + presence[1] * 0.1) * pm;
  state.trajectory  = arcProgress > 0.7 ? -1 : arcProgress > 0.3 ? 0 : 1;
}

// ═══════════════════════════════════════════════════════════
//  MAIN UPDATE
// ═══════════════════════════════════════════════════════════

export function updateComposer7(dt) {
  updatePhase(dt);
  updatePresence(dt);
  updateClimax(dt);

  const bpm = CFG.COMPOSER7.bpm;
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
    const ac = presence.filter(p => p > 0.15).length;
    console.log(
      `[COMPOSER7] ${currentPhase()} bar ${Math.floor(lastStep / 16)} | ` +
      `K${presence[0].toFixed(1)} H${presence[1].toFixed(1)} ` +
      `D${presence[2].toFixed(1)} B${presence[3].toFixed(1)} ` +
      `C${presence[4].toFixed(1)} V${presence[5].toFixed(1)} ` +
      `R${presence[6].toFixed(1)} | climax: ${ruptureStage} | active: ${ac}/7`
    );
  }
}

// ═══════════════════════════════════════════════════════════
//  EXPORT STATUS
// ═══════════════════════════════════════════════════════════

export function getComposer7Status() {
  return {
    active: composer7Active,
    phase: currentPhase(),
    activeCount: presence.filter(p => p > 0.15).length,
    ruptureStage,
  };
}
