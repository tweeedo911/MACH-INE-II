# MACH:INE II — Composer Notes

Documento di riferimento per il motore compositivo futuro.

---

## Obiettivo

Il sistema deve poter generare composizioni MIDI originali
coerenti con l'estetica di MACH:INE II.

Non deve creare tracce dimostrative o pattern neutrali.
Deve creare mondi musicali.

---

## Estetica musicale richiesta

Le composizioni devono condividere questi tratti:

- lunga durata
- sviluppo per fasi
- armonia modale (sistema DERIVA — vedi session export)
- tensione costruita gradualmente
- densità per stratificazione
- eventi rari ma inevitabili
- residui e memoria dopo i picchi
- continuità tra gesto musicale e gesto visivo
- legge del vuoto: almeno il 40% delle tracce in silenzio in ogni momento

---

## Ruoli delle 8 tracce

- `T1 PULSE`   — kick/clock motorik, impulso ritmico principale (Euclidean E(5,16))
- `T2 GRAIN`   — hihat, glitch, noise, texture ritmiche (mai costante — è evento)
- `T3 DRONE`   — pad/cluster tenuti, drone, sfondo armonico (sempre presente)
- `T4 BASS`    — basso dorian, gravità armonica, legge la root di T5
- `T5 CHORDS`  — triadi modali con voice leading minimo, cuore armonico
- `T6 VOICE`   — frammenti melodici, Markov chain 2° ordine sul modo corrente
- `T7 LEAD`    — motivo melodico principale D-G-A, impulso melodico
- `T8 RUPTURE` — corruzione, invasione, takeover (4 stadi obbligatori)

---

## Sistema armonico — DERIVA

Il sistema non ha tonalità fissa. Ha un centro di gravità che deriva per fasi.

Drone path:
  GERMOGLIO → PULSAZIONE → DENSITÀ → ROTTURA → DISSOLUZIONE
      D            D           A         Eb          D

Modi per fase:
  GERMOGLIO   — D Dorian  (aperto, ambiguo)
  PULSAZIONE  — D Frigio  (oscuro, motorik accentuato)
  DENSITÀ     — A Lidio   (luminoso, sospeso)
  ROTTURA     — Eb Locrio (instabile, nessuna tonica solida)
  DISSOLUZIONE— D Dorian  (ritorno con memoria della rottura)

Note pivot (presenti in tutti i modi): D, F, A.

---

## Regola fondamentale

Ogni brano generato dal sistema deve sembrare
musicalmente appartenente allo stesso universo di MACH:INE II.

Il composer non produce "uno stile qualsiasi".
Produce varianti interne di una stessa cosmologia.

---

## Rupture

T8 RUPTURE deve seguire questa curva — sempre, senza eccezioni:

1. Presagio      — note isolate, fuori scala, velocity bassa, fuori beat
2. Infiltrazione — burst brevi crescenti, ancora minoritari
3. Takeover      — domina, velocity massima, registro alto, pattern irregolare
4. Residuo       — note sempre più rade, velocity in calo, poi silenzio

Parametri obbligatori nell'implementazione:
- `rupturePresence`     (0→1)
- `ruptureDensity`
- `ruptureRegister`     (0=basso, 1=alto)
- `ruptureCorruption`   (quanto sabota le altre tracce)
- `ruptureTakeoverBars` (durata in bar del takeover)

La rupture deve essere memorizzabile dall'ascoltatore prima del climax,
così che il takeover sembri inevitabile.

T2 GRAIN anticipa T8 RUPTURE con glitch radi durante il presagio.
Nel takeover le due tracce si cedono spazio: GRAIN perde gli hihat,
rimane solo rumore grezzo. RUPTURE ha sempre l'ultima parola.

---

## Preset stilistici

I diversi stili futuri possono cambiare:
- BPM
- modo di partenza
- densità
- swing
- durata delle fasi
- aggressività della rupture

Ma non devono cambiare identità estetica di fondo.

---

## Implementazioni future

Target possibili:
- browser interno (JS — EuclideanEngine, MarkovEngine, ChordEngine, PresenceManager, MutationEngine)
- generatore MIDI standalone
- monome norns come layer compositivo esterno

Ultima modifica: 2026-03-23 rev.2
