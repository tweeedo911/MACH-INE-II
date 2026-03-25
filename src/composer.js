// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Composer (TERRENO)
//  D Dorian · 72 BPM · dub profondo · groove organico
//  v3 — step sequencer 16th-note resolution
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { state } from './state.js';
import { sendMIDINote as _rawSend, sendMIDIAllNotesOff } from './midi.js';
import { setArcPhaseForced, releaseArcHold } from './director.js';
import { setComposerClimax } from './colors.js';
import { addMidiNote as _rawAddMidi, addOnsetWave } from './field.js';
import { setEngine } from './midi-patterns.js';
import { getPresenceMultiplier, isChannelAllowed, setEnginePhase } from './presence-multiplier.js';

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
//  SCALES  — D Dorian root D3=50
// ═══════════════════════════════════════════════════════════

const MODES = {
  D_dorian:   [38,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74],
  D_phrygian: [38,50,51,53,55,57,58,60,62,63,65,67,69,70,72,74],
  A_lydian:   [57,59,61,62,64,66,68,69,71,73,74,76,78,80,81],
  Eb_locrian: [63,64,66,68,69,71,73,75,76,78,80,81,83,85,87],
};

const PIVOT_PCS = new Set([2, 5, 9]); // D, F, A

// ═══════════════════════════════════════════════════════════
//  CHORD VOICINGS — open/shell voicings in D Dorian
//  Includes bass note (D2=38) + upper structure
//  Dorian color: natural B (6th) appears in voice leading
// ═══════════════════════════════════════════════════════════

const CHORD_PROGRESSIONS = {
  //           D2  +spread          voicing concept
  germoglio:    [[38,50,53,57]],                                                       // Dm open
  pulsazione:   [[38,50,53,57],[43,55,59,62],[41,53,57,60],[38,50,53,57]],             // Dm→G→F→Dm
  densita:      [[38,50,53,57],[41,53,57,60],[43,55,59,62],[45,57,60,64],              // Dm→F→G→Am
                 [41,53,57,60],[38,50,57,59]],                                         // F→Dsus2+6
  rottura:      null,
  dissoluzione: [[38,50,53,57],[43,55,59,62],[41,53,57,60],[38,50,53,57]],
};
let chordProgIdx = 0;

// ═══════════════════════════════════════════════════════════
//  KICK PATTERNS  (16 steps, 72 BPM → stepMs ≈ 208ms)
//  Dub/reggae philosophy: beat 1 is anchor, breath on 3
// ═══════════════════════════════════════════════════════════

const KICK_PATS = [
  [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],  // [0] single (germoglio)
  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],  // [1] 1+3 halftime
  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],  // [2] 1+3+"and of 4" (dub push)
  [1,0,0,0, 0,0,0,1, 1,0,0,0, 0,0,0,0],  // [3] 1+anticipation-3 (dub feel)
  [1,0,0,0, 0,0,0,1, 1,0,0,0, 0,1,0,0],  // [4] densita full dub
];

// Phase → kick index sequence. Changes staggered every 8 bars.
const KICK_FOR_PHASE = {
  germoglio:    [0, 0, 1],
  pulsazione:   [1, 1, 2, 3],
  densita:      [2, 3, 4, 3, 4],
  rottura:      [4, 4, 3],
  dissoluzione: [1, 1, 0],
};
let kickPat = KICK_PATS[0];
let kickVarIdx = 0;
let lastKickVarBar = -1;

// ═══════════════════════════════════════════════════════════
//  BASS PATTERNS
//  Notes encoded as semitone offsets from D2(38):
//  0=D2, 3=F2, 5=G2, 7=A2, 9=B2(Dorian!), 10=C3, 12=D3
//  { p: step triggers, n: note offset sequence, gate: sustain multiplier }
// ═══════════════════════════════════════════════════════════

const BASS_SEQS = [
  // 0: single root — very long, breathes (germoglio)
  { p:[1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], n:[0],       gate:14.0 },

  // 1: root + fifth on and-of-3 — classic reggae/dub
  { p:[1,0,0,0, 0,0,0,0, 0,0,7,0, 0,0,0,0], n:[0,7],     gate:9.0  },

  // 2: root + anticipation before beat 3 + root — dub syncopation
  { p:[1,0,0,0, 0,0,0,0, 0,1,0,0, 0,0,0,0], n:[0,5],     gate:4.0  },

  // 3: root + fifth + fourth + anticipation — melodic dub
  { p:[1,0,0,0, 0,0,0,1, 0,0,7,0, 0,0,12,0], n:[0,5,7,12], gate:2.5 },

  // 4: full groove — root→B2(6th Dorian)→G2→A2 push-pull
  { p:[1,0,0,0, 0,0,0,1, 0,0,9,0, 5,0,7,0], n:[0,9,5,7],  gate:1.8 },
];

const BASS_FOR_PHASE = {
  germoglio:    [0, 0],
  pulsazione:   [1, 2, 1],
  densita:      [3, 4, 3, 4],
  rottura:      [4, 3],
  dissoluzione: [1, 0],
};
let bassSeq = BASS_SEQS[0];
let bassNoteIdx = 0;
let bassVarIdx = 0;
let lastBassVarBar = -1;

// ═══════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════

export let composerActive = false;

let clock = 0;
let lastStep = -1;
let bar = 0;
let phase = 'germoglio';
let phaseIdx = 0;
let phaseClock = 0;
let lastChord = null;
let markovHistory = [null, null];
let motifIntervals = [];
const MOTIF_LEN = 4;
let presence = [0,0,0,0,0,0,0];
let ruptureStage = 'idle';
let ruptureProgress = 0;

// per-bar event guards
let lastChordBar = -2;
let lastVoiceBar = -2;
let lastDroneBar = -2;

// ═══════════════════════════════════════════════════════════
//  MARKOV VOICE  (unchanged — already good)
// ═══════════════════════════════════════════════════════════

function scaleNotes() {
  return MODES[CFG.COMPOSER.phases[phase]?.mode] || MODES.D_dorian;
}

function nextChord() {
  const prog = CHORD_PROGRESSIONS[phase];
  if (prog) {
    chordProgIdx = (chordProgIdx + 1) % prog.length;
    const notes = [...prog[chordProgIdx]];
    if (lastChord) {
      for (let i = 0; i < Math.min(notes.length, lastChord.length); i++) {
        const diff = notes[i] - lastChord[i];
        if (Math.abs(diff) > 7) notes[i] += diff > 0 ? -12 : 12;
      }
    }
    lastChord = notes;
    return notes;
  }
  // rottura: dissonant fragment from scale
  const scale = scaleNotes();
  const notes = [scale[0], scale[2], scale[4]];
  lastChord = notes;
  return notes;
}

function nextVoiceNote() {
  const scale = scaleNotes();
  const chord = lastChord || [];
  const pool = [];
  for (const n of scale) {
    const pc = n % 12;
    let w = 1.0;
    if (chord.some(c => c % 12 === pc)) w *= 3.0;
    if (PIVOT_PCS.has(pc)) w *= 1.5;
    if (markovHistory[1] !== null) {
      const diff = n - markovHistory[1];
      if (Math.abs(diff) <= 3) w *= 2.5;
      if (Math.abs(diff) > 7)  w *= 0.15;
      for (const mi of motifIntervals) {
        if (mi === diff) w *= 1.8;
        else if (Math.abs(mi - diff) === 1) w *= 1.3;
      }
    }
    pool.push({ n, w });
  }
  const total = pool.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  let chosen = pool[0].n;
  for (const e of pool) { r -= e.w; if (r <= 0) { chosen = e.n; break; } }
  if (markovHistory[1] !== null) {
    motifIntervals.push(chosen - markovHistory[1]);
    if (motifIntervals.length > MOTIF_LEN) motifIntervals.shift();
  }
  markovHistory[0] = markovHistory[1];
  markovHistory[1] = chosen;
  return chosen;
}

// ═══════════════════════════════════════════════════════════
//  PRESENCE MANAGER
// ═══════════════════════════════════════════════════════════

const PHASE_PRESENCE = {
  //             [KICK, BASS, HARM, VOICE, DRONE, GRAIN]
  germoglio:    [0.0, 0.3,  0.4,  0.2,  0.8,  0.0],
  pulsazione:   [0.8, 0.6,  0.5,  0.4,  0.6,  0.3],
  densita:      [0.9, 0.8,  0.8,  0.7,  0.5,  0.6],
  rottura:      [1.0, 0.9,  0.6,  0.0,  0.3,  0.8],
  dissoluzione: [0.2, 0.4,  0.5,  0.6,  0.9,  0.2],
};

function updatePresence(dt) {
  const targets = PHASE_PRESENCE[phase] || PHASE_PRESENCE.germoglio;
  for (let i = 0; i < 6; i++) {
    presence[i] += (targets[i] - presence[i]) * Math.min(1, dt * 0.8);
  }
  const active = presence.filter(p => p > 0.1).length;
  const silenceRatio = 1 - active / 7;
  if (silenceRatio < CFG.COMPOSER.minSilenceRatio) {
    const candidates = [0, 1, 2, 3, 5];
    const weakest = candidates.reduce((a, b) => presence[a] < presence[b] ? a : b);
    presence[weakest] = Math.max(0, presence[weakest] - dt * 2.0);
  }
}

// ═══════════════════════════════════════════════════════════
//  RUPTURE ENGINE
// ═══════════════════════════════════════════════════════════

function updateRupture(dt) {
  if (phase !== 'rottura') {
    if (ruptureStage !== 'idle') {
      ruptureStage = 'idle'; ruptureProgress = 0; setComposerClimax(false);
    }
    return;
  }
  ruptureProgress = Math.min(1, phaseClock / (CFG.COMPOSER.phases.rottura?.duration || 120));
  const prev = ruptureStage;
  if      (ruptureProgress < 0.15) ruptureStage = 'idle';
  else if (ruptureProgress < 0.40) ruptureStage = 'presagio';
  else if (ruptureProgress < 0.70) ruptureStage = 'infiltrazione';
  else if (ruptureProgress < 0.90) ruptureStage = 'takeover';
  else                              ruptureStage = 'residuo';
  if (ruptureStage !== prev) setComposerClimax(ruptureStage === 'takeover');
}

// ═══════════════════════════════════════════════════════════
//  PHASE ENGINE
// ═══════════════════════════════════════════════════════════

function updatePhase(dt) {
  phaseClock += dt;
  const d = CFG.COMPOSER.phases[phase];
  if (d && phaseClock >= d.duration) {
    phaseClock = 0;
    phaseIdx = (phaseIdx + 1) % CFG.COMPOSER.phaseOrder.length;
    phase = CFG.COMPOSER.phaseOrder[phaseIdx];
    setEnginePhase('terreno', phase, ruptureStage);
    lastChord = null;
    chordProgIdx = 0;
    motifIntervals = [];
    kickVarIdx = 0;
    bassVarIdx = 0;
    bassNoteIdx = 0;
    console.log(`[COMPOSER] → ${phase}`);
  }
  setArcPhaseForced(CFG.COMPOSER.phases[phase]?.arc);
}

// ═══════════════════════════════════════════════════════════
//  STATE INJECTION
// ═══════════════════════════════════════════════════════════

function injectState() {
  const pm = getPresenceMultiplier('terreno');
  const weights = [1.2, 1.0, 0.8, 0.7, 0.4, 0.9, 1.5];
  let wSum = 0, wTotal = 0;
  for (let i = 0; i < 7; i++) { wSum += presence[i] * weights[i]; wTotal += weights[i]; }
  state.intensity   = Math.min(1, wSum / wTotal) * pm;
  state.rhythmicity = Math.min(1, (presence[0] * 1.5 + presence[5]) * 0.7) * pm;
  if (phase === 'densita')           state.trajectory =  1;
  else if (phase === 'dissoluzione') state.trajectory = -1;
  else                               state.trajectory =  0;
}

// ═══════════════════════════════════════════════════════════
//  STEP SEQUENCER — 16th note @ 72 BPM (stepMs ≈ 208ms)
// ═══════════════════════════════════════════════════════════

function onStep(step) {
  const bpm    = CFG.COMPOSER.bpm;
  const stepMs = (60 / bpm / 4) * 1000;   // ~208ms
  const barMs  = stepMs * 16;
  const s16    = step % 16;
  bar          = Math.floor(step / 16);
  const rc     = ruptureStage === 'takeover'     ? 0.8
               : ruptureStage === 'infiltrazione' ? 0.4
               : ruptureStage === 'presagio'      ? 0.15 : 0;

  // ── Staggered pattern rotation ──
  if (bar !== lastKickVarBar && bar % 8 === 0) {
    lastKickVarBar = bar;
    const pool = KICK_FOR_PHASE[phase] || [1];
    kickVarIdx = (kickVarIdx + 1) % pool.length;
    kickPat = KICK_PATS[pool[kickVarIdx]];
  }
  if (bar !== lastBassVarBar && bar % 12 === 0) {
    lastBassVarBar = bar;
    const pool = BASS_FOR_PHASE[phase] || [1];
    bassVarIdx = (bassVarIdx + 1) % pool.length;
    bassSeq = BASS_SEQS[pool[bassVarIdx]];
    bassNoteIdx = 0;
  }

  // ─────────────────────────────────────────────────────────
  //  CH0 PULSE — kick dub
  // ─────────────────────────────────────────────────────────
  if (presence[0] > 0.1 && kickPat[s16]) {
    const isDown = s16 === 0;
    const vel = isDown
      ? Math.round(95 + presence[0] * 25)
      : Math.round(70 + presence[0] * 28 + (Math.random() - 0.5) * 10);
    sendMIDINote(0, 36, vel, 55);
    addMidiNote(0, 0.5, vel / 127);
    if (isDown) addOnsetWave(0.5, 0.5, 1, 1);
  }

  // ─────────────────────────────────────────────────────────
  //  CH3 BASS — dub melodic con sincope
  //  Note offsets: 0=D2, 3=F2, 5=G2, 7=A2, 9=B2(Dorian6), 10=C3, 12=D3
  // ─────────────────────────────────────────────────────────
  if (presence[1] > 0.1 && phase !== 'rottura' && bassSeq.p[s16]) {
    const offsets = [0, 3, 5, 7, 9, 10, 12];
    const noteOff = bassSeq.n[bassNoteIdx % bassSeq.n.length];
    bassNoteIdx++;
    const bassNote = 38 + (offsets[noteOff] !== undefined ? offsets[noteOff] : noteOff);
    const isDown = s16 === 0;
    const vel = isDown
      ? Math.round(85 + presence[1] * 28)
      : Math.round(68 + presence[1] * 25 + (Math.random() - 0.5) * 8);
    // Sustain: downbeat holds long, syncopations shorter (Ableton's instrument will shape it)
    const dur = isDown
      ? Math.round(stepMs * bassSeq.gate)
      : Math.round(stepMs * Math.max(1.5, bassSeq.gate * 0.35));
    sendMIDINote(3, Math.min(127, bassNote), vel, dur);
    addMidiNote(3, bassNote / 127, vel / 127);
  }

  // ─────────────────────────────────────────────────────────
  //  CH4 CHORDS — ogni N bar su step 0, sustained
  // ─────────────────────────────────────────────────────────
  if (presence[2] > 0.1 && s16 === 0) {
    const chordBars = { germoglio:1, pulsazione:2, densita:4, dissoluzione:2 }[phase] || 2;
    if (bar !== lastChordBar && bar % chordBars === 0) {
      lastChordBar = bar;
      const chord = nextChord();
      const vel = Math.round(35 + presence[2] * 28);
      const dur = Math.round(barMs * chordBars * 0.94);
      for (const note of chord) {
        sendMIDINote(4, note, vel, dur);
        addMidiNote(4, note / 127, vel / 127);
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  //  CH5 VOICE — frase Markov ogni 2-4 bar, sul beat 2 (step 4)
  //  Note lunghe: 1.5–3 beat. Il silenzio intorno è essenziale.
  // ─────────────────────────────────────────────────────────
  if (presence[3] > 0.1 && s16 === 4) {
    const voiceBars = phase === 'densita' ? 2 : phase === 'pulsazione' ? 3 : 4;
    if (bar !== lastVoiceBar && bar % voiceBars === 0 && Math.random() < 0.78) {
      lastVoiceBar = bar;
      // Genera frase di 2-3 note brevi (gocce melodiche, non linea continua)
      const noteCount = phase === 'densita' ? 2 + Math.floor(Math.random() * 2) : 1;
      for (let ni = 0; ni < noteCount; ni++) {
        const raw = nextVoiceNote();
        // Mantieni la voce nel registro melodico (D4=62 → D5=74)
        let note = raw;
        while (note < 62) note += 12;
        while (note > 74) note -= 12;
        const vel = Math.round(50 + presence[3] * 42 + (Math.random() - 0.5) * 10);
        const durBeats = 1.8 + Math.random() * 1.4;
        const dur = Math.round(stepMs * 4 * durBeats);
        // Spacing tra note della frase
        const delay = ni * Math.round(stepMs * (4 + Math.random() * 4));
        setTimeout(() => {
          if (!composerActive) return;
          sendMIDINote(5, Math.max(36, Math.min(96, note)), Math.max(30, Math.min(127, vel)), dur);
          addMidiNote(5, note / 127, vel / 127);
        }, delay);
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  //  CH2 DRONE — ogni 8 bar, root+quinta, lunghissimo
  // ─────────────────────────────────────────────────────────
  if (presence[4] > 0.1 && s16 === 0 && bar !== lastDroneBar && bar % 8 === 0) {
    lastDroneBar = bar;
    const drone = CFG.COMPOSER.phases[phase]?.drone ?? 50;
    const vel = Math.round(32 + presence[4] * 28);
    const dur = Math.round(barMs * 7.5);
    sendMIDINote(2, drone, vel, dur);
    sendMIDINote(2, drone + 7, Math.round(vel * 0.65), dur);
    addMidiNote(2, drone / 127, vel / 127);
  }

  // ─────────────────────────────────────────────────────────
  //  CH1 GRAIN — texture alta, atmosferica, sparsa
  //  Evita i beat forti: spara tra i kick (step 2, 6, 10, 14)
  // ─────────────────────────────────────────────────────────
  if (presence[5] > 0.1) {
    const onGrainStep = [2, 6, 10, 14].includes(s16);
    if (onGrainStep && Math.random() < presence[5] * 0.55) {
      const scale = scaleNotes();
      // Registro alto: da A4(69) a D6(86) — non compete col basso
      const hi = scale.filter(n => n >= 69 && n <= 86);
      const pool = hi.length > 0 ? hi : scale;
      const note = pool[Math.floor(Math.random() * pool.length)];
      const vel = Math.round(20 + Math.random() * 32);
      const dur = Math.round(30 + Math.random() * 90);
      sendMIDINote(1, note, vel, dur);
      addMidiNote(1, note / 127, vel / 127);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  CLIMAX HARD CUT — takeover finale → silenzio
  // ─────────────────────────────────────────────────────────
  if (ruptureStage === 'takeover' && ruptureProgress > 0.78) {
    sendMIDIAllNotesOff();
    for (let i = 0; i < presence.length; i++) {
      if (i !== 4) presence[i] = 0; // keep drone
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════

export function initComposer() {
  clock = 0; lastStep = -1; bar = 0;
  phase = CFG.COMPOSER.phaseOrder[0]; phaseIdx = 0; phaseClock = 0;
  setEnginePhase('terreno', phase);
  lastChord = null; markovHistory = [null, null]; motifIntervals = []; chordProgIdx = 0;
  presence = [0,0,0,0,0,0,0];
  ruptureStage = 'idle'; ruptureProgress = 0;
  kickPat = KICK_PATS[0]; kickVarIdx = 0; lastKickVarBar = -1;
  bassSeq = BASS_SEQS[0]; bassNoteIdx = 0; bassVarIdx = 0; lastBassVarBar = -1;
  lastChordBar = -2; lastVoiceBar = -2; lastDroneBar = -2;
}

export function updateComposer(dt) {
  updatePhase(dt);
  updatePresence(dt);
  updateRupture(dt);

  const bpm = CFG.COMPOSER.bpm;
  const stepsPerSec = bpm * 4 / 60;
  clock += dt * stepsPerSec;
  const currentStep = Math.floor(clock);
  if (currentStep > lastStep) {
    for (let s = lastStep + 1; s <= currentStep; s++) onStep(s);
    lastStep = currentStep;
  }

  // Residuo presence fade (needs dt — must be here, not in onStep)
  if (ruptureStage === 'residuo') {
    for (let i = 0; i < presence.length; i++) {
      if (i !== 4) presence[i] = Math.max(0, presence[i] - dt * 2.0);
      else presence[i] = Math.max(0.1, presence[i] - dt * 0.3);
    }
  }

  injectState();
}

export function toggleComposer() {
  composerActive = !composerActive;
  if (composerActive) {
    initComposer();
    setEngine('terreno');
    console.log('[COMPOSER] ON — D Dorian TERRENO 72bpm (16th-step)');
  } else {
    sendMIDIAllNotesOff();
    setComposerClimax(false);
    releaseArcHold();
    setEngine(null);
    console.log('[COMPOSER] OFF');
  }
}

export function getComposerStatus() {
  return { active: composerActive, phase, ruptureStage };
}
