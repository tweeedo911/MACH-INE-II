# album-gen M0 — Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic, audio-free, visual-free foundation of album-gen. After M0, running `node bin/album-gen albums/album-001.yaml` produces 5 arrays of MIDI events (one per song) that are byte-identical for a given seed. All determinism tests pass.

**Architecture:** Pure JS ES modules, cross-env (Node + browser compatible). `album-director` reads YAML config, derives a seed tree, instantiates 5 `song-director` instances with fixed roles (opener/development/development/climax/outro). Each `song-director` calls a stub composer to produce events for each bar. SHA256-derived seeds guarantee reproducibility. Stub composers stand in for real MACH:INE composer forks (arriving in M1).

**Tech Stack:** Node.js 20+, `js-yaml`, built-in `crypto` for SHA256, node built-in `assert` for tests. Zero build step. Zero dev dependencies.

**Reference spec:** [2026-04-20-album-gen-design.md](../specs/2026-04-20-album-gen-design.md)

---

## File Structure

**New repo at:** `/Users/Edo_1/album-gen/`

Files created in this plan:

```
album-gen/
├── .gitignore
├── README.md
├── package.json
├── albums/
│   └── album-001.yaml                 # minimal example config
├── src/
│   ├── shared/
│   │   ├── perf-utils.js              # SeededRNG (copied from MACH:INE)
│   │   └── world-state.js             # per-song state (bounded, 3-phase)
│   ├── core/
│   │   ├── seed-manager.js            # SHA256 seed derivation
│   │   ├── config-loader.js           # YAML parse + validate
│   │   ├── song-director.js           # bounded compositional director
│   │   └── album-director.js          # thin coordinator
│   └── composers/
│       └── stub-composer.js           # placeholder (real composers in M1)
├── bin/
│   └── album-gen.js                   # CLI entry point
└── test/
    ├── all.js                         # test runner
    ├── seed-manager.test.js
    ├── config-loader.test.js
    ├── song-director.test.js
    └── album-director.test.js
```

**Vendor snapshot** (not imported — reference only, populated in Task 1):
```
vendor/machine/                        # read-only snapshot of MACH:INE v3.18
```

---

## Task 1: Repo init + vendor snapshot

**Files:**
- Create: `/Users/Edo_1/album-gen/.gitignore`
- Create: `/Users/Edo_1/album-gen/README.md`
- Create: `/Users/Edo_1/album-gen/package.json`
- Create: `/Users/Edo_1/album-gen/vendor/machine/` (snapshot)

- [ ] **Step 1: Create the repo directory and init git**

```bash
mkdir -p /Users/Edo_1/album-gen
cd /Users/Edo_1/album-gen
git init
git branch -m main
```

Expected: `Initialized empty Git repository in /Users/Edo_1/album-gen/.git/`

- [ ] **Step 2: Create `.gitignore`**

Write the file `/Users/Edo_1/album-gen/.gitignore` with:

```
node_modules/
out/
.DS_Store
*.log
vendor/machine/
```

Note: `vendor/machine/` is gitignored — it's a working snapshot, not part of album-gen history.

- [ ] **Step 3: Create `README.md`**

Write `/Users/Edo_1/album-gen/README.md` with:

```markdown
# album-gen

Generative 5-song album tool. SuperCollider audio, event-driven visual (PARTITURA).

**Status:** M0 (foundations). No audio yet, no visual yet.

**Design:** see `docs/superpowers/specs/2026-04-20-album-gen-design.md` in the MACH:INE repo.

## Run

```bash
npm install
node bin/album-gen.js albums/album-001.yaml
```

Output: prints event counts per song to stdout. Verifies determinism.
```

- [ ] **Step 4: Create `package.json`**

Write `/Users/Edo_1/album-gen/package.json`:

```json
{
  "name": "album-gen",
  "version": "0.1.0-M0",
  "description": "Generative 5-song album tool (M0: foundations)",
  "type": "module",
  "private": true,
  "bin": {
    "album-gen": "./bin/album-gen.js"
  },
  "scripts": {
    "test": "node test/all.js",
    "start": "node bin/album-gen.js albums/album-001.yaml"
  },
  "dependencies": {
    "js-yaml": "^4.1.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 5: Install dependencies**

Run:

```bash
cd /Users/Edo_1/album-gen && npm install
```

Expected: `added 1 package` (just js-yaml). `package-lock.json` created.

- [ ] **Step 6: Populate vendor/machine snapshot**

Create working snapshot of MACH:INE v3.18 source for reference (NOT imported by code):

```bash
mkdir -p /Users/Edo_1/album-gen/vendor/machine
cp -R "/Users/Edo_1/MACH-INE II/app/src" /Users/Edo_1/album-gen/vendor/machine/src
cp "/Users/Edo_1/MACH-INE II/app/docs/STATUS.md" /Users/Edo_1/album-gen/vendor/machine/STATUS-v3.18.md
```

Expected: `vendor/machine/src/` populated with MACH:INE modules. No errors.

- [ ] **Step 7: Initial commit**

```bash
cd /Users/Edo_1/album-gen
git add .gitignore README.md package.json package-lock.json
git commit -m "chore: init album-gen (M0 foundations)"
```

Expected: `[main (root-commit) <hash>] chore: init album-gen (M0 foundations)`. Note: `vendor/machine/` is gitignored, not committed.

---

## Task 2: SeededRNG shared utility

**Files:**
- Create: `/Users/Edo_1/album-gen/src/shared/perf-utils.js`
- Test: `/Users/Edo_1/album-gen/test/seed-manager.test.js` (we'll use this test file to verify SeededRNG too)

Copy SeededRNG from MACH:INE vendor snapshot and verify it still works standalone.

- [ ] **Step 1: Copy perf-utils.js from vendor**

Run:

```bash
cp /Users/Edo_1/album-gen/vendor/machine/src/perf-utils.js /Users/Edo_1/album-gen/src/shared/perf-utils.js
```

Expected: file copied.

- [ ] **Step 2: Verify SeededRNG exports work**

Read the copied file:

```bash
head -40 /Users/Edo_1/album-gen/src/shared/perf-utils.js
```

Expected: see `export class SeededRNG` or `export function SeededRNG` near the top. If it uses `module.exports` instead, convert to ES module syntax (we're using `"type": "module"` in package.json).

- [ ] **Step 3: Write smoke test for SeededRNG**

Create `/Users/Edo_1/album-gen/test/seed-manager.test.js` with an initial smoke test:

```javascript
import assert from "node:assert/strict";
import { SeededRNG } from "../src/shared/perf-utils.js";

// Test 1: same seed produces same sequence
const a = new SeededRNG(42);
const b = new SeededRNG(42);
const seqA = [a.next(), a.next(), a.next(), a.next(), a.next()];
const seqB = [b.next(), b.next(), b.next(), b.next(), b.next()];
assert.deepEqual(seqA, seqB, "SeededRNG: same seed → same sequence");

// Test 2: different seeds produce different sequences
const c = new SeededRNG(43);
const seqC = [c.next(), c.next(), c.next(), c.next(), c.next()];
assert.notDeepEqual(seqA, seqC, "SeededRNG: different seeds → different sequences");

// Test 3: returns floats in [0, 1)
const rng = new SeededRNG(1);
for (let i = 0; i < 1000; i++) {
  const v = rng.next();
  assert.ok(v >= 0 && v < 1, `SeededRNG.next() out of [0,1): ${v}`);
}

console.log("✓ seed-manager.test.js (SeededRNG smoke tests passed)");
```

- [ ] **Step 4: Run the test**

```bash
cd /Users/Edo_1/album-gen && node test/seed-manager.test.js
```

Expected: `✓ seed-manager.test.js (SeededRNG smoke tests passed)`. If the export shape doesn't match (e.g., `SeededRNG` not exported by name), adjust the import in the test OR convert `perf-utils.js` to export it by name. Re-run until green.

- [ ] **Step 5: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/shared/perf-utils.js test/seed-manager.test.js
git commit -m "feat(shared): port SeededRNG from MACH:INE v3.18"
```

---

## Task 3: seed-manager (SHA256 derivation)

**Files:**
- Create: `/Users/Edo_1/album-gen/src/core/seed-manager.js`
- Modify: `/Users/Edo_1/album-gen/test/seed-manager.test.js` (add derivation tests)

- [ ] **Step 1: Write the failing test for `deriveSongSeed`**

Append to `/Users/Edo_1/album-gen/test/seed-manager.test.js`:

```javascript
import { deriveSongSeed, deriveComposerSeed } from "../src/core/seed-manager.js";

// Test 4: same global seed + index → same song seed
const s1 = deriveSongSeed(0x9C42, 0);
const s2 = deriveSongSeed(0x9C42, 0);
assert.equal(s1, s2, "deriveSongSeed: deterministic");

// Test 5: different indices → different seeds
const s3 = deriveSongSeed(0x9C42, 1);
assert.notEqual(s1, s3, "deriveSongSeed: indices produce different seeds");

// Test 6: result is uint32
assert.ok(s1 >= 0 && s1 <= 0xFFFFFFFF, "deriveSongSeed: result is uint32");
assert.equal(Number.isInteger(s1), true, "deriveSongSeed: result is integer");

// Test 7: deriveComposerSeed is deterministic
const c1 = deriveComposerSeed(s1, "rhythm");
const c2 = deriveComposerSeed(s1, "rhythm");
assert.equal(c1, c2, "deriveComposerSeed: deterministic");

// Test 8: different composer names → different seeds
const c3 = deriveComposerSeed(s1, "harmony");
assert.notEqual(c1, c3, "deriveComposerSeed: names produce different seeds");

console.log("✓ seed-manager.test.js (derivation tests passed)");
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/Edo_1/album-gen && node test/seed-manager.test.js
```

Expected: FAIL — error like `Cannot find module '.../src/core/seed-manager.js'`.

- [ ] **Step 3: Implement seed-manager.js**

Create `/Users/Edo_1/album-gen/src/core/seed-manager.js`:

```javascript
import { createHash } from "node:crypto";

/**
 * Derive a uint32 from hashing (input + salt).
 * Uses SHA256, takes first 4 bytes, interprets as little-endian uint32.
 */
function hashToU32(input, salt) {
  const h = createHash("sha256");
  h.update(String(input));
  h.update(":");
  h.update(salt);
  const buf = h.digest();
  // first 4 bytes as uint32 LE
  return (buf[0] | (buf[1] << 8) | (buf[2] << 16) | (buf[3] << 24)) >>> 0;
}

/**
 * Given a global seed and a song index (0..4), return a deterministic uint32
 * song seed. Same (globalSeed, i) always produces same result.
 */
export function deriveSongSeed(globalSeed, i) {
  return hashToU32(globalSeed, `song:${i}`);
}

/**
 * Given a song seed and a composer name, return a deterministic uint32
 * composer seed.
 */
export function deriveComposerSeed(songSeed, composerName) {
  return hashToU32(songSeed, `composer:${composerName}`);
}

/**
 * Build the full seed tree for an album given a global seed.
 * Returns { songs: [{ song, composers: {rhythm, harmony, bass, melody, texture} }, ...] }
 */
export function buildSeedTree(globalSeed, songCount = 5) {
  const composers = ["rhythm", "harmony", "bass", "melody", "texture"];
  const songs = [];
  for (let i = 0; i < songCount; i++) {
    const songSeed = deriveSongSeed(globalSeed, i);
    const composerSeeds = {};
    for (const c of composers) {
      composerSeeds[c] = deriveComposerSeed(songSeed, c);
    }
    songs.push({ song: songSeed, composers: composerSeeds });
  }
  return { global: globalSeed, songs };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/Edo_1/album-gen && node test/seed-manager.test.js
```

Expected: both "SeededRNG smoke tests passed" and "derivation tests passed" print. Exit code 0.

- [ ] **Step 5: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/core/seed-manager.js test/seed-manager.test.js
git commit -m "feat(core): seed-manager with SHA256 derivation"
```

---

## Task 4: Minimal album-001.yaml example

**Files:**
- Create: `/Users/Edo_1/album-gen/albums/album-001.yaml`

- [ ] **Step 1: Create the example album config**

Create `/Users/Edo_1/album-gen/albums/album-001.yaml`:

```yaml
tool_version: "0.1.0-M0"
title: "Test album"
author: "edo"
created: 2026-04-20
notes: |
  Minimal test config for M0 foundations.

global:
  seed: 0x9C42
  bpm: 96
  key: "D"
  mode: "dorian"

songs:
  - id: opener
    role: opener
    duration_sec: 180
    character: "sospeso"
    intensity: 0.35
    seed: 0x4A3F
  - id: dev_a
    role: development
    duration_sec: 240
    character: "ricerca"
    intensity: 0.55
  - id: dev_b
    role: development
    duration_sec: 240
    character: "insistenza"
    intensity: 0.70
  - id: climax
    role: climax
    duration_sec: 300
    character: "slancio"
    intensity: 0.95
  - id: outro
    role: outro
    duration_sec: 210
    character: "dissoluzione"
    intensity: 0.25

instruments:
  drone:   { synth: drone,   bus: 0, default_amp: 0.3 }
  bass:    { synth: bass,    bus: 0, default_amp: 0.4 }
  kick:    { synth: kick,    bus: 0, default_amp: 0.7 }
  snare:   { synth: snare,   bus: 0, default_amp: 0.5 }
  hat:     { synth: hat,     bus: 0, default_amp: 0.3 }
  lead:    { synth: lead,    bus: 0, default_amp: 0.45 }
  pad:     { synth: pad,     bus: 0, default_amp: 0.25 }
  perc:    { synth: perc,    bus: 0, default_amp: 0.4 }
  texture: { synth: texture, bus: 0, default_amp: 0.2 }
```

- [ ] **Step 2: Commit**

```bash
cd /Users/Edo_1/album-gen
git add albums/album-001.yaml
git commit -m "chore(albums): minimal album-001.yaml example"
```

---

## Task 5: config-loader (parse + validate)

**Files:**
- Create: `/Users/Edo_1/album-gen/src/core/config-loader.js`
- Create: `/Users/Edo_1/album-gen/test/config-loader.test.js`

- [ ] **Step 1: Write the failing test**

Create `/Users/Edo_1/album-gen/test/config-loader.test.js`:

```javascript
import assert from "node:assert/strict";
import { loadAlbum, validateAlbum } from "../src/core/config-loader.js";

// Test 1: load real example
const cfg = await loadAlbum("./albums/album-001.yaml");
assert.equal(cfg.title, "Test album");
assert.equal(cfg.songs.length, 5);
assert.equal(cfg.songs[0].role, "opener");
assert.equal(cfg.songs[4].role, "outro");

// Test 2: validateAlbum passes on good config
validateAlbum(cfg);  // throws on error

// Test 3: validation fails on wrong song count
const badSongs = { ...cfg, songs: cfg.songs.slice(0, 3) };
assert.throws(() => validateAlbum(badSongs), /exactly 5 songs/);

// Test 4: validation fails on wrong role order
const badRoles = {
  ...cfg,
  songs: [
    { ...cfg.songs[0], role: "climax" },
    ...cfg.songs.slice(1)
  ]
};
assert.throws(() => validateAlbum(badRoles), /role order/);

// Test 5: validation fails on duration out of range
const badDur = {
  ...cfg,
  songs: cfg.songs.map((s, i) => i === 0 ? { ...s, duration_sec: 30 } : s)
};
assert.throws(() => validateAlbum(badDur), /duration_sec/);

// Test 6: validation fails on unknown instruments_active reference
const badInst = {
  ...cfg,
  songs: cfg.songs.map((s, i) =>
    i === 0 ? { ...s, instruments_active: ["does_not_exist"] } : s)
};
assert.throws(() => validateAlbum(badInst), /instruments_active/);

console.log("✓ config-loader.test.js");
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/Edo_1/album-gen && node test/config-loader.test.js
```

Expected: FAIL — `Cannot find module '../src/core/config-loader.js'`.

- [ ] **Step 3: Implement config-loader.js**

Create `/Users/Edo_1/album-gen/src/core/config-loader.js`:

```javascript
import { readFile } from "node:fs/promises";
import yaml from "js-yaml";

const EXPECTED_ROLES = ["opener", "development", "development", "climax", "outro"];
const VALID_MODES = ["dorian", "aeolian", "phrygian", "major", "minor", "lydian", "mixolydian"];
const MIN_DURATION = 60;
const MAX_DURATION = 600;

/**
 * Load an album YAML file, parse, and validate.
 * Returns the validated config object.
 */
export async function loadAlbum(path) {
  const raw = await readFile(path, "utf8");
  const cfg = yaml.load(raw);
  validateAlbum(cfg);
  return cfg;
}

/**
 * Validate album config structure. Throws Error with clear message on failure.
 */
export function validateAlbum(cfg) {
  if (!cfg || typeof cfg !== "object") {
    throw new Error("album config must be an object");
  }

  if (!Array.isArray(cfg.songs)) {
    throw new Error("album config: songs must be an array");
  }
  if (cfg.songs.length !== 5) {
    throw new Error(`album config: exactly 5 songs required, got ${cfg.songs.length}`);
  }

  // role order check
  for (let i = 0; i < 5; i++) {
    const song = cfg.songs[i];
    if (song.role !== EXPECTED_ROLES[i]) {
      throw new Error(
        `album config: role order violation at song ${i}: ` +
        `expected "${EXPECTED_ROLES[i]}", got "${song.role}"`
      );
    }
  }

  // duration range check
  for (let i = 0; i < 5; i++) {
    const song = cfg.songs[i];
    if (typeof song.duration_sec !== "number" ||
        song.duration_sec < MIN_DURATION ||
        song.duration_sec > MAX_DURATION) {
      throw new Error(
        `album config: song ${i} (${song.id}): duration_sec must be in [${MIN_DURATION}, ${MAX_DURATION}], ` +
        `got ${song.duration_sec}`
      );
    }
  }

  // mode check (if set)
  if (cfg.global?.mode && !VALID_MODES.includes(cfg.global.mode) && !cfg.global.scale) {
    throw new Error(
      `album config: global.mode "${cfg.global.mode}" not recognized ` +
      `(valid: ${VALID_MODES.join(", ")}) and no scale provided`
    );
  }

  // instruments_active references exist
  if (cfg.instruments) {
    const knownInst = new Set(Object.keys(cfg.instruments));
    for (let i = 0; i < 5; i++) {
      const song = cfg.songs[i];
      if (song.instruments_active) {
        for (const name of song.instruments_active) {
          if (!knownInst.has(name)) {
            throw new Error(
              `album config: song ${i} (${song.id}): instruments_active references ` +
              `unknown instrument "${name}" (known: ${[...knownInst].join(", ")})`
            );
          }
        }
      }
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/Edo_1/album-gen && node test/config-loader.test.js
```

Expected: `✓ config-loader.test.js`. Exit 0.

- [ ] **Step 5: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/core/config-loader.js test/config-loader.test.js
git commit -m "feat(core): config-loader with strict validation"
```

---

## Task 6: world-state (per-song, 3-phase)

**Files:**
- Create: `/Users/Edo_1/album-gen/src/shared/world-state.js`

World-state is lightweight compared to MACH:INE. For M0 we just need a simple object representing per-song state that composers can read.

- [ ] **Step 1: Create world-state.js**

Create `/Users/Edo_1/album-gen/src/shared/world-state.js`:

```javascript
/**
 * Per-song world state. Bounded to the lifetime of one song.
 * Reset fresh for each song. Not shared across songs.
 *
 * Phases (simplified vs MACH:INE's 5): intro / body / end
 * - intro:  first ~15% of bars
 * - body:   middle ~70%
 * - end:    final ~15%
 */

export function createWorldState({ role, totalBars, bpm, key, mode, intensity }) {
  return {
    role,                    // opener | development | climax | outro
    totalBars,
    bpm,
    key,
    mode,
    intensity,               // 0..1, target energy
    currentBar: 0,
    phase: "intro",          // intro | body | end
    phaseProgress: 0,        // 0..1 within current phase
    energy: 0,               // rolling, updated by composers
  };
}

/**
 * Update phase + phaseProgress based on currentBar.
 * Called by song-director at the start of each bar.
 */
export function advanceWorldState(state, bar) {
  state.currentBar = bar;
  const t = bar / state.totalBars;  // 0..1 overall progress
  const INTRO_END = 0.15;
  const BODY_END = 0.85;

  if (t < INTRO_END) {
    state.phase = "intro";
    state.phaseProgress = t / INTRO_END;
  } else if (t < BODY_END) {
    state.phase = "body";
    state.phaseProgress = (t - INTRO_END) / (BODY_END - INTRO_END);
  } else {
    state.phase = "end";
    state.phaseProgress = (t - BODY_END) / (1 - BODY_END);
  }
  return state;
}
```

- [ ] **Step 2: Smoke test inline**

No separate test file yet (covered via song-director tests in Task 8). Just verify it imports cleanly:

```bash
cd /Users/Edo_1/album-gen && node -e "import('./src/shared/world-state.js').then(m => console.log('keys:', Object.keys(m)))"
```

Expected: `keys: [ 'createWorldState', 'advanceWorldState' ]`.

- [ ] **Step 3: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/shared/world-state.js
git commit -m "feat(shared): per-song world-state with 3-phase model"
```

---

## Task 7: stub-composer (deterministic placeholder)

**Files:**
- Create: `/Users/Edo_1/album-gen/src/composers/stub-composer.js`

A minimal composer that produces deterministic events per bar. Used in M0 to exercise the pipeline end-to-end. Real composers (forked from MACH:INE) arrive in M1.

- [ ] **Step 1: Create stub-composer.js**

Create `/Users/Edo_1/album-gen/src/composers/stub-composer.js`:

```javascript
import { SeededRNG } from "../shared/perf-utils.js";

/**
 * Stub composer. Takes a name (e.g. "rhythm", "harmony") and a seed.
 * Produces a few deterministic events per bar, varied by name and seed.
 * Replaced by real MACH:INE-derived composers in M1.
 */
export function createStubComposer({ name, seed, instrument }) {
  const rng = new SeededRNG(seed);

  return {
    name,
    instrument,

    /**
     * Generate events for a single bar, given current world state.
     * Returns array of { t, instrument, pitch, vel, dur }.
     *   t:     beat offset within the bar (0..4 assuming 4/4)
     *   pitch: MIDI note number
     *   vel:   0..127
     *   dur:   beats
     */
    generateBar(barIndex, state) {
      const events = [];
      // number of events this bar scales with state.intensity
      const n = 1 + Math.floor(rng.next() * 3 * state.intensity);
      for (let i = 0; i < n; i++) {
        events.push({
          t: rng.next() * 4,  // 4/4 grid
          instrument,
          pitch: 48 + Math.floor(rng.next() * 24),  // C3..B4
          vel: 60 + Math.floor(rng.next() * 40),    // 60..100
          dur: 0.25 + rng.next() * 0.75,
        });
      }
      // sort by t for tidy downstream merging
      events.sort((a, b) => a.t - b.t);
      return events;
    },
  };
}
```

- [ ] **Step 2: Smoke test inline**

```bash
cd /Users/Edo_1/album-gen && node -e "
import('./src/composers/stub-composer.js').then(async ({ createStubComposer }) => {
  const c = createStubComposer({ name: 'rhythm', seed: 42, instrument: 'kick' });
  const evs = c.generateBar(0, { intensity: 0.5, role: 'opener', currentBar: 0, totalBars: 100, phase: 'intro', phaseProgress: 0, energy: 0 });
  console.log('events:', JSON.stringify(evs));
  console.log('count:', evs.length);
});
"
```

Expected: prints a small array of events (e.g. 1-2 events). Same call twice with same seed must produce same output.

- [ ] **Step 3: Verify determinism manually**

```bash
cd /Users/Edo_1/album-gen && node -e "
import('./src/composers/stub-composer.js').then(async ({ createStubComposer }) => {
  const state = { intensity: 0.5, role: 'opener', currentBar: 0, totalBars: 100, phase: 'intro', phaseProgress: 0, energy: 0 };
  const a = createStubComposer({ name: 'rhythm', seed: 42, instrument: 'kick' });
  const b = createStubComposer({ name: 'rhythm', seed: 42, instrument: 'kick' });
  const ea = a.generateBar(0, state);
  const eb = b.generateBar(0, state);
  console.log('match:', JSON.stringify(ea) === JSON.stringify(eb));
});
"
```

Expected: `match: true`.

- [ ] **Step 4: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/composers/stub-composer.js
git commit -m "feat(composers): deterministic stub-composer for M0 pipeline"
```

---

## Task 8: song-director (bounded compositional director)

**Files:**
- Create: `/Users/Edo_1/album-gen/src/core/song-director.js`
- Create: `/Users/Edo_1/album-gen/test/song-director.test.js`

- [ ] **Step 1: Write the failing test**

Create `/Users/Edo_1/album-gen/test/song-director.test.js`:

```javascript
import assert from "node:assert/strict";
import { createSongDirector } from "../src/core/song-director.js";

const globalPlan = { bpm: 96, key: "D", mode: "dorian" };

// Test 1: bounded song produces events across all bars
const dir = createSongDirector({
  id: "opener",
  role: "opener",
  duration_sec: 180,
  character: "sospeso",
  intensity: 0.5,
  seed: 0x4A3F,
  globalPlan,
});

const allEvents = dir.generateAll();
assert.ok(Array.isArray(allEvents), "generateAll returns array");
assert.ok(allEvents.length > 0, "generateAll returns at least one event");

// Test 2: every event has absolute time within song duration
for (const ev of allEvents) {
  assert.ok(typeof ev.t === "number", `event has numeric t: ${JSON.stringify(ev)}`);
  assert.ok(ev.t >= 0 && ev.t <= 180 * 1.01, `event t ${ev.t} within [0, duration]`);
  assert.ok(typeof ev.instrument === "string", "event has instrument");
  assert.ok(Number.isInteger(ev.pitch), "event has integer pitch");
  assert.ok(ev.vel >= 0 && ev.vel <= 127, "event vel in [0,127]");
}

// Test 3: deterministic — same seed → same events
const dir2 = createSongDirector({
  id: "opener",
  role: "opener",
  duration_sec: 180,
  character: "sospeso",
  intensity: 0.5,
  seed: 0x4A3F,
  globalPlan,
});
const events2 = dir2.generateAll();
assert.deepEqual(allEvents, events2, "same seed → same events");

// Test 4: different seed → different events
const dir3 = createSongDirector({
  id: "opener",
  role: "opener",
  duration_sec: 180,
  character: "sospeso",
  intensity: 0.5,
  seed: 0x4A40,
  globalPlan,
});
const events3 = dir3.generateAll();
assert.notDeepEqual(allEvents, events3, "different seed → different events");

// Test 5: tickBar is consistent with generateAll
const dir4 = createSongDirector({
  id: "opener",
  role: "opener",
  duration_sec: 180,
  character: "sospeso",
  intensity: 0.5,
  seed: 0x4A3F,
  globalPlan,
});
const streamed = [];
const totalBars = dir4.totalBars;
for (let b = 0; b < totalBars; b++) {
  const bar = dir4.tickBar(b);
  for (const ev of bar) streamed.push(ev);
}
assert.deepEqual(
  streamed.map(e => ({ t: e.t, pitch: e.pitch, vel: e.vel, instrument: e.instrument, dur: e.dur })),
  allEvents.map(e => ({ t: e.t, pitch: e.pitch, vel: e.vel, instrument: e.instrument, dur: e.dur })),
  "tickBar stream matches generateAll"
);

// Test 6: climax role produces more events than outro at same intensity 0.5 ?
// (No — intensity drives density, not role.)
// Instead: verify that higher intensity produces more events.
const dirLow = createSongDirector({
  id: "x", role: "opener", duration_sec: 180, character: "a", intensity: 0.1, seed: 1, globalPlan,
});
const dirHigh = createSongDirector({
  id: "x", role: "opener", duration_sec: 180, character: "a", intensity: 0.9, seed: 1, globalPlan,
});
assert.ok(
  dirHigh.generateAll().length > dirLow.generateAll().length,
  "higher intensity → more events"
);

console.log("✓ song-director.test.js");
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/Edo_1/album-gen && node test/song-director.test.js
```

Expected: FAIL — `Cannot find module '../src/core/song-director.js'`.

- [ ] **Step 3: Implement song-director.js**

Create `/Users/Edo_1/album-gen/src/core/song-director.js`:

```javascript
import { createWorldState, advanceWorldState } from "../shared/world-state.js";
import { createStubComposer } from "../composers/stub-composer.js";
import { deriveComposerSeed } from "./seed-manager.js";

const BEATS_PER_BAR = 4;  // assume 4/4 for M0

/**
 * Create a bounded song director for a single song of an album.
 *
 * @param {object} opts
 * @param {string} opts.id
 * @param {string} opts.role           opener | development | climax | outro
 * @param {number} opts.duration_sec
 * @param {string} opts.character
 * @param {number} opts.intensity      0..1
 * @param {number} opts.seed           uint32 per-song seed
 * @param {object} opts.globalPlan     { bpm, key, mode }
 * @param {Array<string>} [opts.instruments]  active instrument names
 * @returns {object} director with generateAll() and tickBar(bar)
 */
export function createSongDirector({
  id, role, duration_sec, character, intensity, seed, globalPlan,
  instruments = ["kick", "snare", "hat", "bass", "lead", "pad", "drone"],
}) {
  const bpm = globalPlan.bpm;
  const beatsPerSec = bpm / 60;
  const totalBeats = duration_sec * beatsPerSec;
  const totalBars = Math.max(1, Math.floor(totalBeats / BEATS_PER_BAR));

  const state = createWorldState({
    role,
    totalBars,
    bpm,
    key: globalPlan.key,
    mode: globalPlan.mode,
    intensity,
  });

  // One composer per active instrument. Each receives a derived seed.
  // Composer "family" is inferred from instrument name.
  const composerFor = {
    kick: "rhythm", snare: "rhythm", hat: "rhythm", perc: "rhythm",
    bass: "bass",
    lead: "melody",
    pad: "harmony", drone: "harmony",
    texture: "texture",
  };
  const composers = instruments.map(inst => {
    const family = composerFor[inst] || "texture";
    const cseed = deriveComposerSeed(seed, family + ":" + inst);
    return createStubComposer({ name: family, seed: cseed, instrument: inst });
  });

  function tickBar(barIndex) {
    if (barIndex < 0 || barIndex >= totalBars) return [];
    advanceWorldState(state, barIndex);
    const barOffsetSec = (barIndex * BEATS_PER_BAR) / beatsPerSec;
    const events = [];
    for (const c of composers) {
      const barEvents = c.generateBar(barIndex, state);
      for (const e of barEvents) {
        // Translate from beat-in-bar (0..4) to absolute song seconds
        const absT = barOffsetSec + (e.t / beatsPerSec);
        events.push({
          ...e,
          t: absT,
        });
      }
    }
    events.sort((a, b) => a.t - b.t);
    return events;
  }

  function generateAll() {
    const all = [];
    for (let b = 0; b < totalBars; b++) {
      const barEvents = tickBar(b);
      for (const ev of barEvents) all.push(ev);
    }
    return all;
  }

  return {
    id, role, character, intensity, seed,
    totalBars,
    totalDurationSec: duration_sec,
    generateAll,
    tickBar,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/Edo_1/album-gen && node test/song-director.test.js
```

Expected: `✓ song-director.test.js`. If Test 5 (tickBar consistency) fails because the composer is stateful (RNG advances), note that the test above creates a fresh director for the streaming loop — so the test should work. If it doesn't, debug and rerun.

- [ ] **Step 5: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/core/song-director.js test/song-director.test.js
git commit -m "feat(core): bounded song-director with deterministic generation"
```

---

## Task 9: album-director (thin coordinator)

**Files:**
- Create: `/Users/Edo_1/album-gen/src/core/album-director.js`
- Create: `/Users/Edo_1/album-gen/test/album-director.test.js`

- [ ] **Step 1: Write the failing test**

Create `/Users/Edo_1/album-gen/test/album-director.test.js`:

```javascript
import assert from "node:assert/strict";
import { loadAlbum } from "../src/core/config-loader.js";
import { createAlbumDirector } from "../src/core/album-director.js";

const cfg = await loadAlbum("./albums/album-001.yaml");

// Test 1: album director exposes 5 song directors
const album = createAlbumDirector(cfg);
assert.equal(album.songs.length, 5);
assert.equal(album.songs[0].role, "opener");
assert.equal(album.songs[4].role, "outro");

// Test 2: each song has events
for (const song of album.songs) {
  const evs = song.generateAll();
  assert.ok(evs.length > 0, `${song.id} has events`);
}

// Test 3: generate a full album (all 5 songs)
const albumEvents = album.generateAlbum();
assert.equal(albumEvents.length, 5);
for (const songEvs of albumEvents) {
  assert.ok(Array.isArray(songEvs));
  assert.ok(songEvs.length > 0);
}

// Test 4: deterministic — full album is stable across runs
const album2 = createAlbumDirector(cfg);
const albumEvents2 = album2.generateAlbum();
for (let i = 0; i < 5; i++) {
  assert.deepEqual(albumEvents[i], albumEvents2[i], `song ${i} deterministic`);
}

// Test 5: locked per-song seed overrides global-derived
const cfgLocked = JSON.parse(JSON.stringify(cfg));
cfgLocked.songs[1].seed = 0xDEADBEEF;
const albumLocked = createAlbumDirector(cfgLocked);
const albumLocked2 = createAlbumDirector(cfgLocked);
assert.deepEqual(
  albumLocked.songs[1].generateAll(),
  albumLocked2.songs[1].generateAll(),
  "locked seed → reproducible"
);
// locked song differs from the derived-seed version
assert.notDeepEqual(
  albumLocked.songs[1].generateAll(),
  album.songs[1].generateAll(),
  "locked seed differs from auto-derived"
);
// but other songs in the locked album still match (global_seed unchanged)
assert.deepEqual(
  albumLocked.songs[0].generateAll(),
  album.songs[0].generateAll(),
  "non-locked songs unaffected by a single lock"
);

console.log("✓ album-director.test.js");
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/Edo_1/album-gen && node test/album-director.test.js
```

Expected: FAIL — `Cannot find module '../src/core/album-director.js'`.

- [ ] **Step 3: Implement album-director.js**

Create `/Users/Edo_1/album-gen/src/core/album-director.js`:

```javascript
import { createSongDirector } from "./song-director.js";
import { deriveSongSeed } from "./seed-manager.js";

/**
 * Create an album director from a validated config.
 * Builds global-plan and instantiates 5 song-directors with correct seeds.
 *
 * Seed resolution rules:
 *   1. cfg.songs[i].seed    — locked, highest priority
 *   2. deriveSongSeed(cfg.global.seed, i)  — derived if global.seed present
 *   3. deriveSongSeed(random_uint32, i)    — fresh random global if nothing set
 *
 * @param {object} cfg validated album config
 * @returns {object} { globalSeed, songs: [songDirector...], generateAlbum() }
 */
export function createAlbumDirector(cfg) {
  // Resolve global seed
  let globalSeed;
  if (cfg.global?.seed !== undefined && cfg.global.seed !== null) {
    globalSeed = cfg.global.seed >>> 0;  // coerce to uint32
  } else {
    globalSeed = (Math.random() * 0xFFFFFFFF) >>> 0;
  }

  const globalPlan = {
    bpm: cfg.global?.bpm ?? 120,
    key: cfg.global?.key ?? "C",
    mode: cfg.global?.mode ?? "minor",
    palette: cfg.global?.palette,
  };

  // Instrument list: active per-song or all defined in config
  const allInstruments = cfg.instruments ? Object.keys(cfg.instruments) : null;

  const songs = cfg.songs.map((songCfg, i) => {
    const songSeed = (songCfg.seed !== undefined && songCfg.seed !== null)
      ? (songCfg.seed >>> 0)
      : deriveSongSeed(globalSeed, i);

    const instruments = songCfg.instruments_active
      ?? allInstruments
      ?? ["kick", "snare", "hat", "bass", "lead", "pad", "drone"];

    return createSongDirector({
      id: songCfg.id,
      role: songCfg.role,
      duration_sec: songCfg.duration_sec,
      character: songCfg.character ?? "",
      intensity: songCfg.intensity ?? 0.5,
      seed: songSeed,
      globalPlan,
      instruments,
    });
  });

  function generateAlbum() {
    return songs.map(s => s.generateAll());
  }

  return {
    globalSeed,
    globalPlan,
    songs,
    generateAlbum,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/Edo_1/album-gen && node test/album-director.test.js
```

Expected: `✓ album-director.test.js`. Exit 0.

- [ ] **Step 5: Commit**

```bash
cd /Users/Edo_1/album-gen
git add src/core/album-director.js test/album-director.test.js
git commit -m "feat(core): album-director orchestrating 5 song-directors"
```

---

## Task 10: test runner + CLI entry

**Files:**
- Create: `/Users/Edo_1/album-gen/test/all.js`
- Create: `/Users/Edo_1/album-gen/bin/album-gen.js`

- [ ] **Step 1: Create test runner**

Create `/Users/Edo_1/album-gen/test/all.js`:

```javascript
// Simple test orchestrator. Runs each test file in sequence.
// Exits non-zero if any fail.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tests = readdirSync(__dirname).filter(f => f.endsWith(".test.js")).sort();

let failed = 0;
for (const t of tests) {
  const path = join(__dirname, t);
  process.stdout.write(`→ ${t} ... `);
  const r = spawnSync(process.execPath, [path], { stdio: "inherit" });
  if (r.status !== 0) {
    failed++;
    console.error(`  FAILED (exit ${r.status})`);
  }
}

if (failed > 0) {
  console.error(`\n✗ ${failed}/${tests.length} test files failed`);
  process.exit(1);
} else {
  console.log(`\n✓ all ${tests.length} test files passed`);
}
```

- [ ] **Step 2: Run all tests**

```bash
cd /Users/Edo_1/album-gen && node test/all.js
```

Expected: all test files print their `✓` messages, then final `✓ all 3 test files passed`. Exit 0.

- [ ] **Step 3: Create CLI entry**

Create `/Users/Edo_1/album-gen/bin/album-gen.js`:

```javascript
#!/usr/bin/env node
// CLI entry for album-gen M0.
// Usage: album-gen <path-to-album.yaml>
// Loads, validates, generates all 5 songs, prints event counts + first events.

import { loadAlbum } from "../src/core/config-loader.js";
import { createAlbumDirector } from "../src/core/album-director.js";

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("usage: album-gen <album.yaml>");
  process.exit(1);
}

const path = args[0];
console.log(`loading ${path}...`);
const cfg = await loadAlbum(path);
console.log(`  title: ${cfg.title ?? "(untitled)"}`);
console.log(`  tool_version: ${cfg.tool_version ?? "(unspecified)"}`);
console.log(`  bpm: ${cfg.global?.bpm ?? "(default)"}`);
console.log(`  key: ${cfg.global?.key ?? "(default)"} ${cfg.global?.mode ?? ""}`);

const album = createAlbumDirector(cfg);
console.log(`\nglobal seed: 0x${album.globalSeed.toString(16).toUpperCase()}`);

console.log(`\ngenerating ${album.songs.length} songs...`);
const totalStart = Date.now();
const eventsPerSong = album.generateAlbum();
const elapsed = Date.now() - totalStart;

console.log(`\nsongs:`);
let totalEvents = 0;
for (let i = 0; i < album.songs.length; i++) {
  const s = album.songs[i];
  const n = eventsPerSong[i].length;
  totalEvents += n;
  console.log(
    `  ${String(i + 1).padStart(2, "0")}. ${s.id.padEnd(12)} [${s.role.padEnd(12)}] ` +
    `${s.totalDurationSec}s  ${s.totalBars} bars  ${n} events  seed 0x${s.seed.toString(16).toUpperCase()}`
  );
}

console.log(`\ntotal: ${totalEvents} events in ${elapsed}ms`);
```

- [ ] **Step 4: Make it executable**

```bash
cd /Users/Edo_1/album-gen && chmod +x bin/album-gen.js
```

- [ ] **Step 5: Run the CLI on example album**

```bash
cd /Users/Edo_1/album-gen && node bin/album-gen.js albums/album-001.yaml
```

Expected output:
```
loading albums/album-001.yaml...
  title: Test album
  tool_version: 0.1.0-M0
  bpm: 96
  key: D dorian

global seed: 0x9C42

generating 5 songs...

songs:
  01. opener       [opener      ] 180s  72 bars  <N> events  seed 0x4A3F
  02. dev_a        [development ] 240s  96 bars  <N> events  seed 0x<hash>
  03. dev_b        [development ] 240s  96 bars  <N> events  seed 0x<hash>
  04. climax       [climax      ] 300s  120 bars <N> events  seed 0x<hash>
  05. outro        [outro       ] 210s  84 bars  <N> events  seed 0x<hash>

total: <N> events in <N>ms
```

Exit 0. Event counts should be non-zero and generally higher for higher-intensity songs (climax > opener).

- [ ] **Step 6: Run it a second time to verify stability**

```bash
cd /Users/Edo_1/album-gen && node bin/album-gen.js albums/album-001.yaml > /tmp/run1.txt
node bin/album-gen.js albums/album-001.yaml > /tmp/run2.txt
diff /tmp/run1.txt /tmp/run2.txt
```

Expected: only difference is the timing line (`in <N>ms`). Event counts + seeds must be identical.

- [ ] **Step 7: Commit**

```bash
cd /Users/Edo_1/album-gen
git add test/all.js bin/album-gen.js
git commit -m "feat(cli): album-gen entry + test runner"
```

---

## Task 11: Full pipeline determinism test

**Files:**
- Create: `/Users/Edo_1/album-gen/test/pipeline.test.js`

A snapshot-style test that captures the current deterministic output so future changes are intentional.

- [ ] **Step 1: Generate a baseline snapshot**

```bash
cd /Users/Edo_1/album-gen && node -e "
import('./src/core/config-loader.js').then(async ({ loadAlbum }) => {
  const { createAlbumDirector } = await import('./src/core/album-director.js');
  const cfg = await loadAlbum('./albums/album-001.yaml');
  const album = createAlbumDirector(cfg);
  const songs = album.generateAlbum();
  const summary = songs.map((evs, i) => ({
    id: album.songs[i].id,
    seed: album.songs[i].seed,
    count: evs.length,
    firstEvent: evs[0],
    lastEvent: evs[evs.length - 1],
  }));
  console.log(JSON.stringify(summary, null, 2));
});
"
```

This prints a stable summary. Copy the output to use in the test below.

- [ ] **Step 2: Write the pipeline snapshot test**

Create `/Users/Edo_1/album-gen/test/pipeline.test.js`:

```javascript
import assert from "node:assert/strict";
import { loadAlbum } from "../src/core/config-loader.js";
import { createAlbumDirector } from "../src/core/album-director.js";

const cfg = await loadAlbum("./albums/album-001.yaml");

// Run the pipeline 3 times from scratch; all runs must produce byte-identical output
const run = () => {
  const album = createAlbumDirector(cfg);
  return album.songs.map((s, i) => ({
    id: s.id,
    seed: s.seed,
    events: s.generateAll(),
  }));
};

const r1 = run();
const r2 = run();
const r3 = run();

// Compare r1 ↔ r2
for (let i = 0; i < 5; i++) {
  assert.equal(r1[i].id, r2[i].id, `song ${i} id stable`);
  assert.equal(r1[i].seed, r2[i].seed, `song ${i} seed stable`);
  assert.equal(r1[i].events.length, r2[i].events.length, `song ${i} event count stable`);
  assert.deepEqual(r1[i].events, r2[i].events, `song ${i} events byte-identical`);
}

// Compare r2 ↔ r3
for (let i = 0; i < 5; i++) {
  assert.deepEqual(r2[i].events, r3[i].events, `run 2 and 3 byte-identical song ${i}`);
}

// Sanity: event counts are plausible (non-zero, generally higher intensity → more)
for (const song of r1) {
  assert.ok(song.events.length > 10, `song ${song.id} has > 10 events`);
}

// Spot-check: every event has expected shape
for (const song of r1) {
  for (const ev of song.events) {
    assert.ok(typeof ev.t === "number" && ev.t >= 0);
    assert.ok(typeof ev.instrument === "string");
    assert.ok(Number.isInteger(ev.pitch));
    assert.ok(ev.vel >= 0 && ev.vel <= 127);
    assert.ok(typeof ev.dur === "number" && ev.dur > 0);
  }
}

console.log("✓ pipeline.test.js (full determinism verified across 3 runs)");
```

- [ ] **Step 3: Run the test**

```bash
cd /Users/Edo_1/album-gen && node test/pipeline.test.js
```

Expected: `✓ pipeline.test.js (full determinism verified across 3 runs)`.

- [ ] **Step 4: Run full suite**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all 4 test files pass (seed-manager, config-loader, song-director, album-director, pipeline — actually 5 now).

- [ ] **Step 5: Commit**

```bash
cd /Users/Edo_1/album-gen
git add test/pipeline.test.js
git commit -m "test(pipeline): full determinism across 3 runs"
```

---

## Task 12: README polish + M0 completion tag

**Files:**
- Modify: `/Users/Edo_1/album-gen/README.md`

- [ ] **Step 1: Expand README with usage + status**

Overwrite `/Users/Edo_1/album-gen/README.md`:

```markdown
# album-gen

Generative 5-song album tool. MIDI-events-first, SuperCollider audio and PARTITURA visual coming in later milestones.

## Status

- **M0 — Foundations ✅** (this release)
  - YAML config load + strict validation
  - SHA256-derived seed tree (global → per-song → per-composer)
  - Bounded `song-director` (role-aware, duration-aware)
  - Thin `album-director` coordinating 5 songs
  - Stub composer (deterministic placeholder)
  - CLI `album-gen <album.yaml>` prints event summary
  - Full determinism verified by test suite
- M1 — Audio live (SuperCollider engine + OSC dispatch + real composer forks)
- M2 — PARTITURA (visual layer, event-driven)
- M3 — Polish & persistence (UI save lock/unlock, fullscreen, panic)
- M4 — MIDI export
- M5 — Audio export via SC NRT

## Run

```bash
npm install
npm test
node bin/album-gen.js albums/album-001.yaml
```

## Design

See the design spec in the MACH:INE III repo:
`.../MACH-INE II/app/docs/superpowers/specs/2026-04-20-album-gen-design.md`

## Layout

```
src/core/       album-director, song-director, seed-manager, config-loader
src/composers/  stub-composer (M0); real composers in M1
src/shared/     perf-utils (SeededRNG), world-state
bin/            CLI entry
albums/         album YAML configs
test/           deterministic test suite
vendor/machine/ MACH:INE v3.18 read-only snapshot (gitignored)
```

## Requirements

- Node.js 20+
```

- [ ] **Step 2: Tag M0 completion**

```bash
cd /Users/Edo_1/album-gen
git add README.md
git commit -m "docs: expand README with M0 completion"
git tag -a v0.1.0-M0 -m "M0: foundations — deterministic pipeline"
```

Expected: tag `v0.1.0-M0` created.

- [ ] **Step 3: Final verification**

```bash
cd /Users/Edo_1/album-gen && npm test && node bin/album-gen.js albums/album-001.yaml
```

Expected: all tests pass AND CLI produces deterministic output. M0 done.

---

## M0 Completion Criteria

Before declaring M0 done, verify:

- [ ] `npm test` exits 0.
- [ ] `node bin/album-gen.js albums/album-001.yaml` runs successfully and prints 5 songs with non-zero event counts.
- [ ] Running the CLI twice produces identical event counts + seeds (timing line only differs).
- [ ] Modifying `global_seed` in the YAML changes all 5 song-seeds.
- [ ] Adding `seed: 0xABCD` to song `dev_a` and re-running leaves other 4 songs unchanged, only `dev_a` switches to the locked seed.
- [ ] Spec file `.../2026-04-20-album-gen-design.md` still reflects what's actually built (M0 portion at least).

If all checked: M0 is complete. Move on to M1 planning (fork real composers + SuperCollider engine + OSC dispatch + launcher + minimal UI).

---

## Out of scope for M0 (by design)

- No audio (SC integration → M1)
- No visual (PARTITURA → M2)
- No real MACH:INE composer forks (bass-v3, melody-v3, etc. stay in vendor/ → M1)
- No UI, no launcher, no browser runtime (→ M1)
- No YAML writing / persistence (→ M3)
- No MIDI file export (→ M4)
- No audio file export (→ M5)

Stay disciplined. Scope creep kills M0.
