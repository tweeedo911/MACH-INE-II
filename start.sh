#!/bin/bash
# ─────────────────────────────────────────────
#  MACH:INE II  –  Local launcher
#  Avvia un server HTTP locale (necessario per MIDI)
#  e apre il browser
# ─────────────────────────────────────────────

PORT=8181
DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  MACH:INE II"
echo "  ─────────────────────────────────"
echo "  Avvio server su http://localhost:$PORT"
echo "  Premi CTRL+C per fermare"
echo ""

# Kill previous instance on same port if any
lsof -ti tcp:$PORT | xargs kill -9 2>/dev/null

# Start server
cd "$DIR"
python3 -m http.server $PORT --bind 127.0.0.1 &
SERVER_PID=$!

# Wait a moment then open browser
sleep 0.8
open "http://localhost:$PORT"

# Wait for CTRL+C
trap "kill $SERVER_PID 2>/dev/null; echo '  Server fermato.'; exit 0" INT
wait $SERVER_PID
