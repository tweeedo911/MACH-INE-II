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
//
//  v2 (A.4) — Migrato al layer stack 4-canonico (BG/MG/FG).
//             MG = sediment afterglow (z-order: sotto griglia ✓).
//             FG = celle griglia camera-trasformate.
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, rgbString, hexToRgb, lerpColor,
  lerp, clamp, mapRange,
  audioFlicker, bayerGlitch, colorFlash, shouldGlitch,
  applyCameraTransform, restoreCameraTransform,
  RISO_OFFSET_X, RISO_OFFSET_Y,
  lerpKForTrack,
} from './visual-toolkit.js';
import { phaseState } from './world-state.js';

import {
  getLayerCtx, clearAllLayers, clearLayer, compositeLayers, setLayerDecay,
  LAYER_BG, LAYER_MG, LAYER_FG,
} from './layers.js';

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
  clearAllLayers();
  // MG = sediment afterglow — decay rate da fase, NOT cleared ogni frame
  setLayerDecay(LAYER_MG, _params.sedimentRate);
}

// ── Render ───────────────────────────────────────────────────
export function render(ctx, W, H, env) {
  const { worldState, midiTrail, midi, dt, audio, state } = env;
  _time += dt;

  // ── Lerp params to target phase ──────────────────────────
  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  const trackK = lerpKForTrack(worldState.track, dt);
  _params.cellActive   += (target.cellActive   - _params.cellActive)   * trackK;
  _params.accentProb   += (target.accentProb   - _params.accentProb)   * trackK;
  _params.sedimentRate  = lerp(_params.sedimentRate || target.sedimentRate,
                                target.sedimentRate, trackK);
  setLayerDecay(LAYER_MG, _params.sedimentRate);  // propagate to layer system next frame

  if (target.cols !== _cols || target.rows !== _rows) {
    initGrid(target.cols, target.rows);
  }

  const { rupture } = worldState;
  const ruptI = rupture.intensity;   // 0→1 smooth (omen→infiltration→takeover→residue)

  // ── Layer contexts ──
  // FG è fresco ogni frame (celle live si ridisegnano da zero).
  // MG NON viene azzerato — accumula il sediment afterglow (decay via updateLayers).
  clearLayer(LAYER_FG);
  const lBg = getLayerCtx(LAYER_BG);
  const lMg = getLayerCtx(LAYER_MG);  // sediment afterglow
  const lFg = getLayerCtx(LAYER_FG);  // celle griglia camera-trasformate

  // ── Colors ───────────────────────────────────────────────
  const bgRgb  = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;

  // ── BG layer ─────────────────────────────────────────────
  if (lBg) fillBackground(lBg, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  // ── BPM-synced scroll ────────────────────────────────────
  const bpmScrollSpeed = worldState.bpm ? (worldState.bpm / 600) : 0;
  _scrollOffset += bpmScrollSpeed * dt;
  if (_scrollOffset > 1) _scrollOffset -= 1;

  // ── Cell decay (exponential) ─────────────────────────────
  for (let r = 0; r < _rows; r++) {
    for (let c = 0; c < _cols; c++) {
      const cell = _grid[r][c];
      cell.brightness *= Math.pow(cell.decay, dt * 60);
      if (cell.flashCount > 0) {
        cell.flashTimer -= dt;
        if (cell.flashTimer <= 0 && cell.flashCount > 0) {
          cell.brightness = 1.0;
          cell.flashCount -= 1;
          cell.flashTimer  = 0.08;
        }
      }
    }
  }

  // ── MIDI → grid ──────────────────────────────────────────
  for (const n of midiTrail) {
    if (n.time > dt * 2 || n.alpha < 0.2) continue;

    if (n.ch === 7 && n.alpha > 0.3) {
      const col = Math.floor(n.note * _cols) % _cols;
      for (let r = 0; r < _rows; r++) {
        _grid[r][col].brightness = clamp(_grid[r][col].brightness + n.vel * 0.8, 0, 1);
      }
    }

    if (n.ch === 0 && n.alpha > 0.3) {
      const row = Math.floor(_rows / 2);
      const rowSpan = (rupture.stage === 'takeover' || rupture.stage === 'residue') ? 2 : 1;
      for (let ri = 0; ri < rowSpan; ri++) {
        const tr = (row + ri) % _rows;
        for (let c = 0; c < _cols; c++) {
          _grid[tr][c].brightness = clamp(_grid[tr][c].brightness + n.vel * 0.6, 0, 1);
        }
      }
      _kickZoom = KICK_ZOOM_TARGET + ruptI * 0.01;
    }

    if (n.ch === 3) {
      const col    = Math.floor(n.note * _cols) % _cols;
      const spread = 2;
      for (let c = Math.max(0, col - spread); c <= Math.min(_cols - 1, col + spread); c++) {
        for (let r = Math.floor(_rows * 0.6); r < _rows; r++) {
          _grid[r][c].brightness = clamp(_grid[r][c].brightness + n.vel * 0.5, 0, 1);
        }
      }
    }

    if (n.ch === 5 || n.ch === 6) {
      const col = Math.floor(n.note * _cols) % _cols;
      const row = Math.floor((1 - n.note) * _rows) % _rows;
      if (_grid[row] && _grid[row][col]) {
        _grid[row][col].brightness = 1.0;
        _grid[row][col].accent     = true;
        _grid[row][col].flashCount = 1;
        _grid[row][col].flashTimer = 0.06;
      }
    }
  }

  // ── Scan line (densita + rottura only) ───────────────────
  const doScan = SCAN_PHASES.has(worldState.phase);
  let scanRow = -1;
  if (doScan && worldState.barProgress !== undefined) {
    scanRow = Math.floor(worldState.barProgress * _rows) % _rows;
    for (let c = 0; c < _cols; c++) {
      _grid[scanRow][c].brightness = clamp(_grid[scanRow][c].brightness + 0.25, 0, 1);
    }
  }

  // ── Onset → full-row flash (random row) + grid jolt ──────
  let _gridJolt = 0;
  for (const w of (env.onsetWaves || [])) {
    if (w.strength > 0.4) {
      const flashRow = Math.floor(w.cy / H * _rows) % _rows;
      if (_grid[flashRow]) {
        for (let c = 0; c < _cols; c++) {
          _grid[flashRow][c].brightness = clamp(_grid[flashRow][c].brightness + w.strength * 0.7, 0, 1);
        }
      }
      if (ruptI > 0.1) _gridJolt = Math.max(_gridJolt, Math.ceil(w.strength * lerp(1, 2, ruptI)));
    }
  }

  // ── Camera pulse decay ───────────────────────────────────
  _kickZoom = lerp(_kickZoom, 1.0, 1 - Math.pow(KICK_ZOOM_DECAY, dt * 60));

  // ── FG layer: celle griglia con camera ───────────────────
  if (lFg) applyCameraTransform(lFg, W, H, { zoom: _kickZoom });

  const cellW   = W / _cols;
  const cellH   = H / _rows;
  const dotSize = Math.max(2, Math.floor(Math.min(cellW, cellH) * 0.6));
  const padding = Math.floor(Math.min(cellW, cellH) * 0.15);

  const rms = (audio && audio.rms) ? audio.rms : 0;

  for (let r = 0; r < _rows; r++) {
    for (let c = 0; c < _cols; c++) {
      const cell = _grid[r][c];

      const nx = c / _cols;
      const ny = r / _rows;

      let effectiveBrightness = cell.brightness;

      const flickerMod = (state && state.rhythmicity !== undefined)
        ? audioFlicker(state, _time, nx, ny) * rms
        : 0;
      // Zone Bayer crescono col ritmo — density.rhythm alza il ghost floor
      const ghostBase = 0.02 + rms * 0.03 + ((worldState.density && worldState.density.rhythm) || 0) * 0.08;
      effectiveBrightness = Math.max(effectiveBrightness, ghostBase + flickerMod);

      if (doScan && r === scanRow) {
        effectiveBrightness = Math.min(1.0, effectiveBrightness + 0.3);
      }

      effectiveBrightness = Math.min(effectiveBrightness, worldState.visualRegime.maxDensity);

      if (effectiveBrightness < 0.01) continue;

      const scrollC = (c + Math.floor(_scrollOffset * _cols) + _gridJolt) % _cols;
      const cx = scrollC * cellW + padding;
      const cy = r * cellH + padding;
      const cw = cellW - padding * 2;
      const ch = cellH - padding * 2;

      const cols2 = Math.ceil(cw / dotSize);
      const rows2 = Math.ceil(ch / dotSize);

      let cellRgb;
      if (cell.brightness < 0.03) {
        const ghostT = mapRange(effectiveBrightness, 0, 0.08, 0, 1);
        cellRgb = lerpColor(bgRgb, cell.accent ? accRgb : dotRgb, clamp(ghostT, 0, 1));
      } else {
        cellRgb = cell.accent ? accRgb : dotRgb;
      }

      const rdx = cell.accent ? RISO_OFFSET_X : 0;
      const rdy = cell.accent ? RISO_OFFSET_Y : 0;
      const glitchAmt = lerp(0, 0.4, ruptI) + rms * ruptI * 0.6;

      if (lFg) lFg.fillStyle = rgbString(cellRgb[0], cellRgb[1], cellRgb[2]);

      for (let dr = 0; dr < rows2; dr++) {
        for (let dc = 0; dc < cols2; dc++) {
          const testCol = dc + c * 3;
          const testRow = dr + r * 3;
          const visible = glitchAmt > 0.01
            ? bayerGlitch(testCol, testRow, effectiveBrightness, glitchAmt, _time)
            : bayerTest(testCol, testRow, effectiveBrightness);
          if (visible && lFg) {
            lFg.fillRect(cx + dc * dotSize + rdx, cy + dr * dotSize + rdy, dotSize, dotSize);
          }
        }
      }

      // ── Write bright lit cells into MG sediment afterglow ──
      if (cell.brightness > 0.15 && lMg) {
        lMg.fillStyle = rgbString(cellRgb[0], cellRgb[1], cellRgb[2]);
        for (let dr = 0; dr < rows2; dr++) {
          for (let dc = 0; dc < cols2; dc++) {
            if (bayerTest(dc + c * 3, dr + r * 3, cell.brightness * 0.6)) {
              lMg.fillRect(cx + dc * dotSize, cy + dr * dotSize, dotSize, dotSize);
            }
          }
        }
      }

      cell.accent = false;
    }
  }

  if (lFg) restoreCameraTransform(lFg);

  // ── Composite layers: BG → MG(sediment) → FG(griglia) ──
  compositeLayers(ctx);
}

// ── Destroy ───────────────────────────────────────────────────
export function destroy() {
  _grid = [];
  clearAllLayers();
}
