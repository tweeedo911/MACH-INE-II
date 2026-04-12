# STATUS — MACH:INE III

> Snapshot vivo. Rigenerato a fine sessione. Punto di entrata di ogni nuova sessione.
> **Last updated:** 2026-04-12 (sessione 10: cablaggio infrastrutturale campo)

## Versione

**v3.4.3-wip** — single source: `src/VERSION.js` (`APP_VERSION`)

Tag git: `v3.4.2` su `ccbbb13` (ultimo tag stabile).
Branch attivo: `machine-iii`.

---

## Architettura attiva

**Pattern:** Band con Direttore (Path B confermato — `DECISIONS.md #004`)

```
director3.js      →  5 moduli musicali (rhythm, harmony, bass, melody, texture)
                  →  Campo Materiale (campo.js + biomi.js) — PARADIGMA DEFINITIVO
                     Toggle: Shift+C. 96×54 Float32Array per ruolo, Bayer halftone,
                     cellPx variabile per ruolo (6-20px), decay + shimmer + audioReact.
                     Firma cablata: gelo/convergenza/densityCap.
                     Solidificazione 3 strati: silenzio/densità/spaziale.
                     Fullscreen 16:9 senza stretch.
                     **7/7 biomi implementati.** Calibrazione live da fare.
                  →  [reference] geo.js — Sistema Geometrico (Shift+G, non sviluppato)
                  →  [fallback] comp-* classiche (default, nessun toggle)
                  →  firma.js (gesti narrativi: gelo/convergenza/vuotoTotale/densityCap)
                  →  world-state.js (stato condiviso musica↔visual)
                  →  tracks.js (7 tracce con modeHint)
```

---

## Stato biomi nel Campo Materiale

| Bioma | Stato | Firma | cellPx override | Prossimo |
|---|---|---|---|---|
| NEBBIA | implementato | default | drone=20, voice=6, lead=7, chord=12 | calibrazione live |
| TESSUTO | implementato | default | default | calibrazione live |
| SOLCO | calibrato, palette riscaldata | default | default | calibrazione fine |
| RESPIRO | implementato (invertito) | densityThreshold=0.9 | default | calibrazione live |
| MACCHINA | implementato | spatial=false | uniforme 10px | calibrazione live |
| TEMPESTA | implementato | roleEnabled=false | default | density cap + calibrazione |
| RITORNO | implementato | globalFactor=0.5 | default | camera orbitale + calibrazione |

---

## Funzionalità sessione 10 (cablaggio infrastrutturale)

- **Grid rettangolare 96×54** — true 16:9, offscreen 960×540, zero stretch
- **cellPx per ruolo** — grana variabile (drone=16 grosso → arp=6 fine), override per bioma
- **Firma nel campo** — gelo (freeze totale), convergenza (attrazione centro), densityCap (gate probabilistico)
- **Solidificazione 3 strati** — silenzio cristallizza, densità alta stabilizza, parte bassa sedimenta
- **Convergenza automatica** — director3 attiva convergenza nell'ultimo 15% della dissoluzione
- **freeze override per bioma** — MACCHINA no stratigrafia, TEMPESTA nulla cristallizza, RESPIRO solo altissime, RITORNO tutto solidifica 50%

---

## Funzionalità sessione 9

- **localPitchToCell(note, lo, hi)** — mapping registro locale, 25 celle per ruolo (era 4)
- **audioReact** — callback per-bioma ogni frame, modulato da worldState.audioEnergy
- **Campo fullscreen** — stretch su tutto il canvas (ora rettangolare senza stretch)
- **_campoActiveTrack** — fix bug: tracker separato per setBiome nel campo

---

## Limiti noti

1. **TEMPESTA saturazione** — densità 0.95 su tutti i ruoli → rischio grigio uniforme (mitigato da freeze.roleEnabled=false)
2. **RESPIRO monocromatico** — solo drone renderizza, potrebbe sembrare piatto
3. **Non prototipato** — resa visiva da validare live traccia per traccia
4. **Camera assente** — il campo è sempre a zoom 1.0, nessun macro/orbita
5. **RITORNO non è orbita** — implementato come bioma, non come zoom-out del pianeta
6. **Rupture non cablata nel campo** — director3 calcola i 4 stadi ma biomi.js non li consuma

---

## Prossimo (priorità top→bottom)

### P0 — Camera nel campo (sessione 11)

Spec approvata: `docs/superpowers/specs/2026-04-12-camera-campo-design.md`
- 3 regimi: normale (1.0), macro (1.5-2.0×), orbita (0.3-0.5×)
- Barrel distortion via LUT precalcolata (solo RITORNO)
- Pilotaggio automatico da director3 per fase
- Drift circolare in densità (r=0.1, periodo 30s)
- Macro condizionale: solo dopo densità media >0.05
- RITORNO: zoom 1.0→0.3 + barrel 0→0.6 progressivo
- File: world-state.js, campo.js, director3.js, (config.js opzionale)

### P1 — Calibrazione visiva live

Testare ogni bioma con musica reale (Shift+C, scorrere tracce 1→7).
Per ogni bioma annotare: cosa funziona, cosa no, candidato per redesign.
Ora con firma + grana variabile il test è significativo.

### P2 — Rupture nel campo

Cablare worldState.rupture.intensity in biomi.js:
- Modulare decay, force, colori durante i 4 stadi di rottura
- Effetti per-bioma (nebulose si moltiplicano, binario si corrompe, etc.)

### P3 — Density cap TEMPESTA

Impedire saturazione uniforme al picco.
Gate probabilistico su feedNote e/o cap per ruolo.

### P4 — Lato musicale

- Tuning densità tra le 7 tracce
- Transizioni smooth (fade tra fasi)
- Silenzi strutturali via firma.densityCap
- Durata 45-60 min da verificare

---

## Documenti di riferimento

- `docs/MOOD.md` — ritratto musicale 7 tracce (essenza + strumenti + arco + narrativa)
- `docs/VISUAL-VISION.md` — visione visiva definitiva (pianeta, biomi, fisica)
- `docs/superpowers/specs/2026-04-12-campo-infrastruttura-design.md` — spec cablaggio campo
- `docs/superpowers/plans/2026-04-12-campo-infrastruttura.md` — piano implementativo
- `ispirazioni-machne/` — moodboard Pinterest, visioni poetiche

---

## Stato runtime (ultimo check: 2026-04-12)

| Verifica | Stato |
|---|---|
| Campo Materiale (campo.js) | ✅ 96×54 rettangolare, firma cablata, cellPx per ruolo |
| 7 biomi con CELLS_X/CELLS_Y | ✅ tutte le depositFn aggiornate |
| Firma nel campo | ✅ gelo + convergenza + densityCap + solidificazione 3 strati |
| freeze override per bioma | ✅ NEBBIA/RESPIRO/MACCHINA/TEMPESTA/RITORNO |
| Convergenza auto dissoluzione | ✅ ultimo 15% fase dissoluzione |
| Sistema Geometrico (geo.js) | ✅ funzionante — non sviluppato |
| Comp-* classiche | ✅ funzionanti (default, fallback) |
| Pannello debug (D) | ✅ aggiornato |
| HUD barra stato | ✅ mostra [GEO]/[CAMPO]/[COMP] |
| Toggle Shift+C / Shift+G | ✅ mutuamente esclusivi |

---

## File pesanti da tenere d'occhio (>500 LOC)

```
1077  src/config.js     ← OK, single source dei numeri
 618  src/tracks.js     ← OK, 7 tracce × multi-fase
 521  src/director3.js  ← valutare split
 503  src/melody-v3.js  ← valutare split
~730  src/biomi.js      ← cresciuto con 7 biomi + freeze/cellPx — OK, è il catalogo
~310  src/campo.js      ← cresciuto con firma/solidificazione — monitorare
 ~380 src/geo.js        ← reference only
```

---
<!-- knowledge-graph links -->
[[DECISIONS]] [[WORKLOG]] [[01-ARCHITECTURE]] [[MOOD]] [[VISUAL-VISION]]
