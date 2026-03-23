# MACH:INE II — Roadmap

Ogni milestone produce qualcosa di testabile, visivamente completo e utilizzabile da solo.
Non si passa alla milestone successiva finche' la corrente non e' solida.

---

## v0.1.0 — DONE

Spettrogramma scrolling (Joy Division), onset detection basica, MIDI note flash.

## v0.2.0 — DONE (committato)

Audio engine stereo. Band-split, spectral flux, centroid, correlazione, trajectory, BPM.
ES modules.

## v0.3.0–v0.7.0 — DONE (non committato, in working tree)

- v0.3.0: sandbox narrativo, regista, simulazione input
- v0.4.0: campo halftone Bayer 8x8, dot-size dinamico, densita' da audio
- v0.5.0: DNA sessione, 8 primitivi, zone Voronoi (6 archetipi), generazioni con ciclo vita
- v0.6.0: colore A/B/C, mutazioni pesate, inversione dissolve
- v0.7.0: camera WIDE/MEDIUM/MACRO/DRIFT, macro con ritorno

## v0.8.0 — IN CORSO (non committato)

Audio reale + MIDI multi-canale + sinestesia geometrica.

**Fatto:**
- 12 moduli ES in src/ (config, audio, midi, state, dna, colors, generations, field, director, midi-patterns, render, main)
- Audio stereo reale via BlackHole, MIDI via IAC Driver + Max for Live MIDI Router
- 5 canali MIDI con ruoli: KICK, BASS, HARMONY, LEAD, TEXTURE
- Per-channel MIDI patterns (5 pool di behavior, cambio indipendente 12-32 bars)
- Sinestesia geometrica: ogni shape ha geometria propria (pulse=anello, blob=gaussiana, band=striscia, trail=linea melodica, scatter=granuli)
- 5 colori per ruolo MIDI (ambra, rosso, ciano, viola, acciaio) con area colore 2.5x la geometria
- Director BPM-synced: mutazioni su bar boundary, intensita' modula frequenza
- Zone Voronoi con reattivita' indipendente (0.05-1.0), flicker polyrhythmic
- Frequenze audio → regioni spaziali (sub/low→bottom, mid→center, high/air→top)
- HUD minimale + debug con monitor canali MIDI
- Test suite automatica (test.html, ~90 test)

**Da fare:**
- Committare tutto (enorme diff da v0.2.0)
- Separare canali MIDI in Ableton (ora tutto su ch 2)
- Testare le 5 geometrie + 5 colori con canali separati
- Tuning raggi, decay, intensita' colore dopo test reale

---

## v0.9.0 — RAFFINAMENTO

- Tuning con musica reale multi-canale
- Performance (midiColorAt spatial index se necessario)
- Nuovi primitivi, glitch strutturali
- Frequency → color (bande audio colorano zone spaziali)

## v1.0.0 — LIVE READY

- Pannello controllo MIDI-mappabile (macro CC)
- Dual-screen: controllo con preview + fullscreen proiezione separata (window.open)
- Stabilita' per live performance

---

*Ultima modifica: 2026-03-22*
