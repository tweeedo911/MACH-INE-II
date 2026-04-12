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
import * as campo from './campo.js';
import * as geo from './geo.js';

// ── Composition modules ──
import * as compLiminale from './comp-liminale.js';
import * as compLinee from './comp-linee.js';
import * as compSolco from './comp-solco.js';
import * as compNegativo from './comp-negativo.js';
import * as compGriglia from './comp-griglia.js';
import * as compTreno from './comp-treno.js';

const COMP_MAP = {
  NEBBIA:   compLiminale,
  TESSUTO:  compLinee,
  SOLCO:    compSolco,
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

// ── Offscreen buffer for ghost/fossil overlay (Uint32Array pixel manipulation) ──
let _ghostCanvas = null;
let _ghostCtx    = null;

function _ensureGhostBuffer(W, H) {
  if (!_ghostCanvas || _ghostCanvas.width !== W || _ghostCanvas.height !== H) {
    _ghostCanvas = document.createElement('canvas');
    _ghostCanvas.width = W;
    _ghostCanvas.height = H;
    _ghostCtx = _ghostCanvas.getContext('2d');
  }
}

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
  campo.initCampo();
  // geo.js viene inizializzato lazy al primo renderField (serve W/H canvas)
}

// Init geo una sola volta, appena il canvas ha dimensioni note
let _geoInitialized = false;
let _geoActiveTrack = null;    // tracker locale per geo (non condiviso con _activeTrack)
let _campoActiveTrack = null;  // tracker locale per campo (idem)
function _ensureGeoInit(W, H) {
  if (_geoInitialized) {
    geo.resizeGeo(W, H);
    return;
  }
  geo.initGeo(W, H);
  _geoInitialized = true;
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
  // Campo materiale — forward note raw quando attivo (centralizza tutte le note interne)
  if (CFG.VISUAL?.campo?.useCampo) {
    campo.feedNote(ch, Math.round(noteNorm * 127), Math.round(velNorm * 127));
  }
  // Sistema Geometrico — stesso forwarding (mutuamente esclusivo via flag)
  if (CFG.VISUAL?.geo?.useGeo) {
    geo.feedNote(ch, Math.round(noteNorm * 127), Math.round(velNorm * 127));
  }

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
  const track = worldState.track;

  // ── Sistema Geometrico (paradigma sperimentale, Shift+G) ──
  // Mutuamente esclusivo con comp-* e campo. Bypassa tutto il resto.
  if (CFG.VISUAL?.geo?.useGeo) {
    _ensureGeoInit(W, H);
    if (track !== _geoActiveTrack) {
      geo.setBiome(track);
      _geoActiveTrack = track;
    }
    geo.update(envData.dt || 0.016);
    geo.render(ctx);
    return;
  }

  // ── Campo Materiale path (paradigma sperimentale) ──
  // Mutuamente esclusivo con comp-* classiche: se attivo, bypassa tutto il resto.
  // Toggle runtime con tasto M in render.js.
  if (CFG.VISUAL?.campo?.useCampo) {
    if (track !== _campoActiveTrack) {
      campo.setBiome(track);
      _campoActiveTrack = track;
    }
    campo.updateCampo(envData.dt || 0.016, worldState.audioEnergy || 0);
    campo.renderCampo(ctx, W, H);
    return;
  }

  const env = buildEnv({
    ...envData,
    midiTrail,
    onsetWaves,
  });

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
      const bgRgb       = toolkit.hexToRgb(worldState.palette.bg);
      const resHex      = worldState.palette.residual;
      const residualRgb = resHex ? toolkit.hexToRgb(resHex)
                                 : toolkit.hexToRgb(worldState.palette.dot);

      // Pixel manipulation diretta — zero fillRect, una sola drawImage finale
      _ensureGhostBuffer(W, H);
      _ghostCtx.clearRect(0, 0, W, H);
      const imgData = _ghostCtx.createImageData(W, H);  // cheap malloc, no GPU readback
      const buf32   = new Uint32Array(imgData.data.buffer);

      for (const e of events) {
        if (e.state < STATE_GHOST) continue;  // skip newborn + stable

        // Curva aging quadratica — t²: ghost≈0.25-0.64, fossil≈0.64-0.90, dead=1.0
        const t       = Math.min(e.age / e.tDead, 1);
        const t2      = t * t;
        const dotSz   = Math.max(2, Math.round(toolkit.lerp(2, 14, t2)));
        const density = toolkit.lerp(0.85, 0.08, t2);
        const radius  = dotSz * 8;

        const px = e.nx * W;
        const py = e.ny * H;

        // spawnColor → residual lungo lifecycle; fossil → blend addizionale verso bg
        const spawnRgb    = e.spawnColor || [255, 255, 255];
        const baseRgb     = toolkit.lerpColor(spawnRgb, residualRgb, toolkit.lerp(0, 0.75, t2));
        const fossilBlend = e.state === STATE_FOSSIL ? 0.35 : 0;
        const rgb         = toolkit.lerpColor(baseRgb, bgRgb, fossilBlend);
        const rr = rgb[0] | 0, gg = rgb[1] | 0, bb = rgb[2] | 0;
        // little-endian RGBA → Uint32: 0xFF_BB_GG_RR
        const pixel32 = (0xFF << 24) | (bb << 16) | (gg << 8) | rr;

        const c0 = Math.max(0, Math.floor((px - radius) / dotSz));
        const c1 = Math.min(Math.floor(W / dotSz), Math.floor((px + radius) / dotSz));
        const r0 = Math.max(0, Math.floor((py - radius) / dotSz));
        const r1 = Math.min(Math.floor(H / dotSz), Math.floor((py + radius) / dotSz));

        for (let c = c0; c <= c1; c++) {
          for (let r = r0; r <= r1; r++) {
            if (!toolkit.bayerTest(c, r, density)) continue;
            const x0 = c * dotSz, y0 = r * dotSz;
            const x1 = Math.min(x0 + dotSz, W);
            const y1 = Math.min(y0 + dotSz, H);
            for (let py2 = y0; py2 < y1; py2++) {
              const rowOff = py2 * W;
              for (let px2 = x0; px2 < x1; px2++) {
                buf32[rowOff + px2] = pixel32;
              }
            }
          }
        }
      }

      _ghostCtx.putImageData(imgData, 0, 0);
      ctx.drawImage(_ghostCanvas, 0, 0);
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
