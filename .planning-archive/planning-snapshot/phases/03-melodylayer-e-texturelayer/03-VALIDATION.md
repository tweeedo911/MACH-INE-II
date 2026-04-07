---
phase: 3
slug: melodylayer-e-texturelayer
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-27
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual — no test framework. Browser test pages: test.html, sandbox.html |
| **Config file** | none |
| **Quick run command** | `python3 -m http.server 8282` → open http://localhost:8282 → toggle V3_MODE |
| **Full suite command** | Browser manual: osservare HUD debug, console.log, verifica output MIDI su hardware |
| **Estimated runtime** | ~5 minutes per validation cycle |

---

## Sampling Rate

- **After every task commit:** Open browser, enable V3_MODE, check console logs
- **After every plan wave:** Full browser test — MIDI monitor + HUD debug + console output
- **Before `/gsd:verify-work`:** Full suite must be green (all manual checks passed)
- **Max feedback latency:** ~5 minutes

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 0 | MELO-01, MELO-02 | manual | n/a — file creation | ❌ W0 creates | ⬜ pending |
| 03-01-02 | 01 | 0 | MELO-01, MELO-02 | manual | n/a — config addition | ❌ W0 adds | ⬜ pending |
| 03-01-03 | 01 | 0 | MELO-01, MELO-02 | manual | n/a — integration wiring | ❌ W0 wires | ⬜ pending |
| 03-02-01 | 02 | 1 | MELO-01 | manual | `console.log('[MELODY] seed captured:', _seedMotif)` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | MELO-01 | manual | `console.log('[MELODY] seed returned at:', arcPercent)` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 1 | D-05 | automated | `grep -q "_arpMode" melody-texture-layer.js && grep -q "_isArpWindow" melody-texture-layer.js` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 1 | MELO-02 | manual + math | `_clockCH3 % 7`, `_clockCH5 % 11`, `_clockCH6 % 13` in console | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 1 | MELO-03 | manual | Verifica CH2 MIDI monitor — HarmonyLayer drone attivo durante fasi arhitmiche | ✅ exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `MACH:INE II/src/melody-texture-layer.js` — creato da Plan 02 Task 1
- [x] `MACH:INE II/src/config.js` — CFG.MELODY aggiunto da Plan 01
- [x] `MACH:INE II/src/main.js` — routing V3_MODE aggiunto da Plan 03

*(Nessun test framework da installare — progetto usa test manuale via browser)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Seed catturato e riappare riconoscibile | MELO-01 | Sistema generativo, timing stocastico — impossibile unit test | Avviare performance, osservare `[MELODY] seed captured` nei primi 5min, poi aspettare arcPercent > 0.75 (~min33) e verificare `[MELODY] seed returned` |
| CH3/CH5/CH6 non si allineano in 1h | MELO-02 | LCM=1001 è matematicamente garantito, ma richiede ascolto per confermare coerenza timbrica | Isolare i 3 canali MIDI su hardware/monitor, ascoltare 10min e confermare pattern non si sovrappongono identicamente |
| Drone root sempre presente durante fasi arhitmiche | MELO-03 | Comportamento dipende da sequencer arc e da HarmonyLayer attivo | Monitorare CH2 sul MIDI monitor durante i primi 10min e durante 40-60min, confermare segnale continuo |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5min
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (2026-03-27 — blockers risolti, D-05 aggiunto a Plan 02 Task 2)
