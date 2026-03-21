# MACH:INE II — Roadmap

Ogni milestone produce qualcosa di testabile, visivamente completo e utilizzabile da solo.
Non si passa alla milestone successiva finche' la corrente non e' solida.

---

## v0.1.0 — DONE

Spettrogramma scrolling (Joy Division), onset detection basica, MIDI note flash.
Canvas 2D, mono, soglia statica.

---

## v0.2.0 — AUDIO ENGINE

Riscrittura del motore audio. Nessun cambiamento visivo significativo:
il rendering resta simile a v0.1.0 ma i dati sottostanti sono molto piu' ricchi.

- Input stereo da BlackHole via ChannelSplitterNode + 2x AnalyserNode
- RMS per canale
- Band-split energy su 5 bande (sub/low/mid/high/air) per canale
- Spectral centroid (brillantezza)
- Spectral flux (sostituisce onset detection a soglia statica)
- Correlazione stereo
- Energy trajectory su finestra scorrevole (~3 sec)
- Stima BPM da intervalli onset
- Struttura a ES modules (src/ con file separati per audio, midi, render)
- HUD aggiornato con i nuovi dati (debug visivo)

**Test:** aprire con BlackHole da Ableton, verificare che i dati stereo
arrivino correttamente e che l'onset detection con spectral flux sia
piu' precisa della soglia statica. Testare con materiale ambient e ritmico.

---

## v0.3.0 — SANDBOX NARRATIVO

Strumento di lavoro interattivo per progettare il comportamento del sistema.

- Pagina separata (sandbox.html) con canvas + pannello di controllo
- Slider per simulare: intensita', ritmicita', brillantezza, ampiezza stereo, traiettoria
- Click per simulare onset e note MIDI
- Il motore narrativo implementato: Stato, Regista, Climax
- Visualizzazione dello stato interno (valori, soglie, timer del regista)
- Una sola scena di test (es. campo di punti + dither) che risponde ai dati simulati
- Tuning dei parametri del regista (soglie, probabilita', durate)

**Test:** giocare con gli slider e verificare che il comportamento
del regista sia coerente — ambient = cambi rari e lenti, ritmico = cambi
frequenti a tempo. Verificare che il climax si attivi solo su plateau sostenuto.

---

## v0.4.0 — VOCABOLARIO SCENE

Implementazione delle scene reali che il regista puo' scegliere.

- Almeno 4 scene distinte (es. campo punti, superficie topo, character grid, scanline)
- Ogni scena reagisce ai 5 valori dello Stato in modo diverso
- Transizioni tra scene (dither come interpolazione)
- Sistema cromatico attivo: A/RITMO su onset, B/ARMONIA su MIDI, regola dei 2 colori
- Il dither Bayer come overlay sempre presente

**Test:** nel sandbox, ciclare tra scene e verificare che ogni scena
sia visivamente interessante da sola e che le transizioni funzionino.

---

## v0.5.0 — IL DIRETTORE

Sistema camera 2D (framing).

- Viewport virtuale che mostra una porzione del campo
- Shot: wide, medium, macro (microscopio), pan
- Il regista sceglie lo shot in base allo stato narrativo
- Musica ritmica: tagli precisi a tempo
- Musica eterea: deriva lenta e continua
- Elemento random nella scelta

**Test:** con il sandbox, simulare transizioni ambient → ritmico
e verificare che il framing cambi di conseguenza. Verificare che
lo zoom macro mostri dettaglio interessante.

---

## v0.6.0 — COLLEGAMENTO AUDIO REALE

Si collega tutto: il motore audio reale (v0.2.0) alimenta
il motore narrativo (v0.3.0) che guida le scene (v0.4.0)
inquadrate dal direttore (v0.5.0).

- index.html diventa il sistema completo
- MIDI CC mappabili a parametri (opzionale, se utile)
- Test con sessioni Ableton reali (ambient, ritmico, misto)
- Tuning finale dei parametri con musica vera

**Test:** sessione live completa con Ableton. Verificare reattivita',
coerenza narrativa, assenza di stasi visiva, climax al momento giusto.

---

## v0.7.0+ — RAFFINAMENTO

- Glitch/artefatto come evento raro
- Stratificazione e memoria visiva (tracce persistenti)
- Nuove scene e texture
- Selettore palette (dopo v1.0)

---

*Ultima modifica: 2026-03-21*
