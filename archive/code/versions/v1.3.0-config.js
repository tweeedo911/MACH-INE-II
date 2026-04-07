// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Centralized Configuration
//  v1.1.0: dynamic storytelling + density contrast
// ═══════════════════════════════════════════════════════════

export const CFG = {
  // ── Audio analyser ──
  fftSize: 2048,
  smoothing: 0.82,
  sampleRate: 48000,
  audioInputGain: 2.0,     // gain sull'input microfono/BlackHole (regolabile via [ ])
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

  // ── Composer 1 (Mode 2 — DERIVA D Dorian) ──
  composer1Key: 'Digit1',
  COMPOSER: {
    enabled: false,
    bpm: 116,
    phases: {
      germoglio:    { duration: 40,  mode: 'D_dorian',   drone: 62, arc: 'SILENCE'   },
      pulsazione:   { duration: 60,  mode: 'D_phrygian',  drone: 62, arc: 'BUILDING'  },
      densita:      { duration: 90,  mode: 'A_lydian',    drone: 69, arc: 'INTENSE'   },
      rottura:      { duration: 30,  mode: 'Eb_locrian',  drone: 63, arc: 'PEAK'      },
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

  // ── Composer 2 (Mode 3 — C# Dorian, layer sfasati) ──
  COMPOSER2: {
    toggleKey: 'Digit2',
    bpm: 108,
    gravitationalCenter: 61, // C#4
    phases: {
      germoglio:    { duration: 45, mode: 'Cs_dorian',   drone: 61, arc: 'SILENCE'  },
      pulsazione:   { duration: 65, mode: 'Cs_phrygian', drone: 61, arc: 'BUILDING' },
      densita:      { duration: 85, mode: 'Gs_lydian',   drone: 68, arc: 'INTENSE'  },
      rottura:      { duration: 35, mode: 'D_locrian',   drone: 62, arc: 'PEAK'     },
      dissoluzione: { duration: 90, mode: 'Cs_dorian',   drone: 61, arc: 'RELEASE'  },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    layers: {
      harmonic: { cycleBars: 24, offset: 0.00 },
      rhythmic: { cycleBars: 8,  offset: 0.00 },
      textural: { cycleBars: 3,  offset: 0.33 },
      melodic:  { cycleBars: 4,  offset: 0.50 },
    },
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

  // ── Composer 3 (spec new/ — 8 tracce, D Dorian DERIVA, BPM 84) ──
  COMPOSER3: {
    toggleKey: 'Digit3',
    bpm: 84,
    phases: {
      germoglio:    { duration: 40,  mode: 'D_dorian',   drone: 38, arc: 'SILENCE'  },
      pulsazione:   { duration: 60,  mode: 'D_phrygian', drone: 38, arc: 'BUILDING' },
      densita:      { duration: 90,  mode: 'A_lydian',   drone: 45, arc: 'INTENSE'  },
      rottura:      { duration: 30,  mode: 'Eb_locrian', drone: 39, arc: 'PEAK'     },
      dissoluzione: { duration: 80,  mode: 'D_dorian',   drone: 38, arc: 'RELEASE'  },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    euclidean: { normal: [5, 16], rottura: [3, 8] },
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
    // Progressioni accordali fisse per fase (MIDI assoluto — D Dorian)
    chordProgressions: {
      germoglio:    null,
      pulsazione:   [[50,53,57],[53,57,60],[50,53,57],[48,52,55]], // Dm→F→Dm→C
      densita:      [[57,61,64],[52,56,59],[54,57,61],[52,56,59],[57,61,64],[59,62,66]],
      rottura:      null,
      dissoluzione: [[50,53,57],[45,48,52],[50,53,57]],            // Dm→Am→Dm
    },
    // Bar tra un cambio accordo e il successivo (0 = nessun accordo)
    chordRhythm: {
      germoglio: 0, pulsazione: 4, densita: 2, rottura: 0, dissoluzione: 12,
    },
    voiceLeadingMax: 2,
    midiOutputName: null,
  },
};
