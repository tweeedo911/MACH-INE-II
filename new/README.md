# MACH:INE II

Sistema di co-composizione ricorsiva per live performance e installazioni audiovisive.
Progetto di Tweeedo (Edoardo Vogrig).

---

## Concept

MACH:INE II è un sistema di co-composizione ricorsiva uomo-macchina.

La macchina genera materia musicale sotto forma di MIDI: pattern, note, tensioni,
strutture. Il musicista interpreta quel materiale con strumenti hardware o digitali,
lo piega, lo espande o lo contraddice durante la performance.
Il sistema ascolta ciò che accade attraverso audio e MIDI, lo riassimila e
lo traduce in comportamento visivo e narrativo.

Il risultato non è un visualizer.
È un organismo circolare in cui composizione, esecuzione e immagine
si trasformano continuamente a vicenda.

La musica non controlla il visual.
La musica è l'ambiente fisico in cui il visual vive.

---

## Architettura

Il sistema è modulare e browser-based (Canvas 2D + Web Audio API + WebMIDI API).

### Moduli

| File | Ruolo |
|---|---|
| `main.js` | Boot, wiring, game loop |
| `audio.js` | Analisi audio stereo in tempo reale |
| `midi.js` | Input MIDI, routing canali |
| `midi-patterns.js` | Mapping visivo per canale MIDI |
| `state.js` | Stato astratto derivato da audio (intensity, rhythmicity, brightness, stereoWidth) |
| `config.js` | Tutti i parametri numerici centralizzati (CFG) |
| `dna.js` | DNA del mondo: primitivi, zone Voronoi, comportamenti |
| `generations.js` | Entità, fossili, nascita, morte, cristallizzazione |
| `field.js` | Campo visivo, onde onset, colonne MIDI, Bayer dither |
| `colors.js` | Palette, climax, shift cromatico, inversione |
| `director.js` | Scene, arco narrativo, mutazioni, camera |
| `render.js` | Orchestratore del frame, HUD, tastiera |

---

## Flusso dati per frame
