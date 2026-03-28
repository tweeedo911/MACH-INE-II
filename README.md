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

## Sistema Compositivo V3

`CFG.V3_MODE = true` attiva il sistema generativo di nuova generazione: un MacroComposer coordina 4 layer indipendenti per un concerto continuo di 45 minuti con arco narrativo precomposto.

### Arco narrativo — 5 modi musicali in sequenza

| Arco | Modo | Carattere |
|------|------|-----------|
| 0–20% | A Lydian | Emersione luminosa |
| 20–40% | Bb Phrygian | Tensione frigia |
| 40–60% | D Dorian | Groove organico |
| 60–80% | C# Dorian | Densita industriale |
| 80–100% | E Phrygian | Dissoluzione |

### 4 Layer V3

| Layer | Canali | Funzione |
|-------|--------|----------|
| MacroComposer | — | Stato 4D (density/color/activity/texture), nessun MIDI |
| HarmonyLayer | CH2 drone, CH3 basso, CH4 accordi | Armonia modale con voice leading |
| RhythmLayer | CH0 kick, CH1 hi-hat, CH7 perc | Ritmo 5 fasi + phasing Reich + Glass additive |
| MelodyTextureLayer | CH5 voice, CH6 lead | Melodia Markov + phrase repetition + cross-arpeggio |

Break ciclici automatici ogni 10-20 bar: kick e basso escono per 2-4 bar, poi rientrano con punch. Hat, drone, accordi e melodia continuano.

---

## 7 Motori Compositivi (V2 legacy)

Disponibili in `V3_MODE = false`. Ogni motore e un organismo musicale autonomo con 5 fasi narrative:
GERMOGLIO → PULSAZIONE → DENSITA → ROTTURA → DISSOLUZIONE

| Tasto | Motore | Tonalita | BPM | Carattere |
|-------|--------|----------|-----|-----------|
| Q | TERRENO | D Dorian | 72 | Dub lento, groove organico |
| W | MECCANICA | C# Dorian | 98 | Layer poliritmici, techno strutturato |
| E | DERIVA | A Lydian | — | Ambient beatless, brightness-driven |
| A | VORTICE | F Phrygian | 138 | Step sequencer tribale, micro-loop |
| S | CRISTALLO | Eb Lydian | 54 | Shimmer arpeggios, pad glaciali |
| D | ABISSO | Bb Phrygian | 76 | Drone rituale, risalita in rottura |
| F | SOLCO | G Dorian | 128 | Berlin techno, kick-first, groove industriale |

---

## Comandi Tastiera

| Tasto | Azione |
|-------|--------|
| 1–5 | Arc jump V3: 0% / 22% / 50% / 75% / 90% |
| 0 | Sequencer autopilot on/off |
| Shift+0 | Stop sequencer con reset |
| → | Skip alla cue successiva |
| ← | Cue precedente |
| Shift+→ | Salta al prossimo atto |
| Space | Pausa / riprendi |
| L | Toggle loop |
| Shift+R | Recupera stato da sessione precedente |
| P | Apri finestra proiettore |
| H | Toggle HUD minimal |
| D | Toggle HUD debug |
| F | Fullscreen |
| R | Rigenera DNA (nuovo mondo visivo) |
| è | Gain audio input - |
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
│   ├── macro-composer.js    V3: stato 4D, arco narrativo, modi musicali
│   ├── harmony-layer.js     V3: drone CH2, basso CH3, accordi CH4
│   ├── rhythm-layer.js      V3: kick CH0, hi-hat CH1, perc CH7, break ciclici
│   ├── melody-texture-layer.js  V3: melodia CH5 + lead CH6
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

`v2.9.1` — vedi [CHANGELOG.md](CHANGELOG.md) per i dettagli.

---

## Crediti

Progetto di Edoardo Vogrig.
Sviluppato con Claude (Anthropic) in Cowork mode.
