// ═══════════════════════════════════════════════════════════════════
//  MACH:INE III — Export Standard MIDI Files (SMF)
//  Gira il music engine headless (come generate-score), cattura gli eventi MIDI
//  veri (ch/note/vel/dur) + tempo map (worldState.bpm) + timeline biomi, e scrive:
//    - album-midi/MACHINE-III_full.mid           (intero album, multitraccia)
//    - album-midi/NN_<BIOMA>.mid                  (un file per movimento)
//  SMF format 1: track 0 = tempo/marker map, una track per canale/ruolo.
//  Nessuna dipendenza esterna (writer SMF inline). PPQ 480.
//
//  Uso: node --import ./register-loader.mjs export-midi.mjs [outDir]
// ═══════════════════════════════════════════════════════════════════

import './shim.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dir, '../../src');
const imp = (f) => import(pathToFileURL(resolve(SRC, f)).href);
const outDir = process.argv[2] || resolve(__dir, '../album-midi');
const PPQ = 480;
const DT = Number(process.env.DT || 0.02);
const MAX_SEC = Number(process.env.MAX_SEC || 4200);

// canale → nome traccia (convenzione MACH:INE III: 0=kick,1=perc,2=drone,3=bass,4=chord,5=voice,6=lead,7=arp)
const CH_NAME = ['00_KICK', '01_PERC', '02_DRONE', '03_BASS', '04_CHORD', '05_VOICE', '06_LEAD', '07_ARP'];

// ── run engine ──
const D = await imp('director3.js');
const R = await imp('rhythm.js');
const H = await imp('harmony.js');
const B = await imp('bass-v3.js');
const M = await imp('melody-v3.js');
const T = await imp('texture.js');
const { worldState } = await imp('world-state.js');
const REC = await imp('session-recorder.js');

REC.initRecorder({ toDataURL() { throw new Error('no-canvas'); } });
D.initDirector3('NEBBIA');
REC.startRecording();
D.toggleDirector3();

const biomeTL = [];      // [{t, name}]
const tempoTL = [];      // [{t, bpm}]
const phaseChanges = []; // [{t, name}]
let lastTrack = null, lastPhase = null, lastBpm = null, simSec = 0, steps = 0;

while (simSec < MAX_SEC) {
  globalThis.__SIM_NOW_MS = simSec * 1000;
  D.updateDirector3(DT); R.updateRhythm(DT); H.updateHarmony(DT); B.updateBass(DT); M.updateMelody(DT); T.updateTexture(DT);
  if (worldState.track && worldState.track !== lastTrack) { biomeTL.push({ t: simSec, name: worldState.track }); lastTrack = worldState.track; }
  if (worldState.phase && worldState.phase !== lastPhase) { phaseChanges.push({ t: simSec, name: worldState.phase }); lastPhase = worldState.phase; }
  const bpm = worldState.bpm || 0;
  if (bpm > 0 && (lastBpm === null || Math.abs(bpm - lastBpm) > 0.4)) { tempoTL.push({ t: simSec, bpm }); lastBpm = bpm; }
  simSec += DT; steps++;
  if (steps > 200 && !D.isDirector3Playing()) break;
}
REC.stopRecording();
const session = REC.exportSession();
const totalSec = simSec;
if (tempoTL.length === 0 || tempoTL[0].t > 0) tempoTL.unshift({ t: 0, bpm: tempoTL[0]?.bpm || 120 });

// ── tempo map → conversione secondi→tick ──
function secToTicks(sec, tmap) {
  let ticks = 0;
  for (let i = 0; i < tmap.length; i++) {
    const segStart = tmap[i].t;
    const segEnd = (i + 1 < tmap.length) ? tmap[i + 1].t : Infinity;
    if (sec <= segStart) break;
    const span = Math.min(sec, segEnd) - segStart;
    if (span > 0) ticks += span * PPQ * tmap[i].bpm / 60;
    if (sec <= segEnd) break;
  }
  return Math.max(0, Math.round(ticks));
}

// ── SMF writer ──
function vlq(n) {
  const bytes = [n & 0x7f]; n >>= 7;
  while (n > 0) { bytes.unshift((n & 0x7f) | 0x80); n >>= 7; }
  return bytes;
}
function metaTempo(bpm) { const mpqn = Math.round(60000000 / bpm); return [0xff, 0x51, 0x03, (mpqn >> 16) & 0xff, (mpqn >> 8) & 0xff, mpqn & 0xff]; }
function metaName(name) { const b = [...Buffer.from(name, 'ascii')]; return [0xff, 0x03, ...vlq(b.length), ...b]; }
function metaMarker(name) { const b = [...Buffer.from(name, 'ascii')]; return [0xff, 0x06, ...vlq(b.length), ...b]; }
const META_EOT = [0xff, 0x2f, 0x00];

// trackEvents: [{tick, bytes, ord}] → chunk con delta-time
function buildTrack(absEvents) {
  absEvents.sort((a, b) => (a.tick - b.tick) || (a.ord - b.ord));
  const out = [];
  let prev = 0;
  for (const e of absEvents) {
    out.push(...vlq(e.tick - prev), ...e.bytes);
    prev = e.tick;
  }
  out.push(0x00, ...META_EOT);
  const len = out.length;
  return [0x4d, 0x54, 0x72, 0x6b, (len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff, ...out];
}
function header(ntracks) {
  return [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, (ntracks >> 8) & 0xff, ntracks & 0xff, (PPQ >> 8) & 0xff, PPQ & 0xff];
}

// costruisce un SMF da: eventi midi (assoluti, sec), tempo map, marker biomi, finestra [t0,t1)
function buildSMF(midi, tmap, markers, t0, t1) {
  const reb = t0;                         // rebase
  const localTmap = [];                   // tempo map rebased + clamped alla finestra
  // segmento di tempo attivo a t0
  let startBpm = tmap[0].bpm;
  for (const tp of tmap) { if (tp.t <= t0 + 1e-6) startBpm = tp.bpm; }
  localTmap.push({ t: 0, bpm: startBpm });
  for (const tp of tmap) { if (tp.t > t0 + 1e-6 && tp.t < t1 - 1e-6) localTmap.push({ t: tp.t - reb, bpm: tp.bpm }); }

  const s2t = (sec) => secToTicks(sec, localTmap);

  // track 0: tempo + marker
  const t0ev = [];
  for (const tp of localTmap) t0ev.push({ tick: s2t(tp.t), ord: 0, bytes: metaTempo(tp.bpm) });
  for (const mk of markers) { if (mk.t >= t0 - 1e-6 && mk.t < t1 - 1e-6) t0ev.push({ tick: s2t(mk.t - reb), ord: 1, bytes: metaMarker(mk.name) }); }
  t0ev.push({ tick: 0, ord: -1, bytes: metaName('TEMPO/MAP') });

  // tracce per canale
  const byCh = {};
  for (const ev of midi) {
    if (ev.t < t0 - 1e-6 || ev.t >= t1 - 1e-6) continue;
    const ch = ev.ch & 0x0f;
    (byCh[ch] ||= []).push(ev);
  }
  const chunks = [buildTrack(t0ev)];
  let ntracks = 1;
  for (let ch = 0; ch < 16; ch++) {
    const evs = byCh[ch]; if (!evs || evs.length === 0) continue;
    const tr = [];
    tr.push({ tick: 0, ord: -1, bytes: metaName(CH_NAME[ch] || ('CH' + ch)) });
    for (const ev of evs) {
      const onT = s2t(ev.t - reb);
      const offT = Math.max(onT + 1, s2t(ev.t - reb + (ev.dur / 1000)));
      const vel = Math.max(1, Math.min(127, ev.vel | 0));
      const note = Math.max(0, Math.min(127, ev.note | 0));
      tr.push({ tick: onT, ord: 2, bytes: [0x90 | ch, note, vel] });
      tr.push({ tick: offT, ord: 0, bytes: [0x80 | ch, note, 0] });  // ord 0 < ord 2 → off prima di on allo stesso tick
    }
    chunks.push(buildTrack(tr));
    ntracks++;
  }
  return Buffer.from([...header(ntracks), ...chunks.flat()]);
}

// ── score.scd per il render audio (STESSO take dei MIDI) ──
// Mapping identico a midi.js sendMIDINote.
const SC_ROLE_BY_CH = ['kick', '_perc', null, 'bass', 'chord', 'voice', 'lead', 'arp'];
const percRole = (n) => (n === 38 ? 'snare' : n === 42 ? 'openhat' : (n === 45 || n === 48 || n === 41) ? 'conga' : 'hat');
const r3 = (x) => Math.round(x * 1000) / 1000;
function writeScore(scorePath) {
  const phaseTL = [];
  // ricostruisco la timeline phase dal recorder? Non disponibile qui → la timeline phase la deriva
  // generate-score; qui per coerenza riuso solo biome timeline + note. Le phase le prendiamo
  // dai cambi registrati durante il run.
  const notes = [];
  for (const ev of session.midi) {
    let role = SC_ROLE_BY_CH[ev.ch];
    if (role === '_perc') role = percRole(ev.note);
    if (!role) continue;
    const freq = 440 * Math.pow(2, (ev.note - 69) / 12);
    notes.push([ev.t, 'note', role, +freq.toFixed(2), +((ev.vel / 127) * 0.6).toFixed(4), +(ev.dur / 1000).toFixed(3)]);
  }
  const tl = [...biomeTL.map(b => [r3(b.t), 'biome', b.name]), ...phaseChanges.map(p => [r3(p.t), 'phase', p.name])];
  const PRIO = { biome: 0, phase: 1, note: 2 };
  const all = [...tl, ...notes].sort((a, b) => (a[0] - b[0]) || (PRIO[a[1]] - PRIO[b[1]]));
  let out = '// AUTO-GENERATED da export-midi.mjs (stesso take dei MIDI) — non editare a mano\n';
  out += `~sampleRate = 48000;\n~tail = 6.0;\n~duration = ${r3(totalSec)};\n~score = [\n`;
  for (const e of all) {
    if (e[1] === 'biome') out += `    [${e[0]}, \\biome, \\${e[2]}],\n`;
    else if (e[1] === 'phase') out += `    [${e[0]}, \\phase, \\${e[2]}],\n`;
    else out += `    [${e[0]}, \\note, \\${e[2]}, ${e[3]}, ${e[4]}, ${e[5]}],\n`;
  }
  out += '];\n';
  writeFileSync(scorePath, out);
}
writeScore(resolve(__dir, 'score-full.scd'));

// ── scrittura ──
mkdirSync(outDir, { recursive: true });
const bounds = [...biomeTL.map(b => b.t), totalSec];   // [0, t1, t2, ..., end]

// full album
writeFileSync(resolve(outDir, 'MACHINE-III_full.mid'), buildSMF(session.midi, tempoTL, biomeTL, 0, totalSec + 0.001));

// per-bioma
for (let i = 0; i < biomeTL.length; i++) {
  const name = biomeTL[i].name;
  const a = biomeTL[i].t;
  const b = (i + 1 < biomeTL.length) ? biomeTL[i + 1].t : totalSec + 0.001;
  const nn = String(i + 1).padStart(2, '0');
  const buf = buildSMF(session.midi, tempoTL, biomeTL, a, b);
  writeFileSync(resolve(outDir, `${nn}_${name}.mid`), buf);
}

// ── report ──
const perCh = {};
for (const ev of session.midi) perCh[CH_NAME[ev.ch & 0x0f] || ('CH' + ev.ch)] = (perCh[CH_NAME[ev.ch & 0x0f]] || 0) + 1;
console.log(`[midi] simulated ${totalSec.toFixed(1)}s, ${session.midi.length} note events`);
console.log(`[midi] tempo map: ${tempoTL.length} changes (${tempoTL.map(t => Math.round(t.bpm)).join('→')} bpm)`);
console.log(`[midi] biomes: ${biomeTL.map(b => b.name).join(', ')}`);
console.log(`[midi] notes per channel:`, JSON.stringify(perCh));
console.log(`[midi] written: ${outDir}/ (1 full + ${biomeTL.length} per-bioma)`);
