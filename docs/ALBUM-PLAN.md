# ALBUM-PLAN — MACH:INE III "versione definitiva da disco"

> **North star persistente.** Obiettivo (goal 2026-06-18): portare MACH:INE III a una
> versione definitiva *da pubblicare come disco* — musica e visual al massimo, lavorando
> in autonomia. Questo file è il punto di riorientamento ad ogni turno/sessione.
> Live spec runtime resta in `STATUS.md` / `WORKLOG.md`; qui vive la rotta dell'album.

## Interpretazione del mandato (decisa in autonomia)

MACH:INE III oggi è un **sistema generativo live**: compone MIDI in tempo reale che un
performer interpreta su synth, + un motore audio SuperCollider (SC) ancora grezzo.
Un "disco" richiede **audio finito**, non solo segnali. Quindi *definitivo da disco* =

1. **Il sistema elevato a qualità da disco** — sound design SC, mix/master, profondità
   compositiva. (Vale per ogni lettura: live o registrato.)
2. **Un deliverable concreto**: un **album audio renderizzato e masterizzato**,
   prodotto deterministicamente da un run seedato (la macchina suona se stessa, nessun
   performer necessario), + **visual album** sincronizzato.

L'audio è prodotto **offline via SuperCollider headless** (`/Applications/SuperCollider.app/Contents/MacOS/sclang`),
quindi tutto il percorso è autonomo. ffmpeg per master/encoding.

## Concept artistico

Suite continua = pianeta/campo materiale in 7 (+1) movimenti. Arco: nascita → tessitura →
terra/groove → respiro → macchina → tempesta → ritorno, + ENCORE (Canon Machine).
Ogni bioma = una traccia/movimento. L'album = la suite.

| # | Traccia (bioma) | Carattere |
|---|---|---|
| 1 | NEBBIA | nascita, indaco, ambient fragile |
| 2 | TESSUTO | tessitura, saw caldo, stab |
| 3 | SOLCO | terra/dub groove |
| 4 | RESPIRO | respiro, sinusoidi pure, ariose |
| 5 | MACCHINA | meccanico, pulse PWM, arp 16th |
| 6 | TEMPESTA | tempesta, reese, voce+lead |
| 7 | RITORNO | ritorno, riverberato, geologia |
| 8 | ENCORE — Canon Machine | opzionale, escalation→taglio netto |

Titolo album / track titles / concept statement / liner notes / cover: Phase 4.

## Architettura pipeline "disco"

```
[run seedato MACH:INE III]                 (Phase 0: via Playwright headless o harness)
        │  session-recorder.js → SESSION.json  (MIDI events {t,ch,note,vel,dur} + biome/phase timeline)
        ▼
[build-score.mjs]  SESSION.json → score.scd   (ev: biome / phase / note role+freq+amp+dur)
        │   note→role: SC_ROLE_BY_CH (midi.js); freq=440·2^((note-69)/12); amp=(vel/127)·0.6
        ▼
[render-audio.scd]  carica 11 synthdef + biome-presets + MASTER BUS → replay → WAV stereo
        │   replica ESATTA della logica machine-engine (preset merge + phase amp scale)
        ▼
[master.sh]  ffmpeg loudnorm + true-peak limit → WAV master + mp3/flac per traccia
        ▼
[visual] render frame offline (canvas headless) sincronizzato all'audio → video per traccia
```

Render attuale = **realtime record** (`s.record`) — riusa la signal path live, robusto.
Upgrade futuro a **NRT** (`Score.recordNRT`) per velocità/determinismo se serve.

## Vincolo onesto: NON posso ascoltare

Il giudizio "superlativo musicalmente" è soggettivo e io non sento l'audio. Loop reale:
**render → analisi oggettiva** (LUFS, bilanciamento spettrale, dynamic range, peak,
correlazione stereo, silence detection via ffmpeg/python) + analisi strutturale dello score
→ miglioro → **checkpoint di audition**: consegno render all'utente per il giudizio di gusto.
Gli audition sono batchati ai checkpoint naturali; tra un checkpoint e l'altro lavoro autonomo.

## Roadmap a fasi

### Phase 0 — Pipeline di render (ABILITATORE, de-risk) ⟵ IN CORSO
- [x] Verifica sclang headless (SC 3.14.1 OK).
- [x] `render/render-audio.scd` self-contained: synthdef + preset + master bus + replay → WAV.
- [x] `render/score-test.scd` (copre 11 synth + 2 biomi + phase + master).
- [x] `render/master.sh` (ffmpeg loudnorm + limit) + `render/analyze.sh` (LUFS/peak/silence) + `render/render.sh` (runner+watchdog).
- [x] **Run end-to-end → WAV reale** (test 18.6s, -13.6 LUFS integrated, drone presente, tutti gli 11 synth + 2 biomi + phase + master). Master OK (-15.5 LUFS, LRA 19.9→16.3). Pipeline validata.
- [x] **Score generator deterministico**: `render/harness/` (shim + field-stub-loader + generate-score). Gira director3+5 moduli headless in fast-time, cattura via session-recorder. **Intera suite in 4.5s** → `score-full.scd` (19.809 eventi, 7 biomi, ~2092s). Arco: NEBBIA 0.33 n/s → TESSUTO/SOLCO ~8 → MACCHINA 15.7 → TEMPESTA 20.1 → RITORNO 2.8.
- [x] **Render NRT** — `render/render-nrt.scd` (Score.recordNRT). **Album completo in 18.6s** (~113× realtime, no audio device, zero dropout). Loop iterazione totale: ~23s (score 4.5s + audio 18.6s). NB SC: nomi var minuscoli; `.load` di un synthdef ritorna l'oggetto SynthDef (`.asBytes` diretto). Output bufferizzato → debug sotto PTY (`script -q /dev/null`).
- [x] **Album draft v1**: `render/album-nrt-v1.wav` (604MB, -14.5 LUFS, LRA 17.4 → arco preservato, peak -1.5dB). Deliverable in `render/album-v1/`: `MACHINE-III_full-draft-v1.mp3` + 7 tracce `01_NEBBIA..07_RITORNO.mp3`.
- [ ] Split per-traccia: fatto via ffmpeg + boundaries. (Migliorabile: emettere score per-traccia dal generator.)
- [ ] Unificare la logica handler tra `sc/machine-engine.scd` (live) e render (no duplicazione). [Phase 1]

- [x] **Export MIDI** (`render/harness/export-midi.mjs`, writer SMF inline): un solo run del motore → `score-full.scd` (audio) + file MIDI, **stesso take**. Output `render/album-midi/`: `MACHINE-III_full.mid` (format 1, PPQ 480, tempo map 564 cambi 60→129→86, 1 track per ruolo) + 7 per-bioma. Audio v5 + MIDI coincidono.

**Phase 0 COMPLETA**: pipeline end-to-end validata, album-draft (audio v5 + MIDI) renderizzato dallo stesso take. Master bus + spazializzazione v1.5; synth da arricchire → Phase 1.

> **Take corrente**: `harness/score-full.scd` (FROZEN). Cambi timbrici/master → ri-renderizza l'audio da questo score (MIDI invariati). Cambi compositivi → ri-run harness (nuovo take + nuovi MIDI).

**Boundaries biomi (s)** per split: NEBBIA 0 · TESSUTO 287.98 · SOLCO 624.86 · RESPIRO 983.62 · MACCHINA 1136.68 · TEMPESTA 1499.66 · RITORNO 1871.8 · fine 2092.

### Phase 1 — Sound design da disco (LEVA #1) ⟵ IN CORSO
- [x] **Master bus v1.5** (`render/master-synth.scd`, single-source): HPF + reverb stereo globale + tilt EQ + glue comp + widening M/S + sat + limiter. Verificato: album da mono (side -91dB) a **stereo reale** (side -35.7dB), -14.5 LUFS, LRA 18.3, peak -1.4dB. Draft v2 in `album-v1/` (link invariati).
- [x] **Reverb send per-ruolo + pan per-ruolo** (synthdef `sc/synths/` con controlli `pan/revSend/revBus` backward-compat — default = invariato, il live non cambia). Reverb-return stereo nel render NRT. Pan fisso per ruolo (low-end centrato, hat/arp/chord/lead spaziati) + send per-bioma. Verificato: side-channel +4..6dB in NEBBIA/SOLCO/TEMPESTA/RITORNO, MACCHINA asciutto. Draft v4 in `album-v1/`.
- [x] **Arricchimento timbrico** di tutti i 10 synth one-shot (kick sub-tail+armoniche, bass detune+filter-movement, chord 3ª voce+chorus+filter LFO, voice 3 bande formant+aria, lead detune+ottava+vibrato, arp shimmer, hat/openhat multi-banda metallico, snare 2-banda+corpo tonale, conga calore+risonanza). Verificato: v6 -14.6 LUFS, peak -1.1dB, **+1.6/+2.2 dB aria/armonici alti**, low-end solido, no clip, backward-compat (preset+spazializzazione intatti). Backup originali `/tmp/synths-backup-v5/`. Draft v6 in `album-v1/`.
- [ ] Audition utente del v6 → calibrazione mirata su feedback di gusto.
- [ ] Attivare pan/revSend anche nel live (`machine-engine.scd` + reverb-return) — opzionale, dopo validazione.

### Phase 3 — Visual album (PIPELINE VALIDATA)
- [x] Setup Playwright in `render/visual/` (playwright + chromium installati).
- [x] **Offline frame driver** (`render/visual/offline-driver.js` + `offline.html`): importa i moduli visivi REALI con path assoluti, gira a timestep fisso, espone `window.__renderStep()`. NO modifiche a main.js/render.js (aree protette). Param `?fps/seed/jump/phase`.
- [x] **Cattura Playwright** (`render/visual/capture.mjs`): server statico + headless Chrome → PNG/JPEG sequence. ~54ms/frame. VALIDATO: MACCHINA/densita renderizza correttamente (pioggia digitale glifi ciano), frame ispezionati. Proof: `render/visual/PROOF_MACCHINA.mp4` (8s).
- [x] `render/visual/to-video.sh` (ffmpeg frame seq + audio → mp4).
- [ ] **Take-sync**: il driver ri-esegue il motore (RNG non-seedato → take ≠ audio). Per AV sync vero, guidare il visual dal take FROZEN (replay MIDI in addMidiNote + density timeline dai recorder snapshot). L'arco biome/phase è già sincrono (timing deterministico).
- [ ] **Audio-reattività**: inviluppo energia per-frame dal WAV v6 → `window.__energyEnvelope` (hook già pronto nel driver).
- [ ] Full render (~50k frame @24fps, ~45min background) → video per traccia + full album.
- [ ] Pass per-bioma: ogni bioma un mondo sonoro distinto, album-grade.
- [ ] Loop render+analisi + audition. Loop iterazione: ~23s (score+NRT).
- [ ] Applicare lo stesso master a `render-audio.scd` (ora carica inline vecchio); o deprecarlo a favore di NRT.

### Phase 2 — Profondità compositiva (Wave 2)
- [ ] Markov 2° ordine voice/lead/arp; note magnetiche (gravità modale); heterophony voice↔lead.
- [ ] Arco/transizioni/dinamica per l'ascolto (album) oltre che per il live.

### Phase 3 — Visual album
- [ ] Chiudere debiti visivi (rupture infiltration/residue invisibili; 3 biomi senza linguaggio radicale).
- [ ] Render frame offline (canvas headless) → video sincronizzato all'audio per traccia.

### Phase 4 — Produzione & pubblicazione
- [~] **Bozza artistica** in `docs/ALBUM-NOTES.md`: concept, tracklist (durate reali del take v6), liner notes per movimento, proposte titolo. Da firmare/rivedere dall'utente.
- [ ] Curation: titoli, ordine, durate, gapless?, titolo album, concept statement, liner notes.
- [ ] Cover art (visual engine / Adobe).
- [ ] Master finale, metadata, bundle deliverable.

## Stato corrente

- Branch `machine-iii`, v3.20.0-rc3, tree pulito, allineato a origin.
- Drone SC ricco (4 osc + drift + sub + shimmer + filter LFO + drive + reverb).
- 11 synthdef one-shot + preset 7×10. Mai calibrati per qualità da disco.
- Pipeline render: scheletro in `app/render/` (Phase 0 in corso).

---
*Creato 2026-06-18 (sessione album). Aggiorna le checkbox ad ogni progresso.*
