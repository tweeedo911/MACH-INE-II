---
title: album-gen — generatore album live con SuperCollider e PARTITURA
date: 2026-04-20
status: approved (design)
scope: personal tool
parent_project: MACH:INE III (come riferimento, non dipendenza)
author: edo + claude
---

# album-gen — Design Document

> Strumento personale per generare album live: 5 brani distinti, coerenti per
> estetica e arco narrativo, suonati in realtime da SuperCollider, con visual
> generativo "PARTITURA". Generativo + snapshot via seed. Non è MACH:INE, non è
> un visualizer: è un tool di composizione dal vivo che scrive l'album come
> documento (audio + partitura grafica).

---

## Context

L'utente ha sviluppato per anni MACH:INE III, un sistema audiovisivo live per
performance continue di 45-60 minuti con 7 tracce-bioma, director narrativo,
MIDI out a DAW, campo dither Bayer audio-reattivo, camera osservatore,
rupture a 4 stadi, integrazione Norns. v3.18.0 stable.

Vuole ora un tool nuovo, personale, che:
- Non sia una performance continua ma **un album** (5 brani autonomi con arco condiviso).
- Non dipenda da DAW esterni ma suoni **da sé** via SuperCollider.
- Abbia **rigenerazione rapida** del materiale ("non mi piace questo brano → regen") con possibilità di **lock** quando piace.
- Abbia un **visual nuovo**, completamente staccato da MACH:INE. Niente Bayer, niente biomi, niente pixel-art. "Snello, fresco, generativo."

Questo documento fissa la visione MVP e il contratto architetturale prima
dell'implementazione.

## Goals

- Generare 5 brani MIDI-events coerenti come album in modo **deterministico dato un seed globale**.
- Suonarli **in realtime** via OSC → SuperCollider standalone sul Mac dell'utente.
- Visualizzare la composizione come una **partitura grafica generativa** event-driven, senza dipendere dal ritorno audio.
- Permettere il ciclo **generate → listen → regen → lock** per brano.
- Persistere lo stato dell'album in un singolo file `album.yaml` (source of truth).
- Riuso selettivo dai moduli musicali di MACH:INE v3.18 (rhythm, harmony, bass-v3, melody-v3, texture, SeededRNG, world-state).

## Non-goals (MVP)

- Export `.mid` file per brano → **M4** (post-MVP).
- Export audio (SC non-realtime render) → **M5**.
- Transizioni musicali tra brani (crossfade, ramping, DJ-style). L'MVP ha solo gap silenzioso 2-4s.
- Multi-album browser UI. Per ora: CLI carica 1 album per istanza.
- Hotkey performer, rupture narrative, encore, firma, PANIC — tagliati da MVP.
- Leitmotiv/temi condivisi tra brani (opzione "coerenza 4" scartata in brainstorming).
- Pubblicazione / open source / docs per terzi. **Solo per me.**

---

## §1 — Struttura repo + stack

### Posizione fisica

Nuova cartella indipendente da MACH:INE II:

```
/Users/Edo_1/album-gen/
```

Nuovo repo git. Non submodule di MACH:INE.

### Relazione con MACH:INE

**Copia selettiva** (non submodule) dei moduli compositivi di MACH:INE v3.18.0
in `vendor/machine/` come riferimento read-only. I moduli effettivamente usati
vengono copiati dentro `src/composers/` e `src/shared/` e da lì forkati/adattati.

Motivazione scarto submodule: introduce attrito per un tool personale. Se un
motore in MACH:INE evolve, l'utente decide manualmente quando risincronizzare.

### Stack

| Area | Stack | Note |
|---|---|---|
| Core compositivo | JS ES modules nativi | zero build, puro, cross-env (Node + browser) |
| CLI offline (M4+) | Node.js 20+ | parser YAML (`js-yaml`), MIDI writer |
| Live runtime | Browser (Chrome/Edge) | zero build, `python3 -m http.server` |
| OSC bridge | WebSocket→OSC JS library (`osc.js` o equivalente) | browser parla con SC via UDP/OSC |
| Sintesi | **SuperCollider.app** (installato esternamente) | sclang + scsynth |
| Audio routing | native Mac audio device (default output) | nessun BlackHole richiesto per MVP |
| Visual | Canvas 2D | zero WebGL, zero dep |
| Persistenza | `album.yaml` unico file | salvato via endpoint HTTP locale del launcher |

### Dipendenze runtime

- `js-yaml` (parser YAML, lightweight)
- `osc` / `osc.js` (OSC encoding)

Nessuna dipendenza di build. Niente npm bundle. Niente Vite/Webpack.

### Struttura directory

```
album-gen/
├── README.md
├── package.json                       # script + 2 dep
├── album-launch.command               # doppio-click: SC + server + browser
├── bin/
│   └── album-gen                      # CLI entry (per M4+)
├── src/
│   ├── core/                          # puro JS cross-env
│   │   ├── album-director.js
│   │   ├── song-director.js
│   │   ├── config-loader.js
│   │   └── seed-manager.js
│   ├── composers/                     # fork MACH:INE v3.18
│   │   ├── rhythm.js
│   │   ├── harmony.js
│   │   ├── bass-v3.js
│   │   ├── melody-v3.js
│   │   └── texture.js
│   ├── export/
│   │   └── midi-writer.js             # (M4)
│   ├── live/                          # browser-only
│   │   ├── main.js
│   │   ├── sc-dispatcher.js           # JS → OSC → SC
│   │   ├── events.js                  # aggregator: eventi → grandezze
│   │   ├── score.js                   # PARTITURA: scroll + glyph placement
│   │   ├── glyphs.js                  # dizionario primitivi grafici
│   │   └── palette.js                 # colori minimi
│   └── shared/
│       ├── world-state.js
│       └── perf-utils.js              # include SeededRNG
├── sc/
│   ├── album-engine.scd               # boot: carica synthdefs, apre OSC
│   ├── synths/
│   │   ├── drone.scd                  # estende Engine_MachineDrone
│   │   ├── pad.scd
│   │   ├── bass.scd
│   │   ├── kick.scd
│   │   ├── snare.scd
│   │   ├── hat.scd
│   │   ├── perc.scd
│   │   ├── lead.scd
│   │   └── texture.scd
│   └── osc-map.md                     # documentazione protocollo OSC
├── albums/
│   └── album-001.yaml                 # esempio/config
├── out/                               # generati (gitignored)
├── index.html                         # entry live mode
├── test/
│   └── all.js                         # determinism + schema tests
└── vendor/machine/                    # snapshot v3.18.0 read-only
```

### Vincoli di purezza

- `src/core/` non importa nulla da `src/live/` o `src/export/`.
- `src/composers/` riceve solo stato + seed dal song-director. Niente side-effect globali.
- `src/live/` è l'unico che tocca DOM/Canvas/WebSocket.

---

## §2 — Architettura moduli

### Gerarchia

```
album-director (thin coordinator, ~200 LOC)
  │ legge config, crea global-plan, istanzia 5 song-director
  │
  ├── song-director #1 (opener, 180s, seed derivato)
  ├── song-director #2 (development, 240s)
  ├── song-director #3 (development, 240s)
  ├── song-director #4 (climax, 300s)
  └── song-director #5 (outro, 210s)
         │ ogni song-director è bounded (sa la sua durata e ruolo)
         │ espone 2 API: generateAll() [batch] e tickBar(i) [streaming]
         │
         └── istanzia composers del brano:
             ├── rhythm.js      (kick/snare/hat/perc)
             ├── harmony.js     (chord/pad)
             ├── bass-v3.js     (bass)
             ├── melody-v3.js   (lead/voice)
             └── texture.js     (drone/texture)
                     │
                     ▼
            event stream timestampati {t, instrument, pitch, vel, dur}
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
   sc-dispatcher           event hook (→ visual events.js)
   (OSC → SC)
```

### Responsabilità per modulo

**`album-director.js`** (nuovo, ~200 LOC)
- Legge e valida `album.yaml` (via `config-loader`).
- Costruisce `global-plan`: `{ scale, bpm, palette, seed_tree }`.
- Istanzia 5 song-director con role/duration/seed.
- Non compone. Non decide niente di musicale oltre lo scaffolding.

**`song-director.js`** (nuovo, ~300-400 LOC)
- Sostituisce `director3.js` di MACH:INE. Differenza principale: **bounded**.
- Conosce: role (opener/development/development/climax/outro), duration_sec, character, intensity target.
- Gestisce 3 fasi interne per brano: **intro / body / end** (scalate sulla durata).
- Istanzia i composer del brano passando loro seed derivato.
- API pubblica:
  - `generateAll()` → `Events[]` (usato offline/M4)
  - `tickBar(barIndex)` → `Events[]` di quella barra (usato live)
- Pure function dato `(role, duration, seed, global_plan)`.

**Composers** (fork MACH:INE, adattati, ~50-150 LOC ciascuno di delta)
- API originale MACH:INE: streaming infinito clock-driven.
- Adattamento: aggiunta `generateBar(barIndex, state) → Events[]` per uso batch.
- In live, un thin adapter chiama `generateBar` ogni barra e consegna gli eventi
  al clock-scheduler interno che li fire sul tempo giusto.
- Composer copiati: `rhythm.js`, `harmony.js`, `bass-v3.js`, `melody-v3.js`, `texture.js`.

**`sc-dispatcher.js`** (nuovo, ~200 LOC, browser-only)
- Input: event stream dal song-director attivo.
- Output: messaggi OSC verso `127.0.0.1:57120` (porta sclang default).
- Mapping strumento→SynthDef dal YAML `instruments:`.
- Scheduler lookahead ~15ms (come `midi.js` di MACH:INE).
- Protocollo OSC (v0.1, draft):
  - `/synth/<name>/note  [freq, amp, dur]`
  - `/synth/<name>/params [k1, v1, k2, v2, ...]`  (CC-equivalenti)
  - `/song/start  [songId]`, `/song/stop`, `/panic`
- Espone hook `onEvent(cb)` per il visual: passa lo **stesso** stream eventi.

**`events.js`** (nuovo, ~250 LOC, browser-only)
- Consumer dello stream eventi (via hook del sc-dispatcher).
- Aggregator 60fps → produce grandezze equivalenti all'`audio.js` di MACH:INE:
  - `bands[0..4]` (sum velocità mappate per-strumento → banda)
  - `onset` (boolean, true se evento percussion in questo frame o vel>100)
  - `energy` (decaying sum totale)
  - `beat` (esatto, dal BPM del song-director — non stimato)
  - `brightness` (ratio eventi alti/bassi recenti)
- Stessa interface di `audio.js` di MACH:INE per riuso mentale.

**`score.js`** (nuovo, ~800 LOC, browser-only)
- Riceve `events` + grandezze da `events.js`.
- Gestisce il canvas 2D PARTITURA: scroll orizzontale, glyph placement, fading, page break, accent color.
- Non dipende né da SC né dal DOM oltre `<canvas>`.

**`glyphs.js`** (nuovo, ~200 LOC)
- Dizionario di ~25 primitive grafiche (Canvas 2D path functions).
- `drawGlyph(ctx, kind, {x, y, size, opacity, accent})`.

**`world-state.js`** (adattato da MACH:INE)
- Per-song, non cross-song.
- Rimuove le 5 fasi MACH:INE, sostituite con 3 (`intro` / `body` / `end`).
- Rimuove rupture, firma, encore.

**`seed-manager.js`** (nuovo, ~100 LOC)
- `deriveSongSeed(global, i)` e `deriveComposerSeed(songSeed, composerName)`.
- Hash SHA256 troncato a uint32. Deterministic.

**`config-loader.js`** (nuovo, ~200 LOC)
- Parse YAML.
- Validazione schema strict (errori → abort, messaggi chiari).
- Merge con default interni.
- Endpoint `saveAlbum(yaml)` (via fetch a endpoint HTTP locale del launcher).

### Moduli MACH:INE **non** riusati

- `campo.js`, `biomi.js`, `render.js` — PARTITURA le sostituisce.
- `camera.js` — non serve (nessuna camera mobile in PARTITURA).
- `firma.js`, `encore-canon.js` — narrative MACH:INE-specific.
- `audio.js` — sostituito da `events.js` (event-driven).
- `midi.js` — sostituito da `sc-dispatcher.js`.
- `director3.js` — sostituito da `album-director` + `song-director` bounded.
- Norns bridge, launcher MACH:INE, clock worker — non pertinenti.

---

## §3 — Data flow live-first

### Flusso principale (live)

```
album-launch.command (doppio-click)
    ├── avvia SuperCollider.app con album-engine.scd in background
    ├── avvia python3 -m http.server 8282
    └── apre http://localhost:8282/?album=albums/album-001.yaml

browser carica:
    ├── config-loader fetch album.yaml → validato
    ├── album-director crea global-plan + 5 song-director
    └── UI mostra 5 brani + pulsanti Play/Regen/Lock/Play-album

utente clicca Play su brano attivo:
    │
    ▼
song-director (attivo) inizia clock-driven streaming
    │
    ▼
per ogni bar:
    events[] = songDir.tickBar(barIndex)
    │
    ├──▶ sc-dispatcher
    │         │
    │         └──▶ OSC → SC → audio out (speakers Mac)
    │
    └──▶ events.js (aggregator)
              │
              └──▶ score.js (PARTITURA su canvas)
```

### Ciclo "non mi piace → regen → lock"

```
UI stato:
┌──────────────────────────────────────────────────────────┐
│ [01 opener]  seed: 0x4A3F [🔒]   ───●──── 0:48/3:00      │
│ [02 dev_a]   seed: —             ·············           │
│ [03 dev_b]   seed: —             ·············           │
│ [04 climax]  seed: —             ·············           │
│ [05 outro]   seed: —             ·············           │
├──────────────────────────────────────────────────────────┤
│ [▶ Play album] [⟳ Regen current] [🔒 Lock current]       │
│ global seed: 0x9C42                                      │
└──────────────────────────────────────────────────────────┘
```

Regen: genera nuovo per-song seed, song-director riparte da bar 0.
Lock: scrive `seed: 0x...` nel YAML via endpoint HTTP locale.
Play album: riproduce 1→5 con gap 2-4s tra brani.

### Vincoli runtime

- SC deve essere running (il launcher se ne occupa).
- Ping `/status` a SC al boot → errore chiaro se non risponde.
- Latenza OSC loopback <5ms.
- Nessun BlackHole richiesto (event-driven visual, no FFT).
- Fullscreen tasto `F`.

### Offline export (M4-M5, deferred)

Stessa pipeline ma `song-director.generateAll()` + node-osc (M5 per audio-render via SC NRT, o `midi-writer.js` in M4).

---

## §4 — Seed + riproducibilità

### Obiettivo

`album.yaml` + `global_seed` fissi → album byte-identico (stesse note, velocity, timing).

### Gerarchia seed

```
global_seed (uint32, nel YAML o random)
   │
   ▼ derivazione deterministica
   song_seeds[0..4]:   sha256(global_seed + "song:" + i).slice(0,8) → uint32
         │
         ▼ per ogni song-director
         composer_seeds:
           sha256(song_seed + "rhythm")  → uint32
           sha256(song_seed + "harmony") → uint32
           sha256(song_seed + "bass")    → uint32
           sha256(song_seed + "melody")  → uint32
           sha256(song_seed + "texture") → uint32
```

### Ragioni della scelta hash

- Cambio `global_seed` → tutti i brani cambiano coerentemente.
- Lock di un per-song seed → resta fisso anche cambiando il global.
- Composer separati hanno entropia indipendente → cambiare scale non disturba la rhythm section.

### Storage

Unico file: `album.yaml`. L'UI scrive direttamente lì via endpoint HTTP locale
(`POST /save` del launcher).

Esempio campo seed in YAML:
```yaml
global_seed: 0x9C42
songs:
  - id: opener
    seed: 0x4A3F       # locked
  - id: dev_a
    # seed assente → unlocked
```

### PRNG

Riuso `SeededRNG` da `perf-utils.js` di MACH:INE. Deterministico, 32-bit state.

### Version guard

`album.yaml` contiene `tool_version: "0.1.0"`. Se diverge dal tool corrente,
warning esplicito all'utente (niente migrazione automatica).

---

## §5 — Config YAML schema (album.yaml)

### Sezioni

1. **meta** — tool_version, title, author, created, notes (free-form)
2. **global** — seed, bpm, key, mode (o scale custom), palette
3. **songs** — array di 5 oggetti con role/duration/character/intensity/seed
4. **instruments** — mapping `nome_compositivo → SynthDef + bus + default_amp`
5. **sc** — host/port/audio_device
6. **visual** — style: "score", accent_color, bg, per_song density

### Esempio completo

```yaml
tool_version: "0.1.0"
title: "Memoria discontinua"
author: "edo"
created: 2026-04-20
notes: |
  Primo album. Palette bassa, archi freddi.

global:
  seed: 0x9C42
  bpm: 96
  key: "D"
  mode: "dorian"
  palette:
    dominant: "cool"
    accent_events: ["ruggine", "indaco"]

songs:
  - id: opener
    role: opener
    duration_sec: 180
    character: "sospeso"
    intensity: 0.35
    seed: 0x4A3F
  - id: dev_a
    role: development
    duration_sec: 240
    character: "ricerca"
    intensity: 0.55
  - id: dev_b
    role: development
    duration_sec: 240
    character: "insistenza"
    intensity: 0.70
  - id: climax
    role: climax
    duration_sec: 300
    character: "slancio"
    intensity: 0.95
    instruments_active: [drone, pad, bass, kick, snare, hat, lead, perc]
  - id: outro
    role: outro
    duration_sec: 210
    character: "dissoluzione"
    intensity: 0.25
    instruments_active: [drone, pad, texture]

instruments:
  drone:   { synth: drone,   bus: 0, default_amp: 0.3 }
  pad:     { synth: pad,     bus: 0, default_amp: 0.25 }
  bass:    { synth: bass,    bus: 0, default_amp: 0.4 }
  kick:    { synth: kick,    bus: 0, default_amp: 0.7 }
  snare:   { synth: snare,   bus: 0, default_amp: 0.5 }
  hat:     { synth: hat,     bus: 0, default_amp: 0.3 }
  lead:    { synth: lead,    bus: 0, default_amp: 0.45 }
  perc:    { synth: perc,    bus: 0, default_amp: 0.4 }
  texture: { synth: texture, bus: 0, default_amp: 0.2 }

sc:
  host: "127.0.0.1"
  osc_port: 57120
  audio_device: "default"

visual:
  style: score
  accent_color: "#8E3A2E"
  bg: "#F5F2EC"
  per_song:
    opener:  { density: 0.15 }
    dev_a:   { density: 0.35 }
    dev_b:   { density: 0.55 }
    climax:  { density: 0.95 }
    outro:   { density: 0.20 }
```

### Validation rules (strict, al boot)

- Esattamente 5 songs.
- Ruoli in ordine: `[opener, development, development, climax, outro]`.
- `duration_sec` ∈ [60, 600].
- Ogni `instruments_active[i]` deve referenziare una key esistente in `instruments`.
- `mode` in whitelist OR `scale` fornita.
- `character` è stringa libera (interpretazione fuzzy nel song-director via tabella di mapping parola→parametri).
- Errore di validazione → abort al boot con messaggio chiaro, niente partenza.

### Minimal viable config

Solo `songs:` richiesto. Tutto il resto ha default interni.

### Cose intenzionalmente **non** nel schema

- Leitmotiv/temi condivisi (scartato in brainstorming).
- Regole compositive basso-livello (skip probability, velocity curves) — in codice.
- Transizione per-brano custom — gap fisso 2-4s per ora.
- Camera/visual parameters fini — di default il visual è determinato da `style: score` + per_song density.

---

## §6 — PARTITURA (visual layer)

### Principio

Il visual non decora la musica: **la scrive**. La partitura è il documento
dell'album. Generativo, non leggibile, concettualmente forte.

### Look

- **Fondo**: bianco latte `#F5F2EC`. Un colore, aria, nessuna texture.
- **Segni**: nero opaco, tratto variabile in spessore.
- **Accent**: un solo colore raro dal YAML (default cinabro scuro `#8E3A2E`), usato per eventi marcati o accenti strumentali forti.
- **Guide**: 5-7 linee orizzontali sottilissime (≤10% opacity) — pentagramma implicito, riferimento spaziale.
- **Scroll orizzontale lento**, velocità legata al BPM (es. 96 bpm → ~80px/sec).
- A schermo sempre visibile una finestra di ~10-15s di musica recente + "fantasma" sfumato delle precedenti.
- **Nessuna camera mobile, nessuno zoom, nessun effetto** (glow/bloom/blur vietati).
- Niente tipografia leggibile. Niente numeri. Niente parole.

### Glyph library (glyphs.js)

~25 primitive, ciascuna una funzione `drawX(ctx, {x, y, size, opacity, accent})`:

| Strumento | Glyph primario | Variazioni |
|---|---|---|
| bass | tratto orizzontale spesso basso | lunghezza=dur, spessore=vel |
| kick | punto nero pieno | diametro=vel |
| snare | tratto diagonale corto | inclinazione random seed-based |
| hat | micro-punto riga alta | cluster se step alto |
| chord/harmony | cluster verticale di 3-4 punti allineati | altezze = accordo in colonna |
| drone/pad | linea sottile continua | lunghissima, leggerissima |
| lead | curva spline | y = pitch mapping |
| perc | simboli irregolari | triangoli, archi aperti |
| texture | macchie-inchiostro sparse | leggerissime |

### Mapping evento → segno (riassunto)

- **Velocity** → spessore/opacità tratto.
- **Pitch** → coordinata verticale (pentagramma implicito).
- **Durata** → lunghezza orizzontale.
- **Strumento** → famiglia di glyph.
- **Accent flag** → colore accent invece di nero.

### Carattere per brano (via `visual.per_song.density`)

- **opener** (0.15): molto bianco, segni rari, pentagramma largo.
- **dev_a** (0.35): densità crescente, primi cluster.
- **dev_b** (0.55): motif ricorrenti, inizi di ritmo visivo.
- **climax** (0.95): scrittura fitta, overlap, sovrapposizioni, accent color appare.
- **outro** (0.20): la pagina si svuota, pochi punti e linee lunghe.

Il song-director **non** conosce `density` del visual; è invece `score.js`
che legge `visual.per_song` e applica filtri di sfoltimento o densificazione
sui glifi (es. a density 0.15 non disegna il 70% degli hat, a 0.95 disegna tutto + overlay).

### Transizione tra brani

- 2-4s di bianco assoluto nel canvas (configurabile).
- Poi nuova "pagina" — reset dello scroll buffer.

### Modulo `score.js` responsabilità

- Mantiene buffer circolare di segni visibili (~15s di eventi + ~30s in fading).
- Scrolling continuo 60fps.
- Fading esponenziale dei segni vecchi (opacity *= 0.98/frame).
- Page break tra brani.
- Export PNG della pagina corrente (M3: `canvas.toDataURL('image/png')`).

### Stack

- Canvas 2D.
- ~800-1000 LOC score.js + ~200 LOC glyphs.js + ~50 LOC palette.js.
- Performance triviale (sotto 60fps con migliaia di segni).

---

## §7 — Testing + MVP scope

### Milestones

| Milestone | Scope | Giorni stimati |
|---|---|---|
| **M0** | Fondazioni offline (YAML, seed, director, composer batch) | 2-3 |
| **M1** | Audio live (SC SynthDef, OSC, launcher, UI minima) | 2-3 |
| **M2** | PARTITURA (events.js, score.js, glyphs.js) | 2 |
| **M3** | Polish & persistenza (save YAML, fullscreen, panic, version guard) | 1-2 |
| **Totale MVP** | | **7-10 giorni** |
| M4 | Export MIDI | +2 |
| M5 | Export audio via SC NRT | +3 |

### M0 — Fondazioni (no audio, no visual)

- `config-loader.js`, `seed-manager.js`, `album-director.js`, `song-director.js`.
- Fork `composers/` da MACH:INE con adattamento `generateBar(bar, state) → Events[]`.
- Test determinism: `node test/all.js` — stesso seed → stesso array eventi.

### M1 — Audio live

- `sc/album-engine.scd` + 9 SynthDef funzionanti.
- `sc-dispatcher.js` con scheduler lookahead 15ms.
- `album-launch.command` (sclang + http.server + browser).
- UI minima: dropdown album, 5 pulsanti brano, Play/Stop/Regen/Lock (no persistenza ancora).
- Test manuale: suono i 5 brani, rigenero, suono diverso.

### M2 — PARTITURA

- `events.js` (aggregator grandezze).
- `score.js` + `glyphs.js` + `palette.js`.
- Test manuale: visual leggibile, calibrazione glifi, nessuna competizione con audio.

### M3 — Polish & persistenza

- Endpoint HTTP per save YAML.
- Fullscreen `F`.
- Gap 2-4s tra brani in "Play album".
- Version guard + warning.
- Panic stop (tutti gate chiusi su SC).
- Test manuale ciclo completo.

### Testing strategy

**Automated (Node.js, sincroni):**
- Determinism: per ogni composer, `generateBar(bar, state, seed) → events[]`, snapshot test.
- Seed derivation: stessa gerarchia dato stesso global.
- Schema validation: YAML rotti → errori chiari.

**Manual only:**
- SC (suoni reali, latency).
- Visual PARTITURA.
- UX cycles.

**CI**: nessuna. Un `node test/all.js`.

### Criteri di "MVP finito"

1. Ho composto e lockato 1 album completo che mi piace.
2. Chiudo e riapro: identico.
3. Audio + visual coerenti, niente "manca qualcosa".

Se dopo M3 un criterio non è vero → backlog.

---

## Decision log (brainstorming 2026-04-20)

Scelte fatte in fase di brainstorming, con motivazione. Serve come contesto
per future modifiche architetturali.

1. **Scope = solo per me.** Niente piattaforma pubblica, niente docs per terzi,
   niente marketplace.
2. **Pivot da "piattaforma generica" a "tool-specifico album".** La piattaforma
   audiovisiva MACH:INE-derived è archiviata.
3. **Output primario: MIDI events → SuperCollider realtime.** Scartati: MIDI
   files come primary, audio-only, hybrid con DAW.
4. **Album = ibrido generativo + snapshot via seed.** Scartati: puramente
   generativo (niente blocco), puramente deterministico (config-only).
5. **Relazione codice con MACH:INE = copia selettiva (vendor/machine).**
   Scartati: submodule, estrazione piattaforma, scratch.
6. **Config scope: tool generico con YAML-per-album.** Scartato: hard-coded
   single album. Nota: questo riavvicina al territorio "piattaforma" ma in
   forma ridotta (single-purpose tool con config esterna).
7. **Coerenza album = estetica + arco d'album (ruoli fissi).** Scartati:
   solo estetica, leitmotiv condivisi, full (estetica + arco + leitmotiv).
8. **Approccio A (director-centric) con sfumatura C (pipeline stage).**
   song-director è batch-capable (generateAll) + streaming-capable (tickBar),
   pura stessa logica.
9. **Live-first. Export MIDI/audio deferred a M4/M5.**
10. **SC motore completo (9 SynthDef) su Mac standalone. No Norns, no DAW.**
    Scartati: SC solo drone (resto MIDI-out), hybrid pragmatico (SC + DAW).
11. **Visual event-driven puro (opzione X).** No FFT, no BlackHole in MVP.
    Consistent con MIDI-world, zero latency, zero false-positive.
12. **Visual = PARTITURA (nuovo linguaggio, non MACH:INE-derived).** Scelta
    autonoma del designer dopo che utente ha delegato ("fai tu. stupiscimi").
    Motivazione: coerenza concettuale (tool scrive l'album come documento),
    radicalità rispetto a MACH:INE, event-driven naturale, export-ready.
13. **Launcher all-in-one stile `machine-launch.command`.** Assunto tacito
    confermato.

---

## Open questions / future work

- **Character mapping nel song-director**: la tabella parola→parametri è
  piccola (10-20 parole) nell'MVP. Espandibile in futuro.
- **Multi-album browser UI**: non in MVP. Potrebbe essere utile se nasce
  un secondo album.
- **SC NRT render per audio export (M5)**: richiede riscrivere l'engine per
  modalità non-realtime. Non banale ma ben documentato.
- **Tool_version migration strategy**: per ora solo warning. Se l'algoritmo
  compositivo cambia in modo non-retrocompatibile, serve strategy (versioning
  dei composer + selezione da YAML?).
- **Crossfade/transizioni musicali tra brani**: non in MVP, ma interessante
  per Play album in futuro.

---

## Riferimenti e ispirazioni (PARTITURA)

- Cornelius Cardew — *Treatise* (1967)
- Morton Feldman — *Projections*, *Intersections*
- John Cage — *Atlas Eclipticalis*, *Fontana Mix*
- Anestis Logothetis — partiture grafiche
- Cathy Berberian — *Stripsody*

---

*Design approvato 2026-04-20. Next: invocare writing-plans per il piano implementativo M0-M3.*
