# MACH:INE II — Bugfix minuto 24+ (Clock freeze, visual blackout, caos musicale)
*Generato: 2026-03-26 — 5 task correlati, da eseguire in ordine. Risolvono il blocco dal minuto 24 in poi.*

---

## DIAGNOSI

Dal minuto 24 il sistema collassa: il clock del sequencer si blocca, le visual scompaiono, la musica diventa un muro indistinto. Le cause sono 5 problemi interconnessi che si sommano:

1. **CUES fuori ordine** → GELO mai eseguito, cue saltati
2. **Arc phase ping-pong** → director congelato, visual morte
3. **kickDominanceThreshold troppo basso** → doppio kick CH0 a BPM diversi
4. **Transizione MECCANICA→SOLCO troppo brusca** → 4 minuti di overlap a pieno regime
5. **MECCANICA cicla le fasi durante l'overlap** → reset inatteso a germoglio

---

## PREREQUISITI

Prima di iniziare qualsiasi task:
1. Leggi `.claude/skills/composition-depth/SKILL.md`
2. Leggi `RULES.md` per le aree protette (`main.js`, `render.js`, `director.js` richiedono approvazione)
3. Tutti i parametri numerici → `config.js`. No magic numbers.
4. Commenti tecnici in inglese, documentazione in italiano.
5. **CRITICO**: `sequencer.js` non è area protetta ma contiene la struttura drammaturgica — ogni modifica ai CUES deve preservare l'intento narrativo.

---

## TASK 1 — Ordinare CUES per tempo (URGENTE — causa del blocco)

### Problema
L'array `CUES` in `sequencer.js` (righe 31–109) NON è ordinato per tempo. Le cue GELO a t=1440/1470 (righe 63–64) sono posizionate DOPO le cue a t=1560 (righe 59–60).

Il sequencer processa i cue sequenzialmente per indice (riga 438):
```javascript
while (cueIndex < CUES.length && globalTime >= CUES[cueIndex].t) {
    processCue(CUES[cueIndex]);
    cueIndex++;
}
```

Quando `globalTime` raggiunge 1440, il sequencer aspetta ancora t=1560 (il prossimo cue per indice). A t=1560, processa tutto in batch: SOLCO fade, MECCANICA fade, GELO ON e GELO OFF nello **stesso frame**. Il GELO dura 0ms invece dei 30 secondi previsti.

### Cosa fare

#### 1A. Aggiungere sort automatico all'avvio — `sequencer.js` riga 31
Subito DOPO la dichiarazione dell'array `CUES` (dopo riga 109 `];`), aggiungere:

```javascript
// ── Ensure chronological cue order (fixes out-of-order firma cues) ──
CUES.sort((a, b) => a.t - b.t);
```

Questo è la fix più sicura: non tocca l'array manualmente, non rischia errori umani in futuro.

#### 1B. Riordinare manualmente le cue di ATTO III
In alternativa (o in aggiunta), spostare le righe 63–64 PRIMA delle righe 58–60. L'ordine corretto di ATTO III deve essere:

```javascript
  // ── SOLCO entra sotto MECCANICA (min 22 = t:1320) ──
  { t: 1320, action: 'layer',    engine: 'solco',     target: 0.45, duration: 30 },

  // MOMENTO-FIRMA: GELO (min 24 — machine freezes)
  { t: 1440, action: 'firma', effect: 'gelo', active: true },
  { t: 1470, action: 'firma', effect: 'gelo', active: false },

  // ── SOLCO cresce, MECCANICA sfuma (min 26 = t:1560) ──
  { t: 1560, action: 'fade_to',  engine: 'solco',     target: 0.7, duration: 30 },
  { t: 1560, action: 'fade_to',  engine: 'meccanica', target: 0.3, duration: 20 },
```

### Metriche di successo
- GELO appare nel HUD debug per 30 secondi a min 24:00
- Le entità si congelano visivamente durante GELO
- Console log: `[SEQ] FIRMA GELO ON` a t≈1440, `[SEQ] FIRMA GELO OFF` a t≈1470 (non nello stesso frame)

---

## TASK 2 — Arc phase con priorità per presence (causa del freeze visivo)

### Problema
`setArcPhaseForced()` in `director.js` (riga 1074) viene chiamata da OGNI composer attivo in `updatePhase()`, ad ogni tick del MIDI worker (~500 volte/sec). Quando due engine sono attivi simultaneamente:

```
tick N:   MECCANICA.updatePhase() → setArcPhaseForced('RELEASE')  → arc.phaseTime = 0
tick N:   SOLCO.updatePhase()     → setArcPhaseForced('INTENSE')  → arc.phaseTime = 0
tick N+1: MECCANICA.updatePhase() → setArcPhaseForced('RELEASE')  → arc.phaseTime = 0
tick N+1: SOLCO.updatePhase()     → setArcPhaseForced('INTENSE')  → arc.phaseTime = 0
...500 volte al secondo...
```

`arc.phaseTime` è SEMPRE 0, `_stateHold` è SEMPRE 999. Il director non avanza mai → nessuna transizione di scena → visual congelate in uno stato arbitrario.

### Cosa fare

#### 2A. Modificare `setArcPhaseForced` per accettare il pm — `director.js` riga 1074 (AREA PROTETTA)

Sostituire la funzione attuale:
```javascript
// VECCHIO:
export function setArcPhaseForced(newPhase) {
  arc.phase = newPhase;
  arc.phaseTime = 0;
  arc._stateHold = 999;
}
```

Con una versione che confronta la presence:
```javascript
// NUOVO:
let _arcForcedPm = 0;

export function setArcPhaseForced(newPhase, pm = 1.0) {
  // Only the engine with highest presence controls the arc
  if (pm < _arcForcedPm - 0.05) return;  // hysteresis to prevent flutter
  _arcForcedPm = pm;
  if (arc.phase !== newPhase) {
    arc.phase = newPhase;
    arc.phaseTime = 0;
  }
  arc._stateHold = 999;
}

// Reset at start of each worker tick (called from main.js)
export function resetArcPriority() {
  _arcForcedPm = 0;
}
```

**Nota**: `arc.phaseTime = 0` viene settato SOLO quando la fase cambia davvero (`arc.phase !== newPhase`). Se lo stesso engine chiama con la stessa fase, `phaseTime` continua ad avanzare.

#### 2B. Passare il pm da ogni composer — tutti i `composer*.js`

In OGNI composer, modificare la chiamata a `setArcPhaseForced` per passare il pm dell'engine.

**composer.js** (TERRENO) — riga 281:
```javascript
// VECCHIO:
setArcPhaseForced(CFG.COMPOSER.phases[phase]?.arc);
// NUOVO:
setArcPhaseForced(CFG.COMPOSER.phases[phase]?.arc, getPresenceMultiplier('terreno'));
```

**composer2.js** (MECCANICA) — riga 219:
```javascript
// VECCHIO:
setArcPhaseForced(phaseCfg.arc);
// NUOVO:
setArcPhaseForced(phaseCfg.arc, getPresenceMultiplier('meccanica'));
```

**composer3.js** (DERIVA) — riga 199:
```javascript
// VECCHIO:
setArcPhaseForced(CFG.COMPOSER3.phases[phase].arc);
// NUOVO:
setArcPhaseForced(CFG.COMPOSER3.phases[phase].arc, getPresenceMultiplier('deriva'));
```

**composer4.js** (VORTICE) — riga 264:
```javascript
// VECCHIO:
setArcPhaseForced(cfg.arc);
// NUOVO:
setArcPhaseForced(cfg.arc, getPresenceMultiplier('vortice'));
```

**composer5.js** (CRISTALLO) — riga 113:
```javascript
// VECCHIO:
setArcPhaseForced(cfg.arc);
// NUOVO:
setArcPhaseForced(cfg.arc, getPresenceMultiplier('cristallo'));
```

**composer6.js** (ABISSO) — riga 170:
```javascript
// VECCHIO:
setArcPhaseForced(cfg.arc);
// NUOVO:
setArcPhaseForced(cfg.arc, getPresenceMultiplier('abisso'));
```

**composer7.js** (SOLCO) — riga 236:
```javascript
// VECCHIO:
setArcPhaseForced(cfg.arc);
// NUOVO:
setArcPhaseForced(cfg.arc, getPresenceMultiplier('solco'));
```

#### 2C. Chiamare `resetArcPriority()` all'inizio di ogni tick — `main.js` riga 223 (AREA PROTETTA)

Nel handler `midiWorker.onmessage` (riga 223), aggiungere come prima cosa:
```javascript
midiWorker.onmessage = ({ data: { dt } }) => {
  if (!running) return;
  resetArcPriority();  // ← AGGIUNGERE QUI
  // ... rest of handler
```

Import da aggiungere in cima a `main.js`:
```javascript
import { resetArcPriority } from './director.js';
```

### Metriche di successo
- Con MECCANICA (pm=1.0) + SOLCO (pm=0.45): l'arc segue 'RELEASE' di MECCANICA (non SOLCO)
- Quando SOLCO sale a pm=0.7 e MECCANICA scende a 0.3: l'arc passa a 'INTENSE' di SOLCO
- Scene transitions riprendono durante overlap — verificare che il director cambi scena almeno 1 volta tra min 22 e min 28

---

## TASK 3 — Alzare kickDominanceThreshold a 0.6

### Problema
`kickDominanceThreshold` in `config.js` (riga 149) è 0.4. A min 22, SOLCO entra a pm=0.45 → `0.45 >= 0.4` = true → SOLCO manda kick. MECCANICA è a pm=1.0 → manda kick anche lei. Due kick su CH0 a 98 e 128 BPM = flam e salti di velocity.

### Cosa fare

#### 3A. Cambiare il threshold — `config.js` riga 149

```javascript
// VECCHIO:
kickDominanceThreshold: 0.4,
// NUOVO:
kickDominanceThreshold: 0.6,  // pm below this = kick suppressed (prevents CH0 overlap)
```

Con 0.6: SOLCO a pm=0.45 → **kick OFF**. Quando SOLCO sale a 0.7 (t=1560) → **kick ON**, e a quel punto MECCANICA è a 0.3 → **kick OFF**. Passaggio pulito.

### Metriche di successo
- Min 22–26 (SOLCO pm=0.45): solo kick MECCANICA (98 BPM)
- Min 26+ (SOLCO pm=0.7, MECCANICA pm=0.3): solo kick SOLCO (128 BPM)
- Zero flam/doppio trigger su CH0 per tutta la performance

---

## TASK 4 — Ristrutturare transizione MECCANICA→SOLCO (Atto III)

### Problema
La transizione attuale lascia MECCANICA a pm=1.0 per 4 minuti (t=1320 a t=1560) mentre SOLCO sale. L'overlap è troppo lungo e troppo denso. MECCANICA inoltre completa il suo ciclo di fasi (365s totali) a ~t=1445 e ricomincia da germoglio — un reset inatteso che rompe la coerenza.

### Cosa fare

#### 4A. Abbreviare l'overlap e anticipare il fade di MECCANICA — `sequencer.js`

Modificare i cue di ATTO III (righe 55–64) per una transizione più graduale:

```javascript
  // ── SOLCO entra sotto MECCANICA (min 22 = t:1320) ──
  { t: 1320, action: 'layer',    engine: 'solco',     target: 0.3,  duration: 30 },
  // MECCANICA inizia a scendere subito (non aspetta min 26)
  { t: 1350, action: 'fade_to',  engine: 'meccanica', target: 0.7,  duration: 30 },

  // MOMENTO-FIRMA: GELO (min 24 — machine freezes)
  { t: 1440, action: 'firma', effect: 'gelo', active: true },
  { t: 1470, action: 'firma', effect: 'gelo', active: false },

  // Dopo GELO: crossfade definitivo
  { t: 1470, action: 'fade_to',  engine: 'solco',     target: 0.7,  duration: 30 },
  { t: 1470, action: 'fade_to',  engine: 'meccanica', target: 0.2,  duration: 20 },

  // Min 25.5: MECCANICA esce, SOLCO domina
  { t: 1530, action: 'fade_to',  engine: 'meccanica', target: 0.0,  duration: 20 },
  { t: 1530, action: 'fade_to',  engine: 'solco',     target: 1.0,  duration: 30 },
```

**Vantaggi rispetto all'originale:**
- MECCANICA scende a 0.7 dopo 30s (non resta a 1.0 per 4 minuti)
- Con threshold 0.6: a pm=0.7 MECCANICA tiene il kick, a pm=0.3 SOLCO lo prende → passaggio pulito
- GELO (30s) cade nel punto esatto del crossfade → effetto drammatico
- MECCANICA esce a min 25.5 invece di min 26 → non cicla mai le fasi (365s - 450s di attività = no reset)
- Totale overlap = ~3.5 min (era 4) ma con pm più bassi → meno carico

#### 4B. Verificare che MECCANICA non cicli — calcolo

MECCANICA attivata a t=1080 (min 18). Con il nuovo schema, esce a t=1530 (min 25.5).
Tempo attivo = 1530 - 1080 = **450 secondi**.
Fasi MECCANICA: 45+65+130+35+90 = **365 secondi**.
450 > 365 → MECCANICA ciclerebbe comunque!

**Soluzione**: aggiungere la flag `noCycle` nella config, oppure estendere la fase dissoluzione di MECCANICA.

#### 4C. Estendere dissoluzione MECCANICA — `config.js` riga 205

```javascript
// VECCHIO:
dissoluzione: { duration: 90, mode: 'Cs_dorian', drone: 61, arc: 'RELEASE' },
// NUOVO:
dissoluzione: { duration: 180, mode: 'Cs_dorian', drone: 61, arc: 'RELEASE' },
```

Con dissoluzione = 180s, totale fasi = 45+65+130+35+180 = **455s**. MECCANICA non cicla mai se è attiva per 450s.

**Alternativa**: se l'estensione cambia troppo il comportamento standalone, aggiungere una fase terminal in `composer2.js`:
```javascript
// In updatePhase(), dopo il modulo:
if (phaseTime >= phaseCfg.duration) {
    phaseIndex = (phaseIndex + 1) % CFG.COMPOSER2.phaseOrder.length;
    // Se siamo in overlap con altro engine e torniamo a germoglio,
    // resta in dissoluzione invece di ciclare
    if (getPresenceMultiplier('meccanica') < 0.5 && currentPhaseName() === 'germoglio') {
        phaseIndex = CFG.COMPOSER2.phaseOrder.length - 1; // torna a dissoluzione
    }
```

### Metriche di successo
- MECCANICA non cicla mai a germoglio durante ATTO III
- L'overlap ha un arco chiaro: MECCANICA dominante → crossfade → SOLCO dominante
- Il GELO è visibile e dura 30 secondi
- FPS stabile sopra 25 per tutto ATTO III

---

## TASK 5 — Revisione musicale della densità post-min 24

### Problema
Anche con i fix tecnici, la combinazione MECCANICA dissoluzione + SOLCO densità è musicalmente troppo densa. Due motori a BPM diversi (98 vs 128) con armoniche distanti (C# Dorian vs G Dorian) creano un muro sonoro.

### Cosa fare

#### 5A. SOLCO parte in germoglio con pm ridotto → entry graduale
Il `layer` cue a t=1320 usa `target: 0.3` (Task 4A lo ha già ridotto da 0.45 a 0.3). Questo, combinato con PHASE_PRESENCE7 del germoglio:
```
germoglio: [1.0, 0.3, 0.3, 0.6, 0.0, 0.0, 0.0]
           KICK  HAT  DRONE BASS CHORD VOICE RIDE
```
...con pm=0.3 e threshold 0.6 → il kick di SOLCO è OFF (0.3 < 0.6). Si sente solo il basso + drone + hat leggerissimo. **Nessuna modifica necessaria** — è una conseguenza dei fix precedenti.

#### 5B. Estendere germoglio SOLCO per l'overlap — `config.js` riga 380

```javascript
// VECCHIO:
germoglio: { duration: 35, mode: 'G_dorian', drone: 55, arc: 'SILENCE' },
// NUOVO:
germoglio: { duration: 60, mode: 'G_dorian', drone: 55, arc: 'SILENCE' },
```

Con germoglio da 60s: SOLCO entra a t=1320, germoglio dura fino a t=1380 (min 23). Solo poi passa a pulsazione (bass più assertivo + hat). Densità arriva a t=1380+55 = t=1435 (min ~24), esattamente quando MECCANICA sta scendendo. Timing perfetto.

**Ricalcolo fasi SOLCO**: 60+55+80+28+65 = **288s** (era 263s). SOLCO entra a t=1320, esce a t=1320+288 = t=1608. Se deve restare fino all'ATTO IV (t=1680), ci sono 72s di buffer — OK, è in dissoluzione.

#### 5C. MECCANICA in dissoluzione tarda → ridurre la densità dei layer

Nessun cambio di codice: la dissoluzione di MECCANICA ha già `silenceTarget: 0.60` (config.js riga 223), che sopprime attivamente i canali meno necessari. Con pm in calo (0.7 → 0.2 → 0.0), la velocity scaling riduce ulteriormente l'output.

### Metriche di successo
- Min 22–23: si sente MECCANICA dominante + un basso/drone lontano di SOLCO
- Min 23–24: SOLCO pulsazione emerge, MECCANICA cala
- Min 24–24.5: GELO congela tutto (30 secondi di tensione)
- Min 24.5–25.5: SOLCO prende il sopravvento, MECCANICA scompare
- Il passaggio è progressivo, non un muro

---

## RIEPILOGO MODIFICHE PER FILE

| File | Righe | Modifiche |
|------|-------|-----------|
| `sequencer.js` | 31–109 | Sort CUES + riordino manuale ATTO III + nuovi cue crossfade |
| `director.js` | 1074–1078 | `setArcPhaseForced` con pm priority + `resetArcPriority()` export |
| `main.js` | 223 | Import + call `resetArcPriority()` nel worker handler |
| `config.js` | 149 | `kickDominanceThreshold: 0.6` |
| `config.js` | 205 | MECCANICA dissoluzione da 90s a 180s |
| `config.js` | 380 | SOLCO germoglio da 35s a 60s |
| `composer.js` | 281 | Passare pm a `setArcPhaseForced` |
| `composer2.js` | 219 | Passare pm a `setArcPhaseForced` |
| `composer3.js` | 199 | Passare pm a `setArcPhaseForced` |
| `composer4.js` | 264 | Passare pm a `setArcPhaseForced` |
| `composer5.js` | 113 | Passare pm a `setArcPhaseForced` |
| `composer6.js` | 170 | Passare pm a `setArcPhaseForced` |
| `composer7.js` | 236 | Passare pm a `setArcPhaseForced` |

**File con area protetta**: `director.js`, `main.js` → richiedono approvazione.

---

## ORDINE DI ESECUZIONE

1. **TASK 1** (sort CUES) — fix immediato, zero rischi
2. **TASK 2** (arc priority) — richiede approvazione per director.js e main.js
3. **TASK 3** (threshold 0.6) — una riga in config.js
4. **TASK 4** (ristrutturare transizione) — il più delicato, tocca la drammaturgia
5. **TASK 5** (timing fasi) — tuning finale, solo config.js

Dopo ogni task: testare nel browser dal minuto 20 al minuto 28 usando `→` per avanzare velocemente.
