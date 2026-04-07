# Integrations

**Analysis Date:** 2026-03-27

## External Services

**None.** MACH:INE II has zero external API calls, no cloud services, no network requests beyond serving its own files. It is a fully self-contained browser application.

- No analytics, no telemetry
- No authentication provider
- No database
- No CDN-loaded libraries
- No WebSocket connections

---

## Hardware / Protocol Integrations

### Audio Input — BlackHole Virtual Audio Driver (macOS)

- **What:** Stereo audio input routed from a DAW or live source into the browser via a virtual audio device
- **Protocol:** `getUserMedia` with `channelCount: 2`, `echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`
- **Implementation:** `MACH:INE II/src/audio.js` — `initAudio()` requests stereo stream, creates `AudioContext`, splits channels via `ChannelSplitter`, feeds two `AnalyserNode` instances (L/R)
- **Hardware dependency:** BlackHole 2ch (macOS virtual audio driver) — configured system-side, not in code. Fallback: any stereo microphone input
- **Sample rate:** 48000 Hz (read from `audioCtx.sampleRate` and written back to `CFG.sampleRate`)
- **FFT size:** 2048 (configurable in `MACH:INE II/src/config.js`)

### MIDI I/O — WebMIDI API

- **What:** Bidirectional MIDI communication with hardware instruments, DAWs (Ableton Live), and virtual MIDI ports (IAC Driver on macOS)
- **Protocol:** `navigator.requestMIDIAccess({ sysex: false })`
- **Implementation:** `MACH:INE II/src/midi.js`
- **Input:** Receives Note On/Off and CC messages from any connected MIDI device. Auto-reconnects on hot-plug via `access.onstatechange`.
- **Output:** Sends Note On/Off (with hardware-timed note-off using `midiOut.send([...], timestamp)`), All Notes Off, MIDI Start (`0xFA`), MIDI Stop (`0xFC`), MIDI Clock (`0xF8`)
- **Clock:** 24 ppqn MIDI clock output for Ableton/DAW sync. Lookahead scheduling (50ms horizon) to eliminate jitter from main thread rendering load.
- **Channel mapping (8 channels, 0-indexed):**
  - CH0 = PULSE (kick/percussion)
  - CH1 = GRAIN (rhythmic scatter)
  - CH2 = DRONE (sustained harmonic)
  - CH3 = BASS
  - CH4 = CHORDS
  - CH5 = VOICE (melody)
  - CH6 = LEAD
  - CH7 = RUPTURE
- **Output selection:** `CFG.COMPOSER.midiOutputName` (and equivalent per-composer config) — `null` selects first available output
- **MIDI Clock Worker:** `MACH:INE II/src/midi-clock.worker.js` — runs in a Web Worker thread to avoid main-thread throttling. Posts `{ dt, now }` messages every ~2ms via `setTimeout(tick, 2)`.

### Projector Output — BroadcastChannel + window.open

- **What:** Sends a mirrored canvas render to a second window (projector/external display)
- **Protocol:** `BroadcastChannel('machine-projector')` + `window.open('projector.html', ...)`
- **Implementation:** `MACH:INE II/src/main.js` opens `projector.html` on keypress `P`; `MACH:INE II/src/render.js` uses `setProjectorWindow()` to track the projector window reference
- **Projector receiver:** `MACH:INE II/projector.html` — listens for close signals, sends `ready` event back
- **Data flow:** Canvas `ImageData` or drawImage copied to projector canvas each frame (referenced via `_projectorWin`)

### Screen Wake Lock

- **What:** Prevents the display from sleeping during live performance
- **Protocol:** `navigator.wakeLock.request('screen')` — wrapped in `WakeLockManager` class
- **Implementation:** `MACH:INE II/.claude/skills/runtime-expert/scripts/perf-utils.js` → imported in `MACH:INE II/src/main.js`

---

## Internal Module Connections

The application follows a strict unidirectional data flow per frame:

```
getUserMedia (stereo) → audio.js → state.js → director.js
                                              ↓
WebMIDI input → midi.js ─────────────────────→ state.js
                                              ↓
composer[1-7].js → midi.js (output) → external MIDI hardware / Ableton
                 → field.js (visual columns)
                 → director.js (arc phase forcing)
                 → colors.js (climax)
                 → presence-multiplier.js (per-engine scaling)

sequencer.js → composer[1-7].js (activate/deactivate)
             → presence-multiplier.js (fade values)
             → director.js (camera, mutations)
             → colors.js (concert time, invert dissolve)

director.js → colors.js (palette, chromatic shift, invert dissolve)
            → dna.js (mutations)
            → generations.js (entity system)

render.js → field.js (halftone Bayer render)
          → generations.js (entity render)
          → colors.js (color state)
          → director.js (camera, scene, arc)
          → midi.js (note flash display)
          → all composer status getters
```

**Key shared state objects (read by multiple modules each frame):**
- `audio` (exported from `MACH:INE II/src/audio.js`) — rms, bands, centroid, flux, onset, bpm, stereo data
- `midi` (exported from `MACH:INE II/src/midi.js`) — notes, density, channels, cc map
- `state` (exported from `MACH:INE II/src/state.js`) — 6 derived narrative values: intensity, rhythmicity, brightness, trajectory, stereoWidth, impact
- `CFG` (exported from `MACH:INE II/src/config.js`) — all configuration constants, read-only by convention except `CFG.sampleRate` (set at init)

**Presence Multiplier registry** (`MACH:INE II/src/presence-multiplier.js`):
- Each of the 7 engines has a `0.0–1.0` multiplier controlling MIDI velocity output and channel gating
- Read by each `composer[N].js` before sending any MIDI note
- Written by `sequencer.js` (automated concert) and `main.js` (manual key toggle)

**Composer/Engine Identity:**
| File | Engine Name | Key | BPM | Mode |
|---|---|---|---|---|
| `src/composer.js` | TERRENO | `4` | 80 | D Dorian |
| `src/composer2.js` | MECCANICA | `5` | 92 | A Dorian |
| `src/composer3.js` | DERIVA | `1` | — (brightness-triggered) | A Lydian |
| `src/composer4.js` | VORTICE | `6` | 112 | D Phrygian |
| `src/composer5.js` | CRISTALLO | `2` | 54 | D Lydian |
| `src/composer6.js` | ABISSO | `3` | 76 | A Phrygian |
| `src/composer7.js` | SOLCO | `7` | 120 | G Dorian |

All 7 composers share the same 8-channel MIDI role schema and output to the same `midiOut` port. Channel conflicts during multi-engine overlap are managed by `presence-multiplier.js` channel gating (`isChannelAllowed()`).

---

*Integration audit: 2026-03-27*
