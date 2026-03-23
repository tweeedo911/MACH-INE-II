// ═══════════════════════════════════════════════════════════
//  MACH:INE II — MIDI Engine
//  WebMIDI API: note tracking, density, pitch range, CC
// ═══════════════════════════════════════════════════════════

import { CFG } from './config.js';

// ── MIDI role channels (0-indexed internally, user sees 1-5) ──
// Ch 1 = KICK/DRUMS, Ch 2 = BASS, Ch 3 = HARMONY, Ch 4 = LEAD, Ch 5 = TEXTURE
export const MIDI_ROLES = ['KICK', 'BASS', 'HARMONY', 'LEAD', 'TEXTURE'];

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

  // Per-channel tracking (channels 0-4)
  channels: Array.from({ length: 5 }, () => ({
    lastNote: null,     // { note, vel, time }
    active: [],         // currently held notes [{ note, vel }]
    density: 0,         // notes/sec
    timestamps: [],     // for density calc
  })),
};

// ── Internal ──
let noteTimestamps = []; // for density calculation
let W = window.innerWidth;

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
  if (type === 0x90 && data2 > 0) console.log(`NOTE ch:${ch} n:${data1} v:${data2}`);

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

    // Per-channel tracking (only channels 0-4)
    if (ch < 5) {
      const chData = midi.channels[ch];
      chData.lastNote = { note, vel, time: performance.now() / 1000 };
      chData.active.push({ note, vel });
      chData.timestamps.push(performance.now() / 1000);
    }

  } else if (type === 0x80 || (type === 0x90 && data2 === 0)) {
    // Note Off
    if (ch < 5) {
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
  for (let c = 0; c < 5; c++) {
    const chData = midi.channels[c];
    while (chData.timestamps.length > 0 && chData.timestamps[0] < windowStart) {
      chData.timestamps.shift();
    }
    chData.density = chData.timestamps.length / CFG.noteDensityWindowSec;
  }

  // Decay note flashes
  for (let i = midi.noteFlashes.length - 1; i >= 0; i--) {
    midi.noteFlashes[i].alpha *= CFG.noteFlashDecay;
    if (midi.noteFlashes[i].alpha < 0.008) {
      midi.noteFlashes.splice(i, 1);
    }
  }

  // Reset pitch range if no recent notes
  if (noteTimestamps.length === 0) {
    midi.pitchRange.low = 127;
    midi.pitchRange.high = 0;
  }
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
    access.onstatechange = (e) => {
      console.log(`MIDI state change: ${e.port.name} ${e.port.state} ${e.port.connection}`);
      attachListeners();
    };

    return `OK  ${access.inputs.size} IN`;
  } catch (e) {
    return 'ERR';
  }
}
