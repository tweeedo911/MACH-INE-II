---
plan: 04-03
phase: 04-integrazione-e-visual-system
status: complete
completed: 2026-03-27
self_check: PASSED
---

## What Was Built

Debug helper + fix clock bug + checkpoint MARC-04 approvato manualmente:

1. **window._m debug helper** — `window._m = macroState` esposto in `if (CFG.debug)` in main.js (già presente da sessione precedente)
2. **Fix critico: dt /1000 bug** — `macro-composer.js` trattava `dt` dal Worker come ms (divideva per 1000) ma il Worker lo manda già in secondi. Rimossi 4 `/1000` da macro-composer.js e 2 da main.js. Effetto: clock 1000x più lento del previsto (`barClock = 0.217` dopo 2 minuti invece di 44 bar)
3. **Fix checkpoint curve dissoluzione** — pct=0.89 e pct=0.95 aggiustati per dare a melody/textureDepth dominanza sul director (VISL-02: firma magenta prima impossibile da raggiungere)
4. **Checkpoint MARC-04 verificato** — 5 arc positions testate manualmente con window.arc()

## Commits (inner repo)

- `995a48d` — feat(04-03): add window._m debug helper + CFG.debug = true
- `2d90eb7` — fix(04-03): adjust dissoluzione checkpoints — melody layer dominance
- `ad46efa` — fix(macro-composer): remove erroneous /1000 — dt from Worker already seconds

## Key Files

- `MACH:INE II/src/macro-composer.js` — 4 occorrenze `/1000` rimosse
- `MACH:INE II/src/main.js` — 2 occorrenze `/1000` rimosse nel MIDI clock BPM lerp
- `MACH:INE II/src/config.js` — checkpoint pct=0.89 e 0.95 aggiustati

## Checkpoint MARC-04 Results

| Arc | Visual | MIDI | Errori JS |
|-----|--------|------|-----------|
| 0.00 | nero, forme bianche (SPARSE cold) | solo hat — previsto | nessuno |
| 0.25 | giallino, forme viola/grigio | drone + accordi attivi | nessuno |
| 0.55 | blu, forme grigio/bianche (harmony cold) | tutti canali attivi | nessuno |
| 0.83 | ambra, forme grigio/blu (rhythm amber) | tutti canali attivi | nessuno |
| 0.91 | magenta, forme grigio/bianche (melody magenta) | dissoluzione naturale | nessuno |

## VISL-01/02 Firme layer

- harmony → cold/blu ✓
- rhythm → amber ✓
- melody → magenta ✓ (abilitato dal fix checkpoint curve)

## Deviations

- La procedura nel PLAN usava `window._m.arcPercent = N` (non funziona, sovrascritta ogni 2ms). Corretta con `window.arc(N)` nel processo di test.
- Forensic report aggiunto in `.planning/forensics/report-20260327-182500.md` (3 anomalie documentate).

## Self-Check

- [x] window._m disponibile in console
- [x] 5 checkpoint passati senza errori JS
- [x] Visual arc riconoscibile (sparse→denso→dissoluzione)
- [x] Firme layer distinguibili (cold/amber/magenta)
- [x] MIDI multi-canale a arc(0.55) e arc(0.83)
- [x] Nessun segnale di collasso MARC-04
