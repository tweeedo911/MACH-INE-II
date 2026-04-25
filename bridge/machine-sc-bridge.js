// MACH:INE III — WebSocket ↔ OSC bridge per audio engine SC.
// Browser invia JSON { address, args } su ws://127.0.0.1:9877.
// Forward a sclang su 127.0.0.1:57120 (default). Reply da sclang su UDP 57122.
//
// Porte distinte da album-gen (9876 / 57121) per non collidere se entrambi
// i progetti girano insieme. SC server ne gestirebbe uno solo comunque, ma
// il bridge separato evita confusione di routing.

import osc from "osc";
import { WebSocketServer } from "ws";

const WS_PORT = 9877;
const SCLANG_HOST = "127.0.0.1";
const SCLANG_PORT = 57120;
const LOCAL_UDP_PORT = 57122;

const udpPort = new osc.UDPPort({
    localAddress: "127.0.0.1",
    localPort: LOCAL_UDP_PORT,
    remoteAddress: SCLANG_HOST,
    remotePort: SCLANG_PORT,
    metadata: false,
});

udpPort.on("ready", () => {
    console.log(`[machine-sc-bridge] UDP listening on ${LOCAL_UDP_PORT} → ${SCLANG_HOST}:${SCLANG_PORT}`);
});

udpPort.on("error", (err) => {
    console.error("[machine-sc-bridge] udp error:", err.message);
});

udpPort.open();

const wss = new WebSocketServer({ host: "127.0.0.1", port: WS_PORT });
console.log(`[machine-sc-bridge] WebSocket listening on ws://127.0.0.1:${WS_PORT}`);

const clients = new Set();

wss.on("connection", (ws) => {
    clients.add(ws);
    console.log(`[machine-sc-bridge] client connected (${clients.size} total)`);

    ws.on("message", (raw) => {
        let frame;
        try { frame = JSON.parse(raw.toString()); }
        catch (e) {
            console.warn("[machine-sc-bridge] bad json frame, dropped");
            return;
        }
        if (!frame || typeof frame.address !== "string") {
            console.warn("[machine-sc-bridge] frame missing address, dropped");
            return;
        }
        const args = Array.isArray(frame.args) ? frame.args : [];
        try {
            udpPort.send({ address: frame.address, args });
        } catch (e) {
            console.warn("[machine-sc-bridge] failed to send osc:", e.message);
        }
    });

    ws.on("close", () => {
        clients.delete(ws);
        console.log(`[machine-sc-bridge] client disconnected (${clients.size} total)`);
    });

    ws.on("error", (e) => console.warn("[machine-sc-bridge] ws error:", e.message));
});

udpPort.on("message", (oscMsg) => {
    const frame = JSON.stringify({
        address: oscMsg.address,
        args: oscMsg.args ?? [],
    });
    for (const ws of clients) {
        if (ws.readyState === 1) ws.send(frame);
    }
});

function shutdown() {
    console.log("[machine-sc-bridge] shutting down");
    for (const ws of clients) { try { ws.close(); } catch (_) {} }
    udpPort.close();
    wss.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
