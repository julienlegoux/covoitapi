import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/index.js';
import { vpRegister, vpLogin } from './controllers/auth.controller.js';
import { vpListBrands, vpCreateBrand, vpUpdateBrand, vpDeleteBrand } from './controllers/brand.controller.js';
import { vpListCars, vpGetCar, vpCreateCar, vpUpdateCar, vpDeleteCar } from './controllers/car.controller.js';
import {
	vpListPersons, vpGetPerson, vpCreatePerson, vpPatchPerson, vpDeletePerson,
	vpGetPersonTripsDriver, vpGetPersonTripsPassenger,
} from './controllers/person.controller.js';
import {
	vpListTrips, vpGetTrip, vpCreateTrip, vpPatchTrip, vpDeleteTrip,
	vpGetTripPassengers, vpCreateTripInscription,
} from './controllers/trip.controller.js';

const vpRoutes = new Hono();

// Auth (public)
vpRoutes.post('/register', vpRegister);
vpRoutes.post('/login', vpLogin);
//TODO: Check Role for each route
// Persons
vpRoutes.post('/persons', vpCreatePerson);
vpRoutes.get('/persons', authMiddleware, requireRole('USER'), vpListPersons);
vpRoutes.get('/persons/:id', authMiddleware, requireRole('USER'), vpGetPerson);
vpRoutes.patch('/persons/:id', authMiddleware, requireRole('USER'), vpPatchPerson);
vpRoutes.delete('/persons/:id', authMiddleware, requireRole('USER'), vpDeletePerson);
vpRoutes.get('/persons/:id/trips-driver', authMiddleware, requireRole('USER'), vpGetPersonTripsDriver);
vpRoutes.get('/persons/:id/trips-passenger', authMiddleware, requireRole('USER'), vpGetPersonTripsPassenger);

// Brands
vpRoutes.get('/brands', authMiddleware, requireRole('USER'), vpListBrands);
vpRoutes.post('/brands', authMiddleware, requireRole('ADMIN'), vpCreateBrand);
vpRoutes.put('/brands/:id', authMiddleware, requireRole('ADMIN'), vpUpdateBrand);
vpRoutes.delete('/brands/:id', authMiddleware, requireRole('ADMIN'), vpDeleteBrand);

// Cars
vpRoutes.get('/cars', authMiddleware, requireRole('USER'), vpListCars);
vpRoutes.get('/cars/:id', authMiddleware, requireRole('USER'), vpGetCar);
vpRoutes.post('/cars', authMiddleware, requireRole('DRIVER'), vpCreateCar);
vpRoutes.put('/cars/:id', authMiddleware, requireRole('DRIVER'), vpUpdateCar);
vpRoutes.delete('/cars/:id', authMiddleware, requireRole('DRIVER'), vpDeleteCar);

// Trips
vpRoutes.get('/trips', authMiddleware, requireRole('USER'), vpListTrips);
vpRoutes.get('/trips/:id', authMiddleware, requireRole('USER'), vpGetTrip);
vpRoutes.get('/trips/:id/person', authMiddleware, requireRole('USER'), vpGetTripPassengers);
vpRoutes.post('/trips', authMiddleware, requireRole('DRIVER'), vpCreateTrip);
vpRoutes.patch('/trips/:id', authMiddleware, requireRole('DRIVER'), vpPatchTrip);
vpRoutes.delete('/trips/:id', authMiddleware, requireRole('DRIVER'), vpDeleteTrip);
vpRoutes.post('/trips/:id/person', authMiddleware, requireRole('USER'), vpCreateTripInscription);

export { vpRoutes };
