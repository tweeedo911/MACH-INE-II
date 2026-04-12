// ═══════════════════════════════════════════════════════════
//  MACH:INE II — MIDI Engine
//  WebMIDI API: note tracking, density, pitch range, CC
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';
import { recordMIDI } from './session-recorder.js';

// ── MIDI role channels (0-indexed internally) ──
// Ch 0=PULSE, Ch 1=GRAIN, Ch 2=DRONE, Ch 3=BASS, Ch 4=CHORDS, Ch 5=VOICE, Ch 6=LEAD, Ch 7=ARP
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
let noteTimestamps = []; // for density calculation
let W = window.innerWidth;
let midiOut = null;

// ── MIDI Clock (24 ppqn sync for Ableton / DAWs) ──
// Lookahead scheduling: pre-schedule ticks with hardware timestamps.
// The MIDI driver sends them at the exact right time regardless of
// main thread load — eliminates jitter/drift completely.
let midiClockRunning = false;
let clockBpm = 120;
let nextTickTime = 0;       // performance.now() of next scheduled tick
const CLOCK_LOOKAHEAD = 100; // schedule ticks up to 100ms ahead — 2× margin against V8 major GC pauses (~50ms max)

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

    // Record timestamp for density
    noteTimestamps.push(performance.now() / 1000);

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

  // Remove old timestamps
  while (noteTimestamps.length > 0 && noteTimestamps[0] < windowStart) {
    noteTimestamps.shift();
  }
  midi.noteDensity = noteTimestamps.length / CFG.noteDensityWindowSec;

  // Per-channel density
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
  if (noteTimestamps.length === 0) {
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
  if (!midiOut) return;
  const chByte = ch & 0x0F;
  midiOut.send([0x90 | chByte, note, vel]);
  midiOut.send([0x80 | chByte, note, 0], performance.now() + durationMs);
}

export function sendMIDIAllNotesOff() {
  if (!midiOut) return;
  for (let c = 0; c < 8; c++) midiOut.send([0xB0 | c, 123, 0]);
}

export function sendMIDICC(ch, cc, value) {
  if (!midiOut) return;
  midiOut.send([0xB0 | (ch & 0x0F), cc & 0x7F, value & 0x7F]);
}

// 14-bit pitch bend. value14bit: 0..16383, center = 8192 (no bend).
// Standard pitch bend range = ±2 semitones, so ±15 cents ≈ ±614 from center.
export function sendMIDIPitchBend(ch, value14bit) {
  if (!midiOut) return;
  const v = Math.max(0, Math.min(16383, value14bit | 0));
  midiOut.send([0xE0 | (ch & 0x0F), v & 0x7F, (v >> 7) & 0x7F]);
}

// ── MIDI Clock Output (24 ppqn) ──
export function sendMIDIStart() {
  if (!midiOut) return;
  midiOut.send([0xFA]); // MIDI Start
  nextTickTime = performance.now();
  midiClockRunning = true;
  console.log('[MIDI CLOCK] START');
}

export function sendMIDIStop() {
  if (!midiOut) return;
  midiOut.send([0xFC]); // MIDI Stop
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
