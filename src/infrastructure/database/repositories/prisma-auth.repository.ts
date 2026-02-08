import crypto from 'node:crypto';
import { inject, injectable } from 'tsyringe';
import type { AuthEntity, CreateAuthData } from '../../../domain/entities/auth.entity.js';
import type { CreateUserData, PublicUserEntity } from '../../../domain/entities/user.entity.js';
import type { AuthRepository } from '../../../domain/repositories/auth.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { $Enums } from '../generated/prisma/client.js';

@injectable()
export class PrismaAuthRepository implements AuthRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	async findByEmail(email: string): Promise<Result<AuthEntity | null, DatabaseError>> {
		try {
			const auth = await this.prisma.auth.findUnique({
				where: { email },
			});
			return ok(auth);
		} catch (e) {
			return err(new DatabaseError('Failed to find auth by email', e));
		}
	}

	async createWithUser(
		authData: CreateAuthData,
		userData: Omit<CreateUserData, 'authRefId'>,
	): Promise<Result<{ auth: AuthEntity; user: PublicUserEntity }, DatabaseError>> {
		try {
			const result = await this.prisma.$transaction(async (tx) => {
				const auth = await tx.auth.create({
					data: {
						email: authData.email,
						password: authData.password,
					},
				});

				const user = await tx.user.create({
					data: {
						firstName: userData.firstName,
						lastName: userData.lastName,
						phone: userData.phone,
						authRefId: auth.refId,
					},
				});

				return {
					auth,
					user: { ...user, email: auth.email },
				};
			});
			return ok(result);
		} catch (e) {
			return err(new DatabaseError('Failed to create auth with user', e));
		}
	}

	async existsByEmail(email: string): Promise<Result<boolean, DatabaseError>> {
		try {
			const count = await this.prisma.auth.count({
				where: { email },
			});
			return ok(count > 0);
		} catch (e) {
			return err(new DatabaseError('Failed to check if auth exists', e));
		}
	}

	async updateRole(refId: number, role: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.auth.update({
				where: { refId },
				data: { role: role as $Enums.Role },
			});
			return ok(undefined);
		} catch (e) {
			return err(new DatabaseError('Failed to update auth role', e));
		}
	}
}
