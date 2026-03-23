// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Director (Scenes + Arc + Mutations + Camera)
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { audio } from './audio.js';
import { dna, PRIM_TYPES } from './dna.js';
import { entities } from './generations.js';
import { startInvertDissolve, setChromaticShift, setPalette } from './colors.js';
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
    densityMul: 0.7,
    dotSize: 10,
    midiScale: 1.2,
    invertBase: true,
    composition: 'MONDRIAN_B',
  },
  {
    name: 'SPARSE',
    palette: 'default',
    densityMul: 0.2,
    dotSize: 3,
    midiScale: 2.0,
    invertBase: false,
    composition: 'ISLANDS',
  },
  {
    name: 'DENSE',
    palette: 'warm',
    densityMul: 1.6,
    dotSize: 4,
    midiScale: 0.6,
    invertBase: false,
    composition: 'COLUMNS',
  },
  {
    name: 'MONOCHROME',
    palette: 'bw',
    densityMul: 1.0,
    dotSize: 8,
    midiScale: 1.0,
    invertBase: false,
    composition: 'FRAME',
  },
  {
    name: 'NEGATIVE',
    palette: 'default',
    densityMul: 0.9,
    dotSize: 6,
    midiScale: 1.0,
    invertBase: true,
    composition: 'ASYMMETRIC',
  },
  {
    name: 'MONDRIAN',
    palette: 'cold',
    densityMul: 0.8,
    dotSize: 8,
    midiScale: 1.4,
    invertBase: false,
    composition: 'MONDRIAN_A',
  },
  {
    name: 'HORIZON',
    palette: 'cyan',
    densityMul: 0.6,
    dotSize: 6,
    midiScale: 1.5,
    invertBase: false,
    composition: 'HORIZON',
  },
];

// Colored ground palette variants (picked randomly)
const COLORED_PALETTES = ['amber', 'cyan', 'magenta', 'warm', 'cold'];

// ═══════════════════════════════════════════════════════════
//  COMPOSITIONS — Spatial density layouts
// ═══════════════════════════════════════════════════════════

const COMPOSITIONS = {
  UNIFORM: [],
  // Mondrian: pannello sinistro denso, centro vuoto, colonna destra
  MONDRIAN_A: [
    { x: 0, y: 0, w: 0.38, h: 0.55, mul: 2.5 },
    { x: 0, y: 0.55, w: 0.38, h: 0.45, mul: 0.04 },
    { x: 0.38, y: 0, w: 0.02, h: 1, mul: 3.0 },    // linea verticale
    { x: 0.40, y: 0, w: 0.35, h: 1, mul: 0.02 },    // centro vuoto
    { x: 0.75, y: 0, w: 0.02, h: 1, mul: 3.0 },    // linea verticale
    { x: 0.77, y: 0, w: 0.23, h: 0.35, mul: 0.04 },
    { x: 0.77, y: 0.35, w: 0.23, h: 0.65, mul: 2.2 },
  ],
  // Mondrian: griglia 3×2 con blocchi alternati
  MONDRIAN_B: [
    { x: 0, y: 0, w: 0.30, h: 0.45, mul: 2.8 },
    { x: 0.30, y: 0, w: 0.40, h: 0.45, mul: 0.03 },
    { x: 0.70, y: 0, w: 0.30, h: 0.45, mul: 1.8 },
    { x: 0, y: 0.45, w: 0.02, h: 0.02, mul: 3.5 },  // nodo
    { x: 0, y: 0.47, w: 0.50, h: 0.53, mul: 0.05 },
    { x: 0.50, y: 0.47, w: 0.50, h: 0.25, mul: 2.4 },
    { x: 0.50, y: 0.72, w: 0.50, h: 0.28, mul: 0.03 },
  ],
  // Colonne verticali tipo Rothko/Mondrian
  COLUMNS: [
    { x: 0, y: 0, w: 0.18, h: 1, mul: 2.5 },
    { x: 0.18, y: 0, w: 0.24, h: 1, mul: 0.02 },
    { x: 0.42, y: 0, w: 0.16, h: 1, mul: 3.0 },
    { x: 0.58, y: 0, w: 0.22, h: 1, mul: 0.02 },
    { x: 0.80, y: 0, w: 0.20, h: 1, mul: 1.8 },
  ],
  // Striscia orizzontale con bordi vuoti
  HORIZON: [
    { x: 0, y: 0, w: 1, h: 0.30, mul: 0.03 },
    { x: 0, y: 0.30, w: 1, h: 0.02, mul: 3.5 },   // linea
    { x: 0, y: 0.32, w: 1, h: 0.20, mul: 2.5 },
    { x: 0, y: 0.52, w: 1, h: 0.02, mul: 3.5 },   // linea
    { x: 0, y: 0.54, w: 1, h: 0.46, mul: 0.03 },
  ],
  // Vuoto al centro, densità ai bordi — rettangolare
  FRAME: [
    { x: 0, y: 0, w: 1, h: 0.12, mul: 2.5 },
    { x: 0, y: 0.88, w: 1, h: 0.12, mul: 2.5 },
    { x: 0, y: 0.12, w: 0.12, h: 0.76, mul: 2.5 },
    { x: 0.88, y: 0.12, w: 0.12, h: 0.76, mul: 2.5 },
    { x: 0.12, y: 0.12, w: 0.76, h: 0.76, mul: 0.02 },
  ],
  // Blocchi isolati su sfondo vuoto — isole rettangolari
  ISLANDS: [
    { x: 0, y: 0, w: 1, h: 1, mul: 0.02 },           // base quasi vuota
    { x: 0.05, y: 0.05, w: 0.22, h: 0.15, mul: 80 }, // isola (2.5/0.02*0.65)
    { x: 0.62, y: 0.18, w: 0.15, h: 0.28, mul: 70 },
    { x: 0.25, y: 0.60, w: 0.30, h: 0.12, mul: 90 },
    { x: 0.78, y: 0.75, w: 0.18, h: 0.20, mul: 60 },
  ],
  // Asimmetrico con peso a destra
  ASYMMETRIC: [
    { x: 0, y: 0, w: 0.60, h: 1, mul: 0.04 },
    { x: 0.60, y: 0, w: 0.02, h: 1, mul: 3.5 },     // linea
    { x: 0.62, y: 0, w: 0.38, h: 0.50, mul: 2.8 },
    { x: 0.62, y: 0.50, w: 0.38, h: 0.50, mul: 0.05 },
  ],
};

// ═══════════════════════════════════════════════════════════
//  NARRATIVE ARC
// ═══════════════════════════════════════════════════════════

export const arc = {
  totalTime: 0,
  phase: 'INTRO',     // INTRO, DEVELOP, TENSION, CLIMAX, RELEASE
  tensionAccum: 0,
  releaseTimer: 0,
  sceneHistory: [],
};

function updateArc(dt, state) {
  arc.totalTime += dt;

  if (arc.phase === 'INTRO') {
    if (arc.totalTime > CFG.arcIntroDuration) arc.phase = 'DEVELOP';
  } else if (arc.phase === 'DEVELOP') {
    if (arc.totalTime > CFG.arcDevelopEnd && state.intensity > CFG.arcTensionThreshold) {
      arc.tensionAccum += dt;
      if (arc.tensionAccum > 10) arc.phase = 'TENSION';
    } else {
      arc.tensionAccum = Math.max(0, arc.tensionAccum - dt * 0.5);
    }
  } else if (arc.phase === 'TENSION') {
    if (state.intensity > CFG.arcTensionThreshold) {
      arc.tensionAccum += dt;
      if (arc.tensionAccum > CFG.arcTensionBuildSec) arc.phase = 'CLIMAX';
    } else {
      arc.tensionAccum = Math.max(0, arc.tensionAccum - dt * 2);
      if (arc.tensionAccum < 5) arc.phase = 'DEVELOP';
    }
  } else if (arc.phase === 'CLIMAX') {
    if (state.intensity < 0.3) {
      arc.phase = 'RELEASE';
      arc.releaseTimer = CFG.arcReleaseDuration;
    }
  } else if (arc.phase === 'RELEASE') {
    arc.releaseTimer -= dt;
    if (arc.releaseTimer <= 0) {
      arc.phase = 'DEVELOP';
      arc.tensionAccum = 0;
    }
  }
}

function pickScene() {
  const weights = SCENES.map(() => 1);

  if (arc.phase === 'INTRO') {
    SCENES.forEach((s, i) => {
      if (s.name !== 'BAYER_CLASSIC' && s.name !== 'SPARSE' && s.name !== 'MONDRIAN') weights[i] = 0;
    });
  } else if (arc.phase === 'RELEASE') {
    SCENES.forEach((s, i) => {
      if (s.name === 'SPARSE' || s.name === 'MONOCHROME' || s.name === 'HORIZON') weights[i] = 3;
      else if (s.name === 'DENSE') weights[i] = 0;
    });
  } else if (arc.phase === 'TENSION' || arc.phase === 'CLIMAX') {
    SCENES.forEach((s, i) => {
      if (s.name === 'DENSE' || s.name === 'COLORED_GROUND' || s.name === 'MONDRIAN') weights[i] = 2.5;
      if (s.name === 'SPARSE') weights[i] = 0.3;
    });
  }

  // Avoid repeating recent scenes
  for (const recent of arc.sceneHistory.slice(0, 2)) {
    const idx = SCENES.findIndex(s => s.name === recent);
    if (idx >= 0) weights[idx] *= 0.2;
  }

  const total = weights.reduce((a, b) => a + b, 0);
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
  _regionsTarget: [],
};

function transitionToScene(newScene, instant) {
  scene.target = newScene;
  if (instant) {
    scene.current = newScene;
    scene.blend = 1.0;
  } else {
    scene.blend = 0;
    scene.blendSpeed = 1 / (CFG.sceneTransitionBars * 2); // seconds approximation
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

  // Set composition target
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

  // Lerp composition regions
  if (t >= 1) {
    scene.current = scene.target;
    scene.regions = scene._regionsTarget;
  } else {
    // During transition, blend region muls toward target
    // If lengths differ, snap regions at blend 0.5
    if (t > 0.5) scene.regions = scene._regionsTarget;
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

const BAR_OPTIONS = [1, 2, 2, 4, 4, 8];

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
  if (state.intensity < 0.3) setFraming('WIDE', W, H);
  else if (state.rhythmicity > 0.6 && Math.random() < 0.4) setFraming('MACRO', W, H);
  else if (state.trajectory === 0) setFraming('DRIFT', W, H);
  else setFraming('MEDIUM', W, H);
}

// ═══════════════════════════════════════════════════════════
//  MAIN UPDATE
// ═══════════════════════════════════════════════════════════

export function updateDirector(dt, state, globalTime, W, H) {
  director.sceneTime += dt;
  if (state.trajectory === 0) director.plateauTime += dt; else director.plateauTime = 0;

  // Update narrative arc
  updateArc(dt, state);
  updateSceneBlend(dt);

  // Arc-driven density clamping
  if (arc.phase === 'INTRO') {
    scene.densityMul = Math.min(scene.densityMul, 0.4 + arc.totalTime / CFG.arcIntroDuration * 0.6);
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
          const prob = 0.4 + state.intensity * 0.4 + dirRandomFactor * Math.random();
          if (prob > CFG.directorChangeThreshold) {
            const camRoll = Math.random();
            if (camRoll < 0.55) executeMutation(null, globalTime);
            else if (camRoll < 0.80) { executeMutation(null, globalTime); if (autoCamera) pickAutoShot(state, W, H); }
            else { if (autoCamera) pickAutoShot(state, W, H); logMut('CAMERA', framing.current, globalTime); }
          }
          nextMutationBar = barNum + pickNextBarTarget();
          if (state.intensity > 0.7) nextMutationBar = barNum + Math.max(2, pickNextBarTarget() / 2);
        }
      }
    }
  } else {
    director.nextCheckIn -= dt;
    if (director.nextCheckIn <= 0) {
      let prob = 0.5;
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
