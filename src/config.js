// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Centralized Configuration
//  v0.8.0: audio + field + DNA + color + camera
// ═══════════════════════════════════════════════════════════

export const CFG = {
  // ── Audio analyser ──
  fftSize: 2048,
  smoothing: 0.82,
  sampleRate: 48000,

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
  densityMax: 0.55,
  densityFloor: 0.04,
  brightnessDensityBoost: 0.12,
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
  climaxDensityBoost: 0.25,
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
  directorBPM: 120,
  directorPlateauSec: 4,
  directorChangeThreshold: 0.45,
  chromaticShiftDuration: 20,
  invertDissolveDuration: 1.0,

  // ── Render ──
  dotSizeBufferThreshold: 6,
  hudUpdateInterval: 6,

  // ── FPS limiter ──
  fpsAutoLimit: 30,     // if fps drops below this, reduce maxEntities
};
