# Roadmap: MACH:INE II v3

## Overview

Riscrittura brownfield: i 7 engine compositivi monolitici di v2 vengono sostituiti da 4 layer compositivi simultanei governati da un MacroComposer. L'infrastruttura esistente (WebMIDI, Web Audio, Canvas, ES modules, dual-thread rAF+Worker) resta intatta. Il percorso segue l'ordine delle dipendenze: infrastruttura prima, poi fondamenta armoniche, poi ritmo, poi melodia/texture, infine integrazione completa per la performance live.

## Phases

- [x] **Phase 0: Infrastruttura e Migrazione** - Archivia v2, correggi bug critici di timing e MIDI prima di qualsiasi lavoro compositivo (completed 2026-03-27)
- [x] **Phase 1: MacroComposer e HarmonyLayer** - Fondamenta compositive: arco narrativo 4D e stato armonico condiviso (completed 2026-03-27)
- [x] **Phase 2: RhythmLayer e MIDI Output** - Arco ritmico completo con phasing Reich e output MIDI ottimizzato per strumento (completed 2026-03-27)
- [x] **Phase 3: MelodyLayer e TextureLayer** - Voci melodiche con memoria motivica e texture poliritmica perpetua (completed 2026-03-27)
- [x] **Phase 4: Integrazione e Visual System** - Suite continua 45-60 minuti verificata, visual system sincronizzato all'arco narrativo (completed 2026-03-27)

## Phase Details

### Phase 0: Infrastruttura e Migrazione
**Goal**: Il codebase v2 è preservato e i bug critici di timing/MIDI sono eliminati prima che inizi qualsiasi lavoro compositivo
**Depends on**: Nothing (first phase)
**Requirements**: MIGR-01, MIGR-02, INFR-01, INFR-02, INFR-03
**Success Criteria** (what must be TRUE):
  1. Il branch git `v2-archive` esiste e contiene il codice v2 intatto; main è pulito per il lavoro v3
  2. Il flag `CFG.V3_MODE` in config.js permette di switchare tra v2 e v3 senza toccare altri file
  3. Il MIDI clock Worker non produce stutter misurabile durante picchi di GC sul main thread (verificabile con MIDI monitor)
  4. Le transizioni BPM non producono snap bruschi — il BPM lerpa su almeno 2 battute
  5. Nessun burst MIDI all'attraversamento di una transizione di sezione (canali silenziosi, non full-velocity)
**Plans**: 4 plans

Plans:
- [x] 00-01-PLAN.md — Git archive v2-archive + CFG.V3_MODE flag
- [x] 00-02-PLAN.md — CLOCK_LOOKAHEAD 50ms → 100ms (GC stutter fix)
- [x] 00-03-PLAN.md — BPM lerp su 2 battute (snap fix)
- [x] 00-04-PLAN.md — sendMIDIAllNotesOff alle transizioni di sezione (burst fix)

### Phase 1: MacroComposer e HarmonyLayer
**Goal**: Un MacroComposer governa un arco narrativo 4D precomposto e HarmonyLayer emette il primo MIDI v3 armonicamente coerente su CH2/CH4
**Depends on**: Phase 0
**Requirements**: MARC-01, MARC-02, MARC-03, HARM-01, HARM-02, HARM-03, HARM-04, HARM-05
**Success Criteria** (what must be TRUE):
  1. Su un monitor MIDI, 40 minuti di arc mostrano le transizioni modali corrette (A Lydian → Bb Phrygian → D Dorian → C# Dorian → E Phrygian → A Lydian) senza cambio di radice brusco
  2. I picchi delle 4 dimensioni (harmonicColor ~min28, density ~min33, rhythmicDensity ~min38) non coincidono mai nello stesso momento
  3. Al ~min35 la percussione cala a zero per 8 bar e poi rientra a densità superiore (false-resolution verificabile su MIDI monitor)
  4. Il voice leading non produce mai salti superiori a 3 semitoni tra accordi consecutivi su CH4
  5. Il drone root (A o D) rimane sempre presente su CH2 come ancora armonica condivisa
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — CFG.MACRO config e MacroComposer state machine 4D
- [x] 01-02-PLAN.md — HarmonyLayer MIDI output CH2/CH4 e V3_MODE routing in main.js

### Phase 2: RhythmLayer e MIDI Output
**Goal**: L'arco ritmico completo — da silenzio arhitmico a climax poliritmica a dissoluzione — è udibile su CH0/CH1/CH7 con output MIDI ottimizzato per ogni strumento
**Depends on**: Phase 1
**Requirements**: RITM-01, RITM-02, RITM-03, RITM-04, MIDI-01, MIDI-02, MIDI-03, MIDI-04
**Success Criteria** (what must be TRUE):
  1. Su CH0 (PULSE) il MIDI monitor mostra l'arco completo: silenzio 0-10min → pulse sporadico 10-20min → groove stabile 20-30min → poliritmia 30-40min → dissoluzione 40-60min
  2. Un hi-hat thread continuo su CH1 (GRAIN) non si interrompe mai durante l'intera performance, nemmeno alle transizioni di sezione
  3. Due layer ritmici con pattern a lunghezza prima (es. 12/13 step) driftano visibilmente in e fuori fase sul MIDI monitor nel corso di 2-3 minuti (phasing Reich)
  4. Le note inviate a CH1 (modulare C2-C4), CH2 (pads C3-C5), CH3 (basso C1-C3), CH4 (melodico C4-C7) non escono mai dal range assegnato
  5. Le velocity di downbeat sono sistematicamente +5-10% rispetto agli offbeat sullo stesso canale (umanizzazione misurabile)
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — CFG.RHYTHM configuration block in config.js
- [x] 02-02-PLAN.md — rhythm-layer.js modulo completo (CH0 kick + CH1 hi-hat phasing + CH7 percussion Glass)
- [x] 02-03-PLAN.md — V3_MODE routing per RhythmLayer in main.js

### Phase 3: MelodyLayer e TextureLayer
**Goal**: Le voci melodiche e testurali completano il quadro compositivo: motivi con memoria che ritornano trasformati, texture poliritmica perpetua e drone root durante le fasi arhitmiche
**Depends on**: Phase 1 (harmonyLayer.activeChord)
**Requirements**: MELO-01, MELO-02, MELO-03
**Success Criteria** (what must be TRUE):
  1. Un motivo melodico introdotto nei primi 5 minuti riappare riconoscibile ma trasformato (trasposizione, inversione o augmentation) negli ultimi 15 minuti della performance
  2. Su CH3/CH5/CH6 i loop texture a lunghezze prime (7, 11, 13 step) non si allineano mai in un'ora di performance — nessun ciclo ripetuto identico
  3. Durante le fasi arhitmiche (0-10min) e di dissoluzione (40-60min) un drone root riconoscibile è sempre presente su almeno un canale
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — CFG.MELODY configuration block in config.js
- [x] 03-02-PLAN.md — melody-texture-layer.js modulo completo (CH3 bass + CH5 voice seed + CH6 lead indipendente)
- [x] 03-03-PLAN.md — V3_MODE routing per MelodyTextureLayer in main.js

### Phase 4: Integrazione e Visual System
**Goal**: La suite 45-60 minuti regge senza collasso compositivo, il visual system riflette l'arco narrativo completo con firme visive distinte per layer
**Depends on**: Phase 3
**Requirements**: MARC-04, VISL-01, VISL-02
**Success Criteria** (what must be TRUE):
  1. Una run completa da 0 a 60 minuti non produce collasso compositivo, monotonia o stutter — la performance regge per intero
  2. Il sistema visivo in apertura è sparse/freddo (particelle rade, colori freddi), al climax è denso/caldo, alla fine dissolve gradualmente — l'arco visivo è riconoscibile senza guardare il MIDI
  3. Un osservatore dal palco riesce a distinguere quale layer sta dominando (ritmo, armonia, melodia, texture) dalla firma visiva — forma, colore e moto sono chiaramente differenti
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — CFG.VISUAL config block in config.js (LAYER_PREFS + 5 atti visivi)
- [ ] 04-02-PLAN.md — director.js V3 gate: LAYER_PREFS, dominance logic, 5-act visual arc
- [ ] 04-03-PLAN.md — Integration checklist MARC-04: debug helper window._m + 5 checkpoint arcPercent

## Progress

**Execution Order:**
Phases execute in numeric order: 0 → 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Infrastruttura e Migrazione | 4/4 | Complete   | 2026-03-27 |
| 1. MacroComposer e HarmonyLayer | 0/2 | Planned | - |
| 2. RhythmLayer e MIDI Output | 3/3 | Complete   | 2026-03-27 |
| 3. MelodyLayer e TextureLayer | 2/3 | In Progress|  |
| 4. Integrazione e Visual System | 1/3 | In Progress|  |
