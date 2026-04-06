// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Melody Module
//  CH5 Voice + CH6 Lead + CH7 Arp
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';
import { TRACKS } from './tracks.js';

// ── Channel assignments ──
const CH_VOICE = 5;   // CH5 = VOICE (melodic phrases)
const CH_LEAD  = 6;   // CH6 = LEAD (call-response)
const CH_ARP   = 7;   // CH7 = ARP (chord-derived pattern)

// ── Voice rate per phase (in 16th-note steps between notes) ──
const VOICE_RATE = {
  germoglio:    8,   // slow — every 8 steps (half note)
  pulsazione:   4,   // moderate — every 4 steps (quarter note)
  densita:      2,   // fast — every 2 steps (8th note)
  rottura:      2,   // fast
  dissoluzione: 4,   // winding down
};
const VOICE_RATE_DEFAULT = 4;

// ── Phrase generation: interval probabilities ──
const INTERVAL_STEP = 0.70;   // 70% step (±1 scale degree)
const INTERVAL_SKIP = 0.90;   // 20% skip (±2), cumulative threshold
// remaining 10% = leap (±3)

// ── Phrase length range ──
const PHRASE_LEN_MIN = 8;
const PHRASE_LEN_MAX = 12;
const PHRASE_LEN_GERMOGLIO = 1;  // single note in germoglio

// ── Phrase repetition for memorability ──
const MAX_PHRASE_REPEATS = 2;

// ── Lead response probability and interval ──
const LEAD_PROB        = 0.40;   // 40% chance of call-response
const LEAD_MIN_DENSITY = 0.3;    // minimum density for lead
const LEAD_INTERVALS   = [3, 4]; // minor third, major third (semitones)
const LEAD_VEL_SCALE   = 0.85;   // lead velocity relative to voice

// ── Arp velocity and duration parameters ──
const ARP_MIN_DENSITY = 0.3;
const ARP_VEL_BASE    = 35;
const ARP_VEL_RANGE   = 30;
const ARP_HUMANIZE    = 3;    // ±3 velocity jitter
const ARP_DUR_RATIO   = 0.85; // 85% of step interval

// ── Voice velocity parameters ──
const VOICE_VEL_FLOOR = 40;
const VOICE_VEL_BASE  = 45;
const VOICE_VEL_RANGE = 35;
const VOICE_HUMANIZE  = 6;    // ±6 velocity jitter
const VOICE_DUR_RATIO = 0.9;  // 90% of step interval

// ── Step clock state ──
let _step = 0;
let _stepAcc = 0;
let _bar = 0;

// ── Voice (CH5) state ──
let _phraseNotes = [];    // current phrase MIDI note array
let _phraseIdx = 0;       // position within phrase
let _phraseRepeat = 0;    // how many times current phrase has repeated

// ── Lead (CH6) state — pending note queue (NO setTimeout) ──
let _pendingLead = null;  // { note, vel, dur } — fires on next tick

// ── Arp (CH7) state ──
let _arpPattern = [];     // current arp pattern (MIDI notes)
let _arpIdx = 0;          // position within arp cycle
let _lastChordStr = '';   // serialized chord for change detection

export function initMelody() {
  _step = 0;
  _stepAcc = 0;
  _bar = 0;
  _phraseNotes = [];
  _phraseIdx = 0;
  _phraseRepeat = 0;
  _pendingLead = null;
  _arpPattern = [];
  _arpIdx = 0;
  _lastChordStr = '';
  console.log('[MELODY] Initialized');
}

export function updateMelody(dt) {
  if (worldState.density.melody < 0.01) return;

  const bpm = worldState.bpm || 60;
  const stepDur = 60 / bpm / 4;
  _stepAcc += dt;

  while (_stepAcc >= stepDur) {
    _stepAcc -= stepDur;
    _tick();
    _step = (_step + 1) % 16;
    if (_step === 0) _bar++;
  }
}

// ═══════════════════════════════════════════════════════════
//  Phrase Generator — Markov-style melodic line
// ═══════════════════════════════════════════════════════════

function _generatePhrase(scale, lo, hi, length) {
  // Filter scale notes to [lo, hi] register range
  const pool = scale.filter(n => n >= lo && n <= hi);
  if (pool.length === 0) return [];

  const phrase = [];
  // Start on a random note from the pool
  let poolIdx = Math.floor(Math.random() * pool.length);
  phrase.push(pool[poolIdx]);

  for (let i = 1; i < length; i++) {
    const roll = Math.random();
    let jump;
    if (roll < INTERVAL_STEP) {
      // Step: ±1 scale degree
      jump = Math.random() < 0.5 ? -1 : 1;
    } else if (roll < INTERVAL_SKIP) {
      // Skip: ±2 scale degrees
      jump = Math.random() < 0.5 ? -2 : 2;
    } else {
      // Leap: ±3 scale degrees
      jump = Math.random() < 0.5 ? -3 : 3;
    }

    // Clamp to pool bounds
    poolIdx = Math.max(0, Math.min(pool.length - 1, poolIdx + jump));
    phrase.push(pool[poolIdx]);
  }

  return phrase;
}

// ═══════════════════════════════════════════════════════════
//  Arp Builder — pattern from currentChord + scale
// ═══════════════════════════════════════════════════════════

function _buildArp(chord, scale, lo, hi, noteCount) {
  if (!chord || chord.length === 0) return [];

  const pool = new Set();

  // Transpose chord notes into [lo, hi] range, add octave copies
  for (const n of chord) {
    let shifted = n;
    while (shifted < lo) shifted += 12;
    while (shifted > hi) shifted -= 12;
    if (shifted >= lo && shifted <= hi) pool.add(shifted);

    // Add octave copies if they fit
    const up = shifted + 12;
    if (up >= lo && up <= hi) pool.add(up);
    const down = shifted - 12;
    if (down >= lo && down <= hi) pool.add(down);
  }

  // Fill remaining slots with scale passing tones in register
  if (pool.size < noteCount) {
    const scaleTones = scale.filter(n => n >= lo && n <= hi);
    for (const n of scaleTones) {
      pool.add(n);
      if (pool.size >= noteCount * 2) break; // enough candidates
    }
  }

  // Sort ascending — simple repeating pattern, not up-down
  const sorted = [...pool].sort((a, b) => a - b);
  if (sorted.length === 0) return [];

  // Pick evenly spaced notes — ascending only (hypnotic, metronomic)
  const picked = [];
  if (sorted.length <= noteCount) {
    picked.push(...sorted);
  } else {
    for (let i = 0; i < noteCount; i++) {
      const idx = Math.round(i * (sorted.length - 1) / (noteCount - 1));
      picked.push(sorted[idx]);
    }
  }

  // Return ascending pattern — it will loop naturally, creating repetition
  return picked;
}

// ═══════════════════════════════════════════════════════════
//  Scale snapping — find closest scale note to a given MIDI pitch
// ═══════════════════════════════════════════════════════════

function _snapToScale(note, scale) {
  let closest = scale[0];
  let minDist = Math.abs(note - closest);
  for (let i = 1; i < scale.length; i++) {
    const dist = Math.abs(note - scale[i]);
    if (dist < minDist) {
      minDist = dist;
      closest = scale[i];
    }
  }
  return closest;
}

// ═══════════════════════════════════════════════════════════
//  Tick — all three voices
// ═══════════════════════════════════════════════════════════

function _tick() {
  const phase   = worldState.phase || 'germoglio';
  const density = worldState.density.melody;
  const velCeil = worldState.velocityCeiling.melody || 127;
  const scale   = worldState.scale;
  const bpm     = worldState.bpm || 60;
  const stepMs  = (60 / bpm / 4) * 1000;  // ms per 16th note

  const [voiceLo, voiceHi] = worldState.register.melody;
  const [leadLo, leadHi]   = worldState.register.lead;
  const [arpLo, arpHi]     = worldState.register.arp;

  const track = TRACKS[worldState.track];
  const isGermoglio = phase === 'germoglio';

  // ──────────────────────────────────────────────
  //  1. Fire pending lead note (top of tick, NO setTimeout)
  // ──────────────────────────────────────────────
  if (_pendingLead !== null) {
    sendMIDINote(CH_LEAD, _pendingLead.note, _pendingLead.vel, _pendingLead.dur);
    addMidiNote(CH_LEAD, _pendingLead.note / 127, _pendingLead.vel / 127);
    _pendingLead = null;
  }

  // ──────────────────────────────────────────────
  //  2. CH5 VOICE — melodic phrases
  // ──────────────────────────────────────────────
  const voiceRate = VOICE_RATE[phase] ?? VOICE_RATE_DEFAULT;

  // In germoglio: only play on bar boundaries every 4 bars
  const voiceGate = isGermoglio
    ? (_step === 0 && _bar % 4 === 0)
    : (_step % voiceRate === 0);

  if (voiceGate && density > 0.1) {
    // Phrase management: exhausted → repeat or generate new
    if (_phraseIdx >= _phraseNotes.length) {
      if (_phraseRepeat < MAX_PHRASE_REPEATS && _phraseNotes.length > 0) {
        // Repeat for memorability
        _phraseIdx = 0;
        _phraseRepeat++;
      } else {
        // Generate new phrase
        const len = isGermoglio
          ? PHRASE_LEN_GERMOGLIO
          : PHRASE_LEN_MIN + Math.floor(Math.random() * (PHRASE_LEN_MAX - PHRASE_LEN_MIN + 1));
        _phraseNotes = _generatePhrase(scale, voiceLo, voiceHi, len);
        _phraseIdx = 0;
        _phraseRepeat = 0;
      }
    }

    if (_phraseIdx < _phraseNotes.length) {
      const note = _phraseNotes[_phraseIdx];
      _phraseIdx++;

      // Velocity: base + density scaling, humanized, clamped to ceiling
      const rawVel = VOICE_VEL_BASE + density * VOICE_VEL_RANGE;
      const humanize = Math.round((Math.random() * VOICE_HUMANIZE * 2) - VOICE_HUMANIZE);
      const vel = Math.min(Math.max(Math.round(rawVel + humanize), VOICE_VEL_FLOOR), velCeil);
      const dur = Math.round(stepMs * voiceRate * VOICE_DUR_RATIO);

      sendMIDINote(CH_VOICE, note, vel, dur);
      addMidiNote(CH_VOICE, note / 127, vel / 127);

      // ──────────────────────────────────────────
      //  3. CH6 LEAD — call-response (schedule for NEXT tick)
      // ──────────────────────────────────────────
      if (!isGermoglio && density > LEAD_MIN_DENSITY && Math.random() < LEAD_PROB) {
        // Response interval: minor or major third
        const interval = LEAD_INTERVALS[Math.floor(Math.random() * LEAD_INTERVALS.length)];
        const direction = Math.random() < 0.5 ? 1 : -1;
        let responseNote = note + (interval * direction);

        // Clamp to lead register
        responseNote = Math.max(leadLo, Math.min(leadHi, responseNote));

        // Snap to closest scale note
        responseNote = _snapToScale(responseNote, scale);

        // Final register clamp after snapping
        responseNote = Math.max(leadLo, Math.min(leadHi, responseNote));

        const leadVel = Math.min(Math.round(vel * LEAD_VEL_SCALE), velCeil);
        const leadDur = Math.round(stepMs * voiceRate * VOICE_DUR_RATIO);

        // Queue for next tick — no setTimeout
        _pendingLead = { note: responseNote, vel: leadVel, dur: leadDur };
      }
    }
  }

  // ──────────────────────────────────────────────
  //  4. CH7 ARP — repetitive pattern from currentChord
  // ──────────────────────────────────────────────

  // Rebuild arp when chord changes
  const chordStr = worldState.currentChord ? worldState.currentChord.join(',') : '';
  if (chordStr !== _lastChordStr) {
    _lastChordStr = chordStr;
    const noteCount = (track && track.arpNotes) || 4;
    _arpPattern = _buildArp(worldState.currentChord, scale, arpLo, arpHi, noteCount);
    _arpIdx = 0;
  }

  // Arp active: not in germoglio, density above threshold, pattern exists
  if (!isGermoglio && density > ARP_MIN_DENSITY && _arpPattern.length > 0) {
    // arpRate 8 = 8th notes = every 2 steps; 16 = 16th notes = every step
    const arpRate = (track && track.arpRate) || 8;
    const arpStepInterval = Math.max(1, Math.round(16 / arpRate));

    if (_step % arpStepInterval === 0) {
      const arpNote = _arpPattern[_arpIdx % _arpPattern.length];
      _arpIdx = (_arpIdx + 1) % _arpPattern.length;

      // Velocity: base + density scaling, humanized, scaled down
      const rawArpVel = (ARP_VEL_BASE + density * ARP_VEL_RANGE) * 0.7;
      const arpHumanize = Math.round((Math.random() * ARP_HUMANIZE * 2) - ARP_HUMANIZE);
      const arpVel = Math.min(Math.max(Math.round(rawArpVel + arpHumanize), 1), velCeil);
      const arpDur = Math.round(stepMs * arpStepInterval * ARP_DUR_RATIO);

      sendMIDINote(CH_ARP, arpNote, arpVel, arpDur);
      addMidiNote(CH_ARP, arpNote / 127, arpVel / 127);
    }
  }
}
