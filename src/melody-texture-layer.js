// ═══════════════════════════════════════════════════════════
//  MACH:INE II — MelodyTextureLayer v3
//  CH3 (BASS) bassline melodica, CH5 (VOICE) gocce con memoria motivica,
//  CH6 (LEAD) voce indipendente angolosa
//  Riferimenti: Eno (loop prime) + Nyman (seed motivico) + Four Tet (texture)
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { macroState, isPerformanceStarted } from './macro-composer.js';
import { sendMIDINote as _rawSend, sendMIDIAllNotesOff } from './midi.js';
import { addMidiNote as _addMidiVisual } from './field.js';

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

// ── Step clocks per i due loop a lunghezze prime ──
let _clockCH5 = 0, _lastStepCH5 = -1;   // CH5 VOICE — 11 step
let _clockCH6 = 0, _lastStepCH6 = -1;   // CH6 LEAD — 13 step

// ── Markov voice state per CH5 e CH6 ──
let _histCH5 = [null, null];   // ultime 2 note CH5 (per Markov)
let _histCH6 = [null, null];   // ultime 2 note CH6

// ── Seed motivico (MELO-01, D-07/D-08/D-09) ──
let _seedMotif = null;           // array di intervalli (es. [2, -1, 3, 5])
let _seedCaptured = false;       // true dopo cattura nella finestra 0-seedWindowEnd
let _seedReturned = false;       // true dopo il ritorno unico a arcPercent > seedReturnAt
let _seedReturnQueue = [];       // micro-sequencer: { note, vel, dur, targetBar }

// ── Phrase buffer CH5 (ripetizione motivica — Reich/Nyman) ──
let _ch5Phrase    = [];          // frase corrente (array di note MIDI)
let _ch5PhrasePos = 0;           // posizione nella frase
let _ch5PhraseRepeats = 0;       // ripetizioni completate

// ── Arpeggi incrociati (D-05) ──
let _arpMode = false;            // true quando siamo nella finestra cross-arpeggio
let _arpLastCH5Note = null;      // ultima nota CH5 per costruire risposta CH6

// ── Step corrente per downbeat detection ──
let _currentStep16 = 0;

// ── M2: sweep sinusoidale CH6 in C#_dorian ──
let _sweepPhase = 0;

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

  // Visual: aggiunge direttamente al midiTrail — non dipende dal loopback MIDI
  _addMidiVisual(ch, note / 127, vel / 127);

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

// Genera nuova frase per CH5 via Markov — aggiorna _histCH5 con la fine della frase
function _generateCH5Phrase() {
  const len = CFG.MELODY.phrase.ch5Length;
  const tmpHist = [_histCH5[0], _histCH5[1]];
  const notes = [];
  for (let i = 0; i < len; i++) {
    notes.push(_nextVoiceNote(5, tmpHist, _seedMotif || []));
  }
  // Aggiorna history con la fine della frase (continuità inter-frase)
  if (notes.length >= 2) {
    _histCH5[0] = notes[notes.length - 2];
    _histCH5[1] = notes[notes.length - 1];
  } else if (notes.length === 1) {
    _histCH5[1] = notes[0];
  }
  return notes;
}

// CH5 VOICE — melodia rarefatta con seed (D-02, D-07)
function _onCH5Step() {
  const mA  = macroState.melodicActivity;
  const arc = macroState.arcPercent;

  // M1: mix melodico per modo — probabilita' e velocity scalate per sezione modale
  const mix = CFG.MELODY.modeMix[macroState.currentMode] ?? { ch5ProbMul: 1, ch5VelMul: 1 };

  // Gating — con eccezione per cattura seed in apertura (finestra seed)
  const baseProb   = CFG.MELODY.emitProbability.ch5Base * mix.ch5ProbMul;
  const seedWindow = !_seedCaptured && arc < CFG.MELODY.seedWindowEnd;
  if (seedWindow) {
    if (mA < CFG.MELODY.seedCaptureGateMin) return;
    if (Math.random() >= baseProb * Math.max(mA, 0.1)) return;
  } else {
    if (Math.random() >= baseProb * mA) return;
  }

  // Phrase buffer: genera nuova frase se esaurita o vuota
  const repeatCount = CFG.MELODY.phrase.ch5RepeatCount;
  if (_ch5Phrase.length === 0 || _ch5PhraseRepeats >= repeatCount) {
    _ch5Phrase    = _generateCH5Phrase();
    _ch5PhrasePos = 0;
    _ch5PhraseRepeats = 0;
    // Seed capture dalla prima frase generata nella finestra seed
    if (!_seedCaptured && arc < CFG.MELODY.seedWindowEnd && _ch5Phrase.length >= 2) {
      const intervals = [];
      for (let i = 1; i < _ch5Phrase.length; i++) intervals.push(_ch5Phrase[i] - _ch5Phrase[i - 1]);
      if (intervals.length >= CFG.MELODY.seedLength - 1) {
        _seedMotif    = intervals.slice(0, CFG.MELODY.seedLength);
        _seedCaptured = true;
        console.log('[MELODY] seed captured from phrase:', _seedMotif);
      }
    }
  }

  const note = _ch5Phrase[_ch5PhrasePos % _ch5Phrase.length];
  _ch5PhrasePos++;
  if (_ch5PhrasePos >= _ch5Phrase.length) { _ch5PhrasePos = 0; _ch5PhraseRepeats++; }

  const phase = mA < 0.3 ? 'sparse' : mA < 0.65 ? 'medium' : 'dense';
  const vel   = CFG.MELODY.velTarget[phase].ch5 * mix.ch5VelMul + _gaussianRand() * CFG.MELODY.velHumanize;
  const tD  = macroState.textureDepth;
  const dur = Math.round(CFG.MELODY.noteDur.ch5.dense + (CFG.MELODY.noteDur.ch5.sparse - CFG.MELODY.noteDur.ch5.dense) * (1 - tD));
  sendNote(5, note, vel, dur);

  if (_arpMode) _arpLastCH5Note = note;
}

// CH6 LEAD — voce indipendente angolosa 13-step (D-03)
function _onCH6Step(stepInLoop) {
  const mA = macroState.melodicActivity;

  // M1: mix melodico per modo
  const mix = CFG.MELODY.modeMix[macroState.currentMode] ?? { ch6ProbMul: 1, ch6VelMul: 1 };
  const baseProb = CFG.MELODY.emitProbability.ch6Base * mix.ch6ProbMul;
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

  // M2: velocity sweep sinusoidale in C#_dorian — lead "respira" su ciclo 16 bar
  const sweepMul = macroState.currentMode === 'C#_dorian'
    ? (1 - CFG.MELODY.sweep.amplitude) + CFG.MELODY.sweep.amplitude * (Math.sin(_sweepPhase) * 0.5 + 0.5)
    : 1.0;
  const vel = CFG.MELODY.velTarget[phase].ch6 * mix.ch6VelMul * sweepMul + _gaussianRand() * CFG.MELODY.velHumanize;
  const tD  = macroState.textureDepth;
  const dur = Math.round(CFG.MELODY.noteDur.ch6.dense + (CFG.MELODY.noteDur.ch6.sparse - CFG.MELODY.noteDur.ch6.dense) * (1 - tD));
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
  _clockCH5 = 0; _lastStepCH5 = -1;
  _clockCH6 = 0; _lastStepCH6 = -1;

  // Reset Markov history
  _histCH5 = [null, null];
  _histCH6 = [null, null];

  // Reset seed state
  _seedMotif       = null;
  _seedCaptured    = false;
  _seedReturned    = false;
  _seedReturnQueue = [];

  // Reset phrase buffer
  _ch5Phrase        = [];
  _ch5PhrasePos     = 0;
  _ch5PhraseRepeats = 0;

  // Reset arpeggio state
  _arpMode        = false;
  _arpLastCH5Note = null;

  // Reset step counter
  _currentStep16 = 0;

  // Reset sweep
  _sweepPhase = 0;

  sendMIDIAllNotesOff();
  console.log('[MELODY] init');
}

export function updateMelodyTextureLayer(dt) {
  if (!isPerformanceStarted()) return; // silenzio pre-performance

  const bpm         = CFG.MACRO.bpmReference;
  const stepsPerSec = bpm * 4 / 60;  // 16th-note step rate

  // M2: avanza sweep phase (continuo, usato solo in C#_dorian da _onCH6Step)
  _sweepPhase += dt * (bpm / 60 / 4) / CFG.MELODY.sweep.periodBars * Math.PI * 2;

  // Seed return ha priorita — flush prima del resto
  _flushSeedQueue();
  _checkSeedReturn();

  // Aggiorna arpeggio mode ogni tick
  _arpMode = _isArpWindow();

  // CH3 ceduto a HarmonyLayer (bass armonico strutturale ogni 2 bar)

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
