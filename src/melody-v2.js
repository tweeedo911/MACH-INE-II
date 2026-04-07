// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Melody Module V2 (light chord coherence)
//  CH5 Voice + CH6 Lead + CH7 Arp
//  A/B EXPERIMENT (post-tavola-rotonda 2026-04-06)
//
//  ITERAZIONE 2 (2026-04-07):
//  Il bias 2.5x e lo "swap toward chord tone" durante il random walk erano
//  TROPPO — la melodia diventava prevedibile, perdeva tensione/libertà.
//  Ora bias = 1.3 (preferenza leggera, non vincolo) e niente swap forzato
//  step-by-step. Solo la nota di partenza di ogni frase è leggermente biased.
//
//  Differenze rispetto a melody.js (v1):
//   - Phrase generator: leggera preferenza (1.3x) per chord tones SOLO sulla
//     prima nota di ogni frase. Il random walk è poi puro Markov.
//   - ARP_VEL_BASE alzato da 35 a 50 — l'arp non è più sotto soglia udibilità.
//
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';
import { TRACKS } from './tracks.js';

// ── Channel assignments ──
const CH_VOICE = 5;
const CH_LEAD  = 6;
const CH_ARP   = 7;

// ── Voice rate per phase ──
const VOICE_RATE = {
  germoglio:    8,
  pulsazione:   4,
  densita:      2,
  rottura:      2,
  dissoluzione: 4,
};
const VOICE_RATE_DEFAULT = 4;

// ── Phrase generation: musician styles ──
const VOICE_STYLE = { step: 0.40, skip: 0.70, repeatProb: 0.05 };
const LEAD_STYLE  = { step: 0.50, skip: 0.85, repeatProb: 0.25 };

// ── Phrase length ──
const PHRASE_LEN_MIN = 8;
const PHRASE_LEN_MAX = 12;
const MAX_PHRASE_REPEATS = 2;

// ── Lead response ──
const LEAD_PROB        = 0.40;
const LEAD_MIN_DENSITY = 0.3;
const LEAD_INTERVALS   = [1, 2, 3];
const LEAD_VEL_SCALE   = 0.85;
const LEAD_DUR_SCALE   = 0.6;

// ── Arp parameters ──
const ARP_MIN_DENSITY = 0.3;
const ARP_VEL_BASE    = 50;   // V2: 35 → 50 (era inudibile su hardware)
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

// ── V2: chord-tone targeting bias (light — only on phrase start) ──
const CHORD_TONE_BIAS = 1.3;

// ── Step clock state ──
let _step = 0;
let _stepAcc = 0;
let _bar = 0;

let _phraseNotes = [];
let _phraseIdx = 0;
let _phraseRepeat = 0;
let _voiceRestUntilBar = 0;

let _pendingLead = null;

let _arpPattern = [];
let _arpIdx = 0;
let _lastChordStr = '';
let _leadDuckCounter = 0;

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
  console.log('[MELODY-V2] Initialized (chord-tone targeting)');
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
//  V2 Phrase Generator — Markov-style with chord-tone bias
// ═══════════════════════════════════════════════════════════

function _generatePhrase(scale, lo, hi, length, style = null) {
  const pool = scale.filter(n => n >= lo && n <= hi);
  if (pool.length === 0) return [];

  const stepProb   = style ? style.step : 0.70;
  const skipProb   = style ? style.skip : 0.90;
  const repeatProb = style ? (style.repeatProb || 0) : 0;

  // V2: build chord pitch class set for bias
  const chordPCs = new Set();
  if (worldState.currentChord) {
    for (const n of worldState.currentChord) chordPCs.add(n % 12);
  }

  const phrase = [];

  // Pick first note: weighted by chord-tone bias
  let poolIdx = _weightedPickIdx(pool, chordPCs);
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

    // Pure Markov walk — no chord-tone forcing during the phrase
    poolIdx = Math.max(0, Math.min(pool.length - 1, poolIdx + jump));
    phrase.push(pool[poolIdx]);
  }

  return phrase;
}

// V2: weighted pick — chord tones get CHORD_TONE_BIAS× weight
function _weightedPickIdx(pool, chordPCs) {
  if (chordPCs.size === 0) {
    return Math.floor(Math.random() * pool.length);
  }
  const weights = new Array(pool.length);
  let total = 0;
  for (let i = 0; i < pool.length; i++) {
    const w = chordPCs.has(pool[i] % 12) ? CHORD_TONE_BIAS : 1.0;
    weights[i] = w;
    total += w;
  }
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return pool.length - 1;
}

// ═══════════════════════════════════════════════════════════
//  Arp Builder — pattern from currentChord + scale (unchanged)
// ═══════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════
//  Tick — same flow as v1, calls v2 _generatePhrase
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

  // Fire pending lead
  if (_pendingLead !== null) {
    sendMIDINote(CH_LEAD, _pendingLead.note, _pendingLead.vel, _pendingLead.dur);
    addMidiNote(CH_LEAD, _pendingLead.note / 127, _pendingLead.vel / 127);
    _pendingLead = null;
    _leadDuckCounter = ARP_DUCK_TICKS;
  }
  if (_leadDuckCounter > 0) _leadDuckCounter--;

  // ── CH5 VOICE ──
  const voiceEveryBars = strat.voiceEveryBars ?? 2;
  const voiceEnabled = voiceEveryBars > 0 && voiceLo > 0 && voiceHi > 0;

  if (voiceEnabled) {
    const voiceRate = VOICE_RATE[phase] ?? VOICE_RATE_DEFAULT;
    const barsGate = _step === 0 && _bar % voiceEveryBars === 0;
    const stepGate = isGermoglio ? barsGate : (_step % voiceRate === 0);
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
          const len = isGermoglio ? 1 : minLen + Math.floor(Math.random() * (maxLen - minLen + 1));
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

        sendMIDINote(CH_VOICE, note, vel, dur);
        addMidiNote(CH_VOICE, note / 127, vel / 127);

        if (strat.leadMode === 'response' && !isGermoglio && density >= LEAD_MIN_DENSITY) {
          const lp = strat.leadProb ?? LEAD_PROB;
          if (Math.random() < lp) {
            _scheduleLead(note, vel, stepMs, voiceRate, scale, leadLo, leadHi, velCeil);
          }
        }

        if (strat.leadMode === 'echo' && !isGermoglio) {
          const lp = strat.leadProb ?? 0.3;
          if (Math.random() < lp) {
            const echoVel = Math.round(vel * 0.55);
            _pendingLead = { note: _snapToScale(note, scale), vel: Math.min(echoVel, velCeil), dur: Math.round(dur * 1.5) };
          }
        }

        if (strat.leadMode === 'hocket' && _phraseIdx < _phraseNotes.length) {
          const hocketNote = _phraseNotes[_phraseIdx];
          _phraseIdx++;
          let hn = hocketNote;
          hn = Math.max(leadLo, Math.min(leadHi, hn));
          hn = _snapToScale(hn, scale);
          hn = Math.max(leadLo, Math.min(leadHi, hn));
          _pendingLead = { note: hn, vel: Math.min(vel, velCeil), dur };
        }
      }
    }
  }

  // ── CH6 LEAD solo mode ──
  if (strat.leadMode === 'solo' && leadLo > 0 && leadHi > 0 && density > 0.1 && !isGermoglio) {
    const leadEvery = strat.leadEveryBars || 2;
    const leadRate = VOICE_RATE[phase] ?? VOICE_RATE_DEFAULT;
    const barsGate = _step === 0 && _bar % leadEvery === 0;

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
}

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
