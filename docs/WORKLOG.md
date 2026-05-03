# WORKLOG — MACH:INE III

> Append-only journal. Una entry per sessione. Più recente in cima.
> **Regola d'oro:** mai modificare entry passate. Se serve correggere, append nuova entry.
> **Format:** data + obiettivo + fatto + file + decisioni + prossimo.

---

## 2026-04-25 (sessione 32, parte 5) — Errore di processo: sistema SC parallelo creato per errore

### Obiettivo (dichiarato)
Utente: "con la skill di supercollider saresti in grado di creare tutti gli strumenti
per il sistema?". Richiesta esplorativa per orchestra SC opzionale.

### Errore commesso
**Non ho letto `STATUS.md` né l'ultima entry di `WORKLOG.md` all'inizio della sessione**
(violazione del protocollo START in `CLAUDE.md`). Conseguenza: ho costruito un sistema
SC ex-novo ignorando che le parti 1-4 della stessa giornata avevano già implementato +
audited un SC engine completo (v3.20.0-rc3, commit 58b262e):

- `app/sc/` — 11 SynthDef + biome-presets + machine-engine
- `app/src/sc-out.js` — bridge WS operativo (porta 9877)
- `app/bridge/machine-sc-bridge.js`
- 10 ruoli × 7 biomi, in attesa di calibrazione live

### Cosa ho prodotto (tutto ridondante)
Sistema parallelo via IAC Driver MIDI — strutturalmente peggiore di quello esistente:
WS/OSC è più veloce e non limitato al payload 7-bit dei CC.

- **Nuovo (fuori repo):** `/Users/Edo_1/MACH-INE II/machine-orchestra/` — boot.scd,
  presets.scd, router.scd, synthdefs.scd, start.sh.
- **Modificati nel repo (non commitati):**
  - `app/src/orchestra-out.js` — riscritto con API semantica `setRoleParam`/`setRoleTimbre`.
  - `app/src/config.js` — aggiunto blocco `CFG.ORCHESTRA` (duplicato di `CFG.SC_ENABLED`).
  - `app/src/director3.js` — import + chiamate `sendOrchestraTrack/Phase` (duplicate di
    hook già presenti per sc-out).

### Pulizia suggerita per la prossima sessione
```bash
cd "/Users/Edo_1/MACH-INE II/app"
git restore src/orchestra-out.js src/config.js src/director3.js
rm -rf "/Users/Edo_1/MACH-INE II/machine-orchestra"
```
Verificare poi che `git diff` torni vuoto e che `app/sc/` + `sc-out.js` restino intatti.

### Lavoro collaterale utile (non da rollbackare)
- **Analisi `/Users/Edo_1/album-gen/`** confermata vs memoria: branch `m1b-real-composers`
  ancora non mergiato, 16/16 test verdi, 10812 eventi, smoke test M1b ancora pendente.
  Raccomandazione: smoke test prima di M1c (semantic SynthDef port). Niente committato.

### File toccati nel repo
Tutto in working tree, niente in stage. Solo questa entry WORKLOG va in commit.

### Decisioni prese
Nessuna architetturale. Errore di processo.

### Prossima sessione — punto di ripartenza
1. **Eseguire la pulizia sopra.**
2. Riprendere da P0 di `STATUS.md`: calibrazione live SC v3.20.0-rc3 (smoke test
   bioma morphing, levels relativi su TEMPESTA).
3. Lezione promossa: leggere SEMPRE `STATUS.md` + ultima `WORKLOG` entry prima di
   proporre lavoro, anche per task "esplorativi".

---

## 2026-04-25 (sessione 32, parte 4) — Audit fix architetturali (commit 58b262e)

### Obiettivo
Utente: "fai un check generale che tutto funzioni, non sentivo drum. manca ancora qualcosa
nel sistema?". Audit completo del sistema SC + identificazione gap reali.

### Diagnosi
**"Non sentivo drum"**: probabile causa = test in NEBBIA (preset kick/hat/snare/conga
amp:0 by design, ambient). SOLCO/MACCHINA/TEMPESTA hanno drum udibili.

**Audit identifica 4 gap reali:**
1. **Phase curve NON applicata ai one-shot**: il drone scala amp con phase (germoglio
   ×0.30, densità ×1.0) ma kick/bass/voice/lead/arp/hat/snare/conga colpiscono sempre
   a piena ampiezza → asimmetria sonora.
2. **Niente master limiter**: stack TEMPESTA densità (10 voci simultanee) può clippare.
3. **Nessun diagnostic test**: validazione dei 10 ruoli solo nota-per-nota manuale.
4. **Nessun log OSC ricezione**: difficile capire se le chiamate arrivano davvero.

### Fatto
1. **Phase scale sui one-shot** (`machine-engine.scd`): l'OSCdef note handler ora legge
   `~phaseCurves[currentPhase][\amp]` e moltiplica `msgAmp` per quello scale prima di
   instanziare il Synth. Coerenza fade in/out fra drone sustained e ruoli one-shot.
2. **Master limiter** (`machine-engine.scd`): SynthDef `\machineLimiter` pass-through
   su bus 0, instanziato `Synth.tail(s, ...)`. `Limiter.ar(sig, 0.95, 0.005)` +
   `ReplaceOut.ar(out, sig)`. Anti-clipping per stack denso.
3. **`__sc.testSuite('BIOMA')`** (`sc-out.js`): round automatico 10 ruoli con freq
   sensate (kick 50, bass 110, chord 220, voice 440, lead 660, arp 523, hat 9000,
   openhat 8000, snare 180, conga 130), gap 700ms tra ruoli, log per ogni triggered.
4. **Verbose log OSC** (`machine-engine.scd`): se `~scVerbose == true`, log
   `[SC] kick freq=50 amp=0.40 bioma=SOLCO` per ogni nota one-shot. Default false.

### File toccati
- **Modificati:** `app/sc/machine-engine.scd` (+15 LOC: limiter SynthDef + tail
  instantiation + phase scale fix + verbose log), `app/src/sc-out.js` (+30 LOC:
  testSuite async function).

### Decisioni prese
Vedi `DECISIONS.md` #036.

### Punto di ripartenza — sessione successiva (dedicata sound design)

Utente esplicito: "faremo sessione dedicata ad affinare il sound design".

**Workflow atteso:**
1. Test prelimnare: `machine-all.command` + `__sc.testSuite('SOLCO')` → kick/snare/hat
   udibili? livelli relativi OK?
2. Suite completa Shift+1..7: ascoltare i 7 biomi, identificare cosa funziona/non
   funziona ad orecchio.
3. Tuning preset bioma per ruolo (10 × 7 punti calibrabili).
4. **Audio-reactive lato SC** (livello 3 evoluzione mai implementato): drone cutoff
   respira con audio.rms, bass drive cresce con audio.onset, ecc. Browser invia
   `/audio/energy <rms> <onset>` throttled 50ms, SC handler aggiorna parametri su Lag breve.
5. Eventuale **HUD SC in browser**: indicatore connection + bioma + phase + ruoli attivi.
6. **Sound-lab** (file aperto utente: `/Users/Edo_1/sound-lab/.../spec.md`): valutare
   environment isolato per affinare i synth prima di portarli in MACH:INE III.

### Bug/warning aperti
- ⚠️ Voice formant range 0.3-0.6 da affinare ad orecchio.
- ⚠️ TEMPESTA bass drive 0.7 + drone drive 0.6 = saturation cumulata; master limiter
  ora salva da clipping ma il timbro rimane "carico" — calibrazione attesa.
- ⚠️ Drum kit HPF/BPF freq tarate a tavolino (hat 7000/9000, openhat 6500/8000,
  snare 3500): tunabili in preset bioma per timbro per traccia.
- ⚠️ Snare body SinOsc 180Hz fissato (non scala con freq): semantica voluta.
- ⚠️ Audio-reactive non implementato: il sistema "evolve" solo per cambi bioma/phase
  discreti, non in continuo con il flusso audio. Da fare in sessione dedicata.

---

## 2026-04-25 (sessione 32, parte 3) — Wave C SC: voice + lead + arp + perc (v3.20.0-rc3)

### Obiettivo
Chiudere la suite SC. Dopo Wave A+B (drone + kick/bass/chord) restavano voice/lead/arp/perc
da implementare per copertura totale degli 8 ch MIDI. Utente: "procedi wave c poi calibriamo
insieme".

### Fatto

**7 nuovi SynthDef:**
- `app/sc/synths/voice.scd` — body LFTri + Pulse 1.005 → BPF formant filter (1.5×freq +
  formant offset) + BPF breath noise. Vibrato modula freq con SinOsc.kr. ASR envelope.
- `app/sc/synths/lead.scd` — Saw + Pulse 1.003 → RLPF → tanh drive → ADSR
  (attack/decay/sustain/release). Drive variabile (TEMPESTA distorto vs RESPIRO pulito).
- `app/sc/synths/arp.scd` — Tri+Saw → RLPF → Env.perc(attack, dur+release). Attack stretto
  per default (0.005), release modulabile per bioma.
- `app/sc/synths/hat.scd` — HPF 7000 + BPF 9000 noise + Env.perc decay 0.05.
- `app/sc/synths/openhat.scd` — HPF 6500 + BPF 8000 + decay 0.25 (più caldo, più lungo).
- `app/sc/synths/snare.scd` — SinOsc 180Hz body env perc 0.08 + BPF 3500 noise env perc
  variabile + tanh + outer killEnv (cleanup pulito senza clic finale).
- `app/sc/synths/conga.scd` — SinOsc con pitch sweep esp. (sweepFactor variabile per traccia).

**Perc multiplex (ch 1):** `_percRoleFromNote(note)` in midi.js. Convenzione GM da rhythm.js:
- 38 → snare
- 42 → openhat
- 41/45/48 → conga
- default (36/46/...) → hat closed

**SC_ROLE_BY_CH aggiornato:**
```js
['kick', '_perc', null, 'bass', 'chord', 'voice', 'lead', 'arp']
```
'_perc' sentinel triggera la lookup per note number. ch 2 drone null (biome morphing).

**Preset bioma esteso (7 biomi × 10 ruoli):**
- voice: NEBBIA fragile (vibrato 4Hz depth 0.005, breath 0.15, attack 0.3, release 1.0),
  TESSUTO amp:0, SOLCO naturale, RESPIRO cantabile, MACCHINA meccanica (vibrato 6Hz depth
  0.005, attack 0.005), TEMPESTA espressiva (vibrato 6Hz depth 0.015), RITORNO esposta.
- lead: NEBBIA eco (drive 0.05), TESSUTO solo (drive 0.1), SOLCO amp:0, RESPIRO eco pulito
  (drive 0), MACCHINA response (drive 0.3, decay 0.10), TEMPESTA hocket distorto (drive 0.6),
  RITORNO eco soft (drive 0.05, attack 0.1).
- arp: SOLCO accompany, MACCHINA protagonist (mixSaw 0.8, cutoff 2000, release 0.08 secco),
  TEMPESTA texture, RITORNO dying (cutoff 1000); NEBBIA/TESSUTO/RESPIRO amp:0.
- hat/openhat/snare/conga: per bioma con decay/bpFreq specifici. SOLCO no snare (dub).
  Conga solo TEMPESTA. MACCHINA no openhat (16th pieni closed).

**Engine OSC handler attivo** per tutti i 10 ruoli (era stub per voice/lead/arp/perc).
Pattern uniforme preset-merge-Synth.

**Bump versione:** v3.20.0-rc2 → v3.20.0-rc3.

### File toccati
- **Nuovi (7):** `app/sc/synths/voice.scd`, `lead.scd`, `arp.scd`, `hat.scd`, `openhat.scd`,
  `snare.scd`, `conga.scd`.
- **Riscritti:** `app/sc/biome-presets.scd` (7 biomi × 10 ruoli, ~170 LOC).
- **Modificati:** `app/sc/machine-engine.scd` (+5 LOC: carica 7 synth + handler unificato),
  `app/src/midi.js` (+15 LOC: SC_ROLE_BY_CH completo + _percRoleFromNote),
  `app/src/VERSION.js` → v3.20.0-rc3.

### Decisioni prese
Vedi `DECISIONS.md` #035.

### Prossima sessione — punto di ripartenza

**CALIBRAZIONE LIVE INSIEME** — utente aspetta a co-calibrare. Punti che probabilmente
emergeranno (top-down per criticità):

1. **Levels relativi**: stack TEMPESTA densità (drone+kick+bass+chord+voice+lead+hat+
   conga simultanei) può clippare. Possibili leve:
   - Master multiplier: oggi `* amp` finale per Synth, posso aggiungere `~masterGain` su
     bus group SC per attenuare globale.
   - Bias amp×0.6 in midi.js → 0.45 se troppo forte, 0.75 se troppo debole.
   - Per-role amp scale nel preset (es. drone amp curve già 0.5×phaseCurve).
2. **Voice formant**: range 0.3-0.6 calibrato a tavolino. Ad orecchio può suonare "gracile"
   o "metallic". Calibrare per traccia.
3. **TEMPESTA bass drive 0.7 + drone drive 0.6**: saturation cumulata. Possibile riduzione
   bass drive 0.5 o drone 0.4.
4. **Hat noise**: HPF/BPF freq tarate "a sensazione". Possibile fine-tune per timbro
   (MACCHINA più metallico, SOLCO più caldo).
5. **Snare body 180Hz fissato**: non scala con freq. Se note MIDI snare cambia (rare ma
   possibile), il pitch resta. Da decidere se mantenere fisso (snare ha pitch caratteristico)
   o leggere freq.
6. **Conga sweep**: TEMPESTA usa note 48 → 130Hz default. Verificare attacco e tail.
7. **Voice TEMPESTA hocket** (voice + lead alternati): test critico — i due ruoli devono
   suonare "una voce sola" non due strumenti diversi.

### Bug/warning aperti

- ⚠️ Suite SC non testata live (10 ruoli × 7 biomi = 70 combinazioni timbriche da validare).
- ⚠️ Possibile clipping su stack TEMPESTA densità — soluzione master limiter SC se serve.
- ⚠️ Voice ha BPF dependent on freq (1.5×freq + formant). Per note alte il BPF può
  superare Nyquist. Già clippato a 6000 max ma verificare comportamento su lead range.

---

## 2026-04-25 (sessione 32, parte 2) — Drone enrichment + Wave B SC (v3.20.0-rc2)

### Obiettivo
Smoke test rc1: utente sente audio ma "synth molto semplici". Diagnosi: in Wave A solo
drone CH2 va a SC, gli altri ch via MIDI esterno (silenti se non c'è DAW/IAC routing).
Plus: drone single-layer manca movimento. Soluzione: drone enrichment + Wave B con
kick/bass/chord SynthDef one-shot.

### Fatto

**Bug fix preliminari (commit 03391f6):**
- Bug critico in `machine-engine.scd`: `^nil` early return dentro Function block causava
  ReturnException → applyDronePhase silenziava drone. Refactor con nested if + log diagnostico.
- Cleanup orphan: `pkill scsynth + sclang` esplicito in launcher (sclang esce senza s.quit
  → scsynth resta orphan e continua a suonare).
- Debug: `window.__sc` esposto su browser per test manuali da console.

**Drone enrichment (commit pendente):**
- 5 nuovi parametri al SynthDef: subAmp (sub-octave SinOsc -12 sem), shimmerAmp (octave-up
  SinOsc +12 modulato da LFO 0.4-1.0), shimmerRate (Hz), filterLfoRate (Hz), filterLfoAmount.
  Tutti su Lag3.
- biome-presets.scd: ogni bioma ha valori specifici. NEBBIA shimmer 0.4 + sub 0.2 (scintille
  ambient), RESPIRO shimmer 0.5 + filter LFO 0.30 (apertura lenta), TEMPESTA sub 0.6 +
  shimmer 0.3 (drammatico), SOLCO sub 0.5 (dub heavy), RITORNO sub 0.3 + shimmer 0.5
  (lavanda con luce alta), MACCHINA sub 0.4 no LFO (rigido), TESSUTO sub 0.3.

**Wave B — kick + bass + chord:**
- `app/sc/synths/kick.scd` — body SinOsc con pitch sweep esponenziale (freq×sweepFactor →
  freq, sweepTime 40ms) + HPF noise click + tanh saturation. Param per traccia: click amount,
  decay length, sweepFactor.
- `app/sc/synths/bass.scd` — Pulse(freq, 0.4) + SinOsc(freq×0.5) sub → RLPF → tanh.
  Param: cutoff, drive, mixSub/mixPulse, decay, q.
- `app/sc/synths/chord.scd` — Tri+Saw a coppie detuneate (±7 cents) → RLPF → ASR envelope.
  Param: mixTri/mixSaw, cutoff, attack, release, detuneCents.
- `biome-presets.scd`: 7 biomi × 4 ruoli (drone/kick/bass/chord). NEBBIA/RESPIRO kick:amp=0
  (silenziati). Bass per traccia: SOLCO sub-bass dub (cutoff 400, drive 0.3, mixSub 0.7),
  MACCHINA pump (cutoff 1200, drive 0.4), TEMPESTA reese (cutoff 1500, drive 0.7), ecc.
- `machine-engine.scd`: carica i 3 nuovi synth, OSC handler `/synth/<role>/note` ora attivo
  (era stub). Pattern: legge `~biomePresets[currentBiome][role]`, merga con freq/amp/dur
  dal browser, instanzia `Synth(role, args)`. Se preset ha `\amp:0` → skip (silenziato).
- `app/src/midi.js`: import `sendSCNote` da sc-out. Mappatura `SC_ROLE_BY_CH = ['kick',
  null, null, 'bass', 'chord', null, null, null]`. In `sendMIDINote()` dopo MIDI send,
  conversione note→Hz + vel→amp (×0.6 max anti-clipping) + durationMs→s, chiamata
  `sendSCNote(role, freq, amp, dur)`. Drum ch 1 e melodic ch 5/6/7 → null (Wave C).

**Bump versione:** v3.20.0-rc1 → v3.20.0-rc2.

### File toccati
- **Modificati:** `app/sc/synths/drone.scd` (+25 LOC: enrichment params + sub/shimmer/filterLfo),
  `app/sc/biome-presets.scd` (riscritto: 7×4 ruoli), `app/sc/machine-engine.scd` (+30 LOC:
  carica synth + OSC handler note attivo), `app/src/midi.js` (+15 LOC: SC hook),
  `app/src/VERSION.js` → v3.20.0-rc2.
- **Nuovi:** `app/sc/synths/kick.scd`, `app/sc/synths/bass.scd`, `app/sc/synths/chord.scd`.

### Decisioni prese
Vedi `DECISIONS.md` #034.

### Prossima sessione — punto di ripartenza
1. **Test live v3.20.0-rc2**: ripartire `machine-all.command`, ascoltare:
   - Drone più ricco (sub + shimmer + slow filter LFO percepibili)
   - Kick / bass / chord via SC con timbro per bioma (SOLCO dub vs MACCHINA pump vs
     TEMPESTA reese — distinguibili?)
   - Levels: nessun clipping su stack chord 4-note + bass + kick + drone simultanei
   - Test manuale da console: `__sc.sendSCBiome('SOLCO')` + simula nota:
     `__sc.sendSCNote('bass', 110, 0.5, 0.4)` (110Hz = A2)
2. **Wave C** (post-test): voice + lead + arp + perc SynthDef.
   - voice: formant + vibrato + breath (NEBBIA "voce sintetica" / RITORNO "esposto")
   - lead: melodic con drive variabile (TEMPESTA distorto / RESPIRO pulito)
   - arp: attack stretto + release modulabile (MACCHINA denso / RITORNO morente)
   - perc: multiplex per nota MIDI (hat=36, snare=38, openHat=42, conga=48...)
3. **Calibrazione live**: livelli relativi drone vs ruoli one-shot, EQ, master limiter.

### Bug/warning aperti
- ⚠️ Wave B non testato live (richiede sc-launch attivo). Smoke test al primo run.
- ⚠️ amp×0.6 max sul vel/127 mapping potrebbe essere troppo basso per voice live —
  calibrare. O troppo alto su stack 4-note chord — verificare.
- ⚠️ Drone enrichment shimmer su NEBBIA/RESPIRO: se troppo "celestiale" rispetto al
  carattere ambient minimal, scalare 0.5→0.3.
- ⚠️ TEMPESTA bass drive 0.7 + drone drive 0.6 = doppia saturation. Verificare clipping.

---

## 2026-04-25 (sessione 32, parte 1) — SC audio engine Wave A: drone biome morphing live (v3.20.0-rc1)

### Obiettivo
Utente richiede sistema audio SuperCollider dedicato a MACH:INE III, mirato e coerente al
progetto (non porting da album-gen). MIDI parallelo. Le lezioni utili torneranno per album-gen.

### Filosofia decisa
"Orchestra ereditaria del bioma" — 8 SynthDef-base parametrizzati fortemente, **bioma =
stato persistente del server** con Lag3 18s morphing (modello copiato da Engine_MachineDrone
Norns). Non 56 SynthDef diversi, ma 1 SynthDef per ruolo + tabella preset 7 biomi che
morpha tutti i parametri al cambio.

### Fatto

**Infrastruttura SC:**
- `app/sc/synths/drone.scd` — port di Engine_MachineDrone (Norns) come SynthDef standalone.
- `app/sc/biome-presets.scd` — `~biomePresets[\BIOMA][\drone]` con i 7 timbri MACH (portati
  da machine-drone biomes.lua) + `~phaseCurves` (amp/cutoff/drift/reverb per fase).
- `app/sc/machine-engine.scd` — boot, drone singleton (gate=1, amp=0), OSC handlers
  `/biome/set`, `/phase/set`, `/panic`. Stub `/synth/<role>/note` (Wave B).
- `app/sc/osc-map.md` — contract v0.1 frozen.

**Bridge:**
- `app/bridge/machine-sc-bridge.js` — fork di album-gen/bridge. WS 9877, OSC 57120 sclang,
  UDP listen 57122 (album-gen 57121: no collisione se entrambi attivi).
- `app/bridge/package.json` — deps `osc` + `ws`.

**Hook lato JS:**
- `app/src/sc-out.js` — WS client con auto-reconnect. API setSCEnabled, sendSCBiome,
  sendSCPhase, sendSCNote (stub), panicSC. No-op silenzioso se WS down.
- `app/src/config.js` — nuovo toggle `CFG.SC_ENABLED` (default false).
- `app/src/director3.js` — `sendSCBiome(track)` in `initDirector3()`, `sendSCPhase(name, 0)`
  al cambio fase, `sendSCPhase(name, progress)` throttled 250ms.
- `app/src/main.js` — `panicSC()` dentro Shift+Z.

**Launcher:**
- `app/sc-launch.command` — boot sclang + bridge. NON avvia http (gestito da
  machine-launch.command). Auto npm install. Streaming logs via tail -F.

**Bump versione:** v3.19.0-rc2 → v3.20.0-rc1.

### File toccati
- **Nuovi (10):** `app/sc/synths/drone.scd`, `app/sc/biome-presets.scd`, `app/sc/machine-engine.scd`,
  `app/sc/osc-map.md`, `app/bridge/machine-sc-bridge.js`, `app/bridge/package.json`,
  `app/src/sc-out.js`, `app/sc-launch.command`.
- **Modificati (4):** `app/src/config.js` (+5 LOC), `app/src/director3.js` (+25 LOC),
  `app/src/main.js` (+2 LOC), `app/src/VERSION.js` → v3.20.0-rc1.

### Decisioni prese
Vedi `DECISIONS.md` #033.

### Prossima sessione — punto di ripartenza
1. **Smoke test SC Wave A** (vedi STATUS P0): verifica boot SC + bridge, morphing drone tra
   biomi/fasi, panic, latenza localhost.
2. **Wave B**: aggiungere SynthDef one-shot per kick + bass + chord. Mappare `/synth/<role>/note`
   da stub a Synth(role, [\freq, \amp, \dur]). Estendere biome-presets con preset per ognuno.
3. **Wave C**: voice + lead + arp + perc. Suite completa via SC.
4. **Wave D**: calibrazione live + tuning preset 7 biomi × 8 ruoli.
5. **Lessons → album-gen**: il pattern `state-driven Lag3 morphing` può dare ad album-gen
   l'evoluzione timbrica di brano (oggi nota-per-nota).

### Bug/warning aperti
- ⚠️ SC non testato live in questa sessione (richiede SuperCollider.app installato).
- ⚠️ Drone singleton sempre attivo (gate=1, amp=0 inizialmente). Verificare in smoke test
  che il livello iniziale sia davvero silente (no leak).
- ⚠️ Latenza localhost: contract dichiara <5ms, da verificare al primo run con audio output reale.
- ⚠️ `panicSC()` reinstanzia il synth dopo `freeAll`. Verificare che non glitchi al ripristino
  (gate=1 → segnale parte da zero, dovrebbe essere clean grazie all'env asr).

---

## 2026-04-25 (sessione 31, parte 2) — Wave 1D + 1E: chord ghost phase-aware + hat euclidei (v3.19.0-rc2)

### Obiettivo
Completare Wave 1 dopo rc1 (commit 9cc7883): aggiungere ghost probability phase-aware
sul chord (oggi solo bass-v3 lo aveva) e ritmica euclidea evolutiva sui hat delle tracce
che oggi usano il default sparso (SOLCO, TESSUTO).

### Fatto

**Wave 1D — Chord ghost phase-aware:**
- `composition-toolkit.js`: nuovo helper `phaseGhostScale(phase)` (generalizza pattern
  già usato in bass-v3 ghostFill).
- `harmony.js`: applicato a `chordGridGhostProb` (TESSUTO 0.08, TEMPESTA 0.06). Ghost
  cresce/cala con narrativa anziché costante. Germoglio 0, densità ×1.5, dissoluzione 0.3.

**Wave 1E — Hat euclidei evolutivi:**
- `composition-toolkit.js`: aggiunti `euclidean(K, N)` (Toussaint) e
  `euclideanEvolve(K1, K2, N, progress)` (interpolazione probabilistica fra due densità).
- `tracks.js`: SOLCO + TESSUTO ottengono `hatEuclideanByPhase`.
  - SOLCO: E(2,16)→E(3,16) puls, E(5,16)→E(7,16) densità (tresillo cubano), E(7,16)→E(9,16)
    rott, E(2,16)→E(0,16) dissol.
  - TESSUTO: max E(5,16) rottura, più rado (hat vela senza riempire).
- `rhythm.js`: `_resolveHatPattern(trackDef, phase)` legge `hatEuclideanByPhase` se presente.
  Cache per bar (`_hatEvolved`, `_hatEvolvedBar`, `_hatEvolvedKey`): rigenerato a boundary
  di bar o cambio fase/track. Entro 1 bar il pattern resta stabile.
- MACCHINA / TEMPESTA mantengono `hatPatterns` hardcoded (identità preservata).

**Bump versione:** v3.19.0-rc1 → v3.19.0-rc2.

### File toccati
- **Modificati:** `src/composition-toolkit.js` (+45 LOC: phaseGhostScale + euclidean +
  euclideanEvolve), `src/harmony.js` (+5 LOC: phaseGhostScale su chord ghost),
  `src/rhythm.js` (+30 LOC: _resolveHatPattern + cache + hook), `src/tracks.js`
  (+22 LOC: hatEuclideanByPhase per SOLCO + TESSUTO).
- **Versione:** `src/VERSION.js` → v3.19.0-rc2.
- **Docs:** STATUS.md (sezione novità rc2), WORKLOG (questa entry), DECISIONS #032.

### Decisioni prese
Vedi `DECISIONS.md` #032.

### Prossima sessione — punto di ripartenza
1. **Test live v3.19.0-rc2** completo: soundcheck T + suite breve. Validare:
   - Wave 1A: feel pocket vs laid-back per traccia
   - Wave 1B: arpeggio respira, ciclo armonico ha arco
   - Wave 1C: NEBBIA easeOut carezza, MACCHINA easeIn esplode
   - Wave 1D: chord ghost cresce con phase
   - Wave 1E: SOLCO E(5,16) tresillo dub, TESSUTO hat sparso inquieto
2. Se tutto regge → bump stable v3.19.0 + tag.
3. **Calibrazioni note:**
   - Verifica che SOLCO hat step 0 non collida col kick step 0 — se sì rotare di 1.
   - Verifica che velocityCurve easeIn MACCHINA/TEMPESTA germoglio non sia inudibile.
   - Monitor [CLOCK LAG] — feel push -4ms TEMPESTA + jitter 4ms = floor 3-7ms.
4. **Wave 2** (post-stable): Markov 2° ordine + magnetic notes + heterophony voice/lead.

### Bug/warning aperti (da rc1)
- Tutti i warning di rc1 ancora applicabili (vedi entry sotto).
- ⚠️ rc2: hat E(5,16) e E(7,16) (SOLCO densità) hanno entrambi step 0 attivo — collisione
  con kick step 0 (NEBBIA E2 / SOLCO D2). Timbricamente potrebbe creare un "click" sul
  downbeat. Calibrazione: se fastidioso, rotare hat di +1 step.

---

## 2026-04-25 (sessione 31, parte 1) — Wave 1A-C: feel + curve + arc (v3.19.0-rc1)

### Obiettivo
Utente richiede upgrade musicale: melodie e ritmica meno scontate, più sperimentali —
ma "non solo". Diagnosi sistema attuale (v3.18.0) → 3 punti di prevedibilità, 5 direzioni
proposte (RITMICA / MELODIA / ARMONIA / INTERAZIONE / ESPRESSIONE). Utente approva
piano Wave 1 = ritmica + espressione (basso costo, payoff immediato a soundcheck).

### Fatto

**Toolkit** — nuovo `src/composition-toolkit.js` (sottoinsieme runtime):
`ease`, `velocityCurve`, `humanizeMs`, `breathMultiplier`, `progressionArc`. Importato
dai moduli musicali. Toolkit completo del design-time resta in `.claude/skills/...`.

**Wave 1A — Microtiming feel + jitter sistematico:**
- `tracks.js`: aggiunto `humanize.feel` (ms) per 8 tracce + ENCORE.
  - NEBBIA 0, RESPIRO 0, ENCORE 0 (centrati / no rhythm)
  - SOLCO +5, TESSUTO +6, RITORNO +4 (laid-back per identità)
  - MACCHINA -3, TEMPESTA -4 (push, in pocket)
- `midi.js`: nuovo `setTrackTiming({feel, jitter})` + integrazione in `sendMIDINote`.
  Drum kit (ch 0/1) prende solo il feel sistematico, no jitter (polso rigido).
  Ch espressivi (>=2) ricevono feel + jitter gaussiano via `humanizeMs(sigma)`.
  Clamp scheduler-safe: `t = max(baseT, now+1ms)`.
- `director3.js`: import `setTrackTiming` + chiamata in `initDirector3()` dopo load track.

**Wave 1B — Progression arc + breath multiplier:**
- `harmony.js`: `progressionArc(_chordIdx, chords.length)` applicato a chord rhythmic
  (chordGrid + ghost) + chord sustained. Ciclo armonico ora ha arco dinamico
  (es. 4-chord [0.88, 1.0, 0.96, 0.80]: question→peak→answer→close).
- `melody-v3.js`: `breathMultiplier(_bar, 16)` su arp ostinato. Arp respira ogni 16 bar
  (lift-off 0.78 → full 1.0 → dip 0.55 nelle ultime 2 bar).

**Wave 1C — Velocity curve per traccia:**
- `tracks.js`: nuovo campo `velocityCurve` per ogni traccia:
  - NEBBIA / RESPIRO / RITORNO: `easeOut` (carezza, parte intensa scende dolce)
  - SOLCO / TESSUTO / ENCORE: `easeInOut` (bilanciato)
  - MACCHINA / TEMPESTA: `easeIn` (esponenziale, esplode con la densità)
- `melody-v3.js` + `harmony.js`: pattern `shapedDensity = ease(density, curveType)`
  sostituisce `density` raw nel mapping `vel = base + density * range`. Applicato a
  voice / lead / arp / chord (rhythmic + sustained). Bass non toccato.

**Bump versione:** `VERSION.js` v3.18.0 → v3.19.0-rc1.

### File toccati
- **Nuovo:** `src/composition-toolkit.js` (50 LOC, ES module).
- **Modificati:** `src/midi.js` (+25 LOC: setTrackTiming + applicazione in sendMIDINote),
  `src/tracks.js` (+24 LOC: feel + velocityCurve per 8 tracce), `src/director3.js`
  (+8 LOC: hook setTrackTiming), `src/melody-v3.js` (+15 LOC: shapedDensity voice/lead/arp,
  breath arp), `src/harmony.js` (+12 LOC: arc + shapedDensity chord).
- **Versione:** `src/VERSION.js` → v3.19.0-rc1.

### Decisioni prese
Vedi `DECISIONS.md` #031 — Wave 1 upgrade musicale.

### Prossima sessione — punto di ripartenza
1. **Test live v3.19.0-rc1** (priorità top): soundcheck T per ascoltare il feel pocket
   vs laid-back per traccia. Verificare che TEMPESTA -4ms non sia troppo aggressivo,
   MACCHINA easeIn non renda germoglio impercettibile, NEBBIA easeOut non risulti
   "spenta" in fase germoglio. Calibrazione fine se necessaria.
2. **Wave 1D (rc2 candidato):** ghost probability phase-aware ovunque (oggi solo bass-v3).
   Estendere a melody-v3 (arp/voice/lead) e harmony (chord ghost cresce con phase).
3. **Wave 1E (rc2):** hat/conga euclideo evolutivo per fase (`euclideanEvolve(K1,K2,N,prog)`).
   Layer secondari, kick/bass restano in 4/4.
4. Se Wave 1 regge il soundcheck → bump stable v3.19.0 + tag.
5. **Wave 2** (post-stable): Markov 2° ordine + magnetic notes + heterophony voice/lead
   (cuore della proposta originale). Effort medio, riscrittura mirata di melody-v3.

### Bug/warning aperti (non bloccanti)
- velocityCurve `easeIn` su MACCHINA/TEMPESTA può abbassare TROPPO la velocity in
  fase germoglio (density < 0.3). Se in soundcheck l'arp di MACCHINA germoglio è
  inudibile, scalare exponent in `ease()` da 2 a 1.5 oppure usare `easeInOut`.
- Feel ms TEMPESTA -4ms: è 2× il jitter sigma (4ms). Sotto stress di scheduler il
  totale può schiacciarsi contro il floor di NOTE_LOOKAHEAD_MS (15-12=3ms residui).
  Monitor `[CLOCK LAG]` deve restare sotto 10ms per non sbalzarsi sul push.

---

## 2026-04-18 (sessione 29) — Debug visuale + fix NEBBIA/RITORNO + merge v3.18.0 stable + launcher definitivo

### Obiettivo
Audit visuale di v3.18-experimental per capire "cosa manca". Mergere v3.18 come principale.
Launcher unico definitivo per avvio live.

### Fatto
**Fase 1 — Debug visuale sistematico (Phase 1 systematic-debugging).**
Identificati 3 buchi visuali, di cui 1 bug reale + 1 perceptual + 1 design debt:

1. **BUG NEBBIA radial dead code** (`campo.js:891`):
   `isNebbiaRadial = biomaRenderMode === 'radial-voice'` ma `biomaRenderMode` non era
   mai settato in `biomi.js` (zero occorrenze su tutto src/). MACCHINA/TEMPESTA sopravvivevano
   grazie al fallback `_biomaName === 'X'`, NEBBIA no → `thresholdMode=3` (dither radiale
   concentrico su voice) non si attivava mai. Stesso pattern del bug perf-audit Wave 1B-bis.
   **Fix:** aggiunto fallback `_biomaName === 'NEBBIA'` (1 riga).

2. **RITORNO geologia cumulativa percettivamente vuota:**
   `_GEO_MERGE_FACTOR=0.35` × `geoAlpha=0.40` + Bayer gate `d < bayer(px,py)` → solo
   ~2/16 pixel visibili per traccia recente, tracce antiche completamente invisibili.
   L'audit aveva centrato le costanti a valori troppo conservativi.
   **Fix bilanciato (4 tweaks numerici, zero cambi architetturali):**
     * `_GEO_MERGE_FACTOR`: 0.35 → 0.52 (deposito più forte per traccia)
     * `_GEO_DECAY_ON_TRACK_CHANGE`: 0.92 → 0.94 (memoria più persistente: 7ª pesa ≈0.68 vs 0.61)
     * `geoAlpha`: 0.40 → 0.58 (substrate più brillante)
     * Cella threshold: 0.05 → 0.02 (tracce antiche non filtrate prematuramente)
     * Bayer gate permissivo: `dBoost = d*1.7` (2/16 → ~5/16 pixel)

3. **Design debts rimanenti (non toccati, segnalati all'utente):**
   - Rupture stages `infiltration` + `residue` invisibili sul field (80% della rottura muta)
   - 3 biomi (SOLCO/TESSUTO/RESPIRO) senza linguaggi radicali Bayer-breaking

Commit `165023c`: `fix(visual): NEBBIA radial cablato + RITORNO geologia amplificata`

**Fase 2 — Merge v3.18-experimental → machine-iii.**
Conflitti risolti:
- `VERSION.js` → theirs (v3.18)
- `docs/{DECISIONS,STATUS,WORKLOG}.md` → theirs (superset)
- `src/biomi.js` → risolto a mano mantenendo commenti compositivi HEAD (v3.17.2)
  + corpo soundcheck evoluto v3.18

Merge commit `95b54b4`. Bump versione a stable `v3.18.0` (commit `cda67a8`).
Tag `v3.18.0` creato.

**Fase 3 — Launcher definitivo.**
File canonico: `/Users/Edo_1/MACH-INE II/machine-launch.command`
(fuori da git, doppio-click da Finder o `./machine-launch.command` da CLI)
Wrapper: `app/launch.sh` (redirige al canonico).

HUD completa aggiornata per v3.18:
- Performer: ←/→ octave ±12, ↑/↓ density ±10%, M/N mute 8bar
- Pre-suite: Shift+0 start, 0 skip
- Nodo ternario TEMPESTA: 1/2/3 (default/phrygianHold/silenceThenAeolian)
- Skip fase: `,`/`.` (ex frecce)
- PANIC: Shift+Z (reset totale + AllNotesOff + drammaturgia reset)
- Soundcheck: T (loop 8bar D dorian + drum kit GM)
- Firma: G/J/V (gelo/convergenza/vuotoTotale)

Flag CLI opzionali:
- `--presuite` apre con `?presuite` (drone C2 90s → NEBBIA)
- `--seed N` apre con `?seed=N` (SeededRNG deterministico)
- `--norns` avvia anche bridge WebSocket→OSC (`machine-drone/norns-bridge.py`)
- `--no-browser` server headless

Smoke test OK: HTTP/1.0 200 su `http://localhost:8282`. Cleanup CTRL+C chiude
server + bridge. `start-all.sh` e `start.sh` precedenti lasciati intatti per casi
use-case specifici (sync SC Norns via sshpass).

### File toccati
- **Modificati:** `src/campo.js` (NEBBIA + RITORNO geologia), `src/VERSION.js` (3.18.0 stable)
  + merge files: `src/{audio,bass-v3,biomi,config,director3,harmony,main,melody-v3,midi,render,rhythm,tracks,world-state}.js`, `src/soundcheck.js`, `index.html`, `docs/{DECISIONS,STATUS,WORKLOG}.md`
- **Nuovi (via merge):** `docs/V3.18-AUDIT.md`, `src/perf-utils.js`
- **Nuovi (launcher):** `machine-launch.command` (root, fuori app/)
- **Riscritti:** `app/launch.sh` (ora wrapper minimo)

### Decisioni prese
Vedi `DECISIONS.md` #030 — Merge v3.18.0 + fix visuale + launcher definitivo.

### Prossima sessione — punto di ripartenza
1. **Test live v3.18.0** come principale (10 raccomandazioni in `docs/V3.18-AUDIT.md`):
   baseline sanity A/B, pre-suite, nodo ternario, hotkey performer, panic, tab-hidden,
   geologia RITORNO amplificata, biomi radicali (NEBBIA ora attivo!), memory/GC 10min.
2. **Debt visivo da valutare post-test:**
   - Dare segno visivo a `rupture.stage === 'infiltration'` (20-50% durata rottura, ora muta)
   - Dare segno visivo a `rupture.stage === 'residue'` (80-100% durata, solo comp-griglia)
   - 3 biomi senza linguaggio radicale: SOLCO / TESSUTO / RESPIRO
3. **Eventuale rimozione worktree experimental** (`git worktree remove ../app-experimental`)
   dopo conferma test live OK.
4. **Push origin** (71 commit avanti su `machine-iii` + tag `v3.18.0`) — richiede conferma utente.

---

## 2026-04-18 (sessione 28-bis) — Soundcheck loop ported (v3.18.0-rc2-exp)

**Obiettivo:** portare sul branch experimental il soundcheck loop sviluppato
sul branch stabile (v3.17.2), mantenendo i due branch allineati sulla feature
prima del test live che deciderà se v3.18 diventa definitiva.

**Fatto:**
- **4 commit su `v3.18-experimental`**:
  - `dc31ef7` feat(soundcheck): scaffold base 4-bar
  - `7032127` feat(soundcheck): loop 4-bar vario + percussioni GM + barre più alte
  - `9d77da5` feat(soundcheck): loop 8 bar + drum kit GM completo + audioReact
  - `71d66fe` feat(soundcheck): stop resetta a NEBBIA inizio
- **[src/soundcheck.js]** nuovo — loop 8 bar D dorian 90 BPM, sequencer
  interno + clock worker condiviso, drum kit GM su CH1 distribuito per bar
  (normal/soft/loud/medium + cymbals/latin/woody/break).
- **[src/biomi.js]** bioma SOUNDCHECK: 8 colonne level-meter con audioReact
  (pulse base quando arriva energy dal BlackHole).
- **[src/main.js]** import + hotkey `T` + hook worker handler con short-circuit.
  Stop `T` ripremuto → reset completo a NEBBIA inizio (clearCampo +
  setBiome + initDirector3 + initCamera).
- **[VERSION.js]** v3.18.0-rc1-exp → v3.18.0-rc2-exp.

**Nessun conflitto** con i fix della sessione 28 (Opus 4.7 audit). Soundcheck
è feature indipendente: non tocca director3/rhythm/bass/melody/harmony/texture,
non tocca camera né rupture. Compatibile con pre-suite, panic Shift+Z,
octave transpose frecce, density ±.

**Decisioni prese:** #029 — Soundcheck loop autonomo (stesso rationale del
branch stabile, vedi DECISIONS.md).

**Prossimo:**
- **TEST LIVE V3.18-EXPERIMENTAL** — l'utente farà il test live completo
  per decidere se v3.18 va mergiata su `machine-iii` (diventa stabile)
  o tenuta come branch preview. Il soundcheck è il primo passo del test
  (verifica routing audio, volumi, visual).
- Se v3.18 PASSA: merge a `machine-iii`, bump a `v3.18.0`, tag `v3.18.0-stable`.
- Se v3.18 FAIL: `git worktree remove` + branch preservato come archivio.

---

## 2026-04-17 (sessione 28) — Audit Opus 4.7 + fix multi-agent 4 cluster (v3.17.1 → v3.18.0-rc1-exp)

**Obiettivo:** audit completo e onesto del progetto dal punto di vista di Opus 4.7.
Trovare buchi/implementazioni/miglioramenti per rendere la performance davvero
"indimenticabile" come obiettivo dichiarato. Poi piano multi-agent per fixare
tutto, su branch sperimentale isolato per non rischiare.

**Diagnosi (via 4 agenti critici paralleli):**
1. **Musicale** — rupture.stage calcolato ma MAI LETTO dai 5 moduli (metadata morta);
   cicli armonici prevedibili; humanize `±6` fisso; no SeededRNG; ENCORE senza inversione.
2. **Visuale** — 7 biomi neutralizzati dal Bayer uniforme; rupture visivamente assente;
   geologia RITORNO snapshotta solo ultima traccia (promessa cumulativa tradita);
   glyph layer come "pannolino".
3. **Runtime** — `noteTimestamps` memory creep (270K entry/45min); tab-background
   note orfane; MIDI/audio fail silent; no panic reset.
4. **Drammaturgia** — performer invisibile come compositore; stessa scaletta
   deterministica ogni volta; il pubblico "capisce il sistema" prima del climax.

**Piano eseguito (branch v3.18-experimental isolato in `/app-experimental/`):**
- **Wave 0:** tag `v3.17.1-stable`, branch + worktree experimental, VERSION bump,
  DECISIONS #028.
- **Wave 1A/B/D in parallelo** (3 agenti coder):
  - A musica: rupture.stage cablata in 4 moduli, humanize per-traccia 7 valori
  - B visuale: `_geoMemory` Float32Array + RGB per geologia cumulativa;
    linguaggi radicali MACCHINA/NEBBIA/TEMPESTA; rupture omen inversione α=0.2
  - D runtime: ring buffer noteTimestamps (8192) + onsetTimestamps (256);
    document.hidden guard + AudioContext resume; HUD warnings; Shift+Z panic;
    `?seed=` URL param + SeededRNG; AllNotesOff lookahead 50ms
- **Wave 1.5E** (perf-analyzer): audit trasversale — zero regressioni > 0.3ms/frame.
  Ma rilevato bug critico: flag B2/B3 dichiarati ma mai usati nel render loop.
- **Wave 1B-bis** (coder): cablaggio flag B2/B3 nel render pixel loop
  (MACCHINA grid / TEMPESTA vector / NEBBIA voice radial / omen lerp integer).
- **Wave 2C** (coder): drammaturgia:
  - Nodo ternario post-TEMPESTA (tasti 1/2/3: default / phrygianHold / silenceThenAeolian 90s)
  - Pre-suite 90s (`?presuite` URL o Shift+0)
  - Hotkey performer: ←→ octave ±12, ↑↓ density ±10%, M melody mute 8bar, N bass mute 8bar
  - Sub drone tattile NEBBIA/TESSUTO (ottava -2)
  - skipPhase rimappato da ArrowKeys a `,`/`.` (**breaking change**)
- **Wave 3R** (reviewer): audit finale — verdetto **GO-with-caveats**.
  Zero bloccanti. 5 warning non critici. `docs/V3.18-AUDIT.md` creato.

**Fatto (7 commit sopra baseline v3.17.1-stable):**

| Commit | Wave | Descrizione |
|---|---|---|
| `a156342` | 1A | rupture wiring + humanize per-traccia |
| `361e747` | 1B | geologia cumulativa + flag biomi + omen |
| `5040125` | 1B-bis | cablaggio flag B2/B3 nel render loop |
| `0164c32` | 1D.1 | ring buffer noteTimestamps + SeededRNG + PANIC lookahead |
| `8ebd33f` | 1D.2 | tab-hidden + HUD + panic Shift+Z + seed URL + audio ring |
| `ed71a7f` | 2C | nodo ternario + hotkey performer + pre-suite + sub tactile |
| `22b06c1` | 3R | audit review + V3.18-AUDIT.md |

**Totale:** +1001/-113 righe, 16 file toccati.

**File toccati:**
- `src/VERSION.js` (v3.18.0-rc1-exp)
- `src/bass-v3.js`, `src/melody-v3.js`, `src/harmony.js`, `src/rhythm.js`, `src/tracks.js`
- `src/campo.js`, `src/director3.js`, `src/world-state.js`
- `src/main.js`, `src/midi.js`, `src/audio.js`, `src/perf-utils.js` (nuovo), `src/config.js`
- `index.html` (HUD div)
- `docs/DECISIONS.md` (#028), `docs/STATUS.md`, `docs/V3.18-AUDIT.md` (nuovo)

**Decisioni prese:** #028 — Ramificazione v3.18-experimental per fix audit Opus 4.7.

**Prossimo:** test live A/B v3.17.1-stable vs v3.18.0-rc1-exp. Dopo 1-2 test
decidere GATE 3: merge su `machine-iii` / mantenere experimental separato /
rollback. Vedi STATUS.md P0-P2.

**Rollback garantito:** `git worktree remove ../app-experimental --force` +
`git branch -D v3.18-experimental`. Tag `v3.17.1-stable` immutabile.

**Lessons learned:**
- Agenti coder paralleli su file disgiunti → funziona bene, evita conflitti git
- Timeout agenti (stream idle) è frequente per prompt lunghi → committare io
  il lavoro parziale + rilanciare agente più focalizzato
- Perf-analyzer è essenziale post-wave: ha scoperto che B2/B3 erano stub senza
  cablaggio, risparmiando un bug live potenzialmente silenzioso
- Reviewer finale + V3.18-AUDIT.md persistente → traccia decisione per futuri

---


---

> **Sessioni ≤27 (pre-v3.18)**: vedi [WORKLOG-archive-Q1-2026.md](./WORKLOG-archive-Q1-2026.md)
