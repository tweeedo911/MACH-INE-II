# Design Spec — Skill `audiovisual-dramaturgy`

**Data:** 2026-04-09
**Progetto:** MACH:INE III v3.4.2
**Stato:** bozza — da approvare prima dell'implementazione

---

## 1. Problema

Il sistema ha due skill specializzate che non comunicano tra loro:
- `composition-depth` — sa leggere e costruire musica, non conosce il visuale
- `visual-directing` — sa dirigere la scena, non legge la partitura

Non esiste competenza in grado di stare tra le due: leggere il codice musicale, capire il carattere di una parte, derivare da zero una proposta visiva coerente, e avere l'autorità di proporre redesign radicali quando la risposta visiva attuale non è all'altezza della musica.

Il risultato è che le decisioni audiovisive vengono prese implicitamente, senza metodologia, e i problemi di coerenza emergono solo a posteriori (vedi: comp-solco fisica sbagliata, riconosciuta solo dopo 7 iterazioni del prototipo).

---

## 2. Soluzione

Una nuova skill: `audiovisual-dramaturgy`.

Non è un dizionario di mapping fissi. È un **metodo di ascolto e derivazione**: legge il codice musicale e il contesto del progetto, analizza il carattere di una parte, propone una risposta visiva che emerge da quella fisica musicale. Ha mandato esplicito di proporre redesign radicali quando la coerenza è insufficiente.

---

## 3. Struttura file

```
app/.claude/skills/audiovisual-dramaturgy/
├── SKILL.md
└── references/
    ├── listening-framework.md
    ├── visual-derivation.md
    ├── artistic-research.md
    ├── current-biomes.md
    ├── technical-stack.md
    ├── project-history.md
    └── user-preferences.md
```

---

## 4. `SKILL.md` — contenuto

### 4.1 Identità e trigger

**Nome:** `audiovisual-dramaturgy`

**Attiva su:** nome di traccia + contesto visivo, "connessione musica-visuale", "risposta visiva", "sinestesia", "mapping", "coerenza audiovisiva", "redesign scena/bioma", "questo non funziona visivamente", "come dovrebbe reagire visivamente", "rileggi la musica", "bioma", "fisica visiva".

**Non attiva su:** pure rendering performance, pure debug tecnico, pure compositivo senza visuale.

### 4.2 Protocollo di invocazione

All'attivazione, leggere in questo ordine prima di qualsiasi proposta:

1. `docs/STATUS.md` — snapshot corrente, cosa è P0
2. Ultima entry `docs/WORKLOG.md` — cosa è successo, tono della sessione precedente
3. `docs/VISUAL-VISION.md` — visione attuale; in caso di conflitto con altri doc, questo ha precedenza
4. Commenti italiani nel codice dei moduli coinvolti — non sono documentazione tecnica, sono osservazioni estetiche dell'autore: trattarli come **materiale creativo primario**
5. File di feedback in `.claude/projects/.../memory/` (feedback_visual_vision*, feedback_visual_grammar*) — preferenze e riflessioni espresse esplicitamente

### 4.3 Tesi del progetto

> Il campo visivo non rappresenta la musica. È il residuo fisico della musica — come la materia è il residuo di energia.

La sinestesia non è decorazione: è fisica. La risposta visiva a un evento sonoro non deve illustrarlo, deve condividerne la stessa legge fisica. Un kick non genera un flash — genera un'onda d'urto. Un drone non colora lo sfondo — è una struttura che persiste.

### 4.4 Grammatica universale — 5 assi

| Parametro musicale | Parametro visivo | Regola |
|---|---|---|
| Pitch (0–127) | Posizione Y | grave = basso, acuto = alto — inviolabile |
| Velocity | Energia / massa / dimensione | curva esponenziale, non lineare |
| Duration / lifecycle | Dimensione dot nel tempo | newborn 2px → fossil 14px (curva t²) |
| Densità note attive | Densità halftone | mediata su finestra temporale |
| Timbro / ruolo strumento | Forma primitiva + colore | derivato per bioma, non fisso globalmente |
| Struttura armonica | Spazio compositivo | tensione = pesi asimmetrici, risoluzione = centramento |

### 4.5 Framework di valutazione — 4 domande

Prima di ogni modifica visiva e come diagnosi di coerenza:

1. Ogni parte musicale attiva ha un primitivo visivo distinto e riconoscibile?
2. Il pitch mappa la posizione Y in questo elemento?
3. La forma/movimento cambia con velocity/intensità o è solo decorativa?
4. Il lifecycle visivo rispecchia la durata e il carattere temporale dello strumento?

**Soglia:** se ≥ 3 domande falliscono su un bioma → candidato a redesign radicale.

### 4.6 Autorità radicale

Quando ≥ 3 delle 4 domande falliscono, questa skill ha **mandato esplicito** di proporre un redesign completo: nuova fisica, nuovi primitivi, nuove mappe.

Processo:
1. **Diagnosi** — rispondere esplicitamente alle 4 domande con evidenza dal codice
2. **Proposta** — partire dalla fisica musicale, non dall'aspetto attuale. Descrivere la nuova fisica del bioma come legge fisica reale
3. **Prototipo HTML standalone** — prima di toccare il sistema principale (~100-200 righe, MIDI fake, niente audio)
4. **Validazione** — 30 secondi per capire se funziona. Iterare sul prototipo, non sul sistema
5. **Integrazione meccanica** — solo dopo validazione, con piano preciso (file + riga + valore)

### 4.7 Protocollo di lavoro

- Piano prima del codice. Formato istruzioni: `file:riga → valore`
- Prototipo standalone per ogni bioma nuovo o redesignato prima dell'integrazione
- Piccoli edit sicuri — mai riscritture monolitiche
- Le preferenze utente in `references/user-preferences.md` sono **default forti**: applicarle sempre senza commentarle. Metterle in discussione solo se esplicitamente richiesto, e dichiararlo prima

### 4.8 References — cosa leggere per cosa

| Obiettivo | File |
|---|---|
| Leggere il codice musicale e capire il carattere di una parte | `listening-framework.md` |
| Derivare una proposta visiva dal profilo musicale | `visual-derivation.md` |
| Vocabolario artistico — artisti, tecniche, sinestesia | `artistic-research.md` |
| Stato attuale di ogni bioma, diagnosi aperta | `current-biomes.md` |
| Primitivi disponibili, layer API, come dare istruzioni impl. | `technical-stack.md` |
| Storia del progetto, cosa funziona, cosa è stato archiviato | `project-history.md` |
| Preferenze espresse dall'autore | `user-preferences.md` |

---

## 5. `references/listening-framework.md` — contenuto

### Step 1 — Contesto globale della traccia

Da `tracks.js`: BPM, modo armonico (`modeHint`), canali attivi per traccia, struttura fasi (opening/groove/climax/closing), durata fasi in battute.

Da `director3.js`: quali moduli musicali sono accesi per questa traccia, `presenceMultiplier` per fase, quando e come scatta la rupture, come cambia la densità nel tempo.

### Step 2 — Profilo per modulo musicale attivo

Per ogni modulo (`melody-v3.js`, `bass-v3.js`, `harmony.js`, `rhythm.js`, `texture.js`):

Estrarre:
- **Densità temporale** — quanto spesso genera note (ogni beat? ogni 4? burst rari? continuo?)
- **Registro** — range di pitch: basso/medio/alto, quanto ampio, dove si concentra
- **Durata eventi** — note brevi (percussive, < 100ms) o lunghe (sostenute, > 500ms)?
- **Velocity character** — costante, crescente verso il climax, accentuata sui beat forti, intimista?
- **Evoluzione** — il modulo cambia nel tempo? Come varia per fase?
- **Probabilismo** — quanto varia da ciclo a ciclo? È prevedibile o sorprendente?

Cercare anche: commenti italiani nel codice — sono osservazioni estetiche dirette dell'autore.

### Step 3 — Profilo caratteriale della traccia

Dalle letture, rispondere a 5 domande:

1. Qual è il **peso fisico** dominante? (pesante/leggero, denso/rarefatto, compresso/espanso)
2. Qual è la **direzione di forza**? (verticale, orizzontale, radiale, omnidirezionale, assente)
3. Qual è il **rapporto tra stasi e movimento**? (respira? pulsa? scorre? scatta? persiste?)
4. Quali parti portano **informazione musicale dominante** vs sfondo?
5. Come **evolve** il profilo dall'apertura al climax? C'è un arco?

### Step 4 — Protagonisti visivi

Identificare i 2-3 elementi che portano più informazione musicale — hanno carattere temporale distinto, registro definito, presenza riconoscibile. Questi devono avere primitivi visivi distinti. Gli altri sono supporto.

### Step 5 — Leggere le considerazioni passate

Cercare in `docs/WORKLOG.md` e `docs/VISUAL-VISION.md` osservazioni su questa traccia. Trattarle come materiale creativo, non solo come vincoli. Una nota del tipo "la fisica del basso sembra che respira invece di cadere" è informazione estetica ricca — indica che la fisica attuale ha la direzione sbagliata e che l'autore ha già un'immagine mentale corretta.

---

## 6. `references/visual-derivation.md` — contenuto

### Passo A — Dalla fisica musicale alla fisica visiva

Il profilo caratteriale suggerisce una legge fisica per il bioma. Non una tabella di lookup ma un processo di derivazione. Esempi del metodo:

- Peso dominante + direzione verticale → **gravità** (oggetti cadono, si accumulano)
- Rarefazione + espansione radiale → **centrifuga/dispersione** (nessun su/giù, solo fuori)
- Stasi + pulsazione → **pressione di campo** (la musica crea assenza, non presenza)
- Flusso orizzontale + pitch variabile → **tensione di fibra** (le note non cadono, si tendono)
- Cicli discreti + griglia → **snap, nessuna fisica continua** (ogni evento è una cella)
- Impulsi direzionali caotici → **campo di forza variabile** (tre livelli di suscettibilità)

La fisica deve essere **una sola legge semplice**, universale nel bioma. Se servono due leggi distinte, sono due biomi, non uno.

### Passo B — Dai protagonisti ai primitivi

Per ogni protagonista visivo identificato nel listening: quale forma primitiva ha la stessa energia di questa parte?

Criteri di scelta del primitivo:
- Deve avere lo stesso **carattere temporale** (kick = istantaneo → shockwave; drone = continuo → struttura permanente)
- Deve avere la stessa **direzionalità** (ascendente? cadente? radiale? orizzontale?)
- Deve essere **distinto dagli altri primitivi** nella stessa scena — leggibilità come partitura visiva

I primitivi disponibili sono nel vocabolario v2 (BANDA, VETTORE, BLOCCO, VUOTO, FRONTE, SCIAME, STRISCIA, MATRICE) — vedi `technical-stack.md`.

### Passo C — Dalla biblioteca artistica

Con il profilo in mano, consultare `artistic-research.md` come vocabolario: quale artista/opera ha già risolto un problema estetico simile? Non come template da copiare — come ispirazione di linguaggio e di principio.

Domanda utile: *"Se [artista] lavorasse con questo suono, cosa disegnerebbe?"*

### Passo D — Verifica con le 4 domande

Applicare il framework di valutazione da `SKILL.md §4.5`. Se ≥ 3 falliscono, il processo di redesign radicale ha priorità sulla proposta incrementale.

### Passo E — Formulazione della proposta

Struttura standard di una proposta:

1. **Fisica del bioma** — una frase: la legge fisica unica
2. **Protagonisti** — i 2-3 elementi con primitivo, carattere, lifecycle atteso
3. **Immagine di riferimento** — una frase descrittiva dell'immagine mentale corretta (es. "Grand Canyon in sezione: vuoto sopra, geologia compressa sotto")
4. **Rupture** — come cambia la fisica alla rottura
5. **Prossimo passo** — prototipo HTML standalone

---

## 7. `references/artistic-research.md` — contenuto

Biblioteca completa organizzata per dominio di utilizzo (non per artista):

**Peso e gravità visiva:** Malevich Suprematismo, Grand Canyon geology, Brancusi
**Rarefazione e vuoto:** Kenya Hara Ma, Sugimoto, Hubble Deep Field
**Griglia e informazione:** Ryoji Ikeda, El Lissitzky, Müller-Brockmann
**Fibra e tensione orizzontale:** Agnes Martin, tessuto muscolare al microscopio
**Campo di forza:** Moholy-Nagy, aurora boreale, visualizzazioni campo magnetico
**Ciclo di vita visivo:** Raven Kwok, figure di Chladni
**Montaggio e taglio:** Eisenstein, Kuleshov, McLaren
**Memoria e palimpsesto:** Klee, Schwitters, Pale Blue Dot
**Glitch e degradazione:** Autechre visual, Kohlberger
**Sinestesia — ricerca storica:** Kandinsky (Punto, Linea, Superficie), Scriabin (color-music), Rimington (colour organ)

Per ogni dominio: 2-3 artisti con descrizione breve del principio applicabile, non della biografia.

---

## 8. `references/current-biomes.md` — contenuto

Per ogni bioma: stato attuale dell'implementazione + diagnosi aperta.

**Struttura per bioma:**
- Comp attuale (quale `comp-*.js`)
- Cosa funziona (non toccare)
- Cosa non funziona / gap diagnosticati (con riferimento a ARTISTIC-GAPS se presente)
- Osservazioni dell'autore raccolte da WORKLOG/STATUS/VISUAL-VISION
- Domande aperte

Non contiene le soluzioni — quelle emergono dal processo di listening + derivazione. Contiene la diagnosi onesta dello stato attuale.

---

## 9. `references/technical-stack.md` — contenuto

**Primitivi di rendering disponibili:**
- `fillBayer(ctx, x, y, w, h, density, dotSize, color)` — primitivo base halftone
- Layer stack: BG/MG/FG/OVERLAY via `layers.js`
- `event-register.js` API: `getEvents()`, `getEventStats()`, lifecycle states (newborn/stable/ghost/fossil)
- `colors.js`: `getPalette()`, `lerpColor()`, 5 ruoli colore (bg/dot/accent/event/residual)
- `visual-toolkit.js`: `applyCameraTransform()`, `lerp()`, easing functions

**Vocabolario primitivi v2 (da recuperare):**
BANDA, VETTORE, BLOCCO, VUOTO, FRONTE, SCIAME, STRISCIA, MATRICE

**Pattern implementativo standard comp-*:**
- Ogni comp ha 4 layer (BG/MG/FG/OVERLAY) — scrivere su quello giusto
- Parametri in `config.js` (CFG.VISUAL.*) — no magic numbers nel codice
- Commenti suoni/composizione in italiano, codice in inglese

**Come dare istruzioni di implementazione:**
- Formato: `file:riga_corrente → nuovo_valore` o `file:funzione → diff minimo`
- Verificare sempre la riga effettiva nel file prima di dare l'istruzione
- Per modifiche > 3 file o > 10 righe: piano approvato prima del codice

**Anti-pattern noti:**
- `entities.splice(i,1)` in loop → O(n). Swap-and-pop
- `Math.random()` non seedabile → `SeededRNG`
- 3× `map()` + spread per frame → pre-allocare buffer
- Riscritture monolitiche → sempre diff minimo

---

## 10. `references/project-history.md` — contenuto

### Voci tecniche

**Non toccare:**
- `director3.js`, `main.js`, `render.js` — relazioni intricate, modifiche richiedono piano
- `audio.js` — history buffer, onset detection
- Layer stack e rupture 4 stadi — funzionano, non ridisegnare

**Archiviato e perché:**
- `dna.js`, `generations.js` — approccio entity-based con generazioni, sostituito da lifecycle diretto in `event-register.js`. Non recuperare senza motivo forte
- Comp-solco v1-v6 — fisica ZOS/ZOM (colonna che respira): sbagliata perché era fisica di RESPIRO applicata a SOLCO. Errore: partire dall'aspetto visivo invece che dalla fisica musicale

**Errori ricorrenti:**
- Implementare nel sistema principale prima di validare su prototipo → iterazioni costose
- Correggere parametri quando il problema è architetturale (tweaking vs redesign)
- Separare il lavoro visivo dal lavoro musicale — le incoerenze si scoprono tardi

### Voci estetiche

Osservazioni dell'autore raccolte dalle sessioni — trattarle come materiale creativo:
- "La fisica del basso è sbagliata. Il sistema ZOS/ZOM è la fisica di RESPIRO, non di SOLCO" (sessione 2026-04-08) → indica che l'autore ha già un'immagine mentale precisa prima ancora del prototipo
- "Scena: vuoto sopra (85%) + geologia compressa sotto — Grand Canyon in sezione" → immagine di riferimento valida per SOLCO
- "Il visivo non deve illustrare la musica ma condividerne la fisica" → principio guida non negoziabile
- Lettura completa: `docs/WORKLOG.md` (append-only, ogni sessione)

### Dinamica delle sessioni

Come si lavora bene in questo progetto:
1. Lettura contesto completo prima di proporre
2. Proposta con immagine di riferimento + fisica → approvazione orale
3. Prototipo HTML standalone → validazione visiva (30 sec)
4. Integrazione meccanica con piano preciso

---

## 11. `references/user-preferences.md` — contenuto

Preferenze espresse esplicitamente dall'autore. **Default forti — applicare sempre, mettere in discussione solo se esplicitamente richiesto.**

| Preferenza | Fonte | Come applicare |
|---|---|---|
| Prototipo HTML standalone prima di integrare | VISUAL-VISION §6, feedback_visual_vision | Ogni nuovo bioma o redesign: prototipo prima. Mai integrare senza validazione visiva |
| Piano con file+riga+valore prima del codice | feedback_planning_before_coding | Prima di scrivere codice: lista file coinvolti, cosa cambia, dove |
| Mai riscritture monolitiche — diff minimo | CLAUDE.md | Modifiche chirurgiche. Se serve riscrivere tutto, è un segnale che il piano è sbagliato |
| La fisica visiva parte dalla musica, non dall'aspetto | VISUAL-VISION tesi | Non aggiustare l'aspetto — ridisegnare la fisica |
| Worktree isolation per task multi-file | feedback_worktree_accept | Accettare worktree in agent spawn |
| Commenti estetici/sonori in italiano | CLAUDE.md | Commenti sul carattere di un suono o di un'immagine: italiano |
| Il silenzio è uno strumento | composition-depth filosofia | Densità bassa non è un problema — può essere la scelta giusta |

---

## 12. Registrazione in CLAUDE.md

Aggiungere alla tabella skill in `app/CLAUDE.md`:

```
| `audiovisual-dramaturgy` | connessione musica-visuale, sinestesia, mapping, coerenza, redesign bioma, risposta visiva |
```

---

## 13. Cosa NON è questa skill

- Non è un lookup table di mapping fissi (non esistono canali fissi per traccia)
- Non duplica `visual-directing` (quella sa come renderizzare, questa sa perché e cosa)
- Non duplica `composition-depth` (quella sa come costruire la musica, questa sa come la musica guida il visuale)
- Non dà risposte senza leggere il codice musicale attuale

---

## 14. Criteri di successo

La skill funziona se, dato un modulo musicale che non ha ancora risposta visiva:
1. Legge il codice, ne estrae il carattere
2. Propone una fisica visiva che emerge da quel carattere
3. Identifica i primitivi giusti
4. Indica il prototipo come passo successivo con struttura precisa
5. Se il bioma esiste già e non è coerente: fa la diagnosi con le 4 domande e ha l'autorità di proporre redesign radicale
