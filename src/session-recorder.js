// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Session Recorder
//  Records MIDI events, compositional decisions, state snapshots,
//  frame timing, and screenshots for post-performance analysis.
//  Zero-alloc in hot path: pre-allocated ring buffers, no strings.
// ═══════════════════════════════════════════════════════════

// ── Pre-allocated storage ──
// MIDI events: ch(4bit) + note(7bit) + vel(7bit) + dur(16bit) + time(32bit) = 66bit → 3x Uint32
const MIDI_CAPACITY = 50000;  // ~50K notes per session (43min, ~20 notes/sec avg)
const _midiCh   = new Uint8Array(MIDI_CAPACITY);
const _midiNote = new Uint8Array(MIDI_CAPACITY);
const _midiVel  = new Uint8Array(MIDI_CAPACITY);
const _midiDur  = new Uint16Array(MIDI_CAPACITY);
const _midiTime = new Float32Array(MIDI_CAPACITY);  // seconds from start
let _midiCount = 0;

// State snapshots: sampled every N seconds (not every frame — too much data)
const SNAPSHOT_INTERVAL_SEC = 1.0;   // 1 snapshot/second = ~2580 snapshots for 43min
const SNAPSHOT_CAPACITY = 3000;
const _snapshots = new Array(SNAPSHOT_CAPACITY);
let _snapshotCount = 0;
let _lastSnapshotTime = -Infinity;

// Phase/mode changes: logged on transition
const PHASE_CAPACITY = 200;
const _phases = new Array(PHASE_CAPACITY);
let _phaseCount = 0;
let _lastMode = '';

// Compositional decisions: chord changes, breaks, seed returns, cue fires
const DECISION_CAPACITY = 2000;
const _decisions = new Array(DECISION_CAPACITY);
let _decisionCount = 0;

// Frame timing: ring buffer of last 300 frames for percentile analysis
const FRAME_CAPACITY = 300;
const _frameTimes = new Float32Array(FRAME_CAPACITY);
let _frameIdx = 0;
let _frameTotal = 0;

// Screenshots: stored as blob URLs (captured async, off hot path)
const _screenshots = [];  // { t, blobUrl, trigger }
let _lastScreenshotTime = -Infinity;
const SCREENSHOT_INTERVAL_SEC = 60;  // auto-capture every 60s
const SCREENSHOT_ON_PHASE_CHANGE = true;

// Session metadata
let _sessionStart = 0;
let _recording = false;
let _canvas = null;

// ── Public API ──

export function initRecorder(canvasElement) {
  _canvas = canvasElement;
  _sessionStart = 0;
  _recording = false;
  _midiCount = 0;
  _snapshotCount = 0;
  _phaseCount = 0;
  _decisionCount = 0;
  _frameIdx = 0;
  _frameTotal = 0;
  _lastMode = '';
  _lastSnapshotTime = -Infinity;
  _lastScreenshotTime = -Infinity;
  _screenshots.length = 0;
  console.log('[RECORDER] Initialized — press Shift+L to start/stop recording');
}

export function startRecording() {
  if (_recording) return;
  _sessionStart = performance.now() / 1000;
  _recording = true;
  console.log('[RECORDER] ● REC started');
}

export function stopRecording() {
  if (!_recording) return;
  _recording = false;
  console.log(`[RECORDER] ■ REC stopped — ${_midiCount} MIDI events, ${_snapshotCount} snapshots, ${_phaseCount} phase changes, ${_decisionCount} decisions, ${_screenshots.length} screenshots`);
}

export function isRecording() { return _recording; }

// ── MIDI hook — called from midi.js sendMIDINote ──
export function recordMIDI(ch, note, vel, durationMs) {
  if (!_recording) return;
  if (_midiCount >= MIDI_CAPACITY) return;  // graceful cap
  const i = _midiCount++;
  _midiCh[i] = ch;
  _midiNote[i] = note;
  _midiVel[i] = vel;
  _midiDur[i] = Math.min(durationMs, 65535);
  _midiTime[i] = _elapsed();
}

// ── State snapshot — called from render loop (throttled internally) ──
export function recordSnapshot(macroState, entities, frameMs) {
  if (!_recording) return;
  const t = _elapsed();

  // Frame timing (always recorded — ring buffer, zero alloc)
  _frameTimes[_frameIdx % FRAME_CAPACITY] = frameMs;
  _frameIdx++;
  _frameTotal++;

  // State snapshot (throttled to SNAPSHOT_INTERVAL_SEC)
  if (t - _lastSnapshotTime < SNAPSHOT_INTERVAL_SEC) return;
  if (_snapshotCount >= SNAPSHOT_CAPACITY) return;
  _lastSnapshotTime = t;

  _snapshots[_snapshotCount++] = {
    t: Math.round(t * 10) / 10,  // 0.1s precision
    rD: _r2(macroState.rhythmicDensity),
    hC: _r2(macroState.harmonicColor),
    mA: _r2(macroState.melodicActivity),
    tD: _r2(macroState.textureDepth),
    mode: macroState.currentMode,
    bpm: Math.round(macroState.currentBpm),
    arc: _r3(macroState.arcPercent),
    ent: entities.length,
    brk: macroState.breakActive ? 1 : 0,
    frameMs: _r1(frameMs),
  };

  // Auto-screenshot every 60s or on phase change
  if (t - _lastScreenshotTime >= SCREENSHOT_INTERVAL_SEC) {
    _captureScreenshot(t, 'auto');
  }
}

// ── Phase change detection — called from render loop ──
export function recordPhaseCheck(macroState) {
  if (!_recording) return;
  const mode = macroState.currentMode;
  if (mode === _lastMode) return;

  const t = _elapsed();
  if (_phaseCount < PHASE_CAPACITY) {
    _phases[_phaseCount++] = {
      t: _r1(t),
      from: _lastMode || '(start)',
      to: mode,
      bpm: Math.round(macroState.currentBpm),
      arc: _r3(macroState.arcPercent),
    };
  }
  _lastMode = mode;

  // Screenshot on phase change
  if (SCREENSHOT_ON_PHASE_CHANGE) {
    _captureScreenshot(t, `mode:${mode}`);
  }
}

// ── Decision logging — called from layer modules ──
export function recordDecision(type, detail) {
  if (!_recording) return;
  if (_decisionCount >= DECISION_CAPACITY) return;
  _decisions[_decisionCount++] = {
    t: _r1(_elapsed()),
    type,       // 'chord_change', 'break_start', 'break_end', 'seed_return', 'cue', 'oblique'
    detail,     // string or small object
  };
}

// ── Manual screenshot (user-triggered) ──
export function captureScreenshotNow(label) {
  if (!_recording) return;
  _captureScreenshot(_elapsed(), label || 'manual');
}

// ── Export session data ──
export function exportSession() {
  const session = {
    version: 'MACHINE-II-SESSION-v1',
    date: new Date().toISOString(),
    duration: _r1(_elapsed()),
    totalMidiEvents: _midiCount,
    totalSnapshots: _snapshotCount,
    totalPhaseChanges: _phaseCount,
    totalDecisions: _decisionCount,
    totalScreenshots: _screenshots.length,

    // MIDI events (converted from TypedArrays for JSON)
    midi: _exportMIDI(),

    // State snapshots (1/sec)
    snapshots: _snapshots.slice(0, _snapshotCount),

    // Phase transitions
    phases: _phases.slice(0, _phaseCount),

    // Compositional decisions
    decisions: _decisions.slice(0, _decisionCount),

    // Frame timing stats
    frameTiming: _exportFrameStats(),

    // Screenshot references
    screenshots: _screenshots.map(s => ({ t: s.t, trigger: s.trigger })),
  };

  return session;
}

// ── Download session as JSON + screenshots as ZIP-like bundle ──
export function downloadSession() {
  const session = exportSession();
  const json = JSON.stringify(session, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.href = url;
  a.download = `SESSION-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);

  // Download screenshots separately
  _screenshots.forEach((s, i) => {
    if (s.blobUrl) {
      const sa = document.createElement('a');
      sa.href = s.blobUrl;
      const min = Math.floor(s.t / 60);
      const sec = Math.floor(s.t % 60);
      sa.download = `FRAME-${String(min).padStart(2, '0')}m${String(sec).padStart(2, '0')}s-${s.trigger}.png`;
      sa.click();
    }
  });

  console.log(`[RECORDER] Downloaded session (${(json.length / 1024).toFixed(0)}KB) + ${_screenshots.length} screenshots`);
}

// ── Internal helpers ──

function _elapsed() {
  return performance.now() / 1000 - _sessionStart;
}

function _r1(v) { return Math.round(v * 10) / 10; }
function _r2(v) { return Math.round(v * 100) / 100; }
function _r3(v) { return Math.round(v * 1000) / 1000; }

function _captureScreenshot(t, trigger) {
  if (!_canvas) return;
  _lastScreenshotTime = t;

  // Async capture — no impact on frame budget
  _canvas.toBlob((blob) => {
    if (!blob) return;
    const blobUrl = URL.createObjectURL(blob);
    _screenshots.push({ t: _r1(t), trigger, blobUrl });
  }, 'image/png');
}

function _exportMIDI() {
  const events = new Array(_midiCount);
  for (let i = 0; i < _midiCount; i++) {
    events[i] = {
      t: _r1(_midiTime[i]),
      ch: _midiCh[i],
      note: _midiNote[i],
      vel: _midiVel[i],
      dur: _midiDur[i],
    };
  }
  return events;
}

function _exportFrameStats() {
  const count = Math.min(_frameTotal, FRAME_CAPACITY);
  if (count === 0) return { avg: 0, p95: 0, p99: 0, max: 0, drops: 0 };

  // Copy and sort for percentile calculation
  const sorted = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    sorted[i] = _frameTimes[(_frameIdx - count + i + FRAME_CAPACITY) % FRAME_CAPACITY];
  }
  sorted.sort();

  return {
    avg: _r1(sorted.reduce((a, b) => a + b, 0) / count),
    p50: _r1(sorted[Math.floor(count * 0.50)]),
    p95: _r1(sorted[Math.floor(count * 0.95)]),
    p99: _r1(sorted[Math.floor(count * 0.99)]),
    max: _r1(sorted[count - 1]),
    drops: Array.from(sorted).filter(ms => ms > 33.3).length,
    totalFrames: _frameTotal,
  };
}
