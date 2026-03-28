#!/bin/bash
# ─────────────────────────────────────────────
#  MACH:INE II v2.4.0 — Launcher
#  Server HTTP locale + apertura browser
# ─────────────────────────────────────────────

PORT=8282
DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║         MACH:INE II  v2.9.0  [V3]       ║"
echo "  ║  http://localhost:$PORT                   ║"
echo "  ╠══════════════════════════════════════════╣"
echo "  ║  V3_MODE — arco narrativo 45min          ║"
echo "  ║  1 = 0%   2 = 22%  3 = 50%              ║"
echo "  ║  4 = 75%  5 = 90%  (arc jump)           ║"
echo "  ║  0 = SEQUENCER AUTO  Shift+0 = STOP      ║"
echo "  ║  → = skip  ← = prev  Shift+→ = atto     ║"
echo "  ╠══════════════════════════════════════════╣"
echo "  ║  Space = pausa   L = loop                ║"
echo "  ║  P = proiettore  H = HUD   D = debug     ║"
echo "  ║  F = fullscreen  R = rigenera DNA        ║"
echo "  ║  è = gain -      + = gain +              ║"
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
