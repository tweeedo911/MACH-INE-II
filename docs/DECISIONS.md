# DECISIONS — MACH:INE III

> ADR-light. Append-only. Una scelta architetturale o di processo = una entry.
> **Quando usare:** ogni volta che facciamo una scelta che, fra 3 mesi, qualcuno (anche io stesso) potrebbe chiedersi "ma perché?".
> **Format:** numero, titolo, data, contesto, scelta, alternative scartate, conseguenze.

---

## #001 — Cancellare outer .git, repo Git unico

**Data:** 2026-04-07
**Contesto:** Due repo Git annidati: outer in `/MACH-INE II/.git` traccia solo `.planning/` (workspace GSD, 50 commit), inner in `/MACH-INE II/MACH:INE II/.git` è il vero repo del codice. Mai parlavano. L'outer interpretava la cartella interna come opaca.
**Scelta:** Opzione C — cancellare outer `.git`, esportare la sua history in `.planning-archive/GSD-history.txt`, copiare `.planning/` in `.planning-archive/planning-snapshot/` come archivio.
**Alternative scartate:**
- A. Subtree merge dei due repo → unica history ma perde separazione, complesso
- B. Submodule → mantiene separazione ma aggiunge attrito permanente
**Conseguenze:**
- ✅ Repo singolo, history pulita
- ✅ Storia GSD preservata in chiaro come export
- ⚠️ Persi i 50 commit GSD come oggetti git (ma erano solo planning markdown, non codice)

---

## #002 — Versioning reconcile retroattivo

**Data:** 2026-04-07
**Contesto:** Disallineamento totale: `config.js` diceva v5.0.0, `main.js` v4.0.0, CLAUDE.md v2.8.0, ma i commit usavano `v3-music`/`v3-visual`. Nessuna verità unica.
**Scelta:** Versioning retroattivo basato sulla verità dei commit:
- `v2.9.4` ← era erroneamente "v5.0.0" (era un mix hotfix sopra v2.9.3)
- `v3.0.0` ← nascita architettura "Band con Direttore" (commit `iii: world-state.js`)
- `v3.3.0` ← `6148835` (ultimo commit pre-restructure, A/B/C framework)
- `v3.4.0-wip` ← visual enrichment + structural docs
- `v3.4.1` ← salvage critici da isole morte
- `v3.4.2` ← firma reattivata + ristrutturazione completa
**Alternative scartate:**
- Mantenere v5.0.0 e bumpare → falsava la storia
- Bump major a v4.0.0 → non riflette il salto reale (Band con Direttore = v3.x birth)
**Conseguenze:**
- ✅ Single source `src/VERSION.js` (`APP_VERSION`)
- ✅ Tag git allineati alla storia
- ✅ CHANGELOG riscritto coerente

---

## #003 — Path B (Band con Direttore) confermato vs Path A (V3 Layer System)

**Data:** 2026-04-07 (decisione retroattiva, mai esplicitata prima)
**Contesto:** GSD phases 00-04 pianificavano un'architettura V3_MODE come *layer additivi sopra* i 7 motori esistenti. Il codice ha invece preso una strada diversa (commit `iii:`): tabula rasa, sostituzione totale dei 7 motori con `director3` + 5 moduli. Le due strade non sono state mai riconciliate.
**Scelta:** Riconoscere ufficialmente che Path B (Band con Direttore) è l'architettura attuale e definitiva. Path A è "strada non presa", archiviata come fossile metodologico.
**Alternative scartate:**
- Riportare Path A ed eliminare Path B → buttare ~3 settimane di lavoro committato
- Tenere entrambe in parallelo → schizofrenia architetturale
**Conseguenze:**
- ✅ `.planning-archive/` conserva Path A come "rejected"
- ✅ `01-ARCHITECTURE.md` documenta Path B come unica verità
- ⚠️ I 7 motori vecchi (`composer.js`...`composer7.js`) erano già stati cancellati nei commit `iii:` — CLAUDE.md li citava ancora ma era obsoleto

---

## #004 — firma come modulo standalone (non più dentro sequencer)

**Data:** 2026-04-07
**Contesto:** Il vecchio `sequencer.js` (isola morta) conteneva il sistema `firma` (gelo/convergenza/vuotoTotale/densityCap) come stato interno. La logica di rendering relativa esisteva ancora in `generations.js` ma con un fake locale `const firma = {gelo:false,convergenza:false}` con commento `v3: firma removed`.
**Scelta:** Estrarre `firma` in `src/firma.js` come modulo standalone con API pulita (`setFirma`, `pulseFirma`, `startSilenceBreath`, `updateFirma`, `setOpeningRamp`, `setClosingFade`). Riattivare l'import in `generations.js`.
**Alternative scartate:**
- Lasciare morta → perdita totale di feature visiva potente già esistente
- Reintegrare dentro `director3.js` → accoppiamento pesante, viola SRP
**Conseguenze:**
- ✅ 1 import cambiato → riattivati gelo + convergenza in `generations.js` gratis
- ✅ `vuotoTotale` wired in `render.js` con early-out
- ✅ `densityCap` wired come moltiplicatore birth rate + envelope opening/closing
- ✅ Keybindings live G/J/V testati funzionanti

---

## #005 — Modal characteristic note boost via mappa generica

**Data:** 2026-04-07
**Contesto:** `harmony-layer.js` (isola morta) aveva un boost di velocity sulle note che cadono sull'intervallo distintivo del modo corrente (es: dorian → 6a maggiore, lydian → #4). `harmony.js` non aveva questa feature.
**Scelta:** Aggiungere `CFG.modeCharacteristicInterval` come mappa **generica** modo→intervallo in `config.js` (ionian:11, dorian:9, phrygian:1, lydian:6, mixolydian:10, aeolian:8, locrian:6). Helper `_modeCharacteristicBoost(root)` in `harmony.js`. `modeHint` aggiunto a tutte e 7 le tracce in `tracks.js`.
**Alternative scartate:**
- Mappa per-engine come nel vecchio `harmony-layer.js` → meno generalizzabile
- Boost hard-coded per modo dentro `harmony.js` → magic numbers, non config
**Conseguenze:**
- ✅ Ogni traccia eredita boost dal modo dichiarato in `modeHint`
- ✅ Nuove tracce ereditano automaticamente se dichiarano `modeHint`
- ✅ Single source dei boost in `config.js`

---

## #006 — Directory rename: `MACH:INE II/` → `app/`

**Data:** 2026-04-07
**Contesto:** Il nome originale `MACH:INE II/` aveva due caratteri problematici per script bash, glob, path resolver: `:` e ` ` (spazio). Causava bug in launcher e tooling.
**Scelta:** Rinominare in `app/`. Path completo diventa `/MACH-INE II/app/`.
**Alternative scartate:**
- `machine-ii/` → ridondante con il nome del repo padre
- `code/` → troppo generico
- Mantenere il nome originale → debito tecnico permanente
**Conseguenze:**
- ✅ Tutti gli script bash funzionano senza escape acrobatico
- ✅ Identità del progetto vive in `README.md` + `CLAUDE.md`, non nel filesystem
- ⚠️ Hardcoded path in vecchi script/file devono essere aggiornati man mano che emergono

---

## #007 — Salvataggio "nulla si elimina, tutto si archivia"

**Data:** 2026-04-07
**Contesto:** Tentazione naturale di `rm` sui file morti. Ma il valore di alcuni frammenti (es: 130 LOC del break ciclico RITM-05 in `rhythm-layer.js`) potrebbe emergere in futuro.
**Scelta:** Principio operativo: nessun `rm` mai. Tutto va in `archive/` con manifesto. Anche i file orfani parent dir vanno in `archive/parent-dir-residue/`. Se serve liberare spazio si usa `.gitignore` (es: `.als` 3.7MB preservati su disco ma fuori dal repo).
**Alternative scartate:**
- Cancellare le isole morte → perdita irreversibile
- Solo `git rm` (preservato in history) → invisibile a `ls`, frizione di accesso
**Conseguenze:**
- ✅ Recovery sempre possibile
- ✅ `archive/` è esplorabile senza `git checkout`
- ⚠️ Repo cresce nel tempo → bilanciato da `.gitignore` selettivo

---

## #008 — Workflow management: STATUS + WORKLOG + DECISIONS (3 file, no tool esterni)

**Data:** 2026-04-07
**Contesto:** Sessioni lunghe perdono contesto. Compact riassume male. Manca un punto di entrata per "dove eravamo rimasti" e un journal per "perché abbiamo fatto X". `docs/05-ROADMAP.md` esiste ma mescola visione strategica e backlog operativo.
**Scelta:** 3 file in `docs/` con responsabilità nette:
- `STATUS.md` → snapshot vivo (versione, moduli, prossimi step P0-P4), rigenerato a fine sessione
- `WORKLOG.md` → diario append-only, una entry per sessione
- `DECISIONS.md` → questo file, ADR-light append-only

Più protocollo in `CLAUDE.md`:
- **Start sessione:** leggi STATUS → leggi ultima entry WORKLOG → leggi top 5 di STATUS
- **Durante:** decisioni importanti → DECISIONS, task scoperti → STATUS prossimo
- **Fine sessione:** append WORKLOG, rigenera STATUS, commit `wm: ...`

**Alternative scartate:**
- 4 file (con BACKLOG separato) → ridondante, BACKLOG vive bene dentro STATUS
- Tool esterno (Notion/Linear) → fuori dal repo, contesto perso
- Solo memoria globale Claude `~/.claude/memory/` → non versionata, non condivisibile
- Solo `05-ROADMAP.md` → mescola troppe responsabilità
**Conseguenze:**
- ✅ Single entry point per ogni sessione
- ✅ Storia completa recuperabile (WORKLOG)
- ✅ "Perché?" sempre rispondibile (DECISIONS)
- ✅ Versionato nel repo, condiviso con qualsiasi futuro collaboratore
- ⚠️ Disciplina richiesta a fine sessione (~5 min di journaling)
