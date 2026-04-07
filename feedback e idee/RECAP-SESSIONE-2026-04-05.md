# RECAP SESSIONE 5-6 Aprile 2026

> Analisi sessione registrata + review production team + brainstorming v5

---

## 1. ANALISI SESSIONE REGISTRATA (45m22s)

### Dati generali
- Durata: 45m22s (2721.8s)
- Eventi MIDI: 36,519
- Cambi fase: 6 (5 modi + ritorno)
- Decisioni AI: 168
- Breaks: 29
- Oblique events: 54
- Frame totali: 265,500 — drops: 0 — avg: 8.3ms

### Arco modale
| Tempo | Modo | BPM | Arc |
|-------|------|-----|-----|
| 00:00 | A lydian | 78 | 0.00 |
| 05:07 | Bb phrygian | 78 | 0.12 |
| 17:07 | D dorian | 86 | 0.40 |
| 24:07 | C# dorian | 92 | 0.56 |
| 32:38 | E phrygian | 99 | 0.76 |
| 37:37 | A lydian | 82 | 0.87 |

### Mix MIDI — il problema centrale
| Canale | Ruolo | Eventi | % | Vel avg | Note |
|--------|-------|--------|---|---------|------|
| CH1 | GRAIN | 21,387 | **58.5%** | 82 | C2-F#2 (7 note) |
| CH7 | RUPTURE | 9,811 | **26.9%** | 67 | C2-D4 |
| CH0 | PULSE | 1,396 | 3.8% | 96 | solo C2 |
| CH5 | VOICE | 1,236 | 3.4% | 37 | C#2-A#5 |
| CH6 | LEAD | 1,131 | 3.1% | 31 | C#2-A5 |
| CH4 | CHORDS | 724 | 2.0% | 41 | E3-D5 |
| CH2 | DRONE | 471 | 1.3% | 32 | C3-D5 |
| CH3 | BASS | 363 | 1.0% | 45 | B1-F3 |

**CH1+CH7 = 85.4%** di tutto il MIDI. Melodia+basso (CH3+CH5+CH6) = 7.5%.

### Densità MIDI nel tempo
```
 0-3m   ░░          ~40 ev/min    — silenzio
 4-8m   ████        ~590 ev/min   — buildup
 9m     █████████████ 3029 ev/min — ESPLOSIONE ANOMALA
10-16m  ██████████  ~1100 ev/min  — plateau
16-17m  ░           ~24 ev/min    — break profondo
18-28m  ████████████ ~1400 ev/min — nucleo denso
31-34m  █████████   ~1300 ev/min  — ultimo picco
35-39m  ████→░      316→37        — dissoluzione
40-45m  ░           ~15 ev/min    — coda
```

---

## 2. REVIEW PRODUCTION TEAM

### Voto unanime: 3/5 — "L'architetto è bravo, l'orchestra è sorda"

**COMPOSITORE (3.5/5)**
Arco modale convincente e non banale. Il passaggio A lydian→Bb phrygian (semitono, da luminoso a scuro) al min 5 è la mossa più forte. La false resolution al min 30 è strutturalmente perfetta. 29 break ben distribuiti. Ma: hat domina al 58.5%, melodie a vel 37/31 sono fantasmi, basso con 363 note è inesistente, falso climax a min 9 (3029 ev/min). BPM troppo ravvicinati nelle prime 3 fasi (78-86-92).

**PRODUCER (3/5)**
Su hardware reale il performer sente hi-hat e conga per 45 minuti con qualche nota sussurrata in sottofondo. CH0 kick autorità ok (vel 96) ma monopitch. CH2 drone corretto. CH4 chords equilibrati. CH5/CH6 troppo deboli per competere. CH7 secondo canale più denso — dovrebbe essere raro. Nucleo 18-28min piatto (10 min stessa densità). L'ultimo picco (31-34min) meno intenso del nucleo precedente. Fix: 6 parametri config + 2 cue sequencer.

**PERFORMER (3/5)**
"Ci sono momenti bellissimi ma troppo rumore e troppo poco respiro." Apertura 0-5min perfetta. Cambio modale 5:07 forte. Ma 20 min di plateau (8-28) ingestibili dal palco. Differenza tra 1100 e 1400 ev/min = zero dal palco. Melodie invisibili nel mix. Break 5-12s troppo corti per recuperare — servono macro-pause 20-40s. Vuole groove dove agganciarsi. Chiusura 37-45 funziona emotivamente. Oblique events bella idea ma da modulare per arco (pochi all'inizio, molti al climax, quasi zero alla fine).

**REGISTA VISIVO (3/5)**
Nero iniziale/finale funziona. Germinazione asimmetrica a 2min forte. Composizione densa B/W a 5:01 solida — funziona senza colore. Cambio cromatico Bb phrygian (viola a 5:06) consapevole. Ma: crollo entità 2662→33 in 5 minuti è strappo violento (serve residuo fossile, morte max 10%/sec). Plateau visivo 10-20min è stasi (435→734 ent in 10min). Banda blu a 06:07 troppo uniforme. Camera: 8 cambi in 45min non bastano (1 ogni 5.6min). Servono: respiro densità sinusoidale (±15%, ciclo 45s), transizione cromatica meno binaria (grigio→colore via alba), orizzonte dinamico.

**CRITICO**
"Un drone a singolo-canale con un hi-hat che non sa quando tacere: il MIDI tradisce l'arco del MacroComposer quasi ovunque." L'architettura 4D è raffinata ma il MIDI che esce non la onora. Il hat bypassa il gating. La rupture al 27% è routine. Il kick è monopitch. Il cervello è sofisticato, la bocca urla sempre la stessa cosa. L'arco modale è eccellente — ogni transizione ha senso armonico. Ma se nessuno lo sente sopra il muro di hat, non serve.

**TECNICO — VERDE con nota gialla**
0 frame drops, timing p99 9.4ms. Ma: ring buffer di 300 frame mostra solo ultimi 5 secondi — maschera picchi reali (16.1ms al min 22 con 948 entità, al limite del budget 16.6ms). Cap recorder insufficienti per 60min (snapshot 3000→3600, MIDI 50000→65000). ~950 entità = soglia comfort per frame time.

### Convergenze del team
1. CH1 GRAIN domina al 58.5% — deve essere gatato dall'arco
2. CH5/CH6 VOICE/LEAD inaudibili — vel avg 37/31 contro 82
3. CH7 RUPTURE al 27% — evento speciale che diventa routine
4. Nucleo 10-28min è plateau senza micro-archi

### Decisione Direttore Artistico
"Ogni canale deve essere servo dell'arco, non autonomo." Il MacroComposer pensa in 4D ma due canali (CH1, CH7) ignorano queste dimensioni. 3-4 macro-pause 20-30s in punti strategici. Fix MIDI per la causa, residuo fossile per il sintomo visivo. Priorità: hat gating > velocity melodiche > rupture thresholds > basso > macro-pause > crossfade sequencer > fossile visivo > respiro densità > recorder > kick pitch.

---

## 3. DIAGNOSI TECNICA — 8 LEAK

Dove i layer bypassano il MacroComposer:

1. **Hat bypassa density** — `sendHatNote()` in rhythm-layer.js:63 non ha gating su rhythmicDensity, suona SEMPRE
2. **Hat clock doppio** — 2 clock (8 e 9 step) in rhythm-layer.js:394-420 sparano alla stessa frequenza = 2× output
3. **Percussion soglie troppo basse** — congaLo entra a rD≥0.08 (minuto 3!) in config.js:700 e non esce più
4. **Break stocastici** — 65% probabilità random in rhythm-layer.js:277, non legati all'arco
5. **Velocity melodiche × mA** — melody-texture-layer.js:74: vel 45 × mA 0.08 = vel 3.6 = fantasma
6. **Emissione melodica × mA** — melody-texture-layer.js:262: prob 25% × 0.08 = 2% per step = 1 nota ogni 54 sec
7. **Kick monopitch** — config.js:619: nota 36 hardcoded, range clamped 36-36
8. **Degradazione su arco fisso** — melody-texture-layer.js:124: entropy curve hardwired, ignora melodicActivity

### Visivo — 17 sistemi additivi senza tetto
- densityVoidThreshold troppo basso (0.12) — quasi tutti i pixel superano la soglia
- Nessun cap di densità globale
- Nessun focal point, negative space, composizione
- Scene cambiano ogni ~30sec senza intenzione
- Nessuna identità visiva per traccia — tutto si fonde in gradiente uniforme

---

## 4. IL FEEDBACK DELL'UTENTE

### Cosa non funziona (parole dell'utente)
- "Ferrari a livello tecnico ma senza un bravo pilota e senza meta"
- "Visivamente troppo cacofonico — mancano movimento, spazi aperti, geometrie e intenzione"
- "Parti troppo piene ma a caso — non puoi legarti a un motivo o a un fraseggio ritmico del basso"
- "Le percussioni sono troppo monotone"
- "Basta cercare di tappare i buchi — organizziamo con cognizione, metodo e coerenza artistica"

### Cosa vuole
- "Come un vero disco che suoni bene in maniera continuata senza stacchi"
- "Ogni parte abbia un'identità visiva a sé stante"
- "Stesso linguaggio visivo (i dot) e stessi strumenti"
- "All'inizio ti ambienta, poi ti coinvolge, poi ti fa ballare e ti emoziona"
- "Estetica ricercata ma con personalità"
- "All'inizio arioso, CH5 e CH6 entrano piano con note rare — gocce d'acqua"
- "Momenti più ballabili, associabili all'estetica techno ma mai scontata — il riferimento è IDM"
- "Visivamente: forte identità per ogni momento, ripartendo da questa estetica ma rivista completamente"

---

## 5. LA VISIONE v5

**"Non è un pezzo lungo 45 minuti. È un album che suona bene dall'inizio alla fine."**

Un disco continuo senza stacchi, come un DJ set. Ogni traccia ha identità musicale e visiva propria. Tutto costruito con lo stesso vocabolario: i dot Bayer. Viaggio emotivo: ambientamento → coinvolgimento → ballo → emozione. Estetica ricercata. Personalità forte.

**Riferimenti:** Floating Points (primario), Autechre, Aphex Twin — mondo IDM
**Visivi:** Pinterest moodboard graphic design contemporaneo, Ryoji Ikeda

---

## 6. IDEE MUSICALI

### Arco emotivo — 7 tracce
| # | Nome | Emozione | Musica |
|---|------|----------|--------|
| 1 | NEBBIA | Ti ambienta | Ambient, drone, CH5/CH6 come gocce d'acqua. Nessun kick, nessun hat. |
| 2 | TESSUTO | Qualcosa emerge | Texture cresce, primi impulsi, pattern rarefatti |
| 3 | SOLCO | Ti cattura | Primo groove riconoscibile — dub, syncopated, obliquo |
| 4 | RESPIRO | Pausa | Reset integrato |
| 5 | MACCHINA | Sei dentro | Groove pieno meccanico, melodie sopra, call-response |
| 6 | TEMPESTA | Balli | Energia pura, techno IDM, pattern complessi intrecciati |
| 7 | RITORNO | Ti rilascia | Dissoluzione del pattern, emozione, chiusura ambient |

### Identità per traccia — cosa serve
- **Pattern ritmico unico** — NEBBIA=niente, SOLCO=dub groove, TEMPESTA=techno IDM
- **Basso come firma** — motivo riconoscibile per traccia, il performer ci si aggancia
- **Melodia udibile** — frasi 8-12 note (non 3-6), velocity forte (non 37), gocce rare in apertura
- **Texture controllata** — grain diverso per traccia, non lo stesso hat ovunque
- **Kick diversificato** — almeno 3-4 pitch per modo (non monopitch C2)
- **Rupture rara** — max 5-8% (non 27%), 4 stadi obbligatori

### Transizioni (DJ set)
- Texture A sfuma in texture B
- Basso cambia motivo gradualmente
- Melodia introduce note della scala successiva come "preview"
- Non gradiente indistinguibile — c'è un momento dove "si cambia"

### MacroComposer
**Mantenere:** Sistema 4D, 22 checkpoint, cubic Hermite, EMA, micro-drift, percorso modale
**Cambiare:** Tutti i layer devono rispettare le 4D. Hat gated. Break legati alla derivata dell'arco. Velocity floor 28. Frasi più lunghe. Basso con pattern loop.

---

## 7. IDEE VISIVE

### Principi
- I dot sono il linguaggio — stessi strumenti, brani diversi
- Differenze via: dimensione, densità, organizzazione, movimento, ritmo, colore, spazio
- Il MIDI non decora il visivo — **è** il visivo
- Fondi colorati, non solo nero
- Parallasse/livelli per profondità senza 3D reale
- Non riscrivere il renderer — ristrutturare la regia
- Portare il Bayer al limite con soluzioni geniali, non effetti

### 4 layer
| Layer | Funzione | Velocità |
|-------|----------|----------|
| Background | Colore/ambiente della traccia | Statico o lentissimo |
| Midground | Composizione spaziale | Legata al BPM |
| Foreground | Eventi MIDI diretti | Tempo reale |
| Overlay | Texture fine (Bayer residuo, grain) | Indipendente |

### 6 idee visive concrete
1. **Quadrati pulsanti col kick** — 4 blocchi illuminati in sequenza col pattern ritmico. Quando il groove è 4/4 pulsano insieme, quando è rotto creano pattern asimmetrici.
2. **Linee parallele come accordi** — linee orizzontali che appaiono una per voce del voicing. Accordo 3 note = 3 linee. Voice leading → le linee si spostano fluidamente. Contrappunto come coreografia.
3. **Viaggio in treno** — camera laterale costante, note MIDI come paesaggio (piloni, edifici, luci). Velocità scroll = BPM. Parallasse: sfondo lentissimo, foreground veloce. Più denso col groove, più rado nei silenzi.
4. **Data/Ikeda** — griglia numeri/simboli, stream verticali. Note accendono colonne. Densità ritmica = densità informativa. B/W puro, nessun colore.
5. **Schermo colorato saturo** — inversione totale: sfondo giallo (o altro colore) saturo, strumenti scavano geometrie nere. Kick = cerchio nero. Accordi = bande nere. Melodia = punto nero mobile. Negativo di tutto il resto.
6. **Spazio liminale** — corridoio infinito con linee prospettiche convergenti al centro. Note come oggetti che si avvicinano/allontanano. Melodia "da lontano" (piccola, centro) → "arriva" (grande, bordi). Parallasse naturale dalla prospettiva.

### Bayer al limite — stessi strumenti, uso diverso
- Dot enormi (20-30px) → pittorici, quasi Hirst
- Dot microscopici (1-2px) → data pura, informazione
- Densità zero con un solo dot mobile → dot come performer
- Densità 100% su fondo colorato → schermo DIVENTA il colore
- Threshold invertito → dot come buchi neri nel colore
- Scala Bayer variabile → 4×4 grossolana (NEBBIA) vs 16×16 finissima (TEMPESTA)

---

## 8. PALETTE

Ispirazione: moodboard Pinterest, graphic design contemporaneo.
Principi: combinazioni forti, fluo ammesso, palette limitate (2-3 colori per traccia), fondi colorati NON solo nero, sofisticazione > effetto.

### 13 colori di riferimento (dal moodboard)
```
#7BBA91  cambridge blue / sage
#EFE6DE  cream vanilla
#DD3A44  punchy pink / carmine chiaro
#FE6B0D  electric orange
#CDD71D  lime
#BADE4F  june bud (verde lime chiaro)
#6B8EEC  cornflower blue
#F8ED00  giallo elettrico
#9B8FCE  lavanda
#20130D  licorice (marrone scurissimo)
#282B26  signal black (nero con sfumatura verde)
#1A1A2E  navy profondo
#91010F  carmine scuro
```

### Palette per traccia — BOZZA v1
> NOTA: troppo nero nei fondi. Servono più fondi colorati. Da rivedere.

| # | Traccia | Fondo | Dot | Accento | Emozione |
|---|---------|-------|-----|---------|----------|
| 1 | NEBBIA | nero #0A0A0A | cream #EFE6DE | — | silenzio |
| 2 | TESSUTO | licorice #20130D | lime #BADE4F | cream | germoglio |
| 3 | SOLCO | signal black #282B26 | orange #FE6B0D | lime #CDD71D | groove caldo |
| 4 | RESPIRO | **sage #7BBA91** | licorice #20130D | — | inversione |
| 5 | MACCHINA | **navy #1A1A2E** | giallo #F8ED00 | pink #DD3A44 | energia |
| 6 | TEMPESTA | nero #000000 | bianco #FFFFFF | rosso #DD3A44 | esplosione |
| 7 | RITORNO | nero #0A0A0A | lavanda #9B8FCE | cream #EFE6DE | dissolvenza |

Viaggio cromatico: nessun colore → verde → arancio → inversione fondo → giallo → bianco → viola

---

## 9. DECISIONI APERTE

- [ ] Ridefinire palette con più fondi colorati (5/7 su nero è troppo)
- [ ] Definire identità musicale completa per ogni traccia (scala, BPM, pattern basso, pattern kick, texture hat)
- [ ] Assegnare idea visiva a ogni traccia (quale delle 6 idee per quale momento)
- [ ] Decidere: v5 su codebase v4 o fork pulito?
- [ ] Quanti livelli parallasse: 2, 3 o 4?
- [ ] Transizioni visive tra tracce: cut / dissolve / trasformazione morfologica?
- [ ] Il Bayer dither: texture costante, solo certi momenti, o ridotto a overlay?

---

## 10. FILE DI RIFERIMENTO

| File | Contenuto |
|------|-----------|
| DESIGN-V5.md | Documento di design vivo (nel progetto, sotto git) |
| memory/project_v5_vision.md | Visione artistica (memoria Claude) |
| memory/project_v5_music_design.md | Design musicale + review team (memoria Claude) |
| memory/project_v4_diagnosis.md | Diagnosi tecnica 8 leak (memoria Claude) |
| analisi machine ii/SESSION-2026-04-05T15-40-18.json | Dati sessione grezzi (4.2MB) |
| analisi machine ii/FRAME-*.png | 9 screenshot sessione |

---
---

# SESSIONE 2 — Brainstorming v5 con 8 agenti (5-6 aprile)

8 agenti lanciati: 5 Production Team (Compositore, Regista, Critico, Tecnico, Dir. Artistico) + 3 Ricercatori (Arte contemporanea, Storia musica elettronica, Tendenze visual 2025). Risultato: roadmap v5 + implementazione + commit v5.0.0.

---

## 11. RICERCA ARTE CONTEMPORANEA

### Artisti chiave
- **Ryoji Ikeda** (test pattern, datamatics) — riduzione = potenza. Il bit come unita minima.
- **Alva Noto** (uni series, Vrioon con Sakamoto) — sincronia totale = stessa origine dati per audio e video
- **Robert Henke** (CBM 8032 AV) — il vincolo tecnico non e un limite, e il linguaggio
- **Herman Kolgen** (Dust, Inject) — matericita dal contrasto, nero profondo come spazio attivo
- **Mika Vainio** (Konstellaatio) — ripetizione con micro-variazione > varieta
- **Tarik Barri** (Versum) — ogni suono ha una posizione, ogni nota e un luogo
- **Grischa Lichtenberger** (TREEVENTYTHREE) — glitch come struttura, non come effetto
- **Lillevan** (con Fennesz) — sottrazione progressiva come gesto
- **Karl Kliem** (con Alva Noto) — pixel come atomo compositivo
- **Byetone** (Olaf Bender, Raster) — griglia e geometria come partitura visiva

### Tecniche visive nell'arte
- Halftone come linguaggio (Ben-Day -> Lichtenstein -> dithering): il punto costruisce, non rappresenta
- Op Art (Bridget Riley, Fall 1963): pattern ripetuti generano sensazione fisica
- Graphic scores (Cardew Treatise, Cage Fontana Mix): se la visual E la partitura, non c'e sync da fare
- Il vuoto (Malevich Bianco su bianco, Agnes Martin): il contenuto piu radicale

### Standard festival
CTM, Mutek, Ars Electronica, Unsound: l'opera mostra cosa sceglie di NON fare. La rinuncia e il segnale. Il tech demo mostra cosa puo fare il software. L'opera mostra cosa sceglie di non fare.

### Il silenzio nell'arte
- Cage 4'33" — il silenzio non esiste, esiste l'ascolto
- Taku Sugimoto / Radu Malfatti (Wandelweiser) — silenzio di minuti, il suono quando arriva pesa
- Pierre Soulages (Outrenoir) — il nero non assorbe, riflette diversamente secondo l'angolo
- Ad Reinhardt (Abstract Painting 1963) — nero su nero, differenze quasi impercettibili

### Principi distillati
| Principio | Fonte |
|---|---|
| Riduzione = potenza | Ikeda, Reinhardt |
| Il vincolo e il linguaggio | Henke CBM 8032 |
| Ripetizione con micro-variazione | Vainio, Riley |
| Il vuoto e gesto | Cage, Sugimoto, Soulages |
| L'opera sceglie cosa non fare | Standard CTM/Ars Electronica |

---

## 12. RICERCA STORIA MUSICA ELETTRONICA

### Album lunga forma — come tenere 45-60 min
- **Gas** (Pop, Konigforst, Narkopop) — coerenza da profondita di un singolo stato. Ogni 3-5 min un layer entra/esce impercettibilmente.
- **Tim Hecker** (Virgins, Ravedeath) — registro frequenziale come dramaturgia: bassi = calma, medi saturi = climax
- **Floating Points Promises** (con Pharoah Sanders) — UN pattern di clavicembalo ripetuto per 46 min = coerenza. Il sax entra e esce.
- **Autechre Exai** — coerenza dal sound design condiviso, non dall'armonia
- **Boards of Canada** — il timbro del basso da identita, non il pattern

**Regola:** ogni fase = UN elemento fisso riconoscibile. Il cambio di fase cambia QUELLO, non aggiunge roba.

### Il basso nella musica elettronica
- **Basic Channel / Deepchord** — sub 50-60 Hz con delay lungo, pulsa, 1 nota ogni 2-4 battute
- **Burial Untrue** — spezzato, sincopato, suona dove NON te lo aspetti, vel 0.7-0.85 della griglia
- **Actress R.I.P., Ghettoville** — basso come fantasma, note lunghe filtrate, un'ottava sotto
- **Autechre** (Gantz Graf, Exai) — FM con inviluppi complessi, euclidean spostati
- **Plastikman Consumed** — UN sub, UNA frequenza, variazione solo nel filtro, 40 min con 3 note
- **Richie Hawtin** — minimal al limite

**Regola:** sub 40-80 Hz, poche note lunghe, variazione di filtro non di pitch. Pattern del basso = contrario del kick.

### Transizioni
- Hecker: saturazione crescente come ponte
- Gas: kick che entra gradualmente (4-8 battute fade)
- Burial: vinile crepitante come colla tra sezioni
- Lorenzo Senni: buildup senza drop, aspettativa tradita
- Autechre: cambiano parametri di un algoritmo, la transizione E il pezzo

**Regola:** drone CH2 come ponte, cambia modo 4-8 battute PRIMA della fase.

### Il silenzio nella musica elettronica
- **Autechre live** — pause 2-8s nel mezzo di texture dense, effetto fisico
- **Ricardo Villalobos** (Fizheuer Ziepp, 37 min) — riduzione fino a quasi-niente, l'ascoltatore completa
- **Pan Sonic** (Aaltopiiri) — noise estremo poi taglio a zero, il contrasto e la composizione

**Regola:** almeno 2 silenzi reali (<3 canali, vel <30) di 8-16 battute, DOPO i momenti piu densi.

### Meta-composizione generativa
- **Brian Eno** (Music for Airports, Reflection) — loop lunghezze prime (17s, 23s, 29s), coerenza dalle regole
- **Autechre** — improvvisano regole, non note. Parametri vincolati entro range.
- **Mark Fell** (Multistability) — euclidean con phase shifting

**Regola:** vincolare i RANGE per fase, non i valori. Coerenza dai vincoli, vita dalla liberta dentro i vincoli.

---

## 13. RICERCA TENDENZE VISUAL 2024-2026

### Tendenze AV performance
- **"Computed Materiality"** — il dato diventa materia, non decorazione
- Ritorno geometria austera con precisione chirurgica
- Il colore torna ma composto — palette limitate con contrasto forte
- Curatori cercano comportamento emergente leggibile
- Emergenti: Nonotak, Raven Kwok, Daito Manabe, Memo Akten, Entangled Others, Martin Messier, Joanie Lemercier

### Graphic design 2025
- Swiss Revival Digitale — griglia rigida che si rompe in modo controllato
- Anti-design maturo / brutalismo elegante
- "Computational craft" su Are.na/Behance — output che mostra la mano dell'algoritmo
- Kasper Florio, Studio Feixen, Dinamo Typefaces
- Negative space protagonista: 60-70% vuoto attivo

### Palette 2025-2026
- Pantone 2025: Mocha Mousse (17-1230) — tonalita calda, terrosa
- Fondi saturi dopo un decennio di nero: navy, verde scuro, bordeaux, crema
- Combinazioni dominanti: crema+arancio+nero, navy+lime+bianco, lavanda+grafite+rosa, sage+giallo acido, bianco+rosso singolo (Mondrian-brutalist)
- Fluorescenti con parsimonia: un solo accento lime/arancio su fondo scuro
- Max 3-4 colori, rapporto 60-30-10 (dominante-secondario-accento)

### Il dot/pixel come linguaggio nel 2025
- Dithering = dichiarazione estetica, non limitazione tecnica
- Lo-fi digitale volontario = autenticita del medium (come vinile vs streaming)
- Kim Asendorf (pixel sorting), Rosa Menkman (glitch come rivelazione), Casey Reas (Processing), Zach Lieberman, Golan Levin

### Festival vs tech demo — criteri curatorship
1. **Intentionality** — scelte visibili, non solo possibilita
2. **Arco temporale** — inizio-sviluppo-fine (non loop)
3. **Relazione suono-immagine non banale** — non sync 1:1 (kick=flash) ma influenza complessa
4. **Coerenza estetica** — riconoscibile in 10 secondi
5. **Rischio e vulnerabilita** — live generativo > playback perfetto
6. **Presentazione** — artist statement 3-4 frasi, video professionale

**Verdetto:** MACH:INE ha la sostanza. Manca: video professionale + artist statement.

---

## 14. PROPOSTE DAL DIRETTORE ARTISTICO

### La direzione
Le due visioni (album v5 vs composizione reattiva III) non sono alternative. v5 = il corpo (cosa suona). III = il sistema nervoso (come pensa). Prima il corpo, poi il sistema nervoso.

### 7 priorita assolute per v5
1. MacroComposer obbedito (fix 8 leak)
2. 7 identita di traccia (pattern + bass + palette)
3. CH3 bass come protagonista
4. Budget per canale e velocity map
5. Palette visive per traccia con fondi colorati
6. Transizioni DJ-set
7. 3-4 silenzi strutturali

### Il taglio definitivo — fuori da v5
- Meta-generativita, bidirezionalita performer, durata elastica -> III
- Reaction-diffusion, AudioWorklet + SAB, OffscreenCanvas -> III o mai
- Entity SoA, Noise field Perlin -> premature/inutili

### Criteri di successo
1. Test traccia isolata — 3 min: "cos'e? voglio sentire il resto"
2. Test basso — senti il cambio di carattere tra sezioni
3. Test silenzio — il momento piu potente e un silenzio
4. Test identita — due sessioni = variazioni dello stesso album
5. Test performer — sa sempre dove si trova

---

## 15. AUTOCRITICA — Problemi identificati e corretti

| Problema | Gravita | Stato |
|---|---|---|
| setTimeout nel bass di harmony-layer.js | Alta — rotto in background tab | CORRETTO: riscritto con step-clock dedicato |
| Bass chiamato 1x/bar (non 1x/step) | Alta — rolling pump non funzionava | CORRETTO: clock 16th-note indipendente |
| Regimi visivi dichiarati in config ma non enforced | Media — config senza effetto | CORRETTO: maxDensity + minDotSize in field.js |
| Palette non testate visivamente | Media | DA VERIFICARE nel browser |
| Renderer Bayer con fondi colorati | Media | VERIFICATO OK: fg/bg gia corretto |

---

## 16. BACKLOG COMPLETO — Idee non ancora implementate

### v5.1 (prossima iterazione)
| Idea | Fonte | Difficolta |
|---|---|---|
| CC continui (CC74 filter, CC1 modwheel) | Compositore, Producer | Media |
| Budget polifonia per canale | Compositore | Facile |
| Layer system visivo bg/mid/fg/overlay | Regista, Tecnico | 3/5 |
| MIDI come architettura (4 note = struttura visiva) | Regista | Media |
| Composizioni spaziali nominate (ASIMMETRIA, ORIZZONTE...) | Regista | Media |
| Trail come calligrafia (spline Bezier su midiTrail) | Regista | 2/5 facile |
| Camera con punto di interesse (centroide attivita) | Regista | 2/5 facile |
| Artist statement + video professionale | Trend Researcher | — |

### v5.2 (maturazione)
| Idea | Fonte |
|---|---|
| Parallasse 4 livelli | Regista (dipende da layer system) |
| Ritmo visivo sincronizzato al BPM | Regista |
| Memoria visiva (cicatrici delle fasi precedenti) | Regista |
| Test ascolto cieco su 3 sessioni registrate | Critico |

### MACH:INE III (progetto nuovo)
| Idea | Fonte |
|---|---|
| MacroComposer -> macchina a stati reattiva | Critico, Fondamenta III |
| Bidirezionalita performer -> composizione (pitch detection) | Critico, Dir. Artistico |
| Seed motivico bidirezionale (cattura frasi dal performer) | Fondamenta III |
| Meta-generativita (pattern che mutano le proprie regole) | Fondamenta III |
| Durata elastica (la fine emerge dal dialogo) | Fondamenta III |
| Scene come mondi con sistemi di regole autonomi | Fondamenta III |
| Il campo visivo come strumento (video -> note) | Fondamenta III |

---

## 17. COSA E STATO IMPLEMENTATO (commit v5.0.0, d00841f)

### Fase 1 — Il Mix
- Gating gradiente continuo su tutti i layer (vel x dimensione 4D pertinente)
- Hat gated da textureDepth (silente in NEBBIA, ramp-up graduale)
- Velocity floor melodie CH5=40 / CH6=30 / CH3=35 + sqrt(mA) scaling
- CH7 percussion threshold alzati da 0.08/0.15/0.25/0.40 a 0.25/0.35/0.50/0.65
- 3 silenzi strutturali con MIDI all-notes-off + blackout (min 11, 21, 34:30)

### Fase 2 — Le Identita
- Kick pitch variabile per modo (A1, Bb1, D2, C#2, E2)
- Bass step-clock dedicato con pattern per modo:
  - A_lydian: sub pulsante lento (Plastikman)
  - Bb_phrygian: dub con ghost note (Basic Channel)
  - D_dorian: walking 8th notes
  - C#_dorian: rolling pump con velocity sweep (Berlin techno)
  - E_phrygian: sub drone lentissimo
- 7 palette con fondi colorati:
  - NEBBIA: cream #EFE6DE su quasi-nero
  - TESSUTO: lime #CDD71D su licorice #20130D
  - SOLCO: arancio #FE6B0D + lime su signal black #282B26
  - RESPIRO: scuro su sage #7BBA91 (inversione!)
  - MACCHINA: giallo #F8ED00 + pink #DD3A44 su navy #1A1A2E
  - TEMPESTA: bianco + rosso #91010F su nero (Ikeda)
  - RITORNO: lavanda #9B8FCE + cream su nero
- Regimi visivi enforced in field.js:
  - A_lydian: maxDensity 0.15, minDotSize 10 (rarefatto, pittorici)
  - Bb_phrygian: maxDensity 0.80, minDotSize 3 (denso, rituale)
  - D_dorian: maxDensity 0.65, minDotSize 4 (bilanciato)
  - C#_dorian: maxDensity 1.00, minDotSize 1 (data pura, Ikeda)
  - E_phrygian: maxDensity 0.20, minDotSize 8 (70% vuoto)
- Pivot esteso a 4 bar per transizioni DJ-set

### File modificati (8)
rhythm-layer.js, harmony-layer.js, melody-texture-layer.js, config.js, sequencer.js, colors.js, macro-composer.js, field.js
