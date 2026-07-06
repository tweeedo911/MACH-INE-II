#!/usr/bin/env bash
# MACH:INE III — runner del render audio offline (realtime record via sclang headless).
# Uso: ./render.sh [score.scd] [out.wav]
set -uo pipefail

SCLANG="${SCLANG:-/Applications/SuperCollider.app/Contents/MacOS/sclang}"
HERE="$(cd "$(dirname "$0")" && pwd)"
SCORE="${1:-$HERE/score-test.scd}"
OUT="${2:-$HERE/render-out.wav}"
WATCHDOG="${WATCHDOG:-180}"   # secondi: kill di sicurezza se sclang non esce

if [[ ! -x "$SCLANG" ]]; then echo "[render-fail] sclang non trovato: $SCLANG" >&2; exit 1; fi

rm -f "$OUT"
echo "[render] sclang=$SCLANG"
echo "[render] score=$SCORE out=$OUT (watchdog ${WATCHDOG}s)"

"$SCLANG" "$HERE/render-audio.scd" "$SCORE" "$OUT" 2>&1 &
SCPID=$!
( sleep "$WATCHDOG"; kill -9 "$SCPID" 2>/dev/null ) & WPID=$!
wait "$SCPID"; RC=$?
kill "$WPID" 2>/dev/null

if [[ -f "$OUT" ]]; then echo "[render] file: $(ls -la "$OUT" | awk '{print $5" bytes"}')"; fi
exit $RC
