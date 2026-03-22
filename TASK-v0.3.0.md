# TASK: Implementare v0.3.0 — SANDBOX NARRATIVO

## Prima di iniziare

Leggi questi file nell'ordine indicato:
1. `RULES.md` — regole di progetto
2. `DESIGN.md` — documento di design (in particolare: motore narrativo, vocabolario texture, sistema cromatico)
3. `ROADMAP.md` — milestone v0.3.0
4. `src/` — tutto il codice v0.2.0 (config, audio, midi, state, render, main)
5. `CHANGELOG.md` — storico versioni

## Obiettivo

Creare un **sandbox narrativo** — uno strumento di lavoro interattivo dove si simula
l'input audio e MIDI con slider e click per vedere come il motore narrativo risponde.

Questo NON e' un visualizer: e' uno strumento di design e tuning.
Serve per progettare il comportamento del sistema prima di collegare l'audio reale.

Il file e' `sandbox.html` nella root del progetto (separato da index.html).

## Architettura

Il sandbox ha la sua logica interna. NON importa i moduli da src/ —
e' un file self-contained con il proprio codice.

Deve simulare i 5 valori dello Stato (intensity, rhythmicity, brightness, trajectory, stereoWidth)
e usarli per guidare un canvas con UNA scena di test e la logica del Regista.

## Layout

Schermo diviso in due:
- **Sinistra (70%)**: canvas con la scena visiva
- **Destra (30%)**: pannello di controllo scuro con slider, pulsanti e readout

Estetica del pannello: sfondo nero, testo monospace, stile terminale.
Stessa palette del progetto (grigi + A/B/C).

## Pannello di controllo — sezione SIMULAZIONE INPUT

Cinque slider orizzontali che simulano i valori dello Stato:

| Slider | Range | Default | Label |
|--------|-------|---------|-------|
| Intensity | 0–1 | 0 | INT |
| Rhythmicity | 0–1 | 0 | RHYT |
| Brightness | 0–1 | 0 | BRIT |
| Trajectory | -1 / 0 / +1 | 0 | TRAJ (tre pulsanti, non slider) |
| Stereo Width | 0–1 | 0 | WIDE |

Due pulsanti:
- **ONSET** — simula un onset (click o tasto spazio). Genera un flash visivo sul canvas.
- **MIDI NOTE** — simula una nota MIDI random (click o tasto M). Genera evento armonico.

Un preset rapido con 3 pulsanti:
- **AMBIENT** — intensity 0.1, rhythmicity 0.05, brightness 0.3, trajectory 0, width 0.6
- **BUILDING** — intensity 0.5, rhythmicity 0.6, brightness 0.5, trajectory +1, width 0.4
- **PEAK** — intensity 0.9, rhythmicity 0.85, brightness 0.8, trajectory 0, width 0.3

## Pannello di controllo — sezione REGISTA

Readout in tempo reale dello stato interno del Regista:

```
SCENE        CAMPO_PUNTI
SCENE TIME   12.4s
NEXT CHECK   4.2s
CHANGE PROB  0.35
LAST CHANGE  TEXTURE → FRAMING
──────────────────
FRAMING      WIDE
COLOR A      ON
COLOR B      OFF
COLOR C      OFF
```

Tre parametri del Regista configurabili con slider:
- **Base change interval** (10–60s, default 30s)
- **Rhythmic divisor** (4/8/16/32 beat equivalenti)
- **Random factor** (0–1, default 0.3)

## Il Regista — logica

Implementa la logica descritta nel DESIGN.md:

1. Timer interno che conta il tempo dalla ultima scena.
2. Il timer target dipende dalla rhythmicity:
   - rhythmicity > 0.5 → target = (rhythmic divisor) beat equivalenti
     (usa un BPM fisso di 120 per la simulazione, beat = 60/120 = 0.5s)
   - rhythmicity <= 0.5 → target = base change interval * (1 + random factor * Math.random())
3. Quando il timer supera il target, il Regista tira un dado:
   - Probabilita' base = 0.5
   - Se trajectory == 0 (plateau) da piu' di 5 secondi: probabilita' += 0.3
   - Aggiunge random factor * Math.random()
   - Se probabilita' > 0.6: cambia scena
4. Tipi di cambio: sceglie random tra texture, framing, colore, reset.
5. Aggiorna il readout nel pannello.

## Canvas — scena di test

Implementa UNA scena che risponda ai 5 valori dello Stato.
Usa il vocabolario visivo del progetto (vedi DESIGN.md):

**Campo di punti con dither Bayer come base:**
- Numero di particelle proporzionale a intensity (20 a intensity 0, 300 a intensity 1)
- Velocita' particelle proporzionale a rhythmicity
- Colore base: grigi. Brightness mappa la luminosita' dei grigi.
- Stereo width mappa la dispersione orizzontale (width basso = particelle raggruppate al centro,
  width alto = distribuite su tutto il canvas)
- Trajectory +1: particelle si muovono verso l'alto. -1: verso il basso. 0: moto browniano.

**Onset flash:**
Quando si clicca ONSET o spazio, disegna un flash geometrico in colore A (#FF4400):
esplosione di rettangoli concentrici che decadono.

**MIDI note:**
Quando si clicca MIDI NOTE o M, disegna una linea verticale in colore B (#00AACC)
a posizione X random, con quadrato piccolo. Decade.

**Dither overlay:**
Sempre presente come texture leggera sopra tutto. Matrice Bayer 8x8.
Intensita' del dither proporzionale a (1 - brightness): suono scuro = piu' dither visibile.

**Climax:**
Quando intensity > 0.85 per piu' di 3 secondi continuativi, il canvas
entra in stato climax: flood colore C (#E6007E), rettangoli concentrici,
override dei colori A e B. Dura finche' intensity resta sopra 0.85.

**Framing:**
Il Regista puo' cambiare il framing. Implementa come viewport virtuale:
- WIDE: mostra tutto il canvas (default)
- MEDIUM: zoom 1.5x sul centro
- MACRO: zoom 3x su un punto random del campo
- PAN: lento spostamento laterale del viewport

Implementa il framing come trasformazione del context 2D (translate + scale).

## Vincoli

- File unico self-contained: `sandbox.html`
- Nessuna dipendenza esterna
- Stessa estetica del progetto (nero, monospace, palette A/B/C)
- Tutti i parametri numerici commentati e raggruppati in un oggetto CFG in cima allo script
- Deve funzionare aprendo il file direttamente nel browser (no server necessario)

## Dopo aver implementato

1. Testa che sandbox.html si apra nel browser e che tutti gli slider funzionino
2. Testa i 3 preset (AMBIENT, BUILDING, PEAK) e verifica che il canvas risponda coerentemente
3. Testa onset (spazio) e MIDI (M) e verifica i flash
4. Verifica che il Regista cambi scena automaticamente e che il readout si aggiorni
5. Verifica il climax: metti intensity a 0.9 e aspetta 3+ secondi
6. Aggiorna `CHANGELOG.md` con la sezione v0.3.0
7. Commit: `v0.3.0: sandbox narrativo con regista, scene, framing, simulazione input`
8. Push su GitHub (branch main)
