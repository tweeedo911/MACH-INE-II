// MACH:INE III — drone SynthDef
// Port standalone di lib/Engine_MachineDrone.sc (machine-drone Norns).
// Stesso modello: 4 oscillatori (tri/saw/pul/sin) + drift LFO + breath/PWM/noise + RLPF + drive + reverb.
// Tutti i controlli morphano via Lag3 con `morphLag` (default 18s) — transizioni fra biomi/fasi
// percepite come "respiro", non come cambio scena.
// Differenza con MachineDrone Norns: niente CroneEngine, niente addCommand. Synth singleton
// pilotato da OSC handler in machine-engine.scd.

SynthDef(\machineDrone, { |out = 0,
    hz = 130.81,
    amp = 0.0,
    mixTri = 1, mixSaw = 0, mixPul = 0, mixSin = 0,
    detune = 0,
    detune2 = 0,
    cutoff = 400,
    q = 0.1,
    drive = 0,
    reverbMix = 0.3,
    reverbRoom = 0.7,
    noiseAmp = 0,
    noiseBPFreq = 130,
    breathAmp = 0,
    breathRate = 0.15,
    pulseWidth = 0.5,
    pwmRate = 0.2,
    pwmDepth = 0,
    driftAmp = 15,
    driftRate = 0.01,
    morphLag = 18,
    controlLag = 0.1,
    cutoffLagTime = 0.1,
    hzLagTime = 0.1,
    // ── v3.20-rc2 enrichment: sub + shimmer + slow filter LFO ──
    subAmp = 0,            // sub-octave SinOsc (-12 semitoni). Dà "peso" sotto al fondamentale.
    shimmerAmp = 0,        // octave-up SinOsc (+12 sem) modulato da LFO ampio. "Luce" alta.
    shimmerRate = 0.18,    // Hz, modula amp shimmer (NEBBIA "scintille", RITORNO "vetro")
    filterLfoRate = 0.05,  // Hz, oscillazione lenta del cutoff
    filterLfoAmount = 0,   // 0..1, ampiezza modulazione cutoff (0 = statico)
    gate = 1|

    var lHz, lAmp, lMixTri, lMixSaw, lMixPul, lMixSin;
    var lDetune, lDetune2, lCutoff, lQ, lDrive;
    var lRevMix, lRevRoom, lNoiseAmp, lNoiseBPF, lBreathAmp;
    var lDriftAmp, lDriftRate;
    var lBreathRate, lPulseWidth, lPwmRate, lPwmDepth;
    var lSubAmp, lShimmerAmp, lShimmerRate, lFilterLfoRate, lFilterLfoAmount;
    var driftLFO, driftRatio, driftedHz;
    var detuneRatio, detuneRatio2, sinDetuneHz;
    var triA, triB, tri;
    var sawA, sawB, sawC, sawCamp, saw;
    var pwmLFO, modWidth;
    var pulA, pulB, pul;
    var sinA, sinB, sin;
    var bpNoise, breathLFO, breath;
    var subSig, shimmerSig, shimmerLfo, filterLfo, modCutoff;
    var env;
    var sig, dry, wet;

    // ── lagged controls ──
    lHz       = Lag3.kr(hz, hzLagTime);
    lAmp      = Lag3.kr(amp, controlLag);
    lMixTri   = Lag3.kr(mixTri, morphLag);
    lMixSaw   = Lag3.kr(mixSaw, morphLag);
    lMixPul   = Lag3.kr(mixPul, morphLag);
    lMixSin   = Lag3.kr(mixSin, morphLag);
    lDetune   = Lag3.kr(detune, morphLag);
    lDetune2  = Lag3.kr(detune2, morphLag);
    lCutoff   = Lag3.kr(cutoff, cutoffLagTime);
    lQ        = Lag3.kr(q, morphLag);
    lDrive    = Lag3.kr(drive, morphLag);
    lRevMix   = Lag3.kr(reverbMix, morphLag);
    lRevRoom  = Lag3.kr(reverbRoom, morphLag);
    lNoiseAmp = Lag3.kr(noiseAmp, morphLag);
    lNoiseBPF = Lag3.kr(noiseBPFreq, morphLag);
    lBreathAmp= Lag3.kr(breathAmp, morphLag);
    lBreathRate = Lag3.kr(breathRate, morphLag);
    lPulseWidth = Lag3.kr(pulseWidth, morphLag);
    lPwmRate    = Lag3.kr(pwmRate, morphLag);
    lPwmDepth   = Lag3.kr(pwmDepth, morphLag);
    lDriftAmp = Lag3.kr(driftAmp, controlLag);
    lDriftRate = Lag3.kr(driftRate, morphLag);
    // ── enrichment lag ──
    lSubAmp           = Lag3.kr(subAmp, morphLag);
    lShimmerAmp       = Lag3.kr(shimmerAmp, morphLag);
    lShimmerRate      = Lag3.kr(shimmerRate, morphLag);
    lFilterLfoRate    = Lag3.kr(filterLfoRate, morphLag);
    lFilterLfoAmount  = Lag3.kr(filterLfoAmount, morphLag);

    // ── drift LFO (cents to ratio) ──
    driftLFO = SinOsc.kr(lDriftRate);
    driftRatio = 2.pow(driftLFO * lDriftAmp / 1200);
    driftedHz = lHz * driftRatio;

    // ── detune ratios ──
    detuneRatio  = 2.pow(lDetune / 1200);
    detuneRatio2 = 2.pow(lDetune2 / 1200);
    // Sin pair: detune ≤1 = Hz diretto (RESPIRO 0.3Hz beating)
    //           detune >1 = cents → Hz proporzionale
    sinDetuneHz = Select.kr((lDetune > 1).asInteger, [
        lDetune,
        driftedHz * (2.pow(lDetune / 1200) - 1)
    ]);

    triA = LFTri.ar(driftedHz * detuneRatio);
    triB = LFTri.ar(driftedHz / detuneRatio);
    tri = (triA + triB) * 0.5 * lMixTri;

    sawA = Saw.ar(driftedHz * detuneRatio);
    sawB = Saw.ar(driftedHz / detuneRatio);
    sawC = Saw.ar(driftedHz * detuneRatio2);
    sawCamp = Select.kr((lDetune2 > 0).asInteger, [0, 0.5]);
    saw = ((sawA + sawB) * 0.5 + (sawC * sawCamp)) * lMixSaw;

    pwmLFO = SinOsc.kr(lPwmRate);
    modWidth = (lPulseWidth + (pwmLFO * lPwmDepth)).clip(0.05, 0.95);
    pulA = Pulse.ar(driftedHz * detuneRatio, modWidth);
    pulB = Pulse.ar(driftedHz / detuneRatio, modWidth);
    pul = (pulA + pulB) * 0.5 * lMixPul;

    sinA = SinOsc.ar(driftedHz + sinDetuneHz);
    sinB = SinOsc.ar(driftedHz - sinDetuneHz);
    sin = (sinA + sinB) * 0.5 * lMixSin;

    bpNoise = BPF.ar(WhiteNoise.ar, lNoiseBPF, 0.08) * lNoiseAmp * 4;

    breathLFO = SinOsc.kr(lBreathRate).range(0.3, 1.0);
    breath = BPF.ar(PinkNoise.ar, 2000, 0.3) * lBreathAmp * breathLFO;

    // ── sub-octave layer: SinOsc -12 sem, dà "peso" sotto al fondamentale ──
    subSig = SinOsc.ar(driftedHz * 0.5) * lSubAmp * 0.7;

    // ── shimmer layer: SinOsc +12 sem modulato da LFO ampio. Dà "luce alta" ──
    // Modulazione amp con sin lento crea il classico "scintillio celestiale"
    shimmerLfo = SinOsc.kr(lShimmerRate).range(0.4, 1.0);
    shimmerSig = SinOsc.ar(driftedHz * 2) * lShimmerAmp * shimmerLfo * 0.4;

    sig = tri + saw + pul + sin + bpNoise + breath + subSig + shimmerSig;

    // ── slow filter LFO: cutoff oscilla ±filterLfoAmount × cutoff su filterLfoRate Hz ──
    // Aggiunge "movimento timbrico" lento, percepibile come pad che si apre/chiude piano.
    filterLfo = SinOsc.kr(lFilterLfoRate);
    modCutoff = lCutoff * (1 + (filterLfo * lFilterLfoAmount * 0.5));

    // ── filter ──
    sig = RLPF.ar(sig, modCutoff.clip(20, 18000), (1 - lQ).clip(0.05, 1));

    // ── tanh soft clip drive ──
    sig = Select.ar((lDrive > 0.001).asInteger, [
        sig,
        (sig * (1 + (lDrive * 4))).tanh * (1 / (1 + (lDrive * 2)))
    ]);

    // ── reverb ──
    dry = sig;
    wet = FreeVerb.ar(sig, 1, lRevRoom.clip(0, 1), 0.5);
    sig = (dry * (1 - lRevMix)) + (wet * lRevMix);

    env = EnvGen.kr(Env.asr(0, 1, 0.01), gate);
    sig = sig * lAmp * env;
    Out.ar(out, sig.dup);
}).add;
