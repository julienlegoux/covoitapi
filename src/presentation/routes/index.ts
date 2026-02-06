import { Hono } from 'hono';
import { errorHandler } from '../middleware/error-handler.middleware.js';
import { authRoutes } from './auth.routes.js';
import { brandRoutes } from './brand.routes.js';
import { carRoutes } from './car.routes.js';
import { cityRoutes } from './city.routes.js';
import { inscriptionRoutes } from './inscription.routes.js';
import { personRoutes } from './person.routes.js';
import { routeRoutes } from './route.routes.js';

const app = new Hono();

app.use('*', errorHandler);

app.route('/auth', authRoutes);
app.route('/', brandRoutes);
app.route('/', cityRoutes);
app.route('/', carRoutes);
app.route('/', personRoutes);
app.route('/', routeRoutes);
app.route('/', inscriptionRoutes);

app.get('/health', (c) => {
	return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export { app };
