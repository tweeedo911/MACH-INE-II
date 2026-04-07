# Phase 1: MacroComposer e HarmonyLayer - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Costruire le fondamenta compositive del sistema v3: un MacroComposer che governa un arco narrativo 4D precomposto su 45-60 minuti, e un HarmonyLayer che emette MIDI armonicamente coerente su CH2/CH4. Il visual system (field.js, render.js, director.js) rimane INVARIATO in questa fase.

Questa fase non include: layer ritmico (Fase 2), layer melodico/texture (Fase 3), integrazione visual con v3 (Fase 4).

</domain>

<decisions>
## Implementation Decisions

### Arc 4D — Struttura temporale

- **D-01:** La timeline macroscopica è **fissa e precomposta**: array di checkpoint in config (percentuale del concerto → valori 4D target per `rhythmicDensity`, `harmonicColor`, `melodicActivity`, `textureDepth`). Il MacroComposer interpola tra checkpoint con easing curvo (non lineare).
- **D-02:** Dentro ogni segmento tra checkpoint, i valori oscillano **±5-10% attorno al target** con EMA smoothing — variazione microgenerativa che evita l'effetto plateau. Il macro è prevedibile (picchi arrivano quando devono), il micro respira.
- **D-03:** I picchi delle 4 dimensioni sono staggered come da MARC-02: `harmonicColor` ~min28, `density` ~min33, `rhythmicDensity` ~min38 — mai simultanei.
- **D-04:** MARC-03 (false-resolution ~min35): checkpoint esplicito nell'array che porta `rhythmicDensity` a 0 per 8 bar, poi rientra a valore superiore al precedente.

### Integrazione V3_MODE

- **D-05:** MacroComposer e HarmonyLayer sono **moduli aggiuntivi** (`src/macro-composer.js`, `src/harmony-layer.js`). Non sostituiscono nulla — si aggiungono.
- **D-06:** In `main.js`, nel blocco `midiWorker.onmessage`, il routing è condizionato da `CFG.V3_MODE`: quando `false` chiama `updateComposerN()` come prima; quando `true` chiama `updateMacroComposer()` + `updateHarmonyLayer()`.
- **D-07:** Il `sequencer.js` esistente sopravvive invariato per la struttura degli atti — il MacroComposer lo legge per ricavare `elapsedTime` / `arcProgress`. Non lo rimpiazza.
- **D-08:** I `composer*.js` rimangono intatti. Usabili come reference sonora e come fallback immediato (flip `V3_MODE: false`).
- **D-09:** `presence-multiplier.js` non viene toccato in questa fase — HarmonyLayer gestisce il proprio gating interno basato su `harmonicColor` dal MacroComposer.

### Transizioni modali

- **D-10:** La sequenza modale è quella definita in ROADMAP: **A Lydian → Bb Phrygian → D Dorian → C# Dorian → E Phrygian → A Lydian**.
- **D-11:** Al cambio di modo, c'è una **finestra pivot di 1 bar**: il voicing converge cromaticamente verso la nota condivisa tra i due modi prima di espandersi nel nuovo modo. Voice leading ≤3 semitoni (HARM-04) si soddisfa naturalmente in questo modello.
- **D-12:** Le transizioni modali sono time-based (determinate dalla percentuale d'arco nel MacroComposer), non event-based.

### Voicings CH2/CH4

- **D-13:** Per ogni modo definito, sono autorizzati manualmente **3-4 "anchor" voicings** — i voicings strutturali per apertura, pivot, e picco del segmento. Scritti esplicitamente in config come array di { note, velocity }.
- **D-14:** Tra gli anchors il HarmonyLayer **genera algoritmicamente** rispettando: root/quinta in CH3 (basso), upper structure un nono sopra in CH2 (pads, HARM-03), voice leading ≤3 semitoni (HARM-04), pentatonica + 10-15% nota cromatica con risoluzione verso il basso (HARM-05).
- **D-15:** Il drone root (A o D) è sempre presente su CH2 come anchor armonico condiviso tra tutti i layer — HARM-01 soddisfatto strutturalmente.
- **D-16:** Il modal interchange (HARM-02) avviene tramite i checkpoint dell'arco — il modo cambia il carattere emotivo senza spostare il root anchor.

### Claude's Discretion

- Scelta dei valori numerici esatti per gli anchor voicings (note MIDI, velocity) — da determinare durante implementazione con ascolto.
- Curva di easing per l'interpolazione tra checkpoint 4D (cubic, smooth-step, o custom).
- Frequenza di aggiornamento del HarmonyLayer (ogni N battute vs ogni bar vs ogni tick).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisiti di fase
- `.planning/REQUIREMENTS.md` §MARC-01, MARC-02, MARC-03 — arco narrativo 4D, picchi staggered, false-resolution
- `.planning/REQUIREMENTS.md` §HARM-01 through HARM-05 — root anchor, modal interchange, upper-structure voicing, voice leading, pentatonica

### Codebase esistente — integrazione obbligatoria
- `MACH:INE II/src/config.js` — CFG object con V3_MODE e bpmLerpBeats; tutti i nuovi parametri v3 vanno qui
- `MACH:INE II/src/main.js` — midiWorker.onmessage: qui va il routing V3_MODE; leggere la struttura esistente prima di modificare
- `MACH:INE II/src/sequencer.js` — fonte di `elapsedTime`/`arcProgress` che il MacroComposer deve consumare
- `MACH:INE II/src/midi.js` — `sendMIDINote(ch, note, vel, dur)` — API unica da usare per tutti gli output MIDI

### Codebase esistente — reference architetturale
- `MACH:INE II/src/composer.js` (o composer2.js) — pattern architetturale da seguire: `initComposerN()`, `updateComposerN(dt)`, `toggleComposerN()`, `composerNActive`
- `MACH:INE II/src/presence-multiplier.js` — gating per-engine, non va toccato in Phase 1

### Pianificazione
- `.planning/ROADMAP.md` §Phase 1 — success criteria ufficiali (MIDI monitor checks)
- `.planning/phases/00-infrastruttura-e-migrazione/` — SUMMARY files — decisioni tecniche Phase 0 già attuate

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sendMIDINote(ch, note, vel, dur)` in `midi.js` — API MIDI già disponibile, usare senza modifiche
- Pattern `updateComposerN(dt)` in tutti i `composer*.js` — struttura identica da replicare per MacroComposer e HarmonyLayer
- `CFG` object in `config.js` — punto centralizzato per tutti i parametri v3 (anchors, checkpoint array, modalSequence)
- `sequencer.js` exports `elapsedTime` / `arcProgress` — disponibili per consumption

### Established Patterns
- Config-first: tutti i valori numerici in CFG, nessun magic number nel codice
- EMA smoothing: pattern usato ovunque (audio.js, state.js) — replicare per i valori 4D
- Gating con `if (pm < 0.05) return` prima di ogni sendMIDINote — replicare per HarmonyLayer
- Commenti in italiano per intenzione musicale, codice e variabili in inglese

### Integration Points
- `main.js` linea `midiWorker.onmessage` — punto di branching V3_MODE per routing ai nuovi moduli
- `index.html` `<script type="module">` — nessun bundler, import diretto dei nuovi file ES module
- Il `sequencer.js` non va modificato — solo letto dai nuovi moduli

</code_context>

<specifics>
## Specific Ideas

- Modello Philip Glass: struttura rigida dell'arco, esecuzione che respira grazie alla variazione microgenerativa
- Pivot chord tra modi: convergere verso la nota condivisa tra i due modi, non fade generico
- L'arco 4D come "score" precomposto + interpretazione generativa = predicibilità live + varietà musicale

</specifics>

<deferred>
## Deferred Ideas

- Director engine-identity resolution per layer multipli simultanei — appartiene a Phase 4
- CC automation (CC7/CC11/CC74) per macro dinamiche — appartiene a Phase 2 (v2 requirements CC-01/CC-02)
- HUD performer con warning next-cue — appartiene a Phase 4 (DIFF-02)
- Arc position indicator visivo — appartiene a Phase 4 (DIFF-03)
- Harmonic memory store (DIFF-01) — da valutare in Phase 3

</deferred>

---

*Phase: 01-macrocomposer-e-harmonylayer*
*Context gathered: 2026-03-27*
