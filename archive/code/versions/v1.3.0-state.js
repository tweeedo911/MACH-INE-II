// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Narrative State
//  5 derived values from audio + MIDI data.
//  This module does NOT make scene decisions —
//  it only prepares data for the future director (v0.3.0).
// ═══════════════════════════════════════════════════════════

import { audio } from './audio.js';
import { midi } from './midi.js';

// ── Public state ──
export const state = {
  intensity: 0,       // 0-1, from rms + onset density + note density
  rhythmicity: 0,     // 0-1, from onset regularity
  brightness: 0,      // 0-1, from spectral centroid
  trajectory: 0,      // -1/0/+1, from audio.trajectory
  stereoWidth: 0,     // 0-1, from 1 - stereoCorrelation
};

// ── Internal: onset regularity tracking ──
let recentOnsets = [];         // timestamps of recent onsets
const REGULARITY_WINDOW = 3;  // seconds
const MAX_REGULARITY_ONSETS = 60;

// Smoothing factor for EMA (lower = faster response)
const SMOOTH = 0.65;

// ── Per-frame update ──
export function updateState() {
  const now = performance.now() / 1000;

  // ── Track onset timestamps ──
  if (audio.onset) {
    recentOnsets.push(now);
  }
  // Prune old onsets
  const cutoff = now - REGULARITY_WINDOW;
  while (recentOnsets.length > 0 && recentOnsets[0] < cutoff) {
    recentOnsets.shift();
  }
  if (recentOnsets.length > MAX_REGULARITY_ONSETS) {
    recentOnsets = recentOnsets.slice(-MAX_REGULARITY_ONSETS);
  }

  // ── Intensity ──
  // Combine RMS, onset density, and MIDI note density
  const onsetDensity = recentOnsets.length / REGULARITY_WINDOW; // onsets per second
  const normalizedOnsetDensity = Math.min(1, onsetDensity / 8); // ~8 onsets/sec = max
  const normalizedNoteDensity = Math.min(1, midi.noteDensity / 10); // ~10 notes/sec = max

  const rawIntensity = audio.rms * 0.5
    + normalizedOnsetDensity * 0.3
    + normalizedNoteDensity * 0.2;
  state.intensity = state.intensity * SMOOTH + rawIntensity * (1 - SMOOTH);

  // ── Rhythmicity ──
  // Regularity of onset intervals: low variance = high rhythmicity
  let rawRhythmicity = 0;
  if (recentOnsets.length >= 3) {
    const intervals = [];
    for (let i = 1; i < recentOnsets.length; i++) {
      intervals.push(recentOnsets[i] - recentOnsets[i - 1]);
    }
    const mean = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const variance = intervals.reduce((s, v) => s + (v - mean) ** 2, 0) / intervals.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 1; // coefficient of variation
    // cv near 0 = very regular, cv > 1 = very irregular
    rawRhythmicity = Math.max(0, 1 - cv);
  }
  state.rhythmicity = state.rhythmicity * SMOOTH + rawRhythmicity * (1 - SMOOTH);

  // ── Brightness ──
  state.brightness = state.brightness * SMOOTH + audio.centroid * (1 - SMOOTH);

  // ── Trajectory ──
  // Direct pass-through (already discrete -1/0/+1)
  state.trajectory = audio.trajectory;

  // ── Stereo Width ──
  const rawWidth = 1 - audio.stereoCorrelation;
  state.stereoWidth = state.stereoWidth * SMOOTH + rawWidth * (1 - SMOOTH);
}
