# Architecture Patterns — MACH:INE II v3 Layered System

**Domain:** Generative live performance system — layered compositional architecture
**Researched:** 2026-03-27
**Confidence:** HIGH (based on deep codebase analysis + established patterns in generative music systems)

---

## Premise: What Changes, What Does Not

The v2 system has a solid technical foundation that must be preserved entirely:

- Dual-thread execution (rAF + Web Worker) — keep as-is
- WebMIDI output via `midi.js` and `sendMIDINote()` — keep as-is
- Presence multiplier pattern — extend, not replace
- Visual pipeline (`field.js`, `render.js`, `director.js`) — keep PROTECTED status
- Config-first with `config.js` CFG object — keep as-is
- ES modules, zero bundler — keep as-is

What changes is the compositional layer: replacing 7 independent engines with 4 simultaneous compositional layers governed by a single macro-composer.

---

## Recommended Architecture

### Three-Tier Model

```
TIER 1: MacroComposer
  — narrative arc manager (45-60 min)
  — governs tension/climax/resolution curve
  — produces normalized parameters for all layers

TIER 2: Four Compositional Layers (parallel, simultaneous)
  — RhythmLayer     → CH0 (PULSE), CH1 (GRAIN)
  — HarmonyLayer    → CH2 (DRONE), CH4 (CHORDS)
  — MelodyLayer     → CH5 (VOICE), CH6 (LEAD)
  — TextureLayer    → CH3 (BASS), CH7 (RUPTURE)

TIER 3: Existing Infrastructure (unchanged)
  — midi.js / sendMIDINote()
  — presence-multiplier.js
  — sequencer.js (act structure, firma moments)
  — director.js / visual pipeline
```

Each tier communicates downward only. No layer reaches up to the macro-composer. The macro-composer never sends MIDI directly.

---

## Component Boundaries

### MacroComposer (`src/macro-composer.js`)

**Responsibility:** Manages the 45-60 minute narrative arc. Produces a single shared `arc` object that all layers read each tick.

**Does not:**
- Send MIDI
- Know about specific notes or rhythms
- Call layer functions directly — layers pull from the arc object

**Exports:**
```javascript
export const composerArc = {
  // Position in performance (0.0 = start, 1.0 = end)
  position: 0,

  // Normalized tension value (0.0 = silent/ambient, 1.0 = climax)
  tension: 0,

  // Current narrative phase name
  phase: 'emergence',  // emergence | deepening | machine | vortex | return

  // Per-layer intensity multipliers (0.0 - 1.0)
  layerWeights: {
    rhythm: 0,
    harmony: 0,
    melody: 0,
    texture: 0
  },

  // Harmonic center: root note (MIDI) + mode name
  harmonicCenter: { root: 57, mode: 'lydian' },  // A Lydian

  // Rhythmic density: 0 = no pulse, 1 = full groove
  rhythmicDensity: 0,

  // Phase-internal progress (0.0-1.0 within current phase)
  phaseProgress: 0,

  // Special moment flags (set by sequencer firma system)
  firma: { gelo: false, convergenza: false, vuotoTotale: false, densityCap: 1.0 },
};

export function initMacroComposer() {}
export function updateMacroComposer(dt) {}  // called from Worker tick
```

**State machine — narrative phases:**

```
emergence (0:00–8:00)
  tension: 0.0 → 0.2
  rhythmicDensity: 0 → 0.05
  dominant layers: harmony(1.0), texture(0.3)
  harmonicCenter: evolves A Lydian → E Lydian over 8 minutes

deepening (8:00–18:00)
  tension: 0.2 → 0.5
  rhythmicDensity: 0.05 → 0.4
  dominant layers: harmony(1.0), texture(0.8), rhythm(0.3)
  harmonicCenter: descends Bb Phrygian → D Dorian

machine (18:00–28:00)
  tension: 0.5 → 0.7
  rhythmicDensity: 0.4 → 0.85
  dominant layers: rhythm(1.0), harmony(0.8), melody(0.6), texture(0.4)
  harmonicCenter: C# Dorian, jazz-influenced voice leading

vortex (28:00–36:00)
  tension: 0.7 → 1.0 → 0.3
  rhythmicDensity: 0.85 → 1.0 → 0.1
  dominant layers: rhythm(1.0), all layers peak at climax
  harmonicCenter: E Phrygian → return A Lydian

return (36:00–40:00)
  tension: 0.3 → 0.0
  rhythmicDensity: 0.1 → 0
  dominant layers: harmony(0.5), texture(0.3)
  harmonicCenter: A Lydian (mirror of emergence)
```

The arc uses a **normalized tension curve**, not wall-clock time directly. The sequencer's CUES drive the phase transitions; the macro-composer converts concert time into normalized parameters. This decouples "what time is it" from "what the music should feel like."

---

### RhythmLayer (`src/layer-rhythm.js`)

**Responsibility:** All metric and rhythmic content. Manages the entire rhythmic arc from arrhythmic texture through Reich-style phasing to crystallized groove to polyrhythmic climax to dissolution.

**Reads from:** `composerArc.rhythmicDensity`, `composerArc.tension`, `composerArc.phase`

**Outputs to:** CH0 (PULSE / kick), CH1 (GRAIN / scatter rhythm)

**Internal state machine — rhythmic arc:**

```
ARRHYTHMIC (rhythmicDensity 0–0.1)
  No grid. Events triggered by brightness threshold (inherits DERIVA behavior).
  Grain notes: sparse, irregular. No PULSE.

PULSE_EMERGING (rhythmicDensity 0.1–0.3)
  Reich phasing: two patterns with slightly different cycle lengths (e.g., 16 vs 17 steps).
  PULSE at very low presence (0.1). No groove yet, just a felt pulse.
  Implementation: two independent step counters with prime-length loops.

GROOVE_FORMING (rhythmicDensity 0.3–0.6)
  Euclidean kick E(2,16) → E(3,16). Groove crystallizes.
  Swing offset begins: 0ms → +8ms over 32 bars.
  Ghost notes on GRAIN: 30% probability on off-beats, vel 25-40.

GROOVE_FULL (rhythmicDensity 0.6–0.85)
  Four Tet/Floating Points style: stable kick grid + broken GRAIN texture.
  Swing at full value (±12ms). Groove feels human.
  Pattern variations every 16 bars (Euclidean family cycling).

POLYRHYTHMIC (rhythmicDensity 0.85–1.0)
  Multiple simultaneous Euclidean patterns on CH0 and CH1.
  Cross-rhythmic: 3-against-4, 5-against-4.
  BPM is highest in the performance. Maximum density.

DISSOLUTION (rhythmicDensity 1.0 → 0)
  Patterns dissolve: steps drop out one by one.
  Returns to arrhythmic texture (mirror of opening).
  Eno-style: rhythm fades into pure texture.
```

**Reich phasing implementation:**
```javascript
// Two independent step counters with different loop lengths
// Pattern A: 16 steps, Pattern B: 17 steps (or 12 vs 13 for shorter phase)
// They drift apart, create interference, realign every LCM(16,17) = 272 steps
// At 16 steps per bar = every 17 bars they re-align — perceptible as a "resolution"
const phaseA = { steps: PATTERN_A, len: 16, cursor: 0, interval: ticksPerSixteenth };
const phaseB = { steps: PATTERN_B, len: 17, cursor: 0, interval: ticksPerSixteenth };
```

**Swing implementation:**
```javascript
// Apply timing offset to even-numbered 16th notes (off-beats)
const swingOffset = lerp(0, CFG.LAYERS.RHYTHM.maxSwingMs, composerArc.rhythmicDensity);
const isOffBeat = (stepIndex % 2 === 1);
const delayMs = isOffBeat ? swingOffset : 0;
```

---

### HarmonyLayer (`src/layer-harmony.js`)

**Responsibility:** All harmonic content. Manages the rich harmonic language: modal, jazz-influenced, voice leading that evolves over time. This is the most complex layer.

**Reads from:** `composerArc.harmonicCenter`, `composerArc.tension`, `composerArc.layerWeights.harmony`, `composerArc.phaseProgress`

**Outputs to:** CH2 (DRONE/pad), CH4 (CHORDS)

**Harmonic arc:**

The layer maintains a **current harmonic field** — a set of available pitch classes — that evolves continuously. It does not switch modes abruptly; it interpolates between modal centers.

```
Emergence:  A Lydian   (#4: bright, expansive, Floating Points feel)
Deepening:  Bb Phrygian (#b2, #b3: dark, weighty, descending)
Machine:    C# Dorian  (#b3, #7: jazz-adjacent, Four Tet feel)
Vortex:     E Phrygian (#b2: urgent, unstable)
Return:     A Lydian   (mirror of emergence — recognition)
```

**Voice leading engine:**
The harmony layer uses a **voice leading constraint** rather than random note selection:
- Chord changes prefer minimal movement (voices move by 1–2 semitones when possible)
- Bass voice moves by 4th or 5th at harmonic rhythm boundaries
- Inner voices resolve stepwise
- This produces the "warm, jazz-influenced" quality without requiring a full chord symbol system

**Drone management:**
The harmony layer owns all drone behavior, following PARTITURA-NARRATIVA rules:
- droneAge counter tracks active time per drone note
- Expansion arc: root (t=0s) → +fifth (t=30s) → +octave (t=60s)
- Dissolution arc: reverse, 30s before drone exit
- Never two drones simultaneously above presence 0.3
- dronePresence gated by composerArc.layerWeights.harmony

**Harmonic rhythm** (how often chords change):
- Emergence: 8–16 bars between changes (very slow)
- Machine: 4 bars (steady rhythm)
- Vortex climax: 2 bars (urgent)
- Return: 8–16 bars again (mirror)

---

### MelodyLayer (`src/layer-melody.js`)

**Responsibility:** Melodic content — the "voice" of the system. Uses Markov chain melody generation constrained by the active harmonic field.

**Reads from:** `composerArc.harmonicCenter`, `composerArc.tension`, `composerArc.layerWeights.melody`, `harmonyLayer.activeChord` (single exported value)

**Outputs to:** CH5 (VOICE), CH6 (LEAD)

**Markov melody generation:**
```javascript
// Transition table: from each scale degree, weighted probabilities to next
// Weights shift based on tension: low tension = stepwise motion, high tension = leaps
const TRANSITIONS_LOW_TENSION = {
  // prefer stepwise, occasional thirds
  1: { 2: 0.4, 7: 0.3, 3: 0.2, 5: 0.1 },
  2: { 1: 0.35, 3: 0.35, 4: 0.2, 5: 0.1 },
  // ...
};
const TRANSITIONS_HIGH_TENSION = {
  // prefer leaps, tritone appearances
  1: { 5: 0.3, 3: 0.25, 7: 0.2, 4: 0.15, 6: 0.1 },
  // ...
};
```

**Register/octave management:**
- Melody stays in a defined register (e.g., C4–C6) most of the time
- Register shifts up gradually as tension rises, down as it falls
- This creates the "brightening" effect without requiring explicit orchestration logic

**Emergence behavior:**
During the low-rhythmicDensity phase, melody is "drop-triggered" (brightness threshold, DERIVA style): one note every ~20 seconds, then more frequently as the system builds. This maintains the "first signs of life" quality described in PARTITURA-NARRATIVA.

---

### TextureLayer (`src/layer-texture.js`)

**Responsibility:** Everything that is neither rhythm, harmony, nor melody. Bass register notes (CH3), rupture events (CH7), sub-bass drones, noise-adjacent GRAIN bursts. The connective tissue of the system.

**Reads from:** `composerArc.tension`, `composerArc.phase`, `composerArc.layerWeights.texture`

**Outputs to:** CH3 (BASS), CH7 (RUPTURE)

**Bass behavior:**
- In low-tension phases: slow-moving bass notes (root, fifth of current harmonic center)
- In groove phases: bass follows chord root, occasionally walks (stepwise motion between chord roots)
- At climax: heavy sub-bass, sustained, minimal movement

**Rupture events (CH7):**
- Triggered by tension crossing thresholds, not by a timer
- Four-stage rupture sequence inherited from v2: omen → infiltration → takeover → residue
- TextureLayer owns rupture logic, not the macro-composer
- Tension threshold: rupture triggers when tension crosses 0.85 and stays there for 4+ bars

---

## Data Flow

### Tick-Level (Worker thread, ~2ms)

```
midi-clock.worker.js
  postMessage({ dt, now })
    → midiWorker.onmessage in main.js
      → updateMacroComposer(dt)           // updates composerArc object
      → updateRhythmLayer(dt)             // reads composerArc, sends MIDI CH0/CH1
      → updateHarmonyLayer(dt)            // reads composerArc, sends MIDI CH2/CH4
      → updateMelodyLayer(dt)             // reads composerArc + harmonyLayer.activeChord
      → updateTextureLayer(dt)            // reads composerArc, sends MIDI CH3/CH7
      → updateMIDIClock(getActiveBpm())   // 24ppqn clock ticks
```

Layers are called in dependency order: macro-composer first, then rhythm and harmony in parallel (no dependency between them), then melody (depends on harmony's current chord), then texture.

### rAF-Level (main thread, ~60fps)

```
renderFrame(now, dt)
  → composerArc.tension, composerArc.phase inform:
    → updateDirector()  — arc state machine reads composerArc.tension as additional input
    → colors.js         — setConcertTime() still called by sequencer
  → All existing visual pipeline unchanged
```

### Sequencer → MacroComposer

```
sequencer.js CUES
  → 'activate': replaced by layerWeight adjustments via composerArc
  → 'fade_to': still valid but targets layerWeights, not engines
  → 'firma': sets composerArc.firma.* flags (unchanged interface)
  → 'camera': unchanged
```

The sequencer is the conductor. It fires timed cues. The macro-composer interprets those cues as arc parameters. Layers are always running — their output is gated by their layerWeight, not by activation/deactivation.

---

## Component Communication Map

```
sequencer.js
  ↓ cues (timed events)
  ↓ firma flags
macro-composer.js
  ↓ composerArc (shared mutable object, read-only by layers)
  ├── layer-rhythm.js    → sendMIDINote(0/1, ...)
  ├── layer-harmony.js   → sendMIDINote(2/4, ...)  → exports activeChord
  ├── layer-melody.js    ← imports activeChord
  │              → sendMIDINote(5/6, ...)
  └── layer-texture.js   → sendMIDINote(3/7, ...)
        ↓
      midi.js → WebMIDI hardware output
        ↓
      midi-patterns.js → visual behavior (reads midi.newNotes, unchanged)
        ↓
      field.js / render.js / director.js (all unchanged)
```

**Key constraint:** `activeChord` is the only cross-layer dependency. RhythmLayer and HarmonyLayer are independent. TextureLayer is independent. Only MelodyLayer depends on HarmonyLayer's current chord (read-only, via exported value on harmonyLayer object).

---

## Suggested Build Order

### Phase 1 — MacroComposer skeleton + HarmonyLayer

**Why first:** All other layers depend on `composerArc`. HarmonyLayer establishes the harmonic field that MelodyLayer requires. This phase produces audible MIDI output on CH2 and CH4.

Tasks:
1. Create `src/macro-composer.js` with arc state machine, all phases, tension curve
2. Wire into `main.js` Worker handler (replaces all 7 `updateComposerN(dt)` calls)
3. Create `src/layer-harmony.js` with drone arcs, voice leading engine, chord progression
4. Add `CFG.LAYERS.HARMONY` config block in `config.js`
5. Test: 40-minute arc produces correct mode transitions and chord changes

**Verification:** MIDI monitor on CH2 and CH4 shows drone expansion arcs and harmonic rhythm changes across the 40-minute run.

---

### Phase 2 — RhythmLayer

**Why second:** Rhythm is independent of harmony. Can be built and tested in parallel once macroComposer exists. The rhythmic arc is the most perceptually obvious change from v2.

Tasks:
1. Create `src/layer-rhythm.js` with all 6 internal states (ARRHYTHMIC through DISSOLUTION)
2. Implement Reich phasing (two prime-length loop counters)
3. Implement Euclidean pattern generator (Bjorklund algorithm, ~20 lines)
4. Implement swing with lerp from composerArc.rhythmicDensity
5. Add `CFG.LAYERS.RHYTHM` config block

**Verification:** MIDI monitor on CH0 shows the arc from no pulse → phasing → groove → polyrhythm → dissolution across the performance.

---

### Phase 3 — MelodyLayer + TextureLayer

**Why third:** MelodyLayer needs harmonyLayer.activeChord (from Phase 1). TextureLayer is independent but benefits from the full harmonic context being established first for coherent bass notes.

Tasks:
1. Export `activeChord` from `layer-harmony.js` (single note + scale degrees array)
2. Create `src/layer-melody.js` with Markov chain, register management, brightness-trigger for sparse phases
3. Create `src/layer-texture.js` with bass behavior, rupture logic (migrate from v2 rupture system)
4. Add `CFG.LAYERS.MELODY` and `CFG.LAYERS.TEXTURE` config blocks

**Verification:** Full MIDI output on all 8 channels. Melody responds correctly to harmonic center changes. Rupture events fire at tension > 0.85.

---

### Phase 4 — Sequencer migration + visual integration

**Why last:** The sequencer cue format needs updating to target the new layer architecture. Director integration (layerWeights → visual parameters) is the final integration step.

Tasks:
1. Update `sequencer.js` CUES format: replace engine-specific cues with layerWeight cues
2. Add composerArc.tension as input to `director.js` arc state machine (additive to audio arc)
3. Update `midi-patterns.js` channel behavior pools if needed for new layer semantics
4. Archive v2 composer files to `src/legacy/` (do not delete until Phase 4 is verified)
5. Remove v2 engine wiring from `main.js`

---

## Migration Path: v2 → v3

### Backward-compatible migration (recommended)

Run v2 and v3 systems in parallel during development. The presence-multiplier system already gates all v2 engine output by a 0–1 value. Set all v2 engine presence multipliers to 0 when a layer is initialized and verified.

```
Migration state per layer:
  v2 engines active → v3 layer not yet built
  v2 engines at PM=0 → v3 layer active (swapped in, same MIDI channels)
  v2 engines removed → v3 layer stable
```

**File strategy:**
- Keep all 7 `composer*.js` files untouched until Phase 4 verification
- New files: `macro-composer.js`, `layer-rhythm.js`, `layer-harmony.js`, `layer-melody.js`, `layer-texture.js`
- `sequencer.js` evolves in-place (its cue format changes, but the engine is the same)
- `config.js` gains a new `CFG.LAYERS` section (existing `CFG.COMPOSER*` blocks untouched until cleanup)
- `main.js` Worker handler is the migration switchpoint: toggle between v2 engine calls and v3 layer calls via a single boolean in CFG

```javascript
// In main.js midiWorker.onmessage:
if (CFG.V3_MODE) {
  updateMacroComposer(dt);
  updateRhythmLayer(dt);
  updateHarmonyLayer(dt);
  updateMelodyLayer(dt);
  updateTextureLayer(dt);
} else {
  // existing v2 engine calls
  updateComposer(dt);
  updateComposer2(dt);
  // ...
}
```

This single boolean lets you A/B between v2 and v3 at runtime during development.

---

## Architecture Anti-Patterns to Avoid

### Anti-Pattern 1: Layers that communicate bidirectionally
**What:** MelodyLayer modifying composerArc, or RhythmLayer reading from HarmonyLayer
**Why bad:** Creates tight coupling that makes isolated testing impossible and causes emergent timing bugs in the Worker thread
**Instead:** Only one cross-layer dependency allowed: MelodyLayer reads `harmonyLayer.activeChord` (one-way, read-only)

### Anti-Pattern 2: MacroComposer driving MIDI directly
**What:** Adding note logic to macro-composer.js "for convenience"
**Why bad:** Macro-composer is a parameter system, not a composition engine. Mixing concerns makes the tension curve undebuggable.
**Instead:** Macro-composer outputs normalized parameters only. All MIDI goes through layers.

### Anti-Pattern 3: Layers with internal timers independent of the Worker clock
**What:** `setTimeout` or `Date.now()` inside a layer for timing
**Why bad:** The Worker clock is the single source of timing truth. Parallel timers drift.
**Instead:** All timing via `dt` accumulation in the Worker tick handler.

### Anti-Pattern 4: Replacing the sequencer with macro-composer logic
**What:** Encoding concert timing (firma, camera changes, act transitions) into the arc state machine
**Why bad:** The sequencer's CUES array is inspectable, editable, and tested. Encoding time into a state machine makes concert editing opaque.
**Instead:** Sequencer fires events → macro-composer responds to them. Clear separation of "what time is it" (sequencer) from "what should the music feel like" (macro-composer).

### Anti-Pattern 5: Mode switching that disrupts voice leading
**What:** Abrupt `harmonicCenter` changes (e.g., from A Lydian to Bb Phrygian in one tick)
**Why bad:** All held notes from the previous mode may be in a dissonant relationship to the new mode, producing audible clashes
**Instead:** Harmonic transitions take 4–8 bars minimum. The voice leading engine resolves current chord before committing to new root. Use a `targetHarmonicCenter` + `transitionBars` counter.

---

## Scalability Considerations

| Concern | Current (v2) | v3 as designed | If extended |
|---------|--------------|----------------|-------------|
| MIDI output bandwidth | 7 engines × channels, gated by PM | 4 layers × 2 channels each = same bandwidth | Fine up to 16 channels |
| Worker tick budget | 7 updateComposerN calls per 2ms tick | 1 macro + 4 layers per tick — similar cost | Add more layers with care |
| Config object size | 7 × CFG.COMPOSER blocks | Replace with CFG.LAYERS (smaller) | Always in config.js |
| Visual director coupling | ENGINE_PHASE_VISUALS per engine | LAYER_PHASE_VISUALS per layer (4 instead of 7) | Cleaner than v2 |

---

## Visual Integration

The visual system does not change architecturally. The integration points are:

1. **`director.js` arc input:** `composerArc.tension` maps to the existing arc state machine as an additive signal alongside `audio.rms + flux`. The director already handles `SILENCE → PEAK → DECAY`. Tension reinforces this arc, especially in the absence of audio input (pure MIDI-driven performance).

2. **`midi-patterns.js` channel semantics:** The 8 channel roles (CH0=PULSE through CH7=RUPTURE) are preserved exactly. Layers output to the same channels. The visual behavior pools remain valid.

3. **`colors.js` setConcertTime:** Sequencer still calls this. No change needed.

4. **Layer identity → visual signature:** `setEngine()` is called by layers to inform director and midi-patterns of the currently dominant layer. Replace per-engine ENGINE_PREFS with per-layer LAYER_PREFS (4 entries instead of 7, simpler).

5. **Firma moments:** `composerArc.firma` is the same object as sequencer's `firma`. Set by sequencer cues, read by layers and director. No change to the firma protocol.

---

## New File Summary

| File | Role | Depends On |
|------|------|------------|
| `src/macro-composer.js` | Arc state machine, normalized parameters | `config.js`, `sequencer.js` (firma flags) |
| `src/layer-rhythm.js` | Rhythmic arc, phasing, Euclidean, swing | `macro-composer.js`, `midi.js` |
| `src/layer-harmony.js` | Drone arcs, voice leading, chord progressions | `macro-composer.js`, `midi.js` |
| `src/layer-melody.js` | Markov melody, register management | `macro-composer.js`, `layer-harmony.js` (activeChord), `midi.js` |
| `src/layer-texture.js` | Bass, sub-bass, rupture events | `macro-composer.js`, `midi.js` |

**Files not touched:**
`midi.js`, `midi-clock.worker.js`, `audio.js`, `state.js`, `dna.js`, `field.js`, `render.js` (PROTECTED), `director.js` (PROTECTED), `generations.js`, `colors.js`, `director-events.js`

**Files touched minimally:**
- `main.js` — add V3 mode branch in Worker handler, import 5 new modules
- `config.js` — add `CFG.LAYERS` section, add `CFG.V3_MODE = false` flag
- `sequencer.js` — update CUES format for layerWeight targets (additive, existing cues still work)
- `presence-multiplier.js` — extend for layer keys alongside engine keys (or replace engine keys after Phase 4)
- `midi-patterns.js` — optionally add `setLayer()` alongside `setEngine()`

---

## Sources

- Codebase analysis: `/Users/Edo_1/MACH-INE II/MACH:INE II/src/` (all modules)
- Concert narrative: `PARTITURA-NARRATIVA.md` (confidence: HIGH — project documentation)
- Musical references: Steve Reich (phasing), Floating Points/Four Tet (groove), Brian Eno (dissolution) — standard algorithmic composition patterns (confidence: HIGH — well-established in generative music literature)
- Bjorklund Euclidean algorithm: standard algorithm, widely implemented, O(n) — confidence HIGH
- Markov chain melody generation: standard technique in algorithmic composition — confidence HIGH
- Voice leading constraint approach: standard in computer-assisted composition — confidence HIGH
- Architecture patterns (unidirectional data flow, separation of conductor/performer): confidence HIGH based on analysis of existing v2 system structure and standard functional reactive patterns

*Architecture analysis: 2026-03-27*
