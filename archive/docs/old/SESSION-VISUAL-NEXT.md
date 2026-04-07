# SESSION VISUAL NEXT — Handoff 2026-04-07

> Briefing per la **prossima sessione Claude**. Leggere TUTTO prima di toccare qualsiasi file.
> Questo file sostituisce la vecchia scaletta di Phase 0 (che è stata implementata **e rifiutata** dall'utente).

---

## TL;DR per la prossima sessione

1. **Phase 0 è stata implementata ma NON committata e NON regge il feedback live.** Decidere se tenere, parzializzare o rollback.
2. **1 hotfix bloccante applicato** (TDZ `isRottura` in `comp-quadrati.js`) — anche questo uncommitted. Non è mio bug, è preesistente dal commit `118ccbba`.
3. **Sequencer funziona correttamente**, ma parte in pausa (`_paused=true` a boot). Serve **Space** per avviare. NEBBIA a bpm null=60 fallback impiega ~5 min per la traccia intera.
4. **Nuovo scope**: redesign del linguaggio per traccia, NOT tuning. È Phase 3 della roadmap, saltato in avanti.
5. **Prima di qualsiasi codice**: l'utente deve ritestare con hard-reload+Space dopo il fix TDZ, per confermare che il suo feedback è valido (non viziato dal crash silenzioso su SOLCO).

---

## Stato repo all'handoff

**Branch:** `machine-iii`
**HEAD:** `6148835` (v3-music: A/B/C framework + Burial scatter + 7 structural features)
**Uncommitted:** 9 file in `src/` modificati (Phase 0 + hotfix TDZ). Vedi diff stat sotto.

```
src/comp-griglia.js   | 19 +++++++++++++++----
src/comp-liminale.js  | 24 +++++++++++++++++++-----
src/comp-linee.js     | 17 ++++++++++++-----
src/comp-negativo.js  | 25 +++++++++++++++++++------
src/comp-quadrati.js  | 33 ++++++++++++++++++++++++---------   ← include hotfix TDZ
src/comp-treno.js     | 23 +++++++++++++++--------
src/field.js          | 29 ++++++++++++++++++++++-------
src/tracks.js         | 12 ++++++------
src/visual-toolkit.js | 49 +++++++++++++++++++++++++++++++++++++++++++++++++
9 files changed, 181 insertions(+), 50 deletions(-)
```

**Nessun commit eseguito.** Working tree sporco. Decidere prima cosa fare con questi cambi.

---

## Cosa è stato fatto in questa sessione

### Phase 0 — Identity foundations (TUTTI i 5 task implementati, sintassi OK, NON committato)

| Task | File | Cambio |
|---|---|---|
| **0.1** Density cap per traccia | `tracks.js` + tutti i 6 `comp-*.js` | 6 `maxDensity` aggiornati (0.25/0.45/0.50/0.10/0.55/0.70) + `Math.min(density, worldState.visualRegime.maxDensity)` in ogni comp al punto del `bayerTest`/`fillBayer` |
| **0.2** Risograph offset accent | `visual-toolkit.js` + 5 comp con accent | `RISO_OFFSET_X=1, RISO_OFFSET_Y=0`, `risoOffset()`. Applicato dove si disegna con `accRgb` (isVoice in liminale, isLead in linee, isAccent in treno, accentFlash > 0 in quadrati arp, cell.accent in griglia) |
| **0.3** Audio EMA tau per traccia | `visual-toolkit.js` + 6 comp | `VISUAL_TAU={NEBBIA:4.0, RESPIRO:4.0, RITORNO:3.0, TESSUTO:1.5, SOLCO:0.8, MACCHINA:0.4, TEMPESTA:0.2}` + `lerpKForTrack(track,dt)`. Sostituito `* 0.03` fissi con `* trackK` in tutte le lerp params |
| **0.4** Bayer scaffold visibile | `visual-toolkit.js` + `comp-liminale.js` (NEBBIA germoglio/dissoluzione) + `comp-negativo.js` (RESPIRO germoglio/pulsazione/dissoluzione) | `renderBayerScaffold(ctx,W,H,color,alpha=0.04)` — lattice Bayer sulla griglia 8×8 |
| **0.5** Glitch sottrattivo | `field.js:213-265` | case 0 = strip removal (clearRect orizzontale 8-16 righe), case 3 = column removal (clearRect 4-12 colonne), case 4 = difference compositing flip. case 1 (scan line) e 2 (canvas shift) invariati |

### Hotfix bloccante (separato da Phase 0)

**TDZ su `comp-quadrati.js`** — `isRottura` era usato a riga 151 ma dichiarato con `const` a riga 168. `ReferenceError: Cannot access 'isRottura' before initialization` ogni frame su SOLCO → solo il background (verde scuro `#282B26`) veniva renderizzato. Fix: hoist di `const isRottura` subito dopo il destructuring di `env` in `render()`. Eliminata la vecchia dichiarazione.

**Bug preesistente** (commit `118ccbba` — "v3-visual: glitch layer, audio reactivity, bug fixes"). Non introdotto da Phase 0.

---

## Feedback utente dal test live (perché Phase 0 non basta)

L'utente ha testato 3 tracce, scartandole tutte con voti bassi. Il feedback rivela che vuole **ridisegno del linguaggio visivo per traccia**, non tuning di parametri. È Phase 3 della roadmap, non Phase 0.

### NEBBIA — voto 3
- **Distribuzione dots localizzata in basso** → vuole "macchia di leopardo" (distribuzione irregolare, organica, spazialmente variata)
- **Deve respirare di più con drone e accordi** → la correlazione audio↔spazialità non è abbastanza forte
- **Voice notes troppo scure** → vuole dots più chiari, più persistenti, fade lento
- **Lead deve avere un linguaggio diverso**: tipo **linee sottili verticali che scendono** (nuovo primitivo, stile data-rain)
- **Flash glitch non mi piace** (vedere nota sotto)

**Root cause analysis:**
- Distribuzione in basso: problema di generazione zones/dots in `comp-liminale.js` (vedere `_zones`, `_dots` spawn logic)
- Voice scuro: `lerpColor(bgRgb, accRgb, depthFade * d.alpha)` con NEBBIA ha `accent:null` → `accRgb=dotRgb` → voice e dot normali sono quasi indistinguibili. Serve forzare voice a colore pieno, non blended da bg
- Lead = primitivo verticale: richiede nuovo path di rendering dedicato ai CH6 per NEBBIA (condizionale, non globale)
- Respiro drone/chords: serve un sistema che leghi `_params.breathAlpha` o simile a CH2 (drone) e CH4 (chords) densità, non solo audio RMS

### TESSUTO — voto 1
- **"Sembra tappezzeria di nonna, marrone e giallo"** — palette attuale `bg: #20130D, dot: #CDD71D, accent: #EFE6DE`. L'effetto combinato è ostile
- **Transizione tra fasi inesistente** — `comp-linee` ha params che cambiano tra fasi ma l'utente non li percepisce. Causa possibile: o il tau (1.5s) è troppo lungo, o i valori `target` delle fasi sono troppo simili
- **Linee sottili non rappresentano l'accordo** — le linee scorrono indipendentemente dalla progressione armonica. Serve mapping pitch→y delle linee legato a `worldState.currentChord`
- **Bianco su densita fa male agli occhi** — probabilmente l'accent cream `#EFE6DE` a densità alta. Va smorzato o cambiato
- **Rottura: lo zoom dà molto fastidio** — in rottura c'è un meccanismo di zoom/jitter in `comp-linee.js` che è troppo aggressivo

**Root cause analysis:**
- Palette: direzione di design sbagliata. Serve riscelta (l'utente preferisce `fondi colorati ricercati`, Hara→Yokoo gradient, ma marrone/giallo non funziona)
- Transizioni invisibili: leggere `PHASE_PARAMS` in `comp-linee.js`, valutare se i delta tra fasi sono abbastanza grandi da essere percepiti
- Accordo: serve legare `line.targetY` alle note del `currentChord` invece del drift randomico
- Rottura zoom: disabilitare o smorzare l'operazione di zoom in `comp-linee` durante rottura

### SOLCO
- **"Rimane sempre verde, non succede nulla"** — CAUSA: bug TDZ in comp-quadrati (vedi hotfix sopra). Dopo il fix, la traccia dovrebbe renderizzare i blocchi. **Da riconfermare dopo hard reload.**

### ALTRE TRACCE (RESPIRO, MACCHINA, TEMPESTA, RITORNO)
L'utente non ha commentato. Ha detto "non mi piacciono" ma ha rimandato il feedback dettagliato. **Da raccogliere dopo il primo giro di redesign.**

### Sequencer
- **"Non va avanti la traccia"** — NON è un bug. Il director parte in pausa (`_paused=true` a `director3.js:56`), serve **Space** per avviare. NEBBIA è intenzionalmente lenta (bpm=null → fallback 60 → germoglio 32 bar × 4s = 128s). La percezione di "non avanza" deriva da:
  1. Aver premuto Shift+N ma non Space
  2. Aver aspettato troppo poco per vedere l'advancement di fase automatico
- **Da comunicare esplicitamente all'utente nella prox sessione.**

### Glitch
- L'utente dice "flash glitch non mi piace". Interpretazione ambigua:
  - Potrebbe aver visto la **vecchia versione in cache** (case 0 era flash bianco/nero additivo) → soluzione: hard reload, verificare
  - Oppure i case 1 (scan line bars colorati) e case 2 (canvas shift) sono ancora percepiti come flash → soluzione: rimuovere o sostituire anche quelli
  - Oppure gli nuovi strip removal/column removal su dark bg sembrano "flash" perché creano momenti di alto contrasto → soluzione: ridurre frequenza o rendere ancora più sottili
- **Da diagnosticare con test mirato.**

---

## Decisioni aperte per la prossima sessione

### 1. Cosa fare con il working tree uncommitted?

Tre opzioni:

**A) Rollback totale Phase 0** — `git checkout -- src/`. Si parte da `6148835` come se nulla fosse. Si perde anche il fix TDZ (che andrebbe riapplicato separatamente). **Vantaggio:** pulito. **Svantaggio:** butta 180 righe di lavoro (parte del quale era valido).

**B) Commit solo hotfix TDZ, scartare Phase 0** — `git checkout src/tracks.js src/visual-toolkit.js src/comp-liminale.js src/comp-linee.js src/comp-griglia.js src/comp-negativo.js src/comp-treno.js src/field.js`, poi stage solo la porzione TDZ di `comp-quadrati.js` (con `git add -p`), commit come `v3-visual hotfix: TDZ isRottura in comp-quadrati`. **Vantaggio:** bug bloccante risolto stabilmente. **Svantaggio:** nessuna base visiva.

**C) Commit Phase 0 completa + hotfix come 2 commit separati** — accetta Phase 0 come "baseline imperfetta" e costruisce il redesign sopra. **Vantaggio:** history leggibile, density cap resta (è una base sana). **Svantaggio:** le altre 4 task (riso offset, tau, scaffold, glitch refactor) vengono contraddette dal redesign successivo.

**Raccomandazione difensiva: B.** Salvare il solo hotfix garantisce che SOLCO funzioni. Phase 0 va scartata perché il tuning non regge il feedback — riso offset 1px invisibile, scaffold 0.04 alpha invisibile, glitch controverso, tau NEBBIA 4s forse troppo lento, density cap discutibile rispetto al vero problema (distribuzione spaziale, non massa).

**Alternativa conservativa: C con messaggio chiaro.** Se vuoi mantenere anche i density cap come "sanity ceiling" permanente.

### 2. Quale plan affrontare per primo?

Il redesign vero è diviso in 3 plan atomici (uno per traccia). **Non procedere in parallelo.** Un plan per sessione, un commit per sessione, test live in mezzo.

| Plan | Traccia | Scope | Costo stimato |
|---|---|---|---|
| **Plan A** | NEBBIA | Distribuzione leopardo, voice chiara persistente, lead = linee verticali scendenti (nuovo primitivo), respiro drone/chords, glitch riconsiderato | 1 sessione |
| **Plan B** | TESSUTO | Palette ripensata, transizioni visibili, linee legate a `currentChord`, rottura senza zoom | 1 sessione |
| **Plan C** | SOLCO | Valutazione post-hotfix TDZ. Se è ok → si salta. Se servono aggiustamenti → 1 sessione | 0-1 sessioni |
| **Plan D-G** | RESPIRO / MACCHINA / TEMPESTA / RITORNO | Da raccogliere feedback dopo Plan A/B/C | n×1 sessione |

**Raccomandazione: Plan A per primo** — NEBBIA è la prima traccia del concerto (apertura), e il feedback è il più specifico e azionabile. Se il linguaggio di NEBBIA funziona, si può estendere lo stesso pattern di pensiero alle altre tracce. Se non funziona, si è imparato molto con un solo file modificato.

### 3. Serve un nuovo primitivo "linee verticali scendenti"?

Per il lead di NEBBIA l'utente chiede "linee sottili verticali che scendono". Questo non è un effetto esistente nel toolkit. Opzioni:

**A)** Implementarlo *solo* dentro `comp-liminale.js` come path dedicato per CH6 (hardcoded per NEBBIA/RITORNO). Veloce, mirato.

**B)** Implementarlo come helper in `visual-toolkit.js` (`renderDescendingLines(ctx, x, startY, height, color, width)`) + chiamata in comp-liminale. Riutilizzabile.

**C)** Aggiungere un **nuovo primitivo** al vocabolario (DNA primitives). Sovra-ingegnerizzato per ora.

**Raccomandazione: B.** Helper in toolkit + uso locale. Se altre tracce lo chiederanno, è già pronto.

### 4. Gli altri feedback latenti

- **Glitch** in generale: diagnosticare con test live se l'utente vede ancora flash additivi (=cache) o strippings (=codice nuovo che non gli piace). **Prima del redesign, bisogna sapere.**
- **Cache browser**: serve istruire l'utente a usare DevTools → Network → Disable cache per evitare che commenti codice fantasma. Già detto in chat ma va ripetuto.

---

## Script di partenza per la nuova sessione Claude

Copia-incolla questo come primo messaggio alla nuova sessione:

```
Riprendo lavoro visivo su MACH:INE III dopo feedback live fallimentare di Phase 0.

Leggi in ordine:
1. /Users/Edo_1/MACH-INE II/MACH:INE II/SESSION-VISUAL-NEXT.md (questo file, handoff completo)
2. /Users/Edo_1/MACH-INE II/MACH:INE II/ROADMAP-VISUAL.md (roadmap originale, per context)
3. /Users/Edo_1/MACH-INE II/MACH:INE II/src/comp-liminale.js (comp di NEBBIA — primo target)
4. /Users/Edo_1/MACH-INE II/MACH:INE II/src/world-state.js (struttura worldState)
5. /Users/Edo_1/MACH-INE II/MACH:INE II/src/visual-toolkit.js (helpers esistenti)

Stato repo:
- branch machine-iii, HEAD 6148835 (uncommitted: 9 file src/)
- Phase 0 implementata ma rifiutata dal feedback live, NON committata
- Hotfix TDZ su comp-quadrati.js applicato ma NON committato

Prima di toccare qualsiasi cosa:
1. Leggi SESSION-VISUAL-NEXT.md fino in fondo. Soprattutto la sezione "Decisioni aperte".
2. Chiedimi: "commit hotfix TDZ da solo, rollback Phase 0, oppure tenere Phase 0 come baseline?"
3. Dopo la mia risposta, chiedimi: "Plan A (NEBBIA) è confermato come primo target, o preferisci diversa priorità?"
4. Non scrivere codice finché non ho risposto a entrambe.
```

---

## Hard rules (invariate)

- Glitch = sottrazione, NON accumulo (ma il refactor di Phase 0 va ridiscusso — l'utente non è soddisfatto)
- Frame budget < 16ms, ogni nuova op dichiara costo
- Reversibili, una task per task, test live tra blocchi
- Mai commit cumulativi
- Codice+commenti tecnici in inglese, comments musicali+docs in italiano
- Piccoli edit sicuri, mai riscritture monolitiche
- Prima di toccare aree protette (`main.js`, `render.js`, `director3.js` relazioni), chiedere
- Rupture = 4 stadi obbligatori (omen, infiltrazione, takeover, residuo) — mai saltare

## File di riferimento (leggere quando si lavora sulla traccia)

- **NEBBIA**: `src/comp-liminale.js` (composizione), `src/tracks.js` (palette, phases, density)
- **TESSUTO**: `src/comp-linee.js`
- **SOLCO**: `src/comp-quadrati.js` (post-hotfix TDZ)
- **RESPIRO**: `src/comp-negativo.js`
- **MACCHINA**: `src/comp-griglia.js`
- **TEMPESTA**: `src/comp-treno.js`
- **RITORNO**: `src/comp-liminale.js` (shared con NEBBIA, ma `_isRitorno=true`)

## Status tracker

| Phase | Status | Note |
|---|---|---|
| **Phase 0 — Identity foundations** | ❌ rifiutata | Implementata ma non committata. Decidere rollback / parziale / accetta |
| **Hotfix TDZ comp-quadrati** | ⚠️ uncommitted | Bug preesistente, va committato separatamente |
| **Plan A — NEBBIA redesign** | 🟡 prossimo target (proposto) | Aspetta conferma utente |
| **Plan B — TESSUTO redesign** | ⏳ dopo A | |
| **Plan C — SOLCO valutazione** | ⏳ dopo A | Verificare se hotfix TDZ basta |
| **Plan D-G — altre tracce** | ⏳ feedback mancante | |
| Phase 1 — Score driven (originale) | ⏸️ rimandato | Dopo aver stabilizzato le identità per traccia |
| Phase 2-5 (originali) | ⏸️ rimandato | |

---

**Ultima nota per la nuova sessione**: L'utente opera in italiano, vuole risposte terse senza preamboli, no conferme ridondanti, cicli corti test→feedback→fix. Glitch = *rottura grammatica*, NON accumulo effetti — meno layer, più sottrazione. Ogni cambio deve essere testato live prima del commit. Il tempo dell'utente è prezioso — non fargli perdere giri con test di codice che non sa se funzionerà.
