// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Campo Materiale
//
//  Paradigma: il campo non è un visualizer.
//  È un campo fisico persistente (Float32Array 32×32 per ruolo).
//  La musica applica forze, il decay e lo shimmer danno vita
//  continua. Quello che vedi è lo STATO del campo, non eventi.
//
//  Rendering: Bayer halftone su offscreen 32*cellPx (640px
//  default), screen blend per ruolo in Z-order grave→acuto,
//  upscale al canvas full-screen con smoothing disabilitato.
//
//  Validato in proto-campo.html (2026-04-10/11).
//  Sostituisce progressivamente le comp-* via CFG.VISUAL.campo.useCampo.
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { getBiome } from './biomi.js';

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
let _cells  = 32;
let _cellPx = 20;
let _W      = _cells * _cellPx;
let _H      = _cells * _cellPx;

// particles con fisica propria
const _particles = { chord: [], arp: [] };

// Offscreen canvas — Bayer renderizza qui, poi drawImage upscalato
let _off = null, _offCtx = null;
let _imgData = null, _imgBuf = null;

// ── Helpers esposti alle depositFn ──
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function idx(cx, cy) { return cy * _cells + cx; }
function pitchToCell(p) { return Math.round((1 - p / 127) * (_cells - 1)); }

// Mapping locale: [lo,hi] → 80% centrale del campo Y
// High pitch = low Y (top), low pitch = high Y (bottom)
function localPitchToCell(note, lo, hi) {
  if (lo >= hi) return Math.floor(_cells / 2);
  const margin = Math.floor(_cells * 0.10);    // 3 celle su 32
  const usable = _cells - 1 - 2 * margin;      // 25 su 32
  const t = clamp((note - lo) / (hi - lo), 0, 1);
  return Math.round(margin + (1 - t) * usable); // t=1 (acuto) → top
}

function depositPoint(field, cx, cy, force) {
  if (cx < 0 || cx >= _cells || cy < 0 || cy >= _cells) return;
  const i = idx(cx, cy);
  const v = field[i] + force;
  field[i] = v > 1 ? 1 : v < 0 ? 0 : v;
}

function depositRow(field, cy, force) {
  if (cy < 0 || cy >= _cells) return;
  for (let cx = 0; cx < _cells; cx++) depositPoint(field, cx, cy, force);
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

const HELPERS = {
  get CELLS() { return _cells; },
  clamp, pitchToCell, localPitchToCell,
  depositPoint, depositRow, depositBlob,
};

// ── Init / resize ──
function _ensureBuffers() {
  if (_fields) return;
  _fields = {};
  for (const r of ROLES) _fields[r] = new Float32Array(_cells * _cells);
}

function _ensureOffscreen() {
  const targetW = _cells * _cellPx;
  const targetH = _cells * _cellPx;
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
  _cells  = CFG.VISUAL?.campo?.cellsX ?? 96;  // TODO: refactor → _cellsX/_cellsY separati
  _cellPx = CFG.VISUAL?.campo?.cellPx ?? 20;
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
  for (const r of ROLES) _fields[r].fill(0);
  _particles.chord.length = 0;
  _particles.arp.length = 0;
}

// Chiamata da render.js per ogni nota MIDI
// ch: 0..7, note: 0..127, vel: 0..127
export function feedNote(ch, note127, vel127) {
  _ensureBuffers();
  if (!_bioma) _bioma = getBiome('GENERIC');
  const role = CH_ROLE[ch];
  if (!role) return;
  // skip se il bioma corrente non usa questo ruolo
  if (_bioma.force[role] === 0) return;

  const custom = _bioma.depositFn && _bioma.depositFn[role];
  if (custom) {
    custom(_fields, _particles, note127, vel127, HELPERS);
    return;
  }

  // Default depositors — semplici, punto a pitch→Y centro canvas
  const cy = pitchToCell(note127);
  const cx = Math.floor(_cells / 2);
  const f  = (vel127 / 127) * _bioma.force[role];
  depositPoint(_fields[role], cx, cy, f);
}

// Chiamata ogni frame dopo feedNote
export function updateCampo(dt, audioEnergy = 0) {
  _ensureBuffers();
  if (!_bioma) _bioma = getBiome('GENERIC');

  // Audio-reactive per-frame update (bioma-specifico)
  if (_bioma.audioReact) {
    _bioma.audioReact(_fields, audioEnergy, HELPERS);
  }

  const shimmer = CFG.VISUAL?.campo?.shimmer ?? 0.05;

  // Chord particles: colonnine verticali che scendono
  for (let i = _particles.chord.length - 1; i >= 0; i--) {
    const p = _particles.chord[i];
    p.cy += p.vy;
    if (p.cy >= _cells) { _particles.chord.splice(i, 1); continue; }
    const cy = Math.floor(p.cy);
    for (let dx = -p.halfW; dx <= p.halfW; dx++) {
      const falloff = 1 - Math.abs(dx) / (p.halfW + 1);
      depositPoint(_fields.chord, p.cx + dx, cy,     p.headF * falloff);
      depositPoint(_fields.chord, p.cx + dx, cy - 1, p.f     * falloff);
    }
  }

  // Arp particles: cadono verso il basso
  for (let i = _particles.arp.length - 1; i >= 0; i--) {
    const p = _particles.arp[i];
    p.cy += p.vy;
    if (p.cy >= _cells) { _particles.arp.splice(i, 1); continue; }
    depositPoint(_fields.arp, p.cx, Math.floor(p.cy), p.f * 0.4);
  }

  // Decay + shimmer moltiplicativo per ogni ruolo
  for (const r of ROLES) {
    const dr = _bioma.decay[r];
    if (dr >= 1.0) continue;
    const f = _fields[r];
    for (let i = 0; i < f.length; i++) {
      f[i] *= dr;
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

  // Z-order rendering
  for (const role of ZORDER) {
    const field = _fields[role];
    const [rC, gC, bC] = _bioma.colors[role];
    if (rC === 0 && gC === 0 && bC === 0) continue;

    const srcR = rC / 255;
    const srcG = gC / 255;
    const srcB = bC / 255;
    const cp   = _cellPx;

    for (let cy = 0; cy < _cells; cy++) {
      for (let cx = 0; cx < _cells; cx++) {
        const density = field[idx(cx, cy)];
        if (density < 0.003) continue;
        const baseX = cx * cp;
        const baseY = cy * cp;
        for (let py = 0; py < cp; py++) {
          const gy = baseY + py;
          for (let px = 0; px < cp; px++) {
            const gx = baseX + px;
            if (density < bayer(gx, gy)) continue;
            const pi = (gy * _W + gx) * 4;
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

  // Upscale al canvas full-screen, pixel-perfect (no smoothing)
  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(_off, 0, 0, _W, _H, 0, 0, W, H);
  ctx.imageSmoothingEnabled = prevSmoothing;
}
