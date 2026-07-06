// MACH:INE III — score di test per render-audio.scd
// Copre tutti gli 11 SynthDef + 2 biomi (SOLCO, TEMPESTA) + phase changes + master.
// Scopo: validare che la pipeline produca audio reale dai synth veri. NON musicale.
// Formato evento:
//   [t, \biome, \NOME]
//   [t, \phase, \nome, prog]
//   [t, \note, \ruolo, freqHz, amp, durSec]

~sampleRate = 48000;
~tail       = 4.0;
~duration   = 18.0;

~score = [
    [0.0,  \biome, \SOLCO],
    [0.0,  \phase, \densita, 1.0],
    // — SOLCO: ruoli udibili (kick/bass/chord/voice/arp/hat/openhat) —
    [0.5,  \note, \kick,    50.00, 0.85, 0.6],
    [1.0,  \note, \bass,    41.20, 0.70, 0.5],
    [1.5,  \note, \chord,  196.00, 0.40, 1.2],
    [1.5,  \note, \chord,  233.08, 0.40, 1.2],
    [1.5,  \note, \chord,  293.66, 0.40, 1.2],
    [2.5,  \note, \voice,  392.00, 0.50, 0.8],
    [3.0,  \note, \arp,    587.33, 0.40, 0.12],
    [3.2,  \note, \arp,    698.46, 0.40, 0.12],
    [3.4,  \note, \arp,    784.00, 0.40, 0.12],
    [3.0,  \note, \hat,   9000.00, 0.30, 0.06],
    [3.5,  \note, \hat,   9000.00, 0.30, 0.06],
    [4.0,  \note, \openhat, 8000.00, 0.35, 0.30],
    [5.0,  \note, \kick,    50.00, 0.85, 0.6],
    [6.0,  \note, \bass,    55.00, 0.60, 0.5],
    [6.5,  \note, \arp,    880.00, 0.40, 0.12],
    // — switch TEMPESTA: tutti i ruoli (kick/bass/snare/conga/chord/voice/lead/hat/openhat) —
    [8.0,  \biome, \TEMPESTA],
    [8.0,  \phase, \densita, 1.0],
    [9.0,  \note, \kick,    41.20, 0.90, 0.5],
    [9.0,  \note, \bass,    41.20, 0.80, 0.5],
    [9.0,  \note, \chord,  164.81, 0.45, 0.25],
    [9.0,  \note, \chord,  220.00, 0.45, 0.25],
    [9.5,  \note, \snare,  180.00, 0.70, 0.2],
    [10.0, \note, \conga,  146.83, 0.60, 0.2],
    [10.0, \note, \hat,   9000.00, 0.30, 0.06],
    [10.5, \note, \conga,  110.00, 0.60, 0.2],
    [10.5, \note, \openhat, 8500.00, 0.40, 0.30],
    [11.0, \note, \voice,  440.00, 0.60, 0.5],
    [11.5, \note, \lead,   659.25, 0.60, 0.3],
    [12.0, \note, \lead,   783.99, 0.60, 0.3],
    [13.0, \note, \kick,    41.20, 0.90, 0.5],
    [13.5, \phase, \dissoluzione, 0.5],
    [14.0, \note, \voice,  329.63, 0.50, 0.9],
];
