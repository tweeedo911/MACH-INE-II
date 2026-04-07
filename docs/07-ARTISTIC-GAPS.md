# ARTISTIC GAPS — Cross-reference Ricerche × Implementazione × Critica

> Documento strategico. Generato 2026-04-07 a partire da:
> - `archive/docs/old/RESEARCH-V4-VISUAL-DIRECTION.md` (14 artisti + 14 tecniche generative + 7 designer + 10 lezioni cinema + 30 operazioni atomiche)
> - `archive/docs/old/RESEARCH-V4-COMPOSITIONAL-DIRECTION.md` (12 artisti + 8 tecniche strutturali + 4 principi generativi + arco emotivo in 5 movimenti)
> - Production team critique (sessione 2026-04-07)
>
> **Scopo:** base per decidere la prossima strategia di sviluppo artistico.
> Aggiornare quando una voce viene implementata.

---

## PARTE 1 — Musica: gap per impatto artistico

### 🔴 MANCANTE — impatto critico

| Fonte ricerca | Tecnica | File target | Note |
|---|---|---|---|
| **Floating Points + Frahm** | **Phrase memory**: seed motif catturato alla nascita della traccia, richiamato in 5 punti dell'arco | `melody-v3.js` | La "voce" di ogni traccia. Senza questo il sistema non ha identità tematica. |
| **Arnalds** | **Call-response CH5→CH6**: voice propone, lead risponde (stessa frase, registro diverso) | `melody-v3.js` | Le due linee melodiche sono ora indipendenti e parallele, non dialogano. |
| **Aphex Twin** | **Rupture = menace silenziosa**: cluster chords a bassa velocity, NON volume/noise | `melody-v3.js`, `harmony.js` | La rupture attuale modifica solo densità, non il carattere generativo. |
| **Hecker** | **Degradazione musicale**: le voci si semplificano progressivamente lungo l'arco (non si intensificano solo) | `melody-v3.js`, `texture.js` | Controcorrente: il degrado è espressivo quanto l'accumulo. |
| **Burial** | **Room tone CH1**: GRAIN sempre attivo, vel 15-25, cluster stretto [36,38,40,42], dur 25ms | `texture.js` | L'assenza di room tone rende i silenzi "vuoti" invece che "pieni". |
| **Burial** | **Chord overlap**: vecchio accordo sostiene 500-1000ms dentro l'attacco del nuovo | `harmony.js` | Attualmente i cambi accordo sono netti. La sfumatura scalda il suono. |
| **B.4** | **Groove evolution**: ghost note emergence da 0 → 0.25 prob su 8 battute (vel 18-28) | `rhythm.js` | Il groove è statico per traccia. Non cresce. |
| **B.4** | **Bass cycle extension**: pattern 1-bar → 2-bar → 4-bar ogni 16 battute stabili | `bass-v3.js` | Collegato a P5 critica: i pattern bass fissi non evolvono. |
| **B.3** | **Pivot pre-suono**: nota comune suonata 4-8 battute PRIMA del cambio modale | `harmony.js`, `director3.js` | I cambi di modo sono privi di preparazione. Nessuna cerniera. |
| **B.3** | **Modal interchange**: borrow 1 nota da modo parallelo per 2-4 battute, poi ritorno | `harmony.js` | Colore armonico istantaneo senza cambiare modo. Molto efficace. |

### 🟡 PARZIALE — esiste l'infrastruttura, manca la finalizzazione

| Fonte ricerca | Tecnica | Stato attuale | Gap residuo |
|---|---|---|---|
| **Frahm** | Velocity intimacy per fase (25-45 apertura, 55-75 groove, 85-115 climax) | Range esiste in config.js | Non è una curva continua per fase — è un cap. |
| **Four Tet** | Macro-air: 2-3 blackout ritmici per performance (~20%, ~50%, ~75%) | `vuotoTotale` esiste | Non è pianificato nell'arco temporale, è solo gesture manuale. |
| **Hopkins** | Plateau 85-95% per 4-6 min, poi dissoluzione graduale (non "drop") | Arco esiste | Il plateau non è esplicito come stato — il sistema va sempre su e giù. |
| **Eno** | Prime loops (7, 11, 13, 17, 19 step) → combinazione non ripetibile in human timescale | Loop esistono | Lunghezze non sono prime esplicite. LCM non è pensato come composizione. |
| **Sakamoto** | Silence ratio per traccia (RESPIRO deve avere 0.88 silenzio nella fase apertura) | density floor esiste | Non c'è un silence ratio enforced per fase/traccia. |
| **B.7** | Poliritmia 3:4 su CH7 percussion (12 step contro grid 16) | Pattern percussion esiste | Lunghezze sono sempre 16 step. Nessuna poliritmia esplicita. |

### 🟢 IMPLEMENTATO

| Fonte ricerca | Tecnica | File |
|---|---|---|
| **Robin Fox** | Silence = canvas vuoto | `firma.js` vuotoTotale, `render.js` |
| **C.3** | Range constraint per canale (CH0-CH7) | `config.js` |
| **Arco 5 fasi** | Struttura formale in potenze di 2 | `director3.js`, `tracks.js` |
| **char-note boost** | Modal characteristic armonico | `harmony.js` |

---

## PARTE 2 — Visivo: gap per impatto artistico

### 🔴 MANCANTE — impatto critico

| Fonte ricerca | Tecnica | Comp target | Note |
|---|---|---|---|
| **Henke** | **MACCHINA = text-mode terminal**: arp pattern come caratteri ASCII su griglia, ogni nota = un simbolo in una cella specifica | `comp-griglia.js` | MACCHINA è ora astratta. Non è leggibile come "dati che scorrono". Critica P3. |
| **Müller-Brockmann** | **12 colonne per MACCHINA**: tutte le forme allineate a colonne, archi/linee/rettangoli derivati da BPM/RMS | `comp-griglia.js` | Il visivo non è un diagramma della musica — è un disegno sopra la musica. |
| **Kenya Hara** | **RESPIRO: density cap 10%, una sola mark per frase** (*Ma* — la forma è il vuoto) | `comp-negativo.js` | Il density floor esiste ma non c'è un cap max per traccia. |
| **C.8** | **Density cap enforced per traccia**: RESPIRO 10%, NEBBIA 25%, TESSUTO 45%, SOLCO 50%, MACCHINA 55%, TEMPESTA 70% (100% solo rupture takeover) | tutte le comp-* | Nessuna comp ha un massimo. Solo i floor dynamic. |
| **UVA** | **Rule-then-violation**: stabilire una regola visibile per 90s (es. breathing a 0.1 Hz), poi violare una zona del canvas | `comp-liminale.js`, `comp-negativo.js` | Le comp non hanno una "regola dichiarata" — sono cumulative da subito. |
| **UVA** | **RITORNO: 7 linee oscillanti**, una per traccia passata, ognuna con il BPM della traccia originale | `comp-liminale.js` (RITORNO) | RITORNO usa la stessa liminale. Nessuna memoria delle 7 tracce. |
| **D.9** | **RITORNO = memory dei 6 minuti chiave** (snapshot a min 6, 14, 22, 30, 36 come maschere α 0.05-0.15) | `field.js`, `comp-liminale.js` | Il sediment condiviso cattura tutto ma non i momenti specifici. |
| **Kohlberger** | **Flicker dose budget**: max N frame di flicker per minuto (il glitch non ha budget) | `field.js` | Il micro-glitch è probabilistico ma non ha limite di esposizione temporale. |
| **D.7 Kuleshov** | **Black frame come punteggiatura**: 2 frame neri a ogni cambio di traccia | `field.js` | Attualmente solo crossfade 3s. Il nero è un evento cognitivo. |
| **D.4 Eisenstein** | **Hard cut selettivo**: NEBBIA→TESSUTO e TEMPESTA→RITORNO devono essere hard cut (1 frame), non crossfade | `field.js` | Il crossfade 3s uniforma tutto. Alcune transizioni devono "collidere". |
| **B.14 Risograph** | **Misregistration**: accent color renderizzato su Bayer grid offset di 1-2 celle rispetto al primary | tutte le comp-* | Le palette sono già Riso-style (2 spot + paper) ma manca il fringe fisico. |
| **D.1 Brakhage** | **Per-frame seed**: `(performance.now()\|0)` come seed per RNG in ogni comp-* → ogni frame potenzialmente distinto | tutte le comp-* | `Math.random()` non seedato → frame identici tra loro a densità bassa. |

### 🟡 PARZIALE — esiste l'infrastruttura, manca la finalizzazione

| Fonte ricerca | Tecnica | Stato attuale | Gap residuo |
|---|---|---|---|
| **Alva Noto** | Scaffold visibility: la griglia è sempre visibile come frame costante | BG layer sempre presente | Il BG è solo colore pieno. Non è una griglia leggibile come struttura. |
| **Kurokawa** | spawn→crystallize→shatter: ciclo di vita MIDI visivamente completo | LifecycleEvent esiste, ghost/fossil rendono gli stadi | "Shatter" non esiste: la transizione ghost→fossil→dead è invisible. |
| **NONOTAK** | Hold-below-threshold: sotto soglia audio il visivo NON avanza (frame fermo) | `firma.gelo` esiste | Gelo è gesture manuale, non threshold automatico di densità. |
| **Max Cooper** | Una tesi per traccia: ogni comp è una sola idea sviluppata | 6 comp distinte | Le comp accumulano comportamenti. Nessuna ha un'idea compositiva dominante. |
| **Molnar B.1** | disorderField: chaos gradient centro→bordo che cresce con arc progress | — | Non implementato. Semplice da aggiungere come parametro in comp-*. |
| **Freeke B.12** | Phase field: threshold per cella = sin(t + phaseField(x,y)) | — | Sottoutilizzato. Produrrebbe wave motion sull'intera griglia con zero costo. |

### 🟢 IMPLEMENTATO

| Fonte ricerca | Tecnica | File |
|---|---|---|
| **D.8 McLaren** | Glitch = sottrazione (strip, scan-tear, shift, column removal) | `field.js` |
| **4-layer stack** | BG/MG/FG/OVERLAY via layers.js | tutte le comp-* |
| **Rupture 4 stadi smooth** | intensity 0→1 nelle 6 comp-* | tutte le comp-* |
| **trackPalettes** | 5 ruoli per traccia in worldState.palette | `world-state.js`, `director3.js` |
| **Crossfade 3s** | ease-in-out cubico tra tracce | `field.js` |
| **Shared sediment** | decay 0.9997, palimpsesto inter-traccia | `field.js` |
| **Ghost/fossil overlay** | STATE_GHOST + STATE_FOSSIL come dot Bayer desaturati | `field.js` |
| **firma gestures** | gelo / convergenza / vuotoTotale | `firma.js`, `field.js`, `event-register.js` |
| **density floors** | worldState.density.* come floor dinamico in tutte le comp-* | tutte le comp-* |

---

## PARTE 3 — Convergenze critiche (ricerca + critica concordano)

Queste sono le priorità più forti perché emergono da **due fonti indipendenti**.

### 1. Phrase memory / voce riconoscibile
**Ricerca:** Floating Points (motif a 5 punti arco), Frahm (seed motif in EMERSIONE), Arnalds (call-response)
**Critica team:** P1 — ogni traccia deve avere una "voce" riconoscibile
**Gap:** `melody-v3.js` genera note senza memoria. Non c'è un motivo catturato né richiamato.
**Impatto:** senza questo, le 60 minuti sono una texture, non una narrazione.

### 2. Rupture trasforma la generazione, non solo la densità
**Ricerca:** Aphex Twin (menace silenziosa = cluster chords low vel), Hecker (degradazione)
**Critica team:** P2 — rupture deve cambiare il carattere del materiale
**Gap:** `melody-v3.js` e `bass-v3.js` ignorano `rupture.intensity` per le decisioni generative.
**Impatto:** la rupture ora è solo densità + visivo. Non ha voce musicale propria.

### 3. MACCHINA come diagramma leggibile della musica
**Ricerca:** Henke (text-mode), Müller-Brockmann (12 colonne, forme da BPM/RMS)
**Critica team:** P3 — la griglia arp deve essere leggibile come "dati"
**Gap:** `comp-griglia.js` è astratta. Non c'è allineamento a colonne né leggibilità come testo.
**Impatto:** MACCHINA è l'engine più "informatico" del sistema — deve sembrarlo.

### 4. Hard cut vs crossfade uniforme
**Ricerca:** Eisenstein (il taglio crea significato), UVA (rule-then-violation)
**Critica team:** — (non emerso esplicitamente ma implicito nella mancanza di "respiro")
**Gap:** il crossfade 3s è ovunque. NEBBIA→TESSUTO e TEMPESTA→RITORNO devono "collidere".
**Impatto:** tutte le transizioni hanno lo stesso peso. Il sistema non sa punteggiare.

### 5. Density cap per identità di traccia
**Ricerca:** Kenya Hara (RESPIRO = 10% max), C.8 (gradiente Hara→Yokoo)
**Critica team:** — (implicito: le tracce si somigliano troppo visivamente)
**Gap:** ogni comp ha un density floor ma non un cap. Tutte possono saturarsi.
**Impatto:** RESPIRO e TEMPESTA non hanno differenza strutturale di campo.

---

## PARTE 4 — Tecniche ad alto rapporto impatto/costo

Queste non emergono dalla critica ma dalla ricerca, e hanno costo di implementazione basso.

| Tecnica | Impatto atteso | Costo | File |
|---|---|---|---|
| **Risograph misregistration** | Profondità visiva immediata, texture fisica | Basso (offset 1-2 celle nel render) | tutte le comp-* |
| **Per-frame seed** | Ogni frame diventa unico a densità bassa | Basso (1 riga per comp-*) | tutte le comp-* |
| **Room tone CH1** | Il silenzio smette di essere vuoto | Basso (texture.js: note sempre-on low vel) | `texture.js` |
| **Phase field** | Wave motion sull'intera griglia senza costo | Medio (formula per cella) | `comp-liminale.js`, `comp-linee.js` |
| **disorderField Molnar** | Chaos gradient dipendente da arc progress | Basso (parametro additivo per cella) | qualsiasi comp-* |
| **Black frame a transizioni** | Punteggiatura cognitiva forte | Minimo (2 frame ctx.clearRect) | `field.js` |
| **Chord overlap 500ms** | Calore immediato nelle armonie | Basso (nota-off ritardato in harmony.js) | `harmony.js` |

---

## PARTE 5 — Tecniche da non implementare ora (research debt ma non priorità)

Tecniche valide dalla ricerca ma che richiedono refactoring significativo o
rischio architetturale, da rimandare a milestone successive.

- **score.json con 60 pivot pre-composti** (D.2 Frampton / A.12 Barri) — richiede un sistema di scoring separato
- **DLA branching per TESSUTO** (A.14 Nakayama) — nuova primitiva generativa, fuori scope attuale
- **Substrate walker per MACCHINA** (B.7 Tarbell) — nuovo algoritmo di rendering
- **Differential line growth per SOLCO** (B.8 inconvergent) — bello ma richiede struttura dati linea
- **arc-scrubber 10× preview** (A.11) — tool di authoring offline, non modifica runtime
- **Tarik Barri spatial timeline** (A.12) — pre-composizione 2D, cambio di paradigma
- **Fibonacci flicker per TEMPESTA** (D.5) — raffinamento, non fondamento
- **RITORNO swing lines 7 tracce** (A.13 UVA) — bella idea ma dipende da frame snapshot system

---

## PARTE 6 — Proposta roadmap prossima milestone

Basata su impatto artistico × costo implementazione × convergenza critica.

### Sprint A — Musica (carattere e intenzione)
1. **Phrase memory** in `melody-v3.js`: seed motif capture + recall a 5 punti arco
2. **Rupture musicale** in `melody-v3.js` + `bass-v3.js`: `rupture.intensity` guida le decisioni generative
3. **Call-response CH5→CH6** in `melody-v3.js`: dialogo tra voice e lead
4. **Room tone CH1** in `texture.js`: GRAIN sempre-on low vel
5. **Chord overlap** in `harmony.js`: vecchio accordo sustain 500ms dentro il nuovo

### Sprint B — Visivo (identità e leggibilità)
1. **comp-griglia text-mode**: arp row scan leggibile come caratteri, ghost grid sempre in BG
2. **Density cap per traccia** in tutte le comp-*: `CFG.VISUAL.densityCap[track]`
3. **Hard cut selettivo** in `field.js`: NEBBIA→TESSUTO e TEMPESTA→RITORNO escono dal crossfade
4. **Black frame** in `field.js`: 2 frame neri a ogni cambio di traccia
5. **Risograph misregistration** in tutte le comp-*: accent color offset 1-2 celle

### Sprint C — Rifinitura (da fare in ordine di disponibilità)
- Per-frame seed in comp-*
- Room tone enforcement (silence ratio per fase)
- disorderField Molnar per RITORNO
- Phase field per NEBBIA/TESSUTO
- Modal interchange in harmony.js
- Bass cycle extension in bass-v3.js

---

*Aggiornare questo documento quando una voce passa da ❌ a ⚠️ a ✅.*
*Vedi STATUS.md per il backlog operativo corrente.*
