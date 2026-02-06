import 'reflect-metadata';
import 'dotenv/config';
import { handle } from 'hono/vercel';
import './infrastructure/di/container.js';
import { logger } from './lib/shared/utils/logger.util.js';
import { app } from './presentation/routes/index.js';

logger.info('Server initialized', { environment: process.env.NODE_ENV });

export default handle(app);
