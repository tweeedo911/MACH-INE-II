# SESSION NEXT — Briefing per la prossima sessione

*Generato a fine sessione 2026-04-07. Leggere prima di riprendere i lavori sulla musica.*

---

## Stato a fine sessione 2026-04-07

### Fix tecnici applicati (Fase 0 della roadmap)
- ✅ `field.js:248-249` — `getImageData/putImageData` → `drawImage` (canvas-shift glitch, zero alloc)
- ✅ `midi.js:130` — `noteFlashes.splice` → swap-and-pop (O(1) removal)

### Framework A/B/C completato
3 modalità musicali coesistono nel codice, toggle a runtime senza reload:

| Mode | Flag | Hotkey | Cosa fa |
|------|------|--------|---------|
| **A** | tutto off | (default) | v1 originale, baseline pre-tavola-rotonda |
| **B** | `MUSIC_EXPERIMENT` on | `M` | v2 calibrazione (chord-tone leggero, ceiling alzati, RITORNO corto, silenzi strutturali) |
| **C** | `MUSIC_STRUCTURAL` on | `N` | v3 strutturale (call-response off-grid, floor-kick offset) |
| **D** | M+N on | `M` poi `N` | v2+v3 combinati |

**HUD:** doppio badge in basso a destra `M·v1\|v2` + `N·off\|v3`.

### File creati/modificati in questa sessione

**Nuovi file:**
- `src/bass-v2.js` — chord-aware (poi rollback a v1: era TROPPO; placeholder per future modifiche)
- `src/melody-v2.js` — chord-tone bias 1.3 (light) solo sulla prima nota della frase
- `src/bass-v3.js` — placeholder = v1, slot futuro per cycle extension (B.4)
- `src/melody-v3.js` — call-response Olafur off-grid: voice CH5 → lead CH6 con delay reale 200-500ms

**File modificati:**
- `src/config.js` — aggiunti `MUSIC_EXPERIMENT` e `MUSIC_STRUCTURAL` (entrambi default false)
- `src/tracks.js` — `applyMusicExperimentOverrides(enable)` reversibile con snapshot v1 (velocity ceiling, ARP TEMPESTA, RITORNO 128→80 bar)
- `src/director3.js` — import condizionato di init bass/melody (v1/v2/v3); silenzi strutturali gated (`_triggerStructuralSilence` countdown-based, sopravvive a `_totalTime` reset)
- `src/main.js` — import a 3 vie con wrapper, hotkey M+N, badge HUD a 2 slot
- `src/rhythm.js` — floor-kick offset CH1 pad 41 (Burial replacement) gated da `MUSIC_STRUCTURAL` — solo step 7/15, solo densita/rottura, prob 30%

---

## ⚠️ ISSUE PRIORITARIA emersa fine sessione 2026-04-07

### Voice/Lead troppo legate alla griglia ritmica condivisa

**Problema osservato dall'utente:** quando la fase passa a `densita`, l'hi-hat va sugli 8th e la voice va sugli 8th. Sono **co-quantizzate sulla stessa griglia**. Risultato: melodia e percussioni suonano sincroni → "stoffa unica" tutta legata, brutto. La melodia deve essere **slegata** dalla griglia ritmica condivisa.

**Causa nel codice (verificata):**
- In [melody.js](src/melody.js), [melody-v2.js](src/melody-v2.js), [melody-v3.js](src/melody-v3.js):
  ```javascript
  const VOICE_RATE = {
    germoglio: 8, pulsazione: 4, densita: 2, rottura: 2, dissoluzione: 4
  };
  ```
- La voice suona quando `_step % voiceRate === 0` → letteralmente sugli 8th in densita, sui quarter in pulsazione
- Stesso `_step` viene usato dal rhythm.js e dal hat → tutti sincroni
- v2/v3 NON hanno cambiato il timing — è un'architettura ereditata da v1

**NON è il chord-tone bias**, non è la velocity. È strutturale.

### Soluzione proposta: prime-length voice/lead loops (Eno/Reich/Floating Points)

Vedi RESEARCH-V4 §A.4 (Floating Points), §A.9 (Eno), §B.5 (textural counterpoint).

Invece di `_step % voiceRate === 0`, usare un contatore separato che avanza ad ogni step e fa fire la voice ogni **N step primi**:

```javascript
// Nuovo state in melody-v3 (o v4)
let _voiceLoopCounter = 0;
let _leadLoopCounter  = 0;

// Phase-dependent prime intervals (mai multipli di 2 o 4 = mai allineati alla griglia 4/4)
const VOICE_LOOP_STEPS = {
  germoglio:    11,   // sparse, fuori griglia
  pulsazione:   7,    // rado, mai sincrono con kick/hat
  densita:      5,    // più denso ma prime → mai sui downbeat fissi
  rottura:      5,
  dissoluzione: 11,
};

const LEAD_LOOP_STEPS = {
  germoglio:    13,
  pulsazione:   13,
  densita:      7,    // distinto da voice (5)
  rottura:      7,
  dissoluzione: 13,
};

// In _tick():
_voiceLoopCounter = (_voiceLoopCounter + 1) % VOICE_LOOP_STEPS[phase];
if (_voiceLoopCounter === 0) {
  // fire voice
}
```

**Importante:**
- Il counter NON deve resettarsi a fine bar (non riprendere il sync col 4/4)
- La voice rimane quantizzata sui 16th step (no jitter di timing) — solo le posizioni cambiano
- LCM voice/lead in densita = 5×7 = 35 step = ~2.2 bar prima di riallinearsi
- LCM in pulsazione = 7×13 = 91 step = ~5.7 bar
- LCM in germoglio = 11×13 = 143 step = ~8.9 bar
- Su frasi lunghe, voice e lead non sono mai prevedibili rispetto alla griglia

**Cosa cambia nelle sensazioni:**
- In densita: la voice ora suona ogni 5 step (~313ms a 96 BPM) — più rado degli attuali 8th, ma in posizioni "scivolate" rispetto al kick/hat
- Nel groove pieno (rottura) il rapporto voice/lead = 5:7 crea una dissincronia naturale
- L'effetto è "due melodie che galleggiano sopra il ritmo" anziché "tutto allineato in 4/4"

**Da considerare:**
- La VOICE_LOOP_STEPS[densita]=5 forse rende la voice TROPPO rara in densita (era 2 = 8 hits per bar, ora 5 = ~3 hits per bar). Forse alzare densità: usare valori 3 o 5? Dipende dal feeling. **Da tunare al volo nel test live.**
- Considerare anche la `voiceEveryBars` strategy in tracks.js — alcune tracce hanno `voiceEveryBars: 4` o `8` (es. NEBBIA, MACCHINA). Quel layer di gating rimane sopra al loop counter.

### Su quale versione applicare?

**Opzione A — solo in v3 (`MUSIC_STRUCTURAL`):** mantieni v1/v2 con timing on-grid (per A/B), v3 ha prime-length loops. Più pulito per confronto.

**Opzione B — in v1 (e v2 e v3 di conseguenza):** è una correzione strutturale, fixala alla radice. Tutti i mode beneficiano.

Raccomandazione: **A** prima per validare, poi se conferma → promuove a baseline (B) e v3 può ospitare altre feature.

### Priorità di questa modifica
**ALTA — primo intervento della sessione next**, prima ancora di pitch drift drone o bass cycle extension. Risolve un problema percepito direttamente dall'utente.

---

## PRIMA cosa da fare nella sessione next

**TEST LIVE delle 2 feature v3 implementate.** Senza feedback su queste, non aggiungere nulla sopra.

### Test 1 — Call-response Olafur (melody-v3.js)
1. Reload Chrome
2. Premi `Shift+5` → MACCHINA
3. Verifica baseline (v1): voice CH5 occasionale, lead CH6 risponde sul tick successivo
4. Premi `N` → badge `N·v3`. Aspetta voice. Lead CH6 ora arriva 200-500ms DOPO con delay irregolare
5. **Verifica musicale:** suona come un dialogo o come un ritardo casuale?
6. **Da tunare se serve:** `CALL_DELAY_MIN/MAX` in `melody-v3.js` (200-500ms attuale)

### Test 2 — Floor-kick offset (rhythm.js)
1. Da MACCHINA, premi `3` → salta a `densita`
2. Verifica baseline (v1): solo kick CH0
3. Premi `N`. Floor kick su CH1 pitch **41** (F2 — Low Floor Tom GM) appare occasionalmente sui tempi off
4. **Routing necessario:** mappa pad 41 nel tuo drum module a un secondo kick / sub / floor tom
5. **Verifica musicale:** dà spessore senza disturbare? Troppo presente o troppo invisibile?
6. **Da tunare:** prob 30% e velocity `45 + density*18` in [rhythm.js:147-149](src/rhythm.js#L147-L149)

### Test 3 — Combinazioni
- Premi `M` (badge `M·v2`) — ascolta v2 da solo
- Premi `N` (badge `M·v2 N·v3`) — combinato
- Verifica che tutte le combinazioni funzionino senza note appese o glitch

---

## Feature v3 da implementare nella sessione next

In ordine di **rapporto impatto/rischio**:

### 1. Pitch drift drone (Sakamoto A.5) — 30 minuti
**Cosa:** pitch bend slow ±15 cents su CH2 (drone), periodo 16-32 bar.
**Dove:** `harmony.js` — funzione che invia il drone, aggiunge `sendMIDIControlChange(2, 1, bendValue)` o pitch bend message ogni N bar.
**Perché:** vita organica per le sezioni ambient (NEBBIA, RESPIRO, RITORNO). 5 righe, sempre meglio del baseline.
**Gating:** `if (CFG.MUSIC_STRUCTURAL)` inline.
**Rischio:** verificare che il synth modulare risponda al pitch bend su CH2.

### 2. Bass cycle extension (B.4) — 2 ore
**Cosa:** il bass loop parte a 1 bar, dopo N bar si estende a 2 bar (con variazione nel bar 2), poi a 4 bar. Si arricchisce *estendendo il ciclo*, non aggiungendo note.
**Dove:** `bass-v3.js` (attualmente placeholder).
**Perché:** risolve direttamente il problema del Critico "il bass loop di SOLCO è prevedibile dopo 3 cicli".
**Gating:** automatico (bass-v3 si attiva con `MUSIC_STRUCTURAL`).
**Implementazione:** mantieni lo stato `_cycleStage` (1/2/4) e `_cycleStageBars` (count). Avanza ogni 8 bar di groove stabile. Pattern lengthening: bar 0 = pattern originale, bar 1 = variazione (shift offset, swap step), bar 2-3 = ulteriore.

### 3. Tension waves (B.1) — 3 ore — LA PIÙ IMPATTANTE
**Cosa:** invece di un arco lineare, 4-5 onde di tensione che escalano. Picco massimo all'80%, non al 50%. Ogni onda ha valle locale che risale.
**Dove:** `director3.js` — applica modulazione sopra `worldState.density.*` basata su `worldState.arc`.
**Perché:** risolve direttamente la diagnosi del Critico "il concerto suona come un fade-in di 43 minuti".
**Gating:** `if (CFG.MUSIC_STRUCTURAL)` nel calcolo density.
**Sketch implementazione:**
```javascript
function _computeTensionWave(arc) {
  // 5 onde: 0-0.25, 0.25-0.45, 0.45-0.65, 0.65-0.85, 0.85-1.0
  // Peak escalation: 0.4, 0.55, 0.7, 0.95, 0.5 (release final)
  const waves = [
    { start: 0.00, end: 0.25, peak: 0.40 },
    { start: 0.25, end: 0.45, peak: 0.55 },
    { start: 0.45, end: 0.65, peak: 0.70 },
    { start: 0.65, end: 0.85, peak: 0.95 },
    { start: 0.85, end: 1.00, peak: 0.50 },
  ];
  // Find current wave, compute sin-shaped position within it
  // Return { tensionMul: 0..1, contraryMul: per dimension }
}
// Then in updateDirector3, after _applyPhase():
//   const t = _computeTensionWave(worldState.arc);
//   worldState.density.rhythm *= t.rhythmMul;
//   worldState.density.melody *= t.melodyMul; // contromovimento
```
**Cautela:** non rompere i silenzi strutturali (gated da MUSIC_EXPERIMENT). Verificare che M+N insieme funzionino.

### 4. Walls of Sound (Hecker A.7) — 1.5 ore
**Cosa:** 2-3 gesti monolitici per concerto: 6-8 note simultanee spalmate CH2/CH4/CH5 su MIDI 36-72, vel 60-80, durata 8+ bar. Non una progressione: una *dichiarazione*.
**Dove:** nuovo modulo o trigger event in `director3.js`.
**Quando:** picco di TEMPESTA densita (~32 min), false resolution rebound (~38 min), opzionale all'apertura.
**Gating:** `MUSIC_STRUCTURAL` + arc threshold.

### 5. Frahm velocity ranges per fase (estensione v2) — 1 ora
**Cosa:** invece di velocity ceiling piatto per traccia, range che si sposta col phase.
- germoglio/dissoluzione: 25-55 (pp-mp)
- pulsazione: 45-75 (mp-mf)
- densita: 60-95 (mf-f)
- rottura: 80-115 (f-ff)
**Dove:** estensione di `applyMusicExperimentOverrides` in `tracks.js` o nel `_applyPhase()` di director3.
**Gating:** `MUSIC_EXPERIMENT` (è un'estensione di v2).

### 6. Degradation arc (Hecker A.7) — 2 ore
**Cosa:** in dissoluzione (RITORNO o fase dissoluzione di altre tracce):
- note-drop probability 0 → 0.4 nei 16 bar finali
- timing jitter sigma 5ms → 25ms
- chord notes: 4 → 3 → 2 → root only (perdono note una alla volta)
**Dove:** modifiche in `harmony.js` (chord), `melody-v3.js` (note-drop), `rhythm.js` (jitter).
**Gating:** `MUSIC_STRUCTURAL` + check phase === 'dissoluzione'.
**Rischio:** modifica multi-modulo, da fare con attenzione.

---

## Cose da NON fare

- ❌ **Bass v2 chord-aware "duro"** — scartato: il basso "che gira" indipendente è meglio
- ❌ **Melody v2 con chord-tone bias 2.5** — scartato: troppo levigato. Bias 1.3 attuale è il sweet spot
- ❌ **Aggiungere loop a 17/19 step** (RESEARCH-V4 § A.9 Eno extension) — overengineering
- ❌ **Microtonal beating intervals Aphex** — rischio di sembrare "rotto" senza synth giusti
- ❌ **Modifiche al sistema visivo** — rimandate a sessione dedicata, l'utente le farà separatamente

---

## Anche da considerare

Cose emerse dalla tavola rotonda non ancora affrontate (vedi `ROADMAP-TAVOLAROTONDA.md`):
- **Variation Dimensions (Richter A.10)** filosofia: quando ripeti, varia UNA dimensione alla volta
- **Chord additive entry** (Reich) — già parzialmente in `MACRO.chordAdditiveEntry` config ma non agganciato a director3 v3
- **Modal interchange** (B.3) — borrow temporaneo da modo parallelo per 2-4 bar

---

## File chiave da leggere all'inizio sessione

1. Questo file (`SESSION-NEXT.md`)
2. `ROADMAP-TAVOLAROTONDA.md` — la roadmap completa, ancora valida
3. `RESEARCH-V4-COMPOSITIONAL-DIRECTION.md` — il documento sorgente delle idee
4. Memory: `~/.claude/projects/-Users-Edo-1-MACH-INE-II-MACH-INE-II/memory/project_state.md`

---

## Stato git (a fine sessione 2026-04-07)

Branch: `machine-iii`
File modificati ma non committati:
- `src/config.js` (aggiunti 2 flag)
- `src/tracks.js` (override reversibili)
- `src/director3.js` (init condizionato + silenzi strutturali)
- `src/main.js` (wrapper a 3 vie + hotkey M/N + badge)
- `src/field.js` (fix tecnico drawImage)
- `src/midi.js` (fix tecnico swap-and-pop)
- `src/rhythm.js` (floor-kick gated v3)

File nuovi (da `git add`):
- `src/bass-v2.js`
- `src/melody-v2.js`
- `src/bass-v3.js`
- `src/melody-v3.js`
- `ROADMAP-TAVOLAROTONDA.md`
- `SESSION-NEXT.md` (questo file)

**Suggerimento commit alla fine del test live:**
```
v3-music: A/B/C framework + call-response + floor-kick offset

- 2 fix tecnici (getImageData→drawImage, noteFlashes swap-and-pop)
- v2 = calibration (CFG.MUSIC_EXPERIMENT, hotkey M)
- v3 = structural (CFG.MUSIC_STRUCTURAL, hotkey N)
- v3.1: melody call-response Olafur off-grid (200-500ms)
- v3.2: floor-kick offset CH1 pad 41 in densita/rottura
- Combinabili (M+N), HUD badge doppio bottom-right
- Default off — zero impatto su versione live
```
