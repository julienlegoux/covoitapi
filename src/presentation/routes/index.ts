import { Hono } from "hono";
import { authRoutes } from "./auth.routes.js";
import { errorHandler } from "../middleware/error_handler.middleware.js";

const app = new Hono();

app.use("*", errorHandler);

app.route("/auth", authRoutes);

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

export { app };
