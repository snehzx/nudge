import { WebSocket } from "ws";
import { DEFAULT_ROOMS } from "../config/config";
import type { ClientState, ServerMessage } from "../types/types";

export const clients = new Map<WebSocket, ClientState>();
export const rooms = new Map<string, Set<WebSocket>>();

for (const name of DEFAULT_ROOMS) {
  rooms.set(name, new Set());
}

export function sendTo(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

export function broadcastToRoom(
  room: string,
  msg: ServerMessage,
  except?: WebSocket,
) {
  const members = rooms.get(room);
  if (!members) return;

  const data = JSON.stringify(msg);
  for (const client of members) {
    if (client === except) continue;
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(data);
  }
}

export function addToRoom(room: string, ws: WebSocket, state: ClientState) {
  if (!rooms.has(room)) {
    rooms.set(room, new Set()); //custom room created on demand
  }
  rooms.get(room)!.add(ws); // both sides updated together
  state.rooms.add(room);
}

export function removeFromRoom(
  room: string,
  ws: WebSocket,
  state: ClientState,
) {
  const members = rooms.get(room);

  if (members) {
    members.delete(ws);
  }
  //this default checks make sure default room dont get deleted even if there are no members
  if (members!.size === 0 && !DEFAULT_ROOMS.includes(room)) {
    rooms.delete(room);
    console.log("room deleted");
  }
  state.rooms.delete(room); //it is necessary to from from state too cuz it holds the name and wont go unless updated
}

export function roomList() {
  return [...rooms.entries()].map(([name, members]) => ({
    name,
    members: members.size,
  }));
}

export function onlineCount() {
  let n = 0;
  for (const s of clients.values()) if (s.username) n++;
  return n;
}

export function isNameTaken(name: string) {
  return [...clients.values()].some(
    (s) => s.username?.toLowerCase() === name.toLowerCase(),
  );
}
