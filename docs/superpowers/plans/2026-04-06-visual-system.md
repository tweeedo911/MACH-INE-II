# MACH:INE III Visual System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the monolithic halftone renderer with 6 track-specific composition modules, each with its own spatial logic, driven by worldState visual fields.

**Architecture:** Shared toolkit (Bayer, dot drawing, color math) extracted from field.js. field.js becomes a thin dispatcher that selects the active composition module based on worldState.track. colors.js simplified to read worldState.palette. Each comp module owns the full canvas.

**Tech Stack:** ES modules (zero build), Canvas 2D API, no dependencies.

**Testing:** No test framework. Every task ends with browser verification: `python3 -m http.server 8282` → `http://localhost:8282` → Shift+N to switch tracks.

**Spec:** `docs/superpowers/specs/2026-04-06-visual-system-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/visual-toolkit.js` | Bayer matrix, dot drawing, color math, spatial utils |
| Create | `src/comp-liminale.js` | NEBBIA + RITORNO composition (perspective) |
| Create | `src/comp-linee.js` | TESSUTO composition (parallel lines) |
| Create | `src/comp-quadrati.js` | SOLCO composition (pulsing blocks) |
| Create | `src/comp-negativo.js` | RESPIRO composition (inverted saturation) |
| Create | `src/comp-griglia.js` | MACCHINA composition (Ikeda grid) |
| Create | `src/comp-treno.js` | TEMPESTA composition (parallax train) |
| Modify | `src/field.js` | Gutted → dispatcher: selects comp module, handles crossfade |
| Modify | `src/colors.js` | Simplified: reads worldState.palette, lerps, exports getPalette() |
| Modify | `src/render.js` | Builds env object, passes to field.js, removes old director calls |
| Modify | `src/main.js` | Removes old director.js init, updates wiring |

---

### Task 1: Create visual-toolkit.js

Extract reusable rendering primitives. Zero state, pure functions.

**Files:**
- Create: `src/visual-toolkit.js`

- [ ] **Step 1: Create visual-toolkit.js with Bayer matrix and core functions**

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Visual Toolkit
//  Pure functions for composition modules. Zero state.
// ═══════════════════════════════════════════════════════════

// ── Bayer 8x8 ordered dither matrix ──
const BAYER8 = new Float32Array([
   0/64, 32/64,  8/64, 40/64,  2/64, 34/64, 10/64, 42/64,
  48/64, 16/64, 56/64, 24/64, 50/64, 18/64, 58/64, 26/64,
  12/64, 44/64,  4/64, 36/64, 14/64, 46/64,  6/64, 38/64,
  60/64, 28/64, 52/64, 20/64, 62/64, 30/64, 54/64, 22/64,
   3/64, 35/64, 11/64, 43/64,  1/64, 33/64,  9/64, 41/64,
  51/64, 19/64, 59/64, 27/64, 49/64, 17/64, 57/64, 25/64,
  15/64, 47/64,  7/64, 39/64, 13/64, 45/64,  5/64, 37/64,
  63/64, 31/64, 55/64, 23/64, 61/64, 29/64, 53/64, 21/64,
]);

// ── Bayer lookup ──
export function bayerAt(col, row) {
  return BAYER8[(row & 7) * 8 + (col & 7)];
}

export function bayerTest(col, row, density) {
  return density > BAYER8[(row & 7) * 8 + (col & 7)];
}

// ── Dot drawing ──
export function drawDot(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
}

// Fill rectangular area with Bayer-dithered dots
export function fillBayer(ctx, x, y, w, h, density, dotSize, color) {
  const cols = Math.ceil(w / dotSize);
  const rows = Math.ceil(h / dotSize);
  ctx.fillStyle = color;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (bayerTest(c, r, density)) {
        ctx.fillRect(x + c * dotSize, y + r * dotSize, dotSize, dotSize);
      }
    }
  }
}

// Fill entire canvas background with solid color
export function fillBackground(ctx, W, H, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

// ── Color utilities ──
export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function rgbString(r, g, b, a) {
  if (a !== undefined && a < 1) return `rgba(${r|0},${g|0},${b|0},${a.toFixed(3)})`;
  return `rgb(${r|0},${g|0},${b|0})`;
}

export function lerpColor(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

// ── Math utilities ──
export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
export function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t); }
export function mapRange(v, inMin, inMax, outMin, outMax) {
  return outMin + (v - inMin) / (inMax - inMin) * (outMax - outMin);
}

// ── Spatial utilities ──
// Simple hash-based noise (deterministic, no allocation)
export function noiseAt(x, y, t) {
  const n = Math.sin(x * 127.1 + y * 311.7 + t * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

// Map grid position to pixel coordinates
export function gridPosition(col, row, cols, rows, W, H) {
  return {
    x: (col + 0.5) / cols * W,
    y: (row + 0.5) / rows * H,
  };
}

// Y coordinate with perspective convergence toward vanishing point
export function perspectiveY(y, depth, vanishY) {
  return vanishY + (y - vanishY) * (1 - depth);
}

// Scale value by perspective depth (farther = smaller)
export function perspectiveScale(value, depth) {
  return value * (1 - depth * 0.8);
}

// ── Phase parameter interpolation ──
// Given phase params table and current phase + phase progress, lerp smoothly
export function phaseParam(params, phase, progress) {
  const val = params[phase];
  if (val === undefined) return 0;
  return val;
  // Modules can add their own lerp logic between phases
}

// ── LCG pseudo-random (fast, no GC, seedable) ──
let _seed = 42;
export function seedRng(s) { _seed = s | 0; }
export function rng() {
  _seed = (_seed * 1103515245 + 12345) & 0x7FFFFFFF;
  return _seed / 0x7FFFFFFF;
}
```

- [ ] **Step 2: Verify toolkit loads without errors**

Open browser console at `http://localhost:8282`, run:
```javascript
import('./src/visual-toolkit.js').then(tk => console.log('toolkit OK', Object.keys(tk)))
```
Expected: logs toolkit OK with all export names.

- [ ] **Step 3: Commit**

```bash
git add src/visual-toolkit.js
git commit -m "v3-visual: create visual-toolkit.js — Bayer, dot, color, math, spatial utils"
```

---

### Task 2: Simplify colors.js

Replace the old 8-palette + climax + chromatic system with a simple worldState.palette reader.

**Files:**
- Modify: `src/colors.js`

- [ ] **Step 1: Rewrite colors.js to read worldState.palette**

Replace the entire file with:

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Color System
//  Reads worldState.palette, lerps smoothly, exports getPalette().
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';

// ── Current interpolated palette (RGB arrays) ──
const _current = {
  bg:     [0, 0, 0],
  dot:    [255, 255, 255],
  accent: [0, 0, 0],
};
const _target = {
  bg:     [0, 0, 0],
  dot:    [255, 255, 255],
  accent: [0, 0, 0],
};

let _lerpSpeed = 0.02;

function hexToRgb(hex) {
  if (!hex) return [0, 0, 0];
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpChannel(current, target, speed) {
  for (let i = 0; i < 3; i++) {
    current[i] += (target[i] - current[i]) * speed;
  }
}

// ── Update: call every frame ──
export function updateColors(dt) {
  // Read targets from worldState
  const p = worldState.palette;
  _target.bg = hexToRgb(p.bg);
  _target.dot = hexToRgb(p.dot);
  _target.accent = hexToRgb(p.accent);

  // Framerate-independent lerp
  const s = dt ? (1 - Math.pow(1 - _lerpSpeed, dt * 60)) : _lerpSpeed;
  lerpChannel(_current.bg, _target.bg, s);
  lerpChannel(_current.dot, _target.dot, s);
  lerpChannel(_current.accent, _target.accent, s);
}

// ── Snap palette immediately (no lerp) — for init or hard cuts ──
export function snapPalette() {
  const p = worldState.palette;
  const bg = hexToRgb(p.bg);
  const dot = hexToRgb(p.dot);
  const accent = hexToRgb(p.accent);
  for (let i = 0; i < 3; i++) {
    _current.bg[i] = bg[i];
    _current.dot[i] = dot[i];
    _current.accent[i] = accent[i];
  }
}

// ── Get current palette (RGB arrays, interpolated) ──
export function getPalette() {
  return _current;
}

// ── Convenience: get bg as CSS string ──
export function getBgString() {
  const b = _current.bg;
  return `rgb(${b[0]|0},${b[1]|0},${b[2]|0})`;
}

// ── Set lerp speed (0.01 = slow transition, 0.1 = fast) ──
export function setLerpSpeed(speed) {
  _lerpSpeed = speed;
}
```

- [ ] **Step 2: Verify no import errors in browser**

Open `http://localhost:8282`, check console for import errors related to colors.js.
Note: render.js and field.js still import old exports — they will break. That's expected — we fix them in Task 3-4.

- [ ] **Step 3: Commit**

```bash
git add src/colors.js
git commit -m "v3-visual: simplify colors.js — reads worldState.palette, smooth lerp"
```

---

### Task 3: Refactor field.js into dispatcher

Replace the 680-line monolithic renderer with a thin dispatcher that routes to composition modules.

**Files:**
- Modify: `src/field.js`

- [ ] **Step 1: Rewrite field.js as composition dispatcher**

Replace the entire file with:

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Visual Dispatcher
//  Routes rendering to the active composition module.
//  Handles crossfade during track transitions.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import * as toolkit from './visual-toolkit.js';

// ── Composition modules (lazy: populated on first use) ──
import * as compLiminale from './comp-liminale.js';
import * as compLinee from './comp-linee.js';
import * as compQuadrati from './comp-quadrati.js';
import * as compNegativo from './comp-negativo.js';
import * as compGriglia from './comp-griglia.js';
import * as compTreno from './comp-treno.js';

const COMP_MAP = {
  NEBBIA:   compLiminale,
  TESSUTO:  compLinee,
  SOLCO:    compQuadrati,
  RESPIRO:  compNegativo,
  MACCHINA: compGriglia,
  TEMPESTA: compTreno,
  RITORNO:  compLiminale,
};

// ── State ──
let _activeComp = null;       // current composition module
let _activeTrack = null;      // current track name
let _outgoingComp = null;     // composition being faded out during transition
let _transitionAlpha = 0;     // 0 = all outgoing, 1 = all incoming

// ── Offscreen buffer for crossfade ──
let _offCanvas = null;
let _offCtx = null;

function ensureOffscreen(W, H) {
  if (!_offCanvas || _offCanvas.width !== W || _offCanvas.height !== H) {
    _offCanvas = document.createElement('canvas');
    _offCanvas.width = W;
    _offCanvas.height = H;
    _offCtx = _offCanvas.getContext('2d');
  }
}

// ── Build env object for composition modules ──
function buildEnv(extra) {
  return {
    worldState,
    midiTrail: extra.midiTrail || [],
    onsetWaves: extra.onsetWaves || [],
    audio: extra.audio,
    midi: extra.midi,
    state: extra.state,
    dt: extra.dt,
    globalTime: extra.globalTime,
    toolkit,
  };
}

// ── Init: called when system boots ──
export function initField() {
  // Will be initialized on first renderField call
}

// ── Onset waves (kept here for render.js compatibility) ──
export let onsetWaves = [];
export function addOnsetWave(cx, cy, W, H) {
  onsetWaves.push({ cx: cx * W, cy: cy * H, radius: 0, strength: 1 });
}

// ── MIDI trail (kept here for render.js compatibility) ──
export let midiTrail = [];
const MAX_TRAIL = 80;
const CH_MAX = [4, 2, 3, 7, 9, 14, 10, 5];

export function addMidiNote(ch, noteNorm, velNorm) {
  // Floor for voice/lead visibility
  const visVel = (ch === 5 || ch === 6) ? Math.max(velNorm, 0.75)
              : (ch >= 2 && ch <= 4)   ? Math.max(velNorm, 0.3)
              : velNorm;

  // Per-channel eviction
  const chMax = CH_MAX[ch] ?? 6;
  let chCount = 0, oldestIdx = -1, oldestTime = -1;
  for (let i = 0; i < midiTrail.length; i++) {
    if (midiTrail[i].ch === ch) {
      chCount++;
      if (midiTrail[i].time > oldestTime) { oldestTime = midiTrail[i].time; oldestIdx = i; }
    }
  }
  if (chCount >= chMax && oldestIdx >= 0) {
    midiTrail[oldestIdx] = midiTrail[midiTrail.length - 1];
    midiTrail.length--;
  }

  midiTrail.push({
    ch, note: noteNorm, vel: visVel,
    x: noteNorm,                        // normalized 0-1 (comp decides mapping)
    y: 1 - noteNorm,                    // default: pitch → vertical
    alpha: 1,
    time: 0,
    decay: 0.97,
  });

  if (midiTrail.length > MAX_TRAIL) midiTrail.shift();
}

// ── Update waves and trail decay ──
export function updateWaves(dt) {
  for (let i = onsetWaves.length - 1; i >= 0; i--) {
    const w = onsetWaves[i];
    w.radius += 300 * dt;
    w.strength *= 0.96;
    if (w.strength < 0.01) {
      onsetWaves[i] = onsetWaves[onsetWaves.length - 1];
      onsetWaves.length--;
    }
  }
  for (let i = midiTrail.length - 1; i >= 0; i--) {
    const n = midiTrail[i];
    n.time += dt;
    n.alpha *= n.decay;
    if (n.alpha < 0.01) {
      midiTrail[i] = midiTrail[midiTrail.length - 1];
      midiTrail.length--;
    }
  }
}

// ── Main render entry point ──
export function renderField(ctx, W, H, envData) {
  const env = buildEnv({
    ...envData,
    midiTrail,
    onsetWaves,
  });

  const track = worldState.track;

  // Detect track change → switch composition
  if (track !== _activeTrack) {
    const newComp = COMP_MAP[track];
    if (newComp) {
      // Start transition if we have an outgoing composition
      if (_activeComp && worldState.transition) {
        _outgoingComp = _activeComp;
        _transitionAlpha = 0;
      } else if (_activeComp) {
        _activeComp.destroy();
      }
      _activeComp = newComp;
      _activeTrack = track;
      _activeComp.init(env);
    }
  }

  // Handle crossfade transition
  if (_outgoingComp && worldState.transition) {
    _transitionAlpha = worldState.transition.progress || 0;
    ensureOffscreen(W, H);

    // Draw outgoing to offscreen
    _offCtx.clearRect(0, 0, W, H);
    _outgoingComp.render(_offCtx, W, H, env);

    // Draw incoming to main canvas
    _activeComp.render(ctx, W, H, env);

    // Composite outgoing with fading alpha
    ctx.save();
    ctx.globalAlpha = 1 - _transitionAlpha;
    ctx.drawImage(_offCanvas, 0, 0);
    ctx.restore();

    // Transition complete
    if (_transitionAlpha >= 1) {
      _outgoingComp.destroy();
      _outgoingComp = null;
    }
  } else if (_activeComp) {
    // Normal render — single composition
    _activeComp.render(ctx, W, H, env);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/field.js
git commit -m "v3-visual: field.js → composition dispatcher with crossfade"
```

---

### Task 4: Update render.js — build env, remove old director

Remove old director.js visual calls. Build env object and pass to field.js.

**Files:**
- Modify: `src/render.js`

- [ ] **Step 1: Rewrite render.js imports and renderFrame**

Replace the entire file. Key changes:
- Remove imports from director.js (updateDirector, applyCamera, scene, arc, engineRender, framing)
- Remove imports of old colors.js exports (inverted, inClimax, climaxProgress, etc.)
- Import new colors.js (updateColors, getPalette, getBgString, snapPalette)
- Import field.js new exports
- Build envData and pass to renderField

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Render Orchestrator
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { audio, getAudioGain } from './audio.js';
import { midi, noteName } from './midi.js';
import { state } from './state.js';
import { dna, updatePrimitives } from './dna.js';
import { entities, fossils, updateGenerations, buildEntityGrid, triggerOnset, triggerMIDI } from './generations.js';
import { updateColors, getPalette, getBgString, snapPalette } from './colors.js';
import { getDirector3Status, isDirector3Playing } from './director3.js';
import { worldState, phaseState } from './world-state.js';
import { renderField, updateWaves, addOnsetWave, addMidiNote } from './field.js';
import { recordSnapshot, recordPhaseCheck, isRecording } from './session-recorder.js';

let canvas, ctx;
let W, H;
let globalTime = 0;
let lastOnset = false;
let hudMinimal, hudDebug, hudSeq;
let _seqAct, _seqFill, _seqStatus, _seqKeys;
let showHUD = true, showDebug = false;
let frameCount = 0;
let _projectorWin = null;

export function setProjectorWindow(win) { _projectorWin = win; }

export function initRender(cvs) {
  canvas = cvs;
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

export function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

export function setHUDElements(minimal, debug, seq) {
  hudMinimal = minimal;
  hudDebug = debug;
  hudSeq = seq;
  if (hudSeq) {
    _seqAct    = hudSeq.querySelector('.seq-act');
    _seqFill   = hudSeq.querySelector('.seq-fill');
    _seqStatus = hudSeq.querySelector('.seq-status');
    _seqKeys   = hudSeq.querySelector('.seq-keys');
  }
}

export function getSize() { return { W, H }; }

// ── Main render frame ──
export function renderFrame(_now, dt) {
  globalTime += dt;
  frameCount++;

  // Onset detection → entity spawn + onset wave
  if (audio.onset && !lastOnset) {
    const pos = triggerOnset(state, { A: true, B: true, C: true });
    addOnsetWave(pos.cx, pos.cy, W, H);
  }
  lastOnset = audio.onset;

  // MIDI notes → entity spawn + midi trail
  const notes = midi.newNotes;
  if (notes.length > CFG.maxMidiNotesPerFrame) {
    notes.sort((a, b) => b.vel - a.vel);
    notes.length = CFG.maxMidiNotesPerFrame;
  }
  for (const n of notes) {
    const noteNorm = n.note / 127;
    const velNorm = n.vel / 127;
    triggerMIDI(state, { A: true, B: true, C: true }, noteNorm, velNorm);
    addMidiNote(n.ch, noteNorm, velNorm);
  }
  midi.newNotes.length = 0;

  // Update systems
  updateColors(dt);
  updatePrimitives(dt, state, 1);
  updateGenerations(dt, state, 1, false, 0, { A: true, B: true, C: true }, 'normal');
  updateWaves(dt);
  buildEntityGrid(W, H);

  // Background — from current interpolated palette
  const bgStr = getBgString();
  ctx.fillStyle = bgStr;
  ctx.fillRect(0, 0, W, H);

  // Render composition
  renderField(ctx, W, H, {
    audio,
    midi,
    state,
    dt,
    globalTime,
  });

  // HUD
  if (frameCount % CFG.hudUpdateInterval === 0) {
    if (showHUD)   updateHUDMinimal();
    if (showDebug) { updateHUDDebug(); updateSeqPanel(); }
  }

  // Session recorder
  recordSnapshot({ arc: worldState.arc, currentBpm: worldState.bpm || 0 }, entities, dt * 1000);
  recordPhaseCheck({ arc: worldState.arc, currentBpm: worldState.bpm || 0 });
}

// ── Keyboard ──
export function handleKey(code) {
  if (code === 'KeyH') {
    showHUD = !showHUD;
    if (hudMinimal) hudMinimal.style.display = showHUD ? 'block' : 'none';
  }
  if (code === 'KeyD') {
    showDebug = !showDebug;
    if (hudDebug) hudDebug.style.display = showDebug ? 'block' : 'none';
    if (hudSeq)   hudSeq.style.display   = showDebug ? 'block' : 'none';
  }
  if (code === 'KeyF') {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }
  if (code === 'KeyR') return 'REGEN';
}

// ── HUD Minimal ──
function updateHUDMinimal() {
  if (!hudMinimal) return;
  const primList = dna ? dna.primitives.join('+') : '——';
  const d3 = getDirector3Status();
  const playing = isDirector3Playing();
  const icon = playing ? '▶' : '⏸';
  const min = Math.floor(d3.totalTime / 60);
  const sec = Math.floor(d3.totalTime % 60);
  const time = `${min}:${sec < 10 ? '0' : ''}${sec}`;
  const projActive = _projectorWin && !_projectorWin.closed;
  hudMinimal.textContent =
    `${icon} ${d3.track || '—'}  ${d3.phase}  ${time}` +
    (worldState.bpm ? `  ${worldState.bpm}BPM` : '') +
    `  ${primList}` +
    (midi.connected ? `  MIDI:${midi.inputCount}` : '') +
    `  G:${getAudioGain().toFixed(1)}` +
    (projActive ? '  PROJ:ON' : '') +
    (isRecording() ? '  ● REC' : '');
}

// ── Director panel ──
function updateSeqPanel() {
  if (!hudSeq) return;
  const d3 = getDirector3Status();
  const playing = isDirector3Playing();
  const pct = Math.round(phaseState.progress * 100);
  _seqAct.textContent    = d3.track || 'MACH:INE III';
  _seqFill.style.width   = `${pct}%`;
  _seqStatus.textContent = `${playing ? '▶' : '⏸'}  ${d3.phase}  ${pct}%  arc:${d3.arc.toFixed(2)}`;
}

// ── HUD Debug ──
function bar(val, len = 12) {
  const filled = Math.round(val * len);
  return '\u2588'.repeat(filled) + '\u2591'.repeat(len - filled);
}

function updateHUDDebug() {
  if (!hudDebug) return;
  const d3 = getDirector3Status();
  const ws = worldState;
  const pal = getPalette();
  const trajArrow = audio.trajectory > 0 ? '\u2191' : audio.trajectory < 0 ? '\u2193' : '\u2192';
  const lastNote = midi.lastNote ? `${noteName(midi.lastNote.note)} V${midi.lastNote.vel}` : '——';

  const elapsed = Math.floor(d3.totalTime);
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  const playing = isDirector3Playing();
  const tracks = ['NEBBIA','TESSUTO','SOLCO','RESPIRO','MACCHINA','TEMPESTA','RITORNO'];

  hudDebug.textContent =
    `── AUDIO ──\n` +
    `RMS  ${bar(audio.rms)}  ${(audio.rms * 100).toFixed(0)}%\n` +
    `CENT ${bar(audio.centroid)}  FLUX ${bar(audio.flux * 5)}\n` +
    `BPM  ${audio.bpm || '——'}  TRAJ ${trajArrow}\n` +
    `INT  ${bar(state.intensity)}  RHYT ${bar(state.rhythmicity)}\n` +
    `\n` +
    `── DIRECTOR ──\n` +
    `${playing ? '▶' : '⏸'}  ${d3.track}  ${d3.phase}  ${min}:${sec < 10 ? '0' : ''}${sec}\n` +
    `ARC  ${bar(d3.arc)}  ${(d3.arc * 100).toFixed(1)}%\n` +
    `PHASE ${bar(phaseState.progress)}  bar ${Math.floor(phaseState.elapsed)}/${Math.floor(phaseState.duration)}\n` +
    `ENERGY  ${ws.energy}\n` +
    `\n` +
    `── WORLD STATE ──\n` +
    `SCALE  ${ws.scale.length} notes  ROOT ${ws.root}  BPM ${ws.bpm || '—'}\n` +
    `DENSITY  r:${ws.density.rhythm.toFixed(2)}  h:${ws.density.harmony.toFixed(2)}  b:${ws.density.bass.toFixed(2)}  m:${ws.density.melody.toFixed(2)}  t:${ws.density.texture.toFixed(2)}\n` +
    `PALETTE  bg:${ws.palette.bg}  dot:${ws.palette.dot}  acc:${ws.palette.accent || '—'}\n` +
    `\n` +
    `── MIDI ──\n` +
    `${midi.connected ? 'OK ' + midi.inputCount : 'OFF'}  ${lastNote}  CH:${midi.lastNote ? midi.lastNote.ch : '-'}\n` +
    `CH  ${midi.channels.map((c, i) => c.density > 0 ? i + ':' + c.density.toFixed(1) : '').filter(Boolean).join('  ') || 'no activity'}\n` +
    `\n` +
    `── TRACCE ──\n` +
    tracks.map((t, i) => `${i + 1} ${t.padEnd(10)} ${t === d3.track ? '►' : ' '}`).join('\n') +
    `\n\n` +
    `SPC PLAY  SHIFT+1-7 TRACCIA  1-5 FASE\n` +
    `H HUD  D DEBUG  F FULL  P PROJ`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/render.js
git commit -m "v3-visual: render.js — build env, remove old director visual calls"
```

---

### Task 5: Update main.js — remove old director init

Remove initDirector/initDirectorEvents calls (old visual director). Keep everything else.

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Remove old director imports and init calls**

Remove these lines from main.js:

```javascript
// REMOVE this import:
import { initDirector, initDirectorEvents } from './director.js';

// REMOVE from boot sequence (inside startScreen click handler):
initDirector(state);
initDirectorEvents();

// REMOVE from REGEN handler:
initDirector(state);
```

Also remove the `resetClimax` import from colors.js (no longer exported):
```javascript
// REMOVE:
import { resetClimax } from './colors.js';
// And remove from REGEN handler:
resetClimax();
```

Add snapPalette import and call on boot:
```javascript
// ADD to imports:
import { snapPalette } from './colors.js';

// ADD after initDirector3('NEBBIA'):
snapPalette();
```

The REGEN handler (KeyR) simplifies to:
```javascript
if (result === 'REGEN') {
  generateDNA();
  resetGenerations();
}
```

- [ ] **Step 2: Verify app boots and shows canvas**

Open `http://localhost:8282`, click to start. Should see background color from NEBBIA palette (#0A0A0A). No composition renders yet (comp modules don't exist), but no crash.

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "v3-visual: main.js — remove old director init, add snapPalette"
```

---

### Task 6: Create comp-liminale.js — NEBBIA + RITORNO

First composition module. Perspective convergence. This is the boot track so it tests immediately.

**Files:**
- Create: `src/comp-liminale.js`

- [ ] **Step 1: Create comp-liminale.js**

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: LIMINALE
//  Prospettiva convergente. NEBBIA (avvicinamento) + RITORNO (allontanamento).
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, rgbString, lerpColor, hexToRgb,
  lerp, clamp, mapRange, noiseAt, perspectiveScale, rng, seedRng,
} from './visual-toolkit.js';

// ── Phase parameters ──
const PHASE_PARAMS = {
  germoglio:    { depthRange: 0.2, dotMin: 8, dotMax: 20, densityMax: 0.05, driftSpeed: 0.02 },
  pulsazione:   { depthRange: 0.5, dotMin: 6, dotMax: 18, densityMax: 0.15, driftSpeed: 0.05 },
  densita:      { depthRange: 0.8, dotMin: 4, dotMax: 16, densityMax: 0.40, driftSpeed: 0.10 },
  rottura:      { depthRange: 1.0, dotMin: 2, dotMax: 24, densityMax: 0.70, driftSpeed: 0.20 },
  dissoluzione: { depthRange: 0.3, dotMin: 10, dotMax: 20, densityMax: 0.10, driftSpeed: 0.02 },
};

// ── Internal state ──
let _dots = [];          // { x, y, depth, size, alpha, born }
let _vanishX = 0.5;
let _vanishY = 0.4;
let _isRitorno = false;
let _time = 0;

// ── Lerped params (smooth phase transitions) ──
let _params = { depthRange: 0.2, dotMin: 8, dotMax: 20, densityMax: 0.05, driftSpeed: 0.02 };

export function init(env) {
  _dots = [];
  _time = 0;
  _isRitorno = env.worldState.track === 'RITORNO';
  _vanishX = 0.5 + (Math.random() - 0.5) * 0.2;
  _vanishY = _isRitorno ? 0.45 : 0.35;
  const phase = env.worldState.phase || 'germoglio';
  _params = { ...(PHASE_PARAMS[phase] || PHASE_PARAMS.germoglio) };
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, audio, dt } = env;
  const tk = env.toolkit;
  _time += dt;

  // Lerp params toward current phase
  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  const lspeed = 0.03;
  _params.depthRange += (target.depthRange - _params.depthRange) * lspeed;
  _params.dotMin += (target.dotMin - _params.dotMin) * lspeed;
  _params.dotMax += (target.dotMax - _params.dotMax) * lspeed;
  _params.densityMax += (target.densityMax - _params.densityMax) * lspeed;
  _params.driftSpeed += (target.driftSpeed - _params.driftSpeed) * lspeed;

  // Palette
  const palette = env.toolkit.hexToRgb ? null : null; // use env colors
  const bgRgb = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;

  // Background
  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  // Spawn dots from MIDI notes
  for (const n of midiTrail) {
    if (n.time < dt * 2 && n.alpha > 0.5) {
      const depth = _isRitorno ? 0.1 : (0.7 + Math.random() * 0.3) * _params.depthRange;
      _dots.push({
        x: _vanishX + (Math.random() - 0.5) * 0.1,
        y: _vanishY + (Math.random() - 0.5) * 0.1,
        depth,
        size: lerp(_params.dotMin, _params.dotMax, n.vel),
        alpha: n.vel,
        born: _time,
        ch: n.ch,
      });
    }
  }

  // Onset waves → perspective ripple (spawn cluster of small dots)
  for (const w of onsetWaves) {
    if (w.strength > 0.8) {
      for (let i = 0; i < 3; i++) {
        _dots.push({
          x: _vanishX + (Math.random() - 0.5) * 0.15,
          y: _vanishY + (Math.random() - 0.5) * 0.15,
          depth: 0.5 + Math.random() * 0.5 * _params.depthRange,
          size: lerp(_params.dotMin, _params.dotMax * 0.5, Math.random()),
          alpha: 0.6,
          born: _time,
          ch: -1,
        });
      }
    }
  }

  // Cap dots
  if (_dots.length > 200) _dots.splice(0, _dots.length - 200);

  // Update and render dots
  const direction = _isRitorno ? 1 : -1; // ritorno: move toward vanish; nebbia: move away
  for (let i = _dots.length - 1; i >= 0; i--) {
    const d = _dots[i];

    // Move depth
    d.depth += direction * _params.driftSpeed * dt;
    d.alpha -= 0.008;

    // Position: spread from vanishing point based on depth
    const spread = _isRitorno ? (1 - d.depth) : d.depth;
    const sx = _vanishX + (d.x - _vanishX) * (1 + spread * 3);
    const sy = _vanishY + (d.y - _vanishY) * (1 + spread * 3);
    const scale = perspectiveScale(1, 1 - spread);

    // Remove if out of bounds or faded
    if (d.alpha < 0.02 || d.depth < 0 || d.depth > 1 || sx < -0.1 || sx > 1.1 || sy < -0.1 || sy > 1.1) {
      _dots[i] = _dots[_dots.length - 1];
      _dots.length--;
      continue;
    }

    // Draw as Bayer-dithered dot
    const px = sx * W;
    const py = sy * H;
    const dotSize = Math.max(2, Math.round(d.size * scale));
    const density = d.alpha * _params.densityMax * 3;
    const col = Math.floor(px / dotSize);
    const row = Math.floor(py / dotSize);

    if (bayerTest(col, row, clamp(density, 0, 1))) {
      // Color: dot color faded by depth
      const depthFade = clamp(spread, 0, 1);
      const rgb = lerpColor(bgRgb, d.ch === 5 || d.ch === 6 ? accRgb : dotRgb, depthFade * d.alpha);
      ctx.fillStyle = rgbString(rgb[0], rgb[1], rgb[2]);
      ctx.fillRect(px - dotSize / 2, py - dotSize / 2, dotSize, dotSize);
    }
  }

  // Ambient noise dots (very sparse, based on audio)
  const ambientCount = Math.floor(audio.rms * 10 * _params.densityMax);
  seedRng(Math.floor(_time * 7));
  for (let i = 0; i < ambientCount; i++) {
    const ax = rng();
    const ay = rng();
    const adepth = rng() * _params.depthRange;
    const asize = lerp(_params.dotMin * 0.5, _params.dotMax * 0.3, rng());
    const aspread = _isRitorno ? (1 - adepth) : adepth;
    const apx = lerp(_vanishX * W, ax * W, aspread);
    const apy = lerp(_vanishY * H, ay * H, aspread);
    const col = Math.floor(apx / asize);
    const row = Math.floor(apy / asize);
    if (bayerTest(col, row, 0.3 * aspread)) {
      const fade = aspread * 0.5;
      const rgb = lerpColor(bgRgb, dotRgb, fade);
      ctx.fillStyle = rgbString(rgb[0], rgb[1], rgb[2], fade);
      ctx.fillRect(apx, apy, Math.max(1, asize * perspectiveScale(1, 1 - aspread)), Math.max(1, asize * perspectiveScale(1, 1 - aspread)));
    }
  }
}

export function destroy() {
  _dots = [];
}
```

- [ ] **Step 2: Verify NEBBIA renders**

Open `http://localhost:8282`, click to start. NEBBIA is the first track.
Expected: dark background (#0A0A0A), cream-colored dots appearing from a vanishing point, spreading outward. Audio onset creates ripple clusters. MIDI notes (if playing) spawn dots.
Press Space to start playback, then verify dots appear as music plays.

- [ ] **Step 3: Verify RITORNO via Shift+7**

Press Shift+7 to jump to RITORNO.
Expected: similar perspective but dots move toward vanishing point (retreat). Lavender dots on dark background.

- [ ] **Step 4: Commit**

```bash
git add src/comp-liminale.js
git commit -m "v3-visual: comp-liminale.js — NEBBIA+RITORNO perspective composition"
```

---

### Task 7: Create comp-quadrati.js — SOLCO

Pulsing blocks composition. Blocks flash with kick, sized by bass, colored by chords.

**Files:**
- Create: `src/comp-quadrati.js`

- [ ] **Step 1: Create comp-quadrati.js**

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: QUADRATI
//  Blocchi rettangolari asimmetrici che pulsano col groove.
//  SOLCO: kick illumina, bass dimensiona, chords colorano.
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, fillBayer, rgbString, hexToRgb, lerpColor,
  lerp, clamp, rng, seedRng, noiseAt,
} from './visual-toolkit.js';

const PHASE_PARAMS = {
  germoglio:    { blocks: 2, fillDensity: 0.15, flashIntensity: 0.3, arpVisible: false },
  pulsazione:   { blocks: 4, fillDensity: 0.35, flashIntensity: 0.6, arpVisible: false },
  densita:      { blocks: 6, fillDensity: 0.55, flashIntensity: 0.85, arpVisible: true },
  rottura:      { blocks: 8, fillDensity: 0.80, flashIntensity: 1.0, arpVisible: true },
  dissoluzione: { blocks: 3, fillDensity: 0.20, flashIntensity: 0.3, arpVisible: false },
};

// ── State ──
let _blocks = [];       // { x, y, w, h, flash, accentFlash }
let _arpParticles = []; // { x, y, vx, vy, alpha }
let _time = 0;
let _params = { ...PHASE_PARAMS.germoglio };

function generateBlocks(count, W, H) {
  _blocks = [];
  seedRng(42);
  for (let i = 0; i < count; i++) {
    const w = 0.08 + rng() * 0.18;
    const h = 0.06 + rng() * 0.14;
    const x = 0.05 + rng() * (0.85 - w);
    const y = 0.05 + rng() * (0.85 - h);
    _blocks.push({ x, y, w, h, flash: 0, accentFlash: 0, shakeX: 0, shakeY: 0 });
  }
}

export function init(env) {
  _time = 0;
  _arpParticles = [];
  const phase = env.worldState.phase || 'germoglio';
  _params = { ...(PHASE_PARAMS[phase] || PHASE_PARAMS.germoglio) };
  generateBlocks(_params.blocks, 1, 1);
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, audio, midi, dt } = env;
  _time += dt;

  // Lerp params
  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  _params.fillDensity += (target.fillDensity - _params.fillDensity) * 0.03;
  _params.flashIntensity += (target.flashIntensity - _params.flashIntensity) * 0.03;
  _params.arpVisible = target.arpVisible;

  // Regenerate blocks if count changed significantly
  if (Math.abs(_blocks.length - target.blocks) >= 2) {
    generateBlocks(target.blocks, W, H);
  }

  const bgRgb = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;

  // Background
  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  // Detect kick (CH0) and bass (CH3) from midi trail
  let kickFlash = 0, bassEnergy = 0, chordActive = false;
  for (const n of midiTrail) {
    if (n.ch === 0 && n.alpha > 0.3) kickFlash = Math.max(kickFlash, n.alpha);
    if (n.ch === 3 && n.alpha > 0.2) bassEnergy = Math.max(bassEnergy, n.alpha * n.vel);
    if (n.ch === 4 && n.alpha > 0.3) chordActive = true;
  }

  // Onset shake
  let shakeAmt = 0;
  for (const w of onsetWaves) {
    shakeAmt += w.strength * 3;
  }

  // Update and render blocks
  for (let i = 0; i < _blocks.length; i++) {
    const b = _blocks[i];

    // Kick flash → illuminate block
    b.flash = lerp(b.flash, kickFlash * _params.flashIntensity, 0.3);
    b.flash *= 0.92; // decay

    // Chord → accent color
    b.accentFlash = lerp(b.accentFlash, chordActive ? 0.6 : 0, 0.1);
    b.accentFlash *= 0.95;

    // Onset shake
    b.shakeX = (Math.random() - 0.5) * shakeAmt * 0.005;
    b.shakeY = (Math.random() - 0.5) * shakeAmt * 0.005;

    // Block size influenced by bass
    const sizeMul = 1 + bassEnergy * 0.3;
    const bx = (b.x + b.shakeX) * W;
    const by = (b.y + b.shakeY) * H;
    const bw = b.w * sizeMul * W;
    const bh = b.h * sizeMul * H;

    // Render block as Bayer-dithered area
    const density = clamp(_params.fillDensity + b.flash * 0.4, 0, 1);
    const dotSize = Math.max(3, Math.round(lerp(8, 4, density)));

    // Choose color: dot or accent based on chord
    const blockRgb = b.accentFlash > 0.1
      ? lerpColor(dotRgb, accRgb, b.accentFlash)
      : dotRgb;

    const colorStr = rgbString(blockRgb[0], blockRgb[1], blockRgb[2]);
    fillBayer(ctx, bx, by, bw, bh, density, dotSize, colorStr);
  }

  // Arp particles (CH7) — small dots orbiting blocks
  if (_params.arpVisible) {
    for (const n of midiTrail) {
      if (n.ch === 7 && n.time < dt * 2 && n.alpha > 0.5) {
        const bi = Math.floor(n.note * _blocks.length) % _blocks.length;
        const block = _blocks[bi] || _blocks[0];
        if (block) {
          _arpParticles.push({
            cx: (block.x + block.w / 2) * W,
            cy: (block.y + block.h / 2) * H,
            angle: Math.random() * Math.PI * 2,
            radius: Math.max(block.w, block.h) * W * 0.6,
            size: 2 + Math.random() * 3,
            alpha: n.vel,
            speed: 1 + Math.random() * 2,
          });
        }
      }
    }
    // Cap
    if (_arpParticles.length > 50) _arpParticles.splice(0, _arpParticles.length - 50);

    // Update and render particles
    const accStr = rgbString(accRgb[0], accRgb[1], accRgb[2]);
    for (let i = _arpParticles.length - 1; i >= 0; i--) {
      const p = _arpParticles[i];
      p.angle += p.speed * dt;
      p.alpha *= 0.97;
      if (p.alpha < 0.03) {
        _arpParticles[i] = _arpParticles[_arpParticles.length - 1];
        _arpParticles.length--;
        continue;
      }
      const px = p.cx + Math.cos(p.angle) * p.radius;
      const py = p.cy + Math.sin(p.angle) * p.radius;
      ctx.fillStyle = accStr;
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(px, py, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}

export function destroy() {
  _blocks = [];
  _arpParticles = [];
}
```

- [ ] **Step 2: Verify — Shift+3 for SOLCO**

Press Shift+3. Expected: signal black background, orange blocks that flash with kick, lime accent when chords play. Blocks shake on audio onset.

- [ ] **Step 3: Commit**

```bash
git add src/comp-quadrati.js
git commit -m "v3-visual: comp-quadrati.js — SOLCO pulsing blocks composition"
```

---

### Task 8: Create comp-linee.js — TESSUTO

Parallel horizontal lines following voice leading.

**Files:**
- Create: `src/comp-linee.js`

- [ ] **Step 1: Create comp-linee.js**

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: LINEE
//  Linee orizzontali parallele. Voicing → Y position.
//  TESSUTO: chords = lines, lead = bright independent line.
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, rgbString, hexToRgb, lerpColor,
  lerp, clamp, mapRange, noiseAt,
} from './visual-toolkit.js';

const PHASE_PARAMS = {
  germoglio:    { lineCount: 2, thickness: 1, gap: 0.15, glissSpeed: 0 },
  pulsazione:   { lineCount: 3, thickness: 2, gap: 0.10, glissSpeed: 0.05 },
  densita:      { lineCount: 5, thickness: 3, gap: 0.06, glissSpeed: 0.10 },
  rottura:      { lineCount: 7, thickness: 5, gap: 0.03, glissSpeed: 0.20 },
  dissoluzione: { lineCount: 2, thickness: 1, gap: 0.15, glissSpeed: 0.02 },
};

// ── State ──
let _lines = [];         // { targetY, currentY, brightness, isLead, isDrone }
let _densityWaves = [];  // { x, speed, alpha } — rhythmic impulse traveling along line
let _time = 0;
let _params = { ...PHASE_PARAMS.germoglio };

export function init(env) {
  _lines = [];
  _densityWaves = [];
  _time = 0;
  _params = { ...(PHASE_PARAMS[env.worldState.phase] || PHASE_PARAMS.germoglio) };

  // Init drone line at bottom
  _lines.push({ targetY: 0.85, currentY: 0.85, brightness: 0.15, isLead: false, isDrone: true });
  // Init chord lines
  for (let i = 0; i < 3; i++) {
    _lines.push({ targetY: 0.3 + i * 0.12, currentY: 0.3 + i * 0.12, brightness: 0.5, isLead: false, isDrone: false });
  }
  // Init lead line
  _lines.push({ targetY: 0.4, currentY: 0.4, brightness: 0.8, isLead: true, isDrone: false });
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, midi, dt } = env;
  _time += dt;

  // Lerp params
  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  _params.thickness += (target.thickness - _params.thickness) * 0.03;
  _params.gap += (target.gap - _params.gap) * 0.03;
  _params.glissSpeed += (target.glissSpeed - _params.glissSpeed) * 0.03;

  const bgRgb = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;

  // Background
  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  // Update chord line positions from MIDI (CH4 = chords)
  const chordNotes = [];
  for (const n of midiTrail) {
    if (n.ch === 4 && n.alpha > 0.2) chordNotes.push(n.note);
    if (n.ch === 2 && n.alpha > 0.1) {
      // Drone → bottom line target
      _lines[0].targetY = mapRange(n.note, 0, 1, 0.9, 0.75);
      _lines[0].brightness = lerp(_lines[0].brightness, 0.25, 0.05);
    }
    if (n.ch === 6 && n.alpha > 0.2) {
      // Lead → independent line
      const leadLine = _lines.find(l => l.isLead);
      if (leadLine) {
        leadLine.targetY = mapRange(n.note, 0, 1, 0.15, 0.75);
        leadLine.brightness = lerp(leadLine.brightness, 1.0, 0.2);
      }
    }
  }

  // Map chord notes to line Y positions
  chordNotes.sort();
  for (let i = 0; i < Math.min(chordNotes.length, 3); i++) {
    const lineIdx = i + 1; // skip drone at [0]
    if (_lines[lineIdx] && !_lines[lineIdx].isDrone && !_lines[lineIdx].isLead) {
      _lines[lineIdx].targetY = mapRange(chordNotes[i], 0, 1, 0.15, 0.80);
      _lines[lineIdx].brightness = 0.7;
    }
  }

  // Rhythmic impulse waves (CH1 perc)
  for (const n of midiTrail) {
    if (n.ch === 1 && n.time < dt * 2 && n.alpha > 0.4) {
      _densityWaves.push({ x: 0, speed: 0.4 + Math.random() * 0.3, alpha: n.vel });
    }
  }

  // Update waves
  for (let i = _densityWaves.length - 1; i >= 0; i--) {
    _densityWaves[i].x += _densityWaves[i].speed * dt;
    _densityWaves[i].alpha *= 0.98;
    if (_densityWaves[i].x > 1.2 || _densityWaves[i].alpha < 0.02) {
      _densityWaves[i] = _densityWaves[_densityWaves.length - 1];
      _densityWaves.length--;
    }
  }
  if (_densityWaves.length > 20) _densityWaves.length = 20;

  // Render lines
  const visibleCount = Math.min(_lines.length, Math.ceil(target.lineCount));
  for (let li = 0; li < visibleCount; li++) {
    const line = _lines[li];
    if (!line) continue;

    // Glissando: lerp currentY toward targetY
    const speed = line.isDrone ? 0.01 : (line.isLead ? 0.15 : _params.glissSpeed + 0.02);
    line.currentY += (line.targetY - line.currentY) * speed;

    // Fade brightness
    if (!line.isLead) line.brightness *= 0.998;

    const py = line.currentY * H;
    const thickness = Math.max(1, Math.round(_params.thickness * (line.isDrone ? 0.5 : line.isLead ? 1.5 : 1)));
    const dotSize = Math.max(2, thickness * 2);
    const density = clamp(line.brightness * _params.thickness * 0.15, 0.05, 0.85);

    // Choose color
    const lineRgb = line.isLead ? accRgb : line.isDrone ? lerpColor(bgRgb, dotRgb, 0.3) : dotRgb;
    const colorStr = rgbString(lineRgb[0], lineRgb[1], lineRgb[2]);

    // Draw line as row of Bayer-dithered dots
    ctx.fillStyle = colorStr;
    const cols = Math.ceil(W / dotSize);
    for (let c = 0; c < cols; c++) {
      const nx = c / cols;
      // Add density wave influence
      let waveDensity = 0;
      for (const w of _densityWaves) {
        const dist = Math.abs(nx - w.x);
        if (dist < 0.08) waveDensity += (1 - dist / 0.08) * w.alpha * 0.4;
      }
      const d = clamp(density + waveDensity + noiseAt(c, li, _time) * 0.05, 0, 1);

      for (let t = 0; t < thickness; t++) {
        const row = Math.floor((py + t * dotSize) / dotSize);
        if (bayerTest(c, row, d)) {
          ctx.fillRect(c * dotSize, py + t * dotSize - thickness * dotSize / 2, dotSize, dotSize);
        }
      }
    }
  }
}

export function destroy() {
  _lines = [];
  _densityWaves = [];
}
```

- [ ] **Step 2: Verify — Shift+2 for TESSUTO**

Expected: brown background, lime horizontal lines that move vertically with chord changes, cream lead line moving independently.

- [ ] **Step 3: Commit**

```bash
git add src/comp-linee.js
git commit -m "v3-visual: comp-linee.js — TESSUTO parallel lines composition"
```

---

### Task 9: Create comp-negativo.js — RESPIRO

Inverted composition. Saturated background, notes carve dark holes.

**Files:**
- Create: `src/comp-negativo.js`

- [ ] **Step 1: Create comp-negativo.js**

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: NEGATIVO
//  Fondo colorato saturo. Le note scavano buchi scuri.
//  RESPIRO: silenzio = colore, musica = assenza.
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBayer, fillBackground, rgbString, hexToRgb, lerpColor,
  lerp, clamp,
} from './visual-toolkit.js';

const PHASE_PARAMS = {
  germoglio:    { holeSize: 0.12, closeSpeed: 0.005, holeDepth: 0.4 },
  pulsazione:   { holeSize: 0.08, closeSpeed: 0.010, holeDepth: 0.6 },
  dissoluzione: { holeSize: 0.05, closeSpeed: 0.003, holeDepth: 0.3 },
};

let _holes = [];  // { x, y, radius, maxRadius, alpha, closing }
let _time = 0;
let _params = { ...PHASE_PARAMS.germoglio };

export function init(env) {
  _holes = [];
  _time = 0;
  _params = { ...(PHASE_PARAMS[env.worldState.phase] || PHASE_PARAMS.germoglio) };
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, dt } = env;
  _time += dt;

  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  _params.holeSize += (target.holeSize - _params.holeSize) * 0.03;
  _params.closeSpeed += (target.closeSpeed - _params.closeSpeed) * 0.03;
  _params.holeDepth += (target.holeDepth - _params.holeDepth) * 0.03;

  const bgRgb = hexToRgb(worldState.palette.bg);    // sage green for RESPIRO
  const dotRgb = hexToRgb(worldState.palette.dot);   // dark for RESPIRO (holes)

  // Fill entire canvas with bg color (the "full" state)
  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  // Fill the whole canvas with Bayer-dithered bg dots (the saturated color field)
  const dotSize = Math.max(4, Math.round(lerp(10, 6, _params.holeDepth)));
  fillBayer(ctx, 0, 0, W, H, 0.85, dotSize, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  // Spawn holes from voice notes (CH5)
  for (const n of midiTrail) {
    if ((n.ch === 5 || n.ch === 6) && n.time < dt * 2 && n.alpha > 0.4) {
      const isEcho = n.ch === 6;
      _holes.push({
        x: 0.15 + n.note * 0.7,
        y: 0.15 + (1 - n.note) * 0.7 + (isEcho ? 0.05 : 0),
        radius: 0,
        maxRadius: _params.holeSize * (isEcho ? 0.6 : 1) * n.vel,
        alpha: _params.holeDepth * (isEcho ? 0.5 : 1),
        closing: false,
        growSpeed: isEcho ? 0.08 : 0.15,
      });
    }
  }

  // Cap holes
  if (_holes.length > 30) _holes.splice(0, _holes.length - 30);

  // Inverted onset waves — shrink color instead of expanding
  for (const w of onsetWaves) {
    if (w.strength > 0.5) {
      // Brief flash: darken a circle
      const cx = w.cx / W;
      const cy = w.cy / H;
      _holes.push({
        x: cx, y: cy,
        radius: 0.02, maxRadius: 0.04,
        alpha: w.strength * 0.3,
        closing: true,
        growSpeed: 0,
      });
    }
  }

  // Update and render holes (dark areas carving into color)
  for (let i = _holes.length - 1; i >= 0; i--) {
    const h = _holes[i];

    // Grow
    if (!h.closing && h.radius < h.maxRadius) {
      h.radius += h.growSpeed * dt;
      if (h.radius >= h.maxRadius) h.closing = true;
    }

    // Close (color reclaims space)
    if (h.closing) {
      h.radius -= _params.closeSpeed;
      h.alpha *= 0.995;
    }

    // Remove
    if (h.radius < 0.002 || h.alpha < 0.02) {
      _holes[i] = _holes[_holes.length - 1];
      _holes.length--;
      continue;
    }

    // Render hole as dark Bayer area
    const hx = h.x * W - h.radius * W;
    const hy = h.y * H - h.radius * H;
    const hw = h.radius * 2 * W;
    const hh = h.radius * 2 * H;
    const holeRgb = lerpColor(bgRgb, dotRgb, h.alpha);
    fillBayer(ctx, hx, hy, hw, hh, clamp(h.alpha + 0.2, 0, 1), dotSize, rgbString(holeRgb[0], holeRgb[1], holeRgb[2]));
  }
}

export function destroy() {
  _holes = [];
}
```

- [ ] **Step 2: Verify — Shift+4 for RESPIRO**

Expected: sage green screen (#7BBA91), dark holes appear when voice plays, slowly close. Lead echo creates smaller offset holes.

- [ ] **Step 3: Commit**

```bash
git add src/comp-negativo.js
git commit -m "v3-visual: comp-negativo.js — RESPIRO inverted saturation composition"
```

---

### Task 10: Create comp-griglia.js — MACCHINA

Data/Ikeda grid. Columns lit by MIDI, rigorous grid, hypnotic repetition.

**Files:**
- Create: `src/comp-griglia.js`

- [ ] **Step 1: Create comp-griglia.js**

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: GRIGLIA
//  Data/Ikeda. Griglia rigorosa, colonne accese dal MIDI.
//  MACCHINA: arp illumina colonne in sequenza.
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, rgbString, hexToRgb, lerpColor,
  lerp, clamp, mapRange,
} from './visual-toolkit.js';

const PHASE_PARAMS = {
  germoglio:    { cols: 8,  rows: 4,  cellActive: 0.05, scrollSpeed: 0, accentProb: 0 },
  pulsazione:   { cols: 16, rows: 8,  cellActive: 0.15, scrollSpeed: 0.02, accentProb: 0.05 },
  densita:      { cols: 24, rows: 12, cellActive: 0.40, scrollSpeed: 0.05, accentProb: 0.15 },
  rottura:      { cols: 32, rows: 16, cellActive: 0.70, scrollSpeed: 0.12, accentProb: 0.30 },
  dissoluzione: { cols: 16, rows: 8,  cellActive: 0.10, scrollSpeed: 0.01, accentProb: 0.02 },
};

let _grid = [];       // 2D array of { brightness, accent, decay }
let _time = 0;
let _scrollOffset = 0;
let _params = { ...PHASE_PARAMS.germoglio };
let _cols = 8, _rows = 4;

function initGrid(cols, rows) {
  _cols = cols;
  _rows = rows;
  _grid = [];
  for (let r = 0; r < rows; r++) {
    _grid[r] = [];
    for (let c = 0; c < cols; c++) {
      _grid[r][c] = { brightness: 0, accent: false, decay: 0.94 };
    }
  }
}

export function init(env) {
  _time = 0;
  _scrollOffset = 0;
  const phase = env.worldState.phase || 'germoglio';
  const p = PHASE_PARAMS[phase] || PHASE_PARAMS.germoglio;
  _params = { ...p };
  initGrid(p.cols, p.rows);
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, midi, dt } = env;
  _time += dt;

  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  _params.cellActive += (target.cellActive - _params.cellActive) * 0.02;
  _params.scrollSpeed += (target.scrollSpeed - _params.scrollSpeed) * 0.02;
  _params.accentProb += (target.accentProb - _params.accentProb) * 0.02;

  // Resize grid if needed
  if (target.cols !== _cols || target.rows !== _rows) {
    initGrid(target.cols, target.rows);
  }

  const bgRgb = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;

  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  // Scroll offset
  _scrollOffset += _params.scrollSpeed * dt;
  if (_scrollOffset > 1) _scrollOffset -= 1;

  // Decay all cells
  for (let r = 0; r < _rows; r++) {
    for (let c = 0; c < _cols; c++) {
      _grid[r][c].brightness *= _grid[r][c].decay;
    }
  }

  // Arp (CH7) → illuminate column in sequence (the pattern is VISIBLE)
  for (const n of midiTrail) {
    if (n.ch === 7 && n.time < dt * 2 && n.alpha > 0.3) {
      const col = Math.floor(n.note * _cols) % _cols;
      for (let r = 0; r < _rows; r++) {
        _grid[r][col].brightness = clamp(_grid[r][col].brightness + n.vel * 0.8, 0, 1);
      }
    }
    // Kick (CH0) → flash entire row
    if (n.ch === 0 && n.time < dt * 2 && n.alpha > 0.3) {
      const row = Math.floor(_rows / 2);
      for (let c = 0; c < _cols; c++) {
        _grid[row][c].brightness = clamp(_grid[row][c].brightness + n.vel * 0.6, 0, 1);
      }
    }
    // Bass (CH3) → wide columns from bottom
    if (n.ch === 3 && n.time < dt * 2 && n.alpha > 0.2) {
      const col = Math.floor(n.note * _cols) % _cols;
      const spread = 2;
      for (let c = Math.max(0, col - spread); c <= Math.min(_cols - 1, col + spread); c++) {
        for (let r = Math.floor(_rows * 0.6); r < _rows; r++) {
          _grid[r][c].brightness = clamp(_grid[r][c].brightness + n.vel * 0.5, 0, 1);
        }
      }
    }
    // Voice/Lead (CH5/CH6) → accent dots scattered
    if ((n.ch === 5 || n.ch === 6) && n.time < dt * 2 && n.alpha > 0.3) {
      const col = Math.floor(n.note * _cols) % _cols;
      const row = Math.floor((1 - n.note) * _rows) % _rows;
      if (_grid[row] && _grid[row][col]) {
        _grid[row][col].brightness = 1;
        _grid[row][col].accent = true;
      }
    }
  }

  // Render grid
  const cellW = W / _cols;
  const cellH = H / _rows;
  const dotSize = Math.max(2, Math.floor(Math.min(cellW, cellH) * 0.6));
  const padding = Math.floor(Math.min(cellW, cellH) * 0.15);

  for (let r = 0; r < _rows; r++) {
    for (let c = 0; c < _cols; c++) {
      const cell = _grid[r][c];
      if (cell.brightness < 0.03) continue;

      const scrollC = (c + Math.floor(_scrollOffset * _cols)) % _cols;
      const cx = scrollC * cellW + padding;
      const cy = r * cellH + padding;
      const cw = cellW - padding * 2;
      const ch = cellH - padding * 2;

      // Bayer-dithered cell
      const cols2 = Math.ceil(cw / dotSize);
      const rows2 = Math.ceil(ch / dotSize);
      const cellRgb = cell.accent ? accRgb : dotRgb;
      ctx.fillStyle = rgbString(cellRgb[0], cellRgb[1], cellRgb[2]);

      for (let dr = 0; dr < rows2; dr++) {
        for (let dc = 0; dc < cols2; dc++) {
          if (bayerTest(dc + c * 3, dr + r * 3, cell.brightness)) {
            ctx.fillRect(cx + dc * dotSize, cy + dr * dotSize, dotSize, dotSize);
          }
        }
      }

      cell.accent = false; // reset accent flag per frame
    }
  }
}

export function destroy() {
  _grid = [];
}
```

- [ ] **Step 2: Verify — Shift+5 for MACCHINA**

Expected: navy background, yellow grid cells lighting up with arp pattern visible as sequential column illumination. Pink accents for voice/lead.

- [ ] **Step 3: Commit**

```bash
git add src/comp-griglia.js
git commit -m "v3-visual: comp-griglia.js — MACCHINA data/Ikeda grid composition"
```

---

### Task 11: Create comp-treno.js — TEMPESTA

Lateral parallax train journey. 3 depth planes, notes as landscape objects.

**Files:**
- Create: `src/comp-treno.js`

- [ ] **Step 1: Create comp-treno.js**

```javascript
// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: TRENO
//  Viaggio laterale con parallasse su 3 piani.
//  TEMPESTA: velocità, densità, hocket visibile.
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, rgbString, hexToRgb, lerpColor,
  lerp, clamp, rng, seedRng,
} from './visual-toolkit.js';

const PHASE_PARAMS = {
  germoglio:    { scrollSpeed: 30,  planeSep: 0.35, dotBack: 2, dotFront: 8,  density: 0.15 },
  pulsazione:   { scrollSpeed: 60,  planeSep: 0.30, dotBack: 2, dotFront: 10, density: 0.30 },
  densita:      { scrollSpeed: 120, planeSep: 0.20, dotBack: 3, dotFront: 14, density: 0.55 },
  rottura:      { scrollSpeed: 220, planeSep: 0.10, dotBack: 4, dotFront: 20, density: 0.85 },
  dissoluzione: { scrollSpeed: 40,  planeSep: 0.30, dotBack: 2, dotFront: 8,  density: 0.20 },
};

// 3 planes: back (slow), mid (medium), front (fast)
const PLANE_SPEEDS = [0.3, 0.6, 1.0];
const PLANE_Y_RANGES = [
  [0.0, 0.4],  // back: top area
  [0.25, 0.75], // mid: center
  [0.5, 1.0],  // front: bottom
];

let _objects = [];  // { plane, x, y, size, color, alpha }
let _scrollX = [0, 0, 0]; // per-plane scroll position
let _time = 0;
let _sparkles = []; // hat flashes
let _params = { ...PHASE_PARAMS.germoglio };

export function init(env) {
  _objects = [];
  _sparkles = [];
  _scrollX = [0, 0, 0];
  _time = 0;
  _params = { ...(PHASE_PARAMS[env.worldState.phase] || PHASE_PARAMS.germoglio) };
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, audio, dt } = env;
  _time += dt;

  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  _params.scrollSpeed += (target.scrollSpeed - _params.scrollSpeed) * 0.02;
  _params.planeSep += (target.planeSep - _params.planeSep) * 0.02;
  _params.dotBack += (target.dotBack - _params.dotBack) * 0.02;
  _params.dotFront += (target.dotFront - _params.dotFront) * 0.02;
  _params.density += (target.density - _params.density) * 0.02;

  const bgRgb = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;

  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  // Update scroll per plane
  for (let p = 0; p < 3; p++) {
    _scrollX[p] += _params.scrollSpeed * PLANE_SPEEDS[p] * dt;
  }

  // Spawn objects from MIDI
  for (const n of midiTrail) {
    if (n.time > dt * 2 || n.alpha < 0.4) continue;
    let plane = -1;
    // Route channels to planes
    if (n.ch === 2) plane = 0;                    // drone → back
    if (n.ch === 3 || n.ch === 4) plane = 1;      // bass, chords → mid
    if (n.ch === 5 || n.ch === 6 || n.ch === 7) plane = 2; // voice, lead, arp → front
    if (n.ch === 0) plane = 1;                    // kick → mid
    if (plane < 0) continue;

    const yRange = PLANE_Y_RANGES[plane];
    const dotSize = lerp(_params.dotBack, _params.dotFront, plane / 2);

    _objects.push({
      plane,
      x: W + Math.random() * 50,  // spawn just off right edge
      y: lerp(yRange[0], yRange[1], n.note) * H,
      size: dotSize * n.vel,
      isAccent: n.ch === 5 || n.ch === 6, // voice/lead get accent color
      alpha: n.vel,
      ch: n.ch,
    });

    // Hat sparkles (CH1)
    if (n.ch === 1) {
      _sparkles.push({
        x: W + Math.random() * 20,
        y: Math.random() * H,
        alpha: n.vel * 0.8,
        plane: Math.floor(Math.random() * 3),
      });
    }
  }

  // Cap
  if (_objects.length > 300) _objects.splice(0, _objects.length - 300);
  if (_sparkles.length > 50) _sparkles.splice(0, _sparkles.length - 50);

  // Render back to front
  for (let p = 0; p < 3; p++) {
    const speed = _params.scrollSpeed * PLANE_SPEEDS[p];
    const planeDotSize = Math.max(2, Math.round(lerp(_params.dotBack, _params.dotFront, p / 2)));
    const planeAlpha = lerp(0.3, 1.0, p / 2); // back = faint, front = bright

    // Move and render objects on this plane
    for (let i = _objects.length - 1; i >= 0; i--) {
      const o = _objects[i];
      if (o.plane !== p) continue;

      // Scroll left
      o.x -= speed * dt;
      o.alpha *= 0.999;

      // Remove if off screen
      if (o.x < -50 || o.alpha < 0.02) {
        _objects[i] = _objects[_objects.length - 1];
        _objects.length--;
        continue;
      }

      // Draw as Bayer dot cluster
      const s = Math.max(2, Math.round(o.size));
      const density = clamp(o.alpha * planeAlpha * _params.density * 2, 0, 1);
      const rgb = o.isAccent ? accRgb : dotRgb;
      const fadedRgb = lerpColor(bgRgb, rgb, planeAlpha * o.alpha);
      ctx.fillStyle = rgbString(fadedRgb[0], fadedRgb[1], fadedRgb[2]);

      // Cluster of dots
      const clusterSize = Math.ceil(s / planeDotSize);
      for (let dr = 0; dr < clusterSize; dr++) {
        for (let dc = 0; dc < clusterSize; dc++) {
          const px = o.x + dc * planeDotSize;
          const py = o.y + dr * planeDotSize;
          const col = Math.floor(px / planeDotSize);
          const row = Math.floor(py / planeDotSize);
          if (bayerTest(col, row, density)) {
            ctx.fillRect(px, py, planeDotSize, planeDotSize);
          }
        }
      }
    }

    // Sparkles on this plane
    for (let i = _sparkles.length - 1; i >= 0; i--) {
      const s = _sparkles[i];
      if (s.plane !== p) continue;
      s.x -= speed * dt;
      s.alpha *= 0.93;
      if (s.x < -10 || s.alpha < 0.03) {
        _sparkles[i] = _sparkles[_sparkles.length - 1];
        _sparkles.length--;
        continue;
      }
      ctx.fillStyle = rgbString(dotRgb[0], dotRgb[1], dotRgb[2], s.alpha);
      ctx.fillRect(s.x, s.y, 2, 2);
    }
  }
}

export function destroy() {
  _objects = [];
  _sparkles = [];
}
```

- [ ] **Step 2: Verify — Shift+6 for TEMPESTA**

Expected: black background, white dots scrolling left on 3 depth planes. Front plane fast with voice/lead (red accent), back plane slow with drone. Hocket visible as alternating dots in front plane.

- [ ] **Step 3: Commit**

```bash
git add src/comp-treno.js
git commit -m "v3-visual: comp-treno.js — TEMPESTA parallax train composition"
```

---

### Task 12: Integration test — full sequence

Run through all 7 tracks, verify each composition loads and renders.

**Files:** None (testing only)

- [ ] **Step 1: Boot and verify NEBBIA (auto-start)**

Open `http://localhost:8282`, click start, press Space.
Expected: comp-liminale renders, dark bg, cream dots from vanishing point.

- [ ] **Step 2: Shift+2 → TESSUTO (comp-linee)**

Expected: brown bg, lime lines, lead accent.

- [ ] **Step 3: Shift+3 → SOLCO (comp-quadrati)**

Expected: signal black bg, orange pulsing blocks.

- [ ] **Step 4: Shift+4 → RESPIRO (comp-negativo)**

Expected: sage green bg, dark holes from voice.

- [ ] **Step 5: Shift+5 → MACCHINA (comp-griglia)**

Expected: navy bg, yellow grid, arp pattern visible.

- [ ] **Step 6: Shift+6 → TEMPESTA (comp-treno)**

Expected: black bg, white parallax scrolling, red accents.

- [ ] **Step 7: Shift+7 → RITORNO (comp-liminale, retreat)**

Expected: dark bg, lavender dots retreating to vanishing point.

- [ ] **Step 8: Verify HUD shows correct track name and palette**

Press D for debug HUD. Confirm PALETTE line shows hex values matching current track.

- [ ] **Step 9: Verify auto-advance**

Let NEBBIA play through all phases. When dissoluzione ends, should auto-advance to TESSUTO with new composition module loading automatically.

- [ ] **Step 10: Final commit**

```bash
git add -A
git commit -m "v3-visual: integration verified — 6 compositions across 7 tracks"
```

---

### Task 13: Transition crossfade (future enhancement)

Currently track changes are hard cuts (immediate). The crossfade system in field.js is wired but `worldState.transition` is never set by director3.js.

**Files:**
- Modify: `src/director3.js` — set `worldState.transition` during `_advanceTrack()`

- [ ] **Step 1: Add transition interpolation to director3.js _advanceTrack()**

In `_advanceTrack()`, before calling `initDirector3(nextTrack)`:

```javascript
// Set transition state — 4-8 bars interpolation
const barDuration = 240 / (worldState.bpm || 60);
const transitionBars = 4;
worldState.transition = {
  from: worldState.track,
  to: nextTrack,
  progress: 0,
  duration: transitionBars * barDuration,
  elapsed: 0,
};
```

In `updateDirector3()`, after the bar counting block, add:

```javascript
// Update transition progress
if (worldState.transition) {
  worldState.transition.elapsed += dt;
  worldState.transition.progress = clamp(worldState.transition.elapsed / worldState.transition.duration, 0, 1);
  if (worldState.transition.progress >= 1) {
    worldState.transition = null;
  }
}
```

- [ ] **Step 2: Verify crossfade works on auto-advance**

Let a track finish and auto-advance. The two compositions should blend over ~4 bars.

- [ ] **Step 3: Commit**

```bash
git add src/director3.js
git commit -m "v3-visual: director3 sets worldState.transition for crossfade"
```

---

## Dependency Graph

```
Task 1 (toolkit) ──────────────────────────┐
Task 2 (colors.js) ────────────────────────┤
Task 3 (field.js dispatcher) ──────────────┤──→ Task 12 (integration test)
Task 4 (render.js env) ────────────────────┤
Task 5 (main.js wiring) ──────────────────-┤
Task 6 (comp-liminale) ────────────────────┤
Task 7 (comp-quadrati) ────────────────────┤
Task 8 (comp-linee) ───────────────────────┤
Task 9 (comp-negativo) ────────────────────┤
Task 10 (comp-griglia) ────────────────────┤
Task 11 (comp-treno) ──────────────────────┘
                                            └──→ Task 13 (transition crossfade)
```

Tasks 1-5 are sequential (each depends on the previous).
Tasks 6-11 (composition modules) can be done in any order after Tasks 1-5.
Task 12 requires all 1-11 complete.
Task 13 is independent polish.
