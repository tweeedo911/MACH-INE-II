# TASK: Implementare v0.8.0 — COLLEGAMENTO AUDIO REALE

## Prima di iniziare

Leggi questi file nell'ordine indicato:
1. `RULES.md`
2. `DESIGN.md` — tutto
3. `ROADMAP.md` — milestone v0.8.0
4. `sandbox.html` — v0.7.0 (sistema completo nel sandbox)
5. `src/` — moduli audio/midi/state v0.2.0
6. `CHANGELOG.md`

## Obiettivo

Portare tutto dal sandbox a moduli ES e collegare l'audio reale.
`index.html` diventa il sistema completo.

## Struttura src/

```
src/
  config.js       — CFG esteso con tutti i parametri (audio + campo + DNA + colore + camera)
  audio.js        — (gia' esistente v0.2.0, non modificare)
  midi.js         — (gia' esistente v0.2.0, non modificare)
  state.js        — (gia' esistente v0.2.0, non modificare)
  field.js        — NEW: campo di densita' halftone + rendering dither Bayer
  dna.js          — NEW: generatore DNA sessione + primitivi strutturali
  generations.js  — NEW: ciclo vita entita' (nascita, crescita, invecchiamento, morte)
  colors.js       — NEW: sistema cromatico A/B/C integrato nel campo
  director.js     — NEW: Il Regista (mutazioni) + Il Direttore (camera)
  render.js       — RISCRIVERE: orchestratore
  main.js         — AGGIORNARE: boot
```

## Collegamento audio → campo

Il ponte e' `state.js` (5 valori derivati). Il campo legge da `state`
esattamente come leggeva dagli slider nel sandbox.

In piu', il campo puo' leggere dati grezzi da `audio`:
- `audio.bands` per il mapping frequenziale delle nascite
- `audio.onset` per i burst di generazione A
- `audio.flux` per l'intensita' dell'onset

Da `midi`:
- `midi.lastNote` per le nascite B (pitch → posizione X)
- `midi.noteDensity` per contribuire all'intensita'

## Il Regista con audio reale

Nel sandbox il BPM era fisso a 120. Con audio reale:
- Se `audio.bpm > 0`: timing mutazioni agganciato ai beat
- Se `audio.bpm == 0`: timing in secondi (come sandbox)

## index.html

- Schermata avvio "CLICK TO BEGIN"
- Canvas fullscreen nero
- Dopo click: init audio, MIDI, genera DNA, avvia render loop
- HUD minimale (tasto H, default visibile):
  - Basso-sinistra: DNA corrente (primitivi attivi), shot camera
  - Basso-destra: BPM, stato MIDI
  - Testo piccolo 9px, monospace, semi-trasparente
- HUD debug verbose (tasto D, default nascosto):
  tutti i dati audio, stato narrativo, generazioni, regista
- Tasto F: fullscreen
- Tasto R: rigenera DNA (nuovo mondo)
- Tasto N: forza mutazione
- Tasto spazio: nessuna azione

## Render loop

```
1. updateAudio()
2. updateMIDI()
3. updateState()
4. generations.update(dt, state, audio, midi)
5. director.update(dt, state, audio)
6. ctx.save()
7. director.applyCamera(ctx)
8. field.render(ctx, W, H, generations, dna, colors)
9. ctx.restore()
10. hud.update()
```

## sandbox.html

NON modificare. Resta come strumento di tuning.

## Vincoli

- NO librerie esterne
- ES modules nativi, nessun build step
- 60fps a 1920x1080 con audio stereo attivo
- Se fps < 30, auto-limitare nascite (ridurre maxEntities)
- Funziona con `start.sh`
- Il campo halftone con audio reale deve essere ALMENO altrettanto
  bello di quello nel sandbox. Se non lo e', il problema e' nel tuning
  dei parametri, non nell'architettura.

## Test

1. Senza audio: campo quasi nero con dither appena visibile. No crash.
2. Con audio ambient da Ableton: campo vivo, nascite lente, grigio prevalente.
3. Con audio ritmico: burst sugli onset, zone A (#FF4400), cambi camera.
4. Con MIDI: entita' B (#00AACC) nelle posizioni corrispondenti al pitch.
5. Climax: audio forte 3+ sec → virata C (#E6007E). Rilascio → collasso.
6. Tasto R: nuovo DNA, mondo diverso.
7. Tasto D: HUD debug con tutti i dati.
8. 60fps per 2+ minuti (DevTools > Performance).

## Dopo aver implementato

1. Verifica tutti i test sopra
2. Aggiorna `README.md` (nuove istruzioni, tasti, funzionalita')
3. Aggiorna `CHANGELOG.md`
4. Commit: `v0.8.0: sistema completo — campo halftone, DNA, generazioni, colore, camera, audio reale`
5. Push su GitHub
