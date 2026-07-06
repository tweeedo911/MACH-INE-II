// ═══════════════════════════════════════════════════════════════════
//  MACH:INE III — Offline Audio Render (NRT, non-realtime)
//  Come render-audio.scd ma via Score.recordNRT: rende faster-than-realtime,
//  NON usa l'audio device (gira in parallelo), zero dropout.
//  Costruisce un Score (bundle OSC temporizzati) dallo score e lo rende a WAV.
//
//  Uso: sclang render-nrt.scd [scorePath] [outWavPath]
// ═══════════════════════════════════════════════════════════════════

(
var argv      = thisProcess.argv;
var here      = thisProcess.nowExecutingPath.dirname;
var scorePath = if(argv.size > 0) { argv[0] } { here +/+ "harness/score-probe.scd" };
var outWav    = if(argv.size > 1) { argv[1] } { here +/+ "nrt-out.wav" };
var synthsDir = here +/+ "../sc/synths/";
var presetsF  = here +/+ "../sc/biome-presets.scd";

var files   = [\drone, \kick, \bass, \chord, \voice, \lead, \arp, \hat, \openhat, \snare, \conga];
var droneId = 1000, masterId = 1001, nodeCtr = 2000;
var offset = 0.01;  // setup a 0..0.005, score a +offset (Lag3 assorbe)
var biomePresets, phaseCurves, list, endTime, o;
var curBiome = nil, curPhase = \germoglio;
var dronePairs, phasePairs, resolveArgs, ok = true;
var defObjs, masterDef, masterByBiome, mp;
var revReturnDef, revReturnId = 1002, revBusIdx = 2;
var panByRole, biomeSendScale, roleSendMult;

// ── carica synthdef + master + preset ──
// NB: `.load` di un file restituisce il valore dell'ultima espressione = `SynthDef(...).add`
// che ritorna l'oggetto SynthDef. Lo cattura (asBytes diretto, niente SynthDescLib.def che è nil).
defObjs = List.new;
files.do { |n|
    var f = synthsDir ++ n.asString ++ ".scd";
    if(File.exists(f)) { defObjs.add(f.load) } { ("[nrt] MISSING " ++ f).postln; ok = false; };
};
masterDef = (here +/+ "master-synth.scd").load;   // single-source master bus

// ── reverb-return stereo (NRT-only): legge il bus wet privato, riverbera, ADD su bus 0 ──
// Sorgenti (addToHead) → revReturn (addToTail, prima del master) → master (addToTail, replace bus 0).
revReturnDef = SynthDef(\machineRevReturn, { |revBus = 2, room = 0.8, damp = 0.4, amp = 1.0|
    var wetIn, wet;
    wetIn = In.ar(revBus, 2);
    wet = FreeVerb2.ar(wetIn[0], wetIn[1], 1.0, room, damp);  // 100% wet del segnale già scalato dai send
    Out.ar(0, wet * amp);                                     // ADD su bus 0 (non Replace)
}).add;

presetsF.load;
scorePath.load;
biomePresets = ~biomePresets;
phaseCurves  = ~phaseCurves;
endTime = (~duration ? 60) + (~tail ? 6) + offset;

// ── identità spaziale per-bioma (master revMix/width) ──
// NEBBIA/RESPIRO/RITORNO: ariosi e larghi. SOLCO/MACCHINA: asciutti e focalizzati. TEMPESTA: grande ma controllato.
masterByBiome = (
    \NEBBIA:   [\revMix, 0.11, \width, 1.35],
    \TESSUTO:  [\revMix, 0.08, \width, 1.25],
    \SOLCO:    [\revMix, 0.05, \width, 1.15],
    \RESPIRO:  [\revMix, 0.12, \width, 1.40],
    \MACCHINA: [\revMix, 0.035, \width, 1.10],
    \TEMPESTA: [\revMix, 0.06, \width, 1.30],
    \RITORNO:  [\revMix, 0.13, \width, 1.40]
);

// ── spazializzazione per-ruolo (NRT): pan fisso + reverb-send (base 0.5 * biomeScale * roleMult) ──
// Low-end & snare centrati (mono-compat); hat/arp/chord/lead/conga spaziati.
panByRole = (
    \kick: 0.0, \bass: 0.0, \snare: 0.0, \conga: 0.15, \hat: 0.30,
    \openhat: -0.35, \arp: 0.45, \chord: -0.25, \voice: 0.0, \lead: 0.20
);
// scala send per bioma: NEBBIA/RESPIRO ariosi, SOLCO/MACCHINA asciutti.
biomeSendScale = (
    \NEBBIA: 0.60, \RESPIRO: 0.60, \RITORNO: 0.70, \TESSUTO: 0.35,
    \SOLCO: 0.20, \MACCHINA: 0.12, \TEMPESTA: 0.28
);
// moltiplicatore per ruolo: drums poco wet, bass quasi dry, melodici full.
roleSendMult = (
    \kick: 0.4, \snare: 0.4, \hat: 0.4, \openhat: 0.4, \conga: 0.4,
    \bass: 0.2, \chord: 1.0, \voice: 1.0, \lead: 1.0, \arp: 1.0
);

// ── helper ──
dronePairs = { |biomeSym|
    var dp = biomePresets[biomeSym] !? { |p| p[\drone] }, pairs = [];
    if(dp.notNil) { dp.keysValuesDo { |k, v| pairs = pairs ++ [k, v] } };
    pairs;
};
phasePairs = { |biomeSym, phaseSym|
    var c = phaseCurves[phaseSym], dp = biomePresets[biomeSym] !? { |p| p[\drone] };
    if(c.notNil and: { dp.notNil }) {
        [ \amp, c[\amp] * 0.5,
          \cutoff, dp[\cutoff] * c[\cutoffScale],
          \driftAmp, dp[\driftAmp] * c[\driftScale],
          \reverbMix, (dp[\reverbMix] + c[\reverbAdd]).clip(0, 1) ];
    } { [] };
};
resolveArgs = { |role, freq, msgAmp, dur|
    var phaseAmpScale = (phaseCurves[curPhase] !? { |c| c[\amp] }) ? 1.0;
    var finalAmp = msgAmp * phaseAmpScale;
    var args = [\freq, freq, \amp, finalAmp, \dur, dur, \out, 0];
    var preset = curBiome !? { |b| biomePresets[b] }, pp, muted = false;
    // ── spazializzazione: pan per-ruolo + revSend = 0.5 * biomeScale * roleMult (clip 0..0.9) ──
    var rolePan  = (panByRole[role] ? 0.0);
    var bScale   = (curBiome !? { |b| biomeSendScale[b] }) ? 0.0;
    var rMult    = (roleSendMult[role] ? 0.0);
    var revSend  = (0.5 * bScale * rMult).clip(0, 0.9);
    if(preset.notNil) {
        pp = preset[role];
        if(pp.notNil) {
            if((pp[\amp] ? 1) <= 0.001) { muted = true };
            if(muted.not) { pp.keysValuesDo { |k, v| if((k != \freq) and: { (k != \amp) and: { k != \dur } }) { args = args ++ [k, v] } } };
        };
    };
    args = args ++ [\pan, rolePan, \revBus, revBusIdx, \revSend, revSend];
    if(muted) { nil } { args };
};

if(ok.not) { "[nrt] abort: missing synthdef".postln; 0.exit(1) };

// ── build Score list ──
list = List.new;
// t=0: carica i SynthDef nel server NRT (asBytes diretto sugli oggetti catturati)
defObjs.do { |d| list.add([0.0, ['/d_recv', d.asBytes]]) };
list.add([0.0, ['/d_recv', masterDef.asBytes]]);
list.add([0.0, ['/d_recv', revReturnDef.asBytes]]);
// drone (head) → revReturn (tail, prima del master) → master (tail).
// Ordine esecuzione scsynth = ordine di creazione per stesso target/addAction.
// Sorgenti note (addToHead, addAction 0) eseguono prima dei nodi addToTail.
// revReturn e master entrambi addToTail (addAction 1, target 0); revReturn aggiunto PRIMA → esegue prima → legge il bus wet già scritto dalle sorgenti, poi il master legge/replace bus 0.
list.add([0.005, ['/s_new', \machineDrone, droneId, 0, 0, \amp, 0, \gate, 1]]);
list.add([0.005, ['/s_new', \machineRevReturn, revReturnId, 1, 0, \revBus, revBusIdx]]);
list.add([0.005, ['/s_new', \machineMaster, masterId, 1, 0, \out, 0]]);

(~score ? []).do { |ev|
    var t = ev[0] + offset, type = ev[1];
    case
    { type == \biome } {
        curBiome = ev[2];
        list.add([t, (['/n_set', droneId] ++ dronePairs.(curBiome))]);
        list.add([t + 0.001, (['/n_set', droneId] ++ phasePairs.(curBiome, curPhase))]);
        mp = masterByBiome[curBiome] ? [\revMix, 0.07, \width, 1.25];
        list.add([t, (['/n_set', masterId] ++ mp)]);
    }
    { type == \phase } {
        curPhase = ev[2];
        list.add([t + 0.001, (['/n_set', droneId] ++ phasePairs.(curBiome, curPhase))]);
    }
    { type == \note } {
        var args = resolveArgs.(ev[2], ev[3], ev[4], ev[5]);
        if(args.notNil) {
            list.add([t, (['/s_new', ev[2], nodeCtr, 0, 0] ++ args)]);
            nodeCtr = nodeCtr + 1;
        };
    };
};
list.add([endTime, ['/c_set', 0, 0]]);  // marker fine

("[nrt] score events: " ++ list.size ++ "  endTime: " ++ endTime.round(0.1) ++ "s").postln;

o = ServerOptions.new;
o.numOutputBusChannels = 2;
o.numInputBusChannels  = 0;
o.sampleRate = 48000;
o.memSize = 524288;

Score(list.asArray).recordNRT(
    (here +/+ "_nrt.osctmp"),
    outWav,
    nil,
    48000, "WAV", "int24",
    o,
    "",
    endTime,
    action: {
        ("[nrt-ok] " ++ outWav).postln;
        0.exit(0);
    }
);
)
