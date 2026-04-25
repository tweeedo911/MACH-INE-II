# album-gen M1c-δ — Sound Lab CLI + AI Sound-Designer Agent + HAZE Pilot

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained Sound Lab sub-system: a Node CLI (`sound-lab-cli.js`) that constructs a structured brief, dispatches a Claude Sonnet subagent (via `claude --print`), parses its response for `.scd` + `.yaml` fenced blocks, validates them (sclang boot + RMS + leak check), renders WAV previews, and auto-commits on success. Populate 1 pilot substance — **HAZE** — end-to-end: 9 SynthDef files + modulation rules + WAV previews.

**Architecture summary:** The CLI is the orchestration shell. It writes a brief, shells out to `claude --print --model sonnet` with that brief as stdin, parses the two fenced code blocks from the response, writes files, invokes `sclang` for validation, renders WAV previews, and commits. No network APIs, no custom servers. Requires the `claude` CLI to be installed (it is, since this project is developed inside Claude Code) and `sclang` to be on PATH.

**Tech stack:** Node 20+ ESM, `child_process.execSync`/`spawnSync`, `js-yaml` (already in `package.json`), `sclang` (supercollider), `claude` CLI (anthropic Claude Code CLI).

**Reference spec:** [2026-04-25-album-gen-M1c-design.md](../specs/2026-04-25-album-gen-M1c-design.md), Sections 3.1–3.6 and 5.7.

**Dependencies:** M1c-γ merged at `v0.5.0-M1c-gamma`. Specifically: (a) the SynthDef extras-args metadata contract (`sc/synths/<sub>/<family>.yaml`) is established in γ; (b) `sc/modulation-rules/_default.yaml` exists; (c) `album-engine.scd` already parses `k v` pairs after `freq amp dur` in the `/synth/<n>/note` handler; (d) `src/mapping/substance-presets.yaml` (from α) has the HAZE entry with `synth_dir: sc/synths/haze/`.

**Non-goals for δ:**
- No tarot UI changes (β).
- No expression-weaver changes (γ).
- Does not populate substances GRIT, JOLT, LOAM, BRINE, ORE — that is M1c-ε.
- No `--interactive` mode (brief editing before dispatch) — deferred to ε or polish pass.
- No automated CI integration — this is a developer-run tool.

---

## Agent dispatch: Mode B (primary) vs Mode A (fallback)

### Mode B — `claude --print` (primary, recommended)

The CLI shells out to the Claude CLI directly:

```bash
claude --print --model claude-sonnet-4-5 "$(cat /path/to/brief.md)"
```

The response is a plain-text string containing exactly two markdown-fenced code blocks: one ` ```scd ` and one ` ```yaml `. The CLI parses these with a regex and writes the extracted content to the appropriate files.

**Why Mode B:** Self-contained. The user can run `npm run sound-lab -- --substance HAZE` from any terminal without needing Claude Code's chat context. The claude CLI is already installed (this project is built inside Claude Code). Mode B is also testable offline (mock the `claude` call).

**Prerequisite:** `claude` CLI available on PATH. Verify: `which claude`. If missing, fall back to Mode A.

### Mode A — orchestrator-driven (fallback)

The CLI:
1. Writes the brief to `sound-lab/.scratch/brief-<substance>-<family>.md`.
2. Prints `>>> DISPATCH NEEDED: Claude, please read sound-lab/.scratch/brief-haze-bass.md and run the sound-designer-sc subagent. Write results to sc/synths/haze/bass.scd and sc/synths/haze/bass.yaml. Then re-run: npm run sound-lab -- --validate HAZE/bass`.
3. Exits with code 2 (signals "dispatch needed").

The human (or orchestrating Claude Code session) reads the output, dispatches a subagent, and then re-runs the CLI with `--validate-only` to complete the pipeline.

**Mode A is documented in `sound-lab/sound-lab-cli.js` as a detected fallback** (`if (!whichClaude) { modAFallback(); process.exit(2); }`).

---

## File structure

All paths relative to `/Users/Edo_1/album-gen/`.

**New files:**

```
sound-lab/
├── sound-lab-cli.js             # CLI entry point
├── agent-brief-template.md      # template with {{PLACEHOLDERS}}
├── validate-synthdef.scd        # sclang validation script
├── wav-render.scd               # sclang WAV preview renderer
├── .gitignore                   # ignores .previews/ and .scratch/
└── .previews/                   # WAV output, gitignored
    └── haze_bass.wav            # (example, after Task 14)

docs/sound-substances/
└── HAZE.md                      # poetic brief for HAZE (agent input)

sc/synths/haze/
├── drone.scd + drone.yaml
├── pad.scd + pad.yaml
├── bass.scd + bass.yaml
├── kick.scd + kick.yaml
├── snare.scd + snare.yaml
├── hat.scd + hat.yaml
├── lead.scd + lead.yaml
├── perc.scd + perc.yaml
└── texture.scd + texture.yaml

sc/modulation-rules/
└── haze.yaml                    # generated + curated

test/
└── sound-lab-cli.test.js        # CLI arg parsing + status matrix (no sclang)
```

**Modified files:**

- `package.json` — version `0.6.0-M1c-delta`, add `sound-lab` script
- `sc/album-engine.scd` — add `/sound-lab/reload <path>` OSC handler
- `src/mapping/substance-presets.yaml` — confirm HAZE entry (was set in α; verify only)

---

## Self-review checkpoints

Before this plan is executed, verify each spec section has at least one task:

| Spec section | Covered by |
|---|---|
| 3.1 CLI interface | Tasks 2, 3, 4, 8, 9 |
| 3.2 Agent brief template | Tasks 7, 8 |
| 3.3 Per-synth metadata format | Task 9 (parser extracts `.yaml` block) |
| 3.4 Validation pipeline | Tasks 3, 4 (validate-synthdef.scd + CLI wrapper) |
| 3.5 Hot-reload during live | Task 13 |
| 3.6 Output — 6×9 matrix | Tasks 2 (--status), 12 (batch HAZE), 14 (pilot) |
| 5.7 Agent emits modulation rules | Tasks 7–9 (brief instructs agent; merge into haze.yaml in Task 12) |

---

## Task 1: Repo bump + scaffold `sound-lab/` and `sc/synths/haze/`

**Files:**
- Modify: `/Users/Edo_1/album-gen/package.json`
- Create: `/Users/Edo_1/album-gen/sound-lab/` (directory)
- Create: `/Users/Edo_1/album-gen/sc/synths/haze/` (directory)
- Create: `/Users/Edo_1/album-gen/docs/sound-substances/` (directory)
- Create: `/Users/Edo_1/album-gen/sound-lab/.gitignore`

- [ ] **Step 1: Bump version and add sound-lab script in package.json**

Modify `/Users/Edo_1/album-gen/package.json`:

```json
{
  "name": "album-gen",
  "version": "0.6.0-M1c-delta",
  "description": "Generative 5-song album tool (M1c-δ: Sound Lab CLI + HAZE pilot)",
  "type": "module",
  "private": true,
  "bin": {
    "album-gen": "./bin/album-gen.js"
  },
  "scripts": {
    "test": "node test/all.js",
    "start": "node bin/album-gen.js albums/album-001.yaml",
    "bridge": "node bridge/osc-bridge.js",
    "serve": "python3 -m http.server 8282",
    "sound-lab": "node sound-lab/sound-lab-cli.js"
  },
  "dependencies": {
    "js-yaml": "^4.1.0",
    "osc": "^2.4.4",
    "ws": "^8.16.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 2: Create scaffold directories**

```bash
mkdir -p /Users/Edo_1/album-gen/sound-lab/.previews
mkdir -p /Users/Edo_1/album-gen/sound-lab/.scratch
mkdir -p /Users/Edo_1/album-gen/sc/synths/haze
mkdir -p /Users/Edo_1/album-gen/docs/sound-substances
```

- [ ] **Step 3: Write `sound-lab/.gitignore`**

Write `/Users/Edo_1/album-gen/sound-lab/.gitignore`:

```
# WAV previews — large binary, gitignored. Re-generate with:
#   npm run sound-lab -- --substance HAZE
.previews/

# Ephemeral scratch files (briefs, partial responses)
.scratch/
```

- [ ] **Step 4: Verify M1c-γ test suite is green**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all test files green (M1b + M1c-α/β/γ test suites).

- [ ] **Step 5: Commit scaffold**

```bash
cd /Users/Edo_1/album-gen
git add package.json sound-lab/.gitignore
git commit -m "chore(m1c-δ): bump to 0.6.0-M1c-delta, scaffold sound-lab/"
```

---

## Task 2: CLI skeleton + `--status` matrix

**Files:**
- Create: `/Users/Edo_1/album-gen/sound-lab/sound-lab-cli.js`

The `--status` command scans `sc/synths/<substance>/<family>.scd` on disk and prints the 6×9 coverage matrix.

- [ ] **Step 1: Write the CLI skeleton with `--status`**

Write `/Users/Edo_1/album-gen/sound-lab/sound-lab-cli.js`:

```js
#!/usr/bin/env node
// sound-lab-cli.js — Sound Lab CLI for album-gen M1c-δ
// Usage: npm run sound-lab -- [options]

import { existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import yaml from "js-yaml";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SYNTHS_DIR = resolve(ROOT, "sc/synths");
const MODULATION_DIR = resolve(ROOT, "sc/modulation-rules");
const PREVIEWS_DIR = resolve(ROOT, "sound-lab/.previews");
const SCRATCH_DIR = resolve(ROOT, "sound-lab/.scratch");
const SOUND_LAB_DIR = resolve(ROOT, "sound-lab");
const DOCS_SUBSTANCES_DIR = resolve(ROOT, "docs/sound-substances");

const SUBSTANCES = ["GRIT", "BRINE", "ORE", "HAZE", "JOLT", "LOAM"];
const FAMILIES = ["drone", "pad", "bass", "kick", "snare", "hat", "lead", "perc", "texture"];

// ── Argument parsing ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const opts = {
  status:        args.includes("--status"),
  substance:     argValue("--substance"),
  synth:         argValue("--synth"),
  validate:      argValue("--validate"),
  force:         args.includes("--force"),
  validateOnly:  args.includes("--validate-only"),
};

function argValue(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
}

// ── Entry point ─────────────────────────────────────────────────────────────

if (opts.status) {
  printStatus();
} else if (opts.validate) {
  // --validate HAZE/bass
  const [sub, fam] = opts.validate.split("/");
  process.exit(await runValidation(sub.toLowerCase(), fam) ? 0 : 1);
} else if (opts.substance && !opts.synth) {
  // --substance HAZE  (batch: all 9 families)
  await runBatch(opts.substance.toUpperCase());
} else if (opts.substance && opts.synth) {
  // --substance HAZE --synth bass  (single)
  await runSingle(opts.substance.toUpperCase(), opts.synth.toLowerCase(), opts.force);
} else {
  console.error("Usage:");
  console.error("  npm run sound-lab -- --status");
  console.error("  npm run sound-lab -- --substance HAZE");
  console.error("  npm run sound-lab -- --substance HAZE --synth bass [--force]");
  console.error("  npm run sound-lab -- --validate HAZE/bass");
  process.exit(1);
}

// ── Status matrix ────────────────────────────────────────────────────────────

function printStatus() {
  const COL_W = 8;
  const header = "         " + FAMILIES.map(f => f.padEnd(COL_W)).join(" ");
  console.log(header);
  console.log("-".repeat(header.length));

  let total = 0;
  let populated = 0;

  for (const sub of SUBSTANCES) {
    const subDir = resolve(SYNTHS_DIR, sub.toLowerCase());
    const row = FAMILIES.map(fam => {
      total++;
      const scdPath = resolve(subDir, `${fam}.scd`);
      const yamlPath = resolve(subDir, `${fam}.yaml`);
      const hasScd = existsSync(scdPath);
      const hasYaml = existsSync(yamlPath);
      if (hasScd && hasYaml) { populated++; return "[ok]    "; }
      if (hasScd)             { return "[scd]   "; }
      if (hasYaml)            { return "[yaml]  "; }
      return "[ ]     ";
    });
    console.log(sub.padEnd(9) + row.join(" "));
  }

  const modRulesOk = SUBSTANCES.filter(s =>
    existsSync(resolve(MODULATION_DIR, `${s.toLowerCase()}.yaml`))
  );

  console.log("-".repeat(header.length));
  console.log(`Coverage: ${populated}/${total} synths fully populated.`);
  console.log(`Modulation rules: ${modRulesOk.join(", ") || "(none)"}`);
}

// ── Stubs for Tasks 4, 9, 10, 11, 12 (filled in later tasks) ────────────────

async function runValidation(substance, family) {
  // Implemented in Task 4
  console.error("[sound-lab] runValidation: not yet implemented");
  return false;
}

async function runSingle(substance, family, force) {
  // Implemented in Task 9
  console.error("[sound-lab] runSingle: not yet implemented");
}

async function runBatch(substance) {
  // Implemented in Task 12
  console.error("[sound-lab] runBatch: not yet implemented");
}
```

- [ ] **Step 2: Smoke-test `--status`**

```bash
cd /Users/Edo_1/album-gen && npm run sound-lab -- --status
```

Expected output: a 6×9 matrix with all cells `[ ]` except any `_shared` synths. Should not crash.

- [ ] **Step 3: Commit**

```bash
cd /Users/Edo_1/album-gen
git add sound-lab/sound-lab-cli.js
git commit -m "feat(m1c-δ): sound-lab CLI skeleton + --status matrix"
```

---

## Task 3: `validate-synthdef.scd` — sclang validation script

**Files:**
- Create: `/Users/Edo_1/album-gen/sound-lab/validate-synthdef.scd`

This script is invoked by the CLI as:

```bash
sclang -i 0 -D sound-lab/validate-synthdef.scd haze_bass /path/to/bass.scd
```

It boots the server, loads the `.scd` file, instantiates the SynthDef, records 200ms, checks RMS, checks zero active nodes after free, then exits printing `[ok]` or `[fail <reason>]`.

- [ ] **Step 1: Write `validate-synthdef.scd`**

Write `/Users/Edo_1/album-gen/sound-lab/validate-synthdef.scd`:

```supercollider
// validate-synthdef.scd
// Args: synthName synthFilePath
// Output: [ok] or [fail <reason>]
// Exit code: 0 = pass, 1 = fail

(
var synthName, synthFile, outFile, rms, passed;
var args = thisProcess.argv;

if (args.size < 2) {
    "[fail no-args] Usage: sclang validate-synthdef.scd <synthName> <filePath>".postln;
    0.exit(1);
};

synthName = args[0].asSymbol;
synthFile = args[1];
outFile   = thisProcess.platform.userAppSupportDir ++ "/validate-tmp.wav";

if (File.exists(synthFile).not) {
    ("[fail file-not-found] " ++ synthFile).postln;
    0.exit(1);
};

s.options.numOutputBusChannels = 2;
s.options.numInputBusChannels  = 0;
s.options.blockSize = 64;

s.waitForBoot({
    // Step 1: load the SynthDef file
    synthFile.load;
    s.sync;

    // Check SynthDef was registered
    if (SynthDescLib.global.at(synthName).isNil) {
        ("[fail synthdef-not-registered] " ++ synthName).postln;
        s.quit;
        0.exit(1);
    };

    // Step 2: record 200ms
    s.record(outFile, numChannels: 2);
    s.sync;
    Synth(synthName);
    0.2.wait;
    s.stopRecording;
    s.sync;
    0.05.wait;  // flush buffer

    // Step 3: RMS check via SoundFile
    (
        var sf, data, sumSq, n, rmsVal;
        sf = SoundFile.new;
        if (sf.openRead(outFile).not) {
            "[fail wav-not-readable]".postln;
            s.quit;
            0.exit(1);
        };
        n    = sf.numFrames * sf.numChannels;
        data = FloatArray.newClear(n);
        sf.readData(data);
        sf.close;
        sumSq = data.inject(0, { |acc, v| acc + (v * v) });
        rmsVal = (sumSq / n).sqrt;
        "[rms " ++ rmsVal.round(0.0001) ++ "]".postln;
        if (rmsVal < 0.01) {
            "[fail rms-too-low] RMS=" ++ rmsVal ++ " (threshold 0.01)".postln;
            s.quit;
            0.exit(1);
        };
        if (rmsVal >= 1.0) {
            "[fail rms-clipping] RMS=" ++ rmsVal ++ " (threshold 1.0)".postln;
            s.quit;
            0.exit(1);
        };
    );

    // Step 4: leak check — all nodes should be freed (doneAction:2)
    0.5.wait;
    s.sync;
    if (s.numSynths > 0) {
        ("[fail leak] " ++ s.numSynths ++ " synths still active").postln;
        s.freeAll;
        s.quit;
        0.exit(1);
    };

    // All checks passed
    "[ok]".postln;
    s.quit;
    0.exit(0);
});
)
```

**Notes on the sclang invocation:**
- `-i 0` disables interactive mode (no prompt).
- `-D` sets standalone mode.
- `thisProcess.argv` receives the extra args after the script path.
- `s.record` writes to a temp WAV; `SoundFile` reads it back for RMS.
- `s.numSynths` checks the node count after a 500ms grace period.

- [ ] **Step 2: Manual smoke test (requires sclang)**

```bash
# Test against a known M1a synth:
sclang -i 0 -D /Users/Edo_1/album-gen/sound-lab/validate-synthdef.scd \
  bass /Users/Edo_1/album-gen/sc/synths/bass.scd
```

Expected: `[rms ...]` followed by `[ok]`.

If sclang is not on PATH: `export PATH="/Applications/SuperCollider.app/Contents/MacOS:$PATH"` (note actual path may vary). If this fails at this stage, mark as deferred — validation is tested end-to-end in Task 14.

- [ ] **Step 3: Commit**

```bash
cd /Users/Edo_1/album-gen
git add sound-lab/validate-synthdef.scd
git commit -m "feat(m1c-δ): validate-synthdef.scd (sclang boot+RMS+leak)"
```

---

## Task 4: CLI `--validate` command

**Files:**
- Modify: `/Users/Edo_1/album-gen/sound-lab/sound-lab-cli.js`

Replace the `runValidation` stub with the real implementation that invokes `sclang`.

- [ ] **Step 1: Replace `runValidation` stub in `sound-lab-cli.js`**

Replace:
```js
async function runValidation(substance, family) {
  // Implemented in Task 4
  console.error("[sound-lab] runValidation: not yet implemented");
  return false;
}
```

With:
```js
// ── Validation ───────────────────────────────────────────────────────────────

async function runValidation(substance, family) {
  const scdPath  = resolve(SYNTHS_DIR, substance, `${family}.scd`);
  const yamlPath = resolve(SYNTHS_DIR, substance, `${family}.yaml`);
  const synthName = `${substance}_${family}`;
  const validateScript = resolve(SOUND_LAB_DIR, "validate-synthdef.scd");

  console.log(`[validate] ${substance}/${family} → ${synthName}`);

  // 1. File existence
  if (!existsSync(scdPath))  { console.error(`[fail] missing: ${scdPath}`);  return false; }
  if (!existsSync(yamlPath)) { console.error(`[fail] missing: ${yamlPath}`); return false; }

  // 2. YAML schema check
  try {
    const meta = yaml.load(readFileSync(yamlPath, "utf8"));
    if (!meta.name || !meta.substance || !meta.family || !Array.isArray(meta.required)) {
      console.error(`[fail] YAML schema invalid: missing name/substance/family/required in ${yamlPath}`);
      return false;
    }
    if (meta.name !== synthName) {
      console.error(`[fail] YAML name mismatch: expected '${synthName}', got '${meta.name}'`);
      return false;
    }
  } catch (e) {
    console.error(`[fail] YAML parse error: ${e.message}`);
    return false;
  }

  // 3. sclang boot + RMS + leak check
  const result = spawnSync(
    "sclang",
    ["-i", "0", "-D", validateScript, synthName, scdPath],
    { encoding: "utf8", timeout: 30_000 }
  );

  const stdout = (result.stdout || "").trim();
  const stderr = (result.stderr || "").trim();

  // Echo sclang output for diagnostics
  if (stdout) stdout.split("\n").forEach(l => console.log(`  [sc] ${l}`));
  if (stderr && result.status !== 0) stderr.split("\n").forEach(l => console.error(`  [sc-err] ${l}`));

  if (result.status !== 0 || !stdout.includes("[ok]")) {
    const failLine = stdout.split("\n").find(l => l.includes("[fail")) || "unknown failure";
    console.error(`[validate] FAIL ${substance}/${family}: ${failLine}`);
    return false;
  }

  console.log(`[validate] OK ${substance}/${family}`);
  return true;
}
```

- [ ] **Step 2: Test `--validate` against an existing synth**

```bash
# First confirm a known synth validates:
cd /Users/Edo_1/album-gen
# Create a minimal test copy in sc/synths/_shared/ if needed (from Task 3).
# When HAZE synths exist (Task 14), this command will work fully:
npm run sound-lab -- --validate HAZE/bass
```

For now, just verify it fails with a clean error message if the file is missing:
```bash
npm run sound-lab -- --validate HAZE/bass
# Expected: [fail] missing: .../sc/synths/haze/bass.scd
```

- [ ] **Step 3: Commit**

```bash
cd /Users/Edo_1/album-gen
git add sound-lab/sound-lab-cli.js
git commit -m "feat(m1c-δ): CLI --validate command (schema + sclang RMS+leak)"
```

---

## Task 5: `wav-render.scd` — WAV preview renderer

**Files:**
- Create: `/Users/Edo_1/album-gen/sound-lab/wav-render.scd`

This script renders 5 seconds of the SynthDef playing 4 notes across the register to a WAV file in `.previews/`.

- [ ] **Step 1: Write `wav-render.scd`**

Write `/Users/Edo_1/album-gen/sound-lab/wav-render.scd`:

```supercollider
// wav-render.scd
// Args: synthName synthFilePath outWavPath
// Renders 5 seconds, 4 notes (register lo + steps), to outWavPath.
// Exit: 0 on success.

(
var args = thisProcess.argv;
var synthName, synthFile, outFile;
var notes = #[36, 48, 55, 67];  // representative pitches across register
var noteAmp = 0.45;
var noteDur = 1.0;

if (args.size < 3) {
    "[render-fail no-args] Usage: sclang wav-render.scd <synthName> <filePath> <outPath>".postln;
    0.exit(1);
};

synthName = args[0].asSymbol;
synthFile = args[1];
outFile   = args[2];

if (File.exists(synthFile).not) {
    ("[render-fail file-not-found] " ++ synthFile).postln;
    0.exit(1);
};

s.options.numOutputBusChannels = 2;
s.options.numInputBusChannels  = 0;

s.waitForBoot({
    synthFile.load;
    s.sync;

    if (SynthDescLib.global.at(synthName).isNil) {
        ("[render-fail synthdef-not-registered] " ++ synthName).postln;
        s.quit;
        0.exit(1);
    };

    s.record(outFile, numChannels: 2);
    s.sync;

    // Play 4 notes, spaced 1.1s apart (5s total render window)
    notes.doWithIndex { |midi, i|
        var freq = midi.midicps;
        (i * 1.1).wait;
        Synth(synthName, [\freq, freq, \amp, noteAmp, \dur, noteDur]);
    };

    // Allow last note to decay
    (notes.size * 1.1 + 0.5).wait;
    s.stopRecording;
    s.sync;
    0.1.wait;

    ("[render-ok] " ++ outFile).postln;
    s.quit;
    0.exit(0);
});
)
```

- [ ] **Step 2: Commit**

```bash
cd /Users/Edo_1/album-gen
git add sound-lab/wav-render.scd
git commit -m "feat(m1c-δ): wav-render.scd (5s 4-note WAV preview)"
```

---

## Task 6: CLI WAV rendering integration

**Files:**
- Modify: `/Users/Edo_1/album-gen/sound-lab/sound-lab-cli.js`

Add the `renderWav(substance, family)` function that invokes `wav-render.scd` after successful validation, writing to `sound-lab/.previews/<substance>_<family>.wav`.

- [ ] **Step 1: Add `renderWav` function to `sound-lab-cli.js`**

Add after the `runValidation` function:

```js
// ── WAV Preview Rendering ─────────────────────────────────────────────────────

function renderWav(substance, family) {
  const scdPath    = resolve(SYNTHS_DIR, substance, `${family}.scd`);
  const synthName  = `${substance}_${family}`;
  const renderScript = resolve(SOUND_LAB_DIR, "wav-render.scd");
  const outWav     = resolve(PREVIEWS_DIR, `${substance}_${family}.wav`);

  mkdirSync(PREVIEWS_DIR, { recursive: true });

  console.log(`[render] ${synthName} → ${outWav}`);

  const result = spawnSync(
    "sclang",
    ["-i", "0", "-D", renderScript, synthName, scdPath, outWav],
    { encoding: "utf8", timeout: 30_000 }
  );

  const stdout = (result.stdout || "").trim();
  if (result.status !== 0 || !stdout.includes("[render-ok]")) {
    console.error(`[render] FAIL ${substance}/${family}`);
    return false;
  }
  console.log(`[render] OK → ${outWav}`);
  return true;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/Edo_1/album-gen
git add sound-lab/sound-lab-cli.js
git commit -m "feat(m1c-δ): CLI WAV preview rendering via wav-render.scd"
```

---

## Task 7: `agent-brief-template.md` + HAZE substance doc

**Files:**
- Create: `/Users/Edo_1/album-gen/sound-lab/agent-brief-template.md`
- Create: `/Users/Edo_1/album-gen/docs/sound-substances/HAZE.md`

### 7a: Brief template

The template contains `{{PLACEHOLDERS}}` that the CLI fills in per call.

- [ ] **Step 1: Write `agent-brief-template.md`**

Write `/Users/Edo_1/album-gen/sound-lab/agent-brief-template.md`:

```markdown
ROLE: You are a SuperCollider sound designer creating a SynthDef for the album-gen project.
Your output will be validated automatically: sclang must load it without errors,
Synth instantiation must produce RMS > 0.01 and < 1.0 over 200ms, and all nodes
must self-free (doneAction: 2 in the primary envelope).

---

SUBSTANCE: {{SUBSTANCE_NAME}} — {{SUBSTANCE_POETIC}}
Sonic qualities: {{SUBSTANCE_SONIC_QUALITIES}}
Register bias: {{SUBSTANCE_REGISTER_BIAS}}

FAMILY: {{FAMILY_NAME}} — {{FAMILY_ROLE}}
Register range: {{FAMILY_REGISTER_RANGE}}

---

CONTRACT (MUST comply exactly):
- SynthDef name: \{{SYNTHDEF_NAME}}
- Required args: freq={{FREQ_DEFAULT}}, amp={{AMP_DEFAULT}}, dur={{DUR_DEFAULT}}
- Allowed extra args: {{EXTRA_ARGS_LIST}}
  (each extra arg must have a sensible default in the SynthDef arg list)
- Use `Out.ar(0, sig ! 2)` for stereo output
- doneAction: 2 in the primary EnvGen (self-frees when envelope ends)
- NO Buffers, NO SoundIn, NO SystemClock, NO blocking calls
- Pure synthesis only

CHARACTER (poetic direction — let this inform timbre and envelope shape):
{{CHARACTER_DESCRIPTION}}

MODULATION RULES (output alongside the SynthDef):
Also produce a YAML block describing how each extra arg should be modulated.
For each extra arg, specify: source signal (velocity / phaseProgress / lfo_slow /
lfo_med / density.bass / random), shape (linear / exp / log / inv), and range [lo, hi].
Example source signals:
  velocity      — per-note 0..1 (normalized MIDI velocity)
  phaseProgress — 0..1 across the song
  lfo_slow      — sin at ~0.05 Hz
  density.bass  — bass layer density 0..0.9

---

OUTPUT FORMAT:
Respond with EXACTLY two fenced code blocks, in this order, with no other fenced blocks:

```scd
SynthDef(\{{SYNTHDEF_NAME}}, { |freq={{FREQ_DEFAULT}}, amp={{AMP_DEFAULT}}, dur={{DUR_DEFAULT}}, {{EXTRA_ARGS_SIGNATURE}}|
    // your synthesis here
    Out.ar(0, sig ! 2);
}).add;
\```

```yaml
name: {{SYNTHDEF_NAME}}
substance: {{SUBSTANCE_NAME}}
family: {{FAMILY_NAME}}
required: [freq, amp, dur]
extras:
  # one entry per extra arg:
  # argname: { range: [lo, hi], default: val, curve: linear|exp }
  # (omit 'curve' if linear)
modulation_rules:
  # one entry per modulatable extra arg:
  # argname:
  #   source: velocity|phaseProgress|lfo_slow|lfo_med|density.bass|random
  #   shape: linear|exp|log|inv
  #   range: [lo, hi]
notes: "one-line description"
\```

No explanation. No preamble. Only the two fenced code blocks.
```

### 7b: HAZE substance document

- [ ] **Step 2: Write `docs/sound-substances/HAZE.md`**

Write `/Users/Edo_1/album-gen/docs/sound-substances/HAZE.md`:

```markdown
# HAZE — sound substance

**Poetic:** foschia, velature, spazio aperto

**Sonic qualities:**
LPF-heavy, drone-first, long sustains, ambient space.
Low-frequency presence. Filter movement as primary gesture.
Avoid hard attacks. Avoid bright, aggressive timbres.
Reverb and chorus are welcome but must be pure-synthesis (no Buffer, no IR).
Sub-bass presence: the low end should feel expansive, not punchy.

**Register bias:**
- bass: 24–48 Hz (sub territory, broad)
- chords / pad: 55–75 (low mids, veiled)
- melody: 60–84 (mid-range, slow-moving)
- lead: 72–96 (upper mids, gossamer)
- arp / texture: 60–84 (background shimmer)

**Modulation character:**
Cutoff is the primary expressive lever: should open and close slowly.
Drive should be minimal but present — subtle saturation for warmth.
Pan can drift very slowly (lfo_slow).
Nothing should snap or click. Envelopes should be long and soft.

**Per-family poetic direction:**

| Family  | Direction |
|---------|-----------|
| drone   | Single sine tone + slow PWM, infinite sustain envelope (dur=60s default). Heavy LPF. Almost static. |
| pad     | Stacked detuned sine waves (3-5 partials), long attack (2s), long release (3s). Slow chorus via LFO detune. |
| bass    | Sub sine + slightly detuned octave, soft attack, long sustain. Like a fog horn heard from distance. Minimal high content. |
| kick    | Low thump: short sine sweep 80Hz→30Hz, hard 50ms attack, short decay. Padded, not punchy. |
| snare   | A soft breath of noise: band-pass filtered noise (600Hz, narrow), short attack, medium decay (300ms). More exhale than crack. |
| hat     | High-pass filtered noise, very short (80ms). Near-silent, present only as air movement. |
| lead    | Slow sine + subtle FM from a second slightly detuned oscillator. Portamento (glide ~100ms). Very soft attack. |
| perc    | Resonant band-pass ping: single frequency tap with long ring-out (500ms). Like a bowl struck underwater. |
| texture | Continuous noise layer: band-pass filtered noise with very slow amplitude LFO. Fills the space between notes. |

**What NOT to do for HAZE:**
- No saw waves, square waves, or overtone-heavy oscillators.
- No sharp, transient-heavy envelopes.
- No distortion or bit-crushing.
- No dry, percussive sounds (except kick and hat which are inherently transient, but must remain soft).
```

- [ ] **Step 3: Commit both files**

```bash
cd /Users/Edo_1/album-gen
git add sound-lab/agent-brief-template.md docs/sound-substances/HAZE.md
git commit -m "feat(m1c-δ): agent-brief-template + HAZE substance doc"
```

---

## Task 8: CLI brief construction

**Files:**
- Modify: `/Users/Edo_1/album-gen/sound-lab/sound-lab-cli.js`

Add `buildBrief(substance, family)` which fills the template with values drawn from:
- `src/mapping/substance-presets.yaml` (poetic, register, synth_dir)
- `docs/sound-substances/<SUBSTANCE>.md` (character description)
- Hard-coded family metadata table (role, register range, default freq/amp/dur)

- [ ] **Step 1: Add family metadata table and `buildBrief` to `sound-lab-cli.js`**

Add after the constants block (after `FAMILIES = [...]`):

```js
// ── Family metadata (fixed contract) ────────────────────────────────────────

const FAMILY_META = {
  drone:   { role: "continuous drone, harmonic foundation",         freqDef: 55,  ampDef: 0.25, durDef: 60,  extras: "cutoff=0.5, noise=0, pan=0" },
  pad:     { role: "harmonic pad, chord fills",                     freqDef: 220, ampDef: 0.3,  durDef: 4.0, extras: "cutoff=0.6, detune=0.02, pan=0" },
  bass:    { role: "sub-bass (24-50 Hz), harmonic ground",          freqDef: 55,  ampDef: 0.4,  durDef: 0.4, extras: "cutoff=0.6, drive=0, noise=0, pan=0" },
  kick:    { role: "kick drum, low transient",                      freqDef: 60,  ampDef: 0.6,  durDef: 0.3, extras: "drive=0, body=0.5" },
  snare:   { role: "snare drum, mid-frequency crack/breath",        freqDef: 200, ampDef: 0.5,  durDef: 0.25, extras: "tone=0.3, noise=0.7" },
  hat:     { role: "hi-hat, high-frequency air",                    freqDef: 8000,ampDef: 0.35, durDef: 0.08, extras: "open=0, pan=0" },
  lead:    { role: "melodic lead, front-of-mix",                    freqDef: 440, ampDef: 0.35, durDef: 0.5, extras: "cutoff=0.7, drive=0, pan=0" },
  perc:    { role: "auxiliary percussion, accent",                  freqDef: 300, ampDef: 0.4,  durDef: 0.4, extras: "decay=0.4, pan=0" },
  texture: { role: "background texture/noise layer, continuous",    freqDef: 1000,ampDef: 0.15, durDef: 8.0, extras: "density=0.5, cutoff=0.5, pan=0" },
};

// ── Brief construction ───────────────────────────────────────────────────────

function buildBrief(substance, family) {
  const templatePath = resolve(SOUND_LAB_DIR, "agent-brief-template.md");
  const template = readFileSync(templatePath, "utf8");

  // Load substance preset
  const presetsPath = resolve(ROOT, "src/mapping/substance-presets.yaml");
  const presets = yaml.load(readFileSync(presetsPath, "utf8"));
  const sub = presets[substance];
  if (!sub) throw new Error(`Substance '${substance}' not found in substance-presets.yaml`);

  // Load substance poetic doc (CHARACTER section)
  const substanceDocPath = resolve(DOCS_SUBSTANCES_DIR, `${substance}.md`);
  let characterDescription = sub.poetic;
  if (existsSync(substanceDocPath)) {
    const fullDoc = readFileSync(substanceDocPath, "utf8");
    // Extract per-family direction for this family from the table, or use full doc
    const familyMatch = fullDoc.match(new RegExp(`\\|\\s*${family}\\s*\\|([^|]+)\\|`));
    if (familyMatch) {
      characterDescription = familyMatch[1].trim();
    } else {
      // Use the "Sonic qualities" section
      const sonicMatch = fullDoc.match(/\*\*Sonic qualities:\*\*\n([\s\S]+?)\n\n/);
      if (sonicMatch) characterDescription = sonicMatch[1].trim();
    }
  }

  const fam = FAMILY_META[family];
  if (!fam) throw new Error(`Family '${family}' not in FAMILY_META`);

  const synthDefName = `${substance.toLowerCase()}_${family}`;
  const registerRange = sub.register[family] || sub.register.melody;

  // Sonic qualities summary from preset
  const sonicQualities = `${sub.palette_intensity}, ${sub.poetic}`;
  const registerBias = `bass ${sub.register.bass}, lead ${sub.register.lead}`;

  return template
    .replace(/{{SUBSTANCE_NAME}}/g,       substance)
    .replace(/{{SUBSTANCE_POETIC}}/g,     sub.poetic)
    .replace(/{{SUBSTANCE_SONIC_QUALITIES}}/g, sonicQualities)
    .replace(/{{SUBSTANCE_REGISTER_BIAS}}/g,   registerBias)
    .replace(/{{FAMILY_NAME}}/g,          family)
    .replace(/{{FAMILY_ROLE}}/g,          fam.role)
    .replace(/{{FAMILY_REGISTER_RANGE}}/g, registerRange.join("–"))
    .replace(/{{SYNTHDEF_NAME}}/g,        synthDefName)
    .replace(/{{FREQ_DEFAULT}}/g,         fam.freqDef)
    .replace(/{{AMP_DEFAULT}}/g,          fam.ampDef)
    .replace(/{{DUR_DEFAULT}}/g,          fam.durDef)
    .replace(/{{EXTRA_ARGS_LIST}}/g,      fam.extras)
    .replace(/{{EXTRA_ARGS_SIGNATURE}}/g, fam.extras)
    .replace(/{{CHARACTER_DESCRIPTION}}/g, characterDescription);
}
```

- [ ] **Step 2: Write brief to `.scratch/` as a smoke test**

Add a quick CLI flag `--print-brief` for debugging (temporary, remove in cleanup):

```js
// In the top-level args handling, add:
if (args.includes("--print-brief") && opts.substance && opts.synth) {
  const brief = buildBrief(opts.substance.toUpperCase(), opts.synth.toLowerCase());
  console.log(brief);
  process.exit(0);
}
```

Test:
```bash
npm run sound-lab -- --substance HAZE --synth bass --print-brief
```

Expected: the filled-in brief printed to stdout with HAZE-specific values.

- [ ] **Step 3: Commit**

```bash
cd /Users/Edo_1/album-gen
git add sound-lab/sound-lab-cli.js
git commit -m "feat(m1c-δ): CLI brief construction (substance+family → filled template)"
```

---

## Task 9: Agent dispatch (Mode B) + response parser

**Files:**
- Modify: `/Users/Edo_1/album-gen/sound-lab/sound-lab-cli.js`

Replace the `runSingle` stub with the full generation flow: build brief → dispatch `claude --print` → parse response → write files → validate → (on fail) retry up to 3 times.

The response parser uses a regex to extract the two fenced code blocks.

- [ ] **Step 1: Add `dispatchAgent` and `parseAgentResponse` functions**

Add to `sound-lab-cli.js`:

```js
// ── Claude CLI detection ──────────────────────────────────────────────────────

function detectClaudeCli() {
  try {
    const result = spawnSync("which", ["claude"], { encoding: "utf8" });
    return result.status === 0 && result.stdout.trim().length > 0;
  } catch {
    return false;
  }
}

// ── Mode A fallback ──────────────────────────────────────────────────────────

function modAFallback(substance, family, briefPath) {
  console.log("");
  console.log(">>> DISPATCH NEEDED (claude CLI not found — Mode A fallback)");
  console.log(`>>> Brief written to: ${briefPath}`);
  console.log(`>>> Claude, please read the brief above and produce:`);
  console.log(`>>>   sc/synths/${substance.toLowerCase()}/${family}.scd`);
  console.log(`>>>   sc/synths/${substance.toLowerCase()}/${family}.yaml`);
  console.log(`>>> Then re-run: npm run sound-lab -- --validate ${substance}/${family}`);
  console.log("");
}

// ── Agent response parser ─────────────────────────────────────────────────────

function parseAgentResponse(responseText) {
  // Extract first ```scd ... ``` block
  const scdMatch = responseText.match(/```scd\s*\n([\s\S]+?)```/);
  // Extract first ```yaml ... ``` block
  const yamlMatch = responseText.match(/```yaml\s*\n([\s\S]+?)```/);

  if (!scdMatch) return { ok: false, reason: "no ```scd block found in agent response" };
  if (!yamlMatch) return { ok: false, reason: "no ```yaml block found in agent response" };

  return {
    ok: true,
    scd:  scdMatch[1].trim(),
    yaml: yamlMatch[1].trim(),
  };
}

// ── Agent dispatch (Mode B: claude --print) ───────────────────────────────────

function dispatchAgent(brief) {
  console.log("[agent] dispatching claude --print...");
  const result = spawnSync(
    "claude",
    ["--print", "--model", "claude-sonnet-4-5"],
    {
      input:    brief,
      encoding: "utf8",
      timeout:  120_000,  // 2 min timeout for LLM response
    }
  );

  if (result.status !== 0) {
    const err = (result.stderr || "").trim() || (result.error && result.error.message) || "unknown error";
    return { ok: false, reason: `claude CLI exited ${result.status}: ${err}` };
  }

  const parsed = parseAgentResponse(result.stdout || "");
  if (!parsed.ok) return parsed;

  return { ok: true, scd: parsed.scd, yaml: parsed.yaml };
}

// ── Single synth generation ───────────────────────────────────────────────────

async function runSingle(substance, family, force) {
  const subLower  = substance.toLowerCase();
  const scdPath   = resolve(SYNTHS_DIR, subLower, `${family}.scd`);
  const yamlPath  = resolve(SYNTHS_DIR, subLower, `${family}.yaml`);
  const synthName = `${subLower}_${family}`;

  // Guard: don't overwrite without --force
  if (existsSync(scdPath) && !force) {
    console.error(`[skip] ${substance}/${family} already exists. Use --force to re-roll.`);
    return false;
  }

  mkdirSync(resolve(SYNTHS_DIR, subLower), { recursive: true });
  mkdirSync(SCRATCH_DIR, { recursive: true });

  // Build brief
  let brief;
  try {
    brief = buildBrief(substance, family);
  } catch (e) {
    console.error(`[fail] brief construction: ${e.message}`);
    return false;
  }

  // Write brief to scratch for Mode A fallback or debugging
  const briefPath = resolve(SCRATCH_DIR, `brief-${subLower}-${family}.md`);
  writeFileSync(briefPath, brief, "utf8");

  // Mode A fallback
  if (!detectClaudeCli()) {
    modAFallback(substance, family, briefPath);
    return false;
  }

  // Retry loop (max 3 attempts)
  let attempt = 0;
  let feedbackContext = "";
  const MAX_RETRIES = 3;

  while (attempt < MAX_RETRIES) {
    attempt++;
    console.log(`[agent] attempt ${attempt}/${MAX_RETRIES} for ${substance}/${family}`);

    const fullBrief = feedbackContext
      ? brief + `\n\n---\nPREVIOUS ATTEMPT FAILED:\n${feedbackContext}\nPlease fix the issue and try again.\n`
      : brief;

    const agentResult = dispatchAgent(fullBrief);
    if (!agentResult.ok) {
      console.error(`[agent] dispatch failed: ${agentResult.reason}`);
      feedbackContext = agentResult.reason;
      continue;
    }

    // Write files
    writeFileSync(scdPath, agentResult.scd, "utf8");
    writeFileSync(yamlPath, agentResult.yaml, "utf8");
    console.log(`[write] ${scdPath}`);
    console.log(`[write] ${yamlPath}`);

    // Validate
    const valid = await runValidation(subLower, family);
    if (valid) {
      console.log(`[ok] ${substance}/${family} generated and validated.`);

      // Render WAV preview
      const wavOk = renderWav(subLower, family);
      if (!wavOk) {
        console.warn(`[warn] WAV render failed for ${substance}/${family} — check sclang PATH.`);
      }

      // Auto-commit
      autoCommit(substance, family, [scdPath, yamlPath]);
      return true;
    }

    // Collect failure context for next retry
    feedbackContext = `Validation failed for ${synthName}. Check: RMS must be 0.01–1.0 over 200ms, doneAction:2 required, Out.ar(0, sig ! 2) required.`;
    console.error(`[retry] validation failed — retrying (${attempt}/${MAX_RETRIES})`);
  }

  console.error(`[fail] ${substance}/${family}: validation failed after ${MAX_RETRIES} attempts. Files NOT committed.`);
  // Keep files on disk for manual inspection, but do not commit
  return false;
}
```

- [ ] **Step 2: Add `autoCommit` helper**

Add to `sound-lab-cli.js`:

```js
// ── Auto-commit ──────────────────────────────────────────────────────────────

function autoCommit(substance, family, filePaths) {
  try {
    const relPaths = filePaths.map(p => p.replace(ROOT + "/", "")).join(" ");
    execSync(`git -C "${ROOT}" add ${relPaths}`, { encoding: "utf8" });
    execSync(
      `git -C "${ROOT}" commit -m "sound-lab: ${substance}/${family} [generated+validated]"`,
      { encoding: "utf8" }
    );
    console.log(`[commit] sound-lab: ${substance}/${family}`);
  } catch (e) {
    console.warn(`[warn] auto-commit failed: ${e.message}`);
  }
}
```

- [ ] **Step 3: Verify Mode A fallback message prints correctly (when claude not on PATH)**

Temporarily rename `claude` or mock the `which claude` check to verify the Mode A message prints cleanly.

- [ ] **Step 4: Commit**

```bash
cd /Users/Edo_1/album-gen
git add sound-lab/sound-lab-cli.js
git commit -m "feat(m1c-δ): agent dispatch (Mode B claude --print) + retry loop + auto-commit"
```

---

## Task 10: Tests for CLI argument parsing and `--status` matrix

**Files:**
- Create: `/Users/Edo_1/album-gen/test/sound-lab-cli.test.js`
- Modify: `/Users/Edo_1/album-gen/test/all.js` (add import)

These tests cover only logic that does NOT require sclang or the claude CLI. Validation and generation are manual integration steps.

- [ ] **Step 1: Write `test/sound-lab-cli.test.js`**

Write `/Users/Edo_1/album-gen/test/sound-lab-cli.test.js`:

```js
// sound-lab-cli.test.js
// Tests: CLI arg parsing helpers, status matrix logic, brief template construction.
// Does NOT invoke sclang or claude CLI.

import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SYNTHS_DIR = resolve(ROOT, "sc/synths");

// ── Test 1: SUBSTANCES and FAMILIES constants ────────────────────────────────

{
  const SUBSTANCES = ["GRIT", "BRINE", "ORE", "HAZE", "JOLT", "LOAM"];
  const FAMILIES   = ["drone", "pad", "bass", "kick", "snare", "hat", "lead", "perc", "texture"];
  assert.equal(SUBSTANCES.length, 6,  "6 substances");
  assert.equal(FAMILIES.length,   9,  "9 families");
  assert.equal(SUBSTANCES.length * FAMILIES.length, 54, "6×9 = 54 total slots");
  console.log("✓ substances/families constants (6×9=54)");
}

// ── Test 2: status matrix scan ───────────────────────────────────────────────
// Create a temp substance dir with 2 synths, verify scan finds them.

{
  const tmpSubDir = resolve(SYNTHS_DIR, "_test_sub");
  mkdirSync(tmpSubDir, { recursive: true });
  writeFileSync(resolve(tmpSubDir, "bass.scd"),  "// placeholder", "utf8");
  writeFileSync(resolve(tmpSubDir, "bass.yaml"), "name: _test_sub_bass", "utf8");
  writeFileSync(resolve(tmpSubDir, "kick.scd"),  "// placeholder", "utf8");
  // kick.yaml intentionally missing → partial

  // Simulate matrix scan logic:
  const FAMILIES = ["drone", "pad", "bass", "kick", "snare", "hat", "lead", "perc", "texture"];
  const results = FAMILIES.map(fam => {
    const scd  = existsSync(resolve(tmpSubDir, `${fam}.scd`));
    const yml  = existsSync(resolve(tmpSubDir, `${fam}.yaml`));
    if (scd && yml)  return "ok";
    if (scd)         return "scd-only";
    if (yml)         return "yaml-only";
    return "missing";
  });

  assert.equal(results[2], "ok",       "bass: both files → ok");
  assert.equal(results[3], "scd-only", "kick: scd only → scd-only");
  assert.equal(results[0], "missing",  "drone: missing → missing");

  // Cleanup
  rmSync(tmpSubDir, { recursive: true, force: true });
  console.log("✓ status matrix scan logic");
}

// ── Test 3: argValue helper logic ─────────────────────────────────────────────

{
  function argValue(args, flag) {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : null;
  }

  const args = ["--substance", "HAZE", "--synth", "bass", "--force"];
  assert.equal(argValue(args, "--substance"), "HAZE",  "--substance HAZE");
  assert.equal(argValue(args, "--synth"),     "bass",  "--synth bass");
  assert.equal(argValue(args, "--validate"),  null,    "--validate absent → null");
  assert.ok(args.includes("--force"),                  "--force present");
  console.log("✓ argValue helper");
}

// ── Test 4: parseAgentResponse ────────────────────────────────────────────────

{
  function parseAgentResponse(responseText) {
    const scdMatch  = responseText.match(/```scd\s*\n([\s\S]+?)```/);
    const yamlMatch = responseText.match(/```yaml\s*\n([\s\S]+?)```/);
    if (!scdMatch)  return { ok: false, reason: "no ```scd block found" };
    if (!yamlMatch) return { ok: false, reason: "no ```yaml block found" };
    return { ok: true, scd: scdMatch[1].trim(), yaml: yamlMatch[1].trim() };
  }

  const mockResponse = `
Here is the SynthDef:

\`\`\`scd
SynthDef(\\haze_bass, { |freq=55, amp=0.4, dur=0.4|
    var sig = SinOsc.ar(freq);
    Out.ar(0, sig ! 2);
}).add;
\`\`\`

And the metadata:

\`\`\`yaml
name: haze_bass
substance: HAZE
family: bass
required: [freq, amp, dur]
\`\`\`
`;

  const parsed = parseAgentResponse(mockResponse);
  assert.ok(parsed.ok, "parse ok");
  assert.ok(parsed.scd.includes("SynthDef"), "scd block extracted");
  assert.ok(parsed.yaml.includes("name: haze_bass"), "yaml block extracted");

  const noScd = parseAgentResponse("```yaml\nname: x\n```");
  assert.equal(noScd.ok, false, "no scd → fail");
  assert.ok(noScd.reason.includes("no ```scd"), "correct error message");

  console.log("✓ parseAgentResponse");
}

// ── Test 5: YAML schema validation logic ──────────────────────────────────────

{
  const validMeta = {
    name: "haze_bass",
    substance: "HAZE",
    family: "bass",
    required: ["freq", "amp", "dur"],
    extras: { cutoff: { range: [0, 1], default: 0.6 } },
  };
  assert.ok(validMeta.name && validMeta.substance && validMeta.family && Array.isArray(validMeta.required),
    "schema: required fields present");
  assert.equal(validMeta.name, `${validMeta.substance.toLowerCase()}_${validMeta.family}`,
    "schema: name = <substance>_<family>");
  console.log("✓ YAML schema validation logic");
}

// ── Test 6: brief template has all required placeholders ──────────────────────

{
  const { readFileSync } = await import("node:fs");
  const templatePath = resolve(ROOT, "sound-lab/agent-brief-template.md");
  if (existsSync(templatePath)) {
    const template = readFileSync(templatePath, "utf8");
    const required = [
      "{{SUBSTANCE_NAME}}", "{{SUBSTANCE_POETIC}}", "{{FAMILY_NAME}}",
      "{{SYNTHDEF_NAME}}", "{{FREQ_DEFAULT}}", "{{AMP_DEFAULT}}", "{{DUR_DEFAULT}}",
      "{{EXTRA_ARGS_LIST}}", "{{CHARACTER_DESCRIPTION}}",
    ];
    for (const ph of required) {
      assert.ok(template.includes(ph), `template contains ${ph}`);
    }
    console.log("✓ agent-brief-template has all placeholders");
  } else {
    console.log("~ agent-brief-template.md not yet written (skipped)");
  }
}

console.log("\nAll sound-lab-cli tests passed.");
```

- [ ] **Step 2: Add to `test/all.js`**

Open `/Users/Edo_1/album-gen/test/all.js` and add the new test file to the import/run list (follow the existing pattern in that file).

- [ ] **Step 3: Run the test suite**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all existing tests + new `sound-lab-cli.test.js` green.

- [ ] **Step 4: Commit**

```bash
cd /Users/Edo_1/album-gen
git add test/sound-lab-cli.test.js test/all.js
git commit -m "test(m1c-δ): sound-lab CLI arg parsing + status matrix + parser (no sclang)"
```

---

## Task 11: Batch generation (`--substance HAZE`)

**Files:**
- Modify: `/Users/Edo_1/album-gen/sound-lab/sound-lab-cli.js`

Replace the `runBatch` stub with a loop over all 9 families, collecting results, and merging per-family `modulation_rules` from each `.yaml` into a single `sc/modulation-rules/<substance>.yaml` at the end.

- [ ] **Step 1: Replace `runBatch` stub**

Replace:
```js
async function runBatch(substance) {
  // Implemented in Task 12
  console.error("[sound-lab] runBatch: not yet implemented");
}
```

With:
```js
// ── Batch generation ──────────────────────────────────────────────────────────

async function runBatch(substance) {
  console.log(`[batch] ${substance}: generating ${FAMILIES.length} synths...`);
  const results = {};
  const allModRules = {};  // merged modulation rules across families

  for (const family of FAMILIES) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`[batch] ${substance}/${family}`);

    const success = await runSingle(substance, family, opts.force);
    results[family] = success ? "ok" : "fail";

    // Collect modulation_rules from the per-family yaml if generated
    if (success) {
      const yamlPath = resolve(SYNTHS_DIR, substance.toLowerCase(), `${family}.yaml`);
      try {
        const meta = yaml.load(readFileSync(yamlPath, "utf8"));
        if (meta.modulation_rules && typeof meta.modulation_rules === "object") {
          allModRules[family] = meta.modulation_rules;
        }
      } catch { /* skip */ }
    }
  }

  // ── Merge into sc/modulation-rules/<substance>.yaml ──────────────────────

  if (Object.keys(allModRules).length > 0) {
    const modRulesPath = resolve(MODULATION_DIR, `${substance.toLowerCase()}.yaml`);
    const modRulesContent = yaml.dump({
      substance,
      families: allModRules,
      continuous: inferContinuous(allModRules),
    });
    writeFileSync(modRulesPath, modRulesContent, "utf8");
    console.log(`\n[mod-rules] written: ${modRulesPath}`);
    autoCommit(substance, "modulation-rules", [modRulesPath]);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────

  const ok   = Object.entries(results).filter(([, v]) => v === "ok").map(([k]) => k);
  const fail = Object.entries(results).filter(([, v]) => v === "fail").map(([k]) => k);

  console.log(`\n${"═".repeat(60)}`);
  console.log(`[batch summary] ${substance}`);
  console.log(`  OK   (${ok.length}): ${ok.join(", ") || "(none)"}`);
  console.log(`  FAIL (${fail.length}): ${fail.join(", ") || "(none)"}`);
  if (fail.length > 0) {
    console.log(`  → Re-run failed families with: npm run sound-lab -- --substance ${substance} --synth <family> --force`);
  }
  console.log(`${"═".repeat(60)}\n`);
}

// Infer which params should be continuous (those with lfo or density sources)
function inferContinuous(allModRules) {
  const cont = {};
  for (const [family, rules] of Object.entries(allModRules)) {
    const contParams = Object.entries(rules)
      .filter(([, rule]) => rule.source && (rule.source.startsWith("lfo") || rule.source.startsWith("density")))
      .map(([param]) => param);
    if (contParams.length > 0) cont[family] = contParams;
  }
  return cont;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/Edo_1/album-gen
git add sound-lab/sound-lab-cli.js
git commit -m "feat(m1c-δ): runBatch + modulation rules merge into haze.yaml"
```

---

## Task 12: Verify HAZE `substance-presets.yaml` entry

**Files:**
- Read-only check: `/Users/Edo_1/album-gen/src/mapping/substance-presets.yaml`

M1c-α set this up. Confirm the HAZE entry is present and correct before running Task 14.

- [ ] **Step 1: Check HAZE entry in substance-presets.yaml**

Read `/Users/Edo_1/album-gen/src/mapping/substance-presets.yaml` and confirm:

```yaml
HAZE:
  poetic: "foschia, velature, spazio"
  register:
    bass:   [24, 48]
    chords: [55, 75]
    melody: [60, 84]
    lead:   [72, 96]
    arp:    [60, 84]
  palette_intensity: ambient
  synth_dir: sc/synths/haze/
  modulation_rules: sc/modulation-rules/haze.yaml
```

If any field is missing or incorrect, fix it now. This is the source of truth that `buildBrief` reads.

- [ ] **Step 2: No commit needed unless file was corrected**

If correction needed:
```bash
cd /Users/Edo_1/album-gen
git add src/mapping/substance-presets.yaml
git commit -m "fix(m1c-δ): HAZE entry in substance-presets.yaml"
```

---

## Task 13: Hot-reload OSC handler in `album-engine.scd`

**Files:**
- Modify: `/Users/Edo_1/album-gen/sc/album-engine.scd`

Add the `/sound-lab/reload <path>` OSC handler. When the CLI commits a new synth, it can optionally send this message to a running `album-engine.scd` so changes are heard live without restarting sclang.

The CLI will emit this after a successful commit if the `--hot-reload` flag is passed (or automatically if a running server is detected). This task adds only the server-side handler; CLI integration is a one-liner added to `autoCommit`.

- [ ] **Step 1: Add `/sound-lab/reload` handler to `album-engine.scd`**

Open `/Users/Edo_1/album-gen/sc/album-engine.scd` and add before the final `"[album-engine] OSC handlers registered — ready.".postln;` line:

```supercollider
    // /sound-lab/reload <path>  — hot-reload a SynthDef file during live session
    OSCdef(\soundLabReload, { |msg|
        var path = msg[1].asString;
        if (File.exists(path)) {
            path.load;
            s.sync;
            ("[sound-lab] reloaded: " ++ path).postln;
            browserAddr.sendMsg("/log", "sound-lab reload: " ++ path);
        } {
            ("[sound-lab] reload failed: file not found: " ++ path).postln;
        };
    }, "/sound-lab/reload");
```

- [ ] **Step 2: Add hot-reload emit to `autoCommit` in `sound-lab-cli.js`**

In the `autoCommit` function, after the git commit, add:

```js
  // Optional: emit hot-reload OSC if album-engine is running
  try {
    // Use osc.js or a simple UDP send to localhost:57120
    // For simplicity, use a shell-out to sclang -e
    const scdExpr = `NetAddr("127.0.0.1", 57120).sendMsg("/sound-lab/reload", "${scdPath}")`;
    spawnSync("sclang", ["-e", scdExpr], { timeout: 5000 });
    console.log(`[hot-reload] sent /sound-lab/reload for ${scdPath}`);
  } catch {
    // Non-fatal: album-engine may not be running
  }
```

Note: the hot-reload emit is best-effort (album-engine may not be running). The `try/catch` ensures failures are silent.

- [ ] **Step 3: Smoke-test album-engine.scd still boots**

If sclang is available:
```bash
# Start album-engine in sclang, check for OSC handler registration:
# "sound-lab reload" handler should appear in post window.
sclang /Users/Edo_1/album-gen/sc/album-engine.scd
# Ctrl-C after confirming "[album-engine] OSC handlers registered"
```

- [ ] **Step 4: Commit**

```bash
cd /Users/Edo_1/album-gen
git add sc/album-engine.scd sound-lab/sound-lab-cli.js
git commit -m "feat(m1c-δ): /sound-lab/reload OSC handler + CLI hot-reload emit"
```

---

## Task 14: Generate HAZE pilot substance (integration run)

This is an integration step — runs the CLI to actually generate the 9 HAZE synths. Not a mechanical code change; it's an execution and curation pass.

**Estimated time:** 30–60 minutes (including WAV listening and manual re-rolls).

**Prerequisites:**
- `sclang` on PATH (`which sclang` returns something, or `export PATH="/Applications/SuperCollider.app/Contents/MacOS:$PATH"`)
- `claude` CLI on PATH (`which claude`)
- All previous tasks committed (Tasks 1–13 merged)

- [ ] **Step 1: Pre-flight checks**

```bash
which sclang && echo "sclang ok" || echo "sclang NOT on PATH — add it"
which claude && echo "claude ok" || echo "claude NOT on PATH — Mode A fallback will be used"
npm run sound-lab -- --status    # all cells should be [ ] for HAZE
```

- [ ] **Step 2: Run batch generation for HAZE**

```bash
cd /Users/Edo_1/album-gen
npm run sound-lab -- --substance HAZE
```

This triggers 9 sequential calls to `claude --print`, each writing `sc/synths/haze/<family>.scd` + `sc/synths/haze/<family>.yaml`, validating, rendering a WAV preview, and committing if valid. The batch summary at the end shows which families passed and which failed.

Expected duration: 5–15 minutes (9 × LLM call + sclang validation).

- [ ] **Step 3: Review summary and re-roll failures**

After the batch completes, check the summary. For any `FAIL` families:

```bash
# Re-roll a single failed family (max 3 attempts internally, this forces a fresh start):
npm run sound-lab -- --substance HAZE --synth <family> --force
```

If validation keeps failing for a specific family (e.g. `texture`), inspect the generated `.scd` manually and the `sound-lab/.scratch/brief-haze-<family>.md` brief for clues.

- [ ] **Step 4: Listen to WAV previews**

```bash
ls sound-lab/.previews/
# Open each WAV in QuickTime / afplay:
for f in sound-lab/.previews/haze_*.wav; do afplay "$f" -t 5 & done
```

For any synth that sounds wrong for HAZE (too harsh, too bright, etc.):
```bash
npm run sound-lab -- --substance HAZE --synth <family> --force
```

Manual curation is expected here — the first batch is a starting point, not a final product.

- [ ] **Step 5: Verify `--status` shows HAZE fully populated**

```bash
npm run sound-lab -- --status
```

Expected: HAZE row shows 9× `[ok]`. Other rows show `[ ]`.

- [ ] **Step 6: Verify `sc/modulation-rules/haze.yaml` exists**

```bash
cat sc/modulation-rules/haze.yaml
```

Should contain `substance: HAZE`, `families:` with entries for each synth family, and `continuous:` section.

- [ ] **Step 7: Run full test suite**

```bash
npm test
```

All tests must pass. The new HAZE synth files don't affect existing tests.

- [ ] **Step 8: Verify legacy album-001.yaml still runs**

```bash
node bin/album-gen.js albums/album-001.yaml
```

Should play with `_default` synths, no errors.

---

## Task 15: Tag + finalize

- [ ] **Step 1: Final test run**

```bash
cd /Users/Edo_1/album-gen && npm test
```

Expected: all green.

- [ ] **Step 2: `--status` full output**

```bash
npm run sound-lab -- --status
```

Expected: HAZE row full `[ok]`, others `[ ]`, modulation rules shows `haze`.

- [ ] **Step 3: Add README section for sound-lab commands**

If `/Users/Edo_1/album-gen/README.md` exists, add a `## Sound Lab` section:

```markdown
## Sound Lab

```bash
npm run sound-lab -- --status                        # 6×9 coverage matrix
npm run sound-lab -- --substance HAZE                # generate all 9 HAZE synths
npm run sound-lab -- --substance HAZE --synth bass   # single family
npm run sound-lab -- --substance HAZE --synth bass --force  # re-roll existing
npm run sound-lab -- --validate HAZE/bass            # validate only (no generation)
```

Generated WAV previews land in `sound-lab/.previews/` (gitignored). Listen with:
```bash
afplay sound-lab/.previews/haze_bass.wav
```

Requires: `sclang` on PATH, `claude` CLI on PATH.
```

- [ ] **Step 4: Commit README**

```bash
cd /Users/Edo_1/album-gen
git add README.md
git commit -m "docs(m1c-δ): sound-lab README section"
```

- [ ] **Step 5: Tag**

```bash
cd /Users/Edo_1/album-gen
git tag v0.6.0-M1c-delta -m "M1c-δ: Sound Lab CLI + HAZE pilot substance"
```

---

## Appendix A: Complete file manifest

| File | Status | Task |
|---|---|---|
| `package.json` | modified | 1 |
| `sound-lab/sound-lab-cli.js` | created | 2, 4, 6, 8, 9, 11 |
| `sound-lab/agent-brief-template.md` | created | 7 |
| `sound-lab/validate-synthdef.scd` | created | 3 |
| `sound-lab/wav-render.scd` | created | 5 |
| `sound-lab/.gitignore` | created | 1 |
| `docs/sound-substances/HAZE.md` | created | 7 |
| `sc/synths/haze/*.scd` (×9) | generated | 14 |
| `sc/synths/haze/*.yaml` (×9) | generated | 14 |
| `sc/modulation-rules/haze.yaml` | generated | 11+14 |
| `sc/album-engine.scd` | modified | 13 |
| `src/mapping/substance-presets.yaml` | verified/patched | 12 |
| `test/sound-lab-cli.test.js` | created | 10 |
| `test/all.js` | modified | 10 |
| `README.md` | modified | 15 |

---

## Appendix B: Agent brief example (HAZE/bass, filled)

Shown here for reference — actual content generated by `buildBrief("HAZE", "bass")`.

```
ROLE: You are a SuperCollider sound designer creating a SynthDef for the album-gen project.
Your output will be validated automatically: sclang must load it without errors,
Synth instantiation must produce RMS > 0.01 and < 1.0 over 200ms, and all nodes
must self-free (doneAction: 2 in the primary envelope).

---

SUBSTANCE: HAZE — foschia, velature, spazio
Sonic qualities: ambient, foschia, velature, spazio
Register bias: bass [24,48], lead [72,96]

FAMILY: bass — sub-bass (24-50 Hz), harmonic ground
Register range: 24–48

---

CONTRACT (MUST comply exactly):
- SynthDef name: \haze_bass
- Required args: freq=55, amp=0.4, dur=0.4
- Allowed extra args: cutoff=0.6, drive=0, noise=0, pan=0
- Use `Out.ar(0, sig ! 2)` for stereo output
- doneAction: 2 in the primary EnvGen (self-frees when envelope ends)
- NO Buffers, NO SoundIn, NO SystemClock, NO blocking calls
- Pure synthesis only

CHARACTER:
Sub sine + slightly detuned octave, soft attack, long sustain.
Like a fog horn heard from distance. Minimal high content.

MODULATION RULES: ...
```

---

## Appendix C: Mode A vs Mode B — decision summary

| | Mode B (`claude --print`) | Mode A (orchestrator) |
|---|---|---|
| **Primary?** | Yes | Fallback |
| **Self-contained?** | Yes — runs from any terminal | No — requires Claude Code chat |
| **Prerequisite** | `claude` CLI on PATH | Human + Claude Code session |
| **Trigger** | `spawnSync("claude", [...])` | CLI prints message + exits 2 |
| **Response format** | Parse stdout for fenced blocks | Subagent writes files directly |
| **Retry loop** | Automatic (max 3) | Manual re-run |
| **Recommended for** | Batch generation, automation | Debugging, manual iteration |

Detection in CLI: `which claude` → if found: Mode B; if not: Mode A.

---

## Appendix D: Validation thresholds — rationale

| Check | Threshold | Rationale |
|---|---|---|
| RMS lower bound | 0.01 | Below this = effectively silent; likely envelope or Out.ar bug |
| RMS upper bound | 1.0 | At or above = clipping; likely missing amplitude scaling |
| Active nodes after 500ms | 0 | `doneAction: 2` required; positive count = resource leak |
| YAML `name` field | must equal `<sub>_<fam>` | Enforces naming convention; prevents routing errors at runtime |
| YAML `required` | must contain `[freq, amp, dur]` | Minimum contract for OSC dispatcher |

The 500ms grace period (after the 200ms recording) is generous: it allows synths with `dur=0.4` to fully complete their envelope and free themselves. Synths with longer `dur` (drone: 60s) will still have active nodes at 500ms — **exception**: for `drone` family, the validation script should use a short test `dur` override (`Synth(synthName, [\dur, 0.3])`). This is handled in `validate-synthdef.scd` by detecting the family suffix `_drone` and overriding `dur`:

```supercollider
// In validate-synthdef.scd, after loading the file:
var isDrone = synthName.asString.endsWith("_drone");
var testDur  = isDrone.if(0.25, nil);  // short dur for drone validation
var synthArgs = testDur.notNil.if([\dur, testDur], []);
Synth(synthName, synthArgs);
```

Add this to `validate-synthdef.scd` in Task 3 (or as an addendum commit in Task 3's final step).
