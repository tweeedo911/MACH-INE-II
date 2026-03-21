# TASK: Implementare v0.2.0 — AUDIO ENGINE

## Prima di iniziare

Leggi questi file nell'ordine indicato:
1. `RULES.md` — regole di progetto (flusso versioni, snapshot, commit)
2. `DESIGN.md` — documento di design aggiornato (concept, architettura audio, motore narrativo, stack)
3. `ROADMAP.md` — milestone v0.2.0 in dettaglio
4. `index.html` — codebase attuale v0.1.0 (da cui parti)
5. `CHANGELOG.md` — storico versioni

## Cosa fare

Riscrivere il motore audio e ristrutturare il codice in ES modules.
Il rendering resta simile a v0.1.0 (spettrogramma scrolling + onset flash + MIDI flash),
ma i dati sottostanti diventano molto piu' ricchi.

### 1. Struttura a ES modules

Sposta il codice da un unico `index.html` a moduli separati:

```
src/
  audio.js    — audio engine (init, analisi, dati estratti)
  midi.js     — MIDI engine (init, parsing, dati derivati)
  state.js    — stato narrativo (i 5 valori derivati dai dati audio+MIDI)
  render.js   — render loop e funzioni di disegno (portato da v0.1.0)
  config.js   — CFG centralizzato
  main.js     — boot, collegamento moduli
```

`index.html` diventa solo HTML + CSS + `<script type="module" src="src/main.js">`.
Serve un server locale per i modules (start.sh gia' presente).

### 2. Audio engine stereo (src/audio.js)

Sostituire l'attuale setup mono con:

- `getUserMedia` con `channelCount: 2` (stereo da BlackHole)
- `ChannelSplitterNode` per separare L e R
- Due `AnalyserNode` separati (uno per canale)
- Due `Uint8Array` per FFT (uno per canale)

Dati da calcolare ogni frame ed esporre come oggetto leggibile:

```js
{
  rmsL: Number,          // 0-1, RMS canale sinistro
  rmsR: Number,          // 0-1, RMS canale destro
  rms: Number,           // 0-1, media dei due

  bands: {
    sub:  { L: Number, R: Number },  // 20-80 Hz
    low:  { L: Number, R: Number },  // 80-300 Hz
    mid:  { L: Number, R: Number },  // 300-2000 Hz
    high: { L: Number, R: Number },  // 2000-8000 Hz
    air:  { L: Number, R: Number },  // 8000+ Hz
  },

  centroid: Number,       // 0-1, spectral centroid normalizzato
  flux: Number,           // 0-1, spectral flux normalizzato
  onset: Boolean,         // true se il flux supera soglia adattiva

  stereoCorrelation: Number,  // 0-1, quanto i canali sono simili
  stereoDiff: Number,         // 0-1, differenza energia L vs R

  trajectory: Number,     // -1 (calando), 0 (stabile), +1 (salendo)
                          // calcolato su finestra scorrevole ~3 secondi

  bpm: Number,            // stima BPM da intervalli onset (0 se non stimabile)

  fftL: Uint8Array,       // FFT raw canale L (per render)
  fftR: Uint8Array,       // FFT raw canale R (per render)
}
```

**Spectral flux:** somma delle differenze positive tra frame FFT corrente e precedente.
Normalizzare dividendo per il numero di bin. Onset = flux > media mobile * soglia.

**Spectral centroid:** somma(freq[i] * amp[i]) / somma(amp[i]), normalizzato su nyquist.

**Energy trajectory:** tieni un ring buffer di RMS degli ultimi ~3 secondi.
Confronta media della prima meta' con media della seconda meta'.
Differenza > soglia = salendo (+1), < -soglia = calando (-1), altrimenti stabile (0).

**Stima BPM:** tieni gli ultimi N timestamp di onset. Calcola intervallo mediano.
BPM = 60 / intervallo_mediano. Se onset troppo rari o irregolari, bpm = 0.

**Correlazione stereo:** somma(L[i] * R[i]) / sqrt(somma(L[i]^2) * somma(R[i]^2)).

### 3. MIDI engine (src/midi.js)

Migliorare l'engine MIDI attuale:

```js
{
  lastNote: { note: Number, vel: Number, ch: Number } | null,
  noteFlashes: Array,     // come v0.1.0 ma con canale
  noteDensity: Number,    // note per secondo su finestra ~2 sec
  pitchRange: { low: Number, high: Number },  // range MIDI attivo
  cc: Map,                // canale+cc -> valore (0-127)
}
```

### 4. Stato narrativo (src/state.js)

I 5 valori derivati, aggiornati ogni frame:

```js
{
  intensity: Number,      // 0-1, da rms + onset density + note density
  rhythmicity: Number,    // 0-1, da regolarita' onset
  brightness: Number,     // 0-1, da spectral centroid
  trajectory: Number,     // -1/0/+1, da audio.trajectory
  stereoWidth: Number,    // 0-1, da 1 - stereoCorrelation
}
```

Questo modulo NON prende decisioni di scena — prepara solo i dati.
Il regista e le scene arrivano in v0.3.0.

### 5. Render (src/render.js)

Portare le funzioni di disegno da v0.1.0 con queste modifiche:
- Usa i nuovi dati audio (RMS invece della somma grezza, flux invece di onset basico)
- Lo spettrogramma puo' usare la FFT di un solo canale (L) o alternare L/R
- L'onset flash usa `audio.onset` (da spectral flux) invece della vecchia logica
- I MIDI flash restano come prima

### 6. HUD debug

Aggiungere al HUD i nuovi dati per poterli verificare visivamente:
- RMS L/R con barra visiva
- Bande di energia (sub/low/mid/high/air)
- Spectral centroid
- BPM stimato
- Correlazione stereo
- Trajectory (freccia su/giu'/stabile)
- Note density

L'HUD debug puo' essere piu' verbose del normale — serve per verificare
che tutti i dati arrivino correttamente. Lo semplificheremo dopo.

## Vincoli

- **NO -ffast-math** (non rilevante qui ma regola generale del progetto)
- **NO librerie audio esterne** — tutto con Web Audio API nativo
- **NO build step** — ES modules nativi, importati dal browser
- Tutti i parametri numerici (soglie, decay, finestre) in `src/config.js`
- Nessun numero magico nel codice

## Dopo aver implementato

1. Salva snapshot della versione corrente: `cp index.html versions/v0.1.0.html` (se non esiste gia')
2. Testa che `index.html` si apra correttamente con `start.sh`
3. Aggiorna `CHANGELOG.md` con la sezione v0.2.0
4. Commit: `v0.2.0: audio engine stereo con spectral flux, band-split, ES modules`
5. Push su GitHub (branch main)

## Note

Il file `versions/v0.1.0.html` potrebbe gia' esistere.
In quel caso NON sovrascriverlo — e' lo snapshot della versione precedente.

Se hai dubbi su una decisione architetturale, scegli la soluzione piu' semplice.
La complessita' si aggiunge dopo, quando il fondamento funziona.
