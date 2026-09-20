import type { Server } from "http";
import type { accessPayload } from "../utils/jwt.ts";
import { WebSocketServer, WebSocket } from "ws";
import { verifyAccessToken } from "../utils/jwt.ts";
import { RATE_LIMIT_CAPACITY } from "../config/config.ts";
import { consumeToken } from "./rateLimit.ts";
import { startHeartbeat } from "./heartbeat.ts";
import {
  clients,
  sendTo,
  broadcastToRoom,
  removeFromRoom,
  roomList,
  onlineCount,
} from "../ws/registry.ts";
import {
  parsedMsg,
  handleChat,
  handleJoinRoom,
  handleLeaveRoom,
} from "../ws/handlers.ts";

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true }); //earlier it used to accept everyone , now it dont attach , i ll handle ur upgrades myself , means i own the gate

  //the auth gate
  server.on("upgrade", (req, socket, head) => {
    let user: accessPayload;
    try {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
      const token = url.searchParams.get("token");
      if (!token) throw new Error("no token");
      user = verifyAccessToken(token);
    } catch (error) {
      socket.write("http/1.1 401 unauthorised"); // the handshake is still http so we write raw http by hand and socket her is a tcp socket not a ws , so there is no .send() yet
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, user);
    });
  });

  //connection and now the user is knwon before this handle runns so no join now
  wss.on("connection", (ws: WebSocket, _req: Request, user: accessPayload) => {
    // this is nodes eventemitter which ws extends
    //clients -property of wss , set obj , contains all currently connected clients
    clients.set(ws, {
      userId: user.sub,
      username: user.username,
      rooms: new Set(),
      isAlive: true,
      tokens: RATE_LIMIT_CAPACITY, // start with a full bucket
      lastRefill: Date.now(),
    }); //a fresh set per connection

    console.log(`${user.username} connected - sockets:${clients.size}`);
    sendTo(ws, { type: "welcome", userId: user.sub, username: user.username });

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
          case "listRooms":
            sendTo(ws, { type: "rooms", rooms: roomList() });
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
            text: `${state.username} left the room`,
          });
        }
      }
      clients.delete(ws);
      console.log(`${state?.username} disconnected - socket:${clients.size}`);
    });
    ws.on("error", (err) => console.error("socket error:", err.message));
  });

  startHeartbeat(wss);
  return wss;
}
