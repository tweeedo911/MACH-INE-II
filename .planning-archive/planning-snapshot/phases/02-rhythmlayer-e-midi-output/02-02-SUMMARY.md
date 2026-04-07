---
phase: 02-rhythmlayer-e-midi-output
plan: 02
subsystem: composition
tags: [midi, rhythm, step-sequencer, reich-phasing, glass-additive, humanization]

# Dependency graph
requires:
  - phase: 02-01
    provides: CFG.RHYTHM configuration block in config.js
  - phase: 01-01
    provides: macroState (rhythmicDensity, arcPercent, barClock) from macro-composer.js
  - phase: 01-02
    provides: V3_MODE routing in main.js, sendMIDINote API in midi.js
provides:
  - RhythmLayer v3 — arco ritmico completo su CH0/CH1/CH7
  - initRhythmLayer() / updateRhythmLayer(dt) — exports pubblici per main.js
  - Step sequencer 16th-note con clock identico a composer.js
  - CH0 kick: 5 fasi (arhythmic→emerging→groove→climax→dissolving) con gate probability
  - CH1 hi-hat: continuo con velFloor (RITM-01), phasing Reich 8/9 step (RITM-04)
  - CH7 percussion: additive Glass entry 4 note (RITM-03), eventi speciali arcPercent (D-09)
  - MIDI optimizations: downbeat boost MIDI-01, pitch range MIDI-02, phrase offset MIDI-03
affects: [03-melodylayer, 04-visual-sync, main.js-v3-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Step sequencer clock: clock += dt * stepsPerSec; step = Math.floor(clock) — identico a composer.js
    - Dual hat clock: due clock indipendenti (_hatClockA/_hatClockB) per phasing drift organico
    - Gating con bypass: sendNote() con gating rhythmicDensity, sendHatNote() senza (velFloor solo)
    - Additive activation: Set-based tracking di note attive + clock dedicato per poliritmia
    - Gaussian scatter: (Math.random()+Math.random()+Math.random()-1.5)*2 per velocity naturale
    - phrase offset: setTimeout() con range 5-30ms per sfasamento microtemporale MIDI-03

key-files:
  created:
    - MACH:INE II/src/rhythm-layer.js — RhythmLayer v3, 443 righe, zero magic numbers
  modified: []

key-decisions:
  - "sendHatNote bypassa gating rhythmicDensity — hat usa velFloor come minimo assoluto (RITM-01, D-06)"
  - "Due clock hat indipendenti (_hatClockA=8step, _hatClockB=9step) — convergenza 72 step, tensione latente non udibile come effetto esplicito (D-11, D-12)"
  - "Additive Glass usa patternLengths prime [5,7,11,13] per poliritmia naturale su CH7 — nessuna lunghezza in comune (RITM-03, RITM-04)"
  - "setTimeout per phrase offset (MIDI-03) — valido nel main thread; non usato nel Worker (commento documentato)"
  - "Phase detection: dissolving si attiva quando arcPercent>0.85 E density scende — isteresi composita per dissoluzione naturale"

patterns-established:
  - "Dual clock phasing: due accumulatori dt*stepsPerSec con cicli diversi — drift emerge da fisica, non da randomness"
  - "Set-based additive activation: _percActiveNotes Set con clock+pattern dedicato per ogni nota — O(n) attive"
  - "Downbeat step16 tracking: _currentStep16 aggiornato dal dispatcher prima di ogni sendNote"

requirements-completed: [RITM-01, RITM-02, RITM-03, RITM-04, MIDI-01, MIDI-02, MIDI-03, MIDI-04]

# Metrics
duration: 25min
completed: 2026-03-27
---

# Phase 02 Plan 02: RhythmLayer v3 Summary

**RhythmLayer v3 con arco ritmico BOC/Autechre/Floating Points su CH0/CH1/CH7 — phasing Reich 8/9 step, additive Glass 4 percussioni, MIDI humanization completa**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-27T12:50:00Z
- **Completed:** 2026-03-27T13:15:00Z
- **Tasks:** 1 (un unico task monolitico per il modulo completo)
- **Files modified:** 1

## Accomplishments

- Modulo `rhythm-layer.js` completo, 443 righe, zero magic numbers — tutti i parametri da CFG.RHYTHM
- CH0 kick con arco estetico in 5 fasi: silenzio ambient (BOC) → broken/frammentato (Autechre) → groove (Four Tet) → 4-on-the-floor (Floating Points) → dissoluzione
- CH1 hi-hat che non si interrompe mai (velFloor=15) con pitch rotation su cluster [36,38,40,42] e phasing Reich 8/9 step — convergenza ogni 72 step
- CH7 percussion con ingresso additivo Glass in 4 livelli (congaLo@0.20, congaHi@0.35, rimshot@0.50, snare@0.65) e pattern a lunghezze prime [5,7,11,13] per poliritmia organica
- 3 eventi speciali gated su arcPercent: impact@75% (false-resolution), sweep@84% (climax peak), impact@95% (chiusura dissoluzione)
- MIDI output ottimizzato: downbeat +8% / offbeat -5%, pitch range enforcement per canale, phrase offset 5-30ms

## Task Commits

1. **Task 1: rhythm-layer.js modulo completo** - `44cf8fc` (feat)

## Files Created/Modified

- `MACH:INE II/src/rhythm-layer.js` — RhythmLayer v3, 443 righe, exports initRhythmLayer/updateRhythmLayer

## Decisions Made

- Hat bypass: `sendHatNote()` separato da `sendNote()` — il hat bypassa il gating `rhythmicDensity` e usa solo `velFloor` come pavimento assoluto. Garantisce RITM-01 architetturalmente.
- Phase detection composita: la dissoluzione richiede sia `arcPercent > 0.85` sia che `rhythmicDensity` stia scendendo (confronto con frame precedente). Previene falsi positivi nella salita al climax.
- setTimeout per phrase offset (MIDI-03): valido nel main thread dove gira il handler del Worker. Documentato in commento nel codice.
- Pattern additive: `_percPatterns[note]` generato con algoritmo euclidean-ish al momento dell'attivazione — ogni nota ha il suo clock indipendente che cicla sulla propria lunghezza prima.

## Deviations from Plan

Nessuna — piano eseguito esattamente come specificato.

Il modulo rispetta tutti i contratti di interfaccia definiti nel piano: imports da config.js/macro-composer.js/midi.js, exports initRhythmLayer/updateRhythmLayer, pattern step sequencer identico a composer.js.

## Issues Encountered

Il repo git attivo per i commit e' `MACH:INE II/.git` (il repo dell'applicazione), non il worktree GSD. I commit vanno eseguiti da dentro `MACH:INE II/` — documentato per gli agenti successivi.

## Next Phase Readiness

- `rhythm-layer.js` pronto per integrazione in `main.js` V3_MODE branch (accanto a `updateMacroComposer()` e `updateHarmonyLayer()`)
- Plan 02-03 (integrazione main.js + wire V3_MODE) puo' procedere immediatamente
- CH7 routing: verificare che V3_MODE in main.js non attivi composer v2 su CH7 (collisione canale) — il routing deve essere esclusivo

---
*Phase: 02-rhythmlayer-e-midi-output*
*Completed: 2026-03-27*
