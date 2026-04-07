# Phase 4: Integrazione e Visual System — Research

**Researched:** 2026-03-27
**Domain:** JavaScript ES modules, director.js extension, macroState visual mapping, integration testing
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `director.js` importa `macroState` da `macro-composer.js` e determina internamente quale layer v3 sta dominando visivamente. Nessuna nuova API (`setActiveLayer()` o simile). Il layer dominante è quello con il valore più alto tra `rhythmicDensity`, `harmonicColor`, `melodicActivity`, `textureDepth` — con lerp sui parametri render per evitare commutazioni brusche.

- **D-02:** Con `CFG.V3_MODE` attivo, `ENGINE_PREFS` v2 è bypassato completamente. Il director usa `LAYER_PREFS` v3 (nuovo oggetto, analogo a `ENGINE_PREFS`). I v2 engine sono già disabilitati da `CFG.V3_MODE`, quindi nessun conflitto.

- **D-03:** Un layer dominante per frame. Il layer con il valore macroState più alto vince e applica la propria firma visiva. La transizione tra layer avviene via lerp sui parametri (`densityMul`, `dotSize`, `midiScale`, palette) — non commutazione brusca.

- **D-04:** `macroState.arcPercent` (0–1 su 45-60min) guida le transizioni di scena e palette come driver primario.

- **D-05:** Con V3_MODE attivo, la state machine v2 (`arc.state: SILENCE → BUILDING → ACTIVE → INTENSE → PEAK → RELEASE`) viene bypassata. `arcPercent` guida direttamente le transizioni visive.

- **D-06:** 5 atti narrativi visivi:
  - Atto I — Emergenza (arcPercent 0.0–0.15): sparse, freddo, rado
  - Atto II — Discesa (arcPercent 0.15–0.35): densità crescente, palette verso neutro/caldo
  - Atto III — Macchina (arcPercent 0.35–0.60): denso, caldo, moto veloce
  - Atto IV — Intensità (arcPercent 0.60–0.80): denso ma con prime smagliature
  - Atto V — Dissoluzione (arcPercent 0.80–1.0): campo che si svuota, freddo che ritorna

- **D-07:** La firma di ogni layer è riconoscibile principalmente dal colore dominante.

- **D-08:** Palette esatte per ciascun layer — calibrate durante implementazione. Vincolo: devono essere chiaramente distinte e allineate alle palette già definite in `director.js`.

- **D-09:** `densityMul`, `dotSize`, `midiScale`, `flickerSpeed`, `trailMax` per ciascun layer sono a discrezione di Claude durante implementazione.

- **D-10:** Verifica MARC-04 usa 5 checkpoint: `arcPercent` forzato a 0%, 25%, 50%, 75%, 90%.

- **D-11:** Segnali di collasso da monitorare: silenzio MIDI totale >30s (fuori dissoluzione), note out-of-range, campo fermo, monotonia armonica >10min.

### Claude's Discretion

- Palette esatta per ciascun layer (HarmonyLayer/RhythmLayer/MelodyTextureLayer)
- `densityMul`, `dotSize`, `midiScale`, `flickerSpeed`, `trailMax` per `LAYER_PREFS`
- Logica esatta di dominance tra layer (max semplice vs weighted con isteresi)
- Gestione del MacroComposer come "quinto layer" visivo

### Deferred Ideas (OUT OF SCOPE)

- CC automation visuale (CC1/CC11 via colore o moto)
- Multi-layer blend esplicito (weighted average di LAYER_PREFS)
- Run completa 60 minuti come test
- Inversion/dissolve narrativi specifici per layer

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MARC-04 | La suite regge 45-60 minuti senza collasso compositivo o monotonia | Checkpoint meccanismo via `arcPercent` forzato; 5 segnali di collasso definiti (D-11); verificabile su server HTTP locale |
| VISL-01 | Il sistema visivo segue l'arco narrativo: sparse/freddo in apertura, denso/caldo al climax, dissoluzione finale | `arcPercent`→scena mappata in 5 atti (D-06); `updateDirector()` come punto di inserimento V3 gate |
| VISL-02 | Ogni layer compositivo ha firma visiva distinta leggibile dal palco | `LAYER_PREFS` analogo a `ENGINE_PREFS`; palette come differenziatore primario; 8 palette disponibili in `colors.js` |

</phase_requirements>

---

## Summary

Phase 4 ha due deliverable distinti ma connessi: stabilità compositiva (MARC-04) e visual system v3 (VISL-01/02). La ricerca ha esaminato in dettaglio director.js (1145 righe), macro-composer.js, config.js, colors.js, e il pattern di wiring già stabilito nelle fasi 2 e 3.

Il blocco principale (`director engine-identity resolution strategy non decisa`) è stato risolto nelle decisioni del CONTEXT.md: `macroState` importato direttamente in `director.js`, `LAYER_PREFS` come nuovo oggetto, bypass di `ENGINE_PREFS` e della arc state machine v2 quando `CFG.V3_MODE` è attivo. Nessuna nuova API pubblica — tutto interno a `director.js`.

Il pattern di wiring v3 è stabile e ripetibile: le fasi 2 e 3 hanno dimostrato 3 edit chirurgici a `main.js` (import + init + update nel Worker). Phase 4 non aggiunge layer ma estende `director.js` — il file unico che riceve le modifiche strutturali. `main.js` non ha bisogno di nuovi import (director già importato e `updateDirector()` già chiamato nel loop rAF).

**Raccomandazione primaria:** 3 piani — (1) CFG.VISUAL config block in config.js, (2) estensione director.js con V3 gate + LAYER_PREFS + arc visivo, (3) test di integrazione MARC-04 con checkpoint arcPercent.

---

## Standard Stack

### Core

| Libreria/API | Versione | Scopo | Perché Standard |
|---|---|---|---|
| ES modules nativi | ES2020+ | zero build | Vincolo esplicito progetto |
| Canvas 2D API | Browser nativo | render surface | Già in uso; field.js/render.js PROTECTED |
| `director.js` | interno | orchestrazione visiva | Unico punto di mutazione scene/palette/camera |
| `macro-composer.js` | interno | fonte macroState | Già wired nel Worker loop V3_MODE |
| `colors.js` | interno | palette system | PROTECTED — solo leggere, non modificare |

### Palette disponibili (da `colors.js` PALETTES — PROTECTED)

| Nome | Background | Foreground | Carattere |
|------|-----------|-----------|----------|
| `default` | nero | bianco | neutro, contrasto massimo |
| `amber` | marrone scuro | giallo crema | caldo/terroso |
| `cyan` | blu scuro | acqua | freddo/acquatico |
| `bw` | nero | bianco | monocromatico, minimalista |
| `magenta` | viola scuro | rosa chiaro | magenta/fucsia |
| `warm` | marrone rossastro | crema | caldo/ardente |
| `cold` | blu notte | azzurro | freddo/polare |
| `ice` | quasi bianco | quasi nero | cristallino, invertito |
| `abyssal` | nero profondo | blu notte | abissale, dark |
| `steel` | quasi nero | bianco | acciaio/rosso accent |
| `ikeda` | nero | bianco | bianco-rosso puro (Ryoji Ikeda) |

**Palette raccomandate per LAYER_PREFS** (devono essere distinte tra loro):
- **HarmonyLayer** (drone + accordi): `cold` — freddo, armonico, spazioso
- **RhythmLayer** (kick + hat + perc): `amber` — caldo, percussivo, terroso
- **MelodyTextureLayer** (bass + voice + lead): `magenta` — melodico, organico, caldo-viola
- **Stato MacroComposer "master"** (arcPercent puro, nessun layer domina): `bw` — neutro strutturale

---

## Architecture Patterns

### Struttura director.js (1145 righe — analisi completa)

```
Righe 1-13     Imports
Righe 14-92    SCENES array (8 scene)
Righe 93-96    COLORED_PALETTES
Righe 97-171   ENGINE_PREFS (7 engine v2) ← BYPASSATO in V3_MODE
Righe 172-228  ENGINE_VISUAL_PHASES (7×5 fasi) ← BYPASSATO in V3_MODE
Righe 229-252  ENGINE_COMPOSITIONS ← BYPASSATO in V3_MODE
Righe 253-320  COMPOSITIONS (layout spaziali — riusabili in v3)
Righe 322-453  ARC_PARAMS + arc state machine + updateArc() ← BYPASSATO in V3_MODE
Righe 454-485  pickScene()
Righe 486-604  scene state + transitionToScene() + updateSceneBlend()
Righe 606-698  Mutation system + initDirector() + executeMutation()
Righe 700-800  Camera system (framing + autoCamera + setFraming)
Righe 801-920  updateDirector() — ENGINE_PREFS apply block ← PUNTO DI INSERIMENTO V3
Righe 920-961  Scene dynamic compositions + densityMul clamping ← BYPASSATO in V3_MODE
Righe 962-1054 Beat accumulation + mutation trigger + camera impulses
Righe 1055-1070 applyCamera() + requestFraming() + requestCameraShake()
Righe 1072-1145 setArcPhaseForced() + resetArcPriority() + exports finali
```

### Punto di inserimento V3 gate in updateDirector()

La funzione `updateDirector(dt, state, globalTime, W, H)` inizia a riga 805 con questo blocco (righe 808-918):

```javascript
// Righe 808-918: ENGINE_PREFS block (v2)
const curEngine = getEngine();                          // ritorna string v2 engine o null
const curPrefs = curEngine ? ENGINE_PREFS[curEngine] : null;
// ... applica dotSize, densityMul, palette, inversioni, fasi musicali ...
// ...se curPrefs è null: riga 900-918 resetta engineRender (else branch)
```

**Pattern V3 gate (da inserire all'inizio di updateDirector, prima del blocco ENGINE_PREFS):**

```javascript
// V3_MODE: bypass ENGINE_PREFS, usa macroState + LAYER_PREFS
if (CFG.V3_MODE) {
  // Determina layer dominante
  // Applica LAYER_PREFS del dominante con lerp
  // Aggiorna arcPercent→scena (5 atti)
  // Skip alla fine del blocco ENGINE_PREFS
} else {
  // blocco ENGINE_PREFS v2 esistente — invariato
}
```

Alternativa più chirurgica: aggiungere `if (CFG.V3_MODE) { return; }` all'inizio dell'ENGINE_PREFS block, e aggiungere il codice V3 in un blocco separato prima. Evita di riscrivere il blocco v2 esistente.

### Pattern chirurgico consolidato dalle fasi 2/3

Il pattern di wiring v3 è documentato nel PLAN 03-03 e già implementato:

```javascript
// main.js — 3 edit chirurgici per ogni nuovo layer:
// 1. Import (aggiunto dopo l'ultimo import v3)
import { initXxx, updateXxx } from './xxx.js';

// 2. Init nel boot V3_MODE block
if (CFG.V3_MODE) {
  initMacroComposer();
  initHarmonyLayer();
  initRhythmLayer();
  initMelodyTextureLayer();
  // ← aggiungere initXxx() qui
}

// 3. Update nel midiWorker.onmessage V3_MODE block
if (CFG.V3_MODE) {
  updateMacroComposer(dt);
  updateHarmonyLayer(dt);
  updateRhythmLayer(dt);
  updateMelodyTextureLayer(dt);
  // ← aggiungere updateXxx(dt) qui
}
```

**Phase 4 NON usa questo pattern.** director.js è già importato e `updateDirector()` è già chiamato nel loop rAF (non nel Worker) da `render.js`. Il V3 gate va dentro `updateDirector()` — zero nuovi import in `main.js`.

### Struttura LAYER_PREFS (da creare — analogo a ENGINE_PREFS)

```javascript
// In director.js — dopo ENGINE_PREFS (riga ~171)
const LAYER_PREFS = {
  harmony: {
    palette: 'cold',
    dotSize: 10, densityMul: 0.6, midiScale: 2.0,
    trailMax: 48, flickerSpeed: 0.5,
    sceneBoost: ['HORIZON', 'SPARSE', 'MONDRIAN'],
  },
  rhythm: {
    palette: 'amber',
    dotSize: 4, densityMul: 1.4, midiScale: 1.0,
    trailMax: 32, flickerSpeed: 5.0,
    sceneBoost: ['DENSE', 'COLUMNS', 'BAYER_CLASSIC'],
  },
  melody: {
    palette: 'magenta',
    dotSize: 7, densityMul: 0.9, midiScale: 1.5,
    trailMax: 40, flickerSpeed: 2.0,
    sceneBoost: ['COLORED_GROUND', 'ASYMMETRIC', 'NEGATIVE'],
  },
};
```

I valori numerici sopra sono punti di partenza per calibrazione — a discrezione durante implementazione (D-09).

### Mappa arcPercent → Scena (5 atti — D-06)

```javascript
// In director.js — nuova funzione _getArcVisualState(arcPercent)
// Atto I (0.00-0.15):  scena SPARSE/HORIZON,   palette cold,  densityCap 0.15
// Atto II (0.15-0.35): scena BAYER_CLASSIC,     palette default, densityCap 0.45
// Atto III (0.35-0.60): scena DENSE/COLORED_GROUND, palette warm/amber, densityCap 1.0
// Atto IV (0.60-0.80): scena DENSE/MONDRIAN,    palette warm,  densityCap 0.9
// Atto V (0.80-1.00):  scena SPARSE/HORIZON,   palette cold→bw, densityCap 0.12
```

Il cambio di scena tra atti avviene via `transitionToScene()` esistente — stessa API usata dalla v2, non richiede nuove funzioni.

### Logica dominance layer (D-01, D-03)

```javascript
function _getDominantLayer() {
  const m = macroState;
  const vals = {
    rhythm:  m.rhythmicDensity,
    harmony: m.harmonicColor,
    melody:  m.melodicActivity + m.textureDepth,  // combinati: stessa "voce"
  };
  // Max semplice — se tutti bassi, ritorna null (stato MacroComposer "master")
  let best = null, bestVal = 0.05; // threshold minima per dominance
  for (const [k, v] of Object.entries(vals)) {
    if (v > bestVal) { best = k; bestVal = v; }
  }
  return best;
}
```

Nota: textureDepth e melodicActivity sono unificati in `melody` perché appartengono allo stesso layer (MelodyTextureLayer). La scelta di combinarli vs usare il max tra i due è a discrezione Claude durante implementazione.

### Anti-Patterns da evitare

- **Non importare `macroState` direttamente in `render.js` o `field.js`** — solo `director.js` legge da macroState (PROTECTED: render.js e field.js non si modificano).
- **Non creare `setActiveLayer()` o API pubblica** — il director determina il dominante internamente (D-01).
- **Non modificare `updateArc()` v2** — bypassarla con early-return in V3_MODE, non cancellarla.
- **Non fare lerp da 0 a 1 su un singolo frame** — usare un lerp lento (~0.02 per frame, come `palette._lerpSpeed`) per evitare pop visivi tra layer dominanti.
- **Non aggiungere magic numbers** — tutti i valori di LAYER_PREFS vanno in `CFG.VISUAL`.
- **Non modificare `colors.js`** — è PROTECTED. Usare solo `setPalette(name)` che esiste già.

---

## Don't Hand-Roll

| Problema | Non costruire | Usare invece | Perché |
|---------|--------------|-------------|--------|
| Cambio palette | Interpolazione manuale RGB | `setPalette(name)` da `colors.js` + `updatePalette(dt)` già chiamato | Già implementa lerp framerate-independent su `_targetBg/Fg/A1/A2/A3` |
| Transizione scena | Nuovo sistema blend | `transitionToScene(scene, instant)` esistente | Già gestisce cross-fade regioni, storia scene, invertBase |
| Camera narrativa | Logica camera custom | `setFraming(type, W, H)` + `requestFraming(type)` esistenti | Già gestisce WIDE/MEDIUM/MACRO/DRIFT con lerp |
| Mutation visive | Trigger manuali | `executeMutation(forceType)` esistente | Già orchestra PRIMITIVE/RESET_PARTIAL/CHROMATIC/SCENE |
| engineRender | Nuovo oggetto render | `engineRender` esistente (riga 508) | Già letto da `field.js` e `render.js` — riusare per layer v3 |
| arcPercent forzato per test | Simulazione temporale | Override `macroState.arcPercent` direttamente in console | macroState è un oggetto mutabile esportato — `macroState.arcPercent = 0.5` funziona |

**Insight chiave:** `director.js` espone già tutti i meccanismi necessari. Phase 4 è una *estensione* con gate V3_MODE — non una riscrittura.

---

## Runtime State Inventory

Step 2.5: SKIPPED — Phase 4 non è una fase di rename/refactor/migrazione. Non ci sono stringhe da rinominare, collezioni da migrare, o state runtime da aggiornare.

---

## Environment Availability

| Dipendenza | Richiesta da | Disponibile | Versione | Fallback |
|-----------|-------------|-----------|---------|--------|
| Chrome/Edge | WebMIDI API | assumere presente (dev machine) | — | — |
| `python3 -m http.server 8282` | Serve progetto locale | ✓ (mac standard) | python3 | — |
| WebMIDI hardware out | Test MIDI monitor | assumere disponibile | — | Console log `[MIDI]` sufficiente per unit check |

**Dipendenze mancanti con fallback:** nessuna che blocchi l'implementazione. Il test MARC-04 richiede monitoraggio MIDI output — il `console.log` esistente nel Worker è sufficiente per verificare che le note vengano emesse.

---

## Common Pitfalls

### Pitfall 1: engineRender non resettato quando V3_MODE bypassa ENGINE_PREFS

**Cosa va storto:** Se il gate V3_MODE non resetta esplicitamente `engineRender.active = false` e i valori null, il blocco else v2 (righe 900-918) non viene eseguito. I valori legacy rimangono sporchi da un'eventuale sessione v2 precedente.

**Perché succede:** `getEngine()` ritorna `null` in V3_MODE (nessun engine v2 attivo). Il blocco `if (curPrefs)` a riga 815 non si attiva. Il blocco `else` a riga 900 dipende dal fatto che `curEngine` sia null — ma in V3_MODE `getEngine()` potrebbe ritornare il nome dell'ultimo engine v2 memorizzato in `midi-patterns.js` se non resettato al boot.

**Come evitare:** Nel gate V3_MODE, forzare `engineRender.active = false` e inizializzare `engineRender` con i valori del layer dominante anziché usarlo come stato legacy.

**Warning signs:** Visual override da engine v2 (`shapeScale`, `trailMax`, `feedbackDecay`) che persistono quando V3_MODE è attivo.

### Pitfall 2: arc state machine v2 che continua ad agire in V3_MODE

**Cosa va storto:** `updateArc(dt, state)` è chiamata a riga 924, dopo il blocco ENGINE_PREFS. Se il V3 gate ha early-return solo nel blocco ENGINE_PREFS ma non prima di `updateArc()`, la state machine v2 continua ad aggiornare `arc.phase` e influenzare `ARC_PARAMS` che modulano `scene.densityMul`.

**Perché succede:** `updateArc()` usa `audio.rms` — che in V3_MODE è sempre disponibile (il microfono è ancora attivo). I threshold `arcRmsSilence/Building/Active` vengono quindi attraversati normalmente, sovrascrivendo la densityCap derivata da `arcPercent`.

**Come evitare:** Il gate V3_MODE deve coprire sia il blocco ENGINE_PREFS che il blocco densityMul clamping arc-driven (righe 963-971). Oppure, mantenere `updateArc()` ma sovrascrivere `arc.phase` con un valore derivato da `arcPercent` — più sicuro del bypass totale.

**Warning signs:** Il campo visivo oscilla tra sparse e dense imprevedibilmente nonostante `arcPercent` stabile.

### Pitfall 3: Isteresi assente nella dominance layer — pop visivi tra layer

**Cosa va storto:** Il layer dominante cambia ad ogni frame quando due dimensioni sono vicine (es. `harmonicColor = 0.42` e `rhythmicDensity = 0.41`). Ogni cambio di dominance triggera `setPalette()` che aggiorna i target del lerp — il lerp non fa pop ma la fluttuazione della palette target crea un tremolio percettibile.

**Perché succede:** Max semplice senza isteresi — se harmonic e rhythm oscillano attorno allo stesso valore (microDrift da macro-composer), il dominante si alterna ogni pochi frame.

**Come evitare:** Aggiungere isteresi: il layer corrente rimane dominante finché un altro lo supera di almeno `CFG.VISUAL.dominanceHysteresis` (es. 0.10). Oppure mediare il dominante su una finestra di N frame.

**Warning signs:** Palette che cambia rapidamente durante la sezione 0.35-0.60 dove harmonicColor e rhythmicDensity sono entrambi elevati.

### Pitfall 4: `transitionToScene()` chiamata troppo frequentemente in V3_MODE

**Cosa va storto:** Se il codice V3 chiama `transitionToScene()` ogni frame in cui cambia atto, invece di solo alla transizione, l'animazione di blend viene resettata ogni frame — il campo rimane bloccato a blend=0.

**Perché succede:** Mancanza di un guard `if (currentAct !== _lastAct)` prima di chiamare `transitionToScene()`.

**Come evitare:** Tracciare l'atto corrente in una variabile locale `_lastV3Act` (come `_lastMusicalPhase` già fatto per gli engine v2 in `engineRender._lastMusicalPhase`). Chiamare `transitionToScene()` solo al cambio di atto.

**Warning signs:** Il campo visivo appare congelato (blend=0 perpetuo) o fa flash bianchi.

### Pitfall 5: Checkpoint MARC-04 — `arcPercent` forzato non riflette il sequencer

**Cosa va storto:** Forzare `macroState.arcPercent = 0.5` in console funziona per il visual check, ma se il sequencer è attivo sovrascrive `macroState.arcPercent` al frame successivo (in `updateMacroComposer()`, righe 58-63).

**Perché succede:** `updateMacroComposer()` usa `status.active` da `getSequencerStatus()` — se il sequencer è attivo, `arcPercent` viene impostato a `status.progress`.

**Come evitare:** Per i checkpoint MARC-04: avviare senza sequencer attivo (`Shift+0` per fermare), poi forzare `macroState.arcPercent = 0.25` in console. In alternativa, aggiungere a config un `CFG.MACRO.arcPercentOverride` che viene controllato in `updateMacroComposer()` prima del calcolo normale.

**Warning signs:** arcPercent forzato torna a 0 immediatamente dopo l'override.

---

## Code Examples

Verificati da lettura diretta dei file sorgente.

### Importare macroState in director.js

```javascript
// Source: src/macro-composer.js — export confermato riga 10
// Aggiungere a src/director.js dopo gli import esistenti (riga 13):
import { macroState } from './macro-composer.js';
```

### V3 gate all'inizio del blocco ENGINE_PREFS in updateDirector()

```javascript
// Source: src/director.js riga 805 — updateDirector()
// Inserire PRIMA di "const curEngine = getEngine();" (riga ~808):
if (CFG.V3_MODE) {
  _updateDirectorV3(dt);
  // Continua con il resto di updateDirector (arc, scene blend, beat, camera)
  // NOTA: non fare return qui — alcune logiche (beat accumulator, camera lerp)
  // devono continuare anche in V3_MODE
} else {
  // blocco ENGINE_PREFS esistente — righe 808-918
}
```

### Lettura palette disponibili per LAYER_PREFS

```javascript
// Source: src/colors.js righe 72-83 — PALETTES object
// Chiavi disponibili verificate: 'default', 'amber', 'cyan', 'bw', 'magenta',
//   'warm', 'cold', 'ice', 'abyssal', 'steel', 'ikeda'
// Tutte usabili via setPalette(name) — già importata in director.js (riga 10)
```

### engineRender — proprietà disponibili per override

```javascript
// Source: src/director.js righe 508-525
export const engineRender = {
  active: false,         // ← settare true in V3_MODE quando layer è dominante
  dotSize: null,         // override scene.dotSize
  densityMul: null,      // moltiplica scene.densityMul
  midiScale: null,       // override scene.midiScale
  forceInvert: null,     // true/false/null
  shapeScale: 1.0,
  trailMax: 64,
  densityGravity: 0,
  onsetWaveSpeed: null,
  flickerSpeed: null,
  midiDensityMul: 0.4,
  feedbackDecay: null,
};
```

### Chiamata corrente a updateDirector in render.js (non toccare)

```javascript
// Source: src/render.js — updateDirector() è chiamato con tutti i parametri
// NON modificare render.js (PROTECTED)
// director.js legge W, H internamente tramite _W, _H (riga 806)
```

### Forzare arcPercent per test MARC-04 (console browser)

```javascript
// Con sequencer fermo (Shift+0):
macroState.arcPercent = 0.0;   // Atto I — Emergenza
macroState.arcPercent = 0.25;  // Atto II — Discesa
macroState.arcPercent = 0.50;  // Atto III — Macchina
macroState.arcPercent = 0.75;  // Atto IV — Intensità
macroState.arcPercent = 0.90;  // Atto V — Dissoluzione
// macroState è mutabile e accessibile dalla console se main.js lo espone
// oppure aggiungere window._debug = { macroState } nel boot V3_MODE
```

---

## State of the Art

| Approccio vecchio | Approccio corrente | Quando cambiato | Impatto |
|---|---|---|---|
| ENGINE_PREFS: identità visiva per engine v2 | LAYER_PREFS: identità per layer v3 | Phase 4 | bypassare ENGINE_PREFS in V3_MODE |
| arc state machine (RMS-driven) | arcPercent (time-driven, precomposto) | Phase 4 | transizioni visive prevedibili e coerenti con arco musicale |
| `getEngine()` da midi-patterns.js | `macroState` da macro-composer.js | Phase 4 | nessun engine v2 attivo → nessun string engine |

**Non deprecato:** ENGINE_PREFS, ENGINE_VISUAL_PHASES, ENGINE_COMPOSITIONS, updateArc() rimangono nel codice — usati in V3_MODE=false (legacy v2).

---

## Open Questions

1. **`macroState` accessibile dalla console per i checkpoint MARC-04?**
   - Cosa sappiamo: macroState è esportato da `macro-composer.js` ma non esposto su `window`
   - Cosa non è chiaro: main.js non espone oggetti debug su window — il forced arcPercent potrebbe richiedere un helper aggiunto nel boot V3_MODE
   - Raccomandazione: aggiungere `if (CFG.debug) window._m = macroState;` nel boot V3_MODE per abilitare override da console in sviluppo

2. **Il beat accumulator di director.js funziona in V3_MODE senza engine v2 attivi?**
   - Cosa sappiamo: `director.beatAccum += dt` è dentro `if (hasRhythm)` dove `hasRhythm = bpm > 0 && state.rhythmicity > 0.3`. In V3_MODE, `audio.bpm` viene dall'analisi audio (microfono) — non dal MIDI clock v2
   - Cosa non è chiaro: se `audio.bpm` viene stimato correttamente senza audio input diretto, `hasRhythm` potrebbe essere sempre false in V3_MODE
   - Raccomandazione: in V3_MODE, usare `CFG.MACRO.bpmReference` per il beat accumulator, non `audio.bpm` — garantisce che la mutation timer funzioni

3. **Quantità di piani necessari per Phase 4**
   - Cosa sappiamo: 3 deliverable distinti (config, director extension, integration test)
   - Cosa non è chiaro: MARC-04 richiede una run osservata o è verificabile solo con checkpoint arcPercent?
   - Raccomandazione: 3 piani — 04-01 (CFG.VISUAL), 04-02 (director.js V3 gate + LAYER_PREFS + arc visivo), 04-03 (integration checklist MARC-04). Il piano 04-03 è un piano di verifica/test, non di codice.

---

## Validation Architecture

> `workflow.nyquist_validation` non presente in `.planning/config.json` — sezione inclusa.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | nessuno — zero npm, zero test runner |
| Config file | nessuno |
| Quick run command | `grep -q "pattern" "MACH:INE II/src/file.js"` per verifica strutturale |
| Full suite command | Ispezione manuale browser: `http://localhost:8282` dopo `python3 -m http.server 8282` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VISL-01 | Campo sparse/freddo a arcPercent=0, denso/caldo a 0.5, dissolto a 0.9 | smoke (visivo) | `grep -q "LAYER_PREFS" "MACH:INE II/src/director.js"` | ❌ Wave 0 |
| VISL-02 | palette diversa per layer dominante (harmony=cold, rhythm=amber, melody=magenta) | smoke (visivo) | `grep -q "harmony.*cold" "MACH:INE II/src/director.js"` | ❌ Wave 0 |
| MARC-04 | A arcPercent 0/25/50/75/90: MIDI attivo, nessun errore JS, campo risponde | integration (checkpoint) | check console browser per errori JS + MIDI monitor | ❌ Wave 0 — manuale |

### Sampling Rate

- **Per task commit:** `grep` strutturale sui file modificati
- **Per wave merge:** Avvio server + ispezione browser ai 5 checkpoint arcPercent
- **Phase gate:** Tutti e 5 i checkpoint passano senza errori JS + firma visiva distinta per layer verificata visivamente

### Wave 0 Gaps

- [ ] `CFG.VISUAL` block in `config.js` — copre VISL-01/02 parametri
- [ ] `LAYER_PREFS` in `director.js` — copre VISL-02 identità visiva
- [ ] V3 gate in `updateDirector()` — copre VISL-01 arc visivo
- [ ] Script/procedura checkpoint MARC-04 — manuale (nessun test runner)

---

## Sources

### Primary (HIGH confidence)

- `MACH:INE II/src/director.js` (1145 righe — letto completo) — struttura ENGINE_PREFS, updateDirector(), arc state machine, engineRender, scene system
- `MACH:INE II/src/macro-composer.js` (156 righe — letto completo) — macroState export, tutte le proprietà confermate
- `MACH:INE II/src/config.js` (694 righe — letto completo) — CFG.V3_MODE, CFG.MACRO, CFG.RHYTHM, CFG.MELODY
- `MACH:INE II/src/colors.js` (righe 1-140) — PALETTES object con tutte le chiavi disponibili
- `MACH:INE II/src/main.js` (316 righe — letto completo) — pattern V3_MODE wiring già in uso
- `.planning/phases/04-integrazione-e-visual-system/04-CONTEXT.md` — decisioni locked

### Secondary (MEDIUM confidence)

- `.planning/phases/03-melodylayer-e-texturelayer/03-03-PLAN.md` — pattern chirurgico 3-edit confermato e già applicato
- `.planning/STATE.md` — decisioni accumulate fasi 0-3, conferma che blocker director-v3 è risolto in CONTEXT.md

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — letto direttamente dai file sorgente
- Architecture (director.js): HIGH — analisi riga per riga del file completo
- Punti di inserimento V3: HIGH — identificati con numeri di riga esatti
- Palette disponibili: HIGH — lette da PALETTES in colors.js
- Pitfalls: HIGH — derivati dalla logica esistente (non speculativi)
- Integration test MARC-04: MEDIUM — il meccanismo arcPercent override richiede verifica runtime

**Research date:** 2026-03-27
**Valid until:** Non scade — tutto il codice è locale e versionato. Rileggere se director.js viene modificato prima dell'esecuzione di Phase 4.

---

## RESEARCH COMPLETE
