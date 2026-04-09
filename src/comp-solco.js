// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: SOLCO
//  Campo gaussiano con erosione cellulare permanente.
//  Proto v7 integrato nel layer stack Band con Direttore.
//
//  Palette: bg #282B26, orange (dot) #FE6B0D, lime (accent) #CDD71D
//  MIDI: CH0=kick fronts, CH3=bass colonna, CH4=chord bands,
//        CH5=voice blocks (cadono), CH6=lead blocks (cadono)
//
//  Sediment: canvas privato composited sotto il campo MG
//  → i buchi dell'erosione espongono la storia geologica
// ═══════════════════════════════════════════════════════════

import {
  fillBackground, rgbString, hexToRgb, lerp, clamp,
} from './visual-toolkit.js';

import {
  getLayerCtx, clearAllLayers, clearLayer, compositeLayers,
  LAYER_BG, LAYER_MG, LAYER_FG,
} from './layers.js';

// ── Bayer 8×8 ──
const B8 = [
  [ 0,32, 8,40, 2,34,10,42],
  [48,16,56,24,50,18,58,26],
  [12,44, 4,36,14,46, 6,38],
  [60,28,52,20,62,30,54,22],
  [ 3,35,11,43, 1,33, 9,41],
  [51,19,59,27,49,17,57,25],
  [15,47, 7,39,13,45, 5,37],
  [63,31,55,23,61,29,53,21],
];

function smooth(t) { return t * t * (3 - 2 * t); }

// ── Zone gaussiane (calcolate in init con jitter — geometria diversa ogni vita) ──
let ZOM, ZOS, ZLM, ZLB;

function _jz(cx, cy, sx, sy, jxy = 0.08, jsc = 0.25) {
  return {
    cx: cx + (Math.random() - 0.5) * jxy,
    cy: cy + (Math.random() - 0.5) * jxy,
    sx: sx * (1 + (Math.random() - 0.5) * jsc),
    sy: sy * (1 + (Math.random() - 0.5) * jsc),
  };
}

function _gauss(nx, ny, z) {
  const dx = (nx - z.cx) / z.sx, dy = (ny - z.cy) / z.sy;
  return Math.exp(-(dx * dx + dy * dy) * 0.5);
}

// voidF: bottom-heavy — alto è vuoto, basso è pieno
function _voidF(ny) {
  if (ny < 0.48) return lerp(0.10, 0.22, ny / 0.48);
  return lerp(0.22, 1.0, smooth(clamp((ny - 0.48) / 0.42, 0, 1)));
}

// ── Bande geologiche (dot size cresce verso il basso — effetto profondità) ──
const BANDS = [
  { y0: 0.00, y1: 0.52, dSz: 11 },
  { y0: 0.52, y1: 0.65, dSz:  7 },
  { y0: 0.65, y1: 0.76, dSz:  5 },
  { y0: 0.76, y1: 0.87, dSz:  3 },
  { y0: 0.87, y1: 1.00, dSz:  2 },
];

// ── Erosione cellulare (1280×720 / 4 = 320×180 celle) ──
const ECELL = 4;
const ECOLS = 320;
const EROWS = 180;
const _erosion = new Uint8Array(ECOLS * EROWS);
const _erodMap = new Float32Array(ECOLS * EROWS);

function _buildErodMap() {
  const o = Math.random() * 100;
  for (let r = 0; r < EROWS; r++) {
    for (let c = 0; c < ECOLS; c++) {
      const nx = c / ECOLS, ny = r / EROWS;
      const n1 = 0.5 + 0.5 * Math.sin(nx * 9.7  + ny * 6.3  + o);
      const n2 = 0.5 + 0.5 * Math.sin(nx * 21.1 - ny * 14.7 + o * 1.3);
      const n3 = 0.5 + 0.5 * Math.sin(nx * 4.3  + ny * 28.9 + o * 0.7);
      const n4 = 0.5 + 0.5 * Math.sin(nx * 37.0 - ny * 5.1  + o * 2.1);
      const noise = n1 * 0.40 + n2 * 0.30 + n3 * 0.20 + n4 * 0.10;
      // soglia dura: sotto = quasi immune (0.05), sopra = vulnerabile (0.95)
      const s = clamp((noise - 0.50) / 0.06, 0, 1);
      _erodMap[r * ECOLS + c] = s < 0.5 ? 0.05 : 0.95;
    }
  }
}

const EROSION_PARAMS = {
  germoglio:    { seeds: 1,  spreadTrials: 18,  threshold: 0.55 },
  apertura:     { seeds: 1,  spreadTrials: 18,  threshold: 0.55 },
  pulsazione:   { seeds: 1,  spreadTrials: 25,  threshold: 0.52 },
  densita:      { seeds: 2,  spreadTrials: 55,  threshold: 0.52 },
  rottura:      { seeds: 5,  spreadTrials: 200, threshold: 0.45 },
  dissoluzione: { seeds: 1,  spreadTrials: 18,  threshold: 0.55 },
};

function _updateErosion(dt, phase, buildupT) {
  const E = EROSION_PARAMS[phase] ?? EROSION_PARAMS.germoglio;
  if (buildupT < E.threshold) return;

  // Semi: pianta preferibilmente nelle zone più suscettibili
  const seedN = Math.ceil(E.seeds * dt * 60 * 0.016);
  for (let s = 0; s < seedN; s++) {
    let bestIdx = -1, bestS = 0;
    for (let t = 0; t < 5; t++) {
      const ci = (Math.random() * ECOLS * EROWS) | 0;
      if (_erodMap[ci] > bestS) { bestS = _erodMap[ci]; bestIdx = ci; }
    }
    if (bestIdx >= 0 && bestS > 0.3) _erosion[bestIdx] = 1;
  }

  // Diffusione: zone vulnerabili cedono rapido, resistenti bloccano
  const trials = Math.ceil(E.spreadTrials * dt * 60);
  for (let i = 0; i < trials; i++) {
    const idx = (Math.random() * ECOLS * EROWS) | 0;
    if (_erosion[idx] === 0) continue;
    const r = (idx / ECOLS) | 0;
    const c = idx % ECOLS;
    const dr = Math.random() < 0.5 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    const dc = dr === 0 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= EROWS || nc < 0 || nc >= ECOLS) continue;
    const nidx = nr * ECOLS + nc;
    if (Math.random() < _erodMap[nidx]) _erosion[nidx] = 1;
  }
}

// ── Fill helper con Bayer locale (dot size variabile) ──
function _fillB(c, x, y, w, h, density, dSz, css) {
  if (density < 0.005 || w <= 0 || h <= 0) return;
  c.fillStyle = css;
  const ds = Math.max(1, dSz | 0), d = Math.min(density, 1);
  const x0 = x | 0, y0 = y | 0, x1 = Math.ceil(x + w), y1 = Math.ceil(y + h);
  for (let py = y0; py < y1; py += ds)
    for (let px = x0; px < x1; px += ds)
      if (d * 64 > B8[(py / ds | 0) & 7][(px / ds | 0) & 7]) c.fillRect(px, py, ds, ds);
}

// renderPass — campo gaussiano con bande geologiche e check erosione
function _renderPass(c, W, H, css, dFn) {
  c.fillStyle = css;
  for (const { y0, y1, dSz } of BANDS) {
    const r0 = (y0 * H) | 0, r1 = (y1 * H) | 0;
    for (let py = r0; py < r1; py += dSz) {
      const ny = py / H;
      const er = clamp((ny * EROWS) | 0, 0, EROWS - 1);
      for (let px = 0; px < W; px += dSz) {
        const ec = clamp(((px / W) * ECOLS) | 0, 0, ECOLS - 1);
        if (_erosion[er * ECOLS + ec] === 1) continue;
        const d = dFn(px / W, ny);
        if (d < 0.005) continue;
        if (d * 64 > B8[(py / dSz | 0) & 7][(px / dSz | 0) & 7]) c.fillRect(px, py, dSz, dSz);
      }
    }
  }
}

// ── Sediment privato (deve stare SOTTO il campo — non in LAYER_OVERLAY) ──
let _sedC = null;
let _sed  = null;

// ── Stato ──
let _buildupT = 0;
let _frameN   = 0;
let _time     = 0;

// BASS — colonna ZOS respira
let _bassEnv  = 0;
let _bassSin  = 0;

// KICK — 3 fronti orizzontali che salgono dal terrain
let _kickFronts = [];

// CHORD/VOICE — bande pitch-mapped
let _chordBands = [];

// VOICE/LEAD — blocchi che cadono (CH5 + CH6)
let _arpBlocks = [];
let _arpSpawnX = 0.90;

// ── Parametri visivi per fase ──
const PHASE_PARAMS = {
  germoglio:    { bO: 0.48, bL: 0.22, bOS: 0.35 },
  apertura:     { bO: 0.52, bL: 0.26, bOS: 0.38 },
  pulsazione:   { bO: 0.58, bL: 0.32, bOS: 0.44 },
  densita:      { bO: 0.68, bL: 0.42, bOS: 0.55 },
  rottura:      { bO: 0.84, bL: 0.58, bOS: 0.72 },
  dissoluzione: { bO: 0.42, bL: 0.18, bOS: 0.30 },
};

const SEDIMENT_DECAY = {
  germoglio:    0.9978,
  apertura:     0.9982,
  pulsazione:   0.9985,
  densita:      0.9990,
  rottura:      0.9994,
  dissoluzione: 0.9978,
};

// ── Spawn ──

function _spawnKickFronts(H) {
  const oy = 0.625 * H;
  for (let i = 0; i < 3; i++) {
    _kickFronts.push({
      oy,
      maxR:   360 + i * 90,
      age:   -(i * 7),
      maxAge: 50 + i * 5,
    });
  }
}

// Spawna una banda chord/voice a pitch-mapped Y
// densityMul: 1.0 per chord, 0.6 per voice (più tenue)
function _spawnChordBand(pitch01, densityMul) {
  const ny = lerp(0.12, 0.88, 1 - pitch01);
  _chordBands.push({
    ny,
    dens:    (0.55 + pitch01 * 0.30) * densityMul,
    life:    0,
    maxLife: Math.max(1, (100 + Math.floor(pitch01 * 60)) * densityMul),
  });
}

function _dSzAt(ny) {
  if (ny < 0.52) return 11;
  if (ny < 0.65) return 7;
  if (ny < 0.76) return 5;
  if (ny < 0.87) return 3;
  return 2;
}

function _spawnArpBlock(note01, W, H) {
  const nx = clamp(_arpSpawnX + (Math.random() - 0.5) * 0.04, 0.06, 0.94);
  _arpSpawnX -= 0.09 + Math.random() * 0.04;
  if (_arpSpawnX < 0.10) _arpSpawnX = 0.82 + Math.random() * 0.10;
  const spawnY = (0.03 + Math.random() * 0.22) * H;
  const noteInt = Math.floor(note01 * 127);
  _arpBlocks.push({
    x:        nx * W,
    y:        spawnY,
    spawnY,
    w:        5 + (noteInt % 5) * 2,
    h:        4 + (noteInt % 3) * 2,
    vy:       0.55 + Math.random() * 0.45,
    ay:       0.020,
    life:     0,
    maxLife:  220,
    splatY:   (0.56 + (noteInt % 7) * 0.038) * H,
    splatted: false,
    splatAge: 0,
  });
}

// ── API ──

export function init(env) {
  _erosion.fill(0);
  _buildErodMap();

  ZOM = _jz(0.27, 0.86, 0.28, 0.16, 0.10, 0.30);
  ZOS = _jz(0.11, 0.50, 0.09, 0.46, 0.06, 0.20);
  ZLM = _jz(0.82, 0.88, 0.16, 0.12, 0.10, 0.30);
  ZLB = _jz(0.55, 0.72, 0.10, 0.09, 0.12, 0.35);

  _buildupT   = 0;
  _frameN     = 0;
  _time       = 0;
  _bassEnv    = 0;
  _bassSin    = 0;
  _kickFronts = [];
  _chordBands = [];
  _arpBlocks  = [];
  _arpSpawnX  = 0.90;

  // Sediment privato: composited dentro lBg sotto il campo MG
  _sedC = document.createElement('canvas');
  _sedC.width  = 1280;
  _sedC.height = 720;
  _sed = _sedC.getContext('2d');

  clearAllLayers();
  // LAYER_OVERLAY non usato — sediment gestito da _sedC
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, dt } = env;
  _time   += dt;
  _frameN += 1;

  const phase = worldState.phase || 'germoglio';
  const P     = PHASE_PARAMS[phase] ?? PHASE_PARAMS.germoglio;

  const C_ORANGE = worldState.palette?.dot    ?? '#FE6B0D';
  const C_LIME   = worldState.palette?.accent ?? '#CDD71D';

  // Buildup — campo emerge gradualmente in 14s
  _buildupT = Math.min(1, _buildupT + dt / 14.0);
  const buildupMul = smooth(_buildupT);

  // Erosione cellulare
  _updateErosion(dt, phase, _buildupT);

  // Decay sediment manuale
  const sedRate = SEDIMENT_DECAY[phase] ?? SEDIMENT_DECAY.germoglio;
  if (_sed) {
    _sed.globalCompositeOperation = 'destination-out';
    _sed.globalAlpha = 1 - sedRate;
    _sed.fillStyle = 'black';
    _sed.fillRect(0, 0, W, H);
    _sed.globalAlpha = 1;
    _sed.globalCompositeOperation = 'source-over';
  }

  // ── MIDI wiring (solo MIDI reale — nessun auto-spawn) ──
  for (const n of midiTrail) {
    if (n.alpha < 0.25) continue;

    if (n.ch === 0 && n.time < dt * 3) {
      // kick → 3 fronti orange che salgono dal terrain
      _spawnKickFronts(H);
    }
    if (n.ch === 3 && n.time < dt * 4) {
      // bass → colonna ZOS respira
      _bassEnv = clamp(_bassEnv + n.vel * 0.5, 0, 1);
    }
    if (n.ch === 4 && n.time < dt * 6) {
      // chord → banda lime pitch-mapped
      _spawnChordBand(n.note, 1.0);
    }
    if (n.ch === 5 && n.time < dt * 6) {
      // voice → banda tenue + blocco che cade
      _spawnChordBand(n.note, 0.6);
      _spawnArpBlock(n.note, W, H);
    }
    if (n.ch === 6 && n.time < dt * 3) {
      // lead → blocco che cade
      _spawnArpBlock(n.note, W, H);
    }
  }

  // Decay bass
  _bassEnv = Math.max(0, _bassEnv - dt * 0.55);
  _bassSin = 0.28 + Math.sin(_time * 0.78) * 0.17 + Math.sin(_time * 1.88) * 0.07;
  const bassT = clamp(_bassEnv + _bassSin, 0, 1);

  // Update chord bands
  for (let i = _chordBands.length - 1; i >= 0; i--) {
    _chordBands[i].life++;
    if (_chordBands[i].life >= _chordBands[i].maxLife) _chordBands.splice(i, 1);
  }

  // Update kick fronts
  for (let i = _kickFronts.length - 1; i >= 0; i--) {
    _kickFronts[i].age++;
    if (_kickFronts[i].age >= _kickFronts[i].maxAge) _kickFronts.splice(i, 1);
  }

  // Update blocchi + depositi nel sediment
  for (let i = _arpBlocks.length - 1; i >= 0; i--) {
    const b = _arpBlocks[i];
    b.life++;
    if (!b.splatted) {
      b.vy += b.ay;
      b.y  += b.vy;
      if (_sed && _frameN % 2 === 0) _fillB(_sed, b.x + b.w * 0.28, b.y, b.w * 0.44, 5, 0.08, 3, C_LIME);
      if (b.y + b.h >= b.splatY) {
        b.splatted = true;
        b.y = b.splatY - b.h;
        if (_sed) _fillB(_sed, b.x - b.w * 0.20, b.y, b.w * 1.4, b.h * 0.55, 0.32, 3, C_LIME);
      }
    } else {
      b.splatAge++;
    }
    if (b.life >= b.maxLife) _arpBlocks.splice(i, 1);
  }

  // ── RENDER ──

  // BG: sfondo solido + sediment (deve stare SOTTO il campo MG)
  const lBg = getLayerCtx(LAYER_BG);
  if (lBg) {
    const bg = hexToRgb(worldState.palette?.bg ?? '#282B26');
    fillBackground(lBg, W, H, rgbString(bg[0], bg[1], bg[2]));
    if (_sedC) {
      lBg.globalAlpha = 0.46;
      lBg.drawImage(_sedC, 0, 0);
      lBg.globalAlpha = 1;
    }
  }

  // MG: campo gaussiano con erosione (fresco ogni frame)
  // I buchi dell'erosione rendono MG trasparente → espone il sediment nel BG
  clearLayer(LAYER_MG);
  const lMg = getLayerCtx(LAYER_MG);
  if (lMg) {
    const ZOS_live = { cx: ZOS.cx, cy: ZOS.cy, sx: ZOS.sx + bassT * 0.025, sy: ZOS.sy + bassT * 0.05 };
    const ZOM_live = { cx: ZOM.cx - bassT * 0.02, cy: ZOM.cy, sx: ZOM.sx + bassT * 0.06, sy: ZOM.sy + bassT * 0.03 };

    _renderPass(lMg, W, H, C_ORANGE, (nx, ny) => {
      const vf = _voidF(ny);
      const oM  = _gauss(nx, ny, ZOM_live) * (P.bO  + bassT * 0.12) * vf;
      const oS  = _gauss(nx, ny, ZOS_live) * (P.bOS + bassT * 0.20);
      const grav = Math.pow(Math.max(0, ny - 0.60) / 0.40, 2.8) * 0.18 * vf;
      return clamp(oM + oS + grav, 0, 1) * buildupMul;
    });

    _renderPass(lMg, W, H, C_LIME, (nx, ny) => {
      const vf = _voidF(ny);
      const lM  = _gauss(nx, ny, ZLM) * P.bL;
      const lB  = _gauss(nx, ny, ZLB) * (P.bL * 0.42);
      const grav = Math.pow(Math.max(0, ny - 0.66) / 0.34, 3.0) * 0.12 * vf;
      return clamp((lM + lB + grav) * vf, 0, 1) * buildupMul;
    });

    // Deposita il campo nel sediment ogni 3 frame
    if (_sed && _frameN % 3 === 0) {
      _sed.globalAlpha = 0.016;
      _sed.drawImage(lMg.canvas, 0, 0);
      _sed.globalAlpha = 1;
    }
  }

  // FG: elementi vivi (chord bands + blocchi + kick fronts)
  clearLayer(LAYER_FG);
  const lFg = getLayerCtx(LAYER_FG);
  if (lFg) {
    // Chord / voice bands
    for (const b of _chordBands) {
      const t    = b.life / b.maxLife;
      const env2 = t < 0.08 ? t / 0.08 : 1 - smooth((t - 0.08) / 0.92);
      const dens = b.dens * env2;
      if (dens < 0.01) continue;
      const dSz = _dSzAt(b.ny);
      _fillB(lFg, 0, b.ny * H - dSz, W, dSz * 2, dens, dSz, C_LIME);
    }

    // Blocchi che cadono (voice / lead)
    for (const b of _arpBlocks) {
      if (b.splatted) {
        const sp      = Math.min(1, b.splatAge / 12);
        const spreadX = sp * b.w * 0.8;
        const squishY = b.h * (1 - sp * 0.80);
        _fillB(lFg, b.x - spreadX, b.y, b.w + spreadX * 2, squishY, 0.85 * (1 - sp * 0.50), 3, C_LIME);
      } else {
        const trailH = b.y - b.spawnY;
        if (trailH > 4) _fillB(lFg, b.x + b.w * 0.28, b.spawnY, b.w * 0.44, trailH, 0.14, 4, C_LIME);
        _fillB(lFg, b.x, b.y, b.w, b.h, 0.88, 2, C_LIME);
      }
    }

    // Kick fronts — 3 onde orange che salgono dal terrain
    for (const f of _kickFronts) {
      if (f.age < 0) continue;
      const t    = clamp(f.age / f.maxAge, 0, 1);
      const r    = smooth(t) * f.maxR;
      const dens = lerp(0.78, 0, t * t);
      const dSz  = Math.round(lerp(2, 5, t));
      _fillB(lFg, 0, f.oy - r, W, dSz * 1.5, dens, dSz, C_ORANGE);
    }
  }

  compositeLayers(ctx);
}
