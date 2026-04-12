# BIOMI-BOZZE — 7 preset per Campo Materiale

> Bozze elaborate in sessione 8 incrociando moodboard Pinterest
> (ispirazioni-machne/per-brano.md, visioni.md) con MOOD.md.
> Da implementare in `biomi.js` come depositFn + colors + decay + force.
>
> **Principio canvas-space**: ogni ruolo mappa il registro attivo
> all'80% del campo Y. Drone riempie tutto. Nessuna zona vuota.
> Implementare `localPitchToCell(note, lo, hi)` in campo.js.

---

## 1. NEBBIA — lo spazio negativo è il materiale

**Moodboard**: Glaciale Ambient — "il tempo che si ferma"
**Ruoli attivi**: drone, chord, voice, lead. Assenti: kick, perc, bass, arp.

| Ruolo | depositFn | force | decay |
|---|---|---|---|
| drone | campo uniforme: every 4 cells random, +0.02 | 0.02 | 0.9999 |
| chord | blob r=2-3 tenue, X random, Y = pitch locale | 0.06 | 0.997 |
| voice | punto singolo a pitch→Y locale, X random 40-60% | 0.45 | 0.993 |
| lead | punto come voice ±1 cella offset | 0.35 | 0.991 |

- bg: `[8, 9, 14]` (nero blu-notte)
- voice/lead: `[200, 210, 224]` (azzurro-carta)
- chord: `[143, 168, 192]` (grigio-blu)
- drone: `[25, 30, 40]`
- accent (#4 lidio): `[232, 240, 216]` (verde-bianco lunare)
- shimmer: 0.02

---

## 2. TESSUTO — la griglia che emerge

**Moodboard**: MACH:INE Original — "sedimenti geologici strato dopo strato"
**Ruoli attivi**: kick (raro), drone, bass, chord (protagonista staccato), lead (solo). Assenti: voice, arp.

| Ruolo | depositFn | force | decay |
|---|---|---|---|
| kick | riga orizzontale Y=0.82 | 0.60 | 0.700 |
| drone | riga bassa Y=0.85, w=8 celle | 0.03 | 0.9998 |
| bass | riga a pitch→Y locale, w=6 | 0.35 | 0.994 |
| chord | burst di 3 righe (note accordo) w=4-5 a pitch→Y | 0.40 | 0.990 |
| lead | punto singolo Y alto, X con attrazione centro | 0.30 | 0.992 |

- bg: `[15, 13, 10]` (nero caldo ocra)
- chord: `[212, 184, 150]` (ocra sbiadita)
- lead: `[240, 224, 192]` (crema)
- bass: `[158, 128, 96]` (terra)
- drone: `[80, 68, 50]`
- accent (b6 eolio): `[240, 224, 192]`
- shimmer: 0.04

---

## 3. SOLCO — l'eco che sedimenta (riscaldare palette)

**Moodboard**: Dub Cosmico — "la cera calda che accumula strati di delay"
**Ruoli attivi**: kick, drone, bass (protagonista), chord (3 colonnine), voice (rara), arp.
**Assenti**: lead, percussion.

**FIX PALETTE** (da verde-oliva a terracotta per moodboard):

| Ruolo | depositFn (invariata) | force | decay |
|---|---|---|---|
| kick | riga Y=0.70 | 0.80 | 0.600 |
| bass | blob w×3, pitch→X/Y | 0.75 | 0.988 |
| chord | 3 colonnine zone X fisse | testa 0.55, scia 0.11 | 0.997 |
| arp | particella cadente | 0.25 | 0.879 |
| voice | banda h=1 metà canvas | 0.50 | 0.992 |

- bg: `[22, 18, 14]` (marrone-notte, più caldo)
- bass: `[220, 140, 55]` (arancione terroso)
- kick: `[180, 90, 30]` (terra bruciata)
- chord: `[170, 150, 90]` (giallo carta invecchiata)
- arp: `[200, 190, 100]` (giallo tenue)
- voice: `[210, 170, 120]` (rosa polveroso)
- drone: `[60, 50, 35]`
- shimmer: 0.05

---

## 4. RESPIRO — il vuoto che respira (fondo chiaro, logica invertita)

**Moodboard**: Glaciale + Minimal Luminoso — "il lichene arancione sulla roccia artica"
**Ruoli attivi**: drone, bass (impercettibile), chord, voice, lead (eco). Assenti: kick, perc, arp.
**SPECIALE**: campo parte PIENO. Note depositano con force NEGATIVA (sottraggono = pori).

| Ruolo | depositFn | force | decay |
|---|---|---|---|
| drone | poro circolare r=3-4 al centro, -force | -0.03 | 0.9995 |
| bass | poro r=1-2 basso | -0.15 | 0.998 |
| chord | poro r=2 per nota, Y = pitch (alto) | -0.25 | 0.996 |
| voice | poro r=1, chiusura rapida | -0.35 | 0.993 |
| lead | poro r=1 come voice, ±1 offset, delay | -0.25 | 0.994 |

- bg: `[240, 236, 224]` (carta ingiallita)
- bordi pori: `[216, 208, 188]`
- campo pieno inizializzato a 0.80
- shimmer: 0.01

---

## 5. MACCHINA — il circuito stampato

**Moodboard**: Rituale Techno — "il martello e l'altare, ripetizione come trance"
**Ruoli attivi**: tutti. Arp = PROTAGONISTA 16°.
**SPECIALE**: nessuna fisica continua. Snap a griglia. Celle on/off.

| Ruolo | depositFn | force | decay |
|---|---|---|---|
| kick | riga completa Y=0.85 | 0.90 | 0.500 |
| perc | cella singola random fascia alta | 0.70 | 0.650 |
| drone | colonna verticale fissa X=root | 0.15 | 0.9990 |
| bass | blocco 3×3 pitch-X, Y basso | 0.80 | 0.950 |
| chord | blocco 2×2 deterministico | 0.55 | 0.970 |
| voice | cella singola (LED) | 0.65 | 0.850 |
| lead | cella XOR con voice | 0.65 | 0.850 |
| arp | linea 4-8 celle, scorre 2 celle/frame | 0.75 | 0.920 |

- bg: `[5, 5, 8]` (nero freddo)
- arp: `[0, 232, 160]` (verde-ciano elettrico)
- bass: `[0, 128, 192]` (blu elettrico)
- kick: `[64, 160, 255]` (azzurro flash)
- drone: `[0, 56, 80]`
- shimmer: 0.00 (zero — la macchina non respira)

---

## 6. TEMPESTA — l'alluvione

**Moodboard**: Rituale Techno (picco) — "il bianco si ritira e il nero avanza"
**Ruoli attivi**: TUTTI a massima densità. Voice+lead = hocket.
**SPECIALE**: shimmer altissimo (turbolenza). b2 frigio (F) → flash magenta.

| Ruolo | depositFn | force | decay |
|---|---|---|---|
| kick | riga Y=0.70 + burst ±2 celle | 0.90 | 0.600 |
| perc | punti random densissimi fascia alta | 0.65 | 0.700 |
| drone | campo diffuso 0.70-0.90 (orizzonte) | 0.08 | 0.9998 |
| bass | blob w=4 h=2 aggressivo | 0.85 | 0.980 |
| chord | blob w=3 h=1 rapido | 0.50 | 0.975 |
| voice | punto force alta, Y=pitch (alto) | 0.70 | 0.985 |
| lead | punto hocket (alterna X con voice) | 0.70 | 0.985 |
| arp | punti random sparsi (texture) | 0.30 | 0.940 |

- bg: `[6, 4, 14]` (viola-nero)
- bass/chord: `[144, 96, 208]` (viola magnetico)
- arp/perc: `[192, 128, 255]` (viola elettrico)
- drone: `[48, 32, 80]`
- voice: `[200, 180, 240]` (lavanda)
- lead: `[255, 128, 192]` (magenta — accent b2 frigio)
- shimmer: 0.08 (turbolenza)

---

## 7. RITORNO — la dissoluzione

**Moodboard**: Drone Abissale — "i fantasmi delle forme"
**Ruoli attivi**: kick (sparso), drone, bass (sparso), chord, voice (protagonista), lead (eco rara), arp (muore).
**SPECIALE**: `preserveOnSwitch: true` — NON resettare il campo. Il sedimento
dei biomi precedenti è il punto. L'arp decresce a force=0 su 48 bar.

| Ruolo | depositFn | force | decay |
|---|---|---|---|
| kick | impulso sparso Y=0.80 | 0.40 | 0.800 |
| drone | campo diffuso bassissimo | 0.02 | 0.9999 |
| bass | blob piccolo sparso | 0.25 | 0.995 |
| chord | velatura come NEBBIA | 0.20 | 0.997 |
| voice | punto singolo come NEBBIA (il cuore) | 0.55 | 0.995 |
| lead | eco ±1 cella, raro | 0.30 | 0.994 |
| arp | force 0.15→0 (decresce a zero) | 0.15→0 | 0.960 |

- bg: `[10, 10, 10]` (nero quasi totale)
- voice: `[155, 143, 206]` (lavanda)
- lead: `[239, 230, 222]` (panna)
- chord: `[120, 110, 140]` (lavanda scura)
- shimmer: 0.03

---
<!-- knowledge-graph links -->
[[MOOD]] [[biomi.js]] [[campo.js]] [[STATUS]]
