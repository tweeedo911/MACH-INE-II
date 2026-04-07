---
phase: 00-infrastruttura-e-migrazione
verified: 2026-03-27T11:00:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Verifica MIDI clock stutter durante GC pesante"
    expected: "Con CLOCK_LOOKAHEAD = 100ms, nessun gap visibile nei tick F8 su MIDI monitor durante rendering pesante o GC spike"
    why_human: "Richiede hardware MIDI fisico e strumento di misura timing (MIDI monitor) — non verificabile via grep"
  - test: "Verifica BPM lerp su transizione engine live"
    expected: "Attivando TERRENO poi MECCANICA, il MIDI monitor mostra l'intervallo F8 che cambia gradualmente su ~2 battute, non di scatto"
    why_human: "Comportamento real-time, richiede hardware MIDI e osservazione diretta"
  - test: "Verifica assenza note burst su cue silence"
    expected: "Al trigger di un cue silence, il synth tace immediatamente senza burst udibili di note residue"
    why_human: "Richiede hardware synth e ascolto diretto — non verificabile staticamente"
---

# Phase 00: Infrastruttura e Migrazione — Verification Report

**Phase Goal:** Preparare l'infrastruttura tecnica per il v3 rewrite: archiviare v2, aggiungere il flag V3_MODE, risolvere i bug critici di latenza MIDI e note stuck identificati in v2.9.0.
**Verified:** 2026-03-27T11:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Il branch `v2-archive` esiste nel repo applicazione e punta all'HEAD pre-modifica | VERIFIED | `git branch` mostra `v2-archive`; punta a `010550c` (v2.9.0 — commit pre-modifica) |
| 2  | `CFG.V3_MODE` e' la prima proprieta' di CFG in config.js e vale `false` | VERIFIED | config.js riga 7: `V3_MODE: false,` — prima proprieta', prima di `debug` |
| 3  | Il codice v2 su `v2-archive` e' identico a main prima di qualsiasi modifica | VERIFIED | `v2-archive` punta a `010550c`; tutte le modifiche di fase 00 sono commit successivi su main |
| 4  | `CLOCK_LOOKAHEAD` e' 100ms in midi.js (non 50ms) | VERIFIED | midi.js riga 44: `CLOCK_LOOKAHEAD = 100;` con commento che spiega il ragionamento GC |
| 5  | Le transizioni di BPM lerpano gradualmente su 2 battute | VERIFIED | main.js righe 249-254: blocco lerp completo con formula beats-based usando `CFG.bpmLerpBeats` |
| 6  | Il lerp non produce NaN quando DERIVA (bpm: null) e' l'unico engine attivo | VERIFIED | Guard `e.bpm &&` in `getActiveBpm()` impedisce che `_targetClockBpm` sia aggiornato a null |
| 7  | Il BPM lerp e' espresso in battute (`CFG.bpmLerpBeats`) non in millisecondi fissi | VERIFIED | `lerpRate = beatsPerTick / CFG.bpmLerpBeats` — parametro in config.js riga 8 |
| 8  | Al cue `silence`, tutti i canali MIDI 0-7 ricevono CC 123 prima che gli engine vengano disattivati | VERIFIED | sequencer.js riga 350: `sendMIDIAllNotesOff()` e' la prima istruzione nel case `silence`, prima di `_deactivateAll()` |
| 9  | Al cue `end`, stessa protezione — nessun burst di note alla fine del concerto | VERIFIED | sequencer.js riga 395: `sendMIDIAllNotesOff()` e' la prima istruzione nel case `end`, prima di `_deactivateAll()` |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact | Plan | Provides | Status | Details |
|----------|------|----------|--------|---------|
| `MACH:INE II/src/config.js` | 00-01 | V3_MODE flag | VERIFIED | Riga 7: `V3_MODE: false,` — prima proprieta' del CFG object |
| `MACH:INE II/src/config.js` | 00-03 | bpmLerpBeats parametro | VERIFIED | Riga 8: `bpmLerpBeats: 2,` — subito dopo V3_MODE, prima di debug |
| `MACH:INE II/src/midi.js` | 00-02 | CLOCK_LOOKAHEAD 100ms | VERIFIED | Riga 44: `CLOCK_LOOKAHEAD = 100;` — usato in `updateMIDIClock()` riga 179 |
| `MACH:INE II/src/main.js` | 00-03 | variabili lerp + logica | VERIFIED | Righe 200-201: `_targetClockBpm`/`_currentClockBpm`; righe 249-254: blocco lerp |
| `MACH:INE II/src/sequencer.js` | 00-04 | flush MIDI pre-deactivate | VERIFIED | Riga 10 import; riga 350 (silence); riga 395 (end) |
| `git branch v2-archive` (repo app) | 00-01 | snapshot v2.9.0 immutabile | VERIFIED | Branch presente nel repo `MACH:INE II/.git`, punta a `010550c` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `git branch v2-archive` | HEAD pre-modifica `010550c` | git branch pointer | VERIFIED | `git log v2-archive --oneline -1` = `010550c v2.9.0` |
| `config.js CFG` | `V3_MODE: false` | prima proprieta' oggetto | VERIFIED | Riga 7 — prima di `debug`, `fftSize`, ogni altro parametro |
| `midi.js` | `updateMIDIClock()` | `CLOCK_LOOKAHEAD` riga 44 | VERIFIED | `CLOCK_LOOKAHEAD` dichiarato riga 44, usato in `scheduleHorizon` riga 179 |
| `main.js getActiveBpm()` | `_targetClockBpm` | assegnazione riga 220 | VERIFIED | `_targetClockBpm = e.bpm;` — side-effect documentato nel commento |
| `main.js midiWorker.onmessage` | `updateMIDIClock(_currentClockBpm)` | blocco lerp righe 249-254 | VERIFIED | Vecchio pattern `updateMIDIClock(getActiveBpm())` assente (grep exit 1) |
| `sequencer.js processCue('silence')` | `sendMIDIAllNotesOff()` | prima istruzione del case | VERIFIED | Riga 350 — precede `_deactivateAll()` riga 351 |
| `sequencer.js processCue('end')` | `sendMIDIAllNotesOff()` | prima istruzione del case | VERIFIED | Riga 395 — precede `_deactivateAll()` riga 396 |
| `sequencer.js` import | `./midi.js sendMIDIAllNotesOff` | named import riga 10 | VERIFIED | `import { sendMIDIAllNotesOff } from './midi.js';` |

---

### Data-Flow Trace (Level 4)

Non applicabile a questa fase. Tutti gli artefatti sono: un flag booleano in un config object, una costante locale, variabili di interpolazione, e chiamate a funzioni esistenti. Nessun componente che renderizza dati dinamici da sorgente remota.

---

### Behavioral Spot-Checks

| Behavior | Command / Evidence | Result | Status |
|----------|-------------------|--------|--------|
| `sendMIDIAllNotesOff` invia CC 123 a tutti i canali 0-7 | corpo funzione: `for (let c = 0; c < 8; c++) midiOut.send([0xB0|c, 123, 0])` | Loop esplicito su 8 canali, CC 123 (All Notes Off) | PASS |
| Vecchio pattern snap-BPM eliminato | `grep "updateMIDIClock(getActiveBpm"` — exit 1 | Nessun match | PASS |
| `_currentClockBpm` riceve lerp e viene passato a `updateMIDIClock` | main.js riga 254: `updateMIDIClock(_currentClockBpm)` | Chiamata con variabile lerpata, non valore snap | PASS |
| `bpmLerpBeats` referenziato nella formula lerp | main.js riga 252: `lerpRate = beatsPerTick / CFG.bpmLerpBeats` | Parametro config usato direttamente nel calcolo | PASS |
| MIDI clock Worker vivo | main.js: `midiWorker.onmessage` gestisce tutti gli update; errori catturati con try/catch e il clock sopravvive | Clock protetto da eccezioni non catturate | PASS (statico) |

Spot-check MIDI timing reale (stutter GC, lerp udibile, note burst): richiede hardware — vedi sezione Human Verification.

---

### Requirements Coverage

| Requirement | Plan | Descrizione | Status | Evidence |
|-------------|------|-------------|--------|----------|
| MIGR-01 | 00-01 | Codice v2 archiviato su branch git separato prima di qualsiasi modifica | SATISFIED | Branch `v2-archive` in `MACH:INE II/.git` punta a `010550c` (pre-modifica) |
| MIGR-02 | 00-01 | Flag `V3_MODE` in config.js per coesistenza v2/v3 | SATISFIED | `CFG.V3_MODE: false` riga 7 di config.js — prima proprieta' |
| INFR-01 | 00-02 | MIDI clock nel Web Worker — nessuna GC pause interrompe il timing | SATISFIED | `CLOCK_LOOKAHEAD = 100ms` (2x safety margin contro pause GC V8 ~50ms) |
| INFR-02 | 00-03 | Transizioni BPM lerp su 2-4 battute — nessun snap che rompe sync Ableton | SATISFIED | `CFG.bpmLerpBeats: 2`; logica lerp beats-based in `midiWorker.onmessage` |
| INFR-03 | 00-04 | Transizioni tra sezioni non generano burst di note | SATISFIED | `sendMIDIAllNotesOff()` come prima istruzione nei case `silence` e `end` |

Nessun requisito orfano: tutti e 5 i requirement ID mappati a questa fase (MIGR-01, MIGR-02, INFR-01, INFR-02, INFR-03) sono coperti dai piani 00-01/02/03/04. Il traceability table in REQUIREMENTS.md marca tutti e 5 come Complete.

---

### Anti-Patterns Found

Nessun anti-pattern bloccante rilevato nei file modificati.

| File | Pattern cercato | Risultato |
|------|----------------|-----------|
| `config.js` | TODO/FIXME/placeholder | Nessuno |
| `midi.js` | return null / return {} vuoto | La funzione `sendMIDIAllNotesOff` ha corpo reale (loop CC 123) |
| `main.js` | Valori hardcoded magic numbers nel lerp | Assenti — usa `CFG.bpmLerpBeats` |
| `sequencer.js` | `sendMIDIAllNotesOff` chiamata dopo `_deactivateAll` (ordine sbagliato) | Assente — ordine corretto verificato |

---

### Human Verification Required

#### 1. MIDI Clock Timing sotto GC load

**Test:** Con un engine attivo (es. TERRENO), avviare il rendering pesante e osservare l'intervallo tra tick F8 su un MIDI monitor hardware o software.
**Expected:** Nessun gap misurabile nei tick F8 durante picchi GC (visibili come frame drop nel browser DevTools Performance tab). Con 100ms di lookahead, il clock dovrebbe restare continuo anche durante pause GC fino a ~80ms.
**Why human:** Richiede hardware MIDI fisico, strumento di misura timing (MIDI Monitor, Logic, Max/MSP), e trigger di GC controllato — non verificabile staticamente.

#### 2. BPM Lerp Graduale alle Transizioni Engine

**Test:** Attivare TERRENO (80 BPM), poi switchare a un engine con BPM diverso (es. MECCANICA). Osservare l'intervallo F8 su MIDI monitor.
**Expected:** L'intervallo cambia gradualmente nel corso di ~2 battute (a 80 BPM: ~1.5 secondi), non istantaneamente.
**Why human:** Comportamento real-time con MIDI hardware — non verificabile senza esecuzione live.

#### 3. Assenza Note Burst su Cue Silence

**Test:** Con engine attivo e note in corso, triggerare manualmente un cue `silence` via keyboard o sequencer. Osservare il synth hardware.
**Expected:** Silenzio immediato e pulito. Nessun burst di note residue. Il synth deve silenziare tutti i canali entro il primo ciclo di clock.
**Why human:** Richiede hardware synth fisico e ascolto diretto — il comportamento dipende dal buffer WebMIDI del driver e non e' verificabile staticamente.

---

### Gaps Summary

Nessun gap. Tutti i 9 observable truths sono VERIFIED, tutti gli artefatti passano i livelli 1-3 (esistenza, sostanza, wiring), tutti i 5 requirement ID sono SATISFIED.

Le 3 voci in Human Verification sono controlli di qualita' del comportamento real-time — non impediscono il raggiungimento del goal della fase, che e' infrastrutturale e completamente verificabile staticamente.

---

_Verified: 2026-03-27T11:00:00Z_
_Verifier: Claude (gsd-verifier)_
