---
phase: 03-melodylayer-e-texturelayer
plan: 01
subsystem: config
tags: [config, melody, midi, markov, arpeggio, prime-loops]

# Dependency graph
requires:
  - phase: 02-rhythmlayer-e-midi-output
    provides: CFG.RHYTHM pattern — struttura config gia stabilita, MIDI-01/02/03 requirements
provides:
  - CFG.MELODY block in config.js — tutti i parametri numerici per MelodyTextureLayer
  - loopLenCH3/5/6 prime lengths 7/11/13 per poliritmia perpetua
  - seedLength/seedWindowEnd/seedReturnAt per motivic seed memory
  - pitchRange per CH3/CH5/CH6 MIDI-02 compliant
  - markov weights con ch6JumpPreference/ch6StepReduction per differenziazione D-03
  - arpeggio cross-arpeggiation config D-05
  - emitProbability, velTarget, noteDur, activityGateFloor
affects:
  - 03-02-PLAN (melody-texture-layer.js implementation — consuma CFG.MELODY)
  - 03-03-PLAN (integration — CFG.MELODY parametri usati in wiring)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Config-first: tutti i parametri numerici centralizzati prima di implementare il modulo"
    - "Prime loop lengths (7/11/13) per LCM=1001 step — poliritmo perpetuo senza cicli identici"
    - "Markov weights separati per CH5/CH6 — differenziazione carattere angoloso CH6 (D-03)"

key-files:
  created: []
  modified:
    - "MACH:INE II/src/config.js"

key-decisions:
  - "loopLenCH3=7, loopLenCH5=11, loopLenCH6=13 — LCM=1001 step garantisce nessun ciclo identico nella performance 45min"
  - "ch6JumpPreference=1.6 / ch6StepReduction=0.7 — CH6 preferisce salti per carattere angoloso vs CH5 melodico (D-03)"
  - "arpeggio.delayStp=2 — CH6 arpeggiation delay di 2 step rispetto a CH5 per cross-arpeggio D-05"
  - "activityGateFloor=0.04 / seedCaptureGateMin=0.02 — gating asimmetrico permette cattura seed in apertura silente"
  - "emitProbability defaults rarefatti (ch3=0.45, ch5=0.25, ch6=0.20) — D-06: meno note, non piu"

patterns-established:
  - "Differenziazione Markov per canale: parametri separati per CH5 (melodico) e CH6 (angoloso/salti)"
  - "Gating asimmetrico: seedCaptureGateMin < activityGateFloor per consentire cattura motivica in apertura"

requirements-completed: [MELO-01, MELO-02]

# Metrics
duration: 3min
completed: 2026-03-27
---

# Phase 03 Plan 01: CFG.MELODY Config Block Summary

**CFG.MELODY aggiunto a config.js con 76 righe — prime loops 7/11/13, seed motivico, Markov weights differenziati CH5/CH6, cross-arpeggio D-05, gating asimmetrico — zero magic numbers pronti per melody-texture-layer.js**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T14:50:25Z
- **Completed:** 2026-03-27T14:50:28Z
- **Tasks:** 1/1
- **Files modified:** 1

## Accomplishments

- CFG.MELODY block inserito in config.js (riga 620–692) come sezione top-level dopo CFG.RHYTHM
- Loop lengths primi 7/11/13 per LCM=1001 step: poliritmo perpetuo, nessun ciclo identico in 45 minuti
- Markov weights differenziati: CH6 character angoloso (ch6JumpPreference=1.6, ch6StepReduction=0.7) vs CH5 melodico
- Seed motivico completo: seedLength=4, seedWindowEnd=0.15, seedReturnAt=0.75
- Gating asimmetrico: seedCaptureGateMin=0.02 < activityGateFloor=0.04 per permettere cattura seed durante apertura

## Task Commits

1. **Task 1: Aggiungere CFG.MELODY config block a config.js** - `7b9f3c9` (feat)

## Files Created/Modified

- `MACH:INE II/src/config.js` - Aggiunto blocco MELODY: 76 righe, 618→693 righe totali (entro limite 700)

## Decisions Made

- loopLenCH3=7, loopLenCH5=11, loopLenCH6=13: LCM=1001 step, nessun ciclo identico in 45min di performance
- ch6JumpPreference=1.6 / ch6StepReduction=0.7: differenziazione carattere CH6 angoloso vs CH5 melodico (D-03)
- arpeggio.delayStp=2: cross-arpeggio CH6 sfasato di 2 step rispetto a CH5 (D-05)
- activityGateFloor=0.04 / seedCaptureGateMin=0.02: gating asimmetrico per cattura seed anche in apertura silente
- emitProbability rarefatti di default (ch5=0.25, ch6=0.20): D-06 rispettato — meno note di default, non piu

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CFG.MELODY completo e pronto per 03-02: melody-texture-layer.js puo importare tutti i parametri via `import { CFG } from './config.js'`
- Zero magic numbers: tutti i valori numerici del modulo sono centralizzati
- Nessun blocker per 03-02

---
*Phase: 03-melodylayer-e-texturelayer*
*Completed: 2026-03-27*

## Self-Check: PASSED

- [x] `MACH:INE II/src/config.js` FOUND - verificato con wc -l (693 righe)
- [x] Commit `7b9f3c9` FOUND - `feat(03-01): add CFG.MELODY config block to config.js`
- [x] `MELODY:` — 1 match in config.js
- [x] `loopLenCH3: 7` — presente (riga 623)
- [x] `loopLenCH5: 11` — presente (riga 624)
- [x] `loopLenCH6: 13` — presente (riga 625)
- [x] `seedLength: 4` — presente (riga 647)
- [x] `seedWindowEnd: 0.15` — presente (riga 648)
- [x] `seedReturnAt: 0.75` — presente (riga 649)
- [x] `activityGateFloor: 0.04` — presente (riga 628)
- [x] `pitchRange:` con chiavi 3, 5, 6 — presente (riga 632)
- [x] `emitProbability:` con ch3Base/ch5Base/ch6Base — presente (riga 655)
- [x] `markov:` con stepBonus, jumpPenalty, seedAffinity — presente (riga 669)
- [x] `ch6JumpPreference` e `ch6StepReduction` — presenti (righe 674-675)
- [x] `arpeggio:` con activeRange, noteSpacingMs, threshold: 0.5, delayStp: 2 — presente (riga 679)
- [x] File non supera 700 righe — 693 righe totali
