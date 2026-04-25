// MACH:INE III — voice SynthDef (Wave C)
// Voce sintetica con formant filter + vibrato + breath noise.
// NEBBIA fragile/eterea: vibrato lento, breath alto, attack lungo.
// TEMPESTA espressiva: vibrato veloce, attack corto.
// RITORNO esposta vulnerabile: vibrato medio, breath presente.

SynthDef(\voice, { |out = 0,
    freq = 440,
    amp = 0.5,
    dur = 0.6,
    vibratoRate = 5,
    vibratoDepth = 0.01,
    breathAmp = 0.08,
    formant = 0.5,
    attack = 0.05,
    release = 0.4|

    var vib, modFreq, voiceOsc, breathSig, sig, env;

    vib = SinOsc.kr(vibratoRate, [0, 0.3]).range(1 - vibratoDepth, 1 + vibratoDepth);
    modFreq = freq * vib[0];

    // Body: tri + pulse leggermente detune (formant-like)
    voiceOsc = LFTri.ar(modFreq) * 0.55 + Pulse.ar(modFreq * 1.005, 0.4) * 0.3;
    // BPF al 2× freq con formant shift dà colore "vocale"
    voiceOsc = BPF.ar(voiceOsc, (freq * (1.5 + formant)).clip(200, 6000), 0.6);

    // Breath noise filtered alto
    breathSig = BPF.ar(WhiteNoise.ar, (freq * 3).clip(500, 8000), 0.4) * breathAmp;

    sig = voiceOsc + breathSig;

    env = EnvGen.kr(
        Env([0, 1, 1, 0], [attack, dur.max(0.05), release], [\sin, \lin, \sin]),
        doneAction: 2
    );
    sig = sig * amp * env;
    Out.ar(out, sig ! 2);
}).add;
