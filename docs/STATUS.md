# STATUS — MACH:INE III

> Snapshot vivo. Rigenerato a fine sessione. Punto di entrata di ogni nuova sessione.
> **Last updated:** 2026-04-07 (sessione Visual Bible Fase A.4 — comp-negativo layer stack)

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
HEAD: `b4fa11f` (Visual Bible Fase A.4 — comp-negativo migrato).
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

### P0 — Visual System Bible Fase A.4 (in corso)
1. ✅ **`comp-negativo` (RESPIRO) migrato** — layer stack 4-canonico (commit `b4fa11f`).
   **Da testare live prima di procedere.**
2. **Seconda comp** — candidata `comp-liminale` (NEBBIA / RITORNO).
   Stessa procedura: test live → commit atomico (Bible §15.2).
3. Poi estendere alle 4 comp rimanenti, una per sessione.

### P1 — Visual System Bible Fase B / C (post A.4)
3. Implementare **rupture 4 stadi** (Omen→Infiltration→Takeover→Residue)
   come stato del director3 con envelope temporale, non flag binario.
4. **Memoria inter-traccia** più esplicita — aumentare durata di
   `_sharedSediment` in `field.js` a valori minuti invece di secondi.
5. Integrare `trackPalettes` (Bible §12) nel sistema colori lerp di
   `colors.js` — oggi solo dichiarate in config, nessuno le legge.

### P2 — debiti tecnici differiti
6. Push 14 commit + apertura PR verso `main` (dopo A.4 primi checkpoint).
7. Refactor `director3.js` (521 LOC): split scheduler/density/phases.
8. Refactor `melody-v3.js` (503 LOC): estrarre logica comune A/B/C.
9. Profilo CPU su Chrome DevTools: target costante 60fps su 60min.

### P2 — alta priorità visiva
6. Ricaricare enrich di `comp-quadrati` e `comp-negativo` (breathing, sediment, holes)
7. Verificare zone Bayer crescenti coerenti con `worldState.density`
8. Glitch layer: ridurre layer, aumentare sottrazione (regola "meno è più")

### P3 — debiti tecnici
9. Refactor `director3.js` (521 LOC): split scheduler/density/phases
10. Refactor `melody-v3.js` (503 LOC): estrarre logica comune A/B/C
11. Profilo CPU su Chrome DevTools: target costante 60fps su 60min
12. `scripts/snapshot.sh` — usarlo prima di edit invasivi a `index.html`/`render.js`

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
| Comportamenti morti riusabili | `SALVAGE.md` (in root) |
