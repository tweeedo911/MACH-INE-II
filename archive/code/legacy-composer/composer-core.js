import { COMPOSER_CFG } from './composer-config.js';

export function createComposerState(overrides = {}) {
  return {
    phase: 'INTRO',
    phaseTimeSec: 0,
    totalTimeSec: 0,
    barsElapsed: 0,
    densityBudget: COMPOSER_CFG.global.densityBudget,
    silenceBudget: COMPOSER_CFG.global.silenceBudget,
    harmonicStability: COMPOSER_CFG.global.harmonicStability,
    dissonanceBudget: COMPOSER_CFG.global.dissonanceBudget,
    tension: 0,
    memorySeed: createInitialMemorySeed(),
    restartIndex: 0,
    ruptureStage: 'OFF',
    rupturePresence: 0,
    corruptionAmount: 0,
    dominantLayer: 'drone',
    lastPeakTimeSec: null,
    postClimaxRecovery: 0,
    layerState: createLayerState(),
    ...overrides,
  };
}

function createInitialMemorySeed() {
  return {
    pitchClassAnchor: 'C#',
    intervalCell: ['m7', 'M2'],
    rhythmCell: [1, 0, 0, 1, 0],
    voicingShape: 'open_10th',
    contourType: 'rise_fall',
  };
}

function createLayerState() {
  return {
    kick: defaultLayerState('kick'),
    bass: defaultLayerState('bass'),
    harmony: defaultLayerState('harmony'),
    lead: defaultLayerState('lead'),
    drone: defaultLayerState('drone'),
    grain: defaultLayerState('grain'),
    rupture: defaultLayerState('rupture'),
  };
}

function defaultLayerState(name) {
  const cfg = COMPOSER_CFG.layerRules[name];
  return {
    name,
    enabled: cfg.activeIn.includes('INTRO'),
    currentDensity: 0,
    cycleIndex: 0,
    nextEventTimeSec: 0,
    localMemory: null,
    mutedUntilSec: 0,
    registerFocus: null,
    lastEvents: [],
  };
}

export function tickComposer(state, dtSec, analysis = {}) {
  state.totalTimeSec += dtSec;
  state.phaseTimeSec += dtSec;
  state.barsElapsed = secondsToBars(state.totalTimeSec, analysis.bpm || COMPOSER_CFG.global.bpmDefault);

  updatePhase(state, analysis);
  allocateDensityBudget(state);
  scheduleSilenceWindows(state);
  advanceRuptureStage(state);

  const events = [];
  events.push(...generateKick(state));
  events.push(...generateBassGravity(state));
  events.push(...generateChordVoicing(state));
  events.push(...generateLeadFragments(state));
  events.push(...generateDroneField(state));
  events.push(...generateGrainTexture(state));
  events.push(...generateRuptureEvents(state));

  const interlocked = applyInterlockPenalty(events, state);
  const corrupted = applyRuptureCorruption(interlocked, state);
  updateMemory(state, corrupted);
  return corrupted;
}

function secondsToBars(seconds, bpm) {
  return seconds / ((60 / bpm) * 4);
}

export function updatePhase(state, analysis = {}) {
  const p = state.phase;
  if (p === 'INTRO' && state.phaseTimeSec >= COMPOSER_CFG.phaseRules.INTRO.minDurationSec) {
    enterPhase(state, 'DEVELOP');
    return;
  }
  if (p === 'DEVELOP' && state.phaseTimeSec >= COMPOSER_CFG.phaseRules.DEVELOP.minDurationSec && state.tension >= 0.42) {
    enterPhase(state, 'TENSION');
    return;
  }
  if (p === 'TENSION' && state.ruptureStage === 'INFILTRATION' && state.tension >= 0.78) {
    enterPhase(state, 'CLIMAX');
    return;
  }
  if (p === 'CLIMAX' && state.phaseTimeSec >= COMPOSER_CFG.phaseRules.CLIMAX.minDurationSec && (analysis.intensity ?? 0) < 0.3) {
    enterPhase(state, 'RELEASE');
    state.lastPeakTimeSec = state.totalTimeSec;
    return;
  }
  if (p === 'RELEASE' && state.phaseTimeSec >= COMPOSER_CFG.phaseRules.RELEASE.minDurationSec && state.postClimaxRecovery >= 0.6) {
    restartFromMutatedMemory(state);
    enterPhase(state, 'DEVELOP');
  }
}

function enterPhase(state, phase) {
  state.phase = phase;
  state.phaseTimeSec = 0;
  const cfg = COMPOSER_CFG.phaseRules[phase];
  state.densityBudget = cfg.densityCap;
  state.silenceBudget = cfg.silenceBudget;
  state.dissonanceBudget = cfg.dissonanceBudget;
}

export function allocateDensityBudget(state) {
  const cap = COMPOSER_CFG.phaseRules[state.phase].densityCap;
  const weights = Object.entries(COMPOSER_CFG.layerRules)
    .filter(([name, cfg]) => cfg.activeIn.includes(state.phase))
    .map(([name, cfg]) => [name, cfg.densityWeight]);
  const totalWeight = weights.reduce((a, [, w]) => a + w, 0) || 1;
  for (const [name, weight] of weights) {
    state.layerState[name].enabled = true;
    state.layerState[name].currentDensity = cap * (weight / totalWeight);
  }
  for (const name of Object.keys(state.layerState)) {
    if (!weights.find(([n]) => n === name)) {
      state.layerState[name].enabled = false;
      state.layerState[name].currentDensity = 0;
    }
  }
}

export function scheduleSilenceWindows(state) {
  const now = state.totalTimeSec;
  if (state.layerState.lead.enabled && Math.random() < state.silenceBudget * 0.04) {
    state.layerState.lead.mutedUntilSec = Math.max(state.layerState.lead.mutedUntilSec, now + randRange(...COMPOSER_CFG.layerRules.lead.silenceAfterPhraseSec));
  }
  if (state.phase === 'RELEASE') {
    state.layerState.grain.mutedUntilSec = now + 9999;
    state.layerState.kick.mutedUntilSec = now + randRange(4, 12);
  }
}

export function generateBassGravity(state) { return maybePlaceholder('bass', state); }
export function generateChordVoicing(state) { return maybePlaceholder('harmony', state); }
export function generateLeadFragments(state) { return maybePlaceholder('lead', state); }
export function generateDroneField(state) { return maybePlaceholder('drone', state); }
export function generateGrainTexture(state) { return maybePlaceholder('grain', state); }
export function generateRuptureEvents(state) { return maybePlaceholder('rupture', state); }
export function generateKick(state) { return maybePlaceholder('kick', state); }

function maybePlaceholder(name, state) {
  const ls = state.layerState[name];
  if (!ls.enabled || state.totalTimeSec < ls.mutedUntilSec) return [];
  return [];
}

export function applyInterlockPenalty(events, state) {
  return events.filter((event, i) => {
    for (let j = 0; j < i; j++) {
      const other = events[j];
      if (Math.abs(event.timeSec - other.timeSec) < 0.05) {
        const pair = new Set([event.layer, other.layer]);
        const penalized = pair.has('lead') && (pair.has('grain') || pair.has('rupture'));
        if (penalized && Math.random() < 0.5) return false;
      }
    }
    return true;
  });
}

export function advanceRuptureStage(state) {
  const progress = state.totalTimeSec <= 0 ? 0 : state.totalTimeSec / Math.max(state.totalTimeSec, 1);
  if (state.phase === 'TENSION' && state.ruptureStage === 'OFF') state.ruptureStage = 'OMEN';
  if (state.phase === 'TENSION' && state.phaseTimeSec > 16) state.ruptureStage = 'INFILTRATION';
  if (state.phase === 'CLIMAX') state.ruptureStage = 'TAKEOVER';
  if (state.phase === 'RELEASE') state.ruptureStage = 'RESIDUE';
  state.rupturePresence = ['OFF','OMEN','INFILTRATION','TAKEOVER','RESIDUE'].indexOf(state.ruptureStage) / 4;
  state.corruptionAmount = state.ruptureStage === 'TAKEOVER' ? 1 : state.ruptureStage === 'INFILTRATION' ? 0.45 : state.ruptureStage === 'RESIDUE' ? 0.2 : 0;
}

export function applyRuptureCorruption(events, state) {
  if (state.corruptionAmount <= 0) return events;
  return events.map(event => {
    if (!COMPOSER_CFG.layerRules.rupture.corruptionTargets.includes(event.layer)) return event;
    const out = { ...event };
    if (Math.random() < state.corruptionAmount * 0.35 && typeof out.pitch === 'number') out.pitch += randomChoice([-2, -1, 1, 2]);
    if (Math.random() < state.corruptionAmount * 0.25) out.timeSec += randRange(-0.06, 0.06);
    if (Math.random() < state.corruptionAmount * 0.2) out.durationSec *= randRange(0.35, 0.8);
    if (Math.random() < state.corruptionAmount * 0.15) out.muted = true;
    return out;
  }).filter(e => !e.muted);
}

function updateMemory(state, events) {
  const pitched = events.filter(e => typeof e.pitchClass === 'string');
  if (!pitched.length) return;
  state.memorySeed.pitchClassAnchor = pitched[pitched.length - 1].pitchClass;
}

export function carryMemoryIntoNextPhase(state, prevPhaseData = {}) {
  state.memorySeed = {
    ...state.memorySeed,
    ...prevPhaseData,
  };
}

export function restartFromMutatedMemory(state) {
  state.restartIndex += 1;
  state.postClimaxRecovery = 0;
  state.memorySeed = {
    ...state.memorySeed,
    contourType: randomChoice(['rise_fall', 'fall_rise', 'plateau_drop']),
    voicingShape: randomChoice(['open_10th', 'split_cluster', 'fifth_plus_color']),
  };
  state.ruptureStage = 'OFF';
  state.rupturePresence = 0;
  state.corruptionAmount = 0;
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
