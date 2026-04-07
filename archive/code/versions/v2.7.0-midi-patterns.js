// ═══════════════════════════════════════════════════════════
//  MACH:INE II — MIDI Visual Mapping Patterns
//  v1.3: 8 canali canonici (CH0=PULSE CH1=GRAIN CH2=DRONE CH3=BASS
//        CH4=CHORDS CH5=VOICE CH6=LEAD CH7=RUPTURE)
// ═══════════════════════════════════════════════════════════

import { audio } from './audio.js';

// ── Per-role behavior options ──
// CH0 PULSE: percussivo, flash istantaneo (decay rapido, no bloom)
const PULSE_BEHAVIORS = [
  { zone: [0.50, 0.90], xMode: 'spread', shape: 'pulse', size: 0.16, decay: 0.78, color: 0 },
  { zone: [0.40, 1.00], xMode: 'spread', shape: 'pulse', size: 0.20, decay: 0.75, color: 0 },
  { zone: [0.30, 0.80], xMode: 'spread', shape: 'pulse', size: 0.14, decay: 0.80, color: 0 },
];

// CH1 GRAIN: scatter ritmico, colore steel (4)
const GRAIN_BEHAVIORS = [
  { zone: [0.00, 1.00], xMode: 'random', shape: 'scatter', size: 0.03, decay: 0.91, color: 4 },
  { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'scatter', size: 0.04, decay: 0.90, color: 4 },
];

// CH2 DRONE: scatter lentissimo, no color, fondo armonico
const DRONE_BEHAVIORS = [
  { zone: [0.00, 1.00], xMode: 'random', shape: 'scatter', size: 0.06, decay: 0.999, color: null },
  { zone: [0.10, 0.90], xMode: 'center', shape: 'scatter', size: 0.08, decay: 0.999, color: null },
];

// CH3 BASS: sostenuto, colonna verticale persistente, larghezza = velocity
const BASS_BEHAVIORS = [
  { zone: [0.10, 0.95], xMode: 'center', shape: 'column', size: 0.10, decay: 0.997, color: 1 },
  { zone: [0.20, 0.95], xMode: 'pitch',  shape: 'column', size: 0.12, decay: 0.996, color: 1 },
  { zone: [0.00, 1.00], xMode: 'center', shape: 'column', size: 0.08, decay: 0.998, color: 1 },
  { zone: [0.30, 0.90], xMode: 'pitch',  shape: 'column', size: 0.14, decay: 0.995, color: 1 },
];

// CH4 CHORDS: banda orizzontale, altezza = densità accordale
const CHORDS_BEHAVIORS = [
  { zone: [0.25, 0.75], xMode: 'pitch',  shape: 'band', size: 0.10, decay: 0.982, color: 2 },
  { zone: [0.20, 0.80], xMode: 'stereo', shape: 'band', size: 0.13, decay: 0.980, color: 2 },
  { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'band', size: 0.08, decay: 0.978, color: 2 },
  { zone: [0.10, 0.90], xMode: 'stereo', shape: 'band', size: 0.12, decay: 0.981, color: 2 },
];

// CH5 VOICE: melodico, trail pitch→Y, decay lento per leggere la melodia
const VOICE_BEHAVIORS = [
  { zone: [0.05, 0.55], xMode: 'pitch', shape: 'trail', size: 0.07, decay: 0.984, color: 3 },
  { zone: [0.10, 0.65], xMode: 'pitch', shape: 'trail', size: 0.06, decay: 0.982, color: 3 },
  { zone: [0.00, 0.50], xMode: 'pitch', shape: 'trail', size: 0.08, decay: 0.986, color: 3 },
  { zone: [0.05, 0.60], xMode: 'pitch', shape: 'trail', size: 0.05, decay: 0.980, color: 3 },
];

// CH6 LEAD: motivo pulse/trail, colore 3 (viola)
const LEAD_BEHAVIORS = [
  { zone: [0.10, 0.60], xMode: 'pitch', shape: 'pulse', size: 0.09, decay: 0.960, color: 3 },
  { zone: [0.15, 0.65], xMode: 'pitch', shape: 'trail', size: 0.07, decay: 0.970, color: 3 },
];

// CH7 RUPTURE: frammenti caotici magenta
const RUPTURE_BEHAVIORS = [
  { zone: [0.00, 1.00], xMode: 'random', shape: 'rupture', size: 0.18, decay: 0.88, color: 'C' },
  { zone: [0.10, 0.90], xMode: 'spread', shape: 'rupture', size: 0.22, decay: 0.85, color: 'C' },
];

const ALL_BEHAVIORS = [
  PULSE_BEHAVIORS,   // CH0
  GRAIN_BEHAVIORS,   // CH1
  DRONE_BEHAVIORS,   // CH2
  BASS_BEHAVIORS,    // CH3
  CHORDS_BEHAVIORS,  // CH4
  VOICE_BEHAVIORS,   // CH5
  LEAD_BEHAVIORS,    // CH6
  RUPTURE_BEHAVIORS, // CH7
];

// ── Engine-specific behaviors (fixed visual identity per engine) ──
// When an engine is active, its channels use a canonical behavior
// instead of the random pool. Channels not listed fall back to the pool.
const ENGINE_BEHAVIORS = {
  terreno: {
    0: { zone: [0.20, 0.80], xMode: 'center', shape: 'band',    size: 0.20, decay: 0.94,   color: 0 },
    1: { zone: [0.00, 1.00], xMode: 'random', shape: 'scatter', size: 0.06, decay: 0.97,   color: null },
    2: { zone: [0.00, 1.00], xMode: 'center', shape: 'scatter', size: 0.10, decay: 0.9999, color: null },
    3: { zone: [0.10, 0.90], xMode: 'center', shape: 'column',  size: 0.14, decay: 0.998,  color: 1 },
    4: { zone: [0.20, 0.80], xMode: 'pitch',  shape: 'band',    size: 0.13, decay: 0.990,  color: 2 },
    5: { zone: [0.05, 0.55], xMode: 'pitch',  shape: 'trail',   size: 0.08, decay: 0.988,  color: 3 },
    6: { zone: [0.05, 0.45], xMode: 'pitch',  shape: 'trail',   size: 0.06, decay: 0.985,  color: 3 },
  },
  meccanica: {
    0: { zone: [0.30, 0.90], xMode: 'spread', shape: 'pulse',   size: 0.16, decay: 0.82,  color: 0 },
    1: { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'scatter', size: 0.04, decay: 0.88,  color: 4 },
    4: { zone: [0.20, 0.80], xMode: 'stereo', shape: 'band',    size: 0.12, decay: 0.975, color: 2 },
    5: { zone: [0.10, 0.60], xMode: 'pitch',  shape: 'trail',   size: 0.07, decay: 0.978, color: 3 },
    6: { zone: [0.10, 0.60], xMode: 'pitch',  shape: 'pulse',   size: 0.09, decay: 0.95,  color: 3 },
  },
  deriva: {
    1: { zone: [0.00, 1.00], xMode: 'random', shape: 'scatter', size: 0.05, decay: 0.965,  color: null },
    2: { zone: [0.00, 1.00], xMode: 'center', shape: 'scatter', size: 0.10, decay: 0.9999, color: null },
    4: { zone: [0.20, 0.80], xMode: 'pitch',  shape: 'band',    size: 0.16, decay: 0.993,  color: 2 },
    5: { zone: [0.05, 0.55], xMode: 'pitch',  shape: 'trail',   size: 0.06, decay: 0.992,  color: 3 },
    6: { zone: [0.10, 0.60], xMode: 'pitch',  shape: 'trail',   size: 0.05, decay: 0.988,  color: 3 },
  },
  vortice: {
    0: { zone: [0.45, 0.55], xMode: 'spread', shape: 'column',  size: 0.30, decay: 0.68, color: 0 },   // kick: sharp vertical columns, hard flash
    1: { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'band',    size: 0.02, decay: 0.88, color: 4 },   // grain: thin horizontal lines, pitch-organized
    3: { zone: [0.60, 0.95], xMode: 'center', shape: 'column',  size: 0.22, decay: 0.85, color: 1 },   // bass: heavy bottom columns
    4: { zone: [0.15, 0.85], xMode: 'stereo', shape: 'band',    size: 0.08, decay: 0.97, color: 2 },   // chords: wide structured bands
    5: { zone: [0.00, 0.20], xMode: 'pitch',  shape: 'band',    size: 0.06, decay: 0.93, color: 3 },   // voice: thin band at top
    7: { zone: [0.00, 1.00], xMode: 'spread', shape: 'rupture', size: 0.28, decay: 0.75, color: 'C' }, // rupture: full field
  },
  cristallo: {
    0: { zone: [0.45, 0.55], xMode: 'center', shape: 'pulse',   size: 0.08, decay: 0.96,   color: null }, // barely visible pulse
    1: { zone: [0.00, 1.00], xMode: 'random', shape: 'scatter', size: 0.02, decay: 0.995,  color: null }, // tiny sparkles, very long
    2: { zone: [0.00, 1.00], xMode: 'center', shape: 'scatter', size: 0.12, decay: 0.9999, color: null }, // wide drone field
    3: { zone: [0.60, 1.00], xMode: 'center', shape: 'column',  size: 0.06, decay: 0.999,  color: null }, // sub-bass, barely visible
    4: { zone: [0.10, 0.90], xMode: 'pitch',  shape: 'band',    size: 0.15, decay: 0.996,  color: 2 },   // wide pad bands
    5: { zone: [0.00, 0.50], xMode: 'pitch',  shape: 'trail',   size: 0.04, decay: 0.996,  color: 3 },   // shimmer trails
  },
  abisso: {
    0: { zone: [0.70, 0.95], xMode: 'center', shape: 'pulse',   size: 0.10, decay: 0.94,   color: 0 },   // heartbeat — deep, bottom
    1: { zone: [0.50, 1.00], xMode: 'random', shape: 'scatter', size: 0.04, decay: 0.98,   color: null }, // sediment particles
    2: { zone: [0.30, 1.00], xMode: 'center', shape: 'scatter', size: 0.14, decay: 0.9999, color: null }, // omnipresent drone
    3: { zone: [0.60, 1.00], xMode: 'center', shape: 'column',  size: 0.20, decay: 0.998,  color: 1 },   // heavy bass column, bottom
    4: { zone: [0.30, 0.80], xMode: 'center', shape: 'band',    size: 0.18, decay: 0.9995, color: 2 },   // ritual pads — slow, centered, near-static
    5: { zone: [0.00, 0.30], xMode: 'pitch',  shape: 'trail',   size: 0.04, decay: 0.994,  color: 3 },   // distant voice, top
    6: { zone: [0.10, 0.40], xMode: 'pitch',  shape: 'trail',   size: 0.03, decay: 0.992,  color: 3 },   // echo, top
  },
  solco: {
    0: { zone: [0.40, 0.60], xMode: 'center', shape: 'band',    size: 0.25, decay: 0.90,   color: 0 },   // kick: 4/4, strong center band
    1: { zone: [0.25, 0.45], xMode: 'pitch',  shape: 'band',    size: 0.012,decay: 0.86,   color: 4 },   // hi-hat: thin scanning lines, fast decay
    2: { zone: [0.00, 1.00], xMode: 'center', shape: 'scatter', size: 0.10, decay: 0.9999, color: null }, // drone: sub, omnipresent
    3: { zone: [0.20, 0.90], xMode: 'center', shape: 'column',  size: 0.18, decay: 0.996,  color: 1 },   // bass: rolling columns
    4: { zone: [0.15, 0.85], xMode: 'stereo', shape: 'band',    size: 0.10, decay: 0.985,  color: 2 },   // chords: stab bands
    5: { zone: [0.05, 0.50], xMode: 'pitch',  shape: 'trail',   size: 0.05, decay: 0.990,  color: 3 },   // voice: rare amber fragment
    6: { zone: [0.00, 0.25], xMode: 'pitch',  shape: 'trail',   size: 0.04, decay: 0.988,  color: 3 },   // lead: echo at top
    7: { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'scatter', size: 0.02, decay: 0.94,   color: 4 },   // ride: fine metallic
  },
};

// ── Current state ──
let currentEngine = null;   // 'terreno' | 'meccanica' | 'deriva' | 'vortice' | 'cristallo' | 'abisso' | null
const channelMapping = [];
const channelChangeBar = [];

function pickBehavior(ch) {
  // If an engine is active and defines this channel, use its canonical behavior
  if (currentEngine && ENGINE_BEHAVIORS[currentEngine]?.[ch]) {
    return ENGINE_BEHAVIORS[currentEngine][ch];
  }
  const pool = ALL_BEHAVIORS[ch];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function initMidiPatterns() {
  for (let i = 0; i < 8; i++) {
    channelMapping[i] = pickBehavior(i);
    channelChangeBar[i] = 8 + Math.floor(Math.random() * 24);
  }
}

export function checkPatternChange(barNum, ch) {
  if (barNum >= channelChangeBar[ch]) {
    const old = channelMapping[ch];
    channelMapping[ch] = pickBehavior(ch);
    channelChangeBar[ch] = barNum + 12 + Math.floor(Math.random() * 20);
    return old !== channelMapping[ch];
  }
  return false;
}

export function setEngine(engineId) {
  currentEngine = engineId;  // 'terreno' | 'meccanica' | 'deriva' | null
  // Re-pick all channels with the new engine context
  for (let i = 0; i < 8; i++) {
    channelMapping[i] = pickBehavior(i);
  }
}

export function getEngine() {
  return currentEngine;
}

export function mutateChannel(ch) {
  channelMapping[ch] = pickBehavior(ch);
}

export function getChannelMapping(ch) {
  if (ch >= 8) return null;
  return channelMapping[ch];
}

export function getNotePosition(ch, noteNorm, velNorm) {
  if (ch >= 8) return null;
  const role = channelMapping[ch];
  if (!role) return null;

  const zoneH = role.zone[1] - role.zone[0];

  let y;
  if (role.shape === 'pulse' || role.xMode === 'center') {
    y = role.zone[0] + zoneH * 0.5;
  } else {
    y = role.zone[1] - noteNorm * zoneH;
  }

  let x;
  if (role.xMode === 'pitch') {
    x = 0.1 + noteNorm * 0.8;
  } else if (role.xMode === 'center') {
    x = 0.5 + (Math.random() - 0.5) * 0.08;
  } else if (role.xMode === 'spread') {
    // Distribuisce i pulse su 3 punti fissi separati per evitare il flash centrale
    const kickPos = [0.25, 0.5, 0.75];
    x = kickPos[Math.floor(Math.random() * kickPos.length)] + (Math.random() - 0.5) * 0.12;
  } else if (role.xMode === 'stereo') {
    x = 0.15 + noteNorm * 0.7;
  } else {
    x = Math.random();
  }

  // Radius audio-linked by channel role
  let radius;
  if (ch === 0) {
    // PULSE: size proporzionale a velocity
    radius = role.size * velNorm;
  } else if (ch === 1) {
    // GRAIN: energia high/air modula la dimensione
    const airEnergy = (audio.bands.air.L + audio.bands.air.R +
                       audio.bands.high.L + audio.bands.high.R) * 0.25;
    radius = role.size * (0.3 + airEnergy * 2.5 + velNorm * 0.3);
  } else if (ch === 2) {
    // DRONE: dimensione costante, modulata da sub
    const subEnergy = (audio.bands.sub.L + audio.bands.sub.R) * 0.5;
    radius = role.size * (0.5 + subEnergy * 0.8 + velNorm * 0.2);
  } else if (ch === 3) {
    // BASS: larghezza = velocity
    radius = role.size * (0.5 + velNorm * 0.5);
  } else if (ch === 4) {
    // CHORDS: altezza base, scalata con noteCount
    radius = role.size * (0.6 + velNorm * 0.4);
  } else if (ch === 7) {
    // RUPTURE: grande, velocity-driven
    radius = role.size * (0.5 + velNorm * 0.8);
  } else {
    radius = role.size * (0.6 + velNorm * 0.4);
  }

  return {
    x, y,
    radius: Math.max(0.01, radius),
    decay: role.decay,
    shape: role.shape,
    color: role.color,
    ch,
  };
}

initMidiPatterns();
