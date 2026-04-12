# WORKLOG — MACH:INE III

> Append-only journal. Una entry per sessione. Più recente in cima.
> **Regola d'oro:** mai modificare entry passate. Se serve correggere, append nuova entry.
> **Format:** data + obiettivo + fatto + file + decisioni + prossimo.

---

## 2026-04-13 (sessione 14) — Camera osservatore narrativo

**Obiettivo:** Sostituire la camera passiva con un sistema autonomo che osserva il campo con intenzione narrativa.

**Fatto:**
- Progettato sistema camera con POI detection + 5 gesti cinematografici + personalità per bioma
- Rimosso barrel distortion da campo.js (~80 LOC, 2MB/frame in meno)
- Creato `src/camera.js` (~230 LOC): POI scanner, shot sequencer, interpolazione smoothstep
- Svuotato `_updateCamera` in director3.js (da ~50 LOC a 2 righe: scrive solo personality/phase)
- Aggiornato world-state.js: camera ha personality/phase invece di barrel
- Aggiunto getCampoDensityBlocks() a campo.js per il POI scanner
- Config per bioma: zoomRange, holdRange, speed, easing, preferScan
- Fix gate densità: la camera esplora anche biomi sparsi (NEBBIA), non solo quelli densi
- RITORNO: parte fullscreen → tuffo intimo → allontanamento progressivo → puntino 0.15×

**File toccati:**
- `src/camera.js` — NUOVO
- `src/campo.js` — rimosso barrel, aggiunto getCampoDensityBlocks
- `src/director3.js` — svuotato _updateCamera, rimosso import getCampoAvgDensity
- `src/world-state.js` — camera: personality/phase, rimosso barrel
- `src/config.js` — camera parametri per bioma (7 personalità)
- `src/main.js` — import + init + update camera nel loop
- `src/VERSION.js` — v3.8.0

**Decisioni:** #017 (camera osservatore narrativo)

**Prossimo:** Calibrare personalità camera per bioma — ora i movimenti sono troppo simili.
Differenziare velocità, profondità zoom, e comportamento per traccia.
Test live con musica reale per validare narrativa camera + depositi.

---

## 2026-04-12 (sessione 13) — Redesign radicale tutti i biomi + infrastruttura campo

**Obiettivo:** Analisi completa della performance (~40 min), diagnosi visiva da screenshot, piano generale su tutti gli aspetti della composizione, implementazione radicale.

**Analisi:**
1. Analisi performance completa scritta in `session-2026-04-12/ANALISI-PERFORMANCE.md` (macro-struttura, armonica, ritmica, melodica, dinamica, fasi, transizioni, dramaturgia)
2. Diagnosi visiva da 6 screenshot: TESSUTO e SOLCO funzionano (7/10), RESPIRO concetto ok (6/10), MACCHINA arp illeggibile (4/10), NEBBIA troppo piena (3/10), TEMPESTA muro grigio (2/10)
3. Piano generale in `session-2026-04-12/PIANO-GENERALE.md` (7 sezioni: visivo, musicale, drammaturgico, tecnico, live, composizione spaziale, ordine esecuzione)

**Fatto — Infrastruttura campo.js:**
1. Phase-aware force multiplier — velocity scalata per fase (germoglio ×0.35, rottura ×1.2)
2. Phase-aware decay offset — decay rallenta in dissoluzione (cristallizzazione), accelera in germoglio
3. Density cap per ruolo — `bioma.maxDensity` con penalità progressiva sulle celle sopra il tetto

**Fatto — Redesign radicale 7/7 biomi:**
4. **NEBBIA** riscritto — palette tutta fredda (blu-indaco, zero lavanda), voice effimere (decay 0.9955, nebulose 3-5 celle per 50-90f), drone con zona esclusione, density cap 0.12
5. **TESSUTO** riscritto — bg freddo viola `[18,14,24]` (distinto da SOLCO caldo), fasce verticali dedicate (lead Y 3-22%, chord Y 15-55%, bass Y 78-95%), fibre con varietà (continue/tratteggiate/doppie)
6. **SOLCO** riscritto da zero — impatto verticale + eco delay dub. Bass = colonne verticali che sbattono giù + 2-3 echi spostati a destra. Chord = pioggia di punti. Kick = faglie verticali con aftershock. Voice = fulmini con ramificazioni. Bg nero-terra caldo `[14,10,8]`
7. **RESPIRO** migliorato — membrana con spessore variabile (target sin patterns), pori irregolari (ellissi deformate + noise raggio), alone con variazione angolare (iridescenza)
8. **MACCHINA** riscritto — terminale/circuito. Arp = raster scan con trail orizzontale. Bass = tracce di circuito a L (percorsi tra 2 nodi). Kick = colonna verticale intera (binario on/off). Voice/lead = mirini HUD con croce. Chord = chip PCB con pin
9. **TEMPESTA** riscritto — aurora boreale. Voice = tende di luce curve sin (25-44 celle, attraversano campo). Lead = contro-tende carmine con angolo diverso. Bass = onde di pressione circolari (archi parziali). Kick = esplosione radiale (anello). Erosione direzionale. Force voice/lead raddoppiata, bass/chord dimezzata. Density cap
10. **RITORNO** migliorato — voice: 60% stelle, 30% costellazioni, 10% comete radiali. Lead: eco doppie. Kick: 60% archi equatoriali, 40% archi meridiani. Chord: 50% archi sottili, 30% spessi, 20% anelli

**File toccati:**
- `src/campo.js` — phase multipliers, density cap, decay offset
- `src/biomi.js` — 7/7 biomi riscritti (depositFn, colors, decay, force, maxDensity)
- `src/VERSION.js` — v3.6.1 → v3.7.0
- `session-2026-04-12/ANALISI-PERFORMANCE.md` — analisi completa suite
- `session-2026-04-12/PIANO-GENERALE.md` — piano 22 punti su 4 priorità
- `docs/STATUS.md` — rigenerato
- `docs/WORKLOG.md` — questa entry

**Decisioni:**
- Ogni bioma ha ora un GESTO UNICO e una FORMA DOMINANTE che nessun altro bioma condivide
- NEBBIA/TESSUTO/SOLCO separati per temperatura colore (freddo/freddo-viola/caldo) oltre che per forma
- MACCHINA è l'unico bioma deterministico (snap a griglia, posizioni da nota, zero random)
- TEMPESTA è l'unico bioma con forme curve (archi sin, onde circolari)
- Phase multiplier si applica globalmente ma NEBBIA usa force fisse nelle depositFn (resistente al germoglio ×0.35)

**Prossimo:**
- P0: test visivo live di tutti i biomi ridisegnati (il blocco originale resta)
- P1: rupture nelle depositFn (ora che le forme sono definite, le rotture possono violarle)
- P2: transizioni musicali morbide + hocket verification

---

## 2026-04-12 (sessione 12b) — RITORNO come pianeta irregolare

**Obiettivo:** Implementare RITORNO come ultimo bioma — pianeta irregolare visto dall'orbita con maschera circolare + noise contour.

**Fatto:**
1. **biomi.js RITORNO ridisegnato** — bg nero puro (spazio), flag `planetMask: true`, tutte le depositFn riscrittte in coordinate polari (depositi entro il raggio pianeta ~65%). Kick = archi sull'equatore. Chord = archi a raggio variabile pitch→distanza. Drone = nebbia nel nucleo. Voice/lead/arp/bass = scintille distribuite uniformemente nell'area circolare (√random per distribuzione uniforme).
2. **campo.js maschera pianeta** — dopo il rendering Bayer e prima del barrel, se `bioma.planetMask`, applica maschera circolare irregolare. Contorno generato da 3 ottave di sin sovrapposti (freq 5/11/23 — prime, no periodicità visibile), 256 campioni angolari, ricalcolato ogni 120 frame per variazione lenta. Raggio pilotato da fase: germoglio 0→70%, stabile in pulsazione/densità, dissoluzione 70%→0 (il pianeta si spegne). Bordo sfumato 2px per antialiasing naturale.
3. **Versione** — v3.6.0 → v3.6.1

**File toccati:**
- `src/biomi.js` — RITORNO riscritto: depositFn polari, planetMask flag
- `src/campo.js` — _buildPlanetNoise, _planetRadiusAt, maschera in renderCampo
- `src/VERSION.js` — v3.6.1
- `docs/STATUS.md` — rigenerato (7/7 biomi, RITORNO completato)
- `docs/WORKLOG.md` — questa entry

**Decisioni:**
- Maschera applicata a livello pixel (post-Bayer, pre-barrel): rivela il sedimento accumulato dai biomi precedenti dentro la forma pianeta. Il nero fuori è lo spazio.
- Noise contour con sin sovrapposti invece di Perlin: più leggero, sufficiente per l'estetica, ricalcolo ogni 2 secondi per micro-animazione.
- depositFn in polari con √random per distribuzione uniforme nell'area (evita addensamento al centro).

**Prossimo:**
- P0: test visivo live di tutti e 7 i biomi + camera (Shift+C)
- P1: cablare rupture nelle depositFn
- P2: evoluzione per fase (force/decay modulati da h.phase)

---

## 2026-04-12 (sessione 12) — Camera nel campo + fix audit codebase

**Obiettivo:** Implementare il sistema camera nel Campo Materiale (spec approvata) e sistemare i problemi emersi dall'audit completo del codebase.

**Audit codebase (pre-implementazione):**
- Scansione completa su 4 fronti paralleli: campo+biomi, director+world-state+firma, render+main+config, MIDI+moduli musicali
- Nessun bug critico a runtime trovato
- TEMPESTA: l'audit aveva segnalato percussion mancante ma era falso positivo (presente a biomi.js:885)
- Fix reali: import morto in main.js, commento errato in midi.js, comp-quadrati.js modulo morto

**Fatto:**
1. **Fix audit** — rimosso import morto `applyMusicExperimentOverrides` da main.js, corretto commento midi.js (Ch7=RUPTURE → Ch7=ARP), archiviato comp-quadrati.js in dead-islands/
2. **Camera: stato** — world-state.js: nuovo oggetto camera con zoom/focusX/focusY/barrel (sostituisce vecchio mode/drift/focusPoint inutilizzato)
3. **Camera: config** — config.js: nuova sezione `campo.camera` con lerpSpeed, driftR, driftPeriod, macroMinDensity, barrelRecalcEvery
4. **Camera: rendering** — campo.js: 3 regimi in renderCampo (macro=crop+scale, orbita=scale+nero, barrel=LUT precalcolata). LUT ricalcolata ogni 30 frame quando barrel cambia. Export `getCampoAvgDensity()` per gate macro.
5. **Camera: pilotaggio** — director3.js: `_updateCamera(dt)` chiamata ogni frame. Pilotaggio tabellare per fase: germoglio→macro (con gate densità>0.05), pulsazione→1.0, densità→drift circolare, rottura→0.85, dissoluzione→1.3, RITORNO→orbita progressiva+barrel. Camera reset a ogni cambio traccia.
6. **Versione bumped** — v3.5.1 → v3.6.0

**File toccati:**
- `src/main.js` — rimosso import morto
- `src/midi.js` — fix commento Ch7
- `src/comp-quadrati.js` → `archive/code/dead-islands/`
- `src/world-state.js` — nuovo oggetto camera
- `src/config.js` — sezione campo.camera
- `src/campo.js` — barrel LUT, macro/orbita rendering, getCampoAvgDensity
- `src/director3.js` — import getCampoAvgDensity, _updateCamera(), camera reset in initDirector3
- `src/VERSION.js` — v3.6.0
- `docs/STATUS.md` — rigenerato
- `docs/WORKLOG.md` — questa entry

**Decisioni:**
- Barrel LUT: copia pixel-per-pixel con snapshot Uint8ClampedArray. Se troppo pesante su hardware lento, fallback radiale alfa da implementare (non in questa sessione).
- Camera reset a zoom 1.0 a ogni cambio traccia: RITORNO ricalcola progressivamente, gli altri partono neutri.

**Prossimo:**
- P0: test visivo live dei biomi + camera (Shift+C, scorrere tracce, verificare macro/drift/orbita)
- P1: RITORNO come pianeta irregolare (la camera orbita + barrel è pronta)
- P2: cablare rupture nelle depositFn

---

## 2026-04-12 (sessione 11) — Ridisegno biomi: fisica distintiva per traccia

**Obiettivo:** Analisi critica dello stato visivo di tutti i biomi e ridisegno delle depositFn per dare a ogni bioma una fisica unica e riconoscibile. Ogni strumento deve avere un primitivo visivo distinto.

**Analisi critica (pre-implementazione):**
- Tutti i biomi usavano depositPoint/depositRow/depositBlob → stesso tipo di immagine
- TEMPESTA (1/4 nel framework) il peggiore: nessuna fisica direzionale, nessun hocket visivo
- RESPIRO: bg sage [123,186,145] con drone quasi-nero → zero contrasto su proiettore (screen blend non scurisce)
- NEBBIA: voice = punto singolo invece di nebulosa espandente
- MACCHINA: arp = punto random invece di scansione sequenziale
- SOLCO: bass senza echo trail dub
- SOLCO drone assente (bug vs MOOD.md)
- MACCHINA bass usava Y-mapping per posizione X (bug)

**Fatto:**
1. **Infrastruttura phase-aware** — campo.js importa worldState/phaseState, HELPERS espone `h.phase`, `h.rupture`, `h.energy`, `h.phaseProgress`, `h.audioEnergy`. Le depositFn possono ora leggere la fase corrente.
2. **Particle pools voice/lead** — campo.js: pool per nebulose espandenti (voice) e scie orizzontali (lead). Physics nel loop updateCampo.
3. **NEBBIA ridisegnata** — voice = nebulosa espandente (particle r=1→7, ~2s), drone = cluster quasi permanente (decay 0.9998), audioReact solo dove c'è materia, chord = velatura parziale. cellPx: drone=20, voice=6.
4. **TESSUTO ridisegnato** — chord = fibra full-width spessa 2 celle con decay 0.965 (pulsa visibilmente), kick = onda che fa tremare tutte le fibre attive di chord, bass = fascia orizzontale 3 celle spessa.
5. **SOLCO ridisegnato** — bass con echo trail dub (deposito + 2 fantasmi spostati e degradati), kick shockwave con forza inversamente proporzionale alla presenza del bass (alternanza spaziale dub), arp 2-3 particelle per nota, voice banda con fade ai bordi. Fix: drone aggiunto (era assente, bug vs MOOD.md).
6. **RESPIRO fix contrasto** — bg da sage [123,186,145] a nero-verde [12,20,15], drone (membrana) da quasi-nero a sage luminoso [110,185,140]. Alto contrasto. Pori con alone luminoso ai bordi (voice/lead hanno colori propri). Chord = ondulazione (micro-pori spaziati). Target membrana alzato a 0.85.
7. **MACCHINA ridisegnata** — arp = scansione sequenziale con trail di 3 celle, bass = colonna larga 3 con gradiente (fix: pitch→X corretto), chord = blocco 3×2, percussion = accenti equidistanti su riga, voice/lead = LED deterministici specchiati.
8. **TEMPESTA ridisegnata** — impulsi direzionali ogni 3-15 frame, 3 livelli suscettibilità (drone 0.02 → arp/voice 0.50-0.60), voice+lead = scie nella direzione dell'impulso (hocket bianco/carmine), percussion = scintille sparse su tutto il canvas, drone = linee di forza orizzontali stabili.
9. **Pannello debug pulito** — da ~50 righe a ~20. Aggiunto: audioEnergy con barra, flux+onset, bande frequenza (SUB/LOW/MID/HI), rupture con stadio e intensità, firma compatta. Rimosso: reference card 25 righe (compressa in 4), sezione tracce/fasi ridondanti, sezione musica inutile.

**File toccati:**
- `src/campo.js` — import worldState, HELPERS arricchito, particle pools voice/lead, loop updateCampo
- `src/biomi.js` — 6 biomi ridisegnati (NEBBIA, TESSUTO, SOLCO, RESPIRO, MACCHINA, TEMPESTA), 2 bug fix (SOLCO drone, MACCHINA bass cx)
- `src/render.js` — pannello debug riscritto
- `src/VERSION.js` — v3.4.2 → v3.5.0

**Decisioni:**
- RESPIRO: bg scuro obbligatorio perché screen blend non può scurire su bg chiaro. La "luminosità" viene dalla membrana sage, non dal bg.
- RITORNO rimandato: deve essere l'ultimo (composto dai sedimenti di tutti i biomi visti da lontano come pianeta irregolare su nero).

**Prossimo:**
- P0: test visivo live dei 6 biomi ridisegnati (Shift+C, scorrere tracce)
- P1: RITORNO come pianeta irregolare (maschera circolare con contorni noise)
- P2: cablare rupture nelle depositFn (i 4 stadi modificano la fisica)
- P3: evoluzione per fase (force/decay modulati da h.phase e h.phaseProgress)

---

## 2026-04-12 (sessione 10) — Cablaggio infrastrutturale campo

**Versione fine sessione:** v3.4.3-wip
**Branch:** `machine-iii`

### Obiettivo
Portare il Campo Materiale al massimo espressivo cablando: grid rettangolare
(no stretch), cellPx variabile per ruolo, firma (gelo/convergenza/densityCap),
solidificazione a 3 strati.

### Fatto

**Grid rettangolare 96×54**
Sostituito `_cells` (32×32 quadrato) con `_cellsX=96` / `_cellsY=54` (16:9 esatto).
Offscreen 960×540px. Zero stretch su canvas 16:9. Tutte le depositFn in biomi.js
aggiornate: `h.CELLS` → `h.CELLS_X` / `h.CELLS_Y` (59 sostituzioni nei 7 biomi).

**cellPx variabile per ruolo**
Ogni ruolo renderizza con la sua grana Bayer: drone=16px (grosso, geologico),
voice=8px (fine, preciso), arp=6px (finissimo). Override per bioma: NEBBIA ha
drone=20px e voice=6px (massimo contrasto), MACCHINA tutto 10px (griglia uniforme).

**Firma nel campo**
campo.js ora importa firma.js e reagisce a:
- gelo: freeze totale (no decay, no deposit, no audioReact)
- convergenza: materia migra verso il centro (transfer 0.3*dt)
- densityCap: gate probabilistico su feedNote

**Solidificazione 3 strati**
Decay modulato automaticamente da 3 fattori (composti via max):
- Strato A (silenzio): ruoli che non suonano cristallizzano (soglie 1-8s per ruolo)
- Strato B (densità): celle >0.8 quasi permanenti (smoothstep 0.4→0.8)
- Strato C (spaziale): parte bassa del campo sedimenta (smoothstep 0.5→0.9)
Override per bioma: MACCHINA no stratigrafia, TEMPESTA nulla cristallizza,
RESPIRO solo densità >0.9, RITORNO tutto solidifica al 50%.

**Convergenza automatica**
director3.js attiva firma.convergenza nell'ultimo 15% della fase dissoluzione.
La materia migra al centro come transizione visiva naturale prima del cambio traccia.

### File toccati
**Modificati:**
- `src/config.js` (campo: cellsX/cellsY, roleCellPx, silenceThreshold, freeze params)
- `src/campo.js` (grid rettangolare, render multi-cellPx, firma, solidificazione)
- `src/biomi.js` (CELLS_X/CELLS_Y in 7 biomi, freeze/cellPx per 5 biomi)
- `src/director3.js` (import firma, convergenza auto in dissoluzione)
- `docs/STATUS.md` (rigenerato)
- `docs/WORKLOG.md` (questa entry)

**Nuovi:**
- `docs/superpowers/specs/2026-04-12-campo-infrastruttura-design.md`
- `docs/superpowers/plans/2026-04-12-campo-infrastruttura.md`

### Decisioni
- Nessuna nuova decisione formale. Scelte documentate nella spec.

### Prossimo
- **P0 — Camera nel campo** — spec approvata in `docs/superpowers/specs/2026-04-12-camera-campo-design.md`.
  Design raffinato: barrel via LUT precalcolata, macro condizionale (densità>0.05),
  drift circolare in densità. Pronto per writing-plans → implementazione in sessione 11.
- **P1 — Calibrazione visiva live** — testare bioma per bioma con musica reale
- **P2 — Rupture nel campo** — cablare worldState.rupture in biomi.js
- **P3 — Density cap TEMPESTA**
- **P4 — Lato musicale** (tuning densità, transizioni, silenzi)

---

## 2026-04-12 (sessione 9) — 7 biomi implementati nel Campo Materiale

**Versione fine sessione:** v3.4.2 (nessun bump — codice nuovo in campo.js + biomi.js)
**Branch:** `machine-iii`

### Obiettivo
Implementare meccanicamente tutti i 7 biomi nel Campo Materiale, partendo
dalle bozze della sessione 8 e dal documento MOOD.md.

### Fatto

**localPitchToCell(note, lo, hi) in campo.js**
Mapping registro locale: [lo,hi] → 80% del campo Y con margine 10%.
Da 4 celle (pitchToCell globale) a 25 celle per ruolo. Aggiunto a HELPERS
per uso nelle depositFn. SOLCO bass depositFn aggiornato per usarlo.

**Fix palette SOLCO**
Riscaldato da verde-oliva a terracotta: bg [26,33,28]→[30,24,18],
arp [213,255,87]→[255,200,80] (ambra), voice [213,255,87]→[240,210,130]
(crema dorata).

**NEBBIA bioma completo**
Bg quasi nero, drone lavanda come nebulosa (blob locale + wash audio-reactive),
voice punti isolati cream, lead scie brevi con fade, chord velature orizzontali.
audioReact: drone respira con audioEnergy dal worldState.

**Campo fullscreen**
drawImage da quadrato centrato a stretch su tutto il canvas.
Eliminato il fillRect bg + calcolo side/dx/dy.

**Bug fix: _campoActiveTrack**
Il campo condivideva _activeTrack con le comp-* classiche → al toggle Shift+C
il bioma non veniva settato. Aggiunto tracker separato _campoActiveTrack
(stesso pattern di _geoActiveTrack).

**audioReact in updateCampo**
Nuovo parametro audioEnergy passato da field.js. I biomi possono definire
audioReact(fields, energy, helpers) per modulazione continua ogni frame.
Usato da: NEBBIA (drone wash), RESPIRO (self-heal membrana), MACCHINA
(griglia base 0.05).

**5 biomi rimanenti implementati**
- TESSUTO: tensione orizzontale, chord lime a tutta larghezza (telaio staccato),
  lead cream punti alti, bass segmento spesso, kick impulso riga.
- RESPIRO: INVERTITO — campo pieno (drone 0.75), note creano pori circolari
  nella membrana che si richiude per tensione superficiale. Monocromatico
  (quasi-nero su sage). Voice/lead/bass/chord scrivono tutti su fields.drone.
- MACCHINA: snap griglia, base 0.05 sempre visibile, arp giallo (cx=note%32,
  deterministico → pattern leggibile), kick riga, bass colonna, pink accent.
- TEMPESTA: densità massima, voice bianco + lead carmine (hocket alternato),
  blob bass, kick flash, percussion carmine sparsa, arp texture grigia.
- RITORNO: preserva sedimento (default campo.js), voice cream come NEBBIA,
  arp morente (decay 0.950 + force 0.15), drone blob diffuso lavanda.

**Calibrazioni iterative NEBBIA**
- Drone da carpet uniforme → blob locale → compromesso (blob 6×5 + wash 0.001)
- Chord/voice/lead colori alzati verso bianco puro (luminosità)
- Decay chord/voice rallentato (da 0.996/0.990 → 0.9992/0.9988)

### File toccati
**Modificati:**
- `src/campo.js` (localPitchToCell, audioReact, fullscreen drawImage)
- `src/biomi.js` (SOLCO palette, NEBBIA completo, TESSUTO/RESPIRO/MACCHINA/
  TEMPESTA/RITORNO completi — nessun placeholder rimasto)
- `src/field.js` (_campoActiveTrack, audioEnergy passato a updateCampo)
- `docs/DECISIONS.md` (#016)
- `docs/STATUS.md` (rigenerato)
- `docs/WORKLOG.md` (questa entry)

### Decisioni
- **#016** — 7 biomi implementati, 5 limiti noti identificati e concordati.

### Prossimo
- **P0 — Calibrazione visiva live** — testare ogni bioma con musica reale,
  uno per uno. Annotare: cosa funziona, cosa no, quale bioma è il primo
  candidato per prototipo HTML standalone di redesign.
- **P1 — Variazione grana Bayer** — rompere la monotonia: cellPx variabile
  per ruolo, o Bayer 8×8 alternativo, o dithering diverso per layer.
- **P2 — Density cap TEMPESTA** — impedire saturazione uniforme al picco.
- **P3 — Lifecycle dotSize** — valutare se possibile nel paradigma campo
  (potrebbe richiedere cellPx variabile per cella o render multi-pass).
- **P4 — Firma nel campo** — gelo (freeze decay), convergenza, densityCap.

---

## 2026-04-12 (sessione 8) — Sistema Geometrico v1, decisione campo definitivo, bozze 7 biomi

**Versione fine sessione:** v3.4.2 (nessun bump — codice nuovo aggiunto, comp-* invariate)
**Branch:** `machine-iii`

### Obiettivo
Analizzare lo stato del progetto. Costruire il "Sistema Geometrico" come
terzo paradigma (particelle geometriche su layers.js). Validare. Decidere
quale paradigma proseguire. Preparare le bozze per tutti e 7 i biomi.

### Fatto

**Analisi profonda dello stato del progetto**
Lettura completa di STATUS/WORKLOG/DECISIONS. Diagnosi: 3 paradigmi
coesistenti (comp-*, campo, geo) = debito tecnico pesante. Nessun
paradigma completo per tutti i 7 biomi.

**Documento MOOD.md creato**
Ritratto musicale completo delle 7 tracce: essenza emotiva, ruolo
strumenti con dati precisi da tracks.js, arco formale, contesto narrativo,
quadro sinottico, simmetrie strutturali. Consegnabile a chi deve tradurre
visivamente le composizioni.

**VISUAL-SPEC.md creato**
Contratto artistico canonico per il Sistema Geometrico: 7 primitive
(ARC/RECT/SEG/PORE/CELL/PATH/TRAIL), geometria per canale × bioma,
3 regole universali, matrice operativa completa.

**Sistema Geometrico (geo.js) implementato**
- Primitiva ARC completa: Bayer halftone, object pool, lifecycle
  newborn→stable→ghost→fossil, layer routing FG→MG→OVERLAY
- Primitiva RECT completa: gravità, terrain heightmap, impatto con
  squash, deposito stratigrafico
- NEBBIA calibrato: 4 canali ARC (drone con LFO, chord cluster, voice,
  lead accent)
- SOLCO calibrato: 6 canali RECT (kick g=1.2, drone bedrock, bass
  protagonista con terrain deposit, chord caduta lenta, voice polvere,
  arp frammenti)
- Wiring: config.js (CFG.VISUAL.geo.useGeo), field.js (early-return +
  feedNote forwarding + _geoActiveTrack), main.js (Shift+G toggle con
  mutex vs Shift+C)

**Debug e validazione**
- Primo test: nessun arco visibile → diagnostica aggiunta → scoperto che
  useGeo non era stato attivato (Shift+G non premuto)
- Secondo test con diagnostica: confermato che il sistema funziona
  (particelle auto-spawn magenta + feedCalls da musica reale in pulsazione)
- NEBBIA produce poche note in germoglio (intenzionale — ambient rarefatto)
- SOLCO RECT con gravità e terrain heightmap funzionante

**Pannello debug aggiornato (render.js)**
- Barra stato: mostra `[GEO]`/`[CAMPO]`/`[COMP]` per paradigma attivo
- Pannello debug (D): sezioni VISUAL, FIRMA, DIRECTOR, AUDIO, MIDI,
  TRACCE, FASI, MUSICA + legenda completa di TUTTI i comandi
- Import getGeoStatus da geo.js per mostrare bioma/particelle

**Decisione strategica: Campo Materiale confermato (#015)**
L'utente ha valutato i due paradigmi e scelto il Campo Materiale.
Il Sistema Geometrico resta come reference ma non verrà sviluppato.
Le idee utili (terrain heightmap, depositFn geometriche, mapping
registro locale) migrano nel campo come depositFn custom.

**Bozze 7 biomi elaborate**
Incrociati moodboard Pinterest (per-brano.md, visioni.md, visione-totale.md)
con MOOD.md per produrre preset completi: depositFn, force, decay, palette
per ciascuno dei 7 biomi. Mappatura moodboard→tracce: NEBBIA=Glaciale,
TESSUTO=Original, SOLCO=Dub Cosmico, RESPIRO=Glaciale+Luminoso,
MACCHINA=Rituale Techno, TEMPESTA=Rituale picco, RITORNO=Drone Abissale.

**Principio canvas-space identificato**
Problema: pitchToCell mappa MIDI 0-127 globalmente → ogni ruolo occupa
5-7 celle su 32 (19-22% del campo). Fix: mapping LOCALE del registro
per ruolo (stira il range attivo all'80% del campo). Il drone riempie
tutto. Nessuna zona sistematicamente vuota.

### File toccati
**Nuovi:**
- `src/geo.js` (Sistema Geometrico completo)
- `docs/MOOD.md` (ritratto 7 tracce)
- `docs/VISUAL-SPEC.md` (contratto geometrico)

**Modificati:**
- `src/config.js` (CFG.VISUAL.geo)
- `src/field.js` (import geo, _ensureGeoInit, geo branch, feedNote)
- `src/main.js` (Shift+G toggle + mutex)
- `src/render.js` (HUD debug + paradigm label + getGeoStatus import)
- `docs/DECISIONS.md` (#015)
- `docs/STATUS.md` (rigenerato)
- `docs/WORKLOG.md` (questa entry)

### Decisioni
- **#015** — Campo Materiale confermato come paradigma definitivo.
  Sistema Geometrico archiviato come reference. Principio canvas-space.

### Prossimo
- **P0 — Implementare i 7 biomi nel Campo Materiale.** Bozze pronte
  (sessione 8 output). Ordine: fix palette SOLCO (riscaldare) → NEBBIA →
  TESSUTO → RESPIRO → MACCHINA → TEMPESTA → RITORNO.
- **P0b — Mapping registro locale** per ogni ruolo in ogni bioma.
  Implementare `localPitchToCell(note, registerLow, registerHigh)` in
  campo.js. Drone riempie tutto.
- **P1 — Firma nel campo** — gelo (freeze decay), convergenza (attrazione
  celle verso centro), densityCap (gate probabilistico su feedNote).
- **P2 — RITORNO preserveOnSwitch** — non resettare il campo al cambio
  traccia verso RITORNO (il sedimento precedente è il punto).

---

## 2026-04-10/11 (sessione 7) — Campo Materiale: paradigma + infrastruttura

**Versione fine sessione:** v3.4.2 (nessun bump — codice nuovo, comp-* invariate)
**Branch:** `machine-iii`

### Obiettivo
Introdurre un paradigma di rendering alternativo a quello event-spawn delle comp-*:
il "Campo Materiale". Validarlo in sandbox e portarlo nel sistema live in parallelo
alle comp-* esistenti, senza rompere nulla.

### Fatto

**Audit sessioni 1-4 di Sprint B**
Riletta la lista pianificata in STATUS.md (sessioni 1-5) e verificato il codice:
sessioni 1-4 **già implementate** (rupture visibility, rupture bg shift, lifecycle
per canale, pitch→Y). Solo sessione 5 (Sprint B visivo) era ancora pendente.

**Decisione: abbandonare sessione 5 come scritta**
Analizzato item per item di sessione 5 contro il nuovo paradigma campo materiale:
- **5b (hard cut selettivo)** — obsoleto. Nel campo persistente non esiste
  discontinuità visiva da compensare con hard cut. L'infrastruttura resta aperta
  per un futuro `forceCut` opt-in quando la narrativa lo richieda.
- **5c (black frame)** — obsoleto per la stessa ragione.
- **5a (densityCap per traccia)** — si reinterpreta come `decayRate` per bioma nel
  campo. Non implementato come item separato.
- **5d (risograph misregistration)** — rimane coerente, da riprendere dopo biomi.

**Prototipo sandbox — `archive/sandbox/proto-campo.html`**
Validato il paradigma campo materiale standalone prima di toccare il sistema:
- `Float32Array(32×32)` per ruolo, decay + shimmer moltiplicativo (non additivo —
  primo bug: il shimmer additivo saturava celle vuote)
- Bayer 4×4 halftone, screen blend, Z-order grave→acuto, 20px/cella = 640×640
- Preset GENERIC + SOLCO con sequencer dub integrato (129 BPM, kickGrid/bassGrid
  complementari)
- Calibrazione SOLCO con fisica derivata dalla partitura reale
- Iterazione live su chord SOLCO: da cascata orizzontale → 3 colonnine verticali
  in zone X fisse, parte da metà canvas, testa più luminosa + scia che decade
  (feedback visivo con immagini di riferimento da `ispirazioni-machne/solco/JPG/`)
- Validata qualità della materia: "sembra funzionare" (utente)

**Implementazione nel sistema live**
File nuovi:
- `src/campo.js` — infrastruttura completa (state + API + render Bayer)
- `src/biomi.js` — preset per 7 biomi. GENERIC fallback + SOLCO calibrato. Gli
  altri 5 (NEBBIA, TESSUTO, RESPIRO, MACCHINA, TEMPESTA, RITORNO) sono alias di
  GENERIC — placeholder da calibrare in sessioni future.

File modificati:
- `src/config.js` — sezione `CFG.VISUAL.campo { useCampo, cells, cellPx, shimmer }`.
- `src/field.js` — import campo + early-return nel render quando useCampo=true,
  `campo.setBiome(track)` al cambio traccia. Feed MIDI centralizzato dentro
  `addMidiNote` (quando useCampo=true, forward a `campo.feedNote`).
- `src/render.js` — inizialmente aggiunto feed diretto da `midi.newNotes`, poi
  rimosso. Motivo: `midi.newNotes` contiene solo MIDI IN esterno; le note
  prodotte internamente dai moduli musicali passano solo da `sendMIDINote` →
  `addMidiNote`. Centralizzare in addMidiNote cattura entrambi i flussi. Era
  il bug della prima implementazione ("vedo solo zone di colore al centro" =
  solo note IN esterno, tutto il flusso interno era invisibile).
- `src/main.js` — toggle **Shift+C** (non M, che è occupato da MUSIC_EXPERIMENT)
  per attivare/disattivare il paradigma campo runtime.

**Test live**
Sistema completo testato:
- Toggle Shift+C funzionante
- SOLCO mostra la fisica corretta (kick/bass alternati, chord colonnine, arp
  cadente)
- Gli altri 6 biomi girano col placeholder GENERIC — un punto per nota, non
  esteticamente valido ma non bloccante
- Nessuna regressione sulle comp-* (default useCampo=false)

### File toccati
**Nuovi:**
- `src/campo.js`
- `src/biomi.js`
- `archive/sandbox/proto-campo.html` (sandbox)

**Modificati:**
- `src/config.js` (nuova sezione CFG.VISUAL.campo)
- `src/field.js` (import campo, early-return, feed in addMidiNote)
- `src/render.js` (nessuna modifica persistente — inizialmente toccato poi rollback)
- `src/main.js` (toggle Shift+C)
- `docs/STATUS.md` (riprioritizzazione post-campo)
- `docs/DECISIONS.md` (#014)

### Decisioni
- **#014** — Campo Materiale come paradigma alternativo alle comp-*, coesistenza
  via flag runtime, calibrazione progressiva bioma per bioma.

### Prossimo
- **P0 — Calibrare bioma per bioma la fisica nel campo** — ogni sessione può
  affrontare 1-2 biomi: definire colori, decay, forze, depositFn custom in
  `biomi.js`. Validare live con Shift+C. Ordine suggerito: NEBBIA (semplice,
  fa da banco di prova con 4 ruoli) → TESSUTO → RESPIRO → MACCHINA → TEMPESTA →
  RITORNO.
- **P0b — Residuo / sedimento inter-traccia nel campo** — ora il decay è
  implicito per ruolo. Aggiungere una visione esplicita di come accumulare
  memoria tra tracce (palimpsesto). Leve: decay più lento nei ruoli, o
  `_sharedResidual` separato.
- **P1 — Cablare firma.gelo / firma.convergenza / firma.densityCap al campo**
  (attualmente bypassate dall'early-return).
- **P2 — Camera narrativa nel campo** — `focusZone` + drift, eventuale zoom-out
  in RITORNO.
- **P3 — Rupture nel campo** — 4 stadi come nelle comp-*, interpretati come
  trasformazione delle forze/colori/decay piuttosto che overlay.

---

## 2026-04-09 (sessione 6) — Skill audiovisual-dramaturgy + framework pianeta

**Versione fine sessione:** v3.4.2 (nessun bump)
**Branch:** `machine-iii`

### Obiettivo
Creare la competenza mancante: connessione audiovisiva — derivare risposte visive
dalla fisica musicale, con mandato radicale se la coerenza è insufficiente.

### Fatto

**Brainstorming e design della skill**
Analizzato il gap tra `composition-depth` (sa la musica) e `visual-directing`
(sa la scena) — non esiste nulla che stia in mezzo e legga entrambi insieme.
Design iterativo della skill `audiovisual-dramaturgy` con metodologia di ascolto
e derivazione (non dizionario di mapping fissi).

**Analisi audiovisiva completa dei 7 biomi**
Letto tutto il codice musicale (tracks.js, bass-v3.js, rhythm.js, harmony.js,
melody-v3.js) e derivato il profilo caratteriale di ogni traccia.
Prodotta diagnosi SOLCO: 3/4 domande falliscono → redesign radicale confermato.
Fisica corretta identificata: gravità estrema, blocchi che cadono, terrain a Y≈0.75.

**Visione del pianeta come sistema unico**
La grammatica pitch→Y crea una topografia geografica coerente:
- Y 0.00-0.35: spazio aperto (NEBBIA, RITORNO)
- Y 0.35-0.65: fascia vitale (TESSUTO, RESPIRO sage, MACCHINA)
- Y 0.65-1.00: terrain (SOLCO, sediment di tutti i bassi)
RESPIRO (bg #7BBA91) è la feature geografica più riconoscibile da orbita.
RITORNO non è un bioma — è la camera che sale.

**Analisi palette sistema**
Confermata coerenza cromatica: il lime è il filo tra TESSUTO e SOLCO.
RESPIRO è il colpo di teatro cromatico (unico fondo chiaro). L'arco cream→lime→orange→
sage→yellow→white→lavanda è un arco emotivo completo. Il bg #0A0A0A di RITORNO
chiude il cerchio con NEBBIA.

**Prototipo proto-planet.html**
Framework geografico: 6 biomi come sediment statico, grammatica pitch→Y,
zoom-out RITORNO con barrel distortion, terminatore, alone atmosferico sage.
Validato: la fascia sage di RESPIRO è visibile e la geografia verticale regge.

**Skill scritta e deployata**
`app/.claude/skills/audiovisual-dramaturgy/` con 7 file:
- SKILL.md — tesi, grammatica, 4 domande, autorità radicale, protocollo
- references/listening-framework.md — come leggere la partitura (5 step)
- references/visual-derivation.md — dalla musica alla fisica visiva
- references/artistic-research.md — vocabolario per dominio (Malevich, Hara, Ikeda...)
- references/current-biomes.md — stato attuale + diagnosi dei 7 biomi
- references/technical-stack.md — primitivi, layer API, curva aging, anti-pattern
- references/project-history.md — archivio, errori ricorrenti, dinamica sessioni
- references/user-preferences.md — preferenze forti dell'autore

**CLAUDE.md aggiornato** con la nuova skill nella tabella.

### File toccati
- `app/.claude/skills/audiovisual-dramaturgy/SKILL.md` — nuovo
- `app/.claude/skills/audiovisual-dramaturgy/references/` — 7 file nuovi
- `app/proto-planet.html` — nuovo prototipo framework geografico
- `app/CLAUDE.md` — aggiunta skill nella tabella
- `app/docs/superpowers/specs/2026-04-09-audiovisual-dramaturgy-design.md` — spec

### Decisioni
- La skill non prescrive mapping fissi (DECISIONE chiave): deriva dalla partitura
- Le preferenze utente sono default forti: metterle in discussione solo se richiesto esplicitamente
- RITORNO non è un bioma: è la posizione della camera (confermato da analisi partitura)
- La fisica di SOLCO richiede redesign radicale (3/4 domande di coerenza falliscono)

### Prossimo
- Iterare `proto-solco.html` con nuova fisica (gravità + terrain): blocchi bass che cadono,
  shockwave kick su linea di impatto, lastre chord pitch-mapped
- Validare visivamente → integrare in comp-solco.js con piano preciso

---

## 2026-04-09 (sessione 5) — comp-solco: integrazione proto v7 + ridisegno scena

**Versione fine sessione:** v3.4.2 (nessun bump)
**Branch:** `machine-iii`

### Obiettivo
Integrare il sistema gaussiano+erosione del proto-solco in comp-solco.js. Poi riesaminare la visione della scena.

### Fatto

**Integrazione proto v7 → comp-solco.js**
Riscritto comp-solco.js (249 LOC → ~300 LOC):
- Rimosso sistema peg-and-string (ANCHORS, _drift, _drawForm, Lissajous)
- Portato campo gaussiano (ZOM/ZOS/ZLM/ZLB con jitter), erosione cellulare (`erodMap`+`erosion`), `buildupT`, 4 entità MIDI
- MIDI wiring: CH0=kick fronts, CH3=bass colonna, CH4=chord bande, CH5=voice banda+blocco, CH6=lead blocco

**Fix architetturale sediment**
Bug: LAYER_OVERLAY composited sopra MG → i buchi dell'erosione non si vedevano.
Fix: canvas privato `_sedC` composited dentro `lBg` → sediment sotto il campo, visibile attraverso i buchi.

**Rimosso auto-spawn**
Elementi si muovevano senza MIDI. Rimossi tutti i timer interni (kickTimer, bassTimer, chordTimer, arpTimer). Solo MIDI reale ora.

**Riflessione visiva: SOLCO ridisegnato da zero**
La colonna ZOS per il basso è fisica sbagliata (è RESPIRO, non SOLCO).
Visione ridisegnata:
- Scena divisa in due zone: vuoto sopra (85% dark) + geologia compressa sotto
- Bass = monolite arancione che cade dall'alto
- Kick = frattura sismica alla linea di impatto (non onde ascendenti)
- Chord = lastre lime a pitch-mapped height che scivolano giù
- Voice = traccia sismografica sottile (non cade, appare+svanisce)
- Arp = polvere di impatto, dot piccoli che cadono lenti
- Scritto prompt Gemini per immagine di riferimento della scena

### File toccati
- `app/src/comp-solco.js` — riscritto

### Decisioni
- Sediment privato (non LAYER_OVERLAY) per SOLCO: necessario per mostrare la geologia attraverso i buchi
- Fisica SOLCO = gravità estrema + impatti, non zone spaziali fisse
- Prossimo passo: prototipare la nuova scena in HTML standalone prima di toccare comp-solco.js

### Prossimo
- Prototipo HTML: monolite bass + frattura kick + lastre chord + strati geologici
- Solo dopo validazione visiva: integrare in comp-solco.js

---

## 2026-04-09 (sessione 4) — Piano visual system + aging curve ghost/fossil

**Versione fine sessione:** v3.4.2 (nessun bump)
**Branch:** `machine-iii`

### Obiettivo
Pianificare l'implementazione dell'intero sistema visivo e avviare le prime fasi.

### Fatto

**Ricognizione completa stato visual system**
Lette tutte le fonti: STATUS.md, VISUAL-VISION.md, 07-ARTISTIC-GAPS.md, WORKLOG, memoria progetto.
Obsidian vault (`Pointless Audio`) vuoto — nessuna nota rilevante.
Piano in 7 fasi ordinato per dipendenza.

**Fase 1 (Rupture visibilità) — già implementata al 100%**
Verificato che tutti e 7 i valori (ruptureTint + ruptI multiplier) erano già nel codice.

**Fase 2 — Aging curve ghost/fossil in `field.js`**
Sostituito il loop ghost/fossil overlay con:
- Curva aging quadratica: `dotSz = lerp(2, 14, t²)`, `density = lerp(0.85, 0.08, t²)`
- Colore: `spawnColor → residual → bg` lungo il lifecycle (GC-3)
- Performance: `fillRect` → `Uint32Array` su OffscreenCanvas dedicato (da `tech_pixel_manipulation.md`)

### File toccati
- `app/src/field.js` — ghost/fossil overlay riscritto

### Decisioni
- `_ghostCanvas` OffscreenCanvas allocato una volta, riusato ogni frame — zero readback GPU
- Test aging curve rimandato: sarà visibile dopo pitch→Y + identità bioma (annotato P3)
- MemPalace (repo esterno) valutato e scartato — ridondante con il sistema memoria esistente

### Prossimo
- Pitch → Y in 5 comp-* (GL-2) — grammatica base persa da v2
- Rupture BG shift (Sessione 2 STATUS)
- Proto-solco → comp-solco.js integrazione (P0)

---

## 2026-04-09 (sessione 3) — proto-solco: erosione cellulare + mappa suscettibilità + geometria random

**Versione fine sessione:** v3.4.2 (nessun bump — solo proto visivo)
**Branch:** `machine-iii`

### Obiettivo
Portare il sistema di erosione del proto-solco a un risultato visivamente convincente: buchi netti, organici, con zone di cancrena e zone resistenti.

### Fatto

**Rimosso sistema ellissi (v6)**
Le ellissi che crescevano/svanivano erano il sistema sbagliato — troppo esplicite, troppo leggibili come "evento". Sostituite con erosione cellulare permanente.

**Erosione cellulare con mappa suscettibilità (v7)**
- Griglia `ECOLS×EROWS` (320×180 celle da 4px) — allineata al dot Bayer
- `erodMap`: mappa statica calcolata al boot con rumore sinusoidale multi-scala
- Soglia dura: ogni cella è quasi immune (0.05) o vulnerabile (0.95) — niente gradiente
- Diffusione: le celle vulnerabili cedono quasi sempre, le resistenti bloccano
- Buchi netti con bordi definiti — la cancrena si espande solo dentro le patch vulnerabili

**Geometria gaussiana randomizzata**
Zone ZOM/ZOS/ZLM/ZLB hanno jitter random (cx/cy ±0.08, sx/sy ±30%) — ogni run ha una composizione spaziale diversa.

**Ciclo vita/morte**
- `buildupT` parte da 0, erosione inizia a 55% del buildup
- La mappa si ricalcola a ogni reset (tasto 0) → geografia diversa ogni ciclo
- Sediment rimane visibile attraverso i buchi — storia del passato leggibile

### File toccati
- `app/proto-solco.html` — iterato v5→v6→v7 (da ellissi a erosione cellulare)

### Decisioni
- L'erosione deve essere permanente (celle non tornano) — non animazione reversibile
- La mappa di suscettibilità con soglia dura crea pattern organici più convincenti del gradiente uniforme
- Geometria gaussiana randomizzata: ogni sessione live ha una scena visivamente diversa

### Prossimo
- Integrare `comp-solco.js` con la fisica del proto (campo gaussiano + erosione cellulare)
- Calibrare `seedRate`/`spreadTrials` dopo test live esteso
- Verificare che l'erosione sia visivamente leggibile anche su proiettore (contrasto basso)

---

## 2026-04-09 (sessione 2) — Iterazione proto-solco: campo gaussiano + cross-modal + buildup

**Versione fine sessione:** v3.4.2 (nessun bump — solo proto visivo)
**Branch:** `machine-iii`

### Obiettivo
Iterare `proto-solco.html` finché composizione è soddisfacente. Passare da "non ci siamo"
a "quasi — questa è la direzione giusta".

### Fatto

**Cambio architetturale: da forme MIDI-reactive a campo gaussiano**
Letto `archive/code/versions/v2.9.3-field.js` per capire come v2 calcolava il campo.
Il punto chiave: v2 usava densità per-pixel da zone gaussiane sovrapposte + forme MIDI come
shape nel campo — non rettangoli predefiniti che reagivano al MIDI.
Ricostruito lo stesso approccio nel proto: `renderPass(ctx, css, dFn)` + zone gaussiane
`ZOM/ZOS/ZLM/ZLB` con `gauss(nx,ny,zone)` + `voidF(ny)` bottom-heavy.

**Cross-modal instrument identity (v4→v5)**
Ogni strumento ha zona spaziale propria + forma distinta:
- KICK → FRONTE: 3 onde orizzontali ascendenti dal terrain, staggered (delay 0/7/14 frame)
- BASS → COLONNA: zona ZOS full-height (no voidF), respira con bassEnv
- CHORD → BANDA: 3 strisce pitch-mapped Y 0.12→0.88 (voicing presets), range completo
- ARP → BLOCCO: piccoli rettangoli verticali che cadono, X camminante dx→sx

**ZOS senza voidF**
La colonna bass è la parete del canyon — visibile dall'alto al basso, diversa dal materiale
geologico che si accumula per gravità. Soluzione: ZOS moltiplicata per il suo moltiplicatore
di densità ma NON per voidF nel renderPass orange.

**Buildup iniziale**
`buildupT` parte da 0, raggiunge 1 in 10 secondi. I renderPass moltiplicano per `smooth(buildupT)`.
Il campo emerge gradualmente dall'oscurità — non appare già formato.

**Rupture holes: ellissi**
Cambiate da rettangoli a ellissi con cx/cy/rx/ry variabili. Crescono da un punto (20% vita),
bordo morbido (70% centro pieno, 30% fade spaziale), poi svaniscono (22% fade out).
`inHole(nx,ny)` restituisce [0,1] → entrambi i renderPass moltiplicano per `(1-inHole)`.
Il sediment rimane visibile attraverso i buchi → il campo si ricrea dopo naturalmente.

**Arp walking X + scia persistente**
Spawn X cammina da dx (0.82-0.92) verso sx con passi `ARP_X_STRIDE=0.09`, poi resetta.
Cade verticalmente (no vx). Scia verticale dal punto di spawn. La scia viene depositata
nel sediment ogni 2 frame (`fillB(sed, ...)`) → persistenza visiva dopo la morte del blocco.

### File toccati
- `app/proto-solco.html` — iterato v1→v6 (5 versioni questa sessione)

### Decisioni
- Il processo giusto: campo gaussiano per background + forme evento per MIDI-triggered shapes.
  Non il contrario (non forme che reagiscono al MIDI come first-class).
- Arp verticale con X camminante è più leggibile e sintetico rispetto a arp orizzontale.
- Buchi in rottura = ellissi (più organico di rettangoli).
- Trail nel sediment = persistenza senza inquinare il campo corrente.

### Prossimo
1. Aprire `proto-solco.html` su browser e verificare che buildup + arp walking + holes funzionino
2. Calibrare velocità buildup (attuale 10s — potrebbe servire più tempo)
3. Calibrare frequenza buchi in rottura (attuale ogni 1.6s) + rx/ry range
4. Decidere se il prototipo è pronto per integrazione in `comp-solco.js` o serve ancora iterazione

---

## 2026-04-09 — Analisi visiva + visione pianeta + processo prototipazione

**Versione fine sessione:** v3.4.2 (nessun bump — solo doc + proto visivo)
**Branch:** `machine-iii`

### Obiettivo
Capire perché le sessioni visual continuano a fallire. Trovare la visione giusta e un processo che funzioni.

### Fatto

**Diagnosi gap v2→v3**
Analisi approfondita delle differenze tra v2 (DESIGN.md) e v3 attuale.
Gap critici identificati: dot-size fisso (v2 aveva lifecycle 2px→14px), scaffold uniforme,
forme agli angoli extremi (ANCHORS sui bordi), MIDI non protagonista visivo diretto,
camera infrastruttura esiste ma mai guidata da director3.
Infrastruttura v3 (layer stack, rupture, event-register, palettes) è solida — non toccare.

**Visione "Il Pianeta"**
7 biomi con fisica radicalmente diversa. Ogni bioma ha legge propria:
NEBBIA=centrifuga/nebulosa, TESSUTO=tensione orizzontale/fibra, SOLCO=gravità estrema/geologia,
RESPIRO=pressione membrana/pori, MACCHINA=nessuna fisica/griglia, TEMPESTA=impulsi magnetici/caos,
RITORNO=visione orbitale del pianeta intero.
Momento chiave: RITORNO zooma out e il pubblico vede la mappa geografica di 55 minuti di musica.

**Primitivi v2 mappati sui biomi v3**
NEBBIA=SCIAME+VUOTO, TESSUTO=STRISCIA+FRONTE, SOLCO=BLOCCO+FRONTE,
RESPIRO=VUOTO(invertito), MACCHINA=MATRICE+BANDA, TEMPESTA=VETTORE+STRISCIA.

**Processo prototipazione**
Identificato il failure mode: si pianifica astratto → si implementa nel sistema principale → delusione.
Fix: prototipo HTML standalone per ogni bioma prima di toccare il sistema principale.
Costruito `app/proto-solco.html` come primo tentativo (composizione ancora non soddisfacente,
feedback utente: "non mi piace praticamente nulla").

**Documento di riferimento creato**
`docs/VISUAL-VISION.md` — sintesi completa: tesi, gap v2→v3, 7 biomi con fisica+primitivi+MIDI,
curva aging universale, processo di lavoro, prossimi passi.

### File toccati
- `docs/VISUAL-VISION.md` — nuovo, documento di riferimento visivo definitivo
- `app/proto-solco.html` — nuovo, prototipo standalone (da iterare)

### Decisioni
- Il prototipo visivo viene PRIMA dell'integrazione nel sistema principale — sempre.
- La curva lifecycle `dotSize = lerp(2, 14, t²)` è la priorità implementativa #1.
- Ogni bioma ha fisica radicalmente diversa — non variazioni dello stesso tema.

### Prossimo
1. Iterare `proto-solco.html` finché composizione è soddisfacente (utente deve valutare)
2. Capire cosa non piace del proto attuale: forma, colore, movimento, carattere?
3. Usare `docs/VISUAL-VISION.md` come guida per ogni bioma

---

## 2026-04-08 — Sessioni 1-3 + tentativi visual grammar (esito parziale)

**Versione fine sessione:** v3.4.2 (nessun bump — modifiche visive, nessun cambio musicale)
**Branch:** `machine-iii`

### Fatto

**Sessione 1 — Rupture visibilità (7 edit, 5 file) ✅**
- `config.js`: ruptureTint NEBBIA→#00BFFF, RESPIRO→#CCFF00, TEMPESTA→#FF0040
- `comp-griglia.js:171`: ruptI * 0.01 → 0.08
- `comp-quadrati.js:206`: ruptI * 0.08 → 0.30
- `comp-treno.js:137`: lerp(1.0,1.04) → lerp(1.0,1.18)
- `comp-liminale.js:214`: lerp(1.0,1.5) → lerp(1.0,3.0)

**Sessione 2 — Rupture BG shift (4 file) ✅**
- `config.js`: ruptureBg per tutte e 7 le tracce (inversione bg)
- `world-state.js`: ruptureBg: null in palette default
- `director3.js`: worldState.palette.ruptureBg = tp?.ruptureBg ?? null
- `colors.js`: lerp _target.bg → ruptureBg quando ri > 0.6

**Sessione 3 — Color per canale (2 file) ✅**
- `config.js`: CFG.VISUAL.roleColors (kick/perc: dot, drone/bass/voice/lead/arp: accent)
- `event-register.js`: import getPalette, _pickSpawnColor, spawnColor nel factory

**Sessione 4 — Pitch→Y (2 fix) ✅**
- `comp-treno.js:169`: fix bug n.note/127 → 1-n.note
- `comp-quadrati.js`: arp particles cy da block center → H*(1-n.note)

**Ghost/fossil fix ✅**
- `field.js`: patch Bayer attorno all'evento invece di singolo dot con Bayer gate
- `config.js`: ghostRadius/fossilRadius, blend ridotti
- `render.js`: nx=noteNorm invece di 0.5 fisso

**Tentativo visual grammar — SOLCO ⚠️**
- `comp-solco.js`: nuovo da zero (due forme Bayer orange/lime, peg-and-string, 8 ancore, sediment)
- `field.js`: SOLCO→compSolco nel COMP_MAP
- `comp-linee.js`: zoom fisso 1.00 (rimosso camera vertigine)
- Risultato: direzione tecnicamente corretta (Bayer, no solid fill) ma composizione non soddisfacente

### Diagnosi sessione

La sessione ha risolto i debiti tecnici (rupture, ghost, pitch→Y) ma non ha risolto il problema artistico fondamentale: il sistema visivo v3 non produce la qualità compositiva di v2. Le comp-* attuali (tranne comp-solco nuovo) usano solid fill o geometrie non integrate con il campo Bayer. L'utente ha dato una regia dettagliata per traccia (Mondrian, accumulazione, sottrazione) ma l'implementazione non ha raggiunto la visione. Sessione conclusa per stanchezza.

### File toccati
`config.js`, `world-state.js`, `director3.js`, `colors.js`, `event-register.js`,
`comp-griglia.js`, `comp-quadrati.js`, `comp-treno.js`, `comp-liminale.js`,
`comp-linee.js`, `comp-solco.js` (nuovo), `field.js`, `render.js`

### Prossimo (quando si riprende)
- Decidere se continuare con comp-solco come base e estendere alle altre tracce
- O riconsiderare l'architettura comp-* in favore di un sistema più vicino al v2 (shapes MIDI attraverso campo Bayer globale)
- La regia per traccia esiste ed è completa — manca solo l'implementazione corretta

---

## 2026-04-07 (notte, pianificazione strategica) — piano completo pre-implementazione

**Versione fine sessione:** v3.4.2 (nessun codice toccato — sessione solo pianificazione)
**Branch:** `machine-iii`

### Obiettivo
Costruire un piano implementativo completo e preciso per le prossime sessioni,
partendo dall'analisi di screenshot delle versioni precedenti e da un piano
esterno (MACH:INE II) portato come riferimento.

### Fatto

**Analisi versioni precedenti (screenshot)**
Identificati 3 concetti visivi persi nella transizione v2→v3:
terrain/ambienti abitabili, multi-scale halftone depth, ASCII depth zones.

**Production team review (Regista + Critico + Compositore)**
Diagnosi: sistema mappa solo densità, non geometria/timbrica/registro.
Convergenza: pitch non mappa Y (5/6 comp), lifecycle omogeneo, halftone piatto.
RESPIRO unica comp con metafora precisa. CH0 kick in comp-quadrati unico mapping ritmico reale.

**Piano MACH:INE II analizzato**
Piano per v2.9.x non applicabile (architettura diversa) ma insight riusabile:
"il sistema visivo c'è già, è spento — rimuovere il velo."
In v3: il velo = lifecycle omogeneo + pitch ignorato + no vocabolario geometrico.

**Aggiunte a ARTISTIC-GAPS.md**
GL-1/2/3/4 (geometric language), GC-1/2/3 (color grammar), WG-1/2/3 (world grammar).
Sprint E (geometric language) e Sprint D (world grammar) aggiunti.

**Diagnosi rupture invisibile — valori esatti:**
3 tracce ruptureTint quasi identico al dot (NEBBIA '#F3F0EA'≈'#E9E1D3', TEMPESTA, RESPIRO).
4 multiplier ruptI troppo piccoli (comp-griglia 0.01, comp-quadrati 0.08, ecc.).
BG non reagisce a rupture.intensity.
Tutti i valori di fix specificati in STATUS.md P3.

**Camera per traccia (P4e)**
Infrastruttura esiste ma director3.js non pilota worldState.camera.
Aggiunto piano preciso come P4e.

**Sequenza sessioni precisa definita in STATUS.md:**
Sessioni 1-5 con file + riga + valore esatto. Nessuna esplorazione necessaria.

**Feedback salvato in memoria:** pianificare prima di codificare.

### File toccati
- `docs/STATUS.md` — P3 rupture fix preciso, P4c/d/e, sequenza sessioni 1-5
- `docs/07-ARTISTIC-GAPS.md` — GL/GC/WG items, Sprint D/E
- `~/.claude/projects/.../memory/feedback_planning_before_coding.md` — nuova memoria

### Decisioni
- #005 (da appendere a DECISIONS.md): piano implementativo pre-sessione obbligatorio.
  Ogni item = file + riga/valore prima di toccare qualsiasi file.

### Prossimo
Sessione 1: implementare rupture fix (7 righe, nessuna esplorazione necessaria).
Appendere decisione #005 a DECISIONS.md.

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

---
<!-- knowledge-graph links -->
[[STATUS]] [[DECISIONS]]
