// ═══════════════════════════════════════════════════════════════════
//  MACH:INE III — Offline Audio Render (realtime record)
//  Carica gli 11 SynthDef veri + biome-presets + un MASTER BUS, replica
//  uno score (lista di eventi biome/phase/note) e registra su WAV stereo.
//
//  Riproduce ESATTAMENTE la logica di sc/machine-engine.scd:
//    - drone singleton con biome morphing (Lag3) + phase curve
//    - one-shot: merge preset bioma per ruolo + scala amp per fase + skip se amp≈0
//  così l'audio renderizzato == l'audio del motore live.
//
//  Uso:
//    sclang render-audio.scd [scorePath] [outWavPath]
//  default scorePath = ./score-test.scd , outWav = ./render-out.wav
// ═══════════════════════════════════════════════════════════════════

(
var argv      = thisProcess.argv;
var here      = thisProcess.nowExecutingPath.dirname;
var scorePath = if(argv.size > 0) { argv[0] } { here +/+ "score-test.scd" };
var outWav    = if(argv.size > 1) { argv[1] } { here +/+ "render-out.wav" };
var synthsDir = here +/+ "../sc/synths/";
var presets   = here +/+ "../sc/biome-presets.scd";

// ── stato di render (env vars, condivise dalle funzioni handler) ──
~currentBiome  = nil;
~currentPhase  = \germoglio;
~phaseProgress = 0.0;
~drone         = nil;

s.options.numOutputBusChannels = 2;
s.options.numInputBusChannels  = 0;
s.options.sampleRate           = 48000;
s.options.memSize              = 262144;   // 256MB — reverb/comp headroom

("[render] score = " ++ scorePath).postln;
("[render] out   = " ++ outWav).postln;

// carica lo score (definisce ~score, ~duration, ~tail, ~sampleRate)
scorePath.load;

s.waitForBoot({
    var roles = [\drone, \kick, \bass, \chord, \voice, \lead, \arp, \hat, \openhat, \snare, \conga];

    // ── carica SynthDef ──
    roles.do { |n|
        var f = synthsDir ++ n.asString ++ ".scd";
        if(File.exists(f)) { f.load } { ("[render] MISSING synth: " ++ f).postln };
    };
    presets.load;
    s.sync;

    // ── MASTER BUS v1: HPF + tilt EQ + glue comp + soft sat + brickwall limiter ──
    // In coda al group, In/ReplaceOut su bus 0. Punto di crescita Phase 1.
    SynthDef(\machineMaster, { |out = 0|
        var sig = In.ar(out, 2);
        sig = HPF.ar(sig, 28);                          // via il rumble sub
        sig = BLowShelf.ar(sig, 180,  1.0, 1.5);        // calore basso
        sig = BHiShelf.ar(sig,  6500, 1.0, 1.0);        // aria alta
        sig = Compander.ar(sig, sig, 0.28, 1, 0.6, 0.01, 0.20);  // glue (compress >thresh)
        sig = (sig * 1.06).tanh;                        // coesione
        sig = Limiter.ar(sig, 0.965, 0.005);            // ceiling ~ -0.3 dB
        ReplaceOut.ar(out, sig);
    }).add;
    s.sync;

    // drone singleton (gate 1, amp 0 finché un bioma non è set)
    ~drone = Synth(\machineDrone, [\amp, 0, \gate, 1], target: s);
    // master in coda (dopo tutte le sorgenti)
    Synth.tail(s, \machineMaster, [\out, 0]);
    s.sync;

    // ── handler: phase curve sul drone (porting di applyDronePhase) ──
    ~applyPhase = { |phaseSym, prog|
        var curve = ~phaseCurves[phaseSym], preset, dp, finalAmp;
        ~currentPhase  = phaseSym;
        ~phaseProgress = prog ? 0.0;
        if(curve.notNil and: { ~currentBiome.notNil }) {
            preset = ~biomePresets[~currentBiome];
            if(preset.notNil) {
                dp = preset[\drone];
                if(dp.notNil) {
                    finalAmp = curve[\amp] * 0.5;
                    ~drone.set(\amp, finalAmp);
                    ~drone.set(\cutoff,    dp[\cutoff]   * curve[\cutoffScale]);
                    ~drone.set(\driftAmp,  dp[\driftAmp] * curve[\driftScale]);
                    ~drone.set(\reverbMix, (dp[\reverbMix] + curve[\reverbAdd]).clip(0, 1));
                };
            };
        };
    };

    // ── handler: set bioma (porting di applyDronePreset + riapplica fase) ──
    ~setBiome = { |biomeSym|
        var preset = ~biomePresets[biomeSym], dp;
        ~currentBiome = biomeSym;
        if(preset.notNil) {
            dp = preset[\drone];
            if(dp.notNil) { dp.keysValuesDo { |k, v| ~drone.set(k, v) } };
        } { ("[render] unknown biome: " ++ biomeSym).postln };
        ~applyPhase.(~currentPhase, ~phaseProgress);
    };

    // ── handler: nota one-shot (porting del note handler machine-engine) ──
    ~playNote = { |role, freq, msgAmp, dur|
        var args, preset, presetParams, ampMute = false, phaseAmpScale, finalAmp;
        phaseAmpScale = (~phaseCurves[~currentPhase] !? { |c| c[\amp] }) ? 1.0;
        finalAmp = msgAmp * phaseAmpScale;
        args = [\freq, freq, \amp, finalAmp, \dur, dur, \out, 0];
        if(~currentBiome.notNil) {
            preset = ~biomePresets[~currentBiome];
            if(preset.notNil) {
                presetParams = preset[role];
                if(presetParams.notNil) {
                    if((presetParams[\amp] ? 1) <= 0.001) { ampMute = true };
                    if(ampMute.not) {
                        presetParams.keysValuesDo { |k, v|
                            if((k != \freq) and: { (k != \amp) and: { k != \dur } }) {
                                args = args ++ [k, v];
                            };
                        };
                    };
                };
            };
        };
        if(ampMute.not) { Synth(role, args) };
    };

    // ── record ──
    s.recHeaderFormat = "wav";
    s.recSampleFormat = "int24";
    s.record(outWav, numChannels: 2);
    s.sync;
    0.2.wait;

    // ── replay score ──
    Routine({
        var prevT = 0;
        (~score ? []).do { |ev|
            var t = ev[0], type = ev[1];
            (t - prevT).max(0).wait;
            prevT = t;
            case
                { type == \biome } { ~setBiome.(ev[2]) }
                { type == \phase } { ~applyPhase.(ev[2], ev[3]) }
                { type == \note }  { ~playNote.(ev[2], ev[3], ev[4], ev[5]) };
        };
        (~tail ? 3.0).wait;     // coda riverbero
        s.stopRecording;
        s.sync;
        0.3.wait;
        ("[render-ok] " ++ outWav).postln;
        s.quit;
        0.exit(0);
    }).play;
});
)
