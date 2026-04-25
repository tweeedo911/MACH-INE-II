// MACH:INE III — lead SynthDef (Wave C)
// Saw + Pulse → RLPF → drive (tanh saturation) → ADSR.
// TEMPESTA distorto: drive 0.6, cutoff aperto.
// MACCHINA response breve: drive 0.3, decay corto.
// RESPIRO eco pulito: drive 0, cutoff alto.

SynthDef(\lead, { |out = 0,
    freq = 440,
    amp = 0.4,
    dur = 0.3,
    drive = 0.2,
    cutoff = 2000,
    q = 0.2,
    attack = 0.01,
    decay = 0.15,
    sustain = 0.6,
    release = 0.25|

    var saw, pul, sig, env;

    saw = Saw.ar(freq) * 0.55;
    pul = Pulse.ar(freq * 1.003, 0.45) * 0.3;
    sig = saw + pul;
    sig = RLPF.ar(sig, cutoff.clip(100, 12000), (1 - q).clip(0.1, 1));
    sig = (sig * (1 + drive * 4)).tanh * (1 / (1 + drive * 1.5));

    env = EnvGen.kr(
        Env([0, 1, sustain, sustain, 0],
            [attack, decay, dur.max(0.05), release],
            [\sin, \exp, \lin, \exp]),
        doneAction: 2
    );
    sig = sig * amp * env;
    Out.ar(out, sig ! 2);
}).add;
