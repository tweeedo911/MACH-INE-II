/*
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         PRESET ENGINE                                    ║
 * ║        Meta-Artistic → Technical Configuration Translator                ║
 * ║                                                                           ║
 * ║  Transforms high-level artistic choices (mood, genre, intensity arc)     ║
 * ║  into complete CFG patches. Non-technical composition authoring.         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
// MIDI NOTE LOOKUP
// ═══════════════════════════════════════════════════════════════════════════

const NOTE_TO_MIDI = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11
};

// Nomi note preferiti per leggibilità (Bb > A#, Eb > D# — convenzione musicale)
const MIDI_TO_NOTE = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'
];

// ═══════════════════════════════════════════════════════════════════════════
// SCALE & MODE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const MODES = {
  lydian: [0, 2, 4, 6, 7, 9, 11],
  ionian: [0, 2, 4, 5, 7, 9, 11], // major
  dorian: [0, 2, 3, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10], // natural minor
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10]
};

const MODE_ALIASES = {
  'major': 'ionian',
  'minor': 'aeolian'
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Convert note name to MIDI (relative to octave 0)
// ═══════════════════════════════════════════════════════════════════════════

function noteToPitchClass(noteName) {
  return NOTE_TO_MIDI[noteName] || 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Generate scale note set for a given root and mode
// ═══════════════════════════════════════════════════════════════════════════

function generateScale(rootMidi, modeName) {
  const intervals = MODES[modeName] || MODES.dorian;
  const notes = [];

  // Span from bass root (2 octaves below) to high register (2 octaves above)
  for (let octave = -2; octave <= 2; octave++) {
    for (const interval of intervals) {
      notes.push(rootMidi + octave * 12 + interval);
    }
  }

  // Remove duplicates and sort
  return Array.from(new Set(notes)).sort((a, b) => a - b);
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Generate pentatonic subset (first 5 unique pitch classes)
// ═══════════════════════════════════════════════════════════════════════════

function generatePentatonic(rootMidi, modeName) {
  const intervals = MODES[modeName] || MODES.dorian;
  const penta = [];

  // Select first 5 intervals in mode
  const selected = intervals.slice(0, 5);

  for (let octave = -1; octave <= 2; octave++) {
    for (const interval of selected) {
      penta.push(rootMidi + octave * 12 + interval);
    }
  }

  return Array.from(new Set(penta)).sort((a, b) => a - b);
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Generate chord voicing (anchor) for a mode
// ═══════════════════════════════════════════════════════════════════════════

function generateAnchorVoicing(rootMidi, modeName) {
  const intervals = MODES[modeName] || MODES.dorian;

  // Third (2nd interval), fifth (4th interval) relative to root
  const third = rootMidi + (intervals[2] ?? 0);
  const fifth = rootMidi + (intervals[4] ?? 0);
  const seventh = rootMidi + (intervals[6] ?? 0);

  return {
    bass: rootMidi - 12,
    bassAlt: fifth - 12,
    ch2: [rootMidi, rootMidi + 12],
    ch4: [third, fifth, rootMidi + 12],
    ch5: [seventh, third + 12, rootMidi + 24]
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Get drone root (lowest stable note in mode)
// ═══════════════════════════════════════════════════════════════════════════

function getDroneRoot(rootMidi, modeName) {
  // Drone nell'ottava 3 (MIDI 48-60) — il riferimento armonico stabile
  const droneOctave3 = rootMidi + 12; // section root è in ottava 2, drone in ottava 3
  // Clamp tra 45 (A2) e 62 (D4) — range drone ragionevole
  return Math.max(45, Math.min(62, droneOctave3));
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECKPOINT GENERATION based on intensity curves
// ═══════════════════════════════════════════════════════════════════════════

// modalSequence viene passato dopo la generazione — i checkpoint usano nomi modo stringa
function generateCheckpoints(intensityCurve, peakPosition, genre, modalSequence) {
  const checkpoints = [];
  const N = 13; // 13 checkpoints over arc

  // Genre baseline modifiers — profilo 4D base per genere
  const genreModifiers = {
    ambient:      { rD: 0.3,  hC: 0.6,  mA: 0.3,  tD: 0.8  },
    techno:       { rD: 0.8,  hC: 0.5,  mA: 0.3,  tD: 0.4  },
    dub:          { rD: 0.5,  hC: 0.4,  mA: 0.2,  tD: 0.5  },
    drone:        { rD: 0.1,  hC: 0.85, mA: 0.1,  tD: 0.95 },
    minimal:      { rD: 0.4,  hC: 0.3,  mA: 0.6,  tD: 0.3  },
    experimental: { rD: 0.6,  hC: 0.75, mA: 0.7,  tD: 0.5  },
  };

  const mods = genreModifiers[genre] || genreModifiers.ambient;

  // Curve shapes: envelope functions returning intensity 0.0-1.0 at pct
  const curveFunc = {
    gentle: (pct) => {
      const p = peakPosition;
      if (pct < p) return (pct / p) * 0.6;
      return 0.6 * Math.exp(-2 * (pct - p) / (1 - p));
    },
    building: (pct) => {
      const p = peakPosition;
      if (pct < p) return (pct / p) * 0.85;
      return 0.85 + 0.15 * Math.cos(Math.PI * (pct - p) / (1 - p) / 2);
    },
    explosive: (pct) => {
      const p = peakPosition;
      if (pct < p) return (pct / p);
      return Math.max(0.3, 1.0 - 1.5 * (pct - p) / (1 - p));
    },
    plateau: (pct) => {
      const p = peakPosition;
      const thresh = 0.4;
      if (pct < thresh) return (pct / thresh) * 0.7;
      if (pct < p) return 0.7;
      return 0.7 * Math.exp(-1.5 * (pct - p) / (1 - p));
    },
    wave: (pct) => {
      const p1 = peakPosition * 0.6;
      const p2 = peakPosition;
      if (pct < p1) return (pct / p1) * 0.5;
      if (pct < p2) return 0.5 + (pct - p1) / (p2 - p1) * 0.35;
      return 0.85 * Math.exp(-1 * (pct - p2) / (1 - p2));
    },
  };

  const curve = curveFunc[intensityCurve] || curveFunc.building;

  // Sequenza modale: 5 sezioni distribuite sull'arco, con ritorno alla prima in chiusura
  // Confini sezione: 0-22%, 22-52%, 52-73%, 73-89%, 89-100%
  const modeBoundaries = [0.0, 0.22, 0.52, 0.73, 0.89, 1.01];
  const seq = modalSequence || ['mode0', 'mode1', 'mode2', 'mode3', 'mode4'];

  function getModeForPct(pct) {
    for (let i = 0; i < modeBoundaries.length - 1; i++) {
      if (pct < modeBoundaries[i + 1]) return seq[Math.min(i, seq.length - 1)];
    }
    return seq[0]; // ritorno alla prima sezione
  }

  for (let i = 0; i < N; i++) {
    const pct = parseFloat((i / (N - 1)).toFixed(3));
    const intensity = curve(pct);

    checkpoints.push({
      pct,
      rD: Math.min(1.0, mods.rD * intensity * 1.3),
      hC: Math.min(1.0, mods.hC * (0.5 + 0.5 * intensity)),
      mA: Math.min(1.0, mods.mA * intensity),
      tD: Math.min(1.0, mods.tD * (0.5 + 0.5 * intensity)),
      mode: getModeForPct(pct),
    });
  }

  // Assicura che primo e ultimo checkpoint siano 0.0 e 1.0
  checkpoints[0].pct = 0.0;
  checkpoints[N - 1].pct = 1.0;

  return checkpoints;
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL SEQUENCE GENERATION
// ═══════════════════════════════════════════════════════════════════════════

function generateModalSequence(rootNote, modalFlavor) {
  const rootMidi = (noteToPitchClass(rootNote) + 36); // C2 octave base

  let modeSequence = [];

  if (modalFlavor === 'bright') {
    modeSequence = ['lydian', 'ionian', 'lydian', 'dorian', 'lydian'];
  } else if (modalFlavor === 'dark') {
    modeSequence = ['phrygian', 'aeolian', 'phrygian', 'aeolian', 'phrygian'];
  } else if (modalFlavor === 'exotic') {
    modeSequence = ['phrygian', 'lydian', 'dorian', 'phrygian', 'lydian'];
  } else { // 'mixed' default
    modeSequence = ['lydian', 'phrygian', 'dorian', 'dorian', 'phrygian'];
  }

  // Each section uses a different root for modal contrast
  // Intervalli relativi: root, b2/2, 4th, 3rd/b3, 5th (relazioni modali naturali)
  const rootOffsets = [0, 1, 5, 4, 7]; // semitoni dalla root base
  const sectionRoots = rootOffsets.map(offset => rootMidi + offset);

  // Convert to named modes with section-specific root
  const modeNames = modeSequence.map((m, idx) => {
    const sectionRoot = sectionRoots[idx] || rootMidi;
    const noteName = MIDI_TO_NOTE[sectionRoot % 12];
    return `${noteName}_${m}`;
  });

  // Generate full scale sets for each mode (using section-specific roots)
  const modes = {};
  modeSequence.forEach((m, idx) => {
    const name = modeNames[idx];
    modes[name] = generateScale(sectionRoots[idx], m);
  });

  // Generate pentatonics
  const pentatonic = {};
  modeSequence.forEach((m, idx) => {
    const name = modeNames[idx];
    pentatonic[name] = generatePentatonic(sectionRoots[idx], m);
  });

  // Generate drone roots (one per mode)
  const droneRoot = {};
  modeSequence.forEach((m, idx) => {
    const name = modeNames[idx];
    droneRoot[name] = getDroneRoot(sectionRoots[idx], m);
  });

  // Generate anchors (5 chord voicings per mode, using section roots)
  const anchors = {};
  modeSequence.forEach((m, idx) => {
    const name = modeNames[idx];
    const sr = sectionRoots[idx];
    anchors[name] = [];
    for (let i = 0; i < 5; i++) {
      anchors[name].push(generateAnchorVoicing(sr + i * 2, m));
    }
  });

  // Generate pivot notes (transition notes between modes)
  const pivotNotes = {};
  for (let i = 0; i < modeNames.length - 1; i++) {
    const from = modeNames[i];
    const to = modeNames[i + 1];
    const key = `${from}->${to}`;
    // Pivot note singola — nota comune tra i due modi (quinta o fondamentale)
    pivotNotes[key] = rootMidi + 12; // root all'ottava centrale come default
  }

  return {
    sequence: modeNames,
    modes,
    pentatonic,
    droneRoot,
    anchors,
    pivotNotes
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// RHYTHM CONFIGURATION from meta-parameters
// ═══════════════════════════════════════════════════════════════════════════

function generateRhythmConfig(meta) {
  const { kickPresence, hatCharacter, breakFrequency, rhythmicComplexity } = meta;

  // Phase thresholds — match CFG.RHYTHM.phaseThresholds naming (v3 layer system)
  // Threshold values scale with rhythmicComplexity: higher complexity = lower thresholds = earlier activation
  const complexityFactor = 1 - rhythmicComplexity * 0.5; // 0.5-1.0

  return {
    bpm: meta.bpm,
    phaseThresholds: {
      arhythmic:  0.0,
      emerging:   0.15 * complexityFactor,
      groove:     0.40 * complexityFactor,
      climax:     0.70 * complexityFactor,
      dissolving: 0.85,
    },
    kick: {
      // Gate probability per phase — match CFG.RHYTHM.kick.gateProbability naming
      gateProbability: {
        arhythmic:  0.0,
        emerging:   Math.min(0.5, 0.25 * kickPresence * 2),
        groove:     Math.min(1.0, 0.80 * kickPresence * 1.25),
        climax:     Math.min(1.0, kickPresence),
        dissolving: Math.min(0.5, 0.30 * kickPresence),
      },
    },
    hat: {
      velTarget: {
        arhythmic:  Math.floor(15 + (hatCharacter === 'dense' ? 15 : 0)),
        emerging:   Math.floor(35 + (hatCharacter === 'dense' ? 20 : 0)),
        groove:     Math.floor(60 + (hatCharacter === 'dense' ? 20 : 0)),
        climax:     Math.floor(85 + (hatCharacter === 'dense' ? 10 : 0)),
        dissolving: Math.floor(25 + (hatCharacter === 'dense' ? 15 : 0)),
      },
      phasingActivePhases: hatCharacter === 'phasing'
        ? ['emerging', 'groove', 'climax']
        : hatCharacter === 'organic'
          ? ['groove', 'climax']
          : hatCharacter === 'dense'
            ? ['emerging', 'groove', 'climax']
            : [],  // minimal = no phasing
    },
    break: {
      probability:     breakFrequency * 0.65,
      minCooldownBars: Math.max(6, Math.floor(10 + (1 - breakFrequency) * 10)),
      maxCooldownBars: Math.max(12, Math.floor(20 + (1 - breakFrequency) * 10)),
      minDurationBars: breakFrequency > 0.5 ? 2 : 1,
      maxDurationBars: breakFrequency > 0.7 ? 4 : 3,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MELODY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

function generateMelodyConfig(meta) {
  const { melodicActivity, melodicCharacter } = meta;

  const characterWeights = {
    lyrical: { jump: 0.2, step: 0.7, repeat: 0.1 },
    angular: { jump: 0.6, step: 0.3, repeat: 0.1 },
    repetitive: { jump: 0.1, step: 0.3, repeat: 0.6 },
    sparse: { jump: 0.3, step: 0.3, repeat: 0.4 }
  };

  const weights = characterWeights[melodicCharacter] || characterWeights.lyrical;

  return {
    emissionProbability: melodicActivity * 0.7,
    markovWeights: {
      stepUp: weights.step * 0.4,
      stepDown: weights.step * 0.4,
      jumpUp: weights.jump * 0.5,
      jumpDown: weights.jump * 0.5,
      repeat: weights.repeat
    },
    character: melodicCharacter
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// VISUAL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

function generateVisualConfig(meta) {
  const paletteMap = {
    luminous: 'default',
    dark: 'abyssal',
    ritual: 'warm',
    cosmic: 'cold',
    industrial: 'steel',
    organic: 'amber'
  };

  const cameraPrefs = {
    wide: { primary: 'WIDE', secondary: 'MEDIUM' },
    intimate: { primary: 'MACRO', secondary: 'MEDIUM' },
    dynamic: { primary: 'WIDE', secondary: 'DRIFT' },
    mixed: { primary: 'MEDIUM', secondary: 'WIDE' }
  };

  return {
    palette: paletteMap[meta.mood] || 'default',
    density: {
      baseMultiplier: 0.5 + meta.visualDensity * 0.5,
      peakMultiplier: 1.0 + meta.visualDensity * 0.5
    },
    dotScale: meta.dotScale || 1.0,
    camera: cameraPrefs[meta.cameraStyle] || cameraPrefs.mixed
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN: Generate complete configuration patch
// ═══════════════════════════════════════════════════════════════════════════

export function generateConfig(meta) {
  const validated = validateMeta(meta);

  // Duration
  const concertDurationSec = validated.durationMin * 60;

  // Modal system — genera prima perché i checkpoint hanno bisogno dei nomi modo
  const modalSystem = generateModalSequence(validated.rootNote, validated.modalFlavor);

  // Checkpoints — usa la sequenza modale generata per assegnare i nomi modo
  const checkpoints = generateCheckpoints(
    validated.intensityCurve,
    validated.peakPosition,
    validated.genre,
    modalSystem.sequence
  );

  // Rhythm config
  const rhythmConfig = generateRhythmConfig(validated);

  // Melody config
  const melodyConfig = generateMelodyConfig(validated);

  // Visual config
  const visualConfig = generateVisualConfig(validated);

  // Build the final patch — structured to match CFG layout for deep merge
  // CFG uses MACRO.*, RHYTHM.*, MELODY.* sub-objects
  const patch = {
    _isConfigPatch: true,
    _meta: {
      name: validated.name,
      createdAt: new Date().toISOString(),
      harmonicLanguage: validated.harmonicLanguage,
      harmonicDensity: validated.harmonicDensity,
    },

    // ── MACRO sub-object (merged into CFG.MACRO) ──
    MACRO: {
      concertDurationSec,
      bpmReference: validated.bpm,
      checkpoints,
      modalSequence: modalSystem.sequence,
      modes: modalSystem.modes,
      pentatonic: modalSystem.pentatonic,
      droneRoot: modalSystem.droneRoot,
      anchors: modalSystem.anchors,
      pivotNotes: modalSystem.pivotNotes,
      // Progressioni — indici nei 5 anchor voicing per modo
      progressionSlow: modalSystem.sequence.reduce((acc, mode) => {
        acc[mode] = [0, 0, 1, 0]; return acc;
      }, {}),
      progressionCycle: modalSystem.sequence.reduce((acc, mode) => {
        acc[mode] = [0, 0, 0, 1, 0, 3, 0, 0, 2, 1, 0, 4, 0, 3, 2, 0]; return acc;
      }, {}),
      progressionFast: modalSystem.sequence.reduce((acc, mode) => {
        acc[mode] = [0, 4, 3, 0, 4, 0, 3, 4]; return acc;
      }, {}),
    },

    // ── RHYTHM sub-object (merged into CFG.RHYTHM) ──
    RHYTHM: {
      bpm: validated.bpm,
      phaseThresholds: rhythmConfig.phaseThresholds,
      kick: rhythmConfig.kick,
      hat: rhythmConfig.hat,
      break: rhythmConfig.break,
    },

    // ── MELODY sub-object (merged into CFG.MELODY) ──
    MELODY: {
      activityGateFloor: Math.max(0.02, 0.06 - validated.melodicActivity * 0.04),
    },
  };

  return patch;
}

// ═══════════════════════════════════════════════════════════════════════════
// Get default meta-artistic parameters
// ═══════════════════════════════════════════════════════════════════════════

export function getDefaultMeta() {
  return {
    name: 'Untitled Composition',
    mood: 'luminous',
    genre: 'ambient',
    durationMin: 45,
    bpm: 88,
    intensityCurve: 'building',
    peakPosition: 0.80,
    harmonicLanguage: 'modal',
    rootNote: 'A',
    modalFlavor: 'mixed',
    harmonicDensity: 0.5,
    rhythmicComplexity: 0.5,
    kickPresence: 0.5,
    hatCharacter: 'phasing',
    breakFrequency: 0.5,
    melodicActivity: 0.5,
    melodicCharacter: 'lyrical',
    visualDensity: 0.5,
    paletteFamily: 'warm',
    cameraStyle: 'mixed',
    dotScale: 1.0
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Validate and fill in missing meta parameters
// ═══════════════════════════════════════════════════════════════════════════

export function validateMeta(meta) {
  const defaults = getDefaultMeta();
  const validated = { ...defaults };

  if (meta) {
    // String fields
    if (typeof meta.name === 'string') validated.name = meta.name;
    if (['luminous', 'dark', 'ritual', 'cosmic', 'industrial', 'organic'].includes(meta.mood)) {
      validated.mood = meta.mood;
    }
    if (['ambient', 'techno', 'dub', 'drone', 'minimal', 'experimental'].includes(meta.genre)) {
      validated.genre = meta.genre;
    }

    // Numeric fields (with clamping)
    if (typeof meta.durationMin === 'number') {
      validated.durationMin = Math.max(20, Math.min(90, meta.durationMin));
    }
    if (typeof meta.bpm === 'number') {
      validated.bpm = Math.max(50, Math.min(140, meta.bpm));
    }
    if (typeof meta.peakPosition === 'number') {
      validated.peakPosition = Math.max(0, Math.min(1, meta.peakPosition));
    }
    if (typeof meta.harmonicDensity === 'number') {
      validated.harmonicDensity = Math.max(0, Math.min(1, meta.harmonicDensity));
    }
    if (typeof meta.rhythmicComplexity === 'number') {
      validated.rhythmicComplexity = Math.max(0, Math.min(1, meta.rhythmicComplexity));
    }
    if (typeof meta.kickPresence === 'number') {
      validated.kickPresence = Math.max(0, Math.min(1, meta.kickPresence));
    }
    if (typeof meta.breakFrequency === 'number') {
      validated.breakFrequency = Math.max(0, Math.min(1, meta.breakFrequency));
    }
    if (typeof meta.melodicActivity === 'number') {
      validated.melodicActivity = Math.max(0, Math.min(1, meta.melodicActivity));
    }
    if (typeof meta.visualDensity === 'number') {
      validated.visualDensity = Math.max(0, Math.min(1, meta.visualDensity));
    }
    if (typeof meta.dotScale === 'number') {
      validated.dotScale = Math.max(0.5, Math.min(2.0, meta.dotScale));
    }

    // Enumeration fields
    if (['modal', 'tonal', 'atonal', 'microtonal'].includes(meta.harmonicLanguage)) {
      validated.harmonicLanguage = meta.harmonicLanguage;
    }
    if (Object.keys(NOTE_TO_MIDI).includes(meta.rootNote)) {
      validated.rootNote = meta.rootNote;
    }
    if (['bright', 'dark', 'mixed', 'exotic'].includes(meta.modalFlavor)) {
      validated.modalFlavor = meta.modalFlavor;
    }
    if (['gentle', 'building', 'explosive', 'plateau', 'wave'].includes(meta.intensityCurve)) {
      validated.intensityCurve = meta.intensityCurve;
    }
    if (['minimal', 'phasing', 'dense', 'organic'].includes(meta.hatCharacter)) {
      validated.hatCharacter = meta.hatCharacter;
    }
    if (['lyrical', 'angular', 'repetitive', 'sparse'].includes(meta.melodicCharacter)) {
      validated.melodicCharacter = meta.melodicCharacter;
    }
    if (['warm', 'cold', 'monochrome', 'vivid', 'muted'].includes(meta.paletteFamily)) {
      validated.paletteFamily = meta.paletteFamily;
    }
    if (['wide', 'intimate', 'dynamic', 'mixed'].includes(meta.cameraStyle)) {
      validated.cameraStyle = meta.cameraStyle;
    }
  }

  return validated;
}

/*
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                            USAGE EXAMPLE                                 ║
 * ║                                                                           ║
 * ║  import { generateConfig, getDefaultMeta, validateMeta }                 ║
 * ║    from './preset-engine.js';                                            ║
 * ║                                                                           ║
 * ║  // Option A: Use defaults                                               ║
 * ║  const meta = getDefaultMeta();                                          ║
 * ║  const patch = generateConfig(meta);                                     ║
 * ║                                                                           ║
 * ║  // Option B: Custom artistic statement                                  ║
 * ║  const darkTechno = {                                                    ║
 * ║    name: 'Industrial Descent',                                           ║
 * ║    mood: 'dark',                                                         ║
 * ║    genre: 'techno',                                                      ║
 * ║    durationMin: 60,                                                      ║
 * ║    bpm: 120,                                                             ║
 * ║    intensityCurve: 'explosive',                                          ║
 * ║    peakPosition: 0.65,                                                   ║
 * ║    rootNote: 'C#',                                                       ║
 * ║    modalFlavor: 'dark',                                                  ║
 * ║    rhythmicComplexity: 0.9,                                              ║
 * ║    kickPresence: 1.0,                                                    ║
 * ║    visualDensity: 0.8                                                    ║
 * ║  };                                                                       ║
 * ║  const patch = generateConfig(darkTechno);                               ║
 * ║                                                                           ║
 * ║  // The patch can be deep-merged into CFG:                               ║
 * ║  // Object.assign(CFG, patch);                                           ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */
