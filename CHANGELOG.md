# CHANGELOG

Tutte le modifiche significative al progetto sono documentate qui.
Formato: `[versione] – data – descrizione`

---

## [v2.0.0] – 2026-03-25

**Concerto narrativo a 5 atti — struttura drammaturgica completa per performance 40 minuti.**

### Aggiunto
- **Sequencer v3**: struttura a 5 atti (EMERGENZA / DISCESA / MACCHINA / VORTICE / RITORNO) con sovrapposizione multi-motore simultanea
- **Presence multiplier system** (`presence-multiplier.js`): ogni motore ha un coefficiente 0→1 che modula la generazione musicale senza spegnere il motore — consente crossfade tra motori sovrapposti
- **Channel gating**: tutti i 6 composer rispettano il presence multiplier, scalando velocity e densita delle note MIDI proporzionalmente
- **Momenti-firma**: GELO (min 24 — entita congelate), CONVERGENZA (min 33 — attrazione al centro), INVERSIONE (min 34 — climax globale tutti i motori al massimo), VUOTO TOTALE (min 36 — blackout)
- **Apertura concerto**: emersione quadratica da zero in 120s (`firma.densityCap`), DERIVA attiva a t=30 quando il campo e al ~6% di luminosita
- **Chiusura concerto**: dissoluzione quadratica negli ultimi 90s (da t=2310 a t=2400)
- **Colore progressivo**: colori sbloccati per atto — Atto I monocromo, Atto II +accent1, Atto III +accent2, Atto IV +accent3 solo in climax
- **Climax cromatico reale**: bg palette tinta verso magenta scuro + boost alpha entita (sostituisce overlay debole)
- **Palette engine-specific**: ice (CRISTALLO), abyssal (ABISSO), steel (MECCANICA), ikeda (VORTICE)
- **MIDI colors engine-aware**: palette MIDI dedicate per CRISTALLO (ice blues), VORTICE (bianco/rosso), ABISSO (deep blue/viola), MECCANICA (industrial red)
- **Camera breathing**: oscillazione ritmica zoom/offset sincronizzata al BPM del motore attivo
- **Camera DRIFT**: nuovo shot con shake opzionale per VORTICE
- **Tensione narrativa**: tracking tensione nell'arco del director, modulazione soglie fasi, boost da rupture takeover
- **Impatto e contrasto temporale**: metriche narrative in state.js per variazioni improvvise di intensita
- **Audio input gain**: default aumentato a 5.0× per segnali deboli (regolabile `[` `]`)

### Modificato
- `sequencer.js` riscritto: da lineare 6-motori a struttura 5 atti con cue system (silence/activate/layer/fade_to/camera/firma/end) e transizioni simultanee con ease cubica
- `director.js`: ENGINE_PREFS esteso con camera allow set, breathing, palette engine-dedicated
- `field.js`: densityCap applicato uniformemente a tutta la composizione (ambient + MIDI + entita)
- `colors.js`: desaturazione progressiva per atto, bg tinting in climax, engine MIDI color overrides
- `main.js`: supporto multi-motore simultaneo tramite presence multiplier (non piu mutua esclusione pura)
- `midi-patterns.js`: DERIVA chords size 0.09→0.16 per maggiore visibilita

---

## [v1.7.0] – 2026-03-25

**Qualita musicale avanzata + MIDI Clock reale + debug generale.**

### Aggiunto
- MIDI Clock output 24ppqn: Start (0xFA), Stop (0xFC), Clock tick (0xF8) per sincronizzazione Ableton/DAW
- Auto Start/Stop MIDI clock all'attivazione/disattivazione di un motore
- TERRENO: progressioni accordali fisse per fase (Dm→G→F→Dm), bass patterns sincopati (downbeat/anticipation/half-time/off-beat), swing kick (+20ms su beat pari), memoria motivica nella voce (ripetizione/variazione intervalli)
- MECCANICA: progressioni fisse (C#m→E→F#m→C#m), groove shuffle implementato (±10ms), bass cromatico (root→chromatic→fifth→minor3rd), call-and-response VOICE↔LEAD (LEAD inverte l'intervallo dal root)
- DERIVA: grain convertito da percussione GM a texture pitched (A Lydian registro alto 72-93), LEAD deriva motif dall'accordo corrente, contour rule Narmour sulla voce
- VORTICE: rotazione pattern sfalsata (kick ogni 8 bar, ghost ogni 12, bass ogni 16, micro-loop ogni 10), bass con Gb (b2 Phrygian) e Ab, micro-loop transposition (0-3 gradi scala)
- CRISTALLO: shimmer patterns variabili (up/down/suspend/scatter con rotazione), grain piu denso (ogni 2 beat) con double sparkle occasionale, chord voicings estesi (maj7, add9, add11)
- ABISSO: CH4 chords con pad Bbm/Cb rituali ogni 8 beat, 5 canali presence (bass, drone, voice, grain, chords), bass rituale root→Cb→root→Eb, grain a frequenza variabile (ogni 4→2→1 beat)
- Launcher `launch.sh` su porta 8282

### Fix
- `composer4.js`: `lastPatternBar` non dichiarata causava ReferenceError bloccando l'avvio dell'app

---

## [v1.6.0] – 2026-03-25

**Sequencer autopilot + identita visiva profonda per motore.**

### Aggiunto
- `sequencer.js`: performance automatica ~40 minuti attraverso 6 motori (DERIVA→CRISTALLO→ABISSO→TERRENO→MECCANICA→VORTICE)
- Transizioni inter-motore con mutation storm (4 mutazioni, invert dissolve, chromatic shift, 6 secondi)
- Tasto `0` = start/stop sequencer, `→` = skip al prossimo motore
- Parametri visivi deep per motore in ENGINE_PREFS: shapeScale, trailLength, waveSpeed, flickerSpeed, densityGravity, midiDensityMul
- `field.js`: supporto per parametri engine-level (shape scale, trail length, onset wave speed, flicker speed, density gravity, MIDI density multiplier)
- HUD: display motore attivo nel minimal HUD, stato sequencer con progress bar
- Rimappatura tastiera completa: 1=DERIVA, 2=CRISTALLO, 3=ABISSO, 4=TERRENO, 5=MECCANICA, 6=VORTICE

### Modificato
- `director.js`: ENGINE_PREFS esteso con parametri visivi profondi per tutti e 6 i motori
- `render.js`: display engine name e composer status per tutti e 6 i composers

---

## [v1.5.0] – 2026-03-25

**Tre nuovi motori compositivi (6 totali) + miglioramenti musicali.**

### Aggiunto
- `composer4.js` — VORTICE (F Phrygian, 138 BPM): step sequencer tribale a 16th note resolution, 4 pool pattern kick, 4 ghost, 3 bass, micro-loop poliritmici A(8)+B(5)+C(3) steps
- `composer5.js` — CRISTALLO (Eb Lydian, 54 BPM): ambient cristallino, shimmer arpeggios dal chord, sub-drone ogni 16 beat, pad sustain ×4, grain high register sparkle
- `composer6.js` — ABISSO (Bb Phrygian, 76 BPM): drone rituale root+fifth ogni 12 beat, heartbeat pulse, risalita ottava in rottura
- `config.js`: COMPOSER4, COMPOSER5, COMPOSER6 con fasi, presence, rupture, parametri specifici
- `main.js`: import/toggle/update per tutti e 6 i composers, keyboard 1-6

### Modificato
- `midi-patterns.js`: ENGINE_BEHAVIORS esteso con vortice, cristallo, abisso (identita visiva per canale)
- `director.js`: ENGINE_PREFS per vortice, cristallo, abisso (palette, scene, behaviours)

---

## [v1.4.0] – 2026-03-25

**Identita musicale e visiva distinta per motore.**

### Aggiunto
- `midi-patterns.js`: ENGINE_BEHAVIORS con varianti visive per-engine (TERRENO/MECCANICA/DERIVA), forme/decay/colori distinti per canale per ciascun motore
- `director.js`: ENGINE_PREFS con palette e scene preferenziali per motore attivo, applicazione palette all'attivazione
- TERRENO: BPM portato da 116 a 72 (dub lento)
- MECCANICA: BPM portato da 108 a 98 (techno strutturato)
- DERIVA: tonalita principale cambiata da D Dorian ad A Lydian, PULSE e BASS rimossi dalle presence (ambient beatless), brightness trigger adattivo per VOICE
- `composer3.js`: grain convertito da percussione GM (hihat/claves/side stick) a texture pitched dalla scala corrente

### Modificato
- `render.js`: engine tag passato a sistema visivo, forceInvert per engine override
- `config.js`: aggiornati BPM, tonalita, parametri brightness trigger

---

## [v1.3.0] – 2026-03-24

**Tre motori compositivi autonomi + MIDI unificato a 8 canali.**

### Aggiunto
- `composer.js` — Composer 1 (D Dorian, 116 BPM): EuclideanEngine E(5,16), Markov 2° ordine, 5 fasi GERMOGLIO→PULSAZIONE→DENSITÀ→ROTTURA→DISSOLUZIONE, PresenceManager, RuptureEngine 4 stadi
- `composer2.js` — Composer 2 (C# Dorian, 108 BPM): 4 layer oscillatori sfasati (harmonic/rhythmic/textural/melodic), VoidManager silence ≥40%, director event bus (tension/void/grain_entry/chord_change/rupture_stage/density_peak)
- `composer3.js` — Composer 3 (D Dorian DERIVA, 84 BPM motorik): 8 tracce fedeli alla spec `new/`, GrainEngine percussioni GM (hihat/claves/sideStick/clap/tom), ChordEngine progressioni fisse (Dm→F→Dm→C), MarkovEngine peso ×3 su note accordo, RuptureEngine con note off-scale in presagio (Bb/F#, vel 28)
- `midi-clock.worker.js` — Web Worker clock MIDI: tick preciso anche con Ableton in primo piano (nessun throttling rAF)
- `midi-patterns.js` v1.3: mapping canonico 8 canali (CH0=PULSE CH1=GRAIN CH2=DRONE CH3=BASS CH4=CHORDS CH5=VOICE CH6=LEAD CH7=RUPTURE), rotation automatica pattern ogni 12–20 bar
- Mutua esclusione completa tra i tre composer (tasti `1`, `2`, `3`)
- Gain audio input controllabile live (`è`/`+`, range 0.5–8.0×, visibile in HUD)

### Stack
- ES modules nativi
- Canvas 2D API
- Web Audio API (stereo via BlackHole)
- WebMIDI API + Web Worker clock

---

## [v1.2.0] – 2026-03-23

**Colori puri + forme MIDI per tipo di suono + arco audio-driven.**

### Aggiunto
- 6 fasi arco narrative RMS-driven: SILENCE / BUILDING / ACTIVE / INTENSE / PEAK / DECAY con isteresi configurabile
- Region fillColor: aree delle composizioni con colore tinta (accent1/2/3) anziché solo densità
- Camera narrativa per fase arc: SILENCE→WIDE, BUILDING→MEDIUM, PEAK→MACRO, DECAY→PAN
- 5 canali MIDI distinti per ruolo visivo: KICK, BASS, HARMONY, LEAD, TEXTURE con comportamenti indipendenti
- Forme MIDI per ruolo: pulse (kick), column (bass), band (harmony/chords), trail (voice/lead), scatter (grain)
- Scene MONDRIAN e HORIZON aggiunte

---

## [v1.1.0] – 2026-03-23

**Audio-driven density: spazio negativo reale.**

### Aggiunto
- `densityVoidThreshold`: sotto la soglia → zero assoluto (non rumore, nero puro)
- Compressione non-lineare del campo: `(d - voidThreshold)^1.6`
- `densityFloor` ridotto a 0.01 per consentire veri vuoti
- `densityMax` ampliato a 0.65 per range dinamico più ampio
- Band audio → spazialità: sub/low verso basso del campo, high/air verso alto

---

## [v1.0.0] – 2026-03-23

**Piano narrativo Mondrian.**

### Aggiunto
- 8 scene estetiche con nome: BAYER_CLASSIC, COLORED_GROUND, SPARSE, DENSE, MONOCHROME, NEGATIVE, MONDRIAN, HORIZON
- 8 composizioni rettangolari (spatial density layouts): MONDRIAN_A/B, ISLANDS, COLUMNS, FRAME, ASYMMETRIC, HORIZON
- 7 palette dinamiche con lerp smooth: default, amber, cyan, bw, magenta, warm, cold
- Arco narrativo INTRO→CLIMAX→RELEASE guidato dal Director
- Onset wave: onda di densità radiale che si espande dall'origine dell'onset
- Blend smooth tra scene con transizione per-primitivo

---

## [v0.9.0] – 2026-03-22

**Sinestesia geometrica MIDI.**

### Aggiunto
- `midi-patterns.js`: 5 canali separati con ruolo musicale (KICK/BASS/HARMONY/LEAD/TEXTURE)
- Colori MIDI per canale: amber, deep red, cyan, violet, steel
- Forme geometriche distinte: pulse, column, band, trail, scatter
- `xMode` per canale: pitch (melodico), center (bass), spread (kick), random (texture)
- Zone spaziali per canale: BASS occupa metà inferiore, LEAD metà superiore, HARMONY banda centrale
- Radius audio-linked: CH0 PULSE modulato da velocity, CH1 GRAIN da banda air, CH2 DRONE da sub
- Pattern rotation automatica su base bar

---

## [v0.8.0] – 2026-03-22

**Collegamento audio reale — da sandbox monolitico a ES modules modulari.**

### Aggiunto
- 6 nuovi moduli ES: `config.js`, `dna.js`, `generations.js`, `colors.js`, `director.js`, `field.js`
- Campo halftone con Bayer 8x8 dither completamente modulare
- Zone Voronoi (8 seed random) con lookup pre-baked 24×24 per performance
- 8 primitivi strutturali: BANDA, BLOCCO, VETTORE, VUOTO, FRONTE, SCIAME, STRISCIA, MATRICE
- Generazioni con ciclo vita completo e spatial hash grid (32px)
- Sistema cromatico A/B/C con climax, inversione dissolve Bayer, shift cromatici
- 5 mutazioni pesate + regista con timing adattivo
- Camera 2D: WIDE/MEDIUM/MACRO/PAN con POI tracking e lerp adattivo
- Dual HUD: minimal (bottom-left, default ON) + debug (bottom-right, toggle D)
- Keyboard: H=HUD, D=debug, F=fullscreen, R=regen DNA, N=mutazione manuale

### Modificato
- `render.js` riscritto come orchestratore di tutti i sottosistemi
- `main.js` riscritto: boot → initAudio → initMIDI → generateDNA → initDirector → loop
- `index.html` riscritto: fullscreen canvas, start screen, error screen, keys hint

### Stack
- ES modules nativi (nessun build step, nessuna dipendenza)
- Canvas 2D API
- Web Audio API (stereo via BlackHole)
- WebMIDI API

---

## [v0.7.0] – 2026-03-22

**Il Direttore — camera 2D con 4 shot, lerp adattivo, POI tracking, integrazione regista.**

### Aggiunto
- Camera 2D: 4 shot (WIDE, MEDIUM, MACRO, PAN) come trasformazione del canvas context
- Point of Interest (POI): centro di massa delle entità vive, usato come target per MEDIUM e MACRO
- MACRO auto-return: dopo ~5s ritorna automaticamente allo shot appropriato
- Lerp adattivo: rhythmicity > 0.5 → transizione rapida (0.08), altrimenti lenta (0.02)
- PAN con oscillazione verticale sinusoidale
- Auto-camera integrata col regista: 60% solo mutazione, 25% mutazione+camera, 15% solo camera
- Scelta shot intelligente: intensity bassa → WIDE, rhythmicity alta → MACRO, plateau → PAN, default → MEDIUM
- 4 pulsanti camera manuali nel pannello (disattivano auto-camera)
- Toggle AUTO camera (default ON)
- Readout: shot corrente, zoom, offset, timer ritorno MACRO

### Modificato
- Framing completamente riscritto con POI tracking e logica decisionale
- Director ora include decisioni camera nelle mutazioni

### Stack
- HTML + JavaScript vanilla (file unico, nessuna dipendenza)
- Canvas 2D API

---

## [v0.6.0] – 2026-03-22

**Sistema cromatico A/B/C integrato nel campo, 5 tipi di mutazione, regista adattato.**

### Aggiunto
- Colore A (#FF4400): entità nate da onset, decadono a grigio con l'età
- Colore B (#00AACC): entità nate da MIDI, stessa logica di decay
- Colore C (#E6007E): climax — tutte le entità virano a magenta dopo 3s a intensity > 0.85
- Contaminazione A su B: onset vicino a entità B le fa virare verso A
- Climax reworked: shift graduale colore, dot-size compression, density boost, collasso al rilascio
- 5 mutazioni pesate: PRIMITIVE (30%), INVERT (15%), RESET_PARTIAL (15%), CHROMATIC (25%), SCALE (15%)
- Inversione con dissolve Bayer (~1s transizione cella per cella)
- Reset parziale: kill zone rettangolare random
- Shift cromatico: all-A / all-B / grey per 20s
- Cambio scala: modifica range dot-size (fine o coarse)
- Toggle colore A/B/C nel pannello
- Pulsanti manuali per forzare ogni mutazione
- Log ultime 5 mutazioni con timestamp
- Readout: contatori entità A/B/C, stato chromatic shift, climax progress %

### Modificato
- Render loop color-aware: ogni dot renderizzato nel colore dell'entità più giovane nella cella
- Entity grid ora traccia colore dominante + alpha per cella (youngest wins)
- Climax non è più overlay — è proprietà delle entità stesse

### Stack
- HTML + JavaScript vanilla (file unico, nessuna dipendenza)
- Canvas 2D API

---

## [v0.5.0] – 2026-03-22

**DNA di sessione, 8 primitivi strutturali, generazioni con ciclo vita e accumulo.**

### Aggiunto
- DNA di sessione: all'avvio genera 2-3 primitivi random con parametri unici
- Pulsante REGEN DNA per rigenerare il mondo
- 6 nuovi primitivi oltre a BANDA e BLOCCO: VETTORE, VUOTO, FRONTE, SCIAME, STRISCIA, MATRICE
- Generazioni complete: nascita → crescita → maturità → invecchiamento → morte → fossile
- Spatial hash grid (32px) per densità entità efficiente
- Entity lifecycle: dot-size degenera con l'età, densità cala in invecchiamento
- Residui fossili delle generazioni morte (densità ~0.03 per qualche secondo)
- Accumulo: generazioni si sovrappongono (giovani sopra, vecchie sotto)
- Slider EVO per velocità evoluzione
- Readout: DNA primitives, entity count, fossils, avg age, birth rate
- Densità campo legata a intensity con curva quadratica (campo vuoto a intensity 0)

### Modificato
- Regista: mutazioni PRIMITIVE swap, FRAMING, INVERT, RESET (non cambio scene)
- densityBase a 0: i dot emergono gradualmente con l'intensity

### Stack
- HTML + JavaScript vanilla (file unico, nessuna dipendenza)
- Canvas 2D API

---

## [v0.4.0] – 2026-03-21

**Campo halftone con dither Bayer, dot-size dinamico, primitivi BANDA e BLOCCO.**

### Aggiunto
- Campo di densità renderizzato con matrice Bayer 8x8
- Dot-size dinamico (1-16px) guidato da brightness (centroid simulato)
- Densità base modulata da intensity
- Primitivo BANDA: zona rettangolare di alta densità, bordi netti, si muove e pulsa
- Primitivo BLOCCO: rettangolo con dot-size diverso dal campo, ciclo vita con fade in/out
- Onset come onda di densità (non flash sovrapposto): si propaga dal campo stesso
- MIDI come colonna verticale di densità alta a posizione random
- Distribuzione spaziale da stereo width (centro vs uniforme)
- Trajectory come gradiente verticale di densità
- Brightness: modula dot-size E densità del campo (suono brillante = più visibile)
- Rhythmicity: velocità bande, ciclo blocchi, flicker pulsante del campo
- Inversione bianco/nero (toggle + regista)
- Slider DOT override manuale per testing
- Doppia strategia render: fillRect (dot >= 6px) e buffer+scale (dot < 6px)
- Readout: dot-size, densità media, contatori elementi

### Modificato
- Sostituita scena particelle v0.3.0 con campo halftone
- Regista ora include INVERT tra i tipi di cambio

### Stack
- HTML + JavaScript vanilla (file unico, nessuna dipendenza)
- Canvas 2D API

---

## [v0.3.0] – 2026-03-21

**Sandbox narrativo con regista, scene, framing, simulazione input.**

### Aggiunto
- `sandbox.html` — strumento di design self-contained per progettare il comportamento del sistema
- Pannello di controllo con slider per i 5 valori dello Stato (intensity, rhythmicity, brightness, trajectory, stereo width)
- Pulsanti ONSET (spazio) e MIDI NOTE (M) per simulare eventi
- 3 preset rapidi: AMBIENT, BUILDING, PEAK
- Logica del Regista: timer, probabilità di cambio scena, plateau detection
- Tipi di cambio: TEXTURE, FRAMING, COLOR, RESET
- Scena di test: campo di punti con dither Bayer 8x8
  - Numero particelle proporzionale a intensity (20–300)
  - Velocità proporzionale a rhythmicity
  - Luminosità grigi mappata da brightness
  - Dispersione orizzontale da stereo width
  - Moto direzionale da trajectory (+1 su, -1 giù, 0 browniano)
- Onset flash: rettangoli concentrici in colore A (#FF4400)
- MIDI flash: linea verticale + quadrato in colore B (#00AACC)
- Dither overlay Bayer 8x8 (intensità inversamente proporzionale a brightness)
- Climax: flood colore C (#E6007E) dopo 3s di intensity > 0.85
- Framing: WIDE, MEDIUM (1.5x), MACRO (3x), PAN (drift laterale)
- Readout in tempo reale: scene, timer, probabilità, framing, stato colori
- Slider configurabili del Regista: base interval, rhythmic divisor, random factor
- Modo AUTO: guida automatica degli slider attraverso fasi (silence → ambient → building → peak → climax → decay)

### Stack
- HTML + JavaScript vanilla (file unico, nessuna dipendenza)
- Canvas 2D API

---

## [v0.2.0] – 2026-03-21

**Audio engine stereo con spectral flux, band-split, ES modules.**

### Aggiunto
- Input stereo da BlackHole via `ChannelSplitterNode` + 2x `AnalyserNode`
- RMS per canale (L/R) e combinato
- Band-split energy su 5 bande (sub/low/mid/high/air) per canale
- Spectral centroid normalizzato (brillantezza)
- Spectral flux con onset detection a soglia adattiva (sostituisce soglia statica v0.1.0)
- Correlazione stereo e differenza energia L/R
- Energy trajectory su finestra scorrevole (~3 sec): salendo/stabile/calando
- Stima BPM da intervalli mediani degli onset
- Stato narrativo: 5 valori derivati (intensity, rhythmicity, brightness, trajectory, stereoWidth)
- MIDI engine migliorato: note density, pitch range, CC tracking, canale MIDI
- HUD debug verbose con tutti i nuovi dati (barre visive per RMS, bande, centroid, stereo)

### Modificato
- Struttura a ES modules (`src/` con config, audio, midi, state, render, main)
- `index.html` ridotto a solo HTML + CSS + `<script type="module">`
- Onset flash ora guidato da spectral flux invece che da soglia energia statica
- Spettrogramma usa FFT del canale L

### Stack
- ES modules nativi (nessun build step)
- Canvas 2D API
- Web Audio API (stereo)
- WebMIDI API

---

## [pre-prod] – 2026-03-21

**Fase di design e pre-produzione.**

### Definito
- Concept visivo: "CAMPO" — organismo di dati con memoria
- Sistema cromatico: grigi digitali + A `#FF4400` / B `#00AACC` / C `#E6007E`
- Vocabolario texture: dither Bayer, linee topografiche, character grid, scanline, block color, glitch
- Architettura a due livelli: IL MONDO (ecosistema particelle) + IL DIRETTORE (sistema camera)
- Stack confermato: Three.js (WebGL) da v0.2.0 in poi
- Riferimenti visivi analizzati (Ikeda, Anadol, C. Sun Kim, Brian Foo, Vermeulen)
- Pinterest board: https://it.pinterest.com/tweeedo/machne/

### Aggiunto
- `DESIGN.md` — documento di riferimento estetico e architetturale
- `docs/moodboard.html` — moodboard interattivo v0.2 con sistema 3 colori
- `docs/refs/` — immagini di riferimento visivo

---

## [v0.1.0] – 2026-03-21

**Prima versione funzionante.**

### Aggiunto
- Analisi audio real-time via Web Audio API (FFT 2048, smoothing 0.82)
- Visualizzazione "Spectral Strata": 80 linee orizzontali sovrapposte (stile Joy Division)
  - ogni linea = frame storico dello spettro FFT
  - X = frequenza, Y = ampiezza del bin
  - le linee più recenti sono in basso e più luminose
- Onset detection (energia low-mid, soglia adattiva)
  - trigger: flash di rettangoli concentrici al centro
- Input MIDI via WebMIDI API
  - Note On → linea verticale + quadrato, posizione mappata sulla nota
  - stato connessione nel HUD
- HUD minimale: ampiezza %, picco Hz, stato MIDI, ultimo note/onset
- Schermata di avvio con click-to-begin
- `start.sh`: launcher locale (Python HTTP server su porta 8181)

### Stack
- HTML + JavaScript vanilla (nessuna libreria, nessun build step)
- Canvas 2D API
- Web Audio API
- WebMIDI API

---

<!-- Template per versioni future:

## [vX.Y.Z] – YYYY-MM-DD

### Aggiunto
- ...

### Modificato
- ...

### Rimosso
- ...

### Fix
- ...

-->
