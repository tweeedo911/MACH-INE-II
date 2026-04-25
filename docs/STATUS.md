# STATUS — MACH:INE III (branch machine-iii, v3.19.0-rc2)

> Snapshot vivo. Rigenerato a fine sessione. Punto di entrata di ogni nuova sessione.
> **Last updated:** 2026-04-25 (sessione 31: Wave 1 completa — feel + curve + arc + ghost + euclidei)

## Versione

**v3.19.0-rc2** — single source: `src/VERSION.js` (`APP_VERSION`). Da soundcheck → stable.
Wave 1 completa (1A-E). Baseline precedente `v3.18.0` (tag su `cda67a8`).

## Novità v3.19.0-rc2 (sessione 31, 2026-04-25) — Wave 1D + 1E

- **1D — Chord ghost phase-aware:** `phaseGhostScale(phase)` esteso al ghost di
  chordGrid (TESSUTO, TEMPESTA). Germoglio off, densità ×1.5, dissoluzione 0.3.
- **1E — Hat euclidei evolutivi:** `euclidean(K,N)` + `euclideanEvolve(K1,K2,N,prog)`
  in toolkit. Tracce SOLCO + TESSUTO ora usano `hatEuclideanByPhase` invece del
  default. SOLCO acquisisce E(5,16)/E(7,16) tresillo cubano in densità. Cache per
  bar in rhythm.js (rigenerato a boundary di bar). MACCHINA/TEMPESTA mantengono
  hatPatterns hardcoded (identità preservata).

## Novità v3.19.0-rc1 (sessione 31, 2026-04-25) — Wave 1 upgrade musicale

Risposta richiesta utente "musicalmente più avanzato, meno scontato". Wave 1 = ritmica
+ espressione (basso costo / payoff immediato). Vedi `DECISIONS.md` #031.

- **1A — Microtiming feel per traccia:** `humanize.feel` (ms) + jitter sistematico via
  `setTrackTiming` in midi.js. Ogni traccia ha identità temporale distinta:
  - SOLCO +5, TESSUTO +6, RITORNO +4 (laid-back)
  - MACCHINA -3, TEMPESTA -4 (push)
  - NEBBIA / RESPIRO / ENCORE 0 (centrati)
  Drum kit ch 0/1 = solo feel (no jitter, polso rigido). Ch >=2 = feel + jitter gaussiano.
- **1B — Progression arc + breath multiplier:**
  - `progressionArc(idx, count)` su chord (rhythmic + sustained): ciclo armonico ora ha
    arco dinamico question→peak→answer→close (es. 4-chord [0.88, 1.0, 0.96, 0.80]).
  - `breathMultiplier(bar, 16)` su arp ostinato: respira ogni 16 bar (lift-off / full / dip).
- **1C — Velocity curve per traccia:** `track.velocityCurve` (`easeIn` / `easeOut` /
  `easeInOut`). NEBBIA/RESPIRO/RITORNO carezza; MACCHINA/TEMPESTA esplodono;
  SOLCO/TESSUTO/ENCORE bilanciati. Pattern `shapedDensity = ease(density, curveType)`
  sostituisce `density` raw in voice/lead/arp/chord vel mapping.
- **Toolkit dedicato:** `src/composition-toolkit.js` (subset runtime) — `ease`, `velocityCurve`,
  `humanizeMs`, `breathMultiplier`, `progressionArc`. Estendibile per Wave 2.

## Novità v3.18.0 (sessione 29, 2026-04-18) — merge + fix visuali

Branch principale `machine-iii` ora include tutto il lavoro v3.18. Worktree
experimental `/Users/Edo_1/MACH-INE II/app-experimental/` lasciato come backup
(rimovibile post test live con `git worktree remove ../app-experimental`).

## Novità v3.18.0 (sessione 29, 2026-04-18) — merge + fix visuali

- **Fix NEBBIA:** `campo.js:891` dead code risolto. `isNebbiaRadial` ora usa fallback
  `_biomaName === 'NEBBIA'` come MACCHINA/TEMPESTA. Dither radiale concentrico su voice
  finalmente attivo in live (era progettato ma mai cablato).
- **Fix RITORNO:** geologia cumulativa percettivamente amplificata. 4 tuning numerici in
  `campo.js`: MERGE 0.35→0.52, DECAY 0.92→0.94, alpha 0.40→0.58, gate `d*1.7`, threshold
  cella 0.05→0.02. Pixel visibili del substrate da ~2/16 a ~5/16.
- **Merge** v3.18-experimental → machine-iii (`95b54b4`), bump stable v3.18.0 (`cda67a8`).
  Commit del fix: `165023c`. Tag `v3.18.0`.
- **Launcher definitivo**: `/Users/Edo_1/MACH-INE II/machine-launch.command` (doppio-click
  Finder o CLI) + wrapper `app/launch.sh`. HUD hotkey v3.18 completa (performer ←/→/↑/↓/M/N,
  nodo ternario 1/2/3 in TEMPESTA, pre-suite Shift+0, PANIC Shift+Z, soundcheck T, firma G/J/V).
  Flag CLI: `--presuite`, `--seed N`, `--norns`, `--no-browser`.

## Debiti visivi noti (non bloccanti)

- `rupture.stage === 'infiltration'` (20-50% durata rottura) — invisibile sul field
- `rupture.stage === 'residue'` (80-100% durata) — solo `comp-griglia`, nessuna eco sul field
- 3 biomi (SOLCO / TESSUTO / RESPIRO) senza linguaggio radicale Bayer-breaking (solo
  MACCHINA grid / NEBBIA radial / TEMPESTA vector sono radicali)

## Sessione 28 — Fix audit Opus 4.7 (6 commit + review)

| Wave | Cluster | Commit | File |
|---|---|---|---|
| 1A | Musica: rupture cablata + humanize per-traccia | `a156342` | bass-v3, melody-v3, harmony, rhythm, tracks |
| 1B | Visuale: geologia RITORNO cumulativa + flag biomi + omen | `361e747` | campo.js |
| 1B-bis | Visuale: cablaggio flag B2/B3 nel render loop | `5040125` | campo.js |
| 1D.1 | Runtime: ring buffer notes + SeededRNG + PANIC lookahead | `0164c32` | midi, config, perf-utils |
| 1D.2 | Runtime: hidden guard + HUD + panic Shift+Z + seed URL + audio ring | `8ebd33f` | main, audio, midi, index.html |
| 2C | Drammaturgia: nodo ternario + hotkey + pre-suite + sub tactile | `ed71a7f` | director3, main, harmony, bass-v3, tracks, world-state |
| 3R | Review finale + docs/V3.18-AUDIT.md | `22b06c1` | docs/V3.18-AUDIT.md |

**Verdetto Wave 3R:** GO-with-caveats. Zero issue bloccanti. 5 warning non critici.
Report completo in `docs/V3.18-AUDIT.md`.

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

## Ottimizzazione render (v3.12.1 → v3.16.0)

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
| **v3.16.0 — Worker 5ms + postMessage primitivo** | 500Hz→200Hz, zero alloc per tick, ~60% meno carico music pipeline su main |
| **v3.16.0 — Norns bridge no-op** | elimina `{type,note,vel}` alloc per nota CH2 + check WebSocket |
| **v3.17.0 — Crispness pass**: CSS `image-rendering: pixelated` (index+projector), `_DRIFT_AMP` 0.12→0.05, glyph cycling 16f→64f, bloom thresh 0.45→0.55 | halftone Bayer netto su retina/proiettore, meno sfrigolio granuloso, glifi più stabili, alone solo su picchi |
| **v3.17.1 — Anti-tovaglia**: SOLCO `maxDensity` drone/bass/chord, TESSUTO drone probabilistico 45% + bass width 25-50% + maxDensity, RESPIRO baseTarget ancora più basso + spatial ±0.44 non-separabile, `_DRIFT_AMP` 0.05→0.07 | SOLCO/TESSUTO/RESPIRO smettono di essere "wallpaper uniforme", campo respira con vuoti reali |

## Clock/MIDI sync (v3.16.0)

| Elemento | Scheduling | Note |
|---|---|---|
| MIDI clock (0xF8) | lookahead 100ms | invariato — hardware-timed |
| MIDI Start (0xFA) | lookahead 15ms | allineato al primo tick |
| MIDI Stop (0xFC) | lookahead 15ms | coerente con note pending |
| Note On/Off | **lookahead 15ms** ✅ v3.16 | era immediate → slittava con main saturo |
| CC (es. CC123) | **lookahead 15ms** ✅ v3.16 | coerente con note |
| Pitch Bend | **lookahead 15ms** ✅ v3.16 | coerente con note |
| Worker tick | **5ms (200Hz)** ✅ v3.16 | era 2ms (500Hz), `postMessage(now)` primitivo |

> Latenza costante 15ms su tutto l'output MIDI → sync fisso clock↔note anche
> sotto spike di lag fino a 15ms. Compensabile in DAW se il monitoring lo richiede.

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

## Prossimo (priorità top→bottom) — v3.19.0-rc1 → stable

### P0 — Test live Wave 1 (v3.19.0-rc1)

Soundcheck `T` + suite breve per validare le 3 modifiche musicali della Wave 1:

**1A Microtiming feel (timing identitario per traccia):**
- TEMPESTA -4ms / MACCHINA -3ms percepibile come "push avanti al beat"?
- SOLCO +5ms / TESSUTO +6ms percepibili come "laid-back / sospeso"?
- Drum kit (ch 0/1) deve restare in griglia rigida (solo feel, no jitter).
- Listening test con DAW per quantificare lo shift relativo al MIDI clock.

**1B Progression arc + arp breath:**
- L'arpeggio ostinato di MACCHINA respira ogni 16 bar (lift-off → full → dip)?
- Il ciclo armonico (4 accordi) ha l'arco dinamico question-peak-answer-close
  (II accordo più forte, IV accordo più debole)?
- Verificare TESSUTO chordGrid (rhythmic) + SOLCO/RESPIRO sustained.

**1C Velocity curve per traccia:**
- NEBBIA / RESPIRO / RITORNO `easeOut`: carezza che entra dolce / scende dolce.
- MACCHINA / TEMPESTA `easeIn`: dinamica esplode con densità.
- ⚠️ Verificare che germoglio MACCHINA/TEMPESTA non sia troppo debole (easeIn può
  schiacciare velocity sotto density < 0.3). Se inudibile: scalare exponent 2→1.5.

### P1 — Wave 1D + 1E (rc2 candidato)

Se Wave 1A-C regge il soundcheck:
- **1D Ghost probability phase-aware ovunque:** estendere il pattern di bass-v3 a
  melody-v3 (arp/voice/lead) e harmony (chord ghost cresce con phase).
- **1E Hat/conga euclideo evolutivo:** `euclideanEvolve(K1, K2, N, prog)` per layer
  secondari (hat/conga). Kick/bass restano in 4/4 — regola potenze di 2.
- Bump v3.19.0 stable + tag se tutto regge.

### P2 — Wave 2 upgrade musicale (post v3.19 stable)

Cuore della proposta originale (vedi storico chat sessione 31):
- Markov 2° ordine per voice/lead/arp (memoria locale, frasi meno random walk).
- Note magnetiche per traccia (1-3 pitch polo che attraggono la frase).
- Heterophony voice↔lead (stessa frase con micro-varianti).

### P3 — Test live v3.18.0 (precedente baseline, validare ancora)

Avvia con `./machine-launch.command` (o doppio-click da Finder) e verifica:

**Fix sessione 29 (critici da confermare):**
- **NEBBIA voice radial** ora attivo — dither concentrico radiale leggibile sui voice particles?
- **RITORNO geologia** — vedere 6 tracce precedenti stratificate come substrate colorato (non
  solo l'ultima)? Soprattutto durante dissoluzione planetMask=0 sul contorno.

### P0-archived — Test live v3.18.0 come principale

Avvia con `./machine-launch.command` (o doppio-click da Finder) e verifica:

**Fix sessione 29 (critici da confermare):**
- **NEBBIA voice radial** ora attivo — dither concentrico radiale leggibile sui voice particles?
- **RITORNO geologia** — vedere 6 tracce precedenti stratificate come substrate colorato (non
  solo l'ultima)? Soprattutto durante dissoluzione planetMask=0 sul contorno.

**Feature v3.18 (da test audit Wave 3R, ora da confermare live):**
- **Rupture takeover**: SOLCO/TEMPESTA — bass gate corto, arp ispessito, drone instabile, flam aumentato?
- **MACCHINA grid pura**: niente dither Bayer, threshold 0.5 binario — riconoscibile?
- **TEMPESTA vector**: pattern Bayer che ruota lento (~30s/giro)?
- **Rupture omen invert**: inversione cromatica α=0.2 fullscreen?
- **Humanize**: TEMPESTA ruvida (±12 vel), NEBBIA fragile (±2) — percepibile?

**Hotkey performer da calibrare:**
- `←/→` octave ±12 (clamp ±24), `↑/↓` density ±10% (clamp 0.3..2.0)
- `M` melody mute 8 bar, `N` bass mute 8 bar
- `1/2/3` durante TEMPESTA → variante RITORNO (default / phrygianHold / silenceThenAeolian 90s)
- `0` skip pre-suite, `Shift+0` start pre-suite (o URL `?presuite`)
- `Shift+Z` panic reset (AllNotesOff + campo + drammaturgia)
- `,` `.` skipPhase (ex frecce)

### P1 — Chiudere debiti visivi (design debt)

Non bloccanti per il live v3.18.0, ma identificati in sessione 29 come "manca qualcosa":

1. **Rupture stages `infiltration` + `residue` invisibili sul field** (80% della durata
   rottura muta visivamente). Serve un'eco sul campo — non solo in `comp-negativo`/
   `comp-griglia` che sono overlay. Proposta: modulazione densità/colore field in
   `campo.js` per stage rupture.
2. **3 biomi senza linguaggio radicale**: SOLCO / TESSUTO / RESPIRO restano al Bayer
   standard v3.17.1. L'audit Wave 1B ha toccato solo MACCHINA/NEBBIA/TEMPESTA.
   Proposta: estendere il pattern `biomaRenderMode` o condizione `_biomaName` con
   linguaggi distintivi (scanline SOLCO / flowing TESSUTO / breathing RESPIRO).

### P2 — Push origin + rimozione worktree

Dopo conferma test live:
- `git push origin machine-iii` (71 commit avanti) + `git push origin v3.18.0` (tag)
- `git worktree remove ../app-experimental` (backup non più necessario)
- `git branch -D v3.18-experimental` (branch mergiato)

### P3 — Calibrazione fine v3.18 (post test live)

- Humanize timing 4ms TEMPESTA potrebbe essere troppo "loose" live — calibrare 2-3ms
- Sub drone C1/D1 (ottava -2) — verificare voice budget synth e udibilità tattile
- TEMPESTA vector senza noise drift — se alias visibile, aggiungere noise tocco
- MACCHINA grid binario — se transizioni 0.5 creano pop, aggiungere 2-level dither minimo
- B3 omen invert — se troppo aggressive, scalare α da 0.2 a 0.15

### Bug/warning aperti (non bloccanti, da V3.18-AUDIT.md)

- Mute bar decrement può accadere twice al cambio fase
- `_recentOnsets()` alloca `new Array(≤40)` quando BPM cambia (rate bassa)
- Pre-suite drone possibile sovrapposizione minima se dt drifta
- B3 omen fullscreen pass ~0.2ms/frame non misurato live

### P3 — Pre-v3.18 — rimandato da baseline v3.17.1 (P0 storico)

### P0-hist — Test live v3.16.0 (clock/MIDI sync fix)

Verificare con hardware attaccato (motivo originario della sessione 27):
- **[CLOCK LAG]** in console Chrome: deve restare sotto 20ms avg/max anche
  in MACCHINA/TEMPESTA/ENCORE e su set di 45+ min. Se supera, la music
  pipeline va spostata nel worker (rimandato — vedi Prossimo P2).
- **Sync griglia DAW ↔ note**: ascoltare attentamente — il ritardo percepito
  tra clock e note dovrebbe essere COSTANTE (15ms fisso) e non più variabile.
- **Latenza 15ms compensabile**: provare se il performer la nota o se è
  trasparente. Se fastidiosa → valutare track-delay negativo nel DAW o
  riduzione `NOTE_LOOKAHEAD_MS` (rischio: riappare il jitter).
- **Norns silente**: nessun output verso bridge WebSocket durante il set.

### P1 — Test live modifiche visive sessione 26 (v3.15.1)

- Glyphs ancora visibili con alpha corretta (dopo globalAlpha)
- Bloom voice/lead/kick invariato (dopo LUT centerX/Y)
- Decay + shimmer biomi fluido (dopo conversione nested loop)
- RITORNO: pianeta più leggibile in proiezione durante dissoluzione

### Bug aperti — da fix se servono

- **C1**: ~~`midi-clock.worker.js:17` — postMessage senza transferable~~ ✅ risolto v3.16.0
- **C2**: devicePixelRatio non gestito — su retina display render fisico raddoppiato
  (analisi sessione 27: falso positivo — canvas a risoluzione fissa 1920×1080,
  DPR gestito da compositor GPU, non costa render extra)
- **M1**: camera micro-punch `spike*0.03` impercettibile (alzare a 0.08-0.12)
- **M2**: ~~camera scan ogni frame~~ già throttolata via `poiScanInterval=15` (~4Hz)

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
