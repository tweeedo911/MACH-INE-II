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
  climaxProgress, inClimax, getCellColor, getMidiColor, palette,
} from './colors.js';
import { scene, engineRender } from './director.js';
import { firma } from './sequencer.js';

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
const MAX_TRAIL = 64;
export let midiTrail = [];

export function addMidiNote(ch, noteNorm, velNorm) {
  const pos = getNotePosition(ch, noteNorm, velNorm);
  if (!pos) return;

  // Scale radius by scene midiScale (engine override if active) + engine shapeScale
  const mScale = (engineRender.active && engineRender.midiScale != null) ? engineRender.midiScale : scene.midiScale;
  const scaledRadius = pos.radius * mScale * engineRender.shapeScale;

  // Reinforce: if a similar note exists from same channel, boost it
  for (const n of midiTrail) {
    if (n.ch === ch && Math.abs(n.x - pos.x) < 0.04 && Math.abs(n.y - pos.y) < 0.04) {
      n.alpha = Math.min(1, n.alpha + velNorm * 0.5);
      n.vel = Math.max(n.vel, velNorm);
      n.radius = scaledRadius;
      n.time = 0;
      return;
    }
  }

  midiTrail.push({
    x: pos.x, y: pos.y,
    vel: velNorm, alpha: 1,
    radius: scaledRadius,
    decay: pos.decay,
    shape: pos.shape,
    color: pos.color,
    ch: ch,
    time: 0,
  });

  const maxTrail = engineRender.active ? engineRender.trailMax : MAX_TRAIL;
  if (midiTrail.length > maxTrail) midiTrail.shift();
}

export function updateWaves(dt) {
  for (let i = onsetWaves.length - 1; i >= 0; i--) {
    const w = onsetWaves[i];
    const waveSpeed = (engineRender.active && engineRender.onsetWaveSpeed != null) ? engineRender.onsetWaveSpeed : CFG.onsetWaveSpeed;
    w.radius += waveSpeed * dt;
    w.alpha *= CFG.onsetDecayRate;
    if (w.alpha < 0.01) onsetWaves.splice(i, 1);
  }
  for (let i = midiTrail.length - 1; i >= 0; i--) {
    const n = midiTrail[i];
    n.time += dt;
    n.alpha *= n.decay || 0.97;
    if (n.alpha < 0.01) midiTrail.splice(i, 1);
  }
}

// ── MIDI color field ──
function midiColorAt(nx, ny) {
  let bestCh = -1, bestAlpha = 0;
  for (const n of midiTrail) {
    if (n.alpha < 0.03 || n.color === null) continue;
    const dx = nx - n.x, dy = ny - n.y;

    let influence = 0;
    if (n.shape === 'pulse') {
      // Colore rettangolare istantaneo — niente espansione nel tempo
      const expand = n.radius;
      const hw = expand * 1.6, hh = expand * 0.9;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (adx < hw && ady < hh) {
        influence = (1 - adx / hw) * (1 - ady / hh) * n.alpha * n.vel;
      }
    } else if (n.shape === 'blob') {
      // Blocco colore rettangolare ampio
      const breathe = 1 + Math.sin(n.time * 2.5) * 0.15;
      const hw = n.radius * 2.5 * breathe, hh = n.radius * 1.8 * breathe;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (adx < hw && ady < hh) {
        influence = (1 - adx / hw) * (1 - ady / hh) * n.alpha * n.vel;
      }
    } else if (n.shape === 'band') {
      const bandH = n.radius * 1.5;
      if (Math.abs(dy) < bandH) {
        const xFade = 1 - Math.pow(Math.abs(nx - 0.5) * 2, 3);
        influence = (1 - Math.abs(dy) / bandH) * xFade * n.alpha * n.vel;
      }
    } else if (n.shape === 'column') {
      // Colonna verticale — strip stretta in x, piena altezza
      const hw = n.radius * 0.9;
      if (Math.abs(dx) < hw) {
        influence = (1 - Math.abs(dx) / hw) * n.alpha * n.vel;
      }
    } else if (n.shape === 'trail') {
      // Colore rettangolare verticale
      const hw = n.radius * 1.2, hh = n.radius * 2.0;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (adx < hw && ady < hh) {
        influence = (1 - ady / hh) * n.alpha * n.vel;
      }
    } else if (n.shape === 'rupture') {
      // Rettangoli frammentati: fasce orizzontali con lacune animate
      const fragIndex = Math.floor(Math.abs(dx * 9 + n.time * 1.3)) % 3;
      const bandH = n.radius * 0.55;
      const slotY = Math.floor(dy / bandH + 2) % 3;
      const gap = (Math.sin(n.time * 4.7 + slotY * 2.1) > 0.3) ? 1 : 0;
      if (gap && Math.abs(dy) < n.radius * 1.6 && fragIndex > 0) {
        influence = (1 - Math.abs(dy) / (n.radius * 1.6)) * n.alpha * n.vel * 0.85;
      }
    } else {
      // Scatter — piccolo rettangolo colore
      const hw = n.radius * 1.0, hh = n.radius * 0.8;
      if (Math.abs(dx) < hw && Math.abs(dy) < hh) {
        influence = n.alpha * n.vel * 0.6;
      }
    }

    if (influence > bestAlpha) {
      bestAlpha = influence;
      bestCh = n.color;
    }
  }

  // Trail contour lines carry color
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

// ── Smoothed intensity for low-reactivity zones ──
let smoothedIntensity = 0;

// ── Total density at point ──
function computeDensity(nx, ny, px, py, state, globalTime, W, H) {
  if (isInVuoto(nx, ny)) return 0;

  const zone = getZone(nx, ny);
  const r = zone.reactivity;

  const localIntensity = state.intensity * r + smoothedIntensity * (1 - r);
  const intCurve = Math.pow(localIntensity, 1.5);
  let d = CFG.densityBase + (CFG.densityMax - CFG.densityBase) * intCurve;

  d += state.brightness * CFG.brightnessDensityBoost * localIntensity;

  // Flicker only in reactive zones — per-zone speed and amplitude (engine override)
  if (r > 0.3 && state.rhythmicity > 0.01) {
    const baseFlicker = (engineRender.active && engineRender.flickerSpeed != null) ? engineRender.flickerSpeed : CFG.rhythmFlickerSpeed;
    const speed = zone.flickerSpeed || baseFlicker;
    const flickerT = globalTime * speed + zone.flickerPhase * Math.PI * 2;
    const amp = zone.flickerAmp || CFG.rhythmFlickerAmp;
    d += Math.sin(flickerT * Math.PI * 2) * amp * state.rhythmicity * r * r;
  }
  d *= zone.densityMul;

  // Scene density multiplier (engine override multiplies on top)
  d *= scene.densityMul;
  if (engineRender.active && engineRender.densityMul != null) d *= engineRender.densityMul;

  // Composition regions — spatial density override
  for (const reg of scene.regions) {
    if (nx >= reg.x && nx < reg.x + reg.w && ny >= reg.y && ny < reg.y + reg.h) {
      d *= reg.mul;
      break;
    }
  }

  if (state.stereoWidth < 1) {
    const centerDist = Math.abs(nx - 0.5) * 2;
    d *= 1 - Math.pow(centerDist, CFG.widthCenterFalloff * (1 - state.stereoWidth)) * (1 - state.stereoWidth);
  }

  if (state.trajectory === 1) d += (1 - ny) * 0.08 * localIntensity;
  else if (state.trajectory === -1) d += ny * 0.08 * localIntensity;

  // Frequency bands → spatial regions
  const bandAvg = (band) => (band.L + band.R) * 0.5;
  const subLow = bandAvg(audio.bands.sub) * 0.6 + bandAvg(audio.bands.low) * 0.4;
  const mid = bandAvg(audio.bands.mid);
  const highAir = bandAvg(audio.bands.high) * 0.6 + bandAvg(audio.bands.air) * 0.4;

  if (ny > 0.6) d += subLow * 0.08 * (ny - 0.6) / 0.4;
  else if (ny > 0.3) d += mid * 0.06 * (1 - Math.abs(ny - 0.5) / 0.2);
  if (ny < 0.4) d += highAir * 0.07 * (0.4 - ny) / 0.4;

  // Engine density gravity — shift density weight vertically
  // positive = bottom-heavy (ABISSO), negative = top-light (CRISTALLO)
  if (engineRender.active && engineRender.densityGravity !== 0) {
    const g = engineRender.densityGravity;
    d *= 1 + g * (ny - 0.5);  // ny 0=top 1=bottom: g>0 boosts bottom, g<0 boosts top
  }

  const pd = primitiveDensity(nx, ny, state, W, H);
  if (pd === -1) return 0;
  d += pd;

  d += entityDensityAt(nx, ny, W, H);

  for (const w of onsetWaves) {
    // Onda rettangolare orizzontale che si espande verticalmente
    const dy = Math.abs(py - w.cy);
    const bandDist = Math.abs(dy - w.radius);
    if (bandDist < CFG.onsetWaveWidth) {
      d = Math.max(d, (1 - bandDist / CFG.onsetWaveWidth) * CFG.onsetWaveDensity * w.alpha);
    }
  }

  // MIDI trail — take strongest note only (max, not sum) for cleaner landmarks
  let maxMidiD = 0;
  for (const n of midiTrail) {
    if (n.alpha < 0.02) continue;
    const dx = nx - n.x, dy = ny - n.y;
    let midiD = 0;

    if (n.shape === 'pulse') {
      const expand = n.radius;
      const hw = expand * 1.2, hh = expand * 0.6;
      const edgeW = 0.03 + n.radius * 0.12;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (adx < hw + edgeW && ady < hh + edgeW) {
        const dEdge = Math.max(Math.max(0, adx - hw), Math.max(0, ady - hh));
        const inEdge = Math.min(Math.abs(adx - hw), Math.abs(ady - hh));
        if (dEdge < edgeW && inEdge < edgeW) {
          midiD = (1 - dEdge / edgeW) * n.vel * n.alpha;
        }
      }
    } else if (n.shape === 'blob') {
      const breathe = 1 + Math.sin(n.time * 2.5) * 0.15;
      const hw = n.radius * 1.8 * breathe;
      const hh = n.radius * 1.2 * breathe;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (adx < hw && ady < hh) {
        midiD = (1 - adx / hw) * (1 - ady / hh) * n.vel * n.alpha * 0.85;
      }
    } else if (n.shape === 'band') {
      const bandH = n.radius * 0.8;
      const bandDist = Math.abs(dy);
      if (bandDist < bandH) {
        const falloff = 1 - bandDist / bandH;
        const xFade = 1 - Math.pow(Math.abs(nx - 0.5) * 2, 3);
        midiD = falloff * xFade * n.vel * n.alpha * 0.7;
      }
    } else if (n.shape === 'column') {
      const hw = n.radius * 0.7;
      if (Math.abs(dx) < hw) {
        midiD = (1 - Math.abs(dx) / hw) * n.vel * n.alpha * 0.9;
      }
    } else if (n.shape === 'scatter') {
      const hw = n.radius * 0.5, hh = n.radius * 0.3;
      if (Math.abs(dx) < hw && Math.abs(dy) < hh) {
        midiD = n.vel * n.alpha * 0.5;
      }
    } else {
      // trail — rettangolo verticale
      const hw = n.radius * 0.4, hh = n.radius * 0.8;
      if (Math.abs(dx) < hw && Math.abs(dy) < hh) {
        midiD = (1 - Math.abs(dy) / hh) * n.vel * n.alpha * 0.8;
      }
    }

    if (midiD > maxMidiD) maxMidiD = midiD;
  }
  d += maxMidiD * engineRender.midiDensityMul;

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
        d += Math.min(a.alpha, b.alpha) * (1 - lineDist / lineWidth) * 0.3;
      }
    }
  }

  if (inClimax) d += CFG.climaxDensityBoost * climaxProgress;

  // Concert opening/closing density cap
  if (firma.densityCap < 1) d *= firma.densityCap;

  // Non-linear compression: create true negative space
  d = Math.max(0, Math.min(1, d));
  if (d < CFG.densityVoidThreshold) return 0;
  return Math.pow((d - CFG.densityVoidThreshold) / (1 - CFG.densityVoidThreshold), 1.6);
}

// ── Render: fillRect path (large dots) ──
function renderFillRect(ctx, dotSize, state, globalTime, W, H) {
  const cols = Math.ceil(W / dotSize);
  const rows = Math.ceil(H / dotSize);
  let lastFill = '';
  const baseInv = (engineRender.active && engineRender.forceInvert != null) ? engineRender.forceInvert : inverted;

  for (let row = 0; row < rows; row++) {
    const py = row * dotSize, ny = py / H;
    for (let col = 0; col < cols; col++) {
      const px = col * dotSize, nx = px / W;

      let cellInv = baseInv;
      if (invertDissolving) {
        const bayerVal = BAYER8[(row & 7) * 8 + (col & 7)];
        cellInv = invertDissolveProgress > bayerVal ? invertTarget : baseInv;
      }

      const zone = getZone(nx, ny);
      const thresholdShift = (1 - zone.dotSizeMul) * 0.3;
      const threshold = Math.max(CFG.densityFloor, Math.min(1, BAYER8[(row & 7) * 8 + (col & 7)] + thresholdShift));
      const density = computeDensity(nx, ny, px, py, state, globalTime, W, H);
      if (density > threshold) {
        const zDot = Math.max(1, Math.round(dotSize * zone.dotSizeMul));
        const fgVal = cellInv ? 0 : 255;
        const [mCh, mAlpha] = midiColorAt(nx, ny);
        let fill;
        // Priority: strong MIDI > region fill > entity color > fg
        if (mCh >= 0 && mAlpha > 0.15) {
          const mc = getMidiColor(mCh, mAlpha, fgVal);
          if (mc) fill = `rgb(${mc[0]},${mc[1]},${mc[2]})`;
        }
        if (!fill) {
          let regionFill = null;
          for (const reg of scene.regions) {
            if (reg.fillColor && reg.mul >= 1.5 && nx >= reg.x && nx < reg.x + reg.w && ny >= reg.y && ny < reg.y + reg.h) {
              regionFill = reg.fillColor; break;
            }
          }
          if (regionFill) {
            const rc = getCellColor(regionFill, 0.85, fgVal);
            if (rc) fill = `rgb(${rc[0]},${rc[1]},${rc[2]})`;
          }
        }
        if (!fill) {
          const [cId, cAlpha] = entityColorAt(nx, ny, W, H);
          const climaxAlpha = inClimax ? Math.min(1, cAlpha * (1 + climaxProgress * 2)) : cAlpha;
          const cellColor = getCellColor(cId, climaxAlpha, fgVal);
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
  const baseInv = (engineRender.active && engineRender.forceInvert != null) ? engineRender.forceInvert : inverted;
  const fgVal = baseInv ? 0 : 255;

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
        const [mCh, mAlpha] = midiColorAt(nx, ny);
        let colored = false;
        // Priority: strong MIDI > region fill > entity color > fg
        if (mCh >= 0 && mAlpha > 0.15) {
          const mc = getMidiColor(mCh, mAlpha, cellFg);
          if (mc) { data[idx] = mc[0]; data[idx+1] = mc[1]; data[idx+2] = mc[2]; colored = true; }
        }
        if (!colored) {
          let regionFill = null;
          for (const reg of scene.regions) {
            if (reg.fillColor && reg.mul >= 1.5 && nx >= reg.x && nx < reg.x + reg.w && ny >= reg.y && ny < reg.y + reg.h) {
              regionFill = reg.fillColor; break;
            }
          }
          if (regionFill) {
            const rc = getCellColor(regionFill, 0.85, cellFg);
            if (rc) { data[idx] = rc[0]; data[idx+1] = rc[1]; data[idx+2] = rc[2]; colored = true; }
          }
        }
        if (!colored) {
          const [cId, cAlpha] = entityColorAt(nx, ny, W, H);
          const climaxAlpha = inClimax ? Math.min(1, cAlpha * (1 + climaxProgress * 2)) : cAlpha;
          const cellColor = getCellColor(cId, climaxAlpha, cellFg);
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

// ── Public render entry point ──
export function renderField(ctx, W, H, state, globalTime) {
  // Update smoothed intensity for low-reactivity zones
  smoothedIntensity += (state.intensity - smoothedIntensity) * 0.0008;

  // Dot size from scene, engine override takes priority
  let dotSize = Math.max(1, (engineRender.active && engineRender.dotSize != null) ? engineRender.dotSize : scene.dotSize);

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
}
