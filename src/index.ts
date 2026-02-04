import "reflect-metadata";
import "dotenv/config";
import { serve } from "@hono/node-server";
import { app } from "./presentation/routes/index.js";
import { logger } from "./lib/shared/utils/logger.util.js";
import "./infrastructure/di/container.js";

const port = Number(process.env.PORT);

logger.info(`Starting server on port ${port}`, { environment: process.env.NODE_ENV });

serve({
  fetch: app.fetch,
  port,
});
