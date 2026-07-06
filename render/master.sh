#!/usr/bin/env bash
# MACH:INE III — master a una traccia renderizzata.
# Uso: ./master.sh input.wav [output_basename]
# Produce: <base>-master.wav (48k/24bit) + <base>-master.mp3 (320k).
set -euo pipefail

IN="${1:?usage: master.sh input.wav [output_basename]}"
BASE="${2:-${IN%.*}}"
OUT_WAV="${BASE}-master.wav"
OUT_MP3="${BASE}-master.mp3"

# loudnorm verso standard streaming (-14 LUFS, true-peak -1 dB), poi limiter di sicurezza.
# Per ambient/sperimentale -14 può essere alto: rivedibile in Phase 4 curation.
FILTER="loudnorm=I=-14:TP=-1.0:LRA=11,alimiter=limit=0.97:level=disabled"

ffmpeg -y -hide_banner -loglevel error -i "$IN" -af "$FILTER" -ar 48000 -c:a pcm_s24le "$OUT_WAV"
ffmpeg -y -hide_banner -loglevel error -i "$OUT_WAV" -c:a libmp3lame -b:a 320k "$OUT_MP3"

echo "[master-ok] $OUT_WAV"
echo "[master-ok] $OUT_MP3"
