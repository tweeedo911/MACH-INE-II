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
    sweepTime = 0.04,     // time for pitch sweep
    pan = 0, revSend = 0, revBus = 0|

    var pitchEnv, body, sub, subEnv, clickSig, bodyAmpEnv, env, sig, pos;

    pitchEnv = EnvGen.kr(Env([freq * sweepFactor, freq], [sweepTime], -4));
    bodyAmpEnv = EnvGen.kr(Env.perc(0.001, decay, 1, -4));
    // body con leggera 2ª armonica per presenza su piccoli speaker
    body = (SinOsc.ar(pitchEnv) + (SinOsc.ar(pitchEnv * 2) * 0.12)) * bodyAmpEnv;

    // sub tail: sinusoide pura a freq, decay leggermente più lungo del body → peso che resta sotto il transiente
    subEnv = EnvGen.kr(Env.perc(0.004, decay * 1.35, 1, -4.5));
    sub = SinOsc.ar(freq) * subEnv * 0.6;

    // click più stretto e definito (HPF più alto, decay più corto)
    clickSig = HPF.ar(WhiteNoise.ar(click * 0.6), 5000) * EnvGen.kr(Env.perc(0.0001, 0.009, 1, -9));

    sig = (body + sub) * (1 + (click * 0.4));  // un filo di drive in più quando c'è click (MACCHINA punch)
    sig = (sig * 1.3).tanh;  // soft harmonic saturation per presenza
    sig = sig + clickSig;
    env = EnvGen.kr(Env.perc(0.001, dur, 1, -4), doneAction: 2);
    sig = sig * amp * env * 0.82;
    pos = Pan2.ar(sig, pan, 1.41421356);  // 1.414 → at pan=0 each ch = sig (identico a sig!2, backward-compat)
    Out.ar(out, pos);
    Out.ar(revBus, pos * revSend);        // wet send (stereo); revSend=0 default → silenzio, nessun effetto
}).add;
