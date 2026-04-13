// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Camera Osservatore Narrativo
//
//  La camera è un agente autonomo che osserva il campo.
//  Percepisce i POI (punti d'interesse per densità),
//  sceglie gesti cinematografici per bioma/fase,
//  e interpola zoom/focus con easing naturale.
//
//  Letta da: director3 (personality, phase)
//  Scrive a: worldState.camera (zoom, focusX, focusY)
//  Dipende da: campo.js (getCampoDensityBlocks, getCampoAvgDensity)
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { worldState } from './world-state.js';
import { getCampoDensityBlocks, getCampoAvgDensity } from './campo.js';

// ── Easing ──
function smoothstep(t) { return t * t * (3 - 2 * t); }
function lerp(a, b, t) { return a + (b - a) * t; }

// ── State ──
let _shot = null;          // shot corrente { type, fromZoom, fromX, fromY, toZoom, toX, toY, duration, elapsed, easing }
let _pois = [];            // POI correnti [{ x, y, density, dominantRole }]
let _poiFrame = 0;         // frame counter per scansione POI
let _lastPoi = null;       // ultimo POI osservato (per evitare ripetizioni)
let _ritornoMaxZoom = 1.0; // RITORNO: tetto zoom che cala monotonicamente

// ── Init ──
export function initCamera() {
  _shot = null;
  _pois = [];
  _poiFrame = 0;
  _lastPoi = null;
  _ritornoMaxZoom = 1.0;
}

// ── Scansione POI ──
function _scanPOIs() {
  const camCfg = CFG.VISUAL?.campo?.camera ?? {};
  const blockSize = camCfg.poiBlockSize ?? 8;
  const maxCount = camCfg.poiMaxCount ?? 5;

  const blocks = getCampoDensityBlocks(blockSize);
  // Ordina per densità decrescente, prendi i top N
  blocks.sort((a, b) => b.density - a.density);
  _pois = blocks.slice(0, maxCount).filter(p => p.density > 0.01);
}

// ── Scegli un POI diverso dall'ultimo ──
function _pickPOI() {
  if (_pois.length === 0) return { x: 0.5, y: 0.5 };
  // Preferisci un POI diverso dall'ultimo osservato
  const candidates = _pois.filter(p =>
    !_lastPoi || Math.abs(p.x - _lastPoi.x) > 0.1 || Math.abs(p.y - _lastPoi.y) > 0.1
  );
  const pick = candidates.length > 0 ? candidates[0] : _pois[0];
  _lastPoi = pick;
  return pick;
}

// ── Random in range ──
function _rand(min, max) { return min + Math.random() * (max - min); }

// ── Applica easing ──
function _ease(t, type) {
  if (type === 'snap') return t < 0.15 ? 0 : 1;
  if (type === 'linear') return t;
  return smoothstep(t);   // 'smooth' default
}

// ── Weighted random pick da oggetto { key: weight, ... } ──
function _pickWeighted(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  if (total <= 0) return 'travel';  // fallback sicuro
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

// ── Crea uno shot ──
function _makeShot(type, toZoom, toX, toY, duration, easing) {
  const cam = worldState.camera;
  return {
    type,
    fromZoom: cam.zoom,
    fromX: cam.focusX,
    fromY: cam.focusY,
    toZoom, toX, toY,
    duration,
    elapsed: 0,
    easing: easing || 'smooth',
  };
}

// ── Scelta prossimo shot per bioma ──
function _nextShot() {
  const cam = worldState.camera;
  const personality = cam.personality;
  const camCfg = CFG.VISUAL?.campo?.camera ?? {};
  const biomeCfg = camCfg.biomes?.[personality];

  // Fallback: se non c'è personalità o config, STARE a zoom 1.0
  if (!biomeCfg) {
    return _makeShot('STARE', 1.0, 0.5, 0.5, 5, 'smooth');
  }

  const [zMin, zMax] = biomeCfg.zoomRange;
  const [hMin, hMax] = biomeCfg.holdRange;
  const speed = biomeCfg.speed ?? 0.5;
  const easing = biomeCfg.easing ?? 'smooth';
  const zoomFloor = biomeCfg.zoomFloor ?? 1.0;

  const avgDens = getCampoAvgDensity();
  const fieldEmpty = avgDens < 0.001;

  // ── RITORNO: logica speciale — allontanamento progressivo ──
  if (personality === 'RITORNO') {
    return _nextShotRitorno(biomeCfg, easing);
  }

  // ── Tutti gli altri biomi ──
  const prevType = _shot ? _shot.type : null;
  const poi = _pois.length > 0 ? _pickPOI()
    : { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.7 };

  // ── Ingresso (nessun shot precedente) o dopo SOLLEVARE → TUFFO ──
  if (!prevType || prevType === 'SOLLEVARE') {
    if (fieldEmpty) {
      return _makeShot('STARE', 1.0, 0.5, 0.5, _rand(2, 4), easing);
    }
    const z = _rand(zMin, zMax);
    return _makeShot('TUFFO', z, poi.x, poi.y, _rand(4, 6) / speed, easing);
  }

  // ── Dopo TUFFO → osserva ──
  if (prevType === 'TUFFO') {
    return _makeShot('STARE', cam.zoom, cam.focusX, cam.focusY, _rand(hMin, hMax), easing);
  }

  // ── Dopo STARE → grammatica per bioma (weighted pick) ──
  if (prevType === 'STARE') {
    const weights = biomeCfg.afterStare ?? { travel: 0.6, lift: 0.4 };
    const action = _pickWeighted(weights);
    return _shotFromAction(action, biomeCfg, poi, speed, easing, zoomFloor);
  }

  // ── Dopo VIAGGIARE / SCANSIONE → osserva dove sei ──
  if (prevType === 'VIAGGIARE' || prevType === 'SCANSIONE') {
    return _makeShot('STARE', cam.zoom, cam.focusX, cam.focusY, _rand(hMin, hMax), easing);
  }

  // Default
  if (!fieldEmpty) {
    const z = _rand(zMin, zMax);
    return _makeShot('TUFFO', z, poi.x, poi.y, _rand(4, 6) / speed, easing);
  }
  return _makeShot('STARE', 1.0, 0.5, 0.5, _rand(hMin, hMax), easing);
}

// ── Risolvi azione grammaticale in shot concreto ──
function _shotFromAction(action, cfg, poi, speed, easing, zoomFloor) {
  const cam = worldState.camera;
  const [zMin, zMax] = cfg.zoomRange;
  const [hMin, hMax] = cfg.holdRange;

  switch (action) {

    // — riposa ancora (contemplazione, NEBBIA) —
    case 'stare':
      return _makeShot('STARE', cam.zoom, cam.focusX, cam.focusY, _rand(hMin, hMax), easing);

    // — viaggia verso nuovo POI —
    case 'travel':
      return _makeShot('VIAGGIARE', cam.zoom, poi.x, poi.y, _rand(4, 8) / speed, easing);

    // — allontanamento totale —
    case 'lift':
      return _makeShot('SOLLEVARE', zoomFloor, 0.5, 0.5, _rand(4, 8) / speed, easing);

    // — scansione (H per TESSUTO, V per TEMPESTA) —
    case 'scan': {
      const dir = cfg.scanDir ?? 'H';
      const scanDist = 0.2 + Math.random() * 0.3;
      const sign = Math.random() < 0.5 ? 1 : -1;
      const toX = dir === 'H' ? Math.min(1, Math.max(0, cam.focusX + sign * scanDist)) : cam.focusX;
      const toY = dir === 'V' ? Math.min(1, Math.max(0, cam.focusY + sign * scanDist)) : cam.focusY;
      return _makeShot('SCANSIONE', cam.zoom, toX, toY, _rand(6, 12) / speed, easing);
    }

    // — inseguimento eco dub: pan a destra (SOLCO) —
    case 'echoChase': {
      const echoDist = 0.15 + Math.random() * 0.15;   // 15-30% del campo verso destra
      const toX = Math.min(1, cam.focusX + echoDist);
      return _makeShot('SCANSIONE', cam.zoom, toX, cam.focusY, _rand(3, 5) / speed, easing);
    }

    // — respiro: zoom indietro parziale poi si rituffa (RESPIRO) —
    case 'breathe': {
      // espira: zoom indietro del 40%, poi il prossimo ciclo sarà TUFFO → STARE
      const exhaleZoom = Math.max(zoomFloor, cam.zoom * 0.6);
      // leggero spostamento laterale (la membrana si muove)
      const driftX = cam.focusX + _rand(-0.08, 0.08);
      const driftY = cam.focusY + _rand(-0.05, 0.05);
      return _makeShot('SOLLEVARE', exhaleZoom, Math.min(1, Math.max(0, driftX)), Math.min(1, Math.max(0, driftY)), _rand(4, 7) / speed, easing);
    }

    // — salto discreto a nuova posizione (MACCHINA) —
    case 'snapJump': {
      const z = _rand(zMin, zMax);
      return _makeShot('TUFFO', z, poi.x, poi.y, _rand(2, 3) / speed, 'snap');
    }

    default:
      return _makeShot('VIAGGIARE', cam.zoom, poi.x, poi.y, _rand(4, 8) / speed, easing);
  }
}

// ── RITORNO: allontanamento progressivo monotono ──
function _nextShotRitorno(cfg, easing) {
  const [zMin, zMax] = cfg.zoomRange;   // [1, 6]
  const [hMin, hMax] = cfg.holdRange;   // [3, 8]
  const speed = cfg.speed;
  const poi = _pickPOI();

  const prevType = _shot ? _shot.type : null;

  if (!prevType) {
    // Primo shot: il mondo è intero, zoom 1.0 fullscreen
    return _makeShot('STARE', 1.0, 0.5, 0.5, _rand(3, 5), easing);
  }

  if (_ritornoMaxZoom > 0.8) {
    // Fase iniziale: può ancora tuffarsi per un ultimo dettaglio
    if (prevType === 'STARE' && _ritornoMaxZoom > 1.5) {
      // Un tuffo intimo su una scintilla
      const z = Math.min(_ritornoMaxZoom, _rand(3, zMax));
      _ritornoMaxZoom = z;   // il prossimo non potrà zoomare di più
      return _makeShot('TUFFO', z, poi.x, poi.y, _rand(4, 6) / speed, easing);
    }
    if (prevType === 'TUFFO') {
      return _makeShot('STARE', worldState.camera.zoom, worldState.camera.focusX, worldState.camera.focusY, _rand(hMin, hMax), easing);
    }
    // Inizia ad allontanarsi
    _ritornoMaxZoom *= 0.7;  // calo monotono
    const newZoom = Math.max(0.15, _ritornoMaxZoom);
    return _makeShot('SOLLEVARE', newZoom, 0.5, 0.5, _rand(4, 8) / speed, easing);
  }

  // Fase finale: il mondo si allontana e scompare
  _ritornoMaxZoom *= 0.65;
  const newZoom = Math.max(0.15, _ritornoMaxZoom);
  if (newZoom <= 0.15) {
    // Ultimo shot: puntino che svanisce, hold lungo
    return _makeShot('STARE', 0.15, 0.5, 0.5, 20, easing);
  }
  return _makeShot('SOLLEVARE', newZoom, 0.5, 0.5, _rand(5, 10) / speed, easing);
}

// ── Update (chiamato ogni frame dal game loop) ──
export function updateCamera(dt) {
  const cam = worldState.camera;
  if (!cam.personality) return;  // nessun bioma attivo

  // Scansione POI periodica
  const camCfg = CFG.VISUAL?.campo?.camera ?? {};
  const scanInterval = camCfg.poiScanInterval ?? 15;
  _poiFrame++;
  if (_poiFrame >= scanInterval) {
    _poiFrame = 0;
    _scanPOIs();
  }

  // Cambio traccia → SOLLEVARE naturale verso 1.0, poi camera riprende autonomamente
  if (cam._trackChanged) {
    cam._trackChanged = false;
    _lastPoi = null;
    _ritornoMaxZoom = 1.0;
    // Se siamo già vicini a 1.0, solo un breve settle; altrimenti SOLLEVARE lento
    const dist = Math.abs(cam.zoom - 1.0);
    const dur = dist > 0.5 ? _rand(3, 5) : _rand(1.5, 2.5);
    _shot = _makeShot('SOLLEVARE', 1.0, 0.5, 0.5, dur, 'smooth');
  }

  // Se non c'è shot corrente, creane uno
  if (!_shot) {
    _shot = _nextShot();
  }

  // Avanza lo shot
  _shot.elapsed += dt;
  const t = Math.min(1, _shot.elapsed / _shot.duration);
  const e = _ease(t, _shot.easing);

  cam.zoom   = lerp(_shot.fromZoom, _shot.toZoom, e);
  cam.focusX = lerp(_shot.fromX,    _shot.toX,    e);
  cam.focusY = lerp(_shot.fromY,    _shot.toY,    e);

  // Shot finito → prossimo
  if (t >= 1) {
    _shot = _nextShot();
  }
}
