// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Sistema Geometrico (geo.js)
//
//  Paradigma a particelle geometriche dipinte in Bayer halftone
//  sui 4 layer canonici di layers.js (BG/MG/FG/OVERLAY). Ogni
//  canale MIDI ha una primitiva dedicata per bioma secondo il
//  contratto in docs/VISUAL-SPEC.md.
//
//  Lifecycle particella: newborn → stable → ghost → fossil → dead.
//  Layer routing automatico per ratio age/maxAge. Il decay dei
//  layer (0.90/0.97/0.985) è gestito da layers.js.
//
//  Terzo paradigma visivo, parallelo a comp-* e campo.js. Toggle
//  runtime Shift+G tramite CFG.VISUAL.geo.useGeo.
//
//  Primitive implementate: ARC, RECT.
//  Biomi calibrati: NEBBIA (ARC), SOLCO (RECT). Altri = GENERIC.
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { firma } from './firma.js';
import { getLayerCtx, compositeLayers, clearAllLayers } from './layers.js';
// NOTA: initLayers/updateLayers non sono chiamati da qui — il ciclo di
// vita dei layer è owned da render.js. geo.js consuma layers.js come
// infrastruttura condivisa.

// ── Bayer 4×4 threshold ───────────────────────────────────
const BAYER4 = [0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5];
function bayer(px, py) {
  return BAYER4[(((py|0) & 3) << 2) + ((px|0) & 3)] / 16;
}

// ── MIDI channel → role mapping ───────────────────────────
const CH_ROLE = [
  'kick',        // CH0
  'percussion',  // CH1
  'drone',       // CH2
  'bass',        // CH3
  'chord',       // CH4
  'voice',       // CH5
  'lead',        // CH6
  'arp',         // CH7
];

// ── Module state ──────────────────────────────────────────
let _W = 0, _H = 0;
let _initialized = false;
let _currentBiome = null;
let _currentBiomeKey = 'GENERIC';

const _particles = [];
const _pool = [];
const MAX_PARTICLES = 512;

// ── Terrain heightmap (per biomi con gravità tipo SOLCO) ──
const TERRAIN_COL_PX = 8;
let _terrain = null;
let _terrainCols = 0;
let _terrainFloorY = 0;

function _initTerrain() {
  _terrainCols = Math.max(1, Math.floor(_W / TERRAIN_COL_PX));
  _terrain = new Float32Array(_terrainCols);
  _terrainFloorY = _H * 0.90;
  for (let i = 0; i < _terrainCols; i++) _terrain[i] = _terrainFloorY;
}
function _terrainAt(x) {
  if (!_terrain) return _H * 0.90;
  const idx = Math.max(0, Math.min(_terrainCols - 1, Math.floor(x / TERRAIN_COL_PX)));
  return _terrain[idx];
}
function _depositTerrain(x, topY, w) {
  if (!_terrain) return;
  const halfW = w * 0.5;
  const i0 = Math.max(0, Math.floor((x - halfW) / TERRAIN_COL_PX));
  const i1 = Math.min(_terrainCols - 1, Math.ceil((x + halfW) / TERRAIN_COL_PX));
  for (let i = i0; i <= i1; i++) {
    if (topY < _terrain[i]) _terrain[i] = topY;
  }
}

// ── Object pool ───────────────────────────────────────────
function acquire() {
  const p = _pool.pop();
  if (p) return p;
  return {
    type: '', role: '',
    cx: 0, cy: 0, vx: 0, vy: 0,
    r: 0, baseR: 0,
    openAngle: 0, gapStart: 0,
    dotSize: 0, density: 0,
    w: 0, h: 0, baseW: 0, baseH: 0,
    gravity: 0, drag: 1,
    impacted: false, impactT: 0, depositsTerrain: false,
    age: 0, maxAge: 1,
    state: 'newborn', layer: 'fg',
    colorKey: 'primary',
    radiusLFOAmp: 0, radiusLFOPeriod: 24,
    pitch: 60, vel: 64,
  };
}
function release(p) {
  if (_pool.length < MAX_PARTICLES) _pool.push(p);
}

// ── Helpers ───────────────────────────────────────────────
function rangeRand(range, fallback = 0) {
  if (range == null) return fallback;
  if (Array.isArray(range)) return range[0] + Math.random() * (range[1] - range[0]);
  return range;
}

function pitchToY(note) {
  const norm = Math.max(0, Math.min(1, (96 - note) / 72));
  return norm * _H;
}

function computeLayer(role, ageRatio) {
  if (ageRatio < 0.5) return 'fg';
  if (ageRatio < 0.8) return 'mg';
  if (role === 'lead' || role === 'arp') return 'mg';
  return 'overlay';
}

function intensityForAge(r) {
  if (r < 0.5) return 1.0;
  if (r < 0.8) return 0.6;
  return 0.3;
}

function colorForParticle(p) {
  if (!_currentBiome) return '#ffffff';
  const pal = _currentBiome.palette || {};
  if (p.colorKey === 'accent' && pal.accent) return pal.accent;
  return pal[p.role] || pal.primary || '#ffffff';
}

// ── Physics per bioma ─────────────────────────────────────
function applyPhysicsNEBBIA(p) {
  if (p.type !== 'ARC') return;
  const cx = _W * 0.5, cy = _H * 0.5;
  const dx = p.cx - cx, dy = p.cy - cy;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  const r = p.age / p.maxAge;
  const speed = (0.05 + r * 0.75) * 0.8;
  p.cx += (dx / d) * speed;
  p.cy += (dy / d) * speed;
  if (p.radiusLFOAmp > 0 && p.baseR > 0) {
    const phase = (p.age / 60) / p.radiusLFOPeriod * Math.PI * 2;
    p.r = p.baseR + Math.sin(phase) * p.radiusLFOAmp;
  }
}

function applyPhysicsSOLCO(p) {
  if (p.type !== 'RECT') return;
  if (p.impacted) {
    if (p.impactT < 4) {
      p.impactT++;
      const t = p.impactT / 4;
      p.w = p.baseW * (1 + 0.4 * (1 - t));
      p.h = p.baseH * (1 - 0.4 * (1 - t));
    } else {
      p.w = p.baseW;
      p.h = p.baseH;
    }
    return;
  }
  p.vy += p.gravity;
  if (p.drag !== 1) p.vy *= p.drag;
  p.cy += p.vy;
  const topTerrainY = _terrainAt(p.cx);
  const bottomY = p.cy + p.h * 0.5;
  if (bottomY >= topTerrainY) {
    p.cy = topTerrainY - p.h * 0.5;
    p.vy = 0;
    p.impacted = true;
    p.impactT = 0;
    if (p.depositsTerrain) {
      _depositTerrain(p.cx, p.cy - p.h * 0.5, p.w);
    }
  }
}

function applyPhysicsGeneric(p) {
  p.cx += p.vx;
  p.cy += p.vy;
}

// ── Bayer halftone primitives ─────────────────────────────
function drawBayerDot(ctx, cx, cy, radius, density) {
  const r = Math.max(1, radius | 0);
  const r2 = r * r;
  const cxi = cx | 0, cyi = cy | 0;
  for (let dy = -r; dy <= r; dy++) {
    const py = cyi + dy;
    if (py < 0 || py >= _H) continue;
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const px = cxi + dx;
      if (px < 0 || px >= _W) continue;
      if (density > bayer(px, py)) {
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }
}

function drawBayerRect(ctx, cx, cy, w, h, density) {
  const x0 = Math.max(0, (cx - w * 0.5) | 0);
  const y0 = Math.max(0, (cy - h * 0.5) | 0);
  const x1 = Math.min(_W - 1, (cx + w * 0.5) | 0);
  const y1 = Math.min(_H - 1, (cy + h * 0.5) | 0);
  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      if (density > bayer(px, py)) {
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }
}

// ── ARC primitive ─────────────────────────────────────────
function spawnARC(role, cx, cy, params) {
  if (_particles.length >= MAX_PARTICLES) {
    const old = _particles.shift();
    release(old);
  }
  const p = acquire();
  p.type = 'ARC';
  p.role = role;
  p.cx = cx; p.cy = cy;
  p.vx = 0; p.vy = 0;
  p.baseR = params.r || 40;
  p.r = p.baseR;
  p.openAngle = params.openAngle || 300;
  p.gapStart = params.gapStart != null ? params.gapStart : Math.random() * 360;
  p.dotSize = params.dotSize || 4;
  p.density = params.density || 0.5;
  p.age = 0;
  p.maxAge = params.maxAge || 300;
  p.state = 'newborn';
  p.layer = 'fg';
  p.colorKey = params.colorKey || role;
  p.radiusLFOAmp = params.radiusLFOAmp || 0;
  p.radiusLFOPeriod = params.radiusLFOPeriod || 24;
  p.pitch = params.pitch || 60;
  p.vel = params.vel || 64;
  p.impacted = false; p.impactT = 0;
  p.w = 0; p.h = 0; p.baseW = 0; p.baseH = 0;
  p.gravity = 0; p.drag = 1; p.depositsTerrain = false;
  _particles.push(p);
  return p;
}

function drawARC(ctx, p) {
  ctx.fillStyle = colorForParticle(p);
  const ageR = p.age / p.maxAge;
  const densityEff = p.density * intensityForAge(ageR);
  if (densityEff <= 0.02) return;
  const arcAngleRad = p.openAngle * Math.PI / 180;
  const arcLen = p.r * arcAngleRad;
  const spacing = Math.max(2, p.dotSize * 1.3);
  const n = Math.max(4, Math.floor(arcLen / spacing));
  const startRad = p.gapStart * Math.PI / 180;
  const step = arcAngleRad / n;
  for (let i = 0; i < n; i++) {
    const a = startRad + step * i;
    const px = p.cx + Math.cos(a) * p.r;
    const py = p.cy + Math.sin(a) * p.r;
    drawBayerDot(ctx, px, py, p.dotSize, densityEff);
  }
}

// ── RECT primitive ────────────────────────────────────────
function spawnRECT(role, cx, cy, params) {
  if (_particles.length >= MAX_PARTICLES) {
    const old = _particles.shift();
    release(old);
  }
  const p = acquire();
  p.type = 'RECT';
  p.role = role;
  p.cx = cx; p.cy = cy;
  p.vx = 0; p.vy = params.vy0 || 0;
  p.baseW = params.w || 20;
  p.baseH = params.h || 8;
  p.w = p.baseW;
  p.h = p.baseH;
  p.density = params.density || 0.7;
  p.gravity = params.gravity || 0;
  p.drag = params.drag || 1;
  p.impacted = !!params.noFall;
  p.impactT = params.noFall ? 4 : 0;  // no-fall → skip squash
  p.depositsTerrain = !!params.depositsTerrain;
  p.age = 0;
  p.maxAge = params.maxAge || 300;
  p.state = 'newborn';
  p.layer = 'fg';
  p.colorKey = params.colorKey || role;
  p.pitch = params.pitch || 60;
  p.vel = params.vel || 64;
  p.dotSize = 0;
  p.r = 0; p.baseR = 0; p.openAngle = 0; p.gapStart = 0;
  p.radiusLFOAmp = 0;
  // Deposito immediato al terrain per no-fall (drone bedrock)
  if (p.impacted && p.depositsTerrain) {
    _depositTerrain(p.cx, p.cy - p.h * 0.5, p.w);
  }
  _particles.push(p);
  return p;
}

function drawRECT(ctx, p) {
  ctx.fillStyle = colorForParticle(p);
  const ageR = p.age / p.maxAge;
  const densityEff = p.density * intensityForAge(ageR);
  if (densityEff <= 0.02) return;
  drawBayerRect(ctx, p.cx, p.cy, p.w, p.h, densityEff);
}

// ── Spawn dispatch per primitive ──────────────────────────
function spawnARCFromBiome(role, note, vel, cfg) {
  const baseX = _W * 0.5 + (Math.random() - 0.5) * _W * 0.3;
  const baseY = _H * 0.5 + (Math.random() - 0.5) * _H * 0.3;
  spawnARC(role, baseX, baseY, {
    r: rangeRand(cfg.r, 40),
    openAngle: rangeRand(cfg.openAngle, 300),
    dotSize: rangeRand(cfg.dotSize, 4),
    density: rangeRand(cfg.density, 0.4),
    maxAge: rangeRand(cfg.maxAge, 300),
    radiusLFOAmp: cfg.radiusLFOAmp || 0,
    radiusLFOPeriod: cfg.radiusLFOPeriod || 24,
    pitch: note, vel,
    colorKey: cfg.colorKey || role,
  });
}

function spawnARCClusterFromBiome(role, note, vel, cfg) {
  const count = Math.floor(rangeRand(cfg.count, 3));
  const cx = _W * (0.3 + Math.random() * 0.4);
  const cy = pitchToY(note);
  const rBase = Math.max(30, note * 1.2);
  const gap = rangeRand(cfg.gap, 12);
  for (let i = 0; i < count; i++) {
    spawnARC(role, cx, cy, {
      r: rBase + i * gap,
      openAngle: rangeRand(cfg.openAngle, 310),
      dotSize: rangeRand(cfg.dotSize, 5),
      density: rangeRand(cfg.density, 0.35),
      maxAge: rangeRand(cfg.maxAge, 300),
      pitch: note, vel,
      colorKey: cfg.colorKey || role,
    });
  }
}

function spawnRECTFromBiome(role, note, vel, cfg) {
  const velN = vel / 127;
  // Y di spawn
  let cy;
  if (cfg.spawnY != null) cy = _H * rangeRand(cfg.spawnY);
  else cy = pitchToY(note);
  // X in base a xMode
  let cx;
  if (cfg.xMode === 'pitch') {
    const noteN = (note - 24) / (84 - 24);
    cx = Math.max(0, Math.min(1, noteN)) * _W;
  } else if (cfg.xMode === 'center') {
    cx = _W * 0.5;
  } else {
    cx = _W * (0.15 + Math.random() * 0.7);
  }
  // Dimensioni
  let w = rangeRand(cfg.w, 30);
  let h = rangeRand(cfg.h, 6);
  if (cfg.hVelScale) h = (cfg.hBase || 2) + velN * cfg.hVelScale;
  spawnRECT(role, cx, cy, {
    w, h,
    density: rangeRand(cfg.density, 0.6),
    gravity: cfg.gravity || 0,
    drag: cfg.drag || 1,
    noFall: !!cfg.noFall,
    depositsTerrain: !!cfg.depositsTerrain,
    maxAge: rangeRand(cfg.maxAge, 300),
    pitch: note, vel,
    colorKey: cfg.colorKey || role,
  });
}

function spawnStubFallback(role, note, vel, cfg) {
  spawnARC(role, _W * 0.5 + (Math.random() - 0.5) * _W * 0.4,
           pitchToY(note), {
    r: 12 + (vel / 127) * 24,
    openAngle: 320,
    dotSize: 3,
    density: 0.4,
    maxAge: 200,
    pitch: note, vel,
  });
}

// ── Public API ────────────────────────────────────────────
export function initGeo(W, H) {
  _W = W; _H = H;
  _initTerrain();
  _initialized = true;
  if (!_currentBiome) setBiome('GENERIC');
}

export function resizeGeo(W, H) {
  _W = W; _H = H;
  _initTerrain();
}

export function setBiome(trackName) {
  const key = (trackName || 'GENERIC').toUpperCase();
  _currentBiomeKey = key;
  _currentBiome = BIOMI_GEO[key] || BIOMI_GEO.GENERIC;
  _initTerrain();  // reset terrain al cambio traccia
}

export function clearAll() {
  while (_particles.length) release(_particles.pop());
  clearAllLayers();
  _initTerrain();
}

export function feedNote(ch, note, vel, phraseId) {
  if (!_initialized || !_currentBiome) return;
  const role = CH_ROLE[ch];
  if (!role) return;
  const cfg = (_currentBiome.channels || {})[role];
  if (!cfg) return;
  switch (cfg.primitive) {
    case 'ARC':         spawnARCFromBiome(role, note, vel, cfg); break;
    case 'ARC_CLUSTER': spawnARCClusterFromBiome(role, note, vel, cfg); break;
    case 'RECT':        spawnRECTFromBiome(role, note, vel, cfg); break;
    default:            spawnStubFallback(role, note, vel, cfg); break;
  }
}

export function update(dt) {
  if (!_initialized) return;
  if (firma.gelo) return;
  const physicsFn =
    _currentBiomeKey === 'NEBBIA' ? applyPhysicsNEBBIA :
    _currentBiomeKey === 'SOLCO'  ? applyPhysicsSOLCO  :
    applyPhysicsGeneric;
  for (let i = _particles.length - 1; i >= 0; i--) {
    const p = _particles[i];
    p.age += 1;
    if (p.age >= p.maxAge) {
      _particles.splice(i, 1);
      release(p);
      continue;
    }
    physicsFn(p);
    p.layer = computeLayer(p.role, p.age / p.maxAge);
  }
}

export function render(destCtx) {
  if (!_initialized) return;
  // BG layer — stain leggera col bg del bioma
  const bgCtx = getLayerCtx('bg');
  if (bgCtx && _currentBiome && _currentBiome.bg) {
    bgCtx.save();
    bgCtx.globalAlpha = 0.08;
    bgCtx.fillStyle = _currentBiome.bg;
    bgCtx.fillRect(0, 0, _W, _H);
    bgCtx.restore();
  }
  // Disegna particelle nei rispettivi layer
  for (let i = 0; i < _particles.length; i++) {
    const p = _particles[i];
    const ctx = getLayerCtx(p.layer);
    if (!ctx) continue;
    if (p.type === 'ARC')       drawARC(ctx, p);
    else if (p.type === 'RECT') drawRECT(ctx, p);
  }
  // Componi i layer sul canvas di destinazione
  destCtx.fillStyle = _currentBiome?.bg || '#000';
  destCtx.fillRect(0, 0, _W, _H);
  compositeLayers(destCtx);
}

// ═══════════════════════════════════════════════════════════
//  BIOMI_GEO
// ═══════════════════════════════════════════════════════════

const BIOMI_GEO = {
  // ── GENERIC fallback sicuro ──
  GENERIC: {
    bg: '#0A0A0A',
    palette: {
      primary: '#FFFFFF',
      accent:  '#CCCCCC',
      drone:   '#888899',
      chord:   '#CCCCCC',
      voice:   '#FFFFFF',
      lead:    '#EEEEEE',
      bass:    '#AAAAAA',
      kick:    '#FFFFFF',
    },
    channels: {
      drone: { primitive: 'ARC', r: [40, 80], openAngle: [280, 340], dotSize: [4, 6], density: [0.3, 0.5], maxAge: [400, 600] },
      chord: { primitive: 'ARC', r: [30, 60], openAngle: [280, 340], dotSize: [3, 5], density: [0.3, 0.5], maxAge: [200, 300] },
      voice: { primitive: 'ARC', r: [20, 40], openAngle: [290, 330], dotSize: [2, 4], density: [0.4, 0.6], maxAge: [180, 280] },
      lead:  { primitive: 'ARC', r: [25, 45], openAngle: [200, 260], dotSize: [2, 4], density: [0.4, 0.5], maxAge: [200, 300] },
    },
  },

  // ── NEBBIA — VISUAL-SPEC §I ──
  NEBBIA: {
    bg: '#0A0B10',
    palette: {
      primary:  '#8FA8C0',
      accent:   '#E8F0D8',
      residual: '#1E2535',
      drone:    '#C8D4E0',
      chord:    '#8FA8C0',
      voice:    '#8FA8C0',
      lead:     '#E8F0D8',
    },
    channels: {
      drone: {
        primitive: 'ARC',
        r: [80, 180],
        openAngle: [280, 340],
        dotSize: [6, 10],
        density: [0.35, 0.50],
        maxAge: [900, 1200],
        radiusLFOAmp: 4,
        radiusLFOPeriod: 24,
      },
      chord: {
        primitive: 'ARC_CLUSTER',
        count: [3, 5],
        gap: [10, 16],
        openAngle: [280, 340],
        dotSize: [4, 8],
        density: [0.30, 0.45],
        maxAge: [250, 380],
      },
      voice: {
        primitive: 'ARC',
        r: [18, 42],
        openAngle: [290, 330],
        dotSize: [2, 5],
        density: [0.40, 0.55],
        maxAge: [180, 280],
      },
      lead: {
        primitive: 'ARC',
        r: [30, 62],
        openAngle: [200, 260],
        dotSize: [2, 5],
        density: [0.35, 0.50],
        maxAge: [200, 320],
        colorKey: 'accent',
      },
    },
  },

  // ── SOLCO — VISUAL-SPEC §III ──
  // Gravità, canyon, stratigrafia. Primitiva dominante: RECT.
  // Bass+Drone depositano terrain; kick schiaccia senza depositare.
  SOLCO: {
    bg: '#0C0E08',
    palette: {
      primary:  '#7A9060',
      accent:   '#B0D890',
      residual: '#2A3520',
      drone:    '#5A7040',
      bass:     '#7A9060',
      kick:     '#506840',
      chord:    '#6E8452',
      voice:    '#B0D890',
      arp:      '#8AA070',
    },
    channels: {
      // CH0 kick — RECT spesso che cade con g=1.2, impatto con squash
      kick: {
        primitive: 'RECT',
        xMode: 'random',
        spawnY: [0.30, 0.50],
        w: [30, 60],
        h: [8, 12],
        density: [0.60, 0.80],
        gravity: 1.2,
        maxAge: [100, 150],
      },
      // CH2 drone — RECT bedrock sul pavimento, non cade
      drone: {
        primitive: 'RECT',
        xMode: 'random',
        spawnY: [0.88, 0.95],
        w: [60, 80],
        h: [10, 12],
        density: [0.45, 0.55],
        gravity: 0,
        noFall: true,
        depositsTerrain: true,
        maxAge: [1000, 1400],
      },
      // CH3 bass — protagonista: caduta con g=0.6, forma il terrain
      bass: {
        primitive: 'RECT',
        xMode: 'pitch',
        spawnY: [0.10, 0.25],
        w: [18, 30],
        h: [4, 10],
        hBase: 4, hVelScale: 10,
        density: [0.70, 0.85],
        gravity: 0.6,
        depositsTerrain: true,
        maxAge: [350, 500],
      },
      // CH4 chord — sottile, caduta lenta g=0.3
      chord: {
        primitive: 'RECT',
        xMode: 'random',
        spawnY: [0.15, 0.35],
        w: [25, 50],
        h: [3, 6],
        density: [0.35, 0.50],
        gravity: 0.3,
        maxAge: [400, 600],
      },
      // CH5 voice — polvere che si stacca, drag alto, cade lentissima
      voice: {
        primitive: 'RECT',
        xMode: 'random',
        spawnY: [0.55, 0.70],
        w: [6, 16],
        h: [2, 3],
        density: [0.50, 0.70],
        gravity: 0.24,
        drag: 0.96,
        maxAge: [200, 350],
        colorKey: 'accent',
      },
      // CH7 arp — frammenti piccoli, gravità normale
      arp: {
        primitive: 'RECT',
        xMode: 'random',
        spawnY: [0.55, 0.70],
        w: [6, 10],
        h: [2, 3],
        density: [0.55, 0.70],
        gravity: 0.6,
        maxAge: [60, 100],
      },
    },
  },
};

// Placeholder biomi — alias di GENERIC finché non calibrati
BIOMI_GEO.TESSUTO  = BIOMI_GEO.GENERIC;
BIOMI_GEO.RESPIRO  = BIOMI_GEO.GENERIC;
BIOMI_GEO.MACCHINA = BIOMI_GEO.GENERIC;
BIOMI_GEO.TEMPESTA = BIOMI_GEO.GENERIC;
BIOMI_GEO.RITORNO  = BIOMI_GEO.GENERIC;

export { BIOMI_GEO };

// ── Status per HUD debug ──────────────────────────────────
export function getGeoStatus() {
  return {
    biome: _currentBiomeKey,
    particles: _particles.length,
    initialized: _initialized,
  };
}
