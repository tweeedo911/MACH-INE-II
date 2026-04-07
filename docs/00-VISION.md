# 00 — VISION

**MACH:INE III** — Sistema generativo live per performance di collaborazione umano-AI.
L'AI compone in tempo reale una suite continua di 45-60 minuti; il musicista interpreta
i segnali MIDI generati su synth modulare, hardware e VST.

Simultaneamente: **concerto live** + **album generativo**.

## Core value

L'AI è il **compositore**, non un visualizer.
Genera musica abbastanza ricca, coerente e memorabile da reggere una performance live di 60 minuti
con arco narrativo completo. Il visivo è linguaggio sonoro reso in immagine, non decorazione.

## Principi non negoziabili

1. **Zero dipendenze, zero build** — ES modules nativi, compatibilità live garantita.
2. **60fps + MIDI clock Worker** — nessuna regressione di latenza.
3. **WebMIDI hardware out** — Chrome/Edge, no fallback simulati.
4. **Rupture sempre 4 stadi** — omen → infiltrazione → takeover → residuo. Mai semplificare.
5. **Glitch = sottrazione di grammatica**, non accumulo di effetti.
6. **Config-first** — tutti i numeri in `src/config.js` (CFG). Nessun magic number.
7. **Italiano per documentazione, inglese per codice.**

## Vision storica

Per il contesto pre-v3 (visione album IDM, palette graphic-design, tracce v5),
vedi `archive/docs/old/VISION-V4.md` e `archive/docs/old/DESIGN-V5.md`.

Per l'evoluzione e la diagnosi che ha portato alla "tabula rasa" v3,
vedi `archive/docs/old/RESEARCH-V4-COMPOSITIONAL-DIRECTION.md`
e `archive/docs/old/RESEARCH-V4-VISUAL-DIRECTION.md`.
