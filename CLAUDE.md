# CLAUDE.md

## Project
MACH:INE II is a browser-based recursive co-composition system for live audiovisual performance and installation.

Stack:
- JavaScript ES modules
- Canvas 2D
- Web Audio API
- WebMIDI API

## Core idea
The system is not a visualizer.
Music is the environment in which the visual system lives.
Machine proposes, performer interprets, system listens and reinterprets visually.

## Main modules
- main.js: boot, wiring, game loop
- audio.js: realtime audio analysis
- midi.js: MIDI input and routing
- midi-patterns.js: visual mapping per MIDI channel
- state.js: abstract state from audio
- config.js: central numeric parameters (CFG)
- dna.js: world DNA, primitives, zones
- generations.js: entities, fossils, birth/death
- field.js: visual field, onset waves, MIDI columns
- colors.js: palettes, climax, inversion
- director.js: scenes, narrative arc, mutations, camera
- render.js: frame orchestration, HUD, keyboard

## Hard rules
- Prefer small safe edits.
- No monolithic rewrites.
- No duplicated logic.
- No magic numbers.
- Put sensitive numeric parameters in config.js.
- Technical code/comments in English.
- Project documentation in Italian.

## Protected areas
Ask before changing:
- main.js / render.js / director.js relationships
- audio history buffer
- onset detection
- narrative arc to visual arc relationship
- rupture behavior
- climax behavior
- camera logic tied to narrative

## Narrative constraints
The director is a narrative controller, not a random engine.
Changes to scenes, arc, mutations, camera, climax, or rupture must be justified narratively.

Rupture must always follow 4 stages:
1. Omen
2. Infiltration
3. Takeover
4. Residue

## Working mode
For every non-trivial task:
1. Identify touched files
2. Write a short plan
3. Ask approval if protected areas are touched
4. Implement the smallest possible diff
5. Report changed files, rule checks, and risks