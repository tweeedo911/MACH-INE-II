# MACH:INE II — Task Compositivi per Claude Code
*Generato: 2026-03-26 — Implementazione delle proposte compositive v2.*

---

## PREREQUISITI

Prima di iniziare qualsiasi task:
1. Leggi `.claude/skills/composition-depth/SKILL.md` e `references/structural-form.md`
2. Leggi `RULES.md` per le aree protette
3. Tutti i parametri numerici → `config.js`. No magic numbers.
4. Commenti tecnici in inglese, documentazione in italiano.
5. Testare ad orecchio nel browser dopo ogni modifica.

---

## TASK 1 — Soppressione kick quando pm < 0.4 (URGENTE)

### Problema
Tutti i composer usano CH0 per kick/pulse. Quando due motori si sovrappongono (cosa frequente nel sequencer v3), il drum rack in Ableton riceve trigger da BPM diversi sullo stesso canale. Risultato: flam involontari, velocity che saltano, colpi fantasma.

### Cosa fare

In **OGNI** composer che ha un kick/pulse su CH0, aggiungere un early-return quando il motore non è dominante.

#### 1A. composer.js (TERRENO) — linea ~321
Il blocco kick inizia con `if (presence[0] > 0.1 && kickPat[s16])`.

**Modifica:** aggiungere PRIMA di quel blocco:
```javascript
// ── Kick suppression: only fire kick when this engine dominates ──
const dominantKick = getPresenceMultiplier('terreno') >= 0.4;
```
Poi cambiare la condizione del kick in:
```javascript
if (dominantKick && presence[0] > 0.1 && kickPat[s16]) {
```

#### 1B. composer2.js (MECCANICA) — stesso pattern
Cercare il blocco CH0 PULSE (kick jazz). La condizione sarà simile.
```javascript
const dominantKick = getPresenceMultiplier('meccanica') >= 0.4;
```
Aggiungere alla condizione kick.

#### 1C. composer4.js (VORTICE) — stesso pattern
```javascript
const dominantKick = getPresenceMultiplier('vortice') >= 0.4;
```

#### 1D. composer6.js (ABISSO) — heartbeat
Il heartbeat di ABISSO è su CH0 ma è molto raro (ogni 2 bar). Stesso pattern:
```javascript
const dominantKick = getPresenceMultiplier('abisso') >= 0.4;
```

#### 1E. composer7.js (SOLCO) — 4/4 invariabile
SOLCO ha il kick più forte (vel 118). Stesso pattern:
```javascript
const dominantKick = getPresenceMultiplier('solco') >= 0.4;
```

#### 1F. composer5.js (CRISTALLO) — pulse raro
Il pulse di CRISTALLO è a vel 30-55, ogni 8 beat. Stesso pattern:
```javascript
const dominantKick = getPresenceMultiplier('cristallo') >= 0.4;
```

### Parametro in config.js
Aggiungere in `CFG`:
```javascript
kickDominanceThreshold: 0.4,  // pm below this = kick suppressed (prevents CH0 overlap)
```
Poi nei composer usare `CFG.kickDominanceThreshold` al posto del magic number 0.4.

### Metriche di successo
- Durante overlap TERRENO+MECCANICA (min 18-19): solo il kick del motore dominante suona
- Durante overlap VORTICE+SOLCO (min 33-35): solo un kick alla volta
- Nessun flam udibile su CH0

---

## TASK 2 — Evoluzione kick euclidiani TERRENO

### Problema
TERRENO usa 5 kick patterns ma l'evoluzione tra fasi è un salto netto. Il groove non si addensa gradualmente. Da E(2,16) a poliritmia MECCANICA non c'è gradino intermedio.

### Cosa fare

#### 2A. Aggiungere pattern kick più densi in composer.js

**File:** `src/composer.js`, array `KICK_PATS` (linea ~61)

Aggiungere due nuovi pattern alla fine dell'array:
```javascript
const KICK_PATS = [
  [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],  // [0] single (germoglio)
  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],  // [1] 1+3 halftime
  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],  // [2] 1+3+"and of 4" (dub push)
  [1,0,0,0, 0,0,0,1, 1,0,0,0, 0,0,0,0],  // [3] 1+anticipation-3 (dub feel)
  [1,0,0,0, 0,0,0,1, 1,0,0,0, 0,1,0,0],  // [4] densita full dub
  // ── NEW: progressive density ──
  [1,0,0,0, 1,0,0,0, 1,0,0,0, 0,0,1,0],  // [5] E(4,16) — 4 hits, groove stabile
  [1,0,0,0, 1,0,0,1, 1,0,0,0, 0,1,0,0],  // [6] E(5,16) — pre-meccanica, denso
];
```

#### 2B. Aggiornare KICK_FOR_PHASE

**File:** `src/composer.js`, oggetto `KICK_FOR_PHASE` (linea ~70)

```javascript
const KICK_FOR_PHASE = {
  germoglio:    [0, 0, 1],             // invariato — singolo colpo
  pulsazione:   [1, 1, 2, 2, 3],      // più varietà, arriva fino a [3]
  densita:      [3, 4, 5, 5, 6],      // NEW: scala fino a E(5,16) [6]
  rottura:      [6, 6, 4],            // NEW: denso poi collassa
  dissoluzione: [2, 1, 1, 0],         // invariato — torna al singolo
};
```

#### 2C. Aggiungere ghost notes probabilistiche in densità

**File:** `src/composer.js`, dopo il blocco kick (dopo linea ~332)

Aggiungere un nuovo blocco ghost note:
```javascript
  // ── CH0 GHOST NOTES — only in densita/rottura, probabilistic ──
  if (dominantKick && (phase === 'densita' || phase === 'rottura')) {
    const ghostProb = phase === 'densita' ? 0.25 : 0.35;
    // Ghost on off-beats: steps 2,6,10,14 (8th note upbeats)
    const isOffBeat = s16 === 2 || s16 === 6 || s16 === 10 || s16 === 14;
    if (isOffBeat && !kickPat[s16] && Math.random() < ghostProb) {
      const ghostVel = Math.round(18 + Math.random() * 10); // very quiet
      sendMIDINote(0, 36, ghostVel, 30);
      addMidiNote(0, 0.5, ghostVel / 127);
    }
  }
```

### Parametri in config.js
```javascript
// In CFG.COMPOSER:
ghostNoteProbDensita: 0.25,    // ghost note probability in densita
ghostNoteProbRottura: 0.35,    // ghost note probability in rottura
ghostNoteVelMin: 18,
ghostNoteVelMax: 28,
```

---

## TASK 3 — Anticipo SOLCO nell'Atto III

### Problema
SOLCO entra al minuto 33 (t=1980). La sezione dance inizia troppo tardi. Anticipare SOLCO come layer sotto MECCANICA dal minuto 22.

### Cosa fare

#### 3A. Modificare CUES in sequencer.js

**File:** `src/sequencer.js`, array `CUES` (linee 31-102)

Inserire le seguenti cue nell'Atto III, DOPO la cue `{ t: 1140, action: 'fade_to', engine: 'meccanica', target: 1.0, duration: 20 }` e PRIMA della cue GELO `{ t: 1440 }`:

```javascript
  // ── SOLCO entra sotto MECCANICA (min 22 = t:1320) ──
  { t: 1320, action: 'layer',    engine: 'solco',     target: 0.3, duration: 30 },

  // ── SOLCO cresce, MECCANICA sfuma (min 26 = t:1560) ──
  { t: 1560, action: 'fade_to',  engine: 'solco',     target: 0.7, duration: 30 },
  { t: 1560, action: 'fade_to',  engine: 'meccanica', target: 0.3, duration: 20 },
```

Poi modificare le cue esistenti all'inizio dell'Atto IV. Al posto di:
```javascript
  { t: 1680, action: 'layer',     engine: 'vortice',   target: 0.3, duration: 15 },
```
Aggiungere anche:
```javascript
  { t: 1680, action: 'fade_to',  engine: 'solco',     target: 1.0, duration: 20 },
  { t: 1680, action: 'fade_to',  engine: 'meccanica', target: 0.0, duration: 15 },
```

#### 3B. Nota sulla cue GELO

Il GELO al t:1440 (min 24) ora avviene con SOLCO attivo a pm 0.3. Questo è VOLUTO: il gelo congela sia MECCANICA che SOLCO, e al disgelo entrambi ripartono. L'effetto è più potente con due motori.

### Timeline risultante Atto III:

```
t=1080 (18:00): MECCANICA entra a 0.3, TERRENO esce
t=1140 (19:00): MECCANICA sale a 1.0
t=1320 (22:00): SOLCO entra a 0.3 (solo kick+hat) ← NEW
t=1440 (24:00): GELO (MECCANICA 1.0 + SOLCO 0.3 congelati)
t=1470 (24:30): GELO OFF
t=1560 (26:00): SOLCO sale a 0.7, MECCANICA scende a 0.3 ← NEW
t=1680 (28:00): SOLCO sale a 1.0, MECCANICA esce ← MODIFIED
t=1680 (28:00): VORTICE entra a 0.3
```

---

## TASK 4 — Ride in TERRENO, MECCANICA, VORTICE

### Problema
Il ride esiste solo in SOLCO (CH7). L'orecchio non è preparato alle frequenze alte metalliche quando SOLCO entra. Serve introdurre il ride gradualmente in 3 motori precedenti.

### Cosa fare

#### 4A. TERRENO — Ride come gocce metalliche (composer.js)

**File:** `src/composer.js` — aggiungere un nuovo blocco DOPO il blocco CH5 VOICE (dopo linea ~401)

```javascript
  // ─────────────────────────────────────────────────────────
  //  CH7 RIDE — metallic drops, sparse, event not grid
  //  Pulsazione: 1 hit per 4 bars. Densita: 1 per 2 bars, alternating closed/open.
  // ─────────────────────────────────────────────────────────
  const ridePresence = phase === 'germoglio' ? 0.0
    : phase === 'pulsazione' ? 0.15
    : phase === 'densita' ? 0.35
    : phase === 'rottura' ? 0.5
    : 0.1; // dissoluzione

  if (ridePresence > 0.05 && s16 === 0) { // only on beat 1
    const rideEveryBars = phase === 'pulsazione' ? 4 : phase === 'densita' ? 2 : 4;
    if (bar % rideEveryBars === 0 && Math.random() < ridePresence * 2) {
      const isOpen = phase === 'densita' && (bar % 4 === 2); // alternate open on bar 3 of 4
      const note = isOpen ? 74 : 82; // D5 open, A6 closed
      const vel = Math.round(20 + ridePresence * 35 + Math.random() * 8);
      const dur = isOpen ? Math.round(beatMs * 3) : Math.round(beatMs * 0.8);
      sendMIDINote(7, note, vel, dur);
      addMidiNote(7, note / 127, vel / 127);
    }
  }
```

#### 4B. MECCANICA — Ride jazz sincopato (composer2.js)

**File:** `src/composer2.js` — aggiungere un nuovo blocco nella sezione step-based, nel punto dove vengono processati gli step MIDI.

```javascript
  // ─────────────────────────────────────────────────────────
  //  CH7 RIDE — jazz ride pattern, syncopated with layer rhythmic
  //  Integrates with 3-bar rhythmic cycle for phasing effect
  // ─────────────────────────────────────────────────────────
  const RIDE_PAT_JAZZ = [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,1]; // jazz sincopato

  const ridePresence = phase === 'germoglio' ? 0.0
    : phase === 'pulsazione' ? 0.2
    : phase === 'densita' ? 0.6
    : phase === 'rottura' ? 0.3
    : 0.1;

  if (ridePresence > 0.05 && RIDE_PAT_JAZZ[s16]) {
    const vel = Math.round(40 + ridePresence * 20 + (Math.random() - 0.5) * 8);
    sendMIDINote(7, 82, vel, Math.round(stepMs * 0.6));
    addMidiNote(7, 82 / 127, vel / 127);
  }

  // Open ride "respiro" every 8 bars on beat 1
  if (ridePresence > 0.3 && s16 === 0 && bar % 8 === 0) {
    const vel = Math.round(45 + ridePresence * 15);
    sendMIDINote(7, 74, vel, Math.round(beatMs * 4));
    addMidiNote(7, 74 / 127, vel / 127);
  }
```

#### 4C. VORTICE — Ride tribale additivo (composer4.js)

**File:** `src/composer4.js` — aggiungere dopo la sezione micro-loop (CH1 GRAIN).

```javascript
  // ─────────────────────────────────────────────────────────
  //  CH7 RIDE — tribal additive pattern (3+3+3+3+4 = 16)
  //  Asymmetric against the kick, dialogs with micro-loops
  // ─────────────────────────────────────────────────────────
  const RIDE_PAT_TRIBAL = [0,0,1,0, 0,1,0,0, 0,0,1,0, 1,0,0,0]; // additive 3+3+3+3+4

  const ridePresence = phase === 'germoglio' ? 0.0
    : phase === 'pulsazione' ? 0.1
    : phase === 'densita' ? 0.4
    : phase === 'rottura' ? 0.7
    : 0.15;

  if (ridePresence > 0.05 && RIDE_PAT_TRIBAL[s16]) {
    const vel = Math.round(35 + ridePresence * 35 + (Math.random() - 0.5) * 6);
    sendMIDINote(7, 82, vel, Math.round(stepMs * 0.5));
    addMidiNote(7, 82 / 127, vel / 127);
  }
```

### Parametri in config.js
```javascript
// Aggiungere in ciascun composer config:
// CFG.COMPOSER:
rideEnabled: true,

// CFG.COMPOSER2:
rideEnabled: true,
ridePatternJazz: [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,1],

// CFG.COMPOSER4:
rideEnabled: true,
ridePatternTribal: [0,0,1,0, 0,1,0,0, 0,0,1,0, 1,0,0,0],
```

---

## TASK 5 — Arpeggi intrecciati CH5/CH6

### Problema
CH6 (LEAD) è sottoutilizzato. Solo MECCANICA ha un vero dialogo voice/lead. TERRENO, VORTICE e SOLCO non usano CH6.

### Cosa fare

#### 5A. TERRENO — Canon alla quinta (composer.js)

**File:** `src/composer.js` — nel blocco CH5 VOICE (linea ~373), dopo l'invio della nota voice, aggiungere il canone su CH6:

```javascript
    // ── CH6 LEAD — canon: stessa frase ritardata 1 bar, trasposta alla quinta ──
    if (presence[4] > 0.3 && getPresenceMultiplier('terreno') > 0.5) {
      const canonDelay = Math.round(barMs); // 1 bar delay
      const canonInterval = 7; // quinta perfetta sopra
      const canonNote = Math.min(96, note + canonInterval);
      const canonVel = Math.floor(vel * 0.6);
      setTimeout(() => {
        if (!composerActive) return;
        sendMIDINote(6, canonNote, canonVel, Math.round(beatMs * 2));
        addMidiNote(6, canonNote / 127, canonVel / 127);
      }, canonDelay);
    }
```

Nota: `composerActive` è il flag che indica se il composer è ancora attivo. Verificare il nome della variabile nel codice (potrebbe essere `composer1Active` o simile).

#### 5B. SOLCO — Hocket in densità (composer7.js)

**File:** `src/composer7.js` — nel blocco che gestisce CH5 VOICE (cercare la sezione voice, che attualmente è molto minimale: 1 nota ogni 16 bar).

Sostituire il blocco voice minimale con un sistema hocket in densità:

```javascript
  // ─────────────────────────────────────────────────────────
  //  CH5 VOICE + CH6 LEAD — hocket in densita
  //  Melodia divisa: CH5 note dispari, CH6 note pari
  //  4 note per frase, 8th note rhythm, G Dorian
  // ─────────────────────────────────────────────────────────
  if (phase === 'densita' && presence[5] > 0.1) {
    const hocketSteps = [0, 2, 4, 6]; // 8th note positions in bar
    const stepIdx = hocketSteps.indexOf(s16);
    if (stepIdx >= 0 && bar % 2 === 0) { // every 2 bars
      const scale = MODES7[currentMode] || MODES7.G_dorian;
      const pool = scale.filter(n => n >= 67 && n <= 79); // G4-G5
      const noteIdx = (stepIdx + Math.floor(bar / 2)) % pool.length;
      const note = pool[noteIdx];
      const vel = Math.round(45 + presence[5] * 30);
      const ch = (stepIdx % 2 === 0) ? 5 : 6; // alternate channels
      sendMIDINote(ch, note, vel, Math.round(stepMs * 1.5));
      addMidiNote(ch, note / 127, vel / 127);
    }
  } else if (phase !== 'densita' && presence[5] > 0.1) {
    // Fuori da densita: mantenere il comportamento originale (nota rara ogni 16 bar)
    // [LASCIARE IL CODICE ORIGINALE QUI]
  }
```

#### 5C. VORTICE — Interlocking (composer4.js)

**File:** `src/composer4.js` — dove vengono gestiti i motivi voice CH5 (cercare il blocco "VOICE MOTIFS" o "CH5 VOICE").

Aggiungere CH6 come pattern complementare:

```javascript
    // ── CH6 LEAD — interlocking: suona dove CH5 tace ──
    if (presence[3] > 0.4 && (phase === 'densita' || phase === 'pulsazione')) {
      // CH5 suona su step 0,4,8,12 (quarter notes)
      // CH6 suona su step 2,6,10,14 (8th upbeats) — incastro complementare
      const leadSteps = [2, 6, 10, 14];
      if (leadSteps.includes(s16)) {
        const scale = MODES4[currentMode] || MODES4.E_phrygian;
        // Registro alto (76-83) — diverso dal mid di CH5 (64-72)
        const hiPool = scale.filter(n => n >= 76 && n <= 83);
        if (hiPool.length > 0) {
          const note = hiPool[(s16 + bar) % hiPool.length];
          const vel = Math.round(35 + presence[3] * 30);
          sendMIDINote(6, note, vel, Math.round(stepMs * 1.2));
          addMidiNote(6, note / 127, vel / 127);
        }
      }
    }
```

---

## TASK 6 — Fix progressioni non-potenza-di-2

### Problema
Diverse progressioni hanno lunghezze totali (accordi × bar per accordo) che non sono potenze di 2. Questo fa sì che i giri non "chiudano" sulla griglia percettiva.

### Cosa fare

#### 6A. TERRENO densità: 6 accordi → 8

**File:** `src/composer.js`, `CHORD_PROGRESSIONS.densita` (linea ~49)

DA:
```javascript
  densita: [[38,50,53,57],[41,53,57,60],[43,55,59,62],[45,57,60,64],
            [41,53,57,60],[38,50,57,59]],
```
A (aggiungere 2 accordi: Em7 e ritorno Dm):
```javascript
  densita: [[38,50,53,57],[41,53,57,60],[43,55,59,62],[45,57,60,64],
            [41,53,57,60],[43,55,59,62],[38,50,57,59],[38,50,53,57]],
  // 8 accordi × 4 bar = 32 bar — potenza di 2
  // Dm→F→G→Am→F→G→Dsus2→Dm (arco che sale e torna)
```

#### 6B. MECCANICA densità: 6 accordi → 8

**File:** `src/composer2.js`, `CHORD_PROGS2.densita` (linea ~57)

DA:
```javascript
  densita: [[61,64,68,71],[66,70,73,76],[64,68,71,75],
            [68,73,76,80],[66,70,73,76],[61,68,71,76]],
```
A:
```javascript
  densita: [[61,64,68,71],[66,70,73,76],[64,68,71,75],[68,73,76,80],
            [66,70,73,76],[64,68,71,75],[61,68,71,76],[61,64,68,71]],
  // 8 accordi × 4 bar = 32 bar — potenza di 2
  // C#m7→F#m7→Em7→Amaj7→F#m7→Em7→C#m9→C#m7 (arco palindromo)
```

#### 6C. CRISTALLO dissoluzione: 3 accordi → 4

**File:** `src/config.js`, sezione COMPOSER5 `chordProgressions.dissoluzione` (cercare)

DA:
```javascript
  dissoluzione: [[64,68,71,75],[71,75,78,82],[64,68,71,75]],
```
A:
```javascript
  dissoluzione: [[64,68,71,75],[71,75,78,82],[64,68,71,75],[64,68,71,75]],
  // 4 accordi × 8 bar = 32 bar — potenza di 2
  // Emaj7→Bmaj7→Emaj7→Emaj7 (ripetizione tonica per chiusura)
```

#### 6D. ABISSO pulsazione e dissoluzione: 3 accordi → 4

**File:** `src/composer6.js` o `src/config.js` (cercare CHORD_PROGS6 o chordProgressions per COMPOSER6)

Pulsazione DA:
```javascript
  pulsazione: [[58,61,65],[59,63,66],[58,61,65]],
```
A:
```javascript
  pulsazione: [[58,61,65],[59,63,66],[58,61,65],[58,61,65]],
  // 4 × 8 = 32 — Bbm→Cb→Bbm→Bbm (insistenza sulla tonica = rituale)
```

Dissoluzione DA:
```javascript
  dissoluzione: [[58,61,65],[59,63,66],[58,61,65]],
```
A:
```javascript
  dissoluzione: [[58,61,65],[59,63,66],[58,61,65],[58,61,65]],
  // 4 × 8 = 32
```

---

## TASK 7 — Overlap armonico D–C# (TERRENO → MECCANICA)

### Problema
D Dorian (TERRENO) e C# Dorian (MECCANICA) non condividono quasi nessuna nota. L'overlap di 20 secondi (t=1080→t=1100) è il momento armonico più debole del concerto.

### Cosa fare

#### 7A. MECCANICA entra con nota singola (composer2.js)

Nel codice di ingresso di MECCANICA, quando il composer viene attivato e inizia in germoglio, i primi 8 bar dovrebbero suonare SOLO il pad su C# (nota 61) senza accordo.

**File:** `src/composer2.js` — nel blocco che gestisce i CHORDS (CH4), aggiungere una condizione temporale:

```javascript
  // ── Ingresso morbido: primi 8 bar solo root, no full chord ──
  const barsActive = Math.floor((Date.now() - phaseStartTime) / barMs);
  const chordToPlay = barsActive < 8
    ? [lastChord[0] || 61]  // solo root C#
    : currentChord;         // accordo pieno
```

Nota: `phaseStartTime` e `barMs` devono già esistere nel composer. Verificare i nomi delle variabili.

---

## TASK 8 — Esposizione nota caratteristica modale

### Problema
Ogni modo ha una nota che lo definisce. I composer la usano poco. Quando appare, dovrebbe avere velocity più alta.

### Cosa fare

#### 8A. Definire le note caratteristiche per motore in config.js

```javascript
// In CFG, sezione globale o per-composer:
modalCharacteristicNotes: {
  terreno:   9,   // B natural = PC 11, ma in offset dal D: 9 semitoni (= B)
  meccanica: 10,  // A# = PC 10, 10 semitoni da C#
  deriva:    6,   // D# = PC 3, 6 semitoni da A
  vortice:   1,   // F = PC 5, 1 semitono da E
  solco:     9,   // E = PC 4, 9 semitoni da G (Dorian 6th)
  abisso:    1,   // Cb = PC 11, 1 semitono da Bb
},
characteristicVelBoost: 15, // velocity bonus when characteristic note plays
```

#### 8B. In ogni composer, nel momento della selezione nota (voice, bass, lead)

Aggiungere dopo il calcolo della velocity:
```javascript
// ── Modal characteristic note boost ──
const charInterval = CFG.modalCharacteristicNotes[engineKey];
if (charInterval !== undefined && (note % 12) === ((rootNote + charInterval) % 12)) {
  vel = Math.min(127, vel + CFG.characteristicVelBoost);
}
```

Questo va applicato nelle funzioni di selezione nota di VOICE (CH5), BASS (CH3) e LEAD (CH6) di ogni composer.

---

## ORDINE DI ESECUZIONE CONSIGLIATO

1. **TASK 1** (Soppressione kick) — più urgente, 1 riga per file, zero rischio
2. **TASK 6** (Fix progressioni) — piccole modifiche ad array, zero rischio
3. **TASK 7** (Overlap D-C#) — piccola modifica, migliora il punto debole
4. **TASK 2** (Evoluzione kick TERRENO) — aggiunge pattern, rischio basso
5. **TASK 3** (Anticipo SOLCO) — modifica sequencer, da testare bene
6. **TASK 4** (Ride) — feature nuova, da calibrare ad orecchio
7. **TASK 5** (Arpeggi intrecciati) — feature nuova, la più complessa
8. **TASK 8** (Nota caratteristica) — polish, bassa priorità

## FILE TOCCATI

| File | Task | Area protetta? |
|------|------|----------------|
| `src/composer.js` | 1A, 2A-C, 4A, 5A, 6A | No |
| `src/composer2.js` | 1B, 4B, 6B, 7A | No |
| `src/composer4.js` | 1C, 4C, 5C | No |
| `src/composer5.js` | 1F, 6C | No |
| `src/composer6.js` | 1D, 6D | No |
| `src/composer7.js` | 1E, 5B | No |
| `src/sequencer.js` | 3A | No |
| `src/config.js` | 1(param), 4(param), 8A | No |

**Nessun file in area protetta (main.js, render.js, director.js) viene toccato.**

---

*Questo documento è progettato per essere eseguito da Claude Code task per task. Ogni task è autosufficiente. Leggi `composition-depth/SKILL.md` PRIMA di iniziare. Testa ad orecchio dopo ogni modifica.*
