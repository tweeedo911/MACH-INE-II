# Guida all'Orchestrazione ad Agenti in Claude Code

## Il problema

Quando lavori con Claude Code su task complessi, la conversazione cresce rapidamente. Ogni tentativo di codice, ogni output di debug, ogni ragionamento intermedio si accumula nel contesto. Questo causa tre problemi concreti:

1. **Consumo token** — paghi per tutto il contesto accumulato ad ogni turno
2. **Degradazione qualità** — con un contesto lungo e rumoroso, il modello perde focus sulle decisioni importanti
3. **Perdita di coerenza** — le decisioni prese all'inizio vengono "dimenticate" o contraddette

## La soluzione: Orchestratore + Agenti specializzati

L'idea è semplice: la conversazione principale non scrive mai codice e non esplora mai file direttamente. Agisce come un **project manager** che:

- Mantiene la visione d'insieme del progetto
- Scompone il lavoro in task atomici
- Delega ogni task a un subagente specializzato
- Riceve risultati sintetici e decide il passo successivo

Ogni subagente parte con un contesto pulito, riceve solo le informazioni necessarie, esegue il task e restituisce un risultato conciso. Il contesto sporco (tentativi, errori intermedi, output di debug) muore con l'agente.

---

## I ruoli

### Orchestratore (tu, nella conversazione principale)

**Cosa fa:**
- Analizza la richiesta dell'utente e la scompone in task
- Decide quale agente assegnare a ogni task
- Scrive prompt precisi per ogni agente (file coinvolti, comportamento atteso, vincoli)
- Valuta i risultati e decide se il task è completo o serve un'altra iterazione
- Mantiene un "registro" delle decisioni architetturali e dello stato del progetto

**Cosa NON fa:**
- Non scrive codice
- Non esplora file (delega al Researcher)
- Non esegue test (delega al Tester)
- Non fa debug (delega al Debugger)

---

### 1. Architect

**Quando usarlo:** All'inizio di un nuovo feature o quando serve una decisione strutturale.

**Input tipico:** Descrizione del requisito, vincoli tecnici, stack tecnologico.

**Output atteso:** Piano di implementazione con: file da creare/modificare, dipendenze tra i task, interfacce tra i componenti, eventuali rischi.

**Template prompt:**
```
Sei un architetto software. Analizza questo requisito e produci un piano di implementazione.

REQUISITO: [descrizione]
STACK: [tecnologie in uso]
STRUTTURA ATTUALE: [elenco file/cartelle rilevanti]
VINCOLI: [limitazioni note]

Rispondi con:
1. File da creare o modificare (con path esatti)
2. Ordine di implementazione (quali task dipendono da altri)
3. Interfacce tra i componenti (tipi, contratti)
4. Rischi o ambiguità da chiarire prima di procedere

Non scrivere codice. Solo il piano.
```

---

### 2. Coder

**Quando usarlo:** Quando hai un task di implementazione ben definito (file, funzione, comportamento atteso, test di accettazione).

**Input tipico:** File da modificare, specifica precisa di cosa implementare, contesto architetturale minimo.

**Output atteso:** Codice funzionante. Nessuna decisione architetturale autonoma.

**Template prompt:**
```
Implementa questa funzionalità.

FILE: [path del file da creare/modificare]
TASK: [cosa deve fare, in dettaglio]
INTERFACCIA: [signature, tipi, contratto]
CONTESTO: [solo le info necessarie — non tutto il progetto]
VINCOLI: [stile di codice, librerie da usare/evitare, pattern]

Se il file esiste già, modifica solo la parte rilevante.
Se trovi ambiguità nel task, segnalale — non prendere decisioni autonome.
Restituisci il codice completo del file modificato.
```

---

### 3. Debugger

**Quando usarlo:** Quando hai un errore con traceback, un comportamento inatteso, o un test che fallisce.

**Input tipico:** Messaggio di errore, file coinvolti, comportamento atteso vs attuale.

**Output atteso:** Diagnosi del problema e fix applicata.

**Template prompt:**
```
Trova e correggi questo bug.

ERRORE: [messaggio di errore / traceback]
FILE COINVOLTI: [path dei file rilevanti]
COMPORTAMENTO ATTESO: [cosa dovrebbe succedere]
COMPORTAMENTO ATTUALE: [cosa succede invece]
CONTESTO: [ultime modifiche fatte, se rilevante]

Rispondi con:
1. Causa root del problema (una frase)
2. Fix applicata (modifica il file)
3. Come verificare che la fix funziona
```

---

### 4. Researcher

**Quando usarlo:** Quando devi capire come funziona una parte del codebase, trovare pattern, cercare documentazione, o esplorare API esterne.

**Input tipico:** Domanda specifica su cosa cercare.

**Output atteso:** Informazioni strutturate e concise. Niente codice, niente azioni.

**Template prompt:**
```
Cerca queste informazioni nel codebase/documentazione.

DOMANDA: [cosa devi scoprire]
DOVE CERCARE: [path, file, URL se applicabile]
FORMATO RISPOSTA: [elenco, tabella, schema — specifica cosa ti serve]

Restituisci solo le informazioni richieste. Non modificare nulla.
Non suggerire implementazioni — solo i fatti.
```

---

### 5. Reviewer

**Quando usarlo:** Dopo che il Coder ha prodotto del codice, prima di considerare il task completo.

**Input tipico:** File da revieware, criteri di qualità.

**Output atteso:** Lista di problemi trovati, ordinati per severità.

**Template prompt:**
```
Fai code review di questo file/diff.

FILE: [path]
CONTESTO: [cosa fa questo codice, perché è stato scritto]
CRITERI: [performance, sicurezza, leggibilità, aderenza a pattern X]

Per ogni problema trovato, riporta:
- Riga(he) coinvolta(e)
- Severità (critico / importante / suggerimento)
- Problema
- Fix suggerita

Se non trovi problemi, dillo esplicitamente.
```

---

### 6. Tester

**Quando usarlo:** Dopo l'implementazione, per verificare che il codice funzioni.

**Input tipico:** File da testare, comportamento atteso, framework di test in uso.

**Output atteso:** Test scritti e/o risultati di esecuzione.

**Template prompt:**
```
Scrivi ed esegui test per questa funzionalità.

FILE DA TESTARE: [path]
FUNZIONALITÀ: [cosa deve essere verificato]
FRAMEWORK: [jest, pytest, vitest, ecc.]
CASI DA COPRIRE: [happy path, edge cases, error cases]

Scrivi i test, eseguili, e restituisci:
1. File dei test creato (path)
2. Risultato: tutti passano / N falliscono
3. Per ogni fallimento: cosa fallisce e perché
```

---

### 7. Documenter

**Quando usarlo:** A fine implementazione, o quando il codebase ha bisogno di documentazione.

**Input tipico:** File da documentare, audience (dev, utente finale, team).

**Output atteso:** Documentazione scritta nel formato richiesto.

**Template prompt:**
```
Documenta questo codice/funzionalità.

FILE: [path dei file da documentare]
TIPO: [README, JSDoc/docstring, guida utente, API docs]
AUDIENCE: [sviluppatori del team / utenti finali / onboarding nuovi dev]
STILE: [breve e pratico / dettagliato / con esempi]

Genera la documentazione e salvala nel file appropriato.
```

---

## Workflow tipo

Ecco come si svolge una sessione tipica con questo sistema:

```
UTENTE: "Aggiungi l'autenticazione JWT alla nostra API Express"

ORCHESTRATORE:
  1. Delega a Researcher: "Trova come è strutturata l'API attualmente,
     quali route esistono, se c'è già un middleware di auth"
  2. Riceve: struttura file, route esistenti, nessun auth presente
  3. Delega ad Architect: "Progetta l'auth JWT per questa struttura"
  4. Riceve: piano con 4 task (middleware, route login, model user, integrazione)
  5. Delega a Coder: task 1 — middleware auth
  6. Delega a Coder: task 2 — route login (in parallelo se indipendente)
  7. Riceve codice → Delega a Reviewer
  8. Se review OK → Delega a Tester
  9. Se test passano → Task completo, passa al prossimo
  10. Delega a Documenter: aggiorna README con istruzioni auth
```

L'orchestratore in tutto questo processo ha visto solo piani, risultati e decisioni — mai il codice grezzo, i tentativi, o gli errori intermedi. Il contesto resta pulito.

---

## Regole d'oro

1. **Un agente, un task.** Non chiedere a un agente di fare research + implementazione + test. Scomponi.

2. **Prompt precisi.** L'agente non ha il contesto della conversazione. Digli esattamente: quale file, cosa fare, come deve essere il risultato.

3. **Solo le info necessarie.** Non passare tutto il codebase. Passa i file specifici e il contesto minimo. Meno contesto = risultati migliori e meno token.

4. **Verifica sempre.** Il Reviewer e il Tester esistono per questo. Non assumere che il Coder abbia fatto tutto giusto.

5. **L'orchestratore decide, non implementa.** Se ti trovi a scrivere codice nella conversazione principale, stai sbagliando. Delega.

6. **Parallelizza quando possibile.** Task indipendenti possono andare in parallelo. L'orchestratore decide cosa è parallelizzabile guardando il piano dell'Architect.

7. **Registra le decisioni.** L'orchestratore mantiene una lista delle decisioni architetturali prese. Questo serve per non contraddirsi e per onboardare nuovi agenti con il contesto giusto.

---

## Quando NON usare questo sistema

Per task semplici (rinominare una variabile, aggiungere un commento, fix di un typo), delegare a un agente è overkill. La regola pratica: se il task richiede meno di 2 minuti e tocca un solo file, fallo direttamente.

---

## Note su CLAUDE.md

Il file CLAUDE.md nella root del progetto è il posto giusto per:

- Convenzioni di codice del progetto
- Stack tecnologico e versioni
- Pattern architetturali in uso
- Comandi per build, test, lint
- Struttura delle cartelle

Quello che NON dovresti metterci:

- Istruzioni troppo lunghe (Claude lo legge a ogni turno — pesa sul contesto)
- Regole ovvie (es. "scrivi codice pulito")
- Informazioni che cambiano spesso (meglio in file separati che l'agente legge on-demand)

Il CLAUDE.md ideale è sotto le 100 righe e contiene solo ciò che è indispensabile a ogni interazione.

---

## Appendice: Applicazione a MACH:INE II

Questo sistema è stato personalizzato per MACH:INE II, un sistema di co-composizione ricorsiva audiovisiva. Ecco le specificità:

### Stack e vincoli
- JavaScript ES modules puri, zero dipendenze, zero build step
- Canvas 2D + Web Audio API + WebMIDI API
- Tutto gira a 60fps nel game loop — la performance è critica
- Parametri numerici centralizzati in `config.js` (oggetto CFG)

### Aree protette
Alcune parti del codebase richiedono approvazione esplicita prima di essere modificate. I subagenti devono saperlo:
- main.js / render.js / director.js (le relazioni tra loro)
- History buffer audio e onset detection
- Arco narrativo → arco visivo
- Rupture (4 stadi obbligatori: Omen → Infiltration → Takeover → Residue)
- Climax e camera

### Flusso dati da conoscere
```
Audio input → audio.js → state.js → director.js → field.js/colors.js → render.js
MIDI input → midi.js → midi-patterns.js → field.js → render.js
Sequencer → composer[1-6].js → midi.js (output)
```

### Docs come contesto per gli agenti
Quando un agente lavora su un'area specifica, passagli il doc di riferimento:
- Visuals → DESIGN.md
- Motori compositivi → ENGINES_SPEC.md
- Regole e workflow → RULES.md

### Linguaggio
- Codice e commenti tecnici: inglese
- Documentazione progetto (CHANGELOG, README, docs/): italiano
- I subagenti devono rispettare questa convenzione
