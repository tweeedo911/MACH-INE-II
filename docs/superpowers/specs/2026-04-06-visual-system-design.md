# MACH:INE III — Visual System Design

> Ridisegno visivo completo. 6 composizioni spaziali per 7 tracce, toolkit condiviso, Bayer come alfabeto.

---

## 1. Principio

Ogni traccia ha un'identità visiva propria. I dot Bayer sono l'alfabeto — il linguaggio cambia per traccia. La composizione (dove e come i dot si organizzano) è stabile per tutta la traccia; i parametri (densità, dimensione, velocità) scalano con la fase musicale.

---

## 2. Architettura

### Shared toolkit + composition modules

```
worldState (palette, visualRegime, phase, energy, track, transition)
    |
    v
field.js (dispatcher)
  - legge worldState.track -> seleziona modulo composizione
  - gestisce crossfade durante transizioni tra tracce
  - chiama modulo.render(ctx, W, H, env)
    |                          |
    v                          v
visual-toolkit.js           6 composition modules
  - bayerAt/bayerTest          comp-liminale.js  (NEBBIA, RITORNO)
  - drawDot/drawDotField       comp-linee.js     (TESSUTO)
  - drawMidiTrail              comp-quadrati.js  (SOLCO)
  - drawOnsetWave              comp-negativo.js  (RESPIRO)
  - lerpColor/hexToRgb         comp-griglia.js   (MACCHINA)
  - lerp/clamp/mapRange        comp-treno.js     (TEMPESTA)
  - noiseAt/perspectiveY
  - gridPosition/fillBayer
```

### Regole
- I moduli composizione importano solo `visual-toolkit.js`
- Tutto il resto arriva via l'oggetto `env` passato a `render()`
- Ogni modulo possiede il canvas intero (background, contenuto, overlay)
- Nessun sistema camera globale — ogni modulo gestisce la propria inquadratura
- `director.js` (vecchio visual director) non viene piu importato

---

## 3. Visual Toolkit (visual-toolkit.js)

Funzioni pure estratte da `field.js` + `colors.js`. Zero stato interno.

```javascript
// Bayer
bayerAt(x, y)                              // 0-63 threshold (matrice 8x8)
bayerTest(x, y, value)                     // bool: disegna dot se value > threshold

// Dot drawing
drawDot(ctx, x, y, size, color)            // singolo dot
drawDotField(ctx, x, y, w, h, density, size, color)  // campo dot in area
fillBayer(ctx, x, y, w, h, value, color)   // riempi area con Bayer threshold

// MIDI visualization
drawMidiTrail(ctx, trails, palette)        // note MIDI attive (shape, decay, color)
drawOnsetWave(ctx, waves, W, H)            // cerchi espandenti da onset audio

// Color
lerpColor(a, b, t)                         // interpolazione RGB
hexToRgb(hex)
rgbToHex(r, g, b)

// Math
lerp(a, b, t)
clamp(v, min, max)
easeInOut(t)
mapRange(v, inMin, inMax, outMin, outMax)

// Spatial
noiseAt(x, y, t)                           // pseudo-noise per variazione spaziale
gridPosition(col, row, cols, rows, W, H)   // coordinate da griglia
perspectiveY(y, depth, vanishY)            // y con prospettiva convergente
```

**Non va nel toolkit:** stato (posizioni, timer), logica compositiva (dove mettere i dot), palette management temporale (quello e' colors.js).

---

## 4. Interfaccia modulo composizione

Ogni modulo esporta 3 funzioni:

```javascript
init(env)                    // Crea stato interno. Chiamato quando la traccia diventa attiva.
render(ctx, W, H, env)      // Disegna frame completo. Chiamato ogni rAF (~60fps).
destroy()                    // Rilascia stato. Chiamato quando la traccia finisce.
```

### L'oggetto env

```javascript
env = {
  worldState,     // palette, visualRegime, phase, energy, arc, transition, track...
  midiTrail,      // array note MIDI attive: { x, y, size, decay, channel, vel, shape }
  onsetWaves,     // array onde: { x, y, radius, strength }
  audio,          // rms, bands, centroid, flux, onset
  midi,           // noteFlashes, noteDensity, channels[0..7]
  dt,             // delta time dal frame precedente
  globalTime,     // tempo assoluto sessione
  toolkit         // riferimento a visual-toolkit.js
}
```

### Regole
- Il modulo possiede il canvas intero — disegna background, contenuto, overlay
- Scala parametri in base a `env.worldState.phase` e `env.worldState.energy`
- Gestisce internamente animazioni, posizioni, contatori
- Non importa altri file tranne visual-toolkit.js
- Durante transizione tra tracce, field.js chiama render() su entrambi i moduli

---

## 5. Le 6 composizioni

### 5.1 comp-liminale.js — NEBBIA + RITORNO

**Tecnica:** Prospettiva convergente. Punto di fuga, dot disposti in profondita. Piu lontano = piu piccolo, piu denso, piu sbiadito.

**NEBBIA (avvicinamento):**
- Fondo quasi nero (#0A0A0A), dot cream (#EFE6DE) rarissimi
- In germoglio: vuoto totale, 1-2 dot in lontananza
- Note MIDI (gocce CH5) generano dot che si avvicinano dal punto di fuga
- Profondita cresce con le fasi
- Onset waves come increspature nella prospettiva

**RITORNO (allontanamento):**
- Stessi principi, direzione opposta — dot si ritirano verso il punto di fuga
- Voice (CH5): dot grandi in primo piano che si allontanano
- Lead echo (CH6): ombre ritardate dello stesso dot
- Dissoluzione: tutto converge nel punto di fuga e scompare

**Parametri per fase:**

| Fase | Profondita campo | Dot size range | Densita max | Velocita drift |
|------|-----------------|----------------|-------------|----------------|
| germoglio | 0.2 | 8-20 | 0.05 | lentissimo |
| pulsazione | 0.5 | 6-18 | 0.15 | lento |
| densita | 0.8 | 4-16 | 0.40 | medio |
| rottura | 1.0 | 2-24 | 0.70 | veloce |
| dissoluzione | 0.3 | 10-20 | 0.10 | lentissimo |

---

### 5.2 comp-linee.js — TESSUTO

**Tecnica:** Linee orizzontali parallele. Ogni linea = una voce armonica/melodica. Si muovono verticalmente seguendo il voice leading.

- Fondo brown scuro (#20130D), dot lime (#CDD71D), accent cream (#EFE6DE)
- CH4 (chords): 3 linee orizzontali = 3 voci. Y = pitch MIDI mappato. Glissano col voice leading.
- CH6 (lead solo): linea piu luminosa, si muove indipendente — accent cream
- CH2 (drone): linea sottilissima in basso, quasi statica
- Le linee sono fatte di dot Bayer, densita variabile lungo la linea
- Impulsi ritmici (CH1 perc) = addensamenti che attraversano le linee come onde

**Parametri per fase:**

| Fase | N linee | Spessore (dot) | Gap tra linee | Velocita glissando |
|------|---------|---------------|---------------|-------------------|
| germoglio | 1-2 | 1 | ampio | — |
| pulsazione | 3 | 2 | medio | lento |
| densita | 4-5 | 3 | stretto | medio |
| rottura | 6+ | 4-6 | minimo | veloce |
| dissoluzione | 2-1 | 1 | ampio | lentissimo |

---

### 5.3 comp-quadrati.js — SOLCO

**Tecnica:** Blocchi rettangolari asimmetrici che pulsano col groove. Kick illumina, basso dimensiona, accordi colorano.

- Fondo signal black (#282B26), dot arancio (#FE6B0D), accent lime (#CDD71D)
- 4-8 blocchi rettangolari con layout asimmetrico (composizione grafica, non griglia)
- CH0 (kick): illumina un blocco — flash di dot densi che decadono
- CH3 (bass): dimensione/peso dei blocchi
- CH4 (chords): accent lime appare nei blocchi
- CH7 (arp): particelle piccole che orbitano i blocchi
- Onset audio scuote leggermente le posizioni

**Parametri per fase:**

| Fase | N blocchi | Dimensione | Intensita flash | Arp visibile |
|------|----------|------------|-----------------|-------------|
| germoglio | 2 | grande, vuoto | debole | no |
| pulsazione | 4 | medio | medio | no |
| densita | 6 | medio-pieno | forte | si |
| rottura | 8 | pieno, sovrapposti | massimo | si, denso |
| dissoluzione | 3 | grande, rado | debole | muore |

---

### 5.4 comp-negativo.js — RESPIRO

**Tecnica:** Inversione. Fondo colorato saturo, strumenti scavano buchi scuri. Silenzio = colore, musica = assenza.

- Fondo sage (#7BBA91), dot scuri che bucano il colore
- CH5 (voice sola): ogni nota scava area scura. Piu lunga la nota, piu largo il buco.
- CH6 (lead echo): buchi piu piccoli, ritardati, posizione spostata
- Senza note: schermo pieno di colore (il momento piu "pieno" e' il silenzio)
- Con note: geometrie scure appaiono e lentamente si richiudono
- Onset waves invertite: restringono il colore invece di espanderlo

**Parametri per fase:**

| Fase | Copertura fondo | Dim buchi | Tempo richiusura | Profondita |
|------|----------------|-----------|------------------|-----------|
| germoglio | 100% | grande | lento | leggero (grigio) |
| pulsazione | 95% | medio | medio | medio |
| dissoluzione | 98% | piccolo | lentissimo | leggero |

(RESPIRO ha solo germoglio, pulsazione, dissoluzione — no densita/rottura)

---

### 5.5 comp-griglia.js — MACCHINA

**Tecnica:** Data/Ikeda. Griglia rigorosa, colonne accese dal MIDI, ripetizione ipnotica.

- Fondo navy (#1A1A2E), dot giallo (#F8ED00), accent pink (#DD3A44)
- Griglia regolare di celle (16-32 colonne x 8-16 righe)
- CH7 (arp protagonista): illumina colonne in successione — il pattern e' visibile
- CH0 (kick): riga intera lampeggia
- CH3 (bass): colonne larghe dalla base
- CH5/CH6 (colori): dot accent sparsi nella griglia
- Pattern arp diventa "testo" visivo leggibile — si vede la ripetizione
- Celle con dot Bayer a densita variabile, non pixel pieni

**Parametri per fase:**

| Fase | Risoluzione | Celle attive % | Velocita scroll | Accent |
|------|------------|---------------|----------------|--------|
| germoglio | 8x4 | 5% | nessuno | no |
| pulsazione | 16x8 | 15% | lento | raro |
| densita | 24x12 | 40% | medio | si |
| rottura | 32x16 | 70% | veloce | denso |
| dissoluzione | 16x8 | 10% | rallenta | muore |

---

### 5.6 comp-treno.js — TEMPESTA

**Tecnica:** Viaggio laterale. Camera che scorre, note come paesaggio, parallasse su 3 piani.

- Fondo nero puro (#000000), dot bianco (#FFFFFF), accent rosso (#91010F)
- **Piano fondo:** dot piccoli, lenti — drone CH2, texture
- **Piano medio:** dot medi, velocita media — accordi CH4, bass CH3
- **Piano primo:** dot grandi, veloci — voice+lead hocket CH5/CH6, arp CH7
- Hocket visibile: note alternate su posizioni alternate nel primo piano
- Velocita di scorrimento legata a BPM ed energy
- Hat poliritmici (CH1) = scintille/flash tra i piani
- In rottura: tutto accelera, piani si comprimono

**Parametri per fase:**

| Fase | Velocita scroll | Distanza piani | Dot size fondo/primo | Densita |
|------|----------------|---------------|---------------------|---------|
| germoglio | lentissimo | ampia | 2/8 | bassa |
| pulsazione | lento | ampia | 2/10 | media |
| densita | medio | media | 3/14 | alta |
| rottura | veloce | stretta | 4/20 | massima |
| dissoluzione | decelera | si riapre | 2/8 | cala |

---

## 6. Palette system

### Semplificazione colors.js

Via il vecchio sistema (8 palette named, setPaletteForMode, mutazioni director). Nuovo flusso:

```
worldState.palette = { bg: "#282B26", dot: "#FE6B0D", accent: "#CDD71D" }
    |
    v
colors.js
  _current = { bg, dot, accent }  (RGB, interpolato)
  _target  = { bg, dot, accent }  (RGB, da worldState)
  Ogni frame: lerp _current -> _target
  Esporta getPalette() -> { bg, dot, accent } in RGB
    |
    v
env.palette dentro i moduli composizione
```

3 colori per traccia. Il vincolo genera coerenza.

### Palette per traccia (da tracks.js)

| Traccia | bg | dot | accent |
|---------|-----|-----|--------|
| NEBBIA | #0A0A0A (nero quasi) | #EFE6DE (cream) | null |
| TESSUTO | #20130D (brown scuro) | #CDD71D (lime) | #EFE6DE (cream) |
| SOLCO | #282B26 (signal black) | #FE6B0D (arancio) | #CDD71D (lime) |
| RESPIRO | #7BBA91 (sage) | #1A1A1A (quasi nero) | null |
| MACCHINA | #1A1A2E (navy) | #F8ED00 (giallo) | #DD3A44 (pink) |
| TEMPESTA | #000000 (nero puro) | #FFFFFF (bianco) | #91010F (carmine) |
| RITORNO | #0A0A0A (nero quasi) | #9B8FCE (lavanda) | #EFE6DE (cream) |

---

## 7. Transizioni tra tracce

Quando `worldState.transition = { from, to, progress }`:

1. field.js chiama `render()` su entrambi i moduli (uscente e entrante)
2. Modulo uscente: globalAlpha decrescente (1 -> 0)
3. Modulo entrante: globalAlpha crescente (0 -> 1)
4. colors.js interpola palette uscente -> entrante seguendo progress
5. A progress = 1.0: modulo uscente.destroy()

Durata: 4-8 bar, sincrono alla transizione musicale.

### Transizioni tra fasi (interne)

Nessun crossfade globale. Il modulo riceve `worldState.phase` e interpola i propri parametri con lerp smooth. Evoluzione continua, non taglio.

---

## 8. File system

### Nuovi (7 file)
```
src/visual-toolkit.js       funzioni pure (Bayer, dot, trail, color, math, spatial)
src/comp-liminale.js        NEBBIA + RITORNO (prospettiva convergente)
src/comp-linee.js           TESSUTO (linee parallele voice leading)
src/comp-quadrati.js        SOLCO (blocchi pulsanti col groove)
src/comp-negativo.js        RESPIRO (fondo saturo, note scavano)
src/comp-griglia.js         MACCHINA (data/Ikeda griglia)
src/comp-treno.js           TEMPESTA (viaggio laterale parallasse)
```

### Modificati (4 file)
```
src/field.js       svuotato del rendering monolitico, diventa dispatcher
src/colors.js      semplificato: legge worldState.palette, interpola, esporta getPalette()
src/render.js      renderFrame() costruisce env, passa a field.js
src/main.js        aggiorna wiring: env nel render loop
```

### Disattivati (non eliminati, non importati)
```
src/director.js    parte visiva non piu usata (scene, SCENES, engineRender, mutations)
```

---

## 9. Data flow completo

```
Audio In (audio.js) -> Analisi (state.js)
                              |
                    DIRETTORE (director3.js)
                      scrive worldState: track, phase, palette, visualRegime, transition
                              |
                    RENDER LOOP (render.js, ogni rAF)
                      costruisce env = { worldState, midiTrail, onsetWaves, audio, midi, dt }
                              |
                    DISPATCHER (field.js)
                      worldState.track -> comp-*.js attivo
                      worldState.transition -> crossfade se attivo
                              |
                    MODULO COMPOSIZIONE (comp-*.js)
                      usa toolkit per disegnare
                      scala parametri con phase/energy
                              |
                    Canvas 2D -> Schermo + BroadcastChannel -> Projector
```

---

## 10. Vincoli tecnici

- Zero dependencies, zero bundler — ES modules puri
- 60fps rAF — nessun modulo composizione puo bloccare il frame (budget 16ms)
- Object pool per dot temporanei (no GC during performance)
- Tutti i parametri numerici in config.js o tracks.js (no magic numbers)
- visual-toolkit.js: funzioni pure, zero allocazioni per-frame
- Crossfade transizione: due render per frame per max 4-8 bar — monitorare frame budget

---

## 11. Criteri di successo

1. **Test identita visiva** — 3 secondi di qualsiasi traccia: "so quale traccia e'"
2. **Test coerenza** — cambio traccia: la transizione e' fluida, non un glitch
3. **Test Bayer** — tutto e' costruito coi dot, ma non sembra un campo halftone uniforme
4. **Test emozione** — RESPIRO sembra respiro, TEMPESTA sembra tempesta
5. **Test performance** — 60fps stabili su tutte le composizioni, incluso crossfade
6. **Test proiettore** — BroadcastChannel funziona con tutte le composizioni
