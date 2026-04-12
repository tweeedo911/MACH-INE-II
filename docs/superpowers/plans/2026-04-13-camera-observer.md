# Camera Osservatore Narrativo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire la camera passiva con un sistema autonomo che osserva il campo con intenzione narrativa — 5 gesti cinematografici, personalità per bioma, POI detection.

**Architecture:** Nuovo `src/camera.js` (POI scanner + shot sequencer + interpolazione). Il director3 smette di pilotare zoom/focus — imposta solo `personality` e `phase`. Campo.js espone densità per blocco e rimuove barrel. Il game loop chiama `updateCamera(dt)` ogni frame.

**Tech Stack:** JavaScript ES modules, Canvas 2D, no dipendenze.

**Spec:** `docs/superpowers/specs/2026-04-13-camera-observer-design.md`

---

## File Structure

| File | Azione | Responsabilità |
|------|--------|----------------|
| `src/camera.js` | **NUOVO** | POI scanner, shot sequencer, interpolazione, personalità biomi |
| `src/world-state.js` | modifica | Aggiunge personality/phase, rimuove barrel |
| `src/campo.js` | modifica | Espone `getCampoDensityBlocks()`, rimuove barrel LUT |
| `src/director3.js` | modifica | Svuota `_updateCamera()`, imposta personality/phase |
| `src/config.js` | modifica | Sostituisce camera config con parametri per bioma |
| `src/main.js` | modifica | Import + chiamata `updateCamera(dt)` nel loop |

---

### Task 1: Aggiornare world-state.js — camera state

**Files:**
- Modify: `src/world-state.js:77-82`

- [ ] **Step 1: Modificare camera in worldState**

Sostituire il blocco camera:

```javascript
// Vecchio (righe 77-82):
  camera: {
    zoom:   1.0,    // 1.0 normale, 1.5-2.0 macro, 0.3-0.5 orbita
    focusX: 0.5,    // 0→1, centro attenzione X
    focusY: 0.5,    // 0→1, centro attenzione Y
    barrel: 0,      // 0→1, distorsione sferica (solo RITORNO)
  },

// Nuovo:
  camera: {
    zoom:   1.0,        // attuale zoom (scritto da camera.js)
    focusX: 0.5,        // attuale focus X 0→1 (scritto da camera.js)
    focusY: 0.5,        // attuale focus Y 0→1 (scritto da camera.js)
    personality: null,   // bioma attivo — scritto da director3
    phase: null,         // fase corrente — scritta da director3
  },
```

- [ ] **Step 2: Verificare che il file si carica**

Run: `cd "/Users/Edo_1/MACH-INE II" && python3 -m http.server 8282 &` poi aprire http://localhost:8282 in browser. La console non deve avere errori su `barrel` (campo.js e director3.js la leggono ancora — li aggiorniamo dopo, ma `barrel` acceduto su un oggetto dove manca restituisce `undefined`, che è falsy, quindi il blocco barrel in campo.js si skippa. OK).

- [ ] **Step 3: Commit**

```bash
git add src/world-state.js
git commit -m "v3.8.0-wip: camera state — add personality/phase, remove barrel"
```

---

### Task 2: Rimuovere barrel da campo.js

**Files:**
- Modify: `src/campo.js:23-26` (variabili barrel)
- Modify: `src/campo.js:445-471` (funzione `_buildBarrelLUT`)
- Modify: `src/campo.js:621-652` (blocco barrel in `renderCampo`)

- [ ] **Step 1: Rimuovere le variabili barrel (righe 23-26)**

Eliminare:
```javascript
// ── Camera: barrel distortion LUT ──
let _barrelLUT = null;       // Int32Array — source offset per pixel
let _barrelCoeff = -1;       // coefficiente usato per generare la LUT
let _barrelFrameCount = 0;   // frame counter per ricalcolo periodico
```

- [ ] **Step 2: Rimuovere `_buildBarrelLUT()` (righe 445-471)**

Eliminare l'intera funzione:
```javascript
// ── Camera: barrel LUT generation ──
function _buildBarrelLUT(barrel) {
  // ... tutta la funzione fino alla chiusura }
}
```

- [ ] **Step 3: Rimuovere il blocco barrel da `renderCampo` (righe 621-652)**

Eliminare da `const cam = worldState.camera;` fino a `_barrelFrameCount = 0; }` compreso — tutto il blocco `if (barrel > 0.005) { ... } else { ... }`.

Il codice prosegue direttamente con:
```javascript
  _offCtx.putImageData(_imgData, 0, 0);

  // ── Camera transform: macro / orbita / normale ──
```

Il `const cam = worldState.camera;` a riga 622 serviva solo per barrel — ma attenzione: anche il blocco "Camera transform" lo usa (riga 657). Quindi **spostare** `const cam = worldState.camera;` subito prima del commento "Camera transform" (riga 656):

```javascript
  _offCtx.putImageData(_imgData, 0, 0);

  // ── Camera transform: macro / orbita / normale ──
  const cam = worldState.camera;
  const zoom = cam.zoom;
```

- [ ] **Step 4: Verificare in browser**

Aprire http://localhost:8282. Nessun errore in console. Il campo si renderizza normalmente (zoom 1.0, nessun barrel). Se il server era già attivo, basta ricaricare.

- [ ] **Step 5: Commit**

```bash
git add src/campo.js
git commit -m "v3.8.0-wip: remove barrel distortion from campo.js"
```

---

### Task 3: Esporre `getCampoDensityBlocks()` da campo.js

**Files:**
- Modify: `src/campo.js` (aggiungere funzione dopo `getCampoAvgDensity`, riga ~691)

- [ ] **Step 1: Aggiungere la funzione**

Inserire dopo `getCampoAvgDensity()`:

```javascript
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
```

- [ ] **Step 2: Verificare che l'export è raggiungibile**

In console browser: importare il modulo e chiamare la funzione:
```javascript
import('./src/campo.js').then(m => console.log(m.getCampoDensityBlocks()))
```
Dovrebbe restituire un array di ~84 oggetti (12×7 con blockSize=8 su griglia 96×54).

- [ ] **Step 3: Commit**

```bash
git add src/campo.js
git commit -m "v3.8.0-wip: expose getCampoDensityBlocks() for camera POI detection"
```

---

### Task 4: Aggiornare config.js — parametri camera per bioma

**Files:**
- Modify: `src/config.js:1184-1191`

- [ ] **Step 1: Sostituire il blocco camera**

Sostituire:
```javascript
      // ── Camera ──
      camera: {
        lerpSpeed:     0.02,
        driftR:        0.10,
        driftPeriod:   30,
        macroMinDensity: 0.05,
        barrelRecalcEvery: 30,
      },
```

Con:
```javascript
      // ── Camera Osservatore ──
      camera: {
        poiScanInterval: 15,     // frame tra scansioni POI
        poiBlockSize: 8,         // celle per lato blocco
        poiMaxCount: 5,          // POI massimi restituiti dalla scansione
        macroMinDensity: 0.05,   // densità media minima per consentire micro zoom
        biomes: {
          NEBBIA:   { zoomRange: [6, 8], holdRange: [8, 12], speed: 0.3, easing: 'smooth', preferScan: null },
          TESSUTO:  { zoomRange: [3, 5], holdRange: [4, 6],  speed: 0.5, easing: 'smooth', preferScan: 'H' },
          SOLCO:    { zoomRange: [3, 4], holdRange: [3, 5],  speed: 0.6, easing: 'smooth', preferScan: null },
          RESPIRO:  { zoomRange: [2, 4], holdRange: [3, 5],  speed: 0.4, easing: 'smooth', preferScan: null },
          MACCHINA: { zoomRange: [4, 6], holdRange: [2, 4],  speed: 0.8, easing: 'snap',   preferScan: null },
          TEMPESTA: { zoomRange: [2, 3], holdRange: [2, 3],  speed: 0.9, easing: 'smooth', preferScan: null },
          RITORNO:  { zoomRange: [1, 6], holdRange: [3, 8],  speed: 0.4, easing: 'smooth', preferScan: null },
        },
      },
```

- [ ] **Step 2: Commit**

```bash
git add src/config.js
git commit -m "v3.8.0-wip: camera config — per-biome parameters"
```

---

### Task 5: Svuotare _updateCamera in director3.js

**Files:**
- Modify: `src/director3.js:14` (import)
- Modify: `src/director3.js:139-143` (reset camera)
- Modify: `src/director3.js:484-537` (funzione `_updateCamera`)

- [ ] **Step 1: Rimuovere import di `getCampoAvgDensity`**

Riga 14: eliminare l'import. Se è l'unica cosa importata da campo.js, eliminare l'intera riga:
```javascript
// RIMUOVERE:
import { getCampoAvgDensity } from './campo.js';
```

- [ ] **Step 2: Aggiornare reset camera a cambio traccia (righe 139-143)**

Sostituire:
```javascript
  // Reset camera — ogni traccia parte a zoom 1.0 (tranne RITORNO che pilota progressivamente)
  worldState.camera.zoom   = 1.0;
  worldState.camera.focusX = 0.5;
  worldState.camera.focusY = 0.5;
  worldState.camera.barrel = 0;
```

Con:
```javascript
  // Reset camera — ogni traccia parte a zoom 1.0, camera.js riprende il pilotaggio
  worldState.camera.zoom   = 1.0;
  worldState.camera.focusX = 0.5;
  worldState.camera.focusY = 0.5;
  worldState.camera.personality = worldState.track;
  worldState.camera.phase = PHASE_ORDER[0];
```

- [ ] **Step 3: Svuotare `_updateCamera` (righe 484-537)**

Sostituire l'intera funzione con:
```javascript
function _updateCamera(dt) {
  // Pilotaggio spostato in src/camera.js — il director comunica solo personality e phase
  worldState.camera.personality = worldState.track || null;
  worldState.camera.phase = PHASE_ORDER[_phaseIdx];
}
```

- [ ] **Step 4: Verificare in browser**

Aprire http://localhost:8282. La camera resta a zoom 1.0 (nessun movimento — camera.js non è ancora cablato). Nessun errore in console.

- [ ] **Step 5: Commit**

```bash
git add src/director3.js
git commit -m "v3.8.0-wip: director3 delegates camera to camera.js"
```

---

### Task 6: Creare src/camera.js — struttura base + interpolazione

**Files:**
- Create: `src/camera.js`

- [ ] **Step 1: Creare il file con la struttura base**

```javascript
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

// ── Shot types ──
const SHOT_TYPES = ['STARE', 'VIAGGIARE', 'TUFFO', 'SOLLEVARE', 'SCANSIONE'];

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
  const phase = cam.phase;
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

  // Gate: non zoomare se il campo è vuoto (germoglio iniziale)
  const minDens = camCfg.macroMinDensity ?? 0.05;
  const avgDens = getCampoAvgDensity();
  const canMicro = avgDens > minDens;

  // ── RITORNO: logica speciale — allontanamento progressivo ──
  if (personality === 'RITORNO') {
    return _nextShotRitorno(biomeCfg, easing);
  }

  // ── Tutti gli altri biomi ──
  const prevType = _shot ? _shot.type : null;
  const poi = _pickPOI();

  // Grammatica: dopo un gesto, quale segue?
  if (!prevType || prevType === 'SOLLEVARE') {
    // Inizio o dopo respiro → tuffo su un POI (se c'è densità)
    if (canMicro && _pois.length > 0) {
      const z = _rand(zMin, zMax);
      return _makeShot('TUFFO', z, poi.x, poi.y, _rand(2, 3) / speed, easing);
    }
    // Campo vuoto → stare a zoom 1.0
    return _makeShot('STARE', 1.0, 0.5, 0.5, _rand(hMin, hMax), easing);
  }

  if (prevType === 'TUFFO') {
    // Appena arrivato → osserva (STARE)
    return _makeShot('STARE', cam.zoom, cam.focusX, cam.focusY, _rand(hMin, hMax), easing);
  }

  if (prevType === 'STARE') {
    // Dopo osservazione → viaggia verso altro POI o solleva
    // SCANSIONE se il bioma la preferisce e con 40% probabilità
    if (biomeCfg.preferScan && Math.random() < 0.4) {
      const dir = biomeCfg.preferScan;   // 'H' o 'V'
      const scanDist = 0.3 + Math.random() * 0.3;
      const toX = dir === 'H' ? Math.min(1, Math.max(0, cam.focusX + (Math.random() < 0.5 ? scanDist : -scanDist))) : cam.focusX;
      const toY = dir === 'V' ? Math.min(1, Math.max(0, cam.focusY + (Math.random() < 0.5 ? scanDist : -scanDist))) : cam.focusY;
      return _makeShot('SCANSIONE', cam.zoom, toX, toY, _rand(5, 10) / speed, easing);
    }

    // 50% viaggia verso nuovo POI, 50% solleva
    if (_pois.length > 1 && Math.random() < 0.5) {
      return _makeShot('VIAGGIARE', cam.zoom, poi.x, poi.y, _rand(4, 8) / speed, easing);
    }
    return _makeShot('SOLLEVARE', 1.0, 0.5, 0.5, _rand(2, 4) / speed, easing);
  }

  if (prevType === 'VIAGGIARE' || prevType === 'SCANSIONE') {
    // Dopo viaggio/scansione → osserva dove sei arrivato
    return _makeShot('STARE', cam.zoom, cam.focusX, cam.focusY, _rand(hMin, hMax), easing);
  }

  // Default: tuffo su POI
  if (canMicro && _pois.length > 0) {
    const z = _rand(zMin, zMax);
    return _makeShot('TUFFO', z, poi.x, poi.y, _rand(2, 3) / speed, easing);
  }
  return _makeShot('STARE', 1.0, 0.5, 0.5, _rand(hMin, hMax), easing);
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
      return _makeShot('TUFFO', z, poi.x, poi.y, _rand(2, 3) / speed, easing);
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
```

- [ ] **Step 2: Commit**

```bash
git add src/camera.js
git commit -m "v3.8.0-wip: create camera.js — observer with POI detection and shot sequencer"
```

---

### Task 7: Cablare camera.js nel game loop (main.js)

**Files:**
- Modify: `src/main.js:17` (import area)
- Modify: `src/main.js:269-281` (game loop)

- [ ] **Step 1: Aggiungere import**

Dopo riga 17 (`import { setBiome } from './campo.js';`), aggiungere:
```javascript
import { initCamera, updateCamera } from './camera.js';
```

- [ ] **Step 2: Chiamare initCamera al boot**

Cercare dove viene chiamato `initDirector3` nel file (nella funzione start/boot). Aggiungere `initCamera()` subito dopo `initDirector3(...)`.

- [ ] **Step 3: Chiamare updateCamera nel render loop**

Nel game loop (riga ~270, funzione `loop`), aggiungere `updateCamera(dt)` dopo `updateState()` e prima di `renderFrame()`:

```javascript
function loop(now) {
  if (!running) return;
  requestAnimationFrame(loop);

  const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
  lastTime = now;

  updateAudio();
  updateMIDI();
  updateState();
  updateCamera(dt);    // ← NUOVO: camera osservatore
  renderFrame(now, dt);
}
```

Nota: `updateCamera` va nel render loop (60fps), non nel MIDI clock worker (che gira indipendente). La camera è visuale, non musicale.

- [ ] **Step 4: Chiamare initCamera anche al reset traccia**

Cercare nel file dove viene chiamato `initDirector3` per cambio traccia (tipicamente in un handler di tasti). Se `initCamera` non viene chiamato lì, aggiungerlo. L'importante è che a cambio traccia la camera resetti il suo stato (_shot, _pois, _ritornoMaxZoom).

- [ ] **Step 5: Verificare in browser — test completo**

1. Aprire http://localhost:8282
2. Avviare il sistema (click per start)
3. Osservare: la camera dovrebbe iniziare a muoversi dopo qualche secondo (quando i POI compaiono)
4. Verificare che lo zoom funziona — l'immagine dovrebbe ingrandirsi/rimpicciolirsi
5. Console: nessun errore

- [ ] **Step 6: Commit**

```bash
git add src/main.js
git commit -m "v3.8.0-wip: wire camera.js into game loop"
```

---

### Task 8: Test dal vivo e calibrazione

**Files:**
- Possibly adjust: `src/camera.js` (parametri)
- Possibly adjust: `src/config.js` (range zoom/hold/speed)

- [ ] **Step 1: Test NEBBIA**

Avviare con traccia NEBBIA. Verificare:
- Zoom profondo 6-8× dopo che appaiono le prime stelle
- Hold lunghi (il campo zoommato resta fermo per secondi)
- Movimenti lenti tra POI
- Nessun movimento se il campo è vuoto (gate densità funziona)

- [ ] **Step 2: Test MACCHINA**

Passare alla traccia MACCHINA. Verificare:
- Zoom 4-6× sui dettagli del circuito
- Movimenti a scatto (easing snap — salto rapido, non smooth)
- Hold corti (2-4 secondi)

- [ ] **Step 3: Test RITORNO**

Passare alla traccia RITORNO. Verificare:
- Parte a zoom 1.0 (fullscreen)
- Eventuale tuffo iniziale su un dettaglio
- Progressivo allontanamento — il campo si rimpicciolisce nel nero
- Mai torna più vicino (monotono)
- Fine: puntino ~0.15 che rimane

- [ ] **Step 4: Verificare transizione tra tracce**

Cambiare traccia durante un gesto. La camera deve resettarsi senza errori.

- [ ] **Step 5: Aggiustare parametri se necessario**

Se lo zoom è troppo/poco aggressivo, i movimenti troppo veloci/lenti, o i tempi di hold non giusti, aggiustare i valori in `config.js` nel blocco `camera.biomes`. Non cambiare la logica — solo i numeri.

- [ ] **Step 6: Commit finale**

```bash
git add src/camera.js src/config.js
git commit -m "v3.8.0: camera osservatore narrativo — POI detection, 5 gesti, personalità per bioma"
```

---

## Riepilogo ordine task

1. **world-state.js** — aggiornare camera state (personality/phase, rimuovere barrel)
2. **campo.js** — rimuovere barrel LUT e codice barrel
3. **campo.js** — esporre `getCampoDensityBlocks()`
4. **config.js** — parametri camera per bioma
5. **director3.js** — svuotare `_updateCamera`, impostare personality/phase
6. **camera.js** — creare il file (POI scanner + shot sequencer + interpolazione + personalità)
7. **main.js** — cablare import + chiamata nel loop
8. **Test e calibrazione** — verifica live per bioma + aggiustamenti numerici
