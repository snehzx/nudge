export type StoredMsg = {
  id: string;
  from: string;
  text: string;
  time: number;
  room: string;
};

export type CLientMsg =
  | { type: "join"; name: string }
  | { type: "chat"; room: string; text: string }
  | { type: "ping" }
  | { type: "joinRoom"; room: string }
  | { type: "leaveRoom"; room: string }
  | { type: "listRooms" };

export type ServerMessage =
  | { type: "welcome"; id: string }
  | { type: "joined"; name: string; online: number }
  | { type: "history"; room: string; messages: StoredMsg[] }
  | { type: "system"; room: string; text: string }
  | {
      type: "chat";
      id: string;
      room: string;
      from: string;
      text: string;
      time: number;
    }
  | { type: "error"; message: string }
  | { type: "pong"; time: number }
  | { type: "rooms"; rooms: { name: string; members: number }[] }
  | { type: "roomJoined"; room: string; members: number }
  | { type: "roomLeft"; room: string };

export type ClientState = {
  id: string;
  name: string | null;
  rooms: Set<string>;
};
