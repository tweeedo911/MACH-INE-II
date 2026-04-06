// ═══════════════════════════════════════════════════════════
//  MACH:INE III — World State
//  Single shared state. Director writes, modules read.
// ═══════════════════════════════════════════════════════════

export const worldState = {
  // ── Musical identity ──
  track:  null,     // 'NEBBIA' | 'TESSUTO' | 'SOLCO' | 'RESPIRO' | 'MACCHINA' | 'TEMPESTA' | 'RITORNO'
  scale:  [],       // MIDI note array, e.g. [55,57,58,60,62,64,65,67] for G dorian
  root:   0,        // root MIDI note
  bpm:    null,     // null = no rhythmic clock (ambient)
  phase:  'germoglio',  // germoglio | pulsazione | densita | rottura | dissoluzione

  // ── Budget & constraints (Director sets these per phase) ──
  density: {
    rhythm:  0,
    harmony: 0,
    bass:    0,
    melody:  0,
    texture: 0,
  },
  register: {
    bass:   [36, 55],
    melody: [67, 84],
    lead:   [72, 96],
    chords: [55, 72],
    arp:    [60, 84],
  },
  velocityCeiling: {
    rhythm:  0,
    harmony: 0,
    bass:    0,
    melody:  0,
    texture: 0,
  },
  rhythmGrid: null,  // 16-step array [1,0,0,0,...] or null

  // ── Narrative arc ──
  arc:         0,          // 0.0 → 1.0 concert position
  energy:      'SILENCE',  // SILENCE | BUILDING | ACTIVE | INTENSE | PEAK | RELEASE
  transition:  null,       // { from, to, progress } during DJ-set transition, else null
  barProgress: 0,          // 0.0 → 1.0 position within current bar (for scan lines, sync)
  audioEnergy: 0,          // 0.0 → 1.0 real-time audio energy (RMS + onset + density)

  // ── Harmony (written by harmony.js — only exception to read-only rule) ──
  currentChord: [],  // MIDI notes of current chord, for arp

  // ── Visual regime (read by renderer) ──
  palette:      { bg: '#000000', dot: '#FFFFFF', accent: null },
  visualRegime: { maxDensity: 0.5, minDotSize: 4, composition: 'DEFAULT' },
  camera:       { mode: 'WIDE', drift: 0, focusPoint: [0.5, 0.5] },
};

// ── Phase time tracking (internal to director3, exposed for HUD) ──
export const phaseState = {
  elapsed:  0,     // seconds in current phase
  duration: 0,     // total duration of current phase
  progress: 0,     // elapsed / duration (0–1)
};
