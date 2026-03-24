# MACH:INE II — Session Export
# Data: 2026-03-23 (rev. 2)
# ═══════════════════════════════════════════════════════════

## STATO DEL PROGETTO

Progetto: MACH:INE II
Autore: Tweeedo (Edoardo Vogrig)
Tipo: Sistema di co-composizione ricorsiva per live performance e installazioni audiovisive
Stack: Browser-based — Canvas 2D + Web Audio API + WebMIDI API
Linguaggio: JavaScript (ES modules)
BPM attuale: 84 | Scala: D Dorian | Bar totali: 80 (~3.8 min)

---

## ARCHITETTURA — MODULI

| File             | Ruolo                                                     |
|------------------|-----------------------------------------------------------|
| main.js          | Boot, wiring, game loop                                   |
| audio.js         | Analisi audio stereo in tempo reale                       |
| midi.js          | Input MIDI, routing canali                                |
| midi-patterns.js | Mapping visivo per canale MIDI                            |
| state.js         | Stato astratto (intensity, rhythmicity, brightness, stereoWidth) |
| config.js        | Tutti i parametri numerici centralizzati (CFG)            |
| dna.js           | DNA del mondo: primitivi, zone Voronoi, comportamenti     |
| generations.js   | Entità, fossili, nascita, morte, cristallizzazione        |
| field.js         | Campo visivo, onde onset, colonne MIDI, Bayer dither      |
| colors.js        | Palette, climax, shift cromatico, inversione              |
| director.js      | Scene, arco narrativo, mutazioni, camera                  |
| render.js        | Orchestratore del frame, HUD, tastiera                    |

---

## FLUSSO DATI PER FRAME

audio.js → state.js → director.js → scene/arc/camera
midi.js  → field.js (colonne) + generations.js (entità)
audio.js → onset → field.js (onde) + generations.js (burst)
director.js + field.js + generations.js + colors.js → render.js → canvas

---

## CONTROLLI TASTIERA

H = HUD minimale on/off
D = HUD debug on/off
F = Fullscreen
R = Rigenera DNA e resetta il mondo
N = Forza mutazione immediata del director

---

## CONFIG.JS — PARAMETRI CHIAVE (CFG)

// Audio
fftSize: 2048
smoothing: 0.82
sampleRate: 48000

// Density
densityMax: 0.65
densityFloor: 0.01
densityVoidThreshold: 0.12

// Generations
maxEntities: 4000
birthRateMin: 0
birthRateMax: 60
onsetBurstCount: 40
midiBurstCount: 15
entityLifeMin: 4
entityLifeMax: 20
fossilDuration: 3

// Camera
camLerpFast: 0.08
camLerpSlow: 0.02
camMediumZoom: 1.5
camMacroZoom: 3
camMacroReturnSec: 5

// Director
directorChangeThreshold: 0.55
sceneTransitionBars: 8
sceneCutProbability: 0.25

// Arc narrativo
arcIntroDuration: 45
arcIntroEscapeIntensity: 0.5
arcIntroEscapeSec: 5
arcDevelopEnd: 75
arcTensionThreshold: 0.50
arcTensionBuildSec: 15
arcReleaseDuration: 50
arcClimaxMinSec: 12

// Render
fpsAutoLimit: 30
hudUpdateInterval: 6

---

## SCENE DISPONIBILI (director.js)

BAYER_CLASSIC  | palette:default  | comp:MONDRIAN_A  | densityMul:1.0
COLORED_GROUND | palette:amber*   | comp:MONDRIAN_B  | densityMul:0.8   | invertBase:true
SPARSE         | palette:default  | comp:ISLANDS     | densityMul:0.08
DENSE          | palette:warm     | comp:COLUMNS     | densityMul:2.0
MONOCHROME     | palette:bw       | comp:FRAME       | densityMul:1.2
NEGATIVE       | palette:default  | comp:ASYMMETRIC  | densityMul:1.4   | invertBase:true
MONDRIAN       | palette:cold     | comp:MONDRIAN_A  | densityMul:0.5
HORIZON        | palette:cyan     | comp:HORIZON     | densityMul:0.35

*COLORED_GROUND sceglie random tra: amber, cyan, magenta, warm, cold

---

## COMPOSIZIONI SPAZIALI (director.js)

MONDRIAN_A  — pannello sx denso, centro vuoto, colonna dx
MONDRIAN_B  — griglia 3×2 con blocchi alternati
COLUMNS     — colonne verticali tipo Rothko
HORIZON     — striscia orizzontale con bordi vuoti
FRAME       — vuoto al centro, densità ai bordi
ISLANDS     — blocchi isolati su sfondo quasi vuoto
ASYMMETRIC  — peso a destra, vuoto a sinistra

---

## ARCO NARRATIVO (director.js — ARC_PARAMS)

INTRO:
  allowedScenes: BAYER_CLASSIC, SPARSE
  mutationRate: 0.0
  camera: WIDE_ONLY
  densityCap: 0.25
  blendMul: 0.4
  uscita: timer 45s OPPURE audio.intensity > 0.5 per 5s

DEVELOP:
  allowedScenes: tutte
  mutationRate: 0.6
  camera: DRIFT_BIAS
  densityCap: 0.8
  blendMul: 1.0
  uscita: totalTime > 75s + intensity > 0.50 accumulato per 8s

TENSION:
  allowedScenes: DENSE, COLORED_GROUND, MONDRIAN, NEGATIVE
  mutationRate: 1.5
  camera: TIGHTEN
  densityCap: 1.0
  blendMul: 1.5
  chromaChance: 0.3
  uscita: tensionAccum > 15s → CLIMAX

CLIMAX:
  allowedScenes: DENSE, NEGATIVE
  mutationRate: 2.5
  camera: MACRO_LOCK
  densityCap: 999
  blendMul: 3.0
  chromaChance: 0.5
  invertChance: 0.3
  uscita: phaseTime > 12s + intensity < 0.3

RELEASE:
  allowedScenes: SPARSE, MONOCHROME, HORIZON
  mutationRate: 0.15
  camera: SLOW_WIDE
  densityCap: 0.35
  blendMul: 0.25
  uscita: timer 50s OPPURE intensity > 0.6 dopo 15s → DEVELOP

---

## MUTATION SYSTEM (director.js)

Tipi di mutazione con pesi:
  PRIMITIVE     weight:20 — sostituisce un primitivo DNA
  RESET_PARTIAL weight:15 — uccide entità in una zona casuale
  CHROMATIC     weight:20 — shift cromatico (all-A / all-B / grey)
  SCENE         weight:45 — transizione a nuova scena

Trigger:
  - Con ritmo rilevato (BPM > 0, rhythmicity > 0.3): ogni N bar
  - Senza ritmo: ogni ~15s con randomFactor 0.4
  - Mutazione forzata da tastiera: tasto N

---

## DNA SYSTEM (dna.js)

PRIM_TYPES: BANDA, BLOCCO, VETTORE, VUOTO, FRONTE, SCIAME, STRISCIA, MATRICE
FREQ_MAPPINGS: horizontal, vertical, radial, diagonal

dna generato a ogni sessione (2-4 primitivi attivi)
Mutazione PRIMITIVE sostituisce uno dei primitivi attivi con uno non presente

Zone Voronoi (zoneCount: 10):
  Archetipi: SOLIDO, GRANA_GROSSA, RITMICO, RAREFATTO, CROMATICO, DENSO_MEDIO
  Ogni zona ha: birthMul, reactivity, flickerPhase, colorAffinity

---

## SISTEMA CROMATICO (colors.js)

Colori semantici:
  A = #FF4400 (arancio bruciato) — onset, kick, attacco
  B = #00AACC (teal elettrico)   — nota MIDI, accordo, pitch
  C = #E6007E (magenta)          — climax, max 2-3 volte per sessione

Regole:
  - max 2 colori simultanei visibili
  - C esclude A e B mentre è attivo
  - colorDecayStart: 0.65 — colorDecayEnd: 0.92

Palette disponibili:
  default | amber | cyan | magenta | warm | cold | bw

---

## CAMERA SYSTEM (director.js)

Shot types:
  WIDE    — zoom 1.0, nessun offset
  MEDIUM  — zoom 1.5, centrato su POI
  MACRO   — zoom 3.0, lock su POI, ritorna dopo 5s
  DRIFT   — zoom 1.15-1.30, deriva lenta verso POI

POI = centro di massa pesato per densità delle entità giovani

Lerp: 0.08 con ritmo | 0.02 senza ritmo

---

## MIDI MAPPING (midi-patterns.js)

8 canali con ruoli visivi indipendenti:

CH0 PULSE   | shape:pulse   | zone:[0.30-1.00] | xMode:spread/center | decay:0.91-0.95  | color:0
CH1 GRAIN   | shape:scatter | zone:[0.00-1.00] | xMode:random        | decay:0.88-0.93  | color:0/null
CH2 DRONE   | shape:field   | zone:[0.00-1.00] | xMode:static        | decay:0.995-0.999| color:null
CH3 BASS    | shape:blob    | zone:[0.40-1.00] | xMode:center/pitch  | decay:0.985-0.990| color:1
CH4 CHORDS  | shape:band    | zone:[0.00-1.00] | xMode:pitch/stereo  | decay:0.975-0.982| color:1/2
CH5 VOICE   | shape:trail   | zone:[0.00-0.90] | xMode:pitch/stereo  | decay:0.965-0.975| color:2
CH6 LEAD    | shape:pulse   | zone:[0.10-0.90] | xMode:pitch         | decay:0.960-0.970| color:1
CH7 RUPTURE | shape:burst   | zone:[0.00-1.00] | xMode:random        | decay:0.940-0.955| color:2/C

Ogni canale muta il proprio pattern ogni 12-32 bar (checkPatternChange).

---

## SISTEMA ARMONICO — "DERIVA"

Il sistema non ha una tonalità fissa.
Ha un centro di gravità che deriva nel corso della sessione.

### Drone path (T3 DRONE / strato 1)

  GERMOGLIO → PULSAZIONE → DENSITÀ  → ROTTURA → DISSOLUZIONE
      D            D           A          Eb          D

  D → A  : quinta giusta, tensione naturale
  A → Eb : tritono, massima dissonanza possibile
  Eb → D : ritorno con memoria della rottura

### Campo modale per fase (strato 2)

  | Fase        | Drone | Modo       | Carattere                              |
  |-------------|-------|------------|----------------------------------------|
  | GERMOGLIO   | D     | D Dorian   | Aperto, ambiguo, né maggiore né minore |
  | PULSAZIONE  | D     | D Frigio   | Oscuro, tensione dal semitono superiore|
  | DENSITÀ     | A     | A Lidio    | Luminoso, sospeso, senso di espansione |
  | ROTTURA     | Eb    | Eb Locrio  | Instabile, nessuna tonica solida       |
  | DISSOLUZIONE| D     | D Dorian   | Ritorno — suona diverso dopo il Locrio |

### Note pivot (presenti in tutti i modi)
  D, F, A — il filo armonico che attraversa l'intera sessione

### Progressioni accordali — ciclo 1 (T5 CHORDS)
  PULSAZIONE:   Dm → F → Dm → C
  DENSITÀ:      A → E → F#m → E → A → Bm → A
  DISSOLUZIONE: Dm → Am → Dm

### Ritmo armonico (velocità cambio accordi per fase)
  GERMOGLIO:    ogni 8-16 battute
  PULSAZIONE:   ogni 4 battute
  DENSITÀ:      ogni 2 battute
  ROTTURA:      ogni mezza battuta → freeze
  DISSOLUZIONE: ogni 8-16 battute

### Voice leading
  Ogni voce si muove di max 2 semitoni tra un accordo e il successivo.
  Il basso può saltare liberamente.
  T4 BASS legge la root di T5 CHORDS e costruisce sopra.
  T6 VOICE usa le note dell'accordo come preferredNotes nella Markov chain.
  T3 DRONE raddoppia T5 CHORDS in voicing aperto (root + quinta + ottava).

### Legge del vuoto
  In ogni momento almeno il 40% delle tracce è in silenzio.
  Il silenzio è un evento compositivo, non assenza di evento.

---

## TRACCIA MIDI — MACHINE_II_8tracks.mid

File: MACHINE_II_8tracks.mid
BPM: 84 | Scala: D Dorian | Bar: 80 | Durata: ~3.8 min
Formato: MIDI Type 1, 9 track (1 tempo + 8 musicali)

### Struttura narrativa

  Bar  0-7   GERMOGLIO    — drone D, T3 appena percettibile, tutto il resto assente
  Bar  8-23  PULSAZIONE   — T1 entra (pattern motorik), T5 primo accordo tenuto, T3 voice rada
  Bar 24-47  DENSITÀ      — T4+T6+T5 in movimento; T2 GRAIN cresce; T8 presagio (28-39) → infiltrazione (40-47)
  Bar 48-63  ROTTURA      — T8 domina, T2 GRAIN glitch denso, accordi rotti, voce frammentata
  Bar 64-79  DISSOLUZIONE — rarefazione, T2 GRAIN tace, residui T8, drone finale

### Le 8 tracce

  T1 | PULSE   | CH0 | Kick/clock motorik E(5,16), C1 fisso | entra bar 8, tace in dissoluzione
  T2 | GRAIN   | CH1 | Hihat, glitch, noise, texture ritmiche | vedi sezione dedicata
  T3 | DRONE   | CH2 | Pad/cluster tenuti, drone, sfondo armonico | presente da bar 0
  T4 | BASS    | CH3 | Basso dorian, note lunghe, legge root di T5 | entra bar 8
  T5 | CHORDS  | CH4 | Triadi modali con voice leading minimo | entra bar 8
  T6 | VOICE   | CH5 | Melodia Markov 2° ordine, frasi brevi + pause | rada in pulsazione, protagonista in densità
  T7 | LEAD    | CH6 | Motivo melodico D-G-A, impulso principale | entra bar 8
  T8 | RUPTURE | CH7 | Corruzione a 4 stadi | sempre ultima, sempre preparata

### T2 GRAIN — note MIDI e comportamento

  Note usate:
    42 — hihat chiuso    | polso ritmico sottile
    46 — hihat aperto    | respiro, accento
    38 — snare           | colpo secco, raro
    37 — side stick      | glitch organico
    39 — clap            | glitch artificiale
    75 — claves          | click elettronico
    64-68 — tom range    | noise burst, texture amorfa

  Comportamento per fase:
    GERMOGLIO   (0-7)   — silenzio totale
    PULSAZIONE  (8-23)  — hihat chiuso ogni 2 beat, vel 25-40; hihat aperto ogni 8 bar
    DENSITÀ     (24-47) — pattern si infittisce, side stick fuori beat; bar 28-39 claves+noise radi (eco di T8)
    ROTTURA     (48-63) — hihat scompare quasi del tutto, dominano noise burst e clap, vel 60-90
    DISSOLUZIONE(64-79) — residui di hihat aperto, vel 20→8, poi silenzio

  Velocity curve globale:
    bar:  0    8    24   40   48   64   79
    vel:  —    30   50   65   85   40    8
    (campana asimmetrica: salita lenta, picco in ROTTURA, caduta rapida)

  Relazione con T8 RUPTURE:
    bar 28-47 — GRAIN anticipa RUPTURE con glitch radi mentre RUPTURE è ancora al presagio
    bar 48-63 — si sovrappongono; GRAIN perde gli hihat, rimane solo rumore grezzo
    bar 64-79 — GRAIN tace per prima; RUPTURE ha l'ultima parola

### T8 RUPTURE — 4 stadi

  Stadio 1 PRESAGIO      (bar 28-39): 4 note isolate, vel 28, fuori beat, Bb/F# (fuori scala)
  Stadio 2 INFILTRAZIONE (bar 40-47): burst 2-4 note, vel 38→55, crescenti ma minoritari
  Stadio 3 TAKEOVER      (bar 48-63): domina, vel 70→110, registro E5-D6, pattern irregolare
  Stadio 4 RESIDUO       (bar 64-79): 5 note isolate, vel 50→20, sempre più rade

### Corrispondenza fasi musicali ↔ arco visivo

  GERMOGLIO    → ARC: INTRO    | scene: BAYER_CLASSIC, SPARSE
  PULSAZIONE   → ARC: DEVELOP  | scene: tutte
  DENSITÀ      → ARC: TENSION  | scene: DENSE, COLORED_GROUND, MONDRIAN, NEGATIVE
  ROTTURA      → ARC: CLIMAX   | scene: DENSE, NEGATIVE | blendMul 3.0
  DISSOLUZIONE → ARC: RELEASE  | scene: SPARSE, MONOCHROME, HORIZON

### Mutazione inter-ciclo

  | Parametro              | Mutazione                                  | Ogni        |
  |------------------------|--------------------------------------------|-------------|
  | Drone di partenza      | ±1 semitono                                | 2-3 cicli   |
  | Pattern euclidean T1   | un beat si sposta di uno step              | ogni ciclo  |
  | Matrice Markov T6      | probabilità aggiustate sulle note più usate| continua    |
  | Durata fasi            | ±10% random                                | ogni ciclo  |
  | Modo di default        | scivola nel modo adiacente                 | ogni 4 cicli|

---

## CONCEPT ARTISTICO

MACH:INE II è un sistema di co-composizione ricorsiva uomo-macchina.

La macchina genera materia musicale (MIDI): pattern, note, tensioni, strutture.
Il musicista interpreta quel materiale con strumenti hardware o digitali,
lo piega, lo espande o lo contraddice durante la performance.
Il sistema ascolta ciò che accade (audio + MIDI) e lo traduce in comportamento visivo e narrativo.

Il risultato non è un visualizer.
È un organismo circolare in cui composizione, esecuzione e immagine
si trasformano continuamente a vicenda.

Il soggetto artistico non è né la macchina né il performer.
È il delta tra proposta e risposta.

Riferimenti musicali: Autechre, Ryoji Ikeda, Brian Eno, Alva Noto, Arca, Neu!, Can, Cluster, Oval.

---

## FASI COMPOSITIVE

GERMOGLIO    — Sparsità, respiro, elementi isolati           → ARC: INTRO
PULSAZIONE   — Comparsa del tempo, pattern ritmico          → ARC: DEVELOP
DENSITÀ      — Stratificazione, compressione, pressione     → ARC: DEVELOP→TENSION
ROTTURA      — Squilibrio, sabotaggio, dominio rupture      → ARC: CLIMAX
DISSOLUZIONE — Rarefazione, residui, memoria                → ARC: RELEASE

---

## ROADMAP

[ ] Generare MACHINE_II_8tracks.mid con la nuova struttura a 8 tracce
[ ] Implementare T2 GRAIN nel composer procedurale
[ ] Implementare T8 RUPTURE nel composer procedurale con parametri:
      rupturePresence      (0→1)
      ruptureDensity
      ruptureRegister      (0=basso, 1=alto)
      ruptureCorruption    (quanto sabota le altre tracce)
      ruptureTakeoverBars  (durata in bar del takeover)
[ ] Composer browser-based (JS) — generazione MIDI procedurale con:
      EuclideanEngine (T1 PULSE)
      MarkovEngine    (T6 VOICE)
      ChordEngine     (T5 CHORDS → alimenta T4 BASS, T6 VOICE, T3 DRONE)
      PresenceManager (fade in/out per traccia)
      MutationEngine  (mutazione inter-ciclo)
[ ] API composer → director tramite composerState condiviso:
      { phase, rupturePresence, dominantTrack, tension, barsElapsed }
[ ] Ottimizzazione multi-schermo per proiezione live
[ ] Valutazione porting layer compositivo su monome norns

---

## REGOLE DI PROGETTO (sintesi)

1. Versionamento: vMAGGIORE.MINORE.PATCH con CHANGELOG
2. Piano → approvazione → implementazione → test → doc → commit
3. Snapshot prima di ogni modifica importante
4. Tutti i parametri in CFG (config.js), no magic numbers
5. Non toccare senza discussione:
   - loop principale main.js / render.js / director.js
   - onset detection
   - relazione arco narrativo ↔ arco visivo
   - comportamento rupture e climax
6. Ogni modifica a scene/arco/camera deve essere motivata narrativamente
7. T8 RUPTURE deve sempre essere preparata (4 stadi), mai burst isolato
8. T2 GRAIN non deve mai coprire i transienti di T1 PULSE — cedono spazio a vicenda
9. Codice e commenti: inglese | Documentazione: italiano
10. Niente commit di codice rotto

---

## KILL LIST — COSA NON SI FA

- Testo animato o titoli in scena
- Mesh 3D o modelli
- Gradienti colorati (solo grigi + A/B/C semantici)
- Glow o bloom eccessivo
- Più di 2 colori semantici simultanei
- Glitch continui (T2 GRAIN non è rumore costante — è evento)
- Climax costante
- Rotture senza preparazione
- Magic numbers nel codice

---
# Fine export — MACH:INE II Session 2026-03-23 rev.2
