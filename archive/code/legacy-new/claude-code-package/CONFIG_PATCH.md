# Config.js — Patch da applicare

## COMPOSER2 (MECCANICA) — Allineamento a C# Dorian

Il composer2.js riscritto usa C# Dorian (root C#3=61), ma config.js ha ancora A Dorian (root A3=57).

```js
// ── PRIMA (SBAGLIATO) ──
COMPOSER2: {
    toggleKey: 'Digit5',
    bpm: 98,
    gravitationalCenter: 57, // A3
    phases: {
      germoglio:    { duration: 45, mode: 'A_dorian',   drone: 57, arc: 'SILENCE'  },
      pulsazione:   { duration: 65, mode: 'A_phrygian', drone: 57, arc: 'BUILDING' },
      densita:      { duration: 85, mode: 'E_lydian',   drone: 64, arc: 'INTENSE'  },
      rottura:      { duration: 35, mode: 'Bb_locrian', drone: 58, arc: 'PEAK'     },
      dissoluzione: { duration: 90, mode: 'A_dorian',   drone: 57, arc: 'RELEASE'  },
    },
    // ...
}

// ── DOPO (CORRETTO) ──
COMPOSER2: {
    toggleKey: 'Digit5',
    bpm: 98,
    gravitationalCenter: 61, // C#3
    phases: {
      germoglio:    { duration: 45, mode: 'Cs_dorian',   drone: 61, arc: 'SILENCE'  },
      pulsazione:   { duration: 65, mode: 'Cs_dorian',   drone: 61, arc: 'BUILDING' },
      densita:      { duration: 85, mode: 'Cs_lydian',   drone: 61, arc: 'INTENSE'  },
      rottura:      { duration: 35, mode: 'Cs_dorian',   drone: 61, arc: 'PEAK'     },
      dissoluzione: { duration: 90, mode: 'Cs_dorian',   drone: 61, arc: 'RELEASE'  },
    },
    // ... resto invariato
}
```

**Nota sulla rottura**: con il nuovo climax intensificativo, la rottura NON cambia scala. Rimane in Cs_dorian e intensifica il materiale esistente. Se si vuole mantenere un cambio di colore modale, usare `Fs_phrygian` (relativa phrygian di C# Dorian) che è più musicale di Bb_locrian.

## COMPOSER6 (ABISSO) — Allineamento a Bb Phrygian

Il composer6.js riscritto usa Bb Phrygian (root Bb2=46), ma config.js ha B Phrygian (root B2=47).

```js
// ── PRIMA (SBAGLIATO) ──
COMPOSER6: {
    toggleKey: 'Digit3',
    bpm: 76,
    gravitationalCenter: 71, // B4
    phases: {
      germoglio:    { duration: 50,  mode: 'B_phrygian',  drone: 47, arc: 'SILENCE'  },
      pulsazione:   { duration: 70,  mode: 'B_phrygian',  drone: 47, arc: 'BUILDING' },
      densita:      { duration: 100, mode: 'B_phrygian',  drone: 47, arc: 'INTENSE'  },
      rottura:      { duration: 30,  mode: 'C_locrian',   drone: 48, arc: 'PEAK'     },
      dissoluzione: { duration: 90,  mode: 'B_phrygian',  drone: 47, arc: 'RELEASE'  },
    },
    // ...
}

// ── DOPO (CORRETTO) ──
COMPOSER6: {
    toggleKey: 'Digit3',
    bpm: 76,
    gravitationalCenter: 70, // Bb4
    phases: {
      germoglio:    { duration: 50,  mode: 'Bb_phrygian', drone: 46, arc: 'SILENCE'  },
      pulsazione:   { duration: 70,  mode: 'Bb_phrygian', drone: 46, arc: 'BUILDING' },
      densita:      { duration: 100, mode: 'Bb_phrygian', drone: 46, arc: 'INTENSE'  },
      rottura:      { duration: 30,  mode: 'Bb_phrygian', drone: 46, arc: 'PEAK'     },
      dissoluzione: { duration: 90,  mode: 'Bb_phrygian', drone: 46, arc: 'RELEASE'  },
    },
    // ... resto invariato
}
```

**Nota sulla rottura**: come per MECCANICA, la rottura rimane nella scala principale. L'ABISSO ha già il meccanismo dell'octave shift (presagio→+12, takeover→+24) che crea la "risalita" senza cambiare scala.

## COMPOSER (TERRENO) — Verifica

Il config COMPOSER è già abbastanza allineato, ma la rottura va cambiata:

```js
// La rottura NON deve cambiare a Eb_locrian — resta in scala
rottura: { duration: 30, mode: 'D_dorian', drone: 50, arc: 'PEAK' },
```

## COMPOSER4 (VORTICE) — Verifica

Il config COMPOSER4 è abbastanza allineato. Cambiare la rottura:

```js
// La rottura NON deve cambiare a F_locrian — resta in E Phrygian
rottura: { duration: 25, mode: 'E_phrygian', drone: 52, arc: 'PEAK' },
```

## Durate fasi — suggerimento per l'arco

Le durate delle fasi influenzano il ritmo del concerto. Suggerimento per il build-up progressivo:

```
                  GERMOGLIO  PULSAZIONE  DENSITÀ  ROTTURA  DISSOLUZIONE  TOTALE
DERIVA            40s        60s         90s      —*       80s           ~4.5min
CRISTALLO         60s        80s         120s     20s      100s          ~6.3min
ABISSO            50s        70s         100s     30s      90s           ~5.7min
TERRENO           40s        60s         90s      30s      80s           ~5.0min
MECCANICA         45s        65s         85s      35s      90s           ~5.3min
VORTICE           30s        50s         70s      25s      60s           ~3.9min
                                                                        ~31min totale

* DERIVA non ha rottura — va direttamente da densità a dissoluzione
  (oppure la rottura è un semplice fade-to-silence di 15s)
```

Questi tempi sono un punto di partenza. In performance si può skippare avanti con il tasto del motore successivo.
