// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Boot & Module Wiring
//  v2.8.0: 5-act concert + multi-engine overlap + channel priority
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { initAudio, updateAudio, setAudioGain, getAudioGain } from './audio.js';
import { initMIDI, updateMIDI, sendMIDIStart, sendMIDIStop, updateMIDIClock, isMIDIClockRunning } from './midi.js';
import { state, updateState } from './state.js';
import { initRender, renderFrame, resize, setHUDElements, handleKey, setProjectorWindow } from './render.js';
import { generateDNA } from './dna.js';
import { resetGenerations } from './generations.js';
import { resetClimax } from './colors.js';
import { initDirector, initDirectorEvents, resetArcPriority } from './director.js';
import { initComposer, updateComposer, toggleComposer, composerActive } from './composer.js';
import { initComposer2, updateComposer2, toggleComposer2, composer2Active } from './composer2.js';
import { initComposer3, updateComposer3, toggleComposer3, composer3Active } from './composer3.js';
import { initComposer4, updateComposer4, toggleComposer4, composer4Active } from './composer4.js';
import { initComposer5, updateComposer5, toggleComposer5, composer5Active } from './composer5.js';
import { initComposer6, updateComposer6, toggleComposer6, composer6Active } from './composer6.js';
import { initComposer7, updateComposer7, toggleComposer7, composer7Active } from './composer7.js';
import { initSequencer, toggleSequencer, skipToNext, skipToPrev, skipToAct, togglePause, toggleLoop, canRecover, recoverState, updateSequencer, isSequencerActive } from './sequencer.js';
import { setPresenceMultiplier, getPresenceMultiplier } from './presence-multiplier.js';
import { WakeLockManager } from '../.claude/skills/runtime-expert/scripts/perf-utils.js';

// ── v3 layer system (Phase 1 + Phase 2 + Phase 3) ──
import { initMacroComposer, updateMacroComposer, macroState } from './macro-composer.js';
import { initHarmonyLayer, updateHarmonyLayer } from './harmony-layer.js';
import { initRhythmLayer, updateRhythmLayer } from './rhythm-layer.js';
import { initMelodyTextureLayer, updateMelodyTextureLayer } from './melody-texture-layer.js';

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
  toggleFn();
  // Set active engine to 1.0, zero all others — no intermediate resetAllMultipliers()
  // to avoid a frame where all 7 engines have pm=1.0 simultaneously
  const activeMap = {
    terreno: composerActive, meccanica: composer2Active, deriva: composer3Active,
    vortice: composer4Active, cristallo: composer5Active, abisso: composer6Active, solco: composer7Active,
  };
  for (const [key, active] of Object.entries(activeMap)) {
    setPresenceMultiplier(key, active ? 1.0 : 0.0);
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

  // ── v3 init (Phase 1) ──
  // NOTA: se V3_MODE viene switchato mid-performance, chiamare sendMIDIAllNotesOff() prima
  // per evitare note in-flight dai composer v2 (Pitfall 6 — RESEARCH.md)
  if (CFG.V3_MODE) {
    initMacroComposer();
    initHarmonyLayer();
    initRhythmLayer();
    initMelodyTextureLayer();
    sendMIDIStart(); // avvia MIDI clock per v3 (i composer v2 non lo farebbero)
    console.log('[V3] MacroComposer + HarmonyLayer + RhythmLayer + MelodyTextureLayer initialized');
    if (CFG.debug) {
      window._m = macroState;
      // arc(0.5)  → forza arcPercent a 50% e blocca il clock
      // arc()     → rilascia il freeze, torna al clock normale
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
let _targetClockBpm = 120;  // BPM target (updated instantly on engine switch)
let _currentClockBpm = 120; // BPM actual (lerped toward _targetClockBpm each tick)
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
      _targetClockBpm = e.bpm; // set lerp target (guard: e.bpm is never null here)
    }
  }
  return lastClockBpm;
}

midiWorker.onmessage = ({ data: { dt } }) => {
  try {
    if (!running) return;
    resetArcPriority();

    if (CFG.V3_MODE) {
      // ── v3 layer system: MacroComposer + HarmonyLayer + RhythmLayer ──
      // I composer v2 non vengono chiamati (D-08: rimangono intatti come reference/fallback)
      updateMacroComposer(dt);
      updateHarmonyLayer(dt);
      updateRhythmLayer(dt);
      updateMelodyTextureLayer(dt);

      // MIDI clock: usa bpmReference dal MacroComposer config
      const bpm = CFG.MACRO.bpmReference;
      const beatsPerTick = (dt / 1000) * (bpm / 60);
      const lerpRate = beatsPerTick / CFG.bpmLerpBeats;
      _currentClockBpm += (bpm - _currentClockBpm) * Math.min(lerpRate, 1);
      updateMIDIClock(_currentClockBpm);
    } else {
      // ── v2 legacy system: 7 engine compositori ──
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
      if (anyActive) {
        getActiveBpm(); // updates _targetClockBpm
        // Lerp _currentClockBpm toward _targetClockBpm over CFG.bpmLerpBeats beats
        const beatsPerTick = (dt / 1000) * (_currentClockBpm / 60);
        const lerpRate = beatsPerTick / CFG.bpmLerpBeats;
        _currentClockBpm += (_targetClockBpm - _currentClockBpm) * Math.min(lerpRate, 1);
        updateMIDIClock(_currentClockBpm);
      }
    }
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
  updateSequencer(dt);
  renderFrame(now, dt);
}
