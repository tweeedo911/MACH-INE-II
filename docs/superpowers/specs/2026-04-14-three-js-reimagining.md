# MACH:INE → Three.js — Analisi e piano d'azione

> Documento di analisi per la reimaginazione del sistema visivo in Three.js.
> NON un port. NON generico 3D. Il motore 3D al servizio dell'identità MACH:INE.

---

## 1. Diagnosi: perché i prototipi non funzionano

I prototipi proto-nebbia-3d e proto-solco-3d falliscono per lo stesso motivo:
**tentano di tradurre il campo materiale in "particelle 3D" perdendo tutto ciò che rende MACH:INE riconoscibile.**

Cosa si perde:
- Il **Bayer dithering** come linguaggio (non filtro) — il vocabolario di 17 densità
- La **griglia** come struttura visibile — 96×54 celle dove ogni cella CONTA
- La **persistenza del campo** — Float32Array dove il tempo si accumula
- Lo **screen blend** — la sovrapposizione additiva di strati che crea profondità senza 3D
- L'**aging come grana** — fossili grossi, neonati fini
- Il **vuoto come materia attiva** — il nero non è sfondo, è il campo a densità zero

Cosa si guadagna di sbagliato:
- Particelle che si muovono nello spazio → visualizer generico
- Bloom/glow → estetica da club
- DOF/fog → effetto fotografico che diluisce la matericità
- Cubetti/mesh → peso geometrico che non c'entra col Bayer

**Il problema non è Three.js. È usare Three.js per fare cose che Three.js fa di default.**

---

## 2. Punti di forza del sistema attuale (da preservare)

### 2.1 Il campo come residuo fisico
La tesi fondante: "il campo non rappresenta la musica, è il residuo fisico della musica."
Questo NON si traduce in "particelle che si muovono". Si traduce in:
**materia che si deposita, si accumula, decade, e forma geologia leggibile.**

### 2.2 Il Bayer come linguaggio
Il dithering 4×4 crea un vocabolario di 17 livelli di densità. Come l'halftone
di Lichtenstein: non è un filtro, è il soggetto. La griglia è il tessuto del mondo.
Referenze: Carsten Nicolai/Alva Noto (bianco/nero binario, errore come musica),
Zimoun (il materiale grezzo È il risultato, nessun post-processing).

### 2.3 La persistenza temporale
Float32Array per ruolo dove ogni deposito lascia traccia. Il decay differenziato
(kick 0.600 = istantaneo, drone 0.9999 = quasi permanente) crea stratificazione
di Eno ("77 Million Paintings" — strati a lifetime diversi).

### 2.4 L'aging come crescita della grana
newborn=2px preciso → fossil=14px grezzo. Il tempo è leggibile dalla dimensione
del punto. Referenza: Basinski "Disintegration Loops" — la degradazione è la musica.

### 2.5 I 7 biomi come fisiche diverse dello stesso materiale
Non 7 "scene" diverse ma 7 leggi fisiche diverse nello stesso mondo:
gravità (SOLCO), tensione (TESSUTO), pressione (RESPIRO), binario (MACCHINA).
Il materiale è lo stesso — cambia come reagisce.

### 2.6 La camera come osservatore biologico
Il modello attenzione/curiosità/respiro in camera.js è già Malickiano.
POI detection, alertness, wanderlust. Non cinematografia programmata
ma esplorazione autonoma.

---

## 3. Cosa Three.js PUÒ aggiungere senza tradire l'identità

### 3.1 LA PROFONDITÀ Z COME TEMPO (il guadagno fondamentale)

Oggi il campo è piatto. L'aging è colore + dimensione. Con Three.js:
**l'aging diventa migrazione in Z**. I depositi freschi sono in superficie (vicini
alla camera), i fossili affondano. La geologia di 55 minuti non è colore —
è STRATI FISICI leggibili dalla camera quando guarda "di taglio".

Questo è il VERO valore aggiunto del 3D. Non effetti, non prospettiva:
**il tempo diventa una dimensione spaziale.**

### 3.2 L'OCCLUSIONE COME DENSITÀ

In 2D la densità è un valore per cella. In 3D la densità è **quante particelle
attraversi per vedere il fondo**. Zone dense occludono quelle dietro.
Zone sparse lasciano intravedere la profondità. Stessa informazione,
risultato visivo più ricco — senza effetti.

Referenza: Matt DesLauriers (mattdesl) — usa il 3D solo per calcolare
l'occlusione, poi rende tutto con la qualità della stampa calcografica.

### 3.3 LA PARALLASSE COME GEOLOGIA

Ogni movimento di camera crea parallasse tra strati a profondità diversa.
Il drone (profondo) scorre lentamente, la voice (superficie) rapidamente.
La stratificazione diventa LEGGIBILE dal movimento, come guardare un
campione geologico ruotandolo.

### 3.4 IL CAMPO RESTA UNA GRIGLIA

NON particelle libere nello spazio. Il campo resta 96×54 (o simile).
Ogni cella della griglia ha profondità Z in base all'età dei depositi.
Il Bayer dithering viene applicato come shader sulla faccia visibile.
La griglia è il mondo — il 3D ne rivela lo spessore.

---

## 4. L'approccio corretto: il campo come bassorilievo

### 4.1 Metafora

Immagina il campo 96×54 non come un'immagine piatta ma come una
**lastra di bronzo in bassorilievo**. Ogni deposito solleva la superficie.
I fossili sono rilievi antichi, levigati. I depositi freschi sono
incisioni nette. La camera può guardare:
- **frontale** → vede la densità come colore (come ora)
- **radente** → vede il rilievo, la topografia del tempo
- **di taglio** → vede gli strati, la geologia pura

### 4.2 Implementazione tecnica

```
Una PlaneGeometry 96×54 segmenti (o InstancedMesh di 5184 blocchi).
Ogni cella ha:
  - altezza Y = f(depositi cumulativi, densità attuale, età)
  - colore = palette bioma × aging × phase
  - dimensione XZ = lerp(piccolo, grande, età²)  [la curva aging]
  - dithering = shader Bayer sulla faccia superiore

Il campo Float32Array alimenta la geometria ogni frame.
Il Bayer è un fragment shader, non un overlay.
```

### 4.3 I ruoli come strati a profondità diverse

```
Z (profondità)
│
│  voice/lead     ← superficie, freschi, luminosi, piccoli
│  chord/arp      ← strato intermedio
│  kick           ← flash che attraversa tutti gli strati
│  bass           ← strato profondo, grosso, persistente  
│  drone          ← substrato, quasi invisibile, quasi permanente
│
└── fondazione geologica (geologia RITORNO)
```

Ogni ruolo è un layer di PlaneGeometry separato.
Screen blend tra layer → stessa estetica additiva di oggi.
Ma con Z reale → la parallasse separa visivamente i ruoli.

---

## 5. Riferimenti artistici azionabili

### Per il campo come bassorilievo
- **Quayola "Strata"**: dipinti classici come point cloud geologici.
  La densità non è scalare ma tensore con pressione interna.
- **Liam Egan "Noise Fields"**: campi di noise come mappe topografiche.
  Multiple soglie Bayer = linee di livello della densità.

### Per il vuoto attivo
- **Hubble Deep Field**: mai nero puro. Rumore termico di fondo
  che dà profondità al vuoto. Implementare: noise 1-2 LSB nel BG.
- **Kenya Hara "Ma"**: il vuoto tra le cose è la cosa stessa.
  RESPIRO già incarna questo. Ogni bioma dovrebbe avere un rapporto
  vuoto/pieno caratteristico.

### Per l'erosione come musica
- **Basinski "Disintegration Loops"**: l'erosione non è fade omogeneo
  ma degradazione irregolare — le zone più sollecitate si erodono per prime.
  Contatore cumulativo → decay posizionale.

### Per la serialità della deposizione
- **Robert Henke "Lumiere"**: la sequenza di deposizione è visibile.
  Un deposito di 20 celle scritto su 3-4 frame rivela il gesto fisico.
  Particolarmente potente per MACCHINA (raster scan) e SOLCO (cascata).

### Per il ritmo spaziale
- **Ryoji Ikeda "data.tron"**: il tempo è lo spazio X. In SOLCO
  l'eco dub è già questo principio. Rendere la mappatura esplicita:
  posizione X dell'eco = delay time × campo_width.

### Per la camera
- **Malick** (wanderlust): 5-10% delle transizioni verso zone vuote
- **Marker "La Jetée"** (freeze): 2-3s di immobilità, solo il campo evolve
- **Brakhage** (saccade): per TEMPESTA/SOLCO, easing rapido → lento
- **Snow "Wavelength"** (monotonia): RITORNO = zoom-out che non si ferma mai

---

## 6. Nuovi elementi narrativi possibili in 3D

### 6.1 La camera può ENTRARE nel campo
Non solo guardare dall'alto o dal davanti. La camera può infilarsi
tra gli strati, vedere il campo dall'interno. In SOLCO: scendere
nella faglia del kick e vedere le pareti di materia arancione.
In NEBBIA: fluttuare tra le nebulose sparse.

### 6.2 RITORNO diventa orbita reale
Il campo curvo su una sfera. La camera si allontana. La geologia
di 55 minuti visibile come continenti. La curvatura è reale,
non simulata con barrel distortion. Il momento chiave del concerto
acquisisce gravità fisica.

### 6.3 Rupture come deformazione topografica
La rupture non cambia solo densità/colore ma DEFORMA la geometria
del campo. Durante takeover il bassorilievo si piega, si crepa,
gli strati si separano. Residuo: il campo torna piano ma porta
le cicatrici.

### 6.4 Gelo come cristallizzazione 3D
Il gelo (firma.js) non solo ferma il tempo ma CONGELA la geometria
a metà deformazione. Il rilievo si blocca in una posizione innaturale.
Quando si sgela, la materia torna a scorrere.

### 6.5 Dissoluzione come erosione fisica
La materia non sbiadisce — si sgretola. I bordi delle zone dense
perdono celle. Le punte del bassorilievo si appiattiscono. Come
roccia sotto la pioggia.

---

## 7. Variabili critiche per il trasporto senza errori

### 7.1 Da preservare IDENTICAMENTE

| Variabile | Valore | Perché |
|-----------|--------|--------|
| Griglia 96×54 | 5184 celle | Ogni cella conta. Non alzare |
| Bayer 4×4 | 17 soglie | IL linguaggio visivo |
| Z-order ruoli | drone→lead | La gerarchia visiva |
| Decay per ruolo | 0.600→0.9999 | La stratificazione temporale |
| Force per ruolo | da tracks.js | Il peso musicale |
| Phase multipliers | germ ×0.35, rott ×1.2 | L'arco narrativo |
| Palette per bioma | da biomi.js | L'identità cromatica |
| Camera: 5 gesti | stare/viaggio/tuffo/sollevare/scansione | La grammatica |
| Camera: 7 personalità | da biomi.js camera config | Il carattere per bioma |
| Rupture 4 stadi | omen/infiltr/takeover/residuo | Mai semplificare |
| Aging: t² easing | size + density + color | Newborn→fossil |
| Screen blend | additivo tra ruoli | L'accumulo di luce |

### 7.2 Da tradurre (2D → 3D)

| Concetto 2D | Traduzione 3D |
|-------------|---------------|
| Float32Array density per cella | Altezza Y del bassorilievo |
| Bayer dithering nell'ImageData | Fragment shader sulla faccia |
| Shimmer (3 sinusoidi) | Vertex displacement sottile |
| Aging luminosità 55→100% | Roughness materiale (fosco→lucido) |
| BPM pulsation ±4% | Scale pulsation sulle celle |
| Bloom voice/lead/kick | Emissive boost (no UnrealBloomPass) |
| Erosione dissoluzione | Vertex displacement → 0 ai bordi |
| Geologia RITORNO (snapshot) | Layer profondo sotto il campo live |
| planetMask circolare | Geometria sferica reale |
| Micro-drift camera | Identico, già in 3D coords |
| Solidificazione (gelo) | Arresto vertex animation |
| Convergenza | Vertex pull verso centro |

### 7.3 NUOVE variabili (solo 3D)

| Variabile | Range | Cosa controlla |
|-----------|-------|----------------|
| reliefHeight | 0.0→2.0 | Altezza max bassorilievo per ruolo |
| viewAngle | 0°→45° | Inclinazione camera (0=frontale, 45=radente) |
| layerSeparation | 0.0→1.0 | Distanza Z tra layer ruolo |
| ruptureDeformation | 0.0→1.0 | Quanto la rupture piega la geometria |
| fossilRoughness | 0.55→1.0 | Quanto il fossile è opaco vs lucido |
| driftZ | 0.001→0.01 | Velocità sedimentazione in Z |

---

## 8. Piano d'azione

### Fase 0 — Prototipo fondante (1 sessione)

**Obiettivo**: validare il concetto di campo-bassorilievo con Bayer shader.
Un solo bioma (SOLCO — il più complesso), standalone.

Implementare:
1. PlaneGeometry 96×54 segmenti con vertex displacement da Float32Array
2. Fragment shader Bayer 4×4 con soglia dalla densità
3. Decay loop identica a campo.js
4. depositFn SOLCO (bass colonne + eco + kick faglia)
5. Camera con 2 angoli: frontale (verifica che il Bayer funzioni) e radente
   (verifica che il rilievo sia leggibile)
6. Fake MIDI su BPM 129

**Criterio di successo**: a schermo pieno, il prototipo deve essere
riconoscibile come MACH:INE. Se sembra "un altro progetto", fallisce.

### Fase 1 — Profondità multi-layer (1 sessione)

Aggiungere i ruoli come layer separati in Z.
Screen blend tra layer via shader.
Parallasse visibile quando la camera si muove.

### Fase 2 — Camera osservatore 3D (1 sessione)

Port del modello camera.js: POI, attenzione, curiosità, micro-drift.
Aggiungere: viewAngle variabile, possibilità di guardare "di taglio".

### Fase 3 — Tutti i biomi (2-3 sessioni)

Port delle 7 fisiche. Ogni depositFn tradotta in vertex displacement.
RESPIRO: campo alto con pori (cavità nel bassorilievo).
MACCHINA: snap a griglia, altezze binarie (su/giù).
NEBBIA: campo quasi piatto, rarissimi rilievi.

### Fase 4 — Narrative (1 sessione)

Rupture come deformazione geometrica.
Firma (gelo/convergenza) in 3D.
Dissoluzione come erosione dei vertici.

### Fase 5 — RITORNO sfera (1 sessione)

Il campo mappato su sfera. Geologia come heightmap su superficie sferica.
Orbita reale. Il momento chiave.

---

## 9. Decisione da prendere

**Il sistema 3D sostituisce il 2D o ci affianca?**

Opzione A: **Sostituzione** — Three.js diventa il renderer unico.
  + Una sola codebase da mantenere
  + Sfrutta tutto il potenziale 3D
  - Rischio: se non funziona, si riparte da zero

Opzione B: **Affiancamento** — campo.js resta, Three.js è una "vista" alternativa.
  + Il sistema 2D continua a funzionare
  + A/B testing in tempo reale
  - Due renderer da mantenere
  - Il 3D non può essere radicale (deve leggere gli stessi dati)

Opzione C: **Campo condiviso, render separati** — il Float32Array è il modello,
  campo.js e three-campo.js sono due viste dello stesso stato.
  + Massima flessibilità
  + Il modello (depositFn, decay, aging) è già testato
  + Il 3D aggiunge solo la visualizzazione
  - Architettura leggermente più complessa

**Raccomandazione: Opzione C.** Il campo Float32Array è il cuore. Il rendering
è una lente. Oggi la lente è Canvas 2D. Domani può essere Three.js.
Le depositFn, il decay, l'aging, la firma — tutto resta invariato.

---

<!-- knowledge-graph links -->
[[VISUAL-VISION]] [[STATUS]] [[DECISIONS]] [[BIOMI-BOZZE]] [[MOOD]]
