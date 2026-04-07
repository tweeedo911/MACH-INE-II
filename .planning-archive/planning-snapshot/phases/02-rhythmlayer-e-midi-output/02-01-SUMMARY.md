---
phase: 02-rhythmlayer-e-midi-output
plan: 01
subsystem: composition
tags: [config, rhythm, midi, kick, hat, percussion, phasing, glass, reich]

# Dependency graph
requires:
  - phase: 01-macrocomposer-e-harmonylayer
    provides: CFG.MACRO block — pattern di riferimento per struttura e naming; macroState.rhythmicDensity come driver primario
provides:
  - CFG.RHYTHM block in config.js — tutti i parametri numerici per RhythmLayer v3
  - phaseThresholds 5 fasi (arhythmic/emerging/groove/climax/dissolving) su rhythmicDensity
  - kick patterns 4-on-the-floor + 3 broken, gateProbability per fase
  - hat pitchCluster [36,38,40,42], velFloor, phasingStepsA 8 / phasingStepsB 9 (Reich)
  - perc noteMap 6 ruoli + additiveEntry 4 soglie Glass + specialNotes [60,62]
  - midi downbeatBoost, pitchRange CH0/1/7, noteOffsetMs, legatoRatio, channel routing
affects:
  - 02-02 (rhythm-layer.js implementation — consumerà CFG.RHYTHM intero)
  - 03-melodyLayer (pattern channel routing CH0/1/7 non disponibili)
  - 04-integration (director legge phase da engine; RhythmLayer usa stessa architettura)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Config-first: tutti i parametri numerici del layer in CFG.RHYTHM prima di scrivere il codice"
    - "phaseThresholds come array di soglie su un singolo float driver (rhythmicDensity 0-1)"
    - "gateProbability per fase — ogni fase ha la sua probabilità kick separata da pattern e velocity"
    - "Reich phasing: due lunghezze diverse (8/9) sullo stesso canale, convergenza ogni 72 step"
    - "Glass additive: additiveEntry array ordinato con threshold per ingresso progressivo"

key-files:
  created: []
  modified:
    - "MACH:INE II/src/config.js"

key-decisions:
  - "phaseThresholds usa nomi inglesi nel codice (arhythmic/emerging/groove/climax/dissolving) per leggibilità nei code path, anche se i riferimenti estetici sono italiani nei commenti"
  - "velFloor: 15 — il hi-hat non si azzera mai in nessuna fase (RITM-01 enforced tramite config)"
  - "phasingStepsA 8 / phasingStepsB 9 — convergenza ogni 72 step (~8-10sec a 88BPM) per tensione latente non udibile come effetto esplicito (D-11)"
  - "kick fisso su note 36 (C2) — non fa parte del pitch cluster; timbro diretto e non ambiguo su CH0"
  - "specialNotes [60,62] isolati da gateProbability — triggering esclusivo via MacroComposer cue (D-09)"

patterns-established:
  - "Fase arc su driver float 0-1: phaseThresholds come soglie crescenti su rhythmicDensity — replicabile per tutti i layer v3"
  - "velFloor separato da velTarget: floor garantisce presenza minima indipendente dalla fase"

requirements-completed: [RITM-01, RITM-02, RITM-03, RITM-04, MIDI-01, MIDI-02, MIDI-03, MIDI-04]

# Metrics
duration: 2min
completed: 2026-03-27
---

# Phase 02 Plan 01: CFG.RHYTHM configuration block in config.js Summary

**Blocco CFG.RHYTHM aggiunto a config.js (118 righe): 5 fasi ritmiche su rhythmicDensity, kick con 4 pattern 16-step e gateProbability per fase, hat con pitchCluster e phasing Reich 8/9, percussioni CH7 con Glass additiveEntry 4 livelli e specialNotes, MIDI optimizations downbeat/pitch/offset/routing.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-27T12:41:31Z
- **Completed:** 2026-03-27T12:43:17Z
- **Tasks:** 1 di 1
- **Files modified:** 1

## Accomplishments

- CFG.RHYTHM block completo (118 righe) inserito dopo MACRO e prima della chiusura CFG in config.js
- Tutti i parametri per i 3 sub-loop RhythmLayer (CH0 kick, CH1 hat, CH7 perc) definiti senza magic numbers
- Phasing Reich e Glass additive entry codificati come strutture dati esplicite per il layer successivo

## Task Commits

1. **Task 1: CFG.RHYTHM configuration block** - `c0cbb9a` (feat) — repo applicazione `MACH:INE II/`

**Plan metadata:** (docs commit — vedi sotto)

## Files Created/Modified

- `MACH:INE II/src/config.js` — Aggiunto blocco RHYTHM (riga 501-617): phaseThresholds, kick, hat, perc, midi

## Decisions Made

- Nomi fasi inglesi nel codice (arhythmic/emerging/groove/climax/dissolving) per coerenza con code path — commenti italiani per intenzione musicale
- velFloor: 15 su hat come proprietà separata da velTarget — garantisce RITM-01 a livello di config
- phasingStepsA/B come interi semplici (8/9) non come ratio — il RhythmLayer calcola la convergenza 72 step autonomamente
- specialNotes come array separato da additiveEntry — architettura che impedisce a livello config l'ingresso accidentale nei pattern normali

## Deviations from Plan

Nessuna — piano eseguito esattamente come scritto.

## Issues Encountered

- Repo git applicazione separato da repo GSD: `MACH:INE II/.git` vs radice `.git`. Commit fatto nel repo corretto (`MACH:INE II/`) per mantenere la storia del codice sorgente pulita.

## User Setup Required

Nessuno — nessun servizio esterno, nessuna configurazione manuale richiesta.

## Next Phase Readiness

- CFG.RHYTHM completo e verificato (parentesi bilanciate 131/131, tutti i grep acceptance criteria OK)
- Plan 02-02 (rhythm-layer.js) può importare `CFG.RHYTHM` direttamente senza nessun magic number nel codice
- CH7 riassegnato da RUPTURE a layer percussivo strutturato — il routing V3_MODE in main.js dovrà evitare collisioni (già documentato in 02-CONTEXT.md come punto di integrazione)

---
*Phase: 02-rhythmlayer-e-midi-output*
*Completed: 2026-03-27*
