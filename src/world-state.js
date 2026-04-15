// ═══════════════════════════════════════════════════════════
//  MACH:INE III — World State
//  Single shared state. Director writes, modules read.
// ═══════════════════════════════════════════════════════════

export const worldState = {
  // ── Musical identity ──
  track:  null,     // 'NEBBIA' | 'TESSUTO' | 'SOLCO' | 'RESPIRO' | 'MACCHINA' | 'TEMPESTA' | 'RITORNO'
  scale:  [],       // MIDI note array, e.g. [55,57,58,60,62,64,65,67] for G dorian
  root:   0,        // root MIDI note
  bpm:    null,     // null = no rhythmic clock (ambient)
  phase:  'germoglio',  // germoglio | pulsazione | densita | rottura | dissoluzione

  // ── Budget & constraints (Director sets these per phase) ──
  density: {
    rhythm:  0,
    harmony: 0,
    bass:    0,
    melody:  0,
    texture: 0,
  },
  register: {
    bass:   [36, 55],
    melody: [67, 84],
    lead:   [72, 96],
    chords: [55, 72],
    arp:    [60, 84],
  },
  velocityCeiling: {
    rhythm:  0,
    harmony: 0,
    bass:    0,
    melody:  0,
    texture: 0,
  },
  rhythmGrid: null,  // 16-step array [1,0,0,0,...] or null

  // ── Narrative arc ──
  arc:         0,          // 0.0 → 1.0 concert position
  energy:      'SILENCE',  // SILENCE | BUILDING | ACTIVE | INTENSE | PEAK | RELEASE
  transition:  null,       // { from, to, progress } during DJ-set transition, else null
  barProgress: 0,          // 0.0 → 1.0 position within current bar (for scan lines, sync)
  audioEnergy: 0,          // 0.0 → 1.0 real-time audio energy (RMS + onset + density)

  // ── Master clock (written by rhythm.js, read by all musical modules) ──
  // Single source of truth for the 16-step grid. Prevents drift between modules
  // when M/N toggles or director scrubs phases (each module used to keep its own
  // _step accumulator that diverged on init).
  globalStep: 0,    // 0..15, 16th note position within bar
  globalBar:  0,    // bar counter, monotonic
  globalTick: 0,    // monotonic tick counter (= globalBar*16 + globalStep cumulative). Modules detect changes via this.

  // ── Harmony (written by harmony.js — only exception to read-only rule) ──
  currentChord: [],  // MIDI notes of current chord, for arp

  // ── V3: Degradation (Hecker §A.7) — only active in dissoluzione final 16 bars ──
  // 0 = no degradation; 1 = full degradation. Modules opt-in.
  degradation: {
    noteDropProb:   0,      // 0 → 0.4: probability of dropping a melody/chord note
    timingJitterMs: 0,      // 0 → 25: random delay added to rhythm hits
    chordNoteCount: 99,     // 99 = no limit; 4 → 3 → 2 → 1 = chord stripping
  },

  // ── V3: Rupture envelope (4 stadi: omen→infiltration→takeover→residue) ──
  // Written by director3 only during 'rottura' phase. Null stage outside rottura.
  // comp-* and render.js read this for smooth temporal transitions (not binary isRottura).
  rupture: {
    stage:     null,  // null | 'omen' | 'infiltration' | 'takeover' | 'residue'
    stageT:    0,     // 0→1 progress within current stage
    t:         0,     // 0→1 global position within rottura phase
    intensity: 0,     // 0→1 smooth intensity (omen builds, takeover peaks, residue decays)
  },

  // ── Visual regime (read by renderer) ──
  palette:      { bg: '#000000', dot: '#FFFFFF', accent: null, ruptureTint: null, ruptureBg: null, residual: null },
  visualRegime: { maxDensity: 0.5, minDotSize: 4, composition: 'DEFAULT' },
  camera: {
    zoom:   1.0,        // attuale zoom (scritto da camera.js)
    focusX: 0.5,        // attuale focus X 0→1 (scritto da camera.js)
    focusY: 0.5,        // attuale focus Y 0→1 (scritto da camera.js)
    personality: null,   // bioma attivo — scritto da director3
    phase: null,         // fase corrente — scritta da director3
  },

  // ── ENCORE mode ──
  encoreMode: false,       // true when ENCORE track is active
  encoreScale: 'halfWhole', // 'halfWhole' | 'wholeHalf' | 'prometheus'
  // Per-module cycle lengths (in 16th-note steps). 16 = normal 4/4.
  // Only read when encoreMode is true; normal tracks always use 16.
  encoreCycleLens: {
    rhythm: 16,   // kick+snare always 4/4
    hat: 10,      // 5/8
    bass: 12,     // 3/4
    harmony: 14,  // 7/8
    arp: 22,      // 11/16
    voice: 26,    // 13/16
  },
};

// ── Phase time tracking (internal to director3, exposed for HUD) ──
export const phaseState = {
  elapsed:  0,     // seconds in current phase
  duration: 0,     // total duration of current phase
  progress: 0,     // elapsed / duration (0–1)
};
