# album-gen M1c-ε — Substance Population Runbook

> **For agentic workers:** This is a **curation-driven runbook**, not a TDD implementation plan. The validation pipeline is already built (M1c-δ). Your job is to run CLI commands, listen to WAV previews, make artistic judgements, re-roll duds, and document outcomes. Do NOT apply TDD methodology to content generation — generation is procedural, review is manual, validation is already automated.

**Goal:** Populate 5 remaining substances (GRIT, JOLT, LOAM, BRINE, ORE) using the Sound Lab CLI from M1c-δ. After ε, the full 6×9 matrix (6 substances × 9 synth families) is populated. Each substance is audibly distinct; the 36 SUBSTANCE × GESTURE combinations produce meaningfully different albums.

**State at entry:** Tag `v0.6.0-M1c-delta` merged. HAZE is the pilot substance — 9 synths committed, validated, WAV previews in `sound-lab/.previews/`. Sound Lab CLI at `sound-lab/sound-lab-cli.js` supports `--substance X`, `--synth Y --force`, `--validate`, `--status`, `--interactive`.

**Reference spec:** [2026-04-25-album-gen-M1c-design.md](../specs/2026-04-25-album-gen-M1c-design.md), Sections 2.1, 3, and 8.5.

**Non-goals for ε:**
- No new CLI features (all tooling is done in δ).
- No SynthDef architecture changes.
- No tarot UI changes.
- No expression-weaver changes.
- No test files to write (validation pipeline is δ's responsibility).
- Perfect synths on first pass. Good enough is good enough — re-roll freely, move on if 2+ retries don't improve.

---

## File structure at completion

All paths relative to `/Users/Edo_1/album-gen/`.

**New files (created during execution):**

```
docs/sound-substances/
├── GRIT.md
├── JOLT.md
├── LOAM.md
├── BRINE.md
├── ORE.md
└── AUDIT.md                          # written in Task 9

sc/synths/
├── grit/{drone,pad,bass,kick,snare,hat,lead,perc,texture}.scd   (9 files)
├── grit/{drone,pad,bass,kick,snare,hat,lead,perc,texture}.yaml  (9 files)
├── jolt/... × 18
├── loam/... × 18
├── brine/... × 18
└── ore/... × 18                       # total: 90 .scd + .yaml

sc/modulation-rules/
├── grit.yaml
├── jolt.yaml
├── loam.yaml
├── brine.yaml
└── ore.yaml

sound-lab/.previews/
├── grit_*.wav  (9 files, gitignored)
├── jolt_*.wav, loam_*.wav, brine_*.wav, ore_*.wav
```

**Modified files:**
- `package.json` — version bumps per substance: `0.6.1`, `0.6.2`, `0.6.3`, `0.6.4`, `0.6.5`; final bump to `0.7.0-M1c` or `1.0.0` in Task 9.
- `README.md` — M1c status section updated at the end.

---

## Substance ordering rationale

**Order: GRIT → JOLT → LOAM → BRINE → ORE**

Reason: start with maximum contrast to HAZE (the pilot), then work inward.

1. **GRIT first** — percussive, dry, short attacks. Maximum contrast to HAZE's ambient space. Reveals immediately if the Sound Lab agent handles percussive timbres correctly. Confidence-building first batch.
2. **JOLT second** — aggressive, saw-rich, distorted. Picks up where GRIT left off on the percussive-aggressive axis but adds harmonic aggression. If GRIT worked well, JOLT will be straightforward.
3. **LOAM third** — warm, mid-low, woody. Switches register and character entirely. Provides a palate-cleansing middle point between aggressive and fluid substances.
4. **BRINE fourth** — long sustains, fluid, wide spectrum. Closest in spirit to HAZE but with chorus and salt. More nuanced identity — reviewed with HAZE WAVs playing in parallel for the ear-check.
5. **ORE last** — metallic, inharmonic, ring-mod character. Hardest to get right; most unusual sonic language. Placed last so earlier substance work informs the agent's context.

---

## Acceptance criteria

A substance passes when **all** of the following hold:

### Automated (enforced by CLI validation pipeline)

1. **Validation pipeline green**: `npm run sound-lab -- --validate <substance>` exits 0. This implies: sclang loads without error, Synth.new produces audio, RMS in `[0.01, 1.0]`, no active nodes after `.free()`, `.yaml` schema valid.
2. **No clipping**: RMS < 0.7 on all 9 families (the pipeline checks <1.0; enforce a stricter manual ceiling of 0.7 to leave headroom in the mix).
3. **Audible floor**: RMS > 0.05 on all 9 families (stricter than pipeline's 0.01; silent drone or pad is not acceptable).

### Manual ear-check (human judgment, per WAV preview)

4. **Audibly distinct from HAZE**: Compare `sound-lab/.previews/<sub>_<family>.wav` against `haze_<family>.wav`. They must sound different — not just quieter or panned differently. If they sound too similar, re-roll.
5. **Character consistent with brief**: The synth reflects the poetic brief. GRIT bass should feel gritty; JOLT lead should feel jagged. Check the brief's "must not" list.
6. **6/9 families subjectively good** before tagging the substance. The remaining 3 can be tagged as "provisional" in the AUDIT.md and revisited in a follow-up session. Do not block release on 3 difficult families.

### Distinguishability test (final cross-substance check, Task 8)

7. **Cross-substance distinguishability**: Play `album-002.yaml` with each substance in turn. Each album must sound meaningfully different from the others within the first 30 seconds of each song.

### Iteration policy

- Re-roll a dud immediately: `npm run sound-lab -- --substance X --synth Y --force`.
- Max 3 retries per family before marking "provisional" and moving on.
- "Provisional" means: the SynthDef works (passes validation) but is artistically weak. Document in AUDIT.md. Revisit in a post-ε session.
- After 3 retries the agent may be stuck in a local pattern — use `--interactive` to edit the brief before re-dispatch.

---

## Time and cost estimate

- **Agent runtime**: ~5-10 min per family × 9 families × 5 substances = **375-450 min agent runtime** (~6-7 hours). Spread over 1-2 work sessions.
- **Human curation time**: ~10-15 min per substance (listening, deciding re-rolls, committing) × 5 = **50-75 min human time**.
- **Re-roll budget**: assume ~20% of families need at least one re-roll = ~9 extra agent calls = ~45-90 min additional.
- **Total realistic timeline**: 8-10 hours agent + human across 2 sessions.

---

## Task 1: Pre-flight — confirm Sound Lab is ready

**Files:** none (read-only verification)

- [ ] **Step 1: Check matrix status**

```bash
cd /Users/Edo_1/album-gen
npm run sound-lab -- --status
```

Expected output: 6×9 grid with HAZE row fully green (✓), the other 5 rows empty (–). If HAZE has any gaps, populate them first before proceeding (run `npm run sound-lab -- --substance HAZE --synth <missing>` for each gap).

- [ ] **Step 2: Verify HAZE WAV previews exist and are audible**

```bash
ls sound-lab/.previews/haze_*.wav
```

Expected: 9 files. Open and spot-listen to `haze_drone.wav`, `haze_bass.wav`, `haze_lead.wav`. They should be audible and not clip. These are your baseline reference for ear-checks on new substances.

- [ ] **Step 3: Verify `docs/sound-substances/` directory exists or create it**

```bash
ls /Users/Edo_1/album-gen/docs/sound-substances/ 2>/dev/null || mkdir -p /Users/Edo_1/album-gen/docs/sound-substances/
```

- [ ] **Step 4: Verify `album-002.yaml` exists with M1c fields (gesture + substance per song)**

```bash
cat /Users/Edo_1/album-gen/albums/album-002.yaml | grep -E "gesture:|substance:"
```

If absent, create a minimal test album (see Task 8 for reference). This album is used in the cross-substance audit.

---

## Task 2: Write 5 poetic briefs

**Files:**
- Create: `docs/sound-substances/GRIT.md`
- Create: `docs/sound-substances/JOLT.md`
- Create: `docs/sound-substances/LOAM.md`
- Create: `docs/sound-substances/BRINE.md`
- Create: `docs/sound-substances/ORE.md`

Write all 5 files. Each brief is read by the sound-designer-sc subagent at dispatch time via the `agent-brief-template.md` SUBSTANCE poetic placeholder. Be specific — vague briefs produce generic synths.

- [ ] **Step 1: Write `docs/sound-substances/GRIT.md`**

```markdown
# GRIT — grana fine, pulviscolo secco

**Tagline:** Dry grain. Short attacks. Nothing lingers.

GRIT is the substance of gravel on metal, of a muted snare at noon, of
sandpaper on wood. It lives in the mid-high register. Envelopes are short;
sustain is a mistake. No reverb, no chorus, no space. Every hit is a
particle landing, not a wave passing.

## Synth family character

| Family   | Character |
|----------|-----------|
| drone    | High-frequency noise drone, like air through a filter; amplitude modulated slowly but never long-tail; no sub content |
| pad      | Noise-padded chords with gated amplitude, slight metallic sheen; reminds of muted hammered strings |
| bass     | Granular noise in low-mid (50-80 Hz range); short envelope, transient-forward; think mortar grain, no sub-rumble |
| kick     | Dry transient, minimal decay, click-pitch body; no boom, no 808 sub; like a woodblock |
| snare    | Sharp crack, white noise burst, fast decay; no reverb tail; imagine concrete |
| hat      | High-frequency metallic tick; no sustain; brittle; can be slightly pitched noise |
| lead     | Mid-high single-oscillator with slight detuning; gritty waveshaping or soft clipping; no legato, hard attacks |
| perc     | Resonant metallic hit with fast decay; pitched slightly above center; clank, not click |
| texture  | Layered noise shards; amplitude-gated, sparse; provides grit-substrate underneath other elements |

## Must NOT

- No reverb (any family). Not even short room reverb.
- No long sustain. Envelope release > 0.5s is wrong.
- No sub-bass content (below 50 Hz) in bass, kick, or drone.
- No chorus or flanger (fluid movement contradicts the substance).
- No pad-like textures — GRIT is never soft.

## Reference vibe

- Keith Fullerton Whitman — early modular works (short attack transients on drones)
- The Bug — "Skeng" (dry percussive aggression, no reverb space)
- Robert Henke — "Layering Buddha" (granular precision, no sentimentality)
```

- [ ] **Step 2: Write `docs/sound-substances/JOLT.md`**

```markdown
# JOLT — scarica elettrica, attacco duro

**Tagline:** Sudden voltage. Saw-rich and aggressive.

JOLT is the substance of electricity finding a path. Sawtooth waves with
harmonic dirt. Distortion that doesn't apologize. Mid-aggressive, mid-register
dominant — not sub-bass, not high sparkle, but mid punch. Envelopes are
medium-short; attacks are instantaneous. Think cheap 80s synth being
overdriven, or a modular patch with too much VCA drive.

## Synth family character

| Family   | Character |
|----------|-----------|
| drone    | Sawtooth drone with moderate distortion; slight frequency beating between two oscillators; edgy, not smooth |
| pad      | Stacked detuned saws, low-pass filtered but not too soft; buzzy and slightly aggressive; chords feel raw |
| bass     | Hard attack saw or square bass; dry, mid-forward; no sub warmth; velocity-sensitive clipping |
| kick     | Hard transient with slight pitch sweep up; distorted beater feel; punchy not boomy |
| snare    | Mid-register clap/noise combo; distorted crack; harder than GRIT's snare but also dry |
| hat      | Short metallic burst; slightly brighter than GRIT; the kind that cuts |
| lead     | Sawtooth-rich, short-medium envelope; can use mild FM or ring-mod for metallic edge; mid-high register |
| perc     | Distorted metallic transient; can be slightly longer decay than GRIT perc but still short; buzzed hit |
| texture  | Gated noise with distortion; rhythmic amplitude stuttering; electric fence feeling |

## Must NOT

- No soft, pad-like tones. JOLT is aggressive throughout.
- No long reverb tails.
- No sine-wave purity (everything has harmonic distortion).
- No sub-bass (register bias is mid; bass below 50 Hz is wrong for JOLT).
- No slow filter sweeps — filter is either static or moves fast.

## Reference vibe

- Actress — "Hubble" (clipped mid-range aggression)
- Drexciya — aggressive modular synthesis, hard attacks
- Andy Stott — "Numb" (distorted drone density, not ambient)
```

- [ ] **Step 3: Write `docs/sound-substances/LOAM.md`**

```markdown
# LOAM — terra grassa, organico

**Tagline:** Warm earth. Low-mid resonance. Breathing wood.

LOAM is the substance of wet soil, of tree roots, of wooden percussion in a
small room. It lives in the low-mid register. Timbres are warm, resonant,
slightly damp. Not as low as BRINE's ocean depth, not as dry as GRIT — LOAM
is alive and organic. Envelopes breathe; slow attacks are welcome; a hint of
room resonance is acceptable (unlike GRIT/JOLT where reverb is forbidden).

## Synth family character

| Family   | Character |
|----------|-----------|
| drone    | Low-mid sine or soft-wave drone; warm, gently modulated; like a didgeridoo held under cloth |
| pad      | Warm stacked oscillators, gentle low-pass; reminiscent of Rhodes or warm organ; soft harmonic content |
| bass     | Round, woody; medium attack; emphasis on low-mid body (50-150 Hz); no distortion; subtle movement |
| kick     | Low thud; wooden body feel; more sub-body than GRIT but controlled; like a tom hit or hand drum |
| snare    | Woody snare or rim-shot; not the crack of GRIT; more resonant body; medium decay |
| hat      | Muted hi-hat; slightly low for a hat; brushed feel; low brightness compared to GRIT/JOLT |
| lead     | Warm single oscillator; soft waveshaping at most; mid-register; like a flute or oboe in timbre |
| perc     | Wooden pitched hit; marimba-adjacent but dirtier; resonant body, medium decay |
| texture  | Warm noise pads; slow amplitude movement; like rain on wood from a distance |

## Must NOT

- No metallic timbre (that's ORE). LOAM is organic, not inorganic.
- No distortion (that's JOLT). LOAM is warm, not aggressive.
- No high-register dominance — if a synth is above MIDI 80, it should be rerolled.
- No bright saw waves — soft waves only (sine, triangle, soft pulse).
- No tight gated envelopes — LOAM breathes.

## Reference vibe

- Grouper — "Dragging a Dead Deer" (warm, low, damp atmosphere)
- Stars of the Lid — low-mid string-pad warmth
- William Basinski — "The Disintegration Loops" (warm decay, organic imperfection)
```

- [ ] **Step 4: Write `docs/sound-substances/BRINE.md`**

```markdown
# BRINE — salmastro, dilatato, maree

**Tagline:** Salt water. Long sustains. A tide that takes forever to arrive.

BRINE is the substance of ocean water: vast, slightly blurred, fluid in
movement. Chorus and slight pitch drift are the norm, not the exception.
Sustains are long; envelopes breathe over seconds, not milliseconds. The
lowest register of the six substances — bass can open down to MIDI 24. Chords
spread across a broad spectrum; nothing is tightly focused. BRINE is
kinship with HAZE but heavier, saltier — it has more mass.

## Synth family character

| Family   | Character |
|----------|-----------|
| drone    | Wide sine or soft-wave drone with slow chorus detune; feels like a large space breathing; sub-content welcome |
| pad      | Slowly evolving multi-oscillator pad; chorus is mandatory; spectral spread over many octaves; think aquatic Eno |
| bass     | Deep, sub-reaching bass; slow attack; long sustain; low-end heavy (MIDI 24-50 range); slight chorus motion |
| kick     | Deep, slow thud; long decay into sub; not punchy; feels like a boulder dropped into water |
| snare    | Soft, diffuse; more like a distant burst of white noise than a snare crack; medium-long tail |
| hat      | Softest hat of all six; barely there; a shimmer, not a click; high-frequency resonance with slow decay |
| lead     | Fluid single oscillator; slight chorus; long legato-style envelope even when playing fast notes; high register |
| perc     | Watery resonant hit; long reverb or decay; fluid, not sharp; think singing bowl, not woodblock |
| texture  | Sustained noise layer; slow amplitude modulation; like underwater ambience with faint harmonic content |

## Must NOT

- No dry/gated envelopes. BRINE is never staccato.
- No distortion or saturation (that's JOLT/GRIT).
- No metallic timbres (that's ORE).
- No fast attacks — if attack < 20ms, re-roll.
- Do not confuse with HAZE: BRINE has more mass, more chorus, more sub content.
  If the BRINE pad sounds like the HAZE pad, re-roll with explicit chorus instruction.

## Reference vibe

- Brian Eno — "Music for Airports" (long fluid pads)
- Tim Hecker — "Ravedeath, 1972" (dense fluid ambience with weight)
- The Caretaker — early albums (slowly drifting tonal space)
```

- [ ] **Step 5: Write `docs/sound-substances/ORE.md`**

```markdown
# ORE — minerale grezzo, metallo freddo

**Tagline:** Raw metal. Inharmonic. Cold resonance.

ORE is the substance of struck iron, of cave resonance, of the frequency
spectrum between harmonic and noise: inharmonic. Bell tones, ring modulation,
metallic FM — these are the tools. Register is mid-narrow; ORE doesn't spread
wide like BRINE or climb high like GRIT, it occupies a cold, specific band
with unusual spectral content. It feels expensive and unpleasant at the same
time.

## Synth family character

| Family   | Character |
|----------|-----------|
| drone    | FM or ring-mod drone with inharmonic spectrum; cold and resonant; minimal movement; metallic hum |
| pad      | Bell-tone clusters; FM-generated with slight detuning; inharmonic chords; austere, not warm |
| bass     | Metallic low-mid bass; ring-mod on a low frequency; unpleasant overtones at medium volume; cold, not warm |
| kick     | Metallic clang + sub thud; reminiscent of struck iron; pitch decay present; no warmth |
| snare    | Metallic burst; like hitting a sheet of steel; high inharmonic content; mid-decay |
| hat      | Pure metallic ring; sustained inharmonic shimmer; decays slowly; more bell than click |
| lead     | FM synthesized lead; narrow register; inharmonic partials; sounds like a metal object resonating |
| perc     | Bell or gong hit; medium-long decay; clearly metallic; the most ring-mod-heavy family |
| texture  | Cold inharmonic noise layer; FM-modulated; tense, not warm; subtle but identifiable |

## Must NOT

- No warm timbres (that's LOAM). ORE is always cold.
- No chorus or broad detune (that's BRINE). ORE is narrow and precise.
- No soft attacks — ORE hits with authority or rings from a struck point.
- No standard sine/saw/square without ring-mod or FM treatment — unprocessed oscillators are wrong for ORE.
- No lush reverb — short room or plate at most; space should be cold, not warm.

## Reference vibe

- Autechre — "Confield" (inharmonic percussion, cold metallic space)
- Mika Vainio — solo works (metallic sine drone with FM artifacts)
- Éliane Radigue — "Adnos I-III" (cold drone resonance, minimal motion)
```

- [ ] **Step 6: Commit briefs**

```bash
cd /Users/Edo_1/album-gen
git add docs/sound-substances/
git commit -m "docs(ε): add poetic briefs for 5 remaining substances"
```

---

## Task 3: Populate GRIT

**Files created:**
- `sc/synths/grit/*.scd` × 9
- `sc/synths/grit/*.yaml` × 9
- `sc/modulation-rules/grit.yaml`
- `sound-lab/.previews/grit_*.wav` × 9 (gitignored)
- `docs/sound-substances/GRIT.md` (already written in Task 2)

- [ ] **Step 1: Run batch generation**

```bash
cd /Users/Edo_1/album-gen
npm run sound-lab -- --substance GRIT
```

Expected: agent dispatched 9 times (or in batch), each producing `.scd` + `.yaml` + WAV preview. Validation pipeline runs automatically. CLI reports per-family pass/fail. Takes ~5-10 min.

- [ ] **Step 2: Check CLI output for validation failures**

Any family that fails validation is reported with error details. Take note of which families failed (syntax error, RMS too low, RMS too high, leak detected, YAML schema error).

- [ ] **Step 3: Re-roll failed families**

For each failed family:

```bash
npm run sound-lab -- --substance GRIT --synth <family> --force
```

If 2 re-rolls don't fix it, use `--interactive` to edit the brief before dispatch:

```bash
npm run sound-lab -- --substance GRIT --synth <family> --force --interactive
```

Max 3 retries. After 3, mark as provisional and move on.

- [ ] **Step 4: Manual ear-check**

Open `sound-lab/.previews/` and listen to each `grit_*.wav` in order:

Priority order: `grit_bass.wav` → `grit_kick.wav` → `grit_snare.wav` → `grit_lead.wav` → `grit_drone.wav` → `grit_pad.wav` → `grit_hat.wav` → `grit_perc.wav` → `grit_texture.wav`

For each, confirm against the GRIT brief:
- Is it dry? No reverb tail?
- Is it short? No sustain > 0.5s?
- Is there grit / noise content?
- Is it audibly different from the corresponding HAZE family?

Note duds. A dud = "sounds too much like HAZE" or "violates a must-not rule".

- [ ] **Step 5: Re-roll ear-check duds**

```bash
npm run sound-lab -- --substance GRIT --synth <dud_family> --force
```

If the re-roll is the same or worse, run `--interactive` and add a more specific instruction to the brief for that family, then re-roll again.

- [ ] **Step 6: Check modulation rules draft**

```bash
cat sc/modulation-rules/grit.yaml
```

Verify that at least `bass`, `lead`, and `kick` have non-empty rules. If the file is minimal (only _default copied), add a note to improve after full matrix is populated — this is not a blocker.

- [ ] **Step 7: Bump version and commit**

```bash
cd /Users/Edo_1/album-gen
# Edit package.json: version → "0.6.1"
git add sc/synths/grit/ sc/modulation-rules/grit.yaml package.json
git commit -m "sound-lab(ε): GRIT substance — 9 synths populated"
git tag v0.6.1-M1c-grit
```

**Acceptance check before proceeding:** `npm run sound-lab -- --validate GRIT` exits 0. At least 6/9 families pass the subjective ear-check.

---

## Task 4: Populate JOLT

**Files created:**
- `sc/synths/jolt/*.scd` × 9
- `sc/synths/jolt/*.yaml` × 9
- `sc/modulation-rules/jolt.yaml`
- `sound-lab/.previews/jolt_*.wav` × 9

Same runbook as Task 3 with JOLT-specific notes:

- [ ] **Step 1: Run batch generation**

```bash
npm run sound-lab -- --substance JOLT
```

- [ ] **Step 2: Check validation output and re-roll failures** (same as Task 3 Step 2-3)

- [ ] **Step 3: Manual ear-check — JOLT-specific criteria**

Open `jolt_*.wav`. Additional JOLT checks beyond generic brief compliance:

- Is there audible harmonic distortion/saturation in most families?
- Does `jolt_bass.wav` have hard attack and avoid sub-rumble?
- Does `jolt_lead.wav` feel aggressive / jagged compared to `haze_lead.wav`?
- Does `jolt_pad.wav` have buzzy saw character rather than soft pad character?

Re-roll duds. Note: JOLT's pad is the family most likely to fall back to a generic soft pad — check carefully.

- [ ] **Step 4: Re-roll ear-check duds** (same as Task 3 Step 5)

- [ ] **Step 5: Bump version and commit**

```bash
# Edit package.json: version → "0.6.2"
git add sc/synths/jolt/ sc/modulation-rules/jolt.yaml package.json
git commit -m "sound-lab(ε): JOLT substance — 9 synths populated"
git tag v0.6.2-M1c-jolt
```

**Acceptance check:** `npm run sound-lab -- --validate JOLT` exits 0. JOLT must sound notably more aggressive than GRIT to the ear (different axis, not just louder).

---

## Task 5: Populate LOAM

**Files created:**
- `sc/synths/loam/*.scd` × 9
- `sc/synths/loam/*.yaml` × 9
- `sc/modulation-rules/loam.yaml`
- `sound-lab/.previews/loam_*.wav` × 9

- [ ] **Step 1: Run batch generation**

```bash
npm run sound-lab -- --substance LOAM
```

- [ ] **Step 2: Check validation output and re-roll failures** (same pattern as Task 3)

- [ ] **Step 3: Manual ear-check — LOAM-specific criteria**

Open `loam_*.wav`. LOAM checks:

- Is the overall register low-mid? Nothing should feel bright or high.
- Does `loam_bass.wav` feel round and woody (not metallic, not gritty)?
- Does `loam_drone.wav` feel warm and organic (not cold/metallic like ORE will be)?
- Does `loam_pad.wav` remind you of a warm Rhodes or organ rather than a sci-fi pad?
- Is there a sense of breath / organic movement (slow LFOs welcome)?

Dangerous re-roll case: `loam_kick.wav` might fall back to a standard electronic kick. Re-roll if it sounds like a 808 or a GRIT kick — it should feel like a hand drum or tom.

- [ ] **Step 4: Re-roll ear-check duds** (same pattern)

- [ ] **Step 5: Bump version and commit**

```bash
# Edit package.json: version → "0.6.3"
git add sc/synths/loam/ sc/modulation-rules/loam.yaml package.json
git commit -m "sound-lab(ε): LOAM substance — 9 synths populated"
git tag v0.6.3-M1c-loam
```

**Acceptance check:** `npm run sound-lab -- --validate LOAM` exits 0. LOAM and GRIT must sound like opposites — one dry-aggressive, the other warm-organic.

---

## Task 6: Populate BRINE

**Files created:**
- `sc/synths/brine/*.scd` × 9
- `sc/synths/brine/*.yaml` × 9
- `sc/modulation-rules/brine.yaml`
- `sound-lab/.previews/brine_*.wav` × 9

- [ ] **Step 1: Run batch generation**

```bash
npm run sound-lab -- --substance BRINE
```

- [ ] **Step 2: Check validation output and re-roll failures**

Note: BRINE is the substance most likely to produce overly long (>5s) envelopes, which is artistically correct but may affect the preview WAV quality. If RMS seems low due to slow attack, check the full 10-second preview file before re-rolling.

- [ ] **Step 3: Manual ear-check — BRINE-specific criteria**

Open `brine_*.wav`. BRINE is the hardest to distinguish from HAZE — this ear-check is critical.

**BRINE vs HAZE distinguishability test:** Play each BRINE family WAV immediately followed by the corresponding HAZE WAV. They must sound different:

- BRINE should be heavier, saltier, more chorus-saturated.
- BRINE bass should reach sub-frequencies (MIDI 24-50 range), clearly deeper than HAZE bass.
- BRINE pad should have obvious chorus movement, while HAZE pad is cleaner.
- BRINE drone should feel aquatic/oceanic; HAZE drone feels aerial/misty.

If `brine_<family>.wav` is indistinguishable from `haze_<family>.wav` after 2 listens, re-roll with `--interactive` and add explicit disambiguation instructions (e.g. "BRINE bass must have more sub-frequency content and chorus than HAZE; HAZE has clean LPF sine, BRINE must have chorus detuning").

- [ ] **Step 4: Re-roll ear-check duds** (same pattern)

- [ ] **Step 5: Bump version and commit**

```bash
# Edit package.json: version → "0.6.4"
git add sc/synths/brine/ sc/modulation-rules/brine.yaml package.json
git commit -m "sound-lab(ε): BRINE substance — 9 synths populated"
git tag v0.6.4-M1c-brine
```

**Acceptance check:** `npm run sound-lab -- --validate BRINE` exits 0. BRINE must be distinguishable from HAZE by ear — this is the minimum bar.

---

## Task 7: Populate ORE

**Files created:**
- `sc/synths/ore/*.scd` × 9
- `sc/synths/ore/*.yaml` × 9
- `sc/modulation-rules/ore.yaml`
- `sound-lab/.previews/ore_*.wav` × 9

- [ ] **Step 1: Run batch generation**

```bash
npm run sound-lab -- --substance ORE
```

Note: ORE's inharmonic requirements (FM, ring-mod) may cause the agent more trouble than earlier substances. Expect a higher dud rate (~30-40%). Plan for 3-4 re-rolls across the 9 families.

- [ ] **Step 2: Check validation output and re-roll failures**

ORE-specific validation note: FM synths can produce DC offset or very low RMS if FM ratio is wrong. If `RMS < 0.05` on drone or pad, it's likely an FM ratio issue. Re-roll with `--force --interactive` and specify "use FM ratios that produce audible harmonic content; avoid FM ratios that produce near-DC output".

- [ ] **Step 3: Manual ear-check — ORE-specific criteria**

Open `ore_*.wav`. ORE checks:

- Is there inharmonic content? If it sounds like a standard sawtooth or sine, it's wrong.
- Does `ore_drone.wav` feel metallic and cold (not warm like LOAM, not airy like HAZE)?
- Does `ore_perc.wav` feel like a bell or struck metal object?
- Does `ore_pad.wav` produce an unusual, uncomfortable chord (inharmonic partial structure)?
- Does `ore_lead.wav` have FM or ring-mod character (not a clean sawtooth)?

The most likely failure: `ore_drone.wav` defaulting to a clean sine. Re-roll immediately.

- [ ] **Step 4: Re-roll ear-check duds** (same pattern)

Pay special attention to the `--interactive` option for ORE — the brief may need family-specific additions for the agent to produce truly inharmonic content.

- [ ] **Step 5: Bump version and commit**

```bash
# Edit package.json: version → "0.6.5"
git add sc/synths/ore/ sc/modulation-rules/ore.yaml package.json
git commit -m "sound-lab(ε): ORE substance — 9 synths populated"
git tag v0.6.5-M1c-ore
```

**Acceptance check:** `npm run sound-lab -- --validate ORE` exits 0. ORE must be the most sonically distinctive of the six — it should make you uncomfortable in a productive way.

---

## Task 8: Cross-substance audit

**Files created:**
- `docs/sound-substances/AUDIT.md`

This task validates the full 6×9 matrix and confirms that the 36 SUBSTANCE × GESTURE combinations produce meaningfully distinct outputs.

- [ ] **Step 1: Full matrix status check**

```bash
cd /Users/Edo_1/album-gen
npm run sound-lab -- --status
```

Expected: 6×9 grid fully green (54/54). If any cells are still red or yellow (provisional), document them now. Do not proceed to the final commit until at least 50/54 cells are green; provisional cells must be 4 or fewer.

Screenshot (or paste) the matrix output — it will go into `AUDIT.md`.

- [ ] **Step 2: Run cross-substance integration**

```bash
node bin/album-gen.js albums/album-002.yaml
```

The album should generate without errors. Verify determinism:

```bash
node bin/album-gen.js albums/album-002.yaml > /tmp/run1.txt
node bin/album-gen.js albums/album-002.yaml > /tmp/run2.txt
diff /tmp/run1.txt /tmp/run2.txt
```

Expected: empty diff (deterministic). If not deterministic, there is an RNG bug introduced somewhere.

- [ ] **Step 3: Tarot UI smoke test with each substance**

Open the tarot setup screen. For each of the 6 substances:

1. Place the substance card in the dominant slot.
2. Use the ONDA arc (DRIFT → LOOM → CREST → FAULT → DRIFT).
3. Click PESCA → listen to the 30-sec preview.

Confirm:
- Each substance preview sounds different from the others.
- GRIT and JOLT are both aggressive but on different axes (dry-percussive vs. saw-distorted).
- BRINE and HAZE are both ambient but distinguishable (heavier/chorus vs. lighter/clear).
- LOAM is warm-organic, ORE is cold-inharmonic — these should feel like opposites.

Note any pairs that sound too similar — flag for follow-up session work.

- [ ] **Step 4: Distinguishability matrix (manual)**

Create a 6×6 mental matrix: for each substance pair, are they distinguishable by ear in the first 10 seconds of a THRUM song? Mark:
- ✓ = clearly distinct
- ~ = distinguishable but close (needs better modulation rules in future)
- ✗ = indistinguishable (must fix before shipping)

Any ✗ pair must be re-rolled (specifically the families that converge) before proceeding.

- [ ] **Step 5: Write `docs/sound-substances/AUDIT.md`**

Create the file with:

```markdown
# Sound Substance Audit — M1c-ε

**Date:** [current date]
**Version:** v0.6.5 → v0.7.0-M1c

## 6×9 Matrix Status

[paste output of `npm run sound-lab -- --status`]

## Provisional families

[list any families marked provisional with reason]

## Cross-substance distinguishability

[6×6 matrix with ✓/~/✗ marks]

## Notes per substance

### GRIT
[brief notes on what worked, what's provisional]

### JOLT
[brief notes]

### LOAM
[brief notes]

### BRINE
[brief notes]

### ORE
[brief notes]

## Known issues / follow-up

[list anything that was marked provisional or needs iteration]
```

- [ ] **Step 6: Commit audit document**

```bash
cd /Users/Edo_1/album-gen
git add docs/sound-substances/AUDIT.md
git commit -m "docs(ε): cross-substance audit — M1c-ε complete"
```

---

## Task 9: Final tag and README update

**Files modified:**
- `package.json` — final version bump
- `README.md` — M1c status section

- [ ] **Step 1: Run full test suite to confirm M1b regression-free**

```bash
cd /Users/Edo_1/album-gen
npm test
```

Expected: all test files green (same count as after M1c-δ). M1c-ε does not change any code, only data files — regressions here would indicate a test environment issue, not a logic bug. Investigate before proceeding.

- [ ] **Step 2: Decide final version**

Choose between:
- `v0.7.0-M1c` — conservative; M1c is complete but v1.0 is reserved for something bigger (PARTITURA visual in M2?).
- `v1.0.0` — celebratory; the album generator is now a complete 6×9 sonic vocabulary tool.

**Recommendation:** use `v0.7.0-M1c`. Reserve `v1.0.0` for after M2 (PARTITURA visual) — the user explicitly identified that as M2 scope and a complete product. Tag `v0.7.0-M1c` cleanly marks M1c complete without over-claiming.

- [ ] **Step 3: Bump package.json to chosen version**

```bash
# Edit package.json:
#   "version": "0.7.0-M1c"
#   "description": "Generative 5-song album tool (M1c complete: vocabulary, UI, expression, sound lab)"
```

- [ ] **Step 4: Update README.md**

In `README.md`, find or add a "Status" or "Milestone" section and update it:

```markdown
## Milestone status

| Milestone | Tag | Status |
|-----------|-----|--------|
| M0 — foundations | v0.1.0-M0 | ✓ done |
| M1a — live SC stack | v0.2.0-M1a | ✓ done |
| M1b — real composers | v0.3.0-M1b | ✓ done |
| M1c-α — compositional mapping | v0.4.0-M1c-alpha | ✓ done |
| M1c-β — tarot UI | v0.4.1-M1c-beta | ✓ done |
| M1c-γ — expression engine | v0.5.0-M1c-gamma | ✓ done |
| M1c-δ — sound lab CLI + HAZE | v0.6.0-M1c-delta | ✓ done |
| M1c-ε — 5 substances populated | v0.7.0-M1c | ✓ done |
| M2 — PARTITURA visual | — | planned |
| M3 — performance features | — | planned |
```

- [ ] **Step 5: Final commit and tag**

```bash
cd /Users/Edo_1/album-gen
git add package.json README.md
git commit -m "chore(M1c): v0.7.0-M1c — all 6 substances populated, M1c complete"
git tag v0.7.0-M1c
```

---

## Self-review checkpoints

### Checkpoint 1 — Spec section 8.5 coverage

Spec section 8.5 states ε scope as:

> For each remaining substance `[GRIT, JOLT, LOAM, BRINE, ORE]`:
> 1. `npm run sound-lab -- --substance X` (~5-10 min)
> 2. Listen WAV previews + manual review
> 3. Tweak via `--synth Y --force` if needed
> 4. Commit
> 5. Add `docs/sound-substances/<X>.md` (poetic brief used by agent for re-rolls)

Coverage:
- ✓ All 5 substances have dedicated runbook tasks (Tasks 3-7).
- ✓ Each task includes batch generation, validation check, ear-check, re-roll procedure, commit.
- ✓ All 5 poetic briefs written in Task 2 (ahead of generation, so agent has them at dispatch).
- ✓ Post-spec additions: acceptance criteria (Task 1 section), cross-substance audit (Task 8), final tagging (Task 9).

### Checkpoint 2 — Acceptance criteria are concrete, not vague

Every substance task has:
- Binary automated check: `--validate <substance>` exits 0.
- Quantified RMS bounds: `[0.05, 0.7]` (stricter than pipeline's `[0.01, 1.0]`).
- Minimum coverage: 6/9 families pass subjective ear-check before substance ships.
- Specific per-substance distinguishability check against neighboring substance (BRINE vs HAZE; GRIT vs LOAM).
- No vague "sounds good" — each brief has a "must not" list that makes failure concrete.

### Checkpoint 3 — Plan does not over-specify SynthDef code

No SynthDef code is written here. The briefs specify character and constraints, not implementation. The sound-designer-sc agent writes the SynthDefs. The plan only specifies:
- What to tell the agent (poetic brief).
- How to evaluate the result (ear-check criteria + RMS bounds).
- How to respond to failure (re-roll, `--force`, `--interactive`).

This is the correct division of responsibility for a curation-driven runbook.

---

## Quick reference — CLI commands

```bash
# Check matrix status
npm run sound-lab -- --status

# Batch generate all 9 families for a substance
npm run sound-lab -- --substance GRIT

# Re-roll a single family
npm run sound-lab -- --substance GRIT --synth bass --force

# Re-roll with brief editing
npm run sound-lab -- --substance GRIT --synth bass --force --interactive

# Validate a single family
npm run sound-lab -- --validate GRIT/bass

# Validate entire substance (all 9 families)
npm run sound-lab -- --validate GRIT
```

WAV previews live at `sound-lab/.previews/<substance>_<family>.wav` (gitignored). Open in any audio player for ear-check.
