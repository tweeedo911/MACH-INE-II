# STATUS — MACH:INE III

> Snapshot vivo. Rigenerato a fine sessione. Punto di entrata di ogni nuova sessione.
> **Last updated:** 2026-04-13 (sessione 14: camera osservatore narrativo)

## Versione

**v3.8.0** — single source: `src/VERSION.js` (`APP_VERSION`)

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
                     **v3.7: density cap per ruolo, phase-aware force/decay.**
                     **v3.8: camera osservatore narrativo (camera.js).**
                     Fullscreen 16:9 senza stretch.
                     **7/7 biomi con identità radicale (v3.7.0).**
                     Phase-aware: HELPERS espone phase/rupture/energy/audioEnergy.
                     Particle pools: voice (nebulose), lead (scie), chord, arp.
                  →  camera.js — osservatore autonomo: POI detection + 5 gesti + personalità bioma
                  →  [reference] geo.js — Sistema Geometrico (Shift+G, non sviluppato)
                  →  [fallback] comp-* classiche (default, nessun toggle)
                  →  firma.js (gesti narrativi: gelo/convergenza/vuotoTotale/densityCap)
                  →  world-state.js (stato condiviso musica↔visual)
                  →  tracks.js (7 tracce con modeHint)
```

---

## Camera osservatore (v3.8.0)

| Feature | Stato |
|---|---|
| POI detection (blocchi 8×8, top 5 per densità) | ✅ |
| 5 gesti: STARE / VIAGGIARE / TUFFO / SOLLEVARE / SCANSIONE | ✅ |
| Personalità per bioma (7 config in CFG) | ✅ base — da calibrare |
| RITORNO: fullscreen → tuffo intimo → allontanamento → puntino | ✅ |
| Barrel distortion | ❌ rimosso (inutile in crop) |
| Zoom range effettivo | 0.15× – 8× |
| Interpolazione smoothstep (+ snap per MACCHINA) | ✅ |
| Esplorazione vuoto (biomi sparsi) | ✅ — fix gate densità |

---

## Stato biomi nel Campo Materiale (v3.7.0)

| Bioma | Fisica | Gesto unico | Forma dominante | Stato |
|---|---|---|---|---|
| NEBBIA | centrifuga fredda | gocce rare nel vuoto cosmico | nebulose blu effimere + stelle indaco isolate | **v3.7** — da testare |
| TESSUTO | fibra orizzontale | fibre che pulsano staccato | bande lime con varietà (continue/tratteggiate/doppie) | **v3.7** — da testare |
| SOLCO | impatto verticale + eco dub | colonne che sbattono + echi delay a destra | colonne arancio verticali + faglie kick | **v3.7** — da testare |
| RESPIRO | pressione invertita | note = buchi nella membrana | pori irregolari in membrana sage variabile | **v3.7** — da testare |
| MACCHINA | snap griglia/terminale | scansione raster + tracce circuito | tracce a L, cursore arp, colonne kick binarie | **v3.7** — da testare |
| TEMPESTA | aurora boreale + campo forza | tende di luce curve + onde pressione | archi sin bianco/carmine, anelli kick, erosione | **v3.7** — da testare |
| RITORNO | pianeta orbita | pianeta che si spegne | scintille/comete polari, archi variati | **v3.7** — da testare |

---

## Infrastruttura campo.js (v3.8.0)

| Feature | Stato |
|---|---|
| Density cap per ruolo (`bioma.maxDensity`) | ✅ penalità progressiva sulle celle sopra il tetto |
| Phase-aware force multiplier | ✅ germoglio ×0.35, rottura ×1.2, dissoluzione ×0.40 |
| Phase-aware decay offset | ✅ germoglio +0.002 (effimero), dissoluzione -0.008 (cristallizza) |
| Grid rettangolare 96×54 | ✅ |
| Camera osservatore narrativo | ✅ camera.js autonomo (v3.8.0) |
| Firma nel campo | ✅ gelo/convergenza/densityCap |
| Solidificazione 3 strati | ✅ silenzio/densità/spaziale |
| Morph colori tra biomi | ✅ 3s ease-in-out |
| getCampoDensityBlocks() | ✅ espone densità per blocco al camera system |

---

## Limiti noti

1. **Non prototipato** — resa visiva di tutti e 7 i biomi da validare live
2. **Rupture non cablata** — director3 calcola i 4 stadi ma biomi.js non li consuma ancora
3. **TEMPESTA: da verificare** — l'erosione direzionale + density cap dovrebbero risolvere il muro grigio, ma serve test live
4. **Camera personalità simili** — i movimenti camera sono funzionanti ma troppo uniformi tra biomi, da calibrare

---

## Prossimo (priorità top→bottom)

### P0 — Calibrazione camera per bioma (sessione 15)

I movimenti camera funzionano ma sono troppo simili tra biomi. Differenziare:
- NEBBIA: più lenta, hold più lunghi, zoom più profondo
- MACCHINA: snap meccanici più marcati, tempi più corti
- SOLCO: inseguimento eco dub (pan orizzontale dopo bass deposit)
- TEMPESTA: movimenti più rapidi, meno hold
- RITORNO: verificare arco completo (fullscreen → puntino) su durata reale
Test live con musica reale obbligatorio.

### P1 — Rupture nel campo

Cablare h.rupture nelle depositFn — ora che le forme sono definite, le rotture possono violarle:
- TESSUTO: fibre rompono orizzontalità (Y jitterata ±5*intensity)
- SOLCO: echo trail si moltiplica (2→6 fantasmi), massa si frammenta
- MACCHINA: snap a griglia 2 invece di 4 (binario corrotto)
- TEMPESTA: suscettibilità converge a 1.0, filamento voice enorme (30+ celle)

### P2 — Transizioni e polish

- Transizioni musicali più morbide (release naturale, ghost entrance estesa)
- Verifica hocket voice/lead TEMPESTA (mutua esclusione)
- Calibrazione proiettore (gamma, contrasto)
- Controlli live (hotkey override, density override)

---

## Stato runtime (ultimo check: 2026-04-13)

| Verifica | Stato |
|---|---|
| Campo Materiale (campo.js) | ✅ 96×54, firma, density cap, phase-aware |
| Camera osservatore (camera.js) | ✅ POI + 5 gesti + 7 personalità + RITORNO |
| 7 biomi con identità radicale | ✅ redesign v3.7.0, nessuna sovrapposizione |
| RITORNO (pianeta) | ✅ planetMask, depositFn polari, camera allontanamento |
| Firma nel campo | ✅ gelo + convergenza + densityCap + solidificazione 3 strati |
| Pannello debug | ✅ riscritto: audioEnergy, bande, rupture, firma compatta |
| Sistema Geometrico (geo.js) | ✅ funzionante — non sviluppato |
| Comp-* classiche | ✅ funzionanti (default, fallback) |

---

## File pesanti da tenere d'occhio (>500 LOC)

```
1077  src/config.js     ← OK, single source dei numeri
 618  src/tracks.js     ← OK, 7 tracce × multi-fase
~520  src/director3.js  ← alleggerito (camera spostata)
 503  src/melody-v3.js  ← valutare split
~1200 src/biomi.js      ← cresciuto con 7 biomi radicali — OK, è il catalogo
~500  src/campo.js      ← alleggerito (barrel rimosso), aggiunto density blocks
~230  src/camera.js     ← nuovo, dimensione OK
 ~380 src/geo.js        ← reference only
```

---
<!-- knowledge-graph links -->
[[DECISIONS]] [[WORKLOG]] [[01-ARCHITECTURE]] [[MOOD]] [[VISUAL-VISION]]
