// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: LINEE
//  Linee orizzontali parallele. Voicing → Y position.
//  TESSUTO: chords = lines, lead = bright independent line.
//
//  v3-visual enhancements:
//  - Breathing background noise (audioDensity + Bayer)
//  - Sediment: linee lasciano tracce durante il glissando
//  - Spessore linea modulato da audio.rms (respira)
//  - Micro-oscillazione sinusoidale lungo la lunghezza
//  - Density waves più visibili + color shift verso accent
//  - Camera: drift verticale sulle chord lines, zoom in densita/rottura
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, rgbString, hexToRgb, lerpColor,
  lerp, clamp, mapRange, noiseAt,
  audioDensity, audioFlicker,
  bayerGlitch, colorFlash, shouldGlitch,
  Sediment,
  applyCameraTransform, restoreCameraTransform,
  RISO_OFFSET_X, RISO_OFFSET_Y,
  lerpKForTrack,
} from './visual-toolkit.js';

// ── Phase parameters ──────────────────────────────────────
const PHASE_PARAMS = {
  germoglio:    { lineCount: 2, thickness: 1, gap: 0.15, glissSpeed: 0.00, sedimentRate: 0.94, zoom: 1.00 },
  pulsazione:   { lineCount: 3, thickness: 2, gap: 0.10, glissSpeed: 0.05, sedimentRate: 0.90, zoom: 1.00 },
  densita:      { lineCount: 5, thickness: 3, gap: 0.06, glissSpeed: 0.10, sedimentRate: 0.85, zoom: 1.02 },
  rottura:      { lineCount: 7, thickness: 5, gap: 0.03, glissSpeed: 0.20, sedimentRate: 0.78, zoom: 1.04 },
  dissoluzione: { lineCount: 2, thickness: 1, gap: 0.15, glissSpeed: 0.02, sedimentRate: 0.95, zoom: 1.00 },
};

// Per-line oscillation parameters (freq in rad/px, amplitude in px)
const LINE_OSC = [
  { freq: 0.018, amp: 1.2 },   // drone (0)
  { freq: 0.022, amp: 1.5 },   // chord 0 (1)
  { freq: 0.015, amp: 1.0 },   // chord 1 (2)
  { freq: 0.019, amp: 1.3 },   // chord 2 (3)
  { freq: 0.030, amp: 2.8 },   // lead (4) — oscillates more
];

let _lines = [];
let _densityWaves = [];
let _time = 0;
let _params = { ...PHASE_PARAMS.germoglio };
let _sediment = null;
let _cameraY = 0;   // smooth target for vertical drift
let _zoom = 1.0;    // smooth zoom
let _onsetThick = 0;  // onset-triggered thickness spike
let _onsetJitterX = 0;  // onset horizontal shift

export function init(env) {
  _lines = [];
  _densityWaves = [];
  _time = 0;
  _params = { ...(PHASE_PARAMS[env.worldState.phase] || PHASE_PARAMS.germoglio) };
  _sediment = new Sediment();
  _cameraY = 0;
  _zoom = 1.0;

  _lines.push({ targetY: 0.85, currentY: 0.85, brightness: 0.15, isLead: false, isDrone: true });
  for (let i = 0; i < 3; i++) {
    _lines.push({ targetY: 0.3 + i * 0.12, currentY: 0.3 + i * 0.12, brightness: 0.5, isLead: false, isDrone: false });
  }
  _lines.push({ targetY: 0.4, currentY: 0.4, brightness: 0.8, isLead: true, isDrone: false });
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, midi, dt, audio, state } = env;
  _time += dt;

  // ── Lerp phase params ─────────────────────────────────
  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  // Per-track tau — Phase 0 task 0.3
  const trackK = lerpKForTrack(worldState.track, dt);
  _params.thickness   += (target.thickness   - _params.thickness)   * trackK;
  _params.gap         += (target.gap         - _params.gap)         * trackK;
  _params.glissSpeed  += (target.glissSpeed  - _params.glissSpeed)  * trackK;
  _params.sedimentRate = target.sedimentRate;
  _zoom += (target.zoom - _zoom) * 0.015;  // very slow zoom transition

  // ── Audio-reactive thickness multiplier ───────────────
  // audio.rms: 0-1, linee più spesse sui momenti intensi
  const rmsThickMul = audio ? clamp(1.0 + audio.rms * 2.0, 0.6, 3.0) : 1.0;

  // ── Colors ────────────────────────────────────────────
  const bgRgb  = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;

  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

  // ── Background breathing noise ────────────────────────
  // Faint halftone field between the lines, reacts to audio
  if (audio && state) {
    const noiseDotSize = 4;
    const noiseCols = Math.ceil(W / noiseDotSize);
    const noiseRows = Math.ceil(H / noiseDotSize);
    const noiseRgb = lerpColor(bgRgb, dotRgb, 0.25);
    ctx.fillStyle = rgbString(noiseRgb[0], noiseRgb[1], noiseRgb[2]);
    for (let r = 0; r < noiseRows; r++) {
      const ny = r / noiseRows;
      for (let c = 0; c < noiseCols; c++) {
        const nx = c / noiseCols;
        let d = audioDensity(audio, state, nx, ny) * 0.10;
        d += audioFlicker(state, _time, nx, ny) * 0.04;
        d += noiseAt(c, r, _time * 0.3) * 0.02;
        if (d > 0.005 && bayerTest(c, r, clamp(d, 0, 1))) {
          ctx.fillRect(c * noiseDotSize, r * noiseDotSize, noiseDotSize, noiseDotSize);
        }
      }
    }
  }

  // ── MIDI note reading ─────────────────────────────────
  const chordNotes = [];
  for (const n of midiTrail) {
    if (n.ch === 4 && n.alpha > 0.2) chordNotes.push(n.note);
    if (n.ch === 2 && n.alpha > 0.1) {
      _lines[0].targetY = mapRange(n.note, 0, 1, 0.9, 0.75);
      _lines[0].brightness = lerp(_lines[0].brightness, 0.25, 0.05);
    }
    if (n.ch === 6 && n.alpha > 0.2) {
      const leadLine = _lines.find(l => l.isLead);
      if (leadLine) {
        leadLine.targetY = mapRange(n.note, 0, 1, 0.15, 0.75);
        leadLine.brightness = lerp(leadLine.brightness, 1.0, 0.2);
      }
    }
  }

  chordNotes.sort();
  for (let i = 0; i < Math.min(chordNotes.length, 3); i++) {
    const lineIdx = i + 1;
    if (_lines[lineIdx] && !_lines[lineIdx].isDrone && !_lines[lineIdx].isLead) {
      _lines[lineIdx].targetY = mapRange(chordNotes[i], 0, 1, 0.15, 0.80);
      _lines[lineIdx].brightness = 0.7;
    }
  }

  // ── Density waves (percussion) ────────────────────────
  for (const n of midiTrail) {
    if (n.ch === 1 && n.time < dt * 2 && n.alpha > 0.4) {
      _densityWaves.push({
        x: 0,
        speed: 0.4 + Math.random() * 0.3,
        alpha: n.vel,
        colorShift: n.vel * 0.6,   // quanto colore accent iniettare al passaggio
      });
    }
  }

  for (let i = _densityWaves.length - 1; i >= 0; i--) {
    _densityWaves[i].x     += _densityWaves[i].speed * dt;
    _densityWaves[i].alpha *= 0.98;
    if (_densityWaves[i].x > 1.2 || _densityWaves[i].alpha < 0.02) {
      _densityWaves[i] = _densityWaves[_densityWaves.length - 1];
      _densityWaves.length--;
    }
  }
  if (_densityWaves.length > 20) _densityWaves.length = 20;

  // ── Onset reactions: thickness spike + horizontal jitter ──
  const isRottura = (env.worldState.phase === 'rottura');
  for (const w of (env.onsetWaves || [])) {
    if (w.strength > 0.4) {
      _onsetThick = Math.max(_onsetThick, w.strength * (isRottura ? 6 : 3));
      _onsetJitterX = (Math.random() - 0.5) * w.strength * (isRottura ? 20 : 8);
    }
  }
  _onsetThick *= 0.85;
  _onsetJitterX *= 0.88;

  // ── Camera: vertical drift follows average chord Y ────
  let chordYSum = 0, chordYCount = 0;
  for (const line of _lines) {
    if (!line.isDrone && !line.isLead) {
      chordYSum += line.currentY;
      chordYCount++;
    }
  }
  const avgChordY = chordYCount > 0 ? chordYSum / chordYCount : 0.5;
  // drift: spostamento verticale sottile verso dove stanno le linee (max ±40px)
  const driftTarget = (avgChordY - 0.5) * H * 0.08;
  _cameraY = lerp(_cameraY, driftTarget, 0.005);

  // ── Sediment: decay previous frame's ghost ────────────
  _sediment.decay(W, H, _params.sedimentRate);

  // ── Apply camera transform (onset shake in rottura) ──
  applyCameraTransform(ctx, W, H, {
    zoom:   _zoom,
    driftX: _onsetJitterX,
    driftY: _cameraY,
    shakeAmount: isRottura ? _onsetThick * 0.5 : 0,
    time:   _time,
  });

  // ── Draw lines ────────────────────────────────────────
  const visibleCount = Math.min(_lines.length, Math.ceil(target.lineCount));

  for (let li = 0; li < visibleCount; li++) {
    const line = _lines[li];
    if (!line) continue;

    const speed = line.isDrone ? 0.01 : (line.isLead ? 0.15 : _params.glissSpeed + 0.02);
    const prevY  = line.currentY;
    line.currentY += (line.targetY - line.currentY) * speed;

    if (!line.isLead) line.brightness *= 0.998;

    const py = line.currentY * H;

    // Spessore: modulato da RMS + tipo linea + onset spike
    const baseThick = _params.thickness * (line.isDrone ? 0.5 : line.isLead ? 1.5 : 1);
    const onsetBoost = 1 + _onsetThick * (line.isLead ? 0.8 : 0.4);
    const thickness = Math.max(1, Math.round(baseThick * rmsThickMul * onsetBoost));
    const dotSize   = Math.max(2, thickness * 2);
    const density   = clamp(line.brightness * _params.thickness * 0.15, 0.05, 0.85);

    // Base color
    const baseLineRgb = line.isLead ? accRgb
                      : line.isDrone ? lerpColor(bgRgb, dotRgb, 0.3)
                      : dotRgb;

    // Oscillation parameters for this line
    const osc = LINE_OSC[li] || LINE_OSC[LINE_OSC.length - 1];

    const cols = Math.ceil(W / dotSize);
    for (let c = 0; c < cols; c++) {
      const nx = c / cols;

      // Micro-oscillazione: spostamento verticale sinusoidale
      // Rottura: per-column Y jitter (lines tremble, not oscillate smoothly)
      const rotturaJitter = isRottura
        ? (noiseAt(c, li, _time * 8) - 0.5) * _onsetThick * 2.5
        : 0;
      const oscY = Math.sin(c * osc.freq + _time * 1.4) * osc.amp + rotturaJitter;

      // Density wave contribution + color shift
      let waveDensity = 0;
      let waveColorShift = 0;
      for (const w of _densityWaves) {
        const dist = Math.abs(nx - w.x);
        if (dist < 0.12) {    // wider than before (0.08 → 0.12)
          const waveFactor = (1 - dist / 0.12) * w.alpha;
          waveDensity    += waveFactor * 0.5;
          waveColorShift += waveFactor * w.colorShift;
        }
      }

      const d = Math.min(clamp(density + waveDensity + noiseAt(c, li, _time) * 0.05, 0, 1), worldState.visualRegime.maxDensity);

      // Color: blend toward accent when wave passes through
      let lineRgb = lerpColor(baseLineRgb, accRgb, clamp(waveColorShift, 0, 0.7));
      // Rottura: brief color flash on random line segments
      if (isRottura && shouldGlitch(0.6, true, _time + c * 0.1 + li * 3)) {
        lineRgb = colorFlash(lineRgb, 0.7, _time + li);
      }
      const colorStr = rgbString(
        clamp(lineRgb[0], 0, 255),
        clamp(lineRgb[1], 0, 255),
        clamp(lineRgb[2], 0, 255)
      );
      ctx.fillStyle = colorStr;

      // Risograph offset: accent plane (lead lines) misregistered by 1 px
      const rdx = line.isLead ? RISO_OFFSET_X : 0;
      const rdy = line.isLead ? RISO_OFFSET_Y : 0;
      for (let t = 0; t < thickness; t++) {
        const baseRowY = py + oscY + t * dotSize - thickness * dotSize / 2;
        const row = Math.floor(baseRowY / dotSize);
        // Rottura: glitched Bayer
        const glitchAmt = isRottura ? 0.3 + _onsetThick * 0.1 : 0;
        const visible = glitchAmt > 0.01
          ? bayerGlitch(c, row, d, glitchAmt, _time)
          : bayerTest(c, row, d);
        if (visible) {
          ctx.fillRect(c * dotSize + rdx, baseRowY + rdy, dotSize, dotSize);
        }
      }
    }

    // Sediment: cattura il frame corrente nel buffer ghost
    // Solo se la linea si è spostata abbastanza (glissando attivo)
    const moved = Math.abs(line.currentY - prevY) * H;
    if (moved > 0.3) {
      const sCtx = _sediment.getCtx();
      const sedColor = line.isLead
        ? rgbString(accRgb[0], accRgb[1], accRgb[2], 0.35)
        : rgbString(dotRgb[0], dotRgb[1], dotRgb[2], 0.15);
      sCtx.fillStyle = sedColor;
      for (let c = 0; c < cols; c++) {
        const oscY = Math.sin(c * osc.freq + _time * 1.4) * osc.amp;
        const baseRowY = py + oscY;
        const row = Math.floor(baseRowY / dotSize);
        if (bayerTest(c, row, density * 0.5)) {
          sCtx.fillRect(c * dotSize, baseRowY, dotSize, dotSize);
        }
      }
    }
  }

  restoreCameraTransform(ctx);

  // ── Composite sediment ghost below live lines ─────────
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.18;
  _sediment.composite(ctx);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

export function destroy() {
  _lines = [];
  _densityWaves = [];
  if (_sediment) {
    _sediment.clear(0, 0);
    _sediment = null;
  }
}
