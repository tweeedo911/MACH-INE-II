// ═══════════════════════════════════════════════════════════════════
//  MACH:INE III — Master bus (single source, caricato da render-nrt/render-audio)
//  Catena: HPF → reverb stereo globale (spazio + width da sorgenti mono) →
//          tilt EQ → glue comp → widening M/S → saturazione → brickwall limiter.
//  In/ReplaceOut su bus 0. `.load` di questo file ritorna l'oggetto SynthDef.
//  Punto di crescita: per ruolo reverb-send + pan (richiede edit synthdef).
// ═══════════════════════════════════════════════════════════════════

SynthDef(\machineMaster, { |out = 0, revMix = 0.14, width = 1.25, drive = 1.05, ceiling = 0.97|
    var dry, wet, sig, mid, side;

    dry = In.ar(out, 2);
    dry = HPF.ar(dry, 26);                                // via il rumble sub-25Hz

    // reverb stereo globale: aggiunge spazio e decorrela il mono-dup in immagine stereo
    wet = FreeVerb2.ar(dry[0], dry[1], 1.0, 0.72, 0.45);
    sig = dry + (wet * revMix);

    // tilt EQ: corpo basso, taglio del fango medio-basso, aria alta
    sig = BLowShelf.ar(sig, 160,  1.0, 1.5);
    sig = BPeakEQ.ar(sig,  380,  1.2, -1.5);
    sig = BHiShelf.ar(sig, 7000,  1.0, 1.5);

    // glue compression (lenta, comprime sopra soglia)
    sig = Compander.ar(sig, sig, 0.30, 1, 0.65, 0.01, 0.18);

    // widening M/S: amplifica i lati (reverb + differenze) per immagine più ampia
    mid  = (sig[0] + sig[1]) * 0.5;
    side = (sig[0] - sig[1]) * 0.5 * width;
    sig  = [mid + side, mid - side];

    // coesione + brickwall limiter
    sig = (sig * drive).tanh;
    sig = Limiter.ar(sig, ceiling, 0.005);
    ReplaceOut.ar(out, sig);
}).add;
