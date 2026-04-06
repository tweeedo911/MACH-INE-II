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
import { getEngine } from './midi-patterns.js';
import { getDirector3Status, isDirector3Playing } from './director3.js';
import { worldState, phaseState } from './world-state.js';

// ── Stubs for removed v2 modules (firma, macroState) ──
const firma = { vuotoTotale: false, gelo: false, convergenza: false };
const macroState = { arc: 0, currentBpm: 120 };
import { renderField, updateWaves, addOnsetWave, addMidiNote } from './field.js';
import { recordSnapshot, recordPhaseCheck, isRecording } from './session-recorder.js';

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
      // Feedback with geometric transform (v4) — zoom/rotate/drift on previous frame
      const fbZoom   = engineRender.feedbackZoom   || 1.0;
      const fbRotate = engineRender.feedbackRotate || 0;
      const fbDriftX = engineRender.feedbackDriftX || 0;
      const fbDriftY = engineRender.feedbackDriftY || 0;
      const hasTransform = fbZoom !== 1.0 || fbRotate !== 0 || fbDriftX !== 0 || fbDriftY !== 0;
      if (hasTransform) {
        // Draw transformed feedback of current canvas content before clearing
        ctx.save();
        ctx.globalAlpha = feedbackDecay;
        ctx.translate(W * 0.5, H * 0.5);
        ctx.scale(fbZoom, fbZoom);
        ctx.rotate(fbRotate);
        ctx.translate(-W * 0.5 + fbDriftX, -H * 0.5 + fbDriftY);
        ctx.drawImage(canvas, 0, 0);
        ctx.restore();
        // Semi-transparent bg clear on top — fades the feedback trail
        ctx.fillStyle = `rgba(${bgR},${bgG},${bgB},${(1 - feedbackDecay).toFixed(3)})`;
      } else {
        // No transform — original alpha-fade behavior
        ctx.fillStyle = `rgba(${bgR},${bgG},${bgB},${(1 - feedbackDecay).toFixed(3)})`;
      }
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

  // Session recorder — snapshot + phase change detection (throttled internally)
  recordSnapshot(macroState, entities, dt * 1000);
  recordPhaseCheck(macroState);
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
    `  ${primList}  ${framing.current}` +
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

  const elapsed = Math.floor(d3.totalTime);
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  const playing = isDirector3Playing();

  const tracks = ['NEBBIA','TESSUTO','SOLCO','RESPIRO','MACCHINA','TEMPESTA','RITORNO'];

  hudDebug.textContent =
    `── AUDIO ──\n` +
    `RMS  ${bar(audio.rms)}  ${(audio.rms * 100).toFixed(0)}%\n` +
    `CENT ${bar(audio.centroid)}  FLUX ${bar(audio.flux * 5)}\n` +
    `BPM  ${audio.bpm || '——'}  TRAJ ${trajArrow}  STEREO ${bar(1 - audio.stereoCorrelation)}\n` +
    `INT  ${bar(state.intensity)}  RHYT ${bar(state.rhythmicity)}\n` +
    `BRIT ${bar(state.brightness)}  WIDE ${bar(state.stereoWidth)}\n` +
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
    `VELCEIL  r:${ws.velocityCeiling.rhythm}  h:${ws.velocityCeiling.harmony}  b:${ws.velocityCeiling.bass}  m:${ws.velocityCeiling.melody}\n` +
    `CHORD  [${ws.currentChord.join(',')}]\n` +
    `\n` +
    `── VISUAL ──\n` +
    `DNA     ${dna ? dna.primitives.join('+') : '——'}\n` +
    `ENT ${entities.length}  FOS ${fossils.length}  AGE ${avgAge.toFixed(2)}\n` +
    `A:${countA} B:${countB} C:${countC}  CHROM:${chromaticMode}${chromaticTimer > 0 ? ' ' + chromaticTimer.toFixed(0) + 's' : ''}\n` +
    `CAM  ${framing.current} x${framing.zoom.toFixed(1)}\n` +
    `DIR  ${director.lastChangeType}  ${director.sceneTime.toFixed(0)}s\n` +
    `SCENE ${scene.target.name}  blend:${scene.blend.toFixed(2)}\n` +
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
