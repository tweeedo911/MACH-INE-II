# MACH:INE II — Design Document

Documento di riferimento estetico e architetturale.
Da consultare prima di ogni modifica visiva o strutturale.

---

## Concept

**Sistema reattivo con narrazione autonoma.**

MACH:INE II riceve audio stereo e MIDI da Ableton in tempo reale.
Interpreta questi dati, costruisce un mondo visivo procedurale e lo evolve nel tempo
con cambi di scena, zoom, variazioni cromatiche e momenti di rottura.

Il sistema reagisce alla musica in modo diretto e visibile.
Non decora — interpreta, accumula, decide.

Non conosce la traccia in anticipo. Tutto e' in tempo reale.

---

## Audio routing

```
Ableton → BlackHole (stereo) → MACH:INE (analisi)
Ableton → Interfaccia audio → Casse (monitoring)
```

MACH:INE riceve audio stereo da BlackHole. Non fa passthrough.
Il monitoring e' gestito dal mixer di Ableton.

---

## Estrazione dati audio

Input stereo analizzato tramite due AnalyserNode (L/R) via ChannelSplitterNode.

### Per frame (60fps)

| Dato | Descrizione | Uso |
|------|-------------|-----|
| **RMS per canale** | Volume percepito istantaneo L/R | Intensita' visiva globale |
| **Band-split energy** | Energia su 5 bande (sub/low/mid/high/air) per canale | Ogni banda guida un layer visivo diverso |
| **Spectral centroid** | Media pesata delle frequenze | Brillantezza: suono scuro vs brillante |
| **Spectral flux** | Variazione spettrale frame-to-frame | Onset detection (sostituisce soglia statica) |
| **Differenza L/R** | Energia e spettro per canale | Asimmetria visiva, posizione elementi |
| **Correlazione stereo** | Similarita' tra i due canali | Ampiezza del campo visivo (mono=stretto, stereo=espanso) |

### Su finestra temporale (~3 secondi)

| Dato | Descrizione | Uso |
|------|-------------|-----|
| **Energy trajectory** | Energia in salita, discesa o stabile | Costruzione vs svuotamento vs plateau |
| **Stima BPM** | Intervalli tra onset | Ritmicita' della sessione, timing cambi scena |
| **Densita' onset** | Onset per finestra temporale | Carattere ritmico vs ambient |

---

## Estrazione dati MIDI

Input da Ableton via WebMIDI. Il sistema riconosce i canali MIDI se presenti,
ma funziona anche con tutto su un canale unico.

| Dato | Descrizione | Uso |
|------|-------------|-----|
| **Note On** | Nota, velocity, canale | Eventi visivi armonici (colore B) |
| **Note Off** | Fine nota | Durata degli eventi visivi |
| **CC** | Controller continui, valore, canale | Modulazione parametri visivi diretti |
| **Densita' note** | Note per finestra temporale | Contribuisce all'intensita' narrativa |
| **Range pitch** | Registro usato (basso/medio/alto) | Posizione verticale, carattere visivo |

---

## Motore narrativo

Il motore narrativo sta tra i dati (audio + MIDI) e il rendering.
Non disegna nulla — decide cosa disegnare, come, e quando cambiare.

### 1. Lo Stato — "dove siamo"

Cinque valori derivati, aggiornati ogni frame:

| Valore | Fonte | Range | Guida |
|--------|-------|-------|-------|
| **Intensita'** | RMS + densita' onset + densita' MIDI | 0–1 | Complessita' visiva globale |
| **Ritmicita'** | Regolarita' degli onset | 0–1 | Frequenza e stile dei cambi scena |
| **Brillantezza** | Spectral centroid normalizzato | 0–1 | Palette (grigi bassi vs alti), possibilita' di colore |
| **Traiettoria** | Energy trajectory | -1/0/+1 | Costruzione (+1), svuotamento (-1), plateau (0) |
| **Ampiezza stereo** | Correlazione L/R | 0–1 | Composizione stretta (mono) vs espansa (stereo) |

### 2. Il Regista — "quando cambiare"

Gestisce i cambi scena. Ha un timer interno che si resetta ad ogni cambio.

**La durata tra cambi dipende dalla ritmicita':**
- Ritmicita' alta → cambio possibile ogni 8, 16 o 32 beat (scelta random)
- Ritmicita' bassa → cambio possibile ogni 20–60 secondi (range random)

**Ad ogni potenziale punto di cambio, il regista tira un dado:**
- Energia stabile da tempo → probabilita' di cambio sale (evita stasi)
- Cambio drastico nell'audio (drop, break) → cambio quasi certo
- Elemento random sempre presente → imprevedibilita'

**Tipi di cambio scena:**
- Cambio texture dominante
- Cambio framing (zoom microscopio, zoom out panoramico, pan)
- Cambio cromatico (attivazione/disattivazione colori semantici A/B/C)
- Reset parziale o totale del campo (ripartenza)

### 3. Il Climax — "momenti di rottura"

Non guidato dal regista ma da una soglia di intensita'.

Quando l'intensita' supera una soglia per un tempo sostenuto
(plateau alto, non un singolo picco), il sistema entra in stato di climax:
flood cromatico C, glitch, rottura delle regole compositive normali.

Raro e imprevedibile — ma sempre motivato dall'audio.

---

## Riferimenti visivi

Artisti di riferimento: Ryoji Ikeda, Refik Anadol, Christine Sun Kim, Brian Foo, Valery Vermeulen.
Pinterest board: https://it.pinterest.com/tweeedo/machne/

Sintesi dei riferimenti:
- Ikeda → precisione geometrica, densita' di dato, alto contrasto, binario
- Anadol → fluidita' collettiva, profondita', respiro
- Christine Sun Kim → l'immagine come partitura leggibile del suono
- Brian Foo → stratificazione come narrativa nel tempo
- Vermeulen → autonomia matematica del sistema

---

## Sistema cromatico

La palette e' austera. Il 90% del visuale vive nei grigi.
I colori compaiono raramente e sempre con un significato preciso.

### Base
Nero `#000000` → bianco `#FFFFFF` attraverso grigi digitali:
`#0D0D0D` `#1C1C1C` `#2E2E2E` `#474747` `#636363` `#828282` `#A8A8A8` `#CECECE` `#E8E8E8`

### A / RITMO — `#FF4400`
Rosso-arancio bruciato. Energia percussiva, impatto fisico.
Trigger: onset, kick, attacchi, transienti.
Frequenza: comune durante sezioni energetiche.

### B / ARMONIA — `#00AACC`
Teal elettrico. Informazione melodica, struttura.
Trigger: note MIDI, accordi, pitch, armonia.
Frequenza: presente durante sezioni melodiche.

### C / CLIMAX — `#E6007E`
Magenta. Rottura del sistema, picco narrativo.
Trigger: energia massima sostenuta, evento raro.
Frequenza: **2-3 volte per sessione**. Mai di piu'.

### Regola dei tre colori
Non piu' di 2 colori semantici visibili contemporaneamente a schermo.
C/CLIMAX esclude A e B finche' e' attivo.

### Selettore palette
Da implementare dopo v1.0. Il sistema cromatico sopra e' il default.

---

## Vocabolario texture

Sei texture fondamentali, usate in combinazione:

| Texture | Uso |
|---------|-----|
| **Dither Bayer 8x8** | Texture primaria del sistema. Sempre presente a bassa intensita'. |
| **Linee topografiche** | Campo di altitudine. Risponde all'ampiezza globale. |
| **Character grid** | Simboli/caratteri come densita'. Sfondo a bassa energia. |
| **Scanline + barre** | Rappresentazione frequenziale diretta. |
| **Block color** | Zone piatte di grigio. Struttura compositiva. |
| **Glitch / artefatto** | Rottura digitale. Usato raramente, su eventi estremi. |

Il dither e' il collante: ogni transizione tra texture usa il dither come interpolazione.

---

## Vocabolario forme

| Forma | Comportamento |
|-------|---------------|
| **Campo di punti** | Nascita da onset · posizione da frequenza · invecchiamento visibile |
| **Superficie topografica** | Griglia deformata dall'ampiezza · memoria di forma |
| **Evento ritmico (A)** | Esplosione geometrica in `#FF4400` · si cristallizza in traccia |
| **Evento armonico (B)** | Linea verticale in `#00AACC` · posizione X = pitch MIDI |
| **Stratificazione** | Tracce accumulate · leggibili come partitura · non si cancellano |
| **Climax (C)** | Flood magenta · rettangoli concentrici · zoom camera |

---

## Architettura visiva

### IL MONDO (ecosistema)
- Particelle con nascita, vita, morte
- Posizione → frequenza del bin corrispondente
- Velocita' → energia della banda
- Eta' → opacita', cristallizzazione
- Tracce persistenti che stratificano la storia della sessione

### IL DIRETTORE (sistema camera 2D)
Cambia inquadratura in base alla struttura musicale:

| Shot | Trigger |
|------|---------|
| Wide | Default, stato di bassa energia |
| Medium | Building, energia crescente |
| Macro | Zoom "microscopio" su porzione del campo |
| Pan | Spostamento laterale, esplorazione |

Su musica eterea: deriva lenta e continua, no tagli netti.
Su musica ritmica: tagli precisi a tempo.
La scelta e' del Regista, con elemento random.

---

## Stack tecnico

| Componente | Tecnologia |
|------------|------------|
| Rendering | Canvas 2D |
| Analisi audio | Web Audio API (ChannelSplitter + 2x AnalyserNode) |
| MIDI | WebMIDI API |
| Struttura | ES modules nativi (`<script type="module">`) |
| Build step | Nessuno |
| Server locale | `python -m http.server` via start.sh |

Tutto self-contained. Nessuna libreria audio esterna.

---

## Strumenti di lavoro

Il **moodboard statico** (docs/moodboard.html) resta come riferimento palette e texture.

Lo strumento di lavoro principale e' il **sandbox narrativo**: una pagina interattiva
dove si simulano input audio e MIDI tramite slider e click, si osserva il comportamento
del motore narrativo e si tuonano i parametri prima di collegare l'audio reale.

---

## Kill list — cosa NON facciamo

- Testo animato o titoli in scena
- Mesh 3D complesse o modelli
- Gradienti colorati (solo grigi + A/B/C)
- Glow o bloom eccessivo
- Piu' di 3 colori semantici nel sistema
- Piu' di 2 colori semantici simultanei a schermo
- Effetti di post-processing pesanti
- Machine learning o analisi audio offline
- Piu' di 10 parametri configurabili simultaneamente
- Three.js o WebGL (si resta su Canvas 2D)

---

## Principio anti-fallimento

Ogni versione deve essere visivamente bella **da sola** prima di aggiungere complessita'.
Se un layer con camera fissa non e' gia' interessante, non si aggiunge Il Direttore.
Se una texture non funziona in isolamento, non si combina con le altre.

*Ultima modifica: 2026-03-21*
