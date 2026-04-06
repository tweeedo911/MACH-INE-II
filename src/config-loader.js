/**
 * MACH:INE II — Config Loader
 * v2.8.0
 *
 * Runtime preset application and configuration persistence.
 * Handles deep merging of preset meta into global CFG object,
 * URL parameter loading, and config export/import.
 *
 * No dependencies. Pure ES module.
 * Call applyPreset() BEFORE initAudio/initMIDI in main.js boot sequence.
 */

/**
 * Deep merge utility: recursively merges source into target.
 * Arrays are replaced (not concatenated). Null values clear properties.
 * Preserves CFG object identity (mutates in place).
 *
 * @param {object} target — target object (usually CFG)
 * @param {object} source — source patch object
 * @returns {object} — mutated target
 */
function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;

  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;

    const sourceVal = source[key];

    // Null values delete property
    if (sourceVal === null) {
      delete target[key];
      continue;
    }

    // Arrays are replaced entirely (not merged)
    if (Array.isArray(sourceVal)) {
      target[key] = Array.isArray(sourceVal) ? [...sourceVal] : sourceVal;
      continue;
    }

    // Recursive merge for nested objects
    if (typeof sourceVal === 'object' && sourceVal !== null) {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {};
      }
      deepMerge(target[key], sourceVal);
      continue;
    }

    // Primitives assigned directly
    target[key] = sourceVal;
  }

  return target;
}

/**
 * Apply a preset meta configuration (or raw config patch) to global CFG.
 * Automatically calls preset-engine.js to convert meta → config patch.
 * Must be called BEFORE initAudio/initMIDI in boot sequence.
 *
 * Usage:
 *   applyPreset(PRESETS[0])  // from presets.js
 *   applyPreset(importedMetaJson)
 *   applyPreset({ bpm: 100, ... })  // partial meta
 *
 * @param {object} metaOrPatch — preset meta object or pre-generated config patch
 * @param {object} CFG — reference to global config object (usually imported)
 * @returns {object} — applied patch for logging/debugging
 */
export async function applyPreset(metaOrPatch, CFG) {
  if (!metaOrPatch || typeof metaOrPatch !== 'object') {
    console.error('[CONFIG-LOADER] Invalid preset:', metaOrPatch);
    return null;
  }

  let patch = metaOrPatch;

  // If meta (not yet a config patch), generate patch via preset-engine
  if (!metaOrPatch._isConfigPatch) {
    try {
      const { generateConfig, validateMeta } = await import('./preset-engine.js');
      const validated = validateMeta(metaOrPatch);
      patch = generateConfig(validated);
    } catch (err) {
      console.error('[CONFIG-LOADER] Error loading preset-engine:', err);
      return null;
    }
  }

  // Deep merge patch into CFG
  deepMerge(CFG, patch);

  const presetName = patch._meta?.name || metaOrPatch.name || 'custom';
  console.log('[CONFIG-LOADER] Applied preset:', presetName);

  return patch;
}

/**
 * Apply a preset synchronously before async boot sequence.
 * For URL param loading (?preset=glaciale-ambient).
 * Returns a Promise that resolves when preset is applied.
 *
 * Usage (in main.js before initAudio):
 *   await loadPresetFromURL(CFG);
 *
 * @param {object} CFG — global config object
 * @returns {Promise<object|null>} — applied patch or null
 */
export async function loadPresetFromURL(CFG) {
  const params = new URLSearchParams(window.location.search);
  const presetName = params.get('preset');
  const configPath = params.get('config');

  if (presetName) {
    try {
      const { getPresetByName } = await import('./presets.js');
      const meta = getPresetByName(presetName);
      if (meta) {
        console.log('[CONFIG-LOADER] Loading preset from URL:', presetName);
        return await applyPreset(meta, CFG);
      } else {
        console.warn('[CONFIG-LOADER] Preset not found:', presetName);
      }
    } catch (err) {
      console.error('[CONFIG-LOADER] Error loading preset:', err);
    }
  }

  if (configPath) {
    try {
      console.log('[CONFIG-LOADER] Loading config from file:', configPath);
      const response = await fetch(configPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return await applyPreset(data, CFG);
    } catch (err) {
      console.error('[CONFIG-LOADER] Error loading config file:', err);
    }
  }

  const metaBase64 = params.get('meta');
  if (metaBase64) {
    try {
      console.log('[CONFIG-LOADER] Loading meta from URL base64 param');
      const json = decodeURIComponent(escape(atob(metaBase64)));
      const meta = JSON.parse(json);
      return await applyPreset(meta, CFG);
    } catch (err) {
      console.error('[CONFIG-LOADER] Error decoding meta param:', err);
    }
  }

  return null;
}

/**
 * Export current runtime config as downloadable JSON.
 * User can reload with ?config=<downloaded-path>
 *
 * Filename: machine-config-TIMESTAMP.json
 *
 * @param {object} CFG — global config object to export
 */
export function exportCurrentConfig(CFG) {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `machine-config-${timestamp}.json`;

  const json = JSON.stringify(CFG, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('[CONFIG-LOADER] Exported config:', filename);
}

/**
 * Export a preset meta object as JSON.
 * Useful for saving custom presets created in UI.
 *
 * Filename: machine-preset-{name-slugified}.json
 *
 * @param {object} meta — preset meta object (from presets.js or custom)
 */
export function exportPreset(meta) {
  if (!meta || !meta.name) {
    console.error('[CONFIG-LOADER] Invalid preset:', meta);
    return;
  }

  const slug = meta.name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const filename = `machine-preset-${slug}.json`;

  const json = JSON.stringify(meta, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('[CONFIG-LOADER] Exported preset:', filename);
}

/**
 * Load and apply a config file selected by user via file input.
 * Returns Promise that resolves when file is applied.
 *
 * Usage (e.g., from file upload handler):
 *   loadPresetFromFile(file, CFG).then(patch => { ... });
 *
 * @param {File} file — File object from input[type=file]
 * @param {object} CFG — global config object
 * @returns {Promise<object|null>} — applied patch or null
 */
export async function loadPresetFromFile(file, CFG) {
  if (!file) return null;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    console.log('[CONFIG-LOADER] Loaded preset from file:', file.name);
    return await applyPreset(data, CFG);
  } catch (err) {
    console.error('[CONFIG-LOADER] Error parsing file:', err);
    return null;
  }
}

/**
 * Clone and export current CFG as preset meta (reverse operation).
 * Extracts musical/artistic intent from full config.
 * Useful for creating custom presets from manual tweaks.
 *
 * @param {object} CFG — global config object
 * @returns {object} — preset-shaped meta object
 */
export function extractPresetFromConfig(CFG) {
  // Extract key musical parameters from CFG structure
  // This is a simplified extraction; full implementation
  // depends on how CFG is structured post-preset-engine.

  const extracted = {
    name: 'Custom Config',
    mood: 'experimental',
    genre: 'experimental',
    durationMin: CFG.DURATION_MIN || 45,
    bpm: CFG.COMPOSER?.bpm || 88,
    intensityCurve: 'building',
    peakPosition: 0.84,
    harmonicLanguage: 'modal',
    rootNote: 'A',
    modalFlavor: 'mixed',
    harmonicDensity: 0.6,
    rhythmicComplexity: 0.7,
    kickPresence: 0.5,
    hatCharacter: 'minimal',
    breakFrequency: 0.3,
    melodicActivity: 0.5,
    melodicCharacter: 'angular',
    visualDensity: 0.55,
    paletteFamily: 'cold',
    cameraStyle: 'mixed',
    dotScale: 1.0,
  };

  return extracted;
}

/**
 * Initialize config loader: check for URL params and load preset if present.
 * Call this immediately after CFG import but BEFORE initAudio/initMIDI.
 *
 * Usage (in main.js):
 *   import { CFG } from './config.js';
 *   import { initConfigLoader } from './config-loader.js';
 *   await initConfigLoader(CFG);
 *   // ... then continue with initAudio/initMIDI
 *
 * @param {object} CFG — global config object
 * @returns {Promise<void>}
 */
export async function initConfigLoader(CFG) {
  console.log('[CONFIG-LOADER] Initializing...');

  // Check for URL param presets/configs
  await loadPresetFromURL(CFG);

  console.log('[CONFIG-LOADER] Ready');
}
