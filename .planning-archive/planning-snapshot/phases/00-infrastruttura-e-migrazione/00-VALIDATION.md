---
phase: 0
slug: infrastruttura-e-migrazione
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 0 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — manual browser testing only (project constraint: no test framework) |
| **Config file** | None |
| **Quick run command** | `python3 -m http.server 8282` → `http://localhost:8282` in Chrome |
| **Full suite command** | Chrome DevTools → Performance tab + MIDI monitor hardware |
| **Estimated runtime** | ~5 minutes manual verification per requirement |

---

## Sampling Rate

- **After every task commit:** Load page, check browser console for errors, verify CFG.V3_MODE in DevTools
- **After every plan wave:** Run full MIDI monitor verification for INFR-01/02/03
- **Before `/gsd:verify-work`:** All manual checks in table below must be confirmed green
- **Max feedback latency:** Immediate (browser load + console check)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Verification Signal | Status |
|---------|------|------|-------------|-----------|---------------------|--------|
| 00-01-01 | 01 | 1 | MIGR-01 | manual/git | `git log v2-archive --oneline -1` matches last v2 commit | ⬜ pending |
| 00-01-02 | 01 | 1 | MIGR-02 | manual/console | `console.log(CFG.V3_MODE)` in DevTools = `false` | ⬜ pending |
| 00-02-01 | 02 | 1 | INFR-01 | manual/MIDI monitor | MIDI F8 ticks steady; no gap >2× nominal during Chrome heavy tab | ⬜ pending |
| 00-03-01 | 03 | 1 | INFR-02 | manual/MIDI monitor | Clock tick interval changes gradually over ~2 bars on engine switch | ⬜ pending |
| 00-04-01 | 04 | 1 | INFR-03 | manual/MIDI monitor | MIDI monitor shows no burst note-ons on silence cue trigger | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No automated test files to create — project constraint prohibits test framework (per CLAUDE.md: "No test framework. Manual testing via browser.").

*Existing infrastructure covers all phase requirements via manual verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `v2-archive` branch exists with v2 code intact | MIGR-01 | Git operation — no test harness needed | `git log v2-archive --oneline -3` should match `main` commits before Phase 0 changes |
| CFG.V3_MODE = false on page load | MIGR-02 | Browser runtime — no test framework | Open DevTools console, type `CFG.V3_MODE`, confirm `false` |
| No MIDI clock stutter during GC | INFR-01 | Requires real MIDI hardware + Chrome | Connect MIDI monitor, open Chrome Performance tab, record 2 min, trigger "Force garbage collection" → watch F8 interval for gaps |
| BPM lerps over ≥2 beats on engine switch | INFR-02 | Requires live MIDI playback + monitor | Press keyboard shortcut to switch engine, watch MIDI monitor clock interval change gradually (not snap) over ~1-2 seconds |
| No note burst at silence cue | INFR-03 | Requires live MIDI playback + monitor | With an engine active, press Shift+0 (stop sequencer) or fast-forward to a silence cue — MIDI monitor should show clean cutoff, no burst of note-ons |

---

## Validation Sign-Off

- [ ] All tasks have manual verify instructions
- [ ] Sampling continuity: verification after each plan's completion
- [ ] Wave 0: N/A (no test framework)
- [ ] No watch-mode flags
- [ ] Feedback latency: immediate (browser load)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
