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

---

## v1.3.0 — DONE (corrente)

**Tre motori compositivi autonomi + MIDI unificato a 8 canali.**

### Mapping canonico (Ableton CH 1–8)

| Ableton | Codice | Ruolo |
|---------|--------|-------|
| CH 1 | PULSE  | Euclidean kick/motorik |
| CH 2 | GRAIN  | Hihat/percussione GM |
| CH 3 | DRONE  | Pad/cluster sempre presente |
| CH 4 | BASS   | Basso, legge root da CHORDS |
| CH 5 | CHORDS | Triadi modali, voice leading |
| CH 6 | VOICE  | Melodia Markov 2° ordine |
| CH 7 | LEAD   | Motivo principale |
| CH 8 | RUPTURE | 4 stadi obbligatori |

### Composer 1 — tasto `1` (D Dorian, 116 BPM)
DERIVA in 5 fasi: GERMOGLIO→PULSAZIONE→DENSITÀ→ROTTURA→DISSOLUZIONE. EuclideanEngine E(5,16), Markov, rupture 4 stadi.

### Composer 2 — tasto `2` (C# Dorian, 108 BPM)
4 layer oscillatori sfasati (harmonic/rhythmic/textural/melodic). VoidManager silence ≥40%. Director event bus: tension/void/grain_entry/chord_change/rupture_stage/density_peak.

### Composer 3 — tasto `3` (D Dorian DERIVA, 84 BPM motorik)
Fedele alla spec `new/`. EuclideanEngine, GrainEngine GM percussion (hihat/claves/sideStick/clap/tom), ChordEngine progressioni fisse (Dm→F→Dm→C), MarkovEngine note accordo ×3. RuptureEngine con note off-scale presagio (Bb/F#, vel 28).

### Infrastruttura
- Web Worker clock: MIDI esce anche con Ableton in primo piano (nessun throttling rAF)
- Gain audio input controllabile live (`è` / `+`, range 0.5–8.0×, visibile in HUD)
- Mutua esclusione completa tra i tre composer

---

## v1.4.0 — PROSSIMO

**Stabilità live + leggibilità performance.**

- [ ] Dual-screen: finestra controllo (HUD completo) + proiezione fullscreen separata (`window.open`)
- [ ] Macro CC: mappare 4–8 CC MIDI ai parametri chiave (gain, densità, evoSpeed, palette)
- [ ] Eliminare i TASK-v*.md dalla root → archivio in `docs/`
- [ ] Rimuovere console.log residui in produzione (flag `CFG.debug`)
- [ ] MIDI out feedback visivo: canale attivo evidenziato nell'HUD

---

## v1.5.0

**Sessione salvabile.**

- [ ] Preset DNA + fase composer esportabili come JSON
- [ ] Load preset da file / URL param
- [ ] Snapshot visivo (canvas toBlob → download PNG)

---

## v2.0.0

**Performance lunghe + ecosistema aperto.**

- [ ] Stabilità >2h (memory leak audit, fossil/entity pruning aggressivo)
- [ ] OSC support (via WebSocket bridge)
- [ ] Three.js migration: rendering 3D opzionale (toggle 2D/3D)
- [ ] Documentazione pubblica del protocollo compositivo

---

*Ultima modifica: 2026-03-24*
