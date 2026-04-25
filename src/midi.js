// ═══════════════════════════════════════════════════════════
//  MACH:INE III — MIDI Engine
//  WebMIDI API: note tracking, density, pitch range, CC
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { recordMIDI } from './session-recorder.js';
import { humanizeMs } from './composition-toolkit.js';

// ── MIDI role channels (0-indexed internally) ──
// Ch 0=KICK, Ch 1=PERC, Ch 2=DRONE, Ch 3=BASS, Ch 4=CHORDS, Ch 5=VOICE, Ch 6=LEAD, Ch 7=ARP
// CH3/CH5/CH6/CH7 = modulare (no velocity control) — ghost solo su CH0/CH2/CH4
export const MIDI_ROLES = ['KICK', 'PERC', 'DRONE', 'BASS', 'CHORDS', 'VOICE', 'LEAD', 'ARP'];

// ── Public state ──
export const midi = {
  lastNote: null,       // { note, vel, ch } | null
  newNotes: [],         // accumulated since last frame — consumed by render
  noteFlashes: [],      // [{ x, alpha, noteNum, ch }]
  noteDensity: 0,       // notes per second over window
  pitchRange: { low: 127, high: 0 },
  cc: new Map(),        // "ch:cc" -> value (0-127)
  connected: false,
  inputCount: 0,

  // Per-channel tracking (channels 0-7)
  channels: Array.from({ length: 8 }, () => ({
    lastNote: null,     // { note, vel, time }
    active: [],         // currently held notes [{ note, vel }]
    density: 0,         // notes/sec
    timestamps: [],     // for density calc
  })),
};

// ── Internal ──
// D1: ring buffer for note timestamps. Previous pattern was an unbounded array
// with O(n) .shift() on every frame — in a 45-min set it accumulated ~270K
// entries and leaked GC pressure. Float32Array + head/count ring fixes that.
const _NOTE_TS_CAPACITY = CFG.RUNTIME_NOTE_TS_CAPACITY;
const noteTimestamps = new Float32Array(_NOTE_TS_CAPACITY);
let _noteTsHead = 0;   // next write index
let _noteTsCount = 0;  // valid entries (saturates at capacity)

function _pushNoteTimestamp(t) {
  noteTimestamps[_noteTsHead] = t;
  _noteTsHead = (_noteTsHead + 1) % _NOTE_TS_CAPACITY;
  if (_noteTsCount < _NOTE_TS_CAPACITY) _noteTsCount++;
}

// Count timestamps that are >= windowStart. Walks the ring from newest back
// until we fall below the threshold. O(count in window) on average — for a
// 2-second density window at 16 notes/s that's ~32 iterations. No allocation.
function _countNoteTimestampsAfter(windowStart) {
  if (_noteTsCount === 0) return 0;
  let count = 0;
  for (let i = 0; i < _noteTsCount; i++) {
    const idx = (_noteTsHead - 1 - i + _NOTE_TS_CAPACITY) % _NOTE_TS_CAPACITY;
    if (noteTimestamps[idx] < windowStart) break;
    count++;
  }
  return count;
}

let W = window.innerWidth;
let midiOut = null;

// D3: log MIDI-out-unavailable once per connection loss, then silent. Re-armed
// the moment we see midiOut alive again. Dispatches 'midi-unavailable' on the
// first drop so the HUD can show a banner.
let _midiOutWarnLogged = false;

// ── Norns OSC bridge (WebSocket → norns-bridge.py → OSC) ──
// DISATTIVATO: sessione 27, cleanup hot path. Il bridge allocava oggetti
// { type, note, vel } per ogni nota CH2 → pressione GC in performance live.
// Le funzioni export restano come no-op per compatibilità con director3.js.
// Per riattivare: rimettere NORNS_ENABLED=true e chiamare _nornsConnect().
const NORNS_ENABLED = false;

export function sendNornsBiome(_trackIndex) { /* no-op */ }
export function sendNornsDroneStart() { /* no-op */ }
export function sendNornsDroneStop()  { /* no-op */ }

// ── MIDI Clock (24 ppqn sync for Ableton / DAWs) ──
// Lookahead scheduling: pre-schedule ticks with hardware timestamps.
// The MIDI driver sends them at the exact right time regardless of
// main thread load — eliminates jitter/drift completely.
let midiClockRunning = false;
let clockBpm = 120;
let nextTickTime = 0;       // performance.now() of next scheduled tick
const CLOCK_LOOKAHEAD = 100; // schedule ticks up to 100ms ahead — 2× margin against V8 major GC pauses (~50ms max)
// Tutte le note/CC/PB partono con questo offset. Deve essere > del jitter tipico
// del main thread (5-10ms) e < della soglia percettiva (~20ms).
// Sessione 27: introdotto per eliminare il drift clock↔note con hw attaccato.
const NOTE_LOOKAHEAD_MS = 15;

// ── v3.19 Wave 1A: per-track timing feel ──
// _trackFeelMs: offset costante in ms applicato a TUTTE le note (drum incluso).
//   Negative → push (in pocket / ahead of beat: MACCHINA, TEMPESTA)
//   Positive → laid-back (TESSUTO, SOLCO, RITORNO).
//   Spostiamo il groove rispetto al MIDI clock: il "feel" diventa identità per traccia.
// _trackJitterSigma: deviazione standard del jitter gaussiano in ms.
//   Applicato SOLO ai canali espressivi (>=2): drum kit (0/1) resta in griglia rigida.
//   Rende il timing umano sui ch musicali senza compromettere il polso.
let _trackFeelMs = 0;
let _trackJitterSigma = 0;

export function setTrackTiming({ feel = 0, jitter = 0 } = {}) {
  _trackFeelMs = feel;
  _trackJitterSigma = jitter;
}

// Keep canvas width in sync
export function setCanvasWidth(width) {
  W = width;
}

// ── Note name utility ──
function noteName(n) {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return names[n % 12] + Math.floor(n / 12 - 1);
}

export { noteName };

// ── MIDI message handler ──
function handleMIDIMessage(msg) {
  const [status, data1, data2] = msg.data;
  const type = status & 0xF0;
  const ch = status & 0x0F;
  if (type === 0x90 && data2 > 0) {
    // Note On
    const note = data1;
    const vel = data2;
    const x = (note / 127) * W;

    midi.lastNote = { note, vel, ch };
    midi.newNotes.push({ note, vel, ch });
    midi.noteFlashes.push({ x, alpha: vel / 127, noteNum: note, ch });

    // Update pitch range
    if (note < midi.pitchRange.low) midi.pitchRange.low = note;
    if (note > midi.pitchRange.high) midi.pitchRange.high = note;

    // Record timestamp for density (D1: ring buffer)
    _pushNoteTimestamp(performance.now() / 1000);

    // Per-channel tracking (channels 0-7)
    if (ch < 8) {
      const chData = midi.channels[ch];
      chData.lastNote = { note, vel, time: performance.now() / 1000 };
      chData.active.push({ note, vel });
      chData.timestamps.push(performance.now() / 1000);
    }

  } else if (type === 0x80 || (type === 0x90 && data2 === 0)) {
    // Note Off
    if (ch < 8) {
      const chData = midi.channels[ch];
      chData.active = chData.active.filter(n => n.note !== data1);
    }

  } else if (type === 0xB0) {
    // CC
    const ccNum = data1;
    const ccVal = data2;
    midi.cc.set(`${ch}:${ccNum}`, ccVal);
  }
}

// ── Per-frame update ──
export function updateMIDI() {
  // Update note density
  const now = performance.now() / 1000;
  const windowStart = now - CFG.noteDensityWindowSec;

  // D1: density from ring buffer — count only entries in window, no shifts.
  const notesInWindow = _countNoteTimestampsAfter(windowStart);
  midi.noteDensity = notesInWindow / CFG.noteDensityWindowSec;

  // Per-channel density (still array-based: per-channel rates are low enough
  // that .shift() is not a GC concern — ~2 entries/sec per channel max).
  for (let c = 0; c < 8; c++) {
    const chData = midi.channels[c];
    while (chData.timestamps.length > 0 && chData.timestamps[0] < windowStart) {
      chData.timestamps.shift();
    }
    chData.density = chData.timestamps.length / CFG.noteDensityWindowSec;
  }

  // Decay note flashes (swap-and-pop: O(1) removal, no array shift)
  for (let i = midi.noteFlashes.length - 1; i >= 0; i--) {
    midi.noteFlashes[i].alpha *= CFG.noteFlashDecay;
    if (midi.noteFlashes[i].alpha < 0.008) {
      midi.noteFlashes[i] = midi.noteFlashes[midi.noteFlashes.length - 1];
      midi.noteFlashes.length--;
    }
  }

  // Reset pitch range if no recent notes
  if (notesInWindow === 0) {
    midi.pitchRange.low = 127;
    midi.pitchRange.high = 0;
  }
}

// ── MIDI Output ──
// Hardware-timed note-off: WebMIDI send() accetta un timestamp DOMHighRes.
// Il driver MIDI schedula il note-off con precisione hardware,
// eliminando il drift del setTimeout sul main thread.
export function sendMIDINote(ch, note, vel, durationMs = 200) {
  recordMIDI(ch, note, vel, durationMs);  // session recorder hook (no-op if not recording)
  if (!midiOut) {
    // D3: log once per disconnection, tell HUD, stay silent until reconnect.
    if (!_midiOutWarnLogged) {
      console.warn('[MIDI] Output unavailable — notes dropped silently');
      try { window.dispatchEvent(new CustomEvent('midi-unavailable')); } catch (_) {}
      _midiOutWarnLogged = true;
    }
    return;
  }
  // D3: re-arm warn flag and dispatch 'midi-available' exactly once per recovery.
  // Edge detection: only fire when we were previously in the warned state.
  if (_midiOutWarnLogged) {
    _midiOutWarnLogged = false;
    try { window.dispatchEvent(new CustomEvent('midi-available')); } catch (_) {}
  }
  const chByte = ch & 0x0F;
  const safeNote = Math.max(0, Math.min(127, note | 0));
  const safeVel = Math.max(0, Math.min(127, vel | 0));
  // Lookahead scheduling: tutte le note viaggiano con lo stesso buffer del clock.
  // Assorbe jitter del main thread (fino a NOTE_LOOKAHEAD_MS) senza drift tra
  // clock MIDI (hardware-timed) e note. Sessione 27.
  // v3.19 Wave 1A: offset feel (sistematico) + jitter gaussiano per ch espressivi.
  // Drum kit (ch 0/1) prende solo il feel sistematico — la griglia ritmica resta
  // rigida ma il groove può spostarsi in pocket / laid-back per traccia.
  const isDrum = (ch === 0 || ch === 1);
  const jitter = isDrum ? 0 : humanizeMs(_trackJitterSigma);
  const baseT = performance.now() + NOTE_LOOKAHEAD_MS + _trackFeelMs + jitter;
  // Clamp: lo scheduler non accetta timestamp nel passato (perde la nota).
  const t = baseT < performance.now() + 1 ? performance.now() + 1 : baseT;
  midiOut.send([0x90 | chByte, safeNote, safeVel], t);
  midiOut.send([0x80 | chByte, safeNote, 0], t + durationMs);
}

// D6: AllNotesOff must arrive AFTER any note-on already queued with
// NOTE_LOOKAHEAD_MS (15ms). Schedule it 50ms out so note-on→note-off→panic
// arrive in the correct order even under main-thread jitter.
const PANIC_LOOKAHEAD_MS = 50;
export function sendMIDIAllNotesOff() {
  if (!midiOut) return;
  const t = performance.now() + PANIC_LOOKAHEAD_MS;
  for (let c = 0; c < 8; c++) midiOut.send([0xB0 | c, 123, 0], t);
}

export function sendMIDICC(ch, cc, value) {
  if (!midiOut) return;
  // Stesso lookahead del note-on per coerenza CC↔note (es. CC123 All Notes Off)
  midiOut.send([0xB0 | (ch & 0x0F), cc & 0x7F, value & 0x7F], performance.now() + NOTE_LOOKAHEAD_MS);
}

// 14-bit pitch bend. value14bit: 0..16383, center = 8192 (no bend).
// Standard pitch bend range = ±2 semitones, so ±15 cents ≈ ±614 from center.
export function sendMIDIPitchBend(ch, value14bit) {
  if (!midiOut) return;
  const v = Math.max(0, Math.min(16383, value14bit | 0));
  midiOut.send([0xE0 | (ch & 0x0F), v & 0x7F, (v >> 7) & 0x7F], performance.now() + NOTE_LOOKAHEAD_MS);
}

// ── MIDI Clock Output (24 ppqn) ──
export function sendMIDIStart() {
  if (!midiOut) return;
  // Allinea l'origine tempo del clock al lookahead delle note: così Start,
  // primo tick e prime note partono tutti coerenti dopo NOTE_LOOKAHEAD_MS.
  const t = performance.now() + NOTE_LOOKAHEAD_MS;
  midiOut.send([0xFA], t); // MIDI Start
  nextTickTime = t;
  midiClockRunning = true;
  console.log('[MIDI CLOCK] START');
}

export function sendMIDIStop() {
  if (!midiOut) return;
  // D6: Stop lookahead > note lookahead — ensures no pending note-on lands
  // AFTER the Stop on the receiving DAW/synth.
  midiOut.send([0xFC], performance.now() + PANIC_LOOKAHEAD_MS); // MIDI Stop
  midiClockRunning = false;
  console.log('[MIDI CLOCK] STOP');
}

export function updateMIDIClock(bpm) {
  if (!midiOut || !midiClockRunning || !bpm) return;
  clockBpm = bpm;
  // Lookahead: pre-schedule ticks with hardware timestamps.
  // The MIDI driver delivers them at the exact right time,
  // regardless of main thread rendering load.
  const tickIntervalMs = 60000 / (clockBpm * 24);
  const scheduleHorizon = performance.now() + CLOCK_LOOKAHEAD;
  while (nextTickTime <= scheduleHorizon) {
    midiOut.send([0xF8], nextTickTime);
    nextTickTime += tickIntervalMs;
  }
}

export function isMIDIClockRunning() {
  return midiClockRunning;
}

// ── Init ──
export async function initMIDI() {
  if (!navigator.requestMIDIAccess) {
    return 'NO SUPPORT';
  }

  try {
    const access = await navigator.requestMIDIAccess({ sysex: false });
    midi.connected = true;
    midi.inputCount = access.inputs.size;

    const knownInputs = new Set();
    const attachListeners = () => {
      access.inputs.forEach(input => {
        if (!knownInputs.has(input.id)) {
          console.log(`MIDI input: "${input.name}" state:${input.state} conn:${input.connection}`);
          knownInputs.add(input.id);
        }
        // Always re-attach — ensures handler survives reconnects
        input.onmidimessage = handleMIDIMessage;
        // Force open if closed
        if (input.connection === 'closed' && input.state === 'connected') {
          input.open().catch(() => {});
        }
      });
      midi.inputCount = access.inputs.size;
    };

    attachListeners();

    const attachOutput = () => {
      const name = CFG.COMPOSER?.midiOutputName;
      access.outputs.forEach(out => {
        if (!midiOut || (name && out.name === name)) midiOut = out;
      });
      if (midiOut) console.log(`MIDI output: "${midiOut.name}"`);
    };
    attachOutput();

    access.onstatechange = (e) => {
      console.log(`MIDI state change: ${e.port.name} ${e.port.state} ${e.port.connection}`);
      attachListeners();
      attachOutput();
    };

    return `OK  ${access.inputs.size} IN`;
  } catch (e) {
    return 'ERR';
  }
}
