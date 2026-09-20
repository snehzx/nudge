import http from "http";
import mongoose, { connect } from "mongoose";
import { app } from "./app.ts";
import { setupWebSocket } from "./ws/index.ts";
import { connectDB } from "./db.ts";
import { PORT, SHUTDOWN_TIMEOUT_MS } from "./config/config";
import { clients } from "./ws/registry.ts";

const server = http.createServer(app);
const wss = setupWebSocket(server);

connectDB()
  .then(() => server.listen(PORT, () => console.log("server started")))
  .catch((err) => {
    console.log("mongo connection falied", err);
    process.exit(1);
  });

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return; // this saves from double click ctrl+c
  shuttingDown = true;
  console.log(`${signal} received - shutting down`);

  const force = setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS);
  force.unref();

  server.close();
  for (const ws of clients.keys()) ws.close(1001, "server shutting down");
  await new Promise((r) => setTimeout(r, 500));
  wss.close();
  await mongoose.connection.close();
  console.log("clean shutdown ✅");
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
