// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: NEGATIVO
//  Fondo colorato saturo. Le note scavano buchi scuri.
//  RESPIRO: silenzio = colore, musica = assenza.
//
//  v2 — Fondo respira con audio, buchi organici con sfumatura,
//       sedimento trattiene la memoria dei buchi,
//       camera respira lentamente verso l'ultimo buco.
//
//  v3 (A.4) — Migrato al layer stack 4-canonico (BG/MG/FG/OVERLAY).
//             Non scrive più direttamente su ctx: tutto va nei layer,
//             compositeLayers(ctx) fonde a fine render.
//             Il _sediment privato è sostituito da LAYER_OVERLAY.
// ═══════════════════════════════════════════════════════════

import {
  bayerAt, bayerTest, fillBackground, rgbString, hexToRgb, lerpColor,
  lerp, clamp,
  audioDensity, audioFlicker,
  bayerGlitch, colorFlash, shouldGlitch,
  applyCameraTransform, restoreCameraTransform,
  lerpKForTrack,
  renderBayerScaffold,
} from './visual-toolkit.js';

import {
  getLayerCtx, clearAllLayers, clearLayer, compositeLayers, setLayerDecay,
  LAYER_BG, LAYER_MG, LAYER_FG, LAYER_OVERLAY,
} from './layers.js';

// ── Phase parameters ──────────────────────────────────────
const PHASE_PARAMS = {
  germoglio:    { holeSize: 0.12, closeSpeed: 0.005, holeDepth: 0.4, sedimentRate: 0.96, glitch: 0 },
  pulsazione:   { holeSize: 0.08, closeSpeed: 0.010, holeDepth: 0.6, sedimentRate: 0.93, glitch: 0 },
  densita:      { holeSize: 0.06, closeSpeed: 0.015, holeDepth: 0.8, sedimentRate: 0.88, glitch: 0.1 },
  rottura:      { holeSize: 0.15, closeSpeed: 0.002, holeDepth: 1.0, sedimentRate: 0.80, glitch: 0.6 },
  dissoluzione: { holeSize: 0.05, closeSpeed: 0.003, holeDepth: 0.3, sedimentRate: 0.97, glitch: 0 },
};

// ── State ─────────────────────────────────────────────────
let _holes = [];
let _time = 0;
let _params = { ...PHASE_PARAMS.germoglio };

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
  clearAllLayers();
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
  // Per-track tau — Phase 0 task 0.3
  const trackK = lerpKForTrack(worldState.track, dt);
  _params.holeSize    += (target.holeSize    - _params.holeSize)    * trackK;
  _params.closeSpeed  += (target.closeSpeed  - _params.closeSpeed)  * trackK;
  _params.holeDepth   += (target.holeDepth   - _params.holeDepth)   * trackK;
  _params.glitch      += ((target.glitch || 0) - (_params.glitch || 0)) * trackK;
  _params.sedimentRate = target.sedimentRate;          // snap — affects decay immediately
  setLayerDecay(LAYER_OVERLAY, _params.sedimentRate);  // propagate to layer system next frame

  const { rupture } = worldState;
  const ruptI = rupture.intensity;   // 0→1 smooth (omen→infiltration→takeover→residue)
  const glitchAmt = _params.glitch || 0;

  const bgRgb  = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);

  // ── Layer contexts ──
  // MG e FG sono freschi ogni frame (come il ctx originale ripulito da fillBackground).
  // OVERLAY accumula — è il sediment (decayed da updateLayers).
  clearLayer(LAYER_MG);
  clearLayer(LAYER_FG);
  const lBg = getLayerCtx(LAYER_BG);
  const lMg = getLayerCtx(LAYER_MG);
  const lFg = getLayerCtx(LAYER_FG);
  const lOv = getLayerCtx(LAYER_OVERLAY);

  // Grid dims — used by MG shadow loop and FG hole loop
  const cols = Math.ceil(W / DOT_SIZE);
  const rows = Math.ceil(H / DOT_SIZE);

  // ── 1. BG layer: breathing background color ──
  // rms slightly brightens the sage green (loud = brighter, silence = base)
  const rms       = (audio && audio.rms  != null) ? audio.rms  : 0;
  const intensity = (state && state.intensity != null) ? state.intensity : 0;
  const rmsMod    = clamp(rms * 1.4, 0, 0.18);            // 0..0.18 brightening
  let brightBg  = [
    clamp(bgRgb[0] + rmsMod * 40, 0, 255),
    clamp(bgRgb[1] + rmsMod * 50, 0, 255),
    clamp(bgRgb[2] + rmsMod * 30, 0, 255),
  ];

  // Glitch: brief bg color inversion on onset during rottura/densita
  if (glitchAmt > 0.05 && shouldGlitch(intensity + 0.5, ruptI > 0.05, _time)) {
    brightBg = colorFlash(brightBg, glitchAmt, _time);
  }

  if (lBg) {
    // Flat bg fills gaps between grid cells at certain sizes
    fillBackground(lBg, W, H, rgbString(brightBg[0], brightBg[1], brightBg[2]));

    // Bayer scaffold — Phase 0 task 0.4 (Nicolai/Raster-Noton)
    // Visible in RESPIRO germoglio/pulsazione/dissoluzione (skips densita/rottura)
    if (worldState.track === 'RESPIRO' &&
        (worldState.phase === 'germoglio' || worldState.phase === 'pulsazione' || worldState.phase === 'dissoluzione')) {
      const dotStr = rgbString(dotRgb[0], dotRgb[1], dotRgb[2]);
      renderBayerScaffold(lBg, W, H, dotStr, 0.04);
    }
  }

  // ── Camera state update ──
  _camZoomTarget = 1.0 + rms * 0.015;
  _camZoom      += (_camZoomTarget - _camZoom) * 0.04;
  _camDriftX    += (_camTargetX - _camDriftX)  * 0.008;
  _camDriftY    += (_camTargetY - _camDriftY)  * 0.008;

  // ── 2. MG layer: continuous audio darkness (audioDensity shadow layer) ──
  // Loud sound creates slight shadow dots on top of bg — silence = pure color
  if (lMg && intensity > 0.05) {
    const shadowAlpha  = clamp(intensity * 0.22, 0, 0.22);
    const shadowRgb    = lerpColor(brightBg, dotRgb, 0.35);  // bg→dot, not full dark
    lMg.fillStyle = rgbString(shadowRgb[0] | 0, shadowRgb[1] | 0, shadowRgb[2] | 0);
    for (let r = 0; r < rows; r++) {
      const ny = r / rows;
      for (let c = 0; c < cols; c++) {
        const nx = c / cols;
        const d  = audioDensity(audio, state, nx, ny) * shadowAlpha * 3.5;
        if (d > 0.02 && bayerTest(c, r, clamp(d, 0, 1))) {
          lMg.fillRect(c * DOT_SIZE, r * DOT_SIZE, DOT_SIZE, DOT_SIZE);
        }
      }
    }
  }

  // ── 3. Spawn holes from voice (CH5) and lead echo (CH6) ──
  // Rottura: also react to kick (CH0), bass (CH3) — everything carves holes
  for (const n of midiTrail) {
    const isVoiceLead = n.ch === 5 || n.ch === 6;
    const isRotturaExtra = rupture.stage === 'takeover' && (n.ch === 0 || n.ch === 3 || n.ch === 7);
    if ((isVoiceLead || isRotturaExtra) && n.time < dt * 2 && n.alpha > 0.4) {
      const isEcho = n.ch === 6;
      const isKick = n.ch === 0;
      const hx = clamp(0.15 + n.note * 0.7 + (isKick ? (Math.random() - 0.5) * 0.3 : 0), 0.05, 0.95);
      const hy = clamp(0.15 + (1 - n.note) * 0.7 + (isEcho ? 0.05 : 0), 0.05, 0.95);
      // Rottura: holes open progressivamente più veloci, grandi, sovrapposti
      const rotturaBoost = lerp(1.0, 3.0, ruptI);
      _holes.push({
        x: hx,
        y: hy,
        radius: ruptI * 0.02,           // omen: piccola apertura istantanea; takeover: 0.02
        maxRadius: _params.holeSize * (isEcho ? 0.6 : 1) * n.vel * rotturaBoost,
        alpha: _params.holeDepth * (isEcho ? 0.5 : 1),
        closing: false,
        growSpeed: (isEcho ? 0.08 : 0.15) * lerp(1, 5, ruptI),
      });
      // Camera drifts toward latest melody hole
      if (!isEcho) {
        _camTargetX = (hx - 0.5) * -W * 0.015;   // subtle: max ~±1.5% of W
        _camTargetY = (hy - 0.5) * -H * 0.015;
      }
    }
  }

  const holeCap = Math.round(lerp(30, 60, ruptI));
  if (_holes.length > holeCap) _holes.splice(0, _holes.length - holeCap);

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

  // ── 4. FG layer: update holes + draw — camera-transformed ──
  if (lFg) applyCameraTransform(lFg, W, H, { zoom: _camZoom, driftX: _camDriftX, driftY: _camDriftY, time: _time });

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

    // ── 5. Organic circular hole with soft edge and color gradient ──
    const hcx    = h.x * W;
    const hcy    = h.y * H;
    const hradPx = h.radius * Math.min(W, H);

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
        const edgeFade  = 1 - dist * dist;                 // quadratic falloff
        const holeDark  = h.alpha * edgeFade;

        // Bayer threshold modulated by distance for soft organic edge
        // In rottura: glitched Bayer lookup breaks the organic softness
        const bayerVal  = bayerAt(gc + (glitchAmt > 0.3 ? Math.floor(Math.sin(_time * 47 + gc) * glitchAmt * 3) : 0),
                                   gr + (glitchAmt > 0.3 ? Math.floor(Math.cos(_time * 53 + gr) * glitchAmt * 2) : 0));
        const threshold = clamp(holeDark - bayerVal * (1 - edgeFade) * 0.3, 0, 1);

        if (threshold > bayerVal) {
          // Color: center blends strongly toward dot, edge back toward bg
          const t   = holeDark * 0.85;
          const rgb = lerpColor(brightBg, dotRgb, t);
          if (lFg) {
            lFg.fillStyle = rgbString(rgb[0] | 0, rgb[1] | 0, rgb[2] | 0);
            lFg.fillRect(px, py, DOT_SIZE, DOT_SIZE);
          }

          // Write darker mark into OVERLAY (memory of the hole)
          if (lOv) {
            const sRgb = lerpColor(bgRgb, dotRgb, clamp(holeDark * 0.55, 0, 1));
            lOv.fillStyle = rgbString(sRgb[0] | 0, sRgb[1] | 0, sRgb[2] | 0, holeDark * 0.35);
            lOv.fillRect(px, py, DOT_SIZE, DOT_SIZE);
          }
        }
      }
    }
  }

  if (lFg) restoreCameraTransform(lFg);

  // ── 6. Composite layers onto main canvas ──
  compositeLayers(ctx);
}

// ── Destroy ───────────────────────────────────────────────
export function destroy() {
  _holes = [];
  clearAllLayers();
  _camDriftX = 0;
  _camDriftY = 0;
}
