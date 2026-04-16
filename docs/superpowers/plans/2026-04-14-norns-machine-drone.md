# machine-drone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Monome Norns script that synthesizes the MACH:INE III drone — 7 biomes, morphing transitions, dual SLAVE/AUTO mode.

**Architecture:** Single parametric SuperCollider SynthDef with 4 oscillator types in parallel (tri/saw/pulse/sin), RLPF, tanh saturation, FreeVerb. Lua script handles MIDI, UI, phase evolution. Biome config in separate Lua table.

**Tech Stack:** SuperCollider (CroneEngine), Lua (Norns API), MIDI

**Spec:** `docs/superpowers/specs/2026-04-14-norns-machine-drone-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `machine-drone/lib/Engine_MachineDrone.sc` | CroneEngine: SynthDef, Synth lifecycle, command registration |
| `machine-drone/lib/biomes.lua` | 7 biome parameter tables (root, mix, cutoff, drift, phases, etc.) |
| `machine-drone/machine-drone.lua` | Entry point: init, enc, key, redraw, MIDI handler, phase clock |

All paths relative to project root. The `machine-drone/` folder will live at `/Users/Edo_1/MACH-INE II/machine-drone/`.

---

### Task 1: Create project structure and biomes.lua

**Files:**
- Create: `machine-drone/lib/biomes.lua`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p "/Users/Edo_1/MACH-INE II/machine-drone/lib"
```

- [ ] **Step 2: Write biomes.lua**

```lua
-- machine-drone/lib/biomes.lua
-- 7 biome parameter tables for MACH:INE III drone
-- Each biome defines oscillator mix, filter, reverb, drift, and phase durations

local biomes = {
  {
    name = "NEBBIA",
    root = 48,          -- C3
    scale = "C lyd",
    mixTri = 1.0, mixSaw = 0, mixPul = 0, mixSin = 0,
    detune = 0,         -- cents (or Hz for RESPIRO)
    detune2 = 0,        -- second detune offset (TEMPESTA only)
    cutoff = 250,       -- Hz
    q = 0,
    drive = 0,
    revMix = 0.3,
    revRoom = 0.7,
    noiseAmp = 0,
    breathAmp = 0,
    driftAmp = 15,      -- cents
    driftPeriod = 24,   -- bars
    bpm = 60,
    -- phase durations in seconds
    phases = {
      germoglio = 128,
      pulsazione = 96,
      densita = 0,      -- skipped
      dissoluzione = 64,
    },
  },
  {
    name = "TESSUTO",
    root = 50,          -- D3
    scale = "D aeo",
    mixTri = 0, mixSaw = 1.0, mixPul = 0, mixSin = 0,
    detune = 3,
    detune2 = 0,
    cutoff = 400,
    q = 0.1,
    drive = 0.2,
    revMix = 0.4,
    revRoom = 0.6,
    noiseAmp = 0,
    breathAmp = 0,
    driftAmp = 17.5,
    driftPeriod = 32,
    bpm = 86,
    phases = {
      germoglio = 67,
      pulsazione = 89,
      densita = 89,
      dissoluzione = 67,
    },
  },
  {
    name = "SOLCO",
    root = 55,          -- G3
    scale = "G dor",
    mixTri = 1.0, mixSaw = 0, mixPul = 0, mixSin = 0,
    detune = 4,
    detune2 = 0,
    cutoff = 600,
    q = 0.1,
    drive = 0.4,
    revMix = 0.5,
    revRoom = 0.7,
    noiseAmp = 0,
    breathAmp = 0,
    driftAmp = 17.5,
    driftPeriod = 32,
    bpm = 129,
    phases = {
      germoglio = 60,
      pulsazione = 89,
      densita = 119,
      dissoluzione = 60,
    },
  },
  {
    name = "RESPIRO",
    root = 60,          -- C4 (one octave higher)
    scale = "C ion",
    mixTri = 0, mixSaw = 0, mixPul = 0, mixSin = 1.0,
    detune = 0.3,       -- Hz (sub-Hz beating), NOT cents
    detune2 = 0,
    cutoff = 8000,      -- effectively bypass
    q = 0,
    drive = 0,
    revMix = 0.2,
    revRoom = 0.5,
    noiseAmp = 0,
    breathAmp = 0.05,   -- breath noise BP ~2kHz
    driftAmp = 22.5,
    driftPeriod = 40,
    bpm = 60,
    phases = {
      germoglio = 48,
      pulsazione = 64,
      densita = 0,      -- skipped
      dissoluzione = 48,
    },
  },
  {
    name = "MACCHINA",
    root = 50,          -- D3
    scale = "D dor",
    mixTri = 0, mixSaw = 0, mixPul = 1.0, mixSin = 0,
    detune = 0,
    detune2 = 0,
    cutoff = 800,
    q = 0.8,
    drive = 0,
    revMix = 0,
    revRoom = 0,
    noiseAmp = 0.3,     -- BPF noise on fundamental
    breathAmp = 0,
    driftAmp = 7.5,
    driftPeriod = 8,
    bpm = 129,
    phases = {
      germoglio = 60,
      pulsazione = 89,
      densita = 119,
      dissoluzione = 60,
    },
  },
  {
    name = "TEMPESTA",
    root = 52,          -- E3
    scale = "E phr",
    mixTri = 0, mixSaw = 1.0, mixPul = 0, mixSin = 0,
    detune = 5,         -- cents: first pair ±5
    detune2 = 12,       -- cents: second pair ±12 (third saw voice)
    cutoff = 1200,
    q = 0.4,
    drive = 0.6,
    revMix = 0.3,
    revRoom = 0.5,
    noiseAmp = 0,
    breathAmp = 0,
    driftAmp = 20.5,
    driftPeriod = 12,
    bpm = 129,
    phases = {
      germoglio = 45,
      pulsazione = 60,
      densita = 179,
      dissoluzione = 60,
    },
  },
  {
    name = "RITORNO",
    root = 57,          -- A3
    scale = "A aeo",
    mixTri = 0, mixSaw = 1.0, mixPul = 0, mixSin = 0,
    detune = 3,
    detune2 = 0,
    cutoff = 400,
    q = 0.1,
    drive = 0.2,
    revMix = 0.5,
    revRoom = 0.8,
    noiseAmp = 0,
    breathAmp = 0,
    driftAmp = 15,
    driftPeriod = 36,
    bpm = 86,
    phases = {
      germoglio = 67,
      pulsazione = 67,
      densita = 89,
      dissoluzione = 134,
    },
  },
}

-- phase evolution multipliers per phase
-- each phase modulates: amp, cutoff_scale, drift_scale, reverb_add
biomes.phase_curves = {
  germoglio    = { amp = 0.3,  cutoff_scale = 0.5,  drift_scale = 0.3, reverb_add = 0    },
  pulsazione   = { amp = 0.6,  cutoff_scale = 0.75, drift_scale = 0.7, reverb_add = 0    },
  densita      = { amp = 1.0,  cutoff_scale = 1.0,  drift_scale = 1.0, reverb_add = 0    },
  dissoluzione = { amp = 0.15, cutoff_scale = 0.3,  drift_scale = 0.4, reverb_add = 0.25 },
}

-- phase order for iteration
biomes.phase_order = { "germoglio", "pulsazione", "densita", "dissoluzione" }

-- MIDI note to biome index mapping (for SLAVE mode fallback)
biomes.note_to_biome = {
  [48] = 1,  -- C3  -> NEBBIA
  [55] = 3,  -- G3  -> SOLCO
  [60] = 4,  -- C4  -> RESPIRO
  [52] = 6,  -- E3  -> TEMPESTA
  [57] = 7,  -- A3  -> RITORNO
  -- D3 (50) ambiguous: TESSUTO or MACCHINA, handled by sequence logic
}

return biomes
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/Edo_1/MACH-INE II"
git add machine-drone/lib/biomes.lua
git commit -m "machine-drone: add biomes.lua with 7 biome parameter tables"
```

---

### Task 2: Write the SuperCollider engine

**Files:**
- Create: `machine-drone/lib/Engine_MachineDrone.sc`

- [ ] **Step 1: Write Engine_MachineDrone.sc**

```supercollider
// Engine_MachineDrone.sc
// CroneEngine for MACH:INE III drone synthesizer
// Single parametric SynthDef with morphing between 7 biomes

Engine_MachineDrone : CroneEngine {
    var synth;

    alloc {
        SynthDef("MachineDrone", {
            arg out = 0,
                hz = 130.81,    // C3
                amp = 0.5,
                // oscillator mix (0-1 each)
                mixTri = 1, mixSaw = 0, mixPul = 0, mixSin = 0,
                // detuning
                detune = 0,     // cents for tri/saw/pul, Hz for sin
                detune2 = 0,    // second detune (TEMPESTA third saw)
                // filter
                cutoff = 400,
                q = 0.1,
                // saturation
                drive = 0,
                // reverb
                reverbMix = 0.3,
                reverbRoom = 0.7,
                // noise sources
                noiseAmp = 0,       // BPF noise (MACCHINA)
                noiseBPFreq = 130,  // BP center freq for noise
                breathAmp = 0,      // breath noise (RESPIRO)
                // drift LFO
                driftAmp = 15,      // cents
                driftRate = 0.01,   // Hz (1/period in seconds)
                // lag times
                morphLag = 18,      // seconds — biome morph
                controlLag = 0.1;   // seconds — encoder response

            // --- lagged controls ---
            var lHz       = Lag3.kr(hz, morphLag);
            var lAmp      = Lag3.kr(amp, morphLag);
            var lMixTri   = Lag3.kr(mixTri, morphLag);
            var lMixSaw   = Lag3.kr(mixSaw, morphLag);
            var lMixPul   = Lag3.kr(mixPul, morphLag);
            var lMixSin   = Lag3.kr(mixSin, morphLag);
            var lDetune   = Lag3.kr(detune, morphLag);
            var lDetune2  = Lag3.kr(detune2, morphLag);
            var lCutoff   = Lag3.kr(cutoff, controlLag);
            var lQ        = Lag3.kr(q, morphLag);
            var lDrive    = Lag3.kr(drive, morphLag);
            var lRevMix   = Lag3.kr(reverbMix, morphLag);
            var lRevRoom  = Lag3.kr(reverbRoom, morphLag);
            var lNoiseAmp = Lag3.kr(noiseAmp, morphLag);
            var lNoiseBPF = Lag3.kr(noiseBPFreq, morphLag);
            var lBreathAmp= Lag3.kr(breathAmp, morphLag);
            var lDriftAmp = Lag3.kr(driftAmp, controlLag);
            var lDriftRate = Lag3.kr(driftRate, morphLag);

            // --- drift LFO ---
            // converts cents to ratio: 2^(cents/1200)
            var driftLFO = SinOsc.kr(lDriftRate);
            var driftRatio = 2.pow(driftLFO * lDriftAmp / 1200);
            var driftedHz = lHz * driftRatio;

            // --- detune ratios ---
            // for tri/saw/pul: detune in cents
            var detuneRatio  = 2.pow(lDetune / 1200);
            var detuneRatio2 = 2.pow(lDetune2 / 1200);
            // for sin (RESPIRO): detune in Hz directly
            var sinDetuneHz = lDetune; // reused — in RESPIRO detune=0.3 means ±0.3Hz

            // --- oscillators (A = +detune, B = -detune) ---
            // Triangle pair
            var triA = LFTri.ar(driftedHz * detuneRatio);
            var triB = LFTri.ar(driftedHz / detuneRatio);
            var tri = (triA + triB) * 0.5 * lMixTri;

            // Saw pair + optional third (TEMPESTA)
            var sawA = Saw.ar(driftedHz * detuneRatio);
            var sawB = Saw.ar(driftedHz / detuneRatio);
            var sawC = Saw.ar(driftedHz * detuneRatio2); // third voice
            var sawCamp = Select.kr((lDetune2 > 0).asInteger, [0, 0.5]);
            var saw = ((sawA + sawB) * 0.5 + (sawC * sawCamp)) * lMixSaw;

            // Pulse pair (50% duty)
            var pulA = Pulse.ar(driftedHz * detuneRatio, 0.5);
            var pulB = Pulse.ar(driftedHz / detuneRatio, 0.5);
            var pul = (pulA + pulB) * 0.5 * lMixPul;

            // Sine pair (detune in Hz for sub-Hz beating)
            var sinA = SinOsc.ar(driftedHz + sinDetuneHz);
            var sinB = SinOsc.ar(driftedHz - sinDetuneHz);
            var sin = (sinA + sinB) * 0.5 * lMixSin;

            // --- noise sources ---
            // BPF noise (MACCHINA: circuit hum)
            var bpNoise = BPF.ar(WhiteNoise.ar, lNoiseBPF, 0.08) * lNoiseAmp * 4;

            // Breath noise (RESPIRO: filtered BP at ~2kHz)
            var breath = BPF.ar(PinkNoise.ar, 2000, 0.3) * lBreathAmp;

            // --- mix ---
            var sig = tri + saw + pul + sin + bpNoise + breath;

            // --- filter ---
            sig = RLPF.ar(sig, lCutoff.clip(20, 18000), (1 - lQ).clip(0.05, 1));

            // --- saturation (tanh soft clip) ---
            sig = Select.ar((lDrive > 0.001).asInteger, [
                sig,
                (sig * (1 + (lDrive * 4))).tanh * (1 / (1 + (lDrive * 2)))
            ]);

            // --- reverb ---
            var dry = sig;
            var wet = FreeVerb.ar(sig, 1, lRevRoom.clip(0, 1), 0.5);
            sig = (dry * (1 - lRevMix)) + (wet * lRevMix);

            // --- output ---
            sig = sig * lAmp;
            Out.ar(out, sig.dup);
        }).add;

        // wait for SynthDef to be ready
        context.server.sync;

        // create persistent synth
        synth = Synth.new("MachineDrone", [
            \out, context.out_b.index,
            \hz, 130.81,
            \amp, 0
        ], target: context.xg);

        // --- register commands ---
        // audio params
        this.addCommand("hz", "f", { |msg| synth.set(\hz, msg[1]) });
        this.addCommand("amp", "f", { |msg| synth.set(\amp, msg[1]) });

        // oscillator mix
        this.addCommand("mixTri", "f", { |msg| synth.set(\mixTri, msg[1]) });
        this.addCommand("mixSaw", "f", { |msg| synth.set(\mixSaw, msg[1]) });
        this.addCommand("mixPul", "f", { |msg| synth.set(\mixPul, msg[1]) });
        this.addCommand("mixSin", "f", { |msg| synth.set(\mixSin, msg[1]) });

        // detune
        this.addCommand("detune", "f", { |msg| synth.set(\detune, msg[1]) });
        this.addCommand("detune2", "f", { |msg| synth.set(\detune2, msg[1]) });

        // filter
        this.addCommand("cutoff", "f", { |msg| synth.set(\cutoff, msg[1]) });
        this.addCommand("q", "f", { |msg| synth.set(\q, msg[1]) });

        // saturation
        this.addCommand("drive", "f", { |msg| synth.set(\drive, msg[1]) });

        // reverb
        this.addCommand("reverbMix", "f", { |msg| synth.set(\reverbMix, msg[1]) });
        this.addCommand("reverbRoom", "f", { |msg| synth.set(\reverbRoom, msg[1]) });

        // noise
        this.addCommand("noiseAmp", "f", { |msg| synth.set(\noiseAmp, msg[1]) });
        this.addCommand("noiseBPFreq", "f", { |msg| synth.set(\noiseBPFreq, msg[1]) });
        this.addCommand("breathAmp", "f", { |msg| synth.set(\breathAmp, msg[1]) });

        // drift
        this.addCommand("driftAmp", "f", { |msg| synth.set(\driftAmp, msg[1]) });
        this.addCommand("driftRate", "f", { |msg| synth.set(\driftRate, msg[1]) });

        // lag times
        this.addCommand("morphLag", "f", { |msg| synth.set(\morphLag, msg[1]) });
        this.addCommand("controlLag", "f", { |msg| synth.set(\controlLag, msg[1]) });
    }

    free {
        synth.free;
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/Edo_1/MACH-INE II"
git add machine-drone/lib/Engine_MachineDrone.sc
git commit -m "machine-drone: add SuperCollider engine with parametric SynthDef"
```

---

### Task 3: Write machine-drone.lua — init, params, engine wiring

**Files:**
- Create: `machine-drone/machine-drone.lua`

This task creates the script with init, params, and engine-biome wiring. MIDI, keys, encoders, screen, and phase clock are added in subsequent tasks.

- [ ] **Step 1: Write machine-drone.lua skeleton with init and params**

```lua
-- machine-drone
-- MACH:INE III drone synth
-- 7 biomes, morphing transitions
-- SLAVE (MIDI) / AUTO modes
--
-- E1: biome (AUTO) / volume (SLAVE)
-- E2: pitch offset
-- E3: cutoff offset
-- K1: hold for alt encoders
-- K2+K3: toggle SLAVE/AUTO

engine.name = "MachineDrone"

local biomes = include("machine-drone/lib/biomes")

-- state
local mode = "SLAVE"          -- "SLAVE" or "AUTO"
local current_biome = 1       -- index 1-7
local current_phase = 1       -- index into phase_order
local phase_clock_id = nil    -- clock coroutine id

local k1_held = false
local k2_held = false
local k3_held = false

-- encoder offsets (SLAVE: additive, AUTO: direct)
local pitch_offset = 0        -- semitones
local cutoff_offset = 0       -- Hz
local drift_scale = 1.0       -- multiplier
local reverb_offset = 0       -- additive

-- current effective values (for display)
local display = {
  amp = 0,
  cutoff = 250,
  drift = 0,
  reverb = 0.3,
  volume = 0.5,
}

-- MIDI state
local midi_device = nil
local last_midi_note = -1
local last_midi_biome = 1     -- for TESSUTO/MACCHINA disambiguation

-- screen refresh metro
local screen_metro = nil

----------------------------------------------------------------
-- helpers
----------------------------------------------------------------

local function midi_to_hz(note)
  return 440 * 2 ^ ((note - 69) / 12)
end

local function apply_biome(idx)
  local b = biomes[idx]
  if not b then return end
  current_biome = idx

  -- oscillator mix
  engine.mixTri(b.mixTri)
  engine.mixSaw(b.mixSaw)
  engine.mixPul(b.mixPul)
  engine.mixSin(b.mixSin)

  -- detune
  engine.detune(b.detune)
  engine.detune2(b.detune2 or 0)

  -- filter (with offset in SLAVE)
  local cut = b.cutoff + cutoff_offset
  engine.cutoff(math.max(20, math.min(18000, cut)))

  -- filter Q
  engine.q(b.q)

  -- saturation
  engine.drive(b.drive)

  -- reverb
  engine.reverbMix(math.max(0, math.min(1, b.revMix + reverb_offset)))
  engine.reverbRoom(b.revRoom)

  -- noise
  engine.noiseAmp(b.noiseAmp)
  engine.noiseBPFreq(midi_to_hz(b.root))
  engine.breathAmp(b.breathAmp or 0)

  -- drift
  local period_s = (b.driftPeriod * 4 * 60) / b.bpm  -- bars * beats/bar * s/beat
  engine.driftAmp(b.driftAmp * drift_scale)
  engine.driftRate(1 / period_s)

  -- pitch
  local hz = midi_to_hz(b.root + pitch_offset)
  engine.hz(hz)

  -- update display
  display.cutoff = cut
  display.drift = b.driftAmp * drift_scale
  display.reverb = b.revMix + reverb_offset
end

----------------------------------------------------------------
-- phase evolution (AUTO mode)
----------------------------------------------------------------

local function phase_name()
  return biomes.phase_order[current_phase] or "germoglio"
end

local function apply_phase_curve()
  local b = biomes[current_biome]
  local curve = biomes.phase_curves[phase_name()]
  if not b or not curve then return end

  local phase_amp = curve.amp * display.volume
  engine.amp(phase_amp)
  display.amp = phase_amp

  local cut = b.cutoff * curve.cutoff_scale + cutoff_offset
  engine.cutoff(math.max(20, math.min(18000, cut)))
  display.cutoff = cut

  engine.driftAmp(b.driftAmp * curve.drift_scale * drift_scale)
  display.drift = b.driftAmp * curve.drift_scale * drift_scale

  local rev = math.max(0, math.min(1, b.revMix + curve.reverb_add + reverb_offset))
  engine.reverbMix(rev)
  display.reverb = rev
end

local function run_phase_clock()
  -- cancel existing
  if phase_clock_id then clock.cancel(phase_clock_id) end

  phase_clock_id = clock.run(function()
    while true do
      local b = biomes[current_biome]
      local pname = phase_name()
      local dur = b.phases[pname] or 60

      -- skip phases with 0 duration (NEBBIA/RESPIRO skip densita)
      if dur <= 0 then
        current_phase = current_phase + 1
        if current_phase > #biomes.phase_order then
          current_phase = 1  -- cycle back to germoglio
        end
      else
        apply_phase_curve()
        clock.sleep(dur)

        current_phase = current_phase + 1
        if current_phase > #biomes.phase_order then
          current_phase = 1
        end
      end
    end
  end)
end

----------------------------------------------------------------
-- init
----------------------------------------------------------------

function init()
  -- params
  params:add_separator("header", "MACHINE DRONE")

  params:add_control("volume", "volume",
    controlspec.new(0, 1, "lin", 0, 0.5, ""))
  params:set_action("volume", function(x)
    display.volume = x
    if mode == "AUTO" then
      apply_phase_curve()
    else
      engine.amp(x)
      display.amp = x
    end
  end)

  params:add_number("biome", "biome", 1, 7, 1)
  params:set_action("biome", function(x)
    if mode == "AUTO" then
      apply_biome(x)
      current_phase = 1
      run_phase_clock()
    end
  end)

  params:add_separator("timbre_sep", "TIMBRE")

  params:add_control("cutoff_offset", "cutoff offset",
    controlspec.new(-2000, 2000, "lin", 1, 0, "Hz"))
  params:set_action("cutoff_offset", function(x)
    cutoff_offset = x
    apply_biome(current_biome)
  end)

  params:add_control("pitch_offset", "pitch offset",
    controlspec.new(-12, 12, "lin", 0.1, 0, "semi"))
  params:set_action("pitch_offset", function(x)
    pitch_offset = x
    apply_biome(current_biome)
  end)

  params:add_control("drift_amount", "drift amount",
    controlspec.new(0, 2, "lin", 0, 1, "x"))
  params:set_action("drift_amount", function(x)
    drift_scale = x
    apply_biome(current_biome)
  end)

  params:add_control("reverb_mix", "reverb mix",
    controlspec.new(0, 1, "lin", 0, 0, ""))
  params:set_action("reverb_mix", function(x)
    reverb_offset = x
    apply_biome(current_biome)
  end)

  params:add_control("drive_param", "drive",
    controlspec.new(0, 1, "lin", 0, 0, ""))
  params:set_action("drive_param", function(x)
    engine.drive(x)
  end)

  params:add_separator("morph_sep", "MORPH")

  params:add_control("morph_time", "morph time",
    controlspec.new(5, 30, "lin", 1, 18, "s"))
  params:set_action("morph_time", function(x)
    engine.morphLag(x)
  end)

  params:add_separator("midi_sep", "MIDI")

  params:add_number("midi_device", "midi device", 1, 16, 1)
  params:set_action("midi_device", function(x)
    if midi_device then midi_device.event = nil end
    midi_device = midi.connect(x)
    midi_device.event = on_midi_event
  end)

  params:add_number("midi_channel", "midi channel", 1, 16, 3)

  -- init engine
  params:bang()

  -- connect MIDI
  midi_device = midi.connect(params:get("midi_device"))
  midi_device.event = on_midi_event

  -- screen refresh at 15fps
  screen_metro = metro.init()
  screen_metro.time = 1 / 15
  screen_metro.event = function() redraw() end
  screen_metro:start()

  -- start in SLAVE with biome 1, amp from volume param
  apply_biome(1)
  engine.amp(params:get("volume"))
  display.amp = params:get("volume")
end

----------------------------------------------------------------
-- cleanup
----------------------------------------------------------------

function cleanup()
  if phase_clock_id then clock.cancel(phase_clock_id) end
  if screen_metro then screen_metro:stop() end
  engine.amp(0)
end
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/Edo_1/MACH-INE II"
git add machine-drone/machine-drone.lua
git commit -m "machine-drone: add lua script with init, params, engine wiring"
```

---

### Task 4: Add MIDI handler (SLAVE mode)

**Files:**
- Modify: `machine-drone/machine-drone.lua`

- [ ] **Step 1: Add MIDI event handler function after the cleanup function**

Add this code before the final end of the file, after the `cleanup` function:

```lua
----------------------------------------------------------------
-- MIDI (SLAVE mode)
----------------------------------------------------------------

function on_midi_event(data)
  if mode ~= "SLAVE" then return end

  local msg = midi.to_msg(data)
  local ch = params:get("midi_channel")  -- 1-indexed

  if msg.ch ~= ch then return end

  if msg.type == "note_on" and msg.vel > 0 then
    last_midi_note = msg.note
    -- infer biome from note
    local new_biome = infer_biome(msg.note)
    if new_biome ~= current_biome then
      apply_biome(new_biome)
    end
    -- apply pitch with offset
    local hz = midi_to_hz(msg.note + pitch_offset)
    engine.hz(hz)
    -- velocity -> amplitude (scaled by volume)
    local vel_amp = (msg.vel / 127) * display.volume
    engine.amp(vel_amp)
    display.amp = vel_amp

  elseif msg.type == "note_off" or (msg.type == "note_on" and msg.vel == 0) then
    -- drone: don't cut on note_off (sustained, next note overlaps)
    -- only reduce amp slightly to signal note end
    -- (drone notes overlap by design in MACH:INE III)

  elseif msg.type == "cc" then
    if msg.cc == 1 then
      -- CC1: modulate cutoff (0-127 -> biome cutoff range + offset)
      local b = biomes[current_biome]
      local cc_scaled = (msg.val / 127) * b.cutoff * 2
      local cut = cc_scaled + cutoff_offset
      engine.cutoff(math.max(20, math.min(18000, cut)))
      display.cutoff = cut

    elseif msg.cc == 16 then
      -- CC16: explicit biome index (0-6 -> 1-7)
      local new_biome = msg.val + 1
      if new_biome >= 1 and new_biome <= 7 and new_biome ~= current_biome then
        apply_biome(new_biome)
      end
    end

  elseif msg.type == "pitchbend" then
    -- pitchbend overrides internal drift LFO
    -- msg.val: 0-16383, center 8192
    local bend_semitones = ((msg.val - 8192) / 8192) * 2  -- ±2 semitones
    local hz = midi_to_hz((last_midi_note or biomes[current_biome].root) + pitch_offset + bend_semitones)
    engine.hz(hz)
  end
end

function infer_biome(note)
  -- check direct mapping first
  local mapped = biomes.note_to_biome[note]
  if mapped then return mapped end

  -- D3 (50) is ambiguous: TESSUTO or MACCHINA
  if note == 50 then
    -- sequence logic: if last biome was >= RESPIRO (4), it's MACCHINA (5)
    if last_midi_biome >= 4 then
      last_midi_biome = 5
      return 5
    else
      last_midi_biome = 2
      return 2
    end
  end

  -- unknown note: don't change biome
  return current_biome
end
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/Edo_1/MACH-INE II"
git add machine-drone/machine-drone.lua
git commit -m "machine-drone: add MIDI handler for SLAVE mode"
```

---

### Task 5: Add encoder and key handlers

**Files:**
- Modify: `machine-drone/machine-drone.lua`

- [ ] **Step 1: Add enc and key functions after the MIDI section**

```lua
----------------------------------------------------------------
-- encoders
----------------------------------------------------------------

function enc(n, d)
  if n == 1 then
    if k1_held then
      -- K1 + E1: volume
      params:delta("volume", d * 0.5)
    elseif mode == "AUTO" then
      -- E1: select biome
      local new = util.clamp(current_biome + d, 1, 7)
      if new ~= current_biome then
        params:set("biome", new)
      end
    end
    -- E1 disabled in SLAVE (biome from MIDI)

  elseif n == 2 then
    if k1_held then
      -- K1 + E2: drift amount
      params:delta("drift_amount", d * 0.02)
    else
      -- E2: pitch offset
      params:delta("pitch_offset", d * 0.1)
    end

  elseif n == 3 then
    if k1_held then
      -- K1 + E3: reverb mix
      params:delta("reverb_mix", d * 0.01)
    else
      -- E3: cutoff offset
      params:delta("cutoff_offset", d * 10)
    end
  end

  redraw()
end

----------------------------------------------------------------
-- keys
----------------------------------------------------------------

function key(n, z)
  if n == 1 then
    k1_held = z == 1

  elseif n == 2 then
    k2_held = z == 1
    -- check K2+K3 combo for mode toggle
    if z == 1 and k3_held then
      toggle_mode()
    elseif z == 1 and mode == "AUTO" then
      -- K2: previous phase
      current_phase = current_phase - 1
      if current_phase < 1 then current_phase = #biomes.phase_order end
      -- skip zero-duration phases
      local b = biomes[current_biome]
      while b.phases[phase_name()] == 0 do
        current_phase = current_phase - 1
        if current_phase < 1 then current_phase = #biomes.phase_order end
      end
      run_phase_clock()
    end

  elseif n == 3 then
    k3_held = z == 1
    -- check K2+K3 combo for mode toggle
    if z == 1 and k2_held then
      toggle_mode()
    elseif z == 1 and mode == "AUTO" then
      -- K3: next phase
      current_phase = current_phase + 1
      if current_phase > #biomes.phase_order then current_phase = 1 end
      -- skip zero-duration phases
      local b = biomes[current_biome]
      while b.phases[phase_name()] == 0 do
        current_phase = current_phase + 1
        if current_phase > #biomes.phase_order then current_phase = 1 end
      end
      run_phase_clock()
    end
  end

  redraw()
end

function toggle_mode()
  if mode == "SLAVE" then
    mode = "AUTO"
    current_phase = 1
    apply_biome(current_biome)
    run_phase_clock()
  else
    mode = "SLAVE"
    if phase_clock_id then
      clock.cancel(phase_clock_id)
      phase_clock_id = nil
    end
    -- restore volume directly
    engine.amp(display.volume)
    display.amp = display.volume
  end
end
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/Edo_1/MACH-INE II"
git add machine-drone/machine-drone.lua
git commit -m "machine-drone: add encoder and key handlers with mode toggle"
```

---

### Task 6: Add screen drawing

**Files:**
- Modify: `machine-drone/machine-drone.lua`

- [ ] **Step 1: Add redraw function and draw helpers**

```lua
----------------------------------------------------------------
-- screen
----------------------------------------------------------------

function redraw()
  screen.clear()
  screen.aa(0)

  -- row 1: biome name (left), scale (center), mode (right)
  screen.level(15)
  screen.move(2, 8)
  screen.text(biomes[current_biome].name)

  screen.level(5)
  screen.move(74, 8)
  screen.text(biomes[current_biome].scale)

  screen.level(8)
  screen.move(110, 8)
  screen.text(mode)

  -- separator line
  screen.level(2)
  screen.move(0, 12)
  screen.line(128, 12)
  screen.stroke()

  -- row 2: phase name + phase dots
  screen.level(10)
  screen.move(2, 24)
  screen.text("phase: " .. phase_name())

  -- 4 phase dots
  local dot_x = 100
  for i = 1, 4 do
    screen.level(i == current_phase and 15 or 3)
    screen.rect(dot_x + (i - 1) * 8, 19, 4, 4)
    if i == current_phase then
      screen.fill()
    else
      screen.stroke()
    end
  end

  -- row 3-4: parameter bars
  draw_bar(2,  40, "cut",  display.cutoff, 0, 4000)
  draw_bar(66, 40, "drft", display.drift, 0, 30)
  draw_bar(2,  52, "rev",  display.reverb, 0, 1)
  draw_bar(66, 52, "vol",  display.volume, 0, 1)

  -- MIDI activity indicator (SLAVE mode)
  if mode == "SLAVE" and last_midi_note > 0 then
    screen.level(3)
    screen.move(2, 62)
    screen.text("midi:" .. last_midi_note)
  end

  screen.update()
end

function draw_bar(x, y, label, value, min, max)
  local bar_w = 42
  local bar_h = 5
  local fill_w = util.clamp((value - min) / (max - min), 0, 1) * bar_w

  -- label
  screen.level(7)
  screen.move(x, y)
  screen.text(label)

  -- bar background
  local bar_x = x + 20
  screen.level(3)
  screen.rect(bar_x, y - 5, bar_w, bar_h)
  screen.fill()

  -- bar fill
  screen.level(10)
  screen.rect(bar_x, y - 5, fill_w, bar_h)
  screen.fill()
end
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/Edo_1/MACH-INE II"
git add machine-drone/machine-drone.lua
git commit -m "machine-drone: add screen UI with parameter bars"
```

---

### Task 7: Integration test on desktop (sclang check)

**Files:**
- No new files — verification only

- [ ] **Step 1: Verify SuperCollider syntax**

```bash
cd "/Users/Edo_1/MACH-INE II"
# Check SC file parses without syntax errors (requires sclang installed)
echo 'Engine_MachineDrone.class.methods.do{|m| m.name.postln}; 0.exit;' | sclang -d machine-drone/lib/ 2>&1 | head -20
```

If sclang is not installed locally, skip this step — syntax verification will happen on the Norns device.

- [ ] **Step 2: Verify Lua syntax**

```bash
luac -p "/Users/Edo_1/MACH-INE II/machine-drone/machine-drone.lua" && echo "OK" || echo "SYNTAX ERROR"
luac -p "/Users/Edo_1/MACH-INE II/machine-drone/lib/biomes.lua" && echo "OK" || echo "SYNTAX ERROR"
```

- [ ] **Step 3: Fix any syntax errors found, then commit**

```bash
cd "/Users/Edo_1/MACH-INE II"
git add machine-drone/
git commit -m "machine-drone: verify syntax, fix any issues"
```

---

### Task 8: Final assembly and documentation

**Files:**
- Modify: `machine-drone/machine-drone.lua` (add header comments)

- [ ] **Step 1: Verify the complete file order in machine-drone.lua**

The final file should have sections in this order:
1. Header comment (script name, description, controls)
2. `engine.name` declaration
3. `require`/`include` statements
4. State variables
5. Helper functions (`midi_to_hz`, `apply_biome`, `apply_phase_curve`, `run_phase_clock`)
6. `init()`
7. `cleanup()`
8. `on_midi_event()` and `infer_biome()`
9. `enc()` and `key()` and `toggle_mode()`
10. `redraw()` and `draw_bar()`

Read the file, verify all sections are present and in order. Fix any issues.

- [ ] **Step 2: Final commit**

```bash
cd "/Users/Edo_1/MACH-INE II"
git add machine-drone/
git commit -m "machine-drone v1.0: MACH:INE III drone synth for Norns"
```

---

## Summary

| Task | Description | Files | Est. |
|------|-------------|-------|------|
| 1 | Project structure + biomes.lua | biomes.lua | 3 min |
| 2 | SuperCollider engine | Engine_MachineDrone.sc | 5 min |
| 3 | Lua script: init, params, engine wiring | machine-drone.lua | 5 min |
| 4 | MIDI handler (SLAVE mode) | machine-drone.lua | 3 min |
| 5 | Encoder + key handlers | machine-drone.lua | 3 min |
| 6 | Screen UI | machine-drone.lua | 3 min |
| 7 | Syntax verification | — | 2 min |
| 8 | Final assembly check | machine-drone.lua | 2 min |
