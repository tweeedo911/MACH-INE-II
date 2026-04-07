# CHANGELOG

Tutte le modifiche significative al progetto MACH:INE III sono documentate qui.
Formato vagamente ispirato a [Keep a Changelog](https://keepachangelog.com/),
versioning [SemVer](https://semver.org/).

> Storia completa pre-v3.4.2 (incluso il ciclo v0.x → v2.9.x):
> [`archive/docs/old/CHANGELOG-pre-v3.4.2.md`](archive/docs/old/CHANGELOG-pre-v3.4.2.md)

---

## [v3.4.2] — 2026-04-07 — FASE 2 ristrutturazione directory

### Changed
- **`MACH:INE II/` → `app/`** — rename del root dell'app, niente più `:` e spazi nei path.
- Tutti i file morti spostati in `archive/code/dead-islands/` (14 moduli):
  `config-loader, designer, director, director-events, harmony-layer, macro-composer,
  melody-texture-layer, midi-patterns, presence-multiplier, preset-engine, presets,
  rhythm-layer, sequencer, utils`.
- `versions/` → `archive/code/versions/` (89 snapshot HTML/JS storici)
- `composer/`, `new/` → `archive/code/legacy-{composer,new}/`
- `analisi machine ii/` → `archive/analysis/`
- `midi/` → `archive/midi-exports/`
- `feedback e idee/` → `archive/feedback/`
- `designer.html, sandbox.html, test.html, test-imports.html, ruflo.config.yaml,
  *.docx, TRACK-IDENTITIES.csv` → `archive/sandbox/`
- 19 file `.md` di root (DESIGN, ROADMAP-*, RESEARCH-V4-*, SESSION-*, ENGINES_SPEC,
  PARTITURA-NARRATIVA, HANDOFF, SALVAGE, VISION-V4, ecc.) → `archive/docs/old/`
- Vecchio `CHANGELOG.md` (826 righe) → `archive/docs/old/CHANGELOG-pre-v3.4.2.md`

### Added
- `app/src/VERSION.js` — single source of truth per `APP_VERSION` (`v3.4.2`)
- `app/docs/00-VISION.md` — vision corta + puntatori a vision storica
- `app/docs/01-ARCHITECTURE.md` — pattern Band con Direttore + file map aggiornata
- `app/docs/02-MUSIC.md` — 7 tracce, 5 fasi, modal characteristic boost, regola potenze di 2
- `app/docs/03-VISUAL.md` — DNA, halftone Bayer, comp-*, firma, sistema A/B/C
- `app/docs/04-RULES.md` — versioning, commit, working mode, aree protette, code style
- `app/docs/05-ROADMAP.md` — stato corrente + prossimi step musicale/visivo/tecnico
- `app/docs/06-AGENTS.md` — skill mapping, routing subagenti, anti-pattern noti

### Aligned
- Header `src/main.js` e `src/config.js`: rimosso versioning fossile (`v4.0.0`, `v5.0.0`),
  ora puntano a `src/VERSION.js`.

### Rationale
La struttura precedente aveva:
- ~25 `.md` di root (impossibile orientarsi)
- 14 moduli morti che sembravano vivi
- Path con `:` e spazi (problemi shell, problemi git)
- Header sorgente con versioning fossile non allineato ai tag git
- `composer/`, `new/`, `versions/` come dir parallele non documentate

Post-FASE 2: root pulito (4 `.md`: README, CHANGELOG, CLAUDE, RULES), `src/` ha solo
moduli vivi, `archive/` raccoglie tutto il resto come memoria storica accessibile.

---

## [v3.4.1] — 2026-04-07 — Salvage critici (FASE 1)

### Added
- `src/firma.js` — modulo estratto da `sequencer.js` morto, esporta `firma` object
  + API `setFirma`/`pulseFirma`/`startSilenceBreath`/`updateFirma`/`setOpeningRamp`/
  `setClosingFade`/`resetFirma`/`getFirmaSnapshot`.
- `CFG.modeCharacteristicInterval` — mappa intervalli distintivi per 7 modi
  (ionian 11, dorian 9, phrygian 1, lydian 6, mixolydian 10, aeolian 8, locrian 6).
- `harmony.js _modeCharacteristicBoost(root)` — applica velocity boost alle note di
  accordo che cadono sull'intervallo distintivo del modo (salvato da `harmony-layer.js` morto).
- `tracks.js` — aggiunto `modeHint` a tutte le 7 tracce.
- `SALVAGE.md` (poi spostato in `archive/docs/old/`) — classificazione 🟥/🟧/🟨 dei
  frammenti riusabili dai 16 moduli morti.

---

## [v3.4.2] — 2026-04-07 — Firma reattivata + wired

### Fixed
- `generations.js` — sostituito `const firma = {gelo:false,convergenza:false}` fake
  locale con `import { firma } from './firma.js'`. Ora `gelo` e `convergenza` rispondono
  ai keybind live.
- `generations.js` birth rate moltiplicato per `firma.densityCap` (envelope opening/closing).
- `render.js` — aggiunto `updateFirma(globalTime)` + early-out `vuotoTotale` (blackout).

### Added
- Keybind live in `render.js`:
  - `G` → toggle `firma.gelo` (freeze entity aging + birth)
  - `J` → toggle `firma.convergenza` (attract entities to center)
  - `V` → toggle `firma.vuotoTotale` (blackout totale)

---

## [v3.4.0-wip] — 2026-04 — Visual enrichment + structural docs

- Enrich `comp-quadrati` e `comp-negativo` (breathing, sediment, camera, holes)
- `comp-liminale`: MIDI dots 2x più grandi, voice riempie il canvas, Bayer matrix sempre presente
- Zone Bayer che crescono con audio, sediment condiviso per memoria tra scene
- Glitch layer, audio reactivity, bug fixes

---

## [v3.3.0] — 2026-04-06 — A/B/C music framework

- Framework `CFG.MUSIC_EXPERIMENT` / `CFG.MUSIC_STRUCTURAL`
- Burial scatter
- 7 structural features

---

## [v3.0.0] — 2026-03 — Band con Direttore (nascita architettura)

Abbandono dell'architettura "7 motori paralleli con presence multiplier" (v2.x).
Adozione del pattern: un singolo `director3` + 5 moduli paralleli per canale + 7 comp-* visive.

---

## Pre-v3 (storia completa)

Vedi [`archive/docs/old/CHANGELOG-pre-v3.4.2.md`](archive/docs/old/CHANGELOG-pre-v3.4.2.md)
per il ciclo v0.x → v2.9.x e la diagnosi della "tabula rasa" che ha portato a v3.
