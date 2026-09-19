import http from "http";
import crypto from "crypto";
import express from "express";
import { WebSocketServer } from "ws";
import { startHeartbeat } from "./ws/heartbeat.ts";
import { consumeToken } from "./ws/rateLimit.ts";
import { RATE_LIMIT_CAPACITY } from "./config/config";
import { PORT, SHUTDOWN_TIMEOUT_MS } from "./config/config";
import { connectDB } from "./db";
import {
  clients,
  sendTo,
  broadcastToRoom,
  removeFromRoom,
  roomList,
  onlineCount,
} from "./ws/registry.ts";
import {
  parsedMsg,
  handleChat,
  handleJoin,
  handleJoinRoom,
  handleLeaveRoom,
} from "./ws/handlers.ts";
import { send } from "process";
import mongoose from "mongoose";

const app = express();
app.get("/health", (_req, res) => {
  res.json({ ok: true, online: onlineCount(), rooms: roomList() });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  const id = crypto.randomUUID().slice(0, 8);
  //clients -property of wss , set obj , contains all currently connected clients
  clients.set(ws, {
    id,
    name: null,
    rooms: new Set(),
    isAlive: true,
    tokens: RATE_LIMIT_CAPACITY, // start with a full bucket
    lastRefill: Date.now(),
  }); //a fresh set per connection

  console.log(`${id} connected - sockets:${clients.size}`);
  sendTo(ws, { type: "welcome", id });

  ws.on("pong", () => {
    const state = clients.get(ws);
    if (state) state.isAlive = true;
  });

  ws.on("message", async (raw) => {
    const state = clients.get(ws);
    if (!state) return;

    if (!consumeToken(state)) {
      sendTo(ws, {
        type: "error",
        code: "RATE_LIMIT",
        message: "slow down",
      });
      return;
    }

    const msg = parsedMsg(raw.toString());
    if (!msg) {
      sendTo(ws, { type: "error", message: "invalid message" });
      return;
    }
    try {
      switch (msg.type) {
        case "ping":
          sendTo(ws, { type: "pong", time: Date.now() });
          break;
        case "listRooms":
          sendTo(ws, { type: "rooms", rooms: roomList() });
          break;
        case "join":
          await handleJoin(ws, state, msg.name);
          break;
        case "joinRoom":
          await handleJoinRoom(ws, state, msg.room);
          break;
        case "leaveRoom":
          await handleLeaveRoom(ws, state, msg.room);
          break;
        case "chat":
          await handleChat(ws, state, msg.room, msg.text);
          break;
      }
    } catch (error) {
      console.error("handle error:", error);
      sendTo(ws, { type: "error", message: "server error" });
    }
  });

  ws.on("close", () => {
    const state = clients.get(ws);
    if (state) {
      for (const room of [...state.rooms]) {
        //this first copies the set before looping and it is necessary cuz remove fxn calles state.rooms.del which modifies the set
        removeFromRoom(room, ws, state);
        broadcastToRoom(room, {
          type: "system",
          room,
          text: `${state.name} left the room`,
        });
      }
    }
    clients.delete(ws);
    console.log(`${state?.name} disconnected - socket:${clients.size}`);
  });
  ws.on("error", (err) => console.error("socket error:", err.message));
});

connectDB().then(() => {
  server.listen(PORT, () => console.log("server started"));
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return; //ignores a second ctrl+c
  shuttingDown = true;
  console.log(`${signal} received - shutting down`);

  const force = setTimeout(() => {
    console.error("force exit after timeout");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  force.unref(); //dont let this timer hold the process open

  server.close(); // stop accepting new connections

  for (const ws of clients.keys()) {
    ws.close(1001, "server shutting down"); // 1001-going away
  }

  await new Promise((r) => setTimeout(r, 500)); //let close frames flush

  wss.close();
  await mongoose.connection.close();
  console.log("clean shutdown");
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM")); //this is what docket k8s and process managers send on stop or redeploy
