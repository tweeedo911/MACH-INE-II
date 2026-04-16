# ENCORE — Traccia 8 fuori scaletta

> Spec di design completa. Approvata nella sessione di brainstorming 2026-04-15.
> Questo documento è la fonte di verità per l'implementazione.

---

## 1. Identità

**Nome interno:** `ENCORE`
**Trigger:** tasto `E` (solo quando director3 è fermo o RITORNO è in dissoluzione/finito)
**Nessun legame** con la suite — scala, BPM, famiglia tonale: tutto indipendente.
**Root:** C3 (MIDI 48)
**BPM base:** 132

### Scale selezionabili live

Tre scale switchabili durante il pezzo con tasti `Q/W/R`. Il cambio è immediato: la scala attiva viene sostituita in `worldState.scale`, le note già in volo continuano, le nuove seguono la scala aggiornata.

| Tasto | Nome | Note | MIDI (3 ottave) |
|---|---|---|---|
| **Q** | Ottatonica half-whole | C Db Eb E F# G A Bb | `[48,49,51,52,54,55,57,58, 60,61,63,64,66,67,69,70, 72,73,75,76,78,79,81,82]` |
| **W** | Ottatonica whole-half | C D Eb F Gb Ab A B | `[48,50,51,53,54,56,57,59, 60,62,63,65,66,68,69,71, 72,74,75,77,78,80,81,83]` |
| **R** | Prometheus (Scriabin) | C D E F# A Bb | `[48,50,52,54,57,58, 60,62,64,66,69,70, 72,74,76,78,81,82]` |

Default all'avvio: **Q** (half-whole).

---

## 2. Struttura formale — Il Diamante

**Durata totale: ~7.5 minuti (≈232 bar a 132 BPM)**

Il pezzo ha una sola forma: costruzione lineare → plateau → decostruzione inversa.
Ogni "mattone" è un nuovo strato poliritimico. I mattoni si accorciano man mano (pressione crescente).

### 2.1 Fasi

| Fase | Bar | ~Durata | Strato che entra | Ciclo (step) | CH |
|---|---|---|---|---|---|
| **heartbeat** | 8 | 15s | Kick solo, 60→132 BPM | — | CH0 |
| **mattone 1** | 32 | 58s | Kick 4/4 + snare backbeat | 16 | CH0+CH1 |
| **mattone 2** | 24 | 44s | + Hat closed in 5/8 | 10 | CH1 |
| **mattone 3** | 24 | 44s | + Bass in 3/4 | 12 | CH3 |
| **mattone 4** | 20 | 36s | + Chord in 7/8 | 14 | CH4 |
| **mattone 5** | 16 | 29s | + Arp in 11/16 | 22 | CH7 |
| **mattone 6** | 16 | 29s | + Voice in 13/16 | 26 | CH5 |
| **plateau** | 16 | 29s | Tutto + open hat + conga | — | tutti |
| **smontaggio** | 56 | 102s | Via in ordine inverso | — | — |

**Totale: 212 bar + 8 heartbeat = ~232 bar (≈7 min 26s)**

### 2.2 Drone (CH2)

Il drone non è un mattone — è tessuto connettivo. Entra al beat 5 del heartbeat (vel 15, quasi inaudibile) come nota C3 tenuta. Cresce lentamente per tutta la durata del pezzo. Non esce mai fino allo smontaggio finale (esce insieme al bass, bar 32-36).

---

## 3. Polimetria — la matematica

### 3.1 Cicli

Ogni strato ha un ciclo in step da 16esimo. Il `globalTick` di rhythm.js resta il clock master a 132 BPM. Ogni modulo computa il proprio step come `globalTick % cycleLength`.

| Strato | Ciclo (step) | Metrica equivalente | LCM col kick (16) | Riallineamento |
|---|---|---|---|---|
| Kick + Snare | 16 | 4/4 | 16 | ogni bar |
| Hat | 10 | 5/8 | 80 | ogni 5 bar |
| Bass | 12 | 3/4 | 48 | ogni 3 bar |
| Chord | 14 | 7/8 | 112 | ogni 7 bar |
| Arp | 22 | 11/16 | 176 | ogni 11 bar |
| Voice | 26 | 13/16 | 208 | ogni 13 bar |

### 3.2 Convergenze

| Combinazione | LCM (step) | Equivalente bar | Frequenza nel pezzo |
|---|---|---|---|
| Kick + Bass | 48 | 3 bar | frequente (groove) |
| Kick + Hat | 80 | 5 bar | medio |
| Kick + Bass + Hat | 240 | 15 bar | 1-2 volte |
| Kick + Bass + Hat + Chord | 1680 | 105 bar | ~1 volta (se il timing coincide) |
| Tutti e 6 | 60060 | 3753 bar | **mai** (~28 minuti, pezzo dura 7.5) |

La convergenza totale è un miraggio matematico. Solo convergenze parziali.

### 3.3 Implementazione clock polimetrico

Nessun clock separato. Aritmetica modulare su un unico orologio:

```
// In ogni modulo, al posto di `step = globalTick % 16`:
const cycleLen = worldState.encoreMode ? ENCORE_CYCLE[modulo] : 16;
const step = globalTick % cycleLen;
```

Questo garantisce zero drift e convergenze esatte sui LCM calcolati.

---

## 4. Armonia ottatonica

### 4.1 Progressione chord (ciclo 14 step = 7/8)

Scala half-whole: `[C Db Eb E F# G A Bb]`

Triadi disponibili (simmetria ogni 3 semitoni):
- **C major** (C E G) = [48, 52, 55]
- **Eb minor** (Eb Gb Bb) = [51, 54, 58]
- **F# major** (F# A C#≡Db) = [54, 57, 49+12=61] → voiced [54, 57, 61]
- **A minor** (A C Eb) = [57, 48+12=60, 51+12=63] → voiced [57, 60, 63]

Progressione ciclica: `Cmaj → Ebm → F#maj → Am → Cmaj → ...`
Ogni accordo dura 14 step (1 ciclo di 7/8). La progressione completa = 56 step = 3.5 bar.
Non risolve mai. Ogni trasposizione suona "giusta" ma non porta da nessuna parte.

### 4.2 Adattamento alle altre scale

Quando si preme `W` (whole-half) o `R` (Prometheus), gli accordi vengono ricostruiti con le triadi disponibili nella nuova scala. Pre-calcolati in tracks.js:

**Whole-half** `[C D Eb F Gb Ab A B]`:
- C minor (C Eb Gb) → [48, 51, 54]
- Eb major (Eb Gb A≡Bbb) → [51, 54, 57]
- F# minor (Gb A C) → [54, 57, 60]
- A major (A C Eb≡D#) → [57, 60, 63]

**Prometheus** `[C D E F# A Bb]`:
- C (C E A) → [48, 52, 57] — triade senza quinta, con sesta
- D (D F# Bb) → [50, 54, 58] — triade con sesta dim
- F# (F# A D) → [54, 57, 50+12=62] — inversione
- A (A C≡Bb# E) → non disponibile, usa [57, 58, 52+12=64] — cluster

### 4.3 Bass nel 3/4

Pattern di 12 step. Note dalla scala attiva, registro [36, 55] (C2–G3).
Pattern base: `[1,0,0,0, 0,0,1,0, 0,1,0,0]` — 3 hit per ciclo, distribuzione asimmetrica.
La nota segue la root dell'accordo attivo trasposta nel registro bass.

### 4.4 Arp in 11/16

Pattern di 22 step. Note dalla scala attiva, registro [60, 82] (C4–Bb5).
Sequenza ascendente sulla scala, 1 nota per step attivo.
Pattern: `[1,0,1,0,0, 1,0,1,0,0, 1,0,1,0,0, 1,0,1,0,0, 1,0]` — 9 hit su 22.
Corre sulla scala indipendentemente dall'accordo. Il disallineamento col chord crea tensione e rilascio.

### 4.5 Voice in 13/16

Pattern di 26 step. Note dalla scala attiva, registro [67, 84] (G4–C6).
Fraseggio melodico: step lenti, 3-4 note per ciclo.
Pattern: `[1,0,0,0,0,0, 1,0,0,0,0,0, 1,0,0,0,0,0, 0,0,1,0,0,0, 0,0]` — 4 hit su 26.
Peso verso chord tones (3a, 5a sopra la root dell'accordo attivo). Velocity espressiva.

---

## 5. Bioma ENCORE — visual

### 5.1 Parametri campo

| Parametro | Valore | Confronto 7 biomi |
|---|---|---|
| bg | `[0, 0, 0]` | simile |
| cellPx (tutti i ruoli) | **4** | 8-20 nei biomi normali |
| decay (tutti i ruoli) | **0.997-0.9999** | la materia persiste |
| maxDensity | **0.95** | 0.45-0.65 normalmente |
| force (tutti i ruoli) | **0.80-1.0** | ogni nota è un impatto pieno |
| planetMask | **no** | fullscreen |
| shimmer | **ampiezza 0.08, freq 2×** | aggressivo, pulsazione optical |

### 5.2 Colori — RGB puri

| Ruolo | RGB | Carattere |
|---|---|---|
| kick | `[255, 255, 255]` | bianco puro — flash |
| snare | `[255, 0, 0]` | rosso — impatto |
| hat/perc | `[0, 255, 255]` | ciano — freddo |
| bass | `[255, 255, 0]` | giallo — domina il basso |
| chord | `[255, 0, 255]` | magenta — blocchi |
| arp | `[0, 255, 0]` | verde — trama aliena |
| voice | `[0, 100, 255]` | blu elettrico — galleggia |
| drone | `[40, 40, 40]` | grigio scuro — sottofondo |

Nessuna sfumatura, nessun pastello. Al plateau il campo è un mosaico RGB tipo test-pattern impazzito.

### 5.3 Glyph layer

Caratteri: `█▓▒░■□●○◆◇▲▼`
Threshold: **0.20** (basso → glifi ovunque)
Opacity: **0.7**
fontSize: **4px** (coerente con cellPx 4)

### 5.4 depositFn

**Nessuna fisica speciale.** Deposito random uniforme su tutto il canvas per tutti i ruoli.
Nessuna gravità, nessuna fascia Y, nessuna membrana. Il campo si riempie uniformemente.
L'optical emerge dalla sovrapposizione dei cicli diversi, non dalla forma dei depositi.

### 5.5 Aging invertito

Nei 7 biomi: luminosità 55%→100% (le celle vecchie brillano di più).
In ENCORE: **100%→55%** — le celle nuove sono brillantissime, le vecchie sbiadiscono.
Effetto: ogni nota è un flash che decade. La materia vecchia diventa sfondo opaco.

### 5.6 Camera

**Fissa.** Zoom 1.0, centro (0.5, 0.5), nessun movimento, nessun POI, nessun micro-drift.
L'occhio della macchina è immobile. La geometria fa tutto il lavoro.
Implementazione: flag `worldState.encoreMode` → camera.js salta tutto l'update.

---

## 6. Heartbeat — sequenza di avvio

Premi `E` → il sistema:
1. Ferma director3 se sta suonando
2. Manda `sendMIDIAllNotesOff()`
3. Svuota il campo (nero totale)
4. Carica traccia ENCORE
5. Inizia heartbeat

| Beat | BPM | Kick vel | Visual |
|---|---|---|---|
| 0 | — | — | Campo nero, silenzio (1s pausa) |
| 1 | 60 | 40 | Pixel bianco al centro (1×1 celle) |
| 2 | 70 | 50 | 2×2 celle |
| 3 | 80 | 60 | 3×3 |
| 4 | 92 | 70 | 4×4 |
| 5 | 104 | 80 | 5×5, drone CH2 entra (vel 15) |
| 6 | 116 | 90 | ~7×7, primo grigio drone |
| 7 | 126 | 100 | ~10×10 |
| 8 | 132 | 110 | Bioma ENCORE attivo, snare entra |

**BPM ramp:** esponenziale (`bpm = 60 * (132/60)^(beat/8)`), accelerazione percepita costante.

**Visual heartbeat:** il kick durante l'heartbeat non usa la depositFn normale. Deposita materia in un cerchio centrato che cresce con ogni beat. Quando il heartbeat finisce (beat 8), la depositFn switch al random uniforme normale.

---

## 7. Smontaggio — decostruzione inversa

Durata: **56 bar** (~102 secondi). Ogni strato esce con un fade di velocity ceiling su 4 bar (da pieno a 0). La materia nel campo non viene cancellata — il decay la consuma lentamente.

| Bar | Cosa esce | Effetto visual |
|---|---|---|
| 0 | Voice (CH5) | Blu elettrico sbiadisce |
| 8 | Arp (CH7) | Verde si spegne |
| 16 | Chord (CH4) | Magenta evapora |
| 24 | Hat + open hat + conga (CH1) | Ciano sparisce |
| 32 | Bass (CH3) + Drone (CH2) | Giallo e grigio se ne vanno |
| 40 | Snare (CH1 snare only) | Resta solo kick bianco |
| 48 | Kick rallenta 132→60 BPM | Il punto si restringe (heartbeat inverso) |
| 56 | Kick si ferma | Nero. Fine. |

**Bar 48-56: heartbeat inverso.** Il kick decelera esponenzialmente, la depositFn torna a cerchio centrato che si restringe. L'ultimo beat è un singolo pixel bianco che lampeggia una volta, poi nero.

---

## 8. Tasti

| Tasto | Azione | Quando |
|---|---|---|
| `E` | Lancia ENCORE | Director fermo o RITORNO finito |
| `Q` | Scala half-whole | Durante ENCORE |
| `W` | Scala whole-half | Durante ENCORE |
| `R` | Scala Prometheus | Durante ENCORE |

I tasti `Q/W/R` non fanno nulla fuori da ENCORE.
Il tasto `E` non fa nulla se ENCORE è già in corso.
I tasti `1-7` (jump track) non funzionano durante ENCORE — per uscire bisogna aspettare la fine o premere `Space` (stop).

---

## 9. File coinvolti

| File | Modifica |
|---|---|
| `tracks.js` | Definizione `ENCORE`: 3 scale, cicli per strato, fasi, registri, accordi per scala |
| `biomi.js` | Bioma `ENCORE`: colori RGB, cellPx 4, decay 0.997+, force max, glyph geometrici |
| `director3.js` | Logica encore: heartbeat ramp, sequenza mattoni, smontaggio, flag `worldState.encoreMode` |
| `main.js` | Tasto `E` (lancio), `Q/W/R` (scala), blocco `1-7` durante encore |
| `rhythm.js` | Ciclo variabile hat/snare/conga: `globalTick % cycleLen` con `cycleLen` da worldState |
| `harmony.js` | Ciclo 14 step per chord, progressione ottatonica, switch scala live |
| `bass-v3.js` | Ciclo 12 step, nota da root accordo attivo |
| `melody-v3.js` | Cicli 22 step (arp) e 26 step (voice), pattern pre-definiti |
| `campo.js` | Aging invertito per ENCORE, heartbeat depositFn centrata |
| `camera.js` | Flag `encoreMode` → camera fissa |
| `config.js` | Costanti ENCORE |
| `world-state.js` | Aggiunta `encoreMode`, `encoreScale`, `encoreCycleLengths` |

**Non si toccano:** midi.js, texture.js, firma.js, field.js, render.js, geo.js.

---

## 10. Rischi e mitigazioni

| Rischio | Mitigazione |
|---|---|
| I moduli musicali assumono cicli di 16 step ovunque | Introdurre `cycleLength` per modulo in worldState. Ogni `% 16` diventa `% cycleLen`. Cambiamento chirurgico, testabile modulo per modulo. |
| cellPx 4 = 240×135 celle = 32400 celle (vs 96×54 = 5184 oggi). Performance 6× | Il loop Bayer è già ottimizzato (Uint32Array, integer shift). Testare su hardware live. Fallback: cellPx 6 (160×90 = 14400, 3× oggi). |
| Cambio scala live potrebbe creare note fuori scala | Le note già in volo (MIDI note-on inviati) continuano — solo le nuove note usano la scala aggiornata. Nessun all-notes-off al cambio scala. |
| Heartbeat BPM ramp potrebbe confondere il clock master | Il ramp è gestito in director3 come già fatto per le transizioni tra tracce (vedi `_bpmRamp`). Meccanismo collaudato. |
| Lo smontaggio potrebbe sembrare "la musica si è rotta" invece di "la musica si smonta elegantemente" | Ogni uscita è netta dopo il fade (velocity 0 → silenzio), non un degradation casuale. L'ordine inverso è riconoscibile. |

---

## 11. Definizioni non negoziabili

- Il pezzo parte SOLO su comando (`E`), mai automaticamente dopo RITORNO.
- I 7 biomi e le 7 tracce della suite non vengono modificati in nessun modo.
- L'encore è autocontenuto: se non premi `E`, è come se non esistesse.
- La polimetria è aritmetica modulare su un unico clock, non clock multipli.
- I colori sono RGB puri primari+secondari, nessuna sfumatura.
