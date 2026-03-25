#!/bin/bash
# ─────────────────────────────────────────────
#  MACH:INE II v1.7.0 — Launcher
#  Server HTTP locale + apertura browser
# ─────────────────────────────────────────────

PORT=8282
DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║         MACH:INE II  v1.7.0              ║"
echo "  ║  http://localhost:$PORT                   ║"
echo "  ╠══════════════════════════════════════════╣"
echo "  ║  MOTORI                                  ║"
echo "  ║  1 = DERIVA    2 = CRISTALLO             ║"
echo "  ║  3 = ABISSO    4 = TERRENO               ║"
echo "  ║  5 = MECCANICA 6 = VORTICE               ║"
echo "  ║  0 = SEQUENCER AUTO  → = SKIP            ║"
echo "  ╠══════════════════════════════════════════╣"
echo "  ║  H = HUD   D = debug   F = fullscreen   ║"
echo "  ║  R = rigenera DNA   N = mutazione        ║"
echo "  ║  è = gain -   + = gain +                 ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# Kill previous instance on same port
lsof -ti tcp:$PORT | xargs kill -9 2>/dev/null

# Start server
cd "$DIR"
python3 -m http.server $PORT --bind 127.0.0.1 &
SERVER_PID=$!

# Wait then open browser
sleep 0.8
open "http://localhost:$PORT"

echo "  Server attivo. CTRL+C per fermare."
echo ""

# Wait for CTRL+C
trap "kill $SERVER_PID 2>/dev/null; echo ''; echo '  Server fermato.'; exit 0" INT
wait $SERVER_PID
