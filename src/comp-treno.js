// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: TRENO
//  Viaggio laterale con parallasse su 3 piani.
//  TEMPESTA: velocità, densità, hocket visibile.
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, rgbString, hexToRgb, lerpColor,
  lerp, clamp, rng, seedRng,
} from './visual-toolkit.js';

const PHASE_PARAMS = {
  germoglio:    { scrollSpeed: 30,  planeSep: 0.35, dotBack: 2, dotFront: 8,  density: 0.15 },
  pulsazione:   { scrollSpeed: 60,  planeSep: 0.30, dotBack: 2, dotFront: 10, density: 0.30 },
  densita:      { scrollSpeed: 120, planeSep: 0.20, dotBack: 3, dotFront: 14, density: 0.55 },
  rottura:      { scrollSpeed: 220, planeSep: 0.10, dotBack: 4, dotFront: 20, density: 0.85 },
  dissoluzione: { scrollSpeed: 40,  planeSep: 0.30, dotBack: 2, dotFront: 8,  density: 0.20 },
};

const PLANE_SPEEDS = [0.3, 0.6, 1.0];
const PLANE_Y_RANGES = [
  [0.0, 0.4],
  [0.25, 0.75],
  [0.5, 1.0],
];

let _objects = [];
let _scrollX = [0, 0, 0];
let _time = 0;
let _sparkles = [];
let _params = { ...PHASE_PARAMS.germoglio };

export function init(env) {
  _objects = [];
  _sparkles = [];
  _scrollX = [0, 0, 0];
  _time = 0;
  _params = { ...(PHASE_PARAMS[env.worldState.phase] || PHASE_PARAMS.germoglio) };
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, audio, dt } = env;
  _time += dt;

  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  _params.scrollSpeed += (target.scrollSpeed - _params.scrollSpeed) * 0.02;
  _params.planeSep += (target.planeSep - _params.planeSep) * 0.02;
  _params.dotBack += (target.dotBack - _params.dotBack) * 0.02;
  _params.dotFront += (target.dotFront - _params.dotFront) * 0.02;
  _params.density += (target.density - _params.density) * 0.02;

  const bgRgb = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;

  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  for (let p = 0; p < 3; p++) {
    _scrollX[p] += _params.scrollSpeed * PLANE_SPEEDS[p] * dt;
  }

  for (const n of midiTrail) {
    if (n.time > dt * 2 || n.alpha < 0.4) continue;
    let plane = -1;
    if (n.ch === 2) plane = 0;
    if (n.ch === 3 || n.ch === 4) plane = 1;
    if (n.ch === 5 || n.ch === 6 || n.ch === 7) plane = 2;
    if (n.ch === 0) plane = 1;
    if (plane < 0) continue;

    const yRange = PLANE_Y_RANGES[plane];
    const dotSize = lerp(_params.dotBack, _params.dotFront, plane / 2);

    _objects.push({
      plane,
      x: W + Math.random() * 50,
      y: lerp(yRange[0], yRange[1], n.note) * H,
      size: dotSize * n.vel,
      isAccent: n.ch === 5 || n.ch === 6,
      alpha: n.vel,
      ch: n.ch,
    });

    if (n.ch === 1) {
      _sparkles.push({
        x: W + Math.random() * 20,
        y: Math.random() * H,
        alpha: n.vel * 0.8,
        plane: Math.floor(Math.random() * 3),
      });
    }
  }

  if (_objects.length > 300) _objects.splice(0, _objects.length - 300);
  if (_sparkles.length > 50) _sparkles.splice(0, _sparkles.length - 50);

  for (let p = 0; p < 3; p++) {
    const speed = _params.scrollSpeed * PLANE_SPEEDS[p];
    const planeDotSize = Math.max(2, Math.round(lerp(_params.dotBack, _params.dotFront, p / 2)));
    const planeAlpha = lerp(0.3, 1.0, p / 2);

    for (let i = _objects.length - 1; i >= 0; i--) {
      const o = _objects[i];
      if (o.plane !== p) continue;

      o.x -= speed * dt;
      o.alpha *= 0.999;

      if (o.x < -50 || o.alpha < 0.02) {
        _objects[i] = _objects[_objects.length - 1];
        _objects.length--;
        continue;
      }

      const s = Math.max(2, Math.round(o.size));
      const density = clamp(o.alpha * planeAlpha * _params.density * 2, 0, 1);
      const rgb = o.isAccent ? accRgb : dotRgb;
      const fadedRgb = lerpColor(bgRgb, rgb, planeAlpha * o.alpha);
      ctx.fillStyle = rgbString(fadedRgb[0], fadedRgb[1], fadedRgb[2]);

      const clusterSize = Math.ceil(s / planeDotSize);
      for (let dr = 0; dr < clusterSize; dr++) {
        for (let dc = 0; dc < clusterSize; dc++) {
          const px = o.x + dc * planeDotSize;
          const py = o.y + dr * planeDotSize;
          const col = Math.floor(px / planeDotSize);
          const row = Math.floor(py / planeDotSize);
          if (bayerTest(col, row, density)) {
            ctx.fillRect(px, py, planeDotSize, planeDotSize);
          }
        }
      }
    }

    for (let i = _sparkles.length - 1; i >= 0; i--) {
      const s = _sparkles[i];
      if (s.plane !== p) continue;
      s.x -= speed * dt;
      s.alpha *= 0.93;
      if (s.x < -10 || s.alpha < 0.03) {
        _sparkles[i] = _sparkles[_sparkles.length - 1];
        _sparkles.length--;
        continue;
      }
      ctx.fillStyle = rgbString(dotRgb[0], dotRgb[1], dotRgb[2], s.alpha);
      ctx.fillRect(s.x, s.y, 2, 2);
    }
  }
}

export function destroy() {
  _objects = [];
  _sparkles = [];
}
