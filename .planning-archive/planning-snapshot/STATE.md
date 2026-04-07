---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: complete
stopped_at: Phase 04 complete — MARC-04 checkpoint approvato, dt/1000 bug fixed
last_updated: "2026-03-27T18:45:00.000Z"
last_activity: 2026-03-27
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 15
  completed_plans: 13
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-27)

**Core value:** L'AI è il compositore — genera musica abbastanza ricca, coerente e memorabile da reggere una performance live di 60 minuti con arco narrativo completo.
**Current focus:** Phase 04 — integrazione-e-visual-system

## Current Position

Phase: 04 (integrazione-e-visual-system) — EXECUTING
Plan: 3 of 3
Phase: 03 (melodyLayer-e-textureLayer) — NEXT
Status: Ready to execute
Last activity: 2026-03-27

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 00-infrastruttura-e-migrazione P01 | 6 | 2 tasks | 1 files |
| Phase 00-infrastruttura-e-migrazione P02 | 3 | 1 tasks | 1 files |
| Phase 00-infrastruttura-e-migrazione P03 | 10 | 2 tasks | 2 files |
| Phase 00-infrastruttura-e-migrazione P04 | 5 | 1 tasks | 1 files |
| Phase 01-macrocomposer-e-harmonylayer P01-01 | 5 | 2 tasks | 2 files |
| Phase 02-rhythmlayer-e-midi-output P01 | 2 | 1 tasks | 1 files |
| Phase 02-rhythmlayer-e-midi-output P02 | 25 | 1 tasks | 1 files |
| Phase 02-rhythmlayer-e-midi-output P03 | 8 | 1 tasks | 1 files |
| Phase 03-melodylayer-e-texturelayer P03-01 | 3 | 1 tasks | 1 files |
| Phase 03-melodylayer-e-texturelayer P02 | 7 | 2 tasks | 1 files |
| Phase 03-melodylayer-e-texturelayer P03 | 7 | 1 tasks | 1 files |
| Phase 04-integrazione-e-visual-system P04-01 | 5 | 1 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Pre-roadmap: Archiviare v2 su branch separato — preservare il lavoro senza rischio
- Pre-roadmap: Sistema stratificato al posto di 7 motori sequenziali — layer sovrapposti più organici
- Pre-roadmap: Mantenere visual system esistente (field.js, render.js, director.js PROTECTED)
- Roadmap: Phase 0 numerata da 0 (non da 1) perché è pura infrastruttura/prerequisito
- [Phase 00-infrastruttura-e-migrazione]: v2-archive branch creato in repo applicazione (MACH:INE II/.git) preservando snapshot v2.9.0 pre-modifica
- [Phase 00-infrastruttura-e-migrazione]: CFG.V3_MODE: false come prima proprieta' di CFG — feature flag per attivare sistema v3 senza rompere v2
- [Phase 00-infrastruttura-e-migrazione]: CLOCK_LOOKAHEAD = 100ms (costante locale midi.js, non in CFG) — 2x margin contro V8 GC pause per MIDI clock stutter-free durante performance live
- [Phase 00-infrastruttura-e-migrazione]: bpmLerpBeats: 2 — lerp BPM espresso in battute (non ms), tempo-relativo: 2 battute a qualsiasi BPM per transizioni smooth senza snap sul sync Ableton
- [Phase 00-infrastruttura-e-migrazione]: sendMIDIAllNotesOff() flush-before-deactivate: chiamata come prima istruzione nei cue silence/end per garantire CC 123 prima che note bufferizzate nel WebMIDI driver vengano consegnate
- [Phase 01-macrocomposer-e-harmonylayer]: Chiavi con # in JS usano string literal keys ('C#_dorian') per compatibilita — coerenza con valori mode nei checkpoint
- [Phase 01-macrocomposer-e-harmonylayer]: Bypass EMA solo su rhythmicDensity per false-resolution instant — altre 3 dimensioni rimangono fluide
- [Phase 01-macrocomposer-e-harmonylayer]: microDriftFreqSec: 23 (numero primo) garantisce asincronia con qualsiasi tempo musicale
- [Phase 02-rhythmlayer-e-midi-output]: phaseThresholds usa nomi inglesi (arhythmic/emerging/groove/climax/dissolving) per leggibilita' code path, commenti italiani per intenzione musicale
- [Phase 02-rhythmlayer-e-midi-output]: velFloor: 15 su hat come proprieta' separata da velTarget — garantisce RITM-01 a livello di config
- [Phase 02-rhythmlayer-e-midi-output]: phasingStepsA 8 / phasingStepsB 9 — convergenza 72 step per tensione latente non udibile come effetto esplicito (D-11)
- [Phase 02-rhythmlayer-e-midi-output]: sendHatNote bypassa gating rhythmicDensity — hat usa velFloor come minimo assoluto (RITM-01, D-06)
- [Phase 02-rhythmlayer-e-midi-output]: Dual hat clock (_hatClockA=8step, _hatClockB=9step) — convergenza 72 step, tensione latente Reich organica (D-11)
- [Phase 02-rhythmlayer-e-midi-output]: Phase dissolving: condizione composita arcPercent>0.85 AND density scende — isteresi per dissoluzione naturale
- [Phase 03-melodylayer-e-texturelayer]: loopLenCH3=7/CH5=11/CH6=13 — LCM=1001 step, poliritmo perpetuo nessun ciclo identico in 45min
- [Phase 03-melodylayer-e-texturelayer]: ch6JumpPreference=1.6 / ch6StepReduction=0.7 — CH6 carattere angoloso vs CH5 melodico (D-03)
- [Phase 03-melodylayer-e-texturelayer]: activityGateFloor=0.04 / seedCaptureGateMin=0.02 — gating asimmetrico per cattura seed in apertura silente
- [Phase 03-melodylayer-e-texturelayer]: barClock micro-sequencer per seed return — setTimeout inaffidabile nel Web Worker a 2ms tick rate
- [Phase 03-melodylayer-e-texturelayer]: _rawSend diretto per seed return bypassa gating melodicActivity — il ritorno motivico DEVE suonare
- [Phase 03-melodylayer-e-texturelayer]: Layer v3 wiring pattern chirurgico (3 edit a main.js) applicato identicamente per MelodyTextureLayer — pattern stabile e ripetibile per Phase 4
- [Phase 04-integrazione-e-visual-system]: Layer palette identities: harmony=cold, rhythm=amber, melody=magenta, master=bw — firme cromatiche per layer v3
- [Phase 04-integrazione-e-visual-system]: dominanceHysteresis: 0.10 — 10% margin per detronizzare layer corrente, previene flip-flop visivo
- [Phase 04-integrazione-e-visual-system]: paletteLerpSpeed: 0.015 separato da lerpSpeed: 0.02 — palette cambia piu lentamente per evitare tremolio cromatico

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 4: Director engine-identity resolution strategy non decisa — come gestisce director.js layer simultanei multipli? Richiede design pass prima di Phase 4.
- Phase 3: Markov matrix values per aesthetic (Reich/Eno/Four Tet) richiedono authoring musicale durante implementazione — non pre-specificabili.
- Phase 0: presence-multiplier.js — verificare se supporta gating per-layer senza rewrite completo prima di Phase 1.

## Session Continuity

Last session: 2026-03-27T15:58:44.615Z
Stopped at: Completed 04-01-PLAN.md — CFG.VISUAL config block
Resume file: None
