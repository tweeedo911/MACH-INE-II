# machine-drone — Norns Script per MACH:INE III

> Spec: 2026-04-14
> Stato: design approvato, pre-implementazione

---

## 1. Concetto

Sintetizzatore drone dedicato alla suite MACH:INE III per Monome Norns.
Un singolo SynthDef parametrico SuperCollider con morphing continuo tra 7 biomi.

Due modalità operative:
- **SLAVE** (default): riceve MIDI CH2 da director3, il Norns è un synth hardware nella catena
- **AUTO** (K2+K3 per attivare): genera drone internamente, bioma selezionabile, fasi auto-evolventi

---

## 2. Architettura audio

### 2.1 Catena segnale

```
[LFTri A+B] ──┐
[Saw A+B]   ──┤ mix amp ──→ [RLPF] ──→ [tanh soft clip] ──→ [FreeVerb] ──→ out
[Pulse A+B] ──┘
[SinOsc A+B] ─┘  (RESPIRO: battimenti sub-Hz)
[BPF Noise] ──┘  (MACCHINA: ronzio circuito)
```

### 2.2 Principi

- **Un solo SynthDef, un solo Synth persistente** — creato in `alloc`, mai ricreato
- Ogni tipo di oscillatore è **2 copie detuned** (A ± detune cents) per battimenti naturali
- Tutti gli oscillatori sempre attivi in parallelo; quelli non usati a amp 0 (SC li ottimizza)
- **Morphing parametrico** via `Lag3` con tempo 15-20s curva esponenziale
- Nessun crossfade volume tra voci — il timbro migra, non si sovrappone
- Cambio di bioma = cambio simultaneo di tutti i parametri → morph impercettibile

### 2.3 Parametri per bioma

| Bioma     | Root  | mixTri | mixSaw | mixPul | mixSin | detune¢  | cutoff  | Q    | drive | revMix | revRoom | noiseAmp |
|-----------|-------|--------|--------|--------|--------|----------|---------|------|-------|--------|---------|----------|
| NEBBIA    | C3 48 | 1.0    | 0      | 0      | 0      | 0        | 250 Hz  | 0    | 0     | 0.3    | 0.7     | 0        |
| TESSUTO   | D3 50 | 0      | 1.0    | 0      | 0      | ±3       | 400 Hz  | 0.1  | 0.2   | 0.4    | 0.6     | 0        |
| SOLCO     | G3 55 | 1.0    | 0      | 0      | 0      | ±4       | 600 Hz  | 0.1  | 0.4   | 0.5    | 0.7     | 0        |
| RESPIRO   | C4 60 | 0      | 0      | 0      | 1.0    | ±0.3 Hz  | bypass  | —    | 0     | 0.2    | 0.5     | 0.05     |
| MACCHINA  | D3 50 | 0      | 0      | 1.0    | 0      | 0        | 800 Hz  | 0.8  | 0     | 0      | 0       | 0.3      |
| TEMPESTA  | E3 52 | 0      | 1.0    | 0      | 0      | ±5, ±12  | 1200 Hz | 0.4  | 0.6   | 0.3    | 0.5     | 0        |
| RITORNO   | A3 57 | 0      | 1.0    | 0      | 0      | ±3       | 400 Hz  | 0.1  | 0.2   | 0.5    | 0.8     | 0        |

Note:
- RESPIRO: 2 SinOsc con detuning sub-Hz (±0.3Hz) per battimento naturale. Breath noise filtrato BP a ~2kHz, amp 0.05.
- MACCHINA: Pulse 50% duty. BPF noise centrato sulla fondamentale, Q alto (~12), amp 0.3. Zero riverbero.
- TEMPESTA: 3 copie saw (center, +5¢, +12¢) — il terzo oscillatore è la seconda copia saw con offset maggiore.
- RITORNO: cutoff e revMix evolvono durante le fasi (400→150 Hz, 0.5→0.9). Gestito dalla coroutine fase in Lua.

### 2.4 Pitch drift

Drift implementato come **detuning reciproco tra le copie A/B** di ogni oscillatore. Non come pitch bend globale.
In aggiunta, un **LFO lento** nel SynthDef modula il pitch complessivo:

| Bioma     | Ampiezza drift | Periodo   | Carattere               |
|-----------|---------------|-----------|-------------------------|
| NEBBIA    | ±15 cents     | 24 bar    | respiro quasi assente   |
| TESSUTO   | ±17.5 cents   | 32 bar    | telaio lento            |
| SOLCO     | ±17.5 cents   | 32 bar    | sedimento               |
| RESPIRO   | ±22.5 cents   | 40 bar    | il più ampio e lento    |
| MACCHINA  | ±7.5 cents    | 8 bar     | vibrazione meccanica    |
| TEMPESTA  | ±20.5 cents   | 12 bar    | tensione ampia e rapida |
| RITORNO   | ±15 cents     | 36 bar    | congedo lento           |

In modalità AUTO il periodo è calcolato in secondi (usando BPM del bioma o fallback 60).
In modalità SLAVE il pitch bend MIDI in arrivo sovrascrive l'LFO interno.

---

## 3. Modalità operative

### 3.1 SLAVE (default)

Il Norns ascolta MIDI CH2:
- **Note on** → root pitch del drone (con velocity → amplitude)
- **Pitch bend** → sovrascrive drift LFO interno
- **CC1** → modula cutoff filtro (mappato: 0-127 → cutoffMin..cutoffMax del bioma)

**Inferenza bioma** dal MIDI ricevuto:
- Opzione primaria: CC16 su CH2 = indice bioma (0-6). Se director3 lo manda, è il metodo più robusto.
- Fallback: inferenza dalla root note. Mappa: C3→NEBBIA, D3→TESSUTO, G3→SOLCO, C4→RESPIRO, E3→TEMPESTA, A3→RITORNO. Per TESSUTO/MACCHINA (entrambi D3): segue la sequenza della suite (dopo SOLCO→RESPIRO→MACCHINA).

**Override encoder in slave (offset additivo):**
- E2 (pitch): offset ±1 semitono, si somma alla nota MIDI ricevuta
- E3 (cutoff): offset ±valore, si somma al CC1 ricevuto
- E1: disattivato in slave (bioma deciso dal MIDI)

Gli offset restano finché non li riporti a zero. Non vengono cancellati dal MIDI in arrivo.

### 3.2 AUTO (toggle con K2+K3)

Il Norns genera il drone internamente:
- E1 seleziona il bioma (1-7), il morph parte immediatamente (15-20s)
- Le 4 fasi evolvono automaticamente via `clock.run()`:
  - **Germoglio**: amp bassa, cutoff chiuso, drift minimo, reverb medio
  - **Pulsazione**: amp sale, cutoff si apre, drift si attiva
  - **Densita**: amp piena, cutoff aperto, drift massimo
  - **Dissoluzione**: tutto decresce gradualmente
- Durata fasi proporzionale alla suite reale (da MOOD.md)
- Modalità "stazione": se non cambi bioma, cicla le fasi nello stesso bioma

**Controlli in AUTO:**
- E1: seleziona bioma (morph)
- E2: pitch fine-tune (±1 semitono, diretto non offset)
- E3: cutoff filtro (diretto)
- K2: fase precedente (salta indietro)
- K3: fase successiva (salta avanti)
- K1 + E1: volume master
- K1 + E2: drift amount (override)
- K1 + E3: reverb mix (override)

---

## 4. Schermo 128x64

UI minimalista testuale, aggiornata a 15fps via metro.

```
┌────────────────────────────────┐
│ NEBBIA            C lyd  SLAVE │
│ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│
│ phase: germoglio     ●○○○     │
│                                │
│ cut ▒▒░░░░  drft ▒░░░░░░░░░  │
│ rev ▒▒▒░░░  vol  ▒▒▒▒▒▒▒░░  │
└────────────────────────────────┘
```

- Riga 1: nome bioma (level 15), scala (level 5), modalità SLAVE/AUTO (level 8)
- Riga 3: fase corrente + 4 cerchi (fase attiva = pieno)
- Righe 5-6: barre parametri in tempo reale (level 10 attivo, level 3 inattivo)
- In SLAVE: indicatore MIDI lampeggia quando arrivano messaggi

---

## 5. Struttura file

```
machine-drone/
  machine-drone.lua          -- entry point: init, enc, key, redraw, MIDI, clock, params
  lib/
    Engine_MachineDrone.sc    -- CroneEngine: SynthDef + comandi SC
    biomes.lua                -- tabella 7 biomi (tutti i parametri numerici)
```

Tre file. Il nome della cartella e dello script Lua devono coincidere (requisito Norns).

### 5.1 Engine_MachineDrone.sc

CroneEngine class con:
- `alloc`: crea SynthDef "MachineDrone", crea Synth persistente, registra comandi
- `free`: libera Synth
- Comandi esposti: `hz`, `amp`, `mixTri`, `mixSaw`, `mixPul`, `mixSin`, `detune`, `cutoff`, `q`, `drive`, `reverbMix`, `reverbRoom`, `noiseAmp`, `noiseBPFreq`, `driftAmp`, `driftRate`, `breathAmp`
- Tutti i parametri con `Lag3.kr(param, lagTime)` dove lagTime = 15-20s per morph, 0.1s per controlli diretti
- Due lag time separati: `morphLag` (lungo, per cambi bioma) e `controlLag` (corto, per encoder)

### 5.2 biomes.lua

```lua
return {
  { name="NEBBIA",   root=48, scale="C lyd",  mixTri=1, mixSaw=0, mixPul=0, mixSin=0, detune=0,    cutoff=250,  q=0,   drive=0,   revMix=0.3, revRoom=0.7, noiseAmp=0,    driftAmp=15,   driftPeriod=24, bpm=60  },
  { name="TESSUTO",  root=50, scale="D aeo",  mixTri=0, mixSaw=1, mixPul=0, mixSin=0, detune=3,    cutoff=400,  q=0.1, drive=0.2, revMix=0.4, revRoom=0.6, noiseAmp=0,    driftAmp=17.5, driftPeriod=32, bpm=86  },
  { name="SOLCO",    root=55, scale="G dor",  mixTri=1, mixSaw=0, mixPul=0, mixSin=0, detune=4,    cutoff=600,  q=0.1, drive=0.4, revMix=0.5, revRoom=0.7, noiseAmp=0,    driftAmp=17.5, driftPeriod=32, bpm=129 },
  { name="RESPIRO",  root=60, scale="C ion",  mixTri=0, mixSaw=0, mixPul=0, mixSin=1, detune=0.3,  cutoff=8000, q=0,   drive=0,   revMix=0.2, revRoom=0.5, noiseAmp=0.05, driftAmp=22.5, driftPeriod=40, bpm=60  },
  { name="MACCHINA", root=50, scale="D dor",  mixTri=0, mixSaw=0, mixPul=1, mixSin=0, detune=0,    cutoff=800,  q=0.8, drive=0,   revMix=0,   revRoom=0,   noiseAmp=0.3,  driftAmp=7.5,  driftPeriod=8,  bpm=129 },
  { name="TEMPESTA", root=52, scale="E phr",  mixTri=0, mixSaw=1, mixPul=0, mixSin=0, detune=5, detune2=12, cutoff=1200, q=0.4, drive=0.6, revMix=0.3, revRoom=0.5, noiseAmp=0, driftAmp=20.5, driftPeriod=12, bpm=129 },
  { name="RITORNO",  root=57, scale="A aeo",  mixTri=0, mixSaw=1, mixPul=0, mixSin=0, detune=3,    cutoff=400,  q=0.1, drive=0.2, revMix=0.5, revRoom=0.8, noiseAmp=0,    driftAmp=15,   driftPeriod=36, bpm=86  },
}
```

### 5.3 machine-drone.lua

Responsabilità:
- `init()`: engine load, params setup, MIDI connect, metro screen 15fps, clock coroutine fasi
- `enc(n,d)`: E1 bioma (AUTO) / disattivato (SLAVE), E2 pitch offset/diretto, E3 cutoff offset/diretto. K1 held → E1 volume, E2 drift, E3 reverb
- `key(n,z)`: K2+K3 insieme → toggle SLAVE/AUTO. In AUTO: K2 fase prev, K3 fase next
- `redraw()`: UI testuale 128x64
- MIDI event handler: CH2 note/CC1/pitchbend → engine commands + offset additivo encoder
- Clock coroutine: evoluzione 4 fasi in AUTO (amp, cutoff, drift, reverb modulati nel tempo)

---

## 6. Durata fasi in modalità AUTO

Derivate da MOOD.md, convertite in secondi:

| Bioma     | BPM | Germoglio | Pulsazione | Densita | Dissoluzione | Totale  |
|-----------|-----|-----------|------------|---------|--------------|---------|
| NEBBIA    | 60  | 128s      | 96s        | —       | 64s          | 288s    |
| TESSUTO   | 86  | 67s       | 89s        | 89s     | 67s          | 312s    |
| SOLCO     | 129 | 60s       | 89s        | 119s    | 60s          | 328s    |
| RESPIRO   | 60  | 48s       | 64s        | —       | 48s          | 160s    |
| MACCHINA  | 129 | 60s       | 89s        | 119s    | 60s          | 328s    |
| TEMPESTA  | 129 | 45s       | 60s        | 179s    | 60s          | 344s    |
| RITORNO   | 86  | 67s       | 67s        | 89s     | 134s         | 357s    |

NEBBIA e RESPIRO saltano densita (passano direttamente da pulsazione a dissoluzione).
Nessun bioma ha rottura in modalità AUTO (la rottura è un evento del director3, non del drone).

---

## 7. Params Norns (menu PARAMETERS)

Accessibili dal menu Norns standard, con MIDI learn automatico:

```
── MACHINE DRONE ──
volume          0.0 .. 1.0    [default 0.5]
biome           1-7           [default 1, solo AUTO]

── TIMBRE ──
cutoff offset   -2000 .. +2000 Hz  [default 0]
pitch offset    -12 .. +12 semi    [default 0]
drift amount    0.0 .. 2.0 (scala) [default 1.0]
reverb mix      0.0 .. 1.0         [bioma default]
drive           0.0 .. 1.0         [bioma default]

── MORPH ──
morph time      5 .. 30 s    [default 18]

── MIDI ──
midi device     1-16          [default 1]
midi channel    1-16          [default 3 (CH2 zero-indexed)]
```

---

## 8. Requisiti hardware

- Monome Norns (qualsiasi revisione: standard, shield, CM3+)
- MIDI USB per modalità slave (qualsiasi interfaccia class-compliant)
- Nessun hardware aggiuntivo richiesto

---

## 9. Limiti e vincoli

- CPU target: <40% di un singolo core CM3 (testare con `s.avgCPU` in SC)
- 6 oscillatori + RLPF + tanh + FreeVerb è nel budget (Dronecaster SUNNO fa di più)
- Mono-fonico: un solo drone alla volta (come MACH:INE III)
- Nessuna polifonia, nessun sequencer, nessun pattern
- Lo script non genera audio quando amp = 0 (gate nel SynthDef per risparmio CPU)
