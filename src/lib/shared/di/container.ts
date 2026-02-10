import 'reflect-metadata';
import 'dotenv/config';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import { container } from 'tsyringe';
import { TOKENS } from './tokens.js';
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
import { ArgonPasswordService } from '../../../infrastructure/services/argon-password.service.js';
import { HonoJwtService } from '../../../infrastructure/services/hono-jwt.service.js';
import { ResendEmailService } from '../../../infrastructure/services/resend-email.service.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error('DATABASE_URL environment variable is required');
}

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: databaseUrl });
const prismaClient = new PrismaClient({ adapter });

container.registerInstance(TOKENS.PrismaClient, prismaClient);

container.register(TOKENS.AuthRepository, { useClass: PrismaAuthRepository });
container.register(TOKENS.UserRepository, { useClass: PrismaUserRepository });
container.register(TOKENS.BrandRepository, { useClass: PrismaBrandRepository });
container.register(TOKENS.CityRepository, { useClass: PrismaCityRepository });
container.register(TOKENS.ModelRepository, { useClass: PrismaModelRepository });
container.register(TOKENS.CarRepository, { useClass: PrismaCarRepository });
container.register(TOKENS.DriverRepository, { useClass: PrismaDriverRepository });
container.register(TOKENS.TravelRepository, { useClass: PrismaTravelRepository });
container.register(TOKENS.InscriptionRepository, { useClass: PrismaInscriptionRepository });
container.register(TOKENS.ColorRepository, { useClass: PrismaColorRepository });
container.register(TOKENS.PasswordService, { useClass: ArgonPasswordService });
container.register(TOKENS.EmailService, { useClass: ResendEmailService });
container.register(TOKENS.JwtService, { useClass: HonoJwtService });

export { container };
