# CHANGELOG

Tutte le modifiche significative al progetto sono documentate qui.
Formato: `[versione] – data – descrizione`

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
