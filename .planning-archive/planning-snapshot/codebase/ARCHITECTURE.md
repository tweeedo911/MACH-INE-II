# Architecture

**Analysis Date:** 2026-03-27

## Pattern

Event-driven, module-layered audiovisual performance system. No framework, no build step — native ES modules loaded directly in Chrome/Edge. The system has two concurrent execution threads: a **main rAF loop** (render + state) and a **Web Worker clock loop** (MIDI composition engines). All modules communicate via shared mutable state objects (not message passing), except the Worker which uses `postMessage`.

Key characteristics:
- Zero dependencies, zero bundler — pure ES modules via `<script type="module">`
- Dual-thread execution: render loop (rAF, ~60fps) + MIDI clock Worker (~2ms ticks)
- Config-first: all numeric parameters centralized in `src/config.js` (CFG object)
- Presence multiplier system enables simultaneous multi-engine crossfade
- 5-act dramaturgical structure scripted in `src/sequencer.js`, optional manual override

## Entry Points

**Browser entry:** `MACH:INE II/index.html`
- Loads `src/main.js` as ES module
- Displays start screen; boot triggers only after user click (required for Web Audio context)
- Defines all HUD DOM elements (`#hud-minimal`, `#hud-debug`, `#seq-panel`)

**Application boot:** `MACH:INE II/src/main.js`
- On click: calls `initAudio()` → `initMIDI()` → `generateDNA()` → `initDirector()` → 7× `initComposerN()` → `initSequencer()` → `initDirectorEvents()`
- Starts MIDI clock Worker (`src/midi-clock.worker.js`)
- Launches rAF loop (`loop()`)
- Handles all keyboard input dispatch

**Projector output:** `MACH:INE II/projector.html`
- Secondary window opened via `window.open()` on `P` key press
- Receives canvas frames via `BroadcastChannel('machine-projector')`

**Launch scripts:** `MACH:INE II/launch.sh`, `MACH:INE II/MACHINE-II.command`
- Start `python3 -m http.server 8282` to serve project locally

## Core Modules

### Execution / Timing

**`src/main.js`** — Boot, wiring, game loop
- Two loops: `loop()` (rAF, handles render + state + sequencer) and `midiWorker.onmessage` (handles all 7 composer engine updates)
- `ENGINE_TOGGLE` map links engine name strings to toggle functions
- `manualToggle()` / `activateSingle()` handle engine activation with presence multiplier management
- `getActiveBpm()` selects MIDI clock BPM from highest-presence active engine

**`src/midi-clock.worker.js`** — High-resolution MIDI timing thread
- Web Worker running `setTimeout(tick, 2)` loop — not throttled when browser loses focus
- Posts `{ dt, now }` every ~2ms to main thread
- Main thread's `midiWorker.onmessage` runs all `updateComposerN(dt)` calls

### Configuration

**`src/config.js`** — Single CFG export
- All numeric parameters for audio analysis, rendering, camera, arc, MIDI clock, and all 7 composer engines (as `CFG.COMPOSER`, `CFG.COMPOSER2`…`CFG.COMPOSER7`)
- Each composer config includes: `bpm`, `phases` (5 dramaturgical phases with duration/mode/arc), `rupture` thresholds, `phaseOrder`, voice leading limits

### Audio & MIDI I/O

**`src/audio.js`** — Stereo audio analysis
- Exports mutable `audio` object: `rms`, `bands` (sub/low/mid/high/air per L/R channel), `centroid`, `flux`, `onset`, `stereoCorrelation`, `trajectory`, `bpm`, `fftL/fftR`
- Uses Web Audio API: `getUserMedia` → `GainNode` → `ChannelSplitter` → 2× `AnalyserNode`
- Spectral flux onset detection with adaptive moving average threshold
- Called each rAF frame via `updateAudio()`

**`src/midi.js`** — MIDI I/O + 24ppqn clock
- Exports mutable `midi` object: `lastNote`, `newNotes`, `noteFlashes`, `noteDensity`, `channels[0..7]`
- 8 canonical MIDI channels: CH0=PULSE, CH1=GRAIN, CH2=DRONE, CH3=BASS, CH4=CHORDS, CH5=VOICE, CH6=LEAD, CH7=RUPTURE
- Lookahead clock scheduling (50ms window) eliminates jitter
- `sendMIDINote(ch, note, vel, dur)` used by all composer engines

**`src/midi-clock.worker.js`** — See Execution / Timing above

### Narrative State

**`src/state.js`** — Derived narrative state (5 values)
- Exports mutable `state` object: `intensity`, `rhythmicity`, `brightness`, `trajectory`, `stereoWidth`, `impact`
- All values derived each frame from `audio` and `midi` objects
- Pure derivation — makes no scene decisions

**`src/dna.js`** — Session DNA and visual primitives
- Exports `dna` object (generated once per session): `primitives` (2–4 types from 8 canonical: BANDA, BLOCCO, VETTORE, VUOTO, FRONTE, SCIAME, STRISCIA, MATRICE), `freqMapping`, `dotSizeRange`, `evolutionSpeed`
- Exports `primState` (per-frame animation state for each primitive)
- Exports `zoneSeeds` + `zoneLookup` (Voronoi grid ZONE_RES=24 cells)
- `generateDNA()` randomizes session identity; `updatePrimitives()` advances animation each frame

### Visual System

**`src/director.js`** — Scene system, narrative arc, camera, mutations (PROTECTED)
- Exports mutable `scene`, `arc`, `framing`, `director`, `engineRender` objects
- 8 named SCENES (BAYER_CLASSIC, COLORED_GROUND, SPARSE, DENSE, MONOCHROME, NEGATIVE, MONDRIAN, HORIZON)
- Arc states: SILENCE → BUILDING → ACTIVE → INTENSE → PEAK → DECAY → RELEASE (driven by audio RMS + flux, with hold timers from CFG)
- `ENGINE_PREFS` map: per-engine visual identity (preferred scenes, palette, camera mode, render overrides)
- `ENGINE_PHASE_VISUALS` map: per-engine × per-musical-phase render parameter overrides (dotSize, densityMul, midiScale, flickerSpeed)
- `ENGINE_COMPOSITIONS` map: per-engine × per-phase spatial composition type
- Camera modes: WIDE, MEDIUM, MACRO, DRIFT — tied to narrative arc
- Rupture behavior: 4 mandatory stages (omen, infiltrazione, takeover, residuo)
- `executeMutation()` applies scene/palette/camera changes driven by director logic
- Called each rAF frame via `updateDirector()`

**`src/director-events.js`** — Lightweight event bus for director
- Simple `on(event, fn)` / `emit(event, data)` pattern

**`src/render.js`** — Render orchestrator (PROTECTED)
- Coordinates full render pipeline each rAF frame: `updateColors()` → `updateDirector()` → `applyCamera()` → `updateGenerations()` → `renderField()` → HUD update
- Reads from all state modules (audio, midi, state, dna, entities, colors, director, presence-multiplier, all 7 composer statuses, sequencer firma)
- Canvas 2D API, fullscreen, supports projector window sync via `BroadcastChannel`

**`src/field.js`** — Halftone density field + Bayer 8×8 dithering
- `renderField()` is the core pixel loop: iterates all canvas cells, computes density from zone/primitive/entity/MIDI/wave contributions, applies Bayer threshold, draws dots
- `onsetWaves[]` — expanding circular waves triggered by audio onsets
- `midiTrail[]` — persistent MIDI note shapes (pulse, scatter, column, band, trail) fading over time
- Each MIDI note shape has position, radius, decay, color role, channel

**`src/colors.js`** — Chromatic system, dynamic palette, climax
- COLOR_A/B/C base triplet (orange, cyan, magenta)
- Per-engine MIDI color overrides (`ENGINE_MIDI_COLORS`)
- Named palettes: default, amber, warm, cold, steel, bw, cyan, magenta
- Climax state machine: accumulates concert time, triggers color shift/compression
- `invert` / `invertDissolving` / `chromaticMode` states managed here
- `setConcertTime(t)` called by sequencer to gate color evolution

**`src/generations.js`** — Entity lifecycle system
- Max 4000 entities (from `CFG.maxEntities`), each with position, velocity, life, color role (A/B/C)
- Object pool (`_entityPool`, `_fossilPool`) — no GC allocations during performance
- Spatial hash grid (32px cells) for density queries from `field.js`
- Entities spawn from audio onsets (`triggerOnset()`) and MIDI notes (`triggerMIDI()`)
- `firma` object from sequencer gates special states: `gelo` (freeze), `convergenza` (attract to center), `vuotoTotale` (blackout), `densityCap`

**`src/midi-patterns.js`** — MIDI → visual mapping
- Per-channel behavior pools (PULSE_BEHAVIORS, GRAIN_BEHAVIORS, DRONE_BEHAVIORS, BASS_BEHAVIORS, CHORDS_BEHAVIORS, VOICE_BEHAVIORS, LEAD_BEHAVIORS, RUPTURE_BEHAVIORS)
- `getEngine()` / `setEngine()` — active engine context
- `getNotePosition()` — maps note pitch + channel to canvas (x, y, radius, shape, decay, color)
- Pattern index (`_patternIdx`) cycles through behavior variants per channel per engine phase

### Composer Engines (7 engines)

All composer files share the same internal structure. Each is independent and can run simultaneously.

**`src/composer.js`** — TERRENO (D Dorian, 72 BPM, dub profondo)
**`src/composer2.js`** — MECCANICA (A Dorian, 92 BPM, poliritmici)
**`src/composer3.js`** — DERIVA (A Lydian, no fixed BPM, brightness-driven)
**`src/composer4.js`** — VORTICE (D Phrygian, 112 BPM, ipnotico)
**`src/composer5.js`** — CRISTALLO (D Lydian, 54 BPM, ambient cristallino)
**`src/composer6.js`** — ABISSO (Bb Phrygian / A Phrygian, 76 BPM, drone rituale)
**`src/composer7.js`** — SOLCO (G Dorian, 120 BPM, Berlin techno)

Each composer engine:
- Exports `initComposerN()`, `updateComposerN(dt)`, `toggleComposerN()`, `composerNActive`, `getComposerNStatus()`
- Internal 5-phase musical arc: germoglio → pulsazione → densita → rottura → dissoluzione
- 4-stage rupture: presagio → infiltrazione → takeover → residuo
- Sends MIDI notes via `sendMIDINote()` (scaled by presence multiplier before transmission)
- Calls `setEngine()` / `setEnginePhase()` to inform director and midi-patterns of active state
- DERIVE (composer3) uses spectral brightness threshold instead of BPM tick

### Performance Sequencer

**`src/sequencer.js`** — Autonomous 5-act concert structure
- `ACTS[]` — 5 acts with time boundaries (seconds): I EMERGENZA (0–480s), II DISCESA (480–1080s), III MACCHINA (1080–1680s), IV INTENSITÀ (1800–2520s), V DISSOLUZIONE (2520–3000s)
- `CUES[]` — timed events with actions: `silence`, `activate`, `layer`, `fade_to`, `camera`, `firma`
- `firma` object — special visual moments: `gelo` (entity freeze), `convergenza` (attract to center), `vuotoTotale` (blackout), `densityCap`
- `setPresenceMultiplier()` used to crossfade between engines smoothly
- Exports `skipToNext()`, `skipToPrev()`, `skipToAct()`, `togglePause()`, `toggleLoop()`

### Multi-Engine Coordination

**`src/presence-multiplier.js`** — Per-engine output scaling registry
- `_pm` object: `{ terreno, meccanica, deriva, vortice, cristallo, abisso, solco }` all 0.0–1.0
- `PRIMARY_CH` map: allowed MIDI channels per engine (prevents channel collisions during overlap)
- `isChannelAllowed(engine, ch)` — gates channel access: solo engine gets all channels; multi-engine mode restricts to primary channels only
- `_phase` registry: composers call `setEnginePhase(engine, phase, ruptureStage)` on each phase transition; director reads `getEnginePhase()` for visual sync

## Data Flow

### Audio Analysis → Visual State

```
getUserMedia (microphone / BlackHole)
  → GainNode → ChannelSplitter → 2× AnalyserNode
  → updateAudio() [rAF frame]
    → audio.rms, bands, centroid, flux, onset, stereoCorrelation, trajectory
  → updateState() [rAF frame]
    → state.intensity, rhythmicity, brightness, trajectory, stereoWidth, impact
  → updateDirector() [rAF frame]
    → arc state machine (SILENCE→BUILDING→ACTIVE→INTENSE→PEAK→DECAY→RELEASE)
    → scene selection, camera mode, mutation triggers
```

### MIDI Clock → Composition → MIDI Output

```
midi-clock.worker.js (setTimeout 2ms)
  → postMessage({ dt })
  → midiWorker.onmessage [Worker thread tick]
    → updateComposerN(dt) for each active engine
      → step sequencer advances (16th-note grid or brightness-triggered)
      → sendMIDINote(ch, note, vel * presenceMultiplier, dur)
        → WebMIDI output → external DAW / Ableton
      → addMidiNote(ch, x, intensity) → midiTrail[] in field.js
      → setEnginePhase() → presence-multiplier._phase registry
  → updateMIDIClock(getActiveBpm()) → 24ppqn MIDI clock ticks
```

### Sequencer → Engine Crossfade

```
sequencer CUES timed by concert elapsed time
  → 'activate': activateSingle(engineKey) → toggleComposerN() if not active
  → 'fade_to': setPresenceMultiplier(engine, target) over duration seconds
  → 'layer': activate + fade_to simultaneously
  → 'firma': set firma.gelo / firma.convergenza / firma.densityCap
  → 'camera': requestFraming() on director
```

### Render Pipeline (rAF, ~60fps)

```
renderFrame(now, dt)
  → updateColors()         — climax, palette, invert state
  → updateDirector()       — arc, scene, camera
  → applyCamera()          — transform context
  → updateGenerations()    — entity lifecycle (birth, move, age, die)
  → buildEntityGrid()      — spatial hash refresh
  → renderField()          — Bayer halftone pixel loop
      for each cell:
        density = zone base
                + primitive modulation (DNA shapes)
                + entity density (spatial grid)
                + onset wave contribution
                + MIDI trail contribution
        apply Bayer threshold → draw dot (color from cell color system)
  → HUD update             — every CFG.hudUpdateInterval frames
```

## Key Abstractions

**Presence Multiplier (0.0–1.0 per engine)**
- Registry in `src/presence-multiplier.js`
- All MIDI note velocities multiplied by engine's PM before sending
- PM < 0.05 gates note emission entirely
- Enables smooth crossfade between engines without audio pops

**Musical Phase (5 stages per engine)**
- Names: `germoglio`, `pulsazione`, `densita`, `rottura`, `dissoluzione`
- Each phase has duration (in bars), mode (scale), drone note, arc hint
- Director reads current phase via `getEnginePhase()` to select visual parameters from `ENGINE_PHASE_VISUALS`

**Rupture (4-stage mandatory)**
- Stages: omen → infiltrazione → takeover → residuo
- Progress tracked as 0.0–1.0 within each stage
- Director and engines consult rupture stage to apply visual/musical escalation
- Never simplified or skipped (enforced by RULES.md)

**DNA Session Identity**
- Generated once per session by `generateDNA()` in `src/dna.js`
- Selects 2–4 visual primitives from 8 types, frequency mapping, dot size range, evolution speed
- Informs Voronoi zone layout (10 zones, 24×ZONE_RES lookup grid)
- Regenerated via `R` key (resets director and generations too)

**Scene**
- Named aesthetic state (8 scenes) defined in `src/director.js`
- Each scene: palette, densityMul, dotSize, midiScale, invertBase, composition layout
- Director selects scene based on audio arc + engine preferences; transitions managed by `executeMutation()`

**MIDI Channel Roles (8 channels, 0-indexed)**
- CH0=PULSE (kick/percussive), CH1=GRAIN (scatter rhythmic), CH2=DRONE (sustained harmonic), CH3=BASS, CH4=CHORDS, CH5=VOICE (melodic), CH6=LEAD, CH7=RUPTURE (special events)
- Each channel has a pool of visual behavior variants in `src/midi-patterns.js`
- Channel selection per engine defined in `src/presence-multiplier.js` PRIMARY_CH

## Error Handling

**Strategy:** Minimal, defensive — keep the clock alive at all costs.

**Patterns:**
- MIDI Worker handler wrapped in `try/catch` — errors logged but clock continues (explicit comment in `main.js` line 248)
- Audio init failure shows error screen (`#error` div) — graceful UI fallback
- `canRecover()` / `recoverState()` in sequencer — state persistence for session recovery after page reload
- Composers use early-return guards: `if (pm < 0.05) return` before MIDI send

---

*Architecture analysis: 2026-03-27*
