// MACH:INE III — biome presets per ruolo
// Tabella centrale: 7 biomi × N ruoli. Ogni ruolo ha i suoi parametri timbrici.
// Pattern: ~biomePresets[\BIOMA][\role] → IdentityDictionary di params per il SynthDef.
// Wave A (sessione 32): solo \drone popolato. Wave B/C aggiungono bass/kick/chord/voice/lead/arp/perc.
// Phase morph multipliers (~phaseCurves) si applicano sopra il preset bioma.

// ── Biome → drone parameters ──
// Porto i 7 timbri di machine-drone (lib/biomes.lua) — già calibrati per i biomi MACH.
~biomePresets = (
    \NEBBIA: (
        \drone: (
            hz: 130.81,  // C3 (root 48)
            mixTri: 0.8, mixSaw: 0, mixPul: 0, mixSin: 0.2,
            detune: 0, detune2: 0,
            cutoff: 250, q: 0, drive: 0,
            reverbMix: 0.3, reverbRoom: 0.7,
            noiseAmp: 0, breathAmp: 0, breathRate: 0.15,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 15, driftRate: 0.001157  // 1/(24×16/0.4) ≈ period 24 bar @ 60 BPM fallback
        )
    ),
    \TESSUTO: (
        \drone: (
            hz: 146.83,  // D3 (root 50)
            mixTri: 0.2, mixSaw: 0.8, mixPul: 0, mixSin: 0,
            detune: 3, detune2: 0,
            cutoff: 400, q: 0.1, drive: 0.2,
            reverbMix: 0.4, reverbRoom: 0.6,
            noiseAmp: 0, breathAmp: 0, breathRate: 0.15,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 17.5, driftRate: 0.000908   // period 32 bar @ 86 BPM
        )
    ),
    \SOLCO: (
        \drone: (
            hz: 195.998,  // G3 (root 55)
            mixTri: 0.5, mixSaw: 0.4, mixPul: 0, mixSin: 0.1,
            detune: 4, detune2: 0,
            cutoff: 600, q: 0.15, drive: 0.5,
            reverbMix: 0.5, reverbRoom: 0.7,
            noiseAmp: 0, breathAmp: 0, breathRate: 0.15,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 17.5, driftRate: 0.001359   // period 32 bar @ 129 BPM
        )
    ),
    \RESPIRO: (
        \drone: (
            hz: 261.63,  // C4 (root 60)
            mixTri: 0, mixSaw: 0, mixPul: 0, mixSin: 1.0,
            detune: 0.3, detune2: 0,  // Hz, sub-Hz beating (respiro)
            cutoff: 8000, q: 0, drive: 0,
            reverbMix: 0.2, reverbRoom: 0.5,
            noiseAmp: 0, breathAmp: 0.06, breathRate: 0.08,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 22.5, driftRate: 0.000694   // period 40 bar @ 60 BPM fallback
        )
    ),
    \MACCHINA: (
        \drone: (
            hz: 146.83,  // D3 (root 50)
            mixTri: 0, mixSaw: 0, mixPul: 1.0, mixSin: 0,
            detune: 0, detune2: 0,
            cutoff: 800, q: 0.8, drive: 0,
            reverbMix: 0, reverbRoom: 0,
            noiseAmp: 0.3, breathAmp: 0, breathRate: 0.15, noiseBPFreq: 800,
            pulseWidth: 0.45, pwmRate: 0.3, pwmDepth: 0.2,
            driftAmp: 7.5, driftRate: 0.005438   // period 8 bar @ 129 BPM
        )
    ),
    \TEMPESTA: (
        \drone: (
            hz: 164.81,  // E3 (root 52)
            mixTri: 0, mixSaw: 1.0, mixPul: 0, mixSin: 0,
            detune: 5, detune2: 12,  // saw triple
            cutoff: 1200, q: 0.4, drive: 0.6,
            reverbMix: 0.3, reverbRoom: 0.5,
            noiseAmp: 0, breathAmp: 0, breathRate: 0.15,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 20.5, driftRate: 0.003625   // period 12 bar @ 129 BPM
        )
    ),
    \RITORNO: (
        \drone: (
            hz: 220.0,  // A3 (root 57)
            mixTri: 0.15, mixSaw: 0.5, mixPul: 0, mixSin: 0.35,
            detune: 3, detune2: 0,
            cutoff: 400, q: 0.1, drive: 0.15,
            reverbMix: 0.55, reverbRoom: 0.85,
            noiseAmp: 0, breathAmp: 0, breathRate: 0.15,
            pulseWidth: 0.5, pwmRate: 0, pwmDepth: 0,
            driftAmp: 15, driftRate: 0.000806   // period 36 bar @ 86 BPM
        )
    ),
);

// ── Phase curves: multipliers applicati sopra il preset bioma ──
// Stesso pattern di machine-drone biomes.lua phase_curves.
~phaseCurves = (
    \germoglio:    ( amp: 0.30, cutoffScale: 0.50, driftScale: 0.30, reverbAdd: 0.0  ),
    \pulsazione:   ( amp: 0.60, cutoffScale: 0.75, driftScale: 0.70, reverbAdd: 0.0  ),
    \densita:      ( amp: 1.00, cutoffScale: 1.00, driftScale: 1.00, reverbAdd: 0.0  ),
    \rottura:      ( amp: 1.00, cutoffScale: 1.10, driftScale: 1.40, reverbAdd: 0.0  ),
    \dissoluzione: ( amp: 0.15, cutoffScale: 0.30, driftScale: 0.40, reverbAdd: 0.25 ),
);

"[machine-engine] biome presets loaded: 7 biomi × 1 ruolo (drone)".postln;
