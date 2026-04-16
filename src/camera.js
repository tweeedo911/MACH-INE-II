// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Camera come Sguardo
//
//  Modello fisico di attenzione. Nessun shot, nessuna grammatica.
//  Lo sguardo è attratto dalla materia (con bonus freshness),
//  lo zoom è l'equilibrio tra curiosità locale e respiro globale,
//  l'allerta modula la reattività in base a eventi sonori.
//
//  Letta da: director3 (personality, phase)
//  Scrive a: worldState.camera (zoom, focusX, focusY)
//  Dipende da: campo.js (getCampoDensityBlocks, getCampoAvgDensity)
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { worldState } from './world-state.js';
import { getCampoDensityBlocks, getCampoAvgDensity } from './campo.js';

// ── Helpers ──
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// Phase-aware param: accepts { germoglio: 0.1, pulsazione: 0.2, ... } or scalar
function phaseVal(param, phase, fallback) {
  if (param == null) return fallback;
  if (typeof param === 'number') return param;
  return param[phase] ?? param._default ?? fallback;
}

// ── State ──
let _focusX = 0.5;
let _focusY = 0.5;
let _zoom   = 1.0;
let _alertness = 0;

// Block scanning + freshness
let _blocks = [];              // latest density blocks from campo
let _prevDensities = null;     // Map<string, number> — previous scan
let _freshness = null;         // Map<string, number> — deposit freshness
let _scanFrame = 0;

// Event detection
let _prevPhase = null;
let _prevAudioEnergy = 0;

// RITORNO: monotonic pull-away
let _ritornoT = 0;

// Micro-drift: vibrazione impercettibile che dà vita allo sguardo
let _driftTime = 0;

// Snake patrol (MACCHINA): muove su un asse alla volta, poi gira
let _snakeAxis = 0;       // 0 = orizzontale, 1 = verticale
let _snakeDir  = 1;       // +1 o -1
let _snakeX    = 0.5;
let _snakeY    = 0.5;

// ── Init ──
export function initCamera() {
  _focusX = 0.5;
  _focusY = 0.5;
  _zoom   = 1.0;
  _alertness = 0;
  _blocks = [];
  _prevDensities = null;
  _freshness = null;
  _scanFrame = 0;
  _prevPhase = null;
  _prevAudioEnergy = 0;
  _ritornoT = 0;
}

// ── Scan blocks + compute freshness (delta from previous scan) ──
function _scan() {
  const camCfg = CFG.VISUAL?.campo?.camera ?? {};
  const blockSize = camCfg.poiBlockSize ?? 8;

  _blocks = getCampoDensityBlocks(blockSize);

  const newDens = new Map();
  const newFresh = new Map();

  for (const b of _blocks) {
    const k = b.bx * 100 + b.by;  // cheap int key
    newDens.set(k, b.density);

    const prev = _prevDensities ? (_prevDensities.get(k) || 0) : 0;
    const delta = Math.max(0, b.density - prev);  // solo nuovi depositi
    const oldF  = _freshness ? (_freshness.get(k) || 0) : 0;
    newFresh.set(k, delta + oldF * 0.82);          // freshness decade tra scan
  }

  _prevDensities = newDens;
  _freshness = newFresh;
}

// ── Update (ogni frame dal game loop) ──
export function updateCamera(dt) {
  // ENCORE: camera fissa, nessun movimento
  if (worldState.encoreMode) {
    worldState.camera.zoom = 1.0;
    worldState.camera.focusX = 0.5;
    worldState.camera.focusY = 0.5;
    return;
  }

  const cam = worldState.camera;
  if (!cam.personality) return;

  const camCfg = CFG.VISUAL?.campo?.camera ?? {};
  const bio = camCfg.biomes?.[cam.personality];
  if (!bio) return;

  // ── Track changed: soft reset ──
  if (cam._trackChanged) {
    cam._trackChanged = false;
    _alertness = 0.4;           // breve boost per raggiungere nuova quota
    _prevPhase = null;
    _ritornoT = 0;
    _prevDensities = null;
    _freshness = null;
  }

  // ── Scan periodico ──
  const scanInterval = camCfg.poiScanInterval ?? 15;
  _scanFrame++;
  if (_scanFrame >= scanInterval) {
    _scanFrame = 0;
    _scan();
  }

  // ═══════════════════════════════════════════════
  //  1. ALLERTA — reagisce a eventi sonori/narrativi
  // ═══════════════════════════════════════════════

  // Cambio fase
  const curPhase = cam.phase;
  const _phaseJustChanged = _prevPhase && curPhase !== _prevPhase;
  if (_phaseJustChanged) {
    _alertness = Math.min(1, _alertness + 0.25);
  }
  _prevPhase = curPhase;

  // Spike audio
  const audioE = worldState.audioEnergy || 0;
  const spike  = Math.max(0, audioE - _prevAudioEnergy - 0.08);
  _alertness = Math.min(1, _alertness + spike * 0.8);
  _prevAudioEnergy = audioE;

  // Rupture: spinta continua leggera
  const ruptureI = worldState.rupture?.intensity ?? 0;
  _alertness = Math.min(1, _alertness + ruptureI * 0.03);

  // Decay (~2s dimezzamento a 60fps)
  _alertness *= 1 - 1.5 * dt;
  _alertness = clamp(_alertness, 0, 1);

  // ═══════════════════════════════════════════════
  //  2. FOCUS — centro di massa pesato per densità+freshness
  // ═══════════════════════════════════════════════

  const freshW = bio.freshnessWeight ?? 3.0;
  let sumWX = 0, sumWY = 0, sumW = 0;

  for (const b of _blocks) {
    const k = b.bx * 100 + b.by;
    const fresh = _freshness ? (_freshness.get(k) || 0) : 0;
    const w = b.density + fresh * freshW;
    if (w < 0.001) continue;
    sumWX += b.x * w;
    sumWY += b.y * w;
    sumW  += w;
  }

  // Target: centro di massa dell'attività, con bias verso centro
  const centerPull = phaseVal(bio.centerPull, curPhase, 0.02);
  let targetX, targetY;
  if (sumW > 0.01) {
    targetX = sumWX / sumW;
    targetY = sumWY / sumW;
  } else {
    // Nessuna attività: deriva dolce verso centro
    targetX = 0.5;
    targetY = 0.5;
  }

  // CenterPull: blend verso 0.5
  targetX = targetX + (0.5 - targetX) * centerPull;
  targetY = targetY + (0.5 - targetY) * centerPull;

  // Snake patrol — muove su un asse alla volta, scrittura diretta (no lerp diagonale)
  const snakeSpeed = phaseVal(bio.snakeSpeed, curPhase, 0);
  if (snakeSpeed > 0) {
    const step = snakeSpeed * dt;
    if (_snakeAxis === 0) {
      _snakeX += step * _snakeDir;
      if (_snakeX > 0.88 || _snakeX < 0.12) {
        _snakeDir *= -1;
        _snakeAxis = 1;
      }
    } else {
      _snakeY += step * _snakeDir;
      if (_snakeY > 0.88 || _snakeY < 0.12) {
        _snakeDir *= -1;
        _snakeAxis = 0;
      }
    }
    _snakeX = clamp(_snakeX, 0.08, 0.92);
    _snakeY = clamp(_snakeY, 0.08, 0.92);
    // Scrivi diretto — l'asse fermo non si muove → niente diagonale
    _focusX = _snakeX;
    _focusY = _snakeY;
  } else {
    // Drift verso target (modulato da allerta) — biomi normali
    const baseDrift = phaseVal(bio.focusDrift, curPhase, 0.2);
    const drift = baseDrift * (1 + _alertness * 1.2) * dt;

    _focusX += (targetX - _focusX) * drift;
    _focusY += (targetY - _focusY) * drift;
  }
  _focusX = clamp(_focusX, 0.05, 0.95);
  _focusY = clamp(_focusY, 0.05, 0.95);

  // ═══════════════════════════════════════════════
  //  3. ZOOM — phase-aware, narrativo
  //  phaseZoom detta la quota; curiosità/respiro modulano ±0.15 max
  // ═══════════════════════════════════════════════

  let targetZoom;

  if (cam.personality === 'RITORNO') {
    // Allontanamento monotono: esponenziale da phaseZoom a 0.15
    _ritornoT += dt;
    const base = (bio.phaseZoom && bio.phaseZoom[curPhase]) ?? 1.0;
    const decay = bio.ritornoDecay ?? 0.007;
    targetZoom = 0.15 + (base - 0.15) * Math.exp(-decay * _ritornoT);
  } else {
    // Phase zoom: la quota narrativa per questa fase
    const baseZoom = (bio.phaseZoom && bio.phaseZoom[curPhase]) ?? 1.0;

    const curiosityW = bio.curiosityWeight ?? 0.1;
    const breathW    = bio.breathWeight ?? 0.05;

    // Densità locale: blocchi vicini al focus
    let localD = 0, localN = 0;
    for (const b of _blocks) {
      const dx = b.x - _focusX;
      const dy = b.y - _focusY;
      if (dx * dx + dy * dy < 0.025) {
        localD += b.density;
        localN++;
      }
    }
    localD = localN > 0 ? localD / localN : 0;

    // Densità globale
    const globalD = getCampoAvgDensity();

    // Modulazione espressiva: curiosità IN (+), respiro OUT (-)
    // ±0.25 max — il phaseZoom guida, la densità colora
    const modulation = localD * curiosityW - globalD * breathW;
    targetZoom = baseZoom + clamp(modulation, -0.25, 0.25);
    targetZoom = clamp(targetZoom, 0.85, 2.2);
  }

  // Zoom drift (modulato da allerta)
  // snapPhaseZoom: MACCHINA cambia zoom di colpo al cambio fase
  const snap = bio.snapPhaseZoom && _phaseJustChanged;
  if (snap) {
    _zoom = targetZoom;  // istantaneo
  }
  const baseZoomDrift = phaseVal(bio.zoomDrift, curPhase, 0.10);
  const zDrift = baseZoomDrift * (1 + _alertness * 0.6) * dt;
  _zoom += (targetZoom - _zoom) * zDrift;

  // Micro-punch su onset forte
  if (spike > 0.25) {
    _zoom *= 1 + spike * 0.03;
  }

  // ═══════════════════════════════════════════════
  //  4. MICRO-DRIFT — sguardo vivo anche da fermo
  // ═══════════════════════════════════════════════
  _driftTime += dt;
  // 2 sinusoidi a frequenze basse → respiro impercettibile
  const microX = Math.sin(_driftTime * 0.41) * 0.0012 + Math.sin(_driftTime * 0.17) * 0.0008;
  const microY = Math.sin(_driftTime * 0.31 + 1.0) * 0.0012 + Math.cos(_driftTime * 0.13) * 0.0008;

  // ═══════════════════════════════════════════════
  //  5. SCRIVI su worldState
  // ═══════════════════════════════════════════════

  cam.zoom   = _zoom;
  cam.focusX = _focusX + microX;
  cam.focusY = _focusY + microY;
}
