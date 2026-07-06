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
    detuneCents = 7,
    pan = 0, revSend = 0, revBus = 0|

    var triA, triB, sawA, sawB, sawC, sig, env, chorus, cMod, pos;
    var dRatio = 2.pow(detuneCents / 1200);
    var dRatio2 = 2.pow((detuneCents * 1.9) / 1200);

    // unison detune leggermente randomizzato per nota (chorus naturale, mai identico)
    chorus = LFNoise2.kr([0.08, 0.11, 0.13].scramble) * 0.004 + 1;

    triA = LFTri.ar(freq * dRatio * chorus[0]);
    triB = LFTri.ar(freq / dRatio * chorus[1]);
    sawA = Saw.ar(freq * dRatio * chorus[2]);
    sawB = Saw.ar(freq / dRatio);
    sawC = Saw.ar(freq * dRatio2 * chorus[0]) * 0.45;  // 3ª voce saw per ampiezza unison

    sig = ((triA + triB) * 0.5 * mixTri) + ((sawA + sawB + sawC) * 0.4 * mixSaw);
    // movimento di filtro lento e ampio = pad che respira/evolve
    cMod = SinOsc.kr(0.06).range(0.80, 1.12);  // mono mod, lento (no wobble fastidioso)
    sig = RLPF.ar(sig, (cutoff * cMod).clip(100, 13000), (1 - q).clip(0.1, 1));

    // ASR: attack → sustain (durante dur) → release
    env = EnvGen.kr(
        Env([0, 1, 1, 0], [attack, dur.max(0.05), release], [\sin, \lin, \sin]),
        doneAction: 2
    );
    sig = sig * amp * env;
    pos = Pan2.ar(sig, pan, 1.41421356);  // 1.414 → at pan=0 each ch = sig (identico a sig!2, backward-compat)
    Out.ar(out, pos);
    Out.ar(revBus, pos * revSend);        // wet send (stereo); revSend=0 default → silenzio, nessun effetto
}).add;
