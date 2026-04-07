# Technology Stack — Generative Compositional Engine

**Project:** MACH:INE II v3
**Research dimension:** Compositional layer only (brownfield milestone)
**Researched:** 2026-03-27
**Overall confidence:** HIGH — based on direct inspection of the existing codebase plus
established algorithmic composition theory. WebSearch unavailable; no external verification
of library availability performed. All library recommendations are zero-dependency
(pure JS algorithms), so availability is moot.

---

## Existing Infrastructure: Keep Everything

The runtime infrastructure is proven and must not change. This section documents what is
inherited, so the roadmap does not accidentally schedule rebuilding it.

| Layer | Module | Status |
|-------|--------|--------|
| MIDI clock thread | `src/midi-clock.worker.js` | KEEP — 2ms ticks, stable, battle-tested |
| MIDI I/O + lookahead | `src/midi.js` | KEEP — 50ms window, CH0-CH7 defined |
| Presence multiplier | `src/presence-multiplier.js` | KEEP — crossfade scaffold works |
| Performance sequencer | `src/sequencer.js` | REWRITE — cue architecture stays, content replaces |
| Composer engines (7×) | `src/composer*.js` | REWRITE — replace with layered architecture |
| Config | `src/config.js` | KEEP + EXTEND — all new params go here |
| Composition utilities | `.claude/skills/composition-depth/scripts/composition-utils.js` | KEEP + EXTEND |

**Constraint (non-negotiable):** Zero external dependencies, zero bundler, zero npm.
All compositional code is pure ES module JavaScript imported directly by the browser.

---

## Recommended Architecture: Macro-Composer + Functional Layers

The v2 architecture (7 parallel monolithic engines) produces good sound but has a
fundamental compositional ceiling: each engine is an island. A layered architecture
unlocks dialogue between rhythmic, harmonic, melodic, and textural dimensions.

### Layer Topology (confidence: HIGH)

```
MacroComposer (src/macro-composer.js)
  ├── RhythmLayer    (src/layers/rhythm.js)
  ├── HarmonyLayer   (src/layers/harmony.js)
  ├── MelodyLayer    (src/layers/melody.js)
  └── TextureLayer   (src/layers/texture.js)

NarrativeArc (src/narrative-arc.js)
  └── feeds all layers with global arc state (0.0–1.0 per dimension)

Sequencer (src/sequencer.js — refactored)
  └── drives NarrativeArc over 45-60 minutes
```

The MacroComposer replaces the 7 engine system. It does not generate notes directly —
it maintains global harmonic and rhythmic state that all four layers read from. Layers
generate notes on their assigned MIDI channels (existing CH0-CH7 mapping stays intact).

Why this over parallel engines: the v2 system can layer engines, but each engine carries
its own independent harmonic logic. This causes modal dissonance when two engines are
simultaneously active at the crossfade points. A shared harmonic state eliminates this
by design.

---

## Core Algorithmic Techniques

### 1. Euclidean Rhythms with Continuous Evolution (confidence: HIGH)

**What:** Bjorklund's algorithm distributes K hits across N steps maximally evenly.
E(3,8) = [1,0,0,1,0,0,1,0] — the standard Afro-Cuban clave. E(5,16) = hi-hat groove.

**Why for this project:** Produces grooves that feel human without being random. The
evolution from sparse (E(2,16)) to dense (E(7,16)) can be driven by the narrative arc
0.0–1.0, giving the rhythmic arc a continuous mathematical identity. Matches Reich's
additive process aesthetic directly.

**Already exists:** `euclidean()` and `euclideanEvolve()` in composition-utils.js.
The new RhythmLayer must use `euclideanEvolve()` with the narrative arc value as
the `progress` parameter — this is the mechanism for the "aritmico → pulse emergente
→ groove cristallizzato" arc described in PROJECT.md.

**Implementation:** RhythmLayer maintains `K_current` (hits), `N_current` (steps), and
`rotation_current` per channel. The MacroComposer drives these via arc state, not
random mutation.

**Do NOT:** Generate kick patterns as static arrays (v2 pattern). Static arrays cannot
evolve continuously; they snap. Use `euclideanEvolve(K1, K2, N, arcProgress)` for
smooth density transitions.

---

### 2. Markov Chain Melody / Voice Selection (confidence: HIGH)

**What:** A first-order Markov chain defines transition probabilities between scale
degrees. Given the current note, the chain selects the next note probabilistically.
The chain is a 2D matrix: `P[from][to]` where rows sum to 1.0.

**Why for this project:** Pure random note selection sounds mechanical. A Markov chain
trained on the aesthetic references (Floating Points, Four Tet) produces melodic
contours with direction and memory — exactly the "probabilistico non random" distinction
already codified in the composition-depth SKILL.md philosophy.

**Chain design per aesthetic:**
- Reich/Glass: chain biased toward stepwise motion (±1-2 scale degrees), very low
  probability of leaps. Creates the characteristic melodic shimmer.
- Four Tet: chain allows 3rd and 4th leaps, with higher probability of returning
  to tonal center after a leap (arch contour).
- Eno: chain biased toward static (staying on same pitch) and narrow motion, with
  rare surprising leaps at low probability.
- Floating Points: chain similar to Four Tet but with increased probability of
  landing on chord tones (7th, 9th) — jazz color without jazz busyness.

**The chain is not fixed.** It interpolates between two matrices (sparse ↔ active) as
the arc progresses. `markovChain()` already exists in composition-utils.js. The new
code needs a `lerpMarkovMatrix(matrixA, matrixB, t)` helper.

**Do NOT:** Use pure random scale degree selection. Do NOT use deterministic step
sequences (which produce the "mechanical" quality the project explicitly wants to avoid).

---

### 3. Harmonic Drift — Single-Voice Modulation (confidence: HIGH)

**What:** Instead of switching between modal systems (v2: each engine has a fixed mode),
a single tonal center persists and individual chord voices drift by ±1 semitone
probabilistically, guided by `driftChord()` (already in harmonic-techniques.md).

**Why for this project:** This is the Floating Points / Four Tet mechanism. The listener
never hears a "key change" — they hear a subtle color shift they cannot name. It
produces the "temperatura armonica" quality described in PROJECT.md.

**Critical detail:** Drift must happen in the HarmonyLayer, not per-engine. In v2,
each engine has its own mode list. In v3, the HarmonyLayer owns one current chord
voicing and one current mode. The drift operates on that single shared state.
All other layers (melody, texture) read from HarmonyLayer state to select their pitches.

**Drift rate:** Controlled by the narrative arc. At arc < 0.3 (ambient opening): drift
probability = 0.02 per chord event (very rare). At arc 0.5-0.8 (active): 0.08.
At arc > 0.9 (dissoluzione): drift increases to 0.15 but resolution probability also
increases — creates the "dissoluzione armonica" effect.

**Do NOT:** Assign different modal roots to different layers. This is the v2 problem.
One harmonic state, read by all layers.

---

### 4. Phasing — Reich-Style Temporal Displacement (confidence: HIGH)

**What:** Two rhythmic sequences of different length (N and N+1 or N+2) run simultaneously
at the same tempo. Their beat 1 alignment drifts apart slowly, creating the characteristic
Reich phase shift. The original "Piano Phase" uses 12-step and 13-step patterns.

**Why for this project:** PROJECT.md explicitly lists Reich phasing as a target aesthetic.
This is the mechanism that produces it. It is mathematically simple (two counters at
different moduli) but aurally complex. It creates evolution without harmonic change —
essential for the ambient/Eno sections where harmony is static.

**Implementation:** In the TextureLayer, maintain two independent step counters:
`stepA % 12` and `stepB % 13`. Each counter triggers a note from the same pitch pool
when it hits its trigger step. The two voices drift in and out of alignment over
12×13 = 156 steps (≈ 39 bars at 16th-note resolution). At 54 BPM that is ~86 seconds
of non-repeating pattern from two simple sequences.

**Extend to polyphase:** Three voices at 12/13/15 steps. LCM = 780 steps ≈ 195 bars.
This produces ~14 minutes of non-repeating texture from three counters. Use for Act I
ambient opening and Act V dissolution.

**Do NOT:** Try to implement phasing via tempo manipulation (slightly different BPM for
each layer). The MIDI clock is single-threaded and shared. Implement phasing as integer
modulo counters within the same clock tick.

---

### 5. Probability Density Functions for Velocity and Timing (confidence: HIGH)

**What:** Instead of linear velocity curves, note velocities are sampled from a
probability distribution whose shape is controlled by the arc. The existing composition-
depth SKILL.md correctly identifies that v2 uses linear velocity — this is the fix.

**Distribution shapes:**
- Gaussian: mean = `baseVel`, sigma = `velRange * 0.25`. Produces natural-sounding
  variation around a center. Use for groove layers (rhythm, bass).
- Exponential: biased toward quiet with occasional loud accents. Use for texture layers
  (grain, ambient pads).
- Stepped: discrete levels (pp, mp, mf, f, ff) selected probabilistically. Use for
  melodic layers where phrasing matters (phrase-level dynamics already documented in
  SKILL.md).

**Micro-timing humanize:** Already defined as `humanizeVelocity()` in composition-utils.js.
For timing, add `humanizeTiming(stepMs, variance)` that returns a ±variance offset in ms
before scheduling the note. Variance = 0ms (mechanical, appropriate for MECCANICA/SOLCO),
5ms (tight groove, TERRENO), 12ms (loose, DERIVA). Controlled by MacroComposer per
narrative section.

**Do NOT:** Apply humanize to all channels uniformly. The kick/pulse channel (CH0) should
have zero micro-timing offset — it is the clock reference. Harmonic channels (CH4 CHORDS)
benefit from slight timing offsets on inner voices only.

---

### 6. Breath Cycles — Phrase-Level Dynamics (confidence: HIGH)

**What:** A "breath" is a repeating envelope over 8 or 16 bars that shapes note density
and velocity. Already conceptualized in SKILL.md as `phrasedPresence()`. Needs systematic
implementation across all layers.

**Mechanism:** Each layer maintains a `breathPhase` counter (in bars, resets every
`breathLength` bars). Density and velocity are multiplied by `breathCurve[breathPhase % len]`.
The breath curve is an array of 8 or 16 values, not a real-time calculation.

**Why this produces Reich/Eno quality:** These composers use breath cycles (often called
"pulse" in Reich's vocabulary) as structural articulation. The listener perceives breathing
even when no individual voice is doing anything unusual. It is the sum of layer breaths
at offset phases that creates this.

**Offset between layers:** RhythmLayer breath at 0 bars, HarmonyLayer breath at 2 bars,
MelodyLayer breath at 1 bar, TextureLayer at 3 bars. The 4-layer offset of 4 bars total
creates a rolling wave effect across the composite sound. MacroComposer configures these
offsets per narrative section.

---

### 7. Tonal Gravity — Pitch Resolution Weighting (confidence: HIGH)

**What:** Not all scale degrees are equal. In any given mode, certain degrees act as
gravity wells: the root, the fifth, and the characteristic mode note (Dorian natural 6,
Lydian #4). The Markov chain already biases toward these. Tonal gravity adds a second
mechanism: after N notes away from the gravity well, the probability of resolving
increases proportionally.

**Why:** This is what separates Floating Points / Four Tet from generic generative music.
Their melodies and harmonies have a sense of *wanting* to be somewhere. The mechanism
is simple — a counter of "distance from last tonal center note" that increases the
probability of the next note being the root or fifth.

**Implementation:** `gravityCounter` in MelodyLayer. Increments by 1 each note that is
not a gravity pitch. P(gravity resolution) = `min(1.0, gravityCounter * 0.12)`.
Reset to 0 when a gravity pitch is played.

**Tune per section:** germoglio: gravity = very strong (counter multiplier 0.20, fast return).
densita: gravity = loose (multiplier 0.06, long excursions). rottura: gravity = suspended
(multiplier 0.0, free — maximum harmonic tension). dissoluzione: strong gravity return.

---

### 8. Macro-Arc State Machine (confidence: HIGH)

**What:** A single continuous value `arc` (0.0–1.0) drives all compositional parameters.
The Sequencer drives arc over 45-60 minutes according to the narrative structure. The arc
is not the same as the audio `state.intensity` (which is reactive to live audio). The
compositional arc is deterministic — it advances on clock time.

**Dimensions:** Rather than one scalar arc, use 4 independent arc dimensions:
- `rhythmicDensity`: 0.0 (silence) → 1.0 (maximum polyrhythm). Drives euclidean K values.
- `harmonicColor`: 0.0 (modal, static) → 1.0 (chromatic drift, rich extensions).
  Drives drift probability and chord complexity.
- `melodicActivity`: 0.0 (drone/silence) → 1.0 (active melody). Gates MelodyLayer output.
- `textureDepth`: 0.0 (sparse) → 1.0 (dense phasing, multiple voices). Drives TextureLayer.

**Why 4 dimensions instead of 1:** This directly enables the "arco narrativo" described in
PROJECT.md. The opening (Eno style) has high textureDepth but low rhythmicDensity and low
melodicActivity. The Reich section has high rhythmicDensity and high textureDepth but still
low harmonicColor (modal stability). The Four Tet/Floating Points section has all four high.
The dissolution reverses all four asymmetrically — texture fades last.

**Representation:** Each dimension is a `Float32Array(DURATION_STEPS)` precomputed at
session start from a set of control points. Lookup is O(1) per tick. Total memory:
4 × 3600 steps × 4 bytes = 57KB. Negligible.

**Do NOT:** Drive compositional parameters from `state.intensity` (which reads live audio).
The compositional arc must be autonomous — it is the score. Audio reactivity is a
modifier on top, not the driver.

---

### 9. Seeded Randomness — Session Identity (confidence: HIGH)

**What:** All probabilistic decisions in the compositional layer must use the `SeededRNG`
from `perf-utils.js`, not `Math.random()`. The DNA seed (already generated by `src/dna.js`)
should seed the compositional RNG as well.

**Why:** This ensures that a given session seed produces a consistent aesthetic character
while still being probabilistic within a session. It also eliminates the GC allocation
issue with `Math.random()` noted in the existing CLAUDE.md anti-patterns.

**Practical split:** Use separate SeededRNG instances per layer (RhythmRNG, HarmonyRNG,
MelodyRNG, TextureRNG). This prevents a change in rhythm decisions from shifting the
entire downstream random sequence of harmony and melody. Each gets a derived seed:
`dna.seed + LAYER_OFFSET` where LAYER_OFFSET is a constant per layer.

---

### 10. Power-of-2 Phase Boundaries (confidence: HIGH)

**What:** All phase transitions must occur on bar boundaries, and all structural lengths
(progression cycle length, variation cycle, breath length) must be powers of 2 in bars.
This is fully documented in structural-form.md and is a known deficit in the v2 system
(TERRENO densita = 24 bars, CRISTALLO 24 bars).

**Why it must be enforced in v3:** The layered architecture increases the risk of
non-aligned transitions. If RhythmLayer changes on bar 12 but HarmonyLayer changes on
bar 16, the two layers desynchronize and the music sounds "sconnesso." The MacroComposer
is responsible for coordinating layer transitions at shared bar boundaries.

**Mechanism:** MacroComposer maintains a `barCount` integer. Each layer registers a
`nextTransitionBar` (always a multiple of 4). MacroComposer dispatches a `barTick` event
that layers listen to, and each layer self-schedules transitions only when
`barCount === nextTransitionBar`.

---

## What NOT to Use

| Technology / Approach | Why Not |
|-----------------------|---------|
| Tone.js | External dependency, bundler-friendly API, incompatible with zero-build constraint. Its transport abstraction also adds latency on top of WebMIDI. The existing 2ms Worker clock outperforms it for MIDI accuracy. |
| Web Audio API for output | The system uses Web Audio only for input analysis. All compositional output is WebMIDI to external hardware. Adding Web Audio synthesis would require audio context management that conflicts with the current BlackHole/getUserMedia chain. |
| TensorFlow.js / ML models | Zero-dependency constraint. Also: ML-generated music for live MIDI output requires inference latency management that is incompatible with the 2ms clock requirement. Markov chains and weighted probability produce equivalent aesthetic results at zero cost. |
| MIDI.js or similar MIDI libraries | The `midi.js` module already wraps WebMIDI API with lookahead scheduling. Adding a library adds a dependency without adding capability. |
| AudioWorklet for composition | AudioWorklet runs on the audio rendering thread; compositional logic belongs on the Worker thread. Mixing these creates coupling that degrades performance. |
| Generative grammar / L-Systems | Theoretically elegant but practically fragile for live performance. L-Systems produce long deterministic strings that are hard to interrupt, fade, or transition — exactly what the presence multiplier system needs to do. Probabilistic approaches are more controllable. |
| MIDI file playback | Defeats the generative requirement. A scripted file cannot evolve or respond to the narrative arc in real time. |
| React / Vue / Svelte | No UI framework needed. The HUD is 6 DOM elements updated every CFG.hudUpdateInterval frames. |

---

## What to Keep from Existing Stack (Exact Inventory)

| Keep | Reason |
|------|--------|
| `SeededRNG` from perf-utils.js | Production-quality seeded PRNG, already imported |
| `euclidean()` + `euclideanEvolve()` from composition-utils.js | Correct Bjorklund implementation |
| `swingOffset()` from composition-utils.js | Correct swing model |
| `humanizeVelocity()` from composition-utils.js | Correct Gaussian humanize |
| `markovChain()` from composition-utils.js | Correct first-order Markov |
| `driftChord()` from harmonic-techniques.md | Ready-to-adapt drift modulation |
| `voiceLeadContrario()` from harmonic-techniques.md | Voice leading with contrary motion |
| `isValidProgression()` / `nearestMusicalLength()` from structural-form.md | Power-of-2 validators |
| `sendMIDINote()` wrapper pattern (PM gating) | Channel allow-listing, presence scaling |
| CH0-CH7 MIDI channel role definitions | Must not change — performer has instruments mapped |
| `PRIMARY_CH` map in presence-multiplier.js | Channel collision prevention |
| `setEnginePhase()` / `getEnginePhase()` | Director↔composer sync mechanism |
| 5-phase arc: germoglio→pulsazione→densita→rottura→dissoluzione | Musical arc is proven |
| 4-stage rupture | Non-negotiable (RULES.md, protected area) |

---

## New Modules to Create

| Module | Responsibility | Channel Assignment |
|--------|---------------|-------------------|
| `src/macro-composer.js` | Owns arc dimensions (4×), bar count, layer coordination, phase transitions | None — orchestration only |
| `src/narrative-arc.js` | Precomputed arc curves (Float32Array × 4), control point authoring, lookup | None — data only |
| `src/layers/rhythm.js` | CH0 PULSE, euclidean kick; tick-driven | CH0 |
| `src/layers/harmony.js` | CH2 DRONE + CH4 CHORDS; owns current voicing state, drift | CH2, CH4 |
| `src/layers/melody.js` | CH5 VOICE + CH6 LEAD; Markov melody, tonal gravity | CH5, CH6 |
| `src/layers/texture.js` | CH1 GRAIN + CH3 BASS; phasing counters, bass line | CH1, CH3 |
| `src/layers/rupture.js` | CH7 RUPTURE; 4-stage rupture events | CH7 |

Note on CH3 BASS placement: bass is structural (it defines the harmonic root) but also
textural in this aesthetic. Placing it in texture.js keeps it adjacent to grain (CH1)
which often mirrors bass rhythm. If the bass needs more harmonic coupling to harmony.js,
extract it to its own `src/layers/bass.js` — this is a judgment call for implementation.

---

## Configuration Extensions

All new parameters go into `src/config.js` under new namespaces. Never hardcode.

```js
// Additions to CFG (structure only — values are implementation decisions)
CFG.ARC = {
  totalDuration: 3000,    // seconds — default 50min
  controlPoints: { ... }, // per-dimension arc shape
};
CFG.LAYERS = {
  rhythm:  { swingBase: 0.0, swingMax: 0.28, ghostProb: 0.12, ... },
  harmony: { driftProbBase: 0.02, driftProbMax: 0.15, chordRhythm: 4, ... },
  melody:  { gravityMultBase: 0.20, gravityMultActive: 0.06, phraseLen: 4, ... },
  texture: { phasingA: 12, phasingB: 13, phasingC: 15, ... },
};
CFG.MACRO = {
  breathOffsets: { rhythm: 0, harmony: 2, melody: 1, texture: 3 }, // bars
  breathLength: 8,
};
```

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Layer topology (macro + 4 layers) | HIGH | Direct analysis of v2 limitations; established pattern in algorithmic composition |
| Euclidean rhythms | HIGH | Well-documented algorithm; existing implementation verified in codebase |
| Markov chains for melody | HIGH | Standard technique in procedural music; matching existing composition-utils.js API |
| Harmonic drift mechanism | HIGH | Directly from harmonic-techniques.md, already conceptualized for this project |
| Reich phasing via modulo counters | HIGH | Mathematically exact; established technique |
| 4-dimensional arc | HIGH | Direct translation of PROJECT.md aesthetic goals into computable form |
| Float32Array precomputed arc | HIGH | Standard approach; verified compatible with ES module zero-build constraint |
| Seeded RNG isolation per layer | HIGH | SeededRNG already available; pattern is standard |
| Power-of-2 enforcement via MacroComposer | HIGH | Mechanism matches existing bar-count pattern in composer*.js |
| New module file list | MEDIUM | Logical decomposition; exact split (e.g. bass in texture vs own layer) is implementation-time decision |
| CFG.ARC control point values | LOW | Values require musical authoring during implementation, not research |

---

## Sources

- Direct inspection of existing codebase: `src/composer.js`, `src/sequencer.js`,
  `src/presence-multiplier.js`, `src/config.js`, `src/midi.js` (2026-03-27)
- `.claude/skills/composition-depth/SKILL.md` — project's own compositional doctrine
- `.claude/skills/composition-depth/references/structural-form.md` — power-of-2 analysis
- `.claude/skills/composition-depth/references/harmonic-techniques.md` — drift modulation
- `.claude/skills/composition-depth/scripts/composition-utils.js` — existing toolkit API
- `MACH:INE II/CLAUDE.md` — anti-patterns, protected areas, skill routing
- `.planning/PROJECT.md` — aesthetic references, active requirements, constraints
- `.planning/codebase/ARCHITECTURE.md` — data flow, module boundaries
- Established theory: Toussaint (2013) "The Euclidean Algorithm Generates Traditional
  Musical Rhythms"; Reich "Music as a Gradual Process" (1968); standard Markov chain
  music generation (Xenakis, Roads)
