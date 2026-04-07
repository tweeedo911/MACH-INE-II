# Phase 2: RhythmLayer e MIDI Output - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Costruire `rhythm-layer.js` — il layer ritmico completo del sistema v3. Tre sub-loop interni (CH0 kick, CH1 hi-hat, CH7 percussion) governati da `macroState.rhythmicDensity` con un arco estetico preciso in 5 fasi. Include le ottimizzazioni MIDI output (MIDI-01–04) applicate internamente al layer.

Non incluso: layer melodico/texture (Fase 3), integrazione visual sincronizzata all'arco (Fase 4), CC automation avanzata (v2 requirements, rimandata).

</domain>

<decisions>
## Implementation Decisions

### Arco Estetico — 5 Fasi

- **D-01:** L'arco ritmico ha riferimenti estetici precisi per ogni fase:
  - **0–10min** (arhitmico): ambient, minimal — Boards of Canada. Nessuna cassa, solo texture percussiva sparsa su CH1/CH7.
  - **10–20min** (pulse emergente): broken/frammentato ma non casuale — Autechre, Four Tet. Kick irregolare, non-4/4, groove implicito ma mai esplicito.
  - **20–30min** (groove emergente): il ritmo comincia a cristallizzarsi ma non è ancora diretto — transizione percepita verso la solidità.
  - **30–40min** (climax poliritmica): cassa dritta alla Floating Points, poliritmia piena con tutti i layer attivi.
  - **40–60min** (dissoluzione): il groove si frammenta di nuovo, torna alla texture, dissolve.

- **D-02:** La 4-on-the-floor arriva solo alla fase climax (30–40min). Prima di quel punto la cassa su CH0 è intenzionalmente irregolare/frammentata. È un punto di arrivo narrativo, non un default.

### CH0 — Kick (PULSE)

- **D-03:** Kick assente (gating totale) nella fase ambient 0–10min. Appare sporadico e frammentato nella fase 10–20min. Si consolida progressivamente verso il climax. Segue `rhythmicDensity` da `macroState` come driver primario di densità.

### CH1 — Hi-Hat (GRAIN)

- **D-04:** Hi-hat con **pitch variation per hit** — ogni colpo usa una nota MIDI leggermente diversa (es. cluster di 3–4 pitch ruotati o randomizzati in un range stretto). Non accordi simultanei, non mono-nota fissa. Stile glitch-adjacent ma controllato — BOC/Four Tet, non Arca.
- **D-05:** Velocity scatter: ogni hit ha velocity variata intorno a un target di fase (non flat, non completamente random — distribuzione gaussiana stretta).
- **D-06:** **Il hi-hat non si interrompe mai** (RITM-01). Il suo gating è separato dalla cassa: ha un velocity floor indipendente da `rhythmicDensity`. Nella fase ambient è rarefatto ma presente — un respiro percussivo che non si azzera mai.

### CH7 — Layer Percussivo (riassegnato da RUPTURE)

- **D-07:** CH7 è riassegnato da layer di eventi caotici a layer percussivo strutturato con due ruoli distinti: percussioni ongoing (groove) + eventi speciali cue-triggered.
- **D-08:** Mappatura note CH7:

  | MIDI | Nota | Ruolo |
  |------|------|-------|
  | 36   | C2   | Rimshot / snare leggero |
  | 38   | D2   | Snare pieno / clap |
  | 45   | A2   | Conga alta / tom leggero |
  | 48   | C3   | Conga bassa / tonal perc |
  | 60   | C4   | **Evento speciale 1** — impact / crash |
  | 62   | D4   | **Evento speciale 2** — sweep / noise burst |

- **D-09:** Le note 36/38/45/48 alimentano il groove percussivo ongoing. Le note 60/62 vengono triggerate esclusivamente dai cue del MacroComposer (false-resolution ~min35, climax, dissoluzione) — non entrano nei pattern ritmici normali.

### Additive Rhythm — Glass (RITM-03)

- **D-10:** Le percussioni CH7 entrano in sequenza additiva nella fase di build (10–30min): prima conga bassa (C3), poi conga alta (A2), poi rimshot/snare (C2/D2). Ogni elemento viene aggiunto quando la `rhythmicDensity` supera una threshold. Un elemento alla volta — mai una batteria completa che appare tutta insieme.

### Reich Phasing Organico (RITM-04)

- **D-11:** Il phasing è **organico, non meccanico**. Implementato come due sub-pattern su CH1 (hi-hat) di lunghezze diverse: **8 step** e **9 step**. Convergono ogni 72 step (≈8–10 secondi a BPM moderato) — il drift è lento e quasi impercettibile come tensione ritmica naturale, non come effetto esplicito.
- **D-12:** Il phasing è attivo dalla fase "broken" in poi (10–40min). Nella fase ambient e nella dissoluzione i pattern sono singoli (no phasing).

### MIDI Output Ottimizzazioni (MIDI-01–04)

- **D-13:** Le ottimizzazioni sono implementate internamente al `rhythm-layer.js`, non in un wrapper condiviso. Nella Fase 3 si valuterà se estrarre utilità condivise quando gli altri layer ne avranno bisogno.
  - **MIDI-01** (velocity humanization): downbeat leggermente più forte degli offbeat — variazione ±5–10% correlata alla posizione nel pattern
  - **MIDI-02** (pitch range enforcement): CH1 modulare C2–C4, CH0 e CH7 range libero ma centrato sui valori di mappatura sopra
  - **MIDI-03** (phrase shaping): legato/staccato ratio configurabile per voce in CFG; note di accordo sfasate di 5–30ms per evitare attacchi meccanici simultanei
  - **MIDI-04** (channel routing): CH0=modulare kick, CH1=modulare hat/texture, CH7=percussioni hardware/VST

### Claude's Discretion

- Valori esatti delle note MIDI per il pitch-rotation del hi-hat su CH1 (cluster di 3–4 pitch, range da decidere durante implementazione con ascolto)
- Threshold specifiche di `rhythmicDensity` per ogni transizione di fase (es. kick appare a 0.25, conga bassa a 0.30, ecc.) — da calibrare per feel musicale
- Curva di probability gate per kick nella fase broken (non lineare — probabilmente exponential)
- Valori velocity floor per il hi-hat nella fase ambient (abbastanza basso da non dominare, abbastanza alto da essere percepito)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisiti di fase
- `.planning/REQUIREMENTS.md` §RITM-01, RITM-02, RITM-03, RITM-04 — arco ritmico, hi-hat continuity, Glass additive, Reich phasing
- `.planning/REQUIREMENTS.md` §MIDI-01, MIDI-02, MIDI-03, MIDI-04 — velocity humanization, range enforcement, phrase shaping, channel routing

### Codebase esistente — integrazione obbligatoria
- `MACH:INE II/src/macro-composer.js` — `macroState.rhythmicDensity` (0–1), `macroState.barClock`, `macroState.arcPercent` — feed primario per il RhythmLayer
- `MACH:INE II/src/midi.js` — `sendMIDINote(ch, note, vel, dur)` — API unica per tutti gli output MIDI
- `MACH:INE II/src/config.js` — CFG object; tutti i parametri v3 del RhythmLayer vanno qui (CFG.RHYTHM)
- `MACH:INE II/src/main.js` — routing V3_MODE nel `midiWorker.onmessage`; aggiungere `updateRhythmLayer(dt)` qui

### Codebase esistente — reference architetturale
- `MACH:INE II/src/composer.js` — pattern step sequencer 16th-note (`onStep(step)`, `clock += dt * stepsPerSec`, `KICK_PATS[]`) — template da seguire per il loop ritmico
- `.planning/phases/01-macrocomposer-e-harmonylayer/01-CONTEXT.md` — decisioni architetturali Phase 1 (V3_MODE routing, pattern modulare, config-first)

### Pianificazione
- `.planning/ROADMAP.md` §Phase 2 — success criteria ufficiali (5 criteri verificabili su MIDI monitor)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Step sequencer pattern** in `composer.js`: `clock += dt * stepsPerSec; const step = Math.floor(clock);` — replicare intatto per RhythmLayer, nessuna reimplementazione necessaria
- **KICK_PATS[]** e **HAT patterns** in `composer.js` — reference sonora e strutturale per i pattern di base; non importati direttamente ma usati come modello
- **`sendMIDINote(ch, note, vel, dur)`** in `midi.js` — wrappare con PM check e humanization come in tutti gli altri layer
- **`macroState`** in `macro-composer.js` — già esportato, già consumabile; `rhythmicDensity` aggiornato ogni frame

### Established Patterns
- Config-first: tutti i pattern, threshold e velocity target in `CFG.RHYTHM` — zero magic numbers nel codice
- Gating con `if (pm < 0.05) return` prima di ogni sendMIDINote — replicare per RhythmLayer
- EMA smoothing disponibile nel codebase come pattern — usabile per smussare transizioni di density
- Commenti in italiano per intenzione musicale, codice e variabili in inglese

### Integration Points
- `main.js` `midiWorker.onmessage` — aggiungere `updateRhythmLayer(dt)` accanto a `updateMacroComposer()` e `updateHarmonyLayer()`
- CH7 era RUPTURE nei composer v2 — il layer percussivo v3 lo sovrascrive; assicurarsi che il routing V3_MODE eviti collisioni

</code_context>

<specifics>
## Specific Ideas

- **Riferimenti musicali per fase**: BOC (0–10min) → Autechre/Four Tet (10–20min) → Floating Points (30–40min) — questi sono i benchmark sonori per il calibration durante implementazione
- **Phasing come tensione latente**: il drift 8/9 step non deve essere udibile come "effetto phasing" ma come vitalità ritmica — il groove respira senza essere meccanico
- **Additive Glass**: ogni elemento percussivo entra come decisione compositiva, non come random event — la progressione deve sembrare inevitabile in retrospettiva

</specifics>

<deferred>
## Deferred Ideas

- CC automation per macro dinamiche (CC7 volume, CC11 expression, CC74 filter cutoff) — v2 requirements CC-01/CC-02/CC-04, rimandate a Fase 4 o post-milestone
- MIDI Program Change pre-transizione atto (CC-03) — rimandata a Fase 4
- Wrapper MIDI condiviso tra tutti i layer v3 — da valutare in Fase 3 quando MelodyLayer e TextureLayer avranno output MIDI propri
- Harmonic memory store (DIFF-01) — rimandata a Fase 3

</deferred>

---

*Phase: 02-rhythmlayer-e-midi-output*
*Context gathered: 2026-03-27*
