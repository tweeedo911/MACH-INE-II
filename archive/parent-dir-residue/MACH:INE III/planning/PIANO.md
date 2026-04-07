# MACH:INE III — Piano di Progetto
> Documento di lavoro. Da discutere prima di scrivere codice.

---

## 1. Concetto

MACH:INE II era: *la macchina compone, il musicista interpreta*.

MACH:INE III è: *la macchina compone e ha voce propria — il musicista ricerca*.

La distinzione è fondamentale. In MACH:INE II il musicista reagisce in tempo reale a ciò che la macchina suona. Il suo ruolo è esecutivo. In MACH:INE III la macchina crea **zone di ricerca** — contesti armonici e ritmici sostenuti in cui il musicista può esplorare la propria risposta prima di agire. La macchina ascolta, poi si adatta. Il musicista non segue: indaga.

Allo stesso tempo, la macchina non è solo un compositore MIDI. Ha una voce propria — **sintesi audio diretta** — che suona in parallelo all'output verso l'hardware del musicista. L'identità sonora della macchina diventa parte integrante del concerto, non solo un substrato.

---

## 2. Decisioni Stack

*Queste sono le decisioni più importanti. Tutto il resto dipende da esse.*

### 2A — Audio synthesis

| Opzione | Pro | Contro | Adatta a |
|---------|-----|--------|----------|
| **Web Audio API pura** (AudioWorklet, OscillatorNode) | zero dipendenze, massimo controllo, già nel browser | API verbosa, più codice | sintesi custom, timbri propri |
| **Tone.js** (CDN, ES module) | API musicale di alto livello, scheduling preciso | ~600KB, astrazione che può vincolare | prototipazione veloce, sintesi standard |
| **Nessuna sintesi diretta** | semplicità, focus su MIDI | macchina senza voce propria | solo se si decide di non avere sintesi |

**Proposta**: Web Audio API + AudioWorklet. Tone.js è comodo ma introduce vocabolario e architettura che potrebbe scontrarsi con la logica compositiva custom. La sintesi diretta via AudioWorklet permette timbri che riflettono l'identità della macchina.

**Da decidere**: che tipo di sintesi vuoi che la macchina abbia? Droni, pad granulari, FM, texture generative?

---

### 2B — Visual rendering

| Opzione | Pro | Contro | Adatta a |
|---------|-----|--------|----------|
| **Canvas 2D** (come MACH:INE II) | affidabile, Bayer halftone nativo, identità visiva consolidata | limite per 3D e shader complessi | continuità estetica |
| **Three.js** (CDN, ES module) | 3D, particle systems, post-processing, ombre, shading PBR | ~700KB, curva di apprendimento | espansione dimensione visiva |
| **WebGL raw** | controllo totale, zero overhead | moltissimo codice, fragile | solo se serve qualcosa che Three.js non dà |
| **Canvas 2D + Three.js** | entrambi attivi, renderer intercambiabili | complessità coordinamento | modulare: scene 2D e scene 3D |

**Proposta**: Canvas 2D + Three.js coesistono come **renderer intercambiabili**. Il visual-director sceglie quale renderer è attivo per ogni scena/sezione. L'estetica Bayer halftone rimane come identità di base — Three.js aggiunge nuove dimensioni per sezioni specifiche, non sostituisce.

Three.js funziona come ES module nativo (via CDN importmap) — nessun bundler necessario.

**Da decidere**: che tipo di visual 3D immagini? Geometrie, particle fields, ambienti, altro?

---

### 2C — Core runtime

| Opzione | Decisione | Motivazione |
|---------|-----------|-------------|
| ES modules nativi | ✓ mantenere | zero build = massima affidabilità live |
| Zero bundler | ✓ mantenere | stessa motivazione |
| MIDI Worker thread | ✓ mantenere | latenza critica in performance |
| WebMIDI API | ✓ mantenere | unica via per hardware MIDI |
| Node.js runtime | ✗ no | non necessario, complessità inutile |
| TypeScript | ⚠ valutare | safety a compile time, ma richiede build step — da discutere |

---

## 3. Il Ruolo del Musicista

### Da MACH:INE II a MACH:INE III

In MACH:INE II il musicista **interpreta** — suona ciò che la macchina suggerisce in tempo reale.

In MACH:INE III il musicista **ricerca** — la macchina crea un contesto, il musicista lo esplora con tempo e libertà.

### Zone di ricerca

La performance si struttura in due tipi di momento:

**Zona guida** — la macchina ha un'intenzione chiara, suona attivamente, definisce ritmo/armonia/timbro. Il musicista risponde se vuole, ma la macchina non aspetta.

**Zona ricerca** — la macchina crea un contesto aperto (drone, pad armonico, texture ritmiche molto sparse) e si mette in ascolto. Il musicista esplora. La macchina analizza l'audio in ingresso e adatta la sezione successiva a ciò che ha sentito.

Questo richiede un componente nuovo: **dialogue-manager**. Traccia lo stato del dialogo (chi "parla", da quanto, che intensità), e coordina le transizioni tra zona guida e zona ricerca.

**Da decidere**:
- Come vuoi che la macchina risponda a ciò che suoni durante le zone ricerca? (armonia, dinamica, ritmo?)
- Il musicista suona SEMPRE via hardware MIDI verso synth fisici, o anche via softsynth/DAW?
- Le zone ricerca hanno durata fissa o la macchina decide quando terminare in base all'ascolto?

---

## 4. Sintesi Diretta della Macchina

La macchina ha una voce propria — indipendente dall'output MIDI verso hardware.

### Proposte timbriche

| Livello | Tipo | Note |
|---------|------|------|
| **Fondamentale** | Drone armonico | onda sinusoidale/additiva, supporto armonico costante |
| **Texture** | Granular synthesis | campioni processati o sintesi granulare algortimica |
| **Melodico** | FM synthesis | timbri più distinti, può emergere dalla texture |
| **Percussivo** | Noise + envelope | non è il compito primario, ma utile per accenti |

### Architettura sintesi

```
AudioContext
   ├── synthesis-engine.js (AudioWorklet)
   │     ├── drone-synth      (LayerA — fondamentale)
   │     ├── texture-synth    (LayerB — granular/pad)
   │     └── melody-synth     (LayerC — linee melodiche machine)
   ├── audio-analysis.js      (input microfono/BlackHole)
   └── output → Web Audio → speaker/interface
```

**Da decidere**:
- Vuoi che la sintesi della macchina sia **udibile in sala** (mix col musicista) o solo come **monitor interno**?
- Hai un'identità timbrica in mente per la "voce" della macchina?

---

## 5. Architettura Proposta

Eliminati i 7 composer v2. Un solo stack compositivo, completamente parametrico.

```
designer.html (live — modifica durante performance)
      ↓
preset-engine.js (meta → MACRO, HARMONY, RHYTHM, MELODY, VISUAL, SYNTHESIS)
      ↓
config namespaces (oggetti separati, non un monolite da 895 righe)
      ↓
┌────────────────────────────────────────────────────────┐
│  COMPOSITION ENGINE                                    │
│                                                        │
│  macro-composer   → arc, sezioni, currentMode         │
│  harmony-layer    → drone, bass, chords               │
│  rhythm-layer     → kick, hat, break                  │
│  melody-layer     → voice, lead (MIDI → hardware)     │
│  synthesis-engine → voce diretta della macchina       │
│  dialogue-manager → guida ↔ ricerca, ascolto          │
└────────────────────────────────────────────────────────┘
      ↓                              ↓
MIDI Worker (hardware)        Web Audio (sintesi diretta)
      ↓
┌────────────────────────────────────────────────────────┐
│  VISUAL ENGINE                                         │
│                                                        │
│  visual-director  → sceglie renderer, gestisce scene  │
│  renderers/                                            │
│    bayer.js       → Canvas 2D halftone (identità)     │
│    three.js       → scene 3D, particles, shaders      │
└────────────────────────────────────────────────────────┘
      ↓
projector / performer monitor / mobile
```

### Moduli da mantenere da MACH:INE II (con pulizia)

| Modulo | Stato |
|--------|-------|
| preset-engine.js | ✓ porta, migliora (aggiungi VISUAL + SYNTHESIS) |
| presets.js | ✓ porta |
| config-loader.js | ✓ porta |
| designer.js + designer.html | ✓ porta, estendi per controllo live |
| macro-composer.js | ✓ porta, assorbe sequencer.js |
| harmony-layer.js | ✓ porta |
| rhythm-layer.js | ✓ porta |
| melody-texture-layer.js | ✓ porta, rinomina melody-layer.js |
| field.js | ✓ porta come bayer-renderer.js |
| audio.js | ✓ porta |
| midi.js | ✓ porta |
| midi-clock.worker.js | ✓ porta |
| state.js | ✓ porta |
| dna.js | ✓ porta |
| colors.js | ✓ porta |
| generations.js | ✓ porta |

### Moduli nuovi

| Modulo | Funzione |
|--------|----------|
| synthesis-engine.js | Sintesi audio diretta (AudioWorklet) |
| dialogue-manager.js | Stato dialogo macchina/musicista |
| visual-director.js | Orchestrazione visual (refactor di director.js 1325 righe) |
| renderers/three-renderer.js | Renderer Three.js |
| renderers/bayer-renderer.js | Canvas 2D halftone (da field.js) |

### Moduli eliminati

| Modulo | Motivo |
|--------|--------|
| composer.js × 7 | rimpiazzati dal composition engine |
| sequencer.js | assorbito in macro-composer |
| director.js (monolite) | refactor in visual-director + renderer separati |
| presence-multiplier.js | logica portata in macro-composer |
| midi-patterns.js | portato in renderers/bayer-renderer.js |

---

## 6. Struttura Cartelle

```
MACH:INE III/
├── index.html
├── projector.html
├── designer.html
├── launch.sh
├── CLAUDE.md
├── CHANGELOG.md
├── DESIGN.md
├── RULES.md
│
├── src/
│   ├── main.js                      — boot, wiring
│   │
│   ├── core/
│   │   ├── config.js                — namespace: MACRO, HARMONY, RHYTHM, MELODY, VISUAL, SYNTH
│   │   ├── preset-engine.js         — meta → patch completo
│   │   ├── presets.js               — preset canonici
│   │   ├── config-loader.js         — URL/file loading
│   │   └── designer.js              — UI logic (live)
│   │
│   ├── composition/
│   │   ├── macro-composer.js        — arc, sezioni, macroState
│   │   ├── harmony-layer.js         — drone, bass, chords
│   │   ├── rhythm-layer.js          — kick, hat, break
│   │   ├── melody-layer.js          — voice, lead → MIDI
│   │   ├── synthesis-engine.js      — voce diretta (AudioWorklet)
│   │   └── dialogue-manager.js      — guida/ricerca, ascolto
│   │
│   ├── io/
│   │   ├── midi.js                  — WebMIDI output
│   │   ├── midi-clock.worker.js     — MIDI clock Worker
│   │   └── audio.js                 — analisi audio (mic/BlackHole)
│   │
│   ├── state/
│   │   ├── state.js                 — stato derivato dall'audio
│   │   ├── dna.js                   — identità sessione
│   │   ├── colors.js                — sistema cromatico
│   │   └── generations.js           — entità, object pool
│   │
│   └── visual/
│       ├── visual-director.js       — orchestrazione, scelte scene
│       ├── renderers/
│       │   ├── bayer-renderer.js    — Canvas 2D halftone
│       │   └── three-renderer.js    — Three.js scenes
│       └── field.js                 — campo densità (shared)
│
└── planning/
    ├── PIANO.md                     — questo documento
    ├── STACK-DECISIONS.md           — decisioni prese (da aggiornare)
    └── RESEARCH.md                  — riferimenti tecnici
```

---

## 7. Fasi di Sviluppo

*Ordine proposto. Ogni fase è discutibile.*

| # | Fase | Output | Note |
|---|------|--------|------|
| **1** | Fondamenta | struttura cartelle, config namespaces, preset-engine v2 | nessun suono |
| **2** | Designer live | designer.html con controllo in tempo reale, morphing preset | nessun suono |
| **3** | Composition engine | macro-composer, harmony, rhythm, melody (→ MIDI) | suono via hardware |
| **4** | Sintesi diretta | synthesis-engine (AudioWorklet) | voce macchina |
| **5** | Dialogue manager | zone ricerca, ascolto, adattamento | dialogo vero |
| **6** | Visual Bayer | bayer-renderer (Canvas 2D, da MACH:INE II) | visuals base |
| **7** | Visual 3D | three-renderer (Three.js) | visuals espansi |
| **8** | Integrazione | tutto connesso, test performance live | concerto |

---

## 8. Domande Aperte

*Tutto il codice dipende da queste risposte. Nessuna riga prima di averle.*

Le domande sono divise per priorità: le **🔴 bloccanti** devono essere decise subito perché
condizionano l'architettura fondamentale. Le **🟡 importanti** vanno decise prima della fase
di sviluppo corrispondente. Le **🟢 aperte** possono emergere durante il processo.

---

### A — Visione artistica
*Definisce tutto il resto. Punto di partenza.*

🔴 **A1 — Enunciato del progetto**
In una frase: cosa è MACH:INE III? Qual è la differenza essenziale rispetto a MACH:INE II
che un ascoltatore percepirebbe nel concerto?

🔴 **A2 — Il ruolo del musicista**
In MACH:INE II il musicista era interprete. In MACH:INE III vuoi che faccia "ricerca" —
ma ricerca di cosa, esattamente? Esplora il registro dello strumento? Improvvisa contro
il contesto armonico? Crea materiale che la macchina poi elabora? Risponde a domande che
la macchina pone?

🔴 **A3 — La voce della macchina**
La macchina ha sintesi diretta. Cosa significa artisticamente? È un terzo performer sul
palco? È uno strato di sottofondo? È in dialogo con il musicista? Ha un'identità separata
da ciò che invia al MIDI?

🟡 **A4 — Struttura narrativa**
MACH:INE II aveva un arco in 5 atti drammaturgico fisso (45-60 min). MACH:INE III:
stessa struttura? Più fluida? Durata variabile? L'arco è ancora predeterminato o emerge
dall'interazione in tempo reale?

🟡 **A5 — Il pubblico vede cosa?**
Il visual è lo stesso del concerto di MACH:INE II (proiettato grande)? Ci sono schermi
multipli? Il designer è visibile al pubblico? Il performer ha un monitor separato?

---

### B — Sound design della macchina
*Definisce synthesis-engine.js. Blocca la fase 4.*

🔴 **B1 — Tipo di sintesi**
Che timbro deve avere la voce diretta della macchina? Alcune direzioni possibili:
- Droni puri (onde sinusoidali, additiva) — supporto armonico continuo
- Texture granulare — nuvole di micro-suoni, atmosfera
- FM / sintesi di frequenza — timbri più caratterizzati, metallici o organici
- Sintesi ibrida — più strati sovrapposti con ruoli diversi
- Elaborazione del segnale live del musicista (il suono del musicista trasformato)

🔴 **B2 — Output audio**
Dove va l'audio della sintesi diretta?
- In sala via interfaccia audio (mix col musicista nel sistema PA)
- Solo monitor del performer
- Registrato ma non amplificato live
- Separato dal segnale MIDI (route diversa nell'interfaccia)

🟡 **B3 — Identità timbrica per sezione**
La voce della macchina cambia carattere nei diversi momenti del concerto? O ha
un'identità sonora costante? È legata ai "preset" del designer o è autonoma?

🟡 **B4 — Rapporto sintesi / MIDI**
Le note che la macchina suona via sintesi diretta sono le stesse che manda via MIDI
al musicista? O sono strati distinti — la macchina suona una cosa, il musicista suona
un'altra cosa?

---

### C — Dialogo macchina / musicista
*Definisce dialogue-manager.js. Blocca la fase 5.*

🔴 **C1 — Meccanica delle zone ricerca**
Come funziona concretamente una zona di ricerca?
- Durata fissa (es. 2 minuti) oppure la macchina decide quando terminare?
- Cosa suona la macchina durante la zona ricerca — si ferma? sostiene? continua a basso volume?
- Il musicista ha un segnale visivo/sonoro che indica "ora sei in zona ricerca"?

🔴 **C2 — Come ascolta la macchina**
Durante le zone ricerca la macchina analizza l'audio del musicista. Cosa estrae?
- Altezze (nota suonata → adatta la tonalità successiva)
- Dinamica/intensità (forte → risponde con densità, piano → con leggerezza)
- Ritmo (il groove del musicista → influenza la ritmica successiva)
- Timbro / spettro (carattere sonoro)
- Tutto quanto sopra

🔴 **C3 — Come risponde la macchina**
Dopo una zona ricerca, come usa ciò che ha sentito?
- Adatta la tonalità / modo della sezione successiva
- Incorpora il materiale melodico del musicista (mimesi, citazione, sviluppo)
- Cambia densità e carattere ritmico
- Sceglie un preset / mood diverso
- Combinazione

🟡 **C4 — Bilanciamento potere**
La macchina può "interrompere" il musicista o sovrascriverlo? Oppure aspetta sempre
che il musicista finisca prima di riprendere a guidare? Chi ha l'ultima parola
sulla transizione tra zone?

🟡 **C5 — Segnalazione al performer**
Come comunica la macchina al musicista lo stato del dialogo? (zona ricerca / zona guida /
transizione) — via HUD visivo, segnale sonoro discreto, o il musicista deve interpretare
il contesto da solo?

---

### D — Stack tecnico
*Decisioni che bloccano l'impostazione della struttura.*

🔴 **D1 — TypeScript sì o no**
TypeScript richiede un build step (tsc o esbuild). Porta safety e autocomplete migliore
ma rompe il principio zero-build di MACH:INE II.
- Sì → definiamo un build pipeline minimo
- No → restiamo su JS puro con JSDoc per i tipi

🔴 **D2 — Tone.js per la sintesi**
Tone.js è una libreria di sintesi musicale ad alto livello (schedulazione, synth, effetti).
Funziona come ES module CDN, nessun bundler.
- Sì → velocità di sviluppo, API musicale pronta
- No → Web Audio API diretta, più controllo, zero dipendenze extra

🔴 **D3 — Three.js per i visual 3D**
Three.js via CDN + importmap, nessun bundler, funziona con ES modules nativi.
- Sì → confermiamo il renderer 3D
- No → restiamo solo su Canvas 2D (più semplice, meno ambizioso visualmente)
- Forse → lo aggiungiamo in una fase successiva (non blocca l'avvio)

🟡 **D4 — Setup audio hardware**
Stesso setup di MACH:INE II (BlackHole per il routing, mic stereo)?
O cambia l'interfaccia? Quanti canali di output servono (sintesi macchina + MIDI)?

🟡 **D5 — Browser target**
Chrome/Edge come MACH:INE II (WebMIDI richiede Chrome)? Oppure diverso?

---

### E — Visual system
*Definisce i renderer. Blocca le fasi 6-7.*

🟡 **E1 — Mantenere l'estetica Bayer halftone**
Il Canvas 2D halftone di MACH:INE II è un'identità forte. Si mantiene come
"scena base" anche in MACH:INE III? O si reinterpreta?

🟡 **E2 — Dimensione 3D — che tipo di spazio**
Se Three.js è confermato, che tipo di spazio visuale immagini?
- Campo di particelle (particle system — estensione del linguaggio dot/grain)
- Geometrie astratte (forme, strutture, architetture)
- Ambienti cosmici (profondità, spazio, luce)
- Superfici organiche (mesh animate, reaction-diffusion)
- Altro

🟡 **E3 — Relazione audio-visual**
Come cambia la relazione tra suono e visual rispetto a MACH:INE II?
- Più diretta (ogni nota lascia un segno visivo immediato)
- Più astratta (i visual riflettono lo stato macro, non i singoli eventi)
- Separata (visual con propria autonomia, si sincronizza solo in certi momenti)

🟢 **E4 — Multi-output**
Schermi multipli simultanei? Proiettore principale + monitor performer + designer screen
hanno contenuti diversi tra loro?

🟢 **E5 — Aspect ratio / risoluzione**
Il progetto deve girare su formati non standard (ultra-wide, verticale, multi-proiettore)?

---

### F — Formato performance
*Definisce macro-composer e l'arco narrativo.*

🟡 **F1 — Durata**
45-60 min fissi come MACH:INE II? Oppure il formato è più flessibile (set più corti,
performance aperte, installazione continua)?

🟡 **F2 — Struttura degli atti**
MACH:INE II aveva 5 atti con nomi (EMERGENZA, DISCESA, MACCHINA, INTENSITÀ, DISSOLUZIONE).
MACH:INE III mantiene una struttura simile? Più atti? Struttura generativa?

🟡 **F3 — Live vs studio**
Il progetto è pensato solo per performance live, o c'è interesse per una versione
"generativa sempre in esecuzione" (installazione, album generativo)?

🟢 **F4 — Registrazione**
L'output audio e visual viene registrato durante le performance?
Esiste un formato "release" oltre alla performance live?

---

### G — Workflow di sviluppo
*Pratico, ma va definito prima di iniziare.*

🟡 **G1 — Come lavoriamo**
Sviluppo in sessioni come MACH:INE II (sessioni Claude Code), oppure vuoi anche
una fase di sviluppo più autonomo tra una sessione e l'altra?

🟡 **G2 — Test della musica**
Come testiamo che il sistema suoni bene? Solo in performance live, o esiste
un modo di ascoltare il sistema in sviluppo (senza hardware completo)?

🟢 **G3 — Versioning**
Stesso schema di MACH:INE II (vX.Y.Z + CHANGELOG.md)?

---

### Riepilogo blocchi

| Codice | Domanda | Priorità | Blocca |
|--------|---------|----------|--------|
| A1 | Enunciato del progetto | 🔴 | tutto |
| A2 | Ruolo del musicista | 🔴 | dialogue-manager |
| A3 | Voce della macchina | 🔴 | synthesis-engine |
| B1 | Tipo di sintesi | 🔴 | synthesis-engine |
| B2 | Output audio | 🔴 | architettura audio |
| C1 | Meccanica zone ricerca | 🔴 | dialogue-manager |
| C2 | Come ascolta la macchina | 🔴 | dialogue-manager |
| C3 | Come risponde la macchina | 🔴 | dialogue-manager |
| D1 | TypeScript sì/no | 🔴 | struttura progetto |
| D2 | Tone.js sì/no | 🔴 | synthesis-engine |
| D3 | Three.js sì/no | 🔴 | visual architecture |

---

*Rispondi a queste domande in questo documento — aggiorna con le decisioni prese man mano.*
