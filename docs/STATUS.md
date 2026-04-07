# STATUS — MACH:INE III

> Snapshot vivo. Rigenerato a fine sessione. Punto di entrata di ogni nuova sessione.
> **Last updated:** 2026-04-07 (debiti tecnici — doc fix, CH7 arp, ghost/fossil overlay)

## ⚠️ Limiti noti (post A.2)

- **Firma `gelo` / `convergenza` non hanno effetto visibile.** Motivo: le
  comp-* renderizzano solo trail freschi (< 2 frame), non esistono ancora
  fossil/ghost persistenti su cui la firma possa agire. Il cablaggio è a
  posto (`field.js`, `event-register.js`) ma non ha target visivi. Si
  risolve naturalmente in **Fase A.3/A.4** quando le comp-* consumeranno
  i `LifecycleEvent` persistenti.
- **Firma `vuotoTotale` (V) funziona** perché ha early-out in `render.js`.

### Elementi che DEVONO reagire a firma (da cablare in A.3/A.4)

| Firma | Target elementi | Come reagiscono |
|---|---|---|
| **gelo** (G) | `LifecycleEvent[]` (stable/ghost/fossil), ghost layer canvas, fossil layer canvas, sediment offscreen, onsetWaves residui | Freeze età (`e.age` non avanza), freeze decay sediment, freeze transizione stati newborn→stable→ghost→fossil. Il frame resta "cristallizzato" finché gelo è attivo. |
| **convergenza** (J) | Tutte le posizioni normalizzate `nx/ny` degli eventi in **tutti i layer** (FG/MG/Overlay) + position bias nelle comp-* al momento di spawn | Attrazione verso (0.5, 0.5) a rate `dt * 0.3`. Deve essere visibile come implosione graduale della composizione. Richiede che comp-* leggano `event.nx/ny` per decidere dove disegnare (non calcolino da `n.note` come adesso). |
| **vuotoTotale** (V) | Già OK in `render.js` | Blackout totale + MIDI all-notes-off. |
| **densityCap** (auto) | Gate su `onMidiNote`/`onAudioOnset` + birth rate interno dei comp-* | Moltiplicatore probabilistico 0..1. Usato da `setOpeningRamp` / `setClosingFade`. Cablato già in render.js. |

---

## Versione

**v3.4.2** — single source: `src/VERSION.js` (`APP_VERSION`)

Tag git: `v3.4.2` su `ccbbb13`.
HEAD: `16abb8e` (Visual Bible Fase A.4 — tutte le 6 comp migrate).
Branch attivo: `machine-iii` (14 commit avanti su `origin/machine-iii`, mai pushato).

---

## Architettura attiva

**Pattern:** Band con Direttore (Path B confermato — vedi `DECISIONS.md #004`)

```
director3.js      →  5 moduli musicali (rhythm, harmony, bass, melody, texture)
                  →  6 composizioni visive (comp-griglia/liminale/linee/negativo/quadrati/treno)
                  →  firma.js (gesti narrativi: gelo/convergenza/vuotoTotale/densityCap)
                  →  world-state.js (stato condiviso musica↔visual)
                  →  tracks.js (7 tracce con modeHint)

event-register.js →  LifecycleEvent store unificato (newborn→stable→ghost→fossil)
                  →  CH_ROLE map + ROLE_LIFECYCLE per ruolo (kick/perc/drone/bass/
                     chord/voice/lead/arp) — Bible §16.1

layers.js         →  4 layer canonici stackati (BG/MG/FG/Overlay) — Bible §5
                  →  infrastruttura pronta, consumata da A.4 comp-* migrate
```

**Moduli:** 32 vivi in `src/` (2 archiviati in A.2: `dna.js`, `generations.js`),
16 totali in `archive/code/dead-islands/`.

**A/B/C framework:** flag `CFG.MUSIC_EXPERIMENT` / `CFG.MUSIC_STRUCTURAL` in `config.js` selezionano variante hard-switch (no crossfade).

---

## Stato runtime (ultimo check: 2026-04-07)

| Verifica | Stato |
|---|---|
| `health-check.sh` (import, magic numbers, file size) | ✅ verde |
| HTTP smoke test (`/`, `/src/main.js`, `/src/VERSION.js`) | ✅ 200 |
| `launch.sh` banner versione dinamico | ✅ legge `VERSION.js` |
| firma reattivata + wired (G/J/V live) | ✅ |
| char-note boost armonico (modal characteristic) | ✅ wired in `harmony.js` |
| Test runtime live (utente, ascolto) | ✅ confermato funzionante |

---

## File pesanti da tenere d'occhio (>500 LOC)

```
1077  src/config.js     ← OK, è la single source dei numeri (per design)
 618  src/tracks.js     ← OK, 7 tracce × multi-fase
 521  src/director3.js  ← valutare split: scheduler vs density vs phases
 503  src/melody-v3.js  ← valutare split A/B/C in moduli condivisi
```

---

## Prossimo (priorità top→bottom)

### P0 — Visual System Bible Fase A.4 ✅ COMPLETA
Tutte le 6 comp migrate al layer stack 4-canonico (commit `16abb8e`).
**✅ Testato live 2026-04-07 — comportamento identico all'originale su tutte le tracce.**

| Comp | BG | MG | FG | OVERLAY | Sediment |
|---|---|---|---|---|---|
| negativo | ✓ | shadow (fresh) | buchi (cam) | memoria buchi | OVERLAY |
| liminale | ✓ | zones (fresh) | dots (cam) | trails α×0.6 | OVERLAY |
| griglia | ✓ | afterglow (persist) | celle (cam) | — | MG |
| linee | ✓ | noise (fresh) | linee (cam) | — | privato (screen) |
| quadrati | ✓ | breath (fresh) | blocchi+arp (cam) | sediment α0.5 | OVERLAY |
| treno | ✓ | breath (fresh) | oggetti (cam) | — | privato (frame-cap) |

### P1 — Visual System Bible Fase B / C
3. ✅ **Rupture 4 stadi — Fase B completa** — tutte le 6 comp-* migrate da
   `isRottura` (bool) a `rupture.intensity` (0→1 smooth). **Test live necessario.**
4. ✅ **Memoria inter-traccia** — `_sharedSediment` decay 0.9997/frame (half-life ~38s),
   deposito continuo per-frame (palimpsesto). Parametri in `CFG.VISUAL.sediment`.
5. ✅ **trackPalettes Bible §12** → `worldState.palette`. Colori live: accettati.
6. ✅ **Crossfade transizioni** — 3s ease-in-out cubico (era hard cut). `CFG.VISUAL.trackFadeDuration`.
7. ✅ **Micro-glitch ritmo-gated** — solo quando `rhythmicity > 0.4`, raro. `CFG.VISUAL.glitch`.

### P2 — ✅ COMPLETATO
8. ✅ **Enrich comp-quadrati** — breathing 3×, rhythm density boost, arp sediment.
9. ✅ **Enrich comp-negativo** — breathing Bayer MG, bass holes in densita, closeSpeed per-buco.
10. ✅ **Zone Bayer coerenti con density** — `density.X` come floor dinamico in tutte le 6 comp.
11. ✅ **Glitch layer meno è più** — da 5 a 4 modi, tutti sottrattivi.

### P3 — debiti tecnici
1. Test live completo: rupture Fase B gradualità, sediment palimpsesto, crossfade 3s, glitch ritmico, enrich comp-*
2. ✅ **Fix doc** — `03-VISUAL.md` mapping comp↔traccia corretto
3. ✅ **Fix CH7=arp** — `comp-quadrati.js` (era CH6 primario, ora CH7)
4. ✅ **Ghost/fossil overlay** — `field.js` consuma event-register, sblocca firma gelo/convergenza
5. **Calibrazione ghost/fossil** — test live, aggiustare densità/blend in `CFG.VISUAL.ghostOverlay`
6. Push 14+ commit + apertura PR verso `main`
7. Refactor `director3.js` (521 LOC): split scheduler/density/phases
8. Refactor `melody-v3.js` (503 LOC): estrarre logica comune A/B/C
9. Profilo CPU su Chrome DevTools: target costante 60fps su 60min

### P4 — esperimenti / esplorazione
13. RITM-05 break ciclico kick+basso (130 LOC in `archive/.../rhythm-layer.js`) — solo se servono respiri ritmici
14. Crossfade smooth A→B→C via `presence-multiplier` (in `archive/.../presence-multiplier.js`) — solo se hard-switch dà fastidio in live

---

## Aree protette (chiedere PRIMA di toccare)

- `main.js` / `render.js` / `director3.js` — relazioni intricate
- `audio.js` — history buffer, onset detection
- Narrativa: arco narrativo → arco visivo, **rupture (4 stadi: omen→infiltration→takeover→residue)**
- Camera logic legata all'arco

---

## Riferimenti rapidi

| Per sapere... | Leggi... |
|---|---|
| Cosa è successo nelle sessioni passate | `docs/WORKLOG.md` |
| Perché abbiamo scelto X | `docs/DECISIONS.md` |
| Vision / principi non negoziabili | `docs/00-VISION.md` |
| Architettura, file map, anti-pattern | `docs/01-ARCHITECTURE.md` |
| Teoria musicale, modi, fasi | `docs/02-MUSIC.md` |
| Sistema visivo, DNA, comp | `docs/03-VISUAL.md` |
| Regole (versioning, commit, style) | `docs/04-RULES.md` |
| Roadmap strategica (milestone) | `docs/05-ROADMAP.md` |
| Routing skill / agenti | `docs/06-AGENTS.md` |
| Gap artistici + strategia prossima milestone | `docs/07-ARTISTIC-GAPS.md` |
| Comportamenti morti riusabili | `SALVAGE.md` (in root) |
