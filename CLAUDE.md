# CLAUDE.md — MACH:INE III

## Progetto
**MACH:INE III** — sistema generativo live per performance di collaborazione umano-AI.
L'AI compone in tempo reale una suite continua di 45-60 minuti; il musicista interpreta
i segnali MIDI generati su synth modulare, hardware e VST.

Non è un visualizer: la musica è l'ambiente, la macchina propone, il performer interpreta.

## Versione
**v3.4.2** — single source of truth: `src/VERSION.js` (`APP_VERSION`).

## Stack
- JavaScript ES modules nativi (zero dipendenze, zero build)
- Canvas 2D API
- Web Audio API (stereo via BlackHole / getDisplayMedia)
- WebMIDI API + Web Worker clock 24ppqn
- Server: `python3 -m http.server 8282`

## Comandi
```bash
./launch.sh                  # avvia server porta 8282 e apre browser
python3 -m http.server 8282  # alternativa manuale
```
Niente build step, niente npm, niente bundler. Apri http://localhost:8282 su Chrome/Edge.

## Struttura repo (post-FASE 2)
```
app/
├── index.html              # entry point
├── projector.html          # proiezione secondaria
├── src/                    # solo moduli VIVI (vedi docs/01-ARCHITECTURE.md)
│   ├── VERSION.js          # APP_VERSION (single source)
│   ├── main.js             # boot + game loop
│   ├── config.js           # CFG (tutti i numeri)
│   ├── director3.js        # regista (track/phase/density)
│   ├── world-state.js      # stato condiviso
│   ├── firma.js            # gesti narrativi (gelo/convergenza/vuoto/densityCap)
│   ├── rhythm/harmony/bass(/v2/v3)/melody(/v2/v3)/texture.js
│   ├── comp-{griglia,liminale,linee,negativo,quadrati,treno}.js
│   └── audio, midi, dna, generations, colors, field, render, state, tracks, ...
├── docs/                   # documentazione viva (00–06)
├── archive/                # tutto ciò che non gira ma serve come memoria
│   ├── code/dead-islands/  # 14 moduli morti (sequencer, director, midi-patterns, ...)
│   ├── code/versions/      # snapshot HTML/JS storici
│   ├── docs/old/           # 19+ md storici + CHANGELOG-pre-v3.4.2
│   ├── analysis/           # session JSON dump
│   ├── midi-exports/       # .mid storici
│   └── sandbox/            # designer/test/sandbox HTML
├── .planning-archive/      # GSD phases 00-04 (V3 Layer System mai costruito, fossile)
└── scripts/                # snapshot.sh, health-check.sh
```

## Protocollo sessione — workflow management

**START sessione (sempre, prima di qualsiasi altra cosa):**
1. Leggi `docs/STATUS.md` → snapshot vivo (versione, moduli attivi, prossimi step P0-P4)
2. Leggi l'ultima entry di `docs/WORKLOG.md` → cosa è successo l'ultima volta
3. Conferma con utente: "ripartiamo da [P0 di STATUS]?" o chiedi cosa fare

**DURANTE la sessione:**
- Decisione architetturale o di processo non banale → append in `docs/DECISIONS.md` con numero progressivo
- Nuovo task scoperto → annota nel "Prossimo" di `STATUS.md` (P3/P4) o in linea con la priorità
- Mai modificare entry passate di `WORKLOG.md` o `DECISIONS.md` (append-only)

**END sessione:**
1. Append nuova entry in `WORKLOG.md` (data, obiettivo, fatto, file toccati, decisioni #, prossimo)
2. Rigenera `STATUS.md` (versione, stato runtime, riprioritizza "Prossimo", aggiorna `Last updated`)
3. Commit unico: `wm: session log YYYY-MM-DD` (wm = workflow management)

## Docs di riferimento — leggi PRIMA di lavorare

**Operativi (live, aggiornati ogni sessione):**
- `docs/STATUS.md` — **PUNTO DI ENTRATA** — snapshot vivo, prossimi step
- `docs/WORKLOG.md` — diario append-only sessioni passate
- `docs/DECISIONS.md` — ADR-light, perché abbiamo scelto X

**Riferimento (statici, raramente aggiornati):**
- `docs/00-VISION.md` — vision e principi non negoziabili
- `docs/01-ARCHITECTURE.md` — pattern Band con Direttore, file map, aree protette
- `docs/02-MUSIC.md` — 7 tracce, 5 fasi, modal characteristic, regola potenze di 2
- `docs/03-VISUAL.md` — DNA, halftone Bayer, comp-*, firma, camera
- `docs/04-RULES.md` — versioning, commit, code style, working mode
- `docs/05-ROADMAP.md` — visione strategica milestone (non backlog operativo: quello vive in STATUS)
- `docs/06-AGENTS.md` — skill mapping, routing subagenti, anti-pattern

## Skill specializzate (`.claude/skills/`)
Le skill contengono conoscenza profonda + script utility. Leggi `SKILL.md` prima di lavorare.

| Skill                       | Trigger                                                                                     |
|-----------------------------|---------------------------------------------------------------------------------------------|
| `composition-depth`         | composizione, armonia, accordi, battute, struttura, form, progressione                      |
| `visual-directing`          | visuals, rendering, scene, camera, primitivi, colore                                        |
| `audiovisual-dramaturgy`    | connessione musica-visuale, sinestesia, mapping, coerenza, redesign bioma, risposta visiva, nome traccia + contesto visivo |
| `runtime-expert`            | performance, fps, frame drop, latenza, memory, GC, Canvas, Audio, MIDI                      |
| `agent-orchestrator`        | task >2 file o >3 step                                                                      |
| `production-team`           | tavola rotonda, review, critica, valuta, qualità, pronto per live                           |

Routing completo in `docs/06-AGENTS.md`.

## Regole ferree
- Piccoli edit sicuri. Mai riscritture monolitiche.
- No logica duplicata. No magic numbers → tutto in `src/config.js`.
- **Source code** (variabili, funzioni, commenti tecnici): inglese.
- **Docs progetto**: italiano.
- **Commenti compositivi/sonori** dentro source: italiano.
- Commit: `vX.Y.Z: descrizione` o `categoria: descrizione` + aggiornare `CHANGELOG.md`.
- Snapshot in `archive/code/versions/` prima di modifiche grosse a `index.html`.

## Aree protette — chiedere PRIMA di toccare
- `main.js` / `render.js` / `director3.js` (relazioni tra loro)
- Audio: history buffer, onset detection in `audio.js`
- Narrativa: arco narrativo → arco visivo, **rupture (4 stadi)**, climax
- Camera: logica legata all'arco narrativo

## Rupture — sempre 4 stadi
1. **Omen** (presagio)
2. **Infiltration** (infiltrazione)
3. **Takeover** (presa di controllo)
4. **Residue** (residuo)

**Mai semplificare. Mai saltare.**

## Working mode
Per ogni task non banale:
1. Identifica file coinvolti.
2. Piano breve → approvazione (se non è esplicitamente "vai").
3. Implementa il diff più piccolo possibile.
4. Report: file cambiati, regole verificate, rischi.

## GSD workflow
Prima di Edit/Write fuori da task triviali, entra in un workflow GSD per mantenere
artefatti di pianificazione e contesto allineati. Vedi `docs/06-AGENTS.md`.

## Anti-pattern noti
- `entities.splice(i,1)` in loop → O(n). Usare `ObjectPool` + swap-and-pop.
- 3× `map()` + spread per frame in blend scene → pre-allocare buffer.
- `Math.random()` non seedabile → `SeededRNG` da `perf-utils.js`.
- `.filter()` per conteggio → loop con contatore.

## Lingua
Risposte all'utente in **italiano**, terse e dirette, senza preamboli o riassunti
di cose appena fatte.
