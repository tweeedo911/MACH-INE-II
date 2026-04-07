# MACH:INE III v4 — Visual Direction Research

*Research compiled: 2026-04-07*
*Scope: Contemporary AV performers, generative artists, graphic design lineage, abstract cinema, dot/halftone art history*
*Purpose: Build a unified visual alphabet for the MACH:INE III generative AV system, modeled after the v4 compositional research doc*
*Counterpart: RESEARCH-V4-COMPOSITIONAL-DIRECTION.md*

---

## Premise

MACH:INE III is a generative live audiovisual system: 7 tracks (NEBBIA → TESSUTO → SOLCO → RESPIRO → MACCHINA → TEMPESTA → RITORNO), ~45 minutes total, single Canvas 2D surface, zero GPU, zero bundler. The visual vocabulary is a single primitive — the **Bayer-dithered dot** — and a small composition library (`comp-quadrati`, `comp-linee`, `comp-treno`, `comp-griglia`, `comp-liminale`, `comp-negativo`).

The current state is technically excellent but compositionally incomplete:
- 7 distinct palettes are defined but visual *grammar* per track is shallow.
- Each `comp-*` already implements sediment trails, breathing field, glitch, and audio-reactive density.
- The "alphabet" is partial: dots exist as material but the *rules of arrangement* are still per-composition, not unified.

The diagnosis is the same one applied to the music in v4: **the architecture is brilliant, the orchestra is deaf**. Visually: the materials are right, the *director* is missing.

This document does for the visual side what RESEARCH-V4-COMPOSITIONAL-DIRECTION.md did for the music side. It extracts mechanics from artists who built worlds out of single primitives — and proposes a unified visual alphabet of ~30 operations, each cheap on Canvas 2D, each composable, each tied to a per-track signature.

The five core convictions, mirroring the compositional research:

1. **One primitive, infinite arrangement.** The dot is enough. Adding new primitives is a sign of failed composition.
2. **Composition in space, not random over time.** A 45-minute arc is a *trajectory* through parameter space, pre-composed and scored, not a state machine.
3. **The cut creates meaning.** Smooth transitions hide; hard cuts on phrase boundaries reveal. Reserve the smooth for *within* a track.
4. **One signal, two senses.** Audio and visual events share the same data structure at the source — not "audio-reactive smoothing" downstream.
5. **The frame is the unit.** Every one of the ~162,000 frames in the performance must be potentially distinct. Never drop, never repeat exactly.

---

## PART A: Live Audiovisual Performers — 14 References

### A.1 Ryoji Ikeda

**Key works:** *test pattern*, *datamatics*, *supercodex*, *superposition*, *data.matrix*

**Core insight: data as violence. Pure binary (0/1, black/white) pushed to the literal threshold of the eye and the machine.** The Bayer halftone field IS Ikeda's vocabulary at the syntactic level — a regular grid of binary cells. The lesson is in what he refuses: no curves, no gradients, no third color except when the third color is *alarm*.

**Techniques extractable for MACH:INE III:**

1. **Barcode sweep at sample-rate.** Force every Bayer cell to 0 or 1 (no dithered grey), arrange in horizontal stripes of varying thickness, scroll laterally at 1–2 cells per frame, locked to kick. The stripe widths are derived directly from a quantized audio buffer — never noise-generated. This is `data.tron` translated to a 2D grid.

2. **Strict B/W + emergency red.** Never mix hues for decoration. One foreground, one background, one accent color reserved for *one* state (rupture stage 3 = takeover). The accent is a punctuation mark, not a tone.

3. **Time-axis data scroll.** The grid is not static — it scrolls at a rate locked to BPM (e.g., one cell column per 8th note). Every frame shows a "new column of data." MACH:INE III's `comp-treno` parallax already implements this; extend it to be the dominant motion register for TEMPESTA and a sub-register for MACCHINA.

4. **Strobe ethics.** Ikeda's work comes with an epilepsy warning, but the strobe is dosed as content, not decoration — it always belongs to the *culmination*, never the opening gesture. Cap MACH:INE III's total high-flicker time per 45-minute set at <90 seconds total, reserved for TEMPESTA peak only.

**Concrete parameters for MACH:INE III:**
- TEMPESTA peak: barcode mode at 16th-note scroll, 100% binary cells, 0% dither, kick-locked
- All tracks: accent color reserved for rupture stage 3, never elsewhere
- Strobe budget: 90 seconds total per session, all in TEMPESTA, max 8 seconds continuous

---

### A.2 Alva Noto / Carsten Nicolai

**Key works:** *Vrioon* (with Sakamoto), *Univrs*, *Unitxt*; raster-noton design language

**Core insight: reduction as moral position.** The screen is mostly empty because *emptiness is the subject*. A single horizontal line is a sine wave. A single isolated dot is a click. The grid is shown as scaffolding — visible but unfilled — to imply a system you never see complete.

**Techniques extractable:**

1. **Sine-as-line, click-as-dot.** Each musical atom maps to one visual atom. A drone produces one persistent horizontal dot-line. A click produces one isolated dot-flash. No "particle field of generic reactivity." If the ear hears N events, the eye sees exactly N visual events.

2. **Show the scaffold.** Render the Bayer lattice itself at 5% opacity as a faint background — visible only by attention. The grid scaffold tells the viewer "this is a system." Then, when an event happens, it lights one cell *within* the visible scaffold. The lit cell vs the unlit grid is the entire image.

3. **Step-sequencer-as-row.** Place 16 large dots across the top edge of the canvas; light them in time with MIDI step. The rest of the canvas remains empty. The piece is the row.

4. **Sakamoto silence ↔ Nicolai noise.** When the music has a soloist, the visual is restrained almost to nothing. When the music is reduced to texture, the visual takes over. Counterpoint, not parallel.

**Concrete parameters:**
- RESPIRO and TESSUTO germoglio: render the Bayer scaffold at fg alpha 0.05 as background
- Step row mode (RESPIRO): 16 dots across top edge, lit by step counter
- "Sakamoto-silence" rule: when CH5 (VOICE) plays a phrase, *all* compositional mutations freeze for the duration of the phrase

---

### A.3 Ryoichi Kurokawa

**Key works:** *syn_*, *octfalls*, *unfold*, *constrained surface*

**Core insight: perceived 3D from a flat surface, sample-accurate audio-visual events, and a strict "spawn → crystallize → shatter" arc.** The visual rhythm is constant 1:1 events — never "ambient sparkle because music is happening."

**Techniques extractable:**

1. **Spawn → crystallize → shatter as visual motif unit.** Random Bayer cells (spawn), then snap-aligned to a diagonal/horizontal line (crystallize), then scattered back (shatter). Period: 4–8 bars. This is the basic "phrase" of the visual side. Every track has a different version of this arc.

2. **1:1 MIDI event coupling.** Every kick produces exactly one full-frame visual event (e.g., one Bayer threshold spike). Every hat produces exactly one cell flash. No decoupled animation between events. This is a hard rule, not a guideline.

3. **Soft field vs hard edge dialectic.** Particles + lines as paired registers, never both at full intensity simultaneously. Alternate on phrase boundaries. MACH:INE III's `breathingField` is the soft layer; the comp-* shapes are the hard layer.

4. **False parallax from offset duplicates.** Render the same dot field twice with a 3-cell horizontal offset and 200ms time delay. Costs near zero on Canvas 2D, produces convincing depth. Use sparingly.

**Concrete parameters:**
- All groove tracks (SOLCO, MACCHINA, TEMPESTA): every kick = one full-canvas Bayer threshold spike (1 frame)
- Phrase unit: spawn (4 bars random) → crystallize (4 bars line) → shatter (4 bars scatter)
- False parallax: enable for SOLCO densita phase (3-cell offset, 200ms delay)

---

### A.4 Herman Kolgen

**Key works:** *Inject*, *Aftershock*, *Dust*, *Seismik*

**Core insight: render the invisible visible.** Field recordings of physical phenomena (water, dust, seismic data) become X-ray imagery. The pacing is drone-slow with rare sharp events — the opposite of Kurokawa's constant rhythm.

**Techniques extractable:**

1. **Radiograph aesthetic.** High contrast, soft-edged, medical-imaging black-on-white. The halftone dot is already a radiograph primitive. Use white-on-dark for active tracks; *invert* (dark-on-white) for memory tracks (RITORNO).

2. **Long suspension, abrupt fracture.** Bayer field drifts at 0.5 cell/sec for 30+ seconds, no events; then one single-frame full-canvas white flash as a "crack." Pure Kolgen pacing. NEBBIA territory.

3. **Modular sequence bank.** Kolgen prepares a bank of 10–20 visual "sequences" of 30–90s each and remixes live. Translation: pre-compose 7–14 visual "states" per track and let the director select among them on phrase boundaries.

4. **Real physics as driver.** Seismik uses real seismic data as the direct generator. The lesson: when the driver is real (audio FFT, MIDI density, accelerometer), even simple visuals inherit credibility and variation.

**Concrete parameters:**
- NEBBIA germoglio: dot drift 0.5 cell/sec, sediment decay 0.97, breathing field 0.1 Hz
- "Crack" event: 1-frame full-white invert at probability 1/300s (~once every 5 minutes)
- RITORNO memory phase: invert background (black dots on cream/lavender) — radiograph mode

---

### A.5 Robert Henke (Lumière, CBM 8032 AV)

**Key works:** *Lumière* (laser vector), *CBM 8032 AV* (Commodore vintage tech)

**Core insight: the constraint IS the vocabulary.** CBM 8032 has only 64 PETSCII characters and a 25×80 grid; that's the alphabet. Lumière has only one laser scanner and audio-rate vector signals; that's the alphabet. The poverty is the discipline.

**Techniques extractable:**

1. **Treat the Bayer grid as a constrained alphabet.** Bayer 8×8 has only 64 threshold values — exactly like PETSCII. Compose as if you were writing on an 80-column terminal. Each "character" is a Bayer threshold pattern. MACCHINA should explicitly evoke text-mode aesthetic.

2. **Parametric path drawing.** Henke draws Lissajous curves with audio oscillators in X/Y. Translation to MACH:INE III: a "path" is a 1-line parametric equation (e.g., `x = sin(at), y = sin(bt + phi)`); dots are placed along the path. Two parameters (`a`, `b`) drive the entire shape. Add this as a render mode.

3. **Library of shape commands.** Henke has ~20 named shapes ("circle 5 7", "spiral 3 12"). Performance is selecting commands, not drawing. Translation: build a shape command dictionary; each MIDI note triggers a command from the dictionary. Composition = the dictionary + the trigger map.

4. **Beauty at the edges.** Push the system past its comfortable zone. Test minimum brightness, max modulation, max draw speed — artifacts become material. MACH:INE III's `bayerGlitch` is already this idea; formalize when to use it.

**Concrete parameters:**
- MACCHINA: render mode = "text-mode terminal", grid 80×24 of Bayer cells, each cell = one of 64 threshold patterns
- Lissajous path mode: pre-compute 12 Lissajous curves (a/b ratios from harmonic series), select per track
- Shape command dictionary: 16 named primitive paths, MIDI notes 60–75 trigger them

---

### A.6 NONOTAK (Noemi Schipfer & Takami Nakamoto)

**Key works:** *Daydream*, *Late Speculation*

**Core insight: light as architecture; count-based evolution.** The visuals don't decorate the space — they build it. From 1 line to 32 lines over 90 seconds, then back. All evolution by *count*, never by color or shape.

**Techniques extractable:**

1. **Parallel line accumulation.** Start with 1 dot-line (a row of Bayer cells), every 30 seconds double the count (2, 4, 8, 16, 32) until the accumulation reads as a solid plane. The reverse closes the section. Use for TESSUTO build and RITORNO collapse.

2. **Single parameter monotonic for 1–2 minutes.** Don't change shape mid-section; change one parameter (line count, rotation angle, spacing) monotonically. The audience perceives "something is happening" without identifying what. Then a single reset event, then a new parameter.

3. **Slow vanishing point migration.** The vanishing point (already in `comp-liminale`) drifts at 0.5 cell/sec — slower than perception. Returns to a corner over 60+ seconds. The viewer realizes the point moved only after looking away.

4. **Hold below threshold.** A held image with micro-modulation (1–2% cells toggling) reads as "static" but contains motion. The eye registers life without identifying movement. Use as the dominant rendering mode for NEBBIA and RESPIRO.

**Concrete parameters:**
- TESSUTO build: line count 1 → 2 → 4 → 8 → 16 → 32 over 5 minutes (one doubling per minute)
- NEBBIA dissoluzione: line count 32 → 16 → 8 → 4 → 2 → 1 over 3 minutes
- Vanishing point drift speed: 0.5 cell/sec maximum
- "Hold-below-threshold" mode: 1–2% cell toggles per frame, no other change

---

### A.7 Murcof + AntiVJ (Joanie Lemercier, Simon Geilfus)

**Key works:** Murcof live AV performances 2009–2014

**Core insight: slowness as technique.** A 70-minute performance whose visuals drift as slowly as the music; the audience's patience becomes part of the instrument. Sound-reactive but never 1:1 — events are smoothed over seconds.

**Techniques extractable:**

1. **Smoothed reactivity.** Audio events trigger parameter envelopes that complete over 3–5 seconds, not single frames. EMA tau = 4 seconds. The ear's transient becomes the eye's slow event.

2. **Drift as primary motion.** All ambient elements drift at <2 px/second. No cuts for 2–5 minutes. Motion budget for ambient layers: extremely low.

3. **Bleed past edges.** Render the dot field larger than the visible canvas (e.g., 110% × 110%) with camera offset, so dots cross the edges. The frame becomes a window, not a poster. Removes the "screen-edge anchor" feel.

4. **Low-contrast on faint background.** Avoid pure black background for ambient tracks. Use cream/sage/lavender at low luminance. The contrast is muted; the field feels closer to a print than a screen.

**Concrete parameters:**
- NEBBIA, RESPIRO, RITORNO: audio reactivity EMA tau = 4 seconds (currently 0.05–0.3)
- All tracks: render Bayer field at 110% canvas size with 5% camera drift
- NEBBIA palette experiment: instead of `bg #0A0A0A`, use `bg #1A1815` (warmer near-black) for "print-like" feel

---

### A.8 Max Cooper (with Maxime Causeret, Páraic & Kevin McGloughlin)

**Key works:** *Order from Chaos*, *Repetition*, *Emergence*

**Core insight: math and biology as narrative content.** Reaction-diffusion, cellular automata, recursive subdivision, image masking — abstract systems presented as protagonists, not background.

**Techniques extractable:**

1. **Reaction-diffusion as primary system.** Gray-Scott on a 80×45 grid produces organic, breathing spots/stripes (Turing patterns) from two simulated chemicals. Cheap on CPU. Threshold the output to drive Bayer opacity. Use for TESSUTO.

2. **Recursive quad-tree subdivision.** On each bar, split a random quadrant of the canvas into 4 sub-quadrants, each with its own Bayer scale. Builds visible hierarchy over time. Hierarchy is the composition. Use for MACCHINA.

3. **Frame-as-mask.** Capture an earlier track's output frame; use it as a mask to reveal/hide the current Bayer field. RITORNO becomes literal memory — the mask of an earlier moment shaping the current one.

4. **One thesis per track.** Every Cooper piece has one mathematical/philosophical thesis the visuals argue (emergence, infinity, Platonic form). Each MACH:INE III track must do the same: one concept the visuals *prove*, not decorate.

**Concrete parameters:**
- TESSUTO: Gray-Scott RD at 80×45, feed=0.04, kill=0.06, 2 update steps per frame
- MACCHINA: quad-tree subdivision at probability 0.3 per bar, max depth 4
- RITORNO: capture frame at min 12, 24, 36; mask current field at min 42 with stored frames

---

### A.9 Robin Fox (Single Origin, RGB Laser Show, Monochroma)

**Key works:** *Single Origin*, *Monochroma*, *RGB Laser Show*

**Core insight: the audio signal IS the image, with zero delay or abstraction.** A stereo waveform drives X/Y galvanometer mirrors. What you hear is literally the curve you see. There is no "audio-reactive subsystem" — only one unified signal flow.

**Techniques extractable:**

1. **Stereo → Lissajous trail.** Consume the last N samples of the audio analyser's L/R arrays, plot N dots at (L[i], R[i]) scaled to canvas. The trail naturally forms Lissajous patterns correlated 1:1 with stereo width. Free, beautiful, mechanically perfect.

2. **Monochrome as purity.** One color is stronger than three because three colors are editorial. Stay B/W where possible.

3. **No decorative layer.** No "background ambient" — the laser only draws what the signal describes. Black space is silence. Don't fill canvas just to fill it.

4. **Voltage = position.** Replace "audio-reactive smoothing" with direct sample → cell position mapping. Bypass the EMA layer for one mode.

**Concrete parameters:**
- New `comp-lissajous`: render mode that plots `(L[i], R[i])` per audio sample, scaled to canvas
- SOLCO densita phase: enable Lissajous mode as a secondary layer
- Rule: when audio RMS < 0.02, canvas must be visibly empty (no ambient filler dots)

---

### A.10 Rainer Kohlberger

**Key works:** *moon blink*, *Not Even Nothing Can Be Free of Ghosts*, *keep that dream burning*

**Core insight: perceptual overload as content.** The afterimage on the viewer's retina IS the artwork. Pure flicker, B/W gradients, no source footage. Algorithm-only.

**Techniques extractable:**

1. **Pulsating gradients, pure B/W.** Held gradient surfaces with high-frequency micro-modulation produce afterimages unique to each viewer. Use for NEBBIA opening minute and RESPIRO.

2. **Fine particle flicker.** Random 1–2% Bayer cell toggles per frame at high contrast — TV static aesthetic. Compose as a backdrop register, not a foreground.

3. **Sync flicker to audio pulse.** When flicker is used, align it precisely to audio pulse trains, not smoothed envelopes. The eye's flicker and the ear's pulse interact perceptually.

4. **Flicker dose budget.** Treat strobe like a drug. Maximum 8 seconds continuous, maximum 90 seconds total per 45-minute set, never in the first 10 minutes.

**Concrete parameters:**
- NEBBIA opening minute: held Bayer gradient with 1% cell toggles per frame
- TEMPESTA peak: 8-bar full-flicker mode synced tightly to kick (60% cell toggle per frame)
- Flicker dose tracker: hard cap at 90s/session, reset on session start

---

### A.11 Memo Akten (Learning to See, Deep Meditations)

**Key works:** *Learning to See*, *Deep Meditations*

**Core insight: precise trajectories through parameter space.** Not random interpolation between states — *specific journeys* through high-dimensional space corresponding to thematic stages. A piece is a path, not a state.

**Techniques extractable:**

1. **Parameter-space as the composition.** Define N visual parameters (density, contrast, camera distance, dot size, sediment decay, palette weight). The 45-minute arc is one continuous curve through this space, pre-composed offline.

2. **Scrubbable arc.** Build an offline preview mode that scrubs through the entire arc at 10× speed. Use it to compose the curve like film editing, not like writing live code.

3. **Slowness past comfort.** Transitions take 30–90 seconds. The test: if you blink and reopen your eyes, you can't tell if the image changed. Most of the audience adapts and learns to look harder.

4. **Continuous loop.** Deep Meditations is one 60-minute meditation, no cuts. Mirror this for at least one MACH:INE III section: NEBBIA → TESSUTO should be a single continuous parameter curve, no cut.

**Concrete parameters:**
- Build `arc-scrubber.html` that lets you scrub the 45-minute parameter trajectory at 10× speed
- NEBBIA → TESSUTO: no cut; one continuous parameter curve over the boundary
- Track-to-track parameter transitions: 30–90 seconds (currently <2 seconds in most places)

---

### A.12 Tarik Barri (Versum)

**Key works:** *Versum* — a 3D music sequencer where the camera flies through a virtual world

**Core insight: composition in space, not random over time.** Musical events have *positions* in a virtual 2D/3D world; the visual camera traverses the world at performance time. Position = composition.

**Techniques extractable:**

1. **Spatial timeline.** Pre-compose the 45-minute arc as a 2D map: place ~200 visual events as points along a horizontal timeline (1 cell = 8 seconds). The camera scrolls through the map at sequencer speed. Each event is a dot cluster, line, flash.

2. **Every visible object has a sound.** Inverse: every sound has a visible. No silent decoration, no soundless visuals. The rule is binding.

3. **Pre-built scene + live deviation.** The "arc" is a fixed scene; the live performer can deviate by sliding the camera path slightly. Composition + improvisation cleanly separated.

4. **Few primitives, used hundreds of ways.** Versum has stars, fields, explosions — that's it. Same lesson as the dot.

**Concrete parameters:**
- Build `score.json` with ~200 timed events (time, type, parameters)
- The director reads `score.json` and triggers events at exact times
- Generative layers fill the space *between* scored events

---

### A.13 United Visual Artists — Our Time, Momentum

**Key works:** *Our Time*, *Momentum*

**Core insight: rule, then violation.** Establish a visible physical law (pendulum swing, light beam) for 2–3 minutes. The audience's brain calibrates to expect gravity. Then quietly *break* the rule. The break is the climax.

**Techniques extractable:**

1. **Establish a rule, violate it once.** Show the Bayer grid behaving consistently for 2–3 minutes (e.g., all dots breathing at 0.1 Hz). Then have *one* dot do something impossible (stay frozen, accelerate to absurd speed, change color). The viewer's gut knows.

2. **Independent polyrhythms from N elements.** UVA's 21 pendulums each have their own period. Cloud of independent periodicities = polyrhythm without metric grid. Translation: 7 "swing lines" (one per memory of past tracks) each with its own period.

3. **Light cuts through smoke.** A line of dots whose density is modulated by 1D noise reads as a "beam" in volumetric space. Cheap, 2D, perceptually convincing.

4. **Time as medium.** UVA pieces work because the audience watches for 10+ minutes. The slow rule-then-break only works if the rule is felt for long enough first. 2–3 minutes minimum.

**Concrete parameters:**
- NEBBIA pulsazione: establish breathing at 0.1 Hz for 90 seconds, then violate one corner of the canvas (pause its breathing) for 16 bars
- RITORNO: 7 swing lines, one per past track, each with the BPM of the original
- "Light beam" mode: a vertical line of dots, density modulated by 1D Perlin along Y axis

---

### A.14 Akiko Nakayama (Alive Painting)

**Key works:** *Alive Painting* live performances; *Fluid2wave*

**Core insight: the material has a will of its own.** Fluids mixed in front of a macro camera generate emergent imagery the artist nudges but cannot fully control. Music is the hand that injects, not the cause of the effect.

**Techniques extractable:**

1. **Physics over animation.** Replace "audio-reactive density" with a small physics simulation (viscosity + surface tension + diffusion) whose parameters are what MIDI modulates. Visual feels alive, not reactive.

2. **Dendritic / DLA branching.** Diffusion-Limited Aggregation produces tree-like dendrites at ~1 cell/frame. Cheap, beautiful, organic. MIDI notes inject seeds; the field grows its own branches.

3. **Scale as architecture.** Macro lens transforms a paint drop into a planet. On a Bayer field, every cell-level event must be treated as architecturally significant. Never think "subpixel."

4. **Music nudges, material decides.** The hand of the artist is the MIDI composer. The fluid is the visual physics. The performance is upstream pressure, not downstream illustration.

**Concrete parameters:**
- TESSUTO + RITORNO: enable DLA mode — MIDI notes inject seeds, nearby random cells "stick" with prob 0.3 per frame
- Replace `audioDensity` with a 3-parameter physics: viscosity (cell→cell drift damping), surface tension (cell→cell attraction), diffusion (random walk magnitude)
- Each MIDI note = one DLA seed at the note's mapped (x, y)

---

## PART B: Generative Art & Plotter Lineage — Compositional Rules

The dot has been the primary material of generative art for 60 years. The rules from Vera Molnar (1968) to Tyler Hobbs (2021) all transfer directly to a Bayer dithering system because **the dot was always the unit, the grid was always the substrate**.

### B.1 Order disturbed by 1% (Vera Molnar)

**Principle:** Start from perfect order, subtract regularity under controlled parameters. *Never* start from chaos and organize. Order-to-disorder reads as intentional; the reverse reads as accidental.

**For MACH:INE III:** The Bayer grid is perfect order. Define a per-track "molnar" parameter: starting from rigid Bayer thresholds, displace dot positions by noise whose amplitude grows with phase progress (germoglio = 0, dissoluzione = max). Use a *spatial gradient* (disorder grows from center outward, or from one edge to the opposite) — not uniform noise. RITORNO is the natural Molnar candidate: the order of NEBBIA decays into the controlled disorder of memory.

**Concrete:** `disorderField(x, y, arc) = clamp(arc * dist_from_center(x,y), 0, 1)` → per-cell jitter amplitude.

### B.2 Systematic enumeration (Manfred Mohr, Sol LeWitt)

**Principle:** Each piece is a *rule index*, swept deterministically. "All cubes whose diagonals are visible." "All Bayer cells where (x+y) mod 4 == 0." The viewer reads the rule because the rule is legible.

**For MACH:INE III:** Each engine's composition is a one-paragraph rule, written in English first. Example: *"MACCHINA pulsazione = Bayer cells where (x+y) mod 4 == 0, with brightness modulated by kick and the entire grid scrolling 1 cell per beat."* If you can't write it in a sentence, cut it. Adopt this as a coding rule for `comp-*` files.

### B.3 Schotter — chaos gradient (Georg Nees)

**Principle:** Schotter (1968) is a 12×22 grid of squares; each square's rotation and position is perturbed by noise that grows linearly with the row index. *Linearly increasing chaos along an axis* is the most influential generative composition.

**Concrete:** Map "row index" to phase time (germoglio → dissoluzione). Each Bayer cell gets per-cell rotation + position noise proportional to phase progress. Already partially in place via sediment trails; formalize it. ABISSO/NEBBIA dissoluzione = pure Schotter.

### B.4 Markov fields (Hiroshi Kawano)

**Principle:** Each cell's state depends on its left + above neighbors plus a transition matrix. Different matrices give different "statistical signatures."

**Concrete:** Augment the Bayer threshold lookup with a *Markov-transition dither*: each dot's ON/OFF state depends on the 2 neighbors plus the Bayer threshold. Transition matrix per engine. VORTICE could have circular correlations, TERRENO vertical streaks. Nearly free in CPU.

### B.5 Flow field with collision avoidance (Tyler Hobbs)

**Principle:** Curl noise at scale ~0.003. Walkers traverse the field laying bands. A spatial hash prevents overlap. Output is organic *because the rules are rigid*. 5–9 colors max.

**For MACH:INE III:** Already have a 32px spatial hash. Add a flow-field walker that writes dot density into the Bayer mask. Hatching at 30°/60° angles (anisotropic Bayer stamps). Use for SOLCO bass lines and RITORNO memory traces.

### B.6 Profile stack / horizon (Matt DesLauriers, Meridian)

**Principle:** Stack of N horizontal bands, each a 1D noise walk. Foreground bands more detailed, background bands smoother. Built from line/dot density only — no solid fills.

**For MACH:INE III:** This is the canonical "horizon" composition. NEBBIA opening uses this naturally. Formalize as `comp-horizon` (stacked 1D bands of varying noise frequency).

### B.7 Substrate walker (Jared Tarbell)

**Principle:** Lines walk in cardinal directions. On collision, terminate and spawn two new walkers at 90° off the hit point. Produces organic city-map patterns from one rule.

**For MACH:INE III:** Implement with Bayer-grid-snapped walkers. Walker moves dot-by-dot, terminates on collision, spawns orthogonal children. Architectural patterns for free, near-zero CPU. Use for MECCANICA/MACCHINA territory.

### B.8 Differential line growth (Anders Hoff, inconvergent)

**Principle:** A closed curve grows by inserting new points between existing ones; nearby points repel each other. The curve becomes increasingly convoluted under tension.

**For MACH:INE III:** Implement once and use for bass/lead melodic lines as visual traces. Each MIDI bass note inserts a point into a growing curve; the curve is rendered as dots along its path. Memory of phrases as visible coastline.

### B.9 Cross-hatching at 4 angles (plotter community)

**Principle:** Tone via line density. Overlay 2–4 hatching layers at 0°, 45°, 90°, 135° to build gray. Each layer is thin; composition creates the gradient.

**For MACH:INE III:** Define 4 anisotropic Bayer threshold matrices (line-hatched at 0/45/90/135). Per-zone selection adds 4 new textures with zero new logic. Currently the Bayer 8×8 is isotropic; this is the missing variant.

### B.10 Hilbert / meander fill order (plotter community)

**Principle:** Draw dots in a connected path (Hilbert curve, snake, spiral) instead of scatter-drawing. On a plotter this saves pen time; on Canvas 2D it improves cache locality and creates a "flowing pen" aesthetic when the field is partial.

**For MACH:INE III:** Pre-compute a Hilbert curve per canvas resolution. Use the curve order for drawing during slow render passes (NEBBIA, RESPIRO). The viewer doesn't see the Hilbert order at full density, but at low density the field "draws itself" along the curve.

### B.11 Peg-and-string (Dmitri Cherniak, Ringers)

**Principle:** N pegs, a wrapping permutation, dots along the string paths. Two parameters generate infinite variation. Cherniak: "ruthlessly cut parameters."

**For MACH:INE III:** One engine (suggest CRISTALLO/SOLCO) uses anchor points + string paths. The string is a sequence of Bayer cells; the anchors are MIDI note positions. Bass voice leading becomes literal string wrapping.

### B.12 Phase field over grid (Saskia Freeke)

**Principle:** Audio drives *phase*, not amplitude. Each Bayer cell's threshold oscillates with a phase = f(x, y, audio_band). Choreographed wave motion from a static grid.

**For MACH:INE III:** Underexplored. Add a "phase field" mode where Bayer threshold per cell = `0.5 + 0.5 * sin(t * 2π * f + phaseField(x,y))`. Audio modulates the spatial phase function, not the amplitude. Produces wave-like motion across the entire grid.

### B.13 Force-directed web (Tomás Saraceno)

**Principle:** N nodes, K-nearest connections, edges as thin lines. Force-directed equilibrium gives natural spacing without uniform grid. Density = K. Emptiness dominates.

**For MACH:INE III:** A "web" engine fits SOLCO or CRISTALLO. Nodes = current MIDI notes; edges = K-nearest based on pitch distance. Lines rendered as densely packed dots. Depth illusion via dot size variation along the edge.

### B.14 Risograph misregistration (Lucie Birant, Tyrell Waiters)

**Principle:** The Risograph prints layers separately with inevitable misregistration. The fringe IS the aesthetic. 2–3 spot colors, paper as third color.

**For MACH:INE III:** All 7 palettes are *already* Risograph-style (2 spot colors + paper). Add the missing piece: render the accent color on a Bayer grid offset by 1–2 cells from the primary. Instant Risograph fringe with one parameter change.

---

## PART C: Graphic Design — 7 Designers, 7 Tracks

The user's reference is "Pinterest moodboard contemporary graphic design." The 7 tracks each have a distinct palette already. Each can be cast as a "page" from a different designer's work — making the album literally a 7-chapter graphic publication.

### C.1 Josef Müller-Brockmann → MACCHINA

**Principle:** The grid is a moral instrument. 6/12 column grids with mathematical proportions. Geometry as the visible body of music (his Stockhausen and Beethoven posters). Zero ornament.

**Apply:** MACCHINA's Bayer grid is divided into 12 columns; all forms align to those columns. Forms are arcs, lines, rectangles, derived from audio features (BPM = arc radius, RMS = line thickness). The composition is a *diagram of the music*, not decoration.

### C.2 Karel Martens → TESSUTO

**Principle:** Letterpress + grid + found objects. One module rotated, scaled, translated — but never modified internally. Variation is positional, not formal. Color as numerical rule (60% cyan, 30% magenta, 10% yellow), not gusto.

**Apply:** TESSUTO uses ONE shape (e.g., a small block of 16 Bayer cells) repeated across a 12-column grid with rotation/scale variation driven by MIDI. The composition is the repetition, not the shape. Color rule: 60% lime (`#CDD71D`), 30% cream (`#EFE6DE`), 10% licorice (`#20130D`).

### C.3 Wolfgang Weingart → MACCHINA densita / TEMPESTA

**Principle:** Hack the Swiss grid from inside. Moiré of two halftone screens at slightly different angles. Aggressive scale variation (giant dots + tiny dots in same composition). Disalignment as content.

**Apply:** MACCHINA densita: render two Bayer matrices simultaneously at angles 0° and 15°, producing visible moiré. TEMPESTA: aggressively mix Bayer 4×4 (giant dots) and Bayer 16×16 (tiny dots) in different zones.

### C.4 Karel Martens / El Lissitzky → SOLCO

**Principle (Lissitzky):** 2 forms as protagonists. *About 2 Squares* tells a story with one black and one red square crossing the world. Forms have *identity* and *narrative*.

**Apply:** SOLCO's two main visual elements (one orange `#FE6B0D`, one lime `#CDD71D`) behave as recurring characters. They have positions, encounters, separations. The dub groove is their dialogue. Pre-compose ~12 narrative beats for the pair across SOLCO's 6 minutes.

### C.5 Kenya Hara → RESPIRO

**Principle:** *Ma* (間) — emptiness as content. 90% void. One single point of attention. Texture instead of image. Muji's white attentiveness.

**Apply:** RESPIRO is *the* Hara track. Density cap 10%. One single "point of accadimento" per phrase. Sage background `#7BBA91` is the carta. The dot is the smallest possible mark. The silence is the score.

### C.6 Rodchenko + Yokoo → TEMPESTA

**Principle (Rodchenko):** Asymmetric diagonals, large flat blocks of contrasting color, rosso/nero. (Yokoo: when you break minimalism, break it totally — saturated density as gesture.)

**Apply:** TEMPESTA black/white/red. Diagonal compositions, large blocks (not detail). Rupture stage takeover = full Yokoo density (100% Bayer fill, all three colors saturated). The escape valve from the Hara/Schmid restraint of other tracks.

### C.7 Helmut Schmid + Experimental Jetset → RITORNO

**Principle:** Maximum 3 scales, strict alignment to 2–3 axes. Modular reduction. The text is the image. Cross-cultural restraint.

**Apply:** RITORNO uses only 3 dot sizes, all aligned to 3 vertical axes. Composition is text-block-like rectangles of varying density. The "memory" of past tracks appears as small justified blocks at corner alignments.

### C.8 Cross-track principles (Risograph, Müller-Brockmann)

**Density caps per track** (from Hara → Yokoo gradient):
- RESPIRO: 10% maximum density
- NEBBIA: 25%
- RITORNO: 30%
- TESSUTO: 45%
- SOLCO: 50%
- MACCHINA: 55%
- TEMPESTA: 70% (with 100% allowed only in rupture takeover)

**Misregistration** (Risograph): all tracks render the accent color on a Bayer grid offset by 1–2 cells from the primary. Hard rule.

**Grid columns per track** (Müller-Brockmann discipline):
- NEBBIA, RESPIRO, RITORNO: 6 columns (sparse, wide modules)
- TESSUTO, SOLCO: 8 columns
- MACCHINA, TEMPESTA: 12 columns

---

## PART D: Visual Time — Lessons from Abstract Cinema

Compositional time is the most underdeveloped dimension of MACH:INE III. The current sequencer thinks in audio bars. Abstract cinema (1921 → 2020) developed a parallel literature on visual time that is directly applicable.

### D.1 The frame is the unit (Brakhage, Kubelka)

**Principle:** On 60fps × 45 minutes = 162,000 frames. You won't author each one. But every frame should be *potentially* distinct. Seed-per-frame hashing. Never drop a frame. Protect the render pass.

**Concrete:** Add a per-frame seed from `(performance.now() | 0)` to every comp-* file. Random calls become deterministic but unique per frame. No two frames identical at rest.

### D.2 Structure is prior to material (Frampton, Kubelka, Eisenstein)

**Principle:** Decide the *shape* of 45 minutes on paper first. Score the structural pivots (~40–60 moments). Generate freely between them.

**Concrete:** Build `score.json` with ~60 timed pivots (time, type, parameters). The director reads it and triggers pivots at exact times. Generative layers fill the space *between* scored events. This is Tarik Barri's spatial timeline + Frampton's a priori structure.

### D.3 Five types of montage (Eisenstein)

**Principle:** Run four independent "cut" streams:
- **Metric** — cuts on fixed bar counts (pure pulse)
- **Rhythmic** — cuts on audio onsets
- **Tonal** — cuts driven by brightness derivative
- **Intellectual** — cuts on narrative arc phase

**Concrete:** Each track privileges ONE montage type: NEBBIA = tonal, TESSUTO = intellectual, SOLCO = rhythmic, MACCHINA = metric, TEMPESTA = mix all four (Vertov machine perception), RITORNO = intellectual + tonal.

### D.4 The cut creates meaning (Kuleshov, Eisenstein)

**Principle:** Smooth transitions hide; hard cuts reveal. Reserve hard cuts for structural boundaries (track transitions, rupture stages). Within a track, transitions are smooth. At track boundaries, *collision*.

**Concrete:** Currently track transitions are mostly smooth interpolation. Make NEBBIA → TESSUTO and TEMPESTA → RITORNO into hard cuts (1-frame full reset). The contrast does the work.

### D.5 Mathematical sequences (Conrad, Sharits, Kubelka)

**Principle:** Primes, Fibonacci, Cantor sets produce temporal textures impossible to reach intuitively. Use for TEMPESTA peak and MACCHINA rhythmic grids.

**Concrete:** Define TEMPESTA peak flicker as a Fibonacci sequence: hold 1 frame, invert 1, hold 2, invert 3, hold 5, invert 8... Total ~60 seconds. The audience perceives a non-pulsed rhythm building.

### D.6 Sustained duration is a form (Snow, Belson, Akten)

**Principle:** A held image with micro-modulation, sustained for 60+ seconds, becomes architectural. The viewer adapts and looks deeper. Most generative AV systems cut every 5 seconds; the rare ones hold for minutes.

**Concrete:** Plan at least two single-composition holds of 60+ seconds across the 45 minutes. RESPIRO entire (~3 minutes single composition), and RITORNO memory phase (60+ seconds before final drift).

### D.7 The black frame is not silence (Kuleshov, Lye, Kubelka)

**Principle:** Pure black is a cognitive event, not a failure state. The viewer's brain fills the gap. Use as punctuation.

**Concrete:** Insert 1–4 frame black holds at structural pivots (every track transition gets 2 black frames). The "mirror" of the silence rule from the compositional research.

### D.8 Direct film technique — scratch as subtraction (McLaren, Lye)

**Principle:** Glitch is *removal*, not addition. The audience feedback was explicit: "glitch = rottura grammatica, NON accumulo effetti." Subtract dots along an audio-driven vector. Less, not more.

**Concrete:** Refactor `bayerGlitch` so its primary effect is *removing* a strip of dots, not adding noise. The strip is a horizontal slice 8–16 cells tall, 50% removed for 1 frame. Cleaner, more violent, less cluttered.

### D.9 Memory as material (Smith, West, Brakhage, McGloughlin)

**Principle:** Sediment, residue, ghost layers. Never fully wipe state across a performance. Each track should leave traces affecting the next. RITORNO is then *literally the memory of the first 38 minutes*, not arbitrary nostalgia.

**Concrete:** Capture frame snapshots at min 6 (NEBBIA), 14 (TESSUTO), 22 (SOLCO), 30 (MACCHINA), 36 (TEMPESTA). RITORNO renders these snapshots as faint masks (alpha 0.05–0.15) revealing the current Bayer field. The viewer who watched the whole set sees their own attention reflected.

### D.10 Reveal the apparatus (Vertov, Steyerl, Paglen)

**Principle:** Occasionally show the raw Bayer matrix, the naked grid, the unmodulated field — as a structural gesture, not a debug screen. Transparency as rigor.

**Concrete:** Once per session (suggest at the boundary RESPIRO → MACCHINA), render the canvas as the *raw 64-cell Bayer threshold map* for 4 frames. The grid declares itself.

---

## PART E: The Visual Alphabet for MACH:INE III

The goal: a finite, composable, programmable set of operations on the Bayer dot grid. Each operation is named, cheap (~1 ms or less), and orthogonal — they combine without conflicting.

### E.1 The 30 atomic operations

| # | Name | Description | Cost | Source |
|---|------|-------------|------|--------|
| 1 | `bayer_threshold(t)` | Set global Bayer threshold (already exists) | 0 ms | base |
| 2 | `dot_quantize(grid_x, grid_y)` | Snap dots to a coarser meta-grid | 0.1 ms | Lichtenstein |
| 3 | `disorder_field(amount, gradient_axis)` | Per-cell jitter with spatial gradient | 0.3 ms | Molnar / Polke |
| 4 | `chaos_gradient(arc, axis)` | Schotter — increasing rotation/displacement along an axis | 0.4 ms | Nees |
| 5 | `markov_dither(matrix)` | Per-cell ON/OFF depends on neighbors via transition matrix | 0.5 ms | Kawano |
| 6 | `tile_library_swap(library, weights)` | Swap the entire Bayer matrix from a library of N | 0.1 ms | Schwartz |
| 7 | `flow_walker(scale, count)` | Curl-noise walkers laying dot bands with collision avoidance | 1.2 ms | Hobbs |
| 8 | `peg_string(anchors, perm)` | Dots along path wrapping N anchor points | 0.3 ms | Cherniak |
| 9 | `profile_stack(bands, frequency)` | Stacked 1D noise bands as horizon layers | 0.4 ms | DesLauriers |
| 10 | `phase_field(x, y, audio_band)` | Per-cell threshold from sin(phase function) | 0.6 ms | Freeke |
| 11 | `differential_line(stroke_id)` | Closed curve growing by point insertion + repulsion | 0.8 ms | inconvergent |
| 12 | `substrate_walker(spawn_rate)` | Grid-snapped walker with orthogonal collision-spawn | 0.4 ms | Tarbell |
| 13 | `crosshatch_4angle(angle_idx)` | Anisotropic Bayer matrix at 0/45/90/135 | 0.1 ms | plotter |
| 14 | `hilbert_fill(t)` | Draw dots in Hilbert curve order, partial render | 0.3 ms | plotter |
| 15 | `force_web(nodes, k_nearest)` | K-nearest force-directed graph rendered as dot edges | 1.0 ms | Saraceno |
| 16 | `riso_offset(layer, dx, dy)` | Render accent layer offset by N cells | 0.0 ms | Risograph |
| 17 | `lissajous_trail(L, R, n_samples)` | Plot N dots at (L[i], R[i]) | 0.4 ms | Robin Fox |
| 18 | `barcode_sweep(scroll_speed)` | Pure binary horizontal stripes scrolling | 0.2 ms | Ikeda |
| 19 | `step_row(steps_lit)` | 16 dots top edge, lit by sequencer step | 0.0 ms | Nicolai |
| 20 | `parallax_offset(dx, dy, dt)` | Render the same field twice with offset + delay | 0.6 ms | Kurokawa |
| 21 | `radiograph_invert()` | Swap fg/bg for the entire field | 0.0 ms | Kolgen |
| 22 | `sequence_bank(state_idx)` | Switch to one of N pre-composed visual states | 0.0 ms | Kolgen |
| 23 | `text_mode_grid(80, 24)` | Render canvas as 80×24 grid of Bayer characters | 0.4 ms | Henke CBM |
| 24 | `parametric_path(a, b, phi)` | Draw dots along Lissajous/spirograph curve | 0.5 ms | Henke Lumière |
| 25 | `count_evolution(target_count)` | Monotonic build/decay of N parallel lines | 0.2 ms | NONOTAK |
| 26 | `vanishing_drift(x, y, speed)` | Slow vanishing point migration | 0.1 ms | NONOTAK |
| 27 | `reaction_diffusion(feed, kill)` | Gray-Scott on 80×45 grid → Bayer mask | 1.5 ms | Causeret |
| 28 | `quad_subdivision(prob, depth)` | Recursive quad-tree with per-cell Bayer scale | 0.3 ms | Cooper |
| 29 | `frame_mask(stored_frame_id)` | Use a stored past frame as mask for current render | 0.4 ms | McGloughlin |
| 30 | `dla_seed(x, y)` | Seed a diffusion-limited aggregation point | 0.2 ms | Nakayama |

**Total budget if all enabled simultaneously:** ~10 ms, leaving ~6 ms of headroom in the 16 ms frame budget. **Never enable all simultaneously.** Each track uses 4–6.

### E.2 The 10 cross-cutting laws (Synthesis)

These come from the artist research consolidated into a flat ruleset.

1. **One signal, two senses.** The audio buffer is the visual input at sample level. Build a function that takes an audio sample and writes a cell position. Never decouple.
2. **Few primitives, infinite arrangement.** One vocabulary (the dot) used in 5–10 strict modes. Adding primitives is failed composition.
3. **1:1 events, never ambient sparkle.** Every MIDI note produces exactly one visible frame event.
4. **Slowness as content.** A parameter holds for 60–120 seconds when possible. RESPIRO/NEBBIA: <2 mutations/minute.
5. **Rule, then violation.** Establish a visible logic for 2–3 minutes; then quietly break it once. Climaxes are violations.
6. **Physics-driven beats noise.** Hook visuals to a simulation (RD, DLA, force-directed) — noise always reads as noise.
7. **The strobe is a drug.** Total flicker time per session capped (90s), reserved for peak.
8. **Composition in space, not random over time.** Pre-compose the arc as a trajectory; scrub it offline.
9. **The cut creates meaning.** Hard cuts at structural boundaries; smooth within tracks.
10. **Memory is material.** Sediment, frame snapshots, ghost layers. Never fully wipe state across a performance.

---

## PART F: 7-Track Visual Score

The casting of artists, atomic operations, and density caps per track. This is the visual analogue of the 5-movement compositional structure in RESEARCH-V4-COMPOSITIONAL-DIRECTION.md.

### Track 1 — NEBBIA (0:00–4:48) — "Ti ambienta"

**Designer:** Hofmann + Hara
**AV reference:** Kolgen (slow suspension) + NONOTAK (parallel count)
**Generative reference:** Molnar (1% disorder) + DesLauriers (profile stack)
**Cinema reference:** Lye (figure on void) + Brakhage (closed-eye vision)
**Dominant verb:** *hold*

**Density cap:** 25%
**Grid:** 6 columns × 4 rows
**Atomic ops:** `profile_stack` (4 bands, freq=0.02), `disorder_field` (0.05, growing), `phase_field` (0.1 Hz), `vanishing_drift` (0.5 cell/sec)
**Composition rule (one paragraph):** *"NEBBIA is a stack of 4 horizontal noise bands, drifting at 0.5 px/sec, with a vanishing point migrating slowly toward a corner over 4 minutes. Each MIDI note from CH5 places a single dot at the perspective-mapped position. The Bayer scaffold is visible at 5% opacity. The audience must lean in."*
**Hard rules:**
- Audio reactivity EMA tau = 4 seconds (smoothed, never instant)
- Maximum 2 visual mutations per minute
- Bayer scaffold visible at 5% opacity throughout
- Density never exceeds 25%; first 60 seconds capped at 5%

### Track 2 — TESSUTO (4:48–10:24) — "Qualcosa emerge"

**Designer:** Karel Martens
**AV reference:** Cooper/Causeret (reaction-diffusion) + Nakayama (DLA)
**Generative reference:** Tarbell (substrate) + Hobbs (flow field)
**Cinema reference:** Whitney (mandala arc) + Eggeling (emerge-hold-dissolve)
**Dominant verb:** *grow*

**Density cap:** 45%
**Grid:** 8 columns × 6 rows
**Atomic ops:** `reaction_diffusion` (feed=0.04, kill=0.06), `dla_seed` (per MIDI note), `count_evolution` (1→32 over 5 min), `tile_library_swap`
**Composition rule:** *"TESSUTO is a Gray-Scott reaction-diffusion field on an 80×45 grid, modulating Bayer opacity. MIDI notes inject DLA seeds that grow tree-like dendrites over 30 seconds. Every minute, the parallel-line count doubles (1→32) until densita."*
**Hard rules:**
- One module shape (16-cell block) repeated across the 8-column grid (Martens rule)
- Color discipline: 60% lime, 30% cream, 10% licorice
- Modal change at 14:00 = visual mode switch (RD → DLA only)

### Track 3 — SOLCO (10:24–16:24) — "Ti cattura"

**Designer:** El Lissitzky (2 forms as protagonists)
**AV reference:** Robin Fox (Lissajous trail) + UVA (polyrhythmic pendulums) + Henke (shape commands)
**Generative reference:** Cherniak (peg-string) + inconvergent (differential line)
**Cinema reference:** Reich/Riley (phase shifting)
**Dominant verb:** *loop*

**Density cap:** 50%
**Grid:** 8 columns × 6 rows
**Atomic ops:** `lissajous_trail` (audio L/R, 256 samples), `peg_string` (8 anchors), `differential_line` (bass voice trace), `parallax_offset` (3 cells, 200ms)
**Composition rule:** *"SOLCO has two protagonist forms — one orange, one lime — that dance around 8 fixed anchor points. Bass notes wrap strings between anchors; the Lissajous trail tracks audio L/R as a third element. False parallax via 3-cell offset gives shallow depth. The dub groove is the dialogue between the two forms."*
**Hard rules:**
- Two visible forms at all times (orange + lime)
- Each form has a position, encounters, separations across 12 narrative beats
- Lissajous trail mode enabled in densita phase
- Camera laterale parallax (already in `comp-treno`) reused as accompaniment register

### Track 4 — RESPIRO (16:24–19:06) — "Pausa"

**Designer:** Kenya Hara (Muji *ma*)
**AV reference:** Nicolai (empty grid) + NONOTAK (held line) + UVA (rule violation)
**Generative reference:** Agnes Martin (near-empty grid)
**Cinema reference:** Snow (single move) + Conrad (frame as unit)
**Dominant verb:** *withhold*

**Density cap:** 10%
**Grid:** 6 columns × 4 rows
**Atomic ops:** `step_row` (16 dots top edge), `bayer_threshold` (held), `disorder_field` (0.02), `radiograph_invert` (once)
**Composition rule:** *"RESPIRO is 90% empty. One single point of attention per phrase. The Bayer scaffold is visible. The step row at the top edge lights with the sequencer. After 90 seconds of held breathing at 0.1 Hz, one corner stops breathing and stays frozen for 16 bars (UVA rule violation). The silence is the score."*
**Hard rules:**
- Density never exceeds 10%
- One single visual event per phrase (matches musical sparseness)
- Background = sage `#7BBA91` (carta colorata, not black)
- 90 seconds of stable breathing then a single rule-break

### Track 5 — MACCHINA (19:06–25:06) — "Sei dentro"

**Designer:** Müller-Brockmann + Weingart
**AV reference:** Henke CBM 8032 (text-mode terminal) + Kurokawa (1:1 events) + Cooper (recursive subdivision)
**Generative reference:** Mohr (systematic enumeration) + Tarbell (substrate)
**Cinema reference:** Vertov (machine perception) + Eisenstein (metric montage)
**Dominant verb:** *iterate*

**Density cap:** 55%
**Grid:** 12 columns × 8 rows
**Atomic ops:** `text_mode_grid` (80×24), `crosshatch_4angle` (rotate per beat), `quad_subdivision` (depth 4), `barcode_sweep` (densita)
**Composition rule:** *"MACCHINA is a CBM 8032 text-mode terminal. The 12-column grid carries Bayer 'characters'. Cross-hatching rotates one angle per beat (0/45/90/135). Quad-tree subdivision builds visible hierarchy across the densita phase. Every kick triggers exactly one full-grid spike. Geometry is the music made visible — Müller-Brockmann's Stockhausen poster, executed in real time."*
**Hard rules:**
- All forms align to 12-column grid
- 1:1 MIDI event coupling: each kick = one visible frame event, no decoupled animation
- Cross-hatch angle changes on each beat (4 angles cycling)
- Recursive subdivision visible during densita

### Track 6 — TEMPESTA (25:06–31:18) — "Balli"

**Designer:** Rodchenko + Yokoo
**AV reference:** Ikeda (barcode sweep) + Kohlberger (full flicker) + Robin Fox (raw signal)
**Generative reference:** Hirst (clinical grid)
**Cinema reference:** Conrad (flicker as content) + Sharits (mathematical sequences)
**Dominant verb:** *overwhelm*

**Density cap:** 70% (100% allowed only in rupture takeover)
**Grid:** 12 columns × 8 rows
**Atomic ops:** `barcode_sweep` (16th-note scroll), `flicker_pure_random`, `radiograph_invert` (Fibonacci-timed), `parametric_path`
**Composition rule:** *"TEMPESTA is Ikeda's data.matrix scaled to a single canvas. Pure binary cells, horizontal barcode sweeps locked to kick. In the climax (rupture takeover), 8 bars of pure flicker mode at 60% cell toggle per frame. Inversion follows a Fibonacci sequence: hold 1, invert 1, hold 2, invert 3, hold 5, invert 8. Black, white, red. Diagonal gestures (Rodchenko). The escape valve from minimalism."*
**Hard rules:**
- Strobe budget: max 8 seconds continuous flicker
- Total flicker time across TEMPESTA: 60 seconds maximum
- Red accent reserved for rupture stage 3 (takeover) only
- Yokoo permission: density 100% allowed for 16 bars in rupture takeover

### Track 7 — RITORNO (31:18–37:18) — "Ti rilascia"

**Designer:** Helmut Schmid + Experimental Jetset
**AV reference:** Akten (latent space scrub) + McGloughlin (frame masking) + Barri (spatial revisit) + Kolgen (radiograph inversion)
**Generative reference:** Molnar (1% disorder, decayed)
**Cinema reference:** Snow (single zoom) + Smith (symbol as anchor)
**Dominant verb:** *remember*

**Density cap:** 30%
**Grid:** 6 columns × 4 rows
**Atomic ops:** `frame_mask` (snapshots from min 6, 14, 22, 30, 36), `radiograph_invert`, `disorder_field` (Molnar decay), `vanishing_drift` (return to start)
**Composition rule:** *"RITORNO is the literal memory of the past 31 minutes. Frame snapshots captured at min 6, 14, 22, 30, 36 are rendered as faint masks (alpha 0.05–0.15) over the current Bayer field. The mode shifts to radiograph (dark dots on cream/lavender). The vanishing point returns to the position it had in NEBBIA. Three dot sizes maximum, all aligned to 3 vertical axes (Schmid)."*
**Hard rules:**
- 5 frame snapshots reused as masks
- Maximum 3 dot sizes
- 3 vertical alignment axes only
- Final 30 seconds: density decays to 0, single dot remains, then black

---

## PART G: Visual Time Score (Structural Pivots)

A pre-composed score of ~60 visual events across 45 minutes. The director reads this and triggers events at exact times. Generative layers fill the space between scored events.

| Time | Track | Event | Type |
|------|-------|-------|------|
| 0:00 | NEBBIA | Open: 5% Bayer scaffold + 1 dot | start |
| 0:30 | NEBBIA | First profile band emerges (line 1) | count_evolution |
| 1:30 | NEBBIA | 2 lines visible | count_evolution |
| 3:00 | NEBBIA | 4 lines visible | count_evolution |
| 4:48 | TESSUTO | HARD CUT (Eisenstein collision) | structural |
| 5:00 | TESSUTO | RD field becomes visible | reaction_diffusion |
| 6:00 | TESSUTO | Snapshot capture #1 | memory |
| 7:00 | TESSUTO | Modal change visual: RD → DLA | mode switch |
| 9:30 | TESSUTO | Density peaks at 45% | peak |
| 10:24 | SOLCO | HARD CUT | structural |
| 11:00 | SOLCO | Two protagonists appear | narrative |
| 12:30 | SOLCO | First encounter of forms | narrative |
| 14:00 | SOLCO | Snapshot capture #2 | memory |
| 14:30 | SOLCO | Lissajous trail enabled | render mode |
| 15:30 | SOLCO | Forms separate (densita) | narrative |
| 16:24 | RESPIRO | HARD CUT + 2 black frames | structural |
| 16:30 | RESPIRO | Step row visible | scaffold |
| 17:00 | RESPIRO | First single dot of attention | event |
| 18:00 | RESPIRO | Rule violation: corner freeze | UVA |
| 19:06 | MACCHINA | HARD CUT | structural |
| 19:30 | MACCHINA | Text-mode grid established | render mode |
| 20:00 | MACCHINA | Cross-hatch starts cycling | iteration |
| 21:00 | MACCHINA | Quad subdivision begins | hierarchy |
| 22:00 | MACCHINA | Snapshot capture #3 | memory |
| 23:00 | MACCHINA | Reveal apparatus (4 frames raw Bayer) | gesture |
| 24:30 | MACCHINA | Subdivision peak depth 4 | peak |
| 25:06 | TEMPESTA | HARD CUT | structural |
| 25:30 | TEMPESTA | Barcode sweep mode | render mode |
| 27:00 | TEMPESTA | First Fibonacci flicker burst | strobe |
| 28:30 | TEMPESTA | Snapshot capture #4 | memory |
| 29:00 | TEMPESTA | Rupture stage 1: omen | rupture |
| 29:30 | TEMPESTA | Rupture stage 2: infiltrazione | rupture |
| 30:00 | TEMPESTA | Rupture stage 3: takeover (red, 100% density, 8s flicker) | climax |
| 30:30 | TEMPESTA | Rupture stage 4: residuo | rupture |
| 31:18 | RITORNO | HARD CUT + radiograph invert | structural |
| 31:30 | RITORNO | Snapshot #1 mask appears | memory |
| 32:30 | RITORNO | Snapshot #2 mask appears | memory |
| 33:30 | RITORNO | Snapshot #3 mask appears | memory |
| 34:30 | RITORNO | Snapshot #4 mask appears | memory |
| 35:30 | RITORNO | Snapshot #5 mask appears | memory |
| 36:00 | RITORNO | Vanishing point returns to NEBBIA position | callback |
| 36:30 | RITORNO | Density starts decaying | dissolution |
| 37:00 | RITORNO | Single dot remains | minimum |
| 37:18 | END | Black for 4 seconds | silence |

**Format:** Save as `score.json`. The director loads it, triggers events at exact times. Generative layers run between events. Manual override possible during live performance.

---

## PART H: Implementation Recommendations for v4 Visual

### H.1 What to add

| # | System | Priority | Effort | Impact |
|---|--------|----------|--------|--------|
| V1 | **Atomic operations library** (30 ops, see PART E) | ALTA | Alta | Critical |
| V2 | **Visual score JSON** (`score.json` with ~60 events) | ALTA | Bassa | Critical |
| V3 | **Frame snapshot system** (capture at min 6/14/22/30/36) | ALTA | Bassa | Critical for RITORNO |
| V4 | **Density cap per track** (Hara → Yokoo gradient) | ALTA | Bassa | Identity |
| V5 | **Risograph misregistration** (accent grid offset) | ALTA | Bassa | Identity |
| V6 | **Anisotropic Bayer matrices** (4 hatching angles) | ALTA | Media | New texture |
| V7 | **Reaction-diffusion field** (Gray-Scott 80×45) | MEDIA | Media | TESSUTO core |
| V8 | **DLA seeding** (MIDI note → dendrite) | MEDIA | Media | TESSUTO/RITORNO |
| V9 | **Lissajous trail** (audio L/R as path) | MEDIA | Bassa | SOLCO core |
| V10 | **Markov dither** (per-cell neighbor coupling) | MEDIA | Media | Texture variation |
| V11 | **Substrate walker** (orthogonal collision-spawn) | MEDIA | Bassa | MACCHINA |
| V12 | **Differential line growth** (bass voice trace) | BASSA | Media | Memory of phrases |
| V13 | **Fibonacci flicker** (sequence-based strobe) | MEDIA | Bassa | TEMPESTA peak |
| V14 | **Arc scrubber** (offline preview at 10× speed) | MEDIA | Media | Composition tool |
| V15 | **Reveal-apparatus mode** (raw Bayer 4 frames) | BASSA | Bassa | Structural gesture |
| V16 | **Audio EMA tau per track** (4s for slow tracks) | ALTA | Bassa | NEBBIA/RESPIRO/RITORNO feel |
| V17 | **Glitch as subtraction** (refactor `bayerGlitch`) | MEDIA | Bassa | Glitch identity |
| V18 | **Two-form protagonist tracking** (SOLCO) | MEDIA | Media | Narrative |
| V19 | **Scaffold visibility mode** (Bayer at 5% alpha) | BASSA | Bassa | Nicolai aesthetic |
| V20 | **Render field at 110% canvas** (bleed past edges) | BASSA | Bassa | AntiVJ aesthetic |

### H.2 Sprints

**Sprint 1 — Identity foundations (~2 sessions):**
- [ ] Density cap per track (V4) — 1 hour
- [ ] Risograph offset (V5) — 1 hour
- [ ] Audio EMA tau per track (V16) — 1 hour
- [ ] Anisotropic Bayer matrices (V6) — 4 hours
- [ ] Frame snapshot system (V3) — 2 hours
- [ ] Glitch as subtraction (V17) — 2 hours

**Sprint 2 — Score-driven structure (~3 sessions):**
- [ ] Visual score JSON loader (V2) — 4 hours
- [ ] Director hooks for score events — 2 hours
- [ ] First 60 events authored — 4 hours
- [ ] Hard cuts at track boundaries — 1 hour

**Sprint 3 — New atomic operations (~4 sessions):**
- [ ] Reaction-diffusion (V7) — 4 hours
- [ ] DLA seeding (V8) — 3 hours
- [ ] Lissajous trail (V9) — 2 hours
- [ ] Substrate walker (V11) — 3 hours
- [ ] Markov dither (V10) — 4 hours
- [ ] Fibonacci flicker (V13) — 2 hours

**Sprint 4 — Composition tooling (~2 sessions):**
- [ ] Arc scrubber (V14) — 6 hours
- [ ] Differential line growth (V12) — 4 hours
- [ ] Two-form protagonist tracking (V18) — 4 hours
- [ ] Reveal apparatus (V15) — 1 hour

**Sprint 5 — Per-track polish (~3 sessions):**
- [ ] NEBBIA sprint: scaffold visible, profile stack, very slow
- [ ] TESSUTO sprint: RD core, DLA seeds, count evolution
- [ ] SOLCO sprint: two protagonists, Lissajous trail, peg-string
- [ ] RESPIRO sprint: Hara discipline, step row, rule violation
- [ ] MACCHINA sprint: text-mode grid, cross-hatch, subdivision
- [ ] TEMPESTA sprint: barcode sweep, Fibonacci flicker, Yokoo escape
- [ ] RITORNO sprint: 5 snapshot masks, radiograph, decay to single dot

### H.3 Things to NOT change

These are already correct from v3:

1. **Sediment trail system** — already in `visual-toolkit.js`, just extend
2. **Breathing field** — already implemented
3. **Camera transforms** — already there, just need slower envelopes
4. **Bayer 8×8 base** — keep, add anisotropic variants
5. **Per-track palette** — already defined in `tracks.js`, keep
6. **`comp-*` modular structure** — keep, refactor internal logic to use atomic ops library
7. **Director3 + worldState** — keep, add score event consumption
8. **Glitch primitives** (`bayerGlitch`, `colorFlash`) — keep, refactor to be subtractive

---

## PART I: Anti-Patterns

The mistakes to never make in MACH:INE III v4 visual:

**1. The Christmas tree.** Never enable all atomic ops simultaneously. Each track uses 4–6 ops max. Identity comes from what is *absent*.

**2. The preset effect.** If the viewer can name the technique ("that's chromatic aberration"), it has become decoration. Techniques should be felt, not identified.

**3. Linearity.** Mapping audio bands directly to visual parameters creates "audio visualization," not audiovisual art. The relationship must be poetic, not functional.

**4. The glitch as accumulation.** Glitch is *removal*, not noise. The user's feedback is unambiguous: "glitch = rottura grammatica, NON accumulo effetti." Subtract dots, don't add them.

**5. Smooth transitions everywhere.** Smooth transitions hide; hard cuts reveal. Reserve smooth for *within* tracks. At track boundaries, *collision*.

**6. Random over time.** A 45-minute arc must be a *trajectory*, not a state machine. Pre-compose the curve.

**7. Visual that "follows" the music.** Visual is a second performer, not a follower. When CH5 plays, the visual can *withhold* (Sakamoto+Nicolai principle) — not amplify.

**8. Ignoring frame budget.** Every new op must declare its ms cost. Total cost across all enabled ops never exceeds 10 ms (6 ms headroom).

**9. The infinite ambient.** If audio RMS < 0.02, the canvas should be visibly empty. No ambient sparkle filler. Robin Fox rule.

**10. Strobe without dose limit.** Treat strobe as a drug. Hard cap: 8 seconds continuous, 90 seconds total per session, never in first 10 minutes.

**11. New primitives instead of new arrangements.** When stuck, the answer is *not* "add another shape." The answer is "use the dot in a new way." Ben-Day, Hirst, Riley, Kusama, Polke all proved this with one mark.

**12. Visual independent from compositional research.** The visual side and the music side share *the same* 5 movements, *the same* 5 tension waves, *the same* 7 tracks. They are one performance, not two layers.

---

## Sources

### Live AV Performance
- [Ryoji Ikeda — test pattern](https://www.ryojiikeda.com/project/testpattern/)
- [Carsten Nicolai — Wikipedia](https://en.wikipedia.org/wiki/Carsten_Nicolai)
- [Frieze — Insen: Alva Noto and Ryuichi Sakamoto](https://www.frieze.com/article/insen-alva-noto-and-ryuichi-sakamoto)
- [CDM — Ryoichi Kurokawa oscillating continuum](https://cdm.link/2013/05/oscillating-continuum-meditative-audiovisual-installation-and-av-work-of-ryoichi-kurokawa/)
- [Herman Kolgen — Inject](http://kolgen.net/performances/inject/)
- [Robert Henke — Lumière interview, Ableton](https://www.ableton.com/en/blog/robert-henke-lumiere-lasers-interview/)
- [Robert Henke — Inside CBM 8032 AV](https://roberthenke.com/technology/inside8032av.html)
- [NONOTAK — _LATE SPECULATION](https://www.nonotak.com/_LATE-SPECULATION-1)
- [Studio Lemercier — Murcof](https://joanielemercier.com/murcof/)
- [Colossal — Order from Chaos by Maxime Causeret](https://www.thisiscolossal.com/2016/12/order-from-chaos-video-maxime-causeret/)
- [Colossal — Páraic McGloughlin dizzying experiment](https://www.thisiscolossal.com/2018/10/dizzying-visual-experiment-by-paraic-mcgloughlin/)
- [Robin Fox — ArtNews interview](https://www.artnews.com/art-in-america/interviews/robin-fox-lasers-sound-synesthesia-1234673848/)
- [Rainer Kohlberger — keep that dream burning](https://kohlberger.net/work/keep-that-dream-burning)
- [Memo Akten — Deep Meditations](https://www.memo.tv/works/deep-meditations/)
- [Tarik Barri — Versum](http://tarikbarri.nl/projects/versum)
- [UVA — Our Time](https://www.uva.co.uk/features/our-time)
- [Physics World — Akiko Nakayama](https://physicsworld.com/a/akiko-nakayama-the-japanese-artist-skilled-in-fluid-mechanics/)

### Generative & Plotter Art
- [Vera Molnar](https://www.veramolnar.com/) | [Art UK on Molnar](https://artuk.org/discover/stories/vera-molnar-the-mother-of-generative-art)
- [Manfred Mohr](https://www.emohr.com/) | [bitforms — Mohr](https://www.bitforms.art/artist/manfred-mohr/)
- [Compart — Frieder Nake & Georg Nees](https://dada.compart-bremen.de/)
- [Tyler Hobbs — Flow Fields essay](https://www.tylerxhobbs.com/words/flow-fields)
- [Tyler Hobbs — Fidenza](https://www.tylerxhobbs.com/fidenza)
- [Dmitri Cherniak — Ringers (ArtBlocks #13)](https://www.artblocks.io/project/13)
- [Matt DesLauriers](https://mattdesl.com/) | [DesLauriers — Meridian (ArtBlocks #163)](https://www.artblocks.io/project/163)
- [Anders Hoff — inconvergent](https://inconvergent.net/generative/)
- [Jared Tarbell — Substrate](http://www.complexification.net/gallery/machines/substrate/)
- [Sol LeWitt — MASS MoCA](https://massmoca.org/sol-lewitt/)
- [Roman Verostko — Algorist papers](http://www.verostko.com/algorist.html)
- [Drawingbots community](https://drawingbots.net/)
- [Aaron Penne](https://aaronpenne.github.io/)

### Graphic Design
- [Josef Müller-Brockmann — monoskop](https://monoskop.org/Josef_Müller-Brockmann)
- [Armin Hofmann — MoMA](https://www.moma.org/artists/2700)
- [Karl Gerstner — Designing Programmes](https://www.lars-mueller-publishers.com/designing-programmes)
- [Wolfgang Weingart — AIGA](https://www.aiga.org/medalist-wolfgangweingart)
- [April Greiman](https://aprilgreiman.com)
- [Karel Martens](https://www.karelmartens.nl) | [Werkplaats Typografie](https://werkplaatstypografie.org)
- [Wim Crouwel — MoMA](https://www.moma.org/artists/1320)
- [Studio Dumbar](https://studiodumbar.com)
- [Experimental Jetset](https://www.experimentaljetset.nl)
- [El Lissitzky — monoskop](https://monoskop.org/El_Lissitzky)
- [Alexander Rodchenko — monoskop](https://monoskop.org/Alexander_Rodchenko)
- [Herbert Bayer — Getty](https://www.getty.edu/art/collection/artists/1814)
- [Kenya Hara — NDC](https://www.ndc.co.jp/hara)
- [Tadanori Yokoo](https://www.tadanoriyokoo.com)
- [Risotto Studio](https://www.risotto-studio.com)
- [Slanted Magazine — Riso](https://slanted.de/topic/riso)

### Abstract Cinema & Visual Time
- [Light Cone (Paris)](https://www.lightcone.org)
- [Canyon Cinema (SF)](https://www.canyoncinema.com)
- [Anthology Film Archives](https://anthologyfilmarchives.org)
- [Center for Visual Music — Fischinger, Belson, Bute](https://www.centerforvisualmusic.org/)
- [Norman McLaren — NFB Synchromy](https://www.nfb.ca/film/synchromy/)
- [Tony Conrad — The Flicker (Light Cone)](https://www.lightcone.org/en/film-588-the-flicker)
- [Paul Sharits — Light Cone](https://www.lightcone.org/en/filmmaker-318-paul-sharits)
- [Michael Snow — Wavelength](https://www.lightcone.org/en/film-1147-wavelength)
- [Hollis Frampton — Light Cone](https://www.lightcone.org/en/filmmaker-73-hollis-frampton)
- [Peter Kubelka — sixpackfilm](https://www.sixpackfilm.com/en/catalogue/kubelka-peter/)
- [Eisenstein — Film Form (marxists.org)](https://www.marxists.org/reference/archive/eisenstein/works/1929/film-form.htm)
- [Hito Steyerl — In Defense of the Poor Image (e-flux)](https://www.e-flux.com/journal/49/60004/in-defense-of-the-poor-image/)

### Dot, Pop, Optical, Pattern Art
- [Roy Lichtenstein — MoMA](https://www.moma.org/collection/works/79035)
- [Sigmar Polke — David Zwirner](https://www.davidzwirner.com/artists/sigmar-polke)
- [Andy Warhol — Marilyn Diptych at Tate](https://www.tate.org.uk/art/artworks/warhol-marilyn-diptych-t03093)
- [Bridget Riley — Tate](https://www.tate.org.uk/art/artists/bridget-riley-1845)
- [Victor Vasarely](https://www.vasarely.com/)
- [Carlos Cruz-Diez](https://www.cruz-diez.com/)
- [Jesús Rafael Soto — MoMA](https://www.moma.org/artists/5526)
- [Damien Hirst — Spot Paintings](https://www.damienhirst.com/texts1/series/spots)
- [Yayoi Kusama — Tate](https://www.tate.org.uk/art/artists/yayoi-kusama-8094)
- [Chuck Close — Pace](https://www.pacegallery.com/artists/chuck-close/)
- [Anni Albers — MoMA](https://www.moma.org/artists/98)
- [Josef Albers Foundation](https://www.albersfoundation.org/)
- [Agnes Martin — Pace](https://www.pacegallery.com/artists/agnes-martin/)

### Compositional Theory
- [Eisenstein — Film Form essays (PDF, monoskop)](https://monoskop.org/images/1/13/Eisenstein_Sergei_Film_Form_Essays_in_Film_Theory.pdf)
- [Kuleshov effect — Wikipedia](https://en.wikipedia.org/wiki/Kuleshov_effect)
- [Reich — Phase music — Wikipedia](https://en.wikipedia.org/wiki/Phase_music)

---

## Closing — One Page

**MACH:INE III is one performance, not two.** The visual side and the music side share the same 5 movements, the same 5 tension waves, the same 7 tracks. The compositional research (RESEARCH-V4-COMPOSITIONAL-DIRECTION.md) gave the music side a vocabulary; this document gives the visual side its parallel vocabulary, *built from the same dot primitive that already exists*.

**The thesis:** A single mark, treated with the seriousness of a Schotter rotation, a Brakhage filmstrip, an Ikeda barcode, a Hara silence, a Karel Martens monoprint, and a Robin Fox laser line — is sufficient material for 45 minutes of generative art. The Bayer dot has a 60-year art history that justifies it: Lichtenstein cited it, Polke painted it, Hirst gridded it, Riley pressured it, Kusama obliterated it, Hofmann rendered photography through it, McLaren scratched it.

**The work:** Build the 30 atomic operations. Author the 60-event score. Cap density per track. Apply the 7 designer signatures. Capture 5 frame snapshots for the memory loop. Let the visual director use the same composer engines as the music. Then NEBBIA holds. TESSUTO grows. SOLCO loops. RESPIRO withholds. MACCHINA iterates. TEMPESTA overwhelms. RITORNO remembers. The dot does the rest.

**The next step:** discuss this document, agree on Sprint 1, then code.
