// ═══════════════════════════════════════════════════════════
//  MACH:INE II — MacroComposer v3
//  Arco narrativo 4D precomposto — state machine pura, nessun MIDI
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { getSequencerStatus } from './sequencer.js';
import { setEngine, setPhaseMode } from './midi-patterns.js';
import { setPaletteForMode } from './colors.js';
import { setCompositionForMode } from './director.js';

// ── Exported mutable state — consumato dai layer downstream ──────────────────
export const macroState = {
  rhythmicDensity: 0,    // 0.0-1.0
  harmonicColor:   0,    // 0.0-1.0
  melodicActivity: 0,    // 0.0-1.0
  textureDepth:    0,    // 0.0-1.0
  currentMode:     'A_lydian',
  prevMode:        'A_lydian',
  modeProgress:    0,    // 0.0-1.0 within current modal segment
  pivotActive:     false,
  pivotNote:       57,   // MIDI note della pivot condivisa
  arcPercent:      0,    // 0.0-1.0 del concerto
  barClock:        0,    // bar count accumulato (per HarmonyLayer)
  currentBpm:      78,   // BPM attuale (lerped tra bpmForMode values)
  breakActive:     false, // RITM-05: break ciclico kick+basso attivo (scritto da RhythmLayer)
  preBreakBars:    0,    // H4: bar rimanenti alla prossima finestra break (0 = fuori finestra)
};

// ── Internal state (non-exported) ────────────────────────────────────────────
let _internalClock  = 0;  // accumulatore dt in secondi (fallback se sequencer inattivo)
let _driftPhase     = 0;  // fase dell'oscillazione micro-drift
let _prevCheckpointIdx = 0; // cache indice ultimo checkpoint trovato
let _pivotBarStart  = 0;  // barClock al momento dell'attivazione pivot
let _lastLogPct     = -1; // ultimo pct loggato (evita duplicati)
let _sequencerEverStarted = false; // freeze arco a 0 finché il sequencer non viene avviato (performance)

// ── Init ─────────────────────────────────────────────────────────────────────
export function initMacroComposer() {
  macroState.rhythmicDensity = 0;
  macroState.harmonicColor   = 0;
  macroState.melodicActivity = 0;
  macroState.textureDepth    = 0;
  macroState.currentMode     = 'A_lydian';
  macroState.prevMode        = 'A_lydian';
  macroState.modeProgress    = 0;
  macroState.pivotActive     = false;
  macroState.pivotNote       = 57;
  macroState.arcPercent      = 0;
  macroState.barClock        = 0;
  macroState.currentBpm      = (CFG.MACRO.bpmForMode && CFG.MACRO.bpmForMode['A_lydian']) || CFG.MACRO.bpmReference;
  macroState.breakActive     = false;
  macroState.preBreakBars    = 0;

  _internalClock           = 0;
  _driftPhase              = 0;
  _prevCheckpointIdx       = 0;
  _pivotBarStart           = 0;
  _lastLogPct              = -1;
  _sequencerEverStarted    = false;

  // Applica identità visiva del modo iniziale (non avviene via mode-change al primo tick)
  setEngine(MODE_TO_ENGINE[macroState.currentMode] || null);
  setPhaseMode(macroState.currentMode);  // reset esplicito — evita stale phase da sessione precedente
  setPaletteForMode(macroState.currentMode);
  setCompositionForMode(macroState.currentMode);

  console.log('[MACRO] init — concertDuration:', CFG.MACRO.concertDurationSec, 's');
}

// V3 visual identity mapping — each modal section gets its engine's visual character
const MODE_TO_ENGINE = {
  'A_lydian':    'deriva',     // opening/closing — soft scatter, almost-white
  'Bb_phrygian': 'abisso',     // ritual tension — deep columns, heavy bass
  'D_dorian':    'terreno',    // central groove — dub columns, warm orange
  'C#_dorian':   'solco',      // climax — 4/4 bands, white/steel techno
  'E_phrygian':  'cristallo',  // dissolution — sparkle trails, crystalline
};

// ── Update — chiamato ogni ~2ms dal Worker ────────────────────────────────────
export function updateMacroComposer(dt) {
  // Step A — Calcolo arcPercent
  // Debug override: se window._m._debugArc è definito, usa quello (test MARC-04)
  if (macroState._debugArc !== undefined) {
    macroState.arcPercent = macroState._debugArc;
  } else {
    // Usa sequencer se attivo, altrimenti fallback clock interno (Pitfall 1)
    // Freeze a pct=0 finché il sequencer non viene avviato almeno una volta (performance)
    const status = getSequencerStatus();
    if (status.active) {
      _sequencerEverStarted = true;
      _internalClock = status.progress * CFG.MACRO.concertDurationSec; // sync per dopo lo stop
      macroState.arcPercent = status.progress;
    } else if (_sequencerEverStarted) {
      _internalClock += dt;
      macroState.arcPercent = Math.min(1, _internalClock / CFG.MACRO.concertDurationSec);
    }
    // else: sequencer mai avviato → arcPercent rimane 0 (silenzio pre-performance)
  }
  const pct = macroState.arcPercent;

  // Step B — Trova i 2 checkpoint adiacenti
  const cps = CFG.MACRO.checkpoints;
  let lo = 0, hi = 1;
  for (let i = 1; i < cps.length; i++) {
    if (cps[i].pct >= pct) { hi = i; lo = i - 1; break; }
  }
  if (pct >= cps[cps.length - 1].pct) { lo = cps.length - 2; hi = cps.length - 1; }

  // Step C — Interpolazione smooth-step tra checkpoint (cubic hermite)
  const cpLo = cps[lo], cpHi = cps[hi];
  const segLen = cpHi.pct - cpLo.pct;
  const segProgress = segLen > 0 ? (pct - cpLo.pct) / segLen : 1;
  const ease = segProgress * segProgress * (3 - 2 * segProgress);

  const targetRD = cpLo.rD + (cpHi.rD - cpLo.rD) * ease;
  const targetHC = cpLo.hC + (cpHi.hC - cpLo.hC) * ease;
  const targetMA = cpLo.mA + (cpHi.mA - cpLo.mA) * ease;
  const targetTD = cpLo.tD + (cpHi.tD - cpLo.tD) * ease;

  // Step D — Micro-drift: oscillazione sinusoidale asincrona per evitare plateau (D-02)
  _driftPhase += dt / CFG.MACRO.microDriftFreqSec;
  const drift = Math.sin(_driftPhase * Math.PI * 2) * CFG.MACRO.microDriftAmp;

  // Step E — EMA smoothing con bypass per checkpoint instant (Pitfall 5)
  const dtSec = dt;  // dt già in secondi dal Worker (performance.now() / 1000)
  const tau   = CFG.MACRO.emaTau;
  const alpha = Math.min(1, dtSec / tau);

  if (cpLo.instant || cpHi.instant) {
    // Bypass EMA: false-resolution richiede discesa a zero istantanea
    macroState.rhythmicDensity = targetRD;
  } else {
    macroState.rhythmicDensity += ((targetRD + drift) - macroState.rhythmicDensity) * alpha;
  }
  // Fattori drift diversi per ogni dimensione — stagger microgestuale (evita sincronia)
  macroState.harmonicColor   += ((targetHC + drift * 0.7) - macroState.harmonicColor)   * alpha;
  macroState.melodicActivity += ((targetMA + drift * 0.5) - macroState.melodicActivity) * alpha;
  macroState.textureDepth    += ((targetTD + drift * 0.8) - macroState.textureDepth)    * alpha;

  // Step F — Clamp valori a [0.0, 1.0]
  macroState.rhythmicDensity = Math.max(0, Math.min(1, macroState.rhythmicDensity));
  macroState.harmonicColor   = Math.max(0, Math.min(1, macroState.harmonicColor));
  macroState.melodicActivity = Math.max(0, Math.min(1, macroState.melodicActivity));
  macroState.textureDepth    = Math.max(0, Math.min(1, macroState.textureDepth));

  // Step G — Aggiornamento modo e attivazione finestra pivot (D-11)
  const targetMode = cpHi.mode;
  if (targetMode !== macroState.currentMode) {
    macroState.prevMode    = macroState.currentMode;
    macroState.currentMode = targetMode;
    macroState.pivotActive = true;
    _pivotBarStart = macroState.barClock;
    const transitionKey = macroState.prevMode + '->' + targetMode;
    macroState.pivotNote = CFG.MACRO.pivotNotes[transitionKey] || 57;
    console.log('[MACRO] mode transition:', macroState.prevMode, '->', targetMode, 'pivot:', macroState.pivotNote);
    // V3 visual identity: activate engine character + palette + layout per nuovo modo
    setEngine(MODE_TO_ENGINE[targetMode] || null);
    setPhaseMode(targetMode);
    setPaletteForMode(targetMode);
    setCompositionForMode(targetMode);
  }

  // Step H — modeProgress: posizione 0.0-1.0 all'interno del segmento modale corrente
  macroState.modeProgress = segProgress;

  // Step I — BPM per modo (lerp smooth) + contatore bar
  const targetBpm = (CFG.MACRO.bpmForMode && CFG.MACRO.bpmForMode[macroState.currentMode])
    || CFG.MACRO.bpmReference;
  // Lerp BPM: ~4 beat di transizione (stessa costante usata dal MIDI clock in main.js)
  const bpmLerpRate = Math.min(1, dt * (macroState.currentBpm / 60) / (CFG.bpmLerpBeats || 2));
  macroState.currentBpm += (targetBpm - macroState.currentBpm) * bpmLerpRate;
  const barsPerSec = macroState.currentBpm / 60 / 4;
  macroState.barClock += dt * barsPerSec;

  // Step J — Disattiva pivot dopo 4 bar (v5: extended for DJ-set transition feel)
  // Ref: Burial/Gas — drone come tessuto connettivo, cambio modale anticipato
  if (macroState.pivotActive && (macroState.barClock - _pivotBarStart) >= 4) {
    macroState.pivotActive = false;
  }

  // Step K — Debug log ogni ~2% di avanzamento (solo se CFG.debug === true)
  if (CFG.debug) {
    const logPct = Math.floor(pct * 100);
    if (logPct % 2 === 0 && logPct !== _lastLogPct) {
      _lastLogPct = logPct;
      console.log('[MACRO]', JSON.stringify({
        pct:  pct.toFixed(3),
        rD:   macroState.rhythmicDensity.toFixed(2),
        hC:   macroState.harmonicColor.toFixed(2),
        mA:   macroState.melodicActivity.toFixed(2),
        tD:   macroState.textureDepth.toFixed(2),
        mode: macroState.currentMode,
        pivot: macroState.pivotActive,
      }));
    }
  }
}

// ── Arc jump — controllo live (tasti numerici) ───────────────────────────────
// Salta l'arco a pct e riprende il clock da lì (no freeze)
// Snap immediato della 4D state al target di arcPercent — bypassa EMA.
// Usato da jumpArc per evitare il fade-in lento post-salto.
function _snapTo(pct) {
  const cps  = CFG.MACRO.checkpoints;
  let lo = 0, hi = 1;
  for (let i = 1; i < cps.length; i++) {
    if (cps[i].pct >= pct) { hi = i; lo = i - 1; break; }
  }
  if (pct >= cps[cps.length - 1].pct) { lo = cps.length - 2; hi = cps.length - 1; }

  const cpLo = cps[lo], cpHi = cps[hi];
  const segLen = cpHi.pct - cpLo.pct;
  const t     = segLen > 0 ? (pct - cpLo.pct) / segLen : 1;
  const ease  = t * t * (3 - 2 * t);

  macroState.rhythmicDensity = cpLo.rD + (cpHi.rD - cpLo.rD) * ease;
  macroState.harmonicColor   = cpLo.hC + (cpHi.hC - cpLo.hC) * ease;
  macroState.melodicActivity = cpLo.mA + (cpHi.mA - cpLo.mA) * ease;
  macroState.textureDepth    = cpLo.tD + (cpHi.tD - cpLo.tD) * ease;

  // Triggera cambio mode immediatamente se necessario (no attesa del prossimo tick)
  const targetMode = cpHi.mode;
  if (targetMode !== macroState.currentMode) {
    macroState.prevMode    = macroState.currentMode;
    macroState.currentMode = targetMode;
    macroState.pivotActive = false;  // nessuna pivot su jump manuale
    setEngine(MODE_TO_ENGINE[targetMode] || null);
    setPhaseMode(targetMode);
    setPaletteForMode(targetMode);
    setCompositionForMode(targetMode);
    console.log('[MACRO] snap mode:', macroState.prevMode, '->', targetMode);
  }
}

export function jumpArc(pct) {
  pct = Math.max(0, Math.min(1, pct));
  _internalClock       = pct * CFG.MACRO.concertDurationSec;
  macroState.arcPercent = pct;
  macroState._debugArc  = undefined;  // rilascia eventuale freeze debug
  _snapTo(pct);  // snap 4D state istantaneo — no EMA lag post-jump
  console.log('[MACRO] arc jump to:', pct.toFixed(2));
}

// ── Convenience getters ───────────────────────────────────────────────────────
export function getMacroState() { return macroState; }

// Restituisce true dopo che il sequencer è stato avviato almeno una volta.
// Usato dai layer per bloccare l'output MIDI prima dell'inizio della performance.
export function isPerformanceStarted() { return _sequencerEverStarted; }
