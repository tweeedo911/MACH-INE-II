# Technology Stack

**Analysis Date:** 2026-03-27

## Languages & Runtime

**Primary:**
- JavaScript (ES2020+ modules) — all source code in `MACH:INE II/src/`, zero transpilation
- HTML5 — entry point `MACH:INE II/index.html`, projector output `MACH:INE II/projector.html`
- CSS — inline in HTML files only, no external stylesheet

**Secondary:**
- Bash — launcher scripts `MACH:INE II/launch.sh`, `MACH:INE II/start.sh`, `MACH:INE II/MACHINE-II.command`
- YAML — orchestration config `MACH:INE II/ruflo.config.yaml`

**Runtime:**
- Browser runtime (Chrome/Edge required — WebMIDI API not available in Firefox/Safari without flags)
- No Node.js runtime for the application itself
- No TypeScript, no transpiler, no bundler

## Package Manager

- **None** — zero npm dependencies, no `package.json`, no `node_modules/`
- No lockfile (not applicable)

## Frameworks & Libraries

**Core — all native browser APIs, no external libraries:**
- **Canvas 2D API** — primary render surface (`MACH:INE II/src/render.js`, `MACH:INE II/src/field.js`)
- **Web Audio API** (`AudioContext`, `ChannelSplitter`, `AnalyserNode`, `GainNode`) — `MACH:INE II/src/audio.js`
- **WebMIDI API** (`navigator.requestMIDIAccess`) — `MACH:INE II/src/midi.js`
- **Web Workers API** — MIDI clock worker in a dedicated thread `MACH:INE II/src/midi-clock.worker.js`
- **BroadcastChannel API** — main window ↔ projector window sync (`MACH:INE II/src/main.js`, `MACH:INE II/projector.html`)
- **Screen Wake Lock API** — prevents display sleep during performance, via `WakeLockManager` imported from `.claude/skills/runtime-expert/scripts/perf-utils.js`
- **Fullscreen API** (`requestFullscreen` / `exitFullscreen`) — `MACH:INE II/src/render.js`
- **getUserMedia** — stereo microphone/BlackHole input (`MACH:INE II/src/audio.js`)

**Internal Performance Toolkit:**
- `MACH:INE II/.claude/skills/runtime-expert/scripts/perf-utils.js` — provides `ObjectPool`, `FrameTimer`, `ColorCache`, `SeededRNG`, `RingBuffer`, `WakeLockManager`. Imported by `src/main.js`.

## Build & Tooling

**Build:**
- No build step. Files are served as-is.

**Dev Server:**
- `python3 -m http.server 8282` — launched via `MACH:INE II/launch.sh`
- Binds to `127.0.0.1:8282`
- Browser target: `http://localhost:8282`

**Launch scripts:**
- `MACH:INE II/launch.sh` — kills prior instance on port, starts server, opens browser
- `MACH:INE II/start.sh` — alternate launcher
- `MACH:INE II/MACHINE-II.command` — macOS double-click launcher

**Testing:**
- No test framework. Manual testing via browser.
- `MACH:INE II/test.html`, `MACH:INE II/sandbox.html` — manual test pages
- `MACH:INE II/versions/` — archived HTML/JS snapshots for regression reference

**Linting / Formatting:**
- No ESLint, Prettier, or similar tools configured
- Style enforced by convention (see `MACH:INE II/RULES.md`)

## Configuration

**Central parameter config:**
- `MACH:INE II/src/config.js` — exports `CFG` object containing all numeric parameters: audio analysis, MIDI, render, composer phases, arc thresholds, camera, FPS limiter, per-engine modal definitions. All modules import from this single file.

**Orchestration config:**
- `MACH:INE II/ruflo.config.yaml` — Claude Code agent orchestration settings (not consumed by the application at runtime)

**No environment variables** — browser-only app with no server-side config or `.env` files.

**No build config files** — no `tsconfig.json`, `webpack.config.js`, `vite.config.js`, `.babelrc`, etc.

## Module System

Native ES modules via `<script type="module">`. Import paths are relative (`./config.js`, `../module.js`). One non-standard import path: `MACH:INE II/src/main.js` imports `WakeLockManager` from `../.claude/skills/runtime-expert/scripts/perf-utils.js`.

## Version

- Current: v2.8.0 (as declared in `src/config.js` and `src/main.js` headers)
- Versioning format: `vX.Y.Z` — history in `MACH:INE II/CHANGELOG.md`

---

*Stack analysis: 2026-03-27*
