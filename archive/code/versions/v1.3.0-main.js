// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Boot & Module Wiring
//  v0.8.0: halftone field, DNA, generations, color, camera, audio
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { initAudio, updateAudio, setAudioGain, getAudioGain } from './audio.js';
import { initMIDI, updateMIDI } from './midi.js';
import { state, updateState } from './state.js';
import { initRender, renderFrame, resize, setHUDElements, handleKey } from './render.js';
import { generateDNA } from './dna.js';
import { resetGenerations } from './generations.js';
import { resetClimax } from './colors.js';
import { initDirector, initDirectorEvents } from './director.js';
import { initComposer, updateComposer, toggleComposer, composerActive } from './composer.js';
import { initComposer2, updateComposer2, toggleComposer2, composer2Active } from './composer2.js';
import { initComposer3, updateComposer3, toggleComposer3, composer3Active } from './composer3.js';

// ── DOM refs ──
const canvas = document.getElementById('c');
const startScreen = document.getElementById('start');
const errorScreen = document.getElementById('error');
const hudMinimal = document.getElementById('hud-minimal');
const hudDebug = document.getElementById('hud-debug');

// ── Init render ──
initRender(canvas);
setHUDElements(hudMinimal, hudDebug);

// ── Keep layout in sync ──
window.addEventListener('resize', resize);

// ── Boot on click ──
let running = false;
let lastTime = 0;

startScreen.addEventListener('click', async () => {
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
  initComposer();
  initComposer2();
  initComposer3();
  initDirectorEvents();

  startScreen.style.display = 'none';
  hudMinimal.style.display = 'block';

  running = true;
  lastTime = 0;
  startMidiClock();
  requestAnimationFrame(loop);
});

// ── Keyboard ──
document.addEventListener('keydown', (e) => {
  if (!running) return;

  // Gain audio input — è (diminuisce) / + (aumenta)
  if (e.key === 'è') { setAudioGain(getAudioGain() - CFG.audioInputGainStep); return; }
  if (e.key === '+') { setAudioGain(getAudioGain() + CFG.audioInputGainStep); return; }

  if (e.code === CFG.composer1Key) {
    if (composer2Active) toggleComposer2();
    if (composer3Active) toggleComposer3();
    toggleComposer();
    return;
  }
  if (e.code === CFG.COMPOSER2.toggleKey) {
    if (composerActive) toggleComposer();
    if (composer3Active) toggleComposer3();
    toggleComposer2();
    return;
  }
  if (e.code === CFG.COMPOSER3.toggleKey) {
    if (composerActive) toggleComposer();
    if (composer2Active) toggleComposer2();
    toggleComposer3();
    return;
  }

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
  if (!running) return;
  if (composerActive)  updateComposer(dt);
  if (composer2Active) updateComposer2(dt);
  if (composer3Active) updateComposer3(dt);
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
