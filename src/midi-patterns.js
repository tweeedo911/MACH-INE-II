// ═══════════════════════════════════════════════════════════
//  MACH:INE II — MIDI Visual Mapping Patterns
//  v2.8.0: 8 canali canonici (CH0=PULSE CH1=GRAIN CH2=DRONE CH3=BASS
//        CH4=CHORDS CH5=VOICE CH6=LEAD CH7=RUPTURE)
// ═══════════════════════════════════════════════════════════

import { audio } from './audio.js';
import { CFG } from './config.js';

// ── Per-role behavior options ──
// Principio di separazione spaziale: ogni canale abita una zona verticale propria.
// CH0 PULSE  → zona bassa  [0.55–0.95]: impatto, flash grande e brevissimo
// CH1 GRAIN  → campo pieno [0.00–1.00]: microparticelle, granulare
// CH2 DRONE  → centro ampio[0.15–0.85]: campo diffuso permanente, radice armonica
// CH3 BASS   → zona bassa  [0.50–1.00]: colonne pesanti, fondante
// CH4 CHORDS → zona media  [0.10–0.72]: bande orizzontali, spazio armonico
// CH5 VOICE  → zona alta   [0.00–0.50]: trail melodico, legge la linea
// CH6 LEAD   → zona alta   [0.00–0.42]: accento breve, spicca sulla voce

// CH0 PULSE: impatto ritmico, zona bassa, grande e brevissimo
const PULSE_BEHAVIORS = [
  { zone: [0.58, 0.95], xMode: 'spread', shape: 'pulse', size: 0.24, decay: 0.74, color: 0 },
  { zone: [0.55, 0.92], xMode: 'spread', shape: 'pulse', size: 0.20, decay: 0.72, color: 0 },
  { zone: [0.52, 0.88], xMode: 'center', shape: 'pulse', size: 0.28, decay: 0.70, color: 0 },
];

// CH1 GRAIN: microparticelle scatter, campo pieno, decay rapido — sfondo granulare
const GRAIN_BEHAVIORS = [
  { zone: [0.00, 1.00], xMode: 'random', shape: 'scatter', size: 0.022, decay: 0.89, color: 4 },
  { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'scatter', size: 0.028, decay: 0.87, color: 4 },
];

// CH2 DRONE: campo diffuso ampio, quasi permanente — radice armonica di sfondo
const DRONE_BEHAVIORS = [
  { zone: [0.15, 0.85], xMode: 'center', shape: 'scatter', size: 0.18, decay: 0.9999, color: null },
  { zone: [0.20, 0.80], xMode: 'random', shape: 'scatter', size: 0.14, decay: 0.9999, color: null },
];

// CH3 BASS: colonne verticali pesanti, zona bassa — fondante, grave
const BASS_BEHAVIORS = [
  { zone: [0.55, 1.00], xMode: 'center', shape: 'column', size: 0.20, decay: 0.996, color: 1 },
  { zone: [0.58, 1.00], xMode: 'pitch',  shape: 'column', size: 0.24, decay: 0.994, color: 1 },
  { zone: [0.50, 0.95], xMode: 'center', shape: 'column', size: 0.18, decay: 0.997, color: 1 },
];

// CH4 CHORDS: bande orizzontali ampie, zona media — spazio armonico aperto
const CHORDS_BEHAVIORS = [
  { zone: [0.12, 0.70], xMode: 'pitch',  shape: 'band', size: 0.20, decay: 0.982, color: 2 },
  { zone: [0.10, 0.72], xMode: 'stereo', shape: 'band', size: 0.24, decay: 0.978, color: 2 },
  { zone: [0.15, 0.68], xMode: 'pitch',  shape: 'band', size: 0.18, decay: 0.980, color: 2 },
];

// CH5 VOICE: trail melodico, zona alta — pitch→Y legge la linea vocale
const VOICE_BEHAVIORS = [
  { zone: [0.00, 0.48], xMode: 'pitch', shape: 'trail', size: 0.07, decay: 0.986, color: 3 },
  { zone: [0.02, 0.50], xMode: 'pitch', shape: 'trail', size: 0.06, decay: 0.984, color: 3 },
  { zone: [0.00, 0.44], xMode: 'pitch', shape: 'trail', size: 0.08, decay: 0.988, color: 3 },
];

// CH6 LEAD: accento breve, zona alta stretta — spicca sulla voce
const LEAD_BEHAVIORS = [
  { zone: [0.04, 0.40], xMode: 'pitch', shape: 'pulse', size: 0.08, decay: 0.952, color: 2 },
  { zone: [0.06, 0.42], xMode: 'pitch', shape: 'trail', size: 0.06, decay: 0.962, color: 2 },
];

// CH7 RUPTURE: frammenti caotici magenta
const RUPTURE_BEHAVIORS = [
  { zone: [0.00, 1.00], xMode: 'random', shape: 'rupture', size: 0.18, decay: 0.88, color: 'C' },
  { zone: [0.10, 0.90], xMode: 'spread', shape: 'rupture', size: 0.22, decay: 0.85, color: 'C' },
];

const ALL_BEHAVIORS = [
  PULSE_BEHAVIORS,   // CH0
  GRAIN_BEHAVIORS,   // CH1
  DRONE_BEHAVIORS,   // CH2
  BASS_BEHAVIORS,    // CH3
  CHORDS_BEHAVIORS,  // CH4
  VOICE_BEHAVIORS,   // CH5
  LEAD_BEHAVIORS,    // CH6
  RUPTURE_BEHAVIORS, // CH7
];

// ── Engine-specific behaviors (fixed visual identity per engine) ──
// When an engine is active, its channels use a canonical behavior
// instead of the random pool. Channels not listed fall back to the pool.
const ENGINE_BEHAVIORS = {
  // ─────────────────────────────────────────────────────────────────
  // TERRENO — D Dorian · 72 BPM · Dub profondo, tempo geologico
  // "masse orizzontali e colonne verticali lente. Campo caldo e denso."
  // Referenze: Tarkovsky (lentezza acquatica), James Turrell (luce come materia)
  // CH0: `band` centro — il kick dub è massa, non flash. Residuo orizzontale persistente.
  // ─────────────────────────────────────────────────────────────────
  terreno: {
    0: { zone: [0.38, 0.72], xMode: 'center', shape: 'band',    size: 0.24, decay: 0.94,   color: 0 },   // kick: banda orizzontale lenta — massa dub centrale
    1: { zone: [0.00, 1.00], xMode: 'random', shape: 'scatter', size: 0.06, decay: 0.97,   color: null }, // grain: polvere lenta, campo pieno
    2: { zone: [0.15, 0.85], xMode: 'center', shape: 'scatter', size: 0.18, decay: 0.9999, color: null }, // drone: campo armonico stazionario
    3: { zone: [0.52, 1.00], xMode: 'center', shape: 'column',  size: 0.20, decay: 0.998,  color: 1 },   // bass: colonna bassa continua (pattern reggae/dub)
    4: { zone: [0.14, 0.70], xMode: 'pitch',  shape: 'band',    size: 0.18, decay: 0.990,  color: 2 },   // chords: bande calde medie
    5: { zone: [0.00, 0.48], xMode: 'pitch',  shape: 'trail',   size: 0.09, decay: 0.990,  color: 3 },   // voice: trail lungo, nota lenta
    6: { zone: [0.02, 0.40], xMode: 'pitch',  shape: 'trail',   size: 0.07, decay: 0.988,  color: 3 },   // lead: eco sopra la voce
  },
  // ─────────────────────────────────────────────────────────────────
  // MECCANICA — C# Dorian · 98 BPM · Jazz-organico, geometria precisa
  // "Entità in burst sincronizzati. Scompaiono rapidamente."
  // Referenze: Ryoji Ikeda (test pattern — griglia), Bauhaus (forma segue funzione)
  // Dot size piccolo (3–5px). Palette fredda, high contrast.
  // ─────────────────────────────────────────────────────────────────
  meccanica: {
    0: { zone: [0.55, 0.90], xMode: 'spread', shape: 'pulse',   size: 0.16, decay: 0.80,  color: 0 },   // kick: preciso, spread 3 punti fissi
    1: { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'scatter', size: 0.022,decay: 0.86,  color: 4 },   // grain: punti pitch-mapped, layer poliritm.
    3: { zone: [0.58, 1.00], xMode: 'center', shape: 'column',  size: 0.18, decay: 0.992, color: 1 },   // bass: colonna meccanica bassa
    4: { zone: [0.15, 0.66], xMode: 'stereo', shape: 'band',    size: 0.14, decay: 0.975, color: 2 },   // chords: stab geometrico stereo
    5: { zone: [0.00, 0.44], xMode: 'pitch',  shape: 'trail',   size: 0.07, decay: 0.978, color: 3 },   // voice: linea precisa alta
    6: { zone: [0.04, 0.38], xMode: 'pitch',  shape: 'pulse',   size: 0.07, decay: 0.945, color: 3 },   // lead: accento breve pitch-driven
  },
  // ─────────────────────────────────────────────────────────────────
  // DERIVA — A Lydian · no BPM · Spettrale, brightness-driven
  // "Nebbia, dissolvenza, assenza di confini. Il frame è aria."
  // Referenze: Ólafur Elíasson (Weather Project), Hiroshi Sugimoto (lunghe esposizioni)
  // Tutto piccolo e lentissimo. No kick. Trail domina. Partitura visiva.
  // ─────────────────────────────────────────────────────────────────
  deriva: {
    1: { zone: [0.00, 1.00], xMode: 'random', shape: 'scatter', size: 0.028, decay: 0.965,  color: null }, // grain: nebbia sottile, campo pieno
    2: { zone: [0.15, 0.85], xMode: 'center', shape: 'scatter', size: 0.10,  decay: 0.9999, color: null }, // drone: velatura armonica latente
    4: { zone: [0.12, 0.70], xMode: 'pitch',  shape: 'band',    size: 0.09,  decay: 0.993,  color: 2 },   // chords: bande sottili, lentissime, scrittura
    5: { zone: [0.00, 0.46], xMode: 'pitch',  shape: 'trail',   size: 0.06,  decay: 0.992,  color: 3 },   // voice: goccia melodica, trigger brightness
    6: { zone: [0.00, 0.38], xMode: 'pitch',  shape: 'trail',   size: 0.05,  decay: 0.988,  color: 3 },   // lead: eco sfumata alta
  },
  // ─────────────────────────────────────────────────────────────────
  // VORTICE — F Phrygian · 138 BPM · Esplosivo, stroboscopico, Ikeda
  // "Bianco/nero/rosso. Violento, preciso, ritmo come assalto."
  // Referenze: Ryoji Ikeda (datamatics), Autechre visual (glitch sistematico)
  // Decay brevissimo. Dot size minimo. Separazione totale high/low.
  // ─────────────────────────────────────────────────────────────────
  vortice: {
    0: { zone: [0.55, 0.96], xMode: 'spread', shape: 'column',  size: 0.28, decay: 0.65, color: 0 },   // kick: colonne basse esplosive, 3 punti, flash
    1: { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'band',    size: 0.014,decay: 0.83, color: 4 },   // grain: linee orizzontali ultra-sottili pitch
    3: { zone: [0.62, 1.00], xMode: 'center', shape: 'column',  size: 0.26, decay: 0.80, color: 1 },   // bass: colonne abissali dure, flash
    4: { zone: [0.08, 0.64], xMode: 'stereo', shape: 'band',    size: 0.12, decay: 0.965,color: 2 },   // chords: bande taglienti
    5: { zone: [0.00, 0.20], xMode: 'pitch',  shape: 'band',    size: 0.05, decay: 0.92, color: 3 },   // voice: linea sottile in cima
    7: { zone: [0.00, 1.00], xMode: 'spread', shape: 'rupture', size: 0.28, decay: 0.74, color: 'C' }, // rupture: campo pieno magenta
  },
  // ─────────────────────────────────────────────────────────────────
  // CRISTALLO — Eb Lydian · 54 BPM · Ghiaccio, luce, fragilità
  // "Pochi punti grandi → cristalli di luce. Shimmer come persistenza retinica."
  // Referenze: Floating Points Promises, Olafur Arnalds (luce nordica)
  // Palette ice (sfondo quasi bianco). Tutto null color — elementi scuri su chiaro.
  // ─────────────────────────────────────────────────────────────────
  cristallo: {
    0: { zone: [0.58, 0.88], xMode: 'center', shape: 'pulse',   size: 0.06, decay: 0.96,   color: null }, // kick: appena percettibile, quasi invisibile
    1: { zone: [0.00, 1.00], xMode: 'random', shape: 'scatter', size: 0.014,decay: 0.995,  color: null }, // grain: scintille micro, molto lente
    2: { zone: [0.08, 0.92], xMode: 'center', shape: 'scatter', size: 0.26, decay: 0.9999, color: null }, // drone: campo cristallino enorme
    3: { zone: [0.64, 1.00], xMode: 'center', shape: 'column',  size: 0.07, decay: 0.999,  color: null }, // bass: sub invisibile, solo presenza
    4: { zone: [0.06, 0.74], xMode: 'pitch',  shape: 'band',    size: 0.20, decay: 0.996,  color: 2 },   // chords: pad ampi, glassati
    5: { zone: [0.00, 0.50], xMode: 'pitch',  shape: 'trail',   size: 0.05, decay: 0.997,  color: 3 },   // voice: shimmer trail lunghissimo
  },
  // ─────────────────────────────────────────────────────────────────
  // ABISSO — Bb Phrygian · 76 BPM · Nero profondo, tutto scende
  // "Il peso è il contenuto. La camera scende. Il frame si riempie gradualmente."
  // Referenze: Sunn O))) (oscurità come materia), Anish Kapoor (Vantablack)
  // Zone spinte verso il basso. Colori = bagliori nell'oscurità.
  // ─────────────────────────────────────────────────────────────────
  abisso: {
    0: { zone: [0.70, 0.96], xMode: 'center', shape: 'pulse',   size: 0.16, decay: 0.92,   color: 0 },   // heartbeat profondo, lento, fondo
    1: { zone: [0.48, 1.00], xMode: 'random', shape: 'scatter', size: 0.030,decay: 0.97,   color: null }, // sedimento che precipita — bassa metà
    2: { zone: [0.28, 1.00], xMode: 'center', shape: 'scatter', size: 0.24, decay: 0.9999, color: null }, // drone onnipresente e pesante
    3: { zone: [0.66, 1.00], xMode: 'center', shape: 'column',  size: 0.28, decay: 0.998,  color: 1 },   // bass: colonne abissali massicce
    4: { zone: [0.34, 0.78], xMode: 'center', shape: 'band',    size: 0.24, decay: 0.9995, color: 2 },   // pads rituali quasi fermi
    5: { zone: [0.00, 0.26], xMode: 'pitch',  shape: 'trail',   size: 0.04, decay: 0.994,  color: 3 },   // voce distante, in cima — bagliore
    6: { zone: [0.04, 0.34], xMode: 'pitch',  shape: 'trail',   size: 0.03, decay: 0.992,  color: 3 },   // eco rarefatta
  },
  // ─────────────────────────────────────────────────────────────────
  // SOLCO — groove 4/4, mantra, caldo · Ipnotico, ripetitivo
  // "La ripetizione crea trance. Il ritmo visivo È il ritmo musicale."
  // Referenze: Steve Reich (fase come tecnica visiva), Bridget Riley (op art)
  // Pattern regolare e prevedibile. Hi-hat come linee sottilissime scanning.
  // ─────────────────────────────────────────────────────────────────
  solco: {
    0: { zone: [0.56, 0.95], xMode: 'spread', shape: 'pulse',   size: 0.20, decay: 0.86,   color: 0 },   // kick 4/4: basso, spread, regolare
    1: { zone: [0.20, 0.44], xMode: 'pitch',  shape: 'band',    size: 0.008,decay: 0.82,   color: 4 },   // hi-hat: linee scanning ultra-sottili in fascia media
    2: { zone: [0.15, 0.85], xMode: 'center', shape: 'scatter', size: 0.16, decay: 0.9999, color: null }, // drone: fondamenta calde permanenti
    3: { zone: [0.54, 1.00], xMode: 'center', shape: 'column',  size: 0.20, decay: 0.996,  color: 1 },   // bass: rolling columns
    4: { zone: [0.14, 0.66], xMode: 'stereo', shape: 'band',    size: 0.12, decay: 0.984,  color: 2 },   // chords: stab caldi
    5: { zone: [0.00, 0.46], xMode: 'pitch',  shape: 'trail',   size: 0.05, decay: 0.990,  color: 3 },   // voice: frammento ambrato raro
    6: { zone: [0.00, 0.28], xMode: 'pitch',  shape: 'trail',   size: 0.04, decay: 0.985,  color: 3 },   // lead: eco alta
    7: { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'scatter', size: 0.018,decay: 0.93,   color: 4 },   // ride: metallico fine
  },
};

// ── Phase-mode synesthetic behaviors — V3 theatrical system ──────────────────
// Ogni canale MIDI è un attore con un ruolo che evolve nel corso del pezzo.
// Priorità in V3_MODE: PHASE_BEHAVIORS > ENGINE_BEHAVIORS > pool.
//
// Arco di ogni canale attraverso le 5 sezioni:
//   CH0 PULSE   battito:   nascita → rituale → danza → macchina → memoria
//   CH1 GRAIN   atmosfera: polvere → sedimento → polline → dati → cristalli
//   CH2 DRONE   palco:     spazio vuoto → peso → fulcro → griglia → universo
//   CH3 BASS    fondamenta:muto → pilastri → locomotiva → acciaio → eco
//   CH4 CHORDS  colori:    orizzonte → pressione → festa → taglio → shimmer
//   CH5 VOICE   protagonista: primo filo → segnale perso → canto → linea → evaporazione
//   CH6 LEAD    risposta:  eco → sussurro → controcanto → accento → traccia
//   CH7 RUPTURE trickster: scintilla → crepa → caos → glitch → spettro
const PHASE_BEHAVIORS = {

  // ── A_lydian — Apertura: il palcoscenico è vuoto, gli attori emergono ──────
  'A_lydian': {
    0: { zone: [0.42, 0.72], xMode: 'center', shape: 'scatter', size: 0.038, decay: 0.880,  color: null }, // BATTITO nascente — micro-flash, quasi niente
    1: { zone: [0.00, 1.00], xMode: 'random', shape: 'scatter', size: 0.007, decay: 0.974,  color: null }, // ATMOSFERA: punti micro, polvere cosmica
    2: { zone: [0.10, 0.90], xMode: 'center', shape: 'scatter', size: 0.07,  decay: 0.9999, color: null }, // PALCO: campo etereo, non invasivo
    3: { zone: [0.70, 1.00], xMode: 'pitch',  shape: 'column',  size: 0.08,  decay: 0.9985, color: null }, // FONDAMENTA: radice silenziosa
    4: { zone: [0.22, 0.62], xMode: 'pitch',  shape: 'band',    size: 0.08,  decay: 0.9925, color: 2   }, // ORIZZONTE ARMONICO: banda sottile
    5: { zone: [0.04, 0.52], xMode: 'pitch',  shape: 'rect',    size: 0.060, decay: 0.9920, color: 3   }, // PRIMO PERSONAGGIO: quadrato luminoso che emerge
    6: { zone: [0.00, 0.48], xMode: 'pitch',  shape: 'rect',    size: 0.048, decay: 0.9890, color: 2   }, // ECO: quadrato intrecciato, zona sovrapposta
    7: { zone: [0.10, 0.90], xMode: 'random', shape: 'scatter', size: 0.055, decay: 0.930,  color: 'C' }, // SCINTILLA: rara
  },

  // ── Bb_phrygian — Discesa: la gravità diventa protagonista ────────────────
  'Bb_phrygian': {
    0: { zone: [0.72, 0.98], xMode: 'center', shape: 'column',  size: 0.28,  decay: 0.820,  color: 0   }, // RITUALE: colonna-pilastro pesante al fondo
    1: { zone: [0.50, 1.00], xMode: 'random', shape: 'scatter', size: 0.012, decay: 0.950,  color: null }, // SEDIMENTO: punti micro che precipitano
    2: { zone: [0.35, 1.00], xMode: 'center', shape: 'scatter', size: 0.09,  decay: 0.9999, color: null }, // PESO: campo basso
    3: { zone: [0.66, 1.00], xMode: 'center', shape: 'column',  size: 0.18,  decay: 0.9975, color: 1   }, // PILASTRI: colonne abissali
    4: { zone: [0.30, 0.76], xMode: 'center', shape: 'band',    size: 0.14,  decay: 0.9978, color: 2   }, // PRESSIONE: masse oppressive
    5: { zone: [0.00, 0.20], xMode: 'pitch',  shape: 'rect',    size: 0.028, decay: 0.9905, color: 3   }, // SEGNALE PERSO: piccolo quadrato in cima
    6: { zone: [0.00, 0.16], xMode: 'pitch',  shape: 'rect',    size: 0.022, decay: 0.9875, color: 2   }, // SUSSURRO: eco morente
    7: { zone: [0.15, 0.85], xMode: 'spread', shape: 'rupture', size: 0.20,  decay: 0.840,  color: 'C' }, // CREPE: fratture improvvise
  },

  // ── D_dorian — Groove: energia liberata, tutti in scena ──────────────────
  'D_dorian': {
    0: { zone: [0.58, 0.96], xMode: 'spread', shape: 'scatter', size: 0.22,  decay: 0.730,  color: 0   }, // DANZA: esplosione spread — tre punti ritmici
    1: { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'scatter', size: 0.016, decay: 0.885,  color: 4   }, // POLLINE: punti caldi pitch-mapped
    2: { zone: [0.18, 0.82], xMode: 'center', shape: 'scatter', size: 0.08,  decay: 0.9999, color: null }, // FULCRO: centro caldo
    3: { zone: [0.54, 0.98], xMode: 'pitch',  shape: 'column',  size: 0.16,  decay: 0.9935, color: 1   }, // LOCOMOTIVA: colonne che camminano col ritmo
    4: { zone: [0.12, 0.66], xMode: 'stereo', shape: 'band',    size: 0.14,  decay: 0.9780, color: 2   }, // FESTA: bande stereo calde
    5: { zone: [0.04, 0.52], xMode: 'pitch',  shape: 'rect',    size: 0.085, decay: 0.9850, color: 3   }, // IL CANTANTE: quadrato grande e presente
    6: { zone: [0.02, 0.46], xMode: 'pitch',  shape: 'rect',    size: 0.068, decay: 0.9740, color: 2   }, // RISPOSTA: si sovrappone e intreccia con la voce
    7: { zone: [0.18, 0.82], xMode: 'random', shape: 'scatter', size: 0.16,  decay: 0.860,  color: 'C' }, // CAOS FESTIVO
  },

  // ── C#_dorian — Climax tecnico: geometria, macchina ──────────────────────
  'C#_dorian': {
    0: { zone: [0.64, 0.97], xMode: 'spread', shape: 'column',  size: 0.20,  decay: 0.710,  color: 0   }, // MACCHINA: kick→colonna, pilastro non flash
    1: { zone: [0.00, 1.00], xMode: 'pitch',  shape: 'band',    size: 0.008, decay: 0.830,  color: 4   }, // DATI: scanning lines ultra-sottili
    2: { zone: [0.16, 0.84], xMode: 'center', shape: 'scatter', size: 0.07,  decay: 0.9999, color: null }, // GRIGLIA: fondamenta latente
    3: { zone: [0.64, 1.00], xMode: 'center', shape: 'column',  size: 0.14,  decay: 0.9910, color: 1   }, // ACCIAIO: preciso, ripetitivo
    4: { zone: [0.18, 0.64], xMode: 'stereo', shape: 'band',    size: 0.10,  decay: 0.9660, color: 2   }, // TAGLIO: stab geometrico
    5: { zone: [0.06, 0.46], xMode: 'pitch',  shape: 'rect',    size: 0.062, decay: 0.9760, color: 3   }, // LINEA: quadrato preciso, ogni nota è una scelta
    6: { zone: [0.04, 0.40], xMode: 'pitch',  shape: 'rect',    size: 0.058, decay: 0.9460, color: 2   }, // ACCENTO MECCANICO: appare e scompare rapido
    7: { zone: [0.00, 1.00], xMode: 'spread', shape: 'rupture', size: 0.22,  decay: 0.780,  color: 'C' }, // GLITCH sistematico
  },

  // ── E_phrygian — Dissoluzione: gli attori perdono la forma ───────────────
  'E_phrygian': {
    0: { zone: [0.44, 0.70], xMode: 'center', shape: 'scatter', size: 0.030, decay: 0.974,  color: null }, // MEMORIA: micro-flash quasi invisibile
    1: { zone: [0.00, 1.00], xMode: 'random', shape: 'scatter', size: 0.007, decay: 0.9945, color: null }, // CRISTALLI: punti micro lentissimi
    2: { zone: [0.04, 0.96], xMode: 'center', shape: 'scatter', size: 0.08,  decay: 0.9999, color: null }, // UNIVERSO: spazio cristallino
    3: { zone: [0.76, 1.00], xMode: 'center', shape: 'column',  size: 0.055, decay: 0.9992, color: null }, // ECO: sub-presenza
    4: { zone: [0.10, 0.74], xMode: 'pitch',  shape: 'band',    size: 0.16,  decay: 0.9958, color: 2   }, // SHIMMER: banda quasi ferma
    5: { zone: [0.02, 0.52], xMode: 'pitch',  shape: 'rect',    size: 0.055, decay: 0.9970, color: 3   }, // EVAPORAZIONE: quadrato che si dissolve lentamente
    6: { zone: [0.00, 0.38], xMode: 'pitch',  shape: 'rect',    size: 0.042, decay: 0.9958, color: 2   }, // ULTIMA TRACCIA: impronta residua
    7: { zone: [0.08, 0.92], xMode: 'random', shape: 'scatter', size: 0.080, decay: 0.9550, color: 'C' }, // SPETTRO: frammento magenta
  },
};

// ── Current state ──
let currentEngine    = null;          // 'terreno' | 'meccanica' | 'deriva' | 'vortice' | 'cristallo' | 'abisso' | null
let currentPhaseMode = 'A_lydian';    // sezione modale corrente — aggiornata da macro-composer
const channelMapping = [];
const channelChangeBar = [];

function pickBehavior(ch) {
  if (CFG.V3_MODE) {
    // V3: modal section drives visual identity — PHASE first, ENGINE fallback
    if (currentPhaseMode && PHASE_BEHAVIORS[currentPhaseMode]?.[ch] !== undefined) {
      return PHASE_BEHAVIORS[currentPhaseMode][ch];
    }
    if (currentEngine && ENGINE_BEHAVIORS[currentEngine]?.[ch] !== undefined) {
      return ENGINE_BEHAVIORS[currentEngine][ch];
    }
  } else {
    // V2: engine drives visual identity
    if (currentEngine && ENGINE_BEHAVIORS[currentEngine]?.[ch] !== undefined) {
      return ENGINE_BEHAVIORS[currentEngine][ch];
    }
  }
  const pool = ALL_BEHAVIORS[ch];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function initMidiPatterns() {
  for (let i = 0; i < 8; i++) {
    channelMapping[i] = pickBehavior(i);
    channelChangeBar[i] = 8 + Math.floor(Math.random() * 24);
  }
}

export function checkPatternChange(barNum, ch) {
  if (barNum >= channelChangeBar[ch]) {
    const old = channelMapping[ch];
    channelMapping[ch] = pickBehavior(ch);
    channelChangeBar[ch] = barNum + 12 + Math.floor(Math.random() * 20);
    return old !== channelMapping[ch];
  }
  return false;
}

export function setEngine(engineId) {
  currentEngine = engineId;  // 'terreno' | 'meccanica' | 'deriva' | null
  // Re-pick all channels with the new engine context
  for (let i = 0; i < 8; i++) {
    channelMapping[i] = pickBehavior(i);
  }
}

export function getEngine() {
  return currentEngine;
}

export function setPhaseMode(modeKey) {
  if (modeKey === currentPhaseMode) return;
  currentPhaseMode = modeKey;
  // Re-pick all channels — pickBehavior handles V3/V2 priority internally
  for (let i = 0; i < 8; i++) {
    channelMapping[i] = pickBehavior(i);
  }
}

export function mutateChannel(ch) {
  channelMapping[ch] = pickBehavior(ch);
}

export function getChannelMapping(ch) {
  if (ch >= 8) return null;
  return channelMapping[ch];
}

export function getNotePosition(ch, noteNorm, velNorm) {
  if (ch >= 8) return null;
  const role = channelMapping[ch];
  if (!role) return null;

  const zoneH = role.zone[1] - role.zone[0];

  // Pitch normalization: stretch practical MIDI range 24-96 to full canvas [0,1]
  // Without this, melodic notes (36-84) cluster in x [0.33, 0.63] — the "campo" problem
  const pitchN = (role.xMode === 'pitch')
    ? Math.max(0, Math.min(1, (noteNorm * 127 - 24) / 72))
    : noteNorm;

  let y;
  if (role.shape === 'pulse' || role.xMode === 'center') {
    y = role.zone[0] + zoneH * 0.5;
  } else {
    y = role.zone[1] - pitchN * zoneH;
  }

  let x;
  if (role.xMode === 'pitch') {
    x = 0.05 + pitchN * 0.90;
  } else if (role.xMode === 'center') {
    x = 0.5 + (Math.random() - 0.5) * 0.08;
  } else if (role.xMode === 'spread') {
    // Distribuisce i pulse su 3 punti fissi separati per evitare il flash centrale
    const kickPos = [0.25, 0.5, 0.75];
    x = kickPos[Math.floor(Math.random() * kickPos.length)] + (Math.random() - 0.5) * 0.12;
  } else if (role.xMode === 'stereo') {
    x = 0.15 + noteNorm * 0.7;
  } else {
    x = Math.random();
  }

  // Radius audio-linked by channel role
  let radius;
  if (ch === 0) {
    // PULSE: size proporzionale a velocity
    radius = role.size * velNorm;
  } else if (ch === 1) {
    // GRAIN: energia high/air modula la dimensione
    const airEnergy = (audio.bands.air.L + audio.bands.air.R +
                       audio.bands.high.L + audio.bands.high.R) * 0.25;
    radius = role.size * (0.3 + airEnergy * 1.2 + velNorm * 0.3);
  } else if (ch === 2) {
    // DRONE: dimensione costante, modulata da sub
    const subEnergy = (audio.bands.sub.L + audio.bands.sub.R) * 0.5;
    radius = role.size * (0.5 + subEnergy * 0.8 + velNorm * 0.2);
  } else if (ch === 3) {
    // BASS: larghezza = velocity
    radius = role.size * (0.5 + velNorm * 0.5);
  } else if (ch === 4) {
    // CHORDS: altezza base, scalata con noteCount
    radius = role.size * (0.6 + velNorm * 0.4);
  } else if (ch === 7) {
    // RUPTURE: grande, velocity-driven
    radius = role.size * (0.5 + velNorm * 0.8);
  } else {
    radius = role.size * (0.6 + velNorm * 0.4);
  }

  return {
    x, y,
    radius: Math.max(0.01, radius),
    decay: role.decay,
    shape: role.shape,
    color: role.color,
    ch,
  };
}

initMidiPatterns();
