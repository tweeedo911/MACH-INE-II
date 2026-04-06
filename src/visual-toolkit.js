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

// ═══════════════════════════════════════════════════════════
//  Glitch — controlled visual corruption
// ═══════════════════════════════════════════════════════════

// Offset Bayer grid lookup by random amount — creates visual "stutter"
// glitchAmt 0 = no effect, 1 = full cell offset (1-4 cells)
export function bayerGlitch(col, row, density, glitchAmt, time) {
  if (glitchAmt < 0.01) return BAYER8[(row & 7) * 8 + (col & 7)] < density;
  // Hash-based deterministic offset — changes with time but stable within frame
  const hash = Math.sin(time * 13.7 + col * 0.31 + row * 0.57) * 43758.5453;
  const offset = Math.floor((hash - Math.floor(hash)) * glitchAmt * 4);
  const gc = (col + offset) & 7;
  const gr = (row + (offset >> 1)) & 7;
  return BAYER8[gr * 8 + gc] < density;
}

// Brief color snap — returns corrupted RGB (no lerp, instant)
// flash: 0 = no effect, 1 = full corruption
export function colorFlash(rgb, flash, time) {
  if (flash < 0.01) return rgb;
  // Cycle through corruption modes based on time
  const mode = Math.floor(time * 7.3) % 4;
  switch (mode) {
    case 0: return [255 - rgb[0], 255 - rgb[1], 255 - rgb[2]];      // invert
    case 1: return [rgb[0] + flash * 180, rgb[1], rgb[2]];           // red push
    case 2: return [255 * flash, 255 * flash, 255 * flash];          // white flash
    default: return [rgb[2], rgb[0], rgb[1]];                        // channel rotate
  }
}

// Dot size jitter — returns modulated size (never below 1)
// jitter: 0 = no effect, 1 = ±50% variation
export function dotJitter(baseSize, jitter, col, row, time) {
  if (jitter < 0.01) return baseSize;
  const n = Math.sin(col * 127.1 + row * 311.7 + time * 37.3) * 43758.5453;
  const mod = (n - Math.floor(n)) * 2 - 1;  // -1 to +1
  return Math.max(1, Math.round(baseSize * (1 + mod * jitter * 0.5)));
}

// Random glitch probability — returns true with probability scaled by intensity
// Use for rare events: ~2% in rottura, ~0.3% elsewhere
export function shouldGlitch(intensity, isRottura, time) {
  const baseProb = isRottura ? 0.02 : 0.003;
  const n = Math.sin(time * 997.1) * 43758.5453;
  return (n - Math.floor(n)) < baseProb * intensity;
}

// ═══════════════════════════════════════════════════════════
//  Audio Reactivity — continuous visual response to sound
// ═══════════════════════════════════════════════════════════

// Density at normalized position (nx, ny) driven by audio analysis
// Returns 0-1 density influenced by frequency bands, intensity, stereo
export function audioDensity(audio, state, nx, ny) {
  const bandAvg = (band) => (band.L + band.R) * 0.5;
  const sub = bandAvg(audio.bands.sub);
  const low = bandAvg(audio.bands.low);
  const mid = bandAvg(audio.bands.mid);
  const high = bandAvg(audio.bands.high);
  const air = bandAvg(audio.bands.air);

  let d = state.intensity * 0.3;

  // Frequency → spatial: bass at bottom, highs at top
  if (ny > 0.6) d += (sub * 0.5 + low * 0.3) * (ny - 0.6) / 0.4;
  else if (ny > 0.3) d += mid * 0.3 * (1 - Math.abs(ny - 0.45) / 0.2);
  if (ny < 0.4) d += (high * 0.4 + air * 0.3) * (0.4 - ny) / 0.4;

  // Stereo width → horizontal spread
  if (state.stereoWidth < 0.8) {
    const centerDist = Math.abs(nx - 0.5) * 2;
    d *= 1 - centerDist * (1 - state.stereoWidth) * 0.5;
  }

  return Math.min(1, Math.max(0, d));
}

// Rhythmic flicker at position — returns 0-1 modulation
export function audioFlicker(state, globalTime, nx, ny) {
  if (state.rhythmicity < 0.05) return 0;
  const phase = nx * 3.7 + ny * 2.3;  // spatial offset
  const flick = Math.sin(globalTime * state.rhythmicity * 12 + phase * Math.PI * 2);
  return flick * flick * state.rhythmicity * 0.3;
}

// ═══════════════════════════════════════════════════════════
//  Sediment — frame persistence for visual memory
// ═══════════════════════════════════════════════════════════

export class Sediment {
  constructor() {
    this._canvas = null;
    this._ctx = null;
    this._w = 0;
    this._h = 0;
  }

  // Ensure buffer matches size
  _ensure(W, H) {
    if (!this._canvas || this._w !== W || this._h !== H) {
      this._canvas = document.createElement('canvas');
      this._canvas.width = W;
      this._canvas.height = H;
      this._ctx = this._canvas.getContext('2d');
      this._w = W;
      this._h = H;
    }
  }

  // Decay previous frame (rate: 0.0=instant clear, 0.95=long trails)
  decay(W, H, rate) {
    this._ensure(W, H);
    this._ctx.globalCompositeOperation = 'destination-out';
    this._ctx.globalAlpha = 1 - rate;
    this._ctx.fillStyle = 'black';
    this._ctx.fillRect(0, 0, W, H);
    this._ctx.globalAlpha = 1;
    this._ctx.globalCompositeOperation = 'source-over';
  }

  // Get context to draw into sediment buffer
  getCtx() { return this._ctx; }

  // Composite sediment onto main canvas
  composite(ctx) {
    if (this._canvas) ctx.drawImage(this._canvas, 0, 0);
  }

  clear(W, H) {
    this._ensure(W, H);
    this._ctx.clearRect(0, 0, W, H);
  }
}

// ═══════════════════════════════════════════════════════════
//  Camera Transform — subtle movement per composition
// ═══════════════════════════════════════════════════════════

// Apply camera transform: zoom, drift, onset shake
// Call before drawing, restore ctx after
export function applyCameraTransform(ctx, W, H, opts) {
  const {
    zoom = 1,
    driftX = 0,
    driftY = 0,
    shakeAmount = 0,
    time = 0,
  } = opts;

  const sx = shakeAmount > 0 ? (Math.sin(time * 47) * shakeAmount) : 0;
  const sy = shakeAmount > 0 ? (Math.cos(time * 53) * shakeAmount) : 0;

  ctx.save();
  ctx.translate(W * 0.5, H * 0.5);
  ctx.scale(zoom, zoom);
  ctx.translate(-W * 0.5 + driftX + sx, -H * 0.5 + driftY + sy);
}

export function restoreCameraTransform(ctx) {
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════
//  Breathing Field — continuous Bayer field driven by audio
// ═══════════════════════════════════════════════════════════

// Render a full-canvas breathing halftone field
// density modulated by audio at each position
// jitter: 0-1, how much dot size varies (0=uniform, 0.3=slight, 0.7=wild)
export function renderBreathingField(ctx, W, H, audio, state, globalTime, dotSize, dotColor, baseAlpha, jitter) {
  const cols = Math.ceil(W / dotSize);
  const rows = Math.ceil(H / dotSize);
  ctx.fillStyle = dotColor;
  const jitterAmt = jitter || 0;

  for (let r = 0; r < rows; r++) {
    const ny = r / rows;
    for (let c = 0; c < cols; c++) {
      const nx = c / cols;
      let d = audioDensity(audio, state, nx, ny) * baseAlpha;
      d += audioFlicker(state, globalTime, nx, ny) * baseAlpha;
      if (d > 0.02 && bayerTest(c, r, clamp(d, 0, 1))) {
        const ds = jitterAmt > 0.01
          ? dotJitter(dotSize, jitterAmt, c, r, globalTime)
          : dotSize;
        ctx.fillRect(c * ds, r * ds, ds, ds);
      }
    }
  }
}
