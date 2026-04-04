# MACH:INE II — Roadmap v2.9.0: Semplificazione e Flusso

*Analisi critica compositiva + piano di intervento*
*2026-03-27 — revisione 2*

---

## Diagnosi: perché la seconda metà non funziona

I primi 20 minuti di MACH:INE II sono forti. Ogni motore ha il suo momento di solitudine, l'arco armonico è un viaggio reale, le transizioni sono handoff puliti. Dopo minuto 18, tre problemi convergono e il sistema si perde — ma la diagnosi è più profonda di quanto scritto nella rev.1.

### Problema 1 — Sovrapposizione permanente

I primi 20 minuti: un motore alla volta, overlap solo in transizione.

```
Min 0–7:   DERIVA sola
Min 7–8:   CRISTALLO sola
Min 8–14:  ABISSO sola
Min 14–18: TERRENO solo
```

Dopo minuto 18: 2-3 motori sovrapposti per minuti interi. MECCANICA ha solo 3 minuti da sola prima che SOLCO entri. Il climax ha fino a 6 motori contemporanei.

**Conseguenza hardware:** 2-3 composer = 2-3× note MIDI, 2-3× entità visive, GC pressure, frame drop. Il sistema va in tilt.

### Problema 2 — Salti di BPM irrealistici

```
Attuale:   — → 54 → 76 → 72 → 98 → 128 → 138 bpm
Salti:              +22   -4   +26    +30    +10
```

Il passaggio da 72 (TERRENO) a 98 (MECCANICA) è un salto di 26bpm. Da 98 a 128 (SOLCO) sono altri 30. Nessun DJ al mondo mescolerebbe due tracce con 30bpm di differenza — ti rompe il flow. E VORTICE a 138bpm è un'altra dimensione rispetto al resto del sistema. Il salto totale dai motori ritmici è 72→138: 66bpm di range. Troppo.

### Problema 3 — VORTICE è troppo estremo

138bpm con step sequencer tribale e micro-loop è un motore che appartiene a un altro progetto. Quando arriva dopo MECCANICA (98bpm), l'orecchio non percepisce un'accelerazione — percepisce una *frattura*. In un set Four Tet, il BPM va da ~90 a ~128 nell'arco di ore. 138 non c'entra.

### Problema 4 — Manca continuità ritmica

Ogni motore ha il suo kit ritmico isolato. Quando TERRENO finisce e MECCANICA inizia, il hat scompare e riappare diverso. Non c'è nessun elemento ritmico che attraversi i motori e dia continuità — come il hat che in un set di Four Tet c'è quasi sempre, anche quando cambia tutto il resto.

### Problema 5 — Troppe tonalità dissonanti in overlap

```
Attuale:  A Lyd → Eb Lyd → Bb Phr → D Dor → C# Dor → G Dor → F Phr
```

Sette tonalità distribuite su tutto il cerchio cromatico. Il tritono Bb-D tra ABISSO e TERRENO in overlap è intenzionale, ma aggressivo. C# Dorian → G Dorian è un altro tritono. F Phrygian non ha relazione chiara con nessuno dei precedenti. Ogni transizione è uno strappo armonico.

### Problema 6 — Troppa complessità, troppo poco spazio

MECCANICA con 4 layer a cicli primi, VORTICE con micro-loop e pitch cycling, SOLCO con hocket tecnico — è troppa roba. L'orecchio non ha mai il tempo di godersi la ripetizione, l'ipnosi, il piacere di un groove che gira e gira. Il sistema "stupisce" continuamente e non lascia mai respirare.

---

## Filosofia della revisione: il set, non il concerto

Il modello non è più *Promises* di Floating Points (concerto in un movimento) ma il **DJ set di Four Tet al Brixton Academy** o un album come *New Energy*: il hat c'è quasi sempre, il BPM si muove di 5-8 alla volta, la ripetizione è il materiale, i cambi armonici sono morbidi, e quando arriva un momento di intensità non è perché tutto è al massimo ma perché un singolo elemento *spinge* in avanti.

### Principi

1. **Un motore alla volta.** Sovrapposizioni solo nelle transizioni (30-60 secondi), mai come stato permanente.

2. **BPM come un DJ: incrementi graduali.** Mai più di 10-12bpm di salto tra un motore e il successivo. Il range totale dei motori ritmici va da ~76 a ~120bpm — non di più.

3. **Continuità ritmica.** Un hi-hat o un ride sottile che inizia con TERRENO e non smette più fino alla dissoluzione. Cambia colore (chiuso→aperto→ride→shimmer) ma è sempre lì. È l'elemento che tiene il set insieme come un filo.

4. **Tonalità imparentate.** I motori che si sovrappongono nelle transizioni usano scale con molte note in comune. Le dissonanze di tritono nelle transizioni vengono eliminate.

5. **Ripetizione come materiale.** Ogni motore deve avere il tempo di girare, di diventare familiare, di ipnotizzare. Meno sorprese, più groove. La complessità emerge dal tempo che passa, non dalla densità di eventi.

6. **VORTICE ridimensionato.** Non è più l'assalto tribale a 138bpm. Diventa un motore intenso ma groovy a 112bpm — più vicino a un pezzo di Four Tet in piena corsa che a una techno industriale.

---

## Nuova curva BPM

```
Attuale:    — → 54 → 76 → 72 → 98 → 128 → 138
                          ↑        ↑         ↑
                        -4bpm    +26bpm    +10bpm  ← salti brutali

Proposta:   — → 54 → 76 → 80 → 92 → 112 → 120
                          ↑        ↑        ↑
                        +4bpm    +12bpm   +8bpm   ← salti da DJ
```

| Motore | BPM attuale | BPM proposto | Carattere |
|--------|-------------|--------------|-----------|
| DERIVA | — | — | Beatless, brightness-driven (invariato) |
| CRISTALLO | 54 | 54 | Shimmer lentissimo (invariato) |
| ABISSO | 76 | 76 | Drone rituale (invariato) |
| TERRENO | 72 | 80 | Dub lento — da 72 a 80 per ridurre il salto verso MECCANICA |
| MECCANICA | 98 | 92 | Groove organico — da 98 a 92, meno jazz più Four Tet |
| VORTICE | 138 | 112 | **Ridimensionato radicalmente** — da tribale estremo a driving groovy |
| SOLCO | 128 | 120 | Techno ipnotica — da 128 a 120, zona Four Tet/Floating Points |

**Il range ritmico totale:** 80→120bpm (40bpm di range). L'attuale è 72→138 (66bpm). Ogni transizione è ≤12bpm — un DJ mescolerebbe queste tracce senza problemi.

---

## Nuova mappa armonica

### Principio: famiglie di tonalità imparentate

I motori adiacenti nella timeline condividono note. Le transizioni sono morbide.

```
Attuale:    A Lyd → Eb Lyd → Bb Phr → D Dor → C# Dor → G Dor → F Phr
            (7 centri tonali sparsi su tutto il cerchio cromatico)

Proposta:   A Lyd → D Lyd → A Phr → D Dor → A Dor → D Phr → G Dor
            (2 centri tonali: A e D — tutti imparentati)
```

| Motore | Tonalità attuale | Tonalità proposta | Note | Parentela |
|--------|------------------|-------------------|------|-----------|
| DERIVA | A Lydian | **A Lydian** | A B C# D# E F# G# | Invariato |
| CRISTALLO | Eb Lydian | **D Lydian** | D E F# G# A B C# | 5 note in comune con A Lyd |
| ABISSO | Bb Phrygian | **A Phrygian** | A Bb C D E F G | Stessa root di DERIVA, colore oscuro |
| TERRENO | D Dorian | **D Dorian** | D E F G A B C | Invariato — condivide A,D,E con ABISSO |
| MECCANICA | C# Dorian | **A Dorian** | A B C D E F# G | 6 note in comune con D Dorian |
| VORTICE | F Phrygian | **D Phrygian** | D Eb F G A Bb C | 5 note in comune con D Dorian |
| SOLCO | G Dorian | **G Dorian** | G A Bb C D Eb F | Invariato — 5 note in comune con D Phr |

### Perché funziona

Tutte le transizioni adiacenti condividono almeno 5 note su 7:

```
DERIVA (A Lyd) → CRISTALLO (D Lyd):   A, B, C#, E, F# in comune (5/7)
CRISTALLO (D Lyd) → ABISSO (A Phr):   A, D, E in comune (3/7 — il salto più grande, intenzionale)
ABISSO (A Phr) → TERRENO (D Dor):     A, C, D, E, F, G in comune (6/7!)
TERRENO (D Dor) → MECCANICA (A Dor):  A, B, C, D, E, G in comune (6/7!)
MECCANICA (A Dor) → VORTICE (D Phr):  A, C, D, E, F, G in comune (6/7!)
VORTICE (D Phr) → SOLCO (G Dor):      A, Bb, C, D, F, G in comune (6/7!)
```

Nessun tritono nelle transizioni. L'unico salto armonico forte è CRISTALLO→ABISSO (da Lydian luminoso a Phrygian oscuro) — che è l'inizio dell'Atto II, la "discesa", dove lo strappo è narrativamente giusto.

**Il cerchio A/D:** tutto orbita intorno a due note — A e D. Sono una quinta perfetta. È il rapporto armonico più consonante dopo l'unisono e l'ottava. L'intero set vive in questo spazio ristretto, come un album di Nils Frahm o un set ambient di Gas.

---

## Continuità ritmica: il filo del hat

### Concetto

Da quando TERRENO introduce il primo beat (min 14), un elemento ritmico percussivo sottile è **sempre presente** — anche durante le transizioni. Non è lo stesso suono: cambia colore con il motore. Ma l'ascoltatore non perde mai il polso.

### Implementazione

Un canale MIDI dedicato (CH1 GRAIN o CH7 RIDE) che ogni composer alimenta in modo diverso:

```
TERRENO (min 14-18, 80bpm):
  Closed hat ogni 8th, velocity 30-45, leggero
  Come il hat di "Two Thousand and Seventeen" (Four Tet) — sottile, costante

MECCANICA (min 18-30, 92bpm):
  Ride jazz ogni quarter + ghost 8th, velocity 25-50
  Il hat di TERRENO evolve in ride — il suono cambia ma il polso resta

VORTICE (min 30-42, 112bpm):
  Hat 16th leggero (velocity 20-35) + open hat su beat 2,4 (velocity 50)
  Più veloce, più drive, ma sempre lì

SOLCO (min 36-42, 120bpm):
  Closed hat ogni 8th + open hat beat 2,4
  Il hat più definito, classico, ipnotico
```

**Nota tecnica:** il hat non deve essere un canale "trasversale" nel codice (troppo complicato). Ogni composer ha il suo hat con il suo carattere. La continuità è *percettiva*, non implementativa — l'ascoltatore sente "il hat c'è sempre" anche se tecnicamente è un suono diverso per ogni motore.

**Il hat durante le transizioni:** durante i 30-60 secondi di overlap, entrambi i composer mandano hat. Il hat del motore uscente cala in velocity, quello del motore entrante sale. L'effetto è un morphing del timbro, non un buco.

---

## VORTICE ridimensionato

### Il problema attuale

VORTICE a 138bpm con F Phrygian, step sequencer tribale, micro-loop e pitch class cycling è un motore che appartiene a un set di Paula Temple, non a un set di Four Tet. È troppo estremo, troppo veloce, troppo aggressivo per il contesto.

### Il nuovo VORTICE (112bpm, D Phrygian)

Carattere: **driving, ossessivo, ipnotico — non brutale.** Pensa a "Parallel Jalebi" di Four Tet, o ai pezzi più intensi di Jon Hopkins (*Open Eye Signal*). Il groove spinge in avanti ma non travolge.

```
BPM: 112 (era 138 — -26bpm)
Scala: D Phrygian (era F Phrygian)
Kick: dritto, 4/4, non euclidiano. Il kick a 112 è un polso, non un assalto.
Hat: 16th note leggere — il filo ritmico che unisce tutto
Bass: linea di basso semplice, ripetitiva, ipnotica — non micro-loop
Drone: max 0.15 (come MECCANICA)
```

**Cosa si perde:** l'impatto fisico del 138bpm, il senso di urgenza tribale.
**Cosa si guadagna:** coerenza con il resto del set, transizioni morbide (92→112, +20bpm — gestibile), più spazio per la ripetizione ipnotica.

**Il camera shake resta** (0.02 invece di 0.04) — il campo vibra ancora, ma meno violentemente.

---

## Ripetizione come materiale

### Cosa significa in pratica

Ogni motore, una volta stabilito il suo groove, deve **girare** per almeno 3-4 minuti senza cambi drastici. Le variazioni sono micro: una ghost note in più, il hat che si apre leggermente, la velocity del basso che respira. Non nuovi layer che entrano, non nuovi pattern, non sorprese.

### Cosa togliere

- **MECCANICA:** in pulsazione, il groove (HARMONIC 4 bar + RHYTHMIC 3 bar) gira. Non aggiungere TEXTURAL e MELODIC fino a densità (min 22+). Lascia che il groove ipnotizzi.
- **VORTICE:** niente pitch class cycling. Il pattern è fisso e si ripete. L'evoluzione è nella velocity e nell'apertura del hat, non nella struttura.
- **SOLCO:** il groove kick+bass+hat gira per 3 minuti prima che la voice entri. Tre minuti di puro groove sono più potenti di un'accumulazione continua.
- **Momenti-firma ridotti:** GELO e CONVERGENZA restano ma sono meno teatrali. Il GELO è un respiro nel groove (4-8 battute senza kick, non 30 secondi di accordo tenuto). La CONVERGENZA è un addensamento visivo, non un evento sonoro.

### Il modello Four Tet

In *There Is Love In You* (l'album, non il singolo), una traccia come "Plastic People" ha un groove che gira per 6 minuti con variazioni microscopiche. Il hat è sempre lì. Il kick è sempre lì. Quello che cambia è il *timbro* del pad che si apre e chiude, la *velocity* del basso che respira, una nota melodica che appare ogni 16 bar e poi scompare. È il modello per la seconda metà di MACH:INE II.

---

## Nuova struttura: 50 minuti

### Timeline

```
ATTO I — EMERGENZA (0:00–8:00)              INVARIATO
  DERIVA sola → CRISTALLO sola

ATTO II — DISCESA (8:00–18:00)              TONALITÀ RIVISTE
  ABISSO sola (A Phrygian) → TERRENO solo (D Dorian, 80bpm)

ATTO III — MACCHINA (18:00–30:00)           RIVISTO + SEMPLIFICATO
  MECCANICA sola (A Dorian, 92bpm) — 8 min pieni → GELO breve → vuoto

ATTO IV — INTENSITÀ (30:00–42:00)           RIVISTO RADICALMENTE
  VORTICE (D Phrygian, 112bpm) → SOLCO (G Dorian, 120bpm) → climax ridotto

ATTO V — RITORNO (42:00–50:00)              RIVISTO
  CRISTALLO + DERIVA → silenzio
```

### Atto I — EMERGENZA (0:00–8:00) — invariato

```
0:00–0:30   Silenzio.
0:30–7:00   DERIVA sola. A Lydian, beatless.
3:00–5:00   CRISTALLO entra (pm 0→0.3). D Lydian, shimmer.
5:00–7:00   CRISTALLO sale, DERIVA scende.
7:00–8:00   CRISTALLO sola — primo respiro.
```

### Atto II — DISCESA (8:00–18:00) — tonalità riviste

```
8:00–9:30   ABISSO entra sotto CRISTALLO (pm 0→0.3).
            A Phrygian (era Bb Phrygian). Stessa root di DERIVA ma colore oscuro.
            L'overlap CRISTALLO (D Lydian) + ABISSO (A Phrygian) condivide A,D,E.

9:30–14:00  ABISSO sola. 76bpm, drone rituale.

12:00–14:00 TERRENO entra (pm 0→0.3).
            D Dorian sotto A Phrygian: 6 note in comune su 7.
            L'overlap è consonante — niente più tritono Bb-D.

14:00–18:00 TERRENO solo. D Dorian, 80bpm, dub groove.
            QUI INIZIA IL HAT: closed hat sottile, ogni 8th, velocity 30-40.
            Il polso ritmico è nato. Non smetterà più fino alla dissoluzione.
```

### Atto III — MACCHINA (18:00–30:00) — semplificato

```
18:00–19:00  MECCANICA entra (pm 0→0.3). A Dorian, 92bpm.
             L'overlap con TERRENO (D Dorian): 6 note su 7 in comune.
             Il salto BPM è 80→92 (+12bpm — un DJ lo fa senza problemi).
             Shell voicing A Dorian: un accordo tenuto. Il ride entra subito,
             leggero — prende il posto del hat di TERRENO.

19:00–20:00  TERRENO esce. MECCANICA sale a 1.0.

20:00–25:00  MECCANICA sola — 5 minuti di groove.
             I primi 2 minuti (20–22): solo HARMONIC + RHYTHMIC.
             Il groove gira. Ride costante. Ripetizione.
             Min 22–25: TEXTURAL e MELODIC entrano gradualmente.
             Ghost notes, swing progressivo.
             Il groove si arricchisce ma non cambia — evolve.

25:00–25:15  GELO BREVE — 4 battute senza kick (non 30 secondi teatrali).
             Il ride continua, il kick sparisce. L'assenza è l'evento.
             Dopo 4 battute, il kick rientra. Il groove riparte.

25:15–28:00  MECCANICA post-gelo. Stessa energia ma il momento è passato.
             Dissoluzione lenta: il ride si assottiglia, gli accordi si diradano.

28:00–30:00  MOMENTO DI VUOTO.
             MECCANICA dissolve (pm 1.0→0.0 in 60s).
             Ultimi 30s: quasi-silenzio. Solo DERIVA fantasma (pm 0.2, 30s).
             Le gocce melodiche A Lydian — il ricordo del primo minuto.
             Poi silenzio.
```

### Atto IV — INTENSITÀ (30:00–42:00) — nuovo approccio

**Non più "ACCELERAZIONE" ma "INTENSITÀ".** Il BPM sale gradualmente (92→112→120), non salta. L'intensità viene dalla ripetizione e dalla densità, non dalla velocità.

```
30:00–30:15  VORTICE entra. D Phrygian, 112bpm.
             Ingresso deciso ma non shock: kick + bass + 16th hat da subito.
             Il hat è il filo: il closed hat di TERRENO→ride di MECCANICA
             diventa 16th hat di VORTICE. L'ascoltatore sente continuità.
             Il salto 92→112 (+20bpm) è il più grande del set — ma è gestibile
             e arriva dopo 2 minuti di silenzio. Il contrasto fa il lavoro.

30:15–35:00  VORTICE sola — 5 minuti.
             Groove dritto, ipnotico, ripetitivo. Come "Open Eye Signal".
             Kick 4/4, basso ripetitivo, hat 16th. Niente micro-loop,
             niente pitch cycling. Il pattern gira.
             Le variazioni sono micrometriche: il basso respira in velocity,
             l'open hat appare ogni 8 bar per 1 bar, poi scompare.
             Camera DRIFT con shake 0.02 — il campo si muove, non vibra.

35:00–36:00  CONVERGENZA (più sottile — addensamento visivo, non evento sonoro).
             VORTICE inizia a scendere (pm 1.0→0.3 in 60s).
             Il groove rallenta percettivamente (meno velocity, non meno BPM).

36:00–36:30  Transizione VORTICE → SOLCO.
             SOLCO entra (pm 0→0.7 in 30s). G Dorian, 120bpm.
             VORTICE esce (pm 0.3→0.0 in 15s).
             Il salto 112→120 (+8bpm) è quasi impercettibile.
             L'overlap D Phrygian + G Dorian: 6 note su 7 in comune.
             Il hat di VORTICE (16th) sfuma nel hat di SOLCO (8th + open).

36:30–40:00  SOLCO solo — 3.5 minuti di groove puro.
             Kick + bass + hat. Punto.
             Il groove più semplice del set. Ripetizione ipnotica.
             G Dorian, 120bpm — zona Four Tet.
             La voice entra solo a min 39 (una nota ogni 8 bar) come anticipazione.

40:00–40:30  CLIMAX — solo SOLCO + ABISSO.
             ABISSO (A Phrygian, pm 1.0) aggiunge il drone + massa bassa.
             G Dorian + A Phrygian: condividono A, C, D, F, G (5/7 note).
             Niente tritono, niente caos. Solo peso.
             30 secondi. Brevi, intensi, chiari.

40:30–42:00  Discesa.
             SOLCO esce (pm 0.0 in 15s).
             ABISSO sola per 60s — eco dell'Atto II.
             ABISSO dissolve (pm 0.0 in 60s). Il hat è sparito.
             Per la prima volta da min 14, non c'è più polso ritmico.
             L'assenza si sente.
```

### Atto V — RITORNO (42:00–50:00) — cerchio narrativo

```
42:00–42:30  VUOTO TOTALE. Schermo nero.
             DERIVA suona: solo drone A3, velocity 15.
             Il suono esiste, l'immagine no.

42:30–44:00  Il campo riappare. CRISTALLO entra (pm 0→0.5 in 60s).
             D Lydian, shimmer puro. Nessun beat. L'eco dell'inizio.

44:00–46:00  CRISTALLO dissolve. DERIVA sale a pm 0.5.
             Le gocce melodiche A Lydian dell'inizio tornano.

46:00–48:00  DERIVA sola. Il drone si contrae: ottava → quinta → root.

48:00–50:00  DERIVA dissolve. Il campo si svuota. Silenzio. Nero.
```

---

## Riepilogo: curva del set

```
BPM:    —   54   76   80   92   112   120   —   54   —
        DER CRI  ABI  TER  MEC  VOR   SOL       CRI  DER
        |-—-—-—-—-—-—-—-—-—-—-—-—-—-—-—-—-—-—-—-—-—-—-|
min:    0    3    8    14   18   30    36    42   43   46

Motori attivi:  sempre 1 (max 2 per 30s al climax)
Salto BPM max:  +20 (MECCANICA→VORTICE, dopo 2 min di silenzio)
Hat presente:   min 14 → min 42 (28 minuti continui)
```

---

## Impatto hardware

| Metrica | Attuale (min 28-35) | Proposta |
|---------|---------------------|----------|
| Composer attivi | 2-3 simultanei | 1 (max 2 per 30s) |
| Note MIDI/sec | 15-25 | 5-10 |
| Entità al picco | >3000 | ~1500 |
| BPM massimo | 138 | 120 |

---

## Interventi sui composer

### Tutti i composer — hat/ride continuo

Ogni composer che ha un beat aggiunge il suo hat/ride come primo elemento ritmico:

| Motore | Elemento ritmico costante | Canale | Carattere |
|--------|---------------------------|--------|-----------|
| TERRENO | Closed hat 8th, vel 30-40 | CH1 | Sottile, costante |
| MECCANICA | Ride quarter + ghost 8th, vel 25-50 | CH7 | Jazz, rimbalzato |
| VORTICE | Hat 16th vel 20-35, open hat 2,4 vel 50 | CH1 | Driving, ipnotico |
| SOLCO | Closed 8th + open 2,4 | CH7 | Definito, classico |

### composer.js (TERRENO) — BPM 80 + hat

- BPM: 72 → 80
- Aggiungere closed hat su CH1, ogni 8th, velocity 30-40
- Il hat è presente dal germoglio — è il primo polso del set

### composer2.js (MECCANICA) — A Dorian, 92bpm, semplificazione

- BPM: 98 → 92
- Scala: C# Dorian → A Dorian
- Germoglio: solo HARMONIC + RHYTHMIC + ride. Il groove gira.
- TEXTURAL e MELODIC: solo da densità in poi
- Drone: max 0.15
- Ride sempre presente (CH7)

### composer4.js (VORTICE) — ridimensionato radicalmente

- BPM: 138 → 112
- Scala: F Phrygian → D Phrygian
- Kick: 4/4 dritto (non euclidiano)
- Hat: 16th note leggere, sempre presenti
- Bass: linea ripetitiva, non micro-loop
- Niente pitch class cycling
- Niente step sequencer tribale — groove lineare, ipnotico
- Camera shake: 0.04 → 0.02

### composer7.js (SOLCO) — 120bpm, groove puro

- BPM: 128 → 120
- Scala: G Dorian (invariata)
- Germoglio: kick + bass soli (60s)
- Pulsazione: kick + bass + closed hat 8th
- Densità: kick + bass + hat + open hat 2,4
- Voice solo dopo min 3 (una nota ogni 8 bar)
- Niente hocket tecnico — semplicità

### composer5.js (CRISTALLO) — D Lydian

- Scala: Eb Lydian → D Lydian
- Tutto il resto invariato

### composer6.js (ABISSO) — A Phrygian

- Scala: Bb Phrygian → A Phrygian
- Tutto il resto invariato nel carattere

### Droni — regola unica

Con un motore alla volta, nessuna regola di overlap necessaria. Ogni motore possiede il suo drone senza conflitti. Al climax (SOLCO + ABISSO): solo il drone di ABISSO.

---

## Cue del sequencer — struttura completa

```javascript
const CUES = [
  // ── ATTO I — EMERGENZA (0:00–8:00) ──
  { t: 0,    action: 'silence' },
  { t: 30,   action: 'activate',  engine: 'deriva' },
  { t: 180,  action: 'layer',     engine: 'cristallo', target: 0.3, duration: 30 },
  { t: 300,  action: 'fade_to',   engine: 'cristallo', target: 1.0, duration: 30 },
  { t: 300,  action: 'fade_to',   engine: 'deriva',    target: 0.2, duration: 30 },
  { t: 420,  action: 'fade_to',   engine: 'deriva',    target: 0.0, duration: 30 },

  // ── ATTO II — DISCESA (8:00–18:00) ──
  { t: 480,  action: 'camera', framing: 'WIDE' },
  { t: 480,  action: 'layer',     engine: 'abisso',    target: 0.3, duration: 30 },
  { t: 570,  action: 'fade_to',   engine: 'cristallo', target: 0.0, duration: 30 },
  { t: 570,  action: 'fade_to',   engine: 'abisso',    target: 1.0, duration: 30 },
  { t: 720,  action: 'layer',     engine: 'terreno',   target: 0.3, duration: 25 },
  { t: 840,  action: 'fade_to',   engine: 'abisso',    target: 0.0, duration: 25 },
  { t: 840,  action: 'fade_to',   engine: 'terreno',   target: 1.0, duration: 25 },

  // ── ATTO III — MACCHINA (18:00–30:00) ──
  { t: 1080, action: 'camera', framing: 'MACRO' },
  { t: 1080, action: 'layer',     engine: 'meccanica', target: 0.3, duration: 20 },
  { t: 1140, action: 'fade_to',   engine: 'terreno',   target: 0.0, duration: 20 },
  { t: 1140, action: 'fade_to',   engine: 'meccanica', target: 1.0, duration: 20 },
  // GELO breve a min 25 (4 battute senza kick, non 30s)
  { t: 1500, action: 'firma', effect: 'gelo', active: true },
  { t: 1508, action: 'firma', effect: 'gelo', active: false },
  // Dissoluzione
  { t: 1560, action: 'fade_to',   engine: 'meccanica', target: 0.3, duration: 60 },
  { t: 1680, action: 'layer',     engine: 'deriva',    target: 0.2, duration: 15 },
  { t: 1710, action: 'fade_to',   engine: 'deriva',    target: 0.0, duration: 15 },
  { t: 1710, action: 'fade_to',   engine: 'meccanica', target: 0.0, duration: 30 },

  // ── ATTO IV — INTENSITÀ (30:00–42:00) ──
  { t: 1800, action: 'camera', framing: 'DRIFT', shake: 0.02 },
  { t: 1800, action: 'layer',     engine: 'vortice',   target: 0.8, duration: 10 },
  { t: 1810, action: 'fade_to',   engine: 'vortice',   target: 1.0, duration: 30 },
  // CONVERGENZA a min 35 (visiva, non sonora)
  { t: 2100, action: 'firma', effect: 'convergenza', active: true },
  { t: 2130, action: 'firma', effect: 'convergenza', active: false },
  { t: 2100, action: 'fade_to',   engine: 'vortice',   target: 0.3, duration: 60 },
  // Transizione VORTICE → SOLCO
  { t: 2160, action: 'layer',     engine: 'solco',     target: 0.7, duration: 30 },
  { t: 2160, action: 'fade_to',   engine: 'vortice',   target: 0.0, duration: 15 },
  { t: 2190, action: 'fade_to',   engine: 'solco',     target: 1.0, duration: 20 },
  // CLIMAX: SOLCO + ABISSO
  { t: 2400, action: 'layer',     engine: 'abisso',    target: 1.0, duration: 15 },
  // Discesa
  { t: 2430, action: 'fade_to',   engine: 'solco',     target: 0.0, duration: 15 },
  { t: 2460, action: 'fade_to',   engine: 'abisso',    target: 0.0, duration: 60 },

  // ── ATTO V — RITORNO (42:00–50:00) ──
  { t: 2520, action: 'camera', framing: 'MEDIUM' },
  { t: 2520, action: 'firma', effect: 'vuotoTotale', active: true },
  { t: 2550, action: 'firma', effect: 'vuotoTotale', active: false },
  { t: 2550, action: 'layer',     engine: 'cristallo', target: 0.5, duration: 60 },
  { t: 2640, action: 'fade_to',   engine: 'cristallo', target: 0.0, duration: 120 },
  { t: 2640, action: 'layer',     engine: 'deriva',    target: 0.5, duration: 60 },
  { t: 2760, action: 'fade_to',   engine: 'deriva',    target: 0.3, duration: 60 },
  { t: 2880, action: 'fade_to',   engine: 'deriva',    target: 0.0, duration: 120 },
  { t: 3000, action: 'end' },
];
```

---

## Priorità di implementazione

### Fase 1 — Sequencer (impatto immediato)

Riscrivere le CUES con la nuova timeline. Testare con autopilot.

### Fase 2 — BPM e scale

Aggiornare BPM e scale nei 4 composer che cambiano:
- TERRENO: 72→80, D Dorian (invariato)
- MECCANICA: 98→92, C# Dorian → A Dorian
- VORTICE: 138→112, F Phrygian → D Phrygian
- CRISTALLO: Eb Lydian → D Lydian
- ABISSO: Bb Phrygian → A Phrygian

### Fase 3 — Hat/ride continuo

Aggiungere hat/ride a TERRENO, MECCANICA, VORTICE. SOLCO ha già il hat.

### Fase 4 — Semplificazione VORTICE

Riscrivere composer4.js: da step sequencer tribale a groove lineare ipnotico.

### Fase 5 — Semplificazione MECCANICA

Limitare layer in germoglio/pulsazione. Ride costante.

---

## Cosa NON fare

- Non aggiungere nuovi motori o layer
- Non aumentare la complessità
- Non aggiungere regole di sovrapposizione
- Non toccare i primi 8 minuti (funzionano)
- Non cercare di risolvere i problemi hardware con ottimizzazioni del codice
- Non cercare di "stupire" — cercare di ipnotizzare

---

*v2.9.0 è un intervento di sottrazione e semplificazione. Meno BPM, meno tonalità, meno motori contemporanei, meno sorprese, più groove, più ripetizione, più flusso. Il modello è il set, non il concerto.*
