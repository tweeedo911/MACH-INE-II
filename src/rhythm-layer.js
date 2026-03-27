// ═══════════════════════════════════════════════════════════
//  MACH:INE II — RhythmLayer v3
//  Arco ritmico completo: silenzio → pulse → groove → poliritmia → dissoluzione
//  CH0=PULSE (kick), CH1=GRAIN (hi-hat), CH7=PERCUSSION
//  Riferimenti: Boards of Canada → Autechre/Four Tet → Floating Points
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { macroState } from './macro-composer.js';
import { sendMIDINote as _rawSend, sendMIDIAllNotesOff } from './midi.js';

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

  // MIDI-03: phrase offset — sfasamento microtemporale per evitare attacchi meccanici
  const offsetRange = CFG.RHYTHM.midi.noteOffsetMs;
  const offset = Math.random() * (offsetRange.max - offsetRange.min) + offsetRange.min;
  setTimeout(() => _rawSend(ch, note, vel, dur), offset);
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

  // MIDI-03: sfasamento micro per naturalezza
  const offsetRange = CFG.RHYTHM.midi.noteOffsetMs;
  const offset = Math.random() * (offsetRange.max - offsetRange.min) + offsetRange.min;
  setTimeout(() => _rawSend(CFG.RHYTHM.midi.channels.hat, note, vel, dur), offset);
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

// CH0 kick — selezione pattern
let _kickPatIdx = 0;       // indice alternanza pattern nella fase groove

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
      _percClocks[note]     = 0;
      _percLastSteps[note]  = -1;
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

  const phase   = _currentPhase;
  const pats    = CFG.RHYTHM.kick.patterns;
  const gateP   = CFG.RHYTHM.kick.gateProbability;
  const isDown  = (s16 === 0);

  // Il kick non esiste nella fase ambient — solo texture percussiva
  if (phase === 'arhythmic') return;

  let pattern = null;

  if (phase === 'emerging') {
    // Broken/frammentato — Autechre, Four Tet (D-02)
    // Probability gate esponenziale: molto raro ma non casuale
    if (Math.random() > gateP.emerging) return;
    // Selezione random tra broken1/2/3 per varietà frammentata
    const brokenPats = [pats.broken1, pats.broken2, pats.broken3];
    pattern = brokenPats[Math.floor(Math.random() * brokenPats.length)];

  } else if (phase === 'groove') {
    // Groove che si consolida ma non ancora 4/4 (D-02)
    if (Math.random() > gateP.groove) return;
    // Alternanza broken2/broken3 ogni 8 bar
    pattern = (_bar % 16 < 8) ? pats.broken2 : pats.broken3;

  } else if (phase === 'climax') {
    // 4-on-the-floor — Floating Points, poliritmia piena (D-02: solo qui)
    pattern = pats.fourOnFloor;
    // Gate probability 1.0 — ogni step del pattern suona

  } else if (phase === 'dissolving') {
    // Mirror di emerging — il groove si frammenta (D-01)
    if (Math.random() > gateP.dissolving) return;
    pattern = pats.broken1;
  }

  if (!pattern || !pattern[s16]) return;

  const baseVel = isDown ? CFG.RHYTHM.kick.velDownbeat : CFG.RHYTHM.kick.velOffbeat;
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
  let vel = velTarget + _gaussianRand() * CFG.RHYTHM.hat.velScatter;

  // Legato ratio CH1 — durata staccato (MIDI-03)
  const durMs = CFG.RHYTHM.hat.durMs;

  sendHatNote(pitch, vel, durMs);
}

function _updateHatPhasing(dt, bpm) {
  const stepsPerSec = bpm * 4 / 60;
  const phasingActive = CFG.RHYTHM.hat.phasingActivePhases.includes(_currentPhase);
  const stepDivisor   = CFG.RHYTHM.hat.stepDivisor;  // default 2 = ogni 8th note

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

  sendMIDIAllNotesOff();
  console.log('[RHYTHM] init');
}

export function updateRhythmLayer(dt) {
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
