// MACH:INE III — biome presets per ruolo
// Tabella centrale: 7 biomi × N ruoli. Ogni ruolo ha i suoi parametri timbrici.
// Pattern: ~biomePresets[\BIOMA][\role] → IdentityDictionary di params per il SynthDef.
// v3.20-rc1: solo \drone. v3.20-rc2: + \kick, \bass, \chord (Wave B).
// Phase morph multipliers (~phaseCurves) si applicano sopra il preset bioma per il drone.

~biomePresets = (
    \NEBBIA: (
        \drone: (
            hz: 130.81,  // C3
            mixTri: 0.8, mixSaw: 0, mixPul: 0, mixSin: 0.2,
            detune: 0, detune2: 0,
            cutoff: 250, q: 0, drive: 0,
            reverbMix: 0.5, reverbRoom: 0.85,  // più aperto
            noiseAmp: 0, breathAmp: 0, breathRate: 0.15,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 15, driftRate: 0.001157,
            // enrichment
            subAmp: 0.2, shimmerAmp: 0.4, shimmerRate: 0.12,
            filterLfoRate: 0.04, filterLfoAmount: 0.15
        ),
        \kick: ( amp: 0 ),  // NEBBIA: no kick
        \bass: ( amp: 0 ),
        \chord: (
            mixTri: 0.7, mixSaw: 0.3, cutoff: 2000, attack: 0.5, release: 1.5
        )
    ),
    \TESSUTO: (
        \drone: (
            hz: 146.83,  // D3
            mixTri: 0.2, mixSaw: 0.8, mixPul: 0, mixSin: 0,
            detune: 3, detune2: 0,
            cutoff: 400, q: 0.1, drive: 0.2,
            reverbMix: 0.4, reverbRoom: 0.6,
            noiseAmp: 0, breathAmp: 0, breathRate: 0.15,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 17.5, driftRate: 0.000908,
            subAmp: 0.3, shimmerAmp: 0, shimmerRate: 0.18,
            filterLfoRate: 0.06, filterLfoAmount: 0.20
        ),
        \kick: ( click: 0.3, decay: 0.4, sweepFactor: 3 ),
        \bass: ( cutoff: 800, drive: 0, mixSub: 0.4, mixPulse: 0.6, decay: 0.6 ),
        \chord: (
            mixTri: 0.2, mixSaw: 0.8, cutoff: 1500, attack: 0.01, release: 0.4
        )
    ),
    \SOLCO: (
        \drone: (
            hz: 195.998,  // G3
            mixTri: 0.5, mixSaw: 0.4, mixPul: 0, mixSin: 0.1,
            detune: 4, detune2: 0,
            cutoff: 600, q: 0.15, drive: 0.5,
            reverbMix: 0.5, reverbRoom: 0.7,
            noiseAmp: 0, breathAmp: 0, breathRate: 0.15,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 17.5, driftRate: 0.001359,
            subAmp: 0.5, shimmerAmp: 0, shimmerRate: 0.18,
            filterLfoRate: 0.07, filterLfoAmount: 0.10
        ),
        \kick: ( click: 0.4, decay: 0.7, sweepFactor: 4 ),  // dub: lungo, profondo
        \bass: ( cutoff: 400, drive: 0.3, mixSub: 0.7, mixPulse: 0.3, decay: 0.55 ),
        \chord: (
            mixTri: 0.5, mixSaw: 0.5, cutoff: 1200, attack: 0.05, release: 0.8
        )
    ),
    \RESPIRO: (
        \drone: (
            hz: 261.63,  // C4
            mixTri: 0, mixSaw: 0, mixPul: 0, mixSin: 1.0,
            detune: 0.3, detune2: 0,
            cutoff: 8000, q: 0, drive: 0,
            reverbMix: 0.3, reverbRoom: 0.7,
            noiseAmp: 0, breathAmp: 0.06, breathRate: 0.08,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 22.5, driftRate: 0.000694,
            subAmp: 0, shimmerAmp: 0.5, shimmerRate: 0.10,
            filterLfoRate: 0.03, filterLfoAmount: 0.30  // apertura lenta
        ),
        \kick: ( amp: 0 ),
        \bass: ( cutoff: 1500, drive: 0, mixSub: 0.2, mixPulse: 0.8, decay: 0.5 ),
        \chord: (
            mixTri: 0.8, mixSaw: 0.2, cutoff: 3000, attack: 0.3, release: 1.5
        )
    ),
    \MACCHINA: (
        \drone: (
            hz: 146.83,  // D3
            mixTri: 0, mixSaw: 0, mixPul: 1.0, mixSin: 0,
            detune: 0, detune2: 0,
            cutoff: 800, q: 0.8, drive: 0,
            reverbMix: 0, reverbRoom: 0,
            noiseAmp: 0.3, breathAmp: 0, breathRate: 0.15, noiseBPFreq: 800,
            pulseWidth: 0.45, pwmRate: 0.3, pwmDepth: 0.2,
            driftAmp: 7.5, driftRate: 0.005438,
            subAmp: 0.4, shimmerAmp: 0, shimmerRate: 0.18,
            filterLfoRate: 0.10, filterLfoAmount: 0  // rigido, no LFO
        ),
        \kick: ( click: 0.6, decay: 0.3, sweepFactor: 5 ),  // 909-ish
        \bass: ( cutoff: 1200, drive: 0.4, mixSub: 0.4, mixPulse: 0.6, decay: 0.4 ),
        \chord: (
            mixTri: 0.3, mixSaw: 0.7, cutoff: 1800, attack: 0.005, release: 0.3
        )
    ),
    \TEMPESTA: (
        \drone: (
            hz: 164.81,  // E3
            mixTri: 0, mixSaw: 1.0, mixPul: 0, mixSin: 0,
            detune: 5, detune2: 12,
            cutoff: 1200, q: 0.4, drive: 0.6,
            reverbMix: 0.3, reverbRoom: 0.5,
            noiseAmp: 0, breathAmp: 0, breathRate: 0.15,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 20.5, driftRate: 0.003625,
            subAmp: 0.6, shimmerAmp: 0.3, shimmerRate: 0.35,  // drammatico, intenso
            filterLfoRate: 0.18, filterLfoAmount: 0.25
        ),
        \kick: ( click: 0.4, decay: 0.5, sweepFactor: 3 ),  // 808 sub
        \bass: ( cutoff: 1500, drive: 0.7, mixSub: 0.5, mixPulse: 0.5, decay: 0.5 ),  // reese distorto
        \chord: (
            mixTri: 0, mixSaw: 1.0, cutoff: 2500, attack: 0.005, release: 0.25
        )
    ),
    \RITORNO: (
        \drone: (
            hz: 220.0,  // A3
            mixTri: 0.15, mixSaw: 0.5, mixPul: 0, mixSin: 0.35,
            detune: 3, detune2: 0,
            cutoff: 400, q: 0.1, drive: 0.15,
            reverbMix: 0.55, reverbRoom: 0.85,
            noiseAmp: 0, breathAmp: 0, breathRate: 0.15,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 15, driftRate: 0.000806,
            subAmp: 0.3, shimmerAmp: 0.5, shimmerRate: 0.08,  // lavanda con luci alte
            filterLfoRate: 0.04, filterLfoAmount: 0.20
        ),
        \kick: ( click: 0.2, decay: 0.4, sweepFactor: 3 ),  // soft, sparso
        \bass: ( cutoff: 600, drive: 0.1, mixSub: 0.5, mixPulse: 0.5, decay: 0.5 ),
        \chord: (
            mixTri: 0.6, mixSaw: 0.4, cutoff: 1000, attack: 0.2, release: 1.2
        )
    ),
);

// ── Phase curves per drone (multipliers applicati sopra il preset bioma) ──
~phaseCurves = (
    \germoglio:    ( amp: 0.30, cutoffScale: 0.50, driftScale: 0.30, reverbAdd: 0.0  ),
    \pulsazione:   ( amp: 0.60, cutoffScale: 0.75, driftScale: 0.70, reverbAdd: 0.0  ),
    \densita:      ( amp: 1.00, cutoffScale: 1.00, driftScale: 1.00, reverbAdd: 0.0  ),
    \rottura:      ( amp: 1.00, cutoffScale: 1.10, driftScale: 1.40, reverbAdd: 0.0  ),
    \dissoluzione: ( amp: 0.15, cutoffScale: 0.30, driftScale: 0.40, reverbAdd: 0.25 ),
);

"[machine-engine] biome presets loaded: 7 biomi × 4 ruoli (drone/kick/bass/chord)".postln;
