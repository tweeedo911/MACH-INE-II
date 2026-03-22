# MACH:INE II — Roadmap

Ogni milestone produce qualcosa di testabile, visivamente completo e utilizzabile da solo.
Non si passa alla milestone successiva finche' la corrente non e' solida.

---

## v0.1.0 — DONE

Spettrogramma scrolling (Joy Division), onset detection basica, MIDI note flash.

## v0.2.0 — DONE

Audio engine stereo. Band-split, spectral flux, centroid, correlazione, trajectory, BPM.
ES modules.

## v0.3.0 — DONE

Sandbox narrativo con regista, scena di test, framing, simulazione input.

---

## v0.4.0 — CAMPO HALFTONE

Il fondamento visivo: il campo di densita' con trattamento dither Bayer.
Tutto il resto si costruisce sopra questo.

- Campo di densita' renderizzato con matrice Bayer 8x8
- Dot-size dinamico (1px-16px) guidato dalla brillantezza audio simulata
- Densita' modulata dall'intensita'
- Almeno un primitivo strutturale funzionante (es. BANDA o BLOCCO)
- Il primitivo risponde ai 5 valori dello Stato
- Generazioni base: nascita (su intensita') e morte (su decay)
- Zone con dot-size diverso che coesistono sullo schermo
- Inversione nero/bianco come possibilita'

**Test nel sandbox:** il campo con un solo primitivo e dither dinamico
deve essere gia' visivamente interessante da solo con slider a meta'.
Se non lo e', non si va avanti.

---

## v0.5.0 — DNA E GENERAZIONI

Il sistema di variabilita' per sessione e il ciclo vita completo.

- DNA di sessione: all'avvio, sceglie 2-3 primitivi e genera parametri unici
- Tutti i primitivi implementati (banda, vettore, blocco, vuoto, fronte, sciame, striscia, matrice)
- Generazioni complete: nascita, crescita, maturita', invecchiamento, morte
- Accumulo e stratificazione (generazioni vecchie sotto, giovani sopra)
- Frequenze audio determinano posizione di nascita (mapping dal DNA)
- Il dot-size degenera con l'eta'
- Residui fossili delle generazioni morte

**Test nel sandbox:** lanciare piu' volte e verificare che ogni sessione
produca un mondo visivamente diverso. Testare con AMBIENT e PEAK.

---

## v0.6.0 — COLORE E MUTAZIONI

Il sistema cromatico e la logica del regista adattata al campo unico.

- Colore A: elementi nati da onset sono rosso-arancio, decadono a grigio
- Colore B: elementi nati da MIDI sono teal, decadono a grigio
- Colore C: flood climax, tutti gli elementi virano a magenta
- Interazione: A su B, B su A, sovrapposizioni, virata graduale verso C
- Il Regista gestisce mutazioni (non scene): cambio primitivo dominante,
  inversione, reset parziale, shift cromatico
- Transizioni tra stati tramite dither dissolve

**Test nel sandbox:** onset ripetuti = zona A visibile. Note MIDI = zona B.
I due colori coesistono. Intensity alta 3+ sec = virata C.

---

## v0.7.0 — IL DIRETTORE

Camera 2D sul campo unico.

- 4 shot: wide, medium, macro, pan
- Lerp adattivo (veloce su ritmico, lento su ambient)
- Macro con durata limitata e ritorno automatico
- Lo zoom macro mostra la grana del dither e le generazioni
- Logica decisionale integrata col regista

**Test nel sandbox:** simulare ambient → ritmico e verificare
che la camera cambi coerentemente. Macro su campo halftone = effetto microscopio.

---

## v0.8.0 — COLLEGAMENTO AUDIO REALE

Unire tutto: audio stereo reale + DNA + generazioni + colore + camera.

- src/ ristrutturato con moduli per campo, DNA, generazioni, colore, camera
- index.html diventa il sistema completo
- MIDI CC mapping opzionale
- HUD minimale (tasto H) e debug (tasto D)
- Test con sessioni Ableton reali

---

## v0.9.0+ — RAFFINAMENTO

- Tuning con musica reale
- Nuovi primitivi
- Comportamenti anomali (glitch strutturali, errori deliberati)
- Ottimizzazione performance

---

*Ultima modifica: 2026-03-21*
