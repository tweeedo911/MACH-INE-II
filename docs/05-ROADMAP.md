# 05 — ROADMAP

## Stato corrente: v3.4.2 (post-FASE 2 ristrutturazione)

### Completato
- ✅ FASE 0 — bonifica `.gitignore`, archivio GSD, rename versioning v3.x reale
- ✅ FASE 1 — salvage critici dalle isole morte (`firma.js`, modal characteristic note boost, modeHint per 7 tracce)
- ✅ v3.4.2 — firma reattivata e wired (gelo/convergenza/vuotoTotale/densityCap)
- ✅ FASE 2 — ristrutturazione directory: `MACH:INE II/` → `app/`, archive/, docs/00-06, dead islands archiviate

### Prossimi step (in priorità)

#### Sessione musicale
1. **Tuning composizioni** — bilanciare densità tra le 7 tracce (vedi `archive/docs/old/SESSION-NEXT.md`)
2. **Transizioni smooth** — fade tra fase e fase, no salti bruschi su `worldState.density.*`
3. **Silenzi strutturali** — usare `firma.densityCap` come envelope di apertura/chiusura traccia
4. **Durata 45 min** — verificare che la suite completa regga il tempo target

#### Sessione visiva
1. Ricaricare gli enrich di `comp-quadrati` e `comp-negativo` (breathing, sediment, holes)
2. Verificare che zone Bayer crescenti siano coerenti con `worldState.density`
3. Glitch layer: ridurre layer, aumentare sottrazione (regola "meno è più")

#### Tecniche
1. Health-check: `scripts/health-check.sh` — grep import morti, magic numbers, file size
2. Snapshot: `scripts/snapshot.sh` — tag locale + copia `archive/code/versions/` prima di edit a `index.html`
3. Performance: profilo CPU su Chrome DevTools, target costante 60fps su 60 min

## Sessioni storiche

Per il backlog completo e le diagnosi pre-v3:
- `archive/docs/old/ROADMAP-TAVOLAROTONDA.md` — 10 azioni dalla tavola rotonda 2026-04-06
- `archive/docs/old/SESSION-NEXT.md` — to-do musicale dettagliato
- `archive/docs/old/SESSION-VISUAL-NEXT.md` — to-do visivo dettagliato
- `archive/docs/old/HANDOFF.md` — handoff tra sessioni
- `archive/docs/old/SALVAGE.md` — classificazione 🟥/🟧/🟨 dei frammenti salvabili
- `~/.claude/projects/-Users-Edo-1-MACH-INE-II-MACH-INE-II/memory/` — memoria agentica
