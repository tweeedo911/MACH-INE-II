# MACH:INE III — OSC Map v0.1

Frozen Wave A (sessione 32, v3.20.0-rc1). Wave B/C estendono `/synth/<name>/note`.

## Trasporto

- **Browser ↔ bridge**: WebSocket JSON. Endpoint `ws://127.0.0.1:9877`.
  Payload: `{ "address": "/biome/set", "args": ["NEBBIA"] }`.
  Il bridge inferisce i tipi (number → float32, string → string).
- **Bridge ↔ sclang**: OSC/UDP. Target `127.0.0.1:57120` (sclang default).
  Bridge listens su `127.0.0.1:57122` per le reply (album-gen usa 57121, no collisione).

## Browser → SC (Wave A)

| Address | Args | Description |
|---|---|---|
| `/biome/set` | `name:s` | Cambia preset timbrico. `name` ∈ {NEBBIA, TESSUTO, SOLCO, RESPIRO, MACCHINA, TEMPESTA, RITORNO}. Riapplica anche la phase corrente. |
| `/phase/set` | `name:s, progress:f` | Phase curve (germoglio/pulsazione/densita/rottura/dissoluzione) + progress 0→1 dentro la fase. Applica multiplier amp/cutoff/drift/reverb. |
| `/panic` | — | Silenzia drone, libera tutti i synth, reinstanzia drone singleton. |
| `/status` | — | Liveness ping. |

## Browser → SC (Wave B/C — riservati, no-op in Wave A)

| Address | Args | Description |
|---|---|---|
| `/synth/<role>/note` | `freq:f, amp:f, dur:f` | Fire one note. `role` ∈ {kick, perc, bass, chord, voice, lead, arp}. Wave A: stub. |

## SC → Browser

| Address | Args | Description |
|---|---|---|
| `/pong` | — | Reply a `/status`. |
| `/log` | `msg:s` | Diagnostica → console browser. |

## Filosofia

- **Stato persistente lato SC**: il bioma e la fase sono stato del server (singleton drone, Lag3
  18s di morphing). Il browser non manda parametri timbrici per nota — manda solo
  `/biome/set` quando cambia traccia e `/phase/set` per il morph all'interno.
- **Silenzio iniziale**: il drone singleton viene instanziato con `amp=0`. Diventa udibile
  SOLO dopo il primo `/biome/set` + `/phase/set` (che applica `phaseCurve.amp`).
  Quindi prima della suite il SC è silente, esattamente come MIDI.
- **Bias su drone in Wave A**: per ora SC suona SOLO il drone. MIDI continua a uscire normale
  per tutti gli 8 ch, quindi il sistema funziona in parallelo (SC = drone live, MIDI = synth
  esterni per kick/bass/chord/voice/lead/arp).

## Latenza

- Browser invia con lookahead 15ms (stesso `NOTE_LOOKAHEAD_MS` di midi.js) per assorbire
  jitter localhost. Wave A non ha note one-shot, solo `set` continui — la latenza non è
  critica per il drone (Lag3 morphing è già 18s).

## Errori

- `/biome/set <unknown>` → log `unknown biome: <name>`, drone resta com'era.
- WebSocket chiuso durante il set → SC continua col bioma corrente, browser perde controllo.
  Riconnetti il bridge per riprendere.
