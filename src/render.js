// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Render Loop + Drawing + Debug HUD
//  Ported from v0.1.0 with stereo audio data
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { audio, getBinCount } from './audio.js';
import { midi, noteName } from './midi.js';
import { state } from './state.js';

// ── Canvas refs (set from main.js) ──
let canvas, ctx;
let W, H;

// ── History buffer for scrolling spectrogram ──
let history = [];
let historyHead = 0;
let lastHistTime = 0;

// ── Onset flash alpha (decaying) ──
let onsetAlpha = 0;
let onsetCount = 0;

// ── HUD elements ──
let hudDebug;

export function initRender(cvs) {
  canvas = cvs;
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

export function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

export function getSize() {
  return { W, H };
}

export function initHistory() {
  const bins = getBinCount() || 1024;
  history = Array.from({ length: CFG.historyLines },
    () => new Float32Array(bins));
  historyHead = 0;
}

export function setHUDElement(el) {
  hudDebug = el;
}

// ── Main render frame ──
let frameCount = 0;

export function renderFrame(now) {
  frameCount++;

  pushHistory(now);
  updateOnsetFlash();

  // ── Background trail ──
  const bgAlpha = onsetAlpha > 0.15
    ? CFG.trailAlphaOnset
    : CFG.trailAlphaBase;
  ctx.fillStyle = `rgba(0,0,0,${bgAlpha})`;
  ctx.fillRect(0, 0, W, H);

  // ── Spectral strata (Joy Division style) ──
  drawSpectralLines();

  // ── Onset flash ──
  if (onsetAlpha > 0.01) drawOnsetFlash();

  // ── MIDI note flashes ──
  drawNoteFlashes();

  // ── Debug HUD ──
  if (frameCount % CFG.hudUpdateInterval === 0) updateHUD();
}

// ═══════════════════════════════════════
//  History buffer
// ═══════════════════════════════════════

function pushHistory(now) {
  if (now - lastHistTime < CFG.historyIntervalMs) return;
  lastHistTime = now;

  const fft = audio.fftL;
  if (!fft) return;
  const bins = fft.length;

  for (let i = 0; i < bins; i++) {
    history[historyHead][i] = fft[i] / 255;
  }
  historyHead = (historyHead + 1) % CFG.historyLines;
}

// ═══════════════════════════════════════
//  Onset flash (uses spectral flux)
// ═══════════════════════════════════════

function updateOnsetFlash() {
  if (audio.onset) {
    // Scale flash intensity by flux magnitude
    onsetAlpha = Math.min(1, 0.4 + audio.flux * 10);
    onsetCount++;
  }
  onsetAlpha *= CFG.onsetDecay;
}

// ═══════════════════════════════════════
//  Spectral strata (Joy Division)
// ═══════════════════════════════════════

function drawSpectralLines() {
  const lineStep = H / (CFG.historyLines + 4);
  const maxDisplace = H * CFG.maxDisplaceFrac;

  for (let l = 0; l < CFG.historyLines; l++) {
    const idx = (historyHead - 1 - l + CFG.historyLines) % CFG.historyLines;
    const frame = history[idx];
    if (!frame) continue;

    const recency = 1 - l / CFG.historyLines;
    const baseY = H - (l + 2) * lineStep;
    const alpha = 0.08 + recency * 0.72;
    const lineW = recency > 0.9 ? 1.2 : 0.8;

    ctx.beginPath();
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = lineW;

    const segments = Math.min(frame.length, 512);

    for (let x = 0; x <= W; x++) {
      const fi = Math.floor((x / W) * (segments - 1));
      const amp = frame[fi] || 0;
      const py = baseY - amp * maxDisplace * (0.3 + recency * 0.7) * (H / 800);

      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }

    ctx.stroke();
  }
}

// ═══════════════════════════════════════
//  Onset flash drawing
// ═══════════════════════════════════════

function drawOnsetFlash() {
  const cx = W / 2, cy = H / 2;
  ctx.lineWidth = 0.8;

  for (let i = 0; i < 5; i++) {
    const frac = (i / 5) + (1 - onsetAlpha) * 0.5;
    const s = frac * Math.min(W, H) * 0.6;
    const ialph = onsetAlpha * (1 - i * 0.18);
    if (ialph < 0.01) continue;
    ctx.strokeStyle = `rgba(255,255,255,${ialph})`;
    ctx.strokeRect(cx - s, cy - s * (H / W), s * 2, s * 2 * (H / W));
  }

  const cs = onsetAlpha * 12;
  ctx.strokeStyle = `rgba(255,255,255,${onsetAlpha * 0.9})`;
  ctx.beginPath();
  ctx.moveTo(cx - cs, cy); ctx.lineTo(cx + cs, cy);
  ctx.moveTo(cx, cy - cs); ctx.lineTo(cx, cy + cs);
  ctx.stroke();
}

// ═══════════════════════════════════════
//  MIDI note flashes
// ═══════════════════════════════════════

function drawNoteFlashes() {
  for (let i = midi.noteFlashes.length - 1; i >= 0; i--) {
    const nf = midi.noteFlashes[i];
    if (nf.alpha < 0.008) continue;

    // Vertical line spanning full height
    ctx.strokeStyle = `rgba(255,255,255,${nf.alpha * 0.5})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(nf.x, 0);
    ctx.lineTo(nf.x, H);
    ctx.stroke();

    // Small square at midpoint
    const s = nf.alpha * 16;
    ctx.strokeStyle = `rgba(255,255,255,${nf.alpha})`;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(nf.x - s, H * 0.5 - s, s * 2, s * 2);

    // Tiny square at top
    const ts = nf.alpha * 4;
    ctx.strokeRect(nf.x - ts, 20 - ts, ts * 2, ts * 2);
  }
}

// ═══════════════════════════════════════
//  Debug HUD
// ═══════════════════════════════════════

function bar(val, len = 12) {
  const filled = Math.round(val * len);
  return '\u2588'.repeat(filled) + '\u2591'.repeat(len - filled);
}

function updateHUD() {
  if (!hudDebug) return;

  const trajArrow = audio.trajectory > 0 ? '\u2191'
    : audio.trajectory < 0 ? '\u2193' : '\u2192';

  const lastNote = midi.lastNote
    ? `${noteName(midi.lastNote.note)} V${midi.lastNote.vel} CH${midi.lastNote.ch}`
    : '——';

  const pitchStr = midi.pitchRange.low <= midi.pitchRange.high
    ? `${noteName(midi.pitchRange.low)}-${noteName(midi.pitchRange.high)}`
    : '——';

  hudDebug.textContent =
    `RMS  L ${bar(audio.rmsL)}  R ${bar(audio.rmsR)}  AVG ${(audio.rms * 100).toFixed(0)}%\n` +
    `SUB  L ${bar(audio.bands.sub.L)}  R ${bar(audio.bands.sub.R)}\n` +
    `LOW  L ${bar(audio.bands.low.L)}  R ${bar(audio.bands.low.R)}\n` +
    `MID  L ${bar(audio.bands.mid.L)}  R ${bar(audio.bands.mid.R)}\n` +
    `HIGH L ${bar(audio.bands.high.L)}  R ${bar(audio.bands.high.R)}\n` +
    `AIR  L ${bar(audio.bands.air.L)}  R ${bar(audio.bands.air.R)}\n` +
    `\n` +
    `CENTROID  ${bar(audio.centroid)}  ${(audio.centroid * 100).toFixed(0)}%\n` +
    `FLUX      ${bar(audio.flux * 5)}  ONSET ${onsetCount}\n` +
    `BPM       ${audio.bpm || '——'}\n` +
    `STEREO    ${bar(audio.stereoCorrelation)} corr  ${bar(audio.stereoDiff)} diff\n` +
    `TRAJ      ${trajArrow}\n` +
    `\n` +
    `INT   ${bar(state.intensity)}  ${(state.intensity * 100).toFixed(0)}%\n` +
    `RHYT  ${bar(state.rhythmicity)}  ${(state.rhythmicity * 100).toFixed(0)}%\n` +
    `BRIT  ${bar(state.brightness)}  ${(state.brightness * 100).toFixed(0)}%\n` +
    `WIDE  ${bar(state.stereoWidth)}  ${(state.stereoWidth * 100).toFixed(0)}%\n` +
    `\n` +
    `MIDI  ${midi.connected ? 'OK ' + midi.inputCount + ' IN' : 'OFF'}  NOTE ${lastNote}\n` +
    `DENS  ${midi.noteDensity.toFixed(1)} n/s  RANGE ${pitchStr}`;
}
