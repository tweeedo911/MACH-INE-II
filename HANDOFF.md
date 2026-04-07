# MACH:INE II — Handoff Document

## Cos'è
Sistema generativo live: l'AI compone MIDI in tempo reale (45-60min), il performer interpreta su synth/Ableton. Simultaneamente concerto e album generativo. Stack: ES modules puri, zero dipendenze, Canvas 2D, Web Audio, WebMIDI, Worker clock. Porta 8282.

## Numeri
72 commit in 15 giorni (21 mar → 5 apr 2026). v0.1 → v4.1.0. ~9700 righe JS in src/. 27 moduli. 0 frame drops su 45min (8.3ms avg frame).

## Architettura attuale (v4.1)
- **MacroComposer 4D** (`macro-composer.js`): stato (rhythmicDensity, harmonicColor, melodicActivity, textureDepth) interpolato su 25 checkpoint Hermite per 43min. È il "cervello".
- **3 Layer V3**: HarmonyLayer (drone CH2, chords CH4, bass CH3), RhythmLayer (kick CH0, hat CH1, perc CH7), MelodyTextureLayer (voice CH5, lead CH6)
- **Sequencer**: 7 fasi (NEBBIA→TESSUTO→SOLCO→RESPIRO→MACCHINA→TEMPESTA→RITORNO)
- **Presence multiplier**: crossfade 0.0-1.0 per engine, gating MIDI sotto 0.05
- **Renderer**: halftone Bayer 8x8, forme (rect/band/column/trail/rupture), moiré, film grain, grid distortion, feedback geometrico
- 8 canali MIDI: CH0=PULSE, CH1=GRAIN, CH2=DRONE, CH3=BASS, CH4=CHORDS, CH5=VOICE, CH6=LEAD, CH7=RUPTURE

## Cosa funziona bene
1. **Stack tecnico**: performance eccellente, zero allocazioni hot-path, Worker MIDI non-throttolabile
2. **Infrastruttura live**: projector, wake lock, crash recovery, arc jump, pause/loop
3. **Renderer Bayer**: linguaggio visivo unico con 4 tecniche avanzate
4. **MacroComposer 4D**: arco narrativo sofisticato

## Cosa non funziona — il problema centrale
**"L'architetto è bravo, l'orchestra è sorda"** (review team, voto 3/5).

Il MacroComposer disegna un arco 4D raffinato, ma i 3 layer lo ignorano:
- **8 leak documentati** dove i layer bypassano le direttive (hat sempre attivo, velocity melodiche ×mA→3.6, break stocastici 65%, kick monopitch)
- **Mix catastrofico** (sessione 45min, 36519 eventi): CH1 GRAIN 58.5% + CH7 RUPTURE 27% = 85.4%. CH3 BASS 363 note totali. CH5/CH6 vel avg 37/31 = inaudibili.
- **Zero identità per traccia**: stesso hat ovunque, kick C2 fisso, nessun groove basso riconoscibile, nessuna palette visiva per fase
- **Visivo**: 17 sistemi additivi senza cap, nessun focal point, plateau 10-20min

## Cosa si è perso per strada
1. **Identità 7 motori**: i vecchi composer (composer.js→composer7.js, 3616 righe) avevano carattere specifico (canon alla quinta, hocket CH5/CH6, interlocking, shimmer). Il passaggio ai 3 layer V3 generici ha perso questa specificità. I composer sono stati cancellati dal working tree (non committato).
2. **Concept "album 7 tracce"**: definito nel DESIGN-V5.md con arco emotivo e palette colorate, mai implementato
3. **Preset system**: WIP non integrato (presets.js, preset-engine.js, config-loader.js, designer.html)
4. **Session recorder**: esiste (294 righe) ma non collegato

## Stato working tree (non committato)
- **Cancellati**: composer.js → composer7.js (-3951 righe)
- **Modificati**: config.js, main.js, render.js, harmony/rhythm/melody layers, midi.js, sequencer.js (+281 righe)
- **Nuovi**: presets.js, preset-engine.js, config-loader.js, designer.js, session-recorder.js, utils.js, designer.html

## File chiave
- `src/config.js` (1030 righe) — TUTTI i parametri numerici, unica fonte di verità
- `src/macro-composer.js` (249) — cervello 4D
- `src/rhythm-layer.js` (550) — dove stanno i leak hat/kick
- `src/melody-texture-layer.js` (539) — dove stanno i leak velocity/emissione
- `src/harmony-layer.js` (272) — drone/chords/bass
- `src/director.js` (1416) — regia visiva, scene, camera, arco
- `src/field.js` (673) — renderer Bayer, density, forme MIDI
- `src/sequencer.js` (460) — 7 fasi, cue system, firma

## Regole ferree
- Zero npm, zero build, zero dipendenze
- Piccoli edit, mai riscritture monolitiche
- Tutto in config.js, no magic numbers
- Codice in inglese, docs in italiano
- Rupture sempre 4 stadi (omen→infiltrazione→takeover→residuo)
- Aree protette (main/render/director, audio onset, narrativa arco/camera): chiedere prima

## Priorità per il prossimo lavoro
Il problema non è aggiungere feature — è **far rispettare l'arco ai layer**. In ordine:
1. Chiudere gli 8 leak (hat gating, velocity floor, kick diversificato, break legati all'arco)
2. Dare identità per traccia (pattern ritmico unico, basso come firma, texture diversa)
3. Riequilibrare il mix (CH1 da 58%→~20%, CH5/CH6 udibili, CH7 raro)
4. Regia visiva intenzionale (composizione per traccia, fondi colorati, negative space)
