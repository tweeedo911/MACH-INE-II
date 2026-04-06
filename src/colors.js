// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Color System
//  Reads worldState.palette, lerps smoothly, exports getPalette().
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';

// ── Current interpolated palette (RGB arrays) ──
const _current = {
  bg:     [0, 0, 0],
  dot:    [255, 255, 255],
  accent: [0, 0, 0],
};
const _target = {
  bg:     [0, 0, 0],
  dot:    [255, 255, 255],
  accent: [0, 0, 0],
};

let _lerpSpeed = 0.02;

function hexToRgb(hex) {
  if (!hex) return [0, 0, 0];
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpChannel(current, target, speed) {
  for (let i = 0; i < 3; i++) {
    current[i] += (target[i] - current[i]) * speed;
  }
}

// ── Update: call every frame ──
export function updateColors(dt) {
  // Read targets from worldState
  const p = worldState.palette;
  _target.bg = hexToRgb(p.bg);
  _target.dot = hexToRgb(p.dot);
  _target.accent = hexToRgb(p.accent);

  // Framerate-independent lerp
  const s = dt ? (1 - Math.pow(1 - _lerpSpeed, dt * 60)) : _lerpSpeed;
  lerpChannel(_current.bg, _target.bg, s);
  lerpChannel(_current.dot, _target.dot, s);
  lerpChannel(_current.accent, _target.accent, s);
}

// ── Snap palette immediately (no lerp) — for init or hard cuts ──
export function snapPalette() {
  const p = worldState.palette;
  const bg = hexToRgb(p.bg);
  const dot = hexToRgb(p.dot);
  const accent = hexToRgb(p.accent);
  for (let i = 0; i < 3; i++) {
    _current.bg[i] = bg[i];
    _current.dot[i] = dot[i];
    _current.accent[i] = accent[i];
  }
}

// ── Get current palette (RGB arrays, interpolated) ──
export function getPalette() {
  return _current;
}

// ── Convenience: get bg as CSS string ──
export function getBgString() {
  const b = _current.bg;
  return `rgb(${b[0]|0},${b[1]|0},${b[2]|0})`;
}

// ── Set lerp speed (0.01 = slow transition, 0.1 = fast) ──
export function setLerpSpeed(speed) {
  _lerpSpeed = speed;
}
