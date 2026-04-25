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

## #010a — Piano implementativo pre-sessione obbligatorio

**Data:** 2026-04-07 (notte)
**Contesto:** Pattern osservato: quando si inizia a implementare senza piano preciso,
Claude esplora troppo durante la sessione (legge file, cerca pattern, ragiona in contesto),
sovraccarica il context window e produce derive o errori.

**Decisione:** Ogni sessione di implementazione inizia solo se ogni item ha:
- file esatto (path relativo)
- riga o sezione esatta (numero riga o nome funzione)
- valore vecchio → valore nuovo (o struttura precisa del codice da aggiungere)
- nessuna dipendenza ambigua non risolta

**Conseguenze:**
- Le sessioni di pianificazione (come questa) producono item pronti in STATUS.md.
- Le sessioni di implementazione sono meccaniche: aprire file, fare la sostituzione, chiudere.
- Se durante l'implementazione emerge ambiguità non prevista → fermarsi, tornare in pianificazione.
- Questa regola vale anche per refactor e fix tecnici, non solo per nuove feature.

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

---

## #014 — Campo Materiale come paradigma alternativo alle comp-*

**Data:** 2026-04-11 (sessione 7)
**Contesto:** Il sistema comp-* è un event-spawn renderer: ogni nota MIDI spawna un oggetto che nasce, decade, muore. Il risultato è un "visualizer" — non produce l'estetica del "sogno febbrile mai fermo, in sottile movimento perpetuo" descritta nella visione del progetto. Serve un paradigma diverso: materiale persistente su cui la musica applica forze, non eventi discreti.

**Decisione:** Implementare un secondo paradigma di rendering ("Campo Materiale") **in parallelo** al sistema comp-* esistente, mutuamente esclusivo via flag runtime.

**Architettura:**
- `src/campo.js` — Float32Array(32×32) per ruolo (drone/bass/chord/kick/percussion/arp/voice/lead), decay + shimmer moltiplicativo + rendering Bayer halftone con screen blend Z-order grave→acuto. Offscreen 640×640 poi upscalato pixel-perfect al canvas full-screen.
- `src/biomi.js` — preset per bioma: colori, decay, forze + `depositFn` custom per ruolo (logiche speciali tipo chord-a-colonnine in SOLCO). Solo SOLCO calibrato; gli altri 6 sono placeholder GENERIC.
- `CFG.VISUAL.campo.useCampo` — flag runtime, toggle con **Shift+C**.
- `field.js` — early-return al render: `if (useCampo) { campo.update + campo.render; return; }`. Al cambio traccia chiama `campo.setBiome(track)`.
- Feed MIDI centralizzato in `addMidiNote` (field.js): quando useCampo=true, forward a `campo.feedNote(ch, note, vel)`. Coglie tutte le note interne (director3 → rhythm/bass/harmony/melody → addMidiNote).

**Alternative scartate:**
- **Sostituire le comp-***: troppo rischioso, troppo codice da buttare prima di sapere se il paradigma regge su tutti i biomi. Coesistenza permette validazione progressiva.
- **Campo dentro ogni comp-***: avrebbe mescolato due paradigmi rendendo entrambi confusi.
- **Sistema separato senza feed MIDI centralizzato**: inizialmente feed in render.js sul `midi.newNotes`, ma quelle note arrivano solo da MIDI IN (input esterno). Le note prodotte internamente da rhythm/bass/harmony/melody/director3 passano da `sendMIDINote` → mai viste. Centralizzare in `addMidiNote` cattura entrambi i flussi.

**Conseguenze:**
- ✅ Comp-* classiche restano intatte e funzionanti (flag default = false).
- ✅ Campo validabile un bioma alla volta. SOLCO è calibrato, altri 6 sono placeholder da definire uno per uno in sessioni future.
- ✅ Paradigma validato prima in sandbox (`archive/sandbox/proto-campo.html`) e solo dopo portato nel sistema live.
- ⚠️ Il campo bypassa ghost overlay, sediment condiviso, firma, camera — il cablaggio verrà aggiunto dopo che i biomi saranno validati.
- ⚠️ L'area protetta `render.js` è toccata in modo minimo (solo un import rimosso in un secondo momento).
- ⚠️ Il paradigma Campo richiederà nelle prossime sessioni: calibrazione 6 biomi, cablaggio firma (gelo/convergenza/vuoto), camera narrativa, sedimento inter-traccia.

**Ispirazioni sandbox:** `archive/sandbox/proto-campo.html` (validazione paradigma), `ispirazioni-machne/solco/JPG/*.jpg` (riferimento visivo chord SOLCO).

---

## #015 — Campo Materiale confermato come paradigma visivo definitivo

**Data:** 2026-04-12 (sessione 8)
**Contesto:** In sessione 8 è stato costruito il "Sistema Geometrico" (`geo.js`)
come terzo paradigma visivo — particelle tipizzate (ARC, RECT) su layers.js
con Bayer halftone. Due biomi calibrati (NEBBIA con ARC, SOLCO con RECT +
terrain heightmap). Funzionante tecnicamente ma ha generato una situazione
a 3 paradigmi in parallelo (comp-* classiche, Campo Materiale, Sistema Geometrico).

L'utente ha valutato i due paradigmi sperimentali e ha scelto il Campo
Materiale come più interessante per il progetto. Motivazione: il campo
produce *materia persistente che vive anche in silenzio* (shimmer, decay
lento, Float32Array che accumula). Il sistema geometrico produce forme
discrete che nascono e muoiono — belle ma non "materia".

**Decisione:**
1. **Campo Materiale è il paradigma visivo definitivo.** Tutte le sessioni
   future lavorano su `campo.js` + `biomi.js`.
2. **Sistema Geometrico archiviato come reference.** `geo.js` resta nel
   codice come terzo toggle (Shift+G) ma non verrà sviluppato ulteriormente.
   Le idee utili (terrain heightmap, depositFn geometriche, mapping registro
   locale) vengono portate dentro `biomi.js` come depositFn custom.
3. **Comp-* classiche restano come fallback di emergenza** (default, nessun
   toggle). Se al live il campo non è pronto, si torna alle comp-*.

**Principio aggiuntivo — uso dello spazio canvas:**
Il registro musicale di ogni ruolo va mappato LOCALMENTE al campo (non
MIDI 0-127 globale). Ogni ruolo occupa la SUA fascia del campo. Il drone
riempie TUTTO come campo base. Nessuna zona del canvas deve essere
sistematicamente vuota.

**Alternative scartate:**
- Sistema Geometrico come paradigma definitivo → troppo event-driven, non
  produce materia persistente
- Tenere 3 paradigmi in parallelo → insostenibile, nessuno raggiunge
  completamento

**Conseguenze:**
- ✅ Focus su un solo paradigma → path chiaro verso 7 biomi completi
- ✅ Le idee del geo (terrain, forme) migrano come depositFn nel campo
- ✅ Canvas space usato al 80%+ per bioma (mapping locale registro)
- ⚠️ geo.js resta nel repo ma non è sviluppato — potenziale dead code

---

## #016 — 7 biomi implementati: limiti noti e prossimi step

**Data:** 2026-04-12 (sessione 9)
**Contesto:** Tutti e 7 i biomi del Campo Materiale implementati in biomi.js
con depositFn custom, localPitchToCell, audioReact (NEBBIA/RESPIRO/MACCHINA),
palette coerenti coi moodboard. Campo fullscreen (non più quadrato centrato).
Bug campo fix (tracker separato per setBiome). Test offline OK.

**Limiti identificati (concordati con utente):**
1. **Grana Bayer identica** — tutti i biomi usano Bayer 4×4 a stessa cellPx.
   A densità alta = tappezzeria monotona. Serve variazione di grana per ruolo/bioma.
2. **TEMPESTA a rischio saturazione** — con densità 0.95 su tutti i ruoli,
   il campo si riempie → grigio uniforme. Servono density cap o zone di esclusione.
3. **RESPIRO monocromatico** — solo drone renderizza (gli altri scrivono su drone).
   Concettualmente corretto (una membrana) ma potrebbe sembrare piatto.
4. **Nessun lifecycle visivo** — VISUAL-VISION prevede dotSize 2px→14px con età.
   Nel campo le celle hanno tutte la stessa dimensione; la variazione è solo densità.
5. **Non prototipato** — implementazione diretta senza prototipo HTML standalone.
   La resa visiva va validata live traccia per traccia.

**Scelta:** procedere con implementazione diretta per avere la pipeline completa,
poi calibrare bioma per bioma dopo test live con musica.

**Conseguenze:**
- ✅ Pipeline completa: 7 biomi distinti, cambio traccia funzionante
- ✅ Ogni bioma ha fisica diversa (non solo colori diversi)
- ⚠️ La calibrazione visiva è tutta da fare — ogni bioma va testato con la musica reale
- ⚠️ I 5 limiti sopra sono debito tecnico da affrontare in sessioni dedicate
- ⚠️ 6 biomi da calibrare nel campo (solo SOLCO è calibrato, con palette
  da riscaldare secondo moodboard Dub Cosmico)

---

## #017 — Camera osservatore narrativo (sostituisce camera passiva)

**Data:** 2026-04-13 (sessione 14)
**Contesto:** La camera v3.6 era passiva — il director impostava zoom/focus per fase,
tutto lerp lineare. Drift circolare senza intenzione, zoom macro timido (1.0→1.5).
Barrel distortion usava ~2MB/frame per un effetto invisibile se la camera era in crop.

**Scelta:** camera autonoma con POI detection + 5 gesti cinematografici + personalità per bioma.
La camera percepisce dove c'è materia (o esplora il vuoto nei biomi sparsi), sceglie gesti
narrativi (STARE/VIAGGIARE/TUFFO/SOLLEVARE/SCANSIONE) e interpola con smoothstep.
Barrel distortion eliminato. RITORNO: fullscreen → tuffo intimo → allontanamento progressivo → puntino.

**Alternative scartate:**
- Tenere camera passiva + ampliare range zoom: non risolve il problema dell'intenzione
- Camera reattiva istantanea (insegue ogni deposito): troppo nervosa, zero narrativa

**Conseguenze:**
- ✅ Nuovo file `src/camera.js` (~230 LOC), director3 alleggerito (~50 LOC in meno)
- ✅ Barrel rimosso: -80 LOC da campo.js, -2MB/frame durante RITORNO
- ✅ Zoom profondo 3-8× — la grana Bayer diventa leggibile, i depositi hanno dettaglio
- ⚠️ Personalità per bioma da calibrare — ora i movimenti sono simili tra biomi
- ⚠️ RITORNO allontanamento da verificare su durata reale della traccia

---

## #018 — Palette unificata (B) + phaseColors

**Data:** 2026-04-13 (sessione 17)
**Contesto:** Il sistema aveva due versioni di colore (palette A inline nei biomi + PALETTE_B
separata con toggle A/B). Dopo confronto sistematico, B è superiore su tutti i biomi:
contrasto caldo/freddo migliore (NEBBIA), role differentiation (MACCHINA kick≠bass),
narrative coherence (RITORNO colori esauriti), identità cromatica forte (TEMPESTA viola).

**Scelta:** Unificare su B con modifiche specifiche:
- SOLCO voice fredda [170,195,230] (utente voleva distanza dal bass caldo)
- TESSUTO bg più scuro [6,4,10]
- MACCHINA lead magenta [180,40,110] (distinto da percussion rosa)
- NEBBIA bg nero puro, drone scuro [25,28,60] polvere sparsa che si accumula e respira
- RESPIRO: phaseColors (drone evolve con fase) + audioReact phase-aware
- Rimosso PALETTE_B, _paletteA, setPaletteMode, getPaletteMode (~130 LOC)

**Nuovo pattern: phaseColors** — campo opzionale nei biomi, interpolato in campo.js via
worldState.phase + phaseProgress. I colori evolvono durante la performance.

**Alternative scartate:**
- Tenere dual-palette: complessità inutile, mai usata live
- phaseColors globale (non per bioma): troppo rigido, ogni bioma ha il suo arco

**Conseguenze:**
- ✅ Palette unica, zero ambiguità, tasti A/B liberi
- ✅ phaseColors infrastruttura pronta per tutti i biomi (~15 LOC in campo.js)
- ✅ RESPIRO: membrana nasce sottile/scura, piena solo al climax, si dissolve
- ⚠️ Fine tuning colori da fare con test live su tutti i biomi
- ⚠️ RITORNO zoom-out progressivo da implementare (camera.js)

---

## #019 — 10 miglioramenti visivi (v3.10.0)

**Data:** 2026-04-13 (sessione 18)
**Contesto:** Analisi approfondita del sistema visivo ha identificato 10 aree migliorabili.
Il campo aveva profondità spaziale ma mancava profondità temporale (aging), coerenza
percettiva (shimmer rumore bianco, Bayer fisso), gerarchia visiva (tutti i ruoli screen
blend uguale), e il momento RITORNO era sottosviluppato (nessun accumulo geologico).

**Scelta:** Implementare tutti e 10 in 3 wave:
1. **Uint32Array BG fill** — perf ~4× per il fill sfondo
2. **Bayer offset variabile** — shift pattern ogni ~0.75s, rompe tappezzeria
3. **Shimmer coerente** — 3 sinusoidi lente sostituiscono Math.random()
4. **Micro-drift camera** — vibrazione ±0.5% a ~0.3Hz, sguardo vivo
5. **BPM pulsation** — luminosità ±4% sul battito
6. **Aging per cella** — Uint16Array traccia frame ultimo deposito, luminosità 55→100%
7. **Bloom voice/lead/kick** — pass post-render, celle >0.45 sanguinano nei vicini
8. **Erosione dissoluzione** — celle di bordo si sgretolano progressivamente
9. **Snapshot geologia RITORNO** — copia field al cambio bioma, render al 40% sotto
10. **Transizione gestuale** — 30%→0% note usano depositFn uscente durante morph

**Alternative scartate:**
- Implementare solo le più semplici: l'analisi mostrava che l'impatto viene dalla combinazione
- Aging con Float32Array (più preciso): Uint16Array basta (65K frame = ~18 min di wrap) e costa la metà
- Bloom con box blur completo: troppo costoso, 4-vicini cardinali dà il risultato visivo voluto

**Conseguenze:**
- ✅ Profondità temporale: materia fresca luminosa, vecchia tenue
- ✅ Campo respira (shimmer) invece di tremare
- ✅ RITORNO mostra la geologia dei 55 minuti precedenti
- ✅ Transizioni tra biomi gestuali, non solo cromatiche
- ✅ Gerarchia visiva: voice/lead/kick emergono con bloom
- ⚠️ campo.js cresce da ~685 a ~929 LOC — monitorare perf
- ⚠️ Tutti i nuovi parametri (erosionRate, bloomThresh, ageFactor) da calibrare live

---

## #020 — Audit transizioni musicali + bass depth (v3.11.0)

**Data:** 2026-04-13 (sessione 19)
**Contesto:** Le transizioni tra tracce avevano bug multipli: note stonate nei ghost, CC123
che troncava le anticipazioni, blip ritmico al cambio traccia, BPM ramp calcolato col tempo
sbagliato, basso fantasma TESSUTO→SOLCO, drone/accordi che non si fermavano, ghost su canali
modulari (che ignorano velocity → note a palla).

**Scelta:** Audit sistematico + 3 categorie di fix:

1. **Bug transizione (6 fix):** ghost scala vecchia→nextTrack.scale, CC123 delay dinamico≥1bar,
   mezzo step grazia anti-blip, BPM ramp con prevBpm, barsLeft disambiguato, commento corretto.
2. **Density gate + exit logic (8 fix):** bass-v3/v2/v1 density gate (follow-harmony ignorava
   density), TESSUTO bass mute bar -7 (era -3), drone/accordi density gate≥0.08 in harmony.js,
   NEBBIA/SOLCO/MACCHINA/TEMPESTA exit logic harmony per ghost CH4, ghost TESSUTO CH1→CH2,
   doppio init rimosso da main.js.
3. **Ghost modulare:** CH3/CH5/CH6/CH7 = modulare senza velocity → ghost rimossi da quei canali.
   Ghost ora solo su CH0 kick (fixedNote, vel controllata) e CH2/CH4 (drone/chord).
4. **Bass depth (4 migliorie):** skip probability phase-aware (respiro nel groove), gate duration
   phase-aware (staccato→legato→staccatissimo), TESSUTO rhythmic follow (bass segue chordGrid),
   degradation dissoluzione (groove si consuma).

**Alternative scartate:**
- Velocity ghost su modulare: impossibile, il modulare non ha VCA pilotato da velocity
- CC pre-ghost per filtro modulare: troppo complesso, il performer non ha routing CC→VCA
- Ghost bass di SOLCO con pattern reale: il pattern locked ha 4 step attivi su 16, i ghost
  da 1 nota/bar non lo rappresentano — meglio kick lontano

**Conseguenze:**
- ✅ Transizioni pulite: nessuna sovrapposizione canale durante i ghost
- ✅ Il modulare non riceve mai note "fantasma" non intenzionali
- ✅ Il basso respira (skip), cambia carattere (gate), si consuma (degradation)
- ✅ TESSUTO ha un bass groove sincopato (segue chordGrid) invece di 1 nota statica
- ⚠️ Le soglie density gate (0.08, 0.10, 0.15) da validare con musica reale

---

## #021 — Ottimizzazione render campo.js — clock starvation fix (v3.12.1)

**Data:** 2026-04-15 (sessione 22)
**Contesto:** Il clock MIDI (Web Worker) accumulava 630ms di latenza media (picco 1.2s) perché
`renderCampo()` bloccava il main thread per oltre mezzo secondo per frame. Il MIDI clock
schedula via `postMessage`, ma i messaggi restavano in coda ~40× il budget frame (16ms).
Causa: `Math.sin()` per ogni pixel nel Bayer dithering (~2M sin/frame), `Math.sqrt()` +
`Math.atan2()` per tutti i 518K pixel della planet mask RITORNO, screen blend con 3 divisioni
float per pixel per ruolo.

**Scelta:** Ottimizzazione LUT-driven senza cambiare il risultato visivo:

1. **Bayer drift LUT:** pre-calcola `driftX[960]` + `driftY[540]` una volta per frame.
   Riduce da ~2M a 1500 sin() per frame. Bayer pre-normalizzato (`BAYER4N`), index con `& 3`.
2. **Planet mask scanline:** `innerR²` fast-path (pixel sicuramente dentro → skip atan2+sqrt),
   `outerR²` fast-reject (pixel sicuramente fuori → nero), righe intere via `Uint32Array.fill()`.
   sqrt+atan2 solo sulla fascia di bordo (~5% dei pixel).
3. **Screen blend integer:** `d + (src*(255-d)) >> 8` sostituisce 3× div+mul float/pixel.
4. **Shimmer LUT:** 3 tabelle `Float32Array[96/54]` pre-calcolate per frame (non per cella×ruolo).
5. **Bloom hoist:** array offsets e scale pre-calcolati fuori dal loop celle.
6. **Zero GC pressure:** tutte le LUT allocate una volta (variabili di modulo), riusate ogni frame.
7. **Monitor latenza:** `[CLOCK LAG]` in main.js logga avg/max latenza worker→main ogni ~4s.

**Alternative scartate:**
- Spostare moduli musicali nel worker: eliminerebbe la coda, ma richiede ristrutturare tutto
  il message passing (5 moduli, firma, worldState). Troppo invasivo per un fix performance.
- OffscreenCanvas + worker per il render: API non stabile su tutti i browser, richiede
  trasferimento ImageData. Rischio regressione.
- Ridurre risoluzione offscreen: visivamente degradante, la griglia 96×54 è già il minimo.

**Conseguenze:**
- ✅ Riduzione stimata: ~600ms → ~15-30ms per frame (da misurare)
- ✅ Il clock MIDI torna a timing corretto
- ✅ Risultato visivo identico (stesse formule, solo pre-calcolate)
- ✅ Monitor latenza permanente per regressioni future

---

## #022 — TEMPESTA redesign + crossfade DJ MACCHINA→TEMPESTA (v3.12.0)

**Data:** 2026-04-15 (sessione 22)
**Contesto:** TEMPESTA era indistinguibile da MACCHINA: stesso BPM (129), stessi hat 16th pieni,
stessa struttura kick, arp identico a 16th note. Il bass collassava su una nota sola (bug clamp).
Lo snare zoppicava (shift/skip/flam random). La transizione era un taglio netto con CC123.

**Scelta:** Redesign completo su due fronti:

1. **Identità distinta TEMPESTA ≠ MACCHINA:** protagonista voice+lead (≠ arp), hat 8th + open hat
   (≠ 16th pieni), conga sincopata per fase, bass registro sub [24,43] vel 110, arp 8th texture,
   snare granitico (shift/skip/flam false).
2. **Crossfade DJ (32 bar):** exit MACCHINA estesa (arp -32, harmony -24, bass -20, melody -16),
   ghost TEMPESTA (drone -22, chord -12, bass -12, conga -8), kick continuo (no CC123,
   initRhythm seamless, rhythm density floor germoglio), degradation disabilitata.

**Alternative scartate:**
- Accelerazione BPM: perde continuità DJ
- Silenzio tra i due: uccide il flow
- Hocket voice+lead: muro sonoro senza respiro

**Conseguenze:**
- ✅ TEMPESTA ha identità propria (hat, percussioni, voice protagonista)
- ✅ Transizione morbida come DJ mix (kick continuo, strati graduali)
- ✅ Bass fix globale: octave-transpose ≠ clamp
- ⚠️ Da calibrare live: conga, open hat, voice protagonista

---

## #023 — Noise 2D non-separabile + glyph layer + phaseColors estesi (v3.13.0)

**Data:** 2026-04-15 (sessione 24)
**Contesto:** L'utente nota che il fondo fa "effetto tappezzeria scozzese" (tartan) su molti biomi,
specialmente RESPIRO. Screenshots di MACH:INE v0.8 rivelano vocabolario visivo più ricco (▲◆□01)
rispetto al sistema attuale (solo Bayer dots).

**Diagnosi:** Il drift Bayer era separabile: `sin(px) + sin(py)` = pattern a croce = tartan.
Ampiezza troppo piccola (0.03+0.02 su range 0-1).

**Scelta:** Tre interventi non-distruttivi:

1. **Noise 2D non-separabile** in campo.js: LUT 256×256 hash Mulberry32, indicizzata come
   `noise[py][px]` con offset temporale. Ampiezza 0.12 (4× il vecchio drift). Zero alloc/frame.
2. **Glyph layer** post-Bayer: fillText sull'offscreen per ruoli ad alta densità.
   7 vocabolari per bioma (SOLCO: `|!∙:;▼`, MACCHINA: `01▸▪□×`, ecc.). Configurabile
   via `bioma.glyphs { roles, chars, threshold, opacity }`.
3. **phaseColors estesi** a SOLCO, TESSUTO, TEMPESTA (prima solo RESPIRO+RITORNO).
   Ora 5/7 biomi hanno colori che evolvono per fase.
4. **Correzioni colori**: TEMPESTA (3 bianchi→differenziati), NEBBIA drone più visibile,
   TESSUTO bass ≠ drone, RITORNO più saturato in partenza.

**Alternative scartate:**
- Bayer 8×8: risolve gradualità ma non il tartan (il drift separabile resta)
- Blue noise: costoso da generare, non necessario con hash 2D
- Solo aumentare ampiezza drift: il drift separabile resta visibile come righe

**Conseguenze:**
- ✅ Pattern tartan eliminato (noise 2D non-separabile)
- ✅ Vocabolario visivo più ricco (glifi per bioma)
- ✅ 5/7 biomi con evoluzione cromatica per fase
- ⚠️ Da calibrare live: threshold glifi, opacity, ampiezza noise, colori phaseColors

---

## #024 — ENCORE: 8ª traccia polimetrica fuori scaletta (v3.14.0)

**Data:** 2026-04-16 (sessione 25)
**Contesto:** Il live set di 7 tracce (NEBBIA→RITORNO) ha un arco narrativo chiuso. Serve un pezzo
opzionale post-suite, attivabile manualmente, con identità radicalmente diversa: polimetria,
scale non-diatoniche, visual da grande evento.

**Scelta:** ENCORE come traccia autocontenuta con:
1. **Forma a diamante** (~7.5 min, 232 bar a 132 BPM): heartbeat → 7 mattoni → plateau → smontaggio
2. **Polimetria aritmetica** su clock unico: kick 4/4 (16), hat 5/8 (10), bass 3/4 (12),
   chord 7/8 (14), arp 11/16 (22), voice 13/16 (26). Convergenza totale mai (LCM = 60060 step).
3. **3 scale switchabili live** (Q/W/R): ottatonica half-whole, ottatonica whole-half, Prometheus.
4. **Visual**: colori RGB puri (primari+secondari), aging invertito (nuove celle brillanti),
   kick stroboscopico con inversione colori, cellPx grossi, shimmer ×4.
5. **Ordine mattoni non convenzionale**: kick → voice → chord → hat → arp → snare → BASS (drop).
   Il bass arriva per ultimo = massimo impatto.

**Alternative scartate:**
- Encore con stessa struttura a fasi dei 7 biomi: troppo simile, perde identità
- Clock multipli per polimetria: drift, complessità — aritmetica modulare è zero-drift
- Scale diatoniche: troppo risolventi, l'ottatonica è simmetrica e non porta da nessuna parte

**Conseguenze:**
- ✅ Pezzo completamente autocontenuto (tasto E, nessun effetto sui 7 biomi)
- ✅ Tutti i moduli musicali supportano `encoreCycleLens` via `worldState.encoreMode`
- ✅ Director3 gestisce state machine a 10 brick + teardown inverso
- ✅ Camera fissa durante encore (l'occhio è immobile, la geometria lavora)
- ⚠️ cellPx 4 nella spec originale → portato a 10-16 per performance (da ricalcolare se serve)
- ⚠️ Da calibrare live: velocity, timing brick, visual stroboscopico

---

## #025 — ENCORE v2: Canon Machine sostituisce polimetria a pattern fissi (v3.15.0)

**Data:** 2026-04-16 (sessione 25)
**Contesto:** L'encore v1 (polimetrico, diamante, teardown inverso) era "colto ma non folle".
L'utente vuole incastri che si sommano come un tetris — parti che sembrano sbagliate finche
non capisci che si incastrano. Visual alla Ikeda: geometrie, contrasto, sul beat.

**Scelta:** Redesign completo → Canon Machine:
1. **Motore canonico**: genera frase 7-13 note, 5 voci la suonano trasformata
   (bass 1×, chord 1× sfasata, arp 3× invertita, voice ½× retrograda, lead 2×)
2. **Escalation a compressione**: durate decrescenti (36→8 bar), nessun teardown — taglio netto
3. **Visual geometriche**: kick=riga, bass=metà schermo, arp=diagonale, voice=arco,
   lead=croce, chord=quadrante. B/N dominante, RGB raro (solo a vel forte via colorsStrong)
4. **Convergenze**: ≥3 voci su stessa pitch class → flash fullscreen bianco
5. **Vincoli contrappuntistici**: no unisoni nello stesso registro

**Alternative scartate:**
- v1 con tweaks: troppo "accademico", non "folle"
- Cantus Firmus (una linea genera le altre): prevedibile una volta capito il trucco
- Constraint Solver (vincoli senza canone): rischio rumore, meno musicale
- Sezioni a contrasto / onde: la suite ha già archi narrativi, l'encore deve essere l'opposto

**Conseguenze:**
- ✅ Incastri computati impossibili per un umano — ogni esecuzione diversa
- ✅ Visual Ikeda-style: geometria pura, B/N, colore come evento raro
- ✅ Taglio netto: fine brutale dopo ~6 min di accumulo
- ⚠️ Da calibrare: velocity per voce, lunghezza frasi, timing convergenze

---

## #026 — Clock/MIDI sync: lookahead note + worker zero-alloc (v3.16.0)

**Data:** 2026-04-17 (sessione 27)
**Contesto:** Test live con hardware attaccato (sessione 26→27): rallentamenti e
latenze variabili tra clock MIDI e note. Il clock (0xF8) era schedulato con
lookahead 100ms (arriva sempre in orario), le note invece partivano immediate
dal main thread — se il main era saturo (worker message handler che gira a 500Hz
+ campo.js pesante), le note slittavano mentre il clock restava stabile,
creando desync percepibile tra griglia DAW e suono.

Inoltre il worker `midi-clock.worker.js` faceva `postMessage({ dt, now })` ogni
2ms = ~30k oggetti/min → pressione GC major su set lunghi (Sessione 23 aveva
già registrato `[CLOCK LAG]` fino a 1.2s).

**Scelta:**
1. **Note/CC/PB con stesso lookahead del clock** (`NOTE_LOOKAHEAD_MS = 15ms`)
   — timestamp hardware anche per le note. Assorbe jitter fino a 15ms senza
   drift. 15ms sotto la soglia percettiva (~20ms), sopra il jitter tipico
   del main thread.
2. **Worker a 5ms invece di 2ms** (`TICK_MS=5`) — 60% meno carico sul main.
   Il clock MIDI usa già lookahead, la precisione output è invariata.
   Scheduling assoluto (`nextTick += 5`) per drift compensation.
3. **postMessage primitivo** (`performance.now()` invece di `{ dt, now }`)
   — zero allocazione per tick. dt calcolato in main come delta tra tick
   consecutivi.
4. **Norns bridge → no-op**: funzioni export restano per compat con
   director3, ma il body è vuoto. Elimina `{type,note,vel}` allocato per
   ogni nota CH2 e il check readyState WebSocket.
5. **sendMIDIStart/Stop allineati**: anche il primo tick parte a T+15ms,
   coerente con le prime note → DAW vede origine tempo unica.

**Alternative scartate:**
- **Spostare music pipeline nel worker**: richiederebbe serializzare
  `worldState` avanti/indietro, forte refactor. Rimandato.
- **SharedArrayBuffer per dt**: overkill, i primitive postMessage sono
  già gratuiti.
- **Lookahead più ampio (30-50ms)**: sopra soglia percettiva per musicista.

**Conseguenze:**
- ✅ Clock e note viaggiano con stesso offset → sync fisso tra griglia e
  suono anche sotto spike di lag fino a 15ms.
- ✅ Main thread alleggerito (~60% meno invocazioni `updateDirector3 + 5
  moduli + updateMIDIClock`) → frame budget libero per rendering.
- ✅ GC churn worker→main azzerato (da ~30k oggetti/min a 0).
- ⚠️ Tutte le note hanno 15ms di latenza costante. Musicista in monitoring
  la percepisce come offset fisso (compensabile in side-chain DAW o a mente).
- ⚠️ Granularità tick handler ora 5ms invece di 2ms: quantizzazione delle
  decisioni director3 a 5ms, inudibile (=8% di un 1/16 a 120BPM).

---

## #027 — Crispness pass: nearest-neighbor + drift ridotto (v3.17.0)

**Data:** 2026-04-17 (sessione 27, fine)
**Contesto:** Dopo i fix clock MIDI, richiesta di ottimizzare visivamente —
rendere l'immagine più crisp e togliere il "noise che gira" su retina/proiettore.

**Diagnosi:** quattro fonti di sfocatura/noise, in ordine di impatto:
1. **Scaling browser bilinear**: canvas 1920×1080 interno + CSS `width:100%`
   + `object-fit:contain` → il browser interpola con bilinear sull'upscale al
   display fisico. Su retina/proiettore 4K i bordi dei pixel halftone Bayer
   si sfumano. Fonte #1 di perdita di crispness.
2. **`_DRIFT_AMP = 0.12`** nel noise 2D additivo al threshold Bayer: ogni
   pixel ha la soglia vibrata del ±12% per frame. Era stato alzato per
   rompere il pattern tartan, ma 0.12 genera sfrigolio granuloso.
3. **Glyph char cycling** ogni 16 frame (~267ms): scintillio leggibile sui
   glifi densi.
4. **Bloom threshold 0.45**: alone voice/lead/kick parte a densità media,
   "rende morbido" il campo denso anche quando non serve enfasi.

**Scelta:**
- **A — CSS `image-rendering: pixelated`** su canvas (index + projector) —
  nearest-neighbor scaling. I pixel halftone restano crisp su qualsiasi
  upscale (retina/proiettore). Zero costo render.
- **B — `_DRIFT_AMP`: 0.12 → 0.05** — riduce il jitter di threshold senza
  riaprire il tartan (il noise 2D è già non-separabile).
- **C — Glyph cycling: `>> 4` → `>> 6`** — carattere cambia ogni ~1s invece
  di 267ms: glifi più stabili, meno distrazione.
- **D — Bloom threshold: 0.45 → 0.55** — alone solo su picchi (densità >0.55):
  campo denso medio resta asciutto, gerarchia visiva più netta.

**Alternative scartate:**
- **DPR-aware canvas** (render fisico 3840×2160 su retina): 4× pixel/frame,
  sforerebbe il budget main thread ricuperato con i fix clock. Il punto A
  (CSS pixelated) dà il 90% del beneficio con 0 costo render.
- **Azzerare `_DRIFT_AMP`**: rischio di riaffacciare artefatti di uniformità
  su densità alte (il noise 2D serve come dither).
- **Disabilitare shimmer**: è il "respiro" lento del campo, non il colpevole
  del noise granuloso (quello era il drift).

**Conseguenze:**
- ✅ Pixel halftone crisp su retina/proiettore — estetica Ikeda/digital clean.
- ✅ Meno sfrigolio granuloso nel campo medio — immagine più "ferma".
- ✅ Glifi più leggibili — il carattere resta visibile abbastanza da essere
  riconosciuto.
- ✅ Alone più raro, usato come evento: pattern fitto del campo resta definito.
- ⚠️ Da calibrare live: se `_DRIFT_AMP=0.05` produce visibili bande in zone
  di gradiente (densità 0.3-0.5), alzare a 0.07-0.08.
- ⚠️ Bloom threshold 0.55: se voice/lead sembrano "piatti" rispetto al resto,
  abbassare a 0.50.

---

## #028 — Anti-tovaglia sistematica: density cap + depositFn probabilistici (v3.17.1)

**Data:** 2026-04-17 (sessione 27, fine)
**Contesto:** Screenshot v3.17.0 di tutti i biomi rivelano che SOLCO, TESSUTO e
RESPIRO hanno la stessa patologia: il campo copre tutto lo schermo in modo
uniforme. Dopo il crispness pass (pixelated + drift ridotto) il problema è
più evidente, non nascosto più dal dither. MACCHINA, RITORNO, ENCORE OK.

**Scelta:**
- **SOLCO — density cap**: `maxDensity { drone: 0.45, bass: 0.65, chord: 0.55 }`.
  Il sistema in campo.js (penalità progressiva sopra il cap) crea automaticamente
  zone vuote e pause tra le colonne bass.
- **TESSUTO — trama discontinua + density cap**:
  - Drone depositato probabilisticamente (45% per cella) invece di riga continua
    → tessuto vero invece di telaio solido.
  - Bass width 50-80% → 25-50% per nota: fascia bassa non inonda.
  - `maxDensity { lead: 0.95, bass: 0.55, drone: 0.35 }`.
- **RESPIRO — target più bassi + spatial più ampia**:
  - baseTarget pulsazione 0.35→0.25, densità 0.45→0.35.
  - Spatial amp ±0.32 → ±0.44 (tutti termini non-separabili dal v3.17):
    il baseTarget è solo pavimento, la spatial fa i contrasti reali.
- **`_DRIFT_AMP: 0.05 → 0.07`**: compromise tra crisp e anti-pattern.

**Alternative scartate:**
- **Ridurre globalmente force**: peggiora la presenza visiva delle note.
- **Decay più aggressivo**: perderebbe la persistenza narrativa (SOLCO=terreno
  eterno, TESSUTO=trama permanente).
- **Abbassare l'ampiezza spatial RESPIRO sotto 0.32**: senza target alto
  significherebbe membrana piatta → peggio.

**Conseguenze:**
- ✅ SOLCO: metà inferiore con colonne staccate e zone vuote — il groove dub
  si legge.
- ✅ TESSUTO: trama discontinua del drone + fasce bass staccate → telaio vero.
- ✅ RESPIRO: membrana con zone sottili (vuoti) e zone dense — i pori delle
  note bass/chord/voice/lead tornano leggibili contro un fondo non uniforme.
- ⚠️ Possibile regressione: se i cap sono troppo aggressivi, il campo sembra
  "scarno" in certe fasi. Calibrare live se serve alzare i cap (SOLCO bass
  0.65→0.75, TESSUTO bass 0.55→0.65).
- ⚠️ TESSUTO drone al 45% di probabilità: in ambiente molto rarefatto il
  telaio potrebbe diventare troppo invisibile. Monitorare; alzare al 60% se serve.

---

## #028 — Ramificazione v3.18-experimental per fix audit Opus 4.7

**Data:** 2026-04-17
**Contesto:** Audit completo della codebase (via Opus 4.7 con 4 agenti critici paralleli:
musicale, visuale, runtime, drammaturgia) ha identificato 10 buchi strutturali che
impediscono una performance "indimenticabile":
1. `rupture.stage` calcolato in director3 ma mai letto dai 5 moduli musicali (metadata morta)
2. Cicli armonici prevedibili dopo 1 min (loop trasparenti)
3. `Math.random()` ovunque, no SeededRNG → promessa "unicità" non mantenuta
4. Humanization piatta (velocity `±6` fisso per tutte le tracce)
5. ENCORE Canon Machine senza inversione/retrogradazione frase nel plateau
6. 7 biomi neutralizzati dal Bayer uniforme (distinguibilità reale debole)
7. Rupture visivamente assente (omen/takeover non si vedono)
8. Geologia RITORNO snapshotta solo l'ultima traccia (promessa cumulativa tradita)
9. Performer invisibile come compositore (no gesti di agency visibili)
10. Stessa scaletta deterministica, nessuna ramificazione narrativa

Più 3 bombe runtime: `noteTimestamps` memory creep, tab-background note orfane,
MIDI/audio fail silent senza HUD warning.

**Scelta:** creare branch `v3.18-experimental` + worktree separato `app-experimental/`
da `machine-iii` HEAD (commit `608c5e1`, tag `v3.17.1-stable`). Tutte le modifiche
avvengono nel worktree. La branch `machine-iii` resta bit-perfect fino al GATE 3 di
merge esplicito. Versione marcata `v3.18.0-rc1-exp` per evitare confusione.

Implementazione a 4 cluster paralleli Wave 1 (A musicale + B visuale + D runtime +
mandato perf dentro ogni cluster) → Wave 1.5 perf trasversale → Wave 2 C drammaturgia
(dopo A) → Wave 3 review finale. Agenti Claude Code multipli per parallelismo.

**Alternative scartate:**
- Modificare direttamente `machine-iii` → rischio rottura live imminente
- Branch senza worktree → non si può confrontare A/B live
- Implementare solo top-3 senza piano strutturato → audit troppo ricco per spot fix
- Rewrite monolitico dell'architettura visiva → viola "piccoli edit sicuri"

**Conseguenze:**
- ✅ v3.17.1-stable garantito: tag immutabile, rollback in 10 secondi
- ✅ Parallelismo agenti: Wave 1 esecuzione in ~2h wall-clock invece di 6h seriale
- ✅ GATE 3: decisione merge/mantieni-solo-experimental dopo test live
- ✅ Nessuna modifica ad aree protette (clock worker, DJ crossfade, palette B)
- ⚠️ Debt: se experimental non converge, archiviare come fossile metodologico
- ⚠️ VERSION.js diverge: main `v3.17.1` vs experimental `v3.18.0-rc1-exp` —
  convivenza pacifica finché sono su branch diversi

---

## #029 — Soundcheck loop autonomo (v3.18.0-rc2-exp)

**Data:** 2026-04-18 (sessione 28-bis)
**Contesto:** Il performer ha bisogno di un loop di test per il soundcheck
pre-live che suoni tutti i canali MIDI insieme in modo piacevole e
prevedibile, con visual test del routing audio e reset pulito. La suite
director3 non è adatta (arco narrativo, canali che entrano/escono).

Il modulo è stato sviluppato prima sul branch stabile `machine-iii`
(v3.17.2) e poi portato qui per mantenere allineate le due versioni
prima del GATE 3 live test.

**Scelta:**
- **Modulo autonomo `src/soundcheck.js`**: sequencer interno (pattern
  hardcoded) + clock condiviso col worker MIDI (single source of truth
  — evita drift col MIDI Clock 0xF8 verso DAW). Scrive direttamente via
  `sendMIDINote + addMidiNote`.
- **Loop 8 bar D dorian 90 BPM** (~21.3s), tutti gli 8 canali insieme.
  Progressione Dm-G-Am-F-Dm-C-G-A con melodie/arpeggi variati.
- **Velocity cycle per bar**: normal/soft/loud/medium × 2 → reference
  dinamico per il mixer.
- **Drum kit GM completo su CH1** distribuito nei 8 bar (base + cymbals
  sampler + latin + woody + break+tambourine/cowbell).
- **Bioma SOUNDCHECK**: 8 colonne level-meter colorate (una per canale),
  `audioReact` pulsa la base con energy → test diretto del routing audio.
- **Hotkey `T`** toggle esclusivo col director. Stop ripremuto →
  reset completo a NEBBIA inizio (stato boot).

**Compatibilità con i fix sessione 28:** soundcheck NON tocca
director3/moduli/camera/rupture/dramaturgy. Convive con pre-suite
(`?presuite`), panic (`Shift+Z`), octave transpose (frecce), density
(`↑/↓`), mute (`M/N`), skipPhase (`,/.`), ritorno variant (`1/2/3`).

**Alternative scartate:**
- Traccia SOUNDCHECK fake nel director: eredita arco narrativo.
- Clock separato: drift col MIDI Clock emesso al DAW.
- Random generator: manca prevedibilità utile al tecnico.

**Conseguenze:**
- ✅ Tecnico soundcheck ha un loop piacevole e prevedibile per tutti
  gli 8 canali.
- ✅ Visual test (pulse colonne) diagnostica routing audio in 2 secondi.
- ✅ Reset T→T garantisce stato boot → no residui dopo il soundcheck.
- ⚠️ Latenza 15ms del `NOTE_LOOKAHEAD_MS` si applica anche al loop.
- ⚠️ Se il synth CH1 non è GM, le percussioni producono suoni arbitrari
  (ma il test di routing resta valido).

---

## #030 — Merge v3.18.0 stable + fix NEBBIA/RITORNO + launcher definitivo

**Data:** 2026-04-18
**Contesto:**
Audit visuale sistematico di v3.18-experimental ha rivelato:
1. `campo.js:891` `isNebbiaRadial = biomaRenderMode === 'radial-voice'` — dead code
   (`biomaRenderMode` mai settato in biomi.js). Stesso pattern del bug Wave 1B-bis già
   scoperto dal perf-audit, ne era rimasto uno. Feature NEBBIA voice radiale non si
   attivava mai.
2. Geologia cumulativa RITORNO percettivamente vuota: `MERGE 0.35 × alpha 0.40 + Bayer
   gate stretto` → solo ~2/16 pixel visibili per traccia recente, tracce antiche
   completamente invisibili. L'audit aveva centrato le costanti a valori troppo
   conservativi rispetto al Bayer dithering reale.
3. Post-fix, decisione merge: utente autorizza merge su branch principale.

**Scelta:**
- **Fix 1 NEBBIA:** aggiungere fallback `_biomaName === 'NEBBIA'` come MACCHINA/TEMPESTA (1 riga).
- **Fix 2 RITORNO:** 4 tweak numerici (MERGE 0.52, DECAY 0.94, alpha 0.58, gate `d*1.7`,
  soglia cella 0.02). Zero cambi architetturali. Pixel visibili da ~2/16 a ~5/16.
- **Merge** v3.18-experimental → machine-iii con `--no-ff` (preserva storia feature).
  Conflitti risolti: VERSION theirs, docs theirs, biomi.js a mano preservando commenti
  compositivi v3.17.2 + corpo soundcheck evoluto v3.18.
- **Bump** VERSION a `v3.18.0` stable. Tag `v3.18.0` su HEAD.
- **Launcher definitivo:** `/Users/Edo_1/MACH-INE II/machine-launch.command` unificato.
  HUD hotkey v3.18 completa. Flag CLI `--presuite`, `--seed N`, `--norns`, `--no-browser`.

**Alternative scartate:**
- **NEBBIA:** settare `biomaRenderMode: 'radial-voice'` in biomi.js (più invasivo,
  introduce dualità con _biomaName, meno coerente con MACCHINA/TEMPESTA).
- **RITORNO:** redesign dell'architettura geologia (overkill, i numeri erano la causa).
- **Merge:** rebase invece di merge --no-ff (perderebbe tracciabilità Wave 1A/1B/1D/2C/3R).
- **Launcher:** start-all.sh come unico (richiede sshpass non standard macOS, use-case
  minoritario; lasciato come complemento).

**Conseguenze:**
- ✅ `machine-iii` ora porta v3.18.0 stable. Tag creato.
- ✅ NEBBIA voice renderizza con dither radiale concentrico (feature audit-promised).
- ✅ RITORNO substrate visibile con profondità storica percepibile.
- ✅ Launcher unico definitivo con HUD aggiornata. Cleanup robusto su CTRL+C.
- ⚠️ Debiti visivi non chiusi (design debt, non bloccanti):
  - Rupture stages `infiltration` (20-50%) e `residue` (80-100%) invisibili sul field.
  - SOLCO / TESSUTO / RESPIRO restano al Bayer standard v3.17.1.
- ⚠️ `origin/machine-iii` indietro di 71 commit — push richiede conferma utente.
- ⚠️ Worktree `app-experimental/` presente come backup (rimovibile post test live).

---

## #031 — Wave 1 upgrade musicale: timing feel + velocityCurve + progressionArc (v3.19.0-rc1)

**Data:** 2026-04-25
**Contesto:**
Utente richiede upgrade musicale per rendere MACH:INE meno scontato, più sperimentale —
focus su melodie e ritmica ma non solo. Sistema attuale (v3.18.0) già ricco
(humanize per traccia, prime-length loop voice/lead, contour pesati, rupture cablato),
ma 3 punti di "scontatezza" identificati nella diagnosi:
1. Tracce hanno stesso "feel" temporale rispetto al MIDI clock — nessuna identità di groove
   pocket vs laid-back per traccia. Il `humanize.timing` ms era definito ma non applicato
   da nessun modulo (zero match grep). Codice morto.
2. Mapping `density → velocity` lineare in voice/lead/arp/chord. Nessuna firma timbrica
   per traccia su come la dinamica risponde alla densità (NEBBIA carezza vs MACCHINA
   spike sono uguali a livello di curva).
3. Arp ostinato senza arco dinamico (solo accent step%4) e progressione armonica piatta
   (ogni accordo del ciclo allo stesso peso).

**Scelta — Wave 1 (rc1):**
- **1A — Microtiming feel + jitter sistematico** (`midi.js` + `tracks.js` + `director3.js`):
  - Aggiunto `humanize.feel` (ms) per ogni traccia: NEBBIA/RESPIRO/ENCORE 0, SOLCO +5,
    TESSUTO +6, RITORNO +4 (laid-back), MACCHINA -3, TEMPESTA -4 (push).
  - `setTrackTiming({feel, jitter})` esposto da midi.js; `sendMIDINote` applica feel a
    tutti i ch + jitter gaussiano (`humanizeMs(sigma)`) SOLO ai ch espressivi (>=2).
    Drum kit (ch 0/1) resta in griglia rigida — il polso non balla, ma il groove si
    sposta in pocket per traccia.
  - Hook in `initDirector3()` dopo set track: legge `_track.humanize.{feel,timing}`.
  - Clamp scheduler-safe: timestamp mai sotto `now+1ms`.
- **1B — Progression arc + breath multiplier** (`harmony.js` + `melody-v3.js`):
  - `progressionArc(chordIdx, count)` per cicli a 4 e 8 accordi: question→peak→answer→close
    (es. 4-chord [0.88, 1.0, 0.96, 0.80]). Applicato sia a chord rhythmic (chordGrid) che
    sustained. Il ciclo armonico ora ha arco dinamico, non più piatto.
  - `breathMultiplier(bar, 16)` su arp ostinato: lift-off 0.78 → full 1.0 → dip 0.55 (ultime
    2 bar). L'arp respira in cicli di 16 bar invece di rimanere costante.
- **1C — Velocity curve per traccia** (`tracks.js` + `melody-v3.js` + `harmony.js`):
  - Nuovo campo `track.velocityCurve`: NEBBIA/RESPIRO/RITORNO 'easeOut' (carezza),
    SOLCO/TESSUTO/ENCORE 'easeInOut' (bilanciato), MACCHINA/TEMPESTA 'easeIn' (esplodono).
  - Pattern di applicazione: `shapedDensity = ease(density, curveType)` sostituisce
    `density` raw nel mapping `vel = base + density*range`. Diff minimo, applicato a
    voice/lead/arp/chord. Bass non toccato (Wave 1 si concentra su melodia/armonia).
- **Toolkit dedicato:** `src/composition-toolkit.js` con sottoinsieme runtime
  (`ease`, `velocityCurve`, `humanizeMs`, `breathMultiplier`, `progressionArc`).
  Importato dai moduli musicali. Toolkit completo del design-time resta in
  `.claude/skills/composition-depth/scripts/composition-utils.js`.

**Alternative scartate:**
- **Bass curve in 1C:** scelto di non toccare bass (cycle extension v3 + skip/duration
  phase-aware già ricco). Eventualmente in Wave 2 con Markov 2° ordine.
- **Frasi non quadrate:** scartato per regola "potenze di 2" della struttura portante.
  Sperimentazione su lunghezze irrazionali rinviata a Wave 2 e confinata a layer secondari.
- **Feel applicato come delay setTimeout:** scartato — il MIDI scheduler hardware-timed
  via `send(timestamp)` è già strutturato per offset, niente setTimeout extra.
- **Jitter su drum kit:** scartato — il polso ritmico è il timekeeper, deve restare
  rigido. Solo feel (offset costante) sposta drum.

**Conseguenze:**
- ✅ Ogni traccia ha identità temporale distinta (pocket / laid-back) percepibile al
  primo soundcheck con hardware o monitoring.
- ✅ Curve dinamiche per traccia: NEBBIA entra dolce, MACCHINA esplode con la densità,
  TEMPESTA scalcia. La firma timbrica si nota anche a parità di density.
- ✅ Arp e accordi non più piatti: respiro + arc del ciclo armonico.
- ✅ Diff piccolo: 6 file toccati, ~80 righe nette. Toolkit estendibile per Wave 2.
- ⚠️ Da calibrare live: feel ms TEMPESTA -4 potrebbe essere troppo aggressivo. Listening
  test con DAW per quantificare lo shift percepito.
- ⚠️ velocityCurve easeIn su MACCHINA/TEMPESTA può rendere germoglio TROPPO debole
  (esponenziale sotto density 0.3). Verificare che pulsazione/densita compensino.
- ⚠️ Bass non in scope Wave 1 — la firma timbrica CH3 resta lineare. Da fare in Wave 2.

---

## #032 — Wave 1D + 1E: chord ghost phase-aware + hat euclidei evolutivi (v3.19.0-rc2)

**Data:** 2026-04-25
**Contesto:**
Continuazione Wave 1 dopo rc1 (vedi #031). Aggiunte le due tasselle rimanenti del piano
originale: ghost probability phase-aware esteso a chord (oggi solo bass-v3 lo aveva)
e ritmica euclidea evolutiva sui layer secondari (hat) per le tracce che oggi usano
il default sparso (SOLCO, TESSUTO).

**Scelta:**
- **1D — Chord ghost phase-aware** (`harmony.js` + `composition-toolkit.js`):
  - Nuovo helper `phaseGhostScale(phase)` nel toolkit, generalizza il pattern già usato
    da bass-v3 (germoglio 0, pulsazione 0.5, densità 1.5, rottura 1.2, dissoluzione 0.3).
  - Applicato al `chordGridGhostProb` di TESSUTO (0.08) e TEMPESTA (0.06): il ghost
    cresce e cala con la fase, seguendo la narrativa anziché restare costante.
  - Germoglio: ghost off (chord da solo, non si infila niente sotto).
  - Densità: ×1.5 (groove pieno, accordi extra "respirano" la quadrata).
- **1E — Hat euclidei evolutivi** (`rhythm.js` + `tracks.js` + `composition-toolkit.js`):
  - Toolkit aggiunge `euclidean(K, N)` (Toussaint distribuzione) e `euclideanEvolve(K1, K2, N, progress)`
    (interpolazione probabilistica fra due densità euclidee).
  - SOLCO: `hatEuclideanByPhase` con E(2,16)→E(3,16) pulsazione, E(5,16)→E(7,16) densità
    (tresillo cubano), E(7,16)→E(9,16) rottura, E(2,16)→E(0,16) dissoluzione.
    Pattern dub asimmetrico classico, finalmente al posto del default sparso v3.18.
  - TESSUTO: idem ma più rado (max E(5,16) in rottura). Hat che vela senza riempire,
    coerente con "qualcosa emerge".
  - rhythm.js: `_resolveHatPattern(trackDef, phase)` legge `hatEuclideanByPhase` se
    presente. Cache per bar (`_hatEvolved`, `_hatEvolvedBar`, `_hatEvolvedKey`):
    rigenerato a ogni boundary di bar o cambio fase/track. Entro un bar il pattern
    resta stabile (no instabilità intra-bar che trasformerebbe il hat in noise random).
  - MACCHINA / TEMPESTA mantengono `hatPatterns` hardcoded (identità "macchina ferma"
    e "dance picco" vanno preservate, l'evolutivo è solo per chi oggi usava il default).

**Alternative scartate:**
- **Estendere hatEuclidean a MACCHINA:** scartato. MACCHINA con 16th pieni È la sua
  identità ("macchina ferma"). L'evolutivo erode la rigidità voluta.
- **Conga euclidei:** scartato Wave 1. Conga di TEMPESTA è già ben curata (sincopata
  per fase). L'evolutivo aggiungerebbe casualità senza beneficio.
- **Cache pattern intra-step:** scartato — chiamare `euclideanEvolve` per ogni step
  cambierebbe il pattern 16 volte per bar = noise random, non ritmo.
- **Ghost phase scale anche su rhythm.js kick ghost:** lasciato per dopo. Il kick
  ghost CH1 è già gated da `density > 0.6` + `isTakeover` boost — il pattern fase-aware
  è implicitamente coperto dalle densità per fase.

**Conseguenze:**
- ✅ SOLCO finalmente ha hat dub asimmetrico (E(5,16) tresillo) anziché default sparso.
- ✅ TESSUTO acquisisce texture inquieta euclidea, coerente con "qualcosa emerge".
- ✅ Pattern "vivo, non loop fisso": i hit ambigui spostano posizione per bar in fase
  evolutiva (pulsazione/densità in/out con K1≠K2).
- ✅ Cache per bar = costo trascurabile (1 alloc Array(16) per bar).
- ✅ Diff piccolo: 4 file toccati, 3 modifiche logiche.
- ⚠️ E(5,16) tresillo classico ha downbeat su step 0 — verifica che il kick di SOLCO
  (step 0) non si scontri timbricamente col hat (step 0 entrambi). Se sì → rotare hat di 1.
- ⚠️ Riallineamento hat tra bar consecutivi con K1≠K2 = micro-glitch di 1-2 hit per bar.
  È la feature voluta ("vivo"), ma se al test ad orecchio sembra "errore" → set K1=K2 nelle
  fasi stabili (densità, pulsazione tarda).

---

## #033 — SC audio engine Wave A: drone biome morphing live (v3.20.0-rc1)

**Data:** 2026-04-25
**Contesto:**
Utente richiede sistema audio SC dedicato a MACH:INE III, **mirato e coerente** al progetto
(non porting generico da album-gen). MIDI deve restare disponibile in parallelo. Le lezioni
torneranno utili per album-gen.

Inventario di partenza:
- `album-gen/sc/` ha 9 SynthDef generici + engine + bridge OSC + osc-map (frozen v0.1)
- `machine-drone/lib/` ha **timbri-bioma già calibrati** per drone CH2 (7 biomi × 25 parametri)
  via Engine_MachineDrone CroneEngine (Norns)
- `app/src/` non ha output SC: 8 ch MIDI vanno a WebMIDI esterno

**Scelta:**
- **Filosofia "orchestra ereditaria del bioma"**: non 56 SynthDef diversi (8 ruoli × 7 biomi),
  ma 8 SynthDef-base parametrizzati fortemente. Il bioma è **stato persistente del server**
  (Lag3 18s morphing), non parametro per nota. Modello copiato da Engine_MachineDrone Norns.
- **Wave A = drone soltanto**:
  - `app/sc/synths/drone.scd` — port standalone di Engine_MachineDrone (no CroneEngine,
    no addCommand). Stesso SynthDef: 4 oscillatori (tri/saw/pul/sin) + drift LFO + breath/PWM/noise
    + RLPF + drive + reverb. Tutti i controlli su Lag3.
  - `app/sc/biome-presets.scd` — IdentityDictionary con i 7 timbri di machine-drone biomes.lua
    portati come dati. `~biomePresets[\BIOMA][\drone]` + `~phaseCurves[phase]`
    (multipliers amp/cutoff/drift/reverb).
  - `app/sc/machine-engine.scd` — boot: carica synth, instanzia drone singleton (gate=1, amp=0
    finché /biome/set arriva), registra OSC handlers `/biome/set`, `/phase/set`, `/panic`.
- **Trasporto**:
  - `app/bridge/machine-sc-bridge.js` — fork di album-gen/bridge/osc-bridge.js. Porte distinte
    (WS 9877 vs 9876, UDP listen 57122 vs 57121) per non collidere se entrambi attivi.
  - `app/bridge/package.json` — deps `osc` + `ws` (stessa stack album-gen).
- **Hook lato JS**:
  - `app/src/sc-out.js` — WS client. API: `setSCEnabled`, `sendSCBiome(name)`, `sendSCPhase(name, prog)`,
    `sendSCNote(role, freq, amp, dur)` (stub Wave A), `panicSC()`. No-op silenzioso se WS down.
  - Auto-enable via `?sc=1` URL param o `CFG.SC_ENABLED`.
  - `director3.js`: `sendSCBiome(track)` in `initDirector3()`, `sendSCPhase(name, 0)` su cambio
    fase, `sendSCPhase(name, progress)` ogni 250ms (throttle, Lag3 lato SC è 18s).
  - `main.js`: `panicSC()` dentro Shift+Z.
- **Launcher**: `app/sc-launch.command` — boot sclang + bridge. NON avvia http (gestito da
  machine-launch.command). Porte 9877/57120/57122. Auto npm install.

**Alternative scartate:**
- **Approccio A (riusa album-gen/sc)**: scartato per requisito "mirato e coerente".
  I 9 synth di album-gen sono generici, non incarnano i biomi.
- **Approccio B (synth bioma-specifici hardcoded, 8×7=56)**: scartato per esplosione di sup.
  Lag3 morphing fra preset = identità mantenuta + transizioni continue.
- **Note bioma per nota** (`/synth/bass/note freq amp dur biome phase`): scartato. Stato server
  via OSCdef + Lag3 = transizioni più smooth, meno bandwidth, modello già provato in MachineDrone.
- **MIDI sostituito da SC**: scartato (esplicito). Toggle `CFG.SC_ENABLED`, default off, MIDI primary.
- **Drone unificato con machine-drone Norns**: scartato — Norns resta hardware standalone,
  i parametri vengono portati come dati (preset table) non come dipendenza runtime.
- **Album-gen unificato con app/sc**: rinviato. Quando Wave B/C saranno solide si valuterà
  un dir `shared/sc-core/` con synth comuni + override per progetto.

**Conseguenze:**
- ✅ Infrastruttura completa: engine, bridge, client JS, launcher, contract OSC documentato.
- ✅ Drone risponde ai 7 biomi MACH con i timbri già calibrati di machine-drone.
- ✅ Lag3 18s = transizioni inter-bioma percepite come "respiro", non come patch change.
- ✅ Phase curve: amp/cutoff/drift/reverb morphano dentro la fase corrente.
- ✅ MIDI continua a uscire identico — SC è puramente additivo (drone live udibile dove
  prima il drone CH2 andava solo via MIDI a synth esterni).
- ✅ Wave A è il *foundation*: Wave B (kick/bass/chord one-shot) + Wave C (voice/lead/arp/perc)
  estendono lo stesso pattern senza ridisegnare nulla.
- ⚠️ SC non testato live (richiede SuperCollider.app + npm install). Smoke test del primo
  utilizzo necessario (SC stabilità, latenza locale, livello drone vs MIDI synth).
- ⚠️ Drone singleton sempre attivo (gate=1) — finché amp=0 è muto. Verificare che il livello
  iniziale sia davvero 0 (no leak) e che il /panic reinstanziazione non glitchi.

---
<!-- knowledge-graph links -->
[[STATUS]] [[01-ARCHITECTURE]] [[WORKLOG]]
