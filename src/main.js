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
import { setBiome, clearAll as clearCampo } from './campo.js';
import { initCamera, updateCamera } from './camera.js';
import { SeededRNG } from './perf-utils.js';
import { toggleSoundcheck, updateSoundcheck, isSoundcheckActive, stopSoundcheck } from './soundcheck.js';

// D5: ?seed=N URL param → window._seededRNG (opt-in, no Math.random monkey-patch).
// Future modules can check `if (window._seededRNG) …` to use deterministic RNG.
const _seedParam = new URLSearchParams(location.search).get('seed');
if (_seedParam !== null) {
  const parsed = parseInt(_seedParam, 10);
  const seed = isNaN(parsed) ? Date.now() : parsed;
  window._seededRNG = new SeededRNG(seed);
  console.log(`[SEED] Using seeded RNG with seed=${seed}`);
}

// ── MACH:INE III modules ──
import { worldState } from './world-state.js';
import { initDirector3, updateDirector3, skipPhase, jumpToPhase, jumpToTrack, toggleDirector3, isDirector3Playing, getDirector3Status, launchEncore, switchEncoreScale, setRitornoVariant, startPreSuite, endPreSuite, resetDramaturgyState, reapplyRootOffset } from './director3.js';
import { initRhythm, updateRhythm } from './rhythm.js';
import { initHarmony, updateHarmony } from './harmony.js';
import { initBass as initBassV1, updateBass as updateBassV1 } from './bass.js';
import { initBass as initBassV2, updateBass as updateBassV2 } from './bass-v2.js';
import { initBass as initBassV3, updateBass as updateBassV3 } from './bass-v3.js';
import { initMelody as initMelodyV1, updateMelody as updateMelodyV1 } from './melody.js';
import { initMelody as initMelodyV2, updateMelody as updateMelodyV2 } from './melody-v2.js';
import { initMelody as initMelodyV3, updateMelody as updateMelodyV3 } from './melody-v3.js';
import { initTexture, updateTexture } from './texture.js';

// ── Modalità LOW per hardware lento: ?low nell'URL ──
if (location.search.includes('low')) {
  CFG.VISUAL.campo.cellsX = 64;
  CFG.VISUAL.campo.cellsY = 36;
  console.log('[III] LOW mode: griglia 64×36');
}

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
const hudNavigator = document.getElementById('navigator');
const hudDebug     = document.getElementById('hud-debug');
const hotkeysPanel = document.getElementById('hotkeys');

// ── Init render ──
initRender(canvas);
setHUDElements(hudNavigator, hudDebug, hotkeysPanel);
initRecorder(canvas);

// Version badge rimosso: la versione è visibile sulla start screen + dentro Navigator.

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

  // ── Wave 2C: Pre-suite auto-start via ?presuite URL param ──
  // Baseline invariato: senza il param, flow identico. Con ?presuite parte il drone
  // C2 a velocity 25 e si attende tasto 0 o timeout 90s prima di entrare in NEBBIA.
  if (location.search.includes('presuite')) {
    startPreSuite();
    setPreSuiteHud(true);
    // Anche il MIDI clock deve partire per il drone
    if (!_clockStarted) { sendMIDIStart(); startMidiClock(); _clockStarted = true; }
  }

  startScreen.style.display = 'none';
  if (hudNavigator) hudNavigator.style.display = 'block';
  if (hotkeysPanel) hotkeysPanel.style.display = 'block';

  running = true;
  lastTime = 0;
  await _wakeLock.acquire();
  requestAnimationFrame(loop);
});

// ── HUD gesture flash (Wave 2C) ──
// Overlay minimo in alto a destra per feedback hotkey performer.
const _gestureHud = document.createElement('div');
_gestureHud.id = 'hud-gesture';
_gestureHud.style.cssText = 'position:fixed;top:8px;right:8px;font:11px monospace;padding:4px 8px;border-radius:2px;pointer-events:none;z-index:9999;letter-spacing:0.5px;background:rgba(0,0,0,0.6);color:#CDD71D;display:none;';
document.body.appendChild(_gestureHud);
let _gestureHudTimer = null;
function flashGesture(msg, persistent = false) {
  _gestureHud.textContent = msg;
  _gestureHud.style.display = 'block';
  if (_gestureHudTimer) clearTimeout(_gestureHudTimer);
  if (!persistent) {
    _gestureHudTimer = setTimeout(() => {
      _gestureHud.style.display = 'none';
      _gestureHudTimer = null;
    }, CFG.HUD_GESTURE_FLASH_MS || 1000);
  }
}

// ── Pre-suite HUD overlay (basso centro, discreto) ──
const _preSuiteHud = document.createElement('div');
_preSuiteHud.id = 'hud-presuite';
_preSuiteHud.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);font:11px monospace;padding:4px 10px;border-radius:2px;pointer-events:none;z-index:9998;letter-spacing:0.8px;color:#fff;opacity:0.3;display:none;';
_preSuiteHud.textContent = 'PRE-SUITE (press 0 to start)';
document.body.appendChild(_preSuiteHud);
function setPreSuiteHud(visible) {
  _preSuiteHud.style.display = visible ? 'block' : 'none';
}

// ── Keyboard ──
document.addEventListener('keydown', (e) => {
  if (!running) return;

  // Gain audio input — BracketLeft=è (diminuisce) / BracketRight=+ (aumenta)
  if (e.code === 'BracketLeft')  { e.preventDefault(); setAudioGain(getAudioGain() - CFG.audioInputGainStep); return; }
  if (e.code === 'BracketRight') { e.preventDefault(); setAudioGain(getAudioGain() + CFG.audioInputGainStep); return; }

  // ── Wave 2C: Nodo ternario TEMPESTA→RITORNO (tasti 1/2/3 durante TEMPESTA) ──
  // Si attiva SOLO durante la traccia TEMPESTA nelle fasi densita/rottura/dissoluzione,
  // e SOLO se non stiamo facendo jumpToTrack (no shift, no ctrl).
  if (!e.shiftKey && !e.ctrlKey && worldState.track === 'TEMPESTA' && !worldState.encoreMode) {
    const phase = worldState.phase;
    const tempestaWindow = phase === 'densita' || phase === 'rottura' || phase === 'dissoluzione';
    if (tempestaWindow && (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3')) {
      e.preventDefault();
      const map = { Digit1: 'default', Digit2: 'phrygianHold', Digit3: 'silenceThenAeolian' };
      const labels = { default: 'default', phrygianHold: 'phrygian hold', silenceThenAeolian: 'silence→aeolian' };
      const variant = map[e.code];
      setRitornoVariant(variant);
      flashGesture(`RITORNO: ${labels[variant]}`, true);
      // Tieni il feedback visibile finché TEMPESTA dura
      setTimeout(() => {
        if (worldState.track !== 'TEMPESTA') {
          _gestureHud.style.display = 'none';
        }
      }, 5000);
      return;
    }
  }

  // ── Wave 2C: Pre-suite skip (tasto 0) ──
  if (e.code === 'Digit0' && !e.shiftKey && !e.ctrlKey && worldState.preSuiteActive) {
    e.preventDefault();
    endPreSuite();
    setPreSuiteHud(false);
    flashGesture('PRE-SUITE END → NEBBIA');
    return;
  }
  // ── Wave 2C: Pre-suite manual start (Shift+0) ──
  // Utile se non hai avviato col param ?presuite. Attiva solo se suite non è già partita.
  if (e.code === 'Digit0' && e.shiftKey && !worldState.preSuiteActive && !isDirector3Playing()) {
    e.preventDefault();
    startPreSuite();
    setPreSuiteHud(true);
    if (!_clockStarted) { sendMIDIStart(); startMidiClock(); _clockStarted = true; }
    flashGesture('PRE-SUITE START');
    return;
  }

  // ── Wave 2C: Octave transpose (ArrowLeft/Right) ──
  // Nota: sostituisce il vecchio skipPhase su arrow (spostato su Comma/Period).
  if (e.code === 'ArrowLeft' && !e.shiftKey) {
    e.preventDefault();
    const step = CFG.OCTAVE_OFFSET_STEP || 12;
    worldState.rootOffset = Math.max(-24, (worldState.rootOffset || 0) - step);
    reapplyRootOffset();  // propaga a scale+root → TUTTI i moduli
    sendMIDIAllNotesOff();  // evita note appese dal registro precedente
    const oct = Math.round(worldState.rootOffset / 12);
    flashGesture(`OCTAVE ${oct >= 0 ? '+' : ''}${oct}`);
    return;
  }
  if (e.code === 'ArrowRight' && !e.shiftKey) {
    e.preventDefault();
    const step = CFG.OCTAVE_OFFSET_STEP || 12;
    worldState.rootOffset = Math.min(24, (worldState.rootOffset || 0) + step);
    reapplyRootOffset();
    sendMIDIAllNotesOff();
    const oct = Math.round(worldState.rootOffset / 12);
    flashGesture(`OCTAVE ${oct >= 0 ? '+' : ''}${oct}`);
    return;
  }

  // ── Wave 2C: Density multiplier (ArrowUp/Down) ──
  if (e.code === 'ArrowUp' && !e.shiftKey) {
    e.preventDefault();
    const step = CFG.DENSITY_MULT_STEP || 0.1;
    worldState.densityMultiplier = Math.min(CFG.DENSITY_MULT_MAX || 2.0,
                                            (worldState.densityMultiplier || 1.0) + step);
    flashGesture(`DENSITY ${Math.round(worldState.densityMultiplier * 100)}%`);
    return;
  }
  if (e.code === 'ArrowDown' && !e.shiftKey) {
    e.preventDefault();
    const step = CFG.DENSITY_MULT_STEP || 0.1;
    worldState.densityMultiplier = Math.max(CFG.DENSITY_MULT_MIN || 0.3,
                                            (worldState.densityMultiplier || 1.0) - step);
    flashGesture(`DENSITY ${Math.round(worldState.densityMultiplier * 100)}%`);
    return;
  }

  // ── Wave 2C: Melody mute (M) / Bass mute (N) per N bar ──
  if (e.code === 'KeyM' && !e.shiftKey && !e.ctrlKey) {
    e.preventDefault();
    const bars = CFG.MELODY_MUTE_BARS || 8;
    worldState.meloMuteBars = bars;
    flashGesture(`MELODY MUTE ${bars}BAR`);
    return;
  }
  if (e.code === 'KeyN' && !e.shiftKey && !e.ctrlKey) {
    e.preventDefault();
    const bars = CFG.BASS_MUTE_BARS || 8;
    worldState.bassMuteBars = bars;
    flashGesture(`BASS MUTE ${bars}BAR`);
    return;
  }

  // ── skipPhase legacy: rimappato da Arrow a Comma/Period (frame-step convention) ──
  if (e.code === 'Comma'  && !e.shiftKey) { e.preventDefault(); skipPhase(-1); return; }
  if (e.code === 'Period' && !e.shiftKey) { e.preventDefault(); skipPhase(+1); return; }

  // ── ENCORE launcher (E key) ──
  if (e.code === 'KeyE' && !e.shiftKey) {
    e.preventDefault();
    launchEncore();
    initCamera();
    // Start MIDI clock if not already running (normally started by Space)
    if (!_clockStarted) { sendMIDIStart(); startMidiClock(); _clockStarted = true; }
    return;
  }

  // ── SOUNDCHECK toggle (T key) — loop 4 bar D dorian 90 BPM, tutti gli 8 canali ──
  if (e.code === 'KeyT' && !e.shiftKey) {
    e.preventDefault();
    // Se il director è in play, mettilo in pausa prima di avviare il loop (evita overlap)
    if (!isSoundcheckActive() && isDirector3Playing()) toggleDirector3();
    // Start MIDI clock se non già partito
    if (!_clockStarted) { sendMIDIStart(); startMidiClock(); _clockStarted = true; }
    toggleSoundcheck();
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
  // (ArrowLeft/Right rimappati su octave transpose sopra — skipPhase su Comma/Period)
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

  // H è alias di K (toggle Navigator + Hotkeys) — gestito in render.handleKey
  const result = handleKey(e.code);
  if (result === 'REGEN') {
    resetEvents();
    clearAllLayers();
  }
});

// ── MIDI clock — Web Worker (non throttolato quando il browser perde focus) ──
// Sessione 27: worker manda solo performance.now() (primitivo, zero alloc).
// dt viene calcolato qui come differenza tra tick consecutivi, capped a 50ms.
const midiWorker = new Worker('./src/midi-clock.worker.js');

let _prevWorkerNow = 0;
let _workerLagMax = 0;
let _workerLagSum = 0;
let _workerLagN   = 0;
midiWorker.onmessage = ({ data: workerNow }) => {
  try {
    if (!running) return;

    // dt dal delta tra tick consecutivi del worker (absolute time compensa drift)
    const dt = _prevWorkerNow ? Math.min((workerNow - _prevWorkerNow) / 1000, 0.05) : 0;
    _prevWorkerNow = workerNow;

    // Latenza worker→main: quanto tempo il messaggio ha atteso nella coda
    const lag = (performance.now() - workerNow) / 1000; // secondi
    if (lag > _workerLagMax) _workerLagMax = lag;
    _workerLagSum += lag;
    _workerLagN++;
    // Log ogni ~4s (~800 tick a 5ms): se avg>5ms o max>20ms c'è starvation
    if (_workerLagN >= 800) {
      const avg = (_workerLagSum / _workerLagN * 1000).toFixed(1);
      const max = (_workerLagMax * 1000).toFixed(1);
      if (_workerLagMax > 0.020) console.warn(`[CLOCK LAG] avg=${avg}ms max=${max}ms — main thread saturo`);
      _workerLagMax = 0; _workerLagSum = 0; _workerLagN = 0;
    }

    if (dt === 0) return;  // primo tick, skip update

    // Soundcheck loop: autonomo, scrive MIDI direttamente.
    // Quando attivo blocca il director (il tasto T è un toggle esclusivo).
    if (isSoundcheckActive()) {
      updateSoundcheck(dt);
      updateMIDIClock(worldState.bpm || 90);
      return;
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

  // D2: tab-hidden guard. When the tab is in the background, browsers already
  // throttle rAF to ~1Hz — but skipping updateAudio/MIDI/render is more explicit
  // and avoids wasteful partial-frame work. Re-schedule so we pick up when the
  // tab regains focus (rAF keeps firing occasionally even while hidden).
  if (document.hidden) {
    if (running) requestAnimationFrame(loop);
    return;
  }

  requestAnimationFrame(loop);

  const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
  lastTime = now;

  updateAudio();
  updateMIDI();
  updateState();
  updateCamera(dt);
  renderFrame(now, dt);
}

// ── D2: AudioContext auto-resume on focus / visibility change ──
// Chrome suspends AudioContexts when the tab stays hidden long enough; without
// this the whole suite is silent when the user returns.
window.addEventListener('focus', () => {
  if (window.audioCtx && window.audioCtx.state === 'suspended') {
    window.audioCtx.resume().then(() => console.log('[AUDIO] resumed on focus'))
                            .catch(() => {});
  }
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && running && window.audioCtx && window.audioCtx.state === 'suspended') {
    window.audioCtx.resume().catch(() => {});
  }
});

// ── D3-HUD: banner warnings (bottom-right) driven by midi/audio events ──
// The #hud-warnings div is declared in index.html so it always exists by the
// time these listeners run (we never dispatch before boot, but we guard anyway).
const _hudState = { midi: false, audio: false };
function _updateHud() {
  const el = document.getElementById('hud-warnings');
  if (!el) return;
  const msgs = [];
  if (_hudState.midi)  msgs.push('MIDI: no output');
  if (_hudState.audio) msgs.push('AUDIO: off');
  if (msgs.length === 0) {
    el.textContent = '';
    el.style.display = 'none';
  } else {
    el.textContent = msgs.join(' | ');
    el.style.display = 'block';
    el.style.color = '#f80';
  }
}
window.addEventListener('midi-unavailable',  () => { _hudState.midi  = true;  _updateHud(); });
window.addEventListener('midi-available',    () => { _hudState.midi  = false; _updateHud(); });
window.addEventListener('audio-unavailable', () => { _hudState.audio = true;  _updateHud(); });
window.addEventListener('audio-available',   () => { _hudState.audio = false; _updateHud(); });

// ── D4: Shift+Z panic / nuclear reset ──
// All-notes-off on every channel, clear visual field, zero all density counters,
// flash HUD banner. Everything wrapped in try/catch so a single broken subsystem
// can't prevent the rest of the reset.
document.addEventListener('keydown', (e) => {
  if (!running) return;
  if (e.code !== 'KeyZ' || !e.shiftKey) return;
  e.preventDefault();
  console.log('[PANIC] Nuclear reset triggered');
  try {
    // sendMIDIAllNotesOff() already broadcasts CC123 on all channels internally.
    try { sendMIDIAllNotesOff(); } catch (_) {}
    try { if (typeof clearCampo === 'function') clearCampo(); } catch (_) {}
    try {
      if (worldState && worldState.density) {
        for (const k in worldState.density) worldState.density[k] = 0;
      }
    } catch (_) {}
    // Wave 2C: azzera stati drammaturgia (octave, density mult, mute, variante RITORNO, pre-suite)
    try { resetDramaturgyState(); } catch (_) {}
    try { setPreSuiteHud(false); _gestureHud.style.display = 'none'; } catch (_) {}
    const hud = document.getElementById('hud-warnings');
    if (hud) {
      const prevText = hud.textContent;
      const prevColor = hud.style.color;
      const prevDisplay = hud.style.display;
      hud.textContent = 'PANIC RESET';
      hud.style.color = '#f00';
      hud.style.display = 'block';
      setTimeout(() => {
        hud.textContent = prevText;
        hud.style.color = prevColor || '#f80';
        hud.style.display = prevDisplay || (prevText ? 'block' : 'none');
        _updateHud();  // re-derive from state in case it changed during flash
      }, CFG.RUNTIME_PANIC_HUD_MS || 2000);
    }
  } catch (err) {
    console.error('[PANIC] partial reset:', err);
  }
});
