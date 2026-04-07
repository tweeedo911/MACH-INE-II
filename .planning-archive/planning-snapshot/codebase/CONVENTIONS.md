# Conventions

**Analysis Date:** 2026-03-27

---

## Code Style

**Language:** JavaScript ES Modules (native, zero build step). No TypeScript.

**Indentation:** 2-space indentation throughout all source files.

**Quotes:** Single quotes for strings (`'./config.js'`, `'G_dorian'`). Template literals used for interpolation.

**Semicolons:** Always present. No ASI reliance.

**Line length:** Informal ~90 char limit. Long array literals (chord progressions, scale arrays) are allowed to exceed for readability.

**No bundler / no transpiler.** Files loaded directly as `type="module"` by the browser. No `npm`, no `package.json`, no build output directory.

**Server:** `python3 -m http.server 8282`. Chrome/Edge only (WebMIDI requirement).

---

## Naming

**Files:** lowercase kebab-case.
- `composer7.js`, `midi-patterns.js`, `director-events.js`, `presence-multiplier.js`
- Composer files numbered sequentially: `composer.js`, `composer2.js` … `composer7.js`

**Variables and functions:** camelCase.
- `phaseTime`, `arcProgress`, `currentDrone`, `sendMIDINote`, `updateComposer7`, `toggleComposer7`

**Constants (module-level, immutable data):** SCREAMING_SNAKE_CASE.
- `KICK_4x4`, `HAT_CLOSED`, `HAT_OPEN`, `HAT_FOR_PHASE`, `BASS_PATTERNS7`, `BASS_FOR_PHASE7`
- `CHORD_PROGS7`, `PHASE_PRESENCE7`, `MODES7`, `PIVOT_CLASSES7`
- `SWEEP_BARS`, `SWEEP_AMP_BASE`, `SWEEP_BASE_VEL`

**Config object keys:** SCREAMING_SNAKE_CASE for top-level composer blocks, camelCase for inner parameters.
- `CFG.COMPOSER7`, `CFG.COMPOSER7.phases`, `CFG.COMPOSER7.silenceTarget`

**Engine names (string keys):** lowercase single word.
- `'terreno'`, `'meccanica'`, `'deriva'`, `'vortice'`, `'cristallo'`, `'abisso'`, `'solco'`

**Phase names (string keys):** Italian, lowercase single word.
- `'germoglio'`, `'pulsazione'`, `'densita'`, `'rottura'`, `'dissoluzione'`

**Rupture stages:** Italian lowercase noun.
- `'presagio'`, `'infiltrazione'`, `'takeover'`, `'residuo'`

**Arc states:** SCREAMING_SNAKE_CASE English.
- `'SILENCE'`, `'BUILDING'`, `'ACTIVE'`, `'INTENSE'`, `'PEAK'`, `'RELEASE'`

**MIDI channels:** Named by role in comments and the `MIDI_ROLES` export array.
- `CH0=PULSE`, `CH1=GRAIN`, `CH2=DRONE`, `CH3=BASS`, `CH4=CHORDS`, `CH5=VOICE`, `CH6=LEAD`, `CH7=RUPTURE`

**Exported active-state flags:** `composerActive`, `composer2Active` … `composer7Active` (module-level `let`, exported).

**Internal raw imports aliased with `_raw` prefix** when wrapped:
```js
import { sendMIDINote as _rawSend, sendMIDIAllNotesOff } from './midi.js';
import { addMidiNote as _rawAddMidi } from './field.js';
```

---

## Patterns

### Section headers — mandatory box comments

Every logical section in a source file is delimited by a triple-line ASCII box:

```js
// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Composer 7 (SOLCO)
//  G Dorian · 128 BPM · Berlin techno ipnotico · 4/4 fisso
// ═══════════════════════════════════════════════════════════
```

Sub-sections use a single-line dash separator:
```js
// ── KICK — 4/4 INVARIABILE ──
```

### Module structure (every composer file)

1. Box header with engine name, key, BPM, character
2. Imports (CFG, state, raw MIDI, director, colors, field, patterns, presence)
3. Local PM-wrapped send functions
4. Scale/mode arrays (`MODES7 = { G_dorian: [...] }`)
5. Pivot pitch classes as `Set`
6. Pattern arrays (KICK, HAT, BASS, CHORD) as `const` objects
7. Phase-to-pattern lookup tables
8. Presence table per phase
9. State variables (`let`)
10. `initComposerN()` — reset all state
11. `toggleComposerN()` — toggle active flag, call init or sendAllNotesOff
12. `updatePhase(dt)` — advance phase clock
13. `updatePresence(dt)` — lerp presence array toward phase target
14. Per-step render function (tick handler)
15. `updateComposerN(dt)` — main update called each frame
16. `getComposerNStatus()` — returns status object for HUD

### Presence Multiplier wrapping (PM pattern)

Every composer wraps raw MIDI send in a local function that checks PM:

```js
function sendMIDINote(ch, note, vel, dur) {
  const pm = getPresenceMultiplier('solco');
  if (pm < 0.05) return;
  if (!isChannelAllowed('solco', ch)) return;
  _rawSend(ch, note, Math.max(1, Math.round(vel * pm)), dur);
}
```

This is copy-pasted identically in all 7 composers, with only the engine name string changing.

### Config centralization

All numeric parameters live in `src/config.js` as properties of the exported `CFG` object. No magic numbers in source files. Parameters are commented inline:

```js
kickDominanceThreshold: 0.6,  // pm below this = kick suppressed (prevents CH0 overlap)
```

### Exponential Moving Average (EMA) smoothing

Used everywhere for audio-reactive values. Always the form `value = value * SMOOTH + raw * (1 - SMOOTH)`:

```js
state.intensity = state.intensity * SMOOTH + rawIntensity * (1 - SMOOTH);
```

Smoothing constant is either a named local const or sourced from CFG.

### Object pooling for entities (GC avoidance)

`src/generations.js` uses pre-allocated object pools:

```js
const _entityPool = [];
const _fossilPool = [];
// ...
const e = _entityPool.length > 0 ? _entityPool.pop() : {};
```

Entities are recycled via swap-and-pop rather than `splice`.

### Weighted random selection

Used in voice/melody selection inside composers. Pattern: build a probability pool array, iterate with decreasing `r`:

```js
let r = Math.random() * total;
for (const entry of pool) {
  r -= entry.w;
  if (r <= 0) { chosen = entry.n; break; }
}
```

### Presence array (per-composer channel mix)

Each composer holds a `presence[7]` float array (one slot per MIDI channel). Phase targets are declared in a `PHASE_PRESENCE_N` lookup table. Updated each frame via linear lerp toward target:

```js
presence[i] += (target[i] - presence[i]) * dt * 0.4;
```

### Step sequencer pattern

16-step binary arrays (`1` = trigger, `0` = rest) for rhythmic patterns. Index by bar to advance through pattern variation tables:

```js
const KICK_4x4 = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0];
```

Phase-to-pattern tables map phase name → array of pattern indices to cycle through.

### Event bus (director-events.js)

Pub/sub with three functions: `on(event, cb)`, `off(event, cb)`, `emit(event, data)`. Used for Composer 2 → Director communication with typed semantic events (`tension`, `void`, `grain_entry`, `chord_change`, `rupture_stage`, `density_peak`).

### Operator comments

Italian inline comments appear next to musical/sonic intent; English for technical logic. This bilingual split is explicit in RULES.md and CLAUDE.md.

---

## Error Handling

**Audio init failure:** Caught in `main.js` at boot. On failure, hides start screen and shows error screen:

```js
try {
  await initAudio();
} catch (e) {
  startScreen.style.display = 'none';
  errorScreen.style.display = 'flex';
  return;
}
```

**MIDI init:** `initMIDI()` is called with `await` but no try/catch — MIDI failure is non-fatal, the system continues without it. State errors are caught inside `src/midi.js` with the pattern `catch (e) { ... }`.

**SessionStorage (sequencer state save/recover):** Silent fail pattern:

```js
try { sessionStorage.setItem(SAVE_KEY, JSON.stringify(st)); } catch (_) { /* silent */ }
```

**MIDI clock handler:** Error caught and logged, but clock kept alive:

```js
} catch (e) {
  console.error('[MIDI CLOCK] Handler error (clock kept alive):', e);
}
```

**MIDI port open:** Silent ignore: `input.open().catch(() => {})`.

**No defensive validation** on internal function arguments between modules — modules trust each other to pass correct types. Validation only at external API boundaries (audio/MIDI device init).

**No custom Error subclasses.** Errors are either caught-and-ignored or caught-and-displayed.

**console.log for lifecycle events** (not a debug artifact — intentional). Each composer logs ON/OFF and phase transitions with a bracketed prefix:
```
[COMPOSER7] ON — G Dorian SOLCO 128bpm
[COMPOSER7] → densita
```

---

## Domain-Specific Conventions

### Engine identity

Each of the 7 compositional engines has a fixed identity object defined in `src/config.js`:
- Italian name (SCREAMING_CAPS used as display label): TERRENO, MECCANICA, DERIVA, VORTICE, CRISTALLO, ABISSO, SOLCO
- Modal key: `G_dorian`, `D_phrygian`, `A_lydian`, etc. Format: `{Note}_{mode}` camelCase
- Root MIDI note: integer (e.g., `55` = G3), always commented with note name
- BPM: integer or `null` for brightness-triggered engines (DERIVA)

### MIDI note numbering

Absolute MIDI note numbers are used everywhere. Notes are commented with their name and octave:
```js
gravitationalCenter: 55, // G3
currentDrone = 55;  // G3
```

Scale/mode arrays are laid out as flat arrays of absolute MIDI integers spanning 2–3 octaves.

### Formal arc phases (5-phase structure)

Every engine cycles through exactly these 5 Italian phases in order:
1. `germoglio` — seed/silence
2. `pulsazione` — building pulse
3. `densita` — dense/intense
4. `rottura` — rupture/peak
5. `dissoluzione` — dissolution/release

Phase durations are in seconds, declared in `CFG.COMPOSER_N.phases[phaseName].duration`.

### Rupture stages (4 mandatory sub-phases)

The `rottura` phase always has exactly 4 sub-stages, never simplified:
1. `presagio` — omen
2. `infiltrazione` — infiltration
3. `takeover` — takeover
4. `residuo` — residue

Referenced as either progress thresholds (float 0–1) or range arrays `[start, end]`.

### Channel role convention

MIDI channel numbers (0-indexed) map to fixed roles across all engines:
- CH0 = PULSE (kick/percussive)
- CH1 = GRAIN (texture/hi-hat/scatter)
- CH2 = DRONE (sustained harmonic root)
- CH3 = BASS (bass line)
- CH4 = CHORDS (harmonic layer)
- CH5 = VOICE (melodic/lead voice)
- CH6 = LEAD (secondary melodic)
- CH7 = RUPTURE (special chaos layer)

Not all engines use all channels. Allowed channels per engine are declared in `src/presence-multiplier.js` → `PRIMARY_CH`.

### Voice leading constraint

Maximum melodic leap is governed by `CFG.COMPOSER_N.voiceLeadingMax` (in steps/semitones, varies 1–3 per engine). Applied during note selection to prefer stepwise motion.

### Silence ratio targets

Each engine declares `silenceTarget[phaseName]` as a float 0–1 representing target fraction of silence. Higher = more sparse. Used to gate note emission probability.

### Chord progressions format

Chord voicings are arrays of absolute MIDI note arrays. `null` means no chords in that phase:
```js
densita: [[55,58,62,65],[57,60,64,67],[60,64,67,70],[55,58,62,65]],
rottura: null,
```

### Humanization

Micro-timing variation is called `humanize` and applied as `(Math.random() - 0.5) * N` where N is a small integer (4–8). Swing offsets in ms come from `CFG.COMPOSER2.swingMsMax` and related keys.

### Versioning commit format

```
vX.Y.Z: descrizione breve (max 72 chars)
```

Every version requires: CHANGELOG.md entry + `versions/` snapshot + git commit.

### Language split rule

- **Source code** (variables, function names, technical comments): English
- **Project documentation** (README, CHANGELOG, RULES, DESIGN): Italian
- **Musical/compositional comments** inside source files: Italian (sonic intent, voicing descriptions)

---

*Convention analysis: 2026-03-27*
