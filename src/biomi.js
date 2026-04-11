// ═══════════════════════════════════════════════════════════
//  MACH:INE III — Biomi preset for Campo Materiale
//
//  Ogni bioma definisce la fisica visiva del suo territorio:
//  colori per ruolo, decay, forze di deposito, funzioni custom
//  di deposito per gestire forme speciali (colonnine chord,
//  blob bass pitch→X, ecc.).
//
//  Ruoli canonici: drone, bass, chord, kick, percussion, arp,
//  voice, lead. Un ruolo assente si dichiara con decay=1 e
//  colors=[0,0,0] — campo.js lo skipperà.
//
//  I 5 biomi non ancora progettati usano GENERIC come fallback
//  così il sistema gira sempre, e li calibreremo uno per uno.
// ═══════════════════════════════════════════════════════════

// ── GENERIC ── fallback sicuro, tutti i ruoli attivi
const GENERIC = {
  bg: [18, 16, 14],
  colors: {
    drone:      [30,  28,  22],
    bass:       [180, 100,  20],
    chord:      [200, 190, 170],
    kick:       [255, 255, 240],
    percussion: [220, 220, 200],
    arp:        [200, 220, 255],
    voice:      [240, 230, 210],
    lead:       [180, 200, 240],
  },
  decay: {
    drone: 0.9999, bass: 0.985, chord: 0.990,
    kick: 0.600, percussion: 0.700,
    arp: 0.930, voice: 0.993, lead: 0.990,
  },
  force: {
    drone: 0.004, bass: 0.75, chord: 0.40,
    kick: 0.85, percussion: 0.55,
    arp: 0.30, voice: 0.55, lead: 0.35,
  },
  // depositFn override per ruolo — null = usa generic in campo.js
  depositFn: {},
};

// ── SOLCO ── G dorian 129 BPM — legge del dub: kick/bass alternati
// Calibrato dal proto-campo sandbox il 2026-04-10.
const SOLCO = {
  bg: [26, 33, 28],                // smoked olive
  colors: {
    drone:      [0,   0,   0],     // assente
    bass:       [255, 122,  26],   // orange saturo
    chord:      [106,  94,  56],   // dirty brass — sedimento
    kick:       [220,  80,  10],   // terra bruciata
    percussion: [0,   0,   0],     // assente in SOLCO
    arp:        [213, 255,  87],   // chartreuse
    voice:      [213, 255,  87],
    lead:       [0,   0,   0],     // assente
  },
  decay: {
    drone: 1.000,
    bass:  0.988,
    chord: 0.997,
    kick:  0.600,
    percussion: 1.000,
    arp:   0.879,
    voice: 0.992,
    lead:  1.000,
  },
  force: {
    drone: 0,
    bass:  0.75,
    chord: 0.11,      // forza scia bassa (la testa è più alta)
    kick:  0.80,
    percussion: 0,
    arp:   0.25,
    voice: 0.50,
    lead:  0,
  },

  // Depositors custom — ricevono (fields, particles, note127, vel127, helpers)
  depositFn: {
    // Chord: 3 colonnine verticali in zone X fisse, parti da metà canvas, cadono
    chord(fields, particles, note127, vel127, h) {
      const intervals = [-7, 0, 4];
      const ZONES = [[0.12, 0.28], [0.38, 0.55], [0.62, 0.78]];
      for (let i = 0; i < intervals.length; i++) {
        const noteP = h.clamp(note127 + intervals[i], 24, 84);
        const z = ZONES[i];
        const cx = Math.floor(h.CELLS * (z[0] + Math.random() * (z[1] - z[0])));
        particles.chord.push({
          cx, halfW: 2, cy: h.CELLS * 0.50,
          vy: 0.07,
          f: (vel127 / 127) * 0.11,
          headF: (vel127 / 127) * 0.55,
        });
      }
    },

    // Bass: blob w×3, MIDI [24-43] → Y [0.81-0.66], X varia per nota
    bass(fields, particles, note127, vel127, h) {
      const noteN = h.clamp(note127, 24, 43);
      const cy = Math.round((1 - noteN / 127) * (h.CELLS - 1));
      const cx = Math.round((noteN - 24) / (43 - 24) * (h.CELLS - 1));
      const velN = vel127 / 127;
      const w = Math.round(3 + velN * 2);
      h.depositBlob(fields.bass, cx, cy, w, 3, velN * 0.75);
    },

    // Kick: riga orizzontale a Y=0.70, lampo
    kick(fields, particles, note127, vel127, h) {
      const cy = Math.round(h.CELLS * 0.70);
      h.depositRow(fields.kick, cy, 0.80);
    },

    // Arp: particella che cade, X random, Y=pitch [60-84] → [0.34-0.53]
    arp(fields, particles, note127, vel127, h) {
      const noteN = h.clamp(note127, 60, 84);
      const cy = (1 - noteN / 127) * (h.CELLS - 1);
      const cx = Math.floor(Math.random() * h.CELLS);
      particles.arp.push({
        cx, cy, vy: 0.05,
        f: (vel127 / 127) * 0.25,
      });
    },

    // Voice: rarissima, banda h=1 a metà canvas, non cade
    voice(fields, particles, note127, vel127, h) {
      const cy = h.pitchToCell(note127);
      const cx0 = Math.floor(h.CELLS * 0.25);
      const cx1 = Math.floor(h.CELLS * 0.75);
      for (let cx = cx0; cx <= cx1; cx++) {
        h.depositPoint(fields.voice, cx, cy, (vel127 / 127) * 0.50);
      }
    },
  },
};

// ── Placeholder per biomi da progettare ──
// Per ora: copia di GENERIC. Li sostituiremo uno per uno.
const NEBBIA   = GENERIC;
const TESSUTO  = GENERIC;
const RESPIRO  = GENERIC;
const MACCHINA = GENERIC;
const TEMPESTA = GENERIC;
const RITORNO  = GENERIC;

export const BIOMI = {
  GENERIC,
  NEBBIA,
  TESSUTO,
  SOLCO,
  RESPIRO,
  MACCHINA,
  TEMPESTA,
  RITORNO,
};

export function getBiome(trackName) {
  return BIOMI[trackName] || GENERIC;
}
