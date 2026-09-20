export type StoredMsg = {
  id: string;
  from: string;
  text: string;
  time: number;
  room: string;
};

export type CLientMsg =
  | { type: "chat"; room: string; text: string }
  | { type: "joinRoom"; room: string }
  | { type: "leaveRoom"; room: string }
  | { type: "listRooms" };

export type RoomInfo = { name: string; members: number }[];

export type ServerMessage =
  | { type: "welcome"; userId: string; username: string }
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
  | { type: "error"; message: string; code?: string }
  | { type: "rooms"; rooms: RoomInfo }
  | { type: "roomJoined"; room: string; members: number }
  | { type: "roomLeft"; room: string };

export type ClientState = {
  userId: string;
  username: string | null;
  rooms: Set<string>;
  isAlive: boolean;
  tokens: number;
  lastRefill: number;
};
