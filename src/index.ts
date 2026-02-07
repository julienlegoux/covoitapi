import 'reflect-metadata';
import 'dotenv/config';
import { Hono } from 'hono';
import './lib/shared/di/container.js';
import { logger } from './lib/shared/utils/logger.util.js';
import { app } from './presentation/routes/index.js';

// Required for Vercel to detect this as a Hono app
void Hono;

logger.info('Server initialized', { environment: process.env.NODE_ENV });

export default app;
