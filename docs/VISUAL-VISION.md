# VISUAL VISION — MACH:INE III
> Documento di riferimento visivo. Sintesi della sessione 2026-04-09.
> Questo è il punto di partenza per tutto il lavoro visivo futuro.
> Sostituisce le note sparse in STATUS.md P4c/d/e e ARTISTIC-GAPS visivo.

---

## 1. La tesi

Il campo visivo non rappresenta la musica. **È il residuo fisico della musica** — come la materia è il residuo di energia.

Come le figure di Chladni: il campo non reagisce al suono, *porta le tracce fisiche* di ogni evento sonoro. Il campo a 55 minuti è geologia. Strati.

---

## 2. Il gap v2 → v3 (diagnosi precisa)

### Cosa v2 aveva che v3 ha perso

| Elemento | v2 | v3 attuale |
|---|---|---|
| **Dot-size** | Dinamico: newborn=2px, fossil=14px | Quasi fisso per comp |
| **Primitivi strutturali** | BANDA/VETTORE/BLOCCO/VUOTO/FRONTE/SCIAME/STRISCIA/MATRICE | Non implementati come vocabolario |
| **Composizione spaziale** | Mondrian: tensioni, pesi, vuoti intenzionali | Forme che galleggiano ai bordi |
| **Scaffold** | Gradiente spaziale, non uniforme | Uniforme = tappezzeria |
| **MIDI come protagonista** | Ogni canale è un primitivo visivo | Ogni canale triggera effetti sopra la scena |
| **Camera** | Esplora il campo (WIDE/MEDIUM/MACRO/DRIFT) | Infrastruttura esiste, mai guidata da director3 |
| **Generazioni stratificate** | Accumulo visibile nel tempo | Sediment c'è ma comp-* non consumano lifecycle |

### Il vero problema di comp-solco (sessione 2026-04-08)

- ANCHORS ai bordi del canvas → forme sempre agli angoli estremi
- Forme troppo piccole (20%×11%) → nessun peso compositivo
- Scaffold uniforme → nessuna zona attiva vs vuota
- Drift indipendente → le due forme non hanno mai dialogo compositivo

### Cosa v3 ha che funziona e NON si tocca

- `director3.js` + 5 moduli musicali
- Layer stack BG/MG/FG/OVERLAY (`layers.js`)
- Rupture 4 stadi smooth (`world-state.js`, `director3.js`)
- `event-register.js` con lifecycle newborn→stable→ghost→fossil
- `trackPalettes` 5 ruoli (`colors.js`)
- `firma.js` (gelo/convergenza/vuotoTotale)
- Sediment/memory system (`field.js`)

---

## 3. La visione: il pianeta

Un singolo mondo vivo che dura 60 minuti. Le 7 tracce sono **7 biomi** di questo mondo con fisica radicalmente diversa. La camera è l'occhio che lo esplora.

La camera può:
- Essere immersa in un bioma (zoom 1.0 — visione normale)
- Zoomare in macro (zoom 3-5×) — grana Bayer visibile, singoli eventi leggibili
- Zoomare in microscopia (zoom 8+) — le cellule Bayer diventano caratteri ASCII
- Zoomare out in orbita (zoom 0.1-0.2, RITORNO) — il pianeta intero visibile

**Il momento chiave**: a 55 minuti RITORNO zooma out. Il pubblico vede per la prima volta il pianeta intero — la geografia dei 55 minuti di musica come geologia fisica.

---

## 4. I 7 biomi — fisica + primitivi + MIDI

### Regola universale del lifecycle (si applica in tutti i biomi)

```
t = event.age / event.maxAge   (0 → 1)
dotSize  = lerp(2, 14, t²)     // newborn=2px preciso → fossil=14px grana grossa
density  = lerp(0.90, 0.05, t²) // decade con l'età
colorLerp = lerp(spawnColor, residualColor, t)  // sfuma verso memoria
```

Questo da solo recupera il 70% dell'estetica v2.

---

### NEBBIA — Nebulosa
**Fisica**: centrifuga. Nessun su/giù. Ogni evento nasce da un punto e si disperde radialmente verso l'esterno. Gravità = zero.
**Primitivi v2**: SCIAME + VUOTO
**MIDI protagonisti**:
- CH5 voice/gocce: ogni nota = nebulosa che si espande (200-400 dot 2px)
- CH2 drone: struttura permanente — "stelle formate" che non si disperdono
- CH6 lead: scie brevi che attraversano le nebulose
**Immagine**: Pillars of Creation. 90% vuoto nero. La scarsità è la legge.
**Rupture**: le nebulose si moltiplicano fino a coprire tutto il campo — antitesi del principio.
**Colori**: #0A0A0A bg, #EFE6DE cream dots, #9B8FCE lavanda per drone

---

### TESSUTO — Fibra biologica
**Fisica**: tensione orizzontale. Il pitch MIDI determina la Y della fibra. Le fibre non si muovono verticalmente — si contraggono/distendono orizzontalmente con velocity.
**Primitivi v2**: STRISCIA + FRONTE
**MIDI protagonisti**:
- CH4 chord: 3-5 fibre orizzontali, Y = pitch MIDI, density = velocity
- CH6 lead: fibra luminosa indipendente che scivola verticalmente
- CH2 drone: fibra sottilissima quasi statica in basso
- CH1 perc: addensamenti che attraversano le fibre come onde
**Immagine**: tessuto muscolare al microscopio — fasci che battono in sincrono.
**Rupture**: le fibre rompono la orizzontalità, diventano diagonali caotiche.
**Colori**: #20130D bg, #CDD71D lime dots, #EFE6DE cream accent

---

### SOLCO — Impatto geologico
**Fisica**: gravità estrema verso il basso (10×). Gli eventi cadono veloci e si SPIACCICANO sul terrain (Y>0.75). Il kick aggiunge shockwave. La metà alta è quasi vuota (eventi in caduta). La metà bassa è strati geologici compressi.
**Primitivi v2**: BLOCCO + FRONTE
**MIDI protagonisti**:
- CH0 kick: shockwave sul terrain — compressione istantanea + rebounce
- CH3 bass: controlla la MASSA dei blocchi in caduta (dimensione)
- CH4 chord: blocchi secondari più leggeri, colore lime
- CH7 arp: particelle piccole che orbitano nel gap tra i blocchi prima di cadere
**Immagine**: Grand Canyon in sezione. La superficie del terrain è il presente, la profondità è storia.
**Composizione**: 2 zone di massa asimmetriche (proporzionate 3:1), posizionate con tensione. NON agli angoli.
**Rupture**: le proporzioni si rompono — la massa grande si frammenta in tre. L'equilibrio compositivo violato.
**Colori**: #282B26 bg, #FE6B0D orange, #CDD71D lime

---

### RESPIRO — Membrana cellulare
**Fisica**: pressione di campo. Il bioma è sempre a densità alta (0.75). Le note creano pori (zone density 0.0) che si richiudono per tensione superficiale. Il silenzio = pienezza. La musica = assenza.
**Primitivi v2**: VUOTO (invertito)
**MIDI protagonisti**:
- CH5 voice: ogni nota = poro circolare che si apre e si richiude
- CH6 lead echo: pori più piccoli, ritardati, posizione spostata
- CH3 bass: pori in fase densità (larghi, lenti a chiudersi)
**Immagine**: bolla di sapone vista dall'interno — pareti Bayer, la musica è gli aghi che bucano.
**Rupture**: i pori non si richiudono. Il campo si svuota. Inversione totale.
**Colori**: #7BBA91 sage bg, #1A1A1A quasi-nero dot

---

### MACCHINA — Circuito
**Fisica**: NESSUNA. Questa è la scelta radicale. Zero drift, zero inertia, zero gradiente. Tutto snap a griglia. La griglia è SEMPRE VISIBILE (densità 0.05 anche in silenzio).
**Primitivi v2**: MATRICE + BANDA
**MIDI protagonisti**:
- CH7 arp: illumina celle in sequenza — il pattern è leggibile come partitura visiva
- CH0 kick: riga intera lampeggia
- CH3 bass: colonna intera dalla base
- CH5/CH6: dot accent sparsi
**Immagine**: scheda madre durante l'avvio. A zoom 3×: i nodi diventano caratteri ASCII. Il pattern arp si legge come testo.
**Rupture**: il binario si corrompe — le celle perdono definizione, densità diventa 0.5 invece di 0/1. L'informazione si corrode come dati su disco malato.
**Colori**: #1A1A2E navy bg, #F8ED00 giallo, #DD3A44 pink accent

---

### TEMPESTA — Campo magnetico solare
**Fisica**: impulsi direzionali violenti che cambiano ogni 3-12 frame. Tre livelli di suscettibilità: CH2 drone (quasi immune, deriva lentissima = linee di campo stabili), CH4/CH3 (suscettibili, scie medio-lunghe), CH7 arp/CH5 voice (completamente in balia, traiettorie caotiche).
**Primitivi v2**: VETTORE + STRISCIA
**MIDI protagonisti**:
- CH2 drone: linee di forza stabili che gli altri eventi evitano/seguono
- CH7 arp: particelle caotiche, brevi, ultra-rapide
- CH5 voice: scie medio-veloci che seguono le linee di forza
- CH1 perc: flash/scintille tra i piani
**Immagine**: aurora boreale vista dall'alto, resa in bianco/nero/carmine.
**Rupture**: i tre livelli di velocità convergono. Il campo si comprime. Un singolo evento enorme attraversa lo schermo.
**Colori**: #000000 bg, #FFFFFF white, #91010F carmine accent

---

### RITORNO — Orbita
**Non è un bioma. È una posizione della camera.**
La camera lascia la superficie del pianeta e sale in orbita. Vede i 6 biomi sotto come continenti con colori, densità, storia accumulata.
- Distorsione barrel applicata al composite (effetto curvatura superficie sferica)
- Camera orbita lentamente (circular drift)
- Le note di RITORNO appaiono come scintille 2px ovunque sul pianeta
- Il sediment di tutti i biomi è visibile nella sua interezza — geologia di 55 minuti
**Colori**: tutti i biomi visibili simultaneamente — il colore è la mappa geografica.

---

## 5. La curva aging (implementazione)

Questa è LA cosa più urgente. Da aggiungere a tutte le comp-* prima di qualsiasi altra modifica:

```javascript
// In ogni comp-*, al render di ogni evento da event-register:
import { getEvents } from './event-register.js';

for (const ev of getEvents()) {
  const t = ev.age / ev.maxAge;           // 0 (newborn) → 1 (fossil)
  const dotSz   = Math.round(lerp(2, 14, t * t));
  const density = lerp(0.90, 0.05, t * t);
  const col     = lerpColor(ev.spawnColor, palette.residual, t * 0.7);
  // disegna con fillBayer(ctx, px, py, dotSz*3, dotSz*3, density, dotSz, col)
}
```

---

## 6. Il processo: prototipo prima del codice

**Il fallimento ricorrente**: si pianifica → si implementa nel sistema principale → delusione → stanchezza → si riparte.

**Il processo corretto**:
```
SPECIFICA (numeri reali, posizioni pixel)
    ↓
PROTOTIPO HTML standalone (fake MIDI, niente audio, ~100-200 righe)
    ↓
TEST visivo (30 secondi per capire se funziona)
    ↓  ↑ iterazione qui, non nel sistema principale
VALIDA
    ↓
INTEGRA (meccanico, veloce)
```

Esiste `app/proto-solco.html` come primo tentativo (composizione non ancora soddisfacente — da iterare).

---

## 7. Prossimi passi concreti

### Priorità immediata: sbloccare SOLCO visivo

1. **Feedback sul proto-solco.html**: cosa non va (forma, colore, movimento, carattere)
2. **Revisione posizioni**: le forme devono avere tensione compositiva reale — non angoli, non simmetria
3. **Aggiungere più vita**: il proto attuale è troppo statico. Serve più colore, più organicità
4. **Iterare sul prototipo** finché la risposta è "sì, questa è la direzione" — poi integrare

### Dopo SOLCO: un bioma per sessione

Ogni sessione: un prototipo + validazione + integrazione.
Ordine suggerito: SOLCO → MACCHINA (più semplice, griglia) → TESSUTO → NEBBIA → RESPIRO → TEMPESTA → RITORNO (ultimo, dipende da tutto)

### Camera e ASCII (dopo i biomi)

Implementare il camera system (`camera.js`) e l'ASCII depth pass solo dopo che almeno 3 biomi sono validati visivamente. L'infrastruttura camera esiste già in `world-state.js`.

---

## 8. Riferimenti artistici per bioma

| Bioma | Riferimento principale | Carattere |
|---|---|---|
| NEBBIA | Hubble Deep Field / Sugimoto | Cosmica, scarsità come legge |
| TESSUTO | Agnes Martin / Fiber microscopy | Meditativa, tensione orizzontale |
| SOLCO | Malevich Suprematismo / Grand Canyon | Peso, impatto, geologia |
| RESPIRO | Kenya Hara Ma / Membrane biology | Inversione, pressione |
| MACCHINA | Ryoji Ikeda / Bauhaus | Informazionale, griglia come verità |
| TEMPESTA | Moholy-Nagy / Aurora boreale | Caos strutturato, forza |
| RITORNO | Pale Blue Dot / Sugimoto theaters | Totalità, memoria compressa |

---
<!-- knowledge-graph links -->
[[03-VISUAL]] [[01-ARCHITECTURE]] [[07-ARTISTIC-GAPS]] [[STATUS]]
