<!-- GSD:project-start source:PROJECT.md -->
## Project

**MACH:INE II v3**

Sistema generativo live per performance di collaborazione umano-AI: l'AI compone in tempo reale una suite continua di 45-60 minuti, il musicista interpreta i segnali MIDI generati su synth modulare, hardware e VST. Il progetto è simultaneamente un concerto live e un album generativo.

**Core Value:** L'AI è il compositore — genera musica abbastanza ricca, coerente e memorabile da reggere una performance live di 60 minuti con arco narrativo completo.

### Constraints

- **Tech stack**: ES modules nativi, zero bundler, zero npm — compatibilità live garantita
- **Performance**: 60fps rAF + MIDI clock Worker — nessuna regressione latenza
- **Compatibilità**: WebMIDI API su Chrome/Edge, hardware MIDI out
- **Architettura**: mantenere separazione render loop / MIDI clock Worker
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages & Runtime
- JavaScript (ES2020+ modules) — all source code in `MACH:INE II/src/`, zero transpilation
- HTML5 — entry point `MACH:INE II/index.html`, projector output `MACH:INE II/projector.html`
- CSS — inline in HTML files only, no external stylesheet
- Bash — launcher scripts `MACH:INE II/launch.sh`, `MACH:INE II/start.sh`, `MACH:INE II/MACHINE-II.command`
- YAML — orchestration config `MACH:INE II/ruflo.config.yaml`
- Browser runtime (Chrome/Edge required — WebMIDI API not available in Firefox/Safari without flags)
- No Node.js runtime for the application itself
- No TypeScript, no transpiler, no bundler
## Package Manager
- **None** — zero npm dependencies, no `package.json`, no `node_modules/`
- No lockfile (not applicable)
## Frameworks & Libraries
- **Canvas 2D API** — primary render surface (`MACH:INE II/src/render.js`, `MACH:INE II/src/field.js`)
- **Web Audio API** (`AudioContext`, `ChannelSplitter`, `AnalyserNode`, `GainNode`) — `MACH:INE II/src/audio.js`
- **WebMIDI API** (`navigator.requestMIDIAccess`) — `MACH:INE II/src/midi.js`
- **Web Workers API** — MIDI clock worker in a dedicated thread `MACH:INE II/src/midi-clock.worker.js`
- **BroadcastChannel API** — main window ↔ projector window sync (`MACH:INE II/src/main.js`, `MACH:INE II/projector.html`)
- **Screen Wake Lock API** — prevents display sleep during performance, via `WakeLockManager` imported from `.claude/skills/runtime-expert/scripts/perf-utils.js`
- **Fullscreen API** (`requestFullscreen` / `exitFullscreen`) — `MACH:INE II/src/render.js`
- **getUserMedia** — stereo microphone/BlackHole input (`MACH:INE II/src/audio.js`)
- `MACH:INE II/.claude/skills/runtime-expert/scripts/perf-utils.js` — provides `ObjectPool`, `FrameTimer`, `ColorCache`, `SeededRNG`, `RingBuffer`, `WakeLockManager`. Imported by `src/main.js`.
## Build & Tooling
- No build step. Files are served as-is.
- `python3 -m http.server 8282` — launched via `MACH:INE II/launch.sh`
- Binds to `127.0.0.1:8282`
- Browser target: `http://localhost:8282`
- `MACH:INE II/launch.sh` — kills prior instance on port, starts server, opens browser
- `MACH:INE II/start.sh` — alternate launcher
- `MACH:INE II/MACHINE-II.command` — macOS double-click launcher
- No test framework. Manual testing via browser.
- `MACH:INE II/test.html`, `MACH:INE II/sandbox.html` — manual test pages
- `MACH:INE II/versions/` — archived HTML/JS snapshots for regression reference
- No ESLint, Prettier, or similar tools configured
- Style enforced by convention (see `MACH:INE II/RULES.md`)
## Configuration
- `MACH:INE II/src/config.js` — exports `CFG` object containing all numeric parameters: audio analysis, MIDI, render, composer phases, arc thresholds, camera, FPS limiter, per-engine modal definitions. All modules import from this single file.
- `MACH:INE II/ruflo.config.yaml` — Claude Code agent orchestration settings (not consumed by the application at runtime)
## Module System
## Version
- Current: v2.8.0 (as declared in `src/config.js` and `src/main.js` headers)
- Versioning format: `vX.Y.Z` — history in `MACH:INE II/CHANGELOG.md`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Code Style
## Naming
- `composer7.js`, `midi-patterns.js`, `director-events.js`, `presence-multiplier.js`
- Composer files numbered sequentially: `composer.js`, `composer2.js` … `composer7.js`
- `phaseTime`, `arcProgress`, `currentDrone`, `sendMIDINote`, `updateComposer7`, `toggleComposer7`
- `KICK_4x4`, `HAT_CLOSED`, `HAT_OPEN`, `HAT_FOR_PHASE`, `BASS_PATTERNS7`, `BASS_FOR_PHASE7`
- `CHORD_PROGS7`, `PHASE_PRESENCE7`, `MODES7`, `PIVOT_CLASSES7`
- `SWEEP_BARS`, `SWEEP_AMP_BASE`, `SWEEP_BASE_VEL`
- `CFG.COMPOSER7`, `CFG.COMPOSER7.phases`, `CFG.COMPOSER7.silenceTarget`
- `'terreno'`, `'meccanica'`, `'deriva'`, `'vortice'`, `'cristallo'`, `'abisso'`, `'solco'`
- `'germoglio'`, `'pulsazione'`, `'densita'`, `'rottura'`, `'dissoluzione'`
- `'presagio'`, `'infiltrazione'`, `'takeover'`, `'residuo'`
- `'SILENCE'`, `'BUILDING'`, `'ACTIVE'`, `'INTENSE'`, `'PEAK'`, `'RELEASE'`
- `CH0=PULSE`, `CH1=GRAIN`, `CH2=DRONE`, `CH3=BASS`, `CH4=CHORDS`, `CH5=VOICE`, `CH6=LEAD`, `CH7=RUPTURE`
## Patterns
### Section headers — mandatory box comments
### Module structure (every composer file)
### Presence Multiplier wrapping (PM pattern)
### Config centralization
### Exponential Moving Average (EMA) smoothing
### Object pooling for entities (GC avoidance)
### Weighted random selection
### Presence array (per-composer channel mix)
### Step sequencer pattern
### Event bus (director-events.js)
### Operator comments
## Error Handling
## Domain-Specific Conventions
### Engine identity
- Italian name (SCREAMING_CAPS used as display label): TERRENO, MECCANICA, DERIVA, VORTICE, CRISTALLO, ABISSO, SOLCO
- Modal key: `G_dorian`, `D_phrygian`, `A_lydian`, etc. Format: `{Note}_{mode}` camelCase
- Root MIDI note: integer (e.g., `55` = G3), always commented with note name
- BPM: integer or `null` for brightness-triggered engines (DERIVA)
### MIDI note numbering
### Formal arc phases (5-phase structure)
### Rupture stages (4 mandatory sub-phases)
### Channel role convention
- CH0 = PULSE (kick/percussive)
- CH1 = GRAIN (texture/hi-hat/scatter)
- CH2 = DRONE (sustained harmonic root)
- CH3 = BASS (bass line)
- CH4 = CHORDS (harmonic layer)
- CH5 = VOICE (melodic/lead voice)
- CH6 = LEAD (secondary melodic)
- CH7 = RUPTURE (special chaos layer)
### Voice leading constraint
### Silence ratio targets
### Chord progressions format
### Humanization
### Versioning commit format
### Language split rule
- **Source code** (variables, function names, technical comments): English
- **Project documentation** (README, CHANGELOG, RULES, DESIGN): Italian
- **Musical/compositional comments** inside source files: Italian (sonic intent, voicing descriptions)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern
- Zero dependencies, zero bundler — pure ES modules via `<script type="module">`
- Dual-thread execution: render loop (rAF, ~60fps) + MIDI clock Worker (~2ms ticks)
- Config-first: all numeric parameters centralized in `src/config.js` (CFG object)
- Presence multiplier system enables simultaneous multi-engine crossfade
- 5-act dramaturgical structure scripted in `src/sequencer.js`, optional manual override
## Entry Points
- Loads `src/main.js` as ES module
- Displays start screen; boot triggers only after user click (required for Web Audio context)
- Defines all HUD DOM elements (`#hud-minimal`, `#hud-debug`, `#seq-panel`)
- On click: calls `initAudio()` → `initMIDI()` → `generateDNA()` → `initDirector()` → 7× `initComposerN()` → `initSequencer()` → `initDirectorEvents()`
- Starts MIDI clock Worker (`src/midi-clock.worker.js`)
- Launches rAF loop (`loop()`)
- Handles all keyboard input dispatch
- Secondary window opened via `window.open()` on `P` key press
- Receives canvas frames via `BroadcastChannel('machine-projector')`
- Start `python3 -m http.server 8282` to serve project locally
## Core Modules
### Execution / Timing
- Two loops: `loop()` (rAF, handles render + state + sequencer) and `midiWorker.onmessage` (handles all 7 composer engine updates)
- `ENGINE_TOGGLE` map links engine name strings to toggle functions
- `manualToggle()` / `activateSingle()` handle engine activation with presence multiplier management
- `getActiveBpm()` selects MIDI clock BPM from highest-presence active engine
- Web Worker running `setTimeout(tick, 2)` loop — not throttled when browser loses focus
- Posts `{ dt, now }` every ~2ms to main thread
- Main thread's `midiWorker.onmessage` runs all `updateComposerN(dt)` calls
### Configuration
- All numeric parameters for audio analysis, rendering, camera, arc, MIDI clock, and all 7 composer engines (as `CFG.COMPOSER`, `CFG.COMPOSER2`…`CFG.COMPOSER7`)
- Each composer config includes: `bpm`, `phases` (5 dramaturgical phases with duration/mode/arc), `rupture` thresholds, `phaseOrder`, voice leading limits
### Audio & MIDI I/O
- Exports mutable `audio` object: `rms`, `bands` (sub/low/mid/high/air per L/R channel), `centroid`, `flux`, `onset`, `stereoCorrelation`, `trajectory`, `bpm`, `fftL/fftR`
- Uses Web Audio API: `getUserMedia` → `GainNode` → `ChannelSplitter` → 2× `AnalyserNode`
- Spectral flux onset detection with adaptive moving average threshold
- Called each rAF frame via `updateAudio()`
- Exports mutable `midi` object: `lastNote`, `newNotes`, `noteFlashes`, `noteDensity`, `channels[0..7]`
- 8 canonical MIDI channels: CH0=PULSE, CH1=GRAIN, CH2=DRONE, CH3=BASS, CH4=CHORDS, CH5=VOICE, CH6=LEAD, CH7=RUPTURE
- Lookahead clock scheduling (50ms window) eliminates jitter
- `sendMIDINote(ch, note, vel, dur)` used by all composer engines
### Narrative State
- Exports mutable `state` object: `intensity`, `rhythmicity`, `brightness`, `trajectory`, `stereoWidth`, `impact`
- All values derived each frame from `audio` and `midi` objects
- Pure derivation — makes no scene decisions
- Exports `dna` object (generated once per session): `primitives` (2–4 types from 8 canonical: BANDA, BLOCCO, VETTORE, VUOTO, FRONTE, SCIAME, STRISCIA, MATRICE), `freqMapping`, `dotSizeRange`, `evolutionSpeed`
- Exports `primState` (per-frame animation state for each primitive)
- Exports `zoneSeeds` + `zoneLookup` (Voronoi grid ZONE_RES=24 cells)
- `generateDNA()` randomizes session identity; `updatePrimitives()` advances animation each frame
### Visual System
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
- Simple `on(event, fn)` / `emit(event, data)` pattern
- Coordinates full render pipeline each rAF frame: `updateColors()` → `updateDirector()` → `applyCamera()` → `updateGenerations()` → `renderField()` → HUD update
- Reads from all state modules (audio, midi, state, dna, entities, colors, director, presence-multiplier, all 7 composer statuses, sequencer firma)
- Canvas 2D API, fullscreen, supports projector window sync via `BroadcastChannel`
- `renderField()` is the core pixel loop: iterates all canvas cells, computes density from zone/primitive/entity/MIDI/wave contributions, applies Bayer threshold, draws dots
- `onsetWaves[]` — expanding circular waves triggered by audio onsets
- `midiTrail[]` — persistent MIDI note shapes (pulse, scatter, column, band, trail) fading over time
- Each MIDI note shape has position, radius, decay, color role, channel
- COLOR_A/B/C base triplet (orange, cyan, magenta)
- Per-engine MIDI color overrides (`ENGINE_MIDI_COLORS`)
- Named palettes: default, amber, warm, cold, steel, bw, cyan, magenta
- Climax state machine: accumulates concert time, triggers color shift/compression
- `invert` / `invertDissolving` / `chromaticMode` states managed here
- `setConcertTime(t)` called by sequencer to gate color evolution
- Max 4000 entities (from `CFG.maxEntities`), each with position, velocity, life, color role (A/B/C)
- Object pool (`_entityPool`, `_fossilPool`) — no GC allocations during performance
- Spatial hash grid (32px cells) for density queries from `field.js`
- Entities spawn from audio onsets (`triggerOnset()`) and MIDI notes (`triggerMIDI()`)
- `firma` object from sequencer gates special states: `gelo` (freeze), `convergenza` (attract to center), `vuotoTotale` (blackout), `densityCap`
- Per-channel behavior pools (PULSE_BEHAVIORS, GRAIN_BEHAVIORS, DRONE_BEHAVIORS, BASS_BEHAVIORS, CHORDS_BEHAVIORS, VOICE_BEHAVIORS, LEAD_BEHAVIORS, RUPTURE_BEHAVIORS)
- `getEngine()` / `setEngine()` — active engine context
- `getNotePosition()` — maps note pitch + channel to canvas (x, y, radius, shape, decay, color)
- Pattern index (`_patternIdx`) cycles through behavior variants per channel per engine phase
### Composer Engines (7 engines)
- Exports `initComposerN()`, `updateComposerN(dt)`, `toggleComposerN()`, `composerNActive`, `getComposerNStatus()`
- Internal 5-phase musical arc: germoglio → pulsazione → densita → rottura → dissoluzione
- 4-stage rupture: presagio → infiltrazione → takeover → residuo
- Sends MIDI notes via `sendMIDINote()` (scaled by presence multiplier before transmission)
- Calls `setEngine()` / `setEnginePhase()` to inform director and midi-patterns of active state
- DERIVE (composer3) uses spectral brightness threshold instead of BPM tick
### Performance Sequencer
- `ACTS[]` — 5 acts with time boundaries (seconds): I EMERGENZA (0–480s), II DISCESA (480–1080s), III MACCHINA (1080–1680s), IV INTENSITÀ (1800–2520s), V DISSOLUZIONE (2520–3000s)
- `CUES[]` — timed events with actions: `silence`, `activate`, `layer`, `fade_to`, `camera`, `firma`
- `firma` object — special visual moments: `gelo` (entity freeze), `convergenza` (attract to center), `vuotoTotale` (blackout), `densityCap`
- `setPresenceMultiplier()` used to crossfade between engines smoothly
- Exports `skipToNext()`, `skipToPrev()`, `skipToAct()`, `togglePause()`, `toggleLoop()`
### Multi-Engine Coordination
- `_pm` object: `{ terreno, meccanica, deriva, vortice, cristallo, abisso, solco }` all 0.0–1.0
- `PRIMARY_CH` map: allowed MIDI channels per engine (prevents channel collisions during overlap)
- `isChannelAllowed(engine, ch)` — gates channel access: solo engine gets all channels; multi-engine mode restricts to primary channels only
- `_phase` registry: composers call `setEnginePhase(engine, phase, ruptureStage)` on each phase transition; director reads `getEnginePhase()` for visual sync
## Data Flow
### Audio Analysis → Visual State
```
```
### MIDI Clock → Composition → MIDI Output
```
```
### Sequencer → Engine Crossfade
```
```
### Render Pipeline (rAF, ~60fps)
```
```
## Key Abstractions
- Registry in `src/presence-multiplier.js`
- All MIDI note velocities multiplied by engine's PM before sending
- PM < 0.05 gates note emission entirely
- Enables smooth crossfade between engines without audio pops
- Names: `germoglio`, `pulsazione`, `densita`, `rottura`, `dissoluzione`
- Each phase has duration (in bars), mode (scale), drone note, arc hint
- Director reads current phase via `getEnginePhase()` to select visual parameters from `ENGINE_PHASE_VISUALS`
- Stages: omen → infiltrazione → takeover → residuo
- Progress tracked as 0.0–1.0 within each stage
- Director and engines consult rupture stage to apply visual/musical escalation
- Never simplified or skipped (enforced by RULES.md)
- Generated once per session by `generateDNA()` in `src/dna.js`
- Selects 2–4 visual primitives from 8 types, frequency mapping, dot size range, evolution speed
- Informs Voronoi zone layout (10 zones, 24×ZONE_RES lookup grid)
- Regenerated via `R` key (resets director and generations too)
- Named aesthetic state (8 scenes) defined in `src/director.js`
- Each scene: palette, densityMul, dotSize, midiScale, invertBase, composition layout
- Director selects scene based on audio arc + engine preferences; transitions managed by `executeMutation()`
- CH0=PULSE (kick/percussive), CH1=GRAIN (scatter rhythmic), CH2=DRONE (sustained harmonic), CH3=BASS, CH4=CHORDS, CH5=VOICE (melodic), CH6=LEAD, CH7=RUPTURE (special events)
- Each channel has a pool of visual behavior variants in `src/midi-patterns.js`
- Channel selection per engine defined in `src/presence-multiplier.js` PRIMARY_CH
## Error Handling
- MIDI Worker handler wrapped in `try/catch` — errors logged but clock continues (explicit comment in `main.js` line 248)
- Audio init failure shows error screen (`#error` div) — graceful UI fallback
- `canRecover()` / `recoverState()` in sequencer — state persistence for session recovery after page reload
- Composers use early-return guards: `if (pm < 0.05) return` before MIDI send
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
