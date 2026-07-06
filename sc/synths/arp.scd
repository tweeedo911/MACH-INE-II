// MACH:INE III — arp SynthDef (Wave C)
// Tri + Saw → RLPF → perc envelope. Attack stretto, release modulabile.
// MACCHINA protagonist denso: mixSaw alto, cutoff aperto, release breve.
// SOLCO accompany: bilanciato.
// RITORNO dying: cutoff chiuso, release più lungo (residuo).

SynthDef(\arp, { |out = 0,
    freq = 440,
    amp = 0.35,
    dur = 0.12,
    mixTri = 0.4,
    mixSaw = 0.6,
    cutoff = 2000,
    q = 0.15,
    attack = 0.005,
    release = 0.10,
    pan = 0, revSend = 0, revBus = 0|

    var tri, saw, sig, sparkle, env, pos;

    tri = LFTri.ar(freq) * mixTri;
    saw = Saw.ar(freq) * mixSaw;
    sig = tri + saw;
    sig = RLPF.ar(sig, cutoff.clip(100, 12000), (1 - q).clip(0.1, 1));

    env = EnvGen.kr(
        Env.perc(attack, dur.max(0.05) + release, 1, -3),
        doneAction: 2
    );
    // shimmer: 2ª armonica con transiente brevissimo = scintillio in alto, mai pesante
    sparkle = SinOsc.ar(freq * 2) * EnvGen.kr(Env.perc(0.001, (dur.max(0.05) * 0.6), 1, -6)) * 0.10;
    sig = (sig + sparkle) * amp * env;
    pos = Pan2.ar(sig, pan, 1.41421356);  // 1.414 → at pan=0 each ch = sig (identico a sig!2, backward-compat)
    Out.ar(out, pos);
    Out.ar(revBus, pos * revSend);        // wet send (stereo); revSend=0 default → silenzio, nessun effetto
}).add;
