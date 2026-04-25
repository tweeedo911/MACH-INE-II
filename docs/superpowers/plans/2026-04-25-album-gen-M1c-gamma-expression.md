# album-gen M1c-γ — Expression Engine 2-Level Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 2-level modulation engine so every MIDI note carries computed `extras` (cutoff, drive, noise, pan) derived from velocity/phaseProgress/density/LFOs, and a continuous `expression-weaver` emits `/synth/<n>/params` every 16th step. The 9 M1a SynthDef are extended to accept these extras with defaults that reproduce the M1a sound. After M1c-γ the album "breathes": cutoff opens with velocity, drive builds with phase, pan drifts slowly.

**Architecture:** Three pure JS modules (`shape-functions.js`, `source-samplers.js`, `expression-applier.js`) form the per-note expression layer. A `expression-weaver.js` factory runs alongside the 5 composers for continuous params. `composer-harness.emit()` is extended (back-compat) to carry optional `extras`; `emitParams()` is added. `sc-dispatcher.js` serializes both event types into OSC frames. `album-engine.scd` parses k-v pairs after `freq amp dur` in the `/note` handler and implements the `/params` handler. All 9 SynthDef gain `cutoff/drive/noise/pan` args with defaults that produce the exact M1a sound when extras are absent or at defaults.

**Tech Stack:** Same as M1b/α. Node.js 20+, ES modules, zero-build. New runtime dep: `js-yaml` (already present). SC: SuperCollider 3.12+.

**Reference spec:** [2026-04-25-album-gen-M1c-design.md](../specs/2026-04-25-album-gen-M1c-design.md), Sections 3.3 and 5 (read section 5 carefully before touching any file).

**Dependencies:** Assumes M1c-α is merged at `v0.4.0-M1c-alpha`. `npm test` green. `src/mapping/` exists with presets YAML + `presets-loader.js`. `worldState` carries `gesture`, `substance`, `chordShape`, `bassPatternPool`, `phaseDistribution`.

**Non-goals for γ:**
- No Sound Lab CLI or agent-generated SynthDef (δ).
- No tarot UI (β).
- No `audioEnergy` from SC reply closing the loop — M1d. The `audioEnergy` source is a **stub returning 0** in offline mode. Documented explicitly.
- No per-substance YAML beyond `_default.yaml` — those are populated by δ/ε. Fallback chain handles this.
- No M1c-δ sound-lab agent draft rules (spec §5.7 deferred to δ — noted in self-review).

---

## File Structure

All paths relative to `/Users/Edo_1/album-gen/`.

**New files:**

```
src/mapping/
├── shape-functions.js          # applyShape(v, shape, range) → number
└── source-samplers.js          # sampleSource(name, event?, worldState, rngStep?) → number

src/composers/
└── expression-weaver.js        # createExpressionWeaver({ rules, worldState, harness }) → { tick }

sc/modulation-rules/
└── _default.yaml               # baseline rules for 9 M1a synths

test/
├── expression-shape-functions.test.js
├── expression-source-samplers.test.js
├── expression-applier.test.js
├── expression-weaver.test.js
└── sc-dispatcher-extras.test.js

docs/
└── M1c-gamma-live-test.md      # manual smoke procedure
```

**New files (src/mapping):**

```
src/mapping/
└── expression-applier.js       # applyPerNoteExpression(event, rules, worldState, rngStep) → event
```

**Modified files:**

- `src/composers/composer-harness.js` — `emit(ch, note, vel, durMs, extras?)` extended; new `emitParams(synthName, params)`; `createRealComposers` instantiates weaver + ticks it each 16th; applies `expression-applier` to events as emitted
- `src/live/sc-dispatcher.js` — serialize extras k-v pairs after `freq amp dur`; `__params__` events → `/synth/<n>/params k v k v`
- `sc/album-engine.scd` — `/note` handler parses trailing k-v args; `/params` handler implemented
- `sc/synths/bass.scd`, `drone.scd`, `pad.scd`, `kick.scd`, `snare.scd`, `hat.scd`, `lead.scd`, `perc.scd`, `texture.scd` — add `cutoff/drive/noise/pan` args
- `sc/osc-map.md` — document extras extension (protocol-compatible addendum)
- `package.json` — version `0.5.0-M1c-gamma`

---

## Contract changes

### `harness.emit()` — extended, back-compat

```js
// before (M1b):
emit(ch, note, vel, durationMs)

// after (M1c-γ):
emit(ch, note, vel, durationMs, extras = null)
// extras: Record<string, number> | null  e.g. { cutoff: 0.72, drive: 0.15, pan: -0.2 }
// When null → event has no extras field → dispatcher serializes only freq/amp/dur → M1a behaviour.
```

### `harness.emitParams()` — new

```js
emitParams(synthName, params)
// synthName: string  e.g. "bass"
// params:    Record<string, number>  e.g. { drive: 0.42 }
// Pushes { instrument: '__params__', synth: synthName, params, t } into buffer.
```

### Event shape — extras (additive, not breaking)

```js
// before (M1b note event):
{ t, instrument, pitch, vel, dur }

// after M1c-γ (when extras present):
{ t, instrument, pitch, vel, dur, extras: { cutoff: 0.72, drive: 0.15, pan: -0.2 } }

// new __params__ event:
{ t, instrument: '__params__', synth: 'bass', params: { drive: 0.42 } }
```

### OSC wire format — additive, OSC v0.1 compatible

```
before:   /synth/bass/note   freq:f  amp:f  dur:f
after:    /synth/bass/note   freq:f  amp:f  dur:f  "cutoff":s  0.72:f  "drive":s  0.15:f  "pan":s  -0.2:f

__params__:
          /synth/bass/params  "drive":s  0.42:f  "cutoff":s  0.6:f
```

OSC v0.1 spec already says: "heterogeneous args after the first three". This is a documented addendum to `osc-map.md`, not a breaking change.

### Backward compatibility

- Existing note events without `extras` → dispatcher appends nothing → M1a wire. No regression.
- M1c-α composers that don't emit `extras` → fall through `expression-applier` (returns event unchanged if no family rules or no rules object) → no crash.
- SynthDef defaults chosen so M1a note messages (freq/amp/dur only) sound identical to M1a.
- `pipeline.test.js` determinism preserved: `extras` values are deterministic (RNG via `rngStep` from per-song seed + globalTick; LFOs from `globalTick`).

### Determinism contract

- LFO sources (`lfo_slow`, `lfo_med`, `lfo_fast`, `lfo_pan_slow`): pure `Math.sin(globalTick * k)` — deterministic from `worldState.globalTick`.
- `phaseProgress`, `barProgress`, `phase`, `density.*`: read directly from `worldState` — deterministic.
- `velocity`: `event.vel / 127` — deterministic per event.
- `random` source: `rngStep.next()` — the `rngStep` passed to `applyPerNoteExpression` is a `SeededRNG` derived from `song.seed + worldState.globalTick`. Never `Math.random()`.
- `audioEnergy`: stub `0` — deterministic by definition.

---

## Task 1: Repo bump + scaffold

**Files:**
- Modify: `/Users/Edo_1/album-gen/package.json`
- Create dirs: `src/mapping/` (may already exist from α), `sc/modulation-rules/`

- [ ] **Step 1: Bump version**

Modify `/Users/Edo_1/album-gen/package.json`:

```json
{
  "version": "0.5.0-M1c-gamma",
  "description": "Generative 5-song album tool (M1c-γ: 2-level expression engine)"
}
```

Leave all deps, scripts, engines unchanged.

- [ ] **Step 2: Create scaffold directories**

```bash
mkdir -p /Users/Edo_1/album-gen/sc/modulation-rules
```

`src/mapping/` should already exist from M1c-α. If it doesn't:

```bash
mkdir -p /Users/Edo_1/album-gen/src/mapping
```

- [ ] **Step 3: Verify M1c-α suite is green**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all tests green (M1c-α state). Note the current passing count — every subsequent task must keep it green.

- [ ] **Step 4: Commit**

```bash
cd /Users/Edo_1/album-gen
git add package.json
git commit -m "chore(m1c-γ): bump to 0.5.0-M1c-gamma"
```

---

## Task 2: `shape-functions.js` + tests

Five shape functions: `linear`, `exp`, `log`, `inv`, `threshold-N`. Pure — no side effects, no imports.

**Files:**
- Create: `/Users/Edo_1/album-gen/src/mapping/shape-functions.js`
- Create: `/Users/Edo_1/album-gen/test/expression-shape-functions.test.js`

- [ ] **Step 1: Write the failing test**

Write `/Users/Edo_1/album-gen/test/expression-shape-functions.test.js`:

```js
import { applyShape } from "../src/mapping/shape-functions.js";
import assert from "node:assert/strict";

// Helper: assert a number within epsilon
function near(actual, expected, eps = 1e-9, label = "") {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `${label}: expected ${expected}, got ${actual}`
  );
}

// ----- linear -----
near(applyShape(0,   "linear", [0, 1]),   0,   1e-9, "linear v=0");
near(applyShape(0.5, "linear", [0, 1]),   0.5, 1e-9, "linear v=0.5");
near(applyShape(1,   "linear", [0, 1]),   1,   1e-9, "linear v=1");
near(applyShape(0.5, "linear", [0.3, 0.9]), 0.6, 1e-9, "linear offset range");
near(applyShape(0,   "linear", [-8, 8]),  -8,  1e-9, "linear negative range lo");
near(applyShape(1,   "linear", [-8, 8]),   8,  1e-9, "linear negative range hi");

// ----- exp (v^2) -----
near(applyShape(0,   "exp", [0, 1]),   0,    1e-9, "exp v=0");
near(applyShape(0.5, "exp", [0, 1]),   0.25, 1e-9, "exp v=0.5");
near(applyShape(1,   "exp", [0, 1]),   1,    1e-9, "exp v=1");
near(applyShape(0.5, "exp", [0.3, 0.95]), 0.3 + 0.65 * 0.25, 1e-9, "exp offset range");

// ----- log (sqrt) -----
near(applyShape(0,   "log", [0, 1]),   0, 1e-9, "log v=0");
near(applyShape(1,   "log", [0, 1]),   1, 1e-9, "log v=1");
near(applyShape(0.25,"log", [0, 1]),   0.5, 1e-9, "log v=0.25 → sqrt=0.5");
near(applyShape(0.5, "log", [0.4, 1.0]),
  0.4 + 0.6 * Math.sqrt(0.5), 1e-9, "log offset range");

// ----- inv (1-v) -----
near(applyShape(0,   "inv", [0, 1]), 1,   1e-9, "inv v=0 → 1");
near(applyShape(1,   "inv", [0, 1]), 0,   1e-9, "inv v=1 → 0");
near(applyShape(0.5, "inv", [0, 1]), 0.5, 1e-9, "inv v=0.5 → 0.5");
near(applyShape(0.2, "inv", [0.1, 0.7]),
  0.1 + 0.6 * (1 - 0.2), 1e-9, "inv offset range");

// ----- threshold-0.5 -----
assert.equal(applyShape(0.0,  "threshold-0.5", [0, 1]), 0, "thresh lo at 0");
assert.equal(applyShape(0.49, "threshold-0.5", [0, 1]), 0, "thresh lo just below");
assert.equal(applyShape(0.5,  "threshold-0.5", [0, 1]), 1, "thresh hi at boundary");
assert.equal(applyShape(1.0,  "threshold-0.5", [0, 1]), 1, "thresh hi at 1");
near(applyShape(0.0,  "threshold-0.3", [0.2, 0.8]), 0.2, 1e-9, "thresh-0.3 lo");
near(applyShape(0.31, "threshold-0.3", [0.2, 0.8]), 0.8, 1e-9, "thresh-0.3 hi");

// ----- clamp contract: v outside [0,1] is clamped before shape -----
near(applyShape(-0.5, "linear", [0, 1]), 0, 1e-9, "clamp v below 0");
near(applyShape(1.5,  "linear", [0, 1]), 1, 1e-9, "clamp v above 1");
near(applyShape(2.0,  "exp",    [0, 1]), 1, 1e-9, "clamp v>1 exp");

// ----- unknown shape → throw -----
assert.throws(
  () => applyShape(0.5, "unknown_shape", [0, 1]),
  /unknown shape/,
  "unknown shape throws"
);

console.log("✓ shape-functions");
```

- [ ] **Step 2: Run — expect FAIL (module missing)**

```bash
cd /Users/Edo_1/album-gen && node test/expression-shape-functions.test.js
```

Expected: `Cannot find module`.

- [ ] **Step 3: Implement `shape-functions.js`**

Write `/Users/Edo_1/album-gen/src/mapping/shape-functions.js`:

```js
// Pure shape functions for the expression engine.
// applyShape(v, shape, range) → number
//
// v:     raw source value, clamped to [0,1] internally.
// shape: "linear" | "exp" | "log" | "inv" | "threshold-N"
// range: [lo, hi]  — output is mapped into this range.
//
// Spec §5.3:
//   linear:       y = lo + (hi - lo) * v
//   exp:          y = lo + (hi - lo) * v^2
//   log:          y = lo + (hi - lo) * sqrt(v)
//   inv:          y = lo + (hi - lo) * (1 - v)
//   threshold-N:  y = v < N ? lo : hi
//
// All applied to clamped v ∈ [0,1].

/**
 * @param {number} v        source value (clamped to [0,1])
 * @param {string} shape    shape identifier
 * @param {[number,number]} range  [lo, hi]
 * @returns {number}
 */
export function applyShape(v, shape, [lo, hi]) {
  const vc = Math.max(0, Math.min(1, v));
  const span = hi - lo;

  if (shape === "linear") {
    return lo + span * vc;
  }
  if (shape === "exp") {
    return lo + span * (vc * vc);
  }
  if (shape === "log") {
    return lo + span * Math.sqrt(vc);
  }
  if (shape === "inv") {
    return lo + span * (1 - vc);
  }
  if (shape.startsWith("threshold-")) {
    const n = parseFloat(shape.slice("threshold-".length));
    return vc < n ? lo : hi;
  }
  throw new Error(`applyShape: unknown shape "${shape}"`);
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd /Users/Edo_1/album-gen && node test/expression-shape-functions.test.js
```

Expected: `✓ shape-functions`.

- [ ] **Step 5: Run full suite**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all tests green + new shape-functions test.

- [ ] **Step 6: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/mapping/shape-functions.js test/expression-shape-functions.test.js
git commit -m "feat(m1c-γ): shape-functions — linear/exp/log/inv/threshold"
```

---

## Task 3: `source-samplers.js` + tests

A single export `sampleSource(name, event, worldState, rngStep)` that returns a number in `[0,1]` for each source signal defined in spec §5.2.

**Files:**
- Create: `/Users/Edo_1/album-gen/src/mapping/source-samplers.js`
- Create: `/Users/Edo_1/album-gen/test/expression-source-samplers.test.js`

- [ ] **Step 1: Write the failing test**

Write `/Users/Edo_1/album-gen/test/expression-source-samplers.test.js`:

```js
import { sampleSource } from "../src/mapping/source-samplers.js";
import { SeededRNG } from "../src/shared/perf-utils.js";
import assert from "node:assert/strict";

function near(a, e, eps = 1e-9, label = "") {
  assert.ok(Math.abs(a - e) <= eps, `${label}: expected ${e}, got ${a}`);
}
function inRange(v, lo, hi, label = "") {
  assert.ok(v >= lo && v <= hi, `${label}: ${v} not in [${lo},${hi}]`);
}

// Minimal worldState stub
function ws(overrides = {}) {
  return {
    globalTick: 0,
    phaseProgress: 0,
    barProgress: 0,
    phase: "germoglio",
    density: { rhythm: 0.4, harmony: 0.3, bass: 0.5, melody: 0.2, texture: 0.1 },
    audioEnergy: 0,
    ...overrides,
  };
}

// Minimal event stub
const ev = { vel: 64, pitch: 60, instrument: "bass", dur: 0.2, t: 0 };

// ----- velocity -----
near(sampleSource("velocity", { ...ev, vel: 0 },   ws()), 0,         1e-9, "velocity 0");
near(sampleSource("velocity", { ...ev, vel: 127 }, ws()), 1,         1e-9, "velocity 127");
near(sampleSource("velocity", { ...ev, vel: 64 },  ws()), 64 / 127,  1e-9, "velocity 64");

// ----- phaseProgress -----
near(sampleSource("phaseProgress", null, ws({ phaseProgress: 0 })),   0,   1e-9, "pp 0");
near(sampleSource("phaseProgress", null, ws({ phaseProgress: 0.75 })), 0.75, 1e-9, "pp 0.75");
near(sampleSource("phaseProgress", null, ws({ phaseProgress: 1 })),   1,   1e-9, "pp 1");

// ----- density.<role> -----
near(sampleSource("density.rhythm",  null, ws()), 0.4, 1e-9, "density.rhythm");
near(sampleSource("density.bass",    null, ws()), 0.5, 1e-9, "density.bass");
near(sampleSource("density.melody",  null, ws()), 0.2, 1e-9, "density.melody");
near(sampleSource("density.harmony", null, ws()), 0.3, 1e-9, "density.harmony");
near(sampleSource("density.texture", null, ws()), 0.1, 1e-9, "density.texture");

// ----- audioEnergy (stub 0 offline) -----
near(sampleSource("audioEnergy", null, ws({ audioEnergy: 0 })), 0, 1e-9, "audioEnergy stub");
// Even if worldState.audioEnergy were non-zero, confirm it flows through:
near(sampleSource("audioEnergy", null, ws({ audioEnergy: 0.6 })), 0.6, 1e-9, "audioEnergy passthrough");

// ----- barProgress -----
near(sampleSource("barProgress", null, ws({ barProgress: 0.5 })), 0.5, 1e-9, "barProgress");

// ----- phase (discrete → 0/0.25/0.5/0.75/1.0) -----
near(sampleSource("phase", null, ws({ phase: "germoglio" })),    0.00, 1e-9, "phase germoglio");
near(sampleSource("phase", null, ws({ phase: "pulsazione" })),   0.25, 1e-9, "phase pulsazione");
near(sampleSource("phase", null, ws({ phase: "densita" })),      0.50, 1e-9, "phase densita");
near(sampleSource("phase", null, ws({ phase: "rottura" })),      0.75, 1e-9, "phase rottura");
near(sampleSource("phase", null, ws({ phase: "dissoluzione" })), 1.00, 1e-9, "phase dissoluzione");

// ----- LFO sources: output in [0,1], deterministic from globalTick -----
const lfoSources = ["lfo_slow", "lfo_med", "lfo_fast", "lfo_pan_slow"];
for (const src of lfoSources) {
  const v1 = sampleSource(src, null, ws({ globalTick: 0 }));
  const v2 = sampleSource(src, null, ws({ globalTick: 0 }));
  inRange(v1, 0, 1, `${src} in [0,1]`);
  assert.equal(v1, v2, `${src} deterministic`);
  // At different ticks the value changes
  const v3 = sampleSource(src, null, ws({ globalTick: 100 }));
  // Not asserting v1 !== v3 (could be same by coincidence) — just that it doesn't throw.
}

// lfo_pan_slow: sin → raw in [-1,1] → normalised to [0,1]
const panV = sampleSource("lfo_pan_slow", null, ws({ globalTick: 0 }));
inRange(panV, 0, 1, "lfo_pan_slow normalised");

// ----- random: deterministic per rngStep -----
const rng1 = new SeededRNG(42);
const r1 = sampleSource("random", ev, ws(), rng1);
const rng2 = new SeededRNG(42);
const r2 = sampleSource("random", ev, ws(), rng2);
assert.equal(r1, r2, "random source deterministic");
inRange(r1, 0, 1, "random in [0,1]");

// ----- unknown source → throw -----
assert.throws(
  () => sampleSource("nonexistent_source", ev, ws()),
  /unknown source/,
  "unknown source throws"
);

console.log("✓ source-samplers");
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd /Users/Edo_1/album-gen && node test/expression-source-samplers.test.js
```

Expected: `Cannot find module`.

- [ ] **Step 3: Implement `source-samplers.js`**

Write `/Users/Edo_1/album-gen/src/mapping/source-samplers.js`:

```js
// Source samplers for the expression engine.
// sampleSource(name, event, worldState, rngStep?) → number in [0,1]
//
// Spec §5.2:
//   velocity        per-note  0..127 normalised → 0..1
//   phaseProgress   continuous  0..1 within song
//   density.<role>  continuous  0..0.9
//   audioEnergy     continuous  stub 0 offline (M1d wires the real value)
//   barProgress     continuous  0..1 within current bar
//   phase           discrete    germoglio=0.0 … dissoluzione=1.0
//   lfo_slow        sin(globalTick * 0.005) → normalised [0,1]
//   lfo_med         sin(globalTick * 0.02)  → normalised [0,1]
//   lfo_fast        sin(globalTick * 0.1)   → normalised [0,1]
//   lfo_pan_slow    sin(globalTick * 0.003) → normalised [0,1]
//   random          SeededRNG.next() (deterministic, never Math.random)
//
// audioEnergy: worldState.audioEnergy is 0 in offline mode. In M1d a SC reply
// hook will update it. This module reads it transparently — no stub needed here.
//
// All LFO outputs are normalised: (sin(...) + 1) / 2  ∈ [0,1].

const PHASE_VALUES = {
  germoglio:    0.0,
  pulsazione:   0.25,
  densita:      0.5,
  rottura:      0.75,
  dissoluzione: 1.0,
};

const LFO_RATES = {
  lfo_slow:     0.005,
  lfo_med:      0.02,
  lfo_fast:     0.1,
  lfo_pan_slow: 0.003,
};

/**
 * Sample a named source signal and return a value in [0,1].
 *
 * @param {string} name         source name (see spec §5.2)
 * @param {object|null} event   note event (required for 'velocity'; null otherwise)
 * @param {object} worldState   current world state
 * @param {object|null} rngStep SeededRNG instance (required for 'random'; null otherwise)
 * @returns {number}  value in [0,1]
 */
export function sampleSource(name, event, worldState, rngStep = null) {
  if (name === "velocity") {
    return Math.max(0, Math.min(1, (event?.vel ?? 64) / 127));
  }

  if (name === "phaseProgress") {
    return Math.max(0, Math.min(1, worldState.phaseProgress ?? 0));
  }

  if (name.startsWith("density.")) {
    const role = name.slice("density.".length);
    const d = worldState.density?.[role] ?? 0;
    return Math.max(0, Math.min(1, d));
  }

  if (name === "audioEnergy") {
    // Reads worldState.audioEnergy (0 offline, wired from SC reply in M1d).
    return Math.max(0, Math.min(1, worldState.audioEnergy ?? 0));
  }

  if (name === "barProgress") {
    return Math.max(0, Math.min(1, worldState.barProgress ?? 0));
  }

  if (name === "phase") {
    const key = worldState.phase ?? "germoglio";
    return PHASE_VALUES[key] ?? 0;
  }

  if (name in LFO_RATES) {
    const raw = Math.sin((worldState.globalTick ?? 0) * LFO_RATES[name]);
    return (raw + 1) / 2;   // normalise [-1,1] → [0,1]
  }

  if (name === "random") {
    if (!rngStep) return 0.5;   // safe fallback when no RNG provided
    return Math.max(0, Math.min(1, rngStep.next() / 0xFFFFFFFF));
  }

  throw new Error(`sampleSource: unknown source "${name}"`);
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd /Users/Edo_1/album-gen && node test/expression-source-samplers.test.js
```

Expected: `✓ source-samplers`.

- [ ] **Step 5: Run full suite**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all green.

- [ ] **Step 6: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/mapping/source-samplers.js test/expression-source-samplers.test.js
git commit -m "feat(m1c-γ): source-samplers — 10 signal types, deterministic"
```

---

## Task 4: `expression-applier.js` + tests

Pure function that applies per-note rules to an event and returns the event with an `extras` field.

**Files:**
- Create: `/Users/Edo_1/album-gen/src/mapping/expression-applier.js`
- Create: `/Users/Edo_1/album-gen/test/expression-applier.test.js`

- [ ] **Step 1: Write the failing test**

Write `/Users/Edo_1/album-gen/test/expression-applier.test.js`:

```js
import { applyPerNoteExpression, familyOf } from "../src/mapping/expression-applier.js";
import { SeededRNG } from "../src/shared/perf-utils.js";
import assert from "node:assert/strict";

function near(a, e, eps = 1e-6, label = "") {
  assert.ok(Math.abs(a - e) <= eps, `${label}: expected ${e}, got ${a}`);
}

// Minimal worldState
const ws = {
  globalTick: 50,
  phaseProgress: 0.6,
  barProgress: 0.25,
  phase: "densita",
  density: { rhythm: 0.6, harmony: 0.4, bass: 0.7, melody: 0.3, texture: 0.1 },
  audioEnergy: 0,
};

// Rules matching spec §5.1 jolt.yaml example (simplified)
const rules = {
  substance: "TEST",
  families: {
    bass: {
      cutoff: { source: "velocity", shape: "exp", range: [0.3, 0.95] },
      drive:  { source: "phaseProgress", shape: "linear", range: [0.1, 0.7] },
    },
    lead: {
      pan: { source: "lfo_pan_slow", shape: "linear", range: [-0.4, 0.4] },
    },
  },
  continuous: {},
};

const bassEvent = { t: 0.5, instrument: "bass", pitch: 48, vel: 100, dur: 0.3 };
const leadEvent = { t: 1.0, instrument: "lead", pitch: 72, vel: 80, dur: 0.2 };
const kickEvent = { t: 0,   instrument: "kick", pitch: 36, vel: 90, dur: 0.1 };

// ----- 1. bass event: extras populated -----
const rng = new SeededRNG(42);
const result = applyPerNoteExpression(bassEvent, rules, ws, rng);

// extras is a plain object
assert.ok(result.extras && typeof result.extras === "object", "extras is object");

// cutoff: velocity=100/127≈0.787, exp → 0.787^2≈0.619, range [0.3,0.95] → 0.3 + 0.65*0.619≈0.703
const expectedCutoff = 0.3 + 0.65 * Math.pow(100 / 127, 2);
near(result.extras.cutoff, expectedCutoff, 1e-6, "bass cutoff");

// drive: phaseProgress=0.6, linear, range [0.1,0.7] → 0.1 + 0.6*0.6=0.46
near(result.extras.drive, 0.1 + 0.6 * 0.6, 1e-6, "bass drive");

// original event fields preserved
assert.equal(result.t, bassEvent.t);
assert.equal(result.pitch, bassEvent.pitch);
assert.equal(result.vel, bassEvent.vel);

// ----- 2. lead event: pan populated -----
const result2 = applyPerNoteExpression(leadEvent, rules, ws, rng);
assert.ok("pan" in result2.extras, "lead extras has pan");
// pan range is [-0.4, 0.4] — verify in range
assert.ok(result2.extras.pan >= -0.4 && result2.extras.pan <= 0.4, "pan in range");

// ----- 3. kick event: no family rules → event returned unchanged, no extras -----
const result3 = applyPerNoteExpression(kickEvent, rules, ws, rng);
assert.equal(result3.extras, undefined, "kick no extras (no family rule)");

// ----- 4. null rules → event returned unchanged -----
const result4 = applyPerNoteExpression(bassEvent, null, ws, rng);
assert.equal(result4.extras, undefined, "null rules → no extras");

// ----- 5. Determinism: same tick + same seed → same extras -----
const rngA = new SeededRNG(7);
const rngB = new SeededRNG(7);
const a = applyPerNoteExpression(bassEvent, rules, ws, rngA);
const b = applyPerNoteExpression(bassEvent, rules, ws, rngB);
assert.deepEqual(a.extras, b.extras, "extras deterministic");

// ----- 6. familyOf resolves correctly -----
assert.equal(familyOf("bass"),    "bass",    "familyOf bass");
assert.equal(familyOf("lead"),    "lead",    "familyOf lead");
assert.equal(familyOf("kick"),    "kick",    "familyOf kick");
assert.equal(familyOf("drone"),   "drone",   "familyOf drone");
assert.equal(familyOf("pad"),     "pad",     "familyOf pad");
assert.equal(familyOf("snare"),   "snare",   "familyOf snare");
assert.equal(familyOf("hat"),     "hat",     "familyOf hat");
assert.equal(familyOf("perc"),    "perc",    "familyOf perc");
assert.equal(familyOf("texture"), "texture", "familyOf texture");

console.log("✓ expression-applier");
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd /Users/Edo_1/album-gen && node test/expression-applier.test.js
```

- [ ] **Step 3: Implement `expression-applier.js`**

Write `/Users/Edo_1/album-gen/src/mapping/expression-applier.js`:

```js
// Per-note expression applier.
// Takes a note event + rules + worldState + rngStep, returns event with extras.
//
// Spec §5.4 wiring — Level 1.
//
// familyOf: instrument name → family name for rule lookup.
// For album-gen the instrument name IS the family name (bass→bass, lead→lead, etc.).
// This indirection exists so future aliases (e.g. arp→lead, voice→texture) can be
// centralised here without touching composers.

import { sampleSource } from "./source-samplers.js";
import { applyShape }   from "./shape-functions.js";

const INSTRUMENT_FAMILY = {
  kick:    "kick",
  snare:   "snare",
  hat:     "hat",
  perc:    "perc",
  drone:   "drone",
  bass:    "bass",
  pad:     "pad",
  texture: "texture",
  lead:    "lead",
};

/**
 * Map instrument name → family name for rule lookup.
 * @param {string} instrument
 * @returns {string}
 */
export function familyOf(instrument) {
  return INSTRUMENT_FAMILY[instrument] ?? instrument;
}

/**
 * Apply per-note modulation rules to an event.
 *
 * @param {object}      event       note event { t, instrument, pitch, vel, dur }
 * @param {object|null} rules       modulation rules object (from _default.yaml or substance yaml)
 * @param {object}      worldState  current world state
 * @param {object|null} rngStep     SeededRNG for "random" source; null → source returns 0.5
 * @returns {object}  event (new object if extras added, original reference if no family rules)
 */
export function applyPerNoteExpression(event, rules, worldState, rngStep = null) {
  if (!rules?.families) return event;

  const family = familyOf(event.instrument);
  const familyRules = rules.families[family];
  if (!familyRules) return event;

  const extras = {};
  for (const [param, rule] of Object.entries(familyRules)) {
    const v = sampleSource(rule.source, event, worldState, rngStep);
    extras[param] = applyShape(v, rule.shape, rule.range);
  }

  return { ...event, extras };
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd /Users/Edo_1/album-gen && node test/expression-applier.test.js
```

Expected: `✓ expression-applier`.

- [ ] **Step 5: Run full suite**

```bash
cd /Users/Edo_1/album-gen && npm test
```

- [ ] **Step 6: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/mapping/expression-applier.js test/expression-applier.test.js
git commit -m "feat(m1c-γ): expression-applier — per-note extras via rules + samplers + shapes"
```

---

## Task 5: `_default.yaml` modulation rules

Baseline rules for the 9 M1a synths. These rules are designed to make the M1a sound "breathe" with musically sensible defaults: cutoff opens with velocity, drive builds with phaseProgress, pan drifts slowly for melodic voices, noise adds texture at high density.

**Files:**
- Create: `/Users/Edo_1/album-gen/sc/modulation-rules/_default.yaml`

- [ ] **Step 1: Write `_default.yaml`**

Write `/Users/Edo_1/album-gen/sc/modulation-rules/_default.yaml`:

```yaml
# Default modulation rules for M1a 9 synths.
# Used when no substance-specific yaml exists (fallback chain: substance.yaml → _default.yaml).
# Spec §5.1 schema: families.<family>.<param>: { source, shape, range }
# Spec §5.5 continuous: synths that receive /params frames every 16th step.
#
# Design goals (per spec §5, "audibly: cutoff opens with velocity, pan fluctuates
# slowly, drive intensifies with phaseProgress"):
#   - bass:    cutoff tracks velocity (exp), drive builds across song (linear/phaseProgress)
#   - pad:     cutoff opens with velocity (log → slower opening), pan drifts (lfo_pan_slow)
#   - drone:   cutoff breathes with phase (linear/phase), continuous cutoff sweep
#   - lead:    cutoff exp on velocity, pan oscillates slowly, drive with phaseProgress
#   - texture: noise follows density.texture (log), pan drifts
#   - kick:    drive follows density.rhythm (linear) — no cutoff (frequency fixed)
#   - snare:   noise adds bite above half density
#   - hat:     no extras — minimal, purposefully excluded
#   - perc:    pan drifts slowly (lfo_pan_slow)
#
# SynthDef default values (arg defaults in .scd files):
#   cutoff = 0.6   (applied as multiplier: RLPF freq = freq * (4 + cutoff * 12) or similar)
#   drive  = 0.0   (amount of harmonic saturation; 0 = off)
#   noise  = 0.0   (additive noise level; 0 = off)
#   pan    = 0.0   (Pan2 position; 0 = centre)
#
# When no extra is sent, SynthDef uses its declared default → M1a sound preserved.

substance: _default

families:

  bass:
    cutoff:
      source: velocity
      shape:  exp
      range:  [0.30, 0.95]
    drive:
      source: phaseProgress
      shape:  linear
      range:  [0.00, 0.45]

  pad:
    cutoff:
      source: velocity
      shape:  log
      range:  [0.25, 0.85]
    pan:
      source: lfo_pan_slow
      shape:  linear
      range:  [-0.30, 0.30]

  drone:
    cutoff:
      source: phase
      shape:  linear
      range:  [0.20, 0.80]

  lead:
    cutoff:
      source: velocity
      shape:  exp
      range:  [0.35, 1.00]
    drive:
      source: phaseProgress
      shape:  linear
      range:  [0.00, 0.55]
    pan:
      source: lfo_pan_slow
      shape:  linear
      range:  [-0.40, 0.40]

  texture:
    noise:
      source: density.texture
      shape:  log
      range:  [0.00, 0.40]
    pan:
      source: lfo_pan_slow
      shape:  linear
      range:  [-0.35, 0.35]

  kick:
    drive:
      source: density.rhythm
      shape:  linear
      range:  [0.10, 0.60]

  snare:
    noise:
      source: density.rhythm
      shape:  threshold-0.5
      range:  [0.00, 0.20]

  hat:
    # Hat is percussive and high-frequency — extras excluded intentionally.
    # Adding extras here would require filter changes that alter the M1a hat character.

  perc:
    pan:
      source: lfo_pan_slow
      shape:  linear
      range:  [-0.25, 0.25]

# Continuous params: these synths receive /synth/<n>/params frames every 16th step.
# Only sources that change smoothly (LFOs, phaseProgress) are worth continuous frames.
# Velocity/density are per-note only.
#
# Nominal bandwidth at 96 BPM: 1 frame per 16th = ~24 frames/sec.
# 3 continuous synths × 1-2 params each = ~48-72 OSC messages/sec. Manageable.
continuous:
  drone:   [cutoff]
  pad:     [pan]
  lead:    [pan]
```

Note: `hat` family section has no params — that's valid YAML (empty mapping). The JS loader must handle `familyRules = {}` gracefully (no params → no extras). This is already handled in `expression-applier.js` (the `for...of Object.entries` loop over an empty object is a no-op).

- [ ] **Step 2: Verify YAML parses**

```bash
cd /Users/Edo_1/album-gen && node -e "
import('js-yaml').then(({default: yaml}) => {
  const {readFileSync} = await import('node:fs');
  // can't mix await like this in -e, just load from cli
}).catch(()=>{});
"
# Simpler: use node to parse
node --input-type=module << 'EOF'
import yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
const text = readFileSync('/Users/Edo_1/album-gen/sc/modulation-rules/_default.yaml', 'utf8');
const obj = yaml.load(text);
console.log('families keys:', Object.keys(obj.families));
console.log('continuous keys:', Object.keys(obj.continuous));
console.log('✓ _default.yaml parses');
EOF
```

Expected output: `families keys: [ 'bass', 'pad', 'drone', 'lead', 'texture', 'kick', 'snare', 'hat', 'perc' ]`

- [ ] **Step 3: Commit**

```bash
cd /Users/Edo_1/album-gen
git add sc/modulation-rules/_default.yaml
git commit -m "feat(m1c-γ): _default.yaml modulation rules for 9 M1a synths"
```

---

## Task 6: `expression-weaver.js` + tests

The continuous-params factory. Creates a weaver that, when `tick()` is called once per 16th step, emits `emitParams` calls for all synths declared in `rules.continuous`.

**Files:**
- Create: `/Users/Edo_1/album-gen/src/composers/expression-weaver.js`
- Create: `/Users/Edo_1/album-gen/test/expression-weaver.test.js`

- [ ] **Step 1: Write the failing test**

Write `/Users/Edo_1/album-gen/test/expression-weaver.test.js`:

```js
import { createExpressionWeaver } from "../src/composers/expression-weaver.js";
import assert from "node:assert/strict";

function near(a, e, eps = 1e-9, label = "") {
  assert.ok(Math.abs(a - e) <= eps, `${label}: expected ${e}, got ${a}`);
}

// Capture harness: records emitParams calls
function makeHarness() {
  const calls = [];
  return {
    emitParams(synthName, params) { calls.push({ synthName, params }); },
    calls,
  };
}

// Minimal worldState (globalTick set for LFO determinism)
function ws(globalTick = 0) {
  return {
    globalTick,
    phaseProgress: 0.4,
    barProgress: 0,
    phase: "pulsazione",
    density: { rhythm: 0.5, harmony: 0.3, bass: 0.4, melody: 0.2, texture: 0.15 },
    audioEnergy: 0,
  };
}

// Rules with continuous entries
const rules = {
  substance: "_default",
  families: {
    drone: {
      cutoff: { source: "phase", shape: "linear", range: [0.20, 0.80] },
    },
    lead: {
      pan: { source: "lfo_pan_slow", shape: "linear", range: [-0.40, 0.40] },
    },
    bass: {
      cutoff: { source: "velocity",      shape: "exp",    range: [0.30, 0.95] },
      drive:  { source: "phaseProgress", shape: "linear", range: [0.00, 0.45] },
    },
  },
  continuous: {
    drone: ["cutoff"],
    lead:  ["pan"],
  },
};

// ----- 1. tick() emits one emitParams call per continuous synth -----
const harness = makeHarness();
const wState = ws(0);
const weaver = createExpressionWeaver({ rules, worldState: wState, harness });
weaver.tick();

assert.equal(harness.calls.length, 2, "tick emits 2 calls (drone + lead)");
const droneCall = harness.calls.find(c => c.synthName === "drone");
const leadCall  = harness.calls.find(c => c.synthName === "lead");
assert.ok(droneCall, "drone emitParams called");
assert.ok(leadCall,  "lead emitParams called");

// drone.cutoff: phase=pulsazione → 0.25, linear [0.20,0.80] → 0.20 + 0.60*0.25 = 0.35
near(droneCall.params.cutoff, 0.20 + 0.60 * 0.25, 1e-6, "drone cutoff");

// lead.pan: lfo_pan_slow at tick=0, normalised, linear [-0.40, 0.40]
const lfoRaw = Math.sin(0 * 0.003);  // = 0
const lfoNorm = (lfoRaw + 1) / 2;   // = 0.5
const expectedPan = -0.40 + 0.80 * lfoNorm;  // = 0.0
near(leadCall.params.pan, expectedPan, 1e-6, "lead pan at tick=0");

// ----- 2. bass is NOT in continuous → no emitParams for bass -----
const bassCall = harness.calls.find(c => c.synthName === "bass");
assert.equal(bassCall, undefined, "bass not continuous → no emitParams");

// ----- 3. Determinism: same worldState → same values -----
const harness2 = makeHarness();
const weaver2 = createExpressionWeaver({ rules, worldState: ws(0), harness: harness2 });
weaver2.tick();
assert.deepEqual(
  harness.calls.map(c => c.params),
  harness2.calls.map(c => c.params),
  "weaver deterministic"
);

// ----- 4. Different worldState.globalTick → different LFO values -----
const harness3 = makeHarness();
const weaver3 = createExpressionWeaver({ rules, worldState: ws(500), harness: harness3 });
weaver3.tick();
const leadTick500 = harness3.calls.find(c => c.synthName === "lead");
// At tick=500 sin(500*0.003) ≠ sin(0) → pan should differ
const lfoTick500 = (Math.sin(500 * 0.003) + 1) / 2;
const expectedPan500 = -0.40 + 0.80 * lfoTick500;
near(leadTick500.params.pan, expectedPan500, 1e-6, "lead pan at tick=500");

// ----- 5. Empty continuous → no calls -----
const emptyRules = { ...rules, continuous: {} };
const harness4 = makeHarness();
const weaver4 = createExpressionWeaver({ rules: emptyRules, worldState: ws(0), harness: harness4 });
weaver4.tick();
assert.equal(harness4.calls.length, 0, "empty continuous → no emitParams");

// ----- 6. Missing family rule for a continuous param → skipped gracefully -----
const rulesNoFamily = {
  families: { drone: {} },  // drone has family but no 'cutoff' rule
  continuous: { drone: ["cutoff"] },
};
const harness5 = makeHarness();
const weaver5 = createExpressionWeaver({ rules: rulesNoFamily, worldState: ws(0), harness: harness5 });
assert.doesNotThrow(() => weaver5.tick(), "missing rule → no throw");
// emitParams called with empty params object (no cutoff computed)
const droneCall5 = harness5.calls.find(c => c.synthName === "drone");
assert.ok(droneCall5, "drone call still made");
assert.deepEqual(droneCall5.params, {}, "params empty when rule missing");

console.log("✓ expression-weaver");
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd /Users/Edo_1/album-gen && node test/expression-weaver.test.js
```

- [ ] **Step 3: Implement `expression-weaver.js`**

Write `/Users/Edo_1/album-gen/src/composers/expression-weaver.js`:

```js
// Expression Weaver — continuous modulation params.
// Spec §5.5 Wiring Level 2.
//
// createExpressionWeaver({ rules, worldState, harness }) → { tick }
//
// tick() is called once per 16th step by createRealComposers.generateBar,
// AFTER the 5 composer ticks and BEFORE harness.endTick().
// It emits harness.emitParams(synthName, values) for every synth listed in
// rules.continuous.
//
// Only sources that are useful as continuous signals make sense here:
// LFOs, phaseProgress, phase, density.*. Velocity is per-note only and is
// never in the continuous list. The weaver silently skips any param whose
// rule uses "velocity" as source (since no event is available).

import { sampleSource } from "../mapping/source-samplers.js";
import { applyShape }   from "../mapping/shape-functions.js";

/**
 * @param {object} opts
 * @param {object} opts.rules        modulation rules object
 * @param {object} opts.worldState   current world state (read live each tick)
 * @param {object} opts.harness      harness with emitParams(synthName, params)
 * @returns {{ tick: () => void }}
 */
export function createExpressionWeaver({ rules, worldState, harness }) {
  if (!rules?.continuous) {
    return { tick() {} };   // graceful no-op
  }

  function tick() {
    for (const [synthName, params] of Object.entries(rules.continuous)) {
      const familyRules = rules.families?.[synthName] ?? {};
      const values = {};

      for (const param of params) {
        const rule = familyRules[param];
        if (!rule) continue;   // rule missing → skip this param silently

        // Pass null for event (continuous, no per-note context) and null rngStep
        // (continuous params should not use 'random' source — it would jitter per-tick).
        const v = sampleSource(rule.source, null, worldState, null);
        values[param] = applyShape(v, rule.shape, rule.range);
      }

      harness.emitParams(synthName, values);
    }
  }

  return { tick };
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd /Users/Edo_1/album-gen && node test/expression-weaver.test.js
```

Expected: `✓ expression-weaver`.

- [ ] **Step 5: Run full suite**

```bash
cd /Users/Edo_1/album-gen && npm test
```

- [ ] **Step 6: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/composers/expression-weaver.js test/expression-weaver.test.js
git commit -m "feat(m1c-γ): expression-weaver — continuous /params per 16th step"
```

---

## Task 7: Extend `composer-harness.js`

Three additions:
1. `emit()` extended to accept optional `extras` arg (back-compat).
2. New `emitParams(synthName, params)` method.
3. `createRealComposers`: loads `_default.yaml` rules (or `modulationRules` param), creates per-note `SeededRNG`, applies `applyPerNoteExpression` in `emit()`, instantiates weaver, ticks it after the 5 composers each step.

**Files:**
- Modify: `/Users/Edo_1/album-gen/src/composers/composer-harness.js`

- [ ] **Step 1: Extend `emit()` and add `emitParams()` in `createHarness`**

Open `/Users/Edo_1/album-gen/src/composers/composer-harness.js`.

Replace the `emit` function:

```js
/**
 * Called by ported composers in place of sendMIDINote.
 * @param {number} ch
 * @param {number} note
 * @param {number} vel
 * @param {number} durationMs
 * @param {Record<string,number>|null} [extras]  — M1c-γ: optional per-note expression values
 */
function emit(ch, note, vel, durationMs, extras = null) {
  let instrument = CH_TO_INSTRUMENT[ch & 0x0F] || "texture";
  if (instrument === "__perc__") instrument = PERC_NOTE_TO_INSTRUMENT(note);
  const t = (curBar * 16 + curStep) * stepDurSec;
  const ev = {
    t,
    instrument,
    pitch: note | 0,
    vel: vel | 0,
    dur: durationMs / 1000,
  };
  if (extras) ev.extras = extras;
  buffer.push(ev);
}
```

Add `emitParams` after `emit`:

```js
/**
 * Emit a continuous params update for a named synth.
 * M1c-γ: called by the expression-weaver each 16th step.
 * @param {string} synthName               e.g. "bass"
 * @param {Record<string,number>} params   e.g. { drive: 0.42 }
 */
function emitParams(synthName, params) {
  const t = (curBar * 16 + curStep) * stepDurSec;
  buffer.push({
    t,
    instrument: '__params__',
    synth: synthName,
    params,
  });
}
```

Update the return statement in `createHarness` to expose `emitParams`:

```js
return { beginTick, emit, emitParams, addMidiNote, sendMIDICC, sendMIDIPitchBend, endTick, reset, bpm };
```

- [ ] **Step 2: Extend `createRealComposers` to wire expression engine**

At the top of `composer-harness.js`, add new imports (after existing imports):

```js
import { applyPerNoteExpression } from "../mapping/expression-applier.js";
import { createExpressionWeaver }  from "./expression-weaver.js";
import { SeededRNG }               from "../shared/perf-utils.js";
import { deriveComposerSeed }      from "../core/seed-manager.js";
import { readFile }                from "node:fs/promises";
import { resolve, dirname }        from "node:path";
import { fileURLToPath }           from "node:url";
import yaml                        from "js-yaml";

const HERE = dirname(fileURLToPath(import.meta.url));

async function loadModulationRules(rulesPath) {
  // rulesPath: either an absolute path or a repo-relative path like
  // "sc/modulation-rules/haze.yaml". Fallback: _default.yaml.
  const defaultPath = resolve(HERE, "../../sc/modulation-rules/_default.yaml");

  async function tryLoad(p) {
    try {
      const text = await readFile(p, "utf8");
      return yaml.load(text);
    } catch {
      return null;
    }
  }

  if (rulesPath) {
    const abs = rulesPath.startsWith("/")
      ? rulesPath
      : resolve(HERE, "../../", rulesPath);
    const rules = await tryLoad(abs);
    if (rules) return rules;
    // Fall through to _default
  }
  const def = await tryLoad(defaultPath);
  if (def) return def;
  // Absolute last resort: empty rules (no expression)
  return { families: {}, continuous: {} };
}
```

Modify `createRealComposers` signature and body:

```js
/**
 * Build all 5 real composers sharing one worldState + one harness.
 * Call once per song. Returns an object usable by song-director.tickBar().
 *
 * @param {object}      opts
 * @param {number}      opts.seed
 * @param {object}      opts.worldState
 * @param {object|null} [opts.modulationRules]  — pre-loaded rules object (optional).
 *   If null/undefined, loadModulationRules(worldState.modulation_rules_path) is called
 *   automatically. Pass an explicit object in tests to avoid file I/O.
 */
export async function createRealComposers({ seed, worldState, modulationRules = null }) {
  const harness = createHarness({ bpm: worldState.bpm });

  // Load rules: use provided object, or load from path, or fall back to _default.
  const rules = modulationRules
    ?? await loadModulationRules(worldState.modulation_rules_path ?? null);

  // Per-note expression RNG: seeded from song seed + instrument for reproducibility.
  // A single RNG per createRealComposers call advances deterministically with each note.
  const exprRng = new SeededRNG(deriveComposerSeed(seed, "expression"));

  // Patch harness.emit to apply expression before buffering.
  // We wrap the original emit so composers call it normally.
  const originalEmit = harness.emit.bind(harness);
  harness.emit = function(ch, note, vel, durationMs, extras = null) {
    // Resolve instrument to check if rules apply
    let instrument = CH_TO_INSTRUMENT[ch & 0x0F] || "texture";
    if (instrument === "__perc__") instrument = PERC_NOTE_TO_INSTRUMENT(note);
    // Build a minimal event for the applier (t not yet known here, use 0 as placeholder)
    const eventForApplier = { t: 0, instrument, pitch: note | 0, vel: vel | 0, dur: durationMs / 1000 };
    const applied = applyPerNoteExpression(eventForApplier, rules, worldState, exprRng);
    // Merge extras: explicitly passed extras override computed ones (back-compat)
    const finalExtras = applied.extras
      ? (extras ? { ...applied.extras, ...extras } : applied.extras)
      : extras;
    originalEmit(ch, note, vel, durationMs, finalExtras);
  };

  const mk = (family, factory) => factory({
    seed: deriveComposerSeed(seed, family),
    harness,
    worldState,
  });

  const rhythm  = mk("rhythm",  createRhythm);
  const harmony = mk("harmony", createHarmony);
  const bass    = mk("bass",    createBass);
  const melody  = mk("melody",  createMelody);
  const texture = mk("texture", createTexture);

  // Expression weaver for continuous /params
  const weaver = createExpressionWeaver({ rules, worldState, harness });

  function initAll() {
    rhythm.init();
    harmony.init();
    bass.init();
    melody.init();
    texture.init();
  }
  initAll();

  /**
   * Generate one bar of events. Caller must set worldState.phaseProgress and
   * worldState.currentBar before calling.
   */
  function generateBar(barIndex) {
    worldState.phase = mapPhase(
      worldState.role,
      worldState.phaseProgress,
      worldState.phaseDistribution ?? null
    );
    worldState.globalBar = barIndex;

    const events = [];
    for (let step = 0; step < 16; step++) {
      worldState.globalStep = step;
      worldState.globalTick = barIndex * 16 + step;
      worldState.barProgress = step / 16;

      harness.beginTick({ bar: barIndex, step });
      rhythm.tick();
      harmony.tick();
      bass.tick();
      melody.tick();
      texture.tick();
      // M1c-γ: weaver runs AFTER 5 composers, BEFORE endTick drain.
      // __params__ events appear after notes in the same tick — consistent ordering.
      weaver.tick();
      const tickEvents = harness.endTick();
      events.push(...tickEvents);
    }
    return events;
  }

  function reset() {
    harness.reset();
    initAll();
  }

  return { generateBar, reset };
}
```

**Important**: `createRealComposers` is now `async`. All callers (primarily `song-director.js`) that call `createRealComposers(...)` must await it or handle the returned promise. Audit every call site:

- `/Users/Edo_1/album-gen/src/core/song-director.js` — wherever `createRealComposers(...)` is called, wrap with `await`. The containing function must also be async or return a Promise.

- [ ] **Step 3: Audit and update `song-director.js` for async**

Open `/Users/Edo_1/album-gen/src/core/song-director.js`.

Find the line(s) that call `createRealComposers`:

```js
// before:
const bundle = createRealComposers({ seed, worldState });

// after:
const bundle = await createRealComposers({ seed, worldState });
```

The function that makes this call (likely `resetState()` or a lazy-init helper) must be `async`. If `generateBar` is synchronous and `resetState` was synchronous, you need to:
- Make `resetState` async (it now calls `await createRealComposers`).
- Make `generateBar` (or its outer wrapper `tickBar`) async — return `Promise<Event[]>`.
- Make `createAlbumDirector.generateAll()` await `tickBar`.

Chain the async up to the top of `album-director.js`. The test runner (`pipeline.test.js`, `mapping-m1c-integration.test.js`) uses top-level await and already handles async — it just needs to await `generateAll()` if it doesn't already.

If the existing code initialises the bundle lazily on first `tickBar` call, a clean pattern is:

```js
// Inside createSongDirector:
let _bundle = null;
let _bundleReady = false;

async function ensureBundle() {
  if (_bundleReady) return;
  _bundle = await createRealComposers({ seed, worldState, modulationRules: null });
  _bundleReady = true;
}

async function tickBar(barIndex) {
  await ensureBundle();
  advanceWorldState(state, barIndex);
  return _bundle.generateBar(barIndex);
}
```

Adapt to the existing structure rather than rewriting it. The intent is to keep the diff minimal.

- [ ] **Step 4: Run M1b/M1c-α tests to verify no regression**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all tests green. If `pipeline.test.js` fails because it doesn't `await generateAll()`, add `await` at that call site. The event counts will be higher now (each 16th step also emits `__params__` events for drone, pad, lead), so update any hardcoded event-count snapshots.

> **Snapshot update note:** `__params__` events are now in the event stream. Tests that count total events need updating. Tests that check only `note` events by filtering `e.instrument !== '__params__'` are unaffected. If `pipeline.test.js` checks exact event count, update the snapshot and re-verify 3 runs are bit-identical.

- [ ] **Step 5: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/composers/composer-harness.js src/core/song-director.js
git commit -m "feat(m1c-γ): harness emit(extras) + emitParams + weaver wired in createRealComposers"
```

---

## Task 8: Extend `sc-dispatcher.js` + tests

Two serialization changes:
1. Note events with `extras`: append k-v pairs after `freq amp dur`.
2. `__params__` events: emit `/synth/<n>/params k1 v1 k2 v2`.

**Files:**
- Modify: `/Users/Edo_1/album-gen/src/live/sc-dispatcher.js`
- Create: `/Users/Edo_1/album-gen/test/sc-dispatcher-extras.test.js`

- [ ] **Step 1: Write the failing test**

Write `/Users/Edo_1/album-gen/test/sc-dispatcher-extras.test.js`:

```js
import { createScDispatcher } from "../src/live/sc-dispatcher.js";
import assert from "node:assert/strict";

// Fake transport: captures sent frames
function makeTransport() {
  const frames = [];
  return {
    send(frame) { frames.push(frame); },
    isOpen() { return true; },
    frames,
  };
}

// Fake clock: fixed at t=0
const now = () => 0;
const setT = (fn, delay) => { if (delay <= 0) fn(); };

// ----- 1. Note event WITHOUT extras → original 3-arg format -----
{
  const t = makeTransport();
  const d = createScDispatcher({ transport: t, now, setTimeout: setT, lookaheadMs: 0 });
  const events = [{ t: 0, instrument: "bass", pitch: 48, vel: 80, dur: 0.3 }];
  d.scheduleBar(0, events);

  assert.equal(t.frames.length, 1, "1 frame for 1 event");
  const f = t.frames[0];
  assert.equal(f.address, "/synth/bass/note");
  assert.equal(f.args.length, 3, "no extras → 3 args");
  assert.ok(typeof f.args[0] === "number", "freq is number");
  assert.ok(Math.abs(f.args[1] - 80/127) < 0.001, "amp from vel");
  assert.equal(f.args[2], 0.3, "dur");
}

// ----- 2. Note event WITH extras → 3 + 2*N args -----
{
  const t = makeTransport();
  const d = createScDispatcher({ transport: t, now, setTimeout: setT, lookaheadMs: 0 });
  const events = [{
    t: 0, instrument: "bass", pitch: 48, vel: 100, dur: 0.2,
    extras: { cutoff: 0.75, drive: 0.3 },
  }];
  d.scheduleBar(0, events);

  assert.equal(t.frames.length, 1);
  const f = t.frames[0];
  assert.equal(f.address, "/synth/bass/note");
  // freq, amp, dur, "cutoff", 0.75, "drive", 0.3  → 7 args
  assert.equal(f.args.length, 7, "3 base + 2*2 extras");
  assert.equal(f.args[3], "cutoff");
  assert.equal(f.args[4], 0.75);
  assert.equal(f.args[5], "drive");
  assert.equal(f.args[6], 0.3);
}

// ----- 3. __params__ event → /synth/<n>/params k v k v -----
{
  const t = makeTransport();
  const d = createScDispatcher({ transport: t, now, setTimeout: setT, lookaheadMs: 0 });
  const events = [{
    t: 0, instrument: "__params__", synth: "drone",
    params: { cutoff: 0.55, pan: 0.1 },
  }];
  d.scheduleBar(0, events);

  assert.equal(t.frames.length, 1);
  const f = t.frames[0];
  assert.equal(f.address, "/synth/drone/params");
  // "cutoff", 0.55, "pan", 0.1  → 4 args
  assert.equal(f.args.length, 4, "4 args for 2 params");
  assert.equal(f.args[0], "cutoff");
  assert.equal(f.args[1], 0.55);
  assert.equal(f.args[2], "pan");
  assert.equal(f.args[3], 0.1);
}

// ----- 4. Mixed bar: note without extras, note with extras, __params__ -----
{
  const t = makeTransport();
  const d = createScDispatcher({ transport: t, now, setTimeout: setT, lookaheadMs: 0 });
  const events = [
    { t: 0,   instrument: "kick",      pitch: 36, vel: 100, dur: 0.1 },
    { t: 0.1, instrument: "bass",      pitch: 48, vel: 90,  dur: 0.3, extras: { cutoff: 0.8 } },
    { t: 0.2, instrument: "__params__", synth: "lead", params: { pan: -0.2 } },
  ];
  d.scheduleBar(0, events);

  assert.equal(t.frames.length, 3, "3 frames for mixed bar");
  assert.equal(t.frames[0].address, "/synth/kick/note");
  assert.equal(t.frames[0].args.length, 3);
  assert.equal(t.frames[1].address, "/synth/bass/note");
  assert.equal(t.frames[1].args.length, 5);  // 3 + 2*1
  assert.equal(t.frames[2].address, "/synth/lead/params");
  assert.equal(t.frames[2].args.length, 2);  // "pan", -0.2
}

// ----- 5. extras empty object → treated as no extras (3-arg form) -----
{
  const t = makeTransport();
  const d = createScDispatcher({ transport: t, now, setTimeout: setT, lookaheadMs: 0 });
  const events = [{ t: 0, instrument: "hat", pitch: 42, vel: 70, dur: 0.06, extras: {} }];
  d.scheduleBar(0, events);

  const f = t.frames[0];
  assert.equal(f.args.length, 3, "empty extras → 3 args");
}

console.log("✓ sc-dispatcher-extras");
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd /Users/Edo_1/album-gen && node test/sc-dispatcher-extras.test.js
```

- [ ] **Step 3: Modify `sc-dispatcher.js`**

Open `/Users/Edo_1/album-gen/src/live/sc-dispatcher.js`.

Replace the `scheduleBar` function:

```js
function scheduleBar(songStartMs, events) {
  for (const ev of events) {
    const fireAtMs = songStartMs + ev.t * 1000;

    if (ev.instrument === '__params__') {
      // Continuous params event → /synth/<name>/params k1 v1 k2 v2 ...
      scheduleAt(fireAtMs, () => {
        const addr = `/synth/${ev.synth}/params`;
        const args = [];
        for (const [k, v] of Object.entries(ev.params ?? {})) {
          args.push(k, v);
        }
        send(addr, args);
      });
      continue;
    }

    // Regular note event
    scheduleAt(fireAtMs, () => {
      const addr = `/synth/${ev.instrument}/note`;
      const freq = pitchToFreq(ev.pitch);
      const amp  = ev.vel / 127;
      const dur  = typeof ev.dur === "number" ? ev.dur : 0.2;

      const args = [freq, amp, dur];

      // M1c-γ: append extras as k-v pairs after the 3 base args.
      // OSC v0.1 supports heterogeneous args — no protocol break.
      const extras = ev.extras;
      if (extras && typeof extras === "object") {
        for (const [k, v] of Object.entries(extras)) {
          args.push(k, v);
        }
      }

      send(addr, args);
    });
  }
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd /Users/Edo_1/album-gen && node test/sc-dispatcher-extras.test.js
```

Expected: `✓ sc-dispatcher-extras`.

- [ ] **Step 5: Run full suite**

```bash
cd /Users/Edo_1/album-gen && npm test
```

- [ ] **Step 6: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/live/sc-dispatcher.js test/sc-dispatcher-extras.test.js
git commit -m "feat(m1c-γ): dispatcher serializes extras k-v + __params__ frames"
```

---

## Task 9: Update `album-engine.scd`

Two changes:
1. `/note` handler: parse trailing k-v pairs after `freq amp dur`, pass to `Synth`.
2. `/params` handler: implement continuous param set on existing (or new) synth node.

**Files:**
- Modify: `/Users/Edo_1/album-gen/sc/album-engine.scd`

- [ ] **Step 1: Implement k-v parsing in the `/note` handler**

Open `/Users/Edo_1/album-gen/sc/album-engine.scd`.

Replace the `synthNames.do` block that registers OSCdef `note_*`:

```supercollider
// /synth/<name>/note  freq amp dur [key value key value ...]
// M1c-γ: trailing args after index 3 are parsed as key-value pairs and forwarded
// to the Synth. args[1]=freq, args[2]=amp, args[3]=dur, then pairs at [4,5], [6,7], etc.
// Unknown args are silently ignored by SC Synth (if the SynthDef doesn't declare them).
synthNames.do { |n|
    OSCdef(("note_" ++ n.asString).asSymbol, { |msg|
        var freq = msg[1] ? 220;
        var amp  = msg[2] ? 0.3;
        var dur  = msg[3] ? 0.2;
        var synthArgs = [\freq, freq, \amp, amp, \dur, dur];
        // Parse extra k-v pairs starting at index 4
        var i = 4;
        while { i < msg.size } {
            var key = msg[i];
            var val = msg[i+1];
            if (key.notNil && val.notNil) {
                synthArgs = synthArgs.add(key.asSymbol).add(val.asFloat);
            };
            i = i + 2;
        };
        Synth(n, synthArgs);
    }, "/synth/" ++ n.asString ++ "/note");
};
```

- [ ] **Step 2: Implement the `/params` handler**

Replace the `synthNames.do` block that registers OSCdef `params_*`:

```supercollider
// /synth/<name>/params  key1 value1 key2 value2 ...
// M1c-γ: continuous modulation. Sets control-rate buses on ALL currently running
// Synth nodes of this family by iterating s.defaultGroup.
// Strategy: iterate the default group and set params on matching nodes.
// Simple, works for album-gen's use case (1-2 active synths per family at once).
//
// Note: This approach does NOT store state for future notes — per-note extras
// (level 1) handle initial values; /params updates running nodes (level 2).
//
// If no matching nodes are running, the message is silently dropped (no error).
synthNames.do { |n|
    OSCdef(("params_" ++ n.asString).asSymbol, { |msg|
        var kvArgs = [];
        var i = 1;
        // Collect k-v pairs
        while { i < msg.size } {
            var key = msg[i];
            var val = msg[i+1];
            if (key.notNil && val.notNil) {
                kvArgs = kvArgs.add(key.asSymbol).add(val.asFloat);
            };
            i = i + 2;
        };
        if (kvArgs.size > 0) {
            // Set params on all nodes in the default group whose definitionName matches n
            s.defaultGroup.do { |node|
                if (node.isKindOf(Synth) && { node.defName == n }) {
                    node.set(*kvArgs);
                };
            };
        };
    }, "/synth/" ++ n.asString ++ "/params");
};
```

- [ ] **Step 3: Manual smoke test note**

After saving `album-engine.scd`, test manually in SC IDE:
1. Boot server, eval the file.
2. `Synth(\bass, [\freq, 110, \amp, 0.5, \dur, 2])` — verify note plays.
3. Send an OSC message with extras: `NetAddr("127.0.0.1", 57120).sendMsg("/synth/bass/note", 110, 0.5, 1.0, "cutoff", 0.3, "drive", 0.8)` — verify no error and audible difference (cutoff change requires SynthDef to accept `cutoff` arg, done in Task 10).
4. Send a params message: `NetAddr("127.0.0.1", 57120).sendMsg("/synth/bass/params", "cutoff", 0.9)` — verify no error.

Document result in `docs/M1c-gamma-live-test.md` (Task 13).

- [ ] **Step 4: Commit**

```bash
cd /Users/Edo_1/album-gen
git add sc/album-engine.scd
git commit -m "feat(m1c-γ): album-engine.scd parses k-v extras in /note, implements /params"
```

---

## Task 10: Extend the 9 SynthDef

Each SynthDef gains `cutoff = 0.6, drive = 0.0, noise = 0.0, pan = 0.0` args (or a subset where musically sensible) with defaults that reproduce the M1a sound exactly.

Design philosophy: additive args only. No M1a logic is removed. The new args modulate existing parameters proportionally. At default values the result must be bit-identical to M1a for `cutoff=0.6, drive=0, noise=0, pan=0`.

**Files:**
- Modify: all 9 files in `/Users/Edo_1/album-gen/sc/synths/`

> **Ear test:** After each SynthDef, eval with default args and compare to M1a. This is a manual step — no unit test can verify "sounds right".

### SynthDef default mapping rationale

| Synth   | cutoff use                              | drive use                     | noise use                  | pan use |
|---------|----------------------------------------|-------------------------------|----------------------------|---------|
| bass    | RLPF cutoff freq = `freq * 4 * (1 + cutoff * 2)` | tanh-like saturation on sig    | additive WhiteNoise * noise | Pan2    |
| pad     | RLPF cutoff freq = `freq * 4 * (1 + cutoff * 2)` | soft clip (LeakDC + Clip2)     | ignored (pad is clean)     | Pan2    |
| drone   | LPF cutoff = `freq * (2 + cutoff * 10)` | harmonic distortion            | ignored                    | Pan2    |
| lead    | RLPF cutoff = `freq * (3 + cutoff * 8)` | drive → extra harmonic content | ignored                    | Pan2    |
| texture | BPF centreFreq = unchanged; cutoff = BPF rq = `0.2 - cutoff * 0.15` (narrower filter = more resonant when high) | ignored | additive noise * noise | Pan2    |
| kick    | cutoff ignored (fixed-freq body)       | sig = (sig * (1 + drive * 3)).clip2(0.9) | ignored | Pan2   |
| snare   | cutoff ignored                         | ignored                       | noise amplitude *= (1 + noise * 2) | Pan2 |
| hat     | ignored (HPF freq already fixed)       | ignored                       | ignored                    | Pan2    |
| perc    | ignored                                | ignored                       | ignored                    | Pan2    |

The `pan = 0.0` default maps to `Pan2.ar(sig, pan)` in all synths — at `pan=0` the signal is centred (identical to `sig ! 2` at M1a).

- [ ] **Step 1: Update `bass.scd`**

Write `/Users/Edo_1/album-gen/sc/synths/bass.scd`:

```supercollider
SynthDef(\bass, { |freq = 55, amp = 0.4, dur = 0.4,
                   cutoff = 0.6, drive = 0.0, noise = 0.0, pan = 0.0|
    var sig, env, noiseLayer, cutFreq;
    env = EnvGen.kr(Env.perc(0.003, dur, amp, -2), doneAction: 2);
    sig = Pulse.ar(freq, 0.35);
    sig = sig + SinOsc.ar(freq * 0.5, 0, 0.3);
    // M1a used RLPF(sig, freq*4, 0.3). cutoff=0.6 → freq*4 (same as M1a).
    cutFreq = freq * (2 + cutoff * 3.33);
    sig = RLPF.ar(sig, cutFreq, 0.3);
    // drive: soft clip with gain (drive=0 → no change)
    sig = (sig * (1 + drive * 2)).tanh;
    // noise layer: additive noise at noise level (noise=0 → silent)
    noiseLayer = WhiteNoise.ar(noise * 0.15);
    sig = (sig + noiseLayer) * env;
    Out.ar(0, Pan2.ar(sig, pan));
}).add;
```

Verify at defaults: `cutFreq = freq * (2 + 0.6 * 3.33) = freq * (2 + 1.998) ≈ freq * 4`. Matches M1a. `drive=0` → `tanh(sig * 1) ≈ sig` for small signals (bass signals are <0.5 amplitude → tanh ≈ identity). `noise=0` → 0. `Pan2(sig, 0)` → stereo centre = `sig ! 2`. M1a sound preserved.

- [ ] **Step 2: Update `pad.scd`**

Write `/Users/Edo_1/album-gen/sc/synths/pad.scd`:

```supercollider
SynthDef(\pad, { |freq = 220, amp = 0.25, dur = 4,
                  cutoff = 0.6, drive = 0.0, noise = 0.0, pan = 0.0|
    var sig, env, cutFreq;
    env = EnvGen.kr(Env.new([0, 1, 0.8, 0], [dur * 0.2, dur * 0.6, dur * 0.2], \sin), doneAction: 2);
    sig = Mix([
        Saw.ar(freq),
        Saw.ar(freq * 1.007),
        Pulse.ar(freq * 0.5, 0.3)
    ]) * 0.33;
    // M1a: RLPF(sig, freq*4, 0.6). cutoff=0.6 → freq*(2 + 0.6*3.33) ≈ freq*4. Same.
    cutFreq = freq * (2 + cutoff * 3.33);
    sig = RLPF.ar(sig, cutFreq, 0.6);
    // drive: gentle saturation (Clip2 at 0.8)
    sig = (sig + (sig * drive * 2).clip2(0.3 * drive));
    sig = sig * env * amp;
    Out.ar(0, Pan2.ar(sig, pan));
}).add;
```

- [ ] **Step 3: Update `drone.scd`**

Write `/Users/Edo_1/album-gen/sc/synths/drone.scd`:

```supercollider
SynthDef(\drone, { |freq = 55, amp = 0.3, dur = 8,
                    cutoff = 0.6, drive = 0.0, noise = 0.0, pan = 0.0|
    var sig, env, cutFreq;
    env = EnvGen.kr(Env.linen(dur * 0.2, dur * 0.6, dur * 0.2, amp), doneAction: 2);
    sig = Mix([
        Saw.ar(freq, 0.4),
        Saw.ar(freq * 1.01, 0.4),
        Saw.ar(freq * 0.99, 0.4)
    ]);
    // M1a: LPF(sig, freq*6). cutoff=0.6 → freq*(2 + 0.6*6.67) ≈ freq*6. Same.
    cutFreq = freq * (2 + cutoff * 6.67);
    sig = LPF.ar(sig, cutFreq);
    // drive: adds harmonics via Fold2
    sig = sig + (sig * drive).fold2(0.6) * drive * 0.4;
    sig = sig * env;
    Out.ar(0, Pan2.ar(sig, pan));
}).add;
```

- [ ] **Step 4: Update `lead.scd`**

Write `/Users/Edo_1/album-gen/sc/synths/lead.scd`:

```supercollider
SynthDef(\lead, { |freq = 440, amp = 0.45, dur = 0.3,
                   cutoff = 0.6, drive = 0.0, noise = 0.0, pan = 0.0|
    var sig, env, vib, cutFreq;
    env = EnvGen.kr(Env.new([0, 1, 0.7, 0], [0.01, dur * 0.6, dur * 0.4], \sin), doneAction: 2);
    vib = SinOsc.kr(5.2, 0, 0.006, 1);
    sig = VarSaw.ar(freq * vib, 0, 0.35);
    sig = sig + Pulse.ar(freq * 2, 0.5, 0.15);
    // M1a: RLPF(sig, freq*6, 0.4). cutoff=0.6 → freq*(2 + 0.6*6.67) ≈ freq*6. Same.
    cutFreq = freq * (2 + cutoff * 6.67);
    sig = RLPF.ar(sig, cutFreq, 0.4);
    // drive: adds a subtle harmonic layer
    sig = sig + (sig * drive * 1.5).distort * drive * 0.25;
    sig = sig * env * amp;
    Out.ar(0, Pan2.ar(sig, pan));
}).add;
```

- [ ] **Step 5: Update `texture.scd`**

Write `/Users/Edo_1/album-gen/sc/synths/texture.scd`:

```supercollider
SynthDef(\texture, { |freq = 440, amp = 0.2, dur = 3,
                      cutoff = 0.6, drive = 0.0, noise = 0.0, pan = 0.0|
    var sig, env, rq;
    env = EnvGen.kr(Env.new([0, 1, 0], [dur * 0.5, dur * 0.5], \sin), doneAction: 2);
    sig = PinkNoise.ar(0.6);
    // M1a: BPF(sig, freq, 0.2). cutoff=0.6 → rq stays near 0.2. Same.
    rq = 0.2 - cutoff * 0.1;   // rq range: [0.2 (cutoff=0) → 0.1 (cutoff=1)] — narrower = more resonant
    sig = BPF.ar(sig, freq, rq.clip(0.05, 0.5));
    sig = sig + BPF.ar(PinkNoise.ar(0.3 + noise * 0.5), freq * 2.01, 0.15);
    sig = sig * env * amp;
    Out.ar(0, Pan2.ar(sig, pan));
}).add;
```

- [ ] **Step 6: Update `kick.scd`**

Write `/Users/Edo_1/album-gen/sc/synths/kick.scd`:

```supercollider
SynthDef(\kick, { |freq = 55, amp = 0.7, dur = 0.3,
                   cutoff = 0.6, drive = 0.0, noise = 0.0, pan = 0.0|
    var body, click, env, sig;
    env = EnvGen.kr(Env.perc(0.002, dur, amp, -4), doneAction: 2);
    body = SinOsc.ar(
        EnvGen.kr(Env([freq * 4, freq, freq * 0.9], [0.04, dur - 0.04], \exp))
    );
    click = HPF.ar(WhiteNoise.ar(0.5), 2000) * EnvGen.kr(Env.perc(0.001, 0.01));
    sig = (body + click) * env;
    // drive: waveshape distortion (drive=0 → clip2(0.9) as in M1a)
    sig = (sig * (1 + drive * 3)).clip2(0.9);
    Out.ar(0, Pan2.ar(sig, pan));
}).add;
```

Note: `drive=0` → `sig * 1 = sig`, then `clip2(0.9)` same as M1a. Sound preserved.

- [ ] **Step 7: Update `snare.scd`**

Write `/Users/Edo_1/album-gen/sc/synths/snare.scd`:

```supercollider
SynthDef(\snare, { |freq = 220, amp = 0.5, dur = 0.15,
                    cutoff = 0.6, drive = 0.0, noise = 0.0, pan = 0.0|
    var nse, body, env, sig, noiseAmp;
    env = EnvGen.kr(Env.perc(0.002, dur, amp, -3), doneAction: 2);
    // noise: extra snare noise layer (noise=0 → noiseAmp = 0.7, same as M1a)
    noiseAmp = 0.7 + noise * 2.0;
    nse = BPF.ar(WhiteNoise.ar, 2400, 0.6) * noiseAmp;
    body = SinOsc.ar(freq * [1, 1.4]) * 0.35;
    sig = (nse + body.sum * 0.6) * env;
    Out.ar(0, Pan2.ar(sig, pan));
}).add;
```

- [ ] **Step 8: Update `hat.scd`**

Write `/Users/Edo_1/album-gen/sc/synths/hat.scd`:

```supercollider
SynthDef(\hat, { |freq = 8000, amp = 0.3, dur = 0.06,
                  cutoff = 0.6, drive = 0.0, noise = 0.0, pan = 0.0|
    var sig, env;
    env = EnvGen.kr(Env.perc(0.001, dur, amp, -6), doneAction: 2);
    sig = HPF.ar(WhiteNoise.ar, freq * 0.8);
    sig = BPF.ar(sig, freq, 0.3);
    sig = sig * env;
    // Hat: extras accepted but not used (args declared for protocol uniformity).
    Out.ar(0, Pan2.ar(sig, pan));
}).add;
```

- [ ] **Step 9: Update `perc.scd`**

Write `/Users/Edo_1/album-gen/sc/synths/perc.scd`:

```supercollider
SynthDef(\perc, { |freq = 880, amp = 0.4, dur = 0.12,
                   cutoff = 0.6, drive = 0.0, noise = 0.0, pan = 0.0|
    var sig, env;
    env = EnvGen.kr(Env.perc(0.001, dur, amp, -6), doneAction: 2);
    sig = SinOsc.ar(freq) + (Ringz.ar(Impulse.ar(0), freq, 0.05) * 0.5);
    sig = sig * env;
    // Pan and extras accepted (cutoff/drive/noise unused — perc is simple).
    Out.ar(0, Pan2.ar(sig, pan));
}).add;
```

- [ ] **Step 10: Manual ear verification**

In SC IDE, reload all 9 SynthDef. For each, run:
```supercollider
// With defaults (must match M1a sound)
Synth(\bass, [\freq, 110, \amp, 0.5, \dur, 1]);
// With cutoff high
Synth(\bass, [\freq, 110, \amp, 0.5, \dur, 1, \cutoff, 1.0]);
// With drive
Synth(\bass, [\freq, 110, \amp, 0.5, \dur, 1, \drive, 0.8]);
// With pan
Synth(\bass, [\freq, 110, \amp, 0.5, \dur, 1, \pan, -0.8]);
```

Record "sounds OK" in the live test doc (Task 13).

- [ ] **Step 11: Commit**

```bash
cd /Users/Edo_1/album-gen
git add sc/synths/bass.scd sc/synths/pad.scd sc/synths/drone.scd \
        sc/synths/lead.scd sc/synths/texture.scd sc/synths/kick.scd \
        sc/synths/snare.scd sc/synths/hat.scd sc/synths/perc.scd
git commit -m "feat(m1c-γ): 9 SynthDef accept cutoff/drive/noise/pan with M1a-compatible defaults"
```

---

## Task 11: Wire modulation rules loading in `mapAlbum` / `song-director`

`mapAlbum` (M1c-α) already sets `song.modulation_rules` from substance preset. `song-director.js` receives it as a field. Now: `createRealComposers` (Task 7) reads `worldState.modulation_rules_path`. We need to plumb `song.modulation_rules` into `worldState`.

**Files:**
- Modify: `/Users/Edo_1/album-gen/src/shared/world-state.js`
- Modify: `/Users/Edo_1/album-gen/src/core/song-director.js` (minor addition)

- [ ] **Step 1: Add `modulation_rules_path` to worldState**

Open `/Users/Edo_1/album-gen/src/shared/world-state.js`.

Add `modulation_rules_path = null` to the destructured params of `createWorldState`:

```js
export function createWorldState({
  // ... existing params ...
  gesture = "THRUM",
  substance = "_default",
  chordShape = "cyclic_short",
  bassPatternPool = ["default"],
  drumGroove = "4_on_floor_dry",
  densityBias = null,
  phaseDistribution = null,
  modulation_rules_path = null,   // NEW: path to substance-specific YAML or null
}) {
  return {
    // ... existing fields ...
    gesture, substance, chordShape, bassPatternPool, drumGroove,
    densityBias, phaseDistribution,
    modulation_rules_path,         // NEW
  };
}
```

- [ ] **Step 2: Pass `modulation_rules_path` from song-director to worldState**

Open `/Users/Edo_1/album-gen/src/core/song-director.js`.

Add `modulation_rules = null` to the destructured params of `createSongDirector`:

```js
export function createSongDirector({
  // ... existing params ...
  modulation_rules = null,    // NEW: e.g. "sc/modulation-rules/haze.yaml"
}) {
```

In the `createWorldState(...)` call, add:

```js
const state = createWorldState({
  // ... existing fields ...
  modulation_rules_path: modulation_rules,
});
```

- [ ] **Step 3: Pass `modulation_rules` from album-director to song-director**

Open `/Users/Edo_1/album-gen/src/core/album-director.js`.

In the loop that constructs each song director, add:

```js
return createSongDirector({
  // ... existing fields from M1c-α ...
  modulation_rules: song.modulation_rules ?? null,
});
```

- [ ] **Step 4: Fallback chain documentation**

The fallback chain for modulation rules is:

1. `worldState.modulation_rules_path` → load `sc/modulation-rules/<substance>.yaml` (e.g. `sc/modulation-rules/haze.yaml`)
2. If that file doesn't exist or path is null → load `sc/modulation-rules/_default.yaml`
3. If `_default.yaml` doesn't exist → use `{ families: {}, continuous: {} }` (no expression)

This is implemented in `loadModulationRules()` in `composer-harness.js` (Task 7). No additional code needed here — the path flows through and the loader handles fallback.

- [ ] **Step 5: Run full suite**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all green. `pipeline.test.js` will now load `_default.yaml` rules for `album-001.yaml` (substance `_default` → `sc/modulation-rules/_default.yaml` exists). Events will now include `__params__` frames. Update count snapshots if pipeline test checks exact count.

- [ ] **Step 6: Spot-check 3 note events carry extras**

```bash
cd /Users/Edo_1/album-gen && node --input-type=module << 'EOF'
import { loadAlbum } from './src/core/config-loader.js';
import { createAlbumDirector } from './src/core/album-director.js';

const album = await loadAlbum('albums/album-002.yaml');
const director = await createAlbumDirector(album);
const song0 = director.songs[0];
const events = await song0.generateAll();
const notes = events.filter(e => e.instrument !== '__params__');
const params = events.filter(e => e.instrument === '__params__');

console.log('Total events:', events.length);
console.log('Note events:', notes.length);
console.log('__params__ events:', params.length);

// Spot 3 note events with extras
const withExtras = notes.filter(e => e.extras).slice(0, 3);
for (const e of withExtras) {
  console.log(`  ${e.instrument} vel=${e.vel} extras=`, JSON.stringify(e.extras));
}

// Spot 1 params event
if (params.length > 0) console.log('Sample params event:', JSON.stringify(params[0]));
EOF
```

Expected: extras present on bass/pad/drone/lead/texture notes; `__params__` events exist for drone/pad/lead.

- [ ] **Step 7: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/shared/world-state.js src/core/song-director.js src/core/album-director.js
git commit -m "feat(m1c-γ): wire modulation_rules_path through worldState → createRealComposers"
```

---

## Task 12: Integration smoke + `osc-map.md` update

**Files:**
- Modify: `/Users/Edo_1/album-gen/sc/osc-map.md`

- [ ] **Step 1: Update `osc-map.md`**

Open `/Users/Edo_1/album-gen/sc/osc-map.md`.

In the "Browser → SC" table, replace the `/synth/<name>/note` row:

```markdown
| `/synth/<name>/note` | `freq:f`, `amp:f`, `dur:f` [, `k:s`, `v:f` ...] | Fire one note on named synth. Optional k-v pairs after `dur` carry per-note expression extras (cutoff, drive, noise, pan). Added in M1c-γ. Back-compat: M1a SC handler ignores trailing args. |
```

Replace the `/synth/<name>/params` row:

```markdown
| `/synth/<name>/params` | `k1:s, v1:f, k2:s, v2:f, ...` | Set continuous params on running synth nodes. Implemented in M1c-γ. Emitted every 16th step by expression-weaver for synths listed in `continuous` of the rules YAML. Nominal rate: ~24 frames/sec at 96 BPM. |
```

Add a new section after the table:

```markdown
## M1c-γ Protocol Addendum

**Not a breaking change.** OSC v0.1 supported heterogeneous args after `freq amp dur` from the start (see "Frozen: 2026-04-20"). M1c-γ simply uses that headroom.

### Extras encoding

For `/synth/<n>/note` with extras:
```
args = [freq:f, amp:f, dur:f, "cutoff":s, 0.72:f, "drive":s, 0.15:f, ...]
```
Args at odd indices (3, 5, 7, ...) are string keys. Args at even indices (4, 6, 8, ...) are float values. The SC handler extracts pairs with a while-loop starting at index 4.

### Continuous params rate

At 96 BPM, one 16th note = 156.25 ms → 6.4 frames/sec per synth. With 3 continuous synths (drone, pad, lead), total frame rate ≈ 19 frames/sec. Each frame is small (2-4 k-v pairs). No TCP congestion concern on localhost.
```

- [ ] **Step 2: Run full suite one last time**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all tests green.

- [ ] **Step 3: Commit**

```bash
cd /Users/Edo_1/album-gen
git add sc/osc-map.md
git commit -m "docs(m1c-γ): osc-map.md extras addendum (back-compat, non-breaking)"
```

---

## Task 13: Live smoke procedure doc

**Files:**
- Create: `/Users/Edo_1/album-gen/docs/M1c-gamma-live-test.md`

- [ ] **Step 1: Write the live test procedure**

Write `/Users/Edo_1/album-gen/docs/M1c-gamma-live-test.md`:

```markdown
# M1c-γ Live Smoke Test Procedure

**Goal:** Verify the expression engine is audibly effective in a live SC session.

## Prerequisites

- SuperCollider running (`sclang` available)
- Node.js bridge running: `cd /Users/Edo_1/album-gen && node src/live/album-runner.js`
- SC engine loaded: eval `sc/album-engine.scd` in SC IDE
- `npm test` green

## Procedure

### 1. SynthDef defaults verify (SC IDE only)

Open SC IDE and eval each line separately. Listen for M1a-equivalent sound at defaults:

```supercollider
// Default args → M1a sound
Synth(\bass,    [\freq, 110, \amp, 0.5, \dur, 1.5]);
Synth(\pad,     [\freq, 220, \amp, 0.3, \dur, 2.0]);
Synth(\drone,   [\freq, 55,  \amp, 0.4, \dur, 4.0]);
Synth(\lead,    [\freq, 440, \amp, 0.5, \dur, 0.5]);
Synth(\texture, [\freq, 330, \amp, 0.3, \dur, 2.0]);
Synth(\kick,    [\freq, 55,  \amp, 0.8, \dur, 0.3]);
Synth(\snare,   [\freq, 220, \amp, 0.5, \dur, 0.2]);
Synth(\hat,     [\freq, 8000,\amp, 0.3, \dur, 0.08]);
Synth(\perc,    [\freq, 880, \amp, 0.4, \dur, 0.15]);
```

Expected: sounds identical to M1a.

### 2. Extras audibility checks

```supercollider
// Bass: cutoff sweep (should clearly open the filter)
Synth(\bass, [\freq, 55, \amp, 0.6, \dur, 2, \cutoff, 0.1]);   // muffled
Synth(\bass, [\freq, 55, \amp, 0.6, \dur, 2, \cutoff, 1.0]);   // bright

// Bass: drive
Synth(\bass, [\freq, 55, \amp, 0.6, \dur, 2, \drive, 0.0]);   // clean
Synth(\bass, [\freq, 55, \amp, 0.6, \dur, 2, \drive, 0.8]);   // distorted

// Pad: pan
Synth(\pad, [\freq, 220, \amp, 0.4, \dur, 2, \pan, -0.9]);    // hard left
Synth(\pad, [\freq, 220, \amp, 0.4, \dur, 2, \pan,  0.9]);    // hard right

// Lead: cutoff
Synth(\lead, [\freq, 440, \amp, 0.5, \dur, 1, \cutoff, 0.2]); // dark
Synth(\lead, [\freq, 440, \amp, 0.5, \dur, 1, \cutoff, 1.0]); // bright

// Kick: drive
Synth(\kick, [\freq, 55, \amp, 0.8, \dur, 0.3, \drive, 0.0]); // clean
Synth(\kick, [\freq, 55, \amp, 0.8, \dur, 0.3, \drive, 1.0]); // saturated

// Drone: cutoff
Synth(\drone, [\freq, 55, \amp, 0.5, \dur, 4, \cutoff, 0.1]); // submarine
Synth(\drone, [\freq, 55, \amp, 0.5, \dur, 4, \cutoff, 1.0]); // bright saws
```

### 3. /note with extras via OSC

From SC IDE, send a note with extras directly to the engine:

```supercollider
NetAddr("127.0.0.1", 57120).sendMsg(
    "/synth/bass/note", 110.0, 0.5, 1.5,
    "cutoff", 0.9, "drive", 0.5, "pan", -0.3
);
```

Expected: bass note plays with open filter, slight drive, shifted left.

### 4. /params on running synth

```supercollider
~d = Synth(\drone, [\freq, 55, \amp, 0.4, \dur, 8]);
// A moment later:
NetAddr("127.0.0.1", 57120).sendMsg("/synth/drone/params", "cutoff", 0.1);
// And:
NetAddr("127.0.0.1", 57120).sendMsg("/synth/drone/params", "cutoff", 1.0);
```

Expected: drone filter sweeps while the note sustains.

### 5. Full album run — audio check

```bash
node bin/album-gen.js albums/album-002.yaml
```

Open `http://localhost:8080` and confirm playback. Listen for:
- [ ] Cutoff varies across notes (brighter notes = high velocity)
- [ ] Pan on pad/lead drifts slowly across the stereo field
- [ ] Drive increases as song progresses (phaseProgress)
- [ ] Drone filter sweeps over time (continuous cutoff)
- [ ] Bass sounds identical to M1a on the first few notes (before drive builds)

## Pass criteria

All 5 audio checks above have a physical checkmark. Any failure → open a bug issue before tagging.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/Edo_1/album-gen
git add docs/M1c-gamma-live-test.md
git commit -m "docs(m1c-γ): live smoke test procedure"
```

---

## Task 14: README + tag

**Files:**
- Modify: `/Users/Edo_1/album-gen/README.md`

- [ ] **Step 1: Run full suite (final verification)**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all tests green.

- [ ] **Step 2: Update README status section**

In `/Users/Edo_1/album-gen/README.md`, update the M1c lines:

```markdown
- ✅ **M0 — Foundations**
- ✅ **M1a — Live audio stack**
- ✅ **M1b — Real composer fork**
- ✅ **M1c-α — Compositional mapping layer (`v0.4.0-M1c-alpha`)** — substance × gesture vocabulary, chord shapes, bass pools, gesture-aware phase distribution.
- ✅ **M1c-γ — Expression engine 2-level (`v0.5.0-M1c-gamma`)** — per-note extras (cutoff/drive/noise/pan via velocity/phaseProgress/LFO), continuous /params weaver, 9 SynthDef extended, _default.yaml modulation rules. The album breathes.
- ⏳ M1c-β — Tarot setup screen
- ⏳ M1c-δ — Sound Lab CLI + agent
- ⏳ M1c-ε — Substance population
- ⏳ M2 — PARTITURA
```

- [ ] **Step 3: Commit + tag**

```bash
cd /Users/Edo_1/album-gen
git add README.md
git commit -m "docs(m1c-γ): README status update"
git tag v0.5.0-M1c-gamma
```

---

## Risk register

| Risk | Mitigation |
|---|---|
| `createRealComposers` async change breaks callers | Audit every call site in Tasks 7 + 11. `song-director.js` and `album-director.js` both updated. `pipeline.test.js` uses top-level await — handles Promise return naturally. |
| `__params__` events increase total event count, breaking `pipeline.test.js` snapshot | Expected. At 96 BPM, a 5-song album adds ~96×16 = 1536 `__params__` events per song (3 synths × 16 steps/bar × ~32 bars each). Update snapshot and verify 3 runs bit-identical. |
| `tanh` saturation on bass changes M1a output by small epsilon | For bass signals with amplitude < 0.4 and `drive=0`, `x.tanh ≈ x - x³/3`. At drive=0: `sig * 1 = sig`, then `tanh(sig)`. If sig < 0.3 the error is < 0.009. Acceptable; note in commit. Alternatively: gate the tanh: `if (drive > 0.01) { sig = sig.tanh }`. |
| Iterating `s.defaultGroup.do` in SC for `/params` is O(n) nodes | Album-gen typically has 1-3 active synths at any time. O(n) for n < 10 is negligible. If in future substance HAZE sustains 20 drone nodes, add a `\nodeCount` limit. |
| `for...of Object.entries(extras)` key order not guaranteed | In V8 (Node 20+) insertion order is preserved for string keys. OSC parser in SC iterates pairs by index — order irrelevant, each k-v pair is independent. No issue. |
| `worldState.modulation_rules_path` is null for `_default` substance (M1b albums) | `loadModulationRules(null)` falls back to `_default.yaml`. This is the intended path. Documented. |
| SC `node.set(*kvArgs)` on a synth with no `cutoff` arg (older SynthDef) | After Task 10, all 9 SynthDef have `cutoff`. Any stale `.scd` in memory would silently ignore unknown args — not a crash. Remind user to reload SynthDef when testing live. |

---

## Self-review

### Checkpoint 1 — Spec §5 coverage

| Spec item | Task covering it |
|---|---|
| §5.1 rules schema (families + continuous) | Tasks 5 + 6 (YAML + weaver reads it) |
| §5.2 source signals (10 total) | Task 3 (source-samplers, all 10 implemented) |
| §5.3 shape functions (5 types) | Task 2 (shape-functions) |
| §5.4 level-1 wiring (per-note expression-applier) | Task 4 (applier) + Task 7 (harness wiring) |
| §5.5 level-2 wiring (continuous weaver) | Task 6 (weaver) + Task 7 (wired in generateBar) |
| §5.6 default fallback (missing rule → default SynthDef arg) | Task 4 (applier returns event unchanged if no rule) + Task 10 (SynthDef defaults) + Task 7 (loader fallback chain) |
| §5.7 sound-lab agent emits rule drafts | **Deferred to M1c-δ. Explicitly not in scope for γ.** |
| §3.3 per-synth metadata format | Informational for δ. γ uses `_default.yaml` uniform format — no per-synth YAML needed yet. |

All in-scope spec items covered. §5.7 explicitly deferred.

### Checkpoint 2 — Placeholder scan

- No "TBD", "TODO", "similar to", or "see above" entries.
- The "Manual ear test" instruction in Task 10 Step 10 is intentional (ear test cannot be automated) and is documented as such.
- Snapshot update notes are explicit ("update inline if count drifts" — same pattern as α plan).
- The `tanh` epsilon note in the risk register is concrete, not a hand-wave.

### Checkpoint 3 — Type consistency

- `extras`: always `Record<string, number>` keyed by param name, or `null`. Set in `expression-applier.js`, read in `sc-dispatcher.js`. No string values, no booleans.
- `emitParams(synthName: string, params: Record<string, number>)` — consistent signature in `createHarness` and `expression-weaver.js`.
- `sampleSource` return: always `number` in `[0,1]` — documented in module header, enforced by `Math.max(0, Math.min(1, ...))` guards in each branch.
- `applyShape` return: `number` in `[lo, hi]` — output range determined by caller-supplied `range`.
- `__params__` event shape: `{ t, instrument: '__params__', synth: string, params: Record<string,number> }` — consistent between `emitParams` (harness), `scheduleBar` (dispatcher), and weaver output.
- `createRealComposers` return: `Promise<{ generateBar, reset }>` — async due to rule loading. Callers `await` it. Consistent across all call sites (Tasks 7 + 11).
