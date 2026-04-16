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

  // ── ENCORE — 3 switchable scales (non-diatonic) ──
  octatonic_halfWhole: [48,49,51,52,54,55,57,58, 60,61,63,64,66,67,69,70, 72,73,75,76,78,79,81,82],
  octatonic_wholeHalf: [48,50,51,53,54,56,57,59, 60,62,63,65,66,68,69,71, 72,74,75,77,78,80,81,83],
  prometheus:          [48,50,52,54,57,58, 60,62,64,66,69,70, 72,74,76,78,81,82],
};

export { SCALES };

// ── ENCORE scale lookup (switchable live with Q/W/R) ──
export const ENCORE_SCALES = {
  halfWhole: SCALES.octatonic_halfWhole,
  wholeHalf: SCALES.octatonic_wholeHalf,
  prometheus: SCALES.prometheus,
};

// ── ENCORE chord progressions per scale ──
export const ENCORE_CHORDS = {
  halfWhole: [
    [48, 52, 55],  // C major
    [51, 54, 58],  // Eb minor
    [54, 57, 61],  // F# major
    [57, 60, 63],  // A minor
  ],
  wholeHalf: [
    [48, 51, 54],  // C minor
    [51, 54, 57],  // Eb dim-ish
    [54, 57, 60],  // Gb minor
    [57, 60, 63],  // A dim-ish
  ],
  prometheus: [
    [48, 52, 57],  // C-E-A (no 5th, with 6th)
    [50, 54, 58],  // D-F#-Bb
    [54, 57, 62],  // F#-A-D (inversion)
    [57, 58, 64],  // A-Bb-E (cluster)
  ],
};

// ── Density profiles per phase (multiplied by track density) ──
const PHASE_DENSITY = {
  germoglio:    { rhythm: 0.0, harmony: 0.5, bass: 0.3, melody: 0.2, texture: 0.20 },
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
      voiceContours: [['arch', 3], ['question', 2], ['answer', 1]],  // V3.11: dub — arco naturale, qualche domanda
      leadMode: 'none',        // no lead — groove speaks for itself
      arpRole: 'accompany',    // arp present but secondary
      arpVelScale: 0.7,        // quieter than voice
      // V3.11: arp che cambia direzione — dub non è mai un loop fisso
      arpVariation: { dirChangeEvery: 4, restProb: 0.12, passingProb: 0.08 },
    },

    // V3.11: basso dub con ottave e ghost
    bassOrnament: { octaveProb: 0.06, ghostProb: 0.10 },

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
      // V3.11: NEBBIA — gocce che salgono dal buio, qualche arco intimo
      voiceContours: [['question', 3], ['arch', 2], ['peak', 1]],
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

    density: { rhythm: 0.15, harmony: 0.6, bass: 0.6, melody: 0.3, texture: 0.1 },

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
    chordGridGhostProb: 0.08,   // V3.11: ghost hit ~8% sugli step vuoti — groove si riempie

    // 4 chords × 8 bar = 32 bar
    chords: [
      [50, 53, 57],  // Dm (D F A)
      [46, 50, 53],  // Bb (Bb D F)
      [48, 52, 55],  // C (C E G)
      [45, 48, 52],  // Am (A C E)
    ],

    // Ritmo proprio complementare a chordGrid — nota dall'accordo corrente
    // chordGrid step 0,6,9,15 — bassGrid step 3,10: incastrato nei vuoti, ipnotico
    bassGrid: [0,0,0,1, 0,0,0,0, 0,0,1,0, 0,0,0,0],
    bassPattern: null,  // Mode A: segue armonia con ritmo da bassGrid

    arpRate: 0,
    arpNotes: 0,

    // ── Melody strategy: voice tace, LEAD is the melodic voice (introduces CH6) ──
    melodyStrategy: {
      voiceEveryBars: 0,       // voice OFF — silent
      voicePhraseLen: [0, 0],
      leadStyle: { step: 0.55, skip: 0.80, repeatProb: 0.10 },  // lead cerca la forma, esplorativo
      leadContours: [['arch', 3], ['question', 2], ['peak', 1]],  // V3.11: lead esplorativo, sale e cerca
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

    density: { rhythm: 0.8, harmony: 0.5, bass: 0.85, melody: 0.6, texture: 0.45 },

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

    // Pump sincopato — quinta con offbeat e quarta che rompe
    bassPattern: [7,0,0,7, 0,0,7,0, 0,7,0,0, 7,0,5,0],
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
      // V3.11: arp = cuore di MACCHINA — deve variare molto
      arpVariation: {
        dirChangeEvery: 2,     // cambia direzione ogni 2 bar (meccanico ma vario)
        restProb: 0.08,        // pochi buchi — la macchina non si ferma
        passingProb: 0.12,     // note di passaggio: la macchina "sbaglia"
        directions: ['up', 'down', 'pendulum', 'random'],
      },
    },

    // V3.11: bass meccanico — solo octave, no ghost (pattern locked)
    bassOrnament: { octaveProb: 0.05, ghostProb: 0 },

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
  //  6. TEMPESTA — "balli" (E phrygian, 129 BPM)
  //  Esplosione umana dopo la macchina. Voice protagonista, bII frigio,
  //  conga sincopata, hat con open hat — ≠ MACCHINA in tutto tranne BPM.
  //  Transizione DJ: crossfade 32 bar da MACCHINA (vedi director3.js).
  // ═══════════════════════════════════════════════════════════
  TEMPESTA: {
    scale: SCALES.E_phrygian,
    modeHint: 'phrygian',
    root: 52,   // E3
    bpm: 129,     // 43×3 — stesso BPM di MACCHINA, crossfade DJ
    kickNote: 40,  // E2

    density: { rhythm: 0.95, harmony: 0.45, bass: 0.95, melody: 1.0, texture: 0.2 },

    register: {
      bass:   [24, 43],     // più basso di MACCHINA [26,45] — più sub, più peso
      melody: [64, 81],
      lead:   [72, 93],
      chords: [52, 69],
      arp:    [64, 84],
    },
    velocityCeiling: {
      rhythm:  120,
      harmony: 75,          // più alto — armonia frigia deve farsi sentire
      bass:    110,         // più alto — bass protagonista
      melody:  95,          // voice protagonista — deve dominare
      texture: 40,
    },

    // Picco dance — 4-on-floor puro, griglia solida
    rhythmGrid: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: { steps: [4, 12], shift: false, skip: false, flam: false },

    // ── Conga pattern: sincopature che MACCHINA non ha (calore tribale/latino) ──
    congaPattern: {
      germoglio:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      pulsazione:   [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],  // appena accennata
      densita:      [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,1,0,0],  // step 3,11,13 — sincopatura piena
      rottura:      [0,0,1,1, 0,0,0,1, 0,0,1,1, 0,1,0,0],  // più densa, caotica
      dissoluzione: [0,0,0,1, 0,0,0,0, 0,0,0,0, 0,0,0,0],  // eco che muore
    },

    // Phase durations in BARS (at 129 BPM: 1 bar ≈ 1.86s)
    phases: {
      germoglio:    24,   // ~45s — breve, arriva dal crossfade DJ
      pulsazione:   32,   // ~60s
      densita:      96,   // ~179s — il picco DURA
      rottura:      16,   // ~30s
      dissoluzione: 32,   // ~60s
    },  // total: 200 bars ≈ 6.2 min

    // 4 chords × 2 bar = 8 bar cycle (incalzante)
    barsPerChord: { germoglio: 4, pulsazione: 2, densita: 2, rottura: 1, dissoluzione: 4 },
    chords: [
      [52, 55, 59],  // Em (E G B)
      [53, 57, 60],  // F (F A C) — bII frigio: IL colore che separa TEMPESTA da MACCHINA
      [50, 53, 57],  // Dm (D F A)
      [57, 60, 64],  // Am (A C E)
    ],

    // Chord ritmico — staccato che dà groove, non pad
    chordGrid: [1,0,0,0, 1,0,0,0, 0,0,1,0, 0,0,0,1],
    chordGridGhostProb: 0.06,   // ghost rari — groove si ispessisce

    // Bass melodico — meno note, più lunghe, walking. Densità attiva il pump.
    bassPattern: [7,0,0,0, 0,0,0,0, 5,0,0,0, 0,0,3,0],
    bassSweep: { periodBars: 8, depth: 0.20 },  // respiro melodico

    arpRate: 8,    // 8th notes (≠ MACCHINA 16th) — più lento, più spazio, non compete col hat
    arpNotes: 4,

    // ── Melody strategy: VOICE protagonista (≠ MACCHINA dove arp comanda) ──
    melodyStrategy: {
      voiceEveryBars: 2,       // frasi ogni 2 bar — costante ma respira
      voicePhraseLen: [6, 10], // frasi lunghe, cantabili
      voiceStyle: { step: 0.55, skip: 0.65, repeatProb: 0.08 },  // cantabile: gradi congiunti, qualche salto espressivo
      // V3.11: voice di TEMPESTA chiama, sale, domanda — è l'esplosione umana
      voiceContours: [['arch', 2], ['question', 4], ['peak', 2], ['answer', 1]],
      leadMode: 'response',    // lead risponde — dialogo
      leadProb: 0.7,           // risponde spesso
      arpRole: 'texture',      // arp = sfondo
      arpVelScale: 0.35,       // quieto, sotto tutto
      // V3.11: arp texture — cambia direzione spesso, qualche buco e nota di passaggio
      arpVariation: {
        dirChangeEvery: 4,
        restProb: 0.15,        // texture: più buchi = respira
        passingProb: 0.10,
      },
    },

    // V3.11: basso con tutti gli ornamenti — il groove è denso
    bassOrnament: { octaveProb: 0.08, ghostProb: 0.12 },

    // ── Hat: 8th con open hat (≠ MACCHINA 16th pieni) — groove dance, non macchina ──
    hatPatterns: {
      germoglio:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      pulsazione:   [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],  // quarti — polso essenziale
      densita:      [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],  // 8th note — groove aperto
      rottura:      [1,0,1,0, 1,0,1,1, 1,0,1,0, 1,0,1,1],  // 8th + 16th fill su beat 4
      dissoluzione: [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
    },
    // Open hat su offbeat di beat 2 e 4 (step 6,14) — gestito in rhythm.js
    openHatSteps: [6, 14],

    droneDrift: { periodBars: 16, amplitude: 500 },

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
      // V3.11: RITORNO si congeda — frasi che scendono, qualche arco nostalgico
      voiceContours: [['answer', 4], ['arch', 2], ['question', 1]],
      callResponseDelay: [0.6, 1.0],   // eco lontana e rara — arriva da molto lontano
      leadMode: 'echo',        // lead ripete voice, più piano, ritardata
      leadProb: 0.35,          // non sempre — momenti di solitudine
      arpRole: 'dying',        // arp solo in pulsazione, poi muore
      arpVelScale: 0.5,        // fading
      // V3.11: arp morente — varia direzione ma solo pendolo e random (no cicli regolari)
      arpVariation: {
        dirChangeEvery: 8,     // cambia raramente — sta morendo
        restProb: 0.20,        // molti buchi — si sfilaccia
        passingProb: 0.05,
        directions: ['pendulum', 'random', 'down'],  // no 'up' — non sale, scende
      },
    },

    droneDrift: { periodBars: 36, amplitude: 600 },  // congedo: medio, respira lentamente

    palette: { bg: '#0A0A0A', dot: '#9B8FCE', accent: '#EFE6DE' },
    visualRegime: { maxDensity: 0.30, minDotSize: 6, composition: 'DISSOLVENZA' },
  },

  ENCORE: {
    scale: SCALES.octatonic_halfWhole,  // default, switched live via Q/W/R
    modeHint: null,  // octatonic is symmetric — no modal characteristic
    root: 48,   // C3
    bpm: 132,
    kickNote: 36,  // C2

    // Densities set dynamically by director3 canon engine per brick
    density: { rhythm: 0.8, harmony: 0, bass: 0, melody: 0, texture: 0 },

    register: {
      bass:   [36, 55],   // C2–G3
      melody: [55, 72],   // G3–C5 (voice — abbassata, registro narrativo)
      lead:   [62, 81],   // D4–A5
      chords: [48, 72],   // C3–C5
      arp:    [60, 82],   // C4–Bb5
    },
    velocityCeiling: {
      rhythm:  120,
      harmony: 100,
      bass:    110,
      melody:  90,
      texture: 40,
    },

    // Rhythm: unchanged from v1 — polimetric kick/hat/snare
    rhythmGrid: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: { enabled: true, steps: [3, 7, 11], shift: false, skip: false, flam: false },
    encoreHatPattern: [1,0,1,0,0, 1,0,1,0,0],
    encoreOpenHatSteps: [4, 8],
    encoreCongaPattern: [1,0,0,1,0,0,1],

    // No fixed bass/arp/voice/chord patterns — canon engine generates notes
    // Phases mapped to escalation bricks (director3 manages internally)
    // V2.2: 8 brick, chord anticipato, plateau doppio. Total 216 bar.
    phases: {
      germoglio:    16,    // brick 0 — heartbeat
      pulsazione:   68,    // brick 1-2 (arp+bass)
      densita:      44,    // brick 3-4 (hat/snare/chord+drone, voice)
      rottura:      24,    // brick 5-6 (lead, conga)
      dissoluzione: 64,    // brick 7 — plateau (doppio, poi taglio netto)
    },

    palette: { bg: '#000000', dot: '#FFFFFF', accent: '#FF0000' },
    visualRegime: { maxDensity: 0.95, minDotSize: 2, composition: 'DEFAULT' },
  },
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
export const TRACK_ORDER = ['NEBBIA', 'TESSUTO', 'SOLCO', 'RESPIRO', 'MACCHINA', 'TEMPESTA', 'RITORNO', 'ENCORE'];
