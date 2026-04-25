// MACH:INE III — hat closed SynthDef (Wave C)
// HPF noise + BPF metallic. Decay corto.
// freq ignorato (hat è noise). dur usato come outer killEnv.
// MACCHINA tight: decay 0.04. SOLCO/TESSUTO naturale: 0.05-0.07.

SynthDef(\hat, { |out = 0,
    freq = 9000,  // ignored, kept for OSC consistency
    amp = 0.4,
    dur = 0.06,
    decay = 0.05,
    bpFreq = 9000|

    var noise, sig, env;

    noise = WhiteNoise.ar;
    sig = HPF.ar(noise, 7000);
    sig = BPF.ar(sig, bpFreq.clip(2000, 14000), 0.5);
    env = EnvGen.kr(Env.perc(0.0005, decay, 1, -8), doneAction: 2);
    sig = sig * amp * env * 0.6;
    Out.ar(out, sig ! 2);
}).add;
