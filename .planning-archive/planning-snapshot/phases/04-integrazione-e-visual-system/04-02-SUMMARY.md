---
plan: 04-02
phase: 04-integrazione-e-visual-system
status: complete
completed: 2026-03-27
self_check: PASSED
---

## What Was Built

V3 gate completo in `director.js`:

1. **Import macroState** — `import { macroState } from './macro-composer.js'` aggiunto
2. **Stato interno V3** — `_v3DominantLayer`, `_v3LastAct`, `_v3LerpState` dichiarati
3. **`_getV3Act(arcPct)`** — mappa arcPercent → atto narrativo (I-V)
4. **`_getDominantLayer()`** — determina layer dominante con isteresi da macroState
5. **`_updateDirectorV3(dt)`** — applica LAYER_PREFS con lerp su engineRender + scena/palette/camera da arcPercent
6. **V3 gate in `updateDirector()`** — `if (CFG.V3_MODE) { _updateDirectorV3 } else { ENGINE_PREFS block v2 }`
7. **Density clamping bypass** — `arcParams` elevato a scope condiviso; V3_MODE usa `densityCap` degli atti, v2 usa ARC_PARAMS

## Commits

- `a6bd6f4` — feat(04-02): import macroState e stato interno V3 in director.js
- `c6a21db` — feat(04-02): implement V3 gate in director.js — _updateDirectorV3, dominance logic, 5-act arc, density clamping bypass

## Key Files

- `MACH:INE II/src/director.js` — +125 righe, nessuna rimozione

## Deviations

- `arcParams` spostato fuori dall'`else` V3_MODE (scope corretto) — era usato anche nel beat accumulator, fuori dal blocco density clamping

## Self-Check

- [x] `_updateDirectorV3` presente
- [x] `_getDominantLayer` con isteresi implementata
- [x] `_getV3Act` implementata
- [x] `import { macroState }` presente
- [x] `CFG.V3_MODE` gate in updateDirector
- [x] `CFG.VISUAL` usato per LAYER_PREFS e atti
- [x] ENGINE_PREFS v2 intatto dentro else
- [x] render.js, field.js, colors.js NON modificati
