// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Firma (Momenti Firma)
//  Stati visivi/musicali speciali, attivati dal direttore o dall'arco.
//  Letti da generations.js, render.js, comp-*.js per gesti narrativi forti.
//
//  Salvato da sequencer.js (Path A V3 abandoned) — 2026-04-07
//  Originale: linee 14-19, 200-242, 300-330, 405-425
// ═══════════════════════════════════════════════════════════

import { sendMIDIAllNotesOff } from './midi.js';

// ── Stato firma — letto in lettura ovunque, scritto solo qui ─────────────────
export const firma = {
  gelo:        false,   // freeze entities in place — break drammatico, tempo si ferma
  convergenza: false,   // attract entities to center — collasso, gravità implosiva
  vuotoTotale: false,   // total blackout — silenzio assoluto, MIDI off, schermo nero
  densityCap:  1,       // 0→1 opening (ramp-up), 1→0 closing (fade out finale)
};

// ── Internal scheduling ─────────────────────────────────────────────────────
let _breathEndTime = 0;       // globalTime in cui termina il prossimo silence_breath

// ── API ─────────────────────────────────────────────────────────────────────

export function resetFirma() {
  firma.gelo        = false;
  firma.convergenza = false;
  firma.vuotoTotale = false;
  firma.densityCap  = 1;
  _breathEndTime    = 0;
}

// Toggle a single firma effect (ON/OFF)
export function setFirma(effect, active) {
  if (effect in firma && typeof firma[effect] === 'boolean') {
    firma[effect] = !!active;
  }
}

// Pulse: brief activation for `durationSec` then auto-release
export function pulseFirma(effect, durationSec, currentTime) {
  setFirma(effect, true);
  // Caller should track and release; or use a timeout for fire-and-forget
  setTimeout(() => setFirma(effect, false), durationSec * 1000);
}

// ── Silence breath: il gesto più potente del concerto ──────────────────────
// Tutto si ferma per N secondi: MIDI all-notes-off + vuotoTotale ON.
// Va richiamato updateFirma(currentTime) ogni frame per terminarlo automaticamente.
export function startSilenceBreath(durationSec, currentTime) {
  sendMIDIAllNotesOff();
  firma.vuotoTotale = true;
  _breathEndTime = currentTime + durationSec;
  console.log(`[FIRMA] ═══ SILENZIO STRUTTURALE ═══ ${durationSec}s`);
}

// Chiamare ogni frame con il tempo corrente del concerto
export function updateFirma(currentTime) {
  // End breath when timer expires
  if (_breathEndTime > 0 && currentTime >= _breathEndTime) {
    firma.vuotoTotale = false;
    _breathEndTime = 0;
    console.log('[FIRMA] respiro terminato');
  }
}

// ── DensityCap envelope helper ──────────────────────────────────────────────
// Quadratic ramp from 0 to 1 over `rampSec` (typical: 120s opening)
export function setOpeningRamp(currentTime, rampSec = 120) {
  firma.densityCap = currentTime < rampSec
    ? Math.min(1, Math.pow(currentTime / rampSec, 2))
    : 1;
}

// Linear fade from 1 to 0 over `fadeSec` (typical: closing of concert)
export function setClosingFade(timeLeft, fadeSec = 60) {
  firma.densityCap = Math.max(0, Math.min(1, timeLeft / fadeSec));
}

// ── Read-only snapshot ──────────────────────────────────────────────────────
export function getFirmaSnapshot() {
  return { ...firma, breathActive: _breathEndTime > 0, breathEndTime: _breathEndTime };
}
