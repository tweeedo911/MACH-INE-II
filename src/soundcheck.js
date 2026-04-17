// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Soundcheck Loop
//
//  Groove autonomo 4 bar in D dorian a 90 BPM per test livelli/suoni
//  in soundcheck. Tutti gli 8 canali MIDI attivi insieme, loop infinito.
//  Non passa dal director3 — scrive direttamente sendMIDINote + addMidiNote.
//
//  Attivazione: tasto `T` (vedi main.js). Se il director è in play viene
//  messo in pausa prima di avviare. Tasto `T` di nuovo → stop.
// ═══════════════════════════════════════════════════════════

import { sendMIDINote, sendMIDIAllNotesOff } from './midi.js';
import { addMidiNote } from './field.js';
import { setBiome, clearAll as clearCampo } from './campo.js';
import { worldState } from './world-state.js';

// ── Config ──
const BPM = 90;
const STEPS_PER_BAR = 16;  // 16th grid
const STEP_SEC = 60 / BPM / 4;  // durata di un 16th

// Tonalità: D dorian (D E F G A B C D)
const D2 = 38, A2 = 45;
const D4 = 62, F4 = 65, A4 = 69, C5 = 72, G4 = 67, B4 = 71, D5 = 74, F5 = 77, A5 = 81;
const ARP_SCALE = [D4, 64 /*E4*/, F4, G4, A4, B4, C5, D5];  // 8 note = 8 sedicesimi × 2 = 1 bar a 8th

// Velocity bilanciate per soundcheck — volumi relativi dipendono da mixer/synth.
const V_KICK = 90, V_PERC = 80, V_DRONE = 70, V_BASS = 85;
const V_CHORD = 75, V_VOICE = 75, V_LEAD = 80, V_ARP = 70;

// Canali (stesso mapping di MIDI_ROLES in midi.js)
const CH_KICK = 0, CH_PERC = 1, CH_DRONE = 2, CH_BASS = 3;
const CH_CHORD = 4, CH_VOICE = 5, CH_LEAD = 6, CH_ARP = 7;

// ── State ──
let _active = false;
let _acc = 0;       // secondi accumulati dal tick
let _step = 0;      // posizione 16th [0..15]
let _bar = 0;       // conteggio bar assoluto

// ── API ──
export function isSoundcheckActive() { return _active; }

export function startSoundcheck() {
  if (_active) return;
  // Pulisci stato MIDI precedente: chi ha schedulato note lunghe (drone, chord
  // fino a 22s) le avrebbe ancora pending. AllNotesOff le spegne sul synth.
  sendMIDIAllNotesOff();
  _active = true;
  _acc = 0;
  _step = 0;
  _bar = 0;
  clearCampo();          // pulisce il campo dai depositi precedenti
  setBiome('SOUNDCHECK');
  worldState.bpm = BPM;
  console.log('[SOUNDCHECK] ON — D dorian 90 BPM loop (tasto T per fermare)');
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

// Chiamato dal worker handler in main.js — stesso dt del director
export function updateSoundcheck(dt) {
  if (!_active) return;
  _acc += dt;
  while (_acc >= STEP_SEC) {
    _acc -= STEP_SEC;
    _fireStep(_step, _bar);
    _step++;
    if (_step >= STEPS_PER_BAR) {
      _step = 0;
      _bar++;
    }
  }
}

// ── Emissione eventi per step ──
function _fire(ch, note, vel, dur) {
  sendMIDINote(ch, note, vel, dur);
  addMidiNote(ch, note / 127, vel / 127);
}

function _fireStep(step, bar) {
  // KICK — 4/4 (step 0, 8)
  if (step === 0 || step === 8) _fire(CH_KICK, 36, V_KICK, 120);

  // PERC — offbeat (step 4, 12)
  if (step === 4 || step === 12) _fire(CH_PERC, 38, V_PERC, 90);

  // DRONE — D2 tenuto, si rinnova ogni 8 bar per non tagliare
  if (step === 0 && bar % 8 === 0) _fire(CH_DRONE, D2, V_DRONE, 22000);

  // BASS — root/quinta (step 0 D, step 8 A)
  if (step === 0) _fire(CH_BASS, D2, V_BASS, 450);
  if (step === 8) _fire(CH_BASS, A2, V_BASS, 450);

  // CHORD — Dm7 step 0, G step 8 (3 note simultanee per accordo)
  if (step === 0) {
    _fire(CH_CHORD, D4, V_CHORD, 2000);
    _fire(CH_CHORD, F4, V_CHORD, 2000);
    _fire(CH_CHORD, A4, V_CHORD, 2000);
  }
  if (step === 8) {
    _fire(CH_CHORD, G4, V_CHORD, 2000);
    _fire(CH_CHORD, B4, V_CHORD, 2000);
    _fire(CH_CHORD, D5, V_CHORD, 2000);
  }

  // VOICE — aerea (step 0 A4, step 12 D5)
  if (step === 0) _fire(CH_VOICE, A4, V_VOICE, 1400);
  if (step === 12) _fire(CH_VOICE, D5, V_VOICE, 800);

  // LEAD — frase F5-A5-D5 (step 8-10-12)
  if (step === 8) _fire(CH_LEAD, F5, V_LEAD, 300);
  if (step === 10) _fire(CH_LEAD, A5, V_LEAD, 300);
  if (step === 12) _fire(CH_LEAD, D5, V_LEAD, 500);

  // ARP — 8th steady ascendente su D dorian (step pari)
  if (step % 2 === 0) {
    const arpIdx = (step / 2) | 0;  // 0..7
    _fire(CH_ARP, ARP_SCALE[arpIdx], V_ARP, 180);
  }
}
