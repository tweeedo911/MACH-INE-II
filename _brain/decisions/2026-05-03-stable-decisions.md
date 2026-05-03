# Decisioni cristallizzate — promosse 2026-05-03

> Sintesi delle decisioni rimaste stabili per ≥2 milestone. Pointer
> a `docs/DECISIONS.md` per la motivazione completa e il contesto storico.

## Setup e workflow (FASE 0-5, 2026-04-07)

- **#001** — Repo Git unico (cancellata outer `.git` GSD), storia preservata in `.planning-archive/GSD-history.txt`.
- **#002** — Versioning reconciliato retroattivamente: `src/VERSION.js` come single source.
- **#003** — Path B confermato: **Band con Direttore** (V3 Layer System mai costruito → `.planning-archive/`).
- **#004** — `firma` modulo standalone in `src/firma.js` (estratto da `sequencer` archiviato).
- **#005** — Modal characteristic note boost via `CFG.modeCharacteristicInterval` + `tracks.modeHint`.
- **#006** — Directory `MACH:INE II/` → `app/` (path senza `:` né spazi).
- **#007** — Regola "nulla si elimina, tutto si archivia": `archive/code/`, `archive/docs/old/`, `archive/sandbox/`.
- **#008** — Workflow management: `STATUS.md` + `WORKLOG.md` + `DECISIONS.md` (3 file, no tool esterni).

## Visual paradigm

- **#015** — **Campo Materiale è il paradigma visivo definitivo** (`campo.js` + `biomi.js`). Sistemi alternativi (`geo.js` 3D, `comp-*` classiche) restano come fallback/reference, non si sviluppano oltre. Conseguenza: 6 prototipi 3D archiviati in `archive/sandbox/proto-3d/` (Fase C, 2026-05-03).

## SC audio engine (sessione 32, v3.20.0-rc1→rc3)

- **#033** — Wave A: SC drone biome morphing live. `app/sc/drone.scd` + `biome-presets.scd` + `machine-engine.scd` + WS↔OSC bridge `app/bridge/`. Hook in `director3` via `app/src/sc-out.js`. Filosofia: "orchestra ereditaria del bioma" (8 SynthDef-base parametrizzati, bioma = stato persistente con `Lag3` 18s morphing).
- **#034** — Wave B: drone enrichment (sub/shimmer/filter LFO) + kick + bass + chord one-shot SynthDef.
- **#035** — Wave C: voice + lead + arp + perc kit (hat/openhat/snare/conga). Suite SC completa 10 ruoli × 7 biomi.

## Pulizia 2026-05-03 (questa sessione, riferimenti all'audit)

- **Phase A** — version sync v3.20.0-rc3, `_brain/` sotto git, 672MB dump pesanti spostati a `~/Backups/MACHINE-III-archive-2026-05-03/`.
- **Phase B** — refactor V3-only: archiviati `bass.js`/`bass-v2.js`/`melody.js`/`melody-v2.js`. Selettori `STRUCTURAL→V3` rimossi da `main.js` e `director3.js`. Flag `MUSIC_STRUCTURAL`/`MUSIC_EXPERIMENT` mantenuti (load-bearing in `rhythm.js`, `harmony.js`, `tracks.js`, `director3.js` linee 406/435/585/1097, `bass-v3.js` linee 221/325).
- **Phase C** — archiviati 6 proto 3D + sistema SC parallelo `machine-orchestra/` + revert `orchestra-out.js` a v3.17.1.
- **Phase D** — push 86 commit + 7 tag su `origin/machine-iii`, worktree `app-experimental/` rimosso.
