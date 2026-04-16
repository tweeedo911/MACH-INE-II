// ═══════════════════════════════════════════════════════════
//  MACH:INE III — ENCORE Canon Helper
//  Standalone module: legge/scrive worldState.encoreCanon.
//  Estratto da director3.js per evitare dipendenze circolari
//  (director3 importa i moduli musicali; i moduli chiamano questa
//  funzione; questa funzione NON importa director3).
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { worldState } from './world-state.js';

// Transpose note into register by octave shifts
function fitToRegister(note, lo, hi) {
  let n = note;
  while (n < lo) n += 12;
  while (n > hi) n -= 12;
  if (n < lo) n = lo;
  return n;
}

// Check if ≥3 active voices share the same pitch class
function checkConvergence(canon) {
  const pitchClasses = {};
  const voices = ['bass', 'chord', 'arp', 'voice', 'lead'];
  let activeCount = 0;
  for (const v of voices) {
    if (!canon[v].active) continue;
    activeCount++;
    const pc = canon[v].note % 12;
    pitchClasses[pc] = (pitchClasses[pc] || 0) + 1;
  }
  if (activeCount < 3) return false;
  for (const count of Object.values(pitchClasses)) {
    if (count >= 3) return true;
  }
  return false;
}

// Advance a canon voice by one hit — called from musical modules when their pattern fires.
// Returns the new MIDI note (already transposed + register-fit), or 0 if inactive/empty.
export function advanceCanonVoice(voiceKey) {
  if (!worldState.encoreMode) return 0;
  const canon = worldState.encoreCanon;
  if (!canon || !canon[voiceKey] || !canon[voiceKey].active) return 0;
  const phrase = canon.phrase;
  if (!phrase || phrase.length === 0) return 0;

  const speedMap = {
    bass:  CFG.ENCORE_SPEED_BASS,
    chord: CFG.ENCORE_SPEED_CHORD,
    voice: CFG.ENCORE_SPEED_VOICE,
    lead:  CFG.ENCORE_SPEED_LEAD,
    arp:   CFG.ENCORE_SPEED_ARP,
  };
  const speed = speedMap[voiceKey] ?? 1;
  const phraseLen = phrase.length;

  // Leggi prima, avanzi dopo — così prima chiamata dopo reset (pos=0) ritorna prima nota.
  const posIdx = Math.floor(Math.abs(canon[voiceKey].pos)) % phraseLen;
  canon[voiceKey].pos = (canon[voiceKey].pos + speed) % phraseLen;

  let note;
  if (voiceKey === 'arp') {
    note = canon.phraseInv[posIdx] ?? phrase[posIdx];
  } else if (voiceKey === 'voice') {
    note = canon.phraseRetro[posIdx] ?? phrase[posIdx];
  } else if (voiceKey === 'chord') {
    const offsetIdx = (posIdx + Math.floor(phraseLen * CFG.ENCORE_CHORD_OFFSET)) % phraseLen;
    note = phrase[offsetIdx];
  } else {
    note = phrase[posIdx];  // bass, lead
  }

  // Register fit — bass forzato [36, 52] per tenerlo in C2-E3 (correzione v2 bass alto)
  const reg = worldState.register;
  if (voiceKey === 'bass')  note = fitToRegister(note, 36, 52);
  if (voiceKey === 'chord') note = fitToRegister(note, reg.chords[0], reg.chords[1]);
  if (voiceKey === 'arp')   note = fitToRegister(note, reg.arp[0], reg.arp[1]);
  if (voiceKey === 'voice') note = fitToRegister(note, reg.melody[0], reg.melody[1]);
  if (voiceKey === 'lead')  note = fitToRegister(note, reg.lead[0], reg.lead[1]);

  canon[voiceKey].note = note;
  canon.convergence = checkConvergence(canon);
  return note;
}
