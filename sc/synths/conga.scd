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
    sweepTime = 0.025,
    pan = 0, revSend = 0, revBus = 0|

    var pitchEnv, body, harm, ring, env, killEnv, sig, pos;

    pitchEnv = EnvGen.kr(Env([freq * sweepFactor, freq], [sweepTime], -4));
    // fondamentale + 2ª armonica leggera = tono più caldo e legnoso
    body = SinOsc.ar(pitchEnv) + (SinOsc.ar(pitchEnv * 2.01) * 0.18);
    env = EnvGen.kr(Env.perc(0.001, decay, 1, -4));
    body = body * env;
    // risonanza di corpo: skin transient breve risuonato su una banda attorno al pitch
    ring = Ringz.ar(
        HPF.ar(WhiteNoise.ar, 400) * EnvGen.kr(Env.perc(0.0003, 0.006, 1, -8)),
        (freq * 2.4).clip(120, 1200), 0.08
    ) * 0.18;
    body = (body + ring).tanh;

    killEnv = EnvGen.kr(Env([1, 1, 0], [decay + 0.02, 0.005]), doneAction: 2);
    sig = body * amp * killEnv;
    pos = Pan2.ar(sig, pan, 1.41421356);  // 1.414 → at pan=0 each ch = sig (identico a sig!2, backward-compat)
    Out.ar(out, pos);
    Out.ar(revBus, pos * revSend);        // wet send (stereo); revSend=0 default → silenzio, nessun effetto
}).add;
