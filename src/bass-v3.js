// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Bass Module V3 (structural)
//  CH3 Bass — STRUCTURAL EXPERIMENT (post-RESEARCH-V4 2026-04-07)
//
//  Cycle extension (RESEARCH-V4 §B.4):
//  Bass loop starts as 1 bar. After ~8 stable bars, extends to 2 bars
//  (with a variation in bar 2). After another 8 stable bars, extends to
//  4 bars (variations in bars 2/3/4). The bass enriches by *extending the
//  cycle*, not by adding notes — solves "bass loop is predictable after
//  3 cycles" diagnosis from the Critico.
//
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';
import { TRACKS } from './tracks.js';

// Reads master clock from worldState.globalTick (written by rhythm.js).
let _step = 0;
let _bar = 0;
let _lastTick = -1;
let _lastNote = -1;
let _velSweep = 0;
let _lastFollowChord = '';

// V3: cycle extension state
let _cycleStage = 1;          // 1, 2, or 4 — current cycle length in bars
let _stableBars = 0;          // bars elapsed at current stage with stable bass
let _variations = [];         // pre-computed variation patterns for bars > 0
let _lastTrackName = '';
let _lastBasePattern = null;
const STABLE_BARS_PER_STAGE = 8;

export function initBass() {
  _step = 0;
  _bar = 0;
  _lastTick = worldState.globalTick;  // sync to master clock
  _cycleStage = 1;
  _stableBars = 0;
  _variations = [];
  _lastTrackName = '';
  _lastBasePattern = null;
  console.log('[BASS-V3] Initialized (cycle extension)');
}

// Build a variation of the base pattern at the requested level (1..3).
// Variations are deterministic shifts/swaps of the base pattern — they keep
// the same density/character but feel "different" when looped against bar 0.
function _buildVariation(basePattern, level) {
  // Rotate by 4 steps (= one quarter note) — keeps groove but moves accents
  const rot = 4;
  const rotated = [...basePattern.slice(rot), ...basePattern.slice(0, rot)];
  if (level === 1) return rotated;

  // Level 2: rotate + swap two pairs of steps
  const r2 = [...rotated];
  const swaps = [[2, 6], [10, 14]];
  for (const [a, b] of swaps) {
    const tmp = r2[a]; r2[a] = r2[b]; r2[b] = tmp;
  }
  if (level === 2) return r2;

  // Level 3: rotate + swap + add a ghost on offbeat (only if step is empty)
  const r3 = [...r2];
  const ghostSteps = [3, 11];
  for (const s of ghostSteps) {
    if (r3[s] === 0 && basePattern.some(n => n > 0)) {
      // Pick a low offset reused from existing pattern
      const positives = basePattern.filter(n => n > 0);
      r3[s] = positives[0];
    }
  }
  return r3;
}

function _resetCycle(basePattern, trackName) {
  _cycleStage = 1;
  _stableBars = 0;
  _variations = [];
  _lastBasePattern = basePattern;
  _lastTrackName = trackName;
}

function _advanceCycleStage(basePattern) {
  if (_cycleStage === 1) {
    _cycleStage = 2;
    _variations = [_buildVariation(basePattern, 1)];
    _stableBars = 0;
    console.log('[BASS-V3] cycle 1 → 2 bar');
  } else if (_cycleStage === 2) {
    _cycleStage = 4;
    _variations = [
      _buildVariation(basePattern, 1),
      _buildVariation(basePattern, 2),
      _buildVariation(basePattern, 3),
    ];
    _stableBars = 0;
    console.log('[BASS-V3] cycle 2 → 4 bar');
  }
  // stage 4 = max — no further extension
}

export function updateBass(dt) {
  if (!worldState.bpm || worldState.density.bass < 0.01) return;

  // Catch up to master clock (rhythm.js owns the only stepAcc)
  while (_lastTick < worldState.globalTick) {
    _lastTick++;
    _step = _lastTick % 16;
    _bar  = Math.floor(_lastTick / 16);
    _tick();
  }
}

function _tick() {
  const track = TRACKS[worldState.track];
  if (!track) return;

  const pattern = track.bassPattern;
  const root    = worldState.root;
  const density = worldState.density.bass;
  const ceiling = worldState.velocityCeiling.bass;
  const [regLo, regHi] = worldState.register.bass;
  const bpm = worldState.bpm;
  if (!bpm) return;

  _velSweep = 0.85 + 0.15 * Math.sin((_bar % 8) / 8 * Math.PI * 2);

  const stepMs = (60 / bpm / 4) * 1000;
  const beatMs = (60 / bpm) * 1000;

  // ═══ Mode A: Follow harmony — long notes on chord changes ═══
  if (!pattern) {
    const chordStr = worldState.currentChord ? worldState.currentChord.join(',') : '';
    if (chordStr && chordStr !== _lastFollowChord && _step === 0) {
      _lastFollowChord = chordStr;

      let bassNote = Math.min(...worldState.currentChord);
      while (bassNote > regHi) bassNote -= 12;
      while (bassNote < regLo) bassNote += 12;
      if (bassNote < regLo || bassNote > regHi) bassNote = root;

      const baseVel = (45 + density * 35) * _velSweep;
      const humanize = (Math.random() * 6) - 3;
      const vel = Math.round(Math.max(1, Math.min(ceiling, baseVel + humanize)));
      const dur = Math.round(beatMs * 14);

      sendMIDINote(3, bassNote, vel, dur);
      addMidiNote(3, bassNote / 127, vel / 127);
    }
    return;
  }

  // ═══ Mode B: Pattern-based — independent loop ═══
  // V3: cycle extension — select active pattern based on _bar % _cycleStage
  let activePattern = pattern;
  if (CFG.MUSIC_STRUCTURAL) {
    // Reset cycle on track or pattern change
    if (worldState.track !== _lastTrackName || pattern !== _lastBasePattern) {
      _resetCycle(pattern, worldState.track);
    }
    // Track stable bars (only on bar boundary, only when bass is meaningful)
    if (_step === 0 && density > 0.3) {
      _stableBars++;
      if (_stableBars >= STABLE_BARS_PER_STAGE) {
        _advanceCycleStage(pattern);
      }
    }
    // Pick variation for current bar of cycle
    const cycleBar = _bar % _cycleStage;
    if (cycleBar > 0 && _variations[cycleBar - 1]) {
      activePattern = _variations[cycleBar - 1];
    }
  }

  const offset = activePattern[_step];

  if (offset > 0) {
    const raw  = root + offset;
    const note = Math.max(regLo, Math.min(regHi, raw));

    const baseVel = (50 + density * 40) * _velSweep;
    const humanize = (Math.random() * 8) - 4;
    const vel = Math.round(Math.max(1, Math.min(ceiling, baseVel + humanize)));
    const dur = stepMs * 3;

    sendMIDINote(3, note, vel, dur);
    addMidiNote(3, note / 127, vel / 127);
    _lastNote = _step;

    if (_step % 4 === 0 && density > 0.4 && Math.random() < 0.20) {
      const fifth = note + 7;
      if (fifth <= regHi) {
        const fifthVel = Math.round(vel * 0.65);
        sendMIDINote(3, fifth, fifthVel, dur);
        addMidiNote(3, fifth / 127, fifthVel / 127);
      }
    }

  } else if (density > 0.5 && Math.random() < 0.12) {
    const prevStep = (_step + 15) % 16;
    const nextStep = (_step + 1) % 16;
    const adjacentToPlayed =
      (activePattern[prevStep] > 0) || (activePattern[nextStep] > 0);

    if (adjacentToPlayed) {
      const ghostVel = Math.round(20 + Math.random() * 10);
      const ghostNote = Math.max(regLo, Math.min(regHi, root));
      const ghostDur  = stepMs * 1.5;

      sendMIDINote(3, ghostNote, ghostVel, ghostDur);
      addMidiNote(3, ghostNote / 127, ghostVel / 127);
    }
  }
}
