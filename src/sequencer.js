// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Performance Sequencer v3
//  5-act dramaturgical structure with sustained multi-engine overlap
//  Cue types: silence, activate, layer, fade_to, end
// ═══════════════════════════════════════════════════════════

import { executeMutation, requestFraming, requestCameraShake } from './director.js';
import { startInvertDissolve, setConcertTime } from './colors.js';
import { setPresenceMultiplier, getPresenceMultiplier, resetAllMultipliers } from './presence-multiplier.js';

// ── Momenti-firma state (read by generations.js, render.js) ──
export const firma = {
  gelo: false,          // freeze entities in place
  convergenza: false,   // attract entities to center
  vuotoTotale: false,   // total blackout
  densityCap: 1,        // 0→1 opening, 1→0 closing
};

// ── Act boundaries (seconds) ──
const ACTS = [
  { name: 'I EMERGENZA',      start: 0,    end: 480  },
  { name: 'II DISCESA',       start: 480,  end: 1080 },
  { name: 'III MACCHINA',     start: 1080, end: 1680 },
  { name: 'IV ACCELERAZIONE', start: 1680, end: 2520 },
  { name: 'V DISSOLUZIONE',   start: 2520, end: 3000 },
];

// ── Cue definitions — 5-act concert structure ──
// layer: activate engine (if needed) + fade to target presence
// fade_to: change one engine's presence (engine must already be active)
const CUES = [
  // ── ATTO I — EMERGENZA (0:00–8:00) ──
  { t: 0,    action: 'silence' },
  { t: 30,   action: 'activate',  engine: 'deriva' },
  { t: 180,  action: 'layer',     engine: 'cristallo', target: 0.3, duration: 30 },
  { t: 300,  action: 'fade_to',   engine: 'cristallo', target: 1.0, duration: 30 },
  { t: 300,  action: 'fade_to',   engine: 'deriva',    target: 0.2, duration: 30 },
  { t: 420,  action: 'fade_to',   engine: 'deriva',    target: 0.0, duration: 30 },

  // ── ATTO II — DISCESA (8:00–18:00) ──
  { t: 480,  action: 'camera', framing: 'WIDE' },     // Atto I→II: slow zoom out
  { t: 480,  action: 'layer',     engine: 'abisso',    target: 0.3, duration: 30 },
  { t: 570,  action: 'fade_to',   engine: 'cristallo', target: 0.0, duration: 30 },
  { t: 570,  action: 'fade_to',   engine: 'abisso',    target: 1.0, duration: 30 },
  { t: 720,  action: 'layer',     engine: 'terreno',   target: 0.3, duration: 25 },
  { t: 840,  action: 'fade_to',   engine: 'abisso',    target: 0.0, duration: 25 },
  { t: 840,  action: 'fade_to',   engine: 'terreno',   target: 1.0, duration: 25 },

  // ── ATTO III — MACCHINA (18:00–28:00) ──
  { t: 1080, action: 'camera', framing: 'MACRO' },    // Atto II→III: cut to macro
  { t: 1080, action: 'layer',     engine: 'meccanica', target: 0.3, duration: 20 },
  { t: 1140, action: 'fade_to',   engine: 'terreno',   target: 0.0, duration: 20 },
  { t: 1140, action: 'fade_to',   engine: 'meccanica', target: 1.0, duration: 20 },

  // ── SOLCO entra sotto MECCANICA (min 22 = t:1320) ──
  { t: 1320, action: 'layer',    engine: 'solco',     target: 0.3, duration: 30 },

  // ── SOLCO cresce, MECCANICA sfuma (min 26 = t:1560) ──
  { t: 1560, action: 'fade_to',  engine: 'solco',     target: 0.7, duration: 30 },
  { t: 1560, action: 'fade_to',  engine: 'meccanica', target: 0.3, duration: 20 },

  // MOMENTO-FIRMA: GELO (min 24 — machine freezes)
  { t: 1440, action: 'firma', effect: 'gelo', active: true },
  { t: 1470, action: 'firma', effect: 'gelo', active: false },

  // ── ATTO IV — ACCELERAZIONE (28:00–42:00) ──
  { t: 1680, action: 'camera', framing: 'DRIFT', shake: 0.04 }, // Atto III→IV: drift + shake
  { t: 1680, action: 'fade_to',  engine: 'solco',     target: 1.0, duration: 20 },
  { t: 1680, action: 'fade_to',  engine: 'meccanica', target: 0.0, duration: 15 },
  { t: 1680, action: 'layer',    engine: 'vortice',   target: 0.3, duration: 15 },
  { t: 1680, action: 'layer',    engine: 'abisso',    target: 0.3, duration: 30 },
  { t: 1740, action: 'fade_to',   engine: 'vortice',   target: 0.8, duration: 30 },

  // t=1980: SOLCO entra (120s fade), VORTICE cala
  { t: 1980, action: 'layer',     engine: 'solco',     target: 1.0, duration: 120 },
  { t: 1980, action: 'fade_to',   engine: 'vortice',   target: 0.4, duration: 60  },

  // t=2100: VORTICE si ritira mentre SOLCO domina
  { t: 2100, action: 'fade_to',   engine: 'vortice',   target: 0.0, duration: 60  },

  // t=2160: SOLCO solo — ABISSO esce, 2min purezza techno
  { t: 2160, action: 'fade_to',   engine: 'abisso',    target: 0.0, duration: 30  },

  // t=2280: GELO nel contesto techno — deflagrazione
  { t: 2280, action: 'firma', effect: 'gelo',        active: true  },
  { t: 2310, action: 'firma', effect: 'gelo',        active: false },

  // MOMENTO-FIRMA: CONVERGENZA (presagio del climax)
  { t: 2320, action: 'firma', effect: 'convergenza', active: true  },
  { t: 2360, action: 'firma', effect: 'convergenza', active: false },

  // t=2340: CLIMAX ridotto — SOLCO+VORTICE+ABISSO
  { t: 2340, action: 'fade_to',   engine: 'vortice',   target: 1.0, duration: 20, visual: true },
  { t: 2340, action: 'layer',     engine: 'abisso',    target: 1.0, duration: 20  },

  // t=2460: dissoluzione verso Atto V
  { t: 2460, action: 'fade_to',   engine: 'solco',     target: 0.0, duration: 30  },
  { t: 2460, action: 'fade_to',   engine: 'vortice',   target: 0.0, duration: 30  },
  { t: 2460, action: 'fade_to',   engine: 'abisso',    target: 0.0, duration: 30  },

  // ── ATTO V — DISSOLUZIONE (42:00–50:00) ──
  { t: 2520, action: 'camera', framing: 'MEDIUM' },   // Atto IV→V: slow zoom in
  // MOMENTO-FIRMA: VUOTO TOTALE (min 42 — total emptiness)
  { t: 2520, action: 'firma', effect: 'vuotoTotale', active: true  },
  { t: 2550, action: 'firma', effect: 'vuotoTotale', active: false },
  // DERIVA ritorna come eco spettrale — bookend con Atto I
  { t: 2580, action: 'layer',     engine: 'deriva',    target: 0.3, duration: 60  },
  { t: 2820, action: 'fade_to',   engine: 'deriva',    target: 0.0, duration: 120 },
  { t: 3000, action: 'end' },
];

// ── State ──
let active = false;
let globalTime = 0;
let cueIndex = 0;
let paused = false;
let looping = false;
let lastSaveTime = 0;

// Multiple simultaneous transitions
let transitions = [];  // [{ engine, startTime, duration, fromPm, toPm }]

const SAVE_KEY = 'machine2-sequencer-state';
const SAVE_INTERVAL = 10; // seconds

// Callbacks set by main.js
let _activateEngine = null;   // (engineKey) => void — turns on without killing others
let _deactivateAll = null;    // () => void

export function initSequencer(activateEngine, deactivateAll) {
  _activateEngine = activateEngine;
  _deactivateAll = deactivateAll;
}

export function toggleSequencer() {
  if (active) stopSequencer();
  else startSequencer();
}

export function isSequencerActive() { return active; }

// Find the current act based on globalTime
function currentAct() {
  for (const act of ACTS) {
    if (globalTime >= act.start && globalTime < act.end) return act.name;
  }
  return ACTS[ACTS.length - 1].name;
}

// Find the engine with highest presence (for display)
function primaryEngine() {
  const engines = ['terreno', 'meccanica', 'deriva', 'vortice', 'cristallo', 'abisso', 'solco'];
  let best = null, bestPm = 0;
  for (const e of engines) {
    const pm = getPresenceMultiplier(e);
    if (pm > bestPm) { bestPm = pm; best = e; }
  }
  return bestPm > 0.05 ? best : null;
}

// Count engines with presence > threshold
function activeEngineCount(threshold) {
  const engines = ['terreno', 'meccanica', 'deriva', 'vortice', 'cristallo', 'abisso', 'solco'];
  return engines.filter(e => getPresenceMultiplier(e) > threshold).length;
}

export function getSequencerStatus() {
  if (!active) return { active: false };
  const primary = primaryEngine();
  const overlap = activeEngineCount(0.05);
  const act = currentAct();
  let label = primary ? primary.toUpperCase() : 'SILENCE';
  if (overlap > 1) label += ` +${overlap - 1}`;
  return {
    active: true,
    engine: label,
    act,
    step: cueIndex,
    total: CUES.length,
    elapsed: Math.floor(globalTime),
    duration: CUES[CUES.length - 1].t,
    transitioning: transitions.length > 0,
    progress: globalTime / CUES[CUES.length - 1].t,
    paused,
    looping,
  };
}

function startSequencer() {
  active = true;
  globalTime = 0;
  cueIndex = 0;
  transitions = [];
  paused = false;
  looping = false;
  lastSaveTime = 0;
  firma.densityCap = 0;
  resetAllMultipliers();
  if (_deactivateAll) _deactivateAll();
  console.log('[SEQUENCER] START — v3 5-act 50min concert');
}

function stopSequencer() {
  active = false;
  transitions = [];
  paused = false;
  looping = false;
  firma.gelo = false;
  firma.convergenza = false;
  firma.vuotoTotale = false;
  firma.densityCap = 1;
  setConcertTime(-1);
  console.log('[SEQUENCER] STOP');
}

export function skipToNext() {
  if (!active || cueIndex >= CUES.length) return;
  // Jump to next cue time (skip cues at same timestamp)
  const nextT = CUES[cueIndex].t;
  globalTime = nextT - 0.01;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function _fastForwardTo(targetTime) {
  transitions = [];
  resetAllMultipliers();
  if (_deactivateAll) _deactivateAll();
  cueIndex = 0;
  globalTime = 0;
  firma.densityCap = 0;
  firma.gelo = false;
  firma.convergenza = false;
  firma.vuotoTotale = false;
  while (cueIndex < CUES.length && CUES[cueIndex].t <= targetTime) {
    processCue(CUES[cueIndex]);
    cueIndex++;
  }
  globalTime = targetTime;
  console.log(`[SEQ] JUMP to ${formatTime(targetTime)}`);
}

export function skipToPrev() {
  if (!active) return;
  const targetIdx = Math.max(0, cueIndex - 2);
  _fastForwardTo(CUES[targetIdx].t);
}

export function skipToAct(direction) {
  if (!active) return;
  const currentActObj = ACTS.find(a => globalTime >= a.start && globalTime < a.end)
    || ACTS[ACTS.length - 1];
  const currentIdx = ACTS.indexOf(currentActObj);
  const targetIdx = Math.max(0, Math.min(ACTS.length - 1, currentIdx + direction));
  _fastForwardTo(ACTS[targetIdx].start);
}

export function togglePause() {
  if (!active) return;
  paused = !paused;
  console.log(`[SEQ] ${paused ? 'PAUSA' : 'RESUME'} at ${formatTime(globalTime)}`);
}

export function toggleLoop() {
  if (!active) return;
  looping = !looping;
  if (!looping && cueIndex < CUES.length) {
    // Riallinea il tempo alla prossima cue
    globalTime = CUES[cueIndex].t - 0.01;
  }
  console.log(`[SEQ] LOOP ${looping ? 'ON' : 'OFF'} — cue ${cueIndex}`);
}

function saveState() {
  const st = { globalTime, cueIndex, looping, presences: {}, timestamp: Date.now() };
  const engines = ['terreno', 'meccanica', 'deriva', 'vortice', 'cristallo', 'abisso', 'solco'];
  for (const e of engines) st.presences[e] = getPresenceMultiplier(e);
  try { sessionStorage.setItem(SAVE_KEY, JSON.stringify(st)); } catch (_) { /* silent */ }
}

export function canRecover() {
  try {
    const saved = sessionStorage.getItem(SAVE_KEY);
    if (!saved) return false;
    const st = JSON.parse(saved);
    return (Date.now() - st.timestamp) < 300000;
  } catch (_) { return false; }
}

export function recoverState() {
  try {
    const st = JSON.parse(sessionStorage.getItem(SAVE_KEY));
    transitions = [];
    if (_deactivateAll) _deactivateAll();
    resetAllMultipliers();
    active = true;
    globalTime = st.globalTime;
    cueIndex = st.cueIndex;
    looping = st.looping || false;
    paused = false;
    transitions = [];
    firma.densityCap = globalTime < 120 ? Math.min(1, Math.pow(globalTime / 120, 2)) : 1;
    setConcertTime(globalTime);
    for (const [engine, pm] of Object.entries(st.presences)) {
      setPresenceMultiplier(engine, pm);
      if (pm > 0.05 && _activateEngine) _activateEngine(engine);
    }
    console.log(`[SEQ] RECOVERED at ${formatTime(globalTime)} (cue ${cueIndex})`);
  } catch (e) {
    console.error('[SEQ] Recovery failed:', e);
  }
}

// ── Transition management ──

function addTransition(engine, target, duration) {
  // Remove existing transition for this engine
  transitions = transitions.filter(t => t.engine !== engine);
  const fromPm = getPresenceMultiplier(engine);
  if (Math.abs(fromPm - target) < 0.01) {
    // Already at target
    setPresenceMultiplier(engine, target);
    return;
  }
  transitions.push({
    engine,
    startTime: globalTime,
    duration: Math.max(0.1, duration),
    fromPm,
    toPm: target,
  });
}

function updateTransitions() {
  const completed = [];
  for (let i = 0; i < transitions.length; i++) {
    const tr = transitions[i];
    const elapsed = globalTime - tr.startTime;
    const progress = Math.min(1, elapsed / tr.duration);
    // Cubic hermite ease
    const ease = progress * progress * (3 - 2 * progress);
    const pm = tr.fromPm + (tr.toPm - tr.fromPm) * ease;
    setPresenceMultiplier(tr.engine, pm);
    if (progress >= 1) {
      setPresenceMultiplier(tr.engine, tr.toPm);
      completed.push(i);
    }
  }
  // Remove completed (reverse order to preserve indices)
  for (let i = completed.length - 1; i >= 0; i--) {
    const tr = transitions[completed[i]];
    console.log(`[SEQ] ${tr.engine.toUpperCase()} → pm ${tr.toPm.toFixed(1)}`);
    transitions.splice(completed[i], 1);
  }
}

// ── Cue processing ──

function processCue(cue) {
  switch (cue.action) {
    case 'silence':
      if (_deactivateAll) _deactivateAll();
      resetAllMultipliers();
      transitions = [];
      break;

    case 'activate':
      setPresenceMultiplier(cue.engine, 1.0);
      if (_activateEngine) _activateEngine(cue.engine);
      console.log(`[SEQ] → ${cue.engine.toUpperCase()} ON`);
      break;

    case 'layer': {
      // Activate engine (no-op if already active) at pm=0, then fade to target
      setPresenceMultiplier(cue.engine, 0.0);
      if (_activateEngine) _activateEngine(cue.engine);
      addTransition(cue.engine, cue.target, cue.duration);
      startInvertDissolve();
      console.log(`[SEQ] LAYER ${cue.engine.toUpperCase()} → pm ${cue.target} (${cue.duration}s)`);
      break;
    }

    case 'fade_to': {
      addTransition(cue.engine, cue.target, cue.duration);
      if (cue.visual) {
        startInvertDissolve();
        executeMutation(null, globalTime);
      }
      console.log(`[SEQ] FADE ${cue.engine.toUpperCase()} → pm ${cue.target} (${cue.duration}s)`);
      break;
    }

    case 'camera':
      requestFraming(cue.framing);
      if (cue.shake) requestCameraShake(cue.shake);
      console.log(`[SEQ] CAMERA → ${cue.framing}${cue.shake ? ' +SHAKE' : ''}`);
      break;

    case 'firma':
      firma[cue.effect] = cue.active;
      if (cue.active) startInvertDissolve();
      console.log(`[SEQ] FIRMA ${cue.effect.toUpperCase()} ${cue.active ? 'ON' : 'OFF'}`);
      break;

    case 'end':
      if (_deactivateAll) _deactivateAll();
      resetAllMultipliers();
      stopSequencer();
      console.log('[SEQUENCER] PERFORMANCE COMPLETE');
      break;
  }
}

// ── Main update ──

export function updateSequencer(dt) {
  if (!active) return;
  if (paused) return;

  globalTime += dt;
  setConcertTime(globalTime);

  // Concert opening/closing density cap
  if (globalTime < 120) {
    firma.densityCap = Math.min(1, Math.pow(globalTime / 120, 2));
  } else if (globalTime > 2910) {
    firma.densityCap = Math.max(0, Math.pow(1 - (globalTime - 2910) / 90, 2));
  } else {
    firma.densityCap = 1;
  }

  // Process due cues (skipped when looping — time flows but no new cues fire)
  if (!looping) {
    while (cueIndex < CUES.length && globalTime >= CUES[cueIndex].t) {
      processCue(CUES[cueIndex]);
      cueIndex++;
      if (!active) return; // 'end' cue stops everything
    }
  }

  updateTransitions();

  // Crash recovery — save state every SAVE_INTERVAL seconds
  if (globalTime - lastSaveTime > SAVE_INTERVAL) {
    saveState();
    lastSaveTime = globalTime;
  }
}
