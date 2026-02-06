import { inject, injectable } from 'tsyringe';
import type { CreateUserData, UserEntity } from '../../../domain/entities/user.entity.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

@injectable()
export class PrismaUserRepository implements UserRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	async findById(id: string): Promise<Result<UserEntity | null, DatabaseError>> {
		try {
			const user = await this.prisma.user.findUnique({
				where: { id },
			});
			return ok(user);
		} catch (e) {
			return err(new DatabaseError('Failed to find user by id', e));
		}
	}

	async findByEmail(email: string): Promise<Result<UserEntity | null, DatabaseError>> {
		try {
			const user = await this.prisma.user.findUnique({
				where: { email },
			});
			return ok(user);
		} catch (e) {
			return err(new DatabaseError('Failed to find user by email', e));
		}
	}

	async create(data: CreateUserData): Promise<Result<UserEntity, DatabaseError>> {
		try {
			const user = await this.prisma.user.create({
				data: {
					email: data.email,
					password: data.password,
					firstName: data.firstName,
					lastName: data.lastName,
					phone: data.phone,
				},
			});
			return ok(user);
		} catch (e) {
			return err(new DatabaseError('Failed to create user', e));
		}
	}

	async existsByEmail(email: string): Promise<Result<boolean, DatabaseError>> {
		try {
			const count = await this.prisma.user.count({
				where: { email },
			});
			return ok(count > 0);
		} catch (e) {
			return err(new DatabaseError('Failed to check if user exists', e));
		}
	}
}
