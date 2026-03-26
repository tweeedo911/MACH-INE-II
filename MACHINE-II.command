#!/bin/bash
# ─────────────────────────────────────────────
#  MACH:INE II v2.4.0 — Avviabile (doppio-click dal Finder)
#  Apre Terminal, avvia il server, lancia il browser
# ─────────────────────────────────────────────

# Portarsi nella cartella dello script anche se lanciato da Finder
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

PORT=8282

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║         MACH:INE II  v2.4.0              ║"
echo "  ║  http://localhost:$PORT                   ║"
echo "  ╠══════════════════════════════════════════╣"
echo "  ║  MOTORI                                  ║"
echo "  ║  1 = TERRENO   2 = MECCANICA             ║"
echo "  ║  3 = DERIVA    4 = VORTICE               ║"
echo "  ║  5 = CRISTALLO 6 = ABISSO  7 = SOLCO     ║"
echo "  ║  0 = SEQUENCER AUTO  → = SKIP            ║"
echo "  ╠══════════════════════════════════════════╣"
echo "  ║  Space = pausa   L = loop                ║"
echo "  ║  P = proiettore  H = HUD   D = debug     ║"
echo "  ║  F = fullscreen  R = rigenera DNA        ║"
echo "  ║  è = gain -      + = gain +              ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# Kill eventuale istanza precedente sulla stessa porta
lsof -ti tcp:$PORT | xargs kill -9 2>/dev/null

# Avvia server HTTP
python3 -m http.server $PORT --bind 127.0.0.1 &
SERVER_PID=$!

# Attendi avvio e apri browser
sleep 0.8
open "http://localhost:$PORT"

echo "  Server attivo su http://localhost:$PORT"
echo "  CTRL+C per fermare."
echo ""

trap "kill $SERVER_PID 2>/dev/null; echo ''; echo '  Server fermato.'; exit 0" INT
wait $SERVER_PID
