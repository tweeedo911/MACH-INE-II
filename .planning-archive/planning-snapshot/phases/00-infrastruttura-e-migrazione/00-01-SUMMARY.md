---
phase: 00-infrastruttura-e-migrazione
plan: "01"
subsystem: infra
tags: [git, config, v3-migration, feature-flag]

# Dependency graph
requires: []
provides:
  - "Branch v2-archive nel repo applicazione (MACH:INE II/.git) — snapshot immutabile del codebase v2.9.0"
  - "CFG.V3_MODE: false come prima proprieta' dell'oggetto CFG in src/config.js"
affects:
  - 01-macro-compositore
  - 02-layer-system
  - 03-arco-ritmico
  - 04-visual-system

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Feature flag V3_MODE in CFG object — tutti i moduli v3 leggono CFG.V3_MODE per attivare nuovo comportamento"

key-files:
  created: []
  modified:
    - "MACH:INE II/src/config.js"

key-decisions:
  - "v2-archive creato nel repo applicazione (MACH:INE II/.git), non solo nel repo GSD — il codebase v2 e' preservato nel repo corretto"
  - "V3_MODE: false come prima proprieta' di CFG — visibilita' immediata, nessun conflitto con debug flag esistente"

patterns-established:
  - "Feature flag pattern: CFG.V3_MODE gates tutto il codice v3 senza rompere v2 esistente"

requirements-completed: [MIGR-01, MIGR-02]

# Metrics
duration: 6min
completed: 2026-03-27
---

# Phase 00 Plan 01: Archiviazione v2 e flag V3_MODE Summary

**Branch `v2-archive` su repo applicazione MACH:INE II (snapshot v2.9.0) e `CFG.V3_MODE: false` come prima proprieta' di CFG in config.js**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-27T10:06:01Z
- **Completed:** 2026-03-27T10:12:26Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Branch `v2-archive` creato nel repo applicazione (`MACH:INE II/.git`) puntando al commit `010550c` (v2.9.0) — snapshot immutabile pre-modifica
- `CFG.V3_MODE: false` aggiunto come prima proprieta' del CFG object in `src/config.js` (riga 7), con commento in inglese secondo le convenzioni del progetto
- Diff tra `v2-archive` e `main` mostra esattamente una riga aggiunta — nessun'altra modifica

## Task Commits

Ogni task committato atomicamente nel repo applicazione (`MACH:INE II/.git`):

1. **Task 1: Crea branch v2-archive (MIGR-01)** - Operazione git pura (nessun file modificato — il branch e' l'artefatto)
2. **Task 2: Aggiungi CFG.V3_MODE a config.js (MIGR-02)** - `86b5c50` (feat)

**Plan metadata:** (commit docs separato — vedi final commit)

## Files Created/Modified

- `MACH:INE II/src/config.js` — Aggiunta di `V3_MODE: false` come prima proprieta' di CFG, prima di `debug: false`

## Decisions Made

- Il repo GSD (`/Users/Edo_1/MACH-INE II/`) e il repo applicazione (`MACH:INE II/`) sono due repo git separati. Il branch `v2-archive` rilevante e' quello nel repo applicazione, che contiene il codice sorgente. Il branch e' stato creato in entrambi per completezza, ma quello che preserva il codebase v2 e' in `MACH:INE II/.git`.
- `V3_MODE` inserito come primissima proprieta' di CFG per massima visibilita' — chi legge config.js vede immediatamente il flag di versione.

## Deviations from Plan

None — piano eseguito esattamente come scritto. L'unica nota operativa e' che il piano specificava `git -C "/Users/Edo_1/MACH-INE II"` ma il repo rilevante per il codice sorgente e' `MACH:INE II/.git` (il subdirectory). Il branch e' stato creato nel repo corretto (applicazione) prima di committare la modifica, garantendo che `v2-archive` punti al commit pre-modifica.

## Issues Encountered

- Il progetto usa due repo git distinti: repo GSD per planning artifacts e repo applicazione per il codice. Il piano faceva riferimento solo al repo GSD. Branch `v2-archive` e commit config.js eseguiti nel repo applicazione (`MACH:INE II/.git`) — quello che conta per preservare il codebase v2.

## User Setup Required

None — nessuna configurazione esterna richiesta.

## Next Phase Readiness

- `v2-archive` protegge il codebase v2.9.0 intatto — rollback disponibile in qualsiasi momento
- `CFG.V3_MODE` pronto per essere letto da tutti i moduli v3 delle fasi successive
- Fase 01 (macro-compositore) puo' iniziare: il flag e' disponibile, il codice v2 e' archiviato

---
*Phase: 00-infrastruttura-e-migrazione*
*Completed: 2026-03-27*
