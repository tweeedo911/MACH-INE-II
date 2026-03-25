// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Composer 2 (Secondo Organismo Compositivo)
//  Centro gravitazionale: A Dorian · layer sfasati · dialogo col director
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { state } from './state.js';
import { sendMIDINote as _rawSend, sendMIDIAllNotesOff } from './midi.js';
import { setArcPhaseForced, releaseArcHold } from './director.js';
import { setComposerClimax } from './colors.js';
import { addMidiNote as _rawAddMidi } from './field.js';
import { emit } from './director-events.js';
import { setEngine } from './midi-patterns.js';
import { getPresenceMultiplier, isChannelAllowed } from './presence-multiplier.js';

// ── Presence-scaled MIDI output (with channel priority) ──
function sendMIDINote(ch, note, vel, dur) {
  const pm = getPresenceMultiplier('meccanica');
  if (pm < 0.05) return;
  if (!isChannelAllowed('meccanica', ch)) return;
  _rawSend(ch, note, Math.max(1, Math.round(vel * pm)), dur);
}
function addMidiNote(ch, x, intensity) {
  _rawAddMidi(ch, x, intensity * getPresenceMultiplier('meccanica'));
}

// ── Scale modes A (nota MIDI: A3 = 57) ──
const MODES2 = {
  A_dorian:   [45,47,48,50,52,54,55,57,59,60,62,64,66,67,69,71,72,74,76,78,79,81],
  A_phrygian: [45,46,48,50,52,53,55,57,58,60,62,64,65,67,69,70,72,74,76,77,79,81],
  E_lydian:   [52,54,56,58,59,61,63,64,66,68,70,71,73,75,76,78,80,82,83,85,87],
  Bb_locrian: [46,47,49,51,52,54,56,58,59,61,63,64,66,68,70,71,73,75,76,78,80],
};

// Pivot pitch classes: A=9, C=0, E=4 (mod 12)
const PIVOT_CLASSES2 = new Set([9, 0, 4]);

// Presenza target per layer [harmonic, rhythmic, textural, melodic] per fase
const PHASE_PRESENCE2 = {
  germoglio:    [0.3, 0.0, 0.0, 0.0],
  pulsazione:   [0.5, 0.7, 0.0, 0.3],
  densita:      [0.8, 0.9, 0.6, 0.7],
  rottura:      [0.2, 0.9, 0.8, 0.0],
  dissoluzione: [0.4, 0.1, 0.0, 0.2],
};

// ── Layer — oscillatore ciclico indipendente ──
class Layer {
  constructor(cycleBars, offset) {
    this.cycleBars = cycleBars;
    this.phase = offset;       // 0..1, avanza ogni frame
    this._prevPhase = offset;
  }

  update(dt, bpm) {
    this._prevPhase = this.phase;
    // bars/s = bpm / 60 / 4 (4 beat per bar)
    const barsPerSec = bpm / (60 * 4);
    this.phase = (this.phase + barsPerSec * dt / this.cycleBars) % 1;
  }

  // True se il layer ha attraversato threshold questo frame
  crossed(threshold) {
    const p = this._prevPhase, n = this.phase;
    // gestisce il wrap 0.99→0.01
    if (p <= n) return p < threshold && n >= threshold;
    return p < threshold || n >= threshold;
  }
}

// ── Stato modulo ──
export let composer2Active = false;

let phaseIndex = 0;
let phaseTime = 0;
let arcProgress = 0;
let clock = 0;        // in beat
let lastBeat = -1;

const layers = {};    // { harmonic, rhythmic, textural, melodic }
const presence = [0, 0, 0, 0]; // presenza corrente per layer

let currentMode = 'A_dorian';
let currentDrone = 57;
let lastChord = [57, 60, 64];  // A C E iniziale

let ruptureStage = 'idle';
let lastRuptureStage = 'idle';

// Edge detection per emitLayerEvents (evita chiamate 60×/s al director)
let _lastTensionActive = false;
let _lastVoidActive    = false;
let _lastDensityPeak   = false;

let debugTimer = 0;

// ── Inizializzazione ──
export function initComposer2() {
  phaseIndex = 0;
  phaseTime = 0;
  arcProgress = 0;
  clock = 0;
  lastBeat = -1;
  ruptureStage = 'idle';
  lastRuptureStage = 'idle';
  _lastTensionActive = false;
  _lastVoidActive    = false;
  _lastDensityPeak   = false;
  presence.fill(0);

  const L = CFG.COMPOSER2.layers;
  layers.harmonic = new Layer(L.harmonic.cycleBars, L.harmonic.offset);
  layers.rhythmic  = new Layer(L.rhythmic.cycleBars,  L.rhythmic.offset);
  layers.textural  = new Layer(L.textural.cycleBars,  L.textural.offset);
  layers.melodic   = new Layer(L.melodic.cycleBars,   L.melodic.offset);
}

// ── Toggle ──
export function toggleComposer2() {
  composer2Active = !composer2Active;
  if (composer2Active) {
    initComposer2();
    setEngine('meccanica');
    console.log('[COMPOSER2] ON — A Dorian MECCANICA 98bpm');
  } else {
    sendMIDIAllNotesOff();
    setComposerClimax(false);
    releaseArcHold();
    setEngine(null);
    console.log('[COMPOSER2] OFF');
  }
}

// ── Phase system ──
function currentPhaseName() {
  return CFG.COMPOSER2.phaseOrder[phaseIndex];
}

function updatePhase(dt) {
  phaseTime += dt;
  const phaseName = currentPhaseName();
  const phaseCfg = CFG.COMPOSER2.phases[phaseName];
  arcProgress = Math.min(1, phaseTime / phaseCfg.duration);

  // Aggiorna modo e drone
  currentMode = phaseCfg.mode;
  currentDrone = phaseCfg.drone;

  // Blocca il director arc sulla fase corrente
  setArcPhaseForced(phaseCfg.arc);

  // Avanza alla fase successiva
  if (phaseTime >= phaseCfg.duration) {
    phaseIndex = (phaseIndex + 1) % CFG.COMPOSER2.phaseOrder.length;
    phaseTime = 0;
    arcProgress = 0;
    chordProgIdx2 = 0;
    console.log(`[COMPOSER2] → ${currentPhaseName()}`);
  }
}

// ── Layer update ──
function updateLayers(dt) {
  const bpm = CFG.COMPOSER2.bpm;
  layers.harmonic.update(dt, bpm);
  layers.rhythmic.update(dt, bpm);
  layers.textural.update(dt, bpm);
  layers.melodic.update(dt, bpm);
}

// ── VoidManager — mantiene il silence ratio ──
function updatePresence(dt) {
  const phaseName = currentPhaseName();
  const target = PHASE_PRESENCE2[phaseName] || [0.5, 0.5, 0.3, 0.3];
  const silTarget = CFG.COMPOSER2.silenceTarget[phaseName] || 0.4;

  // Lerp presenza verso target (velocità adattiva)
  for (let i = 0; i < 4; i++) {
    presence[i] += (target[i] - presence[i]) * dt * 0.3;
  }

  // Calcola void ratio
  const activeCount = presence.filter(p => p > 0.3).length;
  const voidRatio = 1 - activeCount / 4;

  // VoidManager: troppo denso → muta il layer più debole
  if (voidRatio < silTarget) {
    let minIdx = 0;
    for (let i = 1; i < 4; i++) { if (presence[i] < presence[minIdx]) minIdx = i; }
    presence[minIdx] *= 0.85;
  }

  // VoidManager: troppo silenzioso → riattiva il layer più silenzioso
  if (voidRatio > silTarget + 0.20) {
    let minIdx = 0;
    for (let i = 1; i < 4; i++) { if (presence[i] < presence[minIdx]) minIdx = i; }
    presence[minIdx] = Math.min(presence[minIdx] + 0.15, target[minIdx] || 0.5);
  }
}

// ── Rupture engine ──
function updateRupture() {
  const phaseName = currentPhaseName();
  if (phaseName !== 'rottura') {
    if (ruptureStage !== 'idle') {
      ruptureStage = 'idle';
      setComposerClimax(false);
    }
    return;
  }

  const R = CFG.COMPOSER2.rupture;
  const p = arcProgress;
  if      (p < R.presagioAt)      ruptureStage = 'idle';
  else if (p < R.infiltrazioneAt) ruptureStage = 'presagio';
  else if (p < R.takeoverAt)      ruptureStage = 'infiltrazione';
  else if (p < R.residuoAt)       ruptureStage = 'takeover';
  else                            ruptureStage = 'residuo';

  if (ruptureStage !== lastRuptureStage) {
    lastRuptureStage = ruptureStage;
    emit('rupture_stage', { stage: ruptureStage, progress: p });

    // Color C (magenta) solo in TAKEOVER
    setComposerClimax(ruptureStage === 'takeover');
  }
}

// Fixed chord progressions per phase (MIDI absolute — A Dorian / E Lydian)
const CHORD_PROGS2 = {
  germoglio:    [[57,60,64]],                                                      // Am
  pulsazione:   [[57,60,64],[60,64,67],[62,65,69],[57,60,64]],                    // Am → C → Dm → Am
  densita:      [[57,60,64],[60,64,67],[62,65,69],[64,67,71],[60,64,67],[57,62,64]], // Am→C→Dm→Em→C→Asus
  rottura:      null,
  dissoluzione: [[57,60,64],[60,64,67],[57,60,64]],                                // Am → C → Am
};
let chordProgIdx2 = 0;

// ── Chord builder — structured progressions with voice leading ──
function buildChord(mode) {
  const prog = CHORD_PROGS2[currentPhaseName()];
  if (prog) {
    chordProgIdx2 = (chordProgIdx2 + 1) % prog.length;
    const notes = [...prog[chordProgIdx2]];
    if (lastChord) {
      for (let i = 0; i < notes.length; i++) {
        const diff = notes[i] - lastChord[i];
        if (Math.abs(diff) > 7) notes[i] += diff > 0 ? -12 : 12;
      }
    }
    lastChord = notes;
    return notes;
  }
  // Rottura: dissonant cluster
  const scale = MODES2[mode];
  const idx = Math.floor(Math.random() * (scale.length - 2));
  const notes = [scale[idx], scale[idx + 1], scale[idx + 2]]; // cluster
  lastChord = notes;
  return notes;
}

// ── Melodia con bias pivot ──
function pickMelodicNote(mode) {
  const scale = MODES2[mode];
  // Filtro registro mid (60-84)
  const mid = scale.filter(n => n >= 60 && n <= 84);
  const pool = mid.length > 0 ? mid : scale;
  // Bias pivot 40% (pitch class indipendente dall'ottava)
  const pivots = pool.filter(n => PIVOT_CLASSES2.has(n % 12));
  if (pivots.length > 0 && Math.random() < 0.4) {
    return pivots[Math.floor(Math.random() * pivots.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Crossing-triggered notes (ogni frame — non legati al beat clock) ──
function checkLayerCrossings() {
  const bpm    = CFG.COMPOSER2.bpm;
  const beatMs = (60 / bpm) * 1000;
  const rc     = ruptureStage === 'takeover'     ? 0.8 :
                 ruptureStage === 'infiltrazione' ? 0.4 :
                 ruptureStage === 'presagio'      ? 0.15 : 0;

  // CH4 CHORDS — harmonic layer crossing 0.0, 0.5
  if (presence[0] > 0.3) {
    if (layers.harmonic.crossed(0.0) || layers.harmonic.crossed(0.5)) {
      const chord = buildChord(currentMode);
      const vel   = Math.floor(52 + presence[0] * 40);
      for (const note of chord) {
        sendMIDINote(4, note, vel, beatMs * 6);
        addMidiNote(4, note / 127, vel / 127);
      }
      emit('chord_change', { root: chord[0], mode: currentMode });
    }
  }

  // CH1 GRAIN — textural layer crossing 0.2, 0.4, 0.6, 0.8
  if (presence[2] > 0.25 && rc < 0.5) {
    for (const th of [0.2, 0.4, 0.6, 0.8]) {
      if (layers.textural.crossed(th)) {
        const scale = MODES2[currentMode];
        const hi    = scale.filter(n => n >= 72 && n <= 88);
        const pool  = hi.length > 0 ? hi : scale;
        const note  = pool[Math.floor(Math.random() * pool.length)];
        const vel   = Math.floor(38 + presence[2] * 35);
        sendMIDINote(1, note, vel, beatMs * 0.35);
        addMidiNote(1, note / 127, vel / 127);
        emit('grain_entry', { intensity: presence[2] });
      }
    }
  }

  // CH5 VOICE + CH6 LEAD — call-and-response melodic system
  if (presence[3] > 0.3 && rc < 0.5) {
    for (const th of [0.25, 0.5, 0.75]) {
      if (layers.melodic.crossed(th)) {
        if (Math.random() < presence[3] * 0.7) {
          const note = pickMelodicNote(currentMode);
          const vel  = Math.floor(48 + presence[3] * 50);
          // CH5 VOICE — the call
          sendMIDINote(5, note, vel, beatMs * 1.8);
          addMidiNote(5, note / 127, vel / 127);
          // CH6 LEAD — response: invert the interval from last chord root
          if (presence[3] > 0.5 && Math.random() < 0.5) {
            const chordRoot = lastChord[0];
            const interval = note - chordRoot;
            // Response mirrors the interval (call goes up, response goes down)
            const responseNote = Math.max(48, Math.min(96, chordRoot - interval));
            setTimeout(() => {
              if (!composer2Active) return;
              sendMIDINote(6, responseNote, Math.floor(vel * 0.65), beatMs * 1.5);
              addMidiNote(6, responseNote / 127, (vel * 0.65) / 127);
            }, Math.round(beatMs * 0.75));
          }
        }
      }
    }
  }
}

// ── Beat-triggered notes (CH0 PULSE, CH2 DRONE, CH3 BASS, CH7 RUPTURE) ──
function onBeat(beat) {
  const bpm       = CFG.COMPOSER2.bpm;
  const beatMs    = (60 / bpm) * 1000;
  const shuffleMs = CFG.COMPOSER2.grooveShuffleMs || 10;
  const phaseName = currentPhaseName();
  const barBeat   = beat % 4;
  const bar       = Math.floor(beat / 4);
  const rc        = ruptureStage === 'takeover'     ? 0.8 :
                    ruptureStage === 'infiltrazione' ? 0.4 :
                    ruptureStage === 'presagio'      ? 0.15 : 0;

  // Groove shuffle: offset on even beats (±shuffleMs humanization)
  const swing = (barBeat % 2 === 0 && barBeat > 0)
    ? Math.round(shuffleMs + (Math.random() - 0.5) * shuffleMs)
    : Math.round((Math.random() - 0.5) * shuffleMs * 0.5);

  // CH0 PULSE — 4-on-the-floor kick with groove
  if (presence[1] > 0.3 && rc < 0.6) {
    const pulseEvery = presence[1] > 0.7 ? 1 : 2;
    if (beat % pulseEvery === 0) {
      const vel = barBeat === 0 ? 110 : Math.floor(78 + presence[1] * 30);
      setTimeout(() => {
        if (!composer2Active) return;
        sendMIDINote(0, currentDrone - 12, vel, beatMs * 0.3);
        addMidiNote(0, (currentDrone - 12) / 127, vel / 127);
      }, Math.max(0, swing));
    }
  }

  // CH3 BASS — chromatic movement: root, chromatic approach, fifth, minor third
  if (presence[1] > 0.2 && phaseName !== 'rottura') {
    const bassRoot = currentDrone - 24;
    const bassEvery = presence[1] > 0.6 ? 1 : 2;
    if (beat % bassEvery === 0) {
      // Chromatic bass pattern: root → root+1 (chromatic) → fifth → minor 3rd
      const bassPattern = [bassRoot, bassRoot + 1, bassRoot + 7, bassRoot + 3];
      const bassNote = bassPattern[barBeat % bassPattern.length];
      const vel = barBeat === 0
        ? Math.floor(90 + presence[1] * 27)
        : Math.floor(72 + presence[1] * 22);
      const gate = presence[1] > 0.7 ? 0.85 : 0.6;
      setTimeout(() => {
        if (!composer2Active) return;
        sendMIDINote(3, bassNote, vel, beatMs * gate);
        addMidiNote(3, bassNote / 127, vel / 127);
      }, Math.max(0, swing));
    }
  }

  // CH2 DRONE — bordone ogni 16 beat, root + fifth
  if (beat % 16 === 0 && phaseName !== 'rottura') {
    const vel = Math.floor(28 + arcProgress * 22);
    sendMIDINote(2, currentDrone, vel, beatMs * 13);
    sendMIDINote(2, currentDrone + 7, Math.round(vel * 0.6), beatMs * 13);
    addMidiNote(2, currentDrone / 127, vel / 127);
  }

  // CH7 RUPTURE — downbeat sparso in base allo stadio
  if (ruptureStage !== 'idle' && ruptureStage !== 'residuo') {
    const ruptureEvery = ruptureStage === 'presagio' ? 8 : 4;
    if (barBeat === 0 && bar % ruptureEvery === 0) {
      const scale = MODES2['Bb_locrian'];
      const note  = scale[Math.floor(Math.random() * scale.length)];
      const vel   = Math.floor(55 + rc * 55);
      sendMIDINote(7, note, vel, beatMs * 0.6);
      addMidiNote(7, note / 127, vel / 127);
    }
  }
}

// ── Emissione eventi semantici — solo sul fronte di salita ──
function emitLayerEvents() {
  const phaseName   = currentPhaseName();
  const silTarget   = CFG.COMPOSER2.silenceTarget[phaseName] || 0.4;
  const activeCount = presence.filter(p => p > 0.3).length;
  const voidRatio   = 1 - activeCount / 4;

  const tensionNow = activeCount >= 2 && arcProgress > 0.4;
  if (tensionNow && !_lastTensionActive) {
    emit('tension', { level: (activeCount - 1) / 3 * arcProgress });
  }
  _lastTensionActive = tensionNow;

  const voidNow = voidRatio > silTarget + 0.05;
  if (voidNow && !_lastVoidActive) {
    emit('void', { ratio: voidRatio });
  }
  _lastVoidActive = voidNow;

  const peakNow = activeCount === 4;
  if (peakNow && !_lastDensityPeak) {
    emit('density_peak', { level: arcProgress });
  }
  _lastDensityPeak = peakNow;
}

// ── State injection ──
function injectState() {
  const pm = getPresenceMultiplier('meccanica');
  const activeCount = presence.filter(p => p > 0.3).length;
  state.intensity    = Math.min(1, 0.2 + arcProgress * 0.5 + activeCount * 0.1) * pm;
  state.rhythmicity  = Math.min(1, presence[1] * 0.8 + presence[2] * 0.2) * pm;
  state.trajectory   = arcProgress > 0.7 ? -1 : arcProgress > 0.3 ? 0 : 1;
}

// ═══════════════════════════════════════════════════════════
//  MAIN UPDATE
// ═══════════════════════════════════════════════════════════

export function updateComposer2(dt) {
  // Fase formale
  updatePhase(dt);

  // Oscillatori layer
  updateLayers(dt);

  // VoidManager
  updatePresence(dt);

  // Rupture
  updateRupture();

  // Crossing-triggered notes (ogni frame — CH4 chords, CH1 grain)
  checkLayerCrossings();

  // Beat clock
  const bpm = CFG.COMPOSER2.bpm;
  const beatsPerSec = bpm / 60;
  clock += dt * beatsPerSec;
  const currentBeat = Math.floor(clock);
  if (currentBeat > lastBeat) {
    lastBeat = currentBeat;
    onBeat(currentBeat);
  }

  // Eventi semantici (ogni frame)
  emitLayerEvents();

  // State injection
  injectState();

  // Debug console ogni 10s
  debugTimer += dt;
  if (debugTimer >= 10) {
    debugTimer = 0;
    const activeCount = presence.filter(p => p > 0.3).length;
    console.log(
      `[COMPOSER2] ${currentPhaseName()} | ` +
      `layers: H${presence[0].toFixed(1)} R${presence[1].toFixed(1)} ` +
      `T${presence[2].toFixed(1)} M${presence[3].toFixed(1)} ` +
      `| rupture: ${ruptureStage} | active: ${activeCount}/4`
    );
  }
}

// ── Export status per HUD ──
export function getComposer2Status() {
  const activeCount = presence.filter(p => p > 0.3).length;
  return {
    active: composer2Active,
    phase: currentPhaseName(),
    activeCount,
    ruptureStage,
  };
}
