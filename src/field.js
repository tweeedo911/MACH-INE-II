// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Halftone Density Field + Bayer Dither Render
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { audio } from './audio.js';
import { getNotePosition } from './midi-patterns.js';
import { dna, getZone, primitiveDensity, isInVuoto } from './dna.js';
import { entityDensityAt, entityColorAt } from './generations.js';
import {
  inverted, invertDissolving, invertDissolveProgress, invertTarget,
  climaxProgress, inClimax, getCellColor, getMidiColor,
} from './colors.js';

// ── Bayer 8x8 ──
const BAYER8 = new Float32Array([
   0/64, 32/64,  8/64, 40/64,  2/64, 34/64, 10/64, 42/64,
  48/64, 16/64, 56/64, 24/64, 50/64, 18/64, 58/64, 26/64,
  12/64, 44/64,  4/64, 36/64, 14/64, 46/64,  6/64, 38/64,
  60/64, 28/64, 52/64, 20/64, 62/64, 30/64, 54/64, 22/64,
   3/64, 35/64, 11/64, 43/64,  1/64, 33/64,  9/64, 41/64,
  51/64, 19/64, 59/64, 27/64, 49/64, 17/64, 57/64, 25/64,
  15/64, 47/64,  7/64, 39/64, 13/64, 45/64,  5/64, 37/64,
  63/64, 31/64, 55/64, 23/64, 61/64, 29/64, 53/64, 21/64,
]);

// ── Onset waves ──
export let onsetWaves = [];

export function addOnsetWave(cx, cy, W, H) {
  onsetWaves.push({ cx: cx * W, cy: cy * H, radius: 0, alpha: 1 });
}

// ── MIDI note trail ──
// Each note leaves a hot-spot positioned by midi-patterns.js
// Repeated notes reinforce — loops become persistent patterns
const MAX_TRAIL = 64;
export let midiTrail = [];

export function addMidiNote(ch, noteNorm, velNorm) {
  const pos = getNotePosition(ch, noteNorm, velNorm);
  if (!pos) return;

  // Reinforce: if a similar note exists from same channel, boost it
  for (const n of midiTrail) {
    if (n.ch === ch && Math.abs(n.x - pos.x) < 0.04 && Math.abs(n.y - pos.y) < 0.04) {
      n.alpha = Math.min(1, n.alpha + velNorm * 0.5);
      n.vel = Math.max(n.vel, velNorm);
      n.time = 0;
      return;
    }
  }

  midiTrail.push({
    x: pos.x, y: pos.y,
    vel: velNorm, alpha: 1,
    radius: pos.radius,
    decay: pos.decay,
    shape: pos.shape,
    color: pos.color,
    ch: ch,
    time: 0,
  });

  if (midiTrail.length > MAX_TRAIL) midiTrail.shift();
}

export function updateWaves(dt) {
  for (let i = onsetWaves.length - 1; i >= 0; i--) {
    const w = onsetWaves[i];
    w.radius += CFG.onsetWaveSpeed * dt;
    w.alpha *= CFG.onsetDecayRate;
    if (w.alpha < 0.01) onsetWaves.splice(i, 1);
  }
  // Trail notes fade slowly — melodic contour persists
  for (let i = midiTrail.length - 1; i >= 0; i--) {
    const n = midiTrail[i];
    n.time += dt;
    // Use per-note decay from midi-patterns (defaults to 0.97 if missing)
    n.alpha *= n.decay || 0.97;
    if (n.alpha < 0.01) midiTrail.splice(i, 1);
  }
}

// ── MIDI color field: returns [ch, alpha] for the dominant MIDI note at this point ──
// Color area is 2.5× larger than density area — color bleeds beyond the geometry
function midiColorAt(nx, ny) {
  let bestCh = -1, bestAlpha = 0;
  for (const n of midiTrail) {
    if (n.alpha < 0.03 || n.color === null) continue;
    const dx = nx - n.x, dy = ny - n.y;

    let influence = 0;
    if (n.shape === 'pulse') {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ringRadius = n.radius * (1 + n.time * 3);
      const colorWidth = 0.06 + n.radius * 0.4;  // wider than density ring
      const ringDist = Math.abs(dist - ringRadius);
      if (ringDist < colorWidth) influence = (1 - ringDist / colorWidth) * n.alpha * n.vel;
    } else if (n.shape === 'blob') {
      const breathe = 1 + Math.sin(n.time * 2.5) * 0.25;
      const r = n.radius * 2.5 * breathe;  // 2.5× density radius
      const dist2 = dx * dx + dy * dy;
      if (dist2 < r * r) influence = Math.exp(-dist2 / (r * r * 0.5)) * n.alpha * n.vel;
    } else if (n.shape === 'band') {
      const bandH = n.radius * 1.5;  // wider color band
      if (Math.abs(dy) < bandH) {
        const xFade = 1 - Math.pow(Math.abs(nx - 0.5) * 2, 3);
        influence = (1 - Math.abs(dy) / bandH) * xFade * n.alpha * n.vel;
      }
    } else if (n.shape === 'trail') {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const r = n.radius * 2.5;
      if (dist < r) influence = (1 - dist / r) * n.alpha * n.vel;
    } else {
      // scatter — small color spots
      const dist = Math.sqrt(dx * dx + dy * dy);
      const r = n.radius * 1.5;
      if (dist < r) influence = (1 - dist / r) * n.alpha * n.vel * 0.6;
    }

    if (influence > bestAlpha) {
      bestAlpha = influence;
      bestCh = n.color;
    }
  }

  // Trail contour lines also carry color
  if (midiTrail.length >= 2) {
    for (let i = 1; i < midiTrail.length; i++) {
      const a = midiTrail[i - 1], b = midiTrail[i];
      if (a.shape !== 'trail' || b.shape !== 'trail' || a.ch !== b.ch) continue;
      if (a.color === null || a.alpha < 0.05 || b.alpha < 0.05) continue;
      const abx = b.x - a.x, aby = b.y - a.y;
      const abLen2 = abx * abx + aby * aby;
      if (abLen2 < 0.0001) continue;
      const t = Math.max(0, Math.min(1, ((nx - a.x) * abx + (ny - a.y) * aby) / abLen2));
      const px2 = a.x + t * abx, py2 = a.y + t * aby;
      const lineDist = Math.sqrt((nx - px2) * (nx - px2) + (ny - py2) * (ny - py2));
      const colorWidth = 0.04;
      if (lineDist < colorWidth) {
        const lineAlpha = Math.min(a.alpha, b.alpha) * (1 - lineDist / colorWidth) * 0.7;
        if (lineAlpha > bestAlpha) { bestAlpha = lineAlpha; bestCh = a.color; }
      }
    }
  }

  return [bestCh, bestAlpha];
}

// ── Smoothed intensity for low-reactivity zones (very slow) ──
let smoothedIntensity = 0;

// ── Total density at point ──
function computeDensity(nx, ny, px, py, state, globalTime, W, H) {
  if (isInVuoto(nx, ny)) return 0;

  const zone = getZone(nx, ny);
  const r = zone.reactivity;

  // Zone reactivity: low-r zones use their own slow-moving baseline
  // r=0 → completely decoupled from live audio, only slow average
  // r=1 → fully tracks live intensity
  const localIntensity = state.intensity * r + smoothedIntensity * (1 - r);
  const intCurve = Math.pow(localIntensity, 1.5);
  let d = CFG.densityBase + (CFG.densityMax - CFG.densityBase) * intCurve;

  d += state.brightness * CFG.brightnessDensityBoost * localIntensity;

  // Flicker only in reactive zones
  if (r > 0.3 && state.rhythmicity > 0.01) {
    const speed = zone.flickerSpeed || CFG.rhythmFlickerSpeed;
    const flickerT = globalTime * speed + zone.flickerPhase * Math.PI * 2;
    const amp = zone.flickerAmp || CFG.rhythmFlickerAmp;
    // Scale flicker by reactivity squared — only clearly reactive zones pulse
    d += Math.sin(flickerT * Math.PI * 2) * amp * state.rhythmicity * r * r;
  }
  d *= zone.densityMul;

  if (state.stereoWidth < 1) {
    const centerDist = Math.abs(nx - 0.5) * 2;
    d *= 1 - Math.pow(centerDist, CFG.widthCenterFalloff * (1 - state.stereoWidth)) * (1 - state.stereoWidth);
  }

  if (state.trajectory === 1) d += (1 - ny) * 0.15 * localIntensity;
  else if (state.trajectory === -1) d += ny * 0.15 * localIntensity;

  // Frequency bands → spatial regions (frequencies "open" screen areas)
  // sub/low → bottom, mid → center, high/air → top
  const bandAvg = (band) => (band.L + band.R) * 0.5;
  const subLow = bandAvg(audio.bands.sub) * 0.6 + bandAvg(audio.bands.low) * 0.4;
  const mid = bandAvg(audio.bands.mid);
  const highAir = bandAvg(audio.bands.high) * 0.6 + bandAvg(audio.bands.air) * 0.4;

  // Each band boosts density in its vertical zone with soft falloff
  if (ny > 0.6) d += subLow * 0.35 * (ny - 0.6) / 0.4;       // bottom 40%
  else if (ny > 0.3) d += mid * 0.25 * (1 - Math.abs(ny - 0.5) / 0.2);  // center
  if (ny < 0.4) d += highAir * 0.3 * (0.4 - ny) / 0.4;        // top 40%

  const pd = primitiveDensity(nx, ny, state, W, H);
  if (pd === -1) return 0;
  d += pd;

  d += entityDensityAt(nx, ny, W, H);

  for (const w of onsetWaves) {
    const dx = px - w.cx, dy = py - w.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ringDist = Math.abs(dist - w.radius);
    if (ringDist < CFG.onsetWaveWidth) {
      d = Math.max(d, (1 - ringDist / CFG.onsetWaveWidth) * CFG.onsetWaveDensity * w.alpha);
    }
  }

  // MIDI note trail — shape-specific geometry per instrument role
  for (const n of midiTrail) {
    if (n.alpha < 0.02) continue;
    const dx = nx - n.x, dy = ny - n.y;

    if (n.shape === 'pulse') {
      // KICK: expanding ring — density on the ring edge, not filled
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ringRadius = n.radius * (1 + n.time * 3); // expands over time
      const ringWidth = 0.03 + n.radius * 0.15;
      const ringDist = Math.abs(dist - ringRadius);
      if (ringDist < ringWidth) {
        const falloff = 1 - ringDist / ringWidth;
        d = Math.max(d, falloff * n.vel * n.alpha);
      }
    } else if (n.shape === 'blob') {
      // BASS: large soft gaussian, breathes with time
      const breathe = 1 + Math.sin(n.time * 2.5) * 0.25;
      const r = n.radius * 1.5 * breathe;
      const dist2 = dx * dx + dy * dy;
      const r2 = r * r;
      if (dist2 < r2) {
        const gauss = Math.exp(-dist2 / (r2 * 0.4));
        d = Math.max(d, gauss * n.vel * n.alpha * 0.85);
      }
    } else if (n.shape === 'band') {
      // HARMONY: horizontal stripe at note y, full width
      const bandH = n.radius * 0.8;
      const bandDist = Math.abs(dy);
      if (bandDist < bandH) {
        const falloff = 1 - bandDist / bandH;
        // Taper at edges of x
        const xFade = 1 - Math.pow(Math.abs(nx - 0.5) * 2, 3);
        d = Math.max(d, falloff * xFade * n.vel * n.alpha * 0.7);
      }
    } else if (n.shape === 'scatter') {
      // TEXTURE: small dispersed grains — handled as small radius with jitter
      const dist = Math.sqrt(dx * dx + dy * dy);
      const r = n.radius * 0.6;
      if (dist < r) {
        const falloff = 1 - dist / r;
        d = Math.max(d, falloff * n.vel * n.alpha * 0.5);
      }
    } else {
      // trail and fallback: point density
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < n.radius) {
        const falloff = 1 - dist / n.radius;
        d = Math.max(d, falloff * n.vel * n.alpha * 0.8);
      }
    }
  }

  // Melodic contour: lines between consecutive TRAIL notes of same channel
  if (midiTrail.length >= 2) {
    for (let i = 1; i < midiTrail.length; i++) {
      const a = midiTrail[i - 1], b = midiTrail[i];
      if (a.shape !== 'trail' || b.shape !== 'trail') continue;
      if (a.ch !== b.ch) continue;
      if (a.alpha < 0.05 || b.alpha < 0.05) continue;
      const abx = b.x - a.x, aby = b.y - a.y;
      const abLen2 = abx * abx + aby * aby;
      if (abLen2 < 0.0001) continue;
      const t = Math.max(0, Math.min(1, ((nx - a.x) * abx + (ny - a.y) * aby) / abLen2));
      const px2 = a.x + t * abx, py2 = a.y + t * aby;
      const lineDist = Math.sqrt((nx - px2) * (nx - px2) + (ny - py2) * (ny - py2));
      const lineWidth = 0.02;
      if (lineDist < lineWidth) {
        const lineAlpha = Math.min(a.alpha, b.alpha) * 0.6;
        d = Math.max(d, (1 - lineDist / lineWidth) * lineAlpha * 0.7);
      }
    }
  }

  if (inClimax) d += CFG.climaxDensityBoost * climaxProgress;

  return Math.max(0, Math.min(1, d));
}

// ── Render: fillRect path (large dots) ──
function renderFillRect(ctx, dotSize, state, globalTime, W, H) {
  const cols = Math.ceil(W / dotSize);
  const rows = Math.ceil(H / dotSize);
  let lastFill = '';

  for (let row = 0; row < rows; row++) {
    const py = row * dotSize, ny = py / H;
    for (let col = 0; col < cols; col++) {
      const px = col * dotSize, nx = px / W;

      let cellInv = inverted;
      if (invertDissolving) {
        const bayerVal = BAYER8[(row & 7) * 8 + (col & 7)];
        cellInv = invertDissolveProgress > bayerVal ? invertTarget : inverted;
      }

      const zone = getZone(nx, ny);
      const thresholdShift = (1 - zone.dotSizeMul) * 0.3;
      const threshold = Math.max(CFG.densityFloor, Math.min(1, BAYER8[(row & 7) * 8 + (col & 7)] + thresholdShift));
      const density = computeDensity(nx, ny, px, py, state, globalTime, W, H);
      if (density > threshold) {
        const zDot = Math.max(1, Math.round(dotSize * zone.dotSizeMul));
        const fgVal = cellInv ? 0 : 255;
        // Check MIDI color first (larger area), then entity color
        const [mCh, mAlpha] = midiColorAt(nx, ny);
        let fill;
        if (mCh >= 0 && mAlpha > 0.03) {
          const mc = getMidiColor(mCh, mAlpha, fgVal);
          if (mc) fill = `rgb(${mc[0]},${mc[1]},${mc[2]})`;
        }
        if (!fill) {
          const [cId, cAlpha] = entityColorAt(nx, ny, W, H);
          const cellColor = getCellColor(cId, cAlpha, fgVal);
          if (cellColor) fill = `rgb(${cellColor[0]},${cellColor[1]},${cellColor[2]})`;
          else fill = cellInv ? '#000000' : '#FFFFFF';
        }
        if (fill !== lastFill) { ctx.fillStyle = fill; lastFill = fill; }
        ctx.fillRect(px, py, zDot, zDot);
      }
    }
  }
}

// ── Render: buffer path (small dots) ──
let bufferCanvas = null, bufferCtx = null;

function renderBuffer(ctx, dotSize, state, globalTime, W, H) {
  const bw = Math.ceil(W / dotSize), bh = Math.ceil(H / dotSize);

  if (!bufferCanvas || bufferCanvas.width !== bw || bufferCanvas.height !== bh) {
    bufferCanvas = document.createElement('canvas');
    bufferCanvas.width = bw; bufferCanvas.height = bh;
    bufferCtx = bufferCanvas.getContext('2d');
  }

  const imgData = bufferCtx.createImageData(bw, bh);
  const data = imgData.data;
  const fgVal = inverted ? 0 : 255;

  for (let row = 0; row < bh; row++) {
    const ny = row / bh, py = row * dotSize;
    for (let col = 0; col < bw; col++) {
      const nx = col / bw, px = col * dotSize;

      let cellFg = fgVal;
      if (invertDissolving) {
        const bayerVal = BAYER8[(row & 7) * 8 + (col & 7)];
        cellFg = invertDissolveProgress > bayerVal ? (invertTarget ? 0 : 255) : fgVal;
      }

      const zone = getZone(nx, ny);
      const thresholdShift = (1 - zone.dotSizeMul) * 0.3;
      const threshold = Math.max(CFG.densityFloor, Math.min(1, BAYER8[(row & 7) * 8 + (col & 7)] + thresholdShift));
      const density = computeDensity(nx, ny, px, py, state, globalTime, W, H);
      const idx = (row * bw + col) * 4;
      if (density > threshold) {
        // Check MIDI color first, then entity color
        const [mCh, mAlpha] = midiColorAt(nx, ny);
        let colored = false;
        if (mCh >= 0 && mAlpha > 0.03) {
          const mc = getMidiColor(mCh, mAlpha, cellFg);
          if (mc) { data[idx] = mc[0]; data[idx+1] = mc[1]; data[idx+2] = mc[2]; colored = true; }
        }
        if (!colored) {
          const [cId, cAlpha] = entityColorAt(nx, ny, W, H);
          const cellColor = getCellColor(cId, cAlpha, cellFg);
          if (cellColor) { data[idx] = cellColor[0]; data[idx+1] = cellColor[1]; data[idx+2] = cellColor[2]; }
          else { data[idx] = cellFg; data[idx+1] = cellFg; data[idx+2] = cellFg; }
        }
        data[idx+3] = 255;
      }
    }
  }

  bufferCtx.putImageData(imgData, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bufferCanvas, 0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
}

// ── MATRICE render ──
function drawMatrice(ctx, state, globalTime, W, H) {
  if (!dna || !dna.primitives.includes('MATRICE')) return;
  const cs = dna.matrice.cellSize;
  const cols = Math.ceil(W / cs), rows = Math.ceil(H / cs);
  const chars = dna.matrice.chars;

  ctx.font = `${cs - 2}px 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let row = 0; row < rows; row++) {
    const ny = row / rows;
    for (let col = 0; col < cols; col++) {
      const nx = col / cols;
      const d = entityDensityAt(nx, ny, W, H) + state.intensity * 0.3;
      if (d < 0.15 || Math.random() > d) continue;
      const charIdx = Math.floor((globalTime * state.rhythmicity * 3 + col * 7 + row * 13) % chars.length);
      const alpha = Math.min(1, d) * 0.7;
      const fgVal = inverted ? 0 : 255;
      const [cId, cAlpha] = entityColorAt(nx, ny, W, H);
      const cellColor = getCellColor(cId, cAlpha, fgVal);
      if (cellColor) ctx.fillStyle = `rgba(${cellColor[0]},${cellColor[1]},${cellColor[2]},${alpha})`;
      else ctx.fillStyle = inverted ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
      ctx.fillText(chars[charIdx], col * cs + cs / 2, row * cs + cs / 2);
    }
  }
}

// ── Smoothed brightness for stable base dot size ──
let smoothedBrightness = 0;

// ── Public render entry point ──
export function renderField(ctx, W, H, state, globalTime) {
  // Update smoothed intensity for low-reactivity zones
  // 0.0008 ≈ 60s to converge — inert zones evolve on a geological timescale
  smoothedIntensity += (state.intensity - smoothedIntensity) * 0.0008;

  // Smoothed brightness for stable base dot size — changes over ~10s, not per-beat
  smoothedBrightness += (state.brightness - smoothedBrightness) * 0.003;

  let dotSize = Math.max(1, Math.round(CFG.dotSizeMax - (CFG.dotSizeMax - CFG.dotSizeMin) * smoothedBrightness));

  if (climaxProgress > 0.1) {
    const compress = 1 - (1 - CFG.climaxDotCompress) * climaxProgress;
    dotSize = Math.max(1, Math.round(dotSize * compress));
  }

  if (dotSize >= CFG.dotSizeBufferThreshold) {
    renderFillRect(ctx, dotSize, state, globalTime, W, H);
  } else {
    renderBuffer(ctx, dotSize, state, globalTime, W, H);
  }

  drawMatrice(ctx, state, globalTime, W, H);

  // Climax overlay
  if (climaxProgress > 0.01) {
    ctx.fillStyle = `rgba(230,0,126,${climaxProgress * 0.08})`;
    ctx.fillRect(0, 0, W, H);
  }
}
