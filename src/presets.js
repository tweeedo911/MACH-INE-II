/**
 * MACH:INE II — Preset Meta Parameters
 * v2.8.0
 *
 * Six curated preset configurations for distinct sonic/visual identities.
 * Each preset is a meta-artistic parameter set fed into preset-engine.js
 * to generate full config patches.
 *
 * No dependencies. Pure ES module.
 */

/**
 * PRESET 1: MACH:INE II Original
 * The canonical experience: balanced cosmic experimental setup.
 * Intento artistico: bilanciato tra complessità ritmica e spazialità.
 */
const ORIGINAL = {
  name: 'MACH:INE II Original',
  mood: 'cosmic',
  genre: 'experimental',
  durationMin: 45,
  bpm: 88,
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

/**
 * PRESET 2: Glaciale Ambient
 * Crystalline frozen soundscape: sparse, harmonic, glacial.
 * Intento artistico: immobilità lirica, densità armonica
 * sostenuta contro assenza di ritmo. Paesaggio ghiacciato.
 */
const GLACIALE_AMBIENT = {
  name: 'Glaciale Ambient',
  mood: 'cosmic',
  genre: 'ambient',
  durationMin: 60,
  bpm: 54,
  intensityCurve: 'gentle',
  peakPosition: 0.85,
  harmonicLanguage: 'modal',
  rootNote: 'D',
  modalFlavor: 'bright',
  harmonicDensity: 0.8,
  rhythmicComplexity: 0.1,
  kickPresence: 0.05,
  hatCharacter: 'minimal',
  breakFrequency: 0.05,
  melodicActivity: 0.15,
  melodicCharacter: 'sparse',
  visualDensity: 0.4,
  paletteFamily: 'cold',
  cameraStyle: 'wide',
  dotScale: 1.6,
};

/**
 * PRESET 3: Rituale Techno
 * Dark driving ritual: pulsing percussive force, phrygian tension.
 * Intento artistico: martellamento ritmico, oscurità modale,
 * energia concentrata verso picco acuto e breve.
 */
const RITUALE_TECHNO = {
  name: 'Rituale Techno',
  mood: 'dark',
  genre: 'techno',
  durationMin: 35,
  bpm: 120,
  intensityCurve: 'explosive',
  peakPosition: 0.75,
  harmonicLanguage: 'modal',
  rootNote: 'D',
  modalFlavor: 'dark',
  harmonicDensity: 0.35,
  rhythmicComplexity: 0.9,
  kickPresence: 0.9,
  hatCharacter: 'dense',
  breakFrequency: 0.6,
  melodicActivity: 0.4,
  melodicCharacter: 'angular',
  visualDensity: 0.65,
  paletteFamily: 'monochrome',
  cameraStyle: 'dynamic',
  dotScale: 0.7,
};

/**
 * PRESET 4: Dub Cosmico
 * Spacious dubby cosmos: syncopated sparse bass, lyrical silence.
 * Intento artistico: spazialità ecosonica, pausa come elemento
 * musicale, due picchi di tensione ondulanti.
 */
const DUB_COSMICO = {
  name: 'Dub Cosmico',
  mood: 'organic',
  genre: 'dub',
  durationMin: 50,
  bpm: 76,
  intensityCurve: 'wave',
  peakPosition: 0.70,
  harmonicLanguage: 'modal',
  rootNote: 'G',
  modalFlavor: 'mixed',
  harmonicDensity: 0.5,
  rhythmicComplexity: 0.5,
  kickPresence: 0.4,
  hatCharacter: 'organic',
  breakFrequency: 0.65,
  melodicActivity: 0.25,
  melodicCharacter: 'lyrical',
  visualDensity: 0.45,
  paletteFamily: 'warm',
  cameraStyle: 'wide',
  dotScale: 1.2,
};

/**
 * PRESET 5: Drone Abissale
 * Deep sustained hypnotic abyss: no rhythm, pure harmonic depth.
 * Intento artistico: sospensione temporale, densità armonica
 * statica, plateau senza picco acuto. Immersione.
 */
const DRONE_ABISSALE = {
  name: 'Drone Abissale',
  mood: 'dark',
  genre: 'drone',
  durationMin: 60,
  bpm: 60,
  intensityCurve: 'plateau',
  peakPosition: 0.55,
  harmonicLanguage: 'modal',
  rootNote: 'A',
  modalFlavor: 'dark',
  harmonicDensity: 0.75,
  rhythmicComplexity: 0.05,
  kickPresence: 0.0,
  hatCharacter: 'minimal',
  breakFrequency: 0.02,
  melodicActivity: 0.15,
  melodicCharacter: 'sparse',
  visualDensity: 0.5,
  paletteFamily: 'muted',
  cameraStyle: 'wide',
  dotScale: 1.8,
};

/**
 * PRESET 6: Minimal Luminoso
 * Clean precise subtle rhythmic clarity: Reich-inspired repetition.
 * Intento artistico: minimalismo lirico, phasing narrativo,
 * luminosità come contrasto modale. Precisione ossessiva.
 */
const MINIMAL_LUMINOSO = {
  name: 'Minimal Luminoso',
  mood: 'luminous',
  genre: 'minimal',
  durationMin: 30,
  bpm: 92,
  intensityCurve: 'building',
  peakPosition: 0.80,
  harmonicLanguage: 'modal',
  rootNote: 'E',
  modalFlavor: 'bright',
  harmonicDensity: 0.4,
  rhythmicComplexity: 0.5,
  kickPresence: 0.3,
  hatCharacter: 'phasing',
  breakFrequency: 0.15,
  melodicActivity: 0.65,
  melodicCharacter: 'repetitive',
  visualDensity: 0.35,
  paletteFamily: 'vivid',
  cameraStyle: 'intimate',
  dotScale: 0.8,
};

/**
 * Public preset collection
 */
export const PRESETS = [
  ORIGINAL,
  GLACIALE_AMBIENT,
  RITUALE_TECHNO,
  DUB_COSMICO,
  DRONE_ABISSALE,
  MINIMAL_LUMINOSO,
];

/**
 * Retrieve preset by exact name match
 * @param {string} name — preset name (case-insensitive search)
 * @returns {object|null} — preset meta object or null if not found
 */
export function getPresetByName(name) {
  const normalized = name?.toLowerCase().trim();
  return PRESETS.find(p => p.name.toLowerCase() === normalized) || null;
}

/**
 * List all available preset names
 * @returns {string[]} — array of preset names
 */
export function listPresetNames() {
  return PRESETS.map(p => p.name);
}

/**
 * Validate preset meta structure
 * @param {object} meta — preset meta object to validate
 * @returns {boolean} — true if valid, false otherwise
 *
 * Technical validation: ensures all required fields exist
 * and values are within expected ranges.
 */
export function validatePresetMeta(meta) {
  if (!meta || typeof meta !== 'object') return false;

  const required = [
    'name', 'mood', 'genre', 'durationMin', 'bpm',
    'intensityCurve', 'peakPosition', 'harmonicLanguage',
    'rootNote', 'modalFlavor', 'harmonicDensity',
    'rhythmicComplexity', 'kickPresence', 'hatCharacter',
    'breakFrequency', 'melodicActivity', 'melodicCharacter',
    'visualDensity', 'paletteFamily', 'cameraStyle', 'dotScale',
  ];

  for (const field of required) {
    if (!(field in meta)) return false;
  }

  // Range checks
  if (meta.durationMin < 20 || meta.durationMin > 90) return false;
  if (meta.bpm < 50 || meta.bpm > 140) return false;
  if (meta.peakPosition < 0 || meta.peakPosition > 1) return false;
  if (meta.harmonicDensity < 0 || meta.harmonicDensity > 1) return false;
  if (meta.rhythmicComplexity < 0 || meta.rhythmicComplexity > 1) return false;
  if (meta.kickPresence < 0 || meta.kickPresence > 1) return false;
  if (meta.breakFrequency < 0 || meta.breakFrequency > 1) return false;
  if (meta.melodicActivity < 0 || meta.melodicActivity > 1) return false;
  if (meta.visualDensity < 0 || meta.visualDensity > 1) return false;
  if (meta.dotScale < 0.5 || meta.dotScale > 2.0) return false;

  // Enum checks
  const moods = ['luminous', 'dark', 'ritual', 'cosmic', 'industrial', 'organic'];
  if (!moods.includes(meta.mood)) return false;

  const genres = ['ambient', 'techno', 'dub', 'drone', 'minimal', 'experimental'];
  if (!genres.includes(meta.genre)) return false;

  const curves = ['gentle', 'building', 'explosive', 'plateau', 'wave'];
  if (!curves.includes(meta.intensityCurve)) return false;

  const languages = ['modal', 'tonal', 'atonal'];
  if (!languages.includes(meta.harmonicLanguage)) return false;

  const flavors = ['bright', 'dark', 'mixed', 'exotic'];
  if (!flavors.includes(meta.modalFlavor)) return false;

  const hatChars = ['minimal', 'phasing', 'dense', 'organic'];
  if (!hatChars.includes(meta.hatCharacter)) return false;

  const melodyChars = ['lyrical', 'angular', 'repetitive', 'sparse'];
  if (!melodyChars.includes(meta.melodicCharacter)) return false;

  const palettes = ['warm', 'cold', 'monochrome', 'vivid', 'muted'];
  if (!palettes.includes(meta.paletteFamily)) return false;

  const cameras = ['wide', 'intimate', 'dynamic', 'mixed'];
  if (!cameras.includes(meta.cameraStyle)) return false;

  return true;
}
