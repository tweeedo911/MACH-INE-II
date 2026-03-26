# MACH:INE II — Partitura Narrativa
*v1.0 — 2026-03-26*
*Specifica compositiva per Claude Code. Questo documento guida TUTTE le modifiche ai composer, alle presenze, ai droni e alle cue del sequencer.*

---

## Principi guida

1. **Ogni minuto ha una direzione.** Zero punti morti. Se il campo è vuoto, è una scelta narrativa (tensione), non un'assenza di idee.
2. **Less is more, ma il "more" ha il suo momento.** Non abbiamo paura di stratificare — ma ogni layer giustifica la sua esistenza.
3. **I droni sono paesaggio, non tappezzeria.** Un drone è un luogo. Se non stai descrivendo un luogo, non c'è drone.
4. **Il silenzio è un evento.** Un canale che si spegne è drammatico quanto uno che si accende.

---

## Struttura dei 5 atti — Timeline minuto per minuto

### ATTO I — EMERGENZA (0:00–8:00)
*Emozione: curiosità → attesa → primo segnale di vita*

**0:00–0:30 — SILENZIO**
- Campo nero. Nessun suono generato. Solo il rumore ambientale del microfono entra nell'analisi.
- densityCap si apre lentamente (quadratico, 120s per arrivare a 1.0)
- *Questo silenzio è intenzionale: il pubblico deve sentire che qualcosa sta per accadere.*

**0:30–3:00 — DERIVA entra (pm 1.0)**
- DERIVA è il motore perfetto per l'apertura: nessun beat, solo brightness-trigger.
- Canali attivi: solo DRONE (CH2, presenza 1.0) e GRAIN (CH1, presenza 0.1)
- **PROBLEMA ATTUALE**: DRONE a 1.0 per 2.5 minuti è troppo statico. Il drone A3(57) non cambia.
- **PROPOSTA**: Il drone di DERIVA in germoglio deve *respirare*:
  - Iniziare con una sola nota (A3, 57), velocity 30 (pianissimo)
  - Dopo 60s: aggiungere la quinta (E4, 64), velocity 25
  - Dopo 90s: aggiungere l'ottava (A4, 69), velocity 20
  - Effetto: il drone si *espande* lentamente come un fiore che si apre. Tre note costruite su 90 secondi.
  - Velocity decrescente per ogni layer = il suono si allarga ma non diventa più forte
- VOICE (CH5) attualmente è a 0.0 in germoglio. **PROPOSTA**: portare a 0.15
  - Una nota melodica ogni ~20 secondi (controllata dalla brightness threshold alta, soglia 0.7)
  - Effetto: piccole gocce melodiche nel campo del drone, come primi segni di vita

**3:00–5:00 — CRISTALLO si sovrappone (pm 0→0.3)**
- CRISTALLO entra come shimmer lontano: solo CHORDS (presenza 0.3)
- **PROPOSTA**: CRISTALLO dovrebbe entrare senza drone proprio (disattivare CH2 per CRISTALLO quando pm < 0.5)
  - Il drone di DERIVA è già attivo — due droni in overlap sono ridondanti
  - Le CHORDS di CRISTALLO (E Lydian) sopra il drone di DERIVA (A Lydian) creano una sonorità ricchissima: A+E = quinta perfetta, Lydian+Lydian = massima luminosità
- GRAIN di CRISTALLO: portare a 0.05 (texture appena percepibile, non protagonista)

**5:00–7:00 — CRISTALLO sale, DERIVA scende**
- CRISTALLO → pm 1.0, DERIVA → pm 0.2
- Qui il passaggio di testimone deve essere graduale (30s di crossfade, già presente)
- **PROPOSTA**: nel momento in cui CRISTALLO supera pm 0.5:
  - VOICE di CRISTALLO si attiva (presenza 0.2): arpeggi lenti, ascendenti
  - PULSE di CRISTALLO entra (presenza 0.1): un battito ogni 4 bar, appena udibile
  - Effetto: il primo segnale di un *ritmo* sottile — il concerto ha un polso
- DERIVA scende a 0.2 ma il suo DRONE resta udibile (presence 0.2 × velocity = ancora presente)

**7:00–8:00 — DERIVA esce completamente**
- DERIVA → pm 0.0 in 30s
- CRISTALLO è solo: CHORDS pieni, VOICE con arpeggi, PULSE lieve
- **Questo è il primo momento di "respiro": un motore solo, chiaro, definito.**
- Il drone di DERIVA sfuma. Per 60 secondi il campo è senza drone. Il silenzio basso è tangibile.

---

### ATTO II — DISCESA (8:00–18:00)
*Emozione: profondità → peso → calore → autorità*

**8:00–9:30 — ABISSO entra (pm 0→0.3), camera WIDE**
- ABISSO è il motore rituale: Bb Phrygian, 76bpm, scuro.
- Canali attivi all'ingresso: solo DRONE (CH2, presenza 0.4) e CHORDS (CH4, presenza 0.2)
- **PROPOSTA per l'ingresso di ABISSO**:
  - Il drone di ABISSO (Bb2, 46) è 11 semitoni sotto il mondo Lydian di CRISTALLO. L'effetto è uno strappo verso il basso — la "discesa" del titolo dell'atto.
  - CHORDS di ABISSO entrano una nota alla volta (voice leading da silenzio):
    - Bar 1: solo root (Bb)
    - Bar 5: root + b3 (Db)
    - Bar 9: root + b3 + b7 (Ab) — triade frigia completa
  - Effetto: l'armonia si svela gradualmente, non appare di colpo

**9:30–12:00 — CRISTALLO esce, ABISSO sale**
- CRISTALLO → pm 0.0 in 30s, ABISSO → pm 1.0 in 30s
- **PROPOSTA**: la transizione CRISTALLO→ABISSO è il momento più drammatico dell'Atto II
  - Quando CRISTALLO scende sotto pm 0.3, il suo GRAIN fa un ultimo "fiammata" (presence spike a 0.9 per 4 battute, poi silenzio) — come la luce di una stella che muore
  - ABISSO attiva BASS (CH3) al momento esatto in cui CRISTALLO sparisce: il peso arriva
  - VOICE di ABISSO resta a 0.0 fino a minuto 11 — il silenzio melodico è tensione
- **DRONE**: solo ABISSO ha drone attivo. Drone CRISTALLO = 0 durante il fade (regola: mai due droni sovrapposti)

**12:00–14:00 — TERRENO entra (pm 0→0.3)**
- TERRENO: D Dorian, 72bpm, dub profondo
- Ingresso: solo BASS (CH3, presenza 0.3) e DRONE (CH2, presenza 0.3 — NON 0.8)
- **PROPOSTA per gestione droni TERRENO + ABISSO in overlap**:
  - ABISSO ha drone Bb2 (46), TERRENO ha drone D3 (50) — tritono: intervallo di massima tensione
  - Questo è INTENZIONALE. Il tritono Bb-D è il suono della discesa, dell'attrito tra due mondi
  - Ma: ABISSO drone scende a 0.2 quando TERRENO entra, TERRENO drone a 0.3
  - Somma percepita: drone di TERRENO domina leggermente, ABISSO è ombra
  - A minuto 13: ABISSO drone → 0.0 (il tritono si risolve, TERRENO vince)
- PULSE di TERRENO: NON attivare in overlap. Il ritmo euclidiano E(2,16) entrerebbe solo quando TERRENO è solo.

**14:00–18:00 — ABISSO esce, TERRENO diventa protagonista**
- ABISSO → pm 0.0 in 25s, TERRENO → pm 1.0 in 25s
- TERRENO è in piena evoluzione: germoglio→pulsazione→densità
- **PROPOSTA per TERRENO da solo (14:00–18:00)**:
  - Min 14–15 (pulsazione): KICK E(2,16) + BASS E(5,8) creano il dub pocket. Drone a 0.6.
  - Min 15–16: VOICE entra (presenza 0.4), note lunghe, Markov su {D,F,A}. Melodia minima.
  - Min 16–17 (densità): GRAIN cresce (0.3→0.6), texture si addensa. CHORDS voice leading.
  - Min 17–18: preparazione alla transizione. KICK E(2,16) → E(3,16) (più colpi = anticipazione). Drone scende a 0.3.
  - **Il drone di TERRENO in pulsazione deve evolvere**: non nota fissa, ma oscillazione lenta D3(50) → A2(45) → D3(50) su ciclo di 16 bar. Effetto: il basso si muove come la marea.

---

### ATTO III — MACCHINA (18:00–28:00)
*Emozione: precisione → groove → meccanismo → gelo*

**18:00–19:00 — MECCANICA entra (pm 0→0.3), camera MACRO**
- Il taglio di camera a MACRO è brusco — intenzionale, come un cambio di scena cinematografico
- MECCANICA: C# Dorian, 98bpm, poliritmia jazz
- Ingresso: solo layer HARMONIC (accordi CH4, presenza 0.3)
- **PROPOSTA**: l'ingresso di MECCANICA deve essere *precisione totale*:
  - Le prime 4 bar: un singolo accordo C# shell voicing (root + 3rd + 7th), tenuto
  - Bar 5–8: secondo accordo (II grado), voice leading minimo
  - Bar 9: il layer RHYTHMIC si attiva — il groove inizia
  - Effetto: la macchina si accende pezzo per pezzo, come un orologio che prende vita

**19:00–21:00 — TERRENO esce, MECCANICA sale**
- TERRENO → pm 0.0 in 20s, MECCANICA → pm 1.0 in 20s
- **DRONE**: MECCANICA NON dovrebbe avere drone prominente.
  - MECCANICA è ritmo e precisione. Il drone è l'opposto: statico, senza tempo.
  - **PROPOSTA**: drone di MECCANICA → max 0.15 in tutte le fasi (attualmente arriva a 1.0)
  - Sostituire la funzione drone con un PAD armonico che segue i CHORDS:
    - Invece di una nota fissa, CH2 suona la nota più bassa dell'accordo corrente
    - Durata: segue il ritmo armonico (4 bar), non 16 beat fissi
    - Effetto: il "drone" diventa un basso armonico, parte del groove, non un tappeto statico

**21:00–24:00 — MECCANICA in piena evoluzione**
- Tutti e 4 i layer attivi: harmonic (4 bar) + rhythmic (3 bar) + textural (5 bar) + melodic (7 bar)
- I cicli primi si riallineano ogni 420 bar (~10 min) — ogni passaggio è unico
- **PROPOSTA per profondità**: aggiungere micro-variazioni nel tempo:
  - Layer TEXTURAL (CH1 GRAIN): presenza che oscilla sinusoidalmente (0.3↔0.7) su ciclo di 32 bar
  - Layer MELODIC (CH5 VOICE): ogni 16 bar, cambia il set di pivot pitch (C#→E→G#→C#...)
  - Ghost notes sul layer RHYTHMIC: probabilità 30% sugli off-beat, velocity 25-40
  - Swing progressivo: da 0ms in germoglio a ±12ms in densità (il groove si "umanizza" con il tempo)

**24:00–24:30 — MOMENTO-FIRMA: GELO**
- `firma.gelo = true`: le entità si congelano in posizione
- **PROPOSTA musicale per il GELO**:
  - 2 battute prima del gelo: tutti i layer si fermano tranne HARMONIC (solo accordo tenuto)
  - Al gelo: HARMONIC tiene l'ultimo accordo, velocity decrescente (80→20 in 30s)
  - GRAIN: un burst di note (0.9 presenza per 2 secondi), poi silenzio totale
  - Effetto: la macchina si blocca, l'ultimo gesto vibra nell'aria, poi nulla
  - Al disgelo (24:30): il layer RHYTHMIC riparte dal primo crossing — come un riavvio

**24:30–28:00 — MECCANICA post-gelo verso transizione**
- Il gelo ha resettato la percezione. Tutto sembra nuovo.
- **PROPOSTA**: la ripartenza post-gelo è più lenta della prima volta:
  - Solo HARMONIC per 30s, poi RHYTHMIC, poi TEXTURAL (stesso ordine dell'ingresso, ma accelerato)
  - MELODIC rientra per ultimo, con note più lunghe (più melodico, meno meccanico)
  - Min 27–28: preparazione alla transizione. MECCANICA inizia a rallentare (non il BPM, ma il ritmo armonico: da 4 bar a 8 bar tra un cambio e l'altro)

---

### ATTO IV — VORTICE (28:00–36:00)
*Emozione: urgenza → caos controllato → climax → dissoluzione*

**28:00–29:00 — VORTICE entra (pm 0→0.3), camera DRIFT + shake**
- VORTICE: E Phrygian, 138bpm — il motore più veloce e aggressivo
- Camera shake 0.04 — il campo vibra
- Ingresso: KICK (CH0, presenza 0.7) + BASS (CH3, presenza 0.6) subito
- **PROPOSTA**: VORTICE entra con impatto, non graduale
  - A differenza degli altri motori, VORTICE non si svela lentamente
  - KICK a 0.7 e BASS a 0.6 al primo beat — il cambio è fisico
  - GRAIN (CH1): 0.3 da subito, aggiunge texture granulare aggressiva
  - DRONE: presenza MASSIMO 0.2 — VORTICE è ritmo, non atmosfera

**29:00–31:00 — MECCANICA esce, VORTICE sale**
- MECCANICA → pm 0.0 in 15s, VORTICE → pm 1.0 in 15s
- Transizione veloce (15s, non 30s come le altre) — senso di urgenza
- **PROPOSTA**: nel momento dell'overlap MECCANICA+VORTICE:
  - I due groove si sovrappongono: 98bpm vs 138bpm = poliritmia caotica
  - Questo è il momento più "rumoroso" dell'atto — intenzionale, dura solo 15s
  - Poi MECCANICA sparisce e il groove si stabilizza sul 138bpm di VORTICE

**31:00–33:00 — VORTICE in piena potenza + DERIVA rientra**
- VORTICE: densità. Tutti i canali attivi, micro-loop con pitch class cycling
- DERIVA rientra a pm 0.3 (cue a 31:00) — come un fantasma che riappare
- **PROPOSTA**: DERIVA in Atto IV è radicalmente diversa dall'Atto I
  - In Atto I era l'inizio, qui è il ricordo. Stessi suoni, contesto diverso.
  - VOICE di DERIVA con presenza 0.5: le gocce melodiche dell'inizio tornano sopra il groove di VORTICE
  - DRONE di DERIVA: presence 0.3 max — si mescola con il subbasso di VORTICE
  - Effetto: la melodia del primo minuto riappare trasformata dal viaggio

**33:00–33:40 — MOMENTO-FIRMA: CONVERGENZA**
- `firma.convergenza = true`: le entità convergono verso il centro
- **PROPOSTA musicale**:
  - VORTICE: VOICE (CH5) si attiva per la prima volta (presenza 0.4): una nota lunga, tenuta
  - GRAIN di tutti i motori attivi: presence → 0.0 (pulizia prima del climax)
  - Tutti i droni → 0.0 (il campo si svuota armonicamente)
  - Effetto: convergenza visiva + convergenza sonora. Tutto si concentra.

**34:00–34:30 — CLIMAX GLOBALE (INVERSIONE)**
- Tutti e 5 i motori a pm 1.0 in 10s — è il momento di massima densità
- **PROPOSTA per SOLCO in questo momento**:
  - SOLCO (composer7) entra QUI come 6° motore al climax. È il pezzo mancante.
  - Cue nuova: `{ t: 2040, action: 'layer', engine: 'solco', target: 1.0, duration: 10 }`
  - Il kick invariabile di SOLCO (128bpm) sopra il 138bpm di VORTICE: battimento ritmico
  - La sovrapposizione di 6 motori è INTENZIONALMENTE eccessiva: è il climax, deve essere travolgente
  - Durata: solo 30 secondi. Poi tutto crolla.
- **REGOLA DRONI AL CLIMAX**: un solo drone (TERRENO, D3, il più caldo) a presenza 0.5. Tutti gli altri → 0.0.
  - Motivazione: 6 droni sovrapposti = fango sonoro. Un solo drone = ancora di gravità nel caos.

**34:30–36:00 — Discesa dal climax**
- Tutti i motori tranne CRISTALLO e DERIVA → pm 0.0 in 20s
- **SOLCO esce tra i primi** (pm 0.0 in 10s — entrata breve, uscita brevissima)
- CRISTALLO e DERIVA restano: ritorno al paesaggio dell'inizio
- **PROPOSTA**: la discesa è un processo di *sottrazione*
  - Ordine di uscita: SOLCO (10s) → VORTICE (15s) → TERRENO (20s) → MECCANICA (20s) → ABISSO (20s)
  - Ogni uscita è percepibile: il pubblico sente la mano che toglie i layer uno a uno
  - Al minuto 35:30: solo CRISTALLO (pm 0.7) + DERIVA (pm 0.5) — siamo tornati all'Atto I

---

### ATTO V — RITORNO (36:00–40:00)
*Emozione: memoria → svuotamento → silenzio → fine*

**36:00–36:30 — MOMENTO-FIRMA: VUOTO TOTALE**
- `firma.vuotoTotale = true` per 30s: schermo nero totale
- **PROPOSTA musicale**: il vuoto totale NON è silenzio sonoro
  - DERIVA continua a suonare durante il vuoto (il suono esiste, l'immagine no)
  - Solo DRONE di DERIVA (A3, 57): una nota, pianissimo (velocity 15)
  - Effetto: il pubblico guarda il nero e sente un respiro lontanissimo
  - Al disgelo (36:30): il campo riappare lentamente (densityCap da 0.3, non da 0)

**36:30–38:30 — CRISTALLO dissolvenza, camera MEDIUM**
- CRISTALLO → pm 0.0 in 60s (lentissimo)
- DERIVA resta a pm ~0.5
- **PROPOSTA**: CRISTALLO esce come un'eco
  - Solo CHORDS, presenza decrescente, velocity decrescente
  - VOICE di CRISTALLO: ultima nota, tenuta per 8 battute, poi silenzio
  - GRAIN, PULSE: già a 0.0 — solo armonia pura
  - Il drone di CRISTALLO è GIÀ a 0.0 (regola stabilita in Atto I)

**38:30–40:00 — DERIVA da sola, poi silenzio**
- DERIVA → pm 0.0 in 60s
- **PROPOSTA**: DERIVA chiude il cerchio
  - Min 38:30–39:00: VOICE con le stesse note dell'inizio (pivot A, E, C#) ma velocity decrescente
  - Min 39:00–39:30: solo DRONE (come all'inizio, ma il processo inverso):
    - Ottava si spegne (velocity → 0)
    - Quinta si spegne
    - Root resta sola, velocity 15→0
  - Min 39:30–40:00: densityCap chiude quadraticamente. Il campo si svuota.
  - Min 40:00: `action: 'end'` — silenzio totale, schermo nero.

---

## Revisione presenze — Regole trasversali per i droni

### Regola 1: Mai due droni sovrapposti a presenza > 0.3
Quando due motori sono attivi contemporaneamente:
- Il motore con pm più alto possiede il drone (presenza come da matrice)
- Il motore con pm più basso: drone → min(0.2, presenza_attuale × 0.3)
- Eccezione: nel climax globale (t: 2040–2070), solo TERRENO ha drone

### Regola 2: Il drone ha un arco, non è piatto
Ogni drone deve evolvere durante la sua permanenza:
- **Inizio**: una nota, velocity bassa
- **Sviluppo** (+30s): aggiungere intervallo (quinta o ottava)
- **Maturità** (+60s): tutte le note del drone attive
- **Dissoluzione** (-30s prima di uscita): processo inverso
- Implementazione: gestire in ogni composer con un contatore `droneAge` che traccia da quanto il drone è attivo

### Regola 3: Ogni motore ha un carattere di drone
- **TERRENO**: drone caldo, root+quinta, oscillazione lenta (D3↔A2, 16 bar)
- **MECCANICA**: NON drone tradizionale. Pad armonico che segue gli accordi (nota bassa dell'accordo corrente)
- **DERIVA**: drone espansivo, root→quinta→ottava, respiro lento
- **VORTICE**: drone minimo (presenza max 0.2), solo root, sottile
- **CRISTALLO**: drone OFF sotto pm 0.5. Sopra: shimmer pad (nota alta, non bassa)
- **ABISSO**: drone rituale, root+quinta, lungo e autoritario
- **SOLCO**: drone da subwoofer, root G2+quinta D3, continuo e invariabile

### Regola 4: Droni e fasi
Presenze drone riviste per tutti i motori:

```
TERRENO   — germoglio: 0.5  pulsazione: 0.6  densita: 0.3  rottura: 0.1  dissoluzione: 0.7
MECCANICA — germoglio: 0.15 pulsazione: 0.15 densita: 0.1  rottura: 0.0  dissoluzione: 0.1
DERIVA    — germoglio: 0.8  pulsazione: 0.5  densita: 0.3  rottura: 0.1  dissoluzione: 0.8
VORTICE   — germoglio: 0.2  pulsazione: 0.15 densita: 0.1  rottura: 0.0  dissoluzione: 0.2
CRISTALLO — germoglio: 0.0  pulsazione: 0.0  densita: 0.1  rottura: 0.0  dissoluzione: 0.0
ABISSO    — germoglio: 0.4  pulsazione: 0.7  densita: 0.5  rottura: 0.2  dissoluzione: 0.6
SOLCO     — germoglio: 0.3  pulsazione: 0.3  densita: 0.2  rottura: 0.1  dissoluzione: 0.4
```

*Confronto con l'attuale: MECCANICA scende da 0.4-1.0 a 0.0-0.15. CRISTALLO da 0.0-0.8 a 0.0-0.1. VORTICE da 0.2-0.5 a 0.0-0.2. Le riduzioni maggiori sono sui motori ritmici dove il drone non ha senso narrativo.*

---

## Revisione presenze — Riempire i punti morti

### Principio: ogni fase di germoglio ha almeno 2 canali attivi

Presenze VOICE (CH5) riviste — attualmente molti germoglio hanno VOICE a 0.0:

```
TERRENO   — germoglio: 0.2 (invariato, già presente)
MECCANICA — germoglio: N/A (usa layer system diverso)
DERIVA    — germoglio: 0.15 (ERA 0.0 — aggiungere gocce melodiche rare)
VORTICE   — germoglio: 0.0 (ok — VORTICE entra con impatto, non con melodia)
CRISTALLO — germoglio: 0.0 → 0.1 (shimmer arpeggio lentissimo, 1 nota ogni 8 bar)
ABISSO    — germoglio: 0.0 → 0.1 (una nota grave ogni 16 bar, quasi subliminale)
SOLCO     — germoglio: 0.0 (ok — SOLCO è kick+bass, la voce non serve al suo carattere)
```

### Principio: le transizioni tra fasi non sono tagli netti

Aggiungere in ogni composer un sistema di **phase crossfade** di 8 battute:
- Quando la fase cambia, le presenze della vecchia fase sfumano verso quelle della nuova in 8 bar
- Implementazione: interpolare linearmente `PHASE_PRESENCE[oldPhase]` → `PHASE_PRESENCE[newPhase]` durante le prime 8 bar della nuova fase
- Questo elimina i "salti" percettivi che creano i punti morti

---

## SOLCO nel sequencer — Cue proposte

SOLCO (composer7) appare SOLO nel climax dell'Atto IV. È un momento, non un atto.

```javascript
// Nuove cue da aggiungere in CUES[]:

// SOLCO entra al climax globale
{ t: 2040, action: 'layer', engine: 'solco', target: 1.0, duration: 5 },

// SOLCO esce per primo nella discesa
{ t: 2070, action: 'fade_to', engine: 'solco', target: 0.0, duration: 10 },
```

Durata totale di SOLCO nella performance: ~40 secondi. Breve, devastante, memorabile.

---

## Riepilogo modifiche per composer (da implementare su Code)

### composer.js (TERRENO)
- Drone: oscillazione D3↔A2 su ciclo 16 bar (non nota fissa)
- Drone presenze: germoglio 0.5 (era 0.8), densita 0.3 (era 0.5)
- KICK in pulsazione: E(2,16) → E(3,16) negli ultimi 2 minuti prima della transizione
- Phase crossfade: 8 bar di interpolazione tra fasi

### composer2.js (MECCANICA)
- Drone → pad armonico: CH2 suona nota bassa dell'accordo corrente, non nota fissa
- Drone presenze: max 0.15 in tutte le fasi (era fino a 1.0)
- Ghost notes su RHYTHMIC: probabilità 30% su off-beat, velocity 25-40
- Swing progressivo: 0ms in germoglio → ±12ms in densità
- Layer TEXTURAL: presenza oscilla 0.3↔0.7 su 32 bar
- Phase crossfade: 8 bar

### composer3.js (DERIVA)
- VOICE in germoglio: 0.15 (era 0.0), soglia brightness 0.7
- Drone: espansione progressiva root→quinta→ottava su 90s in germoglio
- Drone dissoluzione: glide A3→E4 (già implementato? verificare)
- Phase crossfade: 8 bar (o equivalente in drift-bar)

### composer4.js (VORTICE)
- Drone: max 0.2 in tutte le fasi (era fino a 0.5)
- VOICE in densità: 0.4 (verificare se già presente)
- Transizioni corte (15s) — questo è gestito dal sequencer, non dal composer

### composer5.js (CRISTALLO)
- Drone: OFF sotto pm 0.5, shimmer pad (nota alta) sopra
- VOICE in germoglio: 0.1 (era 0.0)
- Presenze drone riviste: max 0.1 (era fino a 0.8)
- Phase crossfade: 8 bar

### composer6.js (ABISSO)
- VOICE in germoglio: 0.1 (era 0.0), nota grave ogni 16 bar
- CHORDS ingresso graduale: root → root+b3 → root+b3+b7 su 12 bar
- Phase crossfade: 8 bar

### composer7.js (SOLCO)
- Drone: presenze riviste (max 0.4 in dissoluzione, era 0.6)
- Aggiungere al sequencer (cue climax Atto IV)
- Nessuna altra modifica sostanziale — SOLCO è perfetto nel suo ruolo breve

---

## Cue sequencer aggiornate — Proposta completa

```javascript
const CUES = [
  // ── ATTO I — EMERGENZA (0:00–8:00) ──
  { t: 0,    action: 'silence' },
  { t: 30,   action: 'activate', engine: 'deriva' },
  { t: 180,  action: 'layer',    engine: 'cristallo', target: 0.3, duration: 30 },
  { t: 300,  action: 'fade_to',  engine: 'cristallo', target: 1.0, duration: 30 },
  { t: 300,  action: 'fade_to',  engine: 'deriva',    target: 0.2, duration: 30 },
  { t: 420,  action: 'fade_to',  engine: 'deriva',    target: 0.0, duration: 30 },

  // ── ATTO II — DISCESA (8:00–18:00) ──
  { t: 480,  action: 'camera', framing: 'WIDE' },
  { t: 480,  action: 'layer',    engine: 'abisso',    target: 0.3, duration: 30 },
  { t: 570,  action: 'fade_to',  engine: 'cristallo', target: 0.0, duration: 30 },
  { t: 570,  action: 'fade_to',  engine: 'abisso',    target: 1.0, duration: 30 },
  { t: 720,  action: 'layer',    engine: 'terreno',   target: 0.3, duration: 25 },
  { t: 840,  action: 'fade_to',  engine: 'abisso',    target: 0.0, duration: 25 },
  { t: 840,  action: 'fade_to',  engine: 'terreno',   target: 1.0, duration: 25 },

  // ── ATTO III — MACCHINA (18:00–28:00) ──
  { t: 1080, action: 'camera', framing: 'MACRO' },
  { t: 1080, action: 'layer',    engine: 'meccanica', target: 0.3, duration: 20 },
  { t: 1140, action: 'fade_to',  engine: 'terreno',   target: 0.0, duration: 20 },
  { t: 1140, action: 'fade_to',  engine: 'meccanica', target: 1.0, duration: 20 },
  // GELO
  { t: 1440, action: 'firma', effect: 'gelo', active: true },
  { t: 1470, action: 'firma', effect: 'gelo', active: false },

  // ── ATTO IV — VORTICE (28:00–36:00) ──
  { t: 1680, action: 'camera', framing: 'DRIFT', shake: 0.04 },
  { t: 1680, action: 'layer',    engine: 'vortice',   target: 0.3, duration: 15 },
  { t: 1740, action: 'fade_to',  engine: 'meccanica', target: 0.0, duration: 15 },
  { t: 1740, action: 'fade_to',  engine: 'vortice',   target: 1.0, duration: 15 },
  { t: 1860, action: 'fade_to',  engine: 'deriva',    target: 0.3, duration: 20 },
  // CONVERGENZA
  { t: 1980, action: 'firma', effect: 'convergenza', active: true },
  { t: 2020, action: 'firma', effect: 'convergenza', active: false },
  // CLIMAX GLOBALE — 6 motori (SOLCO incluso)
  { t: 2040, action: 'fade_to',  engine: 'terreno',   target: 1.0, duration: 10, visual: true },
  { t: 2040, action: 'fade_to',  engine: 'meccanica', target: 1.0, duration: 10 },
  { t: 2040, action: 'fade_to',  engine: 'abisso',    target: 1.0, duration: 10 },
  { t: 2040, action: 'fade_to',  engine: 'cristallo', target: 1.0, duration: 10 },
  { t: 2040, action: 'fade_to',  engine: 'deriva',    target: 1.0, duration: 10 },
  { t: 2040, action: 'layer',    engine: 'solco',     target: 1.0, duration: 5 },
  // DISCESA DAL CLIMAX — ordine di uscita specifico
  { t: 2070, action: 'fade_to',  engine: 'solco',     target: 0.0, duration: 10 },
  { t: 2075, action: 'fade_to',  engine: 'vortice',   target: 0.0, duration: 15 },
  { t: 2080, action: 'fade_to',  engine: 'terreno',   target: 0.0, duration: 20 },
  { t: 2080, action: 'fade_to',  engine: 'meccanica', target: 0.0, duration: 20 },
  { t: 2085, action: 'fade_to',  engine: 'abisso',    target: 0.0, duration: 20 },

  // ── ATTO V — RITORNO (36:00–40:00) ──
  { t: 2160, action: 'camera', framing: 'MEDIUM' },
  { t: 2160, action: 'firma', effect: 'vuotoTotale', active: true },
  { t: 2190, action: 'firma', effect: 'vuotoTotale', active: false },
  { t: 2160, action: 'fade_to',  engine: 'cristallo', target: 0.0, duration: 60 },
  { t: 2310, action: 'fade_to',  engine: 'deriva',    target: 0.0, duration: 60 },
  { t: 2400, action: 'end' },
];
```

Le differenze rispetto all'attuale:
- Aggiunta cue SOLCO al climax (t: 2040) e uscita (t: 2070)
- Discesa dal climax: uscite scaglionate (non tutti a t: 2070)
- Tutto il resto invariato — le modifiche compositive sono nei composer, non nelle cue

---

*Questo documento va letto da Code PRIMA di modificare qualsiasi composer. Usare insieme a CODE-TASKS-INFRA.md per i task di infrastruttura.*
