# MACH:INE III — Roadmap Visual

*Generata 2026-04-07 — basata su RESEARCH-V4-VISUAL-DIRECTION.md*
*Counterpart visivo di ROADMAP-TAVOLAROTONDA.md*

---

## Diagnosi

**Verdetto del Regista Visivo (riportato dalla session 2026-04-05):**
> Vocabolario maturo, ma omologazione interna tra composizioni. Il dot c'è, ma manca l'identità per traccia. Il sistema è tecnicamente eccellente, compositivamente incompleto.

**Stato architetturale (mappato dal codice 2026-04-07):**

| Layer | File | Status |
|---|---|---|
| Dispatcher | `src/field.js` | ✅ Completo: crossfade, sediment condiviso, micro-glitch, MIDI trail, onset waves |
| Toolkit | `src/visual-toolkit.js` | ✅ Bayer, fillBayer, sediment, breathing field, glitch, color flash, perspective, camera transforms, noise |
| World state | `src/world-state.js` | ✅ palette, visualRegime, camera per traccia |
| 6 composizioni | `src/comp-*.js` | 🟡 Buone individualmente, **non parlano la stessa lingua** |

**Mapping reale traccia → composizione:**

| Track | Comp | Caratteristica |
|---|---|---|
| NEBBIA | comp-liminale | Prospettiva convergente, vanishing point |
| TESSUTO | comp-linee | Linee orizzontali parallele |
| SOLCO | comp-quadrati | Blocchi pulsanti col groove |
| RESPIRO | comp-negativo | Inversione, monocromo |
| MACCHINA | comp-griglia | Griglia visibile, struttura |
| TEMPESTA | comp-treno | Parallax laterale 3 piani |
| RITORNO | comp-liminale (shared) | Stesso modulo di NEBBIA |

**3 problemi convergenti:**
1. **Identità per traccia debole** — guardando 2s del video, non sai quale traccia stai vedendo
2. **Mancanza di score strutturale** — il visual è quasi sempre random nel tempo, mai pre-composto
3. **Coupling audio-visivo "smoothed"** — gli eventi MIDI non producono eventi visivi 1:1, sono digeriti in ambient sparkle

---

## Principi guida (da rispettare in tutti i Phase)

1. **Flag-gated.** Tutte le modifiche sotto `CFG.VISUAL_V4` (default off). Hotkey `V` per toggle A/B in tempo reale.
2. **Reversibili.** Snapshot del frame di test prima di Phase 2 e Phase 3. Snapshot in `versions/`.
3. **Cheap.** Ogni nuova op dichiara il suo costo in ms. Totale max 10ms (lascia 6ms headroom sul budget 16ms).
4. **Glitch = sottrazione.** Mai aggiungere noise. Sempre togliere. (User feedback memorizzato)
5. **No "albero di Natale".** Ogni traccia usa max 4-6 ops. L'identità è anche cosa è ASSENTE.
6. **Test live obbligatorio dopo ogni Phase.** Senza feedback, non si procede.
7. **Una composizione per commit.** Mai commit cumulativi sui comp-*.

---

## Phase 0 — Identità immediata (~3 ore, 1 sessione)

**Obiettivo:** in 1 sessione, le 7 tracce devono diventare *riconoscibili in 2 secondi* — senza scrivere logica nuova, solo refit di parametri esistenti.

### 0.1 — Density cap per traccia (Hara → Yokoo gradient)

**File:** `src/tracks.js` (esiste già `visualRegime.maxDensity`, va calibrato)

| Track | maxDensity attuale | maxDensity target | Razionale |
|---|---|---|---|
| NEBBIA | 0.15 | **0.25** | mantieni quasi vuoto (Kolgen / Hara) |
| TESSUTO | 0.40 | **0.45** | crescita controllata |
| SOLCO | 0.65 | **0.50** | ridurre — il groove non deve riempire |
| RESPIRO | 0.20 | **0.10** | RESPIRO = Hara puro, 90% vuoto |
| MACCHINA | 0.80 | **0.55** | meno di TEMPESTA, struttura non riempimento |
| TEMPESTA | 1.00 | **0.70** (con override 1.00 in rupture takeover) | overwhelm non saturazione costante |
| RITORNO | 0.30 | **0.30** | invariato |

**Implementazione:**
- Aggiornare i valori in `tracks.js` direttamente (non serve override gated)
- I `comp-*` già leggono `worldState.visualRegime.maxDensity` (verifica + clamp se serve)
- **Costo:** 30 minuti

### 0.2 — Risograph misregistration sull'accent

**File:** `src/visual-toolkit.js` (helper) + ogni `comp-*.js` che usa `palette.accent`

Quando si renderizza l'accent color, offsettare di 1-2 cells dal primary. Estetica risograph emergente "gratis" su tutte le tracce con `palette.accent`.

**Implementazione:**
```js
// In visual-toolkit.js
export function risoOffset(x, y, dx = 1, dy = 0) {
  return [x + dx, y + dy];
}
```
Wrappare ogni `drawDot(ctx, x, y, ...)` per accent in `drawDot(ctx, x+1, y, ...)`. Offset costante per traccia (1 px X per default).

**Costo:** 30 minuti

### 0.3 — Audio EMA tau per traccia

**File:** `src/comp-liminale.js`, `src/comp-treno.js`, `src/comp-quadrati.js`

Attualmente i lerp coefficient sono fissi (es. `+= (target - current) * 0.02`). Sostituire con tau letto da `tracks.js`:

```js
const VISUAL_TAU = {
  NEBBIA: 4.0, RESPIRO: 4.0, RITORNO: 3.0,    // slow
  TESSUTO: 1.5, RITORNO: 3.0,                  // medium
  SOLCO: 0.8, MACCHINA: 0.4, TEMPESTA: 0.2,   // fast
};
// Lerp coefficient = dt / tau
const lerpK = dt / VISUAL_TAU[worldState.track];
_params.X += (target.X - _params.X) * lerpK;
```

**Costo:** 45 minuti

### 0.4 — Bayer scaffold visibile (Nicolai)

**File:** `src/comp-liminale.js` + `src/comp-negativo.js`

Background per NEBBIA e RESPIRO: render della Bayer 8×8 lattice a fg alpha 0.04 *prima* di tutto il resto. Mostra il sistema "in attesa". Helper in toolkit:

```js
export function renderBayerScaffold(ctx, W, H, color, alpha = 0.04) {
  ctx.globalAlpha = alpha;
  for (let y = 0; y < H; y += 8) {
    for (let x = 0; x < W; x += 8) {
      if (bayerTest(x/8, y/8, 0.5)) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  ctx.globalAlpha = 1;
}
```

Attivato solo in NEBBIA germoglio/dissoluzione e RESPIRO germoglio/dissoluzione/pulsazione.

**Costo:** 30 minuti

### 0.5 — Glitch sottrattivo

**File:** `src/field.js:213-254` (la funzione `_glitch` nei case 0-4)

**Problema attuale:** il glitch case 0 fa flash bianco/nero (additivo). Case 2 fa canvas shift (ok). Case 3-4 sono no-op.

**Refactor:**
- Case 0 (flash) → diventa "strip removal": cancella 8-16 righe di pixel per 1 frame (`ctx.clearRect`). Ottiene il "rottura grammatica" via sottrazione.
- Case 1 (scan line) → invariato (è già monochrome bar)
- Case 2 (canvas shift) → invariato
- Case 3 → "column removal": cancella 8-16 colonne per 1 frame
- Case 4 → "Bayer threshold flip": inverte la threshold per 1 frame (cell che erano on diventano off)

Match diretto al feedback memory: "glitch = rottura grammatica, NON accumulo effetti".

**Costo:** 45 minuti

### Phase 0 — Test live & deliverable

1. Reload Chrome → boot → percorri tutte e 7 le tracce con `Shift+1..7`
2. **Test atomico:** schermata → "che traccia è?" — devi rispondere in 2 secondi senza cheating
3. Se 6/7 sono riconoscibili → ✅ commit, passa a Phase 1
4. Se ≤5 → tunare i density cap, ricontrollare riso offset, ripetere

**Commit:** `v4-visual: phase 0 — identity foundations (density caps, riso offset, EMA tau, scaffold, subtractive glitch)`

**Rischio:** zero. Tutto parametrico, zero logica nuova.

---

## Phase 1 — Score-driven structure (~4 ore, 1 sessione)

**Obiettivo:** smettere di lasciare il visivo "casuale nel tempo". Pre-comporre ~45 pivot strutturali e farli triggerare dal director3.

### 1.1 — Visual score JSON

**File nuovo:** `src/visual-score.json`

Schema:
```json
{
  "events": [
    {"t": 0, "track": "NEBBIA", "type": "init", "params": {"densityScale": 0.2}},
    {"t": 30, "track": "NEBBIA", "type": "mutation", "params": {"profileBands": 2}},
    {"t": 90, "track": "NEBBIA", "type": "mutation", "params": {"profileBands": 4}},
    {"t": 288, "track": "TESSUTO", "type": "hardCut", "params": {}},
    ...
  ]
}
```

Lista completa degli ~45 eventi: vedi PART G di RESEARCH-V4-VISUAL-DIRECTION.md.

**Costo:** 1.5 ore (autoring + scrittura JSON)

### 1.2 — Score loader + scheduler

**File nuovo:** `src/visual-score.js`

```js
let _score = null;
let _lastT = 0;

export async function loadScore() {
  const res = await fetch('./src/visual-score.json');
  _score = await res.json();
}

export function getEventsAt(currentT, dt) {
  const events = [];
  for (const e of _score.events) {
    if (e.t > _lastT && e.t <= currentT) events.push(e);
  }
  _lastT = currentT;
  return events;
}

export function resetScore() { _lastT = 0; }
```

**Hook in `director3.js`:** in `updateDirector3(dt)`, leggere `getEventsAt(_totalTime, dt)` e applicare ogni evento al `worldState` o emettere via `director-events`.

**Costo:** 1 ora

### 1.3 — Hard cuts ai confini traccia

**File:** `src/field.js:147-170` (sezione "Detect track change → switch composition")

**Modifica:** prima di chiamare `_activeComp = newComp`, riempire 2 frame consecutivi con `ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H)`. Stop. Il crossfade attuale è troppo morbido per i confini traccia — Eisenstein collision.

**Costo:** 30 minuti

### 1.4 — Frame snapshot system (per RITORNO)

**File nuovo:** `src/visual-memory.js`

Cattura `ctx.canvas` come `ImageBitmap` ai minuti 6 / 14 / 22 / 30 / 36. Storage in memoria (5 ImageBitmap, ~5 MB total).

```js
const _snapshots = [];
const SNAPSHOT_TIMES = [360, 840, 1320, 1800, 2160]; // sec

export function maybeCaptureSnapshot(t, ctx) {
  for (let i = 0; i < SNAPSHOT_TIMES.length; i++) {
    if (!_snapshots[i] && t >= SNAPSHOT_TIMES[i]) {
      createImageBitmap(ctx.canvas).then(bmp => {
        _snapshots[i] = bmp;
        console.log(`[VMEM] snapshot ${i} captured at t=${t.toFixed(1)}`);
      });
    }
  }
}

export function getSnapshot(idx) { return _snapshots[idx]; }
export function clearSnapshots() { _snapshots.length = 0; }
```

Chiamata da `field.js` ad ogni `renderField()`. RITORNO le legge da `comp-liminale.js`.

**Costo:** 1 ora

### Phase 1 — Test live & deliverable

1. Reload, lancia il concerto da inizio
2. Verifica che ai minuti 6/14/22/30/36 vedi `[VMEM] snapshot N captured` in console
3. Verifica che ad ogni cambio traccia vedi 2 frame neri (brutali)
4. Verifica che gli eventi del score si triggerino al tempo giusto

**Commit:** `v4-visual: phase 1 — score driven (loader, hard cuts, frame snapshots)`

**Rischio:** medio. Il loader deve gestire pause/resume/skip — testare con `Space` (pause) e `Shift+N` (skip track).

---

## Phase 2 — Operazioni atomiche core (~6 ore, 1-2 sessioni)

**Obiettivo:** implementare 6 operazioni atomiche del PART E del research. Non tutte le 30. Le 6 che sbloccano l'identità per traccia.

### 2.1 — Anisotropic Bayer (4 angoli) — `crosshatch_4angle`

**File:** `src/visual-toolkit.js` (aggiungi 4 matrici pre-computate)

```js
const BAYER8_H   = BAYER8;                    // orizzontale
const BAYER8_V   = transposeBayer(BAYER8);    // verticale (rotated 90°)
const BAYER8_D45 = rotateBayer45(BAYER8);     // diagonale 45°
const BAYER8_D135 = rotateBayer135(BAYER8);   // diagonale 135°

export function bayerTestAngle(col, row, density, angleIdx) {
  const m = [BAYER8_H, BAYER8_D45, BAYER8_V, BAYER8_D135][angleIdx];
  return density > m[(row & 7) * 8 + (col & 7)];
}
```

**Per:** MACCHINA (cycle through 4 angles per beat), TEMPESTA (pick angle randomly per phrase)

**Costo:** 1.5 ore (le 4 matrici vanno calcolate offline o derivate via swap)

### 2.2 — Lissajous trail (audio L/R) — `lissajous_trail`

**File:** `src/visual-toolkit.js` (helper) + `src/comp-quadrati.js` (consume)

```js
export function renderLissajous(ctx, audioBufL, audioBufR, W, H, color, dotSize = 2) {
  ctx.fillStyle = color;
  const cx = W / 2, cy = H / 2;
  const sx = W * 0.4, sy = H * 0.4;
  for (let i = 0; i < audioBufL.length; i += 4) {
    const x = cx + audioBufL[i] * sx;
    const y = cy + audioBufR[i] * sy;
    ctx.fillRect(x|0, y|0, dotSize, dotSize);
  }
}
```

**Per:** SOLCO densita (layer secondario sopra i blocchi). Zero EMA — direct sample mapping (Robin Fox principle).

**Costo:** 1 ora

### 2.3 — Reaction-diffusion 80×45 — `reaction_diffusion`

**File nuovo:** `src/visual-rd.js`

Gray-Scott model, grid 80×45, 2 step/frame:

```js
const W = 80, H = 45;
let A = new Float32Array(W * H);
let B = new Float32Array(W * H);
const Anew = new Float32Array(W * H);
const Bnew = new Float32Array(W * H);

export function initRD() {
  A.fill(1); B.fill(0);
  // Seed center with B
  for (let r = H/2 - 3; r < H/2 + 3; r++)
    for (let c = W/2 - 3; c < W/2 + 3; c++) B[r*W+c] = 1;
}

export function stepRD(feed = 0.04, kill = 0.06) {
  // Gray-Scott update — laplacian + feed + kill
  // ... ~30 lines ...
}

export function getRDField() { return B; } // 80×45 Float32Array, 0..1
```

**Per:** TESSUTO (uso come mask per la densità delle linee orizzontali in `comp-linee.js`). 1 frame = 2 RD steps. 80×45 = 3600 cells × 2 steps = ~7200 ops/frame ≈ 0.5ms.

**Costo:** 2 ore (incluso integrazione in comp-linee)

### 2.4 — Profile stack (horizon bands) — `profile_stack`

**File:** helper in `src/visual-toolkit.js` + uso in `src/comp-liminale.js`

```js
export function renderProfileStack(ctx, W, H, bandCount, audio, dotColor, time) {
  const bandH = H / bandCount;
  for (let b = 0; b < bandCount; b++) {
    const y = b * bandH;
    const freq = 0.005 * (1 + b * 0.3);  // foreground bands more detail
    const noise = noiseAt(time * 0.1, b * 100, freq);
    // Render row of dots with noise-modulated density
    for (let x = 0; x < W; x += 4) {
      const d = 0.3 + noise * 0.4;
      if (bayerTest(x/4, b, d)) {
        ctx.fillStyle = dotColor;
        ctx.fillRect(x, y + bandH/2, 2, 2);
      }
    }
  }
}
```

**Per:** NEBBIA (sostituisci la `breathingField` attuale con questo per le fasi germoglio/dissoluzione)

**Costo:** 1 ora

### 2.5 — Disorder field (Schotter) — `disorder_field`

**File:** `src/visual-toolkit.js` (helper)

```js
export function disorderJitter(x, y, arc, gradientCenter = [0.5, 0.5]) {
  // Per-cell jitter that grows with arc and distance from center
  const dx = x - gradientCenter[0];
  const dy = y - gradientCenter[1];
  const dist = Math.sqrt(dx*dx + dy*dy);
  const amp = arc * dist * 8;  // px
  // Seeded noise per cell
  const seedX = ((x * 374761393 + y * 668265263) & 0x7fffffff) / 0x7fffffff - 0.5;
  const seedY = ((x * 668265263 + y * 374761393) & 0x7fffffff) / 0x7fffffff - 0.5;
  return [seedX * amp, seedY * amp];
}
```

**Per:** RITORNO (decay), MACCHINA (very subtle in dissoluzione)

**Costo:** 30 minuti

### 2.6 — Fibonacci flicker — `fib_flicker`

**File:** helper in `src/visual-toolkit.js` o direttamente in `src/comp-treno.js`

```js
const FIB_SEQ = [1, 1, 2, 3, 5, 8];  // hold/invert/hold/invert/...
let _fibStep = 0;
let _fibFrameCounter = 0;
let _fibInvert = false;

export function fibFlickerTick(active) {
  if (!active) { _fibStep = 0; _fibFrameCounter = 0; _fibInvert = false; return false; }
  _fibFrameCounter++;
  if (_fibFrameCounter >= FIB_SEQ[_fibStep]) {
    _fibFrameCounter = 0;
    _fibInvert = !_fibInvert;
    _fibStep = (_fibStep + 1) % FIB_SEQ.length;
  }
  return _fibInvert;
}
```

**Per:** TEMPESTA rupture takeover. Quando attivo, applica `ctx.globalCompositeOperation = 'difference'` + fillRect per invertire.

**Costo:** 30 minuti

### Phase 2 — Test live & deliverable

1. Snapshot di `versions/` prima
2. Implementa una op alla volta, test ogni op singolarmente
3. Verifica frame budget con FrameTimer (`perf-utils.js`): nessuna op deve sforare 1.5ms
4. Test integrato: lancia tutto il concerto, verifica che i 6 nuovi op girino senza frame drops

**Commit:** `v4-visual: phase 2 — atomic ops core (anisotropic bayer, lissajous, RD, profile stack, disorder, fib flicker)`

**Rischio:** medio-alto. RD è il task più costoso (~0.5-1ms). Se il budget non passa, fallback a 60×34 grid (~1500 cells).

---

## Phase 3 — Per-track polish (~5 ore, 1-2 sessioni)

**Obiettivo:** applicare le ops di Phase 2 alle 6 composition esistenti, con la table di casting di PART F del research.

### 3.1 — NEBBIA (`comp-liminale.js`)

**Designer ref:** Hofmann + Hara
**Aggiungere:** profile_stack (4 bande), bayer scaffold (5%), disorder_field (very low)
**Modificare:** `_params.driftSpeed` deve diventare costante 0.02 in germoglio (lentissimo, NONOTAK)
**Test:** dopo 2 minuti, devi vedere chiaro un cambio quando le bande raddoppiano (1→2→4)

**Costo:** 1 ora

### 3.2 — TESSUTO (`comp-linee.js`)

**Designer ref:** Karel Martens
**Aggiungere:** reaction_diffusion come mask sulle linee
**Modificare:** trasformare le linee orizzontali in "modulo ripetuto" (Martens) con rotation/scale variation
**Test:** verifica che le RD spots producano "respiro" sulle linee

**Costo:** 1.5 ore

### 3.3 — SOLCO (`comp-quadrati.js`)

**Designer ref:** El Lissitzky (2 forme protagoniste)
**Aggiungere:** lissajous_trail layer in densita
**Modificare:** riduci `_blocks.length` a 2 forme protagoniste in germoglio/pulsazione, espandi a 4-6 in densita
**Test:** verifica che le 2 forme abbiano "personalità" diverse (orange + lime)

**Costo:** 1 ora

### 3.4 — RESPIRO (`comp-negativo.js`)

**Designer ref:** Kenya Hara
**Aggiungere:** bayer scaffold visibile, density cap 10% rigoroso
**Modificare:** UN solo "punto di accadimento" per phrase (rimuovere ambient sparkle)
**Aggiungere rule violation:** dopo 90s di breathing stabile, freeze un angolo del canvas per 16 bar (UVA)
**Test:** percepisci il vuoto come carico, non come fallimento?

**Costo:** 1 ora

### 3.5 — MACCHINA (`comp-griglia.js`)

**Designer ref:** Müller-Brockmann + Weingart
**Aggiungere:** crosshatch_4angle (rotate per beat), 12-col grid alignment
**Modificare:** ogni kick = 1 frame di full-grid spike (Kurokawa 1:1 rule)
**Test:** verifica che il visivo "iteri" col groove, non scorra parallelo

**Costo:** 1 ora

### 3.6 — TEMPESTA (`comp-treno.js`)

**Designer ref:** Rodchenko + Yokoo
**Aggiungere:** fibonacci flicker in rupture takeover (8s budget), barcode mode in densita
**Modificare:** density cap 70% normale, 100% solo durante takeover
**Test:** strobe budget tracker → max 8s continuous, max 60s totali in TEMPESTA

**Costo:** 1 ora

### 3.7 — RITORNO (`comp-liminale.js` + override)

**Designer ref:** Helmut Schmid + Akten
**Aggiungere:** frame_mask (5 snapshot da Phase 1), radiograph_invert (dark bg → light dot), vanishing_drift back to NEBBIA position
**Modificare:** quando `worldState.track === 'RITORNO'`, comp-liminale switcha a memory mode
**Test:** vedi le 5 snapshot apparire come fantasmi nei 5 minuti finali?

**Costo:** 1.5 ore

### Phase 3 — Test live & deliverable

1. Una traccia per volta, commit dopo ognuna
2. Test del concerto completo a fine sessione: ogni traccia deve essere riconoscibile in 2 secondi
3. Se confondi MACCHINA con TEMPESTA → bug di identità

**Commit (uno per traccia):**
- `v4-visual: phase 3.1 — NEBBIA Hofmann/Hara casting`
- `v4-visual: phase 3.2 — TESSUTO Martens RD modules`
- ...etc

**Rischio:** medio. Modifiche distribuite su 6 file. Una traccia per volta è obbligatorio.

---

## Phase 4 — Audio-visivo coupling (~4 ore, 1 sessione)

**Obiettivo:** collegare visivi al *MIDI events* in modo 1:1 (Kurokawa rule), non più audio-RMS-smoothed.

### 4.1 — 1:1 MIDI → visual event queue

**File:** `src/midi.js` + `src/field.js`

Ogni `sendMIDINote(ch, note, vel, dur)` accoda anche un visual event:

```js
// In midi.js
const _visualQueue = [];
export function getVisualEvents(maxAge = 0.05) {
  const now = performance.now() / 1000;
  const events = _visualQueue.filter(e => now - e.t < maxAge);
  _visualQueue.length = 0;
  return events;
}

// Modifica sendMIDINote:
export function sendMIDINote(ch, note, vel, dur) {
  // ... existing code ...
  _visualQueue.push({
    t: performance.now() / 1000,
    ch, note, vel,
    x: noteToX(note), y: noteToY(note),
  });
}
```

`field.js` legge la queue ogni `renderField` e la passa nel `env` ai `comp-*`. I comp scelgono come rispondere — ma OGNI evento deve produrre almeno 1 dot.

**Costo:** 2 ore

### 4.2 — Lissajous = signal flow (no smoothing)

**File:** `src/comp-quadrati.js` (per SOLCO)

Bypass EMA totale. Plot raw L/R buffer dell'audio. Se `audio.rms < 0.02`, canvas vuoto (Robin Fox rule).

**Costo:** 30 minuti

### 4.3 — Reveal apparatus (1 volta per concerto)

**File:** `src/field.js`

Al boundary RESPIRO → MACCHINA (`worldState.track` change), render 4 frame consecutivi del raw Bayer 8×8 alla scala 8x. Stop. Vertov gesture.

**Costo:** 30 minuti

### 4.4 — Strobe budget tracker

**File nuovo:** `src/visual-budget.js`

Conta secondi totali di flicker (frame consecutivi con compositing operation 'difference' o full-flash). Hard cap 90s totali per session, 8s continuous max.

```js
let _flickerTotal = 0;
let _flickerContinuous = 0;
let _isFlickering = false;

export function flickerTick(active, dt) {
  if (active) {
    if (_flickerContinuous > 8 || _flickerTotal > 90) return false; // refuse
    _flickerContinuous += dt;
    _flickerTotal += dt;
    return true;
  } else {
    _flickerContinuous = 0;
    return false;
  }
}

export function resetFlickerBudget() { _flickerTotal = 0; _flickerContinuous = 0; }
```

Chiamato da TEMPESTA prima di attivare il fib flicker.

**Costo:** 1 ora

### Phase 4 — Test live & deliverable

1. Verifica che ogni nota MIDI produca almeno 1 evento visivo (test con metronome lento)
2. Verifica che SOLCO mostri Lissajous solo quando c'è audio
3. Verifica che il reveal apparatus si veda alla transizione RESPIRO→MACCHINA
4. Verifica che il strobe budget non possa essere superato (forza TEMPESTA in loop e verifica che il flicker si blocchi)

**Commit:** `v4-visual: phase 4 — audio-visual coupling (MIDI queue, Lissajous, reveal, strobe budget)`

**Rischio:** basso. È plumbing.

---

## Phase 5 — Visual score authoring & rifinitura (~3 ore, 1 sessione)

**Obiettivo:** dopo che le 4 phase tecniche sono in piedi, scrivere il vero score (non lo stub iniziale).

### 5.1 — Authoring offline

Lanciare il concerto, registrare con session-recorder, riguardare il replay, e annotare i ~45 pivot temporali nel `visual-score.json`. Lavoro di curatela visivo, non di codice.

**Costo:** 2 ore

### 5.2 — Hard rules per traccia (override visual-score)

Lista di hard rules che il score può attivare/disattivare durante la performance:

| Track | Hard rule | Trigger |
|---|---|---|
| NEBBIA | profile_stack 4 bands max | sempre |
| NEBBIA | bayer_scaffold visible | germoglio + dissoluzione |
| TESSUTO | RD always on | densita + rottura |
| SOLCO | lissajous layer | densita |
| SOLCO | 2 protagonist forms only | germoglio + pulsazione |
| RESPIRO | density cap 10% | sempre |
| RESPIRO | rule violation freeze | dopo 90s germoglio stabile |
| MACCHINA | crosshatch cycle | sempre |
| MACCHINA | 1:1 MIDI events | sempre |
| TEMPESTA | barcode mode | densita |
| TEMPESTA | fib flicker | rupture takeover only |
| RITORNO | radiograph invert | sempre |
| RITORNO | snapshot masks | dopo bar 16 |

**Costo:** 1 ora

### Phase 5 — Test live & deliverable

1. Concerto completo dall'inizio alla fine, registrato
2. Riguardarlo dopo: ogni momento ha intenzione, nessuno è random?
3. Se sì → ✅ MACH:INE III v4 visual è completo
4. Snapshot finale in `versions/v4.0-visual/`

**Commit:** `v4-visual: phase 5 — score complete, ready for live`

---

## Cose da NON fare

- ❌ **Riscrivere `comp-*` da zero** — refactor incrementali, una traccia alla volta
- ❌ **Aggiungere nuove primitive visive** — il dot è sufficiente
- ❌ **Tutte le 30 atomic ops del research** — 6-10 sono sufficienti per portare il sistema dove serve
- ❌ **Toccare il sistema musicale durante questa roadmap** — il musicale è in mano a SESSION-NEXT.md, non incrociare i flussi
- ❌ **WebGL / shaders** — Canvas 2D è una scelta, non una limitazione
- ❌ **Arc scrubber offline** — utile ma non blocca, fallo solo se serve davvero per debug
- ❌ **DLA, force-directed web, differential line growth** — rinviati a v5 (overengineering per ora)
- ❌ **Visual e music in same commit** — sempre separati
- ❌ **Strobe senza dose limit** — hard cap obbligatorio
- ❌ **Flash bianco/nero come glitch** — usa sottrazione (fixed in Phase 0.5)

---

## Anche da considerare (rinviato a v5)

Cose dal research non incluse in v4:
- **DLA (Diffusion-Limited Aggregation)** Nakayama §14 — TESSUTO/RITORNO seeds
- **Differential line growth** inconvergent §B.8 — bass voice trace
- **Force-directed web** Saraceno §B.13 — SOLCO o CRISTALLO alternativo
- **Substrate walker** Tarbell §B.7 — MECCANICA architectural
- **Markov dither** Kawano §B.4 — texture per-engine signature
- **Frame masking by stored frames** McGloughlin — RITORNO già parziale via snapshot
- **Pixel sorting** inconvergent — rupture effect
- **Hilbert fill order** plotter community — slow render passes
- **Peg-and-string** Cherniak — CRISTALLO alternativo
- **Phase field over grid** Freeke — alternativa a EMA reactivity

---

## File chiave da leggere all'inizio sessione

1. **Questo file** (`ROADMAP-VISUAL.md`)
2. **`RESEARCH-V4-VISUAL-DIRECTION.md`** — il documento sorgente delle idee (PART E per le ops, PART F per il casting)
3. **`SESSION-NEXT.md`** — quello musicale, per sapere cosa NON toccare
4. **`src/field.js`** — il dispatcher visivo, capire COMP_MAP e crossfade flow
5. **`src/visual-toolkit.js`** — toolkit corrente, capire cosa c'è già
6. **Memory:** `~/.claude/projects/-Users-Edo-1-MACH-INE-II-MACH-INE-II/memory/feedback_glitch.md`

---

## Stato git (a inizio Phase 0)

Branch: `machine-iii`
File da NON toccare durante la roadmap visual:
- `src/rhythm.js` (musicale, in mano a SESSION-NEXT)
- `src/harmony.js` (musicale)
- `src/bass*.js` (musicale)
- `src/melody*.js` (musicale)
- `src/texture.js` (musicale)
- `src/director3.js` — eccezione: Phase 1.2 aggiunge hook per visual-score, ma è additivo

File che verranno modificati nel corso della roadmap:
- `src/tracks.js` (Phase 0.1 — visualRegime maxDensity)
- `src/visual-toolkit.js` (Phase 0.2, 0.4, 2.1, 2.2, 2.4, 2.5, 2.6)
- `src/field.js` (Phase 0.5, 1.3, 4.1, 4.3)
- `src/comp-liminale.js` (Phase 0.4, 3.1, 3.7)
- `src/comp-linee.js` (Phase 3.2)
- `src/comp-quadrati.js` (Phase 3.3, 4.2)
- `src/comp-negativo.js` (Phase 0.4, 3.4)
- `src/comp-griglia.js` (Phase 3.5)
- `src/comp-treno.js` (Phase 3.6)
- `src/midi.js` (Phase 4.1)
- `src/config.js` (aggiungere `VISUAL_V4` flag)

File nuovi (da `git add` durante la roadmap):
- `src/visual-score.json` (Phase 1.1)
- `src/visual-score.js` (Phase 1.2)
- `src/visual-memory.js` (Phase 1.4)
- `src/visual-rd.js` (Phase 2.3)
- `src/visual-budget.js` (Phase 4.4)

---

## Sequenza consigliata

| # | Phase | Sessione stimata | Obiettivo |
|---|---|---|---|
| 0 | Identità immediata | 1 sessione (3h) | 7 tracce riconoscibili in 2s |
| 1 | Score driven | 1 sessione (4h) | Pivot strutturali pre-composti |
| 2 | Atomic ops core | 1-2 sessioni (6h) | 6 ops nuove implementate |
| 3 | Per-track polish | 1-2 sessioni (5h) | Casting designer per traccia |
| 4 | Audio-visual coupling | 1 sessione (4h) | 1:1 MIDI→visual rule |
| 5 | Score authoring | 1 sessione (3h) | Score finale + go live |
| **TOTALE** | | **5-7 sessioni (~25h)** | v4 visual ready for live |

---

## Anti-pattern noti (memorizzati)

Da `~/.claude/projects/-Users-Edo-1-MACH-INE-II-MACH-INE-II/memory/feedback_glitch.md`:

> Glitch = rottura grammatica, NON accumulo effetti. Meno layer, più sottrazione.

Da workflow preferences:
- Cicli corti test → feedback → fix
- Sessioni focalizzate
- Co-design musicale (vale anche per visual)
- No conferme superflue, test live

---

## Definition of Done — v4 Visual

Il sistema è ✅ done quando:

1. ✅ Le 7 tracce sono riconoscibili in 2 secondi a qualsiasi fase
2. ✅ Score JSON con ~45 pivot pre-composti, riproducibili
3. ✅ 6 atomic ops nuove implementate e usate
4. ✅ Frame budget < 16ms in tutte le fasi (verificato con FrameTimer)
5. ✅ Strobe budget hard-capped (verificato non superabile)
6. ✅ 5 snapshot frame catturate e usate in RITORNO come maschere
7. ✅ Glitch è sottrazione (verificato visivamente)
8. ✅ Concerto completo registrato + riguardato + ogni momento ha intenzione
9. ✅ Frame snapshot finale in `versions/v4.0-visual/`
10. ✅ Commit history pulito, una phase per commit serie (5 serie totali)

---

## Sessione 1 concentrato — "Identità & infrastruttura" (5-6h)

> Compressione realistica per chi vuole portare a casa un risultato visibile in **una sola sessione**. Questo è il sottoinsieme delle Phase 0 + 1 fattibile in 5-6h con test live e 2 commit puliti.

### Sequenza ottimizzata

| # | Task | File | Costo | Cum |
|---|---|---|---|---|
| 1 | **0.1** Density cap per traccia | `tracks.js` | 30m | 0:30 |
| 2 | **0.2** Risograph offset accent | `visual-toolkit.js` + 5 comp-* | 30m | 1:00 |
| 3 | **0.3** Audio EMA tau per traccia | `comp-liminale.js`, `comp-treno.js`, `comp-quadrati.js` | 45m | 1:45 |
| 4 | **0.4** Bayer scaffold visibile | `visual-toolkit.js` + `comp-liminale.js` + `comp-negativo.js` | 30m | 2:15 |
| 5 | **0.5** Glitch sottrattivo refactor | `field.js:213-254` | 45m | 3:00 |
| **TEST 1** | Percorri le 7 tracce con `Shift+1..7`, identità in 2s? | — | 15m | 3:15 |
| **COMMIT 1** | `v4-visual: phase 0 — identity foundations` | — | 5m | 3:20 |
| 6 | **1.2** Score loader stub (file vuoto OK) | nuovo `visual-score.js` | 45m | 4:05 |
| 7 | **1.3** Hard cuts ai confini traccia | `field.js:147-170` | 30m | 4:35 |
| 8 | **1.4** Frame snapshot system | nuovo `visual-memory.js` + hook in `field.js` | 45m | 5:20 |
| **TEST 2** | Verifica snapshot ai min 6/14/22, hard cut visibile | — | 15m | 5:35 |
| **COMMIT 2** | `v4-visual: phase 1 partial — score loader + hard cuts + memory` | — | 5m | 5:40 |

### Cosa rimane FUORI (e va in sessione 2+)

- **1.1 score JSON authoring** — richiede di guardare un replay del concerto per annotare i pivot
- **Tutta Phase 2** (atomic ops core) — 6 ops × 1-2h ognuna
- **Tutta Phase 3** (per-track polish Hofmann/Martens/etc) — richiede test live per ogni traccia
- **Phase 4** (MIDI 1:1 coupling) — incrocia il flusso musicale
- **Phase 5** (score authoring offline)

### Pre-flight check (5 min prima di partire)

1. ✅ `git status` → working tree clean (a parte i file untracked tipo ROADMAP-VISUAL.md)
2. ✅ HEAD su `6148835` (v3-music framework)
3. ✅ `python3 -m http.server 8282` running, Chrome aperto su `localhost:8282`
4. ✅ MIDI out routato (anche solo per verificare che il visivo non rompa il flow musicale)
5. ✅ Snapshot del frame visivo attuale per A/B comparison: `versions/pre-v4-visual.png`

### Definition of Done sessione 1

Il sistema dopo questa sessione:
- ✅ 7 tracce **distinguibili in 2 secondi**
- ✅ Glitch è sottrazione (verificato visivamente)
- ✅ Hard cuts ai confini traccia (collision visibile)
- ✅ Infrastruttura snapshot pronta (5 ImageBitmap catturati ai min target)
- ✅ Score loader pronto (può leggere visual-score.json anche se vuoto)
- ✅ 2 commit puliti, sequenziali, reversibili
- ✅ Frame budget < 16ms (verifica con FrameTimer in console)
- ❌ NON ha ancora atomic ops Phase 2
- ❌ NON ha ancora per-track casting Phase 3

---

## Prossima azione concreta

**Phase 0, task 0.1:** aggiornare i 7 valori `maxDensity` in `tracks.js`. 30 minuti. Reload, test, conferma. Poi 0.2.

**Comando per partire:** `git status` (verifica clean), poi modifica `src/tracks.js`, poi `git diff` per controllo.
