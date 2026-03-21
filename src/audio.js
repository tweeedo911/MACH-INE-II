// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Stereo Audio Engine
//  Web Audio API: ChannelSplitter + 2x AnalyserNode
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';

// ── Public state (read by other modules every frame) ──
export const audio = {
  rmsL: 0,
  rmsR: 0,
  rms: 0,

  bands: {
    sub:  { L: 0, R: 0 },
    low:  { L: 0, R: 0 },
    mid:  { L: 0, R: 0 },
    high: { L: 0, R: 0 },
    air:  { L: 0, R: 0 },
  },

  centroid: 0,
  flux: 0,
  onset: false,

  stereoCorrelation: 0,
  stereoDiff: 0,

  trajectory: 0,

  bpm: 0,

  fftL: null,  // Uint8Array, set after init
  fftR: null,  // Uint8Array, set after init
};

// ── Internal state ──
let audioCtx;
let analyserL, analyserR;
let fftL, fftR;
let prevFftL;          // previous frame FFT for spectral flux
let binCount;
let nyquist;

// Spectral flux moving average
let fluxHistory = [];
let fluxHistorySum = 0;

// RMS ring buffer for trajectory
let rmsRing = [];
let rmsRingHead = 0;
let rmsRingSize = 0;

// Onset timestamps for BPM
let onsetTimestamps = [];

// Smoothed stereo correlation
let smoothedCorrelation = 0;

// ── Init ──
export async function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  CFG.sampleRate = audioCtx.sampleRate;
  nyquist = audioCtx.sampleRate / 2;

  // Request stereo input from BlackHole
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 2,
    },
    video: false,
  });

  const src = audioCtx.createMediaStreamSource(stream);

  // Split stereo into L and R
  const splitter = audioCtx.createChannelSplitter(2);
  src.connect(splitter);

  // Left analyser
  analyserL = audioCtx.createAnalyser();
  analyserL.fftSize = CFG.fftSize;
  analyserL.smoothingTimeConstant = CFG.smoothing;
  splitter.connect(analyserL, 0);

  // Right analyser
  analyserR = audioCtx.createAnalyser();
  analyserR.fftSize = CFG.fftSize;
  analyserR.smoothingTimeConstant = CFG.smoothing;
  splitter.connect(analyserR, 1);

  binCount = analyserL.frequencyBinCount;

  // Allocate buffers
  fftL = new Uint8Array(binCount);
  fftR = new Uint8Array(binCount);
  prevFftL = new Float32Array(binCount);

  audio.fftL = fftL;
  audio.fftR = fftR;

  // RMS ring buffer size: ~3 seconds at 60fps
  rmsRingSize = Math.ceil(CFG.trajectoryWindowSec * 60);
  rmsRing = new Float32Array(rmsRingSize);
  rmsRingHead = 0;

  return audioCtx;
}

// ── Per-frame update (called from render loop) ──
export function updateAudio() {
  if (!analyserL) return;

  analyserL.getByteFrequencyData(fftL);
  analyserR.getByteFrequencyData(fftR);

  computeRMS();
  computeBands();
  computeCentroid();
  computeFluxAndOnset();
  computeStereo();
  computeTrajectory();
  computeBPM();
}

// ── Expose audioCtx for sample rate etc. ──
export function getAudioContext() {
  return audioCtx;
}

export function getBinCount() {
  return binCount;
}

// ═══════════════════════════════════════
//  Internal computations
// ═══════════════════════════════════════

function computeRMS() {
  let sumL = 0, sumR = 0;
  for (let i = 0; i < binCount; i++) {
    const l = fftL[i] / 255;
    const r = fftR[i] / 255;
    sumL += l * l;
    sumR += r * r;
  }
  audio.rmsL = Math.sqrt(sumL / binCount);
  audio.rmsR = Math.sqrt(sumR / binCount);
  audio.rms = (audio.rmsL + audio.rmsR) / 2;

  // Push to trajectory ring buffer
  rmsRing[rmsRingHead] = audio.rms;
  rmsRingHead = (rmsRingHead + 1) % rmsRingSize;
}

function computeBands() {
  const binHz = nyquist / binCount;

  for (const bandName of Object.keys(CFG.bandRanges)) {
    const [lo, hi] = CFG.bandRanges[bandName];
    const binLo = Math.max(0, Math.floor(lo / binHz));
    const binHi = Math.min(binCount - 1, Math.ceil(hi / binHz));
    const count = binHi - binLo + 1;

    if (count <= 0) {
      audio.bands[bandName].L = 0;
      audio.bands[bandName].R = 0;
      continue;
    }

    let sumL = 0, sumR = 0;
    for (let i = binLo; i <= binHi; i++) {
      sumL += fftL[i] / 255;
      sumR += fftR[i] / 255;
    }
    audio.bands[bandName].L = sumL / count;
    audio.bands[bandName].R = sumR / count;
  }
}

function computeCentroid() {
  // Spectral centroid on L channel (representative)
  let weightedSum = 0;
  let ampSum = 0;
  const binHz = nyquist / binCount;

  for (let i = 0; i < binCount; i++) {
    const amp = fftL[i] / 255;
    const freq = i * binHz;
    weightedSum += freq * amp;
    ampSum += amp;
  }

  audio.centroid = ampSum > 0 ? (weightedSum / ampSum) / nyquist : 0;
}

function computeFluxAndOnset() {
  // Spectral flux: sum of positive differences between current and previous FFT
  let flux = 0;
  for (let i = 0; i < binCount; i++) {
    const current = fftL[i] / 255;
    const diff = current - prevFftL[i];
    if (diff > 0) flux += diff;
    prevFftL[i] = current;
  }
  flux /= binCount;

  audio.flux = flux;

  // Moving average for adaptive threshold
  fluxHistory.push(flux);
  fluxHistorySum += flux;
  if (fluxHistory.length > CFG.fluxSmoothingWindow) {
    fluxHistorySum -= fluxHistory.shift();
  }
  const fluxAvg = fluxHistorySum / fluxHistory.length;

  // Onset detection
  audio.onset = flux > Math.max(fluxAvg * CFG.fluxOnsetMultiplier, CFG.fluxMinThreshold);
}

function computeStereo() {
  // Pearson correlation between L and R frequency data
  let sumLR = 0, sumLL = 0, sumRR = 0;
  for (let i = 0; i < binCount; i++) {
    const l = fftL[i] / 255;
    const r = fftR[i] / 255;
    sumLR += l * r;
    sumLL += l * l;
    sumRR += r * r;
  }
  const denom = Math.sqrt(sumLL * sumRR);
  const rawCorrelation = denom > 0 ? sumLR / denom : 1;

  // Smooth the correlation
  smoothedCorrelation = smoothedCorrelation * CFG.stereoCorrelationSmoothing
    + rawCorrelation * (1 - CFG.stereoCorrelationSmoothing);
  audio.stereoCorrelation = smoothedCorrelation;

  // Stereo energy difference: |rmsL - rmsR| / max(rmsL, rmsR)
  const maxRms = Math.max(audio.rmsL, audio.rmsR);
  audio.stereoDiff = maxRms > 0 ? Math.abs(audio.rmsL - audio.rmsR) / maxRms : 0;
}

function computeTrajectory() {
  // Compare first half vs second half of RMS ring buffer
  const half = Math.floor(rmsRingSize / 2);
  if (half === 0) return;

  let sumFirst = 0, sumSecond = 0;
  for (let i = 0; i < half; i++) {
    // First half (older samples)
    const idxFirst = (rmsRingHead + i) % rmsRingSize;
    sumFirst += rmsRing[idxFirst];
    // Second half (newer samples)
    const idxSecond = (rmsRingHead + half + i) % rmsRingSize;
    sumSecond += rmsRing[idxSecond];
  }

  const avgFirst = sumFirst / half;
  const avgSecond = sumSecond / half;
  const diff = avgSecond - avgFirst;

  if (diff > CFG.trajectoryThreshold) {
    audio.trajectory = 1;  // rising
  } else if (diff < -CFG.trajectoryThreshold) {
    audio.trajectory = -1; // falling
  } else {
    audio.trajectory = 0;  // stable
  }
}

function computeBPM() {
  if (!audio.onset) return;

  const now = performance.now() / 1000; // seconds

  // Skip if too close to last onset
  if (onsetTimestamps.length > 0) {
    const lastOnset = onsetTimestamps[onsetTimestamps.length - 1];
    if (now - lastOnset < CFG.bpmMinInterval) return;
  }

  onsetTimestamps.push(now);

  // Keep only recent onsets
  if (onsetTimestamps.length > CFG.bpmMaxOnsets) {
    onsetTimestamps.shift();
  }

  if (onsetTimestamps.length < CFG.bpmMinOnsets) {
    audio.bpm = 0;
    return;
  }

  // Compute intervals
  const intervals = [];
  for (let i = 1; i < onsetTimestamps.length; i++) {
    const interval = onsetTimestamps[i] - onsetTimestamps[i - 1];
    if (interval >= CFG.bpmMinInterval && interval <= CFG.bpmMaxInterval) {
      intervals.push(interval);
    }
  }

  if (intervals.length < CFG.bpmMinOnsets - 1) {
    audio.bpm = 0;
    return;
  }

  // Median interval
  intervals.sort((a, b) => a - b);
  const medianIdx = Math.floor(intervals.length / 2);
  const medianInterval = intervals.length % 2 === 0
    ? (intervals[medianIdx - 1] + intervals[medianIdx]) / 2
    : intervals[medianIdx];

  audio.bpm = Math.round(60 / medianInterval);
}
