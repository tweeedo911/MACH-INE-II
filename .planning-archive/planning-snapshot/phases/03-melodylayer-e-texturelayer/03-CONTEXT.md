# Phase 3: MelodyLayer e TextureLayer - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Costruire `melody-texture-layer.js` — un unico modulo che gestisce le voci melodiche e testurali del sistema v3: CH3 (bassline melodica), CH5 (voce melodica con memoria motivica), CH6 (voce indipendente). Governato da `macroState.melodicActivity` e `macroState.textureDepth`.

Include: seed motivico con ritorno per trasposizione (MELO-01), loop a lunghezze prime su CH3/CH5/CH6 (MELO-02). Non include: drone root (MELO-03 coperto da HarmonyLayer su CH2, Phase 1), visual system (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Architettura Modulo

- **D-01:** Un unico file `melody-texture-layer.js` gestisce CH3, CH5, CH6 — analogamente a `rhythm-layer.js` che gestisce CH0/CH1/CH7. Un solo `import` e una sola call `updateMelodyTextureLayer(dt)` da aggiungere al routing V3_MODE in `main.js`.

### Estetica Sonora

- **D-02:** **CH5 (VOICE) — gocce melodiche sparse**: frasi brevi di 2–4 note, sparse, con pause lunghe tra una frase e l'altra. Spazio che respira. Lo stesso approccio di v2 `composer.js` (CH5 con frasi Markov ogni 2–4 bar). Tendenza al minimalismo.

- **D-03:** **CH6 (LEAD) — voce indipendente**: CH6 *non* è un canone di CH5 (diverso da v2). Genera la propria melodia indipendente, guidata da `melodicActivity` ma con pattern distinti. Permette stratificazione melodica senza ripetizione meccanica.

- **D-04:** **CH3 (BASS) — bassline melodica**: sequenze di basso su root/quinta/quarta con melodia implicita (range C1–C3, come MIDI-02). Non pattern puramente ritmici — il basso ha narrativa propria, come in v2 `BASS_SEQS[]`.

- **D-05:** **Arpeggi incrociati lenti per stratificazione**: in alcune sezioni (in particolare la transizione verso il climax, ~20–35min) CH5 e CH6 eseguono arpeggi incrociati con lente variazioni — costruendo strati senza affollamento. Il meccanismo specifico (quale nota inizia l'arpeggio di quale voce) è a discrezione di Claude durante implementazione.

- **D-06:** **Fraseggio per sezione, tendenza al minimalismo**: ogni fase dell'arco (`melodicActivity`) ha un fraseggio diverso — frasi rarissime in apertura, più dense al climax, di nuovo sparse nella dissoluzione. Il default è meno note, non più.

### Memoria Motivica (MELO-01)

- **D-07:** **Seed esplicito**: nella finestra 0–5min, CH5 genera un motivo di 3–4 note e lo memorizza in una variabile interna (`_seedMotif`). Il seed è generato dalla Markov chain ma fissato dopo la prima frase completa.

- **D-08:** **Ritorno via trasposizione**: quando `macroState.arcPercent > 0.75` (~min45 su 60min), il seed viene richiamato su CH5 trasportato alla radice del modo attivo. La sequenza di intervalli è preservata, solo la root cambia. Una singola occorrenza di ritorno — non multipla.

- **D-09:** Il seed non viene richiamato durante la sezione centrale del pezzo (arcPercent 0.1–0.75) — mantiene l'effetto sorpresa del ritorno finale.

### Loop Texture a Lunghezze Prime (MELO-02)

- **D-10:** Tre loop indipendenti con lunghezze prime: CH3 = **7 step**, CH5 = **11 step**, CH6 = **13 step**. Non si allineano mai in 1001 step (LCM = 1001) — poliritmo perpetuo deterministico, zero randomness (Eno).

- **D-11:** I loop definiscono il *ritmo* delle frasi, non le note. CH5 sceglie le note via Markov/seed, ma emette una nota ogni N step dove N è il passo del loop attivo. La separazione ritmo/altezza permette variazione melodica dentro struttura ritmica fissa.

### Drone Root (MELO-03)

- **D-12:** MELO-03 è coperto da **HarmonyLayer (Phase 1) su CH2**. Phase 3 non aggiunge drone separato. Durante le fasi arhitmiche (0–10min) e di dissoluzione (40–60min), CH3/CH5/CH6 si radano progressivamente — il drone root su CH2 rimane come unica ancora armonica.

### Claude's Discretion

- Valori esatti degli intervalli del seed iniziale — generati proceduralmente all'avvio della sessione, non hardcodati
- Note specifiche dei loop arpeggiati in CH5/CH6 durante la stratificazione (~20–35min)
- Threshold esatte di `melodicActivity` per transizioni tra fraseggio rado/denso/scomparsa
- Implementazione interna della voce indipendente CH6 (Markov chain separata? Pattern fissi? Da calibrare con ascolto)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisiti di fase
- `.planning/REQUIREMENTS.md` §MELO-01, MELO-02, MELO-03 — memoria motivica, loop a lunghezze prime, drone root

### Codebase esistente — integrazione obbligatoria
- `MACH:INE II/src/macro-composer.js` — `macroState.melodicActivity` (0–1), `macroState.textureDepth` (0–1), `macroState.arcPercent` (0–1) — feed primario per il MelodyTextureLayer
- `MACH:INE II/src/midi.js` — `sendMIDINote(ch, note, vel, dur)` — API unica per tutti gli output MIDI
- `MACH:INE II/src/config.js` — CFG object; tutti i parametri v3 di Phase 3 vanno in `CFG.MELODY`
- `MACH:INE II/src/main.js` — routing V3_MODE nel `midiWorker.onmessage`; aggiungere `updateMelodyTextureLayer(dt)` qui

### Codebase esistente — reference architetturale
- `MACH:INE II/src/composer.js` — pattern Markov voice (`motifIntervals`, `markovHistory`), `BASS_SEQS[]`, CH5 phrase generation, CH6 canon — source di ispirazione diretta per Phase 3 (ma v3 non importa da v2)
- `MACH:INE II/src/rhythm-layer.js` — template architetturale da seguire: struttura modulo, sub-loop interni, gating via macroState
- `.planning/phases/02-rhythmlayer-e-midi-output/02-CONTEXT.md` — pattern MIDI-01/02/03/04 già implementati nel RhythmLayer; verificare se estrarre utilità condivise per Phase 3

### Pianificazione
- `.planning/ROADMAP.md` §Phase 3 — success criteria ufficiali (3 criteri verificabili)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Markov voice pattern** in `composer.js`: `motifIntervals[]`, `markovHistory[null, null]`, weighted random selection — replicare la struttura per CH5 seed generation
- **`BASS_SEQS[]`** in `composer.js`: 4 sequenze di basso (root/quinto/dub) — reference strutturale per CH3 loop
- **`sendMIDINote(ch, note, vel, dur)`** in `midi.js` — wrappare con PM check e umanizzazione come già fatto in tutti i layer
- **Step loop pattern** in `rhythm-layer.js`: `clock += dt * stepsPerSec; const step = Math.floor(clock) % loopLen` — replicare per i tre loop a lunghezze prime

### Established Patterns
- Config-first: tutti i pattern, threshold e velocity target in `CFG.MELODY` — zero magic numbers nel codice
- Gating con `if (pm < 0.05) return` prima di ogni sendMIDINote — replicare per MelodyTextureLayer
- Commenti in italiano per intenzione musicale, codice e variabili in inglese
- EMA smoothing disponibile per transizioni fluide di `melodicActivity`

### Integration Points
- `main.js` `midiWorker.onmessage` — aggiungere `updateMelodyTextureLayer(dt)` accanto agli altri update v3
- CH3/CH5/CH6 liberi da collisioni con v2 durante V3_MODE (i composer v2 usano gli stessi canali ma sono bypassati quando V3_MODE è attivo)

</code_context>

<specifics>
## Specific Ideas

- **Minimalismo come default**: meno note, non più — ogni nota è una scelta compositiva. La tendenza al silenzio è il punto di partenza, non il fallback.
- **Arpeggi incrociati**: CH5 e CH6 si intrecciano in certi momenti costruendo strati — non rumore ma texture costruita. Da calibrare durante ascolto.
- **Loop come struttura invisibile**: i loop a 7/11/13 step non devono essere percepiti come loop — la variazione melodica sovrapposta li maschera. Il poliritmo emerge come respiro, non come meccanismo.
- **Seed motivico come filo narrativo**: il ritorno a ~min45 è la "memoria" del pezzo — l'unico momento dove passato e presente si sovrappongono esplicitamente.

</specifics>

<deferred>
## Deferred Ideas

- CC automation per voci melodiche (CC1 mod wheel, CC11 expression) — appartiene a Phase 4 o post-milestone
- DIFF-01 (harmonic memory store completo) — la D-07/D-08 implementano una versione minimale del seed; il memory store completo rimane deferred
- Inversione e augmentation come trasformazioni del seed — solo trasposizione in questa fase; le altre trasformazioni valutabili in post-milestone
- Multipli ritorni motivici nella sezione finale — solo un ritorno automatico a arcPercent > 0.75; versione più elaborata deferred

</deferred>

---

*Phase: 03-melodylayer-e-texturelayer*
*Context gathered: 2026-03-27*
