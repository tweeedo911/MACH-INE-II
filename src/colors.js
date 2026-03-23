// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Chromatic System + Dynamic Palette
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';

// ── Base color constants (defaults) ──
export const COLOR_A = [255, 68, 0];
export const COLOR_B = [0, 170, 204];
export const COLOR_C = [230, 0, 126];

// ── Per-role MIDI colors ──
export const MIDI_COLORS = [
  [255, 140, 20],   // KICK  — amber
  [200, 30, 30],    // BASS  — deep red
  [0, 180, 210],    // HARMONY — cyan
  [160, 60, 220],   // LEAD  — violet
  [180, 200, 220],  // TEXTURE — steel
];

// ── Dynamic palette (mutated by director) ──
export const PALETTES = {
  default:    { bg: [0,0,0],     fg: [255,255,255], accent1: [255,68,0],   accent2: [0,170,204],   accent3: [230,0,126] },
  amber:      { bg: [90,38,0],   fg: [255,220,160], accent1: [255,160,40], accent2: [200,120,20],   accent3: [255,100,0] },
  cyan:       { bg: [0,50,65],   fg: [180,230,240], accent1: [0,200,220],  accent2: [40,160,180],   accent3: [100,220,240] },
  bw:         { bg: [0,0,0],     fg: [255,255,255], accent1: [200,200,200],accent2: [150,150,150],  accent3: [255,255,255] },
  magenta:    { bg: [70,0,45],   fg: [240,180,220], accent1: [230,0,126],  accent2: [180,40,100],   accent3: [255,60,160] },
  warm:       { bg: [80,28,0],   fg: [255,240,200], accent1: [255,100,20], accent2: [200,60,30],    accent3: [255,180,40] },
  cold:       { bg: [0,28,60],   fg: [200,220,240], accent1: [60,140,200], accent2: [0,180,210],    accent3: [140,180,220] },
};

export const palette = {
  bg: [0,0,0],
  fg: [255,255,255],
  accent1: [255,68,0],
  accent2: [0,170,204],
  accent3: [230,0,126],
  // targets for lerp
  _targetBg: [0,0,0],
  _targetFg: [255,255,255],
  _targetA1: [255,68,0],
  _targetA2: [0,170,204],
  _targetA3: [230,0,126],
  _lerpSpeed: 0.02, // per frame
};

export function setPalette(name) {
  const p = PALETTES[name] || PALETTES.default;
  palette._targetBg = [...p.bg];
  palette._targetFg = [...p.fg];
  palette._targetA1 = [...p.accent1];
  palette._targetA2 = [...p.accent2];
  palette._targetA3 = [...p.accent3];
}

function lerpColor(current, target, speed) {
  for (let i = 0; i < 3; i++) {
    current[i] += (target[i] - current[i]) * speed;
  }
}

export function updatePalette(dt) {
  // Framerate-independent lerp
  const s = dt ? (1 - Math.pow(1 - palette._lerpSpeed, dt * 60)) : palette._lerpSpeed;
  lerpColor(palette.bg, palette._targetBg, s);
  lerpColor(palette.fg, palette._targetFg, s);
  lerpColor(palette.accent1, palette._targetA1, s);
  lerpColor(palette.accent2, palette._targetA2, s);
  lerpColor(palette.accent3, palette._targetA3, s);
}

// ── Entity color system ──
export const colorEnabled = { A: true, B: true, C: true };

export let chromaticMode = 'normal';
export let chromaticTimer = 0;
export let climaxTimer = 0;
export let inClimax = false;
export let climaxProgress = 0;
export let inverted = false;
export let invertDissolving = false;
export let invertDissolveProgress = 0;
export let invertTarget = false;

export function setChromaticShift(mode) {
  chromaticMode = mode;
  chromaticTimer = CFG.chromaticShiftDuration;
}

export function startInvertDissolve() {
  invertDissolving = true;
  invertDissolveProgress = 0;
  invertTarget = !inverted;
}

export function updateColors(dt, state) {
  // Palette lerp (dt-based)
  updatePalette(dt);

  // Climax
  if (state.intensity > CFG.climaxIntensityThreshold) climaxTimer += dt;
  else { climaxTimer = 0; inClimax = false; }
  inClimax = climaxTimer >= CFG.climaxThresholdSec;

  if (inClimax && colorEnabled.C) {
    climaxProgress = Math.min(1, climaxProgress + CFG.climaxShiftSpeed * dt);
  } else {
    climaxProgress = Math.max(0, climaxProgress - CFG.climaxShiftSpeed * dt * 0.5);
  }

  // Chromatic timer
  if (chromaticMode !== 'normal') {
    chromaticTimer -= dt;
    if (chromaticTimer <= 0) { chromaticMode = 'normal'; chromaticTimer = 0; }
  }

  // Invert dissolve
  if (invertDissolving) {
    invertDissolveProgress += dt / CFG.invertDissolveDuration;
    if (invertDissolveProgress >= 1) {
      inverted = invertTarget;
      invertDissolving = false;
      invertDissolveProgress = 0;
    }
  }
}

export function resetClimax() {
  climaxTimer = 0;
  inClimax = false;
  climaxProgress = 0;
}

// Get pixel color for entity — reads from dynamic palette
export function getCellColor(colorId, colorAlpha, fgVal) {
  if (colorId === 0 || colorAlpha < 0.01) return null;
  let rgb;
  if (colorId === 1) rgb = palette.accent1;
  else if (colorId === 2) rgb = palette.accent2;
  else if (colorId === 3) rgb = palette.accent3;
  else return null;

  const a = Math.pow(colorAlpha, 0.6);
  return [
    Math.round(fgVal + (rgb[0] - fgVal) * a),
    Math.round(fgVal + (rgb[1] - fgVal) * a),
    Math.round(fgVal + (rgb[2] - fgVal) * a),
  ];
}

// Get pixel color for MIDI channel
export function getMidiColor(ch, alpha, fgVal) {
  if (ch < 0 || ch >= 5 || alpha < 0.01) return null;
  const rgb = MIDI_COLORS[ch];
  const a = Math.pow(Math.min(1, alpha), 0.5);
  return [
    Math.round(fgVal + (rgb[0] - fgVal) * a),
    Math.round(fgVal + (rgb[1] - fgVal) * a),
    Math.round(fgVal + (rgb[2] - fgVal) * a),
  ];
}
