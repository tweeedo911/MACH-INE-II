# Climax Intensificativo — Guida implementativa

Questo documento mostra il pattern di codice esatto per trasformare la vecchia rupture (CH7 noise) nel nuovo climax intensificativo.

---

## Pattern generico — da adattare per ogni composer

### 1. Rimuovere il blocco CH7 RUPTURE

In `onStep()` (o `onKickBassStep()` per composer2), trovare ed **eliminare** il blocco:

```js
// ── RIMUOVERE QUESTO BLOCCO ──
if (presence[6] > 0.1 && phase === 'rottura') {
    const fire = { ... }[ruptureStage] ?? false;
    if (fire) {
        const note = MODES.Eb_locrian[...];
        sendMIDINote(7, note, ...);
    }
}
```

### 2. Rimuovere i guard `phase !== 'rottura'` dal bass

Il bass attualmente si spegne in rottura. Deve invece essere al massimo.

```js
// ── PRIMA ──
if (presence[1] > 0.1 && phase !== 'rottura' && bassSeq.p[s16]) {

// ── DOPO ──
if (presence[1] > 0.1 && bassSeq.p[s16]) {
```

### 3. Aggiornare PHASE_PRESENCE per rottura

La rottura deve avere valori ALTI, non bassi:

```js
// ── PRIMA (composer.js TERRENO) ──
rottura: [0.3, 0.5, 0.3, 0.2, 0.2, 0.7, 1.0],
//        KICK  BASS HARM VOICE DRONE GRAIN RUPTURE

// ── DOPO ──
rottura: [1.0, 0.9, 0.6, 0.0, 0.3, 0.8, 0.0],
//        KICK  BASS HARM VOICE DRONE GRAIN (no rupture)
// VOICE a 0.0 — il silenzio melodico rende il climax ritmico più potente
```

### 4. Aggiungere "hard cut" nel takeover finale

Dentro `updateRupture()`, aggiungere la logica del silenzio:

```js
function updateRupture(dt) {
    if (phase !== 'rottura') {
        if (ruptureStage !== 'idle') {
            ruptureStage = 'idle';
            ruptureProgress = 0;
            setComposerClimax(false);
        }
        return;
    }

    const duration = CFG.COMPOSER.phases.rottura?.duration || 30;
    ruptureProgress = Math.min(1, phaseClock / duration);
    const prev = ruptureStage;

    if      (ruptureProgress < 0.25) ruptureStage = 'presagio';
    else if (ruptureProgress < 0.60) ruptureStage = 'infiltrazione';
    else if (ruptureProgress < 0.85) ruptureStage = 'takeover';
    else                              ruptureStage = 'residuo';

    // ── HARD CUT: negli ultimi 15% del takeover, silenzio totale ──
    if (ruptureStage === 'takeover' && ruptureProgress > 0.78) {
        sendMIDIAllNotesOff();
        // Azzera tutte le presence tranne drone (che rimane come eco)
        for (let i = 0; i < presence.length; i++) {
            if (i !== 4) presence[i] = 0; // 4 = DRONE index
        }
    }

    // ── RESIDUO: solo drone pianissimo ──
    if (ruptureStage === 'residuo') {
        for (let i = 0; i < presence.length; i++) {
            if (i !== 4) presence[i] = Math.max(0, presence[i] - dt * 2.0);
            else presence[i] = Math.max(0.1, presence[i] - dt * 0.3);
        }
    }

    if (ruptureStage !== prev) {
        setComposerClimax(ruptureStage === 'takeover');
    }
}
```

### 5. Modificare il comportamento dei canali durante il climax

In `onStep()`, i parametri cambiano in base a `ruptureStage`:

```js
// ── Climax modifiers (in onStep, prima dei singoli canali) ──
const climaxVelBoost = ruptureStage === 'takeover'      ? 1.25
                     : ruptureStage === 'infiltrazione'  ? 1.12
                     : ruptureStage === 'presagio'       ? 1.05 : 1.0;

const climaxGateMultiplier = ruptureStage === 'takeover' ? 0.6  // note più corte = più urgente
                           : ruptureStage === 'infiltrazione' ? 0.8
                           : 1.0;

// Poi applicare nei singoli canali:
// vel = Math.min(127, Math.round(vel * climaxVelBoost));
// dur = Math.round(dur * climaxGateMultiplier);
```

### 6. Kick pattern per il climax

In rottura, forzare il kick pattern più denso:

```js
// Nella sezione staggered pattern rotation
if (phase === 'rottura') {
    // Forza il pattern più denso durante il climax
    kickPat = KICK_PATS[KICK_PATS.length - 1]; // ultimo = più denso
} else if (bar !== lastKickVarBar && bar % 8 === 0) {
    // ... rotazione normale
}
```

### 7. Bass in rottura — shift up + pattern denso

```js
// Bass durante rottura — intensificazione
if (phase === 'rottura' && presence[1] > 0.1 && bassSeq.p[s16]) {
    // Usa il pattern più denso
    const climaxBassSeq = BASS_SEQS[BASS_SEQS.length - 1];
    // Shift up di un'ottava per urgenza
    const octShift = ruptureStage === 'takeover' ? 12 : 0;
    const noteOff = climaxBassSeq.n[bassNoteIdx % climaxBassSeq.n.length];
    bassNoteIdx++;
    const bassNote = 38 + noteOff + octShift;
    const vel = Math.min(127, Math.round((90 + presence[1] * 30) * climaxVelBoost));
    const dur = Math.round(stepMs * 1.5 * climaxGateMultiplier);
    sendMIDINote(3, Math.min(127, bassNote), vel, dur);
}
```

---

## Implementazione specifica per motore

### TERRENO (composer.js) — "Dub Pressure"

Il climax di TERRENO è una pressione dub che cresce fino a esplodere. Il kick diventa 4-on-the-floor, il bass diventa frenetico, poi DROP.

Aggiunte specifiche:
- In presagio: kick pattern [3] (dub anticipation)
- In infiltrazione: kick pattern [4] (dub full) + bass pattern [4] (full groove)
- In takeover: kick diventa 4-on-the-floor `[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]`
- Hard cut → silenzio → residuo con solo drone D2

### MECCANICA (composer2.js) — "Layer Convergence"

Il climax di MECCANICA è il momento in cui i 4 layer poliritmici (che normalmente sfasano) convergono. È il punto di massima sincronia.

Aggiunte specifiche:
- In presagio: i layer continuano normalmente ma con presenza crescente
- In infiltrazione: tutti i layer hanno crossing simultanei (forza `crossed()` a true per tutti)
- In takeover: il beat clock e il step clock si sincronizzano — momentanea sincronicità di tutti gli elementi
- Hard cut → silenzio → residuo con solo drone C#3

Nota: per la "convergenza" non serve modificare la classe Layer. Basta aumentare la probabilità di firing di tutti i canali al 100% durante takeover.

### VORTICE (composer4.js) — "Muro Tribale"

Il climax di VORTICE è pura densità ritmica. Tutti i micro-loop al massimo, kick + ghost sovrapposti, muro sonoro.

Aggiunte specifiche:
- In presagio: micro-loop A + B attivi, ghost denso
- In infiltrazione: tutti e 3 i micro-loop + ghost densissimo + voice motif raddoppia velocità
- In takeover: TUTTO al massimo — kick, ghost, tutti i micro-loop, bass shift up
- Hard cut → silenzio totale (nessun drone — VORTICE si ferma secco)

### ABISSO (composer6.js) — "Risalita"

Il climax di ABISSO è la risalita dall'abisso. L'octave shift progressivo (già implementato) è il meccanismo principale.

Aggiunte specifiche:
- Mantenere l'octave shift esistente (presagio→+12, takeover→+24)
- In presagio: heartbeat che accelera (heartbeatEvery da 2 a 1)
- In infiltrazione: grain diventa più denso, le "gocce" diventano rivoli
- In takeover: tutti i canali shift up + massima densità
- Hard cut → silenzio con drone Bb pianissimo che scende lentamente di volume

---

## Variabili da aggiungere a config.js (opzionale)

```js
// Per ogni COMPOSER:
climax: {
    hardCutAt: 0.78,        // quando nel takeover scatta il silenzio (0-1 relativo al takeover)
    residuoDroneFade: 0.3,  // velocità di fade del drone in residuo (dt multiplier)
    velBoostPresagio: 1.05,
    velBoostInfiltrazione: 1.12,
    velBoostTakeover: 1.25,
    gateMultTakeover: 0.6,
},
```

Questo permette di fare fine-tuning dal config senza toccare il codice dei composer.
