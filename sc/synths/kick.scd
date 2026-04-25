// MACH:INE III — kick SynthDef (Wave B)
// Body: SinOsc con pitch sweep esponenziale (freq×sweepFactor → freq) + click HPF noise.
// Per traccia: click amount, decay length, sweep factor (più alto = più "tonal" il body).
// SOLCO dub = decay lungo. MACCHINA 909-ish = click forte, decay corto. TEMPESTA 808 = sub massiccio.

SynthDef(\kick, { |out = 0,
    freq = 50,            // freq base (MIDI note → Hz dal browser)
    amp = 0.7,
    dur = 0.4,            // overall decay envelope length
    click = 0.4,          // 0..1 amount of HPF noise click
    decay = 0.5,          // body decay (s)
    sweepFactor = 4,      // freq starts at freq*sweepFactor, sweeps down
    sweepTime = 0.04|     // time for pitch sweep

    var pitchEnv, body, clickSig, env, sig;

    pitchEnv = EnvGen.kr(Env([freq * sweepFactor, freq], [sweepTime], -4));
    body = SinOsc.ar(pitchEnv) * EnvGen.kr(Env.perc(0.001, decay, 1, -4));

    clickSig = HPF.ar(WhiteNoise.ar(click * 0.6), 4000) * EnvGen.kr(Env.perc(0.0001, 0.012, 1, -8));

    sig = body + clickSig;
    sig = sig.tanh;  // soft saturation
    env = EnvGen.kr(Env.perc(0.001, dur, 1, -4), doneAction: 2);
    sig = sig * amp * env;
    Out.ar(out, sig ! 2);
}).add;
