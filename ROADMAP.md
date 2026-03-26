# MACH:INE II — Roadmap

Ogni milestone produce qualcosa di testabile, visivamente completo e utilizzabile da solo.

---

## v0.1.0–v2.4.0 — DONE

Storia completa nei commit. Ultima versione stabile: v2.4.0 (archiviata in `versions/v2.4.0-index.html`).

---

## v2.5.0 — DONE: Struttura 50 minuti + Percussioni

**Obiettivo:** ridisegnare la partitura drammaturgica per dare a SOLCO lo spazio narrativo che merita, correggere le percussioni sparse e risolvere i bug strutturali più critici (non-potenze-di-2).

### 2.5.1 — Sequencer: 5 atti → 50 minuti

**File:** `src/sequencer.js`

| Cambio | Dettaglio |
|--------|-----------|
| Durata totale | 2400s (40min) → 3000s (50min) |
| Atto I EMERGENZA | 0–480s (invariato) |
| Atto II DISCESA | 480–1080s (invariato) |
| Atto III MACCHINA | 1080–1680s (invariato, GELO al centro) |
| **Atto IV ACCELERAZIONE** | **1680–2520s — NUOVO** |
| Atto V DISSOLUZIONE | 2520–3000s (esteso 240s → 480s) |

**Atto IV dettaglio:**
- t=1680: VORTICE solo (pm=0.8), ABISSO sfondo (pm=0.3) — 5min transizione
- t=1980: SOLCO entra (pm=0.0→1.0 in 120s), VORTICE cala (pm=0.8→0.4)
- t=2100: SOLCO domina (pm=1.0), VORTICE si ritira (pm=0.4→0.0 in 60s)
- t=2160: SOLCO solo — 2min di vuoto/purezza techno
- t=2280: GELO (silenzio 8 battute) — nel contesto techno è deflagrazione
- t=2340: CLIMAX ridotto — solo SOLCO+VORTICE+ABISSO (pm=1.0 tutti e tre)
- t=2460: dissoluzione verso Atto V

**Climax:** da 6 engines simultanei (caos armonico) a SOLCO+VORTICE+ABISSO.
VORTICE (E Phrygian) e SOLCO (G Dorian) condividono E come sesta naturale — tensione leggibile. ABISSO (Bb Phrygian) aggiunge la dissonanza di tritono che dà massa.

### 2.5.2 — Percussioni: grain floor e continuità

**TERRENO** (`src/composer.js`)
- Grain probability: `presence[5] * 0.55` → `Math.max(0.32, presence[5] * 0.55)`
- Aggiungere ghost note al beat 8 (ogni 16 step): prob=0.55, vel 18–28, nota D2 (MIDI 38)
- Effetto: il grain non scompare mai del tutto, crea continuità ritmica sotto al basso

**ABISSO** (`src/composer6.js`)
- Grain restructure: due livelli
  - Beat 3 (step 8): prob `Math.max(0.35, presence[3] * 0.55)`, vel 22–42 (ancora gutturale)
  - Beat 4 e 12 (step 12): prob `Math.max(0.18, presence[3] * 0.35)`, vel 14–28 (eco)
- Effetto: pattern 3+eco invece di impulso casuale — mantiene identità rituale

**SOLCO** (`src/composer7.js`) — ride redesign completo
- Rimpiazzare nota singola Bb5 con due layer sovrapposti:
  - Closed hat (ogni 8th, step pari): MIDI Bb5 (82), vel range 40–68
  - Open hat (beat 2 e 4, step 4 e 12): MIDI D5 (74), vel range 55–73
- Anti-phase breathing: closed hat velocity varia in controfase con il velocity sweep del basso
  - Quando basso è forte (sweepPhase alto) → hat chiuso più leggero
  - Quando basso respira (sweepPhase basso) → hat chiuso più marcato
  - Formula: `velHat = 54 + Math.sin(sweepPhase + Math.PI) * 14`

### 2.5.3 — Bug strutturali: non-potenze-di-2 (CRITICI)

Tutte le lunghezze di sezione devono essere 2/4/8/16/32 — regola fondamentale del sistema.

| File | Pattern errato | Correzione |
|------|---------------|------------|
| `src/composer.js` | `bar % 12 === 0` (bass rotation) | `bar % 16 === 0` |
| `src/composer2.js` | `bar2 % 6 === 0` (kick rotation) | `bar2 % 8 === 0` |
| `src/composer4.js` | `GHOST_VAR_BARS = 12` | `GHOST_VAR_BARS = 16` |
| `src/composer4.js` | `MICRO_VAR_BARS = 10` | `MICRO_VAR_BARS = 8` |
| `src/composer5.js` | `beat % 24 === 0` (drone) | `beat % 16 === 0` |
| `src/composer6.js` | `bar % 10 === 0` (bass rotation) | `bar % 8 === 0` |
| `src/composer6.js` | `lastDroneStep6 >= 16 * 12` (drone ogni 12 bar) | `>= 16 * 16` (ogni 16 bar) |

### 2.5.4 — Progressioni accordali: non-potenze-di-2

**DERIVA** (`src/composer3.js`)
- `COMPOSER3.chordProgressions.densita`: attualmente 6 accordi (ciclo 12 virtual bar)
- Aggiungere 2 accordi per arrivare a 8 → ciclo 16 virtual bar (potenza di 2)
- Proposta A Lydian estesa: `[A, B, C#, E, F#, A, G#m, F#add9]` — l'ultimo paio aggiunge risalita

**CRISTALLO** (`src/composer5.js`)
- Progressione densita: attualmente 6 accordi E Lydian
- Estendere a 8: aggiungere `Bmaj7/D#` e `Amaj7` come ritorno — circolarità classica in Lydian

### 2.5.5 — Bug: voice overlap su CH5

**Causa 1 — intra-phrase overlap (TERRENO):**
In `densita`, `noteCount` = 2–3 note via `setTimeout`. Durata note: 1.5–2.7s. Delay tra note: 0.8–1.6s. La nota 0 e la nota 1 si sovrappongono su CH5 per ~1s. Su strumento monofono → ogni note-on taglia il precedente → stutter/retrigger anomalo.

**Fix:** cap dur delle note non-finali nella frase a `delay_to_next - 50ms`. Solo l'ultima nota prende la dur piena.

**File:** `src/composer.js` riga ~392

**Causa 2 — inter-engine CH5 conflict (tutti i 7 engine):**
`PRIMARY_CH` in `presence-multiplier.js` assegna CH5 (VOICE) a tutti e sette gli engine. `isChannelAllowed()` controlla solo l'appartenenza alla lista, non arbitra conflitti tra engine che condividono lo stesso canale. Durante le transizioni del sequencer (due engine attivi con pm > 0.05) entrambi mandano note a CH5 in contemporanea.

**Fix:** aggiungere guard `getPresenceMultiplier(engine) > 0.5` alla sezione VOICE di ogni composer. Solo l'engine dominante invia note melodiche.

**File:** sezione VOICE in tutti i 7 composer + `src/presence-multiplier.js`

---

### 2.5.6 — SOLCO voice: rendere raggiungibile in concerto

**File:** `src/composer7.js`
- Voice attuale: ogni 32 bar con prob=0.6 → ~una voice ogni 53 bar
- SOLCO appare per 14min in Atto IV (840s → ~75 bar a 128bpm)
- Nuovo trigger: ogni 16 bar con prob=0.75 → ~una voice ogni 21 bar (3–4 occorrenze per atto)
- Abbassare octave shift massimo: da 2 ottave a 1 ottava (evitare MIDI oltre 84)

---

## v2.6.0 — PROSSIMO: Visual Directing + Qualità Musicale Profonda

**Obiettivo:** implementare i profili visivi per engine (attualmente tutti vuoti), approfondire la qualità compositiva dei 7 engines, correggere i bug musicali secondari.

### 2.6.1 — Visual Directing: profili per engine

**File:** `src/director.js`, `src/field.js`, `src/midi-patterns.js`

| Engine | Gap attuale | Implementazione |
|--------|-------------|-----------------|
| TERRENO | Nessun feedback frame | Decay frame 0.94 — strato di terra sotto le entità |
| DERIVA | Nessun feedback frame | Decay frame 0.97 — scie diafane |
| CRISTALLO | Nessun feedback frame | Decay frame 0.95 — riverbero cristallino |
| VORTICE | Nessuna inversione ritmica | Inversione visiva ogni 4 beat (sync 138bpm) |
| SOLCO | Nessun loop ipnotico | Entità bloccate in orbita fissa con fase che avanza |
| ABISSO | Nessuna palette abissale | Profondo blu-viola con entità rarissime |
| MECCANICA | Nessun pattern meccanico | Grid rigida con snap quantizzato |

### 2.6.2 — Qualità musicale: stato vs. reset

**File:** `src/composer4.js`, `src/composer5.js`
- VORTICE: `voiceMotifIdx` non viene resettato al cambio di fase → reset in `startPhase()`
- CRISTALLO: `shimmerPatIdx` non viene resettato al cambio di fase → reset in `startPhase()`
- Effetto: le progressioni ricominciano dall'inizio a ogni cambio, più leggibile narrativamente

### 2.6.3 — CRISTALLO: cluster rupture con logica Markov

**File:** `src/composer5.js`
- Cluster rupture usa `Math.random()` puro su scala F locrian
- Rischio: suona come errori MIDI casuali
- Sostituire con matrice di transizione semplice (5×5) — ogni nota ha probabilità di
  movimento per gradi congiunti vs. salti — il risultato suona come "rottura controllata"

### 2.6.4 — ABISSO: heartbeat indipendente dal basso

**File:** `src/composer6.js`
- Attuale: `presence[0]` controlla sia basso che heartbeat pulse insieme
- Separare: heartbeat usa proprio threshold (es. `presence[0] > 0.2` sempre attivo quando engine è presente), basso usa `presence[0]` per velocity

### 2.6.5 — DERIVA: centroid history senza O(n) shift

**File:** `src/composer3.js`
- `centroidHistory.shift()` ogni frame su buffer di 30 — O(n) copy
- Sostituire con ring buffer circolare (indice wrapping)
- Questo è il bug di performance più costoso nei composer

### 2.6.6 — ABISSO: range MIDI octShift

**File:** `src/composer6.js`
- `octShift=24` può portare note voice a MIDI 87–104 (fuori range molti strumenti)
- Clampare a max MIDI 84 (C6)

---

## v2.7.0 — Performance Runtime + Stabilità

**Obiettivo:** eliminare gli anti-pattern noti che causano GC pressure e O(n) nascosti.

### 2.7.1 — Object pool per entities

**File:** `src/generations.js`
- `entities.splice(i,1)` in loop di update → O(n) ad ogni morte
- Pattern corretto: swap-and-pop + ObjectPool
- Impatto: ~200 operazioni O(n) per frame al picco (200 entità)

### 2.7.2 — Pre-allocare buffer blend scene

**File:** `src/director.js`
- blend scene usa `map()` + object spread per frame → 3 array temporanei per frame a 60fps
- Pre-allocare buffer di scene objects, aggiornare in-place

### 2.7.3 — Eliminare .filter() per conteggio

**File:** `src/composer.js`, `src/composer2.js`, `src/composer4.js`, `src/composer5.js`, `src/composer6.js`, `src/composer7.js`
- Ogni composer usa `presence.filter(p => p > threshold).length` per contare engine attivi
- Sostituire con loop con contatore — nessuna allocazione array
- Fix in tutti e 7 i composer in una sola passata

### 2.7.4 — setTimeout in onStep

**File:** `src/composer.js` (TERRENO)
- `setTimeout()` dentro `onStep()` per voice release → timing drift cumulativo
- Sostituire con `onStep()`-driven state machine (contatore beat → release)

### 2.7.5 — Rimuovere console.log residui

**File:** tutti i src/
- Audit completo `console.log` e `console.warn` non gated da `CFG.debug`
- Aggiungere flag `if (CFG.debug)` a tutti i log rimanenti

### 2.7.6 — DERIVA: banda audio con fallback esplicito

**File:** `src/composer3.js`
- `audio.bands?.air` con optional chaining — se `bands` non è inizializzato, cade silenziosamente
- Aggiungere fallback esplicito: `const air = audio.bands?.air ?? audio.rms * 0.3`

---

## v3.0.0 — Ecosistema Aperto (futuro)

- Stabilità >2h: memory leak audit, fossil/entity pruning aggressivo
- Sessione salvabile: preset DNA + fase composer come JSON
- Snapshot visivo: `canvas.toBlob()` → download PNG
- OSC support via WebSocket bridge
- Three.js migration: rendering 3D opzionale (toggle 2D/3D)
- Documentazione pubblica del protocollo compositivo

---

## Priorità assoluta per performance imminente

v2.5.0 completata — tutti i task pre-concerto implementati. Proseguire con v2.6.0.

---

*Ultima modifica: 2026-03-26*
