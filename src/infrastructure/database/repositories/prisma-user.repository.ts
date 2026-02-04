import { inject, injectable } from "tsyringe";
import type {
  CreateUserData,
  UserEntity,
} from "../../../domain/entities/user.entity.js";
import type { UserRepository } from "../../../domain/repositories/user.repository.js";
import { TOKENS } from "../../../lib/shared/di/tokens.js";
import type { PrismaClient } from "../generated/prisma/client.js";

@injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(
    @inject(TOKENS.PrismaClient)
    private readonly prisma: PrismaClient
  ) {}

  async findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });
    return count > 0;
  }
}
