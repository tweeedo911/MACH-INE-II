// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Render Orchestrator
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { audio, getAudioGain } from './audio.js';
import { midi, noteName } from './midi.js';
import { state } from './state.js';
import { onMidiNote, onAudioOnset, updateEvents, eventCount } from './event-register.js';
import { initLayers, resizeLayers, updateLayers, clearAllLayers } from './layers.js';
import { updateColors, getPalette, getBgString } from './colors.js';
import { getDirector3Status, isDirector3Playing } from './director3.js';
import { worldState, phaseState } from './world-state.js';
import { renderField, updateWaves, addOnsetWave, addMidiNote } from './field.js';
import { getGeoStatus } from './geo.js';
import { recordSnapshot, recordPhaseCheck, isRecording } from './session-recorder.js';
import { firma, updateFirma } from './firma.js';

let canvas, ctx;
let W, H;
let globalTime = 0;
let lastOnset = false;
let hudMinimal, hudDebug, hudSeq;
let _seqAct, _seqFill, _seqStatus, _seqKeys;
let showHUD = true, showDebug = false;
let frameCount = 0;
let _projectorWin = null;

export function setProjectorWindow(win) { _projectorWin = win; }

export function initRender(cvs) {
  canvas = cvs;
  ctx = canvas.getContext('2d');
  resize();
  initLayers(W, H);
  window.addEventListener('resize', resize);
}

export function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  resizeLayers(W, H);
}

export function setHUDElements(minimal, debug, seq) {
  hudMinimal = minimal;
  hudDebug = debug;
  hudSeq = seq;
  if (hudSeq) {
    _seqAct    = hudSeq.querySelector('.seq-act');
    _seqFill   = hudSeq.querySelector('.seq-fill');
    _seqStatus = hudSeq.querySelector('.seq-status');
    _seqKeys   = hudSeq.querySelector('.seq-keys');
  }
}

export function getSize() { return { W, H }; }

// ── Main render frame ──
export function renderFrame(_now, dt) {
  globalTime += dt;
  frameCount++;

  // v3.4.1: firma update + vuotoTotale early-out (silenzio strutturale)
  updateFirma(globalTime);
  if (firma.vuotoTotale) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);
    return;  // skip everything: nessuna entità, nessun MIDI render, schermo nero
  }

  // v3.4.3: firma.densityCap gate. Durante gelo nessun evento nuovo entra,
  // durante opening ramp / closing fade gli eventi passano in modo
  // probabilistico (rinasce la funzione che era in generations.js birthRate).
  const acceptEvent = !firma.gelo && (firma.densityCap >= 1 || Math.random() < firma.densityCap);

  // Onset detection → LifecycleEvent + onset wave (for comp-* trails)
  if (audio.onset && !lastOnset && acceptEvent) {
    const cx = 0.5, cy = 0.5;
    onAudioOnset(cx, cy, globalTime);
    addOnsetWave(cx * W, cy * H, W, H);
  }
  lastOnset = audio.onset;

  // MIDI notes → LifecycleEvent (per-role lifecycle) + midi trail (comp-*)
  const notes = midi.newNotes;
  if (notes.length > CFG.maxMidiNotesPerFrame) {
    notes.sort((a, b) => b.vel - a.vel);
    notes.length = CFG.maxMidiNotesPerFrame;
  }
  for (const n of notes) {
    if (!acceptEvent) continue;
    // per-note probabilistic gate when densityCap < 1
    if (firma.densityCap < 1 && Math.random() >= firma.densityCap) continue;
    const noteNorm = n.note / 127;
    const velNorm = n.vel / 127;
    // nx = nota → X (grave sinistra, acuto destra), ny = nota → Y invertita (acuto = alto)
    onMidiNote(n.ch, noteNorm, velNorm, globalTime, noteNorm, 1 - noteNorm);
    addMidiNote(n.ch, noteNorm, velNorm);
  }
  midi.newNotes.length = 0;

  // Update systems
  updateColors(dt);
  updateEvents(dt);
  updateWaves(dt);
  updateLayers(dt);  // per-frame decay dei 4 layer (BG/MG/FG/Overlay)

  // Background — from current interpolated palette
  const bgStr = getBgString();
  ctx.fillStyle = bgStr;
  ctx.fillRect(0, 0, W, H);

  // Render composition
  renderField(ctx, W, H, {
    audio,
    midi,
    state,
    dt,
    globalTime,
  });

  // HUD
  if (frameCount % CFG.hudUpdateInterval === 0) {
    if (showHUD)   updateHUDMinimal();
    if (showDebug) { updateHUDDebug(); updateSeqPanel(); }
  }

  // Session recorder — pass full worldState snapshot for post-session review
  const _recState = {
    track: worldState.track,
    phase: worldState.phase,
    phaseProgress: phaseState.progress,
    bpm: worldState.bpm || 0,
    arc: worldState.arc,
    energy: worldState.energy,
    densityRhythm: worldState.density.rhythm,
    densityHarmony: worldState.density.harmony,
    densityBass: worldState.density.bass,
    densityMelody: worldState.density.melody,
    densityTexture: worldState.density.texture,
    audioEnergy: worldState.audioEnergy,
    ruptureStage: worldState.rupture.stage,
    ruptureT: worldState.rupture.t,
    firma: firma.gelo ? 'gelo' : firma.convergenza ? 'convergenza' : firma.vuotoTotale ? 'vuoto' : null,
  };
  recordSnapshot(_recState, [], dt * 1000);
  recordPhaseCheck(_recState);
}

// ── Keyboard ──
export function handleKey(code) {
  if (code === 'KeyH') {
    showHUD = !showHUD;
    if (hudMinimal) hudMinimal.style.display = showHUD ? 'block' : 'none';
  }
  if (code === 'KeyD') {
    showDebug = !showDebug;
    if (hudDebug) hudDebug.style.display = showDebug ? 'block' : 'none';
    if (hudSeq)   hudSeq.style.display   = showDebug ? 'block' : 'none';
  }
  if (code === 'KeyF') {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }
  if (code === 'KeyR') return 'REGEN';
  // v3.4.1: firma keybindings — gesti narrativi forti durante la live
  if (code === 'KeyG') { firma.gelo = !firma.gelo; console.log(`[FIRMA] gelo ${firma.gelo}`); }
  if (code === 'KeyV') { firma.vuotoTotale = !firma.vuotoTotale; console.log(`[FIRMA] vuotoTotale ${firma.vuotoTotale}`); }
  if (code === 'KeyJ') { firma.convergenza = !firma.convergenza; console.log(`[FIRMA] convergenza ${firma.convergenza}`); }
  // Campo Materiale — toggle paradigma sperimentale (Shift+C)
  // Gestito in main.js dove abbiamo accesso all'evento con shiftKey
}

// ── Visual paradigm label ──
function _visLabel() {
  if (CFG.VISUAL?.geo?.useGeo) return 'GEO';
  if (CFG.VISUAL?.campo?.useCampo) return 'CAMPO';
  return 'COMP';
}

// ── HUD Minimal ──
function updateHUDMinimal() {
  if (!hudMinimal) return;
  const evCount = eventCount();
  const d3 = getDirector3Status();
  const playing = isDirector3Playing();
  const icon = playing ? '▶' : '⏸';
  const min = Math.floor(d3.totalTime / 60);
  const sec = Math.floor(d3.totalTime % 60);
  const time = `${min}:${sec < 10 ? '0' : ''}${sec}`;
  const projActive = _projectorWin && !_projectorWin.closed;
  const vis = _visLabel();
  hudMinimal.textContent =
    `${icon} ${d3.track || '—'}  ${d3.phase}  ${time}` +
    (worldState.bpm ? `  ${worldState.bpm}BPM` : '') +
    `  ev:${evCount}` +
    (midi.connected ? `  MIDI:${midi.inputCount}` : '') +
    `  G:${getAudioGain().toFixed(1)}` +
    `  [${vis}]` +
    (projActive ? '  PROJ' : '') +
    (isRecording() ? '  ● REC' : '');
}

// ── Director panel ──
function updateSeqPanel() {
  if (!hudSeq) return;
  const d3 = getDirector3Status();
  const playing = isDirector3Playing();
  const pct = Math.round(phaseState.progress * 100);
  _seqAct.textContent    = d3.track || 'MACH:INE III';
  _seqFill.style.width   = `${pct}%`;
  _seqStatus.textContent = `${playing ? '▶' : '⏸'}  ${d3.phase}  ${pct}%  arc:${d3.arc.toFixed(2)}`;
}

// ── HUD Debug ──
function bar(val, len = 12) {
  const filled = Math.round(val * len);
  return '\u2588'.repeat(filled) + '\u2591'.repeat(len - filled);
}

function updateHUDDebug() {
  if (!hudDebug) return;
  const d3 = getDirector3Status();
  const ws = worldState;
  const trajArrow = audio.trajectory > 0 ? '\u2191' : audio.trajectory < 0 ? '\u2193' : '\u2192';
  const lastNote = midi.lastNote ? `${noteName(midi.lastNote.note)} V${midi.lastNote.vel} CH${midi.lastNote.ch}` : '——';

  const elapsed = Math.floor(d3.totalTime);
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  const playing = isDirector3Playing();
  const vis = _visLabel();

  // Rupture stato
  const rup = ws.rupture;
  const rupStr = rup.stage
    ? `${rup.stage.toUpperCase()} ${bar(rup.intensity)} ${(rup.intensity * 100).toFixed(0)}%`
    : '——';

  // audioEnergy (il valore che pilota il campo)
  const ae = ws.audioEnergy || 0;

  hudDebug.textContent =
    `══ DIRECTOR ══\n` +
    `${playing ? '▶' : '⏸'}  ${d3.track}  ${d3.phase}  ${min}:${sec < 10 ? '0' : ''}${sec}` +
    (ws.bpm ? `  ${ws.bpm}BPM` : '') + `\n` +
    `ARC   ${bar(d3.arc)}  ${(d3.arc * 100).toFixed(1)}%\n` +
    `PHASE ${bar(phaseState.progress)}  bar ${Math.floor(phaseState.elapsed)}/${Math.floor(phaseState.duration)}\n` +
    `RUPTURE  ${rupStr}\n` +
    `\n` +

    `══ AUDIO ══\n` +
    `RMS     ${bar(audio.rms, 20)}  ${(audio.rms * 100).toFixed(0)}%\n` +
    `ENERGY  ${bar(ae, 20)}  ${(ae * 100).toFixed(0)}%\n` +
    `FLUX    ${bar(audio.flux * 5, 20)}  ${audio.onset ? 'ONSET' : ''}` +
    `  TRAJ ${trajArrow}  GAIN ${getAudioGain().toFixed(1)}\n` +
    `SUB ${bar(audio.bands.sub.L, 8)}  LOW ${bar(audio.bands.low.L, 8)}  MID ${bar(audio.bands.mid.L, 8)}  HI ${bar(audio.bands.high.L, 8)}\n` +
    `\n` +

    `══ MIDI ══\n` +
    `${midi.connected ? 'ON ' + midi.inputCount + ' in' : 'OFF'}  ${lastNote}\n` +
    `\n` +

    `══ VISUAL [${vis}] ══\n` +
    `DENSITY  R:${ws.density.rhythm.toFixed(2)} H:${ws.density.harmony.toFixed(2)} B:${ws.density.bass.toFixed(2)} M:${ws.density.melody.toFixed(2)} T:${ws.density.texture.toFixed(2)}\n` +
    `FIRMA    ${firma.gelo ? 'GELO' : ''}${firma.convergenza ? ' CONV' : ''}${firma.vuotoTotale ? ' VUOTO' : ''}${firma.densityCap < 1 ? ' CAP:' + firma.densityCap.toFixed(2) : ''}` +
    `${!firma.gelo && !firma.convergenza && !firma.vuotoTotale && firma.densityCap >= 1 ? '——' : ''}\n` +
    `EV ${eventCount()}\n` +
    `\n` +

    `══ COMANDI ══\n` +
    `SPAZIO play/pausa   Shift+1-7 traccia   1-5 fase   ←/→ fase\n` +
    `Shift+C campo   Shift+G geo   G gelo   J conv   V vuoto\n` +
    `H hud   D debug   F full   P proiettore   [/] gain\n` +
    `Shift+L rec   Shift+D download   Shift+K screenshot\n`;
}
