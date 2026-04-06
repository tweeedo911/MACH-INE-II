// ═══════════════════════════════════════════════════════════
//  MACH:INE II — HarmonyLayer v3
//  Primo layer MIDI v3: drone root persistente su CH2, accordi
//  con voice leading su CH4, bass su CH3 — consuma macroState.
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { macroState, isPerformanceStarted } from './macro-composer.js';
import { sendMIDINote as _rawSend, sendMIDIAllNotesOff } from './midi.js';
import { addMidiNote as _addMidiVisual } from './field.js';
import { recordDecision } from './session-recorder.js';

// ── Gating interno (D-09: non usa presence-multiplier.js) ───────────────────
// Identico al pattern composer (pm < 0.05) ma basato su harmonicColor
// Mode→engine mapping for characteristic note detection (v4.1)
const _MODE_ENGINE = { 'A_lydian': 'deriva', 'Bb_phrygian': 'abisso', 'D_dorian': 'terreno', 'C#_dorian': 'solco', 'E_phrygian': 'cristallo' };

function sendNote(ch, note, vel, dur) {
  const intensity = macroState.harmonicColor;
  if (intensity < 0.03) return;  // hard gate sotto 0.03 (quasi-zero)
  // v5: gradiente continuo — velocity scala con harmonicColor
  // intensity 0.03→0.30 = ramp-up, sopra 0.30 = piena proporzionalità
  const hcScale = Math.min(1.0, intensity * 1.5);  // 0.67 = full, sotto scala
  let scaledVel = Math.round(vel * hcScale);
  // Modal characteristic note boost (v4.1) — chord notes on the characteristic pitch shine
  const _charNotes = CFG.modalCharacteristicNotes;
  const _ek = _MODE_ENGINE[macroState.currentMode];
  if (_charNotes && _ek && _charNotes[_ek] !== undefined) {
    const root = CFG.MACRO.droneRoot[macroState.currentMode] || 57;
    if ((note % 12) === ((root + _charNotes[_ek]) % 12)) {
      scaledVel += CFG.characteristicVelBoost;
    }
  }
  scaledVel = Math.max(1, Math.min(127, scaledVel));
  _addMidiVisual(ch, note / 127, scaledVel / 127);
  _rawSend(ch, note, scaledVel, dur);
}

// ── Variabili interne ────────────────────────────────────────────────────────
let _lastDroneBar    = -1;   // ultimo bar in cui il drone e' stato inviato
let _lastChordBar    = -1;   // ultimo bar in cui l'accordo e' stato inviato
let _currentVoicing  = null; // array note MIDI ultimo voicing CH4 (per voice leading)
let _currentAnchor   = null; // anchor attivo — usato dal drone per tracking armonico (H3)
let _lastMode        = 'A_lydian'; // ultimo modo processato (per detect mode change)
let _anchorIdx       = 0;    // indice anchor corrente nel modo
let _chordCycleIdx   = 0;    // posizione nella sequenza progressionCycle
let _prevBreakActive = false; // stato break precedente (per detect re-entry — RITM-05)
let _prevDroneNoteLo = null;  // ultima nota bassa drone inviata (per note-off esplicito al cambio)
let _prevDroneNoteHi = null;  // ultima nota alta drone inviata (per note-off esplicito al cambio)
let _breathCounter   = 0;    // contatore respiri armonici — ogni breathInterval accordi ritorna alla tonica
let _modeChangeBar   = -999; // bar at which last mode change occurred (additive chord entry)

// Ritmo armonico
const _droneUpdateEvery = 4; // drone refresh ogni 4 bar — invariante

// ── v5: Bass step-clock dedicato (no setTimeout, background-safe) ──────────
let _bassClock     = 0;
let _bassLastStep  = -1;
let _bassBar       = 0;

// ── Init ────────────────────────────────────────────────────────────────────
export function initHarmonyLayer() {
  _lastDroneBar    = -1;
  _lastChordBar    = -1;
  _currentVoicing  = null;
  _currentAnchor   = null;
  _lastMode        = 'A_lydian';
  _anchorIdx       = 0;
  _chordCycleIdx   = 0;
  _prevBreakActive = false;  // reset esplicito — evita falso breakJustEnded al primo tick
  _prevDroneNoteLo = null;
  _prevDroneNoteHi = null;
  _breathCounter   = 0;
  _modeChangeBar   = -999;
  _bassClock       = 0;
  _bassLastStep    = -1;
  _bassBar         = 0;

  sendMIDIAllNotesOff(); // pulire note residue da sessioni precedenti

  console.log('[HARMONY] init');
}

// ── Voice leading algorithm ─────────────────────────────────────────────────
// Per ogni voce in prevChord, trova la nota candidata piu' vicina entro maxLeap.
// HARM-04: nessuna voce si sposta di piu' di 3 semitoni tra accordi consecutivi.
function applyVoiceLeading(prevChord, candidateNotes, maxLeap) {
  if (!prevChord || prevChord.length === 0) return candidateNotes.slice();
  const used = new Set();

  return prevChord.map(prev => {
    let best     = candidateNotes[0];
    let bestDist = Infinity;

    // Prima passata: cerca entro maxLeap
    for (const n of candidateNotes) {
      if (used.has(n)) continue;
      const dist = Math.abs(n - prev);
      if (dist <= maxLeap && dist < bestDist) {
        bestDist = dist;
        best     = n;
      }
    }

    // Seconda passata: se nessuna candidata entro maxLeap, prende la piu' vicina
    if (bestDist === Infinity) {
      for (const n of candidateNotes) {
        if (used.has(n)) continue;
        const dist = Math.abs(n - prev);
        if (dist < bestDist) {
          bestDist = dist;
          best     = n;
        }
      }
    }

    used.add(best);
    return best;
  });
}

// ── Update — chiamato ogni ~2ms dal Worker ────────────────────────────────────
export function updateHarmonyLayer(_dt) {
  if (!isPerformanceStarted()) return; // silenzio pre-performance

  // Step A — Bar clock e durata bar
  const currentBar = Math.floor(macroState.barClock);
  const bpm        = macroState.currentBpm;
  const barMs      = (60 / bpm) * 4 * 1000; // durata 1 bar in ms (4/4)

  // RITM-05: rileva re-entry dopo break (per punch bass)
  const breakJustEnded = _prevBreakActive && !macroState.breakActive;
  _prevBreakActive     = macroState.breakActive;

  // Step B — Detect mode change e reset ancora
  if (macroState.currentMode !== _lastMode) {
    _lastMode       = macroState.currentMode;
    _anchorIdx      = 0;
    _chordCycleIdx  = 0;
    _modeChangeBar  = currentBar; // additive chord entry — track mode change bar
    // NON resettare _currentVoicing — serve per voice leading nella transizione
    console.log('[HARMONY] mode change to:', _lastMode);
    recordDecision('mode_change', _lastMode);
  }

  // Step C — Drone root su CH2 (HARM-01, D-15)
  // Il drone e' il cuore armonico — SEMPRE attivo indipendentemente dal gating.
  // Usa _rawSend diretto (bypassa gating harmonicColor) per garantire HARM-01.
  // La velocity e' comunque proporzionale a harmonicColor per dinamica naturale.
  if (currentBar >= _lastDroneBar + _droneUpdateEvery) {
    _lastDroneBar = currentBar;

    // Drone variato (H3): usa ch2 dell'anchor attivo per tracking armonico.
    // Fallback a droneRoot quando _currentAnchor non e' ancora inizializzato.
    const ch2         = _currentAnchor?.ch2;
    const droneNote   = ch2?.[0] ?? (CFG.MACRO.droneRoot[macroState.currentMode] ?? 57);
    const droneHigh   = ch2?.[1] ?? (droneNote + 12);

    // Durante pivot, il drone usa la nota pivot (D-11 — convergenza cromatica)
    const noteToSend  = macroState.pivotActive ? macroState.pivotNote : droneNote;
    const highToSend  = macroState.pivotActive ? macroState.pivotNote + 12 : droneHigh;

    // Stop note precedenti se cambiate — evita sovrapposizione dissonante (H3-fix)
    // vel=0 su canale 0x90 = note-off standard MIDI
    if (_prevDroneNoteLo !== null && _prevDroneNoteLo !== noteToSend) {
      _rawSend(2, _prevDroneNoteLo, 0, 0);
    }
    if (_prevDroneNoteHi !== null && _prevDroneNoteHi !== highToSend) {
      _rawSend(2, _prevDroneNoteHi, 0, 0);
      _prevDroneNoteHi = null;
    }

    // HARM-06: drone breathing — skip con probabilita' inversamente proporzionale a harmonicColor
    const skipProb = CFG.MACRO.droneSkipProb * (1 - macroState.harmonicColor * 0.8);
    if (Math.random() >= skipProb) {
      const vel = 40 + Math.round(macroState.harmonicColor * 25);
      _rawSend(2, noteToSend, Math.max(1, vel), barMs * 7.5);
      _prevDroneNoteLo = noteToSend;
      if (Math.random() < CFG.MACRO.droneOctaveProb) {
        _rawSend(2, highToSend, Math.max(1, Math.round(vel * 0.7)), barMs * 7.5);
        _prevDroneNoteHi = highToSend;
      }
    }
  }

  // Step D — Accordi su CH4 e bass su CH3 (HARM-03, HARM-04, HARM-05)
  // Ritmo armonico dinamico (D-16): lento/normale/pulsante keyed su harmonicColor
  const hC = macroState.harmonicColor;
  const chordEvery   = hC < 0.25 ? 4 : hC < 0.65 ? 2 : 1;
  const activeCycle  = hC < 0.25
    ? (CFG.MACRO.progressionSlow[macroState.currentMode] || [0])
    : hC >= 0.65
      ? (CFG.MACRO.progressionFast[macroState.currentMode] || [0])
      : (CFG.MACRO.progressionCycle[macroState.currentMode] || [0]);

  if (currentBar >= _lastChordBar + chordEvery) {
    _lastChordBar = currentBar;

    // H4: hold armonico durante pre-break buildup — ripete l'accordo corrente,
    // crea tensione per ripetizione (techno pattern) prima del drop
    if (macroState.preBreakBars > 0) return;

    // Durante pivot, suona solo la nota pivot su CH4 (D-11 — finestra pivot 1 bar)
    if (macroState.pivotActive) {
      const pivotVel = 40 + Math.round(macroState.harmonicColor * 40);
      sendNote(4, macroState.pivotNote, pivotVel, barMs * 2);
      _currentVoicing = [macroState.pivotNote];
      return;
    }

    // Seleziona anchor voicing dal ciclo attivo per modo (narrativa ciclica)
    const anchors = CFG.MACRO.anchors[macroState.currentMode];
    if (!anchors || anchors.length === 0) return;

    // Respiro armonico: ogni breathInterval cambi accordo, ritorna alla tonica (anchor 0)
    // Crea momenti di risoluzione periodica — narrazione tensione/respiro
    _breathCounter++;
    let anchorTarget;
    if (CFG.MACRO.breathInterval > 0 && _breathCounter >= CFG.MACRO.breathInterval) {
      _breathCounter = 0;
      anchorTarget = 0;  // tonica — momento di risoluzione
    } else {
      anchorTarget = activeCycle[_chordCycleIdx % activeCycle.length];
    }
    _chordCycleIdx++;

    const anchor = anchors[Math.min(anchorTarget, anchors.length - 1)];
    _currentAnchor = anchor; // cache per drone tracking armonico (H3)

    // Voice leading algorithm (HARM-04: max 3 semitoni per voce)
    let chordNotes = anchor.ch4.slice();
    if (_currentVoicing && _currentVoicing.length > 0) {
      chordNotes = applyVoiceLeading(_currentVoicing, chordNotes, 3);
    }

    // Additive chord entry — build voicing note by note after mode change (v4)
    const _additive = CFG.MACRO.chordAdditiveEntry;
    if (_additive && _additive.enabled) {
      const barsSinceChange = currentBar - _modeChangeBar;
      if (barsSinceChange < _additive.barsRootOnly) {
        chordNotes = chordNotes.slice(0, 1); // root only
      } else if (barsSinceChange < _additive.barsRootOnly + _additive.barsRootFifth) {
        chordNotes = chordNotes.slice(0, Math.min(2, chordNotes.length)); // root + fifth
      }
      // else: full voicing (no filtering)
    }

    // Pentatonica + cromatismo Four Tet (HARM-05)
    // Disabilitato in fase pulsante (chordEvery=1): non compatibile col pulse 1-bar
    const baseVel = 40 + Math.round(macroState.harmonicColor * 50);

    for (let i = 0; i < chordNotes.length; i++) {
      const note = chordNotes[i];

      if (chordEvery > 1 && Math.random() < 0.12) {
        // Cromatismo: nota+1 semitono, poi risoluzione verso il basso
        const chromatic = note + 1;
        const velC = Math.max(1, baseVel + Math.round((Math.random() - 0.5) * 6) - 5);
        sendNote(4, chromatic, velC, barMs * 1);
        const velR = Math.max(1, baseVel + Math.round((Math.random() - 0.5) * 6));
        sendNote(4, note, velR, barMs * (chordEvery - 1) - 50);
      } else {
        const vel = Math.max(1, baseVel + Math.round((Math.random() - 0.5) * 6));
        sendNote(4, note, vel, barMs * chordEvery - 50);
      }
    }

    _currentVoicing = chordNotes;

    // Bass is now handled by _updateBass step-clock (v5) — not here
  }

  // v5: Bass step-clock — independent 16th-note clock, no setTimeout
  _updateBass(_dt, breakJustEnded);
}

// ═══════════════════════════════════════════════════════════
//  v5: BASS COME PROTAGONISTA (CH3) — step-clock dedicato
//  Pattern 16-step per modo, zero setTimeout, background-safe.
//  Ref: Basic Channel (sub dub), Plastikman (poche note lunghe),
//  SOLCO vecchio (rolling pump), Burial (sincopato)
// ═══════════════════════════════════════════════════════════

// 16-step patterns: 1=play, 0=rest. Root note overridden per step where needed.
const _BASS_PATTERNS = {
  // A_lydian: sub pulsante lento — 1 nota ogni 2 bar (Plastikman Consumed)
  'A_lydian':    { pat: [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], interval: 2, notes: [0] },
  // Bb_phrygian: dub — root on 1, ghost on "and of 3", fifth ogni 4 bar
  'Bb_phrygian': { pat: [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0], interval: 1, notes: [0, 0, 0] },
  // D_dorian: walking 8ths — root, root, fifth, alt pattern cycling
  'D_dorian':    { pat: [1,0,1,0, 1,0,1,0, 0,0,0,0, 0,0,0,0], interval: 1, notes: [0, 0, 7, 0] },
  // C#_dorian: rolling pump — every beat, velocity sweep (Berlin techno)
  'C#_dorian':   { pat: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], interval: 1, notes: [0] },
  // E_phrygian: sub drone — 1 nota ogni 3 bar
  'E_phrygian':  { pat: [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], interval: 3, notes: [0] },
};

function _updateBass(dt, breakJustEnded) {
  if (macroState.breakActive) return;
  if (!_currentAnchor) return;

  const bpm = macroState.currentBpm;
  const stepsPerSec = bpm * 4 / 60;  // 16th notes per second
  _bassClock += dt * stepsPerSec;
  const currentStep = Math.floor(_bassClock);
  if (currentStep <= _bassLastStep) return;

  const barMs  = (60 / bpm) * 4 * 1000;
  const stepMs = barMs / 16;
  const mode   = macroState.currentMode;
  const hC     = macroState.harmonicColor;
  const root   = _currentAnchor.bass;
  const alt    = _currentAnchor.bassAlt ?? root;
  const bassBoost = breakJustEnded ? CFG.RHYTHM.break.punchVelBoost : 0;
  const velBase = Math.min(127, 55 + Math.round(hC * 45) + bassBoost);

  const cfg = _BASS_PATTERNS[mode] || _BASS_PATTERNS['A_lydian'];

  for (let s = _bassLastStep + 1; s <= currentStep; s++) {
    const s16 = s % 16;
    _bassBar  = Math.floor(s / 16);

    // Interval gating: some modes only play every N bars
    if (cfg.interval > 1 && (_bassBar % cfg.interval !== 0) && s16 === 0) continue;
    // For interval>1, only process bar 0 of each interval group
    if (cfg.interval > 1 && (_bassBar % cfg.interval !== 0)) continue;

    if (!cfg.pat[s16]) continue;

    // Note selection: root by default, offset from cfg.notes array
    const noteOffset = cfg.notes[s16 % cfg.notes.length] || 0;
    let note = root + noteOffset;

    // Mode-specific embellishments (no setTimeout needed — all on-grid)
    let vel = velBase;

    if (mode === 'A_lydian') {
      // Sub pulsante: velocity bassa, nota lunga
      vel = Math.round(velBase * 0.75);
      sendNote(3, note, vel, barMs * 2);

    } else if (mode === 'Bb_phrygian') {
      // Dub: downbeat forte, step 10 = ghost (vel dimezzata)
      if (s16 === 0) {
        sendNote(3, note, vel, stepMs * 8);
      } else if (s16 === 10 && hC > 0.30) {
        // Ghost on "and of 3"
        sendNote(3, root, Math.round(vel * 0.4), stepMs * 3);
      }
      // Fifth alternation every 4 bars on step 12
      if (s16 === 0 && _bassBar % 4 >= 2 && hC > 0.40) {
        sendNote(3, root + 7, Math.round(vel * 0.55), stepMs * 6);
      }

    } else if (mode === 'D_dorian') {
      // Walking 8ths: steps 0,2,4,6 with rotating notes
      const walkPool = [root, root, root + 7, alt];
      note = walkPool[(s16 / 2 + _bassBar) % walkPool.length];
      const durMs = hC > 0.50 ? stepMs * 3 : stepMs * 6;
      sendNote(3, note, vel, durMs);

    } else if (mode === 'C#_dorian') {
      // Rolling pump: every beat with velocity sweep
      const sweepPhase = (_bassBar % 8) / 8 * Math.PI * 2;
      const sweepVel = vel + Math.sin(sweepPhase + s16 / 16 * Math.PI) * 18;
      sendNote(3, root, Math.max(1, Math.round(sweepVel)), stepMs * 3);

    } else if (mode === 'E_phrygian') {
      // Sub drone: one long note
      vel = Math.round(velBase * 0.55);
      sendNote(3, root, vel, barMs * 3);

    } else {
      sendNote(3, root, vel, stepMs * 8);
    }
  }
  _bassLastStep = currentStep;
}
