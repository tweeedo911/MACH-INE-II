# Research Summary — MACH:INE II v3

**Synthesized:** 2026-03-27
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, PROJECT.md
**Overall confidence:** HIGH — all research based on direct codebase audit + established algorithmic composition theory

---

## Executive Summary

MACH:INE II v3 replaces 7 sequential monolithic engines with 4 simultaneous compositional layers
governed by a single macro-composer. The existing technical infrastructure (MIDI clock Worker,
WebMIDI lookahead, presence multiplier, visual pipeline) is solid and must not change. What changes
is the compositional layer: a MacroComposer owns a 4-dimensional narrative arc (rhythmicDensity,
harmonicColor, melodicActivity, textureDepth) and distributes normalized parameters to RhythmLayer,
HarmonyLayer, MelodyLayer, and TextureLayer. These four layers run simultaneously on the same MIDI
channels (CH0-CH7) that v2 already defines — the hardware mapping stays intact.

The central architectural insight is that all v2 problems trace back to one root cause: each engine
was an island with its own harmonic logic, BPM, and phase arc. Layering islands produces dissonance,
BPM snaps, and narrative collapse. The layered architecture eliminates this by design: one shared
harmonic state (HarmonyLayer), one shared tempo (global arc), one shared narrative trajectory
(MacroComposer). The research identifies 9 core algorithms for the compositional layer — all
zero-dependency pure JS — and confirms that all of them have partial or complete scaffolding already
present in `composition-utils.js` and `harmonic-techniques.md`.

Two infrastructure bugs must be fixed before any compositional work: the MIDI clock is scheduled on
the main thread (Pitfall 1 — causes performance stutter during GC pauses) and BPM transitions snap
instead of lerping (Pitfall 4 — breaks performer's internal clock). These are non-negotiable
prerequisites. Everything compositionally interesting depends on them being resolved first.

---

## Key Findings

### From STACK.md

**Architecture decision:**
Replace 7 parallel monolithic engines with MacroComposer + 4 functional layers. The layered
architecture eliminates inter-engine harmonic dissonance by design (all layers share one harmonic
state) and enables genuine dialogue between rhythmic, harmonic, melodic, and textural dimensions.

**Core algorithms (all zero-dependency pure JS, all HIGH confidence):**

| Algorithm | Module | Status |
|-----------|--------|--------|
| Euclidean rhythms (Bjorklund) | `euclideanEvolve()` | EXISTS in composition-utils.js |
| Markov chain melody | `markovChain()` | EXISTS in composition-utils.js |
| Harmonic drift / voice leading | `driftChord()`, `voiceLeadContrario()` | EXISTS in harmonic-techniques.md |
| Reich-style phasing (modulo counters) | New — TextureLayer | ~20 lines, trivial |
| Probability density for velocity | `humanizeVelocity()` | EXISTS in composition-utils.js |
| Breath cycles / phrase dynamics | `phrasedPresence()` scaffold | EXISTS in SKILL.md |
| Tonal gravity (resolution weighting) | New — MelodyLayer | Simple counter pattern |
| 4-dimensional narrative arc | New — NarrativeArc / MacroComposer | Float32Array precomputed |
| Seeded RNG per layer | `SeededRNG` | EXISTS in perf-utils.js |

**New files to create:** `src/macro-composer.js`, `src/narrative-arc.js`, `src/layers/rhythm.js`,
`src/layers/harmony.js`, `src/layers/melody.js`, `src/layers/texture.js`

**Hard constraints (non-negotiable):**
- Zero external dependencies, zero bundler, zero npm
- CH0-CH7 MIDI channel assignments unchanged (performer's hardware is mapped)
- `field.js`, `render.js`, `director.js` are PROTECTED — no changes
- 5-phase arc (germoglio → pulsazione → densita → rottura → dissoluzione) and 4-stage rupture are PROTECTED

---

### From FEATURES.md

**Table stakes (missing = incomplete product):**

| Feature | Current State |
|---------|--------------|
| Harmonic compatibility across all active layers | MISSING — engines are harmonically unrelated |
| Continuous rhythmic thread (hi-hat/ride across transitions) | MISSING — documented gap in CONCERNS.md |
| Velocity humanization per channel | UNKNOWN — not in CONCERNS.md |
| Per-channel pitch range enforcement | UNKNOWN |
| Staggered narrative arc (dimensions peak at different times) | PARTIAL — v2 peaked simultaneously at min 24 |
| BPM transition crossfade (lerp not snap) | MISSING — confirmed CONCERNS.md |
| Phrase-shape modeling (silence as compositional tool) | UNKNOWN |
| Stable 45-60 min run without collapse | PARTIALLY FIXED per CONCERNS.md |

**Differentiators (what makes v3 exceptional):**
- Reich-style phasing between layers (emergent polyrhythm, no human can compose in real-time)
- Floating Points upper-structure voicings (lush, jazz-inflected without being busy)
- Modal color arc (harmony shifts character within an act without changing root)
- False-resolution climax structure (~minute 35: full percussion drop for 8 bars, then reintroduction at higher density)
- CC automation (CC7/CC11/CC1) for macro dynamics — removes interpretive burden from performer
- MIDI Program Change 2-4 bars before act transitions (advance cue to hardware synths)

**Anti-features (explicitly excluded):**
- Fragmented aggressive rhythm (Objekt/Arca style)
- Reactive audio input (one-way only: AI generates, human interprets)
- Simultaneous dimensional peaks (the v2 minute-24 cause)
- Random harmony (use weighted probability with voice-leading constraints)
- BPM snap transitions
- Complex UI — system runs autonomously

**Feature dependency critical path:**
`Harmonic compatibility → Modal color arc → everything else compositionally interesting`
`Hi-hat continuity → BPM crossfade → Narrative arc (rhythmic dimension)`
`Stable runtime → All features above`

---

### From ARCHITECTURE.md

**Three-tier model:**
```
Tier 1: MacroComposer  — narrative arc, normalized parameters (no MIDI output)
Tier 2: 4 Layers       — simultaneous, each owns 2 MIDI channels, reads arc read-only
Tier 3: Infrastructure — midi.js, presence-multiplier.js, sequencer.js, visual pipeline (UNCHANGED)
```

**Component boundaries:**

- `MacroComposer` — exports `composerArc` object with `tension`, `phase`, `layerWeights`,
  `harmonicCenter`, `rhythmicDensity`, `phaseProgress`, `firma`. Never sends MIDI. Never
  calls layer functions directly. Layers pull from the arc.
- `RhythmLayer` → CH0 (PULSE), CH1 (GRAIN). Internal state machine: ARRHYTHMIC → PULSE_EMERGING
  → GROOVE_FORMING → GROOVE_FULL → POLYRHYTHMIC → DISSOLUTION.
- `HarmonyLayer` → CH2 (DRONE), CH4 (CHORDS). Owns single shared harmonic state. All other
  layers read `harmonyLayer.activeChord` (the only permitted cross-layer dependency).
- `MelodyLayer` → CH5 (VOICE), CH6 (LEAD). Depends on `harmonyLayer.activeChord` (read-only).
- `TextureLayer` → CH3 (BASS), CH7 (RUPTURE). Owns rupture logic (4-stage sequence).

**Harmonic arc per narrative phase:**
- Emergence (0-8 min): A Lydian
- Deepening (8-18 min): Bb Phrygian → D Dorian
- Machine (18-28 min): C# Dorian (jazz feel)
- Vortex (28-36 min): E Phrygian → return A Lydian
- Return (36-40 min): A Lydian (mirror of emergence)

**Data flow (Worker thread, 2ms):**
```
midi-clock.worker.js tick → updateMacroComposer(dt)
  → updateRhythmLayer(dt)    (reads composerArc)
  → updateHarmonyLayer(dt)   (reads composerArc, exports activeChord)
  → updateMelodyLayer(dt)    (reads composerArc + activeChord)
  → updateTextureLayer(dt)   (reads composerArc)
  → updateMIDIClock(bpm)
```

**Migration strategy:** Single boolean `CFG.V3_MODE` in `main.js` Worker handler switches between
v2 engine calls and v3 layer calls. V2 `composer*.js` files survive untouched until Phase 4 cleanup.
This enables live A/B comparison during development.

---

### From PITFALLS.md

**Top 5 critical pitfalls:**

**1. Main-thread GC kills MIDI lookahead (CRITICAL — fix first)**
`updateMIDIClock()` runs on the main thread, not inside the Worker. GC pauses at peak visual density
can drain the 50ms lookahead buffer, causing Ableton PLL stutter. Fix: move all clock scheduling
inside `midi-clock.worker.js`. This is a prerequisite for everything else.

**2. Harmonic collision between simultaneous layers (CRITICAL — design first)**
All 7 v2 engines have independent modal roots. In a simultaneous layered system, unrelated roots
produce unintentional dissonance within minutes. Fix: MacroComposer enforces a harmonic compatibility
matrix — all active layers share a common root (A or D). Define this before writing any layer code.

**3. Narrative arc entropy collapse (CRITICAL — design before implementation)**
Without a global arc parameter, individual layer phase machines cancel each other out (one building
while another dissolves), producing monotonous medium intensity after ~20 minutes. Fix: MacroComposer
owns a global pre-composed arc (Float32Array). Layers are forbidden from driving their own timing.
Mandatory checkpoints: arc=0.5 (at least one layer in rottura), arc=0.75 (all layers at ceiling),
arc=0.83 (mandatory dissolve begins, layers deactivate in sequence, never re-activate).

**4. BPM snap breaks performer's internal clock (CRITICAL — fix before performance tests)**
`getActiveBpm()` threshold comparison snaps BPM instantly at engine crossfade. 92→120 BPM jump
causes Ableton PLL transient instability. Fix: `targetBpm` + `clockBpm` with lerp at ≤2 BPM per beat.
Alternatively: BPM is a function of global arc only (preferred in v3 layered design).

**5. `resetAllMultipliers()` MIDI burst during transitions (HIGH)**
`resetAllMultipliers()` sets all values to 1.0, not 0.0. Any transition code path triggering it
produces a full-velocity burst across all 8 MIDI channels. Fix: add `resetAllMultipliersSilent()`
(sets to 0.0); audit all call sites; never call during active performance.

**Additional warnings:**
- Pitfall 7: Stale `sessionStorage` schema on v3 first boot — add `schemaVersion` check
- Pitfall 10: Cue array typos silently skip layers — add boot-time validation pass
- Pitfall 11: `director.js` ENGINE_PREFS keyed by v2 engine names — resolve identity strategy before touching director
- Pitfall 12: 169 `Math.random()` calls per frame — replace with `SeededRNG` before compositional debugging
- Pitfall 13: `fpsAutoLimit = 30` never enforced — 120Hz displays compress concert timing

---

## Implications for Roadmap

### Recommended Phase Structure

**Phase 0 — Infrastructure Hardening** (prerequisite, no new features)
- Move `updateMIDIClock()` entirely inside `midi-clock.worker.js` (Pitfall 1)
- Implement `targetBpm`/`clockBpm` lerp in midi.js (Pitfall 4)
- Add `resetAllMultipliersSilent()` and audit all call sites (Pitfall 5)
- Enforce `fpsAutoLimit` in main.js rAF guard (Pitfall 13)
- Add `schemaVersion` to sessionStorage state (Pitfall 7)
- Replace hot-path `Math.random()` with `SeededRNG` in composition engines (Pitfall 12)
- Archive v2 to a dedicated git branch

**Rationale:** Performance bugs that cause audible stutter or timing collapse must be fixed before any
compositional iteration. Testing new composition against a broken clock is wasted work.
**Research flag:** Standard patterns — no phase research needed.

---

**Phase 1 — MacroComposer + HarmonyLayer** (compositional foundation)
- `src/macro-composer.js`: arc state machine, 5 narrative phases, 4-dimensional arc, harmonic compatibility enforcement
- `src/narrative-arc.js`: precomputed Float32Array curves, control point authoring
- `src/layers/harmony.js`: drone arc expansion/dissolution, voice leading engine, chord progressions, `activeChord` export
- `CFG.LAYERS.HARMONY` + `CFG.V3_MODE` flag in config.js
- Main.js: add V3_MODE branch in Worker handler

**Rationale:** All other layers depend on `composerArc`. HarmonyLayer establishes the harmonic
foundation that MelodyLayer requires. This phase produces the first audible v3 MIDI output on CH2/CH4.
**Verification:** 40-minute arc produces correct mode transitions on MIDI monitor.
**Research flag:** Well-documented patterns — no phase research needed.

---

**Phase 2 — RhythmLayer** (rhythmic arc)
- `src/layers/rhythm.js`: 6 internal states (ARRHYTHMIC → DISSOLUTION)
- Reich phasing (two prime-length modulo counters: 12/13 or 16/17 steps)
- Euclidean pattern evolution driven by `composerArc.rhythmicDensity`
- Swing lerp from arc; ghost notes on GRAIN channel
- `CFG.LAYERS.RHYTHM` config block

**Rationale:** RhythmLayer is independent of HarmonyLayer — can be built and tested in parallel
once MacroComposer exists. The rhythmic arc is the most perceptually obvious change from v2.
**Verification:** CH0 MIDI monitor shows full arc from no pulse to polyrhythm to dissolution.
**Research flag:** Well-documented patterns — no phase research needed.

---

**Phase 3 — MelodyLayer + TextureLayer** (full compositional voice)
- `src/layers/melody.js`: Markov chain melody, `lerpMarkovMatrix()`, tonal gravity counter, register management, brightness-triggered sparse emission
- `src/layers/texture.js`: bass behavior (root/fifth tracking), 4-stage rupture logic (migrated from v2), sub-bass drones
- `CFG.LAYERS.MELODY` + `CFG.LAYERS.TEXTURE`

**Rationale:** MelodyLayer depends on `harmonyLayer.activeChord` (Phase 1). TextureLayer can be
built independently but benefits from full harmonic context for coherent bass notes.
**Verification:** Full MIDI output on all 8 channels; rupture fires at tension > 0.85.
**Research flag:** MelodyLayer Markov matrix tuning (per aesthetic — Reich/Glass/Four Tet/Eno) may
benefit from a focused research pass on specific transition probabilities.

---

**Phase 4 — Sequencer Migration + Visual Integration + Cleanup**
- Update `sequencer.js` CUES format: engine-specific cues → layerWeight targets
- Add boot-time cue validation (Pitfall 10)
- Resolve `director.js` identity strategy for layered architecture (Pitfall 11)
- `composerArc.tension` as additive input to director arc state machine
- Add CC automation output (CC7/CC11/CC1) per channel — this is the "alive" delivery mechanism
- Optionally add MIDI Program Change advance cue system
- Archive v2 `composer*.js` to `src/legacy/`
- Remove v2 engine wiring from `main.js`

**Rationale:** Sequencer cue format cannot be updated until layers are verified (Phase 3). Director
integration is the final step — touching it before layers are stable would require rework.
**Research flag:** Director engine-identity resolution strategy may need a dedicated design pass
before implementation — the 1145-line protected file makes this higher-risk than other phases.

---

### Staggered Dimensional Peaks (mandatory design constraint for MacroComposer)

```
Harmonic climax:  ~minute 28 (arc = 0.65)
Dynamic climax:   ~minute 33 (arc = 0.75)
Rhythmic climax:  ~minute 38 (arc = 0.83)
False resolution: ~minute 35 (drop percussion 8 bars, reintroduce at higher density)
Mandatory dissolve begins: ~minute 40 (arc = 0.83)
Final texture only: ~minute 50 (arc = 0.92)
```

Peaks must never align. This is the direct lesson from v2's minute-24 wall-of-sound collapse.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Infrastructure bugs (Pitfalls 1-5) | HIGH | Directly evidenced in CONCERNS.md + codebase audit |
| Layer topology (MacroComposer + 4 layers) | HIGH | Direct analysis of v2 limitations; established algorithmic composition pattern |
| Euclidean rhythms + existing toolkit | HIGH | Existing implementation verified in codebase |
| Markov chain melody | HIGH | Standard technique; matching existing composition-utils.js API |
| Harmonic drift + voice leading | HIGH | Directly from harmonic-techniques.md, already conceptualized |
| Reich phasing via modulo counters | HIGH | Mathematically exact; trivial to implement |
| 4-dimensional narrative arc | HIGH | Direct translation of PROJECT.md aesthetic goals into computable form |
| Harmonic arc (specific modes per phase) | HIGH | ARCHITECTURE.md proposes specific modes; musically coherent with references |
| CC automation behavior | MEDIUM | Hardware-specific; Prophet/Moog/Juno CC maps vary — verify against manuals |
| CFG.ARC control point values | LOW | Require musical authoring during implementation — cannot research in advance |
| Markov transition matrix values | LOW | Require musical authoring and testing per aesthetic reference |
| Director identity resolution strategy | MEDIUM | Protected file; design decision needed before Phase 4 |

---

## Open Questions / Gaps to Address

These are decisions that cannot be made through research — they require implementation choices.

1. **Bass layer placement:** Should CH3 BASS live in `texture.js` (adjacent to GRAIN) or its own
   `bass.js` (closer to harmonic logic)? Impact on voice leading coupling. Defer to Phase 3 start.

2. **CC map for specific hardware:** Prophet-6, Moog Subsequent 37, Juno-106 CC assignments for
   filter/resonance/envelope. Requires hardware manual lookup before Phase 4 CC automation.

3. **Director engine identity resolution:** When multiple layers are simultaneously active, how does
   `director.js` determine the visual aesthetic — highest-PM layer wins? Blend? MacroComposer
   directive? Must be decided before Phase 4 touches the protected file.

4. **Markov matrix values per aesthetic:** The specific transition probabilities for Reich, Eno,
   Four Tet, Floating Points styles require musical authoring and listening tests during Phase 3.
   Cannot be pre-specified without iteration.

5. **Breath offset coordination:** The 4-layer breath offset (rhythm=0, melody=1, harmony=2,
   texture=3 bars) creates a rolling dynamic wave. Actual values need calibration against 54-92 BPM
   range to ensure the offset feels musical, not mechanical.

6. **`presence-multiplier.js` extension vs replacement:** Can the existing PM system support
   per-layer (not per-engine) gating without a full rewrite? Needs a read of the actual source
   before Phase 1 begins.

---

## Aggregated Sources

- Codebase: `src/composer*.js`, `src/sequencer.js`, `src/presence-multiplier.js`, `src/config.js`, `src/midi.js` (direct inspection 2026-03-27)
- `.claude/skills/composition-depth/SKILL.md` — project compositional doctrine
- `.claude/skills/composition-depth/references/structural-form.md` — power-of-2 analysis
- `.claude/skills/composition-depth/references/harmonic-techniques.md` — drift + voice leading
- `.claude/skills/composition-depth/scripts/composition-utils.js` — existing algorithm toolkit
- `MACH:INE II/CONCERNS.md` — confirmed runtime bugs, v2 collapse analysis
- `.planning/PROJECT.md` — requirements, aesthetic references, constraints
- `.planning/codebase/ARCHITECTURE.md` — v2 data flow and module boundaries
- Established theory: Toussaint (2013) "The Euclidean Algorithm Generates Traditional Musical Rhythms"; Reich "Music as a Gradual Process" (1968); standard Markov chain generation (Xenakis, Roads); Eno "Music for Airports" liner notes
