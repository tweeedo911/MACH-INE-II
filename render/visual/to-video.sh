#!/usr/bin/env bash
# MACH:INE III — assembla una sequenza di frame + audio in un video.
# Uso: ./to-video.sh <frames-dir> <fps> <audio.wav> <out.mp4> [ext]
#   ext = jpg|png (default jpg)
set -euo pipefail
DIR="${1:?frames dir}"; FPS="${2:?fps}"; AUDIO="${3:?audio wav}"; OUT="${4:?out.mp4}"; EXT="${5:-jpg}"

ffmpeg -y -hide_banner -loglevel error \
  -framerate "$FPS" -i "$DIR/frame_%06d.$EXT" \
  -i "$AUDIO" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 256k \
  -shortest -movflags +faststart \
  "$OUT"

echo "[video-ok] $OUT  ($(ls -la "$OUT" | awk '{print $5}') bytes)"
