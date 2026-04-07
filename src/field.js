// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Visual Dispatcher
//  Routes rendering to the active composition module.
//  Handles crossfade during track transitions.
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { worldState } from './world-state.js';
import * as toolkit from './visual-toolkit.js';
import { Sediment, shouldGlitch, clamp } from './visual-toolkit.js';
import { firma } from './firma.js';
import { getEvents, STATE_GHOST, STATE_FOSSIL } from './event-register.js';

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
let _fadeTimer = 0;           // elapsed seconds in current crossfade

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
// v3.4.3: firma.gelo freeza l'intero flusso visivo, firma.convergenza
// attira midiTrail + onset waves verso il centro (gesto gravitazionale).
export function updateWaves(dt) {
  // GELO — freeze totale del flusso visivo (nessuna evoluzione, nessun decay)
  if (firma.gelo) return;

  // CONVERGENZA — attrazione verso il centro canvas
  const conv = firma.convergenza;
  const convPull = conv ? dt * 0.3 : 0;

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
    if (conv) {
      // attrazione verso centro in coord normalizzate (0..1)
      n.x += (0.5 - n.x) * convPull;
      n.y += (0.5 - n.y) * convPull;
    }
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

      if (_activeComp) {
        _outgoingComp = _activeComp;
        _fadeTimer = 0;
        _transitionAlpha = 0;
      }
      _activeComp = newComp;
      _activeTrack = track;
      _activeComp.init(env);
    }
  }

  // Handle crossfade transition — self-managed timer, ease-in-out cubic
  if (_outgoingComp) {
    _fadeTimer += envData.dt || 0.016;
    const _t = Math.min(1, _fadeTimer / CFG.VISUAL.trackFadeDuration);
    _transitionAlpha = _t < 0.5 ? 4*_t*_t*_t : 1 - Math.pow(-2*_t + 2, 3) / 2;
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

  // ── Ghost/fossil overlay — eventi persistenti da event-register ──
  // Renderizza solo STATE_GHOST e STATE_FOSSIL come dot Bayer desaturati.
  // STATE_NEWBORN e STATE_STABLE sono già coperti dal midiTrail nelle comp-*.
  // firma.gelo: già gestito in updateEvents (aging frozen → eventi restano nel loro stato).
  // firma.convergenza: già gestito in updateEvents (e.nx/ny attratti verso centro).
  if (_activeComp && W > 0 && H > 0) {
    const events = getEvents();
    if (events.length > 0) {
      const gcfg   = CFG.VISUAL.ghostOverlay;
      const dotSz  = gcfg.dotSize;
      const bgRgb  = toolkit.hexToRgb(worldState.palette.bg);
      const dotRgb = toolkit.hexToRgb(worldState.palette.dot);

      for (const e of events) {
        if (e.state < STATE_GHOST) continue;  // skip newborn + stable

        const isGhost = e.state === STATE_GHOST;
        const density = isGhost ? gcfg.ghostDensity  : gcfg.fossilDensity;
        const blend   = isGhost ? gcfg.ghostBlend    : gcfg.fossilBlend;

        const px  = e.nx * W;
        const py  = e.ny * H;
        const col = Math.floor(px / dotSz);
        const row = Math.floor(py / dotSz);

        if (!toolkit.bayerTest(col, row, density)) continue;

        const rgb = toolkit.lerpColor(dotRgb, bgRgb, blend);
        ctx.fillStyle = toolkit.rgbString(rgb[0] | 0, rgb[1] | 0, rgb[2] | 0);
        ctx.fillRect(px - dotSz * 0.5, py - dotSz * 0.5, dotSz, dotSz);
      }
    }
  }

  // Continuous accumulation — light per-frame deposit into sediment (palimpsesto)
  // Captures current comp frame AFTER ghost/fossil overlay → ghost dots finiscono nel sediment.
  if (_activeComp && W > 0 && H > 0) {
    _sharedSediment._ensure(W, H);
    const sCtx = _sharedSediment.getCtx();
    sCtx.globalAlpha = CFG.VISUAL.sediment.accumAlpha;
    sCtx.drawImage(ctx.canvas, 0, 0);
    sCtx.globalAlpha = 1;
  }

  // Shared sediment: composite scene memory OVER the composition
  // Decay lento (0.9997 @60fps) → half-life ~38s, memoria visibile ~2min per traccia
  _sharedSediment.decay(W, H, CFG.VISUAL.sediment.decayRate);
  ctx.globalAlpha = CFG.VISUAL.sediment.compositeAlpha;
  _sharedSediment.composite(ctx);
  ctx.globalAlpha = 1;

  // ── Micro-glitch layer — rare global visual interruptions ──
  // ~2% per frame in rottura, ~0.3% elsewhere
  const audioEnergy = worldState.audioEnergy || 0;
  const isRottura = worldState.phase === 'rottura';
  const gt = envData.globalTime || 0;
  const rhythmicity = (envData.state && envData.state.rhythmicity) || 0;

  if (rhythmicity > CFG.VISUAL.glitch.rhythmThreshold &&
      shouldGlitch(audioEnergy * rhythmicity * CFG.VISUAL.glitch.intensityMul, isRottura, gt)) {
    // Glitch grammar: SUBTRACTION only — tear/clear pixels, never add flashes.
    // 4 modes: strip, scan-tear, shift, column. Removed: colored bars, Bayer flip.
    const mode = Math.floor(gt * 17.3) % 4;
    switch (mode) {
      case 0: {
        // Strip removal — clear horizontal band of 8-16 rows for 1 frame
        const stripH = 8 + Math.floor(Math.random() * 8);
        const stripY = Math.random() * (H - stripH);
        ctx.clearRect(0, stripY, W, stripH);
        break;
      }
      case 1: {
        // Scan line tear — clear 1-3 thin rows (subtractive, no color added)
        const count = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
          const y = Math.random() * H;
          ctx.clearRect(0, y, W, 1 + Math.floor(Math.random() * 2));
        }
        break;
      }
      case 2: {
        // Canvas shift — brief horizontal displacement (2-8px)
        // GPU-only self-copy: zero allocation, no GPU readback
        const shift = Math.floor((Math.random() - 0.5) * 12);
        if (shift !== 0) {
          ctx.drawImage(ctx.canvas, shift, 0);
        }
        break;
      }
      case 3: {
        // Column removal — clear vertical strip of 4-12 cols for 1 frame
        const stripW = 4 + Math.floor(Math.random() * 8);
        const stripX = Math.random() * (W - stripW);
        ctx.clearRect(stripX, 0, stripW, H);
        break;
      }
    }
  }
}
