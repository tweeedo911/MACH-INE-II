// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Boot & Module Wiring
//  v0.2.0: stereo audio engine, ES modules
// ═══════════════════════════════════════════════════════════

import { initAudio, updateAudio } from './audio.js';
import { initMIDI, updateMIDI, setCanvasWidth } from './midi.js';
import { updateState } from './state.js';
import { initRender, initHistory, renderFrame, resize, setHUDElement } from './render.js';

// ── DOM refs ──
const canvas = document.getElementById('c');
const startScreen = document.getElementById('start');
const errorScreen = document.getElementById('error');
const hudDebug = document.getElementById('hud-debug');

// ── Init render system ──
initRender(canvas);
setHUDElement(hudDebug);

// ── Keep MIDI module aware of canvas width ──
window.addEventListener('resize', () => {
  resize();
  setCanvasWidth(window.innerWidth);
});
setCanvasWidth(window.innerWidth);

// ── Boot on click ──
let running = false;

startScreen.addEventListener('click', async () => {
  try {
    await initAudio();
  } catch (e) {
    startScreen.style.display = 'none';
    errorScreen.style.display = 'flex';
    return;
  }

  initHistory();
  await initMIDI();

  startScreen.style.display = 'none';
  hudDebug.style.display = 'block';

  running = true;
  requestAnimationFrame(loop);
});

// ── Main loop ──
function loop(now) {
  if (!running) return;
  requestAnimationFrame(loop);

  updateAudio();
  updateMIDI();
  updateState();
  renderFrame(now);
}
