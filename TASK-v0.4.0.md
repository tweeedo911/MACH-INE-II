# TASK: Implementare v0.4.0 — CAMPO HALFTONE

## Prima di iniziare

Leggi questi file nell'ordine indicato:
1. `RULES.md` — regole di progetto
2. `DESIGN.md` — TUTTO, con attenzione particolare a: "Il trattamento halftone",
   "Il DNA di sessione", "Le generazioni", "Riferimenti visivi", "Kill list"
3. `ROADMAP.md` — milestone v0.4.0
4. `sandbox.html` — codice v0.3.0 (da modificare)
5. `docs/refs/` — guarda le 5 immagini di riferimento. Sono il target estetico.
6. `CHANGELOG.md`

**IMPORTANTE:** Guarda le immagini in `docs/refs/`. L'estetica e':
halftone/dither come materiale primario, alto contrasto, collisione griglia/organico,
composizione strutturata, contrasto di scala (pixel grandi accanto a grana fine).
NON e' un visualizer tipico con particelle che fluttuano o barre che rimbalzano.

## Obiettivo

Sostituire la scena di test del sandbox con il campo halftone.
Questo e' il fondamento visivo — se non e' bello da solo, niente
di quello che viene dopo lo salvera'.

## Il campo di densita'

Lo schermo e' una matrice di "celle". Ogni cella ha un valore di densita' (0-1).
La matrice Bayer 8x8 determina quali pixel sono accesi:
se `densita' > bayer(x, y)` il pixel e' acceso (bianco), altrimenti spento (nero).

```
Matrice Bayer 8x8 (valori 0-63, normalizzati a 0-1):
 0 32  8 40  2 34 10 42
48 16 56 24 50 18 58 26
12 44  4 36 14 46  6 38
60 28 52 20 62 30 54 22
 3 35 11 43  1 33  9 41
51 19 59 27 49 17 57 25
15 47  7 39 13 45  5 37
63 31 55 23 61 29 53 21
```

Ma la "cella" non e' necessariamente 1px. La dimensione della cella (dot-size)
e' un parametro che varia:

- **Dot-size globale** guidato dalla brillantezza (slider brightness nel sandbox):
  brightness 0 = dot-size 12-16px (punti grossi, grana brutalista)
  brightness 1 = dot-size 1-2px (grana fine, quasi fotografica)

- Il dot-size puo' variare spazialmente: zone diverse dello schermo
  possono avere dot-size diverso. Questo produce il contrasto di scala
  dei riferimenti visivi.

## Rendering del campo

La densita' del campo NON e' uniforme. E' modulata da:

1. **Un primitivo strutturale.** Per v0.4.0, implementare BANDA e BLOCCO:

   **BANDA:** una zona rettangolare (orizzontale o verticale) dove la densita'
   e' alta (0.6-1.0) rispetto al campo circostante (0.0-0.2).
   La banda ha bordi netti. La sua larghezza pulsa con l'intensita'.
   La sua posizione si muove lentamente.

   **BLOCCO:** un rettangolo di densita' o dot-size diverso dal campo.
   Bordi nettissimi. Puo' apparire e scomparire. La sua dimensione
   e' proporzionale a una banda frequenziale specifica.

2. **L'intensita' globale.** Modula la densita' base del campo:
   intensity 0 = campo quasi nero (densita' base ~0.02)
   intensity 1 = campo denso (densita' base ~0.4)

3. **Stereo width.** Modula la distribuzione spaziale:
   width 0 = densita' concentrata nella fascia centrale
   width 1 = densita' distribuita uniformemente

## Quello che deve succedere visivamente

Con tutti gli slider a 0: schermo nero con dither Bayer appena visibile
(densita' ~0.02, dot-size grande). Respiro. Quasi niente.

Intensity sale a 0.3: il campo si popola. Le bande/blocchi emergono dal dither.
La grana e' grossa se brightness e' basso.

Intensity a 0.6, brightness a 0.5: il campo e' vivo. Le strutture sono nette.
Il dot-size e' medio. Alto contrasto tra zone dense e zone vuote.

Intensity a 1.0: il campo raggiunge densita' alta. Quasi bianco nelle zone attive.
I bordi tra zone sono nettissimi.

Brightness che sale: la grana si affina. Si passa da pixel enormi brutalisti
a una texture quasi fotografica. Il contenuto e' lo stesso — cambia la risoluzione.

**ONSET (spazio):** quando l'utente preme spazio, un'onda di densita'
si propaga da un punto. Non e' un flash sovrapposto — e' il campo stesso
che si eccita localmente. L'onda decade rapidamente.

**MIDI (M):** una colonna verticale di densita' alta a posizione X random.
Compare e decade. E' il campo che si attiva in quella zona.

## Pannello sandbox

Rimuovi la scena di test precedente (particelle).
Mantieni tutti gli slider e il regista esistenti.

Aggiungi:
- Slider DOT SIZE override (per testare manualmente, da 1 a 16)
- Toggle INVERT (scambia bianco e nero)
- Readout: dot-size corrente, densita' media campo, numero elementi vivi

## Performance

Il campo halftone e' computazionalmente pesante se fatto pixel per pixel.
Strategie di ottimizzazione:

- **NON** usare `getImageData/putImageData` per il campo intero a 60fps.
  Troppo lento.
- Usa `fillRect` con dimensione = dot-size per ogni "punto acceso".
  Con dot-size 8px, ci sono (1920/8)*(1080/8) = ~32000 celle.
  Con dot-size 2px, ci sono ~500000 celle — troppo per fillRect singoli.
- Per dot-size piccoli (1-4px), usa `createImageData` + `putImageData`
  su un buffer ridotto, poi disegna il buffer scalato con
  `ctx.drawImage()` e `imageSmoothingEnabled = false`.
- Per dot-size grandi (8+), usa `fillRect`.
- Soglia: se dot-size >= 6, usa fillRect. Se < 6, usa buffer + scale.
- Target: 60fps a 1920x1080.

## Vincoli

- Modifica solo `sandbox.html`
- File self-contained, nessuna dipendenza esterna
- Estetica: GUARDA LE IMMAGINI IN `docs/refs/`. Il risultato deve
  avvicinarsi a quel mondo, non a un visualizer generico.
- Alto contrasto: nero netto e bianco netto. Non grigio uniforme.
- Bordi netti tra zone, non sfumature.
- Il dither Bayer deve essere VISIBILE come pattern, non nascosto.
- Tutti i parametri in CFG.

## Dopo aver implementato

1. Testa con slider a 0: deve essere quasi nero con dither appena percepibile
2. Testa con intensity 0.5, brightness 0.3: grana grossa, strutture visibili
3. Testa con intensity 0.5, brightness 0.8: stessa struttura ma grana fine
4. Testa onset (spazio): onda di densita' visibile
5. Testa inversione: bianco su nero → nero su bianco
6. Verifica 60fps con DevTools > Performance
7. Confronta visivamente con le immagini in `docs/refs/` — ci siamo?
8. Salva snapshot: `cp sandbox.html versions/sandbox-v0.3.0.html` (se non gia' fatto)
9. Aggiorna `CHANGELOG.md`
10. Commit: `v0.4.0: campo halftone con dither Bayer, dot-size dinamico, primitivi BANDA e BLOCCO`
11. Push su GitHub
