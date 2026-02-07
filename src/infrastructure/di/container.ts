import 'reflect-metadata';
import 'dotenv/config';
import { withAccelerate } from '@prisma/extension-accelerate';
import { container } from 'tsyringe';
import { TOKENS } from '../../lib/shared/di/tokens.js';
import { PrismaClient } from '../database/generated/prisma/client.js';
import { PrismaBrandRepository } from '../database/repositories/prisma-brand.repository.js';
import { PrismaCarRepository } from '../database/repositories/prisma-car.repository.js';
import { PrismaCityRepository } from '../database/repositories/prisma-city.repository.js';
import { PrismaColorRepository } from '../database/repositories/prisma-color.repository.js';
import { PrismaDriverRepository } from '../database/repositories/prisma-driver.repository.js';
import { PrismaInscriptionRepository } from '../database/repositories/prisma-inscription.repository.js';
import { PrismaModelRepository } from '../database/repositories/prisma-model.repository.js';
import { PrismaRouteRepository } from '../database/repositories/prisma-route.repository.js';
import { PrismaUserRepository } from '../database/repositories/prisma-user.repository.js';
import { ArgonPasswordService } from '../services/argon-password.service.js';
import { HonoJwtService } from '../services/hono-jwt.service.js';
import { ResendEmailService } from '../services/resend-email.service.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error('DATABASE_URL environment variable is required');
}

const prismaClient = new PrismaClient({
	accelerateUrl: databaseUrl,
}).$extends(withAccelerate());

container.registerInstance(TOKENS.PrismaClient, prismaClient);

container.register(TOKENS.UserRepository, { useClass: PrismaUserRepository });
container.register(TOKENS.BrandRepository, { useClass: PrismaBrandRepository });
container.register(TOKENS.ColorRepository, { useClass: PrismaColorRepository });
container.register(TOKENS.CityRepository, { useClass: PrismaCityRepository });
container.register(TOKENS.ModelRepository, { useClass: PrismaModelRepository });
container.register(TOKENS.CarRepository, { useClass: PrismaCarRepository });
container.register(TOKENS.DriverRepository, { useClass: PrismaDriverRepository });
container.register(TOKENS.RouteRepository, { useClass: PrismaRouteRepository });
container.register(TOKENS.InscriptionRepository, { useClass: PrismaInscriptionRepository });
container.register(TOKENS.PasswordService, { useClass: ArgonPasswordService });
container.register(TOKENS.EmailService, { useClass: ResendEmailService });
container.register(TOKENS.JwtService, { useClass: HonoJwtService });

export { container };
