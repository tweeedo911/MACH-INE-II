# ROADMAP.md
*MACH:INE II — Aggiornata 2026-03-23*

---

## Versione corrente: v0.8.0

Sistema visivo completo e stabile:
- ✅ Halftone field Canvas 2D
- ✅ DNA generativo (8 primitivi, zone Voronoi)
- ✅ Entity lifecycle (nascita/vita/morte/fossili)
- ✅ Director audio-reattivo (6 stati arc, scene system, camera)
- ✅ MIDI in → 5 canali mappati visivamente
- ✅ Sistema colori semantici (A/B/C)
- ✅ Climax system
- ✅ COMPOSER.md (documento artistico)

---

## v0.9.0 — IL COMPOSITORE (prossima milestone)
*Stima: 1 sessione intensiva con Claude Code*

### Obiettivo
Aggiungere `composer.js` — il sequencer generativo autonomo che pilota
il sistema visivo senza input audio esterno.

### File da creare/modificare
- **CREARE** `src/composer.js` (~300 righe)
- **MODIFICARE** `src/config.js` — CFG.COMPOSER block
- **MODIFICARE** `src/main.js` — import + init + update
- **MODIFICARE** `src/midi-patterns.js` — ch 5 RUPTURE shape
- **MODIFICARE** `src/director.js` — `setArcPhaseForced()` bypass isteresi

### Funzionalità v0.9.0
- [ ] Clock interno su AudioContext.currentTime (sample-accurate)
- [ ] Arco drammaturgico 5 fasi × 5 min per ciclo (timing da CFG.COMPOSER.phaseDurations)
- [ ] T2 PULSE — euclidean E(3,8) motorik, E(5,8) in ROTTURA
- [ ] T3 GRAIN — hi-hat + glitch, comportamento per fase
- [ ] T4 TENSION — basso sub, note lunghe, voice leading dalla root di T6
- [ ] T5 VOICE — Markov 2° ordine, bias sulle note di T6, pause narrative
- [ ] T6 CHORDS — triadi modali, voice leading minimo (cervello armonico)
- [ ] T7 RUPTURE — 4 stadi: presagio/infiltrazione/takeover/residuo
- [ ] State injection (state.intensity/rhythmicity/trajectory sintetici)
- [ ] Director override: setArcPhaseForced() in sync con l'arco musicale
- [ ] Colore C attivato SOLO da RUPTURE TAKEOVER
- [ ] HUD toggle: tasto `C` per attivare/disattivare il Composer

### Invarianti (non negoziabili)
- T7 RUPTURE deve attraversare tutti e 4 gli stadi — mai on/off diretto
- Colore C (#E6007E) attivato SOLO da TAKEOVER
- Silence ratio ≥ 40% in ogni momento
- Nessuna traccia con on/off istantaneo — solo curve presence
- Clock su AudioContext.currentTime — mai setInterval

---

## v1.0.0 — INTEGRAZIONE COMPLETA + MIDI OUT
*Stima: 2 sessioni*

- [ ] WebMIDI output — 7 canali verso Ableton/hardware
- [ ] Ciclo infinito con mutazione DNA inter-ciclo
- [ ] DNA→Composer binding (primitivi che modificano il comportamento musicale)
- [ ] Layer sedimento visivo: ciclo finito → semitrasparenza persistente (max 3 layer)
- [ ] HUD avanzato: fase corrente, accordo attivo, presence per traccia
- [ ] Preset: 3 personalità (postrock/minimal/elettronica) selezionabili live

---

## v1.1.0 — MODALITÀ IBRIDA
*Stima: 1 sessione*

- [ ] Coesistenza Composer + audio live: il Composer si adatta all'intensità reale
- [ ] Funzione "take the wheel": il performer può cedere/riprendere il controllo
- [ ] Sync MIDI in: il Composer si sincronizza al BPM esterno se disponibile

---

## v2.0.0 — THREE.JS (lungo termine)
*Prerequisito: migrazione rendering a WebGL*

- [ ] Three.js WebGL al posto di Canvas 2D
- [ ] Costellazioni T6 CHORDS in 3D (punti che migrano nello spazio)
- [ ] Camera reale con FOV e depth of field
- [ ] Performance a 60 FPS anche su schermi 4K

---

## Sessioni completate

| Data | Versione | Descrizione |
|------|----------|-------------|
| 2026-03-23 | v0.8.0 | Architettura completa, COMPOSER.md, MIDI esempi |

---
*Ultima modifica: 2026-03-23 | Edoardo + Claude*
