import { Hono } from 'hono';
import { errorHandler } from '../middleware/error-handler.middleware.js';
import { authRoutes } from './auth.routes.js';
import { brandRoutes } from './brand.routes.js';
import { carRoutes } from './car.routes.js';
import { cityRoutes } from './city.routes.js';
import { inscriptionRoutes } from './inscription.routes.js';
import { personRoutes } from './person.routes.js';
import { driverRoutes } from './driver.routes.js';
import { routeRoutes } from './route.routes.js';

const app = new Hono().basePath('/api');

app.use('*', errorHandler);

app.get('/health', (c) => {
	return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.route('/auth', authRoutes);
app.route('/', brandRoutes);
app.route('/', cityRoutes);
app.route('/', carRoutes);
app.route('/', personRoutes);
app.route('/', driverRoutes);
app.route('/', routeRoutes);
app.route('/', inscriptionRoutes);

export { app };
