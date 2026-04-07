# Phase 3: MelodyLayer e TextureLayer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-03-27
**Phase:** 03-melodylayer-e-texturelayer

---

## Q&A Log

### Selezione aree da discutere
- **Q:** Quali aree vuoi discutere per Phase 3?
- **A:** Tutte e quattro: Estetica sonora, Memoria motivica, Un file o due, Drone root

---

### Area: Estetica Sonora

**Q:** Che carattere ha CH5 (VOICE)?
**Options:** Gocce melodiche / Linee continue / Arpeggi sull'accordo
**A:** Gocce melodiche — frasi brevi di 2-4 note, sparse, con pause. Come in v2.

**Q:** Che ruolo ha CH6 (LEAD)?
**Options:** Canon di CH5 / Voce indipendente / Ruolo texture/glitch
**A:** Voce indipendente — CH6 genera la propria melodia indipendente da CH5.

**Q:** CH3 (BASS) in Phase 3 — che ruolo ha nei loop texture?
**Options:** Linea di basso melodica / Pedale ritmico / Drone bass nelle fasi lente
**A:** Linea di basso melodica — sequenze melodiche su root/quinta.

**Q:** Riferimenti estetici per le voci melodiche?
**Options:** Aphex Twin / Arca / Arvo Pärt / Lascia decidere a Claude
**A (freeform):** "mi piacciono tutti i riferimenti, anche arpeggi incrociati con lente variazioni in qualche parte per stratificare. vorrei che ci fosse il giusto fraseggio per ogni parte ma tendendo al minimalismo"

---

### Area: Memoria Motivica

**Q:** Come funziona il ritorno motivico (MELO-01)?
**Options:** Seed esplicito + trasformazioni / Markov chain evolutiva / Ibrido seed + Markov
**A:** Seed esplicito — CH5 genera e memorizza un motivo 3-4 note nei primi 5 minuti.

**Q:** Quali trasformazioni del motivo vuoi nel ritorno?
**Options:** Trasposizione / Inversione / Augmentation / Retrograde (multiSelect)
**A:** Solo Trasposizione.

**Q:** Come viene triggerato il ritorno?
**Options:** Automatico a soglia d'arco / Multipli ritorni graduali
**A:** Automatico a arcPercent > 0.75 (~min45).

---

### Area: Un file o due

**Q:** Come organizziamo il codice di Phase 3?
**Options:** Un file unico / Due file separati
**A:** Un file unico — `melody-texture-layer.js`.

---

### Area: Drone Root

**Q:** MELO-03: chi gestisce il drone durante le fasi arhitmiche?
**Options:** HarmonyLayer basta / Phase 3 aggiunge drone su CH5 / CH3 scende a nota pedal
**A:** HarmonyLayer (Phase 1) basta — MELO-03 coperto da CH2.

---

*Logged: 2026-03-27*
