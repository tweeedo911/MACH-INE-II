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
    release = 0.10|

    var tri, saw, sig, env;

    tri = LFTri.ar(freq) * mixTri;
    saw = Saw.ar(freq) * mixSaw;
    sig = tri + saw;
    sig = RLPF.ar(sig, cutoff.clip(100, 12000), (1 - q).clip(0.1, 1));

    env = EnvGen.kr(
        Env.perc(attack, dur.max(0.05) + release, 1, -3),
        doneAction: 2
    );
    sig = sig * amp * env;
    Out.ar(out, sig ! 2);
}).add;
