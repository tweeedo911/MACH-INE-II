// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Render Orchestrator
//  v0.8.0: halftone field + DNA + generations + color + camera
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { audio, getAudioGain } from './audio.js';
import { midi, noteName } from './midi.js';
import { state } from './state.js';
import { dna, updatePrimitives } from './dna.js';
import { entities, fossils, updateGenerations, buildEntityGrid, triggerOnset, triggerMIDI } from './generations.js';
import { updateColors, inverted, inClimax, climaxProgress, colorEnabled, chromaticMode, chromaticTimer, palette } from './colors.js';
import { updateDirector, applyCamera, framing, director, executeMutation, scene, arc, engineRender } from './director.js';
import { getComposer2Status } from './composer2.js';
import { getComposer3Status } from './composer3.js';
import { getComposer4Status } from './composer4.js';
import { getComposer5Status } from './composer5.js';
import { getComposer6Status } from './composer6.js';
import { getEngine } from './midi-patterns.js';
import { renderField, updateWaves, addOnsetWave, addMidiNote } from './field.js';

let canvas, ctx;
let W, H;
let globalTime = 0;
let evoSpeed = 1;
let lastOnset = false;
let hudMinimal, hudDebug;
let showHUD = true, showDebug = false;
let frameCount = 0;

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

export function setHUDElements(minimal, debug) {
  hudMinimal = minimal;
  hudDebug = debug;
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

  // Process all MIDI notes received since last frame
  for (const n of midi.newNotes) {
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

  // Draw — background from palette (dynamic)
  const bg = palette.bg;
  const bgInv = (engineRender.active && engineRender.forceInvert != null) ? engineRender.forceInvert : inverted;
  ctx.fillStyle = bgInv
    ? `rgb(${255 - Math.round(bg[0])},${255 - Math.round(bg[1])},${255 - Math.round(bg[2])})`
    : `rgb(${Math.round(bg[0])},${Math.round(bg[1])},${Math.round(bg[2])})`;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  applyCamera(ctx, W, H);
  renderField(ctx, W, H, state, globalTime);
  ctx.restore();

  // HUD
  if (frameCount % CFG.hudUpdateInterval === 0) {
    if (showHUD) updateHUDMinimal();
    if (showDebug) updateHUDDebug();
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
  hudMinimal.textContent =
    (eng ? eng.toUpperCase() + '  ' : '') +
    `${primList}  ${framing.current}` +
    (audio.bpm ? `  ${audio.bpm}BPM` : '') +
    (midi.connected ? `  MIDI:${midi.inputCount}` : '') +
    `  G:${getAudioGain().toFixed(1)}`;
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
    `ARC  ${arc.phase}  rms:${(arc._smoothRms||0).toFixed(2)}  ${Math.floor(arc.totalTime)}s\n` +
    `\n` +
    `MIDI ${midi.connected ? 'OK ' + midi.inputCount : 'OFF'}  ${lastNote}  CH:${midi.lastNote ? midi.lastNote.ch : '-'}\n` +
    `CH  ${midi.channels.map((c, i) => c.density > 0 ? i + ':' + c.density.toFixed(1) : '').filter(Boolean).join('  ') || 'no activity'}\n` +
    `CLIMAX ${climaxProgress > 0.1 ? (climaxProgress * 100).toFixed(0) + '%' : 'OFF'}\n` +
    `\n` +
    `ENGINE ${getEngine() ? getEngine().toUpperCase() : 'NONE'}\n` +
    `KEYS  H=hud D=debug F=full R=regen N=mutate è/+=gain\n` +
    `      1=TERRENO 2=MECCANICA 3=DERIVA 4=VORTICE 5=CRISTALLO 6=ABISSO\n` +
    (() => { const s = getComposer2Status(); return s.active ? `COMP2 ${s.phase}  L:${s.activeCount}/4  ${s.ruptureStage}` : 'COMP2 OFF'; })() + '\n' +
    (() => { const s = getComposer3Status(); return s.active ? `COMP3 ${s.phase}  root:${s.chordRoot}  bar:${s.bar}  ${s.ruptureStage}` : 'COMP3 OFF'; })() + '\n' +
    (() => { const s = getComposer4Status(); return s.active ? `COMP4 ${s.phase}  L:${s.activeCount}  ${s.ruptureStage}` : 'COMP4 OFF'; })() + '\n' +
    (() => { const s = getComposer5Status(); return s.active ? `COMP5 ${s.phase}  L:${s.activeCount}  ${s.ruptureStage}` : 'COMP5 OFF'; })() + '\n' +
    (() => { const s = getComposer6Status(); return s.active ? `COMP6 ${s.phase}  L:${s.activeCount}  ${s.ruptureStage}` : 'COMP6 OFF'; })();
}
