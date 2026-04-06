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
import { getSequencerStatus, firma } from './sequencer.js';
import { macroState } from './macro-composer.js';
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
    (projActive ? '  PROJ:ON' : '') +
    (isRecording() ? '  ● REC' : '');
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
      const ms = macroState;
      const pct = (ms.arcPercent * 100).toFixed(1);
      const phases = ['NEBBIA','TESSUTO','SOLCO','RESPIRO','MACCHINA','TEMPESTA','RITORNO'];
      const phasePcts = [0, 0.07, 0.186, 0.372, 0.419, 0.581, 0.814];
      let currentPhase = phases[0];
      for (let i = phasePcts.length - 1; i >= 0; i--) {
        if (ms.arcPercent >= phasePcts[i]) { currentPhase = phases[i]; break; }
      }
      return (
        `MODE ${ms.currentMode}  ARC ${pct}%\n` +
        `rD:${ms.rhythmicDensity.toFixed(2)}  hC:${ms.harmonicColor.toFixed(2)}  mA:${ms.melodicActivity.toFixed(2)}  tD:${ms.textureDepth.toFixed(2)}\n` +
        `PHASE  ${currentPhase}  bar:${ms.barClock.toFixed(0)}${ms.pivotActive ? '  PIVOT' : ''}${ms.breakActive ? '  BREAK' : ''}\n` +
        `\n` +
        `1 NEBBIA    ${ms.arcPercent >= 0.000 && ms.arcPercent < 0.07  ? '►' : ' '}\n` +
        `2 TESSUTO   ${ms.arcPercent >= 0.07  && ms.arcPercent < 0.186 ? '►' : ' '}\n` +
        `3 SOLCO     ${ms.arcPercent >= 0.186 && ms.arcPercent < 0.372 ? '►' : ' '}\n` +
        `4 RESPIRO   ${ms.arcPercent >= 0.372 && ms.arcPercent < 0.419 ? '►' : ' '}\n` +
        `5 MACCHINA  ${ms.arcPercent >= 0.419 && ms.arcPercent < 0.581 ? '►' : ' '}\n` +
        `6 TEMPESTA  ${ms.arcPercent >= 0.581 && ms.arcPercent < 0.814 ? '►' : ' '}\n` +
        `7 RITORNO   ${ms.arcPercent >= 0.814                          ? '►' : ' '}\n`
      );
    })() +
    `\n` +
    `H HUD  D DEBUG  F FULL  P PROJ\n` +
    `R REGEN  N MUTATE  è GAIN▼  + GAIN▲`;
}
