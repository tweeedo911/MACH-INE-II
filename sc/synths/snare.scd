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
    snap = 0.7,
    pan = 0, revSend = 0, revBus = 0|

    var bodyOsc, bodyEnv, noiseSrc, noiseLo, noiseHi, noiseEnv, snapEnv, sig, killEnv, pos;

    // corpo tonale: due sinusoidi (fondamentale + armonica) con leggero pitch drop = "thwack"
    bodyEnv = EnvGen.kr(Env.perc(0.001, 0.09, 1, -4));
    bodyOsc = (SinOsc.ar(EnvGen.kr(Env([260, 180], [0.03], -4)))
        + (SinOsc.ar(330) * 0.4)) * bodyEnv * body;

    noiseSrc = WhiteNoise.ar;
    // due bande di rumore: bassa (corpo del rullante) + alta (snap/aria)
    noiseLo = BPF.ar(noiseSrc, 2200, 0.6) * 0.7;
    noiseHi = HPF.ar(noiseSrc, 5500) * 0.6;
    noiseEnv = EnvGen.kr(Env.perc(0.001, decay, 1, -3));
    snapEnv  = EnvGen.kr(Env.perc(0.0005, (decay * 0.5).max(0.03), 1, -6));  // snap più rapido
    noiseLo = noiseLo * noiseEnv;
    noiseHi = noiseHi * snapEnv;

    sig = (bodyOsc + ((noiseLo + noiseHi) * snap)).tanh;

    // Outer killEnv per liberare il synth dopo il decay (no clic finale)
    killEnv = EnvGen.kr(Env([1, 1, 0], [decay + 0.02, 0.005]), doneAction: 2);
    sig = sig * amp * killEnv;
    pos = Pan2.ar(sig, pan, 1.41421356);  // 1.414 → at pan=0 each ch = sig (identico a sig!2, backward-compat)
    Out.ar(out, pos);
    Out.ar(revBus, pos * revSend);        // wet send (stereo); revSend=0 default → silenzio, nessun effetto
}).add;
