---
phase: 1
slug: macrocomposer-e-harmonylayer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Nessun test framework — manual browser testing (per CLAUDE.md) |
| **Config file** | N/A — no jest/vitest/pytest |
| **Quick run command** | `python3 -m http.server 8282` poi `http://localhost:8282` su Chrome |
| **Full suite command** | MIDI Monitor.app (macOS) o Protokol su MIDI output + `skipTo()` per posizione ~min28/33/35/38 |
| **Estimated runtime** | ~10 minuti (browser + MIDI monitor check completo) |

---

## Sampling Rate

- **After every task commit:** Aprire browser, avviare sequencer, verificare `console.log` per i valori 4D del MacroComposer
- **After every plan wave:** Test MIDI monitor completo — skip to ~min28, ~min33, ~min35, ~min38, verificare success criteria
- **Before `/gsd:verify-work`:** Tutti e 5 i success criteria del ROADMAP verificati su MIDI monitor
- **Max feedback latency:** ~600 secondi (test MIDI monitor completo)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | MARC-01 | Manual — console.log | `console.log('[MACRO]', macroState)` ogni 60s nel Worker | ❌ Wave 0 | ⬜ pending |
| 1-01-02 | 01 | 1 | MARC-02 | Manual — console.log | Avviare, verificare timestamps picchi non coincidono | ❌ Wave 0 | ⬜ pending |
| 1-01-03 | 01 | 1 | MARC-03 | Manual — MIDI monitor CH0 | `skipTo(~min35)`, verificare silenzio CH0 per 8 bar | ❌ Wave 0 | ⬜ pending |
| 1-02-01 | 02 | 1 | HARM-01 | Manual — MIDI monitor CH2 | CH2 sempre attivo durante intera performance | ❌ Wave 0 | ⬜ pending |
| 1-02-02 | 02 | 1 | HARM-02 | Manual — ascolto | Note CH2 prima/dopo cambio modo — root invariato | ❌ Wave 0 | ⬜ pending |
| 1-02-03 | 02 | 1 | HARM-03 | Manual — MIDI monitor | Note CH2 ≥ note CH3 + 9 semitoni | ❌ Wave 0 | ⬜ pending |
| 1-02-04 | 02 | 1 | HARM-04 | Manual — MIDI monitor CH4 | Nessun salto >3 semitoni ai cambi di modo | ❌ Wave 0 | ⬜ pending |
| 1-02-05 | 02 | 1 | HARM-05 | Manual — ascolto | ~10-15% note cromatiche su CH4 con risoluzione verso il basso | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/macro-composer.js` — file non esiste, va creato (stub con `initMacroComposer()`, `updateMacroComposer(dt)`, `getMacroState()`)
- [ ] `src/harmony-layer.js` — file non esiste, va creato (stub con `initHarmonyLayer()`, `updateHarmonyLayer(dt)`, `toggleHarmonyLayer()`)
- [ ] `CFG.MACRO` block in `src/config.js` — non esiste, va aggiunto (checkpoint array, anchor voicings, durata concerto)

*Nessun test framework da installare — il progetto usa testing manuale per scelta architetturale.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Picchi 4D staggered (~min28, ~min33, ~min38) | MARC-02 | Richiede run da 40 minuti o skip navigation | `skipTo(min28)` → check harmonicColor log; `skipTo(min33)` → check density; `skipTo(min38)` → check rhythmicDensity |
| False-resolution 8 bar a ~min35 | MARC-03 | Timing dipende da durata concerto configurata | `skipTo(min35)` → CH0 silenzio per ~32 secondi (8 bar @ ~120BPM) |
| Transizioni modali senza cambio root brusco | SC #1 | Richiede MIDI monitor + ascolto | Verificare sequenza A Lydian → Bb Phrygian → D Dorian → C# Dorian → E Phrygian → A Lydian su MIDI monitor |
| Voice leading ≤3 semitoni su CH4 | HARM-04 | Verificabile solo monitorando note consecutive | Osservare CH4 durante ogni transizione modale con MIDI monitor |
| Drone root sempre presente su CH2 | HARM-01 | Richiede run continua + monitor | CH2 non deve mai tacere per più di 1 bar durante l'intera performance |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 600s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
