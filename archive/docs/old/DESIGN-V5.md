# MACH:INE II → v5 — Design Document

> Documento vivo. Qui si raccolgono visione, decisioni e idee per la prossima versione.
> Aggiornato durante le sessioni di brainstorming. Fa fede questo documento.

## Sessione 1 — 5 Aprile 2026

### Contesto
Analisi della sessione registrata (45m22s, 36519 eventi MIDI).
Review completa del production team (7 ruoli). Voto unanime: 3/5.
Diagnosi: "L'architetto è bravo, l'orchestra è sorda."

### La visione
Un **disco continuo** senza stacchi, come un DJ set.
Ogni traccia ha identità musicale e visiva propria.
Tutto costruito con lo stesso vocabolario: i **dot Bayer**.
Viaggio emotivo: ambientamento → coinvolgimento → ballo → emozione.
Estetica ricercata. Personalità forte.

**Non è un pezzo lungo 45 minuti. È un album che suona bene dall'inizio alla fine.**

### Riferimenti
- **Musicali:** Floating Points (primario), Autechre, Aphex Twin — mondo IDM
- **Visivi:** Pinterest moodboard graphic design contemporaneo, Ryoji Ikeda (data)
- **Palette:** combinazioni forti, fluo ammesso, fondi colorati (non solo nero)

---

## Direzione musicale

### Principi
- Ogni traccia riconoscibile in 30 secondi — basso, ritmo, melodia propri
- Groove IDM: ballabile ma mai scontato, obliquo, intelligente
- Apertura ambient: CH5/CH6 come "gocce d'acqua su superficie scura"
- Il basso è la firma di ogni traccia
- Il MIDI deve essere udibile: le melodie più forti della texture, non più deboli
- Ogni canale è servo dell'arco del MacroComposer — nessun bypass

### Arco emotivo (7 tracce)
1. **Ti ambienta** — ambient, drone, gocce rare
2. **Qualcosa emerge** — curiosità, texture cresce
3. **Ti cattura** — primo groove, muovi la testa
4. **Respiro** — pausa integrata, reset
5. **Sei dentro** — groove pieno, melodie sopra
6. **Balli** — energia pura, techno IDM
7. **Ti rilascia** — ritorni a terra, emozione

### Problemi v4 da risolvere
- CH1 GRAIN: 58.5% degli eventi, bypassa density → deve essere gatato dall'arco
- CH7 RUPTURE: 27% → deve essere max 5-8%, evento raro e devastante
- CH5/CH6: vel avg 37/31 → floor a 28 minimo, target alzati
- CH3 BASS: 363 note in 45min → motivo riconoscibile per traccia
- CH0 KICK: monopitch C2 → almeno 3-4 pitch per modo
- 8 leak dove i layer bypassano il MacroComposer → tutti da chiudere

---

## Direzione visiva

### Principi
- I dot sono il linguaggio. Stessi strumenti, brani diversi.
- Differenze via: dimensione, densità, organizzazione, movimento, ritmo, colore, spazio
- Il MIDI non decora il visivo — **è** il visivo
- Portare il Bayer al suo limite con soluzioni geniali, non effetti
- **Fondi colorati** — non solo nero. Osare con combinazioni forti.
- Parallasse/livelli per profondità senza 3D reale
- Non riscrivere il renderer — ristrutturare la regia

### Struttura layer
| Layer | Funzione | Velocità |
|-------|----------|----------|
| Background | Colore/ambiente della traccia | Statico o lentissimo |
| Midground | Composizione spaziale | Legata al BPM |
| Foreground | Eventi MIDI diretti | Tempo reale |
| Overlay | Texture fine (Bayer residuo) | Indipendente |

### Idee visive
1. **Quadrati pulsanti col kick** — 4 blocchi illuminati in sequenza col pattern ritmico
2. **Linee parallele come accordi** — orizzontali = voci, si muovono col voice leading
3. **Viaggio in treno** — camera laterale, note come paesaggio, velocità = BPM
4. **Data/Ikeda** — griglia stream, colonne accese dal MIDI, B/W puro
5. **Schermo colorato saturo** — sfondo giallo, strumenti scavano geometrie nere
6. **Spazio liminale** — prospettiva convergente, note come oggetti in profondità

### Bayer al limite
- Dot enormi (20-30px) → pittorici, quasi Hirst
- Dot microscopici (1-2px) → data pura
- Densità zero con un solo dot → dot come performer
- Densità 100% su fondo colorato → schermo diventa il colore
- Threshold invertito → dot come buchi nel colore
- Scala Bayer variabile → 4×4 grossolana vs 16×16 finissima

---

## Palette

Ispirazione: moodboard Pinterest, graphic design contemporaneo.
Principi: combinazioni forti, fluo ammesso, palette limitate (2-3 colori per traccia),
fondi colorati NON solo nero, sofisticazione > effetto.

### Colori di riferimento (dal moodboard)
```
#7BBA91  cambridge blue / sage
#EFE6DE  cream vanilla
#DD3A44  punchy pink
#FE6B0D  electric orange
#CDD71D  lime
#BADE4F  june bud
#6B8EEC  cornflower blue
#F8ED00  giallo elettrico
#9B8FCE  lavanda
#20130D  licorice
#282B26  signal black
#1A1A2E  navy profondo
#91010F  carmine
```

### Palette per traccia — BOZZA v1

> NOTA: troppo nero nei fondi. Servono più fondi colorati.
> Da ridefinire nella prossima sessione.

| Traccia | Fondo | Dot | Accento | Emozione |
|---------|-------|-----|---------|----------|
| NEBBIA | nero #0A0A0A | cream #EFE6DE | — | silenzio |
| TESSUTO | licorice #20130D | lime #BADE4F | cream | germoglio |
| SOLCO | signal black #282B26 | orange #FE6B0D | lime #CDD71D | groove caldo |
| RESPIRO | sage #7BBA91 | licorice #20130D | — | inversione |
| MACCHINA | navy #1A1A2E | giallo #F8ED00 | pink #DD3A44 | energia |
| TEMPESTA | nero #000000 | bianco #FFFFFF | rosso #DD3A44 | esplosione |
| RITORNO | nero #0A0A0A | lavanda #9B8FCE | cream #EFE6DE | dissolvenza |

---

## Prossimi passi
- [ ] Ridefinire palette con più fondi colorati
- [ ] Definire identità musicale completa per ogni traccia (scala, BPM, pattern basso, pattern kick, texture)
- [ ] Definire identità visiva completa per ogni traccia (composizione, movimento, quale idea visiva)
- [ ] Pianificare implementazione fase per fase
- [ ] Decidere: v5 su codebase v4 o fork pulito?
