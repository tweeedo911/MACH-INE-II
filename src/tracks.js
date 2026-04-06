// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Track Definitions
//  Each track is a "score sheet": a set of World State values.
//  The Director loads these and interpolates during transitions.
// ═══════════════════════════════════════════════════════════

// ── Scale definitions (MIDI notes spanning 2+ octaves) ──
const SCALES = {
  // ── Modes of F major (TESSUTO, SOLCO share this family) ──
  G_dorian:    [43,45,46,48,50,52,53,55,57,58,60,62,64,65,67,69,70,72,74,76,77,79],
  D_aeolian:   [38,40,41,43,45,46,48,50,52,53,55,57,58,60,62,64,65,67,69,70,72,74],

  // ── Modes of C major (RESPIRO, MACCHINA, TEMPESTA, RITORNO share this family) ──
  C_ionian:    [36,38,40,41,43,45,47,48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74,76,77,79],
  D_dorian:    [38,40,41,43,45,47,48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74],
  E_phrygian:  [40,41,43,45,47,48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74,76],
  A_aeolian:   [45,47,48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74,76,77,79,81],

  // ── C lydian (NEBBIA — bridges into D aeolian with 5 shared notes) ──
  C_lydian:    [36,38,40,42,43,45,47,48,50,52,54,55,57,59,60,62,64,66,67,69,71,72,74,76,78,79],
};

export { SCALES };

// ── Density profiles per phase (multiplied by track density) ──
const PHASE_DENSITY = {
  germoglio:    { rhythm: 0.0, harmony: 0.5, bass: 0.3, melody: 0.2, texture: 0.1 },
  pulsazione:   { rhythm: 0.4, harmony: 0.6, bass: 0.6, melody: 0.6, texture: 0.15 },
  densita:      { rhythm: 0.8, harmony: 0.7, bass: 0.9, melody: 0.7, texture: 0.2 },
  rottura:      { rhythm: 1.0, harmony: 0.5, bass: 1.0, melody: 0.9, texture: 0.5 },
  dissoluzione: { rhythm: 0.3, harmony: 0.4, bass: 0.05, melody: 0.3, texture: 0.1 },
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
    bpm: 129,     // 43×3 — ratio 3:2 with TESSUTO (86)
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

    // ── Melody strategy: BASS is the star, voice rare and precious ──
    melodyStrategy: {
      voiceEveryBars: 4,       // 1 phrase every 4 bars (rare, precious)
      voicePhraseLen: [4, 6],  // short phrases
      leadMode: 'none',        // no lead — groove speaks for itself
      arpRole: 'accompany',    // arp present but secondary
      arpVelScale: 0.7,        // quieter than voice
    },

    palette: { bg: '#282B26', dot: '#FE6B0D', accent: '#CDD71D' },
    visualRegime: { maxDensity: 0.65, minDotSize: 4, composition: 'ASIMMETRIA' },
  },

  // ═══════════════════════════════════════════════════════════
  //  1. NEBBIA — "ti ambienta" (C lydian, no BPM)
  //  Silence → drone → water drops. No rhythm. Pure space.
  // ═══════════════════════════════════════════════════════════
  NEBBIA: {
    scale: SCALES.C_lydian,
    root: 48,   // C3
    bpm: null,  // no rhythmic clock — ambient
    kickNote: null,

    density: { rhythm: 0, harmony: 0.3, bass: 0, melody: 0.5, texture: 0.05 },

    register: {
      bass:   [0, 0],      // no bass
      melody: [67, 84],    // high — floating
      lead:   [72, 88],    // lead enters in pulsazione — counterpoint
      chords: [55, 72],
      arp:    [0, 0],      // no arp
    },
    velocityCeiling: {
      rhythm:  0,
      harmony: 50,
      bass:    0,
      melody:  60,
      texture: 30,
    },

    rhythmGrid: null,

    phases: {
      germoglio:    90,   // silence → drone → voice drops (no lead yet)
      pulsazione:   70,   // voice + lead counterpoint enters, chords present
      densita:      0,    // skip
      rottura:      0,    // skip
      dissoluzione: 50,   // everything fades — drone + last lead notes → silence for TESSUTO
    },

    // 4 chords × 16 bar = 64 bar (power of 2) — very slow
    chords: [
      [48, 52, 55],  // Cmaj (C E G)
      [50, 54, 57],  // Dmaj (D F# A)
      [52, 55, 59],  // Em (E G B)
      [48, 52, 55],  // Cmaj (home)
    ],

    bassPattern: null,
    arpRate: 0,
    arpNotes: 0,

    // ── Melody strategy: drops then counterpoint, intimate ──
    melodyStrategy: {
      voiceEveryBars: 4,       // rare drops
      voicePhraseLen: [1, 3],  // very short — single notes to tiny motifs
      leadMode: 'response',    // lead enters in pulsazione as counterpoint
      leadProb: 0.3,           // not too often
      arpRole: 'none',
      arpVelScale: 0,
    },

    palette: { bg: '#0A0A0A', dot: '#EFE6DE', accent: null },
    visualRegime: { maxDensity: 0.15, minDotSize: 10, composition: 'VUOTO' },
  },

  // ═══════════════════════════════════════════════════════════
  //  2. TESSUTO — "qualcosa emerge" (D aeolian, 86 BPM)
  //  Rhythmic chords as motor. Bass enters then disappears.
  // ═══════════════════════════════════════════════════════════
  TESSUTO: {
    scale: SCALES.D_aeolian,
    root: 50,   // D3
    bpm: 86,
    kickNote: 38,  // D2

    density: { rhythm: 0.15, harmony: 0.6, bass: 0.4, melody: 0.3, texture: 0.1 },

    register: {
      bass:   [26, 45],    // sub
      melody: [0, 0],      // voice tace in TESSUTO — lead prende il suo posto
      lead:   [62, 79],    // lead come voce melodica
      chords: [50, 67],
      arp:    [0, 0],      // no arp in TESSUTO
    },
    velocityCeiling: {
      rhythm:  65,          // quiet — impulses, not a beat
      harmony: 75,          // chords are the star here
      bass:    70,
      melody:  55,
      texture: 30,
    },

    // Irregular impulses — kick every 2 bars, off-grid placement
    rhythmGrid: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,0],

    phases: {
      germoglio:    50,
      pulsazione:   60,
      densita:      70,
      rottura:      20,
      dissoluzione: 50,   // bass disappears here (density × 0.05 ≈ 0)
    },

    // Rhythmic chord hits — staccato on this grid instead of sustained
    chordGrid: [1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1],

    // 4 chords × 8 bar = 32 bar
    chords: [
      [50, 53, 57],  // Dm (D F A)
      [46, 50, 53],  // Bb (Bb D F)
      [48, 52, 55],  // C (C E G)
      [45, 48, 52],  // Am (A C E)
    ],

    // Follow harmony mode: long sustained notes on chord root changes
    bassPattern: null,

    arpRate: 0,
    arpNotes: 0,

    // ── Melody strategy: voice tace, LEAD is the melodic voice (introduces CH6) ──
    melodyStrategy: {
      voiceEveryBars: 0,       // voice OFF — silent
      voicePhraseLen: [0, 0],
      leadMode: 'solo',        // lead plays independently (not response to voice)
      leadProb: 1.0,           // always active when density allows
      leadEveryBars: 2,        // 1 phrase every 2 bars
      leadPhraseLen: [4, 8],   // medium phrases
      arpRole: 'none',
      arpVelScale: 0,
    },

    palette: { bg: '#20130D', dot: '#CDD71D', accent: '#EFE6DE' },
    visualRegime: { maxDensity: 0.40, minDotSize: 6, composition: 'GRIGLIA' },
  },

  // ═══════════════════════════════════════════════════════════
  //  4. RESPIRO — "pausa" (C ionian, no BPM)
  //  Open, pure. Reset. Breath between groove sections.
  // ═══════════════════════════════════════════════════════════
  RESPIRO: {
    scale: SCALES.C_ionian,
    root: 60,   // C4 — higher, more open
    bpm: null,
    kickNote: null,

    density: { rhythm: 0, harmony: 0.4, bass: 0.1, melody: 0.25, texture: 0.05 },

    register: {
      bass:   [36, 48],
      melody: [67, 84],
      lead:   [72, 84],
      chords: [60, 77],    // higher register — airy
      arp:    [0, 0],
    },
    velocityCeiling: {
      rhythm:  0,
      harmony: 55,
      bass:    45,
      melody:  65,
      texture: 25,
    },

    rhythmGrid: null,

    phases: {
      germoglio:    40,
      pulsazione:   50,
      densita:      0,    // skip
      rottura:      0,    // skip
      dissoluzione: 40,
    },

    chords: [
      [60, 64, 67],  // C (C E G)
      [57, 60, 64],  // Am (A C E)
      [53, 57, 60],  // F (F A C)
      [55, 59, 62],  // G (G B D)
    ],

    bassPattern: null,
    arpRate: 0,
    arpNotes: 0,

    // ── Melody strategy: voice sola, spazio aperto ──
    melodyStrategy: {
      voiceEveryBars: 3,       // moderate
      voicePhraseLen: [5, 8],  // medium — breathing phrases
      leadMode: 'echo',        // lead echoes voice, softer and delayed
      leadProb: 0.25,          // rare echoes
      arpRole: 'none',
      arpVelScale: 0,
    },

    palette: { bg: '#7BBA91', dot: '#20130D', accent: null },
    visualRegime: { maxDensity: 0.20, minDotSize: 8, composition: 'RESPIRO' },
  },

  // ═══════════════════════════════════════════════════════════
  //  5. MACCHINA — "sei dentro" (D dorian, 138 BPM)
  //  Mechanical groove, driving, melodic.
  // ═══════════════════════════════════════════════════════════
  MACCHINA: {
    scale: SCALES.D_dorian,
    root: 50,   // D3
    bpm: 129,     // 43×3 — same tempo as SOLCO, energy from density not speed
    kickNote: 38,  // D2

    density: { rhythm: 0.8, harmony: 0.5, bass: 0.85, melody: 0.6, texture: 0.15 },

    register: {
      bass:   [26, 45],
      melody: [62, 79],
      lead:   [69, 88],
      chords: [50, 67],
      arp:    [62, 81],
    },
    velocityCeiling: {
      rhythm:  115,
      harmony: 60,
      bass:    95,
      melody:  80,
      texture: 40,
    },

    // Mechanical groove — almost 4/4 but with push
    rhythmGrid: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,1],

    phases: {
      germoglio:    45,
      pulsazione:   55,
      densita:      90,
      rottura:      25,
      dissoluzione: 55,
    },

    // 4 chords × 4 bar = 16 bar (shorter cycle = more mechanical)
    chords: [
      [50, 53, 57],  // Dm (D F A)
      [55, 59, 62],  // G (G B D)
      [45, 48, 52],  // Am (A C E)
      [52, 55, 59],  // Em (E G B)
    ],

    // Rolling bass — 8th note pump
    bassPattern: [7,0,7,0, 5,0,7,0, 3,0,5,0, 7,0,3,0],

    arpRate: 16,   // 16th notes — fast
    arpNotes: 4,

    // ── Melody strategy: ARP protagonist, voice+lead as fleeting color ──
    melodyStrategy: {
      voiceEveryBars: 8,       // voice very rare — 1 phrase every 8 bars
      voicePhraseLen: [3, 5],  // short interjections
      leadMode: 'response',    // lead responds to voice, brief
      leadProb: 0.3,           // infrequent
      arpRole: 'protagonist',  // arp is the main melodic element
      arpVelScale: 1.0,        // full velocity
    },

    // ── Custom hat: tight mechanical 16ths ──
    hatPatterns: {
      germoglio:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      pulsazione:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],  // straight 8ths from the start
      densita:      [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],  // tight 16ths — mechanical
      rottura:      [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
      dissoluzione: [1,0,1,0, 0,0,1,0, 0,0,0,0, 1,0,0,0],
    },

    palette: { bg: '#1A1A2E', dot: '#F8ED00', accent: '#DD3A44' },
    visualRegime: { maxDensity: 0.80, minDotSize: 2, composition: 'GRIGLIA' },
  },

  // ═══════════════════════════════════════════════════════════
  //  6. TEMPESTA — "balli" (E phrygian, 142 BPM)
  //  Peak energy. Full kit. Aggressive bass. Dense.
  // ═══════════════════════════════════════════════════════════
  TEMPESTA: {
    scale: SCALES.E_phrygian,
    root: 52,   // E3
    bpm: 129,     // 43×3 — same tempo, peak from density and complexity
    kickNote: 40,  // E2

    density: { rhythm: 0.95, harmony: 0.5, bass: 0.95, melody: 0.7, texture: 0.3 },

    register: {
      bass:   [28, 47],
      melody: [64, 81],
      lead:   [72, 93],
      chords: [52, 69],
      arp:    [64, 84],
    },
    velocityCeiling: {
      rhythm:  120,
      harmony: 65,
      bass:    100,
      melody:  85,
      texture: 50,
    },

    // Driving 4/4 with offbeat push
    rhythmGrid: [1,0,0,0, 1,0,0,0, 1,0,0,1, 1,0,0,0],

    phases: {
      germoglio:    35,
      pulsazione:   45,
      densita:      100,   // longest densita — the peak should last
      rottura:      30,
      dissoluzione: 50,
    },

    // 4 chords × 2 bar = 8 bar cycle (fast, relentless)
    chords: [
      [52, 55, 59],  // Em (E G B)
      [53, 57, 60],  // F (F A C) — phrygian bII
      [50, 53, 57],  // Dm (D F A)
      [57, 60, 64],  // Am (A C E)
    ],

    // Aggressive bass — almost every beat
    bassPattern: [7,0,0,5, 0,3,0,0, 7,0,5,0, 3,0,0,7],

    arpRate: 16,   // 16th notes
    arpNotes: 6,   // wider pattern

    // ── Melody strategy: VOICE+LEAD hocket (interlocked), arp as texture ──
    melodyStrategy: {
      voiceEveryBars: 1,       // voice always active — dense
      voicePhraseLen: [8, 12], // long intertwined phrases
      leadMode: 'hocket',      // lead and voice alternate notes (zipper)
      leadProb: 1.0,           // always — they are one instrument split in two
      arpRole: 'texture',      // arp drops to background
      arpVelScale: 0.4,        // quiet — texture underneath the voices
    },

    // ── Custom hat: complex polyrhythmic (additive 3+3+3+3+4) ──
    hatPatterns: {
      germoglio:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      pulsazione:   [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0],  // asymmetric
      densita:      [1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,0,1],  // polyrhythmic dense
      rottura:      [1,1,1,1, 1,0,1,1, 1,1,0,1, 1,1,1,0],  // almost full but with holes
      dissoluzione: [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
    },

    palette: { bg: '#000000', dot: '#FFFFFF', accent: '#91010F' },
    visualRegime: { maxDensity: 1.0, minDotSize: 1, composition: 'DATA' },
  },

  // ═══════════════════════════════════════════════════════════
  //  7. RITORNO — "ti rilascia" (A aeolian, slows down)
  //  Melancholic. Pattern dissolves. Returns to stillness.
  // ═══════════════════════════════════════════════════════════
  RITORNO: {
    scale: SCALES.A_aeolian,
    root: 57,   // A3 — same root class as NEBBIA opening (circles back)
    bpm: 86,    // 43×2 — mirrors TESSUTO, winding down
    kickNote: 45,  // A2

    density: { rhythm: 0.4, harmony: 0.5, bass: 0.3, melody: 0.5, texture: 0.1 },

    register: {
      bass:   [33, 50],
      melody: [64, 81],
      lead:   [69, 84],
      chords: [55, 72],
      arp:    [60, 79],
    },
    velocityCeiling: {
      rhythm:  85,
      harmony: 55,
      bass:    70,
      melody:  70,
      texture: 35,
    },

    // Sparse, dissolving rhythm
    rhythmGrid: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],

    phases: {
      germoglio:    40,
      pulsazione:   50,
      densita:      60,
      rottura:      0,    // no rupture — only descent
      dissoluzione: 80,   // long fade
    },

    chords: [
      [57, 60, 64],  // Am (A C E)
      [53, 57, 60],  // F (F A C)
      [48, 52, 55],  // C (C E G)
      [52, 55, 59],  // Em (E G B)
    ],

    // Sparse bass — fading away
    bassPattern: [0,0,0,0, 0,7,0,0, 0,0,0,0, 5,0,0,0],

    arpRate: 8,    // 8th notes — slower than MACCHINA/TEMPESTA
    arpNotes: 3,   // minimal pattern

    // ── Melody strategy: VOICE sola esposta, lead eco lontana, arp muore ──
    melodyStrategy: {
      voiceEveryBars: 2,       // voice presente — è il cuore
      voicePhraseLen: [6, 10], // long exposed phrases
      leadMode: 'echo',        // lead ripete voice, più piano, ritardata
      leadProb: 0.35,          // non sempre — momenti di solitudine
      arpRole: 'dying',        // arp solo in pulsazione, poi muore
      arpVelScale: 0.5,        // fading
    },

    palette: { bg: '#0A0A0A', dot: '#9B8FCE', accent: '#EFE6DE' },
    visualRegime: { maxDensity: 0.30, minDotSize: 6, composition: 'DISSOLVENZA' },
  }
};

// ── Track sequence (the album order) ──
export const TRACK_ORDER = ['NEBBIA', 'TESSUTO', 'SOLCO', 'RESPIRO', 'MACCHINA', 'TEMPESTA', 'RITORNO'];
