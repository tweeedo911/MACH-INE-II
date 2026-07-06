// ═══════════════════════════════════════════════════════════════════
//  MACH:INE III — Offline Visual Driver
//  Gira il visual engine REALE (render.js + campo + comp-* + camera) a
//  timestep fisso, headless via Playwright. NON modifica main.js/render.js
//  (aree protette): rispecchia il wiring di main.js in modalità "step".
//  Espone window.__renderStep(dt) e window.__simInfo() per Playwright.
//
//  Sync audio: opzionale. Se window.__energyEnvelope è settato (array per-frame
//  di {rms,onset,sub,low,mid,high}), inietta in `audio` prima di ogni frame, così
//  i visual reagiscono all'audio renderizzato. Altrimenti audio=0 (visual guidati
//  comunque dall'arco worldState fasi/densità).
//  Import con path assoluti (root server = app/).
// ═══════════════════════════════════════════════════════════════════

import { CFG } from '/src/config.js';
import { initRender, renderFrame } from '/src/render.js';
import { initDirector3, updateDirector3, toggleDirector3, isDirector3Playing, jumpToTrack, jumpToPhase } from '/src/director3.js';
import { updateRhythm } from '/src/rhythm.js';
import { updateHarmony } from '/src/harmony.js';
import { updateBass } from '/src/bass-v3.js';
import { updateMelody } from '/src/melody-v3.js';
import { updateTexture } from '/src/texture.js';
import { updateState } from '/src/state.js';
import { initCamera, updateCamera } from '/src/camera.js';
import { snapPalette } from '/src/colors.js';
import { worldState } from '/src/world-state.js';
import { audio } from '/src/audio.js';

const params = new URLSearchParams(location.search);
const FPS = Number(params.get('fps') || 30);
const DT = 1 / FPS;

// Campo Materiale ON (paradigma definitivo) — come da live
if (CFG.VISUAL?.campo) CFG.VISUAL.campo.useCampo = true;
if (CFG.VISUAL?.geo) CFG.VISUAL.geo.useGeo = false;

// canvas a risoluzione interna fissa (1920×1080); render.js la imposta
let canvas = document.getElementById('c');
if (!canvas) { canvas = document.createElement('canvas'); canvas.id = 'c'; document.body.appendChild(canvas); }

initRender(canvas);
initDirector3('NEBBIA');   // inizializza internamente i 5 moduli
initCamera();
snapPalette();
toggleDirector3();          // start (sblocca il director)

// proof/debug: ?jump=BIOMA salta a un bioma per ispezione veloce
const _jump = params.get('jump');
if (_jump) { jumpToTrack(_jump); initCamera(); snapPalette(); }
const _phase = params.get('phase');
if (_phase) { jumpToPhase(_phase); }

let simT = 0;
let frame = 0;
let _now = 0;

// inietta energia audio per-frame se fornita (sync col WAV renderizzato)
function _injectAudio() {
  const env = window.__energyEnvelope;
  if (!env || frame >= env.length) return;
  const e = env[frame];
  if (!e) return;
  audio.rms = e.rms || 0;
  audio.onset = !!e.onset;
  if (audio.bands) {
    audio.bands.sub.L = audio.bands.sub.R = e.sub || 0;
    audio.bands.low.L = audio.bands.low.R = e.low || 0;
    audio.bands.mid.L = audio.bands.mid.R = e.mid || 0;
    audio.bands.high.L = audio.bands.high.R = e.high || 0;
  }
}

// un passo di simulazione + render. Ritorna info di stato.
window.__renderStep = function () {
  _injectAudio();
  updateDirector3(DT);
  updateRhythm(DT); updateHarmony(DT); updateBass(DT); updateMelody(DT); updateTexture(DT);
  updateState(DT);
  updateCamera(DT);
  _now += DT * 1000;
  renderFrame(_now, DT);
  simT += DT;
  frame++;
  return { frame, t: simT, track: worldState.track, phase: worldState.phase, playing: isDirector3Playing() };
};

window.__simInfo = () => ({ frame, t: simT, track: worldState.track, phase: worldState.phase, playing: isDirector3Playing(), fps: FPS });
window.__canvasDataURL = (type, q) => canvas.toDataURL(type || 'image/png', q);
window.__ready = true;
console.log('[offline-driver] ready — FPS', FPS, 'canvas', canvas.width, 'x', canvas.height);
