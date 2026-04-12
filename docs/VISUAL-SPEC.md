# VISUAL-SPEC — Sistema Geometrico

> Contratto artistico canonico per il Sistema Geometrico (campo Bayer).
> Ogni canale MIDI ha una primitiva visiva unica, geometria precisa, regole di moto derivate dai dati di `src/tracks.js`.
> **Consumata da:** `src/geo.js`, `src/biomi-geo.js` (o blocco `BIOMI_GEO` dentro `geo.js`).
> **Complemento a:** `docs/MOOD.md` (ritratto musicale) + `docs/VISUAL-VISION.md` (visione del pianeta).

---

## Principio fondamentale — il campo è geologia sonora

Non un visualizer reattivo. **Accumulazione di sedimento.** Ogni nota lascia residuo fisico nel campo Bayer. Dopo 40 minuti il campo è una stratigrafia completa: ogni bioma ha scavato/depositato/eroso il territorio ereditato dai precedenti.

**Legge universale pitch→Y** (immutabile per tutti i biomi):

- Y 0.00–0.35 → spazio aereo (CH5 voice, CH6 lead alti)
- Y 0.35–0.65 → fascia vitale (CH4 chord, CH6 lead medio)
- Y 0.65–1.00 → terreno (CH3 bass, CH0 kick, CH2 drone grave)

**Layer canonici** (delegati a `src/layers.js`, 4 offscreen persistenti con decay):

- `FG` — eventi vivi (newborn → stable)
- `MG` — composizione (ghost)
- `OVERLAY` — sedimento (fossil)
- `BG` — clima materiale (colore ambiente del bioma)

**Lifecycle di particella:**
`newborn (age 0–10%) → stable (10–50%) → ghost (50–80%) → fossil (80–100%) → dead`

Per default:
- `newborn`/`stable` dipingono in **FG** con densità piena
- `ghost` dipinge in **MG** con densità ~60%
- `fossil` dipinge in **OVERLAY** con densità ~25%

Il decay di layers.js (FG 0.90, MG 0.97, OVERLAY 0.985) gestisce la persistenza automatica.

---

## I. NEBBIA — *Campo sospeso, deriva radiale*

**Stato emotivo:** sospensione pre-ritmica.
**Canali attivi:** CH2 (drone sempre), CH4 (rarefatto), CH5 (protagonista), CH6 (eco in pulsazione).
**Assenti:** CH0, CH1, CH3, CH7.

### Primitive per canale

**CH2 — drone C3, density 0.05, vel ≤ 30**
→ `ARC` grande
- radius: 80–180px (stabile)
- openAngle: 280–340° (gap 20–80°, pseudo-random)
- dotSize: 6–10px (newborn) → 14px (ghost)
- density: 0.35–0.50
- radiusLFO: ±4px, periodBars 24 (LFO pitch drift ±15 cents visivo)
- maxAge: 900–1200 frame (~35–45s)
- spawnRate: 1 ARC ogni 8–12 bar

**CH4 — chord density 0.3, vel ≤ 50, register G3–C5**
→ `ARC_CLUSTER` (3–5 archi concentrici per accordo)
- centro: X distribuita 30–70% canvas, Y = pitchToY
- radius base: `pitch * 1.2` px
- gap concentrico: 10–16px
- dotSize: 4–8px
- density: 0.30–0.45
- maxAge: 250–380 frame (~10–15s)
- nota caratteristica (#4 lidio, F#): boost radius +20%, density +0.15, misreg 2×

**CH5 — voice protagonista, density 0.5, frasi 1–3 note**
→ `ARC` piccolo
- radius: 18–42px
- openAngle: 290–330° (molto aperto)
- dotSize: 2–5px (più sottile di CH4)
- maxAge: 180–280 frame (~7–11s)
- `voiceGrowInGermoglio` true: spawn prob cresce linearmente in 16 bar iniziali
- phraseId: se riconosciuto, 3–5 ARC di frase si allineano su cerchio r 120–200px

**CH6 — lead eco, solo in `pulsazione`, leadProb 0.3**
→ `ARC` singolo
- radius: CH5.r + 12–20px
- openAngle: 200–260° (più chiuso di CH5)
- color: accent (verde-bianco lunare)
- maxAge: 200–320 frame
- layer routing: FG → MG (mai OVERLAY — il lead non fossilizza)

### Fisica

- Campo radiale debole dal centro verso fuori, forza 0.04
- Noise Perlin bassissimo (octave 1, scale 0.003): deriva quasi impercettibile
- Velocità: `v = 0.05 + (age/maxAge) * 0.75` (nascita ferma, accelerazione verso la morte)
- Zero gravità, zero rimbalzo

### Palette

- `bg`: `#0A0B10` (nero blu-notte)
- `ch2`: `#C8D4E0` (azzurro velato)
- `ch4`/`ch5`: `#8FA8C0` (azzurro-grigio)
- `accent` (#4 lidio): `#E8F0D8` (verde-bianco lunare)
- `residual`: `#1E2535` (blu-grafite su BG)

---

## II. TESSUTO — *Membrane orizzontali in tensione*

**Stato emotivo:** inquietudine emergente.
**Canali attivi:** CH0 (raro impulso), CH2, CH3 (bass follow-harmony), CH4 (protagonista staccato), CH6 (solo — sostituisce CH5).
**Assenti:** CH5 (silenzio totale), CH7.

### Primitive per canale

**CH0 — kick ogni 2 bar, vel ≤ 65**
→ `RECT` basso sottile, esplosione orizzontale
- H: 3px, W: 4px → W_target 20–40px in 8 frame (burst)
- Y: 0.82 (zona terreno, già a pavimento)
- maxAge: 25–35 frame
- layer: FG only

**CH2 — drone D3, density 0.1, vel ≤ 30**
→ `SEG` largo su riga quantizzata bassa
- Y: 0.75–0.85
- L: 32–40px, 3 layer sovrapposti
- jitter X: ±0.3 px/frame
- maxAge: 800–1100 frame
- layer: MG permanente → OVERLAY dopo 600 frame

**CH3 — bass follow-harmony, density 0.4, vel ≤ 70**
→ `SEG` medio su riga Y = pitchToY in fascia 0.65–0.90
- L: `velocity/3 + 10` px
- maxAge: 400–600 frame (nota sostenuta lunga)
- oscVert: ±0.8px
- layer: FG → MG → OVERLAY (se vel > 85)

**CH4 — chord staccato, density 0.6, vel ≤ 75, chordGrid**
→ `SEG` su riga Y = pitch per ogni nota dell'accordo
- L: `velocity/4 + 8` px
- Y: pitch quantizzato (semitono = 1 riga)
- burst di 3–6 SEG simultanei per colpo di griglia
- b6 eolio (nota caratteristica): boost +30% L, density +0.15
- maxAge: 120–200 frame
- fossil a 2px in OVERLAY (cicatrici orizzontali)

**CH6 — lead solo (sostituisce CH5), ogni 2 bar**
→ `SEG` micro in fascia alta
- Y: 0.05–0.35, righe proprie
- L: 4–10px, oscVert ±2px
- frasi 4–8 note = SEG multipli su righe separate
- layer: FG → MG (mai OVERLAY)

### Fisica

- Attrazione orizzontale debole verso X centro, forza 0.02
- Micro-jitter verticale per elemento (±1.5px, periodo 0.5–2s)
- Tensione: 2 SEG della stessa riga a gap < 3px → entrambi density +0.1 (ispessimento per contatto)

### Palette

- `bg`: `#0F0D0A` (nero caldo con ocra)
- `ch4`/`ch3`: `#D4B896` (ocra sbiadita)
- `ch6`: `#F0E0C0` (crema)
- `ch2`: `#9E8060` (terra bruciata)
- `accent` (b6 eolio): `#F0E0C0`, misreg +1X+1Y
- `fossil`: `#2A1E10`

---

## III. SOLCO — *Gravità, canyon, stratigrafie*

**Stato emotivo:** terra, peso.
**Canali attivi:** CH0 (pesante), CH2, CH3 (protagonista bass 16-step), CH4 (sedimento), CH5 (voice rara), CH7 (arp accompany).
**Assenti:** CH6 (il groove parla da solo).

### Primitive per canale

**CH0 — kick dub sincopato, density 0.7, vel ≤ 110**
→ `RECT` spesso con impatto su terrain
- H: 8–12px, W: 30–60px
- spawn in terzo medio, cade con `a = 1.2 px/frame²`
- impatto: schiaccia (W×1.4, H×0.6) in 3 frame
- maxAge post-impatto: 80–120 frame
- layer: FG → terrain (OVERLAY)

**CH2 — drone G3, density 0.1, vel ≤ 45**
→ `RECT` bedrock (già sul pavimento)
- H: 10–12px, W: 60–80px
- Y: 0.90–0.95 (fondo canyon)
- maxAge: 1000+ frame, transiziona in OVERLAY quasi subito

**CH3 — bass protagonista 16-step, density 0.8, vel ≤ 90**
→ `RECT` medio con caduta a gravità piena
- H: `velocity/10 + 2` px, W: `durata_nota * 0.8` px
- gravità: `a = 0.6 px/frame²`
- 6a dorica (nota caratteristica): H +3px, W +15%, color accent
- cycle extension (fasi avanzate): W *= 1.5 → 2.0
- maxAge: 300–500 frame
- layer: FG → MG → OVERLAY (forma terrain heightmap)

**CH4 — chord sedimento, density 0.4, vel ≤ 60**
→ `RECT` sottile a caduta lenta
- H: 3–6px, W: 25–50px
- gravità: `a = 0.3 px/frame²`
- cade sopra blocchi CH3 accumulati, si impila
- maxAge: 400–600 frame

**CH5 — voice rara, ogni 4 bar, vel ≤ 75**
→ `RECT` sottile che si stacca dai bordi dei blocchi CH3
- H: 2px, W: 6–16px
- X spawn = X blocco CH3 più vicino ±20px
- caduta con drag 0.4× (polvere)
- maxAge: 200–350 frame

**CH7 — arp accompany, arpRate 8, vel ×0.7**
→ `RECT` frammento minimo
- H: 2px, W: 6–10px
- X: bordo CH3 ± 20px
- gravità normale, maxAge 60–100 frame
- layer: FG only

### Fisica

- Gravità down: `a = 0.6 px/frame²` (standard, override per canale)
- Terrain profile: array altezze per colonna X, aggiornato al deposito
- Durante rupture: frana → blocchi terrain shift lateralmente 10–40px in 6 frame

### Palette

- `bg`: `#0C0E08` (nero verde-oliva)
- `ch3`: `#7A9060` (verde militare)
- `ch0`/`ch4`: `#506840` (verde-grigio)
- `accent` (6a dorica): `#B0D890` (verde salvia), misreg 0X -2Y
- `ruptureTint`: `#C8A840` (ocra-giallo, frana di luce)

---

## IV. RESPIRO — *Campo perforato, vuoto che respira*

**Stato emotivo:** apertura, pausa. **Unica traccia con fondo chiaro.**
**Logica invertita:** il campo pieno è il default. Le note creano **vuoti** (pori), non forme. Silenzio = pieno. Musica = assenza.
**Canali attivi:** CH2 (drone un'ottava alta), CH3 (bass impercettibile), CH4 (arioso), CH5 (espressiva), CH6 (eco rara).
**Assenti:** CH0, CH1, CH7.

### Primitive per canale

**CH2 — drone C4 ottava alta, density 0.05**
→ `PORE` enorme a chiusura lentissima
- r iniziale: 80–140px
- shrinkRate: chiusura in 350–520 frame (~14–20s)
- LFO radiusPulse: ±3px, periodBars 24
- layer: sottrae da OVERLAY (non deposita)

**CH3 — bass impercettibile, density 0.1**
→ `PORE` piccolo
- r: `velocity * 0.4` px (8–18)
- chiusura: 100–180 frame
- Y: terzo inferiore
- maxAge: 200 frame

**CH4 — chord density 0.4, register C4–F5**
→ `PORE` medio, uno per nota dell'accordo
- r: `velocity * 0.6` px (15–50)
- chiusura: 90–160 frame
- spawn note dell'accordo con lag 8ms
- cadenza CAmFG: durante C e F (note aperte) r +20%

**CH5 — voice espressiva, frasi 5–8 note**
→ `PORE` piccolo con chiusura rapida
- r: 12–30px, chiusura 50–100 frame
- phraseId: sequenza di pori su arco curva

**CH6 — lead eco, leadProb 0.25**
→ `PORE` come CH5 con delay 200–500ms
- r: CH5.r × 0.9
- gradient bordo più soffice (density -0.15)

### Fisica

- Nessuna gravità, nessun moto. I pori nascono, si chiudono, spariscono.
- Durante rupture: i pori smettono di chiudersi (bordi si lacerano: density bordo da 0.75 → 0.2 in 60 frame). Cicatrici permanenti in OVERLAY (vuoti fissi che MACCHINA eredita come ferite).

### Palette (unica palette chiara)

- `bg` / campo pieno: `#F0ECE0` (carta ingiallita)
- `interno poro`: trasparenza assoluta
- `bordo poro`: `#D8D0BC` (ombra)
- `accent` (ionico puro): `#E8F8E0` (verde-bianco)
- `ruptureTint`: `#D08060` (arancio-cotto, lacerazioni)

---

## V. MACCHINA — *Griglia logica, circuito digitale*

**Stato emotivo:** trance meccanica.
**Canali attivi:** tutti tranne assenti. CH7 PROTAGONISTA (arp 16°).
**Regola fondamentale:** nessuna fisica continua. Snap alla griglia `cellPx = 8px`. Le celle cambiano stato (on/fading/off), mai posizione.

### Primitive per canale

**CH0 — kick quasi 4/4, density 0.8**
→ `PATH` orizzontale su riga intera
- Y fissa: 0.85
- length: `velocity/4` celle (20–30)
- velocità percorrenza: 4 frame → sinistra-destra
- maxAge riga: 15–25 frame (flash)

**CH1 — hi-hat 16° stretti**
→ `CELL` singola duty variabile
- cellSize: 8×8px
- posizione: semi-random fascia Y 0.05–0.35
- dutyCycle: 2 frame on, 3 frame off

**CH2 — drone D3, density 0.15**
→ colonna verticale intera a bassa density (bus alimentazione)
- X: colonna D3, sempre on
- density: 0.12–0.18
- LFO: trema ±1 cella su X (pitch drift)

**CH3 — bass pump 8 hit/16**
→ `RECT` celle 2×3 o 3×3 in burst
- X: `pitch mod (W/cellPx)`, Y: terzo inferiore
- stayOn: 8–15 frame, poi decay

**CH4 — chord ciclo 4×4**
→ `RECT` celle 3×3 o 4×4
- vel < 60 → 3×3, vel ≥ 60 → 4×4
- posizione deterministica per accordo (Dm angolo basso-sx, ecc.)
- decay: 50–80 frame

**CH5 — voice rara, ogni 8 bar**
→ `CELL` duty lento
- 5 frame on, 3 frame off (LED diagnostico)

**CH6 — lead**
→ `CELL` con duty invertito rispetto CH5 (XOR)
- stessa area di CH5

**CH7 — PROTAGONISTA, arp 16°**
→ `PATH` lineare ortogonale
- length: `pitch_range/4` celle (4–16)
- velocità: 2 celle/frame
- direzione: orizzontale se note ascendenti, verticale se discendenti
- pulsazione: solo righe; densità: righe e colonne intrecciate
- maxAge: 20–40 frame

### Durante rupture (glitch)

- Celle duplicano in posizioni errate (offset +random 3–8 celle)
- Alcune colonne invertono stati
- PATH CH7 prendono diagonali (illegali normalmente) per 4–8 secondi

### Palette

- `bg`: `#050508` (nero puro freddo)
- `ch7`: `#00E8A0` (verde-ciano elettrico)
- `ch3`: `#0080C0` (blu elettrico)
- `ch0`: `#40A0FF` (azzurro flash)
- `ch2` bus: `#003850`
- `accent` (6a dorica): `#80FFD0` (acqua brillante), misreg +1X
- `ruptureTint`: `#FF6030` (arancio-errore)

---

## VI. TEMPESTA — *Campo vettoriale, aurora boreale*

**Stato emotivo:** picco. Densità massima assoluta.
**Canali attivi:** tutti. CH5+CH6 in **hocket** (una zip umana). CH7 retrocede a texture.

**Suscettibilità al campo vettoriale** (immunità → travolgimento):
- CH2: 0.05 (quasi immune, linea orizzonte stabile)
- CH3/CH4/CH0: 0.50
- CH5/CH6/CH7: 1.00 (completamente travolti)

### Primitive per canale

**CH0 — kick 4/4 + push, vel ≤ 120**
→ `TRAIL` spessa orizzontale
- dotSize: 8–12px
- scia: 15–25 dot che si espandono orizzontalmente, deviati dal campo
- maxAge: 40–60 frame

**CH1 — hi-hat polirritmico**
→ `TRAIL` micro (dot 1–2px), moltissimi spawn
- completamente caotici
- maxAge: 15–25 frame

**CH2 — drone E3, density 0.3 (MAX suite)**
→ `TRAIL` spessa quasi immobile
- dotSize: 8–10px, density: 0.60
- linea orizzonte stabile
- maxAge: 700–900 frame → OVERLAY

**CH3 — bass 7 hit/16, vel ≤ 100**
→ `TRAIL` media
- dotSize: 5–7px
- scia 10–18 dot deviata dal campo
- b2 frigio (F sopra E): scia +40% lunghezza + color accent
- maxAge: 80–120 frame → MG

**CH4 — chord 4×2 ciclo cortissimo**
→ `TRAIL` media
- ciclo 8 bar: Em F Dm Am (F = bII frigio)
- quando arriva F: nuovi dot virano verso ruptureTint 2 frame

**CH5 — voice hocket, ogni bar**
→ `TRAIL` sottile (dotSize 2–4px)
- frasi 8–12 note alternate con CH6
- phraseId: sequenza disegna silhouette ideogramma distorto dal campo

**CH6 — lead hocket**
→ `TRAIL` identica a CH5 ma:
- color: accent magenta (`#FF80C0`)
- spawnano solo quando CH5 è in pausa (zip)
- misreg invertite: -2X invece di +2X

**CH7 — arp texture, vel ×0.4**
→ `TRAIL` micro, moltissimi spawn
- completamente travolto dal campo
- maxAge: 10–20 frame, mai in MG/OVERLAY

### Campo vettoriale

- Burst direzionale ogni 3–12 frame (trigger = nota CH7 o event casuale)
- Intensità burst = velocity della nota CH3 o CH5 triggerante
- Direzione dominante ruota nel tempo (non costante)
- Durante rupture (omen → takeover): campo prende controllo totale 8–16 secondi. TUTTI gli elementi inclusi i fossili OVERLAY degli altri biomi vengono trascinati in stessa direzione (evento drammatico: storia della suite spazzata).

### Palette

- `bg`: `#06040E` (viola-nero profondo)
- `ch3`/`ch4`: `#9060D0` (viola magnetico)
- `ch7`/`ch1`: `#C080FF` (viola elettrico)
- `ch2`: `#302050` (viola scuro)
- `accent` (b2 frigio): `#FF80C0` (magenta caldo), misreg -2X +1Y
- `ruptureTint`: `#FFD020` (giallo-oro shock, 2–4 frame)

---

## VII. RITORNO — *Camera in orbita, pianeta-fossile*

**Stato emotivo:** congedo.
**Geometria propria:** nessuna. RITORNO è una **posizione della camera**, non un nuovo linguaggio.
**Canali attivi:** CH0, CH2, CH3 (2 hit/16), CH4, CH5 (protagonista esposta), CH6 (eco rara), CH7 (morente).

### Eredità geometrica

- CH5 riprende **ARC** di NEBBIA (r 20–50, openAngle 280–320°)
  - frasi lunghe 6–10 note
  - phrase memory finale: se `phraseId` riconosciuti nel corso della suite, RITORNO li ripropone come micro-costellazioni (ideogrammi della suite)
- CH7 decresce linearmente da 100% a 0% su 48 bar, poi tace
- Gli altri canali ereditano le primitive del bioma precedente dominante (da decidere in calibrazione)

### Camera

- zoom-out continuo da posizione di fine TEMPESTA
- barrel distortion crescente
- i 6 biomi precedenti diventano regioni del canvas (scala ridotta)
- desaturazione progressiva: `lerp(biome_sat, biome_sat * 0.35, t_zoom)` — mai grigio totale
- micro-pulse globale su nota root A aeolio: density tutti i dot +0.05 per 2 frame ("pianeta respira")

### Palette

- Tutte le palette precedenti desaturate progressivamente
- Nessun accent nuovo
- Immagine finale = stato OVERLAY completo (unica opera visiva permanente della performance)

---

## Matrice operativa

| CH | Strumento | NEBBIA | TESSUTO | SOLCO | RESPIRO | MACCHINA | TEMPESTA | RITORNO |
|----|-----------|--------|---------|-------|---------|----------|----------|---------|
| CH0 | kick | — | RECT burst | RECT caduta | — | PATH riga | TRAIL spessa | RECT sparso |
| CH1 | percussion | — | CELL bassa | CELL bassa | — | CELL duty | TRAIL micro | — |
| CH2 | drone | ARC grande | SEG largo | RECT bedrock | PORE enorme | PATH colonna | TRAIL immobile | ARC medio |
| CH3 | bass | — | SEG medio | RECT caduta | PORE piccolo | RECT celle | TRAIL media | SEG sparso |
| CH4 | chord | ARC cluster | SEG staccato | RECT lento | PORE medio | RECT celle | TRAIL media | SEG sustain |
| CH5 | voice | ARC piccolo | — | RECT frammento | PORE piccolo | CELL duty | TRAIL sottile | ARC lungo |
| CH6 | lead | ARC risposta | SEG micro | — | PORE eco | CELL XOR | TRAIL hocket | ARC eco |
| CH7 | arp | — | SEG micro | RECT erosione | — | PATH lineare | TRAIL texture | PATH morente |

---

## Tre regole universali non negoziabili

1. **Nota modale caratteristica** (6a dorica, #4 lidio, b2 frigio, b6 eolio, ecc.) → boost: `dotSize × 1.5`, `density + 0.2`, `misreg × 2`, `maxAge × 1.3`. La grammatica armonica È grammatica visiva.

2. **Layer routing fisso:**
   - CH2 è l'unico che raggiunge **OVERLAY sistematicamente**
   - CH3 raggiunge OVERLAY solo se `velocity > 85`
   - CH6 e CH7 **non toccano mai OVERLAY** (lead e arp non lasciano geologia)

3. **Continuità OVERLAY:** i fossili del bioma N sono visibili nel bioma N+1 come sfondo degradato. **RITORNO mostra tutto.** L'ultima immagine è l'unico artefatto fisico permanente della performance — può essere la copertina del disco.

---

## Primitive — catalogo tecnico

| Primitiva | Stato particella | Uso principale |
|-----------|------------------|----------------|
| `ARC` | cx, cy, r, openAngle, gapStart, dotSize, density | NEBBIA (tutti), RITORNO (voice) |
| `RECT` | x, y, w, h, vy, gravity, impactFlag | TESSUTO kick, SOLCO (tutti), MACCHINA bass/chord |
| `SEG` | x, y, w, rowY, oscAmp, oscFreq | TESSUTO (chord/bass/lead/drone) |
| `PORE` | cx, cy, r, shrinkRate, edgeSoftness | RESPIRO (tutti) |
| `CELL` | cellX, cellY, dutyOn, dutyOff, state | MACCHINA (hi-hat/voice/lead) |
| `PATH` | cellX0, cellY0, length, dir, progress, speed | MACCHINA (kick/arp/drone), RITORNO arp |
| `TRAIL` | dots[], fieldSusceptibility, dotSize | TEMPESTA (tutti) |

Ogni primitiva condivide il trunk comune: `role`, `age`, `maxAge`, `state` (newborn/stable/ghost/fossil/dead), `layer` (fg/mg/overlay), `colorKey` (primary/accent/residual).

---
<!-- knowledge-graph links -->
[[MOOD]] [[VISUAL-VISION]] [[02-MUSIC]] [[tracks.js]] [[layers.js]] [[geo.js]]
