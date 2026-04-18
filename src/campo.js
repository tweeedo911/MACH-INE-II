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
import { worldState, phaseState } from './world-state.js';


// ── Planet mask (RITORNO) ──
// Contorno irregolare: 256 offsets angolari pre-calcolati
const _PLANET_NOISE_RES = 256;
let _planetNoise = null;     // Float32Array[256] — offsets -1..1
let _planetNoiseFrame = 0;
let _rLUT = null;            // Float32Array[256] — raggio per angolo (riusato ogni frame)

function _buildPlanetNoise() {
  // 3 ottave di sin sovrapposti → contorno organico, non circolare
  const n = new Float32Array(_PLANET_NOISE_RES);
  // frequenze prime per evitare periodicità visibile
  const seed = Math.random() * 1000;
  for (let i = 0; i < _PLANET_NOISE_RES; i++) {
    const a = (i / _PLANET_NOISE_RES) * Math.PI * 2;
    n[i] = Math.sin(a * 5 + seed) * 0.35
         + Math.sin(a * 11 + seed * 1.7) * 0.25
         + Math.sin(a * 23 + seed * 2.3) * 0.15;
  }
  return n;
}

// Raggio maschera pianeta in pixel, dato il baseRadius normalizzato (0-1)
function _planetRadiusAt(angleDeg, baseR, noiseAmount) {
  if (!_planetNoise) return baseR;
  const idx = ((angleDeg % _PLANET_NOISE_RES) + _PLANET_NOISE_RES) % _PLANET_NOISE_RES;
  return baseR * (1 + _planetNoise[idx] * noiseAmount);
}

// ── Bayer 4×4 con threshold variabile (anti-tappezzeria continua) ──
const BAYER4 = [0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5];
// Pre-normalizzata: evita /16 nel loop interno
const BAYER4N = new Float32Array(16);
for (let i = 0; i < 16; i++) BAYER4N[i] = BAYER4[i] / 16;
let _renderFrame = 0;

// ── Noise 2D non-separabile per rompere il pattern Bayer ──
// Hash intero (px,py,frame) → rumore pseudo-casuale in [-amp, +amp].
// NON separabile: evita il pattern tartan che sin(x)+sin(y) produceva.
// LUT statica 256×256 riciclata con offset temporale (zero alloc/frame).
const _NOISE_SZ = 256;
const _noiseLUT = new Float32Array(_NOISE_SZ * _NOISE_SZ);
{
  // Riempi con hash deterministico — distribuzione uniforme -1..1
  // Mulberry32-style: veloce, buona distribuzione, nessun artefatto visibile
  let s = 0x9E3779B9;
  for (let i = 0; i < _NOISE_SZ * _NOISE_SZ; i++) {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    _noiseLUT[i] = ((t ^ (t >>> 14)) >>> 0) / 0xFFFFFFFF * 2 - 1;
  }
}
let _noiseOffX = 0, _noiseOffY = 0;  // offset temporale (cambia ogni frame)

function _rebuildDriftLUT() {
  // Offset lento nel tempo — il noise si muove, non si ripete identico
  _noiseOffX = (_renderFrame * 3) & (_NOISE_SZ - 1);
  _noiseOffY = (_renderFrame * 7) & (_NOISE_SZ - 1);
}

const _DRIFT_AMP = 0.07;  // ampiezza noise (v3.17: 0.12→0.05 era troppo poco → 0.07 compromise: crisp ma con dither sufficiente a rompere eventuali pattern residui)

function bayer(px, py) {
  const nx = (px + _noiseOffX) & (_NOISE_SZ - 1);
  const ny = (py + _noiseOffY) & (_NOISE_SZ - 1);
  return BAYER4N[(py & 3) * 4 + (px & 3)] + _noiseLUT[ny * _NOISE_SZ + nx] * _DRIFT_AMP;
}

// ── Phase-aware multipliers ──
// Modula force e decay in base alla fase corrente
const PHASE_FORCE_MULT = {
  germoglio:    0.35,
  pulsazione:   0.65,
  densita:      1.00,
  rottura:      1.20,
  dissoluzione: 0.40,
};
const PHASE_DECAY_OFFSET = {
  germoglio:    +0.002,   // più effimero
  pulsazione:    0,
  densita:       0,
  rottura:      -0.004,   // più persistente — i segni restano
  dissoluzione: -0.008,   // si cristallizza — il mondo si spegne
};

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
let _lastDeposit = null;  // Uint16Array per ruolo: frame dell'ultimo deposito significativo
let _bioma  = null;
let _cellsX = 96;
let _cellsY = 54;
let _cellPx = 10;
let _W      = _cellsX * _cellPx;
let _H      = _cellsY * _cellPx;

// ── V3.9: Morph state — interpolazione colori + decay tra biomi ──
const MORPH_DURATION = 3.0;  // secondi
let _morphTimer   = 0;
let _morphOldBg   = null;    // [r,g,b] del bioma uscente
let _morphOldColors = null;  // { role: [r,g,b], ... } del bioma uscente
let _morphOldDecay  = null;  // { role: decayValue, ... } del bioma uscente

// ── V3.10: Transizione gestuale — depositFn uscente usata con peso decrescente ──
let _morphOldDepositFn = null;  // depositFn{} del bioma uscente
let _morphOldForce = null;      // force{} del bioma uscente

// particles con fisica propria
const _particles = { chord: [], arp: [], voice: [], lead: [] };

// Shimmer LUT — riusate ogni frame (evita allocazioni per frame)
let _shimmerX = null, _shimmerY = null, _shimmerD = null;
let _centerXLUT = null, _centerYLUT = null;  // pixel centers per cella — pre-calc 1× per resize

// ── Geologia cumulativa REALE per RITORNO (B1) ──
// Memoria unica che attraversa tutta la suite. Al cambio traccia, la
// memoria decade leggermente (0.92×) e il field corrente si fonde dentro
// (il 35% del massimo tra i ruoli sopravvive) con il colore medio del
// bioma uscente pesato per la densità. In RITORNO diventa substrato
// visibile al 40%: il pubblico vede la storia dei 55 minuti precedenti.
const _GEO_DECAY_ON_TRACK_CHANGE = 0.94;  // v3.18 fix: era 0.92 — memoria più persistente (7ª traccia pesa ≈0.68 vs 0.61)
const _GEO_MERGE_FACTOR = 0.52;           // v3.18 fix: era 0.35 — deposito più forte per traccia
let _geoMemory = null;     // Float32Array size=cellsX*cellsY  — densità fusa
let _geoMemoryRGB = null;  // Float32Array size*3 — colore fuso (R,G,B in 0..255)
let _biomaName = 'GENERIC';  // nome del bioma corrente (serve a render per B2.1)

// Solidification layer A: silence frames per role
const _silenceFrames = {};
for (const r of ROLES) _silenceFrames[r] = 0;

// Offscreen canvas — Bayer renderizza qui, poi drawImage upscalato
let _off = null, _offCtx = null;
let _imgData = null, _imgBuf = null;
let _imgBuf32 = null;   // Uint32Array view per BG fill veloce

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

let _activeRole = null;  // settato da feedNote, letto da depositPoint per aging
function depositPoint(field, cx, cy, force) {
  if (cx < 0 || cx >= _cellsX || cy < 0 || cy >= _cellsY) return;
  const i = idx(cx, cy);
  const v = field[i] + force;
  field[i] = v > 1 ? 1 : v < 0 ? 0 : v;
  // marca timestamp deposito per aging (solo se deposito significativo)
  if (force > 0.01 && _activeRole && _lastDeposit) {
    _lastDeposit[_activeRole][i] = _renderFrame & 0xFFFF;
  }
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

// ── ENCORE v2: geometric deposit helpers ──

function depositDiagonal(field, angle, thickness, force) {
  // angle: 0 = top-left→bottom-right, 1 = top-right→bottom-left, 0.5 = vertical
  const W = _cellsX, H = _cellsY;
  const t = Math.max(1, thickness);
  for (let i = 0; i < H; i++) {
    const baseX = angle < 0.5
      ? Math.floor(i * (W - 1) / (H - 1))
      : W - 1 - Math.floor(i * (W - 1) / (H - 1));
    for (let dx = -Math.floor(t/2); dx <= Math.floor(t/2); dx++) {
      const cx = baseX + dx;
      if (cx >= 0 && cx < W) depositPoint(field, cx, i, force);
    }
  }
}

function depositQuadrant(field, quadrant, fillRatio, force) {
  // quadrant: 0=TL, 1=TR, 2=BL, 3=BR. fillRatio: 0-1 (0=border only, 1=filled)
  const W = _cellsX, H = _cellsY;
  const hW = Math.floor(W / 2), hH = Math.floor(H / 2);
  const x0 = (quadrant & 1) ? hW : 0;
  const y0 = (quadrant & 2) ? hH : 0;
  const x1 = (quadrant & 1) ? W  : hW;
  const y1 = (quadrant & 2) ? H  : hH;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const isBorder = (x === x0 || x === x1 - 1 || y === y0 || y === y1 - 1);
      if (isBorder || Math.random() < fillRatio) {
        depositPoint(field, x, y, force);
      }
    }
  }
}

function depositArc(field, radius, arcFraction, force) {
  const W = _cellsX, H = _cellsY;
  const cx = Math.floor(W / 2), cy = Math.floor(H / 2);
  const r = Math.min(radius, Math.min(cx, cy));
  const steps = Math.max(12, Math.floor(r * 6.28 * arcFraction));
  const maxAngle = arcFraction * 6.2832;
  const startAngle = Math.random() * 6.2832;
  for (let i = 0; i < steps; i++) {
    const a = startAngle + (i / steps) * maxAngle;
    const px = cx + Math.round(r * Math.cos(a));
    const py = cy + Math.round(r * Math.sin(a) * (W / H));
    if (px >= 0 && px < W && py >= 0 && py < H) {
      depositPoint(field, px, py, force);
    }
  }
}

function depositCross(field, cx, cy, armLen, force) {
  const W = _cellsX, H = _cellsY;
  for (let d = -armLen; d <= armLen; d++) {
    const px = cx + d, py = cy + d;
    if (px >= 0 && px < W) depositPoint(field, px, cy, force);
    if (py >= 0 && py < H) depositPoint(field, cx, py, force);
  }
}

function depositHalf(field, top, fillCount, force) {
  const W = _cellsX, H = _cellsY;
  const hH = Math.floor(H / 2);
  const y0 = top ? 0 : hH;
  const y1 = top ? hH : H;
  const maxCells = W * (y1 - y0);
  const n = Math.min(fillCount, maxCells);
  for (let i = 0; i < n; i++) {
    const px = Math.floor(Math.random() * W);
    const py = y0 + Math.floor(Math.random() * (y1 - y0));
    depositPoint(field, px, py, force);
  }
}

function depositFlash(fields, force) {
  const W = _cellsX, H = _cellsY;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      fields.kick[y * W + x] = Math.min(1, fields.kick[y * W + x] + force);
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
  depositDiagonal, depositQuadrant, depositArc, depositCross, depositHalf, depositFlash,
  // ── Runtime state — le depositFn possono leggere fase e rupture ──
  get phase()         { return worldState.phase || 'germoglio'; },
  get energy()        { return worldState.energy || 'SILENCE'; },
  get phaseProgress() { return phaseState.duration > 0 ? phaseState.elapsed / phaseState.duration : 0; },
  get rupture()       { return worldState.rupture; },
  get encoreBrick()   { return worldState.encoreBrick; },
  setEncoreInvert()   { worldState.encoreInvert = true; },
  get audioEnergy()   { return worldState.audioEnergy || 0; },
  get frameCount()    { return _renderFrame; },
};

// ── Init / resize ──
function _ensureBuffers() {
  const size = _cellsX * _cellsY;
  if (!_fields) {
    _fields = {};
    _lastDeposit = {};
    for (const r of ROLES) {
      _fields[r] = new Float32Array(size);
      _lastDeposit[r] = new Uint16Array(size);  // frame dell'ultimo deposito
    }
  }
  // B1: memoria geologica cumulativa — alloca una volta sola
  if (!_geoMemory || _geoMemory.length !== size) {
    _geoMemory = new Float32Array(size);
    _geoMemoryRGB = new Float32Array(size * 3);
  }
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
  _imgBuf32 = new Uint32Array(_imgData.data.buffer);
  // LUT pixel-centers per cella: usati da bayer, bloom, glyph, planetMask
  _centerXLUT = new Int32Array(_cellsX);
  _centerYLUT = new Int32Array(_cellsY);
  for (let cx = 0; cx < _cellsX; cx++) _centerXLUT[cx] = ((cx + 0.5) * _W / _cellsX) | 0;
  for (let cy = 0; cy < _cellsY; cy++) _centerYLUT[cy] = ((cy + 0.5) * _H / _cellsY) | 0;
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
  // V3.9: cattura colori + decay uscenti per morph
  if (_bioma) {
    _morphOldBg = [..._bioma.bg];
    _morphOldColors = {};
    _morphOldDecay = {};
    for (const r of ROLES) {
      _morphOldColors[r] = [..._bioma.colors[r]];
      _morphOldDecay[r] = _bioma.decay[r];
    }
    // V3.10: cattura gesti uscenti per transizione gestuale
    _morphOldDepositFn = _bioma.depositFn || null;
    _morphOldForce = _bioma.force ? { ..._bioma.force } : null;
    _morphTimer = 0;

    // ── B1: hook memoria geologica cumulativa ──
    // Il bioma USCENTE (quello vecchio) versa la sua memoria nell'accumulatore.
    // La memoria esistente decade 8% per ogni track change: alla 7ª traccia
    // (RITORNO) la prima (NEBBIA) pesa ≈0.92^6 = 0.61. Cumulativa ma pesata
    // in favore delle tracce recenti — coerente con l'arco narrativo.
    _updateGeoMemory();
  }
  _bioma = getBiome(trackName);
  _biomaName = trackName;
  // non resettiamo i fields: il palimpsesto è il punto, il nuovo bioma
  // applica solo nuove forze sopra lo stato esistente
}

// B1: fonde il field corrente nella memoria geologica cumulativa.
// Chiamata dal cambio traccia (setBiome), non per frame.
function _updateGeoMemory() {
  if (!_geoMemory || !_fields) return;
  const size = _cellsX * _cellsY;
  // Colore medio del bioma uscente pesato per i ruoli che hanno deposito visibile
  // (evita di contaminare la memoria col colore di ruoli silenti).
  // Precalcolo: somma dei ruoli × colore, normalizzato dopo per cella.
  const colors = _bioma.colors;
  for (let i = 0; i < size; i++) {
    // density fusa: max tra i ruoli — qualsiasi ruolo attivo conta
    let maxRole = 0;
    let cR = 0, cG = 0, cB = 0, cW = 0;
    for (let r = 0; r < ROLES.length; r++) {
      const role = ROLES[r];
      const v = _fields[role][i];
      if (v > maxRole) maxRole = v;
      if (v > 0.02) {
        const col = colors[role];
        if (col[0] || col[1] || col[2]) {
          cR += col[0] * v; cG += col[1] * v; cB += col[2] * v; cW += v;
        }
      }
    }
    // Decay della memoria esistente
    const oldD = _geoMemory[i] * _GEO_DECAY_ON_TRACK_CHANGE;
    // Nuovo contributo: max(old, current × 0.35)
    const newContrib = maxRole * _GEO_MERGE_FACTOR;
    const fused = oldD > newContrib ? oldD : newContrib;
    _geoMemory[i] = fused;

    // RGB: blend tra RGB vecchio (decadente) e nuovo (dal bioma uscente)
    const rgbBase = i * 3;
    const oldR = _geoMemoryRGB[rgbBase]     * _GEO_DECAY_ON_TRACK_CHANGE;
    const oldG = _geoMemoryRGB[rgbBase + 1] * _GEO_DECAY_ON_TRACK_CHANGE;
    const oldB = _geoMemoryRGB[rgbBase + 2] * _GEO_DECAY_ON_TRACK_CHANGE;
    if (cW > 0.05 && newContrib > oldD * 0.5) {
      // Nuova traccia dominante: fondi colore vecchio con medio nuovo
      const newR = cR / cW, newG = cG / cW, newB = cB / cW;
      // Peso del nuovo proporzionale a quanto "pesa" rispetto al vecchio
      const newWeight = newContrib / (newContrib + oldD + 0.001);
      _geoMemoryRGB[rgbBase]     = oldR * (1 - newWeight) + newR * newWeight;
      _geoMemoryRGB[rgbBase + 1] = oldG * (1 - newWeight) + newG * newWeight;
      _geoMemoryRGB[rgbBase + 2] = oldB * (1 - newWeight) + newB * newWeight;
    } else {
      // Niente nuovo deposito significativo: solo decay
      _geoMemoryRGB[rgbBase]     = oldR;
      _geoMemoryRGB[rgbBase + 1] = oldG;
      _geoMemoryRGB[rgbBase + 2] = oldB;
    }
  }
}

export function clearAll() {
  if (!_fields) return;
  for (const r of ROLES) {
    _fields[r].fill(0);
    if (_lastDeposit) _lastDeposit[r].fill(0);
    _silenceFrames[r] = 0;
  }
  _particles.chord.length = 0;
  _particles.arp.length = 0;
  _particles.voice.length = 0;
  _particles.lead.length = 0;
  // B1: reset memoria geologica (start-set a pulito)
  if (_geoMemory) _geoMemory.fill(0);
  if (_geoMemoryRGB) _geoMemoryRGB.fill(0);
}

// Chiamata da render.js per ogni nota MIDI
// ch: 0..7, note: 0..127, vel: 0..127
export function feedNote(ch, note127, vel127) {
  _ensureBuffers();
  if (!_bioma) _bioma = getBiome('GENERIC');

  // ── ENCORE v2: convergence flash ──
  if (worldState.encoreMode && worldState.encoreCanon && worldState.encoreCanon.convergence) {
    if (_bioma && _bioma.depositFn && _bioma.depositFn.convergence) {
      _bioma.depositFn.convergence(_fields, null, 64, 100, HELPERS);
    }
    worldState.encoreCanon.convergence = false;  // consume the event
  }

  // Firma: gelo blocks all new deposits
  if (firma.gelo) return;

  // Firma: densityCap probabilistic gate
  if (firma.densityCap < 1 && Math.random() >= firma.densityCap) return;

  const role = CH_ROLE[ch];
  if (!role) return;
  if (_bioma.force[role] === 0) return;

  // Reset silence counter — this role is playing
  _silenceFrames[role] = 0;

  // Phase-aware force multiplier
  const phaseMult = PHASE_FORCE_MULT[HELPERS.phase] ?? 1.0;

  _activeRole = role;  // per aging tracking in depositPoint

  // V3.10: transizione gestuale — durante morph, alcune note usano la depositFn vecchia
  // Probabilità: 30% all'inizio del morph → 0% alla fine
  if (_morphOldDepositFn && _morphOldDepositFn[role] && _morphTimer < MORPH_DURATION) {
    const morphWeight = 0.30 * (1 - _morphTimer / MORPH_DURATION);
    if (Math.random() < morphWeight) {
      const scaledVel = Math.round(vel127 * phaseMult);
      _morphOldDepositFn[role](_fields, _particles, note127, scaledVel, HELPERS);
      _activeRole = null;
      return;
    }
  }

  // ── ENCORE heartbeat: deposit in growing centered circle ──
  if (worldState.encoreMode && worldState.phase === 'germoglio') {
    const beat = Math.floor(phaseState.progress * 8);
    const radius = Math.max(1, Math.floor((beat + 1) * (_cellsX / 16)));
    const cx = Math.floor(_cellsX / 2);
    const cy = Math.floor(_cellsY / 2);
    const dx = Math.floor(Math.random() * radius * 2) - radius;
    const dy = Math.floor(Math.random() * radius * 2) - radius;
    if (dx * dx + dy * dy <= radius * radius) {
      const px = Math.max(0, Math.min(_cellsX - 1, cx + dx));
      const py = Math.max(0, Math.min(_cellsY - 1, cy + dy));
      const biomeForce = (_bioma.force && _bioma.force[role]) || 0.15;
      _fields[role][py * _cellsX + px] = Math.min(1, _fields[role][py * _cellsX + px] + biomeForce);
    }
    _activeRole = null;
    return;
  }

  const custom = _bioma.depositFn && _bioma.depositFn[role];
  if (custom) {
    // Scala vel127 con phase multiplier prima di passare alla depositFn
    const scaledVel = Math.round(vel127 * phaseMult);
    custom(_fields, _particles, note127, scaledVel, HELPERS);
    _activeRole = null;
    return;
  }

  // Default depositors
  const cy = pitchToCell(note127);
  const cx = Math.floor(_cellsX / 2);
  const f  = (vel127 / 127) * _bioma.force[role] * phaseMult;
  depositPoint(_fields[role], cx, cy, f);
  _activeRole = null;
}

// Chiamata ogni frame dopo feedNote
export function updateCampo(dt, audioEnergy = 0) {
  _ensureBuffers();
  if (!_bioma) _bioma = getBiome('GENERIC');

  // V3.5: advance morph timer
  if (_morphOldBg) {
    _morphTimer += dt;
    if (_morphTimer >= MORPH_DURATION) {
      _morphOldBg = null;
      _morphOldColors = null;
      _morphOldDecay = null;
      _morphOldDepositFn = null;
      _morphOldForce = null;
    }
  }

  // ── Firma: gelo — total freeze, no evolution ──
  if (firma.gelo) return;

  // ── Audio-reactive (biome-specific) ──
  if (_bioma.audioReact) {
    _bioma.audioReact(_fields, audioEnergy, HELPERS);
  }

  const shimmer = (CFG.VISUAL?.campo?.shimmer ?? 0.05) * (_bioma.shimmerScale || 1.0);
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

  // ── Voice particles (NEBBIA nebulose espandenti) ──
  for (let i = _particles.voice.length - 1; i >= 0; i--) {
    const p = _particles.voice[i];
    p.age++;
    if (p.age > p.maxAge) { _particles.voice.splice(i, 1); continue; }
    // nebulosa si espande: raggio cresce con l'età
    const r = Math.floor(p.r0 + (p.rMax - p.r0) * (p.age / p.maxAge));
    const fade = 1 - (p.age / p.maxAge);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const dist = Math.sqrt(dx * dx + dy * dy) / (r + 1);
        depositPoint(_fields.voice, p.cx + dx, p.cy + dy, p.f * fade * (1 - dist));
      }
    }
  }

  // ── Lead particles (scie brevi) ──
  for (let i = _particles.lead.length - 1; i >= 0; i--) {
    const p = _particles.lead[i];
    p.cx += p.vx;
    p.age++;
    if (p.age > p.maxAge || p.cx < 0 || p.cx >= _cellsX) {
      _particles.lead.splice(i, 1); continue;
    }
    const fade = 1 - (p.age / p.maxAge);
    depositPoint(_fields.lead, Math.floor(p.cx), p.cy, p.f * fade);
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

  // ── Shimmer LUT (pre-calcolate una volta per frame, non per cella×ruolo) ──
  const _shimmerT = _renderFrame * 0.017;
  if (!_shimmerX || _shimmerX.length !== _cellsX) _shimmerX = new Float32Array(_cellsX);
  if (!_shimmerY || _shimmerY.length !== _cellsY) _shimmerY = new Float32Array(_cellsY);
  if (!_shimmerD || _shimmerD.length !== _cellsX) _shimmerD = new Float32Array(_cellsX);
  for (let cx = 0; cx < _cellsX; cx++) _shimmerX[cx] = Math.sin(cx * 0.21 + _shimmerT) * 0.4;
  for (let cy = 0; cy < _cellsY; cy++) _shimmerY[cy] = Math.sin(cy * 0.17 + _shimmerT * 0.7) * 0.35;
  for (let d = 0; d < _cellsX; d++)    _shimmerD[d]   = Math.sin(d  * 0.13 + _shimmerT * 1.3) * 0.25;

  // ── Phase-aware decay offset ──
  const phaseDecayOff = PHASE_DECAY_OFFSET[HELPERS.phase] ?? 0;

  // ── Density cap per ruolo (bioma.maxDensity) ──
  const maxDensityMap = _bioma.maxDensity || null;

  // ── V3.9: morph factor per decay interpolation ──
  const morphT = _morphOldBg ? Math.min(1, _morphTimer / MORPH_DURATION) : 1;
  const decayMorphT = _morphOldDecay
    ? (morphT < 0.5 ? 2 * morphT * morphT : 1 - Math.pow(-2 * morphT + 2, 2) / 2)
    : 1;

  // ── Decay + shimmer + 3-layer solidification ──
  for (const r of ROLES) {
    // V3.9: interpola decay dal bioma uscente al nuovo durante il morph
    const newDr = _bioma.decay[r];
    const baseDr = _morphOldDecay
      ? _morphOldDecay[r] + (newDr - _morphOldDecay[r]) * decayMorphT
      : newDr;
    if (baseDr >= 1.0) continue;
    const f = _fields[r];

    // Density cap per questo ruolo (se definito nel bioma)
    const roleCap = maxDensityMap ? (maxDensityMap[r] ?? 1.0) : 1.0;

    // Layer A: increment silence for this role
    _silenceFrames[r]++;
    const silThresh = (silenceThresholds[r] ?? 3) * 60; // seconds → frames @60fps
    const freezeA = freezeRoleEnabled
      ? smoothstep(0, silThresh, _silenceFrames[r])
      : 0;

    // Phase-adjusted base decay (clamp to valid range 0..0.9999)
    const phaseDr = Math.min(0.9999, Math.max(0.5, baseDr + phaseDecayOff));

    // Nested loop: cy/cx pre-calcolati una volta — niente divmod per cella
    // (era: cy=(i/_cellsX)|0 calcolato 2× per cella in flat loop)
    for (let cy = 0; cy < _cellsY; cy++) {
      const freezeCRow = freezeSpatialEnabled
        ? smoothstep(fsLo, fsHi, cy / _cellsY)
        : 0;
      const sY = _shimmerY[cy];
      const rowBase = cy * _cellsX;
      for (let cx = 0; cx < _cellsX; cx++) {
        const i = rowBase + cx;
        const density = f[i];
        if (density < 0.001) { f[i] = 0; continue; }

        // Density cap: accelera decay se sopra il tetto
        let capPenalty = 0;
        if (density > roleCap) {
          capPenalty = (density - roleCap) * 0.5;
        }

        // Layer B: high density stabilizes
        const freezeB = freezeDensityEnabled
          ? smoothstep(fdLo, fdHi, density)
          : 0;

        // Compose: max of 3 layers + global
        const freezeTotal = Math.max(freezeA, freezeB, freezeCRow, globalFreeze);
        const dr = phaseDr + (1.0 - phaseDr) * freezeTotal;

        f[i] = f[i] * dr - capPenalty;

        // Shimmer spazialmente coerente — LUT shimmerX/Y/D
        if (f[i] > 0.01) {
          const wave = _shimmerX[cx] + sY + _shimmerD[((cx + cy) % _cellsX)];
          f[i] += wave * shimmer * f[i];
        }
        if (f[i] < 0) f[i] = 0;
        if (f[i] > 1) f[i] = 1;
      }
    }
  }

  // ── Erosione morfologica in dissoluzione ──
  // Le celle di bordo (con almeno 1 vicino vuoto) perdono materia
  // progressivamente. Il campo si sgretola, non si spegne e basta.
  if (HELPERS.phase === 'dissoluzione') {
    const pp = HELPERS.phaseProgress;
    const erosionRate = 0.005 + pp * 0.025;  // cresce durante la dissoluzione
    for (const r of ROLES) {
      const f = _fields[r];
      for (let cy = 1; cy < _cellsY - 1; cy++) {
        for (let cx = 1; cx < _cellsX - 1; cx++) {
          const i = cy * _cellsX + cx;
          if (f[i] < 0.02) continue;
          // conta vicini vuoti (4-connected)
          let emptyN = 0;
          if (f[i - 1] < 0.01) emptyN++;            // sinistra
          if (f[i + 1] < 0.01) emptyN++;            // destra
          if (f[i - _cellsX] < 0.01) emptyN++;      // sopra
          if (f[i + _cellsX] < 0.01) emptyN++;      // sotto
          if (emptyN > 0) {
            f[i] -= erosionRate * emptyN;
            if (f[i] < 0) f[i] = 0;
          }
        }
      }
    }
  }
}


// ── Camera: calcola densità media del campo (per gate macro in germoglio) ──
function _avgFieldDensity() {
  if (!_fields) return 0;
  let sum = 0;
  const size = _cellsX * _cellsY;
  for (const r of ROLES) {
    const f = _fields[r];
    for (let i = 0; i < size; i++) sum += f[i];
  }
  return sum / (size * ROLES.length);
}

// Render: campo → Bayer halftone → offscreen → camera transform → drawImage
export function renderCampo(ctx, W, H) {
  _ensureBuffers();
  _ensureOffscreen();
  if (!_bioma) _bioma = getBiome('GENERIC');

  _renderFrame++;
  _rebuildDriftLUT();

  const data = _imgBuf;

  // V3.5: morph — interpola colori se transizione attiva
  const morphT = _morphOldBg
    ? Math.min(1, _morphTimer / MORPH_DURATION)
    : 1;
  // ease-in-out per transizione naturale
  const morphEased = morphT < 0.5 ? 2 * morphT * morphT : 1 - Math.pow(-2 * morphT + 2, 2) / 2;

  let bgR = _morphOldBg ? Math.round(_morphOldBg[0] + (_bioma.bg[0] - _morphOldBg[0]) * morphEased) : _bioma.bg[0];
  let bgG = _morphOldBg ? Math.round(_morphOldBg[1] + (_bioma.bg[1] - _morphOldBg[1]) * morphEased) : _bioma.bg[1];
  let bgB = _morphOldBg ? Math.round(_morphOldBg[2] + (_bioma.bg[2] - _morphOldBg[2]) * morphEased) : _bioma.bg[2];

  // V3.9: phaseColors per bg
  const pcBg = _bioma.phaseColors;
  if (pcBg) {
    const phase = worldState.phase || 'germoglio';
    const pp = phaseState.duration > 0 ? Math.min(1, phaseState.elapsed / phaseState.duration) : 0;
    const entry = pcBg[phase];
    if (entry && entry.bg) {
      const t = entry.bg;
      bgR = Math.round(bgR + (t[0] - bgR) * pp);
      bgG = Math.round(bgG + (t[1] - bgG) * pp);
      bgB = Math.round(bgB + (t[2] - bgB) * pp);
    }
  }

  // BG fill offscreen — Uint32Array fill (4× faster than byte-by-byte)
  const bgPixel32 = (255 << 24) | (bgB << 16) | (bgG << 8) | bgR;  // little-endian ABGR
  _imgBuf32.fill(bgPixel32);

  // BPM pulsation — leggero respiro di luminosità sul battito
  const bpm = worldState.bpm || 0;
  let _bpmPulse = 1.0;  // moltiplicatore luminosità (0.96 – 1.04)
  if (bpm > 0) {
    const beatHz = bpm / 60;
    const beatPhase = (_renderFrame / 60 * beatHz) % 1.0;  // 0→1 nel beat
    // impulso breve all'inizio del beat (sin² con picco a fase 0)
    _bpmPulse = 1.0 + Math.pow(Math.sin(beatPhase * Math.PI), 2) * 0.04 - 0.02;
  }

  const defaultRoleCpx = CFG.VISUAL?.campo?.roleCellPx ?? {};

  // ── B1: Geologia cumulativa REALE — render memoria sotto il vivo ──
  // In RITORNO, il pubblico vede sotto al bioma corrente l'accumulo
  // di tutte le tracce precedenti (pesate: recenti più forti, antiche
  // sbiadite). Un solo pass: il colore è già fuso nella memoria.
  // Render al 40% di luminosità — tenue, è substrato non soggetto.
  // NON sovrascrive: screen blend con il background già renderizzato.
  if (_geoMemory && _bioma.planetMask) {
    const geoAlpha = 0.58;  // v3.18 fix: era 0.40 — substrate più visibile in RITORNO
    const cpx = defaultRoleCpx.drone ?? _cellPx;
    const halfCpx = Math.floor(cpx / 2);
    for (let cy = 0; cy < _cellsY; cy++) {
      for (let cx = 0; cx < _cellsX; cx++) {
        const cellIdx = cy * _cellsX + cx;
        const d = _geoMemory[cellIdx];
        if (d < 0.02) continue;  // v3.18 fix: era 0.05 — tracce antiche non filtrate prematuramente
        const rgbBase = cellIdx * 3;
        const giR = ((_geoMemoryRGB[rgbBase]     * geoAlpha) + 0.5) | 0;
        const giG = ((_geoMemoryRGB[rgbBase + 1] * geoAlpha) + 0.5) | 0;
        const giB = ((_geoMemoryRGB[rgbBase + 2] * geoAlpha) + 0.5) | 0;
        if (giR === 0 && giG === 0 && giB === 0) continue;
        const centerX = _centerXLUT[cx];
        const centerY = _centerYLUT[cy];
        const x0 = Math.max(0, centerX - halfCpx);
        const y0 = Math.max(0, centerY - halfCpx);
        const x1 = Math.min(_W, centerX - halfCpx + cpx);
        const y1 = Math.min(_H, centerY - halfCpx + cpx);
        const dBoost = d * 1.7;  // v3.18 fix: soglia Bayer più permissiva — 2/16 → ~5/16 pixel visibili
        for (let py = y0; py < y1; py++) {
          for (let px = x0; px < x1; px++) {
            if (dBoost < bayer(px, py)) continue;
            const pi = (py * _W + px) * 4;
            // screen blend: max(curr, substrate) implicito — non sovrascrive
            // pixel più luminosi (garanzia di correttezza, substrate sempre sotto)
            data[pi]   = data[pi]   + ((giR * (255 - data[pi]))   >> 8) | 0;
            data[pi+1] = data[pi+1] + ((giG * (255 - data[pi+1])) >> 8) | 0;
            data[pi+2] = data[pi+2] + ((giB * (255 - data[pi+2])) >> 8) | 0;
          }
        }
      }
    }
  }

  // ── B2: biome render mode — rompi la parità Bayer su 3 biomi chiave ──
  // MACCHINA = griglia pura (threshold binario, no dither)
  // NEBBIA voice = dither concentrico radiale (emanazione)
  // TEMPESTA = dither vettoriale orientato (angolo tempo-modulato, evoca il vento)
  const biomaRenderMode = _bioma.biomaRenderMode || null;
  const isMacchina = _biomaName === 'MACCHINA' || biomaRenderMode === 'grid-pure';
  // v3.18 fix: fallback sul nome come MACCHINA/TEMPESTA — biomaRenderMode non è mai
  // settato in biomi.js, quindi il ramo era dead code (dither radiale NEBBIA voice mai attivo)
  const isNebbiaRadial = _biomaName === 'NEBBIA' || biomaRenderMode === 'radial-voice';
  const isTempestaVector = _biomaName === 'TEMPESTA' || biomaRenderMode === 'vector-dither';
  // TEMPESTA: angolo lentamente rotante (1 giro ogni ~30s @ 60fps) — il vento gira
  const tempestaAngle = isTempestaVector ? (_renderFrame * 0.0035) : 0;
  const tCos = Math.cos(tempestaAngle);
  const tSin = Math.sin(tempestaAngle);

  // ── B3: rupture omen — inversione cromatica parziale (α=0.2) ──
  // Pre-calcolo il flag: controllo nel loop pixel va solo se omen attivo.
  const omenActive = worldState?.rupture?.stage === 'omen';

  // Z-order rendering — one pass per role with its own cellPx
  for (const role of ZORDER) {
    const field = _fields[role];
    // V3.5: morph colori per ruolo
    let rC, gC, bC;
    if (_morphOldColors && _morphOldColors[role]) {
      const o = _morphOldColors[role];
      const n = _bioma.colors[role];
      rC = Math.round(o[0] + (n[0] - o[0]) * morphEased);
      gC = Math.round(o[1] + (n[1] - o[1]) * morphEased);
      bC = Math.round(o[2] + (n[2] - o[2]) * morphEased);
    } else {
      [rC, gC, bC] = _bioma.colors[role];
    }

    // V3.9: phaseColors — colori che evolvono con la fase
    const pc = _bioma.phaseColors;
    if (pc) {
      const phase = worldState.phase || 'germoglio';
      const pp = phaseState.duration > 0 ? Math.min(1, phaseState.elapsed / phaseState.duration) : 0;
      const entry = pc[phase];
      if (entry && entry[role]) {
        const t = entry[role];
        // pp interpola dal colore base verso il target di fase
        rC = Math.round(rC + (t[0] - rC) * pp);
        gC = Math.round(gC + (t[1] - gC) * pp);
        bC = Math.round(bC + (t[2] - bC) * pp);
      }
    }

    if (rC === 0 && gC === 0 && bC === 0) continue;

    const srcR = Math.min(1, (rC / 255) * _bpmPulse);
    const srcG = Math.min(1, (gC / 255) * _bpmPulse);
    const srcB = Math.min(1, (bC / 255) * _bpmPulse);

    // cellPx per role: biome override > config default > fallback
    const cpx = (_bioma.cellPx && _bioma.cellPx[role])
             ?? defaultRoleCpx[role]
             ?? _cellPx;
    const halfCpx = Math.floor(cpx / 2);

    // Aging buffer per questo ruolo
    const ageMap = _lastDeposit ? _lastDeposit[role] : null;
    const curFrame16 = _renderFrame & 0xFFFF;

    for (let cy = 0; cy < _cellsY; cy++) {
      for (let cx = 0; cx < _cellsX; cx++) {
        const cellIdx = cy * _cellsX + cx;
        const density = field[cellIdx];
        if (density < 0.003) continue;

        // Aging: materia fresca = luminosa, vecchia = tenue
        // age in frame (wrapping a 16 bit), max 600 frame (~10s) per saturazione
        let ageFactor = 1.0;
        if (ageMap) {
          const depositFrame = ageMap[cellIdx];
          const age = ((curFrame16 - depositFrame) & 0xFFFF);
          const ageFrac = Math.min(age, 600) / 600;
          // agingInverted: new=bright (1.0), old=fades (0.55) — ENCORE
          // normal: old=bright (1.0), new=dim (0.55)
          ageFactor = (_bioma.agingInverted)
            ? 1.0 - ageFrac * 0.45
            : 0.55 + ageFrac * 0.45;
        }
        let aR = srcR * ageFactor;
        let aG = srcG * ageFactor;
        let aB = srcB * ageFactor;

        // ENCORE v2: strong colors at high density — Ikeda effect (color is rare and dramatic)
        if (_bioma.colorsStrong && density > 0.7) {
          const strong = _bioma.colorsStrong[role];
          if (strong) {
            const blend = (density - 0.7) / 0.3;
            aR = aR * (1 - blend) + (strong[0] / 255) * _bpmPulse * ageFactor * blend;
            aG = aG * (1 - blend) + (strong[1] / 255) * _bpmPulse * ageFactor * blend;
            aB = aB * (1 - blend) + (strong[2] / 255) * _bpmPulse * ageFactor * blend;
          }
        }

        // Proportional position on offscreen
        const centerX = _centerXLUT[cx];
        const centerY = _centerYLUT[cy];

        // Pixel area cpx × cpx centered on position
        const x0 = Math.max(0, centerX - halfCpx);
        const y0 = Math.max(0, centerY - halfCpx);
        const x1 = Math.min(_W, centerX - halfCpx + cpx);
        const y1 = Math.min(_H, centerY - halfCpx + cpx);

        // screen(a,b) = a + b*(1-a) → data[i] + src*(255 - data[i])
        // Pre-scala src in 0-255 per integer math (elimina /255 nel loop interno)
        const iR = (aR * 255 + 0.5) | 0;
        const iG = (aG * 255 + 0.5) | 0;
        const iB = (aB * 255 + 0.5) | 0;

        // ── Biome render mode per-cella: seleziona strategia threshold ──
        // 0 = bayer standard, 1 = MACCHINA binario 0.5, 2 = TEMPESTA proj,
        // 3 = NEBBIA radiale (solo voice)
        let thresholdMode = 0;
        let nebbiaRadialThresh = 0;
        if (isMacchina) {
          thresholdMode = 1;
        } else if (isTempestaVector) {
          thresholdMode = 2;
        } else if (isNebbiaRadial && role === 'voice') {
          // Onda radiale concentrica dal centro del campo (costo: 1 sqrt+1 sin per cella voice)
          const dxr = cx - (_cellsX >> 1);
          const dyr = cy - (_cellsY >> 1);
          const r = Math.sqrt(dxr * dxr + dyr * dyr);
          nebbiaRadialThresh = Math.sin(r * 0.6) * 0.2 + 0.5; // 0.3..0.7
          thresholdMode = 3;
        }

        if (thresholdMode === 1) {
          // MACCHINA: griglia pura — threshold 0.5 costante, no dither
          if (density < 0.5) continue; // intera cella sotto soglia → skip
          for (let py = y0; py < y1; py++) {
            for (let px = x0; px < x1; px++) {
              const pi = (py * _W + px) * 4;
              data[pi]   = data[pi]   + ((iR * (255 - data[pi]))   >> 8) | 0;
              data[pi+1] = data[pi+1] + ((iG * (255 - data[pi+1])) >> 8) | 0;
              data[pi+2] = data[pi+2] + ((iB * (255 - data[pi+2])) >> 8) | 0;
            }
          }
        } else if (thresholdMode === 2) {
          // TEMPESTA: Bayer proiettato sull'angolo tempestaAngle (vector-dither)
          // Forma economica: proj solo asse X, py libero su cy-index
          for (let py = y0; py < y1; py++) {
            for (let px = x0; px < x1; px++) {
              const proj = (px * tCos + py * tSin) | 0;
              const bi = ((proj & 3) << 2) | (py & 3);
              if (density < BAYER4N[bi]) continue;
              const pi = (py * _W + px) * 4;
              data[pi]   = data[pi]   + ((iR * (255 - data[pi]))   >> 8) | 0;
              data[pi+1] = data[pi+1] + ((iG * (255 - data[pi+1])) >> 8) | 0;
              data[pi+2] = data[pi+2] + ((iB * (255 - data[pi+2])) >> 8) | 0;
            }
          }
        } else if (thresholdMode === 3) {
          // NEBBIA voice: threshold radiale concentrico (onda costante per cella)
          if (density < nebbiaRadialThresh) continue;
          for (let py = y0; py < y1; py++) {
            for (let px = x0; px < x1; px++) {
              const pi = (py * _W + px) * 4;
              data[pi]   = data[pi]   + ((iR * (255 - data[pi]))   >> 8) | 0;
              data[pi+1] = data[pi+1] + ((iG * (255 - data[pi+1])) >> 8) | 0;
              data[pi+2] = data[pi+2] + ((iB * (255 - data[pi+2])) >> 8) | 0;
            }
          }
        } else {
          // Default: Bayer standard con noise drift
          for (let py = y0; py < y1; py++) {
            for (let px = x0; px < x1; px++) {
              if (density < bayer(px, py)) continue;
              const pi = (py * _W + px) * 4;
              // screen blend intero: d + src*(255-d)/255 ≈ d + (src*(255-d)+127)/255
              data[pi]   = data[pi]   + ((iR * (255 - data[pi]))   >> 8) | 0;
              data[pi+1] = data[pi+1] + ((iG * (255 - data[pi+1])) >> 8) | 0;
              data[pi+2] = data[pi+2] + ((iB * (255 - data[pi+2])) >> 8) | 0;
            }
          }
        }
      }
    }
  }

  // ── Bloom pass: voice/lead/kick sanguinano nei pixel adiacenti ──
  // Un pass leggero: ogni pixel con luminosità > soglia deposita un alone
  // attenuato nei 4 vicini cardinali. Dà gerarchia visiva ai ruoli acuti.
  {
    const bloomRoles = ['voice', 'lead', 'kick'];
    const bloomStr = 0.35;     // intensità alone (0-1)
    const bloomThresh = 0.55;  // v3.17: 0.45→0.55 — alone solo su picchi veri, resto più asciutto
    for (const role of bloomRoles) {
      const field = _fields[role];
      const cpx = (_bioma.cellPx && _bioma.cellPx[role])
               ?? defaultRoleCpx[role]
               ?? _cellPx;
      const [bR, bG, bB] = _bioma.colors[role];
      if (bR === 0 && bG === 0 && bB === 0) continue;
      // Pre-calcola: glow base × 255 per additive blend intero
      const bloomScale = bloomStr / (1 - bloomThresh);
      const ox4 = [-cpx, cpx, 0, 0];
      const oy4 = [0, 0, -cpx, cpx];

      for (let cy = 1; cy < _cellsY - 1; cy++) {
        for (let cx = 1; cx < _cellsX - 1; cx++) {
          const d = field[cy * _cellsX + cx];
          if (d < bloomThresh) continue;
          const glow = (d - bloomThresh) * bloomScale;
          const glR = bR * glow;
          const glG = bG * glow;
          const glB = bB * glow;

          const centerX = _centerXLUT[cx];
          const centerY = _centerYLUT[cy];

          for (let oi = 0; oi < 4; oi++) {
            const gpx = centerX + ox4[oi];
            const gpy = centerY + oy4[oi];
            if (gpx < 0 || gpx >= _W || gpy < 0 || gpy >= _H) continue;
            const gi = (gpy * _W + gpx) * 4;
            data[gi]   = Math.min(255, data[gi]   + glR);
            data[gi+1] = Math.min(255, data[gi+1] + glG);
            data[gi+2] = Math.min(255, data[gi+2] + glB);
          }
        }
      }
    }
  }

  // ── Planet mask (RITORNO) — maschera circolare irregolare ──
  if (_bioma.planetMask) {
    // Inizializza noise contorno se necessario (ricalcola ogni ~120 frame per variazione lenta)
    _planetNoiseFrame++;
    if (!_planetNoise || _planetNoiseFrame >= 120) {
      _planetNoise = _buildPlanetNoise();
      _planetNoiseFrame = 0;
    }

    // Calcola raggio base dalla fase:
    // germoglio: 0→1.0 (nasce come schermo intero)
    // pulsazione: 1.0→0.65 (si restringe — il nero appare intorno)
    // densita: 0.65→0.40 (il pianeta è già un disco che si allontana)
    // rottura: 0.40→0.25 (la frattura lo comprime ancora)
    // dissoluzione: 0.25→0 (scompare nel buio)
    const phase = worldState.phase || 'germoglio';
    const progress = phaseState.duration > 0 ? Math.min(1, phaseState.elapsed / phaseState.duration) : 0;
    let radiusNorm;
    if (phase === 'germoglio')         radiusNorm = progress * 1.0;           // 0→1.0
    else if (phase === 'pulsazione')   radiusNorm = 1.0 - progress * 0.35;    // 1.0→0.65
    else if (phase === 'densita')      radiusNorm = 0.65 - progress * 0.25;   // 0.65→0.40
    else if (phase === 'rottura')      radiusNorm = 0.40 - progress * 0.15;   // 0.40→0.25
    else /* dissoluzione */            radiusNorm = 0.25 * (1 - progress);     // 0.25→0

    const centerPx = _W / 2;
    const centerPy = _H / 2;
    const maxR = Math.min(_W, _H) / 2;
    const noiseAmount = 0.12;  // 12% di irregolarità sul bordo

    // Scanline planet mask — elimina sqrt+atan2 per pixel.
    // Fast-path: distanza² per il corpo, sqrt+atan2 solo sulla fascia di bordo.
    const baseR = radiusNorm * maxR;
    const maxNoiseFactor = 1 + noiseAmount;
    const minNoiseFactor = 1 - noiseAmount;
    const outerR  = baseR * maxNoiseFactor + 2;  // +2px per bordo sfumato
    const outerR2 = outerR * outerR;
    const innerR  = Math.max(0, baseR * minNoiseFactor - 2);  // -2px margine sicuro
    const innerR2 = innerR * innerR;

    // Pre-calcola raggio per angolo (256 entries, non 518K)
    if (!_rLUT || _rLUT.length !== _PLANET_NOISE_RES) _rLUT = new Float32Array(_PLANET_NOISE_RES);
    for (let a = 0; a < _PLANET_NOISE_RES; a++) {
      _rLUT[a] = _planetRadiusAt(a, baseR, noiseAmount);
    }

    const invTwoPi = _PLANET_NOISE_RES / (Math.PI * 2);
    const black32 = 255 << 24;  // alpha=255, RGB=0

    for (let py = 0; py < _H; py++) {
      const dy = py - centerPy;
      const dy2 = dy * dy;
      const rowOff = py * _W;

      // Riga fuori dal cerchio massimo → tutta nera via Uint32Array (4× vs byte)
      if (dy2 > outerR2) {
        _imgBuf32.fill(black32, rowOff, rowOff + _W);
        continue;
      }

      for (let px = 0; px < _W; px++) {
        const dx = px - centerPx;
        const dist2 = dx * dx + dy2;

        // Sicuramente dentro → nessun calcolo
        if (dist2 < innerR2) continue;

        // Sicuramente fuori → nero
        if (dist2 > outerR2) {
          const pi = (rowOff + px) * 4;
          data[pi] = 0; data[pi+1] = 0; data[pi+2] = 0;
          continue;
        }

        // Fascia di bordo: calcola angolo e raggio esatto
        const angle = Math.atan2(dy, dx);
        const angleIdx = ((angle + Math.PI) * invTwoPi) | 0;
        const r = _rLUT[angleIdx < _PLANET_NOISE_RES ? angleIdx : 0];
        const dist = Math.sqrt(dist2);

        if (dist > r) {
          const pi = (rowOff + px) * 4;
          data[pi] = 0; data[pi+1] = 0; data[pi+2] = 0;
        } else if (dist > r - 2) {
          const fade = (r - dist) / 2;
          const pi = (rowOff + px) * 4;
          data[pi]   = (data[pi]   * fade) | 0;
          data[pi+1] = (data[pi+1] * fade) | 0;
          data[pi+2] = (data[pi+2] * fade) | 0;
        }
      }
    }
  }

  // ── ENCORE: inversione colori stroboscopica (kick trigger) ──
  if (worldState.encoreInvert) {
    const len = _imgBuf32.length;
    for (let i = 0; i < len; i++) {
      _imgBuf32[i] ^= 0x00FFFFFF;  // invert RGB, keep alpha
    }
    worldState.encoreInvert = false;  // reset — dura 1 solo frame
  }

  // ── Rupture omen: lerp cromatico verso inverso α=0.2 (presagio) ──
  // Mescola ogni pixel con il suo inverso (204·c + 51·(255-c))>>8.
  // Attivo solo durante lo stage 'omen' — ~0.2ms/frame, accettabile.
  if (omenActive) {
    const len = data.length;
    for (let i = 0; i < len; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      data[i]   = (r * 204 + (255 - r) * 51) >> 8;
      data[i+1] = (g * 204 + (255 - g) * 51) >> 8;
      data[i+2] = (b * 204 + (255 - b) * 51) >> 8;
    }
  }

  _offCtx.putImageData(_imgData, 0, 0);

  // ── Glyph layer: glifi ASCII sparse per ruoli con identità ──
  // Dopo putImageData, prima della camera. fillText sull'offscreen ctx.
  // Solo celle ad alta densità → sparse, non tappezzeria.
  // Set caratteri dall'era MATRICE: ▲▼◆○□▸∙01
  {
    const glyphCfg = _bioma.glyphs;
    if (glyphCfg) {
      const chars = glyphCfg.chars || '▲▼◆○□▸∙01';
      const thresh = glyphCfg.threshold || 0.55;   // densità minima per glifo
      const roles = glyphCfg.roles || ['voice', 'lead', 'kick'];
      const opacity = glyphCfg.opacity || 0.85;

      // Colore glyph dal bioma: glyphs.color override, altrimenti auto-contrasto
      const glyphColor = glyphCfg.color;  // [r,g,b] opzionale dal bioma

      for (const role of roles) {
        const field = _fields[role];
        const [rC, gC, bC] = _bioma.colors[role];
        if (rC === 0 && gC === 0 && bC === 0) continue;

        // Colore: override bioma > auto-contrasto (chiaro su scuro, scuro su chiaro)
        let gR, gG, gB;
        if (glyphColor) {
          [gR, gG, gB] = glyphColor;
        } else {
          const lum = rC * 0.299 + gC * 0.587 + bC * 0.114;
          if (lum > 128) { gR = 0; gG = 0; gB = 0; }          // glyph nero su ruolo chiaro
          else           { gR = 240; gG = 235; gB = 220; }     // glyph crema su ruolo scuro
        }

        const cpx = (_bioma.cellPx && _bioma.cellPx[role])
                  ?? defaultRoleCpx[role]
                  ?? _cellPx;
        // Font oversized 1.5× (offscreen è a bassa res, upscale pixelated sfuocava
        // glyph rasterizzati alla dimensione nativa cella). Più pixel di sorgente = meno blur.
        const fontSize = Math.max(12, Math.round(cpx * 1.5));
        _offCtx.font = `bold ${fontSize}px 'Courier New',monospace`;
        _offCtx.textAlign = 'center';
        _offCtx.textBaseline = 'middle';
        // fillStyle settato 1× per ruolo, alpha modulata via globalAlpha
        // (era: stringa rgba allocata per ogni glifo — ~1000 alloc/frame in densità alta)
        _offCtx.fillStyle = `rgb(${gR},${gG},${gB})`;
        // v3.17: cycling rallentato 16f→64f (~267ms → ~1s) per glifi più stabili, meno scintillio
        const framePhase = (_renderFrame >> 6) & 0xFF;

        for (let cy = 0; cy < _cellsY; cy++) {
          const py = _centerYLUT[cy];
          const cyRow = cy * _cellsX;
          for (let cx = 0; cx < _cellsX; cx++) {
            const d = field[cyRow + cx];
            if (d < thresh) continue;
            const ci = (cx * 7 + cy * 13 + framePhase) % chars.length;
            _offCtx.globalAlpha = Math.min(1, (d - thresh) / 0.15) * opacity;
            _offCtx.fillText(chars[ci], _centerXLUT[cx], py);
          }
        }
      }
      _offCtx.globalAlpha = 1;  // ripristina default per pass successivi
    }
  }

  // ── Camera transform: macro / orbita / normale ──
  const cam = worldState.camera;
  const zoom = cam.zoom;
  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;

  if (zoom > 1.01) {
    // ── MACRO: ritaglia porzione dell'offscreen centrata su focus ──
    const srcW = _W / zoom;
    const srcH = _H / zoom;
    let srcX = cam.focusX * _W - srcW / 2;
    let srcY = cam.focusY * _H - srcH / 2;
    // Clamp ai bordi
    srcX = Math.max(0, Math.min(_W - srcW, srcX));
    srcY = Math.max(0, Math.min(_H - srcH, srcY));
    ctx.drawImage(_off, srcX, srcY, srcW, srcH, 0, 0, W, H);
  } else if (zoom < 0.99) {
    // ── ORBITA: offscreen scalato giù, centrato su nero ──
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const dstW = W * zoom;
    const dstH = H * zoom;
    const dstX = (W - dstW) / 2;
    const dstY = (H - dstH) / 2;
    ctx.drawImage(_off, 0, 0, _W, _H, dstX, dstY, dstW, dstH);
  } else {
    // ── NORMALE: 1:1 ──
    ctx.drawImage(_off, 0, 0, _W, _H, 0, 0, W, H);
  }

  ctx.imageSmoothingEnabled = prevSmoothing;
}

// Espone densità media per il gate camera in director3
export function getCampoAvgDensity() {
  return _avgFieldDensity();
}

// Densità per blocco — usata dal sistema camera per trovare POI
// Ritorna array di { bx, by, x, y, density, dominantRole }
// bx/by = indice blocco, x/y = centro normalizzato 0→1
export function getCampoDensityBlocks(blockSize = 8) {
  if (!_fields) return [];
  const blocksX = Math.ceil(_cellsX / blockSize);
  const blocksY = Math.ceil(_cellsY / blockSize);
  const result = [];
  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      let totalDensity = 0;
      let bestRole = null;
      let bestRoleDensity = 0;
      for (const role of ROLES) {
        const f = _fields[role];
        if (!f) continue;
        let roleDensity = 0;
        for (let dy = 0; dy < blockSize && by * blockSize + dy < _cellsY; dy++) {
          for (let dx = 0; dx < blockSize && bx * blockSize + dx < _cellsX; dx++) {
            const cx = bx * blockSize + dx;
            const cy = by * blockSize + dy;
            roleDensity += f[cy * _cellsX + cx];
          }
        }
        totalDensity += roleDensity;
        if (roleDensity > bestRoleDensity) {
          bestRoleDensity = roleDensity;
          bestRole = role;
        }
      }
      result.push({
        bx, by,
        x: (bx * blockSize + blockSize / 2) / _cellsX,
        y: (by * blockSize + blockSize / 2) / _cellsY,
        density: totalDensity,
        dominantRole: bestRole,
      });
    }
  }
  return result;
}
