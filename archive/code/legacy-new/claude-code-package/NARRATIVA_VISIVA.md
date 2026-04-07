# MACH:INE II — NARRATIVA VISIVA

## Diagnosi: perché la dinamica si è compressa

### Il problema
Le `ENGINE_PREFS` (director.js) e `ENGINE_BEHAVIORS` (midi-patterns.js) fissano per ogni engine: dotSize, densityMul, palette, camera, shape per canale, midiScale, forceInvert. Questo dà coerenza ma elimina la variazione interna. Un motore che dura 4-5 minuti con gli stessi parametri visivi perde tensione.

### Cosa sovrascrive cosa
```
DNA randomizzato  →  sovrascrito da scene  →  sovrascrito da engineRender
zone con reattività diversa  →  offuscate da densityMul fisso
scene diverse (8!)  →  sceneBoost/sceneAvoid ne ammette solo 2-3 per engine
MIDI shapes (6 pool)  →  ENGINE_BEHAVIORS fissa 1 per canale
```

Il DNA genera mondi interessanti, ma il momento in cui un engine si attiva, il director impone il suo template e la varietà collassa.


## Principio guida

**Il visual non segue la musica — respira con lei.**

Le fasi musicali (germoglio → pulsazione → densità → rottura → dissoluzione) devono guidare l'evoluzione visiva all'interno di ogni engine. Non basta che il director reagisca all'RMS audio — deve sapere in che fase narrativa si trova il compositore.


## Proposta 1: Phase-driven ENGINE_PREFS

Ogni engine non ha UN set di parametri visuali ma CINQUE — uno per fase. I valori lerpano tra di loro come le presence musicali.

```javascript
// director.js — sostituisce l'attuale ENGINE_PREFS[engine] statico
const ENGINE_VISUAL_PHASES = {
  terreno: {
    germoglio: {
      dotSize: 12, densityMul: 0.3, midiScale: 2.0,
      palette: 'default', forceInvert: null,
      shapeScale: 2.0, flickerSpeed: 0.5, midiDensityMul: 0.8,
    },
    pulsazione: {
      dotSize: 8, densityMul: 0.7, midiScale: 1.5,
      palette: 'amber', forceInvert: null,
      shapeScale: 1.5, flickerSpeed: 2.0, midiDensityMul: 0.5,
    },
    densita: {
      dotSize: 5, densityMul: 1.4, midiScale: 1.0,
      palette: 'warm', forceInvert: null,
      shapeScale: 1.0, flickerSpeed: 4.0, midiDensityMul: 0.3,
    },
    rottura: {
      dotSize: 3, densityMul: 2.0, midiScale: 0.6,
      palette: 'warm', forceInvert: false,
      shapeScale: 0.8, flickerSpeed: 8.0, midiDensityMul: 0.2,
    },
    dissoluzione: {
      dotSize: 10, densityMul: 0.4, midiScale: 1.8,
      palette: 'default', forceInvert: null,
      shapeScale: 1.8, flickerSpeed: 1.0, midiDensityMul: 0.6,
    },
  },
  // ... idem per ogni engine
};
```

**Effetto**: TERRENO in germoglio ha punti grandi e radi (respiro), in densità ha punti piccoli e densi (massa), in dissoluzione torna rado. Il visivo respira con la musica.

**Implementazione**: Il composer già espone `getComposerStatus()` con `.phase`. Il director legge questa informazione e lerpa `engineRender` tra i parametri delle due fasi adiacenti. Lerp speed = stessa della presence musicale (~0.3 per frame).


## Proposta 2: MIDI shape mutation per fase

Attualmente `ENGINE_BEHAVIORS` fissa una shape per canale per engine. Proposta: ogni canale ha una shape PER FASE.

```javascript
// midi-patterns.js
const ENGINE_PHASE_BEHAVIORS = {
  terreno: {
    0: { // KICK
      germoglio:    { shape: 'pulse',  size: 0.10, decay: 0.96 },
      pulsazione:   { shape: 'pulse',  size: 0.16, decay: 0.94 },
      densita:      { shape: 'band',   size: 0.22, decay: 0.90 },
      rottura:      { shape: 'column', size: 0.30, decay: 0.80 },
      dissoluzione: { shape: 'pulse',  size: 0.12, decay: 0.95 },
    },
    3: { // BASS
      germoglio:    { shape: 'column', size: 0.06, decay: 0.999 },
      pulsazione:   { shape: 'column', size: 0.12, decay: 0.998 },
      densita:      { shape: 'column', size: 0.18, decay: 0.996 },
      rottura:      { shape: 'blob',   size: 0.25, decay: 0.990 },
      dissoluzione: { shape: 'column', size: 0.08, decay: 0.998 },
    },
    // ...
  },
};
```

**Effetto**: Il kick di TERRENO in germoglio è un pulse discreto. In densità diventa una banda orizzontale che attraversa tutto lo schermo. In rottura diventa una colonna verticale che taglia. Lo stesso strumento cambia forma visiva nel tempo.


## Proposta 3: Composition evolution

Le COMPOSITIONS (Mondrian, Columns, Horizon...) ora sono scelte una volta per scena. Proposta: ogni engine ha una sequenza di composizioni legate alle fasi.

```javascript
const ENGINE_COMPOSITIONS = {
  terreno: {
    germoglio:    'HORIZON',      // spazio aperto, linea d'orizzonte
    pulsazione:   'ASYMMETRIC',   // peso spostato a destra
    densita:      'MONDRIAN_A',   // struttura piena
    rottura:      'COLUMNS',      // verticalità drammatica
    dissoluzione: 'ISLANDS',      // frammenti che si disperdono
  },
  cristallo: {
    germoglio:    'UNIFORM',      // vuoto totale, solo shimmer
    pulsazione:   'HORIZON',      // linea sottile
    densita:      'FRAME',        // cornice con centro vuoto
    rottura:      'ISLANDS',      // frantumazione
    dissoluzione: 'UNIFORM',      // ritorno al vuoto
  },
  vortice: {
    germoglio:    'ASYMMETRIC',
    pulsazione:   'COLUMNS',
    densita:      'MONDRIAN_B',   // pieno, strutturato
    rottura:      'DENSE',        // muro
    dissoluzione: 'SPARSE',       // dissoluzione
  },
  // ...
};
```

**Effetto**: Il layout dello schermo cambia con la fase musicale. L'audience vede lo spazio riorganizzarsi strutturalmente, non solo in densità.


## Proposta 4: Inversion come gesto narrativo

L'inversione bianco/nero è il gesto visivo più potente del sistema (Bayer dissolve è bellissimo), ma è quasi mai usata. Proposta: vincolarla a momenti musicali specifici.

```
REGOLA: Ogni engine fa UNA inversione, in un momento preciso.

DERIVA:     mai (resta nero su bianco / bianco su nero come il DNA decide)
CRISTALLO:  ingresso in pulsazione → invert (il primo beat visivo è un cambio di polarità)
ABISSO:     ingresso in densità → invert (la discesa nel buio è letterale)
TERRENO:    mai (il dub è caldo, non ha bisogno di contrasto binario)
MECCANICA:  la convergenza dei 4 layer → invert (il momento di allineamento)
VORTICE:    ingresso in rottura → invert (l'energia massima inverte tutto)
SOLCO:      mai (il mantra è ipnotico, non drammatico)
```

5 inversioni in 30 minuti. Ognuna è un evento. Se l'inversione è ovunque, non ha impatto.


## Proposta 5: Dot size breathing

Il range di dotSize deve essere molto più ampio. Attualmente ogni engine fissa un valore (3-10). Proposta: dotSize varia da 2 a 16 nell'arco di un engine.

```
germoglio:    dotSize 14-16  (pochi punti grandi, come cellule al microscopio)
pulsazione:   dotSize 8-10   (la grana si raffina)
densità:      dotSize 4-6    (texture densa)
rottura:      dotSize 2-3    (risoluzione massima, quasi pixel)
dissoluzione: dotSize 10-12  (la grana si rilassa)
```

Questo arco si sovrappone alla densityMul per creare un effetto doppio: germoglio ha punti grandi ma radi (pochi, monumentali), rottura ha punti piccoli ma densissimi (muro di pixel). La quantità di "materia" sullo schermo è simile, ma la QUALITÀ è completamente diversa.


## Proposta 6: Velocity → visual weight (rendere SOLCO visivamente ipnotico)

SOLCO ha il velocity sweep sinusoidale sul bass. Questo deve essere visivamente evidente. Attualmente velocity mappa a column width — troppo sottile.

Proposta: per SOLCO, la velocity del bass (CH3) guida direttamente un parametro visivo globale:
- `sweepVisual = bassVelocity / 127` (normalizzato)
- Questo valore modula: dotSize (±2), densityMul (×0.8→1.2), palette brightness
- Il risultato: lo schermo "respira" con il sweep del bass — più bright quando velocity alta, più scuro quando bassa
- Ciclo di 8 bar = ~15 secondi a 128bpm — il pubblico vede un'onda di luce che attraversa tutto

```javascript
// In updateDirector o renderFrame:
if (currentEngine === 'solco') {
  const sweepVel = midi.channels[3].lastVel / 127; // bass velocity
  engineRender.densityMul = baseDensity * (0.8 + sweepVel * 0.4);
  // palette bg brightness shift
  palette.bg[0] = Math.round(baseBg[0] + sweepVel * 12);
  palette.bg[1] = Math.round(baseBg[1] + sweepVel * 12);
  palette.bg[2] = Math.round(baseBg[2] + sweepVel * 12);
}
```


## Proposta 7: Camera per fase (non per engine)

La camera è fissata per engine (WIDE per TERRENO, DRIFT per DERIVA). Proposta: la camera segue la fase.

```
germoglio:    WIDE o DRIFT   (panoramico, esplorativo)
pulsazione:   MEDIUM          (si avvicina)
densità:      MACRO           (dentro la texture)
rottura:      DRIFT + shake   (instabile)
dissoluzione: WIDE            (si allontana)
```

Ogni engine ha ancora una preferenza (ABISSO preferisce DRIFT, VORTICE preferisce MEDIUM), ma la fase la muove. L'effetto: il pubblico sente di "entrare" nella musica durante la densità e "uscire" durante la dissoluzione.

L'attuale `cameraAllow` set limita troppo. Proposta: ogni engine definisce una camera preferita per ogni fase, e la transizione tra fasi include un cambio camera.


## Proposta 8: Zone reattività legata alla fase

Le zone DNA hanno `reactivity` (0-1) randomizzato. Proposta: la reactivity di tutte le zone scala con la fase musicale.

```javascript
// Reattività globale per fase
const PHASE_REACTIVITY_SCALE = {
  germoglio:    0.3,   // quasi tutto è statico, solo le zone RITMICO rispondono
  pulsazione:   0.6,   // metà campo reagisce
  densita:      1.0,   // tutto reagisce
  rottura:      1.5,   // over-reattivo, anche le zone RAREFATTO si muovono
  dissoluzione: 0.4,   // il campo si calma
};

// In computeDensity:
const phaseReactScale = PHASE_REACTIVITY_SCALE[currentPhase] || 1.0;
const r = zone.reactivity * phaseReactScale;
```

**Effetto**: In germoglio gran parte dello schermo è statica — solo piccole isole rispondono all'audio. In rottura tutto vibra. Questo crea un range enorme tra la calma di germoglio e il caos di rottura.


## Proposta 9: Spazio negativo musicalmente guidato

Il VUOTO primitivo è potente ma la sua posizione è random. Proposta: nelle fasi germoglio e dissoluzione, il VUOTO è grande e centrale. In densità si contrae e va in periferia. In rottura scompare.

```javascript
// In updatePrimitives, se VUOTO è presente:
const voidScale = {
  germoglio: 1.5, pulsazione: 1.0, densita: 0.4, rottura: 0.0, dissoluzione: 1.2
};
dna.vuoto.size = baseSize * (voidScale[currentPhase] || 1.0);
```

Inoltre: durante le transizioni tra engine, un VUOTO si espande dal centro fino a coprire quasi tutto lo schermo (densityCap → 0), poi si contrae rivelando il nuovo mondo visivo. È l'equivalente visivo del "respiro" tra due motori.


## Proposta 10: Trail length dinamico

`MAX_TRAIL = 64` è fisso. In un motore denso a 138bpm (VORTICE) le note si mangiano a vicenda. In uno lento (CRISTALLO a 54bpm) la trail è corta.

```javascript
const PHASE_TRAIL_SCALE = {
  germoglio: 0.5, pulsazione: 1.0, densita: 1.5, rottura: 2.0, dissoluzione: 0.7
};
const maxTrail = Math.round(baseTrail * phaseTrailScale * bpmFactor);
// bpmFactor: 54bpm → 1.5 (più tempo per nota), 138bpm → 0.7 (note più rapide)
```


## Priorità di implementazione

1. **Phase-driven ENGINE_PREFS** (Proposta 1) — il cambio più impattante, sblocca la variabilità interna
2. **Dot size breathing** (Proposta 5) — secondo impatto maggiore, cambia completamente la texture
3. **Composition evolution** (Proposta 3) — il layout che cambia è immediatamente visibile
4. **Inversion come gesto** (Proposta 4) — poche righe di codice, enorme impatto drammatico
5. **Camera per fase** (Proposta 7) — la sensazione di entrare/uscire dalla musica
6. **Zone reactivity scaling** (Proposta 8) — amplifica la differenza tra fasi
7. **MIDI shape mutation** (Proposta 2) — variazione fine ma importante nel tempo
8. **SOLCO velocity visual** (Proposta 6) — specifico per un engine ma molto espressivo
9. **Spazio negativo** (Proposta 9) — elegante, serve per le transizioni
10. **Trail length** (Proposta 10) — ottimizzazione che migliora la leggibilità


## Comunicazione tra composer e director

Il punto tecnico cruciale: il director attualmente non sa in che fase si trova il composer. L'`arc.phase` del director (SILENCE/BUILDING/ACTIVE...) è guidato dall'RMS audio, non dalla fase musicale. Servono due cose:

1. Ogni composer deve esporre la fase corrente via `getComposerStatus().phase`
2. Il director deve leggere questo dato e usarlo per guidare i parametri visuali

Questo è già parzialmente implementato (i composer hanno tutti `.phase` nello status), ma il director non lo usa. Il collegamento mancante è:

```javascript
// director.js — dentro updateDirector():
const engine = getEngine();
const status = engine ? getEngineStatus(engine) : null;
const musicalPhase = status?.phase || 'germoglio';
const visualParams = ENGINE_VISUAL_PHASES[engine]?.[musicalPhase];
if (visualParams) {
  // lerp engineRender verso visualParams
  for (const key of Object.keys(visualParams)) {
    if (typeof visualParams[key] === 'number') {
      engineRender[key] += (visualParams[key] - engineRender[key]) * 0.05;
    }
  }
}
```

La funzione `getEngineStatus()` va aggiunta come dispatcher che chiama il giusto `getComposerXStatus()` in base all'engine attivo.
