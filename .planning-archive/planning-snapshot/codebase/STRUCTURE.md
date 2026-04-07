# Structure

**Analysis Date:** 2026-03-27

## Directory Layout

```
MACH-INE II/                          # workspace root
├── MACH:INE II/                      # main project (the live system)
│   ├── index.html                    # browser entry point
│   ├── projector.html                # secondary projector window
│   ├── sandbox.html                  # development sandbox (self-contained)
│   ├── test.html                     # test page
│   ├── launch.sh                     # starts python3 -m http.server 8282
│   ├── MACHINE-II.command            # macOS double-click launcher
│   ├── start.sh                      # alternative launcher
│   ├── ruflo.config.yaml             # agent orchestration config
│   ├── src/                          # ES module source files (production)
│   │   ├── main.js                   # boot, wiring, game loop, keyboard handling
│   │   ├── config.js                 # CFG: all numeric parameters (single source of truth)
│   │   ├── audio.js                  # Web Audio API, stereo analysis, onset detection
│   │   ├── midi.js                   # WebMIDI I/O, 24ppqn clock, note tracking
│   │   ├── midi-clock.worker.js      # Web Worker — high-res MIDI timing thread
│   │   ├── midi-patterns.js          # MIDI channel → visual behavior mapping
│   │   ├── state.js                  # narrative state (6 derived values from audio/MIDI)
│   │   ├── dna.js                    # session DNA, 8 visual primitives, Voronoi zones
│   │   ├── generations.js            # entity lifecycle, object pools, spatial hash grid
│   │   ├── colors.js                 # chromatic system, palettes, climax, invert
│   │   ├── director.js               # scenes, arc, camera, mutations (PROTECTED)
│   │   ├── director-events.js        # event bus for director
│   │   ├── field.js                  # halftone Bayer 8×8 render, onset waves, MIDI trail
│   │   ├── render.js                 # render orchestrator, HUD, projector sync (PROTECTED)
│   │   ├── presence-multiplier.js    # per-engine 0–1 scaling registry + channel gating
│   │   ├── sequencer.js              # 5-act concert sequencer, firma moments
│   │   ├── composer.js               # TERRENO engine (D Dorian, 72 BPM)
│   │   ├── composer2.js              # MECCANICA engine (A Dorian, 92 BPM)
│   │   ├── composer3.js              # DERIVA engine (A Lydian, brightness-triggered)
│   │   ├── composer4.js              # VORTICE engine (D Phrygian, 112 BPM)
│   │   ├── composer5.js              # CRISTALLO engine (D Lydian, 54 BPM)
│   │   ├── composer6.js              # ABISSO engine (A Phrygian, 76 BPM)
│   │   └── composer7.js              # SOLCO engine (G Dorian, 120 BPM)
│   ├── composer/                     # archived composer v2 prototype (not in production)
│   │   ├── composer-core.js
│   │   ├── composer-config.js
│   │   ├── composer-bridge.js
│   │   ├── composer-v2.js
│   │   ├── director-intent.js
│   │   ├── manifest.json
│   │   └── *.md                      # implementation notes
│   ├── docs/                         # reference documentation
│   │   ├── moodboard.html
│   │   ├── refs/                     # technical reference files
│   │   └── tasks/                    # task notes
│   ├── midi/                         # MIDI reference files (.mid)
│   ├── new/                          # working area for new features
│   │   ├── *.md                      # session briefings
│   │   └── claude-code-package/      # packaged work from previous sessions
│   │       ├── BRIEF.md
│   │       ├── midi-split/           # per-engine split MIDI files
│   │       ├── midi-test/            # MIDI test files
│   │       └── updated-composers/    # composer patches from sessions
│   ├── versions/                     # version snapshots (mandatory before touching index.html)
│   │   ├── v0.1.0.html ... v0.8.0-*.js, v1.3.0-*.js ...
│   │   └── sandbox-v0.3.0.html ...
│   ├── .claude/                      # Claude skills for this project
│   │   └── skills/
│   │       ├── composition-depth/    # musical composition knowledge
│   │       │   ├── references/       # structural-form.md (power-of-2 rule)
│   │       │   └── scripts/          # composition-utils.js
│   │       ├── visual-directing/     # visual/graphic direction knowledge
│   │       │   ├── references/       # graphic-techniques.md, directing-techniques.md, engine-visual-profiles.md
│   │       │   └── scripts/          # visual-utils.js (25+ functions)
│   │       ├── runtime-expert/       # browser runtime knowledge
│   │       │   ├── references/       # canvas2d-performance.md, webaudio-analysis.md, webmidi-patterns.md, etc.
│   │       │   └── scripts/          # perf-utils.js (ObjectPool, FrameTimer, SeededRNG, WakeLockManager)
│   │       └── agent-orchestrator/   # multi-agent delegation skill
│   ├── .claude-flow/                 # claude-flow runtime state
│   │   ├── logs/
│   │   └── metrics/
│   ├── .git/
│   ├── .gitignore
│   ├── CLAUDE.md                     # project instructions for Claude
│   ├── DESIGN.md                     # aesthetic and architecture reference
│   ├── ENGINES_SPEC.md               # identity of all 7 engines
│   ├── RULES.md                      # versioning, commit, workflow, protected areas
│   ├── ROADMAP.md / ROADMAP-v2.9.md  # current state and next steps
│   ├── CHANGELOG.md                  # version history
│   ├── PARTITURA-NARRATIVA.md        # full concert narrative score
│   ├── PIANO-v2.0.md                 # implementation plan
│   └── CODE-TASKS-*.md               # task lists by category
├── .planning/                        # GSD planning documents
│   └── codebase/                     # codebase analysis (this directory)
├── .claude/                          # workspace-level Claude skills
│   └── skills/
│       ├── creative-critic/
│       └── world-generator/
├── agent-orchestrator/               # orchestration utilities
├── CLAUDE-template.md                # Claude config template
├── creative-critic.skill
└── creative-critic-review.html
```

## Key Files

**Boot & Wiring:**
- `MACH:INE II/index.html` — single HTML page, all DOM, loads `src/main.js`
- `MACH:INE II/src/main.js` — boot sequence, event listeners, two execution loops

**Configuration (single source of truth):**
- `MACH:INE II/src/config.js` — exports `CFG` with all numeric parameters; never put magic numbers elsewhere

**Core audio/MIDI pipeline:**
- `MACH:INE II/src/audio.js` — exports `audio` mutable object, `initAudio()`, `updateAudio()`
- `MACH:INE II/src/midi.js` — exports `midi` mutable object, `initMIDI()`, `sendMIDINote()`
- `MACH:INE II/src/midi-clock.worker.js` — Web Worker for MIDI timing

**Narrative engine:**
- `MACH:INE II/src/state.js` — exports `state` (6 derived values)
- `MACH:INE II/src/director.js` — scenes, arc state machine, camera, mutations (PROTECTED)
- `MACH:INE II/src/sequencer.js` — 5-act concert cue list

**Composition engines:**
- `MACH:INE II/src/composer.js` through `src/composer7.js` — one file per engine

**Multi-engine coordination:**
- `MACH:INE II/src/presence-multiplier.js` — PM registry, channel gating, engine phase registry

**Visual pipeline:**
- `MACH:INE II/src/render.js` — render orchestrator (PROTECTED)
- `MACH:INE II/src/field.js` — Bayer halftone pixel loop, onset waves, MIDI trail
- `MACH:INE II/src/colors.js` — palettes, climax, chromatic system
- `MACH:INE II/src/generations.js` — entity lifecycle, object pools
- `MACH:INE II/src/dna.js` — session identity, primitives, Voronoi zones
- `MACH:INE II/src/midi-patterns.js` — MIDI channel → visual behavior pools

**Project documentation:**
- `MACH:INE II/CLAUDE.md` — project instructions, module map, protected areas, skill routing
- `MACH:INE II/DESIGN.md` — aesthetic and architecture decisions
- `MACH:INE II/ENGINES_SPEC.md` — identity of all 7 engines (musical + visual)
- `MACH:INE II/RULES.md` — versioning, commit format, protected areas
- `MACH:INE II/PARTITURA-NARRATIVA.md` — full concert narrative score

**Skills (read before working on relevant areas):**
- `MACH:INE II/.claude/skills/composition-depth/SKILL.md` — musical composition
- `MACH:INE II/.claude/skills/visual-directing/SKILL.md` — visual direction
- `MACH:INE II/.claude/skills/runtime-expert/SKILL.md` — browser runtime

## Naming Conventions

**Files:**
- `src/*.js` — all lowercase, hyphen-separated: `midi-patterns.js`, `presence-multiplier.js`
- Composer engines: `composer.js` (engine 1) then `composer2.js`…`composer7.js`
- Worker: `midi-clock.worker.js` — `.worker.js` suffix marks Web Workers
- Version snapshots: `versions/vX.Y.Z-filename.js` or `versions/sandbox-vX.Y.Z.html`

**Variables / exports:**
- Module-level mutable state objects: lowercase noun (`audio`, `midi`, `state`, `dna`, `entities`, `fossils`, `firma`)
- Config sections: `CFG.COMPOSER`, `CFG.COMPOSER2`…`CFG.COMPOSER7` (all caps)
- Constants / lookup tables: SCREAMING_SNAKE (`BAYER8`, `ENGINE_PREFS`, `MIDI_ROLES`, `PRIM_TYPES`)
- Engine names: lowercase single word (`terreno`, `meccanica`, `deriva`, `vortice`, `cristallo`, `abisso`, `solco`)
- Scene names: SCREAMING_SNAKE string literals (`'BAYER_CLASSIC'`, `'MONDRIAN_A'`)
- Arc states: SCREAMING_SNAKE string literals (`'SILENCE'`, `'BUILDING'`, `'ACTIVE'`, `'INTENSE'`, `'PEAK'`, `'DECAY'`, `'RELEASE'`)
- Musical phases: lowercase Italian (`'germoglio'`, `'pulsazione'`, `'densita'`, `'rottura'`, `'dissoluzione'`)

**Comments:**
- Section headers use `// ═══…` box style
- Sub-section headers use `// ── Label ──`
- Technical code and inline comments: English
- Project documentation: Italian

## Where to Add New Code

**New composer engine (engine 8+):**
- Create `MACH:INE II/src/composer8.js` following the exact structure of `src/composer7.js`
- Add config block `CFG.COMPOSER8` in `src/config.js`
- Add engine key to `PRIMARY_CH` in `src/presence-multiplier.js`
- Wire in `src/main.js`: import, add to `ENGINE_TOGGLE`, `allOff()`, `activateSingle()`, `getActiveBpm()`, Worker handler, `loop()`

**New visual primitive:**
- Add name to `PRIM_TYPES` array in `src/dna.js`
- Add DNA generation parameters in `generateDNA()` in `src/dna.js`
- Add per-frame animation in `updatePrimitives()` in `src/dna.js`
- Add density contribution function and call it in `primitiveDensity()` in `src/dna.js`

**New scene:**
- Add scene object to `SCENES` array in `src/director.js` (name, palette, densityMul, dotSize, midiScale, invertBase, composition)
- Add composition layout constant if needed to `COMPOSITIONS` in `src/field.js` or `src/director.js`

**New numeric parameter:**
- Always add to `src/config.js` as a named field on `CFG` — never inline in source files

**New MIDI channel behavior pattern:**
- Add behavior object to the appropriate `*_BEHAVIORS` array in `src/midi-patterns.js`

**Snapshots before touching `index.html`:**
- Copy current `index.html` to `versions/vX.Y.Z-index.html` before any edit

## Special Directories

**`MACH:INE II/versions/`**
- Purpose: mandatory snapshots of HTML and JS files before structural changes
- Generated: manually (by developer, required by RULES.md)
- Committed: yes

**`MACH:INE II/composer/`**
- Purpose: archived v2 prototype composer system — not loaded in production
- Generated: no
- Committed: yes (reference material)

**`MACH:INE II/new/`**
- Purpose: working area for new features, session packages, MIDI test files
- Generated: partially (session exports, test MIDIs)
- Committed: yes

**`MACH:INE II/.claude/skills/`**
- Purpose: deep knowledge for Claude subagents working on specific areas
- Generated: no (hand-authored)
- Committed: yes
- Critical: always read the relevant SKILL.md before working on composition, visuals, or runtime

**`MACH:INE II/.claude-flow/`**
- Purpose: claude-flow runtime state, logs, metrics
- Generated: yes (runtime)
- Committed: no (in .gitignore)

---

*Structure analysis: 2026-03-27*
