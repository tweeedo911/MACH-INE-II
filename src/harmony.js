// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Harmony Module
//  CH2 Drone + CH4 Chords
//  Reads worldState. Writes worldState.currentChord (only exception).
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { worldState } from './world-state.js';
import { sendMIDINote, sendMIDIPitchBend } from './midi.js';
import { addMidiNote } from './field.js';
import { TRACKS } from './tracks.js';
import { advanceCanonVoice } from './encore-canon.js';
import { ease, progressionArc, phaseGhostScale } from './composition-toolkit.js';

// ── Channel assignments ──
const CH_DRONE  = 2;  // CH2 = DRONE (sustained harmonic root)
const CH_CHORDS = 4;  // CH4 = CHORDS (harmonic layer)

// ── Bars-per-chord per phase ──
const BARS_PER_CHORD = {
  germoglio:    8,
  dissoluzione: 8,
  rottura:      2,
  // default (pulsazione, densita): 4
};
const BARS_PER_CHORD_DEFAULT = 4;

// Harmony reads the master clock from worldState.globalTick (written by rhythm.js).
// _step / _bar are local mirrors derived per-tick — kept for readability inside _tick().
let _step = 0;
let _bar = 0;
let _lastTick = -1;
let _chordIdx = -1;    // starts at -1 so first increment lands on index 0
let _lastDroneNote = -1;
let _lastDroneBar  = -1;
let _lastChordBar  = -1;

// V3: pitch drift state — slow LFO over CH2 drone (Sakamoto §A.5)
// V3.5: period and amplitude now per-track via droneDrift in tracks.js
let _pitchDriftStep = 0;
const PITCH_DRIFT_PERIOD_DEFAULT = 24;   // bar
const PITCH_DRIFT_AMP_DEFAULT    = 614;  // ±15 cents
const PITCH_BEND_CENTER          = 8192;
let _lastPitchBend = -1;

export function initHarmony() {
  _step = 0;
  _bar = 0;
  _lastTick = worldState.globalTick;  // sync to current master clock — no catch-up burst
  _chordIdx = -1;
  _lastDroneNote = -1;
  _lastDroneBar  = -1;
  _lastChordBar  = -1;
  _pitchDriftStep = 0;
  // Reset pitch bend to center on init (avoid stale bend from previous track)
  if (CFG.MUSIC_STRUCTURAL) {
    sendMIDIPitchBend(CH_DRONE, PITCH_BEND_CENTER);
    _lastPitchBend = PITCH_BEND_CENTER;
  }
  console.log('[HARMONY] Initialized');
}

export function updateHarmony(dt) {
  if (worldState.density.harmony < 0.01) return;

  // Catch up to master clock — typically advances 0 or 1 tick per frame.
  while (_lastTick < worldState.globalTick) {
    _lastTick++;
    if (worldState.encoreMode) {
      // V2: chord is 1× speed, standard 16-step cycle
      _step = _lastTick % 16;
      _bar  = Math.floor(_lastTick / 16);
    } else {
      _step = _lastTick % 16;
      _bar  = Math.floor(_lastTick / 16);
    }
    _tick();
  }
}

function _tick() {
  const bpm      = worldState.bpm || 60;
  const beatMs   = (60 / bpm) * 1000;               // ms per quarter note
  const density  = worldState.density.harmony;       // 0–1
  const phase    = worldState.phase;
  // rootOffset è già applicato in worldState.root da director3.reapplyRootOffset()
  const root     = worldState.root;
  const [regLo, regHi] = worldState.register.chords; // e.g. [55, 72]
  const trackData = TRACKS[worldState.track];

  // ── Velocity ceiling guard ──
  const velCeil  = worldState.velocityCeiling.harmony || 127;

  // ── ENCORE V2: chord reads from canon voice ──
  if (worldState.encoreMode) {
    const canon = worldState.encoreCanon;
    // Chord voice must be active (brick >= 6)
    if (!canon.chord.active) {
      // Before chord enters, just maintain drone if density allows
      if (_step === 0 && _bar % 4 === 0 && density >= 0.08 && worldState.encoreBrick >= 6) {
        const droneVel = Math.min(Math.round(25 + density * 20), velCeil);
        sendMIDINote(CH_DRONE, root, droneVel, Math.round(beatMs * 15));
        addMidiNote(CH_DRONE, root / 127, droneVel / 127);
      }
      return;
    }

    // V2.2: chord lento — 1 hit ogni 2 bar (step 0 su bar pari), voicing APERTO
    // Voicing aperto (root + 10a + 12a) evita cluster ottatonici → suona tonale
    if (_step === 0 && _bar % 2 === 0) {
      const note = advanceCanonVoice('chord');
      if (note > 0 && note >= regLo && note <= regHi) {
        const scale = worldState.scale || [];
        // Root al registro chord, 10a (3a + ottava), 12a (5a + ottava)
        // Gradi dalla scala ma separati da almeno un'ottava → voicing aperto, respira
        const root = note;
        // Trova 3a (2 gradi sopra root nella scala)
        const rootIdx = scale.indexOf(root);
        let third, fifth;
        if (rootIdx >= 0) {
          third = scale[rootIdx + 2] !== undefined ? scale[rootIdx + 2] + 12 : root + 16;  // +10a
          fifth = scale[rootIdx + 4] !== undefined ? scale[rootIdx + 4] + 12 : root + 19;  // +12a
        } else {
          third = root + 16;  // fallback: 10a maggiore
          fifth = root + 19;  // fallback: 12a
        }
        // Clamp nel registro, scarta note fuori scala
        const voicing = [root];
        if (third <= regHi) voicing.push(third);
        if (fifth <= regHi) voicing.push(fifth);

        const chordVel = Math.min(Math.round(70 + density * 25), velCeil);
        const chordDur = Math.round(beatMs * 6);  // sustain lungo (~6 battiti = 1.5 bar)
        for (const n of voicing) {
          if (n >= regLo && n <= regHi) {
            sendMIDINote(CH_CHORDS, n, chordVel, chordDur);
            addMidiNote(CH_CHORDS, n / 127, chordVel / 127);
          }
        }
        worldState.currentChord = voicing;
      }
    }

    // Drone: hold root, refresh every 4 bars
    if (_step === 0 && _bar % 4 === 0 && density >= 0.05) {
      const droneVel = Math.min(Math.round(20 + density * 25), velCeil);
      sendMIDINote(CH_DRONE, root, droneVel, Math.round(beatMs * 16));
      addMidiNote(CH_DRONE, root / 127, droneVel / 127);
    }

    return;
  }

  // ──────────────────────────────────────────────
  //  V3: CH2 drone pitch drift (Sakamoto §A.5)
  //  Slow sin LFO ±15 cents, period 24 bars (~60s @ 96 BPM).
  //  Sent every quarter note to keep bandwidth low (~6Hz at 96 BPM).
  // ──────────────────────────────────────────────
  if (CFG.MUSIC_STRUCTURAL && _step % 4 === 0) {
    const drift = trackData?.droneDrift;
    const driftPeriod = drift?.periodBars ?? PITCH_DRIFT_PERIOD_DEFAULT;
    let driftAmp      = drift?.amplitude  ?? PITCH_DRIFT_AMP_DEFAULT;
    // Rupture cablata: in takeover il drone diventa instabile (Kali Malone micro-intonazione)
    if (worldState?.rupture?.stage === 'takeover') driftAmp *= 2.5;
    const periodSteps = driftPeriod * 16;
    _pitchDriftStep = (_pitchDriftStep + 4) % periodSteps;
    const phaseRad = (_pitchDriftStep / periodSteps) * Math.PI * 2;
    const bendValue = PITCH_BEND_CENTER + Math.round(Math.sin(phaseRad) * driftAmp);
    if (bendValue !== _lastPitchBend) {
      sendMIDIPitchBend(CH_DRONE, bendValue);
      _lastPitchBend = bendValue;
    }
  }

  // ──────────────────────────────────────────────
  //  CH2 DRONE — every 4 bars, on step 0
  //  Density gate: sotto 0.08 il drone tace (fade dissoluzione)
  // ──────────────────────────────────────────────
  if (_step === 0 && _bar % 4 === 0 && _bar !== _lastDroneBar && density >= 0.08) {
    _lastDroneBar = _bar;

    const droneVel  = Math.min(Math.round(35 + density * 25), velCeil);
    const droneDur  = Math.round(beatMs * 15);  // ~4 bars (16 beats × 0.9375)

    sendMIDINote(CH_DRONE, root, droneVel, droneDur);
    addMidiNote(CH_DRONE, root / 127, droneVel / 127);
    _lastDroneNote = root;

    // Octave doubling when density is high and note fits register
    const rootOct = root + 12;
    if (density > 0.3 && rootOct <= regHi) {
      const octVel = Math.min(Math.round(droneVel * 0.6), velCeil);
      sendMIDINote(CH_DRONE, rootOct, octVel, droneDur);
      addMidiNote(CH_DRONE, rootOct / 127, octVel / 127);
    }

    // ── Wave 2C: Sub drone tattile <40Hz ──
    // Solo se track.subDroneTactile === true. Parallelo al drone: ottava -2, vel 20-30.
    // MIDI note 24 (C1, ~32Hz). Non serve gate in register: è opt-in per track.
    if (trackData?.subDroneTactile) {
      const subNote = root - 24;
      if (subNote >= 12) {  // safety: evita note < C0
        const subVel = Math.min(Math.round(20 + density * 10), velCeil);
        sendMIDINote(CH_DRONE, subNote, subVel, droneDur);
        addMidiNote(CH_DRONE, subNote / 127, subVel / 127);
      }
    }
  }

  // ──────────────────────────────────────────────
  //  CH4 CHORDS — sustained or rhythmic (chordGrid)
  // ──────────────────────────────────────────────
  if (!trackData || !trackData.chords || trackData.chords.length === 0) return;

  // V3.5: track can override barsPerChord (e.g. SOLCO wants 4-bar cycle always)
  const barsPerChord = trackData.barsPerChord?.[phase]
    ?? BARS_PER_CHORD[phase]
    ?? BARS_PER_CHORD_DEFAULT;
  const chordGrid = trackData.chordGrid || null;

  // Advance chord on bar boundary
  if (_step === 0 && _bar % barsPerChord === 0 && _bar !== _lastChordBar) {
    _lastChordBar = _bar;
    _chordIdx = (_chordIdx + 1) % trackData.chords.length;
  }

  const rawChord = trackData.chords[_chordIdx];
  let chord = rawChord.map(n => {
    while (n < regLo) n += 12;
    while (n > regHi) n -= 12;
    return n;
  });

  // V3: Degradation — strip chord notes (4 → 3 → 2 → root only) in dissoluzione final
  const chordLimit = worldState.degradation?.chordNoteCount ?? 99;
  if (chordLimit < chord.length) {
    // Keep root + lowest notes (drop the top, "the chord crumbles inward")
    chord = chord.slice(0, chordLimit);
  }

  // ── V3.5: Ponte modale — nelle ultime 4 bar della dissoluzione,
  // filtra le note dell'accordo tenendo solo quelle comuni alla scala entrante.
  // Se il filtro elimina tutto, mantiene la nota più grave (root) come ancoraggio.
  const tr = worldState.transition;
  if (tr && tr.nextTrack && tr.nextTrack.scale) {
    const nextPCs = new Set(tr.nextTrack.scale.map(n => n % 12));
    const filtered = chord.filter(n => nextPCs.has(n % 12));
    chord = filtered.length > 0 ? filtered : [chord[0]];
  }

  // ── Modal characteristic note boost (salvato da harmony-layer.js) ──
  // Estrae il modo dal track scale (es. SCALES.G_dorian → 'dorian'),
  // calcola l'intervallo distintivo del modo, e dà un velocity boost
  // alle note di accordo che cadono su quell'intervallo.
  const charBoost = _modeCharacteristicBoost(root);

  // Density gate per accordi: sotto 0.08 tacciono (fade dissoluzione)
  if (density < 0.08) {
    // Aggiorna currentChord per il ponte modale anche senza suonare
    if (_step === 0 && _bar === _lastChordBar) worldState.currentChord = [...chord];
    return;
  }

  if (chordGrid) {
    // ── Rhythmic chords: staccato hits on grid pattern ──
    // V3.11: ghost hit — probabilità di suonare l'accordo piano su step vuoti adiacenti
    // v3.19 Wave 1D: ghost phase-aware. Germoglio 0 (chord da solo, niente ghost),
    // densità ×1.5 (groove pieno), dissoluzione 0.3 (si sfilaccia). Stesso pattern bass-v3.
    const baseGhostProb = trackData?.chordGridGhostProb ?? 0;
    const ghostProb = baseGhostProb * phaseGhostScale(phase);
    const isGhost = !chordGrid[_step] && ghostProb > 0 && Math.random() < ghostProb;

    if (chordGrid[_step] || isGhost) {
      const stepMs = (60 / bpm / 4) * 1000;
      const chordDur = Math.round(stepMs * (isGhost ? 1.5 : 2.5));  // ghost più corto
      // v3.19 Wave 1B/C: progression arc (4/8-chord cycle) + curva di traccia su density.
      // L'accordo non è più piatto: il ciclo armonico ha arco dinamico (II=peak, IV=ans).
      const arcMul = isGhost ? 1.0 : progressionArc(_chordIdx, trackData.chords.length);
      const curveTypeC = trackData?.velocityCurve ?? 'easeInOut';
      const shapedDensityC = ease(density, curveTypeC);
      const baseVel = Math.round(((isGhost ? 22 : 40) + shapedDensityC * (isGhost ? 15 : 35)) * arcMul);

      chord.forEach(note => {
        const humanize = Math.round((Math.random() * 6) - 3);
        const boost = (!isGhost && charBoost && (note % 12) === charBoost.pitchClass) ? charBoost.amount : 0;
        const vel = Math.min(Math.max(baseVel + humanize + boost, 1), velCeil);
        sendMIDINote(CH_CHORDS, note, vel, chordDur);
        addMidiNote(CH_CHORDS, note / 127, vel / 127);
      });

      worldState.currentChord = [...chord];
    }
  } else {
    // ── Sustained chords: one hit per chord change ──
    if (_step === 0 && _bar === _lastChordBar) {
      const overlapMs = trackData?.chordOverlapMs ?? 500;  // V3.5: per-track overlap (Burial warmth)
      const chordDur = Math.round(beatMs * 4 * barsPerChord + overlapMs);
      // v3.19 Wave 1B/C: arc del ciclo armonico + curva di traccia.
      const arcMulS = progressionArc(_chordIdx, trackData.chords.length);
      const curveTypeS = trackData?.velocityCurve ?? 'easeInOut';
      const shapedDensityS = ease(density, curveTypeS);
      const baseVel = Math.round((35 + shapedDensityS * 30) * arcMulS);

      chord.forEach(note => {
        const humanize = Math.round((Math.random() * 6) - 3);
        const boost = (charBoost && (note % 12) === charBoost.pitchClass) ? charBoost.amount : 0;
        const vel = Math.min(Math.max(baseVel + humanize + boost, 1), velCeil);
        sendMIDINote(CH_CHORDS, note, vel, chordDur);
        addMidiNote(CH_CHORDS, note / 127, vel / 127);
      });

      worldState.currentChord = [...chord];
    }
  }
}

// ── Modal characteristic note boost helper (salvato da harmony-layer.js) ──
// Returns { pitchClass, amount } or null if no boost applies for current track.
// Reads worldState.track + TRACKS[track].scale name to extract mode.
function _modeCharacteristicBoost(root) {
  const trackData = TRACKS[worldState.track];
  if (!trackData) return null;
  // Track scales are referenced as SCALES.G_dorian — extract scale key from track def
  // We need the scale's KEY name, not the array. Best heuristic: scan SCALES export.
  // Simpler: store mode hint on track if available; fallback to scale-array fingerprint.
  const modeHint = trackData.modeHint;  // optional explicit hint
  if (!modeHint) return null;
  const interval = CFG.modeCharacteristicInterval?.[modeHint];
  if (interval === undefined) return null;
  return {
    pitchClass: (root + interval) % 12,
    amount:     CFG.characteristicVelBoost || 15,
  };
}
