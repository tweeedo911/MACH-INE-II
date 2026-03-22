# MACH:INE II — Design Document

Documento di riferimento estetico e architetturale.
Da consultare prima di ogni modifica visiva o strutturale.

---

## Concept

**Un campo di dati che nasce, cresce, si ritira e muore. Ogni sessione e' unica.**

MACH:INE II riceve audio stereo e MIDI da Ableton in tempo reale.
Ad ogni avvio genera un nuovo DNA — un set di regole procedurali
che definiscono come quel mondo specifico si comporta.
Due sessioni non producono mai lo stesso risultato.

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
| **Note On** | Nota, velocity, canale | Eventi visivi armonici |
| **Note Off** | Fine nota | Durata degli eventi visivi |
| **CC** | Controller continui, valore, canale | Modulazione parametri visivi diretti |
| **Densita' note** | Note per finestra temporale | Contribuisce all'intensita' narrativa |
| **Range pitch** | Registro usato (basso/medio/alto) | Posizione verticale, carattere visivo |

---

## Riferimenti visivi

Pinterest board: https://it.pinterest.com/tweeedo/machne/
Immagini di riferimento in `docs/refs/`.

L'estetica si colloca all'incrocio tra:
- Ryoji Ikeda → precisione, densita' di dato, alto contrasto
- Grafica halftone/risograph → il punto come unita' fondamentale
- Diagrammi tecnici → composizione strutturata, pannelli, layout
- Stampa brutalista → grana grossa, pixel grandi, peso grafico

Quello che accomuna tutti i riferimenti:
- Il dither/halftone e' IL materiale, non un effetto
- Collisione tra griglia rigida e forma organica
- Composizione strutturata (le cose hanno posizioni, peso, senso)
- Contrasto di scala (pixel enormi accanto a grana fine)
- Il colore e' raro ma quando c'e' puo' essere intenso e sovrapposto

---

## Il DNA di sessione

Ad ogni avvio, il sistema genera un DNA unico — un set di parametri
procedurali che determinano il carattere visivo di quella sessione.

Il DNA sceglie tra i **primitivi strutturali** disponibili
e ne combina 2-3 con parametri unici:

### Primitivi strutturali

| Primitivo | Descrizione |
|-----------|-------------|
| **BANDA** | Zona orizzontale o verticale di densita' alta. Bordi netti. Puo' essere una riga di 2px o una fascia che occupa meta' schermo. |
| **VETTORE** | Direzione dominante lungo cui la densita' si distribuisce. Diagonale, curva, asse. Come un campo magnetico che orienta tutto. |
| **BLOCCO** | Rettangolo di densita' o dot-size diverso dal campo circostante. Bordi nettissimi, alto contrasto. |
| **VUOTO** | Assenza. Zona dove nulla nasce. Lo spazio nero ha una forma. |
| **FRONTE** | Bordo mobile tra due densita'. Avanza, si ritira, lascia residui. Come una linea di costa. |
| **SCIAME** | Cluster di particelle fini che si aggregano e disgregano. Posizione e comportamento collettivo, non individuale. |
| **STRISCIA** | Linee parallele sottili a distanza variabile. Possono deformarsi, interrompersi, addensarsi. |
| **MATRICE** | Griglia di caratteri o simboli a densita' variabile. Non decorativa — e' la struttura del campo resa leggibile. |

Il DNA determina per ogni primitivo scelto:
- Orientamento (orizzontale, verticale, diagonale, radiale)
- Scala (micro: 1-4px, medio: 8-16px, macro: 32px+)
- Velocita' di evoluzione
- Come risponde alle 5 bande audio
- Come nasce, come muore

Due sessioni diverse possono produrre mondi come:
- Bande orizzontali larghe + sciame di particelle fini + vuoti netti
- Vettori diagonali + matrice di caratteri + fronti che avanzano
- Blocchi brutalisti grandi + strisce sottili che li attraversano

---

## Le generazioni

Il campo non e' statico. E' un ecosistema con generazioni che vivono e muoiono.

### Ciclo vita

**Nascita:** l'audio attivo genera nuovi elementi. Le frequenze determinano
dove nascono (il mapping e' definito dal DNA: basse=sinistra, alte=destra,
oppure basse=basso, alte=alto, oppure radiale dal centro — cambia ogni sessione).
L'intensita' determina il tasso di nascita.

**Crescita:** gli elementi appena nati aumentano in densita'/opacita'.
La velocita' di crescita dipende dall'intensita' audio.

**Maturita':** gli elementi al massimo della loro espressione.
Il dot-size e' al suo valore nominale. Il colore (se presente) e' pieno.

**Invecchiamento:** gli elementi cominciano a degradarsi.
Il dot-size degenera (diventa piu' grande e rado — grana grossa).
L'opacita' cala. Il colore sbiadisce verso il grigio.
Gli elementi vecchi hanno un aspetto diverso dai giovani.

**Morte:** gli elementi scompaiono. Non istantaneamente —
si dissolvono attraverso il dither (la matrice Bayer li mangia).

### Accumulo e stratificazione

Le generazioni si sovrappongono. Dopo 5 minuti di sessione,
il campo porta le tracce di tutto quello che e' successo:
- Generazioni giovani dense e definite in primo piano
- Generazioni vecchie rade e a grana grossa sotto
- Residui fossili di generazioni morte (quasi invisibili)

Questa stratificazione e' la "memoria" del sistema.
Non c'e' un reset tra le generazioni — si accumulano.

### Relazione con l'audio

- **Silenzio:** nessuna nascita. Le generazioni esistenti invecchiano e muoiono.
  Il campo si svuota lentamente. Alla fine: quasi nero, solo dither appena visibile.
- **Ambient bassa energia:** nascita lenta, generazioni longeve, tutto graduale.
- **Building:** nascita accelerata, generazioni si sovrappongono.
- **Peak ritmico:** esplosioni di nascita sugli onset, generazioni brevi e intense.
- **Climax:** nascita massiva, tutto il campo raggiunge densita' estrema.

---

## Il trattamento halftone

Il dither Bayer 8x8 e' il trattamento fondamentale di tutto il sistema.
Non e' un overlay — e' il modo in cui ogni elemento viene reso.

### Come funziona

Ogni elemento ha un valore di densita' (0-1).
La matrice Bayer 8x8 determina quali pixel sono accesi e quali spenti.
Densita' 0 = tutto nero. Densita' 1 = tutto bianco.
I valori intermedi producono pattern di punti a densita' variabile.

### Dot-size dinamico

Il dot-size non e' fisso. Varia in base a:
- **Brillantezza audio:** suono brillante (centroid alto) = punti fini 1-2px.
  Suono cupo (centroid basso) = punti grossi 8-16px.
- **Eta' della generazione:** giovane = dot-size nominale. Vecchio = dot-size degenera.
- **DNA della sessione:** il range di dot-size e' un parametro del DNA.

Zone con dot-size diversi coesistono sullo stesso schermo.
Questo produce il contrasto di scala dei riferimenti visivi.

---

## Sistema cromatico

### Base
Nero `#000000` → bianco `#FFFFFF` attraverso grigi digitali:
`#0D0D0D` `#1C1C1C` `#2E2E2E` `#474747` `#636363` `#828282` `#A8A8A8` `#CECECE` `#E8E8E8`

La maggior parte del tempo, il sistema vive nei grigi.

### A / RITMO — `#FF4400`
Rosso-arancio bruciato. Gli elementi nati da un onset forte nascono in A.
Non e' un flash sopra la scena — sono i punti stessi che diventano A.
Poi decadono verso il grigio col tempo.

### B / ARMONIA — `#00AACC`
Teal elettrico. Gli elementi nati da eventi MIDI nascono in B.
Posizione influenzata dal pitch. Decadono verso il grigio.

### C / CLIMAX — `#E6007E`
Magenta. Quando l'intensita' e' massima sostenuta (3+ sec),
tutti gli elementi vivi virano verso C.
Il campo intero cambia colore. Poi decade.
**2-3 volte per sessione.** Mai di piu'.

### Interazione cromatica

I colori possono coesistere e sovrapporsi.
A e B possono essere visibili contemporaneamente.
Quando C si attiva, domina — ma non "esclude" istantaneamente:
gli elementi A e B virano gradualmente verso C.

Momenti possibili:
- Campo grigio con pochi punti A (onset sporadici)
- Zona A e zona B che si sovrappongono (onset + MIDI insieme)
- A su B: punti teal che diventano rosso-arancio su un onset
- Flood C che assorbe tutto gradualmente

Il colore e' integrato nel campo, non applicato sopra.

---

## Motore narrativo

### 1. Lo Stato — "dove siamo"

Cinque valori derivati, aggiornati ogni frame:

| Valore | Fonte | Range | Guida |
|--------|-------|-------|-------|
| **Intensita'** | RMS + densita' onset + densita' MIDI | 0-1 | Tasso di nascita, densita' globale |
| **Ritmicita'** | Regolarita' degli onset | 0-1 | Frequenza mutazioni, stile cambi |
| **Brillantezza** | Spectral centroid normalizzato | 0-1 | Dot-size, grana del campo |
| **Traiettoria** | Energy trajectory | -1/0/+1 | Crescita vs svuotamento vs plateau |
| **Ampiezza stereo** | Correlazione L/R | 0-1 | Dispersione spaziale degli elementi |

### 2. Il Regista — "quando mutare"

Non gestisce "scene" predefinite — gestisce **mutazioni** del campo.

**Timer adattivo:**
- Ritmicita' alta → mutazione possibile ogni 8, 16 o 32 beat (random)
- Ritmicita' bassa → mutazione possibile ogni 20-60 secondi (random)

**Tipi di mutazione:**
- Cambio di primitivo dominante (il DNA evolve: un primitivo decade, un altro emerge)
- Cambio di framing (zoom, pan, macro)
- Cambio cromatico (attivazione A o B, shift di palette)
- Inversione (campo che da nero su bianco diventa bianco su nero)
- Reset parziale (una zona del campo viene azzerata, rinasce)

**Dado e probabilita':**
- Plateau prolungato → probabilita' di mutazione sale
- Cambio drastico nell'audio → mutazione quasi certa
- Elemento random sempre presente

### 3. Il Climax — "momenti di rottura"

Quando l'intensita' supera soglia per 3+ secondi:
- Tutti gli elementi virano verso C (#E6007E)
- Il dot-size si comprime (punti fini, densita' massima)
- Il campo raggiunge quasi il bianco (o quasi il magenta)
- Al rilascio: collasso rapido, le generazioni muoiono in massa

---

## Il Direttore (camera 2D)

| Shot | Trigger | Effetto |
|------|---------|---------|
| **Wide** | Bassa energia | Tutto il campo, scala 1x |
| **Medium** | Energia crescente | Zoom 1.5x, centra sull'attivita' |
| **Macro** | Ritmicita' alta, breve | Zoom 3x, dettaglio della grana |
| **Pan** | Plateau, transizione | Drift laterale lento |

Transizioni fluide (lerp).
Veloci su musica ritmica, lente su ambient.
Macro ha durata limitata (4-8 beat), poi ritorna.

Lo zoom Macro sul campo halftone con dot-size variabile
mostra la struttura interna: i singoli punti, la matrice Bayer,
la differenza tra generazioni giovani (fini) e vecchie (grosse).

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

**Sandbox narrativo** (sandbox.html): pagina interattiva
dove si simulano input audio e MIDI tramite slider e click.
Strumento di tuning per il DNA, le generazioni e il regista.

---

## Kill list — cosa NON facciamo

- Forme tipiche da visualizer (cerchi pulsanti, onde sinusoidali decorative, VU meter)
- Gradienti morbidi o sfumature
- Glow, bloom, effetti di luce
- Mesh 3D o modelli
- Testo animato o titoli in scena
- Curve smooth o bezier (le forme sono fatte di punti e segmenti netti)
- Machine learning o analisi audio offline
- Scene predefinite intercambiabili (il mondo e' unico, non un catalogo)
- Three.js o WebGL

---

## Principio anti-fallimento

Il campo con il solo dither Bayer e un primitivo deve essere gia' interessante
prima di aggiungere generazioni, colore o camera.
Se la grana del punto non e' gia' bella da sola, niente di quello
che viene dopo la salvera'.

*Ultima modifica: 2026-03-21*
