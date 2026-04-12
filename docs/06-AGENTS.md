# 06 — AGENTS

Mappatura ruoli, skill e trigger per il lavoro agentico su MACH:INE III.

## Skill specializzate (`.claude/skills/`)

Le skill contengono conoscenza profonda + script utility. Leggi la SKILL.md prima di lavorare nell'area.

### composition-depth
Esperto compositivo per musica elettronica sperimentale.
- `references/structural-form.md` — regola potenze di 2
- `scripts/composition-utils.js` — `isPowerOf2`, `validateProgression`, `phrasedPresence`
- **Trigger:** composizione, armonia, accordi, battute, struttura, form, progressione

### visual-directing
Regista visivo + tecniche grafiche.
- `references/graphic-techniques.md` — halftone modulato, feedback, noise
- `references/directing-techniques.md` — composizione, camera, montaggio
- `references/engine-visual-profiles.md` — profili per traccia + gap analysis
- `scripts/visual-utils.js` — 25+ funzioni: noise, feedback, camera, color, glitch
- **Trigger:** visuals, rendering, scene, camera, primitivi, colore

### runtime-expert
Esperto runtime: Canvas 2D, Web Audio, WebMIDI, ES modules, game loop 60fps.
- `references/canvas2d-performance.md`, `webaudio-analysis.md`, `webmidi-patterns.md`,
  `es-modules-patterns.md`, `gameloop-timing.md`, `browser-pitfalls.md`, `frontier-tech.md`
- `scripts/perf-utils.js` — `ObjectPool`, `FrameTimer`, `ColorCache`, `SeededRNG`, `WakeLockManager`
- **Trigger:** performance, fps, frame drop, latenza, memory, GC, Canvas, Web Audio, MIDI

### agent-orchestrator
Delegazione a subagenti specializzati per task >2 file o >3 step.

### production-team
7 ruoli creativi: Compositore, Producer, Performer, Regista Visivo, Critico, Tecnico, Direttore Artistico.
Workflow: tavola rotonda, review motore, review sessione, design sprint, pre-flight check.
- **Trigger:** team, tavola rotonda, review, critica, valuta, qualità, pronto per live

## Comandi GSD

Per task pianificati, usa i comandi `/gsd:*`. Vedi le skill nel toolset (gsd-quick, gsd-debug,
gsd-execute-phase, gsd-plan-phase, ecc.).

- `/gsd:quick` — fix piccoli, doc updates, ad-hoc
- `/gsd:debug` — investigazione bug
- `/gsd:execute-phase` — lavoro di fase pianificato

Non fare edit diretti fuori da un workflow GSD a meno che l'utente non chieda esplicitamente di bypassare.

## Routing per subagenti

Quando un subagente lavora su un'area, **deve leggere la skill corrispondente**:

| Area                          | Skill                                                             |
|-------------------------------|-------------------------------------------------------------------|
| Composizione musicale         | `composition-depth/SKILL.md`                                     |
| Visuals / rendering           | `visual-directing/SKILL.md`                                      |
| Performance / runtime         | `runtime-expert/SKILL.md`                                        |
| Struttura formale (potenze 2) | `composition-depth/references/structural-form.md`                |
| Problemi "impossibili"        | `runtime-expert/references/frontier-tech.md`                     |

## Anti-pattern noti (da runtime-expert)

- `entities.splice(i,1)` in loop → O(n). Usare `ObjectPool` + swap-and-pop.
- 3× `map()` + spread per frame in blend scene → pre-allocare buffer.
- 164× `Math.random()` non seedabile → `SeededRNG`.
- `.filter()` per conteggio → loop con contatore.

## Memoria persistente

- `~/.claude/memory/recent-memory.md` — caricata inline a ogni sessione
- `~/.claude/memory/long-term-memory.md`, `project-memory.md`
- `~/.claude/projects/-Users-Edo-1-MACH-INE-II-MACH-INE-II/memory/` — memoria specifica progetto

Dopo decisioni significative o feature nuove: aggiornare i file di memoria direttamente,
non attendere il consolidate cron.

---
<!-- knowledge-graph links -->
[[01-ARCHITECTURE]] [[04-RULES]] [[STATUS]] [[DECISIONS]]
