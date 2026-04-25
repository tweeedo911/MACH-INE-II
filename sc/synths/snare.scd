// MACH:INE III — snare SynthDef (Wave C)
// Body sin (180Hz) + BPF noise. tanh saturation. KillEnv outer per cleanup.
// freq ignorato. Decay variabile per traccia (TEMPESTA granitico 0.20, MACCHINA snap 0.18).
// SOLCO disabilitato (track.snare.enabled=false → midi.js non manda comunque).

SynthDef(\snare, { |out = 0,
    freq = 180,  // ignored (body fissato)
    amp = 0.5,
    dur = 0.2,
    decay = 0.18,
    body = 0.5,
    snap = 0.7|

    var bodyOsc, bodyEnv, noise, noiseEnv, sig, killEnv;

    bodyOsc = SinOsc.ar(180);
    bodyEnv = EnvGen.kr(Env.perc(0.001, 0.08, 1, -4));
    bodyOsc = bodyOsc * bodyEnv * body;

    noise = BPF.ar(WhiteNoise.ar, 3500, 0.7);
    noiseEnv = EnvGen.kr(Env.perc(0.001, decay, 1, -3));
    noise = noise * noiseEnv * snap;

    sig = (bodyOsc + noise).tanh;

    // Outer killEnv per liberare il synth dopo il decay (no clic finale)
    killEnv = EnvGen.kr(Env([1, 1, 0], [decay + 0.02, 0.005]), doneAction: 2);
    sig = sig * amp * killEnv;
    Out.ar(out, sig ! 2);
}).add;
