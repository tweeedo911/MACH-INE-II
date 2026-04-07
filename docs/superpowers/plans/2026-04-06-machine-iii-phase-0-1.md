# MACH:INE III — Phase 0 + Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork MACH:INE II into a new branch, replace the 7-composer architecture with the "Band con Direttore" system, and make one track (SOLCO) sound good with all 5 modules.

**Architecture:** Single World State object read by 5 functional modules (rhythm, harmony, bass, melody, texture), written exclusively by a Director. All modules share the same musical context (scale, density budget, register, rhythmic grid). No module-to-module communication.

**Tech Stack:** ES modules (zero bundler), Canvas 2D, Web Audio API, WebMIDI API, Web Worker MIDI clock. Server: `python3 -m http.server 8282`.

**Spec:** `docs/superpowers/specs/2026-04-06-machine-iii-design.md`

**Scope:** Phase 0 (fork + infrastructure) and Phase 1 (SOLCO track). Phases 2-4 will be separate plans.

---

## File Structure

### New files (8)
| File | Responsibility |
|------|---------------|
| `src/world-state.js` | Shared state object + getters |
| `src/director3.js` | Reads audio/clock → writes worldState (phase progression, density budgets) |
| `src/tracks.js` | 7 track definitions as World State presets (Phase 1: only SOLCO) |
| `src/rhythm.js` | CH0 kick + CH1 perc kit — reads worldState, generates rhythm |
| `src/harmony.js` | CH2 drone + CH4 chords — reads worldState, generates harmony |
| `src/bass.js` | CH3 bass — reads worldState, generates bass patterns |
| `src/melody.js` | CH5 voice + CH6 lead + CH7 arp — reads worldState, generates melodies |
| `src/texture.js` | CC messages + rare FX events — reads worldState |

### Modified files (3)
| File | Changes |
|------|---------|
| `src/main.js` | Remove old composer/layer/sequencer imports and calls. Add new module imports and wiring. Protected area — minimal changes. |
| `src/midi.js` | Add `sendMIDICC()` function. Update `MIDI_ROLES` array for new channel names. |
| `src/config.js` | Remove composer-specific configs (CFG.COMPOSER through CFG.COMPOSER7, CFG.MACRO). Keep audio/render/camera params. |

### Kept unchanged
All renderer files (`field.js`, `render.js`, `colors.js`, `generations.js`, `midi-patterns.js`, `director.js`, `director-events.js`), audio (`audio.js`, `state.js`), MIDI clock (`midi-clock.worker.js`), DNA (`dna.js`).

### Eliminated (not deleted — left in tree, just not imported)
`composer.js` through `composer7.js`, `macro-composer.js`, `sequencer.js`, `presence-multiplier.js`, `rhythm-layer.js`, `harmony-layer.js`, `melody-texture-layer.js`.

---

## Task 1: Create branch + world-state.js

**Files:**
- Create: `src/world-state.js`

- [ ] **Step 1: Create branch**

```bash
cd "/Users/Edo_1/MACH-INE II/MACH:INE II"
git checkout -b machine-iii
```

- [ ] **Step 2: Write world-state.js**

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — World State
//  Single shared state. Director writes, modules read.
// ═══════════════════════════════════════════════════════════

export const worldState = {
  // ── Musical identity ──
  track:  null,     // 'NEBBIA' | 'TESSUTO' | 'SOLCO' | 'RESPIRO' | 'MACCHINA' | 'TEMPESTA' | 'RITORNO'
  scale:  [],       // MIDI note array, e.g. [55,57,58,60,62,64,65,67] for G dorian
  root:   0,        // root MIDI note
  bpm:    null,     // null = no rhythmic clock (ambient)
  phase:  'germoglio',  // germoglio | pulsazione | densita | rottura | dissoluzione

  // ── Budget & constraints (Director sets these per phase) ──
  density: {
    rhythm:  0,
    harmony: 0,
    bass:    0,
    melody:  0,
    texture: 0,
  },
  register: {
    bass:   [36, 55],
    melody: [67, 84],
    lead:   [72, 96],
    chords: [55, 72],
    arp:    [60, 84],
  },
  velocityCeiling: {
    rhythm:  0,
    harmony: 0,
    bass:    0,
    melody:  0,
    texture: 0,
  },
  rhythmGrid: null,  // 16-step array [1,0,0,0,...] or null

  // ── Narrative arc ──
  arc:        0,          // 0.0 → 1.0 concert position
  energy:     'SILENCE',  // SILENCE | BUILDING | ACTIVE | INTENSE | PEAK | RELEASE
  transition: null,       // { from, to, progress } during DJ-set transition, else null

  // ── Harmony (written by harmony.js — only exception to read-only rule) ──
  currentChord: [],  // MIDI notes of current chord, for arp

  // ── Visual regime (read by renderer) ──
  palette:      { bg: '#000000', dot: '#FFFFFF', accent: null },
  visualRegime: { maxDensity: 0.5, minDotSize: 4, composition: 'DEFAULT' },
  camera:       { mode: 'WIDE', drift: 0, focusPoint: [0.5, 0.5] },
};

// ── Phase time tracking (internal to director3, exposed for HUD) ──
export const phaseState = {
  elapsed:  0,     // seconds in current phase
  duration: 0,     // total duration of current phase
  progress: 0,     // elapsed / duration (0–1)
};
```

- [ ] **Step 3: Commit**

```bash
git add src/world-state.js
git commit -m "iii: world-state.js — shared state object for Band con Direttore architecture"
```

---

## Task 2: Create tracks.js with SOLCO definition

**Files:**
- Create: `src/tracks.js`

- [ ] **Step 1: Write tracks.js with scale definitions and SOLCO**

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Track Definitions
//  Each track is a "score sheet": a set of World State values.
//  The Director loads these and interpolates during transitions.
// ═══════════════════════════════════════════════════════════

// ── Scale definitions (MIDI notes spanning 2+ octaves) ──
const SCALES = {
  G_dorian:    [43,45,46,48,50,52,53,55,57,58,60,62,64,65,67,69,70,72,74,76,77,79],
  A_lydian:    [45,47,49,51,52,54,56,57,59,61,63,64,66,68,69,71,73,75,76,78,80,81],
  Bb_phrygian: [46,47,49,51,53,54,56,58,59,61,63,65,66,68,70,71,73,75,77,78,80,82],
  D_dorian:    [38,40,41,43,45,47,48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74],
  Cs_dorian:   [37,39,40,42,44,46,47,49,51,52,54,56,58,59,61,63,64,66,68,70,71,73],
  E_phrygian:  [40,41,43,45,47,48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74,76],
  F_lydian:    [41,43,45,47,48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74,76,77],
};

export { SCALES };

// ── Density profiles per phase (multiplied by track density) ──
const PHASE_DENSITY = {
  germoglio:    { rhythm: 0.0, harmony: 0.5, bass: 0.3, melody: 0.2, texture: 0.1 },
  pulsazione:   { rhythm: 0.4, harmony: 0.6, bass: 0.6, melody: 0.4, texture: 0.15 },
  densita:      { rhythm: 0.8, harmony: 0.7, bass: 0.9, melody: 0.7, texture: 0.2 },
  rottura:      { rhythm: 1.0, harmony: 0.5, bass: 1.0, melody: 0.9, texture: 0.5 },
  dissoluzione: { rhythm: 0.3, harmony: 0.4, bass: 0.2, melody: 0.3, texture: 0.1 },
};

export { PHASE_DENSITY };

// ── Energy mapping per phase ──
const PHASE_ENERGY = {
  germoglio:    'SILENCE',
  pulsazione:   'BUILDING',
  densita:      'ACTIVE',
  rottura:      'PEAK',
  dissoluzione: 'RELEASE',
};

export { PHASE_ENERGY };

// ── Track definitions ──
export const TRACKS = {
  SOLCO: {
    scale: SCALES.G_dorian,
    root: 55,   // G3
    bpm: 128,
    kickNote: 38,  // D2

    density: { rhythm: 0.7, harmony: 0.4, bass: 0.8, melody: 0.5, texture: 0.1 },

    register: {
      bass:   [36, 55],
      melody: [67, 84],
      lead:   [72, 96],
      chords: [55, 72],
      arp:    [60, 84],
    },
    velocityCeiling: {
      rhythm:  110,
      harmony: 60,
      bass:    90,
      melody:  75,
      texture: 45,
    },

    // Dub syncopated groove — the rhythm module aligns to this
    rhythmGrid: [1,0,0,0, 1,0,0,1, 1,0,0,0, 0,1,0,0],

    // Phase durations in seconds
    phases: {
      germoglio:    60,
      pulsazione:   55,
      densita:      80,
      rottura:      28,
      dissoluzione: 65,
    },

    // Chord progression — 8 chords × 4 bar = 32 bar cycle (power of 2)
    chords: [
      [55, 58, 62],  // Gm
      [57, 60, 64],  // Am7 (no 5th)
      [58, 62, 65],  // Bb
      [60, 64, 67],  // C
      [62, 65, 69],  // Dm
      [58, 62, 65],  // Bb (return)
      [55, 60, 62],  // Gsus2
      [55, 58, 62],  // Gm (home)
    ],

    // Bass pattern: 16 steps, 1=root, offsets from root for other hits
    // Dub syncopated: plays where kick is silent
    bassPattern: [0,0,0,7, 0,5,0,0, 0,0,3,0, 5,0,0,0],
    // 0 = rest, positive number = semitone offset from root
    // Steps 3,5,10,12 active — complementary to rhythmGrid

    // Arp: rate and note count
    arpRate: 8,   // 8th notes
    arpNotes: 4,  // 4-note pattern derived from currentChord

    palette: { bg: '#282B26', dot: '#FE6B0D', accent: '#CDD71D' },
    visualRegime: { maxDensity: 0.65, minDotSize: 4, composition: 'ASIMMETRIA' },
  },

  // ── Remaining tracks: defined in Phase 2 brainstorming ──
  // NEBBIA, TESSUTO, RESPIRO, MACCHINA, TEMPESTA, RITORNO
};

// ── Track sequence (the album order) ──
export const TRACK_ORDER = ['NEBBIA', 'TESSUTO', 'SOLCO', 'RESPIRO', 'MACCHINA', 'TEMPESTA', 'RITORNO'];
```

- [ ] **Step 2: Commit**

```bash
git add src/tracks.js
git commit -m "iii: tracks.js — SOLCO track definition with scales, phases, patterns"
```

---

## Task 3: Create director3.js (static for Phase 1)

**Files:**
- Create: `src/director3.js`

- [ ] **Step 1: Write director3.js — loads SOLCO, advances phases, updates worldState**

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Director
//  Reads audio + clock → writes World State.
//  Does NOT generate notes. Only constraints and context.
// ═══════════════════════════════════════════════════════════

import { worldState, phaseState } from './world-state.js';
import { TRACKS, PHASE_DENSITY, PHASE_ENERGY } from './tracks.js';

// ── Phase order ──
const PHASE_ORDER = ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'];

let _track = null;     // current track definition
let _phaseIdx = 0;     // index into PHASE_ORDER
let _phaseTime = 0;    // seconds elapsed in current phase
let _totalTime = 0;    // total seconds since start
let _totalDuration = 0; // sum of all phase durations

// ── Init: load a track into worldState ──
export function initDirector3(trackName = 'SOLCO') {
  _track = TRACKS[trackName];
  if (!_track) throw new Error(`[DIR3] Track "${trackName}" not found`);

  _phaseIdx = 0;
  _phaseTime = 0;
  _totalTime = 0;
  _totalDuration = PHASE_ORDER.reduce((sum, p) => sum + (_track.phases[p] || 0), 0);

  // Load track identity into worldState
  worldState.track = trackName;
  worldState.scale = _track.scale;
  worldState.root = _track.root;
  worldState.bpm = _track.bpm;
  worldState.rhythmGrid = _track.rhythmGrid;
  worldState.palette = { ...(_track.palette) };
  worldState.visualRegime = { ...(_track.visualRegime) };

  _applyPhase();

  console.log(`[DIR3] Loaded track: ${trackName}, duration: ${_totalDuration}s`);
}

// ── Update: called every MIDI clock tick (~2ms) ──
export function updateDirector3(dt) {
  _phaseTime += dt;
  _totalTime += dt;

  // Update arc (concert position)
  worldState.arc = Math.min(1, _totalTime / _totalDuration);

  // Advance phase if duration exceeded
  const phaseName = PHASE_ORDER[_phaseIdx];
  const phaseDur = _track.phases[phaseName] || 60;

  if (_phaseTime >= phaseDur && _phaseIdx < PHASE_ORDER.length - 1) {
    _phaseIdx++;
    _phaseTime = 0;
    _applyPhase();
    console.log(`[DIR3] Phase: ${PHASE_ORDER[_phaseIdx]} (arc: ${worldState.arc.toFixed(2)})`);
  }

  // Update phase state (for HUD)
  phaseState.elapsed = _phaseTime;
  phaseState.duration = phaseDur;
  phaseState.progress = Math.min(1, _phaseTime / phaseDur);
}

// ── Apply phase: update density, energy, registers, velocity ceilings ──
function _applyPhase() {
  const phaseName = PHASE_ORDER[_phaseIdx];
  worldState.phase = phaseName;
  worldState.energy = PHASE_ENERGY[phaseName] || 'SILENCE';

  // Density = track base × phase multiplier
  const pd = PHASE_DENSITY[phaseName];
  for (const mod of ['rhythm', 'harmony', 'bass', 'melody', 'texture']) {
    worldState.density[mod] = (_track.density[mod] || 0) * (pd[mod] || 0);
  }

  // Registers and velocity ceilings from track (constant per track, could vary per phase later)
  if (_track.register) {
    for (const [k, v] of Object.entries(_track.register)) {
      worldState.register[k] = [...v];
    }
  }
  if (_track.velocityCeiling) {
    for (const [k, v] of Object.entries(_track.velocityCeiling)) {
      worldState.velocityCeiling[k] = v;
    }
  }
}

// ── Manual controls (keyboard) ──
export function skipPhase(direction = 1) {
  const newIdx = Math.max(0, Math.min(PHASE_ORDER.length - 1, _phaseIdx + direction));
  if (newIdx !== _phaseIdx) {
    _phaseIdx = newIdx;
    _phaseTime = 0;
    _applyPhase();
    console.log(`[DIR3] Skipped to: ${PHASE_ORDER[_phaseIdx]}`);
  }
}

export function jumpToPhase(name) {
  const idx = PHASE_ORDER.indexOf(name);
  if (idx >= 0) {
    _phaseIdx = idx;
    _phaseTime = 0;
    _applyPhase();
    console.log(`[DIR3] Jumped to: ${name}`);
  }
}

export function getDirector3Status() {
  return {
    track: worldState.track,
    phase: PHASE_ORDER[_phaseIdx],
    phaseProgress: phaseState.progress,
    arc: worldState.arc,
    energy: worldState.energy,
    totalTime: _totalTime,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/director3.js
git commit -m "iii: director3.js — Director loads SOLCO, advances phases, writes worldState"
```

---

## Task 4: Create 5 module skeletons

**Files:**
- Create: `src/rhythm.js`, `src/harmony.js`, `src/bass.js`, `src/melody.js`, `src/texture.js`

- [ ] **Step 1: Write rhythm.js skeleton**

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Rhythm Module
//  CH0 Kick + CH1 Perc Kit
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';

let _step = 0;        // 0–15 (16th note position in bar)
let _stepAcc = 0;     // accumulator for step timing
let _bar = 0;         // bar counter

export function initRhythm() {
  _step = 0;
  _stepAcc = 0;
  _bar = 0;
  console.log('[RHYTHM] Initialized');
}

export function updateRhythm(dt) {
  if (!worldState.bpm || worldState.density.rhythm < 0.01) return;

  const stepDur = 60 / worldState.bpm / 4; // duration of 1 sixteenth note in seconds
  _stepAcc += dt;

  while (_stepAcc >= stepDur) {
    _stepAcc -= stepDur;
    _tick();
    _step = (_step + 1) % 16;
    if (_step === 0) _bar++;
  }
}

function _tick() {
  // Placeholder — implemented in Task 7
}
```

- [ ] **Step 2: Write harmony.js skeleton**

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Harmony Module
//  CH2 Drone + CH4 Chords
//  Reads worldState. Writes worldState.currentChord (only exception).
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';

let _step = 0;
let _stepAcc = 0;
let _bar = 0;
let _chordIdx = 0;
let _lastDroneNote = -1;

export function initHarmony() {
  _step = 0;
  _stepAcc = 0;
  _bar = 0;
  _chordIdx = 0;
  _lastDroneNote = -1;
  console.log('[HARMONY] Initialized');
}

export function updateHarmony(dt) {
  if (worldState.density.harmony < 0.01) return;

  // Harmony uses bar-level timing even without BPM (drone in ambient tracks)
  const bpm = worldState.bpm || 60; // fallback 60 BPM for timing in ambient
  const stepDur = 60 / bpm / 4;
  _stepAcc += dt;

  while (_stepAcc >= stepDur) {
    _stepAcc -= stepDur;
    _tick();
    _step = (_step + 1) % 16;
    if (_step === 0) _bar++;
  }
}

function _tick() {
  // Placeholder — implemented in Task 9
}
```

- [ ] **Step 3: Write bass.js skeleton**

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Bass Module
//  CH3 Bass
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';

let _step = 0;
let _stepAcc = 0;
let _bar = 0;

export function initBass() {
  _step = 0;
  _stepAcc = 0;
  _bar = 0;
  console.log('[BASS] Initialized');
}

export function updateBass(dt) {
  if (!worldState.bpm || worldState.density.bass < 0.01) return;

  const stepDur = 60 / worldState.bpm / 4;
  _stepAcc += dt;

  while (_stepAcc >= stepDur) {
    _stepAcc -= stepDur;
    _tick();
    _step = (_step + 1) % 16;
    if (_step === 0) _bar++;
  }
}

function _tick() {
  // Placeholder — implemented in Task 8
}
```

- [ ] **Step 4: Write melody.js skeleton**

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Melody Module
//  CH5 Voice + CH6 Lead + CH7 Arp
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';

let _step = 0;
let _stepAcc = 0;
let _bar = 0;

export function initMelody() {
  _step = 0;
  _stepAcc = 0;
  _bar = 0;
  console.log('[MELODY] Initialized');
}

export function updateMelody(dt) {
  if (worldState.density.melody < 0.01) return;

  const bpm = worldState.bpm || 60;
  const stepDur = 60 / bpm / 4;
  _stepAcc += dt;

  while (_stepAcc >= stepDur) {
    _stepAcc -= stepDur;
    _tick();
    _step = (_step + 1) % 16;
    if (_step === 0) _bar++;
  }
}

function _tick() {
  // Placeholder — implemented in Task 10
}
```

- [ ] **Step 5: Write texture.js skeleton**

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Texture Module
//  CC messages + rare FX events
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';

let _timeAcc = 0;

export function initTexture() {
  _timeAcc = 0;
  console.log('[TEXTURE] Initialized');
}

export function updateTexture(dt) {
  if (worldState.density.texture < 0.01) return;
  _timeAcc += dt;
  // Placeholder — implemented in Task 11
}
```

- [ ] **Step 6: Commit all skeletons**

```bash
git add src/rhythm.js src/harmony.js src/bass.js src/melody.js src/texture.js
git commit -m "iii: 5 module skeletons — rhythm, harmony, bass, melody, texture"
```

---

## Task 5: Add sendMIDICC to midi.js + update MIDI_ROLES

**Files:**
- Modify: `src/midi.js`

- [ ] **Step 1: Update MIDI_ROLES channel names**

In `src/midi.js`, find line 11:
```javascript
export const MIDI_ROLES = ['PULSE', 'GRAIN', 'DRONE', 'BASS', 'CHORDS', 'VOICE', 'LEAD', 'RUPTURE'];
```
Replace with:
```javascript
export const MIDI_ROLES = ['KICK', 'PERC', 'DRONE', 'BASS', 'CHORDS', 'VOICE', 'LEAD', 'ARP'];
```

- [ ] **Step 2: Add sendMIDICC function**

After the `sendMIDIAllNotesOff` function (line ~155), add:

```javascript
export function sendMIDICC(ch, cc, value) {
  if (!midiOut) return;
  midiOut.send([0xB0 | (ch & 0x0F), cc & 0x7F, value & 0x7F]);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/midi.js
git commit -m "iii: midi.js — update channel roles, add sendMIDICC"
```

---

## Task 6: Rewire main.js (PROTECTED AREA)

**Files:**
- Modify: `src/main.js`

This is a protected area file. Changes are minimal and surgical: swap imports, swap init calls, swap update calls. Everything else stays.

- [ ] **Step 1: Replace import block (lines 6-28)**

Remove the old layer/composer/sequencer imports. Replace the import block (keeping audio, midi, state, render, dna, generations, colors, director, wake lock) with:

```javascript
import { CFG } from './config.js';
import { initAudio, updateAudio, setAudioGain, getAudioGain } from './audio.js';
import { initMIDI, updateMIDI, sendMIDIStart, updateMIDIClock } from './midi.js';
import { state, updateState } from './state.js';
import { initRender, renderFrame, resize, setHUDElements, handleKey, setProjectorWindow } from './render.js';
import { generateDNA } from './dna.js';
import { resetGenerations } from './generations.js';
import { resetClimax } from './colors.js';
import { initDirector } from './director.js';
import { WakeLockManager } from '../.claude/skills/runtime-expert/scripts/perf-utils.js';

// ── MACH:INE III modules ──
import { worldState } from './world-state.js';
import { initDirector3, updateDirector3, skipPhase, getDirector3Status } from './director3.js';
import { initRhythm, updateRhythm } from './rhythm.js';
import { initHarmony, updateHarmony } from './harmony.js';
import { initBass, updateBass } from './bass.js';
import { initMelody, updateMelody } from './melody.js';
import { initTexture, updateTexture } from './texture.js';

// ── Session recorder ──
import { initRecorder, startRecording, stopRecording, isRecording, recordSnapshot, recordPhaseCheck, downloadSession, captureScreenshotNow } from './session-recorder.js';
```

- [ ] **Step 2: Replace boot sequence (inside startScreen click handler, lines 97-117)**

Remove old init calls. Replace with:

```javascript
  // ── Visual director (scene, camera, arc) — reads audio, stays as-is ──
  generateDNA();
  initDirector(state);

  // ── MACH:INE III composition system ──
  initDirector3('SOLCO');
  initRhythm();
  initHarmony();
  initBass();
  initMelody();
  initTexture();
  sendMIDIStart();
  console.log('[III] Director + 5 modules initialized');
```

Remove the old debug helpers (`window._m`, `window.arc`) and the `canRecover()` check.

- [ ] **Step 3: Replace MIDI worker handler (lines 189-214)**

Replace the `midiWorker.onmessage` handler with:

```javascript
midiWorker.onmessage = ({ data: { dt } }) => {
  try {
    if (!running) return;

    // Director reads clock → updates worldState
    updateDirector3(dt);

    // 5 modules read worldState → generate MIDI
    updateRhythm(dt);
    updateHarmony(dt);
    updateBass(dt);
    updateMelody(dt);
    updateTexture(dt);

    // MIDI clock sync
    if (worldState.bpm) {
      updateMIDIClock(worldState.bpm);
    }
  } catch (e) {
    console.error('[MIDI CLOCK] Handler error (clock kept alive):', e);
  }
};
```

- [ ] **Step 4: Simplify keyboard handler**

Replace the old Digit1-7 arc jump and sequencer controls (lines 140-162) with:

```javascript
  // Tasti 1-5: jump tra le 5 fasi
  const _phaseMap = { Digit1: 'germoglio', Digit2: 'pulsazione', Digit3: 'densita', Digit4: 'rottura', Digit5: 'dissoluzione' };
  if (_phaseMap[e.code]) {
    jumpToPhase(_phaseMap[e.code]);
    return;
  }
  if (e.code === 'ArrowRight') { skipPhase(+1); return; }
  if (e.code === 'ArrowLeft')  { skipPhase(-1); return; }
  if (e.code === 'Space')      { e.preventDefault(); return; }
```

Keep all other keyboard handlers (gain, projector, session recorder, R for regen) unchanged.

- [ ] **Step 5: Verify in browser**

```bash
cd "/Users/Edo_1/MACH-INE II/MACH:INE II" && python3 -m http.server 8282 &
```

Open `http://localhost:8282`. Click to start.
Expected: canvas renders, audio analysis works, console shows `[III] Director + 5 modules initialized` and `[DIR3] Loaded track: SOLCO`. No MIDI notes yet (modules are stubs). No errors in console.

- [ ] **Step 6: Commit**

```bash
git add src/main.js
git commit -m "iii: main.js rewired — Director + 5 modules replace old composer/layer system"
```

---

## Task 7: Implement rhythm.js — kick + perc kit for SOLCO

**Files:**
- Modify: `src/rhythm.js`

- [ ] **Step 1: Implement the _tick() function with kick and hat**

Replace the placeholder `_tick()` in `src/rhythm.js` with the full implementation:

```javascript
// ── Drum map for CH1 Perc Kit ──
const DRUM = {
  HAT_CLOSED: 36,
  SNARE:      38,
  CLAP:       39,
  HAT_OPEN:   42,
  CONGA_HI:   45,
  HAT_PEDAL:  46,
  CONGA_LO:   48,
  CRASH:      49,
  RIDE:       51,
  COWBELL:    56,
};

// ── Hat patterns (different feels per phase) ──
const HAT_PATTERNS = {
  germoglio:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],  // silence
  pulsazione:   [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0],  // sparse — 3 hits
  densita:      [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],  // 8th notes
  rottura:      [1,1,1,0, 1,1,1,0, 1,1,1,0, 1,1,1,0],  // dense — 12 hits
  dissoluzione: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],  // dying — 2 hits
};

function _tick() {
  const { phase, rhythmGrid, density, velocityCeiling, bpm } = worldState;
  const den = density.rhythm;
  const ceil = velocityCeiling.rhythm;
  if (den < 0.01) return;

  const beatMs = 60000 / bpm;
  const stepMs = beatMs / 4;

  // ── CH0 KICK ──
  if (rhythmGrid && rhythmGrid[_step]) {
    const vel = Math.round(Math.min(ceil, 80 + den * 30 + (Math.random() - 0.5) * 8));
    const track = worldState.track;
    const kickNote = (TRACKS_CACHE[track] && TRACKS_CACHE[track].kickNote) || 36;
    sendMIDINote(0, kickNote, vel, Math.round(stepMs * 0.8));
    addMidiNote(0, kickNote / 127, vel / 127);
  }

  // ── CH1 HAT ──
  const hatPat = HAT_PATTERNS[phase] || HAT_PATTERNS.densita;
  if (hatPat[_step]) {
    const isOpen = _step % 8 === 4 && phase !== 'pulsazione'; // open hat on "and" of 2
    const note = isOpen ? DRUM.HAT_OPEN : DRUM.HAT_CLOSED;
    const hatVel = Math.round(Math.min(ceil * 0.7, 40 + den * 40 + (Math.random() - 0.5) * 6));
    const dur = isOpen ? Math.round(stepMs * 2) : Math.round(stepMs * 0.4);
    sendMIDINote(1, note, hatVel, dur);
    addMidiNote(1, note / 127, hatVel / 127);
  }

  // ── CH1 SNARE (phases densita+) — on step 4 and 12 (backbeat) ──
  if (den > 0.5 && (_step === 4 || _step === 12)) {
    const snareVel = Math.round(Math.min(ceil * 0.8, 50 + den * 35 + (Math.random() - 0.5) * 5));
    sendMIDINote(1, DRUM.SNARE, snareVel, Math.round(stepMs * 0.5));
    addMidiNote(1, DRUM.SNARE / 127, snareVel / 127);
  }

  // ── CH1 GHOST — probabilistic off-beat hits in dense phases ──
  if (den > 0.6 && !rhythmGrid[_step] && !hatPat[_step] && Math.random() < den * 0.15) {
    const ghostNote = Math.random() < 0.5 ? DRUM.HAT_PEDAL : DRUM.CONGA_LO;
    const ghostVel = Math.round(20 + Math.random() * 15);
    sendMIDINote(1, ghostNote, ghostVel, Math.round(stepMs * 0.3));
    addMidiNote(1, ghostNote / 127, ghostVel / 127);
  }
}

// ── Cache track-specific data to avoid re-importing tracks.js ──
import { TRACKS } from './tracks.js';
const TRACKS_CACHE = TRACKS;
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:8282`, click start. After ~60s (germoglio phase ends), you should hear:
- Kick on the syncopated grid pattern (CH0)
- Hi-hat sparse in pulsazione, full 8ths in densita
- Snare on backbeat in densita

Use keyboard `2` to jump to pulsazione, `3` for densita to hear the progression immediately.

- [ ] **Step 3: Commit**

```bash
git add src/rhythm.js
git commit -m "iii: rhythm.js — kick + hat + snare + ghost notes, phase-driven density"
```

---

## Task 8: Implement bass.js — dub groove for SOLCO

**Files:**
- Modify: `src/bass.js`

- [ ] **Step 1: Implement _tick() with bass pattern**

Replace the placeholder in `src/bass.js`:

```javascript
import { TRACKS } from './tracks.js';

// ── Internal state ──
let _lastNote = -1;
let _velSweep = 0; // 0–1, cycles over 8 bars for velocity variation

function _tick() {
  const { phase, density, velocityCeiling, bpm, root, scale, track } = worldState;
  const den = density.bass;
  const ceil = velocityCeiling.bass;
  if (den < 0.01 || !bpm) return;

  const trackDef = TRACKS[track];
  if (!trackDef || !trackDef.bassPattern) return;

  const stepMs = 60000 / bpm / 4;
  const pat = trackDef.bassPattern;
  const offset = pat[_step];

  // Velocity sweep over 8-bar cycle (subtle breathing)
  _velSweep = (_bar % 8) / 8;
  const sweepMod = 0.85 + 0.15 * Math.sin(_velSweep * Math.PI * 2);

  if (offset > 0) {
    // Find note: root + offset, snapped to scale
    let note = root + offset;
    // Clamp to register
    const [lo, hi] = worldState.register.bass;
    while (note < lo) note += 12;
    while (note > hi) note -= 12;

    const vel = Math.round(Math.min(ceil, (50 + den * 40) * sweepMod + (Math.random() - 0.5) * 4));
    const dur = Math.round(stepMs * 3); // long enough to feel the groove

    // Note-off previous if different
    sendMIDINote(3, note, vel, dur);
    addMidiNote(3, note / 127, vel / 127);
    _lastNote = note;
  }

  // ── Ghost note: 20% chance on empty steps adjacent to played steps ──
  if (offset === 0 && den > 0.4 && _step > 0 && pat[(_step - 1 + 16) % 16] > 0 && Math.random() < 0.2) {
    const ghostNote = root;
    const [lo, hi] = worldState.register.bass;
    const gn = ghostNote < lo ? ghostNote + 12 : ghostNote > hi ? ghostNote - 12 : ghostNote;
    const ghostVel = Math.round(20 + den * 10);
    sendMIDINote(3, gn, ghostVel, Math.round(stepMs * 1.5));
    addMidiNote(3, gn / 127, ghostVel / 127);
  }
}
```

- [ ] **Step 2: Verify in browser**

Jump to phase `3` (densita). You should hear:
- Bass playing on steps 3, 5, 10, 12 — complementary to the kick
- Ghost notes occasionally on adjacent steps
- Velocity breathing over 8-bar cycle

- [ ] **Step 3: Commit**

```bash
git add src/bass.js
git commit -m "iii: bass.js — dub syncopated pattern, ghost notes, velocity sweep"
```

---

## Task 9: Implement harmony.js — drone + chords for SOLCO

**Files:**
- Modify: `src/harmony.js`

- [ ] **Step 1: Implement _tick() with drone and chords**

Replace the placeholder in `src/harmony.js`:

```javascript
import { TRACKS } from './tracks.js';

// ── Internal ──
let _lastDroneBar = -1;
let _lastChordBar = -1;
let _droneActive = false;

function _tick() {
  const { phase, density, velocityCeiling, root, scale, track } = worldState;
  const den = density.harmony;
  const ceil = velocityCeiling.harmony;
  if (den < 0.01) return;

  const trackDef = TRACKS[track];
  const bpm = worldState.bpm || 60;
  const beatMs = 60000 / bpm;

  // ── CH2 DRONE — root note, refreshed every 4 bars ──
  if (_step === 0 && _bar % 4 === 0 && _bar !== _lastDroneBar) {
    _lastDroneBar = _bar;
    const droneVel = Math.round(Math.min(ceil, 35 + den * 25));
    const droneDur = Math.round(beatMs * 15); // ~4 bars
    sendMIDINote(2, root, droneVel, droneDur);
    addMidiNote(2, root / 127, droneVel / 127);

    // Octave doubling when density > 0.3
    if (den > 0.3 && root + 12 <= 72) {
      sendMIDINote(2, root + 12, Math.round(droneVel * 0.6), droneDur);
    }
    _droneActive = true;
  }

  // ── CH4 CHORDS — voice-led progression ──
  if (!trackDef || !trackDef.chords || trackDef.chords.length === 0) return;

  // Chord change rate depends on phase
  const barsPerChord = phase === 'germoglio' ? 8
    : phase === 'dissoluzione' ? 8
    : phase === 'rottura' ? 2
    : 4; // pulsazione, densita

  if (_step === 0 && _bar % barsPerChord === 0 && _bar !== _lastChordBar) {
    _lastChordBar = _bar;
    _chordIdx = (_chordIdx + 1) % trackDef.chords.length;

    const chord = trackDef.chords[_chordIdx];
    const chordVel = Math.round(Math.min(ceil, 35 + den * 30 + (Math.random() - 0.5) * 4));
    const chordDur = Math.round(beatMs * barsPerChord * 3.5); // sustain ~87% of period

    // Send chord notes (CH4)
    for (const note of chord) {
      // Clamp to register
      let n = note;
      const [lo, hi] = worldState.register.chords;
      while (n < lo) n += 12;
      while (n > hi) n -= 12;

      sendMIDINote(4, n, chordVel + Math.round((Math.random() - 0.5) * 3), chordDur);
      addMidiNote(4, n / 127, chordVel / 127);
    }

    // Update worldState.currentChord (exception: harmony writes this)
    worldState.currentChord = [...chord];
  }
}
```

- [ ] **Step 2: Verify in browser**

Jump to phase `2` (pulsazione) or `3` (densita). You should hear:
- Sustained drone on G3 (root) with octave doubling
- Chords changing every 4 bars (2 bars in rottura)
- Voice leading between chords

- [ ] **Step 3: Commit**

```bash
git add src/harmony.js
git commit -m "iii: harmony.js — drone + chord progression with voice leading, writes currentChord"
```

---

## Task 10: Implement melody.js — voice + lead + arp for SOLCO

**Files:**
- Modify: `src/melody.js`

- [ ] **Step 1: Implement _tick() with all three voices**

Replace the placeholder in `src/melody.js`:

```javascript
import { TRACKS } from './tracks.js';

// ── Internal state ──
let _phraseNotes = [];   // current phrase for CH5 (voice)
let _phraseIdx = 0;      // position in current phrase
let _phraseRepeat = 0;   // how many times current phrase has played
let _lastLeadStep = -1;
let _arpPattern = [];     // current arp note sequence
let _arpIdx = 0;
let _lastChordStr = '';   // to detect chord changes for arp
let _pendingLead = null;  // scheduled lead note (fires on next tick)

// ── Scale-aware note picker ──
function _pickFromScale(scale, lo, hi) {
  const pool = scale.filter(n => n >= lo && n <= hi);
  if (pool.length === 0) return lo;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Markov-style phrase generator ──
function _generatePhrase(scale, lo, hi, length) {
  const pool = scale.filter(n => n >= lo && n <= hi);
  if (pool.length === 0) return [lo];
  const phrase = [pool[Math.floor(Math.random() * pool.length)]];
  for (let i = 1; i < length; i++) {
    const prev = phrase[i - 1];
    const prevIdx = pool.indexOf(prev);
    // 70% step motion, 20% skip, 10% leap
    const r = Math.random();
    let nextIdx;
    if (r < 0.7) {
      nextIdx = prevIdx + (Math.random() < 0.5 ? 1 : -1);
    } else if (r < 0.9) {
      nextIdx = prevIdx + (Math.random() < 0.5 ? 2 : -2);
    } else {
      nextIdx = prevIdx + (Math.random() < 0.5 ? 3 : -3);
    }
    nextIdx = Math.max(0, Math.min(pool.length - 1, nextIdx));
    phrase.push(pool[nextIdx]);
  }
  return phrase;
}

// ── Build arp pattern from chord ──
function _buildArp(chord, scale, lo, hi, noteCount) {
  if (!chord || chord.length === 0) return [];
  // Spread chord notes across register, add passing tones from scale
  const pool = [];
  for (const n of chord) {
    let note = n;
    while (note < lo) note += 12;
    while (note > hi) note -= 12;
    if (note >= lo && note <= hi) pool.push(note);
    // Add octave if fits
    if (note + 12 <= hi) pool.push(note + 12);
  }
  // Fill remaining slots with scale notes between chord tones
  const scalePool = scale.filter(n => n >= lo && n <= hi);
  while (pool.length < noteCount && scalePool.length > 0) {
    pool.push(scalePool[Math.floor(Math.random() * scalePool.length)]);
  }
  pool.sort((a, b) => a - b);
  // Take first noteCount, alternating up/down for interest
  const result = [];
  let ascending = true;
  const unique = [...new Set(pool)];
  let idx = 0;
  for (let i = 0; i < noteCount; i++) {
    result.push(unique[idx % unique.length]);
    idx += ascending ? 1 : -1;
    if (idx >= unique.length - 1) ascending = false;
    if (idx <= 0) ascending = true;
  }
  return result;
}

function _tick() {
  const { phase, density, velocityCeiling, scale, root, bpm, track } = worldState;
  const den = density.melody;
  const ceil = velocityCeiling.melody;
  if (den < 0.01) return;

  const trackDef = TRACKS[track];
  const stepMs = 60000 / (bpm || 60) / 4;
  const [voiceLo, voiceHi] = worldState.register.melody;
  const [leadLo, leadHi] = worldState.register.lead;
  const [arpLo, arpHi] = worldState.register.arp;

  // ── Fire pending lead note from previous tick ──
  if (_pendingLead) {
    sendMIDINote(6, _pendingLead.note, _pendingLead.vel, _pendingLead.dur);
    addMidiNote(6, _pendingLead.note / 127, _pendingLead.vel / 127);
    _pendingLead = null;
  }

  // ═══ CH5 VOICE — melodic phrases ═══
  // Phrase rate: every 2 steps in densita/rottura, every 4 in pulsazione
  const voiceRate = (phase === 'densita' || phase === 'rottura') ? 2
    : phase === 'pulsazione' ? 4
    : 8; // germoglio: rare
  const voiceActive = phase !== 'germoglio' || (_step === 0 && _bar % 4 === 0); // germoglio: 1 note per 4 bars

  if (_step % voiceRate === 0 && den > 0.1 && voiceActive) {
    // Generate new phrase if needed
    if (_phraseIdx >= _phraseNotes.length) {
      if (_phraseRepeat < 2 && _phraseNotes.length > 0) {
        // Repeat phrase (memorability)
        _phraseIdx = 0;
        _phraseRepeat++;
      } else {
        // New phrase
        const len = phase === 'germoglio' ? 1 : (8 + Math.floor(Math.random() * 5)); // 8–12 notes
        _phraseNotes = _generatePhrase(scale, voiceLo, voiceHi, len);
        _phraseIdx = 0;
        _phraseRepeat = 0;
      }
    }

    const note = _phraseNotes[_phraseIdx];
    const vel = Math.round(Math.min(ceil, Math.max(40, 45 + den * 35 + (Math.random() - 0.5) * 6)));
    const dur = Math.round(stepMs * voiceRate * 0.9);
    sendMIDINote(5, note, vel, dur);
    addMidiNote(5, note / 127, vel / 127);
    _phraseIdx++;

    // ═══ CH6 LEAD — call-response (scheduled for next tick, no setTimeout) ═══
    // 40% chance to respond on next step, in denser phases
    if (den > 0.3 && Math.random() < 0.4 && phase !== 'germoglio') {
      const interval = Math.random() < 0.5 ? 3 : 4; // minor or major third
      let leadNote = note + interval;
      while (leadNote < leadLo) leadNote += 12;
      while (leadNote > leadHi) leadNote -= 12;
      // Snap to scale
      const closest = scale.reduce((best, n) =>
        Math.abs(n - leadNote) < Math.abs(best - leadNote) ? n : best, scale[0]);
      const leadVel = Math.round(Math.min(ceil * 0.85, vel * 0.7 + (Math.random() - 0.5) * 4));
      const leadDur = Math.round(stepMs * voiceRate * 0.7);
      // Queue for next step (no setTimeout — step clock drives it)
      _pendingLead = { note: closest, vel: leadVel, dur: leadDur };
    }
  }

  // ═══ CH7 ARP — repetitive pattern from currentChord ═══
  if (!trackDef) return;
  const arpRate = trackDef.arpRate || 8; // 8 = 8th notes (every 2 steps)
  const arpStepMod = arpRate === 16 ? 1 : 2; // 16th = every step, 8th = every 2 steps
  const arpNoteCount = trackDef.arpNotes || 4;

  // Rebuild arp when chord changes
  const chordStr = worldState.currentChord.join(',');
  if (chordStr !== _lastChordStr && worldState.currentChord.length > 0) {
    _arpPattern = _buildArp(worldState.currentChord, scale, arpLo, arpHi, arpNoteCount);
    _arpIdx = 0;
    _lastChordStr = chordStr;
  }

  // Arp only in pulsazione+ phases, respects density
  if (_arpPattern.length > 0 && den > 0.3 && phase !== 'germoglio' && _step % arpStepMod === 0) {
    const arpNote = _arpPattern[_arpIdx % _arpPattern.length];
    const arpVel = Math.round(Math.min(ceil * 0.7, 35 + den * 30 + (Math.random() - 0.5) * 3));
    const arpDur = Math.round(stepMs * arpStepMod * 0.85);
    sendMIDINote(7, arpNote, arpVel, arpDur);
    addMidiNote(7, arpNote / 127, arpVel / 127);
    _arpIdx++;
  }
}
```

- [ ] **Step 2: Verify in browser**

Jump to phase `3` (densita). You should hear:
- CH5: melodic phrases that repeat 2-3 times before regenerating
- CH6: occasional responses a third above/below, slightly delayed
- CH7: arpeggio pattern cycling through chord tones, steady rhythm

Jump to phase `1` (germoglio). You should hear:
- CH5: rare single notes (1 per 4 bars) — "water drops"
- CH6+CH7: silent

- [ ] **Step 3: Commit**

```bash
git add src/melody.js
git commit -m "iii: melody.js — voice phrases + lead call-response + arp from currentChord"
```

---

## Task 11: Implement texture.js — CC messages

**Files:**
- Modify: `src/texture.js`

- [ ] **Step 1: Implement CC messages and rare events**

Replace the placeholder in `src/texture.js`:

```javascript
import { worldState } from './world-state.js';
import { sendMIDICC } from './midi.js';

let _timeAcc = 0;
let _lastCCTime = 0;
const CC_INTERVAL = 0.1; // send CC every 100ms (10 Hz — smooth enough, not spammy)

export function initTexture() {
  _timeAcc = 0;
  _lastCCTime = 0;
  console.log('[TEXTURE] Initialized');
}

export function updateTexture(dt) {
  if (worldState.density.texture < 0.01) return;
  _timeAcc += dt;

  // ── CC74 (filter cutoff) — follows arc position ──
  // ── CC1 (modwheel) — follows density.melody for expression ──
  if (_timeAcc - _lastCCTime >= CC_INTERVAL) {
    _lastCCTime = _timeAcc;

    // CC74 on CH3 (bass) — filter opens with arc
    const filterVal = Math.round(Math.min(127, worldState.arc * 100 + 20));
    sendMIDICC(3, 74, filterVal);

    // CC1 on CH5 (voice) — expression follows melodic density
    const exprVal = Math.round(Math.min(127, worldState.density.melody * 127));
    sendMIDICC(5, 1, exprVal);
  }
}
```

- [ ] **Step 2: Verify in browser**

Check the MIDI monitor in Ableton/hardware: CC74 should change over time on CH3, CC1 on CH5. If no hardware connected, verify no console errors.

- [ ] **Step 3: Commit**

```bash
git add src/texture.js
git commit -m "iii: texture.js — CC74 filter + CC1 expression, 10Hz update rate"
```

---

## Task 12: Integration test + version commit

**Files:**
- None new — this is a verification and polish task.

- [ ] **Step 1: Full playthrough test**

Open `http://localhost:8282`. Click start. Let it run for 5 minutes (or use keyboard 1-5 to jump through phases).

**Verify per phase:**
| Phase | Expected |
|-------|----------|
| germoglio | Drone + rare voice notes. No rhythm. Quiet. |
| pulsazione | Kick enters, sparse hat, bass starts. Voice phrases. Arp begins. |
| densita | Full groove: kick + hat 8ths + snare backbeat + bass pattern + chords + voice + lead + arp |
| rottura | Everything at peak. Fast chord changes. Dense hat. |
| dissoluzione | Elements drop out. Back to drone + sparse. |

- [ ] **Step 2: Listen for balance issues**

Check that:
- Bass is audible over the kick (if not: raise `velocityCeiling.bass` in tracks.js)
- Melodies are audible over the hat (if not: raise `velocityCeiling.melody`)
- Arp doesn't overwhelm voice (if so: lower arp velocity in melody.js)
- No channel collision (kick and bass don't overlap on same beats)

Note adjustments needed and make them in the relevant files.

- [ ] **Step 3: Console clean-up check**

Verify console has no errors or warnings. Expected logs:
```
[III] Director + 5 modules initialized
[DIR3] Loaded track: SOLCO, duration: 288s
[RHYTHM] Initialized
[HARMONY] Initialized
[BASS] Initialized
[MELODY] Initialized
[TEXTURE] Initialized
[DIR3] Phase: pulsazione (arc: 0.21)
[DIR3] Phase: densita (arc: 0.40)
...
```

- [ ] **Step 4: Commit as v0.1.0-iii**

```bash
git add -A
git commit -m "iii v0.1.0: SOLCO track — Director + 5 modules, new channel map, World State architecture

Band con Direttore: single World State, 5 functional modules (rhythm, harmony, bass, melody, texture).
CH1 unified perc kit, CH7 arpeggio. Director writes constraints, modules generate notes.
Phase 0 + Phase 1 complete — one track (SOLCO) plays through 5 phases."
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | World State object | `world-state.js` (new) |
| 2 | Track definitions + SOLCO | `tracks.js` (new) |
| 3 | Director (phase progression) | `director3.js` (new) |
| 4 | 5 module skeletons | `rhythm.js`, `harmony.js`, `bass.js`, `melody.js`, `texture.js` (new) |
| 5 | MIDI CC + channel roles | `midi.js` (modify) |
| 6 | Rewire main.js | `main.js` (modify, protected) |
| 7 | Rhythm: kick + kit | `rhythm.js` (modify) |
| 8 | Bass: dub groove | `bass.js` (modify) |
| 9 | Harmony: drone + chords | `harmony.js` (modify) |
| 10 | Melody: voice + lead + arp | `melody.js` (modify) |
| 11 | Texture: CC messages | `texture.js` (modify) |
| 12 | Integration test + version | all |

**Next:** After testing SOLCO, start a new brainstorming session to define the remaining 6 track identities (Phase 2).
