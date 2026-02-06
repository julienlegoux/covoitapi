import 'reflect-metadata';
import 'dotenv/config';
import { withAccelerate } from '@prisma/extension-accelerate';
import { container } from 'tsyringe';
import { TOKENS } from '../../lib/shared/di/tokens.js';
import { PrismaClient } from '../database/generated/prisma/client.js';
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
container.register(TOKENS.PasswordService, { useClass: ArgonPasswordService });
container.register(TOKENS.EmailService, { useClass: ResendEmailService });
container.register(TOKENS.JwtService, { useClass: HonoJwtService });

export { container };
