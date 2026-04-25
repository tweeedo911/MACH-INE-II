// MACH:INE III — bass SynthDef (Wave B)
// Pulse + sub Sin → RLPF + tanh saturation. Per traccia: cutoff, drive, mix sub/pulse, decay.
// SOLCO dub: sub forte, cutoff chiuso, drive moderato → "sub-bass dub".
// MACCHINA: pump pulse, drive medio, decay corto → "pump aggressivo".
// TEMPESTA reese: sub massiccio, drive forte, cutoff aperto → "reese distorto".
// RESPIRO/RITORNO: cutoff alto, drive minimo → "bass arioso, soft".

SynthDef(\bass, { |out = 0,
    freq = 55,
    amp = 0.5,
    dur = 0.4,
    cutoff = 800,
    drive = 0,
    mixSub = 0.5,
    mixPulse = 0.5,
    decay = 0.5,
    q = 0.2|

    var pulse, sub, sig, env;

    pulse = Pulse.ar(freq, 0.4) * mixPulse;
    sub = SinOsc.ar(freq * 0.5) * mixSub;
    sig = pulse + sub;
    sig = RLPF.ar(sig, cutoff.clip(40, 8000), (1 - q).clip(0.1, 1));
    sig = (sig * (1 + drive * 4)).tanh * (1 / (1 + drive * 1.5));

    env = EnvGen.kr(Env.perc(0.005, decay, 1, -2.5), timeScale: dur.max(0.05) / 0.5, doneAction: 2);
    sig = sig * amp * env;
    Out.ar(out, sig ! 2);
}).add;
