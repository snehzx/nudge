export const PORT = Number(process.env.Port ?? 4001);
export const MONGO_URI = process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017";
export const DEFAULT_ROOMS = ["general", "random"];
export const MAX_ROOM_NAME_LENGTH = 24;
