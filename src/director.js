// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Director (Scenes + Arc + Mutations + Camera)
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { audio } from './audio.js';
import { midi } from './midi.js';
import { dna, PRIM_TYPES } from './dna.js';
import { entities } from './generations.js';
import { startInvertDissolve, setChromaticShift, setPalette, setComposerClimax } from './colors.js';
import { on as onDirectorEvent } from './director-events.js';
import { checkPatternChange, getEngine } from './midi-patterns.js';
import { getEnginePhase } from './presence-multiplier.js';
import { macroState } from './macro-composer.js';

// ═══════════════════════════════════════════════════════════
//  SCENES — Coherent aesthetic states
// ═══════════════════════════════════════════════════════════

const SCENES = [
  {
    name: 'BAYER_CLASSIC',
    palette: 'default',
    densityMul: 1.0,
    dotSize: 6,
    midiScale: 1.0,
    invertBase: false,
    composition: 'MONDRIAN_A',
  },
  {
    name: 'COLORED_GROUND',
    palette: 'amber',
    densityMul: 0.8,
    dotSize: 10,
    midiScale: 1.3,
    invertBase: true,
    composition: 'MONDRIAN_B',
  },
  {
    name: 'SPARSE',
    palette: 'default',
    densityMul: 0.08,       // was 0.2 — quasi vuoto, MIDI domina
    dotSize: 3,
    midiScale: 2.5,
    invertBase: false,
    composition: 'ISLANDS',
  },
  {
    name: 'DENSE',
    palette: 'warm',
    densityMul: 2.0,        // was 1.6 — nero dominante
    dotSize: 4,
    midiScale: 0.5,
    invertBase: false,
    composition: 'COLUMNS',
  },
  {
    name: 'MONOCHROME',
    palette: 'bw',
    densityMul: 1.2,
    dotSize: 8,
    midiScale: 1.0,
    invertBase: false,
    composition: 'FRAME',
  },
  {
    name: 'NEGATIVE',
    palette: 'default',
    densityMul: 1.4,        // was 0.9 — pieno invertito = drammatico
    dotSize: 6,
    midiScale: 1.0,
    invertBase: true,
    composition: 'ASYMMETRIC',
  },
  {
    name: 'MONDRIAN',
    palette: 'cold',
    densityMul: 0.5,        // was 0.8 — contrasto dalle composizioni
    dotSize: 8,
    midiScale: 1.5,
    invertBase: false,
    composition: 'MONDRIAN_A',
  },
  {
    name: 'HORIZON',
    palette: 'cyan',
    densityMul: 0.35,       // was 0.6 — arioso, respiro
    dotSize: 6,
    midiScale: 1.8,
    invertBase: false,
    composition: 'HORIZON',
  },
];

// Colored ground palette variants (picked randomly)
const COLORED_PALETTES = ['amber', 'cyan', 'magenta', 'warm', 'cold'];

// ── Engine-aware preferences (visual identity per composer) ──
const ENGINE_PREFS = {
  terreno: {
    sceneBoost: ['BAYER_CLASSIC', 'DENSE', 'COLORED_GROUND'],
    sceneAvoid: ['HORIZON', 'SPARSE'],
    palette: 'amber',
    camera: 'WIDE',
    cameraAllow: new Set(['WIDE', 'DRIFT']),
    // render overrides
    dotSize: 8, densityMul: 1.0, midiScale: 1.2, forceInvert: null,
    // visual identity
    shapeScale: 1.2, trailMax: 48, densityGravity: 0.15,
    onsetWaveSpeed: 800, flickerSpeed: 3.0, midiDensityMul: 0.4, feedbackDecay: 0.94,
  },
  meccanica: {
    sceneBoost: ['MONDRIAN', 'NEGATIVE', 'MONOCHROME'],
    sceneAvoid: [],
    palette: 'steel',
    camera: 'MEDIUM',
    cameraAllow: new Set(['MEDIUM', 'MACRO', 'DRIFT']),
    dotSize: 4, densityMul: 1.3, midiScale: 1.0, forceInvert: null,
    shapeScale: 0.7, trailMax: 40, densityGravity: 0,
    onsetWaveSpeed: 1200, flickerSpeed: 6.0, midiDensityMul: 0.4,
  },
  deriva: {
    sceneBoost: ['HORIZON', 'SPARSE', 'MONOCHROME'],
    sceneAvoid: ['DENSE', 'NEGATIVE'],
    palette: 'default',
    camera: 'DRIFT',
    cameraAllow: new Set(['WIDE', 'DRIFT']),
    dotSize: 5, densityMul: 0.5, midiScale: 1.8, forceInvert: null,
    shapeScale: 2.5, trailMax: 24, densityGravity: 0,
    onsetWaveSpeed: 400, flickerSpeed: 0.5, midiDensityMul: 0.7, feedbackDecay: 0.97,
  },
  vortice: {
    sceneBoost: ['NEGATIVE', 'MONOCHROME', 'SPARSE'],
    sceneAvoid: ['COLORED_GROUND', 'DENSE'],
    palette: 'ikeda',
    camera: 'MEDIUM',
    cameraAllow: new Set(['MEDIUM', 'WIDE']),
    dotSize: 3, densityMul: 1.4, midiScale: 1.5, forceInvert: true,
    shapeScale: 0.5, trailMax: 64, densityGravity: 0,
    onsetWaveSpeed: 1600, flickerSpeed: 8.0, midiDensityMul: 0.5,
  },
  cristallo: {
    sceneBoost: ['SPARSE', 'HORIZON', 'BAYER_CLASSIC'],
    sceneAvoid: ['DENSE', 'NEGATIVE', 'COLORED_GROUND'],
    palette: 'ice',
    camera: 'WIDE',
    cameraAllow: new Set(['WIDE']),
    dotSize: 10, densityMul: 0.4, midiScale: 2.0, forceInvert: null,
    shapeScale: 0.4, trailMax: 48, densityGravity: -0.3,
    onsetWaveSpeed: 200, flickerSpeed: 0.2, midiDensityMul: 0.5, feedbackDecay: 0.95,
  },
  abisso: {
    sceneBoost: ['DENSE', 'MONOCHROME', 'COLORED_GROUND'],
    sceneAvoid: ['SPARSE', 'HORIZON'],
    palette: 'abyssal',
    camera: 'DRIFT',
    cameraAllow: new Set(['WIDE', 'DRIFT']),
    dotSize: 7, densityMul: 1.6, midiScale: 0.8, forceInvert: false,
    shapeScale: 1.8, trailMax: 32, densityGravity: 0.6,
    onsetWaveSpeed: 600, flickerSpeed: 1.0, midiDensityMul: 0.6,
  },
  solco: {
    sceneBoost: ['MONDRIAN', 'BAYER_CLASSIC', 'COLUMNS'],
    sceneAvoid: ['SPARSE', 'HORIZON'],
    palette: 'bw',
    camera: 'MEDIUM',
    cameraAllow: new Set(['MEDIUM', 'WIDE']),
    dotSize: 4, densityMul: 1.2, midiScale: 1.0, forceInvert: null,
    shapeScale: 1.0, trailMax: 56, densityGravity: 0.1,
    onsetWaveSpeed: 1000, flickerSpeed: 4.0, midiDensityMul: 0.5,
  },
};

// ═══════════════════════════════════════════════════════════
//  V3 VISUAL SYSTEM — layer dominance + arc visivo (Phase 4)
// ═══════════════════════════════════════════════════════════

let _v3DominantLayer = null;   // 'harmony' | 'rhythm' | 'melody' | null (= master)
let _v3LastAct       = null;   // 'I' | 'II' | ... | 'V' — per guard transitionToScene
let _v3LerpState     = {       // stato lerp corrente per engineRender
  dotSize: 6, densityMul: 0.3, midiScale: 1.0,
  shapeScale: 1.0, trailMax: 64, densityGravity: 0,
  onsetWaveSpeed: 400, flickerSpeed: 1.0, midiDensityMul: 0.3, feedbackDecay: 0.97,
};

/**
 * Determina quale atto narrativo corrisponde a arcPercent (D-06).
 * Ritorna la chiave dell'atto ('I', 'II', ..., 'V').
 */
function _getV3Act(arcPct) {
  const acts = CFG.VISUAL.acts;
  if (arcPct < acts.II.min)  return 'I';
  if (arcPct < acts.III.min) return 'II';
  if (arcPct < acts.IV.min)  return 'III';
  if (arcPct < acts.V.min)   return 'IV';
  return 'V';
}

/**
 * Determina il layer dominante con isteresi (D-01, D-03).
 * Ritorna 'harmony' | 'rhythm' | 'melody' | null (master).
 */
function _getDominantLayer() {
  const m = macroState;
  const vals = {
    rhythm:  m.rhythmicDensity,
    harmony: m.harmonicColor,
    melody:  Math.max(m.melodicActivity, m.textureDepth),
  };

  const threshold = CFG.VISUAL.dominanceThreshold;
  const hysteresis = CFG.VISUAL.dominanceHysteresis;

  let best = null, bestVal = threshold;
  for (const [k, v] of Object.entries(vals)) {
    if (v > bestVal) { best = k; bestVal = v; }
  }

  // Isteresi: il corrente rimane dominante finche un altro lo supera di hysteresis
  if (_v3DominantLayer && best !== _v3DominantLayer) {
    const currentVal = vals[_v3DominantLayer] || 0;
    if (bestVal - currentVal < hysteresis) {
      return _v3DominantLayer;  // corrente tiene
    }
  }

  return best;
}

/**
 * Core V3 director update — chiamato in V3_MODE al posto di ENGINE_PREFS block.
 * Applica: layer dominance, LAYER_PREFS lerp su engineRender, 5-act scene/palette/camera.
 */
function _updateDirectorV3(dt) {
  const vis = CFG.VISUAL;
  const arcPct = macroState.arcPercent;

  // ── 1. Layer dominante (D-01, D-03) ──
  const dominant = _getDominantLayer();
  _v3DominantLayer = dominant;
  const layerKey = dominant || 'master';
  const prefs = vis.layers[layerKey];

  // ── 2. Lerp engineRender verso LAYER_PREFS blendati con MODE_PARAMS (D-09) ──
  // Ogni modo modale porta la propria atmosfera visiva (60% modo / 40% layer).
  const lr = vis.lerpSpeed;
  const ls = _v3LerpState;
  const modePrm = vis.modeParams?.[macroState.currentMode];
  // Blend helper: se il modo ha il parametro, mischia (60% modo, 40% layer); altrimenti usa layer puro
  const mblend = (layerVal, key) =>
    modePrm?.[key] !== undefined ? layerVal * 0.4 + modePrm[key] * 0.6 : layerVal;

  ls.dotSize        += (mblend(prefs.dotSize,        'dotSize')        - ls.dotSize)        * lr;
  ls.densityMul     += (mblend(prefs.densityMul,     'densityMul')     - ls.densityMul)     * lr;
  ls.midiScale      += (mblend(prefs.midiScale,      'midiScale')      - ls.midiScale)      * lr;
  ls.shapeScale     += (prefs.shapeScale                               - ls.shapeScale)     * lr;
  ls.trailMax       += (mblend(prefs.trailMax,        'trailMax')       - ls.trailMax)       * lr;
  ls.densityGravity += (prefs.densityGravity                           - ls.densityGravity) * lr;
  ls.onsetWaveSpeed += (prefs.onsetWaveSpeed                           - ls.onsetWaveSpeed) * lr;
  ls.flickerSpeed   += (mblend(prefs.flickerSpeed,   'flickerSpeed')   - ls.flickerSpeed)   * lr;
  ls.midiDensityMul += (mblend(prefs.midiDensityMul, 'midiDensityMul') - ls.midiDensityMul) * lr;
  ls.feedbackDecay  += (prefs.feedbackDecay                            - ls.feedbackDecay)  * lr;

  // Scrive su engineRender (letto da field.js e render.js)
  engineRender.active         = true;
  engineRender._engine        = 'v3_' + layerKey;
  engineRender.dotSize        = ls.dotSize;
  engineRender.densityMul     = ls.densityMul;
  engineRender.midiScale      = ls.midiScale;
  engineRender.forceInvert    = null;
  engineRender.shapeScale     = ls.shapeScale;
  engineRender.trailMax       = Math.round(ls.trailMax);
  engineRender.densityGravity = ls.densityGravity;
  engineRender.onsetWaveSpeed = Math.round(ls.onsetWaveSpeed);
  engineRender.flickerSpeed   = ls.flickerSpeed;
  engineRender.midiDensityMul = ls.midiDensityMul;
  engineRender.feedbackDecay  = ls.feedbackDecay;

  // ── 3. Arco visivo 5 atti (D-04, D-06) ──
  const act = _getV3Act(arcPct);
  const actCfg = vis.acts[act];

  // Cambio atto → transizione scena + camera (palette gestita da setPaletteForMode in V3)
  if (act !== _v3LastAct) {
    _v3LastAct = act;
    // Trova scena target per nome
    const targetScene = SCENES.find(s => s.name === actCfg.scene);
    if (targetScene) transitionToScene(targetScene, false);
    // Camera: richiedi framing atto
    if (actCfg.camera) requestFraming(actCfg.camera);
  }

  // Track layer change per parametri render (senza sovrascrivere palette modale)
  if (engineRender._lastMusicalPhase !== layerKey) {
    engineRender._lastMusicalPhase = layerKey;
  }
}

// ═══════════════════════════════════════════════════════════
//  PHASE-DRIVEN VISUAL PARAMETERS (6B)
//  Each engine × phase → visual target. Lerped in updateDirector.
// ═══════════════════════════════════════════════════════════

const ENGINE_VISUAL_PHASES = {
  terreno: {
    germoglio:    { dotSize: 14, densityMul: 0.3, midiScale: 2.0, flickerSpeed: 0.5, midiDensityMul: 0.8, shapeScale: 2.0 },
    pulsazione:   { dotSize: 8,  densityMul: 0.7, midiScale: 1.5, flickerSpeed: 2.0, midiDensityMul: 0.5, shapeScale: 1.5 },
    densita:      { dotSize: 5,  densityMul: 1.4, midiScale: 1.0, flickerSpeed: 4.0, midiDensityMul: 0.3, shapeScale: 1.0 },
    rottura:      { dotSize: 3,  densityMul: 2.0, midiScale: 0.6, flickerSpeed: 8.0, midiDensityMul: 0.2, shapeScale: 0.8 },
    dissoluzione: { dotSize: 10, densityMul: 0.4, midiScale: 1.8, flickerSpeed: 1.0, midiDensityMul: 0.6, shapeScale: 1.8 },
  },
  meccanica: {
    germoglio:    { dotSize: 10, densityMul: 0.4, midiScale: 1.8, flickerSpeed: 1.0, midiDensityMul: 0.6, shapeScale: 1.2 },
    pulsazione:   { dotSize: 6,  densityMul: 0.9, midiScale: 1.2, flickerSpeed: 3.0, midiDensityMul: 0.4, shapeScale: 0.9 },
    densita:      { dotSize: 4,  densityMul: 1.5, midiScale: 1.0, flickerSpeed: 6.0, midiDensityMul: 0.3, shapeScale: 0.7 },
    rottura:      { dotSize: 2,  densityMul: 2.0, midiScale: 0.5, flickerSpeed: 10.0, midiDensityMul: 0.2, shapeScale: 0.5 },
    dissoluzione: { dotSize: 8,  densityMul: 0.5, midiScale: 1.5, flickerSpeed: 2.0, midiDensityMul: 0.5, shapeScale: 1.0 },
  },
  deriva: {
    germoglio:    { dotSize: 16, densityMul: 0.2, midiScale: 2.5, flickerSpeed: 0.2, midiDensityMul: 0.8, shapeScale: 3.0 },
    pulsazione:   { dotSize: 10, densityMul: 0.4, midiScale: 2.0, flickerSpeed: 0.5, midiDensityMul: 0.7, shapeScale: 2.5 },
    densita:      { dotSize: 6,  densityMul: 0.7, midiScale: 1.5, flickerSpeed: 1.5, midiDensityMul: 0.5, shapeScale: 2.0 },
    rottura:      { dotSize: 4,  densityMul: 1.0, midiScale: 1.0, flickerSpeed: 3.0, midiDensityMul: 0.4, shapeScale: 1.5 },
    dissoluzione: { dotSize: 12, densityMul: 0.3, midiScale: 2.2, flickerSpeed: 0.3, midiDensityMul: 0.7, shapeScale: 2.8 },
  },
  vortice: {
    germoglio:    { dotSize: 8,  densityMul: 0.5, midiScale: 2.0, flickerSpeed: 2.0, midiDensityMul: 0.6, shapeScale: 0.8 },
    pulsazione:   { dotSize: 5,  densityMul: 1.0, midiScale: 1.5, flickerSpeed: 4.0, midiDensityMul: 0.5, shapeScale: 0.6 },
    densita:      { dotSize: 3,  densityMul: 1.6, midiScale: 1.0, flickerSpeed: 8.0, midiDensityMul: 0.3, shapeScale: 0.5 },
    rottura:      { dotSize: 2,  densityMul: 2.2, midiScale: 0.5, flickerSpeed: 12.0, midiDensityMul: 0.2, shapeScale: 0.4 },
    dissoluzione: { dotSize: 6,  densityMul: 0.6, midiScale: 1.8, flickerSpeed: 2.0, midiDensityMul: 0.5, shapeScale: 0.7 },
  },
  cristallo: {
    germoglio:    { dotSize: 16, densityMul: 0.15, midiScale: 2.5, flickerSpeed: 0.2, midiDensityMul: 0.8, shapeScale: 0.6 },
    pulsazione:   { dotSize: 10, densityMul: 0.4,  midiScale: 2.0, flickerSpeed: 0.5, midiDensityMul: 0.6, shapeScale: 0.5 },
    densita:      { dotSize: 6,  densityMul: 0.8,  midiScale: 1.2, flickerSpeed: 1.5, midiDensityMul: 0.4, shapeScale: 0.4 },
    rottura:      { dotSize: 3,  densityMul: 1.2,  midiScale: 0.8, flickerSpeed: 4.0, midiDensityMul: 0.3, shapeScale: 0.3 },
    dissoluzione: { dotSize: 12, densityMul: 0.25, midiScale: 2.2, flickerSpeed: 0.3, midiDensityMul: 0.7, shapeScale: 0.5 },
  },
  abisso: {
    germoglio:    { dotSize: 12, densityMul: 0.5, midiScale: 1.5, flickerSpeed: 0.3, midiDensityMul: 0.7, shapeScale: 2.0 },
    pulsazione:   { dotSize: 8,  densityMul: 1.0, midiScale: 1.0, flickerSpeed: 1.0, midiDensityMul: 0.5, shapeScale: 1.8 },
    densita:      { dotSize: 5,  densityMul: 1.8, midiScale: 0.8, flickerSpeed: 2.0, midiDensityMul: 0.4, shapeScale: 1.5 },
    rottura:      { dotSize: 3,  densityMul: 2.2, midiScale: 0.5, flickerSpeed: 5.0, midiDensityMul: 0.2, shapeScale: 1.2 },
    dissoluzione: { dotSize: 10, densityMul: 0.6, midiScale: 1.2, flickerSpeed: 0.5, midiDensityMul: 0.6, shapeScale: 1.8 },
  },
  solco: {
    germoglio:    { dotSize: 14, densityMul: 0.3, midiScale: 1.8, flickerSpeed: 0.5, midiDensityMul: 0.6, shapeScale: 1.2 },
    pulsazione:   { dotSize: 6,  densityMul: 0.8, midiScale: 1.2, flickerSpeed: 2.5, midiDensityMul: 0.5, shapeScale: 1.0 },
    densita:      { dotSize: 3,  densityMul: 1.5, midiScale: 1.0, flickerSpeed: 5.0, midiDensityMul: 0.3, shapeScale: 0.8 },
    rottura:      { dotSize: 2,  densityMul: 2.0, midiScale: 0.6, flickerSpeed: 8.0, midiDensityMul: 0.2, shapeScale: 0.6 },
    dissoluzione: { dotSize: 10, densityMul: 0.4, midiScale: 1.5, flickerSpeed: 1.0, midiDensityMul: 0.5, shapeScale: 1.0 },
  },
};

// ── Phase-driven compositions (6C) ──
const ENGINE_COMPOSITIONS = {
  terreno:   { germoglio: 'HORIZON',    pulsazione: 'ASYMMETRIC', densita: 'MONDRIAN_A', rottura: 'COLUMNS',   dissoluzione: 'ISLANDS' },
  meccanica: { germoglio: 'MONDRIAN',   pulsazione: 'MONDRIAN_A', densita: 'MONDRIAN_B', rottura: 'COLUMNS',   dissoluzione: 'MONOCHROME' },
  deriva:    { germoglio: 'HORIZON',    pulsazione: 'SPARSE',     densita: 'ASYMMETRIC', rottura: 'ISLANDS',   dissoluzione: 'HORIZON' },
  vortice:   { germoglio: 'ASYMMETRIC', pulsazione: 'COLUMNS',    densita: 'MONDRIAN_B', rottura: 'DENSE',     dissoluzione: 'SPARSE' },
  cristallo: { germoglio: 'UNIFORM',    pulsazione: 'HORIZON',    densita: 'FRAME',      rottura: 'ISLANDS',   dissoluzione: 'UNIFORM' },
  abisso:    { germoglio: 'SPARSE',     pulsazione: 'DENSE',      densita: 'MONDRIAN_A', rottura: 'COLUMNS',   dissoluzione: 'HORIZON' },
  solco:     { germoglio: 'HORIZON',    pulsazione: 'MONDRIAN_A', densita: 'COLUMNS',    rottura: 'DENSE',     dissoluzione: 'ISLANDS' },
};

// ── Inversions as narrative gesture (6D) ──
// Each engine gets ONE inversion at a specific phase transition.
// null = never invert. Value = phase name that triggers inversion on entry.
const ENGINE_INVERSIONS = {
  terreno: null,       // dub warmth, no binary contrast
  meccanica: 'rottura',  // layer convergence moment
  deriva: null,        // stays as DNA decides
  vortice: 'rottura',   // maximum energy inverts everything
  cristallo: 'pulsazione', // first beat is a polarity change
  abisso: 'densita',    // descent into darkness is literal
  solco: null,         // hypnotic mantra, not dramatic
};

// Track which engines have already triggered their inversion
let _invertTriggered = {};

// VORTICE rhythmic inversion — every 4 beats at 138bpm (~1.739s)
let _vorticeInvTimer = 0;
const _VORTICE_BEAT_4 = 4 * 60 / 138;

// ═══════════════════════════════════════════════════════════
//  COMPOSITIONS — Spatial density layouts
// ═══════════════════════════════════════════════════════════

// fillColor: palette accent index (1=accent1, 2=accent2, 3=accent3, null=fg/bg)
const COMPOSITIONS = {
  UNIFORM: [],
  MONDRIAN_A: [
    { x: 0,    y: 0,    w: 0.38, h: 0.55, mul: 2.5, fillColor: 1 },
    { x: 0,    y: 0.55, w: 0.38, h: 0.45, mul: 0.04, fillColor: null },
    { x: 0.38, y: 0,    w: 0.02, h: 1,    mul: 3.0,  fillColor: 3 }, // linea
    { x: 0.40, y: 0,    w: 0.35, h: 1,    mul: 0.02, fillColor: null },
    { x: 0.75, y: 0,    w: 0.02, h: 1,    mul: 3.0,  fillColor: 3 }, // linea
    { x: 0.77, y: 0,    w: 0.23, h: 0.35, mul: 0.04, fillColor: null },
    { x: 0.77, y: 0.35, w: 0.23, h: 0.65, mul: 2.2,  fillColor: 2 },
  ],
  MONDRIAN_B: [
    { x: 0,    y: 0,    w: 0.30, h: 0.45, mul: 2.8, fillColor: 1 },
    { x: 0.30, y: 0,    w: 0.40, h: 0.45, mul: 0.03, fillColor: null },
    { x: 0.70, y: 0,    w: 0.30, h: 0.45, mul: 1.8,  fillColor: 2 },
    { x: 0,    y: 0.45, w: 0.02, h: 0.02, mul: 3.5,  fillColor: 3 },
    { x: 0,    y: 0.47, w: 0.50, h: 0.53, mul: 0.05, fillColor: null },
    { x: 0.50, y: 0.47, w: 0.50, h: 0.25, mul: 2.4,  fillColor: 3 },
    { x: 0.50, y: 0.72, w: 0.50, h: 0.28, mul: 0.03, fillColor: null },
  ],
  COLUMNS: [
    { x: 0,    y: 0, w: 0.18, h: 1, mul: 2.5, fillColor: 1 },
    { x: 0.18, y: 0, w: 0.24, h: 1, mul: 0.02, fillColor: null },
    { x: 0.42, y: 0, w: 0.16, h: 1, mul: 3.0, fillColor: 2 },
    { x: 0.58, y: 0, w: 0.22, h: 1, mul: 0.02, fillColor: null },
    { x: 0.80, y: 0, w: 0.20, h: 1, mul: 1.8, fillColor: 3 },
  ],
  HORIZON: [
    { x: 0, y: 0,    w: 1, h: 0.30, mul: 0.03, fillColor: null },
    { x: 0, y: 0.30, w: 1, h: 0.02, mul: 3.5,  fillColor: 3 },
    { x: 0, y: 0.32, w: 1, h: 0.20, mul: 2.5,  fillColor: 1 },
    { x: 0, y: 0.52, w: 1, h: 0.02, mul: 3.5,  fillColor: 3 },
    { x: 0, y: 0.54, w: 1, h: 0.46, mul: 0.03, fillColor: null },
  ],
  FRAME: [
    { x: 0,    y: 0,    w: 1,    h: 0.12, mul: 2.5, fillColor: 2 },
    { x: 0,    y: 0.88, w: 1,    h: 0.12, mul: 2.5, fillColor: 2 },
    { x: 0,    y: 0.12, w: 0.12, h: 0.76, mul: 2.5, fillColor: 1 },
    { x: 0.88, y: 0.12, w: 0.12, h: 0.76, mul: 2.5, fillColor: 1 },
    { x: 0.12, y: 0.12, w: 0.76, h: 0.76, mul: 0.02, fillColor: null },
  ],
  ISLANDS: [
    { x: 0,    y: 0,    w: 1,    h: 1,    mul: 0.02, fillColor: null },
    { x: 0.05, y: 0.05, w: 0.22, h: 0.15, mul: 80,   fillColor: 1 },
    { x: 0.62, y: 0.18, w: 0.15, h: 0.28, mul: 70,   fillColor: 2 },
    { x: 0.25, y: 0.60, w: 0.30, h: 0.12, mul: 90,   fillColor: 3 },
    { x: 0.78, y: 0.75, w: 0.18, h: 0.20, mul: 60,   fillColor: 1 },
  ],
  ASYMMETRIC: [
    { x: 0,    y: 0,    w: 0.60, h: 1,    mul: 0.04, fillColor: null },
    { x: 0.60, y: 0,    w: 0.02, h: 1,    mul: 3.5,  fillColor: 3 },
    { x: 0.62, y: 0,    w: 0.38, h: 0.50, mul: 2.8,  fillColor: 1 },
    { x: 0.62, y: 0.50, w: 0.38, h: 0.50, mul: 0.05, fillColor: null },
  ],
};

// ═══════════════════════════════════════════════════════════
//  NARRATIVE ARC
// ═══════════════════════════════════════════════════════════

// ── Per-phase behavior parameters (6 audio-driven states) ──
const ARC_PARAMS = {
  SILENCE: {
    allowedScenes: ['SPARSE'],
    mutationRate: 0.0,
    camera: 'WIDE_ONLY',
    densityCap: 0.06,
    blendMul: 0.2,
  },
  BUILDING: {
    allowedScenes: ['BAYER_CLASSIC', 'SPARSE', 'HORIZON', 'MONDRIAN'],
    mutationRate: 0.3,
    camera: 'DRIFT_BIAS',
    densityCap: 0.4,
    blendMul: 0.6,
  },
  ACTIVE: {
    allowedScenes: null,   // all scenes
    mutationRate: 1.0,
    camera: 'DRIFT_BIAS',
    densityCap: 0.9,
    blendMul: 1.0,
  },
  INTENSE: {
    allowedScenes: ['DENSE', 'COLORED_GROUND', 'MONDRIAN', 'NEGATIVE'],
    mutationRate: 1.8,
    camera: 'TIGHTEN',
    densityCap: 1.0,
    blendMul: 1.8,
    chromaChance: 0.3,
  },
  PEAK: {
    allowedScenes: ['DENSE', 'NEGATIVE'],
    mutationRate: 3.0,
    camera: 'MACRO_LOCK',
    densityCap: 999,
    blendMul: 3.0,
    chromaChance: 0.5,
    invertChance: 0.3,
  },
  DECAY: {
    allowedScenes: ['SPARSE', 'MONOCHROME', 'HORIZON'],
    mutationRate: 0.15,
    camera: 'SLOW_WIDE',
    densityCap: 0.28,
    blendMul: 0.2,
  },
};

export const arc = {
  totalTime: 0,
  phaseTime: 0,
  phase: 'SILENCE',
  _smoothRms: 0,
  _stateHold: 0,
  sceneHistory: [],
  tension: 0,           // 0-1 narrative tension (grows over concert)
  _ruptureBoost: 0,     // temporary boost from rupture events
};

function setArcPhase(newPhase) {
  if (arc.phase === newPhase) return;
  arc.phase = newPhase;
  arc.phaseTime = 0;
  const holds = {
    SILENCE: CFG.arcHoldSilence, BUILDING: CFG.arcHoldBuilding,
    ACTIVE: CFG.arcHoldActive,   INTENSE:  CFG.arcHoldIntense,
    PEAK:   CFG.arcHoldPeak,     DECAY:    CFG.arcHoldDecay,
  };
  arc._stateHold = holds[newPhase] || 2.0;
}

function updateArc(dt, state) {
  arc.totalTime += dt;
  arc.phaseTime += dt;
  arc._stateHold -= dt;

  // Smooth RMS — framerate-independent, tau from config
  const tau = CFG.arcSmoothTau || 0.6;
  arc._smoothRms += (audio.rms - arc._smoothRms) * (1 - Math.exp(-dt / tau));
  const rms  = arc._smoothRms;
  const flux = audio.flux;
  const traj = audio.trajectory;
  const rhyt = state.rhythmicity;

  // Narrative tension: linear growth over 40min + rupture boost
  arc.tension = Math.min(1, arc.totalTime / 2400 + arc._ruptureBoost);
  arc._ruptureBoost = Math.max(0, arc._ruptureBoost - dt * 0.008);

  if (arc._stateHold > 0) return; // isteresi — no flicker

  // Tension-adjusted thresholds — up to 25% lower as tension grows
  const tMod = 1 - arc.tension * 0.25;
  const rmsSilence  = CFG.arcRmsSilence * tMod;
  const rmsBuilding = CFG.arcRmsBuilding * tMod;
  const rmsActive   = CFG.arcRmsActive * tMod;
  const rmsIntense  = CFG.arcRmsIntense * tMod;
  const rmsPeak     = CFG.arcRmsPeak * tMod;
  const fluxIntense = CFG.arcFluxIntense * tMod;

  switch (arc.phase) {
    case 'SILENCE':
      if (rms > rmsBuilding && traj === 1) setArcPhase('BUILDING');
      else if (rms > rmsActive) setArcPhase('ACTIVE');
      break;
    case 'BUILDING':
      if (rms < rmsSilence) setArcPhase('SILENCE');
      else if (rms > rmsActive && rhyt > 0.25) setArcPhase('ACTIVE');
      break;
    case 'ACTIVE':
      if (rms < rmsSilence) setArcPhase('SILENCE');
      else if (rms < rmsBuilding && traj === -1) setArcPhase('BUILDING');
      else if (rms > rmsIntense && flux > fluxIntense) setArcPhase('INTENSE');
      break;
    case 'INTENSE':
      if (rms < rmsBuilding) setArcPhase('ACTIVE');
      else if (rms > rmsPeak) setArcPhase('PEAK');
      break;
    case 'PEAK':
      if (rms < rmsIntense && traj === -1) setArcPhase('DECAY');
      break;
    case 'DECAY':
      if (rms < rmsSilence) setArcPhase('SILENCE');
      else if (rms > rmsIntense && traj === 1) setArcPhase('ACTIVE');
      else if (rms > rmsPeak) setArcPhase('PEAK');
      break;
  }
}

function pickScene() {
  const params = ARC_PARAMS[arc.phase];
  const engine = getEngine();
  const prefs = engine ? ENGINE_PREFS[engine] : null;

  const weights = SCENES.map((s) => {
    if (params.allowedScenes && !params.allowedScenes.includes(s.name)) return 0;
    let w = 1;
    // Engine-aware biasing
    if (prefs) {
      if (prefs.sceneBoost.includes(s.name)) w *= 3.0;
      if (prefs.sceneAvoid.includes(s.name)) w *= 0.1;
    }
    return w;
  });

  // Avoid repeating recent scenes
  for (const recent of arc.sceneHistory.slice(0, 2)) {
    const idx = SCENES.findIndex(s => s.name === recent);
    if (idx >= 0) weights[idx] *= 0.15;
  }

  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) return SCENES[0];
  let r = Math.random() * total;
  for (let i = 0; i < SCENES.length; i++) {
    r -= weights[i];
    if (r <= 0) return SCENES[i];
  }
  return SCENES[0];
}

// ═══════════════════════════════════════════════════════════
//  SCENE STATE (exported, read by field.js and render.js)
// ═══════════════════════════════════════════════════════════

export const scene = {
  current: SCENES[0],
  target: SCENES[0],
  blend: 1.0,
  blendSpeed: 0,
  // Interpolated values
  densityMul: 1.0,
  dotSize: 6,
  midiScale: 1.0,
  invertBase: false,
  regions: [],         // active composition regions [{x,y,w,h,mul}]
  _regionsCurrent: [],
  _regionsTarget: [],
  _blendBuffer: [],    // pre-allocated: same-length blend interpolation
  _dynBuffer: [],      // pre-allocated: dynamic arc modifications
  _compBlend: 1.0,     // blend separato per composition-only transition (mode change)
  _compBlendSpeed: 0.07, // ~14s per transizione — evita flash bruscop tra sezioni
};

// ── Engine render overrides (read by field.js) ──
export const engineRender = {
  active: false,
  _engine: null,       // track current engine for change detection
  _lastMusicalPhase: null, // track phase for transition detection
  dotSize: null,       // override scene dotSize
  densityMul: null,    // multiply scene densityMul
  midiScale: null,     // override scene midiScale
  forceInvert: null,   // true/false override, null = scene decides
  // visual identity
  shapeScale: 1.0,
  trailMax: 64,
  densityGravity: 0,
  onsetWaveSpeed: null,
  flickerSpeed: null,
  midiDensityMul: 0.4,
  feedbackDecay: null,
};

function transitionToScene(newScene, instant) {
  scene.target = newScene;
  const blendMul = ARC_PARAMS[arc.phase].blendMul || 1.0;
  if (instant) {
    scene.current = newScene;
    scene.blend = 1.0;
  } else {
    scene.blend = 0;
    scene.blendSpeed = blendMul / (CFG.sceneTransitionBars * 2);
  }

  // Apply palette — in V3 mode la palette è gestita da setPaletteForMode (macro-composer)
  // In v2 mode applica la preferenza engine o la default della scena
  if (!CFG.V3_MODE) {
    const engine = getEngine();
    const prefs = engine ? ENGINE_PREFS[engine] : null;
    let palName = newScene.palette;
    if (prefs) {
      palName = prefs.palette;
    } else if (newScene.name === 'COLORED_GROUND') {
      palName = COLORED_PALETTES[Math.floor(Math.random() * COLORED_PALETTES.length)];
    }
    setPalette(palName);
  }

  // Apply invert — in V3_MODE l'inversione è riservata a momenti espliciti (non alle scene transition)
  // Evita sfondo bianco nelle prime sezioni prima che ci siano elementi sufficienti
  if (!CFG.V3_MODE && newScene.invertBase !== scene.current.invertBase) {
    startInvertDissolve();
  }

  // Set composition — save current for cross-fade
  scene._regionsCurrent = scene.regions.map(r => ({ ...r }));
  scene._regionsTarget = COMPOSITIONS[newScene.composition] || [];

  // Track history
  arc.sceneHistory.unshift(newScene.name);
  if (arc.sceneHistory.length > 5) arc.sceneHistory.pop();
}

function updateSceneBlend(dt) {
  if (scene.blend < 1) {
    scene.blend = Math.min(1, scene.blend + scene.blendSpeed * dt);
  }

  const t = scene.blend;
  const from = scene.current;
  const to = scene.target;

  scene.densityMul = from.densityMul + (to.densityMul - from.densityMul) * t;
  scene.dotSize = Math.round(from.dotSize + (to.dotSize - from.dotSize) * t);
  scene.midiScale = from.midiScale + (to.midiScale - from.midiScale) * t;

  // Snap booleans at 0.5
  scene.invertBase = t > 0.5 ? to.invertBase : from.invertBase;

  // Lerp composition regions — usa _compBlend separato per mode-change transitions
  if (scene._compBlend < 1) {
    scene._compBlend = Math.min(1, scene._compBlend + scene._compBlendSpeed * dt);
  }
  const ct = scene._compBlend;

  if (ct >= 1) {
    scene.regions = scene._regionsTarget;
  } else if (scene._regionsCurrent && scene._regionsCurrent.length === scene._regionsTarget.length) {
    // Same length: interpolate into pre-allocated _blendBuffer
    const len = scene._regionsCurrent.length;
    while (scene._blendBuffer.length < len) scene._blendBuffer.push({});
    scene._blendBuffer.length = len;
    for (let i = 0; i < len; i++) {
      const r = scene._regionsCurrent[i], rt = scene._regionsTarget[i], b = scene._blendBuffer[i];
      b.x = r.x + (rt.x - r.x) * ct;
      b.y = r.y + (rt.y - r.y) * ct;
      b.w = r.w + (rt.w - r.w) * ct;
      b.h = r.h + (rt.h - r.h) * ct;
      b.mul = r.mul + (rt.mul - r.mul) * ct;
      if (r.fillColor !== undefined) b.fillColor = r.fillColor;
    }
    scene.regions = scene._blendBuffer;
  } else {
    // Different lengths: cross-fade old (decreasing) + new (increasing)
    const oldRegs = (scene._regionsCurrent || []).map(r => ({ ...r, mul: r.mul * (1 - ct) }));
    const newRegs = scene._regionsTarget.map(r => ({ ...r, mul: r.mul * ct }));
    scene.regions = [...oldRegs, ...newRegs];
  }

  // scene.current snap at scene.blend=1 (parametri non-regioni)
  if (t >= 1) scene.current = scene.target;
}

// ═══════════════════════════════════════════════════════════
//  MUTATION SYSTEM (within scenes)
// ═══════════════════════════════════════════════════════════

const MUTATION_TYPES = [
  { type: 'PRIMITIVE', weight: 20 },
  { type: 'RESET_PARTIAL', weight: 15 },
  { type: 'CHROMATIC', weight: 20 },
  { type: 'SCENE', weight: 45 },
];
const TOTAL_WEIGHT = MUTATION_TYPES.reduce((s, m) => s + m.weight, 0);

export const director = {
  sceneTime: 0, nextCheckIn: 0, changeProb: 0,
  lastChangeType: '——', plateauTime: 0,
  beatAccum: 0, barCount: 0,
};

export const mutationLog = [];
let dirBaseInterval = 15, dirRandomFactor = 0.4;

const BAR_OPTIONS = [4, 8, 8, 12, 16, 24];

function logMut(type, detail, globalTime) {
  mutationLog.unshift({ type, detail, time: globalTime });
  if (mutationLog.length > 5) mutationLog.pop();
}

function pickNextBarTarget() {
  return BAR_OPTIONS[Math.floor(Math.random() * BAR_OPTIONS.length)];
}

let nextMutationBar = 4;

function computeNextCheck(state) {
  if (audio.bpm > 0 && state.rhythmicity > 0.3) {
    director.nextCheckIn = 999;
  } else {
    director.nextCheckIn = dirBaseInterval * (1 + dirRandomFactor * Math.random());
  }
}

export function initDirector(state) {
  director.sceneTime = 0;
  director.beatAccum = 0;
  director.barCount = 0;
  nextMutationBar = pickNextBarTarget();
  computeNextCheck(state);
  // Start with first scene
  transitionToScene(SCENES[0], true);
}

function pickMutationType() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const m of MUTATION_TYPES) { r -= m.weight; if (r <= 0) return m.type; }
  return 'PRIMITIVE';
}

export function executeMutation(forceType, globalTime) {
  const type = forceType || pickMutationType();
  director.lastChangeType = type;
  director.sceneTime = 0;

  if (type === 'PRIMITIVE') {
    if (dna && dna.primitives.length > 0) {
      const idx = Math.floor(Math.random() * dna.primitives.length);
      const old = dna.primitives[idx];
      const available = PRIM_TYPES.filter(p => !dna.primitives.includes(p));
      if (available.length > 0) {
        const newPrim = available[Math.floor(Math.random() * available.length)];
        dna.primitives[idx] = newPrim;
        logMut(type, `${old}→${newPrim}`, globalTime);
      }
    }
  } else if (type === 'RESET_PARTIAL') {
    const rx = Math.random() * 0.6 + 0.1, ry = Math.random() * 0.6 + 0.1;
    const rw = 0.1 + Math.random() * 0.3, rh = 0.1 + Math.random() * 0.3;
    let killed = 0;
    for (const e of entities) {
      if (e.x > rx && e.x < rx + rw && e.y > ry && e.y < ry + rh) { e.age = e.maxAge; killed++; }
    }
    logMut(type, `${killed} killed`, globalTime);
  } else if (type === 'CHROMATIC') {
    const modes = ['all-A', 'all-B', 'grey'];
    const mode = modes[Math.floor(Math.random() * modes.length)];
    setChromaticShift(mode);
    logMut(type, mode, globalTime);
  } else if (type === 'SCENE') {
    const newScene = pickScene();
    const instant = Math.random() < CFG.sceneCutProbability;
    transitionToScene(newScene, instant);
    logMut(type, `→${newScene.name}${instant ? ' CUT' : ''}`, globalTime);
  }
}

// ═══════════════════════════════════════════════════════════
//  CAMERA
// ═══════════════════════════════════════════════════════════

export const framing = {
  current: 'WIDE', targetZoom: 1, targetX: 0, targetY: 0,
  zoom: 1, offsetX: 0, offsetY: 0,
  panDirX: 0, panTime: 0, macroTimer: 0,
  // Camera ritmica impulses
  _zoomImpulse: 0,
  _panImpulseX: 0,
  _panImpulseY: 0,
};
export let autoCamera = true;

function findPOI() {
  let sumX = 0, sumY = 0, totalD = 0;
  for (const e of entities) {
    const ageNorm = e.age / e.maxAge;
    if (ageNorm > 0.8) continue;
    const w = e.density * (1 - ageNorm);
    sumX += e.x * w; sumY += e.y * w; totalD += w;
  }
  if (totalD < 0.01) return { x: 0.5, y: 0.5 };
  return { x: sumX / totalD, y: sumY / totalD };
}

export function setFraming(type, W, H) {
  framing.current = type;
  const poi = findPOI();
  framing.macroTimer = 0;

  if (type === 'WIDE') { framing.targetZoom = 1; framing.targetX = 0; framing.targetY = 0; framing.panDirX = 0; }
  else if (type === 'MEDIUM') {
    framing.targetZoom = CFG.camMediumZoom;
    framing.targetX = (0.5 - poi.x) * W * 0.5;
    framing.targetY = (0.5 - poi.y) * H * 0.5;
    framing.panDirX = 0;
  } else if (type === 'MACRO') {
    framing.targetZoom = CFG.camMacroZoom;
    framing.targetX = (0.5 - poi.x) * W;
    framing.targetY = (0.5 - poi.y) * H;
    framing.panDirX = 0;
    framing.macroTimer = CFG.camMacroReturnSec;
  } else if (type === 'DRIFT') {
    framing.targetZoom = 1.15 + Math.random() * 0.15;
    framing.targetX = (0.5 - poi.x) * W * 0.4;
    framing.targetY = (0.5 - poi.y) * H * 0.4;
  }
}

function pickAutoShot(state, W, H) {
  const params = ARC_PARAMS[arc.phase];
  const cam = params.camera;
  const engine = getEngine();
  const prefs = engine ? ENGINE_PREFS[engine] : null;

  if (cam === 'WIDE_ONLY') return setFraming('WIDE', W, H);
  if (cam === 'MACRO_LOCK') {
    // Engine may disallow MACRO (e.g. TERRENO/DERIVA prefer WIDE)
    if (prefs && !prefs.cameraAllow.has('MACRO')) return setFraming(prefs.camera, W, H);
    return setFraming('MACRO', W, H);
  }
  if (cam === 'SLOW_WIDE') {
    framing.targetZoom = 1.0;
    framing.current = 'WIDE';
    return;
  }
  if (cam === 'TIGHTEN') {
    if (prefs && !prefs.cameraAllow.has('MACRO')) {
      setFraming(prefs.camera, W, H);
      return;
    }
    const progress = Math.min(1, arc.phaseTime / 90);
    if (progress < 0.5) setFraming('MEDIUM', W, H);
    else setFraming('MACRO', W, H);
    return;
  }
  // Camera narrativa — MACRO follows solos (voice/lead active, pulse quiet)
  const voiceDensity = (midi.channels[5] ? midi.channels[5].density : 0)
                     + (midi.channels[6] ? midi.channels[6].density : 0);
  const pulseDensity = midi.channels[0] ? midi.channels[0].density : 0;
  if (voiceDensity > 0.4 && pulseDensity < 0.2) {
    if (!prefs || prefs.cameraAllow.has('MACRO')) {
      return setFraming('MACRO', W, H);
    }
  }

  // DRIFT_BIAS — default, engine-aware
  if (prefs) {
    const allowed = [...prefs.cameraAllow];
    const pick = allowed[Math.floor(Math.random() * allowed.length)];
    return setFraming(pick, W, H);
  }
  const roll = Math.random();
  if (roll < 0.5) setFraming('DRIFT', W, H);
  else if (roll < 0.85) setFraming('MEDIUM', W, H);
  else setFraming('WIDE', W, H);
}

// ═══════════════════════════════════════════════════════════
//  MAIN UPDATE
// ═══════════════════════════════════════════════════════════

export function updateDirector(dt, state, globalTime, W, H) {
  _W = W; _H = H; _state = state;

  // ── V3_MODE gate (Phase 4) ──
  if (CFG.V3_MODE) {
    _updateDirectorV3(dt);
  } else {
  // Update engine render overrides + detect engine change
  const curEngine = getEngine();
  const curPrefs = curEngine ? ENGINE_PREFS[curEngine] : null;
  const enginePhaseData = curEngine ? getEnginePhase(curEngine) : null;
  const musicalPhase = enginePhaseData?.phase || 'germoglio';
  const phaseVisuals = curEngine ? ENGINE_VISUAL_PHASES[curEngine]?.[musicalPhase] : null;

  if (curPrefs) {
    // Detect engine change → apply palette + reset inversion tracking
    if (!engineRender.active || engineRender._engine !== curEngine) {
      setPalette(curPrefs.palette);
      _invertTriggered = {};  // reset on engine change
      _vorticeInvTimer = 0;
      engineRender._lastMusicalPhase = null;

      // Phase-driven composition on engine entry
      const compName = ENGINE_COMPOSITIONS[curEngine]?.[musicalPhase];
      if (compName && COMPOSITIONS[compName]) {
        scene._regionsCurrent = scene.regions.map(r => ({ ...r }));
        scene._regionsTarget = COMPOSITIONS[compName];
        scene.blend = 0;
        scene.blendSpeed = 0.4;
      }
    }

    // Detect musical phase change → trigger composition + inversion
    if (engineRender._lastMusicalPhase && engineRender._lastMusicalPhase !== musicalPhase) {
      // Phase-driven composition transition
      const compName = ENGINE_COMPOSITIONS[curEngine]?.[musicalPhase];
      if (compName && COMPOSITIONS[compName]) {
        scene._regionsCurrent = scene.regions.map(r => ({ ...r }));
        scene._regionsTarget = COMPOSITIONS[compName];
        scene.blend = 0;
        scene.blendSpeed = 0.3;
      }

      // Narrative inversion (6D) — one per engine per activation
      const invertPhase = ENGINE_INVERSIONS[curEngine];
      if (invertPhase === musicalPhase && !_invertTriggered[curEngine]) {
        _invertTriggered[curEngine] = true;
        startInvertDissolve();
      }
    }
    engineRender._lastMusicalPhase = musicalPhase;

    engineRender.active = true;
    engineRender._engine = curEngine;
    engineRender.forceInvert = curPrefs.forceInvert;
    // Static identity params from ENGINE_PREFS
    engineRender.trailMax = curPrefs.trailMax ?? 64;
    engineRender.densityGravity = curPrefs.densityGravity ?? 0;
    engineRender.onsetWaveSpeed = curPrefs.onsetWaveSpeed ?? null;
    engineRender.feedbackDecay = curPrefs.feedbackDecay ?? null;

    // Phase-driven params: lerp toward phase target (smooth ~0.05/frame)
    if (phaseVisuals) {
      const lerpRate = dt * 0.8;  // ~0.05 at 60fps
      engineRender.dotSize    += (phaseVisuals.dotSize    - engineRender.dotSize)    * lerpRate;
      engineRender.densityMul += (phaseVisuals.densityMul - engineRender.densityMul) * lerpRate;
      engineRender.midiScale  += (phaseVisuals.midiScale  - engineRender.midiScale)  * lerpRate;
      engineRender.flickerSpeed  = (engineRender.flickerSpeed ?? phaseVisuals.flickerSpeed)
        + (phaseVisuals.flickerSpeed - (engineRender.flickerSpeed ?? phaseVisuals.flickerSpeed)) * lerpRate;
      engineRender.midiDensityMul += (phaseVisuals.midiDensityMul - engineRender.midiDensityMul) * lerpRate;
      engineRender.shapeScale += (phaseVisuals.shapeScale - engineRender.shapeScale) * lerpRate;
    } else {
      // Fallback to static prefs
      engineRender.dotSize = curPrefs.dotSize;
      engineRender.densityMul = curPrefs.densityMul;
      engineRender.midiScale = curPrefs.midiScale;
      engineRender.shapeScale = curPrefs.shapeScale ?? 1.0;
      engineRender.flickerSpeed = curPrefs.flickerSpeed ?? null;
      engineRender.midiDensityMul = curPrefs.midiDensityMul ?? 0.4;
    }

    // SOLCO velocity visual (6H) — bass velocity modulates density + dotSize
    if (curEngine === 'solco') {
      const bassNote = midi.channels[3]?.lastNote;
      if (bassNote) {
        const sweepVel = bassNote.vel / 127;
        engineRender.densityMul *= (0.8 + sweepVel * 0.4);  // ×0.8 → ×1.2
        engineRender.dotSize += (sweepVel - 0.5) * 2;       // ±1 dot
      }
    }

    // VORTICE rhythmic inversion — every 4 beats at 138 BPM (~1.739s)
    if (curEngine === 'vortice') {
      _vorticeInvTimer += dt;
      if (_vorticeInvTimer >= _VORTICE_BEAT_4) {
        _vorticeInvTimer -= _VORTICE_BEAT_4;
        startInvertDissolve();
      }
    }
  } else {
    if (engineRender.active) {
      setPalette(scene.target.palette || 'default');
    }
    engineRender.active = false;
    engineRender._engine = null;
    engineRender._lastMusicalPhase = null;
    engineRender.dotSize = null;
    engineRender.densityMul = null;
    engineRender.midiScale = null;
    engineRender.forceInvert = null;
    engineRender.shapeScale = 1.0;
    engineRender.trailMax = 64;
    engineRender.densityGravity = 0;
    engineRender.onsetWaveSpeed = null;
    engineRender.flickerSpeed = null;
    engineRender.midiDensityMul = 0.4;
    engineRender.feedbackDecay = null;
  }
  } // end else V3_MODE

  director.sceneTime += dt;
  if (state.trajectory === 0) director.plateauTime += dt; else director.plateauTime = 0;

  // Update narrative arc
  updateArc(dt, state);
  updateSceneBlend(dt);

  // Dynamic compositions — regions react to arc and intensity
  if (scene.regions.length > 0) {
    // If regions alias static data, copy to _dynBuffer first to avoid corruption
    if (scene.regions === scene._regionsTarget || scene.regions === scene._blendBuffer) {
      const len = scene.regions.length;
      while (scene._dynBuffer.length < len) scene._dynBuffer.push({});
      scene._dynBuffer.length = len;
      for (let i = 0; i < len; i++) {
        const r = scene.regions[i], d = scene._dynBuffer[i];
        d.x = r.x; d.y = r.y; d.w = r.w; d.h = r.h; d.mul = r.mul;
        d.fillColor = r.fillColor;
      }
      scene.regions = scene._dynBuffer;
    }
    // Modify in-place — no per-region object allocation
    for (let ri = 0; ri < scene.regions.length; ri++) {
      const dr = scene.regions[ri];
      if (arc.phase === 'PEAK') {
        // Collapse toward uniform (all mul → 1.0)
        dr.mul += (1.0 - dr.mul) * dt * 0.5;
      } else if (arc.phase === 'SILENCE' || arc.phase === 'DECAY') {
        // Extremize: dense denser, sparse sparser
        dr.mul += (dr.mul > 1 ? 0.3 : -0.15) * dt;
        dr.mul = Math.max(0.01, dr.mul);
      }
      // Intensity-driven scaling: dense regions grow with intensity
      if (dr.mul > 1) {
        dr.mul *= 1 + (state.intensity - 0.4) * dt * 0.3;
      }
      // Downbeat pulse on divider lines (mul > 2.5)
      if (dr.mul > 2.5 && framing._zoomImpulse > 0.01) {
        dr.mul += framing._zoomImpulse * 8;
      }
    }
  }

  const arcParams = ARC_PARAMS[arc.phase] || ARC_PARAMS.ACTIVE;

  // V3_MODE: density clamping guidato da arcPercent, non da arc state machine (D-05)
  if (CFG.V3_MODE) {
    const v3Act = _getV3Act(macroState.arcPercent);
    const v3Cap = CFG.VISUAL.acts[v3Act].densityCap;
    scene.densityMul = Math.min(scene.densityMul, v3Cap);
  } else {
  // Arc-driven density clamping
  if (arc.phase === 'SILENCE') {
    scene.densityMul = Math.min(scene.densityMul, 0.04 + arc.phaseTime * 0.008);
  } else if (arc.phase === 'BUILDING') {
    scene.densityMul = Math.min(scene.densityMul, 0.08 + arc.phaseTime * 0.015);
  } else {
    scene.densityMul = Math.min(scene.densityMul, arcParams.densityCap);
  }
  } // fine else V3_MODE density clamping

  const bpm = audio.bpm;
  const hasRhythm = bpm > 0 && state.rhythmicity > 0.3;

  if (hasRhythm) {
    const beatDuration = 60 / bpm;
    director.beatAccum += dt;

    if (director.beatAccum >= beatDuration) {
      director.beatAccum -= beatDuration;
      director.barCount++;

      // Camera ritmica — micro-zoom on downbeat (every bar)
      if (director.barCount % 4 === 0) {
        framing._zoomImpulse = 0.025;
      }

      if (director.barCount % 4 === 0) {
        const barNum = director.barCount / 4;

        for (let ch = 0; ch < 5; ch++) checkPatternChange(barNum, ch);

        if (barNum >= nextMutationBar) {
          const prob = (0.4 + state.intensity * 0.4 + dirRandomFactor * Math.random()) * arcParams.mutationRate;
          if (prob > CFG.directorChangeThreshold) {
            const camRoll = Math.random();
            if (camRoll < 0.55) executeMutation(null, globalTime);
            else if (camRoll < 0.80) { executeMutation(null, globalTime); if (autoCamera) pickAutoShot(state, W, H); }
            else { if (autoCamera) pickAutoShot(state, W, H); logMut('CAMERA', framing.current, globalTime); }
          }
          nextMutationBar = barNum + Math.round(pickNextBarTarget() / Math.max(0.5, arcParams.mutationRate));
          if (state.intensity > 0.7) nextMutationBar = barNum + Math.max(2, pickNextBarTarget() / 2);
        }
      }
    }
  } else {
    director.nextCheckIn -= dt;
    if (director.nextCheckIn <= 0) {
      let prob = 0.5 * arcParams.mutationRate;
      if (director.plateauTime > CFG.directorPlateauSec) prob += 0.3;
      prob += dirRandomFactor * Math.random();
      director.changeProb = Math.min(1, prob);
      if (prob > CFG.directorChangeThreshold) {
        const camRoll = Math.random();
        if (camRoll < 0.55) executeMutation(null, globalTime);
        else if (camRoll < 0.80) { executeMutation(null, globalTime); if (autoCamera) pickAutoShot(state, W, H); }
        else { if (autoCamera) pickAutoShot(state, W, H); logMut('CAMERA', framing.current, globalTime); }
      }
      computeNextCheck(state);
    }
  }

  // Camera ritmica — micro-pan on onset
  if (audio.onset) {
    framing._panImpulseX = (Math.random() - 0.5) * W * 0.02;
    framing._panImpulseY = (Math.random() - 0.5) * H * 0.01;
  }

  // Decay camera impulses
  framing._zoomImpulse *= Math.max(0, 1 - dt * 3);
  framing._panImpulseX *= Math.max(0, 1 - dt * 4);
  framing._panImpulseY *= Math.max(0, 1 - dt * 4);

  // Camera lerp with impulses
  const s = state.rhythmicity > 0.5 ? CFG.camLerpFast : CFG.camLerpSlow;
  framing.zoom += (framing.targetZoom + framing._zoomImpulse - framing.zoom) * s;
  framing.offsetX += (framing.targetX + framing._panImpulseX - framing.offsetX) * s;
  framing.offsetY += (framing.targetY + framing._panImpulseY - framing.offsetY) * s;

  if (framing.current === 'DRIFT') {
    const poi = findPOI();
    framing.targetX += ((0.5 - poi.x) * W * 0.4 - framing.targetX) * 0.01;
    framing.targetY += ((0.5 - poi.y) * H * 0.4 - framing.targetY) * 0.01;
  }

  if (framing.current === 'MACRO' && framing.macroTimer > 0) {
    framing.macroTimer -= dt;
    if (framing.macroTimer <= 0) {
      if (autoCamera) pickAutoShot(state, W, H);
      else setFraming('WIDE', W, H);
    }
  }
}

export function applyCamera(ctx, W, H) {
  ctx.translate(W / 2, H / 2);
  ctx.scale(framing.zoom, framing.zoom);
  ctx.translate(-W / 2 + framing.offsetX, -H / 2 + framing.offsetY);
}

// ── Sequencer camera requests (uses stored W, H) ──
export function requestFraming(type) {
  setFraming(type, _W, _H);
}

export function requestCameraShake(intensity) {
  framing._panImpulseX = (Math.random() - 0.5) * _W * intensity;
  framing._panImpulseY = (Math.random() - 0.5) * _H * intensity;
}

// ── Composer override ──
// Forza una fase dell'arco e blocca le transizioni audio-reattive
let _arcForcedPm = 0;

export function setArcPhaseForced(newPhase, pm = 1.0) {
  // Only the engine with highest presence controls the arc
  if (pm < _arcForcedPm - 0.05) return;  // hysteresis to prevent flutter
  _arcForcedPm = pm;
  if (arc.phase !== newPhase) {
    arc.phase = newPhase;
    arc.phaseTime = 0;
  }
  arc._stateHold = 999;
}

export function resetArcPriority() {
  _arcForcedPm = 0;
}

export function releaseArcHold() {
  arc._stateHold = 0;
}

// ── Modal composition — chiamato da macro-composer su mode change (V3) ────────
// Cambia solo le regioni di layout, senza toccare palette/dotSize/scena.
export function setCompositionForMode(mode) {
  const name = CFG.VISUAL.modeComposition?.[mode];
  if (!name || !COMPOSITIONS[name]) return;
  scene._regionsCurrent = scene.regions.length ? scene.regions.map(r => ({ ...r })) : [];
  scene._regionsTarget  = COMPOSITIONS[name];
  scene._compBlend      = 0; // avvia cross-fade
}

// ── Dimensioni canvas (aggiornate ogni frame da updateDirector) ──
let _W = 800, _H = 600, _state = {};

// ═══════════════════════════════════════════════════════════
//  EVENT BUS — binding semantico Composer 2 → Director
// ═══════════════════════════════════════════════════════════

export function initDirectorEvents() {
  onDirectorEvent('tension', ({ level }) => {
    if (level > 0.65 && autoCamera) pickAutoShot(_state, _W, _H);
  });

  onDirectorEvent('void', ({ ratio }) => {
    if (ratio > 0.55) {
      const sparse = SCENES.find(s => s.name === 'SPARSE');
      if (sparse) transitionToScene(sparse, false);
    }
  });

  onDirectorEvent('grain_entry', ({ intensity }) => {
    if (intensity > 0.4) setChromaticShift('all-B');
  });

  onDirectorEvent('chord_change', ({ mode }) => {
    if (CFG.V3_MODE) return; // palette gestita da setPaletteForMode in V3
    const map = {
      Cs_dorian: 'default', Cs_phrygian: 'default',
      Gs_lydian: 'cyan',    D_locrian: 'cold',
    };
    setPalette(map[mode] || 'default');
  });

  onDirectorEvent('rupture_stage', ({ stage }) => {
    const neg = SCENES.find(s => s.name === 'NEGATIVE');
    const den = SCENES.find(s => s.name === 'DENSE');
    if (stage === 'presagio'      && neg) transitionToScene(neg, false);
    if (stage === 'infiltrazione' && autoCamera) pickAutoShot(_state, _W, _H);
    if (stage === 'takeover') {
      arc._ruptureBoost = Math.min(0.3, arc._ruptureBoost + 0.15);
      setComposerClimax(true);
      if (den) transitionToScene(den, true);
    }
    if (stage === 'residuo') {
      setComposerClimax(false);
      if (autoCamera) setFraming('WIDE', _W, _H);
    }
  });

  onDirectorEvent('density_peak', () => {
    if (autoCamera) setFraming('MACRO', _W, _H);
  });
}
