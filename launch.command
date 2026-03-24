#!/bin/bash
cd "$(dirname "$0")"
PORT=8080

# Controlla se la porta è già in uso
if lsof -i :$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "⚠ Porta $PORT già in uso. Apro il browser..."
  open "http://localhost:$PORT"
  echo "Premi INVIO per uscire"
  read
  exit 0
fi

echo "MACH:INE II — avvio server..."
python3 -m http.server $PORT &
SERVER_PID=$!
sleep 1
open "http://localhost:$PORT"
echo ""
echo "  ╔══════════════════════════════════╗"
echo "  ║  MACH:INE II — v1.3             ║"
echo "  ║  http://localhost:$PORT           ║"
echo "  ║                                  ║"
echo "  ║  H = HUD   D = debug            ║"
echo "  ║  F = fullscreen                 ║"
echo "  ║  R = rigenera DNA               ║"
echo "  ║  N = mutazione                  ║"
echo "  ║  è = gain -   + = gain +        ║"
echo "  ║  1 = Composer 1 (D Dorian)      ║"
echo "  ║  2 = Composer 2 (C# Dorian)     ║"
echo "  ║  3 = Composer 3 (spec 84bpm)    ║"
echo "  ╚══════════════════════════════════╝"
echo ""
echo "Premi INVIO per chiudere il server"
read
kill $SERVER_PID 2>/dev/null
echo "Server chiuso."
