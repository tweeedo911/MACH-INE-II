// ═══════════════════════════════════════════════════════════
//  MACH:INE II — HarmonyLayer v3
//  Primo layer MIDI v3: drone root persistente su CH2, accordi
//  con voice leading su CH4, bass su CH3 — consuma macroState.
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { macroState, isPerformanceStarted } from './macro-composer.js';
import { sendMIDINote as _rawSend, sendMIDIAllNotesOff } from './midi.js';

// ── Gating interno (D-09: non usa presence-multiplier.js) ───────────────────
// Identico al pattern composer (pm < 0.05) ma basato su harmonicColor
function sendNote(ch, note, vel, dur) {
  const intensity = macroState.harmonicColor;
  if (intensity < 0.05) return;  // gating: silenzio armonico sotto la soglia
  _rawSend(ch, note, Math.max(1, Math.round(vel * intensity)), dur);
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

// Ritmo armonico
const _droneUpdateEvery = 4; // drone refresh ogni 4 bar — invariante

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
  const bpm        = CFG.MACRO.bpmReference;
  const barMs      = (60 / bpm) * 4 * 1000; // durata 1 bar in ms (4/4)

  // RITM-05: rileva re-entry dopo break (per punch bass)
  const breakJustEnded = _prevBreakActive && !macroState.breakActive;
  _prevBreakActive     = macroState.breakActive;

  // Step B — Detect mode change e reset ancora
  if (macroState.currentMode !== _lastMode) {
    _lastMode       = macroState.currentMode;
    _anchorIdx      = 0;
    _chordCycleIdx  = 0;
    // NON resettare _currentVoicing — serve per voice leading nella transizione
    console.log('[HARMONY] mode change to:', _lastMode);
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

    const anchorTarget = activeCycle[_chordCycleIdx % activeCycle.length];
    _chordCycleIdx++;

    const anchor = anchors[Math.min(anchorTarget, anchors.length - 1)];
    _currentAnchor = anchor; // cache per drone tracking armonico (H3)

    // Voice leading algorithm (HARM-04: max 3 semitoni per voce)
    let chordNotes = anchor.ch4.slice();
    if (_currentVoicing && _currentVoicing.length > 0) {
      chordNotes = applyVoiceLeading(_currentVoicing, chordNotes, 3);
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

    // Bass melodico su CH3 (H3)
    // Fase pulsante (chordEvery=1): bass sempre root per pump — no alternazione
    // Fasi lenta/normale: alterna bass/bassAlt ogni cambio accordo
    // RITM-05: basso silenzioso durante break, punch velocity al re-entry
    if (!macroState.breakActive) {
      const bassNote  = chordEvery === 1
        ? anchor.bass
        : (_chordCycleIdx % 2 === 0 ? anchor.bass : (anchor.bassAlt ?? anchor.bass));
      const bassBoost = breakJustEnded ? CFG.RHYTHM.break.punchVelBoost : 0;
      const bassVel   = Math.min(127, 50 + Math.round(macroState.harmonicColor * 40) + bassBoost);
      sendNote(3, bassNote, bassVel, barMs * chordEvery);
    }
  }
}
