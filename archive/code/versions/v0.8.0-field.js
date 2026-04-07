// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Halftone Density Field + Bayer Dither Render
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { dna, getZone, primitiveDensity, isInVuoto } from './dna.js';
import { entityDensityAt, entityColorAt } from './generations.js';
import {
  inverted, invertDissolving, invertDissolveProgress, invertTarget,
  climaxProgress, inClimax, getCellColor,
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

// ── Onset waves + MIDI columns ──
export let onsetWaves = [];
export let midiColumns = [];

export function addOnsetWave(cx, cy, W, H) {
  onsetWaves.push({ cx: cx * W, cy: cy * H, radius: 0, alpha: 1 });
}
export function addMidiColumn(x) {
  midiColumns.push({ x, alpha: 1 });
}

export function updateWaves(dt) {
  for (let i = onsetWaves.length - 1; i >= 0; i--) {
    const w = onsetWaves[i];
    w.radius += CFG.onsetWaveSpeed * dt;
    w.alpha *= CFG.onsetDecayRate;
    if (w.alpha < 0.01) onsetWaves.splice(i, 1);
  }
  for (let i = midiColumns.length - 1; i >= 0; i--) {
    midiColumns[i].alpha *= CFG.midiColumnDecay;
    if (midiColumns[i].alpha < 0.01) midiColumns.splice(i, 1);
  }
}

// ── Total density at point ──
function computeDensity(nx, ny, px, py, state, globalTime, W, H) {
  if (isInVuoto(nx, ny)) return 0;

  const intCurve = state.intensity * state.intensity;
  let d = CFG.densityBase + (CFG.densityMax - CFG.densityBase) * intCurve;

  d += state.brightness * CFG.brightnessDensityBoost * Math.max(0.1, state.intensity);

  const zone = getZone(nx, ny);
  if (state.rhythmicity > 0.01) {
    const flickerT = globalTime * CFG.rhythmFlickerSpeed + zone.flickerPhase * Math.PI * 2;
    d += Math.sin(flickerT * Math.PI * 2) * CFG.rhythmFlickerAmp * state.rhythmicity;
  }
  d *= zone.densityMul;

  if (state.stereoWidth < 1) {
    const centerDist = Math.abs(nx - 0.5) * 2;
    d *= 1 - Math.pow(centerDist, CFG.widthCenterFalloff * (1 - state.stereoWidth)) * (1 - state.stereoWidth);
  }

  if (state.trajectory === 1) d += (1 - ny) * 0.15 * state.intensity;
  else if (state.trajectory === -1) d += ny * 0.15 * state.intensity;

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

  for (const m of midiColumns) {
    const halfW = CFG.midiColumnWidth * 0.5;
    if (Math.abs(nx - m.x) < halfW) {
      d = Math.max(d, (1 - Math.abs(nx - m.x) / halfW) * m.alpha * 0.8);
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
      const threshold = Math.max(0, Math.min(1, BAYER8[(row & 7) * 8 + (col & 7)] + thresholdShift));
      const density = computeDensity(nx, ny, px, py, state, globalTime, W, H);
      if (density > threshold) {
        const zDot = Math.max(1, Math.round(dotSize * zone.dotSizeMul));
        const [cId, cAlpha] = entityColorAt(nx, ny, W, H);
        const fgVal = cellInv ? 0 : 255;
        const cellColor = getCellColor(cId, cAlpha, fgVal);
        let fill;
        if (cellColor) fill = `rgb(${cellColor[0]},${cellColor[1]},${cellColor[2]})`;
        else fill = cellInv ? '#000000' : '#FFFFFF';
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
      const threshold = Math.max(0, Math.min(1, BAYER8[(row & 7) * 8 + (col & 7)] + thresholdShift));
      const density = computeDensity(nx, ny, px, py, state, globalTime, W, H);
      const idx = (row * bw + col) * 4;
      if (density > threshold) {
        const [cId, cAlpha] = entityColorAt(nx, ny, W, H);
        const cellColor = getCellColor(cId, cAlpha, cellFg);
        if (cellColor) { data[idx] = cellColor[0]; data[idx+1] = cellColor[1]; data[idx+2] = cellColor[2]; }
        else { data[idx] = cellFg; data[idx+1] = cellFg; data[idx+2] = cellFg; }
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

// ── Public render entry point ──
export function renderField(ctx, W, H, state, globalTime) {
  let dotSize = Math.max(1, Math.round(CFG.dotSizeMax - (CFG.dotSizeMax - CFG.dotSizeMin) * state.brightness));

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
