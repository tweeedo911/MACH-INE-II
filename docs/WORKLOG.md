# WORKLOG — MACH:INE III

> Append-only journal. Una entry per sessione. Più recente in cima.
> **Regola d'oro:** mai modificare entry passate. Se serve correggere, append nuova entry.
> **Format:** data + obiettivo + fatto + file + decisioni + prossimo.

---

## 2026-04-07 (sera, debiti tecnici) — doc fix + CH6/CH7 + ghost/fossil overlay

**Versione fine sessione:** v3.4.2 (no bump — fix tecnici, nessun comportamento musicale)
**Branch:** `machine-iii`

### Obiettivo
Completare i 3 debiti tecnici emersi dall'analisi Bible:
1. Doc 03-VISUAL.md obsoleto (mapping comp↔traccia sbagliato)
2. comp-quadrati usava CH6=lead come arp primario invece di CH7=arp
3. event-register mai consumato dalle comp-* → firma gelo/convergenza senza target visibili

### Fatto

**Fix `docs/03-VISUAL.md`**
- Tabella comp↔traccia corretta (rifletteva versione pre-A.4)
- Header aggiornato "7 composizioni" → "6 composizioni" (comp-liminale copre NEBBIA+RITORNO)
- Nota esplicita "fonte di verità: field.js → COMP_MAP"

**Fix `comp-quadrati.js` — CH7=arp primario**
- `isArpCh = n.ch === 7 || (ruptI > 0.4 && n.ch === 6)`
- Prima: CH6=lead era primario, CH7=arp solo in takeover
- Ora: CH7=arp primario (coerente con CH_ROLE e Bible SOLCO), CH6=lead aggiuntivo in takeover

**Ghost/fossil overlay in `field.js`**
- Import `getEvents, STATE_GHOST, STATE_FOSSIL` da event-register.js
- Render pass dopo comp render, prima dell'accumulo sediment
- Dot 2px Bayer, colore lerp(dot→bg) per gradazione ghost/fossil
- Parametri in `CFG.VISUAL.ghostOverlay` (config.js)
- Effetti sbloccati: firma.gelo cristallizza eventi visibili; firma.convergenza attira posizioni reali
- Ghost dots finiscono nel sediment (accumulo dopo il pass) → build-up nel palimpsesto

### File toccati
- `docs/03-VISUAL.md`
- `src/comp-quadrati.js`
- `src/config.js` (nuovo blocco CFG.VISUAL.ghostOverlay)
- `src/field.js` (import + render pass ~35 LOC)

### Prossimo
- Test live: verificare che ghost/fossil siano visibili (sottili, non invadenti)
- Calibrare se necessario: ghostDensity, fossilDensity, ghostBlend, fossilBlend in config.js
- Test firma.gelo: tieni G premuto → eventi si cristallizzano visibili per tutta la durata
- Test firma.convergenza: tieni J → dot ghost convergono verso centro
- P3: push 14+ commit + PR verso main
- P3: refactor director3.js / melody-v3.js

---

## 2026-04-07 (pomeriggio) — P1 memoria inter-traccia + P2 visual enrich

**Versione fine sessione:** v3.4.2 (no bump — infra visiva, nessun comportamento musicale cambiato)
**Branch:** `machine-iii`

### Obiettivo
P1: memoria inter-traccia `_sharedSediment`.
P2: enrich comp-quadrati/negativo, zone Bayer coerenti con density, glitch layer.

### Fatto

**P1 — Memoria inter-traccia (`field.js`, `config.js`)**
- `_sharedSediment` decay da 0.97 a 0.9997/frame → half-life ~38s, visibile ~2min.
- Deposito continuo per-frame (`accumAlpha=0.0001`): palimpsesto atmosferico.
- Composite alpha 0.35 → 0.30 (ridotto per persistenza lunga).
- Parametri in `CFG.VISUAL.sediment`.

**P1 — Micro-glitch ritmo-gated (`field.js`, `config.js`)**
- Rimosso floor fisso `+0.3`. Aggiunto gate `rhythmicity > 0.4`.
- Scala `audioEnergy × rhythmicity × 0.5` → glitch solo in momenti ritmici, raro.
- Parametri in `CFG.VISUAL.glitch`.

**P1 — Crossfade transizioni (`field.js`, `config.js`)**
- `worldState.transition` era sempre `null` → le transizioni erano hard cut.
- Aggiunto `_fadeTimer` self-managed + ease-in-out cubico 3s.
- Parametro `CFG.VISUAL.trackFadeDuration`.

**P2 — Enrich `comp-quadrati`**
- `breathAlpha` in PHASE_PARAMS aumentati (0.05→0.18 … 0.35→0.60).
- Breathing boost da `density.rhythm × 0.20`.
- Arp head scrive nell'OVERLAY: sediment memoria delle orbite.

**P2 — Enrich `comp-negativo`**
- Aggiunto `renderBreathingField` nel MG: dot ink-black pulsano sul sage verde quando `rhythmicity > 0.15`.
- Bass (CH3) crea buchi leggeri anche in `densita` (non solo in `takeover`).
- `closeSpeed` per-buco: eco → resta, voice → medio, bass → chiude veloce.

**P2 — Zone Bayer coerenti con `worldState.density`**
- `comp-griglia`: `ghostBase` cresce con `density.rhythm × 0.08`.
- `comp-linee`: density base + `density.melody × 0.08`; fix sediment bayerTest senza cap.
- `comp-liminale`: density base + `density.harmony × 0.06`.
- `comp-treno`: density base + `(density.rhythm + density.bass) × 0.035`.

**P2 — Glitch layer: meno è più**
- Da 5 a 4 modi, tutti sottrattivi. Rimossi: scan lines colorate (case 1), Bayer flip (case 4).
- Aggiunto scan line tear subtrattivo (clear 1-3 righe sottili).
- Rimossi import inutilizzati da `field.js` (`hexToRgb`, `rgbString`, `colorFlash`).

### File toccati
- `src/field.js`
- `src/config.js`
- `src/comp-quadrati.js`
- `src/comp-negativo.js`
- `src/comp-griglia.js`
- `src/comp-linee.js`
- `src/comp-liminale.js`
- `src/comp-treno.js`

### Prossimo
- Test live: rupture envelope graduale (Fase B), sediment palimpsesto, crossfade 3s, glitch ritmico.
- P2 `comp-quadrati`/`comp-negativo`: valutare live se breathing è troppo o corretto.
- P3: refactor director3.js (521 LOC), melody-v3.js (503 LOC).
- P3: profilo CPU Chrome DevTools (target 60fps/60min).

---

## 2026-04-07 (notte) — P1 Fase B: isRottura → rupture envelope nelle 6 comp-*

**Versione fine sessione:** v3.4.2 (no bump — infra, nessun comportamento musicale cambiato)
**Branch:** `machine-iii`

### Obiettivo
P1 Fase B: sostituire il flag binario `isRottura` con `rupture.intensity` (0→1 smooth)
in tutte e 6 le composizioni visive.

### Fatto

**Pattern comune applicato a tutte le comp:**
- Rimosso `const isRottura = worldState.phase === 'rottura'` da ognuna.
- Aggiunto `const { rupture } = worldState; const ruptI = rupture.intensity;`.
- Sostituito `isRottura ? X : Y` → `lerp(Y, X, ruptI)` per tutte le gradazioni smooth.
- Sostituito `if (isRottura)` → soglie su `ruptI` (tipicamente `ruptI > 0.1/0.2/0.3`).
- Sostituito `shouldGlitch(p, isRottura, t)` → `shouldGlitch(p * ruptI, ruptI > soglia, t)`.

**Stage-specifici (narrativa):**
- `comp-negativo`: `isRotturaExtra` → solo `rupture.stage === 'takeover'`
  (kick/bass scavano buchi solo al picco — non in omen o infiltration).
- `comp-griglia`: `rowSpan = 2` → solo `stage === 'takeover' || 'residue'`
  (la griglia si allarga solo quando la rottura è piena).

**Bug latente fixato (comp-griglia):**
- `const isRottura` era dichiarato a linea 195 ma usato a linee 161/168 (TDZ con `const`).
  Fix: estratto `ruptI` all'inizio di `render()`, prima del loop MIDI.

**Effetti del refactor per stadio:**
| Stadio | ruptI | Effetto visivo |
|---|---|---|
| omen (0–20%) | 0→0.4 | hint sottili: jitter minimo, shake leggero, nessun glitch |
| infiltration (20–50%) | 0.4→0.75 | effetti visibili: glitch inizia, jitter cresce |
| takeover (50–80%) | 0.75→1.0 | massimo: buchi veloci, griglia doppia, shimmer pieno |
| residue (80–100%) | 1.0→0 | dissolvenza: effetti calano, struttura doppia persiste in griglia |

### File toccati
- `src/comp-negativo.js`
- `src/comp-griglia.js`
- `src/comp-liminale.js`
- `src/comp-linee.js`
- `src/comp-quadrati.js`
- `src/comp-treno.js`

### Prossimo
- Test live: verificare comportamento graduale in rottura (omen sottile, takeover pieno)
- P1 item 2: Memoria inter-traccia `_sharedSediment` (secondi → minuti in `field.js`)

---

## 2026-04-07 (notte) — P1: Rupture envelope + trackPalettes Bible §12

**Versione fine sessione:** v3.4.2 (no bump — infra, nessun comportamento musicale cambiato)
**Branch:** `machine-iii`

### Obiettivo
P1 da STATUS: rupture 4 stadi come stato temporale + wiring trackPalettes Bible §12.

### Fatto

**Rupture envelope (world-state + director3)**
- `world-state.js`: aggiunto `worldState.rupture { stage, stageT, t, intensity }`.
- `director3.js`: aggiunto `_RUPTURE_STAGE_BOUNDS` + `_updateRupture()` chiamata ogni
  frame durante `rottura`. 4 stadi: omen (0–20%), infiltration (20–50%),
  takeover (50–80%), residue (80–100%). Intensity: 0→0.4→0.75→1.0→0.
  Reset esplicito in `initDirector3`.

**trackPalettes Bible §12 → worldState**
- `director3.js`: `initDirector3` ora legge da `CFG.VISUAL.trackPalettes[trackName]`
  invece di `_track.palette` (tracks.js). Mapping: bg→bg, dot→dot,
  event→accent, rupture→ruptureTint, residual→residual.
- `world-state.js`: `palette` esteso con `ruptureTint` e `residual`.

**colors.js (5 canali)**
- Aggiunto tracking interpolato per `ruptureTint` e `residual`.
- `_blendedDot`: blend dot→ruptureTint per `worldState.rupture.intensity`.
  Pre-calcolato in `updateColors` — alloc-free in `getPalette()`.
- `snapPalette()` aggiornato a 5 canali.
- Default lerp speed: 0.02 → 0.015 (allineato a `CFG.VISUAL.paletteLerpSpeed`).

### Note
- comp-* leggono `worldState.palette.*` direttamente (hex istantaneo, no lerp).
  Il blend ruptureTint→dot è infrastruttura — comp-* lo consumeranno in Fase B.
- Colori traccia cambiati a valori Bible §12. Testato live: accettati.
- Health-check verde.

### File toccati
- `src/world-state.js` — rupture object, palette +2 campi
- `src/director3.js` — _updateRupture, palette da CFG.VISUAL.trackPalettes
- `src/colors.js` — 5 canali, blendedDot, snapPalette aggiornato

### Prossimo
- Cablare `worldState.rupture` nelle comp-* (Fase B) — `isRottura` binario → envelope
- Memoria inter-traccia: `_sharedSediment` da secondi a minuti (P1 item 2)

---

## 2026-04-07 (notte) — Visual System Bible Fase A.4: comp-negativo → layer stack

**Versione fine sessione:** v3.4.2 (head `16abb8e`)
**Branch:** `machine-iii` — 4 nuovi commit (layer stack completo)

### Obiettivo
Migrare la prima comp al layer stack 4-canonico come da P0 in STATUS.md.
Scelta: `comp-negativo` (RESPIRO) — traccia più autocontenuta, sediment privato
semplice da convertire in LAYER_OVERLAY.

### Fatto

**A.4 — comp-negativo migrato** (`b4fa11f`)
- Eliminato `_sediment` privato → sostituito da `LAYER_OVERLAY` (gestito da
  `updateLayers` tramite `setLayerDecay(LAYER_OVERLAY, _params.sedimentRate)`).
- Sezioni spostate nei layer canonici:
  * `LAYER_BG` → `fillBackground` + `renderBayerScaffold` (no camera)
  * `LAYER_MG` → shadow dots audioDensity (fresh ogni frame via `clearLayer`,
    nessuna camera — differenza ≤1.5% zoom, invisibile)
  * `LAYER_FG` → buchi MIDI con `applyCameraTransform` sull'offscreen del layer
  * `LAYER_OVERLAY` → tracce sediment (memoria dei buchi), accumulo persistente
- `clearLayer(LAYER_MG)` e `clearLayer(LAYER_FG)` all'inizio di ogni render →
  comportamento identico all'originale (erano fresh su ctx diretto).
- `init()`: `clearAllLayers()` invece di `new Sediment()`.
- `destroy()`: `clearAllLayers()`.
- Fine render: `compositeLayers(ctx)` invece di `_sediment.composite + restoreCamera`.
- Importata `clearLayer` da `layers.js`.

### File toccati
- `src/comp-negativo.js` — unico file modificato

### Continuazione stessa sessione
Migrazione completata per tutte e 6 le comp — vedi entry successiva.

---

## 2026-04-07 (notte, continuazione) — Visual Bible Fase A.4 completa: tutte le 6 comp

**Versione fine sessione:** v3.4.2 (head `16abb8e`)
**Branch:** `machine-iii` — +3 commit (comp-liminale, layers.js, griglia+linee+quadrati+treno)

### Fatto

**comp-liminale** (`aafc8a7`)
- BG/MG(zones)/FG(dots) a layer. OVERLAY sediment: alpha pre-baked ×0.6 (originale: globalAlpha=0.6 post-camera).

**layers.js + comp-griglia/linee/quadrati/treno** (`16abb8e`)
- `setLayerCompositeAlpha(name, alpha)` per composite con alpha variabile.
- `clearAllLayers()` resetta anche decay rates e composite alphas ai default.
- `compositeLayers()` rispetta per-layer alpha.

Mapping sediment per comp:
- negativo, liminale, quadrati → OVERLAY (migrato)
- griglia → MG (z-order: afterglow sotto celle live ✓)
- linee → privato (screen blend non replicabile nel layer stack)
- treno → privato (frame-capture speciale: `sCtx.drawImage(ctx.canvas)`)

### File toccati
- `src/layers.js` (3 nuove funzioni, clearAllLayers estesa)
- `src/comp-liminale.js`, `src/comp-griglia.js`, `src/comp-linee.js`,
  `src/comp-quadrati.js`, `src/comp-treno.js`

### Prossimo
- **Test live** su tutte le 7 tracce (NEBBIA, TESSUTO, SOLCO, RESPIRO, MACCHINA, TEMPESTA, RITORNO)
- Verificare comportamento visivo identico all'originale
- Se OK → Fase B (rupture 4 stadi come stato del director3)

---

## 2026-04-07 (sera) — Visual System Bible Fase A.1→A.3

**Versione fine sessione:** v3.4.2 (head `f6daea8`)
**Branch:** `machine-iii` — 4 nuovi commit dal bootstrap workflow (`5a9be85`, `defc315`, `f5139b6`, `cb9d5d0`, `024216c`, `f6daea8`)

### Obiettivo
Iniziare l'implementazione della "Visual System Bible" (nuovo documento
ricevuto durante la sessione, salvato da utente). Obiettivo: rifondare
il sistema visivo attorno a 4 layer canonici (BG/MG/FG/Overlay) + Color
Lifecycle System (newborn→stable→ghost→fossil) + palette per-track con
5 ruoli semantici, mantenendo il dot Bayer come unico materiale.

### Metodo
1. Inventario tecnico completo del sistema visivo attuale via subagent
   (14 file src/ analizzati: colors, dna, field, firma, generations,
   render, visual-toolkit, world-state, 6 comp-*).
2. Sintesi storica dell'evoluzione visiva V1→V5 da 5 doc in `archive/docs/old/`.
3. Mapping Bible → codice: usabile / da riscrivere / ex novo.
4. Fase A = solo infrastruttura. Fase B = riscrittura comp-* una per
   sessione (Bible §15.2). Fase C = rupture 4 stadi + memoria inter-traccia.

### Fatto — Fase A

**A.1 — Palette Bible v2** (`5a9be85`)
- Aggiunta `CFG.VISUAL.trackPalettes` in `config.js`: 7 tracce × 5 ruoli
  (bg/dot/event/rupture/residual). Valori presi dalla Bible §12.
- Zero impatto runtime: la tabella esiste ma nessuno la legge ancora.
- 62 righe, backward compat al 100%.

**A.2 — Event Register unificato** (`defc315`)
- Archiviazione `src/dna.js` e `src/generations.js` → `archive/code/dead-islands/`.
  Motivo: le comp-* non leggevano mai `entities`/`fossils`, tutto il
  sistema era morto da v3.0 (580 LOC di codice parallelo non
  renderizzato).
- Nuovo `src/event-register.js` (~150 LOC):
  * `CH_ROLE` map confermata: CH0 kick · CH1 perc · CH2 drone ·
    CH3 bass · CH4 chord · CH5 voice · CH6 lead · CH7 arp.
  * `ROLE_LIFECYCLE` (Bible §16.1): attack/hold/decay/ghost/fossil
    durations per ruolo.
  * `LifecycleEvent` con 4 stati: NEWBORN → STABLE → GHOST → FOSSIL.
  * API: `onMidiNote`, `onAudioOnset`, `updateEvents`, `resetEvents`,
    `getEvents`, `eventCount`, `getEventStats`.
- `render.js` ripulito: rimosse `triggerOnset`/`triggerMIDI`/
  `updatePrimitives`/`updateGenerations`/`buildEntityGrid`. HUD mostra
  `ev:N` invece di lista primitive DNA.
- `main.js`: drop `generateDNA`/`resetGenerations`, `resetEvents()` su REGEN.
- Runtime verde al primo test live.

**Fix regressione firma** (`f5139b6`)
- Test live ha rivelato: `G` (gelo) e `J` (convergenza) senza effetto.
  Root cause: quei flag erano letti solo da `generations.js` archiviata.
- Cablato `firma.gelo`/`convergenza`/`densityCap` nei nuovi consumer:
  `field.js updateWaves` (freeze trail + convergenza pull posizioni),
  `event-register.js updateEvents` (freeze aging + convergenza),
  `render.js` onset/MIDI intake (gate eventi nuovi + probabilistic
  densityCap).

**Limite emerso** (`cb9d5d0` + `024216c`)
- Secondo test live: `G` ancora senza effetto visibile oltre il
  background. Motivo reale scoperto dall'utente: le comp-* renderizzano
  solo trail freschi (`n.time < dt*2`) — non c'è niente di persistente
  da freezare. Il cablaggio firma è corretto ma manca il target.
- Si risolverà naturalmente in A.4 quando le comp-* consumeranno i
  `LifecycleEvent` persistenti (newborn/stable/ghost/fossil).
- Documentato in `STATUS.md` come limite noto con lista dettagliata
  degli elementi che devono reagire (gelo/convergenza/vuotoTotale/
  densityCap → target).

**A.3 — Layer Stack 4-canonical** (`f6daea8`)
- Nuovo `src/layers.js` (~150 LOC): 4 layer stackati come `Sediment`
  offscreen persistenti.
  * BG       decay 0.995 — ambient color wash quasi fermo
  * MG       decay 0.97  — composizione spaziale dominante
  * FG       decay 0.90  — eventi MIDI diretti
  * OVERLAY  decay 0.985 — residui, ghost, fossil, memory masks
- API: `initLayers`, `resizeLayers`, `updateLayers`, `clearAllLayers`,
  `clearLayer`, `getLayerCtx`, `setLayerDecay`, `resetLayerDecay`,
  `compositeLayers`. Ordine canonico stacking: BG → MG → FG → OVERLAY.
- `firma.gelo` integrato: `updateLayers` skippa il decay quando gelo
  è attivo → i layer si congelano naturalmente. Questo è il primo
  tassello che renderà gelo visibile una volta che le comp-* scriveranno
  nei layer (A.4).
- Cablato in `render.js` (init + resize + updateLayers nel game loop)
  e `main.js` (`clearAllLayers` su REGEN).
- Infrastruttura pura: le comp-* non consumano ancora il layer stack,
  zero impatto visivo. A.4 migrerà ciascuna comp a scrivere nei layer
  una traccia per sessione.

### File toccati
- **Nuovi:** `src/event-register.js`, `src/layers.js`
- **Modificati:** `src/config.js`, `src/render.js`, `src/main.js`,
  `src/field.js`, `docs/STATUS.md`, `docs/WORKLOG.md` (questa entry)
- **Archiviati:** `src/dna.js`, `src/generations.js` → `archive/code/dead-islands/`

### Decisioni prese
1. Eliminare il doppio sistema `generations.js` + `midiTrail` in favore
   di un unico `event-register` con lifecycle per ruolo (Bible §16.1).
2. Archiviare dna/generations invece di mantenerli come zombi congelati.
3. Palette per-traccia dichiarate in `config.js` (single source numeri)
   ma non consumate finché A.4 non le cabla nelle comp-*.
4. Firma gestures: manteniamo il cablaggio nell'infrastruttura anche se
   attualmente invisibile — diventerà visibile naturalmente in A.4.
5. Fase A (infrastruttura) in questa sessione, Fase B (redesign comp-*)
   **una traccia per sessione** come da Bible §15.2.

### Prossima sessione — punto di ripartenza
**Fase A.4 — Prima comp migrata al layer stack.**

Scegliere la traccia da cui partire. Due opzioni:
- **Opzione facile:** `comp-negativo` (RESPIRO, verbo "sottrarre") —
  già concettualmente vicina al target Bible, minimo rewrite.
- **Opzione ad alto impatto:** `comp-liminale` (NEBBIA, verbo "trattenere")
  — il primo minuto della live, deve funzionare bene. Rewrite più
  importante (profile stack + rain-lines per lead + densità bassissima).

Per ogni comp migrata, il protocollo è:
1. Leggere `docs/STATUS.md` + questa entry WORKLOG + Visual Bible §13
   della traccia target.
2. Decidere prima in linguaggio naturale (Bible §15.3): verbo, forma
   dominante, movimento, palette ruoli, lifecycle per canale, regole
   dure, anti-pattern specifici.
3. Rewrite della comp per scrivere nei 4 layer invece che su ctx
   diretto, consumando `event-register.getEvents()` con color lifecycle.
4. Test live obbligatorio in mezzo.
5. Commit atomico.
6. Verificare che firma `G` e `J` diventino visibili su quella traccia.

---

## 2026-04-07 — FASE 0→5 ristrutturazione totale

**Versione fine sessione:** v3.4.2
**Tag:** `pre-restructure-2026-04-07`, `v3.3.0` (retroattivo), `v3.4.0-wip` (retroattivo), `v3.4.2`
**Commit:** 8 nuovi su `machine-iii` (da `6148835` a `ccbbb13`)

### Obiettivo
Riorganizzare il progetto: archiviare versioni vecchie, riconciliare versioning incoerente (header dicevano v5.0.0/v4.0.0/v2.8.0 ma commit usavano v3-music/v3-visual), pulire `src/` da moduli morti, consolidare 25+ md root in `docs/00-06`, mai perdere nulla.

### Diagnosi iniziale
- 3 radici parallele: `/MACH-INE II/`, `MACH:INE II/`, `MACH:INE III/` (orfana)
- 2 repo Git annidati: outer per `.planning/` GSD, inner per il codice — non parlavano
- src/ inquinata: 45 file (alive 30 + dead 15)
- 4 roadmap coesistenti, nessuna fonte di verità
- `test.mov` 365MB nel repo
- GSD phases 00-04 descrivevano un'architettura (V3 Layer System) **mai costruita**: il codice ha preso una strada diversa (Band con Direttore)

### Fatto

**FASE 0 — Safety net**
- Backup esterno: `~/Backups/MACHINE-II-2026-04-07/` (404MB)
- Tag `pre-restructure-2026-04-07` su entrambi i repo
- `test.mov` → `~/Media/MACHINE/test-2026-03-23.mov`
- `.gitignore` esteso (`.mov`, `.als`, `.mp4`, `.wav`, frame PNG, `.superpowers/`)
- Commit `014cf8c` v3.4.0-wip: visual enrichment + structural docs (9 file modified + 10 nuovi md)
- Tag retroattivi: `v3.3.0` su `6148835`, `v3.4.0-wip` su `014cf8c`

**FASE 0.5 — Merge repo Git** (opzione C: cancellare outer .git)
- Storia GSD outer (50 commit) esportata in `.planning-archive/GSD-history.txt`
- `.planning/` snapshotted in `.planning-archive/planning-snapshot/`
- Outer `.git` cancellato → repo unico nel folder interno
- Commit `fbd9ce1`: import GSD planning history

**FASE 1 — Salvage isole morte**
- 16 file morti identificati in 3 isole isolate (V3 Layer System, Designer, orfani)
- Diff comparativi: solo 2 portati (modal char note boost da `harmony-layer`, `firma` da `sequencer`)
- Estratto `src/firma.js` (~90 LOC standalone)
- Aggiunto `CFG.modeCharacteristicInterval` in `config.js`
- Aggiunto `_modeCharacteristicBoost()` in `harmony.js` (+15 vel su intervallo distintivo del modo)
- Aggiunto `modeHint` a tutte e 7 le tracce in `tracks.js`
- Commit `59359fd`: salvage critici

**v3.4.2 — firma reattivata**
- Scoperta: `generations.js` aveva la logica `firma.gelo`/`firma.convergenza` ma con fake locale (`v3: firma removed`)
- Fix 1 riga: import vero da `firma.js` → riattiva tutto il sistema freeze/attract
- Wired `firma.densityCap` come moltiplicatore birth rate
- Wired `firma.vuotoTotale` in `render.js` con early-out blackout
- Keybindings live: `G` (gelo), `J` (convergenza), `V` (vuotoTotale)
- Commit `f34ef81`: firma reattivata

**FASE 2 — Ristrutturazione directory**
- Rinominato `MACH:INE II/` → `app/` (path senza `:` né spazi)
- Creato `archive/` con sottodirectory: `code/{dead-islands,versions,legacy-*}/`, `docs/old/`, `analysis/`, `midi-exports/`, `sandbox/`
- 14 moduli morti → `archive/code/dead-islands/`
- 89 snapshot in `versions/` → `archive/code/versions/`
- 19 md storici + CHANGELOG vecchio (826 righe) → `archive/docs/old/`
- Sandbox HTML (designer, test, sandbox), `.docx`, `.csv`, `ruflo.yaml` → `archive/sandbox/`
- `analisi machine ii/`, `composer/`, `new/`, `feedback e idee/`, `midi/` → archive
- Creato `src/VERSION.js` (single source `APP_VERSION`)
- Allineati header `main.js` / `config.js` a `VERSION.js`
- Riscritto `CHANGELOG.md` con storia reale (v2.9.4 → v3.0.0 → v3.4.2)
- Riscritto `CLAUDE.md` con nuova struttura
- Creati `docs/00-VISION.md` … `docs/06-AGENTS.md` (7 doc snelli, consolidamento da 19+ md)
- Creati `scripts/snapshot.sh` + `scripts/health-check.sh`
- Commit `97f1a62`: FASE 2 ristrutturazione directory completa

**FASE 5 — Verifica + cleanup parent dir**
- Health check verde: import OK, niente sospetti verso `archive/`
- HTTP smoke test: `/`, `/src/main.js`, `/src/VERSION.js` → 200
- Parent dir `/MACH-INE II/` ripulito: `MACH:INE III/`, `MACHINE PREV Project/`, `agent-orchestrator/`, `creative-critic-review.html`, vecchio `CLAUDE.md`, `agent-orchestration-guide.md` → `archive/parent-dir-residue/`
- `.als` esclusi via gitignore (3.7MB preservati su disco, non in git)
- `launch.sh`: banner versione letto dinamicamente da `VERSION.js`, nuovi keybinding G/J/V documentati
- Test runtime live: utente conferma "funziona"
- Commit `ccbbb13`: FASE 5 verifica + cleanup parent dir + launcher refresh
- Tag `v3.4.2` su HEAD

**Workflow management** (questa stessa entry)
- Creato `docs/STATUS.md` (snapshot vivo, rigenerato a fine sessione)
- Creato `docs/WORKLOG.md` (questo file, append-only)
- Creato `docs/DECISIONS.md` (ADR-light)
- Aggiornato `CLAUDE.md` con protocollo sessione
- Commit `wm: bootstrap workflow management`

### File toccati
- **Nuovi:** `src/firma.js`, `src/VERSION.js`, `docs/{00-VISION,01-ARCHITECTURE,02-MUSIC,03-VISUAL,04-RULES,05-ROADMAP,06-AGENTS,STATUS,WORKLOG,DECISIONS}.md`, `scripts/{snapshot,health-check}.sh`, `SALVAGE.md`
- **Modificati:** `config.js` (+modeCharacteristicInterval), `harmony.js` (+boost), `tracks.js` (+modeHint), `generations.js` (firma import + densityCap), `render.js` (firma early-out + keybindings), `main.js` (header), `launch.sh`, `CLAUDE.md`, `CHANGELOG.md`, `.gitignore`
- **Spostati:** ~140 file in `archive/`

### Decisioni prese
Vedi `DECISIONS.md` #001 → #008.

### Prossima sessione — punto di ripartenza
1. Decidere se pushare gli 8 commit + tag `v3.4.2` su `origin/machine-iii` e aprire PR
2. Iniziare P1: tuning composizioni (vedi `STATUS.md` Prossimo → P1)
3. Verificare al primo problema che il workflow STATUS/WORKLOG/DECISIONS regga davvero
