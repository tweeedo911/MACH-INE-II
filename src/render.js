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
let hudDebug, hudNavigator;
let _nvTrack, _nvSub, _nvBarFill, _nvMeta, _nvMap, _nvState, _nvAction;
let _hotkeysPanel;
let showUI = true;           // Navigator + Hotkeys (toggle K)
let showDebug = false;       // HUD debug opzionale (toggle D)
let frameCount = 0;
let _projectorWin = null;

const TRACK_ORDER_UI = ['NEBBIA', 'TESSUTO', 'SOLCO', 'RESPIRO', 'MACCHINA', 'TEMPESTA', 'RITORNO'];

export function setProjectorWindow(win) { _projectorWin = win; }

export function initRender(cvs) {
  canvas = cvs;
  ctx = canvas.getContext('2d');
  // Risoluzione interna fissa — CSS scala per display
  W = canvas.width  = CFG.renderW;
  H = canvas.height = CFG.renderH;
  canvas.style.width  = '100%';
  canvas.style.height = '100%';
  canvas.style.objectFit = 'contain';
  initLayers(W, H);
  // resize non serve più per il canvas, ma riposiziona CSS se necessario
}

export function resize() {
  // Canvas resolution resta fissa — solo CSS layout si adatta
  // (W e H invariati, nessun riallocazione buffer)
}

// Signature retained for backward compat; first arg (legacy hudMinimal) ignored.
// Nuovo: setHUDElements(navigator, debug, hotkeys)
export function setHUDElements(navigator_, debug, hotkeys_) {
  hudNavigator = navigator_;
  hudDebug = debug;
  _hotkeysPanel = hotkeys_;
  if (hudNavigator) {
    _nvTrack   = hudNavigator.querySelector('.nv-track');
    _nvSub     = hudNavigator.querySelector('.nv-sub');
    _nvBarFill = hudNavigator.querySelector('.nv-bar-fill');
    _nvMeta    = hudNavigator.querySelector('.nv-meta');
    _nvMap     = hudNavigator.querySelector('.nv-map');
    _nvState   = hudNavigator.querySelector('.nv-state');
    _nvAction  = hudNavigator.querySelector('.nv-action');
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

  // HUD: Navigator sempre aggiornato se visibile; Debug solo su richiesta
  if (frameCount % CFG.hudUpdateInterval === 0) {
    if (showUI)    updateNavigator();
    if (showDebug) updateHUDDebug();
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
  // K toggla UI performer (Navigator + Hotkeys) — utile quando si vuole schermo pulito
  if (code === 'KeyK') {
    showUI = !showUI;
    if (hudNavigator)  hudNavigator.style.display  = showUI ? 'block' : 'none';
    if (_hotkeysPanel) _hotkeysPanel.style.display = showUI ? 'block' : 'none';
  }
  // H legacy: alias di K (manteniamo per compat col muscle memory)
  if (code === 'KeyH') {
    showUI = !showUI;
    if (hudNavigator)  hudNavigator.style.display  = showUI ? 'block' : 'none';
    if (_hotkeysPanel) _hotkeysPanel.style.display = showUI ? 'block' : 'none';
  }
  if (code === 'KeyD') {
    showDebug = !showDebug;
    if (hudDebug) hudDebug.style.display = showDebug ? 'block' : 'none';
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

// ── NAVIGATOR — "dove sei + cosa sta succedendo" ──
// Pannello performer principale: traccia + fase + progress + mini-mappa suite + stato drammaturgia.
function updateNavigator() {
  if (!hudNavigator || !_nvTrack) return;
  const d3 = getDirector3Status();
  const playing = isDirector3Playing();
  const ws = worldState;

  // Header: traccia + posizione ordinale
  const trackName = d3.track || '—';
  const idx = TRACK_ORDER_UI.indexOf(trackName);
  const pos = idx >= 0 ? `${idx + 1}/7` : (ws.encoreMode ? 'ENCORE' : '—');

  const playIcon = playing ? '▶' : '⏸';
  _nvTrack.textContent = `${playIcon} ${trackName}  ${pos}`;

  // Sub: fase + bpm
  const phase = d3.phase || '—';
  const bpm = ws.bpm ? `${ws.bpm}BPM` : 'ambient';
  _nvSub.textContent = `${phase}  ·  ${bpm}`;

  // Progress bar della fase
  const pct = Math.round(phaseState.progress * 100);
  _nvBarFill.style.width = `${pct}%`;

  // Meta: bar X/Y + tempo totale + arc
  const min = Math.floor(d3.totalTime / 60);
  const sec = Math.floor(d3.totalTime % 60);
  const tStr = `${min}:${sec < 10 ? '0' : ''}${sec}`;
  const barCur = Math.floor(phaseState.elapsed);
  const barTot = Math.floor(phaseState.duration);
  _nvMeta.textContent = `bar ${barCur}/${barTot}  ·  ${tStr}  ·  arc ${Math.round(d3.arc * 100)}%`;

  // Mappa 7 biomi + ENCORE: ● corrente, ◉ passato, ○ futuro
  let map = '';
  for (let i = 0; i < TRACK_ORDER_UI.length; i++) {
    if (ws.encoreMode) { map += '·'; }
    else if (i === idx)       map += '●';
    else if (i < idx)         map += '◉';
    else                      map += '○';
    if (i < TRACK_ORDER_UI.length - 1) map += ' ';
  }
  if (ws.encoreMode) map += '  [E]';
  else               map += ws.encoreMode === false && idx === 6 ? '  [e]' : '  E?';
  _nvMap.textContent = map;

  // Stato drammaturgia: rootOffset, densityMultiplier, variante RITORNO
  const oct = Math.round((ws.rootOffset || 0) / 12);
  const octStr = oct === 0 ? 'OCT 0' : `OCT ${oct >= 0 ? '+' : ''}${oct}`;
  const denPct = Math.round((ws.densityMultiplier || 1) * 100);
  const denStr = denPct === 100 ? 'DEN 100%' : `DEN ${denPct}%`;
  const rv = ws.ritornoVariant || 'default';
  const rvStr = rv === 'default' ? 'RIT def' : (rv === 'phrygianHold' ? 'RIT phryg' : 'RIT silence');
  const projTag = (_projectorWin && !_projectorWin.closed) ? '  PROJ' : '';
  const recTag  = isRecording() ? '  ●REC' : '';
  _nvState.textContent = `${octStr}  ·  ${denStr}  ·  ${rvStr}${projTag}${recTag}`;

  // Action strip: mute attivi + rupture stage + firma
  const parts = [];
  if (ws.meloMuteBars > 0) parts.push(`MEL MUTE ${ws.meloMuteBars}bar`);
  if (ws.bassMuteBars > 0) parts.push(`BASS MUTE ${ws.bassMuteBars}bar`);
  if (ws.preSuiteActive)   parts.push('PRE-SUITE');
  if (ws.rupture?.stage)   parts.push(`RUPT: ${ws.rupture.stage}`);
  if (firma.gelo)          parts.push('GELO');
  if (firma.convergenza)   parts.push('CONV');
  if (firma.vuotoTotale)   parts.push('VUOTO');
  _nvAction.textContent = parts.join('  ·  ');
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
    `EV ${eventCount()}`;
}
