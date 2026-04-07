# Phase 1: MacroComposer e HarmonyLayer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 01-macrocomposer-e-harmonylayer
**Areas discussed:** Arc 4D, Integrazione V3_MODE, Transizioni modali, Voicings CH2/CH4

---

## Arc 4D — Timeline narrativa

**Q:** La timeline narrativa è precomposta (lookup table in config) o probabilistica con vincoli?

**Options presented:**
- Statica precomposta — array di checkpoint, interpolazione deterministica
- Probabilistica con vincoli — generativa, più organica ma meno controllabile
- Ibrida — macro fissa, micro generativa

**Selected:** Ibrida (proposta di Claude, approvata dal performer)

**Notes:** Il performer ha esplicitamente delegato la scelta a Claude richiedendo "il massimo delle potenzialità dell'AI". Claude ha proposto l'ibrido ispirato al modello Philip Glass: struttura rigida dell'arco (checkpoint precomposti), variazione microgenerativa ±5-10% con EMA dentro ogni segmento.

---

## Integrazione V3_MODE

**Q:** MacroComposer rimpiazza sequencer.js o coesiste? Come si fa il gating?

**Options presented:**
- Sostituzione — MacroComposer rimpiazza sequencer.js
- Coesistenza per routing — moduli aggiuntivi, routing condizionato da V3_MODE in main.js
- Estensione — sequencer.js esteso con logica v3

**Selected:** Coesistenza per routing (proposta di Claude, approvata)

**Notes:** Rollback immediato via flip V3_MODE: false. Composer*.js rimangono intatti come reference sonora. sequencer.js sopravvive per struttura atti.

---

## Transizioni modali

**Q:** Il cambio di modo è snap istantaneo, graduale lungo, o pivot di 1 bar?

**Options presented:**
- Snap istantaneo al bar boundary
- Fade lungo (4-8 bar con crossfade graduale)
- Pivot di 1 bar — convergenza verso nota condivisa tra i due modi

**Selected:** Pivot di 1 bar (proposta di Claude, approvata)

**Notes:** Voice leading ≤3 semitoni (HARM-04) soddisfatto naturalmente. La finestra di 1 bar è abbastanza corta da non sembrare una "sezione di transizione" ma abbastanza lunga da essere musicalmente intenzionale.

---

## Voicings CH2/CH4

**Q:** Tabelle manuali (come CHORD_PROGS* in v2) vs algoritmo da regole HARM-03/04/05?

**Options presented:**
- Tabelle manuali complete — come CHORD_PROGS* in v2, ogni voicing esplicito
- Algoritmo puro da regole HARM — generazione completa, potenzialmente imprevedibile
- Mix — anchors manuali per momenti chiave + algoritmo per variazione

**Selected:** Mix anchors + algoritmo (proposta di Claude, approvata)

**Notes:** 3-4 anchor voicings per modo (apertura, pivot, picco) scritti esplicitamente in config. Algoritmo genera il resto rispettando HARM-01/02/03/04/05. Evita sia la rigidità delle lookup table pure che l'imprevedibilità del puro algoritmo.

---

*Discussed: 2026-03-27*
*Format: automated session (performer delegated all decisions to Claude)*
