// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: NEGATIVO
//  Fondo colorato saturo. Le note scavano buchi scuri.
//  RESPIRO: silenzio = colore, musica = assenza.
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBayer, fillBackground, rgbString, hexToRgb, lerpColor,
  lerp, clamp,
} from './visual-toolkit.js';

const PHASE_PARAMS = {
  germoglio:    { holeSize: 0.12, closeSpeed: 0.005, holeDepth: 0.4 },
  pulsazione:   { holeSize: 0.08, closeSpeed: 0.010, holeDepth: 0.6 },
  dissoluzione: { holeSize: 0.05, closeSpeed: 0.003, holeDepth: 0.3 },
};

let _holes = [];
let _time = 0;
let _params = { ...PHASE_PARAMS.germoglio };

export function init(env) {
  _holes = [];
  _time = 0;
  _params = { ...(PHASE_PARAMS[env.worldState.phase] || PHASE_PARAMS.germoglio) };
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, dt } = env;
  _time += dt;

  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  _params.holeSize += (target.holeSize - _params.holeSize) * 0.03;
  _params.closeSpeed += (target.closeSpeed - _params.closeSpeed) * 0.03;
  _params.holeDepth += (target.holeDepth - _params.holeDepth) * 0.03;

  const bgRgb = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);

  // Fill entire canvas with bg color (the saturated "full" state)
  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  const dotSize = Math.max(4, Math.round(lerp(10, 6, _params.holeDepth)));

  // Spawn holes from voice notes (CH5) and lead echo (CH6)
  for (const n of midiTrail) {
    if ((n.ch === 5 || n.ch === 6) && n.time < dt * 2 && n.alpha > 0.4) {
      const isEcho = n.ch === 6;
      _holes.push({
        x: 0.15 + n.note * 0.7,
        y: 0.15 + (1 - n.note) * 0.7 + (isEcho ? 0.05 : 0),
        radius: 0,
        maxRadius: _params.holeSize * (isEcho ? 0.6 : 1) * n.vel,
        alpha: _params.holeDepth * (isEcho ? 0.5 : 1),
        closing: false,
        growSpeed: isEcho ? 0.08 : 0.15,
      });
    }
  }

  if (_holes.length > 30) _holes.splice(0, _holes.length - 30);

  // Inverted onset waves — brief dark flashes
  for (const w of onsetWaves) {
    if (w.strength > 0.5) {
      const cx = w.cx / W;
      const cy = w.cy / H;
      _holes.push({
        x: cx, y: cy,
        radius: 0.02, maxRadius: 0.04,
        alpha: w.strength * 0.3,
        closing: true,
        growSpeed: 0,
      });
    }
  }

  // Update and render holes
  for (let i = _holes.length - 1; i >= 0; i--) {
    const h = _holes[i];

    if (!h.closing && h.radius < h.maxRadius) {
      h.radius += h.growSpeed * dt;
      if (h.radius >= h.maxRadius) h.closing = true;
    }

    if (h.closing) {
      h.radius -= _params.closeSpeed;
      h.alpha *= 0.995;
    }

    if (h.radius < 0.002 || h.alpha < 0.02) {
      _holes[i] = _holes[_holes.length - 1];
      _holes.length--;
      continue;
    }

    const hx = h.x * W - h.radius * W;
    const hy = h.y * H - h.radius * H;
    const hw = h.radius * 2 * W;
    const hh = h.radius * 2 * H;
    const holeRgb = lerpColor(bgRgb, dotRgb, h.alpha);
    fillBayer(ctx, hx, hy, hw, hh, clamp(h.alpha + 0.2, 0, 1), dotSize, rgbString(holeRgb[0], holeRgb[1], holeRgb[2]));
  }
}

export function destroy() {
  _holes = [];
}
