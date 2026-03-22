// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Director (Mutations + Camera)
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { dna, PRIM_TYPES } from './dna.js';
import { entities } from './generations.js';
import { startInvertDissolve, setChromaticShift } from './colors.js';

// ── Mutation system ──
const MUTATION_TYPES = [
  { type: 'PRIMITIVE', weight: 30 },
  { type: 'INVERT', weight: 15 },
  { type: 'RESET_PARTIAL', weight: 15 },
  { type: 'CHROMATIC', weight: 25 },
  { type: 'SCALE', weight: 15 },
];
const TOTAL_WEIGHT = MUTATION_TYPES.reduce((s, m) => s + m.weight, 0);

export const director = {
  sceneTime: 0, nextCheckIn: 0, changeProb: 0,
  lastChangeType: '——', plateauTime: 0,
};

export const mutationLog = [];
let dirBaseInterval = 30, dirDivisorIdx = 1, dirRandomFactor = 0.3;
const DIVISORS = [4, 8, 16, 32];

function logMut(type, detail, globalTime) {
  mutationLog.unshift({ type, detail, time: globalTime });
  if (mutationLog.length > 5) mutationLog.pop();
}

function computeNextCheck(state) {
  if (state.rhythmicity > 0.5) {
    const bpm = CFG.directorBPM;
    director.nextCheckIn = DIVISORS[dirDivisorIdx] * (60 / bpm) * (0.8 + Math.random() * 0.4);
  } else {
    director.nextCheckIn = dirBaseInterval * (1 + dirRandomFactor * Math.random());
  }
}

export function initDirector(state) {
  director.sceneTime = 0;
  computeNextCheck(state);
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
  } else if (type === 'INVERT') {
    startInvertDissolve();
    logMut(type, 'dissolve', globalTime);
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
  } else if (type === 'SCALE') {
    if (dna) {
      const old = dna.dotSizeRange.join('-');
      if (Math.random() > 0.5) dna.dotSizeRange = [1, 2 + Math.floor(Math.random() * 4)];
      else dna.dotSizeRange = [6 + Math.floor(Math.random() * 4), 12 + Math.floor(Math.random() * 5)];
      logMut(type, `${old}→${dna.dotSizeRange.join('-')}`, globalTime);
    }
  }
}

// ── Camera ──
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

export function updateDirector(dt, state, globalTime, W, H) {
  director.sceneTime += dt;
  director.nextCheckIn -= dt;
  if (state.trajectory === 0) director.plateauTime += dt; else director.plateauTime = 0;

  if (director.nextCheckIn <= 0) {
    let prob = 0.5;
    if (director.plateauTime > CFG.directorPlateauSec) prob += 0.3;
    prob += dirRandomFactor * Math.random();
    director.changeProb = Math.min(1, prob);
    if (prob > CFG.directorChangeThreshold) {
      const camRoll = Math.random();
      if (camRoll < 0.60) executeMutation(null, globalTime);
      else if (camRoll < 0.85) { executeMutation(null, globalTime); if (autoCamera) pickAutoShot(state, W, H); }
      else { if (autoCamera) pickAutoShot(state, W, H); logMut('CAMERA', framing.current, globalTime); }
    }
    computeNextCheck(state);
  }

  // Camera lerp
  const s = state.rhythmicity > 0.5 ? CFG.camLerpFast : CFG.camLerpSlow;
  framing.zoom += (framing.targetZoom - framing.zoom) * s;
  framing.offsetX += (framing.targetX - framing.offsetX) * s;
  framing.offsetY += (framing.targetY - framing.offsetY) * s;

  // DRIFT: slowly follow POI
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
