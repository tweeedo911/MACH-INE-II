# MACH:INE II — Sessione di sviluppo compositivo
**Data**: 25 marzo 2026  
**Repository**: https://github.com/tweeedo911/MACH-INE-II

---

## Il progetto

MACH:INE II è un audio visualizer narrativo con estetica Mondrian — halftone Bayer, MIDI sinestesia geometrica, sistema di scene. È pensato per performance audiovisive dal vivo: il browser co-compone in tempo reale su 8 canali MIDI verso Ableton Live.

**Stack**: ES modules nativi, Canvas 2D, Web Audio API, WebMIDI API, Web Worker clock  
**Output**: 8 canali MIDI (CH0=PULSE, CH1=GRAIN, CH2=DRONE, CH3=BASS, CH4=CHORDS, CH5=VOICE, CH6=LEAD, CH7=RUPTURE)

---

## I 6 motori compositivi

| Tasto | Nome | File | Tonalità | BPM | Carattere |
|-------|------|------|----------|-----|-----------|
| 1 | DERIVA | composer3.js | A Lydian | beatless | ambient drift |
| 2 | CRISTALLO | composer5.js | Eb Lydian | 54 | shimmer arpeggios |
| 3 | ABISSO | composer6.js | Bb Phrygian | 76 | drone rituale |
| 4 | TERRENO | composer.js | D Dorian | 72 | dub organico |
| 5 | MECCANICA | composer2.js | C# Dorian | 98 | jazz poliritmico |
| 6 | VORTICE | composer4.js | E Phrygian | 138 | tribal-industriale |

Ogni motore ha un sistema di fasi narrative: **germoglio → pulsazione → densità → rottura → dissoluzione**, con un rupture engine a 4 stadi (presagio / infiltrazione / takeover / residuo).

---

## Diagnosi dei problemi

Il feedback iniziale era: *"troppo meccanico, i canali non dialogano, poco ritmo dove serve"*.

### TERRENO
Risoluzione quarter-note — il bass sparava massimo 4 note/bar senza sincope reale. Il dub vive sugli "and" degli ottavi, non sui downbeat.

### MECCANICA
- Kick in 4-on-the-floor o ogni-2-beat — nessun pocket jazz
- Bass ciclava `[root, root+1, fifth, min3rd]` ogni beat: `root+1` = Bb in A Dorian, nota cromatica nel posto sbagliato ad ogni bar
- La tonalità era A Dorian, ma il progetto la indica come C# Dorian — disallineamento totale

### VORTICE
I micro-loop facevano `pool[(step + offset) % pool.length]` — scorrevano la scala sequenzialmente. Risultato: scale run continui invece di trame ritmiche interlocking.

### Tutti i composer
I CHORDS sparavano voicings root-position che saturavano lo spettro medio. Nessun shell voicing, nessun drop-2.

---

## Le riscritture

### composer.js (TERRENO) — step sequencer 16th-note
- Clock a 72 BPM, stepMs ≈ 208ms
- **5 kick pattern** dal single downbeat al dub push completo, rotazione sfalsata ogni 8 bar
- **Bass come offset da D2(38)**: le note sono 0=D2, 3=F2, 5=G2, 7=A2, **9=B2 (Dorian 6°!)**, 10=C3, 12=D3 — nessuna nota cromatica estranea, sincopi reali
- Chord voicings open con bass note inclusa, cambio ogni N bar per fase
- VOICE: frasi Markov di 1-3 note sul beat 2, registro D4-D5
- GRAIN: solo sui step [2,6,10,14] — tra i kick, non sopra

### composer2.js (MECCANICA) — step clock separato
- Tonalità corretta: **C# Dorian** (C#3=61)
- Step clock separato per kick/bass (16th), layer system mantenuto per armonia/grain/voce — la texture jazz-organica dei crossing rimane
- **5 kick pattern** con feel jazz (pocket, funky, E(5,16) variant)
- Bass usa C#1/E1/G#1/**A#1 (Dorian 6°)** — il `root+1` sbagliato è eliminato
- **Shell voicings jazz**: C#m7, F#m7, Amaj7, G#m7 invece di root-position
- Groove humanization ±12ms sugli off-beat

### composer4.js (VORTICE) — pitch classes fissi nei micro-loop
- Fix principale: ogni layer ha un **vocabolario armonico fisso** invece di scorrere la scala
  - Layer A (alto, 8-step): `[E4, G4, B4, C5]` — triade + ottava
  - Layer B (medio, 5-step): `[E3, F3, A3, B3]` — include F (b2 Phrygian!)
  - Layer C (altissimo, 3-step): `[E5, G5, B4]` — triade aperta
- Rotazione dei pitch pools ogni MICRO_VAR_BARS per evoluzione timbrica
- **Motivo VOICE ricorrente**: `E4→F4→E4→B3` (root→b2→root→quinta — quintessenza Phrygian), con varianti per fase che evolvono lentamente
- CH6 LEAD: eco del motivo, ottava sotto, sul beat 3 ogni 2 bar

### composer6.js (ABISSO) — bass rituale e grain sedimentale
- Tonalità corretta: **Bb Phrygian** (Bb2=46, b2=Cb=47)
- Bass rarefatto: MENO è PIÙ. Ogni nota è un evento. 5 sequenze dalla singola radice al pattern ascendente per la risalita
- CH0 PULSE: heartbeat rituale solo sul downbeat ogni N bar — non un kick drum
- CH4 CHORDS: cambio ogni 8 bar — il cambio è un evento sacro
- CH1 GRAIN: sedimento abissale, solo step [4,8,12], registro basso (46-62), velocity bassa
- CH5 VOICE: gocce melodiche ogni 8 bar, note lunghissime (16 step)
- Octave shift progressivo durante rottura (presagio→+12, takeover→+24)

### Non modificati
- **DERIVA** (composer3.js): già corretto — brightness trigger per VOICE, A Lydian, no PULSE/BASS
- **CRISTALLO** (composer5.js): già funzionante — shimmer arpeggios, Eb Lydian, 54 BPM

---

## Note per l'implementazione

I 4 file riscritti sono **drop-in replacement** — stessa API pubblica (`init` / `toggle` / `update` / `getStatus`).

In `config.js` verificare:
- `CFG.COMPOSER2.phases[*].drone` → aggiornare a **61** (C#3, era 57=A3)
- `CFG.COMPOSER6.phases[*].drone` → aggiornare a **46** (Bb2)
- `CFG.COMPOSER4.phases[*].drone` rimane 52 (E3) — invariato

---

## Referenze musicali per motore

| Motore | Referenze |
|--------|-----------|
| DERIVA | Brian Eno *Discreet Music*, Stars of the Lid, Grouper, William Basinski, Ólafur Arnalds |
| CRISTALLO | Aphex Twin *Xtal* (54 BPM esatti), Nils Frahm *Says*, GAS, OPN, Julianna Barwick |
| ABISSO | Bohren & der Club of Gore, Dead Can Dance, Lustmord, Sunn O))), Demdike Stare |
| TERRENO | Caribou *Odessa*, Floating Points *Epoch*, Actress, Basic Channel, Burial |
| MECCANICA | Steve Reich *Music for 18 Musicians*, Floating Points *LesAlpx*, Four Tet, Autechre, Ricardo Villalobos |
| VORTICE | Arca *Mutant*, Shackleton, Raime, Actress *R.I.P.*, Pan Daijing |
