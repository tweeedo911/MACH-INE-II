# CHANGELOG

Tutte le modifiche significative al progetto sono documentate qui.
Formato: `[versione] – data – descrizione`

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
