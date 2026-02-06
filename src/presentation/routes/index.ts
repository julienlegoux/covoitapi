import { Hono } from 'hono';
import { errorHandler } from '../middleware/error-handler.middleware.js';
import { authRoutes } from './auth.routes.js';

const app = new Hono();

app.use('*', errorHandler);

app.route('/auth', authRoutes);

app.get('/health', (c) => {
	return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export { app };
