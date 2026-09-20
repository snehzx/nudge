import type { accessPayload } from "../utils/jwt.ts";
export * from "@chat/shared";

declare global {
  namespace Express {
    interface Request {
      user?: accessPayload;
    }
  }
}

export type ClientState = {
  userId: string;
  username: string | null;
  rooms: Set<string>;
  isAlive: boolean;
  tokens: number;
  lastRefill: number;
};

export {};
