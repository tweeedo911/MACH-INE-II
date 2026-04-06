// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: QUADRATI
//  Blocchi rettangolari asimmetrici che pulsano col groove.
//  SOLCO: kick illumina, bass dimensiona, chords colorano.
//  v3: breathing field, sediment, onset shake, drift, orbit trail
//       arp su CH6=LEAD, destroy pulito, overlay alpha separato
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, fillBayer, rgbString, hexToRgb, lerpColor,
  lerp, clamp, rng, seedRng, noiseAt,
  renderBreathingField, Sediment, applyCameraTransform, restoreCameraTransform,
} from './visual-toolkit.js';

// ── Phase parameters ──
// breathAlpha: intensità del campo halftone di sfondo
// sedimentRate: persistenza del buffer sediment (0=sparisce subito, 1=eterno)
const PHASE_PARAMS = {
  germoglio:    {
    blocks: 2,  fillDensity: 0.15, flashIntensity: 0.3,  arpVisible: false,
    breathAlpha: 0.05, sedimentRate: 0.92,
  },
  pulsazione:   {
    blocks: 4,  fillDensity: 0.35, flashIntensity: 0.6,  arpVisible: false,
    breathAlpha: 0.12, sedimentRate: 0.88,
  },
  densita:      {
    blocks: 6,  fillDensity: 0.55, flashIntensity: 0.85, arpVisible: true,
    breathAlpha: 0.20, sedimentRate: 0.85,
  },
  rottura:      {
    blocks: 8,  fillDensity: 0.80, flashIntensity: 1.0,  arpVisible: true,
    breathAlpha: 0.35, sedimentRate: 0.78,
  },
  dissoluzione: {
    blocks: 3,  fillDensity: 0.20, flashIntensity: 0.3,  arpVisible: false,
    breathAlpha: 0.08, sedimentRate: 0.93,
  },
};

// ── Module state ──
let _blocks       = [];
let _arpParticles = [];
let _time         = 0;
let _params       = { ...PHASE_PARAMS.germoglio };
let _onsetShake   = 0;
let _sediment     = null;

// ── Block generation ──
// Velocità di drift fissa per blocco (deterministiche, non ricalcolate per frame).
// La spec "random per frame * 0.001" si ottiene moltiplicando le velocità per dt ogni tick.
function generateBlocks(count) {
  _blocks = [];
  seedRng(42);
  for (let i = 0; i < count; i++) {
    const w  = 0.08 + rng() * 0.18;
    const h  = 0.06 + rng() * 0.14;
    const x  = 0.05 + rng() * (0.85 - w);
    const y  = 0.05 + rng() * (0.85 - h);
    // Drift costante in normalized-space, scala con dt × 60
    const vx = (rng() - 0.5) * 0.002;
    const vy = (rng() - 0.5) * 0.002;
    _blocks.push({
      x,  y,
      ox: x,  oy: y,      // origine per ritorno morbido post-kick
      w,  h,
      vx, vy,
      flash:       0,
      accentFlash: 0,
      shakeX:      0,
      shakeY:      0,
      jumpX:       0,
      jumpY:       0,
      // fase individuale per il respiro bass (scale-breathe)
      breathPhase: rng() * Math.PI * 2,
    });
  }
}

// ─────────────────────────────────────────────────────────────
export function init(env) {
  _time         = 0;
  _arpParticles = [];
  _onsetShake   = 0;
  _sediment     = new Sediment();

  const phase = env.worldState.phase || 'germoglio';
  _params = { ...(PHASE_PARAMS[phase] || PHASE_PARAMS.germoglio) };
  generateBlocks(_params.blocks);
}

// ─────────────────────────────────────────────────────────────
export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, audio, state, dt } = env;
  _time += dt;

  // ── Interpolazione parametri di fase ──
  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  _params.fillDensity    += (target.fillDensity    - _params.fillDensity)    * 0.03;
  _params.flashIntensity += (target.flashIntensity - _params.flashIntensity) * 0.03;
  _params.breathAlpha    += (target.breathAlpha    - _params.breathAlpha)    * 0.03;
  _params.sedimentRate   += (target.sedimentRate   - _params.sedimentRate)   * 0.03;
  _params.arpVisible      = target.arpVisible;

  // Rigenera blocchi solo se la differenza di conteggio è significativa
  if (Math.abs(_blocks.length - target.blocks) >= 2) {
    generateBlocks(target.blocks);
  }

  // ── Palette ──
  const bgRgb  = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent
    ? hexToRgb(worldState.palette.accent)
    : dotRgb;

  // ── Estrazione segnali MIDI ──
  let kickFlash = 0, bassEnergy = 0, chordActive = false, kickHit = false;
  for (const n of midiTrail) {
    // CH0 = KICK — illumina i blocchi
    if (n.ch === 0 && n.alpha > 0.3) {
      kickFlash = Math.max(kickFlash, n.alpha);
      if (n.alpha > 0.7) kickHit = true;
    }
    // CH3 = BASS — dimensiona i blocchi (scale-breathe)
    if (n.ch === 3 && n.alpha > 0.2) {
      bassEnergy = Math.max(bassEnergy, n.alpha * (n.vel || 0.8));
    }
    // CH4 = CHORDS — colora i blocchi
    if (n.ch === 4 && n.alpha > 0.3) chordActive = true;
  }

  // ── Accumulo onset shake (strength×6, decay 0.88) ──
  for (const w of onsetWaves) {
    _onsetShake += w.strength * 6;
  }
  _onsetShake *= 0.88;
  _onsetShake  = clamp(_onsetShake, 0, 18);

  // ── Background solido ──
  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  // ── 1. Breathing halftone field (dietro ai blocchi) ──
  if (_params.breathAlpha > 0.01) {
    const dotColorStr = rgbString(dotRgb[0], dotRgb[1], dotRgb[2]);
    renderBreathingField(ctx, W, H, audio, state, _time, 8, dotColorStr, _params.breathAlpha);
  }

  // ── Camera transform: zoom grounded (SOLCO è radicato), shake punta ──
  applyCameraTransform(ctx, W, H, {
    zoom:        1.0,
    driftX:      0,
    driftY:      0,
    shakeAmount: _onsetShake,
    time:        _time,
  });

  // ── 2. Sediment decay ──
  _sediment.decay(W, H, _params.sedimentRate);
  const sedCtx = _sediment.getCtx();

  const isRottura = worldState.phase === 'rottura';
  const rmsBoost  = (audio && audio.rms) ? audio.rms * 0.2 : 0;

  // ── 3. Blocchi ──
  for (let i = 0; i < _blocks.length; i++) {
    const b = _blocks[i];

    // Flash da kick
    b.flash = lerp(b.flash, kickFlash * _params.flashIntensity, 0.3);
    b.flash *= 0.92;

    // Accento da chord
    b.accentFlash = lerp(b.accentFlash, chordActive ? 0.6 : 0, 0.1);
    b.accentFlash *= 0.95;

    // Shake per-blocco: direzione dipende dalla posizione e dal tempo
    b.shakeX = Math.sin(_time * 47 + i * 1.7) * _onsetShake * 0.004;
    b.shakeY = Math.cos(_time * 53 + i * 2.3) * _onsetShake * 0.004;

    // Kick jump: scatto brusco → ritorno esponenziale
    if (kickHit) {
      b.jumpX = (Math.random() - 0.5) * 0.015;
      b.jumpY = (Math.random() - 0.5) * 0.015;
    }
    b.jumpX *= 0.85;
    b.jumpY *= 0.85;

    // Drift costante con wrap morbido ai bordi
    b.x += b.vx * dt * 60;
    b.y += b.vy * dt * 60;
    if (b.x < -b.w)  b.x = 1.0;
    if (b.x >  1.0)  b.x = -b.w;
    if (b.y < -b.h)  b.y = 1.0;
    if (b.y >  1.0)  b.y = -b.h;

    // Bass breathe: scala oscilla con offset di fase individuale
    const breathe = 1 + Math.sin(_time * 1.8 + b.breathPhase) * bassEnergy * 0.12;

    // Rottura: i blocchi possono sovrapporsi e sanguinare (densità extra)
    const densityBoost = isRottura ? rmsBoost + 0.08 : rmsBoost;
    const density  = clamp(_params.fillDensity + b.flash * 0.4 + densityBoost, 0, 1);
    const dotSize  = Math.max(3, Math.round(lerp(8, 4, density)));

    const sizeMul = breathe + bassEnergy * 0.2;
    const bx = (b.x + b.jumpX + b.shakeX) * W;
    const by = (b.y + b.jumpY + b.shakeY) * H;
    const bw = b.w * sizeMul * W;
    const bh = b.h * sizeMul * H;

    // Colore: accento chord se attivo, altrimenti dot palette
    const blockRgb = b.accentFlash > 0.1
      ? lerpColor(dotRgb, accRgb, b.accentFlash)
      : dotRgb;
    const colorStr = rgbString(blockRgb[0], blockRgb[1], blockRgb[2]);

    // Disegna sul canvas principale
    fillBayer(ctx, bx, by, bw, bh, density, dotSize, colorStr);

    // Disegna nel buffer sediment (densità ridotta, dot leggermente più grande)
    fillBayer(sedCtx, bx, by, bw, bh, density * 0.7, dotSize + 1, colorStr);
  }

  // ── 4. Composita sediment sul canvas principale ──
  ctx.globalAlpha = 0.5;
  _sediment.composite(ctx);
  ctx.globalAlpha = 1;

  // ── 5. Arp particles — CH6=LEAD, orbite imperfette, trail ──
  // CH6 è il canale arp in SOLCO (register arp:[60,84], velocità media)
  if (_params.arpVisible) {
    for (const n of midiTrail) {
      // Triggera su CH6=LEAD (arp SOLCO) o CH7=RUPTURE in rottura
      const isArpCh = n.ch === 6 || (isRottura && n.ch === 7);
      if (isArpCh && n.time < dt * 2 && n.alpha > 0.5) {
        const bi     = Math.floor((n.note || 60) * _blocks.length / 128) % _blocks.length;
        const block  = _blocks[bi] || _blocks[0];
        if (block) {
          const baseRadius = Math.max(block.w, block.h) * W * 0.6;
          // Burst: 3-6 particelle per nota (più dense in rottura)
          const spawnCount = isRottura
            ? 4 + Math.floor(Math.random() * 3)
            : 3 + Math.floor(Math.random() * 3);
          for (let k = 0; k < spawnCount; k++) {
            _arpParticles.push({
              cx:          (block.x + block.w * 0.5) * W,
              cy:          (block.y + block.h * 0.5) * H,
              angle:       Math.random() * Math.PI * 2,
              // Raggio con wobble casuale — non cerchi perfetti
              radiusBase:  baseRadius * (0.4 + Math.random() * 0.9),
              radiusWobble: baseRadius * (0.10 + Math.random() * 0.15),
              wobblePhase: Math.random() * Math.PI * 2,
              wobbleSpeed: 0.6 + Math.random() * 3.2,
              // Dimensione variata: da 1px a 5px
              size:        1 + Math.random() * 4,
              alpha:       (n.vel || 0.7) * (0.55 + Math.random() * 0.45),
              // Velocità orbitale: mix di lente e veloci, cw e ccw
              speed:       (0.6 + Math.random() * 3.0) * (Math.random() < 0.5 ? 1 : -1),
              // Piccolo offset radiale costante per randomizzare l'orbita
              radialOffset: (Math.random() - 0.5) * baseRadius * 0.2,
              trail:       [],
            });
          }
        }
      }
    }

    // Cap a 150 particelle — swap-and-pop per evitare splice in loop
    if (_arpParticles.length > 150) {
      _arpParticles.splice(0, _arpParticles.length - 150);
    }

    const accStr = rgbString(accRgb[0], accRgb[1], accRgb[2]);
    const dotStr = rgbString(dotRgb[0], dotRgb[1], dotRgb[2]);

    for (let i = _arpParticles.length - 1; i >= 0; i--) {
      const p = _arpParticles[i];

      // Raggio che respira — orbita imperfetta, non circolare
      const r = p.radiusBase
              + p.radialOffset
              + Math.sin(_time * p.wobbleSpeed + p.wobblePhase) * p.radiusWobble;

      const px = p.cx + Math.cos(p.angle) * r;
      const py = p.cy + Math.sin(p.angle) * r;

      // Trail: ultimi 4 punti
      p.trail.push({ x: px, y: py });
      if (p.trail.length > 4) p.trail.shift();

      p.angle += p.speed * dt;
      p.alpha *= 0.970;

      // Rimuovi con swap-and-pop
      if (p.alpha < 0.03) {
        _arpParticles[i] = _arpParticles[_arpParticles.length - 1];
        _arpParticles.length--;
        continue;
      }

      // Disegna trail (punti precedenti, alpha degradante)
      for (let t = 0; t < p.trail.length - 1; t++) {
        const tp     = p.trail[t];
        const tAlpha = p.alpha * (t + 1) / p.trail.length * 0.4;
        if (tAlpha < 0.02) continue;
        ctx.globalAlpha = tAlpha;
        ctx.fillStyle   = tAlpha > 0.12 ? accStr : dotStr;
        const tSize = Math.max(1, p.size * 0.45);
        ctx.fillRect(tp.x, tp.y, tSize, tSize);
      }

      // Disegna testa particella
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.alpha > 0.45 ? accStr : dotStr;
      ctx.fillRect(px, py, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  restoreCameraTransform(ctx);
}

// ─────────────────────────────────────────────────────────────
export function destroy() {
  _blocks       = [];
  _arpParticles = [];
  _sediment     = null;   // il canvas offscreen viene raccolto dal GC
  _onsetShake   = 0;
}
