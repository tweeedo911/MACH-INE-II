// MACH:INE III — open hat SynthDef (Wave C)
// Decay più lungo del closed hat. Usato in TEMPESTA step 6, 14 (offbeat dance).
// Tonalità leggermente più calda (BPF più basso del closed).

SynthDef(\openhat, { |out = 0,
    freq = 8000,  // ignored
    amp = 0.4,
    dur = 0.3,
    decay = 0.25,
    bpFreq = 8000|

    var noise, sig, env;

    noise = WhiteNoise.ar;
    sig = HPF.ar(noise, 6500);
    sig = BPF.ar(sig, bpFreq.clip(2000, 12000), 0.4);
    env = EnvGen.kr(Env.perc(0.001, decay, 1, -4), doneAction: 2);
    sig = sig * amp * env * 0.55;
    Out.ar(out, sig ! 2);
}).add;
