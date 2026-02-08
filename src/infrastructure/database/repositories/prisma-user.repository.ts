import crypto from 'node:crypto';
import { inject, injectable } from 'tsyringe';
import type { CreateUserData, PublicUserEntity, UpdateUserData, UserEntity } from '../../../domain/entities/user.entity.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { $Enums } from '../generated/prisma/client.js';

@injectable()
export class PrismaUserRepository implements UserRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	async findAll(): Promise<Result<PublicUserEntity[], DatabaseError>> {
		try {
			const users = await this.prisma.user.findMany({
				omit: { password: true },
			});
			return ok(users);
		} catch (e) {
			return err(new DatabaseError('Failed to find all users', e));
		}
	}

	async findById(id: string): Promise<Result<PublicUserEntity | null, DatabaseError>> {
		try {
			const user = await this.prisma.user.findUnique({
				where: { id },
				omit: { password: true },
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

	async create(data: CreateUserData): Promise<Result<PublicUserEntity, DatabaseError>> {
		try {
			const user = await this.prisma.user.create({
				data: {
					email: data.email,
					password: data.password,
					firstName: data.firstName,
					lastName: data.lastName,
					phone: data.phone,
				},
				omit: { password: true },
			});
			return ok(user);
		} catch (e) {
			return err(new DatabaseError('Failed to create user', e));
		}
	}

	async update(id: string, data: UpdateUserData): Promise<Result<PublicUserEntity, DatabaseError>> {
		try {
			const user = await this.prisma.user.update({
				where: { id },
				data,
				omit: { password: true },
			});
			return ok(user);
		} catch (e) {
			return err(new DatabaseError('Failed to update user', e));
		}
	}

	async updateRole(id: string, role: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.user.update({
				where: { id },
				data: { role: role as $Enums.Role },
			});
			return ok(undefined);
		} catch (e) {
			return err(new DatabaseError('Failed to update user role', e));
		}
	}

	async delete(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.user.delete({
				where: { id },
			});
			return ok(undefined);
		} catch (e) {
			return err(new DatabaseError('Failed to delete user', e));
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

	async anonymize(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.$transaction(async (tx) => {
				// 1. Anonymize user
				await tx.user.update({
					where: { id },
					data: {
						email: `deleted-${crypto.randomUUID()}@anonymized.local`,
						firstName: null,
						lastName: null,
						phone: null,
						password: crypto.randomUUID(),
						anonymizedAt: new Date(),
					},
				});

				// 2. Anonymize driver if exists
				await tx.driver.updateMany({
					where: { userId: id },
					data: {
						driverLicense: `ANONYMIZED-${crypto.randomUUID()}`,
						anonymizedAt: new Date(),
					},
				});

				// 3. Mark inscriptions as ANONYMIZED
				await tx.inscription.updateMany({
					where: { userId: id },
					data: { status: 'ANONYMIZED' },
				});
			});
			return ok(undefined);
		} catch (e) {
			return err(new DatabaseError('Failed to anonymize user', e));
		}
	}
}
