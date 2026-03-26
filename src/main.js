// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Boot & Module Wiring
//  v2.0.0: 5-act concert + multi-engine overlap + channel priority
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { initAudio, updateAudio, setAudioGain, getAudioGain } from './audio.js';
import { initMIDI, updateMIDI, sendMIDIStart, sendMIDIStop, updateMIDIClock, isMIDIClockRunning } from './midi.js';
import { state, updateState } from './state.js';
import { initRender, renderFrame, resize, setHUDElements, handleKey, setProjectorWindow } from './render.js';
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
import { initComposer7, updateComposer7, toggleComposer7, composer7Active } from './composer7.js';
import { initSequencer, toggleSequencer, skipToNext, skipToPrev, skipToAct, togglePause, toggleLoop, canRecover, recoverState, updateSequencer, isSequencerActive } from './sequencer.js';
import { resetAllMultipliers, setPresenceMultiplier, getPresenceMultiplier } from './presence-multiplier.js';

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
  if (composer7Active) toggleComposer7();
}

const ENGINE_TOGGLE = {
  terreno:   toggleComposer,
  meccanica: toggleComposer2,
  deriva:    toggleComposer3,
  vortice:   toggleComposer4,
  cristallo: toggleComposer5,
  abisso:    toggleComposer6,
  solco:     toggleComposer7,
};

// Activate a single engine without killing others (used by sequencer crossfade)
function activateSingle(engineKey) {
  const isActive = {
    terreno: composerActive, meccanica: composer2Active, deriva: composer3Active,
    vortice: composer4Active, cristallo: composer5Active, abisso: composer6Active, solco: composer7Active,
  };
  if (!isActive[engineKey]) {
    const toggle = ENGINE_TOGGLE[engineKey];
    if (toggle) toggle();
  }
}

// Manual engine toggle — stops sequencer, resets multipliers
function manualToggle(toggleFn) {
  if (isSequencerActive()) toggleSequencer();
  allOff();
  resetAllMultipliers();
  toggleFn();
  // Zero pm for inactive engines so isChannelAllowed doesn't block channels
  const activeMap = {
    terreno: composerActive, meccanica: composer2Active, deriva: composer3Active,
    vortice: composer4Active, cristallo: composer5Active, abisso: composer6Active, solco: composer7Active,
  };
  for (const [key, active] of Object.entries(activeMap)) {
    if (!active) setPresenceMultiplier(key, 0);
  }
}

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
  initComposer7();
  initSequencer(activateSingle, allOff);
  initDirectorEvents();

  if (canRecover()) hudMinimal.textContent = 'PRESS Shift+R TO RECOVER';

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

  // Sequencer: 0 = start/stop, Space = pause, arrows = navigate, L = loop, Shift+R = recover
  if (e.code === 'Digit0') { toggleSequencer(); return; }
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
  if (e.code === 'KeyL') { toggleLoop(); return; }
  if (e.code === 'KeyR' && e.shiftKey) { recoverState(); return; }
  if (e.code === 'KeyP') { toggleProjector(); return; }

  // Manual composer toggle — stops sequencer, resets multipliers
  if (e.code === CFG.composer1Key)        { manualToggle(toggleComposer);  return; }
  if (e.code === CFG.COMPOSER2.toggleKey) { manualToggle(toggleComposer2); return; }
  if (e.code === CFG.COMPOSER3.toggleKey) { manualToggle(toggleComposer3); return; }
  if (e.code === CFG.COMPOSER4.toggleKey) { manualToggle(toggleComposer4); return; }
  if (e.code === CFG.COMPOSER5.toggleKey) { manualToggle(toggleComposer5); return; }
  if (e.code === CFG.COMPOSER6.toggleKey) { manualToggle(toggleComposer6); return; }
  if (e.code === CFG.COMPOSER7.toggleKey) { manualToggle(toggleComposer7); return; }

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
  // Pick BPM from engine with highest presence multiplier
  const engines = [
    { active: composerActive,  bpm: CFG.COMPOSER.bpm,  pm: getPresenceMultiplier('terreno') },
    { active: composer2Active, bpm: CFG.COMPOSER2.bpm, pm: getPresenceMultiplier('meccanica') },
    { active: composer3Active, bpm: CFG.COMPOSER3.bpm, pm: getPresenceMultiplier('deriva') },
    { active: composer4Active, bpm: CFG.COMPOSER4.bpm, pm: getPresenceMultiplier('vortice') },
    { active: composer5Active, bpm: CFG.COMPOSER5.bpm, pm: getPresenceMultiplier('cristallo') },
    { active: composer6Active, bpm: CFG.COMPOSER6.bpm, pm: getPresenceMultiplier('abisso') },
    { active: composer7Active, bpm: CFG.COMPOSER7.bpm, pm: getPresenceMultiplier('solco') },
  ];
  let bestPm = 0;
  for (const e of engines) {
    if (e.active && e.bpm && e.pm > bestPm) {
      bestPm = e.pm;
      lastClockBpm = e.bpm;
    }
  }
  return lastClockBpm;
}

midiWorker.onmessage = ({ data: { dt } }) => {
  if (!running) return;

  const anyActive = composerActive || composer2Active || composer3Active ||
                    composer4Active || composer5Active || composer6Active || composer7Active;

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
  if (composer7Active) updateComposer7(dt);

  // Send MIDI Clock ticks at 24 ppqn
  if (anyActive) updateMIDIClock(getActiveBpm());
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
  updateSequencer(dt);
  renderFrame(now, dt);
}
