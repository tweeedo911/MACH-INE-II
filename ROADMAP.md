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

## v1.7.0 — DONE

**Qualita musicale + MIDI Clock reale + debug generale.**

- MIDI Clock output 24ppqn — sincronizzazione Ableton/DAW
- Qualita musicale avanzata per tutti e 6 i motori
- Launcher su porta 8282

---

## v2.0.0 — DONE (corrente)

**Concerto narrativo a 5 atti — struttura drammaturgica completa.**

- Sequencer v3: 5 atti (EMERGENZA / DISCESA / MACCHINA / VORTICE / RITORNO) con sovrapposizione multi-motore
- Presence multiplier system: crossfade tra motori sovrapposti, channel gating in tutti i 6 composer
- Momenti-firma: GELO, CONVERGENZA, INVERSIONE (climax globale), VUOTO TOTALE
- Apertura/chiusura concerto: emersione quadratica 120s / dissoluzione 90s
- Colore progressivo per atto: monocromo → +A → +B → +C
- Climax cromatico reale: bg tinting + boost alpha
- Palette e MIDI colors engine-specific (ice, abyssal, steel, ikeda)
- Camera breathing + shot DRIFT
- Tensione narrativa + impatto + contrasto temporale
- Audio input gain 5.0× default

---

## v2.1.0 — PROSSIMO

**Raffinamento composizioni musicali + stabilita.**

- [ ] Revisione qualita musicale di tutti i 6 composer
- [ ] Sessione salvabile: preset DNA + fase composer come JSON
- [ ] Snapshot visivo (canvas toBlob → download PNG)
- [ ] Rimuovere console.log residui (flag `CFG.debug`)

---

## v3.0.0

**Performance lunghe + ecosistema aperto.**

- [ ] Stabilita >2h (memory leak audit, fossil/entity pruning aggressivo)
- [ ] OSC support (via WebSocket bridge)
- [ ] Three.js migration: rendering 3D opzionale (toggle 2D/3D)
- [ ] Documentazione pubblica del protocollo compositivo

---

*Ultima modifica: 2026-03-25*
