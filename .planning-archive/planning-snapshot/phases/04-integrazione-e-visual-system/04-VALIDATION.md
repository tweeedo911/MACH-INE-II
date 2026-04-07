---
phase: 4
slug: integrazione-e-visual-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — browser manual testing (zero npm, zero bundler) |
| **Config file** | none |
| **Quick run command** | `python3 -m http.server 8282` + open browser console |
| **Full suite command** | browser open + MIDI monitor + time-jump checkpoints |
| **Estimated runtime** | ~5 minutes per checkpoint |

---

## Sampling Rate

- **After every task commit:** Open browser, check JS console for errors, verify V3_MODE gate
- **After every plan wave:** Run full time-jump checkpoint sequence (arcPercent 0%, 25%, 50%, 75%, 90%)
- **Before `/gsd:verify-work`:** All 5 checkpoints green, visual arc visibile, firme layer distinguibili
- **Max feedback latency:** ~5 minutes per checkpoint

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | VISL-01/02 | manual | `grep CFG.VISUAL MACH:INE\ II/src/config.js` | ✅ | ⬜ pending |
| 04-02-01 | 02 | 1 | VISL-01/02 | manual | browser console `CFG.V3_MODE` | ✅ | ⬜ pending |
| 04-02-02 | 02 | 1 | VISL-01 | manual | browser: arcPercent drive visual | ✅ | ⬜ pending |
| 04-02-03 | 02 | 1 | VISL-02 | manual | browser: layer dominance switch | ✅ | ⬜ pending |
| 04-03-01 | 03 | 2 | MARC-04 | manual | time-jump 5 checkpoint | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Nessun framework da installare — il progetto usa browser nativo.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Arco visivo sparse→denso→dissoluzione | VISL-01 | Richiede osservazione visiva canvas | Aprire browser, forzare arcPercent 0/0.5/1.0 da console, osservare campo visivo |
| Firma layer distinguibile dal palco | VISL-02 | Richiede giudizio estetico soggettivo | Forzare rhythmicDensity=1 vs harmonicColor=1 da console, verificare palette/moto diversi |
| Suite 45-60min senza collasso | MARC-04 | Richiede time-jump + MIDI monitor | 5 checkpoint a arcPercent 0%, 25%, 50%, 75%, 90% — almeno un layer emette MIDI per checkpoint |
| No silenzio MIDI >30s fuori dissoluzione | MARC-04 | Richiede MIDI monitor hardware | Collegare MIDI out, verificare flusso note continuo |
| No note out-of-range per canale | MARC-04 | Richiede MIDI monitor con filter | CH0 kick, CH1 C2-C4, CH2 C3-C5, CH3 C1-C3, CH4 C4-C7 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 300s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
