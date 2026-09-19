import {
  RATE_LIMIT_CAPACITY,
  RATE_LIMIT_REFILL_PER_SEC,
} from "../config/config.ts";
import type { ClientState } from "../types/types.ts";

export function consumeToken(state: ClientState): boolean {
  const now = Date.now();
  const elapsedSec = (now - state.lastRefill) / 1000;

  //refill based on time passed , capped by capacity
  state.tokens = Math.min(
    RATE_LIMIT_CAPACITY,
    state.tokens + elapsedSec * RATE_LIMIT_REFILL_PER_SEC,
  );
  state.lastRefill = now;
  if (state.tokens < 1) return false; //empty bucket - reject

  state.tokens -= 1;
  return true;
}
