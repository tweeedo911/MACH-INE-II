// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Presence Multiplier Registry
//  Per-engine output scaling (0.0–1.0) for crossfade/layering
//  + Channel priority for multi-engine overlap
// ═══════════════════════════════════════════════════════════

const _pm = {
  terreno: 1.0, meccanica: 1.0, deriva: 1.0,
  vortice: 1.0, cristallo: 1.0, abisso: 1.0,
};

// Primary MIDI channels per engine — identity-defining channels
// When multiple engines overlap, each only plays on its primaries
const PRIMARY_CH = {
  terreno:   [0, 3, 4],    // PULSE(kick), BASS(dub), CHORDS(pads)
  meccanica: [0, 1, 3],    // PULSE(groove), GRAIN(texture), BASS(chromatic)
  deriva:    [2, 4, 5],    // DRONE, CHORDS, VOICE
  vortice:   [0, 1, 3],    // PULSE(tribal), GRAIN(micro-loop), BASS
  cristallo: [1, 4, 5],    // GRAIN(sparkle), CHORDS(pads), VOICE(shimmer)
  abisso:    [0, 2, 3],    // PULSE(heartbeat), DRONE, BASS(ritual)
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
