import "reflect-metadata";
import { serve } from "@hono/node-server";
import { app } from "./presentation/routes/index.js";
import { env } from "./infrastructure/config/env.config.js";
import { logger } from "./shared/utils/logger.util.js";
import "./infrastructure/di/container.js";

const port = env.PORT;

logger.info(`Starting server on port ${port}`, { environment: env.NODE_ENV });

serve({
  fetch: app.fetch,
  port,
});

logger.info(`Server running at http://localhost:${port}`);
