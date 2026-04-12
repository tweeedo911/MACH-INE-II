// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Color System
//  Reads worldState.palette (Bible §12 — 5 ruoli per traccia).
//  Lerps smoothly. Blends dot→ruptureTint via rupture.intensity.
//  Exports getPalette() — stable reference, arrays mutated in-place.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';

// ── Interpolated state (5 channels) ──
const _current = {
  bg:          [0, 0, 0],
  dot:         [255, 255, 255],
  accent:      [0, 0, 0],
  ruptureTint: [255, 255, 255],
  residual:    [128, 128, 128],
};
const _target = {
  bg:          [0, 0, 0],
  dot:         [255, 255, 255],
  accent:      [0, 0, 0],
  ruptureTint: [255, 255, 255],
  residual:    [128, 128, 128],
};

// dot blended toward ruptureTint by rupture.intensity.
// Pre-computed in updateColors — alloc-free in getPalette().
const _blendedDot = [255, 255, 255];

// Stable exported object — arrays are stable references, mutated in-place.
// Callers: getPalette().dot, getPalette().bg, etc.
const _palette = {
  bg:          _current.bg,
  dot:         _blendedDot,
  accent:      _current.accent,
  ruptureTint: _current.ruptureTint,
  residual:    _current.residual,
};

let _lerpSpeed = 0.015;

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
  const p = worldState.palette;
  _target.bg          = hexToRgb(p.bg);
  _target.dot         = hexToRgb(p.dot);
  _target.accent      = hexToRgb(p.accent);
  _target.ruptureTint = hexToRgb(p.ruptureTint);
  _target.residual    = hexToRgb(p.residual);

  if (p.ruptureBg) {
    const ri = worldState.rupture?.intensity ?? 0;
    if (ri > 0.6) {
      const rbg = hexToRgb(p.ruptureBg);
      const t = (ri - 0.6) / 0.4;
      for (let i = 0; i < 3; i++) _target.bg[i] = _target.bg[i] + (rbg[i] - _target.bg[i]) * t;
    }
  }

  const s = dt ? (1 - Math.pow(1 - _lerpSpeed, dt * 60)) : _lerpSpeed;
  lerpChannel(_current.bg,          _target.bg,          s);
  lerpChannel(_current.dot,         _target.dot,         s);
  lerpChannel(_current.accent,      _target.accent,      s);
  lerpChannel(_current.ruptureTint, _target.ruptureTint, s);
  lerpChannel(_current.residual,    _target.residual,    s);

  // Pre-compute blended dot: dot + (ruptureTint - dot) * intensity
  const ri = worldState.rupture?.intensity ?? 0;
  for (let i = 0; i < 3; i++) {
    _blendedDot[i] = _current.dot[i] + (_current.ruptureTint[i] - _current.dot[i]) * ri;
  }
}

// ── Snap palette immediately (no lerp) — for init or hard cuts ──
export function snapPalette() {
  const p = worldState.palette;
  for (const k of ['bg', 'dot', 'accent', 'ruptureTint', 'residual']) {
    const rgb = hexToRgb(p[k]);
    const c = _current[k];
    for (let i = 0; i < 3; i++) { c[i] = rgb[i]; }
  }
  const ri = worldState.rupture?.intensity ?? 0;
  for (let i = 0; i < 3; i++) {
    _blendedDot[i] = _current.dot[i] + (_current.ruptureTint[i] - _current.dot[i]) * ri;
  }
}

// ── Get current palette (stable reference, mutated in-place each frame) ──
export function getPalette() {
  return _palette;
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
