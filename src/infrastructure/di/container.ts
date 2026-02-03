import "reflect-metadata";
import { container } from "tsyringe";
import { withAccelerate } from "@prisma/extension-accelerate";
import { TOKENS } from "./tokens.js";
import { PrismaClient } from "../database/generated/prisma/client.js";
import { PrismaUserRepository } from "../database/repositories/prisma_user.repository.js";
import { ArgonPasswordService } from "../services/argon_password.service.js";
import { ResendEmailService } from "../services/resend_email.service.js";
import { HonoJwtService } from "../services/hono_jwt.service.js";
import { env } from "../config/env.config.js";

const prismaClient = new PrismaClient({
  accelerateUrl: env.DATABASE_URL,
}).$extends(withAccelerate()) as unknown as PrismaClient;

container.registerInstance(TOKENS.PrismaClient, prismaClient);

container.register(TOKENS.UserRepository, { useClass: PrismaUserRepository });
container.register(TOKENS.PasswordService, { useClass: ArgonPasswordService });
container.register(TOKENS.EmailService, { useClass: ResendEmailService });
container.register(TOKENS.JwtService, { useClass: HonoJwtService });

export { container };
