# MACH:INE II — Composer Notes
*Ultima modifica: 2026-03-23*

---

## Obiettivo

Il sistema deve generare composizioni MIDI originali coerenti con l'estetica di MACH:INE II.
Non deve creare tracce dimostrative o pattern neutrali. Deve creare mondi musicali.

Ogni composizione è un organismo ciclico: non finisce, si rinnova.
I layer hanno lunghezze di ciclo diverse e prime tra loro — non si riallineano mai nello stesso punto.
Ogni ascolto è tecnicamente unico anche se il materiale di base è simile.

La nuova specifica prevale sulle decisioni precedenti in caso di conflitto.

---

## Principi non negoziabili

1. Il composer genera **identità**, non semplici note.
2. La dinamica deve essere insieme **musicale e narrativa**: pieni, vuoti, sospensione, climax, ripartenza.
3. Ogni layer ha un ruolo funzionale stabile e non intercambiabile.
4. Ogni crescita di densità deve produrre un vuoto da qualche altra parte.
5. Ogni ritorno dopo un climax deve ripartire da materiale mutato, non da una copia del ciclo precedente.
6. La Rupture non è un effetto: è una forza di corruzione strutturale.
7. Il sistema deve poter durare indefinitamente senza entrare in loop percettivamente identici.

---

## Invarianti del sistema

Questi elementi restano obbligatori:

- arco globale a 5 fasi: `INTRO -> DEVELOP -> TENSION -> CLIMAX -> RELEASE`
- Rupture in 4 stadi: `PRESAGIO -> INFILTRAZIONE -> TAKEOVER -> RESIDUO`
- centro modale stabile per ogni composizione
- densità costruita per stratificazione, non per accumulo indiscriminato
- memoria del materiale dopo i picchi
- continuità tra gesto musicale e gesto visivo

Non è consentito:
- climax costante
- pieno permanente
- risoluzione tonale prevedibile
- tutti i layer attivi allo stesso livello per troppo tempo
- rupture come burst isolato non preparato

---

## Modello tecnico globale

Il motore compositivo deve essere trattato come una **state machine musicale** con budget condivisi.

### Stato globale minimo

```js
composerState = {
  phase,                // INTRO | DEVELOP | TENSION | CLIMAX | RELEASE
  phaseTimeSec,
  barsElapsed,
  totalTimeSec,
  densityBudget,        // 0..1
  silenceBudget,        // 0..1
  tension,              // 0..1
  harmonicStability,    // 0..1
  dissonanceBudget,     // 0..1
  memorySeed,
  restartIndex,
  ruptureStage,         // OFF | OMEN | INFILTRATION | TAKEOVER | RESIDUE
  rupturePresence,      // 0..1
  corruptionAmount,     // 0..1
  dominantLayer,
  lastPeakTimeSec,
  postClimaxRecovery
}
```

### Regola di precedenza

Quando una regola nuova entra in conflitto con una regola precedente, vince la nuova regola definita in questo documento.

---

## Leggi compositive dure

### 1. Legge dei tempi indipendenti
Ogni layer deve muoversi su una scala temporale propria.
Non è consentito che tutti i layer condividano la stessa granularità ritmica per lunghi periodi.

```js
layerTimeScale = {
  kick:   'subBeat | beat',
  bass:   '2..8 bars',
  harmony:'8..24 sec',
  lead:   'phrase + silence',
  drone:  '30..120 sec',
  grain:  'micro-pattern',
  rupture:'narrative event'
}
```

### 2. Legge del budget di densità
Ogni fase ha un `densityBudget` globale.
La somma della densità dei layer attivi non deve superare il budget, salvo brevi eccezioni in CLIMAX.
Se un layer cresce, almeno uno degli altri deve ridursi.

```js
sum(layer.currentDensity) <= phaseDensityCap + climaxOverflowAllowance
```

### 3. Legge del silenzio strutturale
Il silenzio è materiale compositivo.
Il sistema deve schedulare finestre di vuoto reali, non semplici cali di velocity.

Vincoli minimi:
- `LEAD soundToSilenceRatio >= 1:3`, target `1:4`
- `DRONE gapBetweenNotes >= 2 sec`
- `postClimaxVoid >= 4 sec` su almeno 2 layer principali

### 4. Legge degli incastri
Lead, Grain e Rupture non devono accentare gli stessi istanti troppo spesso.
Usare una penalità di sovrapposizione per ridurre attacchi simultanei.

```js
overlapPenalty(layerA, layerB, t) -> 0..1
```

Coppie da monitorare con priorità alta:
- `lead <-> grain`
- `lead <-> rupture`
- `grain <-> kick`

### 5. Legge della sospensione armonica
L'armonia non deve chiarire subito il centro.
Dopo ogni cambio accordo, il basso può confermare l'accordo solo parzialmente o in ritardo.

Vincoli:
- evitare cadenze tonali forti
- privilegiare voicing aperti
- muovere 1 voce per volta quando possibile
- la tonica non deve stare sempre nel basso

### 6. Legge della memoria
Ogni nuova fase deve conservare almeno 1 tratto della fase precedente.
Il tratto può essere:
- un intervallo caratteristico
- una nota pivot
- un voicing
- un pattern ritmico ridotto
- una distribuzione di registro

```js
memorySeed = {
  pitchClassAnchor,
  intervalCell,
  rhythmCell,
  voicingShape,
  contourType
}
```

### 7. Legge della contaminazione
La Rupture deve alterare gli altri layer, non limitarsi ad aggiungere eventi propri.
L'effetto della corruzione può agire su:
- pitch deviation
- timing displacement
- shortening/fragmentation
- register shift
- mute probability

### 8. Legge della ripartenza
Dopo ogni climax il sistema deve svuotarsi davvero e poi ripartire.
La ripartenza non riusa il ciclo identico precedente.

Vincoli:
- `postClimaxDensity <= 0.45 * preClimaxPeakDensity`
- mantenere solo 1–2 elementi di memoria
- introdurre almeno 1 mutazione strutturale prima del nuovo DEVELOP

---

## Centro tonale e grammatica armonica

### Centro di default
**C# Dorian** come centro modale di default.

```txt
C# Dorian = C# D# E F# G# A# B
```

Note cromatiche permesse come colore:
- `E major` come deviazione luminosa e instabile
- `Bb` come contaminazione della Rupture
- `G` e `D` come instabilità del drone

Il sistema può modulare localmente ma deve tornare a C# come centro gravitazionale.
Se un preset dichiara un altro centro, deve comunque rispettare le stesse leggi compositive.

### Regole armoniche operative

```js
harmonyRules = {
  maxChordChangeRateSec: [8, 24],
  voiceLeadingMaxSemitones: 3,
  rootAmbiguity: 0.65,
  cadenceProbability: 0.08,
  chordCompletenessBias: 'open_or_incomplete',
  dissonanceBudgetByPhase: {
    INTRO: 0.12,
    DEVELOP: 0.28,
    TENSION: 0.55,
    CLIMAX: 0.85,
    RELEASE: 0.22
  }
}
```

### Pool armonico consigliato (default C# Dorian)

- `C#m7`  = C# E G# B
- `F#m7`  = F# A C# E
- `Emaj7` = E G# B D#
- `Amaj7` = A C# E G#
- `C#m/E` = E G# C#
- `Dmaj7` = D F# A C#  // colore
- `E`     = E G# B     // deviazione cromatica controllata

Regole sul voicing:
- preferire primo e secondo rivolto
- evitare stato fondamentale stretto come default
- distanza minima tra basso e voce alta: una decima quando possibile
- evitare raddoppi sistematici della tonica

---

## Architettura dei layer

```txt
CH1  KICK     T2 PULSE      impulso metrico
CH2  BASS     T4 TENSION    gravità modale
CH3  HARMONY  T6 CHORDS     accordi sospesi
CH4  LEAD     T5 VOICE      frammento cosciente
CH5  DRONE    T1 FIELD      spazio fisico / memoria lunga
CH6  GRAIN    T3 GRAIN      texture ritmica / erosione
CH7  RUPTURE  T7 RUPTURE    corruzione narrativa
```

### CH1 — KICK / PULSE
```js
{
  role: 'metric engine',
  activeIn: ['DEVELOP', 'TENSION', 'CLIMAX'],
  velocityRange: [80, 110],
  durationSec: [0.015, 0.03],
  syncBias: 0.9,
  breakbeatAllowed: false,
  densityWeight: 0.22,
  decay: 0.78
}
```
Regole:
- in DEVELOP/TENSION non deve sparire del tutto
- può rarefarsi in RELEASE
- nei preset lenti può essere implicito o molto diradato, ma non casuale

### CH2 — BASS / TENSION
```js
{
  role: 'modal gravity',
  cycleBars: [4, 8],
  velocityRange: [60, 90],
  noteDurationSec: [2, 8],
  preferredMotion: ['P4', 'P5', 'm7'],
  chromaticMotionBias: 0.1,
  rootBias: ['C#', 'F#', 'G#'],
  decay: 0.997
}
```
Regole:
- non confermare sempre subito l'accordo corrente
- introdurre ritardi di conferma armonica
- evitare bassline troppo descrittive o funk

### CH3 — HARMONY / CHORDS
```js
{
  role: 'harmonic temperature',
  chordChangeSec: [10, 25],
  velocityRange: [40, 65],
  noteDurationSec: [10, 25],
  voicingSpreadSemitonesMin: 16,
  chordFragmentationInClimax: true,
  decay: 0.981
}
```
Regole:
- accordi lenti, respirati
- in CLIMAX possono frammentarsi invece di crescere solo in volume
- in RELEASE devono tornare più fermi, non più ricchi

### CH4 — LEAD / VOICE
```js
{
  role: 'intermittent consciousness',
  phraseLenNotes: [2, 4],
  shortNoteSec: [0.2, 0.45],
  longNoteSec: [1.5, 3.0],
  silenceAfterPhraseSec: [3, 8],
  soundToSilenceTarget: 0.25,
  preferredArrivalIntervals: ['m7', 'M2'],
  tonicResolutionBias: 0.05,
  decay: 0.984
}
```
Regole:
- non può essere una melodia continua
- ogni frase deve essere variante della precedente, non copia
- dopo il climax il lead deve diventare più raro, non più espressivo

### CH5 — DRONE / FIELD
```js
{
  role: 'long memory',
  noteDurationSec: [30, 90],
  gapSec: [2, 6],
  velocityRange: [15, 28],
  outOfScaleNotesAllowed: ['G', 'D', 'Bb'],
  introMutationLocked: true,
  releaseMutationLocked: true,
  decay: 0.999
}
```
Regole:
- è il layer più lento
- non deve riempire tutte le frequenze
- deve poter sopravvivere quasi solo dopo il climax

### CH6 — GRAIN / TEXTURE
```js
{
  role: 'rhythmic erosion',
  stepCyclePrimeLengths: [13, 17, 19],
  velocityRange: [100, 115],
  noteDurationSec: [0.04, 0.12],
  activeIn: ['DEVELOP', 'TENSION', 'CLIMAX'],
  overlapPenaltyWeight: 0.7,
  regularGridBias: 0.2,
  decay: 0.91
}
```
Regole:
- non deve diventare hi-hat standard
- deve creare attrito e articolazione del vuoto
- in INTRO e RELEASE deve essere assente o quasi nullo

### CH7 — RUPTURE
```js
{
  role: 'structural corruption',
  entersAfterProgress: 0.5,
  decay: 0.88,
  corruptionTargets: ['bass', 'harmony', 'lead', 'grain'],
  corruptionModes: ['pitch', 'timing', 'fragment', 'register', 'mute'],
  canSilenceOthers: false,
  canOverwhelmOthers: true
}
```

#### Stadi obbligatori

```js
ruptureStages = {
  OMEN: {
    noteCount: [3, 6],
    velocityRange: [15, 30],
    offGridBias: 0.9,
    notes: ['Bb', 'F', 'F#'],
    durationShare: [0.20, 0.30]
  },
  INFILTRATION: {
    burstLen: [2, 4],
    velocityRange: [35, 55],
    register: ['E4', 'B5'],
    durationShare: [0.15, 0.20]
  },
  TAKEOVER: {
    velocityRange: [70, 127],
    register: ['E5', 'D6'],
    irregularity: 0.9,
    durationShare: [0.10, 0.15],
    corruptionAmountTarget: 1.0
  },
  RESIDUE: {
    noteCount: [4, 7],
    velocityFallTo: 20,
    sparseTail: true
  }
}
```

Regole:
- la Rupture deve essere memorizzabile prima del takeover
- nel takeover gli altri layer continuano, ma deformati o sopraffatti
- il residuo deve lasciare almeno una modifica persistente dopo il climax

---

## Ciclo infinito e sfasamento

Le composizioni devono rigenerarsi senza chiudersi in un loop percettivo identico.

### Regola di sfasamento
Ogni layer usa un ciclo differente e preferibilmente primo.

```js
cycleConfig = {
  bassBars: 11,
  harmonyBars: 17,
  leadBars: 7,
  droneBars: 19,
  grainSteps: 13,
  ruptureWindowBars: 23
}
```

### Regole operative
- evitare reset simultanei dei pattern
- consentire sincronizzazioni parziali come eventi rari
- ogni ripartenza deve cambiare almeno uno tra: `memorySeed`, `register focus`, `dissonanceBudget`, `grain cycle`

---

## Arco narrativo operativo

```js
phaseRules = {
  INTRO: {
    densityCap: 0.25,
    silenceBudget: 0.75,
    activeLayers: ['harmony', 'drone'],
    ruptureEnabled: false
  },
  DEVELOP: {
    densityCap: 0.58,
    silenceBudget: 0.42,
    activeLayers: ['kick', 'bass', 'harmony', 'lead?', 'drone'],
    ruptureEnabled: false
  },
  TENSION: {
    densityCap: 0.78,
    silenceBudget: 0.28,
    activeLayers: ['kick', 'bass', 'harmony', 'lead', 'drone', 'grain'],
    ruptureEnabled: true,
    ruptureStage: 'OMEN | INFILTRATION'
  },
  CLIMAX: {
    densityCap: 1.00,
    silenceBudget: 0.08,
    activeLayers: ['all'],
    ruptureStage: 'TAKEOVER'
  },
  RELEASE: {
    densityCap: 0.35,
    silenceBudget: 0.65,
    activeLayers: ['bass?', 'harmony', 'drone', 'rupture(residue)'],
    ruptureStage: 'RESIDUE'
  }
}
```

### Transizioni minime
- `INTRO -> DEVELOP`: dopo tempo minimo o accumulo di intensità
- `DEVELOP -> TENSION`: dopo consolidamento metrico + aumento tensione
- `TENSION -> CLIMAX`: dopo durata minima della infiltrazione o soglia di tensione
- `CLIMAX -> RELEASE`: solo dopo collasso reale della densità
- `RELEASE -> DEVELOP`: solo dopo recupero parziale e mutazione strutturale

---

## Preset stilistici

I preset possono cambiare BPM, swing, densità, durata delle fasi e aggressività della Rupture, ma non possono violare le leggi compositive dure.

```js
presetAxes = {
  bpm,
  swing,
  droneLength,
  chordRate,
  grainRegularity,
  ruptureAggression,
  silenceBias,
  dissonanceBias
}
```

Ogni preset deve dichiarare esplicitamente:
- `modeCenter`
- `phaseDurations`
- `densityCurve`
- `silenceCurve`
- `ruptureProfile`
- `memoryRetention`

---

## Funzioni da implementare

Minimo indispensabile:

```js
allocateDensityBudget(composerState, layers)
scheduleSilenceWindows(composerState, layers)
generateBassGravity(composerState, layerState)
generateChordVoicing(composerState, layerState)
generateLeadFragments(composerState, layerState)
applyInterlockPenalty(events, composerState)
advanceRuptureStage(composerState)
applyRuptureCorruption(events, composerState)
carryMemoryIntoNextPhase(composerState, prevPhaseData)
restartFromMutatedMemory(composerState)
```

---

## Regola fondamentale

Ogni composizione generata deve sembrare musicalmente appartenente allo stesso universo di MACH:INE II.
Il composer non produce uno stile qualsiasi. Produce varianti interne di una stessa cosmologia.

La differenza tra due composizioni non deve derivare dalla sostituzione dell'identità del sistema,
ma dalla diversa distribuzione di:
- vuoti
- densità
- gravità armonica
- memoria
- contaminazione
- intensità della Rupture

---

## Non si cambia senza discussione

- arco narrativo in 5 fasi
- Rupture in 4 stadi
- uso di budget condivisi (`densityBudget`, `silenceBudget`, `dissonanceBudget`)
- tempi indipendenti dei layer
- principio di memoria + contaminazione + ripartenza mutata
- assenza di climax costante
- assenza di pieno permanente
