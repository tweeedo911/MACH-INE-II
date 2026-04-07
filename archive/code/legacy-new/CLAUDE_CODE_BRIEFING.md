# MACHINE II — Claude Code Briefing
*Sessione: 2026-03-23 | Da incollare all'inizio di ogni sessione con Claude Code*

---

## Sei in Cowork Mode su MACH:INE II

Leggi RULES.md, DESIGN.md, MUSIC.md, COMPOSER.md prima di toccare qualsiasi file.
Workflow obbligatorio: Piano → Approvazione → Esecuzione → Verifica.
Snapshot in `versions/` prima di ogni modifica non banale.

---

## Stato attuale del codebase (v0.8.0)

### Architettura moduli (tutti ES modules, browser-native)

```
main.js          Boot, loop principale, wiring moduli
audio.js         Web Audio API — analisi RMS, flux, BPM, bande, onset
state.js         5 valori derivati dall'audio (intensity, rhythmicity, brightness, trajectory, stereoWidth)
director.js      Scene system, narrative arc, mutation system, camera
dna.js           DNA generativo — primitives, zones (Voronoi), freqMapping
generations.js   Entity lifecycle (nascita, vita, morte, fossili)
field.js         Halftone field renderer (Canvas 2D)
render.js        Main render loop, HUD, climax
colors.js        Palette system, chromatic shift, invert dissolve
midi-patterns.js MIDI→visual mapping (5 canali, shapes: pulse/column/band/trail/scatter)
config.js        CFG — tutti i parametri numerici in un posto
```

**NON ESISTE ANCORA:** `composer.js` — il sequencer generativo autonomo

---

## Il Director — come funziona oggi

Il Director ha un arco audio-reattivo in 6 stati:
```
SILENCE → BUILDING → ACTIVE → INTENSE → PEAK → DECAY
```
Transizioni guidate da soglie RMS/flux (tutte in CFG).
Ha isteresi (`_stateHold`) per evitare flickering.

Export usabili da composer.js:
```js
import { setArcPhase, executeMutation, setFraming, arc, scene, framing } from './director.js'
// setArcPhase('SILENCE' | 'BUILDING' | 'ACTIVE' | 'INTENSE' | 'PEAK' | 'DECAY')
// executeMutation(forceType, globalTime) — forceType: 'PRIMITIVE'|'RESET_PARTIAL'|'CHROMATIC'|'SCENE'
// setFraming('WIDE' | 'MEDIUM' | 'MACRO' | 'DRIFT', W, H)
```

**ATTENZIONE:** composer.js deve OVERRIDARE l'arco audio-reattivo durante la modalità autonoma,
non affiancarlo — altrimenti i due sistemi si combattono.
Quando il Composer è attivo, `arc._stateHold` deve essere impostato a 999 per bloccare
le transizioni automatiche basate sull'audio.

---

## Il sistema MIDI esistente (midi-patterns.js)

5 canali con mappatura visiva fissa:

| ch | Ruolo | Shape | Mapping visivo |
|----|-------|-------|----------------|
| 0  | KICK  | pulse | Flash FF4400, Y random, X spread su 3 punti |
| 1  | BASS  | column | Colonna verticale, larghezza=velocity, Y=pitch |
| 2  | HARMONY | band | Banda orizzontale, altezza=densità accordale |
| 3  | LEAD  | trail | Trail pitch→X, velocity→spessore, decay lento |
| 4  | TEXTURE | scatter | Granuli random, dimensione modulata da high/air |

**Il canale 5 non esiste ancora** — va aggiunto in midi-patterns.js per RUPTURE.
Shape suggerita: 'rupture' — scatter ad alta velocità, colore C (#E6007E), decay rapidissimo.

Funzioni usabili da composer.js:
```js
import { triggerMIDI } from './generations.js'
// triggerMIDI(state, colorEnabled, noteNorm, velNorm)
// noteNorm: 0–1 (pitch normalizzato), velNorm: 0–1
// Spawna entità colorate B attorno alla posizione pitch/velocity
```

---

## DNA e Zones

Il DNA è generato una volta per ciclo con `generateDNA()`.
Contiene 2–3 primitivi attivi (BANDA, BLOCCO, VETTORE, VUOTO, FRONTE, SCIAME, STRISCIA, MATRICE).
Le zone sono Voronoi con 6 archetipi: SOLIDO, GRANA GROSSA, RITMICO, RAREFATTO, CROMATICO, DENSO MEDIO.

**Integrazione Composer→DNA:**
Il Composer deve leggere `dna.primitives` per adattare il carattere musicale al DNA visivo corrente.
Esempio: se 'VUOTO' è attivo → T5 VOICE usa pause più lunghe (la legge del vuoto si rispecchia).
Se 'SCIAME' è attivo → T3 GRAIN usa pattern più fitti e ravvicinati.

---

## Il sistema dei colori (colors.js / generations.js)

3 colori semantici, usati con regole precise:

| ID | Hex | Trigger musicale | Trigger visivo |
|----|-----|-----------------|----------------|
| A  | #FF4400 | Onset, kick, beat T2 PULSE | `triggerOnset()` — contaminazione colore A |
| B  | #00AACC | Note MIDI, armonia | `triggerMIDI()` — entità B attorno al pitch |
| C  | #E6007E | SOLO T7 RUPTURE TAKEOVER | `inClimax=true` in `updateGenerations()` |

**INVARIANTE ASSOLUTA:** il colore C si attiva SOLO quando composer emette RUPTURE in TAKEOVER.
Non deve mai attivarsi per altri motivi quando il Composer è in modalità autonoma.
Implementazione: composer setta `colorEnabled.C = true` solo durante TAKEOVER, mai altrimenti.

---

## Il sistema delle entità (generations.js)

Le entità nascono, vivono e muoiono. I fossili persistono brevemente dopo la morte.
Entity grid: spatial hash 32px per il rendering ottimizzato.

**Integrazione Composer:**
- `triggerOnset(state, colorEnabled)` → burst di entità A ad ogni beat T2 PULSE
- `triggerMIDI(state, colorEnabled, noteNorm, velNorm)` → entità B per ogni nota di T5/T6
- Durante GERMOGLIO: `state.intensity` deve essere basso (< 0.15) per mantenere il campo rarefatto
  Il composer inietta valori in `state` direttamente — NON usa l'audio reale in modalità autonoma

---

## Come composer.js deve integrarsi in main.js

```js
// main.js — aggiungere dopo gli import esistenti
import { initComposer, updateComposer, composerState } from './composer.js'

// Nel boot (dopo initDirector):
if (CFG.COMPOSER.enabled) initComposer()

// Nel loop:
if (CFG.COMPOSER.enabled) updateComposer(dt, globalTime)
// updateComposer DEVE chiamare setArcPhase() in base alla fase corrente
// E iniettare valori sintetici in `state` quando in modalità autonoma
```

---

## Mappatura COMPOSER→DIRECTOR (le 7 tracce → 6 stati arc)

```
T1 FIELD     → arc.phase = 'SILENCE'    (GERMOGLIO)
T2 PULSE off → arc.phase = 'BUILDING'   (inizio PULSAZIONE)
T2 PULSE on  → arc.phase = 'ACTIVE'     (PULSAZIONE piena)
T6 CHORDS    → arc.phase = 'INTENSE'    (DENSITÀ)
T7 pre-TKOV  → arc.phase = 'INTENSE'    (DENSITÀ avanzata)
T7 TAKEOVER  → arc.phase = 'PEAK'       (ROTTURA)
T7 RESIDUO   → arc.phase = 'DECAY'      (DISSOLUZIONE)
```

---

## State injection — la chiave dell'integrazione

Quando il Composer è attivo in modalità autonoma, deve iniettare valori sintetici in `state`
invece di leggere l'audio reale. Questo mantiene coerenza tra musica e visual.

```js
// composer.js — esempio
function injectState(phase, presence) {
  state.intensity   = presenceToIntensity(phase, presence)
  state.rhythmicity = phase === 'germoglio' ? 0 : presence * 0.9
  state.brightness  = PHASE_BRIGHTNESS[phase]
  state.trajectory  = computeTrajectory(phase)  // +1 building, 0 plateau, -1 decay
  // stereoWidth rimane dall'audio reale — non sovrascrivere
}
```

---

## CFG — parametri da aggiungere in config.js

```js
// Aggiungere in config.js nella sezione appropriata
COMPOSER: {
  enabled: false,              // attivato da HUD o URL param ?composer=1
  bpm: 116,
  phaseDurations: { germoglio:40, pulsazione:60, densita:90, rottura:30, dissoluzione:80 },
  transitionOverlap: 12,
  euclidean: { normal:[3,8], rottura:[5,8] },
  chordRhythm: { germoglio:16, pulsazione:4, densita:2, rottura:1, dissoluzione:10 },
  markov: { depth:2, pivotWeight:1.7, biasWeight:2.2, directionWeight:1.25 },
  voiceLeadingMax: 2,
  minSilenceRatio: 0.4,
  rupture: { presageThreshold:0.62, infiltrationThreshold:0.75, takeoverEnd:0.4,
             silenceMin:4, silenceMax:6 },
  mutation: { droneDriftCycles:3, euclideanDriftEvery:1, modeDriftCycles:4 },
  dissolution: { highNoteThreshold:76, highNotePresence:0.25 }
}
```

---

## Struttura file da creare/modificare

```
CREARE:   src/composer.js        — il sequencer generativo (~300 righe)
MODIFICARE: src/config.js        — aggiungere CFG.COMPOSER
MODIFICARE: src/main.js          — import + init + update composer
MODIFICARE: src/midi-patterns.js — aggiungere ch 5 (RUPTURE shape)
MODIFICARE: src/director.js      — aggiungere setArcPhaseForced() che bypassa l'isteresi
```

---

## Sistema armonico del Composer (da implementare in composer.js)

### Modi per fase — arco D→A→Eb→D
```js
const MODES = {
  D_dorian:   { root:62, intervals:[0,2,3,5,7,9,10] },
  D_phrygian: { root:62, intervals:[0,1,3,5,7,8,10] },
  A_lydian:   { root:69, intervals:[0,2,4,6,7,9,11] },
  Eb_locrian: { root:63, intervals:[0,1,3,4,6,8,9]  },
}
const PHASE_MODE = {
  germoglio:'D_dorian', pulsazione:'D_phrygian',
  densita:'A_lydian', rottura:'Eb_locrian', dissoluzione:'D_dorian'
}
const PIVOT_PCS = new Set([62%12, 65%12, 69%12]) // D F A — in tutti i modi
```

### Markov chain 2° ordine per T5 VOICE
```js
function markov2(prev2, prev1, modeName, biasNotes=[]) {
  const notes = getScale(modeName)
  const weights = notes.map(n => {
    let w = 1 / (Math.abs(n - prev1) * 0.6 + 1)
    if (PIVOT_PCS.has(n % 12)) w *= 1.7
    if (biasNotes.includes(n))  w *= 2.2
    if ((prev1-prev2) && (n-prev1)*(prev1-prev2) > 0) w *= 1.25  // continuità direzionale
    return w
  })
  // weighted random pick
}
```

### Voice leading T6 CHORDS
```js
// Scegli l'inversione della triade con movimento minimo da prev_chord
function voiceLead(prevChord, newChordNotes) {
  const inversions = getInversions(newChordNotes)
  return inversions.reduce((best, inv) =>
    totalMovement(inv, prevChord) < totalMovement(best, prevChord) ? inv : best
  )
}
```

---

## DNA→Composer binding (feature opzionale v0.3.0)

```js
// Se il DNA corrente contiene certi primitivi, il Composer adatta il comportamento
const DNA_MUSIC_MAP = {
  VUOTO:   { voicePauseMultiplier: 2.0 },  // pause più lunghe in T5
  SCIAME:  { grainDensityMul: 1.8 },        // T3 GRAIN più fitto
  BANDA:   { chordHoldMul: 1.5 },           // T6 CHORDS tiene più a lungo
  FRONTE:  { tensionGlide: true },          // T4 TENSION usa portamento
  VETTORE: { melodyDirectionBias: 0.6 },    // T5 VOICE tende verso l'alto/basso
  MATRICE: { rupturePitchGrid: true },      // T7 RUPTURE usa pitch della griglia
}
```

---

## Regole operative (da RULES.md)

1. Prima di ogni modifica non banale: descrivi il piano e aspetta "sì, vai"
2. Prima di modificare un file esistente: snapshot in `versions/`
3. Commit: `vX.Y.Z descrizione breve` — aggiorna CHANGELOG.md
4. Zero magic numbers: tutto in CFG
5. Non toccare senza discussione: loop render, history buffer, onset detection
6. Codebase in inglese — documentazione in italiano
