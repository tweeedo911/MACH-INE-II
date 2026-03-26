// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Generations (Entity Lifecycle)
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { dna, primState, isInVuoto, getZone } from './dna.js';
import { firma } from './sequencer.js';

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
  const zone = getZone(pos.x, pos.y);
  // Zone birthMul gates: low birthMul zones reject more spawns
  if (Math.random() > zone.birthMul) return null;
  // Zone color affinity: if zone has a color, entities born there inherit it
  const finalColor = color || zone.colorAffinity || null;
  const life = CFG.entityLifeMin + Math.random() * (CFG.entityLifeMax - CFG.entityLifeMin);
  return {
    x: pos.x, y: pos.y,
    density: 0.4 + Math.random() * 0.5,
    age: 0,
    maxAge: life / (dna ? dna.evolutionSpeed : 1),
    dotSizeOffset: 0,
    color: finalColor,
    colorAlpha: finalColor ? 0.8 : 0,
  };
}

// ── Spawn entities from audio onset ──
export function triggerOnset(state, colorEnabled) {
  const color = colorEnabled.A ? 'A' : null;
  const burstCount = Math.round(CFG.onsetBurstCount * Math.max(0.1, state.intensity));
  for (let i = 0; i < burstCount && entities.length < CFG.maxEntities; i++) {
    const e = spawnEntity(state, color);
    if (e) entities.push(e);
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
export function triggerMIDI(state, colorEnabled, noteNorm, velNorm) {
  const x = noteNorm !== undefined ? noteNorm : Math.random();
  const vel = velNorm !== undefined ? velNorm : 0.5;
  const color = colorEnabled.B ? 'B' : null;

  // Velocity controls burst size: soft note = few, hard note = many
  const burstCount = Math.round(CFG.midiBurstCount * (0.2 + vel * 0.8));

  // Pitch controls vertical position: low notes = bottom, high notes = top
  const yCenter = 1 - noteNorm;

  // Spawn entities at note position with pitch-based spread
  const spread = 0.06 + (1 - vel) * 0.04; // soft = wider, hard = tighter
  for (let i = 0; i < burstCount && entities.length < CFG.maxEntities; i++) {
    const e = spawnEntity(state, color);
    if (!e) continue;
    e.x = x + (Math.random() - 0.5) * spread;
    e.y = yCenter + (Math.random() - 0.5) * spread;
    e.x = Math.max(0, Math.min(1, e.x));
    e.y = Math.max(0, Math.min(1, e.y));
    e.color = color || 'B';
    e.colorAlpha = 0.5 + vel * 0.5; // velocity = color intensity
    e.density = 0.3 + vel * 0.6;    // velocity = visual weight
    entities.push(e);
  }

  // Illuminate nearby entities — MIDI note colors a zone-sized area
  const radius = 0.1 + vel * 0.1;
  for (const e of entities) {
    const dx = e.x - x, dy = e.y - yCenter;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius && e.color !== 'B') {
      e.color = 'B';
      e.colorAlpha = Math.max(e.colorAlpha, (1 - dist / radius) * vel * 0.5);
    }
  }
  return x;
}

// ── Per-frame update ──
export function updateGenerations(dt, state, evoSpeed, inClimax, climaxProgress, colorEnabled, chromaticMode) {
  // GELO — freeze all entity aging and birth
  if (firma.gelo) {
    // Only apply convergenza movement during gelo (if both active)
    if (firma.convergenza) {
      for (const e of entities) {
        e.x += (0.5 - e.x) * dt * 0.3;
        e.y += (0.5 - e.y) * dt * 0.3;
      }
    }
    return;
  }

  // CONVERGENZA — attract entities toward center
  if (firma.convergenza) {
    for (const e of entities) {
      e.x += (0.5 - e.x) * dt * 0.3;
      e.y += (0.5 - e.y) * dt * 0.3;
    }
  }

  const evoDt = dt * evoSpeed * (dna ? dna.evolutionSpeed : 1);

  // Birth — threshold prevents spawning at near-silence
  if (state.intensity > 0.05 && entities.length < CFG.maxEntities) {
    const rate = CFG.birthRateMin + (CFG.birthRateMax - CFG.birthRateMin) * Math.pow(state.intensity, 1.5);
    birthAccum += rate * dt;
    let birthColor = null;
    if (chromaticMode === 'all-A' && colorEnabled.A) birthColor = 'A';
    else if (chromaticMode === 'all-B' && colorEnabled.B) birthColor = 'B';
    while (birthAccum >= 1 && entities.length < CFG.maxEntities) {
      const e = spawnEntity(state, birthColor);
      if (e) entities.push(e);
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
      entities[i] = entities[entities.length - 1];
      entities.length--;
    }
  }

  for (let i = fossils.length - 1; i >= 0; i--) {
    fossils[i].age += dt;
    if (fossils[i].age >= fossils[i].life) {
      fossils[i] = fossils[fossils.length - 1];
      fossils.length--;
    }
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
