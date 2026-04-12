// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Campo Materiale
//
//  Paradigma: il campo non è un visualizer.
//  È un campo fisico persistente (Float32Array 96×54 per ruolo).
//  La musica applica forze, il decay e lo shimmer danno vita
//  continua. Quello che vedi è lo STATO del campo, non eventi.
//
//  Rendering: Bayer halftone su offscreen 960×540 (cellsX*cellPx),
//  multi-cellPx per ruolo (drone=16 coarse, voice=8 fine, etc.),
//  screen blend in Z-order grave→acuto,
//  upscale al canvas full-screen con smoothing disabilitato.
//
//  Validato in proto-campo.html (2026-04-10/11).
//  Sostituisce progressivamente le comp-* via CFG.VISUAL.campo.useCampo.
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { getBiome } from './biomi.js';
import { firma } from './firma.js';

// ── Bayer 4×4 ──
const BAYER4 = [0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5];
function bayer(px, py) { return BAYER4[(py % 4) * 4 + (px % 4)] / 16; }

// ── Ruoli canonici ──
const ROLES = ['drone','bass','chord','kick','percussion','arp','voice','lead'];
// Z-order: grave (dietro) → acuto (davanti)
const ZORDER = ['drone','bass','chord','percussion','arp','kick','voice','lead'];

// ── Channel → ruolo (stessa mapping di event-register) ──
// CH0 kick · CH1 percussion · CH2 drone · CH3 bass
// CH4 chord · CH5 voice · CH6 lead · CH7 arp
const CH_ROLE = ['kick','percussion','drone','bass','chord','voice','lead','arp'];

// ── Stato ──
let _fields = null;
let _bioma  = null;
let _cellsX = 96;
let _cellsY = 54;
let _cellPx = 10;
let _W      = _cellsX * _cellPx;
let _H      = _cellsY * _cellPx;

// particles con fisica propria
const _particles = { chord: [], arp: [] };

// Solidification layer A: silence frames per role
const _silenceFrames = {};
for (const r of ROLES) _silenceFrames[r] = 0;

// Offscreen canvas — Bayer renderizza qui, poi drawImage upscalato
let _off = null, _offCtx = null;
let _imgData = null, _imgBuf = null;

// ── Helpers esposti alle depositFn ──
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function idx(cx, cy) { return cy * _cellsX + cx; }
function pitchToCell(p) { return Math.round((1 - p / 127) * (_cellsY - 1)); }

// Mapping locale: [lo,hi] → 80% centrale del campo Y
// High pitch = low Y (top), low pitch = high Y (bottom)
function localPitchToCell(note, lo, hi) {
  if (lo >= hi) return Math.floor(_cellsY / 2);
  const margin = Math.floor(_cellsY * 0.10);
  const usable = _cellsY - 1 - 2 * margin;
  const t = clamp((note - lo) / (hi - lo), 0, 1);
  return Math.round(margin + (1 - t) * usable); // t=1 (acuto) → top
}

function depositPoint(field, cx, cy, force) {
  if (cx < 0 || cx >= _cellsX || cy < 0 || cy >= _cellsY) return;
  const i = idx(cx, cy);
  const v = field[i] + force;
  field[i] = v > 1 ? 1 : v < 0 ? 0 : v;
}

function depositRow(field, cy, force) {
  if (cy < 0 || cy >= _cellsY) return;
  for (let cx = 0; cx < _cellsX; cx++) depositPoint(field, cx, cy, force);
}

function depositBlob(field, cx, cy, w, h, force) {
  for (let dy = 0; dy < h; dy++) {
    const falloff = 1 - dy / (h + 1);
    for (let dx = -w; dx <= w; dx++) {
      const f = force * falloff * (1 - Math.abs(dx) / (w + 1));
      depositPoint(field, cx + dx, cy + dy, f);
    }
  }
}

function smoothstep(lo, hi, x) {
  const t = clamp((x - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
}

const HELPERS = {
  get CELLS_X() { return _cellsX; },
  get CELLS_Y() { return _cellsY; },
  get CELLS() { return _cellsX; },  // backward compat for horizontal depositFn
  clamp, pitchToCell, localPitchToCell,
  depositPoint, depositRow, depositBlob,
};

// ── Init / resize ──
function _ensureBuffers() {
  if (_fields) return;
  _fields = {};
  for (const r of ROLES) _fields[r] = new Float32Array(_cellsX * _cellsY);
}

function _ensureOffscreen() {
  const targetW = _cellsX * _cellPx;
  const targetH = _cellsY * _cellPx;
  if (_off && _W === targetW && _H === targetH) return;
  _W = targetW;
  _H = targetH;
  _off = document.createElement('canvas');
  _off.width  = _W;
  _off.height = _H;
  _offCtx = _off.getContext('2d');
  _imgData = _offCtx.createImageData(_W, _H);
  _imgBuf  = _imgData.data;
}

// ── API pubblica ──

export function initCampo() {
  _cellsX = CFG.VISUAL?.campo?.cellsX ?? 96;
  _cellsY = CFG.VISUAL?.campo?.cellsY ?? 54;
  _cellPx = CFG.VISUAL?.campo?.cellPx ?? 10;
  _ensureBuffers();
  _ensureOffscreen();
  _bioma = getBiome('GENERIC');
}

export function setBiome(trackName) {
  _bioma = getBiome(trackName);
  // non resettiamo i fields: il palimpsesto è il punto, il nuovo bioma
  // applica solo nuove forze sopra lo stato esistente
}

export function clearAll() {
  if (!_fields) return;
  for (const r of ROLES) {
    _fields[r].fill(0);
    _silenceFrames[r] = 0;
  }
  _particles.chord.length = 0;
  _particles.arp.length = 0;
}

// Chiamata da render.js per ogni nota MIDI
// ch: 0..7, note: 0..127, vel: 0..127
export function feedNote(ch, note127, vel127) {
  _ensureBuffers();
  if (!_bioma) _bioma = getBiome('GENERIC');

  // Firma: gelo blocks all new deposits
  if (firma.gelo) return;

  // Firma: densityCap probabilistic gate
  if (firma.densityCap < 1 && Math.random() >= firma.densityCap) return;

  const role = CH_ROLE[ch];
  if (!role) return;
  if (_bioma.force[role] === 0) return;

  // Reset silence counter — this role is playing
  _silenceFrames[role] = 0;

  const custom = _bioma.depositFn && _bioma.depositFn[role];
  if (custom) {
    custom(_fields, _particles, note127, vel127, HELPERS);
    return;
  }

  // Default depositors
  const cy = pitchToCell(note127);
  const cx = Math.floor(_cellsX / 2);
  const f  = (vel127 / 127) * _bioma.force[role];
  depositPoint(_fields[role], cx, cy, f);
}

// Chiamata ogni frame dopo feedNote
export function updateCampo(dt, audioEnergy = 0) {
  _ensureBuffers();
  if (!_bioma) _bioma = getBiome('GENERIC');

  // ── Firma: gelo — total freeze, no evolution ──
  if (firma.gelo) return;

  // ── Audio-reactive (biome-specific) ──
  if (_bioma.audioReact) {
    _bioma.audioReact(_fields, audioEnergy, HELPERS);
  }

  const shimmer = CFG.VISUAL?.campo?.shimmer ?? 0.05;
  const cfg = CFG.VISUAL?.campo ?? {};
  const freezeCfg = _bioma.freeze || {};

  // Layer A config (silence crystallization)
  const silenceThresholds = cfg.silenceThreshold ?? {};
  const freezeRoleEnabled = freezeCfg.roleEnabled !== false;

  // Layer B config (density stabilization)
  const fdLo = freezeCfg.densityThreshold ?? cfg.freezeDensityLo ?? 0.4;
  const fdHi = freezeCfg.densityThreshold != null
    ? freezeCfg.densityThreshold + 0.2
    : (cfg.freezeDensityHi ?? 0.8);
  const freezeDensityEnabled = freezeCfg.densityEnabled !== false;

  // Layer C config (spatial sedimentation)
  const fsLo = cfg.freezeSpatialLo ?? 0.5;
  const fsHi = cfg.freezeSpatialHi ?? 0.9;
  const freezeSpatialEnabled = freezeCfg.spatial !== false;

  // Global override (e.g. RITORNO freeze 50%)
  const globalFreeze = freezeCfg.globalFactor ?? 0;

  // ── Chord particles ──
  for (let i = _particles.chord.length - 1; i >= 0; i--) {
    const p = _particles.chord[i];
    p.cy += p.vy;
    if (p.cy >= _cellsY) { _particles.chord.splice(i, 1); continue; }
    const cy = Math.floor(p.cy);
    for (let dx = -p.halfW; dx <= p.halfW; dx++) {
      const falloff = 1 - Math.abs(dx) / (p.halfW + 1);
      depositPoint(_fields.chord, p.cx + dx, cy,     p.headF * falloff);
      depositPoint(_fields.chord, p.cx + dx, cy - 1, p.f     * falloff);
    }
  }

  // ── Arp particles ──
  for (let i = _particles.arp.length - 1; i >= 0; i--) {
    const p = _particles.arp[i];
    p.cy += p.vy;
    if (p.cy >= _cellsY) { _particles.arp.splice(i, 1); continue; }
    depositPoint(_fields.arp, p.cx, Math.floor(p.cy), p.f * 0.4);
  }

  // ── Convergenza: matter migrates toward center ──
  if (firma.convergenza) {
    const centerX = Math.floor(_cellsX / 2);
    const centerY = Math.floor(_cellsY / 2);
    const pull = 0.3 * dt;
    for (const r of ROLES) {
      const f = _fields[r];
      for (let cy = 0; cy < _cellsY; cy++) {
        for (let cx = 0; cx < _cellsX; cx++) {
          const i = cy * _cellsX + cx;
          if (f[i] < 0.01) continue;
          const dx = cx < centerX ? 1 : cx > centerX ? -1 : 0;
          const dy = cy < centerY ? 1 : cy > centerY ? -1 : 0;
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || nx >= _cellsX || ny < 0 || ny >= _cellsY) continue;
          const ni = ny * _cellsX + nx;
          const transfer = f[i] * pull;
          f[i]  -= transfer;
          f[ni] += transfer;
          if (f[ni] > 1) f[ni] = 1;
        }
      }
    }
  }

  // ── Decay + shimmer + 3-layer solidification ──
  for (const r of ROLES) {
    const baseDr = _bioma.decay[r];
    if (baseDr >= 1.0) continue;
    const f = _fields[r];

    // Layer A: increment silence for this role
    _silenceFrames[r]++;
    const silThresh = (silenceThresholds[r] ?? 3) * 60; // seconds → frames @60fps
    const freezeA = freezeRoleEnabled
      ? smoothstep(0, silThresh, _silenceFrames[r])
      : 0;

    for (let i = 0; i < f.length; i++) {
      const density = f[i];
      if (density < 0.001) { f[i] = 0; continue; }

      // Layer B: high density stabilizes
      const freezeB = freezeDensityEnabled
        ? smoothstep(fdLo, fdHi, density)
        : 0;

      // Layer C: lower part sediments
      const cy = (i / _cellsX) | 0;
      const freezeC = freezeSpatialEnabled
        ? smoothstep(fsLo, fsHi, cy / _cellsY)
        : 0;

      // Compose: max of 3 layers + global
      const freezeTotal = Math.max(freezeA, freezeB, freezeC, globalFreeze);

      // effectiveDecay: 1.0 = permanent, baseDr = biome decay
      const dr = baseDr + (1.0 - baseDr) * freezeTotal;

      f[i] *= dr;

      // Shimmer
      if (f[i] > 0.01) f[i] += (Math.random() * 2 - 1) * shimmer * f[i];
      if (f[i] < 0) f[i] = 0;
      if (f[i] > 1) f[i] = 1;
    }
  }
}

// Render: campo → Bayer halftone → offscreen → drawImage scalato
export function renderCampo(ctx, W, H) {
  _ensureBuffers();
  _ensureOffscreen();
  if (!_bioma) _bioma = getBiome('GENERIC');

  const data = _imgBuf;
  const [bgR, bgG, bgB] = _bioma.bg;

  // BG fill offscreen
  for (let i = 0; i < data.length; i += 4) {
    data[i]   = bgR;
    data[i+1] = bgG;
    data[i+2] = bgB;
    data[i+3] = 255;
  }

  const defaultRoleCpx = CFG.VISUAL?.campo?.roleCellPx ?? {};

  // Z-order rendering — one pass per role with its own cellPx
  for (const role of ZORDER) {
    const field = _fields[role];
    const [rC, gC, bC] = _bioma.colors[role];
    if (rC === 0 && gC === 0 && bC === 0) continue;

    const srcR = rC / 255;
    const srcG = gC / 255;
    const srcB = bC / 255;

    // cellPx per role: biome override > config default > fallback
    const cpx = (_bioma.cellPx && _bioma.cellPx[role])
             ?? defaultRoleCpx[role]
             ?? _cellPx;
    const halfCpx = Math.floor(cpx / 2);

    for (let cy = 0; cy < _cellsY; cy++) {
      for (let cx = 0; cx < _cellsX; cx++) {
        const density = field[cy * _cellsX + cx];
        if (density < 0.003) continue;

        // Proportional position on offscreen
        const centerX = Math.floor((cx + 0.5) * _W / _cellsX);
        const centerY = Math.floor((cy + 0.5) * _H / _cellsY);

        // Pixel area cpx × cpx centered on position
        const x0 = Math.max(0, centerX - halfCpx);
        const y0 = Math.max(0, centerY - halfCpx);
        const x1 = Math.min(_W, centerX - halfCpx + cpx);
        const y1 = Math.min(_H, centerY - halfCpx + cpx);

        for (let py = y0; py < y1; py++) {
          for (let px = x0; px < x1; px++) {
            if (density < bayer(px, py)) continue;
            const pi = (py * _W + px) * 4;
            // screen blend
            data[pi]   = ((1 - (1 - srcR) * (1 - data[pi]   / 255)) * 255) | 0;
            data[pi+1] = ((1 - (1 - srcG) * (1 - data[pi+1] / 255)) * 255) | 0;
            data[pi+2] = ((1 - (1 - srcB) * (1 - data[pi+2] / 255)) * 255) | 0;
          }
        }
      }
    }
  }

  _offCtx.putImageData(_imgData, 0, 0);

  // Upscale to canvas — same aspect ratio, zero stretch
  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(_off, 0, 0, _W, _H, 0, 0, W, H);
  ctx.imageSmoothingEnabled = prevSmoothing;
}
