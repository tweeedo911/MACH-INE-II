// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Bass Module V3 (structural)
//  CH3 Bass — STRUCTURAL EXPERIMENT (post-RESEARCH-V4 2026-04-07)
//
//  Cycle extension (RESEARCH-V4 §B.4):
//  Bass loop starts as 1 bar. After ~8 stable bars, extends to 2 bars
//  (with a variation in bar 2). After another 8 stable bars, extends to
//  4 bars (variations in bars 2/3/4). The bass enriches by *extending the
//  cycle*, not by adding notes — solves "bass loop is predictable after
//  3 cycles" diagnosis from the Critico.
//
//  Reads worldState. Never writes it.
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { worldState } from './world-state.js';
import { sendMIDINote } from './midi.js';
import { addMidiNote } from './field.js';
import { TRACKS } from './tracks.js';
import { advanceCanonVoice } from './director3.js';

// ── Phase-aware skip probability (A) ──
// Il dub vive di buchi. Germoglio sparso, densità pieno, dissoluzione consumato.
const _BASS_SKIP_PROB = {
  germoglio:    0.08,   // il basso prepara: quasi costante, fonda il groove
  pulsazione:   0.05,   // quasi completo, qualche respiro
  densita:      0.03,   // groove pieno, skip rarissimo
  rottura:      0.05,   // solido ma con crepe
  dissoluzione: 0.25,   // si sfilaccia (+ degradation sopra)
};

// ── Phase-aware gate duration multiplier (B) ──
// Sul modulare il gate è l'unico parametro espressivo.
// Valori = moltiplicatore di stepMs (~130ms a 129BPM)
const _BASS_DUR_MUL = {
  germoglio:    2.5,    // medio — il basso tiene, fonda il groove
  pulsazione:   3.0,    // medio — groove leggibile
  densita:      5.0,    // legato — groove pieno, note che si toccano
  rottura:      4.0,    // legato ma meno — tensione
  dissoluzione: 1.2,    // staccatissimo — il basso si ritira
};

// Reads master clock from worldState.globalTick (written by rhythm.js).
let _step = 0;
let _bar = 0;
let _lastTick = -1;
let _lastNote = -1;
let _velSweep = 0;
let _lastFollowChord = '';
let _lastFollowBar   = -1;

// V3: cycle extension state
let _cycleStage = 1;          // 1, 2, or 4 — current cycle length in bars
let _stableBars = 0;          // bars elapsed at current stage with stable bass
let _variations = [];         // pre-computed variation patterns for bars > 0
let _lastTrackName = '';
let _lastBasePattern = null;
const STABLE_BARS_PER_STAGE = 8;

export function initBass() {
  _step = 0;
  _bar = 0;
  _lastTick = worldState.globalTick;  // sync to master clock
  _cycleStage = 1;
  _stableBars = 0;
  _variations = [];
  _lastTrackName = '';
  _lastBasePattern = null;
  _lastFollowChord = '';
  _lastFollowBar   = -1;
  console.log('[BASS-V3] Initialized (cycle extension)');
}

// Build a variation of the base pattern at the requested level (1..3).
// Variations are deterministic shifts/swaps of the base pattern — they keep
// the same density/character but feel "different" when looped against bar 0.
function _buildVariation(basePattern, level) {
  // Rotate by 4 steps (= one quarter note) — keeps groove but moves accents
  const rot = 4;
  const rotated = [...basePattern.slice(rot), ...basePattern.slice(0, rot)];
  if (level === 1) return rotated;

  // Level 2: rotate + swap two pairs of steps
  const r2 = [...rotated];
  const swaps = [[2, 6], [10, 14]];
  for (const [a, b] of swaps) {
    const tmp = r2[a]; r2[a] = r2[b]; r2[b] = tmp;
  }
  if (level === 2) return r2;

  // Level 3: rotate + swap + add a ghost on offbeat (only if step is empty)
  const r3 = [...r2];
  const ghostSteps = [3, 11];
  for (const s of ghostSteps) {
    if (r3[s] === 0 && basePattern.some(n => n > 0)) {
      // Pick a low offset reused from existing pattern
      const positives = basePattern.filter(n => n > 0);
      r3[s] = positives[0];
    }
  }
  return r3;
}

function _resetCycle(basePattern, trackName) {
  _cycleStage = 1;
  _stableBars = 0;
  _variations = [];
  _lastBasePattern = basePattern;
  _lastTrackName = trackName;
}

function _advanceCycleStage(basePattern) {
  if (_cycleStage === 1) {
    _cycleStage = 2;
    _variations = [_buildVariation(basePattern, 1)];
    _stableBars = 0;
    console.log('[BASS-V3] cycle 1 → 2 bar');
  } else if (_cycleStage === 2) {
    _cycleStage = 4;
    _variations = [
      _buildVariation(basePattern, 1),
      _buildVariation(basePattern, 2),
      _buildVariation(basePattern, 3),
    ];
    _stableBars = 0;
    console.log('[BASS-V3] cycle 2 → 4 bar');
  }
  // stage 4 = max — no further extension
}

export function updateBass(dt) {
  if (worldState.density.bass < 0.01) return;  // bpm null ok — ambient uses 60 BPM fallback

  // Catch up to master clock (rhythm.js owns the only stepAcc)
  while (_lastTick < worldState.globalTick) {
    _lastTick++;
    if (worldState.encoreMode) {
      // V2: bass is 1× speed, standard 16-step cycle
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
  const track = TRACKS[worldState.track];
  if (!track) return;

  // ── ENCORE V2: bass reads from canon voice ──
  if (worldState.encoreMode) {
    const canon = worldState.encoreCanon;
    if (!canon.bass.active) return;

    // V2.1: pattern ritmico 16-step (groove dub asimmetrico, 6 hit per bar)
    const pattern = CFG.ENCORE_PATTERN_BASS;
    if (!pattern[_step]) return;

    // Avanza posizione nel canon → recupera la nota trasformata
    const note = advanceCanonVoice('bass');
    if (note <= 0) return;

    const density = worldState.density.bass;
    const ceiling = worldState.velocityCeiling.bass;
    const bpm = worldState.bpm || 132;
    const stepMs = (60 / bpm / 4) * 1000;

    // Accent sul step 0, ghost sugli altri hit
    const isAccent = _step === 0 || _step === 8;
    const rawVel = isAccent
      ? 85 + density * 25 + (Math.random() * 6 - 3)
      : 60 + density * 30 + (Math.random() * 8 - 4);
    const vel = Math.min(Math.round(rawVel), ceiling);
    const dur = Math.round(stepMs * (isAccent ? 3 : 1.8));  // gate variabile

    sendMIDINote(3, note, vel, dur);
    addMidiNote(3, note / 127, vel / 127);
    return;
  }

  const pattern = track.bassPattern;
  const root    = worldState.root;
  const density = worldState.density.bass;
  const ceiling = worldState.velocityCeiling.bass;
  const [regLo, regHi] = worldState.register.bass;
  const bpm = worldState.bpm || 60;  // 60 BPM fallback per tracce ambient (come rhythm.js)

  // V3.5: velocity sweep per traccia — period e depth configurabili
  const sweep = track?.bassSweep;
  const sweepPeriod = sweep?.periodBars ?? 8;
  const sweepDepth  = sweep?.depth ?? 0.15;
  _velSweep = (1 - sweepDepth) + sweepDepth * Math.sin((_bar % sweepPeriod) / sweepPeriod * Math.PI * 2);

  const stepMs = (60 / bpm / 4) * 1000;
  const beatMs = (60 / bpm) * 1000;

  // ═══ Mode A: Follow harmony ═══
  if (!pattern) {
    if (!worldState.currentChord || worldState.currentChord.length === 0) return;

    if (CFG.MUSIC_STRUCTURAL) {
      // ── Mode A.1: Rhythmic follow — basso su griglia propria, nota dall'accordo ──
      // bassGrid = ritmo proprio (complementare a chordGrid), chordGrid = fallback
      const bassGrid = track.bassGrid || track.chordGrid;
      if (bassGrid && bassGrid[_step]) {
        if (density < 0.10) return;  // gate dissoluzione

        // Phase-aware skip — stessa logica del Mode B
        const phase = worldState.phase || 'germoglio';
        const skipProb = _BASS_SKIP_PROB[phase] ?? 0.05;
        if (skipProb > 0 && Math.random() < skipProb) return;

        const sorted = [...worldState.currentChord].sort((a, b) => a - b);
        // Root quasi sempre, 5a occasionale per movimento
        let bassNote = sorted[0];
        if (sorted.length > 2 && Math.random() < 0.15) bassNote = sorted[2];  // 5a, 15%
        while (bassNote > regHi) bassNote -= 12;
        while (bassNote < regLo) bassNote += 12;
        if (bassNote < regLo || bassNote > regHi) bassNote = root;

        const baseVel = (50 + density * 30) * _velSweep;
        const humanize = (Math.random() * 6) - 3;
        const vel = Math.round(Math.max(1, Math.min(ceiling, baseVel + humanize)));
        // Gate corto: staccato come gli accordi ritmici sopra
        const durMul = _BASS_DUR_MUL[phase] ?? 3;
        const dur = Math.round(stepMs * Math.min(durMul, 2.5));
        sendMIDINote(3, bassNote, vel, dur);
        addMidiNote(3, bassNote / 127, vel / 127);
        return;
      }

      // ── Mode A.2: Anchor follow — 1 nota su cambio accordo (RESPIRO, RITORNO) ──
      if (_step !== 0) return;
      if (_bar === _lastFollowBar) return;

      const chordStr = worldState.currentChord.join(',');
      const chordChanged = chordStr !== _lastFollowChord;
      const barsSince   = _bar - _lastFollowBar;
      let isMovement = false;

      if (!chordChanged) {
        if (barsSince < 2 || barsSince % 2 !== 0) return;
        if (Math.random() > density * 0.7) return;
        isMovement = true;
      }

      // Density gate dissoluzione
      if (!chordChanged && density < 0.15) return;
      if (chordChanged && density < 0.10) return;

      if (chordChanged) _lastFollowChord = chordStr;
      _lastFollowBar = _bar;

      const sorted = [...worldState.currentChord].sort((a, b) => a - b);
      let noteIdx = 0;
      if (isMovement) {
        const roll = Math.random();
        if (roll > 0.55 && sorted.length > 1) noteIdx = 1;
        if (roll > 0.80 && sorted.length > 2) noteIdx = 2;
      }
      const velMul = isMovement ? 0.75 : 1.0;

      let bassNote = sorted[noteIdx];
      while (bassNote > regHi) bassNote -= 12;
      while (bassNote < regLo) bassNote += 12;
      if (bassNote < regLo || bassNote > regHi) bassNote = root;

      const baseVel = (42 + density * 28) * _velSweep * velMul;
      const humanize = (Math.random() * 6) - 3;
      const vel = Math.round(Math.max(1, Math.min(ceiling, baseVel + humanize)));
      const dur = Math.round(beatMs * 4 * 0.75);
      sendMIDINote(3, bassNote, vel, dur);
      addMidiNote(3, bassNote / 127, vel / 127);

    } else {
      // V1 (N spento): una nota sostenuta per cambio accordo
      const chordStr = worldState.currentChord.join(',');
      if (chordStr === _lastFollowChord || _step !== 0) return;
      _lastFollowChord = chordStr;

      let bassNote = Math.min(...worldState.currentChord);
      while (bassNote > regHi) bassNote -= 12;
      while (bassNote < regLo) bassNote += 12;
      if (bassNote < regLo || bassNote > regHi) bassNote = root;

      const baseVel = (45 + density * 35) * _velSweep;
      const humanize = (Math.random() * 6) - 3;
      const vel = Math.round(Math.max(1, Math.min(ceiling, baseVel + humanize)));
      const dur = Math.round(beatMs * 14);
      sendMIDINote(3, bassNote, vel, dur);
      addMidiNote(3, bassNote / 127, vel / 127);
    }
    return;
  }

  // ═══ Mode B: Pattern-based — independent loop ═══
  // V3: cycle extension — select active pattern based on _bar % _cycleStage
  // V3.5: skip cycle extension for locked patterns (hand-crafted complementarity)
  let activePattern = pattern;
  const locked = track.bassPatternLocked;
  if (CFG.MUSIC_STRUCTURAL && !locked) {
    // Reset cycle on track or pattern change
    if (worldState.track !== _lastTrackName || pattern !== _lastBasePattern) {
      _resetCycle(pattern, worldState.track);
    }
    // Track stable bars (only on bar boundary, only when bass is meaningful)
    if (_step === 0 && density > 0.3) {
      _stableBars++;
      if (_stableBars >= STABLE_BARS_PER_STAGE) {
        _advanceCycleStage(pattern);
      }
    }
    // Pick variation for current bar of cycle
    const cycleBar = _bar % _cycleStage;
    if (cycleBar > 0 && _variations[cycleBar - 1]) {
      activePattern = _variations[cycleBar - 1];
    }
  }

  const offset = activePattern[_step];
  const ornament = track.bassOrnament;
  const phase = worldState.phase || 'germoglio';

  if (offset > 0) {
    // ── A: Skip probability phase-aware ──
    const skipProb = _BASS_SKIP_PROB[phase] ?? 0.05;
    if (skipProb > 0 && Math.random() < skipProb) return;

    // ── D: Degradation in dissoluzione ──
    if (phase === 'dissoluzione') {
      const dissolveDur = track.phases?.dissoluzione || 16;
      const dissolveProg = Math.min(1, _bar / dissolveDur);
      const degradeAmount = dissolveProg * 0.6;
      if (Math.random() < degradeAmount) return;
    }

    let note = root + offset;
    while (note > regHi) note -= 12;
    while (note < regLo) note += 12;
    if (note < regLo || note > regHi) note = regLo;

    // V3.11: octave jump — sorpresa controllata, dub classico
    if (ornament?.octaveProb > 0 && Math.random() < ornament.octaveProb) {
      const up = note + 12;
      if (up <= regHi) note = up;
    }

    const baseVel = (50 + density * 40) * _velSweep;
    const humanize = (Math.random() * 8) - 4;
    const vel = Math.round(Math.max(1, Math.min(ceiling, baseVel + humanize)));

    // ── B: Durata phase-aware ──
    const durMul = _BASS_DUR_MUL[phase] ?? 3;
    const dur = Math.round(stepMs * durMul);

    sendMIDINote(3, note, vel, dur);
    addMidiNote(3, note / 127, vel / 127);
    _lastNote = _step;

  // Ghost fill phase-aware: zero in germoglio (il basso è solo, deve essere pulito),
  // cresce con le fasi quando c'è un ritmo che contestualizza i ghost
  } else if (ornament?.ghostProb > 0) {
    const ghostPhaseScale = { germoglio: 0, pulsazione: 0.4, densita: 1.0, rottura: 0.8, dissoluzione: 0.2 };
    const effectiveGhostProb = ornament.ghostProb * (ghostPhaseScale[phase] ?? 0.5);
    if (effectiveGhostProb <= 0 || Math.random() >= effectiveGhostProb) return;

    // V3.11: ghost fill — nota fantasma su step vuoto, velocity bassa
    // Usa l'offset più basso del pattern (tipicamente la root)
    const positives = pattern.filter(n => n > 0);
    if (positives.length === 0) return;
    const ghostOffset = positives[0];  // offset più piccolo = root-like

    let note = root + ghostOffset;
    while (note > regHi) note -= 12;
    while (note < regLo) note += 12;
    if (note < regLo || note > regHi) return;

    const ghostVel = Math.round(Math.max(1, Math.min(ceiling, (20 + density * 15) * _velSweep)));
    const durMul = _BASS_DUR_MUL[phase] ?? 3;
    const dur = Math.round(stepMs * Math.min(durMul, 2));  // ghost più corto

    sendMIDINote(3, note, ghostVel, dur);
    addMidiNote(3, note / 127, ghostVel / 127);
  }
}
