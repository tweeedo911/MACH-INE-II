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

## v1.0.0 — DONE (corrente)

**Piano narrativo + estetica Mondrian.**

- **8 scene estetiche:** BAYER_CLASSIC, COLORED_GROUND, SPARSE, DENSE, MONOCHROME, NEGATIVE, MONDRIAN, HORIZON
- **8 composizioni rettangolari:** UNIFORM, MONDRIAN_A, MONDRIAN_B, COLUMNS, HORIZON, FRAME, ISLANDS, ASYMMETRIC — blocchi netti con linee divisorie, zero geometrie rotonde
- **Arco narrativo:** INTRO → DEVELOP → TENSION → CLIMAX → RELEASE con tempi accelerati
- **7 palette dinamiche:** default, amber, cyan, bw, magenta, warm, cold — transizioni lerp
- **Geometrie MIDI rettangolari:** pulse=rettangolo espandente, blob=blocco pieno, band=striscia, trail=rettangolo verticale, scatter=granuli rettangolari
- **Onset wave orizzontali** (strisce, non anelli)
- **Densita' MIDI additiva** (d += midiD, non Math.max)
- **Dot size da scena** (stabile, no pulsazione globale audio)
- **Narrazione veloce:** mutazioni ogni 1-8 bars, peso SCENE 45%
- **Launcher .command** con doppio-click

---

## v1.1.0 — PROSSIMO

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
