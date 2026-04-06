// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Rhythm Module
//  CH0 Kick + CH1 Perc Kit
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';
import { TRACKS } from './tracks.js';

// ── Channels ──
const CH_KICK = 0;
const CH_PERC = 1;

// ── Drum map (GM-adjacent, mapped to our perc kit) ──
const HAT_CLOSED  = 36;
const SNARE       = 38;
// const CLAP     = 39;  // reserved
const HAT_OPEN    = 42;
// const CONGA_HI = 45;  // reserved
const HAT_PEDAL   = 46;
// const CONGA_LO = 48;  // reserved
// const CRASH    = 49;  // reserved
// const RIDE     = 51;  // reserved
// const COWBELL  = 56;  // reserved
const CONGA_LO    = 48;

// ── Hat patterns per phase (16 steps) ──
const HAT_PATTERNS = {
  germoglio:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],  // silence
  pulsazione:   [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0],  // sparse — 3 hits
  densita:      [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],  // 8th notes
  rottura:      [1,1,1,0, 1,1,1,0, 1,1,1,0, 1,1,1,0],  // dense — 12 hits
  dissoluzione: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],  // dying — 2 hits
};

// ── Snare probability and variation ──
const SNARE_BASE_STEPS = [4, 12];  // standard backbeat positions
const SNARE_SHIFT_PROB = 0.25;     // 25% chance to shift snare ±1 step
const SNARE_SKIP_PROB = 0.15;      // 15% chance to skip a snare hit entirely
const SNARE_FLAM_PROB = 0.10;      // 10% chance of ghost flam 1 step before

let _step = 0;        // 0–15 (16th note position in bar)
let _stepAcc = 0;     // accumulator for step timing
let _bar = 0;         // bar counter

export function initRhythm() {
  _step = 0;
  _stepAcc = 0;
  _bar = 0;
  console.log('[RHYTHM] Initialized');
}

export function updateRhythm(dt) {
  if (!worldState.bpm || worldState.density.rhythm < 0.01) return;

  const stepDur = 60 / worldState.bpm / 4; // duration of 1 sixteenth note in seconds
  _stepAcc += dt;

  while (_stepAcc >= stepDur) {
    _stepAcc -= stepDur;
    _tick();
    _step = (_step + 1) % 16;
    if (_step === 0) _bar++;
  }
}

function _tick() {
  const phase    = worldState.phase    || 'germoglio';
  const density  = worldState.density.rhythm;
  const ceiling  = worldState.velocityCeiling.rhythm;
  const grid     = worldState.rhythmGrid;

  // Resolve kick note from current track definition; fallback to SOLCO
  const trackDef = TRACKS[worldState.track] || TRACKS.SOLCO;
  const kickNote = trackDef.kickNote;

  // ── CH0 KICK ──
  const hasKick = grid && grid[_step] === 1;
  if (hasKick) {
    const rawVel = 80 + density * 30 + (Math.random() * 8 - 4);  // ±4 humanize
    const vel    = Math.min(Math.round(rawVel), ceiling);
    const stepMs = (60 / worldState.bpm / 4) * 1000;
    sendMIDINote(CH_KICK, kickNote, vel, stepMs * 0.9);
    addMidiNote(CH_KICK, kickNote / 127, vel / 127);
  }

  // ── CH1 HAT ──
  const hatPat = HAT_PATTERNS[phase] || HAT_PATTERNS.germoglio;
  const hasHat = hatPat[_step] === 1;
  let hatSent   = false;

  if (hasHat) {
    // Open hat on the "and" of beat 3 (step 12 mod 8 === 4) except in pulsazione
    const useOpen = (_step % 8 === 4) && phase !== 'pulsazione';
    const hatNote = useOpen ? HAT_OPEN : HAT_CLOSED;
    const rawVel  = 40 + density * 40 + (Math.random() * 12 - 6);  // ±6 humanize
    const vel     = Math.min(Math.round(rawVel), Math.round(ceiling * 0.7));
    const stepMs  = (60 / worldState.bpm / 4) * 1000;
    sendMIDINote(CH_PERC, hatNote, vel, stepMs * 0.85);
    addMidiNote(CH_PERC, hatNote / 127, vel / 127);
    hatSent = true;
  }

  // ── CH1 SNARE — variable backbeat ──
  const snarePhase = phase === 'densita' || phase === 'rottura';
  if (snarePhase && density > 0.5) {
    const stepMs = (60 / worldState.bpm / 4) * 1000;

    for (const baseStep of SNARE_BASE_STEPS) {
      // Determine actual step for this hit (may shift ±1)
      let actualStep = baseStep;
      if (Math.random() < SNARE_SHIFT_PROB) {
        actualStep = baseStep + (Math.random() < 0.5 ? -1 : 1);
        if (actualStep < 0) actualStep = 0;
        if (actualStep > 15) actualStep = 15;
      }

      if (_step === actualStep) {
        // Skip this hit entirely sometimes
        if (Math.random() < SNARE_SKIP_PROB) break;

        const rawVel = 50 + density * 35 + (Math.random() * 10 - 5);
        const vel    = Math.min(Math.round(rawVel), ceiling);
        sendMIDINote(CH_PERC, SNARE, vel, stepMs * 0.9);
        addMidiNote(CH_PERC, SNARE / 127, vel / 127);
      }

      // Ghost flam: soft hit 1 step before the snare
      if (_step === actualStep - 1 && Math.random() < SNARE_FLAM_PROB) {
        const flamVel = Math.round(22 + Math.random() * 10);
        sendMIDINote(CH_PERC, SNARE, flamVel, stepMs * 0.4);
        addMidiNote(CH_PERC, SNARE / 127, flamVel / 127);
      }
    }
  }

  // ── CH1 GHOST ──
  // On empty steps (no kick, no hat), density > 0.6, 15% × density probability
  if (!hasKick && !hatSent && density > 0.6) {
    if (Math.random() < 0.15 * density) {
      const ghostNote = Math.random() < 0.5 ? HAT_PEDAL : CONGA_LO;
      const vel       = Math.round(20 + Math.random() * 15);  // 20–35, no ceiling clamp
      const stepMs    = (60 / worldState.bpm / 4) * 1000;
      sendMIDINote(CH_PERC, ghostNote, vel, stepMs * 0.6);
      addMidiNote(CH_PERC, ghostNote / 127, vel / 127);
    }
  }
}
