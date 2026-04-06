// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Composizione: LINEE
//  Linee orizzontali parallele. Voicing → Y position.
//  TESSUTO: chords = lines, lead = bright independent line.
// ═══════════════════════════════════════════════════════════

import {
  bayerTest, fillBackground, rgbString, hexToRgb, lerpColor,
  lerp, clamp, mapRange, noiseAt,
} from './visual-toolkit.js';

const PHASE_PARAMS = {
  germoglio:    { lineCount: 2, thickness: 1, gap: 0.15, glissSpeed: 0 },
  pulsazione:   { lineCount: 3, thickness: 2, gap: 0.10, glissSpeed: 0.05 },
  densita:      { lineCount: 5, thickness: 3, gap: 0.06, glissSpeed: 0.10 },
  rottura:      { lineCount: 7, thickness: 5, gap: 0.03, glissSpeed: 0.20 },
  dissoluzione: { lineCount: 2, thickness: 1, gap: 0.15, glissSpeed: 0.02 },
};

let _lines = [];
let _densityWaves = [];
let _time = 0;
let _params = { ...PHASE_PARAMS.germoglio };

export function init(env) {
  _lines = [];
  _densityWaves = [];
  _time = 0;
  _params = { ...(PHASE_PARAMS[env.worldState.phase] || PHASE_PARAMS.germoglio) };

  _lines.push({ targetY: 0.85, currentY: 0.85, brightness: 0.15, isLead: false, isDrone: true });
  for (let i = 0; i < 3; i++) {
    _lines.push({ targetY: 0.3 + i * 0.12, currentY: 0.3 + i * 0.12, brightness: 0.5, isLead: false, isDrone: false });
  }
  _lines.push({ targetY: 0.4, currentY: 0.4, brightness: 0.8, isLead: true, isDrone: false });
}

export function render(ctx, W, H, env) {
  const { worldState, midiTrail, onsetWaves, midi, dt } = env;
  _time += dt;

  const target = PHASE_PARAMS[worldState.phase] || PHASE_PARAMS.germoglio;
  _params.thickness += (target.thickness - _params.thickness) * 0.03;
  _params.gap += (target.gap - _params.gap) * 0.03;
  _params.glissSpeed += (target.glissSpeed - _params.glissSpeed) * 0.03;

  const bgRgb = hexToRgb(worldState.palette.bg);
  const dotRgb = hexToRgb(worldState.palette.dot);
  const accRgb = worldState.palette.accent ? hexToRgb(worldState.palette.accent) : dotRgb;

  fillBackground(ctx, W, H, rgbString(bgRgb[0], bgRgb[1], bgRgb[2]));

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

  for (const n of midiTrail) {
    if (n.ch === 1 && n.time < dt * 2 && n.alpha > 0.4) {
      _densityWaves.push({ x: 0, speed: 0.4 + Math.random() * 0.3, alpha: n.vel });
    }
  }

  for (let i = _densityWaves.length - 1; i >= 0; i--) {
    _densityWaves[i].x += _densityWaves[i].speed * dt;
    _densityWaves[i].alpha *= 0.98;
    if (_densityWaves[i].x > 1.2 || _densityWaves[i].alpha < 0.02) {
      _densityWaves[i] = _densityWaves[_densityWaves.length - 1];
      _densityWaves.length--;
    }
  }
  if (_densityWaves.length > 20) _densityWaves.length = 20;

  const visibleCount = Math.min(_lines.length, Math.ceil(target.lineCount));
  for (let li = 0; li < visibleCount; li++) {
    const line = _lines[li];
    if (!line) continue;

    const speed = line.isDrone ? 0.01 : (line.isLead ? 0.15 : _params.glissSpeed + 0.02);
    line.currentY += (line.targetY - line.currentY) * speed;

    if (!line.isLead) line.brightness *= 0.998;

    const py = line.currentY * H;
    const thickness = Math.max(1, Math.round(_params.thickness * (line.isDrone ? 0.5 : line.isLead ? 1.5 : 1)));
    const dotSize = Math.max(2, thickness * 2);
    const density = clamp(line.brightness * _params.thickness * 0.15, 0.05, 0.85);

    const lineRgb = line.isLead ? accRgb : line.isDrone ? lerpColor(bgRgb, dotRgb, 0.3) : dotRgb;
    const colorStr = rgbString(lineRgb[0], lineRgb[1], lineRgb[2]);

    ctx.fillStyle = colorStr;
    const cols = Math.ceil(W / dotSize);
    for (let c = 0; c < cols; c++) {
      const nx = c / cols;
      let waveDensity = 0;
      for (const w of _densityWaves) {
        const dist = Math.abs(nx - w.x);
        if (dist < 0.08) waveDensity += (1 - dist / 0.08) * w.alpha * 0.4;
      }
      const d = clamp(density + waveDensity + noiseAt(c, li, _time) * 0.05, 0, 1);

      for (let t = 0; t < thickness; t++) {
        const row = Math.floor((py + t * dotSize) / dotSize);
        if (bayerTest(c, row, d)) {
          ctx.fillRect(c * dotSize, py + t * dotSize - thickness * dotSize / 2, dotSize, dotSize);
        }
      }
    }
  }
}

export function destroy() {
  _lines = [];
  _densityWaves = [];
}
