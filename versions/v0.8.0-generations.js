// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Generations (Entity Lifecycle)
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { dna, primState, isInVuoto } from './dna.js';

export let entities = [];
export let fossils = [];
let birthAccum = 0;

// ── Spatial hash for entity density + color ──
export let entityGrid = null;
export let entityColorGrid = null;
export let entityColorAlphaGrid = null;
let entityGridCols = 0, entityGridRows = 0;
const GRID_CELL = 32;

const COLOR_ID = { A: 1, B: 2, C: 3 };

// ── Birth position ──
function birthPosition(state) {
  let x = Math.random(), y = Math.random();
  if (dna && dna.freqMapping === 'horizontal') {
    x = 0.1 + Math.random() * 0.8;
  } else if (dna && dna.freqMapping === 'radial') {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.1 + Math.random() * 0.35;
    x = 0.5 + Math.cos(angle) * r;
    y = 0.5 + Math.sin(angle) * r;
  }
  if (state.stereoWidth < 1) {
    x = 0.5 + (x - 0.5) * (0.2 + state.stereoWidth * 0.8);
  }
  if (dna && dna.primitives.includes('SCIAME')) {
    const sc = primState.sciameCenter;
    const disp = (1 - dna.sciame.cohesion) * (0.15 + state.stereoWidth * 0.3);
    x = sc.x + (Math.random() - 0.5) * disp;
    y = sc.y + (Math.random() - 0.5) * disp;
  }
  return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
}

function spawnEntity(state, color) {
  const pos = birthPosition(state);
  const life = CFG.entityLifeMin + Math.random() * (CFG.entityLifeMax - CFG.entityLifeMin);
  return {
    x: pos.x, y: pos.y,
    density: 0.4 + Math.random() * 0.5,
    age: 0,
    maxAge: life / (dna ? dna.evolutionSpeed : 1),
    dotSizeOffset: 0,
    color: color || null,
    colorAlpha: color ? 1.0 : 0,
  };
}

// ── Spawn entities from audio onset ──
export function triggerOnset(state, colorEnabled) {
  const color = colorEnabled.A ? 'A' : null;
  for (let i = 0; i < CFG.onsetBurstCount && entities.length < CFG.maxEntities; i++) {
    entities.push(spawnEntity(state, color));
  }
  // Color contamination: A invades nearby B
  if (colorEnabled.A) {
    const waveNx = 0.2 + Math.random() * 0.6;
    const waveNy = 0.2 + Math.random() * 0.6;
    for (const e of entities) {
      if (e.color === 'B') {
        const dx = e.x - waveNx, dy = e.y - waveNy;
        if (Math.sqrt(dx * dx + dy * dy) < 0.15) {
          e.color = 'A';
          e.colorAlpha = Math.max(0.3, e.colorAlpha * 0.5);
        }
      }
    }
  }
  return { cx: (0.2 + Math.random() * 0.6), cy: (0.2 + Math.random() * 0.6) };
}

// ── Spawn entities from MIDI note ──
export function triggerMIDI(state, colorEnabled, noteNorm) {
  const x = noteNorm !== undefined ? noteNorm : Math.random();
  const color = colorEnabled.B ? 'B' : null;
  for (let i = 0; i < CFG.midiBurstCount && entities.length < CFG.maxEntities; i++) {
    const e = spawnEntity(state, color);
    e.x = x + (Math.random() - 0.5) * 0.05;
    entities.push(e);
  }
  return x;
}

// ── Per-frame update ──
export function updateGenerations(dt, state, evoSpeed, inClimax, climaxProgress, colorEnabled, chromaticMode) {
  const evoDt = dt * evoSpeed * (dna ? dna.evolutionSpeed : 1);

  // Birth
  if (state.intensity > 0.01 && entities.length < CFG.maxEntities) {
    const rate = CFG.birthRateMin + (CFG.birthRateMax - CFG.birthRateMin) * state.intensity;
    birthAccum += rate * dt;
    let birthColor = null;
    if (chromaticMode === 'all-A' && colorEnabled.A) birthColor = 'A';
    else if (chromaticMode === 'all-B' && colorEnabled.B) birthColor = 'B';
    while (birthAccum >= 1 && entities.length < CFG.maxEntities) {
      entities.push(spawnEntity(state, birthColor));
      birthAccum -= 1;
    }
  }

  const postClimax = !inClimax && climaxProgress > 0.1;

  for (let i = entities.length - 1; i >= 0; i--) {
    const e = entities[i];
    if (postClimax) e.age += dt * CFG.climaxCollapseSpeed;
    e.age += evoDt;
    const ageNorm = e.age / e.maxAge;

    if (isInVuoto(e.x, e.y)) e.age = e.maxAge;

    if (ageNorm < 0.2) e.dotSizeOffset = 0;
    else if (ageNorm < 0.6) e.dotSizeOffset = 0;
    else if (ageNorm < 0.9) e.dotSizeOffset = ((ageNorm - 0.6) / 0.3) * CFG.ageDotSizeGrowth;
    else e.dotSizeOffset = CFG.ageDotSizeGrowth;

    // Color decay
    if (e.color) {
      if (ageNorm < CFG.colorDecayStart) e.colorAlpha = 1.0;
      else if (ageNorm < CFG.colorDecayEnd) e.colorAlpha = 1.0 - (ageNorm - CFG.colorDecayStart) / (CFG.colorDecayEnd - CFG.colorDecayStart);
      else e.colorAlpha = 0;
    }

    // Climax shift to C
    if (inClimax && colorEnabled.C) {
      if (!e.color) { e.color = 'C'; e.colorAlpha = 0; }
      if (e.color !== 'C') {
        e.colorAlpha *= (1 - CFG.climaxShiftSpeed * dt);
        if (e.colorAlpha < 0.1) { e.color = 'C'; e.colorAlpha = 0.1; }
      }
      if (e.color === 'C') e.colorAlpha = Math.min(1, e.colorAlpha + CFG.climaxShiftSpeed * dt);
    }

    if (ageNorm >= 1) {
      fossils.push({ x: e.x, y: e.y, density: CFG.fossilDensity, life: CFG.fossilDuration, age: 0 });
      entities.splice(i, 1);
    }
  }

  for (let i = fossils.length - 1; i >= 0; i--) {
    fossils[i].age += dt;
    if (fossils[i].age >= fossils[i].life) fossils.splice(i, 1);
  }
}

// ── Build spatial hash ──
export function buildEntityGrid(W, H) {
  entityGridCols = Math.ceil(W / GRID_CELL);
  entityGridRows = Math.ceil(H / GRID_CELL);
  const cells = entityGridCols * entityGridRows;

  if (!entityGrid || entityGrid.length !== cells) {
    entityGrid = new Float32Array(cells);
    entityColorGrid = new Uint8Array(cells);
    entityColorAlphaGrid = new Float32Array(cells);
  }
  entityGrid.fill(0);
  entityColorGrid.fill(0);
  entityColorAlphaGrid.fill(0);

  const youngestAge = new Float32Array(cells);
  youngestAge.fill(999);

  for (const e of entities) {
    const ageNorm = e.age / e.maxAge;
    let eDensity = e.density;
    if (ageNorm < 0.2) eDensity *= ageNorm / 0.2;
    else if (ageNorm > 0.6) eDensity *= 1 - ((ageNorm - 0.6) / 0.4) * 0.8;

    const col = Math.floor(e.x * W / GRID_CELL);
    const row = Math.floor(e.y * H / GRID_CELL);
    if (col >= 0 && col < entityGridCols && row >= 0 && row < entityGridRows) {
      const idx = row * entityGridCols + col;
      entityGrid[idx] += eDensity;
      if (e.color && e.colorAlpha > 0.01 && ageNorm < youngestAge[idx]) {
        youngestAge[idx] = ageNorm;
        entityColorGrid[idx] = COLOR_ID[e.color] || 0;
        entityColorAlphaGrid[idx] = e.colorAlpha;
      }
    }
  }

  for (const f of fossils) {
    const fadeFrac = f.age / f.life;
    const col = Math.floor(f.x * W / GRID_CELL);
    const row = Math.floor(f.y * H / GRID_CELL);
    if (col >= 0 && col < entityGridCols && row >= 0 && row < entityGridRows) {
      entityGrid[row * entityGridCols + col] += f.density * (1 - fadeFrac);
    }
  }
}

export function entityDensityAt(nx, ny, W, H) {
  if (!entityGrid) return 0;
  const col = Math.floor(nx * W / GRID_CELL);
  const row = Math.floor(ny * H / GRID_CELL);
  if (col < 0 || col >= entityGridCols || row < 0 || row >= entityGridRows) return 0;
  return Math.min(1, entityGrid[row * entityGridCols + col]);
}

export function entityColorAt(nx, ny, W, H) {
  if (!entityColorGrid) return [0, 0];
  const col = Math.floor(nx * W / GRID_CELL);
  const row = Math.floor(ny * H / GRID_CELL);
  if (col < 0 || col >= entityGridCols || row < 0 || row >= entityGridRows) return [0, 0];
  const idx = row * entityGridCols + col;
  return [entityColorGrid[idx], entityColorAlphaGrid[idx]];
}

// ── Reset ──
export function resetGenerations() {
  entities = [];
  fossils = [];
  birthAccum = 0;
}
