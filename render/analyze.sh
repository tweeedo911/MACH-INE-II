#!/usr/bin/env bash
# MACH:INE III — analisi oggettiva di un WAV renderizzato (proxy per "qualità" senza ascolto).
# Uso: ./analyze.sh file.wav
set -uo pipefail
IN="${1:?usage: analyze.sh file.wav}"

echo "═══ $IN ═══"
echo "── format ──"
ffprobe -v error -show_entries format=duration -show_entries stream=sample_rate,channels,bits_per_raw_sample \
  -of default=noprint_wrappers=1 "$IN" 2>/dev/null

echo "── peak / RMS (astats) ──"
ffmpeg -hide_banner -loglevel error -i "$IN" -af astats=metadata=1:reset=0 -f null - 2>&1 \
  | grep -Ei "Peak level|RMS level|Flat factor|Dynamic range|Peak count|Min level|Max level" | head -40

echo "── EBU R128 loudness ──"
ffmpeg -hide_banner -nostats -i "$IN" -af ebur128=framelog=quiet -f null - 2>&1 \
  | grep -Ei "I:|LRA:|LUFS|Threshold|Peak:" | tail -12

echo "── silence (soglia -50dB) ──"
ffmpeg -hide_banner -loglevel error -i "$IN" -af silencedetect=noise=-50dB:d=0.5 -f null - 2>&1 \
  | grep -i silence | head -20

echo "── done ──"
