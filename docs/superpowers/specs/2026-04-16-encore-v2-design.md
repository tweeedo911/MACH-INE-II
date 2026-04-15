# ENCORE v2 — Canon Machine

> Spec di design completa. Sostituisce `2026-04-15-encore-design.md`.
> Questo documento e la fonte di verita per il redesign dell'encore.

---

## 1. Identita

**Nome interno:** `ENCORE`
**Trigger:** tasto `E` (solo quando director3 e fermo o RITORNO e in dissoluzione/finito)
**Root:** C3 (MIDI 48)
**BPM base:** 132
**Durata:** ~6 minuti (196 bar a 132 BPM)
**Forma:** escalation pura a compressione → taglio netto

### Scale selezionabili live (invariate)

| Tasto | Nome | Note | MIDI (3 ottave) |
|---|---|---|---|
| **Q** | Ottatonica half-whole | C Db Eb E F# G A Bb | `[48,49,51,52,54,55,57,58, 60,61,63,64,66,67,69,70, 72,73,75,76,78,79,81,82]` |
| **W** | Ottatonica whole-half | C D Eb F Gb Ab A B | `[48,50,51,53,54,56,57,59, 60,62,63,65,66,68,69,71, 72,74,75,77,78,80,81,83]` |
| **R** | Prometheus (Scriabin) | C D E F# A Bb | `[48,50,52,54,57,58, 60,62,64,66,69,70, 72,74,76,78,81,82]` |

Default all'avvio: **Q** (half-whole).
Cambio scala: la frase canonica viene rigenerata sulla nuova scala al prossimo ciclo.
Le voci in volo continuano con la frase vecchia (collisione temporanea vecchia/nuova scala).

---

## 2. Il motore canonico

### 2.1 Generazione frase

All'inizio di ogni ciclo il sistema genera una frase di **7-13 note** sulla scala ottatonica attiva.
La frase non e casuale — segue regole di **contorno melodico**:

1. **Prevalenza gradi congiunti** (70%): il prossimo grado della scala, su o giu
2. **Salti compensati** (20%): un salto di 3a o 4a seguito da moto nella direzione opposta
3. **Salti larghi rari** (10%): 5a o 6a, solo una volta per frase, come evento
4. **Arco direzionale**: la frase ha una direzione prevalente (ascendente o discendente),
   non zigzaga casualmente
5. **Chiusura**: l'ultima nota e la root o a distanza di 3a/5a dalla prima nota

Il risultato e una frase che *suona scritta*, non tirata a caso.

### 2.2 Cinque voci canoniche

La stessa frase viene suonata simultaneamente da 5 voci, ciascuna con velocita
e trasformazione diversa:

| Voce | CH MIDI | Velocita | Trasformazione | Registro MIDI |
|---|---|---|---|---|
| **Bass** | CH3 | 1x (originale) | nessuna | C2-G3 [36-55] |
| **Chord** | CH4 | 1x | sfasata di 1/3 della frase | C3-C5 [48-72] |
| **Arp** | CH7 | 3x | inversione (moto contrario) | C4-Bb5 [60-82] |
| **Voice** | CH5 | 1/2x | retrogrado (al contrario) | G4-C6 [67-84] |
| **Lead** | CH6 | 2x | originale | D4-A5 [62-81] |

**Trasformazioni:**
- **Inversione (moto contrario):** se la frase sale di 3a, la voce scende di 3a
- **Retrogrado:** la frase suonata dall'ultima nota alla prima
- **Sfasamento 1/3:** la voce inizia dal 33% della frase (es. frase di 9 note → parte dalla nota 4)

### 2.3 Convergenze

Con velocita 1x, 1/2x, 2x, 3x e offset 1/3, le voci si riallineano su intervalli calcolabili.

**Rilevamento:** a ogni beat il sistema verifica se >=3 voci stanno suonando la stessa nota
(o a distanza di ottava). Se si → **evento convergenza** segnalato al visual.

**Convergenza forzata:** al cambio frase, tutte le voci convergono sulla root per 1 beat
prima di ripartire col nuovo materiale. Questo crea un punto di arrivo riconoscibile.

### 2.4 Contrappunto computato — vincoli

Oltre alla meccanica canonica, il sistema verifica vincoli a ogni tick:

1. **No unisoni** tra voci nello stesso registro (se due voci atterrano sulla stessa nota
   nello stesso ottava, la seconda viene spostata di una 3a)
2. **Consonanze periodiche**: almeno 1 beat su 4 deve avere una consonanza (3a, 5a, 8a)
   tra almeno 2 voci. Se non c'e, la nota dell'arp (voce piu veloce, 3x) viene spostata al grado consonante piu vicino nella scala.
3. **Distanza massima**: nessuna coppia di voci adiacenti per registro deve superare
   un'ottava + 5a di distanza.

Questi vincoli impediscono che il canone diventi "rumore" pur mantenendo la complessita.

---

## 3. Escalation a compressione

### 3.1 Forma

Escalation pura: parte dal nulla, accumula strati, comprime il tempo tra ogni nuovo strato,
arriva a un muro insostenibile, taglio netto, nero, silenzio, fine del concerto.

Nessuno smontaggio. Nessuna decostruzione. Il pezzo si **spegne**.

### 3.2 Strati

| # | Entra a bar | Durata | Cosa entra | Note |
|---|---|---|---|---|
| 0 | 0 | 16 | Heartbeat: kick + polvere percussiva | BPM 60→132. Hat/conga a densita bassissima (ticchettii sparsi, non groove) |
| 1 | 16 | 36 | + Arp (3x invertita, acuto) | Una voce sola, veloce, in alto nel buio. "Che cos'e?" |
| 2 | 52 | 32 | + Bass (1x originale, grave) | Il basso risponde all'arp. Due estremi. Frase B. |
| 3 | 84 | 24 | + Hat 5/8 + snare [3,7,11] | Il terreno ritmico si completa. Groove polimetrico. |
| 4 | 108 | 20 | + Voice (1/2x retrograda) | Frase lenta, riconoscibile al contrario. Frase C. |
| 5 | 128 | 16 | + Lead (2x originale, medio-alto) | 5a voce, il registro medio si riempie. |
| 6 | 144 | 12 | + Chord (1x sfasata 1/3) + drone | L'armonia verticale arriva. Frase D. |
| 7 | 156 | 8 | + Conga | Ultimo pezzo del tetris ritmico. |
| 8 | 164 | 32 | **Plateau** | Frase nuova ogni 4 bar. Convergenze sempre piu frequenti. |
| — | 196 | — | **Taglio netto** | Nero totale. Silenzio. Fine. |

**Totale: 196 bar = 5 min 56s a 132 BPM.**

### 3.3 Compressione

La durata tra uno strato e il prossimo si dimezza progressivamente:
36 → 32 → 24 → 20 → 16 → 12 → 8 bar.
L'accelerazione della costruzione **e** la tensione.

### 3.4 Cambio frase

Ogni strato che entra porta una nuova frase. Le voci gia attive switchano alla nuova frase
al loro prossimo punto di ricominciamento del ciclo (non tagliano a meta).

Al plateau le frasi cambiano ogni 4 bar — il materiale si rinnova freneticamente.
Le convergenze diventano piu frequenti perche le frasi sono piu corte (il sistema
accorcia la frase a 5-7 note durante il plateau).

### 3.5 Heartbeat

| Beat | BPM | Kick vel | Percussioni |
|---|---|---|---|
| 0 | — | — | Silenzio (1s pausa) |
| 1 | 60 | 40 | — |
| 2 | 70 | 50 | hat sporadico (10% prob) |
| 3 | 80 | 60 | hat + conga sporadici |
| 4 | 92 | 70 | polvere percussiva cresce |
| 5 | 104 | 80 | densita percussiva ~20% |
| 6 | 116 | 90 | densita ~30% |
| 7 | 126 | 100 | densita ~40% |
| 8+ | 132 | 110 | Heartbeat finito, arp entra |

BPM ramp lineare su 16 bar (60→132), velocity ramp lineare (40→110),
polvere percussiva a probabilita crescente (0%→40%).

---

## 4. Visual — geometrie a blocchi

### 4.1 Principio

Lo schermo e una griglia fissa di blocchi grandi (cellPx 20 = ~48x27 celle).
I blocchi non si muovono — si **illuminano** per creare geometrie.
Ogni voce canonica ha una **mappa geometrica** che determina quali blocchi si accendono.
La nota e la velocity determinano quale pattern geometrico si attiva.

Le geometrie emergono dalla **sovrapposizione** delle mappe: come il canone musicale,
ogni voce segue le sue regole, ma l'incrocio produce forme che nessuna voce ha "deciso" da sola.

### 4.2 Colore

**Bianco e nero dominante.**
A velocity normale → tutto e **bianco su nero**.
A velocity forte (>90) → il colore puro della voce emerge:

| Voce | Colore forte | RGB |
|---|---|---|
| Kick | bianco | [255, 255, 255] |
| Bass | giallo | [255, 255, 0] |
| Arp | verde | [0, 255, 0] |
| Voice | blu elettrico | [0, 100, 255] |
| Lead | magenta | [255, 0, 255] |
| Chord | ciano | [0, 255, 255] |
| Snare | bianco (negativo) | inversione |
| Hat/conga | bianco | [255, 255, 255] |

Zone dove si sovrappongono piu voci → **bianco** (somma).
Il colore e un evento raro e significativo — non la norma.

### 4.3 Mappe geometriche per voce

| Voce | Geometria | Nota controlla... | Velocity controlla... |
|---|---|---|---|
| **Kick** | Riga orizzontale intera | quale riga (centro +/- drift) | luminosita |
| **Bass** | Meta schermo (sopra/sotto) | quale meta (nota alta=sopra, bassa=sotto) | quante celle si accendono |
| **Arp** | Diagonale | angolo (nota bassa=nord-est, alta=sud-ovest, media=verticale) | spessore (1-3 celle) |
| **Voice** | Arco concentrico dal centro | raggio (nota alta=piccolo, bassa=grande) | arco (vel bassa=1/4 cerchio, alta=cerchio pieno) |
| **Lead** | Croce (+) centrata su una cella | posizione X,Y dalla nota | dimensione bracci |
| **Chord** | Quadrante (1/4 dello schermo) | quale quadrante (4 note dell'accordo = 4 quadranti) | riempimento (vel bassa=bordo, alta=pieno) |
| **Snare** | Inversione negativa di una fascia | fascia casuale | — |
| **Hat/conga** | Pixel singoli sparsi | — | densita punti |

### 4.4 Sovrapposizione = geometria emergente

Le geometrie non sono pre-disegnate. Emergono dalla sovrapposizione delle mappe:

- **Arp (diagonale) + bass (meta schermo)** → triangolo
- **Chord (quadrante) + kick (riga)** → quadrante tagliato da una riga
- **Voice (arco) + lead (croce)** → mirino con curva
- **Convergenza 3+ voci** → flash bianco fullscreen per 1 frame

L'effetto al plateau: blocchi che si accendono in pattern apparentemente casuali
finche non si vede che formano strutture. Il momento "ah, e tutto collegato".

### 4.5 Residuo puntinato

Dopo il flash geometrico (1-2 frame a piena intensita), la forma si sbriciola in punti
sparsi che decadono in ~0.5-1s. Il Bayer dithering del campo trasforma il blocco pieno
in grana mentre decade.

**Decay aggressivo:** 0.85-0.92 (vs 0.99+ dei biomi normali).
Il residuo dura ~0.5s, abbastanza per lasciare traccia ma non per impastare.

### 4.6 Escalation visiva

All'inizio (pochi strati) lo schermo e quasi vuoto — flash isolati nel buio.
Man mano che gli strati entrano, le geometrie si moltiplicano.
Al plateau la griglia e saturata — blocchi che si accendono ovunque,
convergenze frequenti, lo schermo pulsa.
Al taglio: tutto nero, istantaneo.

### 4.7 Camera

**Fissa.** Zoom 1.0, centro (0.5, 0.5), nessun movimento, nessun POI, nessun micro-drift.
L'occhio e immobile. La geometria fa tutto il lavoro.

---

## 5. Tasti

| Tasto | Azione | Quando |
|---|---|---|
| `E` | Lancia ENCORE | Director fermo o RITORNO finito |
| `Q` | Scala half-whole | Durante ENCORE |
| `W` | Scala whole-half | Durante ENCORE |
| `R` | Scala Prometheus | Durante ENCORE |
| `Space` | Stop forzato | Durante ENCORE |

I tasti `1-7` (jump track) non funzionano durante ENCORE.
Il tasto `E` non fa nulla se ENCORE e gia in corso.

---

## 6. File coinvolti

| File | Modifica |
|---|---|
| `tracks.js` | Ridefinire ENCORE: registri per 5 voci canoniche, velocita, parametri frase |
| `biomi.js` | Riscrivere bioma ENCORE: depositFn geometriche (diagonale, quadrante, arco, croce, meta) |
| `director3.js` | Riscrivere state machine: escalation a compressione, **generatore di frasi**, **canon engine** (trasformazioni + sfasamento), **rilevamento convergenze** |
| `melody-v3.js` | Arp: legge frase 3x invertita. Voice: legge frase 1/2x retrograda. |
| `harmony.js` | Chord: legge frase 1x sfasata 1/3, estrae voicing dagli incroci verticali |
| `bass-v3.js` | Bass: legge frase 1x originale |
| `campo.js` | Helper geometrici: `depositDiagonal`, `depositQuadrant`, `depositArc`, `depositCross`, `depositHalf`. Supporto flash convergenza. |
| `world-state.js` | Aggiungere: `encorePhrase` (frase corrente), `encoreVoicePos` (posizione per voce), `encoreConvergence` (flag convergenza per il visual) |
| `config.js` | Costanti canone: `ENCORE_PHRASE_LEN_MIN/MAX`, `ENCORE_VOICE_SPEEDS`, regole contorno |

**Non si toccano:** main.js (tasti gia cablati), camera.js (bypass gia presente),
midi.js, texture.js, firma.js, field.js, render.js, geo.js.

**Rhythm.js:** nessuna modifica strutturale. La polvere percussiva del heartbeat usa
la densita bassa gia esistente. Hat 5/8 e snare [3,7,11] restano.

---

## 7. Rischi e mitigazioni

| Rischio | Mitigazione |
|---|---|
| Le frasi generate non suonano "scritte" | Regole di contorno melodico rigide (§2.1). Fallback: pool di 5-6 frasi pre-composte da usare al 30% dei cicli. |
| Convergenze troppo rare | Velocita scelte per LCM ragionevoli. Convergenza forzata a ogni cambio frase. Al plateau frasi piu corte = convergenze piu frequenti. |
| Convergenze troppo frequenti (perde impatto) | La frase di 7-13 note con velocita 1x/2x/3x produce convergenze ogni ~6-12 bar — abbastanza rare da essere eventi. |
| depositFn geometriche costose | Griglia ~48x27 = 1296 celle. Le geometrie sono lookup lineari (riga = 48 write, diagonale = 27 write). Trascurabile vs il render Bayer. |
| Residuo puntinato impasta le geometrie | Decay aggressivo (0.85-0.92). Residuo dura ~0.5s. Se impasta: abbassare decay. |
| 5 voci canoniche = complessita per il performer | L'encore e autocontenuto — il performer interpreta liberamente. I tasti Q/W/R sono l'unico controllo. La complessita e della macchina, non dell'umano. |
| Il taglio netto potrebbe sembrare un crash | Il taglio e voluto e va comunicato: schermo nero = fine. Se necessario, aggiungere 1 beat di fade a zero sul master volume (non visibile, solo audio). |

---

## 8. Definizioni non negoziabili

- Il pezzo parte SOLO su comando (`E`), mai automaticamente dopo RITORNO.
- I 7 biomi e le 7 tracce della suite non vengono modificati in nessun modo.
- L'encore e autocontenuto: se non premi `E`, e come se non esistesse.
- Le voci canoniche suonano trasformazioni della **stessa frase** — non materiale indipendente.
- Il contrappunto e computato live, non pre-scritto.
- I colori sono B/N dominante con RGB puro solo a velocity forte.
- Il taglio finale e netto — nessuno smontaggio, nessun fade.
- La camera e fissa.

---

## 9. Confronto con ENCORE v1

| Aspetto | v1 (attuale) | v2 (questo redesign) |
|---|---|---|
| Forma | Diamante (costruzione + decostruzione) | Escalation pura + taglio netto |
| Armonia | Progressione ciclica di 4 accordi | Canone: 5 voci dalla stessa frase |
| Incastri | Polimetria (cicli diversi) | Contrappunto computato (trasformazioni + vincoli) |
| Visual | RGB puri, puntini, scatter random | Geometrie a blocchi (diagonali, quadranti, archi), B/N + RGB raro |
| Ordine strati | kick→voice→chord→hat→arp→snare→bass | arp→bass→ritmo→voice→lead→chord |
| Durata | 176 bar (5m20s) | 196 bar (5m56s) |
| Fine | Teardown inverso 56 bar | Taglio netto istantaneo |
| Voci melodiche | 3 (arp, voice, bass) | 5 (arp, voice, bass, lead, chord) |
| Generazione | Pattern fissi per strato | Frase generata + trasformata live |
