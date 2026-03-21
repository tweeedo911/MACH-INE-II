// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Centralized Configuration
// ═══════════════════════════════════════════════════════════

export const CFG = {
  // ── Audio analyser ──
  fftSize: 2048,
  smoothing: 0.82,
  sampleRate: 48000, // updated at runtime from AudioContext

  // ── Band frequency boundaries (Hz) ──
  bandRanges: {
    sub:  [20, 80],
    low:  [80, 300],
    mid:  [300, 2000],
    high: [2000, 8000],
    air:  [8000, 24000],
  },

  // ── Spectral flux / onset ──
  fluxSmoothingWindow: 30,    // frames for moving average (~0.5s at 60fps)
  fluxOnsetMultiplier: 1.5,   // flux > avg * multiplier = onset
  fluxMinThreshold: 0.01,     // minimum flux to consider onset

  // ── Energy trajectory ──
  trajectoryWindowSec: 3,     // seconds of RMS history
  trajectoryThreshold: 0.04,  // difference threshold for rising/falling

  // ── BPM estimation ──
  bpmMaxOnsets: 40,           // max onset timestamps to keep
  bpmMinOnsets: 4,            // minimum onsets needed for estimation
  bpmMinInterval: 0.2,       // seconds — ignore onsets closer than this (300 BPM max)
  bpmMaxInterval: 2.0,       // seconds — ignore intervals longer than this (30 BPM min)

  // ── Stereo ──
  stereoCorrelationSmoothing: 0.9, // EMA smoothing for correlation

  // ── History / spectrogram ──
  historyLines: 80,
  historyIntervalMs: 30,
  maxDisplaceFrac: 0.025,

  // ── Onset visual ──
  onsetDecay: 0.88,

  // ── MIDI ──
  noteFlashDecay: 0.91,
  noteDensityWindowSec: 2,    // seconds for note density calculation

  // ── Render ──
  trailAlphaBase: 0.12,
  trailAlphaOnset: 0.35,

  // ── HUD ──
  hudUpdateInterval: 6,       // update HUD every N frames
};
