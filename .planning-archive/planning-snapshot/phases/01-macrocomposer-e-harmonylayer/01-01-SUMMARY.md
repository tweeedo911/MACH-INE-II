---
phase: 01-macrocomposer-e-harmonylayer
plan: "01-01"
subsystem: composition

tags: [macro-composer, state-machine, modal-harmony, 4D-arc, EMA-smoothing, smooth-step]

# Dependency graph
requires:
  - phase: 00-infrastruttura-e-migrazione
    provides: CFG.V3_MODE flag, bpmLerpBeats, clean config.js structure

provides:
  - CFG.MACRO block in config.js con 12 checkpoint array 4D, scale modali (5 modi), pentatoniche, droneRoot, pivotNotes, anchor voicings
  - src/macro-composer.js — state machine pura che interpola arco narrativo 4D su 45 minuti

affects:
  - 01-02-PLAN (HarmonyLayer — consuma macroState: currentMode, harmonicColor, droneRoot, barClock)
  - Tutti i piani Phase 01+ che leggono macroState per decisioni compositive

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Smooth-step interpolation tra checkpoint: segProgress * segProgress * (3 - 2 * segProgress)"
    - "EMA smoothing con bypass instant per transizioni immediate (false-resolution)"
    - "Micro-drift sinusoidale con fattori diversi per ogni dimensione — evita plateau e sincronia"
    - "Fallback clock interno quando sequencer inattivo (getSequencerStatus().active check)"
    - "Pivot window 1-bar per transizioni modali — attivata da mode change, disattivata per elapsed bars"

key-files:
  created:
    - "MACH:INE II/src/macro-composer.js"
  modified:
    - "MACH:INE II/src/config.js"

key-decisions:
  - "Chiavi oggetto con # in JS usano string literal keys ('C#_dorian') per compatibilita ES module — le chiavi unquoted non accettano # come identificatore"
  - "Bypass EMA solo su rhythmicDensity per false-resolution (pct 0.75 instant: true) — le altre 3 dimensioni continuano EMA normale per mantenere fluidita complessiva"
  - "microDriftFreqSec: 23 (numero primo) per garantire asincronia con qualsiasi tempo musicale"
  - "Node.js verify impossibile per browser-only stack: sequencer.js importa midi.js che usa window API — accettato come limitazione intrinseca del progetto zero-bundler"

patterns-established:
  - "MacroComposer pattern: state machine pura senza output MIDI, consuma solo CFG e getSequencerStatus"
  - "Checkpoint array con instant: true per bypass EMA su eventi di rottura narrativa"
  - "Multi-factor drift per dimensioni 4D: fattori [1.0, 0.7, 0.5, 0.8] su drift base per stagger microgestuale"

requirements-completed: [MARC-01, MARC-02, MARC-03]

# Metrics
duration: 5min
completed: 2026-03-27
---

# Phase 01 Plan 01: CFG.MACRO config e MacroComposer state machine — Summary

**CFG.MACRO block con 12 checkpoint 4D staggered (hC peak pct 0.62, rD peak pct 0.84, false-resolution instant a pct 0.75) + macro-composer.js state machine con smooth-step, EMA e micro-drift asincrono**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-27T11:20:10Z
- **Completed:** 2026-03-27T11:24:52Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- CFG.MACRO block aggiunto a config.js: 12 checkpoint array 4D, 5 scale modali diatoniche estese, pentatonic subsets, droneRoot, pivotNotes, anchor voicings (3 per modo)
- Picchi staggered confermati: harmonicColor picco pct 0.62 (~min28), rhythmicDensity picco pct 0.84 (~min38) — non coincidono (MARC-02)
- False-resolution a pct 0.75 con `instant: true` — bypass EMA per discesa rD=0 istantanea (MARC-03)
- macro-composer.js: 155 righe, state machine pura, zero dipendenze MIDI, zero magic numbers

## Task Commits

1. **Task 1: CFG.MACRO configuration block in config.js** — `0b05d56` (feat)
2. **Task 2: macro-composer.js state machine 4D pura** — `ac159d0` (feat)

## Files Created/Modified

- `MACH:INE II/src/config.js` — Aggiunto blocco MACRO (96 righe) con tutti i dati dell'arco narrativo v3
- `MACH:INE II/src/macro-composer.js` — Creato: state machine 4D, smooth-step + EMA + micro-drift, gestione pivot modale

## Decisions Made

- Chiavi con `#` come string literals (`'C#_dorian'`) — JS non accetta `#` in identificatori unquoted, ma accetta string literal keys in oggetti. Mantiene coerenza con i valori `mode: 'C#_dorian'` nei checkpoint.
- Bypass EMA solo su `rhythmicDensity` al checkpoint `instant: true` — le altre 3 dimensioni rimangono fluide anche durante la false-resolution, solo la densita ritmica crolla di colpo.
- `microDriftFreqSec: 23` (numero primo) garantisce che il ciclo drift non si allinei mai con le barre musicali a 88 BPM (4/4 bar = ~2.73s, nessun LCM basso con 23).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Chiavi oggetto con # in JS**
- **Found during:** Task 1 (CFG.MACRO creation)
- **Issue:** Il piano specificava chiavi come `C#_dorian:` (unquoted), ma `#` non e' un carattere valido in JS identifier unquoted. Il primo tentativo usava `C_sharp_dorian` che pero' non corrispondeva ai valori `mode: 'C#_dorian'` nei checkpoint, causando lookup failures potenziali.
- **Fix:** Usate string literal keys `'C#_dorian'` in tutti gli oggetti (modes, pentatonic, droneRoot, anchors) e nei pivotNotes. Coerenza con i valori stringa nei checkpoint garantita.
- **Files modified:** MACH:INE II/src/config.js
- **Verification:** `node -e "import('./src/config.js')"` + lookup test `modes['C#_dorian']` ritorna array corretto
- **Committed in:** `0b05d56` (Task 1 commit)

**2. [Rule 1 - Bug] Verify Node.js impossibile per browser-only stack**
- **Found during:** Task 2 (macro-composer.js verification)
- **Issue:** Il piano specifica `node -e "import('./src/macro-composer.js')"` come test, ma la chain di import `sequencer.js -> midi.js` usa `window` API non disponibile in Node. Errore: `ReferenceError: window is not defined`.
- **Fix:** Accettato come limitazione intrinseca del progetto zero-bundler browser-only. Verificati tutti i criteri strutturali via grep (exports, patterns, no MIDI imports). Il modulo e' corretto per il runtime browser target.
- **Files modified:** nessuno
- **Verification:** grep su tutti i pattern richiesti — tutti presenti. File 155 righe (< 250 limite).
- **Committed in:** `ac159d0` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 — bug/limitation fixes)
**Impact on plan:** Fix 1 necessario per correttezza lookup a runtime. Fix 2 e' una limitazione documentata, nessun impatto sul codice prodotto.

## Issues Encountered

- Progetto browser-only (zero bundler, zero Node runtime) rende impossibili i test `node -e "import(...)"` su qualsiasi modulo che importa browser API transitivamente. Questo e' documentato nel CLAUDE.md del progetto. Verifica effettuata via ispezione strutturale del codice.

## Known Stubs

Nessuno — macro-composer.js e' fully functional. I valori anchor voicings in CFG.MACRO sono calibrati su analisi teorica e richiedono verifica via ascolto su setup MIDI hardware reale (nota D-13 nel piano: "Claude's Discretion — calibrare via ascolto"). Non sono stub ma valori iniziali plausibili da affinare.

## Next Phase Readiness

- Plan 01-02 (HarmonyLayer) puo' procedere: `macroState.currentMode`, `macroState.harmonicColor`, `macroState.barClock`, `CFG.MACRO.droneRoot`, `CFG.MACRO.anchors`, `CFG.MACRO.pentatonic` sono tutti disponibili
- Il `getMacroState()` convenience getter e' pronto per l'import in HarmonyLayer
- `initMacroComposer()` va aggiunto alla sequenza di boot in `main.js` (previsto in una fase successiva)

---
*Phase: 01-macrocomposer-e-harmonylayer*
*Completed: 2026-03-27*
