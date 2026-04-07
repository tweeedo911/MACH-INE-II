// ═══════════════════════════════════════════════════════════
//  MACH:INE II — Performance Sequencer v3
//  5-act dramaturgical structure with sustained multi-engine overlap
//  Cue types: silence, activate, layer, fade_to, end
// ═══════════════════════════════════════════════════════════

import { executeMutation, requestFraming, requestCameraShake } from './director.js';
import { startInvertDissolve, setConcertTime } from './colors.js';
import { setPresenceMultiplier, getPresenceMultiplier, resetAllMultipliers } from './presence-multiplier.js';
import { sendMIDIAllNotesOff } from './midi.js';
import { CFG } from './config.js';
import { recordDecision } from './session-recorder.js';

// ── Momenti-firma state (read by generations.js, render.js) ──
export const firma = {
  gelo: false,          // freeze entities in place
  convergenza: false,   // attract entities to center
  vuotoTotale: false,   // total blackout
  densityCap: 1,        // 0→1 opening, 1→0 closing
};

// ── Act boundaries (seconds) — v4: 7 fasi, 43 min ──
const ACTS = [
  { name: 'I NEBBIA',       start: 0,    end: 180  },
  { name: 'II TESSUTO',     start: 180,  end: 480  },
  { name: 'III SOLCO',      start: 480,  end: 960  },
  { name: 'IV RESPIRO',     start: 960,  end: 1080 },
  { name: 'V MACCHINA',     start: 1080, end: 1500 },
  { name: 'VI TEMPESTA',    start: 1500, end: 2100 },
  { name: 'VII RITORNO',    start: 2100, end: 2580 },
];

// ── Cue definitions — v4 7-phase concert structure ──
// layer: activate engine (if needed) + fade to target presence
// fade_to: change one engine's presence (engine must already be active)
const CUES = [
  // ── I. NEBBIA (0:00–3:00) — drone + voci tessono ──
  { t: 0,    action: 'silence' },
  { t: 5,    action: 'activate',  engine: 'deriva' },
  { t: 5,    action: 'camera',    framing: 'WIDE' },

  // ── II. TESSUTO (3:00–8:00) — armonia cresce, primo polso a 5' ──
  { t: 180,  action: 'layer',     engine: 'cristallo', target: 0.4, duration: 30 },
  { t: 240,  action: 'fade_to',   engine: 'cristallo', target: 0.7, duration: 30 },
  { t: 300,  action: 'camera',    framing: 'DRIFT' },

  // ── III. SOLCO (8:00–16:00) — groove pieno, cambio modale già avvenuto a 7' ──
  { t: 420,  action: 'fade_to',   engine: 'cristallo', target: 0.0, duration: 30 },
  { t: 420,  action: 'layer',     engine: 'abisso',    target: 0.8, duration: 30 },  // Bb Phrygian visual
  { t: 480,  action: 'fade_to',   engine: 'abisso',    target: 1.0, duration: 20 },
  { t: 480,  action: 'camera',    framing: 'MEDIUM' },
  // v5 SILENZIO STRUTTURALE 1 — respiro dopo il primo groove pieno (~11 min)
  { t: 660,  action: 'silence_breath', duration: 6 },
  // GELO al break ~12 min
  { t: 720,  action: 'firma',     effect: 'gelo',      active: true  },
  { t: 728,  action: 'firma',     effect: 'gelo',      active: false },

  // ── IV. RESPIRO (16:00–18:00) — drop totale ──
  { t: 960,  action: 'fade_to',   engine: 'abisso',    target: 0.2, duration: 30 },
  { t: 960,  action: 'camera',    framing: 'WIDE' },
  // Momento DERIVA fantasma durante il respiro
  { t: 990,  action: 'layer',     engine: 'deriva',    target: 0.3, duration: 15 },
  { t: 1050, action: 'fade_to',   engine: 'deriva',    target: 0.0, duration: 15 },
  { t: 1050, action: 'fade_to',   engine: 'abisso',    target: 0.0, duration: 15 },

  // ── V. MACCHINA (18:00–25:00) — groove D Dorian ──
  { t: 1080, action: 'layer',     engine: 'terreno',   target: 0.5, duration: 15 },
  { t: 1080, action: 'camera',    framing: 'MEDIUM' },
  { t: 1110, action: 'fade_to',   engine: 'terreno',   target: 1.0, duration: 20 },
  // v5 SILENZIO STRUTTURALE 2 — respiro prima del gelo, tensione (~21 min)
  { t: 1260, action: 'silence_breath', duration: 5 },
  // GELO al break ~22 min
  { t: 1320, action: 'firma',     effect: 'gelo',      active: true  },
  { t: 1328, action: 'firma',     effect: 'gelo',      active: false },
  // Build verso TEMPESTA
  { t: 1440, action: 'fade_to',   engine: 'terreno',   target: 0.5, duration: 30 },

  // ── VI. TEMPESTA (25:00–35:00) — climax, false resolution, rimbalzo ──
  { t: 1500, action: 'layer',     engine: 'solco',     target: 0.8, duration: 15 },
  { t: 1500, action: 'camera',    framing: 'MEDIUM',   shake: 0.015 },
  { t: 1515, action: 'fade_to',   engine: 'terreno',   target: 0.0, duration: 15 },
  { t: 1515, action: 'fade_to',   engine: 'solco',     target: 1.0, duration: 20 },
  // CONVERGENZA a ~28 min — visiva
  { t: 1680, action: 'firma',     effect: 'convergenza', active: true  },
  { t: 1710, action: 'firma',     effect: 'convergenza', active: false },
  // FALSE RESOLUTION a 30 min
  { t: 1800, action: 'firma',     effect: 'vuotoTotale', active: true  },
  { t: 1822, action: 'firma',     effect: 'vuotoTotale', active: false },  // ~22s
  // RIMBALZO — vortice entra
  { t: 1845, action: 'layer',     engine: 'vortice',   target: 0.9, duration: 10 },
  { t: 1845, action: 'camera',    framing: 'DRIFT',    shake: 0.025 },
  { t: 1855, action: 'fade_to',   engine: 'solco',     target: 0.3, duration: 30 },
  { t: 1855, action: 'fade_to',   engine: 'vortice',   target: 1.0, duration: 20 },
  // Picco assoluto ~32-33 min, poi cala
  { t: 1980, action: 'fade_to',   engine: 'vortice',   target: 0.5, duration: 60 },
  { t: 2040, action: 'fade_to',   engine: 'vortice',   target: 0.0, duration: 30 },
  { t: 2040, action: 'fade_to',   engine: 'solco',     target: 0.0, duration: 30 },

  // v5 SILENZIO STRUTTURALE 3 — respiro finale dopo il climax, prima del ritorno (~34:30)
  { t: 2070, action: 'silence_breath', duration: 8 },

  // ── VII. RITORNO (35:00–43:00) — dissoluzione, seed, silenzio ──
  { t: 2100, action: 'camera',    framing: 'WIDE' },
  { t: 2100, action: 'layer',     engine: 'cristallo', target: 0.5, duration: 30 },
  { t: 2280, action: 'fade_to',   engine: 'cristallo', target: 0.0, duration: 60 },
  { t: 2280, action: 'layer',     engine: 'deriva',    target: 0.4, duration: 30 },
  { t: 2400, action: 'fade_to',   engine: 'deriva',    target: 0.2, duration: 60 },
  { t: 2490, action: 'fade_to',   engine: 'deriva',    target: 0.0, duration: 90 },
  { t: 2580, action: 'end' },
];

// ── Ensure chronological cue order (fixes out-of-order cues) ──
CUES.sort((a, b) => a.t - b.t);

// ── State ──
let active = false;
let globalTime = 0;
let cueIndex = 0;
let paused = false;
let looping = false;
let lastSaveTime = 0;
let _breathEndTime = 0;  // v5: when structural silence ends

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
  recordDecision('cue', `${cue.action}${cue.engine ? ' ' + cue.engine : ''}${cue.effect ? ' ' + cue.effect : ''} @${cue.t}s`);
  switch (cue.action) {
    case 'silence':
      sendMIDIAllNotesOff(); // flush all scheduled notes before deactivating engines
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
      if (!CFG.V3_MODE) startInvertDissolve();
      console.log(`[SEQ] LAYER ${cue.engine.toUpperCase()} → pm ${cue.target} (${cue.duration}s)`);
      break;
    }

    case 'fade_to': {
      addTransition(cue.engine, cue.target, cue.duration);
      if (cue.visual) {
        if (!CFG.V3_MODE) startInvertDissolve();
        if (!CFG.V3_MODE) executeMutation(null, globalTime);
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
      if (cue.active && !CFG.V3_MODE) startInvertDissolve();
      console.log(`[SEQ] FIRMA ${cue.effect.toUpperCase()} ${cue.active ? 'ON' : 'OFF'}`);
      break;

    // v5: structural silence — MIDI all-notes-off + visual blackout for N seconds
    // The gesto più potente del concerto. Il pubblico trattiene il fiato.
    case 'silence_breath': {
      const dur = cue.duration || 6;
      sendMIDIAllNotesOff();
      firma.vuotoTotale = true;
      // Schedule end of breath
      _breathEndTime = globalTime + dur;
      console.log(`[SEQ] ═══ SILENZIO STRUTTURALE ═══ ${dur}s`);
      break;
    }

    case 'end':
      sendMIDIAllNotesOff(); // flush all scheduled notes before stopping
      if (_deactivateAll) _deactivateAll();
      resetAllMultipliers();
      stopSequencer();
      console.log('[SEQUENCER] PERFORMANCE COMPLETE');
      break;
  }
}

// ── Main update ──

// Salta globalTime a sec — usato da jumpArc per tenere sequencer e arco in sync
export function setGlobalTime(sec) {
  globalTime = Math.max(0, sec);
  // Avanza cueIndex oltre le cue già trascorse (non rifirle)
  cueIndex = 0;
  while (cueIndex < CUES.length && CUES[cueIndex].t < globalTime) cueIndex++;
  setConcertTime(globalTime);
}

export function updateSequencer(dt) {
  if (!active) return;
  if (paused) return;

  globalTime += dt;
  setConcertTime(globalTime);

  // Concert opening/closing density cap
  if (globalTime < 120) {
    firma.densityCap = Math.min(1, Math.pow(globalTime / 120, 2));
  } else if (globalTime > 2490) {
    firma.densityCap = Math.max(0, Math.pow(1 - (globalTime - 2490) / 90, 2));
  } else {
    firma.densityCap = 1;
  }

  // v5: check structural silence end
  if (_breathEndTime > 0 && globalTime >= _breathEndTime) {
    firma.vuotoTotale = false;
    _breathEndTime = 0;
    console.log('[SEQ] ═══ SILENZIO FINE ═══');
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
