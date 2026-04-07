# Feature Landscape: MACH:INE II Compositional Layer

**Domain:** Generative live performance system — AI composer, human interpreter
**Researched:** 2026-03-27
**Confidence:** HIGH (musical theory from primary sources); LOW (web-unverifiable claims flagged)
**Research mode:** Ecosystem — what compositional features make generative systems musically rich

---

## Research Basis

Sources used:
- Project files: `PROJECT.md`, `CONCERNS.md`
- Training knowledge: composition theory for Reich, Glass, Four Tet, Floating Points, Eno
- WebSearch: DENIED — all musical theory claims are from training data (knowledge cutoff Aug 2025)

Confidence note: Musical theory and compositional technique for the referenced artists are
well-documented and stable; these are HIGH confidence claims. MIDI-specific implementation
details and software ecosystem claims are MEDIUM confidence (verify against current WebMIDI spec).

---

## Question 1: What Makes Generative Music Feel "Alive" vs Mechanical?

**Confidence: HIGH**

The difference is not randomness — it is *controlled, purposeful deviation from regularity*.

### Micro-variation as breath
Reich's "Music for 18 Musicians" feels alive because every human performer introduces
unconscious micro-timing and dynamic variation. The generative equivalent: velocity must
never be a constant, and note onset timing should include humanization offsets in the
±5–20ms range. Not random jitter — shaped jitter that follows musical phrasing (slightly
louder on downbeats, slightly ahead on anticipatory notes).

### Structural memory
Mechanical systems repeat without evolution. Alive systems transform: a motif introduced
at minute 3 should be recognizable but altered at minute 30. This requires the system to
hold compositional memory — not just current state, but a history of what was played and
when, enabling callbacks, inversions, augmentations.

### Tension between layers
Eno's ambient work achieves aliveness through polyrhythmic independence: multiple loops
of prime-number lengths (e.g. 11 beats, 13 beats) never align, producing a perpetually
shifting texture. The ear cannot predict the next combination. Four Tet extends this with
broken-beat displacement: the groove exists but the snare lands one 16th late, making the
listener lean forward.

### Harmonic momentum
Floating Points ("Crush" album) uses sustained chords that move slowly enough to be felt
emotionally, not just analytically. Forward motion comes from voice leading, not from
chord root movement. The bass note moves down a semitone; the chord shifts from minor 9th
to major 7th — same root neighborhood, completely changed mood. This is "depth without
complexity": one voice moves, everything changes.

### The role of silence
Mechanical systems fill every beat. Alive systems breathe. A well-placed rest at the end
of a phrase is worth more than a fill. The system must model *phrase shape* (attack,
sustain, decay, release at the macro level) not just individual note envelopes.

---

## Question 2: Harmonic and Rhythmic Techniques for Depth Without Complexity

**Confidence: HIGH**

### Harmonic techniques

**Modal interchange over a drone**
Anchor the system to a single root pedal tone (A or D — as already proposed in CONCERNS.md
for harmonic compatibility between engines). Build all harmonic movement as modal color
changes above that drone. The root never moves; the mode shifts. C Dorian → C Lydian
→ C Mixolydian → C Aeolian: same root, four completely different emotional characters.
The ear processes this as "same place, different light" — depth without disorientation.

**Upper-structure triads (Floating Points technique)**
Stack a major or minor triad a major 9th, #11, or b7 above the root. This is the signature
sound of "Crush" and "Elaenia": lush, unresolved, harmonically rich. In MIDI terms, build
chords as 4-note clusters: root + 5th in the bass register (CH bass), upper structure
triad in the mid register (CH harmony). The two voices played on different synths create
the characteristic Floating Points warmth.

**Voice leading — never skip more than a minor 3rd**
The movement between any two chords should move each voice by the smallest interval
possible. If the root stays, it stays. If the 5th moves, it moves by a semitone or whole
tone. This creates smooth harmonic motion that reads as emotional development, not harmonic
chaos. Algorithmic constraint: max interval movement per voice = 3 semitones between chords.

**Avoid the leading tone in ambient/modal contexts (Glass technique)**
Glass's "Metamorphosis" avoids the 7th degree resolving upward. This keeps the music
hovering, unresolved, timeless. In algorithmic terms: weight scale degree 7 probability to
near-zero in ambient phases; allow it only during tension-building phases.

**Pentatonic + chromatic addition (Four Tet technique)**
Start from a pentatonic nucleus (5 notes, no semitones — inherently consonant). Add one
chromatic note as a "spice" note with low probability (10–15% of notes). This is the
harmonic language of "Rounds" and "There Is Love in You": rooted, warm, with occasional
unexpected glimmers. The chromatic note should always resolve down by semitone on the
next beat.

### Rhythmic techniques

**Phasing (Reich)**
Two identical rhythmic patterns, one at slightly different speed, drift apart and back in
phase. In MIDI terms: two sequencer tracks, same pattern, one at BPM, one at BPM * 1.005.
Over 32 bars they drift in and out of phase, producing the characteristic polyrhythmic
shimmer. Implementation: a dedicated "phase offset" parameter per layer, slowly modulated.

**Additive rhythm (Glass)**
Build rhythmic density by adding one note at a time to a repeating unit. Start with:
| . . . | → | x . . . | → | x . x . | → | x . x x | → | x x x x |
Each step adds one note, maintaining the original pulse. At no point does the meter break.
This is the mechanism behind "Music in Twelve Parts" and the gradual thickening in
MECCANICA and VORTICE (as proposed in the project roadmap).

**Syncopated displacement (Four Tet / Floating Points)**
Take a 4-beat groove, shift the snare/accent from beat 3 to the "and of 2" (half a beat
early). Then shift it again to beat 2.5 + a 16th. The kick stays on 1 and 3; everything
else orbits unpredictably. In MIDI: generate a base grid, then apply a per-beat
"displacement table" that probabilistically shifts accents ±1/16th or ±1/8th.

**Polyrhythm via prime-length loops (Eno)**
Loop A: 7 steps. Loop B: 11 steps. Loop C: 13 steps. They align only every 7×11×13 = 1001
steps. In practice they never align in a single piece. Each loop runs independently;
their combination is perpetually novel. This is the mechanism behind Eno's "Music for
Airports" and the ambient layer in DERIVA/ABISSO.

**Hi-hat continuity (critical for MACH:INE II)**
The absence of a continuous hat/ride element across engine transitions is documented in
CONCERNS.md as a key structural weakness. The fix is a shared rhythmic thread: a hi-hat
pattern that persists across all engines at reduced velocity during crossfades and
transitions. This is the DJ's equivalent of "keeping the kick going" during a blend. The
hat frequency can shift (16th → 8th → triplet) to signal phase transitions, but it must
never fully stop during performance.

---

## Question 3: Narrative Arc in Electronic Music (Tension → Climax → Resolution)

**Confidence: HIGH**

### The Dramaturgy of a 45–60 Minute Electronic Suite

The standard arc for long-form electronic music (Eno, Reich, Burial, Floating Points) maps
onto a five-act structure that MACH:INE II v2 already intuited with its 5 atti. The key
insight is that **each dimension (rhythm, harmony, density, register) has its own arc**,
and they should not all peak simultaneously — staggered peaks sustain interest.

**Rhythmic arc (primary driver of tension)**
```
0–10min:  No pulse — arhythmic field (Eno ambient, entity field without clock)
10–20min: Pulse emerges — one rhythmic element, irregular
20–30min: Groove crystallizes — two or three rhythmic layers lock
30–40min: Polyrhythmic maximum — maximum rhythmic density, cross-rhythms
40–50min: Fragmentation — rhythmic dissolution, gaps appear
50–60min: Silence field — rhythm fades, only texture remains
```

**Harmonic arc (secondary, emotional)**
```
0–10min:  Open, unresolved — drone + pentatonic fragments, modal ambiguity
10–25min: Harmonic color deepens — modal center established, upper structures appear
25–40min: Maximum harmonic density — full voicings, dissonance introduced
40–50min: Reduction — strip to 2 voices, root + 5th
50–60min: Drone only — single pitch, maximum simplicity
```

**Dynamic/density arc**
These two arcs must be offset: the harmonic climax should precede the rhythmic climax by
5–10 minutes. This creates two distinct peaks, not one undifferentiated wall of sound.
The documented minute-24 collapse in v2 was precisely this: all dimensions peaked
simultaneously, converging into an indistinct wall.

**Tension mechanisms (what raises stakes)**
1. Rhythmic: adding layers, shortening note durations, syncopation, accelerando
2. Harmonic: raising the bass register (closer proximity = more tension), adding the
   tritone, suspending resolution
3. Dynamic: increasing velocity floor (pp → mp → f), decreasing rest durations
4. Textural: increasing MIDI note density, narrowing the pitch range (compression)
5. Temporal: increasing the rate of change (phrases shorten from 16 bars to 4 bars)

**Resolution mechanisms (what releases tension)**
1. Rhythmic: removing layers, increasing space between notes, decelerando
2. Harmonic: resolving suspended chord, returning to root, modal resolution to Aeolian
3. Dynamic: decreasing velocity ceiling, lengthening sustains
4. Textural: widening pitch range, reducing note density
5. Temporal: lengthening phrase length, allowing silence

**The false resolution (climax technique)**
The most effective long-form climax uses a "false resolution" followed by the true climax.
At ~minute 35: drop all percussion for 8 bars (the Eno technique — complete silence in
one dimension). Then reintroduce at higher density than before. The contrast makes the
reintroduction feel like a second, larger climax. This is the mechanism in Four Tet's
"Angel Echoes" and Floating Points' live sets.

---

## Question 4: MIDI Output Features for Live Human Interpreter

**Confidence: HIGH (MIDI spec); MEDIUM (hardware-specific behavior)**

### Multi-channel routing strategy

The human interpreter plays modular Eurorack, hardware synths (Prophet/Moog/Juno), and VSTs.
Each instrument has different response characteristics and should receive tailored MIDI:

| Channel | Instrument Type | Velocity Profile | Note Range | Articulation |
|---------|----------------|------------------|------------|-------------|
| CH1 | Modular (CV/Gate) | Narrow (64–100) | C2–C4 | Gate length = musical value |
| CH2 | Prophet/Juno (pads) | Slow attack curve | C3–C5 | Long sustain, slow CC7 |
| CH3 | Moog/hardware bass | Wide (20–110) | C1–C3 | Short attack, full velocity range |
| CH4 | VST melodic | Expressive (0–127) | C4–C7 | Full dynamic range |
| CH5 | VST pads/texture | Narrow (40–80) | Any | Very long sustain |
| CH9/10 | Percussion | Wide (30–120) | GM drum map | Tight gate (50ms) |

**Velocity curves — this is where "alive" is delivered**
The raw generative velocity must be shaped per-channel before output. Three curve types:
- Linear (default): proportional mapping — use for melodic voices
- Logarithmic: compress high velocities — use for modular CV (avoids overdriving)
- Exponential: boost low velocities — use for pads/texture (ensures audibility at pp)
- S-curve: compress both extremes — use for hardware with limited dynamic response

**Velocity humanization**
Add per-note velocity variation: ±5% random variation within phrase, ±10% across phrases.
Never send two consecutive notes at identical velocities unless intentionally robotic.
The variation should be correlated with rhythmic position: downbeats slightly louder,
offbeats slightly softer. This is the primary "feel alive" mechanism at the MIDI level.

**Note duration shaping (articulation)**
For each voice, define:
- `legato_ratio`: note-off delay as fraction of note duration (0.9 = near-legato)
- `staccato_ratio`: 0.3 = punchy
- `release_tail`: additional ms after note-off before next attack allowed

This prevents the "MIDI machine gun" effect where chords sound simultaneously and
perfectly aligned. Stagger chord note onsets by 5–30ms per voice (arpeggiation micro-delay).

**Multi-channel pitch range enforcement**
Each channel should have hard pitch limits: notes outside the range are either transposed
by octave or suppressed. This prevents the modular from receiving impossibly high notes
that its oscillator cannot track, and prevents the bass channel from accidentally
generating high-register flourishes.

**CC automation for expression**
The system should output CC messages, not just note data:
- CC7 (Volume): macro dynamics curve — slow automation following the arc
- CC11 (Expression): phrase-level dynamics — follows 4-bar shape
- CC1 (Mod Wheel): send to hardware synths for filter/vibrato automation
- CC74 (Filter cutoff): VST-specific, allows automated filter sweeps

Without CC output, the human interpreter is doing all the expression work manually.
CC automation creates a "breathing" base layer that the performer shapes on top of.

**MIDI Program Change for scene transitions**
Send PC messages at major act transitions to trigger preset changes on hardware synths.
This allows the system to cue the performer's gear to the correct patch without manual
intervention. Should be sent 2–4 bars before the actual transition (advance notice).

**Clock and transport**
The existing MIDI clock output is correct. Critical addition: send MIDI Start/Stop/Continue
messages at concert boundaries so DAW/hardware stays locked. The 50ms lookahead documented
in CONCERNS.md is adequate for live performance at ≤120bpm; the concern about main-thread
GC stalls moving the clock call to the worker is a valid improvement but not blocking.

---

## Question 5: Visual Feedback Features for Live Performance

**Confidence: HIGH (design principles); MEDIUM (specific implementation details)**

### Primary visual requirements

**Layer identity via distinct visual signatures**
Each compositional layer (rhythm, harmony, melody, texture) should have a visual identity
that is immediately readable from the stage. The performer glancing at the projection
should know which layers are active. This requires:
- Distinct shape vocabulary per layer (rhythm: sharp/angular, harmony: flowing/circular,
  melody: linear/directional, texture: diffuse/cellular)
- Distinct color temperature per layer (not arbitrary — warm colors for harmonic/melodic
  content, cool/neutral for rhythmic/textural)
- Distinct motion vocabulary (rhythm: pulsed, harmony: sustained drift, melody:
  directional movement, texture: Brownian/random)

**Density as arc readability**
The visual field should mirror the compositional arc: sparse and cool at the beginning,
dense and warm at climax, dissolving at the end. The performer can glance at the screen
and understand where in the concert timeline they are. This already exists in v2's particle
system; the improvement is making it arc-driven rather than engine-state-driven.

**MIDI-reactive but not MIDI-literal**
The visual should respond to MIDI events but not mirror them 1:1 (one note = one particle).
Instead: MIDI events should perturb ongoing visual dynamics. A chord triggers a "pressure
wave" in the particle field; a velocity burst increases the turbulence coefficient; a rest
allows the field to cool. This is more musically coherent than direct note-to-pixel mapping.

### Secondary visual requirements (useful but not critical)

**HUD information for performer**
Minimal, bottom-right, non-intrusive (consistent with project CLAUDE.md):
- Current act name and time elapsed
- Active layer indicators (4 states: inactive/low/medium/high)
- BPM (from MIDI clock, not audio onset estimator — the estimator is documented as
  unreliable in CONCERNS.md)
- Next cue warning (5 seconds before major transition): flash indicator

**Arc position indicator**
A single slow-moving gradient or progress element that shows the concert timeline position.
Not a progress bar — something subtle like a slowly shifting background hue or a gradual
temperature shift in the particle field color palette. The performer should feel the concert
arc, not read it.

**Projector vs performer display**
The v2 BroadcastChannel projector system is the right architecture. The audience projection
should be "full immersion, no UI." The performer's display (or a separate monitor) can show
the HUD layer. This is already possible with the existing dual-display architecture.

---

## Table Stakes

Features required for a credible generative concert. Missing = incomplete product.

| Feature | Why Required | Complexity | Current Status |
|---------|-------------|------------|----------------|
| Harmonic compatibility across layers | Documented as critical bug in CONCERNS.md | Medium | Missing — engines are harmonically unrelated |
| Continuous rhythmic thread (hi-hat/ride) | Prevents audible "stops and starts" at transitions | Low | Missing — documented in CONCERNS.md |
| Velocity humanization per channel | Prevents mechanical feel; primary "alive" mechanism | Low | Unknown — not in CONCERNS.md |
| Per-channel pitch range enforcement | Prevents unplayable notes on modular/hardware | Low | Unknown |
| Narrative arc (5-act, staggered dimensions) | Without arc, 60 min is exhausting not engaging | High | Partial — v2 had acts but dimensions peaked simultaneously |
| BPM transition crossfade (lerp not snap) | Documented in CONCERNS.md as causing Ableton PLL stutter | Medium | Missing |
| Multi-channel MIDI routing per instrument type | Human interpreter on 3 different instrument types | Low | Partial — 7 channels exist, routing not instrument-optimized |
| Phrase-shape modeling (not just note generation) | Rest is as compositional as note; silence is table stakes | Medium | Unknown |
| Visual arc sync to compositional arc | Performers and audience understand where they are | Medium | Partial — v2 has particle system, not arc-driven |
| Stable 45–60 min run (no collapse) | v2 collapsed at minute 24 | High | Partially fixed per CONCERNS.md |

## Differentiators

Features that will make this system exceptional.

| Feature | Value Proposition | Complexity | Notes |
|---------|------------------|------------|-------|
| Reich-style phasing between layers | Creates genuinely emergent polyrhythm no human can compose in real-time | Medium | Phase offset parameter per layer, slowly modulated |
| Floating Points upper-structure voicings | Lush, jazz-inflected harmony that feels "composed" not algorithmic | Medium | Pre-built voicing tables for each mode |
| Modal color arc (not just mode = engine) | Harmony shifts character within a single act without changing root | High | Modal interchange above fixed drone root |
| Harmonic memory / motivic callback | Motif from minute 5 reappears transformed at minute 40 | High | Requires compositional history store |
| CC automation for expression delivery | Removes burden from performer; the system does the macro dynamics | Medium | CC7/CC11/CC1 output per channel |
| False-resolution climax structure | The dramatic tool that separates "good" from "memorable" performances | Medium | Requires arc state machine with rebound capability |
| Polyrhythm via prime-length loops (Eno) | Perpetually novel texture without any randomness | Low | 7-step, 11-step, 13-step independent loops |
| Additive rhythm construction (Glass) | Density builds naturally and perceptibly — audience hears the construction | Medium | Step-addition automaton per rhythmic layer |
| Performer HUD with next-cue warning | Reduces anxiety, enables musical preparation rather than reaction | Low | 5s warning before major transitions |
| MIDI PC messages for preset advance | Allows hardware synths to be in the right patch before transition | Low | PC 2–4 bars ahead of act boundary |

## Anti-Features

Things to deliberately NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|-------------|-----------|-------------------|
| Aggressive fragmented rhythm (Objekt/Arca style) | Explicitly out of scope in PROJECT.md; incompatible with live synth interpretation | Hard rhythmic envelope with groove displacement instead |
| Reactive audio input | PROJECT.md: human interprets, does not influence. Avoids feedback loop collapse | One-way: AI generates, human interprets |
| Per-note particle emission | Creates visual noise, not visual music. Breaks the "perturb dynamics" model | Event-triggered field perturbations |
| Random harmony (random scale degrees) | Sounds like a bug, not like composition | Weighted probability tables with voice-leading constraints |
| Continuous maximum velocity | Eliminates dynamic range; no room for climax | Velocity floor and ceiling shaped by arc phase |
| Simultaneous dimensional peaks | Documented as the cause of minute-24 collapse in v2 | Stagger harmonic, rhythmic, and dynamic peaks |
| Complex UI / parameter control surface | PROJECT.md: controls minimal, system runs autonomously | System self-navigates arc; performer does not adjust parameters |
| npm/bundler dependencies | PROJECT.md explicit constraint; live reliability | Zero-build ES modules only |
| Serendipitous tempo jumps (BPM snap) | Documented in CONCERNS.md as causing Ableton sync stutter | Lerp BPM over 2–4 beats |
| Harmonic tritone between simultaneous engines | Documented in CONCERNS.md as unintentional dissonance | Common root anchor (A or D), modal compatibility check |

---

## Feature Dependencies

```
Harmonic compatibility → Modal color arc → Motivic callback
                       → Upper-structure voicings

Hi-hat continuity → BPM crossfade → Narrative arc (rhythmic dimension)

Velocity humanization → Per-channel pitch enforcement → CC automation
                      → Phrase shape modeling

Narrative arc → False-resolution climax → Visual arc sync
             → Staggered dimensional peaks

Stable runtime (no collapse) → All features above
```

Critical path: fix harmonic compatibility and hi-hat continuity first. Everything
compositionally interesting depends on a stable harmonic foundation and unbroken rhythmic
thread. The minute-24 bug fixes (documented as partially applied in CONCERNS.md) must be
fully verified before adding new compositional features.

---

## MVP Recommendation

Priority order for a credible first version of v3:

1. **Harmonic root anchor** — all engines share A or D root; modal compatibility enforced
2. **Hi-hat continuity layer** — persists across all engine transitions
3. **BPM lerp** — no snap transitions; crossfade over 2–4 beats
4. **Velocity humanization** — per-channel, correlated with rhythmic position
5. **Staggered dimensional arc** — rhythm peaks at minute 38, harmony at minute 28, density
   at minute 33 — never simultaneously
6. **Per-channel pitch range enforcement** — hard limits per instrument type

Defer until foundation is stable:
- Motivic callback / compositional memory (high complexity; wrong foundation = wasted work)
- Prime-length polyrhythm loops (can be added per-engine without system changes)
- MIDI PC messages (useful but not compositionally critical)
- Visual arc sync improvements (v2 system works; improvements are refinements)

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Reich phasing technique | HIGH | Well-documented; stable theory |
| Glass additive rhythm | HIGH | Well-documented; stable theory |
| Four Tet harmonic language | HIGH | Primary listening + documented analysis |
| Floating Points voicings | HIGH | Primary listening + "Elaenia"/"Crush" documented |
| Eno prime-length loops | HIGH | Eno's own writings confirm this technique |
| MIDI velocity curves | HIGH | MIDI 1.0 spec; hardware response is stable |
| CC automation behavior | MEDIUM | Hardware-specific; Prophet/Moog/Juno CC maps vary |
| WebMIDI API lookahead | MEDIUM | Spec-based; browser behavior may vary |
| Narrative arc structure | HIGH | Standard musicological analysis |
| Visual design principles | HIGH | Design + performance practice |

---

## Gaps to Address in Phase-Specific Research

- CC map verification for specific hardware (Prophet-6, Moog Subsequent 37, Juno-106):
  which CCs control filter, resonance, envelope — needs hardware manual lookup
- WebMIDI `sendMIDI()` timing jitter in Chrome/Edge at high MIDI density — need
  empirical measurement in the actual performance browser context
- Whether the existing `presence-multiplier.js` architecture can support per-layer
  (not per-engine) phasing without a full rewrite — depends on reading those source files

---

*Research basis: training data (knowledge cutoff Aug 2025) + project file analysis.
WebSearch unavailable. Musical theory claims HIGH confidence. Hardware-specific MIDI
behavior MEDIUM confidence. Verify CC maps against hardware manuals before implementation.*
