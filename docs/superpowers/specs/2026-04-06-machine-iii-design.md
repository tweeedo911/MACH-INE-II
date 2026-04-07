# MACH:INE III — Design Specification

> Tabula rasa sul sistema compositivo. Nuova architettura "Band con Direttore".
> Il renderer, l'audio analysis e l'infrastruttura MIDI restano da MACH:INE II.

---

## 1. Problema

MACH:INE II genera note ma non compone musica. 7 composer indipendenti che non si ascoltano tra loro producono un risultato confuso, slegato e poco interessante. Il MacroComposer pensa in 4D ma i layer lo ignorano (8 leak documentati). CH1+CH7 = 85.4% del MIDI, melodie e basso insieme = 7.5%.

Rattoppare non funziona — v4.0, v4.1, v5.0 hanno migliorato i parametri ma non risolto il problema strutturale: manca coerenza tra i canali e manca direzione nell'arco.

---

## 2. Soluzione: architettura "Band con Direttore"

### Principio

Il Direttore non scrive note — scrive regole.
I Moduli non decidono il contesto — decidono come esprimersi dentro il contesto.
Coerenza dai vincoli. Vita dalla libertà dentro i vincoli.

### Da MACH:INE II a III

| Sparisce | Diventa |
|----------|---------|
| 7 composer (composer.js — composer7.js) | 5 moduli funzionali |
| MacroComposer (macro-composer.js) | Direttore (director3.js) |
| Presence Multiplier | Budget densità nel World State |
| Sequencer con cue manuali | Arco narrativo nel Direttore |
| rhythm-layer.js, harmony-layer.js, melody-texture-layer.js | Assorbiti nei 5 moduli |

| Resta invariato |
|-----------------|
| Renderer: field.js, render.js, colors.js, generations.js, midi-patterns.js |
| Audio: audio.js, state.js |
| MIDI: midi.js, midi-clock.worker.js |
| DNA: dna.js |
| Boot/loop: main.js (modificato per il nuovo wiring) |
| Director visivo: director.js (la parte visiva — scene, camera, arco visivo) |

---

## 3. World State (world-state.js)

Un singolo oggetto condiviso. Solo il Direttore lo scrive. Tutti i moduli lo leggono.

```
worldState = {
  // Identità musicale
  track:    "SOLCO",                          // quale delle 7 tracce
  scale:    [55,57,58,60,62,64,65,67],        // G dorian (array MIDI notes)
  root:     55,                                // G3
  bpm:      128,                               // tempo della traccia
  phase:    "densita",                         // germoglio/pulsazione/densita/rottura/dissoluzione

  // Budget & vincoli
  density: {
    rhythm:  0.7,    // quanto il modulo ritmo può emettere (0–1)
    harmony: 0.4,
    bass:    0.8,
    melody:  0.5,
    texture: 0.2
  },
  register: {
    bass:   [36, 55],   // range MIDI per il basso
    melody: [67, 84],   // range per voice
    lead:   [72, 96],   // range per lead
    chords: [55, 72],   // range per accordi
    arp:    [60, 84]    // range per arpeggio
  },
  velocityCeiling: {
    rhythm:  110,
    harmony: 60,
    bass:    90,
    melody:  75,
    texture: 45
  },
  rhythmGrid: [1,0,0,0, 1,0,0,1, 1,0,0,0, 0,1,0,0],  // pattern ritmico di riferimento (16 step)

  // Arco narrativo
  arc:        0.45,      // posizione nel concerto (0.0 → 1.0)
  energy:     "ACTIVE",  // SILENCE / BUILDING / ACTIVE / INTENSE / PEAK / RELEASE
  transition: null,      // { from: "TESSUTO", to: "SOLCO", progress: 0.6 } oppure null

  // Armonia corrente (scritto dal Direttore, che lo riceve da harmony)
  currentChord: [55, 58, 62],  // note dell'accordo corrente (per l'arp)

  // Regime visivo
  palette:      { bg: "#282B26", dot: "#FE6B0D", accent: "#CDD71D" },
  visualRegime: { maxDensity: 0.65, minDotSize: 4, composition: "ASIMMETRIA" },
  camera:       { mode: "MEDIUM", drift: 0.3, focusPoint: [0.6, 0.4] }
}
```

### Regole di accesso

- Moduli: **read-only** su worldState
- Direttore: **read-write** su worldState
- Nessun modulo comunica con un altro modulo
- Nessun modulo scrive nel worldState
- Eccezione: harmony scrive `worldState.currentChord` direttamente (unico campo scrivibile da un modulo — serve perché melody/arp ne ha bisogno e il Direttore non conosce la logica armonica)

---

## 4. Canali MIDI (riorganizzati)

| Canale | Ruolo | Modulo | Note |
|--------|-------|--------|------|
| CH0 | KICK | Ritmo | 1 pitch per modo (A1, Bb1, D2, C#2, E2) |
| CH1 | PERC KIT | Ritmo | Drum Rack — hat, conga, rim, snare, ride, clap |
| CH2 | DRONE | Armonia | Root + ottava, note lunghissime |
| CH3 | BASS | Basso | Pattern riconoscibile per traccia |
| CH4 | CHORDS | Armonia | Voice leading, 3 voci, progressioni potenze di 2 |
| CH5 | VOICE | Melodia | Frasi 8-12 note, Markov + seed motif |
| CH6 | LEAD | Melodia | Contrappunto, call-response con CH5 |
| CH7 | ARP/SEQ | Melodia | Pattern ripetitivo ipnotico derivato dall'accordo corrente |

### Drum map CH1 (Perc Kit)

```
36 (C2)  = Hat closed     38 (D2)  = Snare
42 (F#2) = Hat open        45 (A2)  = Conga hi
46 (Bb2) = Hat pedal       48 (C3)  = Conga lo
49 (C#3) = Crash           51 (D#3) = Ride
39 (D#2) = Clap            56 (G#3) = Cowbell
```

---

## 5. Direttore (director3.js)

### Legge
- audio.rms, bands, centroid, flux (da audio.js)
- state.intensity, brightness, rhythmicity (da state.js)
- Tempo trascorso (clock interno)
- Definizioni tracce (da tracks.js)
- Input performer (tastiera: skip, pause, loop)

### Decide
- Quale traccia è attiva
- Quale fase interna (germoglio → pulsazione → densità → rottura → dissoluzione)
- Quando transitare tra tracce
- Budget densità per ogni modulo
- Quando imporre il silenzio

### Scrive
Tutto il worldState (vedi sezione 3).

### NON fa
Generare note. Scegliere accordi. Decidere pattern. Solo vincoli e contesto.

### Arco narrativo
Sequenza automatica delle 7 tracce:
```
NEBBIA → TESSUTO → SOLCO → RESPIRO → MACCHINA → TEMPESTA → RITORNO
```
Ogni traccia ha 5 fasi interne (germoglio → dissoluzione). La durata di ogni fase è definita in tracks.js.

### Transizioni DJ-set
- Il drone (CH2) cambia modo 4 bar PRIMA della transizione
- I vincoli nel worldState interpolano su 4-8 bar
- `transition: { from, to, progress }` permette ai moduli di fare blend
- Non cesura netta, non gradiente indistinguibile — c'è un momento dove "si cambia"

### Silenzi strutturali
- 2-3 pause reali (< 3 canali attivi, vel < 30) di 8-16 battute
- Posizionati DOPO i momenti più densi
- Il Direttore setta `density.*` a 0 e `energy` a SILENCE

---

## 6. I 5 Moduli

### 6.1 Ritmo (rhythm.js) — CH0 Kick + CH1 Perc Kit

**Dal World State legge:** rhythmGrid, density.rhythm, bpm, phase, velocityCeiling.rhythm

**Produce:**
- CH0: kick su nota modale (1 pitch per traccia)
- CH1: drum rack completo — hat, conga, rim, snare, ride
- Pattern euclidei per ogni elemento del kit
- Ghost notes probabilistiche nelle fasi dense
- Il kit si orchestra come un batterista: non tutti gli elementi suonano sempre

**Comportamento per fase:**
- germoglio: silenzio o singolo impulso raro
- pulsazione: kick + hat chiuso rarefatto
- densità: kit quasi completo, groove pieno
- rottura: tutti gli elementi, pattern complessi
- dissoluzione: elementi si spengono uno a uno

**Identità per traccia (definita in tracks.js):**
- NEBBIA: nessuna percussione
- TESSUTO: impulsi rari, texture più che ritmo
- SOLCO: groove dub syncopated
- RESPIRO: solo hat leggerissimo
- MACCHINA: groove meccanico, non 4/4 ma quasi
- TEMPESTA: techno IDM pieno, pattern intrecciati
- RITORNO: dissoluzione del pattern

### 6.2 Armonia (harmony.js) — CH2 Drone + CH4 Chords

**Dal World State legge:** scale, root, density.harmony, register.chords, phase

**Produce:**
- CH2: drone sulla root (nota lunga, evoluzione lenta, ogni 4 bar)
- CH4: accordi con voice leading (max 3 semitoni per voce tra accordi consecutivi)
- Progressioni con lunghezza potenze di 2 (4/8/16/32 bar)
- Breathing: ritorno periodico alla tonica
- Scrive `worldState.currentChord` direttamente (unica eccezione alla regola read-only, serve per l'arp)

**Transizione:** il drone cambia nota 4 bar PRIMA che il Direttore cambi traccia.

### 6.3 Basso (bass.js) — CH3 Bass

**Dal World State legge:** scale, root, density.bass, register.bass, rhythmGrid, bpm

**Produce:**
- CH3: pattern basso riconoscibile per traccia
- Motivo di 2-4 bar che si ripete (memorizzabile dal performer)
- Variazioni sottili: ghost notes, velocity sweep
- Complementare al kick (suona dove il kick tace)
- La firma della traccia — il performer ci si aggancia

**Step clock dedicato** (16th note, background-safe, no setTimeout).

### 6.4 Melodia (melody.js) — CH5 Voice + CH6 Lead + CH7 Arp

**Dal World State legge:** scale, root, density.melody, register.melody/lead/arp, velocityCeiling.melody, currentChord, phase

**Produce:**
- CH5 Voice: frasi melodiche 8-12 note, Markov + seed motif, velocity forte (floor 40)
- CH6 Lead: contrappunto angolare, call-response con CH5 (delay 200-800ms)
- CH7 Arp: pattern ripetitivo ipnotico — usa note da currentChord
- In NEBBIA: solo gocce rare su CH5, CH6+CH7 muti
- In TEMPESTA: 3 voci intrecciate

**Arp (CH7):**
- Pattern di 4-8 note derivato da currentChord
- Ripetizione con micro-variazione (velocity, timing humanization)
- Rate: 8th o 16th note, definito per traccia in tracks.js
- Il pattern cambia quando cambia l'accordo (automatico via currentChord)

### 6.5 Texture (texture.js) — Eventi rari + CC continui

**Dal World State legge:** density.texture, energy, arc

**Produce:**
- Impatti rari (< 5% del tempo)
- Sweep ai punti di transizione tra tracce
- Noise burst durante rupture
- CC74 (filter cutoff) + CC1 (modwheel) continui su canali selezionati
- La potenza viene dalla rarità

**NON produce:** percussioni (ora in rhythm.js), pattern continui, niente che suoni "sempre".
**Regola:** se texture è sopra il 5% degli eventi MIDI, qualcosa è rotto.

---

## 7. Definizioni tracce (tracks.js)

Ogni traccia è un "score sheet" — un set di valori World State. Il Direttore seleziona e interpola tra questi.

```
tracks = {
  NEBBIA: {
    scale: A_lydian, root: 57, bpm: null,  // nessun clock ritmico
    density: { rhythm: 0, harmony: 0.3, bass: 0, melody: 0.15, texture: 0.05 },
    register: { melody: [72, 84], lead: [0, 0], arp: [0, 0] },  // solo voice, no lead/arp
    velocityCeiling: { rhythm: 0, harmony: 50, bass: 0, melody: 60, texture: 30 },
    rhythmGrid: null,
    palette: { bg: "#0A0A0A", dot: "#EFE6DE", accent: null },
    visualRegime: { maxDensity: 0.15, minDotSize: 10, composition: "VUOTO" },
    phases: { germoglio: 90, pulsazione: 60, densita: 0, rottura: 0, dissoluzione: 60 }
  },
  SOLCO: {
    scale: G_dorian, root: 55, bpm: 128,
    density: { rhythm: 0.7, harmony: 0.4, bass: 0.8, melody: 0.5, texture: 0.1 },
    register: { bass: [36, 55], melody: [67, 84], lead: [72, 96], arp: [60, 84], chords: [55, 72] },
    velocityCeiling: { rhythm: 110, harmony: 60, bass: 90, melody: 75, texture: 45 },
    rhythmGrid: [1,0,0,0, 1,0,0,1, 1,0,0,0, 0,1,0,0],  // dub syncopated
    palette: { bg: "#282B26", dot: "#FE6B0D", accent: "#CDD71D" },
    visualRegime: { maxDensity: 0.65, minDotSize: 4, composition: "ASIMMETRIA" },
    phases: { germoglio: 60, pulsazione: 55, densita: 80, rottura: 28, dissoluzione: 65 }
  },
  // ... TESSUTO, RESPIRO, MACCHINA, TEMPESTA, RITORNO da definire in brainstorming dedicato
}
```

Le 5 tracce rimanenti saranno definite in un brainstorming dedicato tra Fase 1 e Fase 2.

---

## 8. Flusso dati

```
Audio In (audio.js)
    ↓
Analisi (state.js)
    ↓
DIRETTORE (director3.js)
  legge: audio + state + clock + tracks.js + input performer
  scrive: worldState
    ↓
World State (read-only per i moduli)
    ↓
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Ritmo    │ Armonia  │ Basso    │ Melodia  │ Texture  │
│ CH0+CH1  │ CH2+CH4  │ CH3      │ CH5+6+7  │ CC+FX    │
└──────────┴──────────┴──────────┴──────────┴──────────┘
    ↓            ↓          ↓          ↓          ↓
                    MIDI Out (midi.js)
                        ↓
                    Ableton / Hardware
```

**Regola fondamentale:** nessun modulo comunica con un altro. Tutti leggono il World State. Il Direttore è l'unico che lo scrive.

---

## 9. File system

### Nuovi file
```
src/
  world-state.js      — World State oggetto + getter
  director3.js        — Direttore (arco, fasi, transizioni, vincoli)
  tracks.js           — 7 definizioni traccia (score sheets)
  rhythm.js           — Modulo Ritmo (CH0 kick + CH1 perc kit)
  harmony.js          — Modulo Armonia (CH2 drone + CH4 chords)
  bass.js             — Modulo Basso (CH3)
  melody.js           — Modulo Melodia (CH5 voice + CH6 lead + CH7 arp)
  texture.js          — Modulo Texture (FX rari + CC continui)
```

### File mantenuti (invariati o con modifiche minime)
```
src/
  audio.js            — invariato
  state.js            — invariato
  midi.js             — invariato (+ nuovo drum map per CH1)
  midi-clock.worker.js — invariato
  dna.js              — invariato
  config.js           — ridotto: solo parametri renderer/audio, no più composer configs
  field.js            — invariato (legge palette/regime dal worldState invece che da director)
  render.js           — invariato
  colors.js           — invariato (palette per traccia portate da v5)
  generations.js      — invariato
  midi-patterns.js    — aggiornato: channel map nuovo, comportamenti per nuovo schema
  director.js         — solo parte visiva (scene, camera, arco visivo). Legge worldState.
  director-events.js  — invariato
  main.js             — modificato: nuovo wiring (clock → director3 → worldState → moduli)
```

### File eliminati
```
src/
  composer.js          — sostituito dai 5 moduli
  composer2.js         — "
  composer3.js         — "
  composer4.js         — "
  composer5.js         — "
  composer6.js         — "
  composer7.js         — "
  macro-composer.js    — assorbito in director3.js
  sequencer.js         — assorbito in director3.js
  presence-multiplier.js — sostituito da density budget nel worldState
  rhythm-layer.js      — assorbito in rhythm.js
  harmony-layer.js     — assorbito in harmony.js
  melody-texture-layer.js — assorbito in melody.js + texture.js
```

---

## 10. Roadmap

### Fase 0 — Fondamenta (fork + infrastruttura)
- Fork pulito da MACH:INE II
- Tenere: renderer, audio, midi, dna, colors, entities, field
- Eliminare: 7 composer, macro-composer, sequencer, layer files
- Creare scheletri vuoti per i nuovi file
- Wiring in main.js
- **Risultato:** canvas + audio funzionano, zero note escono

### Fase 1 — Una traccia che suona bene (SOLCO)
- World State statico per SOLCO
- Implementare i 5 moduli con la traccia SOLCO
- Implementare arp su CH7
- Tutti leggono dal World State
- **Test:** "ascolto 3 minuti e muovo la testa"

### Fase 2 — Le 7 tracce (identità)
- Brainstorming dedicato per definire le 7 identità
- Definire tracks.js completo
- I moduli già funzionano — basta cambiare i vincoli
- **Test:** "sento 30 secondi, so cos'è"

### Fase 3 — Il viaggio (arco + transizioni)
- Direttore completo con arco 0→1
- Transizioni DJ-set (interpolazione World State su 4-8 bar)
- Silenzi strutturali
- Sequenza automatica 7 tracce
- Manual override per performer
- **Test:** "il momento più potente è un silenzio"

### Fase 4 — Polish (visivo + calibrazione)
- Calibrazione dopo 3 sessioni registrate
- Identità visiva per traccia
- Camera con intenzione
- CC continui
- **Test:** "3 min qualsiasi punto — voglio sentire il resto"

---

## 11. Vincoli tecnici

- Zero dependencies, zero bundler — ES modules puri
- 60fps rAF + MIDI clock Worker (~2ms tick) — nessuna regressione
- WebMIDI API su Chrome/Edge
- Server: python3 -m http.server 8282
- Nessun setTimeout per pattern musicali (step clock dedicato)
- Object pool per entità (no GC during performance)
- Tutti i parametri numerici in config.js o tracks.js (no magic numbers)

---

## 12. Identità artistica

MACH:INE III non è una copia di nessun artista. I riferimenti (Floating Points, Autechre, Burial, Ikeda) sono vocabolario condiviso per comunicare l'intenzione — non target da imitare.

L'identità unica di MACH:INE III nasce da ciò che nessun altro ha:
- **Co-composizione in tempo reale**: l'AI ascolta il performer e reagisce. Non è playback generativo (Eno) né improvvisazione pura (Autechre live). È un dialogo.
- **Il vincolo Bayer come linguaggio**: tutto il visivo è costruito con un solo strumento (il dot dithered). La limitazione genera identità, come il CBM 8032 di Henke.
- **Coerenza emergente**: i moduli non si copiano a vicenda, ma operano dentro vincoli condivisi. Il risultato è coerente ma non prevedibile — ogni sessione è una variazione dello stesso album.
- **Il performer come interprete, non operatore**: il MIDI che esce è abbastanza ricco da reggere da solo, ma lascia spazio perché il performer aggiunga la sua voce.

I pattern, i groove, le melodie devono suonare come MACH:INE — non come "quasi Floating Points" o "techno che vorrebbe essere Autechre". Se un pattern suona troppo simile a un riferimento noto, va cambiato fino a trovare la voce propria.

---

## 13. Criteri di successo (dal Production Team)

1. **Test traccia isolata** — 3 min: "cos'è? voglio sentire il resto"
2. **Test basso** — senti il cambio di carattere tra sezioni
3. **Test silenzio** — il momento più potente è un silenzio
4. **Test identità** — due sessioni = variazioni dello stesso album
5. **Test performer** — sa sempre dove si trova
