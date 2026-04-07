// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: TRENO
//  Viaggio laterale con parallasse su 3 piani.
//  TEMPESTA: velocità, densità, hocket visibile, sedimento pesante.
//
//  v2 (A.4) — Migrato al layer stack 4-canonico (BG/MG/FG).
//             MG = breath field (fresh ogni frame).
//             FG = oggetti/sparkles/ambient camera-trasformati (fresh ogni frame).
//             Sediment privato mantenuto: pattern frame-capture speciale
//             (sCtx.drawImage del canvas composito) non replicabile nel layer stack base.
//             Sediment composito avviene SU ctx dopo compositeLayers.
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, rgbString, hexToRgb, lerpColor,
  lerp, clamp, rng, seedRng,
  Sediment, applyCameraTransform, restoreCameraTransform,
  renderBreathingField, audioDensity,
  bayerGlitch, colorFlash, shouldGlitch,
  RISO_OFFSET_X, RISO_OFFSET_Y,
  lerpKForTrack,
} from './visual-toolkit.js';

import {
  getLayerCtx, clearAllLayers, clearLayer, compositeLayers,
  LAYER_BG, LAYER_MG, LAYER_FG,
} from './layers.js';

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
const PLANE_SAT = [0.30, 0.65, 1.0];

const AMBIENT_BASE_RATE = 0.4;
const AMBIENT_RMS_SCALE  = 6.0;

let _objects   = [];
let _sparkles  = [];
let _ambient   = [];
let _scrollX   = [0, 0, 0];
let _time      = 0;
let _params    = { ...PHASE_PARAMS.germoglio };

// Sediment privato — pattern frame-capture speciale
const _sediment = new Sediment();

let _shakeAmt  = 0;
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
  clearAllLayers();
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, audio, state, dt } = env;
  _time += dt;

  const phase  = worldState.phase || 'germoglio';
  const target = PHASE_PARAMS[phase] || PHASE_PARAMS.germoglio;
  const { rupture } = worldState;
  const ruptI = rupture.intensity;   // 0→1 smooth (omen→infiltration→takeover→residue)

  const trackK = lerpKForTrack(worldState.track, dt);
  _params.scrollSpeed += (target.scrollSpeed - _params.scrollSpeed) * trackK;
  _params.planeSep    += (target.planeSep    - _params.planeSep)    * trackK;
  _params.dotBack     += (target.dotBack     - _params.dotBack)     * trackK;
  _params.dotFront    += (target.dotFront    - _params.dotFront)    * trackK;
  _params.density     += (target.density     - _params.density)     * trackK;
  _params.sediment    += (target.sediment    - (_params.sediment || 0.93)) * trackK;

  const bgRgb  = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;

  // ── Onset shake ──
  const onsetNow = audio && audio.onset;
  if (onsetNow && !_prevOnset) {
    const strength = state ? clamp(state.intensity, 0.3, 1.0) : 0.6;
    _shakeAmt = Math.max(_shakeAmt, strength * 8);
  }
  _prevOnset = onsetNow;
  _shakeAmt *= 0.85;

  // ── Scroll advance ──
  let scrollDir = 1;
  if (ruptI > 0.2 && shouldGlitch((state ? state.intensity : 0.5) * ruptI, true, _time)) {
    scrollDir = -1;
  }
  for (let p = 0; p < 3; p++) {
    _scrollX[p] += _params.scrollSpeed * PLANE_SPEEDS[p] * dt * scrollDir;
  }

  // Sediment privato: decay ogni frame
  const sedRate = _params.sediment || 0.90;
  _sediment.decay(W, H, sedRate);

  // ── Layer contexts — MG e FG freschi ogni frame ──
  clearLayer(LAYER_MG);
  clearLayer(LAYER_FG);
  const lBg = getLayerCtx(LAYER_BG);
  const lMg = getLayerCtx(LAYER_MG);
  const lFg = getLayerCtx(LAYER_FG);

  // ── BG layer ──
  if (lBg) fillBackground(lBg, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  // ── MG layer: breath field ──
  if (lMg && audio && state) {
    const breathAlpha = clamp(0.05 + state.intensity * 0.07, 0.05, 0.12);
    const breathDotColor = rgbString(dotRgb[0], dotRgb[1], dotRgb[2], breathAlpha);
    const jitter = lerp(0.2, 0.6, ruptI);
    renderBreathingField(lMg, W, H, audio, state, _time, 4, breathDotColor, breathAlpha, jitter);
  }

  // ── FG layer: oggetti, sparkles, ambient con camera ──
  const cameraZoom = lerp(1.0, lerp(1.0, 1.04, clamp(_params.density - 0.5, 0, 1) * 2), ruptI);
  if (lFg) applyCameraTransform(lFg, W, H, {
    zoom:        cameraZoom,
    shakeAmount: _shakeAmt,
    time:        _time,
  });

  // ── Spawn MIDI-driven objects ──
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

    let spawnX;
    if (plane === 2 && n.ch === 5) {
      spawnX = W * (0.1 + rng() * 0.4) + W * 0.5;
    } else if (plane === 2 && n.ch === 6) {
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

    if (n.ch === 1) {
      const sparkCount = ruptI > 0.4 ? 4 : 2;
      for (let si = 0; si < sparkCount; si++) {
        const sp = Math.floor(rng() * 3);
        _sparkles.push({
          x:       W + rng() * 20,
          y:       rng() * H,
          alpha:   n.vel * lerp(0.8, 1.0, ruptI),
          plane:   sp,
          size:    Math.round(lerp(2, 3, ruptI)),
          trail:   [],
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
          alpha: 0.08 + rng() * 0.12,
          size:  Math.max(1, Math.round(lerp(_params.dotBack * 0.5, _params.dotFront * 0.5, p / 2))),
        });
      }
    }
  }

  if (ruptI > 0.1) {
    for (const w of (onsetWaves || [])) {
      if (w.strength > 0.5) {
        const burstCount = Math.floor(w.strength * 15);
        for (let bi = 0; bi < burstCount; bi++) {
          _sparkles.push({
            x:     rng() * W,
            y:     rng() * H,
            alpha: w.strength * (0.5 + rng() * 0.5),
            plane: Math.floor(rng() * 3),
            size:  2 + Math.floor(rng() * 4),
            trail: [],
          });
        }
      }
    }
  }

  if (_objects.length > 400)  _objects.splice(0, _objects.length - 400);
  if (_sparkles.length > 200) _sparkles.splice(0, _sparkles.length - 200);
  if (_ambient.length > 500)  _ambient.splice(0, _ambient.length - 500);

  // ── Draw objects per plane ──
  for (let p = 0; p < 3; p++) {
    const speed       = _params.scrollSpeed * PLANE_SPEEDS[p];
    const planeDotSz  = Math.max(2, Math.round(lerp(_params.dotBack, _params.dotFront, p / 2)));
    const saturation  = PLANE_SAT[p];
    const planeAlpha  = lerp(0.3, 1.0, p / 2);
    const sizeBoost   = lerp(1.0, 1.25, p / 2);

    // Ambient stream
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
      if (lFg) {
        lFg.fillStyle = rgbString(ambRgb[0], ambRgb[1], ambRgb[2], a.alpha);
        lFg.fillRect(a.x, a.y, a.size, a.size);
      }
    }

    // MIDI objects
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
      const _rDen = ((worldState.density && worldState.density.rhythm) || 0);
      const _bDen = ((worldState.density && worldState.density.bass)   || 0);
      const density = Math.min(clamp(o.alpha * planeAlpha * _params.density * 2 + (_rDen + _bDen) * 0.035, 0, 1), worldState.visualRegime.maxDensity);
      const baseRgb = o.isAccent ? accRgb : dotRgb;
      const fadedRgb = lerpColor(bgRgb, baseRgb, saturation * planeAlpha * o.alpha);
      const rdx = o.isAccent ? RISO_OFFSET_X : 0;
      const rdy = o.isAccent ? RISO_OFFSET_Y : 0;

      if (lFg) {
        lFg.fillStyle  = rgbString(fadedRgb[0], fadedRgb[1], fadedRgb[2]);
        const clusterSize = Math.ceil(s / planeDotSz);
        for (let dr = 0; dr < clusterSize; dr++) {
          for (let dc = 0; dc < clusterSize; dc++) {
            const px  = o.x  + dc * planeDotSz;
            const py  = o.y  + dr * planeDotSz;
            const col = Math.floor(px / planeDotSz);
            const row = Math.floor(py / planeDotSz);
            if (bayerTest(col, row, density)) {
              lFg.fillRect(px + rdx, py + rdy, planeDotSz, planeDotSz);
            }
          }
        }
      }
    }

    // Sparkles
    for (let i = _sparkles.length - 1; i >= 0; i--) {
      const s = _sparkles[i];
      if (s.plane !== p) continue;

      s.trail.push({ x: s.x, y: s.y, a: s.alpha * 0.5 });
      if (s.trail.length > 4) s.trail.shift();

      s.x    -= speed * dt;
      s.alpha *= lerp(0.93, 0.96, ruptI);

      if (s.x < -10 || s.alpha < 0.03) {
        _sparkles[i] = _sparkles[_sparkles.length - 1];
        _sparkles.length--;
        continue;
      }

      if (lFg) {
        for (const tp of s.trail) {
          lFg.fillStyle = rgbString(dotRgb[0], dotRgb[1], dotRgb[2], tp.a);
          lFg.fillRect(tp.x, tp.y, s.size, s.size);
        }
        lFg.fillStyle = rgbString(dotRgb[0], dotRgb[1], dotRgb[2], s.alpha);
        lFg.fillRect(s.x, s.y, s.size, s.size);
      }
    }

    // Rottura shimmer
    if (ruptI > 0.1 && lFg) {
      const shimmerCount = Math.floor(4 + rng() * 6);
      const shimmerAlpha = ruptI * (0.15 + rng() * 0.35);
      let shRgb = lerpColor(bgRgb, dotRgb, saturation);
      if (shouldGlitch(1, true, _time + p * 0.3)) {
        shRgb = colorFlash(shRgb, 0.8, _time);
      }
      lFg.fillStyle = rgbString(
        clamp(shRgb[0], 0, 255),
        clamp(shRgb[1], 0, 255),
        clamp(shRgb[2], 0, 255),
        shimmerAlpha
      );
      for (let si = 0; si < shimmerCount; si++) {
        const sx = rng() * W;
        const sy = rng() * H;
        const ss = 1 + Math.floor(rng() * 4);
        lFg.fillRect(sx, sy, ss, ss);
      }
    }
  }

  if (lFg) restoreCameraTransform(lFg);

  // ── Composite layers: BG → MG(breath) → FG(oggetti) ──
  compositeLayers(ctx);

  // ── Sediment privato: composite su ctx (sopra oggetti) ──
  // Pattern frame-capture: il sediment accumula il canvas composito di ogni frame.
  // Successivo frame: vecchio frame appare sfumato sotto i nuovi oggetti.
  _sediment.composite(ctx);

  // Cattura il frame composito corrente nel buffer sediment
  const sCtx = _sediment.getCtx();
  sCtx.drawImage(ctx.canvas, 0, 0);
}

export function destroy() {
  _objects  = [];
  _sparkles = [];
  _ambient  = [];
  clearAllLayers();
}
