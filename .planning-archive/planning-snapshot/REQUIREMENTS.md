# Requirements: MACH:INE II v3

**Defined:** 2026-03-27
**Core Value:** L'AI è il compositore — genera musica abbastanza ricca, coerente e memorabile da reggere una performance live di 60 minuti con arco narrativo completo.

## v1 Requirements

### Migrazione (MIGR)

- [x] **MIGR-01**: Il codice v2 è archiviato su branch git separato prima di qualsiasi modifica al main
- [x] **MIGR-02**: Un flag `V3_MODE` in config.js permette coesistenza v2/v3 durante lo sviluppo

### Infrastruttura (INFR)

- [x] **INFR-01**: Il MIDI clock gira nel Web Worker — nessuna GC pause sul main thread può interrompere il timing
- [x] **INFR-02**: Le transizioni di BPM sono lerp su 2-4 battute (nessun snap brusco che rompe il sync Ableton)
- [x] **INFR-03**: Le transizioni tra sezioni non generano burst di note — silenzio/crossfade protetto

### Composizione — Macro (MARC)

- [x] **MARC-01**: Il MacroComposer gestisce un arco narrativo 4D (rhythmicDensity, harmonicColor, melodicActivity, textureDepth) su 45-60 minuti
- [x] **MARC-02**: I picchi dimensionali sono staggered: armonia al ~min 28, densità al ~min 33, ritmo al ~min 38 — mai simultanei
- [x] **MARC-03**: La struttura false-resolution è presente: calo completo della percussione per 8 bar al ~min 35, seguito da reintroduzione a densità superiore
- [ ] **MARC-04**: La suite regge 45-60 minuti senza collasso compositivo o monotonia

### Composizione — Layer Ritmico (RITM)

- [x] **RITM-01**: Un hi-hat continuity thread persiste attraverso tutte le transizioni — non si interrompe mai durante la performance
- [x] **RITM-02**: L'arco ritmico segue: texture arhitmica (0-10min) → pulse emergente irregolare (10-20min) → groove cristallizzato (20-30min) → climax poliritmica (30-40min) → dissoluzione (40-60min)
- [x] **RITM-03**: Additive rhythm (Glass): densità ritmica costruita per aggiunta di un elemento alla volta, senza rompere il metro
- [x] **RITM-04**: Reich phasing: due layer con pattern identici a lunghezze step prime driftano in e fuori fase

### Composizione — Layer Armonico (HARM)

- [ ] **HARM-01**: Tutti i layer condividono un root anchor (A o D) — incompatibilità cromatica eliminata strutturalmente
- [ ] **HARM-02**: Modal interchange sopra il drone root: il modo cambia carattere emotivo senza spostare la radice
- [ ] **HARM-03**: Upper-structure voicings (Floating Points): basso CH3 tene il root/quinta, accordo superiore diverso in CH2 un nono sopra
- [ ] **HARM-04**: Voice leading constraint: nessuna voce si sposta di più di 3 semitoni tra un accordo e il successivo
- [ ] **HARM-05**: Pentatonica + nota cromatica con probabilità 10-15% e risoluzione verso il basso (Four Tet)

### Composizione — Layer Melodico + Texture (MELO)

- [x] **MELO-01**: Il MelodyLayer genera linee melodiche evolute con memoria motivica — un motif introdotto all'inizio riappare trasformato verso la fine
- [x] **MELO-02**: Il TextureLayer implementa loop a lunghezza prima (7, 11, 13 step) che non si allineano mai — poliritmo perpetuo senza randomness (Eno)
- [x] **MELO-03**: Un drone root è sempre presente durante le fasi arhitmiche e di dissoluzione

### MIDI Output (MIDI)

- [x] **MIDI-01**: Velocity humanization per canale correlata alla posizione ritmica: downbeat leggermente più forte, offbeat leggermente più morbido (variazione ±5-10%)
- [x] **MIDI-02**: Pitch range enforcement per canale: CH1 modulare (C2-C4), CH2 pads (C3-C5), CH3 basso (C1-C3), CH4 melodico (C4-C7), CH5 texture (qualsiasi)
- [x] **MIDI-03**: Phrase shape modeling: legato/staccato ratio configurabile per voce; note di accordo sfasate di 5-30ms per evitare attacchi simultanei meccanici
- [x] **MIDI-04**: Multi-channel routing ottimizzato per tipo strumento: CH1 modulare, CH2 pads hardware, CH3 basso hardware, CH4 melodico VST, CH5 texture VST, CH9/10 percussioni

### Visivo (VISL)

- [x] **VISL-01**: Il sistema visivo segue l'arco narrativo: sparse/freddo in apertura, denso/caldo al climax, dissoluzione finale — non lo stato del singolo engine
- [x] **VISL-02**: Ogni layer compositivo ha una firma visiva distinta e leggibile dal palco: forma, colore, moto diversi per ritmo/armonia/melodia/texture

## v2 Requirements

### Espressività MIDI Avanzata

- **CC-01**: CC automation per macro dinamiche: CC7 volume, CC11 expression (seguono la curva dell'arco)
- **CC-02**: CC1 Mod Wheel output per synth hardware (vibrato/filter automation)
- **CC-03**: MIDI Program Change inviato 2-4 bar prima delle transizioni di atto per cambi preset automatici
- **CC-04**: CC74 filter cutoff per VST (sweep automatici)

### Differenziatori Compositivi

- **DIFF-01**: Harmonic memory store — il sistema traccia cosa ha suonato per consentire callback e inversioni
- **DIFF-02**: HUD performer con warning next-cue (flash 5 secondi prima delle transizioni maggiori)
- **DIFF-03**: Arc position indicator visivo — un elemento sottile che comunisce la posizione nel timeline senza essere un progress bar

## Out of Scope

| Feature | Motivo |
|---------|--------|
| Ritmo frammentato aggressivo (Objekt/Arca) | Incompatibile con interpretazione live su synth e con l'arco narrativo coerente |
| Reactive audio input | By design one-way: AI compone, umano interpreta. Feedback loop non voluto. |
| Per-note particle emission (visivo 1:1) | Crea rumore visivo, non musica visiva. Usare perturbazioni del campo invece. |
| Picchi dimensionali simultanei | Causa documentata del collasso al minuto 24 in v2. Anti-feature. |
| npm/bundler dependencies | Vincolo esplicito PROJECT.md — zero-build ES modules per affidabilità live |
| UI di controllo parametri complessa | Sistema self-navigating; il performer non regola parametri durante la performance |

## Traceability

| Requisito | Fase | Stato |
|-----------|------|-------|
| MIGR-01 | Fase 0 | Complete |
| MIGR-02 | Fase 0 | Complete |
| INFR-01 | Fase 0 | Complete |
| INFR-02 | Fase 0 | Complete |
| INFR-03 | Fase 0 | Complete |
| MARC-01 | Fase 1 | Complete |
| MARC-02 | Fase 1 | Complete |
| MARC-03 | Fase 1 | Complete |
| MARC-04 | Fase 4 | Pending |
| RITM-01 | Fase 2 | Complete |
| RITM-02 | Fase 2 | Complete |
| RITM-03 | Fase 2 | Complete |
| RITM-04 | Fase 2 | Complete |
| HARM-01 | Fase 1 | Pending |
| HARM-02 | Fase 1 | Pending |
| HARM-03 | Fase 1 | Pending |
| HARM-04 | Fase 1 | Pending |
| HARM-05 | Fase 1 | Pending |
| MELO-01 | Fase 3 | Complete |
| MELO-02 | Fase 3 | Complete |
| MELO-03 | Fase 3 | Complete |
| MIDI-01 | Fase 2 | Complete |
| MIDI-02 | Fase 2 | Complete |
| MIDI-03 | Fase 2 | Complete |
| MIDI-04 | Fase 2 | Complete |
| VISL-01 | Fase 4 | Complete |
| VISL-02 | Fase 4 | Complete |

**Coverage:**
- v1 requirements: 27 totali
- Mappati a fasi: 27
- Non mappati: 0 ✓

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after roadmap creation (ROADMAP.md — 5 phases, 27/27 requirements mapped)*
