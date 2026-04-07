---
phase: 00-infrastruttura-e-migrazione
plan: "03"
subsystem: infra
tags: [midi, clock, bpm, lerp, web-worker, config]

# Dependency graph
requires:
  - phase: 00-01
    provides: CFG.V3_MODE flag — confirms config.js structure for adding bpmLerpBeats
provides:
  - CFG.bpmLerpBeats parameter (beats-based, tempo-relative lerp duration)
  - _targetClockBpm / _currentClockBpm variables in main.js
  - Smooth BPM lerp logic in midiWorker.onmessage handler
affects:
  - phase 1+ (any plan touching engine switching or MIDI clock)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BPM lerp espressa in battute (non ms fissi) — tempo-relative: beatsPerTick / bpmLerpBeats"
    - "Target/current split: _targetClockBpm aggiornato istantaneamente, _currentClockBpm lerpa ogni tick"
    - "DERIVA null-guard: la guardia `e.bpm &&` in getActiveBpm() previene NaN senza logica extra"

key-files:
  created: []
  modified:
    - "MACH:INE II/src/config.js"
    - "MACH:INE II/src/main.js"

key-decisions:
  - "bpmLerpBeats: 2 — valore abbastanza basso da non sembrare strano, abbastanza alto da eliminare il click sul sync Ableton alle transizioni di engine"
  - "Lerp espresso in battute (non ms): 2 battute a 80 BPM = 1.5s, a 128 BPM = 0.94s — corretto a qualsiasi tempo"
  - "Math.min(lerpRate, 1) clamp per evitare overshoot se dt e' insolitamente lungo"

patterns-established:
  - "Lerp tempo-relativo: beatsPerTick = (dt/1000) * (bpm/60); rate = beatsPerTick / beats"
  - "getActiveBpm() ora ha effetto collaterale: aggiorna _targetClockBpm (side-effect documentato nel commento)"

requirements-completed:
  - INFR-02

# Metrics
duration: 10min
completed: "2026-03-27"
---

# Phase 00 Plan 03: BPM Lerp su 2 battute Summary

**BPM lerp tempo-relativo via `_targetClockBpm`/`_currentClockBpm` in main.js + `CFG.bpmLerpBeats: 2` in config.js — elimina gli snap di clock alle transizioni di engine che rompevano il sync Ableton**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-27T10:30:00Z
- **Completed:** 2026-03-27T10:40:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `CFG.bpmLerpBeats: 2` aggiunto a config.js subito dopo `V3_MODE` — parametro centralizzato, modificabile senza toccare la logica
- Due variabili module-level `_targetClockBpm` / `_currentClockBpm` introdotte in main.js con inizializzazione a 120
- `getActiveBpm()` ora assegna `_targetClockBpm = e.bpm` oltre al pre-esistente `lastClockBpm = e.bpm`
- `midiWorker.onmessage` sostituisce la chiamata diretta `updateMIDIClock(getActiveBpm())` con blocco lerp completo: il clock riceve `_currentClockBpm` invece del valore snap
- NaN con DERIVA (bpm: null) escluso by design: la guardia `e.bpm &&` in getActiveBpm() impedisce che `_targetClockBpm` venga mai aggiornato a null

## Task Commits

1. **Task 1: Aggiungi CFG.bpmLerpBeats a config.js** - `c7d27b8` (feat)
2. **Task 2: Implementa lerp BPM in main.js** - `d2923ee` (feat)

## Files Created/Modified
- `MACH:INE II/src/config.js` — aggiunto `bpmLerpBeats: 2` tra `V3_MODE` e `debug`
- `MACH:INE II/src/main.js` — aggiunte 2 variabili lerp, assegnazione `_targetClockBpm` in `getActiveBpm()`, blocco lerp nel handler `midiWorker.onmessage`

## Decisions Made
- `bpmLerpBeats: 2`: valore scelto empiricamente — abbastanza lento da non sentire il click sul MIDI clock, abbastanza veloce da non sentire il glide come un difetto
- Formula lerp in battute (non millisecondi): garantisce che il comportamento sia identico a qualsiasi BPM — a 80 BPM la transizione dura 1.5s, a 128 BPM dura 0.94s
- `Math.min(lerpRate, 1)` clamp: previene overshoot se il Worker consegna un dt insolitamente grande (es. dopo uno stall V8)

## Deviations from Plan

None — piano eseguito esattamente come scritto.

## Issues Encountered

Nessuno. Il repo dell'applicazione (`MACH:INE II/.git`) e il repo di planning (worktree `agent-a78fd15e`) sono distinti — i commit sono stati eseguiti correttamente nel repo applicazione.

## Known Stubs

Nessuno. Nessun valore hardcoded placeholder, nessun TODO nel codice modificato.

## Next Phase Readiness
- INFR-02 completato: transizioni BPM smooth su 2 battute, DERIVA null-safe
- Piano 00-04 (ultimo della fase 00) puo' procedere senza dipendenze da questo piano
- La costante `bpmLerpBeats` e' modificabile in config.js per tuning live senza toccare la logica

---
*Phase: 00-infrastruttura-e-migrazione*
*Completed: 2026-03-27*
