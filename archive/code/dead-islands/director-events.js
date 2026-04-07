// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Director Event Bus
//  Pub/sub semantico: Composer 2 → Director
// ═══════════════════════════════════════════════════════════

const _bus = {};

export function on(event, cb) {
  (_bus[event] = _bus[event] || []).push(cb);
}

export function off(event, cb) {
  _bus[event] = (_bus[event] || []).filter(f => f !== cb);
}

export function emit(event, data) {
  for (const cb of _bus[event] || []) cb(data);
}

// ── Semantic events (emitted by Composer 2) ──
// 'tension'       { level: 0..1 }       — accordo sostenuto, layers sovrapposti
// 'void'          { ratio: 0..1 }       — silenzio > target fase
// 'grain_entry'   { intensity: 0..1 }   — layer testuale attivo
// 'chord_change'  { root, mode }        — cambio accordo layer armonico
// 'rupture_stage' { stage, progress }   — soglie arco formale
// 'density_peak'  { level: 0..1 }       — tutti i layer attivi, densità massima
