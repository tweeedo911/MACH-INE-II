// MACH:INE III — live engine
// Boots server, loads SynthDef + biome presets, registers OSC handlers.
// Pilotato dal browser via WebSocket → bridge → OSC UDP 57120.
// Stateful: il bioma corrente è uno stato del server (Lag3 morphing tra biomi/fasi).

s.waitForBoot({
    var synthsPath, browserAddr;
    var droneSynth = nil, currentBiome = nil, currentPhase = \germoglio, phaseProgress = 0.0;
    var applyDronePreset, applyDronePhase;

    synthsPath = PathName.new(thisProcess.nowExecutingPath).parentPath ++ "synths/";

    // Carica SynthDef (Wave A: solo drone).
    [\drone].do { |n|
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
    applyDronePhase = { |phaseSym, prog|
        var curve = ~phaseCurves[phaseSym];
        var preset, droneParams;
        if(curve.isNil or: { currentBiome.isNil }) { ^nil };
        preset = ~biomePresets[currentBiome];
        if(preset.isNil) { ^nil };
        droneParams = preset[\drone];
        if(droneParams.isNil) { ^nil };

        // amp finale = ampScale × bioma master (0.5 default — il bioma non parla a piena voce)
        droneSynth.set(\amp, curve[\amp] * 0.5);
        // cutoff scalato per fase
        droneSynth.set(\cutoff, droneParams[\cutoff] * curve[\cutoffScale]);
        // drift scalato per fase
        droneSynth.set(\driftAmp, droneParams[\driftAmp] * curve[\driftScale]);
        // reverb additivo (dissoluzione +0.25)
        droneSynth.set(\reverbMix, (droneParams[\reverbMix] + curve[\reverbAdd]).clip(0, 1));
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

    // /synth/<name>/note freq amp dur — slot per Wave B (kick/bass/chord/voice/lead/arp/perc).
    // No-op stub finché non aggiungiamo i SynthDef one-shot.
    [\kick, \perc, \bass, \chord, \voice, \lead, \arp].do { |n|
        OSCdef(("note_" ++ n.asString).asSymbol, { |msg|
            // Wave A: stub. Wave B: Synth(n, [\freq, msg[1], \amp, msg[2], \dur, msg[3]]);
        }, "/synth/" ++ n.asString ++ "/note");
    };

    "[machine-engine] OSC handlers registered — ready.".postln;
    browserAddr.sendMsg("/log", "machine-engine ready");
});
