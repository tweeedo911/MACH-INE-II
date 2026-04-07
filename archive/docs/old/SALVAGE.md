# SALVAGE — frammenti da ripescare prima di archiviare le isole morte

Data: 2026-04-07
Contesto: ristrutturazione, FASE 1. Le 16 isole morte in `src/` (5759 LOC totali)
non sono importate da `main.js` ma contengono frammenti che `director3` + 5
moduli + `comp-*.js` non hanno mai portato.

Ogni voce è classificata:
- 🟥 **CRITICO** — funzionalità persa che è bene recuperare (perdita di feature)
- 🟧 **UTILE** — pattern/logica riutilizzabile, da valutare
- 🟨 **REFERENZA** — interessante come pezzo di archivio, non da portare

---

## Isola #1 — V3 Layer System (10 file, ~4400 LOC)

### 🟥 CRITICO — `sequencer.js` (487 LOC)

**Cosa contiene di unico:**
- Oggetto `firma`: `gelo` (freeze), `convergenza` (attract to center),
  `vuotoTotale` (blackout), `densityCap` — **mai portato in director3.js**
- Action `silence_breath` (respiro strutturale di N secondi dentro l'arco)
- 5 ACTS con boundaries temporali e CUES timed (camera framing, fade,
  silence, layer activation, gelo on/off)
- `recoverState()` / `canRecover()` per session persistence

**Verifica eseguita:**
```
grep "firma" director3.js tracks.js rhythm.js harmony.js melody.js bass.js
texture.js world-state.js → 0 matches
```

**Proposta**: estrarre `firma` + `silence_breath` come modulo separato
`app/src/firma.js` (~80 LOC). Le ACT/CUES non servono perché `director3` ha
già la sua orchestrazione tracce-based.

---

### 🟥 CRITICO — `director.js` (1416 LOC)

**Cosa contiene di unico:**
- **Camera state machine**: `current/targetZoom/X/Y`, modi `WIDE/MEDIUM/MACRO/DRIFT`,
  `applyCamera()`, transitions tied to arc — **assenti in director3.js e
  render.js attuali** (verificato: 0 match per `WIDE|MEDIUM|MACRO|DRIFT` in
  render.js, 0 in field.js)
- **`SCENES` array** (8 scene aesthetic) con `palette/densityMul/dotSize/
  midiScale/invertBase/composition`
- **`ENGINE_COMPOSITIONS`** map: engine × phase → composition layout
- **`ENGINE_PHASE_VISUALS`**: per-engine × per-phase parameter overrides
- Scene weighted random selection
- `transitionToScene` con crossfade temporale

**Stato attuale**: `comp-*.js` (6 composizioni) gestiscono composition layout
per traccia, ma **non c'è una camera virtuale** (zoom/pan/shake) e non c'è
scene transition logic — le composizioni si attivano/disattivano in crossfade
ma senza camera mode.

**Proposta**:
- Estrarre la camera in `app/src/camera.js` (~150 LOC) — applicabile in
  `field.js` o `render.js`
- Le SCENES non servono (sostituite dalle 6 comp-*.js)
- Lasciare in archivio per riferimento

---

### 🟧 UTILE — `presence-multiplier.js` (67 LOC)

**Cosa contiene di unico:**
- `setEnginePhase(engine, phase, ruptureStage)` registry — comodo per
  comunicare stato fra moduli senza dipendenza diretta
- `isChannelAllowed(engine, ch)` — gating canali in modalità multi-engine

**Stato attuale**: il framework A/B/C ha `bass.js / bass-v2.js / bass-v3.js`
e idem melody. La selezione attuale **come avviene?** Se è hard-switch in
main.js, il PM potrebbe servire per crossfade fluidi A→B→C invece di salti.

**Proposta**: tenere disponibile per il momento in cui si vogliono crossfade
A/B/C smooth. Estrarre in `app/src/abc-crossfade.js` se serve, altrimenti
archivio.

---

### 🟧 UTILE — `midi-patterns.js` (411 LOC)

**Cosa contiene di unico:**
- 8 pool di behaviors per canale MIDI (zone Y, xMode, shape, size, decay, color)
- `ENGINE_BEHAVIORS` map: per-engine canonical visual identity per i 7 motori
- Logica `getNotePosition` di mapping note→posizione canvas
- 7 set di per-engine MIDI colors

**Stato attuale**: `field.js` e `comp-*.js` gestiscono il rendering MIDI in
modo proprio. **Verifica necessaria**: le 6 composition hanno tutte un
mapping MIDI→visual per canale, oppure ricevono un mapping condiviso?

**Proposta**: Diff comparativo `midi-patterns.js` vs current `field.js` /
`comp-*.js` durante FASE 2. Se le pool zone/shape/decay sono assenti dal
nuovo sistema, estrarre come `app/src/midi-visual-pools.js`. Probabilmente
solo i 7 ENGINE_BEHAVIORS sono persi (comp-*.js sono per traccia, non per
engine).

---

### 🟧 UTILE — `macro-composer.js` (250 LOC)

**Cosa contiene di unico:**
- `macroState` 4D arc (rhythmicDensity, harmonicColor, melodicActivity, textureDepth)
- Modal pivot logic con `pivotNote` condivisa
- BPM lerp tra `bpmForMode` values
- Modal characteristic note tracking

**Stato attuale**: `world-state.js` ha probabilmente parte di questo, ma il
modal pivot e il BPM lerp tra modi sono pattern non triviali.

**Proposta**: Diff `macro-composer.js` vs `world-state.js` + `director3.js`
durante FASE 2. Estrarre eventuali utility (pivot calculation, BPM lerp).

---

### 🟧 UTILE — `harmony-layer.js` (378 LOC)

**Cosa contiene di unico:**
- Gradient velocity gating (`hcScale = harmonicColor * 1.5`)
- `modalCharacteristicNotes` boost (note caratteristica del modo riceve
  velocity boost)
- Voice leading internal constraints
- Drone+chord+bass coordination su CH2/CH3/CH4

**Stato attuale**: `harmony.js` (attivo) probabilmente fa metà di questo. Da
diffare.

**Proposta**: Diff durante FASE 2. Portare solo le features mancanti
(probabilmente characteristic note boost).

---

### 🟧 UTILE — `melody-texture-layer.js` (546 LOC) + `rhythm-layer.js` (565 LOC)

**Cosa contengono di unico:**
- Gradient gating su melodicActivity / rhythmicDensity
- `RITM-05 break` ciclico kick+basso
- Texture density envelope
- CC74/CC1 expression mapping

**Stato attuale**: `rhythm.js`, `melody.js`, `texture.js` (attivi) sono
probabilmente più semplici. Diff necessario.

**Proposta**: Diff durante FASE 2. Estrarre features specifiche se mancanti.

---

### 🟨 REFERENZA — `director-events.js` (26 LOC)

Pub/sub bus generico per eventi semantici (tension, void, grain_entry,
chord_change, rupture_stage, density_peak). Pattern minimal e utile come
reference architetturale, ma niente è perso non portandolo: `world-state`
fa già da bus condiviso con polling.

**Proposta**: archivio.

---

### 🟨 REFERENZA — `utils.js` (9 LOC)

Solo `gaussianRand()` (Box-Muller approximation 3-sample CLT).
Banale da reinlinare se serve.

**Proposta**: copiare la funzione dentro `visual-toolkit.js` o un futuro
`math-utils.js` se non c'è già lì.

---

## Isola #2 — Designer (3 file, ~1290 LOC)

### 🟨 REFERENZA — `designer.js`, `preset-engine.js`, `presets.js`

Sistema di preset/designer mai integrato. **`designer.html`** in root è
l'interfaccia. Per la live performance non serve, è strumento di authoring
offline.

**Proposta**: archivio in blocco. Recuperabile aprendo `designer.html`
direttamente dal backup esterno.

---

## Isola #3 — Orfano

### 🟨 REFERENZA — `config-loader.js` (312 LOC)

Loader per configurazione esterna (probabilmente YAML/JSON). Mai usato:
`config.js` esporta direttamente `CFG`. Si auto-importa.

**Proposta**: archivio.

---

## Riepilogo decisioni proposte

| Azione | File | Quando | Effort |
|---|---|---|---|
| **Estrarre subito** | `sequencer.js → firma.js` | FASE 2 | 30 min |
| **Estrarre subito** | `director.js → camera.js` | FASE 2 | 1h |
| **Diff e portare** | `harmony-layer.js` vs `harmony.js` | FASE 2 | 30 min |
| **Diff e portare** | `melody-texture-layer.js` vs `melody.js + texture.js` | FASE 2 | 30 min |
| **Diff e portare** | `rhythm-layer.js` vs `rhythm.js` | FASE 2 | 30 min |
| **Diff e portare** | `macro-composer.js` vs `world-state.js + director3.js` | FASE 2 | 30 min |
| **Diff e portare** | `midi-patterns.js` vs `field.js + comp-*.js` | FASE 2 | 30 min |
| **Tenere disponibile** | `presence-multiplier.js` (per A/B/C crossfade futuro) | FASE 4 | — |
| **Inlinare** | `utils.js → gaussianRand()` in visual-toolkit.js | FASE 2 | 5 min |
| **Archivio diretto** | `director-events.js`, `designer.js`, `preset-engine.js`, `presets.js`, `config-loader.js` | FASE 2 | — |

**Tempo aggiuntivo per il salvage**: ~4h (rispetto al piano originale FASE 2 di 2h).
**Nuovo totale ristrutturazione stimato**: ~9h totali.

---

## Note

Tutti i file sono comunque preservati in `archive/code/dead-islands/` con
i loro nomi originali. Il salvage estrae **solo** i frammenti specifici e
li porta nell'`app/src/` nuovo. Nulla viene mai perso definitivamente.
