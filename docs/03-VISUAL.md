# 03 — VISUAL

## Linguaggio

Il visivo non è "visualizer". È **linguaggio sonoro reso in immagine**:
ogni nota MIDI è un punto, ogni canale ha un comportamento spaziale,
ogni traccia ha una propria identità grafica.

## DNA di sessione

`src/dna.js` genera una volta per sessione:
- 2-4 primitivi visivi tra 8 canonici: `BANDA, BLOCCO, VETTORE, VUOTO, FRONTE, SCIAME, STRISCIA, MATRICE`
- frequency mapping (horizontal/radial)
- dot size range
- evolution speed
- 10 zone Voronoi (`ZONE_RES = 24`) con birthMul e colorAffinity per zona

`R` rigenera il DNA in live.

## Halftone Bayer 8x8

`src/field.js` itera ogni cella canvas, calcola densità da:
- zona Voronoi corrente
- primitivi attivi
- entity grid (spatial hash 32px)
- MIDI trail (column/pulse/scatter/band/trail per canale)
- onset waves (cerchi espandenti da onset audio)
- sediment (memoria condivisa tra scene)

Applica soglia Bayer e disegna dot. **Zone Bayer crescono con l'audio.**

## 7 composizioni grafiche (comp-*)

Ogni traccia ha la sua composizione visiva:

| comp           | traccia      | tratto                                 |
|----------------|--------------|----------------------------------------|
| `comp-griglia` | NEBBIA       | griglia sospesa, breathing             |
| `comp-liminale`| TESSUTO      | MIDI dots 2x, voice riempie il canvas  |
| `comp-linee`   | SOLCO        | linee solco, sediment                  |
| `comp-treno`   | MACCHINA     | bande verticali ritmiche               |
| `comp-quadrati`| TEMPESTA     | quadrati che breathing + holes organici|
| `comp-negativo`| RESPIRO      | negativo / fondo bianco                |
| `(default)`    | RITORNO      | dissoluzione su fondo neutro           |

## Sistema cromatico A / B / C

`src/colors.js` mantiene 3 ruoli colore (orange / cyan / magenta di default).
Il sistema interpola palette al cambio fase. `getBgString()` esporta lo sfondo corrente.

Climax: colour shift + compression al picco arc.

## Firma — gesti narrativi forti

`src/firma.js` espone 4 stati gating in live:

| flag           | tasto | effetto                                              |
|----------------|-------|------------------------------------------------------|
| `gelo`         | `G`   | freeze entity aging + birth                          |
| `convergenza`  | `J`   | tutte le entità attratte verso il centro             |
| `vuotoTotale`  | `V`   | blackout totale (early-out in `render.js`)           |
| `densityCap`   | (auto)| moltiplicatore birth rate (opening ramp / closing fade)|

## Camera

Modes: `WIDE / MEDIUM / MACRO / DRIFT` legati all'arco narrativo.

## Regole grafiche

- **Glitch = sottrazione di grammatica**, non accumulo. Meno layer, più sottrazione.
- I primitivi sono **vocabolario**, non decorazione.
- Cambi di scena devono essere giustificati da cambi musicali, mai arbitrari.

Per la storia visiva (gap analysis, scelte abbandonate):
`archive/docs/old/DESIGN.md`, `archive/docs/old/RESEARCH-V4-VISUAL-DIRECTION.md`,
`archive/docs/old/ROADMAP-VISUAL.md`,
`.claude/skills/visual-directing/references/engine-visual-profiles.md`.
