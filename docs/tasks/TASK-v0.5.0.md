# TASK: Implementare v0.5.0 — DNA E GENERAZIONI

## Prima di iniziare

Leggi questi file nell'ordine indicato:
1. `RULES.md`
2. `DESIGN.md` — in particolare: "Il DNA di sessione", "Le generazioni", "Primitivi strutturali"
3. `ROADMAP.md` — milestone v0.5.0
4. `sandbox.html` — v0.4.0 (campo halftone con BANDA e BLOCCO)
5. `docs/refs/` — riguarda le immagini. Il target estetico non cambia.
6. `CHANGELOG.md`

## Obiettivo

Aggiungere variabilita' per sessione (DNA) e ciclo vita degli elementi (generazioni).
Dopo questo task, ogni avvio del sandbox produce un mondo visivamente diverso.

## DNA di sessione

All'avvio (o al click di un pulsante REGEN nel pannello), il sistema genera un DNA:

### Cosa contiene il DNA

```js
{
  // Quali primitivi sono attivi (2-3 scelti random tra tutti)
  primitives: ['BANDA', 'SCIAME', 'VUOTO'],

  // Per ogni primitivo, parametri unici:
  params: {
    BANDA: {
      orientation: 'horizontal',  // o 'vertical', 'diagonal'
      count: 3,                   // quante bande
      widthRange: [0.02, 0.15],   // range larghezza come frazione dello schermo
      speed: 0.3,                 // velocita' di movimento
      bandAudio: 'sub',           // quale banda audio la guida
    },
    SCIAME: {
      count: 80,
      size: [1, 3],               // range dot-size particelle
      cohesion: 0.6,              // quanto si aggregano
      bandAudio: 'high',
    },
    VUOTO: {
      shape: 'rect',              // 'rect' o 'circle' o 'band'
      position: [0.3, 0.2],      // posizione normalizzata
      size: [0.2, 0.4],
    }
  },

  // Mapping spaziale delle frequenze
  freqMapping: 'horizontal',      // 'horizontal', 'vertical', 'radial', 'diagonal'

  // Range dot-size per questa sessione
  dotSizeRange: [2, 14],

  // Velocita' generale di evoluzione
  evolutionSpeed: 0.5,

  // Probabilita' di inversione bianco/nero
  invertProbability: 0.15,
}
```

### I primitivi da implementare

Oltre a BANDA e BLOCCO (gia' in v0.4.0), implementa:

**VETTORE:** la densita' del campo segue una direzione dominante.
Non e' una linea disegnata — e' un gradiente direzionale di densita'
reso in dither. L'angolo e' definito dal DNA. L'intensita' audio
modula quanto e' marcato il gradiente.

**VUOTO:** una zona del campo dove la densita' e' forzata a 0.
Ha una forma (rettangolo, cerchio, banda). Il vuoto si muove lentamente.
Quando un elemento ci entra, muore. Il vuoto e' il contrappunto
alla densita' — lo spazio nero ha una forma.

**FRONTE:** un bordo verticale o orizzontale che separa due zone
di densita' diversa. Il fronte si muove: avanza e si ritira
in base alla traiettoria audio. Lascia residui dietro di se'
(generazioni morte a bassa densita').

**SCIAME:** cluster di punti fini che si muovono insieme.
Non sono particelle individuali — sono un'entita' collettiva.
Lo sciame ha un centro di massa che si sposta.
La dispersione del gruppo e' guidata dallo stereo width.
La velocita' dalla ritmicita'.

**STRISCIA:** linee parallele sottili (1-2px di larghezza, 4-20px di spaziatura).
Orientamento dal DNA. Le strisce possono deformarsi: la spaziatura
varia con l'intensita' audio (si comprimono e espandono).
Possono interrompersi creando pattern ritmici.

**MATRICE:** griglia di caratteri a spaziatura fissa.
Caratteri da set: `▲▼◆○□▸∙:;|!01×÷∞`.
La densita' (quanti caratteri sono visibili) varia con l'intensita'.
Il tipo di carattere in ogni cella cambia con la ritmicita'.
Non decorativa — e' la struttura del campo resa in forma testuale.

### Combinazioni

Il DNA sceglie 2-3 primitivi. Le combinazioni possibili sono varie:
- BANDA + SCIAME + VUOTO (struttura + organico + assenza)
- BLOCCO + STRISCIA (composizione grafica forte)
- VETTORE + FRONTE + MATRICE (direzione + confine + dati)
- SCIAME + VUOTO (organico che evita le zone morte)

I primitivi coesistono nello stesso campo di densita'.
La densita' finale di ogni cella e' la combinazione dei contributi
di tutti i primitivi attivi. Non si sovrappongono come layer separati —
contribuiscono allo stesso campo.

## Le generazioni

### Struttura

Una generazione e' un set di "entita'" nate nello stesso momento.
Ogni entita' ha:

```js
{
  x: Number, y: Number,        // posizione (0-1, normalizzata)
  density: Number,              // 0-1, quanto contribuisce al campo
  age: Number,                  // 0-1, dove 0=appena nato, 1=morto
  maxAge: Number,               // durata vita in secondi
  dotSizeOffset: Number,        // modificatore dot-size per eta'
  color: null | 'A' | 'B',     // colore semantico (null = grigio)
  primitive: String,            // a quale primitivo appartiene
}
```

### Ciclo vita

**Nascita:** quando l'intensita' audio e' > 0 (o simulata dallo slider),
nascono nuove entita'. Il tasso di nascita e' proporzionale all'intensita'.
La posizione di nascita dipende dal `freqMapping` del DNA e dalla
banda frequenziale attiva.

**Crescita (age 0-0.2):** density aumenta da 0 al valore nominale.
L'entita' diventa progressivamente piu' visibile.

**Maturita' (age 0.2-0.6):** density al massimo. Dot-size nominale.
L'entita' e' pienamente espressa.

**Invecchiamento (age 0.6-0.9):** density cala lentamente.
dotSizeOffset aumenta (i punti dell'entita' diventano piu' grandi e radi).
Se l'entita' aveva colore A o B, il colore sbiadisce verso il grigio.

**Morte (age > 0.9):** density cala rapidamente.
L'entita' si dissolve attraverso il dither (la matrice Bayer la "mangia").
Lascia un residuo fossile a densita' ~0.02 per qualche secondo.

### Relazione con l'audio simulato

- Slider intensity a 0: nessuna nascita. Campo si svuota.
- Intensity a 0.3: nascita lenta. Poche entita', longeve.
- Intensity a 0.8: nascita rapida. Molte entita', generazioni si sovrappongono.
- Onset (spazio): burst di nascite istantaneo. Una generazione intera in un frame.
- MIDI (M): nascita di entita' con colore B nella zona corrispondente.

### Accumulo

Le generazioni NON si cancellano tra loro. Si sovrappongono:
- Generazioni giovani: punti fini e densi (in primo piano visivamente)
- Generazioni vecchie: punti grossi e radi (sotto, sfondo)
- Residui fossili: densita' bassissima, quasi invisibili

Dopo 2 minuti di sessione attiva, il campo porta le tracce
di tutta la storia. Questo e' la "memoria" del sistema.

## Pannello sandbox

Aggiungi:
- Pulsante **REGEN** che genera un nuovo DNA e resetta il campo
- Readout del DNA corrente (quali primitivi, orientation, mapping)
- Readout generazioni: quante vive, eta' media, tasso nascita/morte
- Slider **EVOLUTION SPEED** (0.1-3.0) per velocizzare/rallentare il ciclo vita

## Vincoli

- Modifica solo `sandbox.html`
- Il campo halftone di v0.4.0 e' la base. I primitivi modulano la densita' dello stesso campo.
- 60fps. Se troppe entita' (>5000), il sistema deve auto-limitare il tasso di nascita.
- Ogni primitivo deve essere visivamente interessante DA SOLO prima di combinarlo.
- Il DNA deve produrre risultati visivamente diversi tra sessioni, ma TUTTI coerenti
  con l'estetica dei riferimenti (alto contrasto, grana, composizione strutturata).
- Tutti i parametri in CFG.

## Dopo aver implementato

1. Click REGEN 5 volte: ogni volta il mondo deve apparire diverso
2. Testa ogni combinazione di primitivi (prova a forzarne diversi)
3. Testa il ciclo vita: intensity a 0.5 per 30sec, poi a 0, guarda il campo svuotarsi
4. Testa onset: burst visibile di nuove nascite
5. Testa accumulo: intensity a 0.4 per 2 minuti, il campo deve stratificarsi
6. Verifica 60fps
7. Confronta con `docs/refs/` — la grana, il contrasto, la struttura ci sono?
8. Salva snapshot: `cp sandbox.html versions/sandbox-v0.4.0.html`
9. Aggiorna `CHANGELOG.md`
10. Commit: `v0.5.0: DNA sessione, 8 primitivi, generazioni con ciclo vita e accumulo`
11. Push su GitHub
