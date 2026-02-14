/**
 * @module container
 * Configures and exports the tsyringe dependency injection container.
 * This is the composition root of the application where all abstract interfaces
 * are bound to their concrete implementations:
 * - Repositories → CachedXRepository decorators wrapping PrismaXRepository (via two-token pattern)
 * - Services → Argon2 (password), Hono (JWT), Resend (email), Upstash (cache)
 * - PrismaClient → Configured instance with Neon serverless adapter
 * - CacheConfig → Per-domain TTL configuration from environment
 *
 * This module also initializes the Prisma client with the Neon PostgreSQL adapter
 * and requires the DATABASE_URL environment variable to be set.
 */

import 'reflect-metadata';
import 'dotenv/config';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import { container } from 'tsyringe';
import { TOKENS, PRISMA_TOKENS } from './tokens.js';
import { PrismaClient } from '../../../infrastructure/database/generated/prisma/client.js';
import { PrismaBrandRepository } from '../../../infrastructure/database/repositories/prisma-brand.repository.js';
import { PrismaCarRepository } from '../../../infrastructure/database/repositories/prisma-car.repository.js';
import { PrismaCityRepository } from '../../../infrastructure/database/repositories/prisma-city.repository.js';
import { PrismaDriverRepository } from '../../../infrastructure/database/repositories/prisma-driver.repository.js';
import { PrismaInscriptionRepository } from '../../../infrastructure/database/repositories/prisma-inscription.repository.js';
import { PrismaModelRepository } from '../../../infrastructure/database/repositories/prisma-model.repository.js';
import { PrismaTravelRepository } from '../../../infrastructure/database/repositories/prisma-travel.repository.js';
import { PrismaColorRepository } from '../../../infrastructure/database/repositories/prisma-color.repository.js';
import { PrismaAuthRepository } from '../../../infrastructure/database/repositories/prisma-auth.repository.js';
import { PrismaUserRepository } from '../../../infrastructure/database/repositories/prisma-user.repository.js';
import { CachedAuthRepository } from '../../../infrastructure/cache/repositories/cached-auth.repository.js';
import { CachedUserRepository } from '../../../infrastructure/cache/repositories/cached-user.repository.js';
import { CachedBrandRepository } from '../../../infrastructure/cache/repositories/cached-brand.repository.js';
import { CachedColorRepository } from '../../../infrastructure/cache/repositories/cached-color.repository.js';
import { CachedCityRepository } from '../../../infrastructure/cache/repositories/cached-city.repository.js';
import { CachedModelRepository } from '../../../infrastructure/cache/repositories/cached-model.repository.js';
import { CachedCarRepository } from '../../../infrastructure/cache/repositories/cached-car.repository.js';
import { CachedDriverRepository } from '../../../infrastructure/cache/repositories/cached-driver.repository.js';
import { CachedTravelRepository } from '../../../infrastructure/cache/repositories/cached-travel.repository.js';
import { CachedInscriptionRepository } from '../../../infrastructure/cache/repositories/cached-inscription.repository.js';
import { UpstashCacheService } from '../../../infrastructure/cache/upstash-cache.service.js';
import { createCacheConfig } from '../../../infrastructure/cache/cache.config.js';
import { ArgonPasswordService } from '../../../infrastructure/services/argon-password.service.js';
import { HonoJwtService } from '../../../infrastructure/services/hono-jwt.service.js';
import { ResendEmailService } from '../../../infrastructure/services/resend-email.service.js';
import { logger } from '../../logging/logger.js';

// Validate required environment variable
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error('DATABASE_URL environment variable is required');
}

// Configure Neon serverless adapter with WebSocket support
neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: databaseUrl });
const prismaClient = new PrismaClient({ adapter });

// Register the PrismaClient singleton instance
container.registerInstance(TOKENS.PrismaClient, prismaClient);

// Register the Logger singleton instance
container.registerInstance(TOKENS.Logger, logger);

// Register cache configuration and service
container.registerInstance(TOKENS.CacheConfig, createCacheConfig());
container.registerSingleton(TOKENS.CacheService, UpstashCacheService);

// Register Prisma repository implementations (PRISMA_TOKENS → raw DB access)
container.register(PRISMA_TOKENS.AuthRepository, { useClass: PrismaAuthRepository });
container.register(PRISMA_TOKENS.UserRepository, { useClass: PrismaUserRepository });
container.register(PRISMA_TOKENS.BrandRepository, { useClass: PrismaBrandRepository });
container.register(PRISMA_TOKENS.CityRepository, { useClass: PrismaCityRepository });
container.register(PRISMA_TOKENS.ModelRepository, { useClass: PrismaModelRepository });
container.register(PRISMA_TOKENS.CarRepository, { useClass: PrismaCarRepository });
container.register(PRISMA_TOKENS.DriverRepository, { useClass: PrismaDriverRepository });
container.register(PRISMA_TOKENS.TravelRepository, { useClass: PrismaTravelRepository });
container.register(PRISMA_TOKENS.InscriptionRepository, { useClass: PrismaInscriptionRepository });
container.register(PRISMA_TOKENS.ColorRepository, { useClass: PrismaColorRepository });

// Register cached repository decorators (TOKENS → cache-aside wrappers)
container.register(TOKENS.AuthRepository, { useClass: CachedAuthRepository });
container.register(TOKENS.UserRepository, { useClass: CachedUserRepository });
container.register(TOKENS.BrandRepository, { useClass: CachedBrandRepository });
container.register(TOKENS.CityRepository, { useClass: CachedCityRepository });
container.register(TOKENS.ModelRepository, { useClass: CachedModelRepository });
container.register(TOKENS.CarRepository, { useClass: CachedCarRepository });
container.register(TOKENS.DriverRepository, { useClass: CachedDriverRepository });
container.register(TOKENS.TravelRepository, { useClass: CachedTravelRepository });
container.register(TOKENS.InscriptionRepository, { useClass: CachedInscriptionRepository });
container.register(TOKENS.ColorRepository, { useClass: CachedColorRepository });

// Register service implementations (Token → concrete service class)
container.register(TOKENS.PasswordService, { useClass: ArgonPasswordService });
container.register(TOKENS.EmailService, { useClass: ResendEmailService });
container.register(TOKENS.JwtService, { useClass: HonoJwtService });

export { container } from 'tsyringe';
