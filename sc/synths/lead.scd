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
    release = 0.25,
    pan = 0, revSend = 0, revBus = 0|

    var saw, saw2, pul, sub, sig, env, vib, pos;

    // micro-vibrato per sustain "cantante" (lentissimo, profondità minima)
    vib = SinOsc.kr(5.2, 0.7).range(0.9985, 1.0015);

    // due saw detuneate + pulse + un filo di ottava sotto = corpo e armonici ricchi
    saw  = Saw.ar(freq * vib) * 0.5;
    saw2 = Saw.ar(freq * 1.006 * vib) * 0.32;
    pul  = Pulse.ar(freq * 1.003, 0.45) * 0.26;
    sub  = LFTri.ar(freq * 0.5) * 0.18;
    sig = saw + saw2 + pul + sub;
    sig = RLPF.ar(sig, cutoff.clip(100, 12000), (1 - q).clip(0.1, 1));
    // drive principale + edge armonico (un filo di 2ª armonica per presenza)
    sig = (sig * (1 + drive * 4)).tanh * (1 / (1 + drive * 1.5));
    sig = sig + ((sig * sig) * drive * 0.15);  // edge proporzionale al drive
    sig = sig.tanh;
    sig = sig * 0.92;

    env = EnvGen.kr(
        Env([0, 1, sustain, sustain, 0],
            [attack, decay, dur.max(0.05), release],
            [\sin, \exp, \lin, \exp]),
        doneAction: 2
    );
    sig = sig * amp * env;
    pos = Pan2.ar(sig, pan, 1.41421356);  // 1.414 → at pan=0 each ch = sig (identico a sig!2, backward-compat)
    Out.ar(out, pos);
    Out.ar(revBus, pos * revSend);        // wet send (stereo); revSend=0 default → silenzio, nessun effetto
}).add;
