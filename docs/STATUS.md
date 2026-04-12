# STATUS — MACH:INE III

> Snapshot vivo. Rigenerato a fine sessione. Punto di entrata di ogni nuova sessione.
> **Last updated:** 2026-04-12 (sessione 8: decisione campo definitivo, bozze 7 biomi)

## Decisione strategica (sessione 8)

**Campo Materiale = paradigma visivo definitivo** (DECISIONS #015).
Sistema Geometrico (geo.js) = archiviato come reference, non sviluppato.
Comp-* classiche = fallback di emergenza (default, nessun toggle).

Toggle runtime: **Shift+C** (campo ON), **Shift+G** (geo ON, reference only).

---

## Versione

**v3.4.2** — single source: `src/VERSION.js` (`APP_VERSION`)

Tag git: `v3.4.2` su `ccbbb13`.
Branch attivo: `machine-iii`.

---

## Architettura attiva

**Pattern:** Band con Direttore (Path B confermato — `DECISIONS.md #004`)

```
director3.js      →  5 moduli musicali (rhythm, harmony, bass, melody, texture)
                  →  Campo Materiale (campo.js + biomi.js) — PARADIGMA DEFINITIVO
                     Toggle: Shift+C. 32×32 Float32Array per ruolo, Bayer halftone,
                     decay + shimmer. Solo SOLCO calibrato, altri 6 = GENERIC.
                  →  [reference] geo.js — Sistema Geometrico (Shift+G, non sviluppato)
                  →  [fallback] comp-* classiche (default, nessun toggle)
                  →  firma.js (gesti narrativi: gelo/convergenza/vuotoTotale/densityCap)
                  →  world-state.js (stato condiviso musica↔visual)
                  →  tracks.js (7 tracce con modeHint)
```

---

## Stato biomi nel Campo Materiale

| Bioma | Stato | Prossimo |
|---|---|---|
| SOLCO | ✅ calibrato ma palette da riscaldare | fix palette (verde-oliva → terracotta/arancio per moodboard Dub Cosmico) |
| NEBBIA | ⚠️ placeholder GENERIC | bozza pronta: voice=punti isolati, drone=campo uniforme, chord=velatura |
| TESSUTO | ⚠️ placeholder GENERIC | bozza pronta: chord=righe staccato (telaio), lead=punti alti, kick=impulso |
| RESPIRO | ⚠️ placeholder GENERIC | bozza pronta: INVERTITO (campo pieno, note sottraggono = pori) |
| MACCHINA | ⚠️ placeholder GENERIC | bozza pronta: snap a griglia, blocchi on/off, arp=linee scorrevoli |
| TEMPESTA | ⚠️ placeholder GENERIC | bozza pronta: massima densità, shimmer alto, tutti i ruoli sovrapposti |
| RITORNO | ⚠️ placeholder GENERIC | bozza pronta: preserveOnSwitch (eredita sedimento), voice=NEBBIA, arp muore |

**Bozze complete:** sessione 8 output, incrocio moodboard Pinterest × MOOD.md. Pronte per implementazione meccanica in `biomi.js`.

---

## Principio canvas-space (sessione 8)

**Problema**: `pitchToCell` mappa MIDI 0-127 globalmente → ogni ruolo occupa 19-22% del campo.
**Fix**: mapping LOCALE del registro per ruolo. Implementare `localPitchToCell(note, lo, hi)` in `campo.js`.
**Regola**: drone riempie TUTTO il campo. Nessuna zona sistematicamente vuota.

---

## Documenti di riferimento (sessione 8)

- `docs/MOOD.md` — ritratto musicale 7 tracce (essenza emotiva + strumenti + arco + narrativa)
- `docs/VISUAL-SPEC.md` — contratto geometrico (reference per geo.js, non per campo)
- `ispirazioni-machne/visioni.md` — 6 visioni poetiche (mappate alle 7 tracce)
- `ispirazioni-machne/per-brano.md` — ispirazioni Pinterest per bioma
- `ispirazioni-machne/visione-totale.md` — il perché di tutto

---

## Limiti noti

- **Firma `gelo`** nel campo: non cablata (decay continua anche con gelo ON)
- **Firma `convergenza`** nel campo: non cablata
- **Firma `vuotoTotale`**: funziona (early-out in render.js)
- **6/7 biomi = GENERIC placeholder** nel campo
- **SOLCO palette troppo fredda/verde** rispetto al moodboard Dub Cosmico

---

## Prossimo (priorità top→bottom)

### P0 — Implementare i 7 biomi nel Campo Materiale

Bozze pronte dalla sessione 8. Ordine:
1. Fix palette SOLCO (riscaldare: verde-oliva → terracotta/arancio)
2. NEBBIA (campo rarefatto, voice punti isolati, drone uniforme)
3. TESSUTO (righe staccato = telaio, lead sostituisce voice)
4. RESPIRO (campo pieno invertito, note sottraggono)
5. MACCHINA (snap griglia, blocchi on/off, arp linee)
6. TEMPESTA (massima densità, shimmer alto)
7. RITORNO (preserveOnSwitch, voice=NEBBIA, arp muore)

### P0b — localPitchToCell

Implementare mapping registro locale in `campo.js`. Ogni ruolo mappa il
suo registro attivo all'80% del campo Y. Drone riempie tutto.

### P1 — Firma nel campo

- gelo: freeze decay (shimmer continua ma campo non decade)
- convergenza: attrazione celle verso centro
- densityCap: gate probabilistico su feedNote (già parzialmente cablato)

### P2 — RITORNO preserveOnSwitch

Al cambio traccia verso RITORNO, NON resettare il campo. Il sedimento
dei biomi precedenti è il punto ("i fantasmi delle forme").

### P3 — Sedimento inter-traccia

Strategia per accumulare memoria tra tracce:
- opzione A: decay ruoli rallentato (palimpsesto implicito)
- opzione B: `_sharedResidual` separato con half-life ~38s

### P4 — Camera narrativa

`worldState.camera.focusZone` + drift verso punto massima densità.
RITORNO: zoom-out progressivo 1.0→0.6.

---

## Stato runtime (ultimo check: 2026-04-12)

| Verifica | Stato |
|---|---|
| Sistema Geometrico (geo.js) | ✅ funzionante (ARC+RECT, NEBBIA+SOLCO) — non sviluppato |
| Campo Materiale (campo.js) | ✅ funzionante, solo SOLCO calibrato |
| Comp-* classiche | ✅ funzionanti (default, fallback) |
| Pannello debug (D) | ✅ aggiornato con paradigma, firma, comandi |
| HUD barra stato | ✅ mostra [GEO]/[CAMPO]/[COMP] |
| Toggle Shift+C / Shift+G | ✅ mutuamente esclusivi |
| health-check.sh | ✅ verde (pre-sessione 8, da riverificare) |

---

## File pesanti da tenere d'occhio (>500 LOC)

```
1077  src/config.js     ← OK, single source dei numeri
 618  src/tracks.js     ← OK, 7 tracce × multi-fase
 521  src/director3.js  ← valutare split: scheduler vs density vs phases
 503  src/melody-v3.js  ← valutare split A/B/C
 ~380 src/geo.js        ← reference only, non in sviluppo
```

---
<!-- knowledge-graph links -->
[[DECISIONS]] [[WORKLOG]] [[01-ARCHITECTURE]] [[MOOD]] [[VISUAL-SPEC]]
