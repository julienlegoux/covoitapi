/**
 * @module prisma-auth.repository
 * Prisma-backed implementation of the {@link AuthRepository} domain interface.
 * Handles authentication record persistence including transactional user creation
 * during registration. Uses Neon PostgreSQL via Prisma ORM.
 */

import { inject, injectable } from 'tsyringe';
import type { AuthEntity, CreateAuthData } from '../../../domain/entities/auth.entity.js';
import type { CreateUserData, PublicUserEntity } from '../../../domain/entities/user.entity.js';
import type { AuthRepository } from '../../../domain/repositories/auth.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient, $Enums } from '../generated/prisma/client.js';

/**
 * Prisma implementation of {@link AuthRepository}.
 * Manages authentication entities (email, hashed password, role) in the `auth` table.
 * Injected via tsyringe with the PrismaClient token.
 */
@injectable()
export class PrismaAuthRepository implements AuthRepository {
	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
	) {}

	/**
	 * Finds an authentication record by its unique email address.
	 * @param email - The email to look up.
	 * @returns `ok(AuthEntity)` if found, `ok(null)` if not found,
	 *          or `err(DatabaseError)` if the query fails.
	 */
	async findByEmail(email: string): Promise<Result<AuthEntity | null, DatabaseError>> {
		try {
			// Prisma findUnique on the email unique index
			const auth = await this.prisma.auth.findUnique({
				where: { email },
			});
			return ok(auth);
		} catch (e) {
			return err(new DatabaseError('Failed to find auth by email', e));
		}
	}

	/**
	 * Creates an Auth record and its associated User profile within a single
	 * Prisma interactive transaction. This ensures atomicity during registration:
	 * if user creation fails, the auth record is rolled back.
	 * @param authData - Email and hashed password for the auth record.
	 * @param userData - First name, last name, and phone for the user profile.
	 * @returns `ok({ auth, user })` on success where user includes the email
	 *          from the auth join (PublicUserEntity), or `err(DatabaseError)` on failure.
	 */
	async createWithUser(
		authData: CreateAuthData,
		userData: Omit<CreateUserData, 'authRefId'>,
	): Promise<Result<{ auth: AuthEntity; user: PublicUserEntity }, DatabaseError>> {
		try {
			// Interactive transaction: auth and user are created atomically
			const result = await this.prisma.$transaction(async (tx) => {
				const auth = await tx.auth.create({
					data: {
						email: authData.email,
						password: authData.password,
					},
				});

				// Link user to auth via the auto-incremented refId foreign key
				const user = await tx.user.create({
					data: {
						firstName: userData.firstName,
						lastName: userData.lastName,
						phone: userData.phone,
						authRefId: auth.refId,
					},
				});

				// Merge email from auth into the user to form PublicUserEntity
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

	/**
	 * Checks whether an authentication record exists for the given email.
	 * Uses a count query for efficiency rather than fetching the full record.
	 * @param email - The email address to check.
	 * @returns `ok(true)` if the email is taken, `ok(false)` otherwise,
	 *          or `err(DatabaseError)` on failure.
	 */
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

	/**
	 * Updates the role of an auth record identified by its integer refId.
	 * The role string is cast to the Prisma-generated Role enum type.
	 * @param refId - The integer auto-incremented reference ID of the auth record.
	 * @param role - The new role string (e.g. "USER", "ADMIN", "DRIVER").
	 * @returns `ok(undefined)` on success, or `err(DatabaseError)` on failure.
	 */
	async updateRole(refId: number, role: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.auth.update({
				// Locate by refId (int unique key) rather than UUID
				where: { refId },
				data: { role: role as $Enums.Role },
			});
			return ok(undefined);
		} catch (e) {
			return err(new DatabaseError('Failed to update auth role', e));
		}
	}
}
