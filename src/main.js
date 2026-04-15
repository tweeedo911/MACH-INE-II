// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Boot & Module Wiring
//  Versione: vedi src/VERSION.js (APP_VERSION)
// ═══════════════════════════════════════════════════════════

import { APP_VERSION } from './VERSION.js';
import { CFG } from './config.js';
import { initAudio, updateAudio, setAudioGain, getAudioGain } from './audio.js';
import { initMIDI, updateMIDI, sendMIDIStart, sendMIDIStop, updateMIDIClock, sendMIDIAllNotesOff } from './midi.js';
import { state, updateState } from './state.js';
import { initRender, renderFrame, resize, setHUDElements, handleKey, setProjectorWindow } from './render.js';
import { resetEvents } from './event-register.js';
import { clearAllLayers } from './layers.js';
import { snapPalette } from './colors.js';
import { WakeLockManager } from './wake-lock.js';
// V3.9: palette unificata — import setPaletteMode/getPaletteMode rimosso
import { setBiome } from './campo.js';
import { initCamera, updateCamera } from './camera.js';

// ── MACH:INE III modules ──
import { worldState } from './world-state.js';
import { initDirector3, updateDirector3, skipPhase, jumpToPhase, jumpToTrack, toggleDirector3, isDirector3Playing, getDirector3Status, launchEncore, switchEncoreScale } from './director3.js';
import { initRhythm, updateRhythm } from './rhythm.js';
import { initHarmony, updateHarmony } from './harmony.js';
import { initBass as initBassV1, updateBass as updateBassV1 } from './bass.js';
import { initBass as initBassV2, updateBass as updateBassV2 } from './bass-v2.js';
import { initBass as initBassV3, updateBass as updateBassV3 } from './bass-v3.js';
import { initMelody as initMelodyV1, updateMelody as updateMelodyV1 } from './melody.js';
import { initMelody as initMelodyV2, updateMelody as updateMelodyV2 } from './melody-v2.js';
import { initMelody as initMelodyV3, updateMelody as updateMelodyV3 } from './melody-v3.js';
import { initTexture, updateTexture } from './texture.js';

// ── A/B/C selector — STRUCTURAL takes priority over EXPERIMENT for bass/melody ──
const initBass = (...a) => {
  if (CFG.MUSIC_STRUCTURAL) return initBassV3(...a);
  if (CFG.MUSIC_EXPERIMENT) return initBassV2(...a);
  return initBassV1(...a);
};
const updateBass = (...a) => {
  if (CFG.MUSIC_STRUCTURAL) return updateBassV3(...a);
  if (CFG.MUSIC_EXPERIMENT) return updateBassV2(...a);
  return updateBassV1(...a);
};
const initMelody = (...a) => {
  if (CFG.MUSIC_STRUCTURAL) return initMelodyV3(...a);
  if (CFG.MUSIC_EXPERIMENT) return initMelodyV2(...a);
  return initMelodyV1(...a);
};
const updateMelody = (...a) => {
  if (CFG.MUSIC_STRUCTURAL) return updateMelodyV3(...a);
  if (CFG.MUSIC_EXPERIMENT) return updateMelodyV2(...a);
  return updateMelodyV1(...a);
};

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

// ── A/B/C indicator badge (bottom-right, minimal — shows v2 + v3 flags) ──
const abBadge = document.createElement('div');
abBadge.id = 'ab-badge';
abBadge.style.cssText = 'position:fixed;bottom:8px;right:8px;font:10px monospace;padding:3px 6px;border-radius:2px;pointer-events:none;z-index:9999;letter-spacing:0.5px;display:flex;gap:4px;';
document.body.appendChild(abBadge);

const _badgeM = document.createElement('span');
const _badgeN = document.createElement('span');
_badgeM.style.cssText = 'padding:1px 4px;border-radius:2px;';
_badgeN.style.cssText = 'padding:1px 4px;border-radius:2px;';
abBadge.appendChild(_badgeM);
abBadge.appendChild(_badgeN);

function _refreshAbBadge() {
  // badge dinamico da VERSION.js
  _badgeM.textContent = APP_VERSION;
  _badgeM.style.background = '#CDD71D';
  _badgeM.style.color = '#000';
  _badgeN.textContent = '';
  _badgeN.style.background = 'transparent';
}
_refreshAbBadge();

// ── Keep layout in sync ──
window.addEventListener('resize', resize);

// ── Cleanup MIDI on page close (prevent hanging notes on external synths) ──
window.addEventListener('beforeunload', () => {
  sendMIDIAllNotesOff();
  sendMIDIStop();
});

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
    projectorWindow = window.open('projector.html', 'projector',
      `width=${screen.width},height=${screen.height},left=0,top=0`);
    setProjectorWindow(projectorWindow);
  }
}

// ── Boot on click ──
let running = false;
let lastTime = 0;
let _clockStarted = false;
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

  // ── MACH:INE III composition system ──
  // initDirector3 chiama internamente initRhythm/Harmony/Bass/Melody/Texture
  initDirector3('NEBBIA');
  initCamera();
  snapPalette();
  console.log('[III] Director + 5 modules initialized');

  startScreen.style.display = 'none';
  hudMinimal.style.display = 'block';

  running = true;
  lastTime = 0;
  await _wakeLock.acquire();
  requestAnimationFrame(loop);
});

// ── Keyboard ──
document.addEventListener('keydown', (e) => {
  if (!running) return;

  // Gain audio input — BracketLeft=è (diminuisce) / BracketRight=+ (aumenta)
  if (e.code === 'BracketLeft')  { e.preventDefault(); setAudioGain(getAudioGain() - CFG.audioInputGainStep); return; }
  if (e.code === 'BracketRight') { e.preventDefault(); setAudioGain(getAudioGain() + CFG.audioInputGainStep); return; }

  // ── ENCORE launcher (E key) ──
  if (e.code === 'KeyE' && !e.shiftKey) {
    e.preventDefault();
    launchEncore();
    initCamera();
    // Start MIDI clock if not already running (normally started by Space)
    if (!_clockStarted) { sendMIDIStart(); startMidiClock(); _clockStarted = true; }
    return;
  }

  // ── ENCORE scale switch (Q/W/R) — only during encore ──
  if (worldState.encoreMode) {
    if (e.code === 'KeyQ') { switchEncoreScale('halfWhole'); return; }
    if (e.code === 'KeyW') { switchEncoreScale('wholeHalf'); return; }
    if (e.code === 'KeyR') { switchEncoreScale('prometheus'); return; }
  }

  // Tasti 1-5: jump tra le 5 fasi compositive
  // Shift+1-7: jump to track (album order)
  const _trackMap = { Digit1: 'NEBBIA', Digit2: 'TESSUTO', Digit3: 'SOLCO', Digit4: 'RESPIRO', Digit5: 'MACCHINA', Digit6: 'TEMPESTA', Digit7: 'RITORNO' };
  if (_trackMap[e.code] && e.shiftKey) {
    if (worldState.encoreMode) return;  // no track jumping during encore
    jumpToTrack(_trackMap[e.code]);
    initCamera();
    return;
  }
  // 1-5 without shift: jump to phase within current track
  const _phaseMap = { Digit1: 'germoglio', Digit2: 'pulsazione', Digit3: 'densita', Digit4: 'rottura', Digit5: 'dissoluzione' };
  if (_phaseMap[e.code] && !e.shiftKey) {
    jumpToPhase(_phaseMap[e.code]);
    return;
  }
  if (e.code === 'Space') {
    e.preventDefault();
    const nowPlaying = toggleDirector3();
    if (nowPlaying && !_clockStarted) { sendMIDIStart(); startMidiClock(); _clockStarted = true; }
    return;
  }
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

  // ── Campo Materiale toggle (Shift+C) — paradigma sperimentale ──
  if (e.code === 'KeyC' && e.shiftKey) {
    e.preventDefault();
    CFG.VISUAL.campo.useCampo = !CFG.VISUAL.campo.useCampo;
    if (CFG.VISUAL.campo.useCampo) CFG.VISUAL.geo.useGeo = false;  // mutex
    console.log(`%c[CAMPO] useCampo = ${CFG.VISUAL.campo.useCampo ? 'ON' : 'OFF'}`,
                `color: ${CFG.VISUAL.campo.useCampo ? '#D5FF57' : '#888'}; font-weight: bold;`);
    return;
  }

  // ── Sistema Geometrico toggle (Shift+G) — paradigma sperimentale ──
  if (e.code === 'KeyG' && e.shiftKey) {
    e.preventDefault();
    CFG.VISUAL.geo.useGeo = !CFG.VISUAL.geo.useGeo;
    if (CFG.VISUAL.geo.useGeo) CFG.VISUAL.campo.useCampo = false;  // mutex
    console.log(`%c[GEO] useGeo = ${CFG.VISUAL.geo.useGeo ? 'ON' : 'OFF'}`,
                `color: ${CFG.VISUAL.geo.useGeo ? '#E8F0D8' : '#888'}; font-weight: bold;`);
    return;
  }

  // M/N toggle rimossi — V3.5: M+N consolidati come default permanente

  // V3.9: palette unificata — toggle A/B rimosso

  // Toggle version badge with HUD (H key)
  if (e.code === 'KeyH') {
    const vis = abBadge.style.display === 'none' ? 'flex' : 'none';
    abBadge.style.display = vis;
  }

  const result = handleKey(e.code);
  if (result === 'REGEN') {
    resetEvents();
    clearAllLayers();
  }
});

// ── MIDI clock — Web Worker (non throttolato quando il browser perde focus) ──
const midiWorker = new Worker('./src/midi-clock.worker.js');

let _workerLagMax = 0;
let _workerLagSum = 0;
let _workerLagN   = 0;
midiWorker.onmessage = ({ data: { dt, now: workerNow } }) => {
  try {
    if (!running) return;

    // Latenza worker→main: quanto tempo il messaggio ha atteso nella coda
    const lag = (performance.now() - workerNow) / 1000; // secondi
    if (lag > _workerLagMax) _workerLagMax = lag;
    _workerLagSum += lag;
    _workerLagN++;
    // Log ogni 2000 messaggi (~4s): se avg>5ms o max>20ms c'è starvation
    if (_workerLagN >= 2000) {
      const avg = (_workerLagSum / _workerLagN * 1000).toFixed(1);
      const max = (_workerLagMax * 1000).toFixed(1);
      if (_workerLagMax > 0.020) console.warn(`[CLOCK LAG] avg=${avg}ms max=${max}ms — main thread saturo`);
      _workerLagMax = 0; _workerLagSum = 0; _workerLagN = 0;
    }

    // Director reads clock → updates worldState
    updateDirector3(dt);

    // 5 modules read worldState → generate MIDI
    updateRhythm(dt);
    updateHarmony(dt);
    updateBass(dt);
    updateMelody(dt);
    updateTexture(dt);

    // MIDI clock sync — fallback 60 BPM per NEBBIA (Ableton riceve sempre clock)
    updateMIDIClock(worldState.bpm || 60);
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
  updateCamera(dt);
  renderFrame(now, dt);
}
