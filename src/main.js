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
import { initDirector, initDirectorEvents } from './director.js';
import { WakeLockManager } from '../.claude/skills/runtime-expert/scripts/perf-utils.js';

// ── MACH:INE III modules ──
import { worldState } from './world-state.js';
import { initDirector3, updateDirector3, skipPhase, jumpToPhase, jumpToTrack, getDirector3Status } from './director3.js';
import { initRhythm, updateRhythm } from './rhythm.js';
import { initHarmony, updateHarmony } from './harmony.js';
import { initBass, updateBass } from './bass.js';
import { initMelody, updateMelody } from './melody.js';
import { initTexture, updateTexture } from './texture.js';

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
  try {
    await initAudio();
  } catch (e) {
    startScreen.style.display = 'none';
    errorScreen.style.display = 'flex';
    return;
  }

  await initMIDI();

  // ── Visual director (scene, camera, arc) — reads audio, stays as-is ──
  generateDNA();
  initDirector(state);
  initDirectorEvents();

  // ── MACH:INE III composition system ──
  initDirector3('NEBBIA');
  initRhythm();
  initHarmony();
  initBass();
  initMelody();
  initTexture();
  sendMIDIStart();
  console.log('[III] Director + 5 modules initialized');

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

  // Tasti 1-5: jump tra le 5 fasi compositive
  // Shift+1-7: jump to track (album order)
  const _trackMap = { Digit1: 'NEBBIA', Digit2: 'TESSUTO', Digit3: 'SOLCO', Digit4: 'RESPIRO', Digit5: 'MACCHINA', Digit6: 'TEMPESTA', Digit7: 'RITORNO' };
  if (_trackMap[e.code] && e.shiftKey) {
    jumpToTrack(_trackMap[e.code]);
    return;
  }
  // 1-5 without shift: jump to phase within current track
  const _phaseMap = { Digit1: 'germoglio', Digit2: 'pulsazione', Digit3: 'densita', Digit4: 'rottura', Digit5: 'dissoluzione' };
  if (_phaseMap[e.code] && !e.shiftKey) {
    jumpToPhase(_phaseMap[e.code]);
    return;
  }
  if (e.code === 'Space') { e.preventDefault(); return; }
  if (e.code === 'ArrowRight') { skipPhase(+1); return; }
  if (e.code === 'ArrowLeft')  { skipPhase(-1); return; }
  // Session recorder: Shift+L = start/stop, Shift+D = download, Shift+K = screenshot
  if (e.code === 'KeyL' && e.shiftKey) {
    if (isRecording()) stopRecording();
    else startRecording();
    return;
  }
  if (e.code === 'KeyD' && e.shiftKey) { downloadSession(); return; }
  if (e.code === 'KeyK' && e.shiftKey) { captureScreenshotNow(); return; }
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

midiWorker.onmessage = ({ data: { dt } }) => {
  try {
    if (!running) return;

    // Director reads clock → updates worldState
    updateDirector3(dt);

    // 5 modules read worldState → generate MIDI
    updateRhythm(dt);
    updateHarmony(dt);
    updateBass(dt);
    updateMelody(dt);
    updateTexture(dt);

    // MIDI clock sync
    if (worldState.bpm) {
      updateMIDIClock(worldState.bpm);
    }
  } catch (e) {
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
