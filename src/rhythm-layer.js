// ═══════════════════════════════════════════════════════════
//  MACH:INE II — RhythmLayer v3
//  Arco ritmico completo: silenzio → pulse → groove → poliritmia → dissoluzione
//  CH0=PULSE (kick), CH1=GRAIN (hi-hat), CH7=PERCUSSION
//  Riferimenti: Boards of Canada → Autechre/Four Tet → Floating Points
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { macroState, isPerformanceStarted } from './macro-composer.js';
import { sendMIDINote as _rawSend, sendMIDIAllNotesOff } from './midi.js';
import { addMidiNote as _addMidiVisual } from './field.js';

// ── Stato step corrente — usato da sendNote per downbeat boost ────────────────
let _currentStep16 = 0;  // step corrente nel bar 16th-note (0-15)

// ═══════════════════════════════════════════════════════════
//  GATING E MIDI OPTIMIZATION WRAPPERS
//  Downbeat boost MIDI-01, pitch range MIDI-02, phrase offset MIDI-03
// ═══════════════════════════════════════════════════════════

// Approssimazione gaussiana (media 0, sigma ~1)
function _gaussianRand() {
  return (Math.random() + Math.random() + Math.random() - 1.5) * 2;
}

// Wrapper MIDI con gating, range enforcement e humanization
// Il hat NON passa qui — usa sendHatNote che bypassa il gating rhythmicDensity
function sendNote(ch, note, vel, dur) {
  // Gating su rhythmicDensity (eccetto hat che ha percorso separato)
  if (macroState.rhythmicDensity < 0.05) return;

  // MIDI-02: pitch range enforcement per canale
  const range = ch === 0
    ? CFG.RHYTHM.midi.pitchRange.ch0
    : CFG.RHYTHM.midi.pitchRange.ch7;
  note = Math.max(range.min, Math.min(range.max, note));

  // MIDI-01: downbeat boost / offbeat reduce
  const isDownbeat = (_currentStep16 % 4 === 0);
  if (isDownbeat) {
    vel = vel * (1 + CFG.RHYTHM.midi.downbeatBoost);
  } else {
    vel = vel * (1 - CFG.RHYTHM.midi.offbeatReduce);
  }

  // Humanize: scatter gaussiano
  vel += _gaussianRand() * (CFG.RHYTHM.kick.humanizeRange / 2);
  vel = Math.max(1, Math.min(127, Math.round(vel)));

  // Visual: feed midiTrail for halftone rendering
  _addMidiVisual(ch, note / 127, vel / 127);

  // Timing directionality (v4.1) — offbeats push/pull per phase
  // Downbeats stay on-grid as rhythmic anchor; offbeats shift for feel
  const pushMs = CFG.RHYTHM.timingPushMs?.[_currentPhase] || 0;
  if (!isDownbeat && pushMs !== 0) {
    const offset = pushMs + _gaussianRand() * 2; // ±2ms jitter on top
    setTimeout(() => _rawSend(ch, note, vel, dur), Math.max(0, offset));
    return;
  }

  // Direct send — no setTimeout (background tab throttles setTimeout to 1000ms, breaking timing)
  _rawSend(ch, note, vel, dur);
}

// Wrapper dedicato hi-hat — bypassa gating rhythmicDensity (RITM-01, D-06)
// Il hat suona SEMPRE — solo il velFloor garantisce presenza minima
function sendHatNote(note, vel, dur) {
  // MIDI-02: pitch range enforcement CH1 (C2-C4)
  const range = CFG.RHYTHM.midi.pitchRange.ch1;
  note = Math.max(range.min, Math.min(range.max, note));

  // MIDI-01: downbeat boost / offbeat reduce
  const isDownbeat = (_currentStep16 % 4 === 0);
  if (isDownbeat) {
    vel = vel * (1 + CFG.RHYTHM.midi.downbeatBoost);
  } else {
    vel = vel * (1 - CFG.RHYTHM.midi.offbeatReduce);
  }

  // Velocity floor assoluto — il hat non si azzera mai (D-06, RITM-01)
  vel = Math.max(CFG.RHYTHM.hat.velFloor, vel);
  vel = Math.max(1, Math.min(127, Math.round(vel)));

  // Visual: feed midiTrail for halftone rendering
  _addMidiVisual(CFG.RHYTHM.midi.channels.hat, note / 127, vel / 127);

  // Direct send — no setTimeout (background tab throttles setTimeout to 1000ms, breaking timing)
  _rawSend(CFG.RHYTHM.midi.channels.hat, note, vel, dur);
}

// ═══════════════════════════════════════════════════════════
//  STATO INTERNO
// ═══════════════════════════════════════════════════════════

let _clock      = 0;       // accumulatore step principale 16th-note
let _lastStep   = -1;      // ultimo step processato
let _bar        = 0;       // bar corrente (step / 16)

// Fase ritmica corrente — derivata da rhythmicDensity (RITM-02)
// Il kick non esiste nella fase ambient — solo texture percussiva
let _currentPhase       = 'arhythmic';
let _prevRhythmicDensity = 0;

// CH0 kick — gate e selezione pattern per bar
let _kickPatIdx    = 0;    // indice rotazione pattern (non usato direttamente, riservato)
let _kickBarActive  = true; // gate a livello di bar: il kick suona in questa bar?
let _kickPhraseBar  = 0;   // bar position within current phrase (0-3 emerging, 0-7 groove)
let _kickPhraseIdx  = 0;   // phrase count — increments per completed phrase, drives pattern rotation

// CH1 hi-hat — due sub-clock indipendenti per phasing Reich (D-11, RITM-04)
// Convergenza ogni 8*9=72 step (≈8-10 sec a 88 BPM) — tensione latente, non effetto esplicito
let _hatClockA     = 0;    // clock pattern A — 8 step
let _hatLastStepA  = -1;   // ultimo step A processato
let _hatClockB     = 0;    // clock pattern B — 9 step (drift naturale)
let _hatLastStepB  = -1;   // ultimo step B processato
let _hatPitchIdx   = 0;    // indice rotazione pitch cluster (D-04)

// CH7 percussion — additive Glass entry (RITM-03, D-10)
let _percActiveNotes = new Set();   // note attualmente attive nel groove
let _percPatterns    = {};          // pattern step per ogni nota attiva
let _percClocks      = {};          // clock per ogni nota (lunghezze prime = poliritmia)
let _percLastSteps   = {};          // ultimo step processato per ogni nota

// Eventi speciali gated (D-09) — trigger da arcPercent, non dai pattern normali
let _specialFired = { falseRes: false, climax: false, dissolve: false };

// Break ciclici kick+basso (RITM-05)
let _breakActive    = false;  // break corrente attivo
let _breakBarStart  = -1;     // bar di inizio break corrente
let _breakDurBars   = 0;      // durata break corrente in bar
let _nextBreakBar   = 12;     // bar a cui il prossimo break può iniziare
let _punchNextKick  = false;  // flag: prossimo kick esce con boost velocity

// ═══════════════════════════════════════════════════════════
//  PHASE DETECTION — arco 5 fasi (RITM-02)
// ═══════════════════════════════════════════════════════════

function _updatePhase() {
  const density = macroState.rhythmicDensity;
  const arc     = macroState.arcPercent;
  const thresh  = CFG.RHYTHM.phaseThresholds;

  let newPhase;

  // La dissoluzione si attiva quando arcPercent è alto E density sta scendendo
  if (arc > 0.85 && density < _prevRhythmicDensity) {
    newPhase = 'dissolving';
  } else if (density >= thresh.dissolving && arc > 0.80) {
    newPhase = 'dissolving';
  } else if (density >= thresh.climax) {
    newPhase = 'climax';
  } else if (density >= thresh.groove) {
    newPhase = 'groove';
  } else if (density >= thresh.emerging) {
    newPhase = 'emerging';
  } else {
    newPhase = 'arhythmic';
  }

  if (newPhase !== _currentPhase) {
    _currentPhase = newPhase;
    console.log('[RHYTHM] phase:', _currentPhase, '| density:', density.toFixed(2), '| arc:', arc.toFixed(2));
  }

  _prevRhythmicDensity = density;
}

// ═══════════════════════════════════════════════════════════
//  CH7 PERCUSSION — additive Glass entry (RITM-03, D-10)
// ═══════════════════════════════════════════════════════════

// Genera pattern euclidean-ish per una nota percussiva
// 'hits' colpi distribuiti su 'length' step
function _genPercPattern(length, hits) {
  const pat = new Array(length).fill(0);
  pat[0] = 1; // sempre downbeat
  if (hits <= 1) return pat;
  const spacing = Math.floor(length / hits);
  for (let i = 1; i < hits; i++) {
    pat[Math.min(length - 1, i * spacing)] = 1;
  }
  return pat;
}

// Controlla e attiva/disattiva note percussive in sequenza Glass
function _updatePercAdditive() {
  const density   = macroState.rhythmicDensity;
  const entries   = CFG.RHYTHM.perc.additiveEntry;
  const lengths   = CFG.RHYTHM.perc.patternLengths;  // [5,7,11,13]

  entries.forEach((entry, idx) => {
    const note    = entry.note;
    const isActive = _percActiveNotes.has(note);

    // Attivazione: density supera la threshold
    if (density >= entry.threshold && !isActive) {
      _percActiveNotes.add(note);
      const patLen  = lengths[Math.min(idx, lengths.length - 1)];
      // Hits proporzionali alla lunghezza — 2-3 colpi per ciclo
      const hits    = idx === 0 ? 2 : 3;
      _percPatterns[note]   = _genPercPattern(patLen, hits);
      // Sync al main clock: inizia alla fase corrente del bar, non da 0
      // Evita che il pattern parta sfasato rispetto alla griglia 4/4
      _percClocks[note]     = _clock % patLen;
      _percLastSteps[note]  = Math.floor(_percClocks[note]) - 1;
      console.log('[RHYTHM] +perc:', entry.name, 'density:', density.toFixed(2));
    }

    // Disattivazione con isteresi (threshold - 5%) — evita flicker
    if (isActive && density < entry.threshold - 0.05) {
      _percActiveNotes.delete(note);
      delete _percPatterns[note];
      delete _percClocks[note];
      delete _percLastSteps[note];
    }
  });
}

// Avanza i clock percussivi e invia note
function _updatePercClocks(dt, bpm) {
  if (_percActiveNotes.size === 0) return;
  const stepsPerSec = bpm * 4 / 60;

  _percActiveNotes.forEach(note => {
    if (!_percPatterns[note]) return;
    _percClocks[note] += dt * stepsPerSec;
    const pat    = _percPatterns[note];
    const patLen = pat.length;
    const curStep = Math.floor(_percClocks[note]);

    if (curStep > _percLastSteps[note]) {
      for (let s = _percLastSteps[note] + 1; s <= curStep; s++) {
        const si = s % patLen;
        if (pat[si] === 1) {
          let vel = CFG.RHYTHM.perc.velBase + _gaussianRand() * (CFG.RHYTHM.perc.humanizeRange / 2);
          vel = Math.max(1, Math.min(127, Math.round(vel)));
          sendNote(CFG.RHYTHM.midi.channels.perc, note, vel, CFG.RHYTHM.perc.durMs);
        }
      }
      _percLastSteps[note] = curStep;
    }
  });
}

// ═══════════════════════════════════════════════════════════
//  CH0 KICK — arco 5 fasi (D-02, D-03, RITM-02)
// ═══════════════════════════════════════════════════════════

function _onKickStep(step) {
  const s16   = step % 16;
  _bar        = Math.floor(step / 16);
  _currentStep16 = s16;

  // ── Break ciclici (RITM-05) — gestione a inizio bar ──────────────────────
  if (s16 === 0) {
    // H4: aggiorna finestra pre-break — letto da HarmonyLayer per hold armonico
    // e da _updateHatPhasing per accumulo densita'
    const barsToNext = _nextBreakBar - _bar;
    macroState.preBreakBars = (!_breakActive && barsToNext > 0 && barsToNext <= CFG.RHYTHM.break.preBreakBuildBars)
      ? barsToNext : 0;

    const arc = macroState.arcPercent;
    const br  = CFG.RHYTHM.break;

    if (_breakActive) {
      // Controlla se il break è finito
      if (_bar - _breakBarStart >= _breakDurBars) {
        _breakActive           = false;
        macroState.breakActive = false;
        _punchNextKick         = true;
        _kickBarActive         = true; // garantisce che il punch suoni immediatamente al re-entry
        // Schedula il prossimo break
        const cooldown = br.minCooldownBars +
          Math.floor(Math.random() * (br.maxCooldownBars - br.minCooldownBars + 1));
        _nextBreakBar = _bar + cooldown;
        console.log('[RHYTHM] break end — punch re-entry @bar', _bar, '| next in', cooldown, 'bars');
      }
    } else if (_bar >= _nextBreakBar && arc >= br.minArc && arc <= br.maxArc) {
      // Inizia nuovo break con probabilita'
      if (Math.random() < br.probability) {
        _breakDurBars          = br.minDurationBars +
          Math.floor(Math.random() * (br.maxDurationBars - br.minDurationBars + 1));
        _breakBarStart         = _bar;
        _breakActive           = true;
        macroState.breakActive = true;
        console.log('[RHYTHM] break start @bar', _bar, '| dur:', _breakDurBars, 'bars');
      } else {
        // Riprova al prossimo slot
        _nextBreakBar = _bar + br.minCooldownBars;
      }
    }
  }

  // Kick silenzioso durante il break
  if (_breakActive) return;

  const phase   = _currentPhase;
  const pats    = CFG.RHYTHM.kick.patterns;
  const gateP   = CFG.RHYTHM.kick.gateProbability;
  const isDown  = (s16 === 0);

  // Il kick non esiste nella fase ambient — solo texture percussiva
  if (phase === 'arhythmic') return;

  let pattern = null;

  if (phase === 'emerging') {
    // Deterministic 4-bar phrase: kick active only on bar 0 of each phrase (R1)
    if (s16 === 0) {
      _kickPhraseBar = _bar % CFG.RHYTHM.kick.phraseLen.emerging;
      if (_kickPhraseBar === 0) _kickPhraseIdx++;
      _kickBarActive = (_kickPhraseBar === 0);
    }
    if (!_kickBarActive) return;
    pattern = pats.broken1;

  } else if (phase === 'groove') {
    // Deterministic 8-bar phrase: bars 0-6 always active, bar 7 = optional breath (R1)
    if (s16 === 0) {
      _kickPhraseBar = _bar % CFG.RHYTHM.kick.phraseLen.groove;
      if (_kickPhraseBar === 0) _kickPhraseIdx++;
      // Bar 7 of phrase = breath — only random element in groove gate
      _kickBarActive = (_kickPhraseBar < 7) || (Math.random() < CFG.RHYTHM.kick.breathProb);
    }
    if (!_kickBarActive) return;
    // Pattern: mode-specific base, with phrase variation on top (R2)
    const modeBasePat = CFG.RHYTHM.kick.modePatterns[macroState.currentMode] || 'broken2';
    if (modeBasePat === 'fourOnFloor') {
      pattern = pats.fourOnFloor;
    } else {
      const groovePats = [pats[modeBasePat], pats.broken3, pats[modeBasePat], pats.broken4];
      pattern = groovePats[_kickPhraseIdx % groovePats.length];
    }

  } else if (phase === 'climax') {
    // 4-on-the-floor — Floating Points, poliritmia piena (D-02: solo qui)
    pattern = pats.fourOnFloor;

  } else if (phase === 'dissolving') {
    if (s16 === 0) _kickBarActive = Math.random() < gateP.dissolving;
    if (!_kickBarActive) return;
    pattern = pats.broken1;
  }

  // Fill: colpo anacrusico al beat 15 ogni 4 bar (frase chiara) (D-03)
  if (s16 === 15 && (_bar % 4 === 3) && Math.random() < CFG.RHYTHM.kick.fillProb) {
    const fillVel = Math.round(CFG.RHYTHM.kick.velOffbeat * 0.85);
    sendNote(CFG.RHYTHM.midi.channels.kick, CFG.RHYTHM.kick.note, fillVel, CFG.RHYTHM.kick.durMs);
  }

  if (!pattern || !pattern[s16]) return;

  // Punch velocity boost al re-entry dopo un break (RITM-05)
  let baseVel = isDown ? CFG.RHYTHM.kick.velDownbeat : CFG.RHYTHM.kick.velOffbeat;
  if (_punchNextKick) {
    baseVel = Math.min(127, baseVel + CFG.RHYTHM.break.punchVelBoost);
    _punchNextKick = false;
  }
  sendNote(CFG.RHYTHM.midi.channels.kick, CFG.RHYTHM.kick.note, baseVel, CFG.RHYTHM.kick.durMs);
}

// ═══════════════════════════════════════════════════════════
//  CH1 HI-HAT — phasing Reich 8/9 step (D-11, RITM-04)
//  Il hat non si interrompe mai — respiro percussivo costante (D-06, RITM-01)
// ═══════════════════════════════════════════════════════════

function _onHatHit(stepInCycle) {
  // Pitch rotation per hit — ogni colpo usa nota diversa del cluster (D-04)
  const cluster = CFG.RHYTHM.hat.pitchCluster;
  const pitch   = cluster[_hatPitchIdx % cluster.length];
  _hatPitchIdx++;

  // Velocity scatter gaussiano intorno al target di fase (D-05)
  const velTarget = CFG.RHYTHM.hat.velTarget[_currentPhase] || CFG.RHYTHM.hat.velTarget.arhythmic;
  // H4: lieve boost velocità hat durante accumulo pre-break
  const preBreakBoost = macroState.preBreakBars > 0 ? CFG.RHYTHM.break.preBreakVelBoost : 0;
  let vel = velTarget + preBreakBoost + _gaussianRand() * CFG.RHYTHM.hat.velScatter;

  // Legato ratio CH1 — durata staccato (MIDI-03)
  const durMs = CFG.RHYTHM.hat.durMs;

  sendHatNote(pitch, vel, durMs);
}

function _updateHatPhasing(dt, bpm) {
  const stepsPerSec = bpm * 4 / 60;
  const phasingActive = CFG.RHYTHM.hat.phasingActivePhases.includes(_currentPhase);
  // Densita' hat per fase — climax ogni 16th, groove ogni 8th, early ogni quarter
  // H4: pre-break buildup — densifica hat nell'ultima finestra prima del break
  const baseDiv = CFG.RHYTHM.hat.stepDivisorByPhase[_currentPhase] ?? 2;
  const stepDivisor = (macroState.preBreakBars > 0 && _currentPhase === 'groove')
    ? Math.max(1, baseDiv - 1) : baseDiv;

  // Clock A — 8 step (sempre attivo in tutte le fasi, D-12)
  _hatClockA += dt * stepsPerSec;
  const curStepA = Math.floor(_hatClockA / stepDivisor);
  if (curStepA > _hatLastStepA) {
    for (let s = _hatLastStepA + 1; s <= curStepA; s++) {
      const si = s % CFG.RHYTHM.hat.phasingStepsA;
      // Suona sempre (step 0 oppure hit casuali per texture aritmica)
      if (si === 0 || _currentPhase !== 'arhythmic') {
        _onHatHit(si);
      }
    }
    _hatLastStepA = curStepA;
  }

  // Clock B — 9 step (attivo solo nelle fasi phasingActivePhases, D-12)
  // Il drift tra 8 e 9 step crea la tensione latente Reich (D-11)
  if (phasingActive) {
    _hatClockB += dt * stepsPerSec;
    const curStepB = Math.floor(_hatClockB / stepDivisor);
    if (curStepB > _hatLastStepB) {
      for (let s = _hatLastStepB + 1; s <= curStepB; s++) {
        const si = s % CFG.RHYTHM.hat.phasingStepsB;
        _onHatHit(si);
      }
      _hatLastStepB = curStepB;
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  EVENTI SPECIALI — cue da arcPercent (D-09)
//  Note 60 (impact) e 62 (sweep) — non nei pattern normali
// ═══════════════════════════════════════════════════════════

function _checkSpecialEvents() {
  const arc = macroState.arcPercent;

  // False-resolution ~75% — impact
  if (!_specialFired.falseRes && arc >= 0.75) {
    _specialFired.falseRes = true;
    _rawSend(
      CFG.RHYTHM.midi.channels.perc,
      CFG.RHYTHM.perc.specialNotes[0],   // 60 = impact
      CFG.RHYTHM.perc.specialVel,
      CFG.RHYTHM.perc.specialDurMs
    );
    console.log('[RHYTHM] special: falseRes impact @', arc.toFixed(2));
  }

  // Climax peak ~84% — sweep
  if (!_specialFired.climax && arc >= 0.84) {
    _specialFired.climax = true;
    _rawSend(
      CFG.RHYTHM.midi.channels.perc,
      CFG.RHYTHM.perc.specialNotes[1],   // 62 = sweep
      CFG.RHYTHM.perc.specialVel,
      CFG.RHYTHM.perc.specialDurMs
    );
    console.log('[RHYTHM] special: climax sweep @', arc.toFixed(2));
  }

  // Dissoluzione avanzata >95% — chiusura impact
  if (!_specialFired.dissolve && arc >= 0.95) {
    _specialFired.dissolve = true;
    _rawSend(
      CFG.RHYTHM.midi.channels.perc,
      CFG.RHYTHM.perc.specialNotes[0],   // 60 = impact (chiusura)
      CFG.RHYTHM.perc.specialVel,
      CFG.RHYTHM.perc.specialDurMs
    );
    console.log('[RHYTHM] special: dissolve close @', arc.toFixed(2));
  }
}

// ═══════════════════════════════════════════════════════════
//  STEP DISPATCHER PRINCIPALE
// ═══════════════════════════════════════════════════════════

function _onMainStep(step) {
  // Aggiorna _currentStep16 per i wrapper sendNote
  _currentStep16 = step % 16;

  // CH0 kick — arco 5 fasi
  _onKickStep(step);
  // Il hat ha i suoi clock indipendenti (_updateHatPhasing)
  // Le perc hanno i loro clock indipendenti (_updatePercClocks)
}

// ═══════════════════════════════════════════════════════════
//  INIT / UPDATE — exports pubblici
// ═══════════════════════════════════════════════════════════

export function initRhythmLayer() {
  _clock              = 0;
  _lastStep           = -1;
  _bar                = 0;
  _currentStep16      = 0;
  _currentPhase       = 'arhythmic';
  _prevRhythmicDensity = 0;
  _kickPatIdx         = 0;
  _kickBarActive      = true;
  _kickPhraseBar      = 0;
  _kickPhraseIdx      = 0;

  _hatClockA          = 0;
  _hatLastStepA       = -1;
  _hatClockB          = 0;
  _hatLastStepB       = -1;
  _hatPitchIdx        = 0;

  _percActiveNotes    = new Set();
  _percPatterns       = {};
  _percClocks         = {};
  _percLastSteps      = {};

  _specialFired       = { falseRes: false, climax: false, dissolve: false };

  _breakActive        = false;
  _breakBarStart      = -1;
  _breakDurBars       = 0;
  _nextBreakBar       = 12;
  _punchNextKick      = false;

  sendMIDIAllNotesOff();
  console.log('[RHYTHM] init');
}

export function updateRhythmLayer(dt) {
  if (!isPerformanceStarted()) return; // silenzio pre-performance

  // Step 1 — Aggiorna fase ritmica e additive entry Glass
  _updatePhase();
  _updatePercAdditive();

  // Step 2 — Step sequencer principale 16th-note (pattern identico a composer.js)
  const bpm = CFG.RHYTHM.bpmSource === 'macro'
    ? CFG.MACRO.bpmReference
    : CFG.RHYTHM.bpm;
  const stepsPerSec = bpm * 4 / 60;
  _clock += dt * stepsPerSec;
  const currentStep = Math.floor(_clock);
  if (currentStep > _lastStep) {
    for (let s = _lastStep + 1; s <= currentStep; s++) {
      _onMainStep(s);
    }
    _lastStep = currentStep;
  }

  // Step 3 — Hi-hat phasing (clock indipendenti A=8step, B=9step)
  _updateHatPhasing(dt, bpm);

  // Step 4 — Percussion sub-clocks (lunghezze prime — poliritmia naturale, RITM-04)
  _updatePercClocks(dt, bpm);

  // Step 5 — Controllo eventi speciali arcPercent (D-09)
  _checkSpecialEvents();
}
