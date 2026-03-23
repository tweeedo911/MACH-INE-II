# MACH:INE II — Roadmap

Ogni milestone produce qualcosa di testabile, visivamente completo e utilizzabile da solo.

---

## v0.1.0 — DONE
Spettrogramma scrolling (Joy Division), onset detection basica, MIDI note flash.

## v0.2.0 — DONE
Audio engine stereo. Band-split, spectral flux, centroid, correlazione, trajectory, BPM. ES modules.

## v0.3.0–v0.7.0 — DONE
- v0.3.0: sandbox narrativo, regista, simulazione input
- v0.4.0: campo halftone Bayer 8x8, dot-size dinamico, densita' da audio
- v0.5.0: DNA sessione, 8 primitivi, zone Voronoi (6 archetipi), generazioni con ciclo vita
- v0.6.0: colore A/B/C, mutazioni pesate, inversione dissolve
- v0.7.0: camera WIDE/MEDIUM/MACRO/DRIFT, macro con ritorno

## v0.8.0 — DONE
Architettura 12 moduli ES completa. Zone Kandinsky con reattivita' per zona.

## v0.9.0 — DONE
Sinestesia geometrica MIDI. 5 canali separati (KICK/BASS/HARMONY/LEAD/TEXTURE), colori per ruolo, MIDI patterns indipendenti, fix routing IAC Driver.

## v1.0.0 — DONE

**Piano narrativo + estetica Mondrian.**

- **8 scene estetiche:** BAYER_CLASSIC, COLORED_GROUND, SPARSE, DENSE, MONOCHROME, NEGATIVE, MONDRIAN, HORIZON
- **8 composizioni rettangolari:** UNIFORM, MONDRIAN_A, MONDRIAN_B, COLUMNS, HORIZON, FRAME, ISLANDS, ASYMMETRIC
- **Arco narrativo:** INTRO → DEVELOP → TENSION → CLIMAX → RELEASE
- **7 palette dinamiche:** default, amber, cyan, bw, magenta, warm, cold
- **Geometrie MIDI rettangolari:** pulse, blob, band, trail, scatter
- **Onset wave orizzontali**, dot size da scena, densita' MIDI additiva

---

## v1.1.0 — DONE

**Audio-driven density + non-linear compression.**

- **Void threshold 0.12:** spazio negativo vero, nessun punto sotto soglia
- **Densita' max 0.65** con compressione non-lineare (pow 1.6) per contrasto forte
- **MIDI max-not-sum:** prende la nota piu' forte, non la somma
- **Contributi banda ridotti** (sub/mid/high piu' sottili, meno rumore)
- **densityFloor 0.01** per permettere veri vuoti nel campo

---

## v1.2.0 — DONE (corrente)

**Colori puri + forme MIDI per tipo di suono + arco audio-driven.**

- **Colori verso bg non fg:** `getCellColor` e `getMidiColor` interpolano verso `palette.bg` per colori saturi e puri
- **Arco narrativo audio-driven:** 6 stati (SILENCE/BUILDING/ACTIVE/INTENSE/PEAK/DECAY) guidati da RMS smoothed con isteresi, nessun timer
- **MIDI per carattere sonoro:**
  - KICK: flash istantaneo (no espansione temporale), velocity-driven
  - BASS: colonna verticale persistente (shape 'column'), decay lentissimo
  - HARMONY: banda orizzontale, scala con densita' accordale
  - LEAD: trail melodico pitch→Y, traccia leggibile nel tempo
  - TEXTURE: granuli scatter, dimensione da energia high/air
- **Region fillColor:** composizioni Mondrian con accent1/2/3 per campi colorati rettangolari
- **Priorita' colore:** MIDI forte (>0.15) > region fill (mul>=1.5) > entity color > fg
- **Camera narrativa:** WIDE_ONLY→DRIFT_BIAS→TIGHTEN→MACRO_LOCK→SLOW_WIDE per fase arc
- **Palette accent per regione:** ogni blocco composizione porta il proprio colore accent

---

## v1.3.0 — PROSSIMO

- Pannello controllo MIDI-mappabile (macro CC)
- Dual-screen: controllo con preview + fullscreen proiezione (window.open)
- Rimuovere console.log diagnostici da midi.js
- Spatial index per midiColorAt (performance)
- Nuovi primitivi e glitch strutturali

## v2.0.0 — FUTURO

- Stabilita' per live performance lunghe (>2h)
- Preset salvabili/caricabili
- OSC support

---

*Ultima modifica: 2026-03-23*
