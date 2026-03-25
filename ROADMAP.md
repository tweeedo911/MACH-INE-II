# MACH:INE II — Roadmap

Ogni milestone produce qualcosa di testabile, visivamente completo e utilizzabile da solo.

---

## v0.1.0–v0.8.0 — DONE

Spettrogramma → audio engine stereo → sandbox narrativo → campo halftone → DNA/generazioni → colore/mutazioni → camera → architettura ES modules.

## v0.9.0 — DONE
Sinestesia geometrica MIDI. 5 canali separati (KICK/BASS/HARMONY/LEAD/TEXTURE), colori per ruolo, MIDI patterns indipendenti.

## v1.0.0 — DONE
Piano narrativo Mondrian. 8 scene estetiche, 8 composizioni rettangolari, arco INTRO→CLIMAX→RELEASE, 7 palette dinamiche, onset wave.

## v1.1.0 — DONE
Audio-driven density. Void threshold, compressione non-lineare, densityFloor per spazio negativo reale.

## v1.2.0 — DONE
Colori puri + forme MIDI per tipo di suono + arco audio-driven (6 stati RMS). Region fillColor, camera narrativa per fase arc.

## v1.3.0 — DONE
Tre motori compositivi autonomi + MIDI unificato a 8 canali. Web Worker clock.

---

## v1.4.0 — DONE

**Identita musicale e visiva dei tre motori.**

- Composer 1 (TERRENO): BPM 116→72, modo D Dorian
- Composer 2 (MECCANICA): BPM 108→98, groove shuffle implementato
- Composer 3 (DERIVA): tonalita D Dorian→A Lydian, PULSE/BASS rimossi, brightness trigger per VOICE, grain da percussione GM a texture pitched
- `midi-patterns.js`: varianti per-engine (TERRENO/MECCANICA/DERIVA) con forme, decay e colori distinti
- `director.js`: scene e palette preferenziali per motore attivo
- `render.js`: engine tag per selezione variante visiva

---

## v1.5.0 — DONE

**Tre nuovi motori compositivi (6 totali).**

- Composer 4 (VORTICE): F Phrygian 138bpm, step sequencer tribale a 16th note, micro-loop poliritmici
- Composer 5 (CRISTALLO): Eb Lydian 54bpm, shimmer arpeggios, pad glaciali, grain sparkle
- Composer 6 (ABISSO): Bb Phrygian 76bpm, drone rituale, heartbeat pulse, risalita in rottura
- Mapping tastiera 1-6 per tutti i motori, mutua esclusione completa
- Connessione composers 4-6 al sistema MIDI clock

---

## v1.6.0 — DONE

**Sequencer autopilot + identita visiva profonda per motore.**

- Sequencer automatico ~40min: DERIVA→CRISTALLO→ABISSO→TERRENO→MECCANICA→VORTICE
- Transizioni tra motori con mutation storm (invert dissolve + chromatic shift)
- Tasto 0 = start/stop, → = skip
- Parametri visivi deep per motore in ENGINE_PREFS (shapeScale, trailLength, waveSpeed, flickerSpeed, densityGravity, midiDensityMul)
- HUD: display motore attivo e stato sequencer
- Rimappatura tastiera: 1=DERIVA, 2=CRISTALLO, 3=ABISSO, 4=TERRENO, 5=MECCANICA, 6=VORTICE

---

## v1.7.0 — DONE (corrente)

**Qualita musicale + MIDI Clock reale + debug generale.**

- MIDI Clock output 24ppqn: Start (0xFA), Stop (0xFC), Clock tick (0xF8) — sincronizzazione Ableton/DAW
- Auto Start/Stop MIDI clock all'attivazione/disattivazione motore
- TERRENO: progressioni accordali fisse (Dm→G→F→Dm), bass patterns sincopati per fase, swing kick, memoria motivica nella voce
- MECCANICA: progressioni fisse (C#m→E→F#m→C#m), groove shuffle attivo, bass cromatico, call-and-response VOICE↔LEAD
- DERIVA: grain da percussione GM a texture pitched (A Lydian high register), LEAD derivato dall'accordo corrente, contour rule Narmour
- VORTICE: rotazione pattern sfalsata (kick/ghost/bass/micro-loop a intervalli diversi), bass con b2 Phrygian, micro-loop transposition
- CRISTALLO: shimmer patterns variabili (up/down/suspend/scatter), grain piu denso con double sparkle, chord voicings estesi (maj7, add9, add11)
- ABISSO: CH4 chords con pad Bbm/Cb rituali, 5 canali presence (bass, drone, voice, grain, chords), bass root→Cb→root→Eb, grain a frequenza variabile
- Launcher su porta 8282
- Bugfix: lastPatternBar undeclared in VORTICE init

---

## v1.8.0 — PROSSIMO

**Sessione salvabile + stabilita.**

- [ ] Preset DNA + fase composer esportabili come JSON
- [ ] Load preset da file / URL param
- [ ] Snapshot visivo (canvas toBlob → download PNG)
- [ ] Rimuovere console.log residui in produzione (flag `CFG.debug`)
- [ ] MIDI out feedback visivo: canale attivo evidenziato nell'HUD

---

## v2.0.0

**Performance lunghe + ecosistema aperto.**

- [ ] Stabilita >2h (memory leak audit, fossil/entity pruning aggressivo)
- [ ] OSC support (via WebSocket bridge)
- [ ] Three.js migration: rendering 3D opzionale (toggle 2D/3D)
- [ ] Documentazione pubblica del protocollo compositivo

---

*Ultima modifica: 2026-03-25*
