// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Centralized Configuration
//  Versione: vedi src/VERSION.js (APP_VERSION)
//  Tutti i parametri numerici vivono qui. Niente magic numbers altrove.
// ═══════════════════════════════════════════════════════════

export const CFG = {
  V3_MODE: true,        // false = v2 behavior (7 motori); true = v3 layer system (Phase 1+)
  bpmLerpBeats: 2,      // BPM transition lerp duration in beats (tempo-relative smoothing)
  debug: false,         // false per performance live — true solo per diagnostica

  // ── A/B MUSIC EXPERIMENT (post-tavola-rotonda 2026-04-06) ──
  // v2 — calibrazione tattica (leggera coerenza armonica, ceiling alzati, silenzi)
  // false = v1 originale (default)
  // Toggle live: tasto 'M'
  MUSIC_EXPERIMENT: false,

  // ── A/C MUSIC STRUCTURAL (post-RESEARCH-V4 2026-04-07) ──
  // v3 — trasformazioni strutturali (call-response, tension waves, walls of sound,
  //      bass cycle extension, Burial stumble, degradation arc)
  // false = nessuna trasformazione strutturale (default)
  // Toggle live: tasto 'N' — combinabile con MUSIC_EXPERIMENT (M)
  // Combinazioni: A=off+off, B=on+off, C=off+on, D=on+on
  MUSIC_STRUCTURAL: false,
  // ── Audio analyser ──
  fftSize: 2048,
  smoothing: 0.82,
  sampleRate: 48000,
  audioInputGain: 5.0,     // gain sull'input microfono/BlackHole (regolabile via [ ])
  audioInputGainMin: 0.5,
  audioInputGainMax: 8.0,
  audioInputGainStep: 0.5,

  // ── Band frequency boundaries (Hz) ──
  bandRanges: {
    sub:  [20, 80],
    low:  [80, 300],
    mid:  [300, 2000],
    high: [2000, 8000],
    air:  [8000, 24000],
  },

  // ── Spectral flux / onset ──
  fluxSmoothingWindow: 30,
  fluxOnsetMultiplier: 1.5,
  fluxMinThreshold: 0.01,

  // ── Energy trajectory ──
  trajectoryWindowSec: 3,
  trajectoryThreshold: 0.04,

  // ── BPM estimation ──
  bpmMaxOnsets: 40,
  bpmMinOnsets: 4,
  bpmMinInterval: 0.2,
  bpmMaxInterval: 2.0,

  // ── Stereo ──
  stereoCorrelationSmoothing: 0.9,

  // ── MIDI ──
  noteFlashDecay: 0.91,
  noteDensityWindowSec: 2,

  // ── Dot-size ──
  dotSizeMin: 1,
  dotSizeMax: 16,

  // ── Density ──
  densityBase: 0.0,
  densityMax: 0.65,          // was 0.45 — wider dynamic range
  densityFloor: 0.01,        // was 0.06 — allow true voids
  densityVoidThreshold: 0.12, // below this → zero (negative space)
  brightnessDensityBoost: 0.06,
  rhythmFlickerAmp: 0.04,
  rhythmFlickerSpeed: 3,

  // ── Zone seeds ──
  zoneCount: 10,
  zoneDotSizeVariation: 0.7,
  zoneDensityVariation: 0.5,
  zoneFlickerPhaseSpread: 1.0,

  // ── Generations ──
  maxEntities: 4000,
  birthRateMin: 0,
  birthRateMax: 60,
  onsetBurstCount: 40,
  midiBurstCount: 15,
  entityLifeMin: 4,
  entityLifeMax: 20,
  fossilDuration: 3,
  fossilDensity: 0.03,
  ageDotSizeGrowth: 6,

  // ── Stereo width ──
  widthCenterFalloff: 3.0,

  // ── Onset wave ──
  onsetWaveSpeed: 800,
  onsetWaveDensity: 0.7,
  onsetWaveWidth: 50,
  onsetDecayRate: 0.92,

  // ── MIDI column ──
  midiColumnWidth: 0.03,
  midiColumnDecay: 0.93,

  // ── Climax ──
  climaxThresholdSec: 3,
  climaxIntensityThreshold: 0.85,
  climaxShiftSpeed: 0.4,
  climaxDotCompress: 0.3,
  climaxDensityBoost: 0.12,   // was 0.25
  climaxCollapseSpeed: 3.0,

  // ── Color decay ──
  colorDecayStart: 0.65,
  colorDecayEnd: 0.92,

  // ── Camera ──
  camLerpFast: 0.08,
  camLerpSlow: 0.02,
  camMediumZoom: 1.5,
  camMacroZoom: 3,
  camMacroReturnSec: 5,
  camPanSpeed: 1.5,
  camPanOscAmp: 0.12,
  camPanOscSpeed: 0.25,

  // ── Director ──
  directorPlateauSec: 4,
  directorChangeThreshold: 0.55,
  chromaticShiftDuration: 20,
  invertDissolveDuration: 1.0,

  // ── Scene system ──
  sceneTransitionBars: 8,
  sceneCutProbability: 0.25,

  // ── Audio-driven arc thresholds (tunable) ──
  arcRmsSilence:   0.10,   // below this = SILENCE
  arcRmsBuilding:  0.28,   // SILENCE→BUILDING
  arcRmsActive:    0.38,   // BUILDING→ACTIVE
  arcRmsIntense:   0.60,   // ACTIVE→INTENSE
  arcRmsPeak:      0.80,   // INTENSE→PEAK
  arcFluxIntense:  0.012,  // flux needed to reach INTENSE
  arcSmoothTau:    0.6,    // RMS smoothing time constant (seconds)
  // State hold times (prevent flickering)
  arcHoldSilence:  2.0,
  arcHoldBuilding: 3.0,
  arcHoldActive:   4.0,
  arcHoldIntense:  3.0,
  arcHoldPeak:     5.0,
  arcHoldDecay:    7.0,

  // ── Render ──
  dotSizeBufferThreshold: 6,
  hudUpdateInterval: 6,
  maxMidiNotesPerFrame: 20,

  // ── FPS limiter ──
  fpsAutoLimit: 30,

  // ── Multi-engine kick suppression ──
  kickDominanceThreshold: 0.6,  // pm below this = kick suppressed (prevents CH0 overlap)

  // ── Modal characteristic note boost (voice CH5) ──
  // Interval in semitones from root that defines the modal identity.
  // LEGACY: keyed by old 7-engine names (used by archived V3 layer system)
  modalCharacteristicNotes: {
    terreno:   9,  // B natural — Dorian 6th from D
    meccanica: 6,  // F# — Dorian 6th from A
    vortice:   3,  // Eb — b2 (Phrygian identity) from D
    solco:     9,  // E natural — Dorian 6th from G
    abisso:    10, // Bb — b2 (Phrygian identity) from A
  },
  // ── Modal characteristic note by MODE NAME (Band con Direttore) ──
  // Salvato da harmony-layer.js — mappatura generica per scale name
  // L'intervallo distintivo del modo (in semitoni dalla root) riceve un velocity boost.
  // Il pattern risuona la "personalità" modale: la 6a maggiore del dorian, la b2 del phrygian, ecc.
  modeCharacteristicInterval: {
    ionian:     11,  // 7a maggiore (sensibile)
    dorian:     9,   // 6a maggiore (distinctive vs aeolian)
    phrygian:   1,   // b2 (semitono caratteristico)
    lydian:     6,   // #4 (tritono ascendente)
    mixolydian: 10,  // b7 (rurale, modale)
    aeolian:    8,   // b6 (minore naturale)
    locrian:    6,   // b5 (instabilità)
  },
  characteristicVelBoost: 15,  // velocity bonus when characteristic note plays

  // ── Oblique strategy events (v4.1) — intentional "mistakes" for character ──
  // Prob per note emission. When triggered: pitch shift ±1-2 semitones out of scale,
  // or velocity spike/drop. Only on CH5/CH6 (melodic lines).
  oblique: {
    probability: 0.025,       // ~2.5% of CH5/CH6 notes — subtle but present
    pitchShiftRange: 2,       // ±1-2 semitones outside the scale
    velSpikeMul: 1.4,         // velocity multiplier for "accent" oblique
    velDropMul: 0.3,          // velocity multiplier for "ghost" oblique
    activeArcMin: 0.10,       // only active after 10% of performance
    activeArcMax: 0.90,       // no oblique events in opening silence or final dissolve
  },

  // ── Composer 1 (TERRENO — D Dorian, dub lento) ──
  composer1Key: 'Digit4',
  COMPOSER: {
    enabled: false,
    bpm: 80,
    phases: {
      germoglio:    { duration: 40,  mode: 'D_dorian',   drone: 62, arc: 'SILENCE'   },
      pulsazione:   { duration: 60,  mode: 'D_phrygian',  drone: 62, arc: 'BUILDING'  },
      densita:      { duration: 90,  mode: 'A_lydian',    drone: 69, arc: 'INTENSE'   },
      rottura:      { duration: 30,  mode: 'D_dorian',    drone: 50, arc: 'PEAK'      },
      dissoluzione: { duration: 80,  mode: 'D_dorian',    drone: 62, arc: 'RELEASE'   },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    euclidean: { normal: [5, 16], rottura: [3, 8] },
    minSilenceRatio: 0.40,
    rupture: {
      presagio:      [0.00, 0.25],
      infiltrazione: [0.25, 0.55],
      takeover:      [0.55, 0.85],
      residuo:       [0.85, 1.00],
      silenceBarsRange: [4, 6],
    },
    voiceLeadingMax: 2,
    droneOscillationBars: 16, // D3<->A2 cycle length in bars (PARTITURA Regola 2)
    droneNoteAlt: 45,         // A2 — alternate drone note for TERRENO tidal oscillation
    midiOutputName: null,
    ghostNoteProbDensita: 0.25,   // ghost note probability in densita
    ghostNoteProbRottura: 0.35,   // ghost note probability in rottura
    ghostNoteVelMin: 18,
    ghostNoteVelMax: 28,
    dissoluzioneKickInBars: 8,  // bars of bass+kick only after rupture hard cut before rest enters
  },

  // ── Composer 2 (MECCANICA — A Dorian, layer poliritmici) ──
  COMPOSER2: {
    toggleKey: 'Digit5',
    bpm: 92,
    gravitationalCenter: 57, // A3
    phases: {
      germoglio:    { duration: 45,  mode: 'A_dorian',   drone: 57, arc: 'SILENCE'  },
      pulsazione:   { duration: 65,  mode: 'A_dorian',   drone: 57, arc: 'BUILDING' },
      densita:      { duration: 130, mode: 'A_dorian',   drone: 57, arc: 'INTENSE'  },
      rottura:      { duration: 35,  mode: 'A_dorian',   drone: 57, arc: 'PEAK'     },
      dissoluzione: { duration: 180, mode: 'A_dorian',   drone: 57, arc: 'RELEASE'  },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    layers: {
      harmonic: { cycleBars: 4, offset: 0.00 },  // prime cycles → realign every 420 bars
      rhythmic: { cycleBars: 3, offset: 0.00 },
      textural: { cycleBars: 5, offset: 0.00 },
      melodic:  { cycleBars: 7, offset: 0.00 },
    },
    grooveShuffleMs: 10,  // ±10ms humanization on rhythmic crossings
    swingMsMax: 12,       // max swing offset in ms at peak phase (densita) — PARTITURA
    ghostNoteProb: 0.30,  // probability of ghost note on offbeats — PARTITURA
    texturalOscBars: 32,  // bars per sinusoidal cycle for TEXTURAL layer presence — PARTITURA
    silenceTarget: {
      germoglio:    0.65,
      pulsazione:   0.45,
      densita:      0.28,
      rottura:      0.18,
      dissoluzione: 0.60,
    },
    rupture: {
      presagioAt:      0.55,
      infiltrazioneAt: 0.70,
      takeoverAt:      0.80,
      residuoAt:       0.88,
    },
    voiceLeadingMax: 2,
    midiOutputName: null,
  },

  // ── Composer 3 (DERIVA — A Lydian, brightness-driven, no beat fisso) ──
  COMPOSER3: {
    toggleKey: 'Digit1',
    bpm: null,  // non usato: il trigger è brightness, non beat
    brightnessTrigger: {
      threshold: 0.40,          // centroid normalizzato sopra cui parte una nota VOICE
      adaptiveWindow: 30,       // frame per la moving average (come fluxSmoothingWindow)
      adaptiveMultiplier: 1.30, // soglia = media × moltiplicatore (come fluxOnsetMultiplier)
      minThreshold: 0.15,       // floor adattivo (come fluxMinThreshold)
    },
    phases: {
      germoglio:    { duration: 40,  mode: 'A_lydian',   drone: 45, arc: 'SILENCE'  },
      pulsazione:   { duration: 60,  mode: 'A_lydian',   drone: 45, arc: 'BUILDING' },
      densita:      { duration: 90,  mode: 'A_lydian',   drone: 45, arc: 'INTENSE'  },
      rottura:      { duration: 30,  mode: 'A_lydian',   drone: 45, arc: 'PEAK'     },
      dissoluzione: { duration: 80,  mode: 'A_lydian',   drone: 45, arc: 'RELEASE'  },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    driftBarSec: 4,           // virtual "bar" length in seconds (no BPM)
    droneExpansionSec: 90,    // seconds to expand root to root+fifth+octave in germoglio — PARTITURA
    voiceGermoglioThreshold: 0.7, // higher brightness threshold in germoglio for rare notes — PARTITURA
    minSilenceRatio: 0.40,
    rupture: {
      presagio:      [0.00, 0.25],
      infiltrazione: [0.25, 0.55],
      takeover:      [0.55, 0.85],
      residuo:       [0.85, 1.00],
    },
    grain: {
      hihatClosed: 42, hihatOpen: 46,
      snare: 38, sideStick: 37, clap: 39, claves: 75,
      tomRange: [64, 65, 66, 67, 68],
    },
    // Progressioni accordali fisse per fase (MIDI assoluto — A Lydian)
    chordProgressions: {
      germoglio:    null,
      pulsazione:   [[57,61,64],[64,68,71],[57,61,64],[59,63,66]],   // A→E→A→B
      densita:      [[57,61,64],[59,63,66],[61,64,68],[64,68,71],[57,61,64],[66,69,73],[68,71,75],[66,69,73,80]], // A→B→C#m→E→A→F#m→G#m→F#add9
      rottura:      null,
      dissoluzione: [[57,61,64],[64,68,71],[57,61,64]],              // A→E→A
    },
    // Virtual bars between chord changes (0 = no chords)
    chordRhythm: {
      germoglio: 0, pulsazione: 4, densita: 2, rottura: 0, dissoluzione: 12,
    },
    voiceLeadingMax: 2,
    midiOutputName: null,
  },

  // ── Composer 4 (VORTICE — D Phrygian, groove driving ipnotico 112bpm) ──
  COMPOSER4: {
    toggleKey: 'Digit6',
    bpm: 112,
    gravitationalCenter: 62, // D4
    phases: {
      germoglio:    { duration: 30,  mode: 'D_phrygian',  drone: 50, arc: 'SILENCE'  },
      pulsazione:   { duration: 50,  mode: 'D_phrygian',  drone: 50, arc: 'BUILDING' },
      densita:      { duration: 70,  mode: 'D_phrygian',  drone: 50, arc: 'INTENSE'  },
      rottura:      { duration: 25,  mode: 'D_phrygian',  drone: 50, arc: 'PEAK'     },
      dissoluzione: { duration: 60,  mode: 'D_phrygian',  drone: 50, arc: 'RELEASE'  },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    variationBars: 16,   // complete pattern change every N bars
    silenceTarget: {
      germoglio: 0.25, pulsazione: 0.12, densita: 0.05,
      rottura: 0.05, dissoluzione: 0.35,
    },
    rupture: {
      presagioAt: 0.50, infiltrazioneAt: 0.65,
      takeoverAt: 0.78, residuoAt: 0.90,
    },
    voiceLeadingMax: 3,
    midiOutputName: null,
  },

  // ── Composer 5 (CRISTALLO — D Lydian, ambient cristallino 54bpm) ──
  COMPOSER5: {
    toggleKey: 'Digit2',
    bpm: 54,
    gravitationalCenter: 62, // D4
    phases: {
      germoglio:    { duration: 60,  mode: 'D_lydian',    drone: 50, arc: 'SILENCE'  },
      pulsazione:   { duration: 80,  mode: 'D_lydian',    drone: 50, arc: 'BUILDING' },
      densita:      { duration: 120, mode: 'D_lydian',    drone: 50, arc: 'INTENSE'  },
      rottura:      { duration: 20,  mode: 'F_locrian',   drone: 51, arc: 'PEAK'     },
      dissoluzione: { duration: 100, mode: 'D_lydian',    drone: 50, arc: 'RELEASE'  },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    shimmerInterval: 3,       // seconds between shimmer arpeggios
    sustainMultiplier: 4.0,   // note duration multiplier (long pads)
    silenceTarget: {
      germoglio: 0.70, pulsazione: 0.55, densita: 0.35,
      rottura: 0.10, dissoluzione: 0.65,
    },
    rupture: {
      presagioAt: 0.60, infiltrazioneAt: 0.75,
      takeoverAt: 0.85, residuoAt: 0.92,
    },
    chordProgressions: {
      germoglio:    [[62,66,69,73]],                                                          // Dmaj7 (pad sostenuto)
      pulsazione:   [[62,66,69,73],[64,68,71,74],[62,66,69,73],[69,73,76,80]],               // Dmaj7→Emaj7→Dmaj7→Amaj7
      densita:      [[62,66,69,73],[64,68,71,76],[66,69,73,78],[69,73,76,80],[62,66,71,73],[59,64,66,71],[61,69,73,80],[67,71,74,78]], // Dmaj7→Eadd9→F#add11→Amaj7→Dadd9→Bm9→Amaj7/C#→Gmaj7
      rottura:      null,
      dissoluzione: [[62,66,69,73],[69,73,76,80],[62,66,69,73],[62,66,69,73]],               // Dmaj7→Amaj7→Dmaj7→Dmaj7 — 4×8=32
    },
    chordRhythm: {
      germoglio: 8, pulsazione: 8, densita: 4, rottura: 0, dissoluzione: 16,
    },
    voiceLeadingMax: 2,
    midiOutputName: null,
  },

  // ── Composer 6 (ABISSO — Bb Phrygian, drone rituale 76bpm) ──
  COMPOSER6: {
    toggleKey: 'Digit3',
    bpm: 76,
    gravitationalCenter: 69, // A4
    phases: {
      germoglio:    { duration: 50,  mode: 'A_phrygian', drone: 45, arc: 'SILENCE'  },
      pulsazione:   { duration: 70,  mode: 'A_phrygian', drone: 45, arc: 'BUILDING' },
      densita:      { duration: 100, mode: 'A_phrygian', drone: 45, arc: 'INTENSE'  },
      rottura:      { duration: 30,  mode: 'A_phrygian', drone: 45, arc: 'PEAK'     },
      dissoluzione: { duration: 90,  mode: 'A_phrygian', drone: 45, arc: 'RELEASE'  },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    heartbeatEvery: 2,        // PULSE every N beats (heartbeat feel)
    risalitaOctaves: 2,       // octave shift during rupture takeover
    silenceTarget: {
      germoglio: 0.75, pulsazione: 0.55, densita: 0.35,
      rottura: 0.15, dissoluzione: 0.70,
    },
    rupture: {
      presagioAt: 0.45, infiltrazioneAt: 0.60,
      takeoverAt: 0.75, residuoAt: 0.90,
    },
    voiceLeadingMax: 1,
    midiOutputName: null,
  },

  // ── Composer 7 (SOLCO — G Dorian, Berlin techno ipnotico 128bpm) ──
  COMPOSER7: {
    toggleKey: 'Digit7',
    bpm: 120,
    gravitationalCenter: 55, // G3
    phases: {
      germoglio:    { duration: 60,  mode: 'G_dorian',   drone: 55, arc: 'SILENCE'  },
      pulsazione:   { duration: 55,  mode: 'G_dorian',   drone: 55, arc: 'BUILDING' },
      densita:      { duration: 80,  mode: 'G_dorian',   drone: 55, arc: 'INTENSE'  },
      rottura:      { duration: 28,  mode: 'G_dorian',   drone: 55, arc: 'PEAK'     },
      dissoluzione: { duration: 65,  mode: 'G_dorian',   drone: 55, arc: 'RELEASE'  },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    sweepBars: 8,
    silenceTarget: {
      germoglio: 0.40, pulsazione: 0.30, densita: 0.15,
      rottura: 0.05, dissoluzione: 0.45,
    },
    climax: {
      presagioAt:      0.15,
      infiltrazioneAt: 0.40,
      takeoverAt:      0.70,
      hardCutAt:       0.85,
    },
    voiceLeadingMax: 2,
    midiOutputName: null,
  },

  // ── MacroComposer v3 — arco narrativo 4D ──────────────────────────────────
  MACRO: {
    // Parametri base
    concertDurationSec: 2580,     // 43 minuti (v4 — 7 fasi)
    bpmReference:       88,        // BPM fallback — usato per bar clock e dove non serve per-mode
    // BPM per modo — ogni fase ha il suo tempo, lerp smooth nelle transizioni
    bpmForMode: {
      'A_lydian':    78,   // NEBBIA/RITORNO — lento, galleggiante
      'Bb_phrygian': 86,   // SOLCO — groove rituale, passo misurato
      'D_dorian':    92,   // MACCHINA — groove meccanico, driving
      'C#_dorian':   100,  // TEMPESTA — techno, urgente
      'E_phrygian':  82,   // RITORNO — rallenta, si dissolve
    },
    microDriftAmp:      0.07,      // ampiezza oscillazione ±7% attorno al target (D-02)
    microDriftFreqSec:  23,        // periodo oscillazione in secondi (numero primo per asimmetria)
    emaTau:             4.0,       // time constant EMA per smoothing valori 4D in secondi
    breathInterval:     12,        // ogni N cambi accordo, forza anchor 0 (tonica) — respiro armonico (era 8, allungato per più viaggio)

    // ── Additive chord entry (v4 — Reich principle) ──
    chordAdditiveEntry: {
      enabled: true,
      barsRootOnly: 2,     // bar con solo root dopo mode change
      barsRootFifth: 2,    // bar con root+quinta prima di voicing pieno
    },

    // Checkpoint array — arco 4D v4 su 43 minuti (2580s), 7 fasi
    // rD=rhythmicDensity, hC=harmonicColor, mA=melodicActivity, tD=textureDepth
    // pct = time / 2580
    checkpoints: [
      // ── NEBBIA (0-3 min) — drone + voci tessono ──
      { pct: 0.000, rD: 0.0,  hC: 0.08, mA: 0.0,  tD: 0.05, mode: 'A_lydian' },  // 0:00 solo drone
      { pct: 0.023, rD: 0.0,  hC: 0.10, mA: 0.04, tD: 0.08, mode: 'A_lydian' },  // 1:00 prime voci emergono
      { pct: 0.047, rD: 0.0,  hC: 0.13, mA: 0.08, tD: 0.12, mode: 'A_lydian' },  // 2:00 voci tessono, CH6 entra

      // ── TESSUTO (3-8 min) — armonia cresce, primo polso ──
      { pct: 0.070, rD: 0.0,  hC: 0.18, mA: 0.12, tD: 0.15, mode: 'A_lydian' },  // 3:00 texture densa
      { pct: 0.116, rD: 0.15, hC: 0.28, mA: 0.18, tD: 0.22, mode: 'A_lydian' },  // 5:00 primo kick + hat griglia
      { pct: 0.163, rD: 0.22, hC: 0.38, mA: 0.22, tD: 0.28, mode: 'Bb_phrygian' }, // 7:00 cambio modale — prima sorpresa

      // ── SOLCO (8-16 min) — groove pieno, 1 break a ~12 min ──
      { pct: 0.186, rD: 0.32, hC: 0.48, mA: 0.30, tD: 0.32, mode: 'Bb_phrygian' }, // 8:00 groove si stabilisce
      { pct: 0.279, rD: 0.50, hC: 0.60, mA: 0.40, tD: 0.40, mode: 'Bb_phrygian' }, // 12:00 groove pieno, zona break
      { pct: 0.349, rD: 0.60, hC: 0.72, mA: 0.48, tD: 0.45, mode: 'Bb_phrygian' }, // 15:00 pre-RESPIRO, picco onda 2

      // ── RESPIRO (16-18 min) — drop totale + pivot tonale ──
      { pct: 0.372, rD: 0.0,  hC: 0.18, mA: 0.08, tD: 0.12, mode: 'Bb_phrygian', instant: true }, // 16:00 DROP
      { pct: 0.395, rD: 0.0,  hC: 0.15, mA: 0.06, tD: 0.10, mode: 'Bb_phrygian' }, // 17:00 silenzio tenuto

      // ── MACCHINA (18-25 min) — groove D Dorian, call-response, swing ──
      { pct: 0.419, rD: 0.35, hC: 0.50, mA: 0.30, tD: 0.35, mode: 'D_dorian' },  // 18:00 groove ritorna in D Dorian
      { pct: 0.500, rD: 0.55, hC: 0.68, mA: 0.45, tD: 0.48, mode: 'D_dorian' },  // 21:30 groove intenso
      { pct: 0.558, rD: 0.65, hC: 0.78, mA: 0.55, tD: 0.55, mode: 'D_dorian' },  // 24:00 pre-TEMPESTA

      // ── TEMPESTA (25-35 min) — climax, false resolution, rimbalzo ──
      { pct: 0.581, rD: 0.78, hC: 0.85, mA: 0.62, tD: 0.62, mode: 'C#_dorian' }, // 25:00 TEMPESTA inizia
      { pct: 0.651, rD: 0.92, hC: 0.90, mA: 0.72, tD: 0.68, mode: 'C#_dorian' }, // 28:00 climax sostenuto
      { pct: 0.698, rD: 0.0,  hC: 0.40, mA: 0.20, tD: 0.30, mode: 'C#_dorian', instant: true }, // 30:00 FALSE RESOLUTION
      { pct: 0.710, rD: 0.0,  hC: 0.40, mA: 0.20, tD: 0.30, mode: 'C#_dorian' }, // 30:30 hold silenzio
      { pct: 0.715, rD: 0.95, hC: 0.70, mA: 0.75, tD: 0.72, mode: 'C#_dorian' }, // 30:45 RIMBALZO
      { pct: 0.756, rD: 1.00, hC: 0.65, mA: 0.82, tD: 0.72, mode: 'C#_dorian' }, // 32:30 PICCO ASSOLUTO
      { pct: 0.791, rD: 0.70, hC: 0.50, mA: 0.60, tD: 0.58, mode: 'E_phrygian' }, // 34:00 inizia a calare

      // ── RITORNO (35-43 min) — dissoluzione, seed, silenzio ──
      { pct: 0.814, rD: 0.30, hC: 0.35, mA: 0.55, tD: 0.55, mode: 'E_phrygian' }, // 35:00 melodia guida
      { pct: 0.872, rD: 0.10, hC: 0.15, mA: 0.35, tD: 0.35, mode: 'E_phrygian' }, // 37:30 sfuma
      { pct: 0.930, rD: 0.0,  hC: 0.08, mA: 0.15, tD: 0.12, mode: 'A_lydian' },  // 40:00 ritorno A Lydian
      { pct: 0.965, rD: 0.0,  hC: 0.05, mA: 0.06, tD: 0.05, mode: 'A_lydian' },  // 41:30 quasi silenzio
      { pct: 1.000, rD: 0.0,  hC: 0.0,  mA: 0.0,  tD: 0.0,  mode: 'A_lydian' },  // 43:00 fine
    ],

    // Sequenza modale — percorso tonale del concerto (D-10)
    modalSequence: ['A_lydian', 'Bb_phrygian', 'D_dorian', 'C#_dorian', 'E_phrygian', 'A_lydian'],

    // Scale note sets — diatoniche estese (2 ottave minimo) per ogni modo
    modes: {
      'A_lydian':    [45, 57, 59, 61, 63, 64, 66, 68, 69, 71, 73, 75, 76, 78, 80, 81], // A3=57, #4=D#
      'Bb_phrygian': [46, 58, 59, 61, 63, 65, 66, 68, 70, 71, 73, 75, 77, 78, 80, 82], // Bb3=58, b2=Cb=B
      'D_dorian':    [38, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74], // D3=50, natural B
      'C#_dorian':   [37, 49, 51, 52, 54, 56, 58, 59, 61, 63, 64, 66, 68, 70, 71, 73], // C#3=49, natural A#
      'E_phrygian':  [40, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76], // E3=52, b2=F
    },

    // Pentatonic subsets per ogni modo (HARM-05 — usati da HarmonyLayer)
    pentatonic: {
      'A_lydian':    [57, 59, 61, 64, 66, 69, 71, 73, 76, 78], // A B C# E F# (no #4, no 7)
      'Bb_phrygian': [58, 61, 63, 65, 68, 70, 73, 75, 77, 80], // Bb Db Eb F Ab
      'D_dorian':    [50, 52, 55, 57, 59, 62, 64, 67, 69, 71], // D E G A B
      'C#_dorian':   [49, 51, 54, 56, 58, 61, 63, 66, 68, 70], // C# D# F# G# A#
      'E_phrygian':  [52, 55, 57, 59, 62, 64, 67, 69, 71, 74], // E G A B D
    },

    // Drone root mapping — radice armonica per modo (HARM-01, D-15)
    // Ogni modo ha la propria root — crea identita' timbrica distinta per fase
    droneRoot: {
      'A_lydian':    57, // A3 — luminoso, galleggiante
      'Bb_phrygian': 58, // Bb3 — scuro, rituale, mezzo tono sopra A
      'D_dorian':    50, // D3 — profondo, terragno
      'C#_dorian':   49, // C#3 — metallico, tensione cromatica con D
      'E_phrygian':  52, // E3 — frigio, dissolve verso A
    },

    // Drone breathing — skip/octave probabilities (HARM-06)
    droneSkipProb:   0.25, // probabilita' base di saltare un rinnovo (piu' bassa a harmonicColor alto)
    droneOctaveProb: 0.60, // probabilita' che la seconda voce (ottava alta) venga inviata

    // Pivot notes per transizioni modali (D-11)
    pivotNotes: {
      'A_lydian->Bb_phrygian':  57, // A3
      'Bb_phrygian->D_dorian':  62, // D4
      'D_dorian->C#_dorian':    57, // A3 (nota comune)
      'C#_dorian->E_phrygian':  64, // E4
      'E_phrygian->A_lydian':   57, // A3
    },

    // Anchor voicings per modo (D-13, H2) — 5 voicings: apertura, pivot, picco, colore, tensione
    // Formato: { bass, bassAlt, ch2: [lo, hi], ch4: [n, n, n] }
    // bassAlt — nota basso alternata per bass melodico (H3); ch2 — drone tracking armonico (H3)
    anchors: {
      'A_lydian': [
        { bass: 45, bassAlt: 52, ch2: [57, 69], ch4: [64, 66, 69] },  // apertura: A2→E3, A3+A4, E4+F#4+A4
        { bass: 40, bassAlt: 45, ch2: [57, 68], ch4: [61, 64, 68] },  // pivot: E2→A2, A3+G#4, C#4+E4+G#4
        { bass: 42, bassAlt: 49, ch2: [57, 69], ch4: [66, 69, 73] },  // picco: F#2→C#3, A3+A4, F#4+A4+C#5
        { bass: 47, bassAlt: 42, ch2: [59, 71], ch4: [59, 64, 66] },  // colore: B2→F#2, B3+B4, B3+E4+F#4
        { bass: 44, bassAlt: 47, ch2: [61, 73], ch4: [61, 66, 69] },  // tensione: G#2→B2, C#4+C#5, C#4+F#4+A4
      ],
      'Bb_phrygian': [
        { bass: 46, bassAlt: 53, ch2: [58, 70], ch4: [63, 65, 70] },  // apertura: Bb2→F3, Bb3+Bb4, Eb4+F4+Bb4
        { bass: 39, bassAlt: 46, ch2: [58, 70], ch4: [65, 68, 70] },  // pivot: Eb2→Bb2, Bb3+Bb4, F4+Ab4+Bb4
        { bass: 41, bassAlt: 46, ch2: [58, 70], ch4: [63, 66, 70] },  // picco: F2→Bb2, Bb3+Bb4, Eb4+Gb4+Bb4
        { bass: 44, bassAlt: 39, ch2: [56, 68], ch4: [60, 63, 68] },  // abisso: Ab2→Eb2, Ab3+Ab4, C4+Eb4+Ab4
        { bass: 39, bassAlt: 41, ch2: [58, 70], ch4: [58, 63, 65] },  // tensione: Eb2→F2, Bb3+Bb4, Bb3+Eb4+F4
      ],
      'D_dorian': [
        { bass: 38, bassAlt: 45, ch2: [50, 62], ch4: [57, 60, 62] },  // apertura: D2→A2, D3+D4, A3+C4+D4
        { bass: 45, bassAlt: 38, ch2: [50, 62], ch4: [57, 62, 65] },  // pivot: A2→D2, D3+D4, A3+D4+F4 (Dm open)
        { bass: 43, bassAlt: 50, ch2: [50, 62], ch4: [57, 60, 64] },  // picco: G2→D3, D3+D4, A3+C4+E4
        { bass: 43, bassAlt: 38, ch2: [55, 67], ch4: [55, 59, 62] },  // IV dorico: G2→D2, G3+G4, G3+B3+D4
        { bass: 36, bassAlt: 43, ch2: [48, 60], ch4: [48, 52, 57] },  // bVII dub: C2→G2, C3+C4, C3+E3+A3
      ],
      'C#_dorian': [
        { bass: 37, bassAlt: 44, ch2: [49, 61], ch4: [58, 61, 68] },  // apertura: C#2→G#2, C#3+C#4, A#3+C#4+G#4
        { bass: 44, bassAlt: 37, ch2: [49, 61], ch4: [58, 61, 64] },  // pivot: G#2→C#2, C#3+C#4, A#3+C#4+E4
        { bass: 42, bassAlt: 49, ch2: [49, 61], ch4: [59, 63, 68] },  // picco: F#2→C#3, C#3+C#4, B3+D#4+G#4
        { bass: 35, bassAlt: 42, ch2: [54, 66], ch4: [54, 58, 61] },  // quarta: B1→F#2, F#3+F#4, F#3+A#3+C#4
        { bass: 40, bassAlt: 44, ch2: [49, 61], ch4: [52, 59, 68] },  // b7 techno: E2→G#2, C#3+C#4, E3+B3+G#4
      ],
      'E_phrygian': [
        { bass: 40, bassAlt: 47, ch2: [52, 64], ch4: [59, 62, 64] },  // apertura: E2→B2, E3+E4, B3+D4+E4
        { bass: 45, bassAlt: 40, ch2: [52, 64], ch4: [60, 64, 67] },  // pivot: A2→E2, E3+E4, C4+E4+G4
        { bass: 47, bassAlt: 40, ch2: [52, 64], ch4: [59, 62, 65] },  // picco: B2→E2, E3+E4, B3+D4+F4
        { bass: 43, bassAlt: 40, ch2: [55, 67], ch4: [55, 59, 62] },  // bIII frigio: G2→E2, G3+G4, G3+B3+D4
        { bass: 36, bassAlt: 43, ch2: [52, 64], ch4: [48, 52, 57] },  // bVI dissoluzione: C2→G2, E3+E4, C3+E3+A3
      ],
    },

    // Cicli progressione per modo — 3 livelli keyed su harmonicColor (D-16)
    // SLOW  (hC < 0.25): 4 step × 4 bar = 43s per ciclo — apertura rarefatta
    // NORMAL (hC 0.25-0.65): 16 step × 2 bar = 87s per ciclo — pieno
    // FAST  (hC ≥ 0.65): 8 step × 1 bar = 22s per ciclo — pulsante techno

    progressionSlow: {
      'A_lydian':    [0, 0, 1, 0],           // root + breve colore, respira
      'Bb_phrygian': [0, 0, 1, 0],           // fallback (Bb parte gia' a hC alto)
      'D_dorian':    [0, 1, 0, 0],           // fallback
      'C#_dorian':   [1, 0, 1, 2],           // fallback
      'E_phrygian':  [0, 0, 3, 0],           // tonica + bIII, chiusura lenta
    },

    progressionCycle: {
      'A_lydian':    [0, 0, 0, 1, 0, 3, 0, 0, 2, 1, 0, 4, 0, 3, 2, 0],  // apre, esplora colori, picco, torna
      'Bb_phrygian': [0, 1, 3, 0, 2, 4, 0, 3, 1, 0, 4, 2, 3, 0, 1, 4],  // rituale: viaggio oscuro, meno tonica
      'D_dorian':    [0, 3, 1, 4, 3, 0, 4, 1, 3, 2, 4, 0, 3, 4, 1, 3],  // macchina: IV e bVII dominano, dub loop
      'C#_dorian':   [1, 4, 2, 3, 4, 1, 3, 2, 4, 3, 1, 4, 2, 3, 4, 2],  // tempesta: zero tonica, tensione pura
      'E_phrygian':  [0, 0, 3, 0, 1, 0, 4, 0, 0, 3, 0, 0, 1, 4, 0, 0],  // dissoluzione: tonica dominante, bIII color
    },

    progressionFast: {
      'A_lydian':    [0, 4, 3, 0, 4, 0, 3, 4],  // root↔tensione con colore — pump lydian
      'Bb_phrygian': [3, 4, 1, 3, 4, 1, 3, 4],  // martellante — oscuro, niente tonica
      'D_dorian':    [3, 4, 3, 4, 3, 4, 0, 4],  // IV↔bVII puro — ostinato dub
      'C#_dorian':   [4, 1, 3, 4, 2, 4, 3, 1],  // tempesta: tutti gli anchor tranne tonica
      'E_phrygian':  [0, 3, 4, 0, 3, 0, 0, 4],  // tonica + bIII + bVI dissoluzione
    },
  },

  // ── RhythmLayer v3 ──────────────────────────────────────────────────────────
  RHYTHM: {
    // ── Parametri base ──
    bpmSource: 'macro',       // 'macro' = usa CFG.MACRO.bpmReference, 'config' = usa bpm sotto
    bpm: 88,                  // fallback BPM se bpmSource !== 'macro'

    // ── Fase arc — threshold su rhythmicDensity (D-01, D-03, RITM-02) ──
    // Ogni fase si attiva quando macroState.rhythmicDensity supera la threshold
    phaseThresholds: {
      arhythmic:    0.0,    // 0-10min: nessun kick, hi-hat rarefatto
      emerging:     0.15,   // 10-20min: kick sporadico, broken feel
      groove:       0.40,   // 20-30min: groove che si consolida
      climax:       0.70,   // 30-40min: 4/4 pieno, poliritmia
      dissolving:   0.85,   // >0.85 poi ridiscende: dissoluzione (mirror arhythmic)
    },

    // ── CH0 PULSE — Kick (D-02, D-03, RITM-02) ──
    kick: {
      note: 36,              // C2 — default fallback
      // v5: kick pitch per modo — ogni sezione ha la sua identità ritmica
      noteForMode: {
        'A_lydian':    33,   // A1 — grave, galleggiante (apertura/chiusura)
        'Bb_phrygian': 34,   // Bb1 — scuro, rituale, mezzo tono sopra
        'D_dorian':    38,   // D2 — terragno, il groove centrale
        'C#_dorian':   37,   // C#2 — metallico, tensione techno
        'E_phrygian':  40,   // E2 — frigio, dissolve verso A
      },
      velDownbeat: 105,       // velocity base downbeat (MIDI-01)
      velOffbeat: 85,         // velocity base offbeat
      humanizeRange: 8,       // ±random velocity variation
      // Probabilita gate per fase (D-03)
      // groove = gate a livello di BAR (non step) — vedere rhythm-layer.js
      gateProbability: {
        arhythmic:  0.0,   // assente
        emerging:   0.25,  // 1 bar su 4 ha il kick — sporadico ma udibile
        groove:     0.80,  // 4 bar su 5 hanno kick — groove solido con respiro
        climax:     1.0,   // ogni step del pattern suona
        dissolving: 0.30,  // si rarefà progressivamente
      },
      // Pattern 16-step (D-02: 4-on-the-floor solo al climax)
      patterns: {
        fourOnFloor: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
        broken1:     [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],   // halftime
        broken2:     [1,0,0,0, 0,0,0,1, 0,0,0,0, 1,0,0,0],   // syncopated
        broken3:     [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],   // displaced
        broken4:     [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],   // anticipazione (kick + pre-beat)
      },
      fillProb: 0.30,         // probabilita' fill (colpo step 15) ogni 4 bar
      // Phrase-gate lengths (R1 — deterministic phrasing, no per-bar random gate)
      phraseLen: {
        emerging: 4,   // 4-bar phrase: kick active only on bar 0 of each phrase
        groove:   8,   // 8-bar phrase: bars 0-6 always active, bar 7 = optional breath
      },
      breathProb: 0.25,  // probability the breath bar (bar 7 of groove phrase) still has a kick
      // Preferred kick pattern per modal section (R2 — KICK_FOR_MODE)
      modePatterns: {
        'A_lydian':    'broken1',     // sparse, contemplativo — apertura e chiusura
        'Bb_phrygian': 'broken3',     // sincopato, tensivo — tensione frigia
        'D_dorian':    'broken2',     // groove classico — sezione centrale
        'C#_dorian':   'fourOnFloor', // 4/4 pieno — identita' del climax
        'E_phrygian':  'broken1',     // sparse — dissoluzione speculare all'apertura
      },
      durMs: 55,              // nota breve — kick acustico
    },

    // ── CH1 GRAIN — Hi-hat continuo (D-04, D-05, D-06, RITM-01) ──
    hat: {
      // Pitch cluster — 4 note ruotate per hit (D-04: variazione per hit, C2-C4)
      pitchCluster: [36, 38, 40, 42],   // C2, D2, E2, F#2 — cluster stretto modulare
      velFloor: 25,           // v5: alzato da 15 — quando il hat passa il textureDepth gate, deve essere udibile
      velTarget: {
        arhythmic:  35,       // v5: alzato da 25 — quando suona, deve essere chiaro
        emerging:   55,       // v5: alzato da 45
        groove:     70,
        climax:     95,
        dissolving: 40,       // v5: alzato da 35
      },
      velScatter: 12,         // ±deviazione gaussiana (D-05)
      // Step per i due sub-pattern phasing Reich (D-11, RITM-04)
      phasingStepsA: 8,       // pattern A — 8 step
      phasingStepsB: 9,       // pattern B — 9 step (convergenza ogni 72 step)
      phasingActivePhases: ['emerging', 'groove', 'climax'],  // D-12: phasing attivo 10-40min
      durMs: 25,              // hi-hat breve — percussivo e secco
      // Densita' hat per fase — stepDivisor dinamico (ogni N 16th-note)
      // Piu' basso = piu' denso. 1 = ogni 16th, 2 = ogni 8th, 4 = ogni quarter
      stepDivisorByPhase: {
        arhythmic:  4,   // quarter note — rarefatto, pulsazione lenta
        emerging:   2,   // 8th note — on-grid, establishes grid before groove kicks in
        groove:     2,   // 8th note — hat costante (precedente default)
        climax:     1,   // 16th note — piena densita'
        dissolving: 2,   // torna a 8th nella dissoluzione
      },
    },

    // ── CH7 Percussion — Glass additive entry (D-07, D-08, D-09, D-10, RITM-03) ──
    perc: {
      // Mappatura note (D-08)
      notes: {
        rimshot:    36,       // C2
        snare:      38,       // D2
        congaHi:    45,       // A2
        congaLo:    48,       // C3
        impact:     60,       // C4 — evento speciale 1
        sweep:      62,       // D4 — evento speciale 2
      },
      // Ordine di ingresso additivo Glass (D-10, RITM-03)
      // Ogni elemento entra quando rhythmicDensity supera la threshold
      // v5: threshold alzati — CH7 entra tardi, è evento non texture
      // Era: 0.08/0.15/0.25/0.40 → ora: 0.25/0.35/0.50/0.65
      additiveEntry: [
        { note: 48, name: 'congaLo',  threshold: 0.25 },  // entra col groove (~35% arc)
        { note: 45, name: 'congaHi',  threshold: 0.35 },  // seconda metà groove (~45% arc)
        { note: 36, name: 'rimshot',  threshold: 0.50 },  // solo in densità alta (~60% arc)
        { note: 38, name: 'snare',    threshold: 0.65 },  // solo al climax (~75% arc)
      ],
      // Note speciali — solo da MacroComposer cue (D-09)
      specialNotes: [60, 62],   // impact e sweep — non nei pattern normali
      specialVel: 110,          // velocity alta per eventi speciali
      specialDurMs: 400,        // nota lunga per impatto
      // Pattern step (lunghezze grid-aligned — tutti multipli di 4, griglia 4/4)
      patternLengths: [8, 16, 8, 16],   // half-bar / full-bar — quantizzati alla griglia
      velBase: 65,
      humanizeRange: 10,
      durMs: 80,
    },

    // ── MIDI Output Optimizations (MIDI-01 through MIDI-04) ──
    midi: {
      // MIDI-01: downbeat emphasis
      downbeatBoost: 0.08,    // +8% velocity sui downbeat (step 0, 4, 8, 12)
      offbeatReduce: 0.05,    // -5% velocity sugli offbeat

      // MIDI-02: pitch range enforcement
      pitchRange: {
        ch0: { min: 33, max: 40 },   // v5: kick pitch per modo (A1=33 to E2=40)
        ch1: { min: 36, max: 60 },   // C2-C4 modulare (D-04)
        ch7: { min: 36, max: 62 },   // C2-D4 (include speciali)
      },

      // MIDI-03: phrase shaping — offset note per evitare attacchi simultanei
      noteOffsetMs: { min: 2, max: 12 },    // range random di sfasamento (Fix A: tightened for on-grid feel)
      // legato/staccato ratio per canale (1.0 = full legato, 0.0 = staccatissimo)
      legatoRatio: {
        ch0: 0.3,   // kick secco
        ch1: 0.2,   // hat staccato
        ch7: 0.5,   // perc media
      },

      // MIDI-04: channel assignment
      channels: { kick: 0, hat: 1, perc: 7 },
    },

    // ── Timing directionality (v4.1) — push/pull offset in ms per phase ──
    // Negative = laid-back (behind the beat), Positive = pushed (ahead of the beat)
    // Applies to kick offbeats only (downbeats stay on-grid for anchor)
    timingPushMs: {
      arhythmic:   0,     // no rhythm = no push
      emerging:   -6,     // lazy, behind the beat — dub feel
      groove:     -3,     // slight laid-back — Four Tet groove
      climax:      4,     // pushed ahead — driving urgency
      dissolving: -8,     // maximum laid-back — time dissolves
    },

    // ── Break ciclici kick+basso (RITM-05) ──
    // Vuoti locali periodici indipendenti dall'arco macro — kick e basso escono,
    // hat/drone/accordi/melodia continuano. Re-entry con punch velocity.
    break: {
      probability:     0.65,  // probabilita' break quando cooldown scaduto
      minCooldownBars: 10,    // barre minime tra un break e il successivo
      maxCooldownBars: 20,    // barre massime tra un break e il successivo
      minDurationBars:  2,    // durata minima break (bar)
      maxDurationBars:  4,    // durata massima break (bar)
      punchVelBoost:      28, // boost velocity kick e basso al re-entry
      minArc:           0.15, // non parte prima del 15% arco (musica deve stabilirsi)
      maxArc:           0.88, // non parte dopo 88% (lascia respirare il finale)
      preBreakBuildBars:  4,  // H4: finestra accumulo pre-break (bar) — hat+hat densificano
      preBreakVelBoost:   8,  // H4: boost velocity hat durante accumulo
    },
  },

  // ── MelodyTextureLayer v3 — CH3 bass melodico, CH5 voce con memoria, CH6 voce indipendente ──
  MELODY: {
    // ── Loop lengths — numeri primi (MELO-02, D-10) ──
    // LCM(7,11,13) = 1001 step — poliritmo perpetuo, nessun ciclo identico
    loopLenCH3: 7,      // CH3 BASS — 7 step
    loopLenCH5: 11,     // CH5 VOICE — 11 step
    loopLenCH6: 13,     // CH6 LEAD — 13 step

    // ── Gating su melodicActivity ──
    activityGateFloor: 0.04,    // sotto questa soglia tutti i canali tacciono
    seedCaptureGateMin: 0.02,   // soglia piu bassa per permettere cattura seed in apertura

    // ── Pitch range per canale (MIDI-02) ──
    pitchRange: {
      3: { min: 24, max: 48 },   // CH3 BASS: C1=24 — C3=48
      5: { min: 36, max: 84 },   // CH5 VOICE: C2=36 — C6=84
      6: { min: 48, max: 84 },   // CH6 LEAD: C3=48 — C6=84 (ottava sopra CH5 base)
    },

    // ── Velocity target per fase melodica ──
    velTarget: {
      sparse:  { ch3: 55, ch5: 45, ch6: 35 },   // apertura / dissoluzione
      medium:  { ch3: 70, ch5: 60, ch6: 50 },   // sezione intermedia
      dense:   { ch3: 85, ch5: 75, ch6: 65 },   // climax
    },
    velHumanize: 8,   // deviazione gaussiana velocity (identico a RHYTHM)

    // ── Seed motivico (MELO-01, D-07, D-08, D-09, M3) ──
    seedLength:    4,       // numero di note nel motivo seed
    seedWindowEnd: 0.15,    // arcPercent massimo per cattura (~6.75min su 45min)
    seedReturnNoteSpacingBars: 0.5,  // spacing tra note seed return in bar (base)

    // M3: 5 ricorrenze con trasformazioni progressive
    // transform: 'original' | 'transpose' | 'invert' | 'retrograde' | 'augment'
    seedRecurrences: [
      { arcAt: 0.12, ch: 5, vel: 55, transform: 'original',  spacingMul: 1.0 },  // TESSUTO — eco conferma
      { arcAt: 0.30, ch: 6, vel: 60, transform: 'transpose',  transposeInterval: 5, spacingMul: 1.0 },  // SOLCO — lead prende il tema, quarta sopra
      { arcAt: 0.50, ch: 5, vel: 65, transform: 'invert',    spacingMul: 1.0 },  // MACCHINA — specchio
      { arcAt: 0.70, ch: 6, vel: 70, transform: 'retrograde', spacingMul: 0.75 }, // TEMPESTA — tensione, note più ravvicinate
      { arcAt: 0.85, ch: 5, vel: 60, transform: 'augment',   spacingMul: 2.0 },  // RITORNO — rallenta e svanisce
    ],

    // ── Probabilita emissione per step (D-06: default meno note, non piu) ──
    // Scalata automaticamente da melodicActivity
    emitProbability: {
      ch3Base: 0.45,   // basso suona piu spesso (struttura armonica)
      ch5Base: 0.25,   // voce melodica rarefatta
      ch6Base: 0.20,   // lead ancora piu rado
    },

    // ── Durata note per canale (ms) — dipende dalla fase ──
    noteDur: {
      ch3: { sparse: 1800, dense: 900 },   // basso lungo in apertura, staccato al climax
      ch5: { sparse: 1200, dense: 600 },
      ch6: { sparse: 800,  dense: 400 },
    },

    // ── Markov voice weights (pattern da composer.js nextVoiceNote) ──
    markov: {
      stepBonus:   1.5,    // bonus movimento per grado — ridotto per frasi con più carattere
      jumpPenalty: 0.35,   // penalty salto grande — aumentato per consentire salti melodici
      seedAffinity:     1.8,    // bonus se intervallo corrisponde al seed
      seedNearAffinity: 1.3,    // bonus se intervallo vicino al seed (diff 1)
      ch6JumpPreference: 1.6,   // CH6 preferisce salti — carattere angoloso (D-03)
      ch6StepReduction:  0.7,   // CH6 riduce bonus step per differenziarsi da CH5
    },

    // ── Arpeggi incrociati (D-05) ──
    arpeggio: {
      activeRange: { min: 0.35, max: 0.75 },  // arcPercent range per arpeggi (~min15-32 v4)
      noteSpacingMs: 350,    // spacing tra note arpeggio
      threshold:    0.20,    // melodicActivity minima per attivare cross-arpeggio (allineato alla window 0.35)
      delayStp:     2,       // steps CH6 arpeggiation delay rispetto a CH5
    },

    // ── Phrase repetition CH5 — cellula melodica ripetuta prima di variare (Reich/Nyman) ──
    phrase: {
      ch5Length:      4,   // note per frase (cellula melodica) — default, override per modo sotto
      ch5RepeatCount: 4,   // ripetizioni prima di generare nuova frase — default
    },

    // ── Mix melodico per modo (M1) — probabilita', velocity, frase, Markov, interlock ──
    // phraseLen: lunghezza frase CH5 (override del default phrase.ch5Length)
    // phraseRepeat: ripetizioni frase prima di rigenerare
    // stepBonus: bonus Markov per moto per grado (alto = melodie legate, basso = salti)
    // jumpPenalty: penalty Markov per salti grandi (basso = più salti melodici ammessi)
    // interlock: prob 0-1 che CH6 replichi il pattern CH5 sfasato (arpeggiatore incrociato)
    modeMix: {
      'A_lydian':    { ch5ProbMul: 0.70, ch6ProbMul: 0.40, ch5VelMul: 0.90, ch6VelMul: 0.80,
                       phraseLen: 3,  phraseRepeat: 6,  stepBonus: 2.0, jumpPenalty: 0.20, interlock: 0.0 },
                       // apertura: frasi corte che si ripetono molto, movimento per grado, nessun interlock

      'Bb_phrygian': { ch5ProbMul: 0.50, ch6ProbMul: 0.25, ch5VelMul: 0.80, ch6VelMul: 0.70,
                       phraseLen: 5,  phraseRepeat: 3,  stepBonus: 1.2, jumpPenalty: 0.40, interlock: 0.15 },
                       // rituale: frasi lunghe ipnotiche, qualche salto, interlock raro

      'D_dorian':    { ch5ProbMul: 1.00, ch6ProbMul: 0.80, ch5VelMul: 1.00, ch6VelMul: 1.00,
                       phraseLen: 4,  phraseRepeat: 5,  stepBonus: 1.5, jumpPenalty: 0.35, interlock: 0.40 },
                       // macchina: frasi medie, ripetitive, interlock frequente — le voci si inseguono

      'C#_dorian':   { ch5ProbMul: 1.20, ch6ProbMul: 1.30, ch5VelMul: 1.10, ch6VelMul: 1.20,
                       phraseLen: 6,  phraseRepeat: 2,  stepBonus: 0.8, jumpPenalty: 0.50, interlock: 0.65 },
                       // tempesta: frasi lunghe che cambiano spesso, salti frequenti, massimo interlock

      'E_phrygian':  { ch5ProbMul: 0.50, ch6ProbMul: 0.20, ch5VelMul: 0.80, ch6VelMul: 0.70,
                       phraseLen: 3,  phraseRepeat: 8,  stepBonus: 2.2, jumpPenalty: 0.15, interlock: 0.0 },
                       // dissoluzione: frasi minime che si ripetono all'infinito, solo step, lento spegnersi
    },

    // ── Velocity sweep sinusoidale CH6 in C#_dorian (M2) ──
    sweep: {
      periodBars: 16,   // periodo onda in bar — ciclo ~43s a 88 BPM
      amplitude:  0.35, // ampiezza [0-1] → range vel [0.65, 1.0]
    },

    // ── MIDI optimization (pattern da RHYTHM) ──
    midi: {
      downbeatBoost:  0.06,    // +6% velocity su downbeat (MIDI-01, piu delicato della ritmica)
      offbeatReduce:  0.04,    // -4% velocity su offbeat
      noteOffsetMs:   { min: 3, max: 18 },   // sfasamento anti-meccanico (MIDI-03)
    },

    // ── Call-response CH5→CH6 (v4) ──
    callResponse: {
      enabled: true,
      probability: 0.35,             // prob CH6 risponda a una nota CH5
      delayMsMin: 200,               // ritardo minimo risposta
      delayMsMax: 500,               // ritardo massimo risposta
      intervalPrefer: [3, 4, 5, 7],  // intervalli in semitoni preferiti (3ª, 4ª, 5ª)
      activeRange: { min: 0.35, max: 0.80 }, // arcPercent range (~min15-34)
      minMelodicActivity: 0.25,      // mA minimo per attivare
    },

    // ── Degradation engine per RITORNO (v4) ──
    degradation: {
      arcThreshold: 0.85,            // pct sopra cui la degradazione inizia
      maxTimingJitter: 60,           // jitter massimo timing in ms a degradazione piena
      maxNoteDropProb: 0.45,         // prob massima di saltare una nota
      jitterCurve: 2.0,              // curva esponenziale per aumento jitter
    },
  },

  // ── Visual System v3 (Phase 4) ─────────────────────────────────────────────
  VISUAL: {
    // ── Dominance logic (D-01, D-03) ──
    dominanceThreshold: 0.05,   // valore minimo per dichiarare un layer dominante
    dominanceHysteresis: 0.10,  // margine che il nuovo layer deve superare per detronizzare il corrente
    lerpSpeed: 0.02,            // lerp rate per parametri render tra layer (per frame a 60fps)
    paletteLerpSpeed: 0.015,    // lerp rate cambio palette (piu lento per evitare tremolio)

    // ── Palette Bible v2 — 5 ruoli cromatici per traccia ──
    // Ref: docs Visual System Bible §12.
    // Ruoli:
    //   bg       → colore ambiente (clima materiale)
    //   dot      → materia strutturale principale
    //   event    → eventi MIDI leggibili (foreground)
    //   rupture  → colore protetto, usato solo in momenti di rottura
    //   residual → tinta fossile / ghost / invecchiamento (memoria)
    // Regola: bg sempre presente, dot strutturale, event su ruoli precisi,
    // rupture raro, residual come stato di invecchiamento — mai come design.
    trackPalettes: {
      NEBBIA: {
        bg:       '#161417', // plum-charcoal
        dot:      '#E9E1D3', // warm paper
        event:    '#A7B6FF', // cold mist (voice/lead)
        rupture:  '#F3F0EA', // ice crack
        residual: '#6D6675', // ash violet
      },
      TESSUTO: {
        bg:       '#24131F', // aubergine ink
        dot:      '#C6FF4D', // acid-lime
        event:    '#FFF1D6', // soft cream
        rupture:  '#FF7A8A', // hot coral
        residual: '#6F8A3C', // oxidized green
      },
      SOLCO: {
        bg:       '#1A211C', // smoked olive
        dot:      '#FF7A1A', // saturated orange
        event:    '#D5FF57', // electric chartreuse
        rupture:  '#FFF4E8', // cut light
        residual: '#6A5E38', // dirty brass
      },
      RESPIRO: {
        bg:       '#A8C3A0', // dusty sage (fondo chiaro — unica traccia bg chiaro)
        dot:      '#1A1715', // ink-black
        event:    '#F5E6D3', // paper flash
        rupture:  '#6E7E8B', // cold freeze
        residual: '#D7D0C6', // breath dust
      },
      MACCHINA: {
        bg:       '#151B2E', // deep relay blue
        dot:      '#FFE600', // terminal yellow
        event:    '#FF4D7A', // hot signal pink
        rupture:  '#FFFFFF', // alarm white
        residual: '#57607E', // screen residue
      },
      TEMPESTA: {
        bg:       '#2A0012', // black cherry
        dot:      '#FFF6F0', // harsh paper-white
        event:    '#FF2E63', // alarm red
        rupture:  '#F8FF2B', // toxic peak
        residual: '#6A2233', // burnt crimson
      },
      RITORNO: {
        bg:       '#DDD6F7', // faded lavender paper
        dot:      '#17141C', // dusk ink
        event:    '#F7E8D8', // memory cream
        rupture:  '#94A6FF', // recall flare
        residual: '#A99CB9', // faded ghost
      },
    },

    // ── 5 atti narrativi visivi (D-06) ──
    // Ogni atto: range arcPercent, scena target, palette base, densityCap, camera
    // v5: palette colorate per identità, non solo nero
    acts: {
      I:    { min: 0.00,  max: 0.07,  scene: 'SPARSE',         palette: 'nebbia',   densityCap: 0.15, camera: 'WIDE'   },  // cream/nero
      II:   { min: 0.07,  max: 0.186, scene: 'BAYER_CLASSIC',  palette: 'tessuto',  densityCap: 0.35, camera: 'DRIFT'  },  // lime/licorice
      III:  { min: 0.186, max: 0.372, scene: 'COLORED_GROUND', palette: 'solco',    densityCap: 0.80, camera: 'MEDIUM' },  // arancio/signal black
      IV:   { min: 0.372, max: 0.419, scene: 'SPARSE',         palette: 'respiro',  densityCap: 0.12, camera: 'WIDE'   },  // scuro/sage — inversione
      V:    { min: 0.419, max: 0.581, scene: 'COLORED_GROUND', palette: 'macchina', densityCap: 1.00, camera: 'MEDIUM' },  // giallo/navy
      VI:   { min: 0.581, max: 0.814, scene: 'DENSE',          palette: 'tempesta', densityCap: 1.00, camera: 'MEDIUM' },  // bianco+rosso/nero
      VII:  { min: 0.814, max: 1.00,  scene: 'SPARSE',         palette: 'ritorno',  densityCap: 0.12, camera: 'WIDE'   },  // lavanda/nero
    },

    // ── Layer preferences — firma visiva per layer (D-07, D-08, D-09) ──
    // Analogo a ENGINE_PREFS v2 ma per i 3 layer v3 + master
    layers: {
      harmony: {
        palette: 'cold',
        dotSize: 10,  densityMul: 0.6,  midiScale: 2.0,
        trailMax: 48, flickerSpeed: 0.5,
        shapeScale: 0.4, densityGravity: -0.2,
        onsetWaveSpeed: 300, midiDensityMul: 0.5, feedbackDecay: 0.96,
        // v4: shimmer feedback, no transform, no grid distortion
        feedbackZoom: 1.0, feedbackRotate: 0, feedbackDriftX: 0, feedbackDriftY: 0,
        gridDistortAmp: 0,
      },
      rhythm: {
        palette: 'amber',
        dotSize: 4,   densityMul: 1.4,  midiScale: 1.0,
        trailMax: 32, flickerSpeed: 5.0,
        shapeScale: 1.2, densityGravity: 0.15,
        onsetWaveSpeed: 1000, midiDensityMul: 0.4, feedbackDecay: 0.93,
        // v4: no feedback transform, moderate grid distortion from kick energy
        feedbackZoom: 1.0, feedbackRotate: 0, feedbackDriftX: 0, feedbackDriftY: 0,
        gridDistortAmp: 1.5,
      },
      melody: {
        palette: 'magenta',
        dotSize: 7,   densityMul: 0.9,  midiScale: 2.2,   // was 1.5 — shape più grandi
        trailMax: 64, flickerSpeed: 2.0,                   // was 40 — più note attive = disegno più ricco
        shapeScale: 1.0, densityGravity: 0,
        onsetWaveSpeed: 600, midiDensityMul: 1.0, feedbackDecay: 0.95, // was 0.6
        // v4: subtle lateral drift on feedback, gentle grid wave
        feedbackZoom: 1.0, feedbackRotate: 0, feedbackDriftX: 0.05, feedbackDriftY: 0,
        gridDistortAmp: 1.0,
      },
      // Master — quando nessun layer domina (macroState tutto basso)
      master: {
        palette: 'bw',
        dotSize: 6,   densityMul: 0.3,  midiScale: 1.0,
        trailMax: 64, flickerSpeed: 1.0,
        shapeScale: 1.0, densityGravity: 0,
        onsetWaveSpeed: 400, midiDensityMul: 0.3, feedbackDecay: 0.97,
        // v4: no feedback transform, no grid distortion — clean default
        feedbackZoom: 1.0, feedbackRotate: 0, feedbackDriftX: 0, feedbackDriftY: 0,
        gridDistortAmp: 0,
      },
    },

    // ── Layout geometrico per modo modale (V3) ──
    // Ogni sezione ha una composizione spaziale diversa — cross-fade automatico.
    modeComposition: {
      'A_lydian':    'HORIZON',    // banda orizzontale centrale — respiro aperto
      'Bb_phrygian': 'COLUMNS',    // colonne verticali pesanti — pressione rituale
      'D_dorian':    'MONDRIAN_B', // blocchi asimmetrici — groove organico
      'C#_dorian':   'MONDRIAN_A', // grid bilanciato — geometria techno
      'E_phrygian':  'ISLANDS',    // isole sparse nel vuoto — dissoluzione
    },

    // ── Parametri visivi per modo modale (V3) ──
    // Blendati con layer prefs (60% modo / 40% layer) — definiscono l'atmosfera di ogni sezione.
    // Solo i parametri elencati vengono blendati; gli altri usano il layer pref puro.
    modeParams: {
      // v5: Regimi visivi — vincoli, non preset. Ogni modo è un mondo con regole diverse.
      // Ref: Bridget Riley (vincolo = identità), Henke CBM 8032 (il limite è il linguaggio)
      'A_lydian': {
        // NEBBIA/RITORNO — pochi dot grandi, quasi pittorici. Solo cream su quasi-nero.
        dotSize: 14,  densityMul: 0.35,  midiDensityMul: 0.7,
        flickerSpeed: 0.15,  trailMax: 96,  midiScale: 3.5,
        feedbackDriftX: 0.1, gridDistortAmp: 2.5,
        // REGIME: max density 0.15, dot min 10px — mondo rarefatto
        maxDensity: 0.15, minDotSize: 10,
      },
      'Bb_phrygian': {
        // SOLCO — denso e pesante, colonne verticali, arancio su nero.
        dotSize: 4,   densityMul: 1.7,   midiDensityMul: 0.7,
        flickerSpeed: 1.8,  trailMax: 28,  midiScale: 1.1,
        feedbackDriftY: 0.3, gridDistortAmp: 1.5,
        // REGIME: alta densità, dot piccoli — pressione rituale
        maxDensity: 0.80, minDotSize: 3,
      },
      'D_dorian': {
        // MACCHINA — blocchi asimmetrici, giallo su navy. Groove organico.
        dotSize: 6,   densityMul: 1.1,   midiDensityMul: 1.1,
        flickerSpeed: 3.5,  trailMax: 52,  midiScale: 2.0,
        gridDistortAmp: 1.0,
        // REGIME: densità media, dot medi — bilanciato
        maxDensity: 0.65, minDotSize: 4,
      },
      'C#_dorian': {
        // TEMPESTA — geometrico, preciso, bianco+rosso su nero. Ikeda data.
        dotSize: 3,   densityMul: 2.0,   midiDensityMul: 0.9,
        flickerSpeed: 7.0,  trailMax: 28,  midiScale: 1.4,
        gridDistortAmp: 3.0,
        // REGIME: massima densità, dot microscopici — data pura
        maxDensity: 1.00, minDotSize: 1,
      },
      'E_phrygian': {
        // RITORNO — rarefatto, trails lunghissimi, lavanda. Ogni nota è preziosa.
        dotSize: 11,  densityMul: 0.38,  midiDensityMul: 1.8,
        flickerSpeed: 0.4,  trailMax: 96,  midiScale: 3.8,
        gridDistortAmp: 1.5,
        // REGIME: rarefatto, dot grandi — il vuoto è il 70% del frame
        maxDensity: 0.20, minDotSize: 8,
      },
    },

    // ── Shared sediment — memoria inter-traccia ──
    // decayRate:      per frame @60fps → half-life ~38s, visibile ~2min (era 0.97 = ~4s)
    // accumAlpha:     deposito continuo per-frame — palimpsesto atmosferico (regime ~33%)
    // compositeAlpha: blend sediment→canvas (ridotto da 0.35 per persistenza lunga)
    sediment: {
      decayRate:      0.9997,
      accumAlpha:     0.0001,
      compositeAlpha: 0.30,
    },

    // ── Crossfade visivo al cambio traccia ──
    // Durata in secondi — ease-in-out cubico. 0 = hard cut.
    trackFadeDuration: 3.0,

    // ── Micro-glitch globale (field.js) ──
    // rhythmThreshold: rhythmicity minima per attivare (0 = sempre, 1 = solo piena pulsazione)
    // intensityMul:    scala audioEnergy × rhythmicity → prob glitch (era floor +0.3 fisso)
    glitch: {
      rhythmThreshold: 0.4,
      intensityMul:    0.5,
    },

    // ── Ghost/fossil overlay (field.js) ──
    // Renderizza eventi STATE_GHOST e STATE_FOSSIL da event-register come dot desaturati.
    // Sblocca firma.gelo (elementi cristallizzati visibili) e firma.convergenza (posizioni reali).
    // ghostBlend / fossilBlend: 0 = colore dot pieno, 1 = invisibile (fonde con bg).
    ghostOverlay: {
      dotSize:       2,     // px — punto minimo, discreto
      ghostDensity:  0.35,  // Bayer threshold per STATE_GHOST
      fossilDensity: 0.18,  // Bayer threshold per STATE_FOSSIL
      ghostBlend:    0.52,  // lerp dot→bg per ghost (muted ma visibile)
      fossilBlend:   0.78,  // lerp dot→bg per fossil (quasi scomparso)
    },
  },
};
