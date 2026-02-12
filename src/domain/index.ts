/**
 * @module domain
 * Public barrel export for the domain layer.
 * Re-exports all domain entities, repository interfaces, service interfaces,
 * and domain-level error types for use by the application and infrastructure layers.
 */

// Entities
export * from './entities/user.entity.js';
export * from './entities/driver.entity.js';
export * from './entities/travel.entity.js';
export * from './entities/inscription.entity.js';
export * from './entities/city-travel.entity.js';

// Errors
export * from '../lib/errors/domain.errors.js';

// Repositories
export type { UserRepository } from './repositories/user.repository.js';
export type { TravelRepository, TravelFilters } from './repositories/travel.repository.js';

// Services
export type { EmailService, SendEmailOptions } from './services/email.service.js';
export type { JwtPayload, JwtService } from './services/jwt.service.js';
export type { PasswordService } from './services/password.service.js';
