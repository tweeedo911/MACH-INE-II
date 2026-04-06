// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: GRIGLIA
//  Data/Ikeda. Griglia rigorosa, colonne accese dal MIDI.
//  MACCHINA: arp illumina colonne in sequenza.
//
//  Enrichments:
//  - Ghost grid: scheletro sempre visibile (density 0.02-0.05)
//  - Audio flicker: celle spente flickerano su RMS
//  - Sediment: afterglow con rate per fase
//  - Camera pulse: zoom meccanico su kick (CH0)
//  - BPM scroll: velocità agganciata al BPM
//  - Cell animation: ramp-up veloce, decay esponenziale
//  - Row scan: linea verticale top→bottom sincronizzata al bar
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, rgbString, hexToRgb, lerpColor,
  lerp, clamp, mapRange,
  audioFlicker, bayerGlitch, colorFlash, shouldGlitch,
  Sediment,
  applyCameraTransform, restoreCameraTransform,
} from './visual-toolkit.js';
import { phaseState } from './world-state.js';

// ── Phase parameters ────────────────────────────────────────
const PHASE_PARAMS = {
  germoglio:    { cols: 8,  rows: 4,  cellActive: 0.05, accentProb: 0,    sedimentRate: 0.95 },
  pulsazione:   { cols: 16, rows: 8,  cellActive: 0.15, accentProb: 0.05, sedimentRate: 0.90 },
  densita:      { cols: 24, rows: 12, cellActive: 0.40, accentProb: 0.15, sedimentRate: 0.82 },
  rottura:      { cols: 32, rows: 16, cellActive: 0.70, accentProb: 0.30, sedimentRate: 0.75 },
  dissoluzione: { cols: 16, rows: 8,  cellActive: 0.10, accentProb: 0.02, sedimentRate: 0.93 },
};

// Phases that activate the scan line
const SCAN_PHASES = new Set(['densita', 'rottura']);

// ── Module state ─────────────────────────────────────────────
let _grid        = [];
let _time        = 0;
let _scrollOffset = 0;
let _params      = { ...PHASE_PARAMS.germoglio };
let _cols        = 8;
let _rows        = 4;

// Camera pulse state
let _kickZoom    = 1.0;
const KICK_ZOOM_TARGET = 1.02;
const KICK_ZOOM_DECAY  = 0.85;  // per-frame decay multiplier

// Sediment buffer
const _sediment = new Sediment();

// ── Grid init ────────────────────────────────────────────────
function initGrid(cols, rows) {
  _cols = cols;
  _rows = rows;
  _grid = [];
  for (let r = 0; r < rows; r++) {
    _grid[r] = [];
    for (let c = 0; c < cols; c++) {
      _grid[r][c] = {
        brightness: 0,
        // true = flash second time (accent double-flash)
        flashCount: 0,
        flashTimer: 0,
        accent:     false,
        decay:      0.94,
      };
    }
  }
}

// ── Init ─────────────────────────────────────────────────────
export function init(env) {
  _time        = 0;
  _scrollOffset = 0;
  _kickZoom    = 1.0;
  const phase  = env.worldState.phase || 'germoglio';
  const p      = PHASE_PARAMS[phase] || PHASE_PARAMS.germoglio;
  _params      = { ...p };
  initGrid(p.cols, p.rows);
  _sediment.clear(env.W || 1280, env.H || 720);
}

// ── Render ───────────────────────────────────────────────────
export function render(ctx, W, H, env) {
  const { worldState, midiTrail, midi, dt, audio, state } = env;
  _time += dt;

  // ── Lerp params to target phase ──────────────────────────
  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  _params.cellActive   += (target.cellActive   - _params.cellActive)   * 0.02;
  _params.accentProb   += (target.accentProb   - _params.accentProb)   * 0.02;
  _params.sedimentRate  = lerp(_params.sedimentRate || target.sedimentRate,
                                target.sedimentRate, 0.02);

  if (target.cols !== _cols || target.rows !== _rows) {
    initGrid(target.cols, target.rows);
  }

  // ── Colors ───────────────────────────────────────────────
  const bgRgb  = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;

  // ── BPM-synced scroll ────────────────────────────────────
  // Locked to groove — zero arbitrary motion
  const bpmScrollSpeed = worldState.bpm ? (worldState.bpm / 600) : 0;
  _scrollOffset += bpmScrollSpeed * dt;
  if (_scrollOffset > 1) _scrollOffset -= 1;

  // ── Cell decay (exponential) ─────────────────────────────
  for (let r = 0; r < _rows; r++) {
    for (let c = 0; c < _cols; c++) {
      const cell = _grid[r][c];
      // Exponential decay rather than linear multiply
      cell.brightness *= Math.pow(cell.decay, dt * 60);
      // Accent double-flash timer
      if (cell.flashCount > 0) {
        cell.flashTimer -= dt;
        if (cell.flashTimer <= 0 && cell.flashCount > 0) {
          cell.brightness = 1.0;
          cell.flashCount -= 1;
          cell.flashTimer  = 0.08; // second flash duration
        }
      }
    }
  }

  // ── MIDI → grid ──────────────────────────────────────────
  for (const n of midiTrail) {
    if (n.time > dt * 2 || n.alpha < 0.2) continue;

    // CH7 RUPTURE — full column
    if (n.ch === 7 && n.alpha > 0.3) {
      const col = Math.floor(n.note * _cols) % _cols;
      for (let r = 0; r < _rows; r++) {
        _grid[r][col].brightness = clamp(_grid[r][col].brightness + n.vel * 0.8, 0, 1);
      }
    }

    // CH0 KICK — horizontal bar + camera pulse (double-row in rottura)
    if (n.ch === 0 && n.alpha > 0.3) {
      const row = Math.floor(_rows / 2);
      const rowSpan = isRottura ? 2 : 1;
      for (let ri = 0; ri < rowSpan; ri++) {
        const tr = (row + ri) % _rows;
        for (let c = 0; c < _cols; c++) {
          _grid[tr][c].brightness = clamp(_grid[tr][c].brightness + n.vel * 0.6, 0, 1);
        }
      }
      // Trigger zoom pulse — MACCHINA mechanical pump (more aggressive in rottura)
      _kickZoom = isRottura ? KICK_ZOOM_TARGET + 0.01 : KICK_ZOOM_TARGET;
    }

    // CH3 BASS — bottom-spread columns
    if (n.ch === 3) {
      const col    = Math.floor(n.note * _cols) % _cols;
      const spread = 2;
      for (let c = Math.max(0, col - spread); c <= Math.min(_cols - 1, col + spread); c++) {
        for (let r = Math.floor(_rows * 0.6); r < _rows; r++) {
          _grid[r][c].brightness = clamp(_grid[r][c].brightness + n.vel * 0.5, 0, 1);
        }
      }
    }

    // CH5/CH6 VOICE/LEAD — accent cells with double-flash
    if (n.ch === 5 || n.ch === 6) {
      const col = Math.floor(n.note * _cols) % _cols;
      const row = Math.floor((1 - n.note) * _rows) % _rows;
      if (_grid[row] && _grid[row][col]) {
        // Ramp up fast to 1.0
        _grid[row][col].brightness = 1.0;
        _grid[row][col].accent     = true;
        // Schedule a second flash
        _grid[row][col].flashCount = 1;
        _grid[row][col].flashTimer = 0.06; // gap before second flash
      }
    }
  }

  // ── Scan line (densita + rottura only) ───────────────────
  // Moves top → bottom over barProgress (0→1) — FIX: use worldState.barProgress (now defined)
  const doScan = SCAN_PHASES.has(worldState.phase);
  const isRottura = worldState.phase === 'rottura';
  let scanRow = -1;
  if (doScan && worldState.barProgress !== undefined) {
    scanRow = Math.floor(worldState.barProgress * _rows) % _rows;
    // Boost cells on current scan row
    for (let c = 0; c < _cols; c++) {
      _grid[scanRow][c].brightness = clamp(_grid[scanRow][c].brightness + 0.25, 0, 1);
    }
  }

  // ── Onset → full-row flash (random row) + grid jolt ──────
  let _gridJolt = 0;
  for (const w of (env.onsetWaves || [])) {
    if (w.strength > 0.4) {
      // Flash a random row on onset
      const flashRow = Math.floor(w.cy / H * _rows) % _rows;
      if (_grid[flashRow]) {
        for (let c = 0; c < _cols; c++) {
          _grid[flashRow][c].brightness = clamp(_grid[flashRow][c].brightness + w.strength * 0.7, 0, 1);
        }
      }
      // In rottura: grid shifts by 1-2 cells
      if (isRottura) _gridJolt = Math.max(_gridJolt, Math.ceil(w.strength * 2));
    }
  }

  // ── Camera pulse decay ───────────────────────────────────
  // Smooth exponential return to 1.0 — no drift (MACCHINA is rigid)
  _kickZoom = lerp(_kickZoom, 1.0, 1 - Math.pow(KICK_ZOOM_DECAY, dt * 60));

  // ── Background ───────────────────────────────────────────
  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  // ── Sediment composite (behind new frame) ────────────────
  const sedRate = _params.sedimentRate || 0.90;
  _sediment.decay(W, H, sedRate);
  _sediment.composite(ctx);

  // ── Apply camera transform ───────────────────────────────
  applyCameraTransform(ctx, W, H, { zoom: _kickZoom });

  // ── Draw grid ────────────────────────────────────────────
  const cellW   = W / _cols;
  const cellH   = H / _rows;
  const dotSize = Math.max(2, Math.floor(Math.min(cellW, cellH) * 0.6));
  const padding = Math.floor(Math.min(cellW, cellH) * 0.15);

  // Audio RMS for flicker intensity
  const rms = (audio && audio.rms) ? audio.rms : 0;

  for (let r = 0; r < _rows; r++) {
    for (let c = 0; c < _cols; c++) {
      const cell = _grid[r][c];

      // Normalised cell position (0→1) for spatial functions
      const nx = c / _cols;
      const ny = r / _rows;

      // ── Effective brightness ─────────────────────────────
      let effectiveBrightness = cell.brightness;

      // Ghost grid: unlit cells have faint permanent skeleton
      // Flicker is audio-reactive; ghost baseline is always present
      const flickerMod = (state && state.rhythmicity !== undefined)
        ? audioFlicker(state, _time, nx, ny) * rms
        : 0;
      const ghostBase = 0.02 + rms * 0.03; // 0.02–0.05 range
      effectiveBrightness = Math.max(effectiveBrightness, ghostBase + flickerMod);

      // Scan line brightness boost (additive on top of cell value)
      if (doScan && r === scanRow) {
        effectiveBrightness = Math.min(1.0, effectiveBrightness + 0.3);
      }

      if (effectiveBrightness < 0.01) continue;

      const scrollC = (c + Math.floor(_scrollOffset * _cols) + _gridJolt) % _cols;
      const cx = scrollC * cellW + padding;
      const cy = r * cellH + padding;
      const cw = cellW - padding * 2;
      const ch = cellH - padding * 2;

      const cols2 = Math.ceil(cw / dotSize);
      const rows2 = Math.ceil(ch / dotSize);

      // Ghost cells use muted mid-tone between bg and dot
      let cellRgb;
      if (cell.brightness < 0.03) {
        // Ghost / flicker-only: interpolate bg→dot at low alpha
        const ghostT = mapRange(effectiveBrightness, 0, 0.08, 0, 1);
        cellRgb = lerpColor(bgRgb, cell.accent ? accRgb : dotRgb, clamp(ghostT, 0, 1));
      } else {
        cellRgb = cell.accent ? accRgb : dotRgb;
      }

      ctx.fillStyle = rgbString(cellRgb[0], cellRgb[1], cellRgb[2]);

      // In rottura: use glitched Bayer for visual stutter
      const glitchAmt = isRottura ? 0.4 + rms * 0.6 : 0;
      for (let dr = 0; dr < rows2; dr++) {
        for (let dc = 0; dc < cols2; dc++) {
          const testCol = dc + c * 3;
          const testRow = dr + r * 3;
          const visible = glitchAmt > 0.01
            ? bayerGlitch(testCol, testRow, effectiveBrightness, glitchAmt, _time)
            : bayerTest(testCol, testRow, effectiveBrightness);
          if (visible) {
            ctx.fillRect(cx + dc * dotSize, cy + dr * dotSize, dotSize, dotSize);
          }
        }
      }

      // ── Write bright lit cells into sediment buffer ──────
      if (cell.brightness > 0.15) {
        const sCtx = _sediment.getCtx();
        sCtx.fillStyle = rgbString(cellRgb[0], cellRgb[1], cellRgb[2]);
        for (let dr = 0; dr < rows2; dr++) {
          for (let dc = 0; dc < cols2; dc++) {
            if (bayerTest(dc + c * 3, dr + r * 3, cell.brightness * 0.6)) {
              sCtx.fillRect(cx + dc * dotSize, cy + dr * dotSize, dotSize, dotSize);
            }
          }
        }
      }

      cell.accent = false;
    }
  }

  restoreCameraTransform(ctx);
}

// ── Destroy ───────────────────────────────────────────────────
export function destroy() {
  _grid = [];
  _sediment.clear(1, 1);
}
