import "reflect-metadata";
import "dotenv/config";
import { app } from "./presentation/routes/index.js";
import { logger } from "./lib/shared/utils/logger.util.js";
import "./infrastructure/di/container.js";

logger.info("Server initialized", { environment: process.env.NODE_ENV });

export default app;
