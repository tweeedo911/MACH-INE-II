# CHANGELOG

Tutte le modifiche significative al progetto sono documentate qui.
Formato: `[versione] – data – descrizione`

---

## [v2.9.1] – 2026-03-29

**Sistema V3 visivo completo — theatrical actor behaviors, rect shape, guard bugfix.**

### Aggiunto
- **`rect` shape** (`field.js`, `midi-patterns.js`): nuovo shape halftone per CH5 VOICE e CH6 LEAD — quadrato pitch-mapped (sia x che y si spostano con l'intonazione), accumula come trail. Voice e lead si intrecciano fisicamente quando le linee melodiche convergono.
- **PHASE_BEHAVIORS sistema teatrale** (`midi-patterns.js`): 8 canali MIDI × 5 sezioni modali, ogni canale è un attore con ruolo che evolve. CH5 VOICE (violet, protagonista), CH6 LEAD (cyan, eco/risposta), CH0 PULSE colonna/scatter per sezione, CH7 RUPTURE trickster.
- **Per-channel trail eviction** (`field.js`): `CH_MAX = [4, 4, 3, 7, 9, 14, 10, 5]` — ogni canale ha il proprio limite di slot trail, evita che CH1 grain monopolizzi il buffer.

### Modificato
- **CH0 PULSE**: rimosso shape `pulse` da tutti i PHASE_BEHAVIORS — sostituito con `scatter` e `column` per sezione.
- **CH2 DRONE**: dimensioni ridotte (0.28-0.32 → 0.07-0.09) per decongestione visiva.
- **CH6 LEAD**: colore distinto da CH5 — `color: 2` (cyan) invece di `color: 3` (violet) su tutti i PHASE_BEHAVIORS e LEAD_BEHAVIORS.
- **CH1 GRAIN**: dimensioni halved (0.014→0.007 in apertura) per ridurre ingombro hi-hat.
- **Velocity floor** (`field.js`): esteso da ch<=4 a ch<=6 — garantisce visibilità rect CH5/CH6 in apertura quando `melodicActivity` è bassa.

### Corretto
- **White background a 3 minuti** (`sequencer.js`): guard `!CFG.V3_MODE` su `startInvertDissolve()` per i case `layer` e `fade_to`.
- **PHASE_BEHAVIORS irraggiungibili in V3** (`midi-patterns.js`): `pickBehavior()` ora valuta PHASE prima di ENGINE in V3_MODE.
- **Inversione ENGINE_INVERSIONS/VORTICE in V3** (`director.js`): guard `!CFG.V3_MODE` su entrambi i timer di inversione.
- **Palette leak chord_change in V3** (`director.js`): guard `!CFG.V3_MODE`.
- **manualToggle() in V3** (`main.js`): guard `CFG.V3_MODE` — impedisce attivazione manuale dei composer V2 durante la performance V3 (collisione canali MIDI).
- **setPhaseMode() ripick parziale** (`midi-patterns.js`): ora repicka tutti gli 8 canali ad ogni transizione modale.

---

## [v2.9.0] – 2026-03-28

**Sistema V3 — MacroComposer + layer armonico/ritmico/melodico completo. Qualità compositiva e controllo live.**

### Aggiunto
- **MacroComposer v3** (`macro-composer.js`): stato 4D (`rhythmicDensity`, `harmonicColor`, `melodicActivity`, `textureDepth`) interpolato su curva hermite precomposta per l'intera durata del concerto (45 min). 5 modi musicali con pivot di un bar alle transizioni.
- **HarmonyLayer v3** (`harmony-layer.js`): drone CH2 (root + ottava, 7.5 bar), basso CH3 con voice leading tra anchor, accordi CH4 con `progressionCycle` 8-step per modo + voice leading + cromatismi Four Tet (12%).
- **RhythmLayer v3** (`rhythm-layer.js`): kick 5 fasi (arhythmic→emerging→groove→climax→dissolving) guidate da `rhythmicDensity`. Hi-hat phasing Reich 8/9 step. Percussioni CH7 additive Glass (lunghezze prime 5/7/11/13).
- **MelodyTextureLayer v3** (`melody-texture-layer.js`): melodia Markov CH5 con phrase buffer Reich/Nyman (frase 4 note, ripetuta 4×), seed motif catturato al primo ciclo. Arpeggio CH6 in dialogo cross-layer.
- **Arc jump live** (`main.js`, `macro-composer.js`, `sequencer.js`): in V3_MODE i tasti 1-5 saltano l'arco narrativo (0%/22%/50%/75%/90%) sincronizzando sequencer e clock interno.
- **Break ciclici kick+basso** (`rhythm-layer.js`, `harmony-layer.js`, `macro-composer.js`): ogni 10-20 bar kick e basso escono per 2-4 bar, hat/drone/accordi/melodia continuano. Re-entry con +28 velocity punch. Attivo tra arco 15-88%.
- **`breakActive`** in `macroState`: flag condiviso tra RhythmLayer e HarmonyLayer per coordinare il break senza coupling diretto.

### Modificato
- **Chord progression cycle** (`config.js`, `harmony-layer.js`): `progressionCycle` per ogni modo — sequenza 8-step predeterminata di anchor voicing invece di selezione casuale. Narrativa armonica riconoscibile.
- **Harmonic rhythm** (`harmony-layer.js`): accordi ogni 4 bar → ogni 2 bar. Progressione più viva.
- **Bass voice leading** (`config.js`): note di basso distinte per ogni anchor voicing — il basso si muove tra gli accordi.
- **Drone breathing** (`config.js`, `harmony-layer.js`): skip probability 25% (inversamente proporzionale a `harmonicColor`), ottava alta probabilistica (60%), velocity abbassata 50-70 → 40-65.
- **Markov rebalancing** (`config.js`): `stepBonus` 2.5→1.5, `jumpPenalty` 0.15→0.35 — melodia meno mononota.
- **Phrase repetition CH5** (`melody-texture-layer.js`, `config.js`): frase 4 note ripetuta 4× prima di rigenerare — memoria melodica riconoscibile.
- **Sequencer in Worker** (`main.js`): `updateSequencer()` spostato dal loop rAF (throttolato in background) al Worker MIDI (unthrottled).
- **Percussion timing** (`config.js`): offset microtemporale 5-30ms → 2-12ms.

### Corretto
- **dt unit bug** (`macro-composer.js`): il clock interno girava 1000× più lento — il Worker invia già `dt` in secondi, non in ms.
- **Drone block return** (`harmony-layer.js`): `return` prematuro nel drone skip causava blocco di accordi e basso; ristrutturato come `if (Math.random() >= skipProb) { ... }`.
- **CH3 dual-write** (`melody-texture-layer.js`): MelodyTextureLayer e HarmonyLayer scrivevano entrambi su CH3; MelodyTextureLayer cede CH3 a HarmonyLayer.
- **Dissoluzione melody** (`config.js`): `melodicActivity` finale era sotto-bilanciata; checkpoint corretti.

---

## [v2.8.0] – 2026-03-26

**Profondità compositiva — kick suppression, ride progressivo, arpeggi intrecciati, anticipo SOLCO.**

### Aggiunto
- **CH7 RIDE progressivo** (`composer.js/2/4`): ride introdotto in TERRENO (gocce metalliche sparse per fase), MECCANICA (pattern jazz sincopato + open ride ogni 8 bar), VORTICE (pattern tribale additivo 3+3+3+3+4) — prepara l'orecchio al piatto SOLCO prima dell'ingresso
- **Canon alla quinta CH6 TERRENO** (`composer.js`): in densità/rottura, eco della frase voice trasposta +7 semitoni con 1 bar di ritardo — dialogo contrappuntistico
- **Hocket CH5/CH6 SOLCO** (`composer7.js`): in densità la melodia è divisa tra CH5 (step pari) e CH6 (step dispari) su G Dorian G4–G5; fuori densità rimane il frammento raro ogni 16 bar
- **Interlocking upbeat VORTICE** (`composer4.js`): CH6 suona sugli 8th upbeat (step 2,6,10,14) dove CH5 tace — dialogo complementare in E Phrygian registro alto (76–83)
- **Ghost notes CH0 TERRENO** (`composer.js`): in densità/rottura, note ghost vel 18–28 sugli offbeat non occupati dal kick (prob 0.25/0.35)
- **Boost nota caratteristica modale** (`config.js` + 5 composer): +15 velocity sulla nota definitoria di ogni modo — B in TERRENO, A# in MECCANICA, F in VORTICE, E in SOLCO, Cb in ABISSO

### Modificato
- **SOLCO anticipa Atto III** (`sequencer.js`): entra a t=1320 (min 22) sotto MECCANICA come layer pm=0.3; sale a 0.7 a t=1560; raggiunge 1.0 a t=1680 — MECCANICA esce a t=1680 (anticipo di 60s rispetto al precedente t=1740)
- **TERRENO kick evolution** (`composer.js`): aggiunti E(4,16) e E(5,16) in `KICK_PATS`; `KICK_FOR_PHASE` rivisto per progressione graduale germoglio→densità→rottura
- **Kick suppression multi-engine** (`config.js` + 6 composer): ogni motore sopprime il proprio kick CH0 quando pm < `CFG.kickDominanceThreshold` (0.4) — elimina flam CH0 durante sovrapposizioni

### Corretto
- **Progressioni non-potenza-di-2**: TERRENO densità 6→8 accordi (8×4=32 bar), MECCANICA densità 6→8 accordi (8×4=32 bar), CRISTALLO dissoluzione 3→4 accordi (4×8=32 bar), ABISSO pulsazione+dissoluzione 3→4 accordi (4×8=32 bar)
- **Overlap armonico D→C#** (`composer2.js`): MECCANICA germoglio entra con sola radice C# per i primi 8 bar — bridge armonico prima della progressione piena

---

## [v2.7.0] – 2026-03-26

**Performance runtime — eliminazione allocazioni hot-path, object pool entità, debug gate.**

### Ottimizzato
- **Object pool entità/fossili** (`generations.js`): `spawnEntity` recupera oggetti da `_entityPool` invece di allocare `{}` ogni spawn; fossili recuperati da `_fossilPool`; morte restituisce al pool — zero allocazioni steady-state
- **`_youngestAge` pre-allocata** (`generations.js`): `new Float32Array(cells)` era allocata ogni frame in `buildEntityGrid` (~8 KB/frame) — ora array module-level con resize solo se la canvas cambia
- **Filter→loop hot-path** (`composer.js/2/3/4/5/6/7`): tutte le occorrenze di `.filter(p => p > X).length` nei metodi `updatePresence()`, `emitLayerEvents()`, `injectState()` sostituite con loop espliciti — zero array temporanei per frame
- **Ring buffer centroide** (`composer3.js`): `centroidHistory.push/shift/reduce` O(n) → `Float32Array(30)` circolare con running sum O(1); stati `_centroidBuf/Idx/Sum/Fill` inizializzati in `initComposer3`
- **Audio fallback DERIVA** (`composer3.js`): `audio.bands.air.L/R` ora con null-safety `?? audio.rms * 0.15` — previene crash se l'analizzatore non ha la banda air

### Aggiunto
- **`CFG.debug`** (`config.js`): flag globale `false` — tutti i blocchi `debugTimer >= 10` nei composer gati con `if (CFG.debug && ...)` — zero console spam durante performance live

---

## [v2.6.0] – 2026-03-26

**Completamento partitura v2.6.0 — Markov rupture, clamp ABISSO, frame feedback, inversion VORTICE.**

### Aggiunto
- **CRISTALLO Markov rupture** (`composer5.js`): CH7 cluster durante rottura usa zone registrali Markov (low/mid/high da F locrian); matrice di transizione biased upward; `_ruptureZone5` si resetta a 0 al rientro in 'presagio'
- **Frame buffer feedback** (`render.js`, `director.js`): background fill con alpha = `1 - feedbackDecay` invece di fillRect opaco — trail visivi persistenti; `engineRender.feedbackDecay` cablato da `ENGINE_PREFS` (terreno 0.94, deriva 0.97, cristallo 0.95)
- **VORTICE rhythmic inversion** (`director.js`): `startInvertDissolve()` ogni 4 beat a 138 BPM (~1.739s) via `_vorticeInvTimer` accumulato con dt

### Corretto
- **ABISSO CH4/CH5 clamp** (`composer6.js`): note di accordo e voce clampate a `Math.min(84, ...)` (C6) — elimina MIDI out-of-range in ottave alte
- **CRISTALLO shimmerPatIdx reset** (`composer5.js`): `shimmerPatIdx = 0` al cambio di fase — pattern shimmer non parte da indice residuo della fase precedente

---

## [v2.5.0] – 2026-03-26

**Identità cromatica MIDI per motore + comportamenti channel aggiuntivi.**

### Aggiunto
- **`ENGINE_MIDI_COLORS`** (`colors.js`): palette MIDI distinte per terreno (terra/cera), deriva (acqua/aria), solco (ferro/cemento) — i trail MIDI assumono cromaticità coerente con il carattere del motore
- **TERRENO CH6 LEAD** (`midi-patterns.js`): comportamento visivo dedicato per il canale melodia di TERRENO — trail più lunghi, intensità legata alla velocity
- **ABISSO CH4 CHORDS** (`midi-patterns.js`): comportamento visivo dedicato per accordi ABISSO — area più larga, decay lento coerente con il carattere rituale

### Modificato
- **SOLCO palette** (`director.js`): `warm` → `bw` — identità visiva monocromatica coerente con Berlin techno

---

## [v2.4.0] – 2026-03-26

**PARTITURA — presenze drone, voice germoglio, evoluzione droni.**

### Regola 4 — Presenze drone ridotte sui motori ritmici
- **VORTICE** (`composer4.js`): drone cap 0.2/0.15/0.1/0.0/0.2 — non copre più il groove
- **SOLCO** (`composer7.js`): drone ridotto a 0.3/0.3/0.2/0.1/0.4
- **TERRENO** (`composer.js`): drone 0.5/0.6/0.3/0.1/0.7
- **MECCANICA** (`composer2.js`): drone cap 0.15/0.15/0.1/0.0/0.1
- **CRISTALLO** (`composer5.js`): drone disattivato quando `pm < 0.5` (CRISTALLO in secondo piano)
- **ABISSO** (`composer6.js`): drone densita 0.8→0.5

### Voice germoglio — vita nei momenti fondanti
- **DERIVA** (`composer3.js`): VOICE 0.0→0.15 in germoglio; brightness threshold 0.40→0.70 (note rarissime, solo su picchi)
- **CRISTALLO** (`composer5.js`): VOICE 0.0→0.15 (allineato alla soglia shimmer 0.15)
- **ABISSO** (`composer6.js`): VOICE 0.0→0.1

### Evoluzione droni — movimento nel tempo
- **TERRENO** (`composer.js`): oscillazione D3↔A2 ogni 16 bar (`droneBarCount`) — drone respira come marea
- **DERIVA** (`composer3.js`): espansione germoglio root→quinta (60s)→ottava (90s) (`droneAge`) — il drone cresce con la fase
- **ABISSO** (`composer6.js`): CHORDS ingresso graduale in germoglio — root (bar 0–3), +b3 (bar 4–7), triade completa (bar 8+) (`chordsRevealBar`)

### MECCANICA — carattere jazz potenziato
- **Ghost notes** 30% su offbeat ritmici (layer rhythmic 0.25/0.75)
- **Swing progressivo** 0→12ms da germoglio a densita (beats 2 e 4)
- **TEXTURAL sinusoidale** — presenza oscilla tra 0.3–0.7 su ciclo 32 bar

### Config (`config.js`)
Nuovi parametri: `droneOscillationBars`, `droneNoteAlt`, `swingMsMax`, `ghostNoteProb`, `texturalOscBars`, `droneExpansionSec`, `voiceGermoglioThreshold`

---

## [v2.3.0] – 2026-03-26

**Wake Lock + fix compositivi SOLCO + HUD debug completo.**

### Aggiunto
- **Wake Lock** (`main.js`): `WakeLockManager` acquisito al boot — lo schermo non si spegne durante la performance live; si ri-acquisisce automaticamente quando la tab torna visibile
- **HUD debug COMP7**: SOLCO visibile nel pannello debug (`D`) con phase, activeCount e ruptureStage

### Corretto
- **SOLCO bass rotation** (`composer7.js`): variazione pattern ogni 12 bar → **16 bar** (regola potenze di 2; 12 causava groove off-grid rispetto alla struttura 4/4)
- **SOLCO drone parametrico** (`composer7.js`): note drone hardcoded `43`/`50` → `currentDrone - 12` / `currentDrone - 12 + 7` — il pitch risponde ora alla config di fase in `CFG.COMPOSER7`

### Rimosso
- **Variabile morta** (`composer7.js`): `const scale` nel blocco CH7 RIDE era dichiarata ma mai usata (nota ride è fissa a 82)

---

## [v2.2.0] – 2026-03-26

**Sequencer avanzato + ottimizzazioni performance + secondo output proiettore.**

### Aggiunto
- **Sequencer: pausa/resume** (`Space`): il tempo si congela, i composer restano fermi
- **Sequencer: loop cue** (`L`): il tempo scorre ma nessuna nuova cue viene processata — il motore attuale resta attivo indefinitamente
- **Sequencer: navigazione cue** (`←` prev, `→` next invariato) e navigazione atto (`Shift+←`/`Shift+→`) con fast-forward da zero per coerenza di stato
- **Sequencer: crash recovery** (`Shift+R`): stato salvato in `sessionStorage` ogni 10s, ripristinabile dopo crash/reload con `_deactivateAll()` prima del restore
- **Sequencer: sicurezza live** (`0` = solo START, `Shift+0` = solo STOP) — previene stop accidentali durante performance
- **Proiettore** (`P`): apre `projector.html` — canvas fullscreen zero-HUD che legge da `window.opener` (zero serializzazione, zero overhead su render loop); `PROJ:ON` nell'HUD
- **`projector.html`**: pagina minimale con pull rendering via `window.opener`, handshake BroadcastChannel `machine-projector`
- **`CFG.maxMidiNotesPerFrame = 20`**: cap MIDI visivo per frame, priorità per velocity

### Ottimizzato
- **`generations.js`**: `entities.splice` e `fossils.splice` → swap-and-pop O(1)
- **`field.js`**: `onsetWaves.splice` e `midiTrail.splice` → swap-and-pop O(1)
- **`director.js`**: blend scene pre-alloca `_blendBuffer` (no `map()`+spread ogni frame durante transizioni); dynamic compositions pre-alloca `_dynBuffer` (no `map()`+spread ogni frame)

### Modificato
- **Sequencer CUES**: SOLCO entra al climax globale (`t:2040`, duration:5) ed esce per primo (`t:2070`, duration:10); discesa dal climax scaglionata (SOLCO→VORTICE→TERRENO+MECCANICA→ABISSO) invece di uscita simultanea
- **HUD**: formato sequencer `▶ 12:34/40:00 — III MACCHINA [LOOP]`

---

## [v2.1.1] – 2026-03-25

**Fix critici: motori muti dopo rottura (dt undefined in residuo).**

### Corretto (Bug fix)
- **`dt` undefined in TERRENO residuo** (`composer.js`): il blocco residuo era dentro `onStep()` dove `dt` non esiste — presence diventava NaN dopo il primo takeover, motore completamente muto. Spostato in `updateComposer(dt)` dove `dt` è disponibile
- **`dt` undefined in SOLCO residuo** (`composer7.js`): `updateClimax()` non riceveva `dt` — il fade del drone in residuo produceva NaN. Aggiunto parametro `dt` alla funzione

---

## [v2.1.0] – 2026-03-25

**7 motori compositivi + MIDI timing anti-drift + phase bridge visuale + debug canali.**

### Aggiunto
- **SOLCO** (`composer7.js`): settimo motore compositivo — G Dorian Berlin Techno 128bpm con velocity sweep bass, 7-slot presence [KICK, HAT, DRONE, BASS, CHORD, VOICE, RIDE]
- **Phase bridge**: ogni composer emette `setEnginePhase()` ad ogni transizione di fase; il director legge `getEnginePhase()` per evoluzione visiva reattiva alla fase musicale corrente
- **Phase-driven visual evolution** in `director.js`: parametri visivi (densityCap, cameraSpeed, palette intensity) evolvono in base alla fase del composer attivo
- **MIDI Clock lookahead scheduling** (`midi.js`): pre-scheduling tick con hardware timestamps — il driver MIDI li invia con precisione hardware, eliminando jitter/drift dal main thread
- **MIDI Clock worker** (`midi-clock.worker.js`): worker dedicato per timing sub-millisecondo del clock 24ppqn
- **Hardware-timed note-off**: `sendMIDINote()` usa `performance.now() + durationMs` per note-off con precisione hardware
- **Dissoluzione transition** in DERIVA (`composer3.js`): sistema di transizione continuo con grainRhythmicity e droneGlideProgress — presagio/infiltrazione/takeover/residuo senza note discrete di rupture

### Corretto (Bug fix)
- **PRIMARY_CH troppo restrittivo** (`presence-multiplier.js`): ogni motore aveva solo 3 canali primari ma ne usa 5-7 — durante i crossfade il channel gating bloccava la maggior parte degli strumenti. Espanso a tutti i canali effettivamente usati da ogni motore
- **`ruptureProgress` undefined** in `composer2.js`, `composer4.js`, `composer6.js`: variabile mai dichiarata, il hard cut nel takeover non scattava mai. Corretto con `arcProgress`
- **SOLCO assente dal sequencer** (`sequencer.js`): `primaryEngine()` e `activeEngineCount()` non includevano 'solco' — il motore era invisibile al display e al conteggio
- **Presence multiplier non azzerato** (`main.js`): durante toggle manuale dei motori, i pm delle engine inattive non venivano azzerati — canali fantasma persistenti
- **Canali SOLCO silenziosi**: presence levels troppo bassi in `composer7.js` — aumentati per garantire output su tutti i canali verso Ableton

### Modificato
- **MECCANICA** (`config.js`): allineamento armonico a C# Dorian (era disallineato)
- **MIDI output**: note-off schedulato via hardware timestamp invece di setTimeout — elimina drift su main thread carico
- **MIDI clock**: algoritmo assoluto con catch-up istantaneo (niente drift cumulativo)
- `midi-patterns.js`: supporto visivo per canali aggiuntivi

---

## [v2.0.0] – 2026-03-25

**Concerto narrativo a 5 atti — struttura drammaturgica completa per performance 40 minuti.**

### Aggiunto
- **Sequencer v3**: struttura a 5 atti (EMERGENZA / DISCESA / MACCHINA / VORTICE / RITORNO) con sovrapposizione multi-motore simultanea
- **Presence multiplier system** (`presence-multiplier.js`): ogni motore ha un coefficiente 0→1 che modula la generazione musicale senza spegnere il motore — consente crossfade tra motori sovrapposti
- **Channel gating**: tutti i 6 composer rispettano il presence multiplier, scalando velocity e densita delle note MIDI proporzionalmente
- **Momenti-firma**: GELO (min 24 — entita congelate), CONVERGENZA (min 33 — attrazione al centro), INVERSIONE (min 34 — climax globale tutti i motori al massimo), VUOTO TOTALE (min 36 — blackout)
- **Apertura concerto**: emersione quadratica da zero in 120s (`firma.densityCap`), DERIVA attiva a t=30 quando il campo e al ~6% di luminosita
- **Chiusura concerto**: dissoluzione quadratica negli ultimi 90s (da t=2310 a t=2400)
- **Colore progressivo**: colori sbloccati per atto — Atto I monocromo, Atto II +accent1, Atto III +accent2, Atto IV +accent3 solo in climax
- **Climax cromatico reale**: bg palette tinta verso magenta scuro + boost alpha entita (sostituisce overlay debole)
- **Palette engine-specific**: ice (CRISTALLO), abyssal (ABISSO), steel (MECCANICA), ikeda (VORTICE)
- **MIDI colors engine-aware**: palette MIDI dedicate per CRISTALLO (ice blues), VORTICE (bianco/rosso), ABISSO (deep blue/viola), MECCANICA (industrial red)
- **Camera breathing**: oscillazione ritmica zoom/offset sincronizzata al BPM del motore attivo
- **Camera DRIFT**: nuovo shot con shake opzionale per VORTICE
- **Tensione narrativa**: tracking tensione nell'arco del director, modulazione soglie fasi, boost da rupture takeover
- **Impatto e contrasto temporale**: metriche narrative in state.js per variazioni improvvise di intensita
- **Audio input gain**: default aumentato a 5.0× per segnali deboli (regolabile `[` `]`)

### Modificato
- `sequencer.js` riscritto: da lineare 6-motori a struttura 5 atti con cue system (silence/activate/layer/fade_to/camera/firma/end) e transizioni simultanee con ease cubica
- `director.js`: ENGINE_PREFS esteso con camera allow set, breathing, palette engine-dedicated
- `field.js`: densityCap applicato uniformemente a tutta la composizione (ambient + MIDI + entita)
- `colors.js`: desaturazione progressiva per atto, bg tinting in climax, engine MIDI color overrides
- `main.js`: supporto multi-motore simultaneo tramite presence multiplier (non piu mutua esclusione pura)
- `midi-patterns.js`: DERIVA chords size 0.09→0.16 per maggiore visibilita

---

## [v1.7.0] – 2026-03-25

**Qualita musicale avanzata + MIDI Clock reale + debug generale.**

### Aggiunto
- MIDI Clock output 24ppqn: Start (0xFA), Stop (0xFC), Clock tick (0xF8) per sincronizzazione Ableton/DAW
- Auto Start/Stop MIDI clock all'attivazione/disattivazione di un motore
- TERRENO: progressioni accordali fisse per fase (Dm→G→F→Dm), bass patterns sincopati (downbeat/anticipation/half-time/off-beat), swing kick (+20ms su beat pari), memoria motivica nella voce (ripetizione/variazione intervalli)
- MECCANICA: progressioni fisse (C#m→E→F#m→C#m), groove shuffle implementato (±10ms), bass cromatico (root→chromatic→fifth→minor3rd), call-and-response VOICE↔LEAD (LEAD inverte l'intervallo dal root)
- DERIVA: grain convertito da percussione GM a texture pitched (A Lydian registro alto 72-93), LEAD deriva motif dall'accordo corrente, contour rule Narmour sulla voce
- VORTICE: rotazione pattern sfalsata (kick ogni 8 bar, ghost ogni 12, bass ogni 16, micro-loop ogni 10), bass con Gb (b2 Phrygian) e Ab, micro-loop transposition (0-3 gradi scala)
- CRISTALLO: shimmer patterns variabili (up/down/suspend/scatter con rotazione), grain piu denso (ogni 2 beat) con double sparkle occasionale, chord voicings estesi (maj7, add9, add11)
- ABISSO: CH4 chords con pad Bbm/Cb rituali ogni 8 beat, 5 canali presence (bass, drone, voice, grain, chords), bass rituale root→Cb→root→Eb, grain a frequenza variabile (ogni 4→2→1 beat)
- Launcher `launch.sh` su porta 8282

### Fix
- `composer4.js`: `lastPatternBar` non dichiarata causava ReferenceError bloccando l'avvio dell'app

---

## [v1.6.0] – 2026-03-25

**Sequencer autopilot + identita visiva profonda per motore.**

### Aggiunto
- `sequencer.js`: performance automatica ~40 minuti attraverso 6 motori (DERIVA→CRISTALLO→ABISSO→TERRENO→MECCANICA→VORTICE)
- Transizioni inter-motore con mutation storm (4 mutazioni, invert dissolve, chromatic shift, 6 secondi)
- Tasto `0` = start/stop sequencer, `→` = skip al prossimo motore
- Parametri visivi deep per motore in ENGINE_PREFS: shapeScale, trailLength, waveSpeed, flickerSpeed, densityGravity, midiDensityMul
- `field.js`: supporto per parametri engine-level (shape scale, trail length, onset wave speed, flicker speed, density gravity, MIDI density multiplier)
- HUD: display motore attivo nel minimal HUD, stato sequencer con progress bar
- Rimappatura tastiera completa: 1=DERIVA, 2=CRISTALLO, 3=ABISSO, 4=TERRENO, 5=MECCANICA, 6=VORTICE

### Modificato
- `director.js`: ENGINE_PREFS esteso con parametri visivi profondi per tutti e 6 i motori
- `render.js`: display engine name e composer status per tutti e 6 i composers

---

## [v1.5.0] – 2026-03-25

**Tre nuovi motori compositivi (6 totali) + miglioramenti musicali.**

### Aggiunto
- `composer4.js` — VORTICE (F Phrygian, 138 BPM): step sequencer tribale a 16th note resolution, 4 pool pattern kick, 4 ghost, 3 bass, micro-loop poliritmici A(8)+B(5)+C(3) steps
- `composer5.js` — CRISTALLO (Eb Lydian, 54 BPM): ambient cristallino, shimmer arpeggios dal chord, sub-drone ogni 16 beat, pad sustain ×4, grain high register sparkle
- `composer6.js` — ABISSO (Bb Phrygian, 76 BPM): drone rituale root+fifth ogni 12 beat, heartbeat pulse, risalita ottava in rottura
- `config.js`: COMPOSER4, COMPOSER5, COMPOSER6 con fasi, presence, rupture, parametri specifici
- `main.js`: import/toggle/update per tutti e 6 i composers, keyboard 1-6

### Modificato
- `midi-patterns.js`: ENGINE_BEHAVIORS esteso con vortice, cristallo, abisso (identita visiva per canale)
- `director.js`: ENGINE_PREFS per vortice, cristallo, abisso (palette, scene, behaviours)

---

## [v1.4.0] – 2026-03-25

**Identita musicale e visiva distinta per motore.**

### Aggiunto
- `midi-patterns.js`: ENGINE_BEHAVIORS con varianti visive per-engine (TERRENO/MECCANICA/DERIVA), forme/decay/colori distinti per canale per ciascun motore
- `director.js`: ENGINE_PREFS con palette e scene preferenziali per motore attivo, applicazione palette all'attivazione
- TERRENO: BPM portato da 116 a 72 (dub lento)
- MECCANICA: BPM portato da 108 a 98 (techno strutturato)
- DERIVA: tonalita principale cambiata da D Dorian ad A Lydian, PULSE e BASS rimossi dalle presence (ambient beatless), brightness trigger adattivo per VOICE
- `composer3.js`: grain convertito da percussione GM (hihat/claves/side stick) a texture pitched dalla scala corrente

### Modificato
- `render.js`: engine tag passato a sistema visivo, forceInvert per engine override
- `config.js`: aggiornati BPM, tonalita, parametri brightness trigger

---

## [v1.3.0] – 2026-03-24

**Tre motori compositivi autonomi + MIDI unificato a 8 canali.**

### Aggiunto
- `composer.js` — Composer 1 (D Dorian, 116 BPM): EuclideanEngine E(5,16), Markov 2° ordine, 5 fasi GERMOGLIO→PULSAZIONE→DENSITÀ→ROTTURA→DISSOLUZIONE, PresenceManager, RuptureEngine 4 stadi
- `composer2.js` — Composer 2 (C# Dorian, 108 BPM): 4 layer oscillatori sfasati (harmonic/rhythmic/textural/melodic), VoidManager silence ≥40%, director event bus (tension/void/grain_entry/chord_change/rupture_stage/density_peak)
- `composer3.js` — Composer 3 (D Dorian DERIVA, 84 BPM motorik): 8 tracce fedeli alla spec `new/`, GrainEngine percussioni GM (hihat/claves/sideStick/clap/tom), ChordEngine progressioni fisse (Dm→F→Dm→C), MarkovEngine peso ×3 su note accordo, RuptureEngine con note off-scale in presagio (Bb/F#, vel 28)
- `midi-clock.worker.js` — Web Worker clock MIDI: tick preciso anche con Ableton in primo piano (nessun throttling rAF)
- `midi-patterns.js` v1.3: mapping canonico 8 canali (CH0=PULSE CH1=GRAIN CH2=DRONE CH3=BASS CH4=CHORDS CH5=VOICE CH6=LEAD CH7=RUPTURE), rotation automatica pattern ogni 12–20 bar
- Mutua esclusione completa tra i tre composer (tasti `1`, `2`, `3`)
- Gain audio input controllabile live (`è`/`+`, range 0.5–8.0×, visibile in HUD)

### Stack
- ES modules nativi
- Canvas 2D API
- Web Audio API (stereo via BlackHole)
- WebMIDI API + Web Worker clock

---

## [v1.2.0] – 2026-03-23

**Colori puri + forme MIDI per tipo di suono + arco audio-driven.**

### Aggiunto
- 6 fasi arco narrative RMS-driven: SILENCE / BUILDING / ACTIVE / INTENSE / PEAK / DECAY con isteresi configurabile
- Region fillColor: aree delle composizioni con colore tinta (accent1/2/3) anziché solo densità
- Camera narrativa per fase arc: SILENCE→WIDE, BUILDING→MEDIUM, PEAK→MACRO, DECAY→PAN
- 5 canali MIDI distinti per ruolo visivo: KICK, BASS, HARMONY, LEAD, TEXTURE con comportamenti indipendenti
- Forme MIDI per ruolo: pulse (kick), column (bass), band (harmony/chords), trail (voice/lead), scatter (grain)
- Scene MONDRIAN e HORIZON aggiunte

---

## [v1.1.0] – 2026-03-23

**Audio-driven density: spazio negativo reale.**

### Aggiunto
- `densityVoidThreshold`: sotto la soglia → zero assoluto (non rumore, nero puro)
- Compressione non-lineare del campo: `(d - voidThreshold)^1.6`
- `densityFloor` ridotto a 0.01 per consentire veri vuoti
- `densityMax` ampliato a 0.65 per range dinamico più ampio
- Band audio → spazialità: sub/low verso basso del campo, high/air verso alto

---

## [v1.0.0] – 2026-03-23

**Piano narrativo Mondrian.**

### Aggiunto
- 8 scene estetiche con nome: BAYER_CLASSIC, COLORED_GROUND, SPARSE, DENSE, MONOCHROME, NEGATIVE, MONDRIAN, HORIZON
- 8 composizioni rettangolari (spatial density layouts): MONDRIAN_A/B, ISLANDS, COLUMNS, FRAME, ASYMMETRIC, HORIZON
- 7 palette dinamiche con lerp smooth: default, amber, cyan, bw, magenta, warm, cold
- Arco narrativo INTRO→CLIMAX→RELEASE guidato dal Director
- Onset wave: onda di densità radiale che si espande dall'origine dell'onset
- Blend smooth tra scene con transizione per-primitivo

---

## [v0.9.0] – 2026-03-22

**Sinestesia geometrica MIDI.**

### Aggiunto
- `midi-patterns.js`: 5 canali separati con ruolo musicale (KICK/BASS/HARMONY/LEAD/TEXTURE)
- Colori MIDI per canale: amber, deep red, cyan, violet, steel
- Forme geometriche distinte: pulse, column, band, trail, scatter
- `xMode` per canale: pitch (melodico), center (bass), spread (kick), random (texture)
- Zone spaziali per canale: BASS occupa metà inferiore, LEAD metà superiore, HARMONY banda centrale
- Radius audio-linked: CH0 PULSE modulato da velocity, CH1 GRAIN da banda air, CH2 DRONE da sub
- Pattern rotation automatica su base bar

---

## [v0.8.0] – 2026-03-22

**Collegamento audio reale — da sandbox monolitico a ES modules modulari.**

### Aggiunto
- 6 nuovi moduli ES: `config.js`, `dna.js`, `generations.js`, `colors.js`, `director.js`, `field.js`
- Campo halftone con Bayer 8x8 dither completamente modulare
- Zone Voronoi (8 seed random) con lookup pre-baked 24×24 per performance
- 8 primitivi strutturali: BANDA, BLOCCO, VETTORE, VUOTO, FRONTE, SCIAME, STRISCIA, MATRICE
- Generazioni con ciclo vita completo e spatial hash grid (32px)
- Sistema cromatico A/B/C con climax, inversione dissolve Bayer, shift cromatici
- 5 mutazioni pesate + regista con timing adattivo
- Camera 2D: WIDE/MEDIUM/MACRO/PAN con POI tracking e lerp adattivo
- Dual HUD: minimal (bottom-left, default ON) + debug (bottom-right, toggle D)
- Keyboard: H=HUD, D=debug, F=fullscreen, R=regen DNA, N=mutazione manuale

### Modificato
- `render.js` riscritto come orchestratore di tutti i sottosistemi
- `main.js` riscritto: boot → initAudio → initMIDI → generateDNA → initDirector → loop
- `index.html` riscritto: fullscreen canvas, start screen, error screen, keys hint

### Stack
- ES modules nativi (nessun build step, nessuna dipendenza)
- Canvas 2D API
- Web Audio API (stereo via BlackHole)
- WebMIDI API

---

## [v0.7.0] – 2026-03-22

**Il Direttore — camera 2D con 4 shot, lerp adattivo, POI tracking, integrazione regista.**

### Aggiunto
- Camera 2D: 4 shot (WIDE, MEDIUM, MACRO, PAN) come trasformazione del canvas context
- Point of Interest (POI): centro di massa delle entità vive, usato come target per MEDIUM e MACRO
- MACRO auto-return: dopo ~5s ritorna automaticamente allo shot appropriato
- Lerp adattivo: rhythmicity > 0.5 → transizione rapida (0.08), altrimenti lenta (0.02)
- PAN con oscillazione verticale sinusoidale
- Auto-camera integrata col regista: 60% solo mutazione, 25% mutazione+camera, 15% solo camera
- Scelta shot intelligente: intensity bassa → WIDE, rhythmicity alta → MACRO, plateau → PAN, default → MEDIUM
- 4 pulsanti camera manuali nel pannello (disattivano auto-camera)
- Toggle AUTO camera (default ON)
- Readout: shot corrente, zoom, offset, timer ritorno MACRO

### Modificato
- Framing completamente riscritto con POI tracking e logica decisionale
- Director ora include decisioni camera nelle mutazioni

### Stack
- HTML + JavaScript vanilla (file unico, nessuna dipendenza)
- Canvas 2D API

---

## [v0.6.0] – 2026-03-22

**Sistema cromatico A/B/C integrato nel campo, 5 tipi di mutazione, regista adattato.**

### Aggiunto
- Colore A (#FF4400): entità nate da onset, decadono a grigio con l'età
- Colore B (#00AACC): entità nate da MIDI, stessa logica di decay
- Colore C (#E6007E): climax — tutte le entità virano a magenta dopo 3s a intensity > 0.85
- Contaminazione A su B: onset vicino a entità B le fa virare verso A
- Climax reworked: shift graduale colore, dot-size compression, density boost, collasso al rilascio
- 5 mutazioni pesate: PRIMITIVE (30%), INVERT (15%), RESET_PARTIAL (15%), CHROMATIC (25%), SCALE (15%)
- Inversione con dissolve Bayer (~1s transizione cella per cella)
- Reset parziale: kill zone rettangolare random
- Shift cromatico: all-A / all-B / grey per 20s
- Cambio scala: modifica range dot-size (fine o coarse)
- Toggle colore A/B/C nel pannello
- Pulsanti manuali per forzare ogni mutazione
- Log ultime 5 mutazioni con timestamp
- Readout: contatori entità A/B/C, stato chromatic shift, climax progress %

### Modificato
- Render loop color-aware: ogni dot renderizzato nel colore dell'entità più giovane nella cella
- Entity grid ora traccia colore dominante + alpha per cella (youngest wins)
- Climax non è più overlay — è proprietà delle entità stesse

### Stack
- HTML + JavaScript vanilla (file unico, nessuna dipendenza)
- Canvas 2D API

---

## [v0.5.0] – 2026-03-22

**DNA di sessione, 8 primitivi strutturali, generazioni con ciclo vita e accumulo.**

### Aggiunto
- DNA di sessione: all'avvio genera 2-3 primitivi random con parametri unici
- Pulsante REGEN DNA per rigenerare il mondo
- 6 nuovi primitivi oltre a BANDA e BLOCCO: VETTORE, VUOTO, FRONTE, SCIAME, STRISCIA, MATRICE
- Generazioni complete: nascita → crescita → maturità → invecchiamento → morte → fossile
- Spatial hash grid (32px) per densità entità efficiente
- Entity lifecycle: dot-size degenera con l'età, densità cala in invecchiamento
- Residui fossili delle generazioni morte (densità ~0.03 per qualche secondo)
- Accumulo: generazioni si sovrappongono (giovani sopra, vecchie sotto)
- Slider EVO per velocità evoluzione
- Readout: DNA primitives, entity count, fossils, avg age, birth rate
- Densità campo legata a intensity con curva quadratica (campo vuoto a intensity 0)

### Modificato
- Regista: mutazioni PRIMITIVE swap, FRAMING, INVERT, RESET (non cambio scene)
- densityBase a 0: i dot emergono gradualmente con l'intensity

### Stack
- HTML + JavaScript vanilla (file unico, nessuna dipendenza)
- Canvas 2D API

---

## [v0.4.0] – 2026-03-21

**Campo halftone con dither Bayer, dot-size dinamico, primitivi BANDA e BLOCCO.**

### Aggiunto
- Campo di densità renderizzato con matrice Bayer 8x8
- Dot-size dinamico (1-16px) guidato da brightness (centroid simulato)
- Densità base modulata da intensity
- Primitivo BANDA: zona rettangolare di alta densità, bordi netti, si muove e pulsa
- Primitivo BLOCCO: rettangolo con dot-size diverso dal campo, ciclo vita con fade in/out
- Onset come onda di densità (non flash sovrapposto): si propaga dal campo stesso
- MIDI come colonna verticale di densità alta a posizione random
- Distribuzione spaziale da stereo width (centro vs uniforme)
- Trajectory come gradiente verticale di densità
- Brightness: modula dot-size E densità del campo (suono brillante = più visibile)
- Rhythmicity: velocità bande, ciclo blocchi, flicker pulsante del campo
- Inversione bianco/nero (toggle + regista)
- Slider DOT override manuale per testing
- Doppia strategia render: fillRect (dot >= 6px) e buffer+scale (dot < 6px)
- Readout: dot-size, densità media, contatori elementi

### Modificato
- Sostituita scena particelle v0.3.0 con campo halftone
- Regista ora include INVERT tra i tipi di cambio

### Stack
- HTML + JavaScript vanilla (file unico, nessuna dipendenza)
- Canvas 2D API

---

## [v0.3.0] – 2026-03-21

**Sandbox narrativo con regista, scene, framing, simulazione input.**

### Aggiunto
- `sandbox.html` — strumento di design self-contained per progettare il comportamento del sistema
- Pannello di controllo con slider per i 5 valori dello Stato (intensity, rhythmicity, brightness, trajectory, stereo width)
- Pulsanti ONSET (spazio) e MIDI NOTE (M) per simulare eventi
- 3 preset rapidi: AMBIENT, BUILDING, PEAK
- Logica del Regista: timer, probabilità di cambio scena, plateau detection
- Tipi di cambio: TEXTURE, FRAMING, COLOR, RESET
- Scena di test: campo di punti con dither Bayer 8x8
  - Numero particelle proporzionale a intensity (20–300)
  - Velocità proporzionale a rhythmicity
  - Luminosità grigi mappata da brightness
  - Dispersione orizzontale da stereo width
  - Moto direzionale da trajectory (+1 su, -1 giù, 0 browniano)
- Onset flash: rettangoli concentrici in colore A (#FF4400)
- MIDI flash: linea verticale + quadrato in colore B (#00AACC)
- Dither overlay Bayer 8x8 (intensità inversamente proporzionale a brightness)
- Climax: flood colore C (#E6007E) dopo 3s di intensity > 0.85
- Framing: WIDE, MEDIUM (1.5x), MACRO (3x), PAN (drift laterale)
- Readout in tempo reale: scene, timer, probabilità, framing, stato colori
- Slider configurabili del Regista: base interval, rhythmic divisor, random factor
- Modo AUTO: guida automatica degli slider attraverso fasi (silence → ambient → building → peak → climax → decay)

### Stack
- HTML + JavaScript vanilla (file unico, nessuna dipendenza)
- Canvas 2D API

---

## [v0.2.0] – 2026-03-21

**Audio engine stereo con spectral flux, band-split, ES modules.**

### Aggiunto
- Input stereo da BlackHole via `ChannelSplitterNode` + 2x `AnalyserNode`
- RMS per canale (L/R) e combinato
- Band-split energy su 5 bande (sub/low/mid/high/air) per canale
- Spectral centroid normalizzato (brillantezza)
- Spectral flux con onset detection a soglia adattiva (sostituisce soglia statica v0.1.0)
- Correlazione stereo e differenza energia L/R
- Energy trajectory su finestra scorrevole (~3 sec): salendo/stabile/calando
- Stima BPM da intervalli mediani degli onset
- Stato narrativo: 5 valori derivati (intensity, rhythmicity, brightness, trajectory, stereoWidth)
- MIDI engine migliorato: note density, pitch range, CC tracking, canale MIDI
- HUD debug verbose con tutti i nuovi dati (barre visive per RMS, bande, centroid, stereo)

### Modificato
- Struttura a ES modules (`src/` con config, audio, midi, state, render, main)
- `index.html` ridotto a solo HTML + CSS + `<script type="module">`
- Onset flash ora guidato da spectral flux invece che da soglia energia statica
- Spettrogramma usa FFT del canale L

### Stack
- ES modules nativi (nessun build step)
- Canvas 2D API
- Web Audio API (stereo)
- WebMIDI API

---

## [pre-prod] – 2026-03-21

**Fase di design e pre-produzione.**

### Definito
- Concept visivo: "CAMPO" — organismo di dati con memoria
- Sistema cromatico: grigi digitali + A `#FF4400` / B `#00AACC` / C `#E6007E`
- Vocabolario texture: dither Bayer, linee topografiche, character grid, scanline, block color, glitch
- Architettura a due livelli: IL MONDO (ecosistema particelle) + IL DIRETTORE (sistema camera)
- Stack confermato: Three.js (WebGL) da v0.2.0 in poi
- Riferimenti visivi analizzati (Ikeda, Anadol, C. Sun Kim, Brian Foo, Vermeulen)
- Pinterest board: https://it.pinterest.com/tweeedo/machne/

### Aggiunto
- `DESIGN.md` — documento di riferimento estetico e architetturale
- `docs/moodboard.html` — moodboard interattivo v0.2 con sistema 3 colori
- `docs/refs/` — immagini di riferimento visivo

---

## [v0.1.0] – 2026-03-21

**Prima versione funzionante.**

### Aggiunto
- Analisi audio real-time via Web Audio API (FFT 2048, smoothing 0.82)
- Visualizzazione "Spectral Strata": 80 linee orizzontali sovrapposte (stile Joy Division)
  - ogni linea = frame storico dello spettro FFT
  - X = frequenza, Y = ampiezza del bin
  - le linee più recenti sono in basso e più luminose
- Onset detection (energia low-mid, soglia adattiva)
  - trigger: flash di rettangoli concentrici al centro
- Input MIDI via WebMIDI API
  - Note On → linea verticale + quadrato, posizione mappata sulla nota
  - stato connessione nel HUD
- HUD minimale: ampiezza %, picco Hz, stato MIDI, ultimo note/onset
- Schermata di avvio con click-to-begin
- `start.sh`: launcher locale (Python HTTP server su porta 8181)

### Stack
- HTML + JavaScript vanilla (nessuna libreria, nessun build step)
- Canvas 2D API
- Web Audio API
- WebMIDI API

---

<!-- Template per versioni future:

## [vX.Y.Z] – YYYY-MM-DD

### Aggiunto
- ...

### Modificato
- ...

### Rimosso
- ...

### Fix
- ...

-->
