# CLAUDE.md

## Progetto
MACH:INE II — sistema di co-composizione ricorsiva per performance audiovisive dal vivo.
Non è un visualizer: la musica è l'ambiente, la macchina propone, il performer interpreta.

## Stack
- JavaScript ES modules nativi (zero dipendenze, zero build)
- Canvas 2D API
- Web Audio API (stereo via BlackHole)
- WebMIDI API + Web Worker clock
- Server: `python3 -m http.server 8282`

## Comandi
```bash
./launch.sh              # avvia server porta 8282
python3 -m http.server 8282  # alternativa manuale
```
Non c'è build step, npm, o bundler. Per testare: apri http://localhost:8282 su Chrome/Edge.

## Struttura src/
- main.js — boot, wiring, game loop
- config.js — CFG: tutti i parametri numerici centralizzati
- audio.js — analisi audio stereo realtime
- midi.js — MIDI I/O + Clock 24ppqn
- midi-patterns.js — mapping visivo per canale e motore
- state.js — stato narrativo derivato dall'audio (5 valori)
- dna.js — DNA sessione, 8 primitivi, zone Voronoi
- generations.js — entità, ciclo vita, spatial hash grid
- colors.js — sistema cromatico A/B/C, climax, palette per motore
- director.js — regista: scene, arco narrativo, mutazioni, camera
- director-events.js — event bus del regista
- field.js — campo halftone Bayer 8x8, onset waves, MIDI columns
- render.js — orchestratore render + HUD
- presence-multiplier.js — presenza multi-motore (0→1 per engine)
- sequencer.js — concerto autonomo 5 atti
- composer.js/2/3/4/5/6/7 — 7 motori compositivi MIDI

## Docs di riferimento
Leggi PRIMA di lavorare su aree specifiche:
- DESIGN.md — estetica, architettura visiva, routing audio/MIDI
- ENGINES_SPEC.md — identità musicale/visiva dei 7 motori
- RULES.md — versioning, commit, flusso di lavoro, aree protette
- ROADMAP.md — stato attuale e prossimi step

## Skill specializzate (.claude/skills/)
Le skill contengono conoscenza profonda e strumenti. Leggi la SKILL.md appropriata PRIMA di lavorare.

### composition-depth
Esperto compositivo per musica elettronica sperimentale. Scale, progressioni, tensione armonica,
voicing, ritmo, variazioni, struttura formale. Contiene:
- references/structural-form.md — **Regola potenze di 2**: tutte le lunghezze (progressioni, sezioni)
  devono essere 2/4/8/16/32 battute. Diagnosi dei problemi attuali (TERRENO densità 24 bar, CRISTALLO 24 bar).
- scripts/composition-utils.js — funzioni importabili: isPowerOf2, validateProgression, phrasedPresence, ecc.
- **Triggera con:** composizione, armonia, accordi, battute, struttura, form, progressione

### visual-directing
Regista visivo e grafico. Tecniche grafiche (feedback, noise, reaction-diffusion), tecniche
registiche (composizione, camera emotiva, montaggio), profili visivi per engine. Contiene:
- references/graphic-techniques.md — halftone modulato, feedback, noise, primitivi come vocabolario
- references/directing-techniques.md — composizione, camera, montaggio, scene come personaggi
- references/engine-visual-profiles.md — 7 engine × profilo visivo con gap analysis
- scripts/visual-utils.js — 25+ funzioni: noise, feedback, camera, color, glitch
- **Triggera con:** visuals, rendering, scene, composizione visiva, camera, primitivi, colore

### runtime-expert
Esperto tecnico massimo dell'ambiente runtime. Canvas 2D, Web Audio, WebMIDI, ES modules,
game loop 60fps. Performance reali, limiti browser, anti-pattern, tecnologie frontier. Contiene:
- references/canvas2d-performance.md — draw call batching, ImageData, OffscreenCanvas
- references/webaudio-analysis.md — AnalyserNode, AudioWorklet, costi computazionali
- references/webmidi-patterns.md — latenza, bandwidth, clock sync, hot-plugging
- references/es-modules-patterns.md — zero-build patterns, circular deps, cache busting
- references/gameloop-timing.md — rAF, delta time, frame budget, background throttling
- references/browser-pitfalls.md — GC, memory leaks, V8 quirks, debugging
- references/frontier-tech.md — WebGPU, AudioWorklet+SAB, Scheduler API, WASM SIMD, Wake Lock
- scripts/perf-utils.js — ObjectPool, FrameTimer, ColorCache, SeededRNG, RingBuffer, WakeLockManager
- **Triggera con:** performance, fps, frame drop, latenza, memory, GC, Canvas, Web Audio, MIDI

### agent-orchestrator
Sistema di delegazione a subagenti specializzati per task complessi. Vedi sezione dedicata sotto.

## Regole ferree
- Piccoli edit sicuri. Mai riscritture monolitiche.
- No logica duplicata. No magic numbers → tutto in config.js.
- Codice e commenti tecnici in inglese.
- Documentazione progetto in italiano.
- Commit: `vX.Y.Z: descrizione breve` + aggiornare CHANGELOG.md.
- Snapshot obbligatorio in versions/ prima di modifiche a index.html.

## Aree protette — chiedere PRIMA di toccare
- main.js / render.js / director.js (relazioni tra loro)
- Audio: history buffer, onset detection
- Narrativa: arco narrativo → arco visivo, rupture (4 stadi obbligatori), climax
- Camera: logica legata all'arco narrativo

## Rupture — sempre 4 stadi
1. Omen (presagio)
2. Infiltration (infiltrazione)
3. Takeover (presa di controllo)
4. Residue (residuo)
Mai semplificare, mai saltare stadi.

## Working mode
Per ogni task non banale:
1. Identifica file coinvolti
2. Piano breve → approvazione
3. Implementa il diff più piccolo possibile
4. Report: file cambiati, check regole, rischi

## Orchestrazione agenti
Per task complessi (nuova feature, debug cross-file, refactoring), usa la skill agent-orchestrator.
Regola: se tocca più di 2 file o richiede più di 3 step → delega a subagenti.
I subagenti DEVONO ricevere le regole del progetto (aree protette, config.js, no magic numbers).

### Skill routing per subagenti
Quando un subagente lavora su un'area specifica, DEVE leggere la skill corrispondente:
- **Composizione musicale** → composition-depth/SKILL.md (armonia, struttura, variazioni)
- **Visuals/rendering** → visual-directing/SKILL.md (grafica, regia, scene, camera)
- **Performance/runtime** → runtime-expert/SKILL.md (fps, GC, Canvas, Audio, MIDI)
- **Struttura formale** → composition-depth/references/structural-form.md (potenze di 2)
- **Problemi "impossibili"** → runtime-expert/references/frontier-tech.md (WebGPU, Workers, WASM)

### Anti-pattern noti (da runtime-expert)
- `entities.splice(i,1)` in loop → O(n). Usare ObjectPool + swap-and-pop.
- 3× `map()` + object spread per frame in blend scene → pre-allocare buffer.
- 164× `Math.random()` non seedable → SeededRNG da perf-utils.js.
- `.filter()` per conteggio → loop con contatore.
