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
    release = 0.4,
    pan = 0, revSend = 0, revBus = 0|

    var vib, modFreq, source, f1, f2, f3, voiceOsc, breathSig, airSig, sig, env, pos;

    vib = SinOsc.kr(vibratoRate, [0, 0.3]).range(1 - vibratoDepth, 1 + vibratoDepth);
    modFreq = freq * vib[0];

    // Sorgente armonicamente ricca: tri + pulse detune + un filo di saw per le formanti alte
    source = (LFTri.ar(modFreq) * 0.5)
        + (Pulse.ar(modFreq * 1.005, 0.4) * 0.28)
        + (Saw.ar(modFreq * 0.5) * 0.12);  // sub-armonica per corpo/calore

    // 3 bande formant (vocale): bassa (corpo), media (vocale), alta (presenza)
    f1 = BPF.ar(source, (freq * (1.0 + (formant * 0.3))).clip(180, 1200), 0.5) * 1.0;
    f2 = BPF.ar(source, (freq * (1.5 + formant)).clip(300, 4000), 0.55) * 0.85;
    f3 = BPF.ar(source, (freq * (2.6 + (formant * 1.2))).clip(600, 7000), 0.7) * 0.45;
    voiceOsc = (f1 + f2 + f3) * 0.7;
    voiceOsc = voiceOsc + (LFTri.ar(modFreq) * 0.12);  // un velo di fondamentale diretta = warmth

    // Breath noise sulla banda vocale (gating col vibrato per organicità)
    breathSig = BPF.ar(WhiteNoise.ar, (freq * 3).clip(500, 8000), 0.4) * breathAmp;
    // Air: noise alto leggerissimo = soffio/respiro
    airSig = HPF.ar(WhiteNoise.ar, 6000) * breathAmp * 0.35;

    sig = voiceOsc + breathSig + airSig;

    env = EnvGen.kr(
        Env([0, 1, 1, 0], [attack, dur.max(0.05), release], [\sin, \lin, \sin]),
        doneAction: 2
    );
    sig = sig * amp * env;
    pos = Pan2.ar(sig, pan, 1.41421356);  // 1.414 → at pan=0 each ch = sig (identico a sig!2, backward-compat)
    Out.ar(out, pos);
    Out.ar(revBus, pos * revSend);        // wet send (stereo); revSend=0 default → silenzio, nessun effetto
}).add;
