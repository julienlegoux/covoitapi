import { Hono } from 'hono';
import { errorHandler } from '../middleware/error_handler.middleware.js';
import { requestLogger } from '../middleware/request-logger.middleware.js';
import { authRoutes } from './auth.routes.js';

const app = new Hono();

// Middleware order matters: request logger first, then error handler
app.use('*', requestLogger);
app.use('*', errorHandler);

app.route('/auth', authRoutes);

app.get('/health', (c) => {
	return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export { app };
