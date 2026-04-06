// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: QUADRATI
//  Blocchi rettangolari asimmetrici che pulsano col groove.
//  SOLCO: kick illumina, bass dimensiona, chords colorano.
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, fillBayer, rgbString, hexToRgb, lerpColor,
  lerp, clamp, rng, seedRng, noiseAt,
} from './visual-toolkit.js';

const PHASE_PARAMS = {
  germoglio:    { blocks: 2, fillDensity: 0.15, flashIntensity: 0.3, arpVisible: false },
  pulsazione:   { blocks: 4, fillDensity: 0.35, flashIntensity: 0.6, arpVisible: false },
  densita:      { blocks: 6, fillDensity: 0.55, flashIntensity: 0.85, arpVisible: true },
  rottura:      { blocks: 8, fillDensity: 0.80, flashIntensity: 1.0, arpVisible: true },
  dissoluzione: { blocks: 3, fillDensity: 0.20, flashIntensity: 0.3, arpVisible: false },
};

let _blocks = [];
let _arpParticles = [];
let _time = 0;
let _params = { ...PHASE_PARAMS.germoglio };

function generateBlocks(count) {
  _blocks = [];
  seedRng(42);
  for (let i = 0; i < count; i++) {
    const w = 0.08 + rng() * 0.18;
    const h = 0.06 + rng() * 0.14;
    const x = 0.05 + rng() * (0.85 - w);
    const y = 0.05 + rng() * (0.85 - h);
    _blocks.push({ x, y, w, h, flash: 0, accentFlash: 0, shakeX: 0, shakeY: 0 });
  }
}

export function init(env) {
  _time = 0;
  _arpParticles = [];
  const phase = env.worldState.phase || 'germoglio';
  _params = { ...(PHASE_PARAMS[phase] || PHASE_PARAMS.germoglio) };
  generateBlocks(_params.blocks);
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, audio, midi, dt } = env;
  _time += dt;

  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  _params.fillDensity += (target.fillDensity - _params.fillDensity) * 0.03;
  _params.flashIntensity += (target.flashIntensity - _params.flashIntensity) * 0.03;
  _params.arpVisible = target.arpVisible;

  if (Math.abs(_blocks.length - target.blocks) >= 2) {
    generateBlocks(target.blocks);
  }

  const bgRgb = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;

  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  let kickFlash = 0, bassEnergy = 0, chordActive = false;
  for (const n of midiTrail) {
    if (n.ch === 0 && n.alpha > 0.3) kickFlash = Math.max(kickFlash, n.alpha);
    if (n.ch === 3 && n.alpha > 0.2) bassEnergy = Math.max(bassEnergy, n.alpha * n.vel);
    if (n.ch === 4 && n.alpha > 0.3) chordActive = true;
  }

  let shakeAmt = 0;
  for (const w of onsetWaves) {
    shakeAmt += w.strength * 3;
  }

  for (let i = 0; i < _blocks.length; i++) {
    const b = _blocks[i];

    b.flash = lerp(b.flash, kickFlash * _params.flashIntensity, 0.3);
    b.flash *= 0.92;

    b.accentFlash = lerp(b.accentFlash, chordActive ? 0.6 : 0, 0.1);
    b.accentFlash *= 0.95;

    b.shakeX = (Math.random() - 0.5) * shakeAmt * 0.005;
    b.shakeY = (Math.random() - 0.5) * shakeAmt * 0.005;

    const sizeMul = 1 + bassEnergy * 0.3;
    const bx = (b.x + b.shakeX) * W;
    const by = (b.y + b.shakeY) * H;
    const bw = b.w * sizeMul * W;
    const bh = b.h * sizeMul * H;

    const density = clamp(_params.fillDensity + b.flash * 0.4, 0, 1);
    const dotSize = Math.max(3, Math.round(lerp(8, 4, density)));

    const blockRgb = b.accentFlash > 0.1
      ? lerpColor(dotRgb, accRgb, b.accentFlash)
      : dotRgb;

    const colorStr = rgbString(blockRgb[0], blockRgb[1], blockRgb[2]);
    fillBayer(ctx, bx, by, bw, bh, density, dotSize, colorStr);
  }

  if (_params.arpVisible) {
    for (const n of midiTrail) {
      if (n.ch === 7 && n.time < dt * 2 && n.alpha > 0.5) {
        const bi = Math.floor(n.note * _blocks.length) % _blocks.length;
        const block = _blocks[bi] || _blocks[0];
        if (block) {
          _arpParticles.push({
            cx: (block.x + block.w / 2) * W,
            cy: (block.y + block.h / 2) * H,
            angle: Math.random() * Math.PI * 2,
            radius: Math.max(block.w, block.h) * W * 0.6,
            size: 2 + Math.random() * 3,
            alpha: n.vel,
            speed: 1 + Math.random() * 2,
          });
        }
      }
    }
    if (_arpParticles.length > 50) _arpParticles.splice(0, _arpParticles.length - 50);

    const accStr = rgbString(accRgb[0], accRgb[1], accRgb[2]);
    for (let i = _arpParticles.length - 1; i >= 0; i--) {
      const p = _arpParticles[i];
      p.angle += p.speed * dt;
      p.alpha *= 0.97;
      if (p.alpha < 0.03) {
        _arpParticles[i] = _arpParticles[_arpParticles.length - 1];
        _arpParticles.length--;
        continue;
      }
      const px = p.cx + Math.cos(p.angle) * p.radius;
      const py = p.cy + Math.sin(p.angle) * p.radius;
      ctx.fillStyle = accStr;
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(px, py, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}

export function destroy() {
  _blocks = [];
  _arpParticles = [];
}
