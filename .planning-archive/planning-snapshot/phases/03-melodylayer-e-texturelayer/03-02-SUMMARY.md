---
phase: 03-melodylayer-e-texturelayer
plan: 02
subsystem: composition
tags: [midi, melody, markov, seed-motif, polyrhythm, arpeggio, macro-composer]

# Dependency graph
requires:
  - phase: 03-melodylayer-e-texturelayer/03-01
    provides: CFG.MELODY config block in config.js — all numeric parameters for MelodyTextureLayer
  - phase: 01-macrocomposer-e-harmonylayer
    provides: macroState (arcPercent, melodicActivity, currentMode, barClock) from macro-composer.js
  - phase: 00-infrastruttura-e-migrazione
    provides: sendMIDINote/_rawSend API from midi.js
provides:
  - melody-texture-layer.js — MelodyTextureLayer v3 ES module with initMelodyTextureLayer() and updateMelodyTextureLayer()
  - CH3 bassline melodica 7-step Markov loop
  - CH5 voice melodica con seed capture + single return via barClock micro-sequencer
  - CH6 lead angoloso 13-step con ch6JumpPreference differenziazione
  - Cross-arpeggiation D-05 CH5/CH6 in arcPercent 0.35-0.70 window
affects:
  - 03-03 — wiring in main.js requires initMelodyTextureLayer/updateMelodyTextureLayer exports
  - phase-04 — director engine-identity will see CH3/CH5/CH6 active simultaneously

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prime-length step clocks: LCM(7,11,13)=1001 — perpetual polyrhythm never repeating in 45min"
    - "barClock micro-sequencer: seed return queued by bar count, flushed each tick (no setTimeout)"
    - "Markov voice selection with seed affinity: weight multiplied per matching interval in captured motif"
    - "Asymmetric gating: activityGateFloor=0.04 for normal operation, seedCaptureGateMin=0.02 for seed window"
    - "CH6 differentiation: ch6JumpPreference=1.6 on jumps, ch6StepReduction=0.7 on step bonus"

key-files:
  created:
    - MACH:INE II/src/melody-texture-layer.js
  modified: []

key-decisions:
  - "barClock micro-sequencer for seed return instead of setTimeout — Web Worker setTimeout unreliable at ~2ms tick rate"
  - "Both Task 1 and Task 2 implemented in a single file creation — arpeggio logic integrated at write time to avoid partial state"
  - "_rawSend bypasses sendNote gating for seed return — seed MUST sound regardless of melodicActivity level"

patterns-established:
  - "sendNote wrapper with activityGateFloor gating mirrors rhythm-layer.js sendNote pattern for melodic channels"
  - "Seed capture via interval accumulation in _intervCH5 — natural emergence from normal play, not forced"

requirements-completed: [MELO-01, MELO-02, MELO-03]

# Metrics
duration: 7min
completed: 2026-03-27
---

# Phase 03 Plan 02: MelodyTextureLayer Summary

**MelodyTextureLayer v3 — tre clock primali (7/11/13-step), Markov pesato su modo, seed motivico con cattura in arcPercent<0.15 e ritorno trasportato a arcPercent>0.75 via micro-sequencer barClock, cross-arpeggiation CH5/CH6**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-27T14:51:50Z
- **Completed:** 2026-03-27T14:58:49Z
- **Tasks:** 2 (Task 1: core module + Task 2: arpeggi incrociati)
- **Files modified:** 1

## Accomplishments

- CH3/CH5/CH6 step clocks con lunghezze prime 7/11/13 — LCM=1001, poliritmo perpetuo che non si sincronizza mai nell'arco di 45 minuti
- Weighted Markov voice selection con seed affinity: note selection pesata su storia, con bonus/penalty per step/salti e affinita con il motivo catturato
- Seed motivico completo: cattura automatica di 4 intervalli entro arcPercent<0.15, ritorno unico trasportato alla root del modo attivo a arcPercent>0.75 via micro-sequencer barClock (no setTimeout)
- Cross-arpeggiation D-05: nella finestra arcPercent 0.35-0.70 con melodicActivity>0.5, CH6 risponde a CH5 con intervallo di terza/quinta snappato a scala

## Task Commits

1. **Task 1+2: create melody-texture-layer.js** - `0fbd5e3` (feat) — entrambi i task implementati nella creazione del file

## Files Created/Modified

- `MACH:INE II/src/melody-texture-layer.js` — MelodyTextureLayer v3: 396 righe, tre step clocks primali, Markov, seed motivico, cross-arpeggio D-05, MIDI-01/02/03 wrappers

## Decisions Made

- **barClock micro-sequencer per seed return**: Web Worker non supporta setTimeout affidabile a ~2ms tick rate — il seed return usa _flushSeedQueue() controllata ogni tick basandosi su macroState.barClock
- **Task 1+2 come singola write**: arpeggio logic integrata al momento della scrittura del file per evitare stato parziale tra commit — entrambi i task completati atomicamente
- **_rawSend per seed return**: bypassa gating melodicActivity — il ritorno del motivo DEVE suonare indipendentemente dall'attivita melodica corrente

## Deviations from Plan

None — plan executed exactly as written. Task 2 (arpeggi) fu integrato nella stessa write del Task 1 invece di un secondo Edit, ma tutto il codice richiesto e presente e corretto.

## Issues Encountered

- La directory `MACH:INE II/` ha un proprio repository git separato dal planning repo — il commit e stato fatto nel sub-repo corretto (`MACH:INE II/.git`)

## Known Stubs

None — il modulo e autonomo e funzionale. Non e ancora wired in main.js (questo e il compito del Plan 03-03), ma tutti gli export richiesti sono presenti e corretti.

## Next Phase Readiness

- `melody-texture-layer.js` pronto per il wiring in main.js — Plan 03-03
- Exports necessari: `initMelodyTextureLayer()` e `updateMelodyTextureLayer(dt)`
- Il modulo importa correttamente da config.js, macro-composer.js e midi.js
- Nessun blocker per Plan 03-03

---
*Phase: 03-melodylayer-e-texturelayer*
*Completed: 2026-03-27*
