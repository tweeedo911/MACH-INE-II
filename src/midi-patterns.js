// ═══════════════════════════════════════════════════════════
//  MACH:INE II — MIDI Visual Mapping Patterns
//  v1.2: shapes linked to sound character
// ═══════════════════════════════════════════════════════════

import { audio } from './audio.js';

// ── Per-role behavior options ──
// KICK: percussivo, flash istantaneo (decay rapido, no bloom)
const KICK_BEHAVIORS = [
  { zone: [0.50, 0.90], xMode: 'spread', shape: 'pulse', size: 0.16, decay: 0.78, color: 0 },
  { zone: [0.40, 1.00], xMode: 'spread', shape: 'pulse', size: 0.20, decay: 0.75, color: 0 },
  { zone: [0.30, 0.80], xMode: 'spread', shape: 'pulse', size: 0.14, decay: 0.80, color: 0 },
];

// BASS: sostenuto, colonna verticale persistente, larghezza = velocity
const BASS_BEHAVIORS = [
  { zone: [0.10, 0.95], xMode: 'center', shape: 'column', size: 0.10, decay: 0.997, color: 1 },
  { zone: [0.20, 0.95], xMode: 'pitch',  shape: 'column', size: 0.12, decay: 0.996, color: 1 },
  { zone: [0.00, 1.00], xMode: 'center', shape: 'column', size: 0.08, decay: 0.998, color: 1 },
  { zone: [0.30, 0.90], xMode: 'pitch',  shape: 'column', size: 0.14, decay: 0.995, color: 1 },
];

// HARMONY: banda orizzontale, altezza = densità accordale
const HARMONY_BEHAVIORS = [
  { zone: [0.25, 0.75], xMode: 'pitch',  shape: 'band', size: 0.10, decay: 0.982, color: 2 },
  { zone: [0.20, 0.80], xMode: 'stereo', shape: 'band', size: 0.13, decay: 0.980, color: 2 },
  { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'band', size: 0.08, decay: 0.978, color: 2 },
  { zone: [0.10, 0.90], xMode: 'stereo', shape: 'band', size: 0.12, decay: 0.981, color: 2 },
];

// LEAD: melodico, trail pitch→Y, time→X, decay lento per leggere la melodia
const LEAD_BEHAVIORS = [
  { zone: [0.05, 0.55], xMode: 'pitch', shape: 'trail', size: 0.07, decay: 0.984, color: 3 },
  { zone: [0.10, 0.65], xMode: 'pitch', shape: 'trail', size: 0.06, decay: 0.982, color: 3 },
  { zone: [0.00, 0.50], xMode: 'pitch', shape: 'trail', size: 0.08, decay: 0.986, color: 3 },
  { zone: [0.05, 0.60], xMode: 'pitch', shape: 'trail', size: 0.05, decay: 0.980, color: 3 },
];

// CH4 DRONE — T1 FIELD: scatter lentissimo, no color, fondo armonico
const DRONE_BEHAVIORS = [
  { zone: [0.00, 1.00], xMode: 'random', shape: 'scatter', size: 0.06, decay: 0.999, color: null },
  { zone: [0.10, 0.90], xMode: 'center', shape: 'scatter', size: 0.08, decay: 0.999, color: null },
];

// CH5 GRAIN — T3 GRAIN: scatter ritmico, colore steel (4)
const GRAIN_BEHAVIORS = [
  { zone: [0.00, 1.00], xMode: 'random', shape: 'scatter', size: 0.03, decay: 0.91, color: 4 },
  { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'scatter', size: 0.04, decay: 0.90, color: 4 },
];

// CH6 RUPTURE — T7 RUPTURE: frammenti caotici magenta
const RUPTURE_BEHAVIORS = [
  { zone: [0.00, 1.00], xMode: 'random', shape: 'rupture', size: 0.18, decay: 0.88, color: 'C' },
  { zone: [0.10, 0.90], xMode: 'spread', shape: 'rupture', size: 0.22, decay: 0.85, color: 'C' },
];

const ALL_BEHAVIORS = [
  KICK_BEHAVIORS, BASS_BEHAVIORS, HARMONY_BEHAVIORS, LEAD_BEHAVIORS,
  DRONE_BEHAVIORS, GRAIN_BEHAVIORS, RUPTURE_BEHAVIORS,
];

// ── Current state ──
const channelMapping = [];
const channelChangeBar = [];

function pickBehavior(ch) {
  const pool = ALL_BEHAVIORS[ch];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function initMidiPatterns() {
  for (let i = 0; i < 7; i++) {
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

export function mutateChannel(ch) {
  channelMapping[ch] = pickBehavior(ch);
}

export function getChannelMapping(ch) {
  if (ch >= 7) return null;
  return channelMapping[ch];
}

export function getNotePosition(ch, noteNorm, velNorm) {
  if (ch >= 7) return null;
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
    // Distribuisce i kick su 3 punti fissi separati per evitare il flash centrale
    const kickPos = [0.25, 0.5, 0.75];
    x = kickPos[Math.floor(Math.random() * kickPos.length)] + (Math.random() - 0.5) * 0.12;
  } else if (role.xMode === 'stereo') {
    x = 0.15 + noteNorm * 0.7;
  } else {
    x = Math.random();
  }

  // Radius audio-linked by channel type
  let radius;
  if (ch === 0) {
    // KICK: size proporzionale a velocity, niente padding fisso
    radius = role.size * velNorm;
  } else if (ch === 1) {
    // BASS: larghezza = velocity, il render usa questo come hw
    radius = role.size * (0.5 + velNorm * 0.5);
  } else if (ch === 2) {
    // HARMONY: altezza base, viene scalata in addMidiNote con noteCount
    radius = role.size * (0.6 + velNorm * 0.4);
  } else if (ch === 4) {
    // DRONE: dimensione costante, leggermente modulata da energia sub
    const subEnergy = (audio.bands.sub.L + audio.bands.sub.R) * 0.5;
    radius = role.size * (0.5 + subEnergy * 0.8 + velNorm * 0.2);
  } else if (ch === 5) {
    // GRAIN: energia high/air modula la dimensione
    const airEnergy = (audio.bands.air.L + audio.bands.air.R +
                       audio.bands.high.L + audio.bands.high.R) * 0.25;
    radius = role.size * (0.3 + airEnergy * 2.5 + velNorm * 0.3);
  } else if (ch === 6) {
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
