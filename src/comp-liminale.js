// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: LIMINALE
//  Prospettiva convergente. NEBBIA (avvicinamento) + RITORNO (allontanamento).
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, rgbString, lerpColor, hexToRgb,
  lerp, clamp, mapRange, noiseAt, perspectiveScale, rng, seedRng,
} from './visual-toolkit.js';

// ── Phase parameters ──
const PHASE_PARAMS = {
  germoglio:    { depthRange: 0.2, dotMin: 8, dotMax: 20, densityMax: 0.05, driftSpeed: 0.02 },
  pulsazione:   { depthRange: 0.5, dotMin: 6, dotMax: 18, densityMax: 0.15, driftSpeed: 0.05 },
  densita:      { depthRange: 0.8, dotMin: 4, dotMax: 16, densityMax: 0.40, driftSpeed: 0.10 },
  rottura:      { depthRange: 1.0, dotMin: 2, dotMax: 24, densityMax: 0.70, driftSpeed: 0.20 },
  dissoluzione: { depthRange: 0.3, dotMin: 10, dotMax: 20, densityMax: 0.10, driftSpeed: 0.02 },
};

// ── Internal state ──
let _dots = [];
let _vanishX = 0.5;
let _vanishY = 0.4;
let _isRitorno = false;
let _time = 0;
let _params = { depthRange: 0.2, dotMin: 8, dotMax: 20, densityMax: 0.05, driftSpeed: 0.02 };

export function init(env) {
  _dots = [];
  _time = 0;
  _isRitorno = env.worldState.track === 'RITORNO';
  _vanishX = 0.5 + (Math.random() - 0.5) * 0.2;
  _vanishY = _isRitorno ? 0.45 : 0.35;
  const phase = env.worldState.phase || 'germoglio';
  _params = { ...(PHASE_PARAMS[phase] || PHASE_PARAMS.germoglio) };
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, audio, dt } = env;
  _time += dt;

  // Lerp params toward current phase
  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  const lspeed = 0.03;
  _params.depthRange += (target.depthRange - _params.depthRange) * lspeed;
  _params.dotMin += (target.dotMin - _params.dotMin) * lspeed;
  _params.dotMax += (target.dotMax - _params.dotMax) * lspeed;
  _params.densityMax += (target.densityMax - _params.densityMax) * lspeed;
  _params.driftSpeed += (target.driftSpeed - _params.driftSpeed) * lspeed;

  const bgRgb = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;

  // Background
  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  // Spawn dots from MIDI notes
  for (const n of midiTrail) {
    if (n.time < dt * 2 && n.alpha > 0.5) {
      const depth = _isRitorno ? 0.1 : (0.7 + Math.random() * 0.3) * _params.depthRange;
      _dots.push({
        x: _vanishX + (Math.random() - 0.5) * 0.1,
        y: _vanishY + (Math.random() - 0.5) * 0.1,
        depth,
        size: lerp(_params.dotMin, _params.dotMax, n.vel),
        alpha: n.vel,
        born: _time,
        ch: n.ch,
      });
    }
  }

  // Onset waves → perspective ripple (spawn cluster of small dots)
  for (const w of onsetWaves) {
    if (w.strength > 0.8) {
      for (let i = 0; i < 3; i++) {
        _dots.push({
          x: _vanishX + (Math.random() - 0.5) * 0.15,
          y: _vanishY + (Math.random() - 0.5) * 0.15,
          depth: 0.5 + Math.random() * 0.5 * _params.depthRange,
          size: lerp(_params.dotMin * 0.5, _params.dotMax * 0.3, Math.random()),
          alpha: 0.6,
          born: _time,
          ch: -1,
        });
      }
    }
  }

  // Cap dots
  if (_dots.length > 200) _dots.splice(0, _dots.length - 200);

  // Update and render dots
  const direction = _isRitorno ? 1 : -1;
  for (let i = _dots.length - 1; i >= 0; i--) {
    const d = _dots[i];

    d.depth += direction * _params.driftSpeed * dt;
    d.alpha -= 0.008;

    const spread = _isRitorno ? (1 - d.depth) : d.depth;
    const sx = _vanishX + (d.x - _vanishX) * (1 + spread * 3);
    const sy = _vanishY + (d.y - _vanishY) * (1 + spread * 3);
    const scale = perspectiveScale(1, 1 - spread);

    if (d.alpha < 0.02 || d.depth < 0 || d.depth > 1 || sx < -0.1 || sx > 1.1 || sy < -0.1 || sy > 1.1) {
      _dots[i] = _dots[_dots.length - 1];
      _dots.length--;
      continue;
    }

    const px = sx * W;
    const py = sy * H;
    const dotSize = Math.max(2, Math.round(d.size * scale));
    const density = d.alpha * _params.densityMax * 3;
    const col = Math.floor(px / dotSize);
    const row = Math.floor(py / dotSize);

    if (bayerTest(col, row, clamp(density, 0, 1))) {
      const depthFade = clamp(spread, 0, 1);
      const rgb = lerpColor(bgRgb, d.ch === 5 || d.ch === 6 ? accRgb : dotRgb, depthFade * d.alpha);
      ctx.fillStyle = rgbString(rgb[0], rgb[1], rgb[2]);
      ctx.fillRect(px - dotSize / 2, py - dotSize / 2, dotSize, dotSize);
    }
  }

  // Ambient noise dots
  const ambientCount = Math.floor(audio.rms * 10 * _params.densityMax);
  seedRng(Math.floor(_time * 7));
  for (let i = 0; i < ambientCount; i++) {
    const ax = rng();
    const ay = rng();
    const adepth = rng() * _params.depthRange;
    const asize = lerp(_params.dotMin * 0.5, _params.dotMax * 0.3, rng());
    const aspread = _isRitorno ? (1 - adepth) : adepth;
    const apx = lerp(_vanishX * W, ax * W, aspread);
    const apy = lerp(_vanishY * H, ay * H, aspread);
    const col = Math.floor(apx / asize);
    const row = Math.floor(apy / asize);
    if (bayerTest(col, row, 0.3 * aspread)) {
      const fade = aspread * 0.5;
      const rgb = lerpColor(bgRgb, dotRgb, fade);
      ctx.fillStyle = rgbString(rgb[0], rgb[1], rgb[2], fade);
      const s = Math.max(1, asize * perspectiveScale(1, 1 - aspread));
      ctx.fillRect(apx, apy, s, s);
    }
  }
}

export function destroy() {
  _dots = [];
}
