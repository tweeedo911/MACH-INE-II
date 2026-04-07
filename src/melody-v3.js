// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Melody Module V3 (structural — Olafur call-response)
//  CH5 Voice + CH6 Lead + CH7 Arp
//  STRUCTURAL EXPERIMENT (post-RESEARCH-V4 2026-04-07)
//
//  Differenze rispetto a melody.js (v1):
//   - CALL-RESPONSE OFF-GRID: quando voice (CH5) suona, lead (CH6) risponde
//     dopo un delay reale di 200-500ms (non sul tick successivo).
//     Ispirazione: Olafur Arnalds Stratus system (RESEARCH-V4 §A.8).
//   - Risposta su intervalli consonanti: 3a/4a/5a (peso 3x verso chord tones).
//   - Il delay irregolare crea un dialogo musicale invece di due Markov paralleli.
//
//  NB: il pending-lead countdown è in dt (worker, ~2ms tick), quindi
//  sopravvive ai cambi di phase ed è preciso al millisecondo.
//
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { worldState, phaseState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';
import { TRACKS } from './tracks.js';

// ── Channel assignments ──
const CH_VOICE = 5;
const CH_LEAD  = 6;
const CH_ARP   = 7;

// ── Voice rate per phase (used for note duration scaling) ──
const VOICE_RATE = {
  germoglio:    8,
  pulsazione:   4,
  densita:      2,
  rottura:      2,
  dissoluzione: 4,
};
const VOICE_RATE_DEFAULT = 4;

// ── V3: Prime-length loop intervals (post-RESEARCH-V4 §A.4/A.9) ──
// Voice fires every N steps where N is prime → never syncs to 4/4 grid.
// LCM voice×lead = 5×7=35 (densita), 7×13=91 (pulsazione), 11×13=143 (germoglio).
// "Two melodies floating over the rhythm" vs "everything aligned in 4/4".
const VOICE_LOOP_STEPS = {
  germoglio:    11,
  pulsazione:   7,
  densita:      5,
  rottura:      5,
  dissoluzione: 11,
};
const VOICE_LOOP_DEFAULT = 7;

const LEAD_LOOP_STEPS = {
  germoglio:    13,
  pulsazione:   13,
  densita:      7,
  rottura:      7,
  dissoluzione: 13,
};
const LEAD_LOOP_DEFAULT = 13;

const VOICE_STYLE = { step: 0.40, skip: 0.70, repeatProb: 0.05 };
const LEAD_STYLE  = { step: 0.50, skip: 0.85, repeatProb: 0.25 };

const PHRASE_LEN_MIN = 8;
const PHRASE_LEN_MAX = 12;
const MAX_PHRASE_REPEATS = 2;

// ── Lead response (V3: off-grid call-response) ──
const LEAD_PROB        = 0.40;
const LEAD_MIN_DENSITY = 0.3;
// V3: consonant intervals — 3a minore, 3a maggiore, 4a, 5a, ottava
const CALL_RESPONSE_INTERVALS = [3, 4, 5, 7, 12];
const LEAD_VEL_SCALE   = 0.85;
const LEAD_DUR_SCALE   = 0.6;

// V3: off-grid delay range (seconds)
const CALL_DELAY_MIN = 0.20;
const CALL_DELAY_MAX = 0.50;

// ── Arp parameters ──
const ARP_MIN_DENSITY = 0.3;
const ARP_VEL_BASE    = 35;
const ARP_VEL_RANGE   = 30;
const ARP_HUMANIZE    = 3;
const ARP_DUR_RATIO   = 0.85;
const ARP_DUCK_FACTOR = 0.4;
const ARP_DUCK_TICKS  = 8;

// ── Voice velocity ──
const VOICE_VEL_FLOOR = 40;
const VOICE_VEL_BASE  = 45;
const VOICE_VEL_RANGE = 35;
const VOICE_HUMANIZE  = 6;
const VOICE_DUR_RATIO = 0.9;

// ── Step clock state ──
let _step = 0;
let _stepAcc = 0;
let _bar = 0;

let _phraseNotes = [];
let _phraseIdx = 0;
let _phraseRepeat = 0;
let _voiceRestUntilBar = 0;

// V3: pending lead with REAL countdown (seconds), not tick-based
let _pendingLead = null;        // { note, vel, dur }
let _pendingLeadDelay = 0;      // seconds remaining

let _arpPattern = [];
let _arpIdx = 0;
let _lastChordStr = '';
let _leadDuckCounter = 0;

let _leadPhraseNotes = [];
let _leadPhraseIdx = 0;
let _leadPhraseRepeat = 0;

// V3: prime-length loop counters — NEVER reset on bar/phase boundary
// so voice/lead drift permanently off the 4/4 grid.
let _voiceLoopCounter = 0;
let _leadLoopCounter  = 0;

export function initMelody() {
  _step = 0;
  _stepAcc = 0;
  _bar = 0;
  _phraseNotes = [];
  _phraseIdx = 0;
  _phraseRepeat = 0;
  _voiceRestUntilBar = 0;
  _pendingLead = null;
  _pendingLeadDelay = 0;
  _arpPattern = [];
  _arpIdx = 0;
  _lastChordStr = '';
  _leadDuckCounter = 0;
  _leadPhraseNotes = [];
  _leadPhraseIdx = 0;
  _leadPhraseRepeat = 0;
  _voiceLoopCounter = 0;
  _leadLoopCounter = 0;
  console.log('[MELODY-V3] Initialized (Olafur call-response + prime-length loops)');
}

export function updateMelody(dt) {
  // V3: countdown call-response delay (worker tick precision)
  if (_pendingLead && _pendingLeadDelay > 0) {
    _pendingLeadDelay -= dt;
    if (_pendingLeadDelay <= 0) {
      sendMIDINote(CH_LEAD, _pendingLead.note, _pendingLead.vel, _pendingLead.dur);
      addMidiNote(CH_LEAD, _pendingLead.note / 127, _pendingLead.vel / 127);
      _pendingLead = null;
      _pendingLeadDelay = 0;
      _leadDuckCounter = ARP_DUCK_TICKS;
    }
  }

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
//  Phrase Generator — Markov-style (v1 behavior)
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

function _buildArp(chord, scale, lo, hi, noteCount) {
  if (!chord || chord.length === 0) return [];

  const pool = new Set();

  for (const n of chord) {
    let shifted = n;
    while (shifted < lo) shifted += 12;
    while (shifted > hi) shifted -= 12;
    if (shifted >= lo && shifted <= hi) pool.add(shifted);

    const up = shifted + 12;
    if (up >= lo && up <= hi) pool.add(up);
    const down = shifted - 12;
    if (down >= lo && down <= hi) pool.add(down);
  }

  if (pool.size < noteCount) {
    const scaleTones = scale.filter(n => n >= lo && n <= hi);
    for (const n of scaleTones) {
      pool.add(n);
      if (pool.size >= noteCount * 2) break;
    }
  }

  const sorted = [...pool].sort((a, b) => a - b);
  if (sorted.length === 0) return [];

  const picked = [];
  if (sorted.length <= noteCount) {
    picked.push(...sorted);
  } else {
    for (let i = 0; i < noteCount; i++) {
      const idx = Math.round(i * (sorted.length - 1) / (noteCount - 1));
      picked.push(sorted[idx]);
    }
  }

  return picked;
}

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

// V3: schedule lead response with REAL off-grid delay
function _scheduleCallResponse(voiceNote, voiceVel, scale, leadLo, leadHi, velCeil) {
  const interval = CALL_RESPONSE_INTERVALS[Math.floor(Math.random() * CALL_RESPONSE_INTERVALS.length)];
  const direction = Math.random() < 0.5 ? 1 : -1;
  let responseNote = voiceNote + (interval * direction);

  // If chord context exists, prefer chord tones (Olafur "constraint as freedom")
  const chordPCs = new Set();
  if (worldState.currentChord) {
    for (const n of worldState.currentChord) chordPCs.add(n % 12);
  }

  responseNote = Math.max(leadLo, Math.min(leadHi, responseNote));
  responseNote = _snapToScale(responseNote, scale);

  // If snapped note isn't a chord tone but neighbor is, swap (3x weight)
  if (chordPCs.size > 0 && !chordPCs.has(responseNote % 12)) {
    const candidates = [responseNote - 1, responseNote + 1, responseNote - 2, responseNote + 2];
    for (const c of candidates) {
      if (c >= leadLo && c <= leadHi && chordPCs.has(c % 12)) {
        const snapped = _snapToScale(c, scale);
        if (snapped >= leadLo && snapped <= leadHi && Math.random() < 0.65) {
          responseNote = snapped;
          break;
        }
      }
    }
  }

  responseNote = Math.max(leadLo, Math.min(leadHi, responseNote));

  const leadVel = Math.min(Math.round(voiceVel * LEAD_VEL_SCALE), velCeil);
  const leadDur = 280;  // ms — slightly longer than v1's tick-based duration

  _pendingLead = { note: responseNote, vel: leadVel, dur: leadDur };
  // Off-grid: 200-500ms real-time delay (Olafur principle)
  _pendingLeadDelay = CALL_DELAY_MIN + Math.random() * (CALL_DELAY_MAX - CALL_DELAY_MIN);
}

// ═══════════════════════════════════════════════════════════
//  Tick — same flow as v1, but call-response uses off-grid delay
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

  if (_leadDuckCounter > 0) _leadDuckCounter--;

  // ── CH5 VOICE ──
  let voiceEveryBars = strat.voiceEveryBars ?? 2;
  // Intra-track growth in germoglio (NEBBIA): voiceEveryBars decreases with phase progress
  if (isGermoglio && strat.voiceGrowInGermoglio && phaseState.duration > 0) {
    const p = phaseState.progress;  // 0..1 inside germoglio
    // From base voiceEveryBars at p=0 down to 1 at p=1 (e.g. 4 → 3 → 2 → 1)
    voiceEveryBars = Math.max(1, Math.round(voiceEveryBars - p * (voiceEveryBars - 1)));
  }
  const voiceEnabled = voiceEveryBars > 0 && voiceLo > 0 && voiceHi > 0;

  if (voiceEnabled) {
    const voiceRate = VOICE_RATE[phase] ?? VOICE_RATE_DEFAULT;
    const voiceLoopN = VOICE_LOOP_STEPS[phase] ?? VOICE_LOOP_DEFAULT;
    const barsGate = _step === 0 && _bar % voiceEveryBars === 0;
    // V3: prime-length gate instead of _step % voiceRate — voice drifts off 4/4 grid
    const voiceLoopFires = (_voiceLoopCounter % voiceLoopN) === 0;
    const stepGate = isGermoglio ? barsGate : voiceLoopFires;
    const canStartPhrase = barsGate && _phraseIdx >= _phraseNotes.length;

    const voiceResting = _bar < _voiceRestUntilBar;

    if (!voiceResting && (stepGate || _phraseIdx < _phraseNotes.length) && density > 0.1) {
      if (_phraseIdx >= _phraseNotes.length) {
        if (_phraseRepeat < MAX_PHRASE_REPEATS && _phraseNotes.length > 0 && !canStartPhrase) {
          _phraseIdx = 0;
          _phraseRepeat++;
        } else if (canStartPhrase || _phraseNotes.length === 0) {
          if (_phraseNotes.length >= 6) {
            _voiceRestUntilBar = _bar + Math.ceil(_phraseNotes.length / 4);
          }
          const [minLen, maxLen] = strat.voicePhraseLen || [PHRASE_LEN_MIN, PHRASE_LEN_MAX];
          let len;
          if (isGermoglio) {
            if (strat.voiceGrowInGermoglio && phaseState.duration > 0) {
              // Phrase grows from 1 to maxLen across germoglio
              const p = phaseState.progress;
              len = Math.max(1, Math.round(1 + p * (maxLen - 1)));
            } else {
              len = 1;
            }
          } else {
            len = minLen + Math.floor(Math.random() * (maxLen - minLen + 1));
          }
          _phraseNotes = _generatePhrase(scale, voiceLo, voiceHi, Math.max(1, len), VOICE_STYLE);
          _phraseIdx = 0;
          _phraseRepeat = 0;
        }
      }

      if (_phraseIdx < _phraseNotes.length && stepGate) {
        const note = _phraseNotes[_phraseIdx];

        const phrasePos = _phraseNotes.length > 1 ? _phraseIdx / (_phraseNotes.length - 1) : 0.5;
        const arc = Math.sin(phrasePos * Math.PI);
        _phraseIdx++;

        const rawVel = VOICE_VEL_BASE + density * VOICE_VEL_RANGE * (0.6 + 0.4 * arc);
        const humanize = Math.round((Math.random() * VOICE_HUMANIZE * 2) - VOICE_HUMANIZE);
        const vel = Math.min(Math.max(Math.round(rawVel + humanize), VOICE_VEL_FLOOR), velCeil);
        const dur = Math.round(stepMs * voiceRate * VOICE_DUR_RATIO);

        // V3: Degradation — note-drop in dissoluzione final
        const dropProb = worldState.degradation?.noteDropProb ?? 0;
        const dropped = dropProb > 0 && Math.random() < dropProb;

        if (!dropped) {
          sendMIDINote(CH_VOICE, note, vel, dur);
          addMidiNote(CH_VOICE, note / 127, vel / 127);
        }

        // V3: schedule off-grid call-response on lead (skip if voice was dropped)
        if (!dropped && strat.leadMode === 'response' && !isGermoglio && density >= LEAD_MIN_DENSITY) {
          const lp = strat.leadProb ?? LEAD_PROB;
          if (Math.random() < lp) {
            _scheduleCallResponse(note, vel, scale, leadLo, leadHi, velCeil);
          }
        }

        // Echo mode: lead echoes voice (still off-grid via _pendingLeadDelay)
        if (strat.leadMode === 'echo' && !isGermoglio) {
          const lp = strat.leadProb ?? 0.3;
          if (Math.random() < lp) {
            const echoVel = Math.round(vel * 0.55);
            const echoNote = _snapToScale(note, scale);
            _pendingLead = { note: echoNote, vel: Math.min(echoVel, velCeil), dur: Math.round(dur * 1.5) };
            _pendingLeadDelay = CALL_DELAY_MIN + Math.random() * (CALL_DELAY_MAX - CALL_DELAY_MIN);
          }
        }

        // Hocket mode kept on-grid (it's a zipper, must be metric)
        if (strat.leadMode === 'hocket' && _phraseIdx < _phraseNotes.length) {
          const hocketNote = _phraseNotes[_phraseIdx];
          _phraseIdx++;
          let hn = hocketNote;
          hn = Math.max(leadLo, Math.min(leadHi, hn));
          hn = _snapToScale(hn, scale);
          hn = Math.max(leadLo, Math.min(leadHi, hn));
          // Hocket fires immediately on next tick — set delay near zero
          _pendingLead = { note: hn, vel: Math.min(vel, velCeil), dur };
          _pendingLeadDelay = 0.001;
        }
      }
    }
  }

  // ── CH6 LEAD solo mode ──
  if (strat.leadMode === 'solo' && leadLo > 0 && leadHi > 0 && density > 0.1 && !isGermoglio) {
    const leadEvery = strat.leadEveryBars || 2;
    const leadRate = VOICE_RATE[phase] ?? VOICE_RATE_DEFAULT;
    const leadLoopN = LEAD_LOOP_STEPS[phase] ?? LEAD_LOOP_DEFAULT;
    const barsGate = _step === 0 && _bar % leadEvery === 0;
    // V3: prime-length gate, distinct from voice (5↔7, 11↔13)
    const leadLoopFires = (_leadLoopCounter % leadLoopN) === 0;

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

    if (_leadPhraseIdx < _leadPhraseNotes.length && leadLoopFires) {
      const note = _leadPhraseNotes[_leadPhraseIdx];
      _leadPhraseIdx++;
      const rawVel = (VOICE_VEL_BASE + 5) + density * VOICE_VEL_RANGE;
      const humanize = Math.round((Math.random() * 4) - 2);
      const vel = Math.min(Math.max(Math.round(rawVel + humanize), VOICE_VEL_FLOOR), velCeil);
      const dur = Math.round(stepMs * leadRate * LEAD_DUR_SCALE);
      sendMIDINote(CH_LEAD, note, vel, dur);
      addMidiNote(CH_LEAD, note / 127, vel / 127);
    }
  }

  // ── CH7 ARP ──
  const arpRole = strat.arpRole || 'accompany';
  if (arpRole === 'none') return;
  if (arpRole === 'dying' && phase !== 'pulsazione') return;

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
      const accentMul = (_step % 4 === 0) ? 1.15 : 0.9;
      const rawArpVel = (ARP_VEL_BASE + density * ARP_VEL_RANGE) * arpVelMul * duckMul * accentMul;
      const arpHumanize = Math.round((Math.random() * ARP_HUMANIZE * 2) - ARP_HUMANIZE);
      const arpVel = Math.min(Math.max(Math.round(rawArpVel + arpHumanize), 1), velCeil);
      const arpDur = Math.round(stepMs * arpStepInterval * ARP_DUR_RATIO);

      sendMIDINote(CH_ARP, arpNote, arpVel, arpDur);
      addMidiNote(CH_ARP, arpNote / 127, arpVel / 127);
    }
  }

  // V3: advance prime-length loop counters at the end of every step
  // (always — never gated by phase, density, or rest. They drift forever.)
  _voiceLoopCounter++;
  _leadLoopCounter++;
}
