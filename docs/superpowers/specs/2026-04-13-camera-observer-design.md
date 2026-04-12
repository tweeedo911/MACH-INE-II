# Camera come Osservatore Narrativo — Design Spec

> Spec elaborata il 2026-04-13 (sessione 14).
> Sostituisce il sistema camera passivo della sessione 12 (v3.6.0).

---

## Problema

La camera attuale è un parametro passivo: il director imposta zoom/focus
per fase, tutto qui. Non guarda niente, non sa cosa c'è nel campo.
Il drift circolare in fase densità è movimento senza intenzione.
Lo zoom macro in germoglio è timido (1.0→1.5) e poco percepibile.
Il barrel distortion è codice morto quando la camera è in crop.

## Obiettivo

La camera diventa un agente narrativo autonomo che:
- **Percepisce** dove c'è materia nel campo (POI)
- **Sceglie** cosa guardare in base al bioma e alla fase
- **Si muove** con gesti cinematografici intenzionali
- **Tiene** il dettaglio finché ha senso, poi si sposta con un motivo

Non eccessiva. Forte carattere. Pochi gesti, ben definiti per bioma.

---

## Architettura

Un file nuovo **`src/camera.js`** con tre responsabilità:

### 1. POI Scanner

Ogni ~15 frame, divide il campo in blocchi 8×8 celle (= 12×7 = 84 blocchi
sulla griglia 96×54). Per ogni blocco somma la densità di tutti i ruoli.
Restituisce i 3-5 blocchi più densi come POI.

```javascript
POI = { x, y, density, dominantRole }
// x, y in coordinate normalizzate 0→1
// dominantRole: quale ruolo ha più materia in quel blocco
```

Costo: ~0.1ms (84 somme su array già esistenti).

I POI cambiano col tempo — nuovi depositi li creano, il decay li spegne.
La camera non insegue la novità istantanea: guarda il POI corrente per
un tempo minimo (hold), poi decide se restare o spostarsi.

**Dipendenza:** campo.js espone `getCampoDensityBlocks(blockSize)`.

### 2. Shot Sequencer

Mantiene lo **shot** corrente — un singolo gesto con target, zoom, durata,
tempo trascorso. Non c'è coda: un solo shot alla volta.

Quando lo shot finisce:
1. Aggiorna i POI (se non aggiornati di recente)
2. Consulta la grammatica del bioma attivo
3. Sceglie il prossimo shot in base a: POI disponibili, shot precedente,
   fase corrente

```javascript
shot = {
  type,        // 'STARE' | 'VIAGGIARE' | 'TUFFO' | 'SOLLEVARE' | 'SCANSIONE'
  fromZoom, fromX, fromY,   // stato iniziale
  toZoom, toX, toY,         // target
  duration,    // secondi
  elapsed,     // secondi trascorsi
  easing,      // 'smooth' | 'linear' | 'snap'
}
```

### 3. Interpolazione

Ogni frame aggiorna `worldState.camera.zoom/focusX/focusY`:

```javascript
const t = shot.elapsed / shot.duration;
const e = easing === 'smooth' ? smoothstep(t)
        : easing === 'snap'   ? (t < 0.1 ? 0 : 1)
        : t;  // linear
camera.zoom   = lerp(shot.fromZoom, shot.toZoom, e);
camera.focusX = lerp(shot.fromX,    shot.toX,    e);
camera.focusY = lerp(shot.fromY,    shot.toY,    e);
```

`smoothstep(t) = t * t * (3 - 2 * t)` — zero derivata agli estremi,
movimento naturale. Per MACCHINA si usa `linear` o `snap`.

---

## Vocabolario Gesti (5 tipi)

| Gesto | Zoom | Movimento | Durata tipica | Descrizione |
|-------|------|-----------|---------------|-------------|
| **STARE** | 3-8× | fermo su POI | 3-12s | osserva un dettaglio |
| **VIAGGIARE** | mantenuto | pan da A a B | 4-8s | collega due zone |
| **TUFFO** | 1.0→target | zoom in verso POI | 2-3s | entra nel micro |
| **SOLLEVARE** | target→1.0 | zoom out | 2-4s | respiro, cambio contesto |
| **SCANSIONE** | 2-4× | sweep lineare H o V | 5-10s | esplora una direzione |

Regole di sequenza:
- Dopo TUFFO → STARE (guarda dove sei arrivato)
- Dopo STARE → VIAGGIARE o SOLLEVARE (non restare fermo troppo)
- Dopo SOLLEVARE → TUFFO su nuovo POI (non restare a zoom 1 a lungo)
- SCANSIONE → STARE quando incontra un POI denso

---

## Personalità per Bioma

### NEBBIA — *L'osservatore nel vuoto*

- Zoom: 6-8×
- Hold: 8-12s (lento, contemplativo)
- Gesti dominanti: STARE + VIAGGIARE lento
- Comportamento: cerca le rare stelle drone e le nebulose voice. Quando
  una nebulosa appare, la trova e la guarda espandersi e morire. Tra un
  POI e l'altro, il viaggio è lentissimo attraverso il vuoto nero.
  La lentezza della camera trasmette solitudine.
- Easing: smooth

### TESSUTO — *Il microscopio che scorre*

- Zoom: 3-5×
- Hold: 4-6s
- Gesti dominanti: SCANSIONE orizzontale (le fibre sono H)
- Comportamento: segue le fasce Y dove chord e bass depositano. Il gesto
  principale è SCANSIONE H — la camera viaggia lungo una fibra. Quando un
  kick deposita (fascia orizzontale), STARE breve poi riprende.
- Easing: smooth

### SOLCO — *L'inseguitore delle eco*

- Zoom: 3-4×
- Hold: 3-5s
- Gesti dominanti: VIAGGIARE orizzontale + TUFFO/SOLLEVARE per voice
- Comportamento: quando il bass deposita una colonna, la camera la segue
  verso il basso poi panna a destra per inseguire le eco dub che si
  spostano nello spazio (delay = tempo = X). Il voice-fulmine provoca
  TUFFO veloce verso la scarica, poi SOLLEVARE.
- Easing: smooth

### RESPIRO — *Il respiro*

- Zoom: 2-4×, ciclico
- Hold: 3-5s
- Gesti dominanti: TUFFO lento → STARE → SOLLEVARE lento (ciclo respiratorio)
- Comportamento: la camera respira — zoom in lento, osserva, zoom out
  lento, ripete. Il fuoco è sulla membrana, pori, spessore variabile.
  I cicli di zoom imitano inspirazione/espirazione.
- Easing: smooth

### MACCHINA — *La visione artificiale*

- Zoom: 4-6×
- Hold: 2-4s (preciso, breve)
- Gesti dominanti: STARE + TUFFO meccanici
- Comportamento: movimenti a scatto, non smooth. Come un sistema di
  ispezione industriale: posiziona → scatta → analizza → next. Salta
  da un chip (chord) a una traccia di circuito (bass) a un mirino (voice).
  Nessun viaggio fluido.
- Easing: snap o linear

### TEMPESTA — *L'immersione*

- Zoom: 2-3× (non troppo stretto, troppa materia)
- Hold: 2-3s
- Gesti dominanti: VIAGGIARE rapido + TUFFO/SOLLEVARE per kick
- Comportamento: movimenti rapidi tra POI. Segue il flusso dell'erosione
  direzionale. Kick-esplosione radiale: SOLLEVARE veloce per mostrare
  l'onda d'urto, poi TUFFO di nuovo dentro.
- Easing: smooth (ma veloce)

### RITORNO — *L'addio*

- Zoom: parte a 1.0 (fullscreen), finisce a ~0.15
- Hold: decrescente (inizia 6-8s, finisce 2-3s)
- Gesti dominanti: TUFFO iniziale → STARE → SOLLEVARE progressivi
- Comportamento: inizia fullscreen — tutto il mondo visibile. Nei primi
  momenti, TUFFO su una scintilla/costellazione — un ultimo dettaglio
  intimo. Poi progressivamente ogni shot ha zoom minore del precedente.
  Ultimo terzo: zoom < 0.5, il campo è un'isola nel nero. Fine traccia:
  zoom ~0.15, puntino che svanisce. La sequenza stessa è l'allontanamento.
  L'orbita cala monotonicamente — non torna mai più vicina.
- Easing: smooth
- Nota: nessun barrel distortion. L'allontanamento basta.

---

## Integrazione col Sistema Esistente

### world-state.js

```javascript
camera: {
  zoom:   1.0,
  focusX: 0.5,
  focusY: 0.5,
  // barrel RIMOSSO
  // Nuovi campi (scritti da director3, letti da camera.js):
  personality: null,   // 'NEBBIA' | 'TESSUTO' | ... | 'RITORNO'
  phase: null,         // 'germoglio' | 'pulsazione' | ...
}
```

### director3.js

`_updateCamera()` viene svuotata — diventa:

```javascript
function _updateCamera(dt) {
  worldState.camera.personality = worldState.track || null;
  worldState.camera.phase = PHASE_ORDER[_phaseIdx];
}
```

Il reset a cambio traccia diventa:
```javascript
worldState.camera.zoom   = 1.0;
worldState.camera.focusX = 0.5;
worldState.camera.focusY = 0.5;
worldState.camera.personality = null;
worldState.camera.phase = null;
```

### campo.js

**Aggiunge:**
```javascript
export function getCampoDensityBlocks(blockSize = 8) {
  // Ritorna array di { x, y, density, dominantRole }
  // x, y normalizzati 0→1 (centro del blocco)
}
```

**Rimuove:**
- `_buildBarrelLUT()` e tutto il codice barrel (LUT, coefficiente, frame counter)
- Il blocco `if (barrel > 0.005) { ... }` in `renderCampo`
- `_barrelLUT`, `_barrelCoeff`, `_barrelFrameCount` (variabili modulo)

**Invariato:**
- Rendering macro (zoom > 1.01): `drawImage` con crop — funziona per qualsiasi zoom
- Rendering orbita (zoom < 0.99): `fillRect` nero + `drawImage` scalato
- Nessun limite hardcoded su zoom — valori fino a 8× e giù fino a 0.15 funzionano

### config.js

Nuovo blocco dentro `VISUAL.campo.camera`:

```javascript
camera: {
  poiScanInterval: 15,   // frame tra scansioni POI
  poiBlockSize: 8,       // celle per lato blocco
  poiMaxCount: 5,        // POI massimi restituiti
  // Per-bioma: override dei default
  biomes: {
    NEBBIA:   { zoomRange: [6, 8], holdRange: [8, 12], speed: 0.3, easing: 'smooth' },
    TESSUTO:  { zoomRange: [3, 5], holdRange: [4, 6],  speed: 0.5, easing: 'smooth' },
    SOLCO:    { zoomRange: [3, 4], holdRange: [3, 5],  speed: 0.6, easing: 'smooth' },
    RESPIRO:  { zoomRange: [2, 4], holdRange: [3, 5],  speed: 0.4, easing: 'smooth' },
    MACCHINA: { zoomRange: [4, 6], holdRange: [2, 4],  speed: 0.8, easing: 'snap'   },
    TEMPESTA: { zoomRange: [2, 3], holdRange: [2, 3],  speed: 0.9, easing: 'smooth' },
    RITORNO:  { zoomRange: [1, 6], holdRange: [3, 8],  speed: 0.4, easing: 'smooth' },
  },
}
```

### camera.js (nuovo)

Esportazioni:

```javascript
export function initCamera()           // chiamato da main.js al boot
export function updateCamera(dt)       // chiamato dal game loop ogni frame
// Legge: worldState.camera.personality, .phase
// Scrive: worldState.camera.zoom, .focusX, .focusY
// Chiama: getCampoDensityBlocks() da campo.js
// Chiama: getCampoAvgDensity() da campo.js (gate micro in germoglio)
```

### main.js

Aggiunge `import { updateCamera } from './camera.js'` e chiama
`updateCamera(dt)` nel game loop, dopo `updateDirector3(dt)` e prima
di `renderCampo()`.

---

## Performance Budget

| Operazione | Costo | Frequenza |
|------------|-------|-----------|
| POI scan (84 blocchi × 8 ruoli) | ~0.1ms | ogni 15 frame |
| Shot selection (confronto POI, scelta gesto) | ~0 | quando shot finisce |
| Interpolazione (3 lerp + 1 smoothstep) | ~0 | ogni frame |
| Barrel LUT (RIMOSSO) | -50ms sporadici, -5ms/frame RITORNO | — |

Costo netto: **inferiore** al sistema precedente (rimuove barrel).

---

## Non incluso in questa spec

- ASCII depth pass a zoom 8+× (VISUAL-VISION §3) — rimandato
- Reazione camera a rupture 4 stadi — la camera segue la personalità del bioma,
  la rottura si manifesta nei depositi non nel comportamento camera
- Transizione camera a cambio traccia — reset istantaneo come prima.
  Una transizione smooth tra personalità è un'evoluzione futura.
