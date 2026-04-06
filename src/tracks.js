// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Track Definitions
//  Each track is a "score sheet": a set of World State values.
//  The Director loads these and interpolates during transitions.
// ═══════════════════════════════════════════════════════════

// ── Scale definitions (MIDI notes spanning 2+ octaves) ──
const SCALES = {
  G_dorian:    [43,45,46,48,50,52,53,55,57,58,60,62,64,65,67,69,70,72,74,76,77,79],
  A_lydian:    [45,47,49,51,52,54,56,57,59,61,63,64,66,68,69,71,73,75,76,78,80,81],
  Bb_phrygian: [46,47,49,51,53,54,56,58,59,61,63,65,66,68,70,71,73,75,77,78,80,82],
  D_dorian:    [38,40,41,43,45,47,48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74],
  Cs_dorian:   [37,39,40,42,44,46,47,49,51,52,54,56,58,59,61,63,64,66,68,70,71,73],
  E_phrygian:  [40,41,43,45,47,48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74,76],
  F_lydian:    [41,43,45,47,48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74,76,77],
};

export { SCALES };

// ── Density profiles per phase (multiplied by track density) ──
const PHASE_DENSITY = {
  germoglio:    { rhythm: 0.0, harmony: 0.5, bass: 0.3, melody: 0.2, texture: 0.1 },
  pulsazione:   { rhythm: 0.4, harmony: 0.6, bass: 0.6, melody: 0.4, texture: 0.15 },
  densita:      { rhythm: 0.8, harmony: 0.7, bass: 0.9, melody: 0.7, texture: 0.2 },
  rottura:      { rhythm: 1.0, harmony: 0.5, bass: 1.0, melody: 0.9, texture: 0.5 },
  dissoluzione: { rhythm: 0.3, harmony: 0.4, bass: 0.2, melody: 0.3, texture: 0.1 },
};

export { PHASE_DENSITY };

// ── Energy mapping per phase ──
const PHASE_ENERGY = {
  germoglio:    'SILENCE',
  pulsazione:   'BUILDING',
  densita:      'ACTIVE',
  rottura:      'PEAK',
  dissoluzione: 'RELEASE',
};

export { PHASE_ENERGY };

// ── Track definitions ──
export const TRACKS = {
  SOLCO: {
    scale: SCALES.G_dorian,
    root: 55,   // G3
    bpm: 128,
    kickNote: 38,  // D2

    density: { rhythm: 0.7, harmony: 0.4, bass: 0.8, melody: 0.5, texture: 0.1 },

    register: {
      bass:   [24, 43],  // sub-bass octave
      melody: [67, 84],
      lead:   [72, 96],
      chords: [55, 72],
      arp:    [60, 84],
    },
    velocityCeiling: {
      rhythm:  110,
      harmony: 60,
      bass:    90,
      melody:  75,
      texture: 45,
    },

    // Dub syncopated groove — the rhythm module aligns to this
    rhythmGrid: [1,0,0,0, 1,0,0,1, 1,0,0,0, 0,1,0,0],

    // Phase durations in seconds
    phases: {
      germoglio:    60,
      pulsazione:   55,
      densita:      80,
      rottura:      28,
      dissoluzione: 65,
    },

    // Chord progression — 8 chords × 4 bar = 32 bar cycle (power of 2)
    chords: [
      [55, 58, 62],  // Gm
      [57, 60, 64],  // Am7 (no 5th)
      [58, 62, 65],  // Bb
      [60, 64, 67],  // C
      [62, 65, 69],  // Dm
      [58, 62, 65],  // Bb (return)
      [55, 60, 62],  // Gsus2
      [55, 58, 62],  // Gm (home)
    ],

    // Bass pattern: 16 steps, 0=rest, positive number = semitone offset from root
    // Steps 3,5,10,12 active — complementary to rhythmGrid
    bassPattern: [0,0,0,7, 0,5,0,0, 0,0,3,0, 5,0,0,0],

    // Arp: rate and note count
    arpRate: 8,   // 8th notes
    arpNotes: 4,  // 4-note pattern derived from currentChord

    palette: { bg: '#282B26', dot: '#FE6B0D', accent: '#CDD71D' },
    visualRegime: { maxDensity: 0.65, minDotSize: 4, composition: 'ASIMMETRIA' },
  },

  // ── Remaining tracks: defined in Phase 2 brainstorming ──
  // NEBBIA, TESSUTO, RESPIRO, MACCHINA, TEMPESTA, RITORNO
};

// ── Track sequence (the album order) ──
export const TRACK_ORDER = ['NEBBIA', 'TESSUTO', 'SOLCO', 'RESPIRO', 'MACCHINA', 'TEMPESTA', 'RITORNO'];
