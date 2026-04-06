// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Director
//  Reads audio + clock → writes World State.
//  Does NOT generate notes. Only constraints and context.
// ═══════════════════════════════════════════════════════════

import { worldState, phaseState } from './world-state.js';
import { TRACKS, PHASE_DENSITY, PHASE_ENERGY } from './tracks.js';

// ── Phase order ──
const PHASE_ORDER = ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'];

let _track = null;     // current track definition
let _phaseIdx = 0;     // index into PHASE_ORDER
let _phaseTime = 0;    // seconds elapsed in current phase
let _totalTime = 0;    // total seconds since start
let _totalDuration = 0; // sum of all phase durations

// ── Init: load a track into worldState ──
export function initDirector3(trackName = 'SOLCO') {
  _track = TRACKS[trackName];
  if (!_track) throw new Error(`[DIR3] Track "${trackName}" not found`);

  _phaseIdx = 0;
  _phaseTime = 0;
  _totalTime = 0;
  _totalDuration = PHASE_ORDER.reduce((sum, p) => sum + (_track.phases[p] || 0), 0);

  // Load track identity into worldState
  worldState.track = trackName;
  worldState.scale = _track.scale;
  worldState.root = _track.root;
  worldState.bpm = _track.bpm;
  worldState.rhythmGrid = _track.rhythmGrid;
  worldState.palette = { ...(_track.palette) };
  worldState.visualRegime = { ...(_track.visualRegime) };

  _applyPhase();

  console.log(`[DIR3] Loaded track: ${trackName}, duration: ${_totalDuration}s`);
}

// ── Update: called every MIDI clock tick (~2ms) ──
export function updateDirector3(dt) {
  _phaseTime += dt;
  _totalTime += dt;

  // Update arc (concert position)
  worldState.arc = Math.min(1, _totalTime / _totalDuration);

  // Advance phase if duration exceeded
  const phaseName = PHASE_ORDER[_phaseIdx];
  const phaseDur = _track.phases[phaseName] || 60;

  if (_phaseTime >= phaseDur && _phaseIdx < PHASE_ORDER.length - 1) {
    _phaseIdx++;
    _phaseTime = 0;
    _applyPhase();
    console.log(`[DIR3] Phase: ${PHASE_ORDER[_phaseIdx]} (arc: ${worldState.arc.toFixed(2)})`);
  }

  // Update phase state (for HUD)
  phaseState.elapsed = _phaseTime;
  phaseState.duration = phaseDur;
  phaseState.progress = Math.min(1, _phaseTime / phaseDur);
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
    _applyPhase();
    console.log(`[DIR3] Skipped to: ${PHASE_ORDER[_phaseIdx]}`);
  }
}

export function jumpToPhase(name) {
  const idx = PHASE_ORDER.indexOf(name);
  if (idx >= 0) {
    _phaseIdx = idx;
    _phaseTime = 0;
    _applyPhase();
    console.log(`[DIR3] Jumped to: ${name}`);
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
