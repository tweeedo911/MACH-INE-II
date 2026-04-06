// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Visual Toolkit
//  Pure functions for composition modules. Zero state.
// ═══════════════════════════════════════════════════════════

// ── Bayer 8x8 ordered dither matrix ──
const BAYER8 = new Float32Array([
   0/64, 32/64,  8/64, 40/64,  2/64, 34/64, 10/64, 42/64,
  48/64, 16/64, 56/64, 24/64, 50/64, 18/64, 58/64, 26/64,
  12/64, 44/64,  4/64, 36/64, 14/64, 46/64,  6/64, 38/64,
  60/64, 28/64, 52/64, 20/64, 62/64, 30/64, 54/64, 22/64,
   3/64, 35/64, 11/64, 43/64,  1/64, 33/64,  9/64, 41/64,
  51/64, 19/64, 59/64, 27/64, 49/64, 17/64, 57/64, 25/64,
  15/64, 47/64,  7/64, 39/64, 13/64, 45/64,  5/64, 37/64,
  63/64, 31/64, 55/64, 23/64, 61/64, 29/64, 53/64, 21/64,
]);

// ── Bayer lookup ──
export function bayerAt(col, row) {
  return BAYER8[(row & 7) * 8 + (col & 7)];
}

export function bayerTest(col, row, density) {
  return density > BAYER8[(row & 7) * 8 + (col & 7)];
}

// ── Dot drawing ──
export function drawDot(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
}

// Fill rectangular area with Bayer-dithered dots
export function fillBayer(ctx, x, y, w, h, density, dotSize, color) {
  const cols = Math.ceil(w / dotSize);
  const rows = Math.ceil(h / dotSize);
  ctx.fillStyle = color;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (bayerTest(c, r, density)) {
        ctx.fillRect(x + c * dotSize, y + r * dotSize, dotSize, dotSize);
      }
    }
  }
}

// Fill entire canvas background with solid color
export function fillBackground(ctx, W, H, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

// ── Color utilities ──
export function hexToRgb(hex) {
  if (!hex) return [0, 0, 0];
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function rgbString(r, g, b, a) {
  if (a !== undefined && a < 1) return `rgba(${r|0},${g|0},${b|0},${a.toFixed(3)})`;
  return `rgb(${r|0},${g|0},${b|0})`;
}

export function lerpColor(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

// ── Math utilities ──
export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
export function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t); }
export function mapRange(v, inMin, inMax, outMin, outMax) {
  return outMin + (v - inMin) / (inMax - inMin) * (outMax - outMin);
}

// ── Spatial utilities ──
// Simple hash-based noise (deterministic, no allocation)
export function noiseAt(x, y, t) {
  const n = Math.sin(x * 127.1 + y * 311.7 + t * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

// Map grid position to pixel coordinates
export function gridPosition(col, row, cols, rows, W, H) {
  return {
    x: (col + 0.5) / cols * W,
    y: (row + 0.5) / rows * H,
  };
}

// Y coordinate with perspective convergence toward vanishing point
export function perspectiveY(y, depth, vanishY) {
  return vanishY + (y - vanishY) * (1 - depth);
}

// Scale value by perspective depth (farther = smaller)
export function perspectiveScale(value, depth) {
  return value * (1 - depth * 0.8);
}

// ── LCG pseudo-random (fast, no GC, seedable) ──
let _seed = 42;
export function seedRng(s) { _seed = s | 0; }
export function rng() {
  _seed = (_seed * 1103515245 + 12345) & 0x7FFFFFFF;
  return _seed / 0x7FFFFFFF;
}
