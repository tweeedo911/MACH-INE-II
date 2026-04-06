// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Director
//  Reads audio + clock → writes World State.
//  Does NOT generate notes. Only constraints and context.
// ═══════════════════════════════════════════════════════════

import { worldState, phaseState } from './world-state.js';
import { TRACKS, PHASE_DENSITY, PHASE_ENERGY, TRACK_ORDER } from './tracks.js';
import { initRhythm } from './rhythm.js';
import { initHarmony } from './harmony.js';
import { initBass } from './bass.js';
import { initMelody } from './melody.js';
import { initTexture } from './texture.js';

// ── Phase order ──
const PHASE_ORDER = ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'];

let _track = null;     // current track definition
let _phaseIdx = 0;     // index into PHASE_ORDER
let _phaseTime = 0;    // seconds elapsed in current phase
let _phaseBars = 0;    // bars elapsed in current phase
let _barAcc = 0;       // accumulator for bar counting (seconds within current bar)
let _totalTime = 0;    // total seconds since start
let _totalBars = 0;    // total bars for all phases
let _paused = true;     // starts paused — performer presses Space to begin

// ── Init: load a track into worldState ──
export function initDirector3(trackName = 'SOLCO') {
  _track = TRACKS[trackName];
  if (!_track) throw new Error(`[DIR3] Track "${trackName}" not found`);

  _phaseIdx = 0;
  _phaseTime = 0;
  _phaseBars = 0;
  _barAcc = 0;
  _totalTime = 0;
  _totalBars = PHASE_ORDER.reduce((sum, p) => sum + (_track.phases[p] || 0), 0);

  // Load track identity into worldState
  worldState.track = trackName;
  worldState.scale = _track.scale;
  worldState.root = _track.root;
  worldState.bpm = _track.bpm;
  worldState.rhythmGrid = _track.rhythmGrid;
  worldState.palette = { ...(_track.palette) };
  worldState.visualRegime = { ...(_track.visualRegime) };

  _applyPhase();

  // Reset all modules so they start clean on the new track
  initRhythm();
  initHarmony();
  initBass();
  initMelody();
  initTexture();

  console.log(`[DIR3] Loaded track: ${trackName}, duration: ${_totalBars} bars`);
}

// ── Pause/play control ──
export function toggleDirector3() {
  _paused = !_paused;
  if (!_paused) _applyPhase();  // restore density values on unpause
  console.log(`[DIR3] ${_paused ? 'PAUSED' : 'PLAYING'}`);
  return !_paused;
}

export function isDirector3Playing() {
  return !_paused;
}

// ── Update: called every MIDI clock tick (~2ms) ──
export function updateDirector3(dt) {
  if (_paused) {
    // Silence all modules while paused
    for (const mod of ['rhythm', 'harmony', 'bass', 'melody', 'texture']) {
      worldState.density[mod] = 0;
    }
    return;
  }
  _phaseTime += dt;
  _totalTime += dt;

  // Count bars using BPM (4 beats per bar)
  const bpm = worldState.bpm || 60;
  const barDuration = 240 / bpm; // seconds per bar (4 beats)
  _barAcc += dt;
  while (_barAcc >= barDuration) {
    _barAcc -= barDuration;
    _phaseBars++;
  }

  // Update arc (concert position) — based on total bars
  const totalElapsedBars = PHASE_ORDER.slice(0, _phaseIdx).reduce((sum, p) => sum + (_track.phases[p] || 0), 0) + _phaseBars;
  worldState.arc = _totalBars > 0 ? Math.min(1, totalElapsedBars / _totalBars) : 0;

  // Advance phase if bar count exceeded
  const phaseName = PHASE_ORDER[_phaseIdx];
  const phaseDurBars = _track.phases[phaseName] || 16;

  if (_phaseBars >= phaseDurBars) {
    if (_phaseIdx < PHASE_ORDER.length - 1) {
      // Skip phases with duration 0
      _phaseIdx++;
      while (_phaseIdx < PHASE_ORDER.length - 1 && (_track.phases[PHASE_ORDER[_phaseIdx]] || 0) === 0) {
        _phaseIdx++;
      }
      _phaseTime = 0;
      _phaseBars = 0;
      _barAcc = 0;
      _applyPhase();
      console.log(`[DIR3] Phase: ${PHASE_ORDER[_phaseIdx]} (arc: ${worldState.arc.toFixed(2)})`);
    } else {
      // Dissoluzione finished — advance to next track
      _advanceTrack();
    }
  }

  // Update phase state (for HUD)
  phaseState.elapsed = _phaseBars;
  phaseState.duration = phaseDurBars;
  phaseState.progress = phaseDurBars > 0 ? Math.min(1, _phaseBars / phaseDurBars) : 0;
}

// ── Auto-advance to next track in album order ──
function _advanceTrack() {
  const currentIdx = TRACK_ORDER.indexOf(worldState.track);
  const nextIdx = currentIdx + 1;

  if (nextIdx >= TRACK_ORDER.length) {
    // Concert is over — pause
    _paused = true;
    for (const mod of ['rhythm', 'harmony', 'bass', 'melody', 'texture']) {
      worldState.density[mod] = 0;
    }
    console.log('[DIR3] Concert finished.');
    return;
  }

  const nextTrack = TRACK_ORDER[nextIdx];
  if (!TRACKS[nextTrack]) {
    // Track not yet defined — skip to next available
    console.warn(`[DIR3] Track "${nextTrack}" not defined, skipping`);
    // Try the one after
    for (let i = nextIdx + 1; i < TRACK_ORDER.length; i++) {
      if (TRACKS[TRACK_ORDER[i]]) {
        initDirector3(TRACK_ORDER[i]);
        _paused = false; // keep playing
        return;
      }
    }
    _paused = true;
    console.log('[DIR3] No more defined tracks.');
    return;
  }

  console.log(`[DIR3] → Next track: ${nextTrack}`);
  initDirector3(nextTrack);
  _paused = false; // keep playing — don't reset to paused
}

// ── Apply phase: update density, energy, registers, velocity ceilings ──
function _applyPhase() {
  const phaseName = PHASE_ORDER[_phaseIdx];
  worldState.phase = phaseName;
  worldState.energy = PHASE_ENERGY[phaseName] || 'SILENCE';

  // Density = track base × phase multiplier
  const pd = PHASE_DENSITY[phaseName];
  for (const mod of ['rhythm', 'harmony', 'bass', 'melody', 'texture']) {
    worldState.density[mod] = (_track.density[mod] || 0) * (pd[mod] || 0);
  }

  // Registers and velocity ceilings from track (constant per track, could vary per phase later)
  if (_track.register) {
    for (const [k, v] of Object.entries(_track.register)) {
      worldState.register[k] = [...v];
    }
  }
  if (_track.velocityCeiling) {
    for (const [k, v] of Object.entries(_track.velocityCeiling)) {
      worldState.velocityCeiling[k] = v;
    }
  }
}

// ── Manual controls (keyboard) ──
export function skipPhase(direction = 1) {
  const newIdx = Math.max(0, Math.min(PHASE_ORDER.length - 1, _phaseIdx + direction));
  if (newIdx !== _phaseIdx) {
    _phaseIdx = newIdx;
    _phaseTime = 0;
    _phaseBars = 0;
    _barAcc = 0;
    _applyPhase();
    console.log(`[DIR3] Skipped to: ${PHASE_ORDER[_phaseIdx]}`);
  }
}

export function jumpToPhase(name) {
  const idx = PHASE_ORDER.indexOf(name);
  if (idx >= 0) {
    _phaseIdx = idx;
    _phaseTime = 0;
    _phaseBars = 0;
    _barAcc = 0;
    _applyPhase();
    console.log(`[DIR3] Jumped to: ${name}`);
  }
}

// ── Switch track (keyboard 6-7 or future sequencer) ──
export function jumpToTrack(trackName) {
  if (!TRACKS[trackName]) {
    console.warn(`[DIR3] Track "${trackName}" not found`);
    return;
  }
  const wasPlaying = !_paused;
  initDirector3(trackName);
  if (wasPlaying) {
    _paused = false;
    _applyPhase();
  }
}

export function getDirector3Status() {
  return {
    track: worldState.track,
    phase: PHASE_ORDER[_phaseIdx],
    phaseProgress: phaseState.progress,
    arc: worldState.arc,
    energy: worldState.energy,
    totalTime: _totalTime,
  };
}
