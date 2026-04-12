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
  bg: [30, 24, 18],                // dark terracotta (was smoked olive)
  colors: {
    drone:      [0,   0,   0],     // assente
    bass:       [255, 122,  26],   // orange saturo
    chord:      [106,  94,  56],   // dirty brass — sedimento
    kick:       [220,  80,  10],   // terra bruciata
    percussion: [0,   0,   0],     // assente in SOLCO
    arp:        [255, 200,  80],   // warm amber (was chartreuse)
    voice:      [240, 210, 130],   // cream-gold (was chartreuse)
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
        const cx = Math.floor(h.CELLS_X * (z[0] + Math.random() * (z[1] - z[0])));
        particles.chord.push({
          cx, halfW: 2, cy: h.CELLS_Y * 0.50,
          vy: 0.07,
          f: (vel127 / 127) * 0.11,
          headF: (vel127 / 127) * 0.55,
        });
      }
    },

    // Bass: blob w×3, registro [24-43] mappato localmente, X varia per nota
    bass(fields, particles, note127, vel127, h) {
      const noteN = h.clamp(note127, 24, 43);
      const cy = h.localPitchToCell(noteN, 24, 43);
      const cx = Math.round((noteN - 24) / (43 - 24) * (h.CELLS_X - 1));
      const velN = vel127 / 127;
      const w = Math.round(3 + velN * 2);
      h.depositBlob(fields.bass, cx, cy, w, 3, velN * 0.75);
    },

    // Kick: riga orizzontale a Y=0.70, lampo
    kick(fields, particles, note127, vel127, h) {
      const cy = Math.round(h.CELLS_Y * 0.70);
      h.depositRow(fields.kick, cy, 0.80);
    },

    // Arp: particella che cade, X random, Y=pitch [60-84] → [0.34-0.53]
    arp(fields, particles, note127, vel127, h) {
      const noteN = h.clamp(note127, 60, 84);
      const cy = (1 - noteN / 127) * (h.CELLS_Y - 1);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      particles.arp.push({
        cx, cy, vy: 0.05,
        f: (vel127 / 127) * 0.25,
      });
    },

    // Voice: rarissima, banda h=1 a metà canvas, non cade
    voice(fields, particles, note127, vel127, h) {
      const cy = h.pitchToCell(note127);
      const cx0 = Math.floor(h.CELLS_X * 0.25);
      const cx1 = Math.floor(h.CELLS_X * 0.75);
      for (let cx = cx0; cx <= cx1; cx++) {
        h.depositPoint(fields.voice, cx, cy, (vel127 / 127) * 0.50);
      }
    },
  },
};

// ── NEBBIA ── C lydian, no BPM — 90% vuoto nero, gocce di voce
// "Ti ambienta" — il concerto è iniziato senza avvisarti.
// Drone = campo uniforme (stelle formate). Voice = punti isolati.
// Lead = scie brevi. Chord = velatura orizzontale tenue.
const NEBBIA = {
  bg: [10, 10, 10],               // #0A0A0A quasi nero
  colors: {
    drone:      [155, 143, 206],   // #9B8FCE lavanda — stelle formate
    bass:       [0,   0,   0],     // assente
    chord:      [220, 215, 200],   // velatura cream luminosa
    kick:       [0,   0,   0],     // assente
    percussion: [0,   0,   0],     // assente
    arp:        [0,   0,   0],     // assente
    voice:      [255, 252, 245],   // quasi bianco puro — protagonista
    lead:       [240, 235, 250],   // bianco freddo / lavanda
  },
  decay: {
    drone:      0.9985,  // lento ma non eterno — le stelle si formano e svaniscono
    bass:       1.000,   // assente
    chord:      0.9992,  // velatura persiste quanto la nota suonata (~8s)
    kick:       1.000,   // assente
    percussion: 1.000,   // assente
    arp:        1.000,   // assente
    voice:      0.9988,  // gocce restano visibili più a lungo (~5s)
    lead:       0.997,   // scie svaniscono dopo la voice (~3s)
  },
  force: {
    drone: 0.003,   // bassissimo, campo uniforme
    bass:  0,
    chord: 0.20,    // velatura visibile
    kick:  0,
    percussion: 0,
    arp:   0,
    voice: 0.45,    // punti isolati ma visibili
    lead:  0.30,    // scie
  },
  // Audio-reactive: ogni frame, il drone respira con l'energia audio
  audioReact(fields, energy, h) {
    const n = h.CELLS_X * h.CELLS_Y;
    // wash proporzionale all'audio: silenzio = niente, suono = lavanda cresce
    const f = energy * 0.004;
    if (f < 0.0001) return;
    for (let i = 0; i < n; i++) {
      const v = fields.drone[i] + f;
      fields.drone[i] = v > 1 ? 1 : v;
    }
  },

  depositFn: {
    // Drone: stelle formate — ogni nota MIDI crea un cluster locale
    drone(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 36, 72);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositBlob(fields.drone, cx, cy, 6, 5, (vel127 / 127) * 0.02);
    },

    // Voice: goccia isolata — punto singolo, X quasi random
    voice(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 67, 84);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.voice, cx, cy, (vel127 / 127) * 0.45);
    },

    // Lead: scia breve orizzontale, 2–4 celle con fade
    lead(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 72, 88);
      const cx = Math.floor(Math.random() * (h.CELLS_X - 4));
      const len = 2 + Math.floor(Math.random() * 3);
      const f = (vel127 / 127) * 0.30;
      for (let dx = 0; dx < len; dx++) {
        h.depositPoint(fields.lead, cx + dx, cy, f * (1 - dx / len));
      }
    },

    // Chord: riga orizzontale tenue a pitch→Y (velatura)
    chord(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 55, 72);
      h.depositRow(fields.chord, cy, (vel127 / 127) * 0.20);
    },
  },
  // NEBBIA: massimo contrasto di grana — drone grosso, voice fine
  cellPx: {
    drone: 20, voice: 6, lead: 7, chord: 12,
  },
};

// ══════════════════════════════════════════════════════════════
//  TESSUTO — D aeolian 86 BPM — "qualcosa emerge"
//  Fisica: tensione orizzontale. Le fibre non cadono — pulsano.
//  Immagine: tessuto muscolare al microscopio, fasci che battono.
//  Chord = protagonista ritmico (telaio staccato). Lead = voce.
// ══════════════════════════════════════════════════════════════
const TESSUTO = {
  bg: [32, 19, 13],                // #20130D marrone caldo
  colors: {
    drone:      [60,  50,  35],    // fibra scura in basso
    bass:       [160, 130,  60],   // ambra calda
    chord:      [205, 215,  29],   // #CDD71D lime — protagonista
    kick:       [239, 230, 222],   // cream flash
    percussion: [180, 170, 150],   // sottile
    arp:        [0,   0,   0],     // assente
    voice:      [0,   0,   0],     // TACE in TESSUTO
    lead:       [239, 230, 222],   // #EFE6DE cream — voce melodica
  },
  decay: {
    drone:      0.9995,
    bass:       0.993,    // sostenuto, segue armonia
    chord:      0.980,    // staccato — decade veloce (righe appaiono e scompaiono)
    kick:       0.600,    // impulso brevissimo
    percussion: 0.700,
    arp:        1.000,    // assente
    voice:      1.000,    // TACE
    lead:       0.993,    // frasi medie
  },
  force: {
    drone: 0.005,  bass: 0.50,  chord: 0.65,
    kick: 0.70,    percussion: 0.40,
    arp: 0,        voice: 0,    lead: 0.45,
  },
  depositFn: {
    // Drone: fibra sottilissima quasi statica — riga tenue in zona grave
    drone(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 38, 72);
      h.depositRow(fields.drone, cy, 0.005);
    },

    // Chord: righe staccato (telaio) — larghezza intera, Y da pitch
    chord(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 50, 67);
      h.depositRow(fields.chord, cy, (vel127 / 127) * 0.65);
    },

    // Lead: punti alti — singola cella, Y da pitch, X variabile
    lead(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 62, 79);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.lead, cx, cy, (vel127 / 127) * 0.45);
      // secondo punto vicino — coppia
      h.depositPoint(fields.lead, cx + 1, cy, (vel127 / 127) * 0.30);
    },

    // Kick: impulso — riga sottile a Y fisso
    kick(fields, particles, note127, vel127, h) {
      h.depositRow(fields.kick, Math.floor(h.CELLS_Y * 0.78), 0.70);
    },

    // Bass: segmento orizzontale spesso a Y da pitch
    bass(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 26, 45);
      const cx0 = Math.floor(h.CELLS_X * 0.15);
      const cx1 = Math.floor(h.CELLS_X * 0.85);
      const f = (vel127 / 127) * 0.50;
      for (let cx = cx0; cx <= cx1; cx++) {
        h.depositPoint(fields.bass, cx, cy, f);
        h.depositPoint(fields.bass, cx, cy + 1, f * 0.5);
      }
    },
  },
};

// ══════════════════════════════════════════════════════════════
//  RESPIRO — C ionian, no BPM — "pausa"
//  Fisica: pressione di campo INVERTITA. Il campo è PIENO.
//  Le note creano PORI (buchi) che si richiudono per tensione
//  superficiale. Il silenzio = pienezza. La musica = assenza.
//  Immagine: bolla di sapone vista dall'interno.
// ══════════════════════════════════════════════════════════════
const RESPIRO = {
  bg: [123, 186, 145],            // #7BBA91 sage
  colors: {
    drone:      [26,  26,  26],   // #1A1A1A quasi-nero — la membrana
    bass:       [0,   0,   0],    // scrive su drone (pori)
    chord:      [0,   0,   0],    // scrive su drone (increspature)
    kick:       [0,   0,   0],    // assente
    percussion: [0,   0,   0],    // assente
    arp:        [0,   0,   0],    // assente
    voice:      [0,   0,   0],    // scrive su drone (pori)
    lead:       [0,   0,   0],    // scrive su drone (pori piccoli)
  },
  decay: {
    drone:      1.000,   // no decay — audioReact gestisce il self-heal
    bass:       1.000,   chord: 1.000,   kick: 1.000,
    percussion: 1.000,   arp: 1.000,
    voice:      1.000,   lead: 1.000,
  },
  force: {
    drone: 0,  bass: 1,  chord: 1,
    kick: 0,   percussion: 0,  arp: 0,
    voice: 1,  lead: 1,   // token — depositFn gestisce i valori reali
  },

  // Tensione superficiale: il campo si richiude verso 0.75
  audioReact(fields, energy, h) {
    const target = 0.75;
    const heal = 0.006 + energy * 0.004; // più suono → richiude più veloce
    const n = h.CELLS_X * h.CELLS_Y;
    for (let i = 0; i < n; i++) {
      if (fields.drone[i] < target) {
        fields.drone[i] += heal;
        if (fields.drone[i] > target) fields.drone[i] = target;
      }
    }
  },

  depositFn: {
    // Voice: poro circolare — buca nella membrana
    voice(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 67, 84);
      const cx = Math.floor(h.CELLS_X * 0.2 + Math.random() * h.CELLS_X * 0.6);
      const r = 2 + Math.floor((vel127 / 127) * 2);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r) {
            const px = cx + dx, py = cy + dy;
            if (px >= 0 && px < h.CELLS_X && py >= 0 && py < h.CELLS_Y) {
              fields.drone[py * h.CELLS_X + px] = 0;
            }
          }
        }
      }
    },

    // Lead: pori più piccoli, posizione spostata
    lead(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 72, 84);
      const cx = Math.floor(h.CELLS_X * 0.3 + Math.random() * h.CELLS_X * 0.4);
      const r = 1 + Math.floor((vel127 / 127));
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r) {
            const px = cx + dx, py = cy + dy;
            if (px >= 0 && px < h.CELLS_X && py >= 0 && py < h.CELLS_Y) {
              fields.drone[py * h.CELLS_X + px] = 0;
            }
          }
        }
      }
    },

    // Bass: poro largo, lento a richiudersi (il heal è lo stesso ma il buco è grosso)
    bass(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 36, 48);
      const cx = Math.floor(h.CELLS_X / 2 + (Math.random() - 0.5) * 8);
      const r = 3 + Math.floor((vel127 / 127) * 2);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r) {
            const px = cx + dx, py = cy + dy;
            if (px >= 0 && px < h.CELLS_X && py >= 0 && py < h.CELLS_Y) {
              fields.drone[py * h.CELLS_X + px] = 0;
            }
          }
        }
      }
    },

    // Chord: increspatura — riduce leggermente la membrana lungo una riga
    chord(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 60, 77);
      const reduction = (vel127 / 127) * 0.25;
      for (let cx = 0; cx < h.CELLS_X; cx++) {
        const i = cy * h.CELLS_X + cx;
        fields.drone[i] = Math.max(0, fields.drone[i] - reduction);
      }
    },
  },
  // RESPIRO: membrana elastica, solo altissime si solidificano
  freeze: {
    densityThreshold: 0.9,
  },
};

// ══════════════════════════════════════════════════════════════
//  MACCHINA — D dorian 129 BPM — "sei dentro"
//  Fisica: NESSUNA. Zero drift, zero inertia. Snap a griglia.
//  Griglia sempre visibile (density 0.05 in silenzio).
//  Arp = protagonista, illumina celle come partitura.
//  Immagine: scheda madre durante l'avvio.
// ══════════════════════════════════════════════════════════════
const MACCHINA = {
  bg: [26, 26, 46],               // #1A1A2E navy
  colors: {
    drone:      [40,  40,  60],   // navy chiaro — griglia base
    bass:       [248, 237,   0],  // #F8ED00 giallo
    chord:      [100, 100, 140],  // navy sfumato
    kick:       [248, 237,   0],  // giallo flash
    percussion: [221,  58,  68],  // #DD3A44 pink accent
    arp:        [248, 237,   0],  // giallo — protagonista
    voice:      [221,  58,  68],  // pink accent
    lead:       [221,  58,  68],  // pink accent
  },
  decay: {
    drone:      1.000,   // audioReact gestisce la griglia base
    bass:       0.920,   // rolling pump — decade veloce
    chord:      0.970,
    kick:       0.500,   // flash brevissimo
    percussion: 0.600,
    arp:        0.900,   // 16th — deve liberare per la nota dopo
    voice:      0.950,
    lead:       0.950,
  },
  force: {
    drone: 0,  bass: 0.80,  chord: 0.35,
    kick: 0.95,  percussion: 0.60,
    arp: 0.90,   voice: 0.70,  lead: 0.50,
  },

  // Griglia sempre visibile — base 0.05
  audioReact(fields, energy, h) {
    const base = 0.05;
    const n = h.CELLS_X * h.CELLS_Y;
    for (let i = 0; i < n; i++) {
      if (fields.drone[i] < base) {
        fields.drone[i] = base;
      }
    }
  },

  depositFn: {
    // Arp: singola cella snap, X deterministico da nota (partitura leggibile)
    arp(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 62, 81);
      const cx = note127 % h.CELLS_X;
      h.depositPoint(fields.arp, cx, cy, (vel127 / 127) * 0.90);
    },

    // Kick: riga intera lampeggia
    kick(fields, particles, note127, vel127, h) {
      h.depositRow(fields.kick, Math.floor(h.CELLS_Y * 0.75), 0.95);
    },

    // Bass: colonna dalla base (metà inferiore)
    bass(fields, particles, note127, vel127, h) {
      const cx = h.localPitchToCell(note127, 26, 45);
      const f = (vel127 / 127) * 0.80;
      for (let cy = Math.floor(h.CELLS_Y * 0.5); cy < h.CELLS_Y; cy++) {
        h.depositPoint(fields.bass, cx, cy, f);
      }
    },

    // Percussion: accenti sparsi su una riga
    percussion(fields, particles, note127, vel127, h) {
      const cy = Math.floor(h.CELLS_Y * 0.30);
      const step = 4;
      for (let cx = 0; cx < h.CELLS_X; cx += step) {
        h.depositPoint(fields.percussion, cx, cy, (vel127 / 127) * 0.60);
      }
    },

    // Voice: dot accent singolo
    voice(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 62, 79);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.voice, cx, cy, (vel127 / 127) * 0.70);
    },

    // Lead: dot accent singolo
    lead(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 69, 88);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.lead, cx, cy, (vel127 / 127) * 0.50);
    },

    // Chord: blocco 2×2 snap a griglia
    chord(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 50, 67);
      const cx = (note127 * 3) % h.CELLS_X;
      const f = (vel127 / 127) * 0.35;
      h.depositPoint(fields.chord, cx, cy, f);
      h.depositPoint(fields.chord, cx + 1, cy, f);
      h.depositPoint(fields.chord, cx, cy + 1, f);
      h.depositPoint(fields.chord, cx + 1, cy + 1, f);
    },
  },
  // MACCHINA: griglia uniforme, niente stratigrafia, niente aging
  cellPx: {
    drone: 10, bass: 10, chord: 10,
    kick: 10, percussion: 10,
    arp: 10, voice: 10, lead: 10,
  },
  freeze: {
    spatial: false,      // niente stratigrafia — la griglia è uniforme
  },
};

// ══════════════════════════════════════════════════════════════
//  TEMPESTA — E phrygian 129 BPM — "balli"
//  Fisica: densità massima. Tutto attivo, tutto forte.
//  Voice+lead hocket (bianco/carmine alternati).
//  Immagine: aurora boreale resa in bianco/nero/carmine.
// ══════════════════════════════════════════════════════════════
const TEMPESTA = {
  bg: [0, 0, 0],                   // nero puro
  colors: {
    drone:      [60,  60,  60],    // grigio base
    bass:       [255, 255, 255],   // bianco
    chord:      [180, 180, 180],   // grigio chiaro
    kick:       [255, 255, 255],   // bianco flash
    percussion: [145,   1,  15],   // #91010F carmine
    arp:        [120, 120, 120],   // grigio texture
    voice:      [255, 255, 255],   // bianco — hocket 1
    lead:       [145,   1,  15],   // carmine — hocket 2
  },
  decay: {
    drone:      0.998,
    bass:       0.970,
    chord:      0.985,
    kick:       0.500,    // flash
    percussion: 0.600,
    arp:        0.920,    // texture veloce
    voice:      0.988,    // hocket
    lead:       0.985,    // hocket
  },
  force: {
    drone: 0.010,  bass: 0.85,  chord: 0.40,
    kick: 0.95,    percussion: 0.65,
    arp: 0.30,     voice: 0.70,  lead: 0.60,
  },
  depositFn: {
    // Voice: scia orizzontale 3 celle — bianco (hocket parte 1)
    voice(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 64, 81);
      const cx = Math.floor(Math.random() * (h.CELLS_X - 3));
      const f = (vel127 / 127) * 0.70;
      for (let dx = 0; dx < 3; dx++) {
        h.depositPoint(fields.voice, cx + dx, cy, f * (1 - dx * 0.3));
      }
    },

    // Lead: scia orizzontale 3 celle — carmine (hocket parte 2)
    lead(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 72, 93);
      const cx = Math.floor(Math.random() * (h.CELLS_X - 3));
      const f = (vel127 / 127) * 0.60;
      for (let dx = 0; dx < 3; dx++) {
        h.depositPoint(fields.lead, cx + dx, cy, f * (1 - dx * 0.3));
      }
    },

    // Kick: riga intera, massima forza
    kick(fields, particles, note127, vel127, h) {
      h.depositRow(fields.kick, Math.floor(h.CELLS_Y * 0.72), 0.95);
    },

    // Bass: blob denso — quasi ogni beat
    bass(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 28, 47);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositBlob(fields.bass, cx, cy, 3, 2, (vel127 / 127) * 0.85);
    },

    // Percussion: carmine flash sparso
    percussion(fields, particles, note127, vel127, h) {
      const cy = Math.floor(h.CELLS_Y * 0.25 + Math.random() * h.CELLS_Y * 0.5);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.percussion, cx, cy, (vel127 / 127) * 0.65);
      h.depositPoint(fields.percussion, cx + 1, cy, (vel127 / 127) * 0.45);
    },

    // Arp: texture — punti sparsi
    arp(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 64, 84);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.arp, cx, cy, (vel127 / 127) * 0.30);
    },

    // Chord: riga parziale
    chord(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 52, 69);
      const cx0 = Math.floor(Math.random() * h.CELLS_X * 0.3);
      const f = (vel127 / 127) * 0.40;
      for (let cx = cx0; cx < cx0 + Math.floor(h.CELLS_X * 0.4); cx++) {
        h.depositPoint(fields.chord, cx, cy, f);
      }
    },

    // Drone: deposito lento diffuso
    drone(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 40, 64);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositBlob(fields.drone, cx, cy, 5, 4, 0.010);
    },
  },
  // TEMPESTA: turbolenza, nulla cristallizza
  freeze: {
    roleEnabled: false,  // nulla cristallizza per silenzio
  },
};

// ══════════════════════════════════════════════════════════════
//  RITORNO — A aeolian 86 BPM — "ti rilascia"
//  Non è un bioma: è il congedo. Preserva il sedimento dei biomi
//  precedenti (campo.js già non resetta i fields al switch).
//  Voice esposta come NEBBIA. Arp muore. Tutto decade verso zero.
//  Immagine: Pale Blue Dot. Lavanda e crema su nero.
// ══════════════════════════════════════════════════════════════
const RITORNO = {
  bg: [10, 10, 10],               // come NEBBIA — il cerchio si chiude
  colors: {
    drone:      [100,  90, 130],   // lavanda scuro
    bass:       [155, 143, 206],   // lavanda
    chord:      [180, 170, 160],   // cream scuro
    kick:       [200, 190, 180],   // cream
    percussion: [150, 140, 130],
    arp:        [155, 143, 206],   // lavanda (morente)
    voice:      [255, 252, 245],   // quasi bianco — protagonista esposta
    lead:       [200, 195, 210],   // cream freddo
  },
  decay: {
    drone:      0.998,
    bass:       0.990,
    chord:      0.993,
    kick:       0.600,
    percussion: 0.700,
    arp:        0.950,    // decade veloce — muore
    voice:      0.996,    // persiste più di tutto — il cuore
    lead:       0.990,
  },
  force: {
    drone: 0.005,  bass: 0.40,  chord: 0.30,
    kick: 0.50,    percussion: 0.30,
    arp: 0.15,     voice: 0.50,  lead: 0.30,
  },
  depositFn: {
    // Voice: goccia isolata come NEBBIA — il protagonista esposto
    voice(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 64, 81);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.voice, cx, cy, (vel127 / 127) * 0.50);
    },

    // Lead: eco lontana — punto più piccolo, più raro
    lead(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 69, 84);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.lead, cx, cy, (vel127 / 127) * 0.30);
    },

    // Arp: morente — punti debolissimi che spariscono
    arp(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 60, 79);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.arp, cx, cy, (vel127 / 127) * 0.15);
    },

    // Bass: gocce sparse — 2 hit su 16 step, il più sparso della suite
    bass(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 33, 50);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositPoint(fields.bass, cx, cy, (vel127 / 127) * 0.40);
      h.depositPoint(fields.bass, cx, cy + 1, (vel127 / 127) * 0.20);
    },

    // Kick: impulso sparso
    kick(fields, particles, note127, vel127, h) {
      const cy = Math.floor(h.CELLS_Y * 0.75);
      h.depositRow(fields.kick, cy, 0.50);
    },

    // Chord: velatura come NEBBIA ma più calda
    chord(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 55, 72);
      h.depositRow(fields.chord, cy, (vel127 / 127) * 0.30);
    },

    // Drone: blob diffuso come NEBBIA
    drone(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 45, 69);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositBlob(fields.drone, cx, cy, 5, 4, (vel127 / 127) * 0.008);
    },
  },
  // RITORNO: tutto diventa geologico progressivamente
  freeze: {
    globalFactor: 0.5,
  },
};

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
