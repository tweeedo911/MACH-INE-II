# Campo Materiale — Cablaggio infrastrutturale completo

> Spec approvata il 2026-04-12.
> Obiettivo: portare il campo al massimo espressivo cablando grid corretta,
> lifecycle aging, firma e camera. Il lato musicale viene dopo.

---

## Contesto

Il Campo Materiale (campo.js + biomi.js) e il paradigma visivo definitivo
(DECISIONS #015). 7/7 biomi implementati, 0/7 calibrati live.

Il campo e oggi un'isola: non consuma firma (gelo/convergenza/densityCap),
rupture, camera, layers.js ne event-register.js. Il performer non ha
controllo drammaturgico quando Shift+C e attivo.

Questa spec cablaggio 3 sistemi + 1 fix strutturale:
1. Grid rettangolare (fix stretch)
2. Lifecycle aging (cellPx per ruolo)
3. Firma a 3 strati (solidificazione naturale)
4. Camera (macro/orbita/barrel)

Rupture (4 stadi narrativi) e rinviato a sessione successiva —
l'utente non l'ha mai visto funzionare, meglio prima avere il campo
espressivo e poi aggiungere l'arco automatico.

---

## Approccio

Layer cake (incrementale): le 4 feature si implementano in sequenza,
ciascuna testabile indipendentemente. Step 1-3 in una sessione,
step 4 (camera) in sessione dedicata.

---

## Step 1 — Grid rettangolare (no stretch)

### Problema

campo.js usa `_cells x _cells` (32x32 quadrato), offscreen 640x640,
stirato su canvas 16:9 con `drawImage`. Le celle diventano rettangolari.

### Soluzione

Due variabili `_cellsX = 96` e `_cellsY = 54` (rapporto 16:9 esatto).
`cellPx = 10` per default. Offscreen: 960x540px.

### Modifiche campo.js

- `_cells` diventa `_cellsX` + `_cellsY`
- `idx(cx, cy)` → `cy * _cellsX + cx`
- Float32Array size: `_cellsX * _cellsY` (5184 celle per ruolo)
- `localPitchToCell` usa `_cellsY` per mapping verticale
- Offscreen: `_cellsX * cellPx` x `_cellsY * cellPx`
- `drawImage` fonte e destinazione hanno stesso aspect ratio → zero stretch

### Modifiche biomi.js

- `HELPERS.CELLS` → `HELPERS.CELLS_X` e `HELPERS.CELLS_Y`
- Le depositFn che usano coordinate assolute vanno riscalate
  (la maggior parte usa gia proporzioni relative)

### Performance

5184 celle x 8 ruoli = 41.472 iterazioni decay/frame. Trascurabile.
Render: stessa area pixel totale (960x540 vs 640x640), costo simile.

### Invarianti

Bayer 4x4, Z-order, screen blend, struttura biomi — tutto invariato.

---

## Step 2 — Lifecycle aging (cellPx variabile per ruolo)

### Problema

Tutti i ruoli renderizzano con cellPx=10 e Bayer 4x4.
A densita alta = tappezzeria monotona (feedback confermato).

### Soluzione

Ogni bioma dichiara `cellPx` per ruolo. Il render fa un pass per ruolo
con il suo cellPx. La sovrapposizione di grane diverse rompe la monotonia.

### Default cellPx per ruolo

| Ruolo       | cellPx | Effetto                         |
|-------------|--------|----------------------------------|
| drone       | 16     | grana grossa, geologica          |
| bass        | 14     | grana medio-grossa, peso         |
| chord       | 10     | grana media, tessuto             |
| kick        | 8      | grana fine, impulso netto        |
| percussion  | 8      | grana fine, scintille            |
| arp         | 6      | grana finissima, particelle      |
| voice       | 8      | grana fine, precisa              |
| lead        | 7      | grana fine, scie sottili         |

### Render multi-pass

Il campo logico resta 96x54 Float32Array. Solo la resa pixel cambia:

```
per ogni ruolo in ZORDER:
  cpx = bioma.cellPx[ruolo] ?? defaults[ruolo]
  per ogni cella (cx, cy) con density > 0.003:
    // posizione proporzionale sull'offscreen
    baseX = floor(cx * offW / cellsX)
    baseY = floor(cy * offH / cellsY)
    // area pixel = cpx x cpx centrata sulla posizione
    per py in cpx, per px in cpx:
      gx = baseX + px - cpx/2   (clampato a [0, offW))
      gy = baseY + py - cpx/2
      if density < bayer(gx, gy): skip
      screen blend
```

La cella [48,27] e sempre al centro dello schermo.
Ma drone la renderizza come macchia 16x16 e voice come punto 8x8.

**Sovrapposizione intenzionale:** le celle sono spaziate 10px (960/96).
Un drone a cellPx=16 si sovrappone ai vicini — crea effetto continuo
e pittorico. Voice a cellPx=8 lascia 2px di gap — punti isolati.
La sovrapposizione e gestita naturalmente dallo screen blend: dove
due celle drone si sovrappongono, la luminosita compone. Il risultato
e una gerarchia visiva naturale: drone = sfondo materico continuo,
voice = punti precisi separati.

### Particelle

Le particelle chord (colonnine) e arp (cadenti) in _particles usano
coordinate cella. Devono usare CELLS_X/CELLS_Y per le bounds e
CELLS_Y per la gravita. Le depositFn che creano particelle ricevono
HELPERS con i nuovi CELLS.

### Utility smoothstep

Aggiungere in campo.js come helper locale:
```
function smoothstep(lo, hi, x) {
  const t = clamp((x - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
}
```

### Sovrascrivibilita per bioma

```javascript
// In biomi.js, ogni bioma puo dichiarare:
cellPx: {
  drone: 20,  // NEBBIA: grana extra-grossa per drone
  voice: 6,   // NEBBIA: punti finissimi per voice
}
// MACCHINA: tutto cellPx=10 (griglia uniforme, niente aging)
```

---

## Step 3 — Firma nel campo (solidificazione a 3 strati)

### Filosofia

Il gelo non e un bottone on/off. E una proprieta fisica continua
che emerge da tre fattori. Ogni cella ha un "fattore di solidificazione"
0→1 che rallenta il suo decay.

Il performer suona — non preme tasti. Tutto e automatico.

### Strato A — Per ruolo (il silenzio cristallizza)

Ogni ruolo ha un contatore: frame dall'ultimo feedNote su quel ruolo.
Dopo una soglia, il decay rallenta progressivamente.

```
_silenceFrames[role]++                    // ogni frame in updateCampo
onFeedNote: _silenceFrames[role] = 0      // reset

freezeFactor_role = smoothstep(0, silenceThreshold[role], _silenceFrames[role])
```

Soglie per ruolo (in secondi, convertite in frame a 60fps):
- drone: 8s (480 frame) — cristallizza lentamente
- bass: 4s — medio
- chord: 3s
- kick: 1s — sparisce prima di cristallizzare
- percussion: 1s
- arp: 2s
- voice: 3s
- lead: 3s

### Strato B — Per soglia di densita (la materia densa si stabilizza)

Le celle ad alta densita decadono piu lentamente. Non serve trigger.

```
freezeFactor_density = smoothstep(0.4, 0.8, cellDensity)
```

Sotto 0.4: decay normale. Sopra 0.8: quasi permanente.

### Strato C — Per regione spaziale (il basso sedimenta)

La fascia bassa del campo (Y > 70%) decade piu lentamente.
La fascia alta (Y < 30%) decade normalmente.

```
freezeFactor_spatial = smoothstep(0.5, 0.9, cy / cellsY)
```

### Composizione

```
freezeTotal = max(freezeFactor_role, freezeFactor_density, freezeFactor_spatial)
effectiveDecay = lerp(bioma.decay[role], 1.0, freezeTotal)
```

`max` (non somma): basta che UN fattore dica "solidifica".
effectiveDecay=1.0 = cella permanente (no decay).

### Convergenza (automatica)

Pilotata da director3: alla fase dissoluzione di ogni traccia,
convergenza si attiva gradualmente. La materia migra verso il centro
durante gli ultimi secondi — transizione visiva naturale.

```
// in updateCampo, se firma.convergenza:
per ogni ruolo, per ogni cella con density > threshold:
  dx = sign(centerX - cx)
  dy = sign(centerY - cy)
  transfer = field[i] * 0.3 * dt
  field[i] -= transfer
  field[idx(cx+dx, cy+dy)] += transfer
```

### DensityCap (gia automatico)

firma.js gia pilota opening ramp / closing fade.
In campo.js feedNote: `if (firma.densityCap < 1 && Math.random() >= firma.densityCap) return;`

### Sovrascrivibilita per bioma

Ogni bioma puo dichiarare override:

```javascript
freeze: {
  spatial: false,              // MACCHINA: niente stratigrafia
  densityThreshold: 0.9,       // RESPIRO: solo altissime si solidificano
  roleEnabled: false,           // TEMPESTA: nulla cristallizza
  globalFactor: 0.5,           // RITORNO: tutto solidifica al 50%
}
```

### Tasti G/J

Restano come override manuale per debug/prove. In live non servono.
G forza freezeTotal=1 globale, J forza convergenza=true.

### Impatto

- campo.js: ~40 righe in updateCampo + array _silenceFrames[8]
- biomi.js: campo `freeze` opzionale per bioma
- firma.js: nessun cambiamento
- director3.js: ~5 righe per attivare convergenza in dissoluzione

---

## Step 4 — Camera nel campo (sessione dedicata)

### Stato camera

Estensione di worldState.camera:

```javascript
camera: {
  zoom: 1.0,       // 1.0 normale, 2-4 macro, 0.2-0.5 orbita
  focusX: 0.5,     // 0→1, centro attenzione X
  focusY: 0.5,     // 0→1, centro attenzione Y
  barrel: 0,        // 0→1, distorsione sferica (solo RITORNO)
}
```

Tutti i valori interpolano smoothly (lerp per frame).

### Tre regimi

**Normale (zoom 1.0):** offscreen intero → canvas intero. Come adesso.

**Macro (zoom 2-4x):** ritaglia porzione offscreen centrata su focus,
scala a schermo pieno. A zoom 3x: 1/3 del campo visibile, grana
Bayer leggibile.

```
srcW = offW / zoom
srcH = offH / zoom
srcX = focusX * offW - srcW/2   (clamp ai bordi)
srcY = focusY * offH - srcH/2
ctx.drawImage(_off, srcX, srcY, srcW, srcH, 0, 0, canvasW, canvasH)
```

**Orbita (zoom 0.2-0.5):** offscreen scalato giu e centrato su nero.

```
dstW = canvasW * zoom
dstH = canvasH * zoom
dstX = (canvasW - dstW) / 2
dstY = (canvasH - dstH) / 2
ctx.fillRect(0, 0, canvasW, canvasH)   // nero
ctx.drawImage(_off, 0, 0, offW, offH, dstX, dstY, dstW, dstH)
```

**Barrel distortion (solo RITORNO):** post-pass con pixel displacement
map precalcolata. Secondo offscreen temporaneo. Attivo solo quando
camera.barrel > 0.

### Pilotaggio automatico (director3)

| Fase          | Zoom      | Focus       | Note                          |
|---------------|-----------|-------------|-------------------------------|
| germoglio     | 1.5-2.0   | centro      | macro, il bioma nasce         |
| pulsazione    | 1.0       | centro      | visione normale               |
| densita       | 1.0       | drift lento | leggero pan esplorativo       |
| rottura       | 0.8       | centro      | respiro prima del caos        |
| dissoluzione  | 1.0→1.5   | centro      | intimita prima del cambio     |

**RITORNO override totale:**
zoom: 1.0 → 0.3 progressivo su tutta la traccia.
barrel: 0 → 0.6. Focus: centro fisso.

### Impatto

- campo.js renderCampo: ~20 righe crop/scale + ~40 righe barrel
- world-state.js: 4 campi aggiuntivi in camera
- director3.js: ~30 righe per pilotare zoom/focus per fase
- Tasti freccia come override manuale per prove

---

## Ordine di implementazione

### Sessione A (step 1+2+3)

1. Grid rettangolare 96x54 + HELPERS aggiornati
2. Riscalare depositFn in biomi.js per nuova risoluzione
3. cellPx per ruolo nel render
4. Firma: 3 strati solidificazione + convergenza + densityCap
5. Test live con musica (Shift+C, scorrere tracce)

### Sessione B (step 4)

1. Camera state + interpolazione smooth
2. Tre regimi (normale/macro/orbita) in renderCampo
3. Pilotaggio automatico in director3
4. Barrel distortion per RITORNO
5. Test live completo

---

## Decisioni esplicite

- **Rupture rinviato** — cablaggio in sessione C, dopo aver visto il campo
  espressivo con firma + camera
- **Lato musicale dopo** — tuning densita, transizioni, silenzi strutturali
  vengono dopo il cablaggio visivo completo
- **64x36 scartato** in favore di 96x54 per avere risoluzione sufficiente
  per la camera zoom-out
- **Lifecycle aging via cellPx per ruolo** (non array age separato) —
  piu semplice, nessun raddoppio memoria
- **Firma automatica** — il performer suona, non preme tasti. G/J solo debug.
- **Camera pilotata da director3** — non dal performer

---

## File toccati (previsione)

### Sessione A

| File | Tipo modifica |
|------|---------------|
| src/campo.js | refactor grid + render multi-cellPx + firma 3 strati |
| src/biomi.js | cellPx per bioma + freeze overrides + riscalare depositFn |
| src/field.js | passare firma state a campo se useCampo |
| src/config.js | CFG.VISUAL.campo.cellsX/cellsY/defaults |
| src/director3.js | convergenza automatica in dissoluzione |

### Sessione B

| File | Tipo modifica |
|------|---------------|
| src/campo.js | camera crop/scale/barrel in renderCampo |
| src/world-state.js | camera zoom/focusX/focusY/barrel |
| src/director3.js | pilotaggio camera per fase |

---
<!-- knowledge-graph links -->
[[STATUS]] [[DECISIONS]] [[VISUAL-VISION]] [[campo.js]] [[biomi.js]]
