# MACH:INE II — Guida Strumenti per Ableton Live

Ogni motore usa gli **stessi 8 canali MIDI** (CH0–CH7) ma con timbri diversi. Il concetto: uno strumento per canale, manipolato nel tempo via macro/automazione per cambiare carattere tra motori.

---

## Architettura canali (fissa per tutto il set)

| CH | Ruolo | Tipo strumento | Range MIDI |
|----|-------|---------------|------------|
| 0 | KICK / PULSE | Synth kick o drum machine | C1-C3 (36-60) |
| 1 | GRAIN / HI-HAT | Synth granulare / hat metallico | C5-G6 (72-91) |
| 2 | DRONE | Pad sostenuto | G2-E4 (43-64) |
| 3 | BASS | Synth bass monofonico | G1-G3 (31-55) |
| 4 | CHORDS | Pad/keys polifonico | C3-G5 (48-79) |
| 5 | VOICE | Lead melodico | E4-G5 (64-79) |
| 6 | LEAD (echo) | Lead secondario / delay | C3-G5 (48-79) |
| 7 | RIDE / PERC | Metallico / percussivo | Bb5+ (82+) |

---

## Suggerimenti per strumento (Ableton stock + consigli)

### CH0 — KICK / PULSE

**Base**: Operator o Drift (sine → saw leggero sub oscillatore). Decay corto (~200ms), niente sustain.

| Motore | Carattere | Macro da automatizzare |
|--------|-----------|----------------------|
| DERIVA | Non usato | — |
| CRISTALLO | Pulse appena percepibile, più click che kick | Decay cortissimo (50ms), volume basso |
| ABISSO | Heartbeat — sub profondo, molto decadimento | Decay lungo (400ms), sub boost, lieve saturazione |
| TERRENO | Kick dub — punch medio, sub caldo | Decay 200ms, filter LP a 200Hz, compression |
| MECCANICA | Kick jazz — secco, mid-focused | Decay 150ms, filter HP a 80Hz (taglia sub), drive leggero |
| VORTICE | Kick tribale — aggressivo, layered | Decay 180ms, distortion, transient shaper, ghost = nota alta stessa traccia |
| SOLCO | Kick techno — 4/4, punch + sub bilanciati | Decay 220ms, sidechain compression, lieve clipping |

**Manipolazione nel tempo**: automazione del decay (corto→lungo man mano che il set avanza) e del drive (pulito→saturo).

---

### CH1 — GRAIN / HI-HAT

**Base**: Wavetable o Collision (metallico FM). Due zone: note alte (>76) = closed hat, note medie (~74) = open hat.

| Motore | Carattere | Note |
|--------|-----------|------|
| DERIVA | Grain aerea, scintille Lydian | Note da A Lydian alta (72-81), vel bassa, riverberatissimo |
| CRISTALLO | Micro-sparkle cristallino | Note E Lydian alta (77-93), shimmer reverb, delay |
| ABISSO | Sedimento granulare, sparso | Note Bb Phrygian alta (68+), dark reverb |
| TERRENO | Texture atmosferica tra i kick | Note D Dorian alta (69-86), posizionati sugli offbeat |
| MECCANICA | Tessiture jazz, registro brillante | Note C# Dorian (66-78), burst brevi |
| VORTICE | 3 micro-loop sovrapposti con pitch pool fissi | Layer A (64,67,71,72), B (52,53,57,59), C (76,79,83) |
| SOLCO | Hi-hat berlinese: closed (79) + open (74) | Closed = note 76-81 corte. Open = nota 74 lunga. Classico pattern 8ths+offbeat |

**Manipolazione nel tempo**: automazione di filter HP (apre progressivamente le alte frequenze), reverb send (asciutto→bagnato), e rate del grain engine (lento→veloce).

---

### CH2 — DRONE

**Base**: Analog o Drift. Due oscillatori detuned, LP filter lento. Sustain infinito. Il drone è l'anima di ogni motore.

| Motore | Root | Carattere |
|--------|------|-----------|
| DERIVA | A2 (45) + E3 + A3 | Caldo, Lydian, sospeso. Tanto reverb. |
| CRISTALLO | E3 (52) | Cristallino, brillante. Shimmer reverb. |
| ABISSO | Bb2 (46) + F3 | Scuro, profondo. Phrygian darkness. Chorus lento. |
| TERRENO | D3 (50) + A3 | Dub warm. Root + quinta. Tape saturation. |
| MECCANICA | C#3 (61) + G#3 | Medio, neutro. Jazz pad. |
| VORTICE | E3 (52) | Tribale. Sub + harmonics. |
| SOLCO | G2 (43) + D3 | Sub techno. Quasi inudibile ma senti la mancanza quando tolto. |

**Manipolazione nel tempo**: automazione del filter cutoff (apre gradualmente dal germoglio alla densità), del detune (più largo = più instabile), e del volume (il drone è l'unico elemento che sopravvive al hard cut del climax).

---

### CH3 — BASS

**Base**: Operator (monofonico, sine+square, filter LP resonante) o TAL-BassLine / Diva se disponibili.

| Motore | Root | Carattere |
|--------|------|-----------|
| DERIVA | Non usato | — |
| CRISTALLO | E1 (28) sub-drone | Appena percepibile, lunghissimo |
| ABISSO | Bb1 (34) | Autorità rituale. Poche note, ogni una è un evento. Gate lungo. |
| TERRENO | D2 (38) | Dub bass. Sincope. Gate variabile. Pattern reggae. |
| MECCANICA | C#1 (37) | Walking bass jazz. Pattern melodici, Dorian 6th (A#). |
| VORTICE | E2 (40) | Tribale. Root + b2 (F) tensione Phrygian. Gate corto. |
| SOLCO | G1 (31) | **Rolling 16th notes con velocity sweep.** IL pezzo forte. |

**Per SOLCO specificamente**: la velocity cicla sinusoidalmente su 8 bar. Se mappi velocity → filter cutoff in Ableton (MIDI Effect → Velocity → link a macro), ottieni il classico suono Berlin bass con filtro che apre e chiude. Questo è il cuore timbrico di SOLCO.

**Manipolazione nel tempo**: automazione di filter resonance (bassa→alta man mano che il set avanza), glide/portamento (off per TERRENO, on per SOLCO), e drive (pulito in CRISTALLO, saturo in VORTICE).

---

### CH4 — CHORDS

**Base**: Wavetable o Electric (Ableton). Polifonico. Diverse preset per motore.

| Motore | Carattere | Frequenza cambio |
|--------|-----------|------------------|
| DERIVA | Pad lento A Lydian, voice leading minimo | Ogni 2-12 drift bars (8-48 sec) |
| CRISTALLO | Pad Emaj7 lunghissimo, shimmer | Ogni 4-16 bar |
| ABISSO | Bbm rituali, scuri, aperti | Ogni 4 bar |
| TERRENO | Dm open voicing, dub | Ogni 1-4 bar |
| MECCANICA | Shell voicings jazz (C#m7, F#m7, Amaj7) | Ogni 2-4 bar, crossings layer |
| VORTICE | Em/Fmaj triadi secche | Ogni 2 bar |
| SOLCO | Gm7/Am7/C7 stab corti e secchi | Ogni 4-8 bar, su beat 2, cortissimi |

**Manipolazione nel tempo**: automazione di attack (lungo in DERIVA/CRISTALLO, corto in VORTICE/SOLCO), release (lungo→corto), e reverb/delay send.

---

### CH5 — VOICE

**Base**: Drift o Wavetable. Lead monofonico con lieve vibrato.

| Motore | Carattere |
|--------|-----------|
| DERIVA | Gocce melodiche brightness-driven. Corte (0.5s). Markov A Lydian. |
| CRISTALLO | Shimmer arpeggio (UP/DOWN/SUSPEND/SCATTER). Note lunghe, alte. |
| ABISSO | Rare. Phrygian melancolia. Una ogni 6 bar. |
| TERRENO | Frasi Markov 2-3 note, registro D4-D5. Silenzio essenziale. |
| MECCANICA | Call (CH5) and response (CH6). Melodica, pivot C#/E/G#. |
| VORTICE | Motivo ricorrente [E→F→E→B] e varianti. Identità Phrygian. |
| SOLCO | Quasi assente. Un frammento ogni 16-32 bar. Quando appare è speciale. |

**Manipolazione nel tempo**: automazione del vibrato rate (lento→veloce verso il climax), del delay feedback (poco→molto per creare trail), e del volume (VOICE è l'elemento più espressivo — deve respirare).

---

### CH6 — LEAD (echo)

Attivo solo in alcuni motori. Echo/risposta di CH5.

| Motore | Uso |
|--------|-----|
| DERIVA | Frammenti melodici ogni 8 drift bars, derivati dall'accordo corrente |
| MECCANICA | Response speculare: se CH5 sale, CH6 scende. Ritardato di 1.5 beat. |
| ABISSO | Eco del voice, stesse note ottava sotto |
| VORTICE | Root del motivo, ottava sotto, ritardato |

**Strumento**: stesso di CH5 ma con più delay e octave down. Oppure un secondo preset più scuro.

---

### CH7 — RIDE / PERC

Riproposto dal vecchio "rupture" come canale percussivo/metallico opzionale.

| Motore | Uso |
|--------|-----|
| SOLCO | Ride cymbal 8th notes (nota 82 fissa). Entra in densità. |
| VORTICE | Potenziale rullante tribale extra (da implementare) |
| MECCANICA | Potenziale ride jazz (da implementare) |

**Strumento**: Collision (Ableton) o campione metallico. Nota fissa, il timbro cambia solo via velocity.

---

## Routing consigliato in Ableton

```
MIDI Track 1:  CH0 → Kick rack (con macro per decay/drive)
MIDI Track 2:  CH1 → Grain/Hat synth (con macro per filter/reverb)
MIDI Track 3:  CH2 → Drone pad (con macro per cutoff/detune)
MIDI Track 4:  CH3 → Bass mono (con macro per filter/resonance/glide)
MIDI Track 5:  CH4 → Chord pad/keys (con macro per attack/release)
MIDI Track 6:  CH5 → Voice lead (con macro per vibrato/delay)
MIDI Track 7:  CH6 → Lead echo (stessa chain di CH5, preset diverso)
MIDI Track 8:  CH7 → Ride/perc (collision o sample)
```

Ogni traccia riceve da "MACH:INE II" (IAC Bus o loopMIDI) filtrato per canale MIDI.

## Strategia di manipolazione nel tempo

L'idea è usare **8 macro per rack** (uno per traccia), automatizzate manualmente durante la performance:

1. **Filter Cutoff** — il controllo principale. Apre il timbro dal germoglio alla densità.
2. **Reverb Send** — asciutto all'inizio, bagnato verso il climax.
3. **Drive/Saturation** — pulito nei motori ambient, sporco nei motori dance.
4. **Decay/Release** — corto = percussivo (VORTICE/SOLCO), lungo = ambient (DERIVA/CRISTALLO).
5. **Detune/Chorus** — aggiunge instabilità e calore.
6. **Delay Send** — crea trail e profondità.
7. **Volume** — il più sottovalutato. La dinamica è tutto.
8. **Libera** — effetto specifico per motore (glide per SOLCO, shimmer per CRISTALLO, ecc.)

Non serve cambiare preset tra motori — cambia le macro. Lo stesso Operator con 8 macro diverse suona come 7 strumenti diversi.
