# MACH:INE II — Brief per Claude Code
**Data**: 25 marzo 2026
**Obiettivo**: Portare il progetto al livello successivo — compositivamente, narrativamente, visivamente.

---

## Contesto

MACH:INE II è un audio visualizer narrativo per performance dal vivo. Il browser co-compone in tempo reale su 8 canali MIDI (CH0–CH7) verso Ableton Live. L'estetica è elettronica IDM: minimale, ripetizione, strati che si costruiscono per trasformarsi.

**Repository**: https://github.com/tweeedo911/MACH-INE-II
**Stack**: ES modules nativi, Canvas 2D, Web Audio API, WebMIDI API
**Compositori**: `src/composer.js` (TERRENO), `src/composer2.js` (MECCANICA), `src/composer3.js` (DERIVA), `src/composer4.js` (VORTICE), `src/composer5.js` (CRISTALLO), `src/composer6.js` (ABISSO) — SOLCO (composer7.js) va integrato.
**Config**: `src/config.js`

---

## DOCUMENTI DI RIFERIMENTO

Questa cartella contiene documenti dettagliati. Leggili PRIMA di scrivere codice:

| File | Contenuto | Quando leggerlo |
|---|---|---|
| `NARRATIVA.md` | Arco concertistico completo, 6 transizioni dettagliate, mappa armonica, concetti trasversali (drone, voice, fase-identità) | **Prima di tutto** |
| `NARRATIVA_VISIVA.md` | 10 proposte per ampliare la dinamica visiva, diagnosi dei problemi, codice di esempio | Prima di toccare render/director/colors |
| `CLIMAX_IMPLEMENTATION.md` | Code patterns per implementare il climax intensificativo in ogni composer | Prima di toccare i composer |
| `CONFIG_PATCH.md` | Before/after per config.js (mismatches tonali) | Prima di toccare config.js |
| `COMPOSER7_CONFIG.md` | Config block per SOLCO | Quando integri composer7 |
| `STRUMENTI.md` | Guida strumenti Ableton (info per l'utente, non per il codice) | Solo per contesto |

---

## ARCO DEL CONCERTO

```
MOTORE      BPM    TONALITÀ        CARATTERE
DERIVA      36     A Lydian        ambient drift, respiro lento
CRISTALLO   54     E Lydian        shimmer arpeggios, primo battito
ABISSO      76     Bb Phrygian     drone rituale, heartbeat
TERRENO     72     D Dorian        dub organico, groove
MECCANICA   98     C# Dorian       jazz poliritmico, layer system
VORTICE     138    E Phrygian      tribal-industriale, energia
SOLCO       128    G Dorian        Berlin techno, mantra
```

Ogni motore ha 5 fasi: germoglio → pulsazione → densità → rottura → dissoluzione.
Ogni transizione tra motori ha un gesto unico (vedi NARRATIVA.md per i dettagli).

---

## TASK — IN ORDINE DI ESECUZIONE

### FASE 1: Config alignment (sicuro, non rompe nulla)

**Leggi**: CONFIG_PATCH.md

- [ ] `config.js` COMPOSER2: cambiare mode da A_dorian a Cs_dorian, drone da 57 a 61 in tutte le fasi
- [ ] `config.js` COMPOSER6: cambiare mode da B_phrygian a Bb_phrygian, drone da 47 a 46 in tutte le fasi
- [ ] `config.js`: cambiare rottura mode di TERRENO da Eb_locrian a D_dorian (il climax resta nella scala del motore)
- [ ] `config.js`: cambiare rottura mode di VORTICE da F_locrian a E_phrygian
- [ ] Verificare che ogni `mode` nel config corrisponda a un array MODES nel relativo composer
- [ ] Aggiungere blocco COMPOSER7 (SOLCO) — vedi COMPOSER7_CONFIG.md

### FASE 2: DERIVA — aggiungere clock a 36bpm

**Leggi**: NARRATIVA.md sezione T1

DERIVA attualmente è beatless (usa timeSec e virtual bars). Va aggiunto un clock a 36bpm che:
- NON cambia il comportamento in germoglio/pulsazione/densità (le barre virtuali restano, il clock è solo interno)
- In dissoluzione: il clock diventa attivo e i grain cominciano a quantizzarsi verso multipli di (60/36/4) secondi
- Aggiungere parametro `grainRhythmicity` (0→0.6 in dissoluzione) che biasa il timing dei grain
- Aggiungere `droneGlideTarget`: in dissoluzione, il drone lerpa da A (57) a E (64) su 30 secondi
- La voice suona D# (nota 63) come ultima nota prima del silenzio (sensibile di E = ponte verso CRISTALLO)

### FASE 3: Climax intensificativo (tutti i composer beat-based)

**Leggi**: CLIMAX_IMPLEMENTATION.md

Per ogni composer (TERRENO, MECCANICA, VORTICE, ABISSO, CRISTALLO, SOLCO):

1. **RIMUOVERE** il blocco CH7 RUPTURE dalla funzione onStep/tick
2. **RIMUOVERE** i guard `phase !== 'rottura'` dal bass e altri canali
3. **AGGIORNARE** PHASE_PRESENCE: rottura deve avere valori ALTI (tutti i canali al massimo)
4. **AGGIUNGERE** la logica climax:
   - Presagio: densità ritmica cresce, kick pattern più denso
   - Infiltrazione: velocity +15-20%, voice più insistente
   - Takeover: massima densità → hard cut (all notes off) ultimi 2 bar
   - Residuo: solo drone pianissimo + grain sporadico
5. **DIFFERENZIARE** il climax per motore (vedi tabella in CLIMAX_IMPLEMENTATION.md):
   - TERRENO = "Dub Pressure"
   - MECCANICA = "Layer Convergence" (forzare allineamento 4 layer)
   - VORTICE = "Muro Tribale"
   - ABISSO = "Risalita" (mantenere octave shift esistente)
   - CRISTALLO = "Cristallo che si rompe" (arpeggi accelerano poi silenzio)
   - SOLCO = "Serraggio" (groove meccanico, velocity sweep piatto, taglio)

CH7 diventa canale opzionale per percussioni extra:
- SOLCO: CH7 = Ride (8th notes, nota 82, solo in densità/rottura) — già in composer7.js
- MECCANICA: CH7 = Ride jazz (opzionale)
- VORTICE: CH7 = Rullante tribale (opzionale)

### FASE 4: Integrazione SOLCO (composer7.js)

**Leggi**: COMPOSER7_CONFIG.md, file updated-composers/composer7.js

- [ ] Copiare `updated-composers/composer7.js` in `src/composer7.js`
- [ ] Aggiungere import/export in `main.js` (seguendo lo schema degli altri composer)
- [ ] Registrare toggle key Digit7
- [ ] Aggiungere entry 'solco' in `presence-multiplier.js` (_pm e PRIMARY_CH)
- [ ] PRIMARY_CH per SOLCO: `[0, 3, 7]` (kick, bass, ride — l'identità del groove berlinese)
- [ ] Aggiungere `getComposer7Status()` seguendo il pattern degli altri composer
- [ ] Testare che il velocity sweep funzioni (sinusoide su bass velocity ogni 8 bar)

### FASE 5: Transizioni narrative nel sequencer

**Leggi**: NARRATIVA.md sezioni T1–T6, struttura sequencer aggiornata

Riscrivere `sequencer.js` con 6 atti e SOLCO incluso:

```
ATTO I   — EMERGENZA    (0:00–4:30)   DERIVA solo → overlap con CRISTALLO
ATTO II  — DISCESA      (4:30–9:30)   CRISTALLO → ABISSO (1.5s silenzio = tritono!)
ATTO III — RISALITA     (9:30–14:30)  ABISSO → TERRENO (crossfade 60s, osmosi)
ATTO IV  — MACCHINA     (14:30–19:30) TERRENO → MECCANICA (semitono, poliritmia 72:98)
ATTO V   — VORTICE      (19:30–24:00) MECCANICA → VORTICE (convergenza layer, salto)
ATTO VI  — SOLCO        (24:00–30:00) VORTICE → SOLCO (decelerazione 138→128, 4/4)
```

Per ogni transizione, implementare i gesti descritti in NARRATIVA.md:

**T1 DERIVA→CRISTALLO "Respiro condiviso"**: overlap 30s, drone glide A→E, grain che si quantizzano, CRISTALLO entra senza kick per 16 battute

**T2 CRISTALLO→ABISSO "Frattura"**: CRISTALLO introduce note "infiltranti" da Bb Phrygian, clock jitter crescente, 1.5s silenzio reale (primo vuoto del concerto), drone ABISSO entra dal basso

**T3 ABISSO→TERRENO "Osmosi"**: crossfade 60s, bass ABISSO va su B (nota condivisa), drone Bb→B→D, kick mai si ferma, transizione invisibile

**T4 TERRENO→MECCANICA "Slittamento"**: pitch bend bass D→C# su 16 beat, overlap 12s con poliritmia 72:98 (≈3:4), MECCANICA layer entrano uno alla volta (offset 8 bar)

**T5 MECCANICA→VORTICE "Convergenza"**: forzare allineamento 4 layer, tutti suonano E, clock accelera a scatti 98→108→118→128→138, VORTICE parte da pulsazione (no germoglio)

**T6 VORTICE→SOLCO "Atterraggio"**: kick si semplifica verso 4/4, ghost spariscono, BPM decelera 138→128 su 16 bar, hi-hat SOLCO entra prima del kick

Nuovi cue types necessari:
- `transition_hook`: chiama `prepareTransitionOut(nextEngine)` sul composer in dissoluzione
- `activate_hot`: attiva engine con `entryPhase` (per VORTICE che salta germoglio)
- `silence_gap`: silenzio reale di N secondi (per T2)

Momenti-firma ridistribuiti:
- FRATTURA (~8:00): 1.5s silenzio tra CRISTALLO e ABISSO
- CONVERGENZA (~22:00): layer MECCANICA convergono
- GELO (~25:00): visual freeze a metà SOLCO
- VUOTO (~29:00): hard cut finale, drone residuo a vel 5

### FASE 6: Evoluzione visiva per fase musicale

**Leggi**: NARRATIVA_VISIVA.md (TUTTE le 10 proposte)

Questo è il cambiamento più grande al sistema visivo. L'obiettivo: i parametri visuali non sono fissi per engine ma evolvono con la fase musicale.

#### 6A. Collegamento composer→director (prerequisito per tutto il resto)

Il director non sa in che fase musicale si trova il composer. Aggiungere:

```javascript
// Nuovo: dispatcher in main.js o director.js
function getEngineStatus(engineKey) {
  const map = {
    terreno: getComposerStatus, meccanica: getComposer2Status,
    deriva: getComposer3Status, vortice: getComposer4Status,
    cristallo: getComposer5Status, abisso: getComposer6Status,
    solco: getComposer7Status,
  };
  return map[engineKey]?.() || null;
}
```

In `updateDirector()`: leggere `getEngineStatus(currentEngine).phase` e usare quel dato per guidare i parametri visuali.

#### 6B. Phase-driven ENGINE_PREFS (Proposta 1 del documento)

Sostituire `ENGINE_PREFS` statico con `ENGINE_VISUAL_PHASES` — una tabella di parametri per engine PER FASE. Ogni parametro (dotSize, densityMul, midiScale, palette, flickerSpeed) varia con la fase musicale. Lerp tra le fasi come le presence musicali.

**Range da rispettare per avere vera dinamica**:
- dotSize: da 14-16 (germoglio) a 2-3 (rottura) — range ×5
- densityMul: da 0.3 (germoglio) a 2.0 (rottura) — range ×7
- midiScale: da 2.0 (germoglio, MIDI domina) a 0.6 (rottura, massa domina)
- flickerSpeed: da 0.5 (germoglio) a 8.0 (rottura) — range ×16

#### 6C. Composition evolution (Proposta 3)

Ogni engine ha una sequenza di COMPOSITIONS legate alle fasi. Esempio TERRENO:
- germoglio → HORIZON (spazio aperto)
- pulsazione → ASYMMETRIC
- densità → MONDRIAN_A
- rottura → COLUMNS (verticalità)
- dissoluzione → ISLANDS (frammenti)

La transizione tra composizioni deve usare il blend system esistente (`scene.blend`).

#### 6D. Inversione come gesto (Proposta 4)

5 inversioni in 30 minuti, ognuna legata a un momento preciso:
- CRISTALLO: ingresso in pulsazione
- ABISSO: ingresso in densità
- MECCANICA: convergenza dei 4 layer
- VORTICE: ingresso in rottura
- DERIVA, TERRENO, SOLCO: mai

#### 6E. Camera per fase (Proposta 7)

```
germoglio:    WIDE o DRIFT
pulsazione:   MEDIUM
densità:      MACRO
rottura:      DRIFT + shake
dissoluzione: WIDE
```

Ogni engine mantiene una preferenza ma la fase la muove.

#### 6F. Zone reactivity scaling (Proposta 8)

La reactivity di tutte le zone scala con la fase musicale:
```javascript
const PHASE_REACTIVITY_SCALE = {
  germoglio: 0.3, pulsazione: 0.6, densita: 1.0, rottura: 1.5, dissoluzione: 0.4,
};
```

#### 6G. MIDI shape mutation per fase (Proposta 2)

I canali MIDI cambiano shape con la fase. Il kick inizia come 'pulse' in germoglio, diventa 'band' in densità, diventa 'column' in rottura.

#### 6H. SOLCO velocity visual (Proposta 6)

Per SOLCO: la velocity del bass (CH3) guida densityMul e brightness della palette. Lo schermo respira con il velocity sweep sinusoidale del bass.

### FASE 7: Validazione

- [ ] Zero errori in console
- [ ] Ogni motore cicla tutte le 5 fasi correttamente
- [ ] Il hard cut in rottura produce silenzio reale
- [ ] Le transizioni nel sequencer hanno gli overlap corretti
- [ ] SOLCO funziona con toggle key 7 e nel sequencer
- [ ] Il visual cambia visibilmente tra germoglio e densità (test: attivare TERRENO e osservare il cambio di dotSize/densityMul/composition)
- [ ] Le 5 inversioni avvengono nei momenti corretti
- [ ] Il drone non si ferma mai completamente durante il concerto (residuo a vel 5-10)
- [ ] La camera si muove con le fasi (WIDE in germoglio → MACRO in densità)

---

## REGOLE

- Preferire edit piccoli e sicuri. Nessun rewrite monolitico.
- Nessuna logica duplicata. Se un pattern esiste, riusalo.
- Nessun magic number — tutto in config.js o in costanti nominate.
- Codice e commenti tecnici in **inglese**.
- Documentazione di progetto in **italiano**.
- **Chiedere conferma** prima di toccare: main.js, render.js, director.js, field.js, audio.js
- I composer (composer*.js), config.js, sequencer.js, midi-patterns.js, colors.js, presence-multiplier.js possono essere modificati liberamente.
- Testare dopo OGNI fase, non solo alla fine.

---

## REFERENZE MUSICALI

| Motore | Riferimento estetico |
|---|---|
| DERIVA | Brian Eno *Discreet Music* — dissoluzione naturale |
| CRISTALLO | Nils Frahm *Says* live — arpeggi che diventano texture |
| ABISSO | Bohren & der Club of Gore — risalita dal buio |
| TERRENO | Floating Points *Silhouettes Part 7* — dub che scoppia |
| MECCANICA | Steve Reich *Music for 18 Musicians* — convergenza |
| VORTICE | Shackleton *Blood on my Hands* — muro tribale |
| SOLCO | Ben Klock live — groove ipnotico |

Transizioni:
| Transizione | Riferimento |
|---|---|
| T1 DERIVA→CRISTALLO | Aphex Twin *SAW 85-92* — silenzio che diventa suono |
| T2 CRISTALLO→ABISSO | Autechre *Gantz Graf* — struttura che collassa |
| T3 ABISSO→TERRENO | Gas *Narkopop* — strati senza cuciture |
| T4 TERRENO→MECCANICA | Amon Tobin *ISAM* — macchina che si assembla |
| T5 MECCANICA→VORTICE | Surgeon live — il kick tribale che esplode |
| T6 VORTICE→SOLCO | Ben Klock — il beat si semplifica e ipnotizza |
