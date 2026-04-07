# 02 — MUSIC

## 7 tracce (suite ~45 min)

| # | TRACK    | scale       | modeHint  | root | BPM    | carattere                            |
|---|----------|-------------|-----------|------|--------|--------------------------------------|
| 1 | NEBBIA   | F lydian    | lydian    | 53   | ambient| apertura sospesa, droni #4           |
| 2 | TESSUTO  | A aeolian   | aeolian   | 57   | 80     | trama minore, b6 caratteristica      |
| 3 | SOLCO    | G dorian    | dorian    | 55   | 96     | groove dorico, 6a maggiore           |
| 4 | RESPIRO  | C ionian    | ionian    | 60   | 72     | respiro maggiore, 7a                 |
| 5 | MACCHINA | D dorian    | dorian    | 62   | 110    | macchina dorica industriale          |
| 6 | TEMPESTA | E phrygian  | phrygian  | 64   | 128    | b2, tensione frigia                  |
| 7 | RITORNO  | A aeolian   | aeolian   | 57   | 60     | chiusura minore, b6                  |

`modeHint` abilita il **modal characteristic note boost** in `harmony.js`:
le note di accordo che cadono sull'intervallo distintivo del modo (es. dorian → 6a)
ricevono un velocity boost (`CFG.characteristicVelBoost`).

## Canali MIDI (immutabile)

```
CH0 PULSE   — kick / percussivo
CH1 GRAIN   — texture / hi-hat / scatter
CH2 DRONE   — root sostenuta + pitch drift LFO (±15 cents, 24 bar)
CH3 BASS    — linea di basso
CH4 CHORDS  — accordi (sustained o ritmici via chordGrid)
CH5 VOICE   — voce melodica
CH6 LEAD    — voce melodica secondaria
CH7 RUPTURE — eventi caotici speciali
```

## 5 fasi formali per traccia

`germoglio → pulsazione → densita → rottura → dissoluzione`

Il **rottura** ha sempre 4 sotto-stadi obbligatori: `omen → infiltrazione → takeover → residuo`.

## Regola potenze di 2

Tutte le lunghezze (progressioni, sezioni, sweep) devono essere `2 / 4 / 8 / 16 / 32` battute.
Vedi `.claude/skills/composition-depth/references/structural-form.md` per la diagnosi
di violazioni storiche (TERRENO densità 24 bar, CRISTALLO 24 bar).

## Bars-per-chord per fase

```js
germoglio:    8
pulsazione:   4
densita:      4
rottura:      2
dissoluzione: 8
```

## Degradazione

Nella fase finale `dissoluzione`, `worldState.degradation.chordNoteCount` riduce
gradualmente le note dell'accordo (4 → 3 → 2 → solo root): "l'accordo crolla verso l'interno".

## Pitch drift (Sakamoto §A.5)

Il drone CH2 ha un LFO sinusoidale lentissimo (±15 cents, periodo 24 bar ≈ 60s @ 96 BPM)
inviato come pitch bend per evitare staticità.

## A/B/C music framework

Flag `CFG.MUSIC_EXPERIMENT` (sperimentale, può essere disattivato live)
e `CFG.MUSIC_STRUCTURAL` (strutturale, sempre on).

Storia compositiva approfondita: `archive/docs/old/RESEARCH-V4-COMPOSITIONAL-DIRECTION.md`,
`archive/docs/old/PARTITURA-NARRATIVA.md`.
