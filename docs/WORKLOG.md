# WORKLOG — MACH:INE III

> Append-only journal. Una entry per sessione. Più recente in cima.
> **Regola d'oro:** mai modificare entry passate. Se serve correggere, append nuova entry.
> **Format:** data + obiettivo + fatto + file + decisioni + prossimo.

---

## 2026-04-07 — FASE 0→5 ristrutturazione totale

**Versione fine sessione:** v3.4.2
**Tag:** `pre-restructure-2026-04-07`, `v3.3.0` (retroattivo), `v3.4.0-wip` (retroattivo), `v3.4.2`
**Commit:** 8 nuovi su `machine-iii` (da `6148835` a `ccbbb13`)

### Obiettivo
Riorganizzare il progetto: archiviare versioni vecchie, riconciliare versioning incoerente (header dicevano v5.0.0/v4.0.0/v2.8.0 ma commit usavano v3-music/v3-visual), pulire `src/` da moduli morti, consolidare 25+ md root in `docs/00-06`, mai perdere nulla.

### Diagnosi iniziale
- 3 radici parallele: `/MACH-INE II/`, `MACH:INE II/`, `MACH:INE III/` (orfana)
- 2 repo Git annidati: outer per `.planning/` GSD, inner per il codice — non parlavano
- src/ inquinata: 45 file (alive 30 + dead 15)
- 4 roadmap coesistenti, nessuna fonte di verità
- `test.mov` 365MB nel repo
- GSD phases 00-04 descrivevano un'architettura (V3 Layer System) **mai costruita**: il codice ha preso una strada diversa (Band con Direttore)

### Fatto

**FASE 0 — Safety net**
- Backup esterno: `~/Backups/MACHINE-II-2026-04-07/` (404MB)
- Tag `pre-restructure-2026-04-07` su entrambi i repo
- `test.mov` → `~/Media/MACHINE/test-2026-03-23.mov`
- `.gitignore` esteso (`.mov`, `.als`, `.mp4`, `.wav`, frame PNG, `.superpowers/`)
- Commit `014cf8c` v3.4.0-wip: visual enrichment + structural docs (9 file modified + 10 nuovi md)
- Tag retroattivi: `v3.3.0` su `6148835`, `v3.4.0-wip` su `014cf8c`

**FASE 0.5 — Merge repo Git** (opzione C: cancellare outer .git)
- Storia GSD outer (50 commit) esportata in `.planning-archive/GSD-history.txt`
- `.planning/` snapshotted in `.planning-archive/planning-snapshot/`
- Outer `.git` cancellato → repo unico nel folder interno
- Commit `fbd9ce1`: import GSD planning history

**FASE 1 — Salvage isole morte**
- 16 file morti identificati in 3 isole isolate (V3 Layer System, Designer, orfani)
- Diff comparativi: solo 2 portati (modal char note boost da `harmony-layer`, `firma` da `sequencer`)
- Estratto `src/firma.js` (~90 LOC standalone)
- Aggiunto `CFG.modeCharacteristicInterval` in `config.js`
- Aggiunto `_modeCharacteristicBoost()` in `harmony.js` (+15 vel su intervallo distintivo del modo)
- Aggiunto `modeHint` a tutte e 7 le tracce in `tracks.js`
- Commit `59359fd`: salvage critici

**v3.4.2 — firma reattivata**
- Scoperta: `generations.js` aveva la logica `firma.gelo`/`firma.convergenza` ma con fake locale (`v3: firma removed`)
- Fix 1 riga: import vero da `firma.js` → riattiva tutto il sistema freeze/attract
- Wired `firma.densityCap` come moltiplicatore birth rate
- Wired `firma.vuotoTotale` in `render.js` con early-out blackout
- Keybindings live: `G` (gelo), `J` (convergenza), `V` (vuotoTotale)
- Commit `f34ef81`: firma reattivata

**FASE 2 — Ristrutturazione directory**
- Rinominato `MACH:INE II/` → `app/` (path senza `:` né spazi)
- Creato `archive/` con sottodirectory: `code/{dead-islands,versions,legacy-*}/`, `docs/old/`, `analysis/`, `midi-exports/`, `sandbox/`
- 14 moduli morti → `archive/code/dead-islands/`
- 89 snapshot in `versions/` → `archive/code/versions/`
- 19 md storici + CHANGELOG vecchio (826 righe) → `archive/docs/old/`
- Sandbox HTML (designer, test, sandbox), `.docx`, `.csv`, `ruflo.yaml` → `archive/sandbox/`
- `analisi machine ii/`, `composer/`, `new/`, `feedback e idee/`, `midi/` → archive
- Creato `src/VERSION.js` (single source `APP_VERSION`)
- Allineati header `main.js` / `config.js` a `VERSION.js`
- Riscritto `CHANGELOG.md` con storia reale (v2.9.4 → v3.0.0 → v3.4.2)
- Riscritto `CLAUDE.md` con nuova struttura
- Creati `docs/00-VISION.md` … `docs/06-AGENTS.md` (7 doc snelli, consolidamento da 19+ md)
- Creati `scripts/snapshot.sh` + `scripts/health-check.sh`
- Commit `97f1a62`: FASE 2 ristrutturazione directory completa

**FASE 5 — Verifica + cleanup parent dir**
- Health check verde: import OK, niente sospetti verso `archive/`
- HTTP smoke test: `/`, `/src/main.js`, `/src/VERSION.js` → 200
- Parent dir `/MACH-INE II/` ripulito: `MACH:INE III/`, `MACHINE PREV Project/`, `agent-orchestrator/`, `creative-critic-review.html`, vecchio `CLAUDE.md`, `agent-orchestration-guide.md` → `archive/parent-dir-residue/`
- `.als` esclusi via gitignore (3.7MB preservati su disco, non in git)
- `launch.sh`: banner versione letto dinamicamente da `VERSION.js`, nuovi keybinding G/J/V documentati
- Test runtime live: utente conferma "funziona"
- Commit `ccbbb13`: FASE 5 verifica + cleanup parent dir + launcher refresh
- Tag `v3.4.2` su HEAD

**Workflow management** (questa stessa entry)
- Creato `docs/STATUS.md` (snapshot vivo, rigenerato a fine sessione)
- Creato `docs/WORKLOG.md` (questo file, append-only)
- Creato `docs/DECISIONS.md` (ADR-light)
- Aggiornato `CLAUDE.md` con protocollo sessione
- Commit `wm: bootstrap workflow management`

### File toccati
- **Nuovi:** `src/firma.js`, `src/VERSION.js`, `docs/{00-VISION,01-ARCHITECTURE,02-MUSIC,03-VISUAL,04-RULES,05-ROADMAP,06-AGENTS,STATUS,WORKLOG,DECISIONS}.md`, `scripts/{snapshot,health-check}.sh`, `SALVAGE.md`
- **Modificati:** `config.js` (+modeCharacteristicInterval), `harmony.js` (+boost), `tracks.js` (+modeHint), `generations.js` (firma import + densityCap), `render.js` (firma early-out + keybindings), `main.js` (header), `launch.sh`, `CLAUDE.md`, `CHANGELOG.md`, `.gitignore`
- **Spostati:** ~140 file in `archive/`

### Decisioni prese
Vedi `DECISIONS.md` #001 → #008.

### Prossima sessione — punto di ripartenza
1. Decidere se pushare gli 8 commit + tag `v3.4.2` su `origin/machine-iii` e aprire PR
2. Iniziare P1: tuning composizioni (vedi `STATUS.md` Prossimo → P1)
3. Verificare al primo problema che il workflow STATUS/WORKLOG/DECISIONS regga davvero
