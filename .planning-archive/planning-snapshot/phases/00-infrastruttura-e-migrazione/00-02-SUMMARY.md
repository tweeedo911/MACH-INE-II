---
phase: 00-infrastruttura-e-migrazione
plan: 02
subsystem: infra
tags: [midi, clock, latency, gc, webaudio, webmidi]

# Dependency graph
requires:
  - phase: 00-01
    provides: v2-archive branch + CFG.V3_MODE flag (prerequisito completato)
provides:
  - CLOCK_LOOKAHEAD = 100ms in MACH:INE II/src/midi.js (soddisfa INFR-01)
affects:
  - Phase 1 (sistema stratificato) — clock piu robusto beneficia tutti i layer compositivi sovrapposti

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lookahead scheduling aumentato a 100ms: 2x safety margin contro GC pause V8 (~50ms max)"

key-files:
  created: []
  modified:
    - "MACH:INE II/src/midi.js"

key-decisions:
  - "CLOCK_LOOKAHEAD rimane costante locale a midi.js (non esposta in CFG) — e' un parametro infrastrutturale, non compositivo"
  - "100ms scelto per dare 2x margine rispetto al max GC pause misurabile (~50ms) senza impatto sulla latenza percepibile"

patterns-established:
  - "Lookahead clock: costante interna al modulo MIDI, commentata con il ragionamento tecnico"

requirements-completed: [INFR-01]

# Metrics
duration: 3min
completed: 2026-03-27
---

# Phase 00 Plan 02: MIDI Clock Lookahead 100ms Summary

**CLOCK_LOOKAHEAD aumentato da 50ms a 100ms in midi.js: 2x safety margin contro pause GC V8 durante performance live (soddisfa INFR-01)**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-27T10:20:00Z
- **Completed:** 2026-03-27T10:23:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- CLOCK_LOOKAHEAD portato a 100ms in `MACH:INE II/src/midi.js` riga 44
- Una sola riga modificata — nessun impatto architetturale
- Il commento inline spiega il ragionamento (GC pause V8 ~50ms max → 2x margin)
- Soddisfatto requisito INFR-01: MIDI clock resistente a picchi GC del main thread

## Task Commits

1. **Task 1: Aumenta CLOCK_LOOKAHEAD a 100ms (INFR-01)** - `e492554` (feat) — sub-repo MACH:INE II

## Files Created/Modified

- `MACH:INE II/src/midi.js` — CLOCK_LOOKAHEAD = 100 (riga 44, era 50)

## Decisions Made

- CLOCK_LOOKAHEAD non esposta in CFG: e' una costante infrastrutturale interna a midi.js, non un parametro compositivo. Il commento inline documenta il ragionamento.
- 100ms scelto: V8 major GC pause tipicamente fino a ~50ms → 100ms offre 2x safety margin senza impatto sulla latenza percepita dall'utente.

## Deviations from Plan

None — piano eseguito esattamente come scritto. Una riga modificata, nessuna altra modifica.

## Issues Encountered

None.

## User Setup Required

None — nessuna configurazione esterna richiesta.

## Next Phase Readiness

- Plan 00-02 completo. CLOCK_LOOKAHEAD = 100ms attivo.
- Prossimo: 00-03 (se presente) oppure transizione a Phase 1.
- Clock piu robusto beneficia tutti i layer compositivi sovrapposti del sistema stratificato v3.

---
*Phase: 00-infrastruttura-e-migrazione*
*Completed: 2026-03-27*
