// MACH:INE III — biome presets per ruolo
// 7 biomi × 10 ruoli (drone/kick/bass/chord/voice/lead/arp/hat/openhat/snare/conga).
// Pattern: ~biomePresets[\BIOMA][\role] → IdentityDictionary di params.
// Phase morph multipliers (~phaseCurves) si applicano sopra il preset bioma per il drone.

~biomePresets = (
    \NEBBIA: (
        \drone: (
            hz: 130.81,
            mixTri: 0.8, mixSaw: 0, mixPul: 0, mixSin: 0.2,
            detune: 0, detune2: 0,
            cutoff: 250, q: 0, drive: 0,
            reverbMix: 0.5, reverbRoom: 0.85,
            noiseAmp: 0, breathAmp: 0, breathRate: 0.15,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 15, driftRate: 0.001157,
            subAmp: 0.2, shimmerAmp: 0.4, shimmerRate: 0.12,
            filterLfoRate: 0.04, filterLfoAmount: 0.15
        ),
        \kick:    ( amp: 0 ),
        \bass:    ( amp: 0 ),
        \chord:   ( mixTri: 0.7, mixSaw: 0.3, cutoff: 2000, attack: 0.5,  release: 1.5 ),
        \voice:   ( vibratoRate: 4,   vibratoDepth: 0.005, breathAmp: 0.15, formant: 0.3,
                    attack: 0.3,  release: 1.0 ),
        \lead:    ( drive: 0.05, cutoff: 1500, attack: 0.05, decay: 0.25, sustain: 0.4, release: 0.6 ),
        \arp:     ( amp: 0 ),
        \hat:     ( amp: 0 ),
        \openhat: ( amp: 0 ),
        \snare:   ( amp: 0 ),
        \conga:   ( amp: 0 )
    ),
    \TESSUTO: (
        \drone: (
            hz: 146.83,
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
        \kick:    ( click: 0.3, decay: 0.4, sweepFactor: 3 ),
        \bass:    ( cutoff: 800, drive: 0, mixSub: 0.4, mixPulse: 0.6, decay: 0.6 ),
        \chord:   ( mixTri: 0.2, mixSaw: 0.8, cutoff: 1500, attack: 0.01, release: 0.4 ),
        \voice:   ( amp: 0 ),  // TESSUTO: voice tace (lead prende il posto)
        \lead:    ( drive: 0.1, cutoff: 1800, attack: 0.01, decay: 0.20, sustain: 0.5, release: 0.4 ),
        \arp:     ( amp: 0 ),
        \hat:     ( decay: 0.05, bpFreq: 9000 ),
        \openhat: ( decay: 0.25, bpFreq: 8000 ),
        \snare:   ( decay: 0.15 ),
        \conga:   ( amp: 0 )
    ),
    \SOLCO: (
        \drone: (
            hz: 195.998,
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
        \kick:    ( click: 0.4, decay: 0.7, sweepFactor: 4 ),
        \bass:    ( cutoff: 400, drive: 0.3, mixSub: 0.7, mixPulse: 0.3, decay: 0.55 ),
        \chord:   ( mixTri: 0.5, mixSaw: 0.5, cutoff: 1200, attack: 0.05, release: 0.8 ),
        \voice:   ( vibratoRate: 5, vibratoDepth: 0.01, breathAmp: 0.05, formant: 0.4,
                    attack: 0.05, release: 0.4 ),
        \lead:    ( amp: 0 ),  // SOLCO: lead 'none' — groove parla da solo
        \arp:     ( mixTri: 0.4, mixSaw: 0.6, cutoff: 1500, attack: 0.005, release: 0.10 ),
        \hat:     ( decay: 0.07, bpFreq: 9500 ),
        \openhat: ( decay: 0.25, bpFreq: 8000 ),
        \snare:   ( amp: 0 ),  // SOLCO dub: no snare tradizionale
        \conga:   ( amp: 0 )
    ),
    \RESPIRO: (
        \drone: (
            hz: 261.63,
            mixTri: 0, mixSaw: 0, mixPul: 0, mixSin: 1.0,
            detune: 0.3, detune2: 0,
            cutoff: 8000, q: 0, drive: 0,
            reverbMix: 0.3, reverbRoom: 0.7,
            noiseAmp: 0, breathAmp: 0.06, breathRate: 0.08,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 22.5, driftRate: 0.000694,
            subAmp: 0, shimmerAmp: 0.5, shimmerRate: 0.10,
            filterLfoRate: 0.03, filterLfoAmount: 0.30
        ),
        \kick:    ( amp: 0 ),
        \bass:    ( cutoff: 1500, drive: 0, mixSub: 0.2, mixPulse: 0.8, decay: 0.5 ),
        \chord:   ( mixTri: 0.8, mixSaw: 0.2, cutoff: 3000, attack: 0.3, release: 1.5 ),
        \voice:   ( vibratoRate: 4.5, vibratoDepth: 0.008, breathAmp: 0.1, formant: 0.5,
                    attack: 0.2, release: 0.8 ),
        \lead:    ( drive: 0,    cutoff: 2000, attack: 0.05, decay: 0.30, sustain: 0.4, release: 0.7 ),
        \arp:     ( amp: 0 ),
        \hat:     ( amp: 0 ),
        \openhat: ( amp: 0 ),
        \snare:   ( amp: 0 ),
        \conga:   ( amp: 0 )
    ),
    \MACCHINA: (
        \drone: (
            hz: 146.83,
            mixTri: 0, mixSaw: 0, mixPul: 1.0, mixSin: 0,
            detune: 0, detune2: 0,
            cutoff: 800, q: 0.8, drive: 0,
            reverbMix: 0, reverbRoom: 0,
            noiseAmp: 0.3, breathAmp: 0, breathRate: 0.15, noiseBPFreq: 800,
            pulseWidth: 0.45, pwmRate: 0.3, pwmDepth: 0.2,
            driftAmp: 7.5, driftRate: 0.005438,
            subAmp: 0.4, shimmerAmp: 0, shimmerRate: 0.18,
            filterLfoRate: 0.10, filterLfoAmount: 0
        ),
        \kick:    ( click: 0.6, decay: 0.3, sweepFactor: 5 ),
        \bass:    ( cutoff: 1200, drive: 0.4, mixSub: 0.4, mixPulse: 0.6, decay: 0.4 ),
        \chord:   ( mixTri: 0.3, mixSaw: 0.7, cutoff: 1800, attack: 0.005, release: 0.3 ),
        \voice:   ( vibratoRate: 6, vibratoDepth: 0.005, breathAmp: 0.02, formant: 0.4,
                    attack: 0.005, release: 0.2 ),
        \lead:    ( drive: 0.3, cutoff: 2200, attack: 0.005, decay: 0.10, sustain: 0.6, release: 0.2 ),
        \arp:     ( mixTri: 0.2, mixSaw: 0.8, cutoff: 2000, attack: 0.005, release: 0.08 ),
        \hat:     ( decay: 0.04, bpFreq: 10000 ),  // tight 16th
        \openhat: ( amp: 0 ),  // MACCHINA: no open hat
        \snare:   ( decay: 0.18 ),
        \conga:   ( amp: 0 )
    ),
    \TEMPESTA: (
        \drone: (
            hz: 164.81,
            mixTri: 0, mixSaw: 1.0, mixPul: 0, mixSin: 0,
            detune: 5, detune2: 12,
            cutoff: 1200, q: 0.4, drive: 0.6,
            reverbMix: 0.3, reverbRoom: 0.5,
            noiseAmp: 0, breathAmp: 0, breathRate: 0.15,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 20.5, driftRate: 0.003625,
            subAmp: 0.6, shimmerAmp: 0.3, shimmerRate: 0.35,
            filterLfoRate: 0.18, filterLfoAmount: 0.25
        ),
        \kick:    ( click: 0.4, decay: 0.5, sweepFactor: 3 ),
        \bass:    ( cutoff: 1500, drive: 0.7, mixSub: 0.5, mixPulse: 0.5, decay: 0.5 ),
        \chord:   ( mixTri: 0, mixSaw: 1.0, cutoff: 2500, attack: 0.005, release: 0.25 ),
        \voice:   ( vibratoRate: 6, vibratoDepth: 0.015, breathAmp: 0.05, formant: 0.6,
                    attack: 0.02, release: 0.3 ),
        \lead:    ( drive: 0.6, cutoff: 2500, attack: 0.005, decay: 0.10, sustain: 0.7, release: 0.15 ),
        \arp:     ( mixTri: 0.5, mixSaw: 0.5, cutoff: 1800, attack: 0.005, release: 0.15 ),
        \hat:     ( decay: 0.06, bpFreq: 9000 ),  // 8th
        \openhat: ( decay: 0.30, bpFreq: 8500 ),  // dance step 6, 14
        \snare:   ( decay: 0.20 ),
        \conga:   ( decay: 0.12, sweepFactor: 1.6 )
    ),
    \RITORNO: (
        \drone: (
            hz: 220.0,
            mixTri: 0.15, mixSaw: 0.5, mixPul: 0, mixSin: 0.35,
            detune: 3, detune2: 0,
            cutoff: 400, q: 0.1, drive: 0.15,
            reverbMix: 0.55, reverbRoom: 0.85,
            noiseAmp: 0, breathAmp: 0, breathRate: 0.15,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 15, driftRate: 0.000806,
            subAmp: 0.3, shimmerAmp: 0.5, shimmerRate: 0.08,
            filterLfoRate: 0.04, filterLfoAmount: 0.20
        ),
        \kick:    ( click: 0.2, decay: 0.4, sweepFactor: 3 ),
        \bass:    ( cutoff: 600, drive: 0.1, mixSub: 0.5, mixPulse: 0.5, decay: 0.5 ),
        \chord:   ( mixTri: 0.6, mixSaw: 0.4, cutoff: 1000, attack: 0.2, release: 1.2 ),
        \voice:   ( vibratoRate: 4, vibratoDepth: 0.012, breathAmp: 0.12, formant: 0.4,
                    attack: 0.1, release: 0.7 ),
        \lead:    ( drive: 0.05, cutoff: 1200, attack: 0.1, decay: 0.30, sustain: 0.4, release: 0.8 ),
        \arp:     ( mixTri: 0.6, mixSaw: 0.4, cutoff: 1000, attack: 0.01, release: 0.20 ),
        \hat:     ( decay: 0.05, bpFreq: 9000 ),
        \openhat: ( decay: 0.20, bpFreq: 7500 ),
        \snare:   ( decay: 0.15 ),
        \conga:   ( amp: 0 )
    ),
);

// ── Phase curves per drone ──
~phaseCurves = (
    \germoglio:    ( amp: 0.30, cutoffScale: 0.50, driftScale: 0.30, reverbAdd: 0.0  ),
    \pulsazione:   ( amp: 0.60, cutoffScale: 0.75, driftScale: 0.70, reverbAdd: 0.0  ),
    \densita:      ( amp: 1.00, cutoffScale: 1.00, driftScale: 1.00, reverbAdd: 0.0  ),
    \rottura:      ( amp: 1.00, cutoffScale: 1.10, driftScale: 1.40, reverbAdd: 0.0  ),
    \dissoluzione: ( amp: 0.15, cutoffScale: 0.30, driftScale: 0.40, reverbAdd: 0.25 ),
);

"[machine-engine] biome presets loaded: 7 biomi × 10 ruoli (Wave A+B+C complete)".postln;
