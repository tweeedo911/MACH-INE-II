# album-gen M1c-α — Compositional Mapping Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace M1b's hardcoded `DEFAULT_TRACK_DEF` (which made all 5 album songs sound essentially the same) with a vocabulary-driven mapping layer where SUBSTANCE × GESTURE produces real per-song variation in BPM, chord progression, bass pattern, drum groove, register, and phase distribution. After M1c-α, a hand-edited `album-002.yaml` declaring per-song `gesture` and `substance` produces 5 audibly distinct songs through SC.

**Architecture:** Add a new `src/mapping/` layer with YAML preset files (substance, gesture, arc, chord-shape) and a pure-function `mapAlbum(setup) → albumYaml` mapper. Extend the M1b composers (`harmony.js`, `bass-v3.js`) to read mode-relative chord shapes and bass pattern pools instead of hardcoded MIDI. Extend `phase-map.js` to factor in gesture-specific phase distributions. Extend `song-director.js` to apply per-song density bias, rhythm grid, register, and chord shape. Extend `config-loader.js` with `applyM1cDefaults()` for backward compatibility with M1b YAML.

**Tech Stack:** Same as M1b. Node.js 20+, ES modules, zero-build. New runtime dep: `js-yaml` already present in package.json.

**Reference spec:** [2026-04-25-album-gen-M1c-design.md](../specs/2026-04-25-album-gen-M1c-design.md), Section 4.

**Dependencies:** Assumes M1b is merged at `v0.3.0-M1b` (commit `618af53`). `npm test` green. M1c-α touches no SC code, no UI — strictly compositional engine extension.

**Non-goals for α:**
- No tarot UI (β).
- No expression engine / SynthDef extras (γ).
- No sound-lab (δ).
- No SynthDef changes — uses M1a's 9 default synths (`sc/synths/*.scd`).
- No live smoke test mandatory (compositional changes are unit-testable; live ascolto deferred to β when UI exists).

---

## File Structure

All paths relative to `/Users/Edo_1/album-gen/`.

**New files:**

```
src/mapping/
├── substance-presets.yaml          # 6 substances + _default fallback
├── gesture-presets.yaml            # 6 gestures
├── arc-presets.yaml                # 4 arc presets
├── chord-shapes.yaml               # 6 chord shapes (mode-relative)
├── presets-loader.js               # YAML loader + schema validation
├── chord-shape-engine.js           # builds chord MIDI from shape + scale + root
├── bass-pattern-pool.js            # 16-step pattern templates per gesture pool
└── mapper.js                       # mapAlbum(setup) → albumYaml

test/
├── mapping-presets-loader.test.js
├── mapping-chord-shape.test.js
├── mapping-bass-pool.test.js
├── mapping-mapper.test.js
└── mapping-m1c-integration.test.js
```

**Modified files:**

- `src/composers/harmony.js` — replace `trackData.chords` with chord-shape engine reading `worldState.chordShape` + `worldState.scale` + `worldState.root`
- `src/composers/bass-v3.js` — replace `trackData.bassPattern` with seed-driven pick from `worldState.bassPatternPool`
- `src/shared/phase-map.js` — extend `mapPhase(role, phaseProgress, gesture?)` so gesture optional 3rd arg overrides role-only mapping
- `src/shared/world-state.js` — extend with `chordShape`, `bassPatternPool`, `gesture`, `substance` fields
- `src/core/song-director.js` — accept new song-level fields from yaml, apply density_bias (additive or interpolated), populate worldState fields
- `src/core/config-loader.js` — add `applyM1cDefaults()` after parse
- `package.json` — version bump to `0.4.0-M1c-alpha`

**Not touched:** `composer-harness.js` (Task 11 wiring still works), `melody-v3.js`, `texture.js`, `rhythm.js` (rhythm grid is pre-populated by song-director from gesture preset), `live/`, `sc/`.

---

## Contract changes

### Per-song fields added to album.yaml

```yaml
songs:
  - id: opener
    role: opener
    duration_sec: 250
    intensity: 0.35
    seed: 0x4A3F
    gesture: DRIFT          # NEW (optional; defaults to THRUM)
    substance: HAZE         # NEW (optional; defaults to album_setup.substance or _default)
    bpm: 53                 # NEW (optional; if absent, derived from global.bpm * gesture.bpm_scale)
```

### worldState extensions (additive, default-safe)

```js
{
  // ... M1b fields unchanged ...
  gesture: 'THRUM',                        // NEW
  substance: '_default',                   // NEW
  chordShape: 'cyclic_short',              // NEW (replaces hardcoded chord progression)
  bassPatternPool: ['default'],            // NEW (replaces hardcoded bassPattern)
  drumGroove: '4_on_floor_dry',            // NEW (informational; rhythm.js doesn't use yet)
  // rhythmGrid: already in worldState (M1b), now populated from gesture preset
}
```

### Backward compatibility

- `album-001.yaml` (M0/M1a/M1b) without `album_setup` / per-song `gesture`/`substance` → loads with `_default` substance + `THRUM` gesture, M1b-equivalent behaviour.
- `pipeline.test.js` deterministic-three-runs continues to pass.
- `song-director.test.js` Test 6 (intensity monotonicity) continues to pass because `density_bias` is additive on top of `seedBudgetsFromIntensity`, monotonicity preserved.

---

## Task 1: Repo bump + scaffold mapping/ directory

**Files:**
- Modify: `/Users/Edo_1/album-gen/package.json`
- Create: `/Users/Edo_1/album-gen/src/mapping/`

- [ ] **Step 1: Bump version in package.json**

Modify `/Users/Edo_1/album-gen/package.json` — change only `version` and `description`:

```json
{
  "version": "0.4.0-M1c-alpha",
  "description": "Generative 5-song album tool (M1c-α: compositional mapping layer)"
}
```

Leave deps, scripts, engines untouched.

- [ ] **Step 2: Create scaffold directory**

```bash
mkdir -p /Users/Edo_1/album-gen/src/mapping
```

- [ ] **Step 3: Verify M1b suite still green on the new branch**

Run: `cd /Users/Edo_1/album-gen && npm test`
Expected: 16/16 test files green (M1b state).

- [ ] **Step 4: Commit**

```bash
cd /Users/Edo_1/album-gen
git add package.json src/mapping/
# (empty dir won't commit; add a .gitkeep if needed; otherwise wait for Task 2 file to commit)
# Actually skip src/mapping for now — Task 2 will add the first file in there.
git commit -m "chore(m1c-α): bump to 0.4.0-M1c-alpha"
```

---

## Task 2: Substance preset YAML + loader

**Files:**
- Create: `/Users/Edo_1/album-gen/src/mapping/substance-presets.yaml`
- Create: `/Users/Edo_1/album-gen/src/mapping/presets-loader.js`
- Create: `/Users/Edo_1/album-gen/test/mapping-presets-loader.test.js`

- [ ] **Step 1: Write the failing test for substance loader**

Write `/Users/Edo_1/album-gen/test/mapping-presets-loader.test.js`:

```js
import { loadSubstancePresets, loadGesturePresets, loadArcPresets, loadChordShapes } from "../src/mapping/presets-loader.js";
import assert from "node:assert/strict";

// 1. Substances: 6 named + _default
const substances = await loadSubstancePresets();
const expectedSubs = ["GRIT", "BRINE", "ORE", "HAZE", "JOLT", "LOAM", "_default"];
for (const name of expectedSubs) {
  assert.ok(substances[name], `substance ${name} missing`);
  assert.ok(substances[name].register, `${name}.register missing`);
  assert.ok(substances[name].register.bass, `${name}.register.bass missing`);
}

// 2. Each substance has the 5 register fields
for (const name of expectedSubs) {
  const reg = substances[name].register;
  for (const role of ["bass", "chords", "melody", "lead", "arp"]) {
    assert.ok(Array.isArray(reg[role]), `${name}.register.${role} not array`);
    assert.equal(reg[role].length, 2, `${name}.register.${role} not [lo, hi]`);
    assert.ok(reg[role][0] < reg[role][1], `${name}.register.${role} bad order`);
  }
}

console.log("✓ substance-presets-loader");
```

- [ ] **Step 2: Run — expect FAIL (module missing)**

Run: `cd /Users/Edo_1/album-gen && node test/mapping-presets-loader.test.js`
Expected: cannot find module.

- [ ] **Step 3: Write substance presets YAML**

Write `/Users/Edo_1/album-gen/src/mapping/substance-presets.yaml`:

```yaml
# 6 substances + _default fallback for backward-compat with M1b yaml.
# Each substance defines TIMBRE only: register, palette intent, synth dir, modulation rules path.
# Compositional structure (BPM, chord, bass, drum) lives in gesture-presets.yaml.

GRIT:
  poetic: "grana fine, attacchi corti, secco, pulviscolo"
  register:
    bass:   [36, 55]
    chords: [60, 80]
    melody: [72, 90]
    lead:   [78, 96]
    arp:    [60, 84]
  palette_intensity: percussive
  synth_dir: sc/synths/grit/
  modulation_rules: sc/modulation-rules/grit.yaml

BRINE:
  poetic: "salmastro viscoso, lunghe maree"
  register:
    bass:   [24, 50]
    chords: [55, 72]
    melody: [62, 84]
    lead:   [70, 92]
    arp:    [60, 84]
  palette_intensity: fluid
  synth_dir: sc/synths/brine/
  modulation_rules: sc/modulation-rules/brine.yaml

ORE:
  poetic: "minerale grezzo, risonanze fredde"
  register:
    bass:   [32, 52]
    chords: [55, 72]
    melody: [67, 84]
    lead:   [72, 90]
    arp:    [60, 80]
  palette_intensity: metallic
  synth_dir: sc/synths/ore/
  modulation_rules: sc/modulation-rules/ore.yaml

HAZE:
  poetic: "foschia, velature, spazio"
  register:
    bass:   [24, 48]
    chords: [55, 75]
    melody: [60, 84]
    lead:   [72, 96]
    arp:    [60, 84]
  palette_intensity: ambient
  synth_dir: sc/synths/haze/
  modulation_rules: sc/modulation-rules/haze.yaml

JOLT:
  poetic: "scarica, attacco duro"
  register:
    bass:   [30, 52]
    chords: [55, 72]
    melody: [70, 90]
    lead:   [76, 96]
    arp:    [60, 84]
  palette_intensity: aggressive
  synth_dir: sc/synths/jolt/
  modulation_rules: sc/modulation-rules/jolt.yaml

LOAM:
  poetic: "terra grassa, caldo organico"
  register:
    bass:   [28, 50]
    chords: [55, 72]
    melody: [60, 80]
    lead:   [67, 88]
    arp:    [60, 80]
  palette_intensity: warm
  synth_dir: sc/synths/loam/
  modulation_rules: sc/modulation-rules/loam.yaml

# Fallback for backward-compat: maps to M1a minimal synths.
_default:
  poetic: "default — M1a minimal synths"
  register:
    bass:   [36, 55]
    chords: [55, 72]
    melody: [67, 84]
    lead:   [72, 96]
    arp:    [60, 84]
  palette_intensity: neutral
  synth_dir: sc/synths/_shared/
  modulation_rules: sc/modulation-rules/_default.yaml
```

- [ ] **Step 4: Implement substance preset loader**

Write `/Users/Edo_1/album-gen/src/mapping/presets-loader.js`:

```js
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const HERE = dirname(fileURLToPath(import.meta.url));

async function readYaml(name) {
  const path = resolve(HERE, name);
  const text = await readFile(path, "utf8");
  return yaml.load(text);
}

export async function loadSubstancePresets() {
  return readYaml("substance-presets.yaml");
}

export async function loadGesturePresets() {
  return readYaml("gesture-presets.yaml");
}

export async function loadArcPresets() {
  return readYaml("arc-presets.yaml");
}

export async function loadChordShapes() {
  return readYaml("chord-shapes.yaml");
}
```

- [ ] **Step 5: Run substance test — expect PASS**

Run: `cd /Users/Edo_1/album-gen && node test/mapping-presets-loader.test.js`
Expected: `✓ substance-presets-loader`.

(Note: gesture/arc/chord tests added in subsequent tasks — current test only checks substances.)

- [ ] **Step 6: Run full suite**

Run: `cd /Users/Edo_1/album-gen && npm test`
Expected: 17/17 green (M1b 16 + new mapping-presets-loader).

- [ ] **Step 7: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/mapping/substance-presets.yaml src/mapping/presets-loader.js test/mapping-presets-loader.test.js
git commit -m "feat(m1c-α): substance presets YAML + loader"
```

---

## Task 3: Gesture preset YAML

**Files:**
- Create: `/Users/Edo_1/album-gen/src/mapping/gesture-presets.yaml`
- Modify: `/Users/Edo_1/album-gen/test/mapping-presets-loader.test.js`

- [ ] **Step 1: Extend the loader test for gestures**

Modify `/Users/Edo_1/album-gen/test/mapping-presets-loader.test.js` — append at the end (before the final `console.log`):

```js
// 3. Gestures: 6 named, each with required fields
const gestures = await loadGesturePresets();
const expectedGestures = ["THRUM", "DRIFT", "RIVEN", "LOOM", "CREST", "FAULT"];
for (const name of expectedGestures) {
  const g = gestures[name];
  assert.ok(g, `gesture ${name} missing`);
  assert.equal(typeof g.bpm_scale, "number", `${name}.bpm_scale not number`);
  assert.ok(g.bpm_scale > 0 && g.bpm_scale < 3, `${name}.bpm_scale out of range`);
  assert.ok(g.density_bias, `${name}.density_bias missing`);
  assert.ok(typeof g.chord_shape === "string", `${name}.chord_shape not string`);
  assert.ok(Array.isArray(g.bass_pattern_pool), `${name}.bass_pattern_pool not array`);
  assert.ok(g.phase_distribution, `${name}.phase_distribution missing`);
  // phase distribution sums close to 1
  const sum = Object.values(g.phase_distribution).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 0.01, `${name}.phase_distribution sum=${sum} not ≈1`);
  assert.ok(typeof g.song_duration_weight === "number", `${name}.song_duration_weight not number`);
}
```

(Then ensure the `console.log("✓ ...")` at the end summarises both checks; e.g. change message to `"✓ presets-loader (substances + gestures)"`.)

- [ ] **Step 2: Run — expect FAIL (gestures yaml missing)**

Run: `node test/mapping-presets-loader.test.js`
Expected: ENOENT or similar from yaml load.

- [ ] **Step 3: Write gesture-presets.yaml**

Write `/Users/Edo_1/album-gen/src/mapping/gesture-presets.yaml`:

```yaml
# 6 gestures. Each defines STRUCTURE: bpm scale, density bias, rhythm grid,
# chord shape (string ref to chord-shapes.yaml), bass pattern pool (string refs
# to bass-pattern-pool.js definitions), drum groove (informational), phase
# distribution (must sum to 1), song duration weight.

THRUM:
  poetic: "ronzio pulsante continuo"
  bpm_scale: 1.00
  density_bias:
    rhythm:  0.15
    bass:    0.10
    melody: -0.10
    texture: -0.10
  rhythm_grid: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]
  chord_shape: cyclic_short
  bass_pattern_pool: [thrum_a, thrum_b, thrum_c]
  drum_groove: 4_on_floor_dry
  phase_distribution:
    germoglio:    0.05
    pulsazione:   0.30
    densita:      0.50
    rottura:      0.10
    dissoluzione: 0.05
  song_duration_weight: 1.0

DRIFT:
  poetic: "alla deriva, no pulse"
  bpm_scale: 0.55
  density_bias:
    rhythm:  -0.40
    harmony:  0.20
    bass:    -0.30
    texture:  0.30
  rhythm_grid: null
  chord_shape: shifting_triads
  bass_pattern_pool: [drone_low, drone_low_oct]
  drum_groove: silence
  phase_distribution:
    germoglio:    0.30
    pulsazione:   0.40
    densita:      0.20
    rottura:      0.05
    dissoluzione: 0.05
  song_duration_weight: 1.4

RIVEN:
  poetic: "spaccato, interrotto"
  bpm_scale: 0.95
  density_bias:
    rhythm:  0.20
    melody:  0.15
    texture: 0.15
  rhythm_grid: [1,1,0,0, 0,1,1,0, 1,0,0,1, 0,0,1,0]
  chord_shape: fragmented
  bass_pattern_pool: [riven_stab, riven_silent]
  drum_groove: scatter
  phase_distribution:
    germoglio:    0.05
    pulsazione:   0.20
    densita:      0.30
    rottura:      0.40
    dissoluzione: 0.05
  song_duration_weight: 0.9

LOOM:
  poetic: "telaio, ricircolo che muta"
  bpm_scale: 0.85
  density_bias:
    harmony:  0.10
    melody:  -0.05
    texture:  0.10
  rhythm_grid: [1,0,1,0, 0,1,0,1, 1,0,1,0, 0,1,0,0]
  chord_shape: cyclic_long
  bass_pattern_pool: [loom_pulse, loom_walk]
  drum_groove: tape_loop_8th
  phase_distribution:
    germoglio:    0.10
    pulsazione:   0.40
    densita:      0.40
    rottura:      0.05
    dissoluzione: 0.05
  song_duration_weight: 1.1

CREST:
  poetic: "cresta, salita"
  bpm_scale: 1.10
  density_bias:
    rhythm:  { from: 0.2, to: 0.85 }
    harmony: { from: 0.3, to: 0.7 }
    bass:    { from: 0.2, to: 0.8 }
    melody:  { from: 0.0, to: 0.9 }
  rhythm_grid: [1,0,0,0, 1,0,0,0, 1,0,1,0, 1,0,0,0]
  chord_shape: ascending_steps
  bass_pattern_pool: [crest_walking, crest_step]
  drum_groove: building
  phase_distribution:
    germoglio:    0.15
    pulsazione:   0.30
    densita:      0.35
    rottura:      0.20
    dissoluzione: 0.0
  song_duration_weight: 1.2

FAULT:
  poetic: "faglia, crepa che cede"
  bpm_scale: 0.90
  density_bias:
    rhythm:  { from: 0.7, to: 0.0 }
    harmony: { from: 0.6, to: 0.1 }
    bass:    { from: 0.7, to: 0.0 }
  rhythm_grid: [1,0,1,0, 1,1,0,0, 1,0,0,1, 1,0,0,0]
  chord_shape: collapsing
  bass_pattern_pool: [fault_dropping, fault_glitch]
  drum_groove: granitic_then_dead
  phase_distribution:
    germoglio:    0.0
    pulsazione:   0.10
    densita:      0.30
    rottura:      0.40
    dissoluzione: 0.20
  song_duration_weight: 0.8
```

- [ ] **Step 4: Run — expect PASS**

Run: `node test/mapping-presets-loader.test.js`
Expected: `✓ presets-loader (substances + gestures)`.

- [ ] **Step 5: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/mapping/gesture-presets.yaml test/mapping-presets-loader.test.js
git commit -m "feat(m1c-α): gesture presets YAML"
```

---

## Task 4: Arc + chord shape preset YAML

**Files:**
- Create: `/Users/Edo_1/album-gen/src/mapping/arc-presets.yaml`
- Create: `/Users/Edo_1/album-gen/src/mapping/chord-shapes.yaml`
- Modify: `/Users/Edo_1/album-gen/test/mapping-presets-loader.test.js`

- [ ] **Step 1: Extend the loader test for arcs and chord shapes**

Append to `/Users/Edo_1/album-gen/test/mapping-presets-loader.test.js`:

```js
// 4. Arcs: 4 named, each with sequence of 5 valid gesture names
const arcs = await loadArcPresets();
const validGestures = new Set(expectedGestures);
const expectedArcs = ["SALITA", "ONDA", "DISCESA", "PIATTO"];
for (const name of expectedArcs) {
  const a = arcs[name];
  assert.ok(a, `arc ${name} missing`);
  assert.ok(Array.isArray(a.sequence), `${name}.sequence not array`);
  assert.equal(a.sequence.length, 5, `${name}.sequence not length 5`);
  for (const g of a.sequence) {
    assert.ok(validGestures.has(g), `${name}.sequence has invalid gesture ${g}`);
  }
}

// 5. Chord shapes: 6 named, each is array of degree strings
const shapes = await loadChordShapes();
const expectedShapes = ["cyclic_short", "cyclic_long", "shifting_triads",
                        "ascending_steps", "collapsing", "fragmented"];
for (const name of expectedShapes) {
  const s = shapes[name];
  assert.ok(Array.isArray(s), `chord shape ${name} not array`);
  assert.ok(s.length >= 4, `${name} has fewer than 4 chords`);
  for (const degree of s) {
    assert.ok(typeof degree === "string", `${name} non-string degree ${degree}`);
  }
}
```

Update final log to: `console.log("✓ presets-loader (substances + gestures + arcs + shapes)");`

- [ ] **Step 2: Run — expect FAIL**

Run: `node test/mapping-presets-loader.test.js`
Expected: yaml-load error on arc-presets.yaml.

- [ ] **Step 3: Write arc-presets.yaml**

Write `/Users/Edo_1/album-gen/src/mapping/arc-presets.yaml`:

```yaml
# 4 arc presets. Each is a sequence of 5 gesture names (positions opener→outro).

SALITA:
  description: "energia che cresce verso il finale"
  sequence: [DRIFT, LOOM, THRUM, CREST, FAULT]

ONDA:
  description: "salita poi rilascio, simmetrica"
  sequence: [DRIFT, LOOM, CREST, FAULT, DRIFT]

DISCESA:
  description: "parte intensa e si scioglie"
  sequence: [CREST, RIVEN, FAULT, LOOM, DRIFT]

PIATTO:
  description: "ipnotico, variazioni minime"
  sequence: [DRIFT, LOOM, THRUM, LOOM, DRIFT]
```

- [ ] **Step 4: Write chord-shapes.yaml**

Write `/Users/Edo_1/album-gen/src/mapping/chord-shapes.yaml`:

```yaml
# Chord shapes are mode-relative: each entry is an array of degree strings
# resolved at compositional time against worldState.scale + worldState.root.
# Degree syntax: roman numerals (I, ii, V, vi…) plus optional b prefix (bVI, bVII).
# Lower case = minor triad; upper case = major triad. Quality is implicit in the mode.

cyclic_short:    [I, V, I, IV]
cyclic_long:     [I, iv, VII, I, V, iv, II, I]
shifting_triads: [i, bVI, ii, bVI]
ascending_steps: [I, IV, V, V, I, IV, V, vi]
collapsing:      [I, bVII, bV, i]
fragmented:      [I, bV, bII, vi]
```

- [ ] **Step 5: Run — expect PASS**

Run: `node test/mapping-presets-loader.test.js`
Expected: `✓ presets-loader (substances + gestures + arcs + shapes)`.

- [ ] **Step 6: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/mapping/arc-presets.yaml src/mapping/chord-shapes.yaml test/mapping-presets-loader.test.js
git commit -m "feat(m1c-α): arc + chord-shape preset YAML"
```

---

## Task 5: Chord shape engine (degrees → MIDI)

The engine converts a chord shape (`["I", "iv", "VII"]`) plus a scale (`[55,57,58,60,62,63,65,67]`) into MIDI chord arrays (`[[55,58,62], [60,63,67], ...]`). Degree resolution rules are explicit in the code so the engine is deterministic and unit-testable.

**Files:**
- Create: `/Users/Edo_1/album-gen/src/mapping/chord-shape-engine.js`
- Create: `/Users/Edo_1/album-gen/test/mapping-chord-shape.test.js`

- [ ] **Step 1: Write the failing test**

Write `/Users/Edo_1/album-gen/test/mapping-chord-shape.test.js`:

```js
import { resolveDegree, buildChords } from "../src/mapping/chord-shape-engine.js";
import assert from "node:assert/strict";

// G dorian scale: G A Bb C D E F G  (intervals from G: 0 2 3 5 7 9 10 12)
const G_DORIAN = [55, 57, 58, 60, 62, 63, 65, 67];   // 7 notes + octave
const G_ROOT = 55;

// 1. Diatonic degrees on G dorian
// I = G major triad (root, +4st, +7st = G B D)? No — in dorian, I is GBbD (minor) actually.
// We use the scale's own thirds: third = scale[idx + 2], fifth = scale[idx + 4].
// I in G dorian → root index 0 → notes 55, 58, 62 (G, Bb, D) — minor triad
let r = resolveDegree("I", G_DORIAN, G_ROOT);
assert.deepEqual(r.midi, [55, 58, 62], `I dorian = ${r.midi.join(",")}`);

// IV in G dorian → root index 3 → notes 60, 63, 67 (C, Eb, G) ... wait, scale[3]=60, scale[5]=63, scale[7]=67.
// Actually dorian IV is major (C E G in C dorian = C major). G dorian IV = C major: 60, 64, 67.
// But scale[5]=63 (E natural in G dorian is E natural? Let's check: G dorian = G A Bb C D E F. E is natural. scale[5]=63? G=55, A=57, Bb=58, C=60, D=62, E=64, F=65, G=67. So scale should be [55,57,58,60,62,64,65,67].
// REVISED: G dorian = [55, 57, 58, 60, 62, 64, 65, 67].
const G_DORIAN_FIXED = [55, 57, 58, 60, 62, 64, 65, 67];
r = resolveDegree("I", G_DORIAN_FIXED, 55);
assert.deepEqual(r.midi, [55, 58, 62], "I dorian = G Bb D");
r = resolveDegree("IV", G_DORIAN_FIXED, 55);
assert.deepEqual(r.midi, [60, 64, 67], "IV dorian = C E G");
r = resolveDegree("V", G_DORIAN_FIXED, 55);
assert.deepEqual(r.midi, [62, 65, 69], "V dorian = D F A");
// (Note: the real "F" in G dorian is at scale[6]=65; scale[7]=67=G; scale[8] would be A=69 which is +14 from G.
// Triad on V = scale[4]=62, scale[6]=65, scale[8]=? out of array. Engine extends scale by adding octave.
// For now the engine should produce something musically sensible; we accept these expected values.)

// 2. Lowered degrees: bVII → root index 6 lowered by 1
// In G dorian, scale[6] = 65 (F). bVII would be... actually bVII in G dorian is F natural already (so VII without flat = F#, bVII = F).
// But since dorian has F natural, "VII" should give F natural. We standardise: roman numerals follow MAJOR scale degrees;
// bVII = lower the 7th by 1 from major. For G major scale = [55,57,59,60,62,64,66,67] → 7th = 66 (F#);
// bVII = 65 (F). G dorian's natural 7th = 65, which is bVII relative to major.
// Engine: ALWAYS interpret degrees as relative to the MAJOR scale, applying flats/sharps explicitly.
// scale[] is the actual mode scale; root is the song key root.
// For mode-aware shape resolution, we use scale-walking (the implementation below).

// Implementation choice: resolveDegree builds chord using scale-walk.
// I: scale[0], scale[2], scale[4]
// II: scale[1], scale[3], scale[5]
// ...
// bX: lower chord root by 1 semitone, then walk scale from nearest scale tone
// We test the simple case first and accept the engine's interpretation for mode-aware pieces.

// 3. Lower-case degree (i, ii) → minor triad over scale walk
r = resolveDegree("i", G_DORIAN_FIXED, 55);
// i over G dorian → minor triad on G: G Bb D → 55, 58, 62 (same as I in dorian since dorian I IS minor)
assert.deepEqual(r.midi, [55, 58, 62], "i = G Bb D");

// 4. buildChords builds a chord array from a shape
const chords = buildChords(["I", "IV", "V"], G_DORIAN_FIXED, 55);
assert.equal(chords.length, 3);
assert.deepEqual(chords[0], [55, 58, 62]);
assert.deepEqual(chords[1], [60, 64, 67]);
assert.deepEqual(chords[2], [62, 65, 69]);

// 5. Unknown degree throws
assert.throws(() => resolveDegree("ZZZ", G_DORIAN_FIXED, 55), /unknown degree/i);

console.log("✓ chord-shape-engine");
```

- [ ] **Step 2: Run — expect FAIL (module missing)**

Run: `node test/mapping-chord-shape.test.js`
Expected: cannot find module.

- [ ] **Step 3: Implement chord-shape-engine.js**

Write `/Users/Edo_1/album-gen/src/mapping/chord-shape-engine.js`:

```js
// Mode-relative chord shape engine.
// Given a degree string ("I", "iv", "bVII", etc.), a scale (MIDI note array),
// and a root (MIDI), produce a chord triad (MIDI array of 3 notes).
//
// Degree syntax:
//   - Uppercase "I","II",...,"VII" → diatonic chord on that scale degree (root, third, fifth via scale walk)
//   - Lowercase "i","ii",... → also diatonic on the same scale walk (case is informational only here;
//     the actual quality emerges from the mode). Both produce the same midi.
//   - Prefix "b" (e.g. "bVI", "bVII") → the chord root is shifted DOWN by 1 semitone from the diatonic position;
//     the third and fifth are then taken from the nearest scale tones above the new root.
//     If the lowered root is not a scale tone, we still walk by the same +2 / +4 scale-step rule from the closest
//     scale index, allowing chromatic chords without forcing key changes.
//
// All MIDI numbers are "absolute" (not octave-folded). Caller can register-clamp.

const ROMAN_TO_INDEX = { I: 0, II: 1, III: 2, IV: 3, V: 4, VI: 5, VII: 6 };

function parseDegree(s) {
  let body = s;
  let flat = false;
  if (body.startsWith("b")) { flat = true; body = body.slice(1); }
  const upper = body.toUpperCase();
  if (!(upper in ROMAN_TO_INDEX)) {
    throw new Error(`unknown degree "${s}"`);
  }
  return { idx: ROMAN_TO_INDEX[upper], flat };
}

/**
 * Build a triad (root, third, fifth) on the given scale at the given degree.
 * scale is sorted ascending and may be 7 notes (one octave) or include the octave (8 notes).
 * If a scale index is out of bounds, extend by adding 12 to the wrap-around position.
 */
function scaleTriad(rootMidi, scale, idx) {
  // Build an "extended" scale of length 9 (current octave + first 2 of next) to allow walks beyond 7.
  const ext = [
    ...scale,
    ...scale.slice(1).map(n => n + 12),
  ];
  const r  = ext[idx];
  const t3 = ext[idx + 2] !== undefined ? ext[idx + 2] : r + 4;
  const t5 = ext[idx + 4] !== undefined ? ext[idx + 4] : r + 7;
  return [r, t3, t5];
}

export function resolveDegree(degreeStr, scale, _root) {
  const { idx, flat } = parseDegree(degreeStr);
  const triad = scaleTriad(scale[0], scale, idx);
  if (flat) {
    triad[0] -= 1;
    // For lowered roots, recompute third/fifth as scale-relative from the lowered tone:
    // simpler heuristic: apply same -1 shift to third/fifth so the chord stays "diatonically rooted"
    // but transposed down. This produces musically usable bVI / bVII chords on most modes.
    triad[1] -= 1;
    triad[2] -= 1;
  }
  return { midi: triad, root: triad[0] };
}

/**
 * Build chord progression from a shape (array of degree strings) on a scale + root.
 * Returns an array of triads (each [root, third, fifth] MIDI).
 */
export function buildChords(shape, scale, root) {
  return shape.map(deg => resolveDegree(deg, scale, root).midi);
}
```

- [ ] **Step 4: Run the test**

Run: `node test/mapping-chord-shape.test.js`
Expected: `✓ chord-shape-engine`.

If the test fails with off-by-one on `IV` or `V` chord, double-check the fixed `G_DORIAN_FIXED` scale array. The engine should produce the asserted values exactly.

- [ ] **Step 5: Run full suite**

Run: `npm test`
Expected: 18/18 green.

- [ ] **Step 6: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/mapping/chord-shape-engine.js test/mapping-chord-shape.test.js
git commit -m "feat(m1c-α): chord shape engine (degrees → MIDI triads)"
```

---

## Task 6: Bass pattern pool

Bass patterns are 16-step arrays (offset semitones from chord root, 0 = rest, positive = active). Each named pool entry has 1-4 patterns; the seed picks one for the song.

**Files:**
- Create: `/Users/Edo_1/album-gen/src/mapping/bass-pattern-pool.js`
- Create: `/Users/Edo_1/album-gen/test/mapping-bass-pool.test.js`

- [ ] **Step 1: Write the failing test**

Write `/Users/Edo_1/album-gen/test/mapping-bass-pool.test.js`:

```js
import { BASS_PATTERNS, pickBassPattern } from "../src/mapping/bass-pattern-pool.js";
import { SeededRNG } from "../src/shared/perf-utils.js";
import assert from "node:assert/strict";

// 1. Required pool keys exist (one per gesture)
const required = [
  "thrum_a", "thrum_b", "thrum_c",
  "drone_low", "drone_low_oct",
  "riven_stab", "riven_silent",
  "loom_pulse", "loom_walk",
  "crest_walking", "crest_step",
  "fault_dropping", "fault_glitch",
  "default",   // fallback for _default substance / unknown gesture
];
for (const k of required) {
  assert.ok(BASS_PATTERNS[k], `bass pattern ${k} missing`);
  assert.ok(Array.isArray(BASS_PATTERNS[k]), `${k} not array`);
  assert.equal(BASS_PATTERNS[k].length, 16, `${k} not 16-step`);
  for (const v of BASS_PATTERNS[k]) {
    assert.equal(typeof v, "number", `${k} has non-numeric step`);
  }
}

// 2. pickBassPattern is deterministic under same seed + same pool
const rng = new SeededRNG(42);
const a = pickBassPattern(["thrum_a", "thrum_b", "thrum_c"], rng);
const rng2 = new SeededRNG(42);
const b = pickBassPattern(["thrum_a", "thrum_b", "thrum_c"], rng2);
assert.deepEqual(a, b, "pickBassPattern not deterministic");

// 3. Empty pool → fallback to default
const c = pickBassPattern([], new SeededRNG(1));
assert.deepEqual(c, BASS_PATTERNS.default);

// 4. Unknown name → fallback to default
const d = pickBassPattern(["NOT_A_PATTERN"], new SeededRNG(1));
assert.deepEqual(d, BASS_PATTERNS.default);

console.log("✓ bass-pattern-pool");
```

- [ ] **Step 2: Run — expect FAIL**

Run: `node test/mapping-bass-pool.test.js`

- [ ] **Step 3: Implement**

Write `/Users/Edo_1/album-gen/src/mapping/bass-pattern-pool.js`:

```js
// 16-step bass patterns. Each value is a semitone offset from the chord root,
// or 0 to mean "rest" (no note). Composers add this offset to currentChord[0].
//
// Keep musical character per gesture:
//   - thrum_*   : 4-on-floor, mostly root + occasional 5/7 walks
//   - drone_*   : sparse, root-heavy (DRIFT)
//   - riven_*   : staggered, gappy stabs (RIVEN)
//   - loom_*    : tape-loop, syncopated walking (LOOM)
//   - crest_*   : ascending shapes (CREST)
//   - fault_*   : starts dense, weakens (FAULT — gesture itself decays via density_bias)
//   - default   : SOLCO bassPattern as M1b fallback

export const BASS_PATTERNS = {
  // THRUM — root-driven 4-on-floor with subtle walks
  thrum_a: [12,0,0,0, 7,0,0,0, 12,0,0,0, 5,0,0,0],
  thrum_b: [12,0,0,7, 0,0,12,0, 0,0,7,0, 12,0,5,0],
  thrum_c: [12,0,0,0, 12,0,5,0, 12,0,0,7, 0,0,0,0],

  // DRIFT — sparse drone-like
  drone_low:     [12,0,0,0, 0,0,0,0, 12,0,0,0, 0,0,0,0],
  drone_low_oct: [12,0,0,0, 0,0,0,0, 24,0,0,0, 0,0,0,0],

  // RIVEN — fragmented stabs
  riven_stab:    [12,0,0,0, 0,0,12,0, 0,5,0,0, 12,0,0,0],
  riven_silent:  [0,0,12,0, 0,0,0,0, 7,0,0,0, 0,0,12,0],

  // LOOM — tape-loop walking
  loom_pulse:    [12,0,7,0, 0,5,0,0, 12,0,7,0, 0,5,0,0],
  loom_walk:     [12,0,0,7, 0,5,0,7, 12,0,0,5, 0,7,0,0],

  // CREST — ascending walks
  crest_walking: [0,0,0,7, 0,5,0,0, 0,0,3,0, 5,0,0,0],
  crest_step:    [12,0,0,5, 0,7,0,9, 0,12,0,7, 0,5,0,0],

  // FAULT — starts dense, gesture decays via density_bias from→to
  fault_dropping: [12,0,12,0, 5,0,7,0, 12,0,0,5, 0,0,0,0],
  fault_glitch:   [12,12,0,0, 0,0,12,0, 0,12,0,0, 12,0,0,0],

  // Default fallback (SOLCO original)
  default:        [0,0,0,7, 0,5,0,0, 0,0,3,0, 5,0,0,0],
};

/**
 * Pick a pattern from a pool of names using rng.
 * Falls back to BASS_PATTERNS.default if pool empty or any name unknown (returns first valid).
 */
export function pickBassPattern(poolNames, rng) {
  if (!poolNames || poolNames.length === 0) return BASS_PATTERNS.default;
  // Filter to known patterns
  const valid = poolNames.filter(n => BASS_PATTERNS[n]);
  if (valid.length === 0) return BASS_PATTERNS.default;
  const idx = Math.floor(rng.next() * valid.length);
  return BASS_PATTERNS[valid[idx]];
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `node test/mapping-bass-pool.test.js`
Expected: `✓ bass-pattern-pool`.

- [ ] **Step 5: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/mapping/bass-pattern-pool.js test/mapping-bass-pool.test.js
git commit -m "feat(m1c-α): bass pattern pool with seed-driven pick"
```

---

## Task 7: Album mapper (`mapAlbum`)

Pure function that takes a setup `{substance, arc, overrides, bpm_global, duration_min, seed}` and returns a fully-populated album object compatible with `config-loader` + `album-director`.

**Files:**
- Create: `/Users/Edo_1/album-gen/src/mapping/mapper.js`
- Create: `/Users/Edo_1/album-gen/test/mapping-mapper.test.js`

- [ ] **Step 1: Write the failing test**

Write `/Users/Edo_1/album-gen/test/mapping-mapper.test.js`:

```js
import { mapAlbum } from "../src/mapping/mapper.js";
import assert from "node:assert/strict";

const album = await mapAlbum({
  substance: "HAZE",
  arc: "ONDA",
  overrides: { climax: "JOLT" },
  bpm_global: 96,
  key: "D",
  mode: "dorian",
  duration_min: 35,
  seed: 0x9C42,
});

// 1. Top-level shape
assert.equal(album.tool_version, "0.4.0-M1c-alpha");
assert.equal(album.global.bpm, 96);
assert.equal(album.global.key, "D");
assert.equal(album.global.seed, 0x9C42);

// 2. album_setup block
assert.equal(album.album_setup.substance, "HAZE");
assert.equal(album.album_setup.arc, "ONDA");
assert.equal(album.album_setup.substance_overrides.climax, "JOLT");

// 3. Songs: ONDA arc → DRIFT, LOOM, CREST, FAULT, DRIFT
assert.equal(album.songs.length, 5);
assert.equal(album.songs[0].gesture, "DRIFT");
assert.equal(album.songs[1].gesture, "LOOM");
assert.equal(album.songs[2].gesture, "CREST");
assert.equal(album.songs[3].gesture, "FAULT");
assert.equal(album.songs[4].gesture, "DRIFT");

// 4. Roles
assert.equal(album.songs[0].role, "opener");
assert.equal(album.songs[1].role, "development");
assert.equal(album.songs[2].role, "development");
assert.equal(album.songs[3].role, "climax");
assert.equal(album.songs[4].role, "outro");

// 5. Substance override on climax (id=climax_3 or just role=climax)
assert.equal(album.songs[3].substance, "JOLT");
assert.equal(album.songs[0].substance, "HAZE");
assert.equal(album.songs[4].substance, "HAZE");

// 6. BPM derived per gesture
// DRIFT.bpm_scale=0.55 → 96*0.55 = 52.8 → round = 53
assert.equal(album.songs[0].bpm, 53);
// CREST.bpm_scale=1.10 → 96*1.10 = 105.6 → round = 106
assert.equal(album.songs[2].bpm, 106);
// FAULT.bpm_scale=0.90 → 96*0.90 = 86.4 → round = 86
assert.equal(album.songs[3].bpm, 86);

// 7. Duration distribution sums approximately to total
const totalSec = album.songs.reduce((s, song) => s + song.duration_sec, 0);
const expectedSec = 35 * 60;
assert.ok(Math.abs(totalSec - expectedSec) <= 5,
          `total duration ${totalSec} too far from ${expectedSec}`);

// 8. Per-song seeds are distinct
const seeds = album.songs.map(s => s.seed);
assert.equal(new Set(seeds).size, 5, "song seeds must be distinct");

// 9. Determinism: same input → same output
const album2 = await mapAlbum({
  substance: "HAZE", arc: "ONDA", overrides: { climax: "JOLT" },
  bpm_global: 96, key: "D", mode: "dorian", duration_min: 35, seed: 0x9C42,
});
assert.deepEqual(album, album2, "mapAlbum must be deterministic");

// 10. Each song has all required mapping fields
for (const song of album.songs) {
  assert.ok(song.gesture, "song.gesture missing");
  assert.ok(song.substance, "song.substance missing");
  assert.ok(song.bpm, "song.bpm missing");
  assert.ok(song.duration_sec, "song.duration_sec missing");
  assert.ok(typeof song.intensity === "number", "song.intensity not number");
  assert.ok(song.seed, "song.seed missing");
  assert.ok(song.chord_shape, "song.chord_shape missing");
  assert.ok(song.bass_pattern_pool, "song.bass_pattern_pool missing");
  assert.ok(song.register, "song.register missing");
  assert.ok(song.density_bias, "song.density_bias missing");
  assert.ok(song.phase_distribution, "song.phase_distribution missing");
}

console.log("✓ mapAlbum");
```

- [ ] **Step 2: Run — expect FAIL**

Run: `node test/mapping-mapper.test.js`

- [ ] **Step 3: Implement mapper.js**

Write `/Users/Edo_1/album-gen/src/mapping/mapper.js`:

```js
import { loadSubstancePresets, loadGesturePresets, loadArcPresets } from "./presets-loader.js";
import { deriveComposerSeed } from "../core/seed-manager.js";

const ROLE_BY_POSITION = ["opener", "development", "development", "climax", "outro"];

// Intensity defaults per arc position (used if user doesn't override).
function intensityForRole(role) {
  switch (role) {
    case "opener":      return 0.35;
    case "development": return 0.55;
    case "climax":      return 0.90;
    case "outro":       return 0.25;
    default:            return 0.50;
  }
}

/**
 * Pure function: setup → fully-populated album object.
 * Caller persists it as YAML if needed; song-director reads it directly.
 */
export async function mapAlbum({
  substance,
  arc,
  overrides = {},
  bpm_global,
  key,
  mode,
  duration_min,
  seed,
  title = null,
}) {
  const substances = await loadSubstancePresets();
  const gestures   = await loadGesturePresets();
  const arcs       = await loadArcPresets();

  if (!substances[substance]) throw new Error(`unknown substance "${substance}"`);
  if (!arcs[arc])             throw new Error(`unknown arc "${arc}"`);

  const subPreset = substances[substance];
  const arcSeq    = arcs[arc].sequence;
  if (arcSeq.length !== 5) throw new Error(`arc ${arc}.sequence must have length 5`);

  // Compute song duration weights (gestures contribute different weights)
  const totalWeight = arcSeq.reduce((s, g) => s + (gestures[g]?.song_duration_weight ?? 1.0), 0);
  const totalSec    = duration_min * 60;

  const songs = arcSeq.map((gesture, i) => {
    const role = ROLE_BY_POSITION[i];
    const songSubstanceName = overrides[role] || substance;
    if (!substances[songSubstanceName]) throw new Error(`unknown substance override "${songSubstanceName}"`);
    const subForSong = substances[songSubstanceName];
    const gestPreset = gestures[gesture];
    if (!gestPreset) throw new Error(`unknown gesture "${gesture}"`);

    const songDur = Math.round(totalSec * gestPreset.song_duration_weight / totalWeight);
    const songBpm = Math.round(bpm_global * gestPreset.bpm_scale);

    return {
      id:                 `${role}_${i}`,
      role,
      gesture,
      substance:          songSubstanceName,
      duration_sec:       songDur,
      bpm:                songBpm,
      intensity:          intensityForRole(role),
      seed:               deriveComposerSeed(seed, `song:${i}`),
      register:           subForSong.register,
      density_bias:       gestPreset.density_bias,
      rhythm_grid:        gestPreset.rhythm_grid,
      chord_shape:        gestPreset.chord_shape,
      bass_pattern_pool:  gestPreset.bass_pattern_pool,
      drum_groove:        gestPreset.drum_groove,
      phase_distribution: gestPreset.phase_distribution,
      synth_dir:          subForSong.synth_dir,
      modulation_rules:   subForSong.modulation_rules,
    };
  });

  return {
    tool_version: "0.4.0-M1c-alpha",
    title:        title || `${substance.toLowerCase()}-${arc.toLowerCase()}`,
    created:      new Date().toISOString(),
    generator:    "mapper",
    global: {
      seed,
      bpm:           bpm_global,
      key,
      mode,
      duration_min,
    },
    album_setup: {
      substance,
      arc,
      substance_overrides: overrides,
    },
    songs,
    instruments: defaultInstruments(),
  };
}

function defaultInstruments() {
  return {
    drone:   { synth: "drone",   default_amp: 0.3 },
    bass:    { synth: "bass",    default_amp: 0.4 },
    kick:    { synth: "kick",    default_amp: 0.7 },
    snare:   { synth: "snare",   default_amp: 0.5 },
    hat:     { synth: "hat",     default_amp: 0.3 },
    lead:    { synth: "lead",    default_amp: 0.45 },
    pad:     { synth: "pad",     default_amp: 0.25 },
    perc:    { synth: "perc",    default_amp: 0.4 },
    texture: { synth: "texture", default_amp: 0.2 },
  };
}
```

- [ ] **Step 4: Run the test**

Run: `node test/mapping-mapper.test.js`
Expected: `✓ mapAlbum`.

- [ ] **Step 5: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/mapping/mapper.js test/mapping-mapper.test.js
git commit -m "feat(m1c-α): mapAlbum mapper (substance + arc + overrides → album)"
```

---

## Task 8: Extend `world-state.js` with M1c fields

**Files:**
- Modify: `/Users/Edo_1/album-gen/src/shared/world-state.js`

- [ ] **Step 1: Read current `world-state.js`**

Open `/Users/Edo_1/album-gen/src/shared/world-state.js` and locate `createWorldState` and `advanceWorldState`. The body was rewritten in M1b Task 3 — the `albumPhase` field exists.

- [ ] **Step 2: Extend `createWorldState` signature and body**

Modify the function so it accepts the new optional fields and stores them with safe defaults. Find the existing `return { ... }` block and add these fields (additive; don't break existing fields):

```js
// inside createWorldState, in the returned object, add after the M1b "MACH:INE-shaped fields" block:
gesture:         arguments[0]?.gesture         ?? "THRUM",
substance:       arguments[0]?.substance       ?? "_default",
chordShape:      arguments[0]?.chordShape      ?? "cyclic_short",
bassPatternPool: arguments[0]?.bassPatternPool ?? ["default"],
drumGroove:      arguments[0]?.drumGroove      ?? "4_on_floor_dry",
densityBias:     arguments[0]?.densityBias     ?? null,
phaseDistribution: arguments[0]?.phaseDistribution ?? null,
```

(`arguments[0]?.X` is the cleanest way to read optional new params without changing the signature destructure shape; alternatively, add `gesture, substance, …` to the destructure with default values.)

Cleaner version: change the destructure of `createWorldState` to:

```js
export function createWorldState({
  role,
  totalBars,
  bpm,
  key,
  mode,
  intensity,
  scale = [],
  root = 0,
  // M1c additions (optional, default-safe)
  gesture = "THRUM",
  substance = "_default",
  chordShape = "cyclic_short",
  bassPatternPool = ["default"],
  drumGroove = "4_on_floor_dry",
  densityBias = null,
  phaseDistribution = null,
}) {
  return {
    // ... existing M1b fields ...
    role, totalBars, bpm, key, mode, intensity,
    currentBar: 0,
    albumPhase: "intro",
    phaseProgress: 0,
    energy: 0,
    phase: "germoglio",
    scale,
    root,
    globalStep: 0, globalBar: 0, globalTick: 0, barProgress: 0,
    rhythmGrid: null,
    currentChord: [],
    density: { rhythm: 0, harmony: 0, bass: 0, melody: 0, texture: 0 },
    register: { bass: [36,55], melody: [67,84], lead: [72,96], chords: [55,72], arp: [60,84] },
    velocityCeiling: { rhythm: 0, harmony: 0, bass: 0, melody: 0, texture: 0 },
    rootOffset: 0, densityMultiplier: 1.0, meloMuteBars: 0, bassMuteBars: 0,
    degradation: { noteDropProb: 0, timingJitterMs: 0, chordNoteCount: 99 },
    rupture: { stage: null, stageT: 0, t: 0, intensity: 0 },
    audioEnergy: 0,
    encoreMode: false, preSuiteActive: false, transition: null,
    // M1c additions
    gesture,
    substance,
    chordShape,
    bassPatternPool,
    drumGroove,
    densityBias,
    phaseDistribution,
  };
}
```

Apply this change manually if your existing world-state.js uses a slightly different layout. The intent is: same fields as M1b, plus the 7 new M1c fields with safe defaults.

- [ ] **Step 3: Run M1b tests to verify no regression**

Run: `cd /Users/Edo_1/album-gen && npm test`
Expected: all 19 tests green (M1c-α adding 3 mapping tests + 16 M1b).

- [ ] **Step 4: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/shared/world-state.js
git commit -m "feat(m1c-α): extend worldState with M1c fields (gesture/substance/chordShape/...)"
```

---

## Task 9: Extend `phase-map.js` with gesture-aware mapping

The new mapping accepts an optional `phaseDistribution` object. If provided, it overrides the hardcoded role+progress table.

**Files:**
- Modify: `/Users/Edo_1/album-gen/src/shared/phase-map.js`
- Modify: `/Users/Edo_1/album-gen/test/phase-map.test.js`

- [ ] **Step 1: Extend the test**

Append to `/Users/Edo_1/album-gen/test/phase-map.test.js`:

```js
// M1c-α: gesture-aware override
const driftDistribution = {
  germoglio: 0.30,
  pulsazione: 0.40,
  densita: 0.20,
  rottura: 0.05,
  dissoluzione: 0.05,
};

// At progress 0.0 → germoglio; at 0.31 → pulsazione (since 0.30 cumulative); at 0.71 → densita; etc.
assert.equal(mapPhase("opener", 0.00, driftDistribution), "germoglio");
assert.equal(mapPhase("opener", 0.29, driftDistribution), "germoglio");
assert.equal(mapPhase("opener", 0.31, driftDistribution), "pulsazione");
assert.equal(mapPhase("opener", 0.71, driftDistribution), "densita");
assert.equal(mapPhase("opener", 0.91, driftDistribution), "rottura");
assert.equal(mapPhase("opener", 0.96, driftDistribution), "dissoluzione");

// Without 3rd arg, falls back to role-based (M1b behaviour) — already tested above.
```

- [ ] **Step 2: Run — expect FAIL (signature mismatch)**

Run: `node test/phase-map.test.js`
Expected: assertion failure or undefined behaviour.

- [ ] **Step 3: Modify `phase-map.js`**

Replace the body of `/Users/Edo_1/album-gen/src/shared/phase-map.js` with:

```js
// Deterministic mapping: (role, phaseProgress, [distribution]) → MACH:INE phase name.
// phaseProgress is clamped to [0,1].
//
// M1c-α: optional 3rd arg `distribution` is a phase distribution object such as
//   { germoglio: 0.05, pulsazione: 0.30, densita: 0.50, rottura: 0.10, dissoluzione: 0.05 }
// (sums to 1). When provided, the function builds a cumulative table and returns the
// phase whose cumulative bound is first crossed by `phaseProgress`. This lets gestures
// reshape the song's phase arc independently of role.
//
// When `distribution` is null/undefined, falls back to the M1b role-based table.

const ROLE_TABLE = {
  opener: [
    [0.30, "germoglio"],
    [1.01, "pulsazione"],
  ],
  development: [
    [0.20, "pulsazione"],
    [0.80, "densita"],
    [1.01, "rottura"],
  ],
  climax: [
    [0.80, "rottura"],
    [1.01, "dissoluzione"],
  ],
  outro: [
    [1.01, "dissoluzione"],
  ],
};

const PHASE_ORDER = ["germoglio", "pulsazione", "densita", "rottura", "dissoluzione"];

export function mapPhase(role, phaseProgress, distribution = null) {
  const p = Math.max(0, Math.min(1, phaseProgress));

  if (distribution) {
    let cumul = 0;
    for (const phase of PHASE_ORDER) {
      cumul += distribution[phase] || 0;
      if (p < cumul) return phase;
    }
    return PHASE_ORDER[PHASE_ORDER.length - 1];
  }

  const rows = ROLE_TABLE[role];
  if (!rows) throw new Error(`mapPhase: unknown role "${role}"`);
  for (const [upper, phase] of rows) {
    if (p < upper) return phase;
  }
  return rows[rows.length - 1][1];
}
```

- [ ] **Step 4: Run the test**

Run: `node test/phase-map.test.js`
Expected: `✓ phase-map` with all assertions (M1b + M1c) passing.

- [ ] **Step 5: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/shared/phase-map.js test/phase-map.test.js
git commit -m "feat(m1c-α): gesture-aware phase distribution in phase-map"
```

---

## Task 10: Extend `harmony.js` to use chord shape engine

Replace the M1b hardcoded `DEFAULT_TRACK_DEF.chords` access with a call to the chord-shape engine driven by `worldState.chordShape`.

**Files:**
- Modify: `/Users/Edo_1/album-gen/src/composers/harmony.js`

- [ ] **Step 1: Add chord-shape engine import + initial chord pre-computation**

In `/Users/Edo_1/album-gen/src/composers/harmony.js`, near the top of the file (after the existing `import { CFG } from '../shared/cfg-port.js'` and `import { SeededRNG } from '../shared/perf-utils.js'`), add:

```js
import { buildChords } from "../mapping/chord-shape-engine.js";
import { loadChordShapes } from "../mapping/presets-loader.js";

// Cache of resolved shapes (loaded once at first use; sync-ish via top-level await
// is not possible in a function module, so we lazy-load and cache).
let _chordShapesCache = null;
async function getChordShapesOnce() {
  if (_chordShapesCache) return _chordShapesCache;
  _chordShapesCache = await loadChordShapes();
  return _chordShapesCache;
}
```

(Top-level `await` works inside ESM modules in Node 20+; you can hoist the load with `const SHAPES = await loadChordShapes();` at module top instead, simpler.)

Cleaner: add at module top (above `DEFAULT_TRACK_DEF`):

```js
import { buildChords } from "../mapping/chord-shape-engine.js";
import { loadChordShapes } from "../mapping/presets-loader.js";
const SHAPES = await loadChordShapes();    // top-level await, ESM
```

- [ ] **Step 2: Replace `DEFAULT_TRACK_DEF.chords` with shape-resolved chords inside the factory**

Locate (within `createHarmony({ seed, harness, worldState })`):

```js
const trackData = DEFAULT_TRACK_DEF;
// ... later:
const rawChord = trackData.chords[_chordIdx];
```

Replace this with:

```js
// M1c-α: resolve chord progression from worldState.chordShape using current scale + root.
const shapeName = worldState.chordShape || "cyclic_short";
const shape = SHAPES[shapeName];
if (!shape) throw new Error(`harmony: unknown chord shape "${shapeName}"`);
const resolvedChords = buildChords(shape, worldState.scale, worldState.root);

// later, in the place that previously did `trackData.chords[_chordIdx]`:
const rawChord = resolvedChords[_chordIdx % resolvedChords.length];
```

If the existing M1b code used `trackData.chords.length` for cycle bounds, replace with `resolvedChords.length`.

If `barsPerChord` is read from `trackData.barsPerChord?.[phase]`, **leave it** — the shape doesn't carry per-phase bar timing. The M1b default of 4 bars per chord (or whatever the existing fallback is) continues to apply.

- [ ] **Step 3: Run M1b harmony test to verify no regression**

Run: `node test/composer-harmony.test.js`
Expected: still passes — the test sets `worldState.scale` and `worldState.root` already; with M1c, `worldState.chordShape` defaults to `cyclic_short` (from `world-state.js` Task 8). The chord progression now is `[I, V, I, IV]` resolved on G dorian instead of the SOLCO Gm/Am/Bb/C/Dm/... — events count may differ slightly.

If the M1b harmony test asserts an exact event count and it fails, **update** the snapshot in that test to the new value (the M1b "expected" was a moving target — the spec acknowledges this in M1c).

- [ ] **Step 4: Run full suite**

Run: `npm test`
Expected: all pass; if `composer-harmony.test.js` count drifted, update snapshot inline.

- [ ] **Step 5: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/composers/harmony.js test/composer-harmony.test.js
git commit -m "feat(m1c-α): harmony reads chord progression from chordShape via shape engine"
```

---

## Task 11: Extend `bass-v3.js` to use bass pattern pool

**Files:**
- Modify: `/Users/Edo_1/album-gen/src/composers/bass-v3.js`

- [ ] **Step 1: Add pool import + pick-on-init logic**

In `/Users/Edo_1/album-gen/src/composers/bass-v3.js`, near the top:

```js
import { pickBassPattern } from "../mapping/bass-pattern-pool.js";
```

Inside `createBass({ seed, harness, worldState })` factory, after the `rng` declaration, add:

```js
// M1c-α: pick a bass pattern from the gesture's pool, deterministically per song seed.
const _pickedPattern = pickBassPattern(worldState.bassPatternPool || ["default"], rng);
```

- [ ] **Step 2: Replace `track.bassPattern` reads**

Find the line(s) reading `track.bassPattern` (the M1b port copied vendor SOLCO bassPattern). Replace with `_pickedPattern`. Similarly anywhere `DEFAULT_TRACK_DEF.bassPattern` is referenced inside this factory.

If the M1b factory had a fallback chain like `track.bassPattern || DEFAULT_TRACK_DEF.bassPattern || []`, the new code is just `_pickedPattern`.

- [ ] **Step 3: Run M1b bass test**

Run: `node test/composer-bass.test.js`
Expected: still passes if bassPatternPool defaults to `["default"]` (the SOLCO pattern from `BASS_PATTERNS.default`). If the event count drifts, update the M1b snapshot.

- [ ] **Step 4: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/composers/bass-v3.js test/composer-bass.test.js
git commit -m "feat(m1c-α): bass picks pattern from pool via worldState.bassPatternPool"
```

---

## Task 12: Extend `song-director.js` to apply M1c per-song fields

This is the integration point: per-song mapping fields populate worldState before the bundle generates events.

**Files:**
- Modify: `/Users/Edo_1/album-gen/src/core/song-director.js`

- [ ] **Step 1: Accept new params in `createSongDirector`**

Modify the destructure of `createSongDirector` to accept the new fields:

```js
export function createSongDirector({
  id, role, duration_sec, character, intensity, seed, globalPlan,
  // M1c-α additions (all optional with sensible defaults)
  gesture = "THRUM",
  substance = "_default",
  bpm = null,
  register = null,
  density_bias = null,
  rhythm_grid = null,
  chord_shape = null,
  bass_pattern_pool = null,
  phase_distribution = null,
}) {
  // ...
}
```

If `bpm` is null, fall back to `globalPlan.bpm` (M1b behaviour).

- [ ] **Step 2: Use new params when creating worldState**

Replace the existing `createWorldState({...})` call (M1b shape) with:

```js
const effectiveBpm = bpm ?? globalPlan.bpm;

const state = createWorldState({
  role,
  totalBars,
  bpm: effectiveBpm,
  key: globalPlan.key,
  mode: globalPlan.mode,
  intensity,
  scale: deriveScale(globalPlan.key, globalPlan.mode),
  root:  deriveRoot(globalPlan.key),
  gesture,
  substance,
  chordShape:        chord_shape || "cyclic_short",
  bassPatternPool:   bass_pattern_pool || ["default"],
  drumGroove:        "4_on_floor_dry",
  densityBias:       density_bias,
  phaseDistribution: phase_distribution,
});
```

Note `effectiveBpm` is also used in `beatsPerSec` and `totalBars` calculations — make sure those use `effectiveBpm` not `globalPlan.bpm`.

- [ ] **Step 3: Override register if provided**

After `createWorldState`, add:

```js
if (register) {
  state.register = register;
}
```

- [ ] **Step 4: Apply density bias inside `seedBudgetsFromIntensity`**

Modify `seedBudgetsFromIntensity(s)` so it accepts an optional `bias` arg:

```js
function seedBudgetsFromIntensity(s, bias = null) {
  const I = s.intensity;
  const baseDensity = {
    rhythm:  Math.min(0.9, 0.2 + I * 0.7),
    harmony: Math.min(0.8, 0.2 + I * 0.6),
    bass:    Math.min(0.8, 0.2 + I * 0.6),
    melody:  Math.min(0.8, 0.1 + I * 0.7),
    texture: Math.min(0.6, 0.1 + I * 0.5),
  };
  if (bias) {
    for (const role of Object.keys(baseDensity)) {
      const b = bias[role];
      if (typeof b === "number") {
        baseDensity[role] = Math.max(0, Math.min(0.95, baseDensity[role] + b));
      }
      // Note: { from, to } interpolation across phaseProgress is applied per-bar
      // in tickBar (see Step 6); here we set the static start value.
      else if (b && typeof b.from === "number") {
        baseDensity[role] = Math.max(0, Math.min(0.95, b.from));
      }
    }
  }
  s.density = baseDensity;
  const V = 70 + Math.floor(I * 40);
  s.velocityCeiling = {
    rhythm: V, harmony: V - 10, bass: V, melody: V + 5, texture: Math.min(90, V - 15),
  };
}
```

- [ ] **Step 5: Use M1c rhythm_grid inside resetState**

In `resetState()`, replace the M1b hardcoded `[1,0,0,0, 1,0,0,0, ...]` rhythm grid with:

```js
state.rhythmGrid = rhythm_grid !== undefined && rhythm_grid !== null
  ? rhythm_grid
  : [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]; // M1b fallback
```

(The variable is captured from `createSongDirector`'s destructure.)

- [ ] **Step 6: Apply density bias interpolation per-bar in `tickBar`**

Modify `tickBar(barIndex)` so that, before delegating to the bundle, it interpolates `{from,to}` density biases based on current `state.phaseProgress`:

```js
function tickBar(barIndex) {
  if (barIndex < 0 || barIndex >= totalBars) return [];
  if (_bundle === null) resetState();
  advanceWorldState(state, barIndex);

  // M1c-α: if density_bias is { from, to }, interpolate across phaseProgress.
  if (density_bias) {
    for (const [role, b] of Object.entries(density_bias)) {
      if (b && typeof b === "object" && typeof b.from === "number" && typeof b.to === "number") {
        const t = state.phaseProgress;
        // Recalculate base from intensity then add interpolated bias
        const I = state.intensity;
        const baseMap = {
          rhythm: 0.2 + I * 0.7, harmony: 0.2 + I * 0.6,
          bass:   0.2 + I * 0.6, melody:  0.1 + I * 0.7,
          texture: 0.1 + I * 0.5,
        };
        const interp = b.from + (b.to - b.from) * t;
        state.density[role] = Math.max(0, Math.min(0.95, baseMap[role] + interp));
      }
    }
  }

  return _bundle.generateBar(barIndex);
}
```

- [ ] **Step 7: Pass `phase_distribution` into `mapPhase` via `createRealComposers` integration**

`createRealComposers` (Task 11 of M1b) calls `mapPhase(worldState.role, worldState.phaseProgress)` internally to set `worldState.phase`. We need the gesture-aware override.

Open `/Users/Edo_1/album-gen/src/composers/composer-harness.js` and find the `generateBar` function where `worldState.phase = mapPhase(...)` is called. Modify:

```js
// before
worldState.phase = mapPhase(worldState.role, worldState.phaseProgress);
// after
worldState.phase = mapPhase(
  worldState.role,
  worldState.phaseProgress,
  worldState.phaseDistribution
);
```

- [ ] **Step 8: Run full suite**

Run: `cd /Users/Edo_1/album-gen && npm test`
Expected: all 19+ tests green. If `pipeline.test.js` (determinism) fails because the M1b album now produces a different event count: that's expected, update the count snapshot but ensure the 3 runs are bit-identical. If `song-director.test.js` Test 6 (intensity monotonicity) fails: density_bias is null in M1b legacy → bias path skipped → monotonicity preserved.

- [ ] **Step 9: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/core/song-director.js src/composers/composer-harness.js
git commit -m "feat(m1c-α): song-director applies M1c per-song mapping fields"
```

---

## Task 13: Extend `config-loader.js` with `applyM1cDefaults`

**Files:**
- Modify: `/Users/Edo_1/album-gen/src/core/config-loader.js`

- [ ] **Step 1: Add `applyM1cDefaults` function**

In `/Users/Edo_1/album-gen/src/core/config-loader.js`, append (after the existing exports):

```js
/**
 * M1c-α: ensure every album has the M1c fields with safe defaults.
 * Backward-compat with M1b yaml that lacks album_setup / per-song gesture/substance.
 */
export function applyM1cDefaults(album) {
  album.album_setup = album.album_setup || { substance: "_default", arc: "custom", substance_overrides: {} };
  for (const song of album.songs) {
    song.gesture   = song.gesture   ?? "THRUM";
    song.substance = song.substance ?? album.album_setup.substance;
    song.bpm       = song.bpm       ?? album.global.bpm;
  }
  return album;
}
```

- [ ] **Step 2: Call it in `loadAlbum` and `parseAlbum`**

Find both `loadAlbum` (Node-only, uses `node:fs/promises` dynamic import) and `parseAlbum` (browser-safe). Add a final `applyM1cDefaults` call before returning:

```js
// in loadAlbum (after parsing yaml):
const album = yaml.load(text);
return applyM1cDefaults(album);

// in parseAlbum:
const album = yaml.load(text);
return applyM1cDefaults(album);
```

- [ ] **Step 3: Run all tests including pipeline**

Run: `npm test`
Expected: all green. The pipeline.test.js loads `albums/album-001.yaml` which is M1b shape; with `applyM1cDefaults` it now has `_default` substance + `THRUM` gesture per song.

- [ ] **Step 4: Update or add a config-loader test for the migration**

Open `/Users/Edo_1/album-gen/test/config-loader.test.js`. Add at the bottom:

```js
// M1c-α: applyM1cDefaults runs on legacy M1b yaml
import { applyM1cDefaults } from "../src/core/config-loader.js";

const legacy = {
  global: { bpm: 96, key: "D", mode: "dorian", seed: 0x1 },
  songs: [
    { id: "a", role: "opener", duration_sec: 100, intensity: 0.5, seed: 0x10 },
  ],
};
applyM1cDefaults(legacy);
assert.equal(legacy.album_setup.substance, "_default");
assert.equal(legacy.songs[0].gesture, "THRUM");
assert.equal(legacy.songs[0].substance, "_default");
assert.equal(legacy.songs[0].bpm, 96);
console.log("✓ applyM1cDefaults backfill");
```

- [ ] **Step 5: Run full suite + commit**

```bash
cd /Users/Edo_1/album-gen
npm test                                         # all green
git add src/core/config-loader.js test/config-loader.test.js
git commit -m "feat(m1c-α): applyM1cDefaults for backward-compat with M1b yaml"
```

---

## Task 14: Integration test — hand-edited M1c album

Verify a hand-written `album-002.yaml` with M1c fields produces 5 distinct songs.

**Files:**
- Create: `/Users/Edo_1/album-gen/albums/album-002.yaml`
- Create: `/Users/Edo_1/album-gen/test/mapping-m1c-integration.test.js`

- [ ] **Step 1: Hand-write a test album with M1c fields**

Write `/Users/Edo_1/album-gen/albums/album-002.yaml`:

```yaml
tool_version: "0.4.0-M1c-alpha"
title: "M1c integration smoke"
created: 2026-04-25
generator: manual

global:
  seed: 0xCAFE
  bpm:  96
  key:  "D"
  mode: "dorian"
  duration_min: 30

album_setup:
  substance: HAZE
  arc: ONDA
  substance_overrides:
    climax: JOLT

songs:
  - id: opener
    role: opener
    gesture: DRIFT
    substance: HAZE
    duration_sec: 240
    intensity: 0.35
    seed: 0xA001
    bpm: 53
  - id: dev_a
    role: development
    gesture: LOOM
    substance: HAZE
    duration_sec: 220
    intensity: 0.55
    seed: 0xA002
    bpm: 82
  - id: dev_b
    role: development
    gesture: CREST
    substance: HAZE
    duration_sec: 200
    intensity: 0.70
    seed: 0xA003
    bpm: 106
  - id: climax
    role: climax
    gesture: FAULT
    substance: JOLT
    duration_sec: 160
    intensity: 0.90
    seed: 0xA004
    bpm: 86
  - id: outro
    role: outro
    gesture: DRIFT
    substance: HAZE
    duration_sec: 240
    intensity: 0.25
    seed: 0xA005
    bpm: 53

instruments:
  drone:   { synth: drone,   default_amp: 0.3 }
  bass:    { synth: bass,    default_amp: 0.4 }
  kick:    { synth: kick,    default_amp: 0.7 }
  snare:   { synth: snare,   default_amp: 0.5 }
  hat:     { synth: hat,     default_amp: 0.3 }
  lead:    { synth: lead,    default_amp: 0.45 }
  pad:     { synth: pad,     default_amp: 0.25 }
  perc:    { synth: perc,    default_amp: 0.4 }
  texture: { synth: texture, default_amp: 0.2 }
```

The album-director and song-director need to be passed the M1c per-song fields. Verify your `album-director.js` plumbs them through (M1b passed only `id, role, duration_sec, character, intensity, seed, globalPlan` — extend to forward `gesture, substance, bpm` and the rest).

- [ ] **Step 2: Modify `album-director.js` to forward M1c fields**

Open `/Users/Edo_1/album-gen/src/core/album-director.js`. Find the loop where it constructs each song director from `cfg.songs[i]`. Add the M1c fields to the call:

```js
return createSongDirector({
  id, role, duration_sec, character, intensity, seed, globalPlan,
  // M1c
  gesture:            song.gesture,
  substance:          song.substance,
  bpm:                song.bpm,
  register:           song.register,
  density_bias:       song.density_bias,
  rhythm_grid:        song.rhythm_grid,
  chord_shape:        song.chord_shape,
  bass_pattern_pool:  song.bass_pattern_pool,
  phase_distribution: song.phase_distribution,
});
```

If the existing album-director uses `Object.fromEntries` or similar, simply spread `...song` after the explicit fields.

- [ ] **Step 3: Write the integration test**

Write `/Users/Edo_1/album-gen/test/mapping-m1c-integration.test.js`:

```js
import assert from "node:assert/strict";
import { loadAlbum } from "../src/core/config-loader.js";
import { createAlbumDirector } from "../src/core/album-director.js";

const album = await loadAlbum("albums/album-002.yaml");
const director = createAlbumDirector(album);

const eventsBySong = director.songs.map((s, i) => ({
  id: s.id,
  events: s.generateAll(),
}));

// 1. Each song has at least 100 events
for (const { id, events } of eventsBySong) {
  assert.ok(events.length >= 100, `song ${id} has only ${events.length} events`);
}

// 2. Songs are NOT all the same — pairwise event counts differ
const counts = eventsBySong.map(s => s.events.length);
const distinct = new Set(counts);
assert.ok(distinct.size >= 3, `expected variation in event counts, got ${counts}`);

// 3. The climax song (substance JOLT) has different instrument distribution
const climaxInstruments = new Set(eventsBySong[3].events.map(e => e.instrument));
const openerInstruments = new Set(eventsBySong[0].events.map(e => e.instrument));
// Climax should include kick/bass at least; opener (DRIFT) might not have kick.
assert.ok(climaxInstruments.has("kick"), "climax should have kick (FAULT × JOLT)");

// 4. Determinism: full pipeline reproduces identically
function runPipeline() {
  const a = director.songs.map(s => s.generateAll().length);
  return a;
}
assert.deepEqual(runPipeline(), counts, "pipeline non-deterministic");

console.log(`✓ M1c integration  songs: ${counts.join("/")} events`);
```

- [ ] **Step 4: Run the test**

Run: `cd /Users/Edo_1/album-gen && node test/mapping-m1c-integration.test.js`

Expected output something like `✓ M1c integration  songs: 320/810/1100/450/280 events` (numbers will vary). The key assertion is that counts are not identical and that climax has kick.

If the test fails because some song has 0 events or all songs identical: trace which mapping field isn't propagated. Likely culprit: album-director doesn't pass new fields to song-director (Step 2).

- [ ] **Step 5: Run full suite**

Run: `npm test`
Expected: all 22+ tests green.

- [ ] **Step 6: Commit**

```bash
cd /Users/Edo_1/album-gen
git add albums/album-002.yaml src/core/album-director.js test/mapping-m1c-integration.test.js
git commit -m "feat(m1c-α): integration smoke — album-002 with M1c fields produces distinct songs"
```

---

## Task 15: README + tag

**Files:**
- Modify: `/Users/Edo_1/album-gen/README.md`

- [ ] **Step 1: Update README status section**

Replace the M1c line in the Status section:

```markdown
- ✅ **M0 — Foundations**
- ✅ **M1a — Live audio stack**
- ✅ **M1b — Real composer fork**
- ✅ **M1c-α — Compositional mapping layer (`v0.4.0-M1c-alpha`)** — substance × gesture vocabulary, mode-relative chord shapes, bass pattern pools, gesture-aware phase distribution; album.yaml now supports per-song `gesture` and `substance` for sensible per-song variation.
- ⏳ M1c-β — Tarot setup screen
- ⏳ M1c-γ — Expression engine 2-level
- ⏳ M1c-δ — Sound Lab CLI + agent
- ⏳ M1c-ε — Substance population
- ⏳ M2 — PARTITURA
```

- [ ] **Step 2: Commit + tag**

```bash
cd /Users/Edo_1/album-gen
git add README.md
git commit -m "docs(m1c-α): README status update"
git tag v0.4.0-M1c-alpha
```

---

## Risk register

| Risk | Mitigation |
|---|---|
| Existing M1b composer-harness test (composer-harness.test.js) fails because it doesn't set `worldState.phaseDistribution` | Default to null in createWorldState; Task 9 fall-back logic in mapPhase handles null. Test should pass unchanged. |
| Top-level `await loadChordShapes()` in harmony.js delays module load | Acceptable — sub-millisecond YAML parse cost. Caches once. |
| M1b harmony.test.js asserts a specific event count that drifts | Update snapshot inline. The shape `cyclic_short` produces 4 chords vs SOLCO's 8, so cycle is shorter — count likely drops. Document the new value in test and commit. |
| `bass-v3.js` test fails because pool default differs from SOLCO | `BASS_PATTERNS.default` IS the SOLCO pattern verbatim. Should be byte-identical to M1b output for the test scenario. |
| `pipeline.test.js` (determinism) fails because new RNG calls (chord-shape resolution, bass-pool pick) change derivation | Verify bit-identical across 3 runs. Snapshots need updating but byte-equality across runs should hold (all RNG via `SeededRNG` derived from per-song seed). |
| Engineer accidentally introduces `Math.random()` somewhere new | None new are introduced in this plan; the bass-pool pick uses `rng.next()` from per-song seed. |
| Density bias `{from,to}` interpolation breaks monotonicity in song-director Test 6 | The legacy intensity test uses M1b shape (no density_bias) → density_bias is null → interpolation skipped → monotonicity preserved. |

---

## Self-review

**1. Spec coverage:**
- Section 4.1 (substance presets YAML) → Task 2
- Section 4.2 (gesture presets YAML) → Task 3
- Section 4.3 (arc presets YAML) → Task 4
- Section 4.4 (chord shapes mode-relative) → Tasks 4 + 5
- Section 4.5 (mapAlbum algorithm) → Task 7
- Section 4.6 (chord shape engine in harmony.js) → Task 10
- Section 4.7 (bass pool in bass-v3.js) → Tasks 6 + 11
- Section 6.2 (applyM1cDefaults backward-compat) → Task 13
- worldState extensions → Task 8
- phase-map gesture-aware → Task 9
- song-director M1c plumbing → Task 12
- album-director plumbing → Task 14 Step 2
- integration smoke → Task 14
- determinism preserved → Tasks 12 + 14

All M1c-α spec requirements covered.

**2. Placeholder scan:**
- No "TBD" / "TODO" / "similar to" entries.
- Snapshot updates for harmony / bass tests are described as "update inline if drifts" — that's a known acceptable pattern (M1b plan also did this).

**3. Type consistency:**
- `mapAlbum` returns `{ tool_version, title, created, generator, global, album_setup, songs[], instruments }` — matches `applyM1cDefaults` and `album-director` expectations.
- `worldState` field names: `chordShape`, `bassPatternPool` (camelCase) consistent across world-state.js / harmony.js / bass-v3.js.
- YAML fields: `chord_shape`, `bass_pattern_pool` (snake_case in YAML, camelCase in JS) — `applyM1cDefaults` doesn't transform; song-director destructure does the mapping.
- `mapPhase` signature: `(role, phaseProgress, distribution?)` — used consistently by composer-harness Task 12 Step 7 and the test in Task 9.
