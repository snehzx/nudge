import http from "http";
import crypto from "crypto";
import express from "express";
import { WebSocketServer } from "ws";

import { PORT } from "./config/config";
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

const app = express();
app.get("/health", (_req, res) => {
  res.json({ ok: true, online: onlineCount(), rooms: roomList() });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  const id = crypto.randomUUID().slice(0, 8);
  //clients -property of wss , set obj , contains all currently connected clients
  clients.set(ws, { id, name: null, rooms: new Set() }); //a fresh set per connection
  console.log(`${id} connected - sockets:${clients.size}`);
  sendTo(ws, { type: "welcome", id });

  ws.on("message", async (raw) => {
    const state = clients.get(ws);
    if (!state) return;

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
