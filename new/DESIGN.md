# MACH:INE II — Regole di progetto

Come lavoriamo, come decidiamo, come non perdiamo lavoro.

Ultima modifica: 2026-03-23

---

## 1. Versionamento

Formato: `vMAGGIORE.MINORE.PATCH`

- **PATCH** — fix, tweaking, cleanup
- **MINORE** — nuova funzione o modulo
- **MAGGIORE** — cambio architetturale o di direzione

Ogni versione richiede:
- voce in `CHANGELOG.md` con data e descrizione
- snapshot funzionante salvato
- commit git con messaggio nel formato `vX.Y.Z: descrizione breve`

---

## 2. Flusso di lavoro

Prima di ogni modifica non banale:

1. **Piano** — descrivere cosa cambierà e perché
2. **Approvazione** — Edoardo dice "sì, vai" o chiede modifiche
3. **Implementazione**
4. **Test**
5. **Aggiornamento documenti**
6. **Commit**

Nessuna modifica strutturale senza approvazione esplicita.

---

## 3. Snapshot

Prima di ogni modifica importante:
- salvare snapshot funzionante
- annotare quali moduli vengono toccati
- mai fare refactor senza punto di ritorno garantito

---

## 4. Struttura della codebase

La codebase è modulare. Non si reintroduce logica monolitica.

Principio:
- boot e wiring in `main.js`
- parametri in `config.js` (oggetto CFG)
- stato astratto in `state.js`
- render separato dalla direzione
- niente duplicazione di logica tra moduli

---

## 5. Parametri

Tutti i numeri sensibili vivono in `CFG` (config.js) con commento inline.

Vietato:
- numeri magici sparsi nel codice
- soglie duplicate
- valori hardcoded senza contesto

---

## 6. Cosa non si tocca senza discussione

- Il loop principale tra `main.js`, `render.js` e `director.js`
- Il meccanismo di history buffer audio
- La logica di onset detection
- La relazione tra arco narrativo e arco visivo
- Il comportamento di rupture e climax

---

## 7. Director e narrativa

Il director non è un random engine. È un regista.

Ogni modifica a scene, arco, mutazioni, camera, climax o rupture
deve essere motivata in termini **narrativi**, non solo tecnici.

---

## 8. Regola rupture

La rupture deve essere preparata. Sempre.

Qualsiasi implementazione deve prevedere: presagio → infiltrazione → takeover → residuo.
Vietato implementarla come burst isolato senza buildup,
salvo decisione esplicita e motivata.

---

## 9. Coerenza estetica del sistema musicale

Ogni funzione compositiva o generativa deve rispettare l'estetica di MACH:INE II.

Se il sistema genera tracce o composizioni MIDI, devono:
- appartenere allo stesso universo sonoro del progetto
- seguire forme lunghe e narrative
- usare armonie modali
- costruire la densità per stratificazione
- non sembrare preset o demo generici

---

## 10. Concetto artistico — da non modificare senza discussione

MACH:INE II è un sistema di co-composizione ricorsiva:
macchina propone → performer interpreta → sistema ascolta e reinterpreta visivamente.

Questa definizione orienta ogni scelta tecnica e narrativa.
Non va cambiata senza discussione esplicita.

---

## 11. Linguaggio

- codice e commenti tecnici: **inglese**
- documentazione e note di progetto: **italiano**

---

## 12. Git

- niente commit di codice rotto
- niente push forzato su `main`
- branch sperimentali: prefisso `exp/`
- formato commit: `vX.Y.Z: descrizione breve`