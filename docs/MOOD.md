> Ritratto delle 7 tracce. Per ogni traccia: essenza emotiva, ruolo degli strumenti con tracce precise, arco formale, contesto narrativo.
> **Scopo:** documento consegnabile a chi deve tradurre visivamente le composizioni (calibrazione biomi nel Campo Materiale, direzione visiva, artwork, comunicazione).
> **Fonte di verità:** `src/tracks.js`, `docs/02-MUSIC.md`. Tutti i dati numerici sono estratti dal codice live.
> **Note sull'essenza emotiva:** interpretazione derivata dai parametri e dai commenti italiani in `tracks.js`. Da rileggere, correggere, firmare.

---

## Architettura d'insieme

**Suite di ~40 minuti, 7 tracce in ordine fisso:**

```
NEBBIA → TESSUTO → SOLCO → RESPIRO → MACCHINA → TEMPESTA → RITORNO
```

**Due famiglie modali** che cementano l'unità tonale:
- **Modi di F maggiore** — TESSUTO (D aeolian), SOLCO (G dorian). La coppia SOLCO/TESSUTO è in ratio 3:2 tempo (129/86 BPM).
- **Modi di C maggiore** — RESPIRO (C ionian), MACCHINA (D dorian), TEMPESTA (E phrygian), RITORNO (A aeolian).
- **Modo ponte** — NEBBIA (C lydian) prepara il passaggio a D aeolian (TESSUTO) con 5 note in comune.

**Arco emotivo complessivo** (dai commenti italiani in `tracks.js`):

| # | Traccia | Frase-guida | Stato emotivo |
|---|---|---|---|
| 1 | NEBBIA | "ti ambienta" | sospensione |
| 2 | TESSUTO | "qualcosa emerge" | inquietudine |
| 3 | SOLCO | *groove dorico, 6a maggiore* | terra, peso |
| 4 | RESPIRO | "pausa" | apertura |
| 5 | MACCHINA | "sei dentro" | meccanica trance |
| 6 | TEMPESTA | "balli" | picco |
| 7 | RITORNO | "ti rilascia" | congedo |

**Legge universale pitch→Y** (tutti i biomi):
- Y 0.00–0.35 → spazio aereo (voice/lead alti)
- Y 0.35–0.65 → fascia vitale (chord, melody media)
- Y 0.65–1.00 → terreno (bass, kick, drone grave)

**Canali MIDI** (immutabili, per tutti i biomi):

```
CH0 PULSE   kick / percussivo
CH1 GRAIN   texture / hi-hat / scatter
CH2 DRONE   root sostenuta + pitch drift LFO (±15 cents, 24 bar)
CH3 BASS    linea di basso
CH4 CHORDS  accordi
CH5 VOICE   voce melodica
CH6 LEAD    voce melodica secondaria
CH7 RUPTURE eventi caotici (fase rottura)
```

**Fasi canoniche** (5 per traccia, potenze di 2 in battute):
`germoglio → pulsazione → densità → rottura → dissoluzione`

Rottura sempre 4 sotto-stadi: `omen → infiltrazione → takeover → residuo`.

Alcune tracce **saltano** fasi: NEBBIA/RESPIRO non hanno densità né rottura; RITORNO non ha rottura.

---

## 1. NEBBIA — "ti ambienta"

### Essenza emotiva

Apertura della suite. Non è una traccia — è il fatto che qualcosa sta per cominciare. Il tempo non esiste ancora: nessun BPM, nessun clock ritmico, nessun basso, nessun kick. Tre minuti di silenzio popolato da goccie di voce che emergono nel buio, una per volta, sempre più fitte. Poi una seconda voce (il lead) entra in contrappunto, come un'eco che risponde da un'altra distanza. Il pubblico si deve ambientare, abbassare il respiro, accettare che il concerto è iniziato senza avvisarlo.

Modo **C lydian** — il #4 rende il maggiore sospeso, non risolutivo. Non porta da nessuna parte: sta.

### Ruolo degli strumenti — tracce precise

| Ch | Ruolo | Cosa fa in NEBBIA |
|---|---|---|
| CH0 | **kick** | **assente.** `density.rhythm = 0`, `kickNote = null`, `rhythmGrid = null`. Mai suona. |
| CH1 | **percussion** | **assente.** `velocityCeiling.rhythm = 0`. |
| CH2 | **drone** | attivo ma bassissimo. `density.texture = 0.05`, `velocityCeiling = 30`. Root C3 (MIDI 48) sostenuta con pitch drift LFO ±15 cents su 24 bar. È la "carta" del suono. |
| CH3 | **bass** | **assente.** `register.bass = [0,0]`, `density.bass = 0`. Non esiste fondamenta grave. |
| CH4 | **chord** | presente ma rarefatto. `density.harmony = 0.3`, `velocityCeiling = 50`. Register 55–72 (G3–C5). Progressione di **4 accordi × 16 bar = 64 bar totali** (ciclo lunghissimo): `Cmaj → Dmaj → Em → Cmaj`. Il Dmaj sopra C lydian porta il #4 caratteristico. |
| CH5 | **voice** | **protagonista.** `density.melody = 0.5`, register 67–84 (G4–C6), `velocityCeiling = 60`. Frasi brevissime di 1–3 note (`voicePhraseLen: [1,3]`), una ogni 4 battute di base. **Crescita progressiva** nel germoglio (`voiceGrowInGermoglio: true`): inizia con una goccia ogni 16 bar, cresce fino al ritmo base entro la fine del germoglio. |
| CH6 | **lead** | entra solo in **pulsazione** come contrappunto. `leadMode: 'response'`, `leadProb: 0.3` (non troppo spesso), register 72–88 (C5–E6). Risponde alla voice con eco dilatato. |
| CH7 | **arp** | **assente.** `register.arp = [0,0]`, `arpRate = 0`. |

**Densità totale:** minima. `density = { rhythm: 0, harmony: 0.3, bass: 0, melody: 0.5, texture: 0.05 }`.

**Tonalità:** C lydian, root MIDI 48 (C3). Scala: `[36,38,40,42,43,45,47,48,50,52,54,55,57,59,60,62,64,66,67,69,71,72,74,76,78,79]`.

### Arco formale

**Durata totale: 72 bar ≈ 4.8 min** (fallback BPM = 60, 1 bar = 4s).

| Fase | Bar | Durata | Cosa succede |
|---|---|---|---|
| germoglio | **32** | ~128s | Lunghissimo silenzio inziale. Drone entra prima di tutto. Poi le prime goccie di voice appaiono isolate. Crescita progressiva della frequenza voice (`voiceGrowInGermoglio`). |
| pulsazione | **24** | ~96s | Voice stabilmente presente. Il lead entra come risposta/eco. Contrappunto intimo voice↔lead. Accordi ancora rarefatti sotto. |
| densità | **0** | — | **saltata.** NEBBIA non raggiunge mai "ACTIVE". |
| rottura | **0** | — | **saltata.** Nessun picco, nessun omen/takeover. |
| dissoluzione | **16** | ~64s | Tutto si dilua, torna al silenzio per preparare l'ingresso di TESSUTO. |

### Contesto narrativo

**Posizione:** primissima traccia della suite. Apre il concerto.

**Cosa viene prima:** il silenzio assoluto (prima dell'inizio). Questa traccia trasforma quel silenzio in presenza.

**Cosa viene dopo:** TESSUTO. Il passaggio è preparato dall'accordatura: C lydian e D aeolian condividono 5 note — l'orecchio non percepisce uno stacco, percepisce uno scivolamento in territorio più oscuro.

**Funzione nella suite:** far entrare il pubblico nello stato di ascolto lento. Abituare l'orecchio all'assenza di ritmo, alla scala, alla dinamica pianissimo. Se NEBBIA funziona, il resto della suite ha il pubblico.

---

## 2. TESSUTO — "qualcosa emerge"

### Essenza emotiva

Primo movimento di inquietudine. Dalla sospensione di NEBBIA emerge una trama ritmica fatta di accordi staccati — non sostenuti come prima, ma percossi, come se una macchina ancora impacciata provasse a battere il tempo. Il basso compare per la prima volta e subito si ritrae. Non c'è kick dritto, solo impulsi irregolari ogni due battute, fuori griglia. La voce tace completamente: al suo posto entra il **lead**, che diventa la voce melodica della traccia. È una musica che si costruisce da sola, che cerca la sua forma e non l'ha ancora trovata. Minore, con la 6 bemolle aeolian come colore caratteristico — ombra, non disperazione.

Modo **D aeolian** (minore naturale). La b6 è il suo marchio: malinconia fredda, non lacrimosa.

### Ruolo degli strumenti — tracce precise

| Ch | Ruolo | Cosa fa in TESSUTO |
|---|---|---|
| CH0 | **kick** | presente ma rarefatto. `density.rhythm = 0.15`, `velocityCeiling = 65` (quiet — impulsi, non beat). `kickNote = 38` (D2). `rhythmGrid = [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,0]` — un solo impulso ogni 2 battute, in controtempo. |
| CH1 | **percussion** | accompagna il rhythm grid, bassa intensità. `velocityCeiling = 65`. |
| CH2 | **drone** | basso e continuo. `density.texture = 0.1`, `velocityCeiling = 30`. Root D3 (MIDI 50). |
| CH3 | **bass** | entra, sostiene, si ritira nella dissoluzione. `density.bass = 0.4`, `velocityCeiling = 70`, register 26–45 (sub). `bassPattern = null` — segue gli accordi con **note sostenute lunghe** sul cambio di chord root (modalità "follow harmony"). |
| CH4 | **chord** | **protagonista ritmico.** `density.harmony = 0.6`, `velocityCeiling = 75` (il più alto di tutti i ruoli armonici). Register 50–67. Suonati **staccato su una griglia** (`chordGrid = [1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1]`), non sostenuti. Progressione **4 accordi × 8 bar = 32 bar**: `Dm → Bb → C → Am`. |
| CH5 | **voice** | **completamente tace.** `voiceEveryBars: 0`, `register.melody = [0,0]`, `voicePhraseLen: [0,0]`. |
| CH6 | **lead** | **prende il posto della voice.** `leadMode: 'solo'` (indipendente, non risposta), `leadProb: 1.0` (sempre quando la densità lo permette), `leadEveryBars: 2` (una frase ogni 2 bar), `leadPhraseLen: [4,8]` (frasi medie). Register 62–79 (D4–G5). `velocityCeiling.melody = 55`. |
| CH7 | **arp** | **assente.** `register.arp = [0,0]`, `arpRate = 0`. |

**Densità totale:** `{ rhythm: 0.15, harmony: 0.6, bass: 0.4, melody: 0.3, texture: 0.1 }`.

**Tonalità:** D aeolian, root MIDI 50 (D3), BPM **86**. Scala D_aeolian.

### Arco formale

**Durata totale: 120 bar ≈ 5.6 min** (86 BPM, 1 bar ≈ 2.79s).

| Fase | Bar | Durata | Cosa succede |
|---|---|---|---|
| germoglio | **24** | ~67s | I primi accordi staccato emergono. Il basso non c'è ancora. Lead silenzioso. |
| pulsazione | **32** | ~89s | Lead entra stabilmente. Gli accordi si sviluppano. Bass comincia a seguire i root. |
| densità | **32** | ~89s | Trama completa: chord grid + bass sostenuto + lead + kick impulsi irregolari. "Qualcosa emerge" è al suo punto massimo di presenza. |
| rottura | **8** | ~22s | La più corta della suite (8 bar). Un colpo di omen→takeover breve, non distrugge — incrina. |
| dissoluzione | **24** | ~67s | Il basso svanisce (è la condizione di ingresso di SOLCO: SOLCO nasce con bass isolato nel germoglio). |

### Contesto narrativo

**Posizione:** 2° traccia. Prima traccia con una pulsazione percepibile.

**Cosa viene prima:** NEBBIA. Il passaggio è morbido per le 5 note in comune tra C lydian e D aeolian.

**Cosa viene dopo:** SOLCO. La fine di TESSUTO *prepara tecnicamente* SOLCO — nella dissoluzione il bass scompare proprio perché SOLCO ricomincia con il bass come protagonista isolato. È un passaggio di testimone. La famiglia modale cambia (da F-major a F-major — TESSUTO è D aeolian/SOLCO è G dorian, entrambi modi di F): continuità armonica forte, ma il groove cambia radicalmente.

**Funzione nella suite:** introdurre il ritmo senza affermarlo. Dire "ora c'è un tempo" senza mai battere davvero. Preparare l'orecchio alla massa del groove che arriverà con SOLCO.

---

## 3. SOLCO — *groove dorico, 6a maggiore*

### Essenza emotiva

Terra. Peso. La prima volta che la suite ha gravità. Dub grave in G dorian: il basso è il soggetto, il kick e il basso sono complementari (quando uno c'è l'altro tace), gli accordi sono il sedimento. Voice rara e preziosa — una frase ogni 4 battute — il lead tace, perché "il groove parla da solo". È il momento in cui il pianeta acquista densità fisica. La 6 maggiore dorian è il colore che lo distingue dal minore ordinario: c'è oscurità ma c'è anche apertura, non è lamento.

Modo **G dorian**. La 6a maggiore sopra il minore naturale è il suo marchio — dà luce a terra.

### Ruolo degli strumenti — tracce precise

| Ch | Ruolo | Cosa fa in SOLCO |
|---|---|---|
| CH0 | **kick** | presente e pesante. `density.rhythm = 0.7`, `velocityCeiling = 110`. `kickNote = 38` (D2). `rhythmGrid = [1,0,0,0, 1,0,0,1, 1,0,0,0, 0,1,0,0]` — sincopato dub, 5 hit in 16 step. |
| CH1 | **percussion** | accompagna il rhythm grid, `velocityCeiling = 110`. |
| CH2 | **drone** | bassissimo, appena percettibile. `density.texture = 0.1`, `velocityCeiling = 45`. Root G3 (MIDI 55). |
| CH3 | **bass** | **protagonista.** `density.bass = 0.8`, `velocityCeiling = 90`, register 24–43 (sub-bass octave). `bassPattern = [0,0,0,7, 0,5,0,0, 0,0,3,0, 5,0,0,0]` — 4 hit in 16 step, posizionati **in complemento al rhythmGrid** (dove il kick tace, il bass parla). Step 4, 6, 11, 13. Il dogma del dub. |
| CH4 | **chord** | sedimento. `density.harmony = 0.4`, `velocityCeiling = 60`. Register 55–72. **8 accordi × 4 bar = 32 bar** (ciclo lungo): `Gm → Am7 → Bb → C → Dm → Bb → Gsus2 → Gm`. Il ritorno a Gm è il home. |
| CH5 | **voice** | **rara, preziosa.** `voiceEveryBars: 4`, `voicePhraseLen: [4,6]` (frasi corte), `velocityCeiling = 75`, register 67–84. Una frase breve ogni 4 battute. |
| CH6 | **lead** | **assente.** `leadMode: 'none'` — "no lead — groove speaks for itself". Il groove è troppo pieno per permettere una seconda voce melodica. |
| CH7 | **arp** | presente ma secondario. `arpRole: 'accompany'`, `arpVelScale: 0.7` (più silenzioso della voice), `arpRate: 8` (8°), `arpNotes: 4`. Register 60–84. Pattern di 4 note derivato dall'accordo corrente. |

**Densità totale:** `{ rhythm: 0.7, harmony: 0.4, bass: 0.8, melody: 0.5, texture: 0.1 }`.

**Tonalità:** G dorian, root MIDI 55 (G3), BPM **129** (43×3 — rapporto 3:2 con TESSUTO).

### Arco formale

**Durata totale: 192 bar ≈ 6 min** (129 BPM, 1 bar ≈ 1.86s).

| Fase | Bar | Durata | Cosa succede |
|---|---|---|---|
| germoglio | **32** | ~60s | Bass entra da solo. È la sua dichiarazione d'identità. Niente kick, niente accordi. |
| pulsazione | **48** | ~89s | Kick entra e complementa il bass. Il groove nasce. Accordi entrano in background. |
| densità | **64** | ~119s | Il groove al massimo della presenza. Voice appare sporadicamente. Arp accompagna. La fase più lunga. |
| rottura | **16** | ~30s | Omen→infiltrazione→takeover→residuo. Il dub groove si rompe brevemente. |
| dissoluzione | **32** | ~60s | Rientro, il groove si dissolve, prepara il passaggio a RESPIRO (cambio radicale di BPM a null). |

### Contesto narrativo

**Posizione:** 3° traccia. Primo groove vero, prima ancora compositiva piena.

**Cosa viene prima:** TESSUTO. SOLCO riprende il bass che TESSUTO aveva fatto svanire nella dissoluzione — continuità cinetica.

**Cosa viene dopo:** RESPIRO. Stacco drammatico: dal 129 BPM con kick dub al BPM=null di RESPIRO. Il groove viene interrotto dal respiro stesso della pausa.

**Funzione nella suite:** affermare il peso. Dire "c'è una terra". SOLCO è il primo territorio vero del pianeta. Dopo SOLCO il pubblico sa di cosa è fatto il mondo.

---

## 4. RESPIRO — "pausa"

### Essenza emotiva

Esatto ciò che il nome dice: il respiro tra due groove. La suite si apre, il soffitto diventa cielo, tutto è più alto, più arioso, più maggiore. Nessun ritmo, nessun basso vero — solo accordi in ionian puro (C maggiore senza ombre), una voce che canta frasi medie, un lead che risponde con eco lontane e rare. Tre minuti di apertura completa, dichiarativamente maggiore. È l'unica traccia dove il tempo si espande anziché contrarsi. È anche l'unica con **fondo chiaro** nella palette originale — l'intera suite abita il nero, RESPIRO è l'interruzione visiva oltre che sonora.

Modo **C ionian** (maggiore puro). Nessuna ambiguità modale, nessun colore strano: solo luce.

### Ruolo degli strumenti — tracce precise

| Ch | Ruolo | Cosa fa in RESPIRO |
|---|---|---|
| CH0 | **kick** | **assente.** `density.rhythm = 0`, `velocityCeiling = 0`, `rhythmGrid = null`, `kickNote = null`. |
| CH1 | **percussion** | **assente.** |
| CH2 | **drone** | minimo. `density.texture = 0.05`, `velocityCeiling = 25`. Root C4 (MIDI 60) — **un'ottava più alto** del normale. |
| CH3 | **bass** | presente ma quasi impercettibile. `density.bass = 0.1`, `velocityCeiling = 45`, register 36–48 (C2–C3 — *più alto* del basso di SOLCO/TESSUTO). `bassPattern = null` — segue gli accordi. È il basso più alto e silenzioso della suite. |
| CH4 | **chord** | centrale. `density.harmony = 0.4`, `velocityCeiling = 55`. Register **60–77** (C4–F5) — più alto di tutte le altre tracce, arioso. **4 accordi**, durata per accordo non specificata nel pattern (sustained): `C → Am → F → G`. Cadenza maggiore classica. |
| CH5 | **voice** | presente, espressiva. `voiceEveryBars: 3`, `voicePhraseLen: [5,8]` (frasi medie, "breathing phrases"), `velocityCeiling = 65`, register 67–84. Una frase ogni 3 battute, di media lunghezza. |
| CH6 | **lead** | eco della voice. `leadMode: 'echo'`, `leadProb: 0.25` (raro), register 72–84. "Softer and delayed" — meno forte, in ritardo. |
| CH7 | **arp** | **assente.** `register.arp = [0,0]`. |

**Densità totale:** `{ rhythm: 0, harmony: 0.4, bass: 0.1, melody: 0.25, texture: 0.05 }` — la **più bassa dopo NEBBIA**.

**Tonalità:** C ionian, root MIDI **60** (C4 — un'ottava sopra), BPM = null.

### Arco formale

**Durata totale: 40 bar ≈ 2.7 min** (la più corta della suite). BPM fallback = 60, 1 bar = 4s.

| Fase | Bar | Durata | Cosa succede |
|---|---|---|---|
| germoglio | **12** | ~48s | Primi accordi, respiro che si apre. Il cambio da SOLCO (129 BPM, dub pesante) è drammatico. |
| pulsazione | **16** | ~64s | Voice stabile, eco lead occasionali, accordi completi. Respiro intero. |
| densità | **0** | — | **saltata.** RESPIRO non si addensa mai per definizione. |
| rottura | **0** | — | **saltata.** Non ci sono rotture nella pausa. |
| dissoluzione | **12** | ~48s | Si dilua lentamente verso il silenzio, prepara l'arrivo della MACCHINA. |

### Contesto narrativo

**Posizione:** 4° traccia. **Centro esatto della suite** (posizione mediana delle 7 tracce).

**Cosa viene prima:** SOLCO. Lo stacco è il più drammatico della suite: dal peso dub a 129 BPM al respiro senza tempo.

**Cosa viene dopo:** MACCHINA. Anche qui lo stacco è forte: dalla pausa arriva la macchina industriale a 129 BPM.

**Funzione nella suite:** il **colpo di teatro**. È il momento in cui la suite dichiara che non sta costruendo verso un picco lineare — c'è spazio per respirare. È anche il **punto di reset emotivo**: dopo RESPIRO il pubblico è pronto ad accettare che la seconda metà del concerto sia più intensa. Senza RESPIRO la seconda metà sarebbe solo accumulo.

---

## 5. MACCHINA — "sei dentro"

### Essenza emotiva

Industriale, trance, dorian come SOLCO ma totalmente diverso nel modo di abitarlo. Qui l'**arp 16° è il protagonista**: una macchina melodica che gira a velocità costante, 16 note per battuta, senza respiro. Il kick quasi dritto (4/4 con un push in controtempo). Il hi-hat in 16° stretti in densità (`1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1`). Il basso pumping in 8°. Voce e lead diventano colori sporadici, accenti — non soggetti. Non stai seguendo un cantante, sei dentro una macchina che funziona. D dorian: minore ma con la 6a maggiore (come SOLCO) — non è oscurità disperata, è funzionalità.

Modo **D dorian**. Stesso modo di SOLCO ma senza il dub, senza il peso — qui la 6a maggiore diventa propulsione, non apertura.

### Ruolo degli strumenti — tracce precise

| Ch | Ruolo | Cosa fa in MACCHINA |
|---|---|---|
| CH0 | **kick** | presente e solido. `density.rhythm = 0.8`, `velocityCeiling = 115`. `kickNote = 38` (D2). `rhythmGrid = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,1]` — quasi 4/4 con un push in 16° alla fine. |
| CH1 | **percussion / hi-hat** | **pattern dedicato per fase** (`hatPatterns`). In densità: `[1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1]` — 16° strette, full tilt. `velocityCeiling = 115`. |
| CH2 | **drone** | presente, sostenuto. `density.texture = 0.15`, `velocityCeiling = 40`. Root D3. |
| CH3 | **bass** | rolling pump. `density.bass = 0.85`, `velocityCeiling = 95`, register 26–45. `bassPattern = [7,0,7,0, 5,0,7,0, 3,0,5,0, 7,0,3,0]` — **8 hit in 16 step**, pattern rullante. Un "basso pompa". |
| CH4 | **chord** | funzionale, non protagonista. `density.harmony = 0.5`, `velocityCeiling = 60`. Register 50–67. **4 accordi × 4 bar = 16 bar** (ciclo **corto**, ripetitivo — più meccanico): `Dm → G → Am → Em`. |
| CH5 | **voice** | accento raro. `voiceEveryBars: 8` (**raro**), `voicePhraseLen: [3,5]` (brevi interiezioni), `velocityCeiling = 80`. Register 62–79. |
| CH6 | **lead** | risposte alla voice, brevi. `leadMode: 'response'`, `leadProb: 0.3`. Register 69–88. |
| CH7 | **arp** | **PROTAGONISTA.** `arpRole: 'protagonist'`, `arpVelScale: 1.0` (velocity piena), `arpRate: 16` (16° — veloce), `arpNotes: 4`. Register 62–81. È la voce principale della traccia. |

**Densità totale:** `{ rhythm: 0.8, harmony: 0.5, bass: 0.85, melody: 0.6, texture: 0.15 }`.

**Tonalità:** D dorian, root MIDI 50 (D3), BPM **129** (stesso di SOLCO — l'energia viene dalla densità, non dalla velocità).

### Arco formale

**Durata totale: 192 bar ≈ 6 min** (uguale a SOLCO).

| Fase | Bar | Durata | Cosa succede |
|---|---|---|---|
| germoglio | **32** | ~60s | **Arp entra da solo** (come il bass in SOLCO). Dichiarazione d'identità meccanica. Hat vuoto. |
| pulsazione | **48** | ~89s | Kick entra, hat in 8° dritti, bass comincia. La macchina si accende. |
| densità | **64** | ~119s | Piena potenza: hat 16° strette, bass pumping, arp continuo. Voice/lead sono solo colori. |
| rottura | **16** | ~30s | La macchina inceppa. Omen→infiltrazione→takeover→residuo. |
| dissoluzione | **32** | ~60s | La macchina si spegne gradualmente. Hat `[1,0,1,0, 0,0,1,0, 0,0,0,0, 1,0,0,0]` — pattern sparso che muore. |

### Contesto narrativo

**Posizione:** 5° traccia. Prima traccia della seconda metà della suite (dopo RESPIRO).

**Cosa viene prima:** RESPIRO. Stacco violento: da BPM=null a 129 BPM con arp 16° e kick.

**Cosa viene dopo:** TEMPESTA. Stesso BPM, stessa famiglia C-maggiore, ma ulteriore scalata di densità e tensione (phrygian).

**Funzione nella suite:** costruire verso il picco. MACCHINA non è ancora il picco (quello è TEMPESTA), è il **preparativo meccanico** — mette il pubblico nel corpo, abitua al 129 BPM persistente, accende la trance. Senza MACCHINA, TEMPESTA sarebbe un salto innaturale dalla pausa al picco.

---

## 6. TEMPESTA — "balli"

### Essenza emotiva

Il picco. Sei mesi e mezzo di picco — densità 96 battute (la fase più lunga di qualsiasi fase di qualsiasi traccia della suite). Non è un climax breve: è un altopiano di intensità massima. E phrygian: il modo più scuro, la b2 che sopra il minore naturale dà tensione mediorientale, drammatica, verticale. La voice e il lead diventano un'unica voce spezzata in due (**hocket** — si alternano nota per nota come una zip), l'arp scende in background come texture, il basso è quasi per ogni beat, il kit batte a 129 BPM senza tregua, gli hat sono polirritmici (3+3+3+3+4). Palette per contrasto: bianco puro su nero, rosso ferita. Il pubblico balla perché non può fare altro — il corpo è già preso.

Modo **E phrygian**. La b2 è tensione verticale, non caduta. In TEMPESTA è il marchio del picco.

### Ruolo degli strumenti — tracce precise

| Ch | Ruolo | Cosa fa in TEMPESTA |
|---|---|---|
| CH0 | **kick** | massimo. `density.rhythm = 0.95`, `velocityCeiling = 120`. `kickNote = 40` (E2 — la tonica della traccia). `rhythmGrid = [1,0,0,0, 1,0,0,0, 1,0,0,1, 1,0,0,0]` — 4/4 con push in controtempo. |
| CH1 | **percussion / hi-hat** | **polirritmico** (additive 3+3+3+3+4). In densità: `[1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,0,1]`. `velocityCeiling = 120`. |
| CH2 | **drone** | `density.texture = 0.3` (**la più alta di tutte le tracce**), `velocityCeiling = 50`. Root E3 (52). |
| CH3 | **bass** | aggressivo, quasi su ogni beat. `density.bass = 0.95`, `velocityCeiling = 100`, register 28–47. `bassPattern = [7,0,0,5, 0,3,0,0, 7,0,5,0, 3,0,0,7]` — **7 hit in 16 step**, sopratutto in controtempo. Il più denso della suite. |
| CH4 | **chord** | mantiene il modo. `density.harmony = 0.5`, `velocityCeiling = 65`. Register 52–69. **4 accordi × 2 bar = 8 bar** (ciclo **cortissimo**, incalzante): `Em → F → Dm → Am`. L'F sopra E phrygian è il **bII caratteristico** del modo — tensione pura. |
| CH5 | **voice** | sempre attiva. `voiceEveryBars: 1` (ogni bar), `voicePhraseLen: [8,12]` (frasi lunghe, intrecciate), `velocityCeiling = 85`. Register 64–81. |
| CH6 | **lead** | **hocket con voice.** `leadMode: 'hocket'`, `leadProb: 1.0`. "They are one instrument split in two" — una nota voice, la successiva lead, si alternano a zip. Register 72–93 — il più alto della suite. |
| CH7 | **arp** | retrocede a texture. `arpRole: 'texture'`, `arpVelScale: 0.4` (0.65 con MUSIC_EXPERIMENT ON), `arpRate: 16`, `arpNotes: 6` (pattern largo). Register 64–84. Non più protagonista come in MACCHINA — qui è solo sfondo. |

**Densità totale:** `{ rhythm: 0.95, harmony: 0.5, bass: 0.95, melody: 0.7, texture: 0.3 }` — la **più densa in assoluto**.

**Tonalità:** E phrygian, root MIDI 52 (E3), BPM **129**. La b2 è il marchio del picco.

### Arco formale

**Durata totale: 200 bar ≈ 6.2 min** (la più lunga della suite).

| Fase | Bar | Durata | Cosa succede |
|---|---|---|---|
| germoglio | **24** | ~45s | **Il più corto** — build rapidissimo al picco, non c'è tempo per ambientarsi. |
| pulsazione | **32** | ~60s | Kit intero, hat `[1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0]` asimmetrico. |
| densità | **96** | **~179s** | **Il picco dura 3 minuti.** È la fase più lunga di tutta la suite. Non è un climax, è un **altopiano**. Hat polirritmico pieno, voice+lead in hocket costante, bass denso. |
| rottura | **16** | ~30s | Omen→infiltrazione→takeover→residuo. Hat `[1,1,1,1, 1,0,1,1, 1,1,0,1, 1,1,1,0]` — quasi pieno con buchi. |
| dissoluzione | **32** | ~60s | Rientro graduale, hat sparsa `[1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0]`. |

### Contesto narrativo

**Posizione:** 6° traccia. **Picco energetico assoluto della suite**.

**Cosa viene prima:** MACCHINA. Stessa famiglia C-maggiore, stesso BPM: la transizione è fluida tecnicamente. TEMPESTA prende il testimone dalla MACCHINA e porta il livello oltre.

**Cosa viene dopo:** RITORNO. Lo stacco è emotivo, non tecnico: dal picco all'addio. Cambio di BPM (86), cambio di modo (A aeolian — minore naturale).

**Funzione nella suite:** far scaricare. Dopo TEMPESTA il pubblico ha dato tutto. Non c'è nulla di più energico nella suite. Se TEMPESTA funziona, RITORNO può permettersi di essere esposto e fragile — il pubblico è già vuoto e ricettivo.

---

## 7. RITORNO — "ti rilascia"

### Essenza emotiva

L'addio. Non c'è più rottura — solo discesa. La suite non aspira più a costruire nulla, sta lasciando andare. A aeolian (minore naturale come TESSUTO, ma ora con il peso di tutto ciò che è passato). 86 BPM (lo stesso di TESSUTO — la suite torna a un tempo già conosciuto, come un'eco lontana dell'inizio). Voice sola, esposta, lunghe frasi (6–10 note); lead che risponde rare volte come un'eco che arriva da molto lontano; arp che muore (nasce in pulsazione, scompare prima della fine). Bass sparso, due note in 16 step, come gocce che cadono. La fase più importante è la **dissoluzione di 48 battute** — due minuti di addio prolungato. Nessun kick dritto, solo impulsi sparsi. Palette: lavanda e panna su nero — i colori della sera.

Modo **A aeolian**. Stesso modo di TESSUTO, ma il contesto è opposto: allora "qualcosa emerge", ora "qualcosa si ritira".

### Ruolo degli strumenti — tracce precise

| Ch | Ruolo | Cosa fa in RITORNO |
|---|---|---|
| CH0 | **kick** | rarefatto, dissolvente. `density.rhythm = 0.4`, `velocityCeiling = 85`. `kickNote = 45` (A2 — la tonica). `rhythmGrid = [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0]` — 2 hit in 16 step, sparsi. |
| CH1 | **percussion** | `velocityCeiling = 85`. |
| CH2 | **drone** | presente, basso. `density.texture = 0.1`, `velocityCeiling = 35`. Root A3 (57). |
| CH3 | **bass** | che scompare. `density.bass = 0.3`, `velocityCeiling = 70`, register 33–50. `bassPattern = [0,0,0,0, 0,7,0,0, 0,0,0,0, 5,0,0,0]` — **2 hit in 16 step**. Il più sparso della suite. |
| CH4 | **chord** | sostegno. `density.harmony = 0.5`, `velocityCeiling = 55`. Register 55–72. **4 accordi**: `Am → F → C → Em`. Cadenza minore classica di chiusura. |
| CH5 | **voice** | **protagonista esposta.** `voiceEveryBars: 2` (ogni 2 bar), `voicePhraseLen: [6,10]` (frasi **lunghe**, esposte), `velocityCeiling = 70`. Register 64–81. "Voice presente — è il cuore". |
| CH6 | **lead** | eco lontana e rara. `leadMode: 'echo'`, `leadProb: 0.35`. "Non sempre — momenti di solitudine". Register 69–84. |
| CH7 | **arp** | **muore.** `arpRole: 'dying'`, `arpVelScale: 0.5` (fading), `arpRate: 8`, `arpNotes: 3` (minimo). Register 60–79. Presente solo nella pulsazione, poi scompare completamente. |

**Densità totale:** `{ rhythm: 0.4, harmony: 0.5, bass: 0.3, melody: 0.5, texture: 0.1 }`.

**Tonalità:** A aeolian, root MIDI **57** (A3 — *stessa classe di root* di TESSUTO, chiudendo il cerchio tonale), BPM **86** (*uguale* a TESSUTO, "winding down").

### Arco formale

**Durata totale: 128 bar ≈ 6 min** (con MUSIC_EXPERIMENT ON diventa 80 bar ≈ 3.7 min).

| Fase | Bar | Durata | Cosa succede |
|---|---|---|---|
| germoglio | **24** | ~67s | Apertura sobria, drone + primi accordi. |
| pulsazione | **24** | ~67s | Voice entra stabile, arp morente fa un'ultima apparizione, bass sparso. |
| densità | **32** | ~89s | "Last moment of presence" — il punto più pieno di RITORNO, che comunque è sotto MACCHINA/TEMPESTA. Voice esposta, lead eco, arp già sparito. |
| rottura | **0** | — | **saltata.** "No rupture — only descent". Non c'è più nulla da rompere. |
| dissoluzione | **48** | **~134s** | **Il più lungo della suite.** Due minuti di addio prolungato. Tutto si dilua verso il silenzio. |

### Contesto narrativo

**Posizione:** 7° e ultima traccia. Chiude la suite.

**Cosa viene prima:** TEMPESTA. Lo stacco è totale: dal picco denso 129 BPM phrygian al congedo rarefatto 86 BPM aeolian. Dopo il picco il pubblico è pronto per il vuoto.

**Cosa viene dopo:** il silenzio dopo il concerto. RITORNO si dissolve nel nulla — non c'è un'altra traccia che la succede, la dissoluzione è la fine.

**Funzione nella suite:** rilascio. La parola nei commenti italiani è "ti rilascia". Il concerto non finisce, ti lascia andare. La simmetria con NEBBIA è esplicita: stessa classe di root (A), stesso BPM base lento, stessa struttura rarefatta — ma l'arco è invertito (NEBBIA costruisce, RITORNO scioglie). Il pianeta torna alla sospensione iniziale, ma modificato dall'esperienza della suite.

---

## Quadro sinottico finale

| # | Traccia | BPM | Modo | Durata | Densità media | Ruolo dominante | Fase più lunga |
|---|---|---|---|---|---|---|---|
| 1 | NEBBIA | — | C lydian | 4.8 min | 0.17 | voice | germoglio (32b) |
| 2 | TESSUTO | 86 | D aeolian | 5.6 min | 0.27 | chord + lead | pulsazione/densità (32b) |
| 3 | SOLCO | 129 | G dorian | 6.0 min | 0.50 | bass + kick | densità (64b) |
| 4 | RESPIRO | — | C ionian | 2.7 min | 0.16 | voice | pulsazione (16b) |
| 5 | MACCHINA | 129 | D dorian | 6.0 min | 0.58 | arp | densità (64b) |
| 6 | TEMPESTA | 129 | E phrygian | 6.2 min | 0.63 | voice+lead hocket | **densità (96b)** |
| 7 | RITORNO | 86 | A aeolian | 6.0 min | 0.30 | voice | **dissoluzione (48b)** |

**Simmetrie strutturali:**
- **NEBBIA ↔ RITORNO**: stessa classe di root (anche se modi diversi), BPM lenti/assenti, voice protagonista, strutture rarefatte, simmetria d'arco (costruzione/scioglimento).
- **TESSUTO ↔ RITORNO**: stesso BPM (86), stesso modo (A aeolian vs D aeolian, stessa famiglia minore), stesso ruolo del bass (entra ed esce).
- **SOLCO ↔ MACCHINA**: stesso BPM (129), stesso famiglia modale (dorian), ma opposti nella struttura (dub grave vs mechanical trance).
- **MACCHINA ↔ TEMPESTA**: stesso BPM (129), stessa famiglia C-maggiore, continuità diretta (MACCHINA prepara TEMPESTA).

**Arco dinamico dell'intera suite** (basato su `density` moltiplicata):

```
NEBBIA ──────┐                                    ┌───── RITORNO
             ↓                                    ↑
          TESSUTO ── SOLCO ── RESPIRO ── MACCHINA ── TEMPESTA
                              (valley)              (peak)
```

RESPIRO è la valle; TEMPESTA è il picco; la suite è asimmetrica (il picco è verso la fine, non al centro).

---
<!-- knowledge-graph links -->
[[02-MUSIC]] [[tracks.js]] [[VISUAL-VISION]] [[STATUS]]
