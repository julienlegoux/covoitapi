/**
 * @module infrastructure
 * Barrel export for the infrastructure layer.
 * Re-exports Prisma repository implementations and service adapters
 * so that the DI container and other layers can import from a single entry point
 * without depending on internal file paths.
 */

// Repositories - Prisma implementations of domain repository interfaces
export { PrismaUserRepository } from './database/repositories/prisma-user.repository.js';
export { PrismaTripRepository } from './database/repositories/prisma-trip.repository.js';

// Services - Concrete implementations of domain service interfaces
export { ArgonPasswordService } from './services/argon-password.service.js';
export { HonoJwtService } from './services/hono-jwt.service.js';
export { ResendEmailService } from './services/resend-email.service.js';
