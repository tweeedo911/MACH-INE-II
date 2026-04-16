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
import { advanceCanonVoice } from './director3.js';

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
const LEAD_MIN_DENSITY = 0.25;
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

// ── Step clock state — synced to master clock (worldState.globalTick) ──
let _step = 0;
let _bar = 0;
let _lastTick = -1;

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
let _leadRestUntilBar = 0;

// V3: prime-length loop counters — NEVER reset on bar/phase boundary
// so voice/lead drift permanently off the 4/4 grid.
let _voiceLoopCounter = 0;
let _leadLoopCounter  = 0;

// ── V3.11: Arp direction system — rompe la ciclicità ascendente ──
const ARP_DIRECTIONS = ['up', 'down', 'pendulum', 'random'];
let _arpDirection = 'up';
let _arpPendulumUp = true;
let _arpDirLastBar = -1;

// ── V3.11: Voice/lead contour — arco dinamico variabile per frase ──
let _voiceContour = 'arch';
let _leadContour  = 'arch';

export function initMelody() {
  _step = 0;
  _bar = 0;
  _lastTick = worldState.globalTick;
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
  _leadRestUntilBar = 0;
  _voiceLoopCounter = 0;
  _leadLoopCounter = 0;
  _arpDirection = 'up';
  _arpPendulumUp = true;
  _arpDirLastBar = -1;
  _voiceContour = 'arch';
  _leadContour = 'arch';
  console.log('[MELODY-V3] Initialized (Olafur call-response + prime-length loops + arp variation)');
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
  while (_lastTick < worldState.globalTick) {
    _lastTick++;
    _step = _lastTick % 16;
    _bar  = Math.floor(_lastTick / 16);
    _tick();
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

// ── Chord-aware phrase generator (lead solo, TESSUTO) ──
// Differences from _generatePhrase:
//  1. Start and end on chord tones (anchor points)
//  2. Mid-phrase notes attracted toward chord tones (gravity)
//  3. Directional arc: first half tends up, second half tends down
//  4. Occasional held notes (repeat) on chord tones for breath
function _generatePhraseChordAware(scale, lo, hi, length, style, chord) {
  const pool = scale.filter(n => n >= lo && n <= hi);
  if (pool.length === 0) return [];

  const stepProb   = style ? style.step : 0.70;
  const skipProb   = style ? style.skip : 0.90;
  const repeatProb = style ? (style.repeatProb || 0) : 0;

  // Chord tones in this register (pitch classes)
  const chordPCs = new Set();
  if (chord) for (const n of chord) chordPCs.add(n % 12);
  const isChordTone = (note) => chordPCs.size > 0 && chordPCs.has(note % 12);

  // Start on a chord tone if possible
  const chordPool = pool.filter(n => isChordTone(n));
  let poolIdx;
  if (chordPool.length > 0) {
    const pick = chordPool[Math.floor(Math.random() * chordPool.length)];
    poolIdx = pool.indexOf(pick);
  } else {
    poolIdx = Math.floor(Math.random() * pool.length);
  }

  const phrase = [pool[poolIdx]];

  for (let i = 1; i < length; i++) {
    const pos = i / (length - 1 || 1);  // 0..1

    // Repeat/hold on chord tones — creates breath
    if (isChordTone(pool[poolIdx]) && Math.random() < repeatProb * 2) {
      phrase.push(pool[poolIdx]);
      continue;
    }

    const roll = Math.random();
    let jump;
    if (roll < stepProb) {
      jump = 1;
    } else if (roll < skipProb) {
      jump = 2;
    } else {
      jump = 3;
    }

    // Directional arc: up in first half, down in second half
    // With some randomness to avoid mechanical feeling
    const arcBias = pos < 0.45 ? 0.7 : pos > 0.55 ? 0.3 : 0.5;
    const direction = Math.random() < arcBias ? 1 : -1;
    jump *= direction;

    let newIdx = Math.max(0, Math.min(pool.length - 1, poolIdx + jump));

    // Chord-tone gravity: if a chord tone is within ±1 step, prefer it
    if (!isChordTone(pool[newIdx]) && Math.random() < 0.4) {
      for (const offset of [0, -1, 1]) {
        const test = newIdx + offset;
        if (test >= 0 && test < pool.length && isChordTone(pool[test])) {
          newIdx = test;
          break;
        }
      }
    }

    poolIdx = newIdx;
    phrase.push(pool[poolIdx]);
  }

  // End on chord tone: replace last note if needed
  if (chordPool.length > 0 && !isChordTone(phrase[phrase.length - 1])) {
    // Find nearest chord tone in pool
    let bestDist = 999;
    let bestNote = phrase[phrase.length - 1];
    for (const cn of chordPool) {
      const dist = Math.abs(cn - phrase[phrase.length - 1]);
      if (dist < bestDist) { bestDist = dist; bestNote = cn; }
    }
    phrase[phrase.length - 1] = bestNote;
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
function _scheduleCallResponse(voiceNote, voiceVel, scale, leadLo, leadHi, velCeil, delayRange) {
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
  // V3.5: lead duration proporzionale al BPM (non più 280ms fisso)
  const bpm = worldState.bpm || 60;
  const stepMs = (60 / bpm / 4) * 1000;
  const leadDur = Math.round(stepMs * LEAD_DUR_SCALE);  // ~0.6 × step duration

  _pendingLead = { note: responseNote, vel: leadVel, dur: leadDur };
  // V3.5: delay range per traccia (default [0.20, 0.50])
  const dMin = delayRange ? delayRange[0] : CALL_DELAY_MIN;
  const dMax = delayRange ? delayRange[1] : CALL_DELAY_MAX;
  _pendingLeadDelay = dMin + Math.random() * (dMax - dMin);
}

// ── V3.11: contorno dinamico per arco velocity frasale ──
// arch = sin (sale e scende), question = sale, answer = scende, peak = salita rapida + discesa lenta
function _contourArc(phrasePos, contour) {
  switch (contour) {
    case 'question': return 0.3 + phrasePos * 0.7;            // cresce: p → f
    case 'answer':   return 1.0 - phrasePos * 0.7;            // cala: f → p
    case 'peak':     return phrasePos < 0.3                    // picco rapido, coda lunga
      ? phrasePos / 0.3
      : 1.0 - (phrasePos - 0.3) / 0.7 * 0.6;
    default:         return Math.sin(phrasePos * Math.PI);     // arch (originale)
  }
}

// ── V3.11: scelta contorno pesata — pick da array [['arch',3],['question',2]] ──
function _pickContour(weights) {
  if (!weights || weights.length === 0) return 'arch';
  let total = 0;
  for (const [, w] of weights) total += w;
  let roll = Math.random() * total;
  for (const [name, w] of weights) {
    roll -= w;
    if (roll <= 0) return name;
  }
  return weights[0][0];
}

// ── V3.11: avanza indice arp in base alla direzione corrente ──
function _advanceArpIdx(patLen) {
  switch (_arpDirection) {
    case 'down':
      _arpIdx = (_arpIdx - 1 + patLen) % patLen;
      break;
    case 'pendulum':
      if (_arpPendulumUp) {
        if (_arpIdx >= patLen - 1) { _arpPendulumUp = false; _arpIdx--; }
        else _arpIdx++;
      } else {
        if (_arpIdx <= 0) { _arpPendulumUp = true; _arpIdx++; }
        else _arpIdx--;
      }
      break;
    case 'random':
      _arpIdx = Math.floor(Math.random() * patLen);
      break;
    default: // 'up'
      _arpIdx = (_arpIdx + 1) % patLen;
  }
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
  // V3.5: start from 16 bars (not voiceEveryBars) to get the "goccia ogni 16 bar" opening,
  // then compress down to voiceEveryBars by end of germoglio
  if (isGermoglio && strat.voiceGrowInGermoglio && phaseState.duration > 0) {
    const p = phaseState.progress;  // 0..1 inside germoglio
    const startEvery = 16;  // prima goccia ~64s in NEBBIA (16 bar × 4s)
    const endEvery = strat.voiceEveryBars ?? 2;
    voiceEveryBars = Math.max(endEvery, Math.round(startEvery - p * (startEvery - endEvery)));
  }
  const voiceEnabled = voiceEveryBars > 0 && voiceLo > 0 && voiceHi > 0;

  // ── ENCORE VOICE v2: reads from canon (½× retrograde) ──
  if (worldState.encoreMode && !worldState.encoreCanon.voice.active) {
    // Voice not yet active — skip
  } else if (worldState.encoreMode && worldState.encoreCanon.voice.active) {
    // ── ENCORE v2.1: voice pattern ritmico → avanza canon (½× retrograda) ──
    const pattern = CFG.ENCORE_PATTERN_VOICE;
    if (pattern[_step] === 1) {
      const note = advanceCanonVoice('voice');
      if (note > 0) {
        // Velocity alzata — il problema v2 era voice troppo bassa
        const rawVel = 78 + density * 20 + (Math.random() * 8 - 4);
        const vel = Math.min(Math.round(rawVel), velCeil);
        const stepMs2 = (60 / (worldState.bpm || 132) / 4) * 1000;
        const dur = Math.round(stepMs2 * 8);  // gate lungo — voice sostenuta
        sendMIDINote(CH_VOICE, note, vel, dur);
        addMidiNote(CH_VOICE, note / 127, vel / 127);
      }
    }
  } else if (voiceEnabled) {
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
          // V3.5: hocket consumes 2 notes per step (voice+lead alternating),
          // so generate 2× longer phrases to match the intended duration
          if (strat.leadMode === 'hocket') len = len * 2;
          const vStyle = strat.voiceStyle || VOICE_STYLE;
          _phraseNotes = _generatePhrase(scale, voiceLo, voiceHi, Math.max(1, len), vStyle);
          _phraseIdx = 0;
          _phraseRepeat = 0;
          // V3.11: scegli contorno per questa frase
          _voiceContour = _pickContour(strat.voiceContours);
        }
      }

      if (_phraseIdx < _phraseNotes.length && stepGate) {
        const note = _phraseNotes[_phraseIdx];

        const phrasePos = _phraseNotes.length > 1 ? _phraseIdx / (_phraseNotes.length - 1) : 0.5;
        const arc = _contourArc(phrasePos, _voiceContour);
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
            _scheduleCallResponse(note, vel, scale, leadLo, leadHi, velCeil, strat.callResponseDelay);
          }
        }

        // Echo mode: lead echoes voice (still off-grid via _pendingLeadDelay)
        if (strat.leadMode === 'echo' && !isGermoglio) {
          const lp = strat.leadProb ?? 0.3;
          if (Math.random() < lp) {
            const echoVel = Math.round(vel * 0.55);
            const echoNote = _snapToScale(note, scale);
            _pendingLead = { note: echoNote, vel: Math.min(echoVel, velCeil), dur: Math.round(dur * 1.5) };
            const dr = strat.callResponseDelay;
            const dMin = dr ? dr[0] : CALL_DELAY_MIN;
            const dMax = dr ? dr[1] : CALL_DELAY_MAX;
            _pendingLeadDelay = dMin + Math.random() * (dMax - dMin);
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

  // ── CH6 LEAD ──
  // ── ENCORE v2.1: lead pattern ritmico (contrattempo, 4 hit per bar) → avanza canon (2×) ──
  if (worldState.encoreMode) {
    const canon = worldState.encoreCanon;
    const pattern = CFG.ENCORE_PATTERN_LEAD;
    if (canon.lead.active && pattern[_step] === 1 && density > 0.15) {
      const note = advanceCanonVoice('lead');
      if (note > 0) {
        const rawVel = 70 + density * 25 + (Math.random() * 8 - 4);
        const vel = Math.min(Math.round(rawVel), velCeil);
        const stepMs2 = (60 / (worldState.bpm || 132) / 4) * 1000;
        const dur = Math.round(stepMs2 * 2);  // staccato breve, contrattempo punteggiato
        sendMIDINote(CH_LEAD, note, vel, dur);
        addMidiNote(CH_LEAD, note / 127, vel / 127);
      }
    }
    // Skip normal lead logic during encore
  } else

  // ── CH6 LEAD solo mode (chord-aware, with velocity arc and rest) ──
  if (strat.leadMode === 'solo' && leadLo > 0 && leadHi > 0 && density > 0.1 && !isGermoglio) {
    const leadEvery = strat.leadEveryBars || 2;
    const leadRate = VOICE_RATE[phase] ?? VOICE_RATE_DEFAULT;
    const leadLoopN = LEAD_LOOP_STEPS[phase] ?? LEAD_LOOP_DEFAULT;
    const barsGate = _step === 0 && _bar % leadEvery === 0;
    // V3: prime-length gate, distinct from voice (5↔7, 11↔13)
    const leadLoopFires = (_leadLoopCounter % leadLoopN) === 0;

    // Rest: skip phrase generation until rest expires
    const leadResting = _bar < _leadRestUntilBar;

    if (!leadResting && _leadPhraseIdx >= _leadPhraseNotes.length && barsGate) {
      // Rest between phrases — breathe for 1-2 bars after long phrases
      if (_leadPhraseNotes.length >= 5) {
        _leadRestUntilBar = _bar + 1 + Math.floor(Math.random() * 2);  // 1-2 bar rest
      }
      const [minLen, maxLen] = strat.leadPhraseLen || [4, 8];
      const len = minLen + Math.floor(Math.random() * (maxLen - minLen + 1));
      const lStyle = strat.leadStyle || LEAD_STYLE;
      // Chord-aware phrase generation — anchors on chord tones, directional arc
      _leadPhraseNotes = _generatePhraseChordAware(scale, leadLo, leadHi, len, lStyle, worldState.currentChord);
      _leadPhraseIdx = 0;
      _leadPhraseRepeat = 0;
      // V3.11: contorno lead indipendente
      _leadContour = _pickContour(strat.leadContours);
    } else if (!leadResting && _leadPhraseIdx >= _leadPhraseNotes.length && _leadPhraseRepeat < MAX_PHRASE_REPEATS && _leadPhraseNotes.length > 0) {
      _leadPhraseIdx = 0;
      _leadPhraseRepeat++;
    }

    if (_leadPhraseIdx < _leadPhraseNotes.length && leadLoopFires) {
      const note = _leadPhraseNotes[_leadPhraseIdx];

      // V3.11: arco dinamico con contorno variabile (non più solo sin)
      const phrasePos = _leadPhraseNotes.length > 1 ? _leadPhraseIdx / (_leadPhraseNotes.length - 1) : 0.5;
      const arc = _contourArc(phrasePos, _leadContour);
      _leadPhraseIdx++;

      const rawVel = VOICE_VEL_BASE + density * VOICE_VEL_RANGE * (0.55 + 0.45 * arc);
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

  // V3.11: cambio direzione arp ogni N bar (default 4)
  const arpVar = strat.arpVariation;
  if (arpVar && _step === 0) {
    const dirEvery = arpVar.dirChangeEvery || 4;
    if (_bar % dirEvery === 0 && _bar !== _arpDirLastBar) {
      _arpDirLastBar = _bar;
      const dirs = arpVar.directions || ARP_DIRECTIONS;
      // Evita la stessa direzione due volte di fila
      let pick;
      do { pick = dirs[Math.floor(Math.random() * dirs.length)]; }
      while (pick === _arpDirection && dirs.length > 1);
      _arpDirection = pick;
      _arpPendulumUp = true;
    }
  }

  // ── ENCORE ARP v2: reads from canon (3× inverted) ──
  if (worldState.encoreMode && !worldState.encoreCanon.arp.active) {
    // Arp not yet active — skip
  } else if (worldState.encoreMode && worldState.encoreCanon.arp.active) {
    // ── ENCORE v2.1: arp pattern ritmico (ottavi densi) → avanza canon (inversione) ──
    const pattern = CFG.ENCORE_PATTERN_ARP;
    if (pattern[_step] === 1 && density >= 0.15) {
      const note = advanceCanonVoice('arp');
      if (note > 0) {
        const arpVelMul = strat.arpVelScale ?? 0.85;
        // Accent su beat forti (step 0, 4, 8, 12), ghost sugli altri
        const isAccent = (_step % 4 === 0);
        const rawVel = ((isAccent ? 65 : 50) + density * 35) * arpVelMul;
        const arpVel = Math.min(Math.max(Math.round(rawVel), 1), velCeil);
        const stepMs2 = (60 / (worldState.bpm || 132) / 4) * 1000;
        const arpDur = Math.round(stepMs2 * 1.3);  // breve, staccato
        sendMIDINote(CH_ARP, note, arpVel, arpDur);
        addMidiNote(CH_ARP, note / 127, arpVel / 127);
      }
    }
  } else {
  const arpInGermoglio = arpRole === 'protagonist';
  if ((arpInGermoglio || !isGermoglio) && density >= ARP_MIN_DENSITY && _arpPattern.length > 0) {
    const arpRate = (track && track.arpRate) || 8;
    const arpStepInterval = Math.max(1, Math.round(16 / arpRate));

    if (_step % arpStepInterval === 0) {
      // V3.11: rest probabilistico — il groove respira
      const restProb = arpVar?.restProb ?? 0;
      if (restProb > 0 && Math.random() < restProb) {
        _advanceArpIdx(_arpPattern.length);
        // silenzio: avanziamo l'indice ma non suoniamo
      } else {
        let arpNote = _arpPattern[_arpIdx % _arpPattern.length];
        _advanceArpIdx(_arpPattern.length);

        // V3.11: nota di passaggio — scala invece di accordo, velocity bassa
        const passProb = arpVar?.passingProb ?? 0;
        if (passProb > 0 && Math.random() < passProb) {
          // Nota di scala vicina alla nota corrente (±1-2 gradi), non dell'accordo
          const offset = (Math.random() < 0.5 ? 1 : -1) * (Math.random() < 0.7 ? 1 : 2);
          const candidate = _snapToScale(arpNote + offset, scale);
          if (candidate >= arpLo && candidate <= arpHi) arpNote = candidate;
        }

        const arpVelMul = strat.arpVelScale ?? 0.7;
        const duckMul = _leadDuckCounter > 0 ? ARP_DUCK_FACTOR : 1.0;
        const accentMul = (_step % 4 === 0) ? 1.15 : 0.9;
        // V3.11: nota di passaggio suona più piano
        const passingMul = (arpNote !== _arpPattern[(_arpIdx + _arpPattern.length - 1) % _arpPattern.length]) ? 1.0 : 1.0;
        const rawArpVel = (ARP_VEL_BASE + density * ARP_VEL_RANGE) * arpVelMul * duckMul * accentMul;
        const arpHumanize = Math.round((Math.random() * ARP_HUMANIZE * 2) - ARP_HUMANIZE);
        const arpVel = Math.min(Math.max(Math.round(rawArpVel + arpHumanize), 1), velCeil);
        const arpDur = Math.round(stepMs * arpStepInterval * ARP_DUR_RATIO);

        sendMIDINote(CH_ARP, arpNote, arpVel, arpDur);
        addMidiNote(CH_ARP, arpNote / 127, arpVel / 127);
      }
    }
  }
  } // end else (non-encore arp)

  // V3: advance prime-length loop counters at the end of every step
  // (always — never gated by phase, density, or rest. They drift forever.)
  _voiceLoopCounter++;
  _leadLoopCounter++;
}
