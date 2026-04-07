// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Event Register
//  Unified MIDI/onset → LifecycleEvent store with per-role
//  color lifecycle (newborn → stable → ghost → fossil).
//
//  Ref: Visual System Bible §9 (Color Lifecycle System),
//       §16.1 (Modello dati). Replaces the old generations/dna
//       path (archived to dead-islands on 2026-04-07).
//
//  Le comp-* NON leggono ancora da qui: questo modulo è il
//  primo tassello di infrastruttura, cablato in render.js
//  come update loop. Il wiring nei comp avviene in A.3/A.4.
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { firma } from './firma.js';

// ── MIDI channel → role map (confermato 2026-04-07) ──
// CH0 kick · CH1 percussion · CH2 drone · CH3 bass
// CH4 chord · CH5 voice · CH6 lead · CH7 arp
export const CH_ROLE = {
  0: 'kick',
  1: 'percussion',
  2: 'drone',
  3: 'bass',
  4: 'chord',
  5: 'voice',
  6: 'lead',
  7: 'arp',
};

// ── Color lifecycle per ruolo (Bible §16.1) ──
// Durate in secondi per ogni stadio:
//   attack  → dall'inizio al picco (quasi istantaneo per hit brevi)
//   hold    → plateau di newborn (colore pieno, edge preciso)
//   decay   → transizione verso stable/residual
//   ghost   → vita in stato ghost (offset + desat)
//   fossil  → permanenza finale come fossil (traccia nel campo)
//
// Total event life = attack + hold + decay + ghost + fossil
// Valori di partenza: vanno calibrati in live. Il concetto conta
// più dei numeri assoluti (Bible §16.1).
export const ROLE_LIFECYCLE = {
  kick:       { attack: 0.02, hold: 0.04, decay: 0.18, ghost: 0.08, fossil: 0.02 },
  percussion: { attack: 0.02, hold: 0.03, decay: 0.12, ghost: 0.10, fossil: 0.05 },
  bass:       { attack: 0.03, hold: 0.15, decay: 0.80, ghost: 0.35, fossil: 0.22 },
  chord:      { attack: 0.30, hold: 0.80, decay: 2.50, ghost: 1.20, fossil: 0.45 },
  voice:      { attack: 0.04, hold: 0.25, decay: 1.80, ghost: 0.70, fossil: 0.28 },
  lead:       { attack: 0.01, hold: 0.10, decay: 0.90, ghost: 0.55, fossil: 0.18 },
  arp:        { attack: 0.01, hold: 0.06, decay: 0.35, ghost: 0.25, fossil: 0.08 },
  drone:      { attack: 1.50, hold: 2.00, decay: 5.00, ghost: 2.50, fossil: 1.20 },
  // fallback generico (onset audio senza canale MIDI)
  onset:      { attack: 0.02, hold: 0.08, decay: 0.40, ghost: 0.20, fossil: 0.10 },
};

// ── Lifecycle states ──
export const STATE_NEWBORN = 0;  // attack + hold
export const STATE_STABLE  = 1;  // decay (color pieno → stabilizza)
export const STATE_GHOST   = 2;  // ghost (offset + desat)
export const STATE_FOSSIL  = 3;  // fossil (residuo permanente)
export const STATE_DEAD    = 4;  // da rimuovere

// ── Event store ──
// Strutture flat per evitare GC churn. Ogni evento è un oggetto
// leggero poolabile in futuro; per ora uso array semplici.
const MAX_EVENTS = 512;
const _events = [];
let _nextId = 1;

// Getter read-only per le comp-* e debug
export function getEvents() { return _events; }
export function eventCount() { return _events.length; }

// ── Factory ──
function _makeEvent(role, data) {
  const lc = ROLE_LIFECYCLE[role] || ROLE_LIFECYCLE.onset;
  return {
    id: _nextId++,
    role,
    // posizione normalizzata (0..1) — comp-* decidono come mapparla
    nx: data.nx ?? 0.5,
    ny: data.ny ?? 0.5,
    // parametri MIDI se disponibili
    note: data.note ?? 0,      // 0..1 normalizzato
    vel:  data.vel  ?? 1,      // 0..1
    ch:   data.ch   ?? -1,     // canale originale o -1 per onset audio
    // lifecycle
    birth: data.t ?? 0,        // globalTime al nascere
    age: 0,                    // s trascorsi
    state: STATE_NEWBORN,
    // soglie temporali precalcolate (stato → age)
    tHold:   lc.attack + lc.hold,
    tStable: lc.attack + lc.hold + lc.decay,
    tGhost:  lc.attack + lc.hold + lc.decay + lc.ghost,
    tDead:   lc.attack + lc.hold + lc.decay + lc.ghost + lc.fossil,
  };
}

// ── API pubblica ──

// Chiamata da render.js su ogni MIDI note-on
export function onMidiNote(ch, noteNorm, velNorm, globalTime, nx = 0.5, ny = 0.5) {
  if (_events.length >= MAX_EVENTS) {
    // evict il più vecchio in ghost/fossil (l'evento "meno importante")
    let oldestIdx = 0;
    let oldestAge = -Infinity;
    for (let i = 0; i < _events.length; i++) {
      if (_events[i].state >= STATE_GHOST && _events[i].age > oldestAge) {
        oldestAge = _events[i].age;
        oldestIdx = i;
      }
    }
    _events.splice(oldestIdx, 1);
  }
  const role = CH_ROLE[ch] || 'onset';
  _events.push(_makeEvent(role, { nx, ny, note: noteNorm, vel: velNorm, ch, t: globalTime }));
}

// Chiamata da render.js su onset audio (senza canale MIDI)
export function onAudioOnset(nx, ny, globalTime) {
  if (_events.length >= MAX_EVENTS) return;
  _events.push(_makeEvent('onset', { nx, ny, vel: 1, t: globalTime }));
}

// Tick per-frame: avanza l'età e promuove gli stati.
// firma.gelo → freeza completamente il lifecycle (nessun aging).
// firma.convergenza → attira tutti gli eventi verso il centro (nx/ny → 0.5).
export function updateEvents(dt) {
  if (firma.gelo) return;

  const convPull = firma.convergenza ? dt * 0.3 : 0;

  for (let i = _events.length - 1; i >= 0; i--) {
    const e = _events[i];
    e.age += dt;
    if (convPull > 0) {
      e.nx += (0.5 - e.nx) * convPull;
      e.ny += (0.5 - e.ny) * convPull;
    }
    if      (e.age >= e.tDead)   { _events.splice(i, 1); continue; }
    else if (e.age >= e.tGhost)  e.state = STATE_FOSSIL;
    else if (e.age >= e.tStable) e.state = STATE_GHOST;
    else if (e.age >= e.tHold)   e.state = STATE_STABLE;
    else                         e.state = STATE_NEWBORN;
  }
}

// Reset totale — su REGEN / track switch / session reset
export function resetEvents() {
  _events.length = 0;
  _nextId = 1;
}

// Debug helper — conteggio per ruolo e per stato
export function getEventStats() {
  const byRole = {};
  const byState = [0, 0, 0, 0, 0];
  for (const e of _events) {
    byRole[e.role] = (byRole[e.role] || 0) + 1;
    byState[e.state]++;
  }
  return { total: _events.length, byRole, byState };
}
