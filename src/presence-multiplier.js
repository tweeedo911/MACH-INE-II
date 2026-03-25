// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Presence Multiplier Registry
//  Per-engine output scaling (0.0–1.0) for crossfade/layering
//  + Channel priority for multi-engine overlap
// ═══════════════════════════════════════════════════════════

const _pm = {
  terreno: 1.0, meccanica: 1.0, deriva: 1.0,
  vortice: 1.0, cristallo: 1.0, abisso: 1.0, solco: 1.0,
};

// Allowed MIDI channels per engine — all channels the engine actually uses.
// PM-scaling already handles volume during crossfade; this only prevents
// engines from accidentally writing to channels they never use.
const PRIMARY_CH = {
  terreno:   [0, 1, 2, 3, 4, 5],    // PULSE, GRAIN, DRONE, BASS, CHORDS, VOICE
  meccanica: [0, 1, 2, 3, 4, 5, 6], // PULSE, GRAIN, DRONE, BASS, CHORDS, VOICE, LEAD
  deriva:    [1, 2, 4, 5, 6],        // GRAIN, DRONE, CHORDS, VOICE, LEAD
  vortice:   [0, 1, 2, 3, 4, 5, 6], // PULSE, GRAIN, DRONE, BASS, CHORDS, VOICE, LEAD
  cristallo: [0, 1, 2, 3, 4, 5, 7], // PULSE, GRAIN, DRONE, BASS, CHORDS, VOICE, RUPTURE
  abisso:    [0, 1, 2, 3, 4, 5, 6], // PULSE, GRAIN, DRONE, BASS, CHORDS, VOICE, LEAD
  solco:     [0, 1, 2, 3, 4, 5, 7], // KICK, HAT, DRONE, BASS, CHORD, VOICE, RIDE
};

export function setPresenceMultiplier(engine, val) {
  if (engine in _pm) _pm[engine] = Math.max(0, Math.min(1, val));
}

export function getPresenceMultiplier(engine) {
  return _pm[engine] ?? 1.0;
}

// Channel gating: returns true if engine may send on this MIDI channel
// Solo engine → all channels allowed
// Multiple engines active → primary channels only
export function isChannelAllowed(engine, ch) {
  const primary = PRIMARY_CH[engine];
  if (!primary) return true;
  // Count other active engines (pm > 0.05)
  let othersActive = false;
  for (const k in _pm) {
    if (k !== engine && _pm[k] > 0.05) { othersActive = true; break; }
  }
  if (!othersActive) return true;
  return primary.includes(ch);
}

export function resetAllMultipliers() {
  for (const k in _pm) _pm[k] = 1.0;
}

export function getAllMultipliers() {
  return { ..._pm };
}

// ── Musical phase registry ──
// Composers call setEnginePhase() on phase change.
// Director reads getEnginePhase() for visual evolution.
const _phase = {};

export function setEnginePhase(engine, phase, ruptureStage = 'idle') {
  _phase[engine] = { phase, ruptureStage };
}

export function getEnginePhase(engine) {
  return _phase[engine] || { phase: 'germoglio', ruptureStage: 'idle' };
}
