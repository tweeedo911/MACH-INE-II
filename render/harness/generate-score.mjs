// ═══════════════════════════════════════════════════════════════════
//  MACH:INE III — Score generator (headless)
//  Gira il music engine (director3 + 5 moduli) in fast-time senza browser,
//  cattura le note via session-recorder, e scrive uno score.scd per render-audio.scd.
//
//  Uso:
//    node --import ./register-loader.mjs generate-score.mjs [outPath.scd]
//    CAP_SEC=90 node ... generate-score.mjs        (limita la durata simulata)
//    DT=0.02 node ...                              (passo di simulazione)
//
//  Mapping note→SC: identico a midi.js sendMIDINote (SC_ROLE_BY_CH, freq, amp, dur).
// ═══════════════════════════════════════════════════════════════════

import './shim.mjs';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dir, '../../src');
const imp = (f) => import(pathToFileURL(resolve(SRC, f)).href);

const outPath = process.argv[2] || resolve(__dir, 'score.scd');
const SR = Number(process.env.SR || 48000);
const DT = Number(process.env.DT || 0.02);
const CAP = Number(process.env.CAP_SEC || 0);        // 0 = fino a fine suite
const MAX_SEC = Number(process.env.MAX_SEC || 4200); // hard cap di sicurezza (70 min)

// ── import dei moduli (field.js è stubbato dal loader) ──
const D = await imp('director3.js');
const R = await imp('rhythm.js');
const H = await imp('harmony.js');
const B = await imp('bass-v3.js');
const M = await imp('melody-v3.js');
const T = await imp('texture.js');
const { worldState } = await imp('world-state.js');
const REC = await imp('session-recorder.js');

// ── mapping note→ruolo SC (copia di midi.js — unificare in seguito) ──
const SC_ROLE_BY_CH = ['kick', '_perc', null, 'bass', 'chord', 'voice', 'lead', 'arp'];
const percRole = (n) => (n === 38 ? 'snare' : n === 42 ? 'openhat' : (n === 45 || n === 48 || n === 41) ? 'conga' : 'hat');
const r3 = (x) => Math.round(x * 1000) / 1000;

// ── run ──
REC.initRecorder({ toDataURL() { throw new Error('no-canvas'); } });
D.initDirector3('NEBBIA');
REC.startRecording();
D.toggleDirector3();  // _paused → false (start)

const timeline = [];
let lastTrack = null, lastPhase = null;
let simSec = 0, steps = 0;
const limit = CAP > 0 ? CAP : MAX_SEC;

while (simSec < limit) {
  globalThis.__SIM_NOW_MS = simSec * 1000;
  D.updateDirector3(DT);
  R.updateRhythm(DT);
  H.updateHarmony(DT);
  B.updateBass(DT);
  M.updateMelody(DT);
  T.updateTexture(DT);

  if (worldState.track && worldState.track !== lastTrack) {
    timeline.push([r3(simSec), 'biome', worldState.track]);
    lastTrack = worldState.track;
  }
  if (worldState.phase && worldState.phase !== lastPhase) {
    timeline.push([r3(simSec), 'phase', worldState.phase]);
    lastPhase = worldState.phase;
  }

  simSec += DT;
  steps++;
  if (CAP === 0 && steps > 200 && !D.isDirector3Playing()) break;  // suite finita
}

REC.stopRecording();
const session = REC.exportSession();

// ── costruzione eventi score ──
const noteEvents = [];
let droneSkipped = 0;
for (const ev of session.midi) {
  let role = SC_ROLE_BY_CH[ev.ch];
  if (role === '_perc') role = percRole(ev.note);
  if (!role) { droneSkipped++; continue; }  // ch2 drone: gestito da biome/phase
  const freq = 440 * Math.pow(2, (ev.note - 69) / 12);
  const amp = (ev.vel / 127) * 0.6;
  const dur = ev.dur / 1000;
  noteEvents.push([ev.t, 'note', role, +freq.toFixed(2), +amp.toFixed(4), +dur.toFixed(3)]);
}

const PRIO = { biome: 0, phase: 1, note: 2 };
const all = [...timeline, ...noteEvents].sort((a, b) => (a[0] - b[0]) || (PRIO[a[1]] - PRIO[b[1]]));

// ── scrittura score.scd ──
let out = '// AUTO-GENERATED da generate-score.mjs — non editare a mano\n';
out += `~sampleRate = ${SR};\n~tail = 6.0;\n~duration = ${r3(simSec)};\n~score = [\n`;
for (const e of all) {
  if (e[1] === 'biome')      out += `    [${e[0]}, \\biome, \\${e[2]}],\n`;
  else if (e[1] === 'phase') out += `    [${e[0]}, \\phase, \\${e[2]}],\n`;
  else                       out += `    [${e[0]}, \\note, \\${e[2]}, ${e[3]}, ${e[4]}, ${e[5]}],\n`;
}
out += '];\n';
writeFileSync(outPath, out);

// ── report ──
const byRole = {};
for (const e of noteEvents) byRole[e[2]] = (byRole[e[2]] || 0) + 1;
console.log(`[score] simulated ${r3(simSec)}s in ${steps} steps`);
console.log(`[score] midi events: ${session.midi.length} (drone ch2 skipped: ${droneSkipped})`);
console.log(`[score] timeline (biome/phase): ${timeline.length}`);
console.log(`[score] note events by role:`, JSON.stringify(byRole));
console.log(`[score] total score events: ${all.length}`);
console.log(`[score] biome timeline:`, JSON.stringify(timeline.filter(e => e[1] === 'biome')));
console.log(`[score] written: ${outPath}`);
