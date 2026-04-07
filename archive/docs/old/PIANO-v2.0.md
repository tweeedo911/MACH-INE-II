# MACH:INE II — Piano v2.0

Data: 2026-03-25
Stato attuale: v1.7.0 (6 composer + sequencer autopilot)
Obiettivo: trasformare il sistema da "visualizer reattivo" a "concerto narrativo" con arco emotivo, stratificazione, contrasto e momenti memorabili.

---

## DIAGNOSI

Il sistema e' tecnicamente completo ma drammaturgicamente piatto per tre ragioni fondamentali:

1. Il concerto e' 6 mini-concerti identici nella forma (germoglio→dissoluzione x6), non un unico arco
2. Ogni transizione e' un buco di 6 secondi — il tessuto musicale e visivo si spezza 5 volte
3. Non esiste stratificazione: un solo engine alla volta, zero contrasto tra vuoto e pieno

---

## ARCHITETTURA PROPOSTA

### A. SEQUENCER v2: da "un engine alla volta" a "orchestrazione di ensemble"

Oggi il sequencer attiva un engine, aspetta N minuti, spegne tutto, ne attiva un altro.
Il nuovo sequencer gestisce **combinazioni** di engine simultanei con ruoli diversi.

Struttura della sequenza — 5 atti, ~40 minuti:

```
ATTO I — EMERGENZA (0:00–8:00)
  0:00  nero assoluto, silenzio
  0:30  DERIVA solo (germoglio lentissimo)
  3:00  DERIVA + CRISTALLO (shimmer entra come texture sotto)
  5:00  CRISTALLO prende il primo piano, DERIVA sfuma a presenza ridotta
  7:00  CRISTALLO sale verso pulsazione

ATTO II — DISCESA (8:00–18:00)
  8:00  ABISSO entra sotto CRISTALLO (drone basso, heartbeat)
  9:30  CRISTALLO sfuma, ABISSO solo (rituale)
 12:00  TERRENO entra sotto ABISSO (kick euclidiano lontano)
 14:00  ABISSO sfuma, TERRENO sale (primo groove pieno)
 16:00  TERRENO densita' — primo momento caldo e ritmico

ATTO III — MACCHINA (18:00–28:00)
 18:00  MECCANICA entra sotto TERRENO (poliritmia si sovrappone)
 19:00  TERRENO sfuma, MECCANICA prende il centro
 22:00  MECCANICA densita' — massima complessita' ritmica
 24:00  MECCANICA rottura + primo climax visivo

ATTO IV — VORTICE (28:00–36:00)
 28:00  VORTICE entra (kick tribale) + eco residua di MECCANICA
 29:00  VORTICE solo — accelerazione pura
 31:00  VORTICE densita' + DERIVA rientra come texture alta
 33:00  VORTICE rottura — CLIMAX GLOBALE del concerto
 34:00  VORTICE takeover + tutti gli engine attivi per 30 secondi (massa totale)

ATTO V — RITORNO (36:00–40:00)
 36:00  tutti sfumano tranne CRISTALLO + DERIVA
 37:00  CRISTALLO dissoluzione
 38:30  DERIVA sola
 39:30  sfuma verso nero assoluto
 40:00  fine
```

Implementazione: il sequencer diventa un array di "cue" con timestamp, engine da attivare/disattivare, e livello di presenza target. Ogni cue ha una durata di crossfade (non piu' 6 secondi fissi). I composer devono supportare un parametro `presenceMultiplier` (0.0–1.0) che scala l'intera uscita — questo permette di avere un engine "in background" a 0.3 mentre un altro e' a 1.0.

### B. ENGINE SIMULTANEI: regole di convivenza

Quando due o piu' engine sono attivi contemporaneamente servono regole per evitare caos:

**Conflitto canali MIDI**: Ogni engine usa gli stessi 8 canali (0–7). Con due engine attivi suonerebbero entrambi sullo stesso canale. Soluzione: ogni engine ha un set di canali "primari" e quando convive con un altro, i canali secondari vengono silenziati. Per esempio:

- DERIVA primari: CH2 (drone), CH4 (chords), CH5 (voice) — rinuncia a CH1 (grain)
- CRISTALLO primari: CH1 (grain), CH4 (chords), CH5 (shimmer) — rinuncia a CH2 (drone)
- Quando convivono: DERIVA tiene drone+voice, CRISTALLO tiene grain+shimmer, gli accordi si alternano

**Conflitto tonalita'**: Due engine in tonalita' incompatibili creano dissonanza non voluta. Per la sequenza proposta le coppie sono:
- DERIVA (A Lydian) + CRISTALLO (Eb Lydian) = tritono — problematico
- CRISTALLO (Eb Lydian) + ABISSO (Bb Phrygian) = relazione di quarta — funziona
- ABISSO (Bb Phrygian) + TERRENO (D Dorian) = tritono — problematico
- TERRENO (D Dorian) + MECCANICA (C# Dorian) = semitono — molto problematico
- MECCANICA (C# Dorian) + VORTICE (F Phrygian) = terza minore — funziona

Soluzioni possibili (da valutare):
1. Riarmonizzare alcuni engine per compatibilita' nelle coppie previste
2. Durante le sovrapposizioni, l'engine in background suona solo drone e texture (non note definite)
3. Creare "zone neutre" dove gli engine in sovrapposizione usano solo intervalli comuni (quinte, ottave)

**Conflitto visual identity**: Ogni engine ha una palette diversa. Con due attivi, quale palette domina? Regola: l'engine con presenceMultiplier piu' alto determina la palette, l'altro contribuisce solo alla densita' del campo.

### C. TRANSIZIONI MUSICALI: da "buco nero" a "crossfade narrativo"

Oggi: allNotesOff → 6 sec vuoto → engine nuovo da zero.

Proposta — 3 tipi di transizione:

**Crossfade (default, 15–30 sec)**: Il nuovo engine entra in germoglio a presenceMultiplier 0.2 mentre il vecchio e' ancora attivo. In 15–30 secondi il nuovo sale a 1.0, il vecchio scende a 0.0. Il tessuto musicale non si interrompe mai.

**Frattura (per rottura→nuovo engine)**: La rottura del vecchio engine si conclude con il residuo, durante il quale il nuovo engine inizia in germoglio. Il residuo "prepara il terreno" per il nuovo mondo sonoro.

**Collisione (per momenti climax)**: Due engine si sovrappongono a piena potenza per un periodo breve (30–60 sec). Usato solo una volta nel concerto (Atto IV, tutti gli engine).

### D. ARCO INTERNO DEL DIRETTORE

Oggi il direttore segue l'audio: forte→PEAK, piano→SILENCE.
I composer forzano l'arc phase (setArcPhaseForced).

Proposta: il direttore mantiene una **tensione narrativa interna** (0.0–1.0) che evolve indipendentemente dall'audio:

- Cresce lentamente nel tempo (il concerto accumula tensione)
- Viene modulata dagli eventi dei composer (rupture la alza, dissoluzione la abbassa)
- La tensione si somma all'audio per determinare l'arc phase
- Permette "resistenza" (audio forte ma tensione bassa → il visivo non esplode subito)
- Permette "anticipazione" (tensione alta con audio ancora moderato → il visivo precede la musica)

La tensione ha anche **memoria**: quante rupture ci sono state, quanto tempo totale in PEAK. Il direttore sa se siamo all'inizio o alla fine del concerto e si comporta diversamente. Stessa musica a minuto 5 e a minuto 35 produce risultati visivi diversi.

### E. CONTRASTO TEMPORALE E SORPRESA

Nuovo concetto: **impatto percettivo** = contrasto tra questo momento e il precedente.

- Un onset dopo 10 secondi di silenzio ha impatto 10x rispetto a un onset in una sequenza ritmica
- L'impatto guida il burst di entita', non il volume
- L'impatto guida la dimensione delle forme MIDI, non la velocity

Implementazione: un buffer rolling di 5 secondi traccia la media di intensity. L'impatto di un evento = differenza tra il valore istantaneo e la media recente. Questo singolo cambiamento trasforma il sistema da "piu' forte = piu' grande" a "piu' inaspettato = piu' grande".

### F. MOMENTI-FIRMA (3–4 nel concerto)

Eventi visivi rari e memorabili, non ripetibili, che il direttore innesca basandosi sulla tensione narrativa accumulata:

**1. GELO (una volta, ~min 24)**
Tutto il campo si blocca per 2–3 secondi. Le entita' smettono di nascere e morire. I primitivi si fermano. La camera si blocca. Poi tutto riparte — il contrasto tra stasi e movimento e' potentissimo.

**2. CONVERGENZA (una volta, ~min 33)**
Tutte le entita' si spostano verso un punto centrale in 3 secondi, creando un nucleo densissimo. Poi esplosione radiale — nascita massiva dal centro. Usato nel climax globale.

**3. INVERSIONE DRAMMATICA (una volta, ~min 34)**
Non il dissolve graduale attuale, ma un taglio netto: un frame bianco, il successivo nero (o viceversa). Usato nel momento di massima tensione, non come transizione estetica.

**4. VUOTO TOTALE (una volta, ~min 36)**
Dopo il climax globale: 4–5 secondi di schermo completamente nero. Zero entita', zero densita', zero colore. Poi il primo dot appare lentamente. Il vuoto dopo il pieno e' il gesto piu' forte del concerto.

### G. CAMERA CINEMATOGRAFICA

La camera attuale e' una telecamera di sorveglianza. Deve diventare un operatore cinematografico.

**Respiro ritmico**: Sul downbeat di ogni battuta, micro-zoom del 2–3% (zoom in, poi rilascio lento). Impercettibile consciamente, ma crea un legame fisico tra musica e immagine.

**Reazione agli onset**: Sugli onset forti, micro-pan nella direzione dell'onset wave (spostamento laterale rapido di 1–2%, poi ritorno). Da' senso di "impatto" fisico.

**Montaggio narrativo**: Il MACRO non deve durare 5 secondi. Deve seguire la logica musicale: MACRO entra su un assolo (CH5/CH6 attivi con presenza > 0.5) e esce quando rientra il ritmo (CH0 rientra). La camera racconta chi sta "parlando".

**Transizioni di atto**: Ad ogni cambio di atto del sequencer, la camera fa un gesto specifico:
- Atto I→II: slow zoom out (da MEDIUM a WIDE)
- Atto II→III: cut a MACRO poi apertura
- Atto III→IV: drift rapido + shake
- Atto IV→V: lentissimo zoom in verso il centro

### H. COLORE COME EVENTO RARO

Oggi i colori A, B, C sono presenti quasi sempre. Il colore deve essere guadagnato.

**Regola**: i primi 8 minuti (Atto I) sono rigorosamente monocromatici — solo bianco/nero/grigio. Il colore A (arancione) appare per la prima volta in Atto II con l'ingresso di ABISSO. Il colore B (cyan) appare con MECCANICA. Il colore C (magenta) appare una sola volta, nel climax globale (Atto IV). Ogni apparizione di un nuovo colore e' un evento narrativo.

**Palette piu' contrastate**: Le palette engine-specific per cristallo (ice) e meccanica (steel) sono troppo desaturate. Servono palette con piu' contrasto:
- Cristallo: bg bianco puro → fg nero → accento azzurro ghiaccio (un solo colore, non cinque grigi)
- Meccanica: bg nero puro → fg bianco → accento rosso industriale

**Climax cromatico reale**: L'overlay magenta all'8% attuale e' invisibile. Il climax deve saturare progressivamente l'intero campo — le entita' diventano C, la palette vira verso magenta, il bg stesso si colora. Non un velo sopra, una trasformazione dal basso.

### I. FORME MIDI CON IDENTITA' RADICALE

Le 7 forme attuali sono tutte rettangoli. Devono essere radicalmente diverse:

- PULSE: rettangolo (resta com'e') — impatto percussivo
- BLOB: cerchio concentrico con anelli — risonanza
- BAND: onda sinusoidale orizzontale, non rettangolo piatto — respiro
- COLUMN: colonna che pulsa in altezza — pilastro
- TRAIL: linea curva (spline tra note consecutive) — melodia visibile
- RUPTURE: frattale/noise — disintegrazione
- SCATTER: polvere di punti sparsi — grana

### L. COMPOSIZIONI DINAMICHE

Le composizioni Mondrian oggi sono layout statici. Devono reagire alla musica:

- I bordi delle regioni si spostano lentamente (±5% per battuta)
- L'area delle regioni dense si espande con l'intensity e si contrae con il silenzio
- Le linee divisorie (mul 3.0+) pulsano sul downbeat (spessore ±1px)
- In PEAK le composizioni collassano verso UNIFORM (tutto pieno)
- In SILENCE le composizioni si estremizzano (regioni dense piu' dense, vuote piu' vuote)

### M. ADATTAMENTO DEI BPM

La curva attuale (nessuno→54→76→72→98→138) ha la decelerazione 76→72.

Proposta di riordinamento gia' integrato nella sequenza ad atti:
- Atto I: nessun BPM (DERIVA) → 54 (CRISTALLO) — introduzione del tempo
- Atto II: 76 (ABISSO) → 72 (TERRENO) — qui la decelerazione ha senso narrativo: da rituale profondo a groove dub, il rallentamento crea peso
- Atto III: 98 (MECCANICA) — salto significativo, accelerazione
- Atto IV: 138 (VORTICE) — climax di velocita'

Alternativa se la decelerazione 76→72 non funziona dal vivo: portare TERRENO a 80 BPM. Mantiene il carattere dub ma non decelera.

---

## PRIORITA' DI IMPLEMENTAZIONE

### Fase 1 — Struttura (massimo impatto, prerequisito per tutto il resto)

1. **Sequencer v2 con cue system** — array di cue con timestamp, engine on/off, presenceMultiplier, crossfade duration. Sostituisce la sequenza lineare attuale.

2. **presenceMultiplier nei composer** — ogni composer accetta un moltiplicatore 0.0–1.0 che scala velocity, burst count, e state injection. Permette engine in background.

3. **Crossfade tra engine** — il sequencer gestisce la sovrapposizione temporanea. Non piu' allNotesOff istantaneo.

4. **Regole di convivenza canali MIDI** — ogni engine dichiara i canali primari. Quando convive, silenzia i secondari.

### Fase 2 — Narrativa (trasforma il concerto)

5. **Tensione narrativa interna** nel direttore — valore 0–1 indipendente dall'audio che accumula nel tempo e modula l'arc phase.

6. **Contrasto temporale** — buffer rolling 5sec, impatto = differenza da media, guida burst e forme.

7. **Momenti-firma** — GELO, CONVERGENZA, INVERSIONE, VUOTO TOTALE implementati come eventi one-shot del direttore.

8. **Colore progressivo** — monocromo per Atto I, colore A in Atto II, B in Atto III, C solo nel climax globale.

### Fase 3 — Cinematografia (raffina l'esperienza)

9. **Camera ritmica** — micro-zoom su downbeat, micro-pan su onset.

10. **Camera narrativa** — MACRO segue assoli, transizioni di atto con gesti camera specifici.

11. **Composizioni dinamiche** — bordi mobili, pulsazione su downbeat, collasso in PEAK.

12. **Palette contrastate** — riscrivere ice, abyssal, steel con contrasto reale.

### Fase 4 — Dettaglio (polish)

13. **Forme MIDI radicali** — cerchi concentrici, spline, frattali. Sostituire i rettangoli.

14. **Apertura e chiusura** — nero assoluto → primo dot → emergenza lenta. Simmetria alla fine.

15. **Climax cromatico reale** — saturazione dal basso, non overlay.

---

## FILE TOCCATI

| Intervento | File |
|---|---|
| Sequencer v2 | sequencer.js (riscrittura), main.js (wiring) |
| presenceMultiplier | composer.js, composer2–6.js |
| Crossfade engine | sequencer.js, main.js |
| Canali MIDI convivenza | midi-patterns.js, composer*.js |
| Tensione narrativa | director.js |
| Contrasto temporale | state.js, generations.js, field.js |
| Momenti-firma | director.js (nuovo modulo: firma-events.js) |
| Colore progressivo | colors.js, director.js |
| Camera ritmica | director.js (camera section) |
| Camera narrativa | director.js |
| Composizioni dinamiche | director.js (compositions), field.js |
| Palette contrastate | colors.js (PALETTES, ENGINE_MIDI_COLORS) |
| Forme MIDI | field.js (midiColorAt, computeDensity) |
| Apertura/chiusura | sequencer.js, render.js |
| Climax cromatico | colors.js, field.js, generations.js |

### Aree protette toccate (richiedono approvazione)

- **main.js / render.js / director.js relationships** — Fase 1 (sequencer v2 cambia il wiring in main.js)
- **Narrative arc to visual arc** — Fase 2 (tensione narrativa modifica il cuore del director)
- **Rupture behavior** — Fase 2 (momenti-firma aggiungono eventi al sistema di rupture)
- **Climax behavior** — Fase 2 e 4 (colore progressivo e climax cromatico)
- **Camera logic** — Fase 3 (camera ritmica e narrativa)

---

## RISCHI

- **Engine simultanei = doppio carico MIDI**: con 2 engine attivi le note MIDI raddoppiano. Il synth in Ableton deve reggere. Mitigazione: il presenceMultiplier riduce la densita' dell'engine in background.
- **Conflitti tonali**: due engine in tonalita' incompatibili creano dissonanza. Mitigazione: limitare l'engine in background a drone/texture (no note melodiche definite).
- **Complessita' del sequencer v2**: il cue system e' molto piu' complesso dell'attuale. Rischio bug. Mitigazione: mantenere il sequencer v1 come fallback (toggle tra v1 e v2).
- **Performance Canvas**: composizioni dinamiche + piu' entita' (da engine simultanei) = piu' calcoli per frame. Mitigazione: il presenceMultiplier riduce il burst count dell'engine in background.
