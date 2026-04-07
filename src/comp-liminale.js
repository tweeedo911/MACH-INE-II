// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: LIMINALE
//  Prospettiva convergente. NEBBIA (avvicinamento) + RITORNO (allontanamento).
//  Breathing field + sediment trails + onset ripples + vanishing point drift
//
//  v2 (A.4) — Migrato al layer stack 4-canonico (BG/MG/FG/OVERLAY).
//             Il ctx passato non viene più toccato direttamente.
//             Sediment OVERLAY: alpha pre-baked ×0.6 per replicare
//             il composite post-camera a globalAlpha=0.6 dell'originale.
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, rgbString, lerpColor, hexToRgb,
  lerp, clamp, noiseAt, perspectiveScale, rng, seedRng,
  audioDensity, audioFlicker, bayerGlitch, colorFlash, shouldGlitch,
  applyCameraTransform, restoreCameraTransform,
  RISO_OFFSET_X, RISO_OFFSET_Y,
  lerpKForTrack,
  renderBayerScaffold,
} from './visual-toolkit.js';

import {
  getLayerCtx, clearAllLayers, clearLayer, compositeLayers, setLayerDecay,
  LAYER_BG, LAYER_MG, LAYER_FG, LAYER_OVERLAY,
} from './layers.js';

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
let _vanishDriftX = 0;
let _vanishDriftY = 0;
let _isRitorno = false;
let _time = 0;
let _params = { ...PHASE_PARAMS.germoglio };
let _onsetShake = 0;

// ── Audio-reactive zones — Bayer clusters that grow with sound ──
let _zones = [];  // { x, y, radius, targetRadius, density, born }

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
  clearAllLayers();
  _zones = [];
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, audio, state, dt } = env;
  _time += dt;

  // Lerp params (per-track tau — Phase 0 task 0.3)
  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  const trackK = lerpKForTrack(worldState.track, dt);
  for (const k of Object.keys(target)) {
    _params[k] += (target[k] - _params[k]) * trackK;
  }
  setLayerDecay(LAYER_OVERLAY, _params.sedRate);  // propagate to layer system next frame

  const bgRgb = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;
  const bgStr = rgbString(bgRgb[0], bgRgb[1], bgRgb[2]);
  const dotStr = rgbString(dotRgb[0], dotRgb[1], dotRgb[2]);

  const { rupture } = worldState;
  const ruptI = rupture.intensity;   // 0→1 smooth (omen→infiltration→takeover→residue)

  // ── Layer contexts — MG e FG freschi ogni frame ──
  clearLayer(LAYER_MG);
  clearLayer(LAYER_FG);
  const lBg = getLayerCtx(LAYER_BG);
  const lMg = getLayerCtx(LAYER_MG);
  const lFg = getLayerCtx(LAYER_FG);
  const lOv = getLayerCtx(LAYER_OVERLAY);

  // Onset shake — decays fast (more violent in rottura)
  for (const w of onsetWaves) {
    if (w.strength > 0.5) _onsetShake = Math.max(_onsetShake, w.strength * lerp(4, 8, ruptI));
  }
  _onsetShake *= lerp(0.9, 0.85, ruptI);

  // Vanishing point drift — in rottura: JUMPS invece di derivare (sopra soglia infiltration)
  if (ruptI > 0.4 && shouldGlitch((state.intensity + 0.3) * ruptI, true, _time)) {
    _vanishX = 0.3 + Math.random() * 0.4;
    _vanishY = 0.25 + Math.random() * 0.3;
  }
  _vanishDriftX += (((audio.bands.high.L - audio.bands.high.R) * 0.5) * 30 - _vanishDriftX) * lerp(0.01, 0.05, ruptI);
  _vanishDriftY += ((audio.centroid * 20 - 10) - _vanishDriftY) * lerp(0.008, 0.04, ruptI);

  // ── BG layer: background + optional Bayer scaffold ──
  if (lBg) {
    fillBackground(lBg, W, H, bgStr);

    // Bayer scaffold — visible only in NEBBIA germoglio/dissoluzione
    if (worldState.track === 'NEBBIA' &&
        (worldState.phase === 'germoglio' || worldState.phase === 'dissoluzione')) {
      renderBayerScaffold(lBg, W, H, dotStr, 0.04);
    }
  }

  // ── Camera opts — applied to MG and FG layer ctxs ──
  const camOpts = {
    zoom: _params.zoom,
    driftX: _vanishDriftX,
    driftY: _vanishDriftY,
    shakeAmount: _onsetShake,
    time: _time,
  };

  // ── MG layer: audio-reactive zones — Bayer clusters that breathe and grow ──
  const breathDotSize = Math.max(5, Math.round(lerp(12, 6, state.intensity)));

  // Spawn new zones when audio is active
  if (audio.rms > 0.05) {
    const spawnChance = state.intensity * 0.15 + audio.flux * 0.3;
    if (Math.random() < spawnChance && _zones.length < 12) {
      _zones.push({
        x: Math.random(),
        y: Math.random(),
        radius: 0.01,
        targetRadius: 0.08 + Math.random() * 0.15 + state.intensity * 0.12,
        density: 0,
        born: _time,
      });
    }
  }

  // Update zones: grow, fade, remove dead
  for (let i = _zones.length - 1; i >= 0; i--) {
    const z = _zones[i];
    z.radius += (z.targetRadius - z.radius) * 0.02;
    const targetDensity = audioDensity(audio, state, z.x, z.y) * _params.breathAlpha * 1.5
                        + audioFlicker(state, _time, z.x, z.y) * _params.breathAlpha;
    z.density += (targetDensity - z.density) * 0.08;
    if (audio.rms < 0.03) {
      z.targetRadius *= 0.995;
      z.density *= 0.98;
    }
    if (z.density < 0.005 && z.radius < 0.02) {
      _zones[i] = _zones[_zones.length - 1];
      _zones.length--;
    }
  }

  // Render zones to MG layer (camera-transformed)
  if (lMg) {
    applyCameraTransform(lMg, W, H, camOpts);
    const cols = Math.ceil(W / breathDotSize);
    const rows = Math.ceil(H / breathDotSize);
    for (let r = 0; r < rows; r++) {
      const ny = r / rows;
      for (let c = 0; c < cols; c++) {
        const nx = c / cols;
        let d = 0;
        for (const z of _zones) {
          const dx = nx - z.x;
          const dy = ny - z.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < z.radius) {
            const falloff = 1 - (dist / z.radius);
            d += z.density * falloff * falloff;
          }
        }
        if (d > 0.01) {
          const glitchAmt = ruptI * (0.5 + state.intensity * 0.5);
          const visible = glitchAmt > 0.01
            ? bayerGlitch(c, r, clamp(d, 0, 1), glitchAmt, _time)
            : bayerTest(c, r, clamp(d, 0, 1));
          if (visible) {
            const fade = clamp(d * 1.5, 0.04, 0.6);
            let rgb = lerpColor(bgRgb, dotRgb, fade);
            if (glitchAmt > 0.3 && shouldGlitch(1, true, _time + c * 0.01)) {
              rgb = colorFlash(rgb, 0.7, _time);
            }
            lMg.fillStyle = rgbString(rgb[0], rgb[1], rgb[2]);
            lMg.fillRect(c * breathDotSize, r * breathDotSize, breathDotSize, breathDotSize);
          }
        }
      }
    }
    restoreCameraTransform(lMg);
  }

  // ── FG layer: dots — MIDI-driven perspective particles (camera-transformed) ──
  const spread = _params.midiSpread || 0.3;
  for (const n of midiTrail) {
    if (n.time < dt * 2 && n.alpha > 0.3) {
      const isVoice = n.ch === 5 || n.ch === 6;
      const isDrone = n.ch === 2;
      const isChord = n.ch === 4;

      const spawnX = isVoice
        ? lerp(0.15, 0.85, n.note) + (Math.random() - 0.5) * spread * 0.3
        : _vanishX + (Math.random() - 0.5) * spread * 0.5;
      const spawnY = isVoice
        ? lerp(0.15, 0.85, 1 - n.note) + (Math.random() - 0.5) * spread * 0.2
        : _vanishY + (Math.random() - 0.5) * spread * 0.3;

      const rotturaBoost = lerp(1.0, 1.5, ruptI);
      const sizeMul = (isVoice ? 2.0 : isChord ? 1.5 : isDrone ? 1.8 : 1.0) * rotturaBoost;
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

  // Update and render dots to FG layer
  if (lFg) applyCameraTransform(lFg, W, H, camOpts);

  const direction = _isRitorno ? 1 : -1;
  for (let i = _dots.length - 1; i >= 0; i--) {
    const d = _dots[i];

    d.depth += direction * _params.driftSpeed * dt;
    d.x += (d.vx || 0) * dt;
    d.y += (d.vy || 0) * dt;
    d.alpha -= 0.006;

    const dotSpread = _isRitorno ? (1 - d.depth) : d.depth;
    const sx = _vanishX + (d.x - _vanishX) * (1 + dotSpread * 3.5);
    const sy = _vanishY + (d.y - _vanishY) * (1 + dotSpread * 3.5);
    const scale = perspectiveScale(1, 1 - dotSpread);

    if (d.alpha < 0.02 || d.depth < -0.05 || d.depth > 1.05 || sx < -0.15 || sx > 1.15 || sy < -0.15 || sy > 1.15) {
      _dots[i] = _dots[_dots.length - 1];
      _dots.length--;
      continue;
    }

    const px = sx * W;
    const py = sy * H;
    const dotSize = Math.max(2, Math.round(d.size * scale));
    const density = Math.min(clamp(d.alpha * _params.densityMax * 3, 0, 1), worldState.visualRegime.maxDensity);
    const col = Math.floor(px / dotSize);
    const row = Math.floor(py / dotSize);

    if (bayerTest(col, row, density)) {
      const depthFade = clamp(dotSpread * 1.2, 0, 1);
      const isVoice = d.ch === 5 || d.ch === 6;
      const rgb = lerpColor(bgRgb, isVoice ? accRgb : dotRgb, depthFade * d.alpha);
      const colorStr = rgbString(rgb[0], rgb[1], rgb[2]);
      // Risograph offset: accent plane (voice/lead) misregistered by 1 px
      const rdx = isVoice ? RISO_OFFSET_X : 0;
      const rdy = isVoice ? RISO_OFFSET_Y : 0;
      if (lFg) {
        lFg.fillStyle = colorStr;
        lFg.fillRect(px - dotSize / 2 + rdx, py - dotSize / 2 + rdy, dotSize, dotSize);
      }

      // Write into OVERLAY — builds trails
      // Alpha pre-baked ×0.6 to replicate the original globalAlpha=0.6 composite post-camera
      if (lOv) {
        lOv.fillStyle = colorStr;
        lOv.globalAlpha = d.alpha * 0.24;  // = 0.4 × 0.6 (original write × original composite alpha)
        lOv.fillRect(px - dotSize / 2 + rdx, py - dotSize / 2 + rdy, dotSize, dotSize);
        lOv.globalAlpha = 1;
      }
    }
  }

  if (lFg) restoreCameraTransform(lFg);

  // ── Composite layers onto main canvas ──
  compositeLayers(ctx);
}

export function destroy() {
  _dots = [];
  clearAllLayers();
}
