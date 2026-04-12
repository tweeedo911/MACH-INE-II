# Sistema Visivo — Design Spec
*2026-04-10 — Sessione brainstorming*

---

## Problema

Il sistema attuale usa event-spawn rendering: nota MIDI → spawna oggetto → decade → muore.
È il pattern visualizer. Non produce l'estetica descritta nella visione:
"sogno febbrile mai fermo, in sottile movimento perpetuo, crescita e decadimento che non si interrompono mai davvero."

## Soluzione architetturale: Campo Materiale

Il campo non è un visualizer. È un campo fisico persistente.
La musica vi applica forze. Quello che vedi è lo stato del campo — non gli eventi.

---

## Principi non negoziabili

1. **Pitch → Y inviolabile.** `Y = 1 - pitch/127`. Grave in basso, acuto in alto.
2. **Campo, non eventi.** Nessun oggetto spawn/destroy. Il campo accumula e decade.
3. **Sedimento leggibile.** Le tracce precedenti restano visibili nel campo — palimpsesto.
4. **Legge fisica reale.** Ogni bioma ha una fisica derivata dalla partitura musicale reale, non da esigenze estetiche generiche.
5. **Il silenzio è visibile.** Un campo vuoto non è un errore — è un evento compositive.

---

## Componente 1: Infrastruttura — Campo Materiale 32×32

### Struttura

```js
const field = new Float32Array(32 * 32);  // valori 0.0–1.0
```

Ogni cella = 1/32 del canvas in X, 1/32 in Y.
La cella (0,0) è in alto-sinistra. Y=0 = acuto. Y=1 = grave.

### Operazioni per frame

1. **Decay:** `field[i] *= decayRate` (per bioma, vedi fisica)
2. **Deposit:** eventi MIDI scrivono forza nelle celle secondo la loro fisica
3. **Shimmer anti-scacchiera:** ogni cella riceve ±0.05 random — rompe la griglia senza blur
4. **Render:** `fillBayer(cell)` per ogni cella — densità → pattern halftone

### Sedimento condiviso

`_sharedSediment: Float32Array(32*32)` — accumula durante track change a `decayRate 0.9999`.
In RITORNO diventa visibile come memoria di tutto il concerto.

### Layer coesistenza (approccio ibrido per bioma)

- **Campo puro** (no oggetti): NEBBIA, RESPIRO, RITORNO
- **Campo + eventi riconoscibili**: TESSUTO, SOLCO, MACCHINA, TEMPESTA

I 4 layer canonici (BG/MG/FG/OVERLAY) di `layers.js` esistono già — le comp-* devono iniziare a scriverci sopra invece che su `ctx` direttamente.

---

## Componente 2: Pilota (Camera)

### Approccio C: zone director + drift verso densità massima

Il director3.js definisce per ogni traccia/fase una **zona di interesse** (focusZone: {x, y, w, h}).
La camera deriva lentamente verso il punto di massima densità del campo *all'interno di quella zona*.

```js
// world-state.js — già esiste:
worldState.camera = { mode, drift, focusPoint: [0.5, 0.5] }

// director3.js — DA AGGIUNGERE:
worldState.camera.focusZone = { x: 0.0, y: 0.30, w: 1.0, h: 0.25 }  // per NEBBIA
```

La camera NON salta — deriva. Velocità massima: 0.002 unità/frame.

### Comportamento per traccia (da biomi-fisica)

| Traccia   | focusZone (Y) | Zoom | Note |
|-----------|--------------|------|------|
| NEBBIA    | 0.30–0.50    | 0.9× | deriva solo quando la voice suona |
| TESSUTO   | 0.35–0.55    | 1.0× | drift orizzontale lentissimo |
| SOLCO     | 0.65–0.85    | 1.3× | si alza brevemente quando la voice appare |
| RESPIRO   | 0.30–0.50    | 1.0× | immobile quando il lead non risponde |
| MACCHINA  | germoglio: angolo BL → densita: zona arp | 1.5× | |
| TEMPESTA  | mobile, non si stabilizza | 1.8× | agitata |
| RITORNO   | centro, zoom-out 1.0→0.6 progressivo | fading | immobile in dissoluzione |

---

## Componente 3: Mondo — Fisica per bioma

Derivata dal codice musicale reale (tracks.js, bass-v3.js, melody-v3.js, rhythm.js).
**Non da intuizioni estetiche.**

---

### NEBBIA — C lydian · no BPM · 4.8 min

**Legge fisica:** gocce in alto — niente in basso.

**Canali attivi:**
- `VOICE CH5` — PROTAGONISTA. Punto 1×1 a Y=1-pitch/127 (range 0.34–0.47). Forza 0.55. DecayRate 0.993 (~20-30 sec visibili). Fuoco ogni 11 step (primo), poi 7 (primo) — mai sulla griglia 4/4.
- `LEAD CH6` — ECO. Appare 200-500ms dopo la voice. Stessa Y ±1 cella. Forza 0.35. Il 60% risponde, 40% no — silenzio intenzionale.
- `CHORD CH4` — VELATURA. 3 note → 3 blob r=2, forza 0.12, vel≤50. Cambio ogni 16 bar. Quasi invisibile.
- `DRONE CH2` — CARTA. Density 0.02 uniforme su tutto il campo. DecayRate 0.9999. È il materiale, non un evento.
- KICK, BASS, ARP: **assenti**.

**Immagine:** acqua su carta asciutta — gocce in alto, niente terreno.

---

### TESSUTO — D aeolian · 86 BPM · 5.6 min

**Legge fisica:** il motore ritmico sono gli accordi staccati, non il kick.

**Canali attivi:**
- `CHORD CH4` — MOTORE. chordGrid=[1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1]. Ogni hit: 3 bande orizzontali simultanee (una per nota), larghezza 32 celle, h=1. Forza 0.65. DecayRate 0.980 (~5 sec). Le bande sono sincopate — emergono dai gap, non dal beat.
- `LEAD CH6` — SOLISTA. Voice assente in TESSUTO. Lead: punto a Y=pitch (62–79 → Y 0.38–0.51), h=2. Forza 0.75.
- `KICK CH0` — ACCIDENTE. Solo step 7 (offbeat). Non forza additiva: **sottrae** densità in colonna w=2, h=32. Lo strappo.
- `BASS CH3` — ORDITO. Banda orizzontale intera a Y=1-rootNote/127. Forza 0.20, decayRate 0.995. Quasi permanente.
- ARP: **assente**.

**Immagine:** tre fili tirati insieme — il telaio che lavora.

---

### SOLCO — G dorian · 129 BPM · 6 min

**Legge fisica:** kick e bass NON si sovrappongono — si alternano. È il dub.

**Canali attivi:**
- `KICK CH0` — PROTAGONISTA. Riga orizzontale intera a Y=0.70 (terrain fisso). Forza 0.80. Decade in 4-5 frame. kickGrid groovato (step 0,3,7,13 circa).
- `BASS CH3` — DUB COMPLEMENTARE. bassGrid complementare al kick. MIDI [24-43] → Y [0.66-0.81]. Blob w=5, h=3. Forza 0.75. DecayRate 0.988. Suona *nelle pause* del kick.
- `ARP CH7` — POLVERE. Punti 1×1 a Y=pitch (60–84 → Y 0.34–0.53). Forza 0.25. Decade 18 frame. Cade verso il terrain a 0.05 celle/frame.
- `CHORD CH4` — SEDIMENTO. Banda h=1 che scende di 0.1 cella/frame (gravità lenta). Forza 0.40.
- `VOICE CH5` — RARISSIMA. 1 frase ogni 4 bar. Banda h=1, larghezza metà canvas. Non cade. Sposta la camera verso l'alto per 2 secondi.
- LEAD: **assente**.

**Immagine:** il groove è nello spazio tra le note, non nelle note stesse.

---

### RESPIRO — C ionian · no BPM · 2.7 min (il più breve)

**Legge fisica:** il bioma più rarefatto — maxDensity=0.10.

**Canali attivi:**
- `VOICE CH5` — SOLA. Punto 1×1 a Y=pitch (67–84 → Y 0.34–0.47). Forza 0.50. DecayRate 0.992. Frasi 5-8 note — più lunghe di NEBBIA.
- `LEAD CH6` — ECO (35%). Compare 200-500ms dopo. Forza 0.30. Nel 65% dei casi: silenzio. Il campo rimane con solo il punto della voice che sfuma.
- `CHORD CH4` — ARIA. 3 blob r=2, forza 0.12, vel≤55. Quasi invisibili.
- `BASS CH3` — RISONANZA LONTANA. Rarissimo. [36-48] → Y [0.62-0.72]. Blob r=3, forza 0.20. Quando appare: unico elemento nel territorio inferiore.
- KICK, ARP: **assenti**.

**Immagine:** la voce che aspetta — e a volte nessuno risponde.

---

### MACCHINA — D dorian · 129 BPM · 6 min

**Legge fisica:** l'arp a 16th note è il protagonista. Il germoglio inizia con solo l'arp.

**Canali attivi:**
- `ARP CH7` — PROTAGONISTA ASSOLUTO. 16th note = ~8.6 eventi/sec. Ogni nota: 1×1 a Y=pitch (62–81 → Y 0.36–0.51). Forza 0.60. DecayRate 0.970 (~2 sec). In germoglio: solo l'arp — boot sequence sinistra→destra.
- `BASS CH3` — PUMP ROLLING. rolling=[7,7,5,7,3,5,7,3], ogni 2 step. Ogni nota = X diversa (X=pitch/127×32). H=intera colonna. Forza 0.55. Pattern di colonne verticali che si accendono a ritmo.
- `KICK CH0` — CLOCK. Riga a Y=0.75 con forza 0.70. Quasi 4/4 + push step 15.
- `VOICE CH5` — ANOMALIA UMANA. 1 frase ogni 8 bar. Blob r=2 (vs 1×1 dell'arp) — visibilmente diverso. Stesso Y ma con alone.
- `CHORD CH4` — FRAME. 3 righe h=2, forza 0.35. Struttura sotto il flusso arp.
- LEAD: risposta breve, subordinata.

**Immagine:** boot sequence — testo che appare sul terminale.

---

### TEMPESTA — E phrygian · 129 BPM · 6.2 min (picco più lungo — 96 bar in densità)

**Legge fisica:** voice e lead in hocket — una sola linea melodica in due corpi.

**Canali attivi:**
- `VOICE CH5 + LEAD CH6` — SCIA UNICA BIFORCATA. Hocket: si alternano su ogni nota. Stessa Y=pitch (64–81 → Y 0.36–0.50). Non due oggetti: una scia continua che alterna due colori. Forza 0.70 ciascuno. DecayRate 0.975. In densità: ininterrotta.
- `BASS CH3` — AGGRESSIVO. Pattern [7,0,0,5,0,3,0,0,7,0,5,0,3,0,0,7]. [28–47] → Y [0.63–0.78]. Blob w=4, h=3. Forza 0.80. Quasi ogni beat — non lascia spazio.
- `KICK CH0` — 4/4 + ANOMALIA. Step 15 offbeat crea push irregolare. Forza 0.85.
- `ARP CH7` — SUBSTRATO. vel×0.4 — quasi invisibile. Non compete con l'hocket.
- `CHORD CH4` — ciclo 8 bar fast.

**E phrygian: bII = F — tensione irrisolvibile contro E.**

**Immagine:** filo di ferro spezzato che vibra — una sola voce in due corpi.

---

### RITORNO — A aeolian · 86 BPM · 6 min (dissoluzione 134 sec)

**Legge fisica:** la camera si allontana. Il campo mostra la memoria di tutto il concerto.

**Canali attivi:**
- `VOICE CH5` — SOLA ESPOSTA. Frasi 6-10 note (le più lunghe del concerto). Y=pitch (64–81). Forza 0.55, DecayRate 0.992. La frase lascia traccia leggibile mentre viene suonata.
- `LEAD CH6` — ECO (35%). Come RESPIRO: silenzio visibile nel 65%.
- `ARP CH7` — MUORE. Presente in germoglio. In pulsazione: velocity ×0.5/bar. In densità: sparisce.
- `KICK CH0` — RAREFATTO. Solo beat 0 e 8 (ogni 2 bar).
- `BASS CH3` — FADING. [0,0,0,0,0,7,0,0,0,0,0,0,5,0,0,0] — sparissimo.
- `SEDIMENT` — MEMORIA. Il campo mostra il palimpsesto accumulato. Il sediment sage di RESPIRO, il terrain orange di SOLCO, il flusso lime di TESSUTO — tutti sotto la voice lavanda.

**A aeolian chiude il cerchio con NEBBIA (stesso root).**

**Camera:** zoom-out lento 1.0→0.6. In dissoluzione: immobile al centro.

**Immagine:** il campo non è vuoto — è pieno di memoria.

---

## Fasi di implementazione

### Fase 1: Infrastruttura (prerequisito per tutto il resto)

1. `field.js` — `Float32Array(32*32)` + decay per frame + shimmer ±0.05
2. `field.js` — `depositForce(x, y, shape, force)` — API unica per tutte le comp-*
3. `field.js` — `renderBayer(canvas)` — da campo → halftone
4. `world-state.js` — nessuna modifica (campo già previsto)
5. `director3.js` — aggiungere scrittura di `worldState.camera.focusZone` per traccia

### Fase 2: Mondo biomi (ordine: NEBBIA → MACCHINA → SOLCO → TESSUTO → RESPIRO)

Per ogni bioma: comp-*.js riscritta per usare `depositForce` invece di spawn-oggetti.
TEMPESTA e RITORNO per ultimi (dipendono dagli altri).

### Fase 3: Pilota (camera narrativa)

Dopo che i biomi producono output leggibili: camera system completo con drift verso densità + rupture color flood.

---

## Sistema Palette

### Architettura: densità pura + colore a render time

Il campo non porta colori. Ogni ruolo ha il suo `Float32Array(32×32)`.
Il colore viene assegnato a render time, per ruolo, con blend mode specifico.

```js
// render per ogni ruolo in Z-order (grave → medio → acuto):
ctx.globalCompositeOperation = role.blend;
renderBayerField(ctx, fields[role.name], role.color);
// al termine:
ctx.globalCompositeOperation = 'source-over';
```

La **contaminazione** emerge dalla sovrapposizione additiva (`screen`): dove due ruoli occupano lo stesso punto del campo, i loro colori si mescolano fisicamente. Zero codice di mixing manuale.

### Blend mode per ruolo

- Default: `'screen'` — additive, colori si schiariscono e mescolano
- Eccezione: kick-strappo in TESSUTO → `'destination-out'` — toglie densità invece di aggiungere colore

### Z-order di rendering

grave → medio → acuto. La voice/lead emergono visivamente sopra il terrain — coerente con pitch→Y.

### Struttura in config.js

```js
CFG.VISUAL.roleColors = {
  NEBBIA:   { voice: { color: '...', blend: 'screen' }, lead: { color: '...', blend: 'screen' }, ... },
  TESSUTO:  { chord: { color: '...', blend: 'screen' }, kick: { color: '...', blend: 'destination-out' }, ... },
  // ...
}
```

### Arco cromatico — principio

Le palette attuali erano brutte perché isolate: ogni bioma aveva i suoi colori senza relazione con gli altri, e senza pensare alle interazioni `screen`.

L'arco da progettare (valori da definire in sessione dedicata):

| Bioma | Carattere cromatico | Note |
|-------|--------------------|----|
| NEBBIA | **monocromo** — due temperature di bianco | voice warm (~3200K), lead cool (~5500K) — eco percepibile solo come differenza di temperatura |
| TESSUTO | **primo colore reale** — lime su scuro | il colore entra; il kick-strappo lo taglia |
| SOLCO | **caldo** — arancio + ambra alternati | kick terra bruciata, bass dub ambra — il groove è cromatico |
| RESPIRO | **inversione** — fondo chiaro, segni scuri | l'unico bioma con bg chiaro (sage); figura/sfondo invertiti |
| MACCHINA | **freddo/sintetico** — giallo + cyan | screen di arp (giallo) + bass (cyan) → verde neon meccanico dove si sovrappongono |
| TEMPESTA | **massima saturazione** — bianco + rosso | hocket: voice bianco, lead rosso; screen → sovraeposizione quasi overexposed |
| RITORNO | **memoria** — lavanda che porta tutto | i sedimenti precedenti come fantasmi cromatici sotto la voice lavanda |

**Regola dell'arco:** monocromo → primo colore → calore → inversione → freddo sintetico → saturazione massima → dissoluzione. Non lineare — RESPIRO è deliberatamente fuori sequenza per creare contrasto.

**I valori hex vanno progettati pensando al risultato screen-blended, non ai singoli colori isolati.** Da fare in sessione visiva dedicata con prototipo HTML standalone.

---

## Anti-pattern da evitare

- **Spawn/destroy**: vietato. Nessun `entities.push()` per note MIDI.
- **Blur**: vietato. Shimmer ±0.05 random al posto del blur — organico, non morbido.
- **Loop sincroni**: VOICE/LEAD devono mantenere il delay off-grid (200-500ms real time, non next tick).
- **Valori hard-coded**: tutti i parametri fisici in `config.js`.
- **Riscritture monolitiche**: un bioma alla volta, prototipi HTML standalone prima di integrare.

---

## Riferimenti

- `biomi-fisica-v2.html` — documento HTML con la fisica completa per bioma
- `overview.html` — stato sistema, gap identificati, 3 componenti
- `ispirazioni-machne/visione-totale.md` — il perché di tutto il resto
- `src/tracks.js` — partitura completa (618 LOC)
- `src/field.js` — dispatcher attuale (da modificare)
- `src/world-state.js` — `camera.focusPoint` già esiste, non viene scritto
