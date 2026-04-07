# Testing

**Analysis Date:** 2026-03-27

---

## Framework

**None.** There is no automated test framework installed or configured in this project. No `package.json`, no Jest, Vitest, Mocha, or any test runner. No CI pipeline.

Testing is manual and browser-based: open `http://localhost:8282` in Chrome/Edge and observe audio-reactive behavior. The project has no test commands.

---

## Structure

**No test files exist** in the repository. Searching for `*.test.js`, `*.spec.js`, or any `__tests__` directory yields nothing.

The following artifacts are the closest things to testing infrastructure:

**Manual test MIDI files** — `new/claude-code-package/midi-test/` contains 7 `.mid` files, one per engine:
- `TERRENO_D-Dorian_72bpm.mid`
- `MECCANICA_Cs-Dorian_98bpm.mid`
- `DERIVA_A-Lydian_beatless.mid`
- `VORTICE_E-Phrygian_138bpm.mid`
- `CRISTALLO_E-Lydian_54bpm.mid`
- `ABISSO_Bb-Phrygian_76bpm.mid`
- `SOLCO_G-Dorian_128bpm.mid`

These are used for manual auditioning of each engine's MIDI output — not automated assertion.

**Version snapshots** — `versions/` directory contains HTML snapshots at various release points (v0.1.0, v0.8.0, v1.3.0, etc.). Used to verify visual regressions by loading a past snapshot in the browser. Not automated.

**`test.html`** — A file at the project root. Not examined in detail; likely a sandbox for a specific feature rather than a test suite.

**`sandbox.html` + `sandbox-vX.Y.Z.html`** — Iterative sandboxes snapshotted alongside releases. Used for isolated feature experiments, not assertions.

**`src/midi-clock.worker.js`** — The MIDI clock is isolated in a Web Worker, which theoretically enables unit testing outside the browser — but no tests are written for it.

---

## Coverage

**Zero automated test coverage.** Every system is untested by automated means:

| System | File | Test Coverage |
|--------|------|---------------|
| Audio analysis (FFT, onset, BPM) | `src/audio.js` | None |
| MIDI I/O and clock | `src/midi.js` | None |
| Narrative state derivation | `src/state.js` | None |
| Director (scenes, arc, camera) | `src/director.js` | None |
| Composer engines (×7) | `src/composer*.js` | None |
| Presence multiplier registry | `src/presence-multiplier.js` | None |
| DNA generation and zones | `src/dna.js` | None |
| Entity lifecycle and pooling | `src/generations.js` | None |
| Halftone/Bayer render field | `src/field.js` | None |
| Color system and palettes | `src/colors.js` | None |
| Performance sequencer | `src/sequencer.js` | None |
| MIDI pattern mapping | `src/midi-patterns.js` | None |

**High-risk untested areas** (complex logic, no coverage):

- Voice leading in composers: the "closest note from scale" selection algorithm runs on every MIDI note event. Logic errors produce wrong notes.
- Rupture stage progression (4 mandatory sub-stages): incorrect threshold comparisons could skip stages silently.
- Presence multiplier crossfade: `isChannelAllowed()` logic governs which engines may write to which channels during overlap — errors cause MIDI channel conflicts.
- Entity pool recycling in `src/generations.js`: swap-and-pop under high entity counts.
- Sequencer recovery via `sessionStorage`: the `canRecover()` / `recoverState()` path reads stale concert time from storage.

---

## Patterns

Because there are no automated tests, the following manual verification patterns are used instead:

**Console logging for lifecycle events.** Each composer logs ON/OFF state and phase transitions to the browser console with a `[COMPOSERN]` prefix. Phase progression can be observed without additional tooling:
```
[COMPOSER7] ON — G Dorian SOLCO 128bpm
[COMPOSER7] → densita
```
The sequencer logs every cue execution:
```
[SEQ] LAYER ABISSO → pm 0.3 (30s)
[SEQ] FADE CRISTALLO → pm 0.0 (30s)
```

**HUD debug overlay.** The render system includes a debug HUD toggled by keyboard. Shows per-engine presence multipliers, arc phase, current scene, BPM, and MIDI state. Verified visually during performance runs.

**Version snapshot comparison.** Before any change to `index.html`, the current version is saved to `versions/`. Regression testing = side-by-side browser comparison.

**MIDI file replay.** The `.mid` files in `new/claude-code-package/midi-test/` and `new/claude-code-package/midi-split/` allow auditioning engine output via a DAW without running the full application.

**Workflow rule (from RULES.md):** Non-trivial changes require a plan → approval → implementation → manual verification cycle. The verification step is always manual browser/DAW testing.

---

## Recommendations (for future test coverage)

If tests are ever added, the highest-priority units are:

1. **`src/state.js` `updateState()`** — Pure math on numbers. No browser APIs needed. Easiest to unit-test.
2. **`src/presence-multiplier.js`** — Pure functions (`setPresenceMultiplier`, `isChannelAllowed`, `getPresenceMultiplier`). Zero dependencies.
3. **Voice leading selection** in each composer — deterministic when given a fixed mode array and current note. Could use a seeded RNG shim.
4. **Rupture stage threshold comparisons** — Critical correctness requirement (4 stages always required). Logic is pure arithmetic.
5. **`src/sequencer.js` cue dispatch** — Could be tested with a mocked `activateSingle` and time injection.

---

*Testing analysis: 2026-03-27*
