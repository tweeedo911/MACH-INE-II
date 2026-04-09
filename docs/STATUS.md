# STATUS — MACH:INE III

> Snapshot vivo. Rigenerato a fine sessione. Punto di entrata di ogni nuova sessione.
> **Last updated:** 2026-04-09 (sessione 5: comp-solco integrazione proto v7 + ridisegno scena)

## ⚠️ Limiti noti (post A.2)

- **Firma `gelo` / `convergenza` non hanno effetto visibile.** Motivo: le
  comp-* renderizzano solo trail freschi (< 2 frame), non esistono ancora
  fossil/ghost persistenti su cui la firma possa agire. Il cablaggio è a
  posto (`field.js`, `event-register.js`) ma non ha target visivi. Si
  risolve naturalmente in **Fase A.3/A.4** quando le comp-* consumeranno
  i `LifecycleEvent` persistenti.
- **Firma `vuotoTotale` (V) funziona** perché ha early-out in `render.js`.

### Elementi che DEVONO reagire a firma (da cablare in A.3/A.4)

| Firma | Target elementi | Come reagiscono |
|---|---|---|
| **gelo** (G) | `LifecycleEvent[]` (stable/ghost/fossil), ghost layer canvas, fossil layer canvas, sediment offscreen, onsetWaves residui | Freeze età (`e.age` non avanza), freeze decay sediment, freeze transizione stati newborn→stable→ghost→fossil. Il frame resta "cristallizzato" finché gelo è attivo. |
| **convergenza** (J) | Tutte le posizioni normalizzate `nx/ny` degli eventi in **tutti i layer** (FG/MG/Overlay) + position bias nelle comp-* al momento di spawn | Attrazione verso (0.5, 0.5) a rate `dt * 0.3`. Deve essere visibile come implosione graduale della composizione. Richiede che comp-* leggano `event.nx/ny` per decidere dove disegnare (non calcolino da `n.note` come adesso). |
| **vuotoTotale** (V) | Già OK in `render.js` | Blackout totale + MIDI all-notes-off. |
| **densityCap** (auto) | Gate su `onMidiNote`/`onAudioOnset` + birth rate interno dei comp-* | Moltiplicatore probabilistico 0..1. Usato da `setOpeningRamp` / `setClosingFade`. Cablato già in render.js. |

---

## Versione

**v3.4.2** — single source: `src/VERSION.js` (`APP_VERSION`)

Tag git: `v3.4.2` su `ccbbb13`.
HEAD: `16abb8e` (Visual Bible Fase A.4 — tutte le 6 comp migrate).
Branch attivo: `machine-iii` (14 commit avanti su `origin/machine-iii`, mai pushato).

---

## Architettura attiva

**Pattern:** Band con Direttore (Path B confermato — vedi `DECISIONS.md #004`)

```
director3.js      →  5 moduli musicali (rhythm, harmony, bass, melody, texture)
                  →  6 composizioni visive (comp-griglia/liminale/linee/negativo/quadrati/treno)
                  →  firma.js (gesti narrativi: gelo/convergenza/vuotoTotale/densityCap)
                  →  world-state.js (stato condiviso musica↔visual)
                  →  tracks.js (7 tracce con modeHint)

event-register.js →  LifecycleEvent store unificato (newborn→stable→ghost→fossil)
                  →  CH_ROLE map + ROLE_LIFECYCLE per ruolo (kick/perc/drone/bass/
                     chord/voice/lead/arp) — Bible §16.1

layers.js         →  4 layer canonici stackati (BG/MG/FG/Overlay) — Bible §5
                  →  infrastruttura pronta, consumata da A.4 comp-* migrate
```

**Moduli:** 32 vivi in `src/` (2 archiviati in A.2: `dna.js`, `generations.js`),
16 totali in `archive/code/dead-islands/`.

**A/B/C framework:** flag `CFG.MUSIC_EXPERIMENT` / `CFG.MUSIC_STRUCTURAL` in `config.js` selezionano variante hard-switch (no crossfade).

---

## Stato runtime (ultimo check: 2026-04-07)

| Verifica | Stato |
|---|---|
| `health-check.sh` (import, magic numbers, file size) | ✅ verde |
| HTTP smoke test (`/`, `/src/main.js`, `/src/VERSION.js`) | ✅ 200 |
| `launch.sh` banner versione dinamico | ✅ legge `VERSION.js` |
| firma reattivata + wired (G/J/V live) | ✅ |
| char-note boost armonico (modal characteristic) | ✅ wired in `harmony.js` |
| Test runtime live (utente, ascolto) | ✅ confermato funzionante |

---

## File pesanti da tenere d'occhio (>500 LOC)

```
1077  src/config.js     ← OK, è la single source dei numeri (per design)
 618  src/tracks.js     ← OK, 7 tracce × multi-fase
 521  src/director3.js  ← valutare split: scheduler vs density vs phases
 503  src/melody-v3.js  ← valutare split A/B/C in moduli condivisi
```

---

## Prossimo (priorità top→bottom)

### P0 — comp-solco.js: ridisegno scena (fisica sbagliata identificata)

**Stato:** proto v7 integrato in comp-solco.js (sessione 5). Funziona ma la fisica del basso è sbagliata.
Il sistema ZOS/ZOM (colonna che respira) è la fisica di RESPIRO, non di SOLCO.

**Visione ridisegnata (da prototipare):**
- Scena: vuoto sopra (85%) + geologia compressa sotto — Grand Canyon in sezione
- Bass = monolite arancione che cade dall'alto (non colonna spaziale)
- Kick = frattura sismica alla linea di impatto (Y≈0.62), non fronti ascendenti
- Chord = lastre lime a pitch-mapped height, scivolano giù insieme
- Voice = traccia sismografica (appare+svanisce al pitch, non cade)
- Arp = polvere di impatto, dot piccoli che cadono lenti

**Prossimo:** prototipo HTML standalone con nuova fisica → validazione → integrazione in comp-solco.js

### P0b — Visual System Bible Fase A.4 ✅ COMPLETA
Tutte le 6 comp migrate al layer stack 4-canonico (commit `16abb8e`).
**✅ Testato live 2026-04-07 — comportamento identico all'originale su tutte le tracce.**

| Comp | BG | MG | FG | OVERLAY | Sediment |
|---|---|---|---|---|---|
| negativo | ✓ | shadow (fresh) | buchi (cam) | memoria buchi | OVERLAY |
| liminale | ✓ | zones (fresh) | dots (cam) | trails α×0.6 | OVERLAY |
| griglia | ✓ | afterglow (persist) | celle (cam) | — | MG |
| linee | ✓ | noise (fresh) | linee (cam) | — | privato (screen) |
| quadrati | ✓ | breath (fresh) | blocchi+arp (cam) | sediment α0.5 | OVERLAY |
| treno | ✓ | breath (fresh) | oggetti (cam) | — | privato (frame-cap) |

### P1 — Integrazione comp-solco.js (dopo validazione proto)
Quando il proto è validato: portare la fisica gaussiana in `comp-solco.js`.
Richiede piano preciso — `comp-solco.js` usa ancora peg-and-string con ANCHORS.
Consultare `docs/VISUAL-VISION.md §6` per il processo di integrazione.

### P2 — Visual System Bible Fase B / C
3. ✅ **Rupture 4 stadi — Fase B completa** — tutte le 6 comp-* migrate da
   `isRottura` (bool) a `rupture.intensity` (0→1 smooth). **Test live necessario.**
4. ✅ **Memoria inter-traccia** — `_sharedSediment` decay 0.9997/frame (half-life ~38s),
   deposito continuo per-frame (palimpsesto). Parametri in `CFG.VISUAL.sediment`.
5. ✅ **trackPalettes Bible §12** → `worldState.palette`. Colori live: accettati.
6. ✅ **Crossfade transizioni** — 3s ease-in-out cubico (era hard cut). `CFG.VISUAL.trackFadeDuration`.
7. ✅ **Micro-glitch ritmo-gated** — solo quando `rhythmicity > 0.4`, raro. `CFG.VISUAL.glitch`.

### P3 — ✅ COMPLETATO (era P2)
8. ✅ **Enrich comp-quadrati** — breathing 3×, rhythm density boost, arp sediment.
9. ✅ **Enrich comp-negativo** — breathing Bayer MG, bass holes in densita, closeSpeed per-buco.
10. ✅ **Zone Bayer coerenti con density** — `density.X` come floor dinamico in tutte le 6 comp.
11. ✅ **Glitch layer meno è più** — da 5 a 4 modi, tutti sottrattivi.

### P3 — debiti tecnici
1. Test live completo: rupture Fase B gradualità, sediment palimpsesto, crossfade 3s, glitch ritmico, enrich comp-*
2. **Test ghost/fossil aging curve** (`field.js`) — rimandato: sarà visibile dopo pitch→Y + identità bioma. Verificare: dot crescono 2px→14px, sfumano verso `residual` traccia. Debug: `import('/src/event-register.js').then(m => setInterval(() => console.log(m.getEventStats()), 500))` in console.

**P3 — FIX RUPTURE VISIBILITÀ — valori esatti, pronti per implementazione**

**a. ruptureTint (config.js ~975-1018) — 3 righe, zero rischio:**
   | Traccia | Riga | Valore attuale | → Nuovo valore | Motivazione |
   |---|---|---|---|---|
   | NEBBIA | ~975 | `'#F3F0EA'` | `'#00BFFF'` | deep sky blue — taglia la nebbia calda |
   | RESPIRO | ~996 | `'#6E7E8B'` | `'#CCFF00'` | chartreuse acido — shock su ink-black/sage |
   | TEMPESTA | ~1010 | `'#F8FF2B'` | `'#FF0040'` | rosso allarme puro — massimo contro paper-white |

**b. Multiplier ruptI (comp-*.js) — 4 righe, zero rischio:**
   | File | Riga | Attuale | → Nuovo |
   |---|---|---|---|
   | `comp-griglia.js` | 171 | `ruptI * 0.01` | `ruptI * 0.08` |
   | `comp-quadrati.js` | 206 | `ruptI * 0.08` | `ruptI * 0.30` |
   | `comp-treno.js` | 137 | `lerp(1.0, 1.04, ...)` | `lerp(1.0, 1.18, ...)` |
   | `comp-liminale.js` | 214 | `lerp(1.0, 1.5, ruptI)` | `lerp(1.0, 3.0, ruptI)` |

**c. BG shift su takeover (P4d — richiede codice, non config-only):**
   - `config.js`: aggiungere `ruptureBg` per traccia (hex del BG al takeover)
   - `director3.js:113`: `worldState.palette.ruptureBg = tp?.ruptureBg ?? null`
   - `colors.js:updateColors()`: quando `ri > 0.6`, lerp `_target.bg` → `hexToRgb(p.ruptureBg)`
   → Rimandato a P4d (Color Grammar), non blocca P3a/b
2. ✅ **Fix doc** — `03-VISUAL.md` mapping comp↔traccia corretto
3. ✅ **Fix CH7=arp** — `comp-quadrati.js` (era CH6 primario, ora CH7)
4. ✅ **Ghost/fossil overlay** — `field.js` consuma event-register, sblocca firma gelo/convergenza
5. **Calibrazione ghost/fossil** — test live, aggiustare densità/blend in `CFG.VISUAL.ghostOverlay`
6. Push 14+ commit + apertura PR verso `main`
7. Refactor `director3.js` (521 LOC): split scheduler/density/phases
8. Refactor `melody-v3.js` (503 LOC): estrarre logica comune A/B/C
9. Profilo CPU su Chrome DevTools: target costante 60fps su 60min

### P4 — esperimenti / esplorazione
13. RITM-05 break ciclico kick+basso (130 LOC in `archive/.../rhythm-layer.js`) — solo se servono respiri ritmici
14. Crossfade smooth A→B→C via `presence-multiplier` (in `archive/.../presence-multiplier.js`) — solo se hard-switch dà fastidio in live

### P4c — Geometric Language per traccia (pianificare DOPO Sprint B visivo)
> Sistema geometrico per traccia: ogni traccia ha un vocabolario di forme, movimenti e
> regole di composizione coerenti con l'energia musicale e le parti MIDI suonate.
> Ispirato all'arte astratta (Suprematismo, Bauhaus, Costruttivismo, Arte Concreta).
> Non toccare prima di Sprint B. Richiedono piano dedicato.

18. **Vocabolario forme per traccia** — ogni track ha forma primaria + movimento proprio:
    - NEBBIA: cerchi/archi concentrici (Kandinsky Komposition) — deriva radiale lenta
    - TESSUTO: bande orizzontali per pitch (Mondrian/Agnes Martin) — scorrimento laterale
    - SOLCO: rettangoli floating beat-locked (Malevich Suprematismo) — pulsazione griglia
    - RESPIRO: campo vuoto + buchi (Malevich Black Square + Kenya Hara) — sottrazione
    - MACCHINA: colonne caratteri/celle + scan line (El Lissitzky/Bauhaus) — clock-synced
    - TEMPESTA: vettori diagonali sovrapposti (Moholy-Nagy/Costruttivismo) — collisione piani
    - RITORNO: strati traslucidi sovrapposti (Klee/Schwitters) — riemersione dal sediment
    File: `comp-*.js`, `config.js` (CFG.VISUAL.trackGeometry)

19. **Energia → trasformazione geometrica** — non solo densità ma morfologia:
    - Velocity bassa: forma pura, rada, leggibile (Malevich essenziale)
    - Velocity alta: forma moltiplicata, pressione compositiva
    - Rupture: deformazione della grammatica stabilita (UVA rule→violation)
    File: tutte le `comp-*.js`

20. **Lifecycle per canale MIDI** — ogni ruolo ha durata vita propria:
    - kick/pulse (CH0): 3-4 frame (lampo)
    - bass (CH3): 80-120 frame (peso che rimane)
    - drone (CH2): 400-600 frame (presenza continua)
    - arp (CH7): 12-20 frame (scintilla veloce)
    - chord (CH4): 60-90 frame (campo che respira)
    File: `event-register.js`, `config.js`

21. **Pitch → posizione Y in tutte le comp-*** — grammatica fondamentale:
    grave = basso, acuto = alto. Attualmente solo in comp-linee.
    File: tutte le `comp-*.js`

### P4d — Color Grammar (pianificare insieme a P4c — interdipendenti)
> Il sistema colore v3 ha le fondamenta giuste (5 ruoli, lerp, trackPalettes)
> ma manca di tre cose: identità cromatica per canale MIDI, trasformazione
> attiva alla rupture, e residual usato per ghost/fossil.
> NON toccare prima di P4c (lifecycle per canale dipende da questi colori).

22. **Colore per canale MIDI nel LifecycleEvent** — ogni evento porta al momento
    dello spawn il colore del suo ruolo (CH0=pulse, CH3=bass, CH7=arp, ecc.)
    derivato dalla palette della traccia corrente. Il colore persiste e decade
    verso bg lungo il lifecycle — non segue i cambi di palette successivi.
    Prerequisito di P4c item 20 (lifecycle durations per canale).
    File: `event-register.js`, `colors.js`, `config.js` (CFG.VISUAL.roleColors)

23. **Rupture takeover = flood cromatico attivo** — `rupture.intensity` al
    takeover non solo lerpa dot→ruptureTint, ma amplifica saturation/luminosità
    di `accent` e `ruptureTint`. Al rilascio: collasso rapido (rate configurabile).
    Analogia: il climax del vecchio piano (amplificazione positiva, non sola desaturazione).
    File: `colors.js` (updateColors), `config.js` (CFG.VISUAL.rupture.floodAmount)

24. **palette.residual → ghost/fossil overlay** — i dot ghost/fossil in `field.js`
    usano attualmente `lerp(dot→bg)`. Devono usare `palette.residual` (colore
    dedicato per memoria visiva). Permette ghost di una traccia di rimanere
    cromaticamente distinti dal dot della traccia successiva.
    File: `field.js` (ghost overlay pass), `director3.js` (set residual per traccia)

25. **Saturazione trackPalettes** — confronto screenshot v2: le palette attuali
    sono probabilmente troppo desaturate. Rivedere i valori hex in `config.js`
    (trackPalettes per le 7 tracce) aumentando saturazione vivida mantenendo
    coerenza estetica. Da fare DOPO aver visto live l'effetto di GC-22/23.
    File: `config.js` (CFG.VISUAL.trackPalettes)

### P4e — Camera per traccia
> L'infrastruttura esiste: `worldState.camera`, `applyCameraTransform` in visual-toolkit.js,
> `acts[N].camera` in config.js (WIDE/DRIFT/MEDIUM per atto). Ma director3.js non pilota
> mai worldState.camera — ogni comp-* gestisce la propria camera locale.
> Il collegamento è piccolo ma director3.js è protetto → richiede pianificazione precisa.

26. **Collegamento acts.camera → worldState.camera.mode** (director3.js protetto):
    - `director3.js`: al cambio di atto, leggere `CFG.VISUAL.acts[newAct].camera`
      e scrivere `worldState.camera.mode = ...`
    - Ogni `comp-*.js`: leggere `worldState.camera.mode` come parametro di profilo
      (WIDE = zoom 1.0 drift lento, DRIFT = zoom 0.98 oscillazione media, MEDIUM = zoom 1.03 stabile)
    - I profili per comp-* vanno in `config.js` (CFG.VISUAL.cameraModes)
      così comp-* leggono parametri, non hard-code logica di modo
    - Variazione per traccia (oltre che per atto): director3.js può sovrascrivere
      il modo dell'atto con il modo della traccia corrente se diverso
    File: `director3.js` (protetto), `visual-toolkit.js`, `config.js`, tutte le `comp-*.js`
    Nota: pianificare diff preciso su director3.js PRIMA di toccare

### P4b — World Grammar (pianificare DOPO Sprint A+B visivo)
> Recupero concetti v2: spazi abitabili con fisica propria, profondità di scala, ASCII depth.
> Non toccare prima di Sprint B completato. Richiedono piano dedicato.

15. **World Physics per traccia** — `worldState.physics` (gravityDir, terrainZone, fossilStyle)
    Terrain = `_sharedSediment` con Y-gradient decay (suolo accumula più a lungo, alto decade veloce).
    Fossili cristallizzano in zona terrain invece di svanire.
    File: `field.js`, `world-state.js`, `director3.js`

16. **Multi-scale halftone** — Bayer cell size variabile per zona Y del canvas:
    bottom (terrain) → 8×8+ (blocchi grandi), mid → 4×4, top/sparse → 2×2 (puntini fini).
    Dot size come proxy di distanza/peso visivo.
    File: `field.js`

17. **ASCII depth zones** — a densità bassa, caratteri `. , : ; + # @` sostituiscono i dot Bayer.
    Collega ARTISTIC-GAPS WG-3 (Henke text-mode comp-griglia, esteso a tutte le comp-*).
    File: `field.js` (base), poi comp-griglia.js (implementazione Henke completa)

---

## Sequenza sessioni — piano implementazione

> Ogni sessione è autonoma. Implementazione meccanica: file + riga + valore.
> Nessuna esplorazione durante il codice — tutto già specificato qui.

### Sessione 1 — Rupture visibilità (7 righe, 5 file, zero rischio)
**File: `config.js` — 3 sostituzioni:**
- riga ~975: `rupture: '#F3F0EA'` → `rupture: '#00BFFF'` (NEBBIA)
- riga ~996: `rupture: '#6E7E8B'` → `rupture: '#CCFF00'` (RESPIRO)
- riga ~1010: `rupture: '#F8FF2B'` → `rupture: '#FF0040'` (TEMPESTA)

**File: `comp-griglia.js:171`** — `ruptI * 0.01` → `ruptI * 0.08`
**File: `comp-quadrati.js:206`** — `ruptI * 0.08` → `ruptI * 0.30`
**File: `comp-treno.js:137`** — `lerp(1.0, 1.04,` → `lerp(1.0, 1.18,`
**File: `comp-liminale.js:214`** — `lerp(1.0, 1.5, ruptI)` → `lerp(1.0, 3.0, ruptI)`

Test live dopo. Calibrare se valori sembrano troppo aggressivi.

---

### Sessione 2 — Rupture BG shift (P3c / P4d prerequisite)
**`config.js`** — aggiungere `ruptureBg` a ogni trackPalette (valori da definire session 2):
suggerimenti base: versione desaturata/invertita del bg corrente per traccia
**`director3.js:113`** — aggiungere riga: `worldState.palette.ruptureBg = tp?.ruptureBg ?? null;`
**`colors.js:updateColors()`** — aggiungere dopo riga 61:
```js
if (p.ruptureBg) {
  const ri = worldState.rupture?.intensity ?? 0;
  if (ri > 0.6) {
    const rbg = hexToRgb(p.ruptureBg);
    const t = (ri - 0.6) / 0.4;
    for (let i = 0; i < 3; i++) _target.bg[i] = _target.bg[i] + (rbg[i] - _target.bg[i]) * t;
  }
}
```
**`world-state.js:75`** — aggiungere `ruptureBg: null` alla palette default

---

### Sessione 3 — Lifecycle + Color per canale (GL-1 + GC-1)
> Modificano entrambi event-register.js — fare in un'unica sessione.

**`config.js`** — aggiungere in CFG.VISUAL:
```js
roleLifecycle: { pulse:4, grain:300, drone:500, bass:100, chord:75, voice:40, lead:35, arp:16 },
roleColors: {
  pulse: null,   // usa dot traccia
  grain: null,
  drone: 'accent',    // usa accent traccia
  bass:  'accent',
  chord: 'dot',
  voice: 'event',
  lead:  'event',
  arp:   'event',
}
```
**`event-register.js`** — alla creazione evento: legge `CFG.VISUAL.roleLifecycle[role]` per maxAge,
legge `CFG.VISUAL.roleColors[role]` per scegliere quale campo di palette usare come color spawn.
Aggiungere campo `spawnColor: [r,g,b]` all'evento, calcolato al momento spawn da getPalette().

---

### Sessione 4 — Pitch → Y in tutte le comp-* (GL-2)
> Stesso pattern in 5 file: usare `(1 - note.pitch/127)` come fattore Y (0=top, 1=bottom).
> Ogni comp ha già un punto di spawn — aggiungere `const spawnY = H * (1 - n.pitch/127)`.
> Solo per gli elementi "vivi" (FG layer), non per il campo Bayer globale.
**File:** `comp-liminale.js`, `comp-quadrati.js`, `comp-negativo.js`, `comp-griglia.js`, `comp-treno.js`
(comp-linee già lo fa — skippa)

---

### Sessione 5 — Sprint B visivo core

**5a. Density cap per traccia** — aggiungere `densityCap` in `CFG.VISUAL.trackGeometry` (config.js)
e leggere in ogni `comp-*.js` come moltiplicatore max su `_params.density`:
| Traccia | Cap | Fonte |
|---|---|---|
| RESPIRO | 0.10 | Kenya Hara — Ma |
| RITORNO | 0.12 | (simile a RESPIRO — memoria quieta) |
| NEBBIA | 0.25 | Hara gradiente |
| TESSUTO | 0.45 | Hara gradiente |
| SOLCO | 0.50 | Hara gradiente |
| MACCHINA | 0.55 | Hara gradiente |
| TEMPESTA | 0.70 | Hara gradiente (100% solo rupture takeover) |
File: `config.js` (nuova sezione CFG.VISUAL.densityCap), tutte le `comp-*.js` (1 riga di guard)

**5b. Hard cut selettivo** — in `field.js` nella logica crossfade:
Condizione: se `nextTrack === 'TESSUTO' && prevTrack === 'NEBBIA'` → skip crossfade, hard cut
Condizione: se `nextTrack === 'RITORNO' && prevTrack === 'TEMPESTA'` → skip crossfade, hard cut
Le altre transizioni mantengono crossfade 3s.
File: `field.js` (funzione crossfade/transizione traccia — identificare la riga esatta in sessione)

**5c. Black frame** — in `field.js` alla transizione traccia, prima del crossfade:
2 frame consecutivi di `ctx.fillStyle = '#000000'; ctx.fillRect(0,0,W,H)` + `ctx.clearRect`
Poi parte il crossfade (o hard cut per 5b).
File: `field.js`

**5d. Risograph misregistration** — in ogni `comp-*.js`, al render dell'accent color:
offset spawn di +1 o +2 celle Bayer rispetto al primary dot.
Parametro: `CFG.VISUAL.risographOffset: 2` (in pixel)
Pattern: `x + CFG.VISUAL.risographOffset` per il layer accent nei render calls.
File: tutte le `comp-*.js`, `config.js`

---

### Sessione 6+ — Sprint A musica, Sprint E geometria, World Grammar
> Pianificare in dettaglio DOPO sessioni 1-5 completate e testate live.

---

## Aree protette (chiedere PRIMA di toccare)

- `main.js` / `render.js` / `director3.js` — relazioni intricate
- `audio.js` — history buffer, onset detection
- Narrativa: arco narrativo → arco visivo, **rupture (4 stadi: omen→infiltration→takeover→residue)**
- Camera logic legata all'arco

---

## Riferimenti rapidi

| Per sapere... | Leggi... |
|---|---|
| Cosa è successo nelle sessioni passate | `docs/WORKLOG.md` |
| Perché abbiamo scelto X | `docs/DECISIONS.md` |
| Vision / principi non negoziabili | `docs/00-VISION.md` |
| Architettura, file map, anti-pattern | `docs/01-ARCHITECTURE.md` |
| Teoria musicale, modi, fasi | `docs/02-MUSIC.md` |
| Sistema visivo, DNA, comp | `docs/03-VISUAL.md` |
| Regole (versioning, commit, style) | `docs/04-RULES.md` |
| Roadmap strategica (milestone) | `docs/05-ROADMAP.md` |
| Routing skill / agenti | `docs/06-AGENTS.md` |
| Gap artistici + strategia prossima milestone | `docs/07-ARTISTIC-GAPS.md` |
| Comportamenti morti riusabili | `SALVAGE.md` (in root) |

---
<!-- knowledge-graph links -->
[[DECISIONS]] [[WORKLOG]] [[01-ARCHITECTURE]] [[VISUAL-VISION]] [[05-ROADMAP]] [[06-AGENTS]]
