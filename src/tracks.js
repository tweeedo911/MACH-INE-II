// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Track Definitions
//  Each track is a "score sheet": a set of World State values.
//  The Director loads these and interpolates during transitions.
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';

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
    modeHint: 'dorian',
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
    snare: { enabled: false },  // dub: no snare tradizionale

    // Phase durations in seconds
    // Phase durations in BARS (at 129 BPM: 1 bar ≈ 1.86s)
    phases: {
      germoglio:    32,   // ~60s — bass enters alone
      pulsazione:   48,   // ~89s — groove builds
      densita:      64,   // ~119s — the groove in full
      rottura:      16,   // ~30s
      dissoluzione: 32,   // ~60s
    },  // total: 192 bars ≈ 6 min

    // Chord progression — 8 chords × 4 bar = 32 bar cycle (power of 2)
    // V3.5: barsPerChord per fase — germoglio accorciato per completare almeno 1 giro
    barsPerChord: { germoglio: 4, pulsazione: 4, densita: 4, rottura: 2, dissoluzione: 4 },
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
    bassPatternLocked: true,  // V3.5: complementare al rhythmGrid — cycle extension lo romperebbe
    bassSweep: { periodBars: 16, depth: 0.30 },  // dub: respiro profondo, lento

    // Arp: rate and note count
    arpRate: 8,   // 8th notes
    arpNotes: 4,  // 4-note pattern derived from currentChord

    // ── Melody strategy: BASS is the star, voice rare and precious ──
    melodyStrategy: {
      voiceEveryBars: 4,       // 1 phrase every 4 bars (rare, precious)
      voicePhraseLen: [4, 6],  // short phrases
      voiceStyle: { step: 0.45, skip: 0.75, repeatProb: 0.08 },  // medio, qualche skip espressivo
      leadMode: 'none',        // no lead — groove speaks for itself
      arpRole: 'accompany',    // arp present but secondary
      arpVelScale: 0.7,        // quieter than voice
    },

    droneDrift: { periodBars: 16, amplitude: 400 },  // dub: stabile, drift contenuto

    palette: { bg: '#282B26', dot: '#FE6B0D', accent: '#CDD71D' },
    visualRegime: { maxDensity: 0.50, minDotSize: 4, composition: 'ASIMMETRIA' },
  },

  // ═══════════════════════════════════════════════════════════
  //  1. NEBBIA — "ti ambienta" (C lydian, no BPM)
  //  Silence → drone → water drops. No rhythm. Pure space.
  // ═══════════════════════════════════════════════════════════
  NEBBIA: {
    scale: SCALES.C_lydian,
    modeHint: 'lydian',
    root: 48,   // C3
    bpm: null,  // no rhythmic clock — ambient
    kickNote: null,

    density: { rhythm: 0, harmony: 0.3, bass: 0, melody: 0.65, texture: 0.05 },

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

    // Phase durations in BARS (at 60 BPM fallback: 1 bar = 4s)
    phases: {
      germoglio:    32,   // ~128s — long silence → drone → first drops
      pulsazione:   24,   // ~96s — voice + lead counterpoint builds
      densita:      0,    // skip
      rottura:      0,    // skip
      dissoluzione: 16,   // ~64s — fades → silence for TESSUTO
    },  // total: 72 bars ≈ 4.8 min

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
      voiceEveryBars: 4,             // base — gets reduced by growth curve
      voicePhraseLen: [1, 3],        // very short — single notes to tiny motifs
      voiceStyle: { step: 0.65, skip: 0.40, repeatProb: 0.20 },  // grado congiunto, nota che insiste
      callResponseDelay: [0.5, 1.2],   // eco lontanissima nel buio
      leadMode: 'response',          // lead enters in pulsazione as counterpoint
      leadProb: 0.3,                 // not too often
      arpRole: 'none',
      arpVelScale: 0,
      voiceGrowInGermoglio: true,    // V3: crescita progressiva nelle 32 bar di germoglio
    },

    chordOverlapMs: 1500,  // accordi sostenuti che si sovrappongono — unico tessuto armonico

    droneDrift: { periodBars: 48, amplitude: 1024 },  // respiro lento, ampio — il drone SI MUOVE

    palette: { bg: '#0A0A0A', dot: '#EFE6DE', accent: null },
    visualRegime: { maxDensity: 0.25, minDotSize: 10, composition: 'VUOTO' },
  },

  // ═══════════════════════════════════════════════════════════
  //  2. TESSUTO — "qualcosa emerge" (D aeolian, 86 BPM)
  //  Rhythmic chords as motor. Bass enters then disappears.
  // ═══════════════════════════════════════════════════════════
  TESSUTO: {
    scale: SCALES.D_aeolian,
    modeHint: 'aeolian',
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

    // Phase durations in BARS (at 86 BPM: 1 bar ≈ 2.79s)
    phases: {
      germoglio:    24,   // ~67s
      pulsazione:   32,   // ~89s — chords develop
      densita:      32,   // ~89s
      rottura:      8,    // ~22s
      dissoluzione: 24,   // ~67s — bass disappears for SOLCO entry
    },  // total: 120 bars ≈ 5.6 min

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
      leadStyle: { step: 0.55, skip: 0.80, repeatProb: 0.10 },  // lead cerca la forma, esplorativo
      leadMode: 'solo',        // lead plays independently (not response to voice)
      leadProb: 1.0,           // always active when density allows
      leadEveryBars: 2,        // 1 phrase every 2 bars
      leadPhraseLen: [4, 8],   // medium phrases
      arpRole: 'none',
      arpVelScale: 0,
    },

    droneDrift: { periodBars: 32, amplitude: 700 },  // inquietudine sottile

    palette: { bg: '#20130D', dot: '#CDD71D', accent: '#EFE6DE' },
    visualRegime: { maxDensity: 0.45, minDotSize: 6, composition: 'GRIGLIA' },
  },

  // ═══════════════════════════════════════════════════════════
  //  4. RESPIRO — "pausa" (C ionian, no BPM)
  //  Open, pure. Reset. Breath between groove sections.
  // ═══════════════════════════════════════════════════════════
  RESPIRO: {
    scale: SCALES.C_ionian,
    modeHint: 'ionian',
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

    // Phase durations in BARS (at 60 BPM fallback: 1 bar = 4s)
    phases: {
      germoglio:    12,   // ~48s
      pulsazione:   16,   // ~64s — breathing space
      densita:      0,    // skip
      rottura:      0,    // skip
      dissoluzione: 12,   // ~48s
    },  // total: 40 bars ≈ 2.7 min — short pause between grooves

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
      voiceStyle: { step: 0.60, skip: 0.50, repeatProb: 0.03 },  // fluida, cantabile, mai ripete
      callResponseDelay: [0.4, 0.8],   // eco aperta, rilassata
      leadMode: 'echo',        // lead echoes voice, softer and delayed
      leadProb: 0.25,          // rare echoes
      arpRole: 'none',
      arpVelScale: 0,
    },

    chordOverlapMs: 1200,  // pad che si sovrappone — apertura

    droneDrift: { periodBars: 40, amplitude: 900 },  // apertura — drift ampio, lento

    palette: { bg: '#7BBA91', dot: '#20130D', accent: null },
    visualRegime: { maxDensity: 0.10, minDotSize: 8, composition: 'RESPIRO' },
  },

  // ═══════════════════════════════════════════════════════════
  //  5. MACCHINA — "sei dentro" (D dorian, 138 BPM)
  //  Mechanical groove, driving, melodic.
  // ═══════════════════════════════════════════════════════════
  MACCHINA: {
    scale: SCALES.D_dorian,
    modeHint: 'dorian',
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

    // Phase durations in BARS (at 129 BPM: 1 bar ≈ 1.86s)
    phases: {
      germoglio:    32,   // ~60s — arp builds alone
      pulsazione:   48,   // ~89s — machine warms up
      densita:      64,   // ~119s — full mechanical groove
      rottura:      16,   // ~30s
      dissoluzione: 32,   // ~60s
    },  // total: 192 bars ≈ 6 min

    // 4 chords × 4 bar = 16 bar (shorter cycle = more mechanical)
    chords: [
      [50, 53, 57],  // Dm (D F A)
      [55, 59, 62],  // G (G B D)
      [45, 48, 52],  // Am (A C E)
      [52, 55, 59],  // Em (E G B)
    ],

    // Rolling bass — 8th note pump
    bassPattern: [7,0,7,0, 5,0,7,0, 3,0,5,0, 7,0,3,0],
    bassPatternLocked: true,  // V3.5: pump meccanico — cycle extension rompe la simmetria
    bassSweep: { periodBars: 4, depth: 0.05 },  // meccanico: quasi piatto, costante

    arpRate: 16,   // 16th notes — fast
    arpNotes: 4,

    // ── Melody strategy: ARP protagonist, voice+lead as fleeting color ──
    melodyStrategy: {
      voiceEveryBars: 8,       // voice very rare — 1 phrase every 8 bars
      voicePhraseLen: [3, 5],  // short interjections
      voiceStyle: { step: 0.30, skip: 0.85, repeatProb: 0.25 },  // meccanico: skip ampi, ripete come macchina
      callResponseDelay: [0.08, 0.20],  // quasi in sync — meccanico
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

    droneDrift: { periodBars: 8, amplitude: 300 },   // meccanico: vibrazione rapida, piccola

    palette: { bg: '#1A1A2E', dot: '#F8ED00', accent: '#DD3A44' },
    visualRegime: { maxDensity: 0.55, minDotSize: 2, composition: 'GRIGLIA' },
  },

  // ═══════════════════════════════════════════════════════════
  //  6. TEMPESTA — "balli" (E phrygian, 142 BPM)
  //  Peak energy. Full kit. Aggressive bass. Dense.
  // ═══════════════════════════════════════════════════════════
  TEMPESTA: {
    scale: SCALES.E_phrygian,
    modeHint: 'phrygian',
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
    snare: { steps: [4, 10, 12] },  // picco: 3 hit per bar, posizioni asimmetriche

    // Phase durations in BARS (at 129 BPM: 1 bar ≈ 1.86s)
    phases: {
      germoglio:    24,   // ~45s — quick build to peak
      pulsazione:   32,   // ~60s
      densita:      96,   // ~179s — the peak LASTS, the longest section
      rottura:      16,   // ~30s
      dissoluzione: 32,   // ~60s
    },  // total: 200 bars ≈ 6.2 min

    // 4 chords × 2 bar = 8 bar cycle (fast, relentless)
    // V3.5: barsPerChord — incalzante anche in germoglio (non 8 bar default)
    barsPerChord: { germoglio: 3, pulsazione: 2, densita: 2, rottura: 1, dissoluzione: 4 },
    chords: [
      [52, 55, 59],  // Em (E G B)
      [53, 57, 60],  // F (F A C) — phrygian bII
      [50, 53, 57],  // Dm (D F A)
      [57, 60, 64],  // Am (A C E)
    ],

    // Aggressive bass — almost every beat
    bassPattern: [7,0,0,5, 0,3,0,0, 7,0,5,0, 3,0,0,7],
    bassSweep: { periodBars: 8, depth: 0.20 },  // pump deciso ma non profondo

    arpRate: 16,   // 16th notes
    arpNotes: 6,   // wider pattern

    // ── Melody strategy: VOICE+LEAD hocket (interlocked), arp as texture ──
    melodyStrategy: {
      voiceEveryBars: 1,       // voice always active — dense
      voicePhraseLen: [8, 12], // long intertwined phrases
      voiceStyle: { step: 0.25, skip: 0.90, repeatProb: 0.02 },  // tensione: salti grandi, mai ripete
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

    droneDrift: { periodBars: 12, amplitude: 820 },  // tensione: ampio E veloce

    palette: { bg: '#000000', dot: '#FFFFFF', accent: '#91010F' },
    visualRegime: { maxDensity: 0.70, minDotSize: 1, composition: 'DATA' },
  },

  // ═══════════════════════════════════════════════════════════
  //  7. RITORNO — "ti rilascia" (A aeolian, slows down)
  //  Melancholic. Pattern dissolves. Returns to stillness.
  // ═══════════════════════════════════════════════════════════
  RITORNO: {
    scale: SCALES.A_aeolian,
    modeHint: 'aeolian',
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

    // Phase durations in BARS (at 86 BPM: 1 bar ≈ 2.79s)
    phases: {
      germoglio:    24,   // ~67s
      pulsazione:   24,   // ~67s
      densita:      32,   // ~89s — last moment of presence
      rottura:      0,    // no rupture — only descent
      dissoluzione: 48,   // ~134s — very long fade, the goodbye
    },  // total: 128 bars ≈ 6 min

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
      voiceStyle: { step: 0.60, skip: 0.45, repeatProb: 0.15 },  // congiunta, insiste — congedo
      callResponseDelay: [0.6, 1.0],   // eco lontana e rara — arriva da molto lontano
      leadMode: 'echo',        // lead ripete voice, più piano, ritardata
      leadProb: 0.35,          // non sempre — momenti di solitudine
      arpRole: 'dying',        // arp solo in pulsazione, poi muore
      arpVelScale: 0.5,        // fading
    },

    droneDrift: { periodBars: 36, amplitude: 600 },  // congedo: medio, respira lentamente

    palette: { bg: '#0A0A0A', dot: '#9B8FCE', accent: '#EFE6DE' },
    visualRegime: { maxDensity: 0.30, minDotSize: 6, composition: 'DISSOLVENZA' },
  }
};

// ═══════════════════════════════════════════════════════════
//  A/B EXPERIMENT — Music overrides (post-tavola-rotonda 2026-04-06)
//  Reversible: snapshot of original values is taken on first apply,
//  so toggling MUSIC_EXPERIMENT at runtime restores the v1 baseline.
// ═══════════════════════════════════════════════════════════

let _musicExperimentActive = false;
let _v1Snapshot = null;  // captured on first apply, used to restore on disable

// Snapshot only the fields touched by the experiment.
function _captureSnapshot() {
  return {
    TESSUTO_velCeil:  { ...TRACKS.TESSUTO.velocityCeiling  },
    SOLCO_velCeil:    { ...TRACKS.SOLCO.velocityCeiling    },
    MACCHINA_velCeil: { ...TRACKS.MACCHINA.velocityCeiling },
    TEMPESTA_velCeil: { ...TRACKS.TEMPESTA.velocityCeiling },
    TEMPESTA_arpVelScale: TRACKS.TEMPESTA.melodyStrategy.arpVelScale,
    RITORNO_phases:   { ...TRACKS.RITORNO.phases },
  };
}

export function applyMusicExperimentOverrides(enable) {
  if (enable && !_musicExperimentActive) {
    if (!_v1Snapshot) _v1Snapshot = _captureSnapshot();

    // ── Velocity ceilings: alzare harmony e melody, soprattutto in TEMPESTA ──
    TRACKS.TESSUTO.velocityCeiling.harmony = 85;   // 75 → 85
    TRACKS.TESSUTO.velocityCeiling.melody  = 60;   // 55 → 60

    TRACKS.SOLCO.velocityCeiling.harmony   = 70;   // 60 → 70
    TRACKS.SOLCO.velocityCeiling.melody    = 80;   // 75 → 80

    TRACKS.MACCHINA.velocityCeiling.harmony = 75;  // 60 → 75
    TRACKS.MACCHINA.velocityCeiling.melody  = 85;  // 80 → 85

    TRACKS.TEMPESTA.velocityCeiling.harmony = 95;  // 65 → 95 — il picco deve esplodere
    TRACKS.TEMPESTA.velocityCeiling.melody  = 100; // 85 → 100

    // ── ARP TEMPESTA: era inudibile a 0.4 → ora protagonista di texture ──
    TRACKS.TEMPESTA.melodyStrategy.arpVelScale = 0.65;  // 0.4 → 0.65

    // ── RITORNO accorciato: 128 bar → 80 bar (~3.7 min invece di 6) ──
    TRACKS.RITORNO.phases = {
      germoglio:    16,   // 24 → 16
      pulsazione:   16,   // 24 → 16
      densita:      24,   // 32 → 24
      rottura:      0,
      dissoluzione: 24,   // 48 → 24 — dimezzato, il taglio principale
    };

    _musicExperimentActive = true;
    console.log('[MUSIC_EXP] Track overrides APPLIED');
  } else if (!enable && _musicExperimentActive && _v1Snapshot) {
    // Restore baseline values
    TRACKS.TESSUTO.velocityCeiling  = { ..._v1Snapshot.TESSUTO_velCeil };
    TRACKS.SOLCO.velocityCeiling    = { ..._v1Snapshot.SOLCO_velCeil };
    TRACKS.MACCHINA.velocityCeiling = { ..._v1Snapshot.MACCHINA_velCeil };
    TRACKS.TEMPESTA.velocityCeiling = { ..._v1Snapshot.TEMPESTA_velCeil };
    TRACKS.TEMPESTA.melodyStrategy.arpVelScale = _v1Snapshot.TEMPESTA_arpVelScale;
    TRACKS.RITORNO.phases = { ..._v1Snapshot.RITORNO_phases };

    _musicExperimentActive = false;
    console.log('[MUSIC_EXP] Track overrides REVERTED to v1 baseline');
  }
}

// Apply at module load if flag is on at boot
if (CFG.MUSIC_EXPERIMENT) {
  applyMusicExperimentOverrides(true);
}

// ── Track sequence (the album order) ──
export const TRACK_ORDER = ['NEBBIA', 'TESSUTO', 'SOLCO', 'RESPIRO', 'MACCHINA', 'TEMPESTA', 'RITORNO'];
