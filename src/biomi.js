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
  bg: [12, 8, 6],                   // nero terra
  colors: {
    drone:      [35,  30,  55],    // indaco profondo — lago nel bosco
    bass:       [255, 120,  25],   // arancio bruciato — il sub dub
    chord:      [60,   90, 130],   // blu ardesia — eco delay che si raffredda
    kick:       [235, 220, 190],   // cream-sabbia — distinto dal bass
    percussion: [0,   0,   0],     // assente
    arp:        [155, 180, 115],   // oliva-salvia — la 6a dorica, luce verde
    voice:      [170, 195, 230],   // blu chiaro freddo — raro, distante dal bass caldo
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

  // phaseColors: il dub si scalda fino alla rottura, poi si raffredda nel delay
  phaseColors: {
    germoglio:    { bass: [200, 110,  30] },  // arancio più tenue — il sub nasce
    pulsazione:   { bass: [255, 130,  35] },  // arancio pieno — il groove è caldo
    densita:      { bass: [255, 140,  50], chord: [75, 105, 150] },  // tutto si scalda
    rottura:      { bass: [255,  80,  20], voice: [200, 220, 255] },  // bass infuocato, voice ghiacciata
    dissoluzione: { bass: [180,  90,  40], chord: [40,  55,  90] },   // l'eco si spegne, il freddo vince
  },

  depositFn: {
    // ── FASCE VERTICALI SOLCO ──
    // cielo:     Y 0-40%   (vuoto, arp in caduta, voice rare)
    // orizzonte: Y 40%     (chord si deposita qui)
    // terra:     Y 40-100% (bass sbatte, kick scuote, drone sedimenta)

    // Drone: TERRENO — blob sparsi nella metà inferiore. Il suolo su cui tutto si accumula.
    drone(fields, particles, note127, vel127, h) {
      const minY = Math.floor(h.CELLS_Y * 0.55);
      const cy = minY + Math.floor(Math.random() * (h.CELLS_Y - minY));
      const cx = Math.floor(Math.random() * h.CELLS_X);
      h.depositBlob(fields.drone, cx, cy, 3, 2, 0.005);
    },

    // Bass: COLONNA VERTICALE che sbatte giù + 2-3 ECHI spostati a destra
    // Il gesto fondamentale del dub: il sub cade e l'eco lo insegue nel tempo (= X)
    // RUPTURE: echi si moltiplicano (2→6), colonna si spacca in frammenti
    bass(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const velN = vel127 / 127;
      const f = velN * 0.85;
      const cx = Math.floor(Math.random() * (h.CELLS_X - 4));
      const colW = 2 + Math.floor(Math.random() * 3);
      const yTop = Math.floor(h.CELLS_Y * (0.15 + Math.random() * 0.10));
      const yBot = Math.floor(h.CELLS_Y * (0.80 + Math.random() * 0.10));
      // RUPTURE: la colonna si frammenta — gap casuali che crescono con l'intensità
      for (let y = yTop; y <= yBot; y++) {
        if (ri > 0.3 && Math.random() < ri * 0.4) continue;  // buchi nella colonna
        const progress = (y - yTop) / (yBot - yTop);
        const yForce = f * (0.15 + progress * 0.85);
        // RUPTURE: la colonna ondula orizzontalmente
        const xShift = Math.round(Math.sin(y * 0.3) * ri * 3);
        for (let dx = 0; dx < colW; dx++) {
          h.depositPoint(fields.bass, cx + dx + xShift, y, yForce);
        }
      }
      // Impatto
      for (let dx = -5; dx <= colW + 5; dx++) {
        const dist = dx < 0 ? -dx : (dx >= colW ? dx - colW + 1 : 0);
        if (dist > 0) {
          h.depositPoint(fields.bass, cx + dx, yBot, f * 0.4 / dist);
          h.depositPoint(fields.bass, cx + dx, yBot - 1, f * 0.2 / dist);
        }
      }
      // ECHI DUB: 2-3 normali → fino a 6 durante rupture
      const nEcho = 2 + Math.floor(Math.random() * 2) + Math.floor(ri * 4);
      for (let e = 0; e < nEcho; e++) {
        const echoX = cx + (e + 1) * (6 + Math.floor(Math.random() * 4));
        const echoF = f * (0.35 / (e + 1));
        const echoW = Math.max(1, colW - Math.min(e, colW - 1));
        const echoTop = yTop + (e + 1) * 3;
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
    // RUPTURE: fulmini si ramificano di più, wobble più violento
    voice(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const cx = Math.floor(Math.random() * h.CELLS_X);
      const f = (vel127 / 127) * 0.55 * (1 + ri * 0.5);
      const yTop = Math.floor(h.CELLS_Y * 0.05);
      const yBot = Math.floor(h.CELLS_Y * (0.45 + Math.random() * 0.15 + ri * 0.25));  // più profondo
      for (let y = yTop; y <= yBot; y++) {
        const wobble = Math.round(Math.sin(y * 0.8) * (1 + ri * 3));  // oscillazione ×4
        h.depositPoint(fields.voice, cx + wobble, y, f * (0.5 + Math.random() * 0.5));
      }
      // Ramificazione: 1-2 normali → fino a 5 durante rupture
      const nBranch = 1 + Math.floor(Math.random() * 2) + Math.floor(ri * 3);
      for (let b = 0; b < nBranch; b++) {
        const brY = yTop + Math.floor(Math.random() * (yBot - yTop));
        const brDir = Math.random() < 0.5 ? -1 : 1;
        const brLen = 3 + Math.floor(Math.random() * 5) + Math.floor(ri * 4);
        for (let i = 0; i < brLen; i++) {
          h.depositPoint(fields.voice, cx + brDir * (i + 1), brY + i, f * 0.3 * (1 - i / brLen));
        }
      }
    },
  },

  // v3.17.1: density cap contro tovaglia — il suolo SOLCO riempiva tutta la metà inferiore
  maxDensity: {
    drone: 0.45,   // terreno: sedimenta sparso, non una coperta uniforme
    bass:  0.65,   // colonne visibili ma con pause tra una e l'altra
    chord: 0.55,   // pioggia e orizzonte leggibili, non saturi
  },

  // glifi dub: echi verticali, punti cadenti — il fulmine ha una voce ASCII
  glyphs: {
    roles: ['voice', 'kick'],
    chars: '|!∙:;▼',
    threshold: 0.35,
    opacity: 0.85,
  },
};

// ── NEBBIA ── C lydian, no BPM — un lago nella nebbia
// Spazialità verticale: lago in basso, nebbia al centro, cielo in alto.
// Chord = il lago (bande larghe sfumate, Y 55-95%)
// Drone = la nebbia (zone appena più chiare del fondo, Y 25-75%)
// Voice/Lead = luci sopra la nebbia (punti luminosi, Y 0-35%)
const NEBBIA = {
  bg: [0, 0, 0],                     // nero puro — il vuoto è il campo
  colors: {
    drone:      [40,  45,  95],    // indaco più luminoso — visibile su nero
    bass:       [0,   0,   0],     // assente
    chord:      [100, 110, 170],   // pervinca nebbiosa
    kick:       [0,   0,   0],     // assente
    percussion: [0,   0,   0],     // assente
    arp:        [0,   0,   0],     // assente
    voice:      [255, 210, 150],   // ambra calda — unico punto caldo nel freddo
    lead:       [240, 240, 245],   // bianco freddo — scia luminosa
  },
  decay: {
    drone:      0.9998,  // quasi permanente — la nebbia si accumula, non scompare
    bass:       1.000,
    chord:      0.9993,  // il lago persiste — l'accordo suona 8-32 bar
    kick:       1.000,
    percussion: 1.000,
    arp:        1.000,
    voice:      0.9955,  // stelle effimere — ~1.5s
    lead:       0.9965,  // scia lunga — persiste ~4s
  },
  force: {
    drone: 0.025,     // forte — la coltre deve formarsi, visibile su nero
    bass:  0,
    chord: 0.05,      // delicato — il lago è quieto
    kick:  0,
    percussion: 0,
    arp:   0,
    voice: 0.60,
    lead:  0.18,
  },
  maxDensity: {
    drone: 0.65, bass: 0, chord: 0.35, kick: 0, percussion: 0,
    arp: 0, voice: 0.75, lead: 0.50,
  },
  // Audio-reactive: le chiazze respirano — si espandono con l'audio, si ritirano nel silenzio
  // RUPTURE: il respiro si fa pesante, le chiazze si gonfiano
  audioReact(fields, energy, h) {
    const ri = h.rupture.intensity;
    const n = h.CELLS_X * h.CELLS_Y;
    if (energy > 0.01) {
      // inspirazione: la nebbia esistente si addensa — coltre
      const grow = energy * (0.012 + ri * 0.025);
      const cap = 0.55 + ri * 0.30;
      for (let i = 0; i < n; i++) {
        if (fields.drone[i] > 0.01 && fields.drone[i] < cap) {
          fields.drone[i] += grow;
        }
      }
    } else {
      // espirazione: le chiazze si ritirano lentamente — il nero torna
      for (let i = 0; i < n; i++) {
        if (fields.drone[i] > 0.005) {
          fields.drone[i] *= 0.997;
        }
      }
    }
  },

  depositFn: {
    // Drone: POLVERE SPARSA — punti singoli distribuiti su un'area ampia
    // nessun blob, nessuna forma — solo particelle di nebbia
    // RUPTURE: più punti, più densi
    drone(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const pp = h.phaseProgress;
      const phase = h.phase;
      // germoglio: pochi punti, crescono lentamente
      // pulsazione/densita: molti punti, coprono il campo
      // rottura: picco massimo — la nebbia esplode
      let baseCount, baseF;
      if (phase === 'germoglio')         { baseCount = 6 + Math.floor(pp * 14); baseF = 0.04 + pp * 0.03; }
      else if (phase === 'pulsazione')   { baseCount = 20 + Math.floor(pp * 10); baseF = 0.07; }
      else if (phase === 'densita')      { baseCount = 30; baseF = 0.08; }
      else if (phase === 'rottura')      { baseCount = 30 + Math.floor(ri * 15); baseF = 0.09; }
      else /* dissoluzione */            { baseCount = 14; baseF = 0.05; }
      const count = baseCount + Math.floor(ri * 12);
      const f = baseF * (1 + ri * 2);
      for (let i = 0; i < count; i++) {
        const px = Math.floor(Math.random() * h.CELLS_X);
        const py = Math.floor(Math.random() * h.CELLS_Y);
        if (fields.drone[py * h.CELLS_X + px] > 0.35 + ri * 0.30) continue;
        h.depositPoint(fields.drone, px, py, f);
      }
    },

    // Voice: SEGNALE — punto singolo ovunque nel campo
    // RUPTURE: i segnali si moltiplicano — 2-5 punti per evento
    voice(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const n = 1 + Math.floor(ri * 4);  // 1 → 5 punti
      for (let i = 0; i < n; i++) {
        const cy = Math.floor(Math.random() * h.CELLS_Y);
        const cx = Math.floor(Math.random() * h.CELLS_X);
        h.depositPoint(fields.voice, cx, cy, 0.75);
      }
    },

    // Lead: SCIA LENTA ovunque nel campo
    // RUPTURE: scie più lunghe e veloci
    lead(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const cy = Math.floor(Math.random() * h.CELLS_Y);
      const cx = Math.floor(Math.random() * h.CELLS_X);
      const dir = Math.random() < 0.5 ? -1 : 1;
      particles.lead.push({
        cx, cy,
        vx: dir * (0.30 + Math.random() * 0.25) * (1 + ri),
        f: 0.22 * (1 + ri),
        age: 0,
        maxAge: (35 + Math.floor(Math.random() * 25)) * (1 + ri * 0.5),
      });
    },

    // Chord: VELATURE ORIZZONTALI nella metà bassa (Y 50-90%)
    // germoglio: velature corte e deboli — il lago si forma piano
    // pulsazione→rottura: velature piene
    // RUPTURE: velature più larghe e fitte, gap spariscono
    chord(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const pp = h.phaseProgress;
      const phase = h.phase;
      // germoglio: skip frequente, velature corte e deboli
      let skipChance, widthMult, fMult;
      if (phase === 'germoglio')         { skipChance = 0.50 * (1 - pp); widthMult = 0.3 + pp * 0.4; fMult = 0.4 + pp * 0.4; }
      else if (phase === 'pulsazione')   { skipChance = 0.05; widthMult = 0.7 + pp * 0.3; fMult = 0.8 + pp * 0.2; }
      else                               { skipChance = 0; widthMult = 1.0; fMult = 1.0; }
      if (Math.random() < skipChance) return;
      const cy = Math.floor(h.CELLS_Y * (0.50 + Math.random() * 0.40));
      const widthPct = (0.20 + Math.random() * 0.30 + ri * 0.40) * widthMult;
      const width = Math.floor(h.CELLS_X * Math.min(widthPct, 0.95));
      const start = Math.floor(Math.random() * (h.CELLS_X - width));
      const f = 0.06 * fMult * (1 + ri * 2);
      for (let cx = start; cx < start + width; cx++) {
        if (Math.random() < 0.12 * (1 - ri)) continue;
        h.depositPoint(fields.chord, cx, cy, f);
      }
    },
  },
  // grana: drone GROSSO (banchi nebbia), chord GROSSO (lago), voice media (stelle)
  cellPx: {
    drone: 6, voice: 10, lead: 7, chord: 16,
  },
  // NEBBIA: NESSUNA solidificazione — il vuoto è il punto.
  // Layer A (silence) cristallizzava il drone tra un'emissione e l'altra.
  // Layer C (spatial) sedimentava la metà bassa senza motivo (no gravità).
  // Risultato: le tracce persistevano invece di scomparire.
  freeze: {
    roleEnabled: false,    // Layer A off — il silenzio non conserva
    spatial: false,         // Layer C off — nessuna sedimentazione spaziale
    densityThreshold: 0.9,  // Layer B: solo materia quasi satura si congela
  },

  // glifi nebbia: punti e silenzi — la nebbia sussurra
  glyphs: {
    roles: ['voice', 'lead'],
    chars: '∙·○',
    threshold: 0.30,
    opacity: 0.75,
  },
};

// ══════════════════════════════════════════════════════════════
//  TESSUTO — D aeolian 86 BPM — "qualcosa emerge"
//  Fisica: tensione orizzontale. Le fibre non cadono — pulsano.
//  Immagine: tessuto muscolare al microscopio, fasci che battono.
//  Chord = protagonista ritmico (telaio staccato). Lead = voce.
// ══════════════════════════════════════════════════════════════
const TESSUTO = {
  bg: [6, 4, 10],                   // nero violaceo profondo — spazio per le fibre
  colors: {
    drone:      [45,  30,  50],    // aubergine scuro — il telaio
    bass:       [140,  55, 120],   // magenta scuro — distinto dal drone aubergine
    chord:      [205, 215,  30],   // chartreuse — protagonista (invariato)
    kick:       [240, 230, 210],   // cream caldo
    percussion: [150, 130, 115],   // grigio caldo
    arp:        [0,   0,   0],     // assente
    voice:      [0,   0,   0],     // tace
    lead:       [255, 210, 140],   // ambra luminosa — si impone sullo sfondo
  },
  decay: {
    drone:      0.9997,   // quasi permanente — trama di fondo
    bass:       0.994,    // sostenuto, tiene la nota
    chord:      0.965,    // staccato RAPIDO — appare, sparisce, battito visibile
    kick:       0.500,    // flash brevissimo — onda che svanisce subito
    percussion: 0.650,
    arp:        1.000,    // assente
    voice:      1.000,    // TACE
    lead:       0.9955,   // persistente — striscia luminosa che resta
  },
  force: {
    drone: 0.004,  bass: 0.55,  chord: 0.70,
    kick: 0.80,    percussion: 0.35,
    arp: 0,        voice: 0,    lead: 0.90,
  },
  // phaseColors: il tessuto si scalda e si tinge — da freddo a incandescente
  phaseColors: {
    germoglio:    { chord: [180, 195,  25] },  // chartreuse tenue — le fibre germinano
    pulsazione:   { chord: [210, 220,  40] },  // chartreuse pieno — le fibre pulsano
    densita:      { chord: [230, 235,  60], lead: [255, 225, 160] },  // lead diventa oro caldo
    rottura:      { chord: [255, 240,  80], lead: [255, 255, 200] },  // lead bianco incandescente
    dissoluzione: { chord: [140, 150,  20], lead: [200, 160, 100] },  // le fibre si spengono
  },

  depositFn: {
    // ── FASCE VERTICALI DEDICATE ──
    // lead:  Y 0.03–0.22  (spazio aereo, in alto)
    // chord: Y 0.15–0.55  (fibre protagoniste, fascia centrale larga)
    // bass:  Y 0.52–0.72  (fascia sostenuta)
    // kick:  Y 0.74        (orizzonte)
    // drone: Y 0.05–0.95  (sparse su tutto — il telaio)

    // Drone: fibre permanenti sparse su TUTTO il campo (non cluster)
    // RUPTURE: le fibre ondeggiano — Y varia lungo X con ampiezza crescente
    // v3.17.1: deposit PROBABILISTICO (non una riga continua) — evita il telaio pieno
    drone(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      // Mappa la nota su tutto il canvas (5-95%) — il telaio copre tutto
      const t = h.clamp((note127 - 38) / (72 - 38), 0, 1);
      const baseY = Math.floor(h.CELLS_Y * (0.05 + (1 - t) * 0.90));
      const waveAmp = ri * 4;  // 0 → ±4 celle di ondulazione
      const waveFreq = 0.08 + Math.random() * 0.06;
      const wavePhase = Math.random() * Math.PI * 2;
      // Probabilità 45% per cella: fibra discontinua, trama vera (non riga compatta)
      for (let cx = 0; cx < h.CELLS_X; cx++) {
        if (Math.random() > 0.45) continue;
        const cy = h.clamp(baseY + Math.round(Math.sin(cx * waveFreq + wavePhase) * waveAmp), 0, h.CELLS_Y - 1);
        h.depositPoint(fields.drone, cx, cy, 0.004);
      }
    },

    // Chord: FIBRE nella fascia centrale (Y 15-55%) — il protagonista staccato
    // Varietà: 50% continue, 30% tratteggiate, 20% doppie
    // RUPTURE: le fibre rompono l'orizzontalità — Y jitterata ±(5 × intensity)
    chord(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      // Fascia dedicata: note 50-67 → Y 15%-55%
      const t = h.clamp((note127 - 50) / (67 - 50), 0, 1);
      const baseY = Math.floor(h.CELLS_Y * (0.15 + (1 - t) * 0.40));
      const f = (vel127 / 127) * 0.70;
      const width = Math.floor(h.CELLS_X * (0.25 + Math.random() * 0.75));
      const start = Math.floor(Math.random() * (h.CELLS_X - width));
      const jitterAmp = ri * 5;  // 0 → ±5 celle di deviazione verticale
      const roll = Math.random();
      if (roll < 0.5) {
        const thick = 1 + Math.floor(Math.random() * 2);
        for (let cx = start; cx < start + width; cx++) {
          const cy = h.clamp(baseY + Math.round((Math.random() - 0.5) * 2 * jitterAmp), 0, h.CELLS_Y - 2);
          h.depositPoint(fields.chord, cx, cy, f);
          for (let tt = 1; tt < thick; tt++) {
            if (cy + tt < h.CELLS_Y) h.depositPoint(fields.chord, cx, cy + tt, f * (0.5 / tt));
          }
        }
      } else if (roll < 0.8) {
        const gapLen = 4 + Math.floor(Math.random() * 4);
        for (let cx = start; cx < start + width; cx++) {
          if ((cx - start) % (gapLen * 2) >= gapLen) continue;
          const cy = h.clamp(baseY + Math.round((Math.random() - 0.5) * 2 * jitterAmp), 0, h.CELLS_Y - 2);
          h.depositPoint(fields.chord, cx, cy, f);
          if (cy + 1 < h.CELLS_Y) h.depositPoint(fields.chord, cx, cy + 1, f * 0.3);
        }
      } else {
        const gap = 2 + Math.floor(Math.random() * 2);
        for (let cx = start; cx < start + width; cx++) {
          const cy = h.clamp(baseY + Math.round((Math.random() - 0.5) * 2 * jitterAmp), 0, h.CELLS_Y - 2);
          h.depositPoint(fields.chord, cx, cy, f * 0.8);
          if (cy + gap < h.CELLS_Y) h.depositPoint(fields.chord, cx, cy + gap, f * 0.6);
        }
      }
    },

    // Lead: COLONNA VERTICALE luminosa — sviluppo principale su asse X
    // Nota→X: pitch determina la posizione orizzontale (grave=sinistra, acuta=destra)
    // Velocity→altezza: forte = colonna alta, piano = tratto corto
    // Sempre visibile anche con camera zoomata su Y
    // RUPTURE: jitter orizzontale — la colonna si sposta lateralmente
    lead(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const t = h.clamp((note127 - 62) / (79 - 62), 0, 1);
      // X: nota determina la colonna (grave→sinistra, acuta→destra)
      const centerX = Math.floor(h.CELLS_X * (0.08 + t * 0.84));
      const jitterX = Math.round((Math.random() - 0.5) * 2 * ri * 4);
      const cx = h.clamp(centerX + jitterX, 2, h.CELLS_X - 3);
      // Y: colonna che copre buona parte del campo verticale
      const velN = vel127 / 127;
      const height = Math.floor(h.CELLS_Y * (0.35 + velN * 0.45));
      const startY = Math.floor((h.CELLS_Y - height) * (0.2 + Math.random() * 0.6));
      const f = velN * 0.90;
      for (let dy = 0; dy < height; dy++) {
        const cy = startY + dy;
        if (cy < 0 || cy >= h.CELLS_Y) continue;
        // fade verticale ai bordi — cuore luminoso al centro
        const nt = dy / height;
        const edgeFade = nt < 0.15 ? nt / 0.15
                       : nt > 0.85 ? (1 - nt) / 0.15
                       : 1.0;
        const ff = f * Math.max(0.25, edgeFade);
        h.depositPoint(fields.lead, cx, cy, ff);               // colonna centrale
        h.depositPoint(fields.lead, cx - 1, cy, ff * 0.55);    // alone sinistra
        h.depositPoint(fields.lead, cx + 1, cy, ff * 0.55);    // alone destra
        h.depositPoint(fields.lead, cx - 2, cy, ff * 0.15);    // sfumatura esterna
        h.depositPoint(fields.lead, cx + 2, cy, ff * 0.15);
      }
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
    // v3.17.1: larghezza ridotta (era 50-80% → 25-50%) — evita la fascia magenta uniforme
    bass(fields, particles, note127, vel127, h) {
      const t = h.clamp((note127 - 26) / (45 - 26), 0, 1);
      const baseY = Math.floor(h.CELLS_Y * (0.78 + (1 - t) * 0.15));
      const cy = h.clamp(baseY + Math.floor((Math.random() - 0.5) * 6), Math.floor(h.CELLS_Y * 0.76), h.CELLS_Y - 2);
      const f = (vel127 / 127) * 0.60;
      const width = Math.floor(h.CELLS_X * (0.25 + Math.random() * 0.25));
      const start = Math.floor(Math.random() * (h.CELLS_X - width));
      for (let cx = start; cx < start + width; cx++) {
        h.depositPoint(fields.bass, cx, cy, f);
        h.depositPoint(fields.bass, cx, cy + 1, f * 0.45);
        h.depositPoint(fields.bass, cx, cy + 2, f * 0.15);
      }
    },
  },

  // grana: lead GROSSO e luminoso — si stacca dalle fibre chord
  cellPx: {
    lead: 12,
  },
  // v3.17.1: density cap completo — bass/drone non devono saturare le rispettive fasce
  maxDensity: {
    lead:  0.95,   // striscia densa e piena (invariato)
    bass:  0.55,   // fondamenta leggibili, non fascia magenta compatta
    drone: 0.35,   // telaio visibile ma sottile, non tovaglia aubergine
  },
  // glifi tessuto: trame e orditi — le fibre parlano
  glyphs: {
    roles: ['lead', 'kick'],
    chars: '—|+×:',
    threshold: 0.30,
    opacity: 0.85,
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
  bg: [4, 4, 12],                     // nero blu profondo — vuoto freddo
  colors: {
    drone:      [90, 105, 155],      // lavanda scura — più contrasto col nero, meno tovaglia
    bass:       [0,   0,   0],       // scrive su drone (pori)
    chord:      [0,   0,   0],       // scrive su drone (increspature)
    kick:       [0,   0,   0],       // assente
    percussion: [0,   0,   0],       // assente
    arp:        [0,   0,   0],       // assente
    voice:      [255, 185, 155],     // corallo caldo — alone iridescente ai bordi
    lead:       [175, 160, 225],     // lavanda fredda — alone freddo ai bordi
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

  // Colori che evolvono: membrana nasce tenue, si illumina al picco, si spegne
  phaseColors: {
    germoglio:    { drone: [90,  105, 155] },  // base lavanda scura (= colors.drone)
    pulsazione:   { drone: [120, 135, 185] },  // più luminosa — membrana viva
    densita:      { drone: [145, 160, 210] },  // massima luminosità
    rottura:      { drone: [100, 115, 165] },  // la frattura incrina — luce cala
    dissoluzione: { drone: [50,   55,  80] },  // si spegne — grigio blu tenue
  },

  // Tensione superficiale phase-aware + variabile nello spazio
  // germoglio: membrana sottile con buchi — target basso
  // pulsazione/densita: membrana piena
  // rottura: i pori si aprono — la membrana cede
  // dissoluzione: buchi restano aperti, la membrana si dissolve
  // RUPTURE: il self-heal rallenta → i pori restano aperti
  audioReact(fields, energy, h) {
    const ri = h.rupture.intensity;
    const pp = h.phaseProgress;
    const phase = h.phase;

    // target base per fase — la membrana non è mai uniformemente piena
    // v3.18: baseTarget ulteriormente abbassato + hard cutoff sotto 0.12 per
    // creare zone MORTE vere (nero assoluto, non rumore di fondo Bayer).
    let baseTarget;
    if (phase === 'germoglio')         baseTarget = 0.08 + pp * 0.12;  // 0.08→0.20
    else if (phase === 'pulsazione')   baseTarget = 0.15 + pp * 0.08;  // 0.15→0.23
    else if (phase === 'densita')      baseTarget = 0.22;               // era 0.35 (tovaglia)
    else if (phase === 'rottura')      baseTarget = 0.22 - pp * 0.16;  // 0.22→0.06
    else /* dissoluzione */            baseTarget = 0.12 - pp * 0.10;  // 0.12→0.02

    const heal = (0.004 + energy * 0.003) * (1 - ri * 0.85);
    const n = h.CELLS_X * h.CELLS_Y;
    // tempo lento per drift organico (~0.3 rad/s a 60fps)
    const t = (h.frameCount || 0) * 0.005;
    for (let i = 0; i < n; i++) {
      const cx = i % h.CELLS_X;
      const cy = (i / h.CELLS_X) | 0;
      const xN = cx / h.CELLS_X, yN = cy / h.CELLS_Y;
      // v3.17.1: ampiezza portata a ±0.44 (era ±0.32) per creare zone chiare/scure
      // vere sopra il baseTarget ridotto. Tutti termini non-separabili (niente tartan).
      const spatial =
          Math.sin(xN * 4.7 + yN * 1.3 + t * 0.3) * 0.16   // onda larga obliqua — contrasto principale
        + Math.sin(xN * 1.9 + yN * 3.3 - t * 0.2) * 0.14   // onda larga trasversale
        + Math.sin(xN * 11.1 + yN * 7.9 + t) * 0.08        // diagonale media
        + Math.sin(xN * 19.3 - yN * 13.7 - t * 0.7) * 0.06;// grana fine
      // audio modula l'ampiezza: più energia = più contrasto nella membrana
      const amp = 1 + energy * 0.5;
      let target = Math.max(0, Math.min(1, baseTarget + spatial * amp));
      // Hard cutoff: zone con target < 0.12 → morte (nero assoluto, niente Bayer dither di fondo)
      // Rompe la percezione tovaglia: 35-45% dello schermo è vuoto vero, non "rumore a bassa intensità".
      if (target < 0.12) target = 0;
      if (target === 0) {
        // Zone morte: fai decadere verso 0 (evita residui da phase precedente)
        if (fields.drone[i] > 0) fields.drone[i] *= 0.92;
      } else if (fields.drone[i] < target) {
        fields.drone[i] += heal;
        if (fields.drone[i] > target) fields.drone[i] = target;
      }
    }
  },

  depositFn: {
    // Voice: poro IRREGOLARE — ellisse deformata + alone con variazione angolare
    // RUPTURE: pori più grandi, il campo si svuota — inversione totale
    voice(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const cy = h.localPitchToCell(note127, 67, 84);
      const cx = Math.floor(h.CELLS_X * 0.12 + Math.random() * h.CELLS_X * 0.76);
      const baseR = 2 + Math.floor((vel127 / 127) * 2.5) + Math.floor(ri * 3);  // pori ×2
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
    // RUPTURE: pori crescono — convergono verso le dimensioni di voice
    lead(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const cy = h.localPitchToCell(note127, 72, 84);
      const cx = Math.floor(h.CELLS_X * 0.25 + Math.random() * h.CELLS_X * 0.5);
      const r = 1 + Math.floor((vel127 / 127)) + Math.floor(ri * 2);
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
    // RUPTURE: pori enormi — la membrana è più buco che materia
    bass(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const cy = h.localPitchToCell(note127, 36, 48);
      const cx = Math.floor(h.CELLS_X / 2 + (Math.random() - 0.5) * (12 + ri * 20));  // posizioni più sparse
      const r = 4 + Math.floor((vel127 / 127) * 2) + Math.floor(ri * 4);  // raggio ×2
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

  // glifi respiro: bolle e cerchi — i pori della membrana hanno una voce
  glyphs: {
    roles: ['voice', 'lead'],
    chars: '○◦∘·',
    threshold: 0.40,
    opacity: 0.75,
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
  bg: [8, 8, 20],                  // nero navy profondo (Ikeda)
  colors: {
    drone:      [30,  30,  50],   // navy scuro
    bass:       [248, 237,   0],  // giallo elettrico (invariato)
    chord:      [80,   80, 120],  // navy chiaro
    kick:       [255, 255, 255],  // bianco puro — distinto dal giallo bass
    percussion: [220,  55,  65],  // rosa caldo
    arp:        [0,   230, 160],  // ciano (invariato)
    voice:      [250, 175,  60],  // ambra dorata — caldo vs ciano
    lead:       [180,  40, 110],  // magenta scuro — distinto dal rosa percussion
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
    drone: 0.30, bass: 0.80, chord: 0.65, kick: 0.95,
    percussion: 0.75, arp: 0.90, voice: 0.85, lead: 0.80,
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
    // RUPTURE: il cursore sbanda — posizione jitterata, trail frammentato
    arp(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const idx = (note127 * 3) % (h.CELLS_X * h.CELLS_Y);
      const cy0 = Math.floor(idx / h.CELLS_X);
      const cx0 = idx % h.CELLS_X;
      // RUPTURE: posizione jitterata ±1-2 celle
      const jit = Math.round((Math.random() - 0.5) * 2 * ri * 2);
      const cy = h.clamp(cy0 + jit, 0, h.CELLS_Y - 1);
      const cx = h.clamp(cx0 + Math.round((Math.random() - 0.5) * 2 * ri * 2), 0, h.CELLS_X - 1);
      const f = (vel127 / 127) * (1.00 - ri * 0.50);  // forza dimezzata a takeover
      h.depositPoint(fields.arp, cx, cy, f);
      h.depositPoint(fields.arp, cx, Math.max(0, cy - 1), f * 0.3);
      h.depositPoint(fields.arp, cx, Math.min(h.CELLS_Y - 1, cy + 1), f * 0.3);
      for (let i = 1; i <= 10; i++) {
        if (ri > 0.3 && Math.random() < ri * 0.5) continue;  // trail frammentato
        const tx = (cx - i + h.CELLS_X) % h.CELLS_X;
        h.depositPoint(fields.arp, tx, cy, f * (0.6 / Math.sqrt(i)));
      }
    },

    // Kick: COLONNA VERTICALE intera — binario on/off, la macchina batte
    // RUPTURE: snap a griglia 2 invece di 4 — binario corrotto, forza dimezzata
    kick(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const cx = Math.floor(Math.random() * h.CELLS_X);
      const kickF = 0.80 * (1 - ri * 0.50);  // 0.80 → 0.40 a takeover
      for (let cy = 0; cy < h.CELLS_Y; cy++) {
        // RUPTURE: gap nella colonna — il segnale si corrompe
        if (ri > 0.2 && Math.random() < ri * 0.3) continue;
        h.depositPoint(fields.kick, cx, cy, kickF);
      }
      const sideF = 0.25 * (1 - ri * 0.50);
      if (cx > 0) for (let cy = 0; cy < h.CELLS_Y; cy++) h.depositPoint(fields.kick, cx - 1, cy, sideF);
      if (cx < h.CELLS_X - 1) for (let cy = 0; cy < h.CELLS_Y; cy++) h.depositPoint(fields.kick, cx + 1, cy, sideF);
    },

    // Bass: TRACCE DI CIRCUITO — percorsi a L che collegano 2 nodi sulla griglia
    // RUPTURE: la griglia 4 diventa griglia 2 (binario corrotto), tracce spezzate
    bass(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const f = (vel127 / 127) * 0.70 * (1 - ri * 0.35);
      const gridSnap = ri > 0.5 ? 2 : 4;  // griglia corrotta
      const x1 = Math.floor(Math.random() * h.CELLS_X / gridSnap) * gridSnap;
      const y1 = Math.floor(Math.random() * h.CELLS_Y / gridSnap) * gridSnap;
      const x2 = Math.floor(Math.random() * h.CELLS_X / gridSnap) * gridSnap;
      const y2 = Math.floor(Math.random() * h.CELLS_Y / gridSnap) * gridSnap;
      const xMin = Math.min(x1, x2), xMax = Math.max(x1, x2);
      const yMin = Math.min(y1, y2), yMax = Math.max(y1, y2);
      if (Math.random() < 0.5) {
        for (let x = xMin; x <= xMax; x++) {
          if (ri > 0.3 && Math.random() < ri * 0.25) continue;  // tracce spezzate
          h.depositPoint(fields.bass, x, y1, f);
        }
        for (let y = yMin; y <= yMax; y++) {
          if (ri > 0.3 && Math.random() < ri * 0.25) continue;
          h.depositPoint(fields.bass, x2, y, f);
        }
      } else {
        for (let y = yMin; y <= yMax; y++) {
          if (ri > 0.3 && Math.random() < ri * 0.25) continue;
          h.depositPoint(fields.bass, x1, y, f);
        }
        for (let x = xMin; x <= xMax; x++) {
          if (ri > 0.3 && Math.random() < ri * 0.25) continue;
          h.depositPoint(fields.bass, x, y2, f);
        }
      }
      // Nodi: blocchetti 3×3 — si deteriorano
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (ri > 0.5 && Math.random() < ri * 0.4) continue;
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
    // RUPTURE: mirino trema, bracci della croce si spezzano
    voice(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const jit = Math.round((Math.random() - 0.5) * 2 * ri * 3);
      const cy = h.clamp(Math.floor((note127 * 7) % h.CELLS_Y) + jit, 0, h.CELLS_Y - 1);
      const cx = h.clamp(Math.floor((note127 * 13) % h.CELLS_X) + jit, 0, h.CELLS_X - 1);
      const f = (vel127 / 127) * 0.80 * (1 - ri * 0.40);
      h.depositPoint(fields.voice, cx, cy, f);
      for (let i = 1; i <= 5; i++) {
        if (ri > 0.3 && Math.random() < ri * 0.4) continue;  // bracci spezzati
        const fade = f * 0.3 / i;
        h.depositPoint(fields.voice, cx + i, cy, fade);
        h.depositPoint(fields.voice, cx - i, cy, fade);
        h.depositPoint(fields.voice, cx, cy + i, fade);
        h.depositPoint(fields.voice, cx, cy - i, fade);
      }
    },

    // Lead: MIRINO specchiato — posizione complementare alla voice
    // RUPTURE: stesso tremolio, croce degradata
    lead(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const jit = Math.round((Math.random() - 0.5) * 2 * ri * 3);
      const cy = h.clamp(h.CELLS_Y - 1 - Math.floor((note127 * 7) % h.CELLS_Y) + jit, 0, h.CELLS_Y - 1);
      const cx = h.clamp(h.CELLS_X - 1 - Math.floor((note127 * 13) % h.CELLS_X) + jit, 0, h.CELLS_X - 1);
      const f = (vel127 / 127) * 0.65 * (1 - ri * 0.40);
      h.depositPoint(fields.lead, cx, cy, f);
      for (let i = 1; i <= 4; i++) {
        if (ri > 0.3 && Math.random() < ri * 0.4) continue;
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

  // glifi macchina: codice binario e circuiti — il terminale parla
  glyphs: {
    roles: ['arp', 'voice', 'lead', 'kick'],
    chars: '01▸▪□×',
    threshold: 0.35,
    opacity: 0.90,
    color: [0, 230, 160],   // ciano — contrasta col navy/giallo
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
  bg: [0, 0, 0],                    // nero puro (invariato)
  colors: {
    drone:      [28,  20,  55],    // viola profondo — la b2 come colore
    bass:       [220, 230, 255],   // bianco azzurro — sub freddo (≠ kick puro)
    chord:      [115,  90, 170],   // viola medio — tensione phrygian
    kick:       [255, 255, 255],   // bianco puro flash
    percussion: [255,  45,  65],   // rosso fuoco
    arp:        [70,   55, 110],   // viola scuro — texture caotica
    voice:      [255, 220, 180],   // ambra chiara — hocket 1 caldo (≠ kick bianco)
    lead:       [215,   0,  30],   // carmine puro hocket 2 (invariato)
  },
  // Density cap — evita il muro grigio: bass/chord/arp capped, voice/lead liberi
  maxDensity: {
    drone: 0.40, bass: 0.75, chord: 0.60, kick: 0.95,
    percussion: 0.80, arp: 0.50,
    voice: 0.95, lead: 0.95,  // protagonisti: quasi liberi
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

  // phaseColors: l'aurora cresce dal viola profondo al bianco infuocato
  phaseColors: {
    germoglio:    { drone: [35, 25, 70] },   // viola più profondo — il buio prima della tempesta
    pulsazione:   { drone: [40, 30, 80], chord: [130, 100, 190] },  // il viola si accende
    densita:      { chord: [145, 110, 200], voice: [255, 240, 200] },  // picco luminoso
    rottura:      { percussion: [255, 80, 40], voice: [255, 255, 220] },  // rosso→arancio, voice incandescente
    dissoluzione: { drone: [20, 15, 35], chord: [60, 45, 90] },  // il buio ritorna
  },

  // IMPULSI DIREZIONALI + EROSIONE — crea vuoti temporanei che i filamenti riempiono
  // RUPTURE: suscettibilità converge a 1.0, erosione più violenta, campo si comprime
  audioReact(fields, energy, h) {
    const ri = h.rupture.intensity;
    _tempestaTimer--;
    if (_tempestaTimer <= 0) {
      const angle = Math.random() * Math.PI * 2;
      _tempestaDir.dx = Math.cos(angle);
      _tempestaDir.dy = Math.sin(angle);
      // RUPTURE: cambi di direzione più frequenti e frenetici
      _tempestaTimer = Math.max(1, Math.floor((3 + Math.floor(Math.random() * 12)) * (1 - ri * 0.6)));
    }

    // EROSIONE DIREZIONALE — durante rupture l'erosione è molto più forte
    const erosion = (0.03 + energy * 0.04) * (1 + ri * 2);
    const erodeRoles = ['bass', 'chord', 'arp', 'drone'];
    for (const er of erodeRoles) {
      const ef = fields[er];
      const edx = Math.round(-_tempestaDir.dx);
      const edy = Math.round(-_tempestaDir.dy);
      if (edx === 0 && edy === 0) break;
      // RUPTURE: suscettibilità converge a 1.0 anche per l'erosione
      const baseS = _tempestaSusceptibility[er];
      const erodeS = baseS + (1 - baseS) * ri;
      for (let cy = 0; cy < h.CELLS_Y; cy++) {
        for (let cx = 0; cx < h.CELLS_X; cx++) {
          const i = cy * h.CELLS_X + cx;
          if (ef[i] > 0.05) {
            ef[i] *= (1 - erosion * erodeS);
          }
        }
      }
    }

    const strength = 0.15 + energy * 0.25;  // più audio = impulso più forte
    const roles = ['arp', 'voice', 'lead', 'percussion', 'chord', 'bass', 'drone'];

    for (const role of roles) {
      // RUPTURE: suscettibilità converge a 1.0 — tutto è in balia del vento
      const baseS = _tempestaSusceptibility[role];
      const susc = (baseS + (1 - baseS) * ri) * strength;
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
    // RUPTURE: tende diventano enormi, attraversano TUTTO il campo (30+ → 60+ celle)
    voice(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const cx0 = Math.floor(Math.random() * h.CELLS_X);
      const f = (vel127 / 127) * (1.00 + ri * 0.50);  // più intense
      // RUPTURE: filamento enorme — fino a 70 celle
      const len = 25 + Math.floor(Math.random() * 20) + Math.floor(ri * 25);
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
    // RUPTURE: converge con voice — stesso ordine di grandezza
    lead(fields, particles, note127, vel127, h) {
      const ri = h.rupture.intensity;
      const cx0 = Math.floor(Math.random() * h.CELLS_X);
      const f = (vel127 / 127) * (0.95 + ri * 0.50);
      const len = 18 + Math.floor(Math.random() * 15) + Math.floor(ri * 20);
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

  // glifi tempesta: furia e vento — l'aurora ha frecce e lampi
  glyphs: {
    roles: ['voice', 'lead', 'kick'],
    chars: '▲▼▸◆!',
    threshold: 0.35,
    opacity: 0.85,
  },
};

// ══════════════════════════════════════════════════════════════
//  RITORNO — A aeolian 86 BPM — "ti rilascia"
//  Non è un bioma: è il congedo. È una posizione della camera.
//  La camera lascia la superficie del pianeta e sale in orbita.
//  Il sedimento di tutti i biomi precedenti è visibile come geologia.
//  Le note di RITORNO = scintille 2px sparse sulla superficie.
//  Voice esposta, arp morente, dissoluzione 48 bar → il pianeta si spegne.
//  Immagine: Pale Blue Dot. Bianco e rosso corallo su nero.
//
//  planetMask: true → campo.js renderizza dentro maschera circolare
//  irregolare (contorni noise). Raggio guidato da fase:
//  germoglio cresce 0→70%, dissoluzione si restringe 70%→0.
// ══════════════════════════════════════════════════════════════
const RITORNO = {
  bg: [0, 0, 0],                    // nero PURO — lo spazio intorno al pianeta
  planetMask: true,                 // flag per campo.js: applica maschera circolare
  colors: {
    drone:      [230, 230, 235],   // bianco freddo brillante — sedimento luminoso
    bass:       [240, 90, 75],     // rosso corallo acceso — accento caldo
    chord:      [245, 245, 250],   // bianco quasi puro
    kick:       [255, 253, 250],   // bianco caldo pieno
    percussion: [210, 208, 205],   // grigio chiaro luminoso
    arp:        [235, 232, 238],   // grigio perla acceso
    voice:      [255, 254, 252],   // bianco puro — protagonista
    lead:       [250, 100, 85],    // rosso corallo brillante — eco caldo del bass
  },
  // Colori che sbiadiscono ma restano visibili: il pianeta si spegne lentamente
  // (alzati ~30-50% per restare leggibili in proiezione)
  phaseColors: {
    pulsazione:   { drone: [200, 198, 202], bass: [215, 78, 65], chord: [220, 218, 222],
                    voice: [252, 249, 247], lead: [225, 88, 75] },
    densita:      { drone: [165, 163, 167], bass: [195, 65, 55], chord: [190, 188, 192],
                    voice: [245, 240, 237], lead: [205, 72, 62] },
    rottura:      { drone: [125, 122, 127], bass: [165, 55, 48], chord: [150, 148, 152],
                    voice: [225, 220, 215], lead: [170, 58, 50] },
    dissoluzione: { drone: [85, 83, 87], bass: [115, 42, 35], chord: [100, 98, 102],
                    kick: [130, 128, 125], voice: [185, 178, 172], lead: [120, 45, 38] },
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
    drone: 0.008,  bass: 0.50,  chord: 0.40,
    kick: 0.60,    percussion: 0.35,
    arp: 0.20,     voice: 0.65,  lead: 0.40,
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

  // glifi ritorno: stelle e ricordi — la memoria ha una scrittura
  glyphs: {
    roles: ['voice', 'lead'],
    chars: '∙·*○∞',
    threshold: 0.30,
    opacity: 0.75,
  },
};

// ── ENCORE v2 ── Canon Machine — geometrie a blocchi, B/N + RGB puro
const ENCORE = {
  bg: [0, 0, 0],
  colors: {
    drone:      [30,  30,  30],    // grigio scurissimo — quasi invisibile
    bass:       [255, 255, 255],   // bianco (giallo solo a vel forte)
    chord:      [255, 255, 255],   // bianco (ciano solo a vel forte)
    kick:       [255, 255, 255],   // bianco puro
    percussion: [255, 255, 255],   // bianco — polvere
    arp:        [255, 255, 255],   // bianco (verde solo a vel forte)
    voice:      [255, 255, 255],   // bianco (blu solo a vel forte)
    lead:       [255, 255, 255],   // bianco (magenta solo a vel forte)
  },
  // Colori forti — usati quando velocity > threshold (campo.js li legge)
  colorsStrong: {
    bass:  [255, 255,   0],   // giallo
    chord: [0,   255, 255],   // ciano
    arp:   [0,   255,   0],   // verde
    voice: [0,   100, 255],   // blu elettrico
    lead:  [255,   0, 255],   // magenta
  },
  decay: {
    drone: 0.92, bass: 0.88, chord: 0.90,
    kick: 0.50, percussion: 0.60,
    arp: 0.85, voice: 0.90, lead: 0.87,
  },
  force: {
    drone: 0.03, bass: 0.90, chord: 0.85,
    kick: 1.00, percussion: 0.70,
    arp: 0.80, voice: 0.85, lead: 0.80,
  },
  maxDensity: {
    drone: 0.30, bass: 0.95, chord: 0.95,
    kick: 1.00, percussion: 0.80,
    arp: 0.95, voice: 0.95, lead: 0.90,
  },
  cellPx: {
    drone: 20, bass: 20, chord: 20,
    kick: 20, percussion: 20,
    arp: 20, voice: 20, lead: 20,
  },
  agingInverted: true,
  shimmerScale: 0.5,
  glyphs: false,
  planetMask: false,
  depositFn: (() => {
    function kickRow(fields, particles, note127, vel127, h) {
      const f = (vel127 / 127) * 0.9;
      const cy = Math.floor(h.CELLS_Y / 2) + Math.floor((Math.random() - 0.5) * 4);
      h.depositRow(fields.kick, h.clamp(cy, 0, h.CELLS_Y - 1), f);
      if (cy + 1 < h.CELLS_Y) h.depositRow(fields.kick, cy + 1, f * 0.4);
    }
    function snareInvert(fields, particles, note127, vel127, h) {
      const f = (vel127 / 127) * 0.6;
      const cy = Math.floor(Math.random() * h.CELLS_Y);
      const W = h.CELLS_X;
      const roles = ['drone', 'bass', 'chord', 'arp', 'voice', 'lead'];
      for (const r of roles) {
        const fld = fields[r];
        for (let dy = -1; dy <= 1; dy++) {
          const row = cy + dy;
          if (row < 0 || row >= h.CELLS_Y) continue;
          for (let x = 0; x < W; x++) {
            fld[row * W + x] = Math.max(0, fld[row * W + x] - f);
          }
        }
      }
      h.depositRow(fields.percussion, cy, f * 0.5);
    }
    function bassHalf(fields, particles, note127, vel127, h) {
      const f = (vel127 / 127) * 0.8;
      const top = note127 > 64;
      const fillCount = 20 + Math.floor(vel127 / 5);
      h.depositHalf(fields.bass, top, fillCount, f);
    }
    function arpDiagonal(fields, particles, note127, vel127, h) {
      const f = (vel127 / 127) * 0.7;
      const angle = note127 / 127;
      const thickness = vel127 > 90 ? 3 : vel127 > 60 ? 2 : 1;
      h.depositDiagonal(fields.arp, angle, thickness, f);
    }
    function voiceArc(fields, particles, note127, vel127, h) {
      const f = (vel127 / 127) * 0.75;
      const maxR = Math.min(h.CELLS_X, h.CELLS_Y) / 2;
      const radius = Math.floor(maxR * (1 - note127 / 127) + 2);
      const arcFrac = 0.25 + (vel127 / 127) * 0.75;
      h.depositArc(fields.voice, radius, arcFrac, f);
    }
    function leadCross(fields, particles, note127, vel127, h) {
      const f = (vel127 / 127) * 0.7;
      const cx = Math.floor((note127 / 127) * (h.CELLS_X - 1));
      const cy = Math.floor((1 - note127 / 127) * (h.CELLS_Y - 1));
      const armLen = vel127 > 80 ? 6 : vel127 > 50 ? 4 : 2;
      h.depositCross(fields.lead, cx, cy, armLen, f);
    }
    function chordQuadrant(fields, particles, note127, vel127, h) {
      const f = (vel127 / 127) * 0.6;
      const quadrant = Math.floor((note127 / 127) * 3.99);
      const fillRatio = vel127 > 90 ? 0.8 : vel127 > 60 ? 0.4 : 0.1;
      h.depositQuadrant(fields.chord, quadrant, fillRatio, f);
    }
    function percDust(fields, particles, note127, vel127, h) {
      const f = (vel127 / 127) * 0.5;
      const n = 3 + Math.floor(vel127 / 30);
      for (let i = 0; i < n; i++) {
        const px = Math.floor(Math.random() * h.CELLS_X);
        const py = Math.floor(Math.random() * h.CELLS_Y);
        h.depositPoint(fields.percussion, px, py, f);
      }
    }
    function droneGrain(fields, particles, note127, vel127, h) {
      const f = 0.15;
      for (let i = 0; i < 5; i++) {
        const px = Math.floor(Math.random() * h.CELLS_X);
        const py = Math.floor(Math.random() * h.CELLS_Y);
        h.depositPoint(fields.drone, px, py, f);
      }
    }
    function convergenceFlash(fields, particles, note127, vel127, h) {
      h.depositFlash(fields, 0.7);
    }
    return {
      drone: droneGrain,
      bass: bassHalf,
      chord: chordQuadrant,
      kick: kickRow,
      percussion: percDust,
      arp: arpDiagonal,
      voice: voiceArc,
      lead: leadCross,
      convergence: convergenceFlash,
    };
  })(),
};

// ══════════════════════════════════════════════════════════════
//  SOUNDCHECK — bioma di test per i livelli audio (v3.18)
//  8 colonne verticali colorate, una per canale MIDI.
//  Ogni nota riempie una barra dal basso, altezza proporzionale a vel.
//  Fuori dalla suite: non ha phaseColors, decay medio, nessun fancy.
// ══════════════════════════════════════════════════════════════
const SOUNDCHECK = (() => {
  const COL_W = 12;           // 96/8 = 12 celle per colonna
  function bar(fields, role, col, vel127, h) {
    const xStart = col * COL_W;
    const xEnd = Math.min(h.CELLS_X, xStart + COL_W);
    const velN = Math.max(0.1, vel127 / 127);
    // Altezza con gamma + pavimento: barre sempre alte almeno 70% dello schermo,
    // differenza di velocity visibile alla punta (sqrt enfatizza parte bassa vel).
    const heightFactor = Math.max(0.70, Math.sqrt(velN));
    const barH = Math.max(16, Math.floor(heightFactor * h.CELLS_Y));
    const yTop = h.CELLS_Y - barH;
    for (let y = yTop; y < h.CELLS_Y; y++) {
      const intensity = 0.4 + ((y - yTop) / barH) * 0.5;
      for (let x = xStart; x < xEnd; x++) {
        h.depositPoint(fields[role], x, y, intensity);
      }
    }
    if (yTop >= 0 && yTop < h.CELLS_Y) {
      for (let x = xStart + 1; x < xEnd - 1; x++) {
        h.depositPoint(fields[role], x, yTop, 0.95);
      }
    }
  }
  return {
    bg: [0, 0, 0],
    colors: {
      kick:       [255, 255, 255],
      percussion: [170, 170, 170],
      drone:      [ 70, 110, 220],
      bass:       [230, 190,  40],
      chord:      [ 80, 210, 120],
      voice:      [230, 150,  80],
      lead:       [ 80, 210, 230],
      arp:        [225,  90, 190],
    },
    decay: {
      kick: 0.93, percussion: 0.93, drone: 0.985,
      bass: 0.95, chord: 0.965,  voice: 0.975,
      lead: 0.97, arp: 0.95,
    },
    force: {
      kick: 1, percussion: 1, drone: 1,
      bass: 1, chord: 1, voice: 1,
      lead: 1, arp: 1,
    },
    cellPx: { kick: 10, percussion: 10, drone: 10, bass: 10, chord: 10, voice: 10, lead: 10, arp: 10 },
    depositFn: {
      kick(f, p, n, v, h)       { bar(f, 'kick',       0, v, h); },
      percussion(f, p, n, v, h) { bar(f, 'percussion', 1, v, h); },
      drone(f, p, n, v, h)      { bar(f, 'drone',      2, v, h); },
      bass(f, p, n, v, h)       { bar(f, 'bass',       3, v, h); },
      chord(f, p, n, v, h)      { bar(f, 'chord',      4, v, h); },
      voice(f, p, n, v, h)      { bar(f, 'voice',      5, v, h); },
      lead(f, p, n, v, h)       { bar(f, 'lead',       6, v, h); },
      arp(f, p, n, v, h)        { bar(f, 'arp',        7, v, h); },
    },
    // Audio reactive: pulsa la base di ogni colonna quando arriva audio dal
    // BlackHole. Se le barre pulsano, audio entra nel browser correttamente.
    // Se NON pulsano mentre suona: audio routing non funziona (mic permission
    // o BlackHole non configurato come default input).
    audioReact(fields, energy, h) {
      if (energy < 0.03) return;
      const ROLES_BY_COL = ['kick','percussion','drone','bass','chord','voice','lead','arp'];
      const pulseH = 2 + Math.floor(energy * 8);
      const pulseF = 0.4 + energy * 0.6;
      for (let col = 0; col < 8; col++) {
        const role = ROLES_BY_COL[col];
        const xMid = col * 12 + 5;
        for (let dy = 0; dy < pulseH; dy++) {
          const y = h.CELLS_Y - 1 - dy;
          for (let dx = 0; dx < 3; dx++) {
            h.depositPoint(fields[role], xMid + dx, y, pulseF);
          }
        }
      }
    },
  };
})();

export const BIOMI = {
  GENERIC,
  NEBBIA,
  TESSUTO,
  SOLCO,
  RESPIRO,
  MACCHINA,
  TEMPESTA,
  RITORNO,
  ENCORE,
  SOUNDCHECK,
};

// V3.9: palette unificata — PALETTE_B/A rimossa, colori consolidati inline

export function getBiome(trackName) {
  return BIOMI[trackName] || GENERIC;
}
