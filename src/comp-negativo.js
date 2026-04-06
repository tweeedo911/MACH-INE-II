// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: NEGATIVO
//  Fondo colorato saturo. Le note scavano buchi scuri.
//  RESPIRO: silenzio = colore, musica = assenza.
//
//  v2 — Fondo respira con audio, buchi organici con sfumatura,
//       sedimento trattiene la memoria dei buchi,
//       camera respira lentamente verso l'ultimo buco.
// ═══════════════════════════════════════════════════════════

import {
  bayerAt, bayerTest, fillBackground, rgbString, hexToRgb, lerpColor,
  lerp, clamp,
  audioDensity,
  Sediment,
  applyCameraTransform, restoreCameraTransform,
} from './visual-toolkit.js';

// ── Phase parameters ──────────────────────────────────────
const PHASE_PARAMS = {
  germoglio:    { holeSize: 0.12, closeSpeed: 0.005, holeDepth: 0.4, sedimentRate: 0.96 },
  pulsazione:   { holeSize: 0.08, closeSpeed: 0.010, holeDepth: 0.6, sedimentRate: 0.93 },
  dissoluzione: { holeSize: 0.05, closeSpeed: 0.003, holeDepth: 0.3, sedimentRate: 0.97 },
};

// ── State ─────────────────────────────────────────────────
let _holes = [];
let _time = 0;
let _params = { ...PHASE_PARAMS.germoglio };
let _sediment = null;

// Camera state — gentle drift toward last hole
let _camDriftX = 0;
let _camDriftY = 0;
let _camTargetX = 0;
let _camTargetY = 0;
let _camZoom = 1.0;
let _camZoomTarget = 1.0;

// dot size (grid unit) — kept stable across frames
const DOT_SIZE = 5;

// ── Init ──────────────────────────────────────────────────
export function init(env) {
  _holes = [];
  _time = 0;
  _params = { ...(PHASE_PARAMS[env.worldState.phase] || PHASE_PARAMS.germoglio) };
  _sediment = new Sediment();
  _camDriftX = 0;
  _camDriftY = 0;
  _camTargetX = 0;
  _camTargetY = 0;
  _camZoom = 1.0;
  _camZoomTarget = 1.0;
}

// ── Render ────────────────────────────────────────────────
export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, dt, audio, state } = env;
  _time += dt;

  // ── Smooth phase transition ──
  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  _params.holeSize    += (target.holeSize    - _params.holeSize)    * 0.03;
  _params.closeSpeed  += (target.closeSpeed  - _params.closeSpeed)  * 0.03;
  _params.holeDepth   += (target.holeDepth   - _params.holeDepth)   * 0.03;
  _params.sedimentRate = target.sedimentRate;          // snap — affects decay immediately

  const bgRgb  = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);

  // ── 1. Breathing background color ──
  // rms slightly brightens the sage green (loud = brighter, silence = base)
  const rms       = (audio && audio.rms  != null) ? audio.rms  : 0;
  const intensity = (state && state.intensity != null) ? state.intensity : 0;
  const rmsMod    = clamp(rms * 1.4, 0, 0.18);            // 0..0.18 brightening
  const brightBg  = [
    clamp(bgRgb[0] + rmsMod * 40, 0, 255),
    clamp(bgRgb[1] + rmsMod * 50, 0, 255),
    clamp(bgRgb[2] + rmsMod * 30, 0, 255),
  ];

  // ── 2. Textured background — Bayer field at very high density ──
  // Density 0.90–0.98 so it reads as almost-solid but with grain
  const baseDensity = 0.93 + rmsMod * 0.05;   // 0.93..0.98 range
  const cols = Math.ceil(W / DOT_SIZE);
  const rows = Math.ceil(H / DOT_SIZE);

  // Flat bg first (fills gaps between grid cells at certain sizes)
  fillBackground(ctx, W, H, rgbString(brightBg[0], brightBg[1], brightBg[2]));

  // Camera breathing — apply before all drawing
  _camZoomTarget = 1.0 + rms * 0.015;
  _camZoom      += (_camZoomTarget - _camZoom) * 0.04;
  _camDriftX    += (_camTargetX - _camDriftX)  * 0.008;
  _camDriftY    += (_camTargetY - _camDriftY)  * 0.008;
  applyCameraTransform(ctx, W, H, { zoom: _camZoom, driftX: _camDriftX, driftY: _camDriftY, time: _time });

  // ── 3. Continuous audio darkness (audioDensity shadow layer) ──
  // Loud sound creates slight shadow dots on top of bg — silence = pure color
  if (intensity > 0.05) {
    const shadowAlpha  = clamp(intensity * 0.22, 0, 0.22);
    const shadowRgb    = lerpColor(brightBg, dotRgb, 0.35);  // bg→dot, not full dark
    ctx.fillStyle = rgbString(shadowRgb[0] | 0, shadowRgb[1] | 0, shadowRgb[2] | 0);
    for (let r = 0; r < rows; r++) {
      const ny = r / rows;
      for (let c = 0; c < cols; c++) {
        const nx = c / cols;
        const d  = audioDensity(audio, state, nx, ny) * shadowAlpha * 3.5;
        if (d > 0.02 && bayerTest(c, r, clamp(d, 0, 1))) {
          ctx.fillRect(c * DOT_SIZE, r * DOT_SIZE, DOT_SIZE, DOT_SIZE);
        }
      }
    }
  }

  // ── 4. Spawn holes from voice (CH5) and lead echo (CH6) ──
  for (const n of midiTrail) {
    if ((n.ch === 5 || n.ch === 6) && n.time < dt * 2 && n.alpha > 0.4) {
      const isEcho = n.ch === 6;
      const hx = clamp(0.15 + n.note * 0.7, 0.05, 0.95);
      const hy = clamp(0.15 + (1 - n.note) * 0.7 + (isEcho ? 0.05 : 0), 0.05, 0.95);
      _holes.push({
        x: hx,
        y: hy,
        radius: 0,
        maxRadius: _params.holeSize * (isEcho ? 0.6 : 1) * n.vel,
        alpha: _params.holeDepth * (isEcho ? 0.5 : 1),
        closing: false,
        growSpeed: isEcho ? 0.08 : 0.15,
      });
      // Camera drifts toward latest melody hole
      if (!isEcho) {
        _camTargetX = (hx - 0.5) * -W * 0.015;   // subtle: max ~±1.5% of W
        _camTargetY = (hy - 0.5) * -H * 0.015;
      }
    }
  }

  if (_holes.length > 30) _holes.splice(0, _holes.length - 30);

  // Inverted onset waves — brief dark flashes (small holes)
  for (const w of onsetWaves) {
    if (w.strength > 0.5) {
      _holes.push({
        x: w.cx / W,
        y: w.cy / H,
        radius: 0.02,
        maxRadius: 0.04,
        alpha: w.strength * 0.3,
        closing: true,
        growSpeed: 0,
      });
    }
  }

  // ── 5. Update holes and write sediment traces ──
  if (!_sediment) _sediment = new Sediment();
  _sediment.decay(W, H, _params.sedimentRate);
  const sedCtx = _sediment.getCtx();

  for (let i = _holes.length - 1; i >= 0; i--) {
    const h = _holes[i];

    if (!h.closing && h.radius < h.maxRadius) {
      h.radius += h.growSpeed * dt;
      if (h.radius >= h.maxRadius) h.closing = true;
    }
    if (h.closing) {
      h.radius -= _params.closeSpeed;
      h.alpha  *= 0.995;
    }
    if (h.radius < 0.002 || h.alpha < 0.02) {
      _holes[i] = _holes[_holes.length - 1];
      _holes.length--;
      continue;
    }

    // ── 6. Organic circular hole with soft edge and color gradient ──
    const hcx   = h.x * W;
    const hcy   = h.y * H;
    const hradPx = h.radius * Math.min(W, H);
    const hrGrid = hradPx / DOT_SIZE;

    // Bounding box in grid coords
    const cMin = Math.max(0, Math.floor((hcx - hradPx) / DOT_SIZE));
    const cMax = Math.min(cols - 1, Math.ceil((hcx + hradPx) / DOT_SIZE));
    const rMin = Math.max(0, Math.floor((hcy - hradPx) / DOT_SIZE));
    const rMax = Math.min(rows - 1, Math.ceil((hcy + hradPx) / DOT_SIZE));

    for (let gr = rMin; gr <= rMax; gr++) {
      for (let gc = cMin; gc <= cMax; gc++) {
        const px = gc * DOT_SIZE;
        const py = gr * DOT_SIZE;
        // Distance from hole center (normalized 0..1 at edge)
        const dx = (px + DOT_SIZE * 0.5 - hcx) / hradPx;
        const dy = (py + DOT_SIZE * 0.5 - hcy) / hradPx;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1.0) continue;                          // outside circle

        // Soft edge: full dark at center, blend to bg at edge
        // dist=0 → pure dot color; dist=1 → pure bg (transparent hole)
        const edgeFade  = 1 - dist * dist;                 // quadratic falloff
        const holeDark  = h.alpha * edgeFade;

        // Bayer threshold modulated by distance for soft organic edge
        const bayerVal  = bayerAt(gc, gr);
        const threshold = clamp(holeDark - bayerVal * (1 - edgeFade) * 0.3, 0, 1);

        if (threshold > bayerVal) {
          // Color: center blends strongly toward dot, edge back toward bg
          const t     = holeDark * 0.85;
          const rgb   = lerpColor(brightBg, dotRgb, t);
          ctx.fillStyle = rgbString(rgb[0] | 0, rgb[1] | 0, rgb[2] | 0);
          ctx.fillRect(px, py, DOT_SIZE, DOT_SIZE);

          // Write darker mark into sediment (memory of the hole)
          const sRgb = lerpColor(bgRgb, dotRgb, clamp(holeDark * 0.55, 0, 1));
          sedCtx.fillStyle = rgbString(sRgb[0] | 0, sRgb[1] | 0, sRgb[2] | 0, holeDark * 0.35);
          sedCtx.fillRect(px, py, DOT_SIZE, DOT_SIZE);
        }
      }
    }
  }

  // ── 7. Composite sediment traces onto main canvas ──
  _sediment.composite(ctx);

  // ── 8. Restore camera ──
  restoreCameraTransform(ctx);
}

// ── Destroy ───────────────────────────────────────────────
export function destroy() {
  _holes = [];
  if (_sediment) { _sediment.clear(0, 0); _sediment = null; }
  _camDriftX = 0;
  _camDriftY = 0;
}
