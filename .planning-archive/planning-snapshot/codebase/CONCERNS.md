# Codebase Concerns

**Analysis Date:** 2026-03-27

---

## Technical Debt

**Seven parallel composer files with near-identical structure:**
- Issue: `src/composer.js`, `src/composer2.js` … `src/composer7.js` share the same boilerplate — `sendMIDINote` wrapper, `addMidiNote` wrapper, phase machine, rupture stage tracking, `initComposerN`/`updateComposerN`/`toggleComposerN`/`getComposerNStatus` exports. Changes to the shared pattern require updating all 7 files manually.
- Files: `src/composer.js` through `src/composer7.js`
- Impact: Bug fixes or pattern-level improvements must be applied 7 times. Drift is already visible (e.g. composer3 imports `addOnsetWave`; others do not; composer2 imports `emit` from `director-events.js`; others do not).
- Fix approach: Extract a `ComposerBase` factory or shared helper that the 7 engines configure with their own params. Blocked by the zero-build constraint — plain ES module factory function is the right form.

**`resetAllMultipliers()` resets to 1.0 (not 0.0):**
- Issue: `presence-multiplier.js:48–50` sets every engine's pm to `1.0` on reset. Used 5+ times in `sequencer.js`. If called while multiple engines are active, there is one frame where all 7 engines have pm=1.0 simultaneously, causing a MIDI note burst on all channels at full velocity.
- Files: `src/presence-multiplier.js`, `src/sequencer.js`
- Impact: Audible artifact on sequencer start, stop, jump. `main.js` already documents the workaround at line 79 ("no intermediate resetAllMultipliers() to avoid a frame where all 7 engines have pm=1.0 simultaneously"). The sequencer itself does not apply this caution.
- Fix approach: Add a `resetAllMultipliersSilent()` that sets all to 0.0, or accept a target value param. Replace sequencer calls before `_deactivateAll` is called.

**`fpsAutoLimit` defined in CFG but never consumed:**
- Issue: `CFG.fpsAutoLimit = 30` in `src/config.js:146` but no code in `src/render.js` or `src/main.js` reads or enforces it. The render loop is uncapped (runs at rAF speed, typically 60fps or display refresh rate).
- Files: `src/config.js`, `src/render.js`
- Impact: On high-refresh displays (120Hz ProMotion) or fast machines, the loop runs faster than intended. Audio/state processing runs every frame; unnecessary CPU use.
- Fix approach: Implement a frame-skip guard in `main.js` using the configured value, or remove the config key if the limit is intentionally dropped.

**Stale `// was X` inline comments throughout `src/director.js`:**
- Issue: Multiple scene definitions carry comments like `// was 0.2`, `// was 1.6`, `// was 0.9`, `// was 0.6` (lines 41, 50, 68, 77, 86). Same pattern in `src/config.js` (lines 54, 55, 97).
- Files: `src/director.js`, `src/config.js`
- Impact: Not a runtime bug but creates noise and false history. The actual history is in `versions/` and `CHANGELOG.md`.
- Fix approach: Remove stale comments in a housekeeping commit; rely on git history for previous values.

**`src/main.js` imports from a skill script outside `src/`:**
- Issue: Line 24: `import { WakeLockManager } from '../.claude/skills/runtime-expert/scripts/perf-utils.js'`. A production runtime module depends on a file stored under a `.claude` skills directory.
- Files: `src/main.js`, `.claude/skills/runtime-expert/scripts/perf-utils.js`
- Impact: Tight coupling between runtime code and an AI-assistance tool directory. Renaming, moving, or restructuring the skills tree would silently break the boot sequence.
- Fix approach: Copy the needed utility (WakeLockManager is a small class) into `src/perf-utils.js` or a new `src/utils/` file.

**Duplicate `globalTime` tracking in `render.js` and `sequencer.js`:**
- Issue: Both `src/render.js:28` and `src/sequencer.js:97` maintain their own independent `globalTime` variable, both incremented by `dt` each frame/tick. They are kept in sync only indirectly via `setConcertTime()`.
- Files: `src/render.js`, `src/sequencer.js`
- Impact: Clock drift is possible if `dt` differs between the rAF loop and the MIDI worker tick (they run on different intervals). After a sequencer jump (`_fastForwardTo`), `render.js`'s `globalTime` continues from where it was.
- Fix approach: Export a single authoritative time source, or explicitly feed the sequencer time to the render system.

---

## Known Issues

**System collapse at minute 24+ (documented bug, partially fixed):**
- Symptoms: MIDI clock stalls, visuals freeze, musical chaos — converging into an indistinct wall of sound.
- Files: `src/sequencer.js`, `src/director.js`, `src/config.js`, all `composer*.js`
- Root causes (from `CODE-TASKS-BUGFIX-MIN24.md`):
  1. **Cue ordering** — previously GELO firma cues were out of chronological order, causing all batch-processing in one frame. **Status: Fixed** — `CUES.sort()` added at `sequencer.js:93`.
  2. **Arc phase ping-pong** — `setArcPhaseForced()` called 500×/sec by every active composer, resetting `arc.phaseTime` to 0 constantly. **Status: Fixed** — priority-based guard implemented in `director.js:1076–1085`; `resetArcPriority()` wired into worker tick in `main.js:226`.
  3. **Double kick (CH0 overlap)** — `kickDominanceThreshold` too low. **Status: Fixed** — threshold raised to 0.6 in `config.js:149`.
  4. **MECCANICA→SOLCO transition too long** — 4-minute overlap at full presence for both engines. **Status: Described in TASK 4 of bugfix doc — verify current sequencer.js cues reflect the fix.**
  5. **MECCANICA phase cycle reset** — engine restarts from `germoglio` mid-performance during overlap. **Status: Described in TASK 5 — verify fix applied.**

**20-second gap in ACTS array between Act III and Act IV:**
- Symptoms: `globalTime` between t=1680 and t=1800 falls outside all defined acts. `currentAct()` falls through the loop and returns the last act name.
- Files: `src/sequencer.js:20–26`
- Trigger: Always — `ACTS[2].end = 1680`, `ACTS[3].start = 1800`. Gap = 120 seconds.
- Workaround: The fallback returns the last act name. No visual crash, but the HUD and logging report wrong act name for 2 minutes.

**`composer.js` BPM in config still shows 80 — ROADMAP proposes it remain 80:**
- Confirmed matching. However several other BPM values in config match v2.9 proposals (MECCANICA: 92, VORTICE: 112, SOLCO: 120) but the ROADMAP analysis notes none of the harmonic restructuring or hi-hat continuity have been implemented yet.
- Files: `src/config.js:166–380`, `ROADMAP-v2.9.md`

---

## Performance

**169 calls to `Math.random()` per-frame — non-reproducible, non-seedable:**
- Problem: 169 `Math.random()` calls scattered across `src/dna.js`, `src/generations.js`, `src/director.js`, `src/composer*.js`. These cannot be seeded, making session reproduction impossible and performance profiling inconsistent.
- Files: All `src/` JS files
- Cause: No shared SeededRNG (available in `.claude/skills/runtime-expert/scripts/perf-utils.js`) is used in production.
- Improvement path: Replace hot-path calls (inside `updateGenerations`, `triggerOnset`, `triggerMIDI`) with `SeededRNG` instances. Cosmetic/rare calls can remain unseeded.

**`midiColorAt()` iterates full `midiTrail` twice per pixel in the field render:**
- Problem: `src/field.js:97–183` — `midiColorAt()` is called once per cell in the Bayer dither grid. It contains two full `midiTrail` loops (shapes loop + trail contour loop). At 60fps with a full canvas at 1920×1080 and GRID_CELL=8 (field resolution), this is O(cells × trail_length) per frame.
- Files: `src/field.js`
- Cause: No spatial acceleration for MIDI trail lookup.
- Improvement path: Pre-build a sparse color grid for midiTrail (similar to `entityGrid` in `generations.js`) at the start of each frame, then look up O(1) per cell.

**`midi.channels[ch].active.filter()` on every Note Off:**
- Problem: `src/midi.js:93` — `chData.active = chData.active.filter(n => n.note !== data1)` creates a new array on every Note Off message. In dense polyphonic playing this is called at MIDI event rate (~100Hz).
- Files: `src/midi.js`
- Cause: Array filter instead of swap-and-pop or a Set.
- Improvement path: Use a `Set` for `active` notes keyed by note number, or swap-and-pop removal.

**`noteTimestamps.shift()` and per-channel `chData.timestamps.shift()` called in `updateMIDI()`:**
- Problem: `src/midi.js:111–121` — array `shift()` on every frame (O(n) because it shifts all elements). At 60fps with a 2-second window and high MIDI density, these arrays can hold 100+ entries.
- Files: `src/midi.js`
- Cause: Linear arrays instead of ring buffers.
- Improvement path: Replace with `RingBuffer` from `perf-utils.js` or a simple head-pointer ring.

**`recentOnsets.shift()` and `contrastSamples.shift()` in `updateState()` every frame:**
- Problem: `src/state.js:44–46, 94–96` — same O(n) array shift anti-pattern as midi.js.
- Files: `src/state.js`
- Improvement path: Same ring buffer approach.

**`midi.noteFlashes.splice(i, 1)` inside reverse-iteration loop:**
- Problem: `src/midi.js:129` — `splice()` on a visual array at MIDI message rate. Though the reverse iteration avoids index corruption, `splice` is O(n) each call.
- Files: `src/midi.js`
- Improvement path: Swap-and-pop + `length--` (already used correctly in `generations.js`, `field.js`).

**Three `Map()` + spread objects per frame in director blending:**
- Problem: From CLAUDE.md anti-pattern list: "3× `map()` + object spread per frame in blend scene → pre-allocare buffer". This means the scene blending logic in `src/director.js` allocates multiple temporary objects on every frame.
- Files: `src/director.js`
- Cause: Functional style (map/spread) preferred for clarity, but in the 60fps render loop these become GC pressure.
- Improvement path: Pre-allocate blend target objects; mutate in place.

---

## Fragile Areas

**`src/director.js` (1145 lines) — protected and interconnected:**
- Files: `src/director.js`
- Why fragile: The largest file. Houses SCENES, ENGINE_PREFS, ENGINE_VISUAL_PHASES, ENGINE_COMPOSITIONS, ENGINE_INVERSIONS, arc state, camera state, scene blending, director events, and rupture logic. All exports are consumed by `render.js`, `composer*.js`, and `sequencer.js`. Any structural change risks breaking 3+ other modules simultaneously.
- Safe modification: Read DESIGN.md and ENGINES_SPEC.md first. Modify only leaf functions. Never restructure exports without updating all importers. Flagged as a protected area in CLAUDE.md.
- Test coverage: None (no test files detected).

**MIDI clock split across two threads:**
- Files: `src/midi-clock.worker.js`, `src/main.js`, `src/midi.js`
- Why fragile: The Web Worker fires every ~2ms and drives all 7 composer `update*()` calls plus the MIDI clock lookahead scheduling. Any uncaught exception in the worker message handler silently stops all MIDI output (mitigated by the try/catch at `main.js:246–250`, but the catch only logs). Clock state (`nextTickTime`, `midiClockRunning`) lives in `midi.js` and is read from the worker message handler — shared mutable state across event loop boundaries.
- Safe modification: Always wrap worker handler code in the existing try/catch. Never add `await` inside the worker message handler.

**Sequencer cue array — source-of-truth for concert dramaturgy:**
- Files: `src/sequencer.js:31–90`
- Why fragile: The `CUES` array is hand-authored time data. Out-of-order entries previously caused the minute-24 collapse. The `CUES.sort()` guard (line 93) is a safety net but does not prevent logical errors (e.g. a `fade_to` targeting an engine that was never `activate`d, or a `fade_to` before a `layer`).
- Safe modification: Add cue validation at sort time (check that `fade_to` targets have prior `activate`/`layer` cues). Never insert cues without verifying chronological integrity.

**`recoverState()` trusts `sessionStorage` data blindly:**
- Files: `src/sequencer.js:277–299`
- Why fragile: If `sessionStorage` contains stale data from a previous version (different engine names, different cue structure), `recoverState()` will silently apply it. The only validation is a 5-minute timestamp window.
- Safe modification: Add a schema version check to the saved state object.

**`triggerMIDI()` in `generations.js` iterates all entities for "illuminate nearby" effect:**
- Files: `src/generations.js:122–130`
- Why fragile: This O(entities) loop runs inside the MIDI note processing path, which can fire up to `CFG.maxMidiNotesPerFrame = 20` times per frame. At `maxEntities = 4000`, this is 80,000 entity checks per frame in the worst case.
- Safe modification: Limit the illuminate radius check to the spatial grid, not the full entity array.

---

## Security

**`navigator.requestMIDIAccess({ sysex: false })` — appropriate:**
- Risk: SysEx is disabled, which is correct. No arbitrary MIDI device control.
- Files: `src/midi.js:197`
- Current mitigation: Correct.

**`navigator.mediaDevices.getUserMedia()` — audio input required on boot:**
- Risk: Fails gracefully (shows error screen) if permission is denied. No fallback to MIDI-only mode.
- Files: `src/audio.js:68`, `src/main.js:114–120`
- Current mitigation: Error screen displayed. The show must not go on without audio.
- Recommendation: Consider a MIDI-only mode for environments without microphone/BlackHole input.

**`sessionStorage` used for crash recovery — no sanitization on read:**
- Risk: Malformed data in `sessionStorage` (manually edited, browser extension, cross-tab collision) passes through `JSON.parse()` without schema validation. The `catch (e)` in `recoverState()` prevents a crash but logs to console and leaves the sequencer in an undefined state.
- Files: `src/sequencer.js:277–299`
- Recommendation: Validate required fields (`globalTime`, `cueIndex`, `presences`) before applying recovered state.

**`window.open('projector.html', ...)` — popup may be blocked:**
- Risk: No feedback to the user if the popup is blocked by the browser. `projectorWindow` is set to the return value, which is `null` if blocked. Subsequent `_projectorWin.closed` checks would throw.
- Files: `src/main.js:103`
- Current mitigation: `projActive` check uses `_projectorWin && !_projectorWin.closed` — the null guard prevents throw. Silent failure only.

---

## Domain-Specific Concerns

**BPM transitions are not crossfaded in the MIDI clock — abrupt jump on engine switch:**
- Problem: `getActiveBpm()` in `src/main.js:202–221` selects the BPM of the engine with the highest pm. When presence crosses the threshold (e.g. MECCANICA dominates at 92bpm, then SOLCO takes over at 120bpm), the MIDI clock BPM changes instantly on the next worker tick. Ableton's sync PLL may take several beats to lock to the new tempo, causing a perceptible stutter.
- Files: `src/main.js`, `src/midi.js`
- Improvement path: Lerp `clockBpm` toward the target over 2–4 beats rather than snapping. Requires tracking a `targetBpm` separately from `clockBpm` in `midi.js`.

**Harmonic incompatibility between overlapping engines (ROADMAP-documented):**
- Problem: Current engine tonalities span the entire chromatic circle. Simultaneous MIDI output from two engines in unrelated modes (e.g. C# Dorian + G Dorian = tritone relationship) creates dissonance that is not intentional.
- Files: All `composer*.js`, `src/config.js` (scale definitions)
- Cause: Each engine was designed in isolation; no systematic inter-engine harmonic compatibility check exists.
- Status: Tracked in `ROADMAP-v2.9.md`. Proposed solution is to anchor all engines to A or D centers. Not yet implemented.

**VORTICE at 112bpm — config updated but ROADMAP notes no rhythmic re-composition done:**
- Problem: `CFG.COMPOSER4.bpm = 112` matches the v2.9 proposal. However, the ROADMAP notes that VORTICE's internal rhythmic material (step sequencer patterns, micro-loops, pitch cycling) was designed for 138bpm. At 112bpm the patterns may feel too slow without re-voicing.
- Files: `src/composer4.js`, `src/config.js`
- Status: BPM changed, compositional patterns not yet adapted to new tempo.

**No hi-hat continuity element across engines:**
- Problem: ROADMAP-v2.9 identifies the absence of a continuous rhythmic element (hi-hat/ride) that persists through engine transitions as a key structural weakness. Each engine's percussion kit starts and stops completely with the engine.
- Files: All `composer*.js`
- Impact: Each engine transition is a full rhythmic break, not a smooth handoff. Perceptible as "stops and starts" rather than a DJ-style mix.
- Fix approach: Add a shared hat/ride channel (CH7 is available on most engines) that persists at reduced velocity when the engine is in crossfade.

**`firma.gelo` freezes entity aging for only 8 seconds at t=1500:**
- Problem: `sequencer.js:55–56` — GELO ON at t=1500, GELO OFF at t=1508. The 8-second window is very short (≈4 bars at 92bpm). The CLAUDE.md notes "4 battute senza kick (~8s a 92bpm)" which confirms this is intentional. However if the frame rate drops during that window (e.g. a GC pause), the 8-second delta in `globalTime` may expand beyond the freeze window without the effect being perceptible.
- Files: `src/sequencer.js`

**MIDI clock lookahead is 50ms — adequate but fixed:**
- Problem: `src/midi.js:44` — `CLOCK_LOOKAHEAD = 50`. At high BPM (120bpm, 24ppqn = tick every ~20.8ms), 50ms pre-schedules ~2.4 ticks. Adequate, but if the main thread stalls for >50ms (GC, tab backgrounding), the lookahead drains and the Ableton sync PLL may slip before the next worker tick reschedules.
- Files: `src/midi.js`
- Mitigation: The Web Worker is on a separate thread and continues ticking even under main thread load (the entire point of the worker). The risk is only if the main thread is where `updateMIDIClock()` is called — and it is: called inside `midiWorker.onmessage` which runs on the main thread. So main thread GC stall > 50ms would cause clock gap.
- Improvement path: Move `updateMIDIClock()` inside the worker itself (pass BPM via `postMessage`), so lookahead scheduling is immune to main-thread pauses.

**BPM estimation from onsets is non-deterministic:**
- Problem: `src/audio.js` computes BPM from audio onset timestamps. In live performance with complex music, the onset detector may lock onto wrong beat multiples (half-time, double-time), causing sudden displayed BPM jumps. The BPM is also used in `manualToggle` display only — it does not affect the internal MIDI clock, which is engine-driven.
- Files: `src/audio.js`
- Impact: Cosmetic (HUD display) but could confuse performers reading the HUD.

**`midi.noteFlashes` and `midiTrail` arrays grow unbounded during high-density MIDI input:**
- Problem: `noteFlashes` is pruned only by alpha decay in `updateMIDI()`. During intense playing (dense velocity), many flashes maintain alpha > 0.008 for several frames. No hard cap. `midiTrail` is capped by `engineRender.trailMax` (24–64) but `midiTrail.shift()` is used when the cap is exceeded — O(n) on a per-note-event basis.
- Files: `src/midi.js`, `src/field.js`

---

*Concerns audit: 2026-03-27*
