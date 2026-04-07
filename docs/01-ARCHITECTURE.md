# 01 — ARCHITECTURE

## Pattern: "Band con Direttore"

A partire da v3.0, MACH:INE III ha abbandonato l'architettura "7 motori paralleli con
presence multiplier" (v2.x) per un modello più semplice e leggibile:

- Un unico **director3** (`src/director3.js`) sceglie traccia, fase e densità.
- 5 **moduli compositivi** girano in parallelo, ognuno responsabile di un canale MIDI:
  - `rhythm.js`     → CH0 PULSE + CH1 GRAIN
  - `harmony.js`    → CH2 DRONE  + CH4 CHORDS
  - `bass.js`       → CH3 BASS   (varianti `bass-v2.js`, `bass-v3.js`)
  - `melody.js`     → CH5 VOICE / CH6 LEAD (varianti `melody-v2.js`, `melody-v3.js`)
  - `texture.js`    → strato testurale
- 7 **comp-* visive** (`comp-griglia/liminale/linee/negativo/quadrati/treno`) realizzano
  l'identità grafica di ogni traccia.
- `world-state.js` espone `worldState` mutabile (track, phase, root, scale, density,
  velocityCeiling, register, palette, currentChord) — singolo state condiviso.
- `firma.js` gestisce gesti narrativi forti (gelo, convergenza, vuotoTotale, densityCap).

L'architettura "V3 Layer System" pianificata in `.planning-archive/` (phases 00-04)
**non è stata costruita**. Il codice attuale è la "Band con Direttore". I documenti GSD
sono mantenuti come riferimento storico.

## Thread / loop

- **rAF loop** (`src/main.js` → `loop()`) → render + state derivation + director3
- **Web Worker** (`src/midi-clock.worker.js`) → tick MIDI clock 24ppqn senza throttling
- **BroadcastChannel** (`machine-projector`) → main window → projector window sync

## File map (aggiornato post-FASE 2)

```
app/
├── index.html              # entry point browser
├── projector.html          # finestra proiezione secondaria
├── src/
│   ├── main.js             # boot, wiring, game loop
│   ├── config.js           # CFG: tutti i parametri numerici
│   ├── VERSION.js          # APP_VERSION single source of truth
│   ├── audio.js            # analisi audio stereo realtime
│   ├── midi.js             # WebMIDI I/O
│   ├── midi-clock.worker.js
│   ├── state.js            # stato narrativo derivato (5 valori)
│   ├── world-state.js      # worldState mutabile condiviso
│   ├── dna.js              # DNA sessione, primitivi, zone Voronoi
│   ├── generations.js      # entità, ciclo vita, spatial hash
│   ├── colors.js           # sistema cromatico A/B/C
│   ├── field.js            # campo halftone Bayer, onset waves, MIDI columns
│   ├── render.js           # orchestratore render + HUD
│   ├── firma.js            # gesti narrativi (gelo/convergenza/vuoto/densityCap)
│   ├── director3.js        # regista (track/phase/density)
│   ├── tracks.js           # 7 tracce con scale, root, BPM, modeHint, chord progressions
│   ├── rhythm.js           # CH0/CH1
│   ├── harmony.js          # CH2/CH4
│   ├── bass.js + bass-v2 + bass-v3
│   ├── melody.js + melody-v2 + melody-v3
│   ├── texture.js
│   ├── comp-griglia/liminale/linee/negativo/quadrati/treno.js
│   ├── visual-toolkit.js
│   └── session-recorder.js
├── docs/                   # documentazione viva (00–06)
├── archive/                # tutto ciò che non gira più ma serve come memoria
│   ├── code/
│   │   ├── dead-islands/   # 14 moduli morti (sequencer, director, midi-patterns, ...)
│   │   ├── versions/       # snapshot HTML/JS storici
│   │   ├── legacy-composer/
│   │   └── legacy-new/
│   ├── docs/old/           # 25+ md storici (VISION-V4, ROADMAP-*, DESIGN-V5, ecc.)
│   ├── analysis/           # session JSON dump
│   ├── midi-exports/       # .mid storici
│   ├── feedback/           # ricapitolazioni sessioni
│   └── sandbox/            # designer/test/sandbox HTML
├── .planning-archive/      # fossile GSD (phases 00-04, V3 Layer System mai costruito)
└── scripts/                # snapshot.sh, health-check.sh
```

## Aree protette (richiede approvazione)

- `main.js` / `render.js` / `director3.js` (relazioni)
- Audio: history buffer, onset detection
- Narrativa: arco visivo, rupture (4 stadi), climax
- Camera: logica legata all'arco

## Rupture — sempre 4 stadi

`omen → infiltrazione → takeover → residuo`. Mai semplificare. Mai saltare.
