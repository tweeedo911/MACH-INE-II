// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Performance Sequencer
//  Autopilot: 6 engine in ~40 minuti con transizioni-mutazione
// ═══════════════════════════════════════════════════════════

import { executeMutation } from './director.js';
import { startInvertDissolve, setChromaticShift } from './colors.js';

// ── Sequence definition (dramaturgical order) ──
// Each entry: [engineKey, durationSec]
const SEQUENCE = [
  ['deriva',     5 * 60],   //  5 min — apertura beatless
  ['cristallo',  6 * 60],   //  6 min — contemplazione glaciale
  ['abisso',     7 * 60],   //  7 min — rituale profondo
  ['terreno',    7 * 60],   //  7 min — primo groove
  ['meccanica',  8 * 60],   //  8 min — techno strutturato
  ['vortice',    7 * 60],   //  7 min — climax tribale
];

// ── Transition: mutation storm between engines ──
// Duration of the inter-engine mutation passage (seconds)
const TRANSITION_DURATION = 6;
// Mutation bursts during transition
const TRANSITION_MUTATIONS = 4;

// ── State ──
let active = false;
let stepIndex = -1;
let stepElapsed = 0;
let transitioning = false;
let transitionElapsed = 0;
let transitionMutationsFired = 0;
let globalTime = 0;

// Callbacks set by main.js
let _activateEngine = null;   // (engineKey) => void
let _deactivateAll = null;    // () => void

export function initSequencer(activateEngine, deactivateAll) {
  _activateEngine = activateEngine;
  _deactivateAll = deactivateAll;
}

export function toggleSequencer() {
  if (active) {
    stopSequencer();
  } else {
    startSequencer();
  }
}

export function isSequencerActive() {
  return active;
}

export function getSequencerStatus() {
  if (!active) return { active: false };
  const entry = SEQUENCE[stepIndex];
  return {
    active: true,
    engine: entry ? entry[0].toUpperCase() : 'TRANSITION',
    step: stepIndex + 1,
    total: SEQUENCE.length,
    elapsed: Math.floor(stepElapsed),
    duration: entry ? entry[1] : 0,
    transitioning,
    progress: entry ? stepElapsed / entry[1] : 0,
  };
}

function startSequencer() {
  active = true;
  stepIndex = -1;
  stepElapsed = 0;
  transitioning = false;
  transitionElapsed = 0;
  // Start first transition immediately
  advanceToNext();
  console.log('[SEQUENCER] START — 40min autopilot');
}

function stopSequencer() {
  active = false;
  transitioning = false;
  stepIndex = -1;
  console.log('[SEQUENCER] STOP');
}

export function skipToNext() {
  if (!active) return;
  // Jump to transition phase immediately
  if (!transitioning) {
    beginTransition();
  }
}

function advanceToNext() {
  stepIndex++;
  if (stepIndex >= SEQUENCE.length) {
    // Performance complete — stop
    if (_deactivateAll) _deactivateAll();
    stopSequencer();
    console.log('[SEQUENCER] PERFORMANCE COMPLETE');
    return;
  }

  stepElapsed = 0;
  transitioning = false;

  const [engineKey] = SEQUENCE[stepIndex];
  if (_activateEngine) _activateEngine(engineKey);
  console.log(`[SEQUENCER] → ${engineKey.toUpperCase()} (${stepIndex + 1}/${SEQUENCE.length})`);
}

function beginTransition() {
  transitioning = true;
  transitionElapsed = 0;
  transitionMutationsFired = 0;

  // Kill current engine audio
  if (_deactivateAll) _deactivateAll();

  // Visual storm: invert dissolve + chromatic shift
  startInvertDissolve();
  setChromaticShift('shift');
}

export function updateSequencer(dt, gTime) {
  if (!active) return;
  globalTime = gTime;

  if (transitioning) {
    transitionElapsed += dt;

    // Fire mutation bursts evenly across transition
    const mutationInterval = TRANSITION_DURATION / TRANSITION_MUTATIONS;
    const expectedFired = Math.floor(transitionElapsed / mutationInterval);
    while (transitionMutationsFired < expectedFired && transitionMutationsFired < TRANSITION_MUTATIONS) {
      executeMutation(null, globalTime);
      transitionMutationsFired++;
    }

    // Transition complete → advance
    if (transitionElapsed >= TRANSITION_DURATION) {
      advanceToNext();
    }
    return;
  }

  // Normal playback — count time in current engine
  stepElapsed += dt;
  const [, duration] = SEQUENCE[stepIndex];

  if (stepElapsed >= duration) {
    beginTransition();
  }
}
