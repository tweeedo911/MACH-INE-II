# MACH:INE II v4 — Visione Integrata

*Sintesi della ricerca artistica musicale e visiva — 2026-04-04*
*Questo documento è il progetto architettonico per la v4.*

---

## Filosofia

**v3** ha costruito l'infrastruttura: 7 motori, MacroComposer 4D, layer system, arco narrativo.
**v4** è il salto qualitativo: da "sistema generativo che funziona" a "performance che emoziona".

Il modello non è più il concerto classico ma il **DJ set di Four Tet al Brixton** incrociato con **Promises di Floating Points**: pazienza, ripetizione come materiale, groove ipnotico, silenzi che pesano più delle note. I visual non "reagiscono" alla musica — sono un secondo performer con la propria voce.

### Tre principi

1. **Meno è di più.** Ogni nota, ogni punto sullo schermo deve guadagnarsi il diritto di esistere.
2. **Il silenzio è composizione.** I vuoti strategici sono più potenti dei pieni.
3. **Contrappunto audio-visivo.** Musica e immagine non sempre concordano — a volte il contrasto crea tensione.

---

## Struttura: 48 minuti, 5 Movimenti, 5 Onde di Tensione

```
Tensione (0-1):

1.0  |                                          *****
     |                              ****        *   *
0.8  |                    ***      *    *      **     *
     |                   *   *    *      *    *        *
0.6  |           **     *     *  *        *  *          *
     |          *  *   *       **          **            *
0.4  |     *   *    * *                                   *
     |    * * *      *                                     *
0.2  |   *   *                                              **
     |  *                                                     ***
0.0  |*                                                          ****
     +----+----+----+----+----+----+----+----+----+----+----+----+---
     0    4    8   12   16   20   24   28   32   36   40   44   48
                              Minuti
```

Ogni onda raggiunge un picco più alto della precedente. Le valli si alzano fino all'onda 4 (false resolution), poi la 5ª crolla a zero.

---

## I 5 Movimenti

### I. EMERSIONE (0:00–10:00) — "La prima luce"

**Emozione:** Fiducia, curiosità. L'ascoltatore entra in uno spazio. Niente fretta.
**Riferimenti:** Nils Frahm (felt piano), Floating Points (Promises), Sakamoto (12)

| Parametro | Valore |
|-----------|--------|
| Modo | A Lydian |
| BPM | 84 (di riferimento — nessun beat udibile) |
| Canali attivi | CH2 (drone), CH5 (voice rarissima), CH4 (singolo accordo tenuto) |
| Silence ratio | 0.88 → 0.75 |
| Velocity range | 25–55 (pp → mp) — Frahm principle |
| rhythmicDensity | 0.00 |
| harmonicColor | 0.00 → 0.10 |

**Chiave musicale:**
- Drone A3 (57), rinnovato ogni 17 step (loop primo). Ottava A4 prob 0.60.
- Voice: prob 0.08/step, vel 25-45. Qui viene catturato il seed motif (5-7 note).
- Un solo accordo (A Lydian tonic) tenuto per 16-32 bar. Nessuna progressione.
- **Il hat NON c'è ancora.** La sua prima apparizione (~8:00) è un evento, non un default.
- Pitch bend drift sul drone: ±15 cents, periodo 16-32 bar — il drone "respira".

**Visual:**
- Schermo nero → i primi punti appaiono alla soglia di percezione (densità al densityVoidThreshold).
- **DERIVA visiva**: feedback massimo (decay 0.97) con lento drift. Tutto è nebbia.
- Nessun bordo netto. Nessun evento localizzato. Densità uniforme che ondeggia.
- Colore: quasi monocromatico, virato verso ghiaccio pallido.
- Camera: DRIFT impercettibile (0.001 px/frame).
- **Tecnica nuova: Grid distortion lenta** — onda sinusoidale che deforma la griglia Bayer, periodo ~30s.

**Transizione verso Mov. II:** Cross-dissolve lentissimo (60 secondi). La nebbia si popola di texture.

---

### II. TESSUTO (10:00–20:00) — "La trama si addensa"

**Emozione:** Calore, accumulo. Qualcosa vuole muoversi ma non ha ancora deciso come.
**Riferimenti:** Four Tet (There Is Love In You), Jon Hopkins (texture→ritmo continuum)

| Parametro | Valore |
|-----------|--------|
| Modo | A Lydian (10:00–14:00) → Bb Phrygian (14:00–20:00) |
| BPM | 84 → 88 (impercettibile, +4 in 10 min) |
| Canali attivi | +CH1 (grain come texture), +CH3 (basso sparse), +CH0 (primo kick a 18:00) |
| Silence ratio | 0.75 → 0.50 |
| rhythmicDensity | 0.00 → 0.15 |
| harmonicColor | 0.10 → 0.35 |

**Chiave musicale:**
- **CH1 GRAIN entra a ~10:00** come texture (timing random, vel 15-25, cluster [36,38,40,42]). NON ritmico — è "room tone" alla Burial.
- Accordi: 1 ogni 8 bar, shell voicing (3 note max). **Additive entry**: root sola → root+5ª → root+3ª+5ª su 16 bar (Reich principle).
- **Cambio modale a ~14:00**: A Lydian → Bb Phrygian. Prima sorpresa armonica del set. Pivot su A3.
  - Preparazione: 4 bar prima, drone suona sia A3 sia Bb2 (9ª minore — teso ma non aspro a bassa velocity).
  - L'A3 sfuma, Bb diventa nuova radice. "Drift modulation" Floating Points.
- **Primo kick a ~18:00**: 1 colpo ogni 4 bar, vel 55. È un evento, non un pattern.
- Voice più attiva (prob 0.15), frasi di 4 note (variazioni del seed motif).

**Visual:**
- Transizione da CRISTALLO a TERRENO: il bianco si scalda in ambra gradualmente.
- **Feedback con shimmer** per CRISTALLO: decay oscillante, vecchi punti scintillano.
- La densità aumenta dal basso (stratificazione verticale: terra pesante, cielo leggero).
- **Reaction-diffusion** a 64×64 come modulatore di densità sottile (tipo spot Turing, ciclo 2 min).
- Moire appare quando TERRENO prende il sopravvento: due griglie Bayer a scale lievemente diverse creano strati geologici.
- Camera: WIDE → leggero MEDIUM.

---

### III. SOLCO (20:00–32:00) — "Il corpo si muove"

**Emozione:** Drive, inevitabilità. Ma ci sono valli nelle montagne.
**Riferimenti:** Four Tet Brixton groove, Hopkins build, Reich phase shifting

| Parametro | Valore |
|-----------|--------|
| Modo | Bb Phrygian (20:00–24:00) → D Dorian (24:00–32:00) |
| BPM | 88 → 100 (graduale, +1 BPM/min) |
| Canali attivi | Tutti — CH7 percussion entra |
| Silence ratio | 0.50 → 0.20 |
| rhythmicDensity | 0.15 → 0.70 |

**Tre sotto-sezioni:**

**III-a Groove Establishment (20:00–24:00)**
- Kick si solidifica: broken2 → broken4 → halftime 4/4
- Hat si aggancia alla griglia 8th (vel 45-70)
- Basso diventa melodico (7-step loop, vel 55-70)
- Accordi: 1 ogni 4 bar, voicing pieno (4 note)
- **Primo BREAK a ~22:00** (2-4 bar, kick+basso out, hat+accordi continuano → re-entry +28 vel)

**III-b Intensificazione armonica (24:00–28:00)**
- Cambio modale D Dorian (pivot su D4)
- Ritmo armonico raddoppia: 1 accordo ogni 2 bar
- CH6 LEAD entra (13-step loop, intervalli angolari, vel 50-65)
- **Poliritmia CH7**: pattern 12 step, 3:4 contro il kick (accent su 0, 4, 8)
- Swing sale a 12-15% (groove pieno, territorio dub)
- **Call-response CH5→CH6**: quando Voice suona, Lead risponde (prob 0.4, delay 200-500ms, note armonicamente correlate)

**III-c Pre-climax (28:00–32:00)**
- Hat a 16th (vel 70-95)
- Ghost notes sul kick (prob 0.25, vel 18-28)
- Crescendo progressivo su tutti i canali
- **MACRO-AIR a ~30:00**: TUTTO cade tranne drone + hat per 16 bar. Respiro profondo prima del climax.

**Visual:**
- **MECCANICA visiva**: la griglia Bayer diventa parzialmente visibile (struttura esposta come meccanismo).
- Composizioni Mondrian procedurali che evolvono con la fase musicale.
- **Montaggio ritmico** sincronizzato al BPM: cambi scena sul beat 1 ogni 4-8 bar.
- Scan-line overlay (ogni 4ª riga più luminosa — estetica CRT).
- Dot size piccolo (3-5px) — micro-dettaglio, la precisione È l'estetica.
- Feedback corto (decay 0.82) — MECCANICA è presente, non ricorda.
- **MACRO-AIR visivo**: quando la musica respira, lo schermo respira (densità → 0.02 per 16 bar, poi riempimento esplosivo al re-entry del kick).

---

### IV. VERTICE (32:00–40:00) — "La tempesta"

**Emozione:** Estasi, resa. Il picco non è un punto ma un plateau. Poi la falsa risoluzione. Poi la salita finale.
**Riferimenti:** Jon Hopkins (Everything Connected), Four Tet peak, Ikeda (assalto visivo)

| Parametro | Valore |
|-----------|--------|
| Modo | C# Dorian (32:00–38:00) → E Phrygian (38:00–40:00) |
| BPM | 100 → 108 → 116 → 108 |
| rhythmicDensity | 0.70 → 1.00 → 0.00 → 0.95 → 0.30 |

**IV-a Climax sostenuto (32:00–35:00)**
- 4-on-the-floor, kick vel 100-110
- Hat 16th, vel 85-100, swing ridotto a 3-5% (precisione = energia)
- Accordi ogni bar, voicing pieni
- CH5+CH6 in cross-arpeggio (call-response denso)
- **Nessun break.** Inesorabile. Questo è il plateau Hopkins.

**IV-b FALSE RESOLUTION (35:00–35:45)**
- **DROP ISTANTANEO**: rhythmicDensity → 0.0
- Solo drone (A3) e il hat più flebile (vel 15)
- 8 bar di quasi-silenzio (~22 secondi a 100 BPM)
- L'audience non sa se è finito
- **Pivot armonico**: shift a tonalità distante (da C# a E) durante il vuoto

**IV-c Rimbalzo e picco finale (35:45–40:00)**
- Kick rientra a vel 115 (+28 punch)
- rhythmicDensity salta a 0.90 (sopra il picco precedente)
- **Seed motif ritorna** su CH5 a ~38:00, trasposto in E Phrygian, durate raddoppiate
- Questo è il picco assoluto della performance

**Visual — il momento più drammatico:**
- **VORTICE visivo**: inversione positivo/negativo sincronizzata al BPM (8th notes → nero→bianco→nero)
- Palette ikeda: nero, bianco, rosso (solo su CH7 RUPTURE)
- **Grid distortion sul kick**: ripple che emana dalla posizione del kick ad ogni colpo
- Glitch controllati: righe offset, colonne saltate, blocchi spostati (1-2 frame su onset forti)
- **Zero feedback** — ogni frame è pulito. VORTICE esiste solo nell'istante presente.
- FALSE RESOLUTION visiva: quando la musica crolla, **lo schermo va a nero totale per 8 bar**.
  Dopo 35 minuti di contenuto visivo, il nero assoluto è devastante.
- RIMBALZO: **INVERSIONE COMPLETA A BIANCO** per 4 bar → poi ritorno al nero con SOLCO che emerge
- **Tunnel feedback** per SOLCO: decay 0.88 con zoom 1.001/frame — l'occhio viene risucchiato nello schermo
- Phase-shifting visivo: due ritmi leggermente sfasati (120 vs 119.5 BPM) creano battimenti visivi

---

### V. RITORNO (40:00–48:00) — "La memoria"

**Emozione:** Gratitudine, rilascio. La musica ricorda cos'era. Lo spazio si svuota come una stanza dopo una festa.
**Riferimenti:** Sakamoto (12), Burial (reverb come composizione), Floating Points (fine di Promises)

| Parametro | Valore |
|-----------|--------|
| Modo | E Phrygian (40:00–43:00) → A Lydian (43:00–48:00) |
| BPM | 108 → 92 → 84 (ritorna al tempo di apertura) |
| rhythmicDensity | 0.30 → 0.05 → 0.00 |

**V-a Dissoluzione (40:00–43:00)**
- Kick esce (istantaneo)
- **Degradation engine**: timing jitter sigma da 8ms a 25ms. Note-drop probability da 0 a 0.35.
- Accordi perdono note una alla volta: 4 → 3 → 2 → solo root (su 16 bar) — "orchestral decay" Hecker
- Hat torna a 8th, poi quarter, poi sparisce

**V-b Memoria (43:00–46:00)**
- Modo torna ad A Lydian — **il ritorno ciclico Hopkins** (stessa nota di apertura)
- Drone ritorna su A3=57
- **Seed motif ritorna** a pitch originale, velocity originale, ritmo originale — replica esatta di ciò che è stato catturato all'inizio
- CH6 LEAD suona il seed in retrogrado (al contrario) come fantasma (vel 25-35)
- Solo CH2 (drone), CH5 (seed), CH1 (grain come room tone)

**V-c Silenzio (46:00–48:00)**
- CH5 tace dopo l'ultimo seed
- CH1 grain velocity: 20 → 10 → 5 → silenzio
- CH2 drone: vel 50 → 30 → 15 → 5
- **Nota finale**: A3 a velocity 5, tenuta 16 bar
- La performance non finisce con un note-off ma con una velocity così bassa da diventare inudibile

**Visual:**
- Il nero del vuoto totale → i primi segni CRISTALLO riappaiono (il ritorno)
- DERIVA ritorna: la nebbia dell'inizio. Ma ora lo spettatore ha attraversato tutto — la stessa nebbia ha un significato diverso.
- Densità decresce fino alla soglia di percezione
- Feedback trails si estendono all'infinito
- **L'ultimo punto svanisce.** Nero.

---

## Nuovi Sistemi da Implementare

### Musica (8 sistemi)

| # | Sistema | Priorità | Complessità | Impatto |
|---|---------|----------|-------------|---------|
| M1 | **Timing Directionality** — note avanti/indietro rispetto al beat per fase | ALTA | Media | Groove vivo |
| M2 | **Breath Windows potenziati** — 3 livelli (micro/meso/macro air) | ALTA | Bassa | Drammaticità |
| M3 | **Seed Motif espanso** — 5 ricorrenze con trasformazioni | ALTA | Media | Narrativa |
| M4 | **Chord Additive Entry** — accordi nota per nota su 16 bar | MEDIA | Bassa | Organicità |
| M5 | **Call-Response CH5↔CH6** — probabilistico, delay 200-500ms | MEDIA | Media | Musicalità |
| M6 | **Groove Evolution** — ghost emergence, accent migration, bass cycle | MEDIA | Alta | Profondità |
| M7 | **Degradation Engine** — entropia progressiva nella dissoluzione | BASSA | Bassa | Chiusura |
| M8 | **Oblique Strategy Events** — errori intenzionali (prob 0.03/bar) | BASSA | Bassa | Carattere |

### Visual (14 tecniche, 4 fasi)

**Fase 1 — Fondamenta (massimo impatto/effort):**

| # | Tecnica | Impact | Effort | Motori |
|---|---------|--------|--------|--------|
| V1 | **Enhanced feedback** (trasformata geometrica: zoom, rotate, drift) | 9 | 1 | Tutti |
| V2 | **Grid distortion** (onda sinusoidale sulla griglia Bayer) | 9 | 1-2 | DERIVA, ABISSO, TERRENO, VORTICE |
| V3 | **Moiré** (due griglie Bayer a scale diverse) | 8 | 1 | TERRENO, SOLCO |
| V4 | **Film grain** (noise sulla soglia Bayer) | 4 | 1 | DERIVA, ABISSO, TERRENO |

**Fase 2 — Dinamiche:**

| # | Tecnica | Impact | Effort | Motori |
|---|---------|--------|--------|--------|
| V5 | **Negative space** (vuoti geometrici intenzionali) | 8 | 2 | CRISTALLO, ABISSO, TERRENO |
| V6 | **Visual breathing** (ciclo respiratorio indipendente dalla musica) | 7 | 2 | Tutti |
| V7 | **Counterpoint mapping** (visual a volte inverte la musica) | 7 | 2 | DERIVA, ABISSO, rottura |
| V8 | **Transition vocabulary** (Bayer dissolve, wipe, void) | 8 | 2 | Transizioni |

**Fase 3 — Vita organica:**

| # | Tecnica | Impact | Effort | Motori |
|---|---------|--------|--------|--------|
| V9 | **Reaction-diffusion** (Gray-Scott a 64×64) | 9 | 2 | DERIVA, CRISTALLO |
| V10 | **Particle flocking** (Boids con spatial hash) | 8 | 3 | TERRENO, ABISSO |
| V11 | **Prospettiva/profondità** (punto di fuga nella griglia) | 7 | 2 | CRISTALLO |
| V12 | **Bordi Voronoi visibili** (celle come struttura) | 6 | 2 | TERRENO, MECCANICA |

**Fase 4 — Rifinitura:**

| # | Tecnica | Impact | Effort | Motori |
|---|---------|--------|--------|--------|
| V13 | **Aberrazione cromatica** (offset R/G/B sugli shape MIDI) | 6 | 2 | VORTICE |
| V14 | **Inversione ritmica** (positivo/negativo sul BPM) | 8 | 1 | VORTICE |

---

## Identità Visiva per Motore

| Motore | Mondo visivo | Tecniche core | Feedback | Dot size | Palette |
|--------|-------------|---------------|----------|----------|---------|
| DERIVA | L'ATMOSFERA — nebbia, threshold, assenza di tempo | Grid distortion lenta, feedback massimo | 0.97 + drift | 8-12 | quasi-mono, ghiaccio |
| CRISTALLO | LA LUCE — bianco con interruzioni scure, cristalli | RD spots, prospettiva vanishing point | 0.95 + shimmer | 3-5 | ice (bg bianco, fg scuro) |
| ABISSO | IL VUOTO — nero quasi totale, bagliori occasionali | Gravità (tutto cade), negative space centro | 0.90 + gravity down | 6-10 | abyssal (bg nero, fg blu) |
| TERRENO | IL PAESAGGIO — orizzonte, strati geologici, eco dub | Moiré orizzontale, noise field, feedback dub | 0.94 statico | 8-14 | amber/warm |
| MECCANICA | LA MACCHINA — griglia visibile, Mondrian, precisione | Scan-line, composizioni Mondrian, griglia | 0.82 corto | 3-5 | steel + red accent |
| VORTICE | L'ASSALTO — strobe, glitch, violenza | Inversione ritmica, grid ripple, glitch | 0 (nessuno) | 2-3 | ikeda (bw + red) |
| SOLCO | LA TRANCE — ipnosi, tunnel, phase shifting | Feedback tunnel zoom, moiré respirante | 0.88 + zoom | 4-6 | bw + gold accent |

---

## Cosa NON cambiare dalla v3

Questi 10 sistemi sono già ben progettati:

1. MacroComposer 4D checkpoint interpolation
2. Prime-length melody loops (7, 11, 13) → estendere con 17, 19
3. EMA smoothing tau=4.0s
4. Cubic Hermite ease per transizioni
5. Phase convergence hi-hat (8 vs 9 step)
6. Glass additive percussion entry
7. Voice-leading max 3 semitoni
8. Pivot note system
9. Break system (prob 0.65, cooldown 10-20 bar)
10. Anchor voicing system (5 voicing per modo)

---

## Piano di Implementazione Suggerito

### Sprint 1 — Arco emotivo (priorità live)
- [ ] Rivedere checkpoint MacroComposer per il modello a 5 onde
- [ ] Implementare i 3 livelli di air (micro/meso/macro)
- [ ] False resolution potenziata (drop + pivot armonico)
- [ ] Velocity range per fase (Frahm principle: 25-55 apertura, 70-115 climax)

### Sprint 2 — Musicalità
- [ ] Timing directionality (avanti/indietro per fase)
- [ ] Call-response CH5↔CH6
- [ ] Seed motif: 5 ricorrenze con trasformazioni
- [ ] Chord additive entry

### Sprint 3 — Visual foundations
- [ ] Enhanced feedback con trasformata geometrica
- [ ] Grid distortion
- [ ] Moiré interference
- [ ] Inversione ritmica per VORTICE

### Sprint 4 — Visual dynamics
- [ ] Negative space system
- [ ] Visual breathing
- [ ] Counterpoint mapping
- [ ] Transition vocabulary

### Sprint 5 — Profondità
- [ ] Groove evolution (ghost emergence, accent migration)
- [ ] Degradation engine
- [ ] Reaction-diffusion
- [ ] Oblique strategy events

---

## Budget Performance

Stima overhead per frame delle nuove tecniche visual:

| Tecnica | ms/frame | Note |
|---------|----------|------|
| Grid distortion | 0.5 | sin/cos per cella (LUT per ottimizzare) |
| Moiré | 0.1 | lookup array aggiuntivo |
| Enhanced feedback | <1.0 | drawImage è GPU-accelerato |
| Film grain | 0.3 | 1 random() per cella |
| Reaction-diffusion | 0.1 | 64×64, 2 step/frame |
| **Totale** | **~2.0** | **14ms disponibili dopo render esistente** |

---

## Anti-Pattern da Evitare

**L'albero di Natale.** Mai attivare tutte le tecniche insieme. Ogni motore usa max 3-4 tecniche. L'identità viene da ciò che è ASSENTE.

**L'effetto preset.** Se lo spettatore riconosce la tecnica ("quella è aberrazione cromatica"), diventa decorazione. Le tecniche devono essere sentite, non nominate.

**La linearità.** Mappare ogni valore audio linearmente a un parametro visivo crea "audio visualization", non arte audiovisiva. La relazione suono-immagine deve essere poetica.

**Il GC spike.** Tutti i nuovi sistemi devono usare buffer pre-allocati. Zero allocazioni per-frame.
