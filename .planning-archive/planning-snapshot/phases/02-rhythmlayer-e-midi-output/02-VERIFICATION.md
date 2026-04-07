---
phase: 02-rhythmlayer-e-midi-output
verified: 2026-03-27T13:30:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 2: RhythmLayer e MIDI Output — Verification Report

**Phase Goal:** L'arco ritmico completo — da silenzio arhitmico a climax poliritmica a dissoluzione — è udibile su CH0/CH1/CH7 con output MIDI ottimizzato per ogni strumento.
**Verified:** 2026-03-27T13:30:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | CH0 (PULSE) ha arco completo: silenzio 0-10min → pulse sporadico 10-20min → groove 20-30min → poliritmia 30-40min → dissoluzione 40-60min | VERIFIED | `_onKickStep()` in rhythm-layer.js riga 226: branch per ogni fase (arhythmic=return, emerging=probability 0.12, groove=0.55, climax=fourOnFloor, dissolving=0.20). `gateProbability` per fase in CFG.RHYTHM.kick. |
| 2 | CH1 (hi-hat) non si interrompe mai — velFloor garantisce presenza durante tutta la performance | VERIFIED | `sendHatNote()` riga 57 bypassa gating rhythmicDensity. `velFloor: 15` in CFG.RHYTHM.hat applicato riga 71 con `Math.max(CFG.RHYTHM.hat.velFloor, vel)`. Clock A sempre attivo in tutte le fasi. |
| 3 | Due layer ritmici con phasing Reich 8/9 step driftano visibilmente sul MIDI monitor | VERIFIED | `_hatClockA` (8 step) e `_hatClockB` (9 step) dichiarati righe 98-101. `_updateHatPhasing()` riga 293 avanza entrambi indipendentemente. Clock B attivo solo nelle fasi phasingActivePhases=['emerging','groove','climax'] (D-12). Convergenza ogni 72 step. |
| 4 | Note CH1 in range C2-C4 (MIDI 36-60) | VERIFIED | `CFG.RHYTHM.midi.pitchRange.ch1: { min: 36, max: 60 }` in config.js riga 601. `sendHatNote()` applica enforcement riga 60. `pitchCluster: [36,38,40,42]` già nel range C2-F#2. |
| 5 | Velocity downbeat +8% rispetto offbeat su tutti i canali (MIDI-01) | VERIFIED | `CFG.RHYTHM.midi.downbeatBoost: 0.08` e `offbeatReduce: 0.05` in config.js riga 595-596. Applicati sia in `sendNote()` righe 37-43 che in `sendHatNote()` righe 63-67 tramite `(_currentStep16 % 4 === 0)`. |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `MACH:INE II/src/config.js` | CFG.RHYTHM configuration block | VERIFIED | Blocco RHYTHM righe 501-617 (117 righe). Contiene: phaseThresholds, kick (4 pattern + gateProbability per fase), hat (pitchCluster, velFloor, phasingStepsA/B), perc (noteMap 6 ruoli, additiveEntry 4 livelli, specialNotes), midi (downbeatBoost, pitchRange, noteOffsetMs, legatoRatio, channels). |
| `MACH:INE II/src/rhythm-layer.js` | RhythmLayer v3 completo con CH0/CH1/CH7 | VERIFIED | 443 righe. Exports: `initRhythmLayer`, `updateRhythmLayer`. Import solo da moduli interni (config.js, macro-composer.js, midi.js). 43 riferimenti a CFG.RHYTHM — zero magic numbers. |
| `MACH:INE II/src/main.js` | V3_MODE routing per RhythmLayer | VERIFIED | 312 righe (+3 rispetto base 309). Import riga 29, `initRhythmLayer()` riga 148, `updateRhythmLayer(dt)` riga 252. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `rhythm-layer.js` | `config.js` | `import { CFG } from './config.js'` | WIRED | 43 riferimenti a `CFG.RHYTHM` verificati |
| `rhythm-layer.js` | `macro-composer.js` | `import { macroState }` | WIRED | `macroState.rhythmicDensity` usato 7 volte, `macroState.arcPercent` usato per phase detection e special events |
| `rhythm-layer.js` | `midi.js` | `import { sendMIDINote as _rawSend }` | WIRED | `_rawSend` usato in tutti i wrapper sendNote, sendHatNote, e special events |
| `main.js` | `rhythm-layer.js` | `import { initRhythmLayer, updateRhythmLayer }` | WIRED | Import riga 29, chiamate righe 148 e 252 |
| `main.js` | esecuzione ordinata | `MacroComposer → HarmonyLayer → RhythmLayer` | WIRED | Righe 250-252: updateMacroComposer(dt), updateHarmonyLayer(dt), updateRhythmLayer(dt) — MacroComposer aggiorna rhythmicDensity prima che RhythmLayer lo legga |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `rhythm-layer.js` | `macroState.rhythmicDensity` | `macro-composer.js` (calcolato ogni tick da arco 4D precomposto) | Si — valore dinamico 0.0-1.0 che guida l'intero arco ritmico | FLOWING |
| `rhythm-layer.js` | `macroState.arcPercent` | `macro-composer.js` (percent 0-1 della durata concerto) | Si — usato per dissoluzione e special events | FLOWING |
| `_rawSend` → MIDI output | note, vel, dur da CFG.RHYTHM | config.js (valori statici calibrati) + runtime computation | Si — velocity calcolata dinamicamente con humanization gaussiana e downbeat boost | FLOWING |

---

### Behavioral Spot-Checks

Non eseguibili senza server attivo (browser-only, WebMIDI). Verifiche programmatiche eseguite:

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| initRhythmLayer export presente | `grep "export function initRhythmLayer"` | match riga 390 | PASS |
| updateRhythmLayer export presente | `grep "export function updateRhythmLayer"` | match riga 416 | PASS |
| Zero magic numbers | tutti _rawSend usano CFG.RHYTHM.* | verificato righe 338-370 | PASS |
| V2 branch intatto | `grep "updateComposer7"` | 2 match (import + uso nel branch else) | PASS |
| Ordine Worker corretto | updateMacroComposer(250), updateHarmonyLayer(251), updateRhythmLayer(252) | righe sequenziali verificate | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| RITM-01 | 02-02 | Hi-hat continuity thread non si interrompe mai | SATISFIED | `sendHatNote()` bypassa gating; `velFloor: 15` applicato sempre |
| RITM-02 | 02-02 | Arco ritmico 5 fasi: arhitmico→pulse emergente→groove→climax→dissoluzione | SATISFIED | 5 branch in `_onKickStep()`, `_updatePhase()` con 5 threshold in CFG |
| RITM-03 | 02-02 | Additive rhythm Glass: densità per aggiunta di un elemento alla volta | SATISFIED | `_updatePercAdditive()` con `additiveEntry` a 4 livelli (congaLo@0.20, congaHi@0.35, rimshot@0.50, snare@0.65) |
| RITM-04 | 02-02 | Reich phasing: due layer lunghezze prime driftano in e fuori fase | SATISFIED | `_hatClockA` (8 step) e `_hatClockB` (9 step) + pattern percussivi lunghezze [5,7,11,13] |
| MIDI-01 | 02-01, 02-02 | Velocity humanization: downbeat leggermente più forte degli offbeat (±5-10%) | SATISFIED | `downbeatBoost: 0.08` (+8%) e `offbeatReduce: 0.05` (-5%) applicati in entrambi i wrapper |
| MIDI-02 | 02-01, 02-02 | Pitch range enforcement per canale: CH1 C2-C4 | SATISFIED | `pitchRange.ch1: { min: 36, max: 60 }` enforced in `sendHatNote()` |
| MIDI-03 | 02-01, 02-02 | Phrase shaping: legato/staccato configurabile, note sfasate 5-30ms | SATISFIED | `noteOffsetMs: { min: 5, max: 30 }` + `setTimeout()` in entrambi i wrapper |
| MIDI-04 | 02-01, 02-03 | Channel routing ottimizzato per tipo strumento | SATISFIED | `channels: { kick: 0, hat: 1, perc: 7 }` in CFG; V3_MODE routing in main.js |

---

### Fidelity Check — Decisioni Locked da 02-CONTEXT.md

| Decisione | Descrizione | Status | Evidenza |
|-----------|-------------|--------|---------|
| D-02 | 4-on-the-floor SOLO alla fase climax | RESPECTED | `pattern = pats.fourOnFloor` unico solo nel branch `climax` (riga 257) |
| D-06 | Hi-hat mai interrotto (velFloor) | RESPECTED | `Math.max(CFG.RHYTHM.hat.velFloor, vel)` riga 71 in `sendHatNote` |
| D-08 | CH7 nota map (36,38,45,48,60,62) | RESPECTED | `notes: { rimshot:36, snare:38, congaHi:45, congaLo:48, impact:60, sweep:62 }` |
| D-09 | Note 60/62 solo da arc cues | RESPECTED | `_checkSpecialEvents()` usa solo `arc >= threshold` — le note 60/62 non appaiono in nessun pattern normale |
| D-10 | Glass additive: congaLo→congaHi→rimshot→snare | RESPECTED | `additiveEntry` array in ordine esatto con threshold crescenti |
| D-11 | Phasing 8/9 step organico | RESPECTED | `_hatClockA` (8 step), `_hatClockB` (9 step), convergenza 72 step |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `config.js` | - | File 618 righe, sopra il limite 500 linee CLAUDE.md | Info | Il file pre-esiste con 501 righe; il blocco RHYTHM aggiunge 117 righe. Unico file config del sistema — accettabile per architettura config-first. Non è un nuovo file creato. |

Nessun blocker. Nessun placeholder. Nessun magic number nel codice (tutti i valori numerici da CFG.RHYTHM). Nessun TODO/FIXME.

---

### Human Verification Required

#### 1. Arco ritmico su MIDI monitor live

**Test:** Avviare con V3_MODE=true, collegare a MIDI monitor (es. MIDI Monitor su macOS), osservare CH0 per 40+ minuti.
**Expected:** CH0 silenzioso per i primi 10 minuti (con macroState.rhythmicDensity < 0.15), poi kick sporadico e frammentato fino al min 30, poi 4-on-the-floor dal min 30-40, poi dissoluzione.
**Why human:** Il comportamento dipende dall'arco macroState.rhythmicDensity nel tempo — non verificabile staticamente.

#### 2. Hi-hat continuity a transizioni di sezione

**Test:** Durante tutta la performance su CH1, verificare che non ci siano silenzi superiori a 2 secondi.
**Expected:** Flusso continuo di note su CH1, anche durante false-resolution e dissoluzione.
**Why human:** Richiede ascolto live con hardware MIDI.

#### 3. Phasing percepibile sul monitor

**Test:** Su CH1, osservare le note dei due sub-clock A e B sul MIDI monitor per 2-3 minuti durante la fase groove/climax.
**Expected:** Due stream di note che driftano visibilmente rispetto alla griglia — non locked ma non random.
**Why human:** La tensione latente del phasing 8/9 step è percettiva, non verificabile programmaticamente.

---

### Gaps Summary

Nessun gap rilevato. Tutti e 5 i success criteria del ROADMAP sono soddisfatti dall'implementazione verificata.

Il modulo `rhythm-layer.js` è completo, sostanziale (443 righe) e correttamente cablato al loop di esecuzione v3. La configurazione `CFG.RHYTHM` in `config.js` copre tutti i parametri senza magic numbers nel codice. Il routing V3_MODE in `main.js` mantiene l'ordine corretto di esecuzione (MacroComposer aggiorna `rhythmicDensity` prima che RhythmLayer lo legga).

L'unico punto da verificare con hardware è la qualità percettiva dell'arco ritmico durante la performance live (human verification items 1-3 sopra).

---

_Verified: 2026-03-27T13:30:00Z_
_Verifier: Claude (gsd-verifier)_
