import { WebSocket } from "ws";
import { Message } from "../models/message.models";
import {
  rooms,
  sendTo,
  broadcastToRoom,
  addToRoom,
  removeFromRoom,
} from "./registry.ts";

import {
  HISTORY_LIMIT,
  MAX_ROOM_NAME_LENGTH,
  MAX_TEXT_LENGTH,
} from "../config/config.ts";

import type { ClientState, CLientMsg, StoredMsg } from "../types/types.ts";

//validation

export function cleanRoomName(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const room = v.trim().toLowerCase().slice(0, MAX_ROOM_NAME_LENGTH);
  if (!/^[a-z0-9-_]{2,}$/.test(room)) return null;
  return room;
}

export function parsedMsg(raw: string): CLientMsg | null {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const m = data as Record<string, unknown>;
  if (m.type === "listRooms") return { type: "listRooms" };
  if (m.type === "joinRoom" || m.type === "leaveRoom") {
    const room = cleanRoomName(m.room);
    if (!room) return null;
    return { type: m.type, room };
  }

  if (m.type === "chat") {
    const room = cleanRoomName(m.room);
    if (!room) return null;
    if (typeof m.text !== "string") return null;
    const text = m.text.trim().slice(0, MAX_TEXT_LENGTH);
    if (!text) return null;
    return { type: m.type, room, text };
  }
  return null;
}

//data fetching

async function getHistory(room: string): Promise<StoredMsg[]> {
  const docs = await Message.find({ room })
    .sort({ createdAt: -1 })
    .limit(HISTORY_LIMIT)
    .populate<{ from: { username: string } }>("from", "username")
    .lean(); // used for read-only when we do not want to change the data and senx back again in datasets

  return docs
    .map((d) => ({
      id: d._id.toString(),
      room: d.room,
      from: d.from?.username ?? "deleted user",
      text: d.text,
      time: new Date(d.createdAt).getTime(),
    }))
    .reverse();
}

export async function handleJoinRoom(
  ws: WebSocket,
  state: ClientState,
  room: string,
) {
  if (state.rooms.has(room)) {
    sendTo(ws, { type: "error", message: "already in that room" });
    return;
  }
  const isNew = !rooms.has(room);
  addToRoom(room, ws, state);
  if (isNew) console.log(`room ${room} created by ${state.username}`);

  sendTo(ws, { type: "roomJoined", room, members: rooms.get(room)!.size });
  sendTo(ws, { type: "history", room, messages: await getHistory(room) });
  broadcastToRoom(
    room,
    { type: "system", room, text: `${state.username} joined` },
    ws,
  );
}

export async function handleLeaveRoom(
  ws: WebSocket,
  state: ClientState,
  room: string,
) {
  if (!state.rooms.has(room)) {
    sendTo(ws, { type: "error", message: "not in that room" });
    return;
  }
  removeFromRoom(room, ws, state);
  sendTo(ws, { type: "roomLeft", room });
  broadcastToRoom(room, {
    type: "system",
    room,
    text: `${state.username} left the room`,
  });
}

export async function handleChat(
  ws: WebSocket,
  state: ClientState,
  room: string,
  text: string,
) {
  if (!state.rooms.has(room)) {
    sendTo(ws, { type: "error", message: "not in that room" });
    return;
  }
  const doc = await Message.create({ from: state.userId, text, room });

  broadcastToRoom(room, {
    type: "chat",
    id: doc._id.toString(),
    room,
    from: state.username!, // from state never from the message
    text: doc.text,
    time: doc.createdAt.getTime(),
  });
}
