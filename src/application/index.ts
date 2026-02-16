/**
 * @module Application
 *
 * Public barrel file for the application layer. Re-exports all use-case
 * classes so that the presentation layer (controllers/routes) can import
 * them from a single entry point without reaching into individual
 * use-case directories.
 *
 * The application layer sits between the domain and presentation layers
 * in the Clean Architecture stack and contains all business logic
 * orchestration (use cases).
 */

// Trip use cases
export { CreateTripUseCase } from './use-cases/trip/create-trip.use-case.js';
export { DeleteTripUseCase } from './use-cases/trip/delete-trip.use-case.js';
export { FindTripUseCase } from './use-cases/trip/find-trip.use-case.js';
export { GetTripUseCase } from './use-cases/trip/get-trip.use-case.js';
export { ListTripsUseCase } from './use-cases/trip/list-trips.use-case.js';

// Auth use cases
export { LoginUseCase } from './use-cases/auth/login.use-case.js';
export { RegisterUseCase } from './use-cases/auth/register.use-case.js';
