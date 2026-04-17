// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Soundcheck Loop
//
//  Loop autonomo di 8 bar in D dorian a 90 BPM (~21.3s per ciclo).
//  Tutti gli 8 canali MIDI attivi, drum kit GM completo su CH1.
//  Non passa dal director3 — scrive direttamente sendMIDINote + addMidiNote.
//
//  Velocity cycle per bar (reference dinamico per il mixer):
//    bar 0 normal   (75-90)  | bar 4 crescendo entrance
//    bar 1 soft     (50-70)  | bar 5 latin percussion sampler
//    bar 2 loud     (90-105) | bar 6 woody percussion sampler
//    bar 3 medium   (70-85)  | bar 7 break + tambourine/cowbell
//
//  Drum kit GM su CH1 distribuito nei 8 bar: hat closed/open, snare, ghost,
//  clap, toms, crash, ride, splash, china, bongos, congas, maracas, wood
//  block, claves, tambourine, cowbell.
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
const LOOP_BARS = 8;

// Canali MIDI
const CH_KICK = 0, CH_PERC = 1, CH_DRONE = 2, CH_BASS = 3;
const CH_CHORD = 4, CH_VOICE = 5, CH_LEAD = 6, CH_ARP = 7;

// Note D dorian
const D2 = 38, F2 = 41, G2 = 43, A2 = 45, C3 = 48, D3 = 50, F3 = 53, G3 = 55;
const A3 = 57, C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71;
const C5 = 72, CS5 = 73, D5 = 74, E5 = 76, F5 = 77, G5 = 79, A5 = 81, B5 = 83;
const C6 = 84, D6 = 86;

// GM drum kit
const DR_KICK = 36, DR_SIDE = 37, DR_SNARE = 38, DR_CLAP = 39;
const DR_TOM_FL = 41, DR_HAT_C = 42, DR_TOM_FH = 43, DR_HAT_P = 44;
const DR_TOM_L = 45, DR_HAT_O = 46, DR_TOM_ML = 47, DR_TOM_MH = 48;
const DR_CRASH = 49, DR_TOM_H = 50, DR_RIDE = 51, DR_CHINA = 52, DR_RIDE_B = 53;
const DR_TAMB = 54, DR_SPLASH = 55, DR_COWBELL = 56, DR_CRASH2 = 57;
const DR_BONGO_H = 60, DR_BONGO_L = 61;
const DR_CONGA_MH = 62, DR_CONGA_OH = 63, DR_CONGA_L = 64;
const DR_TIMB_H = 65, DR_TIMB_L = 66;
const DR_MARACAS = 70, DR_CLAVES = 75, DR_WOOD_H = 76, DR_WOOD_L = 77;

// ── State ──
let _active = false;
let _acc = 0;
let _step = 0;
let _bar = 0;

// ── API ──
export function isSoundcheckActive() { return _active; }

export function startSoundcheck() {
  if (_active) return;
  sendMIDIAllNotesOff();
  _active = true;
  _acc = 0;
  _step = 0;
  _bar = 0;
  clearCampo();
  setBiome('SOUNDCHECK');
  worldState.bpm = BPM;
  console.log('[SOUNDCHECK] ON — 8 bar D dorian 90 BPM, drum kit GM completo (T per fermare)');
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
    _fireDrums(_step, barPos);
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

function _fire(ch, note, vel, dur) {
  sendMIDINote(ch, note, vel, dur);
  addMidiNote(ch, note / 127, vel / 127);
}

// ═══════════════════════════════════════
//  Pattern velocity per bar (8 bar loop)
// ═══════════════════════════════════════
const V_KICK   = [ 92, 75, 100, 85,  88, 82,  75,  95];
const V_SNARE  = [ 95, 72, 105, 85,  90, 80,  72, 100];
const V_HAT    = [ 55, 42,  68, 50,  58, 48,  45,  62];
const V_BASS   = [ 85, 68,  98, 78,  80, 72,  68,  92];
const V_CHORD  = [ 78, 62,  92, 72,  80, 68,  65,  85];
const V_VOICE  = [ 78, 60,  95, 72,  75, 65,  60,  88];
const V_LEAD   = [ 82, 60, 102, 70,  85, 68,  60,  95];
const V_ARP    = [ 72, 55,  88, 68,  75, 60,  55,  82];

// ═══════════════════════════════════════
//  Drums (CH0 + CH1) — tutto il drum kit GM
// ═══════════════════════════════════════
function _fireDrums(step, barPos) {
  // ── Base comune: kick 4/4, snare backbeat, hat 8th ──
  if (step === 0 || step === 8) _fire(CH_KICK, DR_KICK, V_KICK[barPos], 130);
  if (step === 4 || step === 12) _fire(CH_PERC, DR_SNARE, V_SNARE[barPos], 90);
  if (step % 2 === 0) {
    const boost = (step % 4 === 0) ? 12 : 0;
    _fire(CH_PERC, DR_HAT_C, V_HAT[barPos] + boost, 50);
  }

  // ── Variazioni per bar ──
  switch (barPos) {
    case 0:  // NORMAL — base pulita, ride sul 2 e 4
      if (step === 4 || step === 12) _fire(CH_PERC, DR_RIDE, 68, 120);
      break;

    case 1:  // SOFT — ghost notes + open hat
      if (step === 7) _fire(CH_PERC, DR_SNARE, 38, 50);    // ghost snare
      if (step === 14) _fire(CH_PERC, DR_HAT_O, 68, 220);  // open hat
      if (step === 2 || step === 10) _fire(CH_PERC, DR_SIDE, 45, 60);  // side stick
      break;

    case 2:  // LOUD — clap, tom fill
      if (step === 4 || step === 12) _fire(CH_PERC, DR_CLAP, 92, 80);
      if (step === 14) _fire(CH_PERC, DR_TOM_L, 90, 140);
      if (step === 15) _fire(CH_PERC, DR_TOM_H, 88, 120);
      break;

    case 3:  // MEDIUM — crash start + ghost + open hat
      if (step === 0) _fire(CH_PERC, DR_CRASH, 92, 900);
      if (step === 11) _fire(CH_PERC, DR_SNARE, 42, 50);   // ghost
      if (step === 14) _fire(CH_PERC, DR_HAT_O, 75, 200);
      break;

    case 4:  // CYMBALS SAMPLER — tutte le piatti GM
      if (step === 0) _fire(CH_PERC, DR_RIDE, 75, 200);
      if (step === 4) _fire(CH_PERC, DR_RIDE_B, 80, 180);  // ride bell
      if (step === 6) _fire(CH_PERC, DR_CHINA, 78, 250);   // china
      if (step === 8) _fire(CH_PERC, DR_SPLASH, 82, 240);  // splash
      if (step === 10) _fire(CH_PERC, DR_RIDE, 72, 180);
      if (step === 12) _fire(CH_PERC, DR_CRASH2, 85, 800); // second crash
      if (step === 14) _fire(CH_PERC, DR_SPLASH, 72, 200);
      break;

    case 5:  // LATIN PERCUSSION SAMPLER
      if (step === 2)  _fire(CH_PERC, DR_BONGO_H, 80, 60);
      if (step === 5)  _fire(CH_PERC, DR_BONGO_L, 72, 60);
      if (step === 3)  _fire(CH_PERC, DR_CONGA_OH, 85, 80);
      if (step === 7)  _fire(CH_PERC, DR_CONGA_MH, 75, 70);
      if (step === 11) _fire(CH_PERC, DR_CONGA_L, 80, 90);
      if (step === 6)  _fire(CH_PERC, DR_TIMB_H, 75, 70);
      if (step === 10) _fire(CH_PERC, DR_TIMB_L, 72, 80);
      if (step === 13) _fire(CH_PERC, DR_BONGO_H, 70, 60);
      // Maracas 16th soft
      if (step % 2 === 1) _fire(CH_PERC, DR_MARACAS, 50 + (step % 4) * 4, 40);
      break;

    case 6:  // WOODY PERCUSSION
      if (step === 1)  _fire(CH_PERC, DR_WOOD_H, 65, 50);
      if (step === 5)  _fire(CH_PERC, DR_WOOD_L, 70, 50);
      if (step === 9)  _fire(CH_PERC, DR_WOOD_H, 68, 50);
      if (step === 13) _fire(CH_PERC, DR_WOOD_L, 72, 50);
      if (step === 3)  _fire(CH_PERC, DR_CLAVES, 75, 40);
      if (step === 7)  _fire(CH_PERC, DR_CLAVES, 72, 40);
      if (step === 11) _fire(CH_PERC, DR_CLAVES, 78, 40);
      if (step === 15) _fire(CH_PERC, DR_CLAVES, 70, 40);
      break;

    case 7:  // BREAK + TAMBOURINE + COWBELL
      // Tambourine 8th steady (sopra hat)
      if (step % 2 === 0) _fire(CH_PERC, DR_TAMB, 60 + ((step / 2) % 2) * 10, 60);
      // Cowbell offbeat rock
      if (step === 2 || step === 6 || step === 10 || step === 14) {
        _fire(CH_PERC, DR_COWBELL, 82, 80);
      }
      // Pedal hat sul 3 e 15 (tiene il tempo in basso)
      if (step === 3) _fire(CH_PERC, DR_HAT_P, 60, 60);
      if (step === 15) _fire(CH_PERC, DR_HAT_P, 55, 60);
      // Crash finale step 0 (transizione al loop)
      if (step === 0) _fire(CH_PERC, DR_CRASH, 95, 900);
      // Toms in sequenza step 13-14-15 (fill chiusura)
      if (step === 13) _fire(CH_PERC, DR_TOM_H, 80, 80);
      if (step === 14) _fire(CH_PERC, DR_TOM_MH, 82, 80);
      if (step === 15) _fire(CH_PERC, DR_TOM_FL, 88, 100);
      break;
  }
}

// ═══════════════════════════════════════
//  Drone (CH2) — nota lunga, rinnova ogni 8 bar
// ═══════════════════════════════════════
function _fireDrone(step, bar) {
  if (step === 0 && bar % 8 === 0) _fire(CH_DRONE, D2, 68, 22000);
}

// ═══════════════════════════════════════
//  Bass (CH3) — progressione 8 bar
// ═══════════════════════════════════════
function _fireBass(step, barPos) {
  //                    b0  b1  b2  b3  b4  b5  b6  b7
  const rootStep0 =   [ D2, D2, D2, D2, G2, D2, F2, D2];
  const noteStep8 =   [ A2, F2, G2, A2, D3, A2, C3, A2];
  if (step === 0) _fire(CH_BASS, rootStep0[barPos], V_BASS[barPos], 480);
  if (step === 8) _fire(CH_BASS, noteStep8[barPos], V_BASS[barPos], 480);
  // Fills su bar specifici
  if (barPos === 3 && step === 14) _fire(CH_BASS, D3, V_BASS[barPos] - 10, 200);
  if (barPos === 4 && step === 4)  _fire(CH_BASS, G3, V_BASS[barPos] - 8, 200);  // crescendo up
  if (barPos === 4 && step === 12) _fire(CH_BASS, F3, V_BASS[barPos] - 8, 200);
  if (barPos === 7 && step === 14) _fire(CH_BASS, A2, V_BASS[barPos], 200);
}

// ═══════════════════════════════════════
//  Chord (CH4) — progressione 16 accordi in 8 bar
// ═══════════════════════════════════════
function _fireChord(step, barPos) {
  const progression = [
    [[D4, F4, A4], [G4, B4, D5]],    // 0: Dm → G
    [[A3, C4, E4], [F4, A4, C5]],    // 1: Am → F (soft)
    [[D4, F4, A4], [C4, E4, G4]],    // 2: Dm → C (loud)
    [[G4, B4, D5], [A4, CS5, E5]],   // 3: G → A (dominante)
    [[D4, F4, A4], [F4, A4, C5]],    // 4: Dm → F (crescendo)
    [[G4, B4, D5], [C4, E4, G4]],    // 5: G → C (latin)
    [[A3, C4, E4], [D4, F4, A4]],    // 6: Am → Dm (woody)
    [[G4, B4, D5], [A4, CS5, E5]],   // 7: G → A (torna al loop)
  ];
  const vel = V_CHORD[barPos];
  if (step === 0) for (const n of progression[barPos][0]) _fire(CH_CHORD, n, vel, 2000);
  if (step === 8) for (const n of progression[barPos][1]) _fire(CH_CHORD, n, vel, 2000);
}

// ═══════════════════════════════════════
//  Voice (CH5) — melodia 8 bar
// ═══════════════════════════════════════
function _fireVoice(step, barPos) {
  const vel = V_VOICE[barPos];
  const patterns = [
    [[0, A4],  [12, D5]],         // 0
    [[0, C5],  [12, A4]],         // 1 soft
    [[4, F5],  [12, E5]],         // 2 loud salita
    [[8, D5],  [14, A4]],         // 3
    [[0, D5],  [8, F5], [14, A5]],// 4 crescendo
    [[4, C5],  [10, E5]],         // 5
    [[0, G4],  [12, B4]],         // 6
    [[0, A5],  [8, D5], [14, A4]],// 7
  ];
  for (const [s, note] of patterns[barPos]) {
    if (step === s) _fire(CH_VOICE, note, vel, 900);
  }
}

// ═══════════════════════════════════════
//  Lead (CH6) — frasi e silenzi
// ═══════════════════════════════════════
function _fireLead(step, barPos) {
  const vel = V_LEAD[barPos];
  switch (barPos) {
    case 0:
      if (step === 8)  _fire(CH_LEAD, F5, vel, 280);
      if (step === 10) _fire(CH_LEAD, A5, vel, 280);
      if (step === 12) _fire(CH_LEAD, D5, vel, 480);
      break;
    case 1:  // silence bar — lead solo
      break;
    case 2:
      if (step === 0)  _fire(CH_LEAD, E5, vel, 380);
      if (step === 8)  _fire(CH_LEAD, G5, vel, 380);
      if (step === 14) _fire(CH_LEAD, D5, vel, 280);
      break;
    case 3:
      if (step === 4)  _fire(CH_LEAD, A5, vel, 400);
      if (step === 10) _fire(CH_LEAD, F5, vel, 400);
      break;
    case 4:  // crescendo — frase che sale
      if (step === 0)  _fire(CH_LEAD, D5, vel, 280);
      if (step === 4)  _fire(CH_LEAD, F5, vel, 280);
      if (step === 8)  _fire(CH_LEAD, A5, vel, 280);
      if (step === 12) _fire(CH_LEAD, D6, vel, 400);
      break;
    case 5:  // latin — pausa melodica
      if (step === 6) _fire(CH_LEAD, C5, vel, 300);
      break;
    case 6:  // woody — note singole sparse
      if (step === 2)  _fire(CH_LEAD, G5, vel, 200);
      if (step === 10) _fire(CH_LEAD, E5, vel, 200);
      break;
    case 7:  // finale lungo
      if (step === 0) _fire(CH_LEAD, A5, vel, 600);
      if (step === 8) _fire(CH_LEAD, F5, vel, 400);
      if (step === 12) _fire(CH_LEAD, D5, vel, 600);
      break;
  }
}

// ═══════════════════════════════════════
//  Arp (CH7) — 8 pattern diversi su 8 bar
// ═══════════════════════════════════════
function _fireArp(step, barPos) {
  if (step % 2 !== 0) return;
  const idx = step / 2;
  const vel = V_ARP[barPos];
  const patterns = [
    [D4, E4, F4, G4, A4, B4, C5, D5],   // 0: ascending
    [D5, C5, B4, A4, G4, F4, E4, D4],   // 1: descending (soft)
    [D5, E5, F5, G5, A5, B5, C6, D6],   // 2: asc high (loud)
    [D4, F4, A4, C5, D4, F4, A4, C5],   // 3: arpeggio 1-3-5-7
    [D4, A4, F4, C5, E4, B4, G4, D5],   // 4: zigzag intervals
    [A4, F4, A4, D5, A4, F4, C5, D5],   // 5: pedal A (latin groove)
    [D4, D4, F4, F4, G4, G4, A4, A4],   // 6: pairs ascending (woody)
    [D5, B4, A4, F4, E4, G4, A4, D5],   // 7: descending + recovery (finale)
  ];
  _fire(CH_ARP, patterns[barPos][idx], vel, 180);
}
