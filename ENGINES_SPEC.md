# MACH:INE II — Engine Specification
*Versione: draft 2 — 2026-03-24*

---

## Nota architetturale

I tre motori esistono già come `composer.js`, `composer2.js`, `composer3.js`.
Questa spec non aggiunge un quarto livello — **ridefinisce l'identità** di ciascuno.
Le aree da rafforzare sono tre:

1. **Identità musicale** — scale, ritmo, carattere procedurale
2. **Identità visiva** — comportamento per-engine in `midi-patterns.js`
3. **Differenziazione tonale** — C1 e C3 usano entrambi D Dorian: va risolto

---

## Il disco

Tre movimenti dello stesso artista. Non si alternano — coesistono con pesi diversi.
Un universo sonoro coerente con tre animi distinguibili: fondazione, ritmo, dissoluzione.

```
MOVIMENTO I — TERRENO     lento, caldo, fondazione
MOVIMENTO II — MECCANICA  ritmico, preciso, jazz-organico
MOVIMENTO III — DERIVA    libero, spettrale, melodico
```

---

## MOTORE I — TERRENO (`composer.js`)

### Carattere musicale
Dub profondo, drone armonico, basso sostenuto. Tempo geologico.
Non risponde ai momenti — risponde alle ere.

### Identità tonale
- **Scale**: D Dorian (principale), D Phrygian (variante scura) — invariate
- **BPM**: 72 (lento, pesante)
- **Note durations**: BASS = 2 beat, CHORDS = 4 beat, PULSE = rare e lente

### Identità ritmica
Euclidean predominante ma **sparso**:
- PULSE (CH0): `E(2,16)` — 2 colpi su 16 step. Rarissimo, autorità assoluta.
- BASS (CH3): `E(5,8)` — ritmo di basso continuo, pattern reggae/dub
- CHORDS (CH4): ogni 4 bar, voice leading lento (invariato)
- GRAIN (CH1): **assente** in germoglio/pulsazione, lieve in densità
- VOICE (CH5): lenta, note lunghe (2 beat), Markov con preferenza pivot {D,F,A}
- DRONE (CH2): note sostenute molto lunghe (8+ beat), quasi statiche

Fase con più presenza: PULSAZIONE e DENSITÀ per BASS, GERMOGLIO per DRONE

### Identità visiva (comportamenti da aggiungere in `midi-patterns.js`)
Ogni canale ottiene una **variante TERRENO** distinta:

| Canale | Shape | xMode | Decay | Dot size | Colore |
|--------|-------|-------|-------|----------|--------|
| CH0 PULSE | `band` | `center` | 0.94 | grande | 0 (amber) |
| CH1 GRAIN | `scatter` | `random` | 0.97 | medio | null |
| CH2 DRONE | `scatter` | `center` | 0.9999 | medio-grande | null |
| CH3 BASS | `column` | `center` | 0.998 | 0.14 ampio | 1 (red) |
| CH4 CHORDS | `band` | `pitch` | 0.990 | 0.13 | 2 (cyan-MIDI) |
| CH5 VOICE | `trail` | `pitch` | 0.988 | 0.08 | 3 (violet) |

Visual di sintesi: masse orizzontali e colonne verticali lente. Campo dominato da zone SOLIDO e GRANA_GROSSA. Il campo halftone è denso, scuro, caldo. Dot size grande.
**Palette visiva**: amber scuro, background quasi-nero. Nessuna inversione.
**Camera**: WIDE fisso o DRIFT lentissimo (non MEDIUM, non MACRO).

---

## MOTORE II — MECCANICA (`composer2.js`)

### Carattere musicale
Poliritmia jazz, groove preciso ma organico. Non meccanico — respira.
Ogni layer è indipendente, si incrociano per fasi.

### Identità tonale
- **Scale**: C# Dorian (distinta da C1 — semitono di distanza crea tensione interessante)
- Variante: G# Lydian (brighter, più sospesa)
- **BPM**: 98 (groove, non troppo veloce)
- **Pivot pitch classes**: C#=1, E=4, G#=8

### Identità ritmica — LAYER SYSTEM (il punto di forza attuale)
I 4 layer hanno cicli a lunghezze **prime** per creare phasing naturale:

| Layer | Ciclo | Trigger | Ritmo | Note |
|-------|-------|---------|-------|------|
| harmonic | 4 bar | crossing 0.0, 0.5 | semiminime | accordi CH4 |
| rhythmic | 3 bar | crossing 0.25, 0.5, 0.75 | crome sincopate | CH0 PULSE |
| textural | 5 bar | crossing 0.2, 0.4, 0.6, 0.8 | semicrome sparse | CH1 GRAIN |
| melodic | 7 bar | crossing 0.33, 0.66 | semiminima libera | CH5/CH6 |

I cicli 3/4/5/7 si riallineano ogni 420 bar (~10 min a 98 BPM) — ogni performance è unica.
La sincopazione del layer rhythmic (crossing a 0.25 anziché 0.0) crea il groove.

Aggiunta da pianificare: **groove shuffle** sul layer rhythmic — ogni crossing ha
un offset casuale ±10ms per umanizzare il pattern senza perdere il metro.

### Identità visiva (variante MECCANICA in `midi-patterns.js`)

| Canale | Shape | xMode | Decay | Colore |
|--------|-------|-------|-------|--------|
| CH0 PULSE | `pulse` | `spread` | 0.82 | 0 (amber) |
| CH1 GRAIN | `scatter` | `pitch` | 0.88 | 4 (steel) |
| CH4 CHORDS | `band` | `stereo` | 0.975 | 2 |
| CH5 VOICE | `trail` | `pitch` | 0.978 | 3 |
| CH6 LEAD | `pulse` | `pitch` | 0.95 | 3 |

Visual di sintesi: geometria precisa, netta. Le entità nascono in burst sincronizzati,
si condensano e scompaiono rapidamente. Il campo è a contrasto alto — zone RITMICO dominanti.
Quando rhythmicity > 0.6: le entità PULSE si dispongono su griglia regolare invece che random.
**Palette visiva**: fredda, high contrast. In fase DENSITÀ: inversione (bianco su nero).
**Camera**: MEDIUM con pan rapido verso centro di massa entità.

---

## MOTORE III — DERIVA (`composer3.js`)

### Carattere musicale
Melodia che si dissolve, texture spettrale, memoria armonica.
Nessun beat fisso — le note emergono da soglie di brightness e centroide.

### Identità tonale — MODIFICA NECESSARIA
**Problema attuale**: Composer3 usa D Dorian, identico a Composer1 → tonal clash.
**Soluzione**: cambiare root a **A Lydian** (già definito nei MODES3 come `A_lydian`).
A Lydian dà un colore sospeso, luminoso, molto diverso dal D Dorian scuro di C1.
Variante secondaria: D Locrian (già disponibile come `Eb_locrian` con trasposizione).

- **Scale principale**: `A_lydian` [57,59,61,62,64,66,68,69,71,73,74,76,78,80,81]
- **BPM**: non applicabile — questo composer non usa beat fisso
- **Trigger**: note VOICE triggate quando `audio.centroid > soglia` (brightness-driven)
  invece che sul battito. Questo è il cambiamento architetturale principale.

### Identità ritmica — DERIVA (no euclidean, no beat)
Il composer3 deve abbandonare il sistema Euclidean per PULSE e BASS.

- **PULSE (CH0)**: **non usato** in DERIVA. Presenza = 0 in tutte le fasi.
- **BASS (CH3)**: **non usato** (o presenza massima 0.1, solo come bordone).
- **CHORDS (CH4)**: cambia ogni 8 bar, voice leading lentissimo. Durata 4-8 beat.
- **VOICE (CH5)**: Markov, triggering basato su `brightness` (`audio.centroid`).
  Quando centroid supera soglia (0.4): nuova nota. Soglia adattiva come per l'onset.
  Note corte (0.5 beat) per creare gocce melodiche, non linee.
- **GRAIN (CH1)**: densità proporzionale a `audio.bands.air`. Scatter diffuso.
- **DRONE (CH2)**: note lunghe (16 beat), mai si fermano durante germoglio/dissoluzione.
- **LEAD (CH6)**: lieve presenza in densità, brevi frammenti melodici (come eco di VOICE).

`PHASE_PRESENCE3` aggiornato:
```
germoglio:    [0.0, 0.1, 1.0, 0.0, 0.3, 0.0, 0.0, 0.0]
pulsazione:   [0.0, 0.4, 0.7, 0.0, 0.6, 0.5, 0.0, 0.0]
densita:      [0.0, 0.7, 0.5, 0.0, 0.8, 0.9, 0.4, 0.0]
rottura:      [0.0, 0.5, 0.3, 0.0, 0.2, 0.3, 0.0, 1.0]
dissoluzione: [0.0, 0.3, 1.0, 0.0, 0.5, 0.7, 0.2, 0.0]
```

### Identità visiva (variante DERIVA in `midi-patterns.js`)

| Canale | Shape | xMode | Decay | Size | Colore |
|--------|-------|-------|-------|------|--------|
| CH1 GRAIN | `scatter` | `random` | 0.965 | 0.05 | null |
| CH2 DRONE | `scatter` | `center` | 0.9999 | 0.10 | null |
| CH4 CHORDS | `band` | `pitch` | 0.993 | 0.09 | 2 |
| CH5 VOICE | `trail` | `pitch` | 0.992 | 0.06 | 3 |
| CH6 LEAD | `trail` | `pitch` | 0.988 | 0.05 | 3 |

Visual di sintesi: campo rarefatto, dominato da trail melodici che si sovrappongono lentamente.
Le note si scrivono nello spazio (xMode pitch) e persistono come scia. Effetto: partitura visiva.
Le entità hanno bassa densità (0.2–0.4) e alta trasparenza — costruiscono trama, non eventi.
**Palette visiva**: fredda e aerea. Background grigio chiaro in dissoluzione. Palette 'cyan'.
**Camera**: WIDE o DRIFT lento su tutto il campo.

---

## Differenziazione visiva — schema riassuntivo

```
                  TERRENO         MECCANICA         DERIVA
Ritmo             Euclidean rado   Layer poliritm.   No beat / brightness
Root              D Dorian         C# Dorian         A Lydian  ← NUOVO
BPM               72               98                —
Forme MIDI        column / band    pulse / scatter   trail / scatter
Dot size          grande           medio             piccolo
Decay speed       molto lento      medio-veloce      lentissimo
Colore dominante  amber / caldo    steel / freddo    cyan / etere
Background        quasi-nero       alto contrasto    quasi-bianco (DECAY)
Camera            WIDE / DRIFT     MEDIUM rapido     WIDE / DRIFT
Presenza peak     PULSAZIONE       DENSITÀ           DISSOLUZIONE
```

---

## CH7 — ROTTURA (trasversale)

CH7 non appartiene a nessun motore. È l'evento che attraversa tutti e tre.
Sequenza 4 stadi invariata: PRESAGIO → INFILTRAZIONE → TAKEOVER → RESIDUO.
Eredita la palette del motore attivo in quel momento e la contamina con magenta.

---

## Piano di implementazione

### Priorità 1 — non tocca aree protette

| File | Modifica |
|------|----------|
| `composer3.js` | Cambia `A_lydian` come mode principale; rimuovi PULSE dalle presence; aggiungi brightness trigger per VOICE |
| `midi-patterns.js` | Aggiungi set di behavior per-engine (TERRENO / MECCANICA / DERIVA); `getNotePosition()` accetta `engineId` |
| `config.js` | Aggiunge BPM per C1 (72), C2 (98); parametri brightness trigger per C3 |

### Priorità 2 — richiede approvazione (aree protette)

| File | Modifica | Motivo protezione |
|------|----------|-------------------|
| `director.js` | Leggere quale composer è attivo → peso engine → palette/scene preferenziali | Narrative arc |
| `render.js` | Passa `engineId` a `addMidiNote()` → `midi-patterns.js` usa variante corretta | Frame orchestration |

### Ordine consigliato
1. `config.js` — parametri numerici
2. `midi-patterns.js` — aggiunge comportamenti per-engine (TERRENO/MECCANICA/DERIVA)
3. `composer3.js` — cambia tonalità + presence + trigger
4. `composer2.js` — verifica BPM e cicli layer, aggiunge groove shuffle se approvato
5. `field.js` — nessuna modifica necessaria ora
6. `director.js` ← approvazione richiesta
7. `render.js` ← approvazione richiesta

---

## Rischi

**R1 — Composer3 brightness trigger**: `audio.centroid` non ha isteresi propria.
Serve una soglia adattiva analoga all'onset (moving average × moltiplicatore).
Soluzione: 5 righe in `audio.js`, non un'area protetta.

**R2 — midi-patterns.js con engineId**: richiede che chi chiama `getNotePosition()`
passi l'ID del composer attivo. Attualmente viene chiamato da `render.js` → area protetta.
Alternativa: ogni composer chiama direttamente `addMidiNote()` con un `engineTag` nel payload,
e `midi-patterns.js` seleziona il behavior basandosi su quel tag. Nessuna modifica a render.js.

**R3 — Saturazione A Lydian in C3**: A Lydian è molto brillante. In fase GERMOGLIO
con solo DRONE attivo potrebbe risultare troppo angelico. Valutare D Locrian
come variante alternativa per ROTTURA (già disponibile).

---

*Questo documento sostituisce la versione draft 1. Implementazione su branch separata.*
