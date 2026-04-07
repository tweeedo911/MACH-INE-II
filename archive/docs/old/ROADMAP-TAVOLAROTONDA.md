# MACH:INE III — Roadmap post-Tavola Rotonda

*Generata il 2026-04-06 — Review completa con 7 ruoli creativi*

---

## Diagnosi

**Verdetto del Direttore Artistico:**
> MACH:INE III suona come un fade-in di 43 minuti, non come musica con sorprese vere.

**Voti del team:**
- Compositore: ★★★ — triadi nude, basso scollegato, melodia ignora chord tones
- Producer: ★★★ — mix piatto, harmony ceiling costante, arp TEMPESTA inudibile
- Performer: ★★★½ — arco funziona sulla carta ma macchina non dialoga
- Regista Visivo: ★★★★ — vocabolario maturo, omologazione interna tra composizioni
- Tecnico: 🟡 GIALLO — due fix obbligatori pre-live

**3 convergenze unanimi:**
1. Arco dinamico insufficiente (tutto suona uguale troppo a lungo)
2. Tracce non si differenziano musicalmente (stesse probabilità, stessa pipeline)
3. Silenzi e transizioni = punto debole strutturale

---

## Fase 0 — FIX TECNICI OBBLIGATORI (pre-live)

> Senza questi il live non è possibile. Si fanno prima di tutto.

### 0.1 — getImageData → drawImage nel glitch

**File:** `src/field.js` righe 248-249
**Problema:** `getImageData()` su canvas 1920×1080 alloca 8.3MB + GPU readback ogni attivazione glitch. In rottura (~2% per frame a 30fps) = ~180 attivazioni in 43 min = 1.5GB di garbage.
**Fix:**
```javascript
// PRIMA:
const imgData = ctx.getImageData(0, 0, W, H);
ctx.putImageData(imgData, shift, 0);

// DOPO:
ctx.drawImage(ctx.canvas, shift, 0);
```
**Complessità:** 15 minuti. Test: verificare che il glitch canvas-shift funzioni visivamente.

---

### 0.2 — setTimeout nel MIDI path → timestamp hardware

**File:** `src/rhythm-layer.js` riga 58, `src/melody-texture-layer.js` riga 151
**Problema:** `setTimeout(() => _rawSend(...), offset)` — Chrome throttla setTimeout a 1000ms quando il tab perde focus. Se il performer guarda Ableton, il MIDI si spappola.
**Fix:** Usare il timestamp hardware del Web MIDI API:
```javascript
// PRIMA:
setTimeout(() => _rawSend(ch, note, vel, dur), Math.max(0, offset));

// DOPO:
_rawSend(ch, note, vel, dur, performance.now() + Math.max(0, offset));
// dove _rawSend passa il timestamp a midiOut.send([0x90|ch, note, vel], timestamp)
```
**Complessità:** 2 ore. Richiede modifica a `_rawSend` in `midi.js` per accettare timestamp opzionale. Test: verificare con tab in background che il timing sia stabile.

---

### 0.3 — noteFlashes: swap-and-pop

**File:** `src/midi.js` riga 130
**Problema:** `splice(i, 1)` su array fino a ~1000 elementi = O(n) per ogni rimozione.
**Fix:**
```javascript
// PRIMA:
midi.noteFlashes.splice(i, 1);

// DOPO:
midi.noteFlashes[i] = midi.noteFlashes[midi.noteFlashes.length - 1];
midi.noteFlashes.length--;
```
**Complessità:** 10 minuti. Stesso pattern già usato in generations.js.

---

## Fase 1 — STRUTTURA MUSICALE (cambia il concerto)

> Queste azioni trasformano il gradiente in una composizione con sorprese.

### 1.1 — Bass chord-aware

**File:** `src/bass.js` funzione `_tick()`
**Problema:** Gli offset del bass pattern (0, 3, 5, 7) sono relativi al root della traccia, NON all'accordo corrente. Il basso di SOLCO suona la quinta di G anche quando l'accordo è Bb → dissonanza.
**Fix:** Leggere `worldState.currentChord` e mappare gli offset sui gradi dell'accordo:
- offset 0 → root dell'accordo
- offset 3-4 → terza dell'accordo (chordNotes[1])
- offset 5-7 → quinta dell'accordo (chordNotes[2])
**Dettaglio:** Se `currentChord` è `[58, 62, 65]` (Bb), offset 7 (quinta) diventa 65 (F) non 62 (D).
**Complessità:** 3 ore. Test: ascoltare SOLCO e MACCHINA — il basso deve seguire l'armonia.

---

### 1.2 — Chord-tone targeting nella melodia

**File:** `src/melody.js` funzione `_generatePhrase()`
**Problema:** Le frasi melodiche sono Markov su scala senza preferenza per le note dell'accordo. Risultato: "random walk" che non aderisce all'armonia sui tempi forti.
**Fix:** Nel pool di note candidate, quelle presenti in `worldState.currentChord` (mod 12) ricevono peso 2.5×. Le chord tones vengono preferite senza eliminare le altre.
```javascript
const chordPCs = new Set();
if (worldState.currentChord) {
  worldState.currentChord.forEach(n => chordPCs.add(n % 12));
}
// Nel weighted random: peso = chordPCs.has(note % 12) ? 2.5 : 1.0
```
**Complessità:** 2 ore. Test: le frasi devono suonare "dentro" l'armonia senza perdere libertà.

---

### 1.3 — Rompere il gradiente: contro-movimenti nell'arco 4D

**File:** `src/tracks.js` (phase density profiles), `src/director3.js`
**Problema:** melodicActivity, rhythmDensity, harmonicColor salgono e scendono monotonamente. Il critico: "il concerto è un gradiente".
**Fix:** Inserire almeno 3 "dip" dove le dimensioni si dissociano:

| Dove | Cosa | Effetto |
|------|------|---------|
| SOLCO densità (bar ~40) | rhythmDensity sale a 0.9 ma harmonicColor SCENDE a 0.3 | Il groove diventa ossessivo ma armonicamente nudo — tensione |
| MACCHINA pulsazione (bar ~30) | melodicActivity spike a 0.8 ma rhythmDensity resta 0.4 | La melodia esplode sopra un groove contenuto — respiro |
| TEMPESTA densità (bar ~50) | Tutte le dimensioni DROP a 0.2 per 8 bar poi rimbalzano | Mini-false-resolution interna — il pubblico pensa sia finita |

**Complessità:** 4 ore. Richiede modifica ai PHASE_DENSITY in tracks.js e possibilmente un meccanismo di "density override" temporaneo in director3.
**Test:** Ascoltare l'intero arco — i contro-movimenti devono essere percepibili ma non gratuite.

---

### 1.4 — Implementare 3 silenzi strutturali

**File:** `src/director3.js`
**Problema:** Il vecchio sequencer.js aveva `silence_breath`. Il nuovo director3 non li implementa. I silenzi strutturali sono il gesto più potente del concerto e sono ASSENTI.
**Fix:** Aggiungere un meccanismo di silenzio programmato nel director3:

| Silenzio | Posizione | Durata | Contesto |
|----------|-----------|--------|----------|
| #1 | Fine SOLCO → RESPIRO | 6s | Dopo 8 min di groove — il pubblico trattiene il fiato |
| #2 | Metà MACCHINA | 5s | Break interno — respiro prima della TEMPESTA |
| #3 | Fine TEMPESTA → RITORNO | 8s | Il più lungo — dopo il climax, prima della dissoluzione |

Implementazione: `sendMIDIAllNotesOff()` + `worldState.silenceActive = true` + timer. I layer consultano `worldState.silenceActive` e non emettono.
**Complessità:** 3 ore. Test: verificare che all-notes-off sia pulito (no note appese).

---

### 1.5 — Velocity ceiling e arp udibile

**File:** `src/tracks.js`, `src/melody.js`
**Problema:**
- Harmony ceiling quasi piatto (50-75) per tutto il concerto — gli accordi non sono MAI protagonisti
- Arp TEMPESTA a velocity 17-22 — sotto soglia udibilità di qualsiasi hardware

**Fix — velocity ceiling per traccia:**

| Traccia | harmony attuale → nuovo | melody attuale → nuovo |
|---------|------------------------|----------------------|
| NEBBIA | 50 → 50 (ok) | 60 → 60 (ok) |
| TESSUTO | 75 → 85 | 55 → 60 |
| SOLCO | 60 → 70 | 75 → 80 |
| MACCHINA | 60 → 75 | 80 → 85 |
| **TEMPESTA** | **65 → 95** | **85 → 100** |
| RITORNO | 55 → 55 (ok) | 70 → 70 (ok) |

**Fix — arp velocity:**
- `melody.js ARP_VEL_BASE`: 35 → 50
- `tracks.js TEMPESTA.arpVelScale`: 0.4 → 0.65

**Complessità:** 1-2 ore. Test: suonare TEMPESTA — gli accordi devono esplodere, l'arp deve essere udibile.

---

## Fase 2 — MOMENTI CHIAVE (i 3 momenti memorabili)

### 2.1 — Buffer post-false-resolution

**File:** `src/director3.js`, `src/tracks.js` (TEMPESTA rottura → dissoluzione)
**Problema:** Dopo 22s di vuotoTotale, il rimbalzo parte a rD 0.95 in 1 secondo. Il performer sta ancora elaborando il silenzio.
**Fix:**
- Dopo il blackout: 8 bar di solo drone CH2 a velocity 30 (un filo nel buio)
- Poi graduale re-entry: prima hat a vel 25, poi kick sparse, poi melodia
- Il rimbalzo raggiunge rD 0.5 dopo 16 bar, non 0.95 in 1 secondo
- Il picco post-rimbalzo arriva dopo 32 bar (non subito)

**Complessità:** 2 ore. Test: ascoltare la transizione false-resolution → rimbalzo — deve sentirsi come una rinascita, non come un muro.

---

### 2.2 — Accorciare RITORNO da 8 a 5 minuti

**File:** `src/tracks.js` (RITORNO phases)
**Problema:** 8 minuti di dissoluzione dopo il climax. Dopo il seed in augmentation (~36:30), ci sono quasi 7 minuti dove il performer non ha niente su cui aggrapparmi.
**Fix:** Ridurre le durate fase RITORNO:
- germoglio: 24 → 16 bar
- pulsazione: 32 → 24 bar
- densità: 32 → 24 bar
- rottura: 16 → 8 bar
- dissoluzione: 48 → 24 bar
- Totale: 152 → 96 bar ≈ 5 min (a 86 BPM)

**Plus:** Aggiungere un ultimo gesto — un singolo accordo CH4 in A lydian a ~39', vel 70, durata 10s. L'ultimo suono della macchina.
**Complessità:** 1 ora. Test: il concerto deve sentirsi "finito" non "sfumato".

---

### 2.3 — Cromatismo invertito

**File:** `src/harmony-layer.js` (se usato) o `src/harmony.js`
**Problema:** Il cromatismo è attivo in NEBBIA (12% passing tones) e disattivato in TEMPESTA. Esattamente il contrario.
**Fix:**
```javascript
// DA:
if (chordEvery > 1 && Math.random() < 0.12)
// A:
if (hC > 0.30 && Math.random() < 0.08 + hC * 0.08)
```
Risultato: 0% cromatismo sotto hC 0.30 (NEBBIA), ~12% a hC 0.50, ~14% a hC 0.80 (TEMPESTA).
**Complessità:** 30 minuti.

---

## Fase 3 — POLISH VISIVO E RITMICO

### 3.1 — Differenziare rottura per composizione

**File:** tutti i `src/comp-*.js`
**Problema:** Tutte le composizioni reagiscono alla rottura con la stessa formula glitch.

| Composizione | Rottura attuale | Rottura proposta |
|-------------|----------------|-----------------|
| comp-liminale | glitch + vanish jump | Vanishing point si moltiplica (2-3 fuochi) |
| comp-linee | color flash + jitter | Linee si spezzano in segmenti con gap |
| comp-quadrati | density flicker + jump | Blocchi si moltiplicano e collidono |
| comp-negativo | buchi grandi + veloci | Buchi smettono di chiudersi, colore cola dai bordi |
| comp-griglia | glitch + grid jolt | Colonne/righe si spostano ±1-2 celle |
| comp-treno | reverse + sparkle | Piani parallasse si invertono (fondo veloce, primo piano lento) |

**Complessità:** 4 ore (45 min per composizione). Test: ogni rottura deve essere visivamente unica.

---

### 3.2 — Hat variabile + kick humanize

**File:** `src/rhythm.js`
**Problema:** Hat uniforme per tutta la durata della fase. Kick humanize ±4 impercettibile.

**Fix hat — variazione su frase 4 bar:**
```javascript
// bar 0-1: pattern base (straight 8th)
// bar 2: push al step 7 (open hat anticipato)
// bar 3: apertura step 14-15 (respiro prima del downbeat)
```

**Fix kick:** humanize da ±4 a ±8:
```javascript
Math.random() * 8 - 4  →  Math.random() * 16 - 8
```

**Plus — downbeat boost:** +10% velocity su step 0, 4, 8, 12.
**Complessità:** 2 ore. Test: il groove deve sentirsi "vivo" non "programmato".

---

### 3.3 — Voicings a 4 note (opzionale)

**File:** `src/tracks.js` (chord arrays)
**Problema:** Tutte le progressioni sono triadi di 3 note close-position. MACCHINA: Dm→G→Am→Em = la più banale in D dorian.
**Fix esempio SOLCO:**
```javascript
// DA:
[55, 58, 62],  // Gm
[57, 60, 64],  // Am

// A:
[55, 58, 62, 65],  // Gm7
[57, 60, 64, 67],  // Am7
```
**Priorità bassa** — migliora la ricchezza armonica ma è un intervento su dati, non struttura. Da fare dopo aver verificato che chord-tone targeting (1.2) e bass chord-aware (1.1) funzionino.
**Complessità:** 2 ore per tutte le tracce.

---

## Checklist pre-sessione

```
[ ] Leggere questo file
[ ] Fase 0: fix tecnici (1, 2, 3) — ~2.5h
[ ] Fase 1: struttura musicale (1.1-1.5) — ~12h
[ ] Fase 2: momenti chiave (2.1-2.3) — ~3.5h
[ ] Fase 3: polish (3.1-3.2) — ~6h
[ ] Test completo: ascoltare l'intero arco dall'inizio alla fine
```

**Stima totale: ~24 ore di lavoro distribuite su 2-3 sessioni.**
**Sessione 1 (prioritaria):** Fase 0 + Fase 1 (1.1, 1.2, 1.4, 1.5) = il concerto cambia radicalmente.
**Sessione 2:** Fase 1 (1.3) + Fase 2 + Fase 3.1 = i momenti chiave prendono forma.
**Sessione 3:** Fase 3.2, 3.3 + test integrale = polish e verifica.

---

*Documento generato dalla tavola rotonda del 2026-04-06 con tutti e 7 i ruoli creativi.*
