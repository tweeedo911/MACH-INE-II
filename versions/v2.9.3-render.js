// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Render Orchestrator
//  v2.8.0: halftone field + DNA + generations + color + camera
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { audio, getAudioGain } from './audio.js';
import { midi, noteName } from './midi.js';
import { state } from './state.js';
import { dna, updatePrimitives } from './dna.js';
import { entities, fossils, updateGenerations, buildEntityGrid, triggerOnset, triggerMIDI } from './generations.js';
import { updateColors, inverted, inClimax, climaxProgress, colorEnabled, chromaticMode, chromaticTimer, palette } from './colors.js';
import { updateDirector, applyCamera, framing, director, executeMutation, scene, arc, engineRender } from './director.js';
import { getComposerStatus } from './composer.js';
import { getAllMultipliers } from './presence-multiplier.js';
import { getComposer2Status } from './composer2.js';
import { getComposer3Status } from './composer3.js';
import { getComposer4Status } from './composer4.js';
import { getComposer5Status } from './composer5.js';
import { getComposer6Status } from './composer6.js';
import { getComposer7Status } from './composer7.js';
import { getEngine } from './midi-patterns.js';
import { getSequencerStatus, firma } from './sequencer.js';
import { renderField, updateWaves, addOnsetWave, addMidiNote } from './field.js';

let canvas, ctx;
let W, H;
let globalTime = 0;
let evoSpeed = 1;
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

  // Detect onset from audio
  if (audio.onset && !lastOnset) {
    const pos = triggerOnset(state, colorEnabled);
    addOnsetWave(pos.cx, pos.cy, W, H);
  }
  lastOnset = audio.onset;

  // Process MIDI notes — cap per frame, prioritize by velocity
  const notes = midi.newNotes;
  if (notes.length > CFG.maxMidiNotesPerFrame) {
    notes.sort((a, b) => b.vel - a.vel);
    notes.length = CFG.maxMidiNotesPerFrame;
  }
  for (const n of notes) {
    const noteNorm = n.note / 127;
    const velNorm = n.vel / 127;
    triggerMIDI(state, colorEnabled, noteNorm, velNorm);
    addMidiNote(n.ch, noteNorm, velNorm);
  }
  midi.newNotes.length = 0;

  // Update systems
  updateColors(dt, state);
  updateDirector(dt, state, globalTime, W, H);
  updatePrimitives(dt, state, evoSpeed);
  updateGenerations(dt, state, evoSpeed, inClimax, climaxProgress, colorEnabled, chromaticMode);
  updateWaves(dt);
  buildEntityGrid(W, H);

  // VUOTO TOTALE — total black, skip field
  if (firma.vuotoTotale) {
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(0, 0, W, H);
  } else {
    // Draw — background from palette (dynamic)
    const bg = palette.bg;
    const bgInv = (engineRender.active && engineRender.forceInvert != null) ? engineRender.forceInvert : inverted;
    const bgR = bgInv ? 255 - Math.round(bg[0]) : Math.round(bg[0]);
    const bgG = bgInv ? 255 - Math.round(bg[1]) : Math.round(bg[1]);
    const bgB = bgInv ? 255 - Math.round(bg[2]) : Math.round(bg[2]);
    const feedbackDecay = engineRender.feedbackDecay ?? 1.0;
    if (feedbackDecay < 1.0) {
      ctx.fillStyle = `rgba(${bgR},${bgG},${bgB},${(1 - feedbackDecay).toFixed(3)})`;
    } else {
      ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
    }
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    applyCamera(ctx, W, H);
    renderField(ctx, W, H, state, globalTime);
    ctx.restore();
  }

  // HUD
  if (frameCount % CFG.hudUpdateInterval === 0) {
    if (showHUD)   updateHUDMinimal();
    if (showDebug) { updateHUDDebug(); updateSeqPanel(); }
  }
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
  if (code === 'KeyR') {
    // Handled in main.js (regenerate DNA)
    return 'REGEN';
  }
  if (code === 'KeyN') {
    executeMutation(null, globalTime);
  }
}

// ── HUD Minimal ──
function updateHUDMinimal() {
  if (!hudMinimal) return;
  const primList = dna ? dna.primitives.join('+') : '——';
  const eng = getEngine();
  const seq = getSequencerStatus();
  let seqTag = '';
  if (seq.active) {
    const icon = seq.paused ? '⏸' : '▶';
    const min = Math.floor(seq.elapsed / 60);
    const sec = seq.elapsed % 60;
    const time = `${min}:${sec < 10 ? '0' : ''}${sec}`;
    const totalMin = Math.floor(seq.duration / 60);
    const totalSec = seq.duration % 60;
    const total = `${totalMin}:${totalSec < 10 ? '0' : ''}${totalSec}`;
    const flags = (seq.looping ? ' [LOOP]' : '') + (seq.paused ? ' [PAUSED]' : '');
    seqTag = `  ${icon} ${time}/${total} — ${seq.act || ''} ${seq.engine}${flags}`;
  }
  const projActive = _projectorWin && !_projectorWin.closed;
  hudMinimal.textContent =
    (eng ? eng.toUpperCase() + '  ' : '') +
    `${primList}  ${framing.current}` +
    (audio.bpm ? `  ${audio.bpm}BPM` : '') +
    seqTag +
    (midi.connected ? `  MIDI:${midi.inputCount}` : '') +
    `  G:${getAudioGain().toFixed(1)}` +
    (projActive ? '  PROJ:ON' : '');
}

// ── Sequencer panel ──
function updateSeqPanel() {
  if (!hudSeq) return;
  const s = getSequencerStatus();
  if (!s.active) {
    _seqAct.textContent    = 'SEQUENCER';
    _seqFill.style.width   = '0%';
    _seqStatus.textContent = '';
    _seqKeys.textContent   = '0 — START CONCERTO';
    return;
  }
  const icon    = s.paused ? '⏸' : '▶';
  const pct     = Math.round(s.progress * 100);
  const elapsed = `${Math.floor(s.elapsed / 60)}:${String(s.elapsed % 60).padStart(2, '0')}`;
  const total   = `${Math.floor(s.duration / 60)}:${String(s.duration % 60).padStart(2, '0')}`;
  const flags   = (s.paused ? '  PAUSED' : '') + (s.looping ? '  LOOP' : '') + (s.transitioning ? '  TRANS' : '');
  _seqAct.textContent    = s.act || '';
  _seqFill.style.width   = `${pct}%`;
  _seqStatus.textContent = `${icon}  ${elapsed} / ${total}  —  ${s.engine}${flags}`;
  _seqKeys.textContent   =
    'SH+0 STOP   SPC PAUSE   L LOOP\n' +
    '→ NEXT CUE   SH+→ NEXT ATTO\n' +
    '← PREV CUE   SH+← PREV ATTO';
}

// ── HUD Debug ──
function bar(val, len = 12) {
  const filled = Math.round(val * len);
  return '\u2588'.repeat(filled) + '\u2591'.repeat(len - filled);
}

function updateHUDDebug() {
  if (!hudDebug) return;

  const trajArrow = audio.trajectory > 0 ? '\u2191' : audio.trajectory < 0 ? '\u2193' : '\u2192';
  const lastNote = midi.lastNote ? `${noteName(midi.lastNote.note)} V${midi.lastNote.vel}` : '——';

  let avgAge = 0, countA = 0, countB = 0, countC = 0;
  for (const e of entities) {
    avgAge += e.age / e.maxAge;
    if (e.color === 'A' && e.colorAlpha > 0.1) countA++;
    if (e.color === 'B' && e.colorAlpha > 0.1) countB++;
    if (e.color === 'C' && e.colorAlpha > 0.1) countC++;
  }
  if (entities.length > 0) avgAge /= entities.length;

  hudDebug.textContent =
    `RMS  ${bar(audio.rms)}  ${(audio.rms * 100).toFixed(0)}%\n` +
    `CENT ${bar(audio.centroid)}  FLUX ${bar(audio.flux * 5)}\n` +
    `BPM  ${audio.bpm || '——'}  TRAJ ${trajArrow}  STEREO ${bar(1 - audio.stereoCorrelation)}\n` +
    `\n` +
    `INT  ${bar(state.intensity)}  RHYT ${bar(state.rhythmicity)}\n` +
    `BRIT ${bar(state.brightness)}  WIDE ${bar(state.stereoWidth)}\n` +
    `\n` +
    `DNA     ${dna ? dna.primitives.join('+') : '——'}\n` +
    `MAPPING ${dna ? dna.freqMapping : '——'}\n` +
    `ENT ${entities.length}  FOS ${fossils.length}  AGE ${avgAge.toFixed(2)}\n` +
    `A:${countA} B:${countB} C:${countC}  CHROM:${chromaticMode}${chromaticTimer > 0 ? ' ' + chromaticTimer.toFixed(0) + 's' : ''}\n` +
    `\n` +
    `CAM  ${framing.current} ×${framing.zoom.toFixed(1)}\n` +
    `DIR  ${director.lastChangeType}  ${director.sceneTime.toFixed(0)}s\n` +
    `SCENE ${scene.target.name}  ${scene.target.composition}  blend:${scene.blend.toFixed(2)}\n` +
    `ARC  ${arc.phase}  rms:${(arc._smoothRms||0).toFixed(2)}  T:${arc.tension.toFixed(2)}  ${Math.floor(arc.totalTime)}s\n` +
    `\n` +
    `MIDI ${midi.connected ? 'OK ' + midi.inputCount : 'OFF'}  ${lastNote}  CH:${midi.lastNote ? midi.lastNote.ch : '-'}\n` +
    `CH  ${midi.channels.map((c, i) => c.density > 0 ? i + ':' + c.density.toFixed(1) : '').filter(Boolean).join('  ') || 'no activity'}\n` +
    `CLIMAX ${climaxProgress > 0.1 ? (climaxProgress * 100).toFixed(0) + '%' : 'OFF'}` +
    `  IMP ${state.impact.toFixed(2)}` +
    (firma.gelo ? '  GELO' : '') + (firma.convergenza ? '  CONV' : '') + (firma.vuotoTotale ? '  VUOTO' : '') + '\n' +
    `\n` +
    (() => {
      const pm = getAllMultipliers();
      const parts = [
        ['1:DER', pm.deriva], ['2:CRI', pm.cristallo], ['3:ABI', pm.abisso],
        ['4:TER', pm.terreno], ['5:MEC', pm.meccanica], ['6:VOR', pm.vortice], ['7:SOL', pm.solco],
      ].filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v.toFixed(1)}`);
      return parts.length ? `PM  ${parts.join('  ')}\n` : '';
    })() +
    (() => { const s = getComposer3Status(); return s.active ? `1 DERIVA    ${s.phase}  root:${s.chordRoot}  bar:${s.bar}  ${s.ruptureStage}` : '1 DERIVA    OFF'; })() + '\n' +
    (() => { const s = getComposer5Status(); return s.active ? `2 CRISTALLO ${s.phase}  L:${s.activeCount}  ${s.ruptureStage}` : '2 CRISTALLO OFF'; })() + '\n' +
    (() => { const s = getComposer6Status(); return s.active ? `3 ABISSO    ${s.phase}  L:${s.activeCount}  ${s.ruptureStage}` : '3 ABISSO    OFF'; })() + '\n' +
    (() => { const s = getComposerStatus();  return s.active ? `4 TERRENO   ${s.phase}  ${s.ruptureStage}` : '4 TERRENO   OFF'; })() + '\n' +
    (() => { const s = getComposer2Status(); return s.active ? `5 MECCANICA ${s.phase}  L:${s.activeCount}/4  ${s.ruptureStage}` : '5 MECCANICA OFF'; })() + '\n' +
    (() => { const s = getComposer4Status(); return s.active ? `6 VORTICE   ${s.phase}  L:${s.activeCount}  ${s.ruptureStage}` : '6 VORTICE   OFF'; })() + '\n' +
    (() => { const s = getComposer7Status(); return s.active ? `7 SOLCO     ${s.phase}  L:${s.activeCount}  ${s.ruptureStage}` : '7 SOLCO     OFF'; })() + '\n' +
    `\n` +
    `H HUD  D DEBUG  F FULL  P PROJ\n` +
    `R REGEN  N MUTATE  è GAIN▼  + GAIN▲`;
}
