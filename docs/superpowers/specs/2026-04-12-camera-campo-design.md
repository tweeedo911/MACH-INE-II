# Camera nel Campo Materiale — Design Spec

> Spec elaborata il 2026-04-12 (sessione 10), da implementare in sessione 11.
> Raffina la Sezione 4 della spec campo-infrastruttura-design.md.

---

## Contesto

Il Campo Materiale (campo.js) è ora a grid 96×54 (16:9 nativo), offscreen
960×540, con cellPx variabile per ruolo e firma a 3 strati di solidificazione.
Manca il sistema camera: il campo è sempre visto a zoom 1.0 fullscreen.

## Obiettivo

Aggiungere un sistema camera che opera sull'offscreen renderizzato:
zoom in (macro), zoom out (orbita), barrel distortion (RITORNO).
Pilotato automaticamente da director3 per fase musicale.

---

## Stato camera

Estensione di `worldState.camera` (in world-state.js):

```javascript
camera: {
  zoom:   1.0,    // 1.0 normale, 1.5-2.0 macro, 0.3-0.5 orbita
  focusX: 0.5,    // 0→1, centro attenzione X
  focusY: 0.5,    // 0→1, centro attenzione Y
  barrel: 0,      // 0→1, distorsione sferica (solo RITORNO)
}
```

Tutti i valori interpolano smoothly (lerp per frame, ~0.02 per step).

---

## Tre regimi

### Normale (zoom 1.0)

Offscreen intero → canvas intero. Come adesso. Nessun costo aggiuntivo.

### Macro (zoom 1.5-2.0×)

Ritaglia porzione dell'offscreen centrata su (focusX, focusY), scala a
schermo pieno. A zoom 2× si vede metà del campo — grana Bayer leggibile.

```
srcW = offW / zoom
srcH = offH / zoom
srcX = focusX * offW - srcW/2   (clamp ai bordi)
srcY = focusY * offH - srcH/2
ctx.drawImage(_off, srcX, srcY, srcW, srcH, 0, 0, canvasW, canvasH)
```

**Condizione di attivazione macro in germoglio:** il macro si attiva solo
quando la densità media del campo supera 0.05. Al germoglio iniziale
(campo vuoto) si resta a zoom 1.0. Previene l'effetto "nero con 3 punti".

### Orbita (zoom 0.3-0.5×)

Offscreen scalato giù e centrato su nero.

```
dstW = canvasW * zoom
dstH = canvasH * zoom
dstX = (canvasW - dstW) / 2
dstY = (canvasH - dstH) / 2
ctx.fillRect(0, 0, canvasW, canvasH)   // nero
ctx.drawImage(_off, 0, 0, offW, offH, dstX, dstY, dstW, dstH)
```

### Barrel distortion (solo RITORNO)

Implementazione via **LUT precalcolata** per performance:

1. Al primo frame con `barrel > 0`, precalcola una mappa di displacement
   `_barrelLUT = new Int32Array(offW * offH)` dove ogni entry contiene
   l'offset nel buffer sorgente del pixel distorto.
2. Ogni frame successivo: copia pixel per pixel usando la LUT.
   Costo: un lookup + una copia per pixel (vs calcolo trigonometrico).
3. La LUT dipende da `barrel` (coefficiente). Se barrel cambia (progressivo
   in RITORNO), ricalcola la LUT ogni ~30 frame (non ogni frame).

**Formula barrel** (per ogni pixel):
```
dx = (px - centerX) / centerX    // -1..1
dy = (py - centerY) / centerY    // -1..1
r = sqrt(dx*dx + dy*dy)
r_distorted = r * (1 + barrel * r * r)   // barrel 0→0.6
srcX = centerX + dx/r * r_distorted * centerX
srcY = centerY + dy/r * r_distorted * centerY
```

**Fallback:** se la LUT è troppo pesante (>16ms per generazione),
usare una sfumatura alfa radiale che simula curvatura (costo quasi zero).

---

## Pilotaggio automatico (director3)

| Fase          | Zoom target | Focus         | Barrel | Condizione                  |
|---------------|-------------|---------------|--------|-----------------------------|
| germoglio     | 1.0→1.5     | centro        | 0      | solo dopo densità media>0.05|
| pulsazione    | 1.0         | centro        | 0      | visione normale             |
| densità       | 1.0         | drift circ.   | 0      | r=0.1, periodo 30s          |
| rottura       | 0.85        | centro        | 0      | leggero zoom out, respiro   |
| dissoluzione  | 1.0→1.3     | centro        | 0      | intimità + convergenza auto |
| RITORNO       | 1.0→0.3     | centro fisso  | 0→0.6  | progressivo su tutta durata |

### Drift circolare (fase densità)

```javascript
const driftR = 0.1;
const driftPeriod = 30; // secondi
const angle = (globalTime / driftPeriod) * Math.PI * 2;
camera.focusX = 0.5 + Math.sin(angle) * driftR;
camera.focusY = 0.5 + Math.cos(angle) * driftR;
```

### Interpolazione zoom

Tutti i target zoom/focus/barrel interpolano via lerp ogni frame:
```javascript
camera.zoom += (targetZoom - camera.zoom) * 0.02;
camera.focusX += (targetFocusX - camera.focusX) * 0.02;
// ecc.
```
Il fattore 0.02 produce transizioni smooth (~2-3 secondi per raggiungere il target).

---

## File da toccare

| File | Modifica |
|------|----------|
| src/world-state.js | Aggiungere zoom/focusX/focusY/barrel a camera |
| src/campo.js | Camera crop/scale in renderCampo + barrel LUT |
| src/director3.js | Pilotaggio camera per fase + drift circolare |
| src/config.js | Opzionale: camera speed, drift params |

---

## Performance budget

- Normale: zero costo aggiuntivo
- Macro: zero costo (solo parametri diversi a drawImage)
- Orbita: un fillRect nero + un drawImage scalato (trascurabile)
- Barrel LUT generazione: ~50ms una tantum (precalcolo), poi ~5ms/frame per lookup
- Barrel LUT ricreazione: ogni ~30 frame quando barrel cambia → ~1.7ms/frame ammortizzato

---

## Non incluso in questa spec

- ASCII depth pass a zoom 8+× (VISUAL-VISION §3) — rimandato, richiede font rendering
- Rupture nel campo — spec separata
- Calibrazione biomi — sessione dedicata post-camera
