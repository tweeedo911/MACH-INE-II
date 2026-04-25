// MACH:INE III — live engine
// Boots server, loads SynthDef + biome presets, registers OSC handlers.
// Pilotato dal browser via WebSocket → bridge → OSC UDP 57120.
// Stateful: il bioma corrente è uno stato del server (Lag3 morphing tra biomi/fasi).

s.waitForBoot({
    var synthsPath, browserAddr;
    var droneSynth = nil, currentBiome = nil, currentPhase = \germoglio, phaseProgress = 0.0;
    var applyDronePreset, applyDronePhase;

    synthsPath = PathName.new(thisProcess.nowExecutingPath).parentPath ++ "synths/";

    // Carica SynthDef (Wave A: drone, Wave B: + kick/bass/chord).
    [\drone, \kick, \bass, \chord].do { |n|
        var file = synthsPath ++ n.asString ++ ".scd";
        if(File.exists(file)) { file.load } { ("missing synth: " ++ file).postln };
    };

    // Carica preset table (~biomePresets, ~phaseCurves)
    (PathName.new(thisProcess.nowExecutingPath).parentPath ++ "biome-presets.scd").load;

    s.sync;
    "[machine-engine] SynthDef loaded".postln;

    // Singleton drone — sempre attivo, gate=1, amp=0 finché bioma non set.
    droneSynth = Synth(\machineDrone, [\amp, 0, \gate, 1], target: s);
    "[machine-engine] drone synth instantiated (gate=1, amp=0 — silent until /biome/set)".postln;

    // Bridge listens on UDP 57122 per replies.
    browserAddr = NetAddr.new("127.0.0.1", 57122);

    // ── Helper: applica preset bioma al drone synth ──
    applyDronePreset = { |biomeSym|
        var preset = ~biomePresets[biomeSym];
        var droneParams;
        if(preset.isNil) {
            ("[machine-engine] unknown biome: " ++ biomeSym).postln;
        } {
            droneParams = preset[\drone];
            if(droneParams.notNil) {
                droneParams.keysValuesDo { |k, v| droneSynth.set(k, v); };
                ("[machine-engine] biome → " ++ biomeSym).postln;
            };
        };
    };

    // ── Helper: applica phase curve sopra il preset bioma ──
    // Multiplier su amp/cutoff/drift dipendenti da phase + progress (0→1 dentro fase).
    // ATTENZIONE: niente `^nil` dentro Function blocks (causa ReturnException
    // e silenzia il synth). Usa nested if al posto di early return.
    applyDronePhase = { |phaseSym, prog|
        var curve, preset, droneParams, finalAmp;
        curve = ~phaseCurves[phaseSym];
        if(curve.notNil and: { currentBiome.notNil }) {
            preset = ~biomePresets[currentBiome];
            if(preset.notNil) {
                droneParams = preset[\drone];
                if(droneParams.notNil) {
                    finalAmp = curve[\amp] * 0.5;
                    droneSynth.set(\amp, finalAmp);
                    droneSynth.set(\cutoff, droneParams[\cutoff] * curve[\cutoffScale]);
                    droneSynth.set(\driftAmp, droneParams[\driftAmp] * curve[\driftScale]);
                    droneSynth.set(\reverbMix, (droneParams[\reverbMix] + curve[\reverbAdd]).clip(0, 1));
                    ("[machine-engine] phase → " ++ phaseSym ++ " (amp=" ++ finalAmp.round(0.01) ++ ")").postln;
                };
            };
        };
    };

    // ── OSC handlers ──

    OSCdef(\status, { |msg|
        browserAddr.sendMsg("/pong");
    }, "/status");

    // /biome/set BIOMA — cambia preset drone (Wave A: solo drone)
    OSCdef(\biomeSet, { |msg|
        var biomeName = msg[1];
        var biomeSym;
        if(biomeName.isNil) {
            ("[machine-engine] /biome/set missing arg").postln;
        } {
            biomeSym = biomeName.asSymbol;
            currentBiome = biomeSym;
            applyDronePreset.value(biomeSym);
            // Riapplica phase corrente sopra il nuovo preset
            applyDronePhase.value(currentPhase, phaseProgress);
            browserAddr.sendMsg("/log", "biome " ++ biomeName);
        };
    }, "/biome/set");

    // /phase/set PHASE PROGRESS — phase curve (multipliers su amp/cutoff/drift/reverb)
    OSCdef(\phaseSet, { |msg|
        var phaseName = msg[1];
        var prog = msg[2] ? 0.0;
        if(phaseName.notNil) {
            currentPhase = phaseName.asSymbol;
            phaseProgress = prog;
            applyDronePhase.value(currentPhase, prog);
        };
    }, "/phase/set");

    // /panic — silenzia drone (amp=0), libera tutti i synth one-shot
    OSCdef(\panic, { |msg|
        droneSynth.set(\amp, 0);
        s.freeAll;
        // Reinstanzia il drone singleton
        droneSynth = Synth(\machineDrone, [\amp, 0, \gate, 1], target: s);
        browserAddr.sendMsg("/log", "panic: cleared + drone re-instantiated");
    }, "/panic");

    // /synth/<name>/note freq amp dur — Wave B: kick/bass/chord attivi, voice/lead/arp/perc stub.
    // Pattern: legge preset bioma per role, merga con freq/amp/dur dal browser, instanzia Synth.
    // Se il preset ha amp:0, il ruolo è silenziato per quel bioma (es. NEBBIA kick=0).
    [\kick, \bass, \chord].do { |role|
        OSCdef(("note_" ++ role.asString).asSymbol, { |msg|
            var freq, msgAmp, dur, args, preset, presetParams, ampMute;
            freq = msg[1] ? 220;
            msgAmp = msg[2] ? 0.3;
            dur = msg[3] ? 0.2;
            args = [\freq, freq, \amp, msgAmp, \dur, dur];
            ampMute = false;
            if(currentBiome.notNil) {
                preset = ~biomePresets[currentBiome];
                if(preset.notNil) {
                    presetParams = preset[role];
                    if(presetParams.notNil) {
                        // Bioma silenzia il ruolo? (es. NEBBIA kick amp=0)
                        if((presetParams[\amp] ? 1) <= 0.001) { ampMute = true };
                        // Merga param timbrici, ma freq/amp/dur dal browser prevalgono.
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
        }, "/synth/" ++ role.asString ++ "/note");
    };

    // Wave C — voice/lead/arp/perc: stub (silenziato finché SynthDef non ci sono).
    [\voice, \lead, \arp, \perc].do { |role|
        OSCdef(("note_" ++ role.asString).asSymbol, { |msg|
            // no-op
        }, "/synth/" ++ role.asString ++ "/note");
    };

    "[machine-engine] OSC handlers registered — ready.".postln;
    browserAddr.sendMsg("/log", "machine-engine ready");
});
