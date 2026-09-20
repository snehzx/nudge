import type { WebSocketServer } from "ws";
import { clients } from "./registry.ts";
import { HEARTBEAT_INTERVAL_MS } from "../config/config";

export function startHeartbeat(wss: WebSocketServer) {
  const timer = setInterval(() => {
    for (const [ws, state] of clients) {
      if (!state.isAlive) {
        console.log(`${state.userId} failed heartbeat - terminating`);
        ws.terminate();
        continue;
      }
      state.isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);

  wss.on("close", () => clearInterval(timer));
  return timer;
}
