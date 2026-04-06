// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Chromatic System + Dynamic Palette
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { getEngine } from './midi-patterns.js';

// ── Colore progressivo — concert time gating ──
let _concertTime = -1;
export function setConcertTime(t) { _concertTime = t; }

function desaturateColor(color, amount) {
  const grey = 0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2];
  for (let i = 0; i < 3; i++) {
    color[i] += (grey - color[i]) * amount;
  }
}

// ── Base color constants (defaults) ──
export const COLOR_A = [255, 68, 0];
export const COLOR_B = [0, 170, 204];
export const COLOR_C = [230, 0, 126];

// ── Per-role MIDI colors ──
export const MIDI_COLORS = [
  [255, 140, 20],   // KICK  — amber
  [200, 30, 30],    // BASS  — deep red
  [0, 180, 210],    // HARMONY — cyan
  [160, 60, 220],   // LEAD  — violet
  [180, 200, 220],  // TEXTURE — steel
];

// ── Engine-specific MIDI color overrides ──
const ENGINE_MIDI_COLORS = {
  terreno: [
    [255,125,15],  // kick  — ambra ardente
    [185, 95,20],  // bass  — terra bruciata
    [215,165,55],  // chord — ocra calda
    [145, 95,215], // voice — viola polveroso
    [200,150,75],  // grain — sabbia calda
  ],
  deriva: [
    [200,200,200],  // (fallback, non usato)
    [165,195,210],  // grain — nebbia azzurra
    [215,222,232],  // chord/drone — quasi bianco freddo
    [238,228,248],  // voice — bianco-viola desaturato
    [185,192,202],  // lead  — argento diafano
  ],
  solco: [
    [255,255,255],  // kick  — bianco assoluto
    [218,212,208],  // bass  — bianco sporco
    [155,160,178],  // chord — grigio acciaio freddo
    [255,198, 72],  // voice — unico accento caldo
    [138,142,152],  // hat   — grigio metallico
  ],
  cristallo: [
    [40,140,210], [30,120,190], [50,160,220], [20,100,180], [70,170,230],
  ],
  vortice: [
    [255,255,255], [210,0,0], [255,255,255], [210,0,0], [180,180,180],
  ],
  abisso: [
    [30,40,100], [20,50,130], [40,60,140], [75,35,115], [15,30,80],
  ],
  meccanica: [
    [200,40,40], [160,25,25], [220,60,60], [180,30,30], [240,80,80],
  ],
};

// ── Dynamic palette (mutated by director) ──
export const PALETTES = {
  default:    { bg: [0,0,0],     fg: [255,255,255], accent1: [255,68,0],   accent2: [0,170,204],   accent3: [230,0,126] },
  amber:      { bg: [90,38,0],   fg: [255,220,160], accent1: [255,160,40], accent2: [200,120,20],   accent3: [255,100,0] },
  cyan:       { bg: [0,50,65],   fg: [180,230,240], accent1: [0,200,220],  accent2: [40,160,180],   accent3: [100,220,240] },
  bw:         { bg: [0,0,0],     fg: [255,255,255], accent1: [200,200,200],accent2: [150,150,150],  accent3: [255,255,255] },
  magenta:    { bg: [70,0,45],   fg: [240,180,220], accent1: [230,0,126],  accent2: [180,40,100],   accent3: [255,60,160] },
  warm:       { bg: [80,28,0],   fg: [255,240,200], accent1: [255,100,20], accent2: [200,60,30],    accent3: [255,180,40] },
  cold:       { bg: [0,28,60],   fg: [200,220,240], accent1: [60,140,200], accent2: [0,180,210],    accent3: [140,180,220] },
  // ── Engine-dedicated palettes ──
  ice:        { bg: [250,252,255], fg: [20,25,35],    accent1: [60,160,220],  accent2: [40,130,200],  accent3: [100,190,240] },
  abyssal:    { bg: [2,3,12],      fg: [45,55,90],    accent1: [25,35,120],   accent2: [15,45,100],   accent3: [80,30,110] },
  steel:      { bg: [5,5,8],       fg: [240,245,250], accent1: [200,30,30],   accent2: [160,20,20],   accent3: [240,50,50] },
  ikeda:      { bg: [0,0,0],       fg: [255,255,255], accent1: [210,0,0],     accent2: [255,255,255], accent3: [210,0,0] },
  // ── v5: palette con fondi colorati — identità per traccia ──
  // Ref: design contemporaneo 2025, Swiss revival, rapporto 60-30-10
  nebbia:     { bg: [18,16,14],    fg: [239,230,222], accent1: [239,230,222], accent2: [180,170,155], accent3: [120,110,95]  },
  tessuto:    { bg: [32,19,13],    fg: [205,215,29],  accent1: [186,222,79],  accent2: [205,215,29],  accent3: [239,230,222] },
  solco:      { bg: [40,43,38],    fg: [254,107,13],  accent1: [254,107,13],  accent2: [205,215,29],  accent3: [239,230,222] },
  respiro:    { bg: [123,186,145], fg: [25,22,18],    accent1: [32,19,13],    accent2: [50,45,38],    accent3: [18,16,14]    },
  macchina:   { bg: [26,26,46],    fg: [248,237,0],   accent1: [248,237,0],   accent2: [221,58,68],   accent3: [254,107,13]  },
  tempesta:   { bg: [0,0,0],       fg: [255,255,255], accent1: [255,255,255], accent2: [145,1,15],    accent3: [210,0,0]     },
  ritorno:    { bg: [18,16,14],    fg: [155,143,206], accent1: [155,143,206], accent2: [239,230,222], accent3: [107,142,236] },
};

export const palette = {
  bg: [0,0,0],
  fg: [255,255,255],
  accent1: [255,68,0],
  accent2: [0,170,204],
  accent3: [230,0,126],
  // targets for lerp
  _targetBg: [0,0,0],
  _targetFg: [255,255,255],
  _targetA1: [255,68,0],
  _targetA2: [0,170,204],
  _targetA3: [230,0,126],
  _lerpSpeed: 0.02, // per frame
};

// V3 modal palette — called on mode change from macro-composer.js
export function setPaletteForMode(mode) {
  // v5: palette con fondi colorati per identità traccia
  // Ref: cream/sage/navy/lime/lavanda — design 2025, non solo nero
  const modalPalettes = {
    'A_lydian':    'nebbia',    // cream su quasi-nero — galleggiante, silenzioso
    'Bb_phrygian': 'solco',     // arancio+lime su signal black — groove rituale
    'D_dorian':    'macchina',  // giallo+pink su navy profondo — energia meccanica
    'C#_dorian':   'tempesta',  // bianco+rosso su nero — Ikeda, climax techno
    'E_phrygian':  'ritorno',   // lavanda+cream su nero — dissoluzione
  };
  setPalette(modalPalettes[mode] || 'nebbia');
}

export function setPalette(name) {
  const p = PALETTES[name] || PALETTES.default;
  palette._targetBg = [...p.bg];
  palette._targetFg = [...p.fg];
  palette._targetA1 = [...p.accent1];
  palette._targetA2 = [...p.accent2];
  palette._targetA3 = [...p.accent3];
}

function lerpColor(current, target, speed) {
  for (let i = 0; i < 3; i++) {
    current[i] += (target[i] - current[i]) * speed;
  }
}

export function updatePalette(dt) {
  // Framerate-independent lerp
  const s = dt ? (1 - Math.pow(1 - palette._lerpSpeed, dt * 60)) : palette._lerpSpeed;
  lerpColor(palette.bg, palette._targetBg, s);
  lerpColor(palette.fg, palette._targetFg, s);
  lerpColor(palette.accent1, palette._targetA1, s);
  lerpColor(palette.accent2, palette._targetA2, s);
  lerpColor(palette.accent3, palette._targetA3, s);
}

// ── Entity color system ──
export const colorEnabled = { A: true, B: true, C: true };

export let chromaticMode = 'normal';
export let chromaticTimer = 0;
export let climaxTimer = 0;
export let inClimax = false;
export let climaxProgress = 0;
export let inverted = false;
export let invertDissolving = false;
export let invertDissolveProgress = 0;
export let invertTarget = false;

export function setChromaticShift(mode) {
  chromaticMode = mode;
  chromaticTimer = CFG.chromaticShiftDuration;
}

export function startInvertDissolve() {
  invertDissolving = true;
  invertDissolveProgress = 0;
  invertTarget = !inverted;
}

export function updateColors(dt, state) {
  // Palette lerp (dt-based)
  updatePalette(dt);

  // Colore progressivo — gate accents by concert act
  if (_concertTime >= 0) {
    // Atto I (0-480s): monochrome; Atto II: +A; Atto III: +B; Atto IV+: all, C only in climax
    const desatA = _concertTime < 480 ? 1 : Math.max(0, 1 - (_concertTime - 480) / 30);
    const desatB = _concertTime < 1080 ? 1 : Math.max(0, 1 - (_concertTime - 1080) / 30);
    const desatC = inClimax ? Math.max(0, 1 - climaxProgress * 3) : 1;
    if (desatA > 0.01) desaturateColor(palette.accent1, desatA);
    if (desatB > 0.01) desaturateColor(palette.accent2, desatB);
    if (desatC > 0.01) desaturateColor(palette.accent3, desatC);
  }

  // Climax cromatico — bg tints toward dark magenta from below
  if (inClimax && climaxProgress > 0.1) {
    const t = climaxProgress * climaxProgress;
    palette.bg[0] = Math.min(255, palette.bg[0] + t * 35);
    palette.bg[2] = Math.min(255, palette.bg[2] + t * 22);
  }

  // Climax
  if (state.intensity > CFG.climaxIntensityThreshold) climaxTimer += dt;
  else { climaxTimer = 0; inClimax = false; }
  inClimax = climaxTimer >= CFG.climaxThresholdSec;

  if (inClimax && colorEnabled.C) {
    climaxProgress = Math.min(1, climaxProgress + CFG.climaxShiftSpeed * dt);
  } else {
    climaxProgress = Math.max(0, climaxProgress - CFG.climaxShiftSpeed * dt * 0.5);
  }

  // Chromatic timer
  if (chromaticMode !== 'normal') {
    chromaticTimer -= dt;
    if (chromaticTimer <= 0) { chromaticMode = 'normal'; chromaticTimer = 0; }
  }

  // Invert dissolve
  if (invertDissolving) {
    invertDissolveProgress += dt / CFG.invertDissolveDuration;
    if (invertDissolveProgress >= 1) {
      inverted = invertTarget;
      invertDissolving = false;
      invertDissolveProgress = 0;
    }
  }
}

export function resetClimax() {
  climaxTimer = 0;
  inClimax = false;
  climaxProgress = 0;
}

export function setComposerClimax(active) {
  inClimax = active;
  if (!active) climaxProgress = Math.max(0, climaxProgress - 0.1);
}

// Get pixel color for entity — pure color toward bg, not washed to fg
export function getCellColor(colorId, colorAlpha, _fgVal) {
  if (colorId === 0 || colorAlpha < 0.01) return null;
  let rgb;
  if (colorId === 1) rgb = palette.accent1;
  else if (colorId === 2) rgb = palette.accent2;
  else if (colorId === 3) rgb = palette.accent3;
  else return null;

  const a = Math.min(1, colorAlpha);
  const bg = palette.bg;
  return [
    Math.round(bg[0] + (rgb[0] - bg[0]) * a),
    Math.round(bg[1] + (rgb[1] - bg[1]) * a),
    Math.round(bg[2] + (rgb[2] - bg[2]) * a),
  ];
}

// Get pixel color for MIDI channel — engine-aware
export function getMidiColor(ch, alpha, _fgVal) {
  if (ch === null || alpha < 0.01) return null;
  const engine = getEngine();
  // Color 'C' = magenta RUPTURE (engine can override)
  if (ch === 'C') {
    const ruptureColor = (engine && ENGINE_MIDI_COLORS[engine])
      ? ENGINE_MIDI_COLORS[engine][2] : COLOR_C;
    const a = Math.min(1, Math.pow(alpha, 0.5));
    const bg = palette.bg;
    return [
      Math.round(bg[0] + (ruptureColor[0] - bg[0]) * a),
      Math.round(bg[1] + (ruptureColor[1] - bg[1]) * a),
      Math.round(bg[2] + (ruptureColor[2] - bg[2]) * a),
    ];
  }
  if (typeof ch !== 'number' || ch < 0 || ch >= 5 || alpha < 0.01) return null;
  const colors = (engine && ENGINE_MIDI_COLORS[engine]) || MIDI_COLORS;
  const rgb = colors[ch];
  const a = Math.min(1, Math.pow(alpha, 0.5));
  const bg = palette.bg;
  return [
    Math.round(bg[0] + (rgb[0] - bg[0]) * a),
    Math.round(bg[1] + (rgb[1] - bg[1]) * a),
    Math.round(bg[2] + (rgb[2] - bg[2]) * a),
  ];
}
