// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Render Orchestrator
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { audio, getAudioGain } from './audio.js';
import { midi, noteName } from './midi.js';
import { state } from './state.js';
import { dna, updatePrimitives } from './dna.js';
import { entities, fossils, updateGenerations, buildEntityGrid, triggerOnset, triggerMIDI } from './generations.js';
import { updateColors, getPalette, getBgString } from './colors.js';
import { getDirector3Status, isDirector3Playing } from './director3.js';
import { worldState, phaseState } from './world-state.js';
import { renderField, updateWaves, addOnsetWave, addMidiNote } from './field.js';
import { recordSnapshot, recordPhaseCheck, isRecording } from './session-recorder.js';

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
  window.addEventListener('resize', resize);
}

export function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
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

  // Onset detection → entity spawn + onset wave
  if (audio.onset && !lastOnset) {
    const pos = triggerOnset(state, { A: true, B: true, C: true });
    addOnsetWave(pos.cx, pos.cy, W, H);
  }
  lastOnset = audio.onset;

  // MIDI notes → entity spawn + midi trail
  const notes = midi.newNotes;
  if (notes.length > CFG.maxMidiNotesPerFrame) {
    notes.sort((a, b) => b.vel - a.vel);
    notes.length = CFG.maxMidiNotesPerFrame;
  }
  for (const n of notes) {
    const noteNorm = n.note / 127;
    const velNorm = n.vel / 127;
    triggerMIDI(state, { A: true, B: true, C: true }, noteNorm, velNorm);
    addMidiNote(n.ch, noteNorm, velNorm);
  }
  midi.newNotes.length = 0;

  // Update systems
  updateColors(dt);
  updatePrimitives(dt, state, 1);
  updateGenerations(dt, state, 1, false, 0, { A: true, B: true, C: true }, 'normal');
  updateWaves(dt);
  buildEntityGrid(W, H);

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

  // Session recorder
  recordSnapshot({ arc: worldState.arc, currentBpm: worldState.bpm || 0 }, entities, dt * 1000);
  recordPhaseCheck({ arc: worldState.arc, currentBpm: worldState.bpm || 0 });
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
}

// ── HUD Minimal ──
function updateHUDMinimal() {
  if (!hudMinimal) return;
  const primList = dna ? dna.primitives.join('+') : '——';
  const d3 = getDirector3Status();
  const playing = isDirector3Playing();
  const icon = playing ? '▶' : '⏸';
  const min = Math.floor(d3.totalTime / 60);
  const sec = Math.floor(d3.totalTime % 60);
  const time = `${min}:${sec < 10 ? '0' : ''}${sec}`;
  const projActive = _projectorWin && !_projectorWin.closed;
  hudMinimal.textContent =
    `${icon} ${d3.track || '—'}  ${d3.phase}  ${time}` +
    (worldState.bpm ? `  ${worldState.bpm}BPM` : '') +
    `  ${primList}` +
    (midi.connected ? `  MIDI:${midi.inputCount}` : '') +
    `  G:${getAudioGain().toFixed(1)}` +
    (projActive ? '  PROJ:ON' : '') +
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
  const pal = getPalette();
  const trajArrow = audio.trajectory > 0 ? '\u2191' : audio.trajectory < 0 ? '\u2193' : '\u2192';
  const lastNote = midi.lastNote ? `${noteName(midi.lastNote.note)} V${midi.lastNote.vel}` : '——';

  const elapsed = Math.floor(d3.totalTime);
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  const playing = isDirector3Playing();
  const tracks = ['NEBBIA','TESSUTO','SOLCO','RESPIRO','MACCHINA','TEMPESTA','RITORNO'];

  hudDebug.textContent =
    `── AUDIO ──\n` +
    `RMS  ${bar(audio.rms)}  ${(audio.rms * 100).toFixed(0)}%\n` +
    `CENT ${bar(audio.centroid)}  FLUX ${bar(audio.flux * 5)}\n` +
    `BPM  ${audio.bpm || '——'}  TRAJ ${trajArrow}\n` +
    `INT  ${bar(state.intensity)}  RHYT ${bar(state.rhythmicity)}\n` +
    `\n` +
    `── DIRECTOR ──\n` +
    `${playing ? '▶' : '⏸'}  ${d3.track}  ${d3.phase}  ${min}:${sec < 10 ? '0' : ''}${sec}\n` +
    `ARC  ${bar(d3.arc)}  ${(d3.arc * 100).toFixed(1)}%\n` +
    `PHASE ${bar(phaseState.progress)}  bar ${Math.floor(phaseState.elapsed)}/${Math.floor(phaseState.duration)}\n` +
    `ENERGY  ${ws.energy}\n` +
    `\n` +
    `── WORLD STATE ──\n` +
    `SCALE  ${ws.scale.length} notes  ROOT ${ws.root}  BPM ${ws.bpm || '—'}\n` +
    `DENSITY  r:${ws.density.rhythm.toFixed(2)}  h:${ws.density.harmony.toFixed(2)}  b:${ws.density.bass.toFixed(2)}  m:${ws.density.melody.toFixed(2)}  t:${ws.density.texture.toFixed(2)}\n` +
    `PALETTE  bg:${ws.palette.bg}  dot:${ws.palette.dot}  acc:${ws.palette.accent || '—'}\n` +
    `\n` +
    `── MIDI ──\n` +
    `${midi.connected ? 'OK ' + midi.inputCount : 'OFF'}  ${lastNote}  CH:${midi.lastNote ? midi.lastNote.ch : '-'}\n` +
    `CH  ${midi.channels.map((c, i) => c.density > 0 ? i + ':' + c.density.toFixed(1) : '').filter(Boolean).join('  ') || 'no activity'}\n` +
    `\n` +
    `── TRACCE ──\n` +
    tracks.map((t, i) => `${i + 1} ${t.padEnd(10)} ${t === d3.track ? '►' : ' '}`).join('\n') +
    `\n\n` +
    `SPC PLAY  SHIFT+1-7 TRACCIA  1-5 FASE\n` +
    `H HUD  D DEBUG  F FULL  P PROJ`;
}
