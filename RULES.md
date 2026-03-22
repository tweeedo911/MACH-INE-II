# MACH:INE II – Regole di progetto

Queste regole governano come lavoriamo su questo progetto:
come prendiamo decisioni, come teniamo traccia delle modifiche,
come evitiamo di perdere lavoro.

---

## 1. Versioni e numering

Usiamo il formato `vMAGGIORE.MINORE.PATCH`:

- **PATCH** (es. v0.1.1): piccola correzione o tweak visivo
- **MINORE** (es. v0.2.0): nuova funzionalità aggiunta
- **MAGGIORE** (es. v1.0.0): riscrittura significativa o cambio di direzione

Ogni versione deve avere:
- una riga nel `CHANGELOG.md` con data e descrizione
- uno snapshot in `versions/vX.Y.Z.html`
- un commit git con messaggio `vX.Y.Z: descrizione breve`

---

## 2. Flusso di lavoro

Prima di ogni modifica non banale:

1. **Piano** – Claude descrive cosa cambierà e perché
2. **Approvazione** – Edoardo dice "sì, vai" oppure chiede modifiche al piano
3. **Esecuzione** – Claude implementa
4. **Verifica** – si testa e si confirma che funziona

Non si eseguono modifiche strutturali senza approvazione esplicita.

---

## 3. Snapshot obbligatori

Prima di ogni modifica significativa a `index.html` o `sandbox.html`:
- si salva la versione corrente in `versions/` con il numero di versione attuale
  (es. `versions/v0.2.0-index.html`, `versions/sandbox-v0.3.0.html`)
- solo dopo si apporta la modifica

Questo garantisce che ogni versione funzionante sia sempre recuperabile.

---

## 4. Commit git

Ogni commit deve avere un messaggio chiaro nel formato:

```
vX.Y.Z: cosa è cambiato (max 72 caratteri)
```

Esempi validi:
- `v0.1.1: fix onset threshold troppo sensibile`
- `v0.2.0: aggiunto layer particelle su nota MIDI`
- `v0.1.0: prima versione funzionante`

Non si fa commit di codice rotto.
Non si fa commit senza aggiornare `CHANGELOG.md`.

---

## 5. GitHub

Il repository è pubblico su GitHub.
Il branch principale è `main`.

Non si forza il push su `main` (`--force`).
Ogni feature sperimentale va su un branch separato, es. `exp/particles`.

---

## 6. Parametri e configurazione

Tutti i parametri numerici (soglie, velocità, intensità) vivono
in `src/config.js` (per i moduli ES) o nell'oggetto `CFG` in cima
allo script (per file self-contained come `sandbox.html`).

Non si usano numeri "magici" sparsi nel codice.
Se si aggiunge un parametro, va documentato con un commento inline.

---

## 7. Cosa non si tocca senza discussione

- La struttura del loop `render()` — è la spina dorsale del sistema
- Il meccanismo di history buffer — da qui dipende tutta la visualizzazione
- La logica di onset detection — va tweakato con cautela e test

---

## 8. Linguaggio

La codebase è in inglese (variabili, commenti tecnici).
La documentazione (README, CHANGELOG, RULES) è in italiano.

---

*Ultima modifica: 2026-03-21*
