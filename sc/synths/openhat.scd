// MACH:INE III — open hat SynthDef (Wave C)
// Decay più lungo del closed hat. Usato in TEMPESTA step 6, 14 (offbeat dance).
// Tonalità leggermente più calda (BPF più basso del closed).

SynthDef(\openhat, { |out = 0,
    freq = 8000,  // ignored
    amp = 0.4,
    dur = 0.3,
    decay = 0.25,
    bpFreq = 8000,
    pan = 0, revSend = 0, revBus = 0|

    var noise, metal, sig, air, env, pos;
    var bf = bpFreq.clip(2000, 12000);

    noise = WhiteNoise.ar;
    // clangore metallico (square inarmoniche), più caldo del closed
    metal = Mix.ar([
        Pulse.ar(bf * 1.0,  0.5),
        Pulse.ar(bf * 1.41, 0.5),
        Pulse.ar(bf * 1.67, 0.5)
    ]) * 0.10;
    metal = HPF.ar(metal, 5000);
    sig = HPF.ar(noise, 6500);
    sig = (BPF.ar(sig, bf, 0.4) * 0.85) + (BPF.ar(sig, (bf * 1.6).clip(2000, 14000), 0.35) * 0.45);
    air = HPF.ar(noise, 10000) * 0.22;
    sig = sig + metal + air;
    env = EnvGen.kr(Env.perc(0.001, decay, 1, -4), doneAction: 2);
    sig = sig * amp * env * 0.46;
    pos = Pan2.ar(sig, pan, 1.41421356);  // 1.414 → at pan=0 each ch = sig (identico a sig!2, backward-compat)
    Out.ar(out, pos);
    Out.ar(revBus, pos * revSend);        // wet send (stereo); revSend=0 default → silenzio, nessun effetto
}).add;
