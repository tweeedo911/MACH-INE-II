// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Chromatic System A/B/C
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';

export const COLOR_A = [255, 68, 0];     // #FF4400
export const COLOR_B = [0, 170, 204];    // #00AACC
export const COLOR_C = [230, 0, 126];    // #E6007E

// ── Per-role MIDI colors (synesthetic palette) ──
// Each instrument role has its own chromatic identity
export const MIDI_COLORS = [
  [255, 140, 20],   // KICK  — amber/warm orange
  [200, 30, 30],    // BASS  — deep red
  [0, 180, 210],    // HARMONY — cyan/teal
  [160, 60, 220],   // LEAD  — violet
  [180, 200, 220],  // TEXTURE — cold white/steel
];

// Get RGB for a MIDI channel's color, mixed with alpha toward fgVal
export function getMidiColor(ch, alpha, fgVal) {
  if (ch < 0 || ch >= 5 || alpha < 0.01) return null;
  const rgb = MIDI_COLORS[ch];
  const a = Math.pow(Math.min(1, alpha), 0.5); // aggressive curve — color shows early
  return [
    Math.round(fgVal + (rgb[0] - fgVal) * a),
    Math.round(fgVal + (rgb[1] - fgVal) * a),
    Math.round(fgVal + (rgb[2] - fgVal) * a),
  ];
}

export const colorEnabled = { A: true, B: true, C: true };

// Chromatic shift
export let chromaticMode = 'normal';
export let chromaticTimer = 0;

// Climax
export let climaxTimer = 0;
export let inClimax = false;
export let climaxProgress = 0;

// Invert dissolve
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

// Get pixel color for a cell based on entity color
// Boosted alpha curve: color dominates faster (power < 1 = more saturated earlier)
export function getCellColor(colorId, colorAlpha, fgVal) {
  if (colorId === 0 || colorAlpha < 0.01) return null;
  let rgb;
  if (colorId === 1) rgb = COLOR_A;
  else if (colorId === 2) rgb = COLOR_B;
  else if (colorId === 3) rgb = COLOR_C;
  else return null;

  // Boost: even low alpha gives strong color
  const a = Math.pow(colorAlpha, 0.6);
  return [
    Math.round(fgVal + (rgb[0] - fgVal) * a),
    Math.round(fgVal + (rgb[1] - fgVal) * a),
    Math.round(fgVal + (rgb[2] - fgVal) * a),
  ];
}
