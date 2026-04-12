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

// ── Bayer 4×4 ──
const BAYER4 = [0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5];
function bayer(px, py) { return BAYER4[(py % 4) * 4 + (px % 4)] / 16; }

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
let _bioma  = null;
let _cellsX = 96;
let _cellsY = 54;
let _cellPx = 10;
let _W      = _cellsX * _cellPx;
let _H      = _cellsY * _cellPx;

// ── V3.5: Morph state — interpolazione colori tra biomi ──
const MORPH_DURATION = 3.0;  // secondi
let _morphTimer   = 0;
let _morphOldBg   = null;    // [r,g,b] del bioma uscente
let _morphOldColors = null;  // { role: [r,g,b], ... } del bioma uscente

// particles con fisica propria
const _particles = { chord: [], arp: [], voice: [], lead: [] };

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
  // ── Runtime state — le depositFn possono leggere fase e rupture ──
  get phase()         { return worldState.phase || 'germoglio'; },
  get energy()        { return worldState.energy || 'SILENCE'; },
  get phaseProgress() { return phaseState.duration > 0 ? phaseState.elapsed / phaseState.duration : 0; },
  get rupture()       { return worldState.rupture; },
  get audioEnergy()   { return worldState.audioEnergy || 0; },
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
  // V3.5: cattura colori uscenti per morph
  if (_bioma) {
    _morphOldBg = [..._bioma.bg];
    _morphOldColors = {};
    for (const r of ROLES) _morphOldColors[r] = [..._bioma.colors[r]];
    _morphTimer = 0;
  }
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
  _particles.voice.length = 0;
  _particles.lead.length = 0;
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

  // Phase-aware force multiplier
  const phaseMult = PHASE_FORCE_MULT[HELPERS.phase] ?? 1.0;

  const custom = _bioma.depositFn && _bioma.depositFn[role];
  if (custom) {
    // Scala vel127 con phase multiplier prima di passare alla depositFn
    const scaledVel = Math.round(vel127 * phaseMult);
    custom(_fields, _particles, note127, scaledVel, HELPERS);
    return;
  }

  // Default depositors
  const cy = pitchToCell(note127);
  const cx = Math.floor(_cellsX / 2);
  const f  = (vel127 / 127) * _bioma.force[role] * phaseMult;
  depositPoint(_fields[role], cx, cy, f);
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
    }
  }

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

  // ── Phase-aware decay offset ──
  const phaseDecayOff = PHASE_DECAY_OFFSET[HELPERS.phase] ?? 0;

  // ── Density cap per ruolo (bioma.maxDensity) ──
  const maxDensityMap = _bioma.maxDensity || null;

  // ── Decay + shimmer + 3-layer solidification ──
  for (const r of ROLES) {
    const baseDr = _bioma.decay[r];
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

    for (let i = 0; i < f.length; i++) {
      const density = f[i];
      if (density < 0.001) { f[i] = 0; continue; }

      // Density cap: accelera decay se sopra il tetto
      let capPenalty = 0;
      if (density > roleCap) {
        capPenalty = (density - roleCap) * 0.5;  // forte spinta verso il cap
      }

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

      // effectiveDecay: 1.0 = permanent, phaseDr = phase-adjusted decay
      const dr = phaseDr + (1.0 - phaseDr) * freezeTotal;

      f[i] = f[i] * dr - capPenalty;

      // Shimmer
      if (f[i] > 0.01) f[i] += (Math.random() * 2 - 1) * shimmer * f[i];
      if (f[i] < 0) f[i] = 0;
      if (f[i] > 1) f[i] = 1;
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

  const data = _imgBuf;

  // V3.5: morph — interpola colori se transizione attiva
  const morphT = _morphOldBg
    ? Math.min(1, _morphTimer / MORPH_DURATION)
    : 1;
  // ease-in-out per transizione naturale
  const morphEased = morphT < 0.5 ? 2 * morphT * morphT : 1 - Math.pow(-2 * morphT + 2, 2) / 2;

  const bgR = _morphOldBg ? Math.round(_morphOldBg[0] + (_bioma.bg[0] - _morphOldBg[0]) * morphEased) : _bioma.bg[0];
  const bgG = _morphOldBg ? Math.round(_morphOldBg[1] + (_bioma.bg[1] - _morphOldBg[1]) * morphEased) : _bioma.bg[1];
  const bgB = _morphOldBg ? Math.round(_morphOldBg[2] + (_bioma.bg[2] - _morphOldBg[2]) * morphEased) : _bioma.bg[2];

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

  // ── Planet mask (RITORNO) — maschera circolare irregolare ──
  if (_bioma.planetMask) {
    // Inizializza noise contorno se necessario (ricalcola ogni ~120 frame per variazione lenta)
    _planetNoiseFrame++;
    if (!_planetNoise || _planetNoiseFrame >= 120) {
      _planetNoise = _buildPlanetNoise();
      _planetNoiseFrame = 0;
    }

    // Calcola raggio base dalla fase:
    // germoglio: cresce 0→0.70, pulsazione/densità: stabile 0.70, dissoluzione: 0.70→0
    const phase = worldState.phase || 'germoglio';
    const progress = phaseState.duration > 0 ? Math.min(1, phaseState.elapsed / phaseState.duration) : 0;
    let radiusNorm = 0.70;  // 70% del raggio minore offscreen
    if (phase === 'germoglio') {
      radiusNorm = progress * 0.70;
    } else if (phase === 'dissoluzione') {
      radiusNorm = 0.70 * (1 - progress);
    }

    const centerPx = _W / 2;
    const centerPy = _H / 2;
    const maxR = Math.min(_W, _H) / 2;
    const noiseAmount = 0.12;  // 12% di irregolarità sul bordo

    // Pixel fuori dalla maschera → bg nero
    for (let py = 0; py < _H; py++) {
      for (let px = 0; px < _W; px++) {
        const dx = px - centerPx;
        const dy = py - centerPy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Angolo → indice noise
        const angle = Math.atan2(dy, dx);
        const angleIdx = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * _PLANET_NOISE_RES);
        const r = _planetRadiusAt(angleIdx, radiusNorm * maxR, noiseAmount);

        if (dist > r) {
          const pi = (py * _W + px) * 4;
          data[pi] = 0; data[pi+1] = 0; data[pi+2] = 0;
        } else if (dist > r - 2) {
          // Bordo sfumato di 2px — antialiasing naturale
          const fade = (r - dist) / 2;
          const pi = (py * _W + px) * 4;
          data[pi]   = Math.round(data[pi]   * fade);
          data[pi+1] = Math.round(data[pi+1] * fade);
          data[pi+2] = Math.round(data[pi+2] * fade);
        }
      }
    }
  }

  _offCtx.putImageData(_imgData, 0, 0);

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
