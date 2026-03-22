# TASK: Implementare v0.7.0 — IL DIRETTORE (Camera 2D)

## Prima di iniziare

Leggi questi file nell'ordine indicato:
1. `RULES.md`
2. `DESIGN.md` — sezione "Il Direttore (camera 2D)"
3. `ROADMAP.md` — milestone v0.7.0
4. `sandbox.html` — v0.6.0 (campo + DNA + generazioni + colore + mutazioni)
5. `CHANGELOG.md`

## Obiettivo

Aggiungere il sistema camera 2D al sandbox.

## I 4 shot

Implementati come trasformazione del canvas context (translate + scale).
Il campo disegna sempre nello stesso spazio — la camera decide cosa mostrare.

### WIDE (default)
Scale 1.0. Tutto il campo. Usato in bassa energia.

### MEDIUM
Scale 1.5x. Centra sulla zona con piu' entita' vive.
Transizione: quando intensity supera 0.3.

### MACRO
Scale 3x su un punto specifico.
Il punto e' scelto dove c'e' piu' attivita' (densita' piu' alta).
Mostra la grana del dither: i singoli punti della matrice Bayer,
la differenza tra generazioni giovani (fini) e vecchie (grosse),
i colori A/B a livello di pixel.
Durata breve: 4-8 beat (o 3-5 secondi), poi ritorna.

### PAN
Scale 1.2x con drift laterale. Velocita' proporzionale a rhythmicity.
Leggera oscillazione verticale sinusoidale.

## Transizioni

Lerp su scale e offset:
```
currentScale += (targetScale - currentScale) * lerpSpeed;
currentX += (targetX - currentX) * lerpSpeed;
currentY += (targetY - currentY) * lerpSpeed;
```

lerpSpeed:
- rhythmicity > 0.5: 0.08 (transizione ~0.5s)
- rhythmicity <= 0.5: 0.02 (transizione ~2s)

## Integrazione col Regista

Il Regista (gia' gestisce mutazioni) ora puo' anche cambiare framing.
Quando il Regista decide una mutazione, puo' includere un cambio camera:

- 60% solo mutazione campo
- 25% mutazione + cambio camera
- 15% solo cambio camera

Scelta dello shot:
- intensity < 0.3 → WIDE
- rhythmicity > 0.6 e random < 0.4 → MACRO
- trajectory == 0 (plateau) → PAN
- altrimenti → MEDIUM

## Pannello sandbox

Aggiungi:
- 4 pulsanti: WIDE / MEDIUM / MACRO / PAN
- Toggle AUTO CAMERA (default ON)
- Readout: shot corrente, target, scale, offset

## Vincoli

- Modifica solo `sandbox.html`
- Il framing e' SOLO trasformazione del context.
  Il campo non sa che la camera esiste.
- MACRO su campo halftone deve mostrare la struttura interna.
  Questo e' il test chiave: se lo zoom 3x non mostra niente
  di interessante, il dot-size o la densita' vanno aggiustati.
- `ctx.save()` / `ctx.restore()` intorno alla trasformazione.
- 60fps anche con MACRO (il campo disegna tutto, il clipping
  e' del browser — usare `ctx.clip()` se serve).
- Tutti i parametri in CFG.

## Dopo aver implementato

1. Testa ogni shot manualmente
2. MACRO: vedi la grana del dither? Vedi la differenza tra generazioni? Se no, aggiusta.
3. PAN su ambient (rhythmicity 0.1): drift lento e fluido?
4. Transizione WIDE → MACRO su ritmico: taglio rapido?
5. Verifica che MACRO ritorni automaticamente dopo qualche secondo
6. Verifica 60fps
7. Salva snapshot: `cp sandbox.html versions/sandbox-v0.6.0.html`
8. Aggiorna `CHANGELOG.md`
9. Commit: `v0.7.0: Il Direttore — camera 2D con 4 shot, lerp adattivo, integrazione regista`
10. Push su GitHub
