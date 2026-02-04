import 'reflect-metadata';
import { withAccelerate } from '@prisma/extension-accelerate';
import { container } from 'tsyringe';
import { PrismaClient } from '../database/generated/prisma/client.js';
import { PrismaUserRepository } from '../database/repositories/prisma_user.repository.js';
import { ArgonPasswordService } from '../services/argon_password.service.js';
import { HonoJwtService } from '../services/hono_jwt.service.js';
import { ResendEmailService } from '../services/resend_email.service.js';
import { TOKENS } from './tokens.js';
import 'dotenv/config';

const prismaClient = new PrismaClient({
	accelerateUrl: process.env.DATABASE_URL!,
}).$extends(withAccelerate());

container.registerInstance(TOKENS.PrismaClient, prismaClient);

container.register(TOKENS.UserRepository, { useClass: PrismaUserRepository });
container.register(TOKENS.PasswordService, { useClass: ArgonPasswordService });
container.register(TOKENS.EmailService, { useClass: ResendEmailService });
container.register(TOKENS.JwtService, { useClass: HonoJwtService });

export { container };
