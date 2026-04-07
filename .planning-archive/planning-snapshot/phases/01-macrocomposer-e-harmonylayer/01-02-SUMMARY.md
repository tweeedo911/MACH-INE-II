---
phase: 01-macrocomposer-e-harmonylayer
plan: "01-02"
subsystem: composition

tags: [harmony-layer, voice-leading, drone, MIDI-output, V3_MODE, modal-harmony, Four-Tet-chromaticism]

# Dependency graph
requires:
  - phase: 01-macrocomposer-e-harmonylayer
    plan: 01-01
    provides: macroState (currentMode, harmonicColor, barClock, pivotActive, pivotNote), CFG.MACRO (droneRoot, anchors, pentatonic, bpmReference)

provides:
  - src/harmony-layer.js — primo output MIDI v3: drone root persistente CH2, bass CH3, chords CH4 con voice leading
  - src/main.js V3_MODE routing — branch if/else nel midiWorker.onmessage per v3 vs v2

affects:
  - Tutti i piani Phase 02+ che aggiungono layer su CH0/CH1/CH5/CH6 (ritmico, melodico)
  - V3_MODE=true attivabile in config.js per test live su MIDI monitor

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gating interno su harmonicColor < 0.05 (identico a pm < 0.05 dei composer v2, senza presence-multiplier.js)"
    - "applyVoiceLeading: two-pass nearest-note con Set used per evitare duplicati, fallback senza vincolo maxLeap"
    - "Drone bypass gating: _rawSend diretto su CH2 per HARM-01 — velocity proporzionale ma sempre presente"
    - "Cromatismo 12%: sendNote nota+1 (1 bar) + sendNote nota originale (3 bar residui) — risoluzione verso il basso"
    - "V3_MODE if/else nel Worker onmessage: zero overhead in v2 mode (branch non percorso)"

key-files:
  created:
    - "MACH:INE II/src/harmony-layer.js"
  modified:
    - "MACH:INE II/src/main.js"

key-decisions:
  - "Drone su CH2 usa _rawSend diretto (bypassa gating harmonicColor) per garantire HARM-01 — la velocity e' proporzionale ma la nota e' sempre presente anche con harmonicColor bassa"
  - "applyVoiceLeading usa two-pass: prima cerca entro maxLeap=3, fallback alla nota piu' vicina senza vincolo — evita silence su voci che non trovano match entro 3 semitoni"
  - "Cromatismo Four Tet: nota+1 per 1 bar, poi nota originale per i restanti bar del ciclo — risoluzione verso il basso strutturale, non schedulata con setTimeout (non disponibile nel Worker)"
  - "V3_MODE routing nell'else branch preserva identicamente il v2 originale — flip immediato senza regressioni"

patterns-established:
  - "HarmonyLayer consumer pattern: modulo che legge macroState e produce MIDI senza ownership dello stato"
  - "Bar-clock gating: if (currentBar >= _lastXBar + _updateEvery) per ritmo armonico lazy (non every-tick)"

requirements-completed: [HARM-01, HARM-02, HARM-03, HARM-04, HARM-05]

# Metrics
duration: 3min
completed: 2026-03-27
---

# Phase 01 Plan 02: HarmonyLayer MIDI output e V3_MODE routing — Summary

**harmony-layer.js con drone root CH2 persistente bypass-gating, voice leading applyVoiceLeading maxLeap=3 su CH4, cromatismo Four Tet 12% probabilita', + V3_MODE if/else routing in main.js midiWorker.onmessage**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T11:30:26Z
- **Completed:** 2026-03-27T11:33:37Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `harmony-layer.js` creato: 179 righe, zero magic numbers, tutti i parametri da CFG.MACRO
- Drone root persistente su CH2 (HARM-01): `_rawSend` diretto bypassa gating, nota lunga 7.5 bar rinnovata ogni 2 bar
- Bass su CH3 da anchor.bass (HARM-03): root/quinta del modo corrente
- Accordi su CH4 con `applyVoiceLeading` maxLeap=3 (HARM-04): two-pass nearest-note con fallback
- Cromatismo Four Tet: 12% probabilita', nota+1 semitono (1 bar) poi risoluzione verso il basso (HARM-05)
- Finestra pivot 1 bar: solo nota pivot su CH4 durante transizioni modali (D-11)
- Gating interno su `harmonicColor < 0.05` (D-09): non tocca presence-multiplier.js
- `main.js`: 3 modifiche chirurgiche — import v3 layers, midiWorker.onmessage if(V3_MODE)/else, boot init condizionato
- V2 legacy branch nell'else identico all'originale — zero regressioni

## Task Commits

1. **Task 1: harmony-layer.js — MIDI output CH2/CH4** — `e03bf0e` (feat)
2. **Task 2: V3_MODE routing in main.js** — `35aa72c` (feat)

## Files Created/Modified

- `MACH:INE II/src/harmony-layer.js` — Creato: 179 righe, drone CH2, bass CH3, chords CH4 voice leading
- `MACH:INE II/src/main.js` — Modificato: import v3 layers, V3_MODE routing, boot init condizionato

## Decisions Made

- Drone CH2 usa `_rawSend` diretto (non `sendNote` con gating) — HARM-01 richiede presenza assoluta; la velocity rimane proporzionale a `harmonicColor` per dinamica naturale ma la nota non viene mai soppressa.
- `applyVoiceLeading` two-pass: prima cerca entro `maxLeap=3`, poi fallback alla nota piu' vicina senza vincolo — necessario per prevenire silenzio su voci che non trovano match (es. in transizioni modali con gap armonico ampio).
- Cromatismo con risoluzione verso il basso implementato senza `setTimeout` (non disponibile nel Worker): la nota cromatica dura 1 bar, la nota di risoluzione parte subito dopo nel ciclo di 4 bar.

## Deviations from Plan

Nessuna — piano eseguito esattamente come scritto.

## Known Stubs

Nessuno — harmony-layer.js e' fully functional. I valori anchor voicings in CFG.MACRO (ereditati da Plan 01-01) sono calibrati su analisi teorica e richiedono verifica via ascolto su setup MIDI hardware reale. Non sono stub ma valori iniziali da affinare.

## Next Phase Readiness

- `CFG.V3_MODE = true` in config.js abilita il primo output MIDI v3 verificabile su MIDI monitor
- CH0 (pulse/kick), CH1 (grain), CH5 (voice/lead), CH6 (lead) sono liberi per Phase 02 (RhythmLayer) e Phase 03 (MelodyLayer)
- `macroState.rhythmicDensity` e `macroState.melodicActivity` disponibili per i prossimi layer

## Self-Check: PASSED

- harmony-layer.js: FOUND
- 01-02-SUMMARY.md: FOUND
- commit e03bf0e: FOUND
- commit 35aa72c: FOUND

---
*Phase: 01-macrocomposer-e-harmonylayer*
*Completed: 2026-03-27*
