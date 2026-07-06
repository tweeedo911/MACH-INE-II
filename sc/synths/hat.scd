// MACH:INE III — hat closed SynthDef (Wave C)
// HPF noise + BPF metallic. Decay corto.
// freq ignorato (hat è noise). dur usato come outer killEnv.
// MACCHINA tight: decay 0.04. SOLCO/TESSUTO naturale: 0.05-0.07.

SynthDef(\hat, { |out = 0,
    freq = 9000,  // ignored, kept for OSC consistency
    amp = 0.4,
    dur = 0.06,
    decay = 0.05,
    bpFreq = 9000,
    pan = 0, revSend = 0, revBus = 0|

    var noise, metal, sig, air, env, pos;
    var bf = bpFreq.clip(2000, 14000);

    noise = WhiteNoise.ar;
    // contenuto metallico: somma di square detuneate non-armoniche (clangore tipo cymbal)
    metal = Mix.ar([
        Pulse.ar(bf * 1.0,  0.5),
        Pulse.ar(bf * 1.34, 0.5),
        Pulse.ar(bf * 1.81, 0.5)
    ]) * 0.10;
    metal = HPF.ar(metal, 6000);
    // corpo principale: noise multibanda invece di singola BPF (più naturale)
    sig = HPF.ar(noise, 7000);
    sig = (BPF.ar(sig, bf, 0.5) * 0.8) + (BPF.ar(sig, (bf * 1.5).clip(2000, 16000), 0.4) * 0.5);
    air = HPF.ar(noise, 11000) * 0.25;  // aria sopra
    sig = sig + metal + air;
    env = EnvGen.kr(Env.perc(0.0005, decay, 1, -8), doneAction: 2);
    sig = sig * amp * env * 0.5;
    pos = Pan2.ar(sig, pan, 1.41421356);  // 1.414 → at pan=0 each ch = sig (identico a sig!2, backward-compat)
    Out.ar(out, pos);
    Out.ar(revBus, pos * revSend);        // wet send (stereo); revSend=0 default → silenzio, nessun effetto
}).add;
