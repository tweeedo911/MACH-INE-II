// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Visual Dispatcher
//  Routes rendering to the active composition module.
//  Handles crossfade during track transitions.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import * as toolkit from './visual-toolkit.js';
import { Sediment, shouldGlitch, hexToRgb, rgbString, colorFlash, clamp } from './visual-toolkit.js';

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

// ── Shared sediment — persists across track changes (scene memory) ──
let _sharedSediment = new Sediment();

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
    sharedSediment: _sharedSediment,  // scene memory — persists across tracks
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
      // Capture current frame into shared sediment before switching (scene memory)
      if (_activeComp && W > 0 && H > 0) {
        _sharedSediment._ensure(W, H);
        const sCtx = _sharedSediment.getCtx();
        sCtx.globalAlpha = 0.7;
        sCtx.drawImage(ctx.canvas, 0, 0);
        sCtx.globalAlpha = 1;
      }

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

  // Shared sediment: composite scene memory OVER the composition
  // Decays slowly (0.97) — old scenes ghost under the new one for ~3-4 seconds
  _sharedSediment.decay(W, H, 0.97);
  ctx.globalAlpha = 0.35;
  _sharedSediment.composite(ctx);
  ctx.globalAlpha = 1;

  // ── Micro-glitch layer — rare global visual interruptions ──
  // ~2% per frame in rottura, ~0.3% elsewhere
  const audioEnergy = worldState.audioEnergy || 0;
  const isRottura = worldState.phase === 'rottura';
  const gt = envData.globalTime || 0;

  if (shouldGlitch(audioEnergy + 0.3, isRottura, gt)) {
    // Pick a random glitch type
    const mode = Math.floor(gt * 17.3) % 5;
    switch (mode) {
      case 0: {
        // Brief full-screen white/black flash (1 frame)
        const flashAlpha = 0.15 + audioEnergy * 0.25;
        ctx.globalAlpha = flashAlpha;
        ctx.fillStyle = isRottura ? '#FFFFFF' : '#000000';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        break;
      }
      case 1: {
        // Horizontal scan line glitch — draw a few random horizontal bars
        const barCount = 1 + Math.floor(audioEnergy * 4);
        const bgRgb = hexToRgb(worldState.palette.bg);
        const flashRgb = colorFlash(bgRgb, 0.8, gt);
        ctx.fillStyle = rgbString(
          clamp(flashRgb[0], 0, 255),
          clamp(flashRgb[1], 0, 255),
          clamp(flashRgb[2], 0, 255),
          0.4
        );
        for (let i = 0; i < barCount; i++) {
          const y = Math.random() * H;
          const h = 1 + Math.random() * 4;
          ctx.fillRect(0, y, W, h);
        }
        break;
      }
      case 2: {
        // Canvas shift — brief horizontal displacement (2-8px)
        const shift = Math.floor((Math.random() - 0.5) * 12);
        if (shift !== 0) {
          const imgData = ctx.getImageData(0, 0, W, H);
          ctx.putImageData(imgData, shift, 0);
        }
        break;
      }
      // cases 3,4: no-op — gives glitch breathing room (not every trigger fires)
    }
  }
}
