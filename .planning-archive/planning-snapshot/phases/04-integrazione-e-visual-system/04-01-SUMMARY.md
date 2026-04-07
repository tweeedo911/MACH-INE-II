---
phase: 04-integrazione-e-visual-system
plan: 01
subsystem: config
tags: [config, visual-system, director, layer-prefs, v3]

# Dependency graph
requires:
  - phase: 03-melodylayer-e-texturelayer
    provides: MelodyTextureLayer — 3 layer v3 (harmony/rhythm/melody) wired in main.js
provides:
  - CFG.VISUAL block in config.js with all v3 visual system parameters
  - Layer preferences for harmony, rhythm, melody, master (D-07, D-08, D-09)
  - 5 visual narrative acts with arcPercent ranges (D-06)
  - Dominance/lerp parameters (D-01, D-03)
affects: [director.js, 04-02, 04-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Config-first: CFG.VISUAL centralizes all visual v3 numeric params before director.js implementation"
    - "Layer-prefs pattern: analogo a ENGINE_PREFS v2 ma per 3 layer v3 + master"

key-files:
  created: []
  modified:
    - "MACH:INE II/src/config.js"

key-decisions:
  - "Layer palette identities: harmony=cold, rhythm=amber, melody=magenta, master=bw — firme cromatiche per layer v3"
  - "5 atti visivi con arcPercent boundaries coerenti con arco narrativo: sparse/cold (0-15%) → bayer/default (15-35%) → colored/warm (35-60%) → dense/warm (60-80%) → sparse/cold (80-100%)"
  - "dominanceHysteresis: 0.10 (10% margin per detronizzare layer corrente) — previene flip-flop visivo"
  - "paletteLerpSpeed: 0.015 separato da lerpSpeed: 0.02 — palette cambia piu lentamente per evitare tremolio cromatico"

patterns-established:
  - "CFG.VISUAL.layers: struttura per-layer con palette, dotSize, densityMul, midiScale, trailMax, flickerSpeed, shapeScale, densityGravity, onsetWaveSpeed, midiDensityMul, feedbackDecay"
  - "CFG.VISUAL.acts: 5 atti con min/max/scene/palette/densityCap/camera — tutti i parametri per l'arco visivo narrativo"

requirements-completed: [VISL-01, VISL-02]

# Metrics
duration: 5min
completed: 2026-03-27
---

# Phase 4 Plan 01: Visual System v3 Config Block Summary

**CFG.VISUAL aggiunto a config.js: 4 layer prefs (harmony/rhythm/melody/master), 5 atti narrativi visivi, parametri dominance/lerp — zero magic numbers pronti per director.js**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-27T15:56:52Z
- **Completed:** 2026-03-27T15:57:34Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- CFG.VISUAL block inserito in config.js dopo CFG.MELODY e prima di `};` finale — pattern config-first rispettato
- 4 layer preferences definite: harmony (cold), rhythm (amber), melody (magenta), master (bw) con tutti i parametri render
- 5 atti narrativi visivi con soglie arcPercent, scene target, palette, densityCap e camera
- Parametri dominance e lerp configurabili: dominanceThreshold, dominanceHysteresis, lerpSpeed, paletteLerpSpeed

## Task Commits

1. **Task 04-01-01: Aggiungere CFG.VISUAL config block** - `9815084` (feat) — committed in project repo `MACH:INE II/.git`

## Files Created/Modified

- `MACH:INE II/src/config.js` — added 53 lines: CFG.VISUAL block with layers, acts, dominance params

## Decisions Made

- Layer palette identities: harmony=cold, rhythm=amber, melody=magenta, master=bw — firme cromatiche coerenti con ruolo musicale di ogni layer
- 5 atti visivi: soglie arcPercent coerenti con l'arco narrativo del concerto (emergenza/discesa/macchina/intensita/dissoluzione)
- dominanceHysteresis: 0.10 — margine isteresi per prevenire flip-flop visivo tra layer con presence simile
- paletteLerpSpeed (0.015) separato da lerpSpeed (0.02) — palette cambia piu lentamente per evitare tremolio cromatico

## Deviations from Plan

None — plan executed exactly as written. Palette names (cold, amber, magenta, bw, warm, default) verificate esistenti in colors.js. Scene names (SPARSE, BAYER_CLASSIC, COLORED_GROUND, DENSE) verificate esistenti in director.js SCENES[].

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- CFG.VISUAL pronto per import in director.js (04-02)
- Tutti i parametri v3 centralizzati, zero magic numbers da inserire in implementazione director gate
- Pattern layer-prefs stabilito e documentato — 04-02 e 04-03 possono referenziare CFG.VISUAL.layers direttamente

---
*Phase: 04-integrazione-e-visual-system*
*Completed: 2026-03-27*
