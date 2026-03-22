# CHANGELOG

Tutte le modifiche significative al progetto sono documentate qui.
Formato: `[versione] – data – descrizione`

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
