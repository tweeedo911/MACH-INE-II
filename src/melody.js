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

// ── Phrase generation: musician styles ──
// Voice = cantante lirico: salti ampi, respira tra le frasi
const VOICE_STYLE = { step: 0.40, skip: 0.70, repeatProb: 0.05 };
// Lead = secondo strumento nervoso: intervalli stretti, note ripetute, percussivo
const LEAD_STYLE  = { step: 0.50, skip: 0.85, repeatProb: 0.25 };

// ── Phrase length range ──
const PHRASE_LEN_MIN = 8;
const PHRASE_LEN_MAX = 12;
const PHRASE_LEN_GERMOGLIO = 1;  // single note in germoglio

// ── Phrase repetition for memorability ──
const MAX_PHRASE_REPEATS = 2;

// ── Lead response probability and interval ──
const LEAD_PROB        = 0.40;   // 40% chance of call-response
const LEAD_MIN_DENSITY = 0.3;    // minimum density for lead
const LEAD_INTERVALS   = [1, 2, 3]; // 2nd, 2nd, minor 3rd — tight, nervous
const LEAD_VEL_SCALE   = 0.85;   // lead velocity relative to voice
const LEAD_DUR_SCALE   = 0.6;    // lead plays shorter notes than voice

// ── Arp velocity and duration parameters ──
const ARP_MIN_DENSITY = 0.3;
const ARP_VEL_BASE    = 35;
const ARP_VEL_RANGE   = 30;
const ARP_HUMANIZE    = 3;    // ±3 velocity jitter
const ARP_DUR_RATIO   = 0.85; // 85% of step interval
const ARP_DUCK_FACTOR = 0.4;  // arp velocity multiplier when lead is active
const ARP_DUCK_TICKS  = 8;    // how many ticks the arp stays ducked after lead

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
let _voiceRestUntilBar = 0; // breathing: voice rests until this bar after long phrase

// ── Lead (CH6) state — pending note queue (NO setTimeout) ──
let _pendingLead = null;  // { note, vel, dur } — fires on next tick

// ── Arp (CH7) state ──
let _arpPattern = [];     // current arp pattern (MIDI notes)
let _arpIdx = 0;          // position within arp cycle
let _lastChordStr = '';   // serialized chord for change detection
let _leadDuckCounter = 0; // ticks remaining for arp ducking after lead fires

// ── Lead solo mode (TESSUTO: lead plays independently) ──
let _leadPhraseNotes = [];
let _leadPhraseIdx = 0;
let _leadPhraseRepeat = 0;

export function initMelody() {
  _step = 0;
  _stepAcc = 0;
  _bar = 0;
  _phraseNotes = [];
  _phraseIdx = 0;
  _phraseRepeat = 0;
  _voiceRestUntilBar = 0;
  _pendingLead = null;
  _arpPattern = [];
  _arpIdx = 0;
  _lastChordStr = '';
  _leadDuckCounter = 0;
  _leadPhraseNotes = [];
  _leadPhraseIdx = 0;
  _leadPhraseRepeat = 0;
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

function _generatePhrase(scale, lo, hi, length, style = null) {
  const pool = scale.filter(n => n >= lo && n <= hi);
  if (pool.length === 0) return [];

  const stepProb   = style ? style.step : 0.70;
  const skipProb   = style ? style.skip : 0.90;
  const repeatProb = style ? (style.repeatProb || 0) : 0;

  const phrase = [];
  let poolIdx = Math.floor(Math.random() * pool.length);
  phrase.push(pool[poolIdx]);

  for (let i = 1; i < length; i++) {
    // Note repetition — lead character: rhythmic, percussive
    if (Math.random() < repeatProb) {
      phrase.push(pool[poolIdx]);
      continue;
    }

    const roll = Math.random();
    let jump;
    if (roll < stepProb) {
      jump = Math.random() < 0.5 ? -1 : 1;
    } else if (roll < skipProb) {
      jump = Math.random() < 0.5 ? -2 : 2;
    } else {
      jump = Math.random() < 0.5 ? -3 : 3;
    }

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
  const stepMs  = (60 / bpm / 4) * 1000;

  const [voiceLo, voiceHi] = worldState.register.melody;
  const [leadLo, leadHi]   = worldState.register.lead;
  const [arpLo, arpHi]     = worldState.register.arp;

  const track = TRACKS[worldState.track];
  const strat = (track && track.melodyStrategy) || {};
  const isGermoglio = phase === 'germoglio';

  // ──────────────────────────────────────────────
  //  0. Fire pending lead (top of tick, NO setTimeout)
  // ──────────────────────────────────────────────
  if (_pendingLead !== null) {
    sendMIDINote(CH_LEAD, _pendingLead.note, _pendingLead.vel, _pendingLead.dur);
    addMidiNote(CH_LEAD, _pendingLead.note / 127, _pendingLead.vel / 127);
    _pendingLead = null;
    _leadDuckCounter = ARP_DUCK_TICKS;
  }
  if (_leadDuckCounter > 0) _leadDuckCounter--;

  // ──────────────────────────────────────────────
  //  1. CH5 VOICE — driven by strategy
  // ──────────────────────────────────────────────
  const voiceEveryBars = strat.voiceEveryBars ?? 2;
  const voiceEnabled = voiceEveryBars > 0 && voiceLo > 0 && voiceHi > 0;

  if (voiceEnabled) {
    const voiceRate = VOICE_RATE[phase] ?? VOICE_RATE_DEFAULT;
    const barsGate = _step === 0 && _bar % voiceEveryBars === 0;
    const stepGate = isGermoglio ? barsGate : (_step % voiceRate === 0);
    // Only start new phrases on bar boundaries matching voiceEveryBars
    const canStartPhrase = barsGate && _phraseIdx >= _phraseNotes.length;

    // Voice breathing: skip if resting after a long phrase
    const voiceResting = _bar < _voiceRestUntilBar;

    if (!voiceResting && (stepGate || _phraseIdx < _phraseNotes.length) && density > 0.1) {
      // Generate phrase if exhausted
      if (_phraseIdx >= _phraseNotes.length) {
        if (_phraseRepeat < MAX_PHRASE_REPEATS && _phraseNotes.length > 0 && !canStartPhrase) {
          _phraseIdx = 0;
          _phraseRepeat++;
        } else if (canStartPhrase || _phraseNotes.length === 0) {
          // Breathing: rest proportional to phrase length (longer phrase → longer rest)
          if (_phraseNotes.length >= 6) {
            _voiceRestUntilBar = _bar + Math.ceil(_phraseNotes.length / 4);
          }
          const [minLen, maxLen] = strat.voicePhraseLen || [PHRASE_LEN_MIN, PHRASE_LEN_MAX];
          const len = isGermoglio ? 1 : minLen + Math.floor(Math.random() * (maxLen - minLen + 1));
          _phraseNotes = _generatePhrase(scale, voiceLo, voiceHi, Math.max(1, len), VOICE_STYLE);
          _phraseIdx = 0;
          _phraseRepeat = 0;
        }
      }

      // Play current note on step boundary
      if (_phraseIdx < _phraseNotes.length && stepGate) {
        const note = _phraseNotes[_phraseIdx];

        // Phrase-level velocity arc: soft → peak at 60% → soft (cantante lirico)
        const phrasePos = _phraseNotes.length > 1 ? _phraseIdx / (_phraseNotes.length - 1) : 0.5;
        const arc = Math.sin(phrasePos * Math.PI);
        _phraseIdx++;

        const rawVel = VOICE_VEL_BASE + density * VOICE_VEL_RANGE * (0.6 + 0.4 * arc);
        const humanize = Math.round((Math.random() * VOICE_HUMANIZE * 2) - VOICE_HUMANIZE);
        const vel = Math.min(Math.max(Math.round(rawVel + humanize), VOICE_VEL_FLOOR), velCeil);
        const dur = Math.round(stepMs * voiceRate * VOICE_DUR_RATIO);

        sendMIDINote(CH_VOICE, note, vel, dur);
        addMidiNote(CH_VOICE, note / 127, vel / 127);

        // Schedule lead response if mode is 'response'
        if (strat.leadMode === 'response' && !isGermoglio && density >= LEAD_MIN_DENSITY) {
          const lp = strat.leadProb ?? LEAD_PROB;
          if (Math.random() < lp) {
            _scheduleLead(note, vel, stepMs, voiceRate, scale, leadLo, leadHi, velCeil);
          }
        }

        // Schedule lead echo if mode is 'echo'
        if (strat.leadMode === 'echo' && !isGermoglio) {
          const lp = strat.leadProb ?? 0.3;
          if (Math.random() < lp) {
            const echoVel = Math.round(vel * 0.55); // much softer
            _pendingLead = { note: _snapToScale(note, scale), vel: Math.min(echoVel, velCeil), dur: Math.round(dur * 1.5) };
          }
        }

        // Hocket mode: voice played, lead plays next note on next tick
        if (strat.leadMode === 'hocket' && _phraseIdx < _phraseNotes.length) {
          const hocketNote = _phraseNotes[_phraseIdx];
          _phraseIdx++; // consume two notes per tick pair
          let hn = hocketNote;
          hn = Math.max(leadLo, Math.min(leadHi, hn));
          hn = _snapToScale(hn, scale);
          hn = Math.max(leadLo, Math.min(leadHi, hn));
          _pendingLead = { note: hn, vel: Math.min(vel, velCeil), dur };
        }
      }
    }
  }

  // ──────────────────────────────────────────────
  //  2. CH6 LEAD solo mode (independent, not response to voice)
  // ──────────────────────────────────────────────
  if (strat.leadMode === 'solo' && leadLo > 0 && leadHi > 0 && density > 0.1 && !isGermoglio) {
    const leadEvery = strat.leadEveryBars || 2;
    const leadRate = VOICE_RATE[phase] ?? VOICE_RATE_DEFAULT;
    const barsGate = _step === 0 && _bar % leadEvery === 0;

    // Lead solo: nervous, tight intervals, note repetitions
    if (_leadPhraseIdx >= _leadPhraseNotes.length && barsGate) {
      const [minLen, maxLen] = strat.leadPhraseLen || [4, 8];
      const len = minLen + Math.floor(Math.random() * (maxLen - minLen + 1));
      _leadPhraseNotes = _generatePhrase(scale, leadLo, leadHi, len, LEAD_STYLE);
      _leadPhraseIdx = 0;
      _leadPhraseRepeat = 0;
    } else if (_leadPhraseIdx >= _leadPhraseNotes.length && _leadPhraseRepeat < MAX_PHRASE_REPEATS && _leadPhraseNotes.length > 0) {
      _leadPhraseIdx = 0;
      _leadPhraseRepeat++;
    }

    if (_leadPhraseIdx < _leadPhraseNotes.length && _step % leadRate === 0) {
      const note = _leadPhraseNotes[_leadPhraseIdx];
      _leadPhraseIdx++;
      // Lead: more attack, less sustain — percussive character
      const rawVel = (VOICE_VEL_BASE + 5) + density * VOICE_VEL_RANGE;
      const humanize = Math.round((Math.random() * 4) - 2); // tighter humanize (±2)
      const vel = Math.min(Math.max(Math.round(rawVel + humanize), VOICE_VEL_FLOOR), velCeil);
      const dur = Math.round(stepMs * leadRate * LEAD_DUR_SCALE);
      sendMIDINote(CH_LEAD, note, vel, dur);
      addMidiNote(CH_LEAD, note / 127, vel / 127);
    }
  }

  // ──────────────────────────────────────────────
  //  3. CH7 ARP — role from strategy
  // ──────────────────────────────────────────────
  const arpRole = strat.arpRole || 'accompany';
  if (arpRole === 'none') return;

  // Dying arp: only in pulsazione phase
  if (arpRole === 'dying' && phase !== 'pulsazione') return;

  // Rebuild arp when chord changes
  const chordStr = worldState.currentChord ? worldState.currentChord.join(',') : '';
  if (chordStr !== _lastChordStr) {
    _lastChordStr = chordStr;
    const noteCount = (track && track.arpNotes) || 4;
    _arpPattern = _buildArp(worldState.currentChord, scale, arpLo, arpHi, noteCount);
    _arpIdx = 0;
  }

  const arpInGermoglio = arpRole === 'protagonist';
  if ((arpInGermoglio || !isGermoglio) && density >= ARP_MIN_DENSITY && _arpPattern.length > 0) {
    const arpRate = (track && track.arpRate) || 8;
    const arpStepInterval = Math.max(1, Math.round(16 / arpRate));

    if (_step % arpStepInterval === 0) {
      const arpNote = _arpPattern[_arpIdx % _arpPattern.length];
      _arpIdx = (_arpIdx + 1) % _arpPattern.length;

      const arpVelMul = strat.arpVelScale ?? 0.7;
      const duckMul = _leadDuckCounter > 0 ? ARP_DUCK_FACTOR : 1.0;
      // Accent on quarter note boundaries — sequencer-like pulse
      const accentMul = (_step % 4 === 0) ? 1.15 : 0.9;
      const rawArpVel = (ARP_VEL_BASE + density * ARP_VEL_RANGE) * arpVelMul * duckMul * accentMul;
      const arpHumanize = Math.round((Math.random() * ARP_HUMANIZE * 2) - ARP_HUMANIZE);
      const arpVel = Math.min(Math.max(Math.round(rawArpVel + arpHumanize), 1), velCeil);
      const arpDur = Math.round(stepMs * arpStepInterval * ARP_DUR_RATIO);

      sendMIDINote(CH_ARP, arpNote, arpVel, arpDur);
      addMidiNote(CH_ARP, arpNote / 127, arpVel / 127);
    }
  }
}

// ── Helper: schedule lead response note ──
function _scheduleLead(voiceNote, voiceVel, stepMs, voiceRate, scale, leadLo, leadHi, velCeil) {
  const interval = LEAD_INTERVALS[Math.floor(Math.random() * LEAD_INTERVALS.length)];
  const direction = Math.random() < 0.5 ? 1 : -1;
  let responseNote = voiceNote + (interval * direction);
  responseNote = Math.max(leadLo, Math.min(leadHi, responseNote));
  responseNote = _snapToScale(responseNote, scale);
  responseNote = Math.max(leadLo, Math.min(leadHi, responseNote));
  const leadVel = Math.min(Math.round(voiceVel * LEAD_VEL_SCALE), velCeil);
  const leadDur = Math.round(stepMs * voiceRate * LEAD_DUR_SCALE);
  _pendingLead = { note: responseNote, vel: leadVel, dur: leadDur };
}
