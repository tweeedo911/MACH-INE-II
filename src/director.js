// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Director (Scenes + Arc + Mutations + Camera)
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { audio } from './audio.js';
import { dna, PRIM_TYPES } from './dna.js';
import { entities } from './generations.js';
import { startInvertDissolve, setChromaticShift, setPalette, setComposerClimax } from './colors.js';
import { on as onDirectorEvent } from './director-events.js';
import { checkPatternChange } from './midi-patterns.js';

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

  if (arc._stateHold > 0) return; // isteresi — no flicker

  switch (arc.phase) {
    case 'SILENCE':
      if (rms > CFG.arcRmsBuilding && traj === 1) setArcPhase('BUILDING');
      else if (rms > CFG.arcRmsActive) setArcPhase('ACTIVE');
      break;
    case 'BUILDING':
      if (rms < CFG.arcRmsSilence) setArcPhase('SILENCE');
      else if (rms > CFG.arcRmsActive && rhyt > 0.25) setArcPhase('ACTIVE');
      break;
    case 'ACTIVE':
      if (rms < CFG.arcRmsSilence) setArcPhase('SILENCE');
      else if (rms < CFG.arcRmsBuilding && traj === -1) setArcPhase('BUILDING');
      else if (rms > CFG.arcRmsIntense && flux > CFG.arcFluxIntense) setArcPhase('INTENSE');
      break;
    case 'INTENSE':
      if (rms < CFG.arcRmsBuilding) setArcPhase('ACTIVE');
      else if (rms > CFG.arcRmsPeak) setArcPhase('PEAK');
      break;
    case 'PEAK':
      if (rms < CFG.arcRmsIntense && traj === -1) setArcPhase('DECAY');
      break;
    case 'DECAY':
      if (rms < CFG.arcRmsSilence) setArcPhase('SILENCE');
      else if (rms > CFG.arcRmsIntense && traj === 1) setArcPhase('ACTIVE');
      else if (rms > CFG.arcRmsPeak) setArcPhase('PEAK');
      break;
  }
}

function pickScene() {
  const params = ARC_PARAMS[arc.phase];
  const weights = SCENES.map((s) => {
    if (params.allowedScenes && !params.allowedScenes.includes(s.name)) return 0;
    return 1;
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

  // Apply palette
  let palName = newScene.palette;
  if (newScene.name === 'COLORED_GROUND') {
    palName = COLORED_PALETTES[Math.floor(Math.random() * COLORED_PALETTES.length)];
  }
  setPalette(palName);

  // Apply invert
  if (newScene.invertBase !== scene.current.invertBase) {
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

  // Lerp composition regions — cross-fade instead of snap
  if (t >= 1) {
    scene.current = scene.target;
    scene.regions = scene._regionsTarget;
  } else if (scene._regionsCurrent && scene._regionsCurrent.length === scene._regionsTarget.length) {
    // Same length: interpolate mul values
    scene.regions = scene._regionsCurrent.map((r, i) => ({
      x: r.x + (scene._regionsTarget[i].x - r.x) * t,
      y: r.y + (scene._regionsTarget[i].y - r.y) * t,
      w: r.w + (scene._regionsTarget[i].w - r.w) * t,
      h: r.h + (scene._regionsTarget[i].h - r.h) * t,
      mul: r.mul + (scene._regionsTarget[i].mul - r.mul) * t,
    }));
  } else {
    // Different lengths: cross-fade old (decreasing) + new (increasing)
    const oldRegs = (scene._regionsCurrent || []).map(r => ({ ...r, mul: r.mul * (1 - t) }));
    const newRegs = scene._regionsTarget.map(r => ({ ...r, mul: r.mul * t }));
    scene.regions = [...oldRegs, ...newRegs];
  }
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

  if (cam === 'WIDE_ONLY') return setFraming('WIDE', W, H);
  if (cam === 'MACRO_LOCK') return setFraming('MACRO', W, H);
  if (cam === 'SLOW_WIDE') {
    // Gentle zoom out
    framing.targetZoom = 1.0;
    framing.current = 'WIDE';
    return;
  }
  if (cam === 'TIGHTEN') {
    // Progressively tighter during TENSION
    const progress = Math.min(1, arc.phaseTime / 90);
    if (progress < 0.5) setFraming('MEDIUM', W, H);
    else setFraming('MACRO', W, H);
    return;
  }
  // DRIFT_BIAS — default for DEVELOP
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
  director.sceneTime += dt;
  if (state.trajectory === 0) director.plateauTime += dt; else director.plateauTime = 0;

  // Update narrative arc
  updateArc(dt, state);
  updateSceneBlend(dt);

  // Arc-driven density clamping
  const arcParams = ARC_PARAMS[arc.phase] || ARC_PARAMS.ACTIVE;
  if (arc.phase === 'SILENCE') {
    scene.densityMul = Math.min(scene.densityMul, 0.04 + arc.phaseTime * 0.008);
  } else if (arc.phase === 'BUILDING') {
    scene.densityMul = Math.min(scene.densityMul, 0.08 + arc.phaseTime * 0.015);
  } else {
    scene.densityMul = Math.min(scene.densityMul, arcParams.densityCap);
  }

  const bpm = audio.bpm;
  const hasRhythm = bpm > 0 && state.rhythmicity > 0.3;

  if (hasRhythm) {
    const beatDuration = 60 / bpm;
    director.beatAccum += dt;

    if (director.beatAccum >= beatDuration) {
      director.beatAccum -= beatDuration;
      director.barCount++;

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

  // Camera lerp
  const s = state.rhythmicity > 0.5 ? CFG.camLerpFast : CFG.camLerpSlow;
  framing.zoom += (framing.targetZoom - framing.zoom) * s;
  framing.offsetX += (framing.targetX - framing.offsetX) * s;
  framing.offsetY += (framing.targetY - framing.offsetY) * s;

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

// ── Composer override ──
// Forza una fase dell'arco e blocca le transizioni audio-reattive
export function setArcPhaseForced(newPhase) {
  arc.phase = newPhase;
  arc.phaseTime = 0;
  arc._stateHold = 999;
}

export function releaseArcHold() {
  arc._stateHold = 0;
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
