/**
 * MACH:INE II — Composition Designer UI Logic
 * v2.9.4
 *
 * ES module. All UI logic for designer.html lives here.
 * Imports canonical presets from presets.js (no duplication).
 * Imports generateConfig from preset-engine.js for real 4D preview.
 *
 * Values: sliders display 0-100, but getCurrentMeta() normalizes to 0-1
 * before passing to the engine (matches presets.js / preset-engine.js contract).
 */

import { PRESETS } from './presets.js';
import { generateConfig } from './preset-engine.js';

// ─────────────────────────────────────────────────────────────────────────────
// DOM REFS (set in init)
// ─────────────────────────────────────────────────────────────────────────────

let curveCanvas, curveCtx;

// ─────────────────────────────────────────────────────────────────────────────
// SLIDER UTILS
// ─────────────────────────────────────────────────────────────────────────────

function updateSliderLabel(slider) {
  const el = document.getElementById(slider.id + '-val');
  if (el) el.textContent = slider.value;
}

// ─────────────────────────────────────────────────────────────────────────────
// META READ — all numeric values normalized to 0-1
// ─────────────────────────────────────────────────────────────────────────────

function getCurrentMeta() {
  const chip = (field, fallback) => {
    const el = document.querySelector(`.chip[data-field="${field}"].active`);
    return el ? el.dataset.value : fallback;
  };

  return {
    name:               document.getElementById('name').value || 'MACH:INE II Session',
    durationMin:        parseInt(document.getElementById('duration-min').value),
    bpm:                parseInt(document.getElementById('bpm').value),
    mood:               chip('mood', 'cosmic'),
    genre:              chip('genre', 'experimental'),
    intensityCurve:     chip('intensity-curve', 'building'),
    peakPosition:       parseInt(document.getElementById('peak-position').value) / 100,
    harmonicLanguage:   'modal',
    rootNote:           chip('root-note', 'A'),
    modalFlavor:        chip('modal-flavor', 'mixed'),
    harmonicDensity:    parseInt(document.getElementById('harmonic-density').value) / 100,
    rhythmicComplexity: parseInt(document.getElementById('rhythmic-complexity').value) / 100,
    kickPresence:       parseInt(document.getElementById('kick-presence').value) / 100,
    hatCharacter:       chip('hat-character', 'minimal'),
    breakFrequency:     parseInt(document.getElementById('break-frequency').value) / 100,
    melodicActivity:    parseInt(document.getElementById('melodic-activity').value) / 100,
    melodicCharacter:   chip('melodic-character', 'angular'),
    visualDensity:      parseInt(document.getElementById('visual-density').value) / 100,
    paletteFamily:      chip('palette-family', 'cold'),
    cameraStyle:        chip('camera-style', 'mixed'),
    dotScale:           parseFloat(document.getElementById('dot-scale').value),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// META WRITE — multiply 0-1 values back to 0-100 for slider display
// Handles both canonical format (0-1) and legacy exports (0-100).
// ─────────────────────────────────────────────────────────────────────────────

function normalizeMeta(meta) {
  // Detect legacy format (values > 1 indicate old 0-100 export)
  const fields = [
    'peakPosition', 'harmonicDensity', 'rhythmicComplexity',
    'kickPresence', 'breakFrequency', 'melodicActivity', 'visualDensity',
  ];
  const copy = { ...meta };
  for (const f of fields) {
    if (typeof copy[f] === 'number' && copy[f] > 1) copy[f] = copy[f] / 100;
  }
  return copy;
}

function applyMetaToUI(rawMeta) {
  const meta = normalizeMeta(rawMeta);

  document.getElementById('name').value = meta.name || '';

  const setSlider = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  };

  setSlider('duration-min',        meta.durationMin ?? 45);
  setSlider('bpm',                 meta.bpm ?? 88);
  setSlider('peak-position',       Math.round((meta.peakPosition ?? 0.84) * 100));
  setSlider('harmonic-density',    Math.round((meta.harmonicDensity ?? 0.6) * 100));
  setSlider('rhythmic-complexity', Math.round((meta.rhythmicComplexity ?? 0.7) * 100));
  setSlider('kick-presence',       Math.round((meta.kickPresence ?? 0.5) * 100));
  setSlider('break-frequency',     Math.round((meta.breakFrequency ?? 0.3) * 100));
  setSlider('melodic-activity',    Math.round((meta.melodicActivity ?? 0.5) * 100));
  setSlider('visual-density',      Math.round((meta.visualDensity ?? 0.55) * 100));
  setSlider('dot-scale',           meta.dotScale ?? 1.0);

  document.querySelectorAll('input[type="range"]').forEach(updateSliderLabel);

  const chipFields = {
    'mood':              meta.mood ?? 'cosmic',
    'genre':             meta.genre ?? 'experimental',
    'intensity-curve':   meta.intensityCurve ?? 'building',
    'root-note':         meta.rootNote ?? 'A',
    'modal-flavor':      meta.modalFlavor ?? 'mixed',
    'hat-character':     meta.hatCharacter ?? 'minimal',
    'melodic-character': meta.melodicCharacter ?? 'angular',
    'palette-family':    meta.paletteFamily ?? 'cold',
    'camera-style':      meta.cameraStyle ?? 'mixed',
  };

  for (const [field, value] of Object.entries(chipFields)) {
    document.querySelectorAll(`.chip[data-field="${field}"]`).forEach(chip => {
      chip.classList.remove('active', 'cyan', 'magenta');
      if (chip.dataset.value === value) {
        chip.classList.add('active');
        if (['mood', 'genre', 'palette-family'].includes(field)) chip.classList.add('cyan');
        else if (['melodic-character', 'hat-character'].includes(field)) chip.classList.add('magenta');
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTENSITY CURVE PREVIEW (visual reference — shape only, not engine data)
// ─────────────────────────────────────────────────────────────────────────────

function drawCurvePreview(curve, peakPos) {
  const w   = curveCanvas.width;
  const h   = curveCanvas.height;
  const pad = 16;
  const pw  = w - pad * 2;
  const ph  = h - pad * 2;

  curveCtx.fillStyle = '#111';
  curveCtx.fillRect(0, 0, w, h);

  curveCtx.strokeStyle = 'rgba(255,255,255,0.1)';
  curveCtx.lineWidth = 1;
  curveCtx.strokeRect(pad, pad, pw, ph);

  curveCtx.strokeStyle = '#00AACC';
  curveCtx.lineWidth = 2;
  curveCtx.beginPath();

  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    let v = 0;
    switch (curve) {
      case 'gentle':    v = Math.sin(t * Math.PI / 2) * 0.8; break;
      case 'building':  v = Math.pow(t, 1.2); break;
      case 'explosive': v = t < 0.7 ? Math.pow(t / 0.7, 2) : 1 - Math.pow((t - 0.7) / 0.3, 1.5) * 0.5; break;
      case 'plateau':   v = t < 0.3 ? t / 0.3 : 0.95; break;
      case 'wave':      v = t < 0.5 ? Math.sin(t * Math.PI) * 0.8 : Math.sin((t - 0.5) * Math.PI) * 0.6 + 0.2; break;
    }
    const x = pad + t * pw;
    const y = pad + (1 - v) * ph;
    i === 0 ? curveCtx.moveTo(x, y) : curveCtx.lineTo(x, y);
  }
  curveCtx.stroke();

  // Peak position marker
  const px = pad + peakPos * pw;
  curveCtx.strokeStyle = '#FF4400';
  curveCtx.lineWidth = 1.5;
  curveCtx.beginPath();
  curveCtx.moveTo(px, pad);
  curveCtx.lineTo(px, pad + ph);
  curveCtx.stroke();

  curveCtx.fillStyle = '#FF4400';
  curveCtx.font = '9px Courier New';
  curveCtx.textAlign = 'center';
  curveCtx.fillText(Math.round(peakPos * 100) + '%', px, pad - 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4D PREVIEW — real values from preset-engine at peak moment
// ─────────────────────────────────────────────────────────────────────────────

function update4DPreview(meta) {
  try {
    const patch = generateConfig(meta);
    const checkpoints = patch.MACRO?.checkpoints;
    if (!checkpoints?.length) return;

    // Find checkpoint closest to peakPosition
    const peak = checkpoints.reduce((best, cp) =>
      Math.abs(cp.pct - meta.peakPosition) < Math.abs(best.pct - meta.peakPosition) ? cp : best
    );

    document.getElementById('bar-rd').style.width = (peak.rD * 100).toFixed(1) + '%';
    document.getElementById('bar-hc').style.width = (peak.hC * 100).toFixed(1) + '%';
    document.getElementById('bar-ma').style.width = (peak.mA * 100).toFixed(1) + '%';
    document.getElementById('bar-td').style.width = (peak.tD * 100).toFixed(1) + '%';
  } catch {
    // Leave bars unchanged on error
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE ALL PREVIEWS
// ─────────────────────────────────────────────────────────────────────────────

function updatePreviews() {
  const meta = getCurrentMeta();
  drawCurvePreview(meta.intensityCurve, meta.peakPosition);
  update4DPreview(meta);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT / LAUNCH / COPY URL
// ─────────────────────────────────────────────────────────────────────────────

function exportJSON() {
  const meta = getCurrentMeta();
  const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `mach-preset-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showNotification('Preset esportato');
}

function launchMachine() {
  const meta    = getCurrentMeta();
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(meta))));
  window.open(`index.html?meta=${encoded}`, '_blank');
  showNotification('Lanciando MACH:INE II...');
}

function copyURL() {
  const meta    = getCurrentMeta();
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(meta))));
  const base    = window.location.href.replace('designer.html', 'index.html');
  navigator.clipboard.writeText(`${base}?meta=${encoded}`).then(() => {
    showNotification('URL copiato');
  });
}

function resetToDefaults() {
  applyMetaToUI(PRESETS[0]);
  updatePreviews();
  document.getElementById('preset-select').value = '';
  showNotification('Reset ai valori di default');
}

// ─────────────────────────────────────────────────────────────────────────────
// LOAD JSON
// ─────────────────────────────────────────────────────────────────────────────

function loadFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const meta = JSON.parse(e.target.result);
      applyMetaToUI(meta); // normalizeMeta called inside
      updatePreviews();
      showNotification('Preset caricato');
    } catch {
      showNotification('Errore nel file JSON');
    }
  };
  reader.readAsText(file);
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

function showNotification(message) {
  const div       = document.createElement('div');
  div.className   = 'notification';
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => {
    div.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => div.remove(), 300);
  }, 2000);
}

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS RESIZE
// ─────────────────────────────────────────────────────────────────────────────

function resizeCanvas() {
  const dpr  = window.devicePixelRatio || 1;
  const rect = curveCanvas.getBoundingClientRect();
  if (!rect.width) return;
  curveCanvas.width  = rect.width * dpr;
  curveCanvas.height = rect.height * dpr;
  curveCtx.scale(dpr, dpr);
  curveCanvas.style.width  = rect.width + 'px';
  curveCanvas.style.height = rect.height + 'px';
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

function init() {
  curveCanvas = document.getElementById('curve-canvas');
  curveCtx    = curveCanvas.getContext('2d');

  // Populate preset selector from presets.js
  const presetSelect = document.getElementById('preset-select');
  PRESETS.forEach((preset, idx) => {
    const option       = document.createElement('option');
    option.value       = idx;
    option.textContent = preset.name;
    presetSelect.appendChild(option);
  });
  presetSelect.addEventListener('change', (e) => {
    if (e.target.value !== '') {
      applyMetaToUI(PRESETS[parseInt(e.target.value)]);
      updatePreviews();
    }
  });

  // Sliders
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.addEventListener('input', () => {
      updateSliderLabel(slider);
      updatePreviews();
    });
  });

  // Chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const field = chip.dataset.field;
      document.querySelectorAll(`.chip[data-field="${field}"]`).forEach(c => {
        c.classList.remove('active', 'cyan', 'magenta');
      });
      chip.classList.add('active');
      if (['mood', 'genre', 'palette-family'].includes(field)) chip.classList.add('cyan');
      else if (['melodic-character', 'hat-character'].includes(field)) chip.classList.add('magenta');
      updatePreviews();
    });
  });

  // Buttons
  document.getElementById('btn-launch').addEventListener('click', launchMachine);
  document.getElementById('btn-export').addEventListener('click', exportJSON);
  document.getElementById('btn-copy-url').addEventListener('click', copyURL);
  document.getElementById('btn-reset').addEventListener('click', resetToDefaults);
  document.getElementById('load-json').addEventListener('change', (e) => loadFromFile(e.target.files[0]));

  // Initial render
  resizeCanvas();
  applyMetaToUI(PRESETS[0]);
  updatePreviews();
}

window.addEventListener('resize', () => { resizeCanvas(); updatePreviews(); });
document.addEventListener('DOMContentLoaded', init);
