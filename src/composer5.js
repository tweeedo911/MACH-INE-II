// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Composer 5 (CRISTALLO)
//  E Lydian · 54 BPM · ambient cristallino · shimmer arpeggios
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

// ── Presence-scaled MIDI output (with channel priority) ──
function sendMIDINote(ch, note, vel, dur) {
  const pm = getPresenceMultiplier('cristallo');
  if (pm < 0.05) return;
  if (!isChannelAllowed('cristallo', ch)) return;
  _rawSend(ch, note, Math.max(1, Math.round(vel * pm)), dur);
}
function addMidiNote(ch, x, intensity) {
  _rawAddMidi(ch, x, intensity * getPresenceMultiplier('cristallo'));
}

// ── Scale modes E (nota MIDI: E3 = 52) ──
const MODES5 = {
  E_lydian:  [52,54,56,58,59,61,63, 64,66,68,70,71,73,75, 76,78,80,82,83,85,87],
  F_locrian: [53,54,56,58,59,61,63, 65,66,68,70,71,73,75, 77,78,80,82,83,85,87],
};

// Pivot pitch classes: E=4, G#=8, B=11
const PIVOT_CLASSES5 = new Set([4, 8, 11]);

// Presenza target [chords, voice, grain, pulse] per fase
const PHASE_PRESENCE5 = {
  germoglio:    [0.3, 0.0, 0.0, 0.0],
  pulsazione:   [0.6, 0.4, 0.1, 0.1],
  densita:      [0.9, 0.8, 0.5, 0.3],
  rottura:      [0.2, 0.0, 0.9, 0.0],
  dissoluzione: [0.4, 0.2, 0.0, 0.0],
};

// ── Stato modulo ──
export let composer5Active = false;

let phaseIndex = 0;
let phaseTime = 0;
let arcProgress = 0;
let clock = 0;
let lastBeat = -1;

let currentMode = 'E_lydian';
let currentDrone = 52;

let ruptureStage = 'idle';
let lastRuptureStage = 'idle';

const presence = [0, 0, 0, 0];
let lastChord = [64, 68, 71]; // E G# B initial
let shimmerTimer = 0;
let chordBarCount = 0;
let debugTimer = 0;

// ── Inizializzazione ──
export function initComposer5() {
  phaseIndex = 0;
  phaseTime = 0;
  arcProgress = 0;
  clock = 0;
  lastBeat = -1;
  ruptureStage = 'idle';
  lastRuptureStage = 'idle';
  presence.fill(0);
  currentMode = 'E_lydian';
  currentDrone = 52;
  lastChord = [64, 68, 71];
  shimmerTimer = 0;
  chordBarCount = 0;
}

// ── Toggle ──
export function toggleComposer5() {
  composer5Active = !composer5Active;
  if (composer5Active) {
    initComposer5();
    setEngine('cristallo');
    console.log('[COMPOSER5] ON — E Lydian CRISTALLO 54bpm');
  } else {
    sendMIDIAllNotesOff();
    setComposerClimax(false);
    releaseArcHold();
    setEngine(null);
    console.log('[COMPOSER5] OFF');
  }
}

// ── Phase system ──
function currentPhase() {
  return CFG.COMPOSER5.phaseOrder[phaseIndex];
}

function updatePhase(dt) {
  phaseTime += dt;
  const name = currentPhase();
  const cfg = CFG.COMPOSER5.phases[name];
  arcProgress = Math.min(1, phaseTime / cfg.duration);
  currentMode = cfg.mode;
  currentDrone = cfg.drone;
  setArcPhaseForced(cfg.arc);
  if (phaseTime >= cfg.duration) {
    phaseIndex = (phaseIndex + 1) % CFG.COMPOSER5.phaseOrder.length;
    phaseTime = 0;
    arcProgress = 0;
    chordBarCount = 0;
    console.log(`[COMPOSER5] → ${currentPhase()}`);
  }
}

// ── VoidManager — glaciale ──
function updatePresence(dt) {
  const target = PHASE_PRESENCE5[currentPhase()] || [0.4, 0.3, 0.1, 0.0];
  const silTarget = CFG.COMPOSER5.silenceTarget[currentPhase()] || 0.5;
  for (let i = 0; i < 4; i++) {
    presence[i] += (target[i] - presence[i]) * dt * 0.15; // very slow lerp
  }
  const activeCount = presence.filter(p => p > 0.3).length;
  const voidRatio = 1 - activeCount / 4;
  if (voidRatio < silTarget) {
    let minIdx = 0;
    for (let i = 1; i < 4; i++) { if (presence[i] < presence[minIdx]) minIdx = i; }
    presence[minIdx] *= 0.9;
  }
  if (voidRatio > silTarget + 0.20) {
    let minIdx = 0;
    for (let i = 1; i < 4; i++) { if (presence[i] < presence[minIdx]) minIdx = i; }
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
  const R = CFG.COMPOSER5.rupture;
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

// ── Chord builder con voice leading ──
function buildChord(mode) {
  const scale = MODES5[mode];
  const maxLeap = CFG.COMPOSER5.voiceLeadingMax * 2;
  const newChord = lastChord.map(note => {
    const candidates = scale.filter(n => Math.abs(n - note) <= maxLeap);
    if (candidates.length === 0) {
      return scale.reduce((best, n) => Math.abs(n - note) < Math.abs(best - note) ? n : best);
    }
    const pivot = candidates.filter(n => PIVOT_CLASSES5.has(n % 12));
    if (pivot.length > 0 && Math.random() < 0.5) {
      return pivot[Math.floor(Math.random() * pivot.length)];
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  });
  lastChord = newChord;
  return newChord;
}

// Shimmer pattern types for variety
const SHIMMER_PATTERNS = ['up', 'down', 'suspend', 'scatter'];
let shimmerPatIdx = 0;

// ── Shimmer: variable arpeggio patterns from chord in high register ──
function updateShimmer(dt) {
  if (presence[1] < 0.15) return;
  const interval = CFG.COMPOSER5.shimmerInterval || 3;
  shimmerTimer += dt;
  if (shimmerTimer < interval) return;
  shimmerTimer = 0;

  const bpm = CFG.COMPOSER5.bpm;
  const beatMs = (60 / bpm) * 1000;
  const sustain = CFG.COMPOSER5.sustainMultiplier || 4.0;

  // Shift chord tones to high register
  const notes = lastChord.map(n => {
    let note = n;
    while (note < 72) note += 12;
    return Math.min(note, 96);
  });

  // Rotate shimmer pattern for variety
  const pattern = SHIMMER_PATTERNS[shimmerPatIdx % SHIMMER_PATTERNS.length];
  shimmerPatIdx++;

  let ordered;
  switch (pattern) {
    case 'down':    ordered = [...notes].reverse(); break;
    case 'suspend': ordered = [notes[0], notes[notes.length - 1]]; break; // root + top only
    case 'scatter': ordered = [...notes].sort(() => Math.random() - 0.5); break;
    default:        ordered = notes; break; // 'up'
  }

  ordered.forEach((note, i) => {
    setTimeout(() => {
      if (!composer5Active) return;
      const vel = Math.floor(32 + presence[1] * 28);
      // Suspend pattern: much longer sustain
      const durMul = pattern === 'suspend' ? sustain * 4 : sustain * 2;
      sendMIDINote(5, note, vel, beatMs * durMul);
      addMidiNote(5, note / 127, vel / 127);
    }, i * Math.round(beatMs * (pattern === 'scatter' ? 0.5 : 0.8)));
  });
}

// ── Beat-triggered notes ──
function onBeat(beat) {
  const bpm     = CFG.COMPOSER5.bpm;
  const beatMs  = (60 / bpm) * 1000;
  const name    = currentPhase();
  const barBeat = beat % 4;
  const bar     = Math.floor(beat / 4);
  const sustain = CFG.COMPOSER5.sustainMultiplier || 4.0;
  const rc      = ruptureStage === 'takeover'     ? 0.8 :
                  ruptureStage === 'infiltrazione' ? 0.4 :
                  ruptureStage === 'presagio'      ? 0.15 : 0;

  // CH4 CHORDS — long sustained pads
  if (presence[0] > 0.3 && barBeat === 0) {
    const chordRhythm = CFG.COMPOSER5.chordRhythm[name] || 0;
    if (chordRhythm > 0) {
      chordBarCount++;
      if (chordBarCount >= chordRhythm) {
        chordBarCount = 0;
        const progs = CFG.COMPOSER5.chordProgressions[name];
        let chord;
        if (progs) {
          chord = progs[bar % progs.length];
          lastChord = chord;
        } else {
          chord = buildChord(currentMode);
        }
        const vel = Math.floor(40 + presence[0] * 35);
        for (const note of chord) {
          sendMIDINote(4, note, vel, beatMs * sustain * 6);
          addMidiNote(4, note / 127, vel / 127);
        }
        emit('chord_change', { root: chord[0], mode: currentMode });
      }
    }
  }

  // CH0 PULSE — minimal, every 8 beats (barely perceptible)
  if (presence[3] > 0.2 && beat % 8 === 0) {
    const vel = Math.floor(30 + presence[3] * 25);
    sendMIDINote(0, currentDrone - 12, vel, beatMs * 0.5);
    addMidiNote(0, (currentDrone - 12) / 127, vel / 127);
  }

  // CH3 BASS — sub-drone, very long sustain, every 16 beats
  if (beat % 16 === 0 && name !== 'rottura') {
    const vel = Math.floor(35 + arcProgress * 20);
    sendMIDINote(3, currentDrone - 24, vel, beatMs * sustain * 12);
    addMidiNote(3, (currentDrone - 24) / 127, vel / 127);
  }

  // CH2 DRONE — ever-present, every 24 beats
  if (beat % 24 === 0 && name !== 'rottura') {
    const vel = Math.floor(28 + arcProgress * 18);
    sendMIDINote(2, currentDrone, vel, beatMs * sustain * 20);
    addMidiNote(2, currentDrone / 127, vel / 127);
  }

  // CH1 GRAIN — constant micro-sparkles, high register (Promises-style shimmer)
  if (presence[2] > 0.15 && beat % 2 === 0) {
    // Higher probability, more frequent = constant crystalline texture
    if (Math.random() < 0.3 + presence[2] * 0.5) {
      const scale = MODES5[currentMode];
      const hi   = scale.filter(n => n >= 77 && n <= 93);
      const pool = hi.length > 0 ? hi : scale;
      const note = pool[Math.floor(Math.random() * pool.length)];
      const vel  = Math.floor(20 + presence[2] * 28);
      sendMIDINote(1, note, vel, beatMs * sustain * 1.5);
      addMidiNote(1, note / 127, vel / 127);
      // Occasional double sparkle
      if (Math.random() < 0.3) {
        const note2 = pool[Math.floor(Math.random() * pool.length)];
        setTimeout(() => {
          if (!composer5Active) return;
          sendMIDINote(1, note2, Math.floor(vel * 0.7), beatMs * sustain);
          addMidiNote(1, note2 / 127, (vel * 0.7) / 127);
        }, Math.round(beatMs * 0.3));
      }
    }
  }

  // CH7 RUPTURE — cluster crash (crystal shattering)
  if (ruptureStage !== 'idle' && ruptureStage !== 'residuo') {
    if (ruptureStage === 'takeover' && beat % 2 === 0) {
      // Cluster: fire many notes simultaneously
      const scale = MODES5['F_locrian'];
      const count = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const note = scale[Math.floor(Math.random() * scale.length)];
        const vel  = Math.floor(70 + rc * 50);
        sendMIDINote(7, note, vel, beatMs * 0.4);
        addMidiNote(7, note / 127, vel / 127);
      }
    } else if (beat % 8 === 0) {
      const scale = MODES5['F_locrian'];
      const note  = scale[Math.floor(Math.random() * scale.length)];
      const vel   = Math.floor(45 + rc * 40);
      sendMIDINote(7, note, vel, beatMs * 0.6);
      addMidiNote(7, note / 127, vel / 127);
    }
  }
}

// ── State injection ──
function injectState() {
  const pm = getPresenceMultiplier('cristallo');
  const activeCount = presence.filter(p => p > 0.3).length;
  state.intensity   = Math.min(1, 0.1 + arcProgress * 0.4 + activeCount * 0.08) * pm;
  state.rhythmicity = Math.min(1, presence[3] * 0.5 + presence[2] * 0.2) * pm;
  state.trajectory  = arcProgress > 0.7 ? -1 : arcProgress > 0.3 ? 0 : 1;
}

// ═══════════════════════════════════════════════════════════
//  MAIN UPDATE
// ═══════════════════════════════════════════════════════════

export function updateComposer5(dt) {
  updatePhase(dt);
  updatePresence(dt);
  updateRupture();
  updateShimmer(dt);

  const bpm = CFG.COMPOSER5.bpm;
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
      `[COMPOSER5] ${currentPhase()} | ` +
      `C${presence[0].toFixed(1)} V${presence[1].toFixed(1)} ` +
      `G${presence[2].toFixed(1)} P${presence[3].toFixed(1)} ` +
      `| rupture: ${ruptureStage} | active: ${ac}/4`
    );
  }
}

// ── Export status per HUD ──
export function getComposer5Status() {
  return {
    active: composer5Active,
    phase: currentPhase(),
    activeCount: presence.filter(p => p > 0.3).length,
    ruptureStage,
  };
}
