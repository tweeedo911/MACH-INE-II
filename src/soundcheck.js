// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Soundcheck Loop
//
//  Loop autonomo di 4 bar in D dorian a 90 BPM per test volumi/suoni
//  in soundcheck. Tutti gli 8 canali MIDI attivi insieme, loop infinito.
//  Non passa dal director3 — scrive direttamente sendMIDINote + addMidiNote.
//
//  Varianza del loop — serve a far sentire ogni canale su dinamiche diverse:
//  - Bar 0: velocity "normal" (75-90) — reference livello medio
//  - Bar 1: velocity "soft" (50-70) — sentire quando il mixer deve essere alto
//  - Bar 2: velocity "loud" (90-105) — sentire clipping/headroom
//  - Bar 3: velocity "medium" (70-85) — torna a casa
//
//  Percussioni GM drum kit su CH1 (hat closed/open, snare, tom, crash).
//  Se il tuo synth è mappato diversamente, queste note produrranno altri
//  suoni — comunque utili per verificare che CH1 riceva MIDI.
//
//  Attivazione: tasto `T`. Re-premi per fermare.
// ═══════════════════════════════════════════════════════════

import { sendMIDINote, sendMIDIAllNotesOff } from './midi.js';
import { addMidiNote } from './field.js';
import { setBiome, clearAll as clearCampo } from './campo.js';
import { worldState } from './world-state.js';

// ── Config ──
const BPM = 90;
const STEPS_PER_BAR = 16;
const STEP_SEC = 60 / BPM / 4;
const LOOP_BARS = 4;

// Canali MIDI (mapping standard del progetto)
const CH_KICK = 0, CH_PERC = 1, CH_DRONE = 2, CH_BASS = 3;
const CH_CHORD = 4, CH_VOICE = 5, CH_LEAD = 6, CH_ARP = 7;

// Note MIDI — D dorian (D E F G A B C D) + percussioni GM standard
const D2 = 38, F2 = 41, G2 = 43, A2 = 45, D3 = 50;
const A3 = 57, C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71;
const C5 = 72, CS5 = 73, D5 = 74, E5 = 76, F5 = 77, G5 = 79, A5 = 81, B5 = 83;
const C6 = 84, D6 = 86;

// GM drum kit su CH1 (kick è su CH0 separato)
const DR_KICK = 36;      // per CH0
const DR_SNARE = 38;     // backbeat
const DR_HAT_C = 42;     // hi-hat closed
const DR_HAT_O = 46;     // hi-hat open
const DR_TOM_L = 41;     // low floor tom
const DR_TOM_H = 50;     // high tom
const DR_CRASH = 49;     // crash cymbal
const DR_CLAP = 39;      // hand clap

// ── State ──
let _active = false;
let _acc = 0;
let _step = 0;
let _bar = 0;

// ── API ──
export function isSoundcheckActive() { return _active; }

export function startSoundcheck() {
  if (_active) return;
  // Pulisci note pending del director (drone 22s, chord 2s col lookahead)
  sendMIDIAllNotesOff();
  _active = true;
  _acc = 0;
  _step = 0;
  _bar = 0;
  clearCampo();
  setBiome('SOUNDCHECK');
  worldState.bpm = BPM;
  console.log('[SOUNDCHECK] ON — loop 4 bar D dorian 90 BPM con velocity cycle (T per fermare)');
}

export function stopSoundcheck() {
  if (!_active) return;
  _active = false;
  sendMIDIAllNotesOff();
  console.log('[SOUNDCHECK] OFF');
}

export function toggleSoundcheck() {
  if (_active) stopSoundcheck(); else startSoundcheck();
}

export function updateSoundcheck(dt) {
  if (!_active) return;
  _acc += dt;
  while (_acc >= STEP_SEC) {
    _acc -= STEP_SEC;
    const barPos = _bar % LOOP_BARS;
    _fireDrums(_step, barPos, _bar);
    _fireDrone(_step, _bar);
    _fireBass(_step, barPos);
    _fireChord(_step, barPos);
    _fireVoice(_step, barPos);
    _fireLead(_step, barPos);
    _fireArp(_step, barPos);
    _step++;
    if (_step >= STEPS_PER_BAR) { _step = 0; _bar++; }
  }
}

// ── Helper ──
function _fire(ch, note, vel, dur) {
  sendMIDINote(ch, note, vel, dur);
  addMidiNote(ch, note / 127, vel / 127);
}

// ═══════════════════════════════════════
//  Patterns per ruolo — 4-bar loop
// ═══════════════════════════════════════

// Velocity cycle per bar — reference per test dinamico:
// bar 0 = normal, 1 = soft, 2 = loud, 3 = medium
const V_KICK     = [92, 75, 100, 85];
const V_SNARE    = [95, 72, 105, 85];
const V_HAT_BASE = [55, 42, 68, 50];
const V_BASS     = [85, 68,  98, 78];
const V_CHORD    = [78, 62,  92, 72];
const V_VOICE    = [78, 60,  95, 72];
const V_LEAD     = [82, 60, 102, 70];
const V_ARP      = [72, 55,  88, 68];
const V_DRONE    = [70, 70,  70, 70];  // drone costante — rinnovo ogni 8 bar

// ── Drums (CH0 kick + CH1 percussioni GM) ──
function _fireDrums(step, barPos, bar) {
  // KICK 4/4 (CH0)
  if (step === 0 || step === 8) _fire(CH_KICK, DR_KICK, V_KICK[barPos], 130);

  // SNARE backbeat step 4+12
  if (step === 4 || step === 12) _fire(CH_PERC, DR_SNARE, V_SNARE[barPos], 90);

  // HAT CLOSED 8th steady (downbeat più forte)
  if (step % 2 === 0) {
    const boost = (step % 4 === 0) ? 12 : 0;
    _fire(CH_PERC, DR_HAT_C, V_HAT_BASE[barPos] + boost, 50);
  }

  // ── Variazioni per bar ──
  if (barPos === 1) {
    // Ghost snare step 7 (soft bar — ghost notes emergono)
    if (step === 7) _fire(CH_PERC, DR_SNARE, 38, 50);
    // Open hat step 14
    if (step === 14) _fire(CH_PERC, DR_HAT_O, 68, 220);
  } else if (barPos === 2) {
    // Clap raddoppia snare (loud bar)
    if (step === 4 || step === 12) _fire(CH_PERC, DR_CLAP, 90, 80);
    // Tom fill step 14
    if (step === 14) _fire(CH_PERC, DR_TOM_L, 88, 140);
    // Tom alto step 15
    if (step === 15) _fire(CH_PERC, DR_TOM_H, 82, 120);
  } else if (barPos === 3) {
    // Crash step 0 (dopo il bar loud, riparte il ciclo con crash)
    if (step === 0) _fire(CH_PERC, DR_CRASH, 90, 900);
    // Ghost snare step 11
    if (step === 11) _fire(CH_PERC, DR_SNARE, 42, 50);
    // Open hat step 14 come bar 1
    if (step === 14) _fire(CH_PERC, DR_HAT_O, 75, 200);
  }
}

// ── Drone (CH2) — nota lunga tenuta, rinnovo ogni 8 bar ──
function _fireDrone(step, bar) {
  if (step === 0 && bar % 8 === 0) _fire(CH_DRONE, D2, V_DRONE[0], 22000);
}

// ── Bass (CH3) — progressione root/quinta/settima ──
function _fireBass(step, barPos) {
  // Root ogni downbeat (step 0)
  if (step === 0) {
    const root = [D2, D2, D2, D2][barPos];
    _fire(CH_BASS, root, V_BASS[barPos], 480);
  }
  // Seconda metà step 8 — varianti
  if (step === 8) {
    const second = [A2, F2, G2, A2][barPos];  // D-A → D-F → D-G → D-A
    _fire(CH_BASS, second, V_BASS[barPos], 480);
  }
  // Fill solo bar 3 (medium bar) step 14
  if (barPos === 3 && step === 14) {
    _fire(CH_BASS, D3, V_BASS[barPos] - 10, 200);
  }
}

// ── Chord (CH4) — progressione 8 accordi in 4 bar ──
function _fireChord(step, barPos) {
  // Ogni bar ha 2 accordi (step 0 + step 8)
  const progression = [
    [[D4, F4, A4], [G4, B4, D5]],          // bar 0: Dm → G
    [[A3, C4, E4], [F4, A4, C5]],          // bar 1: Am → F (soft bar)
    [[D4, F4, A4], [C4, E4, G4]],          // bar 2: Dm → C (loud bar)
    [[G4, B4, D5], [A4, CS5, E5]],         // bar 3: G → A (dominante, torna a Dm)
  ];
  const vel = V_CHORD[barPos];
  if (step === 0) {
    for (const n of progression[barPos][0]) _fire(CH_CHORD, n, vel, 2000);
  }
  if (step === 8) {
    for (const n of progression[barPos][1]) _fire(CH_CHORD, n, vel, 2000);
  }
}

// ── Voice (CH5) — melodia aerea, frase di 4 bar ──
function _fireVoice(step, barPos) {
  const vel = V_VOICE[barPos];
  // Ogni bar ha 1-2 note cantanti in posizioni diverse
  const patterns = [
    [[0, A4], [12, D5]],       // bar 0
    [[0, C5], [12, A4]],       // bar 1 (soft)
    [[4, F5], [12, E5]],       // bar 2 (loud, salita)
    [[8, D5], [14, A4]],       // bar 3
  ];
  for (const [s, note] of patterns[barPos]) {
    if (step === s) _fire(CH_VOICE, note, vel, 900);
  }
}

// ── Lead (CH6) — frasi corte che alternano silenzio ──
function _fireLead(step, barPos) {
  const vel = V_LEAD[barPos];
  if (barPos === 0) {
    // Frase F-A-D rapida
    if (step === 8)  _fire(CH_LEAD, F5, vel, 280);
    if (step === 10) _fire(CH_LEAD, A5, vel, 280);
    if (step === 12) _fire(CH_LEAD, D5, vel, 480);
  } else if (barPos === 1) {
    // Silenzio — fa respirare il lead, il tecnico sente il canale soloed
  } else if (barPos === 2) {
    // Salita loud, 3 note
    if (step === 0)  _fire(CH_LEAD, E5, vel, 380);
    if (step === 8)  _fire(CH_LEAD, G5, vel, 380);
    if (step === 14) _fire(CH_LEAD, D5, vel, 280);
  } else if (barPos === 3) {
    // Coda soft-medium
    if (step === 4)  _fire(CH_LEAD, A5, vel, 400);
    if (step === 10) _fire(CH_LEAD, F5, vel, 400);
  }
}

// ── Arp (CH7) — 8th steady, pattern diverso per bar ──
function _fireArp(step, barPos) {
  if (step % 2 !== 0) return;
  const idx = step / 2;  // 0..7
  const vel = V_ARP[barPos];
  const patterns = [
    [D4, E4, F4, G4, A4, B4, C5, D5],   // bar 0: ascending D dorian
    [D5, C5, B4, A4, G4, F4, E4, D4],   // bar 1: descending (soft)
    [D5, E5, F5, G5, A5, B5, C6, D6],   // bar 2: ascending ottava alta (loud)
    [D4, F4, A4, C5, D4, F4, A4, C5],   // bar 3: arpeggio 1-3-5-7 ripetuto
  ];
  _fire(CH_ARP, patterns[barPos][idx], vel, 180);
}
