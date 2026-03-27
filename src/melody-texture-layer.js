// ═══════════════════════════════════════════════════════════
//  MACH:INE II — MelodyTextureLayer v3
//  CH3 (BASS) bassline melodica, CH5 (VOICE) gocce con memoria motivica,
//  CH6 (LEAD) voce indipendente angolosa
//  Riferimenti: Eno (loop prime) + Nyman (seed motivico) + Four Tet (texture)
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { macroState } from './macro-composer.js';
import { sendMIDINote as _rawSend, sendMIDIAllNotesOff } from './midi.js';

// ══════════════════════════════════════════════════════════
//  UTILITY
// ══════════════════════════════════════════════════════════

// Approssimazione gaussiana (media 0, sigma ~1) — identica a rhythm-layer.js
function _gaussianRand() {
  return (Math.random() + Math.random() + Math.random() - 1.5) * 2;
}

// ══════════════════════════════════════════════════════════
//  STATO INTERNO
// ══════════════════════════════════════════════════════════

// ── Step clocks per i tre loop a lunghezze prime ──
let _clockCH3 = 0, _lastStepCH3 = -1;   // CH3 BASS — 7 step
let _clockCH5 = 0, _lastStepCH5 = -1;   // CH5 VOICE — 11 step
let _clockCH6 = 0, _lastStepCH6 = -1;   // CH6 LEAD — 13 step

// ── Markov voice state per CH3, CH5 e CH6 ──
let _histCH3 = [null, null];   // ultime 2 note CH3 (per Markov)
let _histCH5 = [null, null];   // ultime 2 note CH5 (per Markov)
let _histCH6 = [null, null];   // ultime 2 note CH6
let _intervCH5 = [];           // ultimi seedLength intervalli CH5 (per affinita seed)
let _intervCH6 = [];           // ultimi intervalli CH6

// ── Seed motivico (MELO-01, D-07/D-08/D-09) ──
let _seedMotif = null;           // array di intervalli (es. [2, -1, 3, 5])
let _seedCaptured = false;       // true dopo cattura nella finestra 0-seedWindowEnd
let _seedReturned = false;       // true dopo il ritorno unico a arcPercent > seedReturnAt
let _ch5PhraseNoteCount = 0;     // contatore note prima frase CH5 per cattura seed
let _seedReturnQueue = [];       // micro-sequencer: { note, vel, dur, targetBar }

// ── Arpeggi incrociati (D-05) ──
let _arpMode = false;            // true quando siamo nella finestra cross-arpeggio
let _arpLastCH5Note = null;      // ultima nota CH5 per costruire risposta CH6

// ── Step corrente per downbeat detection ──
let _currentStep16 = 0;

// ══════════════════════════════════════════════════════════
//  GATING E MIDI WRAPPER
//  Downbeat boost MIDI-01, pitch range MIDI-02, phrase offset MIDI-03
// ══════════════════════════════════════════════════════════

// Wrapper MIDI con gating, range enforcement, velocity scaling e humanization
function sendNote(ch, note, vel, dur) {
  const mA = macroState.melodicActivity;

  // Gating su melodicActivity
  if (mA < CFG.MELODY.activityGateFloor) return;

  // MIDI-02: pitch range enforcement per canale
  const range = CFG.MELODY.pitchRange[ch];
  note = Math.max(range.min, Math.min(range.max, note));

  // Velocity scalata per melodicActivity
  vel = vel * mA;

  // MIDI-01: downbeat boost / offbeat reduce
  const isDownbeat = (_currentStep16 % 4 === 0);
  if (isDownbeat) {
    vel = vel * (1 + CFG.MELODY.midi.downbeatBoost);
  } else {
    vel = vel * (1 - CFG.MELODY.midi.offbeatReduce);
  }

  // Humanize: scatter gaussiano
  vel += _gaussianRand() * CFG.MELODY.velHumanize;
  vel = Math.max(1, Math.min(127, Math.round(vel)));

  // MIDI-03: phrase offset — sfasamento microtemporale anti-meccanico
  const offsetRange = CFG.MELODY.midi.noteOffsetMs;
  const offset = Math.random() * (offsetRange.max - offsetRange.min) + offsetRange.min;
  setTimeout(() => _rawSend(ch, note, vel, dur), offset);
}

// ══════════════════════════════════════════════════════════
//  MARKOV VOICE SELECTION
// ══════════════════════════════════════════════════════════

// Weighted Markov selection — derivato da composer.js nextVoiceNote()
// ch: canale MIDI (3, 5, 6) — usato per pitch range e weights specifici per CH6
// history: [prevPrev, prev] ultime 2 note del canale
// seedIntervals: array di intervalli seed (per affinita seed D-07)
function _nextVoiceNote(ch, history, seedIntervals) {
  const scale = CFG.MACRO.modes[macroState.currentMode] || [];
  const range = CFG.MELODY.pitchRange[ch];
  const isCH6 = (ch === 6);

  // Filtra note nella scala nel pitch range del canale
  const pool = scale.filter(n => n >= range.min && n <= range.max);
  if (pool.length === 0) return range.min;

  const weights = new Array(pool.length);
  const prev = history[1];

  for (let i = 0; i < pool.length; i++) {
    const n = pool[i];
    let w = 1.0;

    if (prev !== null) {
      const diff = n - prev;
      const absDiff = Math.abs(diff);

      // Bonus movimento per grado (piccolo intervallo)
      if (absDiff <= 3) {
        // CH6 riduce il bonus per step — preferisce piu movimento (D-03)
        w *= isCH6
          ? CFG.MELODY.markov.stepBonus * CFG.MELODY.markov.ch6StepReduction
          : CFG.MELODY.markov.stepBonus;
      }

      // Penalty salto grande
      if (absDiff > 7) {
        w *= CFG.MELODY.markov.jumpPenalty;
        // CH6 aggiunge preferenza per salti — carattere angoloso (D-03)
        if (isCH6) w *= CFG.MELODY.markov.ch6JumpPreference;
      } else if (absDiff > 3 && isCH6) {
        // CH6 preferisce anche salti medi
        w *= CFG.MELODY.markov.ch6JumpPreference;
      }

      // Affinita seed — bonus se l'intervallo corrisponde al motivo
      for (const mi of seedIntervals) {
        if (mi === diff) {
          w *= CFG.MELODY.markov.seedAffinity;
        } else if (Math.abs(mi - diff) === 1) {
          w *= CFG.MELODY.markov.seedNearAffinity;
        }
      }
    }

    weights[i] = w;
  }

  // Weighted random selection
  let total = 0;
  for (let i = 0; i < weights.length; i++) total += weights[i];
  let r = Math.random() * total;
  let chosen = pool[pool.length - 1];  // fallback ultimo elemento
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) { chosen = pool[i]; break; }
  }

  // Aggiorna history
  history[0] = history[1];
  history[1] = chosen;

  return chosen;
}

// ══════════════════════════════════════════════════════════
//  STEP HANDLERS — CH3, CH5, CH6
// ══════════════════════════════════════════════════════════

// CH3 BASS — bassline melodica 7-step (D-04)
function _onCH3Step(stepInLoop) {
  const mA = macroState.melodicActivity;

  // Fase melodica da melodicActivity
  const phase = mA < 0.3 ? 'sparse' : mA < 0.65 ? 'medium' : 'dense';

  // Probabilistic gating — fase sparse usa soglia ridotta
  const baseProb = CFG.MELODY.emitProbability.ch3Base;
  const prob = phase === 'sparse'
    ? baseProb * 0.5 * mA
    : baseProb * mA;
  if (Math.random() >= prob) return;

  const note = _nextVoiceNote(3, _histCH3, _seedMotif || []);
  const vel  = CFG.MELODY.velTarget[phase].ch3 + _gaussianRand() * CFG.MELODY.velHumanize;
  const dur  = CFG.MELODY.noteDur.ch3[phase === 'dense' ? 'dense' : 'sparse'];
  sendNote(3, note, vel, dur);
}

// CH5 VOICE — melodia rarefatta con seed (D-02, D-07)
function _onCH5Step(stepInLoop) {
  const mA = macroState.melodicActivity;
  const arc = macroState.arcPercent;

  // Gating — con eccezione per cattura seed in apertura (finestra seed)
  const baseProb = CFG.MELODY.emitProbability.ch5Base;
  const seedWindow = !_seedCaptured && arc < CFG.MELODY.seedWindowEnd;
  if (seedWindow) {
    // Gating piu morbido per permettere cattura seed anche con mA bassa
    if (mA < CFG.MELODY.seedCaptureGateMin) return;
    if (Math.random() >= baseProb * Math.max(mA, 0.1)) return;
  } else {
    if (Math.random() >= baseProb * mA) return;
  }

  const phase = mA < 0.3 ? 'sparse' : mA < 0.65 ? 'medium' : 'dense';
  const note = _nextVoiceNote(5, _histCH5, _seedMotif || []);
  const vel  = CFG.MELODY.velTarget[phase].ch5 + _gaussianRand() * CFG.MELODY.velHumanize;
  const dur  = CFG.MELODY.noteDur.ch5[phase === 'dense' ? 'dense' : 'sparse'];
  sendNote(5, note, vel, dur);

  // D-05: registra nota CH5 per risposta CH6 in modalita arpeggio
  if (_arpMode) _arpLastCH5Note = note;

  // ── Seed capture (MELO-01, D-07) ──
  _ch5PhraseNoteCount++;
  if (_ch5PhraseNoteCount >= 2 && _histCH5[0] !== null) {
    const interval = _histCH5[1] - _histCH5[0];
    _intervCH5.push(interval);

    // Cattura seed: dopo seedLength intervalli entro la finestra seedWindowEnd
    if (_intervCH5.length >= CFG.MELODY.seedLength &&
        !_seedCaptured &&
        arc < CFG.MELODY.seedWindowEnd) {
      _seedMotif = _intervCH5.slice(0, CFG.MELODY.seedLength);
      _seedCaptured = true;
      console.log('[MELODY] seed captured:', _seedMotif);
    }
  }
}

// CH6 LEAD — voce indipendente angolosa 13-step (D-03)
function _onCH6Step(stepInLoop) {
  const mA = macroState.melodicActivity;
  const baseProb = CFG.MELODY.emitProbability.ch6Base;
  if (Math.random() >= baseProb * mA) return;

  const phase = mA < 0.3 ? 'sparse' : mA < 0.65 ? 'medium' : 'dense';

  // D-05: risposta cross-arpeggio o selezione Markov normale
  let note;
  if (_arpMode && _arpLastCH5Note !== null && (stepInLoop % CFG.MELODY.arpeggio.delayStp === 0)) {
    // D-05: risposta CH6 — intervallo di terza (4 semitoni) o quinta (7) snap a scala
    const scale = CFG.MACRO.modes[macroState.currentMode] || [];
    const thirdUp = _arpLastCH5Note + 4;
    const inRange = thirdUp <= CFG.MELODY.pitchRange[6].max;
    const candidate = inRange ? thirdUp : (_arpLastCH5Note + 7);
    note = scale.reduce((best, n) =>
      Math.abs(n - candidate) < Math.abs(best - candidate) ? n : best, scale[0]);
  } else {
    note = _nextVoiceNote(6, _histCH6, _seedMotif || []);
  }

  const vel = CFG.MELODY.velTarget[phase].ch6 + _gaussianRand() * CFG.MELODY.velHumanize;
  const dur = CFG.MELODY.noteDur.ch6[phase === 'dense' ? 'dense' : 'sparse'];
  sendNote(6, note, vel, dur);
}

// ══════════════════════════════════════════════════════════
//  SEED RETURN — micro-sequencer basato su barClock (D-08, D-09)
//  NON usa setTimeout — il Worker non lo supporta in modo affidabile
// ══════════════════════════════════════════════════════════

// Trigger ritorno seed motivico quando arcPercent supera seedReturnAt
function _checkSeedReturn() {
  // Guard: solo una volta, dopo la cattura, al momento giusto
  if (_seedReturned || !_seedCaptured || macroState.arcPercent <= CFG.MELODY.seedReturnAt) return;

  _seedReturned = true;
  console.log('[MELODY] seed returned at arcPercent:', macroState.arcPercent);

  // Calcola root dal modo attivo
  const rootNote = CFG.MACRO.droneRoot[macroState.currentMode] || 57;
  const scale    = CFG.MACRO.modes[macroState.currentMode] || [];

  // Enqueue le note del seed nel micro-sequencer (barClock-based)
  let note      = rootNote;
  let targetBar = macroState.barClock;

  for (const interval of _seedMotif) {
    _seedReturnQueue.push({
      note,
      vel:       CFG.MELODY.seedReturnVel,
      dur:       800,
      targetBar,
    });
    // Prossima nota: trasposta per l'intervallo, snap a scala modale
    const candidate = note + interval;
    note = scale.reduce(
      (best, n) => Math.abs(n - candidate) < Math.abs(best - candidate) ? n : best,
      scale[0],
    );
    targetBar += CFG.MELODY.seedReturnNoteSpacingBars;
  }
}

// Flush micro-sequencer seed return — controlla ogni tick
function _flushSeedQueue() {
  if (_seedReturnQueue.length === 0) return;
  _seedReturnQueue = _seedReturnQueue.filter(entry => {
    if (macroState.barClock >= entry.targetBar) {
      // Usa _rawSend diretto — bypassa gating (il ritorno DEVE suonare)
      _rawSend(5, entry.note, entry.vel, entry.dur);
      return false; // rimuovi dalla coda
    }
    return true; // mantieni in coda
  });
}

// ══════════════════════════════════════════════════════════
//  ARPEGGIO WINDOW CHECK (D-05)
// ══════════════════════════════════════════════════════════

function _isArpWindow() {
  return macroState.arcPercent >= CFG.MELODY.arpeggio.activeRange.min &&
         macroState.arcPercent <= CFG.MELODY.arpeggio.activeRange.max &&
         macroState.melodicActivity > CFG.MELODY.arpeggio.threshold;
}

// ══════════════════════════════════════════════════════════
//  EXPORTS
// ══════════════════════════════════════════════════════════

export function initMelodyTextureLayer() {
  // Reset step clocks
  _clockCH3 = 0; _lastStepCH3 = -1;
  _clockCH5 = 0; _lastStepCH5 = -1;
  _clockCH6 = 0; _lastStepCH6 = -1;

  // Reset Markov history
  _histCH3 = [null, null];
  _histCH5 = [null, null];
  _histCH6 = [null, null];
  _intervCH5 = [];
  _intervCH6 = [];

  // Reset seed state
  _seedMotif          = null;
  _seedCaptured       = false;
  _seedReturned       = false;
  _ch5PhraseNoteCount = 0;
  _seedReturnQueue    = [];

  // Reset arpeggio state
  _arpMode        = false;
  _arpLastCH5Note = null;

  // Reset step counter
  _currentStep16 = 0;

  sendMIDIAllNotesOff();
  console.log('[MELODY] init');
}

export function updateMelodyTextureLayer(dt) {
  const bpm         = CFG.MACRO.bpmReference;
  const stepsPerSec = bpm * 4 / 60;  // 16th-note step rate

  // Seed return ha priorita — flush prima del resto
  _flushSeedQueue();
  _checkSeedReturn();

  // Aggiorna arpeggio mode ogni tick
  _arpMode = _isArpWindow();

  // ── CH3 clock — loop 7 step ──
  _clockCH3 += dt * stepsPerSec;
  const sCH3 = Math.floor(_clockCH3);
  if (sCH3 > _lastStepCH3) {
    for (let s = _lastStepCH3 + 1; s <= sCH3; s++) {
      _currentStep16 = s % 16;
      _onCH3Step(s % CFG.MELODY.loopLenCH3);
    }
    _lastStepCH3 = sCH3;
  }

  // ── CH5 clock — loop 11 step ──
  _clockCH5 += dt * stepsPerSec;
  const sCH5 = Math.floor(_clockCH5);
  if (sCH5 > _lastStepCH5) {
    for (let s = _lastStepCH5 + 1; s <= sCH5; s++) {
      _currentStep16 = s % 16;
      _onCH5Step(s % CFG.MELODY.loopLenCH5);
    }
    _lastStepCH5 = sCH5;
  }

  // ── CH6 clock — loop 13 step ──
  _clockCH6 += dt * stepsPerSec;
  const sCH6 = Math.floor(_clockCH6);
  if (sCH6 > _lastStepCH6) {
    for (let s = _lastStepCH6 + 1; s <= sCH6; s++) {
      _currentStep16 = s % 16;
      _onCH6Step(s % CFG.MELODY.loopLenCH6);
    }
    _lastStepCH6 = sCH6;
  }
}
