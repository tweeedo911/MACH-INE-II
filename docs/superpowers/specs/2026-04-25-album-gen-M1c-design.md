# album-gen M1c — Design

**Date:** 2026-04-25
**Status:** brainstorm complete, awaiting plan(s)
**Predecessor:** M1b (`v0.3.0-M1b`, merged into `main` at `618af53`)

## Problem statement

After M1b live smoke test, all 5 songs of an album sound essentially the same: same chord progression (G dorian, hardcoded in `DEFAULT_TRACK_DEF.chords`), same bass pattern, same drum groove, same SynthDef sonority. The variation between songs (intensity, role, seed) only affects ghost hits and humanization — microscopic differences. The user wants:

> "ogni song deve avere le sue caratteristiche. l'album non deve essere un concept per forza ma avere una sua identità"

Translation: each song must have its own character; the album as a whole has a coherent sonic identity, not necessarily a narrative concept.

Additionally, the user wants:
- A new vocabulary for genres ("inventare generi nuovi"), not the usual ambient/dub/techno labels.
- The 9 SynthDef from M1a refined into something specific to album-gen.
- A parallel work track for sound design (AI-driven) that doesn't block the compositional engine.
- Expressive sound — synths must be *modulated by the composition*, not static presets.

## Solution overview

M1c introduces three layers above the M1b motor (which stays intact):

1. **Vocabulary layer** — a 6×6 grid of *substance* × *gesture* defines the artistic identity. Substance = timbre/material; gesture = structure/movement. Names are evocative, monosyllabic, English-rare or arcaic.
2. **Compositional mapping** — substance + gesture map to concrete parameters (chord progressions as mode-relative shapes, bass pattern pools, drum grooves, BPM scaling, register ranges, phase distribution). The map is curated, the patterns are seed-driven within the curation.
3. **Sound Lab** — a parallel sub-system where an AI agent generates SynthDef and modulation rules per substance, with a CLI workflow (batch + on-demand) and validation pipeline.

A new **tarot-style setup screen** lets the user compose the album by drag-and-drop (1 dominant substance + 5 gesture cards in sequence), with live preview and per-song override (L.3 substance break).

The expressivity is achieved via a **2-level modulation engine**: per-note extras (cutoff, drive, etc. computed from velocity/phaseProgress/density) embedded in OSC note frames + continuous `/synth/<n>/params` frames emitted every 16th from an `expression-weaver` running alongside the 5 composers.

---

## Decisions log

Decisions taken during brainstorming, with the option chosen marked **bold**:

| # | Topic | Options considered | Chosen |
|---|---|---|---|
| 1 | Identity choice granularity | A) Album-level / B) Per-song / **C) Hybrid (album default + per-song tweak)** | **D.3 hybrid** |
| 2 | Vocabulary structure | E.1 Single-axis / **E.2 Two-axis (substance × gesture)** / E.3 Three-axis | **E.2** |
| 3 | Vocabulary naming style | Generic / **Rare English / arcaic / monosyllabic** | rare-arcaic monosyllabic |
| 4 | Substance lexicon (6) | (proposed by AI) | **GRIT, BRINE, ORE, HAZE, JOLT, LOAM** |
| 5 | Gesture lexicon (6) | (proposed by AI) | **THRUM, DRIFT, RIVEN, LOOM, CREST, FAULT** |
| 6 | Sound design ownership | G.1 manual / **G.2 dedicated AI agent** / G.3 hybrid | **G.2** |
| 7 | Sound-lab invocation | **I.1 CLI on-demand** + **I.2 batch per substance** / I.3 auto / I.4 full matrix | **I.1 + I.2** |
| 8 | SynthDef parameter contract | J.1 minimal / J.2 fixed extended / **J.3 metadata per-synth + 2-level expression** | **J.3** |
| 9 | Substance / gesture responsibility | **K.1 strict separation** / K.2 partial overlap / K.3 explicit 6×6 matrix | **K.1** |
| 10 | Album form (sequence + coherence) | L.1 single-substance / L.2 free / **L.3 dominant-substance + breaks** | **L.3** |
| 11 | Setup screen UI form | M.1 wizard / M.2 dashboard / M.3 generative-preview-loop / **N.1 tarot drag-and-drop** | **N.1 tarot** |

---

## 1 — Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Setup Screen (Tarot, N.1)                   │
│    pick substance + arrange 5 gesture cards + per-song override │
└─────────────────────────────────────────────────────────────────┘
                                ↓ generates album.yaml
┌─────────────────────────────────────────────────────────────────┐
│                Compositional Mapping Layer (M1c-α)              │
│  Gesture → BPM, chord-shape, bass-pool, drum-groove, arc        │
│  Substance → synth-preset, modulation-rules, register, palette  │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│           Composer Bundle (M1b, untouched)                      │
│   createRealComposers → 5 songs, 9 instruments, MIDI/OSC events │
│   + Expression Weaver (M1c-γ) emits continuous /params          │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│           OSC bridge + sclang + SynthDef v2 (M1c-δ)             │
│   /synth/<name>/note  freq amp dur [extras...]                  │
│   /synth/<name>/params  k v k v   (continuous modulation)       │
└─────────────────────────────────────────────────────────────────┘

                          ⇅ parallel ⇅

┌─────────────────────────────────────────────────────────────────┐
│                  Sound Lab — sub-system (M1c-δ)                 │
│   CLI:  npm run sound-lab -- --substance GRIT [--synth bass]    │
│   → AI agent (sound-designer-sc subagent)                       │
│   → produces sc/synths/<sub>/<family>.scd + .yaml + WAV preview │
│   → validates + auto-commits + hot-reloads in live engine       │
└─────────────────────────────────────────────────────────────────┘
```

**Filesystem additions:**

```
album-gen/
├── index-setup.html                      [NEW: tarot UI entry]
├── src/
│   ├── composers/                        [M1b, untouched]
│   ├── core/                             [M1b + extended config-loader]
│   ├── mapping/                          [NEW: M1c-α]
│   │   ├── substance-presets.yaml
│   │   ├── gesture-presets.yaml
│   │   ├── arc-presets.yaml
│   │   ├── chord-shapes.yaml
│   │   ├── mapper.js
│   │   └── expression-applier.js         [M1c-γ]
│   ├── setup/                            [NEW: M1c-β]
│   │   ├── tarot.js
│   │   ├── tarot-cards.js
│   │   ├── preview-runner.js
│   │   └── tarot.css
│   ├── live/                             [M1a]
│   ├── shared/                           [M1b + extended world-state]
│   └── composers/expression-weaver.js    [NEW: M1c-γ]
├── sc/synths/                            [M1c-δ + ε]
│   ├── grit/        bass.scd + bass.yaml + ... 9 families
│   ├── haze/        ...
│   ├── jolt/        ...
│   ├── loam/        ...
│   ├── brine/       ...
│   ├── ore/         ...
│   └── _shared/     default_<family>.scd  (M1a fallback)
├── sc/modulation-rules/                  [NEW: M1c-γ + δ]
│   ├── _default.yaml
│   ├── grit.yaml
│   ├── haze.yaml
│   └── ...
├── sound-lab/                            [NEW: M1c-δ]
│   ├── sound-lab-cli.js
│   ├── agent-brief-template.md
│   ├── validate-synthdef.scd
│   └── .previews/   <substance>_<family>.wav  (gitignored)
└── albums/generated/                     [NEW: setup-screen output]
    └── <timestamp>-<slug>.yaml
```

The M1b motor (`composer-harness.js`, `song-director.js`, the 5 composers, OSC bridge, launcher) **stays untouched** — M1c augments. The only M1b files modified by M1c are: `harmony.js` (chord shape engine), `bass-v3.js` (bass pattern pool), `phase-map.js` (gesture-aware), `song-director.js` (apply density_bias and rhythm_grid from preset), `config-loader.js` (M1c defaults).

---

## 2 — Vocabulary

### 2.1 Substances (6) — what the sound *is*

| Name | Poetic | Sonic qualities | Register bias |
|---|---|---|---|
| **GRIT** | grana, pulviscolo secco | short attack, noise-biased, mid-high, dry | bass [36-55], lead [78-96] |
| **BRINE** | salmastro, dilatato | long sustains, fluid, chorus, broad spectrum | bass [24-50], chords [55-72] |
| **ORE** | minerale grezzo, freddo | metallic resonances, ring mod, inharmonic | narrow mid, tight register |
| **HAZE** | foschia, velature | LPF heavy, drone-first, ambient space | wide, sub open |
| **JOLT** | scarica, attacco duro | saw-rich, distorted, fuzzy, mid-aggressive | mid, no sub-rumble |
| **LOAM** | terra grassa, organico | warm, mid-low, resonant, woody | low-mid centred |

### 2.2 Gestures (6) — how the sound *moves*

| Name | Poetic | Compositional traits | BPM scale |
|---|---|---|---|
| **THRUM** | ronzio pulsante continuo | 4-on-floor stretto, density centered on `densita` phase | 1.00× |
| **DRIFT** | alla deriva, no pulse | rhythm silence, drone-first, slow chord shifts | 0.55× |
| **RIVEN** | spaccato, interrotto | scatter percussion, fragmented chord, rest-heavy | 0.95× |
| **LOOM** | telaio, ricircolo che muta | tape-loop irregular, 8-bar cyclic, slow harmonic motion | 0.85× |
| **CREST** | cresta, salita | density crescendo across song, ascending chord steps | 1.10× |
| **FAULT** | faglia, crepa che cede | starts dense, collapses into rottura+dissoluzione | 0.90× |

### 2.3 Combinatorics

6 × 6 = **36 sonic identities**. Examples:
- `HAZE × DRIFT` → ambient amniotic (echo of MACH:INE NEBBIA)
- `JOLT × THRUM` → burnt techno
- `ORE × RIVEN` → fragmented metallic noise (Autechre-adjacent)
- `LOAM × LOOM` → warm cyclic minimalism
- `BRINE × CREST` → swelling tide
- `GRIT × FAULT` → dry rhythm that collapses

---

## 3 — Sound Lab (M1c-δ)

Parallel sub-system that produces SynthDef + metadata + modulation rules per substance, run by an AI agent, validated automatically.

### 3.1 CLI

```bash
npm run sound-lab -- --substance GRIT                 # batch: 9 synths for GRIT
npm run sound-lab -- --substance GRIT --synth bass    # single
npm run sound-lab -- --substance GRIT --synth bass --force   # re-roll
npm run sound-lab -- --validate GRIT/bass             # boot+RMS+leak check only
npm run sound-lab -- --status                         # show 6×9 matrix coverage
npm run sound-lab -- --substance GRIT --interactive   # edit brief before dispatch
```

### 3.2 Agent brief template (auto-generated)

```
SUBSTANCE: GRIT
  poetic: grana fine, attacchi corti, secco, pulviscolo
  sonic_qualities: short-attack, noise-biased, mid-high register, zero-reverb
  palette: cool-dry, percussive-family

SYNTH FAMILY: bass
  role: sub-bass (30-55 Hz), supports harmonic ground
  contract_required_args: freq, amp, dur
  suggested_extra_params: cutoff, drive, noise, attack
  register: [24, 55]

OUTPUT REQUIREMENTS:
  file:     sc/synths/grit/bass.scd
  metadata: sc/synths/grit/bass.yaml
  must: .add (not .store), self-free via doneAction:2, stereo out
  must_not: use Buffers (no sample dependencies), no blocking reads

VALIDATION (run by CLI after generation):
  - sclang loads file without error
  - Synth.new(\grit_bass) produces RMS > 0.01 over 200ms
  - .free() returns to 0 active nodes
```

### 3.3 Per-synth metadata format

```yaml
# sc/synths/grit/bass.yaml
name: grit_bass
substance: GRIT
family: bass
required: [freq, amp, dur]
extras:
  cutoff:  { range: [0.1, 1.0], default: 0.6, curve: exp }
  drive:   { range: [0, 1],     default: 0.2 }
  noise:   { range: [0, 0.5],   default: 0.1 }
notes: "granular-attack bass, mid-high noise content, short envelope"
```

### 3.4 Validation pipeline

The CLI runs the following sequence on each generated `.scd`:

1. `sclang` boot + load → catches syntax errors
2. `Synth.new` with default args, 200ms recording → catches silence / infinite loops
3. RMS check (>0.01 to ensure audible, <1.0 to avoid clipping)
4. `Node.free` then check active nodes = 0 → catches resource leaks
5. Schema check on `.yaml` → catches malformed metadata
6. Render WAV to `sound-lab/.previews/<substance>_<family>.wav` for optional human ear-check
7. Auto-commit if all pass: `sound-lab: GRIT/bass`

If any step fails, agent is re-dispatched with the failure as feedback (max 3 retries). After 3 failures the file is discarded and the CLI reports the error.

### 3.5 Hot-reload during live

`album-engine.scd` registers an OSC handler `/sound-lab/reload <path>` that `.load`s the file. The CLI emits this message after each commit, so the sound designer hears changes live without restarting sclang.

### 3.6 Output: 6×9 matrix populated incrementally

Initially populated by **M1c-δ** (1 pilot substance: HAZE). Remaining 5 substances populated by **M1c-ε** in sequential batches.

---

## 4 — Compositional mapping (M1c-α)

Following the K.1 separation principle: substance defines TIMBRE, gesture defines STRUCTURE.

### 4.1 Substance presets

```yaml
# src/mapping/substance-presets.yaml
GRIT:
  poetic: "grana fine, attacchi corti, secco, pulviscolo"
  register: { bass: [36,55], chords: [60,80], melody: [72,90], lead: [78,96] }
  palette_intensity: percussive
  synth_dir: sc/synths/grit/
  modulation_rules: sc/modulation-rules/grit.yaml

HAZE:
  register: { bass: [24,48], chords: [55,75], melody: [60,84], lead: [72,96] }
  palette_intensity: ambient
  synth_dir: sc/synths/haze/
  modulation_rules: sc/modulation-rules/haze.yaml

# ... BRINE, JOLT, LOAM, ORE, plus _default fallback
```

### 4.2 Gesture presets

```yaml
# src/mapping/gesture-presets.yaml
THRUM:
  bpm_scale: 1.00
  density_bias: { rhythm: +0.15, bass: +0.10, melody: -0.10, texture: -0.10 }
  rhythm_grid: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]
  chord_shape: cyclic_short
  bass_pattern_pool: [thrum_a, thrum_b, thrum_c]
  drum_groove: 4_on_floor_dry
  phase_distribution:
    germoglio: 0.05
    pulsazione: 0.30
    densita: 0.50
    rottura: 0.10
    dissoluzione: 0.05
  song_duration_weight: 1.0

DRIFT:
  bpm_scale: 0.55
  density_bias: { rhythm: -0.40, harmony: +0.20, bass: -0.30, texture: +0.30 }
  rhythm_grid: null
  chord_shape: shifting_triads
  bass_pattern_pool: [drone_low, drone_low_oct]
  drum_groove: silence
  phase_distribution: { germoglio: 0.30, pulsazione: 0.40, densita: 0.20, rottura: 0.05, dissoluzione: 0.05 }
  song_duration_weight: 1.4

CREST:
  bpm_scale: 1.10
  density_bias:
    rhythm:  { from: 0.2, to: 0.85 }    # interpolated over phaseProgress
    harmony: { from: 0.3, to: 0.7 }
    bass:    { from: 0.2, to: 0.8 }
    melody:  { from: 0.0, to: 0.9 }
  rhythm_grid: [1,0,0,0, 1,0,0,0, 1,0,1,0, 1,0,0,0]
  chord_shape: ascending_steps
  bass_pattern_pool: [crest_walking, crest_step]
  drum_groove: building
  phase_distribution: { germoglio: 0.15, pulsazione: 0.30, densita: 0.35, rottura: 0.20, dissoluzione: 0.0 }
  song_duration_weight: 1.2

FAULT:
  bpm_scale: 0.90
  density_bias:
    rhythm:  { from: 0.7, to: 0.0 }     # starts dense, COLLAPSES
    harmony: { from: 0.6, to: 0.1 }
    bass:    { from: 0.7, to: 0.0 }
  rhythm_grid: [1,0,1,0, 1,1,0,0, 1,0,0,1, 1,0,0,0]
  chord_shape: collapsing
  bass_pattern_pool: [fault_dropping, fault_glitch]
  drum_groove: granitic_then_dead
  phase_distribution: { germoglio: 0.0, pulsazione: 0.10, densita: 0.30, rottura: 0.40, dissoluzione: 0.20 }
  song_duration_weight: 0.8

LOOM:
  bpm_scale: 0.85
  density_bias: { harmony: +0.10, melody: -0.05, texture: +0.10 }
  rhythm_grid: [1,0,1,0, 0,1,0,1, 1,0,1,0, 0,1,0,0]
  chord_shape: cyclic_long
  bass_pattern_pool: [loom_pulse, loom_walk]
  drum_groove: tape_loop_8th
  phase_distribution: { germoglio: 0.10, pulsazione: 0.40, densita: 0.40, rottura: 0.05, dissoluzione: 0.05 }

RIVEN:
  bpm_scale: 0.95
  density_bias: { rhythm: +0.20, melody: +0.15, texture: +0.15 }
  rhythm_grid: [1,1,0,0, 0,1,1,0, 1,0,0,1, 0,0,1,0]
  chord_shape: fragmented
  bass_pattern_pool: [riven_stab, riven_silent]
  drum_groove: scatter
  phase_distribution: { germoglio: 0.05, pulsazione: 0.20, densita: 0.30, rottura: 0.40, dissoluzione: 0.05 }
```

### 4.3 Arc presets

```yaml
# src/mapping/arc-presets.yaml
SALITA:    { sequence: [DRIFT, LOOM, THRUM, CREST, FAULT] }
ONDA:      { sequence: [DRIFT, LOOM, CREST, FAULT, DRIFT] }
DISCESA:   { sequence: [CREST, RIVEN, FAULT, LOOM, DRIFT] }
PIATTO:    { sequence: [DRIFT, LOOM, THRUM, LOOM, DRIFT] }
```

### 4.4 Chord shapes (mode-relative)

```yaml
# src/mapping/chord-shapes.yaml
cyclic_short:    [I, V, I, IV]
cyclic_long:     [I, iv, VII, I, V, iv, II, I]
shifting_triads: [i, bVI, ii, bVI]
ascending_steps: [I, IV, V, V, I, IV, V, vi]
collapsing:      [I, bVII, bV, i]
fragmented:      [I, bV, bII, vi]
```

`harmony.js` is extended (M1c-α) to read `worldState.chordShape` and build chord triads from degrees on the current scale, replacing the hardcoded `DEFAULT_TRACK_DEF.chords`. This solves the M1b "everything sounds in Gm" problem definitively.

### 4.5 Mapping algorithm

`src/mapping/mapper.js` exports `mapAlbum(setup) → albumYaml`:

```js
function mapAlbum({ substance, arc, override_song_substances, bpm_global, duration_min, seed }) {
  const subPreset    = SUBSTANCES[substance];
  const arcSequence  = ARCS[arc].sequence;
  const totalWeight  = arcSequence.reduce((s, g) => s + GESTURES[g].song_duration_weight, 0);
  const roleByPosition = ['opener', 'development', 'development', 'climax', 'outro'];

  const songs = arcSequence.map((gesture, i) => {
    const songSubstance = override_song_substances[i] || substance;
    const subPresetSong = SUBSTANCES[songSubstance];
    const gestPreset    = GESTURES[gesture];
    return {
      id: `song_${i}`,
      role: roleByPosition[i],
      gesture,
      substance: songSubstance,
      bpm: Math.round(bpm_global * gestPreset.bpm_scale),
      duration_sec: Math.round(duration_min * 60 * gestPreset.song_duration_weight / totalWeight),
      register: subPresetSong.register,
      density_bias: gestPreset.density_bias,
      rhythm_grid: gestPreset.rhythm_grid,
      chord_shape: gestPreset.chord_shape,
      bass_pattern_pool: gestPreset.bass_pattern_pool,
      drum_groove: gestPreset.drum_groove,
      phase_distribution: gestPreset.phase_distribution,
      synth_dir: subPresetSong.synth_dir,
      modulation_rules: subPresetSong.modulation_rules,
      seed: deriveSeed(seed, `song:${i}`),
      intensity: intensityFromArcPosition(arc, i),
    };
  });
  return { global: { seed, bpm: bpm_global, ...album_globals }, songs };
}
```

Then `song-director.js` (M1b) is extended to apply:
- `density_bias` in `seedBudgetsFromIntensity` (additive scalar or interpolated `{from,to}`)
- `worldState.rhythmGrid` from preset (replaces M1b Task 12 hardcoded 4-on-floor)
- `worldState.register` from substance preset
- `worldState.chordShape` from gesture preset
- `phase-map.js` extended: gesture-aware phase mapping using `phase_distribution`

---

## 5 — Modulation rules (M1c-γ)

The expressivity engine. Two levels of modulation.

### 5.1 Rules schema

```yaml
# sc/modulation-rules/jolt.yaml
substance: JOLT

families:
  bass:
    cutoff:
      source: velocity
      shape: exp
      range: [0.3, 0.95]
    drive:
      source: phaseProgress
      shape: linear
      range: [0.1, 0.7]
    detune:
      source: lfo_slow
      shape: linear
      range: [-8, 8]

  lead:
    cutoff:
      source: velocity
      shape: exp
      range: [0.4, 1.0]
    grain:
      source: density.melody
      shape: linear
      range: [0.0, 0.5]
    pan:
      source: lfo_pan_slow
      shape: linear
      range: [-0.4, 0.4]

  kick:
    drive:
      source: density.rhythm
      shape: linear
      range: [0.2, 0.8]

continuous:
  bass:    [drive]
  lead:    [pan, grain]
  drone:   [cutoff]
```

### 5.2 Source signals

Computable offline-deterministically from worldState + per-event RNG:

```
velocity        per-note     0..127 normalized 0..1
phaseProgress   continuous   0..1 within song
density.<role>  continuous   0..0.9
audioEnergy     continuous   stub 0 offline; hookable from SC reply in M1d
barProgress     continuous   0..1 within current bar
phase           discrete     germoglio=0.0, pulsazione=0.25, densita=0.5, rottura=0.75, dissoluzione=1.0
lfo_slow        continuous   sin(globalTick * 0.005)         ~0.05 Hz
lfo_med         continuous   sin(globalTick * 0.02)          ~0.2 Hz
lfo_fast        continuous   sin(globalTick * 0.1)           ~1 Hz
lfo_pan_slow    continuous   sin(globalTick * 0.003)
random          per-note     SeededRNG.next() (deterministic)
```

### 5.3 Shape functions

```
linear:         y = lo + (hi - lo) * v
exp:            y = lo + (hi - lo) * v^2
log:            y = lo + (hi - lo) * sqrt(v)
inv:            y = lo + (hi - lo) * (1 - v)
threshold-N:    y = v < N ? lo : hi    (e.g. threshold-0.5)
```

All applied to clamped `v ∈ [0,1]`.

### 5.4 Wiring — Level 1 (per-note expression)

`src/mapping/expression-applier.js`:

```js
export function applyPerNoteExpression(event, rules, worldState, rngStep) {
  const familyRules = rules.families[familyOf(event.instrument)];
  if (!familyRules) return event;
  const extras = {};
  for (const [param, rule] of Object.entries(familyRules)) {
    const v = sampleSource(rule.source, event, worldState, rngStep);
    extras[param] = applyShape(v, rule.shape, rule.range);
  }
  return { ...event, extras };
}
```

`composer-harness.emit()` extended: events carry `extras: {...}`. The OSC dispatcher serializes them after `freq amp dur`:

```
before:   /synth/bass/note  freq amp dur
after:    /synth/bass/note  freq amp dur cutoff <v> drive <v> detune <v>
```

OSC v0.1 supports heterogeneous args — **no breaking change to the protocol**. The SC handler in `album-engine.scd` is updated to parse key-value pairs after the 3 required args.

### 5.5 Wiring — Level 2 (continuous modulation)

`src/composers/expression-weaver.js`:

```js
export function createExpressionWeaver({ rules, worldState, harness }) {
  const continuous = rules.continuous;
  function tick() {
    for (const [synthName, params] of Object.entries(continuous)) {
      const values = {};
      for (const param of params) {
        const rule = rules.families[familyOf(synthName)][param];
        const v = sampleSource(rule.source, null, worldState, null);
        values[param] = applyShape(v, rule.shape, rule.range);
      }
      harness.emitParams(synthName, values);
    }
  }
  return { tick };
}
```

Called by `createRealComposers.generateBar` **after** the 5 composer ticks in each 16th step. Output: events `{instrument: '__params__', synth: 'bass', params: {drive: 0.42}, t}`. The dispatcher serializes them as `/synth/bass/params drive 0.42` (frame separate from notes). ~24 frames/sec at 96 BPM — light but enough for breath/movement.

### 5.6 Default fallback

If a (substance, family, param) rule is missing: the extra is not added to the note message → SynthDef uses its declared default. Robust, no crash.

### 5.7 Sound-lab agent emits modulation rules drafts

When the agent generates `<substance>/<family>.scd`, it also emits a draft `sc/modulation-rules/<substance>.yaml` (or extends the existing one). The user can edit by hand later — the YAML lives separately from SynthDef so they evolve independently.

---

## 6 — Album.yaml schema

### 6.1 Generated by setup screen

```yaml
tool_version: "0.4.0-M1c"
title: "haze-onda"
created: 2026-04-25T11:45:00Z
generator: "tarot-setup"

global:
  seed: 0x9C42
  bpm: 96
  key: "D"
  mode: "dorian"
  duration_min: 35

album_setup:                              # NEW M1c
  substance: HAZE
  arc: ONDA
  substance_overrides:
    climax: JOLT                          # L.3 break

songs:
  - id: opener
    role: opener
    gesture: DRIFT                        # NEW
    substance: HAZE                       # NEW
    duration_sec: 250
    intensity: 0.35
    seed: 0x4A3F
    bpm: 53                               # derived: 96 * 0.55
  - id: dev_a
    role: development
    gesture: LOOM
    substance: HAZE
    duration_sec: 280
    intensity: 0.55
    seed: 0xB17C
    bpm: 82
  - id: dev_b
    role: development
    gesture: CREST
    substance: HAZE
    duration_sec: 240
    intensity: 0.70
    seed: 0xE5A3
    bpm: 106
  - id: climax
    role: climax
    gesture: FAULT
    substance: JOLT                       # ← override
    duration_sec: 180
    intensity: 0.90
    seed: 0x7421
    bpm: 86
  - id: outro
    role: outro
    gesture: DRIFT
    substance: HAZE
    duration_sec: 260
    intensity: 0.25
    seed: 0x9F0C
    bpm: 53

instruments:                              # M1a, unchanged
  drone:   { synth: drone,   default_amp: 0.3 }
  # ... 9 entries
```

### 6.2 Backward compatibility

`config-loader.js` extended with `applyM1cDefaults()`:

```js
function applyM1cDefaults(album) {
  album.album_setup ??= { substance: '_default', arc: 'custom', substance_overrides: {} };
  for (const song of album.songs) {
    song.gesture   ??= 'THRUM';
    song.substance ??= album.album_setup.substance;
    song.bpm       ??= album.global.bpm;
  }
  return album;
}
```

`_default` is a virtual substance that maps to `sc/synths/_shared/` (the M1a minimal synths). This lets `album-001.yaml` (M0/M1a/M1b legacy) load and run unchanged.

### 6.3 Persistence

```
albums/
├── album-001.yaml                          # legacy reference, untouched
├── generated/                              # autogenerated, FIFO max 50
│   ├── 2026-04-25T1145-haze-onda.yaml
│   ├── 2026-04-25T1212-jolt-salita.yaml
│   └── ...
```

### 6.4 UI: Recents + Import / Export

- **Recents** menu (top-right of tarot screen): last 10 from `albums/generated/`. Click → loads setup into cards.
- **Import**: file picker → loads any YAML → populates cards (deduces gesture/substance from metadata; falls back to `_default + THRUM` if M1b legacy).
- **Export**: download current YAML.

### 6.5 Migration M1b → M1c

The user can:
1. Leave `album-001.yaml` as-is — runs with `_default` synths (M1a minimal). Nothing changes.
2. Run `npm run migrate-album albums/album-001.yaml` (interactive CLI, asks for substance + arc + per-song tweaks).
3. Open tarot screen, Import album-001.yaml → cards populate with `_default + THRUM × 5` → user changes substance + arc → Export.

### 6.6 Determinism

Same album.yaml must produce the same MIDI/OSC events on every run (`pipeline.test.js` continues to pass). All extra randomness introduced by M1c (chord shape pool pick, bass pattern pool pick, modulation `random` source) goes through `SeededRNG` derived from `song.seed`.

---

## 7 — Tarot Setup Screen UI (M1c-β)

`index-setup.html` — new entry point. The launcher opens this by default; user confirms; navigates to `index.html` (M1a player).

### 7.1 Layout

```
┌─────────────────────────────────────────────────────────┐
│                       album-gen                         │
│                                                         │
│              ╭─────────────────────╮                    │
│              │   [drag substance   │  ← dominant card  │
│              │      here]          │     (1 slot)      │
│              ╰─────────────────────╯                    │
│                                                         │
│      ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐                       │
│      │①│  │②│  │③│  │④│  │⑤│   ← 5-gesture arc        │
│      └──┘  └──┘  └──┘  └──┘  └──┘                       │
│                                                         │
│     SUBSTANCES (6 cards)         GESTURES (6 cards)     │
│                                                         │
│  Duration: [══•══] 35 min       BPM: [══•══] 96         │
│                                                         │
│  [AUTO ARC ▼]    [PESCA]    [RIMESCOLA]    [▶ Confirm]  │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Flow

1. Drag 1 substance card to centre slot.
2. Arrange gestures: drag 5 cards into ①→⑤; OR click `AUTO ARC` and pick a preset (SALITA/ONDA/DISCESA/PIATTO); OR leave empty and `PESCA` randomizes.
3. Optional override: right-click a placed gesture card → `Cambia sostanza per questa song` → choose alternate substance (its border colour shifts to that substance's palette).
4. Adjust duration / BPM sliders.
5. Click `PESCA` → generates album.yaml, runs **30-sec preview** (~6 sec per gesture) over SC.
6. Iterate: `RIMESCOLA` (same setup, new seed, regenerate preview) or change a card; click `▶ Confirm` to navigate to `index.html` for full playback.

### 7.3 Visual style

- Dark theme.
- Substance cards: solid background in palette colour (HAZE blue-grey, JOLT acid yellow, LOAM ochre-brown, ORE metallic grey, GRIT charcoal, BRINE marine blue), monospace serif italic for the name (e.g. JetBrains Mono Italic), poetic descriptor underneath.
- Gesture cards: dark neutral background, minimal evocative graphic (THRUM = pulse dot, DRIFT = blurred line, RIVEN = broken line, LOOM = circle, CREST = ascending arc, FAULT = peak with drop).

### 7.4 Out of scope for M1c-β

- Mobile/responsive layout.
- Animations (sobrie, no flashy).
- A/B testing of multiple presets at once.

---

## 8 — Phasing

Five phases, each independently mergeable, each with its own implementation plan.

### M1c-α — Mapping layer
**Tag:** `v0.4.0-M1c-alpha` · **Estimate:** 2-3 days · **Dependencies:** none beyond M1b.

Scope:
- All preset YAML files (`substance-presets`, `gesture-presets`, `arc-presets`, `chord-shapes`)
- `mapper.js`
- `harmony.js` extended to use chord shapes
- `bass-v3.js` extended to use bass pattern pool
- `phase-map.js` extended for gesture-aware phase distribution
- `song-director.js` extended (apply density_bias, rhythm_grid, register, chord_shape from preset)
- `config-loader.js` extended (applyM1cDefaults)

After α: same `album-001.yaml` produces sensibly different songs because user can hand-edit a `album-002.yaml` with `album_setup` + per-song `gesture`. Engine variation works; no UI yet, no synth changes.

### M1c-β — Tarot setup screen
**Tag:** `v0.4.1-M1c-beta` · **Estimate:** 2-3 days · **Depends on:** α.

Scope:
- `index-setup.html` + `src/setup/{tarot.js, tarot-cards.js, tarot.css, preview-runner.js}`
- Drag-and-drop, palette per substance, override via right-click
- Sliders duration/BPM
- 30-sec preview through SC
- Recents menu + Import/Export
- Persistence in `albums/generated/`
- `album-launch.command` updated to open setup by default

After β: end-to-end workflow without writing YAML.

### M1c-γ — Expression engine 2-level
**Tag:** `v0.5.0-M1c-gamma` · **Estimate:** 2 days · **Depends on:** α.

Scope:
- `src/mapping/expression-applier.js`
- `src/composers/expression-weaver.js`
- `composer-harness` extended: `emit(extras)`, `emitParams(synth, values)`
- `sc-dispatcher.js` extended: serialize extras in note frames; `__params__` events → `/synth/<n>/params`
- `album-engine.scd` updated: parse k-v pairs in note handler; implement `/synth/<n>/params`
- M1a 9 SynthDef extended to accept optional `cutoff, drive, noise, pan`
- `sc/modulation-rules/_default.yaml` with baseline rules

After γ: same UI/setup as β but synths breathe — cutoff/drive/pan modulated.

### M1c-δ — Sound Lab CLI + agent
**Tag:** `v0.6.0-M1c-delta` · **Estimate:** 3 days · **Depends on:** γ (for the metadata contract).

Scope:
- `sound-lab/sound-lab-cli.js` (`--substance`, `--synth`, `--validate`, `--status`, `--force`, `--interactive`)
- `sound-lab/agent-brief-template.md`
- Subagent dispatcher (sound-designer-sc system prompt)
- `sound-lab/validate-synthdef.scd` validation pipeline
- WAV preview rendering in `sound-lab/.previews/`
- Hot-reload OSC `/sound-lab/reload <path>` in `album-engine.scd`
- 1 pilot substance committed: **HAZE** (9 synths + modulation rules + WAV previews)

After δ: one fully-realized substance (HAZE), the others fall back to `_default`.

### M1c-ε — Substance population
**Tag:** `v0.6.x-M1c` per substance · **Estimate:** 1 day human + agent runtime · **Depends on:** δ.

For each remaining substance `[GRIT, JOLT, LOAM, BRINE, ORE]`:
1. `npm run sound-lab -- --substance X` (~5-10 min)
2. Listen WAV previews + manual review
3. Tweak via `--synth Y --force` if needed
4. Commit
5. Add `docs/sound-substances/<X>.md` (poetic brief used by agent for re-rolls)

After ε full: 6×9 matrix populated, each substance has its identity.

### Order and parallelism

```
α  ──┬─►  β   ──┐
     │          ├──►  ε
     └─►  γ ──► δ ──┘
```

α must come first (compositional engine). β and γ are independent after α — could be parallel given bandwidth (single-threaded developer expected: sequential). δ requires γ. ε iterates incrementally on δ.

### MVP options

- **α + β** = `v0.4.x-M1c-mvp` — sensibly varied songs + tarot UI + persistence. No expressive synth modulation yet.
- **α + β + γ** = `v0.5.x-M1c-expressive` — modulation alive on M1a synths. Sound noticeably more responsive.
- **α + β + γ + δ + 2 substances ε** = `v0.6.x-M1c-pilot` — full demo with two distinct sonic worlds.
- **All five phases** = `v1.0.0` — full M1c.

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| M1c-γ extras break OSC v0.1 | Heterogeneous args were already in spec; SC handler change is backward-compat (notes without extras still work). Test with frozen M1a flow. |
| Sound-lab agent produces unstable SynthDef (server crashes, clipping) | Validation pipeline: 3 independent checks (boot, RMS, leak) + 3 retries + WAV preview for human review. |
| Determinism regression after preset/pool introduction | All randomness through `SeededRNG`. `pipeline.test.js` extended to cover M1c presets. |
| M1c-α changes break M1b album-001.yaml | Backward-compat via `applyM1cDefaults` + `_default` synth dir. Test: `node bin/album-gen.js albums/album-001.yaml` runs on M1c. |
| Tarot UI complexity blocks β | Start with simplest drag-drop primitives; defer animations and right-click overrides to a `β.2` patch if needed. |
| Sound-lab agent costs (LLM tokens) for 6×9 = 54 SynthDef | Batch per substance (9 calls per substance, ~5-10 min each). User curates manually before proceeding to next substance. Total ~1 day-human + ~2-3 hours of agent runtime spread over time. |

---

## Open questions (to be resolved during plan writing)

1. **Per-song duration distribution rule.** Currently `song_duration_weight` weights are normalized over the 5 gestures of the arc. If the user wants 35 min total and the arc is `[DRIFT, LOOM, CREST, FAULT, DRIFT]` with weights `[1.4, 1.0, 1.2, 0.8, 1.4]` → totalWeight = 5.8 → song durations 8.4 / 6.0 / 7.2 / 4.8 / 8.4 min. Confirm this is correct musically.
2. **Preview duration.** 30 sec is the brainstorm value; might be 45 to give each gesture more breath. To be tested in M1c-β.
3. **Intensity per-song.** Currently `intensityFromArcPosition` is hardcoded; could be derived from gesture (CREST always intense, DRIFT always low) instead of arc position.
4. **Fallback synth resolution.** If a substance synth is missing (e.g. `sc/synths/grit/lead.scd` not yet generated), fall back to `_shared/default_lead.scd` or to the closest available substance? Decide in M1c-α (config-loader handles fallback).
5. **Sound-lab agent quality assurance.** First run of `--substance HAZE` will probably produce some duds. Plan should include a manual curation pass after batch generation — not assume "first batch ships".

---

## Acceptance criteria (overall)

After full M1c (all 5 phases):
1. User opens tarot screen, drags HAZE + 5 gesture cards (or picks ONDA arc), clicks PESCA, hears a 30-sec preview that varies meaningfully between the 5 gestures.
2. User clicks Confirm → full album plays through SC; each of the 5 songs has audibly distinct character (different chord progression, different bass pattern, different drum groove, different timbre).
3. User changes substance to JOLT, re-pesca → entire album shifts in timbre and aggression.
4. User overrides climax substance to ORE (L.3 break) → climax sounds different from the rest of the album, return to outro DRIFT in HAZE feels like a return.
5. `npm test` green (existing M1b tests + new M1c tests).
6. `pipeline.test.js` deterministic across 3 runs.
7. `node bin/album-gen.js albums/album-001.yaml` (M1b legacy) still runs without error.

## Non-goals for M1c

- PARTITURA visual (M2).
- Real-time audio analysis closing the modulation loop (`audioEnergy` from SC reply) — M1d.
- Save/load arbitrary multi-album projects.
- Per-song mode override in YAML (e.g. song 3 in lydian while album in dorian) — possible follow-up.
- Mobile or web-deployed setup screen.
- MIDI / WAV export of the generated album — M4 / M5 as already planned.
