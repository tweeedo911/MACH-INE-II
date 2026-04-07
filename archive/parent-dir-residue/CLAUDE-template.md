# CLAUDE.md — Template Ottimizzato

<!--
  ISTRUZIONI: Copia questo file nella root del tuo progetto come CLAUDE.md.
  Compila le sezioni rilevanti e cancella quelle che non servono.
  Obiettivo: restare SOTTO le 80 righe. Claude lo legge a ogni turno.
-->

## Progetto
- **Nome**: [nome progetto]
- **Tipo**: [web app / API / CLI / libreria / monorepo]
- **Stack**: [es. Next.js 14, TypeScript, Prisma, PostgreSQL]
- **Node/Python**: [versione runtime]

## Comandi
```bash
# Dev
npm run dev

# Build
npm run build

# Test (singolo file)
npm test -- path/to/file.test.ts

# Test (tutti)
npm test

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

## Struttura
```
src/
  components/   # React components
  lib/          # Shared utilities
  api/          # API routes
  types/        # TypeScript types
```

## Convenzioni
- Naming: camelCase per variabili/funzioni, PascalCase per componenti/tipi
- Import: path assoluti con @/ alias
- Stile: [Prettier / ESLint config — specificare se custom]
- Commit: conventional commits (feat/fix/refactor/docs/test)

## Pattern architetturali
<!-- Solo i pattern NON ovvi che Claude deve sapere -->
- [es. "Usiamo il pattern repository per l'accesso ai dati"]
- [es. "Le API seguono il pattern controller → service → repository"]
- [es. "State management con Zustand, uno store per dominio"]

## Orchestrazione agenti
<!-- Rimuovi questa sezione se non usi la skill agent-orchestrator -->
Per task complessi, usa la skill agent-orchestrator.
Regola base: se il task tocca più di 2 file o richiede più di 3 step, delega a subagenti.

## Note
<!-- Cose specifiche del progetto che Claude deve sapere -->
- [es. "Il database di staging è condiviso — non fare DROP TABLE"]
- [es. "L'auth usa un provider esterno, non modificare il flow OAuth"]
