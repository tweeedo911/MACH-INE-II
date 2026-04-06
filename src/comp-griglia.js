// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: GRIGLIA
//  Data/Ikeda. Griglia rigorosa, colonne accese dal MIDI.
//  MACCHINA: arp illumina colonne in sequenza.
// ═════════════════════════════════════════════════════���═════

import {
  bayerTest, fillBackground, rgbString, hexToRgb, lerpColor,
  lerp, clamp, mapRange,
} from './visual-toolkit.js';

const PHASE_PARAMS = {
  germoglio:    { cols: 8,  rows: 4,  cellActive: 0.05, scrollSpeed: 0, accentProb: 0 },
  pulsazione:   { cols: 16, rows: 8,  cellActive: 0.15, scrollSpeed: 0.02, accentProb: 0.05 },
  densita:      { cols: 24, rows: 12, cellActive: 0.40, scrollSpeed: 0.05, accentProb: 0.15 },
  rottura:      { cols: 32, rows: 16, cellActive: 0.70, scrollSpeed: 0.12, accentProb: 0.30 },
  dissoluzione: { cols: 16, rows: 8,  cellActive: 0.10, scrollSpeed: 0.01, accentProb: 0.02 },
};

let _grid = [];
let _time = 0;
let _scrollOffset = 0;
let _params = { ...PHASE_PARAMS.germoglio };
let _cols = 8, _rows = 4;

function initGrid(cols, rows) {
  _cols = cols;
  _rows = rows;
  _grid = [];
  for (let r = 0; r < rows; r++) {
    _grid[r] = [];
    for (let c = 0; c < cols; c++) {
      _grid[r][c] = { brightness: 0, accent: false, decay: 0.94 };
    }
  }
}

export function init(env) {
  _time = 0;
  _scrollOffset = 0;
  const phase = env.worldState.phase || 'germoglio';
  const p = PHASE_PARAMS[phase] || PHASE_PARAMS.germoglio;
  _params = { ...p };
  initGrid(p.cols, p.rows);
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, midi, dt } = env;
  _time += dt;

  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  _params.cellActive += (target.cellActive - _params.cellActive) * 0.02;
  _params.scrollSpeed += (target.scrollSpeed - _params.scrollSpeed) * 0.02;
  _params.accentProb += (target.accentProb - _params.accentProb) * 0.02;

  if (target.cols !== _cols || target.rows !== _rows) {
    initGrid(target.cols, target.rows);
  }

  const bgRgb = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;

  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  _scrollOffset += _params.scrollSpeed * dt;
  if (_scrollOffset > 1) _scrollOffset -= 1;

  for (let r = 0; r < _rows; r++) {
    for (let c = 0; c < _cols; c++) {
      _grid[r][c].brightness *= _grid[r][c].decay;
    }
  }

  for (const n of midiTrail) {
    if (n.ch === 7 && n.time < dt * 2 && n.alpha > 0.3) {
      const col = Math.floor(n.note * _cols) % _cols;
      for (let r = 0; r < _rows; r++) {
        _grid[r][col].brightness = clamp(_grid[r][col].brightness + n.vel * 0.8, 0, 1);
      }
    }
    if (n.ch === 0 && n.time < dt * 2 && n.alpha > 0.3) {
      const row = Math.floor(_rows / 2);
      for (let c = 0; c < _cols; c++) {
        _grid[row][c].brightness = clamp(_grid[row][c].brightness + n.vel * 0.6, 0, 1);
      }
    }
    if (n.ch === 3 && n.time < dt * 2 && n.alpha > 0.2) {
      const col = Math.floor(n.note * _cols) % _cols;
      const spread = 2;
      for (let c = Math.max(0, col - spread); c <= Math.min(_cols - 1, col + spread); c++) {
        for (let r = Math.floor(_rows * 0.6); r < _rows; r++) {
          _grid[r][c].brightness = clamp(_grid[r][c].brightness + n.vel * 0.5, 0, 1);
        }
      }
    }
    if ((n.ch === 5 || n.ch === 6) && n.time < dt * 2 && n.alpha > 0.3) {
      const col = Math.floor(n.note * _cols) % _cols;
      const row = Math.floor((1 - n.note) * _rows) % _rows;
      if (_grid[row] && _grid[row][col]) {
        _grid[row][col].brightness = 1;
        _grid[row][col].accent = true;
      }
    }
  }

  const cellW = W / _cols;
  const cellH = H / _rows;
  const dotSize = Math.max(2, Math.floor(Math.min(cellW, cellH) * 0.6));
  const padding = Math.floor(Math.min(cellW, cellH) * 0.15);

  for (let r = 0; r < _rows; r++) {
    for (let c = 0; c < _cols; c++) {
      const cell = _grid[r][c];
      if (cell.brightness < 0.03) continue;

      const scrollC = (c + Math.floor(_scrollOffset * _cols)) % _cols;
      const cx = scrollC * cellW + padding;
      const cy = r * cellH + padding;
      const cw = cellW - padding * 2;
      const ch = cellH - padding * 2;

      const cols2 = Math.ceil(cw / dotSize);
      const rows2 = Math.ceil(ch / dotSize);
      const cellRgb = cell.accent ? accRgb : dotRgb;
      ctx.fillStyle = rgbString(cellRgb[0], cellRgb[1], cellRgb[2]);

      for (let dr = 0; dr < rows2; dr++) {
        for (let dc = 0; dc < cols2; dc++) {
          if (bayerTest(dc + c * 3, dr + r * 3, cell.brightness)) {
            ctx.fillRect(cx + dc * dotSize, cy + dr * dotSize, dotSize, dotSize);
          }
        }
      }

      cell.accent = false;
    }
  }
}

export function destroy() {
  _grid = [];
}
