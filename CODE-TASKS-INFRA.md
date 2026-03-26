# MACH:INE II — Task per Claude Code (Infrastruttura)
*Generato: 2026-03-26 — Questi 3 task sono INDIPENDENTI dalla partitura narrativa e possono partire subito.*

---

## PREREQUISITI

Prima di iniziare qualsiasi task:
1. Leggi SEMPRE le skill rilevanti:
   - `.claude/skills/runtime-expert/SKILL.md` (per Task 1)
   - `.claude/skills/runtime-expert/references/frontier-tech.md` (per Task 2)
   - `.claude/skills/runtime-expert/references/browser-pitfalls.md` (per Task 2)
2. Leggi `RULES.md` per le aree protette
3. Ogni modifica a `main.js`, `render.js`, `director.js` richiede approvazione esplicita

---

## TASK 1 — Ottimizzazione Performance

### Problema
Verso la fine della performance (minuto 28+), il frame rate cala. Cause identificate:
- `entities.splice(i,1)` in loop — O(n) con max 4000 entità
- 3× `map()` + object spread per frame in `director.js` durante blend scene
- Allocazioni nel render loop che causano GC spike

### Cosa fare

#### 1A. Object Pool per entità (generations.js)
- Sostituire `entities.splice(i,1)` con swap-and-pop pattern
- Implementare ObjectPool (già disponibile in `scripts/perf-utils.js`)
- Le entità "morte" vengono marcate come inattive, non rimosse dall'array
- Il render loop salta le entità inattive
- Nuove entità riutilizzano slot inattivi
- **Target**: eliminare tutti gli O(n) splice nel loop di update/render

#### 1B. Pre-allocazione buffer interpolazione (director.js — AREA PROTETTA)
- Le 3 chiamate `map()` + spread durante blend scene (linee ~548, 578, 587) creano garbage
- Pre-allocare un oggetto `blendBuffer` in `initDirector()` con tutti i campi necessari
- La funzione di blend scrive nel buffer pre-allocato invece di creare nuovi oggetti
- **Richiede approvazione** perché tocca `director.js`

#### 1C. Canvas state batching (field.js)
- Raggruppare i `fillRect` per colore simile per ridurre i cambi di `fillStyle`
- Se ci sono 50000+ fillRect, ordinare per colore prima di disegnare
- Usare ColorCache da `perf-utils.js` per evitare conversioni colore ripetute

#### 1D. Cap note MIDI visive per frame
- In `render.js` (AREA PROTETTA), limitare `newNotes` processate per frame a max 20
- Le note in eccesso vengono scartate (non accodate — il real-time non aspetta)
- Priorità: note con velocity più alta vengono processate per prime
- Aggiungere parametro `CFG.maxMidiNotesPerFrame = 20` in `config.js`

### Metriche di successo
- Frame time medio < 14ms in fase DENSITÀ con VORTICE a 138bpm
- Zero GC major spike > 20ms durante gli ultimi 12 minuti
- Misurare con `performance.now()` prima e dopo ogni sezione del render loop

---

## TASK 2 — Secondo Output (Proiettore)

### Problema
Il performer ha bisogno di due schermi: uno con HUD per controllare la performance, uno pulito per il proiettore del pubblico. Attualmente c'è un solo canvas.

### Architettura consigliata: BroadcastChannel + seconda finestra

#### 2A. Creare `projector.html`
- Pagina minimale: un `<canvas>` fullscreen, zero UI, zero HUD
- Sfondo nero, cursor nascosto
- Si connette al main via `BroadcastChannel('machine-projector')`

#### 2B. Sistema di streaming frame (in `render.js` — AREA PROTETTA)
- Dopo ogni frame renderizzato, se il projector è connesso:
  - Usare `canvas.captureStream(30)` per creare un MediaStream a 30fps (non 60 — il proiettore non ha bisogno di 60fps e costa meno)
  - Alternativa più leggera: `canvas.toDataURL('image/webp', 0.8)` ogni 2 frame e inviare via BroadcastChannel
  - Alternativa migliore (se supportata): `canvas.transferToImageBitmap()` + `postMessage` con transferable
- **Raccomandazione**: partire con `captureStream(30)` perché è il più semplice e non richiede copia manuale dei pixel

#### 2C. Tasto per aprire/chiudere proiettore
- Tasto `P` (in `main.js` handler — AREA PROTETTA) apre `window.open('projector.html', 'projector', 'fullscreen=yes')`
- Se la finestra è già aperta, la chiude
- HUD mostra stato: "PROJ: ON" / "PROJ: OFF"

#### 2D. Alternativa semplice (se captureStream non è supportato)
- La seconda finestra ha il suo `requestAnimationFrame`
- Riceve via BroadcastChannel solo lo **stato** (non i pixel): currentEngine, presenceMultipliers, firma, camera, entities (serializzati)
- Ha il suo renderer indipendente che riproduce la stessa scena
- PRO: zero costo di trasferimento pixel
- CONTRO: leggera desincronizzazione visiva (accettabile per proiezione)

### Note implementative
- `BroadcastChannel` funziona solo same-origin (OK, stessa cartella)
- `captureStream` è supportato su Chrome/Firefox, non Safari (OK per performance live)
- Il proiettore NON deve ricevere l'HUD — disegnare solo il campo visivo
- Se il proiettore viene chiuso, il main continua senza errori (check `projectorWindow.closed`)

---

## TASK 3 — Controllo Sequencer Avanzato

### Problema
Il sequencer ha solo start/stop (tasto `0`) e skip (tasto `→`). Per una performance live servono: pausa, loop su cue attuale, resume dopo crash, navigazione avanti/indietro.

### Cosa fare

#### 3A. Nuovi comandi (in `sequencer.js`)

```
COMANDI BASE:
  0         → START (invariato)
  Shift+0   → STOP con reset (invariato, ma esplicito)
  Space     → PAUSA / RESUME

NAVIGAZIONE:
  →         → Skip alla prossima cue (invariato)
  ←         → Torna alla cue precedente
  Shift+→   → Salta al prossimo atto
  Shift+←   → Torna all'atto precedente

LOOP:
  L         → LOOP: congela il sequencer sulla cue attuale.
              Il tempo continua a scorrere (i composer evolvono),
              ma nessuna nuova cue viene processata.
              Il motore attuale resta in loop all'infinito.
  Shift+L   → ESCI DA LOOP: riprendi dalla prossima cue.
              Il globalTime si riallinea alla prossima cue.
```

#### 3B. Implementazione pausa
```javascript
// Nuovo stato nel sequencer
let paused = false;
let pauseTime = 0;

export function togglePause() {
  if (!active) return;
  paused = !paused;
  if (paused) {
    pauseTime = globalTime;
    console.log(`[SEQ] PAUSA at ${formatTime(globalTime)}`);
  } else {
    console.log(`[SEQ] RESUME from ${formatTime(globalTime)}`);
  }
}

// In updateSequencer(dt):
if (paused) return; // Il tempo non avanza, tutto resta congelato
```

#### 3C. Implementazione loop
```javascript
let looping = false;

export function toggleLoop() {
  if (!active) return;
  looping = !looping;
  if (looping) {
    console.log(`[SEQ] LOOP ON — holding at cue ${cueIndex}`);
  } else {
    // Riallinea il tempo alla prossima cue
    if (cueIndex < CUES.length) {
      globalTime = CUES[cueIndex].t - 0.01;
    }
    console.log(`[SEQ] LOOP OFF — resuming narration`);
  }
}

// In updateSequencer(dt):
// Il tempo continua ad avanzare (composer evolvono)
// Ma il while-loop delle cue viene saltato:
if (!looping) {
  while (cueIndex < CUES.length && globalTime >= CUES[cueIndex].t) {
    processCue(CUES[cueIndex]);
    cueIndex++;
  }
}
```

#### 3D. Navigazione atti
```javascript
export function skipToAct(direction) {
  if (!active) return;
  const currentActObj = ACTS.find(a => globalTime >= a.start && globalTime < a.end);
  const currentIdx = ACTS.indexOf(currentActObj);
  const targetIdx = Math.max(0, Math.min(ACTS.length - 1, currentIdx + direction));
  const targetTime = ACTS[targetIdx].start;

  // Resetta e riprocessa tutte le cue fino a quel punto
  globalTime = 0;
  cueIndex = 0;
  transitions = [];
  resetAllMultipliers();
  if (_deactivateAll) _deactivateAll();

  // Fast-forward: processa tutte le cue fino al target
  while (cueIndex < CUES.length && CUES[cueIndex].t <= targetTime) {
    processCue(CUES[cueIndex]);
    cueIndex++;
  }
  globalTime = targetTime;
  console.log(`[SEQ] JUMP to ${ACTS[targetIdx].name}`);
}
```

#### 3E. Crash recovery (sessionStorage)
```javascript
const SAVE_KEY = 'machine2-sequencer-state';
const SAVE_INTERVAL = 10; // secondi

let lastSaveTime = 0;

function saveState() {
  const state = {
    globalTime,
    cueIndex,
    looping,
    presences: {},
    timestamp: Date.now(),
  };
  // Salva presence di tutti i motori
  const engines = ['terreno','meccanica','deriva','vortice','cristallo','abisso','solco'];
  for (const e of engines) state.presences[e] = getPresenceMultiplier(e);

  try {
    sessionStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch(e) { /* silently fail */ }
}

export function canRecover() {
  try {
    const saved = sessionStorage.getItem(SAVE_KEY);
    if (!saved) return false;
    const state = JSON.parse(saved);
    // Valido solo se salvato negli ultimi 5 minuti
    return (Date.now() - state.timestamp) < 300000;
  } catch(e) { return false; }
}

export function recoverState() {
  try {
    const state = JSON.parse(sessionStorage.getItem(SAVE_KEY));
    active = true;
    globalTime = state.globalTime;
    cueIndex = state.cueIndex;
    looping = state.looping || false;
    transitions = [];

    // Ripristina presenze
    for (const [engine, pm] of Object.entries(state.presences)) {
      setPresenceMultiplier(engine, pm);
      if (pm > 0.05 && _activateEngine) _activateEngine(engine);
    }

    console.log(`[SEQ] RECOVERED at ${formatTime(globalTime)} (cue ${cueIndex})`);
  } catch(e) {
    console.error('[SEQ] Recovery failed:', e);
  }
}

// In updateSequencer(dt), dopo l'aggiornamento del tempo:
if (globalTime - lastSaveTime > SAVE_INTERVAL) {
  saveState();
  lastSaveTime = globalTime;
}
```

#### 3F. Tasto recovery (in `main.js` — AREA PROTETTA)
- Al boot, se `canRecover()` è true, mostrare un indicatore nell'HUD: "PRESS Shift+R TO RECOVER"
- `Shift+R` chiama `recoverState()` e riattiva il game loop

#### 3G. HUD aggiornamento
- Mostrare stato del sequencer nell'HUD minimale:
  - `▶ 12:34 / 40:00 — III MACCHINA [LOOP]` (se in loop)
  - `⏸ 12:34 / 40:00 — III MACCHINA [PAUSED]` (se in pausa)
  - `▶ 12:34 / 40:00 — III MACCHINA` (normale)
- La funzione `getSequencerStatus()` deve esportare anche: `paused`, `looping`

### Mappatura tasti completa (aggiornamento main.js)

```javascript
// In handleKeyDown:
case 'Space':      e.preventDefault(); togglePause(); break;
case 'ArrowLeft':
  if (e.shiftKey) skipToAct(-1);
  else skipToPrev();
  break;
case 'ArrowRight':
  if (e.shiftKey) skipToAct(+1);
  else skipToNext(); // già esistente
  break;
case 'KeyL':
  if (e.shiftKey) toggleLoop(); // Shift+L = exit loop
  else toggleLoop();            // L = enter/toggle loop
  break;
```

---

## NOTA IMPORTANTE — Dipendenza dalla Partitura Narrativa

I Task 1, 2, 3 sono INDIPENDENTI dalla partitura e possono partire subito.
Tuttavia, dopo aver completato il Task 3 (Sequencer), consultare **PARTITURA-NARRATIVA.md** per:
- **Aggiungere le cue di SOLCO** al climax dell'Atto IV (t: 2040, t: 2070) — la partitura contiene l'array CUES aggiornato completo
- **Aggiornare le cue di discesa dal climax** — la partitura propone uscite scaglionate (non tutti a t: 2070)

Le modifiche ai composer (presenze, droni, phase crossfade, ecc.) sono documentate SOLO in PARTITURA-NARRATIVA.md e vanno implementate come task separato DOPO questi 3 task infrastrutturali.

---

## ORDINE DI ESECUZIONE CONSIGLIATO

1. **Task 3** (Sequencer) — più critico per la performance live, zero rischio di regressione visiva
2. **Task 1** (Performance) — misurare prima, ottimizzare dopo. Iniziare da 1A (entity pool)
3. **Task 2** (Proiettore) — può essere fatto per ultimo, è un'aggiunta non una modifica
4. **Task dalla PARTITURA** — dopo aver completato 1-3, leggere PARTITURA-NARRATIVA.md per le modifiche compositive

## FILE TOCCATI

| File | Task | Area protetta? |
|------|------|----------------|
| `sequencer.js` | 3 | No |
| `config.js` | 1 | No |
| `generations.js` | 1A | No |
| `field.js` | 1C | No |
| `director.js` | 1B | SÌ |
| `render.js` | 1D, 2B | SÌ |
| `main.js` | 2C, 3F | SÌ |
| `projector.html` (nuovo) | 2A | No |
| `presence-multiplier.js` | 3E | No |

---

*Questo documento è stato progettato per essere autosufficiente. Non aspettare la PARTITURA-NARRATIVA.md per questi task.*
