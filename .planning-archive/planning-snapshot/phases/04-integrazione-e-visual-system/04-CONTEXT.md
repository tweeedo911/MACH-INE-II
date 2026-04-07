# Phase 4: Integrazione e Visual System — Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 ha due deliverable distinti:

1. **Stabilità compositiva** (MARC-04): la suite 45-60 minuti regge dall'inizio alla fine senza collasso compositivo, monotonia o stutter. Verificata tramite time-jump checkpoints a arcPercent forzato.

2. **Visual system v3** (VISL-01/02): director.js viene esteso per supportare il sistema v3 — arco visivo guidato da `macroState.arcPercent`, firme visive distinte per i 4 layer compositivi.

Non include: modifiche a render.js, field.js o colors.js (PROTECTED), nuovi effetti visivi non legati all'arco narrativo, regressioni sulla visual identity v2.

</domain>

<decisions>
## Implementation Decisions

### Director v3 API

- **D-01: macroState diretto come sorgente.** `director.js` importa `macroState` da `macro-composer.js` e determina internamente quale layer v3 sta dominando visivamente. Nessuna nuova API (`setActiveLayer()` o simile). Il layer dominante è quello con il valore più alto tra `rhythmicDensity`, `harmonicColor`, `melodicActivity`, `textureDepth` — con un lerp sui parametri render per evitare commutazioni brusche.

- **D-02: V3 overrides v2 in V3_MODE.** Con `CFG.V3_MODE` attivo, `ENGINE_PREFS` v2 è bypassato completamente. Il director usa `LAYER_PREFS` v3 (nuovo oggetto, analogo a `ENGINE_PREFS`). I v2 engine sono già disabilitati da `CFG.V3_MODE`, quindi nessun conflitto.

- **D-03: Un layer dominante per frame.** Il layer con il valore macroState più alto vince e applica la propria firma visiva. La transizione tra layer avviene via lerp sui parametri (`densityMul`, `dotSize`, `midiScale`, palette) — non commutazione brusca. Più semplice e stabile del multi-layer blend esplicito.

### Arco visivo (VISL-01)

- **D-04: `arcPercent` come driver primario.** `macroState.arcPercent` (0–1 su 45-60min) guida le transizioni di scena e palette. Coerente con l'arco musicale precomposto del MacroComposer. Sostituisce il trigger audio-reactive v2 per le decisioni macro.

- **D-05: Arc state machine v2 bypassata in V3_MODE.** Con V3_MODE attivo, la state machine v2 (`arc.state: SILENCE → BUILDING → ACTIVE → INTENSE → PEAK → RELEASE`) viene bypassata. `arcPercent` guida direttamente le transizioni visive. La logica audio-reactive v2 può restare nel codice ma non viene eseguita.

- **D-06: 5 atti narrativi visivi.** L'arco visivo v3 ha 5 stati che rispecchiano la struttura degli atti del sequencer:
  - **Atto I — Emergenza** (arcPercent 0.0–0.15): sparse, freddo, rado — campo quasi vuoto
  - **Atto II — Discesa** (arcPercent 0.15–0.35): densità crescente, palette verso neutro/caldo
  - **Atto III — Macchina** (arcPercent 0.35–0.60): denso, caldo, moto veloce — climax visivo
  - **Atto IV — Intensità** (arcPercent 0.60–0.80): denso ma con prime smagliature, tensione
  - **Atto V — Dissoluzione** (arcPercent 0.80–1.0): campo che si svuota, freddo che ritorna, dissolvenza

### Firme per layer (VISL-02)

- **D-07: Palette/colore come differenziatore primario.** La firma di ogni layer è riconoscibile principalmente dal colore dominante — identificabile dal palco senza guardare i dettagli tecnici. Gli altri parametri (densityMul, dotSize, midiScale, moto) rinforzano l'identità ma non sono il segnale primario.

- **D-08: Palette specifica — a discrezione di Claude.** Le palette esatte per ciascun layer (HarmonyLayer, RhythmLayer, MelodyTextureLayer, MacroComposer come "master") sono calibrate durante l'implementazione. Vincolo: devono essere chiaramente distinte tra loro e allineate alle palette già definite in `director.js` (`default`, `amber`, `warm`, `cold`, `steel`, `bw`, `cyan`, `magenta`).

- **D-09: Solo palette locked, resto Claude.** `densityMul`, `dotSize`, `midiScale`, `flickerSpeed`, `trailMax` per ciascun layer sono a discrezione di Claude durante implementazione. La calibrazione avviene tramite ascolto + osservazione visiva, non pre-spec.

### Test di integrazione (MARC-04)

- **D-10: Time-jump checkpoints a arcPercent forzato.** La verifica MARC-04 usa 5 checkpoint: `arcPercent` forzato a 0%, 25%, 50%, 75%, 90%. Per ciascun checkpoint: verificare che il MIDI output sia attivo (almeno un layer emette note), che l'arco visivo sia nel corretto stato narrativo, che non ci siano errori JS in console.

- **D-11: Segnali di collasso da monitorare.** I seguenti segnali definiscono "collasso compositivo" e devono NON verificarsi durante i checkpoint:
  1. **Silenzio MIDI totale**: nessun layer emette note per più di 30 secondi fuori dalla dissoluzione finale (arcPercent > 0.85)
  2. **Note out-of-range**: note MIDI fuori dai range per canale già definiti da RITM-04 (CH0 kick, CH1 modulare C2-C4, CH2 pads C3-C5, CH3 basso C1-C3, CH4 melodico C4-C7)
  3. **Collasso visivo**: campo fermo o non risponde al MIDI mentre i layer sono attivi
  4. **Monotonia armonica**: nessuna transizione modale dopo 10+ minuti nella sezione centrale (arcPercent 0.2–0.8)

### Claude's Discretion

- Palette esatta per ciascun layer (HarmonyLayer/RhythmLayer/MelodyTextureLayer) — calibrata durante implementazione
- `densityMul`, `dotSize`, `midiScale`, `flickerSpeed`, `trailMax` per `LAYER_PREFS` — calibrati durante implementazione
- Logica esatta di dominance tra layer (max semplice vs weighted con isteresi) — da verificare con ascolto
- Gestione del MacroComposer come "quinto layer" visivo (struttura narrativa) — decidere se ha propria firma o è background state

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisiti di fase
- `.planning/REQUIREMENTS.md` §MARC-04, VISL-01, VISL-02 — success criteria obbligatori
- `.planning/ROADMAP.md` §Phase 4 — success criteria verificabili (3 criteri)

### Codebase esistente — integrazione primaria
- `MACH:INE II/src/director.js` — target principale delle modifiche v3: ENGINE_PREFS, arc state machine, updateDirector(), engineRender object
- `MACH:INE II/src/macro-composer.js` — fonte di `macroState` (arcPercent, rhythmicDensity, harmonicColor, melodicActivity, textureDepth)
- `MACH:INE II/src/config.js` — CFG.V3_MODE + nuovo blocco CFG.VISUAL per parametri LAYER_PREFS
- `MACH:INE II/src/main.js` — routing V3_MODE nel render loop (updateDirector è già chiamato qui)

### Codebase esistente — reference architetturale (PROTECTED, non modificare)
- `MACH:INE II/src/render.js` — pipeline render principale — non modificare in Phase 4
- `MACH:INE II/src/field.js` — core pixel loop — non modificare in Phase 4
- `MACH:INE II/src/colors.js` — palette system — non modificare in Phase 4

### Layer implementati in fasi precedenti (reference per integration testing)
- `MACH:INE II/src/harmony-layer.js` — CH2/CH4, drone + accordi
- `MACH:INE II/src/rhythm-layer.js` — CH0/CH1/CH7, kick + hat + percussioni
- `MACH:INE II/src/melody-texture-layer.js` — CH3/CH5/CH6, bass + voice + lead
- `MACH:INE II/src/sequencer.js` — ACTS[] con time boundaries in secondi (Atto I: 0-480s, II: 480-1080s, III: 1080-1680s, IV: 1800-2520s, V: 2520-3000s)

### Contesti fasi precedenti (pattern da replicare o estendere)
- `.planning/phases/03-melodylayer-e-texturelayer/03-CONTEXT.md` — pattern di wiring in main.js (3 edit chirurgici)
- `.planning/phases/01-macrocomposer-e-harmonylayer/01-CONTEXT.md` — decisioni architetturali MacroComposer

</canonical_refs>

<code_context>
## Existing Code Insights

### Stato attuale di director.js rispetto a v3
- `director.js` usa `getEngine()` da `midi-patterns.js` — stringa come `"terreno"` o `"meccanica"`
- `ENGINE_PREFS` tabella hardcoded per i 7 engine v2 — nessun awareness di layer v3
- `arc.state` machine (SILENCE→BUILDING→...→RELEASE) è guidata da audio RMS + flux
- `getEnginePhase()` da `presence-multiplier.js` — non applicabile in v3 (phase naming diverso)
- **Blocker confermato da STATE.md**: "Director engine-identity resolution strategy non decisa"

### Struttura LAYER_PREFS da creare (analogo a ENGINE_PREFS)
```js
const LAYER_PREFS = {
  harmony: { /* palette, dotSize, densityMul, ... */ },
  rhythm:  { /* palette, dotSize, densityMul, ... */ },
  melody:  { /* palette, dotSize, densityMul, ... */ },
};
```
Il layer dominante viene determinato dal massimo tra le dimensioni di `macroState`.

### Pattern chirurgico da replicare (da Phase 2/3)
- `main.js`: 3 edit (import + init + update) — stessa struttura per director v3 se servono nuove init
- Config-first: tutti i valori numerici di LAYER_PREFS vanno in `CFG.VISUAL`
- No magic numbers nel codice, solo riferimenti a CFG

### Palette disponibili in colors.js (riferimento per LAYER_PREFS)
`default`, `amber`, `warm`, `cold`, `steel`, `bw`, `cyan`, `magenta`

</code_context>

<specifics>
## Specific Ideas

- **Blocker STATE.md risolto**: la strategia director-v3 è decisa — macroState diretto + LAYER_PREFS + V3_MODE gate
- **Coerenza arco**: `macroState.arcPercent` è il filo rosso che unisce compositivo e visivo — la stessa curva precomposta governa MIDI e visual
- **5 atti visuali**: la struttura in atti del sequencer v2 sopravvive visivamente in v3, anche se il controllo passa da wall-clock a arcPercent
- **Performance live**: la firma per layer deve essere percettibile dal palco — il performer e l'audience devono intuire "adesso domina il ritmo" o "adesso domina l'armonia" anche senza guardare un monitor MIDI

</specifics>

<deferred>
## Deferred Ideas

- CC automation visuale (modulare CC1/CC11 via colore o moto) — post-milestone
- Multi-layer blend esplicito (weighted average di LAYER_PREFS) — solo se "un dominante per frame" risulta troppo brusco; valutare dopo ascolto
- Run completa 60 minuti come test — deferred a sessione dedicata con performer; i time-jump checkpoints sono il criterio di acceptance per questa fase
- Inversion/dissolve narrativi specifici per layer — la logica v2 (one inversion per engine) potrebbe essere estesa per layer v3 in futuro

</deferred>

---

*Phase: 04-integrazione-e-visual-system*
*Context gathered: 2026-03-27*
