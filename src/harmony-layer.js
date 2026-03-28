// ═══════════════════════════════════════════════════════════
//  MACH:INE II — HarmonyLayer v3
//  Primo layer MIDI v3: drone root persistente su CH2, accordi
//  con voice leading su CH4, bass su CH3 — consuma macroState.
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { macroState } from './macro-composer.js';
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
let _lastMode        = 'A_lydian'; // ultimo modo processato (per detect mode change)
let _anchorIdx       = 0;    // indice anchor corrente nel modo
let _chordCycleIdx   = 0;    // posizione nella sequenza progressionCycle
let _prevBreakActive = false; // stato break precedente (per detect re-entry — RITM-05)

// Ritmo armonico
const _droneUpdateEvery = 2; // drone refresh ogni 2 bar (nota lunga 7.5 bar)
const _chordUpdateEvery = 2; // cambio accordo ogni 2 bar (Fix C: faster harmonic rhythm)

// ── Init ────────────────────────────────────────────────────────────────────
export function initHarmonyLayer() {
  _lastDroneBar   = -1;
  _lastChordBar   = -1;
  _currentVoicing = null;
  _lastMode       = 'A_lydian';
  _anchorIdx      = 0;
  _chordCycleIdx  = 0;

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
    const droneNote = CFG.MACRO.droneRoot[macroState.currentMode] || 57;

    // Durante pivot, il drone usa la nota pivot (D-11 — convergenza cromatica)
    const noteToSend = macroState.pivotActive ? macroState.pivotNote : droneNote;

    // HARM-06: drone breathing — skip con probabilita' inversamente proporzionale a harmonicColor
    // A harmonicColor basso: skip prob ~25%; a harmonicColor 1.0: skip prob ~5%
    const skipProb = CFG.MACRO.droneSkipProb * (1 - macroState.harmonicColor * 0.8);
    if (Math.random() >= skipProb) {
      // Velocity tappeto (40-65): piu' morbido del precedente 50-70
      const vel = 40 + Math.round(macroState.harmonicColor * 25);
      // Drone root su CH2 — nota molto lunga, rinnovata ogni 2 bar per continuita'
      _rawSend(2, noteToSend, Math.max(1, vel), barMs * 7.5);
      // Seconda voce (ottava alta) — probabilistica (HARM-06: 60% delle volte)
      if (Math.random() < CFG.MACRO.droneOctaveProb) {
        _rawSend(2, noteToSend + 12, Math.max(1, Math.round(vel * 0.7)), barMs * 7.5);
      }
    }
  }

  // Step D — Accordi su CH4 e bass su CH3 (HARM-03, HARM-04, HARM-05)
  if (currentBar >= _lastChordBar + _chordUpdateEvery) {
    _lastChordBar = currentBar;

    // Durante pivot, suona solo la nota pivot su CH4 (D-11 — finestra pivot 1 bar)
    if (macroState.pivotActive) {
      const pivotVel = 40 + Math.round(macroState.harmonicColor * 40);
      sendNote(4, macroState.pivotNote, pivotVel, barMs * 2);
      _currentVoicing = [macroState.pivotNote];
      return;
    }

    // Seleziona anchor voicing dalla progressionCycle predefinita per modo (narrativa ciclica)
    const anchors = CFG.MACRO.anchors[macroState.currentMode];
    if (!anchors || anchors.length === 0) return;

    const cycle = CFG.MACRO.progressionCycle[macroState.currentMode] || [0];
    const anchorTarget = cycle[_chordCycleIdx % cycle.length];
    _chordCycleIdx++;

    const anchor = anchors[Math.min(anchorTarget, anchors.length - 1)];

    // Voice leading algorithm (HARM-04: max 3 semitoni per voce)
    let chordNotes = anchor.ch4.slice();
    if (_currentVoicing && _currentVoicing.length > 0) {
      chordNotes = applyVoiceLeading(_currentVoicing, chordNotes, 3);
    }

    // Pentatonica + cromatismo Four Tet (HARM-05: 10-15% probabilita')
    // Nota cromatica = nota+1 (fuori dalla scala), poi risoluzione verso il basso
    const baseVel = 40 + Math.round(macroState.harmonicColor * 50);

    for (let i = 0; i < chordNotes.length; i++) {
      const note = chordNotes[i];

      if (Math.random() < 0.12) {
        // Cromatismo: nota+1 semitono (tensione fuori-scala)
        // Inviata prima con durata breve, poi la nota originale (risoluzione verso il basso)
        const chromatic = note + 1;
        const velC = Math.max(1, baseVel + Math.round((Math.random() - 0.5) * 6) - 5);
        sendNote(4, chromatic, velC, barMs * 1); // nota cromatica: 1 bar (meta' durata)
        // La nota originale (risoluzione) viene inviata con stagger +barMs per sovrapposizione
        // N.B. sendMIDINote usa performance.now() — lo stagger e' nell'offset del note-off
        const velR = Math.max(1, baseVel + Math.round((Math.random() - 0.5) * 6));
        sendNote(4, note, velR, barMs * (_chordUpdateEvery - 1) - 50);
      } else {
        // Nota pentatonica standard con stagger 15ms tra voci (MIDI-03: evita attacco meccanico)
        // N.B. il Worker non supporta setTimeout — lo stagger e' semantico; note consecutive
        // nell'handler ~2ms hanno gia' sfasamento naturale tra note-on e note-off individuali
        const vel = Math.max(1, baseVel + Math.round((Math.random() - 0.5) * 6));
        sendNote(4, note, vel, barMs * _chordUpdateEvery - 50);
      }
    }

    _currentVoicing = chordNotes;

    // Bass root/quinta su CH3 (HARM-03: separa struttura bassa da upper structure CH2)
    // RITM-05: basso silenzioso durante break, punch velocity al re-entry
    if (!macroState.breakActive) {
      const bassNote  = anchor.bass;
      const bassBoost = breakJustEnded ? CFG.RHYTHM.break.punchVelBoost : 0;
      const bassVel   = Math.min(127, 50 + Math.round(macroState.harmonicColor * 40) + bassBoost);
      sendNote(3, bassNote, bassVel, barMs * _chordUpdateEvery);
    }
  }
}
