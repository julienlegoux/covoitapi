import 'reflect-metadata';
import 'dotenv/config';
import { Hono } from 'hono';
import './lib/shared/di/container.js';
import { logger } from './lib/logging/index.js';
import { app } from './presentation/index.js';

// Required for Vercel to detect this as a Hono app
void Hono;

logger.info('Server initialized', { environment: process.env.NODE_ENV });

export default app;
