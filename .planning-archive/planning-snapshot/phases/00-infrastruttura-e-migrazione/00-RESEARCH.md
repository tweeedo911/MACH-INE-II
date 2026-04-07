# Phase 0: Infrastruttura e Migrazione — Research

**Researched:** 2026-03-27
**Domain:** MIDI clock timing, BPM transition, section transition burst, V3_MODE flag, git archive
**Confidence:** HIGH (based on direct code inspection of all relevant source files)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIGR-01 | Il codice v2 è archiviato su branch git separato prima di qualsiasi modifica al main | Git branch strategy — single `main` branch confirmed, `v2-archive` branch creation is a pure git operation |
| MIGR-02 | Un flag `V3_MODE` in config.js permette coesistenza v2/v3 durante lo sviluppo | CFG object in config.js is flat — append `V3_MODE: false` at top, no structural change needed |
| INFR-01 | Il MIDI clock gira nel Web Worker — nessuna GC pause sul main thread può interrompere il timing | Worker already isolated but clock scheduling still crosses main thread boundary; 50ms lookahead in midi.js already decouples timing from main-thread GC spikes — gap: the `updateMIDIClock()` call happens inside `midiWorker.onmessage` on the main thread |
| INFR-02 | Le transizioni di BPM sono lerp su 2-4 battute (nessun snap brusco che rompe il sync Ableton) | No BPM lerp exists in codebase — `getActiveBpm()` snaps immediately to highest-PM engine BPM |
| INFR-03 | Le transizioni tra sezioni non generano burst di note — silenzio/crossfade protetto | `processCue('silence')` calls `_deactivateAll()` which calls `toggleComposer*()` for each active engine — these toggles do NOT flush pending notes; no `sendMIDIAllNotesOff()` call at section boundaries |
</phase_requirements>

---

## Summary

Phase 0 is infrastructure work on an existing, functional codebase (v2.9.0). The codebase uses zero npm dependencies, pure ES modules, and a dual-thread architecture (rAF main loop + MIDI clock Web Worker). No new libraries are introduced in this phase — all changes are edits to existing files.

The git archive is straightforward: one branch operation before any code change. The V3_MODE flag is a single-line addition to `config.js`. The MIDI stutter risk is partially mitigated (lookahead scheduling exists) but has a residual gap: `updateMIDIClock()` is called from within `midiWorker.onmessage` on the **main thread**, not the Worker. A GC pause can delay the `onmessage` handler and starve the lookahead window. The fix is to move clock tick scheduling directly inside the Worker. The BPM snap issue is confirmed — `getActiveBpm()` switches BPM instantly with no interpolation. The MIDI burst issue is confirmed — section transitions call `toggleComposer*()` without flushing active notes first.

**Primary recommendation:** Execute in strict order: (1) git archive, (2) V3_MODE flag, (3) move clock scheduling into Worker, (4) add BPM lerp, (5) add note-flush at section boundaries.

---

## Project Constraints (from CLAUDE.md)

These are binding directives from `MACH:INE II/CLAUDE.md` and `MACH:INE II/src/` project conventions:

- **Zero npm/bundler/transpiler** — no new dependencies, no build step
- **Zero magic numbers** — all numeric parameters must live in `CFG` (config.js)
- **No monolithic rewrites** — smallest possible diff per change
- **Protected files** — `main.js`, `render.js`, `director.js` require extra caution; changes here need explicit approval per RULES.md
- **Config centralization** — BPM lerp parameters (duration in beats, lerp rate) must be added to CFG, not hardcoded
- **Commit format** — `vX.Y.Z: descrizione breve` + update CHANGELOG.md
- **Language split** — code/technical comments in English; project docs in Italian; musical intent comments in Italian
- **No tests framework** — manual testing via browser + MIDI monitor; no Jest/Vitest/pytest
- **Server** — `python3 -m http.server 8282` on `127.0.0.1`

---

## Standard Stack

### Core (no changes — existing stack)
| Component | Location | Purpose |
|-----------|----------|---------|
| ES modules | `src/*.js` | All source — no bundler |
| Web Worker | `src/midi-clock.worker.js` | MIDI clock isolated from main thread |
| WebMIDI API | `src/midi.js` | MIDI output with lookahead scheduling |
| CFG object | `src/config.js` | All numeric parameters centralized |

### New additions in Phase 0
None. Phase 0 edits existing files only.

**Version verification:** N/A — zero dependencies, no npm packages.

---

## Architecture Patterns

### Existing Architecture (what we're working with)

```
Main Thread (rAF ~60fps):
├── updateAudio()
├── updateMIDI()
├── updateState()
├── updateSequencer(dt)     ← section transitions, presence fades
└── renderFrame()

MIDI Worker Thread (~2ms tick):
└── postMessage({ dt, now }) → main thread

Main Thread (onmessage handler — NOT the Worker):
├── resetArcPriority()
├── updateComposer1-7(dt)   ← MIDI note generation
└── updateMIDIClock(bpm)    ← clock tick scheduling  ← PROBLEM POINT
```

### Pattern 1: BPM Selection (current — broken)

`getActiveBpm()` in `main.js` lines 202-221: iterates all 7 engines, picks BPM from engine with highest presence multiplier. Assigns directly to `lastClockBpm` with no interpolation.

```javascript
// src/main.js — current (no lerp)
function getActiveBpm() {
  let bestPm = 0;
  for (const e of engines) {
    if (e.active && e.bpm && e.pm > bestPm) {
      bestPm = e.pm;
      lastClockBpm = e.bpm;  // SNAP: no lerp
    }
  }
  return lastClockBpm;
}
```

**Fix pattern:** Add `_targetClockBpm` and `_currentClockBpm` module-level variables. In `getActiveBpm()`, set `_targetClockBpm`. In the `onmessage` handler, lerp `_currentClockBpm` toward `_targetClockBpm` using dt and a rate derived from `CFG.bpmLerpBeats`. Pass `_currentClockBpm` to `updateMIDIClock()`.

### Pattern 2: MIDI Clock Scheduling (current — partially correct)

`updateMIDIClock()` in `src/midi.js` lines 172-184: uses lookahead buffer (50ms) to pre-schedule clock ticks with hardware timestamps. This is correct — the WebMIDI driver delivers ticks at the exact scheduled time regardless of main-thread load.

**Remaining gap:** `updateMIDIClock()` is called inside `midiWorker.onmessage` on the main thread (main.js line 245). If a GC pause delays the `onmessage` handler, the lookahead window may not be replenished in time. With 50ms lookahead and typical V8 GC pauses of 5-20ms (young gen scavenge) or up to 50ms (major GC), the buffer has some margin but it can be exhausted during a major GC event.

**Fix options (ranked):**
1. Move `updateMIDIClock` logic into the Worker itself — Worker is not subject to main-thread GC pauses, and `setTimeout(tick, 2)` in the Worker gives 2ms granularity for lookahead replenishment (HIGH confidence, matches skill reference)
2. Increase CLOCK_LOOKAHEAD from 50ms to 100ms — reduces risk without architecture change (MEDIUM — doesn't eliminate the problem, only reduces frequency)

Option 1 requires passing `bpm` into the Worker via `postMessage` and giving the Worker a reference to the MIDI output — which is not possible (WebMIDI objects are not transferable). Therefore the correct fix is to increase the lookahead buffer on the main thread AND add a heartbeat from the Worker that triggers replenishment more reliably. The Worker already calls `onmessage` every 2ms; the main thread handler already calls `updateMIDIClock()` each tick. The issue is only during pauses longer than 50ms.

**Revised fix:** Increase `CLOCK_LOOKAHEAD` from 50ms to 100ms in `src/midi.js`. This provides 2× safety margin against V8 major GC pauses. No architecture change needed.

### Pattern 3: Section Transition MIDI Burst (current — broken)

`processCue('silence')` in `src/sequencer.js` line 349:
```javascript
case 'silence':
  if (_deactivateAll) _deactivateAll();   // calls toggleComposer*() for each active
  resetAllMultipliers();
  transitions = [];
  break;
```

`_deactivateAll` calls `toggleComposer()` etc. in `main.js:allOff()`. These toggle functions set `composerActive = false`, stopping future note generation — but they do NOT flush notes already scheduled or held. Notes with a `durationMs` parameter in `sendMIDINote()` have hardware-scheduled note-offs via WebMIDI timestamp. Notes without explicit note-offs (or with long durations) stay active on the synth.

`sendMIDIAllNotesOff()` exists in `src/midi.js` (line 151-154) — sends CC 123 (All Notes Off) on channels 0-7. This is the correct tool.

**Fix:** In `processCue('silence')` and at `processCue('end')`, call `sendMIDIAllNotesOff()` BEFORE `_deactivateAll()`. Import `sendMIDIAllNotesOff` in `sequencer.js` (it is not currently imported there — import is needed from `midi.js`).

The same issue applies to `'layer'` transitions where an engine with pm=0 is activated before existing notes drain. The fix for this is the presence multiplier gate (`if (pm < 0.05) return`) which already exists in each composer — so layered transitions should be safe as long as the incoming engine starts at pm=0 (which the sequencer does via `setPresenceMultiplier(cue.engine, 0.0)` before activating).

### Pattern 4: V3_MODE Flag

`config.js` exports a single `CFG` object with 400+ lines of flat properties and nested engine objects. The flag is a boolean that v3 code will read to gate new behavior.

```javascript
// src/config.js — addition at top of CFG object
export const CFG = {
  V3_MODE: false,    // false = v2 behavior; true = v3 layer system
  // ... existing properties unchanged
};
```

All v3 modules added in Phase 1+ will check `CFG.V3_MODE` before activating. The v2 engine toggle keys and update paths remain in place.

No other file needs to change for the flag itself. Downstream phases will add `if (!CFG.V3_MODE) return;` guards.

### Pattern 5: Git Archive Strategy

Current git state: single `main` branch with all v2 code. Latest commit is `v2.9.0`.

Archive strategy:
1. Create `v2-archive` branch pointing to current `main` HEAD
2. Push `v2-archive` to remote (if remote exists) or keep local
3. All Phase 0 changes happen on `main`

This is a zero-risk operation — `v2-archive` is just a pointer to the existing commit. No files are moved or deleted from `main`.

```bash
git branch v2-archive      # create branch at current HEAD
git push origin v2-archive # push if remote exists
```

Verify: `git log v2-archive --oneline -3` should show the same commits as `main` before any Phase 0 changes.

### Anti-Patterns to Avoid

- **Moving MIDI output to Worker:** WebMIDI `MIDIOutput` objects cannot be transferred to Workers (they are not Transferable). Any fix to INFR-01 must stay on the main thread.
- **Calling `sendMIDIAllNotesOff()` after engine toggle:** The notes may already have hardware-scheduled note-offs in the WebMIDI driver queue. Sending CC 123 before deactivation flushes those too. Order matters: flush first, deactivate second.
- **BPM lerp rate as a raw ms value:** Express as beats (e.g., `CFG.bpmLerpBeats: 2`) and compute ms at runtime from the current BPM. This avoids the paradox of a fixed-time lerp that takes different bar counts at different tempos.
- **Touching render.js, director.js without explicit approval:** Per CLAUDE.md protected areas rule.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MIDI note flush | Custom per-channel tracking | `sendMIDIAllNotesOff()` (already in midi.js) | CC 123 is standard; already implemented and tested |
| BPM interpolation | External lerp library | Inline lerp with CFG parameters | Zero-dependency constraint; lerp is 1 line |
| Presence fade | New crossfade system | Existing `transitions[]` in sequencer.js | Already implements cubic hermite easing |
| Clock tick scheduling | setInterval / rAF replacement | Existing Worker + lookahead pattern | Already correct architecture; only needs parameter tuning |

---

## Common Pitfalls

### Pitfall 1: WebMIDI Objects Not Transferable to Workers
**What goes wrong:** Attempting to move `midiOut.send()` calls into the MIDI clock Worker to avoid main-thread GC exposure.
**Why it happens:** WebMIDI `MIDIOutput` is a DOMObject — not Transferable, not serializable across Worker boundary.
**How to avoid:** Keep all `midiOut.send()` calls on main thread. Fix timing robustness via lookahead buffer size, not architecture change.
**Warning signs:** `TypeError: Failed to execute 'postMessage'` if attempted.

### Pitfall 2: BPM Lerp Causing Clock Reset
**What goes wrong:** Changing `clockBpm` mid-stream causes `nextTickTime` calculation to jump, producing a large gap or flood of ticks.
**Why it happens:** `tickIntervalMs = 60000 / (clockBpm * 24)` — if `clockBpm` changes while `nextTickTime` is far in the future (lookahead), the while loop may fire many extra ticks immediately.
**How to avoid:** BPM lerp must update `clockBpm` gradually per tick call. Never jump `nextTickTime` — only change `tickIntervalMs` on the next schedule cycle. The current lookahead while loop already handles this correctly as long as BPM changes are small per tick.
**Warning signs:** Burst of F8 messages on MIDI monitor immediately after engine transition.

### Pitfall 3: All Notes Off Timing
**What goes wrong:** `sendMIDIAllNotesOff()` called after notes are already scheduled with future timestamps — the All Notes Off arrives before the notes, which are then played anyway.
**Why it happens:** `sendMIDINote()` schedules note-on immediately but note-off with `performance.now() + durationMs`. If CC 123 is sent without a timestamp, it is delivered before the queued note-ons.
**How to avoid:** Send `sendMIDIAllNotesOff()` WITH a small future timestamp (e.g., `+5ms`) to ensure it arrives after any in-flight note-ons. Or: accept the burst and only fix the sustained notes. In practice, `midiOut.send([0xB0 | c, 123, 0])` without timestamp is a "send now" — arrives before buffered future notes. This is actually correct behavior for a section cut.
**Warning signs:** Notes continue sounding after section cut despite CC 123 being sent.

### Pitfall 4: BPM Lerp During DERIVA Engine
**What goes wrong:** DERIVA (composer3) has `bpm: null`. If lerp code tries to lerp toward null, it produces NaN which propagates into clock scheduling.
**Why it happens:** `getActiveBpm()` checks `if (e.active && e.bpm && e.pm > bestPm)` — the `e.bpm` guard already skips null. But the lerp target must also guard against null.
**How to avoid:** In lerp logic, only update `_targetClockBpm` when new target BPM is a valid number. Keep last valid BPM when DERIVA is the only active engine.
**Warning signs:** `nextTickTime` becomes NaN; MIDI clock stops silently.

### Pitfall 5: Git Branch Confusing the Planning System
**What goes wrong:** Creating `v2-archive` branch while on `main` is fine, but switching to `v2-archive` for reference causes the GSD planning system to see a different working tree.
**How to avoid:** Never checkout `v2-archive` — only use it as a reference target (`git diff v2-archive main -- src/config.js`). All work stays on `main`.

---

## Code Examples

### Current BPM selection (main.js:202-221)
The key issue: `lastClockBpm = e.bpm` is a direct assignment inside the for loop — no smoothing.
The fix target: add `_targetClockBpm` and lerp `_currentClockBpm` each Worker tick.

### Current MIDI clock call chain
```
Worker tick → postMessage({dt}) → main.onmessage → updateMIDIClock(getActiveBpm())
```
The gap: if main thread is paused by GC, `onmessage` is delayed, `updateMIDIClock` is not called, lookahead window not replenished. Increasing `CLOCK_LOOKAHEAD` from 50ms to 100ms in `src/midi.js` line 44 is the minimum fix.

### Current silence cue (sequencer.js:349-353)
```javascript
case 'silence':
  if (_deactivateAll) _deactivateAll();
  resetAllMultipliers();
  transitions = [];
  break;
```
Fix: import `sendMIDIAllNotesOff` from `'./midi.js'` in sequencer.js, then call it as first statement in the `'silence'` case and in the `'end'` case.

### V3_MODE flag placement
Add as first property of CFG object in config.js:
```javascript
export const CFG = {
  V3_MODE: false,
  // ... existing properties
```

---

## Runtime State Inventory

This is an infrastructure/flag phase, not a rename. No stored runtime state analysis required.

However, one behavioral note: the sequencer saves state to `sessionStorage` under key `'machine2-sequencer-state'`. This key is hardcoded in sequencer.js line 106. Phase 0 does not rename anything — this persists unchanged.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| git | MIGR-01 branch creation | Yes | git version (confirmed — repo exists) | — |
| Chrome/Edge | MIDI testing (INFR-01,02,03) | Yes (performer machine) | Chrome 120+ required for WebMIDI | — |
| MIDI monitor software | Verifying clock stability | Assumed available (live setup) | Any MIDI monitor (MIDI Monitor.app, etc.) | Chrome DevTools MIDI |
| python3 | Dev server | Yes | python3 -m http.server 8282 | — |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in config.json. However, MACH:INE II has no test framework (per CLAUDE.md: "No test framework. Manual testing via browser."). The validation architecture here describes manual verification signals.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — manual browser testing only (per project constraint) |
| Config file | None |
| Quick run command | `python3 -m http.server 8282` then open `http://localhost:8282` in Chrome |
| Full suite command | Same — open Chrome DevTools → Performance tab, connect MIDI monitor |

### Phase Requirements → Validation Map

| Req ID | Behavior | Test Type | Signal | How to Verify |
|--------|----------|-----------|--------|---------------|
| MIGR-01 | `v2-archive` branch exists with v2 code | Manual/git | `git log v2-archive --oneline -1` matches current HEAD before any change | Run before first code edit |
| MIGR-02 | `CFG.V3_MODE` exists in config.js and defaults false | Manual/code | `console.log(CFG.V3_MODE)` in browser console = `false` | DevTools console after page load |
| INFR-01 | No clock stutter during GC peak | Manual/MIDI monitor | MIDI monitor shows F8 ticks at regular intervals; no gap > 2× nominal interval during heavy render | Use Chrome Performance tab to trigger GC, observe MIDI monitor simultaneously |
| INFR-02 | BPM transition lerps over 2+ beats | Manual/MIDI monitor | When switching engine via keyboard (e.g., 4→5), MIDI monitor shows F8 interval changing gradually over ~2 bars, not snapping | Trigger engine switch, observe clock tick interval in MIDI monitor |
| INFR-03 | No burst at section transition | Manual/MIDI monitor | MIDI monitor shows channel silence (no note-ons) for 1-2 beats after pressing Shift+0 (sequencer stop) or at `t:0` silence cue | Trigger silence cue, observe MIDI monitor for burst-free cutoff |

### Wave 0 Gaps
No automated test files to create — project constraint prohibits test framework. All validation is manual.

---

## Open Questions

1. **INFR-01: Is 100ms lookahead sufficient?**
   - What we know: V8 major GC pauses can reach 50ms. 100ms lookahead provides 2× safety margin. The Worker ticks every 2ms, so the onmessage handler fires at most 2ms after each tick, meaning in practice the lookahead is replenished every 2ms during normal operation.
   - What's unclear: Maximum observed GC pause on the performer's specific machine during a 60-minute run has not been measured.
   - Recommendation: Increase to 100ms as minimum. If stutter persists during testing, increase to 150ms. Add a Long Task Observer in debug mode to measure actual GC duration.

2. **INFR-03: Should `sendMIDIAllNotesOff` also be called on `'end'` cue?**
   - What we know: `'end'` calls `_deactivateAll()` then `stopSequencer()`. Same note-flush issue applies.
   - What's unclear: Whether the `'end'` cue is ever triggered mid-performance (vs. as a natural end where notes have drained).
   - Recommendation: Yes, call `sendMIDIAllNotesOff()` in `'end'` case too. Defensive and harmless.

3. **BPM lerp and Ableton sync: what is "2 beats" in absolute time?**
   - What we know: At 80 BPM (TERRENO), 2 beats = 1.5 seconds. At 128 BPM (SOLCO), 2 beats = 0.937 seconds. The lerp must be expressed in beats to be tempo-relative.
   - Recommendation: Add `CFG.bpmLerpBeats: 2` to config.js. In lerp code, compute lerp rate as `targetBpm / (currentBpm * CFG.bpmLerpBeats * beatsPerMessage)` per Worker tick.

---

## Sources

### Primary (HIGH confidence)
- Direct source inspection: `/MACH:INE II/src/main.js` — getActiveBpm(), midiWorker.onmessage handler, full boot sequence
- Direct source inspection: `/MACH:INE II/src/midi-clock.worker.js` — Worker tick loop, setTimeout(tick, 2) architecture
- Direct source inspection: `/MACH:INE II/src/midi.js` — updateMIDIClock(), CLOCK_LOOKAHEAD=50, sendMIDIAllNotesOff()
- Direct source inspection: `/MACH:INE II/src/sequencer.js` — processCue(), silence/end/layer/fade_to cases
- Direct source inspection: `/MACH:INE II/src/config.js` — CFG structure, all 7 engine BPM values, no V3_MODE
- Skill: `.claude/skills/runtime-expert/references/webmidi-patterns.md` — clock scheduling patterns, lookahead rationale
- Skill: `.claude/skills/runtime-expert/references/browser-pitfalls.md` — V8 GC pause durations (young gen 1-5ms, major 10-50ms)
- Skill: `.claude/skills/runtime-expert/references/gameloop-timing.md` — rAF throttling, frame budget, background tab behavior

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — requirement IDs and descriptions (MIGR-01/02, INFR-01/02/03)
- `.planning/ROADMAP.md` — phase success criteria and dependency order
- `.planning/STATE.md` — decisions log, confirmed: single `main` branch, no `v2-archive` yet

---

## Metadata

**Confidence breakdown:**
- Git archive strategy: HIGH — trivial git operation, confirmed single branch
- V3_MODE flag: HIGH — config.js structure fully inspected, addition is minimal
- MIDI clock GC gap: HIGH — architecture confirmed in code; GC pause characteristics from skill references
- BPM lerp gap: HIGH — confirmed absence of lerp in getActiveBpm(); fix pattern is standard
- MIDI burst gap: HIGH — confirmed absence of note flush in processCue('silence'); sendMIDIAllNotesOff() already exists

**Research date:** 2026-03-27
**Valid until:** 2026-06-01 (stable codebase, no external dependencies)
