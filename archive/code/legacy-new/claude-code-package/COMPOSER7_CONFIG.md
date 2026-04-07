# COMPOSER7 Config Block — da aggiungere a config.js

```js
  // ── Composer 7 (SOLCO — G Dorian, Berlin techno ipnotico 128bpm) ──
  COMPOSER7: {
    toggleKey: 'Digit7',
    bpm: 128,
    gravitationalCenter: 55, // G3
    phases: {
      germoglio:    { duration: 35,  mode: 'G_dorian',   drone: 55, arc: 'SILENCE'  },
      pulsazione:   { duration: 55,  mode: 'G_dorian',   drone: 55, arc: 'BUILDING' },
      densita:      { duration: 80,  mode: 'G_dorian',   drone: 55, arc: 'INTENSE'  },
      rottura:      { duration: 28,  mode: 'G_dorian',   drone: 55, arc: 'PEAK'     },
      dissoluzione: { duration: 65,  mode: 'G_dorian',   drone: 55, arc: 'RELEASE'  },
    },
    phaseOrder: ['germoglio', 'pulsazione', 'densita', 'rottura', 'dissoluzione'],
    sweepBars: 8,            // full velocity sweep cycle in bars
    silenceTarget: {
      germoglio: 0.40, pulsazione: 0.30, densita: 0.15,
      rottura: 0.05, dissoluzione: 0.45,
    },
    climax: {
      presagioAt:      0.15,
      infiltrazioneAt: 0.40,
      takeoverAt:      0.70,
      hardCutAt:       0.85,
    },
    voiceLeadingMax: 2,
    midiOutputName: null,
  },
```

## Note

- **La scala non cambia MAI durante le fasi** — G Dorian fisso. SOLCO è ipnotico, non modulante.
- **Il drone è G3(55)** — registro medio-basso, sotto il bass rolling.
- **`sweepBars: 8`** — configura la lunghezza del ciclo di velocity sweep del bass. Valori più bassi = sweep più veloce. 4 = acid feel. 16 = lento e profondo.
- **Durate più corte degli altri motori** — SOLCO è l'ultimo, non serve fare 5+ minuti.
- **`climax.hardCutAt: 0.85`** — il taglio netto arriva all'85% della rottura. 15% di silenzio residuo.
