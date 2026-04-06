// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Visual Dispatcher
//  Routes rendering to the active composition module.
//  Handles crossfade during track transitions.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import * as toolkit from './visual-toolkit.js';

// ── Composition modules ──
import * as compLiminale from './comp-liminale.js';
import * as compLinee from './comp-linee.js';
import * as compQuadrati from './comp-quadrati.js';
import * as compNegativo from './comp-negativo.js';
import * as compGriglia from './comp-griglia.js';
import * as compTreno from './comp-treno.js';

const COMP_MAP = {
  NEBBIA:   compLiminale,
  TESSUTO:  compLinee,
  SOLCO:    compQuadrati,
  RESPIRO:  compNegativo,
  MACCHINA: compGriglia,
  TEMPESTA: compTreno,
  RITORNO:  compLiminale,
};

// ── State ──
let _activeComp = null;       // current composition module
let _activeTrack = null;      // current track name
let _outgoingComp = null;     // composition being faded out during transition
let _transitionAlpha = 0;     // 0 = all outgoing, 1 = all incoming

// ── Offscreen buffer for crossfade ──
let _offCanvas = null;
let _offCtx = null;

function ensureOffscreen(W, H) {
  if (!_offCanvas || _offCanvas.width !== W || _offCanvas.height !== H) {
    _offCanvas = document.createElement('canvas');
    _offCanvas.width = W;
    _offCanvas.height = H;
    _offCtx = _offCanvas.getContext('2d');
  }
}

// ── Build env object for composition modules ──
function buildEnv(extra) {
  return {
    worldState,
    midiTrail: extra.midiTrail || [],
    onsetWaves: extra.onsetWaves || [],
    audio: extra.audio,
    midi: extra.midi,
    state: extra.state,
    dt: extra.dt,
    globalTime: extra.globalTime,
    toolkit,
  };
}

// ── Init: called when system boots ──
export function initField() {
  // Will be initialized on first renderField call
}

// ── Onset waves (kept here for render.js compatibility) ──
export let onsetWaves = [];
export function addOnsetWave(cx, cy, W, H) {
  onsetWaves.push({ cx: cx * W, cy: cy * H, radius: 0, strength: 1 });
}

// ── MIDI trail (kept here for render.js compatibility) ──
export let midiTrail = [];
const MAX_TRAIL = 80;
const CH_MAX = [4, 2, 3, 7, 9, 14, 10, 5];

export function addMidiNote(ch, noteNorm, velNorm) {
  // Floor for voice/lead visibility
  const visVel = (ch === 5 || ch === 6) ? Math.max(velNorm, 0.75)
              : (ch >= 2 && ch <= 4)   ? Math.max(velNorm, 0.3)
              : velNorm;

  // Per-channel eviction
  const chMax = CH_MAX[ch] ?? 6;
  let chCount = 0, oldestIdx = -1, oldestTime = -1;
  for (let i = 0; i < midiTrail.length; i++) {
    if (midiTrail[i].ch === ch) {
      chCount++;
      if (midiTrail[i].time > oldestTime) { oldestTime = midiTrail[i].time; oldestIdx = i; }
    }
  }
  if (chCount >= chMax && oldestIdx >= 0) {
    midiTrail[oldestIdx] = midiTrail[midiTrail.length - 1];
    midiTrail.length--;
  }

  midiTrail.push({
    ch, note: noteNorm, vel: visVel,
    x: noteNorm,                        // normalized 0-1 (comp decides mapping)
    y: 1 - noteNorm,                    // default: pitch → vertical
    alpha: 1,
    time: 0,
    decay: 0.97,
  });

  if (midiTrail.length > MAX_TRAIL) midiTrail.shift();
}

// ── Update waves and trail decay ──
export function updateWaves(dt) {
  for (let i = onsetWaves.length - 1; i >= 0; i--) {
    const w = onsetWaves[i];
    w.radius += 300 * dt;
    w.strength *= 0.96;
    if (w.strength < 0.01) {
      onsetWaves[i] = onsetWaves[onsetWaves.length - 1];
      onsetWaves.length--;
    }
  }
  for (let i = midiTrail.length - 1; i >= 0; i--) {
    const n = midiTrail[i];
    n.time += dt;
    n.alpha *= n.decay;
    if (n.alpha < 0.01) {
      midiTrail[i] = midiTrail[midiTrail.length - 1];
      midiTrail.length--;
    }
  }
}

// ── Main render entry point ──
export function renderField(ctx, W, H, envData) {
  const env = buildEnv({
    ...envData,
    midiTrail,
    onsetWaves,
  });

  const track = worldState.track;

  // Detect track change → switch composition
  if (track !== _activeTrack) {
    const newComp = COMP_MAP[track];
    if (newComp) {
      // Start transition if we have an outgoing composition
      if (_activeComp && worldState.transition) {
        _outgoingComp = _activeComp;
        _transitionAlpha = 0;
      } else if (_activeComp) {
        _activeComp.destroy();
      }
      _activeComp = newComp;
      _activeTrack = track;
      _activeComp.init(env);
    }
  }

  // Handle crossfade transition
  if (_outgoingComp && worldState.transition) {
    _transitionAlpha = worldState.transition.progress || 0;
    ensureOffscreen(W, H);

    // Draw outgoing to offscreen
    _offCtx.clearRect(0, 0, W, H);
    _outgoingComp.render(_offCtx, W, H, env);

    // Draw incoming to main canvas
    _activeComp.render(ctx, W, H, env);

    // Composite outgoing with fading alpha
    ctx.save();
    ctx.globalAlpha = 1 - _transitionAlpha;
    ctx.drawImage(_offCanvas, 0, 0);
    ctx.restore();

    // Transition complete
    if (_transitionAlpha >= 1) {
      _outgoingComp.destroy();
      _outgoingComp = null;
    }
  } else if (_activeComp) {
    // Normal render — single composition
    _activeComp.render(ctx, W, H, env);
  }
}
