// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: QUADRATI
//  Blocchi rettangolari asimmetrici che pulsano col groove.
//  SOLCO: kick illumina, bass dimensiona, chords colorano.
//  v3: breathing field, sediment, onset shake, drift, orbit trail
//       arp su CH6=LEAD, destroy pulito, overlay alpha separato
//
//  v4 (A.4) — Migrato al layer stack 4-canonico (BG/MG/FG/OVERLAY).
//             MG = breath field (fresh ogni frame).
//             FG = blocchi + arp camera-trasformati (fresh ogni frame).
//             OVERLAY = sediment (alpha 0.5 via setLayerCompositeAlpha).
//             Differenza Z-order minima: sediment sopra arp (originale: sotto).
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, fillBayer, rgbString, hexToRgb, lerpColor,
  lerp, clamp, rng, seedRng, noiseAt,
  renderBreathingField, bayerGlitch, colorFlash, shouldGlitch,
  applyCameraTransform, restoreCameraTransform,
  RISO_OFFSET_X, RISO_OFFSET_Y,
  lerpKForTrack,
} from './visual-toolkit.js';

import {
  getLayerCtx, clearAllLayers, clearLayer, compositeLayers,
  setLayerDecay, setLayerCompositeAlpha,
  LAYER_BG, LAYER_MG, LAYER_FG, LAYER_OVERLAY,
} from './layers.js';

// ── Phase parameters ──
const PHASE_PARAMS = {
  germoglio:    {
    blocks: 2,  fillDensity: 0.15, flashIntensity: 0.3,  arpVisible: false,
    breathAlpha: 0.18, sedimentRate: 0.92,
  },
  pulsazione:   {
    blocks: 4,  fillDensity: 0.35, flashIntensity: 0.6,  arpVisible: false,
    breathAlpha: 0.30, sedimentRate: 0.88,
  },
  densita:      {
    blocks: 6,  fillDensity: 0.55, flashIntensity: 0.85, arpVisible: true,
    breathAlpha: 0.45, sedimentRate: 0.85,
  },
  rottura:      {
    blocks: 8,  fillDensity: 0.80, flashIntensity: 1.0,  arpVisible: true,
    breathAlpha: 0.60, sedimentRate: 0.78,
  },
  dissoluzione: {
    blocks: 3,  fillDensity: 0.20, flashIntensity: 0.3,  arpVisible: false,
    breathAlpha: 0.18, sedimentRate: 0.93,
  },
};

// ── Module state ──
let _blocks       = [];
let _arpParticles = [];
let _time         = 0;
let _params       = { ...PHASE_PARAMS.germoglio };
let _onsetShake   = 0;

function generateBlocks(count) {
  _blocks = [];
  seedRng(42);
  for (let i = 0; i < count; i++) {
    const w  = 0.08 + rng() * 0.18;
    const h  = 0.06 + rng() * 0.14;
    const x  = 0.05 + rng() * (0.85 - w);
    const y  = 0.05 + rng() * (0.85 - h);
    const vx = (rng() - 0.5) * 0.002;
    const vy = (rng() - 0.5) * 0.002;
    _blocks.push({
      x,  y,
      ox: x,  oy: y,
      w,  h,
      vx, vy,
      flash:       0,
      accentFlash: 0,
      shakeX:      0,
      shakeY:      0,
      jumpX:       0,
      jumpY:       0,
      breathPhase: rng() * Math.PI * 2,
    });
  }
}

export function init(env) {
  _time         = 0;
  _arpParticles = [];
  _onsetShake   = 0;

  const phase = env.worldState.phase || 'germoglio';
  _params = { ...(PHASE_PARAMS[phase] || PHASE_PARAMS.germoglio) };
  generateBlocks(_params.blocks);
  clearAllLayers();
  // OVERLAY = sediment con alpha 0.5
  setLayerDecay(LAYER_OVERLAY, _params.sedimentRate);
  setLayerCompositeAlpha(LAYER_OVERLAY, 0.5);
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, audio, state, dt } = env;
  _time += dt;

  const { rupture } = worldState;
  const ruptI = rupture.intensity;   // 0→1 smooth (omen→infiltration→takeover→residue)

  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  const trackK = lerpKForTrack(worldState.track, dt);
  _params.fillDensity    += (target.fillDensity    - _params.fillDensity)    * trackK;
  _params.flashIntensity += (target.flashIntensity - _params.flashIntensity) * trackK;
  _params.breathAlpha    += (target.breathAlpha    - _params.breathAlpha)    * trackK;
  _params.sedimentRate   += (target.sedimentRate   - _params.sedimentRate)   * trackK;
  _params.arpVisible      = target.arpVisible;
  setLayerDecay(LAYER_OVERLAY, _params.sedimentRate);  // propagate to layer system next frame

  if (Math.abs(_blocks.length - target.blocks) >= 2) {
    generateBlocks(target.blocks);
  }

  const bgRgb  = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent
    ? hexToRgb(worldState.palette.accent)
    : dotRgb;

  // ── Layer contexts — MG e FG freschi ogni frame; OVERLAY accumula ──
  clearLayer(LAYER_MG);
  clearLayer(LAYER_FG);
  const lBg = getLayerCtx(LAYER_BG);
  const lMg = getLayerCtx(LAYER_MG);
  const lFg = getLayerCtx(LAYER_FG);
  const lOv = getLayerCtx(LAYER_OVERLAY);

  // ── BG layer ──
  if (lBg) fillBackground(lBg, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  // ── MG layer: breathing halftone field ──
  // Rhythm density boosts the field — il groove si vede nel campo
  if (lMg && _params.breathAlpha > 0.01) {
    const dotColorStr = rgbString(dotRgb[0], dotRgb[1], dotRgb[2]);
    const jitter = lerp(0.15, 0.5, ruptI);
    const rhythmBoost = ((worldState.density && worldState.density.rhythm) || 0) * 0.20;
    renderBreathingField(lMg, W, H, audio, state, _time, 8, dotColorStr,
      clamp(_params.breathAlpha + rhythmBoost, 0, 0.70), jitter);
  }

  // ── MIDI segnali ──
  let kickFlash = 0, bassEnergy = 0, chordActive = false, kickHit = false;
  for (const n of midiTrail) {
    if (n.ch === 0 && n.alpha > 0.3) {
      kickFlash = Math.max(kickFlash, n.alpha);
      if (n.alpha > 0.7) kickHit = true;
    }
    if (n.ch === 3 && n.alpha > 0.2) {
      bassEnergy = Math.max(bassEnergy, n.alpha * (n.vel || 0.8));
    }
    if (n.ch === 4 && n.alpha > 0.3) chordActive = true;
  }

  for (const w of onsetWaves) {
    _onsetShake += w.strength * 6;
  }
  _onsetShake *= 0.88;
  _onsetShake  = clamp(_onsetShake, 0, 18);

  // ── FG layer: blocchi + arp con camera ──
  if (lFg) applyCameraTransform(lFg, W, H, {
    zoom:        1.0,
    driftX:      0,
    driftY:      0,
    shakeAmount: _onsetShake,
    time:        _time,
  });

  const rmsBoost  = (audio && audio.rms) ? audio.rms * 0.2 : 0;

  for (let i = 0; i < _blocks.length; i++) {
    const b = _blocks[i];

    b.flash = lerp(b.flash, kickFlash * _params.flashIntensity, 0.3);
    b.flash *= 0.92;
    b.accentFlash = lerp(b.accentFlash, chordActive ? 0.6 : 0, 0.1);
    b.accentFlash *= 0.95;

    b.shakeX = Math.sin(_time * 47 + i * 1.7) * _onsetShake * 0.004;
    b.shakeY = Math.cos(_time * 53 + i * 2.3) * _onsetShake * 0.004;

    if (kickHit) {
      const jumpScale = lerp(0.015, 0.06, ruptI);
      b.jumpX = (Math.random() - 0.5) * jumpScale;
      b.jumpY = (Math.random() - 0.5) * jumpScale;
    }
    b.jumpX *= lerp(0.85, 0.75, ruptI);
    b.jumpY *= lerp(0.85, 0.75, ruptI);

    b.x += b.vx * dt * 60;
    b.y += b.vy * dt * 60;
    if (b.x < -b.w)  b.x = 1.0;
    if (b.x >  1.0)  b.x = -b.w;
    if (b.y < -b.h)  b.y = 1.0;
    if (b.y >  1.0)  b.y = -b.h;

    const breathe = 1 + Math.sin(_time * 1.8 + b.breathPhase) * bassEnergy * 0.12;

    const densityBoost = rmsBoost + ruptI * 0.08;
    let density  = clamp(_params.fillDensity + b.flash * 0.4 + densityBoost, 0, 1);
    if (ruptI > 0.3 && shouldGlitch(ruptI, true, _time + i * 0.7)) {
      density = Math.random() > 0.5 ? 1.0 : 0.05;
    }
    density = Math.min(density, worldState.visualRegime.maxDensity);
    const dotSize  = Math.max(3, Math.round(lerp(8, 4, density)));

    const sizeMul = breathe + bassEnergy * 0.2;
    const bx = (b.x + b.jumpX + b.shakeX) * W;
    const by = (b.y + b.jumpY + b.shakeY) * H;
    const bw = b.w * sizeMul * W;
    const bh = b.h * sizeMul * H;

    let blockRgb = b.accentFlash > 0.1
      ? lerpColor(dotRgb, accRgb, b.accentFlash)
      : dotRgb;
    if (ruptI > 0.3 && shouldGlitch(0.8 * ruptI, true, _time + i * 1.3)) {
      blockRgb = colorFlash(blockRgb, 0.6, _time + i);
    }
    const colorStr = rgbString(
      clamp(blockRgb[0], 0, 255),
      clamp(blockRgb[1], 0, 255),
      clamp(blockRgb[2], 0, 255)
    );

    if (lFg) fillBayer(lFg, bx, by, bw, bh, density, dotSize, colorStr);
    if (lOv) fillBayer(lOv, bx, by, bw, bh, density * 0.7, dotSize + 1, colorStr);
  }

  // ── Arp particles — CH7=ARP primario, CH6=LEAD aggiuntivo in takeover ──
  if (_params.arpVisible) {
    for (const n of midiTrail) {
      const isArpCh = n.ch === 7 || (ruptI > 0.4 && n.ch === 6);
      if (isArpCh && n.time < dt * 2 && n.alpha > 0.5) {
        const bi     = Math.floor((n.note || 60) * _blocks.length / 128) % _blocks.length;
        const block  = _blocks[bi] || _blocks[0];
        if (block) {
          const baseRadius = Math.max(block.w, block.h) * W * 0.6;
          const spawnCount = 3 + Math.floor(Math.random() * 3) + (ruptI > 0.5 ? 1 : 0);
          for (let k = 0; k < spawnCount; k++) {
            _arpParticles.push({
              cx:          (block.x + block.w * 0.5) * W,
              cy:          (block.y + block.h * 0.5) * H,
              angle:       Math.random() * Math.PI * 2,
              radiusBase:  baseRadius * (0.4 + Math.random() * 0.9),
              radiusWobble: baseRadius * (0.10 + Math.random() * 0.15),
              wobblePhase: Math.random() * Math.PI * 2,
              wobbleSpeed: 0.6 + Math.random() * 3.2,
              size:        1 + Math.random() * 4,
              alpha:       (n.vel || 0.7) * (0.55 + Math.random() * 0.45),
              speed:       (0.6 + Math.random() * 3.0) * (Math.random() < 0.5 ? 1 : -1),
              radialOffset: (Math.random() - 0.5) * baseRadius * 0.2,
              trail:       [],
            });
          }
        }
      }
    }

    if (_arpParticles.length > 150) {
      _arpParticles.splice(0, _arpParticles.length - 150);
    }

    const accStr = rgbString(accRgb[0], accRgb[1], accRgb[2]);
    const dotStr = rgbString(dotRgb[0], dotRgb[1], dotRgb[2]);

    for (let i = _arpParticles.length - 1; i >= 0; i--) {
      const p = _arpParticles[i];

      const r = p.radiusBase
              + p.radialOffset
              + Math.sin(_time * p.wobbleSpeed + p.wobblePhase) * p.radiusWobble;

      const px = p.cx + Math.cos(p.angle) * r;
      const py = p.cy + Math.sin(p.angle) * r;

      p.trail.push({ x: px, y: py });
      if (p.trail.length > 4) p.trail.shift();

      p.angle += p.speed * dt;
      p.alpha *= 0.970;

      if (p.alpha < 0.03) {
        _arpParticles[i] = _arpParticles[_arpParticles.length - 1];
        _arpParticles.length--;
        continue;
      }

      if (!lFg) continue;

      for (let t = 0; t < p.trail.length - 1; t++) {
        const tp     = p.trail[t];
        const tAlpha = p.alpha * (t + 1) / p.trail.length * 0.4;
        if (tAlpha < 0.02) continue;
        lFg.globalAlpha = tAlpha;
        const useAccent = tAlpha > 0.12;
        lFg.fillStyle   = useAccent ? accStr : dotStr;
        const tSize = Math.max(1, p.size * 0.45);
        const rdx = useAccent ? RISO_OFFSET_X : 0;
        const rdy = useAccent ? RISO_OFFSET_Y : 0;
        lFg.fillRect(tp.x + rdx, tp.y + rdy, tSize, tSize);
      }

      lFg.globalAlpha = p.alpha;
      const headAccent = p.alpha > 0.45;
      lFg.fillStyle   = headAccent ? accStr : dotStr;
      const hdx = headAccent ? RISO_OFFSET_X : 0;
      const hdy = headAccent ? RISO_OFFSET_Y : 0;
      lFg.fillRect(px + hdx, py + hdy, p.size, p.size);

      // Arp head leaves sediment trail — memoria delle orbite
      if (lOv) {
        lOv.globalAlpha = p.alpha * 0.30;
        lOv.fillStyle   = headAccent ? accStr : dotStr;
        lOv.fillRect(px, py, p.size, p.size);
        lOv.globalAlpha = 1;
      }
    }
    if (lFg) lFg.globalAlpha = 1;
  }

  if (lFg) restoreCameraTransform(lFg);

  // ── Composite layers: BG → MG(breath) → FG(blocchi+arp) → OVERLAY(sediment α0.5) ──
  compositeLayers(ctx);
}

export function destroy() {
  _blocks       = [];
  _arpParticles = [];
  _onsetShake   = 0;
  clearAllLayers();
}
