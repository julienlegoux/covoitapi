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

// Travel use cases
export { CreateTravelUseCase } from './use-cases/travel/create-travel.use-case.js';
export { DeleteTravelUseCase } from './use-cases/travel/delete-travel.use-case.js';
export { FindTravelUseCase } from './use-cases/travel/find-travel.use-case.js';
export { GetTravelUseCase } from './use-cases/travel/get-travel.use-case.js';
export { ListTravelsUseCase } from './use-cases/travel/list-travels.use-case.js';

// Auth use cases
export { LoginUseCase } from './use-cases/auth/login.use-case.js';
export { RegisterUseCase } from './use-cases/auth/register.use-case.js';
