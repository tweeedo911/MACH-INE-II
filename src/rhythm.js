// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Rhythm Module
//  CH0 Kick + CH1 Perc Kit
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';
import { TRACKS } from './tracks.js';

// V3: helper — return random late delay in ms based on current degradation jitter.
// Returns 0 (immediate) when degradation is inactive.
function _jitterMs() {
  const sigma = worldState.degradation?.timingJitterMs ?? 0;
  if (sigma <= 0) return 0;
  // Always late (Gaussian-ish: half-normal, |randn| × sigma)
  const u1 = Math.random();
  const u2 = Math.random();
  const randn = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.abs(randn) * sigma;
}

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

// Rhythm is the MASTER CLOCK. It owns the only `_stepAcc` accumulator and writes
// `worldState.globalStep / globalBar / globalTick` once per 16th note tick. All
// other musical modules (harmony, bass, melody) read from globalTick — this
// prevents drift when M/N toggles or director scrubs phases.
let _step = 0;        // mirror of worldState.globalStep, used by _tick()
let _stepAcc = 0;     // accumulator for step timing (master)
let _bar = 0;         // mirror of worldState.globalBar

export function initRhythm(seamless = false) {
  _step = 0;
  if (seamless) {
    // DJ crossfade: nessun grace, il kick deve partire al primo frame
    _stepAcc = 0;
  } else {
    // Mezzo step di grazia: previene blip ritmico al cambio traccia.
    // Senza questo, il primo dt dopo il reset supera subito stepDur=0 e spara un colpo extra.
    const graceBpm = worldState.bpm || 60;
    _stepAcc = (60 / graceBpm / 4) * 0.5;
  }
  _bar = 0;
  // Reset master clock — sentinels so first advance lands on tick=0/step=0/bar=0
  worldState.globalStep = -1;
  worldState.globalBar  = 0;
  worldState.globalTick = -1;
  console.log(`[RHYTHM] Initialized (master clock reset${seamless ? ', seamless' : ''})`);
}

export function updateRhythm(dt) {
  // Use track BPM if set, else 60 BPM fallback so harmony drones still advance
  // logically in ambient tracks (where bpm is null and no kick/hat fires).
  const bpm = worldState.bpm || 60;
  const stepDur = 60 / bpm / 4;
  _stepAcc += dt;

  while (_stepAcc >= stepDur) {
    _stepAcc -= stepDur;
    // Advance master clock — consumers (harmony, bass, melody) will catch up via _lastTick
    worldState.globalTick++;
    worldState.globalStep = worldState.globalTick % 16;
    worldState.globalBar  = Math.floor(worldState.globalTick / 16);
    _step = worldState.globalStep;
    _bar  = worldState.globalBar;
    // Only emit rhythm hits if rhythm density meaningful AND a real BPM exists
    if (worldState.bpm && worldState.density.rhythm >= 0.01) _tick();
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
    // V3: degradation timing jitter (half-normal late delay)
    const jit = _jitterMs();
    if (jit > 0) {
      setTimeout(() => {
        sendMIDINote(CH_KICK, kickNote, vel, stepMs * 0.9);
        addMidiNote(CH_KICK, kickNote / 127, vel / 127);
      }, jit);
    } else {
      sendMIDINote(CH_KICK, kickNote, vel, stepMs * 0.9);
      addMidiNote(CH_KICK, kickNote / 127, vel / 127);
    }
  }

  // ── CH1 HAT ──
  // ENCORE: hat enters at brick 2 (+hat)
  let hatStep, hatPat;
  if (worldState.encoreMode && trackDef.encoreHatPattern && worldState.encoreBrick >= 3) {
    const hatCycle = worldState.encoreCycleLens.hat;  // 10
    hatStep = worldState.globalTick % hatCycle;
    hatPat = trackDef.encoreHatPattern;
  } else if (!worldState.encoreMode) {
    hatStep = _step;
    const customHat = trackDef.hatPatterns && trackDef.hatPatterns[phase];
    hatPat = customHat || HAT_PATTERNS[phase] || HAT_PATTERNS.germoglio;
  } else {
    // ENCORE brick < 2: no hat yet
    hatStep = 0;
    hatPat = null;
  }
  const hasHat = hatPat && hatPat[hatStep] === 1;
  let hatSent   = false;

  if (hasHat) {
    // Open hat: per-track steps (TEMPESTA: offbeat dance) o default (and di beat 3)
    const openHatSteps = trackDef.openHatSteps;
    const useOpen = worldState.encoreMode
      ? (trackDef.encoreOpenHatSteps || []).includes(hatStep)
      : (openHatSteps ? openHatSteps.includes(_step) : ((_step % 8 === 4) && phase !== 'pulsazione'));
    const hatNote = useOpen ? HAT_OPEN : HAT_CLOSED;
    const rawVel  = 40 + density * 40 + (Math.random() * 12 - 6);  // ±6 humanize
    const vel     = Math.min(Math.round(rawVel), Math.round(ceiling * 0.7));
    const stepMs  = (60 / worldState.bpm / 4) * 1000;
    sendMIDINote(CH_PERC, hatNote, vel, stepMs * 0.85);
    addMidiNote(CH_PERC, hatNote / 127, vel / 127);
    hatSent = true;
  }

  // ── CH1 SNARE — variable backbeat (V3.5: per-track config) ──
  const trackSnare = TRACKS[worldState.track]?.snare;
  const snareEnabled = trackSnare?.enabled !== undefined ? trackSnare.enabled : true;
  // ENCORE: snare fires from brick 6 (+snare), bypassing phase check
  const snarePhase = worldState.encoreMode
    ? (worldState.encoreBrick >= 6)
    : (phase === 'densita' || phase === 'rottura');
  if (snareEnabled && snarePhase && density > 0.5) {
    const stepMs = (60 / worldState.bpm / 4) * 1000;
    const snareSteps = trackSnare?.steps ?? SNARE_BASE_STEPS;

    // Per-track snare stability: shift/skip/flam disabilitabili
    const allowShift = trackSnare?.shift !== false;
    const allowSkip  = trackSnare?.skip  !== false;
    const allowFlam  = trackSnare?.flam  !== false;

    for (const baseStep of snareSteps) {
      // Determine actual step for this hit (may shift ±1)
      let actualStep = baseStep;
      if (allowShift && Math.random() < SNARE_SHIFT_PROB) {
        actualStep = baseStep + (Math.random() < 0.5 ? -1 : 1);
        if (actualStep < 0) actualStep = 0;
        if (actualStep > 15) actualStep = 15;
      }

      if (_step === actualStep) {
        // Skip this hit entirely sometimes
        if (allowSkip && Math.random() < SNARE_SKIP_PROB) break;

        const rawVel = 50 + density * 35 + (Math.random() * 10 - 5);
        const vel    = Math.min(Math.round(rawVel), ceiling);
        sendMIDINote(CH_PERC, SNARE, vel, stepMs * 0.9);
        addMidiNote(CH_PERC, SNARE / 127, vel / 127);
      }

      // Ghost flam: soft hit 1 step before the snare
      if (allowFlam && _step === actualStep - 1 && Math.random() < SNARE_FLAM_PROB) {
        const flamVel = Math.round(22 + Math.random() * 10);
        sendMIDINote(CH_PERC, SNARE, flamVel, stepMs * 0.4);
        addMidiNote(CH_PERC, SNARE / 127, flamVel / 127);
      }
    }
  }

  // ── Conga pattern (per-track, TEMPESTA) ──
  let congaStep, congaPat2;
  // ENCORE: conga enters at plateau (brick >= 8)
  if (worldState.encoreMode && trackDef.encoreCongaPattern && worldState.encoreBrick >= 8) {
    congaStep = worldState.globalTick % trackDef.encoreCongaPattern.length;
    congaPat2 = trackDef.encoreCongaPattern;
  } else {
    congaStep = _step;
    congaPat2 = trackDef.congaPattern && trackDef.congaPattern[phase];
  }
  if (congaPat2 && congaPat2[congaStep] === 1 && density > 0.3) {
    const stepMs  = (60 / worldState.bpm / 4) * 1000;
    const rawVel  = 35 + density * 30 + (Math.random() * 8 - 4);
    const vel     = Math.min(Math.round(rawVel), Math.round(ceiling * 0.6));
    sendMIDINote(CH_PERC, CONGA_LO, vel, stepMs * 0.7);
    addMidiNote(CH_PERC, CONGA_LO / 127, vel / 127);
  }

  // ── V3 STRUCTURAL: Floor-kick offset (CH1 pad 41) + Burial timing scatter ──
  // Light call-response with main kick. Pad 41 (low floor tom GM) — performer
  // routes to second kick / sub / floor tom. Active only in dense phases, only
  // on upbeat ghost positions (step 7 = "and of 2", step 15 = "and of 4"),
  // only when main kick is silent there. Probability 30%, velocity 75% of ceiling.
  // Burial-style timing scatter: always late 15-45ms, pulsazione "slurred" fuori pocket.
  // Skip floor-kick scatter su biomi con griglia solida (TEMPESTA = picco dance)
  const allowFloorScatter = worldState.track !== 'TEMPESTA';
  if (allowFloorScatter && CFG.MUSIC_STRUCTURAL && (phase === 'densita' || phase === 'rottura')) {
    const isUpbeatGhost = (_step === 7 || _step === 15);
    if (isUpbeatGhost && !hasKick && Math.random() < 0.30) {
      const stepMs   = (60 / worldState.bpm / 4) * 1000;
      const rawVel   = 45 + density * 18 + (Math.random() * 6 - 3);
      const floorVel = Math.min(Math.round(rawVel), Math.round(ceiling * 0.75));
      const scatterMs = 15 + Math.random() * 30;  // always late, 15-45ms
      setTimeout(() => {
        sendMIDINote(CH_PERC, 41, floorVel, stepMs * 0.85);
        addMidiNote(CH_PERC, 41 / 127, floorVel / 127);
      }, scatterMs);
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
