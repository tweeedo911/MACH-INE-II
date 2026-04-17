// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Orchestra Output (SuperCollider bridge)
//  Emette CC di stato su CH15 verso la SC orchestra esterna.
//  Zero-weight: se CFG.ORCHESTRA.enabled è false, tutto no-op.
//
//  Pipeline:
//    director3 → sendOrchestraTrack / sendOrchestraPhase
//      → sendMIDICC(CH15, CC20/CC21, value)
//      → IAC Driver → SuperCollider → audio su BlackHole 16ch → Ableton
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { sendMIDICC } from './midi.js';
import { TRACK_ORDER } from './tracks.js';

const PHASE_ORDER = ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'];

const CC_BIOME   = 20;
const CC_PHASE   = 21;
const CC_ENERGY  = 22;
const CC_RUPTURE = 23;

let _lastBiome   = -1;
let _lastPhase   = -1;
let _lastRupture = -1;

function _enabled() {
  return !!(CFG.ORCHESTRA && CFG.ORCHESTRA.enabled);
}

function _ch() {
  return (CFG.ORCHESTRA && CFG.ORCHESTRA.controlChannel) ?? 15;
}

export function sendOrchestraTrack(trackName) {
  if (!_enabled()) return;
  const idx = TRACK_ORDER.indexOf(trackName);
  if (idx < 0 || idx === _lastBiome) return;
  _lastBiome = idx;
  // 7 biomi → spread su 0..127
  sendMIDICC(_ch(), CC_BIOME, Math.round((idx * 127) / 6));
}

export function sendOrchestraPhase(phaseName) {
  if (!_enabled()) return;
  const idx = PHASE_ORDER.indexOf(phaseName);
  if (idx < 0 || idx === _lastPhase) return;
  _lastPhase = idx;
  // 5 fasi → spread su 0..127
  sendMIDICC(_ch(), CC_PHASE, Math.round((idx * 127) / 4));
}

export function sendOrchestraEnergy(value01) {
  if (!_enabled()) return;
  const v = Math.max(0, Math.min(127, Math.round(value01 * 127)));
  sendMIDICC(_ch(), CC_ENERGY, v);
}

export function sendOrchestraRupture(stageIdx) {
  if (!_enabled()) return;
  const idx = Math.max(0, Math.min(3, stageIdx | 0));
  if (idx === _lastRupture) return;
  _lastRupture = idx;
  sendMIDICC(_ch(), CC_RUPTURE, Math.round((idx * 127) / 3));
}

export function orchestraReset() {
  _lastBiome = -1;
  _lastPhase = -1;
  _lastRupture = -1;
}
