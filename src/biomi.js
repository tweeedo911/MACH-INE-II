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

// ── SOLCO ── G dorian 129 BPM — legge del dub: IMPATTO VERTICALE + ECO DELAY
// Fisica: GRAVITÀ + ECO. Tutto cade. Tutto ha un'eco spostata a destra.
// Il bass non è una banda — è una COLONNA VERTICALE che sbatte giù.
// L'eco dub è lo spostamento X: tempo = spazio orizzontale.
// L'orizzonte a Y 65% divide cielo (vuoto) da terra (sedimento).
const SOLCO = {
  bg: [14, 10, 8],                  // nero caldo — più scuro (spazio profondo dub)
  colors: {
    drone:      [40,  30,  20],    // terra scurissima — sedimento antico
    bass:       [255, 107,  10],   // arancio SATURO PIENO — il protagonista
    chord:      [180, 140,  50],   // ambra calda — sedimento dorato
    kick:       [255, 200, 160],   // cream caldo — distinto dal bass arancio
    percussion: [0,   0,   0],     // assente in SOLCO
    arp:        [200, 170,  70],   // oro opaco — polvere che cade
    voice:      [255, 240, 200],   // cream brillante — raro, prezioso
    lead:       [0,   0,   0],     // assente
  },
  decay: {
    drone: 0.9997,   // quasi permanente — il terreno è eterno
    bass:  0.985,    // le colonne persistono abbastanza da essere lette con gli echi
    chord: 0.993,    // sedimento medio
    kick:  0.550,    // flash + faglia breve
    percussion: 1.000,
    arp:   0.870,    // polvere effimera
    voice: 0.990,    // rara ma persiste
    lead:  1.000,
  },
  force: {
    drone: 0.005,
    bass:  0.85,     // FORTE — è il protagonista, deve dominare
    chord: 0.15,
    kick:  0.90,
    percussion: 0,
    arp:   0.25,
    voice: 0.55,
    lead:  0,
  },

  depositFn: {
    // ── FASCE VERTICALI SOLCO ──
    // cielo:     Y 0-40%   (vuoto, arp in caduta, voice rare)
    // orizzonte: Y 40%     (chord si deposita qui)
    // terra:     Y 40-100% (bass sbatte, kick scuote, drone sedimenta)

    // Drone: TERRENO — blob sparsi nella metà inferiore. Il suolo su cui tutto si accumula.
    drone(fields, particles, note127, vel127, h) {
      const minY = Math.floor(h.CELLS_Y * 0.55);
      const cy = minY + Math.floor(Math.random() * (h.CELLS_Y - minY - 2));
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositBlob(fields.drone, cx, cy, 3, 2, 0.005);
    },

    // Bass: COLONNA VERTICALE che sbatte giù + 2-3 ECHI spostati a destra
    // Il gesto fondamentale del dub: il sub cade e l'eco lo insegue nel tempo (= X)
    bass(fields, particles, note127, vel127, h) {
      const velN = vel127 / 127;
      const f = velN * 0.85;
      // Posizione X: random su tutto il campo
      const cx = Math.floor(Math.random() * (h.CELLS_X - 4));
      // COLONNA VERTICALE: larga 2-4 celle, da Y 20% a Y 85%
      // Più intensa in basso (dove sbatte) che in alto (dove cade)
      const colW = 2 + Math.floor(Math.random() * 3);
      const yTop = Math.floor(h.CELLS_Y * (0.15 + Math.random() * 0.10));
      const yBot = Math.floor(h.CELLS_Y * (0.80 + Math.random() * 0.10));
      for (let y = yTop; y <= yBot; y++) {
        const progress = (y - yTop) / (yBot - yTop);  // 0=top, 1=bottom
        const yForce = f * (0.15 + progress * 0.85);   // debole in alto, forte in basso
        for (let dx = 0; dx < colW; dx++) {
          h.depositPoint(fields.bass, cx + dx, y, yForce);
        }
      }
      // IMPATTO: splash orizzontale dove sbatte (±5 celle dal piede della colonna)
      for (let dx = -5; dx <= colW + 5; dx++) {
        const dist = dx < 0 ? -dx : (dx >= colW ? dx - colW + 1 : 0);
        if (dist > 0) {
          h.depositPoint(fields.bass, cx + dx, yBot, f * 0.4 / dist);
          h.depositPoint(fields.bass, cx + dx, yBot - 1, f * 0.2 / dist);
        }
      }
      // ECHI DUB: 2-3 colonne fantasma spostate a DESTRA (delay = tempo = X)
      const nEcho = 2 + Math.floor(Math.random() * 2);
      for (let e = 0; e < nEcho; e++) {
        const echoX = cx + (e + 1) * (6 + Math.floor(Math.random() * 4));
        const echoF = f * (0.35 / (e + 1));
        const echoW = Math.max(1, colW - e);
        const echoTop = yTop + (e + 1) * 3;  // ogni eco parte più in basso
        for (let y = echoTop; y <= yBot; y++) {
          const progress = (y - echoTop) / (yBot - echoTop);
          for (let dx = 0; dx < echoW; dx++) {
            h.depositPoint(fields.bass, echoX + dx, y, echoF * (0.2 + progress * 0.8));
          }
        }
      }
    },

    // Chord: deposito a pioggia — punti che piovono dal cielo e si accumulano all'orizzonte
    // NON colonnine con particelle (troppo simile a TESSUTO fibre) — punti sparsi che cadono
    chord(fields, particles, note127, vel127, h) {
      const velN = vel127 / 127;
      const cx = Math.floor(Math.random() * h.CELLS_X);
      // Deposita ISTANTANEAMENTE una colonna di punti sparsi (pioggia congelata)
      // da Y 5% a Y 50% — radi in alto, più densi verso l'orizzonte
      const f = velN * 0.18;
      for (let y = Math.floor(h.CELLS_Y * 0.05); y < Math.floor(h.CELLS_Y * 0.50); y++) {
        const depth = (y / h.CELLS_Y - 0.05) / 0.45;  // 0=top, 1=orizzonte
        // Probabilità di deposito cresce con la profondità
        if (Math.random() < depth * 0.4) {
          h.depositPoint(fields.chord, cx + Math.floor((Math.random() - 0.5) * 4), y, f * (0.3 + depth * 0.7));
        }
      }
      // Accumulo all'orizzonte: fascia densa di 3 celle
      const horY = Math.floor(h.CELLS_Y * 0.48);
      for (let dx = -2; dx <= 2; dx++) {
        h.depositPoint(fields.chord, cx + dx, horY, f * 0.6);
        h.depositPoint(fields.chord, cx + dx, horY + 1, f * 0.35);
        h.depositPoint(fields.chord, cx + dx, horY + 2, f * 0.15);
      }
    },

    // Kick: FAGLIA VERTICALE pura — nessuna riga orizzontale (quelle sono TESSUTO)
    // Una crepa che si apre dal basso verso l'alto, larga 3-5 celle, con aftershock
    kick(fields, particles, note127, vel127, h) {
      const faultX = Math.floor(Math.random() * h.CELLS_X);
      const faultW = 1 + Math.floor(Math.random() * 2);
      // Faglia principale: da Y 90% risale fino a Y 20-35%
      const yBot = Math.floor(h.CELLS_Y * 0.90);
      const yTop = Math.floor(h.CELLS_Y * (0.20 + Math.random() * 0.15));
      for (let y = yBot; y >= yTop; y--) {
        const progress = (yBot - y) / (yBot - yTop);
        const fForce = 0.85 * (1 - progress * 0.6);  // forte in basso, decade salendo
        // La faglia ondula leggermente
        const wobble = Math.round(Math.sin(y * 0.5) * 1.5);
        for (let dx = -faultW; dx <= faultW; dx++) {
          const dist = Math.abs(dx);
          h.depositPoint(fields.kick, faultX + dx + wobble, y, fForce * (1 - dist / (faultW + 1)));
        }
      }
      // Aftershock: 1-2 faglie parallele più deboli a ±8-15 celle
      const nAfter = 1 + Math.floor(Math.random() * 2);
      for (let a = 0; a < nAfter; a++) {
        const aX = faultX + (Math.random() < 0.5 ? 1 : -1) * (8 + Math.floor(Math.random() * 8));
        const aTop = yTop + Math.floor(Math.random() * 10);
        for (let y = yBot; y >= aTop; y -= 2) {
          h.depositPoint(fields.kick, aX, y, 0.30 * (1 - (yBot - y) / (yBot - aTop)));
        }
      }
    },

    // Arp: polvere in caduta libera — parte nel cielo (Y 5-25%) e scende
    arp(fields, particles, note127, vel127, h) {
      const startY = Math.floor(h.CELLS_Y * (0.05 + Math.random() * 0.20));
      const cx = Math.floor(Math.random() * h.CELLS_X);
      const n = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < n; j++) {
        particles.arp.push({
          cx: cx + Math.floor((Math.random() - 0.5) * 6),
          cy: startY + Math.floor((Math.random() - 0.5) * 4),
          vy: 0.06 + Math.random() * 0.05,
          f: (vel127 / 127) * 0.28,
        });
      }
    },

    // Voice: FLASH VERTICALE raro — una colonna sottile brillante (1-2 celle) che lampeggia
    // La voce in SOLCO è ogni 4 bar — quando arriva, è un fulmine nel cielo dub
    voice(fields, particles, note127, vel127, h) {
      const cx = Math.floor(Math.random() * h.CELLS_X);
      const f = (vel127 / 127) * 0.55;
      // Fulmine: colonna sottile da Y 5% a Y 55% (attraversa cielo e orizzonte)
      const yTop = Math.floor(h.CELLS_Y * 0.05);
      const yBot = Math.floor(h.CELLS_Y * (0.45 + Math.random() * 0.15));
      for (let y = yTop; y <= yBot; y++) {
        const wobble = Math.round(Math.sin(y * 0.8) * 1);
        h.depositPoint(fields.voice, cx + wobble, y, f * (0.5 + Math.random() * 0.5));
      }
      // Ramificazione: 1-2 branche corte laterali
      const nBranch = 1 + Math.floor(Math.random() * 2);
      for (let b = 0; b < nBranch; b++) {
        const brY = yTop + Math.floor(Math.random() * (yBot - yTop));
        const brDir = Math.random() < 0.5 ? -1 : 1;
        const brLen = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < brLen; i++) {
          h.depositPoint(fields.voice, cx + brDir * (i + 1), brY + i, f * 0.3 * (1 - i / brLen));
        }
      }
    },
  },
};

// ── NEBBIA ── C lydian, no BPM — 90% vuoto nero, gocce di voce
// "Ti ambienta" — il concerto è iniziato senza avvisarti.
// Drone = campo uniforme (stelle formate). Voice = punti isolati.
// Lead = scie brevi. Chord = velatura orizzontale tenue.
const NEBBIA = {
  bg: [4, 5, 12],                   // nero blu profondo — spazio freddo
  colors: {
    drone:      [60,  75, 130],    // blu-indaco — stelle fredde
    bass:       [0,   0,   0],     // assente
    chord:      [90, 110, 160],    // blu nebulare — velatura fredda
    kick:       [0,   0,   0],     // assente
    percussion: [0,   0,   0],     // assente
    arp:        [0,   0,   0],     // assente
    voice:      [170, 200, 255],   // blu-bianco ghiaccio — freddo e luminoso
    lead:       [130, 160, 220],   // blu chiaro — scia fredda
  },
  decay: {
    drone:      0.9982,  // stelle ~3s
    bass:       1.000,
    chord:      0.9970,  // velatura breve
    kick:       1.000,
    percussion: 1.000,
    arp:        1.000,
    voice:      0.9955,  // PIÙ EFFIMERE — ~1.5s, appaiono e svaniscono rapide
    lead:       0.992,   // scie brevi
  },
  force: {
    drone: 0.001,
    bass:  0,
    chord: 0.07,
    kick:  0,
    percussion: 0,
    arp:   0,
    voice: 0.60,    // luminose ma brevi (il decay le toglie presto)
    lead:  0.25,
  },
  maxDensity: {
    drone: 0.12, bass: 0, chord: 0.20, kick: 0, percussion: 0,
    arp: 0, voice: 0.55, lead: 0.35,
  },
  // Audio-reactive: respira SOLO dove drone è tra 0.03 e 0.14 — non amplifica oltre il cap
  audioReact(fields, energy, h) {
    if (energy < 0.01) return;
    const f = energy * 0.002;
    const n = h.CELLS_X * h.CELLS_Y;
    for (let i = 0; i < n; i++) {
      // respira solo dove c'è materia ma NON dove è già densa
      if (fields.drone[i] > 0.03 && fields.drone[i] < 0.14) {
        fields.drone[i] += f;
      }
    }
  },

  depositFn: {
    // Drone: stelle RARE con zona di esclusione morbida
    // Force FISSE (non dipendono da velocity scalata — NEBBIA non ha dinamica forte)
    drone(fields, particles, note127, vel127, h) {
      if (Math.random() > 0.45) return;  // 55% skip — meno aggressivo
      const cy = h.localPitchToCell(note127, 36, 72);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      // Zona di esclusione MORBIDA: threshold alzato a 0.10
      let neighborSum = 0, count = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (nx >= 0 && nx < h.CELLS_X && ny >= 0 && ny < h.CELLS_Y) {
            neighborSum += fields.drone[ny * h.CELLS_X + nx];
            count++;
          }
        }
      }
      if (count > 0 && neighborSum / count > 0.10) return;
      // Force FISSA (non vel-dependent): le stelle hanno sempre la stessa luminosità
      h.depositPoint(fields.drone, cx, cy, 0.025);
      if (Math.random() < 0.35) {
        const ox = Math.random() < 0.5 ? 1 : -1;
        h.depositPoint(fields.drone, cx + ox, cy, 0.012);
      }
    },

    // Voice: NEBULOSE — force FISSE per resistere al phase multiplier del germoglio
    // In NEBBIA la velocity musicale è bassa per design; il visuale non deve dipenderne
    voice(fields, particles, note127, vel127, h) {
      const t = h.clamp((note127 - 67) / (84 - 67), 0, 1);
      const baseY = Math.floor(h.CELLS_Y * (0.10 + (1 - t) * 0.75));
      const cy = h.clamp(baseY + Math.floor((Math.random() - 0.5) * h.CELLS_Y * 0.5), 2, h.CELLS_Y - 3);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      // Varietà: 40% gocce singole (brevi), 60% nebulose piccole (brevi).
      if (Math.random() < 0.4) {
        // Goccia: punto singolo che brilla e muore subito
        h.depositPoint(fields.voice, cx, cy, 0.45);
        if (Math.random() < 0.3) h.depositPoint(fields.voice, cx + 1, cy, 0.12);
      } else {
        // Nebulosa PICCOLA e BREVE — appare, si espande appena, svanisce
        particles.voice.push({
          cx, cy,
          r0: 1,
          rMax: 3 + Math.floor(Math.random() * 3),  // 3-5 celle (era 5-9)
          f: 0.07,
          age: 0,
          maxAge: 50 + Math.floor(Math.random() * 40),  // 50-90 frame (era 90-160)
        });
      }
    },

    // Lead: SCIA LENTA — force FISSA per resistere al phase multiplier
    lead(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 72, 88);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      const dir = Math.random() < 0.5 ? -1 : 1;
      particles.lead.push({
        cx, cy,
        vx: dir * (0.15 + Math.random() * 0.1),
        f: 0.20,  // force fissa
        age: 0,
        maxAge: 50 + Math.floor(Math.random() * 40),
      });
    },

    // Chord: velatura CORTA — 20-40% del canvas, non 60-80%
    // Le velature sono frammenti, non bande. Con gap irregolari.
    chord(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 55, 72);
      const width = Math.floor(h.CELLS_X * (0.15 + Math.random() * 0.25));  // 15-40%
      const start = Math.floor(Math.random() * (h.CELLS_X - width));
      const f = (vel127 / 127) * 0.10;
      for (let cx = start; cx < start + width; cx++) {
        // gap irregolari — ogni 3-5 celle salta
        if (Math.random() < 0.15) continue;
        h.depositPoint(fields.chord, cx, cy, f);
      }
    },
  },
  // NEBBIA: massimo contrasto di grana — drone grosso, voice fine
  cellPx: {
    drone: 20, voice: 6, lead: 7, chord: 14,
  },
};

// ══════════════════════════════════════════════════════════════
//  TESSUTO — D aeolian 86 BPM — "qualcosa emerge"
//  Fisica: tensione orizzontale. Le fibre non cadono — pulsano.
//  Immagine: tessuto muscolare al microscopio, fasci che battono.
//  Chord = protagonista ritmico (telaio staccato). Lead = voce.
// ══════════════════════════════════════════════════════════════
const TESSUTO = {
  bg: [18, 14, 24],                // viola-marrone FREDDO — distinto da SOLCO (caldo)
  colors: {
    drone:      [40,  35,  50],    // fibra scura violacea
    bass:       [160, 130, 180],   // lavanda scuro — tensione fredda (distinto da SOLCO arancio)
    chord:      [205, 215,  29],   // #CDD71D lime — protagonista staccato (invariato)
    kick:       [240, 235, 250],   // bianco-lavanda flash
    percussion: [140, 130, 150],   // sottile freddo
    arp:        [0,   0,   0],     // assente
    voice:      [0,   0,   0],     // TACE in TESSUTO
    lead:       [239, 230, 222],   // #EFE6DE cream — voce melodica (invariato)
  },
  decay: {
    drone:      0.9997,   // quasi permanente — trama di fondo
    bass:       0.994,    // sostenuto, tiene la nota
    chord:      0.965,    // staccato RAPIDO — appare, sparisce, battito visibile
    kick:       0.500,    // flash brevissimo — onda che svanisce subito
    percussion: 0.650,
    arp:        1.000,    // assente
    voice:      1.000,    // TACE
    lead:       0.991,    // frasi medie, visibili
  },
  force: {
    drone: 0.004,  bass: 0.55,  chord: 0.70,
    kick: 0.80,    percussion: 0.35,
    arp: 0,        voice: 0,    lead: 0.50,
  },
  depositFn: {
    // ── FASCE VERTICALI DEDICATE ──
    // lead:  Y 0.03–0.22  (spazio aereo, in alto)
    // chord: Y 0.15–0.55  (fibre protagoniste, fascia centrale larga)
    // bass:  Y 0.52–0.72  (fascia sostenuta)
    // kick:  Y 0.74        (orizzonte)
    // drone: Y 0.05–0.95  (sparse su tutto — il telaio)

    // Drone: fibre permanenti sparse su TUTTO il campo (non cluster)
    drone(fields, particles, note127, vel127, h) {
      // Mappa la nota su tutto il canvas (5-95%) — il telaio copre tutto
      const t = h.clamp((note127 - 38) / (72 - 38), 0, 1);
      const cy = Math.floor(h.CELLS_Y * (0.05 + (1 - t) * 0.90));
      for (let cx = 0; cx < h.CELLS_X; cx++) {
        h.depositPoint(fields.drone, cx, cy, 0.004);
      }
    },

    // Chord: FIBRE nella fascia centrale (Y 15-55%) — il protagonista staccato
    // Varietà: 50% continue, 30% tratteggiate, 20% doppie
    chord(fields, particles, note127, vel127, h) {
      // Fascia dedicata: note 50-67 → Y 15%-55%
      const t = h.clamp((note127 - 50) / (67 - 50), 0, 1);
      const cy = Math.floor(h.CELLS_Y * (0.15 + (1 - t) * 0.40));
      const f = (vel127 / 127) * 0.70;
      const width = Math.floor(h.CELLS_X * (0.25 + Math.random() * 0.75));
      const start = Math.floor(Math.random() * (h.CELLS_X - width));
      const roll = Math.random();
      if (roll < 0.5) {
        const thick = 1 + Math.floor(Math.random() * 2);
        for (let cx = start; cx < start + width; cx++) {
          h.depositPoint(fields.chord, cx, cy, f);
          for (let tt = 1; tt < thick; tt++) {
            if (cy + tt < h.CELLS_Y) h.depositPoint(fields.chord, cx, cy + tt, f * (0.5 / tt));
          }
        }
      } else if (roll < 0.8) {
        const gapLen = 4 + Math.floor(Math.random() * 4);
        for (let cx = start; cx < start + width; cx++) {
          if ((cx - start) % (gapLen * 2) >= gapLen) continue;
          h.depositPoint(fields.chord, cx, cy, f);
          if (cy + 1 < h.CELLS_Y) h.depositPoint(fields.chord, cx, cy + 1, f * 0.3);
        }
      } else {
        const gap = 2 + Math.floor(Math.random() * 2);
        for (let cx = start; cx < start + width; cx++) {
          h.depositPoint(fields.chord, cx, cy, f * 0.8);
          if (cy + gap < h.CELLS_Y) h.depositPoint(fields.chord, cx, cy + gap, f * 0.6);
        }
      }
    },

    // Lead: zona ALTA (Y 3-22%) — voce melodica nello spazio aereo, separata dalle fibre
    lead(fields, particles, note127, vel127, h) {
      const t = h.clamp((note127 - 62) / (79 - 62), 0, 1);
      const cy = Math.floor(h.CELLS_Y * (0.03 + (1 - t) * 0.19));
      const cx = Math.floor(Math.random() * h.CELLS_X);
      const f = (vel127 / 127) * 0.50;
      h.depositPoint(fields.lead, cx, cy, f);
      h.depositPoint(fields.lead, cx - 1, cy, f * 0.5);
      h.depositPoint(fields.lead, cx + 1, cy, f * 0.5);
      h.depositPoint(fields.lead, cx, cy - 1, f * 0.3);
    },

    // Kick: orizzonte a Y 74% — flash + eco sulle fibre chord sopra
    kick(fields, particles, note127, vel127, h) {
      const baseY = Math.floor(h.CELLS_Y * 0.74);
      h.depositRow(fields.kick, baseY, 0.80);
      h.depositRow(fields.kick, baseY - 1, 0.40);
      h.depositRow(fields.kick, baseY + 1, 0.40);
      // eco sulle fibre chord nella fascia sopra (Y 15-55%)
      let hits = 0;
      const maxHits = 2 + Math.floor(Math.random() * 2);
      const chordLo = Math.floor(h.CELLS_Y * 0.15);
      const chordHi = Math.floor(h.CELLS_Y * 0.55);
      for (let cy = chordLo; cy < chordHi && hits < maxHits; cy++) {
        let chordPresent = false;
        for (let cx = 0; cx < h.CELLS_X; cx += 8) {
          if (fields.chord[cy * h.CELLS_X + cx] > 0.1) { chordPresent = true; break; }
        }
        if (chordPresent && Math.random() < 0.35) {
          for (let cx = 0; cx < h.CELLS_X; cx++) {
            h.depositPoint(fields.kick, cx, cy, 0.10);
          }
          hits++;
        }
      }
    },

    // Bass: fascia SOTTO il kick (Y 78-95%) — fondamenta in fondo
    bass(fields, particles, note127, vel127, h) {
      const t = h.clamp((note127 - 26) / (45 - 26), 0, 1);
      const baseY = Math.floor(h.CELLS_Y * (0.78 + (1 - t) * 0.15));
      const cy = h.clamp(baseY + Math.floor((Math.random() - 0.5) * 6), Math.floor(h.CELLS_Y * 0.76), h.CELLS_Y - 2);
      const f = (vel127 / 127) * 0.60;
      const width = Math.floor(h.CELLS_X * (0.50 + Math.random() * 0.30));
      const start = Math.floor(Math.random() * (h.CELLS_X - width));
      for (let cx = start; cx < start + width; cx++) {
        h.depositPoint(fields.bass, cx, cy, f);
        h.depositPoint(fields.bass, cx, cy + 1, f * 0.45);
        h.depositPoint(fields.bass, cx, cy + 2, f * 0.15);
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
  bg: [12, 20, 15],                  // nero verde-notte — il buio dietro la membrana
  colors: {
    drone:      [110, 185, 140],     // sage luminoso — LA membrana visibile
    bass:       [0,   0,   0],       // scrive su drone (pori)
    chord:      [0,   0,   0],       // scrive su drone (increspature)
    kick:       [0,   0,   0],       // assente
    percussion: [0,   0,   0],       // assente
    arp:        [0,   0,   0],       // assente
    voice:      [180, 230, 200],     // alone luminoso ai bordi del poro
    lead:       [160, 210, 180],     // alone più tenue
  },
  decay: {
    drone:      1.000,   // no decay — audioReact gestisce il self-heal
    bass:       1.000,   chord: 1.000,   kick: 1.000,
    percussion: 1.000,   arp: 1.000,
    voice:      0.992,   lead: 0.993,   // alone decade da solo
  },
  force: {
    drone: 0,  bass: 1,  chord: 1,
    kick: 0,   percussion: 0,  arp: 0,
    voice: 1,  lead: 1,   // token — depositFn gestisce i valori reali
  },

  // Tensione superficiale: target VARIABILE nello spazio (non uniforme 0.85)
  // Zone più dense e zone più sottili — come una bolla reale
  audioReact(fields, energy, h) {
    const heal = 0.004 + energy * 0.003;
    const n = h.CELLS_X * h.CELLS_Y;
    for (let i = 0; i < n; i++) {
      // Target variabile: 0.72-0.88 basato su posizione (sin patterns)
      const cx = i % h.CELLS_X;
      const cy = (i / h.CELLS_X) | 0;
      const xN = cx / h.CELLS_X, yN = cy / h.CELLS_Y;
      const target = 0.80 + Math.sin(xN * 7.3) * 0.04 + Math.sin(yN * 5.7) * 0.04;
      if (fields.drone[i] < target) {
        fields.drone[i] += heal;
        if (fields.drone[i] > target) fields.drone[i] = target;
      }
    }
  },

  depositFn: {
    // Voice: poro IRREGOLARE — ellisse deformata + alone con variazione angolare
    voice(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 67, 84);
      const cx = Math.floor(h.CELLS_X * 0.12 + Math.random() * h.CELLS_X * 0.76);
      const baseR = 2 + Math.floor((vel127 / 127) * 2.5);
      // Deformazione: raggio varia con l'angolo (ellisse + noise)
      const stretch = 0.7 + Math.random() * 0.6;  // rapporto assi 0.7-1.3
      const rotSeed = Math.random() * Math.PI;
      const velN = vel127 / 127;
      for (let dy = -(baseR + 2); dy <= baseR + 2; dy++) {
        for (let dx = -(baseR + 2); dx <= baseR + 2; dx++) {
          const px = cx + dx, py = cy + dy;
          if (px < 0 || px >= h.CELLS_X || py < 0 || py >= h.CELLS_Y) continue;
          // Distanza deformata (ellisse ruotata)
          const a = Math.atan2(dy, dx) + rotSeed;
          const dr = Math.sqrt(dx * dx + dy * dy);
          const rHere = baseR * (1 + (stretch - 1) * Math.abs(Math.cos(a)))
                      * (1 + Math.sin(a * 3) * 0.15);  // noise sui bordi
          if (dr <= rHere) {
            fields.drone[py * h.CELLS_X + px] = 0;
          } else if (dr <= rHere + 1.5) {
            // Alone: intensità varia con l'angolo (iridescenza)
            const aloneFactor = 0.25 + Math.abs(Math.sin(a * 2)) * 0.25;
            h.depositPoint(fields.voice, px, py, velN * aloneFactor);
          }
        }
      }
    },

    // Lead: pori più piccoli, alone più debole, posizione spostata
    lead(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 72, 84);
      const cx = Math.floor(h.CELLS_X * 0.25 + Math.random() * h.CELLS_X * 0.5);
      const r = 1 + Math.floor((vel127 / 127));
      for (let dy = -(r + 1); dy <= r + 1; dy++) {
        for (let dx = -(r + 1); dx <= r + 1; dx++) {
          const d2 = dx * dx + dy * dy;
          const px = cx + dx, py = cy + dy;
          if (px < 0 || px >= h.CELLS_X || py < 0 || py >= h.CELLS_Y) continue;
          if (d2 <= r * r) {
            fields.drone[py * h.CELLS_X + px] = 0;
          } else if (d2 <= (r + 1) * (r + 1)) {
            h.depositPoint(fields.lead, px, py, (vel127 / 127) * 0.25);
          }
        }
      }
    },

    // Bass: poro grosso, lento a richiudersi — il buco più grande della membrana
    bass(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 36, 48);
      const cx = Math.floor(h.CELLS_X / 2 + (Math.random() - 0.5) * 12);
      const r = 4 + Math.floor((vel127 / 127) * 2);
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

    // Chord: ondulazione — serie di micro-pori allineati orizzontalmente
    chord(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 60, 77);
      const spacing = 3 + Math.floor(Math.random() * 2);
      const reduction = (vel127 / 127) * 0.55;
      for (let cx = 0; cx < h.CELLS_X; cx += spacing) {
        const i = cy * h.CELLS_X + cx;
        if (i >= 0 && i < fields.drone.length) {
          fields.drone[i] = Math.max(0, fields.drone[i] - reduction);
          // cella sopra e sotto: riduzione minore = ondulazione
          if (cy > 0) fields.drone[(cy - 1) * h.CELLS_X + cx] = Math.max(0, fields.drone[(cy - 1) * h.CELLS_X + cx] - reduction * 0.3);
          if (cy < h.CELLS_Y - 1) fields.drone[(cy + 1) * h.CELLS_X + cx] = Math.max(0, fields.drone[(cy + 1) * h.CELLS_X + cx] - reduction * 0.3);
        }
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
    arp:        [0,   232, 160],  // verde-ciano elettrico — protagonista (distinto dal giallo kick/bass)
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

  // Density cap — arp deve dominare, bass/chord limitati
  maxDensity: {
    drone: 0.15, bass: 0.55, chord: 0.40, kick: 0.95,
    percussion: 0.60, arp: 0.85, voice: 0.70, lead: 0.60,
  },
  // Griglia sempre visibile — base 0.10 (la griglia è il soggetto, non lo sfondo)
  audioReact(fields, energy, h) {
    const base = 0.10;
    const n = h.CELLS_X * h.CELLS_Y;
    for (let i = 0; i < n; i++) {
      if (fields.drone[i] < base) {
        fields.drone[i] = base;
      }
    }
  },

  depositFn: {
    // ═══ MACCHINA: geometria da CIRCUITO STAMPATO ═══
    // Niente pitch→X. Le posizioni sono deterministiche da nota ma distribuite
    // su TUTTO il campo. Blocchi grandi. Colonne verticali. Rettangoli.

    // ═══ MACCHINA = TERMINALE / CIRCUITO STAMPATO ═══
    // Arp SCANSIONA come cursore raster. Bass è TRACCE DI CIRCUITO (percorsi a L/U).
    // Kick accende COLONNE VERTICALI intere (binario on/off).
    // Voice/lead sono MIRINI di targeting. Chord sono CHIP con pin.

    // Arp: RASTER SCAN — scorre da sinistra a destra come cursore
    // Ogni nota avanza la posizione. Il pattern è LEGGIBILE come testo su terminale.
    arp(fields, particles, note127, vel127, h) {
      const idx = (note127 * 3) % (h.CELLS_X * h.CELLS_Y);
      const cy = Math.floor(idx / h.CELLS_X);
      const cx = idx % h.CELLS_X;
      const f = (vel127 / 127) * 1.00;
      // Cursore 3×1 + trail orizzontale a sinistra (scia della scansione)
      h.depositPoint(fields.arp, cx, cy, f);
      h.depositPoint(fields.arp, cx, Math.max(0, cy - 1), f * 0.3);
      h.depositPoint(fields.arp, cx, Math.min(h.CELLS_Y - 1, cy + 1), f * 0.3);
      for (let i = 1; i <= 10; i++) {
        const tx = (cx - i + h.CELLS_X) % h.CELLS_X;
        h.depositPoint(fields.arp, tx, cy, f * (0.6 / Math.sqrt(i)));
      }
    },

    // Kick: COLONNA VERTICALE intera — binario on/off, la macchina batte
    kick(fields, particles, note127, vel127, h) {
      const cx = Math.floor(Math.random() * h.CELLS_X);
      for (let cy = 0; cy < h.CELLS_Y; cy++) h.depositPoint(fields.kick, cx, cy, 0.80);
      if (cx > 0) for (let cy = 0; cy < h.CELLS_Y; cy++) h.depositPoint(fields.kick, cx - 1, cy, 0.25);
      if (cx < h.CELLS_X - 1) for (let cy = 0; cy < h.CELLS_Y; cy++) h.depositPoint(fields.kick, cx + 1, cy, 0.25);
    },

    // Bass: TRACCE DI CIRCUITO — percorsi a L che collegano 2 nodi sulla griglia
    bass(fields, particles, note127, vel127, h) {
      const f = (vel127 / 127) * 0.70;
      const x1 = Math.floor(Math.random() * h.CELLS_X / 4) * 4;
      const y1 = Math.floor(Math.random() * h.CELLS_Y / 4) * 4;
      const x2 = Math.floor(Math.random() * h.CELLS_X / 4) * 4;
      const y2 = Math.floor(Math.random() * h.CELLS_Y / 4) * 4;
      const xMin = Math.min(x1, x2), xMax = Math.max(x1, x2);
      const yMin = Math.min(y1, y2), yMax = Math.max(y1, y2);
      if (Math.random() < 0.5) {
        for (let x = xMin; x <= xMax; x++) h.depositPoint(fields.bass, x, y1, f);
        for (let y = yMin; y <= yMax; y++) h.depositPoint(fields.bass, x2, y, f);
      } else {
        for (let y = yMin; y <= yMax; y++) h.depositPoint(fields.bass, x1, y, f);
        for (let x = xMin; x <= xMax; x++) h.depositPoint(fields.bass, x, y2, f);
      }
      // Nodi: blocchetti 3×3 agli estremi
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        h.depositPoint(fields.bass, x1 + dx, y1 + dy, f * 0.5);
        h.depositPoint(fields.bass, x2 + dx, y2 + dy, f * 0.5);
      }
    },

    // Percussion: TICK MARKS — tacche su una riga come righello che misura il tempo
    percussion(fields, particles, note127, vel127, h) {
      const f = (vel127 / 127) * 0.65;
      const cy = Math.floor(Math.random() * h.CELLS_Y);
      const spacing = 4 + Math.floor(Math.random() * 4);
      for (let cx = 0; cx < h.CELLS_X; cx += spacing) {
        h.depositPoint(fields.percussion, cx, cy, f);
        h.depositPoint(fields.percussion, cx, cy + 1, f * 0.3);
      }
    },

    // Voice: MIRINO HUD — pixel brillante + croce sottile a 5 celle
    voice(fields, particles, note127, vel127, h) {
      const cy = Math.floor((note127 * 7) % h.CELLS_Y);
      const cx = Math.floor((note127 * 13) % h.CELLS_X);
      const f = (vel127 / 127) * 0.80;
      h.depositPoint(fields.voice, cx, cy, f);
      for (let i = 1; i <= 5; i++) {
        const fade = f * 0.3 / i;
        h.depositPoint(fields.voice, cx + i, cy, fade);
        h.depositPoint(fields.voice, cx - i, cy, fade);
        h.depositPoint(fields.voice, cx, cy + i, fade);
        h.depositPoint(fields.voice, cx, cy - i, fade);
      }
    },

    // Lead: MIRINO specchiato — posizione complementare alla voice
    lead(fields, particles, note127, vel127, h) {
      const cy = h.CELLS_Y - 1 - Math.floor((note127 * 7) % h.CELLS_Y);
      const cx = h.CELLS_X - 1 - Math.floor((note127 * 13) % h.CELLS_X);
      const f = (vel127 / 127) * 0.65;
      h.depositPoint(fields.lead, cx, cy, f);
      for (let i = 1; i <= 4; i++) {
        const fade = f * 0.25 / i;
        h.depositPoint(fields.lead, cx + i, cy, fade);
        h.depositPoint(fields.lead, cx - i, cy, fade);
        h.depositPoint(fields.lead, cx, cy + i, fade);
        h.depositPoint(fields.lead, cx, cy - i, fade);
      }
    },

    // Chord: CHIP PCB — rettangoli 12×2 con pin sopra e sotto
    chord(fields, particles, note127, vel127, h) {
      const cx = Math.floor(((note127 * 5) % h.CELLS_X) / 4) * 4;
      const cy = Math.floor(((note127 * 3) % h.CELLS_Y) / 4) * 4;
      const f = (vel127 / 127) * 0.40;
      for (let dx = 0; dx < 12 && cx + dx < h.CELLS_X; dx++) {
        h.depositPoint(fields.chord, cx + dx, cy, f);
        if (cy + 1 < h.CELLS_Y) h.depositPoint(fields.chord, cx + dx, cy + 1, f);
        if (dx % 3 === 0) {
          if (cy > 0) h.depositPoint(fields.chord, cx + dx, cy - 1, f * 0.4);
          if (cy + 2 < h.CELLS_Y) h.depositPoint(fields.chord, cx + dx, cy + 2, f * 0.4);
        }
      }
    },
  },
  cellPx: {
    drone: 10, bass: 10, chord: 10, kick: 10, percussion: 10,
    arp: 10, voice: 10, lead: 10,
  },
  freeze: {
    spatial: false,
  },
};

// ══════════════════════════════════════════════════════════════
//  TEMPESTA — E phrygian 129 BPM — "balli"
//  Fisica: densità massima. Tutto attivo, tutto forte.
//  Voice+lead hocket (bianco/carmine alternati).
//  Immagine: aurora boreale resa in bianco/nero/carmine.
// ══════════════════════════════════════════════════════════════
// ── TEMPESTA state — impulso direzionale persistente ──
let _tempestaDir = { dx: 1, dy: 0 };  // direzione corrente
let _tempestaTimer = 0;                 // frame fino al prossimo cambio
const _tempestaSusceptibility = {
  // 3 livelli: drone quasi immune, chord/bass medio, arp/voice/lead in balia
  drone: 0.02, bass: 0.25, chord: 0.20,
  kick: 0.05, percussion: 0.35,
  arp: 0.60, voice: 0.50, lead: 0.50,
};

const TEMPESTA = {
  bg: [0, 0, 0],                   // nero puro
  colors: {
    drone:      [45,  45,  50],    // grigio freddo — linee di forza stabili
    bass:       [255, 255, 255],   // bianco puro
    chord:      [170, 170, 175],   // grigio medio — non compete con voice/lead
    kick:       [255, 255, 255],   // bianco flash
    percussion: [255,   0,  50],   // rosso fuoco saturo — scintille che feriscono
    arp:        [90,   90, 100],   // grigio scuro — texture sottile
    voice:      [255, 255, 255],   // bianco — hocket parte 1
    lead:       [220,   0,  30],   // carmine PURO saturo — hocket parte 2
  },
  // Density cap — evita il muro grigio: bass/chord/arp capped, voice/lead liberi
  maxDensity: {
    drone: 0.25, bass: 0.50, chord: 0.35, kick: 0.95,
    percussion: 0.70, arp: 0.30,
    voice: 0.90, lead: 0.90,  // protagonisti: quasi liberi
  },
  decay: {
    drone:      0.9980,  // decade un po' più veloce — linee di forza si rinnovano
    bass:       0.965,   // scie più corte (era 0.975) — libera spazio
    chord:      0.970,   // decade più veloce
    kick:       0.500,   // flash
    percussion: 0.550,   // scintille brevissime
    arp:        0.890,   // più rapido — texture che svanisce subito
    voice:      0.986,   // hocket
    lead:       0.984,   // hocket
  },
  force: {
    drone: 0.006,  bass: 0.35,  chord: 0.18,   // DIMEZZATI — non devono dominare
    kick: 0.95,    percussion: 0.75,
    arp: 0.25,     voice: 1.00,  lead: 0.95,   // RADDOPPIATI — protagonisti assoluti
  },

  // IMPULSI DIREZIONALI + EROSIONE — crea vuoti temporanei che i filamenti riempiono
  audioReact(fields, energy, h) {
    _tempestaTimer--;
    if (_tempestaTimer <= 0) {
      // nuova direzione casuale
      const angle = Math.random() * Math.PI * 2;
      _tempestaDir.dx = Math.cos(angle);
      _tempestaDir.dy = Math.sin(angle);
      _tempestaTimer = 3 + Math.floor(Math.random() * 12);  // 3-15 frame
    }

    // EROSIONE DIREZIONALE — le celle controvento perdono materia
    // Crea corridoi vuoti dove i filamenti voice/lead brillano
    const erosion = 0.03 + energy * 0.04;
    const erodeRoles = ['bass', 'chord', 'arp', 'drone'];
    for (const er of erodeRoles) {
      const ef = fields[er];
      // Erodi nella direzione opposta all'impulso
      const edx = Math.round(-_tempestaDir.dx);
      const edy = Math.round(-_tempestaDir.dy);
      if (edx === 0 && edy === 0) break;
      for (let cy = 0; cy < h.CELLS_Y; cy++) {
        for (let cx = 0; cx < h.CELLS_X; cx++) {
          const i = cy * h.CELLS_X + cx;
          if (ef[i] > 0.05) {
            ef[i] *= (1 - erosion * _tempestaSusceptibility[er]);
          }
        }
      }
    }

    const strength = 0.15 + energy * 0.25;  // più audio = impulso più forte
    const roles = ['arp', 'voice', 'lead', 'percussion', 'chord', 'bass', 'drone'];

    for (const role of roles) {
      const susc = _tempestaSusceptibility[role] * strength;
      if (susc < 0.005) continue;
      const f = fields[role];
      const sdx = Math.round(_tempestaDir.dx);
      const sdy = Math.round(_tempestaDir.dy);
      if (sdx === 0 && sdy === 0) continue;

      // scansione nella direzione opposta allo spostamento per evitare sovrascrittura
      const xStart = sdx > 0 ? h.CELLS_X - 1 : 0;
      const xEnd   = sdx > 0 ? -1 : h.CELLS_X;
      const xStep  = sdx > 0 ? -1 : 1;
      const yStart = sdy > 0 ? h.CELLS_Y - 1 : 0;
      const yEnd   = sdy > 0 ? -1 : h.CELLS_Y;
      const yStep  = sdy > 0 ? -1 : 1;

      for (let cy = yStart; cy !== yEnd; cy += yStep) {
        for (let cx = xStart; cx !== xEnd; cx += xStep) {
          const i = cy * h.CELLS_X + cx;
          if (f[i] < 0.01) continue;
          const nx = cx + sdx, ny = cy + sdy;
          if (nx < 0 || nx >= h.CELLS_X || ny < 0 || ny >= h.CELLS_Y) continue;
          const ni = ny * h.CELLS_X + nx;
          const transfer = f[i] * susc;
          f[i]  -= transfer;
          f[ni] += transfer;
          if (f[ni] > 1) f[ni] = 1;
        }
      }
    }
  },

  depositFn: {
    // ═══ TEMPESTA = AURORA BOREALE / CAMPO MAGNETICO SOLARE ═══
    // Voice/lead = TENDE DI LUCE CURVE che attraversano tutto il campo (il gesto dell'aurora)
    // Bass = ONDE DI PRESSIONE CIRCOLARI che si espandono dal punto d'impatto
    // Kick = ESPLOSIONE RADIALE (non riga — SOLCO/TESSUTO hanno righe)
    // Chord = nebulosa diffusa che viene trascinata dal vento
    // Drone = linee di campo stabili (l'unica cosa che non si muove)

    // Voice: TENDE DI LUCE CURVE (aurora boreale) — archi che attraversano 60-80% del campo
    // Ogni tenda è un arco sin con ampiezza e frequenza variabili
    voice(fields, particles, note127, vel127, h) {
      const cx0 = Math.floor(Math.random() * h.CELLS_X);
      const f = (vel127 / 127) * 1.00;
      // Arco che attraversa gran parte del campo — la tenda d'aurora
      const len = 25 + Math.floor(Math.random() * 20);  // 25-44 celle — LUNGO
      const baseAngle = Math.atan2(_tempestaDir.dy, _tempestaDir.dx);
      const amplitude = 3 + Math.random() * 5;  // ondulazione 3-8 celle
      const freq = 0.15 + Math.random() * 0.20;
      const cy0 = Math.floor(h.CELLS_Y * (0.10 + Math.random() * 0.70));
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const wave = Math.sin(i * freq) * amplitude;
        const px = Math.round(cx0 + Math.cos(baseAngle) * i + Math.sin(baseAngle) * wave);
        const py = Math.round(cy0 + Math.sin(baseAngle) * i - Math.cos(baseAngle) * wave);
        const fade = Math.sin(t * Math.PI);  // forte al centro, debole ai bordi
        h.depositPoint(fields.voice, px, py, f * fade);
        // Spessore: 2 celle perpendicolari alla direzione
        const perpX = Math.round(-Math.sin(baseAngle));
        const perpY = Math.round(Math.cos(baseAngle));
        h.depositPoint(fields.voice, px + perpX, py + perpY, f * fade * 0.4);
      }
    },

    // Lead: CONTRO-TENDA CARMINE — arco più corto, curvatura opposta
    lead(fields, particles, note127, vel127, h) {
      const cx0 = Math.floor(Math.random() * h.CELLS_X);
      const f = (vel127 / 127) * 0.95;
      const len = 18 + Math.floor(Math.random() * 15);
      const baseAngle = Math.atan2(_tempestaDir.dy, _tempestaDir.dx) + Math.PI * 0.3; // angolata diversamente
      const amplitude = 4 + Math.random() * 6;
      const freq = 0.12 + Math.random() * 0.18;
      const cy0 = Math.floor(h.CELLS_Y * (0.15 + Math.random() * 0.60));
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const wave = Math.sin(i * freq + 1.5) * amplitude;  // fase diversa dalla voice
        const px = Math.round(cx0 + Math.cos(baseAngle) * i + Math.sin(baseAngle) * wave);
        const py = Math.round(cy0 + Math.sin(baseAngle) * i - Math.cos(baseAngle) * wave);
        const fade = Math.sin(t * Math.PI);
        h.depositPoint(fields.lead, px, py, f * fade);
        const perpX = Math.round(-Math.sin(baseAngle));
        const perpY = Math.round(Math.cos(baseAngle));
        h.depositPoint(fields.lead, px + perpX, py + perpY, f * fade * 0.35);
      }
    },

    // Kick: ESPLOSIONE RADIALE — cerchio che si espande dal punto d'impatto
    // Non una riga (SOLCO/TESSUTO hanno righe) — il kick della tempesta è un'onda d'urto sferica
    kick(fields, particles, note127, vel127, h) {
      const cx = Math.floor(h.CELLS_X * (0.20 + Math.random() * 0.60));
      const cy = Math.floor(h.CELLS_Y * (0.30 + Math.random() * 0.40));
      // Anello: raggio 6-10, spessore 2
      const r = 6 + Math.floor(Math.random() * 5);
      for (let a = 0; a < 64; a++) {
        const angle = (a / 64) * Math.PI * 2;
        for (let dr = -1; dr <= 1; dr++) {
          const px = Math.round(cx + Math.cos(angle) * (r + dr));
          const py = Math.round(cy + Math.sin(angle) * (r + dr));
          h.depositPoint(fields.kick, px, py, 0.85 * (dr === 0 ? 1 : 0.35));
        }
      }
    },

    // Bass: ONDA DI PRESSIONE — arco parziale (non cerchio pieno) che si espande
    // Il bass è QUASI su ogni beat — ogni impatto genera un fronte d'onda
    bass(fields, particles, note127, vel127, h) {
      const f = (vel127 / 127) * 0.40;
      const cx = Math.floor(Math.random() * h.CELLS_X);
      const cy = Math.floor(h.CELLS_Y * (0.25 + Math.random() * 0.50));
      // Arco parziale: 90-180° di cerchio, raggio 8-15
      const r = 8 + Math.floor(Math.random() * 8);
      const startA = Math.random() * Math.PI * 2;
      const arcSpan = Math.PI * (0.5 + Math.random() * 0.5);  // 90-180°
      const steps = Math.floor(arcSpan * r);
      for (let i = 0; i < steps; i++) {
        const a = startA + (i / steps) * arcSpan;
        const px = Math.round(cx + Math.cos(a) * r);
        const py = Math.round(cy + Math.sin(a) * r);
        h.depositPoint(fields.bass, px, py, f * (1 - 0.3 * Math.abs(i / steps - 0.5)));
      }
    },

    // Percussion: SCINTILLE rosse — punti singoli brillanti sparsi ovunque
    percussion(fields, particles, note127, vel127, h) {
      const f = (vel127 / 127) * 0.80;
      const n = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const cx = Math.floor(Math.random() * h.CELLS_X);
        const cy = Math.floor(Math.random() * h.CELLS_Y);
        h.depositPoint(fields.percussion, cx, cy, f);
        h.depositPoint(fields.percussion, cx + 1, cy, f * 0.4);
      }
    },

    // Arp: POLVERE CAOTICA in balia del vento — punti con micro-scia direzionale
    arp(fields, particles, note127, vel127, h) {
      const f = (vel127 / 127) * 0.35;
      const n = 4 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        const cx = Math.floor(Math.random() * h.CELLS_X);
        const cy = Math.floor(Math.random() * h.CELLS_Y);
        h.depositPoint(fields.arp, cx, cy, f);
        h.depositPoint(fields.arp, Math.round(cx + _tempestaDir.dx * 2), Math.round(cy + _tempestaDir.dy * 2), f * 0.3);
      }
    },

    // Chord: NEBULOSA DIFFUSA trascinata dal vento — blob allungato nella direzione dell'impulso
    chord(fields, particles, note127, vel127, h) {
      const cx = Math.floor(Math.random() * h.CELLS_X);
      const cy = Math.floor(h.CELLS_Y * (0.15 + Math.random() * 0.70));
      const f = (vel127 / 127) * 0.20;
      // Blob allungato: 8-12 punti nella direzione del vento
      const len = 8 + Math.floor(Math.random() * 5);
      for (let i = 0; i < len; i++) {
        const px = Math.round(cx + _tempestaDir.dx * i);
        const py = Math.round(cy + _tempestaDir.dy * i);
        h.depositPoint(fields.chord, px, py, f * (1 - i / len * 0.6));
        // larghezza 2: perpendicolare
        const perpX = Math.round(-_tempestaDir.dy);
        const perpY = Math.round(_tempestaDir.dx);
        h.depositPoint(fields.chord, px + perpX, py + perpY, f * 0.3 * (1 - i / len));
      }
    },

    // Drone: LINEE DI CAMPO stabili — quasi immobili, la struttura su cui l'aurora danza
    drone(fields, particles, note127, vel127, h) {
      const cy = h.localPitchToCell(note127, 40, 64);
      for (let cx = 0; cx < h.CELLS_X; cx++) {
        h.depositPoint(fields.drone, cx, cy, 0.006);
      }
    },
  },
  // TEMPESTA: turbolenza, nulla cristallizza per silenzio
  freeze: {
    roleEnabled: false,
  },
};

// ══════════════════════════════════════════════════════════════
//  RITORNO — A aeolian 86 BPM — "ti rilascia"
//  Non è un bioma: è il congedo. È una posizione della camera.
//  La camera lascia la superficie del pianeta e sale in orbita.
//  Il sedimento di tutti i biomi precedenti è visibile come geologia.
//  Le note di RITORNO = scintille 2px sparse sulla superficie.
//  Voice esposta, arp morente, dissoluzione 48 bar → il pianeta si spegne.
//  Immagine: Pale Blue Dot. Lavanda e crema su nero.
//
//  planetMask: true → campo.js renderizza dentro maschera circolare
//  irregolare (contorni noise). Raggio guidato da fase:
//  germoglio cresce 0→70%, dissoluzione si restringe 70%→0.
// ══════════════════════════════════════════════════════════════
const RITORNO = {
  bg: [0, 0, 0],                  // nero PURO — lo spazio intorno al pianeta
  planetMask: true,                // flag per campo.js: applica maschera circolare
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
    // Voice: scintille VARIABILI — 60% punti singoli (stelle), 30% costellazioni (3-5 punti),
    // 10% scia breve radiale (come una cometa che cade verso il centro)
    voice(fields, particles, note127, vel127, h) {
      const cxC = h.CELLS_X / 2, cyC = h.CELLS_Y / 2;
      const maxR = Math.min(cxC, cyC) * 0.65;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * maxR;
      const cx = Math.round(cxC + Math.cos(angle) * r);
      const cy = Math.round(cyC + Math.sin(angle) * r);
      const velN = vel127 / 127;
      const roll = Math.random();
      if (roll < 0.60) {
        // Stella singola con 1-2 satelliti ravvicinati
        h.depositPoint(fields.voice, cx, cy, velN * 0.55);
        if (Math.random() < 0.5) {
          const ox = Math.round((Math.random() - 0.5) * 2);
          const oy = Math.round((Math.random() - 0.5) * 2);
          h.depositPoint(fields.voice, cx + ox, cy + oy, velN * 0.20);
        }
      } else if (roll < 0.90) {
        // Costellazione: 3-5 punti sparsi in un raggio di 3 celle
        const n = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const cr = Math.random() * 3;
          h.depositPoint(fields.voice, Math.round(cx + Math.cos(a) * cr), Math.round(cy + Math.sin(a) * cr), velN * 0.35);
        }
      } else {
        // Cometa: scia radiale verso il centro (4-7 punti)
        const toCenter = Math.atan2(cyC - cy, cxC - cx);
        const len = 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < len; i++) {
          const px = Math.round(cx + Math.cos(toCenter) * i);
          const py = Math.round(cy + Math.sin(toCenter) * i);
          h.depositPoint(fields.voice, px, py, velN * 0.45 * (1 - i / len));
        }
      }
    },

    // Lead: eco VARIABILE — 70% punto singolo, 30% eco doppia (2 punti a distanza)
    lead(fields, particles, note127, vel127, h) {
      const cxC = h.CELLS_X / 2, cyC = h.CELLS_Y / 2;
      const maxR = Math.min(cxC, cyC) * 0.60;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * maxR;
      const cx = Math.round(cxC + Math.cos(angle) * r);
      const cy = Math.round(cyC + Math.sin(angle) * r);
      const velN = vel127 / 127;
      h.depositPoint(fields.lead, cx, cy, velN * 0.30);
      if (Math.random() < 0.3) {
        // Eco doppia: secondo punto a 3-5 celle di distanza nella stessa direzione radiale
        const d = 3 + Math.floor(Math.random() * 3);
        const px = Math.round(cx + Math.cos(angle) * d);
        const py = Math.round(cy + Math.sin(angle) * d);
        h.depositPoint(fields.lead, px, py, velN * 0.15);
      }
    },

    // Arp: morente — punti debolissimi dentro il pianeta
    arp(fields, particles, note127, vel127, h) {
      const cxC = h.CELLS_X / 2, cyC = h.CELLS_Y / 2;
      const maxR = Math.min(cxC, cyC) * 0.55;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * maxR;
      const cx = Math.round(cxC + Math.cos(angle) * r);
      const cy = Math.round(cyC + Math.sin(angle) * r);
      h.depositPoint(fields.arp, cx, cy, (vel127 / 127) * 0.15);
    },

    // Bass: goccia sparsa dentro il pianeta — 2 celle verticali
    bass(fields, particles, note127, vel127, h) {
      const cxC = h.CELLS_X / 2, cyC = h.CELLS_Y / 2;
      const maxR = Math.min(cxC, cyC) * 0.60;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * maxR;
      const cx = Math.round(cxC + Math.cos(angle) * r);
      const cy = Math.round(cyC + Math.sin(angle) * r);
      const f = (vel127 / 127) * 0.40;
      h.depositPoint(fields.bass, cx, cy, f);
      h.depositPoint(fields.bass, cx, cy + 1, f * 0.5);
    },

    // Kick: arco variabile — 60% archi corti (equatore), 40% archi lunghi (meridiani)
    kick(fields, particles, note127, vel127, h) {
      const cxC = h.CELLS_X / 2, cyC = h.CELLS_Y / 2;
      const maxRad = Math.min(cxC, cyC);
      if (Math.random() < 0.6) {
        // Arco equatoriale corto (come prima ma con raggio variabile)
        const r = maxRad * (0.30 + Math.random() * 0.30);
        const startAngle = Math.random() * Math.PI * 2;
        const arcLen = 0.3 + Math.random() * 0.5;
        const steps = 8 + Math.floor(Math.random() * 6);
        for (let i = 0; i < steps; i++) {
          const a = startAngle + (i / steps) * arcLen;
          const cx = Math.round(cxC + Math.cos(a) * r);
          const cy = Math.round(cyC + Math.sin(a) * r);
          h.depositPoint(fields.kick, cx, cy, 0.50 * (1 - i / steps * 0.6));
        }
      } else {
        // Arco lungo: da un punto al bordo verso il centro (meridiano)
        const startAngle = Math.random() * Math.PI * 2;
        const rStart = maxRad * (0.50 + Math.random() * 0.15);
        const rEnd = maxRad * (0.10 + Math.random() * 0.15);
        const steps = 10 + Math.floor(Math.random() * 6);
        for (let i = 0; i < steps; i++) {
          const t = i / steps;
          const r = rStart + (rEnd - rStart) * t;
          const a = startAngle + t * 0.3;  // leggera curva
          const cx = Math.round(cxC + Math.cos(a) * r);
          const cy = Math.round(cyC + Math.sin(a) * r);
          h.depositPoint(fields.kick, cx, cy, 0.45 * (1 - t * 0.5));
        }
      }
    },

    // Chord: archi circolari — varietà lunghezza + spessore + raggio
    // 50% archi sottili (1 cella), 30% archi spessi (2 celle), 20% anelli quasi chiusi
    chord(fields, particles, note127, vel127, h) {
      const cxC = h.CELLS_X / 2, cyC = h.CELLS_Y / 2;
      const t = h.clamp((note127 - 55) / (72 - 55), 0, 1);
      const r = Math.min(cxC, cyC) * (0.15 + (1 - t) * 0.45);
      const startAngle = Math.random() * Math.PI * 2;
      const f = (vel127 / 127) * 0.30;
      const roll = Math.random();
      if (roll < 0.50) {
        // Arco sottile
        const arcLen = 0.6 + Math.random() * 0.8;
        const steps = 10 + Math.floor(Math.random() * 6);
        for (let i = 0; i < steps; i++) {
          const a = startAngle + (i / steps) * arcLen;
          h.depositPoint(fields.chord, Math.round(cxC + Math.cos(a) * r), Math.round(cyC + Math.sin(a) * r), f * (1 - 0.3 * Math.abs(i / steps - 0.5)));
        }
      } else if (roll < 0.80) {
        // Arco spesso (2 celle di larghezza)
        const arcLen = 0.5 + Math.random() * 0.6;
        const steps = 12;
        for (let i = 0; i < steps; i++) {
          const a = startAngle + (i / steps) * arcLen;
          const fade = 1 - 0.3 * Math.abs(i / steps - 0.5);
          for (let dr = -1; dr <= 1; dr++) {
            const rr = r + dr;
            h.depositPoint(fields.chord, Math.round(cxC + Math.cos(a) * rr), Math.round(cyC + Math.sin(a) * rr), f * fade * (dr === 0 ? 1 : 0.4));
          }
        }
      } else {
        // Anello quasi chiuso — 80% del cerchio
        const arcLen = Math.PI * 1.6;
        const steps = 20;
        for (let i = 0; i < steps; i++) {
          const a = startAngle + (i / steps) * arcLen;
          h.depositPoint(fields.chord, Math.round(cxC + Math.cos(a) * r), Math.round(cyC + Math.sin(a) * r), f * 0.7);
        }
      }
    },

    // Drone: nebbia diffusa nel nucleo del pianeta
    drone(fields, particles, note127, vel127, h) {
      const cxC = Math.floor(h.CELLS_X / 2);
      const cyC = Math.floor(h.CELLS_Y / 2);
      const maxR = Math.min(cxC, cyC) * 0.40;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * maxR;
      const cx = Math.round(cxC + Math.cos(angle) * r);
      const cy = Math.round(cyC + Math.sin(angle) * r);
      h.depositBlob(fields.drone, cx, cy, 4, 3, (vel127 / 127) * 0.008);
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

// ═══════════════════════════════════════════════════════════
//  PALETTE B — palette alternativa incrociata con reference
//  artistiche (Hubble, Agnes Martin, Dub, Kenya Hara, Ikeda,
//  Moholy-Nagy, Pale Blue Dot).
//  Solo bg + colors: fisica, decay, force, depositFn invariati.
// ═══════════════════════════════════════════════════════════
const PALETTE_B = {
  NEBBIA: {
    bg: [4, 4, 14],                    // nero con traccia d'indaco
    colors: {
      drone:      [55,  60,  120],     // indaco smorzato — substrato stellare
      bass:       [0,   0,   0],       // assente
      chord:      [100, 110, 170],     // pervinca nebbiosa
      kick:       [0,   0,   0],       // assente
      percussion: [0,   0,   0],       // assente
      arp:        [0,   0,   0],       // assente
      voice:      [255, 210, 150],     // ambra calda — unico punto caldo nel freddo
      lead:       [180, 160, 210],     // malva rosa — ponte freddo/caldo
    },
  },
  TESSUTO: {
    bg: [10, 6, 14],                   // nero violaceo
    colors: {
      drone:      [45,  30,  50],      // aubergine scuro — il telaio
      bass:       [110,  70, 130],     // prugna — profondità
      chord:      [205, 215,  30],     // chartreuse — protagonista (invariato)
      kick:       [240, 230, 210],     // cream caldo
      percussion: [150, 130, 115],     // grigio caldo
      arp:        [0,   0,   0],       // assente
      voice:      [0,   0,   0],       // tace
      lead:       [245, 190, 130],     // pesca caldo — più vivo del cream
    },
  },
  SOLCO: {
    bg: [12, 8, 6],                    // nero terra
    colors: {
      drone:      [35,  30,  55],      // indaco profondo — lago nel bosco
      bass:       [255, 120,  25],     // arancio bruciato — il sub dub
      chord:      [60,   90, 130],     // blu ardesia — eco delay che si raffredda
      kick:       [235, 220, 190],     // cream-sabbia — distinto dal bass
      percussion: [0,   0,   0],       // assente
      arp:        [155, 180, 115],     // oliva-salvia — la 6a dorica, luce verde
      voice:      [250, 195,  90],     // ambra-oro — calda ma distinta dal bass
      lead:       [0,   0,   0],       // assente
    },
  },
  RESPIRO: {
    bg: [6, 12, 10],                   // nero verde — il soffitto si alza
    colors: {
      drone:      [110, 185, 140],     // sage (invariato — È la membrana)
      bass:       [0,   0,   0],       // scrive su drone
      chord:      [0,   0,   0],       // scrive su drone
      kick:       [0,   0,   0],       // assente
      percussion: [0,   0,   0],       // assente
      arp:        [0,   0,   0],       // assente
      voice:      [255, 185, 155],     // corallo caldo — alone iridescente ai bordi
      lead:       [175, 160, 225],     // lavanda fredda — alone freddo ai bordi
    },
  },
  MACCHINA: {
    bg: [8, 8, 20],                    // nero navy più profondo (Ikeda)
    colors: {
      drone:      [30,  30,  50],      // navy scuro
      bass:       [248, 237,   0],     // giallo elettrico (invariato)
      chord:      [80,   80, 120],     // navy chiaro
      kick:       [255, 255, 255],     // bianco puro — distinto dal giallo bass
      percussion: [220,  55,  65],     // rosa caldo
      arp:        [0,   230, 160],     // ciano (invariato)
      voice:      [250, 175,  60],     // ambra dorata — caldo vs ciano
      lead:       [220,  55,  65],     // rosa — specchiato alla voice
    },
  },
  TEMPESTA: {
    bg: [0, 0, 0],                     // nero puro (invariato)
    colors: {
      drone:      [28,  20,  55],      // viola profondo — la b2 come colore
      bass:       [255, 255, 255],     // bianco puro (invariato)
      chord:      [115,  90, 170],     // viola medio — tensione phrygian
      kick:       [255, 255, 255],     // bianco flash (invariato)
      percussion: [255,  45,  65],     // rosso fuoco
      arp:        [70,   55, 110],     // viola scuro — texture caotica
      voice:      [255, 255, 255],     // bianco hocket 1 (invariato)
      lead:       [215,   0,  30],     // carmine puro hocket 2 (invariato)
    },
  },
  RITORNO: {
    bg: [5, 5, 14],                    // nero blu sera
    colors: {
      drone:      [40,  32,  55],      // viola-blu — sedimento di 55 minuti
      bass:       [125, 105,  80],     // ambra spenta — eco SOLCO esaurita
      chord:      [135, 125, 160],     // lavanda sbiadita
      kick:       [170, 162, 150],     // cream stanco
      percussion: [130, 120, 110],     // appena percettibile
      arp:        [95,  100, 135],     // blu morente
      voice:      [245, 215, 170],     // oro tenue — l'ultimo suono, nudo
      lead:       [170, 158, 210],     // lavanda fredda — eco distante
    },
  },
};

// ── Palette A (originale) — salvata al primo swap ──
let _paletteA = null;
let _currentMode = 'A';

function _saveOriginals() {
  if (_paletteA) return;
  _paletteA = {};
  for (const name of Object.keys(PALETTE_B)) {
    const b = BIOMI[name];
    _paletteA[name] = { bg: [...b.bg], colors: {} };
    for (const role of Object.keys(b.colors)) {
      _paletteA[name].colors[role] = [...b.colors[role]];
    }
  }
}

/** Cambia palette: 'A' = originale, 'B' = alternativa. Modifica in-place. */
export function setPaletteMode(mode) {
  _saveOriginals();
  const src = mode === 'B' ? PALETTE_B : _paletteA;
  for (const name of Object.keys(src)) {
    const biome = BIOMI[name];
    const s = src[name];
    biome.bg[0] = s.bg[0]; biome.bg[1] = s.bg[1]; biome.bg[2] = s.bg[2];
    for (const role of Object.keys(s.colors)) {
      const c = biome.colors[role];
      const sc = s.colors[role];
      c[0] = sc[0]; c[1] = sc[1]; c[2] = sc[2];
    }
  }
  _currentMode = mode;
}

export function getPaletteMode() { return _currentMode; }

export function getBiome(trackName) {
  return BIOMI[trackName] || GENERIC;
}
