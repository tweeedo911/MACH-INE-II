# MACH:INE II

Audio visualizer narrativo per installazioni e live performance.

Analizza audio e eventi MIDI in tempo reale e genera visuals geometrici sincroni.

---

## Come avviarlo

### Modo semplice (con MIDI)

Apri il Terminale, trascina il file `start.sh` nella finestra e premi Invio.

Il browser si apre automaticamente su `http://localhost:8181`.

### Alternativa

Da terminale, nella cartella del progetto:

```
python3 -m http.server 8181
```

Poi apri `http://localhost:8181` nel browser.

> **Nota:** da v0.2.0 il progetto usa ES modules — serve un server HTTP locale.
> Aprire `index.html` con doppio clic non funziona più.

---

## Cosa fa

- Riceve audio stereo (da BlackHole o microfono) e MIDI in tempo reale
- Analisi stereo: RMS per canale, 5 bande frequenziali (sub/low/mid/high/air), spectral centroid, correlazione stereo
- Onset detection via spectral flux (soglia adattiva)
- Energy trajectory (~3 sec), stima BPM da intervalli onset
- Stato narrativo derivato: intensity, rhythmicity, brightness, trajectory, stereo width
- Spettrogramma scrolling (80 linee, stile Joy Division)
- Flash geometrici su onset, linee verticali su note MIDI
- HUD debug con tutti i dati in tempo reale

---

## Struttura del progetto

```
MACH:INE II/
├── index.html        shell HTML + CSS + <script type="module">
├── src/
│   ├── main.js       boot e collegamento moduli
│   ├── config.js     parametri centralizzati
│   ├── audio.js      audio engine stereo
│   ├── midi.js       MIDI engine
│   ├── state.js      stato narrativo (5 valori derivati)
│   └── render.js     render loop, disegno, HUD debug
├── sandbox.html      sandbox narrativo (simulazione input + regista)
├── start.sh          launcher locale (server HTTP + browser)
├── README.md         questo file
├── CHANGELOG.md      log di tutte le versioni
├── RULES.md          regole di gestione del progetto
├── DESIGN.md         documento di design
├── ROADMAP.md        milestone del progetto
├── .gitignore        file da escludere da git
└── versions/         snapshot di ogni versione rilasciata
    └── v0.1.0.html
```

---

## Versione corrente

`v0.3.0` — vedi [CHANGELOG.md](CHANGELOG.md) per i dettagli.

---

## Requisiti

- Browser Chrome o Edge (WebMIDI non è supportato su Firefox e Safari)
- Python 3 installato (per `start.sh`)
- Microfono o interfaccia audio
- Opzionale: controller o tastiera MIDI

---

## Crediti

Progetto di Edoardo Vogrig.
Sviluppato con Claude (Anthropic) in Cowork mode.
