# MACH:INE II v3

## What This Is

Sistema generativo live per performance di collaborazione umano-AI: l'AI compone in tempo reale una suite continua di 45-60 minuti, il musicista interpreta i segnali MIDI generati su synth modulare, hardware e VST. Il progetto è simultaneamente un concerto live e un album generativo.

## Core Value

L'AI è il compositore — genera musica abbastanza ricca, coerente e memorabile da reggere una performance live di 60 minuti con arco narrativo completo.

## Requirements

### Validated

- ✓ Sistema visivo a campo particelle sincronizzato con MIDI — existing
- ✓ Architettura zero-dipendenze (ES modules nativi, zero bundler) — existing
- ✓ Dual-thread execution: rAF loop + MIDI clock Web Worker — existing
- ✓ Output MIDI hardware via WebMIDI API — existing
- ✓ Proiettore secondario via BroadcastChannel — existing
- ✓ Config centralizzata (CFG object in config.js) — existing

### Active

- [ ] Archiviazione v2 su branch git separato prima di ogni modifica
- [x] MacroComposer 4D state machine — arco narrativo precomposto 45min con picchi staggered e false-resolution — Phase 1
- [x] HarmonyLayer MIDI output — drone CH2 persistente, accordi CH4 voice leading ≤3 semitoni, cromatismo Four Tet 12% — Phase 1
- [x] V3_MODE routing in main.js — switch tra composer v2 e sistema v3 senza regressioni — Phase 1
- [x] Sistema compositivo stratificato: macro-compositore + 3-4 layer sovrapposti (ritmo, armonia, melodia, texture) — Phase 1-3
- [x] Arco ritmico narrativo: texture arhitmica → pulse emergente (Reich) → groove cristallizzato (Four Tet/Floating Points) → climax poliritmica → dissoluzione (Eno) — Phase 2
- [x] MelodyTextureLayer: tre voci melodiche indipendenti (CH3 bass, CH5 voice, CH6 lead) con clock prime 7/11/13, seed motivico, cross-arpeggio D-05 — Phase 3
- [ ] Linguaggio armonico ricco: modalità, jazz harmony, voice leading evoluto — ispirato a Floating Points, Four Tet, Glass
- [ ] Pattern evolutivi minimali con phasing e trasformazione graduale (Steve Reich, Philip Glass)
- [ ] Output MIDI multi-canale ottimizzato per synth modulare, hardware e VST (velocity curves, articolazioni, range dinamici per strumento)
- [ ] Visual system migliorato: arco visivo sincronizzato all'arco narrativo (sparse/freddo→denso/caldo→dissoluzione)
- [ ] Firme visive distinte per layer musicale (forme, colori, velocità diverse per ritmo/armonia/melodia/texture)
- [ ] Suite continua 45-60 minuti con transizioni fluide e struttura in atti

### Out of Scope

- Ritmo frammentato aggressivo (Objekt) — incompatibile con l'interpretazione live su synth e con l'arco narrativo coerente
- Reactive to live audio input — l'umano interpreta il MIDI, non lo influenza in tempo reale
- Dipendenze npm/bundler — mantenere architettura zero-build per semplicità live
- UI complessa — controlli minimali, il sistema deve girare autonomamente

## Context

### Progetto precedente (v2)
MACH:INE II v2.9.0 aveva 7 motori compositivi sequenziali (DERIVA, TERRENO, MECCANICA, VORTICE, CRISTALLO, ABISSO, SOLCO) strutturati in 5 atti da ~50 minuti. Ogni motore aveva una modalità e BPM fissi. Il sistema visivo (field.js, render.js) genera un campo particelle reattivo al MIDI. Punti di forza confermati: stile visivo, interazione audio-video, infrastruttura tecnica robusta. Archiviato su branch git separato.

### Ambiente tecnico
- Browser: Chrome/Edge (ES modules nativi, WebMIDI, BroadcastChannel)
- Server: `python3 -m http.server 8282`
- Runtime: dual-thread (rAF 60fps + Web Worker MIDI clock ~2ms)
- Strumenti del performer: synth modulare Eurorack, synth hardware (Prophet/Moog/Juno), VST in DAW

### Riferimenti musicali
- **Steve Reich / Philip Glass**: pattern evolutivi, phasing, minimalismo additivo
- **Four Tet / Floating Points**: armonia calda, jazz harmony, broken beats con groove
- **Brian Eno**: texture arhitmica, ambient, dissoluzione

## Constraints

- **Tech stack**: ES modules nativi, zero bundler, zero npm — compatibilità live garantita
- **Performance**: 60fps rAF + MIDI clock Worker — nessuna regressione latenza
- **Compatibilità**: WebMIDI API su Chrome/Edge, hardware MIDI out
- **Architettura**: mantenere separazione render loop / MIDI clock Worker

## Key Decisions

| Decisione | Motivazione | Esito |
|-----------|-------------|-------|
| Archiviare v2 su branch separato prima di rifare | Preservare il lavoro fatto senza rischio | — Pending |
| Sistema stratificato al posto di 7 motori sequenziali | Layer sovrapposti dialogano meglio, più organico per suite continua | — Pending |
| Ritmo come arco narrativo (non elemento fisso) | Compatibile con interpretazione live e con arco emotivo tension→climax→risoluzione | — Pending |
| Mantenere visual system esistente con miglioramenti | È un punto di forza confermato dal progetto v2 | — Pending |
| Firme visive per layer (non per motore) | Coerente con architettura stratificata nuova | — Pending |

## Evolution

Questo documento evolve ad ogni transizione di fase e milestone.

**Dopo ogni fase** (via `/gsd:transition`):
1. Requirements invalidati? → Sposta in Out of Scope con motivo
2. Requirements validati? → Sposta in Validated con riferimento fase
3. Nuovi requirements emersi? → Aggiungi in Active
4. Decisioni da registrare? → Aggiungi in Key Decisions
5. "What This Is" ancora accurato? → Aggiorna se drifted

**Dopo ogni milestone** (via `/gsd:complete-milestone`):
1. Review completa di tutte le sezioni
2. Core Value check — ancora la priorità giusta?
3. Audit Out of Scope — motivazioni ancora valide?

---
*Last updated: 2026-03-27 after Phase 03 — MelodyTextureLayer v3 complete*
