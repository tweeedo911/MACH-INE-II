// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Director
//  Reads audio + clock → writes World State.
//  Does NOT generate notes. Only constraints and context.
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { firma } from './firma.js';
import { worldState, phaseState } from './world-state.js';
import { TRACKS, PHASE_DENSITY, PHASE_ENERGY, TRACK_ORDER, ENCORE_SCALES } from './tracks.js';
import { audio } from './audio.js';
import { state } from './state.js';
import { sendMIDIAllNotesOff, sendMIDINote, sendNornsBiome, sendNornsDroneStart, sendNornsDroneStop } from './midi.js';
import { addMidiNote } from './field.js';
import { initRhythm } from './rhythm.js';
import { initHarmony } from './harmony.js';
import { initBass as initBassV1 } from './bass.js';
import { initBass as initBassV2 } from './bass-v2.js';
import { initBass as initBassV3 } from './bass-v3.js';
import { initMelody as initMelodyV1 } from './melody.js';
import { initMelody as initMelodyV2 } from './melody-v2.js';
import { initMelody as initMelodyV3 } from './melody-v3.js';
import { initTexture } from './texture.js';

// V2/V3 toggle: STRUCTURAL takes priority over EXPERIMENT for bass/melody init
const initBass = () => {
  if (CFG.MUSIC_STRUCTURAL) return initBassV3();
  if (CFG.MUSIC_EXPERIMENT) return initBassV2();
  return initBassV1();
};
const initMelody = () => {
  if (CFG.MUSIC_STRUCTURAL) return initMelodyV3();
  if (CFG.MUSIC_EXPERIMENT) return initMelodyV2();
  return initMelodyV1();
};

// ── V3.5: BPM ramp state ──
// Interpolates BPM over N bars when track changes. Per-transition durations
// because SOLCO→RESPIRO (129→null) needs 8 bar, not the same 2 of TESSUTO→SOLCO.
const BPM_RAMP_BARS_DEFAULT = 2;
const BPM_RAMP_BARS_TABLE = {
  // from → to → bars. Keyed by source track (the one ending).
  'NEBBIA':   4,   // null→86: da silenzio a primo tempo, graduale
  'TESSUTO':  4,   // 86→129: accelera graduale, non salta
  'SOLCO':    8,   // 129→null: il groove rallenta, non crolla
  'RESPIRO':  6,   // null→129: il tempo riemerge, non salta
  // MACCHINA→TEMPESTA: stesso BPM, nessun ramp
  'TEMPESTA': 8,   // 129→86: discesa lunga dal picco, la voice accompagna
};
let _bpmRamp = null;  // { from, to, elapsed, duration } or null when inactive

// ── V3.9: Ghost entrance estesa — ruolo primario + secondario per traccia ──
// primary: entra da bar -6, density crescente. secondary: ultime 2 bar.
// CH3 bass, CH5 voice, CH6 lead, CH7 arp = modulare (no velocity → suonano a palla)
// Ghost SOLO su canali con velocity: CH0 kick, CH1 perc, CH2 drone, CH4 chords
const GHOST_ENTRANCE = {
  TESSUTO:  { primary: { ch: 4, role: 'chord' },
              secondary: { ch: 2, role: 'harmony' } },           // chord staccato + drone sottile
  SOLCO:    { primary: { ch: 0, role: 'rhythm', vel: 20, fixedNote: 38 },
              secondary: null },                                   // solo kick lontano, bass è modulare
  RESPIRO:  { primary: { ch: 4, role: 'chord' },
              secondary: { ch: 2, role: 'harmony' } },           // chord arioso + drone
  MACCHINA: { primary: { ch: 0, role: 'rhythm', vel: 25, fixedNote: 38 },
              secondary: null },                                   // solo kick, arp è modulare
  TEMPESTA: { primary: { ch: 2, role: 'harmony' },                // drone E entra per primo (bar -20)
              secondary: { ch: 4, role: 'chord' },                // chord con bII frigio (bar -12)
              djCrossfade: true },                                 // crossfade DJ esteso (vedi sotto)
  RITORNO:  { primary: { ch: 4, role: 'chord' },
              secondary: { ch: 2, role: 'harmony' } },           // chord + drone (voice è modulare)
};
let _lastGhostBar = -1;  // prevent multiple ghosts in same bar

// ── Phase order ──
const PHASE_ORDER = ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'];

let _track = null;     // current track definition
let _phaseIdx = 0;     // index into PHASE_ORDER
let _phaseTime = 0;    // seconds elapsed in current phase
let _phaseBars = 0;    // bars elapsed in current phase
let _barAcc = 0;       // accumulator for bar counting (seconds within current bar)
let _totalTime = 0;    // total seconds since start
let _totalBars = 0;    // total bars for all phases
let _paused = true;     // starts paused — performer presses Space to begin

// ── ENCORE state machine ──
let _encoreActive = false;
let _encoreBrick  = 0;
let _encoreBrickBar = 0;

// ── ENCORE v2: Canon Machine ──
const ENCORE_BRICK_NAMES = [
  'heartbeat',    // 0: kick + polvere percussiva, BPM 60→132
  '+arp',         // 1: arp 3× invertita (acuto)
  '+bass',        // 2: bass 1× originale (grave)
  '+hat/snare',   // 3: hat 5/8 + snare sincopato
  '+voice',       // 4: voice ½× retrograda
  '+lead',        // 5: lead 2× originale
  '+chord/drone', // 6: chord 1× sfasata + drone
  '+conga',       // 7: ultimo pezzo tetris ritmico
  'plateau',      // 8: tutto, frase nuova ogni 4 bar
];

let _canonPhrase = [];
let _canonPhraseRetro = [];
let _canonPhraseInv = [];
let _canonTickAcc = 0;
let _canonBaseInterval = 0;
let _canonPhraseAge = 0;

// V3: base densities computed by _applyPhase, then modulated each frame
// by tension waves (RESEARCH-V4 §B.1) when MUSIC_STRUCTURAL is on.
const _phaseDensityBase = { rhythm: 0, harmony: 0, bass: 0, melody: 0, texture: 0 };

// V3: Walls of Sound triggered state (RESEARCH-V4 §A.7 Hecker)
let _wallsTriggered = {
  tempesta: false,         // picco di TEMPESTA densita
  ritorno: false,          // RITORNO false resolution rebound
};

// V2 ext: Frahm velocity range per phase — multiplier on top of track velocityCeiling.
// Substitutes flat-per-track ceiling with phase-modulated dynamics:
// pp-mp on germoglio/dissoluzione, mf-f on densita, f-ff on rottura.
const PHASE_VEL_SCALE = {
  germoglio:    0.60,
  pulsazione:   0.75,
  densita:      0.95,
  rottura:      1.15,
  dissoluzione: 0.60,
};

// ── Init: load a track into worldState ──
export function initDirector3(trackName = 'SOLCO', { seamless = false } = {}) {
  _track = TRACKS[trackName];
  if (!_track) throw new Error(`[DIR3] Track "${trackName}" not found`);

  _phaseIdx = 0;
  _phaseTime = 0;
  _phaseBars = 0;
  _barAcc = 0;
  _totalTime = 0;
  _lastGhostBar = -1;
  _totalBars = PHASE_ORDER.reduce((sum, p) => sum + (_track.phases[p] || 0), 0);

  // Reset walls of sound triggers when starting a new concert (NEBBIA)
  if (trackName === 'NEBBIA') {
    _wallsTriggered.tempesta = false;
    _wallsTriggered.ritorno = false;
  }

  // Load track identity into worldState
  worldState.track = trackName;
  if (!_paused) sendNornsBiome(TRACK_ORDER.indexOf(trackName));  // → Norns: solo se in play
  worldState.scale = _track.scale;
  worldState.root = _track.root;
  worldState.bpm = _track.bpm;
  worldState.rhythmGrid = _track.rhythmGrid;
  // Source palette from Bible §12 trackPalettes; fallback to _track.palette
  const tp = CFG.VISUAL?.trackPalettes?.[trackName];
  worldState.palette.bg          = tp?.bg       ?? _track.palette.bg;
  worldState.palette.dot         = tp?.dot      ?? _track.palette.dot;
  worldState.palette.accent      = tp?.event    ?? _track.palette.accent ?? null;
  worldState.palette.ruptureTint = tp?.rupture   ?? null;
  worldState.palette.ruptureBg   = tp?.ruptureBg ?? null;
  worldState.palette.residual    = tp?.residual  ?? null;
  worldState.visualRegime = { ...(_track.visualRegime) };

  // Reset rupture and transition — phase starts at germoglio, not rottura
  worldState.rupture.stage     = null;
  worldState.rupture.stageT    = 0;
  worldState.rupture.t         = 0;
  worldState.rupture.intensity = 0;
  worldState.transition        = null;

  // Camera: aggiorna personality/phase, ma NON resettare zoom/focus.
  // camera.js gestisce la transizione con un SOLLEVARE naturale.
  worldState.camera.personality = worldState.track;
  worldState.camera.phase = PHASE_ORDER[0];
  worldState.camera._trackChanged = true;  // segnale per camera.js

  _applyPhase();

  // Reset all modules so they start clean on the new track
  initRhythm(seamless);
  initHarmony();
  initBass();
  initMelody();
  initTexture();

  console.log(`[DIR3] Loaded track: ${trackName}, duration: ${_totalBars} bars`);
}

// ── Pause/play control ──
export function toggleDirector3() {
  _paused = !_paused;
  if (!_paused) {
    _applyPhase();  // restore density values on unpause
    sendNornsBiome(TRACK_ORDER.indexOf(worldState.track));  // drone: bioma attivo
    sendNornsDroneStart();
  } else {
    sendNornsDroneStop();
  }
  console.log(`[DIR3] ${_paused ? 'PAUSED' : 'PLAYING'}`);
  return !_paused;
}

export function isDirector3Playing() {
  return !_paused;
}

// ── Update: called every MIDI clock tick (~2ms) ──
export function updateDirector3(dt) {
  if (_paused) {
    // Silence all modules while paused
    for (const mod of ['rhythm', 'harmony', 'bass', 'melody', 'texture']) {
      worldState.density[mod] = 0;
    }
    return;
  }

  // ── ENCORE state machine ──
  if (_encoreActive) {
    _updateEncore(dt);
    return;
  }

  _phaseTime += dt;
  _totalTime += dt;

  // ── V3.5: BPM ramp — smooth tempo transition between tracks ──
  if (_bpmRamp) {
    _bpmRamp.elapsed += dt;
    const t = Math.min(1, _bpmRamp.elapsed / _bpmRamp.duration);
    // ease-in-out quadratic for natural feel
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    worldState.bpm = _bpmRamp.from + (_bpmRamp.to - _bpmRamp.from) * eased;
    if (t >= 1) {
      worldState.bpm = _bpmRamp.to;
      _bpmRamp = null;
    }
  }

  const bpm = worldState.bpm || 60;
  const barDuration = 240 / bpm; // seconds per bar (4 beats)

  // Count bars using BPM (4 beats per bar)
  _barAcc += dt;
  while (_barAcc >= barDuration) {
    _barAcc -= barDuration;
    _phaseBars++;

    // ── Micro-rupture check (per bar, non per frame) ──
    _triggerMicroRupture(PHASE_ORDER[_phaseIdx]);

    // ── V3: Wall of Sound triggers on downbeat ──
    if (CFG.MUSIC_STRUCTURAL) {
      // Wall #1: TEMPESTA, picco di densita (mid-densita)
      if (!_wallsTriggered.tempesta &&
          worldState.track === 'TEMPESTA' &&
          PHASE_ORDER[_phaseIdx] === 'densita') {
        const phaseDur = _track.phases.densita || 0;
        if (_phaseBars >= Math.floor(phaseDur * 0.5)) {
          _triggerWallOfSound('TEMPESTA picco');
          _wallsTriggered.tempesta = true;
        }
      }
      // Wall #2: RITORNO, false resolution rebound (early in pulsazione)
      if (!_wallsTriggered.ritorno &&
          worldState.track === 'RITORNO' &&
          PHASE_ORDER[_phaseIdx] === 'pulsazione' &&
          _phaseBars >= 4) {
        _triggerWallOfSound('RITORNO false resolution');
        _wallsTriggered.ritorno = true;
      }
    }
  }

  // Update arc (concert position) — based on total bars
  const totalElapsedBars = PHASE_ORDER.slice(0, _phaseIdx).reduce((sum, p) => sum + (_track.phases[p] || 0), 0) + _phaseBars;
  worldState.arc = _totalBars > 0 ? Math.min(1, totalElapsedBars / _totalBars) : 0;

  // ── V3: Tension waves modulation ──
  // Apply 5-wave tension curve over the base phase densities.
  // Picco a 0.65-0.85 of arc (not 0.5) — replaces flat fade-in feel.
  if (CFG.MUSIC_STRUCTURAL) {
    const tw = _computeTensionMultipliers(worldState.arc);
    worldState.density.rhythm  = _phaseDensityBase.rhythm  * tw.rhythm;
    worldState.density.melody  = _phaseDensityBase.melody  * tw.melody;
    worldState.density.bass    = _phaseDensityBase.bass    * tw.bass;
    worldState.density.harmony = _phaseDensityBase.harmony * tw.harmony;
    worldState.density.texture = _phaseDensityBase.texture * tw.texture;
  }

  // ── V3.5: Germoglio ramp — fade in density over first 4 bars ──
  // Prevents hard cut at track entry: modules ease in from 25% to 100%.
  // Attivo sempre in germoglio (NEBBIA inclusa — density basse, effetto trascurabile).
  const GERMOGLIO_RAMP_BARS = 4;
  if (PHASE_ORDER[_phaseIdx] === 'germoglio' && _phaseBars < GERMOGLIO_RAMP_BARS) {
    const rampT = _phaseBars / GERMOGLIO_RAMP_BARS;  // 0 at bar 0, 1 at bar 4
    const rampScale = 0.25 + 0.75 * rampT;           // 0.25 → 1.0
    for (const mod of ['rhythm', 'harmony', 'bass', 'melody', 'texture']) {
      worldState.density[mod] *= rampScale;
    }
  }

  // ── TEMPESTA germoglio: il kick continua dal crossfade DJ — non deve sparire ──
  // PHASE_DENSITY.germoglio.rhythm = 0 normalmente, ma TEMPESTA arriva da MACCHINA
  // con il kick già in piedi. Il germoglio di TEMPESTA è la coda del crossfade.
  if (worldState.track === 'TEMPESTA' && PHASE_ORDER[_phaseIdx] === 'germoglio') {
    worldState.density.rhythm = Math.max(worldState.density.rhythm, 0.7);
    // Bass anche solido fin da subito — il crossfade l'ha già introdotto
    worldState.density.bass = Math.max(worldState.density.bass, 0.5);
  }

  // ── SOLCO germoglio: il bass è l'intro — gira solido prima che entri la drum ──
  // Il pattern loop è fisso (bassPatternLocked), qui alzo la density perché
  // PHASE_DENSITY.germoglio.bass (0.3) × track (0.8) = 0.24 → troppo fiacca.
  if (worldState.track === 'SOLCO' && PHASE_ORDER[_phaseIdx] === 'germoglio') {
    worldState.density.bass = Math.max(worldState.density.bass, 0.55);
  }

  // ── Track-specific exit logic in dissoluzione ──
  // Ogni traccia prepara musicalmente l'ingresso della successiva.
  if (PHASE_ORDER[_phaseIdx] === 'dissoluzione') {
    const dissolveDur = _track.phases.dissoluzione || 24;
    const barsLeft = dissolveDur - _phaseBars;

    if (worldState.track === 'NEBBIA') {
      // NEBBIA → TESSUTO: drone e voice svaniscono, spazio per il ghost chord di TESSUTO
      // dissoluzione 16 bar: fade progressivo su harmony (drone) e melody (voice)
      if (barsLeft <= 10) {
        worldState.density.harmony *= Math.max(0, (barsLeft - 2) / 8);  // 0 a bar -2
        worldState.density.melody  *= Math.max(0, (barsLeft - 2) / 8);  // 0 a bar -2
      }
    }

    if (worldState.track === 'TESSUTO') {
      // TESSUTO → SOLCO: il basso svanisce PRIMA dei ghost (bar -6), gli accordi si diradano
      // Mute a bar -7 (ghost SOLCO entra a bar -6 su CH3 — serve silenzio)
      if (barsLeft <= 12) {
        worldState.density.bass *= Math.max(0, (barsLeft - 7) / 5);  // 0 a bar -7
        const chordFade = 0.3 + 0.7 * (barsLeft / 12);
        worldState.density.harmony *= chordFade;
      }
      if (barsLeft <= 4) {
        worldState.density.rhythm = Math.max(worldState.density.rhythm, 0.35);
      }
    }

    if (worldState.track === 'SOLCO') {
      // SOLCO → RESPIRO: dropout dub progressivo
      // Harmony (drone+chord) mute a bar -7 per fare spazio al ghost chord RESPIRO (CH4)
      if (barsLeft <= 16) worldState.density.rhythm  *= Math.max(0, barsLeft / 16);
      if (barsLeft <= 12) worldState.density.texture  *= Math.max(0, barsLeft / 12);
      if (barsLeft <= 12) worldState.density.harmony  *= Math.max(0, (barsLeft - 7) / 5);  // 0 a bar -7
      if (barsLeft <= 10) worldState.density.bass     *= Math.max(0, (barsLeft - 3) / 7);  // 0 a bar -3
    }

    if (worldState.track === 'RESPIRO') {
      // RESPIRO → MACCHINA: harmony e melody sfumano, bass resta più a lungo
      // per evitare buco prima del ghost kick MACCHINA (bar -6)
      if (barsLeft <= 10) {
        worldState.density.harmony *= Math.max(0.15, barsLeft / 10);
        worldState.density.bass    *= Math.max(0, (barsLeft - 2) / 8);  // 0 a bar -2 (era -4)
      }
      if (barsLeft <= 6) {
        worldState.density.melody *= Math.max(0.1, barsLeft / 6);
      }
    }

    if (worldState.track === 'MACCHINA') {
      // ── MACCHINA → TEMPESTA: crossfade DJ su 32 bar ──
      // L'arp (protagonista MACCHINA) si ritira per primo, poi harmony (per spazio al drone E ghost),
      // poi bass, poi melody. Il kick resta fino alla fine.
      // Bar -32 a 0: arp sfuma lentamente (da protagonista a silenzio)
      if (barsLeft <= 32) {
        const arpFade = Math.max(0, barsLeft / 32);
        worldState.density.texture *= arpFade;
      }
      // Bar -24 a -8: harmony sfuma (allineato col drone ghost E che entra a bar -22)
      if (barsLeft <= 24) {
        worldState.density.harmony *= Math.max(0, (barsLeft - 8) / 16);  // 0 a bar -8
      }
      // Bar -20 a -8: bass perde densità
      if (barsLeft <= 20) {
        worldState.density.bass *= Math.max(0.1, (barsLeft - 8) / 12);
      }
      // Bar -16 a -4: melody esce
      if (barsLeft <= 16) {
        worldState.density.melody *= Math.max(0, (barsLeft - 4) / 12);
      }
      // Il kick non sfuma — continua fino allo switch (stesso BPM, DJ continuity)
    }

    if (worldState.track === 'TEMPESTA') {
      // TEMPESTA → RITORNO: esaurimento verso la nudità
      // Harmony mute a bar -3 per ghost chord RITORNO (CH4)
      if (barsLeft <= 12) {
        worldState.density.rhythm *= Math.max(0.15, barsLeft / 12);
      }
      if (barsLeft <= 10) {
        worldState.density.bass *= Math.max(0, (barsLeft - 3) / 7);  // 0 a bar -3
        worldState.density.harmony *= Math.max(0, (barsLeft - 3) / 7);  // 0 a bar -3
      }
    }
  }

  // ── V3: Degradation arc in dissoluzione (Hecker §A.7) ──
  // Final 16 bars of dissoluzione: progressive note-drop, jitter, chord stripping.
  // SKIP per MACCHINA: il crossfade DJ richiede griglia pulita, no jitter sul kick.
  // Outside the window, degradation is reset to inert defaults.
  if (CFG.MUSIC_STRUCTURAL && PHASE_ORDER[_phaseIdx] === 'dissoluzione' && worldState.track !== 'MACCHINA') {
    const degradDur = _track.phases.dissoluzione || 0;
    const degradBarsLeft = degradDur - _phaseBars;
    if (degradBarsLeft <= 16 && degradBarsLeft >= 0) {
      // 0 at bar -16, 1 at bar 0 (last bar of dissoluzione)
      const t = 1 - (degradBarsLeft / 16);
      worldState.degradation.noteDropProb   = t * 0.4;
      worldState.degradation.timingJitterMs = 5 + t * 20;
      // 4 → 3 → 2 → 1 in 4 quartiles
      if (t < 0.25)      worldState.degradation.chordNoteCount = 4;
      else if (t < 0.5)  worldState.degradation.chordNoteCount = 3;
      else if (t < 0.75) worldState.degradation.chordNoteCount = 2;
      else               worldState.degradation.chordNoteCount = 1;
    } else {
      worldState.degradation.noteDropProb   = 0;
      worldState.degradation.timingJitterMs = 0;
      worldState.degradation.chordNoteCount = 99;
    }

    // ── Convergenza automatica nell'ultimo 15% della dissoluzione ──
    const dissolveDur = _track.phases.dissoluzione || 0;
    if (dissolveDur > 0) {
      const progress = _phaseBars / dissolveDur;
      firma.convergenza = progress > 0.85;

      // ── V3.9: Transition preview — ultime N bar della dissoluzione ──
      // MACCHINA→TEMPESTA: 24 bar (crossfade DJ lungo). Tutti gli altri: 8 bar.
      const isDJCrossfade = worldState.track === 'MACCHINA';
      const TRANSITION_BARS = isDJCrossfade ? 24 : 8;
      const barsLeft = dissolveDur - _phaseBars;
      if (barsLeft <= TRANSITION_BARS && barsLeft >= 0) {
        const currentIdx = TRACK_ORDER.indexOf(worldState.track);
        const nextIdx = currentIdx + 1;
        if (nextIdx < TRACK_ORDER.length && TRACKS[TRACK_ORDER[nextIdx]]) {
          const tProg = 1 - (barsLeft / TRANSITION_BARS);  // 0→1 su 8 bar
          worldState.transition = {
            from: worldState.track,
            to: TRACK_ORDER[nextIdx],
            progress: tProg,
            nextTrack: TRACKS[TRACK_ORDER[nextIdx]],
          };
        }
      } else {
        worldState.transition = null;
      }

      // ── V3.9: Ghost entrance estesa — da bar -6, densità crescente ──
      // primary: bar -6 → -1, 1 nota/bar poi 2/bar nelle ultime 2
      // secondary: bar -2 → -1, 1 nota/bar
      // velocity crescente: pp(15) → p(40)
      // DJ crossfade: ghost da subito (progress > 0.05). Standard: da progress > 0.25
      const ghostThreshold = isDJCrossfade ? 0.05 : 0.25;
      if (worldState.transition && worldState.transition.progress > ghostThreshold) {
        const nextName = worldState.transition.to;
        const ghostDef = GHOST_ENTRANCE[nextName];
        if (ghostDef && _phaseBars !== _lastGhostBar) {
          _lastGhostBar = _phaseBars;
          const nextTrack = worldState.transition.nextTrack;
          const reg = nextTrack.register;
          const scale = nextTrack.scale || [];  // scala della traccia ENTRANTE, non quella corrente
          const tProg = worldState.transition.progress;  // 0.25→1.0

          // Velocity crescente con la transizione (pp → p)
          const velBase = Math.round(15 + tProg * 25);  // 15→40
          const bpmNow = worldState.bpm || 60;
          const barMs = Math.round((60 / bpmNow) * 4 * 1000);

          // Primary ghost
          const pg = ghostDef.primary;
          const pRole = pg.role === 'chord' ? 'chords' : pg.role;
          const [pLo, pHi] = reg[pRole] || [48, 72];
          const pCandidates = scale.filter(n => n >= pLo && n <= pHi);
          if (pCandidates.length > 0 || pg.fixedNote) {
            const note = pg.fixedNote || pCandidates[Math.floor(Math.random() * pCandidates.length)];
            const vel = pg.vel || velBase;
            sendMIDINote(pg.ch, note, vel, barMs);
            // Ultime 2 bar: raddoppia (seconda nota a metà bar)
            if (barsLeft <= 2 && pCandidates.length > 1) {
              const note2 = pCandidates[Math.floor(Math.random() * pCandidates.length)];
              setTimeout(() => sendMIDINote(pg.ch, note2, Math.max(1, vel - 5), Math.round(barMs / 2)), Math.round(barMs / 2));
            }
            console.log(`[DIR3] ghost: ${nextName} ${pg.role} note=${note} vel=${vel} (barsLeft=${barsLeft})`);
          }

          // Secondary ghost (chord/drone)
          if (barsLeft <= 2 && ghostDef.secondary) {
            const sg = ghostDef.secondary;
            const sRole = sg.role === 'chord' ? 'chords' : sg.role;
            const [sLo, sHi] = reg[sRole] || [48, 72];
            const sCandidates = scale.filter(n => n >= sLo && n <= sHi);
            if (sCandidates.length > 0) {
              const note = sCandidates[Math.floor(Math.random() * sCandidates.length)];
              sendMIDINote(sg.ch, note, velBase - 5, barMs);
              console.log(`[DIR3] ghost secondary: ${nextName} ${sg.role} note=${note}`);
            }
          }

          // ── DJ crossfade esteso (MACCHINA→TEMPESTA) ──
          // Bass ghost rimosso: il pavimento armonico è già coperto dal
          // chord ghost CH4 (accordi E phrygian) + TEMPESTA bassFloor 0.5.
          // Resta solo la conga ghost per anticipare il groove.
          if (ghostDef.djCrossfade) {
            // Conga ghost: bar -8 a -1, sincopatura che anticipa il groove
            if (barsLeft <= 8) {
              const congaVel = Math.round(15 + tProg * 20);  // 15→35 — appena percepibile
              const stepMs = Math.round(barMs / 4);
              // Conga su step 3 e 11 del bar (sincopatura caratteristica TEMPESTA)
              setTimeout(() => {
                sendMIDINote(1, 48, congaVel, stepMs);  // CONGA_LO = 48
                addMidiNote(1, 48 / 127, congaVel / 127);
              }, stepMs * 3);
              if (barsLeft <= 4) {
                setTimeout(() => {
                  sendMIDINote(1, 48, congaVel - 5, stepMs);
                  addMidiNote(1, 48 / 127, (congaVel - 5) / 127);
                }, stepMs * 11);
              }
              console.log(`[DIR3] DJ conga ghost: vel=${congaVel} (barsLeft=${barsLeft})`);
            }
          }
        }
      }
    }
  } else {
    worldState.degradation.noteDropProb   = 0;
    worldState.degradation.timingJitterMs = 0;
    worldState.degradation.chordNoteCount = 99;
    // Reset convergenza and transition outside dissoluzione
    if (firma.convergenza) firma.convergenza = false;
    worldState.transition = null;
  }

  // Advance phase if bar count exceeded
  const phaseName = PHASE_ORDER[_phaseIdx];
  const phaseDurBars = _track.phases[phaseName] || 16;

  _updateRupture(phaseName, _phaseBars, phaseDurBars);

  if (_phaseBars >= phaseDurBars) {
    if (_phaseIdx < PHASE_ORDER.length - 1) {
      // Skip phases with duration 0
      _phaseIdx++;
      while (_phaseIdx < PHASE_ORDER.length - 1 && (_track.phases[PHASE_ORDER[_phaseIdx]] || 0) === 0) {
        _phaseIdx++;
      }
      _phaseTime = 0;
      _phaseBars = 0;
      _barAcc = 0;
      _applyPhase();
      console.log(`[DIR3] Phase: ${PHASE_ORDER[_phaseIdx]} (arc: ${worldState.arc.toFixed(2)})`);
    } else {
      // Dissoluzione finished — advance to next track
      _advanceTrack();
    }
  }

  // Update phase state (for HUD)
  phaseState.elapsed = _phaseBars;
  phaseState.duration = phaseDurBars;
  phaseState.progress = phaseDurBars > 0 ? Math.min(1, _phaseBars / phaseDurBars) : 0;

  // Bar progress: position within current bar (0→1) — for scan lines, visual sync
  worldState.barProgress = barDuration > 0 ? Math.min(1, _barAcc / barDuration) : 0;

  // ── V3.6: Camera autopilot ──
  _updateCamera(dt);

  // Audio-reactive energy: real-time modulation on top of phase-based density
  // Combines RMS, onset bursts, and narrative intensity
  const rms = audio.rms || 0;
  const intensity = state.intensity || 0;
  const onsetBoost = audio.onset ? 0.15 : 0;
  const rawEnergy = rms * 0.4 + intensity * 0.4 + onsetBoost + (audio.flux || 0) * 0.3;
  // Smooth with EMA (fast attack, slow release)
  const prev = worldState.audioEnergy || 0;
  worldState.audioEnergy = rawEnergy > prev
    ? prev + (rawEnergy - prev) * 0.3    // fast attack
    : prev + (rawEnergy - prev) * 0.05;  // slow release
}

// ── V3: Wall of Sound (Hecker §A.7) ──
// Single monolithic gesture: 6-8 simultaneous notes spread across CH2/CH4/CH5,
// MIDI 36-72, vel 60-80, 8 bars long. Not a progression — a *declaration*.
// 2-3 per concert: TEMPESTA peak, RITORNO false resolution rebound.
function _triggerWallOfSound(label) {
  const scale = worldState.scale || [0, 2, 4, 5, 7, 9, 11];
  const root  = worldState.root || 60;
  const bpm   = worldState.bpm || 96;
  const durMs = Math.round((60 / bpm) * 4 * 8 * 1000); // 8 bars
  const channels = [2, 4]; // CH2 drone, CH4 chords (CH5 voice = modulare, no velocity)

  // Build a sorted scale-tone pool spanning MIDI 36-72
  const rootPC = root % 12;
  const pool = [];
  for (let oct = -3; oct <= 3; oct++) {
    for (const s of scale) {
      const n = rootPC + s + (oct * 12) + 60;
      if (n >= 36 && n <= 72) pool.push(n);
    }
  }
  pool.sort((a, b) => a - b);
  if (pool.length === 0) return;

  // Pick 6-8 notes evenly spread across the pool
  const noteCount = 6 + Math.floor(Math.random() * 3);
  const notes = [];
  for (let i = 0; i < noteCount; i++) {
    const idx = Math.round((i / (noteCount - 1)) * (pool.length - 1));
    notes.push(pool[idx]);
  }

  notes.forEach((note, i) => {
    const ch  = channels[i % channels.length];
    const vel = 60 + Math.round(Math.random() * 20); // 60-80
    sendMIDINote(ch, note, vel, durMs);
  });

  console.log(`[DIR3] ═══ WALL OF SOUND (${label}) — ${notes.length} note, 8 bar ═══`);
}

// ── Auto-advance to next track in album order ──
function _advanceTrack() {
  const currentIdx = TRACK_ORDER.indexOf(worldState.track);
  const nextIdx = currentIdx + 1;

  // V2 structural silences removed — replaced by overlap transitions (V3.5)

  if (nextIdx >= TRACK_ORDER.length) {
    // Concert is over — pause
    _paused = true;
    for (const mod of ['rhythm', 'harmony', 'bass', 'melody', 'texture']) {
      worldState.density[mod] = 0;
    }
    console.log('[DIR3] Concert finished.');
    return;
  }

  const nextTrack = TRACK_ORDER[nextIdx];
  if (!TRACKS[nextTrack]) {
    // Track not yet defined — skip to next available
    console.warn(`[DIR3] Track "${nextTrack}" not defined, skipping`);
    // Try the one after
    for (let i = nextIdx + 1; i < TRACK_ORDER.length; i++) {
      if (TRACKS[TRACK_ORDER[i]]) {
        const _skipBarMs = Math.round((240 / (worldState.bpm || 60)) * 1000);
        setTimeout(() => sendMIDIAllNotesOff(), Math.max(800, _skipBarMs + 200));
        initDirector3(TRACK_ORDER[i]);
        _paused = false; // keep playing
        return;
      }
    }
    _paused = true;
    console.log('[DIR3] No more defined tracks.');
    return;
  }

  // DJ crossfade MACCHINA→TEMPESTA: NO CC123 (il kick non deve fermarsi)
  // Tutte le altre transizioni: CC123 ritardato come safety net.
  const isDJ = worldState.track === 'MACCHINA' && nextTrack === 'TEMPESTA';
  if (!isDJ) {
    const _barMsForOff = Math.round((240 / (worldState.bpm || 60)) * 1000);
    setTimeout(() => sendMIDIAllNotesOff(), Math.max(800, _barMsForOff + 200));
  }
  const prevBpm = worldState.bpm || 60;  // capture before overwrite
  console.log(`[DIR3] → Next track: ${nextTrack}${isDJ ? ' (DJ crossfade)' : ''}`);
  initDirector3(nextTrack, { seamless: isDJ });
  _paused = false; // keep playing — don't reset to paused

  // BPM ramp: interpolate from previous tempo — durata per-transizione
  const newBpm = _track.bpm || 60;
  if (prevBpm !== newBpm) {
    const prevTrack = TRACK_ORDER[TRACK_ORDER.indexOf(nextTrack) - 1] || '';
    const rampBars = BPM_RAMP_BARS_TABLE[prevTrack] ?? BPM_RAMP_BARS_DEFAULT;
    // Durata calcolata col BPM di partenza — il ramp dura N bar reali, non N bar al tempo di arrivo
    const rampDurationSec = (240 / prevBpm) * rampBars;
    _bpmRamp = { from: prevBpm, to: newBpm, elapsed: 0, duration: rampDurationSec };
    worldState.bpm = prevBpm;  // start from old BPM
    console.log(`[DIR3] BPM ramp: ${prevBpm} → ${newBpm} over ${rampBars} bar`);
  }
}

// ── V3.6: Camera autopilot ──
// Pilotaggio spostato in src/camera.js — il director comunica solo personality e phase
function _updateCamera(dt) {
  // Pilotaggio spostato in src/camera.js — il director comunica solo personality e phase
  worldState.camera.personality = worldState.track || null;
  worldState.camera.phase = PHASE_ORDER[_phaseIdx];
}

// ── V3: Rupture 4-stage envelope ──
// Stage boundaries as fraction of the rottura phase duration.
// Intensity builds through omen/infiltration, peaks at takeover, decays in residue.
const _RUPTURE_STAGE_BOUNDS = [
  { name: 'omen',         start: 0.00, end: 0.20 },
  { name: 'infiltration', start: 0.20, end: 0.50 },
  { name: 'takeover',     start: 0.50, end: 0.80 },
  { name: 'residue',      start: 0.80, end: 1.00 },
];

// ── Micro-rupture state ──
// Spasmi brevi e casuali fuori dalla fase rottura.
// Probabilità per BAR (non per frame). Durata 2-5s, intensità 0.15-0.40.
// Innesco: _triggerMicroRupture() chiamato nel bar-tick loop.
// Decay: ogni frame in _updateRupture per smoothness.
let _microRup = { active: false, intensity: 0, decay: 0 };
const _MICRO_RUP_PHASE_CHANCE = {
  germoglio:   0,       // mai — il mondo nasce, nessuna frattura
  pulsazione:  0.06,    // ~1 ogni 16 bar
  densita:     0.12,    // ~1 ogni 8 bar
  rottura:     0,       // fase piena gestisce tutto
  dissoluzione: 0.04,   // residui — echi della rottura passata
};

function _triggerMicroRupture(phaseName) {
  if (_microRup.active) return;   // uno alla volta
  const chance = _MICRO_RUP_PHASE_CHANCE[phaseName] ?? 0;
  if (chance <= 0) return;
  const tension = worldState.tension ?? 0;
  if (Math.random() < chance * (0.5 + tension)) {
    _microRup.active = true;
    _microRup.intensity = 0.15 + Math.random() * 0.25;
    _microRup.decay = 0.96 + Math.random() * 0.03;  // ~50-160 frame (~1-3s)
  }
}

function _updateRupture(phaseName, phaseBars, phaseDurBars) {
  // ── Fase rottura piena: arco narrativo completo ──
  if (phaseName === 'rottura' && phaseDurBars > 0) {
    _microRup.active = false;
    const t = Math.min(1, phaseBars / phaseDurBars);
    worldState.rupture.t = t;

    let s = _RUPTURE_STAGE_BOUNDS[_RUPTURE_STAGE_BOUNDS.length - 1];
    for (const b of _RUPTURE_STAGE_BOUNDS) {
      if (t < b.end) { s = b; break; }
    }
    const stageT = Math.min(1, (t - s.start) / (s.end - s.start));
    worldState.rupture.stage  = s.name;
    worldState.rupture.stageT = stageT;

    const intensityMap = {
      omen:         stageT * 0.40,
      infiltration: 0.40 + stageT * 0.35,
      takeover:     0.75 + stageT * 0.25,
      residue:      1.00 - stageT,
    };
    worldState.rupture.intensity = intensityMap[s.name] ?? 0;
    return;
  }

  // ── Micro-rupture: decay ogni frame per smoothness ──
  if (_microRup.active) {
    _microRup.intensity *= _microRup.decay;
    if (_microRup.intensity < 0.01) {
      _microRup.active = false;
      _microRup.intensity = 0;
    }
    worldState.rupture.stage     = 'micro';
    worldState.rupture.stageT    = 0;
    worldState.rupture.t         = 0;
    worldState.rupture.intensity = _microRup.intensity;
    return;
  }

  // Nessuna rupture attiva
  worldState.rupture.stage     = null;
  worldState.rupture.stageT    = 0;
  worldState.rupture.t         = 0;
  worldState.rupture.intensity = 0;
}

// ── V3: Tension waves (RESEARCH-V4 §B.1) ──
// 5 escalating waves over the concert arc — picco a 0.65-0.85, NOT a 0.5.
// Each wave has a sin-shaped local arc with a valley between waves.
// Solves "concerto suona come fade-in di 43 minuti" diagnosis.
const _TENSION_WAVES = [
  { start: 0.00, end: 0.25, peak: 0.40 },
  { start: 0.25, end: 0.45, peak: 0.55 },
  { start: 0.45, end: 0.65, peak: 0.70 },
  { start: 0.65, end: 0.85, peak: 0.95 },  // climax — picco massimo all'80%
  { start: 0.85, end: 1.00, peak: 0.50 },  // release final
];

function _computeTension(arc) {
  for (const w of _TENSION_WAVES) {
    if (arc >= w.start && arc < w.end) {
      const pos = (arc - w.start) / (w.end - w.start);
      const shape = Math.sin(pos * Math.PI); // 0..1..0
      return w.peak * shape;
    }
  }
  return 0;
}

// Map tension (0..0.95) → per-dimension multipliers around 1.0.
// Melody is in *contromovimento* with rhythm: high rhythm → rare melody.
function _computeTensionMultipliers(arc) {
  const t = _computeTension(arc);
  return {
    rhythm:  0.55 + t * 0.55,   // 0.55 to ~1.07 — main tension carrier
    melody:  1.10 - t * 0.30,   // 1.10 to ~0.81 — counter
    bass:    0.85 + t * 0.25,   // 0.85 to ~1.09
    harmony: 0.90 + t * 0.15,   // 0.90 to ~1.04
    texture: 0.65 + t * 0.50,   // 0.65 to ~1.13
  };
}

// ── Apply phase: update density, energy, registers, velocity ceilings ──
function _applyPhase() {
  const phaseName = PHASE_ORDER[_phaseIdx];
  worldState.phase = phaseName;
  worldState.energy = PHASE_ENERGY[phaseName] || 'SILENCE';

  // Density = track base × phase multiplier
  const pd = PHASE_DENSITY[phaseName];
  for (const mod of ['rhythm', 'harmony', 'bass', 'melody', 'texture']) {
    const base = (_track.density[mod] || 0) * (pd[mod] || 0);
    _phaseDensityBase[mod] = base;
    worldState.density[mod] = base;
  }

  // Registers and velocity ceilings from track (constant per track, could vary per phase later)
  if (_track.register) {
    for (const [k, v] of Object.entries(_track.register)) {
      worldState.register[k] = [...v];
    }
  }
  if (_track.velocityCeiling) {
    for (const [k, v] of Object.entries(_track.velocityCeiling)) {
      worldState.velocityCeiling[k] = v;
    }
  }

  // V2 ext: Frahm phase-modulated velocity range (extension of MUSIC_EXPERIMENT)
  // Scales the per-track ceiling by a phase factor (pp on germoglio, ff on rottura).
  // V3.9: dissoluzione fade progressivo — il ceiling scende da 0.60 a 0.10
  // nelle ultime battute, così gli strumenti svaniscono gradualmente
  if (CFG.MUSIC_EXPERIMENT) {
    let scale = PHASE_VEL_SCALE[phaseName] ?? 1.0;
    if (phaseName === 'dissoluzione') {
      const pp = phaseState.progress ?? 0;
      // 0.60 → 0.10 nell'arco della dissoluzione (curva quadratica: più lento all'inizio)
      scale = 0.60 * (1 - pp * pp * 0.83);  // 0.60 → ~0.10
    }
    for (const k of Object.keys(worldState.velocityCeiling)) {
      worldState.velocityCeiling[k] = Math.min(127, Math.round(worldState.velocityCeiling[k] * scale));
    }
  }
}

// ── Manual controls (keyboard) ──
export function skipPhase(direction = 1) {
  const newIdx = Math.max(0, Math.min(PHASE_ORDER.length - 1, _phaseIdx + direction));
  if (newIdx !== _phaseIdx) {
    _phaseIdx = newIdx;
    _phaseTime = 0;
    _phaseBars = 0;
    _barAcc = 0;
    _applyPhase();
    console.log(`[DIR3] Skipped to: ${PHASE_ORDER[_phaseIdx]}`);
  }
}

export function jumpToPhase(name) {
  const idx = PHASE_ORDER.indexOf(name);
  if (idx >= 0) {
    _phaseIdx = idx;
    _phaseTime = 0;
    _phaseBars = 0;
    _barAcc = 0;
    _applyPhase();
    console.log(`[DIR3] Jumped to: ${name}`);
  }
}

// ── Switch track (keyboard 6-7 or future sequencer) ──
export function jumpToTrack(trackName) {
  if (!TRACKS[trackName]) {
    console.warn(`[DIR3] Track "${trackName}" not found`);
    return;
  }
  const wasPlaying = !_paused;
  _bpmRamp = null;  // manual jump = no ramp, immediate tempo
  initDirector3(trackName);
  if (wasPlaying) {
    _paused = false;
    _applyPhase();
  }
}

// ── Phrase generator ──
function _generatePhrase(scale, len) {
  const pool = scale.filter(n => n >= 48 && n <= 72);
  if (pool.length < 4) return pool.slice(0, len);

  const phrase = [];
  const startIdx = Math.floor(pool.length / 3) + Math.floor(Math.random() * Math.floor(pool.length / 3));
  phrase.push(pool[startIdx]);

  const ascending = Math.random() < 0.5;
  let leapUsed = false;
  let lastDirection = ascending ? 1 : -1;

  for (let i = 1; i < len; i++) {
    const lastNote = phrase[i - 1];
    const lastIdx = pool.indexOf(lastNote);
    if (lastIdx < 0) { phrase.push(pool[Math.floor(Math.random() * pool.length)]); continue; }

    const roll = Math.random();
    let interval, direction;

    if (roll < CFG.ENCORE_CONTOUR_STEP) {
      interval = 1;
      direction = Math.random() < 0.7 ? (ascending ? 1 : -1) : (ascending ? -1 : 1);
    } else if (roll < CFG.ENCORE_CONTOUR_STEP + CFG.ENCORE_CONTOUR_SKIP) {
      interval = 2 + Math.floor(Math.random() * 2);
      direction = lastDirection;
    } else {
      if (leapUsed) { interval = 1; direction = lastDirection; }
      else { interval = 4 + Math.floor(Math.random() * 2); direction = ascending ? 1 : -1; leapUsed = true; }
    }

    let newIdx = lastIdx + interval * direction;
    newIdx = Math.max(0, Math.min(pool.length - 1, newIdx));
    phrase.push(pool[newIdx]);
    lastDirection = direction;
  }

  // Closure
  const first = phrase[0];
  const closureTargets = pool.filter(n => {
    const iv = Math.abs(n - first) % 12;
    return iv === 0 || iv === 3 || iv === 4 || iv === 7 || iv === 8;
  });
  if (closureTargets.length > 0) {
    const last = phrase[phrase.length - 1];
    closureTargets.sort((a, b) => Math.abs(a - last) - Math.abs(b - last));
    phrase[phrase.length - 1] = closureTargets[0];
  }

  return phrase;
}

function _invertPhrase(phrase, pivotNote) {
  return phrase.map(n => pivotNote + (pivotNote - n));
}

function _retrogradePhrase(phrase) {
  return [...phrase].reverse();
}

function _fitToRegister(note, lo, hi) {
  let n = note;
  while (n < lo) n += 12;
  while (n > hi) n -= 12;
  if (n < lo) n = lo;
  return n;
}

function _checkConvergence(canon) {
  const pitchClasses = {};
  const voices = ['bass', 'chord', 'arp', 'voice', 'lead'];
  let activeCount = 0;
  for (const v of voices) {
    if (!canon[v].active) continue;
    activeCount++;
    const pc = canon[v].note % 12;
    pitchClasses[pc] = (pitchClasses[pc] || 0) + 1;
  }
  if (activeCount < 3) return false;
  for (const count of Object.values(pitchClasses)) {
    if (count >= 3) return true;
  }
  return false;
}

// ── ENCORE: launch the encore sequence ──
export function launchEncore() {
  if (_encoreActive) return;

  _paused = true;
  sendMIDIAllNotesOff();
  sendNornsDroneStop();

  worldState.encoreMode = true;
  worldState.encoreScale = 'halfWhole';
  worldState.scale = ENCORE_SCALES.halfWhole;

  _encoreActive = true;
  _encoreBrick = 0;
  _encoreBrickBar = 0;
  worldState.encoreBrick = 0;

  const canon = worldState.encoreCanon;
  canon.phrase = [];
  canon.phraseAge = 0;
  for (const v of ['bass', 'chord', 'arp', 'voice', 'lead']) {
    canon[v].pos = 0; canon[v].note = 0; canon[v].active = false;
  }
  canon.convergence = false;
  _canonPhrase = [];
  _canonPhraseRetro = [];
  _canonPhraseInv = [];
  _canonTickAcc = 0;
  _canonPhraseAge = 0;

  initDirector3('ENCORE');

  worldState.bpm = CFG.ENCORE_BPM_START;
  worldState.phase = 'germoglio';

  worldState.density.rhythm = 0.8;
  worldState.density.harmony = 0;
  worldState.density.bass = 0;
  worldState.density.melody = 0;
  worldState.density.texture = 0;

  worldState.velocityCeiling.rhythm = 40;

  _paused = false;
  sendNornsBiome(TRACK_ORDER.indexOf('ENCORE'));
  sendNornsDroneStart();

  console.log('[DIR3] ENCORE v2 launched — Canon Machine');
}

// ── ENCORE: switch scale on the fly ──
export function switchEncoreScale(scaleName) {
  if (!_encoreActive) return;
  if (!ENCORE_SCALES[scaleName]) return;
  worldState.encoreScale = scaleName;
  worldState.scale = ENCORE_SCALES[scaleName];
  console.log(`[DIR3] ENCORE scale → ${scaleName}`);
}

// ── ENCORE v2: per-tick update — Canon Machine ──
function _updateEncore(dt) {
  _phaseTime += dt;
  _totalTime += dt;

  const bpm = worldState.bpm || CFG.ENCORE_BPM_TARGET;
  const barDuration = 240 / bpm;
  const canon = worldState.encoreCanon;

  _barAcc += dt;
  let barAdvanced = false;
  while (_barAcc >= barDuration) {
    _barAcc -= barDuration;
    _phaseBars++;
    _encoreBrickBar++;
    _canonPhraseAge++;
    barAdvanced = true;
  }

  // Heartbeat: BPM ramp
  if (_encoreBrick === 0) {
    const intraBar = barDuration > 0 ? _barAcc / barDuration : 0;
    const progress = Math.min(1, (_encoreBrickBar + intraBar) / CFG.ENCORE_HEARTBEAT_BARS);
    worldState.bpm = CFG.ENCORE_BPM_START + (CFG.ENCORE_BPM_TARGET - CFG.ENCORE_BPM_START) * progress;
    worldState.velocityCeiling.rhythm = Math.round(40 + progress * 70);
  }

  // Canon engine: advance voice positions on bar boundary
  if (canon.phrase.length > 0 && barAdvanced) {
    const speeds = [
      { key: 'bass',  speed: CFG.ENCORE_SPEED_BASS },
      { key: 'chord', speed: CFG.ENCORE_SPEED_CHORD },
      { key: 'arp',   speed: CFG.ENCORE_SPEED_ARP },
      { key: 'voice', speed: CFG.ENCORE_SPEED_VOICE },
      { key: 'lead',  speed: CFG.ENCORE_SPEED_LEAD },
    ];

    const phraseLen = canon.phrase.length;
    for (const { key, speed } of speeds) {
      if (!canon[key].active) continue;
      canon[key].pos = (canon[key].pos + speed) % phraseLen;
      const posIdx = Math.floor(Math.abs(canon[key].pos)) % phraseLen;

      let note;
      if (key === 'arp') {
        note = _canonPhraseInv[posIdx] ?? canon.phrase[posIdx];
      } else if (key === 'voice') {
        note = _canonPhraseRetro[posIdx] ?? canon.phrase[posIdx];
      } else if (key === 'chord') {
        const offsetIdx = (posIdx + Math.floor(phraseLen * CFG.ENCORE_CHORD_OFFSET)) % phraseLen;
        note = canon.phrase[offsetIdx];
      } else {
        note = canon.phrase[posIdx];
      }

      const reg = worldState.register;
      if (key === 'bass')  note = _fitToRegister(note, reg.bass[0], reg.bass[1]);
      if (key === 'chord') note = _fitToRegister(note, reg.chords[0], reg.chords[1]);
      if (key === 'arp')   note = _fitToRegister(note, reg.arp[0], reg.arp[1]);
      if (key === 'voice') note = _fitToRegister(note, reg.melody[0], reg.melody[1]);
      if (key === 'lead')  note = _fitToRegister(note, reg.lead[0], reg.lead[1]);

      canon[key].note = note;
    }

    // Contrapuntal constraints: no unisons
    const activeVoices = ['bass', 'chord', 'arp', 'voice', 'lead'].filter(v => canon[v].active);
    for (let i = 0; i < activeVoices.length; i++) {
      for (let j = i + 1; j < activeVoices.length; j++) {
        if (canon[activeVoices[i]].note === canon[activeVoices[j]].note) {
          const scale = worldState.scale || [];
          const n = canon[activeVoices[j]].note;
          const upper = scale.find(s => s > n && s <= n + 5);
          if (upper) canon[activeVoices[j]].note = upper;
        }
      }
    }

    canon.convergence = _checkConvergence(canon);
  }

  if (!barAdvanced) return;

  // Phrase change
  const brickBars = CFG.ENCORE_BRICK_BARS[_encoreBrick] || 32;
  const needNewPhrase = (
    (canon.phrase.length === 0 && _encoreBrick >= 1) ||
    (_encoreBrick === 8 && _canonPhraseAge >= 4)
  );
  if (needNewPhrase) {
    const phraseLen = _encoreBrick === 8
      ? CFG.ENCORE_PHRASE_LEN_PLATEAU
      : CFG.ENCORE_PHRASE_LEN_MIN + Math.floor(Math.random() * (CFG.ENCORE_PHRASE_LEN_MAX - CFG.ENCORE_PHRASE_LEN_MIN + 1));
    _canonPhrase = _generatePhrase(worldState.scale, phraseLen);
    canon.phrase = _canonPhrase;
    _canonPhraseRetro = _retrogradePhrase(_canonPhrase);
    _canonPhraseInv = _invertPhrase(_canonPhrase, worldState.root || 48);
    _canonPhraseAge = 0;
    canon.phraseAge = 0;

    for (const v of ['bass', 'chord', 'arp', 'voice', 'lead']) {
      if (canon[v].active) {
        canon[v].pos = 0;
        canon[v].note = worldState.root || 48;
      }
    }
    canon.convergence = true;

    console.log(`[DIR3] ENCORE new phrase (${phraseLen} notes): ${_canonPhrase.join(',')}`);
  }

  // Brick transition
  if (_encoreBrickBar >= brickBars) {
    _encoreBrick++;
    _encoreBrickBar = 0;
    worldState.encoreBrick = _encoreBrick;

    if (_encoreBrick > 8) {
      _endEncore();
      return;
    }

    if (_encoreBrick >= 1) canon.arp.active = true;
    if (_encoreBrick >= 2) canon.bass.active = true;
    if (_encoreBrick >= 4) canon.voice.active = true;
    if (_encoreBrick >= 5) canon.lead.active = true;
    if (_encoreBrick >= 6) canon.chord.active = true;

    const densityMap = {
      0: { rhythm: 0.8, harmony: 0,    bass: 0,   melody: 0,   texture: 0 },
      1: { rhythm: 0.8, harmony: 0,    bass: 0,   melody: 0.7, texture: 0.1 },
      2: { rhythm: 0.8, harmony: 0,    bass: 0.8, melody: 0.7, texture: 0.1 },
      3: { rhythm: 0.9, harmony: 0,    bass: 0.8, melody: 0.7, texture: 0.1 },
      4: { rhythm: 0.9, harmony: 0,    bass: 0.8, melody: 0.9, texture: 0.1 },
      5: { rhythm: 0.9, harmony: 0,    bass: 0.8, melody: 0.9, texture: 0.15 },
      6: { rhythm: 1.0, harmony: 0.7,  bass: 0.9, melody: 1.0, texture: 0.15 },
      7: { rhythm: 1.0, harmony: 0.8,  bass: 1.0, melody: 1.0, texture: 0.2 },
      8: { rhythm: 1.0, harmony: 0.9,  bass: 1.0, melody: 1.0, texture: 0.2 },
    };
    const d = densityMap[_encoreBrick] || densityMap[8];
    for (const [mod, val] of Object.entries(d)) worldState.density[mod] = val;

    if (_encoreBrick >= 1) worldState.bpm = CFG.ENCORE_BPM_TARGET;

    const track = TRACKS.ENCORE;
    for (const mod of ['rhythm', 'harmony', 'bass', 'melody', 'texture']) {
      worldState.velocityCeiling[mod] = track.velocityCeiling[mod];
    }

    if (_encoreBrick <= 2)      worldState.phase = 'pulsazione';
    else if (_encoreBrick <= 5) worldState.phase = 'densita';
    else if (_encoreBrick <= 7) worldState.phase = 'rottura';
    else                        worldState.phase = 'dissoluzione';
    worldState.camera.phase = worldState.phase;

    _canonPhraseAge = 999;  // force new phrase on next bar

    console.log(`[DIR3] ENCORE brick ${_encoreBrick}: ${ENCORE_BRICK_NAMES[_encoreBrick]}`);
  }
}

function _endEncore() {
  _encoreActive = false;
  _paused = true;
  worldState.encoreMode = false;
  worldState.encoreBrick = -1;
  worldState.bpm = null;
  const canon = worldState.encoreCanon;
  canon.phrase = [];
  for (const v of ['bass', 'chord', 'arp', 'voice', 'lead']) {
    canon[v].active = false; canon[v].pos = 0; canon[v].note = 0;
  }
  canon.convergence = false;
  sendMIDIAllNotesOff();
  sendNornsDroneStop();
  console.log('[DIR3] ENCORE ended — hard cut');
}

export function getDirector3Status() {
  return {
    track: worldState.track,
    phase: PHASE_ORDER[_phaseIdx],
    phaseProgress: phaseState.progress,
    arc: worldState.arc,
    energy: worldState.energy,
    totalTime: _totalTime,
  };
}
