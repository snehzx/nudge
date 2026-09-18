import http from "http";
import express from "express";
import crypto from "crypto";
import { WebSocketServer, WebSocket } from "ws";

const app = express();

type ClientState = {
  id: string;
  name: string | null;
  rooms: Set<string>;
};

type ClientMsg =
  | { type: "join"; name: string }
  | { type: "chat"; room: String; text: string }
  | { type: "ping" }
  | { type: "joinRoom"; room: string }
  | { type: "leaveRoom"; room: string };

type ServerMsg =
  | { type: "welcome"; id: string }
  | { type: "joined"; name: string; online: number }
  | { type: "system"; text: string }
  | { type: "error"; message: string }
  | { type: "chat"; from: string; text: string; time: number }
  | { type: "pong"; time: number };
//raw ws gives no event names just bytes , so we invent this envelope with a type field

const clients = new Map<WebSocket, ClientState>();
const rooms = new Map<string, Set<WebSocket>>();

//this function helps to send the msg in string rather than obj if we anyhow forgets
function send(ws: WebSocket, msg: ServerMsg) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

//this function helps in broadcasting the msg to diff tcp connections
function broadcast(room: string, msg: ServerMsg, except?: WebSocket) {
  const members = rooms.get(room);
  if (!members) return;
  const data = JSON.stringify(msg);
  for (const client of members) {
    if (client === except) continue;
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(data);
  }
}

//how to stop anyone to open a socket and send garbage
function parseMsg(raw: string): ClientMsg | null {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof data !== "object" || data === null) return null;
  const m = data as Record<string, unknown>;
  if (m.type === "ping") return { type: "ping" };
  if (m.type === "join") {
    if (typeof m.name !== "string") return null;
    const name = m.name.trim().slice(0, 20);
    if (name.length < 2) return null;
    return { type: "join", name };
  }
  if (m.type === "chat") {
    if (typeof m.text !== "string") return null;
    const text = m.text.trim().slice(0, 500);
    if (!text) return null;
    return { type: "chat", text };
  }
  return null;
}

function onlineCount() {
  let n = 0;
  for (const s of clients.values()) if (s.name) n++;
  return n;
}

app.get("/health", (req, res) => res.status(200).json({ ok: true }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  const id = crypto.randomUUID().slice(0, 8);
  clients.set(ws, { id, name: null });
  console.log(`client connected , total: ${clients.size}`);
  send(ws, { type: "welcome", id });

  //server speaks first - impossible with plain http
  ws.send(JSON.stringify({ type: "welcome", text: "connected to server" }));

  ws.on("message", (raw) => {
    // {event , listener}
    const state = clients.get(ws); //this looks for the specific object and returns that specific person data
    if (!state) return;
    const msg = parseMsg(raw.toString());
    if (!msg) {
      send(ws, { type: "error", message: "invalid msg" });
      return;
    }
    switch (msg.type) {
      case "ping":
        send(ws, { type: "pong", time: Date.now() });
        break;
      case "join": {
        if (state.name) {
          send(ws, { type: "error", message: "u have already joined" });
          return;
        }
        const taken = [...clients.values()].some(
          (s) => s.name?.toLowerCase() === msg.name.toLowerCase(),
        );
        if (taken) {
          send(ws, { type: "error", message: "name already taken" });
        }
        state.name = msg.name;
        console.log(`${state.id} is now ${msg.name}`);
        send(ws, { type: "joined", name: msg.name, online: onlineCount() });
        broadcast({ type: "system", text: `${msg.name} joined` }, ws);
        break;
      }
      case "chat": {
        if (!state.name) {
          send(ws, { type: "error", message: "join first" });
          return;
        }
        broadcast({
          type: "chat",
          from: state.name,
          text: msg.text,
          time: Date.now(),
        });
        break;
      }
    }
  });

  ws.on("close", () => {
    const state = clients.get(ws);
    clients.delete(ws); // if i dont delete the map grows forever and i ll left with thousands of dead entries

    if (state?.name) broadcast({ type: "system", text: `${state.name} left` });
    console.log(`${state?.id} left - total:${clients.size}`);
  });
  ws.on("error", (err) => console.log("socket error", err.message));
});

server.listen(4000, () => console.log("server started"));
