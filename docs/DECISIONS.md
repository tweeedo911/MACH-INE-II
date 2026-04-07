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

---

## #009 — Visual System Bible come specifica operativa

**Data:** 2026-04-07 (sera)
**Contesto:** L'utente fornisce un documento "Visual System Bible" finale
che ridefinisce il linguaggio visivo di MACH:INE III in modo unificato
(4 layer, color lifecycle, palette per-traccia 5 ruoli, rupture 4 stadi,
Bayer come unico primitivo).

**Decisione:** Adottare la Bible come specifica vincolante per il redesign
visivo. Implementazione a fasi:
- **Fase A** (infrastruttura): `trackPalettes`, event-register unificato,
  layer stack 4-canonical. Zero impatto visivo, tutto backward compat.
- **Fase B** (redesign compositivo): una comp-* per sessione, test live
  in mezzo (Bible §15.2).
- **Fase C** (rupture + memoria inter-traccia): dopo che tutte le 7 tracce
  sono state migrate.

**Motivazione:** La Bible è il primo documento coerente che unifica visione,
struttura, grammatica, palette, lifecycle e regole per traccia. Prima di
questa sessione il sistema visivo era un vocabolario maturo ma senza score
unificato ("architetto bravo, orchestra sorda"). La Bible è il principio
ordinatore che mancava.

**Conseguenze:**
- Le versioni passate (V1→V5) restano come archeologia in `archive/docs/old/`.
- I valori cromatici della Bible §12 sono la fonte di verità per i colori,
  sostituiscono le palette nominali `'cold'/'amber'/'magenta'/'bw'` usate
  fino a v3.4.2.
- Le comp-* andranno riscritte una per volta: niente big-bang.

---

## #010 — Doppio sistema entities vs midiTrail: eliminare entities

**Data:** 2026-04-07 (sera, A.2)
**Contesto:** Inventario tecnico ha rivelato che `generations.js` (299 LOC)
e `dna.js` (281 LOC) mantengono un sistema entity/fossil completo con
color lifecycle A/B/C, ma **nessuna comp-* lo legge**. Le comp-* consumano
solo `midiTrail` + `onsetWaves` da `field.js`. Il sistema entity è morto
a schermo dalla v3.0.

**Decisione:** Archiviare `generations.js` e `dna.js` in dead-islands.
Unificare il path eventi in un nuovo `event-register.js` con
`LifecycleEvent` per ruolo (kick/bass/voice/lead/chord/drone/perc/arp/onset),
cablato tramite `CH_ROLE` sul canale MIDI.

**Alternative considerate:**
1. Ricollegare generations.js alle comp-* facendo sì che le comp leggano
   `entities`/`fossils`. Rigettata: richiederebbe rewrite pesante delle
   comp e il codice di generations.js è strutturato per il vecchio
   modello A/B/C che la Bible supera.
2. Tenere generations.js "congelato" come zombi. Rigettata: aggiunge
   rumore al path di render, confonde la lettura del codice.

**Conseguenze:**
- 580 LOC rimosse dal path attivo. `render.js` più pulito.
- Il lifecycle per ruolo vive in un solo posto (`event-register.js`).
- Le firma gestures (`gelo`, `convergenza`, `densityCap`) perdono il
  loro target originale (entities) e vanno ricablate. Fix in `f5139b6`.
- `densityCap` perde effetto visibile finché le comp-* non consumano
  `LifecycleEvent` — limite documentato in STATUS.

---

## #011 — MIDI channel → visual role: mappatura canonica

**Data:** 2026-04-07 (sera, A.2)
**Contesto:** L'event-register ha bisogno di mappare canali MIDI a
ruoli visivi/lifecycle (Bible §14 mappa colore × ruolo).

**Decisione:** Mappatura confermata dall'utente:

| CH | Ruolo       |
|----|-------------|
| 0  | kick        |
| 1  | percussion  |
| 2  | drone       |
| 3  | bass        |
| 4  | chord       |
| 5  | voice       |
| 6  | lead        |
| 7  | arp         |

Esposta come `CH_ROLE` in `src/event-register.js`. Ogni ruolo ha il suo
`ROLE_LIFECYCLE` (attack/hold/decay/ghost/fossil) derivato dalla Bible §16.1.

**Conseguenze:**
- Tutte le future comp-* e i sistemi di rendering lifecycle devono
  consumare questa mappa, non hard-codare "CH5 = voice" a mano.
- Modificare la mappa = un solo posto da toccare.
- L'onset audio (senza canale MIDI) usa ruolo fallback `'onset'`.

---

## #012 — Firma gestures: target ritardato a A.4

**Data:** 2026-04-07 (sera)
**Contesto:** Dopo A.2, il test live ha mostrato che `G` (gelo) e `J`
(convergenza) non hanno effetto visibile. Il cablaggio è corretto ma
le comp-* renderizzano solo trail freschi (< 2 frame), non c'è nulla
di persistente da freezare/attirare.

**Alternative considerate:**
1. Workaround frame-capture: catturare canvas su rising edge di gelo
   e blittarlo al posto del rendering. Rigettata: è un cerotto, non
   risolve il problema strutturale (non c'è memoria reale nel campo).
2. Feedback zoom per convergenza via `ctx.drawImage` scalato verso
   centro. Rigettata: effetto posticcio, non coerente con il dogma
   Bible "niente effetti decorativi".
3. **Aspettare A.4 e risolvere naturalmente.** ✅ Scelta.

**Decisione:** Non implementare fix visivi temporanei. Documentare come
limite noto in STATUS e WORKLOG, con lista esplicita degli elementi
che devono reagire (LifecycleEvent stable/ghost/fossil, layer stack,
sediment). A.4 cablando le comp-* al layer stack + event-register
rende le firma naturalmente visibili: gelo freeza il decay dei layer
(`updateLayers` skippa quando `firma.gelo`), convergenza attira le
posizioni degli eventi persistenti.

**Conseguenze:**
- Tra A.3 e la prima comp migrata in A.4, `G` e `J` restano senza
  effetto visibile. `V` (vuotoTotale) continua a funzionare.
- La validazione finale del cablaggio firma è il test A.5: dopo la
  prima comp migrata, `G` deve congelare quella traccia, `J` deve
  implodere quella traccia.

---

## #013 — Layer stack 4-canonical come infrastruttura, non scena

**Data:** 2026-04-07 (sera, A.3)
**Contesto:** La Bible §5 definisce 4 layer canonici (BG/MG/FG/Overlay).
Due modi di implementare: (a) scena monolitica con hard-coded 4 passaggi
dentro ogni comp-*, (b) infrastruttura condivisa che le comp-* consumano
via API.

**Decisione:** Opzione (b). `src/layers.js` come modulo separato con
4 `Sediment` stackati, API `initLayers/getLayerCtx/updateLayers/
compositeLayers`. Le comp-* scriveranno in `getLayerCtx('fg')` invece
di `ctx` diretto.

**Motivazione:**
- Separa il "dove disegnare" dal "cosa disegnare". Le comp-* si
  concentrano sul linguaggio, il layer stack gestisce persistenza e
  stacking.
- Consente di cablare `firma.gelo` in un solo posto (`updateLayers`
  skippa quando gelo) invece che in ogni comp.
- Permette di bilanciare i decay rate dei layer per traccia via
  `setLayerDecay` — ogni comp può decidere il suo equilibrio BG/MG/FG/Overlay.
- Bible §5.2: "ogni traccia deve avere uno strato dominante, uno di
  supporto, uno di evento e uno di residuo". Con l'infrastruttura
  condivisa questa regola è esplicitamente gestibile.

**Conseguenze:**
- Le comp-* esistenti continuano a girare senza usare i layer (backward
  compat). La migrazione è opt-in, una per sessione.
- Al termine di A.4 ogni comp dovrà chiamare `compositeLayers(ctx)`
  alla fine del suo render invece di disegnare direttamente.
- `updateLayers(dt)` viene chiamato sempre nel game loop — le comp che
  non usano i layer pagano solo il costo del decay su buffer vuoti
  (trascurabile).
