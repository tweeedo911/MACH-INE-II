// MACH:INE III — conga SynthDef (Wave C)
// Body SinOsc con pitch sweep esponenziale + tanh saturation.
// freq usato (la nota MIDI determina pitch — nota 48 ≈ 130Hz default, 45 ≈ 110Hz).
// TEMPESTA usa conga sincopato (step 3, 11, 13 nel pattern).

SynthDef(\conga, { |out = 0,
    freq = 130,
    amp = 0.45,
    dur = 0.2,
    decay = 0.15,
    sweepFactor = 1.6,
    sweepTime = 0.025|

    var pitchEnv, body, env, killEnv, sig;

    pitchEnv = EnvGen.kr(Env([freq * sweepFactor, freq], [sweepTime], -4));
    body = SinOsc.ar(pitchEnv);
    env = EnvGen.kr(Env.perc(0.001, decay, 1, -4));
    body = (body * env).tanh;

    killEnv = EnvGen.kr(Env([1, 1, 0], [decay + 0.02, 0.005]), doneAction: 2);
    sig = body * amp * killEnv;
    Out.ar(out, sig ! 2);
}).add;
