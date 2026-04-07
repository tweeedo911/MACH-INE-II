# 04 — RULES

## Versioning

Formato: `vX.Y.Z`. Single source of truth: `src/VERSION.js`.

- Header in `main.js` e `config.js` deve combaciare con `APP_VERSION`.
- `CHANGELOG.md` aggiornato a ogni commit non triviale.
- Tag git solo per release significative (`v3.0.0`, `v3.4.0`, ecc.).

## Commit

Formato: `vX.Y.Z: descrizione breve` oppure `categoria: descrizione breve`
(`docs:`, `chore:`, `fix:`, `feat:`).

Categorie ammesse:
- `vX.Y.Z:` — bump versione
- `feat:`   — nuova funzionalità senza bump
- `fix:`    — bugfix
- `docs:`   — documentazione
- `chore:`  — pulizia, refactor non funzionale, mv di file
- `wip:`    — checkpoint intermedio (da evitare se possibile)

## Working mode

Per ogni task non banale:
1. Identifica file coinvolti.
2. Piano breve → approvazione (a meno che non sia esplicitamente "vai").
3. Implementa il diff più piccolo possibile.
4. Report: file cambiati, regole verificate, rischi.

## Aree protette — chiedere PRIMA di toccare

- `main.js` / `render.js` / `director3.js` (relazioni tra loro)
- Audio: history buffer, onset detection in `audio.js`
- Narrativa: arco narrativo → arco visivo, **rupture (4 stadi)**, climax
- Camera: logica legata all'arco narrativo

## Rupture — 4 stadi obbligatori

1. **Omen** (presagio)
2. **Infiltration** (infiltrazione)
3. **Takeover** (presa di controllo)
4. **Residue** (residuo)

**Mai semplificare. Mai saltare.**

## Code style

- **Source code** (variabili, funzioni, commenti tecnici) → **inglese**
- **Documentazione progetto** (README, CHANGELOG, docs/) → **italiano**
- **Commenti compositivi/sonori** dentro source → **italiano** (intent sonoro, voicing)
- Niente magic numbers → tutto in `src/config.js`
- Niente logica duplicata
- Niente riscritture monolitiche; preferire piccoli edit sicuri

## Performance

- Mai dipendenze npm.
- Mai bundler.
- Mai allocazioni in hot path (object pooling: vedi `entities`/`fossils` in `generations.js`).
- Mai `.splice` in loop su array grandi → swap-and-pop.
- Mai `Math.random()` non seedabile in produzione → `SeededRNG` da `perf-utils.js`.

## Lingua di interazione

Risposte all'utente in **italiano**, terse e dirette, senza preamboli o riassunti
di cose appena fatte.
