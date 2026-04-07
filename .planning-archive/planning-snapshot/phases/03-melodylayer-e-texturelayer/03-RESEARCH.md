# Phase 3: MelodyLayer e TextureLayer - Research

**Researched:** 2026-03-27
**Domain:** Generative melody with motivic memory — prime-length texture loops — MIDI voice generation in ES modules (no dependencies)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Un unico file `melody-texture-layer.js` gestisce CH3, CH5, CH6 — analogo a `rhythm-layer.js`. Un solo import e una sola call `updateMelodyTextureLayer(dt)` da aggiungere al routing V3_MODE in `main.js`.
- **D-02:** CH5 (VOICE) — gocce melodiche sparse: frasi brevi 2-4 note, pause lunghe, minimalismo. Approccio v2 composer.js (CH5 frasi Markov ogni 2-4 bar).
- **D-03:** CH6 (LEAD) — voce indipendente: NON canone di CH5. Genera melodia propria, pattern distinti, guidata da melodicActivity.
- **D-04:** CH3 (BASS) — bassline melodica: sequenze root/quinta/quarta, range C1-C3. Non pattern puramente ritmici — narrativa propria come in `BASS_SEQS[]` di composer.js.
- **D-05:** Arpeggi incrociati lenti CH5/CH6 durante transizione verso climax (~20-35min). Meccanismo specifico a discrezione Claude.
- **D-06:** Fraseggio per sezione via melodicActivity — frasi rarissime in apertura, più dense al climax, di nuovo sparse nella dissoluzione. Default: meno note, non più.
- **D-07:** Seed esplicito: finestra 0-5min, CH5 genera motivo 3-4 note e lo fissa in `_seedMotif`. Generato via Markov, fissato dopo prima frase completa.
- **D-08:** Ritorno via trasposizione: arcPercent > 0.75, seed richiamato su CH5 trasportato alla root del modo attivo. Intervalli preservati. Una sola occorrenza.
- **D-09:** Seed non richiamato in arcPercent 0.1-0.75 — mantiene effetto sorpresa.
- **D-10:** Loop a lunghezze prime: CH3=7 step, CH5=11 step, CH6=13 step. LCM=1001 step — nessun ciclo ripetuto. Deterministico (Eno).
- **D-11:** I loop definiscono il *ritmo* delle frasi (quando emettere una nota), non le note stesse. Separazione ritmo/altezza.
- **D-12:** MELO-03 coperto da HarmonyLayer (Phase 1) su CH2. Phase 3 non aggiunge drone separato. CH3/CH5/CH6 si radano nelle fasi arhitmiche — CH2 rimane ancora armonica.

### Claude's Discretion

- Valori esatti degli intervalli del seed iniziale
- Note specifiche dei loop arpeggiati in CH5/CH6 durante la stratificazione (~20-35min)
- Threshold esatte di melodicActivity per transizioni fraseggio rado/denso/scomparsa
- Implementazione interna CH6 (Markov chain separata? Pattern fissi? Da calibrare)

### Deferred Ideas (OUT OF SCOPE)

- CC automation per voci melodiche (CC1, CC11)
- DIFF-01 (harmonic memory store completo)
- Inversione e augmentation come trasformazioni del seed
- Multipli ritorni motivici nella sezione finale
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MELO-01 | Il MelodyLayer genera linee melodiche evolute con memoria motivica — un motif introdotto all'inizio riappare trasformato verso la fine | Seed `_seedMotif` generato 0-5min, ritorno a arcPercent>0.75 per trasposizione: pattern dettagliato in sezione Architecture Patterns |
| MELO-02 | Il TextureLayer implementa loop a lunghezza prima (7, 11, 13 step) che non si allineano mai — poliritmo perpetuo senza randomness (Eno) | Three independent step clocks replicating rhythm-layer.js pattern; LCM(7,11,13)=1001 guarantees no repeat in 1h at 88BPM; math verified below |
| MELO-03 | Un drone root è sempre presente durante le fasi arhitmiche e di dissoluzione | Covered by HarmonyLayer CH2 (confirmed in harmony-layer.js line 111); Phase 3 need only ensure CH3/CH5/CH6 yield to CH2 when melodicActivity is low |
</phase_requirements>

---

## Summary

Phase 3 builds `melody-texture-layer.js` — il terzo modulo v3 layer dopo `macro-composer.js`, `harmony-layer.js` e `rhythm-layer.js`. Il modulo gestisce le tre voci melodiche (CH3 bassline, CH5 voce con memoria, CH6 voce indipendente) usando tre clock indipendenti con lunghezze prime (7/11/13 step) che non si allineano mai in 1001 step. Sopra questa griglia ritmica fissa, le note vengono scelte via catena di Markov pesata verso le note del modo corrente (`macroState.currentMode`).

Il punto compositivo critico è il seed motivico (MELO-01): una frase di 3-4 intervalli registrata nella finestra 0-5min e richiamata a arcPercent > 0.75 per trasposizione alla root del modo attivo. Questo "filo narrativo" è l'unico momento esplicito in cui il pezzo ricorda se stesso.

Ci sono due criticità di integrazione da risolvere: (1) CH3 è usato sia da HarmonyLayer (bass ogni 4 bar) sia da MelodyTextureLayer — serve coordinazione; (2) il timing del seed return (arcPercent > 0.75) corrisponde a ~min33.75 su un concerto di 45min, non min45 come indicato nel CONTEXT (discrepanza da verificare con il designer).

**Primary recommendation:** Replicare la struttura modulare di `rhythm-layer.js` con tre clock indipendenti, gating su `macroState.melodicActivity`, e note selection via Markov pesata sul modo corrente — identico pattern a `nextVoiceNote()` in `composer.js` ma senza dipendenza da presence-multiplier.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ES2020 modules (native) | — | Zero build, zero transpile | Vincolo progetto: no npm, no bundler |
| Web Worker (existing) | — | Clock ~2ms tick che chiama updateMelodyTextureLayer(dt) | Già usato da tutti i layer v3 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sendMIDINote` da `midi.js` | — | Output MIDI CH3/CH5/CH6 | Ogni emissione nota |
| `macroState` da `macro-composer.js` | — | melodicActivity, arcPercent, currentMode, barClock | Gate e selezione note |
| `CFG.MELODY` da `config.js` | — | Tutti i parametri numerici | Zero magic numbers nel codice |
| `CFG.MACRO.modes[mode]` | — | Scale notes per il modo corrente | Weighted Markov note pool |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Markov catena pesata per CH5/CH6 | Pattern fissi hardcoded | Markov è già collaudato in `nextVoiceNote()` e produce variazione autentica; pattern fissi sono più prevedibili |
| Tre clock indipendenti per loop prime | Un singolo clock con modulo | Tre clock sono il pattern di rhythm-layer.js — già testato in produzione |

**Installation:** nessuna — zero dipendenze, zero build.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── melody-texture-layer.js  # NUOVO: CH3/CH5/CH6 melodic voices
├── config.js                # MODIFICATO: aggiungere CFG.MELODY sezione
├── main.js                  # MODIFICATO: import + updateMelodyTextureLayer(dt) in V3_MODE
└── (tutti gli altri file invariati)
```

### Pattern 1: Step Clock con lunghezze prime (da rhythm-layer.js)

**What:** Accumulatore float che avanza di `dt * stepsPerSec`, poi `Math.floor()` per ottenere lo step intero. Il modulo sul loop length mantiene la posizione nel ciclo.

**When to use:** Per tutti e tre i loop CH3/CH5/CH6.

```javascript
// Source: rhythm-layer.js — pattern verificato in produzione
// Tre clock indipendenti con lunghezze prime (LCM=1001, mai sincronizzati)
let _clockCH3 = 0, _lastStepCH3 = -1;   // CH3 = 7 step
let _clockCH5 = 0, _lastStepCH5 = -1;   // CH5 = 11 step
let _clockCH6 = 0, _lastStepCH6 = -1;   // CH6 = 13 step

function _updateLoops(dt, bpm) {
  const stepsPerSec = bpm * 4 / 60;  // 16th-note steps per second

  // CH3 — 7 step loop
  _clockCH3 += dt * stepsPerSec;
  const stepCH3 = Math.floor(_clockCH3);
  if (stepCH3 > _lastStepCH3) {
    for (let s = _lastStepCH3 + 1; s <= stepCH3; s++) {
      _onCH3Step(s % CFG.MELODY.loopLenCH3);  // 7
    }
    _lastStepCH3 = stepCH3;
  }
  // ... stesso per CH5 (11 step) e CH6 (13 step)
}
```

### Pattern 2: Markov Voice (da composer.js `nextVoiceNote`)

**What:** Pool di note dalla scala corrente con pesi: bonus se nota è nell'accordo attivo, bonus per movimento per grado (intervallo <= 3 semitoni), penalty per salti grandi (> 7 semitoni), bonus se la nota corrisponde a un intervallo del seed motivico.

**When to use:** Selezione nota per CH5 e CH6.

```javascript
// Source: composer.js lines 175-206 — pattern Markov voice
// Adattato per v3: usa CFG.MACRO.modes[macroState.currentMode] invece di MODES[phase.mode]
function _nextVoiceNote(history, seedIntervals) {
  const scale = CFG.MACRO.modes[macroState.currentMode] || CFG.MACRO.modes['A_lydian'];
  const pool = [];
  for (const n of scale) {
    let w = 1.0;
    if (history[1] !== null) {
      const diff = n - history[1];
      if (Math.abs(diff) <= 3) w *= 2.5;   // preferenza movimento per grado
      if (Math.abs(diff) > 7)  w *= 0.15;  // penalty salto grande
      for (const mi of seedIntervals) {    // affinità al seed motivico
        if (mi === diff)               w *= 1.8;
        else if (Math.abs(mi - diff) === 1) w *= 1.3;
      }
    }
    pool.push({ n, w });
  }
  const total = pool.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  for (const e of pool) { r -= e.w; if (r <= 0) return e.n; }
  return pool[0].n;
}
```

### Pattern 3: Seed Motivico con Ritorno (MELO-01)

**What:** Nella finestra 0-5min (arcPercent < `CFG.MELODY.seedWindowEnd`), il primo motivo completo di CH5 viene salvato come array di intervalli. A arcPercent > `CFG.MELODY.seedReturnAt`, il seed viene trasportato alla root del modo attivo e inviato su CH5 una sola volta.

**When to use:** Per implementare MELO-01.

```javascript
// Pattern logico — non è codice sorgente esistente, è la progettazione per Phase 3
let _seedMotif      = null;   // array di intervalli (es. [2, -1, 3])
let _seedCaptured   = false;  // true dopo cattura nella finestra 0-5min
let _seedReturned   = false;  // true dopo il ritorno a arcPercent > 0.75

// Cattura seed: accade quando la prima frase CH5 è completa (3-4 note)
function _captureSeed(motifIntervals) {
  if (!_seedCaptured && macroState.arcPercent < CFG.MELODY.seedWindowEnd) {
    _seedMotif    = motifIntervals.slice();  // copia difensiva
    _seedCaptured = true;
  }
}

// Ritorno seed: trasposizione alla root del modo corrente
function _checkSeedReturn() {
  if (!_seedReturned && _seedCaptured &&
      macroState.arcPercent > CFG.MELODY.seedReturnAt) {
    _seedReturned = true;
    const rootNote = CFG.MACRO.droneRoot[macroState.currentMode] || 57;
    _playSeedTransposed(rootNote);  // invia il motivo a partire dalla root
  }
}

function _playSeedTransposed(startNote) {
  const bpm    = CFG.MACRO.bpmReference;
  const barMs  = (60 / bpm) * 4 * 1000;
  let   note   = startNote;
  const scale  = CFG.MACRO.modes[macroState.currentMode] || [];
  let   delay  = 0;
  for (const interval of _seedMotif) {
    const candidate = note + interval;
    // Snap to nearest scale note per coerenza modale
    const snapped = scale.reduce((best, n) =>
      Math.abs(n - candidate) < Math.abs(best - candidate) ? n : best, scale[0]);
    setTimeout(() => _rawSend(5, snapped, CFG.MELODY.seedReturnVel, barMs * 0.8), delay);
    note  = snapped;
    delay += barMs * CFG.MELODY.seedReturnNoteSpacing;  // spacing tra note (in ms)
  }
}
```

### Pattern 4: Gating su melodicActivity

**What:** Identico al gating su harmonicColor in HarmonyLayer — la soglia bassa (0.05) causa silenzio, la velocity è scalata per `melodicActivity`. CH3 usa una soglia ancora più bassa (CH3 è il basso melodico, entra prima delle voci).

**When to use:** In `sendNote()` wrapper di melody-texture-layer.js.

```javascript
// Source: harmony-layer.js line 13-17 — pattern di gating confermato
function sendNote(ch, note, vel, dur) {
  const gate = macroState.melodicActivity;
  if (gate < CFG.MELODY.activityGateFloor) return;
  _rawSend(ch, note, Math.max(1, Math.round(vel * gate)), dur);
}
```

### Pattern 5: EMA smoothing per transizioni fraseggio

**What:** La `melodicActivity` che arriva da macroState è già EMA-smoothed dal MacroComposer. Per threshold di fraseggio interne (es. decidere se emettere una frase o saltarla), una semplice comparazione diretta con la soglia è sufficiente — non serve EMA aggiuntiva.

**When to use:** Per le decisioni if/else su fraseggio rado/denso.

### Anti-Patterns to Avoid

- **CH3 collision con HarmonyLayer:** HarmonyLayer invia bass su CH3 ogni `_chordUpdateEvery=4` bar. Se MelodyTextureLayer invia su CH3 contemporaneamente, si sovrappongono. Soluzione: MelodyTextureLayer usa CH3 per fraseggio melodico a frequenza più alta (ogni 7 step), HarmonyLayer usa CH3 per root harmonics ogni 4 bar. Le note sono complementari (HarmonyLayer nota root/quinta lunga, MelodyLayer nota melodica breve). Il MIDI receiver hardware gestisce naturalmente la sovrapposizione su CH3. Non è necessaria coordinazione esplicita salvo che le velocity non si sommino in modo indesiderato.
- **Magic numbers nel codice:** Tutti i parametri (velocità, threshold, lunghezze loop, seed window) vanno in `CFG.MELODY`. Mai inline.
- **setTimeout dentro Worker:** Il Web Worker non supporta `setTimeout` reliable. Per il ritardo tra note del seed return, usare un micro-sequencer con accumulatore dt — accumulare `_seedReturnDelay` e inviare ogni nota al tick appropriato.
- **Motif capture su CH5 prima che la frase sia completa:** Il seed deve essere catturato solo dopo aver collezionato esattamente `CFG.MELODY.seedLength` (3-4) note della prima frase. Usare un contatore `_ch5PhraseNoteCount`.
- **Loop che si resettano su cambio modo:** I clock `_clockCH3/5/6` non devono essere resettati quando cambia `currentMode` — il poliritmo è deterministico e continuo. Solo `initMelodyTextureLayer()` li azzera.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Step clock con lunghezze prime | Custom timer o setInterval | Pattern `clock += dt * stepsPerSec; Math.floor(clock) % loopLen` da rhythm-layer.js | Testato in produzione, nessun drift accumulato |
| Weighted random selection | Custom RNG | Pattern `pool.push({n,w}); totalW; r=Math.random()*total` da nextVoiceNote() | composer.js righe 195-198, già funzionante |
| Voice leading (snap to nearest scale note) | Custom algoritmo | `scale.reduce((best,n) => dist(n)<dist(best) ? n : best)` da harmony-layer.js (applyVoiceLeading) | Già presente nel codebase |
| Gaussian humanization | Custom bell curve | `_gaussianRand()` da rhythm-layer.js righe 21-23 | Tre Math.random() sommati — approssimazione sufficientemente buona |
| MIDI note send con gating | Custom routing | `sendNote()` wrapper pattern da harmony-layer.js e rhythm-layer.js | Garantisce gating, clamp velocity, pattern uniforme tra layer |

**Key insight:** Tutta la logica necessaria per melody-texture-layer.js esiste già nel codebase come pattern verificati. Il lavoro è applicazione e composizione di pattern esistenti, non invenzione.

---

## Common Pitfalls

### Pitfall 1: arcPercent timing — discrepanza min45 vs min33.75

**What goes wrong:** Il CONTEXT.md dice "ritorno a ~min45 su 60min" ma `CFG.MACRO.concertDurationSec = 2700` (45min). arcPercent > 0.75 = 0.75 × 2700 = 2025s = ~min33.75 di un concerto di 45min.

**Why it happens:** Il CONTEXT.md usa "60min" come riferimento della performance live (che può durare più a lungo), mentre il valore effettivo nel CFG è 45min. La discrepanza è tra descrizione intenzionale e implementazione corrente.

**How to avoid:** Usare il valore effettivo `CFG.MELODY.seedReturnAt` come parametro configurabile (default 0.75) — il progettista può aggiustarlo a runtime. Documentare nel commento del config che 0.75 corrisponde a ~min34 su concerto di 45min. Non assumere che min45 sia il target corretto.

**Warning signs:** Se il seed return non suona affatto, verificare `arcPercent` nel debug HUD prima di sospettare bug nel codice.

### Pitfall 2: Worker senza setTimeout — seed return scheduling

**What goes wrong:** `_playSeedTransposed()` ha bisogno di inviare note con delay tra una e l'altra (es. ogni 0.5 bar). Il Worker non supporta `setTimeout` in modo affidabile.

**Why it happens:** Il Worker usa `setTimeout(tick, 2)` solo per il clock interno — non è disponibile per scheduling arbitrario delle note melody.

**How to avoid:** Usare un micro-sequencer interno: `_seedReturnQueue = []` con entry `{ note, vel, dur, triggerAt }` dove `triggerAt` è un valore `macroState.barClock` futuro. In ogni tick, pop le entry scadute e invia la nota. Pattern usato implicitamente dal step clock (già un micro-sequencer).

```javascript
// Schema del seed return scheduler (senza setTimeout)
let _seedReturnQueue = [];   // { note, vel, dur, targetBar }

function _enqueueSeedReturn(startNote) {
  const barMs  = (60 / CFG.MACRO.bpmReference) * 4 * 1000;
  let noteTime = macroState.barClock;
  let note     = startNote;
  for (const interval of _seedMotif) {
    _seedReturnQueue.push({ note, vel: CFG.MELODY.seedReturnVel,
                            dur: barMs * 0.8, targetBar: noteTime });
    note     += interval;  // approssimazione — snap a scale in invio
    noteTime += CFG.MELODY.seedReturnNoteSpacingBars;
  }
}

// In updateMelodyTextureLayer(dt):
_seedReturnQueue = _seedReturnQueue.filter(entry => {
  if (macroState.barClock >= entry.targetBar) {
    _rawSend(5, entry.note, entry.vel, entry.dur);
    return false;   // rimuovi dalla queue
  }
  return true;
});
```

### Pitfall 3: CH5 silenzio in apertura non rispetta il seed capture

**What goes wrong:** In apertura (arcPercent < 0.08, melodicActivity ≈ 0.0), CH5 non suona per gating. Se il gating è troppo rigido, la prima frase di CH5 non arriva mai, il seed non viene mai catturato, e il ritorno a arcPercent > 0.75 non ha nulla da suonare.

**Why it happens:** La seedWindowEnd (arcPercent < 0.08 = ~3.6min su 45min) è stretta. Se melodicActivity rimane < 0.05 per tutta quella finestra, il gating blocca tutto.

**How to avoid:** La seedWindowEnd deve essere sufficientemente ampia — usare `CFG.MELODY.seedWindowEnd = 0.15` (= ~6.75min) invece di 0.08. Verificare nel MacroComposer che `mA` (melodicActivity) raggiunga almeno 0.1 entro il 15% del concerto. Dai checkpoint CFG.MACRO: `{ pct: 0.00, mA: 0.0 }`, `{ pct: 0.22, mA: 0.1 }` — a 0.15 la mA è circa 0.068 (interpolata). Il gate floor per la cattura seed deve essere più basso del gate floor normale: usare `CFG.MELODY.seedCaptureGateMin = 0.02`.

**Warning signs:** `_seedCaptured` rimane `false` dopo il primo 15% del concerto — controllare con `console.log('[MELODY] seed not captured at:', macroState.arcPercent)`.

### Pitfall 4: CH6 crea conflitto con CH5 senza differenziazione

**What goes wrong:** Se CH5 e CH6 usano lo stesso pool di note Markov con gli stessi pesi, suonano in modo troppo simile — la stratificazione diventa ridondanza, non texture.

**Why it happens:** La differenziazione non emerge automaticamente da due Markov chain indipendenti con stessi parametri.

**How to avoid:** CH6 deve avere parametri Markov distinti da CH5. Opzioni: (1) CH6 usa un range di ottave diverso (es. più alto di CH5 di una quinta); (2) CH6 ha penalty maggiore per movimenti per grado (preferisce salti), creando un carattere più "angoloso"; (3) CH6 ha probabilità di silenzio più alta per step. Implementazione esatta a discrezione durante calibrazione ascolto.

### Pitfall 5: Poliritmo percepito come clock meccanico invece di texture organica

**What goes wrong:** I loop a 7/11/13 step diventano udibili come meccanismo invece che come respiro compositivo — l'ascoltatore sente la struttura del loop.

**Why it happens:** Se le note di ogni loop hanno velocity e durata troppo uniformi, il pattern si rivela.

**How to avoid:** Aggiungere umanizzazione gaussiana alla velocity (pattern `_gaussianRand()` da rhythm-layer.js), variare le durate delle note per phase (legato in apertura, più staccato al climax), e usare probabilistic gating per step (non ogni step del loop emette sempre una nota — si salta con probabilità `1 - melodicActivity`).

---

## Code Examples

### Struttura Modulo Completa (template)

```javascript
// Source: rhythm-layer.js struttura + harmony-layer.js gating — pattern verificati
// ═══════════════════════════════════════════════════════════
//  MACH:INE II — MelodyTextureLayer v3
//  CH3 (BASS) melodic bassline, CH5 (VOICE) seed motif, CH6 (LEAD) independent voice
// ═══════════════════════════════════════════════════════════
import { CFG } from './config.js';
import { macroState } from './macro-composer.js';
import { sendMIDINote as _rawSend, sendMIDIAllNotesOff } from './midi.js';

// ── Gating wrapper ──
function sendNote(ch, note, vel, dur) {
  if (macroState.melodicActivity < CFG.MELODY.activityGateFloor) return;
  note = Math.max(CFG.MELODY.pitchRange[ch].min,
                  Math.min(CFG.MELODY.pitchRange[ch].max, note));
  vel  = Math.max(1, Math.min(127, Math.round(vel * macroState.melodicActivity)));
  _rawSend(ch, note, vel, dur);
}

// ── Step clocks per i tre loop a lunghezze prime ──
let _clockCH3 = 0, _lastStepCH3 = -1;
let _clockCH5 = 0, _lastStepCH5 = -1;
let _clockCH6 = 0, _lastStepCH6 = -1;

// ── Markov state per CH5 e CH6 ──
let _histCH5 = [null, null];
let _histCH6 = [null, null];
let _intervCH5 = [];   // ultimi MOTIF_LEN intervalli CH5 (per affinità seed)
let _intervCH6 = [];   // ultimi MOTIF_LEN intervalli CH6

// ── Seed motivico (MELO-01) ──
let _seedMotif     = null;
let _seedCaptured  = false;
let _seedReturned  = false;
let _ch5PhraseNoteCount = 0;
let _seedReturnQueue = [];

// ── Init / Update ──
export function initMelodyTextureLayer() {
  _clockCH3 = _clockCH5 = _clockCH6 = 0;
  _lastStepCH3 = _lastStepCH5 = _lastStepCH6 = -1;
  _histCH5 = _histCH6 = [null, null];
  _intervCH5 = []; _intervCH6 = [];
  _seedMotif = null; _seedCaptured = false; _seedReturned = false;
  _ch5PhraseNoteCount = 0; _seedReturnQueue = [];
  sendMIDIAllNotesOff();
  console.log('[MELODY] init');
}

export function updateMelodyTextureLayer(dt) {
  const bpm = CFG.MACRO.bpmReference;
  const stepsPerSec = bpm * 4 / 60;

  // Seed return scheduler
  _flushSeedQueue();

  // Check seed return trigger
  _checkSeedReturn();

  // CH3 — 7 step loop
  _clockCH3 += dt * stepsPerSec;
  const sCH3 = Math.floor(_clockCH3);
  if (sCH3 > _lastStepCH3) {
    for (let s = _lastStepCH3 + 1; s <= sCH3; s++) _onCH3Step(s % CFG.MELODY.loopLenCH3);
    _lastStepCH3 = sCH3;
  }
  // CH5 — 11 step loop
  _clockCH5 += dt * stepsPerSec;
  const sCH5 = Math.floor(_clockCH5);
  if (sCH5 > _lastStepCH5) {
    for (let s = _lastStepCH5 + 1; s <= sCH5; s++) _onCH5Step(s % CFG.MELODY.loopLenCH5);
    _lastStepCH5 = sCH5;
  }
  // CH6 — 13 step loop
  _clockCH6 += dt * stepsPerSec;
  const sCH6 = Math.floor(_clockCH6);
  if (sCH6 > _lastStepCH6) {
    for (let s = _lastStepCH6 + 1; s <= sCH6; s++) _onCH6Step(s % CFG.MELODY.loopLenCH6);
    _lastStepCH6 = sCH6;
  }
}
```

### CFG.MELODY Config Section (da aggiungere a config.js)

```javascript
// Source: pattern config da CFG.RHYTHM e CFG.MACRO — struttura già stabilita nel progetto
MELODY: {
  // ── Loop lengths prime numbers (MELO-02) ──
  loopLenCH3: 7,      // bass — 7 step
  loopLenCH5: 11,     // voice — 11 step
  loopLenCH6: 13,     // lead — 13 step
  // LCM(7,11,13) = 1001 step — nessun ciclo identico in 1001 step

  // ── Gating ──
  activityGateFloor: 0.04,   // melodicActivity sotto cui tutti e tre i canali tacciono
  seedCaptureGateMin: 0.02,  // soglia ancora più bassa solo per cattura seed

  // ── Pitch ranges per canale (MIDI-02) ──
  pitchRange: {
    3:  { min: 24, max: 48 },   // CH3 BASS: C1=24 - C3=48
    5:  { min: 36, max: 84 },   // CH5 VOICE: C2=36 - C6=84
    6:  { min: 48, max: 84 },   // CH6 LEAD: C3=48 - C6=84 (octave higher than CH5)
  },

  // ── Velocity targets per fase melodica ──
  velTarget: {
    sparse:  { ch3: 55, ch5: 45, ch6: 35 },   // apertura / dissoluzione
    medium:  { ch3: 70, ch5: 60, ch6: 50 },   // sezione intermedia
    dense:   { ch3: 85, ch5: 75, ch6: 65 },   // climax
  },
  velHumanize: 8,   // ±deviazione gaussiana velocity

  // ── Seed motivico (MELO-01) ──
  seedLength:    4,     // numero di note nel motivo seed
  seedWindowEnd: 0.15,  // arcPercent massimo per cattura seed (~6.75min su 45min)
  seedReturnAt:  0.75,  // arcPercent trigger per ritorno (~min33.75 su 45min)
  seedReturnVel: 65,    // velocity del ritorno motivico
  seedReturnNoteSpacingBars: 0.5,  // spacing tra note del seed return in bar

  // ── Probabilità emissione per fraseggio (D-06: default meno note) ──
  emitProbability: {
    // Probabilità che uno step del loop emetta una nota (resto = silenzio)
    // Scalate automaticamente da melodicActivity
    ch3Base: 0.45,   // il basso suona più spesso (struttura)
    ch5Base: 0.25,   // voce melodica rarefatta
    ch6Base: 0.20,   // lead ancora più rado
  },

  // ── Nota durata per canale (ms) ──
  noteDur: {
    ch3: { sparse: 1800, dense: 900 },   // basso lungo in apertura
    ch5: { sparse: 1200, dense: 600 },
    ch6: { sparse: 800,  dense: 400 },
  },
},
```

---

## Runtime State Inventory

> Fase di aggiunta nuovo modulo — non è un rename/refactor. Non applicabile.

Nessuna modifica a dati persistenti, service config, OS-registered state, secrets/env, o build artifacts. La fase aggiunge un nuovo file sorgente e modifica config.js e main.js.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| v2: 7 composer indipendenti con proprie voci melodiche | v3: MelodyTextureLayer unico che gestisce CH3/CH5/CH6 | Phase 3 | Un solo punto di controllo per tutte le voci melodiche; governato da macroState invece che da engine-specifics |
| v2: CH5 con frasi Markov ogni 2-4 bar, CH6 come canone di CH5 | v3: CH5 con seed motivico + loop primo, CH6 voce completamente indipendente | Phase 3 | Differenziazione reale tra le due voci; memoria motivica attraverso la performance |

**Deprecated/outdated:**

- Composer v2 (composer.js…composer7.js) per CH5/CH6: quando `V3_MODE=true`, questi non vengono chiamati. I loro pattern `nextVoiceNote()` e `BASS_SEQS[]` rimangono come reference architetturale.

---

## Critical Integration Points

### CH3 Collision Strategy — HarmonyLayer vs MelodyTextureLayer

**Situazione:** HarmonyLayer invia bass su CH3 ogni `_chordUpdateEvery = 4` bar (lenta, strutturale). MelodyTextureLayer invia su CH3 ogni 7 step 16th-note (rapida, melodica).

**Valutazione:** Le due parti sono complementari per natura: HarmonyLayer emette note lunghe di root/quinta come "tappeto" armonico; MelodyTextureLayer emette note brevi melodiche come "figura" sopra il tappeto. Un synth hardware o VST su CH3 riceve entrambi i flussi e li esegue in sovrapposizione — è comportamento normale per strumenti polifonici.

**Azione richiesta in planning:** Nessuna coordinazione esplicita necessaria a livello codice. Il piano deve però specificare: (a) le note di MelodyTextureLayer CH3 devono essere nella stessa ottava o superiore rispetto alle note HarmonyLayer CH3 per evitare collisioni di registro (range MIDI-02: C1-C3); (b) la velocity di MelodyTextureLayer CH3 deve essere più alta di HarmonyLayer CH3 (che usa ~50-90) così la linea melodica emerge rispetto al tappeto armonico.

**Se questo approccio non funziona a livello di ascolto:** Modificare HarmonyLayer per non inviare CH3 quando V3_MODE=true e melodicActivity > 0.3 (la melodia prende over il basso). Questa è una modifica post-implementazione, non un prerequisito.

### main.js Integration (V3_MODE routing)

Aggiungere tre righe al blocco V3_MODE in `midiWorker.onmessage`:

```javascript
// In main.js, nel blocco if (CFG.V3_MODE) — dopo updateRhythmLayer(dt)
import { initMelodyTextureLayer, updateMelodyTextureLayer } from './melody-texture-layer.js';
// ...
// In initStart():
if (CFG.V3_MODE) {
  // ...
  initMelodyTextureLayer();   // AGGIUNGERE dopo initRhythmLayer()
}
// ...
// In midiWorker.onmessage:
updateMacroComposer(dt);
updateHarmonyLayer(dt);
updateRhythmLayer(dt);
updateMelodyTextureLayer(dt);  // AGGIUNGERE
```

### macroState.currentMode → Scale Notes

MelodyTextureLayer deve usare `CFG.MACRO.modes[macroState.currentMode]` per il pool di note Markov. Questo garantisce automatica coerenza modale con HarmonyLayer e MacroComposer — tutti e tre usano la stessa definizione di scala.

Il drone root per il seed return viene da `CFG.MACRO.droneRoot[macroState.currentMode]`.

---

## LCM Verification (MELO-02)

A 88 BPM, 16th-note step = 60/88/4 secondi = ~0.170s per step.

- Un ciclo CH3 (7 step) = 7 × 0.170s = 1.19s
- Un ciclo CH5 (11 step) = 11 × 0.170s = 1.875s
- Un ciclo CH6 (13 step) = 13 × 0.170s = 2.216s
- LCM(7, 11, 13) = 7 × 11 × 13 = **1001 step** (tutti coprimi)
- Durata 1001 step = 1001 × 0.170s = **170s = 2.83 minuti**

In un concerto di 45min ci sono ~15.9 ripetizioni del ciclo LCM. Ogni "ripetizione" ha note diverse perché la selezione Markov è stocastica — solo il *ritmo* si ripete ogni 1001 step, non le note. Il criterio di successo MELO-02 ("loop non si allineano mai in un'ora") è quindi soddisfatto sia tecnicamente (ritmo mai allineato) sia compositivamente (note mai identiche per stocasticità Markov).

**Nota:** La success criterion dice "nessun ciclo ripetuto identico" — questo è garantito dalla stocasticità Markov anche prima dei 1001 step. Il LCM garantisce che il pattern ritmico non si sincronizzi, il Markov garantisce che le note non si ripetano.

---

## Open Questions

1. **arcPercent 0.75 = min33.75 o min45?**
   - Cosa sappiamo: `CFG.MACRO.concertDurationSec = 2700` (45min), quindi arcPercent 0.75 = min33.75. CONTEXT.md dice "~min45 su 60min".
   - Cosa è unclear: il concerto dura 45min o 60min? Il seed return è intenzionalmente a min33.75?
   - Raccomandazione: Usare `CFG.MELODY.seedReturnAt = 0.75` come parametro configurabile, documentando la corrispondenza temporale (min33.75 su 45min). Il performer può aggiustare in pre-concert.

2. **CH6 differenziazione da CH5**
   - Cosa sappiamo: D-03 dice CH6 genera melodia indipendente, non canone di CH5. L'implementazione interna è a discrezione.
   - Cosa è unclear: Quanto distante deve essere CH6 da CH5? Range di ottave diverso? Pesi Markov diversi?
   - Raccomandazione: CH6 inizia con range un'ottava sopra CH5 (min: C4=60 vs C3=48 di CH5) e pesi Markov con minor preferenza per movimento per grado — da calibrare con ascolto.

3. **HarmonyLayer CH3 + MelodyTextureLayer CH3 — test ascolto**
   - Cosa sappiamo: entrambi i layer inviano su CH3 con caratteri diversi (lento/strutturale vs veloce/melodico).
   - Cosa è unclear: suona bene o crea conflitto di registro al sintetizzatore hardware?
   - Raccomandazione: Il piano include un task esplicito di "test ascolto CH3" dopo l'implementazione base, con rollback strategy se il conflitto è problematico.

---

## Environment Availability

Step 2.6: SKIPPED — fase di puro sviluppo codice sorgente. Nessuna dipendenza esterna oltre a browser Chrome/Edge con WebMIDI (già verificato funzionante nelle fasi precedenti).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Manual — no test framework. Browser test pages: test.html, sandbox.html |
| Config file | none |
| Quick run command | `python3 -m http.server 8282` → open http://localhost:8282 → toggle V3_MODE |
| Full suite command | Browser manual: osservare HUD debug, console.log, verifica output MIDI su hardware |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MELO-01 | Seed catturato nei primi 5min, riappare riconoscibile a arcPercent > 0.75 | manual | `console.log('[MELODY] seed captured:', _seedMotif)` e `'[MELODY] seed returned at:', arcPercent` | ❌ Wave 0 — aggiungere log in melody-texture-layer.js |
| MELO-02 | CH3/CH5/CH6 non si allineano mai in 1h di performance | manual + math | LCM verification (sopra), ascolto 10min con CH isolati | ❌ Wave 0 — verificare via console: `_clockCH3 % 7`, `_clockCH5 % 11`, `_clockCH6 % 13` |
| MELO-03 | Drone root sempre presente durante fasi arhitmiche e dissoluzione | manual | Osservare CH2 output su MIDI monitor, verificare che HarmonyLayer non gati CH2 | ✅ HarmonyLayer usa `_rawSend` diretto per drone (bypassa gating harmonicColor — linea 111) |

### Wave 0 Gaps

- [ ] `melody-texture-layer.js` — file da creare (il modulo intero)
- [ ] `CFG.MELODY` sezione in `config.js` — da aggiungere
- [ ] `main.js` imports + `initMelodyTextureLayer()` + `updateMelodyTextureLayer(dt)` nel routing V3_MODE

*(Nessun test framework da installare — progetto usa test manuale via browser)*

---

## Project Constraints (from CLAUDE.md)

Direttive estratte da `/Users/Edo_1/MACH-INE II/CLAUDE.md` e `/Users/Edo_1/MACH-INE II/MACH:INE II/CLAUDE.md`:

| Constraint | Impact su Phase 3 |
|------------|------------------|
| Zero npm, zero build — ES modules nativi | `melody-texture-layer.js` usa solo `import` — nessuna libreria esterna |
| No Node.js runtime — browser Chrome/Edge | Il modulo gira nel Worker thread come tutti i layer v3 |
| `python3 -m http.server 8282` per servire | Nessun impatto su implementazione |
| Tutti i parametri numerici in `config.js` CFG | `CFG.MELODY` obbligatorio — zero magic numbers nel codice |
| `sendMIDINote(ch, note, vel, dur)` API unica | Tutti gli output MIDI passano per questo wrapper |
| Files under 500 lines | `melody-texture-layer.js` deve stare sotto 500 righe |
| ALWAYS read file before editing | Prima di modificare `config.js` e `main.js`, leggerli completamente |
| Do what has been asked; nothing more | Non aggiungere CC automation, visual system, o altre feature non in scope |
| Codice e variabili in inglese, commenti musicali in italiano | Nomi variabili: `_seedMotif`, `_clockCH5` — commenti: "// voce melodica con memoria" |
| Aree protette: main.js / render.js / director.js | `main.js` modificato solo per aggiungere le 3 righe di integration — diff minimo |
| NEVER save files to root folder | `melody-texture-layer.js` va in `/src/` |
| Piccoli edit sicuri, mai riscritture monolitiche | Config.js: solo aggiunta `MELODY:{}` sezione, nessun cambio ai valori esistenti |

---

## Sources

### Primary (HIGH confidence)

- `/Users/Edo_1/MACH-INE II/MACH:INE II/src/rhythm-layer.js` — template architetturale verificato: step clock pattern, gating, hat phasing con lunghezze prime, `_gaussianRand()`
- `/Users/Edo_1/MACH-INE II/MACH:INE II/src/composer.js` righe 150-206 — `nextVoiceNote()`, `motifIntervals`, Markov chain pesata: reference diretta per CH5/CH6
- `/Users/Edo_1/MACH-INE II/MACH:INE II/src/harmony-layer.js` — gating pattern via `harmonicColor`, `applyVoiceLeading()`, uso di `_rawSend` diretto per drone (CH2 always-on)
- `/Users/Edo_1/MACH-INE II/MACH:INE II/src/macro-composer.js` — `macroState` exports: `melodicActivity`, `arcPercent`, `currentMode`, `barClock`, `droneRoot`
- `/Users/Edo_1/MACH-INE II/MACH:INE II/src/config.js` — `CFG.MACRO.modes`, `CFG.MACRO.droneRoot`, `CFG.MACRO.checkpoints`, `CFG.MACRO.bpmReference = 88`
- `/Users/Edo_1/MACH-INE II/MACH:INE II/src/main.js` righe 242-293 — routing V3_MODE in `midiWorker.onmessage`, integration point confermato
- `.planning/phases/03-melodylayer-e-texturelayer/03-CONTEXT.md` — decisioni locked D-01…D-12

### Secondary (MEDIUM confidence)

- `.planning/REQUIREMENTS.md` §MELO-01/02/03 — requisiti formali di fase
- `.planning/STATE.md` — decisioni accumulate fasi precedenti (pattern phaseThresholds, velFloor, phasing)
- `MACH:INE II/.claude/skills/composition-depth/SKILL.md` — principi compositivi: silenzio come strumento, evoluzione lenta, poliritmia da cicli primi

---

## Metadata

**Confidence breakdown:**

- Standard Stack: HIGH — nessuna libreria esterna, solo pattern già nel codebase
- Architecture Patterns: HIGH — tutti derivati da codice esistente in produzione (rhythm-layer.js, composer.js, harmony-layer.js)
- Pitfalls: HIGH — basati su analisi del codice effettivo e discrepanze misurabili (arcPercent timing, Worker no-setTimeout, seed capture window)
- Integration Points: HIGH — codice di integrazione letto direttamente (main.js righe 242-293, harmony-layer.js CH3 uso)

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stabile — nessuna dipendenza esterna da monitorare)
