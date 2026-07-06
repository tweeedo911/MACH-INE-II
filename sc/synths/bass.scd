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
    q = 0.2,
    pan = 0, revSend = 0, revBus = 0|

    var pulse, pulse2, sub, sig, env, fEnv, cf, pos;

    // layer pulse: due Pulse leggermente detuneate per spessore + larghezza armonica
    pulse = Pulse.ar(freq, 0.4);
    pulse2 = Pulse.ar(freq * 1.005, 0.55) * 0.5;
    pulse = (pulse + pulse2) * mixPulse;
    // sub: ottava sotto + un filo di fondamentale per corpo solido
    sub = (SinOsc.ar(freq * 0.5) + (SinOsc.ar(freq) * 0.25)) * mixSub;
    sig = pulse + sub;

    // movimento di filtro nella nota: cutoff parte un po' più aperto e si chiude (vita interna)
    fEnv = EnvGen.kr(Env([1.6, 1.0], [(dur.max(0.05) * 0.5).clip(0.05, 0.6)], -3));
    cf = (cutoff * fEnv).clip(40, 9000);
    sig = RLPF.ar(sig, cf, (1 - q).clip(0.1, 1));
    // waveshaping: drive principale + leggera asimmetria armonica (corpo)
    sig = (sig * (1 + drive * 4)).tanh * (1 / (1 + drive * 1.5));
    sig = (sig + (sig.squared * 0.08)).tanh;  // 2ª armonica gentile, soft-clip di sicurezza

    env = EnvGen.kr(Env.perc(0.005, decay, 1, -2.5), timeScale: dur.max(0.05) / 0.5, doneAction: 2);
    sig = sig * amp * env * 0.92;
    pos = Pan2.ar(sig, pan, 1.41421356);  // 1.414 → at pan=0 each ch = sig (identico a sig!2, backward-compat)
    Out.ar(out, pos);
    Out.ar(revBus, pos * revSend);        // wet send (stereo); revSend=0 default → silenzio, nessun effetto
}).add;
