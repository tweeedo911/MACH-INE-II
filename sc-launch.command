#!/bin/bash
# MACH:INE III — SC audio engine launcher (Wave A)
# Avvia sclang con machine-engine.scd + bridge WebSocket↔OSC.
# Da affiancare a machine-launch.command (che gestisce http + browser).
# Doppio-click da Finder o ./sc-launch.command da CLI.

set -u

cd "$(dirname "$0")" || exit 1
ROOT="$(pwd)"

SC_APP="/Applications/SuperCollider.app"
SCLANG="${SC_APP}/Contents/MacOS/sclang"
ENGINE_FILE="${ROOT}/sc/machine-engine.scd"
BRIDGE_DIR="${ROOT}/bridge"
LOG_DIR="${ROOT}/.run-sc"
mkdir -p "${LOG_DIR}"

SC_PID=""
BRIDGE_PID=""
TAIL_PID=""

cleanup() {
    echo ""
    echo "[sc-launcher] cleaning up..."
    [ -n "${TAIL_PID}" ]   && kill "${TAIL_PID}"   2>/dev/null
    [ -n "${SC_PID}" ]     && kill "${SC_PID}"     2>/dev/null
    [ -n "${BRIDGE_PID}" ] && kill "${BRIDGE_PID}" 2>/dev/null
    wait 2>/dev/null
    exit 0
}
trap cleanup EXIT INT TERM

# ── sanity checks ──
if [ ! -x "${SCLANG}" ]; then
    osascript -e 'display alert "SuperCollider not found" message "Install SuperCollider.app to /Applications and retry."'
    exit 1
fi
if ! command -v node >/dev/null 2>&1; then
    osascript -e 'display alert "Node.js not found" message "Install Node.js 20+ and retry."'
    exit 1
fi
if [ ! -f "${ENGINE_FILE}" ]; then
    echo "[sc-launcher] missing engine: ${ENGINE_FILE}"
    exit 1
fi

# ── npm install bridge deps (one-time) ──
if [ ! -d "${BRIDGE_DIR}/node_modules/osc" ] || [ ! -d "${BRIDGE_DIR}/node_modules/ws" ]; then
    echo "[sc-launcher] installing bridge deps..."
    (cd "${BRIDGE_DIR}" && npm install --silent) || { echo "npm install failed"; exit 1; }
fi

# ── log files ──
SC_LOG="${LOG_DIR}/sclang.log"
BRIDGE_LOG="${LOG_DIR}/bridge.log"
: > "${SC_LOG}"
: > "${BRIDGE_LOG}"

# ── start children ──
echo "[sc-launcher] starting SuperCollider engine..."
"${SCLANG}" "${ENGINE_FILE}" >> "${SC_LOG}" 2>&1 &
SC_PID=$!
echo "[sc-launcher]   sclang pid=${SC_PID}  log=${SC_LOG}"

echo "[sc-launcher] starting OSC bridge..."
(cd "${BRIDGE_DIR}" && node machine-sc-bridge.js) >> "${BRIDGE_LOG}" 2>&1 &
BRIDGE_PID=$!
echo "[sc-launcher]   bridge pid=${BRIDGE_PID}  log=${BRIDGE_LOG}"

# ── stream logs ──
echo ""
echo "[sc-launcher] streaming logs (Ctrl-C to stop):"
echo "  - sclang  → ${SC_LOG}"
echo "  - bridge  → ${BRIDGE_LOG}"
echo ""
echo "  → tip: per abilitare SC nel browser apri http://localhost:8282/?sc=1"
echo "  → MIDI continua a uscire normale in parallelo."
echo "---"
tail -F -n 0 "${SC_LOG}" "${BRIDGE_LOG}" 2>/dev/null &
TAIL_PID=$!

wait
