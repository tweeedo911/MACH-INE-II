// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: LIMINALE
//  Prospettiva convergente. NEBBIA (avvicinamento) + RITORNO (allontanamento).
//  Breathing field + sediment trails + onset ripples + vanishing point drift
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, rgbString, lerpColor, hexToRgb,
  lerp, clamp, noiseAt, perspectiveScale, rng, seedRng,
  audioDensity, audioFlicker, Sediment,
  applyCameraTransform, restoreCameraTransform,
} from './visual-toolkit.js';

const PHASE_PARAMS = {
  germoglio:    { depthRange: 0.2, dotMin: 14, dotMax: 40, densityMax: 0.10, driftSpeed: 0.02, breathAlpha: 0.20, sedRate: 0.92, zoom: 1.01, midiSpread: 0.3 },
  pulsazione:   { depthRange: 0.5, dotMin: 10, dotMax: 35, densityMax: 0.20, driftSpeed: 0.05, breathAlpha: 0.30, sedRate: 0.88, zoom: 1.02, midiSpread: 0.5 },
  densita:      { depthRange: 0.8, dotMin: 6,  dotMax: 30, densityMax: 0.45, driftSpeed: 0.10, breathAlpha: 0.40, sedRate: 0.85, zoom: 1.03, midiSpread: 0.7 },
  rottura:      { depthRange: 1.0, dotMin: 4,  dotMax: 36, densityMax: 0.70, driftSpeed: 0.20, breathAlpha: 0.55, sedRate: 0.80, zoom: 1.06, midiSpread: 0.9 },
  dissoluzione: { depthRange: 0.3, dotMin: 12, dotMax: 35, densityMax: 0.12, driftSpeed: 0.02, breathAlpha: 0.15, sedRate: 0.93, zoom: 1.00, midiSpread: 0.3 },
};

let _dots = [];
let _vanishX = 0.5;
let _vanishY = 0.4;
let _vanishDriftX = 0;   // slow vanishing point wander
let _vanishDriftY = 0;
let _isRitorno = false;
let _time = 0;
let _params = { ...PHASE_PARAMS.germoglio };
let _sediment = new Sediment();
let _onsetShake = 0;      // onset-driven shake amount

export function init(env) {
  _dots = [];
  _time = 0;
  _onsetShake = 0;
  _isRitorno = env.worldState.track === 'RITORNO';
  _vanishX = 0.5 + (Math.random() - 0.5) * 0.15;
  _vanishY = _isRitorno ? 0.45 : 0.35;
  _vanishDriftX = 0;
  _vanishDriftY = 0;
  _params = { ...(PHASE_PARAMS[env.worldState.phase] || PHASE_PARAMS.germoglio) };
  _sediment.clear(1, 1); // will resize on first render
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, audio, state, dt } = env;
  _time += dt;

  // Lerp params
  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  for (const k of Object.keys(target)) {
    _params[k] += (target[k] - _params[k]) * 0.03;
  }

  const bgRgb = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;
  const bgStr = rgbString(bgRgb[0], bgRgb[1], bgRgb[2]);
  const dotStr = rgbString(dotRgb[0], dotRgb[1], dotRgb[2]);

  // Onset shake — decays fast
  for (const w of onsetWaves) {
    if (w.strength > 0.5) _onsetShake = Math.max(_onsetShake, w.strength * 4);
  }
  _onsetShake *= 0.9;

  // Vanishing point slow drift — follows audio centroid and stereo
  _vanishDriftX += (((audio.bands.high.L - audio.bands.high.R) * 0.5) * 30 - _vanishDriftX) * 0.01;
  _vanishDriftY += ((audio.centroid * 20 - 10) - _vanishDriftY) * 0.008;

  // Background
  fillBackground(ctx, W, H, bgStr);

  // Camera — subtle zoom toward vanishing point, onset shake
  applyCameraTransform(ctx, W, H, {
    zoom: _params.zoom,
    driftX: _vanishDriftX,
    driftY: _vanishDriftY,
    shakeAmount: _onsetShake,
    time: _time,
  });

  // ── Layer 1: Bayer matrix base — always present, the "tessuto" del canvas ──
  // Full-screen halftone field: audio-reactive, perspective-weighted, always visible
  const breathDotSize = Math.max(5, Math.round(lerp(12, 6, state.intensity)));
  const cols = Math.ceil(W / breathDotSize);
  const rows = Math.ceil(H / breathDotSize);

  for (let r = 0; r < rows; r++) {
    const ny = r / rows;
    for (let c = 0; c < cols; c++) {
      const nx = c / cols;
      const dx = nx - _vanishX;
      const dy = ny - _vanishY;
      const distFromVanish = Math.sqrt(dx * dx + dy * dy);
      // Perspective gradient: denser near vanishing point, fades outward
      const perspDensity = Math.max(0, 1 - distFromVanish * 1.4);

      // Base Bayer presence — always there, even in silence
      let d = 0.03 + perspDensity * 0.06;
      // Audio-reactive layer on top
      d += audioDensity(audio, state, nx, ny) * _params.breathAlpha;
      d += perspDensity * state.intensity * _params.breathAlpha * 0.8;
      d += audioFlicker(state, _time, nx, ny) * _params.breathAlpha * 0.5;
      // Noise variation to avoid uniformity
      d += noiseAt(c * 0.5, r * 0.5, _time * 0.3) * 0.03;

      if (bayerTest(c, r, clamp(d, 0, 1))) {
        const fade = clamp(d * 1.5, 0.04, 0.6);
        const rgb = lerpColor(bgRgb, dotRgb, fade);
        ctx.fillStyle = rgbString(rgb[0], rgb[1], rgb[2]);
        ctx.fillRect(c * breathDotSize, r * breathDotSize, breathDotSize, breathDotSize);
      }
    }
  }

  // ── Layer 2: Sediment — trails from previous dots ──
  _sediment.decay(W, H, _params.sedRate);
  const sedCtx = _sediment.getCtx();

  // ── Layer 3: Dots — MIDI-driven perspective particles ──
  // Voice (CH5) and Lead (CH6) get BIG prominent dots that spread across canvas
  // Other channels get standard perspective dots near vanishing point
  const spread = _params.midiSpread || 0.3;
  for (const n of midiTrail) {
    if (n.time < dt * 2 && n.alpha > 0.3) {
      const isVoice = n.ch === 5 || n.ch === 6;
      const isDrone = n.ch === 2;
      const isChord = n.ch === 4;

      // Voice/lead: spawn away from vanishing point, fill the canvas
      const spawnX = isVoice
        ? lerp(0.15, 0.85, n.note) + (Math.random() - 0.5) * spread * 0.3
        : _vanishX + (Math.random() - 0.5) * spread * 0.5;
      const spawnY = isVoice
        ? lerp(0.15, 0.85, 1 - n.note) + (Math.random() - 0.5) * spread * 0.2
        : _vanishY + (Math.random() - 0.5) * spread * 0.3;

      // Voice/lead get 2x size, chords get 1.5x
      const sizeMul = isVoice ? 2.0 : isChord ? 1.5 : isDrone ? 1.8 : 1.0;
      const depth = _isRitorno
        ? (isVoice ? 0.2 + Math.random() * 0.3 : 0.05 + Math.random() * 0.15)
        : (0.4 + Math.random() * 0.6) * _params.depthRange;

      _dots.push({
        x: spawnX,
        y: spawnY,
        depth,
        size: lerp(_params.dotMin, _params.dotMax, n.vel) * sizeMul,
        alpha: n.vel * 0.9 + 0.1,
        ch: n.ch,
        vx: (Math.random() - 0.5) * (isVoice ? 0.03 : 0.015),
        vy: (Math.random() - 0.5) * (isVoice ? 0.02 : 0.008),
      });

      // Voice: spawn a secondary "echo" dot for more presence
      if (isVoice && n.vel > 0.5) {
        _dots.push({
          x: spawnX + (Math.random() - 0.5) * 0.1,
          y: spawnY + (Math.random() - 0.5) * 0.08,
          depth: depth * 0.7,
          size: lerp(_params.dotMin, _params.dotMax, n.vel) * 1.3,
          alpha: n.vel * 0.5,
          ch: n.ch,
          vx: (Math.random() - 0.5) * 0.01,
          vy: (Math.random() - 0.5) * 0.01,
        });
      }
    }
  }

  // Onset → cluster burst
  for (const w of onsetWaves) {
    if (w.strength > 0.6) {
      const count = Math.floor(w.strength * 5);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.01 + Math.random() * 0.03;
        _dots.push({
          x: _vanishX + (Math.random() - 0.5) * 0.1,
          y: _vanishY + (Math.random() - 0.5) * 0.1,
          depth: (0.4 + Math.random() * 0.6) * _params.depthRange,
          size: lerp(_params.dotMin * 0.4, _params.dotMax * 0.4, Math.random()),
          alpha: w.strength * 0.5,
          ch: -1,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        });
      }
    }
  }

  if (_dots.length > 300) _dots.splice(0, _dots.length - 300);

  // Update and render dots
  const direction = _isRitorno ? 1 : -1;
  for (let i = _dots.length - 1; i >= 0; i--) {
    const d = _dots[i];

    d.depth += direction * _params.driftSpeed * dt;
    d.x += (d.vx || 0) * dt;
    d.y += (d.vy || 0) * dt;
    d.alpha -= 0.006;

    const spread = _isRitorno ? (1 - d.depth) : d.depth;
    const sx = _vanishX + (d.x - _vanishX) * (1 + spread * 3.5);
    const sy = _vanishY + (d.y - _vanishY) * (1 + spread * 3.5);
    const scale = perspectiveScale(1, 1 - spread);

    if (d.alpha < 0.02 || d.depth < -0.05 || d.depth > 1.05 || sx < -0.15 || sx > 1.15 || sy < -0.15 || sy > 1.15) {
      _dots[i] = _dots[_dots.length - 1];
      _dots.length--;
      continue;
    }

    const px = sx * W;
    const py = sy * H;
    const dotSize = Math.max(2, Math.round(d.size * scale));
    const density = clamp(d.alpha * _params.densityMax * 3, 0, 1);
    const col = Math.floor(px / dotSize);
    const row = Math.floor(py / dotSize);

    if (bayerTest(col, row, density)) {
      const depthFade = clamp(spread * 1.2, 0, 1);
      const isVoice = d.ch === 5 || d.ch === 6;
      const rgb = lerpColor(bgRgb, isVoice ? accRgb : dotRgb, depthFade * d.alpha);
      const colorStr = rgbString(rgb[0], rgb[1], rgb[2]);
      ctx.fillStyle = colorStr;
      ctx.fillRect(px - dotSize / 2, py - dotSize / 2, dotSize, dotSize);

      // Draw into sediment too — builds trails
      if (sedCtx) {
        sedCtx.fillStyle = colorStr;
        sedCtx.globalAlpha = d.alpha * 0.4;
        sedCtx.fillRect(px - dotSize / 2, py - dotSize / 2, dotSize, dotSize);
        sedCtx.globalAlpha = 1;
      }
    }
  }

  restoreCameraTransform(ctx);

  // Composite sediment under everything? No — over bg, under camera transform already applied
  // Actually composite it now (post-camera-restore so it's stable)
  ctx.globalAlpha = 0.6;
  _sediment.composite(ctx);
  ctx.globalAlpha = 1;
}

export function destroy() {
  _dots = [];
  _sediment.clear(1, 1);
}
