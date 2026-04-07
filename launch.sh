#!/bin/bash
# ─────────────────────────────────────────────
#  MACH:INE III — Launcher
#  Versione: src/VERSION.js (single source)
#  Server HTTP locale + apertura browser
# ─────────────────────────────────────────────

PORT=8282
DIR="$(cd "$(dirname "$0")" && pwd)"
VER=$(grep -oE "v[0-9]+\.[0-9]+\.[0-9]+[a-z0-9-]*" "$DIR/src/VERSION.js" | head -1)

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║      MACH:INE III  $VER                  ║"
echo "  ║  http://localhost:$PORT                   ║"
echo "  ╠══════════════════════════════════════════╣"
echo "  ║  Band con Direttore — 45min suite        ║"
echo "  ║  1 = 0%   2 = 22%  3 = 50%              ║"
echo "  ║  4 = 75%  5 = 90%  (arc jump)           ║"
echo "  ║  G = gelo   J = convergenza             ║"
echo "  ║  V = vuotoTotale (blackout)             ║"
echo "  ╠══════════════════════════════════════════╣"
echo "  ║  Space = pausa   L = loop                ║"
echo "  ║  P = proiettore  H = HUD   D = debug     ║"
echo "  ║  F = fullscreen  R = rigenera DNA        ║"
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
