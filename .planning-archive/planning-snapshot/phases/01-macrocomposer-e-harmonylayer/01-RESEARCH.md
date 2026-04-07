# Phase 1: MacroComposer e HarmonyLayer - Research

**Researched:** 2026-03-27
**Domain:** Generative music composition — 4D narrative arc, modal harmony, MIDI voice leading, ES module integration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Arc 4D — Struttura temporale**
- D-01: Timeline macroscopica fissa e precomposta: array di checkpoint in config (percentuale del concerto → valori 4D target per `rhythmicDensity`, `harmonicColor`, `melodicActivity`, `textureDepth`). Il MacroComposer interpola tra checkpoint con easing curvo (non lineare).
- D-02: Dentro ogni segmento tra checkpoint, i valori oscillano ±5-10% attorno al target con EMA smoothing — variazione microgenerativa che evita l'effetto plateau.
- D-03: I picchi delle 4 dimensioni sono staggered: `harmonicColor` ~min28, `density` ~min33, `rhythmicDensity` ~min38 — mai simultanei.
- D-04: MARC-03 (false-resolution ~min35): checkpoint esplicito nell'array che porta `rhythmicDensity` a 0 per 8 bar, poi rientra a valore superiore al precedente.

**Integrazione V3_MODE**
- D-05: MacroComposer e HarmonyLayer sono moduli aggiuntivi (`src/macro-composer.js`, `src/harmony-layer.js`). Non sostituiscono nulla — si aggiungono.
- D-06: In `main.js`, nel blocco `midiWorker.onmessage`, il routing è condizionato da `CFG.V3_MODE`: quando `false` chiama `updateComposerN()` come prima; quando `true` chiama `updateMacroComposer()` + `updateHarmonyLayer()`.
- D-07: Il `sequencer.js` esistente sopravvive invariato — il MacroComposer lo legge per ricavare `elapsedTime` / `arcProgress`. Non lo rimpiazza.
- D-08: I `composer*.js` rimangono intatti. Usabili come reference sonora e come fallback immediato (flip `V3_MODE: false`).
- D-09: `presence-multiplier.js` non viene toccato — HarmonyLayer gestisce il proprio gating interno basato su `harmonicColor` dal MacroComposer.

**Transizioni modali**
- D-10: Sequenza modale: A Lydian → Bb Phrygian → D Dorian → C# Dorian → E Phrygian → A Lydian.
- D-11: Al cambio di modo, finestra pivot di 1 bar: il voicing converge cromaticamente verso la nota condivisa tra i due modi prima di espandersi nel nuovo modo. Voice leading ≤3 semitoni (HARM-04) si soddisfa naturalmente in questo modello.
- D-12: Le transizioni modali sono time-based (determinate dalla percentuale d'arco nel MacroComposer), non event-based.

**Voicings CH2/CH4**
- D-13: Per ogni modo definito, sono autorizzati manualmente 3-4 "anchor" voicings — i voicings strutturali per apertura, pivot, e picco del segmento. Scritti esplicitamente in config come array di `{ note, velocity }`.
- D-14: Tra gli anchors il HarmonyLayer genera algoritmicamente rispettando: root/quinta in CH3 (basso), upper structure un nono sopra in CH2 (pads, HARM-03), voice leading ≤3 semitoni (HARM-04), pentatonica + 10-15% nota cromatica con risoluzione verso il basso (HARM-05).
- D-15: Il drone root (A o D) è sempre presente su CH2 come anchor armonico condiviso tra tutti i layer — HARM-01 soddisfatto strutturalmente.
- D-16: Il modal interchange (HARM-02) avviene tramite i checkpoint dell'arco — il modo cambia il carattere emotivo senza spostare il root anchor.

### Claude's Discretion
- Scelta dei valori numerici esatti per gli anchor voicings (note MIDI, velocity) — da determinare durante implementazione con ascolto.
- Curva di easing per l'interpolazione tra checkpoint 4D (cubic, smooth-step, o custom).
- Frequenza di aggiornamento del HarmonyLayer (ogni N battute vs ogni bar vs ogni tick).

### Deferred Ideas (OUT OF SCOPE)
- Director engine-identity resolution per layer multipli simultanei — appartiene a Phase 4
- CC automation (CC7/CC11/CC74) per macro dinamiche — appartiene a Phase 2 (v2 requirements CC-01/CC-02)
- HUD performer con warning next-cue — appartiene a Phase 4 (DIFF-02)
- Arc position indicator visivo — appartiene a Phase 4 (DIFF-03)
- Harmonic memory store (DIFF-01) — da valutare in Phase 3
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MARC-01 | MacroComposer gestisce un arco narrativo 4D (rhythmicDensity, harmonicColor, melodicActivity, textureDepth) su 45-60 minuti | Checkpoint array in CFG + EMA smoothing — pattern identico a quello di state.js |
| MARC-02 | Picchi dimensionali staggered: armonia ~min28, densità ~min33, ritmo ~min38 — mai simultanei | Checkpoint array con picchi esplicitamente sfasati nei valori target |
| MARC-03 | False-resolution: calo completo della percussione per 8 bar a ~min35, poi reintroduzione a densità superiore | Checkpoint esplicito con `rhythmicDensity: 0` + durata fissa 8 bar prima della ripresa |
| HARM-01 | Tutti i layer condividono un root anchor (A o D) — incompatibilità cromatica eliminata strutturalmente | CH2 drone root sempre attivo; HarmonyLayer non invia mai note che escludono A o D come fondamentale |
| HARM-02 | Modal interchange sopra il drone root: il modo cambia carattere emotivo senza spostare la radice | Sequenza modale A→Bb→D→C#→E→A: A Lydian e D Dorian condividono entrambe come root candidate |
| HARM-03 | Upper-structure voicings (Floating Points): basso CH3 tiene root/quinta, accordo superiore diverso in CH2 un nono sopra | Anchor voicings scritti in config con note CH2 a distanza ≥9 semitoni dal CH3 bass |
| HARM-04 | Voice leading constraint: nessuna voce si sposta di più di 3 semitoni tra un accordo e il successivo | Finestra pivot 1 bar + algoritmo voice leading con maxLeap=3 applicato a CH4 |
| HARM-05 | Pentatonica + nota cromatica con probabilità 10-15% e risoluzione verso il basso (Four Tet) | Pool note = scale pentatonica del modo corrente + 1 nota cromatica; probabilità 0.10-0.15; risoluzione down = nota successiva in scala |
</phase_requirements>

---

## Summary

La fase costruisce due moduli ES module puri — `src/macro-composer.js` e `src/harmony-layer.js` — che si innestano nel worker loop esistente di `main.js` tramite il branch `CFG.V3_MODE`. Il MacroComposer è essenzialmente uno "score as data": un array di checkpoint in `CFG.MACRO` che descrive i valori target 4D in funzione della percentuale del concerto, interpolati con smooth-step e perturbati da EMA per la variazione microgestuale. Non ha BPM, non ha step sequencer — è un clock narrativo che si alimenta di `globalTime` esposto da `getSequencerStatus()`.

HarmonyLayer è il primo layer MIDI v3: emette note su CH2 (drone/pads) e CH4 (chords) leggendo il modo corrente e il livello `harmonicColor` dal MacroComposer. L'architettura interna replica il pattern `updateComposerN(dt)` già consolidato, con la stessa struttura di gating (`if (intensity < 0.05) return`). La chiave di progettazione è che HarmonyLayer non dipende da BPM né da step sequencer — decide quando suonare in base al tempo trascorso in bar (calcolato da un BPM di riferimento configurabile, default 88 bpm).

La maggiore complessità tecnica è il voice leading con ≤3 semitoni su CH4 attraverso cambi di modo: la soluzione è la finestra pivot di 1 bar in cui il voicing converge sulla nota pivot condivisa tra i due modi prima di espandersi nel nuovo set armonico. Il drone root su CH2 è il punto di continuità strutturale: A (MIDI 45/57/69) oppure D (MIDI 38/50/62) sempre presente come nota lunga (durata 7+ bar).

**Primary recommendation:** Implementare macro-composer.js come state machine pura (nessun output MIDI, solo stato 4D) e harmony-layer.js come consumer di quello stato. Separazione netta che permette di testare l'arco senza output MIDI e di sostituire HarmonyLayer in Phase 2+ senza toccare il MacroComposer.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ES Modules nativi | ES2020+ | Moduli senza bundler | Vincolo progetto CLAUDE.md |
| Canvas 2D / WebMIDI API | Browser native | Output MIDI via `sendMIDINote` | Già in uso — nessuna dipendenza esterna |
| Web Worker (midi-clock) | Browser native | MIDI tick loop isolato da GC | Già in Phase 0, struttura invariata |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| composition-utils.js | Locale (.claude/skills/) | `driftParameter()`, `phrasedPresence()` | Se si vuole usare le utility già scritte per EMA e drift — opzionale |

**Installation:** Nessuna installazione. Zero npm. I nuovi file sono `src/macro-composer.js` e `src/harmony-layer.js`, creati da zero come ES modules.

---

## Architecture Patterns

### Recommended Project Structure
```
MACH:INE II/src/
├── macro-composer.js    # NUOVO — stato 4D, checkpoint interpolation, nessun MIDI
├── harmony-layer.js     # NUOVO — MIDI output CH2/CH4, consuma MacroComposer state
├── config.js            # MODIFICATO — aggiunta CFG.MACRO con checkpoint e anchor voicings
├── main.js              # MODIFICATO — routing V3_MODE nel midiWorker.onmessage
└── [tutto il resto]     # INVARIATO
```

### Pattern 1: MacroComposer come State Machine Pura

**What:** Il MacroComposer non invia MIDI. Esporta solo uno stato 4D mutable che altri moduli leggono.
**When to use:** Ogni volta che si vuole separare la logica compositiva dall'output I/O.

```javascript
// src/macro-composer.js
import { CFG } from './config.js';
import { getSequencerStatus } from './sequencer.js';

// ── Stato 4D esportato (mutable, letto da harmony-layer.js e futuri layer) ──
export const macroState = {
  rhythmicDensity: 0,    // 0.0–1.0
  harmonicColor:   0,    // 0.0–1.0
  melodicActivity: 0,    // 0.0–1.0
  textureDepth:    0,    // 0.0–1.0
  currentMode:     'A_lydian',
  modeProgress:    0,    // 0.0–1.0 within current modal segment
  pivotActive:     false,
  pivotNote:       57,   // MIDI note pivot condivisa tra modi adiacenti
  arcPercent:      0,    // 0.0–1.0 del concerto
};

export function initMacroComposer() {
  // reset state
}

export function updateMacroComposer(dt) {
  const status = getSequencerStatus();
  if (!status.active) return;
  const arcPct = status.progress; // 0.0–1.0
  // ... interpolazione checkpoint + EMA drift + update macroState
}
```

### Pattern 2: Checkpoint Array in CFG

**What:** L'arco 4D è scritto come array di oggetti `{ pct, rhythmicDensity, harmonicColor, melodicActivity, textureDepth, mode }`. Il MacroComposer interpola linearmente tra checkpoint adiacenti, poi applica smooth-step.

**When to use:** Ogni volta che si vuole un arco temporale prevedibile ma non statico.

```javascript
// In CFG.MACRO (src/config.js)
MACRO: {
  concertDurationSec: 2700,   // 45 minuti = default
  bpmReference: 88,           // usato da HarmonyLayer per calcolare bar duration
  checkpoints: [
    // pct = percentuale del concerto (0.0–1.0)
    { pct: 0.00, rhythmicDensity: 0.0, harmonicColor: 0.1, melodicActivity: 0.0, textureDepth: 0.1, mode: 'A_lydian' },
    { pct: 0.10, rhythmicDensity: 0.1, harmonicColor: 0.3, melodicActivity: 0.1, textureDepth: 0.2, mode: 'A_lydian' },
    { pct: 0.28, rhythmicDensity: 0.4, harmonicColor: 1.0, melodicActivity: 0.5, textureDepth: 0.5, mode: 'Bb_phrygian' }, // harmonicColor PEAK ~min28
    { pct: 0.33, rhythmicDensity: 1.0, harmonicColor: 0.7, melodicActivity: 0.6, textureDepth: 0.6, mode: 'D_dorian' },    // density PEAK ~min33
    { pct: 0.35, rhythmicDensity: 0.0, harmonicColor: 0.5, melodicActivity: 0.3, textureDepth: 0.4, mode: 'D_dorian' },    // FALSE RESOLUTION start
    { pct: 0.37, rhythmicDensity: 0.0, harmonicColor: 0.5, melodicActivity: 0.3, textureDepth: 0.4, mode: 'D_dorian' },    // FALSE RESOLUTION hold 8 bar
    { pct: 0.38, rhythmicDensity: 1.2, harmonicColor: 0.6, melodicActivity: 0.7, textureDepth: 0.7, mode: 'C#_dorian' },   // rhythmicDensity PEAK ~min38
    { pct: 0.55, rhythmicDensity: 0.8, harmonicColor: 0.5, melodicActivity: 0.8, textureDepth: 0.8, mode: 'E_phrygian' },
    { pct: 0.75, rhythmicDensity: 0.5, harmonicColor: 0.3, melodicActivity: 0.5, textureDepth: 0.5, mode: 'E_phrygian' },
    { pct: 0.90, rhythmicDensity: 0.1, harmonicColor: 0.2, melodicActivity: 0.1, textureDepth: 0.2, mode: 'A_lydian' },
    { pct: 1.00, rhythmicDensity: 0.0, harmonicColor: 0.0, melodicActivity: 0.0, textureDepth: 0.0, mode: 'A_lydian' },
  ],
  microDriftAmp: 0.07,      // ±7% oscillazione attorno al target
  microDriftFreqSec: 23,    // periodo dell'oscillazione (secondi)
  emaTau: 4.0,              // time constant EMA per smoothing valori 4D (secondi)
}
```

**Nota critica sulle percentuali false-resolution:** A 45 minuti, min35 = 35/45 = 0.778; a 60 minuti = 0.583. La percentuale DEVE essere calcolata dinamicamente dalla durata effettiva del concerto, non hardcoded. Usare `getSequencerStatus().duration` per normalizzare.

### Pattern 3: HarmonyLayer con Gating Interno

**What:** HarmonyLayer usa `macroState.harmonicColor` come suo presence multiplier interno. Nessuna dipendenza da `presence-multiplier.js` in questa fase.

```javascript
// src/harmony-layer.js
import { CFG } from './config.js';
import { macroState } from './macro-composer.js';
import { sendMIDINote as _rawSend } from './midi.js';

function sendNote(ch, note, vel, dur) {
  const intensity = macroState.harmonicColor;
  if (intensity < 0.05) return;   // gating identico al pattern composer esistente
  _rawSend(ch, note, Math.max(1, Math.round(vel * intensity)), dur);
}

export function initHarmonyLayer() { /* reset interno */ }
export function updateHarmonyLayer(dt) { /* logic */ }
```

### Pattern 4: Voice Leading ≤3 Semitoni

**What:** Dato il voicing precedente e il set di note del nuovo modo, seleziona il voicing più vicino con massimo 3 semitoni di salto per voce.

```javascript
// Algoritmo voice leading con maxLeap constraint
function applyVoiceLeading(prevChord, candidateNotes, maxLeap = 3) {
  if (!prevChord) return candidateNotes.slice(0, 3); // primo accordo — scegli liberamente
  return prevChord.map(prev => {
    // trova la nota in candidateNotes più vicina a prev entro maxLeap semitoni
    let best = prev;
    let bestDist = Infinity;
    for (const n of candidateNotes) {
      const dist = Math.abs(n - prev);
      if (dist <= maxLeap && dist < bestDist) {
        bestDist = dist;
        best = n;
      }
    }
    // se nessuna nota candidata è entro maxLeap, usa l'ottava più vicina
    return best;
  });
}
```

### Pattern 5: Finestra Pivot 1 Bar

**What:** Quando il MacroComposer cambia modo, `pivotActive = true` per 1 bar. HarmonyLayer durante questa finestra suona solo la nota pivot (nota condivisa tra i due modi).

**Pivot notes per transizione modale:**
| Transizione | Nota pivot | MIDI note consigliata |
|-------------|-----------|----------------------|
| A Lydian → Bb Phrygian | A (root A Lydian = major 7th di Bb Phrygian) | 57 (A3) |
| Bb Phrygian → D Dorian | D (major 3rd di Bb Phrygian = root D Dorian) | 62 (D4) |
| D Dorian → C# Dorian | C# / enharmonic Db non presente in D Dorian diatonicamente; usare A come nota comune (A è in entrambi) | 57 (A3) |
| C# Dorian → E Phrygian | E (major 3rd di C# Dorian = root E Phrygian) | 64 (E4) |
| E Phrygian → A Lydian | A (4th di E Phrygian = root A Lydian) | 57 (A3) |

### Pattern 6: Drone Root CH2 Persistente

**What:** HarmonyLayer invia sempre una nota drone su CH2 indipendentemente da `harmonicColor`. Durata = 7.5 bar (uguale a composer.js esistente). Root è A (57/45) nei modi con radice A, D (62/50) nei modi con radice D.

```javascript
// Drone root mapping per modo
const MODE_DRONE = {
  A_lydian:    57,  // A3
  Bb_phrygian: 57,  // A3 — mantenuto come anchor condiviso (HARM-01, HARM-02)
  D_dorian:    50,  // D3
  C#_dorian:   57,  // A3 — salto a A per continuità armonica tra D e E
  E_phrygian:  57,  // A3 — E Phrygian su radice A funziona come A con colore frigio
  // alternativa: 52 (E3) per E Phrygian puro, ma rompe HARM-01
};
```

**Decisione progettuale (Claude's Discretion):** Per soddisfare HARM-01 ("tutti i layer condividono un root anchor A o D"), il drone su CH2 deve rimanere su A o D anche nei modi Bb Phrygian e C# Dorian. Bb Phrygian costruito sopra A funziona come modo "A Phrygian b2" — il root anchor A è mantenuto, il carattere modale cambia. Questo approccio è quello dei compositori elettronici (Floating Points, Four Tet) che usano modal interchange sopra un drone fisso.

### Anti-Patterns to Avoid
- **Non esportare `elapsedTime` da sequencer:** `sequencer.js` non ha una variabile `elapsedTime` o `arcProgress` esportata. Il MacroComposer deve chiamare `getSequencerStatus().elapsed` e `.progress`. Verificato dal codice.
- **Non usare `arcProgress` locale dei composer v2:** Le variabili `arcProgress` in `composer4.js`, `composer5.js` etc. sono locali e non esportate. Non tentare di importarle.
- **Non modificare `presence-multiplier.js`:** D-09 è esplicito — HarmonyLayer gestisce il proprio gating interno con `macroState.harmonicColor`.
- **Non aggiungere `harmonylayer` al registry `_pm`:** Avrebbe side effect su `isChannelAllowed()` e `resetAllMultipliers()` usati dal sequencer v2.
- **Non inviare note CH2/CH4 dai composer v2 durante V3_MODE=true:** Il routing in `main.js` garantisce che quando `V3_MODE=true` i `updateComposerN()` non vengono chiamati, quindi non c'è collisione. Ma se un composer v2 venisse attivato manualmente, ci sarebbe conflitto su CH2/CH4.
- **Non usare lunghezze di progressione non-potenza-di-2:** La composition-depth skill è esplicita: N accordi × M bar per accordo deve essere potenza di 2. Anchor voicings per modo devono rispettare questa regola.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| EMA smoothing per valori 4D | Loop custom con alpha manuale | Pattern EMA già in `state.js` e `audio.js`: `val += (target - val) * Math.min(1, dt / tau)` | Pattern consolidato nel codebase, testato in produzione |
| Interpolazione tra checkpoint | Ricerca binaria custom | Loop lineare su array piccolo (10-12 checkpoint) + `smooth-step()` | Array piccolo, overhead trascurabile; smooth-step già in `sequencer.js` come hermite ease |
| Voice leading algorithm | Sistema di scoring complesso | Nearest-neighbor con maxLeap=3 (verificato da HARM-04) — già validato in `composer.js` via `voiceLeadingMax` | I composer esistenti usano già questo approccio semplice ed efficace |
| Scale/mode note sets | Calcolo algoritmico da intervals | Array hardcoded in CFG (come in `composer.js` `MODES` object) | Già il pattern del progetto; più leggibile e debuggabile |
| Bar duration timing | Timer custom con setTimeout | `barDuration = (60 / bpmReference / 4) * 1000 * 16` — usa il pattern step sequencer di `composer.js` | Consistente con il clock worker esistente |

**Key insight:** Il codebase ha già tutte le utility necessarie implementate e testate. Il rischio principale di Phase 1 è sovraingegnerizzare — il MacroComposer è fondamentalmente un lookup/interpolation su un array di checkpoint, non un sistema complesso.

---

## Common Pitfalls

### Pitfall 1: `getSequencerStatus()` ritorna `{ active: false }` quando il sequencer non è avviato

**What goes wrong:** Se il performer non ha avviato il sequencer (tasto `0`), `getSequencerStatus().active === false` e `.progress` è undefined. Il MacroComposer crasha o resta a zero.
**Why it happens:** Il sequencer è opzionale — il sistema supporta anche attivazione manuale dei composerv2.
**How to avoid:** `updateMacroComposer(dt)` deve verificare `status.active` prima di usare `status.progress`. Fallback: usare un clock interno accumulato da `dt` se il sequencer non è attivo.
**Warning signs:** `macroState.arcPercent` resta a 0 anche dopo decine di secondi.

### Pitfall 2: Picchi dimensionali che coincidono per errori di percentuale

**What goes wrong:** I checkpoint sono scritti in percentuale del concerto, ma la durata del concerto dipende dall'ultima cue `{ t: 3000, action: 'end' }` (50 minuti). Se si usa la durata di default (45 min = 2700s), le percentuali sono calcolate su una durata sbagliata.
**Why it happens:** `getSequencerStatus().duration` ritorna `CUES[CUES.length-1].t` che è `3000` (50 minuti), non 45.
**How to avoid:** Usare sempre `getSequencerStatus().duration` per normalizzare, oppure definire `CFG.MACRO.concertDurationSec` esplicitamente sincronizzato con la durata del sequencer.
**Warning signs:** Il picco `harmonicColor` appare visibilmente prima o dopo il min 28 verificato su MIDI monitor.

### Pitfall 3: Voice leading che rompe ≤3 semitoni durante cambio di modo

**What goes wrong:** Il cambio di modo porta un voicing completamente nuovo. La nota CH4 più vicina nella nuova scala può essere a 4+ semitoni.
**Why it happens:** Scale di modi diversi hanno strutture di semitoni molto diverse (Lydian vs Phrygian hanno #4/b2 che spostano note di 2 semitoni rispetto al Dorian).
**How to avoid:** La finestra pivot D-11 è la soluzione — convergere sulla nota pivot prima del cambio. Ma il codice deve garantire che `applyVoiceLeading()` sia chiamato ANCHE durante la finestra pivot, non solo dopo.
**Warning signs:** MIDI monitor mostra salti >3 semitoni su CH4 in corrispondenza dei cambi modali.

### Pitfall 4: Drone root CH2 che crea tritono con il modo in corso

**What goes wrong:** Se CH2 suona A mentre il modo è Bb Phrygian e CH4 suona Eb (b4 di Bb Phrygian), si crea un tritono A-Eb.
**Why it happens:** L'anchor A è privilegiato per HARM-01, ma alcuni modi hanno note che creano dissonanze acute con A.
**How to avoid:** In Bb Phrygian, evitare Eb su CH4 quando A è presente su CH2. Gli anchor voicings devono essere scelti per escludere questa combinazione (D-13: anchor voicings autorizzati manualmente).
**Warning signs:** Output MIDI su CH2+CH4 suona teso/dissonante invece di "modal interchange".

### Pitfall 5: EMA smoothing troppo lento per la false-resolution

**What goes wrong:** La false-resolution richiede che `rhythmicDensity` scenda a 0 in meno di 8 bar. Con un tau EMA di 4 secondi, l'EMA impiegherebbe ~12+ secondi per raggiungere 0.
**Why it happens:** Il tau dell'EMA è calibrato per l'evoluzione graduale, non per transizioni istantanee.
**How to avoid:** Il checkpoint di false-resolution deve bypassare l'EMA e impostare direttamente `rhythmicDensity = 0`. Aggiungere un flag `instant: true` ai checkpoint che richiedono transizione immediata.
**Warning signs:** La percussione cala lentamente invece di scomparire nettamente (verificabile su MIDI monitor CH0).

### Pitfall 6: Routing V3_MODE che non gestisce i commit di note in-flight

**What goes wrong:** Quando si switcha `V3_MODE` da false a true mid-performance, le note già schedulate dai composer v2 (con timestamp futuro via `midiOut.send([..], performance.now() + durationMs)`) continuano ad arrivare anche dopo lo switch.
**Why it happens:** Il WebMIDI driver tiene una coda di note schedulate con timestamp futuro. Nessuna `sendMIDIAllNotesOff()` è prevista al flip del flag.
**How to avoid:** Prima di attivare `V3_MODE = true`, chiamare `sendMIDIAllNotesOff()`. Documentare questo nel commento del routing in `main.js`.
**Warning signs:** Note di composer v2 si sentono per 0.2-2 secondi dopo aver attivato V3_MODE.

---

## Code Examples

Verified patterns from official codebase:

### Smooth-step interpolation (già in sequencer.js)
```javascript
// Cubic hermite ease — già usato in sequencer.js updateTransitions()
const ease = progress * progress * (3 - 2 * progress);
const value = from + (to - from) * ease;
```

### EMA smoothing (pattern da state.js e audio.js)
```javascript
// EMA: tau è il time constant in secondi
// dt è il delta time in secondi
val += (target - val) * Math.min(1, dt / tau);
```

### sendMIDINote API (da midi.js)
```javascript
// sendMIDINote(ch, note, vel, durationMs)
// ch: 0-7 (0-indexed)
// note: MIDI note number (0-127)
// vel: velocity (1-127)
// durationMs: note-off schedulated via WebMIDI hardware timestamp
sendMIDINote(2, 57, 45, barMs * 7.5);  // drone A3 su CH2, durata 7.5 bar
```

### Step clock pattern (da composer.js updateComposer)
```javascript
// Step clock per HarmonyLayer (bar-resolution, non 16th)
const bpm = CFG.MACRO.bpmReference;
const barsPerSec = bpm / 60 / 4;  // 4 beats per bar
barClock += dt * barsPerSec;
const currentBar = Math.floor(barClock);
if (currentBar > lastBar) {
  // aggiornamento ogni bar
  onBar(currentBar);
  lastBar = currentBar;
}
```

### gating pattern (da composer.js)
```javascript
// HarmonyLayer gating — identico al pattern composer esistente
function sendNote(ch, note, vel, dur) {
  const intensity = macroState.harmonicColor;
  if (intensity < 0.05) return;
  _rawSend(ch, note, Math.max(1, Math.round(vel * intensity)), dur);
}
```

### getSequencerStatus usage
```javascript
// MacroComposer legge la posizione nel concerto
import { getSequencerStatus } from './sequencer.js';

export function updateMacroComposer(dt) {
  const status = getSequencerStatus();
  if (!status.active) {
    // fallback: accumula tempo da dt per permettere testing senza sequencer
    _internalClock += dt;
    const concertDur = CFG.MACRO.concertDurationSec;
    arcPercent = Math.min(1, _internalClock / concertDur);
  } else {
    arcPercent = status.progress; // 0.0–1.0
  }
  // ...
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 7 engine sequenziali (v2) | MacroComposer + layer sovrapposti (v3) | Phase 1 | Arco narrativo coerente invece di motori isolati |
| Phase duration in secondi | Da valutare: bar vs secondi per HarmonyLayer | Phase 1 design decision | Bar-based è più musicalmente coerente (structural-form.md), seconds-based è più semplice |
| arcProgress per-composer locale | arcPercent globale da MacroComposer | Phase 1 | Un unico clock narrativo per tutti i layer |
| Presenza multipla via presence-multiplier.js | Gating interno per HarmonyLayer | Phase 1 | Separazione più pulita; presence-multiplier.js rimane per v2 |

**Deprecated/outdated:**
- Nessuna deprecazione in questa fase — tutti i composer v2 rimangono intatti. V3_MODE=true li bypassa, V3_MODE=false li riattiva.

---

## Open Questions

1. **Durata concerto per calcolo percentuali**
   - What we know: `getSequencerStatus().duration` ritorna `3000` (50 minuti, dal sequencer v2). CFG.MACRO.concertDurationSec è a discrezione di Claude.
   - What's unclear: usare la durata del sequencer v2 (3000s) o una durata v3 indipendente?
   - Recommendation: definire `CFG.MACRO.concertDurationSec = 2700` (45 min) come durata target v3, ma normalizzare arcPercent su questa costante invece che su `getSequencerStatus().duration`. Documentare come commento nel file.

2. **Frequenza di aggiornamento HarmonyLayer (Claude's Discretion)**
   - What we know: i composer v2 usano 16th-note resolution. HarmonyLayer è armonico, non ritmico — non ha bisogno di granularità 16th.
   - What's unclear: ogni bar (4 beat), ogni 2 bar, o ogni 4 bar?
   - Recommendation: ogni 2 bar per il drone CH2 (letargo, stabilità), ogni 4 bar per il cambio accordo CH4 (ritmo armonico house/dub). Questo dà 4 accordi × 4 bar = 16 bar per ciclo — potenza di 2 secondo composition-depth/structural-form.md.

3. **Anchor voicings per i 6 modi (Claude's Discretion)**
   - What we know: D-13 specifica 3-4 anchor voicings per modo, scritti come array di note MIDI in CFG.
   - What's unclear: i valori esatti richiedono ascolto sul setup MIDI hardware specifico.
   - Recommendation: fornire valori di partenza plausibili nella configurazione (vedi sezione Code Examples), con commento esplicito "calibrare via ascolto". Non bloccare l'implementazione su questi valori — sono il punto di partenza, non la destinazione.

4. **C# Dorian root anchor: A o C#?**
   - What we know: HARM-01 richiede che il root anchor sia A o D. C# Dorian ha root C#.
   - What's unclear: suonare C# come drone viola HARM-01 o il "drone root" può cambiare tra A/D/C# purché resti coerente?
   - Recommendation: interpretare HARM-01 come "la radice armonica condivisa tra tutti i layer è A o D", quindi in C# Dorian il drone su CH2 usa A3 (57) e il voicing CH4 è costruito sopra A come nota comune. Questo è il "modal interchange sopra drone fisso" descritto in HARM-02.

---

## Environment Availability

Step 2.6: SKIPPED — questa fase è puramente code/config. Nessuna dipendenza esterna oltre al browser Chrome/Edge già usato in produzione. Il server `python3 -m http.server 8282` è già operativo dalla Phase 0.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Nessun test framework — manual browser testing (per CLAUDE.md del progetto) |
| Config file | N/A — no jest/vitest/pytest |
| Quick run command | `python3 -m http.server 8282` poi aprire `http://localhost:8282` su Chrome |
| Full suite command | MIDI monitor esterno (es. MIDI Monitor.app su macOS o Protokol) su MIDI output |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MARC-01 | Arco 4D evolve su 40+ minuti senza plateau | Manual — MIDI monitor | Avviare sequencer, osservare `macroState` via `console.log` ogni 30s | ❌ Wave 0 |
| MARC-02 | Picchi staggered visibili (~min28, ~min33, ~min38) | Manual — log console | `console.log('[MACRO]', macroState)` ogni 60s nel worker | ❌ Wave 0 |
| MARC-03 | rhythmicDensity = 0 per 8 bar a ~min35 | Manual — MIDI monitor CH0 silenzio | Sequencer skip a ~min35 + osservare CH0 | ❌ Wave 0 |
| HARM-01 | Drone A o D sempre presente su CH2 | Manual — MIDI monitor CH2 always on | Check CH2 non va mai a silenzio completo | ❌ Wave 0 |
| HARM-02 | Modal interchange senza spostamento root | Manual — ascolto | Confrontare note CH2 prima/dopo cambio modo | ❌ Wave 0 |
| HARM-03 | Bass CH3 root/quinta, CH2 voicing 9+ semitoni sopra | Manual — MIDI monitor | Verificare range note CH2 ≥ CH3 + 9 | ❌ Wave 0 |
| HARM-04 | Nessun salto >3 semitoni su CH4 | Manual — MIDI monitor | Osservare CH4 ai cambi di modo | ❌ Wave 0 |
| HARM-05 | 10-15% note cromatiche con risoluzione verso il basso | Manual — ascolto | Contare note cromatiche su 100 note CH4 | ❌ Wave 0 |

**Nota:** Il progetto usa testing manuale (CLAUDE.md: "No test framework. Manual testing via browser"). Le verifiche automatizzate si fanno via `console.log` nel codice + MIDI monitor esterno. Il file `test.html` e `sandbox.html` esistono per test manuali.

### Sampling Rate
- **Per task commit:** Aprire browser, avviare sequencer con `0`, verificare `console.log` per i valori 4D del MacroComposer.
- **Per wave merge:** Test MIDI monitor completo — avviare da min0, skipTo ~min28, ~min33, ~min35, ~min38 e verificare i success criteria.
- **Phase gate:** Tutti i 5 success criteria del ROADMAP verificati su MIDI monitor prima di `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `src/macro-composer.js` — il file non esiste, va creato in Wave 0
- [ ] `src/harmony-layer.js` — il file non esiste, va creato in Wave 0
- [ ] `CFG.MACRO` block in `src/config.js` — non esiste, va aggiunto in Wave 0

*(Nessun test framework da installare — il progetto usa testing manuale per scelta architetturale)*

---

## Project Constraints (from CLAUDE.md)

Direttive estratte da `MACH:INE II/CLAUDE.md` e dal CLAUDE.md globale, applicabili a Phase 1:

| Direttiva | Applicazione a Phase 1 |
|-----------|----------------------|
| Zero npm, zero bundler, ES modules nativi | `macro-composer.js` e `harmony-layer.js` come file `.js` puri con `import/export` |
| Tutti i parametri numerici in `config.js` → oggetto `CFG` | Checkpoint array, anchor voicings, bpmReference, emaTau, microDriftAmp tutti in `CFG.MACRO` |
| No magic numbers nel codice | Ogni costante numerica in `CFG.MACRO`, non inlinata nei moduli |
| Commenti tecnici in inglese, commenti musicali in italiano | Rispettare nel codice dei nuovi moduli |
| Aree protette — non toccare senza discussione: `main.js`, `render.js`, `director.js` | Phase 1 tocca `main.js` (routing V3_MODE) — modifica minima, solo blocco `midiWorker.onmessage` |
| `sendMIDIAllNotesOff()` prima di qualsiasi deactivation | HarmonyLayer deve chiamarlo nel proprio `init()` / cleanup |
| Preservare separazione render loop / MIDI clock Worker | MacroComposer e HarmonyLayer girano nel Worker (midiWorker.onmessage), non nel rAF loop |
| Rupture — sempre 4 stadi (presagio, infiltrazione, takeover, residuo) | Non applicabile direttamente a Phase 1; HarmonyLayer non ha rupture in questa fase |
| File sotto 500 linee | macro-composer.js e harmony-layer.js devono restare sotto 500 righe |
| Versioning: `vX.Y.Z: descrizione breve` + CHANGELOG.md | Aggiornare dopo ogni commit di fase |

---

## Sources

### Primary (HIGH confidence)
- Codebase diretto — `src/config.js`, `src/sequencer.js`, `src/main.js`, `src/midi.js`, `src/composer.js`, `src/presence-multiplier.js` — letti integralmente
- `.claude/skills/composition-depth/SKILL.md` — principi compositivi del progetto
- `.claude/skills/composition-depth/references/harmonic-techniques.md` — tecniche armoniche specifiche
- `.claude/skills/composition-depth/references/structural-form.md` — regola potenze di 2
- `MACH:INE II/CLAUDE.md` — regole ferree del progetto
- `.planning/phases/01-macrocomposer-e-harmonylayer/01-CONTEXT.md` — decisioni utente verificate

### Secondary (MEDIUM confidence)
- `.planning/phases/00-infrastruttura-e-migrazione/00-01-SUMMARY.md` — verifica che V3_MODE e v2-archive siano operativi
- `.planning/REQUIREMENTS.md` — requirements MARC-01→03, HARM-01→05 letti integralmente
- `.planning/ROADMAP.md` — success criteria Phase 1 verificati

### Tertiary (LOW confidence)
- Conoscenza di dominio su teoria musicale modale, Floating Points/Four Tet composition style — non verificata da fonti esterne, basata su training data. Sufficiente per l'implementazione proposta, ma i valori di velocity e anchor voicings richiedono verifica per ascolto.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero dipendenze esterne, tutto già nel codebase
- Architecture patterns: HIGH — verificati direttamente dal codice sorgente
- Pitfalls: HIGH — identificati da lettura diretta di `sequencer.js`, `midi.js`, `composer.js`
- Anchor voicings numerici: LOW — richiedono ascolto per calibrazione finale

**Research date:** 2026-03-27
**Valid until:** 2026-05-01 (codebase stabile, nessuna dipendenza esterna mutante)
