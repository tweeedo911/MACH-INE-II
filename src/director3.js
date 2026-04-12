// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Director
//  Reads audio + clock → writes World State.
//  Does NOT generate notes. Only constraints and context.
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { firma } from './firma.js';
import { worldState, phaseState } from './world-state.js';
import { TRACKS, PHASE_DENSITY, PHASE_ENERGY, TRACK_ORDER } from './tracks.js';
import { audio } from './audio.js';
import { state } from './state.js';
import { sendMIDIAllNotesOff, sendMIDINote } from './midi.js';
import { initRhythm } from './rhythm.js';
import { initHarmony } from './harmony.js';
import { initBass as initBassV1 } from './bass.js';
import { initBass as initBassV2 } from './bass-v2.js';
import { initBass as initBassV3 } from './bass-v3.js';
import { initMelody as initMelodyV1 } from './melody.js';
import { initMelody as initMelodyV2 } from './melody-v2.js';
import { initMelody as initMelodyV3 } from './melody-v3.js';
import { initTexture } from './texture.js';

// V2/V3 toggle: STRUCTURAL takes priority over EXPERIMENT for bass/melody init
const initBass = () => {
  if (CFG.MUSIC_STRUCTURAL) return initBassV3();
  if (CFG.MUSIC_EXPERIMENT) return initBassV2();
  return initBassV1();
};
const initMelody = () => {
  if (CFG.MUSIC_STRUCTURAL) return initMelodyV3();
  if (CFG.MUSIC_EXPERIMENT) return initMelodyV2();
  return initMelodyV1();
};

// V2 structural silence system removed — replaced by overlap transitions (V3.5)

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

// V3: base densities computed by _applyPhase, then modulated each frame
// by tension waves (RESEARCH-V4 §B.1) when MUSIC_STRUCTURAL is on.
const _phaseDensityBase = { rhythm: 0, harmony: 0, bass: 0, melody: 0, texture: 0 };

// V3: Walls of Sound triggered state (RESEARCH-V4 §A.7 Hecker)
let _wallsTriggered = {
  tempesta: false,         // picco di TEMPESTA densita
  ritorno: false,          // RITORNO false resolution rebound
};

// V2 ext: Frahm velocity range per phase — multiplier on top of track velocityCeiling.
// Substitutes flat-per-track ceiling with phase-modulated dynamics:
// pp-mp on germoglio/dissoluzione, mf-f on densita, f-ff on rottura.
const PHASE_VEL_SCALE = {
  germoglio:    0.60,
  pulsazione:   0.75,
  densita:      0.95,
  rottura:      1.15,
  dissoluzione: 0.60,
};

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

  // Reset walls of sound triggers when starting a new concert (NEBBIA)
  if (trackName === 'NEBBIA') {
    _wallsTriggered.tempesta = false;
    _wallsTriggered.ritorno = false;
  }

  // Load track identity into worldState
  worldState.track = trackName;
  worldState.scale = _track.scale;
  worldState.root = _track.root;
  worldState.bpm = _track.bpm;
  worldState.rhythmGrid = _track.rhythmGrid;
  // Source palette from Bible §12 trackPalettes; fallback to _track.palette
  const tp = CFG.VISUAL?.trackPalettes?.[trackName];
  worldState.palette.bg          = tp?.bg       ?? _track.palette.bg;
  worldState.palette.dot         = tp?.dot      ?? _track.palette.dot;
  worldState.palette.accent      = tp?.event    ?? _track.palette.accent ?? null;
  worldState.palette.ruptureTint = tp?.rupture   ?? null;
  worldState.palette.ruptureBg   = tp?.ruptureBg ?? null;
  worldState.palette.residual    = tp?.residual  ?? null;
  worldState.visualRegime = { ...(_track.visualRegime) };

  // Reset rupture — phase starts at germoglio, not rottura
  worldState.rupture.stage     = null;
  worldState.rupture.stageT    = 0;
  worldState.rupture.t         = 0;
  worldState.rupture.intensity = 0;

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

  const bpm = worldState.bpm || 60;
  const barDuration = 240 / bpm; // seconds per bar (4 beats)



  // Count bars using BPM (4 beats per bar)
  _barAcc += dt;
  while (_barAcc >= barDuration) {
    _barAcc -= barDuration;
    _phaseBars++;

    // ── V3: Wall of Sound triggers on downbeat ──
    if (CFG.MUSIC_STRUCTURAL) {
      // Wall #1: TEMPESTA, picco di densita (mid-densita)
      if (!_wallsTriggered.tempesta &&
          worldState.track === 'TEMPESTA' &&
          PHASE_ORDER[_phaseIdx] === 'densita') {
        const phaseDur = _track.phases.densita || 0;
        if (_phaseBars >= Math.floor(phaseDur * 0.5)) {
          _triggerWallOfSound('TEMPESTA picco');
          _wallsTriggered.tempesta = true;
        }
      }
      // Wall #2: RITORNO, false resolution rebound (early in pulsazione)
      if (!_wallsTriggered.ritorno &&
          worldState.track === 'RITORNO' &&
          PHASE_ORDER[_phaseIdx] === 'pulsazione' &&
          _phaseBars >= 4) {
        _triggerWallOfSound('RITORNO false resolution');
        _wallsTriggered.ritorno = true;
      }
    }
  }

  // Update arc (concert position) — based on total bars
  const totalElapsedBars = PHASE_ORDER.slice(0, _phaseIdx).reduce((sum, p) => sum + (_track.phases[p] || 0), 0) + _phaseBars;
  worldState.arc = _totalBars > 0 ? Math.min(1, totalElapsedBars / _totalBars) : 0;

  // ── V3: Tension waves modulation ──
  // Apply 5-wave tension curve over the base phase densities.
  // Picco a 0.65-0.85 of arc (not 0.5) — replaces flat fade-in feel.
  if (CFG.MUSIC_STRUCTURAL) {
    const tw = _computeTensionMultipliers(worldState.arc);
    worldState.density.rhythm  = _phaseDensityBase.rhythm  * tw.rhythm;
    worldState.density.melody  = _phaseDensityBase.melody  * tw.melody;
    worldState.density.bass    = _phaseDensityBase.bass    * tw.bass;
    worldState.density.harmony = _phaseDensityBase.harmony * tw.harmony;
    worldState.density.texture = _phaseDensityBase.texture * tw.texture;
  }

  // ── V3: Degradation arc in dissoluzione (Hecker §A.7) ──
  // Final 16 bars of dissoluzione: progressive note-drop, jitter, chord stripping.
  // Outside the window, degradation is reset to inert defaults.
  if (CFG.MUSIC_STRUCTURAL && PHASE_ORDER[_phaseIdx] === 'dissoluzione') {
    const phaseDur = _track.phases.dissoluzione || 0;
    const barsLeft = phaseDur - _phaseBars;
    if (barsLeft <= 16 && barsLeft >= 0) {
      // 0 at bar -16, 1 at bar 0 (last bar of dissoluzione)
      const t = 1 - (barsLeft / 16);
      worldState.degradation.noteDropProb   = t * 0.4;
      worldState.degradation.timingJitterMs = 5 + t * 20;
      // 4 → 3 → 2 → 1 in 4 quartiles
      if (t < 0.25)      worldState.degradation.chordNoteCount = 4;
      else if (t < 0.5)  worldState.degradation.chordNoteCount = 3;
      else if (t < 0.75) worldState.degradation.chordNoteCount = 2;
      else               worldState.degradation.chordNoteCount = 1;
    } else {
      worldState.degradation.noteDropProb   = 0;
      worldState.degradation.timingJitterMs = 0;
      worldState.degradation.chordNoteCount = 99;
    }

    // ── Convergenza automatica nell'ultimo 15% della dissoluzione ──
    const dissolveDur = _track.phases.dissoluzione || 0;
    if (dissolveDur > 0) {
      const progress = _phaseBars / dissolveDur;
      firma.convergenza = progress > 0.85;
    }
  } else {
    worldState.degradation.noteDropProb   = 0;
    worldState.degradation.timingJitterMs = 0;
    worldState.degradation.chordNoteCount = 99;
    // Reset convergenza outside dissoluzione
    if (firma.convergenza) firma.convergenza = false;
  }

  // Advance phase if bar count exceeded
  const phaseName = PHASE_ORDER[_phaseIdx];
  const phaseDurBars = _track.phases[phaseName] || 16;

  _updateRupture(phaseName, _phaseBars, phaseDurBars);

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

  // Bar progress: position within current bar (0→1) — for scan lines, visual sync
  worldState.barProgress = barDuration > 0 ? Math.min(1, _barAcc / barDuration) : 0;

  // Audio-reactive energy: real-time modulation on top of phase-based density
  // Combines RMS, onset bursts, and narrative intensity
  const rms = audio.rms || 0;
  const intensity = state.intensity || 0;
  const onsetBoost = audio.onset ? 0.15 : 0;
  const rawEnergy = rms * 0.4 + intensity * 0.4 + onsetBoost + (audio.flux || 0) * 0.3;
  // Smooth with EMA (fast attack, slow release)
  const prev = worldState.audioEnergy || 0;
  worldState.audioEnergy = rawEnergy > prev
    ? prev + (rawEnergy - prev) * 0.3    // fast attack
    : prev + (rawEnergy - prev) * 0.05;  // slow release
}

// ── V3: Wall of Sound (Hecker §A.7) ──
// Single monolithic gesture: 6-8 simultaneous notes spread across CH2/CH4/CH5,
// MIDI 36-72, vel 60-80, 8 bars long. Not a progression — a *declaration*.
// 2-3 per concert: TEMPESTA peak, RITORNO false resolution rebound.
function _triggerWallOfSound(label) {
  const scale = worldState.scale || [0, 2, 4, 5, 7, 9, 11];
  const root  = worldState.root || 60;
  const bpm   = worldState.bpm || 96;
  const durMs = Math.round((60 / bpm) * 4 * 8 * 1000); // 8 bars
  const channels = [2, 4, 5]; // CH2 drone, CH4 chords, CH5 voice

  // Build a sorted scale-tone pool spanning MIDI 36-72
  const rootPC = root % 12;
  const pool = [];
  for (let oct = -3; oct <= 3; oct++) {
    for (const s of scale) {
      const n = rootPC + s + (oct * 12) + 60;
      if (n >= 36 && n <= 72) pool.push(n);
    }
  }
  pool.sort((a, b) => a - b);
  if (pool.length === 0) return;

  // Pick 6-8 notes evenly spread across the pool
  const noteCount = 6 + Math.floor(Math.random() * 3);
  const notes = [];
  for (let i = 0; i < noteCount; i++) {
    const idx = Math.round((i / (noteCount - 1)) * (pool.length - 1));
    notes.push(pool[idx]);
  }

  notes.forEach((note, i) => {
    const ch  = channels[i % channels.length];
    const vel = 60 + Math.round(Math.random() * 20); // 60-80
    sendMIDINote(ch, note, vel, durMs);
  });

  console.log(`[DIR3] ═══ WALL OF SOUND (${label}) — ${notes.length} note, 8 bar ═══`);
}

// ── Auto-advance to next track in album order ──
function _advanceTrack() {
  const currentIdx = TRACK_ORDER.indexOf(worldState.track);
  const nextIdx = currentIdx + 1;

  // V2 structural silences removed — replaced by overlap transitions (V3.5)

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
        sendMIDIAllNotesOff();
        initDirector3(TRACK_ORDER[i]);
        _paused = false; // keep playing
        return;
      }
    }
    _paused = true;
    console.log('[DIR3] No more defined tracks.');
    return;
  }

  // Clean cut: silence all ringing notes before loading new track
  sendMIDIAllNotesOff();
  console.log(`[DIR3] → Next track: ${nextTrack}`);
  initDirector3(nextTrack);
  _paused = false; // keep playing — don't reset to paused
}

// ── V3: Rupture 4-stage envelope ──
// Stage boundaries as fraction of the rottura phase duration.
// Intensity builds through omen/infiltration, peaks at takeover, decays in residue.
const _RUPTURE_STAGE_BOUNDS = [
  { name: 'omen',         start: 0.00, end: 0.20 },
  { name: 'infiltration', start: 0.20, end: 0.50 },
  { name: 'takeover',     start: 0.50, end: 0.80 },
  { name: 'residue',      start: 0.80, end: 1.00 },
];

function _updateRupture(phaseName, phaseBars, phaseDurBars) {
  if (phaseName !== 'rottura' || phaseDurBars <= 0) {
    worldState.rupture.stage     = null;
    worldState.rupture.stageT    = 0;
    worldState.rupture.t         = 0;
    worldState.rupture.intensity = 0;
    return;
  }
  const t = Math.min(1, phaseBars / phaseDurBars);
  worldState.rupture.t = t;

  // Find current stage (last bound is the fallback)
  let s = _RUPTURE_STAGE_BOUNDS[_RUPTURE_STAGE_BOUNDS.length - 1];
  for (const b of _RUPTURE_STAGE_BOUNDS) {
    if (t < b.end) { s = b; break; }
  }
  const stageT = Math.min(1, (t - s.start) / (s.end - s.start));
  worldState.rupture.stage  = s.name;
  worldState.rupture.stageT = stageT;

  // Intensity envelope per stage
  const intensityMap = {
    omen:         stageT * 0.40,
    infiltration: 0.40 + stageT * 0.35,
    takeover:     0.75 + stageT * 0.25,
    residue:      1.00 - stageT,
  };
  worldState.rupture.intensity = intensityMap[s.name] ?? 0;
}

// ── V3: Tension waves (RESEARCH-V4 §B.1) ──
// 5 escalating waves over the concert arc — picco a 0.65-0.85, NOT a 0.5.
// Each wave has a sin-shaped local arc with a valley between waves.
// Solves "concerto suona come fade-in di 43 minuti" diagnosis.
const _TENSION_WAVES = [
  { start: 0.00, end: 0.25, peak: 0.40 },
  { start: 0.25, end: 0.45, peak: 0.55 },
  { start: 0.45, end: 0.65, peak: 0.70 },
  { start: 0.65, end: 0.85, peak: 0.95 },  // climax — picco massimo all'80%
  { start: 0.85, end: 1.00, peak: 0.50 },  // release final
];

function _computeTension(arc) {
  for (const w of _TENSION_WAVES) {
    if (arc >= w.start && arc < w.end) {
      const pos = (arc - w.start) / (w.end - w.start);
      const shape = Math.sin(pos * Math.PI); // 0..1..0
      return w.peak * shape;
    }
  }
  return 0;
}

// Map tension (0..0.95) → per-dimension multipliers around 1.0.
// Melody is in *contromovimento* with rhythm: high rhythm → rare melody.
function _computeTensionMultipliers(arc) {
  const t = _computeTension(arc);
  return {
    rhythm:  0.55 + t * 0.55,   // 0.55 to ~1.07 — main tension carrier
    melody:  1.10 - t * 0.30,   // 1.10 to ~0.81 — counter
    bass:    0.85 + t * 0.25,   // 0.85 to ~1.09
    harmony: 0.90 + t * 0.15,   // 0.90 to ~1.04
    texture: 0.65 + t * 0.50,   // 0.65 to ~1.13
  };
}

// ── Apply phase: update density, energy, registers, velocity ceilings ──
function _applyPhase() {
  const phaseName = PHASE_ORDER[_phaseIdx];
  worldState.phase = phaseName;
  worldState.energy = PHASE_ENERGY[phaseName] || 'SILENCE';

  // Density = track base × phase multiplier
  const pd = PHASE_DENSITY[phaseName];
  for (const mod of ['rhythm', 'harmony', 'bass', 'melody', 'texture']) {
    const base = (_track.density[mod] || 0) * (pd[mod] || 0);
    _phaseDensityBase[mod] = base;
    worldState.density[mod] = base;
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

  // V2 ext: Frahm phase-modulated velocity range (extension of MUSIC_EXPERIMENT)
  // Scales the per-track ceiling by a phase factor (pp on germoglio, ff on rottura).
  if (CFG.MUSIC_EXPERIMENT) {
    const scale = PHASE_VEL_SCALE[phaseName] ?? 1.0;
    for (const k of Object.keys(worldState.velocityCeiling)) {
      worldState.velocityCeiling[k] = Math.min(127, Math.round(worldState.velocityCeiling[k] * scale));
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
