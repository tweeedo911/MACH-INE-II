# TASK: Implementare v0.6.0 — COLORE E MUTAZIONI

## Prima di iniziare

Leggi questi file nell'ordine indicato:
1. `RULES.md`
2. `DESIGN.md` — in particolare: "Sistema cromatico", "Motore narrativo > Il Regista"
3. `ROADMAP.md` — milestone v0.6.0
4. `sandbox.html` — v0.5.0 (campo + DNA + generazioni)
5. `docs/refs/` — riguarda le immagini
6. `CHANGELOG.md`

## Obiettivo

Aggiungere il sistema cromatico integrato nel campo e le mutazioni del regista.

## Sistema cromatico

Il colore NON e' un overlay. E' una proprieta' delle entita' nel campo.

### Colore A — #FF4400 (ritmo)

Quando l'utente preme ONSET (spazio), le entita' nate in quel burst
nascono con `color: 'A'`. I punti del dither per quelle entita'
sono renderizzati in #FF4400 invece che bianco.

Col tempo (invecchiamento), il colore A decade verso il grigio:
A pieno → grigio-rosso → grigio medio → grigio scuro → morte.

L'effetto: un onset lascia una "impronta" rossa nel campo che
sbiadisce lentamente. Onset ripetuti lasciano strati di A a diverse
eta' — rosso vivo (nuovo) sopra grigio-rosso (vecchio).

### Colore B — #00AACC (armonia)

Quando l'utente preme MIDI (M), le entita' nate nascono con `color: 'B'`.
Stessa logica di A ma in teal. Posizione X dalla nota (random nel sandbox).

A e B possono coesistere: se c'e' un onset mentre ci sono entita' B,
il burst A nasce sopra le entita' B. Le due generazioni sono sovrapposte.

### Colore B su A / A su B

Se un'entita' B viene investita da un burst A (onset),
il suo colore vira: teal → mischia verso rosso-arancio.
Questo avviene per le entita' nella zona di impatto dell'onset.

### Colore C — #E6007E (climax)

Quando intensity > 0.85 per 3+ secondi continui:
- TUTTE le entita' vive virano gradualmente verso C (#E6007E).
  Non istantaneamente — frame per frame i colori si muovono:
  bianco → rosa → magenta, A → arancio-rosa → magenta, B → teal-rosa → magenta.
- Il dot-size si comprime: tende verso il minimo (grana finissima).
- La densita' globale sale verso il massimo.
- Effetto: il campo diventa un piano denso di magenta a grana fine.
- Al rilascio (intensity scende sotto 0.85): collasso. Le entita'
  muoiono rapidamente. Il magenta decade. Il campo si svuota.

C e' raro: non deve attivarsi per ogni picco. Solo plateau sostenuto.

### Rendering del colore nel dither

Quando un punto del dither e' "acceso" e l'entita' che contribuisce
a quella cella ha un colore, il punto e' renderizzato in quel colore.

Se piu' entita' con colori diversi contribuiscono alla stessa cella,
il colore dominante e' quello dell'entita' piu' giovane (piu' in primo piano).

## Mutazioni del Regista

Il Regista (logica gia' implementata in v0.3.0) gestisce ora
**mutazioni** del campo, non cambi di scene predefinite.

### Tipi di mutazione

1. **Mutazione primitivo:** un primitivo attivo decade (le sue entita'
   invecchiano piu' velocemente) e un nuovo primitivo emerge
   (inizia a generare entita'). La transizione e' graduale — non istantanea.

2. **Inversione:** il campo scambia bianco e nero.
   I punti accesi diventano spenti e viceversa.
   Transizione: il swap avviene cella per cella attraverso la matrice Bayer
   (come il dither dissolve) in ~1 secondo.

3. **Reset parziale:** una zona del campo (rettangolo, banda) viene
   azzerata. Tutte le entita' in quella zona muoiono istantaneamente.
   Il vuoto si riempie gradualmente con nuove nascite.

4. **Shift cromatico:** il regista attiva/disattiva la possibilita'
   di colore A o B per le prossime generazioni. Es: per i prossimi
   20 secondi, tutti gli onset producono entita' A colorate.
   Oppure: per i prossimi 30 secondi, nessun colore — tutto grigio.

5. **Cambio scala:** il range di dot-size del DNA viene modificato.
   Es: da [2, 14] a [8, 16] — tutto diventa piu' grossolano.
   O da [2, 14] a [1, 3] — tutto diventa fine.

### Quando il Regista muta

Stessa logica temporale di v0.3.0:
- Ritmicita' alta: mutazione possibile ogni 8/16/32 beat
- Ritmicita' bassa: ogni 20-60 secondi
- Dado modulato da plateau e random

Il Regista sceglie il tipo di mutazione random tra i 5 disponibili,
con pesi: primitivo 30%, inversione 15%, reset 15%, shift cromatico 25%, scala 15%.

## Pannello sandbox

Aggiungi:
- Pulsanti manuali per forzare ogni tipo di mutazione (test)
- Toggle per abilitare/disabilitare i colori A, B, C
- Readout colore: quante entita' A, B, C vive
- Log delle mutazioni recenti (ultime 5)

## Vincoli

- Modifica solo `sandbox.html`
- Il colore e' parte del campo — non un layer separato sopra
- Il climax C deve essere RARO. Non deve attivarsi per un picco di 1 secondo.
  3 secondi sostenuti sopra 0.85 e' la soglia minima.
- Le mutazioni devono essere graduali, non istantanee.
  Niente "jump cut" visivi — tutto transiziona attraverso il dither.
- 60fps. Il colore aggiunge complessita' al rendering:
  ottimizzare il render loop per gestire entita' di colori diversi.
- Tutti i parametri in CFG.

## Dopo aver implementato

1. Onset ripetuti: il campo deve mostrare zone A (#FF4400) che sbiadiscono
2. MIDI + onset insieme: A e B coesistono visivamente
3. Intensity a 0.9 per 4 secondi: tutto vira a C (#E6007E). E' visivamente potente?
4. Rilascio dal climax: il campo collassa. E' drammatico?
5. Testa le mutazioni: ogni tipo deve essere percepibile ma non violento
6. Inversione: la transizione Bayer e' fluida?
7. Verifica 60fps
8. Salva snapshot: `cp sandbox.html versions/sandbox-v0.5.0.html`
9. Aggiorna `CHANGELOG.md`
10. Commit: `v0.6.0: sistema cromatico A/B/C integrato, 5 tipi di mutazione, regista adattato`
11. Push su GitHub
