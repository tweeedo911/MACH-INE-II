# STATUS — MACH:INE III

> Snapshot vivo. Rigenerato a fine sessione. Punto di entrata di ogni nuova sessione.
> **Last updated:** 2026-04-16 (sessione 26: audit visivo + perf campo + RITORNO luminoso)

## Versione

**v3.15.1** — single source: `src/VERSION.js` (`APP_VERSION`)

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
                     **v3.9: palette unificata (ex-B) + phaseColors per bioma.**
                     **v3.10: aging, bloom, erosione, shimmer, Bayer variabile,
                       BPM pulsation, geologia RITORNO, transizione gestuale.**
                     **v3.13: noise 2D non-separabile (anti-tartan),
                       glyph layer ASCII per bioma, phaseColors 5/7 biomi.**
                     **v3.14: ENCORE (8ª traccia polimetrica, 3 scale, visual RGB).**
                     Fullscreen 16:9 senza stretch.
                     **7/7 biomi con identità radicale (v3.7.0, colori v3.13.0).**
                     Phase-aware: HELPERS espone phase/rupture/energy/audioEnergy.
                     Particle pools: voice (nebulose), lead (scie), chord, arp.
                  →  camera.js — osservatore autonomo: POI + attenzione fisica + micro-drift
                  →  [reference] geo.js — Sistema Geometrico (Shift+G, non sviluppato)
                  →  [fallback] comp-* classiche (default, nessun toggle)
                  →  firma.js (gesti narrativi: gelo/convergenza/vuotoTotale/densityCap)
                  →  world-state.js (stato condiviso musica↔visual)
                  →  tracks.js (7 tracce con modeHint)
```

---

## Transizioni musicali (v3.12.0)

Sistema transizioni con **crossfade DJ** per MACCHINA→TEMPESTA. Principi:

- **CH3/CH5/CH6/CH7 = modulare** → no velocity, no ghost su questi canali
- **Ghost solo su CH0 kick (fixedNote), CH2 drone, CH4 chords** (velocity funzionante)
- **BPM ramp** calcolato col BPM di partenza, non di arrivo
- **CC123** ritardato ≥ 1 bar (SKIP per DJ crossfade MACCHINA→TEMPESTA)
- **Germoglio ramp** (25%→100% su 4 bar) previene stacchi netti

| Transizione | Exit logic | Ghost | Note |
|---|---|---|---|
| NEBBIA→TESSUTO | harmony+melody → 0 a bar -2 | CH4 chord + CH2 drone | |
| TESSUTO→SOLCO | bass → 0 a bar -7, harmony fade | CH0 kick (fixedNote 38, vel 20) | |
| SOLCO→RESPIRO | rhythm/texture/harmony fade, bass bar -3 | CH4 chord + CH2 drone | |
| RESPIRO→MACCHINA | harmony min 0.15, bass bar -2, melody fade | CH0 kick (fixedNote 38, vel 25) | |
| **MACCHINA→TEMPESTA** | **DJ 32 bar**: arp -32, harmony -24, bass -20, melody -16 | **24 bar**: drone -22, chord -12, conga -8 | **Kick continuo, no CC123, bass ghost rimosso** |
| TEMPESTA→RITORNO | rhythm fade, bass+harmony → 0 bar -3 | CH4 chord + CH2 drone | |

---

## TEMPESTA — identità ridisegnata (v3.12.0)

| Elemento | MACCHINA | TEMPESTA |
|---|---|---|
| Protagonista | Arp 16th | Voice + lead (call-response) |
| Hat | 16th pieni (meccanici) | 8th + open hat step 6,14 (dance) |
| Percussioni | Solo kick+snare+hat | + conga sincopata (step 3,11,13) |
| Bass | D, pump 5th, registro [26,45] | E, pump sub [24,43], vel ceil 110 |
| Armonia | D dorian (caldo) | E phrygian (bII = F, tensione) |
| Arp | Protagonista 16th, vel piena | Texture 8th, vel 0.35 |
| Snare | Standard (shift/skip/flam) | Granitico (tutto disabilitato) |

---

## Bass system (v3.13.0)

| Feature | Stato |
|---|---|
| Mode A.1: Rhythmic follow con `bassGrid` (TESSUTO — step 3,10 complementari a chordGrid) | ✅ |
| Mode A.2: Anchor follow (RESPIRO, RITORNO — 1 nota/accordo) | ✅ |
| Mode B: Pattern-based (SOLCO, MACCHINA, TEMPESTA) | ✅ |
| **Octave-transpose in registro** | ✅ fix: era clamp → note monotone |
| Cycle extension (V3: 1→2→4 bar) | ✅ solo pattern non locked |
| Skip probability phase-aware | ✅ germoglio 0.08 (era 0.20) |
| Gate duration phase-aware | ✅ germoglio 2.5× (era 1.5×) |
| **Ghost fill phase-aware** | ✅ zero in germoglio, cresce con fasi |
| Degradation dissoluzione | ✅ |
| Density gate follow-harmony | ✅ |

---

## Rhythm system (v3.12.0)

| Feature | Stato |
|---|---|
| Open hat per-track (`openHatSteps`) | ✅ TEMPESTA step 6,14 |
| Conga pattern per-track per fase (`congaPattern`) | ✅ TEMPESTA |
| Snare shift/skip/flam disabilitabili per-track | ✅ TEMPESTA granitico |
| Floor-kick scatter disabilitabile per-track | ✅ TEMPESTA skip |
| `initRhythm(seamless)` per DJ crossfade | ✅ no grace period |

---

## Palette unificata (v3.9.0)

Palette B consolidata inline con modifiche specifiche. Dual-palette rimossa.

| Bioma | bg | Carattere cromatico | Note |
|---|---|---|---|
| NEBBIA | nero puro [0,0,0] | drone indaco [40,45,95], voice ambra calda, lead malva (scie corte) | glifi: `∙·○` |
| TESSUTO | nero violaceo [6,4,10] | drone aubergine, bass magenta [140,55,120], chord chartreuse, lead pesca | glifi: `—|+×:` |
| SOLCO | nero terra [12,8,6] | drone indaco, bass arancio, chord blu ardesia, voice blu fredda | glifi: `\|!∙:;▼` |
| RESPIRO | nero blu [4,4,12] | drone lavanda scura [90,105,155] (phaseColors + anti-tovaglia), voice corallo | |
| MACCHINA | nero navy [8,8,20] | bass giallo, kick bianco, arp ciano, voice ambra, lead magenta | glifi: `01▸▪□×` |
| TEMPESTA | nero puro [0,0,0] | drone/chord/arp viola, bass azzurro, voice ambra, lead carmine | glifi: `▲▼▸◆!` |
| RITORNO | nero puro [0,0,0] | tutto più saturo all'inizio (phaseColors sbiadiscono) | glifi: `∙·*○∞` |

### phaseColors (v3.9 → v3.13)

Campo opzionale nei biomi. campo.js interpola colori per ruolo in base a `worldState.phase` + `phaseProgress`.
**5/7 biomi attivi:** SOLCO (bass scalda→raffredda), TESSUTO (chord evolve), RESPIRO (drone evolve),
TEMPESTA (aurora viola→incandescente→buio), RITORNO (tutto sbiadisce).

### Glyph layer (v3.13)

Pass post-Bayer: `fillText` sparse su celle ad alta densità. Configurabile per bioma:
`glyphs { roles, chars, threshold, opacity }`. Vocabolario visivo per bioma coerente con identità.

---

## Camera osservatore (v3.10.0)

| Feature | Stato |
|---|---|
| POI detection (blocchi 8×8, top 5 per densità) | ✅ |
| Modello fisico: densità+freshness→focus, curiosità/respiro→zoom | ✅ |
| Allerta: spike audio + cambio fase + rupture → reattività | ✅ |
| Micro-punch su onset forte | ✅ |
| **Micro-drift: vibrazione ±0.5% con sinusoidi (sguardo vivo)** | ✅ |
| 7 personalità bioma in config (baseZoom, drift, curiosity, breath) | ✅ |
| RITORNO: allontanamento esponenziale monotono (1.0→0.15) | ✅ |
| Zoom range effettivo | 0.15× – 8× |

---

## Infrastruttura campo.js (v3.10.0)

| Feature | Stato |
|---|---|
| Density cap per ruolo (`bioma.maxDensity`) | ✅ penalità progressiva |
| Phase-aware force multiplier | ✅ germoglio ×0.35, rottura ×1.2 |
| Phase-aware decay offset | ✅ germoglio +0.002, dissoluzione -0.008 |
| **phaseColors** | ✅ colori interpolati per fase |
| **Aging per cella** | ✅ Uint16Array, luminosità 55→100% su ~10s |
| **Bloom voice/lead/kick** | ✅ post-render, densità>0.45 → alone 4 vicini |
| **Shimmer coerente** | ✅ 3 sinusoidi lente (non Math.random) |
| **Noise 2D non-separabile** | ✅ LUT 256×256 hash, anti-tartan (v3.13) |
| **Glyph layer** | ✅ fillText sparse per ruoli, 7 vocabolari per bioma (v3.13) |
| **BPM pulsation** | ✅ luminosità ±4% sul battito |
| **Erosione dissoluzione** | ✅ celle di bordo si sgretolano |
| **Uint32Array BG fill** | ✅ ~4× più veloce |
| **Geologia RITORNO** | ✅ snapshot field al cambio bioma, render 40% |
| **Transizione gestuale** | ✅ depositFn uscente 30%→0% durante morph |
| Grid rettangolare 96×54 | ✅ |
| Camera osservatore narrativo | ✅ camera.js + micro-drift |
| Firma nel campo | ✅ gelo/convergenza/densityCap |
| Solidificazione 3 strati | ✅ silenzio/densità/spaziale |
| Morph colori tra biomi | ✅ 3s ease-in-out |
| getCampoDensityBlocks() | ✅ |
| Rupture nelle depositFn | ✅ 6/7 biomi |
| **Dissoluzione fade progressivo** | ✅ velocity ceiling 0.60→0.10 |
| **NEBBIA drone phase-aware** | ✅ coltre graduale |
| **RITORNO planetMask phase-aware** | ✅ fullscreen→puntino |

---

## Ottimizzazione render (v3.12.1 → v3.15.1)

| Fix | Impatto |
|---|---|
| ~~Bayer drift LUT~~ → **Noise 2D LUT** (256×256 hash) | anti-tartan, ampiezza 0.12, zero alloc |
| BAYER4N pre-normalizzato + `& 3` | elimina /16 e % nel loop |
| Planet mask scanline (innerR²/outerR²) | 518K sqrt+atan2 → ~5% border |
| Screen blend integer (`>> 8`) | 3× float div+mul → integer shift |
| Shimmer LUT (modulo-level) | ~124K sin → ~250 sin + 0 alloc |
| Bloom hoist + pre-scale | 0 alloc per cella |
| Monitor latenza worker→main | `[CLOCK LAG]` in console ogni ~4s |
| **v3.15.1 — Glyph globalAlpha** | fillStyle 1×/ruolo, era stringa rgba/glifo: −2/3ms densità alta |
| **v3.15.1 — Decay nested loop** | cy/cx pre-calc, niente divmod: −0.5ms/frame |
| **v3.15.1 — centerX/Y LUT** | Int32Array in `_ensureOffscreen`, riuso in 4 pass: −0.3ms |

## ENCORE v2 — Canon Machine (v3.15.0)

Pezzo opzionale post-suite, attivato con tasto `E`. Autocontenuto: non modifica i 7 biomi.

| Aspetto | Dettaglio |
|---|---|
| **Forma** | Escalation a compressione → taglio netto. ≈6 min (196 bar a 132 BPM) |
| **Motore** | Canon Machine: 5 voci suonano trasformazioni della stessa frase generata |
| **Voci** | bass 1×, chord 1× sfasata ⅓, arp 3× invertita, voice ½× retrograda, lead 2× |
| **BPM** | 132 (heartbeat ramp 60→132) |
| **Root** | C3 (MIDI 48) |
| **Scale** | 3 switchabili live: ottatonica HW (`Q`), WH (`W`), Prometheus (`R`) |
| **Escalation** | arp → bass → hat/snare → voice → lead → chord/drone → conga → plateau |
| **Frasi** | 7-13 note, regole contorno (step 70%, skip 20%, leap 10%), closure consonante |
| **Convergenze** | ≥3 voci su stessa pitch class → flash fullscreen bianco |
| **Visual** | Geometrie a blocchi Ikeda-style: riga/diagonale/quadrante/arco/croce. B/N + RGB raro |
| **Camera** | Fissa (zoom 1.0, centro, nessun movimento) |
| **Fine** | Taglio netto — nessuno smontaggio |

### Tasti ENCORE

| Tasto | Azione |
|---|---|
| `E` | Lancia encore (solo quando fermo o RITORNO finito) |
| `Q` | Scala half-whole (default) |
| `W` | Scala whole-half |
| `R` | Scala Prometheus |
| `Space` | Stop forzato |

> **v3.15.1:** la suite si ferma automaticamente alla fine di RITORNO. ENCORE NON parte
> più da solo — solo via tasto `E`. Vedi `_advanceTrack()` in director3.js:648-660.

---

## Limiti noti

1. **TEMPESTA da calibrare live** — chordGrid staccato, bass melodico, rottura voice+lead
2. **Glyphs da calibrare** — visibili ora (auto-contrasto), densità/opacity da validare
3. **Camera nuovi parametri da calibrare** — zoom abbassato, drift alzato — verificare con proiettore
4. **RESPIRO anti-tovaglia da calibrare** — drone scuro + noise spaziale ×2 — verificare se basta
5. **campo.js ~1040 LOC** — ottimizzato perf, monitorare su hardware live
6. **ENCORE v2 da testare live** — canon engine, convergenze, visual geometriche, taglio netto

---

## Prossimo (priorità top→bottom)

### P0 — Test live v3.15.1

Verificare le modifiche della sessione 26:
- Glyphs ancora visibili con alpha corretta (no regressione dopo passaggio a globalAlpha)
- Bloom voice/lead/kick invariato (dopo LUT centerX/Y)
- Decay + shimmer biomi fluido (dopo conversione nested loop)
- RITORNO: pianeta più leggibile in proiezione durante dissoluzione
- Stop a fine RITORNO: no glitch audio, ENCORE lanciabile a mano con `E`
- [CLOCK LAG] ridotto: recupero ~3ms/frame stimato

### Bug aperti da audit (sessione 26) — da fix se servono

- **C1**: `midi-clock.worker.js:17` — postMessage senza transferable → ~4-8 MB/min GC churn (set 45+ min)
- **C2**: devicePixelRatio non gestito — su retina display render fisico raddoppiato
- **M1**: camera micro-punch `spike*0.03` impercettibile (alzare a 0.08-0.12)
- **M2**: camera scan ogni frame — throttle 1/4 per −1.5ms/frame

### P1 — Test live ENCORE v2

Primo test Canon Machine con musica reale. Verificare:
- Heartbeat: kick + polvere percussiva, BPM 60→132
- Escalation: arp (diagonali) → bass (mezzi schermi) → ritmo → voice (archi) → lead (croci) → chord (quadranti) → conga
- Canon: le 5 voci suonano trasformazioni della stessa frase (riconoscibile?)
- Convergenze: flash bianco fullscreen quando ≥3 voci convergono
- Plateau: frasi nuove ogni 4 bar, convergenze frequenti
- Taglio netto: nero istantaneo, silenzio, fine
- Q/W/R: cambio scala → nuova frase sulla nuova scala
- Visual: B/N dominante, RGB emerge solo a velocity forte
- Console: `[DIR3] ENCORE new phrase` con note diverse ad ogni ciclo

### P1 — Test live suite v3.15.0

Tutti i 7 biomi con musica reale. Verificare che l'encore v2 non abbia rotto nulla.

### P2 — Calibrazione fine

Camera, RESPIRO anti-tovaglia, NEBBIA dissoluzione.
ENCORE: velocity per voce, lunghezza frasi, timing brick, visual geometriche.

### P3 — Polish

- Calibrazione proiettore (gamma, contrasto)
- Controlli live (hotkey override, density override)

---

## Stato runtime (ultimo check: 2026-04-16)

| Verifica | Stato |
|---|---|
| Campo Materiale (campo.js) | ✅ 96×54, firma, density cap, phase-aware, **v3.14: aging invertito, heartbeat deposit, shimmerScale** |
| Camera osservatore (camera.js) | ✅ POI + attenzione + micro-drift + **v3.14: bypass fisso in encoreMode** |
| Transizioni musicali | ✅ **v3.13: bass ghost DJ rimosso, Wall of Sound solo CH2/CH4** |
| TEMPESTA | ✅ **v3.13: chordGrid staccato, bass melodico, rottura voice+lead** |
| Bass system | ✅ **v3.14: + ciclo 12 step (3/4) per encore** |
| Rhythm system | ✅ **v3.14: + hat 5/8, conga 7-step per encore** |
| Harmony system | ✅ **v3.14: + ciclo 14 step (7/8), progressioni ottatoniche** |
| Melody system | ✅ **v3.14: + arp 22 step (11/16), voice 26 step (13/16)** |
| **ENCORE v2** | ✅ **v3.15: Canon Machine — 5 voci canoniche, visual geometriche, taglio netto** |
| 7 biomi con identità radicale | ✅ redesign v3.7.0, palette v3.13.0, glifi+phaseColors |
| RITORNO (pianeta) | ✅ planetMask, phaseColors, **geologia accumulata** |
| Firma nel campo | ✅ gelo + convergenza + densityCap + solidificazione 3 strati |
| Pannello debug | ✅ riscritto: audioEnergy, bande, rupture, firma compatta |
| Sistema Geometrico (geo.js) | ✅ funzionante — non sviluppato |
| Comp-* classiche | ✅ funzionanti (default, fallback) |

---

## File pesanti da tenere d'occhio (>500 LOC)

```
1278  src/config.js     ← OK, single source dei numeri
 ~730 src/tracks.js     ← +ENCORE track definition, 3 scale, pattern polimetrici
~1090 src/director3.js  ← +encore state machine (10 brick, teardown)
  617 src/melody-v3.js  ← +encore arp/voice con cicli variabili
~1690 src/biomi.js      ← 8 biomi (7 + ENCORE), phaseColors 5/7, glyphs 8/8
~1020 src/campo.js      ← ottimizzato + noise 2D + glyph layer
~300  src/bass-v3.js    ← cresciuto con skip/duration/degradation
 238  src/camera.js     ← OK
 674  src/geo.js        ← reference only
```

---
<!-- knowledge-graph links -->
[[DECISIONS]] [[WORKLOG]] [[01-ARCHITECTURE]] [[MOOD]] [[VISUAL-VISION]]
