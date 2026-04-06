// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Boot & Module Wiring
//  v4.0.0: 7 phases, 43min, call-response, degradation, visual feedback+distortion
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { initAudio, updateAudio, setAudioGain, getAudioGain } from './audio.js';
import { initMIDI, updateMIDI, sendMIDIStart, updateMIDIClock } from './midi.js';
import { state, updateState } from './state.js';
import { initRender, renderFrame, resize, setHUDElements, handleKey, setProjectorWindow } from './render.js';
import { generateDNA } from './dna.js';
import { resetGenerations } from './generations.js';
import { resetClimax } from './colors.js';
import { initDirector, initDirectorEvents, resetArcPriority } from './director.js';
import { initSequencer, toggleSequencer, skipToNext, skipToPrev, skipToAct, togglePause, toggleLoop, canRecover, recoverState, updateSequencer, isSequencerActive, setGlobalTime } from './sequencer.js';
import { WakeLockManager } from '../.claude/skills/runtime-expert/scripts/perf-utils.js';

// ── v3 layer system ──
import { initMacroComposer, updateMacroComposer, macroState, jumpArc } from './macro-composer.js';
import { initHarmonyLayer, updateHarmonyLayer } from './harmony-layer.js';
import { initRhythmLayer, updateRhythmLayer } from './rhythm-layer.js';
import { initMelodyTextureLayer, updateMelodyTextureLayer } from './melody-texture-layer.js';

// ── Composition Designer config loader ──
import { initConfigLoader } from './config-loader.js';

// ── Session recorder ──
import { initRecorder, startRecording, stopRecording, isRecording, recordSnapshot, recordPhaseCheck, downloadSession, captureScreenshotNow } from './session-recorder.js';

// ── DOM refs ──
const canvas = document.getElementById('c');
const startScreen = document.getElementById('start');
const errorScreen = document.getElementById('error');
const hudMinimal = document.getElementById('hud-minimal');
const hudDebug   = document.getElementById('hud-debug');
const hudSeq     = document.getElementById('seq-panel');

// ── Init render ──
initRender(canvas);
setHUDElements(hudMinimal, hudDebug, hudSeq);
initRecorder(canvas);

// ── Keep layout in sync ──
window.addEventListener('resize', resize);

// ── Helpers for sequencer (no-op in V3 — engines managed by MacroComposer) ──
function allOff() {}
function activateSingle() {}

// ── Projector ──
let projectorWindow = null;
const projChannel = new BroadcastChannel('machine-projector');
projChannel.onmessage = (e) => {
  if (e.data.type === 'projector-closed') { projectorWindow = null; setProjectorWindow(null); }
};

function toggleProjector() {
  if (projectorWindow && !projectorWindow.closed) {
    projChannel.postMessage({ type: 'close' });
    projectorWindow = null;
    setProjectorWindow(null);
  } else {
    projectorWindow = window.open('projector.html', 'projector', 'width=1280,height=720');
    setProjectorWindow(projectorWindow);
  }
}

// ── Boot on click ──
let running = false;
let lastTime = 0;
const _wakeLock = new WakeLockManager();

startScreen.addEventListener('click', async () => {
  // ── Load preset from URL params or designer ──
  // Supports: ?preset=glaciale-ambient | ?config=path.json | ?meta=base64
  try {
    await initConfigLoader(CFG);
  } catch (configErr) {
    console.warn('[MAIN] Config loader error (continuing with defaults):', configErr);
  }

  try {
    await initAudio();
  } catch (e) {
    startScreen.style.display = 'none';
    errorScreen.style.display = 'flex';
    return;
  }

  await initMIDI();

  // Generate first DNA world
  generateDNA();
  initDirector(state);
  initSequencer(activateSingle, allOff);
  initDirectorEvents();

  // ── v3 layer system init ──
  initMacroComposer();
  initHarmonyLayer();
  initRhythmLayer();
  initMelodyTextureLayer();
  sendMIDIStart();
  console.log('[V3] MacroComposer + HarmonyLayer + RhythmLayer + MelodyTextureLayer initialized');
  if (CFG.debug) {
    window._m = macroState;
    window.arc = (v) => {
      if (v === undefined) {
        macroState._debugArc = undefined;
        console.log('[V3] arc: rilasciato — clock normale');
      } else {
        macroState._debugArc = Math.max(0, Math.min(1, v));
        console.log('[V3] arc:', macroState._debugArc, '— aspetta 10s per il lerp');
      }
    };
    console.log('[V3] Debug pronto — usa: arc(0.5) | arc(0.25) | arc(0.75) | arc(0.9) | arc()');
  }

  if (canRecover()) hudMinimal.textContent = 'PRESS Shift+R TO RECOVER';

  startScreen.style.display = 'none';
  hudMinimal.style.display = 'block';

  running = true;
  lastTime = 0;
  startMidiClock();
  await _wakeLock.acquire();
  requestAnimationFrame(loop);
});

// ── Keyboard ──
document.addEventListener('keydown', (e) => {
  if (!running) return;

  // Gain audio input — BracketLeft=è (diminuisce) / BracketRight=+ (aumenta)
  if (e.code === 'BracketLeft')  { e.preventDefault(); setAudioGain(getAudioGain() - CFG.audioInputGainStep); return; }
  if (e.code === 'BracketRight') { e.preventDefault(); setAudioGain(getAudioGain() + CFG.audioInputGainStep); return; }

  // Sequencer: 0 = START (solo), Shift+0 = STOP con reset, Space = pause
  if (e.code === 'Digit0') {
    if (e.shiftKey) { if (isSequencerActive()) toggleSequencer(); }
    else { if (!isSequencerActive()) toggleSequencer(); }
    return;
  }
  // Tasti 1-7: jump tra le 7 fasi dell'arco narrativo
  const _arcMap = { Digit1: 0.00, Digit2: 0.07, Digit3: 0.186, Digit4: 0.372, Digit5: 0.419, Digit6: 0.581, Digit7: 0.814 };
  if (_arcMap[e.code] !== undefined) {
    jumpArc(_arcMap[e.code]);
    setGlobalTime(_arcMap[e.code] * CFG.MACRO.concertDurationSec);
    return;
  }
  if (e.code === 'Space') { e.preventDefault(); togglePause(); return; }
  if (e.code === 'ArrowRight') {
    if (e.shiftKey) skipToAct(+1);
    else if (isSequencerActive()) skipToNext();
    return;
  }
  if (e.code === 'ArrowLeft') {
    if (e.shiftKey) skipToAct(-1);
    else skipToPrev();
    return;
  }
  if (e.code === 'KeyL' && !e.shiftKey) { toggleLoop(); return; }
  // Session recorder: Shift+L = start/stop, Shift+D = download, Shift+K = screenshot
  if (e.code === 'KeyL' && e.shiftKey) {
    if (isRecording()) stopRecording();
    else startRecording();
    return;
  }
  if (e.code === 'KeyD' && e.shiftKey) { downloadSession(); return; }
  if (e.code === 'KeyK' && e.shiftKey) { captureScreenshotNow(); return; }
  if (e.code === 'KeyR' && e.shiftKey) { recoverState(); return; }
  if (e.code === 'KeyP') { toggleProjector(); return; }

  const result = handleKey(e.code);
  if (result === 'REGEN') {
    generateDNA();
    resetGenerations();
    resetClimax();
    initDirector(state);
  }
});

// ── MIDI clock — Web Worker (non throttolato quando il browser perde focus) ──
const midiWorker = new Worker('./src/midi-clock.worker.js');

let _currentClockBpm = 120; // BPM actual (lerped toward target each tick)

midiWorker.onmessage = ({ data: { dt } }) => {
  try {
    if (!running) return;
    resetArcPriority();

    // v3 layer system: MacroComposer drives 4D arc, layers produce MIDI
    updateMacroComposer(dt);
    updateHarmonyLayer(dt);
    updateRhythmLayer(dt);
    updateMelodyTextureLayer(dt);

    // MIDI clock: BPM from MacroComposer (per-mode, already lerped)
    const bpm = macroState.currentBpm;
    const beatsPerTick = dt * (bpm / 60);
    const lerpRate = beatsPerTick / CFG.bpmLerpBeats;
    _currentClockBpm += (bpm - _currentClockBpm) * Math.min(lerpRate, 1);
    updateMIDIClock(_currentClockBpm);

    // Sequencer runs here (not in rAF loop) so it keeps advancing when window loses focus
    updateSequencer(dt);
  } catch (e) {
    // Log error but keep the clock alive — an uncaught exception here
    // would silently kill the handler and stop all MIDI output
    console.error('[MIDI CLOCK] Handler error (clock kept alive):', e);
  }
};

function startMidiClock() {
  midiWorker.postMessage('start');
}

// ── Main loop — solo render + audio + stato ──
function loop(now) {
  if (!running) return;
  requestAnimationFrame(loop);

  const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
  lastTime = now;

  updateAudio();
  updateMIDI();
  updateState();
  renderFrame(now, dt);
}
