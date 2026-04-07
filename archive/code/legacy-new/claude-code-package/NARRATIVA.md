# MACH:INE II — NARRATIVA DELL'ARCO CONCERTISTICO

## La forma

Il concerto ha una forma a doppia onda:

```
caos → ordine → complessità → caos → iper-ordine
```

```
DERIVA    segnale non ancora nato, rumore strutturato
CRISTALLO primo battito, segnale fragile che emerge
ABISSO    il segnale scende nel buio, diventa rituale
TERRENO   il segnale trova calore e groove
MECCANICA il segnale si moltiplica, diventa sistema
VORTICE   il sistema collassa in energia pura
SOLCO     l'energia si cristallizza in mantra
```

Non è una rampa lineare. È una spirale: si torna a passare dagli stessi stati emotivi (staticità, pulsazione, densità) ma ogni volta a un livello di energia diverso. DERIVA e SOLCO sono entrambi ipnotici — ma uno è vuoto, l'altro è pieno.


## Mappa armonica

```
DERIVA      A Lydian       — luce, sospensione
CRISTALLO   E Lydian       — quinta di A, luce che si concentra
ABISSO      Bb Phrygian    — tritono da E, caduta nel buio
TERRENO     D Dorian       — calore, centro modale
MECCANICA   C# Dorian      — un semitono sotto D, slittamento
VORTICE     E Phrygian     — E ritorna ma scuro
SOLCO       G Dorian       — quarta di D, risoluzione
```

Note condivise tra coppie consecutive:

| Transizione | Da | A | Note condivise | Intervallo chiave |
|---|---|---|---|---|
| 1 | A Lydian | E Lydian | E, F#, G#, C# | quinta giusta (A→E) |
| 2 | E Lydian | Bb Phrygian | E, B (enarmonico) | tritono (E→Bb) |
| 3 | Bb Phrygian | D Dorian | E(Fb), B(Cb) | terza maggiore (Bb→D) |
| 4 | D Dorian | C# Dorian | E, B | semitono discendente (D→C#) |
| 5 | C# Dorian | E Phrygian | E, B | terza minore (C#→E) |
| 6 | E Phrygian | G Dorian | C, D, F, G | terza minore (E→G) |

Le note E e B sono il filo rosso di tutto il concerto — presenti in ogni coppia di transizione. Questo non è un caso. E e B sono il quinto e il secondo grado di A (il punto di partenza), e formano la triade di E (la nota che ritorna tre volte: come tonalità di CRISTALLO, come nota condivisa ovunque, come tonalità di VORTICE).


## Mappa BPM

```
— → 54 → 76 → 72 → 98 → 138 → 128
     +∞%  +41%  -5%   +36%  +41%  -7%
```

Due decelerazioni: ABISSO→TERRENO (-5%) e VORTICE→SOLCO (-7%). Entrambe segnano un cambio di qualità dell'energia: da oscuro a caldo (3), da frenetico a ipnotico (6). La decelerazione non è perdita di energia — è condensazione.


---

## Le 6 transizioni

### T1: DERIVA → CRISTALLO — "Respiro condiviso"

**Concetto**: Il senza-tempo si cristallizza in un primo battito.

**Gesto armonico**: Il drone di DERIVA (A, nota 57) glida verso E (nota 52 o 64) negli ultimi 30 secondi di dissoluzione. Il D# di A Lydian (nota 63) è la sensibile di E — la voice di DERIVA dovrebbe suonare D# come ultima nota significativa prima del silenzio, creando tensione che solo CRISTALLO risolverà.

**Gesto ritmico**: I grain di DERIVA (attualmente aperiodici, triggerati da centroide audio) cominciano a raggrupparsi. Non quantizzati su una griglia, ma con una tendenza crescente a cadere a intervalli regolari. È un proto-ritmo che anticipa i 54bpm di CRISTALLO senza mai arrivarci.

**Gesto strutturale**: DERIVA cresce fino a ~70% densità, poi si svuota. 2-3 secondi di solo drone (ora su E). CRISTALLO entra con solo shimmer arpeggios altissimi, senza kick. Il kick arriva dopo 16 battute (circa 71 secondi a 54bpm). Il primo kick è un evento.

**Implementazione**:
- `composer3.js` dissoluzione: aggiungere `droneGlideTarget` che lerpa da 57 a 64 su 30 secondi
- `composer3.js` dissoluzione: aggiungere `grainRhythmicity` (0→0.6) che bias il timing dei grain verso multipli di (60/54/4) secondi
- `composer3.js` dissoluzione: voice suona nota 63 (D#) come ultimo evento prima del silenzio
- `composer5.js` germoglio: PHASE_PRESENCE kick a 0.0 per i primi 16 beat, poi lerp a 0.3
- Sequencer: sovrapporre gli ultimi 30s di DERIVA con i primi 30s di CRISTALLO (overlap armonico)

**Riferimento estetico**: L'inizio di Selected Ambient Works 85-92 di Aphex Twin — il momento in cui il silenzio diventa suono.


### T2: CRISTALLO → ABISSO — "Frattura"

**Concetto**: La luce si rompe. Il tritono E→Bb è il salto più violento del concerto. Non va ammorbidito — va preparato come un evento sismico.

**Gesto armonico**: CRISTALLO in dissoluzione introduce micro-cluster — le note degli arpeggi shimmer cominciano a includere "errori": note fuori scala (Bb, F) che infiltrano E Lydian. Non rumore: note precise che appartengono a Bb Phrygian inserite nel tessuto di CRISTALLO. Il grain si frammenta — stuttering, come un segnale digitale che perde coerenza.

**Gesto ritmico**: Il tempo di CRISTALLO (54bpm) si destabilizza. Non accelera — il clock jitter aumenta. Ogni beat arriva leggermente prima o dopo del previsto. L'orologio interno si sta rompendo.

**Gesto strutturale**: L'ultima nota udibile di CRISTALLO è un E5 lungo (nota 76). 1.5 secondi di silenzio. Poi il drone di ABISSO entra dal basso: Bb1 (nota 46), tre ottave sotto. Per un istante brevissimo (~500ms) il E5 di CRISTALLO e il Bb1 di ABISSO coesistono — il tritono risuona. Poi E svanisce e si è dentro ABISSO.

**Implementazione**:
- `composer5.js` dissoluzione: aggiungere `infiltrationNotes` — pool di note da Bb Phrygian che vengono mixate negli arpeggi con probabilità crescente (0→30%)
- `composer5.js` dissoluzione: aggiungere `clockJitter` che aggiunge ±(0→15%) variazione al timing dei beat
- `composer5.js` dissoluzione: forzare ultima nota a 76 (E5) con velocity decrescente e durata lunga
- `composer6.js` germoglio: drone parte da velocity 1 e cresce lentamente (fade in di 10 secondi)
- Sequencer: 1.5s di silenzio reale (nessun engine attivo) come cue dedicato — primo vero vuoto del concerto

**Riferimento estetico**: Autechre — "Gantz Graf". Il momento in cui la struttura collassa.


### T3: ABISSO → TERRENO — "Osmosi"

**Concetto**: La transizione invisibile. 76→72 bpm, quasi impercettibile. Il pubblico non deve poter dire quando ABISSO è finito e TERRENO è iniziato.

**Gesto armonico**: ABISSO (Bb Phrygian) e TERRENO (D Dorian) condividono le note E e B (come Fb e Cb in Phrygian). Il basso di ABISSO nella dissoluzione abbandona la root Bb e comincia a gravitare verso queste note condivise: suona B (nota 47/59 — la Cb di Phrygian, che è anche la sesta di D Dorian) come pedale. Sopra questa B statica, le armonie scivolano da Phrygian a Dorian. Il drone muta da Bb (46) a D (50) passando attraverso B (47) — non come glide ma come due cambi discreti: Bb→B→D, ognuno tenuto per 8 secondi.

**Gesto ritmico**: Il kick di ABISSO (heartbeat) e quello di TERRENO (dub) sono quasi allo stesso tempo. La transizione usa questo: il kick non si ferma mai. Il pattern cambia dal heartbeat rituale al dub push, ma il battito non si interrompe. È un cambio di carattere, non di struttura.

**Gesto strutturale**: Crossfade lunghissimo (45-60 secondi). ABISSO e TERRENO coesistono con i canali primari che si intrecciano (ABISSO: kick, drone, bass → TERRENO: kick, bass, chords). Il grain è il canale di passaggio — il grain sedimentale di ABISSO si trasforma nel grain dub di TERRENO.

**Implementazione**:
- `composer6.js` dissoluzione: bass suona nota 47 (B/Cb) come pedale negli ultimi 20 secondi
- `composer6.js` dissoluzione: drone sequenza Bb(46)→B(47)→D(50) con 8s per nota
- `composer.js` germoglio: primo kick pattern (single downbeat) entra subito, ma con velocity bassissima (30) che cresce
- Sequencer: overlap di 60 secondi, fades incrociati lentissimi. Nessun momento di silenzio.
- PRIMARY_CH: durante overlap ABISSO tiene [0,2] e TERRENO tiene [3,4] — il bass è il terreno conteso che passa da uno all'altro

**Riferimento estetico**: Gas — "Narkopop". Strati che si dissolvono l'uno nell'altro senza cuciture.


### T4: TERRENO → MECCANICA — "Slittamento"

**Concetto**: Stesso modo, un semitono sotto. D Dorian → C# Dorian. Il mondo non cambia forma — scivola di un gradino. È il momento più sottile e più inquietante del concerto.

**Gesto armonico**: Il basso di TERRENO nella dissoluzione comincia a detunarsi — pitch bend MIDI verso il basso di un semitono. Non istantaneo: 16 battute (circa 13 secondi a 72bpm) di glide continuo da D a C#. Le chord di TERRENO nell'ultimo giro suonano una voicing ambigua: [50, 53, 57] (D, F, A) che diventa [49, 52, 56] (C#, E, G#) — stesse distanze intervallari, tutto spostato di -1. Il pubblico sente che qualcosa è cambiato ma non sa cosa.

**Gesto ritmico**: Il tempo accelera durante la transizione. Non linearmente — il clock di TERRENO (72bpm) e quello di MECCANICA (98bpm) si sovrappongono creando un battimento poliritmico. 72:98 si semplifica a ~3:4 — per 8-12 secondi il kick di TERRENO (ogni 3 sedicesimi) e quello di MECCANICA (ogni 4 sedicesimi) creano un pattern composto che è più complesso di entrambi. Poi TERRENO svanisce e resta solo il 98.

**Gesto strutturale**: MECCANICA entra con un solo layer (il layer armonico, il più lento a 4 battute). Gli altri 3 layer (ritmico/3bar, testuale/5bar, melodico/7bar) entrano uno per volta ogni 8 bar, come un motore che si accende cilindro per cilindro.

**Implementazione**:
- `composer.js` dissoluzione: pitch bend progressivo su CH3 (bass) — bend da 8192 (centro) a ~7700 (-100 cents, un semitono) su 16 beat
- `composer.js` dissoluzione: ultima chord trasposta di -1 MIDI note ciascuna
- `composer2.js` germoglio: i 4 layer non partono insieme — offset di ingresso: layer 0 (bar 0), layer 1 (bar 8), layer 2 (bar 16), layer 3 (bar 24)
- Sequencer: overlap di 12 secondi. Il poliritmia 72:98 è intenzionale e deve essere udibile.

**Riferimento estetico**: Amon Tobin — "ISAM". La macchina che si assembla pezzo per pezzo.


### T5: MECCANICA → VORTICE — "Convergenza"

**Concetto**: Il punto di massima accelerazione (98→138, +41%). I 4 layer di MECCANICA sono progettati per non allinearsi quasi mai (cicli primi: 3/4/5/7 bar). Ma esiste un punto di convergenza ogni 420 bar (~72 minuti) dove tutti e 4 coincidono. Nella dissoluzione, forziamo quella convergenza.

**Gesto armonico**: C# Dorian → E Phrygian. C# e E condividono la nota E (primo grado di Phrygian, terzo grado di C# Dorian). Nella convergenza di MECCANICA, tutti e 4 i layer suonano simultaneamente la nota E — è l'unico momento del concerto in cui MECCANICA ha una nota unica su tutti i layer. Quel E è il ponte verso VORTICE.

**Gesto ritmico**: Il momento della convergenza è il trigger. Dopo che tutti i layer colpiscono insieme, il tempo accelera. Non gradualmente — a scatti. Il clock salta da 98 a 108 a 118 a 128 a 138 in 4 step, uno per battuta. Ogni salto coincide con un colpo di kick sempre più forte. È un lancio, non un fade.

**Gesto strutturale**: MECCANICA al punto di convergenza suona un singolo accordo fortissimo con tutti i layer allineati. Poi 1 beat di silenzio (0.6 secondi). Poi VORTICE parte a 138bpm con il kick tribale asimmetrico già a piena intensità — non germoglio, ma pulsazione. L'energia non deve scendere. Questo è l'unico motore che salta la fase germoglio quando arriva via sequencer.

**Implementazione**:
- `composer2.js` dissoluzione: forzare allineamento dei 4 layer — tutti i crossingTimer a 0 simultaneamente
- `composer2.js` dissoluzione: tutti i layer suonano nota E (64) all'allineamento, velocity 127
- `composer2.js`: clock accelerante post-convergenza — stepMs passa da 153ms (98bpm) a 108ms (138bpm) in 4 step
- `composer4.js`: nuovo parametro `entryPhase` — se attivato dal sequencer con flag, parte da 'pulsazione' invece che 'germoglio'
- Sequencer: cue 'activate_hot' che attiva VORTICE con entryPhase='pulsazione'

**Riferimento estetico**: Surgeon live. Il momento in cui il kick tribale entra e il dancefloor esplode.


### T6: VORTICE → SOLCO — "Atterraggio"

**Concetto**: 138→128. Il caos si organizza. La frenesia tribale diventa mantra meccanico. Non è una discesa — è una messa a fuoco.

**Gesto armonico**: E Phrygian → G Dorian. Condividono C, D, F, G (4 note). La transizione sale di terza minore (E→G), che è un innalzamento. Nonostante il BPM scenda, il centro tonale sale — contrasto che crea la sensazione di "atterraggio su un piano più alto".

**Gesto ritmico**: VORTICE a 138bpm ha kick tribali asimmetrici e ghost pattern densi. Nella dissoluzione, i pattern si semplificano progressivamente — i ghost spariscono, il kick perde le sincopi, i micro-loop si allungano. Lentamente emerge un 4/4 dal caos tribale. Il BPM decelera: 138→134→130→128 su 16 bar. Al momento in cui arriva il 4/4 puro di SOLCO, il pubblico lo sente come inevitabile, non come un nuovo inizio.

**Gesto strutturale**: VORTICE e SOLCO si sovrappongono per 30 secondi. Il kick di VORTICE (asimmetrico, che si sta regolarizzando) e il kick di SOLCO (4/4 fisso) creano un interlocking che si risolve quando VORTICE svanisce. L'hi-hat di SOLCO entra prima del kick — è il primo segnale del nuovo mondo.

**Implementazione**:
- `composer4.js` dissoluzione: kick pattern force → pattern [1] (4-on-the-floor), ghost pattern → [2] (sparso) poi [0] (off)
- `composer4.js` dissoluzione: BPM decelera — stepMs aumenta da 108ms a 117ms (128bpm) su 16 bar
- `composer7.js` germoglio: hi-hat (CH1) entra 8 beat prima del kick — presence [0, 0.5, 0, 0, 0, 0, 0, 0] per i primi 8 beat, poi kick entra
- Sequencer: overlap 30 secondi. VORTICE fade out mentre si regolarizza, SOLCO fade in dal hi-hat.

**Riferimento estetico**: Ben Klock. Il momento in cui il beat si semplifica e il groove diventa ipnotico.


---

## Concetti trasversali

### Il drone come tessuto connettivo

CH2 (Drone) è l'unico canale presente in tutti e 7 i motori (anche VORTICE, indirettamente via chord sustain). Il drone non dovrebbe mai fermarsi completamente durante il concerto — anche nei momenti di silenzio tra engine, un residuo di drone a velocity bassissima (5-10) dovrebbe persistere. Questo crea continuità subliminale.

Le note del drone tracciano un arco proprio:

```
A (57) → E (64) → Bb (46) → D (50) → C# (49) → E (52) → G (55)
```

Questo arco contiene un palindromo nascosto: A→E...E→G. La nota E appare 3 volte. Se il drone glida tra queste note durante le transizioni (invece di tagliare), il pubblico percepisce un movimento armonico continuo sotto le discontinuità di superficie.


### CH5 (Voice) come filo melodico

Ogni motore ha un comportamento Voice diverso (Markov in TERRENO, brightness-driven in DERIVA, motivi fissi in VORTICE). Ma le note che ciascun Voice suona possono essere vincolate a raccontare un arco melodico complessivo:

- DERIVA voice: finisce su D# (63) — sensibile di E
- CRISTALLO voice: usa E, G#, B (triade di E)
- ABISSO voice: Bb, Db, F (triade di Bbm) — il lato oscuro
- TERRENO voice: D, F, A (triade di Dm) — il calore
- MECCANICA voice: C#, E, G# — stessa triade di CRISTALLO ma trasposta
- VORTICE voice: E, F, E, B (motivo fisso E→F→E→B)
- SOLCO voice: G, Bb, D — triade di Gm, risoluzione

Se messe in sequenza, le prime note di ogni voice tracciano: D#→E→Bb→D→C#→E→G. È quasi lo stesso arco del drone. Non serve che il pubblico lo percepisca consciamente — è struttura profonda.


### Fase-identità per motore

Non tutte le fasi devono avere lo stesso peso in ogni motore. Ogni engine dovrebbe avere una fase "core" che dura proporzionalmente di più e definisce il suo carattere:

| Engine | Fase core | Perché |
|---|---|---|
| DERIVA | germoglio | L'engine È emergenza. La maggior parte del tempo è nascita. |
| CRISTALLO | pulsazione | Lo shimmer ripetitivo È il motore. |
| ABISSO | densità | Il rituale guadagna peso stratificando. |
| TERRENO | germoglio+densità | Il dub vive tra spazio e peso. |
| MECCANICA | densità | I 4 layer convergono. |
| VORTICE | densità→rottura | L'energy peak del concerto. Rottura come identità. |
| SOLCO | pulsazione | Il mantra ipnotico È la ripetizione. |

Durate suggerite (secondi):

| Engine | germoglio | pulsazione | densità | rottura | dissoluzione | TOTALE |
|---|---|---|---|---|---|---|
| DERIVA | 120 | 60 | 45 | — | 45 | 270 |
| CRISTALLO | 45 | 90 | 60 | — | 45 | 240 |
| ABISSO | 30 | 60 | 120 | 30 | 60 | 300 |
| TERRENO | 60 | 60 | 90 | 30 | 60 | 300 |
| MECCANICA | 30 | 60 | 120 | 30 | 60 | 300 |
| VORTICE | 15 | 45 | 90 | 60 | 30 | 240 |
| SOLCO | 20 | 120 | 90 | 30 | 40 | 300 |

Totale lordo: ~1950s (~32.5 min). Con overlap di transizioni il concerto netto è ~28-30 min.


### Assenza come strumento

Nella musica IDM, quello che non c'è è importante quanto quello che c'è. In questo progetto i canali che tacciono definiscono un motore tanto quanto quelli che suonano:

- DERIVA: niente kick, niente bass. Assenza totale di fondamenta ritmiche.
- CRISTALLO: kick quasi assente in germoglio. Il ritmo è suggerito, non imposto.
- ABISSO: niente lead. Il rituale non ha melodia individuale — è collettivo.
- SOLCO: niente lead. Il techno berlinese non ha ego, solo groove.

Questa mappa di assenze dovrebbe essere rispettata rigorosamente. La tentazione di "aggiungere qualcosa" va resistita. Lo spazio vuoto è il contrasto che rende pieno ciò che c'è.


### Velocity come espressione progettuale

SOLCO usa già il velocity sweep (sinusoide su 8 bar che simula un filtro LP). Questo concetto può essere esteso:

- TERRENO: bass velocity che segue una curva dub — forte sul downbeat, ghost sul resto. Gap tra 95 e 40.
- MECCANICA: velocity dei 4 layer che segue la loro fase — al crossing point, velocity al massimo. Tra i crossing, velocity più bassa. I layer respirano.
- VORTICE: micro-loop velocity che cresce con la densità della fase. In densità, velocity uniformemente alta (no dinamica = muro sonoro).

L'idea: non tutto il range dinamico è uguale. Alcuni motori sono espressivi (TERRENO, DERIVA), altri sono meccanici (SOLCO, VORTICE). Questa differenza di dinamismo è parte dell'arco narrativo.


---

## Struttura del sequencer aggiornata

Con SOLCO e le transizioni narrative, il sequencer va riscreitto. Proposta a 6 atti:

```
ATTO I   — EMERGENZA    (0:00–4:30)   DERIVA → CRISTALLO
ATTO II  — DISCESA      (4:30–9:30)   CRISTALLO → ABISSO
ATTO III — RISALITA     (9:30–14:30)  ABISSO → TERRENO
ATTO IV  — MACCHINA     (14:30–19:30) TERRENO → MECCANICA
ATTO V   — VORTICE      (19:30–24:00) MECCANICA → VORTICE
ATTO VI  — SOLCO        (24:00–30:00) VORTICE → SOLCO → fine
```

Ogni atto contiene: engine principale che attraversa le sue 5 fasi + coda di transizione che prepara il prossimo.

I momenti-firma si ridistribuiscono:

| Momento | Tempo | Descrizione |
|---|---|---|
| FRATTURA | ~8:00 | 1.5s di silenzio reale tra CRISTALLO e ABISSO (il tritono) |
| CONVERGENZA | ~22:00 | I 4 layer di MECCANICA convergono. Unico momento di allineamento totale. |
| GELO | ~25:00 | A metà di SOLCO: il visual freeze. Il beat continua ma il visivo si ferma. |
| VUOTO | ~29:00 | SOLCO→fine: hard cut. Tutto tace. Drone residuo a velocity 5. Poi nero. |


---

## Implementazione — ordine di priorità

1. **Drone glide system** — meccanismo universale: ogni composer accetta un `droneGlideTarget` e lerpa la nota drone verso quel target. Implementare una volta in un modulo condiviso.

2. **Transition hooks nei composer** — ogni composer espone `prepareTransitionOut(nextEngine)` e `receiveTransitionIn(prevEngine)`. Il sequencer chiama questi metodi durante l'overlap. Il composer sa come preparare la sua dissoluzione in base a chi viene dopo.

3. **Clock morphing** — per T5 e T6: il clock di un engine può essere modificato durante la dissoluzione. `setTempoOverride(targetBpm, durationBars)` nel sequencer che interpola il stepMs.

4. **Entry phase override** — per T5: VORTICE può partire da pulsazione se attivato via sequencer. Flag `entryPhase` nel cue.

5. **Infiltration notes** — per T2: CRISTALLO accetta un pool di note "infiltranti" che vengono mixate con probabilità crescente.

6. **Grain rhythmicity** — per T1: DERIVA accetta un parametro (0→1) che quantizza progressivamente il timing dei grain.

7. **Sequencer rewrite** — 6 atti con SOLCO, momenti-firma ridistribuiti, overlap intelligenti con transition hooks.
