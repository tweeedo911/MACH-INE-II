// ═══════════════════════════════════════════════════════════
//  MACH:INE II — DNA System + Primitives + Zones
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';

export const PRIM_TYPES = ['BANDA', 'BLOCCO', 'VETTORE', 'VUOTO', 'FRONTE', 'SCIAME', 'STRISCIA', 'MATRICE'];
const FREQ_MAPPINGS = ['horizontal', 'vertical', 'radial', 'diagonal'];
const ORIENTATIONS = ['horizontal', 'vertical', 'diagonal'];

export let dna = null;
export let primState = {};
export let zoneSeeds = null;
let zoneLookup = null;
const ZONE_RES = 24;

// ── Generate DNA ──
export function generateDNA() {
  const count = 2 + Math.floor(Math.random() * 2);
  const shuffled = [...PRIM_TYPES].sort(() => Math.random() - 0.5);

  dna = {
    primitives: shuffled.slice(0, count),
    freqMapping: FREQ_MAPPINGS[Math.floor(Math.random() * FREQ_MAPPINGS.length)],
    dotSizeRange: [1 + Math.floor(Math.random() * 3), 10 + Math.floor(Math.random() * 7)],
    evolutionSpeed: 0.4 + Math.random() * 1.2,
    invertProbability: Math.random() * 0.2,

    banda: {
      orientation: ORIENTATIONS[Math.floor(Math.random() * ORIENTATIONS.length)],
      count: 1 + Math.floor(Math.random() * 4),
      widthRange: [0.01 + Math.random() * 0.03, 0.06 + Math.random() * 0.12],
      speed: 0.05 + Math.random() * 0.4,
    },
    blocco: {
      count: 2 + Math.floor(Math.random() * 4),
      sizeRange: [0.03 + Math.random() * 0.05, 0.1 + Math.random() * 0.15],
      dotMul: Math.random() > 0.5 ? 0.3 : 2.5,
    },
    vettore: { angle: Math.random() * Math.PI, strength: 0.3 + Math.random() * 0.5 },
    vuoto: {
      shape: ['rect', 'circle', 'band'][Math.floor(Math.random() * 3)],
      size: 0.1 + Math.random() * 0.25,
      speed: 0.02 + Math.random() * 0.06,
    },
    fronte: {
      orientation: Math.random() > 0.5 ? 'horizontal' : 'vertical',
      speed: 0.05 + Math.random() * 0.15,
    },
    sciame: {
      count: 40 + Math.floor(Math.random() * 80),
      cohesion: 0.3 + Math.random() * 0.6,
      dotSize: [1, 1 + Math.floor(Math.random() * 3)],
    },
    striscia: {
      orientation: ORIENTATIONS[Math.floor(Math.random() * ORIENTATIONS.length)],
      spacing: 4 + Math.floor(Math.random() * 16),
      lineWidth: 1 + Math.floor(Math.random() * 2),
    },
    matrice: { cellSize: 10 + Math.floor(Math.random() * 14), chars: '▲▼◆○□▸∙:;|!01×÷∞' },
  };

  generateZones();
  initPrimitiveState();
}

// ── Zone archetypes ──
// reactivity: 0 = static (ignores audio), 1 = fully reactive
const ZONE_ARCHETYPES = [
  // SOLIDO: solid color blocks, barely reactive
  { dotSizeMul: [0.15, 0.35], densityMul: [1.4, 1.9], flickerAmp: [0, 0.01], flickerSpeed: [0.5, 1.5], birthMul: [1.3, 1.8], colorAffinity: 'A', reactivity: [0.1, 0.25] },
  // GRANA GROSSA: large dots, low reactivity — monumental
  { dotSizeMul: [1.8, 2.8], densityMul: [0.7, 1.0], flickerAmp: [0, 0.01], flickerSpeed: [1, 2], birthMul: [0.5, 0.8], colorAffinity: null, reactivity: [0.15, 0.3] },
  // RITMICO: follows the music strongly — high reactivity, strong flicker
  { dotSizeMul: [0.7, 1.1], densityMul: [0.9, 1.3], flickerAmp: [0.10, 0.18], flickerSpeed: [2, 6], birthMul: [1.0, 1.4], colorAffinity: null, reactivity: [0.85, 1.0] },
  // RAREFATTO: sparse, almost inert — very low reactivity
  { dotSizeMul: [0.4, 0.7], densityMul: [0.3, 0.5], flickerAmp: [0, 0.005], flickerSpeed: [0.2, 0.5], birthMul: [0.2, 0.4], colorAffinity: null, reactivity: [0.02, 0.08] },
  // CROMATICO: colored, moderate reactivity
  { dotSizeMul: [0.3, 0.6], densityMul: [1.2, 1.6], flickerAmp: [0.02, 0.05], flickerSpeed: [1, 3], birthMul: [1.1, 1.5], colorAffinity: 'B', reactivity: [0.3, 0.5] },
  // DENSO MEDIO: balanced, moderate reactivity
  { dotSizeMul: [0.9, 1.3], densityMul: [1.0, 1.3], flickerAmp: [0.01, 0.03], flickerSpeed: [1.5, 3], birthMul: [0.8, 1.2], colorAffinity: null, reactivity: [0.4, 0.6] },
];

function pickArchetype() {
  return ZONE_ARCHETYPES[Math.floor(Math.random() * ZONE_ARCHETYPES.length)];
}

function lerp(a, b) { return a + Math.random() * (b - a); }

// ── Voronoi-like zones ──
function generateZones() {
  zoneSeeds = [];
  for (let i = 0; i < CFG.zoneCount; i++) {
    const arch = pickArchetype();
    zoneSeeds.push({
      x: Math.random(), y: Math.random(),
      dotSizeMul: lerp(arch.dotSizeMul[0], arch.dotSizeMul[1]),
      flickerPhase: Math.random() * CFG.zoneFlickerPhaseSpread,
      flickerAmp: lerp(arch.flickerAmp[0], arch.flickerAmp[1]),
      flickerSpeed: lerp(arch.flickerSpeed[0], arch.flickerSpeed[1]),
      densityMul: lerp(arch.densityMul[0], arch.densityMul[1]),
      birthMul: lerp(arch.birthMul[0], arch.birthMul[1]),
      colorAffinity: arch.colorAffinity,
      reactivity: lerp(arch.reactivity[0], arch.reactivity[1]),
    });
  }
  // Aspect ratio for Voronoi: use screen ratio so zones are circular, not elliptical
  const aspect = window.innerWidth / window.innerHeight;
  zoneLookup = new Uint8Array(ZONE_RES * ZONE_RES);
  for (let r = 0; r < ZONE_RES; r++) {
    const ny = (r + 0.5) / ZONE_RES;
    for (let c = 0; c < ZONE_RES; c++) {
      const nx = (c + 0.5) / ZONE_RES;
      let best = 0, bestD = 999;
      for (let i = 0; i < zoneSeeds.length; i++) {
        const dx = (nx - zoneSeeds[i].x) * aspect;
        const dy = ny - zoneSeeds[i].y;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = i; }
      }
      zoneLookup[r * ZONE_RES + c] = best;
    }
  }
}

const defaultZone = { dotSizeMul: 1, flickerPhase: 0, flickerAmp: 0.03, flickerSpeed: 3, densityMul: 1, birthMul: 1, colorAffinity: null, reactivity: 0.5 };

export function getZone(nx, ny) {
  if (!zoneSeeds) return defaultZone;
  const c = Math.min(ZONE_RES - 1, Math.floor(nx * ZONE_RES));
  const r = Math.min(ZONE_RES - 1, Math.floor(ny * ZONE_RES));
  return zoneSeeds[zoneLookup[r * ZONE_RES + c]];
}

// ── Primitive state ──
function initPrimitiveState() {
  primState = {
    bandas: [], bloccos: [],
    vuotoPos: { x: 0.3 + Math.random() * 0.4, y: 0.3 + Math.random() * 0.4, vx: 0, vy: 0 },
    frontePos: Math.random(), fronteDir: 1,
    sciameCenter: { x: 0.5, y: 0.5, vx: 0, vy: 0 },
    strisciaPhase: 0,
  };
  if (dna.primitives.includes('BANDA')) {
    for (let i = 0; i < dna.banda.count; i++)
      primState.bandas.push({ position: Math.random(), direction: Math.random() > 0.5 ? 1 : -1 });
  }
  if (dna.primitives.includes('BLOCCO')) {
    for (let i = 0; i < dna.blocco.count; i++)
      primState.bloccos.push({
        x: 0.05 + Math.random() * 0.7, y: 0.05 + Math.random() * 0.7,
        w: dna.blocco.sizeRange[0] + Math.random() * (dna.blocco.sizeRange[1] - dna.blocco.sizeRange[0]),
        h: dna.blocco.sizeRange[0] + Math.random() * (dna.blocco.sizeRange[1] - dna.blocco.sizeRange[0]),
        life: 3 + Math.random() * 8, age: Math.random() * 5,
      });
  }
}

// ── Update primitives per frame ──
export function updatePrimitives(dt, state, evoSpeed) {
  const speed = (0.05 + state.rhythmicity * 0.5) * evoSpeed;

  for (const b of primState.bandas) {
    b.position += b.direction * dna.banda.speed * speed * dt;
    if (b.position > 1) { b.position = 1; b.direction = -1; }
    if (b.position < 0) { b.position = 0; b.direction = 1; }
  }

  for (let i = 0; i < primState.bloccos.length; i++) {
    const b = primState.bloccos[i];
    b.age += dt * evoSpeed;
    if (b.age >= b.life) {
      primState.bloccos[i] = {
        x: 0.05 + Math.random() * 0.7, y: 0.05 + Math.random() * 0.7,
        w: dna.blocco.sizeRange[0] + Math.random() * (dna.blocco.sizeRange[1] - dna.blocco.sizeRange[0]),
        h: dna.blocco.sizeRange[0] + Math.random() * (dna.blocco.sizeRange[1] - dna.blocco.sizeRange[0]),
        life: 2 + Math.random() * 6, age: 0,
      };
    }
  }

  const v = primState.vuotoPos;
  v.vx += (Math.random() - 0.5) * 0.01; v.vy += (Math.random() - 0.5) * 0.01;
  v.vx *= 0.95; v.vy *= 0.95;
  v.x += v.vx * dna.vuoto.speed * speed; v.y += v.vy * dna.vuoto.speed * speed;
  v.x = Math.max(0.1, Math.min(0.9, v.x)); v.y = Math.max(0.1, Math.min(0.9, v.y));

  const fSpeed = dna.fronte.speed * speed;
  if (state.trajectory === 1) primState.fronteDir = 1;
  else if (state.trajectory === -1) primState.fronteDir = -1;
  primState.frontePos += primState.fronteDir * fSpeed * dt;
  if (primState.frontePos > 1) { primState.frontePos = 1; primState.fronteDir = -1; }
  if (primState.frontePos < 0) { primState.frontePos = 0; primState.fronteDir = 1; }

  const sc = primState.sciameCenter;
  sc.vx += (Math.random() - 0.5) * state.rhythmicity * 0.05;
  sc.vy += (Math.random() - 0.5) * state.rhythmicity * 0.05;
  if (state.trajectory === 1) sc.vy -= 0.005;
  if (state.trajectory === -1) sc.vy += 0.005;
  sc.vx *= 0.96; sc.vy *= 0.96;
  sc.x += sc.vx; sc.y += sc.vy;
  sc.x = Math.max(0.1, Math.min(0.9, sc.x)); sc.y = Math.max(0.1, Math.min(0.9, sc.y));

  primState.strisciaPhase += state.rhythmicity * speed * dt * 2;
}

// ── Primitive density contribution ──
export function primitiveDensity(nx, ny, state, W, H) {
  let d = 0;
  if (!dna) return d;
  if (state.intensity < 0.03) return d;
  const prims = dna.primitives;

  if (prims.includes('BANDA')) {
    for (const b of primState.bandas) {
      let coord;
      if (dna.banda.orientation === 'horizontal') coord = ny;
      else if (dna.banda.orientation === 'vertical') coord = nx;
      else coord = (nx + ny) * 0.5;
      const halfW = (dna.banda.widthRange[0] + (dna.banda.widthRange[1] - dna.banda.widthRange[0]) * state.intensity) * 0.5;
      if (Math.abs(coord - b.position) < halfW) d = Math.max(d, 0.7 * state.intensity);
    }
  }

  if (prims.includes('BLOCCO')) {
    for (const b of primState.bloccos) {
      const fadeIn = 0.5, fadeOut = 0.5;
      let alpha;
      if (b.age < fadeIn) alpha = b.age / fadeIn;
      else if (b.age > b.life - fadeOut) alpha = Math.max(0, (b.life - b.age) / fadeOut);
      else alpha = 1;
      if (alpha < 0.05) continue;
      if (nx >= b.x && nx <= b.x + b.w && ny >= b.y && ny <= b.y + b.h)
        d = Math.max(d, 0.6 * alpha * state.intensity);
    }
  }

  if (prims.includes('VETTORE')) {
    const a = dna.vettore.angle;
    const proj = nx * Math.cos(a) + ny * Math.sin(a);
    d += proj * dna.vettore.strength * state.intensity * 0.5;
  }

  if (prims.includes('VUOTO')) {
    const vp = primState.vuotoPos, vs = dna.vuoto.size;
    let inside = false;
    if (dna.vuoto.shape === 'rect') inside = nx > vp.x - vs && nx < vp.x + vs && ny > vp.y - vs && ny < vp.y + vs;
    else if (dna.vuoto.shape === 'circle') { const dx = nx - vp.x, dy = ny - vp.y; inside = Math.sqrt(dx*dx+dy*dy) < vs; }
    else inside = Math.abs(ny - vp.y) < vs * 0.3;
    if (inside) d = -1;
  }

  if (prims.includes('FRONTE')) {
    const coord = dna.fronte.orientation === 'horizontal' ? ny : nx;
    if (coord < primState.frontePos) d += 0.3 * state.intensity;
    else { const dist = coord - primState.frontePos; if (dist < 0.05) d += 0.08; }
  }

  if (prims.includes('STRISCIA')) {
    let coord;
    if (dna.striscia.orientation === 'horizontal') coord = ny;
    else if (dna.striscia.orientation === 'vertical') coord = nx;
    else coord = (nx + ny) * 0.5;
    const spacing = dna.striscia.spacing / Math.max(W, H);
    const modCoord = ((coord + primState.strisciaPhase * spacing) % spacing) / spacing;
    const lineW = dna.striscia.lineWidth / dna.striscia.spacing;
    const compressionMod = 1 + (state.intensity - 0.5) * 0.6;
    if (modCoord < lineW * compressionMod) d += 0.5 * state.intensity;
  }

  return d;
}

// ── Is point inside VUOTO ──
export function isInVuoto(nx, ny) {
  if (!dna || !dna.primitives.includes('VUOTO')) return false;
  const vp = primState.vuotoPos, vs = dna.vuoto.size;
  if (dna.vuoto.shape === 'rect') return nx > vp.x - vs && nx < vp.x + vs && ny > vp.y - vs && ny < vp.y + vs;
  if (dna.vuoto.shape === 'circle') { const dx = nx - vp.x, dy = ny - vp.y; return Math.sqrt(dx*dx+dy*dy) < vs; }
  return Math.abs(ny - vp.y) < vs * 0.3;
}
