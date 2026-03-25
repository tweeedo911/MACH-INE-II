// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Boot & Module Wiring
//  v1.6.0: 6 engines + sequencer autopilot
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { initAudio, updateAudio, setAudioGain, getAudioGain } from './audio.js';
import { initMIDI, updateMIDI, sendMIDIStart, sendMIDIStop, updateMIDIClock, isMIDIClockRunning } from './midi.js';
import { state, updateState } from './state.js';
import { initRender, renderFrame, resize, setHUDElements, handleKey } from './render.js';
import { generateDNA } from './dna.js';
import { resetGenerations } from './generations.js';
import { resetClimax } from './colors.js';
import { initDirector, initDirectorEvents } from './director.js';
import { initComposer, updateComposer, toggleComposer, composerActive } from './composer.js';
import { initComposer2, updateComposer2, toggleComposer2, composer2Active } from './composer2.js';
import { initComposer3, updateComposer3, toggleComposer3, composer3Active } from './composer3.js';
import { initComposer4, updateComposer4, toggleComposer4, composer4Active } from './composer4.js';
import { initComposer5, updateComposer5, toggleComposer5, composer5Active } from './composer5.js';
import { initComposer6, updateComposer6, toggleComposer6, composer6Active } from './composer6.js';
import { initSequencer, toggleSequencer, skipToNext, updateSequencer, isSequencerActive } from './sequencer.js';

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

// ── Helpers for sequencer ──
function allOff() {
  if (composerActive)  toggleComposer();
  if (composer2Active) toggleComposer2();
  if (composer3Active) toggleComposer3();
  if (composer4Active) toggleComposer4();
  if (composer5Active) toggleComposer5();
  if (composer6Active) toggleComposer6();
}

const ENGINE_TOGGLE = {
  terreno:   toggleComposer,
  meccanica: toggleComposer2,
  deriva:    toggleComposer3,
  vortice:   toggleComposer4,
  cristallo: toggleComposer5,
  abisso:    toggleComposer6,
};

function activateEngine(engineKey) {
  allOff();
  const toggle = ENGINE_TOGGLE[engineKey];
  if (toggle) toggle();
}

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
  initComposer4();
  initComposer5();
  initComposer6();
  initSequencer(activateEngine, allOff);
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

  // Sequencer: 0 = start/stop, ArrowRight = skip
  if (e.code === 'Digit0') { toggleSequencer(); return; }
  if (e.code === 'ArrowRight' && isSequencerActive()) { skipToNext(); return; }

  // Manual composer toggle (stops sequencer implicitly)
  if (e.code === CFG.composer1Key)        { allOff(); toggleComposer();  return; }
  if (e.code === CFG.COMPOSER2.toggleKey) { allOff(); toggleComposer2(); return; }
  if (e.code === CFG.COMPOSER3.toggleKey) { allOff(); toggleComposer3(); return; }
  if (e.code === CFG.COMPOSER4.toggleKey) { allOff(); toggleComposer4(); return; }
  if (e.code === CFG.COMPOSER5.toggleKey) { allOff(); toggleComposer5(); return; }
  if (e.code === CFG.COMPOSER6.toggleKey) { allOff(); toggleComposer6(); return; }

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

let lastClockBpm = 120;
let wasAnyComposerActive = false;

function getActiveBpm() {
  let bpm = null;
  if (composerActive)  bpm = CFG.COMPOSER.bpm;
  if (composer2Active) bpm = CFG.COMPOSER2.bpm;
  if (composer3Active) bpm = CFG.COMPOSER3.bpm; // null for DERIVA
  if (composer4Active) bpm = CFG.COMPOSER4.bpm;
  if (composer5Active) bpm = CFG.COMPOSER5.bpm;
  if (composer6Active) bpm = CFG.COMPOSER6.bpm;
  if (bpm) lastClockBpm = bpm;
  return lastClockBpm;
}

midiWorker.onmessage = ({ data: { dt } }) => {
  if (!running) return;

  const anyActive = composerActive || composer2Active || composer3Active ||
                    composer4Active || composer5Active || composer6Active;

  // Auto MIDI Start/Stop on engine activation
  if (anyActive && !wasAnyComposerActive) sendMIDIStart();
  if (!anyActive && wasAnyComposerActive) sendMIDIStop();
  wasAnyComposerActive = anyActive;

  if (composerActive)  updateComposer(dt);
  if (composer2Active) updateComposer2(dt);
  if (composer3Active) updateComposer3(dt);
  if (composer4Active) updateComposer4(dt);
  if (composer5Active) updateComposer5(dt);
  if (composer6Active) updateComposer6(dt);

  // Send MIDI Clock ticks at 24 ppqn
  if (anyActive) updateMIDIClock(dt, getActiveBpm());
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
  updateSequencer(dt, now / 1000);
  renderFrame(now, dt);
}
