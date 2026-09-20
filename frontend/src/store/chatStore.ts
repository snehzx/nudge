import { create } from "zustand";
import type {
  CLientMsg,
  ServerMessage,
  StoredMsg,
  RoomInfo,
} from "@chat/shared";
import { api } from "../lib/api";
import { useAuthStore } from "./authStore";

type Status = "idle" | "connecing" | "open" | "closed"; // am i connected in be - clients map-who's connected

type chatState = {
  status: Status;
  rooms: RoomInfo;
  joined: string[];
  messages: Record<string, StoredMsg[]>;
  error: string | null;

  connect: () => void;
  disconnect: () => void;
  send: (msg: CLientMsg) => void;
};

//module-lvl - not state cuz nothing renders from them
let ws: WebSocket | null = null;
let retryDelay = 500;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let intentionalCLose = false;

export const useChatStore = create<chatState>((set, get) => ({
  status: "idle",
  rooms: [],
  joined: [],
  messages: {},
  error: null,

  connect: () => {
    if (ws) return; //in strict mode react opens two connections , so dont open sec socket
    const token = useAuthStore.getState().token;
    if (!token) return; //this token goes in query as brower cant set custom headers on ws

    intentionalCLose = false;
    set({ status: "connecing" });

    ws = new WebSocket(`${import.meta.env.VITE_WS_URL}?token=${token} `); // brower built in
    ws.onopen = () => {
      retryDelay = 500;
      set({ status: "open", error: null }); // this is what makes the ui change nothing tells react anything happened
    };
    ws.onmessage = (e) => {
      const msg: ServerMessage = JSON.parse(e.data);

      switch (msg.type) {
        case "rooms":
          set({ rooms: msg.rooms });
          break;
        case "roomJoined":
          set((s) => ({
            joined: [...new Set([...s.joined, msg.room])], //.. removes duplicate in case u somehow join twice
          }));
          break;
        case "roomLeft":
          set((s) => ({ joined: s.joined.filter((r) => r !== msg.room) }));
          break;
        case "history":
          set((s) => ({
            messages: { ...s.messages, [msg.room]: msg.messages }, //react and zustand detect change by comparing obj identity , if no ... it means same obj and no re-render
          }));
          break;
        case "chat":
          set((s) => ({
            messages: {
              ...s.messages,
              [msg.room]: [...(s.messages[msg.room] ?? []), msg],
            },
          }));
          break;
        case "system":
          set((s) => ({
            messages: {
              ...s.messages,
              [msg.room]: [
                ...(s.messages[msg.room] ?? []),
                {
                  id: crypto.randomUUID(),
                  room: msg.room,
                  from: "system",
                  text: msg.text,
                  time: Date.now(),
                },
              ],
            },
          }));
          break;
        case "error":
          set({ error: msg.message });
          break;
      }
    };
    ws.onclose = async () => {
      ws = null;
      set({ status: "closed" });
      if (intentionalCLose) return;

      //token may have expired while we were connected
      try {
        const r = await api.post("/auth/refresh");
        useAuthStore.getState().setToken(r.data.data.accessToken);
      } catch (error) {
        useAuthStore.getState().clear();
        return; // session dead stop reconncting
      }
      retryTimer = setTimeout(() => get().connect(), retryDelay);
      retryDelay = Math.min(retryDelay * 2, 10_000);
    };
    ws.onerror = () => ws?.close();
  },

  disconnect: () => {
    intentionalCLose = true;
    if (retryTimer) clearTimeout(retryTimer);
    ws?.close();
    ws = null;
    set({ status: "idle", rooms: [], joined: [], messages: {} });
  },

  send: (msg) => {
    if (ws?.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(msg));
  },
}));
