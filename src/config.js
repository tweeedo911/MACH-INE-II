// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Centralized Configuration
//  v1.1.0: dynamic storytelling + density contrast
// ═══════════════════════════════════════════════════════════

export const CFG = {
  // ── Audio analyser ──
  fftSize: 2048,
  smoothing: 0.82,
  sampleRate: 48000,
  audioInputGain: 5.0,     // gain sull'input microfono/BlackHole (regolabile via [ ])
  audioInputGainMin: 0.5,
  audioInputGainMax: 8.0,
  audioInputGainStep: 0.5,

  // ── Band frequency boundaries (Hz) ──
  bandRanges: {
    sub:  [20, 80],
    low:  [80, 300],
    mid:  [300, 2000],
    high: [2000, 8000],
    air:  [8000, 24000],
  },

  // ── Spectral flux / onset ──
  fluxSmoothingWindow: 30,
  fluxOnsetMultiplier: 1.5,
  fluxMinThreshold: 0.01,

  // ── Energy trajectory ──
  trajectoryWindowSec: 3,
  trajectoryThreshold: 0.04,

  // ── BPM estimation ──
  bpmMaxOnsets: 40,
  bpmMinOnsets: 4,
  bpmMinInterval: 0.2,
  bpmMaxInterval: 2.0,

  // ── Stereo ──
  stereoCorrelationSmoothing: 0.9,

  // ── MIDI ──
  noteFlashDecay: 0.91,
  noteDensityWindowSec: 2,

  // ── Dot-size ──
  dotSizeMin: 1,
  dotSizeMax: 16,

  // ── Density ──
  densityBase: 0.0,
  densityMax: 0.65,          // was 0.45 — wider dynamic range
  densityFloor: 0.01,        // was 0.06 — allow true voids
  densityVoidThreshold: 0.12, // below this → zero (negative space)
  brightnessDensityBoost: 0.06,
  rhythmFlickerAmp: 0.04,
  rhythmFlickerSpeed: 3,

  // ── Zone seeds ──
  zoneCount: 10,
  zoneDotSizeVariation: 0.7,
  zoneDensityVariation: 0.5,
  zoneFlickerPhaseSpread: 1.0,

  // ── Generations ──
  maxEntities: 4000,
  birthRateMin: 0,
  birthRateMax: 60,
  onsetBurstCount: 40,
  midiBurstCount: 15,
  entityLifeMin: 4,
  entityLifeMax: 20,
  fossilDuration: 3,
  fossilDensity: 0.03,
  ageDotSizeGrowth: 6,

  // ── Stereo width ──
  widthCenterFalloff: 3.0,

  // ── Onset wave ──
  onsetWaveSpeed: 800,
  onsetWaveDensity: 0.7,
  onsetWaveWidth: 50,
  onsetDecayRate: 0.92,

  // ── MIDI column ──
  midiColumnWidth: 0.03,
  midiColumnDecay: 0.93,

  // ── Climax ──
  climaxThresholdSec: 3,
  climaxIntensityThreshold: 0.85,
  climaxShiftSpeed: 0.4,
  climaxDotCompress: 0.3,
  climaxDensityBoost: 0.12,   // was 0.25
  climaxCollapseSpeed: 3.0,

  // ── Color decay ──
  colorDecayStart: 0.65,
  colorDecayEnd: 0.92,

  // ── Camera ──
  camLerpFast: 0.08,
  camLerpSlow: 0.02,
  camMediumZoom: 1.5,
  camMacroZoom: 3,
  camMacroReturnSec: 5,
  camPanSpeed: 1.5,
  camPanOscAmp: 0.12,
  camPanOscSpeed: 0.25,

  // ── Director ──
  directorPlateauSec: 4,
  directorChangeThreshold: 0.55,
  chromaticShiftDuration: 20,
  invertDissolveDuration: 1.0,

  // ── Scene system ──
  sceneTransitionBars: 8,
  sceneCutProbability: 0.25,

  // ── Audio-driven arc thresholds (tunable) ──
  arcRmsSilence:   0.10,   // below this = SILENCE
  arcRmsBuilding:  0.28,   // SILENCE→BUILDING
  arcRmsActive:    0.38,   // BUILDING→ACTIVE
  arcRmsIntense:   0.60,   // ACTIVE→INTENSE
  arcRmsPeak:      0.80,   // INTENSE→PEAK
  arcFluxIntense:  0.012,  // flux needed to reach INTENSE
  arcSmoothTau:    0.6,    // RMS smoothing time constant (seconds)
  // State hold times (prevent flickering)
  arcHoldSilence:  2.0,
  arcHoldBuilding: 3.0,
  arcHoldActive:   4.0,
  arcHoldIntense:  3.0,
  arcHoldPeak:     5.0,
  arcHoldDecay:    7.0,

  // ── Render ──
  dotSizeBufferThreshold: 6,
  hudUpdateInterval: 6,

  // ── FPS limiter ──
  fpsAutoLimit: 30,

  // ── Composer 1 (TERRENO — D Dorian, dub lento) ──
  composer1Key: 'Digit4',
  COMPOSER: {
    enabled: false,
    bpm: 72,
    phases: {
      germoglio:    { duration: 40,  mode: 'D_dorian',   drone: 62, arc: 'SILENCE'   },
      pulsazione:   { duration: 60,  mode: 'D_phrygian',  drone: 62, arc: 'BUILDING'  },
      densita:      { duration: 90,  mode: 'A_lydian',    drone: 69, arc: 'INTENSE'   },
      rottura:      { duration: 30,  mode: 'D_dorian',    drone: 50, arc: 'PEAK'      },
      dissoluzione: { duration: 80,  mode: 'D_dorian',    drone: 62, arc: 'RELEASE'   },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    euclidean: { normal: [5, 16], rottura: [3, 8] },
    minSilenceRatio: 0.40,
    rupture: {
      presagio:      [0.00, 0.25],
      infiltrazione: [0.25, 0.55],
      takeover:      [0.55, 0.85],
      residuo:       [0.85, 1.00],
      silenceBarsRange: [4, 6],
    },
    voiceLeadingMax: 2,
    midiOutputName: null,
  },

  // ── Composer 2 (MECCANICA — C# Dorian, layer poliritmici) ──
  COMPOSER2: {
    toggleKey: 'Digit5',
    bpm: 98,
    gravitationalCenter: 61, // C#3
    phases: {
      germoglio:    { duration: 45, mode: 'Cs_dorian',   drone: 61, arc: 'SILENCE'  },
      pulsazione:   { duration: 65, mode: 'Cs_dorian',   drone: 61, arc: 'BUILDING' },
      densita:      { duration: 85, mode: 'Cs_dorian',   drone: 61, arc: 'INTENSE'  },
      rottura:      { duration: 35, mode: 'Cs_dorian',   drone: 61, arc: 'PEAK'     },
      dissoluzione: { duration: 90, mode: 'Cs_dorian',   drone: 61, arc: 'RELEASE'  },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    layers: {
      harmonic: { cycleBars: 4, offset: 0.00 },  // prime cycles → realign every 420 bars
      rhythmic: { cycleBars: 3, offset: 0.00 },
      textural: { cycleBars: 5, offset: 0.00 },
      melodic:  { cycleBars: 7, offset: 0.00 },
    },
    grooveShuffleMs: 10,  // ±10ms humanization on rhythmic crossings
    silenceTarget: {
      germoglio:    0.65,
      pulsazione:   0.45,
      densita:      0.28,
      rottura:      0.18,
      dissoluzione: 0.60,
    },
    rupture: {
      presagioAt:      0.55,
      infiltrazioneAt: 0.70,
      takeoverAt:      0.80,
      residuoAt:       0.88,
    },
    voiceLeadingMax: 2,
    midiOutputName: null,
  },

  // ── Composer 3 (DERIVA — A Lydian, brightness-driven, no beat fisso) ──
  COMPOSER3: {
    toggleKey: 'Digit1',
    bpm: null,  // non usato: il trigger è brightness, non beat
    brightnessTrigger: {
      threshold: 0.40,          // centroid normalizzato sopra cui parte una nota VOICE
      adaptiveWindow: 30,       // frame per la moving average (come fluxSmoothingWindow)
      adaptiveMultiplier: 1.30, // soglia = media × moltiplicatore (come fluxOnsetMultiplier)
      minThreshold: 0.15,       // floor adattivo (come fluxMinThreshold)
    },
    phases: {
      germoglio:    { duration: 40,  mode: 'A_lydian',   drone: 45, arc: 'SILENCE'  },
      pulsazione:   { duration: 60,  mode: 'A_lydian',   drone: 45, arc: 'BUILDING' },
      densita:      { duration: 90,  mode: 'A_lydian',   drone: 45, arc: 'INTENSE'  },
      rottura:      { duration: 30,  mode: 'A_lydian',   drone: 45, arc: 'PEAK'     },
      dissoluzione: { duration: 80,  mode: 'A_lydian',   drone: 45, arc: 'RELEASE'  },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    driftBarSec: 4,           // virtual "bar" length in seconds (no BPM)
    minSilenceRatio: 0.40,
    rupture: {
      presagio:      [0.00, 0.25],
      infiltrazione: [0.25, 0.55],
      takeover:      [0.55, 0.85],
      residuo:       [0.85, 1.00],
    },
    grain: {
      hihatClosed: 42, hihatOpen: 46,
      snare: 38, sideStick: 37, clap: 39, claves: 75,
      tomRange: [64, 65, 66, 67, 68],
    },
    // Progressioni accordali fisse per fase (MIDI assoluto — A Lydian)
    chordProgressions: {
      germoglio:    null,
      pulsazione:   [[57,61,64],[64,68,71],[57,61,64],[59,63,66]],   // A→E→A→B
      densita:      [[57,61,64],[59,63,66],[61,64,68],[64,68,71],[57,61,64],[66,69,73]], // A→B→C#m→E→A→F#m
      rottura:      null,
      dissoluzione: [[57,61,64],[64,68,71],[57,61,64]],              // A→E→A
    },
    // Virtual bars between chord changes (0 = no chords)
    chordRhythm: {
      germoglio: 0, pulsazione: 4, densita: 2, rottura: 0, dissoluzione: 12,
    },
    voiceLeadingMax: 2,
    midiOutputName: null,
  },

  // ── Composer 4 (VORTICE — E Phrygian, breakbeat industriale 138bpm) ──
  COMPOSER4: {
    toggleKey: 'Digit6',
    bpm: 138,
    gravitationalCenter: 64, // E4
    phases: {
      germoglio:    { duration: 30,  mode: 'E_phrygian',  drone: 52, arc: 'SILENCE'  },
      pulsazione:   { duration: 50,  mode: 'E_phrygian',  drone: 52, arc: 'BUILDING' },
      densita:      { duration: 70,  mode: 'E_phrygian',  drone: 52, arc: 'INTENSE'  },
      rottura:      { duration: 25,  mode: 'E_phrygian',  drone: 52, arc: 'PEAK'     },
      dissoluzione: { duration: 60,  mode: 'E_phrygian',  drone: 52, arc: 'RELEASE'  },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    variationBars: 16,   // complete pattern change every N bars
    silenceTarget: {
      germoglio: 0.25, pulsazione: 0.12, densita: 0.05,
      rottura: 0.05, dissoluzione: 0.35,
    },
    rupture: {
      presagioAt: 0.50, infiltrazioneAt: 0.65,
      takeoverAt: 0.78, residuoAt: 0.90,
    },
    voiceLeadingMax: 3,
    midiOutputName: null,
  },

  // ── Composer 5 (CRISTALLO — E Lydian, ambient cristallino 54bpm) ──
  COMPOSER5: {
    toggleKey: 'Digit2',
    bpm: 54,
    gravitationalCenter: 64, // E4
    phases: {
      germoglio:    { duration: 60,  mode: 'E_lydian',    drone: 52, arc: 'SILENCE'  },
      pulsazione:   { duration: 80,  mode: 'E_lydian',    drone: 52, arc: 'BUILDING' },
      densita:      { duration: 120, mode: 'E_lydian',    drone: 52, arc: 'INTENSE'  },
      rottura:      { duration: 20,  mode: 'F_locrian',   drone: 53, arc: 'PEAK'     },
      dissoluzione: { duration: 100, mode: 'E_lydian',    drone: 52, arc: 'RELEASE'  },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    shimmerInterval: 3,       // seconds between shimmer arpeggios
    sustainMultiplier: 4.0,   // note duration multiplier (long pads)
    silenceTarget: {
      germoglio: 0.70, pulsazione: 0.55, densita: 0.35,
      rottura: 0.10, dissoluzione: 0.65,
    },
    rupture: {
      presagioAt: 0.60, infiltrazioneAt: 0.75,
      takeoverAt: 0.85, residuoAt: 0.92,
    },
    chordProgressions: {
      germoglio:    [[64,68,71,75]],                                                          // Emaj7 (pad sostenuto)
      pulsazione:   [[64,68,71,75],[66,70,73,76],[64,68,71,75],[71,75,78,82]],               // Emaj7→F#maj7→Emaj7→Bmaj7
      densita:      [[64,68,71,75],[66,70,73,78],[68,71,75,80],[71,75,78,82],[64,68,73,75],[61,66,68,73]], // Emaj7→F#add9→G#add11→Bmaj7→Eadd9→C#m9
      rottura:      null,
      dissoluzione: [[64,68,71,75],[71,75,78,82],[64,68,71,75]],                             // Emaj7→Bmaj7→Emaj7
    },
    chordRhythm: {
      germoglio: 8, pulsazione: 8, densita: 4, rottura: 0, dissoluzione: 16,
    },
    voiceLeadingMax: 2,
    midiOutputName: null,
  },

  // ── Composer 6 (ABISSO — Bb Phrygian, drone rituale 76bpm) ──
  COMPOSER6: {
    toggleKey: 'Digit3',
    bpm: 76,
    gravitationalCenter: 70, // Bb4
    phases: {
      germoglio:    { duration: 50,  mode: 'Bb_phrygian', drone: 46, arc: 'SILENCE'  },
      pulsazione:   { duration: 70,  mode: 'Bb_phrygian', drone: 46, arc: 'BUILDING' },
      densita:      { duration: 100, mode: 'Bb_phrygian', drone: 46, arc: 'INTENSE'  },
      rottura:      { duration: 30,  mode: 'Bb_phrygian', drone: 46, arc: 'PEAK'     },
      dissoluzione: { duration: 90,  mode: 'Bb_phrygian', drone: 46, arc: 'RELEASE'  },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    heartbeatEvery: 2,        // PULSE every N beats (heartbeat feel)
    risalitaOctaves: 2,       // octave shift during rupture takeover
    silenceTarget: {
      germoglio: 0.75, pulsazione: 0.55, densita: 0.35,
      rottura: 0.15, dissoluzione: 0.70,
    },
    rupture: {
      presagioAt: 0.45, infiltrazioneAt: 0.60,
      takeoverAt: 0.75, residuoAt: 0.90,
    },
    voiceLeadingMax: 1,
    midiOutputName: null,
  },

  // ── Composer 7 (SOLCO — G Dorian, Berlin techno ipnotico 128bpm) ──
  COMPOSER7: {
    toggleKey: 'Digit7',
    bpm: 128,
    gravitationalCenter: 55, // G3
    phases: {
      germoglio:    { duration: 35,  mode: 'G_dorian',   drone: 55, arc: 'SILENCE'  },
      pulsazione:   { duration: 55,  mode: 'G_dorian',   drone: 55, arc: 'BUILDING' },
      densita:      { duration: 80,  mode: 'G_dorian',   drone: 55, arc: 'INTENSE'  },
      rottura:      { duration: 28,  mode: 'G_dorian',   drone: 55, arc: 'PEAK'     },
      dissoluzione: { duration: 65,  mode: 'G_dorian',   drone: 55, arc: 'RELEASE'  },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    sweepBars: 8,
    silenceTarget: {
      germoglio: 0.40, pulsazione: 0.30, densita: 0.15,
      rottura: 0.05, dissoluzione: 0.45,
    },
    climax: {
      presagioAt:      0.15,
      infiltrazioneAt: 0.40,
      takeoverAt:      0.70,
      hardCutAt:       0.85,
    },
    voiceLeadingMax: 2,
    midiOutputName: null,
  },
};
