import "reflect-metadata";
import "dotenv/config";
import { Hono } from "hono";
import { app } from "./presentation/routes/index.js";
import { logger } from "./lib/shared/utils/logger.util.js";
import "./infrastructure/di/container.js";

// Required for Vercel to detect this as a Hono app
void Hono;

logger.info("Server initialized", { environment: process.env.NODE_ENV });

export default app;
