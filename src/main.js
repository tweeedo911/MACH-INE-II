// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Boot & Module Wiring
//  v0.8.0: halftone field, DNA, generations, color, camera, audio
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { initAudio, updateAudio } from './audio.js';
import { initMIDI, updateMIDI } from './midi.js';
import { state, updateState } from './state.js';
import { initRender, renderFrame, resize, setHUDElements, handleKey } from './render.js';
import { generateDNA } from './dna.js';
import { resetGenerations } from './generations.js';
import { resetClimax } from './colors.js';
import { initDirector } from './director.js';
import { initComposer, updateComposer, toggleComposer, composerActive } from './composer.js';

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

  startScreen.style.display = 'none';
  hudMinimal.style.display = 'block';

  running = true;
  lastTime = 0;
  requestAnimationFrame(loop);
});

// ── Keyboard ──
document.addEventListener('keydown', (e) => {
  if (!running) return;

  if (e.code === CFG.composerKey) { toggleComposer(); return; }

  const result = handleKey(e.code);
  if (result === 'REGEN') {
    generateDNA();
    resetGenerations();
    resetClimax();
    initDirector(state);
  }
});

// ── Main loop ──
function loop(now) {
  if (!running) return;
  requestAnimationFrame(loop);

  const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
  lastTime = now;

  updateAudio();
  updateMIDI();
  updateState();
  if (composerActive) updateComposer(dt);
  renderFrame(now, dt);
}
