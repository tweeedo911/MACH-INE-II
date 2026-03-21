# MACH:INE II

Audio visualizer narrativo per installazioni e live performance.

Analizza audio e eventi MIDI in tempo reale e genera visuals geometrici sincroni.

---

## Come avviarlo

### Modo semplice (con MIDI)

Apri il Terminale, trascina il file `start.sh` nella finestra e premi Invio.

Il browser si apre automaticamente su `http://localhost:8181`.

### Alternativa (solo audio, senza MIDI)

Apri `index.html` direttamente nel browser con doppio clic.
Il MIDI non funzionerà — tutto il resto sì.

---

## Cosa fa

- Legge l'audio dal microfono o dall'ingresso audio del computer
- Mostra 80 linee orizzontali sovrapposte che rappresentano lo spettro frequenziale in scorrimento
- Rileva i beat/onset e genera flash geometrici
- Riceve eventi MIDI (Note On) e li mappa visivamente sullo schermo
- HUD minimale: ampiezza, frequenza picco, stato MIDI

---

## Struttura del progetto

```
MACH:INE II/
├── index.html        app principale
├── start.sh          launcher locale (avvia server HTTP + browser)
├── README.md         questo file
├── CHANGELOG.md      log di tutte le versioni
├── RULES.md          regole di gestione del progetto
├── .gitignore        file da escludere da git
└── versions/         snapshot di ogni versione rilasciata
    └── v0.1.0.html
```

---

## Versione corrente

`v0.1.0` — vedi [CHANGELOG.md](CHANGELOG.md) per i dettagli.

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
