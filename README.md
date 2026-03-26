# MACH:INE II

Sistema di co-composizione ricorsiva per performance audiovisive dal vivo e installazione.

Non e un visualizer: la musica e l'ambiente in cui il sistema visivo vive. La macchina propone, il performer interpreta, il sistema ascolta e reinterpreta visualmente.

---

## Come avviarlo

### Launcher (consigliato)

```bash
cd "MACH:INE II"
./launch.sh
```

Il browser si apre su `http://localhost:8282`. Clicca lo schermo per iniziare.

### Manuale

```bash
cd "MACH:INE II"
python3 -m http.server 8282
```

Poi apri `http://localhost:8282` nel browser.

> **Nota:** il progetto usa ES modules — serve un server HTTP locale.
> Aprire `index.html` con doppio clic non funziona.

---

## 7 Motori Compositivi

Ogni motore e un organismo musicale autonomo con 5 fasi narrative:
GERMOGLIO → PULSAZIONE → DENSITA → ROTTURA → DISSOLUZIONE

| Tasto | Motore | Tonalita | BPM | Carattere |
|-------|--------|----------|-----|-----------|
| 1 | DERIVA | A Lydian | — | Ambient beatless, brightness-driven |
| 2 | CRISTALLO | Eb Lydian | 54 | Shimmer arpeggios, pad glaciali |
| 3 | ABISSO | Bb Phrygian | 76 | Drone rituale, risalita in rottura |
| 4 | TERRENO | D Dorian | 72 | Dub lento, groove organico |
| 5 | MECCANICA | C# Dorian | 98 | Layer poliritmici, techno strutturato |
| 6 | VORTICE | F Phrygian | 138 | Step sequencer tribale, micro-loop |
| 7 | SOLCO | G Dorian | 128 | Berlin techno, kick-first, groove industriale |

### Concerto Autonomo (Sequencer v3)

Premi `0` per avviare una performance autonoma di 40 minuti strutturata in 5 atti drammaturgici:

| Atto | Tempo | Motori | Carattere |
|------|-------|--------|-----------|
| I EMERGENZA | 0:00–8:00 | DERIVA → CRISTALLO | Emersione dal silenzio |
| II DISCESA | 8:00–18:00 | CRISTALLO → ABISSO → TERRENO | Discesa nelle profondita |
| III MACCHINA | 18:00–28:00 | TERRENO → MECCANICA + SOLCO (da min 22) | Meccanismo industriale |
| IV VORTICE | 28:00–36:00 | MECCANICA → VORTICE + climax globale | Vortice e convergenza |
| V RITORNO | 36:00–40:00 | Dissoluzione | Ritorno al silenzio |

Momenti-firma: SOLCO sotto (min 22), GELO (min 24), CONVERGENZA (min 33), INVERSIONE (min 34), VUOTO TOTALE (min 36).
Sovrapposizione multi-motore con crossfade a presenza variabile. `→` salta alla cue successiva.

---

## Comandi Tastiera

| Tasto | Azione |
|-------|--------|
| 1–7 | Attiva motore (mutua esclusione) |
| 0 | Sequencer autopilot on/off |
| → | Skip al prossimo motore (in sequencer) |
| H | Toggle HUD minimal |
| D | Toggle HUD debug |
| F | Fullscreen |
| R | Rigenera DNA (nuovo mondo visivo) |
| N | Forza mutazione manuale |
| e | Gain audio input - |
| + | Gain audio input + |

---

## 8 Canali MIDI

Mapping canonico per Ableton (CH 1-8):

| CH | Ruolo | Descrizione |
|----|-------|-------------|
| 1 | PULSE | Kick euclidiano / heartbeat |
| 2 | GRAIN | Texture micro-tonale, sparkle |
| 3 | DRONE | Pad/cluster sempre presente |
| 4 | BASS | Basso melodico con voice leading |
| 5 | CHORDS | Progressioni modali, pads |
| 6 | VOICE | Melodia Markov 2° ordine |
| 7 | LEAD | Motivo/eco, call-and-response |
| 8 | RIDE + RUPTURE | Piatto progressivo per fase + cluster rottura (4 stadi obbligatori) |

### MIDI Clock

Il sistema invia MIDI Clock a 24 ppqn su qualsiasi uscita MIDI collegata. Start/Stop automatico all'attivazione/disattivazione di un motore.

---

## Architettura Visiva

- Campo halftone Bayer 8x8 con zone Voronoi
- 8 primitivi strutturali: BANDA, BLOCCO, VETTORE, VUOTO, FRONTE, SCIAME, STRISCIA, MATRICE
- DNA di sessione: combinazione unica di primitivi a ogni avvio
- Generazioni con ciclo vita (nascita → crescita → morte → fossile)
- Sistema cromatico progressivo: colori sbloccati per atto (I mono → II +A → III +B → IV +C in climax)
- Palette engine-specific: ice (CRISTALLO), abyssal (ABISSO), steel (MECCANICA), ikeda (VORTICE)
- Climax cromatico reale: saturazione bg verso magenta scuro + boost alpha entita
- 5 mutazioni: PRIMITIVE, INVERT, RESET_PARTIAL, CHROMATIC, SCALE
- Camera 2D: 5 shot (WIDE/MEDIUM/MACRO/PAN/DRIFT) con POI tracking e breathing ritmico
- Arco narrativo con tensione: SILENCE → BUILDING → ACTIVE → INTENSE → PEAK → DECAY + modulazione soglie
- Identita visiva per motore: palette, forme, decay e comportamento distinti
- Apertura concerto: emersione quadratica da zero in 120s con densityCap globale
- Momenti-firma: gelo (freeze entita), convergenza (attrazione centro), vuoto totale (blackout)

---

## Struttura del Progetto

```
MACH:INE II/
├── index.html              shell HTML + CSS
├── launch.sh               launcher (porta 8282)
├── src/
│   ├── main.js             boot, wiring, game loop
│   ├── config.js            parametri centralizzati (CFG)
│   ├── audio.js             audio engine stereo (Web Audio API)
│   ├── midi.js              MIDI I/O + Clock 24ppqn (WebMIDI)
│   ├── midi-clock.worker.js Web Worker clock (no throttling)
│   ├── midi-patterns.js     visual mapping per canale e motore
│   ├── state.js             stato narrativo (5 valori derivati)
│   ├── dna.js               DNA sessione, 8 primitivi, zone Voronoi
│   ├── generations.js       entita, ciclo vita, spatial hash grid
│   ├── colors.js            sistema cromatico A/B/C, climax
│   ├── director.js          regista: scene, arco, mutazioni, camera
│   ├── director-events.js   event bus del regista
│   ├── field.js             campo halftone, onset waves, MIDI columns
│   ├── render.js            orchestratore render + HUD
│   ├── presence-multiplier.js  sistema presenza multi-motore (0→1 per engine)
│   ├── sequencer.js         concerto 5 atti, momenti-firma, crossfade
│   ├── composer.js          TERRENO (D Dorian 72bpm)
│   ├── composer2.js         MECCANICA (C# Dorian 98bpm)
│   ├── composer3.js         DERIVA (A Lydian, beatless)
│   ├── composer4.js         VORTICE (F Phrygian 138bpm)
│   ├── composer5.js         CRISTALLO (Eb Lydian 54bpm)
│   ├── composer6.js         ABISSO (Bb Phrygian 76bpm)
│   └── composer7.js         SOLCO (G Dorian 128bpm)
├── midi/                    file MIDI di test
├── versions/                snapshot di ogni versione
├── docs/                    task storici e riferimenti visivi
├── CHANGELOG.md
├── ROADMAP.md
├── DESIGN.md
├── ENGINES_SPEC.md
└── RULES.md
```

---

## Requisiti

- Browser Chrome o Edge (WebMIDI richiesto)
- Python 3 (per il server HTTP locale)
- Microfono o interfaccia audio (BlackHole consigliato per routing)
- Opzionale: controller MIDI, DAW con uscita MIDI

---

## Stack

- ES modules nativi (zero dipendenze, zero build step)
- Canvas 2D API
- Web Audio API (stereo via BlackHole)
- WebMIDI API + Web Worker clock

---

## Versione corrente

`v2.8.0` — vedi [CHANGELOG.md](CHANGELOG.md) per i dettagli.

---

## Crediti

Progetto di Edoardo Vogrig.
Sviluppato con Claude (Anthropic) in Cowork mode.
