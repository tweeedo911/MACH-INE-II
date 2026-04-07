# Domain Pitfalls — MACH:INE II v3

**Domain:** Generative live performance system — browser-based, MIDI out, human performer
**Researched:** 2026-03-27
**Confidence:** HIGH (primary source: deep codebase audit of v2.9 + confirmed runtime bugs)

---

## Critical Pitfalls

Mistakes that cause rewrites, crashes mid-performance, or musical collapse.

---

### Pitfall 1: Main-Thread GC Pauses Drain the MIDI Lookahead

**What goes wrong:**
`updateMIDIClock()` — the function that schedules MIDI clock ticks with 24ppqn precision — is called inside `midiWorker.onmessage`, which runs on the **main thread**, not inside the Worker. The Web Worker fires every ~2ms and sends a message, but the message handler executes on the main JS thread. If the main thread stalls for longer than the 50ms lookahead window (GC pause, layout, BroadcastChannel canvas copy to projector), the clock scheduling pipeline gaps. Ableton's sync PLL slips; the performer hears a timing stutter.

**Why it happens:**
The Worker was added to survive tab backgrounding (Chrome throttles `setTimeout` to 1Hz for background tabs). But the actual clock scheduling was never moved *into* the Worker — only the tick impulse was. The lookahead buffer is 50ms. At 120 BPM with 24ppqn, each tick is ~20.8ms. A single 60ms GC pause at peak density (4000 entities, 80,000 spatial checks) drains the buffer entirely.

**Consequences:**
- Audible tempo stutter during dense passages
- Ableton PLL lock lost — performer loses rhythmic reference
- After a stutter, the clock resumes but the performer is already off-grid

**Prevention:**
Move `updateMIDIClock()` and the 24ppqn scheduling logic entirely inside `midi-clock.worker.js`. Pass `targetBpm` to the Worker via `postMessage` when BPM changes. The main thread then has zero responsibility for clock accuracy. This is the architecturally correct separation.

**Warning signs:**
- HUD shows `>16ms` frame time during SOLCO or MECCANICA (dense patterns)
- Performance profiler shows GC events > 30ms during `renderFrame()`
- Ableton's MIDI clock indicator stutters during high visual density

**Phase:** Address in the infrastructure phase before any compositional work.

---

### Pitfall 2: Harmonic Collision Between Simultaneously Active Layers

**What goes wrong:**
Each engine was composed in isolation against its own modal center. The full chromatic spread of engine roots spans: D Dorian (TERRENO), A Dorian (MECCANICA), A Lydian (DERIVA), D Phrygian (VORTICE), D Lydian (CRISTALLO), Bb/A Phrygian (ABISSO), G Dorian (SOLCO). When two engines with unrelated centers are active simultaneously — e.g. VORTICE (D Phrygian, tritone-heavy) layered with MECCANICA (A Dorian) — unintentional dissonances emerge that are not compositionally motivated.

In the new layered architecture (macro-composer + 3-4 simultaneous layers), this problem is **structurally guaranteed to occur** unless harmonic compatibility is explicitly enforced at the layer design level. The previous system's sequential structure (one engine at a time, with 4-minute overlaps) masked this — the overlap was brief. Simultaneous layering will expose it at full duration.

**Why it happens:**
No inter-engine harmonic compatibility matrix exists. Each engine's scale arrays are defined independently. The `isChannelAllowed()` gate prevents channel collision but does nothing for pitch collision.

**Consequences:**
- Unintentional dissonance that sounds like a mistake, not a composition
- The performer on modular/hardware synth cannot resolve the dissonance because it is coming from two separate MIDI channels
- Musical coherence collapses within minutes of layering

**Prevention:**
Before implementing the layered compositor, define a **harmonic compatibility matrix** for all layer combinations. All layers in a given section should share a common root (A or D as proposed in ROADMAP-v2.9) or have explicitly defined tension relationships. The macro-composer must enforce this: it chooses which layers are active and must only activate harmonically compatible combinations. Chord voicings in the CHORD layer must use notes available in the intersection of active layer scales.

**Warning signs:**
- During testing: layering VORTICE + MECCANICA produces notes a tritone apart in the same register
- Performer reports "it sounds wrong" rather than "it sounds tense"
- MIDI monitor shows simultaneous note-ons on CH4 (CHORDS) and CH3 (BASS) forming diminished intervals not in either engine's scale

**Phase:** Must be resolved in macro-composer design before any layer implementation.

---

### Pitfall 3: Narrative Arc Collapse Through Entropic Drift

**What goes wrong:**
A generative system with no macro-level entropy control will converge toward a "statistical center" — a middle-intensity state where all parameters oscillate around their mean values. After ~20 minutes, the system settles into a persistent state that is neither building nor dissolving. The performer and audience lose the sense of narrative direction. This was partially observed in v2 (the minute-24+ collapse symptoms, though those had additional technical causes).

In a layered system this is worse: individual layers each have their own phase arc (germoglio → dissoluzione), but if the macro-composer does not coordinate *when* layers peak and dissolve, they can cancel each other out — one building while another dissolves, creating a perpetual medium intensity.

**Why it happens:**
Local arc logic (per-engine phase machines) is not globally coordinated. Each engine's arc is driven by `phaseTime` and internal duration thresholds. Nothing ensures that the concert as a whole follows a directed trajectory over 60 minutes.

**Consequences:**
- Monotonous texture after minute 20
- No climax that is clearly "the" climax
- Dissolution at the end is indistinguishable from the middle

**Prevention:**
The macro-composer must own a **global arc parameter** (0.0 → 1.0 over 60 minutes, pre-composed, not reactive) that governs: maximum number of active layers, total velocity budget, harmonic tension level, rhythmic density ceiling. Individual layers must read from this global arc, not just their internal phase clock. The global arc is a composition decision, not an emergent property.

Specific checkpoints to prevent flatness:
- At ~30 min (arc=0.5): a mandatory forced minimum — at least one layer must be in `rottura` or `densita`
- At ~45 min (arc=0.75): global velocity ceiling lifted to maximum; all possible layers active
- At ~50 min (arc=0.83): mandatory dissolve begins — layers deactivate in sequence, never re-activate
- Final 5 minutes: only 1-2 layers remain; textures only, no kick, no bass

**Warning signs:**
- Playing back a 60-minute recording and the waveform shows uniform RMS envelope after minute 25
- The MIDI velocity histogram shows a gaussian distribution centered at 60 rather than a bimodal distribution (quiet phases + loud phases)
- The performer stops reacting dynamically because there is nothing to react to

**Phase:** Macro-composer architecture must be designed with the global arc before any layer code is written.

---

### Pitfall 4: BPM Snap Breaks the Performer's Internal Clock

**What goes wrong:**
`getActiveBpm()` in `main.js` selects the BPM of the engine with the highest presence multiplier. When two engines crossfade and control passes from one to the other (PM crosses the 0.5 threshold), the MIDI clock BPM snaps instantly on the next worker tick. At the handoff from MECCANICA (92 BPM) to SOLCO (120 BPM), Ableton receives a clock rate jump of ~30%. The PLL lock behavior in Ableton (and in hardware synths listening to the clock) introduces a transient tempo instability of 2-6 beats.

In the new layered architecture with rhythm as an arc (arhythmic → pulse → groove → climax → dissolution), tempo is a continuous compositional parameter, not a fixed per-engine attribute. Snap BPM changes are architecturally incompatible with this design.

**Why it happens:**
The `getActiveBpm()` function uses a threshold comparison rather than an interpolation. The BPM is sent via MIDI clock pulses — there is no "BPM message" in MIDI, the rate of 24ppqn pulses encodes the tempo. Changing the pulse rate abruptly is the only mechanism currently available.

**Consequences:**
- Audible stutter and tempo confusion at every engine transition
- Hardware synths with internal arpeggiators or sequencers lose sync
- The performer cannot anticipate when BPM will change — an unplayable surprise every transition

**Prevention:**
Implement `targetBpm` and `clockBpm` as separate variables in `midi.js`. In the Worker (after the architectural fix in Pitfall 1), lerp `clockBpm` toward `targetBpm` at a rate of N BPM per beat — never jumping more than ±2 BPM per 24ppqn pulse cycle. A 92→120 transition at 2 BPM/beat takes 14 beats (~9 seconds at 92 BPM). This is musically intentional and sounds like a deliberate accelerando.

Alternatively, in the layered architecture, make BPM a function of the global arc alone (not per-engine), eliminating per-layer BPM entirely. All layers share a single global tempo that the macro-composer evolves over 60 minutes.

**Warning signs:**
- Ableton's tempo indicator jumps more than 5 BPM in a single frame
- Hardware synths with external clock mode exhibit arpeggiation stutter at transitions
- Performer feedback: "the tempo jumped"

**Phase:** Must be fixed in infrastructure before first full-length performance test.

---

### Pitfall 5: `resetAllMultipliers()` MIDI Burst During Layer Activation

**What goes wrong:**
`resetAllMultipliers()` in `presence-multiplier.js` sets all 7 engine presence multipliers to `1.0` (not `0.0`). In the sequential v2 architecture, the `main.js:79` workaround documented this risk. In the new layered architecture — where the macro-composer will frequently activate and deactivate layers — any code path that calls `resetAllMultipliers()` at transition points will trigger a frame where all active layers fire at full velocity simultaneously across all 8 MIDI channels.

This produces a dense MIDI note burst that: (a) sounds like an unintentional crash, (b) may send a velocity-127 note on CH0 (PULSE/kick) simultaneously with CH2 (DRONE) and CH4 (CHORDS), and (c) can clip the audio output chain if the performer's mixer is near unity gain.

**Why it happens:**
The reset function was designed for "start fresh" initialization, not for live transitions. In multi-layer scenarios, the number of code paths that may invoke it increases significantly.

**Prevention:**
Add `resetAllMultipliersSilent()` that sets all values to `0.0`. Audit every call site of `resetAllMultipliers()` in the new codebase and replace with the silent variant. The macro-composer must use `setPresenceMultiplier(engine, 0.0)` via timed fade (never instant) for all layer deactivations.

Never call `resetAllMultipliers()` during an active performance — only during initialization before the concert clock starts.

**Warning signs:**
- HUD shows all 7 engines at pm=1.0 for a single frame
- MIDI monitor shows simultaneous Note On across all 8 channels within a 2ms window
- Performer reports a "pop" or "crash" sound at transition points

**Phase:** Fix before implementing the macro-composer transition logic.

---

## Moderate Pitfalls

---

### Pitfall 6: Tab Backgrounding Kills the Visual Loop (But Not the Clock)

**What goes wrong:**
Chrome throttles `requestAnimationFrame` to 1 fps (or pauses it entirely) when the tab loses focus. The MIDI clock Worker is immune (it runs in a separate thread with its own `setTimeout`), but `render.js`, `updateDirector()`, `updateGenerations()`, and `updateAudio()` all run in the rAF loop. If the performer switches to Ableton or another application during the performance, the visual system freezes and all rAF-driven state updates stop — including entity aging, onset wave decay, and midiTrail alpha decay.

When focus returns, a single rAF frame fires with a large `dt` value. Entities that should have aged out are still alive at their last state. `onsetWaves` may be at radius 0 but not yet cleaned up. `midiTrail` shapes pile up.

**Why it happens:**
Chrome's efficiency throttle applies to `requestAnimationFrame` callbacks in background tabs. The Web Worker tick continues unthrottled. The two systems have diverged clocks.

**Prevention:**
Use the Page Visibility API (`document.addEventListener('visibilitychange', ...)`) to detect focus loss. On visibility hidden: clamp the maximum `dt` value to 100ms on the next rAF frame when focus returns. This prevents "time jump" where accumulated dt causes mass entity death or wave explosion in one frame. The MIDI clock does not need this guard — it is already Worker-isolated.

The WakeLock (already implemented via `WakeLockManager`) prevents screen sleep but does **not** prevent tab backgrounding.

**Warning signs:**
- Performer uses keyboard shortcut that changes focus to another application
- Visual system freezes while MIDI clock keeps running
- On return: visual flash of all entities dying simultaneously

**Phase:** Add dt clamp in the main loop guard (1-2 lines in `main.js`).

---

### Pitfall 7: `recoverState()` Applies Stale Schema After Code Changes

**What goes wrong:**
`recoverState()` in `sequencer.js` reads `sessionStorage` and applies saved state without schema validation. In the v2→v3 migration, engine names change (7 sequential engines become N layers with different names/roles). If the browser has a v2 session saved (engine names `terreno`, `meccanica`, etc.) and the v3 code expects different layer names, `recoverState()` will silently apply mismatched presence values to wrong engines. The result is a concert that starts in a corrupted state.

**Prevention:**
Add a `schemaVersion` field to the saved state object. On load, compare `savedState.schemaVersion` to a constant in `sequencer.js`. Reject (don't apply) any state with a mismatched version. This is a 3-line fix but must be done **before** the first v3 test run in a browser that previously ran v2.

Also clear `sessionStorage` manually after any major structural refactor: in the browser console, `sessionStorage.clear()`, or add a `?reset` URL param that triggers this on boot.

**Warning signs:**
- Concert starts with unexpected engines already active
- Presence multipliers show non-zero values for engines that should start silent
- HUD shows wrong act name at t=0

**Phase:** Add schema version check in the migration phase (before first v3 boot).

---

### Pitfall 8: Note Density Starvation on the Human Performer's Instrument

**What goes wrong:**
A layered system producing 3-4 simultaneous MIDI streams across 8 channels will likely send more notes per second than a human performer can interpret. On modular synth, incoming polyphonic MIDI often routes to a single voice (v/oct + gate). On monophonic hardware synths, only the last received note matters. On VST with polyphony, all notes play but the result may be harmonically incoherent to the ear even if technically correct.

The generative composer's natural tendency is to fill space. Without explicit per-channel density budgets, layers will converge toward maximum density at peak arc — sending 10-20 notes/second on multiple channels simultaneously. The performer cannot physically react to this; they become a passive observer rather than an interpreter.

**Prevention:**
Each layer must declare an explicit `maxNotesPerBar` and `maxSimultaneousNotes` constraint per channel role. The constraint must be tighter for melodic channels (CH5=VOICE, CH6=LEAD: max 1 note at a time) than for textural channels (CH1=GRAIN: can be dense). The macro-composer must enforce a global simultaneity ceiling (e.g. no more than 8 notes playing across all channels at any one time).

The MIDI channel role architecture already exists and is the right abstraction — use it to impose density budgets per role, not just per engine.

**Warning signs:**
- MIDI monitor shows > 5 simultaneous Note On messages within a 10ms window
- Performer stops playing their instrument and just watches
- Performer feedback: "I don't know what to play"

**Phase:** Define density budgets in the layer specification before implementation.

---

### Pitfall 9: Register Collision Makes the Performer Inaudible

**What goes wrong:**
If the generative system produces bass notes in the 36-60 MIDI range AND the performer plays their modular synth in a similar register, the performer's instrument is masked. In live performance, the AI composer must leave "space" in the register where the performer intends to play. Without register allocation by instrument role, layers will naturally spread across the full 36-96 MIDI range, filling every register.

The v2 engines have `gravitationalCenter` values (e.g. TERRENO=55=G3, SOLCO=55=G3) that cluster in the mid register (G3-G4). In a layered system, all layers active simultaneously will stack in the same register range.

**Prevention:**
Define a **register map** by MIDI channel role that respects the performer's instrument:
- CH0 PULSE (kick): 36-48 (below the mix, not in performer register)
- CH2 DRONE: 36-52 (low, sustained, foundational)
- CH3 BASS: 40-56 (low-mid)
- CH4 CHORDS: 52-72 (mid) — leave 60-72 open during performer sections
- CH5 VOICE: 60-80 (performer register — reduce density here when performer is playing)
- CH6 LEAD: 72-88 (high — above performer typical range on modular)

The macro-composer should reduce density in the performer's register during sections where the performer's MIDI interpretation is the musical focus.

**Warning signs:**
- All simultaneous Note Ons are clustered in the 52-72 range
- Performer's synth is inaudible in the mix at the same settings
- Performer feedback: "I can't hear myself"

**Phase:** Address in layer specification and register allocation design.

---

### Pitfall 10: Cue Array Logical Errors (Beyond Chronological Order)

**What goes wrong:**
The `CUES.sort()` guard prevents the minute-24 collapse from cue ordering. But it does not catch logical errors: a `fade_to` targeting an engine that was never `activate`d (engine's PM stays 0.0 — fade goes to 0.0 from 0.0, no sound), a `layer` cue that references an engine name with a typo (silent failure), or a `firma.densityCap` set to a value that conflicts with the active visual scene's density parameters.

In v3, the cue array will reference layer names instead of engine names. During migration, if old engine names persist in some cues while new layer names are used in others, the system runs silently with half the intended layers never activated.

**Prevention:**
Add a cue validation pass at boot (before the concert starts) that:
1. Checks every `fade_to` and `layer` target name against the set of known layer names
2. Verifies that every `fade_to` has a prior `activate` or `layer` for that name
3. Checks that the ACTS array has no gaps (the v2 120-second gap between Act III and Act IV)
4. Logs all violations clearly to the console before the first note plays

This validation costs zero performance (runs once at init) and catches configuration errors before they manifest as missing layers during the concert.

**Warning signs:**
- A cue fires but produces no MIDI output and no visual change
- HUD shows an unexpected act name during a gap period
- Performance sounds like it is missing a layer that should have entered

**Phase:** Implement in the sequencer module during migration.

---

### Pitfall 11: Sequential-to-Layered Migration Breaks the Director's Engine Identity

**What goes wrong:**
`director.js` contains `ENGINE_PREFS`, `ENGINE_PHASE_VISUALS`, `ENGINE_COMPOSITIONS`, `ENGINE_INVERSIONS` — all keyed by the 7 engine names (`terreno`, `meccanica`, etc.). The visual system derives its aesthetic parameters (scene, palette, camera, render overrides) from the **engine name** currently reported by `setEngine()`. In a layered architecture, multiple engines/layers report simultaneously. The director must merge or prioritize these.

If the new layer names do not match the existing keys in these maps, the director falls through to a default state. The visual system loses its ability to distinguish layers — all layers look the same visually, defeating the purpose of the layered architecture's "visual signature per layer" requirement.

**Why it happens:**
`director.js` is a 1145-line protected file. Its engine-identity maps were designed for the sequential model. The layered model requires a different identity resolution strategy (priority, blend, or per-layer override).

**Prevention:**
Before migrating `director.js`:
1. Document the exact interface between layer identity and visual parameters
2. Decide on the identity resolution strategy: does the visual system follow the highest-PM layer? Blend all active layers? Use a macro-composer directive?
3. Keep the existing engine names as valid layer names where musically appropriate — TERRENO as the rhythm layer, CRISTALLO as the texture layer — to avoid a full rekey of the director maps
4. Add an integration test (even a manual one) that verifies visual parameters change correctly when layer identity changes

**Warning signs:**
- All active layers produce identical visual output (same scene, same palette)
- Director HUD shows "unknown engine" or falls through to default scene
- Visual arc does not respond to layer transitions

**Phase:** Address in the director refactor phase, after layer architecture is defined.

---

## Minor Pitfalls

---

### Pitfall 12: `Math.random()` Non-Reproducibility Makes Debugging Impossible

**What goes wrong:**
169 `Math.random()` calls per frame (confirmed in CONCERNS.md) means that any musical or visual bug is non-reproducible. When a performer reports "it sounded wrong at minute 35," there is no way to replay that exact sequence. In a new layered system where the macro-composer makes probabilistic decisions about which layers to activate and when, this problem scales — the entire concert arc becomes non-reproducible.

**Prevention:**
Replace hot-path `Math.random()` calls in composition engines with a seeded LCG or `SeededRNG` (already available in `perf-utils.js` but not used in production). Log the seed at concert start. Given a seed, the entire 60-minute concert should be reproducible. This is essential for debugging and for recording reproducible "album takes."

**Warning signs:**
- A bug cannot be reproduced across two consecutive runs with the same input
- "It sounded perfect yesterday" — no way to verify or reproduce

**Phase:** Implement in the infrastructure phase before compositional testing.

---

### Pitfall 13: `fpsAutoLimit` Dead Config Creates Timing Bugs on High-Refresh Displays

**What goes wrong:**
`CFG.fpsAutoLimit = 30` is defined but never enforced. On a 120Hz ProMotion display (MacBook Pro), the rAF loop runs at 120fps. All per-frame time deltas (`dt`) are halved relative to a 60fps assumption. Phase timers and presence lerp rates that were tuned at 60fps now advance twice as fast — a phase that should last 60 seconds lasts 30 seconds. Entity lifetimes halve. The entire concert arc compresses.

**Prevention:**
Implement the frame-skip guard in `main.js` using `CFG.fpsAutoLimit`. The standard pattern: track `lastFrameTime`, skip `renderFrame()` if `now - lastFrameTime < 1000/fpsAutoLimit`. Or remove the config key and document "60Hz display required for performance."

**Warning signs:**
- Concert acts end earlier than their defined durations
- Visual entities die very quickly
- HUD shows 120fps on a ProMotion display

**Phase:** Fix in infrastructure before calibration runs.

---

### Pitfall 14: Projector BroadcastChannel Canvas Copy Adds Main-Thread GC Pressure

**What goes wrong:**
The projector sync via `BroadcastChannel` copies canvas `ImageData` or calls `drawImage` from the main canvas to the projector window every rAF frame. `ImageData` object allocation (a typed array of `width * height * 4` bytes = 8.3MB at 1920×1080) every frame at 60fps creates significant GC pressure. This directly contributes to the main-thread stalls that drain the MIDI lookahead (Pitfall 1).

**Prevention:**
If canvas-level sync is used, pre-allocate a single `ImageData` buffer and reuse it. Better: use `OffscreenCanvas` with `transferToImageBitmap()` for zero-copy transfer. The `ImageBitmap` approach sends a transferable object that does not allocate a new backing buffer each frame.

**Warning signs:**
- `performance.measure()` shows >5ms for projector sync each frame
- Disabling projector output (`P` key to close projector window) reduces frame time by >3ms
- Chrome DevTools Memory panel shows large short-lived ArrayBuffer allocations

**Phase:** Optimize before using the projector in live performance context.

---

### Pitfall 15: Voice Leading Constraint Only Limits Leaps, Not Range Drift

**What goes wrong:**
`CFG.COMPOSER_N.voiceLeadingMax` limits the maximum semitone step between consecutive melody notes. This prevents large leaps but does not prevent slow register drift. A voice leading algorithm with `voiceLeadingMax = 2` can drift from MIDI note 60 (C4) to 84 (C6) in 12 steps — each step "legal" but the cumulative drift takes the melody entirely out of the performer's register. Over 60 minutes of generative melody, unconstrained drift is guaranteed.

**Prevention:**
Add a `voiceGravity` pull: each frame, the melody pitch drifts slightly toward its `gravitationalCenter` (already defined in config). The pull strength is proportional to the distance from center: `pullStrength = (currentNote - center) * k`. This creates a natural mean-reversion that keeps the melody register-stable over long durations.

**Warning signs:**
- After 20 minutes, melody notes are consistently in the 80-88 range
- Performer's notation shows all recent MIDI pitches are above a certain threshold
- The MIDI monitor shows note numbers monotonically drifting over time

**Phase:** Implement in any melody/voice layer during the composition phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Infrastructure / clock | Main-thread clock scheduling (Pitfall 1) | Move `updateMIDIClock()` into Worker before any other work |
| Macro-composer design | Narrative arc collapse (Pitfall 3) | Design global arc parameter before layer code |
| Macro-composer design | Harmonic collision (Pitfall 2) | Define compatibility matrix before first layer pair |
| Layer specification | Note density starvation (Pitfall 8) | Define `maxNotesPerBar` per channel role in spec |
| Layer specification | Register collision (Pitfall 9) | Define register map per channel role in spec |
| v2→v3 migration | Stale sessionStorage schema (Pitfall 7) | Add schemaVersion check before first v3 boot |
| v2→v3 migration | Director engine identity broken (Pitfall 11) | Resolve identity strategy before touching `director.js` |
| v2→v3 migration | Cue array logical errors (Pitfall 10) | Add boot-time cue validation |
| Sequencer / transitions | BPM snap (Pitfall 4) | Implement `targetBpm` lerp before tempo range testing |
| Sequencer / transitions | `resetAllMultipliers()` burst (Pitfall 5) | Audit all call sites; add silent reset variant |
| Visual system | Tab backgrounding (Pitfall 6) | Add visibility change handler + dt clamp |
| Testing calibration | High-refresh display timing (Pitfall 13) | Enforce fpsAutoLimit before duration calibration |
| Long-duration testing | `Math.random()` reproducibility (Pitfall 12) | Seed RNG before compositional debugging sessions |
| Projector use | Canvas copy GC pressure (Pitfall 14) | Measure projector overhead; optimize if >3ms/frame |
| Melody/voice layers | Voice register drift (Pitfall 15) | Add gravitational pull to voice generation |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Browser timing / GC | HIGH | Directly evidenced by CONCERNS.md audit; known Chrome behavior |
| Harmonic collision | HIGH | Documented in CONCERNS.md, ROADMAP-v2.9 — confirmed unfixed |
| Narrative arc | HIGH | v2 minute-24 collapse is direct evidence; root causes documented |
| BPM transition | HIGH | Confirmed in CONCERNS.md `getActiveBpm()` analysis |
| Migration pitfalls | HIGH | Architecture audit reveals exact coupling points |
| Note density / register | MEDIUM | Based on MIDI channel role design + performer instrument knowledge |
| Voice leading drift | MEDIUM | Standard generative music problem; config values suggest awareness |

---

*Sources: MACH:INE II/CONCERNS.md (codebase audit 2026-03-27), ARCHITECTURE.md, PROJECT.md, CONVENTIONS.md, INTEGRATIONS.md — all verified against actual source file line numbers.*
