import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.ts";
import { notFound, errorHandler } from "./middlewares/error.middleware.ts";
import { CORS_ORIGIN } from "./config/config.ts";
import { onlineCount, roomList, rooms } from "./ws/registry.ts";

export const app = express();

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ ok: true, online: onlineCount(), rooms: roomList() });
});

app.use("/api/v1/auth", authRoutes);

app.use(notFound);
app.use(errorHandler);
