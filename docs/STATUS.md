# STATUS — MACH:INE III

> Snapshot vivo. Rigenerato a fine sessione. Punto di entrata di ogni nuova sessione.
> **Last updated:** 2026-04-13 (sessione 16: calibrazione personalità camera)

## Versione

**v3.8.1** — single source: `src/VERSION.js` (`APP_VERSION`)

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
                  →  camera.js — osservatore autonomo: POI + 7 azioni + grammatica per bioma
                  →  [reference] geo.js — Sistema Geometrico (Shift+G, non sviluppato)
                  →  [fallback] comp-* classiche (default, nessun toggle)
                  →  firma.js (gesti narrativi: gelo/convergenza/vuotoTotale/densityCap)
                  →  world-state.js (stato condiviso musica↔visual)
                  →  tracks.js (7 tracce con modeHint)
```

---

## Camera osservatore (v3.8.1)

| Feature | Stato |
|---|---|
| POI detection (blocchi 8×8, top 5 per densità) | ✅ |
| 7 azioni: STARE / VIAGGIARE / TUFFO / SOLLEVARE / SCANSIONE / echoChase / breathe / snapJump | ✅ |
| Grammatica `afterStare` per bioma (weighted pick) | ✅ calibrata |
| 6 personalità distinte + RITORNO speciale | ✅ |
| Zoom rallentato globale (TUFFO 4-6s, SOLLEVARE 4-8s base) | ✅ |
| RITORNO: fullscreen → tuffo intimo → allontanamento → puntino | ✅ |
| Zoom range effettivo | 0.15× – 8× |
| Interpolazione smoothstep (+ snap per MACCHINA) | ✅ |

### Personalità camera per bioma

| Bioma | Carattere | Azione dominante |
|---|---|---|
| NEBBIA | contemplativa, quasi ferma | 50% stare ripetuto, hold 10-18s |
| TESSUTO | segue fibre H, cambia fascia | 45% scan H, 35% travel |
| SOLCO | insegue eco dub | 50% echoChase (pan destra) |
| RESPIRO | respiro ciclico | 45% breathe (zoom parziale), mai sotto 1.5× |
| MACCHINA | cursore discreto | 85% snapJump (snap easing) |
| TEMPESTA | rapida, grandangolare | 70% travel, hold 1.5-2.5s |
| RITORNO | allontanamento monotono | logica speciale (fullscreen → puntino) |

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

## Infrastruttura campo.js (v3.8.1)

| Feature | Stato |
|---|---|
| Density cap per ruolo (`bioma.maxDensity`) | ✅ penalità progressiva sulle celle sopra il tetto |
| Phase-aware force multiplier | ✅ germoglio ×0.35, rottura ×1.2, dissoluzione ×0.40 |
| Phase-aware decay offset | ✅ germoglio +0.002 (effimero), dissoluzione -0.008 (cristallizza) |
| Grid rettangolare 96×54 | ✅ |
| Camera osservatore narrativo | ✅ camera.js autonomo (v3.8.1, grammatica per bioma) |
| Firma nel campo | ✅ gelo/convergenza/densityCap |
| Solidificazione 3 strati | ✅ silenzio/densità/spaziale |
| Morph colori tra biomi | ✅ 3s ease-in-out |
| getCampoDensityBlocks() | ✅ espone densità per blocco al camera system |
| Rupture nelle depositFn | ✅ 6/7 biomi (RITORNO skip — nessuna rottura musicale) |

---

## Limiti noti

1. **Non prototipato** — resa visiva di tutti e 7 i biomi da validare live
2. **TEMPESTA: da verificare** — erosione + rupture da testare con musica reale

---

## Prossimo (priorità top→bottom)

### P0 — Test live tutti i biomi con musica reale

Validare la resa visiva di biomi + rupture + camera con musica reale.
In particolare: TEMPESTA rupture (suscettibilità converge a 1.0, filamenti enormi),
RESPIRO rupture (pori che non si chiudono), MACCHINA rupture (binario corrotto).
RITORNO: verificare arco completo (fullscreen → puntino) su durata reale.

### P1 — Transizioni e polish

- Transizioni musicali più morbide (release naturale, ghost entrance estesa)
- Verifica hocket voice/lead TEMPESTA (mutua esclusione)
- Calibrazione proiettore (gamma, contrasto)
- Controlli live (hotkey override, density override)

---

## Stato runtime (ultimo check: 2026-04-13)

| Verifica | Stato |
|---|---|
| Campo Materiale (campo.js) | ✅ 96×54, firma, density cap, phase-aware |
| Camera osservatore (camera.js) | ✅ POI + 7 azioni + grammatica per bioma (v3.8.1) |
| 7 biomi con identità radicale | ✅ redesign v3.7.0, nessuna sovrapposizione |
| RITORNO (pianeta) | ✅ planetMask, depositFn polari, camera allontanamento |
| Firma nel campo | ✅ gelo + convergenza + densityCap + solidificazione 3 strati |
| Pannello debug | ✅ riscritto: audioEnergy, bande, rupture, firma compatta |
| Sistema Geometrico (geo.js) | ✅ funzionante — non sviluppato |
| Comp-* classiche | ✅ funzionanti (default, fallback) |

---

## File pesanti da tenere d'occhio (>500 LOC)

```
1278  src/config.js     ← OK, single source dei numeri (camera grammar aggiunta)
 658  src/tracks.js     ← OK, 7 tracce × multi-fase
 705  src/director3.js  ← alleggerito (camera spostata)
 617  src/melody-v3.js  ← valutare split
1432  src/biomi.js      ← cresciuto con 7 biomi radicali — OK, è il catalogo
 670  src/campo.js      ← alleggerito (barrel rimosso), aggiunto density blocks
 297  src/camera.js     ← cresciuto con _shotFromAction, dimensione OK
 674  src/geo.js        ← reference only
```

---
<!-- knowledge-graph links -->
[[DECISIONS]] [[WORKLOG]] [[01-ARCHITECTURE]] [[MOOD]] [[VISUAL-VISION]]
