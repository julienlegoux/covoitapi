import crypto from 'node:crypto';
import { inject, injectable } from 'tsyringe';
import type { CreateUserData, PublicUserEntity, UpdateUserData } from '../../../domain/entities/user.entity.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

@injectable()
export class PrismaUserRepository implements UserRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	async findAll(): Promise<Result<PublicUserEntity[], DatabaseError>> {
		try {
			const users = await this.prisma.user.findMany({
				include: { auth: { select: { email: true } } },
			});
			return ok(users.map((u) => ({ ...u, email: u.auth.email })));
		} catch (e) {
			return err(new DatabaseError('Failed to find all users', e));
		}
	}

	async findById(id: string): Promise<Result<PublicUserEntity | null, DatabaseError>> {
		try {
			const user = await this.prisma.user.findUnique({
				where: { id },
				include: { auth: { select: { email: true } } },
			});
			if (!user) return ok(null);
			return ok({ ...user, email: user.auth.email });
		} catch (e) {
			return err(new DatabaseError('Failed to find user by id', e));
		}
	}

	async findByAuthRefId(authRefId: number): Promise<Result<PublicUserEntity | null, DatabaseError>> {
		try {
			const user = await this.prisma.user.findUnique({
				where: { authRefId },
				include: { auth: { select: { email: true } } },
			});
			if (!user) return ok(null);
			return ok({ ...user, email: user.auth.email });
		} catch (e) {
			return err(new DatabaseError('Failed to find user by auth ref id', e));
		}
	}

	async create(data: CreateUserData): Promise<Result<PublicUserEntity, DatabaseError>> {
		try {
			const user = await this.prisma.user.create({
				data: {
					firstName: data.firstName,
					lastName: data.lastName,
					phone: data.phone,
					authRefId: data.authRefId,
				},
				include: { auth: { select: { email: true } } },
			});
			return ok({ ...user, email: user.auth.email });
		} catch (e) {
			return err(new DatabaseError('Failed to create user', e));
		}
	}

	async update(id: string, data: UpdateUserData): Promise<Result<PublicUserEntity, DatabaseError>> {
		try {
			const user = await this.prisma.user.update({
				where: { id },
				data,
				include: { auth: { select: { email: true } } },
			});
			return ok({ ...user, email: user.auth.email });
		} catch (e) {
			return err(new DatabaseError('Failed to update user', e));
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

	async anonymize(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.$transaction(async (tx) => {
				const user = await tx.user.findUniqueOrThrow({
					where: { id },
				});

				// 1. Anonymize auth (email, password)
				await tx.auth.update({
					where: { refId: user.authRefId },
					data: {
						email: `deleted-${crypto.randomUUID()}@anonymized.local`,
						password: crypto.randomUUID(),
						anonymizedAt: new Date(),
					},
				});

				// 2. Anonymize user profile
				await tx.user.update({
					where: { id },
					data: {
						firstName: null,
						lastName: null,
						phone: null,
						anonymizedAt: new Date(),
					},
				});

				// 3. Anonymize driver if exists
				await tx.driver.updateMany({
					where: { userRefId: user.refId },
					data: {
						driverLicense: `ANONYMIZED-${crypto.randomUUID()}`,
						anonymizedAt: new Date(),
					},
				});

				// 4. Mark inscriptions as ANONYMIZED
				await tx.inscription.updateMany({
					where: { userRefId: user.refId },
					data: { status: 'ANONYMIZED' },
				});
			});
			return ok(undefined);
		} catch (e) {
			return err(new DatabaseError('Failed to anonymize user', e));
		}
	}
}
