// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: TRENO
//  Viaggio laterale con parallasse su 3 piani.
//  TEMPESTA: velocità, densità, hocket visibile, sedimento pesante.
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, rgbString, hexToRgb, lerpColor,
  lerp, clamp, rng, seedRng,
  Sediment, applyCameraTransform, restoreCameraTransform,
  renderBreathingField, audioDensity,
} from './visual-toolkit.js';

// ── Phase parameters ──
const PHASE_PARAMS = {
  germoglio:    { scrollSpeed: 30,  planeSep: 0.35, dotBack: 2, dotFront: 8,  density: 0.15, sediment: 0.93 },
  pulsazione:   { scrollSpeed: 60,  planeSep: 0.30, dotBack: 2, dotFront: 10, density: 0.30, sediment: 0.88 },
  densita:      { scrollSpeed: 120, planeSep: 0.20, dotBack: 3, dotFront: 14, density: 0.55, sediment: 0.82 },
  rottura:      { scrollSpeed: 220, planeSep: 0.10, dotBack: 4, dotFront: 20, density: 0.85, sediment: 0.72 },
  dissoluzione: { scrollSpeed: 40,  planeSep: 0.30, dotBack: 2, dotFront: 8,  density: 0.20, sediment: 0.90 },
};

const PLANE_SPEEDS = [0.3, 0.6, 1.0];
const PLANE_Y_RANGES = [
  [0.0, 0.4],
  [0.25, 0.75],
  [0.5, 1.0],
];

// Depth desaturation: back plane closer to bg, front fully saturated
const PLANE_SAT = [0.30, 0.65, 1.0];   // lerp weight toward dotRgb vs bgRgb

// Ambient stream: ambient dots per plane scrolling in silence
const AMBIENT_BASE_RATE = 0.4;   // objects per second per plane at rms=0
const AMBIENT_RMS_SCALE  = 6.0;  // additional rate multiplier from rms

let _objects   = [];
let _sparkles  = [];
let _ambient   = [];             // continuous ambient stream objects
let _scrollX   = [0, 0, 0];
let _time      = 0;
let _params    = { ...PHASE_PARAMS.germoglio };

// Sediment buffer — persistent frame trails (TEMPESTA heaviest)
const _sediment = new Sediment();

// Camera shake state
let _shakeAmt  = 0;              // current shake magnitude (px)
let _prevOnset = false;

export function init(env) {
  _objects   = [];
  _sparkles  = [];
  _ambient   = [];
  _scrollX   = [0, 0, 0];
  _time      = 0;
  _params    = { ...(PHASE_PARAMS[env.worldState.phase] || PHASE_PARAMS.germoglio) };
  _shakeAmt  = 0;
  _prevOnset = false;
  _sediment.clear(env.W || 1280, env.H || 720);
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, audio, state, dt } = env;
  _time += dt;

  const phase  = worldState.phase || 'germoglio';
  const target = PHASE_PARAMS[phase] || PHASE_PARAMS.germoglio;
  const isRottura = phase === 'rottura';

  // ── Smooth param interpolation ──
  _params.scrollSpeed += (target.scrollSpeed - _params.scrollSpeed) * 0.02;
  _params.planeSep    += (target.planeSep    - _params.planeSep)    * 0.02;
  _params.dotBack     += (target.dotBack     - _params.dotBack)     * 0.02;
  _params.dotFront    += (target.dotFront    - _params.dotFront)    * 0.02;
  _params.density     += (target.density     - _params.density)     * 0.02;
  _params.sediment    += (target.sediment    - (_params.sediment || 0.93)) * 0.02;

  // ── Color setup ──
  const bgRgb  = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;

  // ── Onset shake detection ──
  const onsetNow = audio && audio.onset;
  if (onsetNow && !_prevOnset) {
    const strength = state ? clamp(state.intensity, 0.3, 1.0) : 0.6;
    _shakeAmt = Math.max(_shakeAmt, strength * 8);
  }
  _prevOnset = onsetNow;
  _shakeAmt *= 0.85;  // slower decay than other compositions — TEMPESTA stays violent

  // ── Scroll advance ──
  for (let p = 0; p < 3; p++) {
    _scrollX[p] += _params.scrollSpeed * PLANE_SPEEDS[p] * dt;
  }

  // ── Sediment: decay previous frame buffer ──
  const sedRate = _params.sediment || 0.90;
  _sediment.decay(W, H, sedRate);

  // ── Background: solid fill ──
  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  // ── Breathing background: subtle audio-reactive dots under everything ──
  if (audio && state) {
    const breathAlpha = clamp(0.05 + state.intensity * 0.07, 0.05, 0.12);
    const breathDotColor = rgbString(dotRgb[0], dotRgb[1], dotRgb[2], breathAlpha);
    renderBreathingField(ctx, W, H, audio, state, _time, 4, breathDotColor, breathAlpha);
  }

  // ── Camera transform (shake + rottura zoom) ──
  const cameraZoom = isRottura ? lerp(1.0, 1.04, clamp(_params.density - 0.5, 0, 1) * 2) : 1.0;
  applyCameraTransform(ctx, W, H, {
    zoom:        cameraZoom,
    shakeAmount: _shakeAmt,
    time:        _time,
  });

  // ── Composite sediment over background (but under new objects) ──
  _sediment.composite(ctx);

  // ── Spawn MIDI-driven objects from midiTrail ──
  for (const n of midiTrail) {
    if (n.time > dt * 2 || n.alpha < 0.4) continue;
    let plane = -1;
    if (n.ch === 2)                 plane = 0;
    if (n.ch === 3 || n.ch === 4)  plane = 1;
    if (n.ch === 5 || n.ch === 6 || n.ch === 7) plane = 2;
    if (n.ch === 0)                 plane = 1;
    if (plane < 0) continue;

    const yRange    = PLANE_Y_RANGES[plane];
    const dotSize   = lerp(_params.dotBack, _params.dotFront, plane / 2);

    // ── Hocket: CH5 (voice) left, CH6 (lead) right on front plane ──
    let spawnX;
    if (plane === 2 && n.ch === 5) {
      // Voice: left corridor 0.1–0.5
      spawnX = W * (0.1 + rng() * 0.4) + W * 0.5;
    } else if (plane === 2 && n.ch === 6) {
      // Lead: right corridor 0.5–0.9
      spawnX = W * (0.5 + rng() * 0.4) + W * 0.5;
    } else {
      spawnX = W + Math.random() * 50;
    }

    _objects.push({
      plane,
      x:        spawnX,
      y:        lerp(yRange[0], yRange[1], n.note / 127) * H,
      size:     dotSize * n.vel,
      isAccent: n.ch === 5 || n.ch === 6,
      alpha:    n.vel,
      ch:       n.ch,
    });

    // Hat sparkles (CH1) — across all three planes, bigger in rottura
    if (n.ch === 1) {
      const sparkCount = isRottura ? 4 : 2;
      for (let si = 0; si < sparkCount; si++) {
        const sp = Math.floor(rng() * 3);   // random plane
        _sparkles.push({
          x:       W + rng() * 20,
          y:       rng() * H,
          alpha:   n.vel * (isRottura ? 1.0 : 0.8),
          plane:   sp,
          size:    isRottura ? 3 : 2,
          trail:   [],                          // brief trail history
        });
      }
    }
  }

  // ── Spawn ambient stream ──
  if (audio) {
    const rms       = audio.rms || 0;
    const spawnRate = AMBIENT_BASE_RATE + rms * AMBIENT_RMS_SCALE;
    for (let p = 0; p < 3; p++) {
      if (rng() < spawnRate * dt) {
        const yRange = PLANE_Y_RANGES[p];
        _ambient.push({
          plane: p,
          x:     W + rng() * 30,
          y:     lerp(yRange[0], yRange[1], rng()) * H,
          alpha: 0.08 + rng() * 0.12,           // faint
          size:  Math.max(1, Math.round(lerp(_params.dotBack * 0.5, _params.dotFront * 0.5, p / 2))),
        });
      }
    }
  }

  if (_objects.length > 400)  _objects.splice(0, _objects.length - 400);
  if (_sparkles.length > 100) _sparkles.splice(0, _sparkles.length - 100);
  if (_ambient.length > 500)  _ambient.splice(0, _ambient.length - 500);

  // ── Draw objects per plane (back → front) ──
  for (let p = 0; p < 3; p++) {
    const speed       = _params.scrollSpeed * PLANE_SPEEDS[p];
    const planeDotSz  = Math.max(2, Math.round(lerp(_params.dotBack, _params.dotFront, p / 2)));
    const saturation  = PLANE_SAT[p];                     // depth desaturation
    const planeAlpha  = lerp(0.3, 1.0, p / 2);
    // Front plane objects slightly larger
    const sizeBoost   = lerp(1.0, 1.25, p / 2);

    // Draw ambient stream for this plane
    for (let i = _ambient.length - 1; i >= 0; i--) {
      const a = _ambient[i];
      if (a.plane !== p) continue;
      a.x    -= speed * dt;
      a.alpha *= 0.997;
      if (a.x < -20 || a.alpha < 0.01) {
        _ambient[i] = _ambient[_ambient.length - 1];
        _ambient.length--;
        continue;
      }
      const ambRgb = lerpColor(bgRgb, dotRgb, saturation * a.alpha * 2);
      ctx.fillStyle = rgbString(ambRgb[0], ambRgb[1], ambRgb[2], a.alpha);
      ctx.fillRect(a.x, a.y, a.size, a.size);
    }

    // Draw MIDI objects for this plane
    for (let i = _objects.length - 1; i >= 0; i--) {
      const o = _objects[i];
      if (o.plane !== p) continue;

      o.x    -= speed * dt;
      o.alpha *= 0.999;

      if (o.x < -50 || o.alpha < 0.02) {
        _objects[i] = _objects[_objects.length - 1];
        _objects.length--;
        continue;
      }

      const s       = Math.max(2, Math.round(o.size * sizeBoost));
      const density = clamp(o.alpha * planeAlpha * _params.density * 2, 0, 1);
      const baseRgb = o.isAccent ? accRgb : dotRgb;
      // Depth-based desaturation: back plane fades toward bg
      const fadedRgb = lerpColor(bgRgb, baseRgb, saturation * planeAlpha * o.alpha);
      ctx.fillStyle  = rgbString(fadedRgb[0], fadedRgb[1], fadedRgb[2]);

      const clusterSize = Math.ceil(s / planeDotSz);
      for (let dr = 0; dr < clusterSize; dr++) {
        for (let dc = 0; dc < clusterSize; dc++) {
          const px  = o.x  + dc * planeDotSz;
          const py  = o.y  + dr * planeDotSz;
          const col = Math.floor(px / planeDotSz);
          const row = Math.floor(py / planeDotSz);
          if (bayerTest(col, row, density)) {
            ctx.fillRect(px, py, planeDotSz, planeDotSz);
          }
        }
      }
    }

    // Draw sparkles for this plane
    for (let i = _sparkles.length - 1; i >= 0; i--) {
      const s = _sparkles[i];
      if (s.plane !== p) continue;

      // Store trail position before moving
      s.trail.push({ x: s.x, y: s.y, a: s.alpha * 0.5 });
      if (s.trail.length > 4) s.trail.shift();

      s.x    -= speed * dt;
      s.alpha *= isRottura ? 0.96 : 0.93;  // slower decay in rottura → continuous shimmer

      if (s.x < -10 || s.alpha < 0.03) {
        _sparkles[i] = _sparkles[_sparkles.length - 1];
        _sparkles.length--;
        continue;
      }

      // Draw trail
      for (const tp of s.trail) {
        ctx.fillStyle = rgbString(dotRgb[0], dotRgb[1], dotRgb[2], tp.a);
        ctx.fillRect(tp.x, tp.y, s.size, s.size);
      }
      // Draw sparkle itself
      ctx.fillStyle = rgbString(dotRgb[0], dotRgb[1], dotRgb[2], s.alpha);
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    // In rottura: inject continuous hat shimmer across all planes
    if (isRottura) {
      const shimmerCount = Math.floor(2 + rng() * 3);
      const shimmerAlpha = 0.15 + rng() * 0.25;
      const shRgb = lerpColor(bgRgb, dotRgb, saturation);
      ctx.fillStyle = rgbString(shRgb[0], shRgb[1], shRgb[2], shimmerAlpha);
      for (let si = 0; si < shimmerCount; si++) {
        const sx = rng() * W;
        const sy = rng() * H;
        ctx.fillRect(sx, sy, 2, 2);
      }
    }
  }

  // ── Capture current frame into sediment buffer ──
  // (composite back onto sediment so trails accumulate)
  const sCtx = _sediment.getCtx();
  sCtx.drawImage(ctx.canvas, 0, 0);

  restoreCameraTransform(ctx);
}

export function destroy() {
  _objects  = [];
  _sparkles = [];
  _ambient  = [];
}
