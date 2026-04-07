# MACH:INE II v4 -- Compositional Direction Research

*Research compiled: 2026-04-04*
*Scope: Musical references, compositional techniques, generative theory, emotional arc design*
*Purpose: Inform the complete v4 redesign of the MIDI composition engine*

---

## PART A: Musical References & Techniques

### A.1 Four Tet (Kieran Hebden)

**Key works:** *There Is Love In You* (2010), *New Energy* (2017), Brixton Academy all-nighters

**Core Insight: Repetition as the experiment's beginning, not its end.**

Four Tet's fundamental compositional strategy is to establish a repeating element and then ask: "The music's going to move in circles; now, how to interrupt those perfect curves?" His tracks build from a steady beat and a repetitive, hypnotic melody into denser soundscapes, with second and third melodies played against the original, samples slipping in and out, slivers of the human voice appearing.

**Techniques extractable for MIDI:**

1. **The Persistent Hat:** In Four Tet's DJ sets (especially the Brixton all-nighters), the hi-hat is almost always present. It changes character (closed -> open -> ride -> shimmer) but never disappears for long. It is the thread that holds a multi-hour set together. The current v3 already implements this concept with the always-on hat in RhythmLayer (velFloor: 15), but v4 should extend it: the hat is the listener's anchor, and removing it should be a dramatic compositional event, not a programmatic one.

2. **Harmonic Simplicity With Depth:** Four Tet's harmonic language is deceptively simple -- often a single chord or a two-chord progression repeated for 8+ minutes. The complexity comes from the *voicing*, the *register*, and the *filtering* (which in MIDI terms maps to velocity contour and note duration changes over time). v4 recommendation: fewer chord changes per unit time, but more voice-leading micro-movement within each voicing.

3. **The Subtraction Drop:** Instead of building to a "drop" (adding elements), Four Tet frequently creates impact by *removing* everything except one element -- often just the hat and a single melodic fragment. The return of the kick after 4-8 bars of absence is more powerful than any build-up. For MIDI: implement "breath windows" where kick and bass are explicitly gated out while hat and melody continue, with a velocity-boosted re-entry.

4. **BPM Envelope:** In a Four Tet Brixton set, BPM moves from ~90 to ~128 over the course of hours. The v3 system already learned this lesson (Roadmap v2.9 diagnosis: "no DJ would mix two tracks with 30bpm difference"). v4 should maintain the narrow BPM range (80-120) with gradual transitions.

**Concrete MIDI parameters:**
- Chord change rate: 1 chord per 8 bars (opening), 1 per 4 bars (middle), 1 per 2 bars (climax), back to 1 per 16 bars (closing)
- Hat velocity floor: never below MIDI 15 (always audible in the room)
- Breath windows: 2-4 bars, probability 0.65, min cooldown 10 bars (already well-implemented in v3 RHYTHM.break)
- Re-entry punch: +28 velocity on kick/bass first hit after breath

---

### A.2 Nils Frahm

**Key works:** *All Melody* (2018), *Spaces* (2013), live at Funkhaus

**Core Insight: The transition from felt piano to analog synth is a textural story, not a timbral switch.**

Frahm's Funkhaus performances demonstrate how texture *becomes* melody. His felt piano technique -- placing felt strips on strings, with microphones deep inside the piano body, amplifying the incidental mechanism noises -- transforms the piano into a textural instrument. The compositional principle: every sound source has a hidden textural identity that can be foregrounded.

**Techniques extractable for MIDI:**

1. **Layer-by-Layer Construction:** *All Melody*'s track "Sunson" builds layer-upon-layer atop a single synth line. Each layer is rhythmically independent but harmonically consonant. In MIDI: use the prime-length loop system (already in v3 MelodyTextureLayer: CH3=7 steps, CH5=11, CH6=13) but extend it so that each loop begins at a different time, creating Frahm-style staggered entries.

2. **The Mechanical-to-Musical Transition:** Frahm's performances move from rhythmically rigid (sequenced synth patterns) to rhythmically free (piano improvisation) and back. For a generative system, this maps to: start with quantized grid timing, introduce humanization (swing, jitter) gradually, reach maximum humanization at the emotional peak, then return to grid.

3. **Intimacy Through Velocity:** Frahm's felt piano is extremely quiet. The intimacy comes from playing *very softly*. For MIDI: the opening section should use velocity range 25-55, not 50-90. The listener leans in. The dynamic range of the opening is compressed toward the bottom; the dynamic range of the climax is compressed toward the top.

**Concrete MIDI parameters:**
- Opening velocity range: 25-55 (pp to mp)
- Middle velocity range: 45-85 (mp to f)
- Climax velocity range: 70-115 (f to ff)
- Closing velocity range: 20-50 (ppp to pp, quieter than opening)
- Humanization (timing jitter sigma): 3ms opening -> 12ms middle -> 18ms climax -> 8ms closing

---

### A.3 Jon Hopkins

**Key works:** *Singularity* (2018), live sets

**Core Insight: 75% tension, 25% release. The album is a single arc from ambient to techno to dissolution, beginning and ending on the same note.**

*Singularity* is a 59-minute arc that begins with ambient textures, builds through layered percussion to full techno ("Everything Connected" at ~35 min), then dissolves back to the opening note. The structure is explicitly cyclical: "designed to follow the build, peak and release of a psychedelic experience."

**Techniques extractable for MIDI:**

1. **The Cyclical Return:** The performance ends on the same harmonic material as it began. v3 already implements this (modal sequence ends on A_lydian, same as it starts). v4 should strengthen this: the final chord voicing should be identical to the first chord voicing (same register, same spacing, same velocity), not just the same mode.

2. **The Asymmetric Arc:** 75% building, 25% releasing. The climax is not at 50% -- it is at 75-80%. Most of the performance is ascending energy. The dissolution is fast relative to the build. Current v3 has the rhythmic peak at pct=0.84, which follows this principle well.

3. **Texture-to-Rhythm Continuum:** Hopkins treats texture and rhythm as a spectrum, not a binary. A granular pad with a slight rhythmic pulse IS rhythm, even before a kick appears. For MIDI: the CH1 GRAIN channel should begin as a textural element (random timing, wide velocity scatter) and gradually lock to the grid as rhythmicDensity rises. The transition from "texture" to "rhythm" happens on a single channel, not by adding a new channel.

4. **The 10-Minute Apex:** "Everything Connected" is 10.5 minutes long -- the album's single longest track, placed at the climax. In a 45-minute set, this maps to roughly 4-6 minutes of sustained peak intensity (not a 16-bar drop, but a sustained plateau).

**Concrete MIDI parameters:**
- Peak duration: 4-6 minutes sustained at rhythmicDensity > 0.85
- Dissolution speed: 2.5x faster than build (if build takes 30 min, dissolution takes 12 min)
- CH1 quantization: 0% (random) at opening -> 80% (near-grid) at groove -> 95% at climax -> 50% (loosening) at dissolution
- Return voicing: save first chord voicing, replay it as final chord (exact MIDI notes, exact velocity)

---

### A.4 Floating Points (Sam Shepherd)

**Key works:** *Promises* (with Pharoah Sanders, 2021), *Crush* (2019)

**Core Insight: A seven-note arpeggio can sustain 46 minutes of music if treated with patience and variation.**

*Promises* is a single 46-minute composition in nine movements, built on a seven-note arpeggio played on synthesizer, piano, and harpsichord. The motif is the structural spine; everything else -- Sanders' saxophone, the London Symphony Orchestra's strings -- orbits around it. The arpeggio never changes its pitch content, only its timbre, register, and density.

**Techniques extractable for MIDI:**

1. **The Persistent Motif:** A short melodic cell (4-7 notes) established in the first 2-3 minutes and recalled throughout the performance. v3 already has the seed motif system (MELO-01: seedLength=4, captured in first 15% of arc, returned at 75%). v4 should expand this: the seed should appear not just at the bookend moments but as a ghost reference throughout -- transposed, inverted, rhythmically augmented.

2. **Patience as Compositional Tool:** *Promises* waits 15+ minutes before any significant harmonic change. The first movement is nothing but the arpeggio and sparse saxophone. For a generative system, this means: the harmonicColor parameter should stay below 0.15 for the first 20% of the performance. No chord changes. Just root, fifth, and occasional octave.

3. **Timbral Variation on Static Harmony:** When harmony is static, the ear focuses on timbre. In MIDI, "timbre" maps to: velocity contour, note duration, channel allocation (which hardware synth/VST receives the note). The same MIDI note at velocity 30 with duration 2000ms sounds completely different from velocity 90 with duration 200ms, even on the same synth patch.

**Concrete MIDI parameters:**
- Seed motif length: 5-7 notes (increase from current 4)
- Seed recurrence: at 15%, 35%, 55%, 75%, 95% of arc (not just capture + return)
- Seed transformation: original, transposed +5th, inverted, retrograde, augmented (2x duration)
- First modal change: not before 20% of arc (currently at 22% in v3 -- good)
- harmonicColor ceiling first 20%: 0.15 (currently 0.3 at pct=0.22 -- too high)

---

### A.5 Ryuichi Sakamoto

**Key works:** *async* (2017), *12* (2023)

**Core Insight: Dissonance is not the opposite of beauty. A drowned piano, an out-of-tune string, a cracked oscillator -- these are musical materials, not errors.**

Sakamoto's *async* uses field recordings, prepared instruments, and intentional damage (including a piano damaged by tsunami water) as compositional elements. His approach: "I had to invent for each track, each piece, everything." The album makes liberal use of microtonal tunings and treats every sound as having equal compositional weight.

**Techniques extractable for MIDI:**

1. **Pitch Drift:** Instead of perfectly quantized MIDI notes, introduce pitch bend messages that slowly drift notes away from equal temperament. Even 5-10 cents of drift creates a "living" quality. Implementation: occasional pitch bend CC on the drone channel (CH2), returning to center over 4-8 bars.

2. **Damaged Repetition:** A repeating pattern that gradually degrades -- notes drop out, velocities become erratic, timing drifts. This is the opposite of a "build" but creates its own forward motion through entropy. Useful for the dissolution section.

3. **Silence as Sound:** Sakamoto's *12* is built around the principle that silence between notes is as composed as the notes themselves. For MIDI: the silence ratio targets in v3 are good (germoglio: 0.65-0.75) but should be more aggressive in the opening: first 3-4 minutes should have silence ratio > 0.85.

**Concrete MIDI parameters:**
- Pitch bend drift: max +/- 15 cents on CH2 (drone), period 16-32 bars
- Degraded repetition mode: in dissolution, note-drop probability increases from 0 to 0.4 over the section
- Opening silence ratio: 0.88 (first 5 minutes), tapering to 0.65 by minute 10

---

### A.6 Aphex Twin

**Key works:** *Selected Ambient Works Volume II* (1994)

**Core Insight: Texture IS melody when traditional melody is absent. 150 minutes of mostly beatless compositions that are "by turns beautiful, nightmarish, emotive, and thrilling."**

SAW II makes liberal use of microtonal tunings. The album demonstrates that ambient music is not "background" music -- it demands attention through the *quality* of its textures, not through rhythmic or harmonic complexity.

**Techniques extractable for MIDI:**

1. **Microtonal Color:** Tracks like "Stone In Focus" use subtle detuning to create shimmering, beating textures from simple chords. For MIDI: the chord channel (CH4) could occasionally send two notes 1-2 semitones apart in the very high register (MIDI 80-90) at low velocity, creating a subtle beating/interference pattern when received by a pad synth.

2. **Monolithic Chords:** A single chord sustained for the entire duration of a section (2-5 minutes), with all variation coming from velocity modulation and note duration. The chord never changes; the relationship of the listener to the chord changes because time passes.

3. **The Nightmarish Turn:** SAW II is not all beauty -- tracks like "Rhubarb" sit next to genuinely unsettling pieces. For the narrative arc: the rupture/rottura section should not be "louder" -- it should be *harmonically disturbing*. Tritones, minor seconds, cluster voicings at low velocity. Quiet menace, not volume.

**Concrete MIDI parameters:**
- Beating interference: on CH4, occasional pairs of notes at intervals of 1-2 semitones, MIDI 78-88, velocity 25-40
- Sustained chord duration: 16-32 bars in opening, 8 bars in middle
- Rupture voicings: cluster chords (3+ notes within a 4-semitone range), velocity 35-55 (quiet, not loud)

---

### A.7 Tim Hecker

**Key works:** *Virgins* (2013), *Konoyo* (2018)

**Core Insight: Route a clean signal through destruction, and the destruction itself becomes beautiful.**

Hecker's signature technique involves routing clean digital signals through distortion pedals and analog processors to intentionally degrade them. He uses granular synthesis to slice recordings into grains, played back at different times and intervals. The result: "tangible fragments of music begin to surface more frequently... yet they always seem to be at the mercy of a destabilizing, chaotic gravity."

**Techniques extractable for MIDI:**

1. **The Degradation Arc:** Start with clean, precise MIDI patterns. Over time, introduce increasing amounts of timing jitter, velocity scatter, and note-drop probability. The music doesn't "build" -- it "erodes" toward chaos, and beauty emerges from the erosion. This is an alternative to the traditional build-climax-release: build-erode-reform.

2. **Orchestral Decay:** Hecker's *Konoyo* features gagaku (Japanese court music) instruments recorded and then digitally eroded. For MIDI: chords that begin as full voicings and gradually lose notes, one by one, until only the root remains. The inverse of "added tones gradual" -- *subtracted tones gradual*.

3. **Walls of Sound as Single Events:** Hecker creates dense walls that function as single gestures. For MIDI: during climax moments, send 6-8 notes simultaneously across CH2/CH4/CH5 as a single chord-cluster event, held for 4+ bars. Not a progression -- a *statement*.

**Concrete MIDI parameters:**
- Degradation curve: timing jitter sigma increases from 5ms to 25ms over dissolution
- Note subtraction: in dissolution, chord size decreases from 4 notes to 3 to 2 to 1 over 16-32 bars
- Wall events: 6-8 simultaneous notes, spread across MIDI 36-72, velocity 60-80, duration 8+ bars, max 2-3 per performance

---

### A.8 Olafur Arnalds

**Key works:** *re:member* (2018)

**Core Insight: A generative system connected to acoustic instruments creates surprises that are always harmonically valid.**

The Stratus system: two self-playing pianos controlled by custom software that generates unexpected harmonies from a single chord played by Arnalds. "As Arnalds plays a note on the piano, two different notes are generated by Stratus, creating unexpected harmonies and surprising melodic sequences."

**Techniques extractable for MIDI:**

1. **Responsive Generation:** The system generates notes in response to other notes, not on a fixed clock. For MIDI: when CH5 (VOICE) plays a note, CH6 (LEAD) should have a probability of responding with a harmonically related note 200-500ms later, creating a "call and response" effect. This is more musical than two independent Markov chains.

2. **Constraint as Freedom:** Stratus constrains its output to notes that are harmonically related to the input. The algorithm is simple but the results are rich because the constraints are well-chosen. For v4: the Markov voice selection should weight common-tone relationships more heavily (+3x) and penalize non-scale notes absolutely (weight 0, not weight 0.15).

**Concrete MIDI parameters:**
- Call-response probability: 0.4 (CH5 triggers CH6 response)
- Response delay: 200-500ms (rhythmically staggered, not on-grid)
- Response interval: prefer 3rd, 5th, octave from trigger note (weight 3x)
- Non-scale penalty: absolute zero (no chromatic notes in response)

---

### A.9 Brian Eno

**Key works:** Ambient series (1978-1982), generative music systems

**Core Insight: "Composing processes, not songs -- small ecosystems of possibility." Music that "can accommodate many levels of listening without enforcing one in particular."**

Eno's generative music principle: overlapping loops of different lengths, played on tape machines running slightly out of sync, with no beginning and no final mix. Each loop is simple; the complexity emerges from their interaction. For music to be "generative," it must change continuously and never repeat itself exactly.

**Techniques extractable for MIDI:**

1. **Prime-Length Loops (Already Implemented):** v3's MelodyTextureLayer already uses prime-length loops (7, 11, 13). The LCM is 1001 steps -- the pattern never exactly repeats within the performance. This is Eno's principle in action. v4 should expand this: add a 17-step loop for CH2 (drone) renewal, creating an even longer non-repeating cycle.

2. **Oblique Strategies as System Events:** Random perturbations that redirect the composition. "Honor thy error as a hidden intention" translates to: occasionally (probability 0.03 per bar), the system should make a "mistake" -- play a note outside the current scale, hold a note for 4x its intended duration, or skip a scheduled chord change. These "errors" become compositional features.

3. **The Ecosystem Model:** The system's output is not a sequence but an ecosystem. Each layer lives independently, has its own lifecycle, and interacts with other layers through harmonic gravity (common tones pull layers together) rather than through explicit synchronization.

**Concrete MIDI parameters:**
- Drone renewal loop: 17-step (prime, distinct from 7/11/13 melody loops)
- Oblique error probability: 0.03 per bar (roughly once every 30 bars = ~80 seconds at 88 BPM)
- Error types: out-of-scale note (40%), extreme duration (30%), skipped chord change (30%)
- No explicit sync between melody layers; alignment occurs only through harmonic gravity

---

### A.10 Max Richter

**Key works:** *Sleep* (2015)

**Core Insight: The architecture of an 8-hour piece hangs on variations. A single theme, varied 204 times.**

*Sleep* is structured as a set of variations echoing Bach's Goldberg Variations. The key compositional principle: repetition with micro-variation is infinitely sustainable if the variations target different musical dimensions (rhythm one time, register the next, voicing the next, dynamics the next).

**Techniques extractable for MIDI:**

1. **Variation Dimensions:** When repeating a motif or chord progression, vary ONE dimension at a time:
   - Repetition 1: original
   - Repetition 2: shift register (octave up/down)
   - Repetition 3: change rhythm (augment/diminish note durations)
   - Repetition 4: change voicing (redistribute notes across octaves)
   - Repetition 5: change dynamics (velocity contour)
   - Repetition 6: change density (add/remove notes)
   Never vary two dimensions simultaneously -- the listener loses the thread.

2. **Sleep-Compatible Dynamics:** The entire dynamic range of *Sleep* is approximately pp to mp (MIDI 25-65). The piece never gets loud. For the opening and closing sections of v4, this is the model: restraint is not absence of expression.

**Concrete MIDI parameters:**
- Variation cycle length: 6 repetitions before the motif is regenerated
- Variation sequence: [original, register, rhythm, voicing, dynamics, density]
- Opening/closing dynamic ceiling: MIDI velocity 65
- Main body dynamic ceiling: MIDI velocity 110

---

### A.11 Steve Reich

**Key works:** *Piano Phase* (1967), *Music for 18 Musicians* (1976)

**Core Insight: "The beauty and effectiveness lies in the well-defined logic and the often surprising emergent properties." Repetition creates change through phase relationships.**

Reich's phase shifting: two identical patterns played at slightly different speeds gradually drift in and out of alignment. The superimpositions form sub-melodies -- "by-products" that emerge spontaneously from the process. The composer designs the system; the system generates the content.

**Techniques extractable for MIDI:**

1. **Phase Shifting in Hi-Hat (Already Implemented):** v3's RhythmLayer already uses dual sub-clocks for hi-hat phasing (8-step pattern A vs. 9-step pattern B, converging every 72 steps). This is a direct Reich implementation. v4 should make the convergence points more musically significant: when the two patterns align (every ~8-10 seconds), boost velocity by 15% to create a subtle rhythmic accent that the listener feels but doesn't consciously identify.

2. **Additive Process:** Reich's *Music for 18 Musicians* adds instruments one by one, each with its own repeating pattern. The texture becomes denser not through louder playing but through more voices. For MIDI: the glass-style additive entry in RhythmLayer percussion (congaLo -> congaHi -> rimshot -> snare, each entering at a higher rhythmicDensity threshold) is already excellent. v4 should apply this principle to the harmonic layer too: chord notes enter one at a time (root only -> root+5th -> root+3rd+5th -> full voicing) over 8-16 bars.

3. **Process as Architecture:** The entire formal structure IS the process. There are no "sections" -- there is one continuous transformation from state A to state B. This is the philosophical foundation of the MacroComposer checkpoint system: the 4D interpolation between checkpoints IS the composition.

**Concrete MIDI parameters:**
- Phase convergence boost: +15% velocity on hat when patterns A and B align
- Chord additive entry: 1 note per 4 bars, building from root to full voicing over 16 bars
- Process visibility: the listener should be able to perceive that things are changing, even if they can't identify what

---

### A.12 Burial

**Key works:** *Untrue* (2007), *Rival Dealer* (2013)

**Core Insight: "Silence, space, and background sound can speak volumes." The emotional weight of reverb and distance.**

Burial's production creates atmosphere through *absence*: crackling vinyl texture fills dead space, vocals are buried in reverb so deep they become textural, and the rhythms skip and stumble rather than drive. His "soundscape is sparse but dense with feeling."

**Techniques extractable for MIDI:**

1. **The Stumble:** Burial's beats intentionally skip and shuffle. Some hits are displaced by 30-50ms (far more than typical humanization). For MIDI: during certain sections (dissolution, or the Phrygian modal region which has a "ritual" quality), apply extreme timing scatter (sigma 20-30ms) to the kick channel only. The hat stays on grid. The result: the kick sounds "drunk" against a steady pulse.

2. **Texture as Emotion:** Burial's vinyl crackle is not decoration -- it is the emotional carrier. For a MIDI system, the equivalent is a persistent low-velocity CH1 (GRAIN) pattern that never stops, creating a "room tone" of musical activity. Velocity 15-25, random pitch from a narrow cluster, duration 25ms. The listener perceives it as atmosphere, not as notes.

3. **Reverb Tail as Compositional Element:** When Burial's vocal samples trail off into reverb, the reverb tail IS the transition to the next section. For MIDI: after a chord change, the old chord's notes should be given an extended note-off (sustain) overlapping with the new chord's attack. The "blur" between chords creates warmth and continuity.

**Concrete MIDI parameters:**
- Stumble mode: kick timing scatter sigma 25-35ms, activated during Phrygian sections
- Room tone: CH1 velocity 15-25, pitch cluster [36, 38, 40, 42], duration 25ms, always on
- Chord overlap: old chord sustains 500-1000ms into new chord's first beat

---

## PART B: Compositional Structure Techniques

### B.1 Tension-Release Cycles

**Principle:** A 45-minute performance should contain 4-6 tension-release cycles of varying intensity, not a single build-to-climax.

**The Wave Model:**
```
Tension Level (0-1):

1.0  |                                          *****
     |                              ****        *   *
0.8  |                    ***      *    *      **     *
     |                   *   *    *      *    *        *
0.6  |           **     *     *  *        *  *          *
     |          *  *   *       **          **            *
0.4  |     *   *    * *                                   *
     |    * * *      *                                     *
0.2  |   *   *                                              **
     |  *                                                     ***
0.0  |*                                                          ****
     +----+----+----+----+----+----+----+----+----+----+----+----+---
     0    4    8   12   16   20   24   28   32   36   40   44   48
                              Minutes
```

**Wave structure:**
- Wave 1 (0-12 min): tension 0.0 -> 0.4 -> 0.2 (texture establishment)
- Wave 2 (12-22 min): tension 0.2 -> 0.6 -> 0.3 (first groove, first breath)
- Wave 3 (22-32 min): tension 0.3 -> 0.8 -> 0.5 (groove intensification, harmonic shift)
- Wave 4 (32-40 min): tension 0.5 -> 1.0 -> 0.6 (climax plateau, false resolution)
- Wave 5 (40-48 min): tension 0.6 -> 0.3 -> 0.0 (dissolution, memory, silence)

Each wave has its own internal micro-arc. The peaks are NOT at the same level -- they escalate. The valleys also escalate until Wave 4, then the final valley drops all the way to zero.

**MIDI implementation:**
- Map tension to a composite of rhythmicDensity, harmonicColor, melodicActivity
- Each wave peak is achieved by pushing one primary dimension (not all three simultaneously)
- Wave 1 peak: harmonicColor (texture)
- Wave 2 peak: rhythmicDensity (groove)
- Wave 3 peak: harmonicColor + rhythmicDensity (harmonic groove)
- Wave 4 peak: all three (full climax)
- Wave 5: melodicActivity persists longest (melody is the last thing to fade)

### B.2 The "Air" Technique (Strategic Silence)

**Principle:** Removing elements is more powerful than adding them.

**Four Tet's method:** Drop everything except the hi-hat. Let the room breathe. The crowd feels the absence of the kick physically. When it returns 4-8 bars later, the first kick hits harder than any build-up could achieve.

**Implementation for v4:**

Three levels of "air":
1. **Micro-air** (1-2 beats): a single beat of silence in the kick pattern. Already implemented as ghost note positions.
2. **Meso-air** (2-4 bars): kick and bass drop out; hat, chords, and melody continue. The RHYTHM.break system in v3 implements this. 
3. **Macro-air** (16-64 bars): a full textural reset. Everything except the drone drops out. The performance "restarts" from a simpler state. This should happen 2-3 times per performance, always before a wave peak.

**The False Resolution (already in v3):**
The checkpoint at pct=0.75 drops rhythmicDensity instantly to 0.0 for 8 bars. This is v3's most dramatic compositional moment. v4 should expand it: the false resolution should also shift the harmonic center (not just drop the rhythm), creating a moment of genuine disorientation before the final climb.

**Concrete parameters:**
- Meso-air frequency: every 10-20 bars when rhythmicDensity > 0.40
- Macro-air frequency: 2-3 per performance, placed at ~20%, ~50%, ~75% of arc
- Macro-air duration: 16-32 bars (depends on current BPM)
- False resolution: instant drop in rD AND harmonic pivot to a distant key (e.g., from D_dorian to Bb_phrygian)

### B.3 Harmonic Pivots

**Principle:** The most powerful harmonic transitions share at least one common tone. The listener's ear follows the common tone while the harmonic context shifts around it.

**Current v3 implementation:** The MACRO.pivotNotes system already defines common tones between modes:
- A_lydian -> Bb_phrygian: A3 (MIDI 57)
- Bb_phrygian -> D_dorian: D4 (MIDI 62)
- D_dorian -> C#_dorian: A3 (MIDI 57)
- C#_dorian -> E_phrygian: E4 (MIDI 64)
- E_phrygian -> A_lydian: A3 (MIDI 57)

This is already excellent. v4 refinements:

1. **Pivot Duration:** The common tone should be sounded for 4-8 bars BEFORE the modal change, establishing it as a point of stability. Then the context shifts while the pivot tone remains. Then the pivot fades over 4 bars. Total pivot window: 12-16 bars.

2. **Chromatic Mediants:** In addition to the existing modal sequence, consider chromatic mediant relationships for surprise harmonic color. A chromatic mediant shares one note with the original triad but shifts the other two chromatically:
   - D minor (D-F-A) -> F major (F-A-C): common tone A, warm shift
   - D minor (D-F-A) -> Bb major (Bb-D-F): common tone D+F, rich shift
   - D minor (D-F-A) -> F# minor (F#-A-C#): common tone A, distant/mysterious

3. **Modal Interchange Within a Section:** Instead of changing the entire scale, borrow one note from a parallel mode for 2-4 bars, then return. For example, in D_dorian, briefly introduce Bb (from D_phrygian) as a passing tone in the bass, creating a momentary darkening. This is more sophisticated than full modal changes.

**Concrete parameters:**
- Pivot pre-sound duration: 4-8 bars before modal change
- Pivot post-hold duration: 4 bars after modal change
- Modal interchange probability: 0.08 per chord change (roughly once per 12 chord changes)
- Interchange duration: 2-4 bars, then return to home mode

### B.4 Groove Evolution

**Principle:** A groove should transform continuously over 8-16 bars so that the listener never hears the moment of change, only realizes that things are different from what they were.

**Techniques:**

1. **Ghost Note Emergence:** Start with a clean 4-on-the-floor kick. Over 8 bars, ghost notes (velocity 18-28) appear on offbeat positions with increasing probability (0.0 -> 0.25). By bar 8, the groove has a subtle shuffle that wasn't there before. Over the next 8 bars, some ghosts become accented (velocity 55-70), shifting the rhythmic emphasis.

2. **Accent Migration:** The accent pattern shifts one 16th note every 4 bars. The downbeat accent moves from beat 1 to the "and of 4" over 16 bars, creating a push-pull feel that drives forward motion without changing the pattern itself.

3. **Bass Pattern Lengthening:** The bass starts with a 1-bar repeating pattern, then extends to 2 bars (with variation in bar 2), then to 4 bars. The groove becomes more complex not by adding notes but by extending the cycle length.

4. **Euclidean Evolution (Already in v3 Reference Material):** Interpolate between E(3,16) and E(7,16) using probability gates. At progress=0, only the 3 hits of E(3,16) play. At progress=1, all 7 hits of E(7,16) play. Intermediate values create probabilistic patterns that never repeat exactly.

**Concrete parameters:**
- Ghost emergence: probability 0.0 -> 0.25 over 8 bars, velocity 18-28
- Ghost-to-accent promotion: probability 0.15 per bar for established ghosts
- Accent migration: 1 step per 4 bars
- Bass cycle extension: 1-bar -> 2-bar -> 4-bar, changing every 16 bars of stable groove

### B.5 Textural Counterpoint

**Principle:** Multiple layers with independent rhythmic lives create a texture that is more than the sum of its parts. Each layer is simple; the interaction is complex.

**Reich's Phase Shifting:** Two identical 12-note patterns at tempos of 72 and 72.5 BPM drift in and out of sync, creating new melodic patterns from the interference.

**Eno's Loop Stacking:** 5 loops of lengths 7, 11, 13, 17, 19 beats. At any given moment, the combination is unique. The system is deterministic but non-repeating on human timescales.

**Implementation for v4:**
The current prime-length loop system (7, 11, 13 steps) is already a strong implementation. Extensions:

1. **Add a 17-step drone loop and a 19-step texture loop** for a total LCM of 7 * 11 * 13 * 17 * 19 = 323,323 steps. At 88 BPM (16th notes = 170ms each), this cycle takes ~15.3 hours -- far longer than any performance.

2. **Phase-aware velocity:** When two loops coincide (their step counters are simultaneously at 0), boost velocity by 10-15%. These convergence moments create subtle structural accents that the listener perceives as "the music breathing."

3. **Contrary motion between layers:** When CH5 moves upward, CH6 should prefer downward motion (and vice versa). This creates textural counterpoint without complex rule systems.

**Concrete parameters:**
- Loop lengths: CH2=17, CH3=7, CH5=11, CH6=13, texture=19
- Convergence boost: +12% velocity when any two loops align at step 0
- Contrary motion weight: when CH5 moves +N semitones, CH6 weights notes at -N semitones by 2.5x

### B.6 The "Drop" vs. "The Build" (Why Sophistication Matters)

**Principle:** The EDM "drop" is a binary event (tension ON -> tension OFF). A sophisticated build-release operates on a gradient, with tension increasing and decreasing at different rates and in different musical dimensions simultaneously.

**The Superior Model (Hopkins/Four Tet/Floating Points):**
Instead of a single moment of maximum contrast, create a **plateau region** where intensity is sustained at 85-95% for 4-6 minutes. Within this plateau, micro-variations create the sensation of continual escalation even though the macro level is stable. Then the release is not a "drop" but a gradual *dissolution* -- elements remove one by one over 2-4 minutes.

**MIDI implementation:**
- No instant-on/instant-off transitions for any parameter
- All changes use EMA smoothing (already in v3 MacroComposer, tau=4.0s)
- Maximum rate of change for rhythmicDensity: 0.15 per minute (prevents jarring shifts)
- The "climax" is not a peak but a plateau: rD stays at 0.85-1.0 for pct 0.80-0.84 (about 2 minutes)

### B.7 Polyrhythmic Layering

**Principle:** Overlaying patterns of different lengths creates groove that is simultaneously driving and floating.

**Key ratios for electronic music:**
- **3:4** -- the most common. One pattern repeats every 3 beats, another every 4. They realign every 12 beats (3 bars of 4/4). Creates a gentle pull.
- **5:4** -- more exotic. Alignment every 20 beats (5 bars). Creates a dreamy, unstable float. Good for the Lydian sections.
- **3:2** (hemiola) -- the basis of much West African and Afro-Cuban music. Alignment every 6 beats. Very driving.

**Implementation for v4:**
- CH7 (PERCUSSION) pattern length: 12 steps (3:4 against the 16-step grid) during groove sections
- CH1 (GRAIN) dual-clock phasing (already implemented: 8 vs 9 steps)
- Occasional 5:4 polyrhythm on CH6 (LEAD) during Lydian sections: loop length 20 16th-notes

**Concrete parameters:**
- Percussion 3:4: pattern length 12 steps, accent on steps 0, 4, 8 (creates a 3-beat feel against 4/4)
- Grain phasing: 8 vs 9 (current, good)
- Lead 5:4 (Lydian only): loop length 20 steps, accent on steps 0, 5, 10, 15
- Hemiola events: during climax, bass plays 3-beat groupings against 4-beat kick for 4-8 bars

### B.8 Micro-Timing / Humanization

**Principle:** The difference between a machine and a musician is not accuracy -- it is *intentional inaccuracy*. A musician plays slightly ahead of the beat when excited, slightly behind when relaxed.

**Ahead vs. behind the beat:**
- **Ahead (5-10ms early):** Creates urgency, forward motion. Use for building sections.
- **On the grid:** Maximum precision. Use for climax sections (the grid IS the energy).
- **Behind (8-15ms late):** Creates relaxation, swagger. Use for opening and dissolution.
- **Scattered (random +/-15-25ms):** Creates dreaminess, dissolution. Use for the final 10% of the performance.

**Implementation for v4:**

The current v3 system uses Gaussian jitter with fixed sigma. v4 should make the timing *directional*:

```
Phase:        Opening    Building   Groove     Climax     Dissolution
Timing:       behind     on-grid    behind     on-grid    scattered
Offset mean:  +8ms       +1ms       +5ms       0ms        0ms
Offset sigma: 5ms        3ms        8ms        2ms        20ms
```

(Positive offset = behind the beat = laid back feel)

**Swing as a phase-dependent parameter:**
- Opening: swing 0% (straight, delicate)
- Building: swing 5-8% (slight shuffle)
- Groove: swing 12-15% (full groove feel, dub territory)
- Climax: swing 3-5% (nearly straight, precision drives energy)
- Dissolution: swing 15-20% (exaggerated, stumbling, fading)

---

## PART C: Generative Music Theory

### C.1 Algorithmic Composition for Live Performance

**What works:**
1. **Constrained randomness:** Systems that choose from a small set of pre-composed options (scales, patterns, voicings) with weighted probabilities produce the most reliably musical results. The v3 Markov voice selection and anchor voicing system exemplify this.

2. **Pre-composed macro structure with generative micro detail:** The overall arc (45 minutes, 5 modes, specific energy curve) is deterministic. The moment-to-moment note choices within that arc are probabilistic. This is the correct balance for live performance.

3. **Continuous processes over discrete events:** Smooth interpolation between states (EMA smoothing, cubic Hermite ease) creates musical transitions. Instant state changes sound like errors.

**What does not work:**
1. **Pure Markov chains without constraints:** They wander aimlessly. Without gravitational centers, scale constraints, and voice-leading limits, they produce "technically valid but musically meaningless" output.

2. **Cellular automata for harmony:** CA is excellent for rhythmic pattern generation (interesting polyrhythmic patterns emerge) but poor for harmonic content (no concept of consonance/dissonance).

3. **Full randomness on any parameter:** A random velocity between 1-127 sounds terrible. A random velocity between 55-75 with Gaussian distribution sounds human. Constraints are not limitations -- they are the composer's taste.

### C.2 Markov Chains vs. Rule-Based vs. Cellular Automata

**Recommended hybrid approach for v4:**

| Layer | Primary Method | Secondary Method |
|-------|---------------|-----------------|
| Macro arc | Deterministic (checkpoint interpolation) | Micro-drift (sinusoidal perturbation) |
| Harmony | Rule-based (anchor voicings + progression cycles) | Drift modulation (chromatic alteration, prob 0.08) |
| Rhythm | Rule-based (pattern library + Euclidean) | Cellular automata (for percussion fills only) |
| Melody | Weighted Markov (2nd order) | Seed motif (deterministic recall at specific arc points) |
| Texture | Phase-based (prime-length loops) | Probabilistic (note-drop, velocity scatter) |

The key insight: **each layer should use the method best suited to its musical function.** Harmony benefits from rules (humans expect harmonic logic). Melody benefits from Markov chains (humans expect melodic surprise within bounds). Rhythm benefits from patterns (humans expect rhythmic regularity). Texture benefits from process (humans expect textural evolution).

### C.3 Constraint-Based Composition

**The "Eno Principle":** Systems that produce music you want to listen to vs. systems that demonstrate a process.

The critical constraints that make generative MIDI listenable:

1. **Scale constraint (absolute):** Every note must belong to the current scale. No exceptions except the intentional "oblique error" events (prob 0.03).

2. **Range constraint (per channel):**
   - CH0 PULSE: MIDI 36 (single note, C2)
   - CH1 GRAIN: MIDI 36-60 (C2-C4, narrow cluster)
   - CH2 DRONE: MIDI 36-57 (C2-A3, bass register)
   - CH3 BASS: MIDI 24-48 (C1-C3, deep bass)
   - CH4 CHORDS: MIDI 48-76 (C3-E5, middle register)
   - CH5 VOICE: MIDI 55-84 (G3-C6, upper register)
   - CH6 LEAD: MIDI 60-88 (C4-E6, highest register)
   - CH7 PERCUSSION: MIDI 36-62 (mapped to drum kit)

3. **Voice-leading constraint (max 3 semitones between consecutive chord tones):** Already well-implemented.

4. **Density constraint (maximum simultaneous notes):** Never more than 8 notes sounding simultaneously across all channels. More notes = less clarity. The most powerful moments in the referenced music are often the simplest.

5. **Silence constraint (minimum rest between notes per channel):** Each channel has a minimum silence duration before the next note can fire. This prevents machine-gun note streams.

6. **Velocity range constraint (per phase):** As defined in section A.2 (Frahm velocity ranges).

### C.4 The "Eno Principle" Applied

**Test for any generative system:** "Would I want to listen to this for 20 minutes?"

If the answer is no, the system has too much of one of these:
- **Too much randomness:** Notes feel disconnected, arbitrary
- **Too much regularity:** Notes feel mechanical, predictable
- **Too much density:** No space to breathe, ear fatigue
- **Too much sparsity:** Nothing to hold attention

The sweet spot is different for each section of the performance:
- Opening: high sparsity, low randomness, low density (Floating Points territory)
- Middle: moderate density, moderate randomness, moderate regularity (Four Tet territory)
- Climax: high density, low randomness, high regularity (Hopkins territory)
- Dissolution: moderate sparsity, high randomness, low density (Burial territory)

---

## PART D: The Emotional Arc -- A Proposed v4 Structure

### D.1 Overview: 48-Minute Performance in Five Movements

```
Duration:    48 minutes (2880 seconds)
BPM range:   84-116 (gradual, never more than 8 BPM shift between adjacent sections)
Modal path:  A Lydian -> Bb Phrygian -> D Dorian -> C# Dorian -> E Phrygian -> A Lydian
Channels:    8 MIDI channels (CH0-CH7)
```

### D.2 Movement I: EMERSIONE (Emergence) -- 0:00 to 10:00

**Emotional intent:** Trust, attention, curiosity. The listener enters a space. The air is warm. Something is beginning, but there is no hurry.

**Musical character:** Nils Frahm's felt piano meets Floating Points' patience. A single drone, rare melodic fragments, no rhythm.

**Mode:** A Lydian (bright, open, suspended)

**Active channels:**
- CH2 DRONE: Root (A3=57) sustained, renewed every 17 steps. Occasional octave doubling (A4=69) at prob 0.6.
- CH5 VOICE: Extremely rare (probability 0.08 per step), velocity 25-45. Seed motif captured here.
- CH4 CHORDS: Single chord (A Lydian tonic triad) sustained for 16-32 bars. No progression -- just the one chord, with voice-leading micro-drift.

**Silence ratio:** 0.88 (first 3 min) -> 0.75 (by min 10)

**Key parameters:**
```
rhythmicDensity:  0.00 (no kick, no hat, no percussion)
harmonicColor:    0.00 -> 0.10 (the faintest chord)
melodicActivity:  0.04 -> 0.12 (one note every 30-60 seconds)
textureDepth:     0.05 -> 0.15
BPM:              84 (reference only -- no audible beat)
```

**Critical detail:** The hat is NOT present yet. Its first appearance should be an event, not a default state. The hat enters at ~8:00 as the faintest ghost (velocity 15-20, random timing, 1 hit every 2-4 beats).

### D.3 Movement II: TESSUTO (Texture) -- 10:00 to 20:00

**Emotional intent:** Warmth, accumulation, the first pulse. The space is filling. Something wants to move but hasn't decided how.

**Musical character:** Four Tet's There Is Love In You meets Sakamoto's async. Layers accumulate, a pulse emerges from texture.

**Mode:** A Lydian (10:00-14:00) -> Bb Phrygian (14:00-20:00)
**Pivot:** A3 (MIDI 57) sustained through the modal change

**Active channels:**
- CH2 DRONE: Continues. At 14:00 shifts to Bb Phrygian root (Bb2=46) with A3 pivot above.
- CH1 GRAIN: Enters at ~10:00. Random timing, velocity 15-25, pitch cluster [36,38,40,42]. Not yet rhythmic -- still textural.
- CH4 CHORDS: Progression begins. Slow rhythm: 1 chord per 8 bars. Shell voicings (3 notes max).
- CH5 VOICE: More active (probability 0.15). Phrases of 4 notes (seed motif variations).
- CH3 BASS: Enters at ~16:00. Very sparse -- 1 note per 4 bars. Long sustain (2000ms).
- CH0 PULSE: First kick appears at ~18:00. Extremely sparse: 1 hit per 4 bars, velocity 55.

**Silence ratio:** 0.75 -> 0.50

**Key parameters:**
```
rhythmicDensity:  0.00 -> 0.15 (hat as texture, first kick at 0.15)
harmonicColor:    0.10 -> 0.35 (chords emerge, modal change)
melodicActivity:  0.12 -> 0.25 (voice finds phrases)
textureDepth:     0.15 -> 0.30
BPM:              84 -> 88 (imperceptible 4 BPM shift over 10 minutes)
```

**Critical detail:** The modal change from A_lydian to Bb_phrygian (at ~14:00) is the performance's first harmonic surprise. The common tone A3 holds everything together. The shift should be prepared: 4 bars before the change, the drone plays both A3 and Bb2 simultaneously (a minor 9th apart -- tense but not harsh at low velocity). Then the A3 fades and Bb becomes the new root. This is the "drift modulation" technique from Floating Points.

### D.4 Movement III: SOLCO (Groove) -- 20:00 to 32:00

**Emotional intent:** Motion, drive, the body moves. This is where the music becomes undeniable. But there are valleys within the mountains.

**Musical character:** Four Tet's Brixton groove meets Hopkins' relentless build. The hat locks to the grid. The kick establishes 4/4.

**Mode:** Bb Phrygian (20:00-24:00) -> D Dorian (24:00-32:00)
**Pivot:** D4 (MIDI 62) connects Bb Phrygian to D Dorian

**Active channels:** All 7 melodic channels active. CH7 percussion enters.

**Three sub-sections:**

**III-a: Groove Establishment (20:00-24:00)**
- Kick pattern solidifies: broken2 -> broken4 -> halftime 4-on-floor
- Hat locks to 8th note grid (velocity 45-70)
- Bass becomes melodic (7-step loop, velocity 55-70)
- Chords: 1 per 4 bars, full voicings (4 notes)
- First BREAK at ~22:00 (2-4 bars, kick+bass out, hat+chords continue)

**III-b: Harmonic Intensification (24:00-28:00)**
- Modal change to D Dorian (pivot on D4)
- Chord rhythm increases: 1 per 2 bars
- CH6 LEAD enters (13-step loop, angular intervals, velocity 50-65)
- Polyrhythmic percussion enters on CH7 (12-step pattern, 3:4 against kick)
- Swing increases to 12-15% (full groove feel)

**III-c: Pre-Climax Build (28:00-32:00)**
- Hat moves to 16th notes (velocity 70-95)
- Bass pattern extends to 4-bar cycle
- Ghost notes on kick (probability 0.25, velocity 18-28)
- Velocity envelope: gradual crescendo across all channels
- MACRO-AIR at ~30:00: everything drops except drone and hat for 16 bars. This is the "deep breath" before the climax.

**Key parameters:**
```
rhythmicDensity:  0.15 -> 0.70
harmonicColor:    0.35 -> 0.85
melodicActivity:  0.25 -> 0.55
textureDepth:     0.30 -> 0.55
BPM:              88 -> 100 (gradual, 1 BPM per minute)
```

### D.5 Movement IV: VERTICE (Peak) -- 32:00 to 40:00

**Emotional intent:** Ecstasy, surrender, the peak is not a point but a plateau. Multiple sub-peaks within a sustained intensity. The false resolution. The final climb.

**Musical character:** Jon Hopkins' "Everything Connected" meets Solco's Berlin techno. 4/4 is undeniable. Every element is at maximum activity.

**Mode:** C# Dorian (32:00-38:00) -> E Phrygian (38:00-40:00)
**Pivot:** A3 (MIDI 57) connects D Dorian to C# Dorian. E4 (MIDI 64) connects C# Dorian to E Phrygian.

**Three sub-sections:**

**IV-a: Sustained Climax (32:00-35:00)**
- 4-on-the-floor kick, velocity 100-110
- Hat: 16th notes, velocity 85-100, swing reduced to 3-5%
- Full chord voicings changing every 1 bar
- CH5+CH6: cross-arpeggio mode (call and response), dense
- Velocity sweep on CH6 (sinusoidal, period 16 bars)
- No breaks. Relentless. This is the plateau.

**IV-b: False Resolution (35:00-35:45)**
- INSTANT drop: rhythmicDensity -> 0.0
- Only drone (A3) and the faintest hat (velocity 15) remain
- 8 bars of near-silence (~22 seconds at 100 BPM)
- The audience experiences genuine uncertainty: is it over?
- harmonicColor drops but does not reach zero (chord sustains, fading)

**IV-c: Rebound and Final Peak (35:45-40:00)**
- Kick re-enters at velocity 115 (+28 punch boost)
- rhythmicDensity jumps to 0.90 (above previous peak)
- Mode shifts to C# Dorian with maximum harmonic tension (no tonic resolution)
- This is the absolute peak of the performance
- At 38:00, mode shifts to E Phrygian -- the harmonic darkening signals the end is approaching
- Seed motif returns on CH5 at pct=0.79 (~38:00), transposed to E Phrygian, augmented (2x duration)

**Key parameters:**
```
rhythmicDensity:  0.70 -> 1.00 -> 0.00 -> 0.95 -> 0.30
harmonicColor:    0.85 -> 1.00 -> 0.50 -> 0.80 -> 0.30
melodicActivity:  0.55 -> 0.80 -> 0.30 -> 0.70 -> 0.50
textureDepth:     0.55 -> 0.70 -> 0.40 -> 0.70 -> 0.60
BPM:              100 -> 108 -> 108 -> 116 -> 108
```

### D.6 Movement V: RITORNO (Return) -- 40:00 to 48:00

**Emotional intent:** Memory, gratitude, release. The music remembers what it was. Elements from the opening return, transformed by everything that happened. The space empties gradually, like a room after a party.

**Musical character:** Sakamoto's *12* meets Burial's reverb. Entropy. Degradation. Beauty in dissolution.

**Mode:** E Phrygian (40:00-43:00) -> A Lydian (43:00-48:00)
**Pivot:** A3 (MIDI 57) -- the same note that opened the performance

**Sub-sections:**

**V-a: Dissolution (40:00-43:00)**
- Kick drops out at 40:00 (instant)
- Bass rarifies: 1 note per 4 bars, velocity decaying
- Hat returns to 8th notes, then quarter notes, velocity fading
- Chords: sustained, losing notes one by one (4 -> 3 -> 2 -> root only) over 16 bars
- Timing jitter increases: sigma goes from 8ms to 25ms
- Note-drop probability increases: 0.0 -> 0.35

**V-b: Memory (43:00-46:00)**
- Mode returns to A Lydian
- Drone returns to A3=57 (the opening note)
- Seed motif returns at original pitch, original velocity, original rhythm -- exact replica of what was captured at the beginning
- CH6 LEAD plays the seed in retrograde (backwards) as a ghost (velocity 25-35)
- Only CH2 (drone), CH5 (seed), and CH1 (grain as room tone) remain

**V-c: Silence (46:00-48:00)**
- CH5 falls silent after the final seed statement
- CH1 grain velocity fades: 20 -> 10 -> 5 -> silence
- CH2 drone sustains to the very end, velocity fading: 50 -> 30 -> 15 -> 5
- Final note: A3 at velocity 5, sustained for 16 bars
- The performance ends not with a note-off but with a velocity so low it becomes inaudible

**Key parameters:**
```
rhythmicDensity:  0.30 -> 0.05 -> 0.00
harmonicColor:    0.30 -> 0.10 -> 0.00
melodicActivity:  0.50 -> 0.15 -> 0.00
textureDepth:     0.60 -> 0.10 -> 0.00
BPM:              108 -> 92 -> 84 (returns to opening tempo)
```

---

## PART E: Summary of Concrete Recommendations for v4

### E.1 Macro Architecture

| Parameter | v3 Current | v4 Proposed | Rationale |
|-----------|-----------|-------------|-----------|
| Duration | 45 min (2700s) | 48 min (2880s) | Round number in bars at 88 BPM; more breathing room |
| BPM range | 88 fixed | 84-116 (gradual) | Supports emotional arc; Four Tet principle |
| Modal sequence | 6 modes | 6 modes (same) | Already well-designed |
| Hat behavior | Always on (velFloor 15) | ON from min 8, always on after | Hat entrance is an event |
| Climax position | pct 0.84 | pct 0.73-0.83 (plateau) | Hopkins principle: plateau not peak |
| False resolution | pct 0.75 (8 bars) | pct 0.73 (12 bars) | Longer, with harmonic shift |
| Seed motif | capture + return | capture + 5 recurrences | Floating Points principle |

### E.2 Per-Channel Recommendations

| Channel | v3 Behavior | v4 Enhancement |
|---------|-------------|----------------|
| CH0 PULSE | Pattern library, phrase gating | + timing directionality (ahead/behind beat per phase) |
| CH1 GRAIN | Always-on, phasing | + texture-to-rhythm continuum (scatter -> grid) |
| CH2 DRONE | Renewal every 4 bars | + 17-step prime loop, pitch bend drift |
| CH3 BASS | 7-step Markov | + ghost-to-accent promotion, bass cycle extension |
| CH4 CHORDS | Anchor voicings + cycle | + additive voicing entry (1 note at a time) |
| CH5 VOICE | 11-step Markov, seed capture | + call-response with CH6, seed recurrences |
| CH6 LEAD | 13-step Markov, angular | + contrary motion to CH5, sweep in climax |
| CH7 PERC | Glass additive entry | + 3:4 polyrhythm during groove, hemiola at climax |

### E.3 New Systems to Implement

1. **Timing Directionality Engine:** Replace fixed Gaussian jitter with directional timing that places notes ahead or behind the beat based on the current emotional phase.

2. **Breath Window System (Enhanced):** Three levels of "air" (micro/meso/macro) with deterministic macro-air events at 20%, 50%, 75% of arc.

3. **Seed Motif Expansion:** 5 recurrences at 15%, 35%, 55%, 75%, 95% of arc, with transformations (transpose, invert, retrograde, augment).

4. **Chord Additive Entry:** New chords build note-by-note over 16 bars (root -> root+5th -> root+3rd+5th -> full voicing).

5. **Call-Response Engine:** CH5 note triggers probabilistic CH6 response (prob 0.4, delay 200-500ms, harmonically constrained).

6. **Groove Evolution System:** Ghost note emergence, accent migration, bass cycle extension as continuous processes within each wave.

7. **Degradation Engine:** For dissolution: progressive timing scatter, velocity scatter, note-drop probability, chord note subtraction.

8. **Oblique Strategy Events:** Low-probability (0.03/bar) intentional "errors" that become features: out-of-scale notes, extreme durations, skipped chord changes.

### E.4 Parameters That Should NOT Change From v3

These systems are already well-designed:

1. **MacroComposer 4D checkpoint interpolation** -- the core architecture is sound
2. **Prime-length melody loops (7, 11, 13)** -- extend but do not replace
3. **EMA smoothing with tau=4.0s** -- correct smoothing constant
4. **Cubic Hermite ease for transitions** -- mathematically ideal
5. **Phase convergence hi-hat (8 vs 9 steps)** -- pure Reich implementation
6. **Glass additive percussion entry** -- elegant threshold-based system
7. **Voice-leading max 3 semitones** -- correct constraint
8. **Pivot note system** -- excellent harmonic bridge design
9. **Break system (probability 0.65, cooldown 10-20 bars)** -- well-tuned parameters
10. **Anchor voicing system with 5 voicings per mode** -- rich but constrained

---

## Sources

### Four Tet
- [NME: Four Tet Brixton Academy Review](https://www.nme.com/blogs/nme-blogs/four-tet-brixton-academy-2018-review-2388943)
- [RA: Four Tet Angel Echoes Breakdown](https://www.attackmagazine.com/technique/the-breakdown/four-tet-angel-echoes/2/)
- [RA: There Is Love In You Review](https://ra.co/reviews/7075)
- [MusicTech: 7 Production Techniques From Four Tet](https://musictech.com/tutorials/7-music-production-techniques-four-tet-three/)

### Nils Frahm
- [Medium: All Melody Analysis & Review](https://albumanalysis.medium.com/nils-frahm-all-melody-analysis-review-acf9a39fe972)
- [Spectrum Culture: All Melody Review](https://spectrumculture.com/2018/01/28/nils-frahm-melody/)
- [Crack Magazine: All Melody Review](https://crackmagazine.net/article/album-reviews/nils-frahm-all-melody/)

### Jon Hopkins
- [Uproxx: Hopkins on Tension in Singularity](https://uproxx.com/music/jon-hopkins-singularity-interview/)
- [RA: Singularity Album Review](https://ra.co/reviews/22428)
- [Wikipedia: Singularity](https://en.wikipedia.org/wiki/Singularity_(Jon_Hopkins_album))

### Floating Points
- [Wikipedia: Promises](https://en.wikipedia.org/wiki/Promises_(Floating_Points,_Pharoah_Sanders_and_the_London_Symphony_Orchestra_album))
- [Artforum: Promises Analysis](https://www.artforum.com/music/ft-on-pharoah-sanders-floating-points-and-the-london-symphony-orchestra-s-promises-85568)
- [NPR: Pharoah Sanders and Floating Points](https://www.npr.org/2021/03/24/980433831/pharoah-sanders-floating-points-promises-review-new-sounds)

### Ryuichi Sakamoto
- [Wikipedia: async](https://en.wikipedia.org/wiki/Async_(album))
- [The Creative Independent: Sakamoto Interview](https://thecreativeindependent.com/people/ryuichi-sakamoto-on-how-your-work-changes-as-you-get-older/)
- [PopMatts: async Review](https://www.popmatts.com/ryuichi-sakamoto-async-2495393803.html)

### Aphex Twin
- [Wikipedia: Selected Ambient Works Volume II](https://en.wikipedia.org/wiki/Selected_Ambient_Works_Volume_II)
- [Inverted Audio: SAW II Deep Dive](https://inverted-audio.com/feature/aphex-twin-selected-ambient-works-volume-ii/)

### Tim Hecker
- [Stereogum: Tim Hecker Albums Ranked](https://stereogum.com/1873977/tim-hecker-albums-from-worst-to-best/franchises/counting-down/)
- [Stoney Roads: Tim Hecker Interview](https://stoneyroads.com/2024/03/the-creativity-and-ferocity-of-tim-heckers-music-interview/)

### Olafur Arnalds
- [MusicRadar: Stratus Pianos Rig Tour](https://www.musicradar.com/news/rig-tour-olafur-arnalds-live-set-up-and-the-tech-behind-the-stratus-pianos)
- [ZoneOut: Stratus Reimagines the Piano](https://www.zoneout.com/stratus-olafur-arnalds-reimagines-the-piano/)

### Brian Eno
- [In Motion Magazine: Generative Music](https://www.inmotionmagazine.com/eno1.html)
- [Gorilla Sun: Eno's Endless Music Machines](https://www.gorillasun.de/blog/brian-enos-endless-music-machines/)
- [Wikipedia: Generative Music](https://en.wikipedia.org/wiki/Generative_music)

### Steve Reich
- [MIT OCW: Reich's Phases of Phases](https://ocw.mit.edu/courses/21m-260-stravinsky-to-the-present-spring-2016/8955ba59a6d14e1e40c5d86c5ed4dead_MIT21M_260S16_SteveReich.pdf)
- [Puget Sound: Phase Shifting](https://musictheory.pugetsound.edu/mt21c/PhaseShifting.html)
- [Wikipedia: Phase Music](https://en.wikipedia.org/wiki/Phase_music)

### Max Richter
- [Native Instruments: Composing for Sleep](https://blog.native-instruments.com/max-richter-composing-for-sleep/)
- [Wikipedia: Sleep](https://en.wikipedia.org/wiki/Sleep_(album))

### Burial
- [Attack Magazine: Burial-Style Reverb](https://www.attackmagazine.com/technique/tutorials/burying-the-mix-in-burial-style-reverb/)
- [MusicRadar: Burial Production](https://www.musicradar.com/artists/burial-repub)

### Compositional Technique
- [Point Blank: Tension and Release in EDM](https://www.pointblankmusicschool.com/blog/creating-tension-and-release-in-electronic-dance-music/)
- [EDMProd: Advanced Tension Guide](https://www.edmprod.com/tension/)
- [Ableton: Dramatic Arc](https://makingmusic.ableton.com/dramatic-arc)
- [Point Blank: Polyrhythms in Production](https://www.pointblankmusicschool.com/blog/exploring-polyrhythms-in-modern-music-production/)
- [SonalSystem: Mastering Micro-Timing](https://sonalsystem.com/blogs/frequencies/the-soul-of-the-machine-mastering-micro-timing-groove)
- [Sample Focus: Swing, Shuffle, Humanization](https://blog.samplefocus.com/blog/swing-shuffle-and-humanization-how-to-program-grooves/)

### Algorithmic Composition
- [Wikipedia: Algorithmic Composition](https://en.wikipedia.org/wiki/Algorithmic_composition)
- [Number Analytics: Art of Algorithmic Composition](https://www.numberanalytics.com/blog/algorithmic-composition-process-music-techniques)
- [GitHub: Machine Cycle (Markov Live Performance)](https://github.com/Satrat/machine-cycle)
