// MACH:INE III — chord SynthDef (Wave B)
// Tri + Saw a coppie detuneate → RLPF → ASR envelope con attack/release per traccia.
// Una nota MIDI dell'accordo = un Synth(\chord). Più note insieme = stack di voci sostenute.
// NEBBIA: pad arioso (mixTri alto, attack lungo, release lungo).
// TESSUTO: stab staccato (mixSaw alto, attack quasi 0, release breve).
// MACCHINA/TEMPESTA: stab brillante.
// RITORNO: pad soft con cadenza.

SynthDef(\chord, { |out = 0,
    freq = 261.63,
    amp = 0.4,
    dur = 1.0,
    mixTri = 0.5,
    mixSaw = 0.5,
    cutoff = 2000,
    q = 0.1,
    attack = 0.05,
    release = 0.6,
    detuneCents = 7|

    var triA, triB, sawA, sawB, sig, env;
    var dRatio = 2.pow(detuneCents / 1200);

    triA = LFTri.ar(freq * dRatio);
    triB = LFTri.ar(freq / dRatio);
    sawA = Saw.ar(freq * dRatio);
    sawB = Saw.ar(freq / dRatio);

    sig = ((triA + triB) * 0.5 * mixTri) + ((sawA + sawB) * 0.5 * mixSaw);
    sig = RLPF.ar(sig, cutoff.clip(100, 12000), (1 - q).clip(0.1, 1));

    // ASR: attack → sustain (durante dur) → release
    env = EnvGen.kr(
        Env([0, 1, 1, 0], [attack, dur.max(0.05), release], [\sin, \lin, \sin]),
        doneAction: 2
    );
    sig = sig * amp * env;
    Out.ar(out, sig ! 2);
}).add;
